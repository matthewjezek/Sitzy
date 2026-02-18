from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from api.database import get_db
from api.deps import get_current_user
from api.models import Passenger, Ride, User
from api.schemas import RideOut

router = APIRouter()



