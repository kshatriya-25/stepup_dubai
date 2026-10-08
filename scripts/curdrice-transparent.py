#!/usr/bin/env python3
"""
Turn the supplied Curd Rice artwork into a transparent partner logo.

Run from the repo root:  python3 scripts/curdrice-transparent.py   (needs Pillow)

WHY THIS EXISTS. The file the client sent is RGB with no alpha on a white ground. Every
logo in the Partners grid sits on a white card, so shipping it as supplied would *look*
right and be wrong in two ways: the card has rounded corners and a hairline border, so a
square of near-white (254,254,254) sits visibly proud of the 255 card at the corners, and
the asset would be unusable anywhere else forever.

WHY THIS ONE IS A COLOUR KEY AND StartupTN IS A FLOOD FILL.
Read scripts/startuptn-transparent.py first: there, "make every light pixel transparent"
punches out the white disc behind the Tamil Nadu temple, so background had to be decided by
CONNECTIVITY instead. Here the answer is the opposite, and it was measured rather than
assumed:

  - Inside the square mark there is NOT ONE near-white pixel. The lightest min-channel
    anywhere in it is 127 — the sage green. Between that and the 240+ of the ground there
    is nothing at all, so no threshold in that gap can damage the mark.
  - The wordmark's counters — the bowl of the 'd', the apertures of 'c' and 'e' — ARE
    white, and they are HOLES. A flood fill cannot reach them (the letter strokes enclose
    them) and would ship them as opaque white blobs, which is exactly the artefact the
    flood exists to prevent on the other logo.

So: colour key. The two scripts disagree because the two pieces of artwork disagree, and
either rule applied to the other file produces a visible defect.

WHY THE EDGES ARE FITTED TO THE BRAND COLOURS RATHER THAN UN-COMPOSITED BY LUMINANCE.
The obvious key is `alpha = 1 - min(channel)/BG`, which is what the other scripts here use.
On this logo it quietly ruins the yellow: #FFC728's darkest channel is 40, so that formula
reads its coverage as 0.84 and ships the solid fill of the mark at alpha 215. Composited on
a white card it is indistinguishable — which is how it would survive review — and anywhere
else it is a washed-out logo, which is a thing to find out about an asset years later.

This instead treats every pixel as what it is: a blend of ONE flat brand colour with the
white ground. For each candidate colour it solves for the alpha that best explains the
pixel (a projection onto the line from white to that colour) and keeps the best fit. Solid
areas come out as the exact brand colour at alpha 255, and antialiased edges come out at
their true coverage whatever colour they are blending toward.

Pixels that fit NO brand colour are the diagonal seams inside the square, where two brand
colours meet each other rather than the ground. They are interior and fully opaque, so they
keep their own colour untouched — forcing them onto the nearest flat colour would redraw the
seam as a hard 1px step.

WHITE CARDS ONLY. The wordmark is near-black and would disappear on the navy hero banner.
If Curd Rice is ever credited there it needs its own reverse asset, the way Startup Singam
and StartupTN each needed one — not a tweak to this file.

REPLACE, DO NOT EDIT IN PLACE. /logos/ is cached hard, so a new version of an asset needs a
new -vN filename or browsers holding the old one never re-request it.
"""

from PIL import Image

SRC = 'scripts/assets/curdrice-source.png'
OUT = 'public/logos/curdrice-v1.png'

# The supplied ground is 254,254,254 with ±1 of noise — NOT pure white, and the difference
# matters: un-composite against 255 and every edge pixel comes out fractionally too dark.
BG = 254.0

# The flat palette, sampled from the file. Order is irrelevant; the best fit wins.
#   teal   the upper-left triangle of the mark
#   yellow the right-hand triangle
#   sage   the lower-left triangle
#   ink    the "curd rice" wordmark
BRAND = {
    'teal': (2, 87, 89),
    'yellow': (255, 199, 40),
    'sage': (117, 161, 111),
    'ink': (7, 7, 7),
}

FLOOR = 8      # within this of BG on every channel: background. Generous — the ground is noisy.
TOL = 26       # how far a pixel may sit off the white->colour line and still be called a blend
WIDTH = 900    # house size for a partner wordmark (nammaoffice-v3.png is 900px)


def fit(pixel: tuple[int, int, int]) -> tuple[tuple[int, int, int], float] | None:
    """
    The brand colour this pixel is a blend of, and how much of it there is.

    Projects (BG - pixel) onto (BG - colour): the length of that projection IS the alpha,
    because a composite over the ground moves away from it along exactly that line. Returns
    None when nothing fits, which means the pixel is not a blend with the ground at all.
    """
    best = None
    for colour in BRAND.values():
        dv = [BG - c for c in colour]
        denom = sum(d * d for d in dv)
        if denom == 0:
            continue
        alpha = sum((BG - p) * d for p, d in zip(pixel, dv)) / denom
        alpha = max(0.0, min(1.0, alpha))
        # How far the pixel actually is from what that alpha would have produced.
        residual = max(abs(p - (alpha * c + (1 - alpha) * BG)) for p, c in zip(pixel, colour))
        if best is None or residual < best[0]:
            best = (residual, colour, alpha)
    if best is None or best[0] > TOL:
        return None
    return best[1], best[2]


def main() -> None:
    im = Image.open(SRC).convert('RGB')
    # Crop to the artwork. The supplied file is a 1254px square with the logo floating in
    # the middle of it, and dead margin makes a logo render SMALLER than the box it is
    # given — the card centres on the file's edges, not on the ink.
    box = im.point(lambda v: 255 if v < 235 else 0).convert('L').getbbox()
    im = im.crop(box)
    w, h = im.size
    px = im.load()

    out = Image.new('RGBA', (w, h))
    op = out.load()
    seams = 0
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if all(abs(c - BG) <= FLOOR for c in p):
                op[x, y] = (0, 0, 0, 0)
                continue
            hit = fit(p)
            if hit is None:
                # A seam between two brand colours. Interior, opaque, left exactly as drawn.
                op[x, y] = (*p, 255)
                seams += 1
                continue
            colour, alpha = hit
            op[x, y] = (*colour, round(alpha * 255))

    out = out.resize((WIDTH, round(WIDTH * h / w)), Image.LANCZOS)
    out.save(OUT, optimize=True)
    print(f'wrote {OUT} at {out.size}  (cropped from {box}, {seams} seam px kept as drawn)')


if __name__ == '__main__':
    main()
