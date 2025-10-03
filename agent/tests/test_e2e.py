"""End-to-end test for the research workflow."""
import pytest
import asyncio
from agent.research_graph import create_research_graph, ResearchState


@pytest.mark.asyncio
async def test_full_research_workflow():
    """
    E2E test: Complete research workflow from query to final answer.
    Tests the HDFC Bank valuation query.
    """
    # Create graph
    graph = create_research_graph()
    
    # Initial state
    initial_state: ResearchState = {
        "query": "Is HDFC Bank undervalued vs peers in last 2 quarters?",
        "thread_id": "test-thread-e2e",
        "user_id": "test-user-e2e",
        "messages": [],
        "sources": [],
        "thinking_trace": [],
        "final_answer": "",
        "iteration": 0,
        "max_iterations": 3,
        "memory_context": []
    }
    
    # Execute graph
    config = {
        "configurable": {
            "thread_id": "test-thread-e2e",
            "checkpoint_ns": "test-user-e2e"
        }
    }
    
    final_state = await graph.ainvoke(initial_state, config)
    
    # Assertions
    assert final_state["final_answer"] != "", "Final answer should not be empty"
    assert len(final_state["sources"]) > 0, "Should have gathered sources"
    assert len(final_state["thinking_trace"]) > 0, "Should have thinking trace"
    
    # Check thinking trace has all steps
    steps = [t["step"] for t in final_state["thinking_trace"]]
    assert "planning" in steps, "Should have planning step"
    assert "search" in steps, "Should have search step"
    assert "synthesis" in steps, "Should have synthesis step"
    
    # Check final answer contains relevant keywords
    answer_lower = final_state["final_answer"].lower()
    assert any(keyword in answer_lower for keyword in ["hdfc", "bank", "valuation", "peer"]), \
        "Answer should contain relevant keywords"
    
    # Check sources are deduplicated (no duplicate URLs)
    urls = [s["url"] for s in final_state["sources"]]
    assert len(urls) == len(set(urls)), "Sources should be deduplicated"
    
    print("\n=== E2E Test Results ===")
    print(f"Query: {final_state['query']}")
    print(f"Sources found: {len(final_state['sources'])}")
    print(f"Thinking steps: {len(final_state['thinking_trace'])}")
    print(f"Answer length: {len(final_state['final_answer'])} characters")
    print(f"\nFirst 200 chars of answer:\n{final_state['final_answer'][:200]}...")
