import os
import logging
from typing import Optional, List
from collections import OrderedDict

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==========================================================
# CONFIGURATION - Exported for other modules
# ==========================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
uploads_dir = os.path.join(current_dir, "uploads")
db_base_dir = os.path.join(current_dir, "db")

os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(db_base_dir, exist_ok=True)

# ==========================================================
# RAG DOCUMENT PROCESSING 
# ==========================================================

class DocumentProcessor:
    """Handles PDF processing and vector store management"""

    def __init__(self, max_cached_stores: int = 10):
        """
        Initialize the document processor.
        
        Args:
            max_cached_stores: Maximum number of vector stores to keep in memory (LRU eviction)
        """
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        self.active_stores = OrderedDict()  # LRU cache
        self.max_cached_stores = max_cached_stores
        logger.info("DocumentProcessor initialized")

    def process_pdf(self, file_path: str, doc_id: str) -> dict:
        """
        Process a PDF file and create a vector store.
        
        Args:
            file_path: Path to the PDF file
            doc_id: Unique identifier for the document
            
        Returns:
            Dict with processing status and metadata
        """
        persist_directory = os.path.join(db_base_dir, f'chroma_{doc_id}')

        try:
            # Check if a vector store already exists
            if os.path.exists(persist_directory):
                logger.info(f"Loading existing vector store for doc_id: {doc_id}")
                db = Chroma(
                    persist_directory=persist_directory, 
                    embedding_function=self.embeddings
                )
                self._cache_store(doc_id, db)
                
                return {
                    "doc_id": doc_id,
                    "status": "loaded",
                    "chunks": db._collection.count()
                }
            
            # Load and split the document if not already processed
            logger.info(f"Processing new PDF: {file_path}")
            
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"PDF file not found: {file_path}")
            
            loader = PyMuPDFLoader(file_path)
            documents = loader.load()

            if not documents:
                raise ValueError("PDF contains no readable content")

            # Extract metadata
            total_pages = len(documents)
            logger.info(f"Loaded {total_pages} pages from PDF")

            # Split into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500, 
                chunk_overlap=200,
                separators=["\n\n", "\n", " ", ""],
                length_function=len
            )

            docs = text_splitter.split_documents(documents)

            # Ensure page metadata exists (PyMuPDF usually adds this)
            for doc in docs:
                if 'page' not in doc.metadata:
                    logger.warning(f"Missing page metadata for chunk, defaulting to 0")
                    doc.metadata['page'] = 0

            logger.info(f"Created {len(docs)} chunks from {total_pages} pages")

            # Create and persist the vector store
            db = Chroma.from_documents(
                docs,
                self.embeddings,
                persist_directory=persist_directory
            )
            
            self._cache_store(doc_id, db)

            return {
                "doc_id": doc_id,
                "status": "created",
                "total_pages": total_pages,
                "chunks": len(docs)
            }
            
        except Exception as e:
            logger.error(f"Error processing PDF {doc_id}: {str(e)}")
            return {
                "doc_id": doc_id,
                "status": "error",
                "error": str(e)
            }
    
    def _cache_store(self, doc_id: str, db: Chroma):
        """
        Cache a vector store with LRU eviction.
        
        Args:
            doc_id: Document identifier
            db: Chroma database instance
        """
        # Remove if already exists (for LRU move to end)
        if doc_id in self.active_stores:
            del self.active_stores[doc_id]
        
        # Add to cache
        self.active_stores[doc_id] = db
        
        # Evict oldest if cache is full
        if len(self.active_stores) > self.max_cached_stores:
            oldest_doc_id = next(iter(self.active_stores))
            logger.info(f"Evicting {oldest_doc_id} from cache (LRU)")
            del self.active_stores[oldest_doc_id]
    
    def get_vector_store(self, doc_id: str) -> Chroma:
        """
        Retrieve the vector store for a given document ID.
        
        Args:
            doc_id: Document identifier
            
        Returns:
            Chroma database instance
            
        Raises:
            ValueError: If document not found
        """
        # Check if the vector store is already loaded in memory
        if doc_id in self.active_stores:
            logger.debug(f"Cache hit for doc_id: {doc_id}")
            # Move to end (mark as recently used)
            self.active_stores.move_to_end(doc_id)
            return self.active_stores[doc_id]
        
        # If not loaded, check if it exists on disk and load it
        persist_directory = os.path.join(db_base_dir, f'chroma_{doc_id}')
        
        if not os.path.exists(persist_directory):
            raise ValueError(
                f"Vector store not found for document ID: {doc_id}. "
                "Please upload the document first."
            )
        
        # Load the vector store from disk
        logger.info(f"Loading vector store from disk for doc_id: {doc_id}")
        db = Chroma(
            persist_directory=persist_directory,
            embedding_function=self.embeddings
        )
        
        self._cache_store(doc_id, db)
        return db
    
    def search_document(
        self, 
        doc_id: str, 
        query: str, 
        k: int = 5,
        page_filter: Optional[List[int]] = None,
        score_threshold: float = 0.0
    ) -> List[dict]:
        """
        Search within a document with optional page filtering.
        
        Args:
            doc_id: Document identifier
            query: Search query
            k: Number of results to return
            page_filter: Optional list of page numbers to filter by
            score_threshold: Minimum similarity score (0-1)
            
        Returns:
            List of dicts with content, page, and source
        """
        try:
            db = self.get_vector_store(doc_id)

            # Build metadata filter if page_filter is provided
            where_filter = None
            if page_filter:
                where_filter = {"page": {"$in": page_filter}}

            # Create retriever with proper filter syntax
            search_kwargs = {
                "k": k, 
                "score_threshold": score_threshold
            }
            
            if where_filter:
                search_kwargs["filter"] = where_filter

            retriever = db.as_retriever(
                search_type="mmr",
                search_kwargs=search_kwargs
            )

            # Get relevant docs
            docs = retriever.invoke(query)
            
            logger.info(f"Found {len(docs)} results for query in doc {doc_id}")

            return [
                {
                    "content": doc.page_content,
                    "page": doc.metadata.get("page", "unknown"),
                    "source": doc.metadata.get("source", "unknown")
                }
                for doc in docs
            ]
            
        except ValueError as e:
            logger.error(f"Document not found: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error searching document {doc_id}: {str(e)}")
            return []
    
    def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document and its vector store.
        
        Args:
            doc_id: Document identifier
            
        Returns:
            True if deleted successfully
        """
        import shutil
        
        persist_directory = os.path.join(db_base_dir, f'chroma_{doc_id}')
        
        try:
            # Remove from cache
            if doc_id in self.active_stores:
                del self.active_stores[doc_id]
                logger.info(f"Removed {doc_id} from cache")
            
            # Remove from disk
            if os.path.exists(persist_directory):
                shutil.rmtree(persist_directory)
                logger.info(f"Deleted vector store for {doc_id}")
            
            # Remove PDF file
            pdf_path = os.path.join(uploads_dir, f"{doc_id}.pdf")
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
                logger.info(f"Deleted PDF file for {doc_id}")

            # Remove metadata file
            metadata_path = os.path.join(uploads_dir, f"{doc_id}.txt")
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
                logger.info(f"Deleted metadata file for {doc_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document {doc_id}: {str(e)}")
            return False
    
    def clear_cache(self):
        """Clear all cached vector stores from memory"""
        self.active_stores.clear()
        logger.info("Cleared all cached vector stores")