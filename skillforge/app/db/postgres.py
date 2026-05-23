from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean, text
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from datetime import datetime
from skillforge.app.core.config import settings
import logging
import socket
import os

logger = logging.getLogger("SkillForge.Postgres")

def is_postgres_running(host: str = "127.0.0.1", port: int = 5432) -> bool:
    """Performs a rapid socket connection check to see if Postgres port is open."""
    try:
        with socket.create_connection((host, port), timeout=1.0):
            return True
    except OSError:
        return False

# Base configuration parameters
postgres_url = settings.POSTGRES_URL
if postgres_url.startswith("postgresql://"):
    postgres_url = postgres_url.replace("postgresql://", "postgresql+asyncpg://", 1)

sqlite_url = "sqlite+aiosqlite:///temp_uploads/skillforge_local.db"

# Globally accessible engine, sessionmaker, and Base
engine = None
AsyncSessionLocal = None
Base = declarative_base()

# Track which engine is currently in use
current_db_type = "PostgreSQL"

def configure_database_engine(url: str, is_sqlite: bool):
    """Dynamically configures or swaps the active database engine and sessionmaker."""
    global engine, AsyncSessionLocal, current_db_type
    current_db_type = "SQLite" if is_sqlite else "PostgreSQL"
    
    if is_sqlite:
        os.makedirs("temp_uploads", exist_ok=True)
        
    engine = create_async_engine(url, echo=False, pool_pre_ping=True)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    logger.info(f"⚙️ Configured active database engine to: {current_db_type}")

# Initial bootstrap attempt (based on socket check)
if is_postgres_running():
    configure_database_engine(postgres_url, is_sqlite=False)
else:
    configure_database_engine(sqlite_url, is_sqlite=True)

# ==========================================
# Database Tables (Cleanly Prefixed with 'sf_')
# ==========================================
from sqlalchemy import JSON, Text
from sqlalchemy.types import TypeDecorator

class SQLiteSafeArray(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return "[]"
        return ",".join(value)

    def process_result_value(self, value, dialect):
        if not value:
            return []
        return value.split(",")

class PostgresStudentSession(Base):
    __tablename__ = "sf_student_sessions"
    
    session_id = Column(String(50), primary_key=True)
    subject = Column(String(100), nullable=False)
    student_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    competency_vector = Column(JSON, default=dict)
    current_node_index = Column(Integer, default=0)
    path_nodes = Column(JSON, default=list)

class PostgresQuizHistory(Base):
    __tablename__ = "sf_quiz_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), ForeignKey("sf_student_sessions.session_id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(100), nullable=False)
    topic = Column(String(100), nullable=False)
    difficulty = Column(Float, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken_seconds = Column(Integer, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow)

class PostgresEvaluationHistory(Base):
    __tablename__ = "sf_evaluation_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), ForeignKey("sf_student_sessions.session_id", ondelete="CASCADE"), nullable=False)
    node_id = Column(String(100), nullable=False)
    topic = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    # Fallback column selection using SQLiteSafeArray to protect against schema runtime incompatibilities
    misconceptions = Column(SQLiteSafeArray, default=list)
    evaluated_at = Column(DateTime, default=datetime.utcnow)

# ==========================================
# Resilient Async Connection Getter
# ==========================================
async def get_db_session():
    """Returns database session pointing to the active dynamically-configured engine."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()

# ==========================================
# Self-Healing DB Initializer
# ==========================================
async def init_postgres_db():
    """
    Tries to connect to PostgreSQL.
    If ANY error occurs (such as password auth failures, or operational errors),
    it gracefully catches the error and switches to local SQLite dynamically on the fly!
    """
    global current_db_type
    
    # If initial socket check chose Postgres, let's verify if we can actually authenticate
    if current_db_type == "PostgreSQL":
        try:
            logger.info("Testing PostgreSQL connection credentials...")
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info("✅ PostgreSQL credentials verified successfully!")
        except Exception as e:
            logger.warning(
                f"⚠️ PostgreSQL credential verification failed: {e}. "
                "Swapping active engine to local SQLite fallback database..."
            )
            configure_database_engine(sqlite_url, is_sqlite=True)

    try:
        logger.info(f"Initializing {current_db_type} tables prefixed with 'sf_'...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"✅ {current_db_type} tables successfully created and ready!")
    except Exception as e:
        logger.error(f"❌ Critical failure initializing database tables: {e}")
        raise e
