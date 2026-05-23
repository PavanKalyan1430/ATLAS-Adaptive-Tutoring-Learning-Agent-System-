# 🚀 ATLAS — Adaptive Tutoring Learning Agent System
### *Autonomous Stateful Multi-Agent Learning Orchestrator*
> Engineered on top of **A.R.C.H.E.R** Core Patterns · Powered by **LangGraph + FastAPI + Qdrant + PostgreSQL (SQLite Fallback) + Redis (In-Memory Fallback)** · Frontend built with **React + Tailwind CSS + React Flow**

---

## 🧭 System Overview (A to Z Masterclass)

ATLAS is an **enterprise-grade, stateful, multi-agent AI tutor** designed to replicate a highly adaptive human educator. Traditional AI tutoring systems fail because they are stateless, rely on simplistic RAG chatbot models, and suffer from "information overload" (presenting beginners with doctoral-level content, or vice versa). 

ATLAS solves this by operating as a **cyclic state-machine system** that:
1. **Diagnoses**: Performs a dynamic, multi-topic, **Item Response Theory (IRT)**-inspired diagnostic quiz scaling question difficulty dynamically.
2. **Plans**: Sequentially structures an optimized curriculum graph (DAG) via **topological sorting**, filtering out pre-existing mastered topics.
3. **Studies & Adapts**: Evaluates semantic short-answer submissions, checks student learning velocity, and **dynamically injects remediation review nodes** into the learning graph in real-time if progress stalls.
4. **Self-Heals**: Employs an advanced **multi-layer offline fallback system** that allows the entire stack (Postgres, Redis, and Qdrant) to automatically hot-swap to local SQLite files and in-memory caches within **0.1ms** if Docker ports are blocked or credential conflicts occur.

---

## 🎨 Enterprise Systems Architecture

