#!/usr/bin/env bash
# Fetch partner/scheme logos into the Expo public folder.
# Usage: fill in the URLs below, then: bash fetch-logos.sh
# Note: written for bash 3.2 (macOS default) — no associative arrays.

set -uo pipefail

DEST="/Users/ankitrajput/Tealorca/expo/step_dubai/public/logos"
mkdir -p "$DEST"

# "name|source URL"  (paste the real image URLs after the pipe)
#
# Wikimedia Commons note: the Special:FilePath endpoint with ?width=N renders
# SVG sources to PNG server-side, so no local rasterizer is needed.
LOGOS=(
  "sidbi|https://commons.wikimedia.org/wiki/Special:FilePath/SIDBI%20LOGO.png?width=512"
  "mudra|https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20of%20the%20Pradhan%20Mantri%20Mudra%20Yojana.svg?width=512"
  "msme|https://commons.wikimedia.org/wiki/Special:FilePath/MSME%20logo%20(colour).svg?width=512"
  "tiic|https://www.tiic.org/wp-content/uploads/2019/06/Tiic-Logo.png"
  # --- still unresolved, see notes ---
  "startuptn|"   # site is a React SPA; only a 64x64 favicon is exposed
  "cgtmse|"      # cgtmse.in refuses connections from outside India
  "tanseed|"     # no standalone logo found; sub-brand of StartupTN
  "dic|"         # no single national/state logo; msmetamilnadu.tn.gov.in unreachable
)

for entry in "${LOGOS[@]}"; do
  name="${entry%%|*}"
  url="${entry#*|}"

  if [[ -z "$url" ]]; then
    echo "skip  $name  (no URL set)"
    continue
  fi

  tmp="$(mktemp)"
  if ! curl -fsSL --max-time 30 -A "Mozilla/5.0" "$url" -o "$tmp"; then
    echo "FAIL  $name  <- $url"
    rm -f "$tmp"
    continue
  fi

  kind="$(file -b --mime-type "$tmp")"
  out="$DEST/$name.png"

  case "$kind" in
    image/png)
      mv "$tmp" "$out"
      ;;
    image/jpeg|image/webp|image/gif)
      # imagemagick if present, else fall back to sips (ships with macOS)
      if command -v magick >/dev/null 2>&1; then
        magick "$tmp" "$out" && rm -f "$tmp"
      elif command -v sips >/dev/null 2>&1 && sips -s format png "$tmp" --out "$out" >/dev/null 2>&1; then
        rm -f "$tmp"
      else
        echo "WARN  $name is $kind and no converter available; saved as-is"
        out="$DEST/$name.${kind#image/}"
        mv "$tmp" "$out"
      fi
      ;;
    image/svg+xml)
      if command -v magick >/dev/null 2>&1; then
        magick -background none -density 300 "$tmp" -resize x256 "$out" && rm -f "$tmp"
      else
        out="$DEST/$name.svg"
        mv "$tmp" "$out"
        echo "WARN  $name saved as .svg (install imagemagick to rasterize)"
      fi
      ;;
    *)
      echo "FAIL  $name  got $kind, not an image (likely an HTML error page)"
      rm -f "$tmp"
      continue
      ;;
  esac

  # mktemp gives 0600; these are served from public/, so widen to match siblings
  chmod 644 "$out"

  echo "ok    $name  ($(du -h "$out" 2>/dev/null | cut -f1))"
done

echo
echo "Contents of $DEST:"
ls -la "$DEST"
