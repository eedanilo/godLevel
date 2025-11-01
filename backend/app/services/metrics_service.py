"""
Metrics service layer for business logic
"""
from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta
from app.repositories.metrics_repository import MetricsRepository
from app.core.cache import cache
from app.utils.validation import validate_date_range, validate_limit
import logging

logger = logging.getLogger(__name__)


class MetricsService:
    """Service for analytics metrics"""
    
    def __init__(self):
        self.repository = MetricsRepository()
    
    async def get_revenue(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        store_id: Optional[int] = None,
        channel_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get revenue metrics with caching"""
        # Default dates
        start = start_date or '2025-05-01'
        end = end_date or '2025-05-31'
        
        # Validate dates
        start_obj, end_obj = validate_date_range(start, end)
        end_obj = end_obj + timedelta(days=1)  # Add 1 day for < comparison
        
        # Generate cache key
        cache_key = cache._generate_key(
            "revenue",
            start_obj,
            end_obj,
            store_id,
            channel_id
        )
        
        # Try cache first
        cached = await cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for revenue")
            return cached
        
        # Get from repository
        result = await self.repository.get_revenue(
            start_date=start_obj,
            end_date=end_obj,
            store_id=store_id,
            channel_id=channel_id
        )
        
        # Cache result
        await cache.set(cache_key, result, ttl=300)
        
        return result
    
    async def get_top_products(
        self,
        limit: int = 10,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        order_by: str = 'quantity'
    ) -> List[Dict[str, Any]]:
        """Get top products with caching"""
        # Validate order_by parameter
        if order_by not in ['quantity', 'revenue']:
            order_by = 'quantity'
        
        # Default dates
        start = start_date or '2025-05-01'
        end = end_date or '2025-05-31'
        
        # Validate dates and limit
        start_obj, end_obj = validate_date_range(start, end)
        end_obj = end_obj + timedelta(days=1)
        limit = validate_limit(limit, max_limit=100)
        
        # Generate cache key (include order_by in cache key)
        cache_key = cache._generate_key(
            "top_products",
            limit,
            start_obj,
            end_obj,
            order_by
        )
        
        logger.info(f"Cache key for top_products: {cache_key} (order_by={order_by}, limit={limit}, start={start_obj}, end={end_obj})")
        
        # TEMPORARILY DISABLE CACHE TO DEBUG
        # Try cache first
        # cached = await cache.get(cache_key)
        # if cached:
        #     logger.debug(f"Cache hit for top_products with key: {cache_key}")
        #     return cached
        # else:
        #     logger.debug(f"Cache miss for top_products with key: {cache_key}")
        # Force clear cache for this endpoint
        cache_key_quantity = cache._generate_key("top_products", limit, start_obj, end_obj, 'quantity')
        cache_key_revenue = cache._generate_key("top_products", limit, start_obj, end_obj, 'revenue')
        await cache.delete(cache_key_quantity)
        await cache.delete(cache_key_revenue)
        logger.info("Cache cleared for top_products (both order_by options)")
        
        # Get from repository
        logger.info(f"Service calling repository.get_top_products with order_by={order_by}, limit={limit}, start={start_obj}, end={end_obj}")
        result = await self.repository.get_top_products(
            limit=limit,
            start_date=start_obj,
            end_date=end_obj,
            order_by=order_by
        )
        
        logger.info(f"Service returning {len(result)} products")
        if result:
            logger.info(f"First product: {result[0].get('product_name')}, revenue: {result[0].get('total_revenue')}, quantity: {result[0].get('total_quantity')}")
            if len(result) > 1:
                logger.info(f"Second product: {result[1].get('product_name')}, revenue: {result[1].get('total_revenue')}, quantity: {result[1].get('total_quantity')}")
                # Verify ordering
                if order_by == 'quantity':
                    if result[0]['total_quantity'] < result[1]['total_quantity']:
                        logger.error(f"ORDERING ERROR: First quantity ({result[0]['total_quantity']}) < Second quantity ({result[1]['total_quantity']})")
                elif order_by == 'revenue':
                    if result[0]['total_revenue'] < result[1]['total_revenue']:
                        logger.error(f"ORDERING ERROR: First revenue ({result[0]['total_revenue']}) < Second revenue ({result[1]['total_revenue']})")
        
        # Cache result - DISABLED FOR DEBUG
        # await cache.set(cache_key, result, ttl=300)
        
        return result
    
    async def get_peak_hours(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get peak hours with caching"""
        start = start_date or '2025-05-01'
        end = end_date or '2025-05-31'
        
        start_obj, end_obj = validate_date_range(start, end)
        end_obj = end_obj + timedelta(days=1)
        
        cache_key = cache._generate_key("peak_hours", start_obj, end_obj)
        
        cached = await cache.get(cache_key)
        if cached:
            return cached
        
        result = await self.repository.get_peak_hours(start_obj, end_obj)
        await cache.set(cache_key, result, ttl=300)
        
        return result
    
    async def get_store_performance(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get store performance with caching"""
        start = start_date or '2025-05-01'
        end = end_date or '2025-05-31'
        
        start_obj, end_obj = validate_date_range(start, end)
        end_obj = end_obj + timedelta(days=1)
        
        cache_key = cache._generate_key("store_performance", start_obj, end_obj)
        
        cached = await cache.get(cache_key)
        if cached:
            return cached
        
        result = await self.repository.get_store_performance(start_obj, end_obj)
        await cache.set(cache_key, result, ttl=300)
        
        return result
    
    async def get_channel_comparison(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get channel comparison with caching"""
        start = start_date or '2025-05-01'
        end = end_date or '2025-05-31'
        
        start_obj, end_obj = validate_date_range(start, end)
        end_obj = end_obj + timedelta(days=1)
        
        cache_key = cache._generate_key("channel_comparison", start_obj, end_obj)
        
        cached = await cache.get(cache_key)
        if cached:
            return cached
        
        result = await self.repository.get_channel_comparison(start_obj, end_obj)
        await cache.set(cache_key, result, ttl=300)
        
        return result
    
    async def get_daily_trends(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get daily trends with caching"""
        start = start_date or '2025-05-01'
        end = end_date or '2025-05-31'
        
        start_obj, end_obj = validate_date_range(start, end)
        end_obj = end_obj + timedelta(days=1)
        
        cache_key = cache._generate_key("daily_trends", start_obj, end_obj)
        
        cached = await cache.get(cache_key)
        if cached:
            return cached
        
        result = await self.repository.get_daily_trends(start_obj, end_obj)
        await cache.set(cache_key, result, ttl=300)
        
        return result

