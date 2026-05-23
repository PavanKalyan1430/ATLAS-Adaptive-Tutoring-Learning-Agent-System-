from skillforge.app.agents.state import SkillForgeState
from skillforge.app.services.llm import LLMService
from skillforge.app.db.redis_client import redis_client
import logging

logger = logging.getLogger("SkillForge.InterventionAgent")

class InterventionAgent:
    """
    Intervention Agent: Monitors student performance history,
    triggers adaptive path adjustments, and generates targeted hints (nudges).
    """
    def __init__(self, llm_service: LLMService):
        self.fast_llm = llm_service.get_fast_llm()

    async def check_learning_velocity(self, state: SkillForgeState) -> dict:
        """
        Analyzes the score history and latest evaluation result to decide
        whether to trigger path re-routing or push a helpful study nudge.
        """
        session_id = state["session_id"]
        eval_result = state.get("evaluation_result") or {}
        
        # 1. Push latest score into Redis rolling window
        latest_score = eval_result.get("score", 1.0)
        await redis_client.push_score(session_id, latest_score)
        
        # 2. Retrieve last 5 scores
        scores = await redis_client.get_velocity_window(session_id)
        state["velocity_window"] = scores
        
        logger.info(f"Redis performance velocity queue for session '{session_id}': {scores}")
        
        # 3. Decision Logic: Trigger re-routing if student failed repeatedly
        # Trigger condition: at least 3 submissions made AND the average of the last 3 is < 0.5
        reroute_triggered = False
        if len(scores) >= 3:
            recent_scores = scores[-3:]
            avg_score = sum(recent_scores) / 3.0
            if avg_score < 0.5:
                reroute_triggered = True
                logger.warning(f"⚠️ Learning velocity dropped! Average score {avg_score} < 0.5. Re-routing required!")
                
        # 4. Generate Personalized Study Nudge / Hint
        nudge_message = ""
        misconceptions = eval_result.get("misconceptions", [])
        
        if latest_score < 0.8:
            topic = state.get("current_topic", "General")
            nudge_message = self._generate_nudge_hint(topic, misconceptions)
            
        return {
            "reroute_triggered": reroute_triggered,
            "nudge_message": nudge_message
        }

    def _generate_nudge_hint(self, topic: str, misconceptions: list[str]) -> str:
        """Generates a helpful, friendly hint using the fast LLM."""
        m_str = ", ".join(misconceptions) if misconceptions else "conceptual gaps"
        
        prompt = f"""You are a friendly and supportive AI learning coach. 
The student is working on the topic '{topic}' and has demonstrated some learning gaps: {m_str}.
Provide a brief, encouraging, 1-2 sentence study hint or pointer that guides them in the right direction without directly giving away the solution.
Make it feel conversational and warm. Keep it under 50 words.
"""
        response = self.fast_llm.complete(prompt)
        return str(response).strip()

intervention_agent = InterventionAgent(LLMService())
