"""
FastAPI entry point for the Python agent service.
Handles research requests, streaming, and memory management.
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import asyncio

from agent.research_graph import create_research_graph, ResearchState
from agent.config import settings
from agent.memory import MemoryManager

app = FastAPI(title="Deep Finance Research Agent")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize memory manager
memory_manager = MemoryManager()


class ResearchRequest(BaseModel):
    query: str
    thread_id: str
    user_id: str
    show_thinking: bool = True
    max_iterations: int = 5


class ResearchResponse(BaseModel):
    thread_id: str
    answer: str
    sources: List[Dict[str, Any]]
    thinking_trace: Optional[List[Dict[str, Any]]] = None


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "llm_provider": settings.LLM_PROVIDER,
        "search_provider": settings.SEARCH_PROVIDER,
        "vector_store": settings.VECTOR_STORE
    }


@app.post("/research/stream")
async def research_stream(request: ResearchRequest):
    """
    Stream research results with thinking trace and final answer.
    Returns SSE stream with events: thinking, sources, answer, done.
    """
    async def event_generator():
        try:
            # Create research graph
            graph = create_research_graph()
            
            # Retrieve long-term memory context
            memory_context = await memory_manager.retrieve_relevant_memories(
                user_id=request.user_id,
                query=request.query,
                limit=5
            )
            
            # Initial state
            initial_state: ResearchState = {
                "query": request.query,
                "thread_id": request.thread_id,
                "user_id": request.user_id,
                "messages": [],
                "sources": [],
                "thinking_trace": [],
                "final_answer": "",
                "iteration": 0,
                "max_iterations": request.max_iterations,
                "memory_context": memory_context
            }
            
            # Stream graph execution
            config = {
                "configurable": {
                    "thread_id": request.thread_id,
                    "checkpoint_ns": request.user_id
                }
            }
            
            async for event in graph.astream(initial_state, config):
                # Extract node name and state
                for node_name, node_state in event.items():
                    if node_name == "thinking":
                        if request.show_thinking:
                            yield f"data: {json.dumps({'type': 'thinking', 'content': node_state.get('thinking_trace', [])[-1] if node_state.get('thinking_trace') else {}})}\n\n"
                    
                    elif node_name == "search":
                        sources = node_state.get("sources", [])
                        if sources:
                            yield f"data: {json.dumps({'type': 'sources', 'content': sources})}\n\n"
                    
                    elif node_name == "synthesize":
                        answer = node_state.get("final_answer", "")
                        if answer:
                            # Stream answer token by token
                            for i in range(0, len(answer), 10):
                                chunk = answer[i:i+10]
                                yield f"data: {json.dumps({'type': 'answer', 'content': chunk})}\n\n"
                                await asyncio.sleep(0.01)
            
            # Save to long-term memory
            final_state = node_state
            await memory_manager.save_interaction(
                user_id=request.user_id,
                thread_id=request.thread_id,
                query=request.query,
                answer=final_state.get("final_answer", ""),
                sources=final_state.get("sources", [])
            )
            
            # Send done event
            yield f"data: {json.dumps({'type': 'done', 'content': {'sources': final_state.get('sources', []), 'thinking_trace': final_state.get('thinking_trace', [])}})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/research", response_model=ResearchResponse)
async def research(request: ResearchRequest):
    """
    Non-streaming research endpoint.
    Returns complete research result with sources and thinking trace.
    """
    try:
        graph = create_research_graph()
        
        # Retrieve long-term memory
        memory_context = await memory_manager.retrieve_relevant_memories(
            user_id=request.user_id,
            query=request.query,
            limit=5
        )
        
        initial_state: ResearchState = {
            "query": request.query,
            "thread_id": request.thread_id,
            "user_id": request.user_id,
            "messages": [],
            "sources": [],
            "thinking_trace": [],
            "final_answer": "",
            "iteration": 0,
            "max_iterations": request.max_iterations,
            "memory_context": memory_context
        }
        
        config = {
            "configurable": {
                "thread_id": request.thread_id,
                "checkpoint_ns": request.user_id
            }
        }
        
        # Execute graph
        final_state = await graph.ainvoke(initial_state, config)
        
        # Save to long-term memory
        await memory_manager.save_interaction(
            user_id=request.user_id,
            thread_id=request.thread_id,
            query=request.query,
            answer=final_state["final_answer"],
            sources=final_state["sources"]
        )
        
        return ResearchResponse(
            thread_id=request.thread_id,
            answer=final_state["final_answer"],
            sources=final_state["sources"],
            thinking_trace=final_state["thinking_trace"] if request.show_thinking else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/{user_id}")
async def get_user_memories(user_id: str, limit: int = 10):
    """Retrieve user's long-term memories."""
    try:
        memories = await memory_manager.get_user_memories(user_id, limit)
        return {"memories": memories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
