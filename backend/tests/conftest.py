"""
Pytest configuration and fixtures
"""
import pytest
import asyncio
from typing import AsyncGenerator
from app.core.database import init_db_pool, close_db_pool
from app.core.cache import cache


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def db_pool():
    """Initialize database pool for tests"""
    pool = await init_db_pool()
    yield pool
    await close_db_pool()


@pytest.fixture(autouse=True)
async def clear_cache():
    """Clear cache before each test"""
    await cache.clear()
    yield
    await cache.clear()


@pytest.fixture
def sample_revenue_data():
    """Sample revenue data for testing"""
    return {
        "total_orders": 100,
        "total_revenue": 5000.0,
        "avg_ticket": 50.0
    }


@pytest.fixture
def sample_product_data():
    """Sample product data for testing"""
    return [
        {
            "id": 1,
            "product_name": "Product 1",
            "category_name": "Category 1",
            "total_quantity": 50.0,
            "total_revenue": 2500.0,
            "order_count": 25
        }
    ]

