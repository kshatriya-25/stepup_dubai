#!/usr/bin/env python3
"""
Turn the supplied StartupTN artwork into a transparent partner logo.

Run from the repo root:  python3 scripts/startuptn-transparent.py   (needs Pillow)

WHY THIS EXISTS. The file the client sent is RGB with no alpha and, unlike the other
partner marks, its ground is #F7F7F7 rather than white — a 3% grey. The Partners grid
sits every logo on a pure-white card, so shipping it as supplied would have put a faintly
visible grey rectangle behind this one logo and nothing behind the others.

WHY IT IS NOT A COLOUR KEY. The Tamil Nadu emblem has a WHITE DISC behind the temple, and
"make every light pixel transparent" punches that straight out. Background here is a
question of CONNECTIVITY, not colour: the flood starts at the border and can only travel
through pixels that are not solid ink, so anything the flood cannot reach is enclosed by
the artwork.

The flood does still reach the emblem disc, through the antialiasing on the green ring —
and that is fine, because the disc's job is to be the same colour as the card behind it
and the card is white. If this logo ever has to sit on a non-white ground it needs a new
asset, not a tweak to this one: it is dark navy type and would be illegible there anyway.

REPLACE, DO NOT EDIT IN PLACE. /logos/ is cached hard by the deploy (see deploy/), so a
new version of an asset needs a new -vN filename or browsers holding the old one will
never re-request it.
"""

from collections import deque

from PIL import Image

SRC = 'scripts/assets/startuptn-source.png'
OUT = 'public/logos/startuptn-v1.png'

BG = 247.0      # the supplied ground, #F7F7F7 — NOT 255, or the un-compositing is wrong
SOLID = 0.98    # coverage at which the flood treats a pixel as ink and stops
WIDTH = 900     # house size for a partner wordmark (nammaoffice-v3.png is 900px)


def main() -> None:
    im = Image.open(SRC).convert('RGB')
    # Crop to the artwork so it renders at the same optical size as the marks beside it;
    # the supplied file carries ~17px of dead margin on every side.
    box = im.point(lambda v: 255 if v < 230 else 0).convert('L').getbbox()
    im = im.crop(box)
    w, h = im.size
    px = im.load()

    # Coverage, un-composited from the grey ground.
    a = [[max(0.0, min(1.0, 1.0 - min(px[x, y]) / BG)) for x in range(w)] for y in range(h)]

    bg = [[False] * w for _ in range(h)]
    q: deque = deque()

    def seed(x: int, y: int) -> None:
        if a[y][x] < SOLID and not bg[y][x]:
            bg[y][x] = True
            q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx] and a[ny][nx] < SOLID:
                bg[ny][nx] = True
                q.append((nx, ny))

    out = Image.new('RGBA', (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if not bg[y][x]:
                op[x, y] = (r, g, b, 255)
                continue
            cov = a[y][x]
            if cov < 0.02:
                op[x, y] = (0, 0, 0, 0)
                continue
            op[x, y] = (
                min(255, max(0, round((r - BG * (1 - cov)) / cov))),
                min(255, max(0, round((g - BG * (1 - cov)) / cov))),
                min(255, max(0, round((b - BG * (1 - cov)) / cov))),
                round(cov * 255),
            )

    out = out.resize((WIDTH, round(WIDTH * h / w)), Image.LANCZOS)
    out.save(OUT, optimize=True)
    print(f'wrote {OUT} at {out.size}')


if __name__ == '__main__':
    main()
