from fastapi import WebSocket
from typing import Dict, List
import logging

logger = logging.getLogger("SkillForge.WebSocket")

class ConnectionManager:
    """
    Manages active WebSocket connections for SkillForge sessions.
    Allows real-time push events from backend agents to the frontend (nudges, reroutes).
    """
    def __init__(self):
        # Maps session_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        logger.info(f"🔌 WebSocket connected for session '{session_id}'. Total pool: {len(self.active_connections[session_id])}")

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
                logger.info(f"🔌 WebSocket disconnected for session '{session_id}'.")
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast_to_session(self, session_id: str, event_type: str, data: dict):
        """Broadcasts a JSON event payload to all active WS connections in a session."""
        if session_id not in self.active_connections:
            return
            
        payload = {
            "event_type": event_type,  # e.g., 'nudge', 'reroute', 'score_update'
            "data": data
        }
        
        logger.info(f"📤 Broadcasting event '{event_type}' to session '{session_id}'...")
        
        disconnected_sockets = []
        for connection in self.active_connections[session_id]:
            try:
                await connection.send_json(payload)
            except Exception as e:
                logger.warning(f"Failed to send WS message: {e}. Queueing socket for removal.")
                disconnected_sockets.append(connection)
                
        # Clean up stale connections
        for conn in disconnected_sockets:
            self.disconnect(session_id, conn)

ws_manager = ConnectionManager()
