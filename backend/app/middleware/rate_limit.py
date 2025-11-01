"""
Rate limiting middleware
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Tuple
from datetime import datetime, timedelta
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using sliding window"""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self._clients: Dict[str, list] = {}  # {ip: [timestamps]}
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        # Check for forwarded IP
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Check for real IP
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    def _is_rate_limited(self, client_ip: str) -> Tuple[bool, int]:
        """Check if client is rate limited"""
        now = datetime.now()
        window_start = now - timedelta(minutes=1)
        
        # Get or create client request list
        if client_ip not in self._clients:
            self._clients[client_ip] = []
        
        # Remove old timestamps outside the window
        self._clients[client_ip] = [
            ts for ts in self._clients[client_ip]
            if ts > window_start
        ]
        
        # Check if limit exceeded
        request_count = len(self._clients[client_ip])
        if request_count >= self.requests_per_minute:
            return True, self.requests_per_minute
        
        # Add current request
        self._clients[client_ip].append(now)
        
        # Cleanup old entries (keep only last 1000 clients)
        if len(self._clients) > 1000:
            # Remove clients with no recent requests
            cutoff = now - timedelta(hours=1)
            self._clients = {
                ip: timestamps
                for ip, timestamps in self._clients.items()
                if any(ts > cutoff for ts in timestamps)
            }
        
        return False, request_count
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/health/live", "/health/ready"]:
            return await call_next(request)
        
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)
        
        client_ip = self._get_client_ip(request)
        is_limited, count = self._is_rate_limited(client_ip)
        
        if is_limited:
            logger.warning(
                f"Rate limit exceeded for IP {client_ip}",
                extra={"ip": client_ip, "count": count}
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after": 60
                },
                headers={
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": "60"
                }
            )
        
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.requests_per_minute - count - 1
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        
        return response

