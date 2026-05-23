# SkillForge AI Backend — Engine Engine
> Stateful Multi-Agent Adaptive Learning Orchestrator · LangGraph + FastAPI + Qdrant + Postgres + Redis

This directory contains the complete backend service for **SkillForge AI** — an adaptive EdTech system that constructs personalized learning sequences based on diagnostic competency mappings.

---

## 🏗️ Folder Structure

```
skillforge/
├── app/
│   ├── main.py                    # FastAPI app (port 8001) + WebSockets
│   ├── core/
│   │   └── config.py              # Environment configuration
│   ├── models/
│   │   └── schemas.py             # Pydantic schema validation
│   ├── db/
│   │   ├── postgres.py            # Relational database & self-healing SQLite
│   │   ├── qdrant.py              # Vector search client & fastembed
│   │   └── redis_client.py        # Caching & self-healing memory client
│   ├── agents/
│   │   ├── state.py               # TypedDict state structure
│   │   ├── diagnostic_agent.py    # Adaptive quiz generator
│   │   ├── planner_agent.py       # DAG resolve & remediation
│   │   ├── retrieval_agent.py     # Metadata RAG fetcher
│   │   ├── evaluation_agent.py    # Semantic answer grading
│   │   ├── intervention_agent.py  # Performance velocity monitor
│   │   └── orchestrator.py        # LangGraph StateGraph compiler
│   ├── api/
│   │   ├── sessions.py            # Sessions endpoints
│   │   ├── quiz.py                # Diagnostic quiz endpoints
│   │   ├── path.py                # Learning path endpoints
│   │   ├── evaluate.py            # Evaluation endpoints
│   │   └── websocket.py           # Connection managers
│   └── services/
│       └── llm.py                 # 3-key Groq pool manager
├── data/
│   ├── questions/
│   │   ├── dsa.json               # Hand-curated DSA questions
│   │   └── computer_fundamentals.json # Hand-curated OS/DBMS/CN questions
│   └── resources/
│       ├── dsa.json               # DSA study notes & textbook
│       └── computer_fundamentals.json
└── scripts/
    └── ingest_curriculum.py       # Ingests JSON curriculum into Qdrant
```

---

## ⚡ Self-Healing DB Engine (Docker-Free Mode)

The backend features an autonomous **self-healing network audit**. If Docker Desktop is offline during server startup:
1.  **Qdrant** automatically falls back to local SQLite vector indexing in `temp_uploads/local_qdrant_sf`.
2.  **Redis** automatically falls back to a python dictionary-based `InMemoryRedisClient` for session caching.
3.  **PostgreSQL** automatically falls back to local `aiosqlite` databases in `temp_uploads/skillforge_local.db` on-the-fly.

This means you can run the entire system offline without running a single docker container!

---

## 🚀 Getting Started

To run the backend server locally:

```bash
# From workspace root directory
.\venv\Scripts\python.exe -m uvicorn skillforge.app.main:app --port 8001
```

Once started, the API docs are accessible at: `http://127.0.0.1:8001/docs`

---

## 🔌 API Route Overview

### Sessions
*   `POST /sessions`: Starts a new session `{student_name, subject}`.
*   `GET /sessions/{session_id}`: Retrieves student competency mappings.

### Adaptive Quiz
*   `GET /sessions/{session_id}/quiz/next`: Resolves the next adaptive quiz question.
*   `POST /sessions/{session_id}/quiz/answer`: Evaluates quiz answer and adjusts difficulty.

### Learning Path
*   `GET /sessions/{session_id}/path`: Returns path nodes and React Flow edges.
*   `GET /sessions/{session_id}/path/current`: Retrieves active RAG study notes and exercises.

### Exercise & WebSockets
*   `POST /sessions/{session_id}/evaluate`: Submits short-answer exercise and ignites LangGraph.
*   `WS /ws/{session_id}`: Real-time broadcast pushes for nudges, scores, and path reroutes.
