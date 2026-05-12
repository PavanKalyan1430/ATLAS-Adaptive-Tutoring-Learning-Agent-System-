from llama_index.graph_stores.neo4j import Neo4jGraphStore
from app.core.config import settings

class Neo4jManager:
    def __init__(self):
        # Wraps the Neo4j connection natively for LlamaIndex GraphRAG
        self.graph_store = Neo4jGraphStore(
            username=settings.NEO4J_USER,
            password=settings.NEO4J_PASSWORD,
            url=settings.NEO4J_URI,
        )

    def get_store(self) -> Neo4jGraphStore:
        """Returns the LlamaIndex-compatible graph store."""
        return self.graph_store
