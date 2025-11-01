"""
Health check endpoints
"""
from fastapi import APIRouter, Depends
from app.core.database import get_db_pool
from app.core.cache import cache
import asyncpg
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "restaurant-analytics-api"
    }


@router.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {
        "status": "alive"
    }


@router.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe"""
    try:
        pool = await get_db_pool()
        
        # Test database connection
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        
        return {
            "status": "ready",
            "database": "connected",
            "cache": "enabled" if cache else "disabled"
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {
            "status": "not_ready",
            "error": str(e)
        }, 503


@router.get("/health/metrics")
async def metrics_check():
    """Get application metrics"""
    try:
        pool = await get_db_pool()
        
        # Get pool stats
        pool_stats = {
            "size": pool.get_size(),
            "idle_size": pool.get_idle_size(),
            "min_size": pool._minsize,
            "max_size": pool._maxsize,
        }
        
        # Test database
        async with pool.acquire() as conn:
            db_version = await conn.fetchval("SELECT version()")
        
        return {
            "status": "healthy",
            "database": {
                "connected": True,
                "version": db_version.split(",")[0] if db_version else "unknown",
            },
            "pool": pool_stats,
            "cache": {
                "enabled": cache is not None,
                "size": len(cache._cache) if hasattr(cache, "_cache") else 0
            }
        }
    except Exception as e:
        logger.error(f"Metrics check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }, 503

