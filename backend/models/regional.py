"""
Pydantic models for regional analytics and medical desert assessments.

Models match the regional_summary table and support comparative analysis.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class RegionalSummary(BaseModel):
    """
    Regional healthcare summary with aggregated metrics.
    Matches the regional_summary table schema.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    # Identity
    address_stateOrRegion: str = Field(..., description="Region name")
    
    # Facility Counts
    total_facilities: int = Field(..., ge=0, description="Total facilities")
    total_hospitals: int = Field(default=0, ge=0, description="Total hospitals")
    total_clinics: int = Field(default=0, ge=0, description="Total clinics")
    total_pharmacies: int = Field(default=0, ge=0, description="Total pharmacies")
    total_dentists: int = Field(default=0, ge=0, description="Total dentists")
    total_doctor_offices: int = Field(default=0, ge=0, description="Total doctor offices")
    total_ngos: int = Field(default=0, ge=0, description="Total NGO facilities")
    
    # Capacity Metrics
    total_bed_capacity: int = Field(default=0, ge=0, description="Total bed capacity")
    total_doctors: int = Field(default=0, ge=0, description="Total doctors")
    facilities_with_doctors: int = Field(default=0, ge=0, description="Facilities with doctors")
    facilities_with_beds: int = Field(default=0, ge=0, description="Facilities with beds")
    
    # Data Quality
    avg_completeness_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Average completeness score")
    facilities_with_contact: int = Field(default=0, ge=0, description="Facilities with contact info")
    
    # Service Availability
    facilities_accepting_volunteers: int = Field(default=0, ge=0, description="Facilities accepting volunteers")
    facilities_with_procedures: int = Field(default=0, ge=0, description="Facilities with procedures")
    facilities_with_equipment: int = Field(default=0, ge=0, description="Facilities with equipment")
    facilities_with_capability: int = Field(default=0, ge=0, description="Facilities with capabilities")
    
    # Specialty Diversity
    unique_specialties_count: int = Field(default=0, ge=0, description="Unique specialties")
    top_5_specialties: List[str] = Field(default_factory=list, description="Top 5 specialties")
    
    # Coverage Flags
    has_emergency_care: bool = Field(default=False, description="Has emergency care")
    has_maternal_care: bool = Field(default=False, description="Has maternal care")
    has_pediatric_care: bool = Field(default=False, description="Has pediatric care")
    
    # Operator Breakdown
    public_facilities: int = Field(default=0, ge=0, description="Public facilities")
    private_facilities: int = Field(default=0, ge=0, description="Private facilities")
    
    # Medical Desert Flags
    is_medical_desert: Optional[bool] = Field(None, description="Flagged as medical desert")
    desert_severity: Optional[str] = Field(None, description="Desert severity (critical, high, moderate)")
    desert_reasons: List[str] = Field(default_factory=list, description="Reasons for desert classification")
    
    # Metadata
    last_updated: Optional[datetime] = Field(None, description="Last updated")
    
    # Computed Properties
    @property
    def facilities_per_capita_estimate(self) -> float:
        """Estimate facilities per 100k population (placeholder - needs population data)."""
        # This would require population data to be accurate
        # For now, return 0 as placeholder
        return 0.0
    
    @property
    def doctors_per_facility(self) -> float:
        """Average doctors per facility."""
        if self.total_facilities == 0:
            return 0.0
        return self.total_doctors / self.total_facilities
    
    @property
    def beds_per_facility(self) -> float:
        """Average beds per facility."""
        if self.total_facilities == 0:
            return 0.0
        return self.total_bed_capacity / self.total_facilities
    
    @property
    def contact_coverage_rate(self) -> float:
        """Percentage of facilities with contact info."""
        if self.total_facilities == 0:
            return 0.0
        return (self.facilities_with_contact / self.total_facilities) * 100
    
    @property
    def public_private_ratio(self) -> float:
        """Ratio of public to private facilities."""
        if self.private_facilities == 0:
            return float(self.public_facilities) if self.public_facilities > 0 else 0.0
        return self.public_facilities / self.private_facilities
    
    @property
    def service_diversity_score(self) -> float:
        """Score based on specialty diversity and service availability."""
        # Normalize to 0-1 scale
        specialty_score = min(self.unique_specialties_count / 20, 1.0)  # 20+ specialties = max
        service_score = sum([
            1 if self.has_emergency_care else 0,
            1 if self.has_maternal_care else 0,
            1 if self.has_pediatric_care else 0
        ]) / 3
        return (specialty_score + service_score) / 2


class MedicalDesertAssessment(BaseModel):
    """
    Detailed assessment for medical desert regions.
    """
    model_config = ConfigDict(from_attributes=True)
    
    region: str = Field(..., description="Region name")
    severity: str = Field(..., pattern="^(critical|high|moderate|low)$", description="Desert severity")
    
    # Gap Analysis
    priority_gaps: List[str] = Field(..., description="Priority gaps identified")
    recommendations: List[str] = Field(..., description="Actionable recommendations")
    
    # Metrics
    facility_deficit: int = Field(..., description="Estimated facility deficit")
    doctor_deficit: int = Field(..., description="Estimated doctor deficit")
    bed_deficit: int = Field(..., description="Estimated bed deficit")
    
    # Coverage Analysis
    missing_services: List[str] = Field(default_factory=list, description="Missing critical services")
    underserved_areas: List[str] = Field(default_factory=list, description="Underserved sub-regions")
    
    # Comparative Metrics
    national_avg_comparison: float = Field(..., description="% below national average")
    nearest_adequate_region: Optional[str] = Field(None, description="Nearest adequately served region")
    
    # Assessment Metadata
    assessment_date: datetime = Field(..., description="Assessment date")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Assessment confidence")
    
    @property
    def total_deficit_score(self) -> int:
        """Combined deficit score."""
        return self.facility_deficit + self.doctor_deficit + self.bed_deficit


class RegionalComparison(BaseModel):
    """
    Comparative analysis between multiple regions.
    """
    model_config = ConfigDict(from_attributes=True)
    
    regions: List[str] = Field(..., min_length=2, description="Regions being compared")
    metrics: dict = Field(..., description="Comparison metrics")
    
    # Rankings
    best_region_overall: str = Field(..., description="Best performing region")
    worst_region_overall: str = Field(..., description="Worst performing region")
    
    # Specific Rankings
    best_by_capacity: str = Field(..., description="Best by capacity")
    best_by_coverage: str = Field(..., description="Best by coverage")
    best_by_quality: str = Field(..., description="Best by data quality")
    
    # Insights
    key_findings: List[str] = Field(default_factory=list, description="Key findings")
    disparities: List[str] = Field(default_factory=list, description="Notable disparities")


class RegionalTrend(BaseModel):
    """
    Time-series trend data for regional metrics (for future use).
    """
    model_config = ConfigDict(from_attributes=True)
    
    region: str = Field(..., description="Region name")
    metric_name: str = Field(..., description="Metric being tracked")
    time_series: List[dict] = Field(..., description="Time series data points")
    trend_direction: str = Field(..., pattern="^(increasing|decreasing|stable)$", description="Trend direction")
    change_percentage: float = Field(..., description="Percentage change")


class RegionalListResponse(BaseModel):
    """
    Response for regional summary listings.
    """
    items: List[RegionalSummary] = Field(..., description="Regional summaries")
    total: int = Field(..., ge=0, description="Total regions")
    national_aggregates: Optional[dict] = Field(None, description="National-level aggregates")


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = [
    "RegionalSummary",
    "MedicalDesertAssessment",
    "RegionalComparison",
    "RegionalTrend",
    "RegionalListResponse"
]
