# PDF Study Assistant - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                                   │
│                      http://localhost:5173                               │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌──────────────────────┐   ┌──────────────────────┐
        │   React Frontend     │   │   React Frontend     │
        │   (Upload/Library)   │   │   (Chat Interface)   │
        └──────────────────────┘   └──────────────────────┘
                    │                           │
                    │ HTTP POST                 │ HTTP POST (SSE)
                    │ /upload_pdf               │ /chat
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   FastAPI Backend         │
                    │   http://localhost:8000   │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │  FastAPI_app.py     │  │
                    │  │  - Routes           │  │
                    │  │  - File handling    │  │
                    │  │  - SSE streaming    │  │
                    │  └─────────┬───────────┘  │
                    │            │              │
                    │            ▼              │
                    │  ┌─────────────────────┐  │
                    │  │  Document.py        │  │
                    │  │  - PDF processing   │  │
                    │  │  - Vector store     │  │
                    │  │  - RAG search       │  │
                    │  └─────────┬───────────┘  │
                    │            │              │
                    │            ▼              │
                    │  ┌─────────────────────┐  │
                    │  │  LangGraph_tool.py  │  │
                    │  │  - AI agent         │  │
                    │  │  - Tool execution   │  │
                    │  │  - LLM calls        │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │ ChromaDB │  │  Gemini  │  │ HuggingF.│
            │  Vector  │  │   2.0    │  │ Embedder │
            │  Store   │  │  Flash   │  │          │
            └──────────┘  └──────────┘  └──────────┘
```

---

## Data Flow

### 1. Document Upload Flow

```
User uploads PDF
       │
       ▼
FileUpload Component
       │
       ▼
POST /upload_pdf (multipart/form-data)
       │
       ▼
FastAPI_app.py
       │
       ├─ Save PDF to uploads/
       │
       ▼
Document.py
       │
       ├─ Load PDF with PyMuPDF
       ├─ Split into chunks (1500 chars, 200 overlap)
       ├─ Generate embeddings (HuggingFace)
       ├─ Store in ChromaDB
       │
       ▼
Return doc_id and metadata
       │
       ▼
Frontend updates state
       │
       ▼
Navigate to Study page
```

### 2. Chat/Query Flow

```
User sends message
       │
       ▼
ChatInterface Component
       │
       ▼
POST /chat (with doc_id, message, checkpoint_id)
       │
       ▼
FastAPI_app.py (stream_agent_response)
       │
       ▼
LangGraph_tool.py (agent_node)
       │
       ├─ Analyze user request
       ├─ Determine which tool to use
       │
       ▼
Tool Execution (tool_execution_node)
       │
       ├─ search_document_tool
       │   └─> Document.py
       │       └─> ChromaDB vector search
       │           └─> Return relevant chunks
       │
       ├─ generate_summary_tool
       │   └─> Document.py
       │       └─> ChromaDB search
       │           └─> Return content
       │
       └─ generate_quiz_tool
           └─> Document.py
               └─> ChromaDB search
                   └─> Return content
       │
       ▼
Back to agent_node
       │
       ├─ Process tool results
       ├─ Call Gemini LLM
       │
       ▼
Stream response tokens via SSE
       │
       ├─ Event: "checkpoint" → checkpoint_id
       ├─ Event: "tool_start" → tool status
       ├─ Event: "content" → text tokens
       └─ Event: "end" → stream complete
       │
       ▼
streamService.js (Frontend)
       │
       ├─ Parse SSE events
       ├─ Update UI in real-time
       │
       ▼
ChatInterface displays response
```

---

## Component Architecture

### Frontend (React)

```
App.jsx (Router + AppProvider)
    │
    ├─ Home.jsx
    │   └─ FileUpload.jsx
    │
    ├─ Library.jsx
    │   └─ DocumentList.jsx
    │
    └─ Study.jsx
        └─ ChatInterface.jsx

Global State (AppContext.jsx)
    ├─ documents[]
    ├─ currentDocument
    ├─ messages[]
    ├─ checkpointId
    └─ isStreaming

Services
    ├─ api.js (REST calls)
    └─ streamService.js (SSE handling)
```

### Backend (Python)

```
FastAPI_app.py (Main API)
    │
    ├─ /upload_pdf → DocumentProcessor
    ├─ /documents → DocumentProcessor
    ├─ /chat → LangGraph Agent
    └─ /delete → DocumentProcessor

Document.py (RAG System)
    │
    ├─ process_pdf()
    ├─ search_document()
    ├─ get_vector_store()
    └─ delete_document()

LangGraph_tool.py (AI Agent)
    │
    ├─ agent_node() → LLM decisions
    ├─ tool_execution_node() → Tool calls
    │   ├─ search_document_tool
    │   ├─ generate_summary_tool
    │   └─ generate_quiz_tool
    └─ should_continue() → Flow control
