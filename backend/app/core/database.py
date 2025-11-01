"""
Database connection and pool management
"""
import asyncpg
from typing import Optional
from contextlib import asynccontextmanager
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Global connection pool
db_pool: Optional[asyncpg.Pool] = None


async def init_db_pool() -> asyncpg.Pool:
    """Initialize database connection pool with optimized settings"""
    global db_pool
    
    if db_pool:
        return db_pool
    
    try:
        db_pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=settings.DB_POOL_MIN_SIZE,
            max_size=settings.DB_POOL_MAX_SIZE,
            max_queries=settings.DB_POOL_MAX_QUERIES,
            max_inactive_connection_lifetime=settings.DB_POOL_MAX_INACTIVE_LIFETIME,
            command_timeout=settings.DB_COMMAND_TIMEOUT,
            server_settings={
                'application_name': 'restaurant_analytics',
                'jit': 'on',
            }
        )
        logger.info("Database connection pool initialized successfully")
        return db_pool
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")
        raise


async def close_db_pool():
    """Close database connection pool"""
    global db_pool
    if db_pool:
        await db_pool.close()
        db_pool = None
        logger.info("Database connection pool closed")


async def get_db_pool() -> asyncpg.Pool:
    """Get database connection pool"""
    if not db_pool:
        await init_db_pool()
    return db_pool


@asynccontextmanager
async def get_db_connection():
    """Get a database connection from the pool"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        yield conn

