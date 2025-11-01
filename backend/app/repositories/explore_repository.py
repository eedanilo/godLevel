"""
Repository for data exploration and advanced analytics
"""
from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta
from app.repositories.base import BaseRepository
from app.utils.metrics import track_db_query
from app.utils.serializers import serialize_records, serialize_record
import logging

logger = logging.getLogger(__name__)


class ExploreRepository(BaseRepository):
    """Repository for data exploration"""
    
    @track_db_query("data_profiling")
    async def profile_sales_data(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Comprehensive profiling of sales data"""
        conditions = []
        params = []
        param_num = 1
        
        if start_date and end_date:
            conditions.append(f"created_at >= ${param_num}")
            params.append(start_date)
            param_num += 1
            
            conditions.append(f"created_at < ${param_num}")
            params.append(end_date)
            param_num += 1
        
        where_sql = " AND ".join(conditions) if conditions else "1=1"
        
        query = f"""
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT store_id) as unique_stores,
                COUNT(DISTINCT customer_id) as unique_customers,
                COUNT(DISTINCT channel_id) as unique_channels,
                COUNT(CASE WHEN sale_status_desc = 'COMPLETED' THEN 1 END) as completed_sales,
                COUNT(CASE WHEN sale_status_desc = 'CANCELLED' THEN 1 END) as cancelled_sales,
                
                -- Revenue statistics
                MIN(total_amount)::numeric as min_revenue,
                MAX(total_amount)::numeric as max_revenue,
                AVG(total_amount)::numeric as avg_revenue,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_amount)::numeric as median_revenue,
                PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY total_amount)::numeric as q1_revenue,
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_amount)::numeric as q3_revenue,
                STDDEV(total_amount)::numeric as stddev_revenue,
                
                -- Discount statistics
                COUNT(CASE WHEN total_discount > 0 THEN 1 END) as orders_with_discount,
                AVG(CASE WHEN total_discount > 0 THEN total_discount END)::numeric as avg_discount,
                
                -- Delivery statistics
                COUNT(CASE WHEN delivery_fee > 0 THEN 1 END) as orders_with_delivery,
                AVG(CASE WHEN delivery_fee > 0 THEN delivery_fee END)::numeric as avg_delivery_fee,
                
                -- Time statistics
                AVG(production_seconds)::numeric as avg_production_time,
                AVG(delivery_seconds)::numeric as avg_delivery_time,
                
                -- Data quality
                COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as missing_customer_id,
                COUNT(CASE WHEN total_amount <= 0 THEN 1 END) as invalid_amounts
            FROM sales
            WHERE {where_sql}
        """
        
        stats = await self.execute_one(query, *params)
        
        if not stats:
            return {}
        
        # Revenue distribution (histogram)
        histogram_query = f"""
            WITH revenue_buckets AS (
                SELECT 
                    WIDTH_BUCKET(total_amount, 0, 500, 10) as bucket,
                    COUNT(*) as count
                FROM sales
                WHERE {where_sql}
                AND sale_status_desc = 'COMPLETED'
                AND total_amount BETWEEN 0 AND 500
                GROUP BY bucket
                ORDER BY bucket
            )
            SELECT 
                bucket,
                (bucket - 1) * 50 as range_start,
                bucket * 50 as range_end,
                count
            FROM revenue_buckets
        """
        
        histogram = await self.execute_query(histogram_query, *params)
        
        # Calculate outliers
        q1 = float(stats.get('q1_revenue', 0) or 0)
        q3 = float(stats.get('q3_revenue', 0) or 0)
        iqr = q3 - q1 if q1 > 0 and q3 > 0 else 0
        lower_bound = q1 - (1.5 * iqr) if iqr > 0 else 0
        upper_bound = q3 + (1.5 * iqr) if iqr > 0 else 0
        
        if iqr > 0:
            outlier_param_num = param_num
            if params:
                outlier_param_num = len(params) + 1
            outliers_query = f"""
                SELECT COUNT(*) as outlier_count
                FROM sales
                WHERE {where_sql}
                AND (total_amount < ${outlier_param_num}::numeric OR total_amount > ${outlier_param_num + 1}::numeric)
            """
            
            outlier_params = params + [lower_bound, upper_bound] if params else [lower_bound, upper_bound]
            outliers = await self.execute_scalar(outliers_query, *outlier_params)
        else:
            outliers = 0
        
        return {
            "summary": {
                "total_records": int(stats.get('total_records', 0) or 0),
                "completed_sales": int(stats.get('completed_sales', 0) or 0),
                "cancelled_sales": int(stats.get('cancelled_sales', 0) or 0),
                "cancellation_rate": float(stats.get('cancelled_sales', 0) or 0) / float(stats.get('total_records', 1) or 1) * 100 if stats.get('total_records') else 0,
                "unique_stores": int(stats.get('unique_stores', 0) or 0),
                "unique_customers": int(stats.get('unique_customers', 0) or 0),
                "unique_channels": int(stats.get('unique_channels', 0) or 0),
            },
            "revenue_stats": {
                "min": float(stats.get('min_revenue', 0) or 0),
                "max": float(stats.get('max_revenue', 0) or 0),
                "mean": float(stats.get('avg_revenue', 0) or 0),
                "median": float(stats.get('median_revenue', 0) or 0),
                "std_dev": float(stats.get('stddev_revenue', 0) or 0),
                "q1": q1,
                "q3": q3,
                "outliers": int(outliers or 0),
                "outlier_bounds": {
                    "lower": lower_bound,
                    "upper": upper_bound
                }
            },
            "distribution": [
                {
                    "bucket": int(h.get('bucket', 0)),
                    "range": f"R$ {int(h.get('range_start', 0))}-{int(h.get('range_end', 0))}",
                    "count": int(h.get('count', 0))
                }
                for h in histogram
            ],
            "discounts": {
                "orders_with_discount": int(stats.get('orders_with_discount', 0) or 0),
                "discount_rate": float(stats.get('orders_with_discount', 0) or 0) / float(stats.get('total_records', 1) or 1) * 100 if stats.get('total_records') else 0,
                "avg_discount": float(stats.get('avg_discount', 0) or 0)
            },
            "delivery": {
                "orders_with_delivery": int(stats.get('orders_with_delivery', 0) or 0),
                "delivery_rate": float(stats.get('orders_with_delivery', 0) or 0) / float(stats.get('total_records', 1) or 1) * 100 if stats.get('total_records') else 0,
                "avg_delivery_fee": float(stats.get('avg_delivery_fee', 0) or 0)
            },
            "operational": {
                "avg_production_time_seconds": float(stats.get('avg_production_time', 0) or 0),
                "avg_delivery_time_seconds": float(stats.get('avg_delivery_time', 0) or 0)
            },
            "data_quality": {
                "missing_customer_id": int(stats.get('missing_customer_id', 0) or 0),
                "invalid_amounts": int(stats.get('invalid_amounts', 0) or 0),
                "completeness_score": (1 - float(stats.get('missing_customer_id', 0) or 0) / float(stats.get('total_records', 1) or 1)) * 100 if stats.get('total_records') else 0
            }
        }
    
    @track_db_query("correlations")
    async def analyze_correlations(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Analyze correlations between different metrics"""
        conditions = ["sale_status_desc = 'COMPLETED'"]
        params = []
        param_num = 1
        
        if start_date and end_date:
            conditions.append(f"created_at >= ${param_num}")
            params.append(start_date)
            param_num += 1
            
            conditions.append(f"created_at < ${param_num}")
            params.append(end_date)
            param_num += 1
        
        where_sql = " AND ".join(conditions)
        
        # Discount impact
        query1 = f"""
            SELECT 
                CASE 
                    WHEN total_discount = 0 THEN 'No Discount'
                    WHEN total_discount <= 10 THEN 'Low (≤R$10)'
                    WHEN total_discount <= 30 THEN 'Medium (R$10-30)'
                    ELSE 'High (>R$30)'
                END as discount_range,
                COUNT(*) as order_count,
                AVG(total_amount)::numeric as avg_order_value,
                SUM(total_amount)::numeric as total_revenue
            FROM sales
            WHERE {where_sql}
            GROUP BY discount_range
            ORDER BY 
                CASE discount_range
                    WHEN 'No Discount' THEN 1
                    WHEN 'Low (≤R$10)' THEN 2
                    WHEN 'Medium (R$10-30)' THEN 3
                    ELSE 4
                END
        """
        
        # Day of week pattern
        query2 = f"""
            SELECT 
                EXTRACT(DOW FROM created_at)::integer as day_of_week,
                CASE EXTRACT(DOW FROM created_at)::integer
                    WHEN 0 THEN 'Sunday'
                    WHEN 1 THEN 'Monday'
                    WHEN 2 THEN 'Tuesday'
                    WHEN 3 THEN 'Wednesday'
                    WHEN 4 THEN 'Thursday'
                    WHEN 5 THEN 'Friday'
                    WHEN 6 THEN 'Saturday'
                END as day_name,
                COUNT(*) as order_count,
                AVG(total_amount)::numeric as avg_order_value,
                SUM(total_amount)::numeric as total_revenue
            FROM sales
            WHERE {where_sql}
            GROUP BY day_of_week, day_name
            ORDER BY day_of_week
        """
        
        # Hourly pattern
        query3 = f"""
            SELECT 
                EXTRACT(HOUR FROM created_at)::integer as hour,
                CASE 
                    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 6 AND 11 THEN 'Morning'
                    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 12 AND 14 THEN 'Lunch'
                    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 15 AND 17 THEN 'Afternoon'
                    WHEN EXTRACT(HOUR FROM created_at) BETWEEN 18 AND 22 THEN 'Dinner'
                    ELSE 'Night'
                END as period,
                COUNT(*) as order_count,
                AVG(total_amount)::numeric as avg_order_value,
                AVG(people_quantity)::numeric as avg_party_size
            FROM sales
            WHERE {where_sql}
            GROUP BY hour, period
            ORDER BY hour
        """
        
        # Production time correlation
        query4 = f"""
            SELECT 
                CASE 
                    WHEN production_seconds < 600 THEN 'Fast (<10min)'
                    WHEN production_seconds < 1200 THEN 'Normal (10-20min)'
                    WHEN production_seconds < 1800 THEN 'Slow (20-30min)'
                    ELSE 'Very Slow (>30min)'
                END as production_speed,
                COUNT(*) as order_count,
                AVG(total_amount)::numeric as avg_order_value,
                AVG(production_seconds)::numeric as avg_production_time
            FROM sales
            WHERE {where_sql}
            AND production_seconds IS NOT NULL
            GROUP BY production_speed
            ORDER BY avg_production_time
        """
        
        # Channel performance
        query5 = f"""
            SELECT 
                ch.name as channel_name,
                ch.type as channel_type,
                COUNT(*) as order_count,
                AVG(s.total_amount)::numeric as avg_order_value,
                SUM(s.total_amount)::numeric as total_revenue,
                AVG(s.production_seconds)::numeric as avg_production_time,
                COUNT(CASE WHEN s.delivery_fee > 0 THEN 1 END) as delivery_orders
            FROM sales s
            JOIN channels ch ON ch.id = s.channel_id
            WHERE {where_sql}
            GROUP BY ch.id, ch.name, ch.type
            ORDER BY total_revenue DESC
        """
        
        results = {
            "discount_impact": await self.execute_query(query1, *params) if params else await self.execute_query(query1),
            "day_of_week_pattern": await self.execute_query(query2, *params) if params else await self.execute_query(query2),
            "hourly_pattern": await self.execute_query(query3, *params) if params else await self.execute_query(query3),
            "production_time_correlation": await self.execute_query(query4, *params) if params else await self.execute_query(query4),
            "channel_comparison": await self.execute_query(query5, *params) if params else await self.execute_query(query5)
        }
        
        return results
    
    @track_db_query("cohort_retention")
    async def cohort_retention_analysis(
        self,
        cohort_months: int = 6
    ) -> Dict[str, Any]:
        """Cohort retention analysis"""
        query = """
            WITH customer_cohorts AS (
                SELECT 
                    c.id as customer_id,
                    DATE_TRUNC('month', MIN(s.created_at)) as cohort_month,
                    DATE_TRUNC('month', s.created_at) as order_month,
                    COUNT(DISTINCT s.id) as orders
                FROM customers c
                JOIN sales s ON s.customer_id = c.id
                WHERE s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY c.id, DATE_TRUNC('month', s.created_at)
            ),
            cohort_sizes AS (
                SELECT 
                    cohort_month,
                    COUNT(DISTINCT customer_id) as cohort_size
                FROM customer_cohorts
                GROUP BY cohort_month
            ),
            retention_data AS (
                SELECT 
                    cc.cohort_month,
                    cc.order_month,
                    COUNT(DISTINCT cc.customer_id) as returning_customers,
                    EXTRACT(MONTH FROM AGE(cc.order_month, cc.cohort_month))::integer as months_since_cohort
                FROM customer_cohorts cc
                GROUP BY cc.cohort_month, cc.order_month
            )
            SELECT 
                TO_CHAR(rd.cohort_month, 'YYYY-MM') as cohort,
                cs.cohort_size,
                rd.months_since_cohort as month,
                rd.returning_customers,
                ROUND((rd.returning_customers::numeric / cs.cohort_size * 100), 2) as retention_rate
            FROM retention_data rd
            JOIN cohort_sizes cs ON cs.cohort_month = rd.cohort_month
            WHERE rd.months_since_cohort <= $1
            ORDER BY rd.cohort_month DESC, rd.months_since_cohort
        """
        
        results = await self.execute_query(query, cohort_months)
        
        # Organize by cohort
        cohorts = {}
        for row in results:
            cohort = row.get('cohort')
            if cohort not in cohorts:
                cohorts[cohort] = {
                    'cohort_month': cohort,
                    'cohort_size': int(row.get('cohort_size', 0)),
                    'retention_by_month': []
                }
            
            cohorts[cohort]['retention_by_month'].append({
                'month': int(row.get('month', 0)),
                'returning_customers': int(row.get('returning_customers', 0)),
                'retention_rate': float(row.get('retention_rate', 0))
            })
        
        # Calculate average retention
        all_months = {}
        for cohort in cohorts.values():
            for month_data in cohort['retention_by_month']:
                month = month_data['month']
                if month not in all_months:
                    all_months[month] = []
                all_months[month].append(month_data['retention_rate'])
        
        avg_retention = {
            month: sum(rates) / len(rates) if rates else 0
            for month, rates in all_months.items()
        }
        
        return {
            "cohorts": list(cohorts.values()),
            "summary": {
                'average_retention_by_month': avg_retention,
                'total_cohorts_analyzed': len(cohorts)
            }
        }
    
    @track_db_query("anomaly_detection")
    async def detect_anomalies(
        self,
        days_back: int = 30,
        sensitivity: float = 2.0
    ) -> Dict[str, Any]:
        """Detect anomalies in sales data"""
        query = """
            WITH daily_stats AS (
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as order_count,
                    SUM(total_amount)::numeric as revenue,
                    AVG(total_amount)::numeric as avg_ticket
                FROM sales
                WHERE created_at >= CURRENT_DATE - $1::interval
                AND sale_status_desc = 'COMPLETED'
                GROUP BY DATE(created_at)
                ORDER BY date
            ),
            stats_with_avg AS (
                SELECT 
                    *,
                    AVG(order_count) OVER () as avg_orders,
                    STDDEV(order_count) OVER () as stddev_orders,
                    AVG(revenue) OVER () as avg_revenue,
                    STDDEV(revenue) OVER () as stddev_revenue
                FROM daily_stats
            )
            SELECT 
                date::text,
                order_count,
                revenue,
                avg_ticket,
                avg_orders,
                stddev_orders,
                avg_revenue,
                stddev_revenue,
                ABS(order_count - avg_orders) / NULLIF(stddev_orders, 0) as order_z_score,
                ABS(revenue - avg_revenue) / NULLIF(stddev_revenue, 0) as revenue_z_score
            FROM stats_with_avg
            ORDER BY date DESC
        """
        
        results = await self.execute_query(query, f"{days_back} days")
        
        anomalies = []
        normal_days = []
        
        for row in results:
            day_data = {
                'date': row.get('date'),
                'order_count': int(row.get('order_count', 0)),
                'revenue': float(row.get('revenue', 0)),
                'avg_ticket': float(row.get('avg_ticket', 0))
            }
            
            order_z = float(row.get('order_z_score', 0) or 0)
            revenue_z = float(row.get('revenue_z_score', 0) or 0)
            
            is_anomaly = False
            anomaly_type = []
            
            if order_z > sensitivity:
                is_anomaly = True
                anomaly_type.append('High Order Volume')
                day_data['order_deviation'] = f"+{order_z:.2f}σ"
            elif order_z < -sensitivity:
                is_anomaly = True
                anomaly_type.append('Low Order Volume')
                day_data['order_deviation'] = f"-{order_z:.2f}σ"
            
            if revenue_z > sensitivity:
                is_anomaly = True
                anomaly_type.append('High Revenue')
                day_data['revenue_deviation'] = f"+{revenue_z:.2f}σ"
            elif revenue_z < -sensitivity:
                is_anomaly = True
                anomaly_type.append('Low Revenue')
                day_data['revenue_deviation'] = f"-{revenue_z:.2f}σ"
            
            if is_anomaly:
                day_data['anomaly_types'] = anomaly_type
                day_data['severity'] = 'high' if max(order_z, revenue_z) > sensitivity * 1.5 else 'medium'
                anomalies.append(day_data)
            else:
                normal_days.append(day_data)
        
        return {
            "anomalies": anomalies,
            "normal_days": normal_days[:10],
            "summary": {
                "days_analyzed": len(results),
                "anomalies_found": len(anomalies),
                "anomaly_rate": len(anomalies) / len(results) * 100 if results else 0,
                "sensitivity_threshold": sensitivity
            }
        }
    
    @track_db_query("product_affinity")
    async def product_affinity_analysis(
        self,
        min_support: float = 0.01,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Market basket analysis - find products bought together"""
        query = """
            WITH product_pairs AS (
                SELECT 
                    ps1.product_id as product_a_id,
                    p1.name as product_a_name,
                    ps2.product_id as product_b_id,
                    p2.name as product_b_name,
                    COUNT(DISTINCT ps1.sale_id) as pair_count
                FROM product_sales ps1
                JOIN product_sales ps2 ON ps1.sale_id = ps2.sale_id 
                    AND ps1.product_id < ps2.product_id
                JOIN products p1 ON p1.id = ps1.product_id
                JOIN products p2 ON p2.id = ps2.product_id
                JOIN sales s ON s.id = ps1.sale_id
                WHERE s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= CURRENT_DATE - INTERVAL '90 days'
                GROUP BY ps1.product_id, p1.name, ps2.product_id, p2.name
            ),
            product_counts AS (
                SELECT 
                    ps.product_id,
                    p.name as product_name,
                    COUNT(DISTINCT ps.sale_id) as order_count
                FROM product_sales ps
                JOIN products p ON p.id = ps.product_id
                JOIN sales s ON s.id = ps.sale_id
                WHERE s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= CURRENT_DATE - INTERVAL '90 days'
                GROUP BY ps.product_id, p.name
            ),
            total_orders AS (
                SELECT COUNT(DISTINCT id) as total
                FROM sales
                WHERE sale_status_desc = 'COMPLETED'
                AND created_at >= CURRENT_DATE - INTERVAL '90 days'
            )
            SELECT 
                pp.product_a_name,
                pp.product_b_name,
                pp.pair_count,
                pc1.order_count as product_a_count,
                pc2.order_count as product_b_count,
                to_orders.total as total_orders,
                ROUND((pp.pair_count::numeric / to_orders.total), 4) as support,
                ROUND((pp.pair_count::numeric / pc1.order_count), 4) as confidence_a_to_b,
                ROUND((pp.pair_count::numeric / pc2.order_count), 4) as confidence_b_to_a,
                ROUND(
                    (pp.pair_count::numeric / to_orders.total) / 
                    ((pc1.order_count::numeric / to_orders.total) * (pc2.order_count::numeric / to_orders.total)),
                    4
                ) as lift
            FROM product_pairs pp
            JOIN product_counts pc1 ON pc1.product_id = pp.product_a_id
            JOIN product_counts pc2 ON pc2.product_id = pp.product_b_id
            CROSS JOIN total_orders to_orders
            WHERE (pp.pair_count::numeric / to_orders.total) >= $1
            ORDER BY lift DESC, pair_count DESC
            LIMIT $2
        """
        
        results = await self.execute_query(query, min_support, limit)
        
        affinity_rules = []
        for row in results:
            lift = float(row.get('lift', 0) or 0)
            rule = {
                'product_a': row.get('product_a_name', ''),
                'product_b': row.get('product_b_name', ''),
                'times_bought_together': int(row.get('pair_count', 0) or 0),
                'support': float(row.get('support', 0) or 0),
                'confidence_a_to_b': float(row.get('confidence_a_to_b', 0) or 0),
                'confidence_b_to_a': float(row.get('confidence_b_to_a', 0) or 0),
                'lift': lift,
                'strength': 'strong' if lift >= 2.0 else 'moderate' if lift >= 1.5 else 'weak'
            }
            
            if rule['lift'] > 1:
                rule['interpretation'] = f"Customers who buy {rule['product_a']} are {rule['lift']:.1f}x more likely to buy {rule['product_b']}"
            
            affinity_rules.append(rule)
        
        return {
            "rules": affinity_rules,
            "summary": {
                "rules_found": len(affinity_rules),
                "min_support_threshold": min_support,
                "analysis_period": "Last 90 days"
            }
        }
    
    def _generate_affinity_recommendations(self, rules: List[Dict]) -> List[Dict]:
        """Generate actionable recommendations from affinity rules"""
        recommendations = []
        
        # Strong associations for bundles
        strong_rules = [r for r in rules if r.get('lift', 0) >= 2.0]
        if strong_rules:
            top_rule = strong_rules[0]
            recommendations.append({
                'type': 'bundle',
                'title': f'Create combo: {top_rule.get("product_a")} + {top_rule.get("product_b")}',
                'reason': f'These products are bought together {top_rule.get("times_bought_together")} times with {top_rule.get("lift"):.1f}x lift',
                'expected_impact': 'high'
            })
        
        # High confidence for upselling
        high_confidence = [r for r in rules if r.get('confidence_a_to_b', 0) >= 0.5]
        if high_confidence:
            for rule in high_confidence[:3]:
                recommendations.append({
                    'type': 'upsell',
                    'title': f'Suggest {rule.get("product_b")} when ordering {rule.get("product_a")}',
                    'reason': f'{rule.get("confidence_a_to_b")*100:.0f}% of customers who buy {rule.get("product_a")} also buy {rule.get("product_b")}',
                    'expected_impact': 'medium'
                })
        
        return recommendations
    
    @track_db_query("trend_forecast")
    async def trend_forecast(
        self,
        metric: str = "revenue",
        days_back: int = 30,
        forecast_days: int = 7
    ) -> Dict[str, Any]:
        """Simple trend analysis and forecast using linear regression"""
        query = """
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as order_count,
                SUM(total_amount)::numeric as revenue,
                AVG(total_amount)::numeric as avg_ticket
            FROM sales
            WHERE created_at >= CURRENT_DATE - $1::interval
            AND sale_status_desc = 'COMPLETED'
            GROUP BY DATE(created_at)
            ORDER BY date
        """
        
        results = await self.execute_query(query, f"{days_back} days")
        
        if len(results) < 7:
            raise ValueError("Not enough data for trend analysis")
        
        # Extract time series - handle different date formats
        dates = []
        for row in results:
            date_str = row.get('date')
            if isinstance(date_str, str):
                try:
                    dates.append(datetime.strptime(date_str, '%Y-%m-%d').date())
                except ValueError:
                    # Try ISO format
                    try:
                        dates.append(datetime.fromisoformat(date_str.split('T')[0]).date())
                    except:
                        # Fallback to today
                        dates.append(date.today())
            elif isinstance(date_str, date):
                dates.append(date_str)
            else:
                dates.append(date.today())
        
        metric_map = {
            'revenue': 'revenue',
            'orders': 'order_count',
            'avg_ticket': 'avg_ticket'
        }
        
        if metric not in metric_map:
            raise ValueError(f"Invalid metric. Choose from: {', '.join(metric_map.keys())}")
        
        values = [float(row.get(metric_map[metric], 0)) for row in results]
        
        # Simple linear regression
        n = len(values)
        x = list(range(n))
        
        # Calculate slope and intercept
        x_mean = sum(x) / n
        y_mean = sum(values) / n
        
        numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        slope = numerator / denominator if denominator != 0 else 0
        intercept = y_mean - slope * x_mean
        
        # Calculate R-squared
        ss_tot = sum((values[i] - y_mean) ** 2 for i in range(n))
        ss_res = sum((values[i] - (slope * x[i] + intercept)) ** 2 for i in range(n))
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        
        # Generate forecast
        forecast = []
        for i in range(forecast_days):
            future_x = n + i
            predicted_value = slope * future_x + intercept
            future_date = dates[-1] + timedelta(days=i+1)
            
            forecast.append({
                'date': future_date.isoformat(),
                'predicted_value': round(predicted_value, 2),
                'day_number': future_x
            })
        
        # Determine trend
        percent_change = (slope / y_mean * 100) if y_mean != 0 else 0
        
        if abs(percent_change) < 1:
            trend = 'stable'
        elif percent_change > 0:
            trend = 'increasing'
        else:
            trend = 'decreasing'
        
        return {
            "historical_data": [
                {
                    'date': dates[i].isoformat(),
                    'actual_value': round(values[i], 2),
                    'trend_line': round(slope * x[i] + intercept, 2)
                }
                for i in range(n)
            ],
            "forecast": forecast,
            "analysis": {
                "metric": metric,
                "trend": trend,
                "slope": round(slope, 4),
                "daily_change": round(slope, 2),
                "percent_change_per_day": round(percent_change, 2),
                "r_squared": round(r_squared, 4),
                "model_quality": "good" if r_squared >= 0.7 else "fair" if r_squared >= 0.5 else "poor",
                "days_analyzed": days_back,
                "forecast_days": forecast_days
            }
        }
    
    def _generate_trend_insights(self, trend: str, slope: float, metric: str, r_squared: float) -> List[str]:
        """Generate insights from trend analysis"""
        insights = []
        
        if trend == 'increasing':
            insights.append(f"✅ {metric.title()} is trending upward with a daily increase of {abs(slope):.2f}")
            if r_squared >= 0.7:
                insights.append("The trend is strong and consistent")
        elif trend == 'decreasing':
            insights.append(f"⚠️ {metric.title()} is trending downward with a daily decrease of {abs(slope):.2f}")
            if r_squared >= 0.7:
                insights.append("The decline is consistent - action may be needed")
        else:
            insights.append(f"📊 {metric.title()} is relatively stable")
        
        if r_squared < 0.5:
            insights.append("⚠️ High variability in data - predictions may be less reliable")
        
        return insights
