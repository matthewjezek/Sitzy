from api.utils.enums import CarLayout


def get_layout_seat_positions(layout: CarLayout) -> list[int]:
    """Return all seat positions available for a given car layout."""
    if layout == CarLayout.TRAPAQ:
        return [1, 2]
    if layout == CarLayout.SEDAQ:
        return [1, 2, 3, 4]
    if layout == CarLayout.PRAQ:
        return [1, 2, 3, 4, 5, 6, 7]

    # Defensive fallback for unknown enum values.
    return [1, 2, 3, 4]
