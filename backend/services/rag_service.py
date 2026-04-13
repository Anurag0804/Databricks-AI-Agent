"""
RAG (Retrieval-Augmented Generation) service for intelligent query answering.

Combines Vector Search retrieval with LLM generation to answer natural
language questions about Ghana healthcare facilities.
"""

import logging
import time
from typing import List, Dict, Any, Optional
from openai import OpenAI

from ..config import settings
from .vector_search import get_vector_search_service
from .databricks_client import get_databricks_client

logger = logging.getLogger(__name__)


class RAGService:
    """
    RAG service for answering questions about healthcare facilities.
    
    Implements the full RAG pipeline:
    1. Retrieve relevant facilities using Vector Search
    2. Format context from retrieved data
    3. Generate answer using LLM with context
    """
    
    def __init__(
        self,
        workspace_url: Optional[str] = None,
        access_token: Optional[str] = None,
        llm_model: Optional[str] = None
    ):
        """
        Initialize RAG service.
        
        Args:
            workspace_url: Databricks workspace URL
            access_token: Databricks access token
            llm_model: LLM model endpoint name
        """
        self.workspace_url = workspace_url or settings.databricks_host
        self.access_token = access_token or settings.databricks_token
        self.llm_model = llm_model or settings.llm_model_name
        
        # Initialize OpenAI client for Databricks LLM endpoints
        self.client = OpenAI(
            api_key=self.access_token,
            base_url=settings.databricks_serving_endpoint
        )
        
        # Get vector search service
        self.vector_search = get_vector_search_service()
        
        # Get Databricks client for optional data enrichment
        self.db_client = get_databricks_client()
        
        logger.info(f"Initialized RAGService with LLM: {self.llm_model}")
    
    def _enrich_facilities(self, search_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Optionally enrich Vector Search results with additional fields from database.
        Note: Bypassed because Databricks Vector Search natively returns the fully 
        enriched document_text chunk containing all text metadata!
        """
        return search_results
    
    def _has_values(self, field: Any) -> bool:
        """
        Check if array field has values.
        
        Args:
            field: Field to check
            
        Returns:
            True if field has values
        """
        return field is not None and len(field) > 0
    
    def format_context(self, search_results: List[Dict[str, Any]]) -> str:
        """
        Format retrieved facilities into context for LLM.
        
        Args:
            search_results: List of search results with facility data and similarity
            
        Returns:
            Formatted context string
        """
        context_parts = []
        
        for idx, result in enumerate(search_results, 1):
            facility = result["facility"]
            similarity = result["similarity"]
            
            document_text = facility.get("document_text", "")
            
            # Build context via the pre-formatted document text!
            if document_text:
                context_parts.append(f"Facility {idx}:\n{document_text}\nRelevance: {similarity:.3f}")
            else:
                context_parts.append(f"Facility {idx}:\nID: {facility.get('id')}\nRelevance: {similarity:.3f}")
        
        return "\n---\n".join(context_parts)
    
    def generate_answer(
        self,
        question: str,
        context: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate answer using LLM with retrieved context.
        
        Args:
            question: User's question
            context: Formatted context from retrieved facilities
            max_tokens: Maximum tokens for response
            temperature: LLM temperature
            
        Returns:
            Dictionary with answer and metadata
        """
        max_tokens = max_tokens or settings.llm_max_tokens
        temperature = temperature or settings.llm_temperature
        
        # Construct prompt
        prompt = f"""You are a healthcare data analyst assistant for Ghana. Answer the user's question based ONLY on the provided facility data. Be specific, cite facility names, and provide actionable insights.

User Question: {question}

Relevant Facilities:
{context}

Instructions:
- Answer the question directly and concisely
- Cite specific facility names when relevant
- If asked for counts or statistics, provide exact numbers
- If the data doesn't fully answer the question, acknowledge limitations
- Format lists clearly with bullet points
- Include location information when helpful

Answer:"""
        
        try:
            generation_start = time.time()
            
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            generation_time = time.time() - generation_start
            
            answer = response.choices[0].message.content.strip()
            
            return {
                "answer": answer,
                "generation_time": generation_time,
                "success": True,
                "model": self.llm_model,
                "tokens_used": response.usage.total_tokens if hasattr(response, 'usage') else None
            }
            
        except Exception as e:
            logger.error(f"Failed to generate answer: {e}")
            return {
                "answer": f"Error generating answer: {str(e)}",
                "generation_time": 0,
                "success": False,
                "model": self.llm_model,
                "error": str(e)
            }
    
    def query(
        self,
        question: str,
        top_k: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
        similarity_threshold: Optional[float] = None,
        enrich: bool = True
    ) -> Dict[str, Any]:
        """
        Answer a question using RAG pipeline with Vector Search.
        
        Args:
            question: Natural language question
            top_k: Number of facilities to retrieve
            filters: Optional filters (region, type, etc.)
            similarity_threshold: Minimum similarity score
            enrich: Whether to fetch additional fields from database
            
        Returns:
            Dictionary with answer, sources, and metrics
        """
        top_k = top_k or settings.rag_top_k_results
        similarity_threshold = similarity_threshold or settings.rag_similarity_threshold
        
        logger.info(f"RAG query: {question[:100]}...")
        
        # Step 1: Vector Search retrieval (no need to fetch all facilities!)
        retrieval_start = time.time()
        
        # Build filters for Vector Search if provided
        vs_filters = None
        if filters:
            vs_filters = {}
            if filters.get("region"):
                vs_filters["address_stateOrRegion"] = filters["region"]
            if filters.get("facility_type"):
                vs_filters["facility_type"] = filters["facility_type"]
        
        try:
            search_results = self.vector_search.search_facilities(
                query=question,
                top_k=top_k,
                similarity_threshold=similarity_threshold,
                filters=vs_filters
            )
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return {
                "answer": f"Search error: {str(e)}",
                "sources": [],
                "retrieval_time": 0,
                "generation_time": 0,
                "num_sources": 0,
                "success": False,
                "error": str(e),
                "question": question,
                "model": "offline-warning"
            }
        
        # Step 2: Optionally enrich with additional fields
        if enrich:
            search_results = self._enrich_facilities(search_results)
        
        retrieval_time = time.time() - retrieval_start
        
        if not search_results:
            return {
                "answer": "I couldn't find any relevant facilities to answer your question.",
                "sources": [],
                "retrieval_time": retrieval_time,
                "generation_time": 0,
                "num_sources": 0,
                "success": False
            }
        
        # Step 3: Format context
        context = self.format_context(search_results)
        
        # Step 4: Generate answer
        generation_result = self.generate_answer(question, context)
        
        # Step 5: Format sources
        sources = []
        for result in search_results:
            facility = result["facility"]
            sources.append({
                "name": facility.get("name", "Unknown"),
                "location": f"{facility.get('address_city', '')}, {facility.get('address_stateOrRegion', '')}",
                "type": facility.get("facility_type", facility.get("facilityTypeId", "N/A")),
                "similarity": result["similarity"]
            })
        
        return {
            "answer": generation_result["answer"],
            "sources": sources,
            "retrieval_time": retrieval_time,
            "generation_time": generation_result["generation_time"],
            "num_sources": len(sources),
            "success": generation_result["success"],
            "model": generation_result["model"],
            "question": question
        }


# ==========================================================================
# SINGLETON INSTANCE
# ==========================================================================
_service_instance: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """
    Get singleton RAG service instance.
    
    Returns:
        RAGService: Shared service instance
    """
    global _service_instance
    if _service_instance is None:
        _service_instance = RAGService()
    return _service_instance


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = [
    "RAGService",
    "get_rag_service"
]
