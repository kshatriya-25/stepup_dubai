/**
 * The National Flag of India, drawn to specification on a canvas.
 *
 * Drawn rather than shipped as an image on purpose. The Flag Code of India and IS 1:1968
 * fix the proportions exactly, and those proportions are easy to get subtly wrong when an
 * image is cropped, re-encoded or resized by a build step. Here the geometry is derived
 * from a single dimension, so it is correct at any resolution and there is no asset that
 * can drift:
 *
 *   - ratio 3:2, length to height
 *   - three equal horizontal bands: India saffron, white, India green
 *   - the Ashoka Chakra centred in the white band, navy blue, with 24 spokes,
 *     its diameter equal to the height of the white band
 *
 * The colours are the sRGB values published for the flag. Do not "brand-match" them to
 * the site palette — the national flag is not a design element.
 */

const SAFFRON = '#FF9933'
const WHITE = '#FFFFFF'
const GREEN = '#138808'
const NAVY = '#000080'

const SPOKES = 24

/**
 * Draw the flag and return the canvas.
 *
 * @param height Pixel height of the texture. Width is fixed at 1.5× this by the 3:2
 *   ratio. 800 keeps the chakra's spokes clean at the sizes we render.
 */
export function drawIndianFlag(height = 800): HTMLCanvasElement {
  const width = Math.round(height * 1.5)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const band = height / 3

  ctx.fillStyle = SAFFRON
  ctx.fillRect(0, 0, width, band)
  ctx.fillStyle = WHITE
  ctx.fillRect(0, band, width, band)
  ctx.fillStyle = GREEN
  ctx.fillRect(0, band * 2, width, band)

  drawChakra(ctx, width / 2, height / 2, band / 2)

  return canvas
}

/**
 * The Ashoka Chakra: a rim, a hub, 24 spokes, and 24 rounded spoke-ends just inside the
 * rim. `radius` is half the white band's height, per the specification.
 */
function drawChakra(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = NAVY
  ctx.strokeStyle = NAVY

  // Rim
  ctx.lineWidth = radius * 0.075
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.96, 0, Math.PI * 2)
  ctx.stroke()

  // Hub
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.09, 0, Math.PI * 2)
  ctx.fill()

  const step = (Math.PI * 2) / SPOKES

  for (let i = 0; i < SPOKES; i++) {
    ctx.save()
    ctx.rotate(i * step)

    /*
     * Spoke profile: narrow where it leaves the hub, widest around two-thirds out,
     * tapering to a point at the rim. That spindle shape is what distinguishes the
     * Ashoka Chakra from a bicycle wheel — a spoke of constant width, or one widest at
     * the hub, turns the centre into a solid navy blob.
     */
    ctx.beginPath()
    ctx.moveTo(radius * 0.1, -radius * 0.009)
    ctx.quadraticCurveTo(radius * 0.55, -radius * 0.032, radius * 0.93, 0)
    ctx.quadraticCurveTo(radius * 0.55, radius * 0.032, radius * 0.1, radius * 0.009)
    ctx.closePath()
    ctx.fill()

    // The bead near the rim, between each pair of spokes' widest points.
    ctx.beginPath()
    ctx.arc(radius * 0.76, 0, radius * 0.035, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  ctx.restore()
}
