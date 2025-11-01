"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import date


class Filter(BaseModel):
    field: str
    operator: str = Field(..., description="eq, ne, gt, gte, lt, lte, in, not_in, like, between")
    value: Any


class Dimension(BaseModel):
    field: str
    alias: Optional[str] = None


class Metric(BaseModel):
    field: str
    aggregation: str = Field(..., description="sum, avg, count, min, max")
    alias: Optional[str] = None


class QueryRequest(BaseModel):
    dimensions: List[Dimension] = []
    metrics: List[Metric] = []
    filters: List[Filter] = []
    time_range: Optional[Dict[str, str]] = None
    group_by: Optional[List[str]] = []
    order_by: Optional[List[Dict[str, str]]] = []
    limit: Optional[int] = Field(default=100, ge=1, le=1000)


class RevenueResponse(BaseModel):
    total_orders: int
    total_revenue: float
    avg_ticket: float


class ProductResponse(BaseModel):
    id: int
    product_name: str
    category_name: Optional[str]
    total_quantity: float
    total_revenue: float
    order_count: int


class StorePerformanceResponse(BaseModel):
    id: int
    store_name: str
    city: Optional[str]
    state: Optional[str]
    total_orders: int
    total_revenue: float
    avg_ticket: float
    avg_production_time: Optional[float]
    avg_delivery_time: Optional[float]

