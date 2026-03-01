"""Health check endpoints for monitoring."""

import logging
from typing import Any

import redis.exceptions
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.database import get_db
from api.utils.logging_config import get_logger, log_with_context

router = APIRouter(tags=["health"])
logger = get_logger(__name__)


def check_database() -> dict[str, str]:
    """Check database connectivity."""
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
        log_with_context(logger, logging.DEBUG, "Database health check passed")
        return {"status": "connected"}
    except Exception as e:
        log_with_context(
            logger,
            logging.ERROR,
            "Database health check failed",
            error=str(e),
        )
        return {"status": "disconnected", "error": str(e)}


def check_redis() -> dict[str, str]:
    """Check Redis connectivity."""
    try:
        import redis as redis_lib

        from api.config import settings

        redis_client = redis_lib.from_url(settings.redis_url, decode_responses=True)  # type: ignore
        redis_client.ping()
        log_with_context(logger, logging.DEBUG, "Redis health check passed")
        return {"status": "connected"}
    except redis.exceptions.ConnectionError as e:
        log_with_context(
            logger,
            logging.ERROR,
            "Redis health check failed",
            error=str(e),
        )
        return {"status": "disconnected", "error": str(e)}
    except Exception as e:
        log_with_context(
            logger,
            logging.ERROR,
            "Redis health check failed with unexpected error",
            error=str(e),
        )
        return {"status": "disconnected", "error": str(e)}


@router.get("/health", response_model=dict[str, Any])
def health_check(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Health check endpoint for monitoring."""
    database_status = check_database()
    redis_status = check_redis()

    overall_status = (
        "healthy"
        if database_status["status"] == "connected"
        and redis_status["status"] == "connected"
        else "degraded"
    )

    response = {
        "status": overall_status,
        "database": database_status,
        "redis": redis_status,
    }

    log_with_context(
        logger,
        logging.INFO,
        "Health check performed",
        overall_status=overall_status,
        database=database_status["status"],
        redis=redis_status["status"],
    )

    return response


@router.get("/alive")
def liveness() -> dict[str, str]:
    """Simple liveness check for container orchestration."""
    return {"status": "ok"}
