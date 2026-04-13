"""
Vector search service for semantic facility search using pre-computed embeddings.

Uses Databricks Vector Search to query facilities from the pre-computed index,
eliminating the need for on-the-fly embedding generation and rate limits.
"""

import logging
from typing import List, Dict, Any, Optional
from databricks.vector_search.client import VectorSearchClient

from ..config import settings

logger = logging.getLogger(__name__)


class VectorSearchService:
    """
    Service for performing semantic search using Databricks Vector Search.
    
    Queries the pre-computed vector search index instead of generating
    embeddings on-the-fly, avoiding rate limit issues.
    """
    
    def __init__(
        self,
        workspace_url: Optional[str] = None,
        access_token: Optional[str] = None
    ):
        """
        Initialize vector search service.
        
        Args:
            workspace_url: Databricks workspace URL
            access_token: Databricks access token
        """
        self.workspace_url = workspace_url or settings.databricks_host
        self.access_token = access_token or settings.databricks_token
        self.index_name = settings.vector_index_name
        
        # Initialize Vector Search client
        self.client = VectorSearchClient(
            workspace_url=self.workspace_url,
            personal_access_token=self.access_token,
            disable_notice=True
        )
        
        logger.info(f"Initialized VectorSearchService with index: {self.index_name}")
    
    def search_facilities(
        self,
        query: str,
        top_k: int = 5,
        similarity_threshold: float = 0.0,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search over facilities using Vector Search index.
        
        Args:
            query: Natural language search query
            top_k: Number of results to return
            similarity_threshold: Minimum similarity score (0-1)
            filters: Optional filters to apply (e.g., {"facility_type": "hospital"})
            
        Returns:
            List of results with facility data and similarity scores
            
        Raises:
            Exception: If search fails
        """
        try:
            logger.info(f"Searching facilities with query: {query[:100]}...")
            
            # Get the index
            index = self.client.get_index(
                endpoint_name=settings.vector_search_endpoint,
                index_name=self.index_name
            )
            
            # Perform similarity search
            # The index will automatically generate embeddings for the query
            response = index.similarity_search(
                query_text=query,
                columns=["id", "name", "facility_type", "operator_type", "address_city", 
                        "address_stateOrRegion", "organizationDescription", "document_text"],
                num_results=top_k,
                filters=filters
            )
            
            # Parse results
            results = []
            if response and "result" in response and "data_array" in response["result"]:
                data_array = response["result"]["data_array"]
                
                for row in data_array:
                    # Vector Search returns: [id, score, column1, column2, ...]
                    # The structure is [primary_key, score, ...other columns in order]
                    if len(row) >= 2:
                        facility_id = row[0]
                        similarity = float(row[1])
                        
                        # Only include results above threshold
                        if similarity >= similarity_threshold:
                            # Build facility dict from columns
                            # Columns order: id, name, facility_type, operator_type, address_city, 
                            #                address_stateOrRegion, organizationDescription, document_text
                            facility_data = {
                                "id": facility_id,
                                "name": row[2] if len(row) > 2 else None,
                                "facility_type": row[3] if len(row) > 3 else None,
                                "operator_type": row[4] if len(row) > 4 else None,
                                "address_city": row[5] if len(row) > 5 else None,
                                "address_stateOrRegion": row[6] if len(row) > 6 else None,
                                "organizationDescription": row[7] if len(row) > 7 else None,
                                "document_text": row[8] if len(row) > 8 else None
                            }
                            
                            results.append({
                                "facility": facility_data,
                                "similarity": similarity
                            })
            
            logger.info(f"Found {len(results)} matching facilities")
            return results
            
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            raise Exception(f"Failed to search facilities: {str(e)}")
    
    def get_index_info(self) -> Dict[str, Any]:
        """
        Get information about the vector search index.
        
        Returns:
            Dictionary with index metadata
        """
        try:
            index = self.client.get_index(
                endpoint_name=settings.vector_search_endpoint,
                index_name=self.index_name
            )
            
            return {
                "index_name": self.index_name,
                "endpoint_name": settings.vector_search_endpoint,
                "status": "available"
            }
        except Exception as e:
            logger.error(f"Failed to get index info: {e}")
            return {
                "index_name": self.index_name,
                "endpoint_name": settings.vector_search_endpoint,
                "status": "error",
                "error": str(e)
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
