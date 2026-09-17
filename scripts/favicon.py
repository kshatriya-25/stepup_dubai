#!/usr/bin/env python3
"""
Favicon, app icon and Apple touch icon, cut from the Tier-2 Rising logo.

    python3 scripts/favicon.py      (needs Pillow)

THE FULL LOGO, on the client's instruction: "TIER-2 / RISING / STARTUP SUMMIT" exactly as
it appears in public/brand/logo-v2.png, centred on a navy (#072B5F) tile.

The tile is not optional. The logo is white and orange type on a transparent ground, so
without it the white lines vanish in a light browser tab.

The trade-off, accepted knowingly: at 16px (a non-retina tab) three lines of type cannot all
be legible — it reads as the logo's shape and colours rather than its words. At 32px, which
is what retina tabs actually use, and at the 180px home-screen size, it holds up. An earlier
version of this script used a "T2 + arrow" mark cut from the logo for legibility at 16px;
it was replaced because the client wants the logo itself.

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
WIDTH = 0.86                     # logo width as a share of the tile — the widest line decides


def trim(im: Image.Image) -> Image.Image:
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox())


def tile(size: int, logo: Image.Image) -> Image.Image:
    S = size * 8                                            # draw big, downsample once
    canvas = Image.new('RGBA', (S, S), NAVY)
    w = round(S * WIDTH)
    art = logo.resize((w, round(w * logo.height / logo.width)), Image.LANCZOS)
    canvas.alpha_composite(art, ((S - art.width) // 2, (S - art.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    logo = Image.open(LOGO).convert('RGBA')
    marks = logo.crop(logo.getchannel('A').getbbox())       # trim transparent margin
    ico = [tile(s, marks) for s in (16, 32, 48)]
    ico[-1].save('src/app/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)],
                 append_images=ico[:-1])
    tile(512, marks).convert('RGB').save('src/app/icon.png', optimize=True)
    tile(180, marks).convert('RGB').save('src/app/apple-icon.png', optimize=True)
    print('wrote src/app/favicon.ico (16/32/48), src/app/icon.png (512), src/app/apple-icon.png (180)')


if __name__ == '__main__':
    main()
