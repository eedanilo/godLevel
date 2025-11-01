# Database Migrations

## Performance Indexes

This document describes the database indexes created for performance optimization.

### Running Migrations

The indexes are automatically created when the application starts. To manually run:

```python
from app.core.migrations import create_indexes
await create_indexes()
```

### Indexes Created

#### Sales Table Indexes

1. **idx_sales_created_at** - Index on `created_at` for date range queries
2. **idx_sales_store_id** - Index on `store_id` for filtering by store
3. **idx_sales_channel_id** - Index on `channel_id` for filtering by channel
4. **idx_sales_customer_id** - Index on `customer_id` for customer-related queries
5. **idx_sales_status** - Index on `sale_status_desc` for status filtering
6. **idx_sales_store_created** - Composite index on `(store_id, created_at)` for store-specific date queries
7. **idx_sales_status_created** - Composite index on `(sale_status_desc, created_at)` for filtered date queries
8. **idx_sales_customer_created** - Composite index on `(customer_id, created_at)` for customer history

#### Product Sales Indexes

9. **idx_product_sales_sale_id** - Index on `sale_id` for joining with sales
10. **idx_product_sales_product_id** - Index on `product_id` for product-related queries

#### Customer Indexes

11. **idx_customers_email** - Partial index on `email` (only non-null values)
12. **idx_customers_phone** - Partial index on `phone_number` (only non-null values)

### Performance Impact

These indexes significantly improve query performance for:
- Date range filtering
- Store/channel filtering
- Customer lookups
- Status filtering
- Product analytics
- Composite queries combining multiple filters

### Maintenance

Indexes are automatically maintained by PostgreSQL. Monitor index usage with:

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

