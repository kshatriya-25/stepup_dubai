#!/usr/bin/env python3
"""
Favicon, app icon and Apple touch icon, cut from the Tier-2 Rising logo.

    python3 scripts/favicon.py      (needs Pillow)

WHY NOT JUST THE LOGO. public/brand/logo-v2.png is white and orange type on a transparent
ground, three lines tall. In a light browser tab the white "TIER-2" disappears, and at 16px
three lines of type are an unreadable smear. So the icon is a MARK, not the logo:

    "T2" in white + the orange up-arrow, on a navy (#072B5F) tile

"T2" is Tier-2; the arrow is the one from the logo that stands in for the I of RISING. All
three glyphs are cut out of logo-v2.png itself, so the icon carries the logo's own
letterforms and distressed texture rather than a font approximating them. The navy tile is
what makes it legible on a light tab and a dark one alike.

THE "2" IS ISOLATED BY SHAPE, not cropped. The staircase running down from "TIER" reaches
right up to the 2's diagonal, so any rectangle around the 2 drags stair-stripes in with it.
The stripes are detached pieces, so the 2 is kept as the largest connected piece of ink.
(A column-density crop was tried first and missed them: they sit against the diagonal.)

Files written straight into src/app/, where the App Router picks them up by NAME and emits
the <link> tags itself — no metadata code needed:

    src/app/favicon.ico     16, 32, 48      browser tab (also what /favicon.ico requests hit)
    src/app/icon.png        512             modern browsers, and the PWA/Android size
    src/app/apple-icon.png  180             iOS home screen

Square, no rounded corners: iOS and Android apply their own mask, and a pre-rounded icon
gets rounded twice. Nothing on this site is rounded anyway.
"""

from PIL import Image

LOGO = 'public/brand/logo-v2.png'
NAVY = (7, 43, 95, 255)          # tailwind `base`
FILL = 0.62                      # glyph height as a share of the tile
GAP = 0.045                      # space between glyphs, share of the tile


def trim(im: Image.Image) -> Image.Image:
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox())


def largest_shape(im: Image.Image, grow: int = 2) -> Image.Image:
    """Keep only the biggest connected piece of ink (alpha > 100), plus `grow` px of edge."""
    from collections import deque
    from PIL import ImageFilter
    w, h = im.size
    a = im.getchannel('A').load()
    seen = [[False] * w for _ in range(h)]
    best: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            if a[x, y] > 100 and not seen[y][x]:
                q, pts = deque([(x, y)]), []
                seen[y][x] = True
                while q:
                    cx, cy = q.popleft()
                    pts.append((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and a[nx, ny] > 100:
                            seen[ny][nx] = True
                            q.append((nx, ny))
                if len(pts) > len(best):
                    best = pts
    mask = Image.new('L', (w, h), 0)
    mp = mask.load()
    for x, y in best:
        mp[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(2 * grow + 1))
    out = im.copy()
    out.putalpha(Image.composite(im.getchannel('A'), Image.new('L', (w, h), 0), mask))
    return out


def glyphs() -> list[Image.Image]:
    logo = Image.open(LOGO).convert('RGBA')
    t = trim(logo.crop((55, 9, 133, 154)))                  # the T of TIER
    arrow = trim(logo.crop((286, 166, 361, 329)))           # the arrow in RISING

    # The 2 of TIER-2, alone. In the logo, the staircase down from "TIER" runs right up to
    # the 2's diagonal, so any rectangle around the 2 drags thin stair-stripes in with it —
    # they read as a rendering fault at icon size. They are DETACHED shapes, though (the 2
    # is one ~8,000px piece, each stripe at most ~330px), so the 2 is taken as the largest
    # connected piece of ink, grown by 2px to keep its antialiased edge.
    two = trim(largest_shape(logo.crop((400, 9, 529, 154))))
    return [t, two, arrow]


def tile(size: int, marks: list[Image.Image]) -> Image.Image:
    S = size * 8                                            # draw big, downsample once
    canvas = Image.new('RGBA', (S, S), NAVY)
    h = round(S * FILL)
    scaled = [m.resize((round(m.width * h / m.height), h), Image.LANCZOS) for m in marks]
    gap = round(S * GAP)
    width = sum(m.width for m in scaled) + gap * (len(scaled) - 1)
    if width > S * 0.84:                                    # keep a margin on either side
        k = S * 0.84 / width
        scaled = [m.resize((round(m.width * k), round(m.height * k)), Image.LANCZOS) for m in scaled]
        gap = round(gap * k)
        width = sum(m.width for m in scaled) + gap * (len(scaled) - 1)
    x = (S - width) // 2
    for m in scaled:
        canvas.alpha_composite(m, (x, (S - m.height) // 2))
        x += m.width + gap
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    marks = glyphs()
    ico = [tile(s, marks) for s in (16, 32, 48)]
    ico[-1].save('src/app/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)],
                 append_images=ico[:-1])
    tile(512, marks).convert('RGB').save('src/app/icon.png', optimize=True)
    tile(180, marks).convert('RGB').save('src/app/apple-icon.png', optimize=True)
    print('wrote src/app/favicon.ico (16/32/48), src/app/icon.png (512), src/app/apple-icon.png (180)')


if __name__ == '__main__':
    main()
