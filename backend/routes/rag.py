"""
RAG (Retrieval-Augmented Generation) query API routes.

Provides natural language query interface for healthcare facilities
using semantic search and LLM generation.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
import logging

from ..services.rag_service import get_rag_service
from ..utils.validators import sanitize_query
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["rag"])


class RAGQueryRequest(BaseModel):
    """Request model for RAG queries."""
    question: str = Field(..., min_length=1, max_length=500, description="Natural language question")
    top_k: Optional[int] = Field(None, ge=1, le=20, description="Number of facilities to retrieve")
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional filters (region, type, etc.)")
    similarity_threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Minimum similarity score")


class RAGQueryResponse(BaseModel):
    """Response model for RAG queries."""
    answer: str = Field(..., description="Generated answer")
    sources: list = Field(..., description="Source facilities with similarity scores")
    retrieval_time: float = Field(..., description="Time taken for retrieval (seconds)")
    generation_time: float = Field(..., description="Time taken for generation (seconds)")
    num_sources: int = Field(..., description="Number of sources retrieved")
    success: bool = Field(..., description="Whether query was successful")
    question: str = Field(..., description="Original question")
    model: Optional[str] = Field(None, description="LLM model used")


@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(request: RAGQueryRequest = Body(...)):
    """
    Answer a natural language question about Ghana healthcare facilities.
    
    Uses RAG (Retrieval-Augmented Generation) pipeline:
    1. Retrieves relevant facilities using semantic search
    2. Formats context from facility data
    3. Generates natural language answer using LLM
    
    Example questions:
    - "Show me hospitals in Accra with emergency care capabilities"
    - "Which regions have the fewest healthcare facilities?"
    - "Find facilities that provide maternal and pediatric care"
    - "What facilities have high bed capacity but low doctor count?"
    """
    # Sanitize question
    question = sanitize_query(request.question)
    
    if not question:
        raise HTTPException(status_code=400, detail="Invalid or empty question")
    
    # Validate filters if provided
    if request.filters:
        if "region" in request.filters:
            # Could add region validation here
            pass
    
    try:
        # Get RAG service and execute query
        rag_service = get_rag_service()
        
        result = rag_service.query(
            question=question,
            top_k=request.top_k,
            filters=request.filters,
            similarity_threshold=request.similarity_threshold
        )
        
        # Return response
        return RAGQueryResponse(**result)
        
    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@router.get("/health")
async def rag_health_check():
    """
    Health check endpoint for RAG service.
    
    Verifies that the RAG service can connect to LLM and embedding endpoints.
    """
    try:
        rag_service = get_rag_service()
        
        # Test with a simple query
        test_result = rag_service.query(
            question="How many hospitals are there?",
            top_k=1
        )
        
        return {
            "status": "healthy",
            "llm_model": settings.llm_model_name,
            "embedding_model": settings.embedding_model_name,
            "test_query_success": test_result["success"]
        }
        
    except Exception as e:
        logger.error(f"RAG health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@router.get("/cache/stats")
async def get_cache_stats():
    """
    Get embedding cache statistics.
    
    Returns information about cache size and utilization.
    """
    try:
        rag_service = get_rag_service()
        stats = rag_service.vector_search.get_cache_stats()
        
        return {
            "cache_stats": stats,
            "cache_enabled": settings.cache_enabled
        }
        
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve cache statistics")


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = ["router"]
