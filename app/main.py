from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import QueryRequest, QueryResponse, UploadResponse, DocumentMetadata
from app.services.ingestion import IngestionService
from app.services.embedding import EmbeddingService
from app.services.llm import LLMService
from app.services.retrieval import RetrievalService
from app.db.faiss_store import FAISSStore
import os
import shutil
import uuid
from typing import List

app = FastAPI(title="PDF RAG System")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
faiss_store = FAISSStore()
embedding_service = EmbeddingService()
ingestion_service = IngestionService()
llm_service = LLMService()
retrieval_service = RetrievalService(faiss_store, embedding_service)

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    file_id = str(uuid.uuid4())
    file_path = os.path.join(TEMP_DIR, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Ingestion Pipeline
        pages_content = ingestion_service.extract_text_from_pdf(file_path)
        chunks = ingestion_service.create_chunks(pages_content, file.filename)
        
        # Embedding Pipeline
        chunk_texts = [c.text for c in chunks]
        embeddings = embedding_service.embed_texts(chunk_texts)
        
        # Storage Pipeline
        faiss_store.clear()
        faiss_store.add_documents(embeddings, chunks)
        
        return UploadResponse(
            doc_id=chunks[0].doc_id if chunks else "N/A",
            filename=file.filename,
            chunk_count=len(chunks)
        )
    finally:
        # Cleanup temp file
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    try:
        # Retrieval Pipeline
        relevant_chunks = retrieval_service.retrieve_context(request.question, top_k=request.top_k)
        
        if not relevant_chunks:
            return QueryResponse(
                answer="I don't know based on the provided document.",
                sources=[],
                context_chunks=[]
            )
        
        # LLM Pipeline
        context_texts = [c.text for c in relevant_chunks]
        answer = llm_service.generate_answer(request.question, context_texts)
        
        # Extract page numbers for sources
        sources = sorted(list(set([c.page for c in relevant_chunks])))
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            context_chunks=relevant_chunks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    # Ensure directories exist
    os.makedirs(TEMP_DIR, exist_ok=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
