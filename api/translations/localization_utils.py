from api.utils.enums import CarLayout


def get_position_label(position: int, layout: CarLayout, lang: str = "cs") -> str:
    labels = {
        CarLayout.SEDAQ: {
            1: "Front left",
            2: "Front right",
            3: "Rear left",
            4: "Rear right",
        },
        CarLayout.TRAPAQ: {
            1: "Front left",
            2: "Front right",
        },
        CarLayout.PRAQ: {
            1: "Driver",
            2: "Passenger",
            3: "Rear left",
            4: "Rear center",
            5: "Rear right",
            6: "Third row left",
            7: "Third row right",
        },
    }
    return labels.get(layout, {}).get(position, f"Seat {position}")
