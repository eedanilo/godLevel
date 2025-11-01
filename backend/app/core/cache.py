"""
Cache layer implementation
"""
from typing import Optional, Any, Callable
import hashlib
import json
import asyncio
from datetime import datetime, timedelta
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class InMemoryCache:
    """Simple in-memory cache implementation"""
    
    def __init__(self, default_ttl: int = 300):
        self._cache: dict = {}
        self._timestamps: dict = {}
        self.default_ttl = default_ttl
        self._lock = asyncio.Lock()
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = {
            "prefix": prefix,
            "args": args,
            "kwargs": sorted(kwargs.items()) if kwargs else {}
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not settings.CACHE_ENABLED:
            return None
        
        async with self._lock:
            if key in self._cache:
                # Check if expired
                timestamp = self._timestamps.get(key)
                if timestamp and datetime.now() < timestamp:
                    return self._cache[key]
                else:
                    # Remove expired entry
                    self._cache.pop(key, None)
                    self._timestamps.pop(key, None)
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache"""
        if not settings.CACHE_ENABLED:
            return
        
        async with self._lock:
            ttl = ttl or self.default_ttl
            expire_time = datetime.now() + timedelta(seconds=ttl)
            self._cache[key] = value
            self._timestamps[key] = expire_time
    
    async def delete(self, key: str):
        """Delete key from cache"""
        async with self._lock:
            self._cache.pop(key, None)
            self._timestamps.pop(key, None)
    
    async def clear(self):
        """Clear all cache"""
        async with self._lock:
            self._cache.clear()
            self._timestamps.clear()
    
    async def get_or_set(
        self,
        key: str,
        callable_func: Callable,
        ttl: Optional[int] = None
    ) -> Any:
        """Get value from cache or compute and cache it"""
        value = await self.get(key)
        if value is not None:
            return value
        
        # Compute value
        if asyncio.iscoroutinefunction(callable_func):
            value = await callable_func()
        else:
            value = callable_func()
        
        await self.set(key, value, ttl)
        return value


# Global cache instance
cache = InMemoryCache(default_ttl=settings.CACHE_TTL)


def cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate cache key helper"""
    return cache._generate_key(prefix, *args, **kwargs)

