"""
Base repository with prepared statements support
"""
import asyncpg
from typing import Dict, Optional, Any
from contextlib import asynccontextmanager
from app.core.database import get_db_pool
import logging

logger = logging.getLogger(__name__)


class PreparedStatements:
    """Cache prepared statements per connection"""
    
    def __init__(self):
        self.statements: Dict[str, asyncpg.PreparedStatement] = {}
    
    async def prepare(self, conn: asyncpg.Connection, name: str, query: str) -> asyncpg.PreparedStatement:
        """Prepare a statement or return cached one"""
        cache_key = f"{id(conn)}_{name}"
        
        if cache_key not in self.statements:
            try:
                self.statements[cache_key] = await conn.prepare(query)
                logger.debug(f"Prepared statement: {name}")
            except Exception as e:
                logger.error(f"Failed to prepare statement {name}: {e}")
                raise
        
        return self.statements[cache_key]


class BaseRepository:
    """Base repository with common database operations"""
    
    def __init__(self):
        self._prepared_statements = PreparedStatements()
    
    async def _get_connection(self):
        """Get database connection from pool"""
        pool = await get_db_pool()
        return await pool.acquire()
    
    async def _release_connection(self, conn: asyncpg.Connection):
        """Release connection back to pool"""
        pool = await get_db_pool()
        await pool.release(conn)
    
    @asynccontextmanager
    async def _get_db_connection(self):
        """Get database connection context manager"""
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            yield conn
    
    async def execute_query(
        self,
        query: str,
        *args,
        use_prepared: bool = False,
        **kwargs
    ) -> list:
        """Execute a query and return results"""
        async with self._get_db_connection() as conn:
            try:
                if use_prepared and args:
                    # Use prepared statement for repeated queries
                    stmt = await self._prepared_statements.prepare(conn, query, query)
                    rows = await stmt.fetch(*args)
                else:
                    rows = await conn.fetch(query, *args)
                
                return [dict(row) for row in rows]
            except Exception as e:
                logger.error(f"Query execution failed: {e}", exc_info=True)
                raise
    
    async def execute_one(
        self,
        query: str,
        *args,
        use_prepared: bool = False,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Execute a query and return single result"""
        async with self._get_db_connection() as conn:
            try:
                if use_prepared and args:
                    stmt = await self._prepared_statements.prepare(conn, query, query)
                    row = await stmt.fetchrow(*args)
                else:
                    row = await conn.fetchrow(query, *args)
                
                return dict(row) if row else None
            except Exception as e:
                logger.error(f"Query execution failed: {e}", exc_info=True)
                raise
    
    async def execute_scalar(
        self,
        query: str,
        *args,
        **kwargs
    ) -> Any:
        """Execute a query and return scalar value"""
        async with self._get_db_connection() as conn:
            try:
                value = await conn.fetchval(query, *args)
                return value
            except Exception as e:
                logger.error(f"Scalar query execution failed: {e}", exc_info=True)
                raise
    
    async def batch_insert(
        self,
        table: str,
        records: list,
        columns: Optional[list] = None
    ):
        """Efficient batch insert using copy_records_to_table"""
        if not records:
            return
        
        if not columns:
            columns = list(records[0].keys())
        
        values = [[r.get(col) for col in columns] for r in records]
        
        async with self._get_db_connection() as conn:
            try:
                await conn.copy_records_to_table(
                    table,
                    records=values,
                    columns=columns
                )
                logger.info(f"Batch inserted {len(records)} records into {table}")
            except Exception as e:
                logger.error(f"Batch insert failed: {e}", exc_info=True)
                raise

