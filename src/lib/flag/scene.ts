/**
 * The three.js scene around the cloth: pole, lighting, camera, and the run loop.
 *
 * Everything here is browser-only and is reached through a dynamic import, so three.js
 * never lands in the main bundle and is never fetched by a visitor who won't see the
 * flag (small screens, reduced motion, no WebGL). See WavingFlag.tsx.
 *
 * The scene renders with a transparent background so it composites straight onto the
 * navy header bar.
 *
 * Everything is framed for the header's small canvas — roughly 60×72px. If this is ever
 * moved somewhere larger, the four constants below are the dials: the frame size, the
 * pole length, and the grid spacing all assume a flag a thumbnail wide.
 */

import {
  CanvasTexture,
  ClampToEdgeWrapping,
  CylinderGeometry,
  DirectionalLight,
  HemisphereLight,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'

import { TIME_STEP } from './constants'
import { Flag } from './flag'
import { drawIndianFlag } from './tricolour'
import { applyGravity, applyWind, Wind } from './wind'

/** Flag size in metres — 3:2, the national flag's proportions. */
const FLAG_WIDTH = 1.5
const FLAG_HEIGHT = 1.0

/**
 * Grid spacing. Coarser than a full-size flag would want, because this renders at about
 * 60px wide in the header — extra rows cost real work per frame and resolve to detail
 * below a pixel. Quality here is quadratic: halving this quadruples the cost.
 *
 * MUST DIVIDE BOTH FLAG_WIDTH AND FLAG_HEIGHT EXACTLY.
 *
 * Cloth cells are square and their count is rounded to a whole number, so a spacing that
 * doesn't divide evenly silently resizes the flag: at height/9 the 1.5m width rounds up
 * to 14 cells and the flag flies at 1.556:1 instead of 3:2. That defeats the entire point
 * of drawing the texture to specification. For a 3:2 flag the divisor must be even —
 * /10 gives 15×10, /12 gives 18×12.
 */
const REST_DISTANCE = FLAG_HEIGHT / 10

/**
 * What the camera must always be able to see, in metres. Drives the framing.
 *
 * Wider than the flag itself on purpose: a gust throws the fly end well past its rest
 * position, and framing to the rest width clips the corner off exactly when the flag is
 * doing the interesting thing.
 *
 * Tall enough to keep a little sky above the finial and to let the mast run out of the
 * bottom of the frame, so it reads as a flagpole cut off by the header bar rather than a
 * short stick floating beside the logo.
 */
const FRAME_WIDTH = 1.70
const FRAME_HEIGHT = 1.55

/**
 * Where the left edge of the frame sits relative to the mast, in metres.
 *
 * Small on purpose. The camera is aimed so this is ALL the clearance the mast gets on its
 * left — any more is dead canvas between the header's edge and the flag, which is space
 * the layout has to pay for and nothing occupies.
 */
const MAST_CLEARANCE = 0.05

const FOV = 38

/**
 * Never advance more than this many physics steps in one frame.
 *
 * A slow device that cannot keep up would otherwise ask for more steps each frame than
 * it can afford, which makes it slower, which asks for more steps — the simulation
 * spirals and the tab locks. Past the cap we drop the backlog and run in slow motion
 * instead, which nobody notices on a decorative flag.
 */
const MAX_SUBSTEPS = 3

export type FlagScene = {
  start: () => void
  stop: () => void
  resize: () => void
  dispose: () => void
}

export function createFlagScene(canvas: HTMLCanvasElement): FlagScene | null {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch {
    // No WebGL, or the GPU is blocklisted. The flag is decoration; say nothing.
    return null
  }

  // The canvas is tiny, so full 2× is affordable and worth it — the mast is only a
  // couple of pixels wide and goes to mush at 1×. Capped at 2 all the same: a 3×
  // display would shade 2.25× the fragments for no visible gain.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100)

  /* -- Lighting --
     Warm key from the front-right to match the sun in the hero footage, cool sky fill so
     the shaded side of a fold goes blue-grey rather than black. */
  // The hemisphere term is doing more than ambience here: it is what keeps a fold turned
  // away from the key light reading as saffron-in-shadow rather than muddy brown.
  scene.add(new HemisphereLight(0xbcd8ff, 0x123a6b, 1.6))

  const key = new DirectionalLight(0xfff2e0, 2.3)
  key.position.set(2.5, 3, 4)
  scene.add(key)

  const rim = new DirectionalLight(0x9fc4ff, 0.55)
  rim.position.set(-3, 1, -2)
  scene.add(rim)

  /* -- Pole --
     Runs below the frame so it reads as continuing past the bottom edge rather than
     floating. */
  const poleRadius = 0.032
  const poleTop = 0.62
  const poleLength = 2.8

  const poleMaterial = new MeshStandardMaterial({
    color: 0x141d2b,
    metalness: 0.65,
    roughness: 0.32,
  })
  const poleGeometry = new CylinderGeometry(poleRadius, poleRadius * 1.25, poleLength, 12)
  const pole = new Mesh(poleGeometry, poleMaterial)
  pole.position.y = poleTop - poleLength / 2
  scene.add(pole)

  const finialGeometry = new SphereGeometry(poleRadius * 2, 16, 12)
  const finial = new Mesh(finialGeometry, poleMaterial)
  finial.position.y = poleTop + poleRadius
  scene.add(finial)

  /* -- Flag -- */
  const texture = new CanvasTexture(drawIndianFlag())
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())

  const flag = new Flag({
    width: FLAG_WIDTH,
    height: FLAG_HEIGHT,
    restDistance: REST_DISTANCE,
    texture,
  })
  // Hoist sits just off the pole's surface, a little below the finial.
  flag.object.position.set(poleRadius, poleTop - 0.14, 0)
  flag.disturb()
  scene.add(flag.object)

  /* -- Wind --
     Blowing along +x, away from the pole, with a slight push toward the camera so folds
     catch the key light. The gust function is what stops the ripple looking like a loop. */
  /*
   * Steady 10 m/s with only slight gusting.
   *
   * The GUSTS, not the average speed, decide how wide the frame has to be — it must clear
   * the worst gust or a corner clips at the canvas edge, and every metre of frame that
   * only the worst gust ever reaches is dead canvas the other 99% of the time. Measured
   * over 300 simulated seconds: heavy gusting (±16%) throws the fly end to x=1.64 and
   * leaves the flag filling 82% of the frame on average, while ±6% holds it to 1.61 and
   * 85%. Calmer air both fills the header better and suits a national flag.
   */
  const wind = new Wind({
    direction: new Vector3(1, 0.06, 0.4),
    speed: 10,
    speedFn: (speed, time) =>
      speed * (1 + 0.06 * Math.sin(time / 2600) + 0.027 * Math.sin(time / 900)),
    directionFn: (direction, time) => {
      direction.z += 0.05 * Math.sin(time / 3700)
      direction.y += 0.015 * Math.sin(time / 2100)
      return direction
    },
  })

  /*
   * Aimed so the frame's LEFT edge lands just left of the mast, rather than centred on
   * the flag.
   *
   * Centring looks reasonable in isolation and is wrong in a header: the flag only ever
   * flies downwind, to the right, so a centred frame puts a quarter of its width as empty
   * canvas on the left where nothing can ever appear. In the bar that empty strip reads
   * as a gap between the header edge and the flag.
   */
  const focus = new Vector3(
    poleRadius - MAST_CLEARANCE + FRAME_WIDTH / 2,
    poleTop - FLAG_HEIGHT * 0.68,
    0,
  )

  function resize(): void {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return

    const aspect = width / height
    camera.aspect = aspect

    /*
     * Frame by fitting BOTH axes, not just the vertical one.
     *
     * A perspective camera's fov is vertical, so in a tall narrow column — which is
     * exactly the shape of the strip beside the hero copy — framing on height alone
     * crops the fly end of the flag off the side. Take whichever distance is greater.
     */
    const halfFovY = (FOV * Math.PI) / 360
    const distanceForHeight = FRAME_HEIGHT / 2 / Math.tan(halfFovY)
    const distanceForWidth = FRAME_WIDTH / 2 / (Math.tan(halfFovY) * aspect)
    const distance = Math.max(distanceForHeight, distanceForWidth)

    // Only a slight rise. A steeper angle foreshortens the mast, and at this size that
    // reads as a leaning pole rather than as perspective.
    camera.position.set(focus.x, focus.y + 0.12, distance)
    camera.lookAt(focus)
    camera.updateProjectionMatrix()

    // `false` — the canvas is laid out by CSS; three must size the drawing buffer only.
    renderer.setSize(width, height, false)

    // Redraw immediately. When the loop is stopped — reduced motion, or scrolled out of
    // view mid-resize — nothing else would, and the canvas would hold a stretched copy
    // of the old buffer.
    draw()
  }

  /** One fixed physics step: forces first, then integrate — integrate clears them. */
  function step(timeMs: number): void {
    wind.update(timeMs)
    applyWind(flag.cloth, wind, flag.object)
    applyGravity(flag.cloth, flag.object)
    flag.simulate(TIME_STEP)
  }

  function draw(): void {
    flag.render()
    renderer.render(scene, camera)
  }

  let rafId = 0
  let running = false
  let lastTime = 0
  let accumulator = 0
  let contextLost = false

  function frame(now: number): void {
    rafId = requestAnimationFrame(frame)

    // Clamp the very first frame and any resume, where `now - lastTime` is meaningless.
    const delta = Math.min((now - lastTime) / 1000, 0.25)
    lastTime = now
    accumulator += delta

    let steps = 0
    while (accumulator >= TIME_STEP && steps < MAX_SUBSTEPS) {
      step(now)
      accumulator -= TIME_STEP
      steps++
    }
    if (steps === MAX_SUBSTEPS) accumulator = 0

    draw()
  }

  function start(): void {
    if (running || contextLost) return
    running = true
    lastTime = performance.now()
    accumulator = 0
    rafId = requestAnimationFrame(frame)
  }

  function stop(): void {
    if (!running) return
    running = false
    cancelAnimationFrame(rafId)
  }

  // A lost context leaves every GPU resource invalid. Stop rather than draw garbage;
  // preventDefault is what lets the browser restore it if the user comes back.
  const onContextLost = (event: Event) => {
    event.preventDefault()
    contextLost = true
    stop()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  function dispose(): void {
    stop()
    canvas.removeEventListener('webglcontextlost', onContextLost)
    flag.dispose()
    poleGeometry.dispose()
    finialGeometry.dispose()
    poleMaterial.dispose()
    renderer.dispose()
  }

  resize()

  /**
   * Settle before the first paint.
   *
   * Straight from rest the flag is a flat rectangle that visibly inflates over the first
   * second, which reads as a bug. Running the simulation forward silently means the very
   * first frame the visitor sees is already a flag in the wind.
   */
  const settleFrom = performance.now()
  for (let i = 0; i < 220; i++) step(settleFrom + i * TIME_STEP * 1000)
  draw()

  return { start, stop, resize, dispose }
}
