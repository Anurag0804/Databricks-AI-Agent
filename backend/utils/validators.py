"""
Data validation utilities for the Ghana Healthcare Intelligence Platform.

Provides validation functions for user inputs, data integrity checks,
and SQL injection prevention.
"""

import re
from typing import Optional, List
from ..config import settings, FacilityTypes, OperatorTypes, GhanaRegions


def validate_region_name(region: str) -> bool:
    """
    Validate if a region name is valid for Ghana.
    
    Args:
        region: Region name to validate
        
    Returns:
        True if valid, False otherwise
    """
    valid_regions = GhanaRegions.all()
    return region in valid_regions


def validate_facility_type(facility_type: str) -> bool:
    """
    Validate if a facility type is valid.
    
    Args:
        facility_type: Facility type to validate
        
    Returns:
        True if valid, False otherwise
    """
    valid_types = FacilityTypes.all()
    return facility_type in valid_types


def validate_operator_type(operator_type: str) -> bool:
    """
    Validate if an operator type is valid.
    
    Args:
        operator_type: Operator type to validate
        
    Returns:
        True if valid, False otherwise
    """
    valid_types = OperatorTypes.all()
    return operator_type in valid_types


def validate_coordinates(latitude: Optional[float], longitude: Optional[float]) -> bool:
    """
    Validate geographic coordinates.
    
    Args:
        latitude: Latitude value
        longitude: Longitude value
        
    Returns:
        True if valid, False otherwise
    """
    if latitude is None or longitude is None:
        return False
    
    # Ghana approximate bounds: 4.5°N to 11°N, 3.5°W to 1°E
    if not (4.5 <= latitude <= 11.0):
        return False
    if not (-3.5 <= longitude <= 1.0):
        return False
    
    return True


def sanitize_query(query: str) -> str:
    """
    Sanitize user input to prevent SQL injection and XSS attacks.
    
    Args:
        query: User query string
        
    Returns:
        Sanitized query string
    """
    if not query:
        return ""
    
    # Remove potentially dangerous SQL keywords and characters
    dangerous_patterns = [
        r"--",  # SQL comments
        r";",   # Statement separator
        r"\/\*",  # Multi-line comment start
        r"\*\/",  # Multi-line comment end
        r"xp_",  # Extended stored procedures
        r"sp_",  # System stored procedures
        r"exec",  # Execute command
        r"execute",
        r"drop",
        r"delete",
        r"insert",
        r"update",
        r"create",
        r"alter",
        r"grant",
        r"revoke"
    ]
    
    sanitized = query
    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)
    
    # Remove multiple spaces
    sanitized = re.sub(r"\s+", " ", sanitized)
    
    return sanitized.strip()


def validate_pagination(page: int, page_size: int) -> tuple[int, int]:
    """
    Validate and normalize pagination parameters.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        
    Returns:
        Tuple of (validated_page, validated_page_size)
    """
    # Ensure page is at least 1
    validated_page = max(1, page)
    
    # Ensure page_size is within allowed range
    min_size = 1
    max_size = settings.max_page_size
    validated_page_size = max(min_size, min(max_size, page_size))
    
    return validated_page, validated_page_size


def validate_completeness_score(score: float) -> bool:
    """
    Validate completeness score is in valid range.
    
    Args:
        score: Completeness score
        
    Returns:
        True if valid (0.0 to 1.0)
    """
    return 0.0 <= score <= 1.0


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = [
    "validate_region_name",
    "validate_facility_type",
    "validate_operator_type",
    "validate_coordinates",
    "sanitize_query",
    "validate_pagination",
    "validate_completeness_score"
]
