"""
Vector search service for semantic facility search using embeddings.

Provides embedding generation via Databricks endpoints and in-memory
vector similarity search with caching for performance.
"""

import logging
from typing import List, Dict, Any, Tuple, Optional
from functools import lru_cache
import numpy as np
import time
from openai import OpenAI

from ..config import settings

logger = logging.getLogger(__name__)


class VectorSearchService:
    """
    Service for generating embeddings and performing semantic search.
    
    Uses Databricks embedding endpoints and cosine similarity for search.
    Implements LRU caching for frequently used embeddings.
    """
    
    def __init__(
        self,
        workspace_url: Optional[str] = None,
        access_token: Optional[str] = None,
        embedding_model: Optional[str] = None
    ):
        """
        Initialize vector search service.
        
        Args:
            workspace_url: Databricks workspace URL
            access_token: Databricks access token
            embedding_model: Embedding model endpoint name
        """
        self.workspace_url = workspace_url or settings.databricks_host
        self.access_token = access_token or settings.databricks_token
        self.embedding_model = embedding_model or settings.embedding_model_name
        
        # Initialize OpenAI client for Databricks endpoints
        self.client = OpenAI(
            api_key=self.access_token,
            base_url=settings.databricks_serving_endpoint
        )
        
        # Embedding cache
        self._embedding_cache: Dict[str, List[float]] = {}
        self._cache_max_size = settings.embedding_cache_size
        
        logger.info(f"Initialized VectorSearchService with model: {self.embedding_model}")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text using Databricks endpoint.
        
        Args:
            text: Input text to embed
            
        Returns:
            Embedding vector as list of floats
            
        Raises:
            Exception: If embedding generation fails
        """
        # Check cache first
        if text in self._embedding_cache:
            logger.debug(f"Cache hit for text (length: {len(text)})")
            return self._embedding_cache[text]
        
        try:
            # Call Databricks embedding endpoint
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            # Extract embedding vector
            embedding = response.data[0].embedding
            
            # Cache if within size limit
            if len(self._embedding_cache) < self._cache_max_size:
                self._embedding_cache[text] = embedding
            
            logger.debug(f"Generated embedding (dimension: {len(embedding)})")
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    def batch_generate_embeddings(
        self,
        texts: List[str],
        batch_size: int = 10
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches.
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts per batch
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                # Anti-throttling logic for Databricks unprovisioned endpoints (max 1 QPS)
                # We sleep BEFORE the call so it distances itself from the question embeddings too!
                time.sleep(1.5)
                
                # Call API with batch
                response = self.client.embeddings.create(
                    model=self.embedding_model,
                    input=batch
                )
                
                # Extract embeddings
                batch_embeddings = [data.embedding for data in response.data]
                embeddings.extend(batch_embeddings)
                
                # Cache embeddings
                for text, embedding in zip(batch, batch_embeddings):
                    if len(self._embedding_cache) < self._cache_max_size:
                        self._embedding_cache[text] = embedding
                
                logger.debug(f"Generated {len(batch_embeddings)} embeddings (batch {i//batch_size + 1})")
                
            except Exception as e:
                logger.error(f"Failed to generate batch embeddings: {e}")
                raise
        
        logger.info(f"Generated total {len(embeddings)} embeddings")
        return embeddings
    
    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        
        Args:
            vec1: First vector
            vec2: Second vector
            
        Returns:
            Similarity score between 0 and 1
        """
        arr1 = np.array(vec1)
        arr2 = np.array(vec2)
        
        # Compute cosine similarity
        dot_product = np.dot(arr1, arr2)
        norm1 = np.linalg.norm(arr1)
        norm2 = np.linalg.norm(arr2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        
        # Ensure in [0, 1] range (handle floating point errors)
        return float(max(0.0, min(1.0, similarity)))
    
    def search_facilities(
        self,
        query: str,
        facilities: List[Dict[str, Any]],
        top_k: int = 5,
        similarity_threshold: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search over facilities using vector similarity.
        
        Args:
            query: Natural language search query
            facilities: List of facility dictionaries with 'search_text' field
            top_k: Number of results to return
            similarity_threshold: Minimum similarity score
            
        Returns:
            List of results with facility data and similarity scores
        """
        # Generate query embedding
        logger.info(f"Searching facilities with query: {query[:100]}...")
        query_embedding = self.generate_embedding(query)
        
        # Calculate similarities
        results = []
        valid_facilities = []
        texts_to_embed = []
        
        # Prepare valid texts
        for facility in facilities:
            search_text = facility.get("search_text", "")
            if not search_text:
                search_text = " ".join([
                    str(facility.get("name", "")).strip(),
                    str(facility.get("organizationDescription", "")).strip(),
                    str(facility.get("address_city", "")).strip(),
                    str(facility.get("address_stateOrRegion", "")).strip()
                ])
            
            if search_text.strip():
                valid_facilities.append(facility)
                texts_to_embed.append(search_text.strip())
                
        # Batch generate embeddings instead of sequential
        if texts_to_embed:
            logger.info(f"Batch embedding {len(texts_to_embed)} facilities...")
            facility_embeddings = self.batch_generate_embeddings(texts_to_embed, batch_size=100)
            
            for facility, facility_embedding in zip(valid_facilities, facility_embeddings):
                similarity = self.cosine_similarity(query_embedding, facility_embedding)
                
                if similarity >= similarity_threshold:
                    results.append({
                        "facility": facility,
                        "similarity": similarity
                    })
        
        # Sort by similarity (descending) and take top_k
        results.sort(key=lambda x: x["similarity"], reverse=True)
        top_results = results[:top_k]
        
        logger.info(f"Found {len(results)} matches, returning top {len(top_results)}")
        return top_results
    
    def clear_cache(self) -> None:
        """Clear the embedding cache."""
        self._embedding_cache.clear()
        logger.info("Embedding cache cleared")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        return {
            "cache_size": len(self._embedding_cache),
            "cache_max_size": self._cache_max_size,
            "cache_utilization": len(self._embedding_cache) / self._cache_max_size if self._cache_max_size > 0 else 0
        }


# ==========================================================================
# SINGLETON INSTANCE
# ==========================================================================
_service_instance: Optional[VectorSearchService] = None


def get_vector_search_service() -> VectorSearchService:
    """
    Get singleton vector search service instance.
    
    Returns:
        VectorSearchService: Shared service instance
    """
    global _service_instance
    if _service_instance is None:
        _service_instance = VectorSearchService()
    return _service_instance


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = [
    "VectorSearchService",
    "get_vector_search_service"
]
