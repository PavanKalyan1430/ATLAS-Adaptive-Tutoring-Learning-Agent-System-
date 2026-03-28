from sentence_transformers import SentenceTransformer
import torch
import os
from typing import List
import numpy as np

class EmbeddingService:
    def __init__(self):
        # BAAI/bge-base-en is better at retrieval than MiniLM
        model_name = os.getenv("EMBEDDING_MODEL", "BAAI/bge-base-en")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(model_name, device=self.device)

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Generates normalized embeddings for a list of texts in batches."""
        # BGE models require a specific format for queries, but for passages they are encoded normally
        embeddings = self.model.encode(
            texts, 
            batch_size=batch_size, 
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True # Crucial for Faiss IP or L2 matching later
        )
        return embeddings

    def embed_query(self, query: str) -> np.ndarray:
        """Generates embedding for a single query."""
        # BGE models benefit from an instruction prefix for queries
        if "bge" in self.model.tokenizer.name_or_path.lower():
            query = f"Represent this sentence for searching relevant passages: {query}"
            
        embedding = self.model.encode(
            query, 
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embedding
