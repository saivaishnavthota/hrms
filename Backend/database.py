# app/database.py
from sqlmodel import SQLModel, create_engine, Session
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:rishitha@localhost:5432/hrm")  

# Enhanced engine configuration for high concurrency
engine = create_engine(
    DATABASE_URL, 
    echo=False,  # Disable SQL echo for production
    pool_size=50,        # Increased pool size for 100 concurrent requests
    max_overflow=100,     # Allow up to 150 total connections
    pool_timeout=120,     # Increased timeout to 2 minutes
    pool_recycle=1800,    # Recycle connections every 30 minutes
    pool_pre_ping=True    # Verify connections before use
)

def create_tables_database():
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session with proper error handling"""
    try:
        with Session(engine) as session:
            yield session
    except Exception as e:
        logger.error(f"Database session error: {e}")
        raise

@contextmanager
def get_db_session():
    """Context manager for database sessions with automatic cleanup"""
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database transaction error: {e}")
        raise
    finally:
        session.close()
