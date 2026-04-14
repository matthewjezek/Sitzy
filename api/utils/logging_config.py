"""Structured logging configuration for Sitzy API."""

import contextvars
import json
import logging
import sys
import time
from typing import Any

from api.config import settings

# Context variable for tracking request IDs across async operations
request_id_context: contextvars.ContextVar[str] = contextvars.ContextVar(
    "request_id", default="N/A"
)
# Context variable for tracking operation start times
operation_start_time: contextvars.ContextVar[float] = contextvars.ContextVar(
    "operation_start", default=0.0
)

# ANSI color codes for terminal output
COLORS = {
    "RESET": "\033[0m",
    "BOLD": "\033[1m",
    "DIM": "\033[2m",
    "RED": "\033[91m",
    "GREEN": "\033[92m",
    "YELLOW": "\033[93m",
    "BLUE": "\033[94m",
    "CYAN": "\033[96m",
    "MAGENTA": "\033[95m",
    "WHITE": "\033[97m",
}

# Mapping levels to colors
LEVEL_COLORS = {
    "DEBUG": COLORS["DIM"] + COLORS["BLUE"],
    "INFO": COLORS["GREEN"],
    "WARNING": COLORS["YELLOW"],
    "ERROR": COLORS["RED"],
    "CRITICAL": COLORS["BOLD"] + COLORS["RED"],
}


class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs JSON for production, plain text for dev."""

    def format(self, record: logging.LogRecord) -> str:
        request_id = request_id_context.get()

        if settings.environment == "production":
            log_data = {
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "timestamp": self.formatTime(record),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
                "request_id": request_id,
            }

            # Add exception info if present
            if record.exc_info:
                log_data["exception"] = self.formatException(record.exc_info)

            # Add extra fields if present
            if hasattr(record, "extra_fields"):
                log_data.update(record.extra_fields)

            return json.dumps(log_data)
        else:
            # Development: color-coded human-readable format
            level_color = LEVEL_COLORS.get(record.levelname, COLORS["WHITE"])
            level_name = f"{level_color}{record.levelname}{COLORS['RESET']}"

            # Build log message with context
            timestamp = self.formatTime(record, "%H:%M:%S")
            message = record.getMessage()

            # Add request ID if available
            request_info = (
                f" {COLORS['DIM']}[{request_id}]{COLORS['RESET']}"
                if request_id != "N/A"
                else ""
            )

            # Add context fields if present
            context_str = ""
            if hasattr(record, "extra_fields") and record.extra_fields:
                fields = " ".join(
                    f"{COLORS['CYAN']}{k}{COLORS['RESET']}={v}"
                    for k, v in record.extra_fields.items()
                )
                context_str = f" {COLORS['DIM']}[{fields}]{COLORS['RESET']}"

            # Format: TIME LEVEL[request_id] message [context]
            log_line = (
                f"{COLORS['DIM']}{timestamp}{COLORS['RESET']} {level_name}"
                f"{request_info} {message}{context_str}"
            )

            if record.exc_info:
                log_line += f"\n{self.formatException(record.exc_info)}"

            return log_line


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
    """Get a logger with support for extra fields and context."""
    base_logger = logging.getLogger(name)
    return logging.LoggerAdapter(base_logger, {})


def set_request_context(request_id: str) -> None:
    """Set the request ID in the context variable."""
    request_id_context.set(request_id)


def get_request_context() -> str:
    """Get the current request ID."""
    return request_id_context.get()


def start_operation_timer() -> None:
    """Start timing an operation."""
    operation_start_time.set(time.time())


def get_operation_duration() -> float:
    """Get operation duration in milliseconds."""
    start = operation_start_time.get()
    return round((time.time() - start) * 1000, 2) if start > 0 else 0


def log_entry(
    logger: logging.LoggerAdapter[logging.Logger],
    message: str,
    level: int = logging.INFO,
    **context: Any,
) -> None:
    """Log an entry with consistent formatting and context.

    Args:
        logger: The logger instance
        message: Main log message
        level: Log level (default INFO)
        **context: Additional context fields to include
    """
    if context:
        extra = {"extra_fields": context}
        logger.log(level, message, extra=extra)
    else:
        logger.log(level, message)


def log_action(
    logger: logging.LoggerAdapter[logging.Logger],
    action: str,
    status: str = "started",
    **details: Any,
) -> None:
    """Log an action with consistent formatting.

    Args:
        logger: The logger instance
        action: Action name (e.g., 'user_login', 'car_created')
        status: Action status (e.g., 'started', 'completed', 'failed')
        **details: Additional action details
    """
    context = {"action": action, "status": status, **details}
    log_entry(logger, f"Action: {action} ({status})", logging.INFO, **context)


def log_action_timing(
    logger: logging.LoggerAdapter[logging.Logger],
    action: str,
    duration_ms: float,
    status: str = "completed",
    **details: Any,
) -> None:
    """Log an action with timing information.

    Args:
        logger: The logger instance
        action: Action name
        duration_ms: Operation duration in milliseconds
        status: Action status
        **details: Additional action details
    """
    context = {
        "action": action,
        "status": status,
        "duration_ms": duration_ms,
        **details,
    }
    log_entry(
        logger,
        f"Action: {action} ({status}) [{duration_ms}ms]",
        logging.INFO,
        **context,
    )


def log_error_action(
    logger: logging.LoggerAdapter[logging.Logger],
    action: str,
    error: str,
    **details: Any,
) -> None:
    """Log a failed action with error details.

    Args:
        logger: The logger instance
        action: Action name
        error: Error message or exception
        **details: Additional action details
    """
    context = {"action": action, "status": "failed", "error": str(error), **details}
    log_entry(logger, f"Action: {action} (failed) - {error}", logging.ERROR, **context)


# Backward compatibility: keep log_with_context for existing code
def log_with_context(
    logger: logging.LoggerAdapter[logging.Logger],
    level: int,
    message: str,
    **kwargs: Any,
) -> None:
    """Log a message with extra context fields (deprecated - use log_entry instead)."""
    log_entry(logger, message, level, **kwargs)
