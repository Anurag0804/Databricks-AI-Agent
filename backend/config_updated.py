"""
Configuration management for Ghana Healthcare Intelligence Platform.

This module provides centralized configuration using Pydantic Settings
for environment variables, Databricks connections, and API settings.
"""

from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    
    Environment variables should be prefixed with the app name or set directly.
    Example: DATABRICKS_HOST, DATABRICKS_TOKEN, etc.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # ==========================================================================
    # APPLICATION SETTINGS
    # ==========================================================================
    app_name: str = "Ghana Healthcare Intelligence Platform"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, description="Enable debug mode")
    environment: str = Field(default="production", description="Environment: development, staging, production")
    
    # ==========================================================================
    # DATABRICKS CONNECTION
    # ==========================================================================
    databricks_host: str = Field(
        ...,
        description="Databricks workspace URL (e.g., https://adb-xxx.azuredatabricks.net)",
        json_schema_extra={"env": "DATABRICKS_HOST"}
    )
    databricks_token: str = Field(
        ...,
        description="Databricks personal access token",
        json_schema_extra={"env": "DATABRICKS_TOKEN"}
    )
    databricks_http_path: str = Field(
        ...,
        description="SQL warehouse HTTP path",
        json_schema_extra={"env": "DATABRICKS_HTTP_PATH"}
    )
    
    # ==========================================================================
    # DATA CATALOG CONFIGURATION
    # ==========================================================================
    catalog_name: str = Field(default="virtue_foundation", description="Unity Catalog name")
    schema_name: str = Field(default="ghana", description="Schema/database name")
    
    # Table names
    table_facilities_silver: str = Field(default="facilities_silver", description="Silver layer facilities table")
    table_facilities_enriched: str = Field(default="facilities_enriched", description="Enriched facilities table")
    table_facilities_anomalies: str = Field(default="facilities_anomalies", description="Anomalies detection table")
    table_regional_summary: str = Field(default="regional_summary", description="Regional aggregations table")
    table_facilities_bronze_source: str = Field(default="facilities_bronze_source", description="Bronze source table")
    table_facility_documents: str = Field(default="facility_documents", description="Document table for Vector Search")
    
    # ==========================================================================
    # VECTOR SEARCH CONFIGURATION
    # ==========================================================================
    vector_search_enabled: bool = Field(default=True, description="Use Vector Search index for RAG")
    vector_search_endpoint: str = Field(default="facility_search_endpoint", description="Vector Search endpoint name")
    vector_search_index: str = Field(default="facility_embeddings", description="Vector Search index name")
    
    # ==========================================================================
    # MODEL ENDPOINTS
    # ==========================================================================
    llm_model_name: str = Field(
        default="databricks-meta-llama-3-3-70b-instruct",
        description="LLM endpoint for text generation"
    )
    embedding_model_name: str = Field(
        default="databricks-bge-large-en",
        description="Embedding model endpoint"
    )
    
    # Model parameters
    llm_max_tokens: int = Field(default=1000, description="Max tokens for LLM responses")
    llm_temperature: float = Field(default=0.2, ge=0.0, le=2.0, description="LLM temperature")
    embedding_dimension: int = Field(default=1024, description="Embedding vector dimension")
    
    # ==========================================================================
    # RAG CONFIGURATION
    # ==========================================================================
    rag_top_k_results: int = Field(default=5, ge=1, le=20, description="Number of facilities to retrieve for RAG")
    rag_similarity_threshold: float = Field(default=0.5, ge=0.0, le=1.0, description="Minimum similarity score")
    
    # ==========================================================================
    # API SETTINGS
    # ==========================================================================
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, ge=1024, le=65535, description="API port")
    api_prefix: str = Field(default="/api/v1", description="API route prefix")
    
    # CORS
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:8000",
            "http://localhost:8080"
        ],
        description="Allowed CORS origins"
    )
    cors_allow_credentials: bool = Field(default=True, description="Allow CORS credentials")
    cors_allow_methods: List[str] = Field(default=["*"], description="Allowed HTTP methods")
    cors_allow_headers: List[str] = Field(default=["*"], description="Allowed HTTP headers")
    
    # Pagination
    default_page_size: int = Field(default=20, ge=1, le=100, description="Default items per page")
    max_page_size: int = Field(default=100, ge=1, le=1000, description="Maximum items per page")
    
    # Rate limiting
    rate_limit_enabled: bool = Field(default=True, description="Enable rate limiting")
    rate_limit_requests: int = Field(default=100, ge=1, description="Max requests per window")
    rate_limit_window: int = Field(default=60, ge=1, description="Rate limit window in seconds")
    
    # ==========================================================================
    # CACHING
    # ==========================================================================
    cache_enabled: bool = Field(default=True, description="Enable response caching")
    cache_ttl: int = Field(default=300, ge=0, description="Cache TTL in seconds")
    embedding_cache_size: int = Field(default=1000, ge=0, description="Max embeddings to cache")
    
    # ==========================================================================
    # LOGGING
    # ==========================================================================
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format string"
    )
    
    # ==========================================================================
    # AUTHENTICATION (placeholder for future implementation)
    # ==========================================================================
    auth_enabled: bool = Field(default=False, description="Enable API authentication")
    jwt_secret_key: Optional[str] = Field(default=None, description="JWT secret key")
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, ge=1, description="Access token expiration")
    
    # ==========================================================================
    # VALIDATORS
    # ==========================================================================
    @field_validator("databricks_host")
    @classmethod
    def validate_databricks_host(cls, v: str) -> str:
        """Ensure Databricks host is a valid URL."""
        if not v.startswith(("http://", "https://")):
            raise ValueError("Databricks host must start with http:// or https://")
        return v.rstrip("/")
    
    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Ensure environment is valid."""
        valid_envs = {"development", "staging", "production"}
        if v not in valid_envs:
            raise ValueError(f"Environment must be one of {valid_envs}")
        return v
    
    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Ensure log level is valid."""
        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"Log level must be one of {valid_levels}")
        return v_upper
    
    # ==========================================================================
    # COMPUTED PROPERTIES
    # ==========================================================================
    @property
    def fully_qualified_table(self) -> str:
        """Get fully qualified table prefix: catalog.schema."""
        return f"{self.catalog_name}.{self.schema_name}"
    
    @property
    def facilities_table(self) -> str:
        """Get fully qualified facilities table name."""
        return f"{self.fully_qualified_table}.{self.table_facilities_silver}"
    
    @property
    def enriched_table(self) -> str:
        """Get fully qualified enriched table name."""
        return f"{self.fully_qualified_table}.{self.table_facilities_enriched}"
    
    @property
    def anomalies_table(self) -> str:
        """Get fully qualified anomalies table name."""
        return f"{self.fully_qualified_table}.{self.table_facilities_anomalies}"
    
    @property
    def regional_table(self) -> str:
        """Get fully qualified regional summary table name."""
        return f"{self.fully_qualified_table}.{self.table_regional_summary}"
    
    @property
    def documents_table(self) -> str:
        """Get fully qualified documents table name."""
        return f"{self.fully_qualified_table}.{self.table_facility_documents}"
    
    @property
    def vector_index_name(self) -> str:
        """Get fully qualified vector index name."""
        return f"{self.fully_qualified_table}.{self.vector_search_index}"
    
    @property
    def databricks_serving_endpoint(self) -> str:
        """Get Databricks serving endpoint base URL."""
        return f"{self.databricks_host}/serving-endpoints"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"


