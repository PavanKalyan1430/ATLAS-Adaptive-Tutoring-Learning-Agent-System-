import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from app.core.config import settings
from app.db.postgres import init_db
import logging
import urllib.parse

logger = logging.getLogger("SkillForge.Initializer")

def bootstrap_database():
    """
    Connects to the default 'postgres' database on the running container,
    checks if 'skillforge_db' exists, and creates it if not.
    Then runs SQLAlchemy metadata bindings to build tables.
    """
    db_url = settings.POSTGRES_SYNC_URL
    parsed = urllib.parse.urlparse(db_url)
    
    # Extract credentials
    username = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port or 5432
    
    logger.info(f"Checking for database on {host}:{port} with user {username}...")
    
    # Connect to the default 'postgres' DB first
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=username,
            password=password,
            host=host,
            port=port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'skillforge_db';")
        exists = cursor.fetchone()
        
        if not exists:
            logger.info("Database 'skillforge_db' not found. Creating database...")
            cursor.execute("CREATE DATABASE skillforge_db;")
            logger.info("Database 'skillforge_db' created successfully!")
        else:
            logger.info("Database 'skillforge_db' already exists.")
            
        cursor.close()
        conn.close()
        
        # Now run init_db from SQLAlchemy to construct tables
        logger.info("Building SQLAlchemy tables inside 'skillforge_db'...")
        init_db()
        logger.info("Database tables initialized successfully!")
        return True
    except Exception as e:
        logger.error(f"Failed to bootstrap database: {e}")
        return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    bootstrap_database()
