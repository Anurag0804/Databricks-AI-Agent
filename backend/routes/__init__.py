"""
API routes for the Ghana Healthcare Intelligence Platform.

Exports all FastAPI routers for facilities, regional analytics, and RAG queries.
"""

from .facilities import router as facilities_router
from .regional import router as regional_router
from .rag import router as rag_router

__all__ = [
    "facilities_router",
    "regional_router",
    "rag_router"
]