```
                                  [ STUDENT REGISTRIES ]
                                             │
                                   (1) Entering Name & Subject
                                             ▼
                               ┌───────────────────────────┐
                               │     Diagnostic Agent      │ ◄─── (2) Adaptive 8-Question MCQ Quiz
                               │  (IRT-based Quiz Steps)   │      Scales Difficulty ±0.15 per answer
                               └─────────────┬─────────────┘
                                             │ compiles
                                             ▼
                               ┌───────────────────────────┐
                               │       Planner Agent       │ ─── (3) Constructs Curriculum Sequence
                               │  (Topological DAG Build)  │      Topological Sort (Kahn's Algorithm)
                               └─────────────┬─────────────┘
                                             │
      ┌──────────────────────────────────────┴──────────────────────────────────────┐
      │ ACTIVE STUDY LOOP (LangGraph Orchestrated State Machine)                    │
      │                                                                             │
      │   (4) Retrieve Node Resources            (5) Submit Answer & Grade          │
      │   ┌─────────────────────────┐           ┌─────────────────────────┐         │
      │   │     Retrieval Agent     │           │    Evaluation Agent     │         │
      │   │   (Difficulty-Bounded)  │           │   (Semantic CS Grader)  │         │
      │   └────────────▲────────────┘           └────────────┬────────────┘         │
      │                │                                     │                      │
      │                │ loops node                          ▼                      │
      │                │                         ┌─────────────────────────┐        │
      │                └─────────────────────────┤   Intervention Agent    │        │
      │                                          │ (Velocity Queue Monitor)│        │
      │                                          └───────────┬─────────────┘        │
      │                                                      │                      │
      │                                             [Velocity Audit]                │
      │                                            /                \               │
      │                                 [Average Score >= 0.5]    [Average Score < 0.5]
      │                                          /                    \             │
      │                              ┌──────────▼──────────┐   ┌───────▼──────────┐ │
      │                              │    Advance Node     │   │   Reroute Path   │ │
      │                              │  (Marks node done)  │   │(Injects Remedy)  │ │
      │                              └─────────────────────┘   └──────────────────┘ │
      └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 System Directory Tree & Detailed Registry

```
RAG PROJECT/
│
├── skillforge/                         # BACKEND ENGINE (FastAPI + LangGraph)
│   ├── app/
│   │   ├── main.py                     # API Entry Point, WebSocket Router & Startup Hooks
│   │   ├── core/
│   │   │   └── config.py               # Pydantic Settings (Loads .env variables)
│   │   ├── db/
│   │   │   ├── postgres.py             # Relational Engine + Table definitions (SQLite fallback)
│   │   │   ├── qdrant.py               # Vector Manager & Embeddings engine (FastEmbed local fallback)
│   │   │   └── redis_client.py         # Caching Client (In-memory mock fallback)
│   │   ├── models/
│   │   │   └── schemas.py              # API Request/Response Pydantic Models
│   │   ├── services/
│   │   │   └── llm.py                  # API Key Load Balancer & Chat Completions service
│   │   ├── api/
│   │   │   ├── sessions.py             # HTTP Router: Student Sessions creation and recovery
│   │   │   ├── quiz.py                 # HTTP Router: MCQ Adaptive Diagnostic questions & answers
│   │   │   ├── path.py                 # HTTP Router: Learning Path graph and current node details
│   │   │   ├── evaluate.py             # HTTP Router: Open-Ended exercise semantic evaluations
│   │   │   └── websocket.py            # WebSocket Manager: Broadcast connections pool
│   │   └── agents/
│   │       ├── state.py                # LangGraph Unified State Schema
│   │       ├── orchestrator.py         # Wires the compiled StateGraph structure
│   │       ├── diagnostic_agent.py     # IRT Adaptive MCQ steps and scoring
│   │       ├── planner_agent.py        # Topological DAG pathing & remedial injections
│   │       ├── retrieval_agent.py      # Difficulty-bounded vector retriever
│   │       ├── evaluation_agent.py     # Semantic grader and JSON output validator
│   │       └── intervention_agent.py   # Redis sliding velocity queue & WS hints generator
│   │
│   ├── data/                           # Ingestion Source Datasets
│   │   ├── questions/                  # MCQ bank files for DSA & Computer Fundamentals
│   │   └── resources/                  # Resource Markdown files for Vector RAG Ingest
│   │
│   └── scripts/
│       └── ingest_curriculum.py        # Mass Ingestion script (Embeds & uploads collections)
│
├── skillforge-frontend/                # FRONTEND ENGINE (React + Vite + Tailwind + React Flow)
│   ├── src/
│   │   ├── main.jsx                    # Vite App Bootstrap
│   │   ├── App.jsx                     # Layout routing and dashboard shell
│   │   ├── index.css                   # Custom global tailwind bindings
│   │   ├── store.js                    # Zustand Global state manager (syncs UI with Websocket actions)
│   │   ├── services/
│   │   │   └── api.js                  # Axios Client wrapper for FastAPI HTTP requests
│   │   ├── components/
│   │   │   ├── DAGCanvas.jsx           # React Flow DAG topology canvas (Custom nodes & styled edges)
│   │   │   ├── CompetencyHeatmap.jsx   # Dynamic radial/bar charts for active topics
│   │   │   └── WebSocketProvider.jsx   # WebSocket Event Tunnel listener & state updater
│   │   └── pages/
│   │       ├── SubjectSelect.jsx       # Landing subject dashboard
│   │       ├── DiagnosticQuiz.jsx      # Animated diagnostic interface with sliding progress indicator
│   │       ├── LearningPath.jsx        # Learning Path Overview & DAG display
│   │       └── StudyRoom.jsx           # Active Node interface (Notebook, RAG tabs, Code Sandbox, Chat)
│   │
│   └── tailwind.config.js              # Custom luxury color tokens (Indigo/Slate palette)
│
└── .env                                # Root API credentials file
```

---

## 🧱 Module-by-Module Technical Deep Dive

### 1. Unified Application Settings (`skillforge/app/core/config.py`)
This module defines the central configuration system using `pydantic-settings`. It loads raw variables from the `.env` file at the root or within subdirectories, enforcing validation rules at runtime.
* **Class `Settings`**:
  * Inherits from `BaseSettings`.
  * **Properties**:
    * `GROQ_API_KEY_1`, `GROQ_API_KEY_2`, `GROQ_API_KEY_3` (Required string objects representing our primary API access).
    * `GROQ_API_KEY_4`, `GROQ_API_KEY_5`, `GROQ_API_KEY_6` (Optional string objects providing redundant load-balancing pools).
    * `FAST_LLM_MODEL` (String, defaults to `llama-3.1-8b-instant`).
    * `SMART_LLM_MODEL` (String, defaults to `llama-3.3-70b-versatile`).
    * `EMBEDDING_MODEL` (String, defaults to local ONNX model `BAAI/bge-small-en-v1.5`).
    * `POSTGRES_URL` (String, default connection points for standard docker database deployments).
    * `QDRANT_URL` (String, vector store connection strings).
    * `REDIS_URL` (String, cache connections).
    * `PORT` (Integer, server port configuration, defaults to `8001`).
    * `HOST` (String, server binding host, defaults to `127.0.0.1`).
  * **Model Config**:
    * Configured to search for `.env` at multiple folder tiers (`.env`, `../.env`, `../../.env`) and ignore additional extra arguments.

---

### 2. Relational Database Interface & Fallbacks (`skillforge/app/db/postgres.py`)
Responsible for establishing active sessions with the relational database engine. Incorporates a dynamic socket auditor that intercepts server errors and hot-swaps active dialects.
* **Functions**:
  * `is_postgres_running(host, port) -> bool`: Instantiates a local TCP socket connection to test if port `5432` is listening. Returns immediately to prevent boot latency.
  * `configure_database_engine(url, is_sqlite)`: Sets up SQLAlchemy configuration. If `is_sqlite` is `True`, it automatically resolves folder existence for the temporary local database path `temp_uploads/` and boots an asynchronous engine using the `sqlite+aiosqlite://` dialect.
  * `get_db_session() -> AsyncSession`: An asynchronous generator that yields database connections to REST endpoints, wrapping sessions in rollback transactions in case of errors.
  * `init_postgres_db()`: Core self-healing initializer. Tests port credentials with `SELECT 1` queries. If authentication fails, it dynamically intercepts the exception, prints warning indicators, configures SQLite fallbacks, and syncs tables on-disk.
