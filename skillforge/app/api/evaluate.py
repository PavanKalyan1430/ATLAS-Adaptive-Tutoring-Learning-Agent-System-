from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from skillforge.app.models.schemas import ExerciseSubmit, EvaluationResult
from skillforge.app.db.postgres import get_db_session, PostgresStudentSession
from skillforge.app.db.redis_client import redis_client
from skillforge.app.agents.orchestrator import orchestrator
from skillforge.app.agents.state import SkillForgeState
from skillforge.app.api.websocket import ws_manager

logger = logging.getLogger("SkillForge.EvaluateAPI")
router = APIRouter(prefix="/sessions/{session_id}/evaluate", tags=["Evaluation"])

@router.post("", response_model=EvaluationResult)
async def evaluate_exercise(
    session_id: str,
    payload: ExerciseSubmit,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Submits a student's answer to the active exercise.
    Launches the LangGraph state machine to perform semantic evaluation,
    velocity checks, adaptive path re-routing, and fresh RAG retrieval in one flow!
    """
    cached = await redis_client.get_session(session_id)
    if not cached or "path_nodes" not in cached:
        raise HTTPException(status_code=404, detail="Session or learning path not found.")
        
    path_nodes = cached["path_nodes"]
    curr_idx = cached.get("current_node_index", 0)
    
    if curr_idx >= len(path_nodes):
        raise HTTPException(status_code=400, detail="Curriculum complete! No active exercises to grade.")
        
    current_node = path_nodes[curr_idx]
    
    # 1. Assemble Initial LangGraph State
    initial_state = SkillForgeState(
        session_id=session_id,
        subject=cached["subject"],
        student_name=cached["student_name"],
        competency_vector=cached.get("competency_vector", {}),
        quiz_history=cached.get("quiz_history", []),
        current_topic=current_node["topic"],
        current_path=path_nodes,
        current_node_index=curr_idx,
        retrieved_resources=cached.get("retrieved_resources", []),
        student_answer=payload.answer,
        evaluation_result=None,
        velocity_window=[],
        reroute_triggered=False,
        next_node_id=None
    )
    
    # 2. Ignite the LangGraph State Machine!
    try:
        final_state = orchestrator.run_study_transition(initial_state)
    except Exception as e:
        logger.error(f"❌ LangGraph execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Orchestration failure: {str(e)}")
        
    # 3. Extract evaluation outputs
    eval_output = final_state["evaluation_result"]
    reroute_triggered = final_state.get("reroute_triggered", False)
    
    # 4. Synchronize state with Redis Cache
    new_path = final_state["current_path"]
    new_idx = final_state["current_node_index"]
    
    cached["path_nodes"] = new_path
    cached["current_node_index"] = new_idx
    cached["retrieved_resources"] = final_state.get("retrieved_resources", [])
    await redis_client.save_session(session_id, cached)
    
    # 5. Synchronize state with PostgreSQL
    db_session = await db.get(PostgresStudentSession, session_id)
    if db_session:
        db_session.path_nodes = new_path
        db_session.current_node_index = new_idx
        await db.commit()
        
    # 6. Broadcast Real-time Events via WebSockets!
    # A) Broadcast score and misconceptions
    await ws_manager.broadcast_to_session(
        session_id=session_id,
        event_type="score_update",
        data={
            "score": eval_output["score"],
            "misconceptions": eval_output["misconceptions"],
            "feedback": eval_output["feedback"]
        }
    )
    
    # B) Broadcast AI Nudges / Hints
    nudge_msg = eval_output.get("nudge_message")
    if nudge_msg:
        await ws_manager.broadcast_to_session(
            session_id=session_id,
            event_type="nudge",
            data={"message": nudge_msg}
        )
        
    # C) Broadcast dynamic path re-routing transitions
    if reroute_triggered:
        await ws_manager.broadcast_to_session(
            session_id=session_id,
            event_type="reroute",
            data={
                "message": "Learning velocity dropped! Injected conceptual fundamentals review module.",
                "new_path": new_path,
                "active_index": new_idx
            }
        )
        
    # Determine the next node ID if path is not complete
    next_node_id = None
    if new_idx < len(new_path):
        next_node_id = new_path[new_idx]["node_id"]
        
    return EvaluationResult(
        score=eval_output["score"],
        misconceptions=eval_output["misconceptions"],
        feedback=eval_output["feedback"],
        confidence=eval_output["confidence"],
        reroute_triggered=reroute_triggered,
        next_node_id=next_node_id
    )
