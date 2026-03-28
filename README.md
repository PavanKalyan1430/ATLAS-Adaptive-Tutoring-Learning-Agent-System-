# 📄 PDF RAG System — Retrieval-Augmented Generation for Document Q&A

> **Ask any question. Get answers straight from your PDF — powered by local vector search and a production-grade LLM.**

---

## 📌 Table of Contents

1. [Project Summary](#1-project-summary)
2. [Key Features](#2-key-features)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Project Structure](#5-project-structure)
6. [Detailed Component Breakdown](#6-detailed-component-breakdown)
   - [Backend (FastAPI)](#backend-fastapi)
     - [Ingestion Pipeline](#ingestion-pipeline)
     - [Embedding Service](#embedding-service)
     - [FAISS Vector Store](#faiss-vector-store)
     - [Retrieval Service (Bi-Encoder + Cross-Encoder)](#retrieval-service-bi-encoder--cross-encoder)
     - [LLM Service (Groq API)](#llm-service-groq-api)
   - [Frontend (React + Vite)](#frontend-react--vite)
7. [End-to-End Data Flow](#7-end-to-end-data-flow)
8. [API Reference](#8-api-reference)
9. [Setup & Installation](#9-setup--installation)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
10. [Environment Variables](#10-environment-variables)
11. [Running the Application](#11-running-the-application)
12. [How to Use](#12-how-to-use)
13. [Design Decisions & Trade-offs](#13-design-decisions--trade-offs)
14. [Known Limitations & Future Work](#14-known-limitations--future-work)

---

## 1. Project Summary

The **PDF RAG System** is a full-stack web application that enables users to upload any PDF document and then have a natural language **Q&A conversation** with its contents. It implements a complete **Retrieval-Augmented Generation (RAG)** pipeline — a modern AI architecture that combines **dense vector search** with **large language model generation** to answer questions that are grounded in the actual document, not hallucinated.

Unlike a simple ChatGPT wrapper, this system:
- Does **not** send entire PDFs to the LLM (too expensive and too slow)
- Uses **semantic search** to find only the most relevant paragraphs
- Applies **cross-encoder re-ranking** to refine those results before passing them to the LLM
- Generates answers that always cite the **source page number**

This makes it accurate, fast, cost-efficient, and production-ready.

---

## 2. Key Features

| Feature | Description |
|---|---|
| 📤 **PDF Upload** | Upload any PDF via a drag-and-drop UI |
| 🔍 **Semantic Search** | Finds relevant passages using embedding similarity, not keyword matching |
| ♻️ **Smart Chunking** | Splits PDF into sentence-aware chunks with configurable overlap to preserve context |
| 🚀 **Two-Stage Retrieval** | Fast bi-encoder FAISS search + accurate cross-encoder re-ranking |
| 🤖 **LLM Answer Generation** | Uses Groq's hosted Llama 3.1 (8B) for fast, coherent answers |
| 📄 **Source Citations** | Every answer includes the page numbers it was derived from |
| 💾 **Persistent Index** | FAISS index saved to disk; survives server restarts |
| ⚡ **GPU-Aware** | Embedding and re-ranking automatically use CUDA if available |

---

## 3. Tech Stack

### Backend
| Library | Purpose |
|---|---|
| **FastAPI** | REST API framework — async, fast, OpenAPI auto-docs |
| **Uvicorn** | ASGI server to run FastAPI |
| **PyMuPDF (fitz)** | PDF parsing and text extraction |
| **Sentence-Transformers** | Generates dense vector embeddings (BAAI/bge-base-en) and cross-encoder re-ranking |
| **FAISS (faiss-cpu)** | Facebook AI Similarity Search — in-memory ANN vector index |
| **Groq SDK** | Client for calling the Groq cloud LLM API (Llama 3.1 8B) |
| **Pydantic** | Data validation and schema definitions |
| **python-dotenv** | Loads environment variables from `.env` |
| **NumPy / Torch** | Numerical operations and device management |

### Frontend
| Library | Purpose |
|---|---|
| **React 18** | UI component framework |
| **Vite** | Ultra-fast frontend dev server and bundler |
| **Tailwind CSS** | Utility-first styling |
| **Axios / Fetch** | HTTP calls to the backend API |

---

## 4. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                   React + Vite + Tailwind                        │
│         ┌──────────────┐      ┌──────────────────────┐           │
│         │  PDF Upload  │      │  Question Input Box  │           │
│         └──────┬───────┘      └──────────┬───────────┘           │
└────────────────│────────────────────────│──────────────────────┘
                 │  POST /upload           │  POST /query
                 ▼                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python)                        │
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐   │
│  │  Ingestion  │    │  Embedding   │    │   FAISS Store      │   │
│  │  Service    │───▶│  Service     │───▶│  (faiss_index.bin) │   │
│  │ (PyMuPDF)   │    │ (BGE model)  │    │  (metadata.pkl)    │   │
│  └─────────────┘    └──────────────┘    └────────────────────┘   │
│                                                  │                │
│                                                  │  Query time    │
│                     ┌────────────────────────────┘                │
│                     ▼                                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                 Retrieval Service                        │    │
│  │  Step 1: FAISS bi-encoder ANN search (top-8 candidates) │    │
│  │  Step 2: CrossEncoder re-ranking (ms-marco-MiniLM-L-6)  │    │
│  │  Step 3: Return top-3 most relevant chunks              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                            │                                      │
│                            ▼                                      │
│              ┌─────────────────────────┐                         │
│              │      LLM Service        │                         │
│              │  Groq API → Llama 3.1   │                         │
│              │  8B Instant (temp=0.3)  │                         │
│              └─────────────────────────┘                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Project Structure

```
RAG PROJECT/
│
├── app/                         # Backend Python package
│   ├── main.py                  # FastAPI app entry point & route handlers
│   │
│   ├── api/                     # Reserved for future route splitting
│   │   └── __init__.py
│   │
│   ├── models/                  # Pydantic schemas
│   │   ├── __init__.py
│   │   └── schemas.py           # DocumentMetadata, QueryRequest, QueryResponse, UploadResponse
│   │
│   ├── services/                # Core business logic
│   │   ├── __init__.py
│   │   ├── ingestion.py         # PDF text extraction + sentence-aware chunking
│   │   ├── embedding.py         # BGE embedding generation (bi-encoder)
│   │   ├── retrieval.py         # FAISS search + CrossEncoder re-ranking
│   │   └── llm.py               # Groq API client and prompt engineering
│   │
│   ├── db/                      # Persistence layer
│   │   ├── __init__.py
│   │   └── faiss_store.py       # FAISS index CRUD (add, search, save, load, clear)
│   │
│   └── utils/                   # (Reserved for future utilities)
│       └── __init__.py
│
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx              # Root component with upload + query UI
│   │   ├── App.css              # Global styles
│   │   ├── main.jsx             # React DOM entry point
│   │   ├── components/          # Reusable UI components
│   │   └── services/            # API call helpers
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── .env                         # Secret keys (NOT committed to git)
├── .env.example                 # Template for .env
├── .gitignore                   # Ignored files
├── requirements.txt             # Python dependencies
│
# Auto-generated at runtime (gitignored):
├── faiss_index.bin              # Persisted FAISS vector index
├── metadata.pkl                 # Chunk metadata map
└── temp_uploads/                # Temporary PDF storage during processing
```

---

## 6. Detailed Component Breakdown

### Backend (FastAPI)

**`app/main.py`** — The central FastAPI application that wires all services together and exposes two REST endpoints:

- `POST /upload` — Receives a PDF file, runs the full ingestion→embedding→storage pipeline
- `POST /query` — Receives a natural language question, runs retrieval→LLM pipeline and returns an answer

CORS is enabled for `*` to allow the React frontend to communicate freely during development.

---

#### Ingestion Pipeline

**File:** `app/services/ingestion.py`  
**Class:** `IngestionService`

This is the first stage when a PDF is uploaded.

**Step 1 — PDF Parsing:**  
Uses **PyMuPDF** (`fitz`) to open the PDF and extract text from each page individually using `page.get_text("text")`. The text is normalized using regex to collapse excessive whitespace.

**Step 2 — Sentence-Aware Chunking:**  
Unlike naive character splitting, this implementation splits text on sentence boundaries (`.`, `!`, `?`) first. It then accumulates sentences into chunks of up to **600 characters**. When a chunk exceeds this limit:
- It is saved as a completed chunk
- An **overlap of 150 characters** from the end of the previous chunk is carried over to the start of the next one — this ensures that context at chunk boundaries is not lost

Each chunk is stored as a `DocumentMetadata` Pydantic object containing:
- `doc_id` — UUID for the whole document
- `chunk_id` — Sequential chunk number
- `page` — PDF page number
- `text` — The chunk text content
- `source` — Original filename

**Why this matters:** Good chunking is the foundation of good RAG. Too-large chunks dilute relevance; too-small chunks lose context. Overlap prevents answers from being cut across chunk boundaries.

---

#### Embedding Service

**File:** `app/services/embedding.py`  
**Class:** `EmbeddingService`

This service converts text into **dense vector embeddings** using the `BAAI/bge-base-en` model from `sentence-transformers`.

**Model Choice — BAAI/bge-base-en:**
- 768-dimensional embeddings (vs. 384d for MiniLM)
- Specifically trained for retrieval tasks (better than generic sentence embeddings)
- Outperforms `all-MiniLM-L6-v2` on BEIR benchmark retrieval tasks

**Two methods:**
- `embed_texts(texts, batch_size=32)` — Batch embeds all document chunks during ingestion. Uses `normalize_embeddings=True` for cosine-compatible L2 comparisons.
- `embed_query(query)` — Embeds a single user question. For BGE models, prepends the instruction prefix `"Represent this sentence for searching relevant passages: "` which improves recall.

Auto-detects and uses **CUDA** (GPU) if available, otherwise CPU.

---

#### FAISS Vector Store

**File:** `app/db/faiss_store.py`  
**Class:** `FAISSStore`

FAISS (**Facebook AI Similarity Search**) is used as the in-memory vector database.

**Index type:** `IndexFlatL2` — an exact, brute-force L2 distance search. This is accurate (no approximation) and fast enough for the single-document use case.

**Persistence:** The index is saved to `faiss_index.bin` and the metadata is saved to `metadata.pkl` (Python pickle) after every write. On server startup, if these files exist, they are loaded back — so the last-uploaded document is immediately queryable.

**Key operations:**
- `add_documents(embeddings, metadata)` — Adds embeddings to FAISS index, maps FAISS integer IDs → `DocumentMetadata` objects
- `search(query_embedding, top_k)` — Returns the metadata for the `top_k` nearest vectors
- `clear()` — Resets the index (called on every new upload so that queries only search the current document)
- `save()` / `load()` — Disk persistence via `faiss.write_index` and `pickle`

---

#### Retrieval Service (Bi-Encoder + Cross-Encoder)

**File:** `app/services/retrieval.py`  
**Class:** `RetrievalService`

This is the most sophisticated component. It uses a **two-stage retrieval** strategy, which is the industry standard for high-accuracy RAG systems.

**Stage 1 — Bi-Encoder (Fast Approximate Search):**  
The FAISS index is searched using the question's BGE embedding. This returns the top-8 most similar chunks by L2 distance. This is fast (milliseconds for hundreds of chunks) but not perfectly accurate.

**Stage 2 — Cross-Encoder Re-Ranking (Accurate Scoring):**  
The 8 candidate chunks are re-scored using `cross-encoder/ms-marco-MiniLM-L-6-v2`. Unlike a bi-encoder which encodes query and document separately, a cross-encoder reads the `[question, chunk]` pair **together** through a transformer, giving much more accurate relevance scores. The top-3 highest-scoring chunks are kept.

**Why two stages?**  
- Running a cross-encoder over all chunks is too slow (O(n) transformer forward passes)
- Running only a bi-encoder misses fine-grained relevance
- The bi-encoder + cross-encoder combination gives the best of both: speed + accuracy

The service includes diagnostic logging to stdout showing each candidate's score and text snippet — useful for debugging retrieval quality.

---

#### LLM Service (Groq API)

**File:** `app/services/llm.py`  
**Class:** `LLMService`

After retrieval, the top-3 chunks are concatenated into a context string and passed to the LLM.

**Model:** `llama-3.1-8b-instant` via **Groq Cloud API** — chosen for its extremely low latency (Groq uses custom LPU hardware).

**Prompt Engineering:**  
A strict system prompt is used to:
1. Forbid the LLM from mentioning "chunk", "context", or "source document" (keeps answers natural)
2. Instruct it to answer directly as if it already had the knowledge
3. Fall back gracefully if the context doesn't contain the answer
4. Append source page numbers at the end of every response

**Parameters:**
- `temperature=0.3` — Low but not zero; balanced between precision and fluency
- `max_tokens=600` — Enough for detailed answers without runaway generation

---

### Frontend (React + Vite)

The frontend is a clean single-page React application built with Vite. It provides:
- **PDF Upload Panel** — Drag-and-drop or click-to-upload, shows upload confirmation (filename and chunk count)
- **Q&A Interface** — Text input for questions, displays the LLM-generated answer and the source pages
- **API Integration** — Calls `POST /upload` and `POST /query` on the FastAPI backend

The frontend proxies API calls to `http://localhost:8000` via Vite's dev server config.

---

## 7. End-to-End Data Flow

### Upload Flow

```
User selects PDF
      │
      ▼
POST /upload  →  IngestionService.extract_text_from_pdf()
                     │  PyMuPDF reads page text
                     ▼
               IngestionService.create_chunks()
                     │  Sentence-boundary split, 600 char chunks, 150 char overlap
                     ▼
               EmbeddingService.embed_texts()
                     │  BAAI/bge-base-en → 768-d float32 numpy arrays
                     ▼
               FAISSStore.clear()  →  FAISSStore.add_documents()
                     │  Adds to IndexFlatL2, maps IDs→metadata
                     ▼
               FAISSStore.save()
                     │  faiss_index.bin + metadata.pkl written to disk
                     ▼
               Return UploadResponse { doc_id, filename, chunk_count }
```

### Query Flow

```
User types question
      │
      ▼
POST /query  →  EmbeddingService.embed_query()
                     │  Prefix + BGE encode → 768-d vector
                     ▼
               FAISSStore.search(top_k=8)
                     │  IndexFlatL2 nearest neighbor search
                     ▼
               CrossEncoder.predict(pairs)
                     │  Score each [question, chunk] pair
                     ▼
               Sort by score → take top 3 chunks
                     │
                     ▼
               LLMService.generate_answer(question, context_chunks)
                     │  Build strict prompt, call Groq API
                     ▼
               Return QueryResponse { answer, sources, context_chunks }
                     │
                     ▼
               Frontend displays answer + page citations
```

---

## 8. API Reference

### `POST /upload`

Uploads a PDF, processes it, and stores embeddings.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | `File` | A `.pdf` file |

**Response:** `200 OK`
```json
{
  "doc_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "filename": "report.pdf",
  "chunk_count": 47
}
```

**Errors:**
- `400 Bad Request` — File is not a PDF

---

### `POST /query`

Runs a question through the RAG pipeline against the uploaded document.

**Request:** `application/json`
```json
{
  "question": "What is the main argument of the paper?",
  "top_k": 5
}
```
| Field | Type | Default | Description |
|---|---|---|---|
| `question` | `string` | required | Natural language question |
| `doc_id` | `string` | `null` | Optional document filter |
| `top_k` | `integer` | `5` | Number of candidates for bi-encoder phase |

**Response:** `200 OK`
```json
{
  "answer": "The main argument is that ...\n\nSources: Page 3, Page 7",
  "sources": [3, 7],
  "context_chunks": [
    {
      "doc_id": "...",
      "page": 3,
      "chunk_id": 12,
      "text": "Relevant passage text...",
      "source": "report.pdf"
    }
  ]
}
```

**Errors:**
- `500 Internal Server Error` — Retrieval or LLM error

---

## 9. Setup & Installation

### Prerequisites

- **Python 3.9+**
- **Node.js 18+** and **npm**
- A **Groq API key** (free tier available at [console.groq.com](https://console.groq.com))
- (Optional) NVIDIA GPU + CUDA for faster embedding generation

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/your-username/rag-project.git
cd rag-project
```

**2. Create and activate a virtual environment**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

**3. Install Python dependencies**
```bash
pip install -r requirements.txt
```

> ⚠️ **Note:** `torch` and `sentence-transformers` are large packages (~2GB). Ensure you have a stable internet connection. On CPU-only machines, `faiss-cpu` is used automatically.

**4. Set up environment variables**
```bash
cp .env.example .env
# Open .env and add your GROQ_API_KEY
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

---

## 10. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | — | Your Groq Cloud API key |
| `LLM_MODEL` | No | `llama-3.1-8b-instant` | Any model supported by Groq |
| `EMBEDDING_MODEL` | No | `BAAI/bge-base-en` | HuggingFace model ID for embeddings |

> 🔑 **Never commit your `.env` file.** It is listed in `.gitignore`.

---

## 11. Running the Application

**Terminal 1 — Start the FastAPI backend:**
```bash
# From the project root, with venv active
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API will be available at: `http://localhost:8000`
- Auto-generated API docs: `http://localhost:8000/docs`

**Terminal 2 — Start the React frontend:**
```bash
cd frontend
npm run dev
```
- Frontend will be available at: `http://localhost:5173`

---

## 12. How to Use

1. Open `http://localhost:5173` in your browser
2. Click **Upload PDF** and select any PDF file (research paper, report, manual, etc.)
3. Wait for the upload confirmation — you'll see the filename and the number of chunks created
4. Type your question in the input box and press **Ask**
5. The answer will appear along with the **source page numbers** it was derived from

---

## 13. Design Decisions & Trade-offs

| Decision | Rationale |
|---|---|
| **FAISS over a hosted vector DB** | Zero external dependencies, no cloud costs during development, sufficient for single-document RAG |
| **BAAI/bge-base-en over all-MiniLM** | Better retrieval quality on BEIR benchmarks; 768d vs 384d gives more expressive semantic space |
| **Two-stage retrieval** | Bi-encoder is fast for recall; cross-encoder is slow but precise for ranking. Combined, they're both fast and accurate |
| **Groq API over OpenAI** | Dramatically lower latency due to LPU hardware; free tier is generous for development |
| **`faiss-cpu`** | Avoids forcing GPU dependencies on the server; embeddings already use GPU if available |
| **IndexFlatL2 (exact search)** | For small single-document corpora (~50-200 chunks), exact search is fast enough. Production systems with millions of chunks would use `IndexIVFFlat` or `HNSW` |
| **Session-based (clear on upload)** | Each upload resets the index — simplest multi-session strategy for a single-user demo. Multi-document support would require a persistent, filtered index |

---

## 14. Known Limitations & Future Work

| Limitation | Future Improvement |
|---|---|
| Only one document at a time | Add multi-document support with per-document FAISS namespaces |
| No user authentication | Add JWT-based auth (FastAPI-Users) |
| FAISS is not production-scalable | Migrate to a hosted vector DB (Pinecone, Weaviate, ChromaDB) |
| Flat index — no ANN approximation | Use `IndexHNSWFlat` or `IndexIVFFlat` for large corpora |
| No chat history / conversation memory | Add conversation buffer for follow-up questions |
| No streaming LLM responses | Implement SSE streaming for real-time answer display |
| PDF only | Add support for `.docx`, `.txt`, `.md`, and web URLs |

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

---

*Built with ❤️ using FastAPI, Sentence-Transformers, FAISS, Groq, and React.*
