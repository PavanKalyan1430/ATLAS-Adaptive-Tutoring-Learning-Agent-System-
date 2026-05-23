import redis
import json
import logging
from app.core.config import settings

logger = logging.getLogger("SkillForge.Redis")

class RedisManager:
    def __init__(self):
        try:
            self.client = redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
            self.client.ping()
            self.is_connected = True
            logger.info("🔌 Connected to Redis Docker service successfully.")
        except Exception as e:
            logger.warning(
                f"⚠️ Could not reach Redis Docker service at {settings.REDIS_URL}: {e}. "
                "Using in-memory emulation for session caching and bloom filters!"
            )
            self.client = None
            self.is_connected = False
            self._emulated_sessions = {}
            self._emulated_bloom = {}
            self._emulated_velocity = {}

    # --- Session Management ---
    def get_session_cache(self, session_id: str) -> dict:
        if self.is_connected:
            try:
                data = self.client.get(f"sf:session:{session_id}")
                return json.loads(data) if data else {}
            except Exception as e:
                logger.error(f"Redis get failed: {e}")
                return {}
        return self._emulated_sessions.get(session_id, {})

    def set_session_cache(self, session_id: str, data: dict, ex: int = 7200):
        if self.is_connected:
            try:
                self.client.set(f"sf:session:{session_id}", json.dumps(data), ex=ex)
            except Exception as e:
                logger.error(f"Redis set failed: {e}")
        else:
            self._emulated_sessions[session_id] = data

    # --- Bloom Filter for Resource Deduplication ---
    def add_shown_resource(self, session_id: str, resource_id: str):
        """Remembers that a resource was shown to the student."""
        key = f"sf:shown_resources:{session_id}"
        if self.is_connected:
            try:
                # Use SADD (Redis set) to emulate a simple bloom filter
                self.client.sadd(key, resource_id)
                self.client.expire(key, 7200) # 2-hour TTL
            except Exception as e:
                logger.error(f"Redis sadd failed: {e}")
        else:
            if session_id not in self._emulated_bloom:
                self._emulated_bloom[session_id] = set()
            self._emulated_bloom[session_id].add(resource_id)

    def is_resource_shown(self, session_id: str, resource_id: str) -> bool:
        """Checks if the resource was already shown."""
        key = f"sf:shown_resources:{session_id}"
        if self.is_connected:
            try:
                return bool(self.client.sismember(key, resource_id))
            except Exception as e:
                logger.error(f"Redis sismember failed: {e}")
                return False
        return resource_id in self._emulated_bloom.get(session_id, set())

    # --- Rolling Velocity Window ---
    def push_velocity_score(self, session_id: str, score: float):
        """Pushes a new exercise score to a rolling window of size 5."""
        key = f"sf:velocity:{session_id}"
        if self.is_connected:
            try:
                # Push left, trim to 5 elements
                self.client.lpush(key, score)
                self.client.ltrim(key, 0, 4)
                self.client.expire(key, 7200)
            except Exception as e:
                logger.error(f"Redis lpush failed: {e}")
        else:
            if session_id not in self._emulated_velocity:
                self._emulated_velocity[session_id] = []
            self._emulated_velocity[session_id].insert(0, score)
            self._emulated_velocity[session_id] = self._emulated_velocity[session_id][:5]

    def get_velocity_scores(self, session_id: str) -> list[float]:
        """Gets the rolling scores list."""
        key = f"sf:velocity:{session_id}"
        if self.is_connected:
            try:
                scores = self.client.lrange(key, 0, 4)
                return [float(x) for x in scores]
            except Exception as e:
                logger.error(f"Redis lrange failed: {e}")
                return []
        return self._emulated_velocity.get(session_id, [])

redis_manager = RedisManager()