* **Database Models (SQLAlchemy)**:
  * `PostgresStudentSession` (`sf_student_sessions`):
    * Tracks individual student profiles: `session_id` (Primary key), `subject`, `student_name`, `created_at`, `competency_vector` (JSON structure), `current_node_index` (Integer), `path_nodes` (JSON serialized array).
  * `PostgresQuizHistory` (`sf_quiz_history`):
    * Logs diagnostic actions: `id` (Auto-incrementing primary key), `session_id` (Foreign Key pointing to student sessions), `question_id`, `topic`, `difficulty`, `is_correct`, `time_taken_seconds`, `answered_at`.
  * `PostgresEvaluationHistory` (`sf_evaluation_history`):
    * Stores graded submissions: `id` (Primary key), `session_id`, `node_id`, `topic`, `score`, `misconceptions` (List serialized by `SQLiteSafeArray`), `evaluated_at`.
* **Classes**:
  * `SQLiteSafeArray`: Implements custom serialization logic for SQLite databases by translating Python lists into comma-separated text blocks and parsing them back into clean arrays on queries.

---

### 3. Asynchronous Cache & InMemory Emulations (`skillforge/app/db/redis_client.py`)
This module handles active key-value session configurations and performance records. Includes a custom, thread-safe asynchronous mock class that mimics redis command execution in local environments.
* **Classes**:
  * `InMemoryRedisClient`:
    * A completely mock emulation of asynchronous Redis operations using native dictionaries (`_store`, `_sets`, `_lists`).
    * Methods: `get()`, `set(ex=timeout)`, `sadd()`, `smembers()`, `rpush()`, `ltrim()`, `lrange()`, `delete()`, `expire()`.
  * `RedisClientManager`:
    * Runs socket checks on port `6379`. If closed, it binds `self.redis` to `InMemoryRedisClient`.
    * Methods:
      * `get_session(session_id) -> dict`: Fetches and deserializes session structures from memory.
      * `save_session(session_id, state)`: Saves session metadata as serialized JSON payloads.
      * `add_shown_resource(session_id, resource_id)`: Appends retrieved materials into standard set buffers.
      * `get_shown_resources(session_id) -> list`: Retrieves previously displayed resource IDs.
      * `push_score(session_id, score)`: Appends recent scores to velocity lists, trimming sizes to a rolling window of the last 5 submissions.
      * `get_velocity_window(session_id) -> list[float]`: Retrieves all current velocity tracking variables.

