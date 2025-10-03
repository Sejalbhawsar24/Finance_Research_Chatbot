"""Configuration management for the agent service."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/finance_chatbot"
    REDIS_URL: str = "redis://localhost:6379"
    
    # LLM Configuration
    LLM_PROVIDER: str = "openai"  # openai, anthropic, google
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    
    # Search Configuration
    SEARCH_PROVIDER: str = "tavily"  # tavily, brave, serper
    TAVILY_API_KEY: Optional[str] = None
    BRAVE_API_KEY: Optional[str] = None
    SERPER_API_KEY: Optional[str] = None
    
    # Vector Store Configuration
    VECTOR_STORE: str = "pinecone"  # pinecone, pgvector, mongodb
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_ENVIRONMENT: Optional[str] = None
    PINECONE_INDEX_NAME: str = "finance-chatbot"
    
    # Agent Configuration
    MAX_SEARCH_RESULTS: int = 10
    MAX_ITERATIONS: int = 5
    TEMPERATURE: float = 0.7
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
