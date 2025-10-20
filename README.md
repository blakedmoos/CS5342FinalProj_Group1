# Agent-Based Intelligent Tutor for Network Security

An intelligent tutoring system that uses AI agents to provide personalized learning experiences in network security. The system features two main agents: a Q&A Tutor Agent for answering student questions and a Quiz Agent for generating and grading assessments.

## 🎯 Features

- **Q&A Tutor Agent**: Answers student questions using Retrieval-Augmented Generation (RAG) with citations
- **Quiz Agent**: Generates three types of questions:
  - Multiple-choice questions (4 options)
  - True/False questions
  - Open-ended questions with LLM-based grading
- **Privacy-Preserving**: All processing happens locally - no data sent to external APIs
- **Citation System**: All answers include references to source materials
- **Vector Database**: In-memory vector search for efficient document retrieval
- **Local LLM**: Uses Ollama with llama3.2:3b model for generation

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

2. **pnpm** (v8 or higher)
   ```bash
   npm install -g pnpm
   ```

3. **Python** (v3.8 or higher) with pip
   - Download from: https://www.python.org/downloads/

4. **Ollama** (for local LLM)
   - macOS: `brew install ollama`
   - Or download from: https://ollama.ai/

### Python Dependencies

Create a virtual environment and install required packages:

```bash
python3 -m venv .venv
source .venv/bin/activate  # On macOS/Linux
# or .venv\Scripts\activate on Windows
pip install PyPDF2 sentence-transformers
```

### Node.js Dependencies

Install all Node.js packages:

```bash
pnpm install
```

## 🚀 Setup and Installation

### Step 1: Install Ollama and Download Model

```bash
# Start Ollama service
brew services start ollama

# Pull the llama3.2:3b model (3GB download)
ollama pull llama3.2:3b

# Verify it's working
ollama run llama3.2:3b "Hello, test message"
```

### Step 2: Configure Python Environment

The system uses Python for PDF processing and embeddings generation:

```bash
# Activate virtual environment
source .venv/bin/activate

# Verify installations
python -c "import PyPDF2; print('PyPDF2 installed')"
python -c "from sentence_transformers import SentenceTransformer; print('sentence-transformers installed')"
```

### Step 3: Start Development Server

```bash
pnpm dev
```

The application will be available at: http://localhost:3000

### Step 4: Initialize Vector Database

Open your browser and navigate to http://localhost:3000, then:

1. Click the **"Initialize Database"** button
2. Wait 2-3 minutes for all 12 PDFs to be processed
3. You should see: "Database Ready - 12 documents, 49 chunks"

Alternatively, initialize via command line:

```bash
curl -X POST http://localhost:3000/api/init
```

## 📚 Training Data

The system is pre-loaded with 12 network security documents in the `/public` directory:

- **Homework**: CS4331CS5342 NS Hw 1.pdf
- **Lecture Slides**: Lecture 1-10_slides.pdf (10 files)
- **Textbook**: Network Security Essentials Applications and Standards sixth edition.pdf

These documents are automatically processed during database initialization.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│                    (Next.js Frontend)                        │
└────────────────┬──────────────────┬─────────────────────────┘
                 │                  │
        ┌────────▼────────┐  ┌──────▼────────┐
        │  Tutor Agent    │  │  Quiz Agent   │
        │  (Q&A System)   │  │  (Assessment) │
        └────────┬────────┘  └──────┬────────┘
                 │                  │
                 └────────┬─────────┘
                          │
                 ┌────────▼────────┐
                 │ Vector Database │
                 │  (In-Memory)    │
                 │   49 Chunks     │
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐
                 │   Ollama LLM    │
                 │  (llama3.2:3b)  │
                 │   Local Model   │
                 └─────────────────┘
```

### Key Components

1. **Document Processor** (`lib/document-processor.server.ts`)
   - Extracts text from PDFs using PyPDF2
   - Chunks documents (500 words with 50-word overlap)
   - Generates embeddings using sentence-transformers (all-MiniLM-L6-v2)

2. **Vector Database** (`lib/vector-database.ts`)
   - In-memory storage with cosine similarity search
   - Stores 384-dimensional embeddings
   - Fast retrieval (<100ms for 49 chunks)

3. **Tutor Agent** (`lib/tutor-agent.ts`)
   - Implements RAG (Retrieval-Augmented Generation)
   - Similarity threshold: 0.3
   - Returns answers with citations and confidence scores

4. **Quiz Agent** (`lib/quiz-agent.ts`)
   - Generates questions using LLM with structured prompts
   - Parses LLM responses to extract questions, options, and answers
   - Supports topic filtering

5. **LLM Integration** (`lib/llm.ts`)
   - Ollama API client
   - Configurable temperature and token limits
   - Grading system for open-ended questions

## 🔧 Usage

### Q&A Tutor

**Browser**: Navigate to http://localhost:3000/tutor

**API**:
```bash
curl -X POST http://localhost:3000/api/tutor \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is encryption?",
    "maxResults": 5
  }'
