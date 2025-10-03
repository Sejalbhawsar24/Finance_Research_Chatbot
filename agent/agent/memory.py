"""
Memory management for long-term episodic and semantic memory.
Supports multiple vector store backends.
"""
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import numpy as np

from agent.config import settings
from agent.llm import get_llm


class MemoryManager:
    """Manages long-term memory with vector store backend."""
    
    def __init__(self):
        self.vector_store = self._init_vector_store()
        self.llm = get_llm()
    
    def _init_vector_store(self):
        """Initialize vector store based on configuration."""
        store_type = settings.VECTOR_STORE.lower()
        
        if store_type == "pinecone":
            return PineconeStore()
        elif store_type == "pgvector":
            return PgVectorStore()
        elif store_type == "mongodb":
            return MongoDBStore()
        else:
            return InMemoryStore()
    
    async def save_interaction(
        self,
        user_id: str,
        thread_id: str,
        query: str,
        answer: str,
        sources: List[Dict[str, Any]]
    ):
        """Save an interaction to long-term memory."""
        # Create memory content
        content = f"Query: {query}\n\nAnswer: {answer}\n\nSources: {len(sources)} sources"
        
        # Generate embedding
        embedding = await self._generate_embedding(content)
        
        # Save to vector store
        await self.vector_store.save(
            user_id=user_id,
            content=content,
            embedding=embedding,
            metadata={
                "thread_id": thread_id,
                "query": query,
                "timestamp": datetime.utcnow().isoformat(),
                "source_count": len(sources)
            }
        )
    
    async def retrieve_relevant_memories(
        self,
        user_id: str,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant memories for a query."""
        # Generate query embedding
        embedding = await self._generate_embedding(query)
        
        # Search vector store
        results = await self.vector_store.search(
            user_id=user_id,
            embedding=embedding,
            limit=limit
        )
        
        return results
    
    async def get_user_memories(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent memories for a user."""
        return await self.vector_store.get_recent(user_id, limit)
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text."""
        from langchain_openai import OpenAIEmbeddings
        
        embeddings = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
        embedding = embeddings.embed_query(text)
        return embedding


class PineconeStore:
    """Pinecone vector store implementation."""
    
    def __init__(self):
        from pinecone import Pinecone
        
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index = self.pc.Index(settings.PINECONE_INDEX_NAME)
    
    async def save(self, user_id: str, content: str, embedding: List[float], metadata: Dict):
        """Save to Pinecone."""
        vector_id = f"{user_id}_{metadata['timestamp']}"
        self.index.upsert(vectors=[{
            "id": vector_id,
            "values": embedding,
            "metadata": {
                **metadata,
                "user_id": user_id,
                "content": content
            }
        }])
    
    async def search(self, user_id: str, embedding: List[float], limit: int) -> List[Dict]:
        """Search Pinecone."""
        results = self.index.query(
            vector=embedding,
            filter={"user_id": user_id},
            top_k=limit,
            include_metadata=True
        )
        
        return [
            {
                "content": match["metadata"]["content"],
                "metadata": match["metadata"],
                "score": match["score"]
            }
            for match in results["matches"]
        ]
    
    async def get_recent(self, user_id: str, limit: int) -> List[Dict]:
        """Get recent memories."""
        # Pinecone doesn't support direct time-based queries
        # This is a simplified implementation
        return []


class PgVectorStore:
    """PostgreSQL with pgvector extension."""
    
    def __init__(self):
        import psycopg2
        from psycopg2.extras import Json
        
        self.conn = psycopg2.connect(settings.DATABASE_URL)
        self._ensure_table()
    
    def _ensure_table(self):
        """Ensure vector table exists."""
        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE EXTENSION IF NOT EXISTS vector;
                
                CREATE TABLE IF NOT EXISTS memory_vectors (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    embedding vector(1536),
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS memory_vectors_user_idx ON memory_vectors(user_id);
                CREATE INDEX IF NOT EXISTS memory_vectors_embedding_idx ON memory_vectors 
                USING ivfflat (embedding vector_cosine_ops);
            """)
            self.conn.commit()
    
    async def save(self, user_id: str, content: str, embedding: List[float], metadata: Dict):
        """Save to pgvector."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO memory_vectors (user_id, content, embedding, metadata)
                VALUES (%s, %s, %s, %s)
                """,
                (user_id, content, embedding, json.dumps(metadata))
            )
            self.conn.commit()
    
    async def search(self, user_id: str, embedding: List[float], limit: int) -> List[Dict]:
        """Search pgvector."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT content, metadata, 1 - (embedding <=> %s::vector) as score
                FROM memory_vectors
                WHERE user_id = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (embedding, user_id, embedding, limit)
            )
            
            results = []
            for row in cur.fetchall():
                results.append({
                    "content": row[0],
                    "metadata": row[1],
                    "score": row[2]
                })
            
            return results
    
    async def get_recent(self, user_id: str, limit: int) -> List[Dict]:
        """Get recent memories."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT content, metadata
                FROM memory_vectors
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit)
            )
            
            return [{"content": row[0], "metadata": row[1]} for row in cur.fetchall()]


class MongoDBStore:
    """MongoDB Atlas Vector Search."""
    
    def __init__(self):
        from pymongo import MongoClient
        
        self.client = MongoClient(settings.DATABASE_URL)
        self.db = self.client.finance_chatbot
        self.collection = self.db.memories
    
    async def save(self, user_id: str, content: str, embedding: List[float], metadata: Dict):
        """Save to MongoDB."""
        self.collection.insert_one({
            "user_id": user_id,
            "content": content,
            "embedding": embedding,
            "metadata": metadata,
            "created_at": datetime.utcnow()
        })
    
    async def search(self, user_id: str, embedding: List[float], limit: int) -> List[Dict]:
        """Search MongoDB with vector search."""
        # Simplified - requires Atlas Vector Search index
        results = self.collection.find({"user_id": user_id}).limit(limit)
        return [{"content": r["content"], "metadata": r["metadata"]} for r in results]
    
    async def get_recent(self, user_id: str, limit: int) -> List[Dict]:
        """Get recent memories."""
        results = self.collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        return [{"content": r["content"], "metadata": r["metadata"]} for r in results]


class InMemoryStore:
    """In-memory store for development."""
    
    def __init__(self):
        self.memories = []
    
    async def save(self, user_id: str, content: str, embedding: List[float], metadata: Dict):
        """Save to memory."""
        self.memories.append({
            "user_id": user_id,
            "content": content,
            "embedding": embedding,
            "metadata": metadata,
            "timestamp": datetime.utcnow()
        })
    
    async def search(self, user_id: str, embedding: List[float], limit: int) -> List[Dict]:
        """Search in memory with cosine similarity."""
        user_memories = [m for m in self.memories if m["user_id"] == user_id]
        
        # Calculate cosine similarity
        for memory in user_memories:
            memory["score"] = self._cosine_similarity(embedding, memory["embedding"])
        
        # Sort by score
        user_memories.sort(key=lambda x: x["score"], reverse=True)
        
        return [
            {"content": m["content"], "metadata": m["metadata"], "score": m["score"]}
            for m in user_memories[:limit]
        ]
    
    async def get_recent(self, user_id: str, limit: int) -> List[Dict]:
        """Get recent memories."""
        user_memories = [m for m in self.memories if m["user_id"] == user_id]
        user_memories.sort(key=lambda x: x["timestamp"], reverse=True)
        return [{"content": m["content"], "metadata": m["metadata"]} for m in user_memories[:limit]]
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity."""
        a_np = np.array(a)
        b_np = np.array(b)
        return np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np))
