"""
Vector search service using Databricks Vector Search.

Provides semantic facility search using pre-computed embeddings
stored in Databricks Vector Search index.
"""

import logging
from typing import List, Dict, Any, Optional
from databricks.vector_search.client import VectorSearchClient
from openai import OpenAI

from ..config import settings

logger = logging.getLogger(__name__)


class VectorSearchService:
    """
    Service for semantic search using Databricks Vector Search.
    
    Uses pre-computed embeddings stored in Vector Search index
    to perform efficient similarity search without rate limits.
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
        self.use_vector_search = settings.vector_search_enabled
        
        # Initialize Vector Search Client
        if self.use_vector_search:
            try:
                self.vsc = VectorSearchClient(
                    workspace_url=self.workspace_url,
                    personal_access_token=self.access_token,
                    disable_notice=True
                )
                self.vector_index_name = settings.vector_index_name
                self.vector_endpoint_name = settings.vector_search_endpoint
                logger.info(f"Initialized VectorSearchClient with index: {self.vector_index_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Vector Search: {e}. Falling back to manual embedding.")
                self.use_vector_search = False
        
        # Initialize OpenAI client for query embedding
        self.client = OpenAI(
            api_key=self.access_token,
            base_url=settings.databricks_serving_endpoint
        )
        
        logger.info(f"Initialized VectorSearchService (Vector Search: {self.use_vector_search})")
    
    def generate_query_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for query text.
        
        Args:
            text: Input query text to embed
            
        Returns:
            Embedding vector as list of floats
            
        Raises:
            Exception: If embedding generation fails
        """
        try:
            # Call Databricks embedding endpoint for query
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            # Extract embedding vector
            embedding = response.data[0].embedding
            
            logger.debug(f"Generated query embedding (dimension: {len(embedding)})")
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}")
            raise
    
    def search_facilities(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search over facilities using Vector Search.
        
        Args:
            query: Natural language search query
            top_k: Number of results to return
            filters: Optional filters (e.g., {"region": "Greater Accra"})
            
        Returns:
            List of results with facility data and similarity scores
        """
        logger.info(f"Searching facilities with query: {query[:100]}...")
        
        if not self.use_vector_search:
            logger.error("Vector Search is not enabled. Cannot perform search.")
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.generate_query_embedding(query)
            
            # Build filter string for Vector Search
            filter_string = None
            if filters:
                filter_conditions = []
                if filters.get("region"):
                    filter_conditions.append(f"address_stateOrRegion = '{filters['region']}'")
                if filters.get("facility_type"):
                    filter_conditions.append(f"facilityTypeId = '{filters['facility_type']}'")
                if filters.get("has_doctors"):
                    filter_conditions.append("numberDoctors > 0")
                
                if filter_conditions:
                    filter_string = " AND ".join(filter_conditions)
            
            # Get the index
            index = self.vsc.get_index(
                endpoint_name=self.vector_endpoint_name,
                index_name=self.vector_index_name
            )
            
            # Perform similarity search
            search_params = {
                "columns": [
                    "unique_id", "name", "facilityTypeId", "organizationDescription",
                    "address_city", "address_stateOrRegion", "numberDoctors", "capacity",
                    "specialties", "procedure", "equipment", "capability", "phone_numbers",
                    "search_text"
                ],
                "num_results": top_k
            }
            
            if filter_string:
                search_params["filters"] = filter_string
            
            results = index.similarity_search(
                query_vector=query_embedding,
                **search_params
            )
            
            # Format results
            formatted_results = []
            if results and hasattr(results, 'get') and results.get('result'):
                result_data = results['result'].get('data_array', [])
                
                for row in result_data:
                    # Vector Search returns: [unique_id, name, ..., score]
                    # Score is the last element
                    similarity = row[-1] if len(row) > 0 else 0.0
                    
                    # Map columns to facility dict
                    facility = {
                        "unique_id": row[0] if len(row) > 0 else None,
                        "name": row[1] if len(row) > 1 else "Unknown",
                        "facilityTypeId": row[2] if len(row) > 2 else "N/A",
                        "organizationDescription": row[3] if len(row) > 3 else "",
                        "address_city": row[4] if len(row) > 4 else "",
                        "address_stateOrRegion": row[5] if len(row) > 5 else "",
                        "numberDoctors": row[6] if len(row) > 6 else 0,
                        "capacity": row[7] if len(row) > 7 else 0,
                        "specialties": row[8] if len(row) > 8 else [],
                        "procedure": row[9] if len(row) > 9 else [],
                        "equipment": row[10] if len(row) > 10 else [],
                        "capability": row[11] if len(row) > 11 else [],
                        "phone_numbers": row[12] if len(row) > 12 else [],
                        "search_text": row[13] if len(row) > 13 else ""
                    }
                    
                    formatted_results.append({
                        "facility": facility,
                        "similarity": similarity
                    })
            
            logger.info(f"Found {len(formatted_results)} facilities from Vector Search")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Vector Search failed: {e}")
            raise
    
    def get_index_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the Vector Search index.
        
        Returns:
            Dictionary with index stats
        """
        if not self.use_vector_search:
            return {"enabled": False}
        
        try:
            index = self.vsc.get_index(
                endpoint_name=self.vector_endpoint_name,
                index_name=self.vector_index_name
            )
            
            return {
                "enabled": True,
                "index_name": self.vector_index_name,
                "endpoint_name": self.vector_endpoint_name,
                "status": index.describe().get("status", {}).get("detailed_state", "unknown")
            }
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            return {"enabled": True, "error": str(e)}


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