```

---

## Key Technologies & Their Roles

### Backend Stack

| Technology | Purpose | Usage |
|------------|---------|-------|
| **FastAPI** | Web framework | HTTP API endpoints, SSE streaming |
| **LangChain** | AI framework | Text splitting, embeddings, LLM chains |
| **LangGraph** | Agent framework | State management, tool orchestration |
| **Gemini 2.0** | LLM | Answer questions, generate content |
| **ChromaDB** | Vector database | Store embeddings, semantic search |
| **HuggingFace** | Embeddings | Convert text to vectors |
| **PyMuPDF** | PDF parser | Extract text from PDFs |

### Frontend Stack

| Technology | Purpose | Usage |
|------------|---------|-------|
| **React** | UI library | Component-based interface |
| **React Router** | Routing | Page navigation |
| **Tailwind CSS** | Styling | Responsive, utility-first CSS |
| **Axios** | HTTP client | API calls |
| **React Markdown** | Rendering | Format AI responses |
| **Vite** | Build tool | Fast dev server, HMR |

---

## State Management

### Frontend State (AppContext)

```javascript
{
  // Document state
  documents: [],          // List of all uploaded docs
  currentDocument: null,  // Currently selected doc
  loadingDocuments: false,

  // Conversation state
  messages: [],           // Chat history
  checkpointId: null,    // For conversation continuity
  isStreaming: false,    // Is AI responding?

  // Actions
  fetchDocuments(),
  selectDocument(doc),
  addMessage(msg),
  updateLastMessage(content),
  startNewConversation()
}
```

### Backend State (LangGraph)

```python
class AgentState:
    messages: list          # Conversation history
    doc_id: str            # Current document ID
    task_type: Optional[str]

# Persisted via MemorySaver
# Keyed by checkpoint_id (thread_id)
```

---

## API Communication Patterns

### REST API (Traditional)

```
Client                          Server
  │                               │
  ├─── POST /upload_pdf ──────►  │
  │                               ├─ Process file
  │                               ├─ Create vectors
  │   ◄──── Response ────────────┤
  │        (doc_id, status)       │
```

### Server-Sent Events (SSE)

```
Client                          Server
  │                               │
  ├─── POST /chat ─────────────►  │
  │    (keeps connection open)    │
  │                               ├─ Run agent
  │   ◄──── data: checkpoint ────┤
  │   ◄──── data: tool_start ────┤
  │   ◄──── data: content ───────┤
  │   ◄──── data: content ───────┤
  │   ◄──── data: content ───────┤
  │   ◄──── data: end ───────────┤
  │                               │
```

---

## Security Considerations

### Current Setup (Development)

- ✅ CORS enabled for `localhost`
- ✅ File type validation (PDF only)
- ✅ File size limits (50MB)
- ❌ No authentication
- ❌ No rate limiting
- ❌ API keys in `.env` (not committed)

### For Production

Add these features:
- User authentication (JWT)
- Rate limiting per user
- File scanning for malware
- HTTPS/TLS encryption
- Database for user management
- Proper secret management
- Input sanitization
- CORS restricted to specific domains

---

## Performance Optimizations

### Backend

1. **Vector Store Caching**
   - LRU cache for recently used documents
   - Avoid repeated disk reads

2. **Async Operations**
   - FastAPI async endpoints
   - Concurrent tool execution

3. **Chunking Strategy**
   - 1500 char chunks
   - 200 char overlap
   - Maintains context

### Frontend

1. **React Optimizations**
   - Context prevents prop drilling
   - Lazy loading pages (potential)
   - Memoization for expensive renders

2. **Streaming**
   - Real-time UI updates
   - Progressive response display
   - Better UX for long responses

3. **Build Optimization**
   - Vite for fast builds
   - Tree shaking
   - Code splitting

---

## Scalability Path

### Current (Single User)
```
1 User → 1 Server → 1 ChromaDB → 1 Gemini API
```

### Future (Multi-User)
```
N Users → Load Balancer
              ├─ Server 1 ┐
              ├─ Server 2 ├─→ Shared PostgreSQL
              └─ Server 3 ┘     (User data)
                   │
                   ├─→ Redis (Session cache)
                   ├─→ S3 (PDF storage)
                   ├─→ Pinecone (Vector DB)
                   └─→ Gemini API (with queue)
```

---

## Monitoring & Debugging

### Development Tools

**Frontend:**
- React DevTools (component inspection)
- Browser Network tab (API/SSE monitoring)
- Console logs (debugging)

**Backend:**
- FastAPI docs (`/docs` endpoint)
- Python debugger (breakpoints)
- Logging module (INFO level)

### Key Log Points

1. PDF upload start/end
2. Vector store creation
3. Agent tool calls
4. LLM requests/responses
5. Error handling

---

## Extension Points

Want to add features? Here's where:

### New AI Tools
→ Add to `LangGraph_tool.py` (tools list)

### New API Endpoints
→ Add to `FastAPI_app.py` (routes)

### New UI Pages
→ Add to `client/src/pages/`
→ Update `App.jsx` routing

### Different LLM
→ Change `ChatGoogleGenerativeAI` in `LangGraph_tool.py`

### Different Vector DB
→ Change `Chroma` imports in `Document.py`

---

This architecture is designed to be:
- **Modular** - Each component has a clear responsibility
- **Extensible** - Easy to add new features
- **Scalable** - Can grow with your needs
- **Maintainable** - Clear separation of concerns
