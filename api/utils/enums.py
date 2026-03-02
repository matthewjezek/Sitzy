from enum import Enum


class CarLayout(str, Enum):
    SEDAQ = "Sedan"
    TRAPAQ = "Coupe"
    PRAQ = "Minivan"


class InvitationStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
