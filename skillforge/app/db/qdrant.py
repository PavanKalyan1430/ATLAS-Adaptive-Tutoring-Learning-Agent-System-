from qdrant_client import QdrantClient
from qdrant_client.http import models
from llama_index.vector_stores.qdrant import QdrantVectorStore
from app.core.config import settings
import logging

logger = logging.getLogger("SkillForge.Qdrant")

# BGE-small uses 384-dimensional dense vectors
DENSE_VECTOR_SIZE = 384

class QdrantManager:
    def __init__(self, collection_name: str = settings.QDRANT_COLLECTION):
        self.collection_name = collection_name
        try:
            self.client = QdrantClient(url=settings.QDRANT_URL, timeout=3.0)
            self.client.get_collections()
            logger.info("🔌 Connected to Qdrant Docker service successfully.")
        except Exception as e:
            logger.warning(
                f"⚠️ Could not reach Qdrant Docker service at {settings.QDRANT_URL}: {e}. "
                "Falling back to local on-disk Qdrant storage for resilience!"
            )
            import os
            os.makedirs("temp_uploads/local_qdrant_sf", exist_ok=True)
            self.client = QdrantClient(path="temp_uploads/local_qdrant_sf")
        
        self._ensure_collection_exists()

        # Hybrid search setup (dense embedding + sparse SPLADE)
        self.vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=self.collection_name,
            enable_hybrid=True,
            fastembed_sparse_model="prithivida/Splade_PP_en_v1",
            sparse_vector_name="text-sparse"
        )

    def _ensure_collection_exists(self):
        """Builds or repairs the collection with hybrid configurations."""
        try:
            collections = self.client.get_collections().collections
        except Exception:
            collections = []
            
        existing = next((c for c in collections if c.name == self.collection_name), None)

        if existing:
            try:
                info = self.client.get_collection(self.collection_name)
                current_size = info.config.params.vectors.size
            except Exception:
                current_size = DENSE_VECTOR_SIZE

            has_sparse = False
            try:
                if getattr(info.config.params, "sparse_vectors", None) and "text-sparse" in info.config.params.sparse_vectors:
                    has_sparse = True
            except Exception:
                pass

            if current_size != DENSE_VECTOR_SIZE or not has_sparse:
                logger.warning(
                    f"Collection config mismatch (size: {current_size}, sparse: {has_sparse}). Recreating..."
                )
                self.client.delete_collection(self.collection_name)
                existing = None

        if not existing:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=DENSE_VECTOR_SIZE,
                    distance=models.Distance.COSINE
                ),
                sparse_vectors_config={
                    "text-sparse": models.SparseVectorParams(
                        index=models.SparseIndexParams(on_disk=False)
                    )
                }
            )
            logger.info(
                f"Created hybrid collection '{self.collection_name}' "
                f"(dense={DENSE_VECTOR_SIZE}d + sparse SPLADE)."
            )

    def get_store(self) -> QdrantVectorStore:
        return self.vector_store
