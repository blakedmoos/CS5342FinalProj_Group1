# Demo Guide for Round 1 Submission

## 🎥 Video Recording Guide

Since this is a **local privacy-preserving application**, a video demo is the best way to showcase functionality.

### Recording Tools

**macOS**:
- QuickTime Player (built-in): File > New Screen Recording
- Or use: `Cmd + Shift + 5` for screenshot toolbar

**Windows**:
- Xbox Game Bar: `Win + G`
- OBS Studio (free): https://obsproject.com/

**Chrome Extension**:
- Loom: https://www.loom.com/

### Demo Script (8-10 minutes)

#### 1. Introduction (1 minute)
- Show project title screen
- State: "Agent-Based Intelligent Tutor for Network Security"
- Mention: "Privacy-preserving, 100% local processing"

#### 2. Database Initialization (2 minutes)
```bash
# Show terminal
curl http://localhost:3000/api/init

# Or show browser UI
# Navigate to http://localhost:3000
# Click "Initialize Database"
# Show: "Database Ready - 12 documents, 49 chunks"
```

**Narration**: "First, I initialize the vector database by processing 12 PDFs - including lecture slides, textbook, and homework - into 49 searchable chunks with embeddings."

#### 3. Q&A Tutor Agent Demo (3 minutes)

Navigate to: http://localhost:3000/tutor

**Test Questions**:
1. "What is encryption and why is it important?"
2. "Explain the difference between symmetric and asymmetric cryptography"
3. "What are the main types of network attacks?"

**Show**:
- Question input
- Loading state
- Answer with citations
- Source references (Lecture 4, Lecture 5, etc.)
- Confidence score

**Narration**: "The Q&A Tutor uses Retrieval-Augmented Generation. It searches the vector database for relevant context, then uses the local Ollama LLM to generate answers with citations."

#### 4. Quiz Agent Demo (3-4 minutes)

Navigate to: http://localhost:3000/quiz

**Show**:
- Quiz settings (5 questions, all difficulties)
- Click "Start Quiz"
- Answer questions:
  - Multiple-choice: Select an option
  - True/False: Select True or False
  - Open-ended: Type a detailed answer
- Submit quiz
- Show results page with:
  - Overall score
  - Individual question feedback
  - Correct/incorrect indicators
  - Citations

**Narration**: "The Quiz Agent generates questions from the document corpus using the LLM. It supports three types: multiple-choice, true/false, and open-ended questions with intelligent grading."

#### 5. Technical Architecture (1 minute)

Show diagram or explain:
```
User Input → Embedding Generation → Vector Search 
→ Context Retrieval → LLM Generation → Response + Citations
```

**Narration**: "The architecture follows RAG principles: user queries are embedded, relevant documents are retrieved via cosine similarity, and the LLM generates contextual responses."

#### 6. Privacy & Local Processing (30 seconds)

Show:
- Ollama running locally (terminal: `ollama list`)
- No network calls to OpenAI
- Data stays on machine

**Narration**: "Everything runs locally. Ollama provides the LLM, Python handles embeddings, and all data remains on the local machine - ensuring complete privacy."

### Screenshots to Include

Capture these screens for your report:

1. **Home Page**: Database status showing 49 chunks
2. **Q&A Tutor**: Question with answer and citations
3. **Quiz Settings**: Clean interface with options
4. **Quiz Question**: Example multiple-choice question
5. **Quiz Results**: Score breakdown with feedback
6. **Terminal**: Test suite output (`./test.sh`)
7. **GitHub Repository**: README.md view

### Command Line Demo

For technical depth, show in terminal:

```bash
# 1. Check database status
curl http://localhost:3000/api/init | python3 -m json.tool

# 2. Test Q&A API
curl -X POST http://localhost:3000/api/tutor \
  -H "Content-Type: application/json" \
  -d '{"question":"What is encryption?","maxResults":5}'

# 3. Generate quiz via API
curl -X POST http://localhost:3000/api/quiz \
  -H "Content-Type: application/json" \
  -d '{"action":"generate","count":3,"topic":"all"}'

# 4. Run test suite
./test.sh

# 5. Show Ollama status
ollama list
```

## 📸 Screenshot Checklist

For your report document, capture:

- [ ] Home page with database status
- [ ] Q&A Tutor interface with sample question/answer
- [ ] Quiz settings page
- [ ] Active quiz with question displayed
- [ ] Quiz results page showing scores
- [ ] Terminal showing successful tests
- [ ] GitHub repository README
- [ ] System architecture diagram (if created)

## 🎬 Video Upload Options

1. **YouTube**: Upload as unlisted video
2. **Google Drive**: Share with view permissions
3. **Loom**: Direct shareable link
4. **Vimeo**: Education account (free)

## 📝 Report Integration

In your Round 1 report, include:

```
### System Demonstration

Video Demo: [Insert YouTube/Loom Link]
Duration: 8-10 minutes

The video demonstrates:
1. Database initialization with 12 PDFs (49 chunks)
2. Q&A Tutor Agent answering questions with citations
3. Quiz Agent generating and grading three question types
4. Privacy-preserving local processing
5. Test suite validation

Screenshots are provided in Appendix A showing key functionality.
```

## ✅ Quick Checklist for Submission

- [ ] Video recorded (8-10 minutes)
- [ ] Video uploaded with public/unlisted link
- [ ] 7+ screenshots captured
- [ ] Test suite output captured
- [ ] GitHub repository link ready
- [ ] README.md complete and updated
- [ ] All code committed and pushed
- [ ] Report document drafted

## 🔗 Important Links

- **Repository**: https://github.com/Ribeirosk8/network-security-tutor
- **Video Demo**: [Add your link here]
- **Local URL**: http://localhost:3000

---


