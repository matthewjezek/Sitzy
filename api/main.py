import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Načtení proměnných z .env
load_dotenv()

app = FastAPI(title="Sitzy API")

# CORS konfigurace
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
    # Můžeš si výstup upravit dle libosti, třeba jen první chybu nebo vše jako string
    error_messages = [f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={
            "detail": "; ".join(error_messages)
        },  # nebo {"detail": error_messages} pro pole
    )


# Import routerů
from api.routers import auth, cars, invitations, seats  # noqa: E402

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(cars.router, prefix="/cars", tags=["cars"])
app.include_router(seats.router, prefix="/seats", tags=["seats"])
app.include_router(invitations.router, prefix="/invitations", tags=["invitations"])
