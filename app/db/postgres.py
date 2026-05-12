import asyncpg
from app.core.config import settings

class PostgresManager:
    """Manages metadata and chat history tracking. Uses asyncpg for high performance."""
    def __init__(self):
        self.pool = None

    async def connect(self):
        """Initializes the connection pool on app startup."""
        if not self.pool:
            self.pool = await asyncpg.create_pool(settings.POSTGRES_URL)
            await self._create_tables()

    async def _create_tables(self):
        """Creates the necessary tables if they don't exist."""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    doc_id UUID PRIMARY KEY,
                    filename TEXT NOT NULL,
                    chunk_count INTEGER NOT NULL,
                    uploaded_at TIMESTAMP DEFAULT NOW()
                );
            """)

    async def save_document_metadata(self, doc_id: str, filename: str, chunk_count: int):
        """Saves the high-level metadata of an uploaded PDF."""
        async with self.pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO documents (doc_id, filename, chunk_count) VALUES ($1, $2, $3)",
                doc_id, filename, chunk_count
            )

    async def close(self):
        """Closes the connection pool on app shutdown."""
        if self.pool:
            await self.pool.close()
