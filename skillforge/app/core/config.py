from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PORT: int = 8001
    
    # LLM Keys
    GROQ_API_KEY: str
    GROQ_API_KEY_1: str
    GROQ_API_KEY_2: str
    GROQ_API_KEY_3: str
    
    # DB Connections
    POSTGRES_URL: str = Field(default="postgresql+asyncpg://archer_user:archer_password@localhost:5432/skillforge_db")
    POSTGRES_SYNC_URL: str = Field(default="postgresql://archer_user:archer_password@localhost:5432/skillforge_db")
    QDRANT_URL: str = Field(default="http://localhost:6333")
    REDIS_URL: str = Field(default="redis://localhost:6379/1")
    
    # Embedding Setup
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    
    # App Namespaces
    QDRANT_COLLECTION: str = "skillforge_content"

settings = Settings()
