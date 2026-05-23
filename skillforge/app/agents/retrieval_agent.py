from skillforge.app.agents.state import SkillForgeState
from skillforge.app.db.qdrant import qdrant_mgr
from skillforge.app.db.redis_client import redis_client
import asyncio
import logging

logger = logging.getLogger("SkillForge.RetrievalAgent")

class RetrievalAgent:
    """
    Retrieval Agent: Resolves active topic and competency bounds,
    fetches prior shown resource IDs from Redis, runs difficulty-bounded Qdrant search,
    and records newly retrieved material for O(1) deduplication.
    """
    def __init__(self):
        pass

    async def retrieve_resources(self, state: SkillForgeState) -> list[dict]:
        session_id = state["session_id"]
        subject = state["subject"]
        
        path = state.get("current_path") or []
        curr_idx = state.get("current_node_index", 0)
        
        if curr_idx >= len(path):
            logger.warning("Current node index out of bounds. No resources to retrieve.")
            return []
            
        current_node = path[curr_idx]
        topic = current_node["topic"]
        
        # Determine target difficulty based on student's competency score
        comp_vector = state.get("competency_vector") or {}
        student_score = comp_vector.get(topic, 0.5)
        
        logger.info(f"Retrieving resources for topic '{topic}' at target difficulty {student_score}...")
        
        # 1. Fetch previously shown resources from Redis for strict deduplication
        shown_ids = await redis_client.get_shown_resources(session_id)
        
        # 2. Query Qdrant with semantic relevance and difficulty bounds
        query = f"Provide clear detailed study materials, textbook concepts and explained examples for {topic}."
        raw_hits = qdrant_mgr.search_resources(
            query=query,
            subject=subject,
            topic=topic,
            difficulty=student_score,
            exclude_ids=shown_ids,
            top_k=2  # Return top 2 textbook resources
        )
        
        # 3. If nothing found, broaden the search (ignore shown duplicates)
        if not raw_hits:
            logger.info("No new resources found under strict filters. Relaxing shown_resources filter...")
            raw_hits = qdrant_mgr.search_resources(
                query=query,
                subject=subject,
                topic=topic,
                difficulty=student_score,
                exclude_ids=[],
                top_k=2
            )
            
        # 4. Save newly retrieved resource IDs in Redis shown set
        for hit in raw_hits:
            r_id = hit.get("resource_id")
            if r_id:
                await redis_client.add_shown_resource(session_id, r_id)
                
        # Format payloads
        formatted_resources = []
        for hit in raw_hits:
            formatted_resources.append({
                "resource_id": hit["resource_id"],
                "title": hit["title"],
                "content": hit["content"],
                "type": hit["type"],
                "topic": hit["topic"],
                "difficulty": hit["difficulty"],
                "bloom_level": hit["bloom_level"],
                "source_url": hit.get("source_url", "")
            })
            
        logger.info(f"Successfully retrieved {len(formatted_resources)} study resources.")
        return formatted_resources

retrieval_agent = RetrievalAgent()
