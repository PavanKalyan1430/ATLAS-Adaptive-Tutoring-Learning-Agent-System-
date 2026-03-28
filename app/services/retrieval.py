from typing import List
from sentence_transformers import CrossEncoder
from app.db.faiss_store import FAISSStore
from app.services.embedding import EmbeddingService
from app.models.schemas import DocumentMetadata
import torch

class RetrievalService:
    def __init__(self, faiss_store: FAISSStore, embedding_service: EmbeddingService):
        self.faiss_store = faiss_store
        self.embedding_service = embedding_service
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # High accuracy cross-encoder for re-ranking
        self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', device=self.device)

    def retrieve_context(self, question: str, top_k: int = 8, final_k: int = 3) -> List[DocumentMetadata]:
        """Orchestrates retrieval and re-ranking of relevant context chunks."""
        
        # Step 1: Broad retrieval (Bi-encoder FAISS search)
        query_embedding = self.embedding_service.embed_query(question)
        candidates = self.faiss_store.search(query_embedding, top_k=top_k)
        
        if not candidates:
            return []

        # Step 2: Re-ranking (Cross-encoder)
        # CrossEncoder expects pairs of (Query, Document)
        pairs = [[question, doc.text] for doc in candidates]
        scores = self.cross_encoder.predict(pairs)
        
        # Step 3: Sort candidates based on cross-encoder scores
        scored_candidates = list(zip(candidates, scores))
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        
        # Debugging Output
        print("\n--- RETRIEVAL DIAGNOSTICS ---")
        print(f"Query: {question}")
        for doc, score in scored_candidates:
            print(f"Score: {score:.4f} | Source: {doc.source} (Page {doc.page}) | Text Snippet: {doc.text[:50]}...")
        print("-----------------------------\n")

        # Select the top final_k and return
        final_chunks = [doc for doc, score in scored_candidates[:final_k]]
        return final_chunks
