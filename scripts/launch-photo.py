#!/usr/bin/env python3
"""
Web sizes for the launch photograph shown in the hero.

    python3 scripts/launch-photo.py [path/to/2X1A7561.CR3]

WHY THE RAW IS CONVERTED AT ALL. No browser renders Canon raw, and the CR3 is 20MB for one
photograph — raw is sensor data that has to be demosaiced before anything can display it.
A conversion is not a choice; the only question is how many times the pixels get compressed
on the way.

SO THIS DECODES THE CR3 AND RESIZES IN ONE PASS. Given the CR3 (as an argument, or found at
one of RAW_CANDIDATES), it is decoded to a lossless TIFF with macOS's own Image I/O:

    sips -s format tiff <raw> --out <tmp>

and every shipped width is resized from those pixels, so each output is compressed exactly
once. The earlier version of this script resized a committed JPEG master instead, which
compressed twice; measured, that cost 0.7/255 mean difference and nothing in file size, but
there is no reason to pay even that.

FALLBACK. Without the CR3 it resizes scripts/assets/launch-aakam-source.jpg, a full-size
quality-92 master decoded from that same raw, so the repo can rebuild these files on its
own. Prefer the CR3 when it is to hand; keep it out of git, where 20MB of binary does not
belong.

A NEUTRAL CONVERSION. Image I/O does not apply Canon's picture style, so the result is
flatter and slightly cooler than the camera-processed JPEG the client first supplied. That
is the raw's own rendering and is deliberately left alone — grading someone's photograph is
their call, not this script's.

NO CROP. The frame is already 3:2 and the composition needs its full width: seven people in
a row, and cropping either end drops someone out of the photograph.
"""

import os
import subprocess
import sys
import tempfile

from PIL import Image

MASTER = 'scripts/assets/launch-aakam-source.jpg'
RAW_CANDIDATES = ('scripts/assets/2X1A7561.CR3', os.path.expanduser('~/Desktop/2X1A7561.CR3'))
OUT = 'public/happens/launch-aakam-{w}.jpg'
WIDTHS = (900, 1600)
QUALITY = 82


def find_raw() -> str | None:
    if len(sys.argv) > 1:
        if not os.path.exists(sys.argv[1]):
            sys.exit(f'no such file: {sys.argv[1]}')
        return sys.argv[1]
    return next((p for p in RAW_CANDIDATES if os.path.exists(p)), None)


def open_source(raw: str | None, tmpdir: str) -> tuple[Image.Image, str]:
    """The CR3 decoded losslessly if we have it, else the committed JPEG master."""
    if raw is None:
        return Image.open(MASTER), f'{MASTER} (master — CR3 not found, see the docstring)'
    tiff = os.path.join(tmpdir, 'raw.tiff')
    subprocess.run(['sips', '-s', 'format', 'tiff', raw, '--out', tiff],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return Image.open(tiff), f'{raw} (raw, decoded losslessly)'


def main() -> None:
    raw = find_raw()
    with tempfile.TemporaryDirectory() as tmpdir:
        src, label = open_source(raw, tmpdir)
        src = src.convert('RGB')
        print(f'source {src.size[0]}x{src.size[1]}  {label}')
        for w in WIDTHS:
            out = src.resize((w, round(w * src.height / src.width)), Image.LANCZOS)
            path = OUT.format(w=w)
            out.save(path, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
            print(f'wrote {path}  {out.size[0]}x{out.size[1]}  {os.path.getsize(path) // 1024}KB')


if __name__ == '__main__':
    main()
