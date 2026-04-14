import uuid
from collections.abc import Awaitable, Callable

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import Response

from api.config import settings
from api.routers import auth, cars, health, invitations, rides
from api.utils.limiter import limiter
from api.utils.logging_config import (
    get_logger,
    get_operation_duration,
    get_request_context,
    set_request_context,
    setup_logging,
    start_operation_timer,
)

load_dotenv()

# Initialize structured logging
setup_logging()
logger = get_logger(__name__)

app = FastAPI(
    title="Sitzy API",
    docs_url=None if settings.environment == "production" else "/docs",
    redoc_url=None if settings.environment == "production" else "/redoc",
    openapi_url=None if settings.environment == "production" else "/openapi.json",
)
app.state.limiter = limiter


@app.middleware("http")
async def logging_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Middleware to log requests and responses with correlation IDs."""
    # Generate or extract request ID
    request_id = str(uuid.uuid4())[:8]
    set_request_context(request_id)
    start_operation_timer()

    # Extract key request details
    method = request.method
    path = request.url.path
    client = request.client.host if request.client else "unknown"

    # Log request
    logger.info(
        f"{method} {path}",
        extra={
            "request_id": request_id,
            "method": method,
            "path": path,
            "client": client,
            "event": "request_start",
        },
    )

    try:
        response = await call_next(request)
        duration_ms = get_operation_duration()

        # Log response
        logger.info(
            f"{method} {path} {response.status_code}",
            extra={
                "request_id": request_id,
                "method": method,
                "path": path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "event": "request_complete",
            },
        )

        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as exc:
        duration_ms = get_operation_duration()
        logger.error(
            f"{method} {path} - Exception: {str(exc)}",
            extra={
                "request_id": request_id,
                "method": method,
                "path": path,
                "error": str(exc),
                "duration_ms": duration_ms,
                "event": "request_error",
            },
        )
        raise


app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,  # type: ignore
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    error_messages = [f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()]
    request_id = get_request_context()
    logger.warning(
        f"Validation error on {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "event": "validation_error",
            "errors": error_messages,
        },
    )
    return JSONResponse(
        status_code=422,
        content={"detail": "; ".join(error_messages)},
    )


app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(cars.router, prefix="/cars", tags=["cars"])
app.include_router(rides.router, prefix="/rides", tags=["rides"])
app.include_router(invitations.router, prefix="/invitations", tags=["invitations"])

logger.info("Sitzy API initialized", extra={"environment": settings.environment})
