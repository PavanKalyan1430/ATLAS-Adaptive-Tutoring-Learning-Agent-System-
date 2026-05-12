import redis.asyncio as redis
from typing import List
import json
from app.core.config import settings

class RedisManager:
    """Manages short-term memory and session history for the Agents."""
    def __init__(self):
        self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def save_chat_message(self, session_id: str, role: str, content: str):
        """Appends a message to the user's chat history."""
        key = f"session:{session_id}:history"
        msg = json.dumps({"role": role, "content": content})
        await self.client.rpush(key, msg)
        
        # Auto-delete history after 24 hours to save memory
        await self.client.expire(key, 86400)

    async def get_chat_history(self, session_id: str) -> List[dict]:
        """Retrieves the full chat history for a given session."""
        key = f"session:{session_id}:history"
        messages = await self.client.lrange(key, 0, -1)
        return [json.loads(msg) for msg in messages]
