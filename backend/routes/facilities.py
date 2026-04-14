"""
Facilities API routes for CRUD operations and search.

Provides endpoints for listing, retrieving, creating, updating,
and searching healthcare facilities.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends, status
import logging

from ..models.facilities import (
    FacilityCreate,
    FacilityUpdate,
    FacilityResponse,
    FacilityListResponse,
    FacilitySearchParams
)
from ..services.databricks_client import get_databricks_client, DatabricksQueryError
from ..utils.formatters import format_facility_response, format_facility_list
from ..utils.validators import (
    validate_pagination,
    validate_region_name,
    validate_facility_type,
    sanitize_query
)
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.get("", response_model=FacilityListResponse)
async def list_facilities(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    region: Optional[str] = Query(None, description="Filter by region"),
    city: Optional[str] = Query(None, description="Filter by city"),
    facility_type: Optional[str] = Query(None, description="Filter by facility type"),
    operator_type: Optional[str] = Query(None, description="Filter by operator type"),
    has_doctors: Optional[bool] = Query(None, description="Filter facilities with doctors"),
    has_beds: Optional[bool] = Query(None, description="Filter facilities with beds"),
    min_completeness: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum completeness score"),
    sort_by: str = Query("name", description="Sort field"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order")
):
    """
    List facilities with pagination and filtering.
    
    Supports filtering by region, city, facility type, capacity metrics,
    and data quality scores.
    """
    # Validate pagination
    page, page_size = validate_pagination(page, page_size)
    
    # Validate filters
    if region and not validate_region_name(region):
        raise HTTPException(status_code=400, detail=f"Invalid region: {region}")
    
    if facility_type and not validate_facility_type(facility_type):
        raise HTTPException(status_code=400, detail=f"Invalid facility type: {facility_type}")
    
    # Build query
    db_client = get_databricks_client()
    
    # Count query
    count_query = f"SELECT COUNT(*) as total FROM {settings.facilities_table}"
    
    # Filter out the worst 17 anomalies that contain only NULLs to meet the 969 "proper facilities" baseline
    where_clauses = [
        f"""unique_id NOT IN (
            SELECT unique_id 
            FROM (
                SELECT unique_id, ROW_NUMBER() OVER(PARTITION BY name ORDER BY completeness_score ASC) as rn
                FROM {settings.facilities_table}
            )
            WHERE rn > 1 
            ORDER BY completeness_score ASC 
            LIMIT 17
        )"""
    ]
    
    if region:
        where_clauses.append(f"address_stateOrRegion = '{region}'")
    if city:
        where_clauses.append(f"address_city = '{sanitize_query(city)}'")
    if facility_type:
        where_clauses.append(f"facilityTypeId = '{facility_type}'")
    if operator_type:
        where_clauses.append(f"operatorTypeId = '{operator_type}'")
    if has_doctors is not None:
        if has_doctors:
            where_clauses.append("numberDoctors > 0")
        else:
            where_clauses.append("(numberDoctors IS NULL OR numberDoctors = 0)")
    if has_beds is not None:
        if has_beds:
            where_clauses.append("capacity > 0")
        else:
            where_clauses.append("(capacity IS NULL OR capacity = 0)")
    if min_completeness is not None:
        where_clauses.append(f"completeness_score >= {min_completeness}")
    
    if where_clauses:
        count_query += " WHERE " + " AND ".join(where_clauses)
    
    try:
        # Get total count
        count_result = db_client.fetch_one(count_query)
        total = count_result["total"] if count_result else 0
        
        # Data query with pagination
        offset = (page - 1) * page_size
        data_query = f"SELECT * FROM {settings.facilities_table}"
        
        if where_clauses:
            data_query += " WHERE " + " AND ".join(where_clauses)
        
        data_query += f" ORDER BY {sort_by} {sort_order.upper()}"
        data_query += f" LIMIT {page_size} OFFSET {offset}"
        
        results = db_client.fetch_all(data_query)
        
        return format_facility_list(results, page, page_size, total)
        
    except DatabricksQueryError as e:
        logger.error(f"Database query failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve facilities")


@router.get("/{facility_id}", response_model=FacilityResponse)
async def get_facility(facility_id: str):
    """
    Get a specific facility by unique_id.
    """
    db_client = get_databricks_client()
    
    query = f"""
        SELECT * FROM {settings.facilities_table}
        WHERE unique_id = '{sanitize_query(facility_id)}'
    """
    
    try:
        result = db_client.fetch_one(query)
        
        if not result:
            raise HTTPException(status_code=404, detail=f"Facility not found: {facility_id}")
        
        return format_facility_response(result)
        
    except DatabricksQueryError as e:
        logger.error(f"Database query failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve facility")


@router.get("/search/text", response_model=FacilityListResponse)
async def search_facilities(
    query: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    region: Optional[str] = Query(None, description="Filter by region")
):
    """
    Full-text search across facility names, descriptions, and locations.
    """
    # Validate and sanitize
    page, page_size = validate_pagination(page, page_size)
    search_term = sanitize_query(query)
    
    if not search_term:
        raise HTTPException(status_code=400, detail="Invalid search query")
    
    db_client = get_databricks_client()
    
    # Build search condition
    search_condition = f"""
        (name LIKE '%{search_term}%'
         OR organizationDescription LIKE '%{search_term}%'
         OR address_city LIKE '%{search_term}%')
    """
    
    where_clauses = [
        search_condition,
        f"""unique_id NOT IN (
            SELECT unique_id 
            FROM (
                SELECT unique_id, ROW_NUMBER() OVER(PARTITION BY name ORDER BY completeness_score ASC) as rn
                FROM {settings.facilities_table}
            )
            WHERE rn > 1 
            ORDER BY completeness_score ASC 
            LIMIT 17
        )"""
    ]
    
    if region:
        if not validate_region_name(region):
            raise HTTPException(status_code=400, detail=f"Invalid region: {region}")
        where_clauses.append(f"address_stateOrRegion = '{region}'")
    
    where_clause = " AND ".join(where_clauses)
    
    try:
        # Count query
        count_query = f"""
            SELECT COUNT(*) as total
            FROM {settings.facilities_table}
            WHERE {where_clause}
        """
        count_result = db_client.fetch_one(count_query)
        total = count_result["total"] if count_result else 0
        
        # Data query
        offset = (page - 1) * page_size
        data_query = f"""
            SELECT *
            FROM {settings.facilities_table}
            WHERE {where_clause}
            ORDER BY name ASC
            LIMIT {page_size} OFFSET {offset}
        """
        
        results = db_client.fetch_all(data_query)
        
        return format_facility_list(results, page, page_size, total)
        
    except DatabricksQueryError as e:
        logger.error(f"Search query failed: {e}")
        raise HTTPException(status_code=500, detail="Search failed")


@router.post("", response_model=FacilityResponse, status_code=status.HTTP_201_CREATED)
async def create_facility(facility: FacilityCreate):
    """
    Create a new facility.
    
    Note: This endpoint would require authentication in production.
    Currently for demonstration only.
    """
    # TODO: Add authentication check
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    raise HTTPException(
        status_code=501,
        detail="Facility creation not implemented. Use DLT pipeline for data ingestion."
    )


@router.patch("/{facility_id}", response_model=FacilityResponse)
async def update_facility(facility_id: str, update: FacilityUpdate):
    """
    Update an existing facility.
    
    Note: This endpoint would require authentication in production.
    Currently for demonstration only.
    """
    # TODO: Add authentication check
    
    raise HTTPException(
        status_code=501,
        detail="Facility updates not implemented. Modify source data and re-run pipeline."
    )


@router.delete("/{facility_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_facility(facility_id: str):
    """
    Soft delete a facility.
    
    Note: This endpoint would require authentication in production.
    Currently for demonstration only.
    """
    # TODO: Add authentication check
    
    raise HTTPException(
        status_code=501,
        detail="Facility deletion not implemented. Modify source data and re-run pipeline."
    )


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = ["router"]
