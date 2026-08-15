/**
 * Wind and gravity.
 *
 * Ported from FlagWaver (MIT) — see LICENSE-flagwaver.md in this directory.
 *
 * Wind is modelled as dynamic pressure, ½ρv², applied per triangle and scaled by how
 * squarely that triangle faces the flow. That is what makes the cloth ripple rather than
 * simply blow sideways: a fold that turns edge-on to the wind stops catching it, swings
 * back, catches again, and the wave travels down the flag on its own.
 */

import { Object3D, Vector3 } from 'three'

import { AIR_DENSITY, DRAG_COEFFICIENT, G } from './constants'
import type { Cloth } from './physics'

export type WindOptions = {
  /** Base direction. Normalised internally, so magnitude here is irrelevant. */
  direction?: Vector3
  /** Metres per second. Pressure scales with the square of this. */
  speed?: number
  /** Per-frame direction modifier, e.g. to make the wind swing. */
  directionFn?: (direction: Vector3, time: number) => Vector3
  /** Per-frame speed modifier, e.g. to add gusts. */
  speedFn?: (speed: number, time: number) => number
}

export class Wind {
  readonly pressure = new Vector3()
  direction: Vector3
  speed: number
  private readonly directionFn: (direction: Vector3, time: number) => Vector3
  private readonly speedFn: (speed: number, time: number) => number

  constructor(options: WindOptions = {}) {
    this.direction = options.direction ?? new Vector3(1, 0, 0.35)
    this.speed = options.speed ?? 10
    this.directionFn = options.directionFn ?? ((d) => d)
    this.speedFn = options.speedFn ?? ((s) => s)
  }

  /** Recompute the pressure vector. `time` is milliseconds; the caller owns the clock. */
  update(time: number): void {
    const speed = this.speedFn(disturbScalar(this.speed), time)

    this.directionFn(disturb(this.pressure.copy(this.direction)), time)
      .normalize()
      .multiplyScalar(0.5 * AIR_DENSITY * speed * speed)
  }
}

/**
 * Nudge exact zeros off-axis.
 *
 * A wind vector perfectly parallel to the flag's rest plane produces exactly zero force
 * on every triangle, and a flag that is already flat stays flat forever — mathematically
 * correct and visually broken. Real air is never that tidy.
 */
function disturb(v: Vector3): Vector3 {
  if (v.x === 0) v.x = 0.001
  if (v.y === 0) v.y = 0.001
  if (v.z === 0) v.z = 0.001
  return v
}

function disturbScalar(n: number): number {
  return n === 0 ? 0.001 : n
}

/* -- Forces ---------------------------------------------------------------- */

const gravity = new Vector3(0, -G, 0)

export function applyGravity(cloth: Cloth, object?: Object3D): void {
  const force = localise(gravity, object)
  for (const particle of cloth.particles) particle.acceleration.add(force)
}

export function applyWind(cloth: Cloth, wind: Wind, object?: Object3D): void {
  const index = cloth.geometry.getIndex()
  if (!index) return

  // Each triangle covers half a grid cell; the force it catches is shared by its three
  // corners, hence the /3.
  const faceArea = (cloth.restDistance * cloth.restDistance) / 2
  const force = localise(wind.pressure, object).multiplyScalar(
    (DRAG_COEFFICIENT * faceArea) / 3,
  )

  const particles = cloth.particles

  for (let i = 0; i < index.count; i += 3) {
    const a = particles[index.getX(i)]
    const b = particles[index.getX(i + 1)]
    const c = particles[index.getX(i + 2)]

    // Face normal, then project the wind onto it: a triangle edge-on to the flow
    // catches nothing, one facing it catches all of it.
    cb.subVectors(c.position, b.position)
    ab.subVectors(a.position, b.position)
    cb.cross(ab).normalize()

    const projected = cb.multiplyScalar(cb.dot(force))

    a.applyForce(projected)
    b.applyForce(projected)
    c.applyForce(projected)
  }
}

const cb = new Vector3()
const ab = new Vector3()
const tmp = new Vector3()
const worldPosition = new Vector3()

/**
 * Rotate a world-space force into an object's local space.
 *
 * The vector is a direction and magnitude, not a point, so the object's translation must
 * not apply — adding the world position before worldToLocal() cancels it out, leaving
 * only the rotation and scale.
 */
function localise(force: Vector3, object?: Object3D): Vector3 {
  tmp.copy(force)

  if (object) {
    worldPosition.setFromMatrixPosition(object.matrixWorld)
    tmp.add(worldPosition)
    object.worldToLocal(tmp)
  }

  return tmp
}
