"""
Integration tests for metrics API endpoints
"""
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from main_refactored import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Test health check endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_revenue_endpoint():
    """Test revenue metrics endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/metrics/revenue",
            params={
                "start_date": "2025-05-01",
                "end_date": "2025-05-31"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "total_revenue" in data
        assert "avg_ticket" in data
        assert isinstance(data["total_orders"], int)
        assert isinstance(data["total_revenue"], float)
        assert isinstance(data["avg_ticket"], float)


@pytest.mark.asyncio
async def test_top_products_endpoint():
    """Test top products endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/metrics/top-products",
            params={
                "limit": 10,
                "start_date": "2025-05-01",
                "end_date": "2025-05-31"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert isinstance(data["products"], list)


@pytest.mark.asyncio
async def test_peak_hours_endpoint():
    """Test peak hours endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/metrics/peak-hours",
            params={
                "start_date": "2025-05-01",
                "end_date": "2025-05-31"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "hours" in data
        assert isinstance(data["hours"], list)


@pytest.mark.asyncio
async def test_store_performance_endpoint():
    """Test store performance endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/metrics/store-performance",
            params={
                "start_date": "2025-05-01",
                "end_date": "2025-05-31"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        assert isinstance(data["stores"], list)


@pytest.mark.asyncio
async def test_invalid_date_range():
    """Test validation of invalid date range"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/metrics/revenue",
            params={
                "start_date": "2025-05-31",
                "end_date": "2025-05-01"  # Start after end
            }
        )
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_invalid_limit():
    """Test validation of invalid limit"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/metrics/top-products",
            params={
                "limit": 200,  # Exceeds max
                "start_date": "2025-05-01",
                "end_date": "2025-05-31"
            }
        )
        # Should either clamp to max or return 400
        assert response.status_code in [200, 400]


@pytest.mark.asyncio
async def test_metrics_endpoint():
    """Test Prometheus metrics endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/metrics")
        assert response.status_code == 200
        assert "text/plain" in response.headers.get("content-type", "")

