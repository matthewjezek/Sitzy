from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

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

# Import routerů
# from api.routers import auth, car, seat, invitation

# app.include_router(auth.router, prefix="/auth", tags=["auth"])
# app.include_router(car.router, prefix="/cars", tags=["cars"])
# app.include_router(seat.router, prefix="/seats", tags=["seats"])
# app.include_router(invitation.router, prefix="/invitations", tags=["invitations"])
