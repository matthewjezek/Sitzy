from api.utils.enums import CarLayout

from .messages import MESSAGES


def get_message(key: str, lang: str = "cs") -> str:
    return MESSAGES.get(key, {}).get(lang, f"!!{key}!!")


def get_position_label(position: int, layout: CarLayout, lang: str = "cs") -> str:
    labels = {
        CarLayout.SEDAQ: {
            1: {"cs": "Přední levé", "en": "Front left"},
            2: {"cs": "Přední pravé", "en": "Front right"},
            3: {"cs": "Zadní levé", "en": "Rear left"},
            4: {"cs": "Zadní pravé", "en": "Rear right"},
        },
        CarLayout.TRAPAQ: {
            1: {"cs": "Přední levé", "en": "Front left"},
            2: {"cs": "Přední pravé", "en": "Front right"},
        },
        CarLayout.PRAQ: {
            1: {"cs": "Řidič", "en": "Driver"},
            2: {"cs": "Spolujezdec", "en": "Passenger"},
            3: {"cs": "Zadní levé", "en": "Rear left"},
            4: {"cs": "Zadní prostřední", "en": "Rear center"},
            5: {"cs": "Zadní pravé", "en": "Rear right"},
            6: {"cs": "Třetí řada levé", "en": "Third row left"},
            7: {"cs": "Třetí řada pravé", "en": "Third row right"},
        },
    }
    return labels.get(layout, {}).get(position, {}).get(lang, f"Místo {position}")
