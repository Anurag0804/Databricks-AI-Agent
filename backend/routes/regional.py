"""
Regional analytics API routes.

Provides endpoints for regional healthcare summaries, medical desert
assessments, and comparative analysis.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Path
import logging

from ..models.regional import (
    RegionalSummary,
    RegionalListResponse,
    MedicalDesertAssessment
)
from ..services.databricks_client import get_databricks_client, DatabricksQueryError
from ..utils.formatters import format_regional_summary, format_regional_list
from ..utils.validators import validate_region_name, sanitize_query
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/regional", tags=["regional"])


@router.get("/summary", response_model=RegionalListResponse)
async def get_all_regional_summaries(
    sort_by: str = Query("total_facilities", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order")
):
    """
    Get healthcare summaries for all regions.
    
    Returns aggregated metrics including facility counts, capacity,
    service availability, and medical desert flags.
    """
    db_client = get_databricks_client()
    
    # Check if regional summary table exists
    table_name = settings.regional_table
    
    query = f"""
        SELECT *
        FROM {table_name}
        ORDER BY {sort_by} {sort_order.upper()}
    """
    
    try:
        results = db_client.fetch_all(query)
        
        if not results:
            logger.warning("No regional summary data found")
            return RegionalListResponse(items=[], total=0, national_aggregates=None)
        
        return format_regional_list(results)
        
    except DatabricksQueryError as e:
        logger.error(f"Failed to fetch regional summaries: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve regional summaries")


@router.get("/{region}", response_model=RegionalSummary)
async def get_regional_summary(
    region: str = Path(..., description="Region name")
):
    """
    Get healthcare summary for a specific region.
    """
    # Validate region name
    if not validate_region_name(region):
        raise HTTPException(status_code=400, detail=f"Invalid region name: {region}")
    
    db_client = get_databricks_client()
    
    query = f"""
        SELECT *
        FROM {settings.regional_table}
        WHERE address_stateOrRegion = '{region}'
    """
    
    try:
        result = db_client.fetch_one(query)
        
        if not result:
            raise HTTPException(status_code=404, detail=f"No data found for region: {region}")
        
        return format_regional_summary(result)
        
    except DatabricksQueryError as e:
        logger.error(f"Failed to fetch regional summary for {region}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve regional summary")


@router.get("/medical-deserts/list", response_model=RegionalListResponse)
async def get_medical_deserts(
    severity: Optional[str] = Query(None, pattern="^(critical|high|moderate)$", description="Filter by severity")
):
    """
    Get regions flagged as medical deserts.
    
    Medical deserts are regions with insufficient healthcare infrastructure
    based on facility density, capacity, and service availability.
    """
    db_client = get_databricks_client()
    
    # Build query to identify medical deserts
    # Criteria: low facility count, low capacity, missing critical services
    query = f"""
        SELECT *
        FROM {settings.regional_table}
        WHERE (
            total_facilities < 10
            OR total_doctors < 20
            OR total_bed_capacity < 50
            OR has_emergency_care = FALSE
            OR has_maternal_care = FALSE
        )
        ORDER BY total_facilities ASC, total_doctors ASC
    """
    
    try:
        results = db_client.fetch_all(query)
        
        # Enrich with medical desert flags
        for result in results:
            # Classify severity
            total_facilities = result.get("total_facilities", 0)
            total_doctors = result.get("total_doctors", 0)
            
            if total_facilities < 5 or total_doctors < 10:
                result["is_medical_desert"] = True
                result["desert_severity"] = "critical"
            elif total_facilities < 10 or total_doctors < 20:
                result["is_medical_desert"] = True
                result["desert_severity"] = "high"
            else:
                result["is_medical_desert"] = True
                result["desert_severity"] = "moderate"
            
            # Identify gaps
            reasons = []
            if total_facilities < 10:
                reasons.append("Low facility count")
            if total_doctors < 20:
                reasons.append("Insufficient doctors")
            if result.get("total_bed_capacity", 0) < 50:
                reasons.append("Low bed capacity")
            if not result.get("has_emergency_care", False):
                reasons.append("No emergency care")
            if not result.get("has_maternal_care", False):
                reasons.append("No maternal care")
            
            result["desert_reasons"] = reasons
        
        # Filter by severity if specified
        if severity:
            results = [r for r in results if r.get("desert_severity") == severity]
        
        return format_regional_list(results)
        
    except DatabricksQueryError as e:
        logger.error(f"Failed to fetch medical deserts: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve medical desert data")


@router.get("/comparison/multi", response_model=List[RegionalSummary])
async def compare_regions(
    regions: List[str] = Query(..., min_length=2, description="List of regions to compare")
):
    """
    Compare healthcare metrics across multiple regions.
    """
    # Validate all regions
    for region in regions:
        if not validate_region_name(region):
            raise HTTPException(status_code=400, detail=f"Invalid region name: {region}")
    
    db_client = get_databricks_client()
    
    # Build IN clause
    regions_str = "','".join([sanitize_query(r) for r in regions])
    
    query = f"""
        SELECT *
        FROM {settings.regional_table}
        WHERE address_stateOrRegion IN ('{regions_str}')
        ORDER BY total_facilities DESC
    """
    
    try:
        results = db_client.fetch_all(query)
        
        if len(results) < len(regions):
            found_regions = {r["address_stateOrRegion"] for r in results}
            missing = set(regions) - found_regions
            logger.warning(f"Some regions not found: {missing}")
        
        return [format_regional_summary(r) for r in results]
        
    except DatabricksQueryError as e:
        logger.error(f"Failed to compare regions: {e}")
        raise HTTPException(status_code=500, detail="Failed to compare regions")


@router.get("/top-performers/capacity", response_model=RegionalListResponse)
async def get_top_performers_by_capacity(
    limit: int = Query(10, ge=1, le=20, description="Number of top regions")
):
    """
    Get top-performing regions by healthcare capacity (beds and doctors).
    """
    db_client = get_databricks_client()
    
    query = f"""
        SELECT *
        FROM {settings.regional_table}
        ORDER BY total_bed_capacity DESC, total_doctors DESC
        LIMIT {limit}
    """
    
    try:
        results = db_client.fetch_all(query)
        return format_regional_list(results)
        
    except DatabricksQueryError as e:
        logger.error(f"Failed to fetch top performers: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve top performers")


@router.get("/top-performers/coverage", response_model=RegionalListResponse)
async def get_top_performers_by_coverage(
    limit: int = Query(10, ge=1, le=20, description="Number of top regions")
):
    """
    Get top-performing regions by service coverage (emergency, maternal, pediatric).
    """
    db_client = get_databricks_client()
    
    query = f"""
        SELECT *
        FROM {settings.regional_table}
        WHERE has_emergency_care = TRUE
          AND has_maternal_care = TRUE
          AND has_pediatric_care = TRUE
        ORDER BY unique_specialties_count DESC, total_facilities DESC
        LIMIT {limit}
    """
    
    try:
        results = db_client.fetch_all(query)
        return format_regional_list(results)
        
    except DatabricksQueryError as e:
        logger.error(f"Failed to fetch top performers by coverage: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve top performers")


# ==========================================================================
# EXPORT
# ==========================================================================
__all__ = ["router"]