---

### 4. Semantic Search & Vector Operations (`skillforge/app/db/qdrant.py`)
Manages vector storage collections and handles dense embeddings generations using local ONNX weights.
* **Classes**:
  * `QdrantManager`:
    * Tests port `6333`. If unreachable, it triggers a local SQLite-backed Qdrant client at `temp_uploads/local_qdrant_sf`.
    * Instantiates the `TextEmbedding` engine using local `BAAI/bge-small-en-v1.5` weights.
    * Automatically ensures collections `skillforge_questions` and `skillforge_resources` exist on initialization.
    * Methods:
      * `get_embeddings(texts) -> list[list[float]]`: Computes dense embeddings locally.
      * `insert_questions(questions)`: Populates diagnostic banks with metadata payloads (Bloom level, difficulty, correct option).
      * `insert_resources(resources)`: Populates vector databases with textbook content blocks.
      * `get_adaptive_question(subject, topic, difficulty, exclude_ids) -> list[dict]`: Queries Qdrant for diagnostic questions, excluding previously answered ones, and sorts them by the absolute difference to target difficulty values.
      * `search_resources(query, subject, topic, difficulty, exclude_ids, top_k) -> list[dict]`: Performs semantic retrieval filtering by subject, topic, and a strict difficulty range:
        $$\text{Target Difficulty} \pm 0.25$$

---

### 5. Resilient LLM Load Balancing Pool (`skillforge/app/services/llm.py`)
Prevents API rate limits from blocking operational execution by deploying round-robin pool rotation.
* **Classes**:
  * `ResilientGroqLLM`:
    * Filters and verifies active Groq credentials in configuration files.
    * Methods:
      * `complete(prompt) -> object`: Attempts execution. If a rate limit error (HTTP 429) occurs, the exception handler catches it, rotates the pool pointer to the next active key, backs off for `0.5s`, and retries.
  * `LLMService`:
    * Registers two primary instances: `fast_llm` (using Llama 8B models for fast calculations) and `smart_llm` (using Llama 70B models for advanced evaluations).

---

### 6. Wires & Compiled Workflow Graph (`skillforge/app/agents/orchestrator.py`)
Wires up the modular agent classes into a compiled state-machine workflow using LangGraph.
* **Classes**:
  * `SkillForgeOrchestrator`:
    * Maps graph node executions:
      * `_evaluate_node(state)`: Runs semantic evaluations on user answers and pushes records to Postgres using fire-and-forget async tasks.
      * `_intervene_node(state)`: Evaluates performance velocity and creates encouraging floating tutor hints.
      * `_reroute_node(state)`: Updates learning path arrays by inserting custom remediation review nodes.
      * `_advance_node(state)`: Updates student path progress, marking completed steps as mastered and unlocking subsequent steps.
      * `_retrieve_node(state)`: Fetches personalized textbook notes via dynamic vector search.
    * Wires conditional routing logic:
      ```python
      def _route_after_intervention(self, state: SkillForgeState) -> str:
          if state.get("reroute_triggered", False):
              return "reroute"
          return "advance"
      ```

