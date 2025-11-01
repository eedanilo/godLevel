"""
Data exploration API routes
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.explore_service import ExploreService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/explore", tags=["Data Exploration"])
service = ExploreService()


@router.get("/profile/sales")
async def profile_sales_data(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Comprehensive profiling of sales data"""
    try:
        result = await service.profile_sales_data(
            start_date=start_date,
            end_date=end_date
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error profiling sales data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/correlations")
async def analyze_correlations(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Analyze correlations between different metrics"""
    try:
        result = await service.analyze_correlations(
            start_date=start_date,
            end_date=end_date
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing correlations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cohort/retention")
async def cohort_retention_analysis(
    cohort_months: int = Query(6, ge=1, le=12, description="Number of months to analyze")
):
    """Cohort retention analysis"""
    try:
        result = await service.cohort_retention_analysis(cohort_months)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in cohort analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies")
async def detect_anomalies(
    days_back: int = Query(30, ge=7, le=90, description="Days to analyze"),
    sensitivity: float = Query(2.0, ge=1.0, le=3.0, description="Standard deviations for anomaly threshold")
):
    """Detect anomalies in sales data using statistical methods"""
    try:
        result = await service.detect_anomalies(days_back, sensitivity)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/affinity/products")
async def product_affinity_analysis(
    min_support: float = Query(0.01, ge=0.001, le=0.1, description="Minimum support (% of orders)"),
    limit: int = Query(20, ge=5, le=100)
):
    """Market basket analysis - find products frequently bought together"""
    try:
        result = await service.product_affinity_analysis(min_support, limit)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in affinity analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends/forecast")
async def trend_forecast(
    metric: str = Query("revenue", description="Metric to forecast: revenue, orders, avg_ticket"),
    days_back: int = Query(30, ge=14, le=90),
    forecast_days: int = Query(7, ge=1, le=30)
):
    """Simple trend analysis and forecast using linear regression"""
    try:
        result = await service.trend_forecast(metric, days_back, forecast_days)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in trend forecast: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

