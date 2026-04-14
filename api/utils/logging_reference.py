"""Quick reference for improved logging system."""

# ============================================================================
# QUICK START - REPLACE OLD PATTERNS WITH NEW ONES
# ============================================================================

# OLD:
#   logger.info("Message", extra={"key": "value"})
# NEW:
#   log_entry(logger, "Message", key="value")

# OLD:
#   logger.error("Operation failed: " + str(exc), extra={"error": str(exc)})
# NEW:
#   log_error_action(logger, "operation_name", str(exc), key="value")

# OLD:
#   logger.info(f"User {user_id} created")
# NEW:
#   log_action_timing(logger, "user_create", duration_ms, user_id=user_id)


# ============================================================================
# HELPER FUNCTIONS REFERENCE
# ============================================================================

from api.utils.logging_config import get_logger  # Get a logger instance
from api.utils.logging_config import get_operation_duration  # Get elapsed time in ms
from api.utils.logging_config import log_action  # Log action start/status
from api.utils.logging_config import (
    log_action_timing,  # Log action completion with duration
)
from api.utils.logging_config import log_entry  # Log with structured context
from api.utils.logging_config import log_error_action  # Log action failure with error
from api.utils.logging_config import start_operation_timer  # Start timing an operation

# ============================================================================
# COMMON USAGE PATTERNS
# ============================================================================

logger = get_logger(__name__)

# Pattern 1: Simple log entry
log_entry(logger, "Database connected", host="localhost:5432")

# Pattern 2: Action with timing
start_operation_timer()
# ... do work ...
log_action_timing(logger, "fetch_user", get_operation_duration(), user_id="123")

# Pattern 3: Error logging
try:
    pass
except Exception as e:
    log_error_action(logger, "create_ride", str(e), car_id="456")

# Pattern 4: Action status
log_action(logger, "sync_data", status="started", total_items=100)
# ... work ...
log_action(logger, "sync_data", status="completed", processed=100, failed=0)


# ============================================================================
# WHAT YOU'LL SEE IN DEVELOPMENT MODE
# ============================================================================

# Colors + Request ID + Structured context
# 12:34:56 INFO [a8f2c3b1] User created [action=user_create status=completed
# duration_ms=145.23]
#
# Fields:
# - 12:34:56: Timestamp (dim)
# - INFO: Level (green for INFO, red for ERROR, yellow for WARNING)
# - [a8f2c3b1]: Request ID (auto-generated per request)
# - Message: Human readable
# - [action=... status=...]: Structured context (cyan keys)

# ============================================================================
# IN PRODUCTION MODE
# ============================================================================

# JSON output for log aggregation systems (ELK, Datadog, etc.)
# {
#   "level": "INFO",
#   "logger": "api.routers.auth",
#   "message": "User created",
#   "timestamp": "2024-04-14 12:34:56,789",
#   "module": "auth",
#   "function": "oauth_callback",
#   "line": 150,
#   "request_id": "a8f2c3b1",
#   "action": "user_create",
#   "status": "completed",
#   "duration_ms": 145.23
# }
