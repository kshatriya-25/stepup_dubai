#!/usr/bin/env python3
"""
Web sizes for the launch photograph shown in the hero.

Run from the repo root:  python3 scripts/launch-photo.py   (needs Pillow)

The camera original is 5472x3648 and 4.4MB — fine as an archive, impossible as the first
image on the homepage. This writes the two widths the hero's srcset offers:

    launch-aakam-900.jpg    900x600    for phones and the stacked layout at 1x
    launch-aakam-1600.jpg   1600x1067  for the side-by-side layout and 2x screens

NO CROP. The frame is already 3:2 and the composition needs its full width — seven people
in a row, and cropping either end drops someone out of the photograph.

Quality 82 progressive, which lands both files in the same 75-175KB band as the existing
photographs in public/happens/. next.config.mjs has the Next image optimizer switched OFF
(`images: { unoptimized: true }` — we serve plain <img> from a small Node box), so whatever
this script writes is exactly what the browser downloads. There is no pipeline behind it.
"""

import os

from PIL import Image

SRC = 'scripts/assets/launch-aakam-source.jpg'
OUT = 'public/happens/launch-aakam-{w}.jpg'
WIDTHS = (900, 1600)
QUALITY = 82


def main() -> None:
    src = Image.open(SRC)
    print(f'source {src.size[0]}x{src.size[1]}  {os.path.getsize(SRC) // 1024}KB')
    for w in WIDTHS:
        out = src.resize((w, round(w * src.height / src.width)), Image.LANCZOS)
        path = OUT.format(w=w)
        out.save(path, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        print(f'wrote {path}  {out.size[0]}x{out.size[1]}  {os.path.getsize(path) // 1024}KB')


if __name__ == '__main__':
    main()
