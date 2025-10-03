"""Web search tool with multiple provider support."""
import httpx
from typing import List, Dict, Any
from agent.config import settings


def search_web(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Search the web using configured provider.
    """
    provider = settings.SEARCH_PROVIDER.lower()
    
    if provider == "tavily":
        return search_tavily(query, max_results)
    elif provider == "brave":
        return search_brave(query, max_results)
    elif provider == "serper":
        return search_serper(query, max_results)
    else:
        raise ValueError(f"Unsupported search provider: {provider}")


def search_tavily(query: str, max_results: int) -> List[Dict[str, Any]]:
    """Search using Tavily API."""
    from tavily import TavilyClient
    
    client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    response = client.search(
        query=query,
        max_results=max_results,
        search_depth="advanced",
        include_raw_content=True
    )
    
    results = []
    for item in response.get("results", []):
        results.append({
            "url": item.get("url"),
            "title": item.get("title"),
            "snippet": item.get("content"),
            "score": item.get("score", 0),
            "published_date": item.get("published_date")
        })
    
    return results


def search_brave(query: str, max_results: int) -> List[Dict[str, Any]]:
    """Search using Brave Search API."""
    url = "https://api.search.brave.com/res/v1/web/search"
    headers = {
        "Accept": "application/json",
        "X-Subscription-Token": settings.BRAVE_API_KEY
    }
    params = {
        "q": query,
        "count": max_results
    }
    
    with httpx.Client() as client:
        response = client.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
    
    results = []
    for item in data.get("web", {}).get("results", []):
        results.append({
            "url": item.get("url"),
            "title": item.get("title"),
            "snippet": item.get("description"),
            "score": 0,
            "published_date": item.get("age")
        })
    
    return results


def search_serper(query: str, max_results: int) -> List[Dict[str, Any]]:
    """Search using Serper API."""
    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": settings.SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "q": query,
        "num": max_results
    }
    
    with httpx.Client() as client:
        response = client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
    
    results = []
    for item in data.get("organic", []):
        results.append({
            "url": item.get("link"),
            "title": item.get("title"),
            "snippet": item.get("snippet"),
            "score": item.get("position", 0),
            "published_date": item.get("date")
        })
    
    return results
