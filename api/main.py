import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from api.routers import auth, cars, invitations, rides
from api.utils.limiter import limiter

load_dotenv()

app = FastAPI(title="Sitzy API")
app.state.limiter = limiter

app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler) # type: ignore[arg-type]

# CORS configuration
origins = [
    os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    error_messages = [f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={"detail": "; ".join(error_messages)},
    )


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(cars.router, prefix="/cars", tags=["cars"])
app.include_router(rides.router, prefix="/rides", tags=["rides"])
app.include_router(invitations.router, prefix="/invitations", tags=["invitations"])
