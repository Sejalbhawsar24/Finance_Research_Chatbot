"""
LangGraph-based multi-agent research workflow.
Orchestrates deep financial research with thinking, search, and synthesis.
"""
from typing import TypedDict, List, Dict, Any, Annotated
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import operator

from agent.llm import get_llm
from agent.tools.search import search_web
from agent.tools.crawler import crawl_url
from agent.config import settings


class ResearchState(TypedDict):
    """State for the research graph."""
    query: str
    thread_id: str
    user_id: str
    messages: Annotated[List[Any], operator.add]
    sources: Annotated[List[Dict[str, Any]], operator.add]
    thinking_trace: Annotated[List[Dict[str, Any]], operator.add]
    final_answer: str
    iteration: int
    max_iterations: int
    memory_context: List[Dict[str, Any]]


def planning_node(state: ResearchState) -> ResearchState:
    """
    Planning node: Analyze query and create research plan.
    """
    llm = get_llm()
    
    memory_context_str = ""
    if state.get("memory_context"):
        memory_context_str = "\n\nRelevant past context:\n" + "\n".join(
            [f"- {m.get('content', '')}" for m in state["memory_context"]]
        )
    
    planning_prompt = f"""You are a financial research analyst. Analyze this query and create a research plan.

Query: {state['query']}
{memory_context_str}

Create a structured research plan with:
1. Key questions to answer
2. Data sources to search (financial reports, news, analyst reports)
3. Metrics to analyze
4. Comparison criteria

Respond in JSON format:
{{
    "key_questions": ["question1", "question2", ...],
    "search_queries": ["query1", "query2", ...],
    "metrics": ["metric1", "metric2", ...],
    "reasoning": "brief explanation"
}}"""
    
    response = llm.invoke([HumanMessage(content=planning_prompt)])
    
    # Parse JSON response
    import json
    try:
        plan = json.loads(response.content)
    except:
        # Fallback if not valid JSON
        plan = {
            "key_questions": [state["query"]],
            "search_queries": [state["query"]],
            "metrics": ["valuation", "performance"],
            "reasoning": "Direct query analysis"
        }
    
    thinking_entry = {
        "step": "planning",
        "content": plan,
        "iteration": state["iteration"]
    }
    
    return {
        "thinking_trace": [thinking_entry],
        "messages": [AIMessage(content=f"Research plan created: {plan['reasoning']}")],
    }


def search_node(state: ResearchState) -> ResearchState:
    """
    Search node: Execute web searches and gather sources.
    """
    # Extract search queries from thinking trace
    plan = state["thinking_trace"][-1]["content"]
    search_queries = plan.get("search_queries", [state["query"]])
    
    all_sources = []
    seen_urls = set()
    
    for query in search_queries[:3]:  # Limit to 3 searches
        results = search_web(query, max_results=5)
        
        for result in results:
            url = result.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                
                # Crawl content
                content = crawl_url(url)
                
                source = {
                    "url": url,
                    "title": result.get("title", ""),
                    "snippet": result.get("snippet", ""),
                    "content": content[:5000] if content else result.get("snippet", ""),  # Limit content
                    "publishedAt": result.get("published_date"),
                    "metadata": {
                        "query": query,
                        "score": result.get("score", 0)
                    }
                }
                all_sources.append(source)
    
    thinking_entry = {
        "step": "search",
        "content": f"Found {len(all_sources)} unique sources",
        "iteration": state["iteration"]
    }
    
    return {
        "sources": all_sources,
        "thinking_trace": [thinking_entry],
        "messages": [AIMessage(content=f"Gathered {len(all_sources)} sources")],
    }


def analysis_node(state: ResearchState) -> ResearchState:
    """
    Analysis node: Analyze gathered data and extract insights.
    """
    llm = get_llm()
    
    # Prepare sources summary
    sources_text = "\n\n".join([
        f"Source {i+1}: {s['title']}\nURL: {s['url']}\nContent: {s['content'][:1000]}..."
        for i, s in enumerate(state["sources"][-10:])  # Last 10 sources
    ])
    
    plan = state["thinking_trace"][0]["content"]
    
    analysis_prompt = f"""Analyze the following sources to answer the research query.

Query: {state['query']}

Key Questions:
{chr(10).join([f"- {q}" for q in plan.get('key_questions', [])])}

Sources:
{sources_text}

Provide a detailed analysis covering:
1. Key findings from the data
2. Financial metrics and comparisons
3. Trends and patterns
4. Potential concerns or risks

Format your analysis clearly with sections."""
    
    response = llm.invoke([HumanMessage(content=analysis_prompt)])
    
    thinking_entry = {
        "step": "analysis",
        "content": response.content,
        "iteration": state["iteration"]
    }
    
    return {
        "thinking_trace": [thinking_entry],
        "messages": [AIMessage(content="Analysis complete")],
    }


def synthesis_node(state: ResearchState) -> ResearchState:
    """
    Synthesis node: Create final answer with citations.
    """
    llm = get_llm()
    
    # Get analysis from thinking trace
    analysis = next((t["content"] for t in reversed(state["thinking_trace"]) if t["step"] == "analysis"), "")
    
    # Prepare sources for citation
    sources_list = "\n".join([
        f"[{i+1}] {s['title']} - {s['url']}"
        for i, s in enumerate(state["sources"])
    ])
    
    synthesis_prompt = f"""Create a comprehensive research report answering the query.

Query: {state['query']}

Analysis:
{analysis}

Available Sources:
{sources_list}

Create a well-structured report with:
1. Executive Summary
2. Detailed Findings
3. Data Analysis
4. Conclusion and Recommendations

Use inline citations like [1], [2] to reference sources.
Be specific with numbers, dates, and metrics.
Maintain objectivity and note any limitations."""
    
    response = llm.invoke([HumanMessage(content=synthesis_prompt)])
    
    thinking_entry = {
        "step": "synthesis",
        "content": "Final report generated",
        "iteration": state["iteration"]
    }
    
    return {
        "final_answer": response.content,
        "thinking_trace": [thinking_entry],
        "messages": [AIMessage(content=response.content)],
    }


def should_continue(state: ResearchState) -> str:
    """
    Decide whether to continue research or finish.
    """
    if state["iteration"] >= state["max_iterations"]:
        return "synthesize"
    
    if len(state["sources"]) >= 10:  # Enough sources
        return "analyze"
    
    return "search"


def create_research_graph() -> StateGraph:
    """
    Create the research workflow graph.
    """
    workflow = StateGraph(ResearchState)
    
    # Add nodes
    workflow.add_node("planning", planning_node)
    workflow.add_node("search", search_node)
    workflow.add_node("analyze", analysis_node)
    workflow.add_node("synthesize", synthesis_node)
    
    # Add edges
    workflow.set_entry_point("planning")
    workflow.add_edge("planning", "search")
    workflow.add_conditional_edges(
        "search",
        should_continue,
        {
            "search": "search",
            "analyze": "analyze",
            "synthesize": "synthesize"
        }
    )
    workflow.add_edge("analyze", "synthesize")
    workflow.add_edge("synthesize", END)
    
    # Add checkpointer for state persistence
    from agent.checkpointer import get_checkpointer
    checkpointer = get_checkpointer()
    
    return workflow.compile(checkpointer=checkpointer)
