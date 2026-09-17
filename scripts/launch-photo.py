#!/usr/bin/env python3
"""
Web sizes for the launch image shown in the hero.

    python3 scripts/launch-photo.py

Source: scripts/assets/launch-unveiling-source.png — the client's designed unveiling graphic
(1672x941, 16:9, "Tier2Rising - Startup Summit Unveiling" set over the stage photograph).
It replaced the plain camera photograph (2X1A7561.CR3) in September 2026.

Writes the two widths the hero's srcset offers. The filenames carry "-v2" because /happens/
is cached by Apache: reusing the old names would leave returning visitors on the previous
photograph until their cache expired.

Quality 88, not the 82 used for plain photographs — this image has type set into it, and
JPEG artefacts show around lettering long before they show in a photograph. No crop: the
title runs nearly edge to edge.
"""

import os

from PIL import Image

SRC = 'scripts/assets/launch-unveiling-source.png'
OUT = 'public/happens/launch-unveiling-v2-{w}.jpg'
WIDTHS = (900, 1600)
QUALITY = 88


def main() -> None:
    src = Image.open(SRC).convert('RGB')
    print(f'source {src.size[0]}x{src.size[1]}')
    for w in WIDTHS:
        out = src.resize((w, round(w * src.height / src.width)), Image.LANCZOS)
        path = OUT.format(w=w)
        out.save(path, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        print(f'wrote {path}  {out.size[0]}x{out.size[1]}  {os.path.getsize(path) // 1024}KB')


if __name__ == '__main__':
    main()
