from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.deps import get_current_user
from api.models import User

router = APIRouter()


# === Vytvoření nové jízdy ===
@router.post("/")
def create_ride(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new ride.
    
    TODO: Implement ride creation logic:
    - Validate user owns the car
    - Validate user is active driver for the car
    - Create ride record
    - Return RideOut
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


# === Detail jízdy ===
@router.get("/{ride_id}")
def get_ride(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get ride details.
    
    TODO: Implement ride retrieval:
    - Get ride with passengers, car info
    - Check user has access (owner, driver, or passenger)
    - Return RideOut with full details
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


# === Úprava jízdy ===
@router.patch("/{ride_id}")
def update_ride(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update ride information (departure time, destination).
    
    TODO: Implement ride update:
    - Validate user is owner or driver
    - Update ride fields
    - Return updated RideOut
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


# === Zrušení jízdy ===
@router.delete("/{ride_id}", status_code=204)
def cancel_ride(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a ride.
    
    TODO: Implement ride cancellation:
    - Validate user is owner or driver
    - Delete ride (cascade will remove passengers)
    - Return 204 No Content
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


# === Rezervace místa v jízdě ===
@router.post("/{ride_id}/book")
def book_seat(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Book a seat in a ride (become a passenger).
    
    TODO: Implement seat booking:
    - Validate ride exists and has available seats
    - Validate user has been invited to the car
    - Create passenger record
    - Return PassengerOut
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


# === Zrušení rezervace ===
@router.delete("/{ride_id}/book", status_code=204)
def cancel_booking(
    ride_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel seat booking (remove yourself as passenger).
    
    TODO: Implement booking cancellation:
    - Find and delete passenger record for current user
    - Return 204 No Content
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


# === Seznam všech jízd pro auto ===
@router.get("/car/{car_id}")
def list_car_rides(
    car_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all rides for a specific car.
    
    TODO: Implement car rides listing:
    - Validate user has access to car (owner or invited)
    - Get all rides for the car
    - Return list[RideOut]
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")
