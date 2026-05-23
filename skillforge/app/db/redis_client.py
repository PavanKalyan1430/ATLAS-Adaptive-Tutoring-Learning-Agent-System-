import redis.asyncio as aioredis
from skillforge.app.core.config import settings
import json
import logging
import socket

logger = logging.getLogger("SkillForge.Redis")

def is_redis_running(host: str = "127.0.0.1", port: int = 6379) -> bool:
    """Performs a rapid socket connection check to see if Redis port is open."""
    try:
        with socket.create_connection((host, port), timeout=1.0):
            return True
    except OSError:
        return False

# ==========================================
# Mock In-Memory Async Redis Fallback Client
# ==========================================
class InMemoryRedisClient:
    """
    Emulates async redis-py client methods using local dictionary storage.
    Ensures backend operates with 100% features when Redis Docker is offline.
    """
    def __init__(self):
        self._store = {}
        self._sets = {}
        self._lists = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ex: int = None):
        self._store[key] = value

    async def sadd(self, key: str, member: str) -> int:
        if key not in self._sets:
            self._sets[key] = set()
        self._sets[key].add(member)
        return 1

    async def smembers(self, key: str) -> set:
        return self._sets.get(key, set())

    async def rpush(self, key: str, value: float) -> int:
        if key not in self._lists:
            self._lists[key] = []
        self._lists[key].append(str(value))
        return len(self._lists[key])

    async def ltrim(self, key: str, start: int, end: int):
        if key in self._lists:
            # Simple python slicing mapping for negative index bounds
            self._lists[key] = self._lists[key][start:]

    async def lrange(self, key: str, start: int, end: int) -> list[str]:
        return self._lists.get(key, [])

    async def delete(self, *keys):
        for key in keys:
            self._store.pop(key, None)
            self._sets.pop(key, None)
            self._lists.pop(key, None)

    async def expire(self, key: str, seconds: int) -> int:
        return 1

# ==========================================
# Connection Manager Initialization
# ==========================================
class RedisClientManager:
    """
    Asynchronous Redis client wrapper.
    Seamlessly swaps between real Redis and local In-Memory fallback.
    """
    def __init__(self):
        if is_redis_running():
            logger.info("🔌 Redis Docker detected on port 6379. Connecting...")
            self.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        else:
            logger.warning(
                "⚠️ Redis is unreachable (Docker is offline). "
                "Falling back to local in-memory mock client!"
            )
            self.redis = InMemoryRedisClient()

    async def get_session(self, session_id: str) -> dict | None:
        data = await self.redis.get(f"sf:session:{session_id}")
        if data:
            return json.loads(data)
        return None

    async def save_session(self, session_id: str, state: dict, expire_seconds: int = 7200):
        await self.redis.set(
            f"sf:session:{session_id}", 
            json.dumps(state), 
            ex=expire_seconds
        )

    async def add_shown_resource(self, session_id: str, resource_id: str):
        await self.redis.sadd(f"sf:shown_resources:{session_id}", resource_id)
        await self.redis.expire(f"sf:shown_resources:{session_id}", 7200)

    async def get_shown_resources(self, session_id: str) -> list[str]:
        members = await self.redis.smembers(f"sf:shown_resources:{session_id}")
        return list(members)

    async def push_score(self, session_id: str, score: float):
        key = f"sf:velocity:{session_id}"
        await self.redis.rpush(key, score)
        await self.redis.ltrim(key, -5, -1)
        await self.redis.expire(key, 7200)

    async def get_velocity_window(self, session_id: str) -> list[float]:
        key = f"sf:velocity:{session_id}"
        scores = await self.redis.lrange(key, 0, -1)
        return [float(s) for s in scores]

    async def clear_session_data(self, session_id: str):
        await self.redis.delete(
            f"sf:session:{session_id}",
            f"sf:shown_resources:{session_id}",
            f"sf:velocity:{session_id}"
        )

# Global redis manager instance
redis_client = RedisClientManager()
