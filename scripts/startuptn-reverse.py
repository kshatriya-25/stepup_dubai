#!/usr/bin/env python3
"""
StartupTN on a DARK ground — the version the home banner uses.

Run from the repo root:  python3 scripts/startuptn-reverse.py   (needs Pillow)

startuptn-v1.png (scripts/startuptn-transparent.py) is for the white Partner cards. It is
dark navy type, which disappears on the hero panel's #072B5F, so the banner needs its own
asset — the same situation, and the same answer, as startupsingam-reverse-v1.png.

THE ARTWORK IS TWO DIFFERENT THINGS AND IS TREATED AS TWO.

  The Tamil Nadu seal — green ring, gold temple, the Lion Capital, a tricolour band, the
  Ashoka Chakra, and the motto TRUTH ALONE TRIUMPHS arcing around the bottom OUTSIDE the
  ring. A government seal is not recoloured, so it is left exactly as supplied and set on a
  WHITE MEDALLION: the smallest circle that encloses the ring and the motto together.

    Why a medallion and not simply "keep the seal opaque": the motto sits on the page
    background in the original, not inside the ring. Knock out that background and the
    motto's dark green letters land on navy and vanish; keep only the ring opaque and the
    motto straddles the edge, half on white and half on nothing. The medallion gives the
    whole seal one continuous ground, which is also how it is normally shown on dark media.

    Found by GEOMETRY, not colour: the Ashoka Chakra is navy, and a "navy -> white" pass
    over the whole file would erase it into the white behind it.

  The StartupTN wordmark — navy type knocked out to white, gold rocket flames left gold.

    Background here is removed by a COVERAGE KEY, not the flood fill the light version
    uses. The flood exists to protect enclosed white that belongs to the artwork, and the
    only such white is inside the seal, which the medallion now handles geometrically.
    Outside it there is no light ink at all, so every light pixel is background — including
    the ones a flood cannot reach: the counters of the "a" and "p", and the rocket cutout,
    which the gold flames seal off from the outside. The first version flooded, missed the
    rocket, and left it as an opaque grey blob.

WHY SOLID INK IS SNAPPED TO FULL ALPHA. The brand navy is (36, 59, 127): its darkest
channel is 36, so against the #F7F7F7 ground its coverage only ever reads 0.85. Left
alone, the letters come out at alpha 218 — invisible on white, where un-compositing
restores the exact navy, but once they are knocked out to white, white at 85% over navy is
GREY. Anything at or above SOLID is interior and goes to 255; the antialiased ramp below
it is rescaled so edges stay smooth.

REPLACE, DO NOT EDIT IN PLACE. /logos/ is cached hard; a new version needs a new -vN name.
"""

import math
from PIL import Image

SRC = 'scripts/assets/startuptn-source.png'
OUT = 'public/logos/startuptn-reverse-v1.png'

BG = 247.0          # the supplied ground is #F7F7F7, not white
FLOOR = 0.03        # coverage below this is background noise from a lossy round trip
SOLID = 0.75        # coverage at or above this is ink interior — alpha 255, see below
PAD = 28            # room for the medallion, which is wider than the ring it encloses
MARGIN = 4          # white showing past the outermost ink of the seal, source pixels
WIDTH = 900         # house width for a partner wordmark


def main() -> None:
    im = Image.open(SRC).convert('RGB')
    im = im.crop(im.point(lambda v: 255 if v < 230 else 0).convert('L').getbbox())
    padded = Image.new('RGB', (im.width + 2 * PAD, im.height + 2 * PAD), (247, 247, 247))
    padded.paste(im, (PAD, PAD))
    im = padded
    w, h = im.size
    px = im.load()

    def is_ink(x: int, y: int) -> bool:
        return min(px[x, y]) < 200

    # ---- the seal ------------------------------------------------------------------
    # The first block of ink from the left; the gap after it separates it from the "S".
    ink_col = [any(is_ink(x, y) for y in range(h)) for x in range(w)]
    left = next(x for x in range(w) if ink_col[x])
    right = next(x for x in range(left, w) if not ink_col[x]) - 1

    # THE SMALLEST CIRCLE THAT HOLDS THE WHOLE SEAL. The motto arcs around the bottom at a
    # larger radius than the ring, so a circle centred on the ring has to grow to reach it
    # and ends up with a fat white margin on three sides — the first version did that, and
    # crowded the "S". Instead: take the seal's outline (the farthest ink along each of 360
    # rays from its bounding-box centre) and search nearby centres for the one whose
    # farthest outline point is nearest.
    seal_ink = [(x, y) for y in range(h) for x in range(left, right + 1) if is_ink(x, y)]
    bx = (min(p[0] for p in seal_ink) + max(p[0] for p in seal_ink)) / 2
    by = (min(p[1] for p in seal_ink) + max(p[1] for p in seal_ink)) / 2
    rays: dict = {}
    for x, y in seal_ink:
        k = round(math.degrees(math.atan2(y - by, x - bx))) % 360
        d = math.hypot(x - bx, y - by)
        if d > rays.get(k, (0.0,))[0]:
            rays[k] = (d, x, y)
    outline = [(x, y) for _, x, y in rays.values()]
    best = None
    for dy in range(-16, 17):
        for dx in range(-16, 17):
            ccx, ccy = bx + dx, by + dy
            r = max(math.hypot(x - ccx, y - ccy) for x, y in outline)
            if best is None or r < best[0]:
                best = (r, ccx, ccy)
    radius, cx, cy = best
    radius += MARGIN

    def seal_cov(x: int, y: int) -> float:
        """How much of this pixel the medallion covers — antialiased at its rim."""
        return max(0.0, min(1.0, radius + 0.5 - math.hypot(x - cx, y - cy)))

    cov = [[max(0.0, min(1.0, 1.0 - min(px[x, y]) / BG)) for x in range(w)] for y in range(h)]

    # ---- compose ---------------------------------------------------------------------
    out = Image.new('RGBA', (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            s = seal_cov(x, y)
            if s > 0:
                # The seal, untouched, on a white ground — the #F7F7F7 inside the
                # medallion lifted to white so the disc reads as one clean colour.
                if min(r, g, b) >= 225:
                    r, g, b = 255, 255, 255
                op[x, y] = (r, g, b, round(s * 255))
                continue
            c = cov[y][x]
            if c <= FLOOR:
                op[x, y] = (0, 0, 0, 0)
                continue
            r = min(255, max(0, round((r - BG * (1 - c)) / c)))
            g = min(255, max(0, round((g - BG * (1 - c)) / c)))
            b = min(255, max(0, round((b - BG * (1 - c)) / c)))
            alpha = 255 if c >= SOLID else round((c - FLOOR) / (SOLID - FLOOR) * 255)
            # Knockout: the navy wordmark goes white; the gold flames stay gold.
            if b > r + 25 and b > g:
                r, g, b = 255, 255, 255
            op[x, y] = (r, g, b, alpha)

    # Trim to the artwork. PAD exists so the medallion is not clipped while it is drawn;
    # left in the file it is dead transparent margin, and dead margin makes a logo render
    # SMALLER than the box it is given — the opposite of what the banner needs.
    out = out.crop(out.getchannel('A').getbbox())
    w, h = out.size
    out = out.resize((WIDTH, round(WIDTH * h / w)), Image.LANCZOS)
    out.save(OUT, optimize=True)
    print(f'wrote {OUT} at {out.size}  (medallion r={radius:.0f}px at {cx:.0f},{cy:.0f}; seal spans x {left}-{right})')


if __name__ == '__main__':
    main()
