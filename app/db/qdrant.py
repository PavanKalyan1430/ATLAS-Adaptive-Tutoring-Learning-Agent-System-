from qdrant_client import QdrantClient
from qdrant_client.http import models
from llama_index.vector_stores.qdrant import QdrantVectorStore
from app.core.config import settings

class QdrantManager:
    def __init__(self, collection_name: str = "archer_documents"):
        self.collection_name = collection_name
        
        # 1. Initialize raw Qdrant Client using our secure config
        self.client = QdrantClient(url=settings.QDRANT_URL)
        
        # 2. Ensure collection exists with both DENSE and SPARSE vector support
        self._ensure_collection_exists()
        
        # 3. Wrap it in LlamaIndex VectorStore for seamless integration later
        self.vector_store = QdrantVectorStore(
            client=self.client, 
            collection_name=self.collection_name,
            enable_hybrid=True
        )

    def _ensure_collection_exists(self):
        """Creates the collection if it does not already exist in Qdrant."""
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)
        
        if not exists:
            # We must explicitly create two configs:
            # 1. Dense vectors (for meaning-based search using BAAI)
            # 2. Sparse vectors (for keyword-based search using FastEmbed SPLADE)
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=768, 
                    distance=models.Distance.COSINE
                ),
                sparse_vectors_config={
                    "text-sparse-new": models.SparseVectorParams(
                        index=models.SparseIndexParams(on_disk=False)
                    )
                }
            )
            print(f"Created Qdrant collection: {self.collection_name} (Hybrid Enabled)")

    def get_store(self) -> QdrantVectorStore:
        """Returns the LlamaIndex-compatible vector store object."""
        return self.vector_store
