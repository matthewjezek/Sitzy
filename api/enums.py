from enum import Enum


class CarLayout(str, Enum):
    SEDAQ = "sedaq"
    TRAPAQ = "trapaq"
    PRAQ = "praq"

    @property
    def label(self):
        match self:
            case CarLayout.SEDAQ:
                return "Sedan (4 místa)"
            case CarLayout.TRAPAQ:
                return "Kupé (2 místa)"
            case CarLayout.PRAQ:
                return "Minivan (7 míst)"
