import os
import logging
from typing import Optional
from uuid import uuid4

from langchain_core.messages import HumanMessage

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from Document import DocumentProcessor, uploads_dir, db_base_dir
from LangGraph_tool import graph

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize document processor
processor = DocumentProcessor()

# ==========================================================
# FASTAPI SERVER
# ==========================================================

app = FastAPI(
    title="PDF Study Assistant API",
    description="RAG-based study assistant with chat, summarization, and quiz generation",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str
    doc_id: str
    checkpoint_id: Optional[str] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and process a PDF document.
    
    Returns document ID and processing status.
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400, 
            detail="Only PDF files are allowed"
        )
    
    # Generate unique document ID
    doc_id = str(uuid4())
    file_path = os.path.join(uploads_dir, f"{doc_id}.pdf")
    
    try:
        # Save uploaded file
        logger.info(f"Saving uploaded file: {file.filename}")
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Process document (create vector store)
        logger.info(f"Processing PDF with doc_id: {doc_id}")
        result = processor.process_pdf(file_path, doc_id)
        
        # Check if processing was successful
        if result.get("status") == "error":
            raise HTTPException(
                status_code=500, 
                detail=f"Error processing PDF: {result.get('error')}"
            )
        
        # Add original filename to result
        result["filename"] = file.filename
        
        logger.info(f"Successfully processed {file.filename}: {result}")
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing PDF: {str(e)}")
        # Clean up file if processing failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing PDF: {str(e)}"
        )


@app.get("/documents")
async def list_documents():
    """
    List all processed documents with their metadata.
    """
    try:
        docs = []
        
        # Check if uploads directory exists
        if not os.path.exists(uploads_dir):
            return {"documents": []}
        
        # Scan uploads directory for PDFs
        for filename in os.listdir(uploads_dir):
            if filename.endswith('.pdf'):
                doc_id = filename[:-4]  # Remove .pdf extension
                db_path = os.path.join(db_base_dir, f'chroma_{doc_id}')
                
                # Only include documents that have been processed (have vector store)
                if os.path.exists(db_path):
                    docs.append({
                        "doc_id": doc_id,
                        "filename": filename
                    })
        
        logger.info(f"Found {len(docs)} processed documents")
        return {"documents": docs}
        
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error listing documents: {str(e)}"
        )


@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """
    Delete a document and its vector store.
    """
    try:
        success = processor.delete_document(doc_id)
        
        if success:
            logger.info(f"Successfully deleted document: {doc_id}")
            return {"status": "success", "message": f"Document {doc_id} deleted"}
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Document {doc_id} not found"
            )
            
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        )


async def stream_agent_response(
    message: str, 
    doc_id: str, 
    checkpoint_id: Optional[str] = None
):
    """
    Stream agent responses using Server-Sent Events (SSE).
    
    Handles conversation continuity via checkpoint_id.
    """
    is_new_conversation = checkpoint_id is None
    
    try:
        # Generate checkpoint ID for new conversations
        if is_new_conversation:
            checkpoint_id = str(uuid4())
            logger.info(f"Starting new conversation with checkpoint_id: {checkpoint_id}")
            yield f'data: {{"type": "checkpoint", "checkpoint_id": "{checkpoint_id}"}}\n\n'
        else:
            logger.info(f"Continuing conversation with checkpoint_id: {checkpoint_id}")
        
        # Configuration for LangGraph with thread_id for memory
        config = {"configurable": {"thread_id": checkpoint_id}}
        
        # Stream events from the graph
        events = graph.astream_events(
            {
                "messages": [HumanMessage(content=message)],
                "doc_id": doc_id
            },
            version="v2",
            config=config
        )
        
        # Process and stream events to client
        async for event in events:
            event_type = event["event"]
            
            # Stream LLM tokens as they're generated
            if event_type == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, 'content') and chunk.content:
                    # Escape special characters for JSON
                    content = chunk.content.replace('"', '\\"').replace("\n", "\\n")
                    yield f'data: {{"type": "content", "content": "{content}"}}\n\n'
            
            # Notify when LLM finishes and tool calls begin
            elif event_type == "on_chat_model_end":
                output = event["data"]["output"]
                if hasattr(output, "tool_calls") and output.tool_calls:
                    tool_call = output.tool_calls[0]
                    tool_name = tool_call["name"]
                    
                    # Determine action message based on tool
                    action = "Processing..."
                    if "search" in tool_name:
                        action = "Searching document..."
                    elif "summary" in tool_name:
                        action = "Generating summary..."
                    elif "quiz" in tool_name:
                        action = "Creating quiz questions..."
                    
                    yield f'data: {{"type": "tool_start", "action": "{action}"}}\n\n'
        
        # Send end signal
        yield f'data: {{"type": "end"}}\n\n'
        logger.info(f"Completed streaming response for checkpoint_id: {checkpoint_id}")
        
    except Exception as e:
        logger.error(f"Error in stream_agent_response: {str(e)}")
        # Send error to client
        error_msg = str(e).replace('"', '\\"').replace("\n", "\\n")
        yield f'data: {{"type": "error", "message": "{error_msg}"}}\n\n'
        # Always send end signal
        yield f'data: {{"type": "end"}}\n\n'


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Stream chat responses with conversation memory.
    
    Supports multi-turn conversations via checkpoint_id.
    """
    try:
        # Validate inputs
        if not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        if not request.doc_id:
            raise HTTPException(
                status_code=400,
                detail="doc_id is required"
            )
        
        # Verify document exists
        db_path = os.path.join(db_base_dir, f'chroma_{request.doc_id}')
        if not os.path.exists(db_path):
            raise HTTPException(
                status_code=404,
                detail=f"Document {request.doc_id} not found. Please upload it first."
            )
        
        logger.info(
            f"Chat request - doc_id: {request.doc_id}, "
            f"checkpoint_id: {request.checkpoint_id}, "
            f"message: {request.message[:50]}..."
        )
        
        return StreamingResponse(
            stream_agent_response(
                request.message, 
                request.doc_id, 
                request.checkpoint_id
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat_endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "service": "PDF Study Assistant API",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "message": "PDF Study Assistant API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "POST /upload_pdf",
            "list": "GET /documents",
            "delete": "DELETE /documents/{doc_id}",
            "chat": "POST /chat",
            "health": "GET /health"
        },
        "documentation": "/docs"
    }


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting PDF Study Assistant API...")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )