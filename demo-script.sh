#!/bin/bash

# Demo Script for Deep Finance Research Chatbot
# This script demonstrates the full workflow of the application

echo "========================================="
echo "Deep Finance Research Chatbot Demo"
echo "========================================="
echo ""

# Check if services are running
echo "1. Checking if services are running..."
if ! docker ps | grep -q finance-chatbot; then
    echo "   Starting services with docker-compose..."
    docker-compose up -d
    echo "   Waiting for services to be ready..."
    sleep 10
else
    echo "   ✓ Services are already running"
fi

echo ""
echo "2. Running database migrations..."
docker-compose exec -T nestjs npx prisma migrate deploy

echo ""
echo "3. Creating demo user..."
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123",
    "name": "Demo User"
  }' \
  -s | jq '.'

echo ""
echo "4. Logging in..."
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123"
  }' \
  -s | jq -r '.access_token')

echo "   ✓ Logged in successfully"

echo ""
echo "5. Creating research thread..."
THREAD_ID=$(curl -X POST http://localhost:3001/threads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "HDFC Bank Valuation Analysis"
  }' \
  -s | jq -r '.id')

echo "   ✓ Thread created: $THREAD_ID"

echo ""
echo "6. Starting research query..."
echo "   Query: 'Is HDFC Bank undervalued vs peers in last 2 quarters?'"
echo ""
echo "   This will:"
echo "   - Search for recent financial data on HDFC Bank"
echo "   - Compare with peer banks (ICICI, Axis, SBI)"
echo "   - Analyze valuation metrics (P/E, P/B, ROE)"
echo "   - Generate a cited report with sources"
echo ""

# Note: WebSocket streaming demo would require a WebSocket client
# For simplicity, we'll use the non-streaming endpoint

curl -X POST http://localhost:8001/research \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"Is HDFC Bank undervalued vs peers in last 2 quarters?\",
    \"thread_id\": \"$THREAD_ID\",
    \"user_id\": \"demo-user\",
    \"show_thinking\": true,
    \"max_iterations\": 3
  }" \
  -s | jq '.'

echo ""
echo "7. Retrieving thread with messages and sources..."
curl -X GET "http://localhost:3001/threads/$THREAD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '{
    title: .title,
    message_count: (.messages | length),
    source_count: (.sources | length),
    sources: .sources[0:3] | map({title, url})
  }'

echo ""
echo "8. Generating and downloading report..."
REPORT_ID=$(curl -X POST http://localhost:3001/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"threadId\": \"$THREAD_ID\",
    \"title\": \"HDFC Bank Valuation Analysis\",
    \"content\": \"# Report content here\",
    \"format\": \"MARKDOWN\",
    \"citations\": []
  }" \
  -s | jq -r '.id')

echo "   ✓ Report created: $REPORT_ID"
echo "   Download URL: http://localhost:3001/reports/$REPORT_ID/download"

echo ""
echo "========================================="
echo "Demo Complete!"
echo "========================================="
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  Python Agent: http://localhost:8001"
echo "  API Docs: http://localhost:8001/docs"
echo ""
echo "Demo credentials:"
echo "  Email: demo@example.com"
echo "  Password: demo123"
echo ""
