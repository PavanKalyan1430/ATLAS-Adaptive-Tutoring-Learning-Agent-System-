from skillforge.app.agents.state import SkillForgeState
from skillforge.app.db.qdrant import qdrant_mgr
import logging

logger = logging.getLogger("SkillForge.PlannerAgent")

# Hardcoded curriculum Dependency Graphs (DAGs)
CURRICULUM_DAGS = {
    "dsa": {
        "arrays": {"title": "Mastering Array Operations", "prereqs": []},
        "linked_lists": {"title": "Dynamic Singly Linked Lists", "prereqs": ["arrays"]},
        "stacks": {"title": "LIFO Stacks & Expressions", "prereqs": ["linked_lists"]},
        "trees": {"title": "Hierarchical Binary Trees", "prereqs": ["stacks"]},
        "graphs": {"title": "Network Graphs & Traversals", "prereqs": ["trees"]}
    },
    "computer_fundamentals": {
        "os_scheduling": {"title": "OS CPU Process Scheduling", "prereqs": []},
        "os_memory_management": {"title": "OS Paging & Virtual Memory", "prereqs": ["os_scheduling"]},
        "os_deadlocks": {"title": "OS Deadlocks & Banker's Safety", "prereqs": ["os_memory_management"]},
        
        "dbms_normalization": {"title": "DBMS Table Normal Forms", "prereqs": []},
        "dbms_indexing": {"title": "DBMS Indexing & B+ Trees", "prereqs": ["dbms_normalization"]},
        "dbms_transactions": {"title": "DBMS ACID Transactions", "prereqs": ["dbms_normalization"]},
        
        "cn_osi_model": {"title": "CN 7-Layer OSI Framework", "prereqs": []},
        "cn_tcp_ip": {"title": "CN Reliable TCP Protocols", "prereqs": ["cn_osi_model"]},
        "cn_dns": {"title": "CN Domain Name Mapping System", "prereqs": ["cn_tcp_ip"]}
    }
}

class PlannerAgent:
    """
    Planner Agent: Resolves curriculum DAG paths, filters out mastered topics,
    and handles dynamic mid-session re-routing & remediation insertion.
    """
    def __init__(self):
        pass

    def build_learning_path(self, state: SkillForgeState) -> list[dict]:
        """
        Builds the initial sequence of learning nodes based on competency vector.
        Uses a topological sort order based on curriculum prerequisites.
        """
        subject = state["subject"]
        comp_vector = state.get("competency_vector") or {}
        dag = CURRICULUM_DAGS.get(subject, {})
        
        # 1. Topological Sorting (Simple Kahn's Algorithm / Dependency resolve)
        path_sequence = []
        visited = set()
        
        def resolve_dependencies(topic: str):
            if topic in visited:
                return
            for prereq in dag[topic]["prereqs"]:
                resolve_dependencies(prereq)
            visited.add(topic)
            path_sequence.append(topic)
            
        for topic in dag:
            resolve_dependencies(topic)
            
        # 2. Build Node Objects
        nodes = []
        first_unlocked = False
        
        for topic in path_sequence:
            topic_score = comp_vector.get(topic, 0.5)
            node_id = f"node_{topic}"
            title = dag[topic]["title"]
            prereqs = dag[topic]["prereqs"]
            
            # Retrieve exercise for this topic from Qdrant
            # Find an exercise at matching difficulty
            exercises = qdrant_mgr.search_resources(
                query="exercise",
                subject=subject,
                topic=topic,
                difficulty=topic_score,
                exclude_ids=[],
                top_k=1
            )
            exercise_text = ""
            if exercises:
                # Find matching exercise payload
                exercise_payload = exercises[0]
                if exercise_payload.get("type") == "exercise":
                    exercise_text = exercise_payload.get("content", "")

            # If student already demonstrated mastery (score >= 0.75)
            if topic_score >= 0.75:
                status = "mastered"
            elif not first_unlocked:
                status = "current"
                first_unlocked = True
                state["current_topic"] = topic
            else:
                status = "locked"
                
            nodes.append({
                "node_id": node_id,
                "topic": topic,
                "title": title,
                "status": status,
                "bloom_level": "applying" if topic_score > 0.4 else "understanding",
                "prerequisites": prereqs,
                "exercise": exercise_text,
                "is_remediation": False
            })
            
        # Fallback: if all nodes are mastered, set the last node as current for review
        if not first_unlocked and nodes:
            nodes[-1]["status"] = "current"
            state["current_topic"] = nodes[-1]["topic"]
            
        logger.info(f"Generated learning path sequence for {subject}: {[n['topic'] for n in nodes]}")
        return nodes

    def reroute_path(self, state: SkillForgeState) -> list[dict]:
        """
        Dynamically adjusts the learning path by inserting a remediation sub-node.
        Triggered when a student is stuck (rolling score velocity is low).
        """
        path = state.get("current_path") or []
        curr_idx = state.get("current_node_index", 0)
        
        if curr_idx >= len(path):
            return path
            
        current_node = path[curr_idx]
        topic = current_node["topic"]
        
        logger.info(f"⚠️ Re-routing triggered on topic '{topic}'. Injecting remediation node.")
        
        # Create a special Remediation Node
        remedy_node_id = f"remedy_{topic}"
        
        # Check if already injected to avoid duplicating
        if curr_idx > 0 and path[curr_idx - 1]["node_id"] == remedy_node_id:
            logger.info("Remediation node already exists. Skipping insertion.")
            return path
            
        remedy_node = {
            "node_id": remedy_node_id,
            "topic": topic,
            "title": f"🔧 Review: {current_node['title']} Fundamentals",
            "status": "current",
            "bloom_level": "understanding",
            "prerequisites": current_node["prerequisites"],
            # Give a simpler conceptual review exercise
            "exercise": f"Explain in your own words: What are the absolute core parameters of {topic}? Provide a simple analogy to describe it.",
            "is_remediation": True
        }
        
        # Insert remedy node right before current node, and push current node back
        current_node["status"] = "locked"
        new_path = path[:curr_idx] + [remedy_node] + path[curr_idx:]
        
        # Keep node indices pointing to the new remedy node
        state["current_topic"] = topic
        
        logger.info(f"Dynamic re-routing successful. Path size expanded to {len(new_path)}")
        return new_path

planner_agent = PlannerAgent()
