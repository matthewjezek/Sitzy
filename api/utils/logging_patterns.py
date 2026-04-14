"""
Logging patterns and best practices for Sitzy API.

This module demonstrates recommended logging patterns for consistent,
readable, and debuggable logs across the application.
"""

import time
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import ParamSpec, TypeVar

from api.utils.logging_config import (
    get_logger,
    get_operation_duration,
    log_action,
    log_action_timing,
    log_entry,
    log_error_action,
    start_operation_timer,
)

P = ParamSpec("P")
T = TypeVar("T")
logger = get_logger(__name__)


def log_database_operation(
    operation_name: str,
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """Decorator to log database operations with timing.

    Usage:
        @log_database_operation("find_user_by_email")
        def find_user_by_email(db: Session, email: str) -> User:
            ...
    """

    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            start_operation_timer()
            try:
                log_action(logger, f"db_{operation_name}", status="started")
                result = func(*args, **kwargs)
                duration = get_operation_duration()
                log_action_timing(logger, f"db_{operation_name}", duration)
                return result
            except Exception as exc:
                log_error_action(logger, f"db_{operation_name}", str(exc))
                raise

        return wrapper

    return decorator


def log_oauth_operation(
    provider: str,
    operation: str,
) -> Callable[[Callable[P, Awaitable[T]]], Callable[P, Awaitable[T]]]:
    """Decorator to log OAuth operations with provider context.

    Usage:
        @log_oauth_operation("facebook", "token_exchange")
        async def exchange_facebook_token(code: str) -> dict:
            ...
    """

    def decorator(func: Callable[P, Awaitable[T]]) -> Callable[P, Awaitable[T]]:
        @wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            start_operation_timer()
            action = f"oauth_{provider}_{operation}"
            try:
                log_action(logger, action, status="started", provider=provider)
                result = await func(*args, **kwargs)
                duration = get_operation_duration()
                log_action_timing(logger, action, duration, provider=provider)
                return result
            except Exception as exc:
                log_error_action(logger, action, str(exc), provider=provider)
                raise

        return wrapper

    return decorator


# ============================================================================
# LOGGING PATTERN EXAMPLES
# ============================================================================


# PATTERN 1: Simple Info Log
# ✓ Good: Concise message with context
def example_simple_log() -> None:
    """Simple information log."""
    user_id = "usr-123"
    log_entry(logger, "User authenticated successfully", user_id=user_id)


# PATTERN 2: Action Log (started/completed)
# ✓ Good: Clear action name with status
def example_action_log() -> None:
    """Action logging with status tracking."""
    car_id = "car-456"
    log_action(logger, "create_ride", status="started", car_id=car_id)
    # ... do work ...
    duration = get_operation_duration()
    log_action_timing(logger, "create_ride", duration, car_id=car_id)


# PATTERN 3: Error Logging
# ✓ Good: Error action with context
def example_error_log() -> None:
    """Error logging with context."""
    try:
        # ... error prone code ...
        raise ValueError("Invalid email format")
    except ValueError as exc:
        log_error_action(
            logger,
            "validate_email",
            str(exc),
            email="invalid@",
            user_id="usr-123",
        )


# PATTERN 4: Multi-step Operation
# ✓ Good: Track progress through steps
def example_multi_step_log() -> None:
    """Multi-step operation logging."""
    user_id = "usr-123"
    log_action(logger, "oauth_login", status="started", provider="facebook")

    log_entry(logger, "Exchanging OAuth code", provider="facebook", user_id=user_id)
    # ... exchange code ...

    log_entry(logger, "Fetching user profile", provider="facebook")
    # ... fetch profile ...

    log_entry(logger, "Creating session", user_id=user_id)
    # ... create session ...

    log_action_timing(
        logger, "oauth_login", 250.5, user_id=user_id, provider="facebook"
    )


# PATTERN 5: Resource Operations
# ✓ Good: Consistent pattern for CRUD
def example_crud_log() -> None:
    """CRUD operation logging."""
    car_id = "car-456"
    layout = "SEDAQ"

    # Create
    log_action(logger, "car_create", status="started", layout=layout)
    # ... create ...
    log_action_timing(logger, "car_create", 45.2, car_id=car_id, layout=layout)

    # Read
    log_entry(logger, "Fetching car", car_id=car_id)

    # Update
    log_action(logger, "car_update", status="started", car_id=car_id)
    # ... update ...
    log_action_timing(logger, "car_update", 32.1, car_id=car_id)

    # Delete
    log_action(logger, "car_delete", status="started", car_id=car_id)
    # ... delete ...
    log_action_timing(logger, "car_delete", 28.5, car_id=car_id)


# ============================================================================
# WHAT NOT TO DO
# ============================================================================


# ✗ BAD: Using f-strings for logging (losing structure)
def bad_example_1() -> None:
    """Don't do this: unstructured f-string messages."""
    user_id = "usr-123"
    logger.info(f"User {user_id} updated their profile at {time.time()}")
    # Problem: Can't easily search/filter by user_id in logs


# ✗ BAD: Inconsistent context format
def bad_example_2() -> None:
    """Don't do this: inconsistent extra field format."""
    logger.info("Action completed", extra={"user": "usr-123"})
    logger.info("Data saved", extra={"user_id": "usr-456"})
    # Problem: Can't reliably search for user context


# ✗ BAD: Logging raw objects
def bad_example_3() -> None:
    """Don't do this: logging complex objects."""
    user = {"id": "usr-123", "email": "user@example.com", "password": "secret"}
    logger.info("User object", extra={"user": user})
    # Problem: Accidentally logging sensitive data


# ✗ BAD: No context for errors
def bad_example_4() -> None:
    """Don't do this: error logging without context."""
    try:
        # ... operation ...
        pass
    except Exception as exc:
        logger.error(str(exc))
    # Problem: Can't trace back to what operation failed


# ============================================================================
# DEVELOPMENT MODE EXAMPLES
# ============================================================================
# When running with `ENVIRONMENT=development`, logs appear in this format:
#
#   12:34:56 INFO [a8f2c3b1] User authenticated successfully [user_id=usr-123]
#   12:34:57 INFO [a8f2c3b1] Action: create_ride (started) [action=create_ride
#   status=started car_id=car-456]
#   12:34:57 ERROR [a8f2c3b1] Action: validate_email (failed) - Invalid email format
#   [action=validate_email status=failed error=Invalid email format email=invalid@]
#
# Colors help distinguish levels:
#   - DEBUG: dim blue
#   - INFO: green
#   - WARNING: yellow
#   - ERROR: red
#   - CRITICAL: bold red
#
# Each log line shows:
#   - TIME: HH:MM:SS (dim)
#   - LEVEL: Colored level name
#   - REQUEST_ID: UUID in brackets (dim)
#   - MESSAGE: Main log message
#   - CONTEXT: Extra fields in brackets (dim, cyan keys)
