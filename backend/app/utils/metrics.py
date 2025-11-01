"""
Application metrics for monitoring
"""
from prometheus_client import Counter, Histogram, Gauge
from functools import wraps
import time
from typing import Callable, Any
import asyncio

# Request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

# Database metrics
db_query_duration = Histogram(
    'db_query_duration_seconds',
    'Database query duration in seconds',
    ['query_type']
)

db_pool_size = Gauge(
    'db_pool_size',
    'Database connection pool size',
    ['state']  # active, idle, waiting
)

# Cache metrics
cache_hits = Counter('cache_hits_total', 'Total cache hits')
cache_misses = Counter('cache_misses_total', 'Total cache misses')


def track_request_metrics(func: Callable) -> Callable:
    """Decorator to track request metrics"""
    if asyncio.iscoroutinefunction(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            method = "GET"  # Default, should be extracted from request
            endpoint = func.__name__
            
            try:
                result = await func(*args, **kwargs)
                status_code = getattr(result, 'status_code', 200)
                http_requests_total.labels(
                    method=method,
                    endpoint=endpoint,
                    status=status_code
                ).inc()
                
                duration = time.time() - start_time
                http_request_duration.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(duration)
                
                return result
            except Exception as e:
                http_requests_total.labels(
                    method=method,
                    endpoint=endpoint,
                    status=500
                ).inc()
                raise
        
        return async_wrapper
    else:
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            method = "GET"
            endpoint = func.__name__
            
            try:
                result = func(*args, **kwargs)
                status_code = 200
                http_requests_total.labels(
                    method=method,
                    endpoint=endpoint,
                    status=status_code
                ).inc()
                
                duration = time.time() - start_time
                http_request_duration.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(duration)
                
                return result
            except Exception as e:
                http_requests_total.labels(
                    method=method,
                    endpoint=endpoint,
                    status=500
                ).inc()
                raise
        
        return sync_wrapper


def track_db_query(query_type: str):
    """Decorator to track database query metrics"""
    def decorator(func: Callable) -> Callable:
        if asyncio.iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    duration = time.time() - start_time
                    db_query_duration.labels(query_type=query_type).observe(duration)
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    db_query_duration.labels(query_type=query_type).observe(duration)
                    raise
            
            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start_time
                    db_query_duration.labels(query_type=query_type).observe(duration)
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    db_query_duration.labels(query_type=query_type).observe(duration)
                    raise
            
            return sync_wrapper
    
    return decorator

