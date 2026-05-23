import os
import sys
import json
import logging

# Ensure parent directory is in path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SkillForge.Ingest")

from skillforge.app.db.qdrant import qdrant_mgr

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

def load_json_file(file_path: str) -> list:
    """Safely loads a JSON file from disk."""
    if not os.path.exists(file_path):
        logger.error(f"❌ File not found: {file_path}")
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def run_ingestion():
    logger.info("🚀 Starting SkillForge curriculum ingestion...")
    
    # 1. Ingest DSA Questions
    dsa_questions_path = os.path.join(DATA_DIR, "questions", "dsa.json")
    dsa_questions = load_json_file(dsa_questions_path)
    logger.info(f"Loaded {len(dsa_questions)} DSA questions.")
    
    # 2. Ingest Computer Fundamentals Questions
    fund_questions_path = os.path.join(DATA_DIR, "questions", "computer_fundamentals.json")
    fund_questions = load_json_file(fund_questions_path)
    logger.info(f"Loaded {len(fund_questions)} Computer Fundamentals questions.")
    
    # Combined Questions Ingestion
    all_questions = dsa_questions + fund_questions
    if all_questions:
        logger.info(f"Upserting a total of {len(all_questions)} questions to Qdrant...")
        qdrant_mgr.insert_questions(all_questions)
        logger.info("✅ Questions successfully ingested!")
        
    # 3. Ingest DSA Resources
    dsa_resources_path = os.path.join(DATA_DIR, "resources", "dsa.json")
    dsa_resources = load_json_file(dsa_resources_path)
    logger.info(f"Loaded {len(dsa_resources)} DSA resource chunks.")
    
    # 4. Ingest Computer Fundamentals Resources
    fund_resources_path = os.path.join(DATA_DIR, "resources", "computer_fundamentals.json")
    fund_resources = load_json_file(fund_resources_path)
    logger.info(f"Loaded {len(fund_resources)} Computer Fundamentals resource chunks.")
    
    # Combined Resources Ingestion
    all_resources = dsa_resources + fund_resources
    if all_resources:
        logger.info(f"Upserting a total of {len(all_resources)} resources to Qdrant...")
        qdrant_mgr.insert_resources(all_resources)
        logger.info("✅ Resources successfully ingested!")
        
    logger.info("🎉 Ingestion pipeline complete! SkillForge is ready.")

if __name__ == "__main__":
    run_ingestion()
