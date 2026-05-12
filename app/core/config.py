from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # LLM & Embedding Settings
    OPENROUTER_API_KEY: str = Field(..., description="API Key for OpenRouter")
    # 3 Groq keys for round-robin load balancing (avoids rate limits)
    GROQ_API_KEY_1: str = Field(..., description="Groq Key 1")
    GROQ_API_KEY_2: str = Field(..., description="Groq Key 2")
    GROQ_API_KEY_3: str = Field(..., description="Groq Key 3")
    FAST_LLM_MODEL: str = Field(default="meta-llama/llama-3.2-3b-instruct:free")
    SMART_LLM_MODEL: str = Field(default="openai/gpt-oss-20b:free")
    VLM_MODEL: str = Field(default="nvidia/nemotron-nano-12b-v2-vl:free")
    EMBEDDING_MODEL: str = Field(default="BAAI/bge-base-en")

    # Database Connections
    POSTGRES_URL: str = Field(..., description="PostgreSQL connection string")
    QDRANT_URL: str = Field(..., description="Qdrant connection string")
    NEO4J_URI: str = Field(..., description="Neo4j connection string")
    NEO4J_USER: str = Field(default="neo4j")
    NEO4J_PASSWORD: str = Field(..., description="Neo4j password")
    REDIS_URL: str = Field(..., description="Redis connection string")

    # This tells Python to look for the .env file in the root folder
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

# Create a global settings object that we will import everywhere
settings = Settings()