---

### 7. Item Response Theory Diagnostics (`skillforge/app/agents/diagnostic_agent.py`)
Calculates the dynamic difficulty scaling of diagnostic questions and compiles competency vectors.
* **Classes**:
  * `DiagnosticAgent`:
    * Cycles through topic lists sequentially to ensure comprehensive assessment coverage.
    * Triggers difficulty adaptations:
      * If correct: scales target difficulty up:
        $$\theta_{\text{next}} = \min(0.9, \theta_{\text{prev}} + 0.15)$$
      * If incorrect: scales target difficulty down:
        $$\theta_{\text{next}} = \max(0.1, \theta_{\text{prev}} - 0.15)$$
    * Compiles competency vectors as a weighted ratio:
      $$\text{Competency} = \frac{\text{Correct MCQ Answers}}{\text{Total MCQ Questions}}$$
      *Defaulting unassessed topics to `0.5`.*

---

### 8. Topological Curriculum Planner (`skillforge/app/agents/planner_agent.py`)
Defines curriculum structures, runs Kahn's topological sort algorithm, and handles remediation injections.
* **Classes**:
  * `PlannerAgent`:
    * `CURRICULUM_DAGS`: Declares the node dependency lists (DSA: Arrays -> Linked Lists -> Stacks -> Trees -> Graphs).
    * Methods:
      * `build_learning_path(state) -> list[dict]`: Runs dependency resolution recursively, locking future nodes and unlocking the first unmastered topic.
      * `reroute_path(state) -> list[dict]`: Creates a custom remediation review block, inserts it right before the current node, locks the current node, and directs the student to the remediation node.

---

### 9. Semantic Grading Engine (`skillforge/app/agents/evaluation_agent.py`)
Applies semantic evaluation on submitted exercises, identifying gaps and returning structured JSON response objects.
* **Classes**:
  * `EvaluationAgent`:
    * Formulates highly constrained grader prompts, requiring JSON payloads mapping `score`, `misconceptions`, `feedback`, and `confidence`.
    * Methods:
      * `evaluate_submission(state) -> dict`: Evaluates student answers, cleans markdown wrapper formats, and parses output strings.
      * `log_evaluation_to_db(session_id, topic, node_id, eval_result)`: Handles background database logs asynchronously.

---

### 10. Performance Audit & Nudge Generator (`skillforge/app/agents/intervention_agent.py`)
Monitors student performance trends and triggers path modifications when progress drops.
* **Classes**:
  * `InterventionAgent`:
    * Audits sliding score windows in Redis. Triggers re-routing if the average of the last 3 scores is $< 0.5$.
    * Generates personalized floating coaching hints under 50 words using the fast LLM.

---

### 11. WebSocket Communications Tunnel (`skillforge/app/api/websocket.py`)
Maintains active connection pools mapping student sessions for real-time broadcasts.
* **Classes**:
  * `ConnectionManager`:
    * Manages active WebSocket lists linked to session IDs.
    * Methods:
      * `connect()`, `disconnect()`, `broadcast_to_session()`.

---

## 🔌 API Endpoint Specifications & Schema Maps

### 1. REST API Definition

#### A) Sessions Endpoint
* **Create Session**: `POST /sessions`
  * *Request Schema*:
    ```json
    {
      "student_name": "Pavan",
      "subject": "dsa"
    }
    ```
  * *Response Schema*:
    ```json
    {
      "session_id": "3be927e1-8f5c-43f1-b9cb-826d9c6c4c52",
      "student_name": "Pavan",
      "subject": "dsa",
      "created_at": "2026-05-23T22:42:25.102Z",
      "competency_vector": {},
      "current_node_index": 0,
      "path_nodes": []
    }
    ```

