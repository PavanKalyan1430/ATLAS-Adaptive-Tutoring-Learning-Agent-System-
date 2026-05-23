from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    """
    Core Application Settings for SkillForge AI.
    Loads from the workspace .env file.
    """
    # 6 Groq keys for round-robin load balancing (3 standard + 3 extra)
    GROQ_API_KEY_1: str = Field(..., description="Groq Key 1")
    GROQ_API_KEY_2: str = Field(..., description="Groq Key 2")
    GROQ_API_KEY_3: str = Field(..., description="Groq Key 3")
    GROQ_API_KEY_4: str | None = Field(default=None, description="Groq Key 4")
    GROQ_API_KEY_5: str | None = Field(default=None, description="Groq Key 5")
    GROQ_API_KEY_6: str | None = Field(default=None, description="Groq Key 6")
    
    # Models
    FAST_LLM_MODEL: str = Field(default="llama-3.1-8b-instant")
    SMART_LLM_MODEL: str = Field(default="llama-3.3-70b-versatile")
    EMBEDDING_MODEL: str = Field(default="BAAI/bge-small-en-v1.5") # fastembed local model

    # Databases
    POSTGRES_URL: str = Field(
        default="postgresql://archer_user:archer_password@localhost:5432/archer_db",
        description="Postgres connection string"
    )
    QDRANT_URL: str = Field(default="http://localhost:6333", description="Qdrant connection string")
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection string")
    
    # Port / Host
    PORT: int = Field(default=8001, description="FastAPI Server Port")
    HOST: str = Field(default="127.0.0.1", description="FastAPI Server Host")

    # Tell Pydantic to look for .env in current and parent directories
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
