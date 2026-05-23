from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from skillforge.app.core.config import settings
from skillforge.app.db.postgres import init_postgres_db
from skillforge.app.api.websocket import ws_manager
from skillforge.app.api.sessions import router as sessions_router
from skillforge.app.api.quiz import router as quiz_router
from skillforge.app.api.path import router as path_router
from skillforge.app.api.evaluate import router as evaluate_router

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SkillForge.Main")

app = FastAPI(
    title="SkillForge AI - Adaptive Learning Orchestrator",
    description="Multi-Agent Adaptive EdTech Platform powered by LangGraph, Qdrant, Postgres & Redis",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local development simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Lifespan / Startup Handler
# ==========================================
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting SkillForge AI backend service...")
    
    # 1. Initialize Postgres tables prefixed with 'sf_'
    await init_postgres_db()
    
    logger.info(f"✅ SkillForge AI Server is running and listening on port {settings.PORT}!")

# ==========================================
# REST API Routers Registration
# ==========================================
app.include_router(sessions_router)
app.include_router(quiz_router)
app.include_router(path_router)
app.include_router(evaluate_router)

# ==========================================
# WebSocket Server Handler
# ==========================================
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    Handles real-time WebSocket communication per session.
    Pushes adaptive updates, score trackers, and AI nudge hints.
    """
    await ws_manager.connect(session_id, websocket)
    try:
        # Keep connection open until client closes it
        while True:
            # We don't expect messages from client for this one-way push,
            # but we read to detect socket closure.
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(session_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket exception on session '{session_id}': {e}")
        ws_manager.disconnect(session_id, websocket)

# ==========================================
# General Check Endpoints
# ==========================================
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SkillForge AI Backend Engine",
        "port": settings.PORT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
