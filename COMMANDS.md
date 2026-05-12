# A.R.C.H.E.R. Project Command Cheat Sheet

This file contains all the essential terminal commands required to run, develop, and test the A.R.C.H.E.R. (Autonomous Retrieval & Contextual Hybrid Engine for Reasoning) platform on Windows.

---

## 1. Environment Setup
Always ensure your Python virtual environment is activated before running backend commands.

**Activate Virtual Environment (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```
*(If you see `(venv)` at the start of your terminal prompt, it is activated.)*

---

## 2. Infrastructure (Databases)
The project relies on Docker for vector search (Qdrant), graph reasoning (Neo4j), and caching/celery (Redis).

**Start all databases in the background:**
```powershell
docker-compose up -d
```

**Check database logs:**
```powershell
docker-compose logs -f
```

**Stop all databases:**
```powershell
docker-compose down
```

**Wipe all database data (Hard Reset):**
```powershell
docker-compose down -v
```

---

## 3. Backend (FastAPI AI Engine)
The Python backend handles LangGraph orchestration, embeddings, and LLM communication.

**Start the FastAPI server (Development Mode):**
```powershell
.\venv\Scripts\uvicorn app.main:app --reload --reload-dir app
```
*The backend will be available at: http://127.0.0.1:8000*
*Swagger API Documentation: http://127.0.0.1:8000/docs*

---

## 4. Frontend (React / Vite UI)
The beautiful dark-mode interface matching your portfolio aesthetic.

**Start the Vite Development Server:**
```powershell
npm run dev --prefix frontend
```
*The frontend will be available at: http://localhost:5173*

**Install new frontend dependencies:**
```powershell
npm install <package-name> --prefix frontend
```

---

## 5. Testing & Debugging
Useful scripts to test the agentic pipeline without the frontend.

**Run the End-to-End Test Script:**
*(This uploads a test document, waits for embeddings, and queries the LLM pipeline)*
```powershell
.\venv\Scripts\python test_e2e.py
```

**Check Python Dependencies:**
```powershell
.\venv\Scripts\pip freeze
```

---

## 🚀 Quick Start (Running the full app)
If you are opening VS Code fresh, you need 3 terminal tabs to run the project:

1. **Terminal 1 (Docker):** `docker-compose up -d`
2. **Terminal 2 (Backend):** `.\venv\Scripts\uvicorn app.main:app --reload --reload-dir app`
3. **Terminal 3 (Frontend):** `npm run dev --prefix frontend`
