"""
Service layer for the Ghana Healthcare Intelligence Platform.

Provides business logic and external integrations including
Databricks SQL, vector search, and RAG query processing.
"""

from .databricks_client import (
    DatabricksClient,
    DatabricksConnectionError,
    DatabricksQueryError,
    get_databricks_client
)

from .vector_search import (
    VectorSearchService,
    get_vector_search_service
)

from .rag_service import (
    RAGService,
    get_rag_service
)

__all__ = [
    # Databricks client
    "DatabricksClient",
    "DatabricksConnectionError",
    "DatabricksQueryError",
    "get_databricks_client",
    # Vector search
    "VectorSearchService",
    "get_vector_search_service",
    # RAG service
    "RAGService",
    "get_rag_service"
]
