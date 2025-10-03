# Setup Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)
- At least one LLM API key (OpenAI, Anthropic, or Google)
- At least one search API key (Tavily, Brave, or Serper)

## Quick Start (Docker)

1. **Clone and configure environment:**

\`\`\`bash
git clone <repository-url>
cd deep-finance-research-chatbot
cp .env.example .env
\`\`\`

2. **Edit `.env` with your API keys:**

\`\`\`bash
# Required: At least one LLM provider
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
# or
GOOGLE_API_KEY=...

# Required: At least one search provider
TAVILY_API_KEY=tvly-...
# or
BRAVE_API_KEY=...
# or
SERPER_API_KEY=...

# Optional: Vector store for long-term memory
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
# or use pgvector (no additional config needed)
\`\`\`

3. **Start all services:**

\`\`\`bash
docker-compose up -d
\`\`\`

4. **Run database migrations:**

\`\`\`bash
docker-compose exec nestjs npx prisma migrate deploy
\`\`\`

5. **Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Python Agent: http://localhost:8001
- API Docs: http://localhost:8001/docs

## Local Development (without Docker)

### Backend (NestJS)

\`\`\`bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
\`\`\`

### Python Agent

\`\`\`bash
cd agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
\`\`\`

### Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Required Services

You'll need PostgreSQL and Redis running locally:

\`\`\`bash
# PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15

# Redis
docker run -d -p 6379:6379 redis:7-alpine
\`\`\`

## Running Tests

### Backend Tests

\`\`\`bash
cd backend
npm test
\`\`\`

### Agent Tests

\`\`\`bash
cd agent
pytest
\`\`\`

### E2E Test

\`\`\`bash
cd agent
pytest tests/test_e2e.py -v
\`\`\`

## Demo Script

Run the automated demo:

\`\`\`bash
chmod +x demo-script.sh
./demo-script.sh
\`\`\`

This will:
1. Start all services
2. Create a demo user
3. Execute the HDFC Bank research query
4. Generate and download a report

## Troubleshooting

### Services won't start

\`\`\`bash
# Check logs
docker-compose logs -f

# Restart services
docker-compose down
docker-compose up -d
\`\`\`

### Database connection issues

\`\`\`bash
# Reset database
docker-compose down -v
docker-compose up -d
docker-compose exec nestjs npx prisma migrate deploy
\`\`\`

### Python agent errors

Check that you have valid API keys configured in `.env`:

\`\`\`bash
docker-compose exec python-agent env | grep API_KEY
\`\`\`

## Configuration

### LLM Providers

Set `LLM_PROVIDER` to one of:
- `openai` (default) - Requires `OPENAI_API_KEY`
- `anthropic` - Requires `ANTHROPIC_API_KEY`
- `google` - Requires `GOOGLE_API_KEY`

### Search Providers

Set `SEARCH_PROVIDER` to one of:
- `tavily` (default) - Requires `TAVILY_API_KEY`
- `brave` - Requires `BRAVE_API_KEY`
- `serper` - Requires `SERPER_API_KEY`

### Vector Store

Set `VECTOR_STORE` to one of:
- `pinecone` - Requires `PINECONE_API_KEY` and `PINECONE_ENVIRONMENT`
- `pgvector` (default) - Uses PostgreSQL with pgvector extension
- `mongodb` - Requires MongoDB connection string

## Production Deployment

1. **Update environment variables:**
   - Change `JWT_SECRET` to a strong random value
   - Use production database URLs
   - Configure CORS origins

2. **Build production images:**

\`\`\`bash
docker-compose -f docker-compose.prod.yml build
\`\`\`

3. **Deploy to your infrastructure:**
   - Vercel (Frontend)
   - Railway/Render (Backend + Agent)
   - Managed PostgreSQL (Supabase/Neon)
   - Managed Redis (Upstash)

## Support

For issues or questions:
- Check the logs: `docker-compose logs -f`
- Review the API docs: http://localhost:8001/docs
- Open an issue on GitHub
