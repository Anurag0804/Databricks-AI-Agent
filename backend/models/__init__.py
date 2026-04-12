"""
Data models for the Ghana Healthcare Intelligence Platform.

This module exports all Pydantic models for facilities and regional analytics.
"""

from .facilities import (
    FacilityBase,
    FacilityCreate,
    FacilityUpdate,
    FacilityResponse,
    FacilitySearchParams,
    FacilityListResponse
)

from .regional import (
    RegionalSummary,
    MedicalDesertAssessment,
    RegionalComparison,
    RegionalTrend,
    RegionalListResponse
)

__all__ = [
    # Facility models
    "FacilityBase",
    "FacilityCreate",
    "FacilityUpdate",
    "FacilityResponse",
    "FacilitySearchParams",
    "FacilityListResponse",
    # Regional models
    "RegionalSummary",
    "MedicalDesertAssessment",
    "RegionalComparison",
    "RegionalTrend",
    "RegionalListResponse"
]
