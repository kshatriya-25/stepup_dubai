#!/usr/bin/env python3
"""
Derive the two usable Startup Singam assets from the file the partner supplied.

Run from the repo root:  python3 scripts/startupsingam-reverse.py   (needs Pillow)

WHY THIS EXISTS. public/logos/startupsingam.png is RGB with no alpha channel — the white
is baked into the pixels — and the wordmark is dark blue. On the site's navy (#072B5F)
that is a white box around unreadable type, which is why the header used to put it on a
deliberate white chip. The header and the hero now both sit on navy, so the mark needed a
reverse version instead.

It writes startupsingam-reverse-v1.png: white keyed out AND the blue wordmark knocked out
to white. The Tamil red is left alone — it reads on navy as it is.

There is deliberately no light-ground variant. Every light placement (the Partners grid,
the institutional marquee) sits the mark on a bg-surface card, which is pure white, so the
baked-in background is invisible there and the original file is the right one to use.

REPLACE, DO NOT EDIT IN PLACE. /logos/ is cached hard by the deploy (see deploy/), so a
new version of an asset needs a new -vN filename or browsers that already hold the old one
will never re-request it.

This is a derived asset, not the partner's own reverse logo. If Startup Singam supply an
official white/reverse mark, prefer theirs and delete this.
"""

from PIL import Image

SRC = 'public/logos/startupsingam.png'
OUT_REVERSE = 'public/logos/startupsingam-reverse-v1.png'

# The supplied file has been through a lossy round trip: several thousand background
# pixels sit one or two levels off pure white. Un-compositing turns those into a faint
# veil across the whole canvas, which is visible on navy. FLOOR is that noise level;
# coverage below it is background. What survives is rescaled so the antialiased edges keep
# their full ramp rather than being clipped thin.
FLOOR = 24 / 255.0

# The brand blue is #135298 — its own minimum channel is 19, not 0, so the un-compositing
# formula reads solid interior as ~0.93 coverage rather than 1.0 and would let the navy
# bleed through the letterforms. Anything this well covered is interior, not an edge.
SOLID = 0.78


def main() -> None:
    src = Image.open(SRC).convert('RGB')
    w, h = src.size
    sp = src.load()

    reverse = Image.new('RGBA', (w, h))
    rp = reverse.load()

    for y in range(h):
        for x in range(w):
            r, g, b = sp[x, y]
            # Flattened onto white, so every pixel is  C = src * a + 255 * (1 - a).
            a = 1.0 - min(r, g, b) / 255.0
            if a <= FLOOR:
                rp[x, y] = (0, 0, 0, 0)
                continue
            rr = min(255, max(0, round((r - 255 * (1 - a)) / a)))
            gg = min(255, max(0, round((g - 255 * (1 - a)) / a)))
            bb = min(255, max(0, round((b - 255 * (1 - a)) / a)))
            aa = 255 if a > SOLID else round((a - FLOOR) / (1 - FLOOR) * 255)
            rp[x, y] = (255, 255, 255, aa) if bb > rr + 25 else (rr, gg, bb, aa)

    reverse.save(OUT_REVERSE)
    print(f'wrote {OUT_REVERSE}')


if __name__ == '__main__':
    main()
