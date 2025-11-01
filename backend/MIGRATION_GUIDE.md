# Migration Guide

## Migration Summary

This guide documents the migration from `main.py` to the new layered architecture.

## Completed Migrations

### 1. Core Infrastructure ✅
- **Database Pooling**: Optimized connection pool settings
- **Caching Layer**: In-memory cache with TTL
- **Logging**: Structured JSON logging
- **Rate Limiting**: IP-based rate limiting middleware
- **Health Checks**: Kubernetes-ready health endpoints
- **Metrics**: Prometheus metrics integration

### 2. Architecture Layers ✅
- **Repositories**: `app/repositories/metrics_repository.py`
- **Services**: `app/services/metrics_service.py`
- **Routes**: `app/api/routes/metrics_routes.py`
- **Schemas**: `app/models/schemas.py`

### 3. Migrated Endpoints ✅

#### Metrics Endpoints
- `/api/metrics/revenue` - Revenue metrics
- `/api/metrics/top-products` - Top products
- `/api/metrics/peak-hours` - Peak hours
- `/api/metrics/store-performance` - Store performance
- `/api/metrics/channel-comparison` - Channel comparison
- `/api/metrics/daily-trends` - Daily trends

#### Health & Metrics
- `/health` - Basic health check
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe
- `/health/metrics` - Detailed metrics
- `/metrics` - Prometheus metrics

## Pending Migrations

### Endpoints to Migrate

1. **Query Builder** (`/api/query`)
   - Needs: Query builder service
   - Complexity: High (dynamic SQL builder)

2. **Metadata** (`/api/meta/tables`, `/api/meta/columns`)
   - Needs: Metadata repository/service
   - Complexity: Low

3. **Insights** (`/api/metrics/insights`)
   - Needs: Insights service
   - Complexity: Medium (complex calculations)

4. **Customers** (`/api/metrics/customers`)
   - Needs: Customers repository/service
   - Complexity: Medium (complex queries)

## How to Run the New Version

### Option 1: Run New Version (Recommended)
```bash
cd backend
uvicorn main_refactored:app --host 0.0.0.0 --port 8000 --reload
```

### Option 2: Keep Old Version for Compatibility
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Testing

### Run Unit Tests
```bash
cd backend
pytest tests/unit/ -v
```

### Run Integration Tests
```bash
cd backend
pytest tests/integration/ -v
```

### Run All Tests
```bash
cd backend
pytest tests/ -v
```

## Migration Checklist

- [x] Core infrastructure (database, cache, logging)
- [x] Health checks and metrics
- [x] Metrics repository
- [x] Metrics service
- [x] Metrics routes
- [x] Unit tests for validation
- [x] Integration tests for metrics API
- [ ] Query builder migration
- [ ] Metadata endpoints migration
- [ ] Insights endpoint migration
- [ ] Customers endpoint migration
- [ ] Complete integration tests

## Next Steps

1. Complete migration of remaining endpoints
2. Update frontend to use new endpoints (if needed)
3. Performance testing
4. Remove old `main.py` after full migration
5. Update documentation

