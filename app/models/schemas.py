from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime

# ==========================================
# 1. ENUMS (Strict Categories)
# ==========================================
class ContentType(str, Enum):
    TEXT = "text"
    TABLE = "table"
    IMAGE = "image"

class SearchMode(str, Enum):
    VECTOR = "vector"
    GRAPH = "graph"
    HYBRID = "hybrid"

# ==========================================
# 2. DOMAIN SCHEMAS (Internal Blueprints)
# ==========================================
class ChunkMetadata(BaseModel):
    """Metadata attached to every chunk stored in Qdrant."""
    doc_id: str
    filename: str
    page: int
    content_type: ContentType
    section_heading: Optional[str] = None
    summary: Optional[str] = None # VLM description for images, or LLM summary for tables

class ChunkSchema(BaseModel):
    """The actual document chunk handled by the system."""
    chunk_id: str
    text: str # The raw text, markdown table, or VLM image description
    metadata: ChunkMetadata
    embedding: Optional[List[float]] = None

class GraphNodeSchema(BaseModel):
    """Represents an entity and its relationship in Neo4j."""
    subject: str
    predicate: str
    object: str
    source_chunk_id: str

# ==========================================
# 3. API SCHEMAS (Frontend <-> Backend)
# ==========================================
class UploadStatus(str, Enum):
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    chunk_count: Optional[int] = None
    status: str = "processing"
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentStatus(BaseModel):
    doc_id: str
    filename: str
    status: str  # processing | ready | failed
    chunk_count: Optional[int] = None
    error: Optional[str] = None

class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = None # Crucial for Redis chat history
    mode: SearchMode = SearchMode.HYBRID
    top_k: int = 5

class AgentThought(BaseModel):
    """Used for SSE streaming to show the user what the AI is doing."""
    agent_name: str
    action: str
    details: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[int]
    context_used: List[ChunkSchema]
