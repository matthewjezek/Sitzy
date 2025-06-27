from enum import Enum


class CarLayout(str, Enum):
    SEDAQ = "Sedan (4 seats)"
    TRAPAQ = "Coupé (2 seats)"
    PRAQ = "Minivan (7 seats)"

class InvitationStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"