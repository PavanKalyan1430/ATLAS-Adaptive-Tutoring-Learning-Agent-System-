from langgraph.graph import StateGraph, END
from skillforge.app.agents.state import SkillForgeState
from skillforge.app.agents.diagnostic_agent import diagnostic_agent
from skillforge.app.agents.planner_agent import planner_agent
from skillforge.app.agents.retrieval_agent import retrieval_agent
from skillforge.app.agents.evaluation_agent import EvaluationAgent
from skillforge.app.agents.intervention_agent import intervention_agent
from skillforge.app.services.llm import LLMService
import logging

logger = logging.getLogger("SkillForge.Orchestrator")

class SkillForgeOrchestrator:
    """
    SkillForge LangGraph Orchestrator.
    Wires and compiles the stateful graph representing the study & evaluation loop:
    Submit Answer -> Evaluate -> Intervene -> (Advance OR Re-route) -> Retrieve RAG Resources -> End
    """
    def __init__(self, llm_service: LLMService):
        self.evaluation_agent = EvaluationAgent(llm_service)
        self.workflow = StateGraph(SkillForgeState)
        self._build_graph()

    def _build_graph(self):
        # 1. Register Nodes
        self.workflow.add_node("evaluate", self._evaluate_node)
        self.workflow.add_node("intervene", self._intervene_node)
        self.workflow.add_node("reroute", self._reroute_node)
        self.workflow.add_node("advance", self._advance_node)
        self.workflow.add_node("retrieve", self._retrieve_node)

        # 2. Define Entry Point
        self.workflow.set_entry_point("evaluate")

        # 3. Define Standard Transitions
        self.workflow.add_edge("evaluate", "intervene")
        
        # 4. Define Conditional Branching
        self.workflow.add_conditional_edges(
            "intervene",
            self._route_after_intervention,
            {
                "reroute": "reroute",
                "advance": "advance"
            }
        )

        self.workflow.add_edge("reroute", "retrieve")
        self.workflow.add_edge("advance", "retrieve")
        self.workflow.add_edge("retrieve", END)

        # 5. Compile the Workflow State Machine
        self.app = self.workflow.compile()
        logger.info("✅ SkillForge LangGraph Orchestrator compiled successfully!")

    # ==========================================
    # Nodes Implementations
    # ==========================================

    def _evaluate_node(self, state: SkillForgeState) -> dict:
        """Agent Node: Grades student answer and identifies misconceptions."""
        eval_result = self.evaluation_agent.evaluate_submission(state)
        # Log to PostgreSQL asynchronously (fire and forget in this thread)
        import asyncio
        loop = asyncio.get_event_loop()
        path = state["current_path"]
        node = path[state["current_node_index"]]
        
        loop.create_task(
            self.evaluation_agent.log_evaluation_to_db(
                session_id=state["session_id"],
                topic=node["topic"],
                node_id=node["node_id"],
                eval_result=eval_result
            )
        )
        return {"evaluation_result": eval_result}

    async def _intervene_node(self, state: SkillForgeState) -> dict:
        """Agent Node: Audits score history and generates study coach nudges."""
        intervention = await intervention_agent.check_learning_velocity(state)
        return {
            "reroute_triggered": intervention["reroute_triggered"],
            # Append the coach nudge text to our evaluation feedback
            "evaluation_result": {
                **state["evaluation_result"],
                "nudge_message": intervention["nudge_message"]
            }
        }

    def _reroute_node(self, state: SkillForgeState) -> dict:
        """Agent Node: Re-calculates learning paths by injecting review modules."""
        adjusted_path = planner_agent.reroute_path(state)
        # The planner sets the newly injected remediation node as status='current'
        return {
            "current_path": adjusted_path,
            "reroute_triggered": True
        }

    def _advance_node(self, state: SkillForgeState) -> dict:
        """Agent Node: Advances student to the next topic in the learning path."""
        path = state["current_path"]
        curr_idx = state["current_node_index"]
        
        # Mark current node as Mastered
        path[curr_idx]["status"] = "mastered"
        
        next_idx = curr_idx + 1
        if next_idx < len(path):
            path[next_idx]["status"] = "current"
            next_topic = path[next_idx]["topic"]
        else:
            next_topic = "complete"
            
        logger.info(f"Advancing student index from {curr_idx} to {next_idx}. Next topic: {next_topic}")
        return {
            "current_path": path,
            "current_node_index": next_idx,
            "current_topic": next_topic,
            "reroute_triggered": False
        }

    async def _retrieve_node(self, state: SkillForgeState) -> dict:
        """Agent Node: Fetches personalized textbook and video resources via RAG."""
        path = state["current_path"]
        curr_idx = state["current_node_index"]
        
        # If student completed the path, skip retrieval
        if curr_idx >= len(path):
            return {"retrieved_resources": []}
            
        resources = await retrieval_agent.retrieve_resources(state)
        return {"retrieved_resources": resources}

    # ==========================================
    # Route Selectors
    # ==========================================

    def _route_after_intervention(self, state: SkillForgeState) -> str:
        """Conditional routing based on whether a re-route was triggered."""
        if state.get("reroute_triggered", False):
            return "reroute"
        return "advance"

    # ==========================================
    # Execution Wrapper
    # ==========================================

    def run_study_transition(self, current_state: SkillForgeState) -> dict:
        """Invokes the LangGraph state machine with full context."""
        logger.info(f"Executing study transition graph for session '{current_state['session_id']}'...")
        return self.app.invoke(current_state)

# Instantiate global orchestrator
orchestrator = SkillForgeOrchestrator(LLMService())
