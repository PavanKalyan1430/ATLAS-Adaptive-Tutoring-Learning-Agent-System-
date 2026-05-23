from fastapi import APIRouter, HTTPException
import logging

from skillforge.app.models.schemas import LearningPathResponse, LearningNode
from skillforge.app.db.redis_client import redis_client

logger = logging.getLogger("SkillForge.PathAPI")
router = APIRouter(prefix="/sessions/{session_id}/path", tags=["Path"])

@router.get("", response_model=LearningPathResponse)
async def get_learning_path(session_id: str):
    """
    Returns the complete structured learning path (nodes + React Flow edges).
    """
    cached = await redis_client.get_session(session_id)
    if not cached or "path_nodes" not in cached:
        raise HTTPException(status_code=404, detail="Learning path not generated yet. Complete the diagnostic quiz first!")
        
    path_nodes = cached["path_nodes"]
    comp_vector = cached.get("competency_vector", {})
    
    # 1. Parse Node structures
    formatted_nodes = []
    for node in path_nodes:
        formatted_nodes.append(
            LearningNode(
                node_id=node["node_id"],
                topic=node["topic"],
                title=node["title"],
                status=node["status"],
                bloom_level=node["bloom_level"],
                prerequisites=node.get("prerequisites", []),
                exercise=node.get("exercise", ""),
                expected_answer=node.get("expected_answer")
            )
        )
        
    # 2. Build DAG Edge definitions dynamically from prerequisites
    # (So React Flow can draw arrows on the canvas instantly)
    edges = []
    for node in path_nodes:
        node_id = node["node_id"]
        prereqs = node.get("prerequisites", [])
        for p in prereqs:
            edges.append({
                "id": f"edge_{p}_to_{node['topic']}",
                "source": f"node_{p}",
                "target": node_id,
                "animated": node["status"] == "current" or node["status"] == "mastered"
            })
            
    # Also add sequential edge for injected review remediation nodes
    for idx, node in enumerate(path_nodes):
        if node.get("is_remediation", False):
            # Connect remediation to the node it reviews
            edges.append({
                "id": f"edge_remedy_{node['topic']}",
                "source": node["node_id"],
                "target": f"node_{node['topic']}",
                "animated": True,
                "style": {"stroke": "#ff9800", "strokeDasharray": "5"}
            })

    return LearningPathResponse(
        session_id=session_id,
        subject=cached["subject"],
        nodes=formatted_nodes,
        edges=edges,
        competency_vector=comp_vector
    )

@router.get("/current", response_model=LearningNode)
async def get_current_node(session_id: str):
    """
    Retrieves detailed info regarding the active node the student is currently studying.
    """
    cached = await redis_client.get_session(session_id)
    if not cached or "path_nodes" not in cached:
        raise HTTPException(status_code=404, detail="Learning path not initialized.")
        
    path_nodes = cached["path_nodes"]
    curr_idx = cached.get("current_node_index", 0)
    
    if curr_idx >= len(path_nodes):
        raise HTTPException(status_code=200, detail="Curriculum complete! All topics mastered!")
        
    node = path_nodes[curr_idx]
    
    # 1. Fetch related RAG textbook/resources for this topic
    # If not already stored in state, fetch them now
    retrieved_resources = cached.get("retrieved_resources") or []
    if not retrieved_resources:
        from skillforge.app.agents.retrieval_agent import retrieval_agent
        from skillforge.app.agents.state import SkillForgeState
        
        # Cast cached to SkillForgeState
        state_cast = SkillForgeState(
            session_id=session_id,
            subject=cached["subject"],
            student_name=cached["student_name"],
            competency_vector=cached.get("competency_vector", {}),
            quiz_history=cached.get("quiz_history", []),
            current_topic=node["topic"],
            current_path=path_nodes,
            current_node_index=curr_idx,
            retrieved_resources=[],
            student_answer="",
            evaluation_result=None,
            velocity_window=[],
            reroute_triggered=False,
            next_node_id=None
        )
        retrieved_resources = await retrieval_agent.retrieve_resources(state_cast)
        cached["retrieved_resources"] = retrieved_resources
        await redis_client.save_session(session_id, cached)

    # 2. Format returned node payload
    from skillforge.app.models.schemas import ResourceItem
    resource_objs = [
        ResourceItem(
            resource_id=r["resource_id"],
            title=r["title"],
            content=r["content"],
            type=r["type"],
            topic=r["topic"],
            difficulty=r["difficulty"],
            bloom_level=r["bloom_level"],
            source_url=r.get("source_url")
        )
        for r in retrieved_resources
    ]

    return LearningNode(
        node_id=node["node_id"],
        topic=node["topic"],
        title=node["title"],
        status=node["status"],
        bloom_level=node["bloom_level"],
        prerequisites=node.get("prerequisites", []),
        resources=resource_objs,
        exercise=node.get("exercise", ""),
        expected_answer=node.get("expected_answer")
    )
