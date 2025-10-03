"""Checkpointer for LangGraph state persistence."""
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.checkpoint.memory import MemorySaver
from agent.config import settings
import psycopg2


def get_checkpointer():
    """
    Get checkpointer based on configuration.
    Uses PostgreSQL for production, memory for development.
    """
    try:
        # Try PostgreSQL checkpointer
        conn = psycopg2.connect(settings.DATABASE_URL)
        return PostgresSaver(conn)
    except Exception as e:
        print(f"Warning: Could not connect to PostgreSQL for checkpointing: {e}")
        print("Falling back to in-memory checkpointer")
        return MemorySaver()
