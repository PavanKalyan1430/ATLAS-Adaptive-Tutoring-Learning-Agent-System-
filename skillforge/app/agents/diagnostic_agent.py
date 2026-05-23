from skillforge.app.agents.state import SkillForgeState
from skillforge.app.db.qdrant import qdrant_mgr
from typing import Dict
import logging

logger = logging.getLogger("SkillForge.DiagnosticAgent")

# Fixed list of subtopics per subject for structural consistency
SUBJECT_TOPICS = {
    "dsa": ["arrays", "linked_lists", "stacks", "trees", "graphs"],
    "computer_fundamentals": [
        "os_scheduling", "os_memory_management", "os_deadlocks",
        "dbms_normalization", "dbms_indexing", "dbms_transactions",
        "cn_osi_model", "cn_tcp_ip", "cn_dns"
    ]
}

class DiagnosticAgent:
    """
    Diagnostic Agent: Manages the adaptive quiz logic.
    Adjusts difficulty iteratively and compiles the final competency vector.
    """
    def __init__(self):
        pass

    def run_adaptive_quiz_step(self, state: SkillForgeState) -> dict:
        """
        Determines the next subtopic and difficulty, and fetches the best matched question.
        Returns the chosen question payload or None if quiz is complete.
        """
        subject = state["subject"]
        topics = SUBJECT_TOPICS.get(subject, [])
        quiz_history = state.get("quiz_history") or []
        
        # If student has answered 8 questions, quiz is complete
        if len(quiz_history) >= 8:
            logger.info("Adaptive quiz reached max question limit (8). Quiz complete!")
            return None

        # Determine next subtopic (cycle through subtopics sequentially)
        next_topic_idx = len(quiz_history) % len(topics)
        target_topic = topics[next_topic_idx]
        
        # Calculate next target difficulty
        # Start at 0.5. If last answer was correct: increase by 0.15; if wrong: decrease by 0.15.
        current_difficulty = 0.5
        if quiz_history:
            last_answer = quiz_history[-1]
            last_difficulty = last_answer.get("difficulty", 0.5)
            if last_answer.get("is_correct", False):
                current_difficulty = min(0.9, last_difficulty + 0.15)
            else:
                current_difficulty = max(0.1, last_difficulty - 0.15)

        # Get list of already answered question IDs to avoid repeats
        exclude_ids = [q["question_id"] for q in quiz_history]
        
        # Query Qdrant for closest matching question
        question_payload = qdrant_mgr.get_adaptive_question(
            subject=subject,
            topic=target_topic,
            difficulty=current_difficulty,
            exclude_ids=exclude_ids
        )
        
        if not question_payload:
            logger.warning(f"No questions found in Qdrant for topic '{target_topic}' at difficulty {current_difficulty}. Retrying without excludes...")
            # Fallback: ignore exclude filter
            question_payload = qdrant_mgr.get_adaptive_question(
                subject=subject,
                topic=target_topic,
                difficulty=current_difficulty,
                exclude_ids=[]
            )
            
        if question_payload:
            return question_payload[0]
        return None

    def compute_competency_vector(self, state: SkillForgeState) -> Dict[str, float]:
        """
        Builds the topic competency vector (topic -> score [0.0 - 1.0]).
        Calculated as the correctness score per subtopic, defaulting unassessed to 0.5.
        """
        subject = state["subject"]
        topics = SUBJECT_TOPICS.get(subject, [])
        quiz_history = state.get("quiz_history") or []
        
        # Track correct counts and total counts per topic
        topic_stats = {t: {"correct": 0, "total": 0} for t in topics}
        for q in quiz_history:
            topic = q.get("topic")
            if topic in topic_stats:
                topic_stats[topic]["total"] += 1
                if q.get("is_correct", False):
                    topic_stats[topic]["correct"] += 1
                    
        # Compute competency scores
        competency_vector = {}
        for topic, stats in topic_stats.items():
            if stats["total"] > 0:
                # Weighted score based on difficulty and correctness
                # Baseline correctness: correct / total
                score = stats["correct"] / stats["total"]
                competency_vector[topic] = round(score, 2)
            else:
                # Default baseline score if topic wasn't quizzed
                competency_vector[topic] = 0.5
                
        logger.info(f"Computed competency vector for {state['student_name']}: {competency_vector}")
        return competency_vector

diagnostic_agent = DiagnosticAgent()
