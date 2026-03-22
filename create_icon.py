from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageColor, ImageDraw

ICON_SIZES = (16, 32, 48, 64, 128, 256)
CANVAS_SIZE = 1024
ACCENT_TOP = "#FF5A73"
ACCENT_BOTTOM = "#E94560"
BLACK = "#000000"
WHITE = "#F5F5F5"


def _accent_gradient(size: int) -> Image.Image:
    top = ImageColor.getrgb(ACCENT_TOP)
    bottom = ImageColor.getrgb(ACCENT_BOTTOM)
    gradient = Image.new("RGBA", (1, size))
    pixels = []
    for y in range(size):
        factor = y / max(size - 1, 1)
        pixels.append(
            (
                int(top[0] + (bottom[0] - top[0]) * factor),
                int(top[1] + (bottom[1] - top[1]) * factor),
                int(top[2] + (bottom[2] - top[2]) * factor),
                255,
            )
        )
    gradient.putdata(pixels)
    return gradient.resize((size, size))


def _draw_icon(size: int = CANVAS_SIZE) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    margin = int(size * 0.03)
    radius = int(size * 0.20)
    draw.rounded_rectangle(
        (margin, margin, size - margin, size - margin),
        radius=radius,
        fill=BLACK,
    )

    d_mask = Image.new("L", (size, size), 0)
    d_draw = ImageDraw.Draw(d_mask)

    left = int(size * 0.22)
    top = int(size * 0.20)
    right = int(size * 0.79)
    bottom = int(size * 0.83)
    stem_width = int(size * 0.13)

    d_draw.rectangle((left, top, left + stem_width, bottom), fill=255)
    d_draw.pieslice((left, top, right, bottom), start=270, end=90, fill=255)

    inner_left = left + int(size * 0.13)
    inner_top = top + int(size * 0.12)
    inner_right = right - int(size * 0.14)
    inner_bottom = bottom - int(size * 0.12)
    inner_stem_width = int(size * 0.08)

    d_draw.rectangle(
        (inner_left, inner_top, inner_left + inner_stem_width, inner_bottom),
        fill=0,
    )
    d_draw.pieslice(
        (inner_left, inner_top, inner_right, inner_bottom),
        start=270,
        end=90,
        fill=0,
    )

    gradient = _accent_gradient(size)
    accent = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    accent.paste(gradient, mask=d_mask)
    image.alpha_composite(accent)

    arrow = ImageDraw.Draw(image)
    stroke = int(size * 0.03)
    points = [
        (int(size * 0.39), int(size * 0.54)),
        (int(size * 0.48), int(size * 0.45)),
        (int(size * 0.53), int(size * 0.50)),
        (int(size * 0.67), int(size * 0.35)),
    ]
    arrow.line(points, fill=WHITE, width=stroke, joint="curve")

    arrow_size = int(size * 0.055)
    arrow.polygon(
        [
            points[-1],
            (points[-1][0] - arrow_size, points[-1][1] - int(arrow_size * 0.25)),
            (points[-1][0] - int(arrow_size * 0.25), points[-1][1] + arrow_size),
        ],
        fill=WHITE,
    )

    dot_radius = int(size * 0.022)
    for dot in points[1:3]:
        arrow.ellipse(
            (
                dot[0] - dot_radius,
                dot[1] - dot_radius,
                dot[0] + dot_radius,
                dot[1] + dot_radius,
            ),
            fill=WHITE,
        )

    return image


def main() -> Path:
    output_dir = Path("assets") / "icons"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "devflow.ico"

    icon = _draw_icon()
    icon.save(output_path, sizes=[(size, size) for size in ICON_SIZES])
    return output_path


if __name__ == "__main__":
    path = main()
    print(f"Icone criado em: {path}")
