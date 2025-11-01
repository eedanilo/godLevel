"""
Metrics API routes
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.metrics_service import MetricsService
from app.models.schemas import RevenueResponse, ProductResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
service = MetricsService()


@router.get("/api/metrics/revenue", response_model=RevenueResponse)
async def get_revenue(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    store_id: Optional[int] = Query(None, description="Store ID filter"),
    channel_id: Optional[int] = Query(None, description="Channel ID filter")
):
    """Get revenue metrics"""
    try:
        result = await service.get_revenue(
            start_date=start_date,
            end_date=end_date,
            store_id=store_id,
            channel_id=channel_id
        )
        return RevenueResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting revenue: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/metrics/top-products")
async def get_top_products(
    limit: int = Query(10, ge=1, le=100, description="Number of products to return"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    order_by: str = Query('quantity', description="Order by: 'quantity' or 'revenue'")
):
    """Get top selling products"""
    try:
        logger.info(f"Getting top products with order_by={order_by}, limit={limit}, start_date={start_date}, end_date={end_date}")
        result = await service.get_top_products(
            limit=limit,
            start_date=start_date,
            end_date=end_date,
            order_by=order_by
        )
        logger.debug(f"Returning {len(result)} products, first product: {result[0] if result else None}")
        return {"products": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting top products: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/metrics/peak-hours")
async def get_peak_hours(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get peak sales hours"""
    try:
        result = await service.get_peak_hours(
            start_date=start_date,
            end_date=end_date
        )
        return {"hours": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting peak hours: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/metrics/store-performance")
async def get_store_performance(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get store performance metrics"""
    try:
        result = await service.get_store_performance(
            start_date=start_date,
            end_date=end_date
        )
        return {"stores": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting store performance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/metrics/channel-comparison")
async def get_channel_comparison(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get channel comparison metrics"""
    try:
        result = await service.get_channel_comparison(
            start_date=start_date,
            end_date=end_date
        )
        return {"channels": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting channel comparison: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/metrics/daily-trends")
async def get_daily_trends(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get daily sales trends"""
    try:
        result = await service.get_daily_trends(
            start_date=start_date,
            end_date=end_date
        )
        return {"trends": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting daily trends: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

