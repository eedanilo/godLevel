"""
Service layer for data exploration and advanced analytics
"""
from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta
from app.repositories.explore_repository import ExploreRepository
from app.utils.validation import validate_date_range
import logging

logger = logging.getLogger(__name__)


class ExploreService:
    """Service for data exploration"""
    
    def __init__(self):
        self.repository = ExploreRepository()
    
    async def profile_sales_data(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Profile sales data with caching"""
        start = start_date or '2025-05-01'
        end = end_date or '2025-05-31'
        
        start_obj, end_obj = validate_date_range(start, end, default_start='2025-05-01', default_end='2025-05-31')
        if end_obj:
            end_obj = end_obj + timedelta(days=1)
        else:
            end_obj = date(2025, 6, 1)  # Default end date + 1 day
        
        from app.core.cache import cache_key, cache
        cache_key_str = cache_key("sales_profile", start, end)
        
        cached = await cache.get(cache_key_str)
        if cached:
            return cached
        
        result = await self.repository.profile_sales_data(start_obj, end_obj)
        
        # Generate insights
        result["insights"] = self._generate_profiling_insights(result)
        
        from app.core.cache import cache
        await cache.set(cache_key_str, result, ttl=600)  # Cache for 10 minutes
        
        return result
    
    async def analyze_correlations(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze correlations with caching"""
        start = start_date or '2025-05-01'
        end = end_date or '2025-05-31'
        
        start_obj, end_obj = validate_date_range(start, end, default_start='2025-05-01', default_end='2025-05-31')
        if end_obj:
            end_obj = end_obj + timedelta(days=1)
        else:
            end_obj = date(2025, 6, 1)  # Default end date + 1 day
        
        from app.core.cache import cache_key, cache
        cache_key_str = cache_key("correlations", start, end)
        
        cached = await cache.get(cache_key_str)
        if cached:
            return cached
        
        analyses = await self.repository.analyze_correlations(start_obj, end_obj)
        
        result = {
            "analyses": analyses,
            "insights": self._generate_correlation_insights(analyses)
        }
        
        await cache.set(cache_key_str, result, ttl=600)
        
        return result
    
    def _generate_profiling_insights(self, profile_data: Dict) -> List[Dict]:
        """Generate insights from profiling data"""
        insights = []
        
        if "summary" in profile_data:
            summary = profile_data["summary"]
            cancellation_rate = summary.get("cancellation_rate", 0)
            
            if cancellation_rate > 10:
                insights.append({
                    "type": "warning",
                    "title": "Taxa de cancelamento elevada",
                    "description": f"Taxa de cancelamento de {cancellation_rate:.1f}% está acima do esperado"
                })
        
        if "revenue_stats" in profile_data:
            revenue = profile_data["revenue_stats"]
            outliers_pct = (revenue.get("outliers", 0) / summary.get("total_records", 1)) * 100 if summary.get("total_records") else 0
            
            if outliers_pct > 5:
                insights.append({
                    "type": "info",
                    "title": "Muitos valores atípicos",
                    "description": f"{outliers_pct:.1f}% dos pedidos são considerados atípicos"
                })
        
        if "data_quality" in profile_data:
            quality = profile_data["data_quality"]
            completeness = quality.get("completeness_score", 100)
            
            if completeness < 80:
                insights.append({
                    "type": "warning",
                    "title": "Qualidade dos dados",
                    "description": f"Score de completude de {completeness:.1f}% pode indicar problemas nos dados"
                })
        
        return insights
    
    def _generate_correlation_insights(self, analyses: Dict) -> List[Dict]:
        """Generate insights from correlation analysis"""
        insights = []
        
        # Discount impact
        if "discount_impact" in analyses:
            discount_data = analyses["discount_impact"]
            if len(discount_data) >= 2:
                no_discount = next((d for d in discount_data if d.get('discount_range') == 'No Discount'), None)
                with_discount = [d for d in discount_data if d.get('discount_range') != 'No Discount']
                
                if no_discount and with_discount:
                    avg_with = sum(float(d.get('avg_order_value', 0)) for d in with_discount) / len(with_discount)
                    avg_without = float(no_discount.get('avg_order_value', 0))
                    
                    if avg_with > avg_without and avg_without > 0:
                        diff = ((avg_with - avg_without) / avg_without) * 100
                        insights.append({
                            'type': 'positive',
                            'category': 'discount_effectiveness',
                            'title': 'Descontos aumentam ticket médio',
                            'description': f'Pedidos com desconto têm {diff:.1f}% de ticket médio maior (R$ {avg_with:.2f} vs R$ {avg_without:.2f})'
                        })
        
        # Day of week pattern
        if "day_of_week_pattern" in analyses:
            dow_data = analyses["day_of_week_pattern"]
            if dow_data:
                peak_day = max(dow_data, key=lambda x: int(x.get('order_count', 0)))
                insights.append({
                    'type': 'info',
                    'category': 'busiest_day',
                    'title': f'{peak_day.get("day_name")} é o dia mais movimentado',
                    'description': f'{peak_day.get("order_count")} pedidos com R$ {float(peak_day.get("total_revenue", 0)):.2f} em receita'
                })
        
        # Hourly pattern
        if "hourly_pattern" in analyses:
            hourly_data = analyses["hourly_pattern"]
            if hourly_data:
                peak_hour = max(hourly_data, key=lambda x: int(x.get('order_count', 0)))
                insights.append({
                    'type': 'info',
                    'category': 'peak_hour',
                    'title': f'{int(peak_hour.get("hour", 0))}h é o horário de pico ({peak_hour.get("period")})',
                    'description': f'{peak_hour.get("order_count")} pedidos com ticket médio de R$ {float(peak_hour.get("avg_order_value", 0)):.2f}'
                })
        
        return insights
    
    async def cohort_retention_analysis(
        self,
        cohort_months: int = 6
    ) -> Dict[str, Any]:
        """Cohort retention analysis with caching"""
        from app.core.cache import cache_key, cache
        cache_key_str = cache_key("cohort_retention", cohort_months)
        
        cached = await cache.get(cache_key_str)
        if cached:
            return cached
        
        result = await self.repository.cohort_retention_analysis(cohort_months)
        
        await cache.set(cache_key_str, result, ttl=600)
        
        return result
    
    async def detect_anomalies(
        self,
        days_back: int = 30,
        sensitivity: float = 2.0
    ) -> Dict[str, Any]:
        """Detect anomalies with caching"""
        from app.core.cache import cache_key, cache
        cache_key_str = cache_key("anomalies", days_back, sensitivity)
        
        cached = await cache.get(cache_key_str)
        if cached:
            return cached
        
        result = await self.repository.detect_anomalies(days_back, sensitivity)
        
        await cache.set(cache_key_str, result, ttl=300)  # Cache for 5 minutes
        
        return result
    
    async def product_affinity_analysis(
        self,
        min_support: float = 0.01,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Product affinity analysis with caching"""
        from app.core.cache import cache_key, cache
        cache_key_str = cache_key("product_affinity", min_support, limit)
        
        cached = await cache.get(cache_key_str)
        if cached:
            return cached
        
        result = await self.repository.product_affinity_analysis(min_support, limit)
        
        # Add recommendations
        result["recommendations"] = self._generate_affinity_recommendations(result.get("rules", []))
        
        await cache.set(cache_key_str, result, ttl=600)
        
        return result
    
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
    
    async def trend_forecast(
        self,
        metric: str = "revenue",
        days_back: int = 30,
        forecast_days: int = 7
    ) -> Dict[str, Any]:
        """Trend forecast with caching"""
        from app.core.cache import cache_key, cache
        cache_key_str = cache_key("trend_forecast", metric, days_back, forecast_days)
        
        cached = await cache.get(cache_key_str)
        if cached:
            return cached
        
        result = await self.repository.trend_forecast(metric, days_back, forecast_days)
        
        # Add insights
        analysis = result.get("analysis", {})
        result["insights"] = self._generate_trend_insights(
            analysis.get("trend", "stable"),
            analysis.get("slope", 0.0),
            analysis.get("metric", metric),
            analysis.get("r_squared", 0.0)
        )
        
        await cache.set(cache_key_str, result, ttl=300)  # Cache for 5 minutes
        
        return result
    
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

