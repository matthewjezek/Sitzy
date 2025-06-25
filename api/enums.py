from enum import Enum


class CarLayout(str, Enum):
    SEDAQ = "sedaq"
    TRAPAQ = "trapaq"
    PRAQ = "praq"

    def get_label(self, lang: str = "cs") -> str:
        labels = {
            "cs": {
                CarLayout.SEDAQ: "Sedan (4 místa)",
                CarLayout.TRAPAQ: "Kupé (2 místa)",
                CarLayout.PRAQ: "Minivan (7 míst)",
            },
            "en": {
                CarLayout.SEDAQ: "Sedan (4 seats)",
                CarLayout.TRAPAQ: "Coupé (2 seats)",
                CarLayout.PRAQ: "Minivan (7 seats)",
            },
        }
        return labels.get(lang, {}).get(self, self.value)


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
