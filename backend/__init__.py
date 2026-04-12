"""
Ghana Healthcare Intelligence Platform - Backend Package

This package provides a comprehensive FastAPI backend for the Ghana healthcare
intelligence platform with RAG (Retrieval-Augmented Generation) capabilities.

Main components:
- config: Configuration management with Pydantic Settings
- models: Pydantic models for facilities and regional analytics
- services: Business logic and external integrations
- routes: FastAPI route handlers
- utils: Validation and formatting utilities

Quick Start:
    from backend.main import app
    # or
    import uvicorn
    from backend.config import settings
    
    uvicorn.run("backend.main:app", host=settings.api_host, port=settings.api_port)
"""

__version__ = "1.0.0"
__author__ = "Ghana Healthcare Intelligence Platform Team"

# Export key components for convenience
from .config import settings, FacilityTypes, OperatorTypes, GhanaRegions
from .services import (
    get_databricks_client,
    get_vector_search_service,
    get_rag_service
)

__all__ = [
    "settings",
    "FacilityTypes",
    "OperatorTypes",
    "GhanaRegions",
    "get_databricks_client",
    "get_vector_search_service",
    "get_rag_service"
]
