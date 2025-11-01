# Architecture Documentation

## Layered Architecture

The application follows a layered architecture pattern:

```
app/
├── api/
│   └── routes/          # API endpoints (presentation layer)
├── services/            # Business logic layer
├── repositories/        # Data access layer
├── models/              # Data models
├── schemas/             # Pydantic schemas for validation
├── core/                # Core configuration and setup
│   ├── config.py        # Application settings
│   ├── database.py      # Database connection management
│   ├── cache.py         # Cache layer
│   └── logging_config.py  # Logging setup
├── middleware/          # Custom middleware
│   ├── rate_limit.py    # Rate limiting
│   └── logging_middleware.py  # Request/response logging
└── utils/               # Utility functions
    ├── metrics.py       # Prometheus metrics
    └── validation.py    # Data validation and sanitization
```

## Layer Responsibilities

### API Routes (Presentation Layer)
- Handle HTTP requests/responses
- Validate input using Pydantic schemas
- Call service layer
- Return formatted responses

### Services (Business Logic Layer)
- Implement business logic
- Coordinate between repositories
- Handle caching
- Transform data

### Repositories (Data Access Layer)
- Database queries
- Data mapping
- Connection management
- Prepared statements

## Features Implemented

### 1. Connection Pooling
- Optimized pool settings (min=5, max=20)
- Connection lifecycle management
- Timeout configuration

### 2. Caching
- In-memory cache with TTL
- Automatic expiration
- Cache key generation
- Configurable via environment variables

### 3. Rate Limiting
- Sliding window algorithm
- Configurable per-minute limits
- IP-based limiting
- Rate limit headers in responses

### 4. Logging
- Structured JSON logging
- Request/response logging middleware
- Log levels configuration
- Performance tracking

### 5. Monitoring
- Prometheus metrics endpoint
- Request duration tracking
- Database query metrics
- Cache hit/miss tracking

### 6. Validation
- Input sanitization
- Date range validation
- Limit validation
- Email/phone validation

### 7. Health Checks
- `/health` - Basic health check
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe
- `/health/metrics` - Detailed metrics

### 8. Performance Optimizations
- Database indexes for common queries
- Prepared statements for repeated queries
- Batch operations support
- Connection pooling optimization

## Configuration

All configuration is done via environment variables:

```bash
# Database
DATABASE_HOST=127.0.0.1
DATABASE_URL=postgresql://user:pass@host:5432/db

# Pool Settings
DB_POOL_MIN_SIZE=5
DB_POOL_MAX_SIZE=20
DB_POOL_MAX_QUERIES=50000
DB_POOL_MAX_INACTIVE_LIFETIME=300
DB_COMMAND_TIMEOUT=60

# Cache
CACHE_ENABLED=true
CACHE_TTL=300

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Migration Path

The old `main.py` is preserved for compatibility. To migrate:

1. Gradually move endpoints to the new structure
2. Update imports to use new modules
3. Test each endpoint after migration
4. Eventually remove old `main.py` and rename `main_refactored.py`

## Next Steps

1. Complete migration of all endpoints to new structure
2. Add Redis for distributed caching
3. Add request ID tracking
4. Add API documentation improvements
5. Add integration tests
6. Add database migration system (Alembic)

