"""
FastAPI Backend para Analytics de Restaurantes - Refatorado com Arquitetura em Camadas
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import init_db_pool, close_db_pool
from app.core.logging_config import setup_logging
from app.core.migrations import create_indexes
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging_middleware import LoggingMiddleware
from app.api.routes import health, metrics, explore_routes

# Setup logging first
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação"""
    # Startup
    logger.info("Starting application...")
    
    try:
        # Initialize database pool
        await init_db_pool()
        logger.info("Database pool initialized")
        
        # Create indexes for performance (critical for query performance)
        try:
            await create_indexes()
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"CRITICAL: Failed to create indexes: {e}", exc_info=True)
            # Don't fail startup, but log as error
            # In production, this should fail fast
        
        logger.info("Application started successfully")
    
    except Exception as e:
        logger.error(f"Failed to start application: {e}", exc_info=True)
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    try:
        await close_db_pool()
        logger.info("Database pool closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
    
    logger.info("Application shut down complete")


# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(LoggingMiddleware)
if settings.RATE_LIMIT_ENABLED:
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=settings.RATE_LIMIT_PER_MINUTE
    )

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(metrics.router, tags=["Metrics"])

# Import metrics routes
from app.api.routes import metrics_routes
app.include_router(metrics_routes.router, tags=["Analytics"])

# Include explore routes
app.include_router(explore_routes.router, tags=["Data Exploration"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Restaurant Analytics API",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level=settings.LOG_LEVEL.lower()
    )

