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


class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

    def get_label(self, lang: str = "cs") -> str:
        labels = {
            "cs": {
                InvitationStatus.PENDING: "Čeká na přijetí",
                InvitationStatus.ACCEPTED: "Přijato",
                InvitationStatus.REJECTED: "Odmítnuto",
            },
            "en": {
                InvitationStatus.PENDING: "Pending",
                InvitationStatus.ACCEPTED: "Accepted",
                InvitationStatus.REJECTED: "Rejected",
            },
        }
        return labels.get(lang, {}).get(self, self.value)
