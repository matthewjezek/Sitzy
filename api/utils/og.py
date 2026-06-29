import io
import os
from datetime import datetime

from PIL import Image, ImageDraw, ImageFont

# Define coordinates for seats (percentage coordinates matching frontend SeatRenderer)
SEAT_PERCENTAGES = {
    "Sedan": {
        1: {"top": 47, "left": 34},  # Driver
        2: {"top": 47, "left": 64},
        3: {"top": 70, "left": 34},
        4: {"top": 70, "left": 64},
    },
    "Coupe": {
        1: {"top": 57, "left": 33},  # Driver
        2: {"top": 57, "left": 67},
    },
    "Minivan": {
        1: {"top": 44, "left": 35},  # Driver
        2: {"top": 44, "left": 65},
        3: {"top": 64, "left": 25},
        4: {"top": 64, "left": 50},
        5: {"top": 64, "left": 75},
        6: {"top": 84, "left": 35},
        7: {"top": 84, "left": 65},
    },
}

# Resolve system fonts with robust fallback list
FONT_OPTIONS = [
    "segoeui.ttf",  # Windows Segoe UI
    "arial.ttf",  # Windows/macOS Arial
    "Helvetica.ttf",  # macOS Helvetica
    "DejaVuSans.ttf",  # Linux DejaVu Sans
    "LiberationSans-Regular.ttf",  # Linux Liberation Sans
]


