"""
Database migration scripts for indexes
"""
import asyncpg
from app.core.database import get_db_pool
import logging

logger = logging.getLogger(__name__)


INDEXES = [
    # Sales indexes
    "CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);",
    "CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);",
    "CREATE INDEX IF NOT EXISTS idx_sales_channel_id ON sales(channel_id);",
    "CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);",
    "CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(sale_status_desc);",
    "CREATE INDEX IF NOT EXISTS idx_sales_store_created ON sales(store_id, created_at);",
    
    # Product sales indexes
    "CREATE INDEX IF NOT EXISTS idx_product_sales_sale_id ON product_sales(sale_id);",
    "CREATE INDEX IF NOT EXISTS idx_product_sales_product_id ON product_sales(product_id);",
    
    # Customer indexes
    "CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;",
    "CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number) WHERE phone_number IS NOT NULL;",
    
    # Composite indexes for common queries
    "CREATE INDEX IF NOT EXISTS idx_sales_status_created ON sales(sale_status_desc, created_at);",
    "CREATE INDEX IF NOT EXISTS idx_sales_customer_created ON sales(customer_id, created_at) WHERE customer_id IS NOT NULL;",
    
    # Performance indexes for customer queries (optimized order: status first for filtering)
    "CREATE INDEX IF NOT EXISTS idx_sales_status_customer_created ON sales(sale_status_desc, customer_id, created_at) WHERE customer_id IS NOT NULL;",
    "CREATE INDEX IF NOT EXISTS idx_sales_status_channel_created ON sales(sale_status_desc, channel_id, created_at);",
    "CREATE INDEX IF NOT EXISTS idx_sales_status_store_created ON sales(sale_status_desc, store_id, created_at);",
]


async def create_indexes():
    """Create database indexes for performance optimization"""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        for index_sql in INDEXES:
            try:
                await conn.execute(index_sql)
                logger.info(f"Created index: {index_sql.split()[5] if len(index_sql.split()) > 5 else 'unknown'}")
            except Exception as e:
                logger.warning(f"Failed to create index (may already exist): {e}")
    
    logger.info("Database indexes created successfully")


async def drop_indexes():
    """Drop all indexes (for testing/cleanup)"""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        for index_sql in INDEXES:
            try:
                index_name = index_sql.split()[5] if len(index_sql.split()) > 5 else None
                if index_name:
                    await conn.execute(f"DROP INDEX IF EXISTS {index_name};")
            except Exception as e:
                logger.warning(f"Failed to drop index: {e}")

