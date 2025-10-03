"""LLM provider abstraction."""
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from agent.config import settings


def get_llm():
    """Get configured LLM based on settings."""
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "openai":
        return ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=settings.TEMPERATURE,
            api_key=settings.OPENAI_API_KEY
        )
    elif provider == "anthropic":
        return ChatAnthropic(
            model="claude-3-sonnet-20240229",
            temperature=settings.TEMPERATURE,
            api_key=settings.ANTHROPIC_API_KEY
        )
    elif provider == "google":
        return ChatGoogleGenerativeAI(
            model="gemini-pro",
            temperature=settings.TEMPERATURE,
            google_api_key=settings.GOOGLE_API_KEY
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
