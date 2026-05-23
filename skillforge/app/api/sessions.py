from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import logging
from datetime import datetime

from skillforge.app.models.schemas import SessionCreate, StudentSession
from skillforge.app.db.postgres import get_db_session, PostgresStudentSession
from skillforge.app.db.redis_client import redis_client

logger = logging.getLogger("SkillForge.SessionsAPI")
router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("", response_model=StudentSession)
async def create_session(payload: SessionCreate, db: AsyncSession = Depends(get_db_session)):
    """
    Initializes a new student session.
    Creates records in Postgres, caches initial state in Redis.
    """
    try:
        session_id = str(uuid.uuid4())
        
        # 1. Create DB Model
        db_session = PostgresStudentSession(
            session_id=session_id,
            subject=payload.subject,
            student_name=payload.student_name,
            competency_vector={},
            current_node_index=0,
            path_nodes=[]
        )
        db.add(db_session)
        await db.commit()
        
        # 2. Cache in Redis
        cache_data = {
            "session_id": session_id,
            "subject": payload.subject,
            "student_name": payload.student_name,
            "competency_vector": {},
            "current_node_index": 0,
            "path_nodes": [],
            "quiz_history": []
        }
        await redis_client.save_session(session_id, cache_data)
        
        logger.info(f"Created student session '{session_id}' for {payload.student_name}.")
        return StudentSession(
            session_id=session_id,
            subject=payload.subject,
            student_name=payload.student_name,
            created_at=datetime.utcnow(),
            competency_vector={},
            current_node_index=0,
            path_nodes=[]
        )
    except Exception as e:
        logger.error(f"❌ Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize session: {str(e)}")

@router.get("/{session_id}", response_model=StudentSession)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db_session)):
    """
    Retrieves current state of student session from Redis (with Postgres fallback).
    """
    # 1. Try Redis cache
    cached = await redis_client.get_session(session_id)
    if cached:
        return StudentSession(
            session_id=session_id,
            subject=cached["subject"],
            student_name=cached["student_name"],
            created_at=datetime.utcnow(),  # Mock timestamp for API schema
            competency_vector=cached.get("competency_vector", {}),
            current_node_index=cached.get("current_node_index", 0),
            path_nodes=cached.get("path_nodes", [])
        )
        
    # 2. Fallback to Postgres
    logger.info(f"Redis cache miss for session '{session_id}'. Querying Postgres fallback...")
    db_session = await db.get(PostgresStudentSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    # Re-cache in Redis
    cache_data = {
        "session_id": db_session.session_id,
        "subject": db_session.subject,
        "student_name": db_session.student_name,
        "competency_vector": db_session.competency_vector or {},
        "current_node_index": db_session.current_node_index or 0,
        "path_nodes": db_session.path_nodes or [],
        "quiz_history": []
    }
    await redis_client.save_session(session_id, cache_data)
    
    return StudentSession(
        session_id=db_session.session_id,
        subject=db_session.subject,
        student_name=db_session.student_name,
        created_at=db_session.created_at,
        competency_vector=db_session.competency_vector or {},
        current_node_index=db_session.current_node_index or 0,
        path_nodes=db_session.path_nodes or []
    )
