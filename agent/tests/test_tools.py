"""Unit tests for research tools."""
import pytest
from agent.tools.search import search_web
from agent.tools.crawler import crawl_url


def test_search_web():
    """Test web search returns results."""
    results = search_web("HDFC Bank", max_results=3)
    
    assert isinstance(results, list)
    assert len(results) <= 3
    
    if results:
        assert "url" in results[0]
        assert "title" in results[0]


def test_crawl_url():
    """Test URL crawler extracts content."""
    content = crawl_url("https://example.com")
    
    assert content is not None
    assert len(content) > 0
    assert "Example Domain" in content
