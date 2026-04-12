"""
Pydantic models for Ghana healthcare facilities.

Models match the facilities_silver table schema (57 columns) with full
type annotations, validators, and documentation.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


class FacilityBase(BaseModel):
    """
    Base facility model with core identification and location fields.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    # Identity
    unique_id: str = Field(..., description="Unique facility identifier")
    name: str = Field(..., min_length=1, description="Facility name")
    facilityTypeId: Optional[str] = Field(None, description="Facility type (hospital, clinic, etc.)")
    operatorTypeId: Optional[str] = Field(None, description="Operator type (public, private, ngo)")
    organization_type: Optional[str] = Field(None, description="Organization type classification")
    
    # Location
    address_city: Optional[str] = Field(None, description="City")
    address_stateOrRegion: Optional[str] = Field(None, description="Region/state")
    address_countryCode: Optional[str] = Field(None, description="Country code (GH)")
    
    # Description
    organizationDescription: Optional[str] = Field(None, description="Facility description")


class FacilityCreate(FacilityBase):
    """
    Model for creating a new facility.
    Requires all mandatory fields from FacilityBase.
    """
    # Contact
    phone_numbers: List[str] = Field(default_factory=list, description="Phone numbers")
    email: List[str] = Field(default_factory=list, description="Email addresses")
    
    # Services
    specialties: List[str] = Field(default_factory=list, description="Medical specialties")
    procedure: List[str] = Field(default_factory=list, description="Medical procedures offered")
    equipment: List[str] = Field(default_factory=list, description="Medical equipment available")
    capability: List[str] = Field(default_factory=list, description="Facility capabilities")
    
    # Capacity
    capacity: Optional[int] = Field(None, ge=0, description="Bed capacity")
    numberDoctors: Optional[int] = Field(None, ge=0, description="Number of doctors")
    
    # Flags
    acceptsVolunteers: Optional[bool] = Field(None, description="Accepts volunteers")
    
    @field_validator("email")
    @classmethod
    def validate_emails(cls, v: List[str]) -> List[str]:
        """Validate email format."""
        import re
        email_pattern = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
        for email in v:
            if not email_pattern.match(email):
                raise ValueError(f"Invalid email format: {email}")
        return v


