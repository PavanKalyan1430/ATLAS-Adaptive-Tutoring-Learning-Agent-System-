import faiss
import numpy as np
import pickle
import os
from typing import List, Dict, Optional
from app.models.schemas import DocumentMetadata

class FAISSStore:
    def __init__(self, index_path: str = "faiss_index.bin", metadata_path: str = "metadata.pkl"):
        self.index_path = index_path
        self.metadata_path = metadata_path
        self.dimension = 768  # BAAI/bge-base-en is 768d (MiniLM was 384d)
        self.index = faiss.IndexFlatL2(self.dimension)
        self.metadata_map: Dict[int, DocumentMetadata] = {}
        
        # Load existing index if it exists
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            self.load()

    def add_documents(self, embeddings: np.ndarray, metadata: List[DocumentMetadata]):
        """Adds embeddings and their corresponding metadata to the store."""
        start_id = self.index.ntotal
        self.index.add(embeddings.astype('float32'))
        
        for i, meta in enumerate(metadata):
            self.metadata_map[start_id + i] = meta
        
        self.save()

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[DocumentMetadata]:
        """Searches for the most similar vectors and returns their metadata."""
        distances, indices = self.index.search(query_embedding.reshape(1, -1).astype('float32'), top_k)
        
        results = []
        for idx in indices[0]:
            if idx != -1 and idx in self.metadata_map:
                results.append(self.metadata_map[idx])
        
        return results

    def save(self):
        """Persists the index and metadata to disk."""
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, 'wb') as f:
            pickle.dump(self.metadata_map, f)

    def load(self):
        """Loads the index and metadata from disk."""
        self.index = faiss.read_index(self.index_path)
        with open(self.metadata_path, 'rb') as f:
            self.metadata_map = pickle.load(f)

    def clear(self):
        """Clears the index and metadata."""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.metadata_map = {}
        if os.path.exists(self.index_path):
            os.remove(self.index_path)
        if os.path.exists(self.metadata_path):
            os.remove(self.metadata_path)