def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load a system TrueType font or fall back to PIL default."""
    for font_name in FONT_OPTIONS:
        try:
            return ImageFont.truetype(font_name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def format_czech_datetime(dt: datetime) -> str:
    """Format datetime to Czech layout: 'Čtvrtek 2. 7. v 17:30'."""
    days = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]
    day_name = days[dt.weekday()]
    return f"{day_name} {dt.day}. {dt.month}. v {dt.hour}:{dt.minute:02d}"


def get_colored_seat(seat_src: Image.Image, color_hex: str) -> Image.Image:
    """Tint the gray seat icon with color_hex while preserving details."""
    color_hex = color_hex.lstrip('#')
    tgt_r, tgt_g, tgt_b = tuple(int(color_hex[i : i + 2], 16) for i in (0, 2, 4))

    r, g, b, a = seat_src.split()
    r_tinted = r.point(lambda p: int(p * tgt_r / 255.0))
    g_tinted = g.point(lambda p: int(p * tgt_g / 255.0))
    b_tinted = b.point(lambda p: int(p * tgt_b / 255.0))

    return Image.merge("RGBA", (r_tinted, g_tinted, b_tinted, a))


def get_fitting_font_and_text(
    text: str, max_width: int, initial_size: int, min_size: int = 24
) -> tuple[ImageFont.FreeTypeFont | ImageFont.ImageFont, str]:
    """Dynamically scales down the font size or truncates text with ellipsis
    to fit max_width."""
    size = initial_size
    while size >= min_size:
        font = _load_font(size)
        if hasattr(font, "getlength"):
            length = font.getlength(text)
        else:
            length = len(text) * (size * 0.6)

        if length <= max_width:
            return font, text
        size -= 2

    # Truncate with ellipsis if it still exceeds max_width at min_size
    font = _load_font(min_size)
    truncated_text = text
    while len(truncated_text) > 3:
        truncated_text = truncated_text[:-1]
        test_text = truncated_text + "..."
        if hasattr(font, "getlength"):
            length = font.getlength(test_text)
        else:
            length = len(test_text) * (min_size * 0.6)
        if length <= max_width:
            return font, test_text

    return font, text[:10] + "..."


def draw_ride_og_image(
    destination: str,
    departure_time: datetime,
    car_name: str,
    car_layout: str,  # "Sedan" | "Coupe" | "Minivan"
    occupied_seat_positions: list[int],
) -> bytes:
    """Generate a 1200 x 630 px Open Graph image showing ride details
    and car occupancy layout."""
    # 1. Initialize canvas (1200 x 630 px) with deep slate color
    width, height = 1200, 630
    canvas = Image.new("RGBA", (width, height), "#0f172a")
    draw = ImageDraw.Draw(canvas)

    # 2. Load fonts
    font_sub = _load_font(24)

    # 3. Draw Left Panel (Ride Details)
    # Load and render Sitzy logo if present
    assets_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_path = os.path.join(assets_dir, "assets", "sitzy_logo_full.png")
    if os.path.exists(logo_path):
        try:
            logo_img = Image.open(logo_path)
            logo_w, logo_h = logo_img.size
            new_logo_h = int(180 * (logo_h / logo_w))
            logo_resized = logo_img.resize((180, new_logo_h), Image.Resampling.LANCZOS)
            canvas.paste(
                logo_resized,
                (80, 70),
                logo_resized if logo_resized.mode == "RGBA" else None,
            )
        except Exception:
            # Silent fallback: logo won't be pasted, text brand name drawn instead
            font_title = _load_font(44)
            draw.text((80, 70), "SITZY", fill="#aa9bf7", font=font_title)
    else:
        font_title = _load_font(44)
        draw.text((80, 70), "SITZY", fill="#aa9bf7", font=font_title)

    # Destination name with dynamic font fitting to prevent overlap with car layout
    dest_text = f"Cesta do: {destination}"
    font_dest, final_dest_text = get_fitting_font_and_text(
        dest_text, max_width=560, initial_size=64, min_size=28
    )
    draw.text((80, 150), final_dest_text, fill="#ffffff", font=font_dest)

    # Meta details
    formatted_time = format_czech_datetime(departure_time)
    draw.text(
        (80, 290), f"Vyrážíme: {formatted_time}", fill="#94a3b8", font=_load_font(32)
    )

    # Vehicle details with dynamic font fitting
    layout_label_cs = "Kupé" if car_layout == "Coupe" else car_layout
    vehicle_text = f"Vozidlo: {car_name} ({layout_label_cs})"
    font_vehicle, final_vehicle_text = get_fitting_font_and_text(
        vehicle_text, max_width=560, initial_size=32, min_size=20
    )
    draw.text(
        (80, 350),
        final_vehicle_text,
        fill="#94a3b8",
        font=font_vehicle,
    )

    # Capacity summary badge (dynamically sized based on text length)
    # Driver is always implicitly occupied in seat 1, so occupied count includes seat 1
    total_seats_lookup = {"Coupe": 2, "Sedan": 4, "Minivan": 7}
    total_seats = total_seats_lookup.get(car_layout, 4)
    occupied_count = len(set(occupied_seat_positions) | {1})

    badge_text = f"Obsazeno: {occupied_count} ze {total_seats} míst"
    if hasattr(font_sub, "getlength"):
        text_width = font_sub.getlength(badge_text)
    else:
        text_width = len(badge_text) * (24 * 0.6)

    badge_right = 80 + 25 + int(text_width) + 25
    badge_right = min(badge_right, 640)  # Ensure it does not overflow left boundary
    badge_rect = [80, 430, badge_right, 485]

    draw.rounded_rectangle(
        badge_rect, radius=24, fill="#1e293b", outline="#7350f2", width=3
    )
    draw.text(
        (105, 442),
        badge_text,
        fill="#f8fafc",
        font=font_sub,
    )

    # 4. Draw Right Panel (Car Layout Visualization)
    # Resolve car layout file name
    car_filename = f"{car_layout.lower()}.png"
    car_path = os.path.join(assets_dir, "assets", car_filename)

    if os.path.exists(car_path):
        try:
            car_bg = Image.open(car_path).convert("RGBA")
            car_h = 480
            car_w = int(car_h * (car_bg.size[0] / car_bg.size[1]))
            car_bg = car_bg.resize((car_w, car_h), Image.Resampling.LANCZOS)

            car_left = 680 + (400 - car_w) // 2
            car_top = 75
            canvas.paste(car_bg, (car_left, car_top), car_bg)

            # Load Seat Image
            seat_path = os.path.join(assets_dir, "assets", "seat.png")
            if os.path.exists(seat_path):
                seat_src = Image.open(seat_path).convert("RGBA")
                seat_h = 105
                seat_w = int(seat_h * (seat_src.size[0] / seat_src.size[1]))
                seat_src = seat_src.resize((seat_w, seat_h), Image.Resampling.LANCZOS)

                # Tinted variants
                seat_occupied = get_colored_seat(seat_src, "#3b82f6")  # Blue (#3b82f6)
                seat_free = seat_src  # Gray (untinted)

                # Draw seats
                layout_pcts = SEAT_PERCENTAGES.get(
                    car_layout, SEAT_PERCENTAGES["Sedan"]
                )
                for pos, coords in layout_pcts.items():
                    seat_x = car_left + int((coords["left"] / 100) * car_w)
                    seat_y = car_top + int((coords["top"] / 100) * car_h)

                    paste_x = seat_x - seat_w // 2
                    paste_y = seat_y - seat_h // 2

                    # Position 1 (driver) is always occupied
                    is_occupied = (pos == 1) or (pos in occupied_seat_positions)

                    if is_occupied:
                        canvas.paste(seat_occupied, (paste_x, paste_y), seat_occupied)
                    else:
                        canvas.paste(seat_free, (paste_x, paste_y), seat_free)
        except Exception:
            pass  # If image processing errors out, serving background only

    # 5. Export to PNG byte stream
    img_byte_arr = io.BytesIO()
    canvas.save(img_byte_arr, format="PNG")
    return img_byte_arr.getvalue()
