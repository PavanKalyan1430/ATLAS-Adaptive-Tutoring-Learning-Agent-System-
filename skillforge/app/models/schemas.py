from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

# ==========================================
# Session Management
# ==========================================
class SessionCreate(BaseModel):
    subject: str = Field(..., description="Subject: e.g., 'dsa' or 'computer_fundamentals'")
    student_name: str = Field(..., description="Student name")

class StudentSession(BaseModel):
    session_id: str
    subject: str
    student_name: str
    created_at: datetime
    competency_vector: Dict[str, float] = Field(default_factory=dict, description="topic -> score mapping")
    current_node_index: int = 0
    path_nodes: List[Dict] = Field(default_factory=list, description="List of learning nodes")

# ==========================================
# Diagnostic Quiz
# ==========================================
class DiagnosticQuestion(BaseModel):
    question_id: str
    question: str
    options: List[str]
    correct_option_idx: int
    difficulty: float = Field(..., description="Difficulty metric between 0.0 and 1.0")
    bloom_level: str = Field(..., description="cognitive load (remembering, understanding, applying, analyzing)")
    topic_tag: str = Field(..., description="Specific subtopic name")
    explanation: Optional[str] = None

class QuizAnswerSubmit(BaseModel):
    question_id: str
    selected_option_idx: int
    time_taken_seconds: int

class QuizAnswerResponse(BaseModel):
    is_correct: bool
    correct_option_idx: int
    explanation: Optional[str]
    next_question: Optional[DiagnosticQuestion] = None
    quiz_complete: bool = False
    competency_vector: Optional[Dict[str, float]] = None

# ==========================================
# Resources & Study Material
# ==========================================
class ResourceItem(BaseModel):
    resource_id: str
    title: str
    content: str
    type: str = Field(..., description="video_transcript, textbook, or exercise")
    topic: str
    difficulty: float
    bloom_level: str
    source_url: Optional[str] = None

# ==========================================
# Learning Path (DAG Structure)
# ==========================================
class LearningNode(BaseModel):
    node_id: str
    topic: str
    title: str
    status: str = Field(default="locked", description="mastered, current, locked, or rerouted")
    bloom_level: str
    prerequisites: List[str] = Field(default_factory=list)
    resources: List[ResourceItem] = Field(default_factory=list)
    exercise: Optional[str] = None
    expected_answer: Optional[str] = None

class LearningPathResponse(BaseModel):
    session_id: str
    subject: str
    nodes: List[LearningNode]
    edges: List[Dict[str, str]] = Field(default_factory=list, description="list of {source: str, target: str} pairs")
    competency_vector: Dict[str, float]

# ==========================================
# Evaluation & Grading
# ==========================================
class ExerciseSubmit(BaseModel):
    answer: str

class EvaluationResult(BaseModel):
    score: float = Field(..., description="Score from 0.0 to 1.0")
    misconceptions: List[str] = Field(default_factory=list, description="Detected learning gaps")
    feedback: str = Field(..., description="AI feedback on the answer")
    confidence: float = Field(..., description="AI evaluation confidence level")
    reroute_triggered: bool = Field(default=False, description="Flag indicating if a learning path re-routing occurred")
    next_node_id: Optional[str] = None
