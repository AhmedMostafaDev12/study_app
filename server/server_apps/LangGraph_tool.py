import os
import logging
from typing import TypedDict, Annotated, Optional, Literal
from uuid import uuid4

from langgraph.graph import add_messages, StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.tools import tool

from dotenv import load_dotenv
from .Document import DocumentProcessor

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

processor = DocumentProcessor()

# ==========================================================
# LangGraph TOOLS
# ==========================================================

@tool
def search_document_tool(doc_id: str, query: str, pages: Optional[str] = None) -> str:
    """
    Search within a specific document using semantic similarity.
    
    Args:
        doc_id: The document ID to search within
        query: The search query or question
        pages: Optional comma-separated page numbers to filter (e.g., "1,2,3")
    
    Returns:
        Formatted search results with page numbers
    """
    try:
        # Parse page filter
        page_filter = None
        if pages:
            page_filter = [int(p.strip()) for p in str(pages).split(",")]
            logger.info(f"Searching doc {doc_id} with page filter: {page_filter}")

        # Search using processor
        results = processor.search_document(
            doc_id=doc_id, 
            query=query, 
            k=8,  # Get more results for better context
            page_filter=page_filter
        )

        if not results:
            return "No relevant information found in the specified pages."

        # Format results for the LLM
        formatted = []
        for i, result in enumerate(results, 1):
            page_num = result.get("page", "unknown")
            content = result.get("content", "")
            formatted.append(
                f"[Result {i} - Page {page_num}]\n{content}\n"
            )
        
        logger.info(f"Found {len(results)} results for query: {query}")
        return "\n".join(formatted)
        
    except ValueError as e:
        # Document not found
        return f"Error: {str(e)}"
    except Exception as e:
        logger.error(f"Error in search_document_tool: {str(e)}")
        return f"Error during document search: {str(e)}"


@tool
def generate_summary_tool(
    doc_id: str, 
    pages: Optional[str] = None,
    detail_level: str = "medium"
) -> str:
    """
    Generate a summary of the document or specific pages.
    
    Args:
        doc_id: The document ID to summarize
        pages: Optional comma-separated page numbers (e.g., "1,2,3")
        detail_level: Level of detail - "brief", "medium", or "detailed"
    
    Returns:
        Retrieved content with instructions for the LLM to summarize
    """
    try:
        logger.info(
            f"Generating {detail_level} summary for doc {doc_id}, pages={pages}"
        )
        
        # Parse page filter
        page_filter = None
        if pages:
            page_filter = [int(p.strip()) for p in str(pages).split(",")]

        # Retrieve relevant content for summarization
        query = "main topics concepts ideas key points summary"
        results = processor.search_document(
            doc_id=doc_id, 
            query=query, 
            k=10,  # Get more chunks for comprehensive summary
            page_filter=page_filter
        )
        
        logger.info(f"Retrieved {len(results)} chunks for summary")
        
        if not results:
            return "No relevant information found in the specified pages."

        # Combine content from all results
        content = "\n\n".join([result["content"] for result in results])

        # Instructions for different detail levels
        detail_instructions = {
            "brief": "Create a brief 2-3 sentence summary highlighting only the main points",
            "medium": "Create a comprehensive paragraph summary (5-7 sentences) covering the key concepts",
            "detailed": "Create a detailed summary with main points organized in bullet form, including important details and examples"
        }
        
        instruction = detail_instructions.get(detail_level, detail_instructions["medium"])

        # Return content with instructions for LLM to process
        return f"""{instruction} based on the following content:

CONTENT TO SUMMARIZE:
{content}

Provide a clear, well-structured summary that captures the essential information."""
        
    except ValueError as e:
        return f"Error: {str(e)}"
    except Exception as e:
        logger.error(f"Error in generate_summary_tool: {str(e)}")
        return f"Error during summary generation: {str(e)}"


@tool
def generate_quiz_tool(
    doc_id: str, 
    pages: Optional[str] = None,
    num_questions: int = 5, 
    difficulty: str = "medium"
) -> str:
    """
    Generate quiz questions from the document or specific pages.
    
    Args:
        doc_id: The document ID to create quiz from
        pages: Optional comma-separated page numbers (e.g., "1,2,3")
        num_questions: Number of questions to generate (1-10)
        difficulty: Difficulty level - "easy", "medium", or "hard"
    
    Returns:
        Retrieved content with instructions for the LLM to create quiz
    """
    try:
        # Validate and constrain num_questions
        num_questions = max(1, min(10, num_questions))
        
        logger.info(
            f"Generating {num_questions} {difficulty} quiz questions for doc {doc_id}, pages={pages}"
        )
        
        # Parse page filter
        page_filter = None
        if pages:
            page_filter = [int(p.strip()) for p in str(pages).split(",")]

        # Retrieve content for quiz generation
        query = "important concepts definitions facts key information"
        results = processor.search_document(
            doc_id=doc_id, 
            query=query, 
            k=12,  # Get more chunks for diverse questions
            page_filter=page_filter
        )
        
        logger.info(f"Retrieved {len(results)} chunks for quiz generation")
        
        if not results:
            return "No relevant information found in the specified pages."

        # Combine content from all results
        text_for_quiz = "\n\n".join([result["content"] for result in results])

        # Difficulty descriptions
        difficulty_descriptions = {
            "easy": "simple recall questions with straightforward answers",
            "medium": "questions requiring understanding and application of concepts",
            "hard": "complex questions requiring deep comprehension, analysis, and critical thinking"
        }
        
        diff_desc = difficulty_descriptions.get(difficulty, difficulty_descriptions["medium"])

        # Return content with instructions for LLM to create quiz
        return f"""Generate exactly {num_questions} multiple-choice quiz questions at {difficulty} difficulty level ({diff_desc}) based on the following content:

CONTENT FOR QUIZ:
{text_for_quiz}

IMPORTANT INSTRUCTIONS:
1. Create {num_questions} questions that test understanding of the material
2. Each question must have 4 options (A, B, C, D)
3. Include the correct answer and a brief explanation
4. Make sure questions are clear, unambiguous, and appropriately difficult

FORMAT EACH QUESTION EXACTLY AS FOLLOWS:

Question 1: [Clear, specific question about the content]
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
Correct Answer: [Letter of correct answer]
Explanation: [Brief explanation of why this is correct and why others are wrong]

[Repeat for all {num_questions} questions]

Ensure questions test different aspects of the material and are at the {difficulty} difficulty level."""
        
    except ValueError as e:
        return f"Error: {str(e)}"
    except Exception as e:
        logger.error(f"Error in generate_quiz_tool: {str(e)}")
        return f"Error generating quiz: {str(e)}"