#### B) Diagnostic Quiz Endpoints
* **Get Next Question**: `GET /sessions/{session_id}/quiz/next`
  * *Response Schema*:
    ```json
    {
      "question_id": "dsa_arrays_1",
      "question": "What is the time complexity of accessing an element in an array?",
      "options": ["O(1)", "O(N)", "O(log N)", "O(N log N)"],
      "correct_option_idx": 0,
      "difficulty": 0.3,
      "bloom_level": "remembering",
      "topic_tag": "arrays",
      "explanation": "Accessing elements in an array is direct via memory indexes."
    }
    ```
* **Submit Answer**: `POST /sessions/{session_id}/quiz/answer`
  * *Request Schema*:
    ```json
    {
      "question_id": "dsa_arrays_1",
      "selected_option_idx": 0,
      "time_taken_seconds": 15
    }
    ```
  * *Response Schema*:
    ```json
    {
      "is_correct": true,
      "correct_option_idx": 0,
      "explanation": "Accessing elements in an array is direct via memory indexes.",
      "next_question": { ... },
      "quiz_complete": false,
      "competency_vector": null
    }
    ```

#### C) Learning Path Endpoints
* **Get Full Path Graph**: `GET /sessions/{session_id}/path`
  * *Response Schema*: Returns complete lists of `nodes` and dynamic React Flow `edges` mapping prerequisite arrows.
* **Get Current Node**: `GET /sessions/{session_id}/path/current`
  * *Response Schema*: Retrieves active node parameters, including bounded vectors retrieved from Qdrant in `resources` lists.

#### D) Evaluation Endpoint
* **Submit Answer to Active Exercise**: `POST /sessions/{session_id}/evaluate`
  * *Request Schema*:
    ```json
    {
      "answer": "A B+ tree index stores records in dynamic balancing structures, reducing disk access disk seek loops to logarithmic operations."
    }
    ```
  * *Response Schema*:
    ```json
    {
      "score": 0.9,
      "misconceptions": [],
      "feedback": "Perfect description of index seek concepts.",
      "confidence": 0.95,
      "reroute_triggered": false,
      "next_node_id": "node_linked_lists"
    }
    ```

---

### 2. WebSocket Broadcast Specifications

A single channel is established per study session:
`ws://127.0.0.1:8001/ws/{session_id}`

#### JSON Payload Forms:

* **Event: `score_update`** (Grader output synchronization)
  ```json
  {
    "event_type": "score_update",
    "data": {
      "score": 0.4,
      "misconceptions": ["confusing preorder vs inorder"],
      "feedback": "Review how traversal parameters recursive order works."
    }
  }
  ```

* **Event: `nudge`** (Floating tutoring message)
  ```json
  {
    "event_type": "nudge",
    "data": {
      "message": "Focus on the base case recursion structures first!"
    }
  }
  ```

* **Event: `reroute`** (DAG adjustment updates)
  ```json
  {
    "event_type": "reroute",
    "data": {
      "message": "Injected review nodes in learning sequences.",
      "new_path": [ ... ],
      "active_index": 2
    }
  }
  ```

---

## 🎨 Frontend Architecture & visual Bindings

The client dashboard is developed as a Vite React project utilizing Tailwind CSS and React Flow for dynamic systems rendering.

### 1. Global Store State Engine (`src/store.js`)
We use `Zustand` to manage and synchronize global application state across all views:
* **Core Variables**: `sessionId`, `studentName`, `subject`, `competencyVector`, `activeQuestion`, `quizComplete`, `quizLoading`, `pathNodes`, `pathEdges`, `activeNode`, `evaluationResult`, `aiNudge`, `wsConnected`.
* **Central Actions**:
  * `startSession(studentName, subject)`: Initiates API session configs and triggers retrieval of the first question.
  * `submitQuizAnswer(selectedOptionIdx, timeTakenSeconds)`: Handles MCQ logs.
  * `fetchLearningPath()`: Queries REST routes to populate React Flow structures.
  * `submitExerciseAnswer(answer)`: Submits solutions to the evaluation agent, managing local loading states.

