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

WHERE EACH FILE GOES, AND WHY THE .ICO IS NOT IN src/app/:

    src/app/icon0.png       32    the tab icon      linked as /icon0.png?<contenthash>
    src/app/icon1.png       192   Android / PWA     linked as /icon1.png?<contenthash>
    src/app/apple-icon.png  180   iOS home screen   linked as /apple-icon.png?<contenthash>
    public/favicon.ico      16/32/48  fallback only — NOT linked from any page

The App Router emits the <link> tags for src/app/ icons itself, and puts a content hash in
the URL of every one of them EXCEPT favicon.ico — Next 14's metadata image loader says so in
as many words ("No hash query for favicon.ico"). A favicon.ico in src/app/ is therefore
linked as plain /favicon.ico forever, browsers keep favicons in a cache of their own that a
normal refresh does not clear, and they prefer the .ico for tabs — so when the icon changed,
the old one kept showing. That happened, which is why this is written down.

Two PNG sizes rather than one 512: a single large icon worked, but it was a 119KB download
for a 16-32px tab. The numbered-file convention gives each its own hashed <link> with its
size, and the browser picks the one it needs.

With the .ico moved to public/, the page links only the hashed PNGs: change the artwork, the
hash changes, the URL changes, and every browser fetches the new icon on its next visit.
public/favicon.ico still answers the browsers and crawlers that request /favicon.ico on
their own without reading the page.

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
    ico[-1].save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)],
                 append_images=ico[:-1])
    tile(32, marks).convert('RGB').save('src/app/icon0.png', optimize=True)
    tile(192, marks).convert('RGB').save('src/app/icon1.png', optimize=True)
    tile(180, marks).convert('RGB').save('src/app/apple-icon.png', optimize=True)
    print('wrote src/app/icon0.png (32), icon1.png (192), apple-icon.png (180), public/favicon.ico (unlinked fallback)')


if __name__ == '__main__':
    main()