```

**Response**:
```json
{
  "answer": "Encryption is the use of mathematical algorithms...",
  "citations": [
    {
      "source": "Lecture 4_slides.pdf",
      "page": 2,
      "type": "document",
      "relevance": 0.85
    }
  ],
  "confidence": 0.85,
  "processingTime": 2340
}
```

### Quiz Generation

**Browser**: Navigate to http://localhost:3000/quiz

**API**:
```bash
curl -X POST http://localhost:3000/api/quiz \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "count": 5,
    "topic": "all"
  }'
```

**Response**:
```json
{
  "questions": [
    {
      "id": "mcq-...",
      "type": "multiple-choice",
      "question": "What is the purpose of encryption?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "B) ...",
      "topic": "Encryption",
      "difficulty": "medium",
      "citations": [...]
    }
  ]
}
```

### Quiz Grading

**API**:
```bash
curl -X POST http://localhost:3000/api/quiz \
  -H "Content-Type: application/json" \
  -d '{
    "action": "grade",
    "question": "What is encryption?",
    "userAnswer": "A method to protect data",
    "correctAnswer": "A method to protect data confidentiality",
    "questionType": "open-ended"
  }'
```

**Response**:
```json
{
  "score": 85,
  "feedback": "Good answer! You covered the main concept...",
  "citations": []
}
```

## 🧪 Testing

### Manual Testing

1. **Test Database Status**:
```bash
curl http://localhost:3000/api/init | python3 -m json.tool
```

2. **Test Q&A Tutor**:
```bash
curl -X POST http://localhost:3000/api/tutor \
  -H "Content-Type: application/json" \
  -d '{"question":"What is a firewall?","maxResults":5}'
```

3. **Test Quiz Generation**:
```bash
curl -X POST http://localhost:3000/api/quiz \
  -H "Content-Type: application/json" \
  -d '{"action":"generate","count":3,"topic":"all"}'
```

### Automated Test Suite

Run the comprehensive test script:

```bash
chmod +x test.sh
./test.sh
```

This tests:
- Database initialization and status
- Q&A tutor functionality
- Quiz generation (all three types)
- Quiz grading (MC, TF, and open-ended)
- Ollama LLM availability

## 📁 Project Structure

```
network-security-tutor/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── init/            # Database initialization
│   │   ├── quiz/            # Quiz generation & grading
│   │   └── tutor/           # Q&A tutor
│   ├── admin/               # Admin dashboard
│   ├── quiz/                # Quiz interface
│   ├── tutor/               # Tutor interface
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── database-status.tsx  # DB status indicator
│   └── ui/                  # Shadcn UI components
├── lib/                     # Core logic
│   ├── document-processor.server.ts  # PDF processing
│   ├── document-processor.ts         # Client-side processor
│   ├── llm.ts                        # Ollama integration
│   ├── quiz-agent.ts                 # Quiz generation
│   ├── tutor-agent.ts                # Q&A system
│   ├── vector-database.ts            # Vector DB
│   └── vector-database-instance.ts   # Singleton pattern
├── public/                  # Training documents (12 PDFs)
├── scripts/                 # Utility scripts
│   └── process-pdfs.ts      # Batch PDF processor
└── .venv/                   # Python virtual environment
```

## 🔍 API Endpoints

### `/api/init`

**GET**: Check database status
```bash
curl http://localhost:3000/api/init
```

**POST**: Initialize database (process all PDFs)
```bash
curl -X POST http://localhost:3000/api/init
```

### `/api/tutor`

**POST**: Ask a question
```json
{
  "question": "string",
  "maxResults": 5  // optional
}
```

### `/api/quiz`

**POST**: Generate or grade quiz
```json
// Generate
{
  "action": "generate",
  "count": 5,
  "topic": "all"
}

