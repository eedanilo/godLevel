"""
Sales repository
"""
from typing import Optional, List, Dict, Any
from datetime import date
from app.repositories.base import BaseRepository
from app.utils.metrics import track_db_query
import logging

logger = logging.getLogger(__name__)


class SalesRepository(BaseRepository):
    """Repository for sales data"""
    
    @track_db_query("sales")
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
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Get top products"""
        query = f"""
            SELECT 
                p.id,
                p.name as product_name,
                c.name as category_name,
                SUM(ps.quantity) as total_quantity,
                SUM(ps.total_price) as total_revenue,
                COUNT(DISTINCT ps.sale_id) as order_count
            FROM product_sales ps
            JOIN sales s ON s.id = ps.sale_id
            JOIN products p ON p.id = ps.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE s.sale_status_desc = 'COMPLETED'
            AND s.created_at >= $1
            AND s.created_at < $2
            GROUP BY p.id, p.name, c.name
            ORDER BY total_quantity DESC
            LIMIT $3
        """
        
        results = await self.execute_query(query, start_date, end_date, limit)
        
        return [
            {
                "id": int(r["id"]) if r["id"] else 0,
                "product_name": str(r["product_name"]) if r["product_name"] else "",
                "category_name": str(r["category_name"]) if r["category_name"] else "",
                "total_quantity": float(r["total_quantity"]) if r["total_quantity"] else 0.0,
                "total_revenue": float(r["total_revenue"]) if r["total_revenue"] else 0.0,
                "order_count": int(r["order_count"]) if r["order_count"] else 0
            }
            for r in results
        ]