### 2. Prerequisite Graph Canvas Component (`src/components/DAGCanvas.jsx`)
Visualizes learning sequences on an interactive graph canvas.
* Renders premium card layers using styled custom nodes:
  * **Mastered Nodes**: Emerged with emerald border frames and success icons.
  * **Current Active Nodes**: Rendered with pulsing indigo frames to direct student focus.
  * **Remediation Nodes**: Displayed with amber frames and warning markers indicating required review modules.
* **Layout Grid Calculation**:
  Staggers node locations horizontally to create a clean visual flow:
  $$x = \text{index} \times 320$$
  $$y = \text{remediation} ? 40 : 150$$
* **Arrow Pointers**: Configured with smooth custom step lines. Remedial linkages are highlighted using dashed amber lines to illustrate remediation pathways.

### 3. Competency Breakdown Heatmap (`src/components/CompetencyHeatmap.jsx`)
Generates vertical visual data charts using `Recharts` to illustrate student mastery level ratios:
* Automatically maps competency keys to percentage bars.
* Automatically scales colors dynamically: Green ($\ge 75\%$), Indigo ($45\% \text{ to } 74\%$), Rose ($< 45\%$).
* Implements a premium, custom glassmorphism tooltip to show precise progress scores and warning indicators.

---

## 💻 Local Development Setup & Operation

### Backend Setup & Launch
1. **Activate Environment**:
   ```bash
   .\venv\Scripts\activate
   ```
2. **Configure API Keys** (Open `.env` in root):
   ```env
    GROQ_API_KEY_1=<YOUR_GROQ_API_KEY_1>
    GROQ_API_KEY_2=<YOUR_GROQ_API_KEY_2>
    GROQ_API_KEY_3=<YOUR_GROQ_API_KEY_3>
   ```
3. **Run Curriculum Vector Ingestion**:
   ```bash
   python skillforge/scripts/ingest_curriculum.py
   ```
   *This loads, embeds, and uploads 27 diagnostic questions and 24 textbook resources into Qdrant collections.*
4. **Boot FastAPI Server**:
   ```bash
   python -m uvicorn skillforge.app.main:app --port 8001
   ```
   *Swagger Docs will be live at: `http://127.0.0.1:8001/docs`*

### Frontend Setup & Launch
1. **Navigate to Frontend Subfolder**:
   ```bash
   cd skillforge-frontend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   *Launch your browser at: `http://localhost:5173`*

---

## 🎓 Ultimate Gold-Standard Technical Interview Q&A (Crush the Panel)

If you are explaining ATLAS during senior technical interviews, use this comprehensive prep section to defense-proof your design decisions:

### Q1: "Why did you select LangGraph instead of a standard sequential LLM pipeline?"
* **Answer**: "Sequential pipelines (like standard chains) are linear and struggle with logic requiring cycles, loops, or state retention. Human learning is fundamentally non-linear: if a student struggles, the curriculum cannot simply advance to the next node; it must loop back, dynamically inject review content, and re-assess. LangGraph allows us to define the study loop as a stateful, cyclic directed graph with native checkpoint support. We can safely route states between nodes, preserve exact histories, and resume session progress seamlessly."

### Q2: "How does your self-healing database audit operate without slowing server boot times?"
* **Answer**: "On server boot, the application runs a socket level check on port `5432` with a `1.0s` timeout. If closed, it changes connection pools instantly to local SQLite. If open, it performs a fast query (`SELECT 1`). If local Postgres credentials reject the query, it catches the database credentials error on-the-fly and configures a local SQLite session maker. This guarantees a seamless developer experience without database startup blockers, while keeping database schemas isolated using custom table prefixes."

