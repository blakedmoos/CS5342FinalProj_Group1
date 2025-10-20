#!/bin/bash

# Test script for Network Security Tutor

echo "🧪 Network Security Tutor - Test Suite"
echo "========================================"
echo ""

BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Database Status
echo "📊 Test 1: Checking database status..."
response=$(curl -s -X GET "$BASE_URL/api/init")
totalChunks=$(echo $response | grep -o '"totalChunks":[0-9]*' | grep -o '[0-9]*')

if [ "$totalChunks" -gt "0" ]; then
    echo -e "${GREEN}✓ Database initialized with $totalChunks chunks${NC}"
else
    echo -e "${RED}✗ Database not initialized (0 chunks)${NC}"
    echo -e "${YELLOW}Run: curl -X POST $BASE_URL/api/init${NC}"
    echo "This will take 2-3 minutes..."
    exit 1
fi
echo ""

# Test 2: Q&A Tutor
echo "🤖 Test 2: Testing Q&A Tutor..."
echo "Question: What is network security?"
response=$(curl -s -X POST "$BASE_URL/api/tutor" \
    -H "Content-Type: application/json" \
    -d '{"question":"What is network security?","maxResults":3}')

answer=$(echo $response | grep -o '"answer":"[^"]*"' | head -1)
confidence=$(echo $response | grep -o '"confidence":[0-9]*' | grep -o '[0-9]*')

if [ ! -z "$answer" ] && [ "$answer" != '"answer":"I couldn'\''t find relevant information' ]; then
    echo -e "${GREEN}✓ Got answer (confidence: $confidence%)${NC}"
    echo "  Preview: $(echo $answer | cut -c1-100)..."
else
    echo -e "${RED}✗ Failed to get answer${NC}"
fi
echo ""

# Test 3: Quiz Generation
echo "🎯 Test 3: Testing Quiz Generation..."
response=$(curl -s -X POST "$BASE_URL/api/quiz" \
    -H "Content-Type: application/json" \
    -d '{"action":"generate","count":3,"topic":"all"}')

questionCount=$(echo $response | grep -o '"questions":\[' | wc -l)

if [ "$questionCount" -gt "0" ]; then
    echo -e "${GREEN}✓ Quiz generated successfully${NC}"
else
    echo -e "${RED}✗ Failed to generate quiz${NC}"
fi
echo ""

# Test 4: Quiz Grading (Multiple Choice)
echo "📝 Test 4: Testing Quiz Grading (Multiple Choice)..."
response=$(curl -s -X POST "$BASE_URL/api/quiz" \
    -H "Content-Type: application/json" \
    -d '{"action":"grade","question":"What is 2+2?","userAnswer":"4","correctAnswer":"4","questionType":"multiple-choice"}')

score=$(echo $response | grep -o '"score":[0-9]*' | grep -o '[0-9]*')

if [ "$score" = "100" ]; then
    echo -e "${GREEN}✓ Grading works (score: $score)${NC}"
else
    echo -e "${RED}✗ Grading issue (score: $score)${NC}"
fi
echo ""

# Test 5: Check Ollama
echo "🦙 Test 5: Checking Ollama LLM..."
if command -v ollama &> /dev/null; then
    if ollama list | grep -q "llama3.2:3b"; then
        echo -e "${GREEN}✓ Ollama is running with llama3.2:3b${NC}"
    else
        echo -e "${YELLOW}⚠ Ollama installed but llama3.2:3b not found${NC}"
    fi
else
    echo -e "${RED}✗ Ollama not found${NC}"
fi
echo ""

echo "========================================"
echo "✅ Test suite complete!"
echo ""
echo "📱 Open in browser:"
echo "   Home:    $BASE_URL"
echo "   Tutor:   $BASE_URL/tutor"
echo "   Quiz:    $BASE_URL/quiz"
echo "   Admin:   $BASE_URL/admin"
