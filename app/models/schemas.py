from pydantic import BaseModel, Field
from typing import List, Optional

class DocumentMetadata(BaseModel):
    doc_id: str
    page: int
    chunk_id: int
    text: str
    source: str

class QueryRequest(BaseModel):
    question: str
    doc_id: Optional[str] = None
    top_k: int = 5

class QueryResponse(BaseModel):
    answer: str
    sources: List[int]
    context_chunks: List[DocumentMetadata]

class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
