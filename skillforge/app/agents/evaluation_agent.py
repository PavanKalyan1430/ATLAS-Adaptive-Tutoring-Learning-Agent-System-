from skillforge.app.agents.state import SkillForgeState
from skillforge.app.services.llm import LLMService
from skillforge.app.db.postgres import AsyncSessionLocal, PostgresEvaluationHistory
import json
import logging

logger = logging.getLogger("SkillForge.EvaluationAgent")

class EvaluationAgent:
    """
    Evaluation Agent: Performs semantic grading of student exercise submissions,
    identifies misconceptions, and records evaluations into the Postgres history logs.
    """
    def __init__(self, llm_service: LLMService):
        self.fast_llm = llm_service.get_fast_llm()
        self.smart_llm = llm_service.get_smart_llm()

    def evaluate_submission(self, state: SkillForgeState) -> dict:
        """
        Grades the student's answer against the exercise using the smart LLM.
        Detects specific misconceptions and returns structured output.
        """
        subject = state["subject"]
        path = state["current_path"]
        curr_idx = state["current_node_index"]
        
        if curr_idx >= len(path):
            raise ValueError("Current node index out of bounds during evaluation.")
            
        current_node = path[curr_idx]
        topic = current_node["topic"]
        exercise = current_node["exercise"]
        student_answer = state["student_answer"]
        
        logger.info(f"Evaluating student submission for topic '{topic}'...")
        
        prompt = f"""You are an elite computer science tutor and strict grading engine.
Evaluate the student's answer to the practice exercise below.

Subject Area: {subject}
Topic Focus: {topic}
Exercise Question:
{exercise}

Student's Submitted Answer:
\"\"\"
{student_answer}
\"\"\"

Grade the response semantically. Look for correct understanding of concepts, logical correctness, and syntax correctness (if code was written).
Detect any specific student misconceptions (e.g., "confusing in-order vs pre-order traversal", "incorrect array bounds shifting", "failing to allocate pointers").

Provide your grading output strictly in JSON format. Do NOT add any extra markdown wrapper (such as ```json) or explanation outside the JSON block.

JSON Schema:
{{
  "score": float (between 0.0 and 1.0, where 1.0 is completely correct, 0.0 is completely wrong),
  "misconceptions": list of strings (concrete labels of concepts the student got wrong, or empty list if score is 1.0),
  "feedback": "detailed, encouraging, and highly educational feedback explaining what they got right, what they got wrong, and how to improve",
  "confidence": float (between 0.0 and 1.0 indicating your evaluation certainty)
}}
"""
        # Call Groq smart model for elite evaluation
        response = self.smart_llm.complete(prompt)
        response_text = str(response).strip()
        
        # Clean JSON markdown blocks if any exist in the response
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        try:
            result = json.loads(response_text)
            # Ensure keys exist
            result["score"] = float(result.get("score", 0.0))
            result["misconceptions"] = list(result.get("misconceptions", []))
            result["feedback"] = str(result.get("feedback", "No feedback generated."))
            result["confidence"] = float(result.get("confidence", 1.0))
            
            logger.info(f"Evaluation completed. Score: {result['score']}, Misconceptions: {result['misconceptions']}")
            return result
        except Exception as e:
            logger.error(f"❌ Failed to parse evaluation LLM JSON: {e}. Raw response: {response_text}")
            # Fallback evaluation payload in case of parse errors
            return {
                "score": 0.5,
                "misconceptions": ["semantic evaluation parse failure"],
                "feedback": "Your submission was processed, but the evaluation grading could not be completed automatically. Please check your answer format.",
                "confidence": 0.5
            }

    async def log_evaluation_to_db(self, session_id: str, topic: str, node_id: str, eval_result: dict):
        """Asynchronously writes evaluation history to PostgreSQL."""
        try:
            async with AsyncSessionLocal() as session:
                log_entry = PostgresEvaluationHistory(
                    session_id=session_id,
                    node_id=node_id,
                    topic=topic,
                    score=eval_result["score"],
                    misconceptions=eval_result["misconceptions"]
                )
                session.add(log_entry)
                await session.commit()
                logger.info(f"Logged evaluation record to Postgres for session '{session_id}'.")
        except Exception as e:
            logger.error(f"❌ Failed to log evaluation to Postgres: {e}")
