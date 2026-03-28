# Walkthrough: PDF Question Answering RAG System

This document provides a technical overview of the implemented system, its architecture, and how to use it.

## System Architecture

The system follows a standard RAG pipeline:

1.  **Ingestion**: 
    - PDF text is extracted page-by-page using `PyMuPDF`.
    - Text is cleaned and split into chunks of ~700 tokens with overlap.
    - Each chunk is embedded using `sentence-transformers` (`all-MiniLM-L6-v2`).
2.  **Storage**: 
    - Vectors are stored in a [FAISS](file:///c:/Users/B.PAVANKALYAN%20REDDY/Desktop/RAG%20PROJECT/app/db/faiss_store.py#8-61) index (IndexFlatL2).
    - Metadata (text, page number, filename) is stored in a pickled dictionary mapped to vector IDs.
3.  **Retrieval**:
    - User queries are embedded using the same model.
    - Top 5 most relevant chunks are retrieved from FAISS.
4.  **Generation**:
    - A strict grounded prompt is constructed with the retrieved context.
    - Groq's `llama3-8b-8192` generates the final answer with source references.

## Key Components

### [app/main.py](file:///c:/Users/B.PAVANKALYAN%20REDDY/Desktop/RAG%20PROJECT/app/main.py)
Entry point with FastAPI endpoints. Handles async file uploads and JSON queries.

### [app/services/ingestion.py](file:///c:/Users/B.PAVANKALYAN%20REDDY/Desktop/RAG%20PROJECT/app/services/ingestion.py)
Logic for parsing and chunking. Uses `fitz` for efficient PDF processing.

### [app/db/faiss_store.py](file:///c:/Users/B.PAVANKALYAN%20REDDY/Desktop/RAG%20PROJECT/app/db/faiss_store.py)
Manages binary storage of vectors and metadata persistence.

## How to Run

### 1. Setup Environment
Ensure you have a Groq API Key in the [.env](file:///c:/Users/B.PAVANKALYAN%20REDDY/Desktop/RAG%20PROJECT/.env) file:
```text
GROQ_API_KEY=gsk_xxxx...
```

### 2. Install Dependencies
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start the Server
```powershell
python -m app.main
```

## Example Requests

### Upload a PDF
```curl
curl -X POST "http://localhost:8000/upload" -H "accept: application/json" -H "Content-Type: multipart/form-data" -F "file=@document.pdf"
```

### Ask a Question
```curl
curl -X POST "http://localhost:8000/query" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"question\": \"What is the main topic of page 3?\"}"
```

## Performance & Scaling
- **Batch Processing**: Embeddings are generated in batches of 32 for efficiency.
- **Statelessness**: The API is stateless, making it easy to containerize.
- **Local Cache**: FAISS index is persisted locally for quick restarts without re-ingesting documents.
