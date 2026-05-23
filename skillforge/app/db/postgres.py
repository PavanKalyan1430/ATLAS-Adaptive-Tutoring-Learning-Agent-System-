from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer, Boolean, JSON, ForeignKey, ARRAY
from datetime import datetime
from app.core.config import settings

# Async PostgreSQL engine (FastAPI request lifecycle)
async_engine = create_async_engine(settings.POSTGRES_URL, echo=False)
AsyncSessionLocal = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

# Sync engine (DML bootstrap and migrations)
sync_engine = create_engine(settings.POSTGRES_SYNC_URL, echo=False)

Base = declarative_base()

class StudentSessionModel(Base):
    __tablename__ = "student_sessions"

    session_id = Column(String(50), primary_key=True)
    subject = Column(String(100), nullable=False)
    student_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    competency_vector = Column(JSON, default=dict)  # {topic: score}
    current_path = Column(JSON, default=list)       # Ordered list of learning nodes
    current_node_index = Column(Integer, default=0)

    # Relationships
    quiz_records = relationship("QuizHistoryModel", back_populates="session", cascade="all, delete-orphan")
    eval_records = relationship("EvaluationHistoryModel", back_populates="session", cascade="all, delete-orphan")

class QuizHistoryModel(Base):
    __tablename__ = "quiz_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), ForeignKey("student_sessions.session_id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(100), nullable=False)
    topic = Column(String(100), nullable=False)
    difficulty = Column(Float, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken_sec = Column(Integer, nullable=True)
    answered_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("StudentSessionModel", back_populates="quiz_records")

class EvaluationHistoryModel(Base):
    __tablename__ = "evaluation_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), ForeignKey("student_sessions.session_id", ondelete="CASCADE"), nullable=False)
    node_id = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    misconceptions = Column(JSON, default=list)  # List of identified misconception strings
    confidence = Column(Float, nullable=False)
    evaluated_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("StudentSessionModel", back_populates="eval_records")

# Dependency injector to get DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def init_db():
    """Sync helper to establish DB tables."""
    Base.metadata.create_all(bind=sync_engine)