// Grade
{
  "action": "grade",
  "question": "string",
  "userAnswer": "string",
  "correctAnswer": "string",
  "questionType": "multiple-choice" | "true-false" | "open-ended"
}
```

## ⚙️ Configuration

### Adjusting Similarity Threshold

Edit `lib/tutor-agent.ts`:
```typescript
private MIN_SIMILARITY_THRESHOLD: number = 0.3; // Lower = more results
```

### Changing Chunk Size

Edit `lib/document-processor.server.ts`:
```typescript
private readonly CHUNK_SIZE = 500;      // words per chunk
private readonly CHUNK_OVERLAP = 50;    // word overlap
```

### Changing LLM Model

Edit `lib/llm.ts`:
```typescript
constructor(
  baseUrl: string = 'http://localhost:11434', 
  defaultModel: string = 'llama3.2:3b'  // Change model here
) {
```

Then pull the new model:
```bash
ollama pull <model-name>
```

## 🐛 Troubleshooting

### Database shows 0 chunks after initialization

**Solution**: Initialize via browser UI at http://localhost:3000
- Click "Initialize Database" button
- Wait for processing to complete (2-3 minutes)

### Ollama connection errors

**Solution**: 
```bash
# Check if Ollama is running
brew services list | grep ollama

# Start if not running
brew services start ollama

# Test connection
curl http://localhost:11434/api/tags
```

### Python embedding generation fails

**Solution**:
```bash
# Ensure virtual environment is activated
source .venv/bin/activate

# Reinstall sentence-transformers
pip install --upgrade sentence-transformers
```

### "No relevant information found" for valid questions

**Solution**: Lower similarity threshold in `lib/tutor-agent.ts`:
```typescript
private MIN_SIMILARITY_THRESHOLD: number = 0.2;  // From 0.3
```

## 📊 Performance

- **Database Initialization**: 2-3 minutes (12 PDFs → 49 chunks)
- **Q&A Response Time**: 5-10 seconds (includes vector search + LLM generation)
- **Quiz Generation**: 10-30 seconds (depends on number of questions)
- **Quiz Grading**: 
  - Multiple-choice/True-False: <100ms
  - Open-ended: 5-10 seconds (LLM-based)

## 🔒 Privacy & Security

- **100% Local Processing**: All data stays on your machine
- **No External API Calls**: Ollama runs locally
- **No Data Collection**: No telemetry or analytics
- **No Network Required**: After initial setup

## � Deployment

### Why Not GitHub Pages?

This project **cannot** be deployed to GitHub Pages because it requires:
- Server-side API routes (Next.js)
- Python backend for embeddings
- Local Ollama LLM
- Real-time database operations

GitHub Pages only supports static HTML/CSS/JS files.

### Recommended Deployment Options

#### Option 1: Local Development (Recommended)

This is the **best option** since the project is designed to be privacy-preserving:

```bash
# Clone and setup
git clone https://github.com/blakedmoos/CS5342FinalProj_Group1
cd network-security-tutor
pnpm install
source .venv/bin/activate
pip install PyPDF2 sentence-transformers

# Start Ollama
brew services start ollama
ollama pull llama3.2:3b

# Run the application
pnpm dev
```

Access at: http://localhost:3000

#### Option 2: Share via ngrok (Temporary Demo)

For demonstrations or testing with others:

```bash
# Run your app locally first
pnpm dev

# In another terminal, create a public URL
npx ngrok http 3000
```

This gives you a public URL like: `https://abc123.ngrok.io`

**Note**: The database will reset when the tunnel closes.

#### Option 3: Docker Deployment (Advanced)

For a more portable setup:

```bash
# Create Dockerfile (not included yet)
# Package everything including Ollama and Python

docker build -t network-security-tutor .
docker run -p 3000:3000 network-security-tutor
```

#### Option 4: University Server (If Available)

If your university provides server access:
1. Deploy to a Linux server with Docker
2. Install dependencies (Node.js, Python, Ollama)
3. Run with systemd or PM2 for persistence

### For Project Submission

Since this is a **privacy-preserving local application**, the recommended approach is:

1. ✅ **GitHub Repository**: Code, documentation, README (Done!)
2. ✅ **Video Demo**: Record a 5-10 minute walkthrough
3. ✅ **Screenshots**: Include in your report
4. ✅ **Installation Guide**: Already in README
5. ✅ **Test Results**: Run `./test.sh` and capture output

### Project Repository

🔗 **GitHub**: https://github.com/blakedmoos/CS5342FinalProj_Group1

## �📝 Future Enhancements

- [ ] Persistent storage (save embeddings to disk)
- [ ] Topic-based filtering improvements
- [ ] Docker containerization
- [ ] Batch quiz grading
- [ ] Student progress tracking
- [ ] Multi-language support

## 📄 License

This project is for educational purposes as part of the Network Security course.

## 👥 Authors

- Amauri Ribeiro

## 🙏 Acknowledgments

- Network Security course materials
- Ollama project for local LLM
- Sentence Transformers for embeddings
- Next.js and React teams

---

**Last Updated**: October 3, 2025  
**Version**: 1.0.0  
**Course**: CS4331/CS5342 - Network Security
