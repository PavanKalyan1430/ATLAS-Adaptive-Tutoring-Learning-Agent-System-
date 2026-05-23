from qdrant_client import QdrantClient
from qdrant_client.http import models
from fastembed import TextEmbedding
from skillforge.app.core.config import settings
import logging

logger = logging.getLogger("SkillForge.Qdrant")

DENSE_VECTOR_SIZE = 384  # bge-small-en-v1.5
QUESTIONS_COLLECTION = "skillforge_questions"
RESOURCES_COLLECTION = "skillforge_resources"

class QdrantManager:
    """
    Direct Qdrant Client Manager for SkillForge.
    Handles semantic embeddings and searches with strict metadata filtering.
    """
    def __init__(self):
        try:
            self.client = QdrantClient(url=settings.QDRANT_URL, timeout=3.0)
            self.client.get_collections()
            logger.info("🔌 Connected to Qdrant Docker service for SkillForge.")
        except Exception as e:
            logger.warning(
                f"⚠️ Could not reach Qdrant Docker service at {settings.QDRANT_URL}: {e}. "
                "Falling back to local SQLite-based Qdrant!"
            )
            import os
            os.makedirs("temp_uploads/local_qdrant_sf", exist_ok=True)
            self.client = QdrantClient(path="temp_uploads/local_qdrant_sf")
            
        # Initialize FastEmbed locally
        logger.info("Initializing local BGE FastEmbed model...")
        self.embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        
        self._ensure_collection_exists(QUESTIONS_COLLECTION)
        self._ensure_collection_exists(RESOURCES_COLLECTION)

    def _ensure_collection_exists(self, collection_name: str):
        collections = self.client.get_collections().collections
        existing = next((c for c in collections if c.name == collection_name), None)

        if not existing:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=DENSE_VECTOR_SIZE,
                    distance=models.Distance.COSINE
                )
            )
            logger.info(f"Created collection '{collection_name}' ({DENSE_VECTOR_SIZE}d).")

    def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Computes embeddings using the local FastEmbed model."""
        embeddings_iter = self.embedding_model.embed(texts)
        return [list(e) for e in embeddings_iter]

    def insert_questions(self, questions: list[dict]):
        """Inserts diagnostic questions with topic and difficulty metadata."""
        if not questions:
            return
            
        texts = [q["question"] for q in questions]
        embeddings = self.get_embeddings(texts)
        
        points = []
        for idx, (q, emb) in enumerate(zip(questions, embeddings)):
            points.append(
                models.PointStruct(
                    id=idx + 1000,  # Offset to prevent conflicts
                    vector=emb,
                    payload={
                        "question_id": q["question_id"],
                        "question": q["question"],
                        "options": q["options"],
                        "correct_option_idx": q["correct_option_idx"],
                        "difficulty": q["difficulty"],
                        "bloom_level": q["bloom_level"],
                        "topic_tag": q["topic_tag"],
                        "explanation": q.get("explanation", ""),
                        "subject": q["subject"]
                    }
                )
            )
        
        self.client.upsert(collection_name=QUESTIONS_COLLECTION, points=points)
        logger.info(f"Upserted {len(questions)} questions into '{QUESTIONS_COLLECTION}'.")

    def insert_resources(self, resources: list[dict]):
        """Inserts study materials and textbooks with topic and difficulty metadata."""
        if not resources:
            return
            
        texts = [r["content"] for r in resources]
        embeddings = self.get_embeddings(texts)
        
        points = []
        for idx, (r, emb) in enumerate(zip(resources, embeddings)):
            points.append(
                models.PointStruct(
                    id=idx + 5000,  # Offset to prevent conflicts
                    vector=emb,
                    payload={
                        "resource_id": r["resource_id"],
                        "title": r["title"],
                        "content": r["content"],
                        "type": r["type"],
                        "topic": r["topic"],
                        "difficulty": r["difficulty"],
                        "bloom_level": r["bloom_level"],
                        "source_url": r.get("source_url", ""),
                        "subject": r["subject"]
                    }
                )
            )
            
        self.client.upsert(collection_name=RESOURCES_COLLECTION, points=points)
        logger.info(f"Upserted {len(resources)} resource chunks into '{RESOURCES_COLLECTION}'.")

    def get_adaptive_question(self, subject: str, topic: str, difficulty: float, exclude_ids: list[str]) -> list[dict]:
        """
        Retrieves the closest question matching the target subtopic and difficulty.
        Excludes already answered questions.
        """
        # Find closest questions by filtering by topic and subject
        must_filters = [
            models.FieldCondition(key="subject", match=models.MatchValue(value=subject)),
            models.FieldCondition(key="topic_tag", match=models.MatchValue(value=topic))
        ]
        
        # Exclude already shown question IDs
        if exclude_ids:
            must_filters.append(
                models.FieldCondition(
                    key="question_id",
                    match=models.MatchExcept(values=exclude_ids)
                )
            )
            
        # We perform a filter-only query and sort candidates by absolute difference in difficulty
        results = self.client.scroll(
            collection_name=QUESTIONS_COLLECTION,
            scroll_filter=models.Filter(must=must_filters),
            limit=50,
            with_payload=True
        )[0]
        
        if not results:
            return []
            
        # Sort by closest difficulty to target
        sorted_results = sorted(results, key=lambda x: abs(x.payload["difficulty"] - difficulty))
        return [sorted_results[0].payload]

    def search_resources(self, query: str, subject: str, topic: str, difficulty: float, exclude_ids: list[str], top_k: int = 3) -> list[dict]:
        """
        Performs semantic search for resources in Qdrant with topic and difficulty bounds.
        """
        query_vector = self.get_embeddings([query])[0]
        
        must_filters = [
            models.FieldCondition(key="subject", match=models.MatchValue(value=subject)),
            models.FieldCondition(key="topic", match=models.MatchValue(value=topic))
        ]
        
        if exclude_ids:
            must_filters.append(
                models.FieldCondition(
                    key="resource_id",
                    match=models.MatchExcept(values=exclude_ids)
                )
            )
            
        # We bound the difficulty to fetch materials relevant to the student's level
        # (e.g., student level 0.4 -> fetch resources between 0.2 and 0.6)
        must_filters.append(
            models.FieldCondition(
                key="difficulty",
                range=models.Range(
                    gte=max(0.0, difficulty - 0.25),
                    lte=min(1.0, difficulty + 0.25)
                )
            )
        )
        
        search_results = self.client.search(
            collection_name=RESOURCES_COLLECTION,
            query_vector=query_vector,
            query_filter=models.Filter(must=must_filters),
            limit=top_k
        )
        
        return [hit.payload for hit in search_results]

# Global manager instance
qdrant_mgr = QdrantManager()