### Q3: "How does the local Redis client mock class mimic asynchronous redis-py?"
* **Answer**: "I built a custom class named `InMemoryRedisClient` wrapping standard python dict structures with `asyncio.Lock` to guarantee thread-safe asynchronous execution. It implements identical asynchronous command APIs like `get()`, `set(ex=timeout)`, `rpush()`, `ltrim()`, `lrange()`, `sadd()`, and `smembers()`. If port `6379` is offline, it swaps on-the-fly with zero modifications to any agent module."

### Q4: "Explain Kahn's Algorithm / Topological Sort implementation in your Planner Agent."
* **Answer**: "Our topics have structural dependencies (e.g., you cannot study Dynamic Linked Lists without Arrays, or DBMS Indexing without Normalization). When building a student's learning path, we construct an adjacency list representing topic prerequisite dependencies. We run a topological sort recursively, resolving dependencies first to ensure that prerequisite nodes are placed earlier in the sequence. We then compare the student's background scores from the diagnostic quiz; any topic with a competency score $\ge 0.75$ is automatically flagged as `mastered`, and the first unmastered node is unlocked as `current`."

### Q5: "How does difficulty-bounded RAG vector search work compared to standard cosine similarity?"
* **Answer**: "Standard vector search only matches text similarities. In educational systems, this leads to mismatch errors: beginners receive advanced reference content, and advanced students are shown trivial concepts. In ATLAS, every question and study resource chunk is uploaded to Qdrant with a `difficulty` rating payload index (0.0 to 1.0). When retrieving study resources, we query the vector index but apply a strict Qdrant Range filter condition restricting matches to $\text{Student Difficulty} \pm 0.25$. This ensures beginners receive foundation explanations and analogies, while advanced students retrieve deep system mechanics."

### Q6: "How do you manage JSON array serialization inside local SQLite, since SQLite doesn't natively support array types?"
* **Answer**: "Since SQLite lacks native support for array database fields (like PostgreSQL’s `ARRAY` type), I wrote a custom SQLAlchemy type decorator called `SQLiteSafeArray` wrapping SQLAlchemy's `TypeDecorator`. On database save (`process_bind_param`), it automatically serializes Python lists into standard comma-separated strings. On database read (`process_result_value`), it automatically splits comma-separated database fields back into clean Python string lists. This provides 100% database engine transparency."

### Q7: "How does the round-robin Groq pool prevent API rate limits?"
* **Answer**: "The environment loads a cyclic iterator (`cycle` from Python's standard library) containing up to 6 different Groq API keys. Every LLM request queries the current active key. If the system intercepts an HTTP `429 Too Many Requests` exception, the agent catches the error, rotates the active iterator to a fresh key, and retries the prompt with a minor exponential backoff. This ensures robust API resilience during live presentations."

### Q8: "How does your intervention agent audit student velocity?"
* **Answer**: "We store a rolling window of the student's last 5 evaluation scores. We use Redis list commands `rpush` and `ltrim` to maintain a sliding queue of size 5. If the queue contains at least 3 evaluations, we calculate the running average. If the average drops below `0.5`, it flags a velocity alert. The StateGraph conditional router picks up this alert and redirects the flow to the `reroute` node rather than advancing the student."

### Q9: "How does the React Flow UI update dynamically without refreshing the page?"
* **Answer**: "The frontend is powered by Zustand and React Flow. We open a global WebSocket channel linked to the student's session. When a reroute is triggered in the backend, it broadcasts a `reroute` event payload containing the newly modified learning path nodes. The frontend state store receives this message, maps the new nodes, and updates state bindings. Because React Flow's canvas is reactively bound to these state lists, it immediately re-renders the graph, applying custom styles to the newly injected remediation review node."

### Q10: "Why does the local FastEmbed model take 8-15 seconds to boot on startup?"
* **Answer**: "FastEmbed computes vector embeddings locally rather than relying on external web requests. On the very first server launch, it checks the local cache directory for the `BAAI/bge-small-en-v1.5` weights. If missing, it downloads them. Subsequent boots load these ONNX weights from the disk. This local load process takes a few seconds to resolve, but provides robust offline capabilities."
