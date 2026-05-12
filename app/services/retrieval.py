from typing import List
from llama_index.core import VectorStoreIndex
from llama_index.core.vector_stores.types import VectorStoreQueryMode
from app.db.qdrant import QdrantManager
from app.models.schemas import ChunkSchema, ChunkMetadata

class RetrievalService:
    def __init__(self, qdrant_manager: QdrantManager):
        # Connect to our Qdrant instance
        self.vector_store = qdrant_manager.get_store()
        
        # Create an index object that LlamaIndex can query against
        self.index = VectorStoreIndex.from_vector_store(vector_store=self.vector_store)

    def retrieve_hybrid(self, query: str, top_k: int = 5) -> List[ChunkSchema]:
        """
        Executes a Hybrid Search (Dense Vectors + Sparse BM25 Keyword matching).
        Qdrant natively calculates Reciprocal Rank Fusion (RRF) to combine the scores.
        """
        # We explicitly set the query mode to HYBRID for maximum accuracy
        retriever = self.index.as_retriever(
            similarity_top_k=top_k,
            vector_store_query_mode=VectorStoreQueryMode.HYBRID
        )
        
        # Retrieve the most relevant nodes
        nodes = retriever.retrieve(query)
        
        # Convert the LlamaIndex Nodes back into our strict Pydantic Blueprints
        chunks = []
        for node in nodes:
            metadata = node.metadata
            chunks.append(ChunkSchema(
                chunk_id=metadata.get("doc_id", "unknown") + "_chunk",
                text=node.text,
                metadata=ChunkMetadata(**metadata) if "content_type" in metadata else metadata # Safe fallback
            ))
            
        return chunks
