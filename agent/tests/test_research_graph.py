"""Unit tests for research graph."""
import pytest
from agent.research_graph import (
    planning_node,
    search_node,
    analysis_node,
    synthesis_node,
    ResearchState
)


@pytest.fixture
def initial_state():
    """Create initial state for testing."""
    return ResearchState(
        query="Is HDFC Bank undervalued?",
        thread_id="test-thread",
        user_id="test-user",
        messages=[],
        sources=[],
        thinking_trace=[],
        final_answer="",
        iteration=0,
        max_iterations=3,
        memory_context=[]
    )


def test_planning_node(initial_state):
    """Test planning node creates research plan."""
    result = planning_node(initial_state)
    
    assert len(result["thinking_trace"]) == 1
    assert result["thinking_trace"][0]["step"] == "planning"
    assert "key_questions" in result["thinking_trace"][0]["content"]


def test_search_node(initial_state):
    """Test search node gathers sources."""
    # Add planning result first
    initial_state["thinking_trace"] = [{
        "step": "planning",
        "content": {
            "search_queries": ["HDFC Bank valuation"],
            "key_questions": ["What is HDFC Bank's P/E ratio?"]
        }
    }]
    
    result = search_node(initial_state)
    
    assert "sources" in result
    assert len(result["thinking_trace"]) == 1
    assert result["thinking_trace"][0]["step"] == "search"


def test_synthesis_node(initial_state):
    """Test synthesis node creates final answer."""
    # Setup state with analysis
    initial_state["thinking_trace"] = [
        {
            "step": "planning",
            "content": {"key_questions": ["Test question"]}
        },
        {
            "step": "analysis",
            "content": "Test analysis content"
        }
    ]
    initial_state["sources"] = [
        {
            "url": "https://example.com",
            "title": "Test Source",
            "content": "Test content"
        }
    ]
    
    result = synthesis_node(initial_state)
    
    assert result["final_answer"] != ""
    assert len(result["thinking_trace"]) == 1
    assert result["thinking_trace"][0]["step"] == "synthesis"
