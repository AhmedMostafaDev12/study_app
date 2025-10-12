# PDF Study Assistant - Quick Start Guide

Complete guide to get your application running in minutes!

## Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Google API Key** (for Gemini AI)
- **Tavily API Key** (optional, for enhanced search)

## Step 1: Backend Setup

### 1.1 Navigate to server directory
```bash
cd server
```

### 1.2 Create virtual environment (optional but recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 1.3 Install Python dependencies
```bash
pip install -r requirements.txt
```

### 1.4 Configure environment variables
Copy the `.env.example` to `.env` and add your API keys:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit the `.env` file:
```env
GOOGLE_API_KEY="your-google-api-key-here"
TAVILY_API_KEY="your-tavily-api-key-here"  # Optional
LANGSMITH_TRACING="false"
LANGSMITH_ENDPOINT=""
LANGSMITH_API_KEY=""
LANGSMITH_PROJECT=""
```

**Getting API Keys:**
- Google API Key: https://makersuite.google.com/app/apikey
- Tavily API Key: https://tavily.com/ (optional)

### 1.5 Start the backend server
```bash
cd server_apps
python FastAPI_app.py
```

Or using uvicorn directly:
```bash
uvicorn server_apps.FastAPI_app:app --reload --host 0.0.0.0 --port 8000
```

Backend should be running at: `http://localhost:8000`

Test it: Open `http://localhost:8000/health` in your browser

---

## Step 2: Frontend Setup

### 2.1 Open a new terminal and navigate to client directory
```bash
cd client
```

### 2.2 Install Node dependencies (if not already installed)
```bash
npm install
```

### 2.3 Start the development server
```bash
npm run dev
```

Frontend should be running at: `http://localhost:5173`

---

## Step 3: Use the Application

1. **Open your browser** and go to `http://localhost:5173`

2. **Upload a PDF**:
   - Drag and drop a PDF file, or click to select
   - Wait for processing to complete
   - You'll be automatically redirected to the study interface

3. **Start studying**:
   - **Ask questions**: "What is this document about?"
   - **Get summaries**: "Summarize this document"
   - **Create quizzes**: "Create 5 quiz questions"
   - **Search specific pages**: "Summarize page 3"

4. **Use quick action buttons** for common tasks

5. **View your document library** by clicking "Back to Library"

---

## Application Flow

```
1. Home Page (/)
   ↓
   Upload PDF
   ↓
2. Processing (backend creates vector embeddings)
   ↓
3. Study Interface (/study)
   ↓
   Chat with AI about your document
   - Ask questions
   - Request summaries
   - Generate quizzes
```

---

## Project Structure

```
preplrxity_project/
├── server/                          # FastAPI Backend
│   ├── server_apps/
│   │   ├── FastAPI_app.py          # Main API server
│   │   ├── LangGraph_tool.py       # AI agent with tools
│   │   ├── Document.py             # PDF processing & RAG
│   │   ├── uploads/                # Uploaded PDFs
│   │   └── db/                     # ChromaDB vector stores
│   ├── requirements.txt
│   └── .env
│
└── client/                          # React Frontend
    ├── src/
    │   ├── components/              # UI components
    │   ├── pages/                   # Page components
    │   ├── services/                # API & streaming
    │   ├── context/                 # State management
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

---

## Troubleshooting

### Backend Issues

**Problem**: "Module not found" errors
```bash
# Solution: Reinstall dependencies
pip install -r requirements.txt
```

**Problem**: "API key not found"
```bash
# Solution: Check your .env file has valid API keys
# Make sure .env is in the server/ directory
```

**Problem**: "Port 8000 already in use"
```bash
# Solution: Kill the process or use a different port
uvicorn server_apps.FastAPI_app:app --reload --port 8001
```

### Frontend Issues

**Problem**: "Failed to fetch" or CORS errors
```bash
# Solution: Make sure backend is running on port 8000
# Check http://localhost:8000/health
```

**Problem**: Tailwind styles not loading
```bash
# Solution: Rebuild
npm run build
npm run dev
```

**Problem**: Port 5173 in use
```bash
# Vite will automatically use the next available port
# Check the terminal output for the actual port
```

---

## Features Overview

### 1. Document Management
- ✅ Upload PDF files (drag-and-drop)
- ✅ View all uploaded documents
- ✅ Delete documents
- ✅ Select document to study

### 2. AI-Powered Study Tools
- ✅ **Q&A**: Ask questions and get answers with page references
- ✅ **Summarization**: Generate summaries (brief/medium/detailed)
- ✅ **Quiz Generation**: Create quizzes (easy/medium/hard)
- ✅ **Semantic Search**: Search within documents
- ✅ **Page Filtering**: Target specific pages

### 3. Chat Features
- ✅ Real-time streaming responses
- ✅ Conversation memory (multi-turn chat)
- ✅ Markdown rendering
- ✅ Quick action buttons
- ✅ Loading indicators

---

## API Endpoints

### Backend (http://localhost:8000)

- `POST /upload_pdf` - Upload and process PDF
- `GET /documents` - List all documents
- `DELETE /documents/{doc_id}` - Delete a document
- `POST /chat` - Stream chat responses (SSE)
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation

---

## Technology Stack

### Backend
- FastAPI (API server)
- LangChain & LangGraph (AI orchestration)
- Google Gemini 2.0 Flash (LLM)
- ChromaDB (vector database)
- HuggingFace Embeddings (text embeddings)
- PyMuPDF (PDF processing)

### Frontend
- React 19 (UI)
- React Router (routing)
- Tailwind CSS (styling)
- Axios (HTTP)
- React Markdown (rendering)
- Vite (build tool)

---

## Next Steps

1. **Try different PDF documents** - Upload research papers, textbooks, articles
2. **Experiment with queries** - Try complex questions, request different summary lengths
3. **Test quiz generation** - Generate quizzes at different difficulty levels
4. **Explore conversation memory** - Ask follow-up questions

---

## Support & Documentation

- Frontend setup: `client/README_SETUP.md`
- Backend docs: `http://localhost:8000/docs` (when server is running)
- Issues: Check browser console and backend terminal logs

---

## Tips for Best Results

1. **Upload clear, text-based PDFs** (scanned images may not work well)
2. **Be specific in questions** ("What are the main causes of X?" vs "Tell me about this")
3. **Use page filters** for large documents ("Summarize pages 5-10")
4. **Start conversations fresh** for different topics (use "New Conversation" button)
5. **Keep PDFs under 50MB** for faster processing

Enjoy studying! 📚✨
