from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from datetime import datetime

from skillforge.app.models.schemas import DiagnosticQuestion, QuizAnswerSubmit, QuizAnswerResponse
from skillforge.app.db.postgres import get_db_session, PostgresStudentSession, PostgresQuizHistory
from skillforge.app.db.redis_client import redis_client
from skillforge.app.agents.diagnostic_agent import diagnostic_agent
from skillforge.app.agents.planner_agent import planner_agent

logger = logging.getLogger("SkillForge.QuizAPI")
router = APIRouter(prefix="/sessions/{session_id}/quiz", tags=["Quiz"])

@router.get("/next", response_model=DiagnosticQuestion)
async def get_next_question(session_id: str):
    """
    Fetches the next adaptive question based on the student's current performance state.
    """
    cached = await redis_client.get_session(session_id)
    if not cached:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
        
    question = diagnostic_agent.run_adaptive_quiz_step(cached)
    if not question:
        raise HTTPException(status_code=400, detail="Diagnostic quiz is already complete. Use /answer to finalize.")
        
    return DiagnosticQuestion(
        question_id=question["question_id"],
        question=question["question"],
        options=question["options"],
        correct_option_idx=question["correct_option_idx"],
        difficulty=question["difficulty"],
        bloom_level=question["bloom_level"],
        topic_tag=question["topic_tag"],
        explanation=question.get("explanation")
    )

@router.post("/answer", response_model=QuizAnswerResponse)
async def submit_quiz_answer(
    session_id: str, 
    payload: QuizAnswerSubmit, 
    db: AsyncSession = Depends(get_db_session)
):
    """
    Evaluates MCQ answer submission.
    Rotates target difficulty, logs transaction, and checks for quiz completion.
    """
    cached = await redis_client.get_session(session_id)
    if not cached:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    # 1. Fetch current question details from cached state (or Qdrant lookup if needed)
    # For speed, we just retrieve the question details directly by ID using Qdrant client
    from skillforge.app.db.qdrant import qdrant_mgr, QUESTIONS_COLLECTION
    from qdrant_client.http import models
    
    hits = qdrant_mgr.client.scroll(
        collection_name=QUESTIONS_COLLECTION,
        scroll_filter=models.Filter(
            must=[models.FieldCondition(key="question_id", match=models.MatchValue(value=payload.question_id))]
        ),
        limit=1
    )[0]
    
    if not hits:
        raise HTTPException(status_code=404, detail="Question not found in vector database.")
        
    question_payload = hits[0].payload
    correct_option_idx = int(question_payload["correct_option_idx"])
    is_correct = (payload.selected_option_idx == correct_option_idx)
    
    # 2. Append to local Redis history cache
    quiz_history = cached.get("quiz_history") or []
    quiz_history.append({
        "question_id": payload.question_id,
        "topic": question_payload["topic_tag"],
        "difficulty": question_payload["difficulty"],
        "is_correct": is_correct,
        "answered_at": str(datetime.utcnow())
    })
    cached["quiz_history"] = quiz_history
    
    # 3. Log to Postgres relational history table
    db_history = PostgresQuizHistory(
        session_id=session_id,
        question_id=payload.question_id,
        topic=question_payload["topic_tag"],
        difficulty=question_payload["difficulty"],
        is_correct=is_correct,
        time_taken_seconds=payload.time_taken_seconds
    )
    db.add(db_history)
    
    # 4. Check if we hit the 8-question limit
    quiz_complete = len(quiz_history) >= 8
    competency_vector = None
    next_question = None
    
    if quiz_complete:
        logger.info(f"Quiz completed for session '{session_id}'. Invoking competency compilation...")
        # Compile competency vector
        competency_vector = diagnostic_agent.compute_competency_vector(cached)
        cached["competency_vector"] = competency_vector
        
        # Build curriculum paths instantly
        path_nodes = planner_agent.build_learning_path(cached)
        cached["path_nodes"] = path_nodes
        cached["current_node_index"] = 0
        
        # Save compiled curriculum graph directly in PostgreSQL session record
        db_session = await db.get(PostgresStudentSession, session_id)
        if db_session:
            db_session.competency_vector = competency_vector
            db_session.path_nodes = path_nodes
            db_session.current_node_index = 0
            
        await db.commit()
    else:
        # Pre-save Redis state so run_adaptive_quiz_step can inspect updated difficulty
        await redis_client.save_session(session_id, cached)
        
        # Get next question payload
        next_payload = diagnostic_agent.run_adaptive_quiz_step(cached)
        if next_payload:
            next_question = DiagnosticQuestion(
                question_id=next_payload["question_id"],
                question=next_payload["question"],
                options=next_payload["options"],
                correct_option_idx=next_payload["correct_option_idx"],
                difficulty=next_payload["difficulty"],
                bloom_level=next_payload["bloom_level"],
                topic_tag=next_payload["topic_tag"],
                explanation=next_payload.get("explanation")
            )
        else:
            # Quiz complete fallback
            quiz_complete = True
            
    # Finalize state caching in Redis
    await redis_client.save_session(session_id, cached)
    
    return QuizAnswerResponse(
        is_correct=is_correct,
        correct_option_idx=correct_option_idx,
        explanation=question_payload.get("explanation"),
        next_question=next_question,
        quiz_complete=quiz_complete,
        competency_vector=competency_vector
    )
