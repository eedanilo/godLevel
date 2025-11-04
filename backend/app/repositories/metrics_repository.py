"""
Metrics repository for analytics queries
"""
from typing import Optional, List, Dict, Any
from datetime import date, timedelta
from app.repositories.base import BaseRepository
from app.utils.metrics import track_db_query
import logging

logger = logging.getLogger(__name__)


class MetricsRepository(BaseRepository):
    """Repository for analytics metrics"""
    
    @track_db_query("revenue")
    async def get_revenue(
        self,
        start_date: date,
        end_date: date,
        store_id: Optional[int] = None,
        channel_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get revenue metrics"""
        conditions = ["s.sale_status_desc = 'COMPLETED'"]
        params = []
        param_num = 1
        
        conditions.append(f"s.created_at >= ${param_num}")
        params.append(start_date)
        param_num += 1
        
        conditions.append(f"s.created_at < ${param_num}")
        params.append(end_date)
        param_num += 1
        
        if store_id:
            conditions.append(f"s.store_id = ${param_num}")
            params.append(store_id)
            param_num += 1
        
        if channel_id:
            conditions.append(f"s.channel_id = ${param_num}")
            params.append(channel_id)
            param_num += 1
        
        where_sql = " AND ".join(conditions)
        
        query = f"""
            SELECT 
                COUNT(*)::bigint as total_orders,
                COALESCE(SUM(s.total_amount), 0)::numeric as total_revenue,
                COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket
            FROM sales s
            WHERE {where_sql}
        """
        
        result = await self.execute_one(query, *params)
        
        if not result:
            return {
                "total_orders": 0,
                "total_revenue": 0.0,
                "avg_ticket": 0.0
            }
        
        return {
            "total_orders": int(result["total_orders"]) if result["total_orders"] else 0,
            "total_revenue": float(result["total_revenue"]) if result["total_revenue"] else 0.0,
            "avg_ticket": float(result["avg_ticket"]) if result["avg_ticket"] else 0.0
        }
    
    @track_db_query("top_products")
    async def get_top_products(
        self,
        limit: int,
        start_date: date,
        end_date: date,
        order_by: str = 'quantity'
    ) -> List[Dict[str, Any]]:
        """Get top products by quantity or revenue"""
        # Validate order_by parameter
        if order_by not in ['quantity', 'revenue']:
            logger.warning(f"Invalid order_by parameter: {order_by}, defaulting to 'quantity'")
            order_by = 'quantity'
        
        logger.info(f"Getting top products with order_by={order_by}, limit={limit}")
        
        # Build ORDER BY clause using CTE alias
        if order_by == 'quantity':
            order_field = "total_quantity"
        elif order_by == 'revenue':
            order_field = "total_revenue"
        else:
            order_field = "total_quantity"
        
        logger.info(f"Using ORDER BY field: {order_field} (order_by={order_by})")
        
        # Query without LIMIT first, then order in Python and limit
        # This ensures we get correct ordering even if SQL ORDER BY doesn't work properly
        query = f"""
            SELECT 
                MIN(p.id) as id,
                TRIM(p.name) as product_name,
                MAX(c.name) as category_name,
                SUM(ps.quantity)::numeric as total_quantity,
                SUM(ps.total_price)::numeric as total_revenue,
                COUNT(DISTINCT ps.sale_id) as order_count
            FROM product_sales ps
            JOIN sales s ON s.id = ps.sale_id
            JOIN products p ON p.id = ps.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE s.sale_status_desc = 'COMPLETED'
            AND s.created_at >= $1::date
            AND s.created_at < $2::date
            GROUP BY TRIM(p.name)
        """
        
        logger.info(f"Executing query with params: start_date={start_date}, end_date={end_date}, order_by={order_by}")
        logger.info(f"Full query SQL: {query}")
        # Don't use prepared statements for this query to avoid caching issues
        # Get all results first, then sort in Python and limit
        all_results = await self.execute_query(query, start_date, end_date, use_prepared=False)
        logger.info(f"Query returned {len(all_results)} results before sorting and limiting")
        
        # Format all results first
        formatted_results = [
            {
                "id": int(r["id"]) if r["id"] else 0,
                "product_name": str(r["product_name"]) if r["product_name"] else "",
                "category_name": str(r["category_name"]) if r["category_name"] else None,
                "total_quantity": float(r["total_quantity"]) if r["total_quantity"] else 0.0,
                "total_revenue": float(r["total_revenue"]) if r["total_revenue"] else 0.0,
                "order_count": int(r["order_count"]) if r["order_count"] else 0
            }
            for r in all_results
        ]
        
        # Sort in Python to ensure correct ordering
        if order_by == 'quantity':
            formatted_results.sort(key=lambda x: x['total_quantity'], reverse=True)
            logger.info(f"Sorted by quantity: top 3 quantities are {[r['total_quantity'] for r in formatted_results[:3]]}")
        elif order_by == 'revenue':
            formatted_results.sort(key=lambda x: x['total_revenue'], reverse=True)
            logger.info(f"Sorted by revenue: top 3 revenues are {[r['total_revenue'] for r in formatted_results[:3]]}")
        
        # Limit after sorting
        formatted_results = formatted_results[:limit]
        
        if formatted_results:
            logger.info(f"After sorting and limiting - first product: {formatted_results[0]['product_name']}, revenue: {formatted_results[0]['total_revenue']}, quantity: {formatted_results[0]['total_quantity']}")
            logger.info(f"Ordered by: {order_by}, first should have highest {'quantity' if order_by == 'quantity' else 'revenue'}")
            if len(formatted_results) > 1:
                if order_by == 'quantity':
                    is_correct = formatted_results[0]['total_quantity'] >= formatted_results[1]['total_quantity']
                    logger.info(f"Verification - first quantity ({formatted_results[0]['total_quantity']}) >= second ({formatted_results[1]['total_quantity']})? {is_correct}")
                else:
                    is_correct = formatted_results[0]['total_revenue'] >= formatted_results[1]['total_revenue']
                    logger.info(f"Verification - first revenue ({formatted_results[0]['total_revenue']}) >= second ({formatted_results[1]['total_revenue']})? {is_correct}")
        
        return formatted_results
    
    @track_db_query("peak_hours")
    async def get_peak_hours(
        self,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Get peak sales hours"""
        query = """
            SELECT 
                EXTRACT(HOUR FROM s.created_at)::integer as hour,
                COUNT(*)::bigint as order_count,
                COALESCE(SUM(s.total_amount), 0)::numeric as revenue
            FROM sales s
            WHERE s.sale_status_desc = 'COMPLETED'
            AND s.created_at >= $1
            AND s.created_at < $2
            GROUP BY EXTRACT(HOUR FROM s.created_at)::integer
            ORDER BY hour
        """
        
        results = await self.execute_query(query, start_date, end_date)
        
        return [
            {
                "hour": int(r["hour"]) if r["hour"] is not None else 0,
                "order_count": int(r["order_count"]) if r["order_count"] else 0,
                "revenue": float(r["revenue"]) if r["revenue"] else 0.0
            }
            for r in results
        ]
    
    @track_db_query("store_performance")
    async def get_store_performance(
        self,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Get store performance metrics"""
        query = """
            SELECT 
                st.id,
                st.name as store_name,
                st.city,
                st.state,
                COUNT(*)::bigint as total_orders,
                COALESCE(SUM(s.total_amount), 0)::numeric as total_revenue,
                COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket,
                COALESCE(AVG(s.production_seconds), 0)::numeric as avg_production_time,
                COALESCE(AVG(s.delivery_seconds), 0)::numeric as avg_delivery_time
            FROM sales s
            JOIN stores st ON st.id = s.store_id
            WHERE s.sale_status_desc = 'COMPLETED'
            AND s.created_at >= $1
            AND s.created_at < $2
            GROUP BY st.id, st.name, st.city, st.state
            ORDER BY total_revenue DESC
        """
        
        results = await self.execute_query(query, start_date, end_date)
        
        return [
            {
                "id": int(r["id"]) if r["id"] else 0,
                "store_name": str(r["store_name"]) if r["store_name"] else "",
                "city": str(r["city"]) if r["city"] else None,
                "state": str(r["state"]) if r["state"] else None,
                "total_orders": int(r["total_orders"]) if r["total_orders"] else 0,
                "total_revenue": float(r["total_revenue"]) if r["total_revenue"] else 0.0,
                "avg_ticket": float(r["avg_ticket"]) if r["avg_ticket"] else 0.0,
                "avg_production_time": float(r["avg_production_time"]) if r["avg_production_time"] else None,
                "avg_delivery_time": float(r["avg_delivery_time"]) if r["avg_delivery_time"] else None
            }
            for r in results
        ]
    
    @track_db_query("channel_comparison")
    async def get_channel_comparison(
        self,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Get channel comparison metrics"""
        query = """
            SELECT 
                ch.id,
                ch.name as channel_name,
                COUNT(*)::bigint as total_orders,
                COALESCE(SUM(s.total_amount), 0)::numeric as total_revenue,
                COALESCE(AVG(s.total_amount), 0)::numeric as avg_ticket
            FROM sales s
            JOIN channels ch ON ch.id = s.channel_id
            WHERE s.sale_status_desc = 'COMPLETED'
            AND s.created_at >= $1
            AND s.created_at < $2
            GROUP BY ch.id, ch.name
            ORDER BY total_revenue DESC
        """
        
        results = await self.execute_query(query, start_date, end_date)
        
        return [
            {
                "id": int(r["id"]) if r["id"] else 0,
                "channel_name": str(r["channel_name"]) if r["channel_name"] else "",
                "total_orders": int(r["total_orders"]) if r["total_orders"] else 0,
                "total_revenue": float(r["total_revenue"]) if r["total_revenue"] else 0.0,
                "avg_ticket": float(r["avg_ticket"]) if r["avg_ticket"] else 0.0
            }
            for r in results
        ]
    
    @track_db_query("daily_trends")
    async def get_daily_trends(
        self,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Get daily sales trends"""
        query = """
            SELECT 
                DATE(s.created_at) as date,
                COUNT(*)::bigint as order_count,
                COALESCE(SUM(s.total_amount), 0)::numeric as revenue
            FROM sales s
            WHERE s.sale_status_desc = 'COMPLETED'
            AND s.created_at >= $1
            AND s.created_at < $2
            GROUP BY DATE(s.created_at)
            ORDER BY date
        """
        
        results = await self.execute_query(query, start_date, end_date)
        
        return [
            {
                "date": str(r["date"]) if r["date"] else "",
                "order_count": int(r["order_count"]) if r["order_count"] else 0,
                "revenue": float(r["revenue"]) if r["revenue"] else 0.0
            }
            for r in results
        ]

