"""
Response formatting utilities for the Ghana Healthcare Intelligence Platform.

Provides functions to format database results into API response models
with proper type handling for Spark array columns and pagination.
"""

import math
from typing import List, Dict, Any, TypeVar, Generic
from datetime import datetime

from ..models.facilities import FacilityResponse, FacilityListResponse
from ..models.regional import RegionalSummary, RegionalListResponse

T = TypeVar('T')


def format_array_fields(value: Any) -> List[str]:
    """
    Format array fields from Spark/database results.
    
    Handles arrays that might be returned as strings, lists, or None.
    
    Args:
        value: Array value from database
        
    Returns:
        List of strings
    """
    if value is None:
        return []
    
    if isinstance(value, list):
        # Already a list, ensure all items are strings
        return [str(item) for item in value if item is not None]
    
    if isinstance(value, str):
        # If it's a string representation of a list, try to parse
        # For now, just return as single-item list
        return [value] if value.strip() else []
    
    # Fallback: convert to string and wrap in list
    return [str(value)]


def format_facility_response(row: Dict[str, Any]) -> FacilityResponse:
    """
    Convert database row to FacilityResponse model.
    
    Handles type conversions and array field formatting.
    
    Args:
        row: Database result row as dictionary
        
    Returns:
        FacilityResponse model instance
    """
    # Format array fields
    row_copy = row.copy()
    
    array_fields = [
        "phone_numbers", "email", "specialties", "procedure",
        "equipment", "capability", "enriched_procedures",
        "enriched_equipment", "enriched_capabilities"
    ]
    
    for field in array_fields:
        if field in row_copy:
            row_copy[field] = format_array_fields(row_copy[field])
    
    # Handle datetime fields
    datetime_fields = ["ingestion_date", "last_updated", "enrichment_date"]
    for field in datetime_fields:
        if field in row_copy and row_copy[field] is not None:
            if isinstance(row_copy[field], str):
                try:
                    row_copy[field] = datetime.fromisoformat(row_copy[field].replace("Z", "+00:00"))
                except:
                    row_copy[field] = None
    
    # Handle boolean fields
    boolean_fields = [
        "acceptsVolunteers", "has_contact_info", "has_any_contact",
        "has_procedures", "has_equipment", "has_capability",
        "has_specialties", "is_active", "enrichment_success"
    ]
    for field in boolean_fields:
        if field in row_copy and row_copy[field] is not None:
            if isinstance(row_copy[field], str):
                row_copy[field] = row_copy[field].lower() in ('true', '1', 'yes')
            elif isinstance(row_copy[field], int):
                row_copy[field] = bool(row_copy[field])
    
    # Handle numeric fields
    numeric_fields = ["capacity", "numberDoctors"]
    for field in numeric_fields:
        if field in row_copy and row_copy[field] is not None:
            try:
                row_copy[field] = int(row_copy[field])
            except:
                row_copy[field] = None
    
    # Create response model
    return FacilityResponse(**row_copy)


def format_regional_summary(row: Dict[str, Any]) -> RegionalSummary:
    """
    Convert database row to RegionalSummary model.
    
    Args:
        row: Database result row as dictionary
        
    Returns:
        RegionalSummary model instance
    """
    row_copy = row.copy()
    
    # Format array fields
    if "top_5_specialties" in row_copy:
        row_copy["top_5_specialties"] = format_array_fields(row_copy["top_5_specialties"])
    
    if "desert_reasons" in row_copy:
        row_copy["desert_reasons"] = format_array_fields(row_copy["desert_reasons"])
    
    # Handle boolean fields
    boolean_fields = [
        "has_emergency_care", "has_maternal_care",
        "has_pediatric_care", "is_medical_desert"
    ]
    for field in boolean_fields:
        if field in row_copy and row_copy[field] is not None:
            if isinstance(row_copy[field], str):
                row_copy[field] = row_copy[field].lower() in ('true', '1', 'yes')
            elif isinstance(row_copy[field], int):
                row_copy[field] = bool(row_copy[field])
    
    # Handle datetime fields
    if "last_updated" in row_copy and row_copy["last_updated"] is not None:
        if isinstance(row_copy["last_updated"], str):
            try:
                row_copy["last_updated"] = datetime.fromisoformat(row_copy["last_updated"].replace("Z", "+00:00"))
            except:
                row_copy["last_updated"] = None
    
    return RegionalSummary(**row_copy)


def paginate_response(
    items: List[T],
    page: int,
    page_size: int,
    total: int
) -> Dict[str, Any]:
    """
    Create paginated response wrapper.
    
    Args:
        items: List of items for current page
        page: Current page number
        page_size: Items per page
        total: Total number of items
        
    Returns:
        Dictionary with pagination metadata
    """
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }


def format_facility_list(
    rows: List[Dict[str, Any]],
    page: int,
    page_size: int,
    total: int
) -> FacilityListResponse:
    """
    Format list of facilities with pagination.
    
    Args:
        rows: Database result rows
        page: Current page number
        page_size: Items per page
        total: Total number of items
        
    Returns:
        FacilityListResponse with pagination
    """
    facilities = [format_facility_response(row) for row in rows]
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0
    
    return FacilityListResponse(
        items=facilities,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


def format_regional_list(rows: List[Dict[str, Any]]) -> RegionalListResponse:
    """
    Format list of regional summaries.
    
    Args:
        rows: Database result rows
        
    Returns:
        RegionalListResponse
    """
    summaries = [format_regional_summary(row) for row in rows]
    
    return RegionalListResponse(
        items=summaries,
        total=len(summaries),
        national_aggregates=None  # Could compute national totals here
    )


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = [
    "format_array_fields",
    "format_facility_response",
    "format_regional_summary",
    "paginate_response",
    "format_facility_list",
    "format_regional_list"
]
