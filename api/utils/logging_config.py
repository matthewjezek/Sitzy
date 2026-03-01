"""Structured logging configuration for Sitzy API."""

import json
import logging
import sys
from typing import Any

from api.config import settings


class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs JSON for production, plain text for dev."""

    def format(self, record: logging.LogRecord) -> str:
        if settings.environment == "production":
            log_data = {
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "timestamp": self.formatTime(record),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
            }

            # Add exception info if present
            if record.exc_info:
                log_data["exception"] = self.formatException(record.exc_info)

            # Add extra fields if present
            if hasattr(record, "extra_fields"):
                log_data.update(record.extra_fields)

            return json.dumps(log_data)
        else:
            # Development: human-readable format
            fmt = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            formatter = logging.Formatter(fmt)
            return formatter.format(record)


def setup_logging() -> None:
    """Configure structured logging for the application."""
    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    # Create formatter
    formatter = JSONFormatter()
    console_handler.setFormatter(formatter)

    # Add handler to root logger
    root_logger.addHandler(console_handler)

    # Configure specific loggers
    logging.getLogger("api").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.WARNING if settings.environment == "production" else logging.INFO
    )


def get_logger(name: str) -> logging.LoggerAdapter[logging.Logger]:
    """Get a logger with support for extra fields."""
    base_logger = logging.getLogger(name)
    return logging.LoggerAdapter(base_logger, {})


def log_with_context(
    logger: logging.LoggerAdapter[logging.Logger],
    level: int,
    message: str,
    **kwargs: Any,
) -> None:
    """Log a message with extra context fields."""
    if kwargs:
        extra = {"extra_fields": kwargs}
        logger.log(level, message, extra=extra)
    else:
        logger.log(level, message)