# ==========================================================
# LANGGRAPH AGENT
# ==========================================================

class AgentState(TypedDict):
    """State definition for the LangGraph agent"""
    messages: Annotated[list, add_messages]
    doc_id: str
    task_type: Optional[str]  # For future use to track task types


# Initialize tools and LLM
tools = [search_document_tool, generate_summary_tool, generate_quiz_tool]

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp",
    temperature=0.7,
    max_retries=3  # Retry on API failures
)

llm_with_tools = llm.bind_tools(tools)

# Initialize memory for conversation persistence
memory = MemorySaver()


async def agent_node(state: AgentState):
    """
    Main agent node that analyzes user requests and decides which tools to use.
    """
    messages = state["messages"]
    doc_id = state.get("doc_id", "")

    # System message with clear instructions
    system_message = SystemMessage(content=f"""You are an intelligent study assistant helping users learn from their PDF documents.

**Current Document ID:** {doc_id}

**Your Capabilities:**
1. **Search & Answer Questions**: Use search_document_tool to find specific information and answer questions
2. **Summarize Content**: Use generate_summary_tool to create summaries (brief/medium/detailed)
3. **Create Quizzes**: Use generate_quiz_tool to generate quiz questions (easy/medium/hard)

**Instructions:**
- When user asks a question: Use search_document_tool first, then answer based on retrieved content
- When user requests a summary: Use generate_summary_tool with appropriate detail_level
- When user requests a quiz: Use generate_quiz_tool with specified num_questions and difficulty
- If user specifies page numbers (e.g., "page 5", "pages 1-3"), pass them to the tool
- Always cite page numbers in your responses when available
- Be clear, educational, and helpful
- If the tools return no results, inform the user politely

**Examples:**
User: "What is machine learning?" → Use search_document_tool(query="machine learning")
User: "Summarize chapter 3" → Use generate_summary_tool(pages="3")
User: "Create 5 hard quiz questions" → Use generate_quiz_tool(num_questions=5, difficulty="hard")
""")

    full_messages = [system_message] + messages
    
    try:
        response = await llm_with_tools.ainvoke(full_messages)
        return {"messages": [response]}
    except Exception as e:
        logger.error(f"Error in agent_node: {str(e)}")
        error_message = AIMessage(
            content=f"I apologize, but I encountered an error: {str(e)}. Please try again."
        )
        return {"messages": [error_message]}


async def tool_execution_node(state: AgentState):
    """
    Execute tools requested by the agent.
    """
    last_message = state["messages"][-1]
    tool_calls = getattr(last_message, "tool_calls", [])

    tool_messages = []
    
    for call in tool_calls:
        tool_name = call["name"]
        tool_args = call.get("args", {})
        tool_id = call.get("id", str(uuid4()))

        # Ensure doc_id is always passed to tools
        if "doc_id" not in tool_args and state.get("doc_id"):
            tool_args["doc_id"] = state["doc_id"]

        logger.info(f"Executing tool: {tool_name} with args: {tool_args}")

        # Execute the appropriate tool
        try:
            if tool_name == "search_document_tool":
                result = search_document_tool.invoke(tool_args)
            elif tool_name == "generate_summary_tool":
                result = generate_summary_tool.invoke(tool_args)
            elif tool_name == "generate_quiz_tool":
                result = generate_quiz_tool.invoke(tool_args)
            else:
                result = f"Unknown tool: {tool_name}"
                logger.warning(f"Unknown tool called: {tool_name}")
        except Exception as e:
            logger.error(f"Error executing {tool_name}: {str(e)}")
            result = f"Error executing {tool_name}: {str(e)}"

        # Create ToolMessage with result
        tool_messages.append(
            ToolMessage(
                content=str(result),
                tool_call_id=tool_id,
                name=tool_name
            )
        )

    return {"messages": tool_messages}


def should_continue(state: AgentState) -> Literal["tools", "end"]:
    """
    Determine whether to continue to tools or end the graph.
    """
    last_message = state["messages"][-1]
    
    # Check if there are tool calls to execute
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        logger.debug(f"Continuing to tools: {len(last_message.tool_calls)} tool calls")
        return "tools"
    
    logger.debug("Ending graph execution")
    return "end"


# ==========================================================
# BUILD THE GRAPH
# ==========================================================

graph_builder = StateGraph(AgentState)

# Add nodes
graph_builder.add_node("agent", agent_node)
graph_builder.add_node("tools", tool_execution_node)

# Set entry point
graph_builder.set_entry_point("agent")

# Add edges
graph_builder.add_conditional_edges(
    "agent", 
    should_continue, 
    {
        "tools": "tools",
        "end": END
    }
)
graph_builder.add_edge("tools", "agent")  # After tools, go back to agent

# Compile with checkpointer for conversation memory
graph = graph_builder.compile(checkpointer=memory)

logger.info("LangGraph agent initialized successfully")