# Deep Finance Research Chatbot

A sophisticated multi-agent financial research system with streaming responses, persistent memory, and comprehensive citation tracking.

## Architecture

- **Frontend**: Next.js 14 (React 18) with Material-UI
- **Backend**: NestJS (Node.js/TypeScript) for API, auth, and session management
- **Agent Service**: Python with LangGraph for multi-step research orchestration
- **Databases**: PostgreSQL (primary), Redis (caching/checkpointing), Pinecone/pgvector (vector store)

## Features

- 🔐 Email/password authentication with JWT sessions
- 💬 Real-time streaming chat with token-level updates
- 🧠 Dual memory system (short-term thread memory + long-term semantic memory)
- 🔍 Multi-agent deep research with web search and source deduplication
- 📊 Structured reports with inline citations
- 📚 Source panel with clickable URLs and snippets
- 💾 Persistent chat history (100+ messages per thread)
- 📥 Markdown/HTML report export

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Setup

1. Clone the repository and copy environment variables:

\`\`\`bash
cp .env.example .env
\`\`\`

2. Configure your API keys in `.env`:
   - At least one LLM provider (OpenAI, Anthropic, or Google)
   - At least one search provider (Tavily, Brave, or Serper)
   - Optional: Vector store credentials (Pinecone or use pgvector)

3. Start all services with Docker Compose:

\`\`\`bash
docker-compose up -d
\`\`\`

4. Run database migrations:

\`\`\`bash
docker-compose exec nestjs npx prisma migrate dev
\`\`\`

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Python Agent: http://localhost:8001
   - API Docs: http://localhost:8001/docs

## Development

### Local Development (without Docker)

**Backend (NestJS):**
\`\`\`bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
\`\`\`

**Python Agent:**
\`\`\`bash
cd agent
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
\`\`\`

**Frontend:**
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Running Tests

**Backend tests:**
\`\`\`bash
cd backend
npm test
\`\`\`

**Agent tests:**
\`\`\`bash
cd agent
pytest
\`\`\`

## Demo Script

Try the demo research query:

\`\`\`
Is HDFC Bank undervalued vs peers in last 2 quarters?
\`\`\`

This will:
1. Search for recent financial data on HDFC Bank
2. Compare with peer banks (ICICI, Axis, SBI)
3. Analyze valuation metrics (P/E, P/B, ROE)
4. Generate a cited report with sources

## Project Structure

\`\`\`
.
├── backend/          # NestJS API server
│   ├── src/
│   │   ├── auth/     # Authentication module
│   │   ├── threads/  # Chat threads module
│   │   ├── messages/ # Messages module
│   │   └── users/    # Users module
│   └── prisma/       # Database schema
├── agent/            # Python agent service
│   ├── agent/
│   │   ├── research_graph.py  # LangGraph workflow
│   │   ├── memory.py          # Memory management
│   │   └── tools/             # Search & crawl tools
│   └── main.py       # FastAPI entry point
├── frontend/         # Next.js frontend
│   ├── app/          # App router pages
│   └── components/   # React components
└── docker-compose.yml
\`\`\`

## Configuration

### LLM Providers

Set `LLM_PROVIDER` to one of: `openai`, `anthropic`, `google`

### Search Providers

Set `SEARCH_PROVIDER` to one of: `tavily`, `brave`, `serper`

### Vector Store

Set `VECTOR_STORE` to one of: `pinecone`, `pgvector`, `mongodb`

## License

MIT