class FacilityUpdate(BaseModel):
    """
    Model for updating an existing facility.
    All fields are optional to support partial updates.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    # Identity (cannot be updated)
    # unique_id excluded from updates
    
    # Core fields
    name: Optional[str] = Field(None, min_length=1, description="Facility name")
    facilityTypeId: Optional[str] = Field(None, description="Facility type")
    operatorTypeId: Optional[str] = Field(None, description="Operator type")
    organization_type: Optional[str] = Field(None, description="Organization type")
    
    # Location
    address_city: Optional[str] = Field(None, description="City")
    address_stateOrRegion: Optional[str] = Field(None, description="Region")
    address_countryCode: Optional[str] = Field(None, description="Country code")
    
    # Description
    organizationDescription: Optional[str] = Field(None, description="Facility description")
    
    # Contact
    phone_numbers: Optional[List[str]] = Field(None, description="Phone numbers")
    email: Optional[List[str]] = Field(None, description="Email addresses")
    
    # Services
    specialties: Optional[List[str]] = Field(None, description="Medical specialties")
    procedure: Optional[List[str]] = Field(None, description="Medical procedures")
    equipment: Optional[List[str]] = Field(None, description="Medical equipment")
    capability: Optional[List[str]] = Field(None, description="Facility capabilities")
    
    # Capacity
    capacity: Optional[int] = Field(None, ge=0, description="Bed capacity")
    numberDoctors: Optional[int] = Field(None, ge=0, description="Number of doctors")
    
    # Flags
    acceptsVolunteers: Optional[bool] = Field(None, description="Accepts volunteers")


class FacilityResponse(FacilityBase):
    """
    Complete facility response with all fields from facilities_silver table.
    Includes quality metrics and enrichment data.
    """
    # Contact Information
    phone_numbers: List[str] = Field(default_factory=list, description="Phone numbers")
    email: List[str] = Field(default_factory=list, description="Email addresses")
    website: Optional[str] = Field(None, description="Website URL")
    
    # Additional Address Fields
    address_line1: Optional[str] = Field(None, description="Address line 1")
    address_line2: Optional[str] = Field(None, description="Address line 2")
    address_postalCode: Optional[str] = Field(None, description="Postal code")
    
    # Services and Capabilities
    specialties: List[str] = Field(default_factory=list, description="Medical specialties")
    procedure: List[str] = Field(default_factory=list, description="Procedures offered")
    equipment: List[str] = Field(default_factory=list, description="Equipment available")
    capability: List[str] = Field(default_factory=list, description="Capabilities")
    
    # Capacity Metrics
    capacity: Optional[int] = Field(None, ge=0, description="Bed capacity")
    numberDoctors: Optional[int] = Field(None, ge=0, description="Number of doctors")
    
    # Operational Details
    acceptsVolunteers: Optional[bool] = Field(None, description="Accepts volunteers")
    operatingHours: Optional[str] = Field(None, description="Operating hours")
    
    # Data Quality Metrics (computed in Silver layer)
    completeness_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Data completeness score")
    has_contact_info: Optional[bool] = Field(None, description="Has contact information")
    has_any_contact: Optional[bool] = Field(None, description="Has any contact method")
    has_procedures: Optional[bool] = Field(None, description="Has procedures listed")
    has_equipment: Optional[bool] = Field(None, description="Has equipment listed")
    has_capability: Optional[bool] = Field(None, description="Has capabilities listed")
    has_specialties: Optional[bool] = Field(None, description="Has specialties listed")
    
    # Quality Scores (Section-based from Silver)
    section_1_completeness: Optional[float] = Field(None, description="Section 1 completeness")
    section_2_completeness: Optional[float] = Field(None, description="Section 2 completeness")
    section_3_completeness: Optional[float] = Field(None, description="Section 3 completeness")
    section_4_completeness: Optional[float] = Field(None, description="Section 4 completeness")
    section_5_completeness: Optional[float] = Field(None, description="Section 5 completeness")
    
    # Metadata
    ingestion_date: Optional[datetime] = Field(None, description="Date ingested to Bronze")
    last_updated: Optional[datetime] = Field(None, description="Last updated timestamp")
    is_active: Optional[bool] = Field(default=True, description="Is facility active")
    
    # Source Information
    data_source: Optional[str] = Field(None, description="Original data source")
    source_id: Optional[str] = Field(None, description="Source system ID")
    
    # Enrichment Data (from enriched table, if available)
    enriched_procedures: Optional[List[str]] = Field(None, description="LLM-extracted procedures")
    enriched_equipment: Optional[List[str]] = Field(None, description="LLM-extracted equipment")
    enriched_capabilities: Optional[List[str]] = Field(None, description="LLM-extracted capabilities")
    enrichment_success: Optional[bool] = Field(None, description="Enrichment successful")
    enrichment_date: Optional[datetime] = Field(None, description="Date enriched")
    
    @property
    def full_address(self) -> str:
        """Construct full address string."""
        parts = [
            self.address_line1,
            self.address_line2,
            self.address_city,
            self.address_stateOrRegion,
            self.address_postalCode,
            self.address_countryCode
        ]
        return ", ".join(filter(None, parts))
    
    @property
    def primary_contact(self) -> Optional[str]:
        """Get primary contact (first phone or email)."""
        if self.phone_numbers:
            return self.phone_numbers[0]
        if self.email:
            return self.email[0]
        return None
    
    @property
    def service_count(self) -> int:
        """Count total services offered."""
        return len(self.specialties) + len(self.procedure) + len(self.capability)
    
    @property
    def quality_tier(self) -> str:
        """Classify facility by data quality."""
        if self.completeness_score is None:
            return "unknown"
        if self.completeness_score >= 0.8:
            return "excellent"
        if self.completeness_score >= 0.6:
            return "good"
        if self.completeness_score >= 0.4:
            return "fair"
        return "poor"


class FacilitySearchParams(BaseModel):
    """
    Parameters for searching/filtering facilities.
    """
    model_config = ConfigDict(from_attributes=True)
    
    # Text search
    query: Optional[str] = Field(None, description="Full-text search query")
    
    # Filters
    region: Optional[str] = Field(None, description="Filter by region")
    city: Optional[str] = Field(None, description="Filter by city")
    facility_type: Optional[str] = Field(None, description="Filter by facility type")
    operator_type: Optional[str] = Field(None, description="Filter by operator type")
    
    # Capability filters
    has_doctors: Optional[bool] = Field(None, description="Has doctors")
    has_beds: Optional[bool] = Field(None, description="Has bed capacity")
    has_emergency: Optional[bool] = Field(None, description="Has emergency care")
    has_maternal: Optional[bool] = Field(None, description="Has maternal care")
    has_pediatric: Optional[bool] = Field(None, description="Has pediatric care")
    accepts_volunteers: Optional[bool] = Field(None, description="Accepts volunteers")
    
    # Quality filters
    min_completeness: Optional[float] = Field(None, ge=0.0, le=1.0, description="Min completeness score")
    min_capacity: Optional[int] = Field(None, ge=0, description="Min bed capacity")
    min_doctors: Optional[int] = Field(None, ge=0, description="Min number of doctors")
    
    # Pagination
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    # Sorting
    sort_by: Optional[str] = Field(default="name", description="Sort field")
    sort_order: Optional[str] = Field(default="asc", pattern="^(asc|desc)$", description="Sort order")


class FacilityListResponse(BaseModel):
    """
    Paginated response for facility listings.
    """
    items: List[FacilityResponse] = Field(..., description="Facility items")
    total: int = Field(..., ge=0, description="Total number of items")
    page: int = Field(..., ge=1, description="Current page")
    page_size: int = Field(..., ge=1, description="Items per page")
    total_pages: int = Field(..., ge=0, description="Total pages")
    
    @property
    def has_next(self) -> bool:
        """Check if there's a next page."""
        return self.page < self.total_pages
    
    @property
    def has_prev(self) -> bool:
        """Check if there's a previous page."""
        return self.page > 1


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = [
    "FacilityBase",
    "FacilityCreate",
    "FacilityUpdate",
    "FacilityResponse",
    "FacilitySearchParams",
    "FacilityListResponse"
]
