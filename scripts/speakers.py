#!/usr/bin/env python3
"""
The speaker portraits, normalised to one shape.

    python3 scripts/speakers.py

Sources: scripts/assets/speakers/*.jpg — the client's four cards, cropped out of the
announcement artwork with the orange/navy diagonal already set behind each person. The
background is THEIRS and is not regenerated here; this script only makes four images that
were cut by hand at four different sizes into four images a grid can line up.

WHY A SCRIPT AND NOT object-cover.

    object-cover would do the crop in the browser, and it would look right. What it would
    not do is make the four PEOPLE line up: each source is framed differently, so letting
    CSS trim the edges leaves one head high, one low, one larger than the rest, and a row
    of cards that reads as four screenshots rather than one lineup. The trim is decided
    here, per portrait, where it can be looked at.

    It also matters that the crop is baked in. These images carry a designed background —
    a diagonal that meets the frame edge at a particular angle. Cropping it to an unknown
    aspect ratio at render time moves where that diagonal lands, and four diagonals that
    nearly agree look worse than four that do not agree at all.

WHAT IT DOES

    1. Crops to exactly 3:4, taking the trim off whichever axis is long. The horizontal
       anchor is the centre; the vertical anchor is TOP, because every one of these is a
       head-and-shoulders portrait — the face is in the upper half and the surplus is
       always chest and background at the bottom.
    2. Resizes to 600x800. The card is ~310px wide at the widest breakpoint, so 600 is a
       2x retina source and anything more is bytes nobody sees.
    3. Quality 86 — a touch above the 82 used for plain photographs, because the flat
       orange gradient behind each head bands visibly before a photograph would.

Filenames carry -v1. public/ is cached hard by Apache, and the lineup is the part of this
page most likely to be replaced — a better photo, a different crop, a speaker who drops
out. Reusing a name leaves returning visitors on the old face. Bump to -v2 and change the
path in src/content/home.ts; never edit a published file in place.
"""

import os

from PIL import Image

SRC = 'scripts/assets/speakers/{slug}.jpg'
OUT = 'public/speakers/{slug}-v1.jpg'

# The slug is the filename on both sides, and what src/content/home.ts points at.
SLUGS = ('kumaravel', 'harish', 'archana', 'sathish')

RATIO = 3 / 4          # width / height — the card's aspect ratio, set in Speakers.tsx
WIDTH, HEIGHT = 600, 800
QUALITY = 86


def to_ratio(im: Image.Image) -> Image.Image:
    """Crop to RATIO. Centre horizontally, anchored to the TOP vertically — see above."""
    if im.width / im.height > RATIO:
        w = round(im.height * RATIO)                 # too wide: trim both sides evenly
        left = (im.width - w) // 2
        return im.crop((left, 0, left + w, im.height))
    h = round(im.width / RATIO)                      # too tall: trim the bottom only
    return im.crop((0, 0, im.width, h))


def main() -> None:
    for slug in SLUGS:
        src = Image.open(SRC.format(slug=slug)).convert('RGB')
        cropped = to_ratio(src)
        out = cropped.resize((WIDTH, HEIGHT), Image.LANCZOS)
        path = OUT.format(slug=slug)
        out.save(path, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        print(
            f'{slug:<12} {src.size[0]}x{src.size[1]} -> crop {cropped.size[0]}x{cropped.size[1]}'
            f' -> {path}  {os.path.getsize(path) // 1024}KB'
        )


if __name__ == '__main__':
    main()