# ==========================================================================
# SINGLETON INSTANCE
# ==========================================================================
settings = Settings()


# ==========================================================================
# CONSTANTS
# ==========================================================================
class FacilityTypes:
    """Valid facility types from the data."""
    HOSPITAL = "hospital"
    CLINIC = "clinic"
    PHARMACY = "pharmacy"
    DENTIST = "dentist"
    DOCTOR = "doctor"
    HEALTH_POST = "health_post"
    MATERNITY_HOME = "maternity_home"
    
    @classmethod
    def all(cls) -> List[str]:
        """Get all facility types."""
        return [
            cls.HOSPITAL,
            cls.CLINIC,
            cls.PHARMACY,
            cls.DENTIST,
            cls.DOCTOR,
            cls.HEALTH_POST,
            cls.MATERNITY_HOME
        ]


class OperatorTypes:
    """Valid operator types."""
    PUBLIC = "public"
    PRIVATE = "private"
    NGO = "ngo"
    FAITH_BASED = "faith_based"
    
    @classmethod
    def all(cls) -> List[str]:
        """Get all operator types."""
        return [cls.PUBLIC, cls.PRIVATE, cls.NGO, cls.FAITH_BASED]


class GhanaRegions:
    """Ghana administrative regions."""
    GREATER_ACCRA = "Greater Accra"
    ASHANTI = "Ashanti"
    WESTERN = "Western"
    EASTERN = "Eastern"
    CENTRAL = "Central"
    VOLTA = "Volta"
    NORTHERN = "Northern"
    UPPER_EAST = "Upper East"
    UPPER_WEST = "Upper West"
    BRONG_AHAFO = "Brong Ahafo"
    
    @classmethod
    def all(cls) -> List[str]:
        """Get all regions."""
        return [
            cls.GREATER_ACCRA,
            cls.ASHANTI,
            cls.WESTERN,
            cls.EASTERN,
            cls.CENTRAL,
            cls.VOLTA,
            cls.NORTHERN,
            cls.UPPER_EAST,
            cls.UPPER_WEST,
            cls.BRONG_AHAFO
        ]


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = [
    "Settings",
    "settings",
    "FacilityTypes",
    "OperatorTypes",
    "GhanaRegions"
]
