from typing import TypedDict, List, Dict, Optional, Any

class SkillForgeState(TypedDict):
    """
    Unified state dictionary passed between nodes in the SkillForge LangGraph pipeline.
    Tracks everything regarding a student's session, performance, and current path.
    """
    session_id: str
    subject: str                    # 'dsa' or 'computer_fundamentals'
    student_name: str
    
    # Competency and Diagnostic State
    competency_vector: Dict[str, float]  # topic -> competency score (0.0 to 1.0)
    quiz_history: List[Dict[str, Any]]    # Questions answered: [{question_id, is_correct, etc}]
    current_topic: str
    
    # Path & Sequence State
    current_path: List[Dict[str, Any]]   # Current structured path of LearningNodes
    current_node_index: int              # Index of current active node in path
    
    # Study & Evaluation State
    retrieved_resources: List[Dict[str, Any]] # RAG-retrieved materials for current node
    student_answer: str                  # Input text answer from student
    evaluation_result: Optional[Dict[str, Any]] # Semantic grading feedback
    
    # Intervention & Monitoring
    velocity_window: List[float]         # Sliding performance scores queue (max size 5)
    reroute_triggered: bool              # Flag if path was updated mid-session
    next_node_id: Optional[str]
