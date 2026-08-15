/**
 * Mass-spring cloth — the actual simulation.
 *
 * Ported to TypeScript from FlagWaver (MIT) — see LICENSE-flagwaver.md in this
 * directory. The physics is unchanged; the geometry is built directly as a
 * BufferGeometry here rather than through three's ParametricGeometry, so nothing from
 * `three/examples` reaches the bundle.
 *
 * The model is Jakobsen's: particles carry no velocity of their own, only a current and
 * a previous position. Distance constraints are then satisfied by moving particles, not
 * by computing spring forces — which is why it stays stable with only two relaxation
 * passes where a force-based spring system would need a much smaller timestep.
 */

import { BufferAttribute, BufferGeometry, StreamDrawUsage, Vector3 } from 'three'

import { DRAG, ITERATION_COUNT } from './constants'

/** A point mass. Velocity is implied by (position - previous). */
export class Particle {
  position: Vector3
  previous: Vector3
  readonly original: Vector3
  readonly acceleration = new Vector3()
  private readonly inverseMass: number
  private tmp = new Vector3()

  constructor(position: Vector3, mass: number) {
    this.position = position.clone()
    this.previous = position.clone()
    this.original = position.clone()
    this.inverseMass = 1 / mass
  }

  applyForce(force: Vector3): void {
    this.acceleration.addScaledVector(force, this.inverseMass)
  }

  /**
   * Verlet step. `deltaTimeSq` is dt², not dt — the integrator multiplies acceleration
   * by the square of the timestep, and passing dt here is a classic way to get a cloth
   * that behaves plausibly but at the wrong scale.
   */
  integrate(deltaTimeSq: number): void {
    const next = this.tmp
      .subVectors(this.position, this.previous)
      .multiplyScalar(DRAG)
      .add(this.position)
      .addScaledVector(this.acceleration, deltaTimeSq)

    // Rotate the three vectors rather than allocating. This runs a few hundred times
    // per particle per second; `new Vector3()` in here is what makes the GC visible.
    this.tmp = this.previous
    this.previous = this.position
    this.position = next

    this.acceleration.set(0, 0, 0)
  }
}

/** Holds two particles a fixed distance apart, pulling both equally. */
export class Constraint {
  constructor(
    readonly p1: Particle,
    readonly p2: Particle,
    readonly restDistance: number,
  ) {}

  resolve(): void {
    diff.subVectors(this.p2.position, this.p1.position)

    const currentDistance = diff.length()
    if (currentDistance === 0) return // division guard: coincident particles

    const correction = diff.multiplyScalar((1 - this.restDistance / currentDistance) / 2)

    this.p1.position.add(correction)
    this.p2.position.sub(correction)
  }
}

const diff = new Vector3()

/** Slack allowed before a length constraint starts pulling. */
const SLACK = 1.2

/**
 * A one-way constraint: it can pull p2 back toward p1 but never the reverse.
 *
 * Applied in a chain from the hoist outward, this is what stops the "super elastic"
 * failure where a strong gust stretches the flag to several times its length. The
 * ordering matters — see Flag.setLengthConstraints().
 */
export class FixedConstraint extends Constraint {
  override resolve(): void {
    const restDistance = this.restDistance * SLACK

    diff.subVectors(this.p1.position, this.p2.position)

    const currentDistance = diff.length() / SLACK
    if (currentDistance <= restDistance) return

    diff.normalize().multiplyScalar(currentDistance - restDistance)
    this.p2.position.add(diff)
  }
}

/**
 * A rectangular sheet of particles joined by structural (grid) and shear (diagonal)
 * constraints.
 *
 * Bend constraints are deliberately absent: with constraint relaxation, structural plus
 * shear already reads as cloth, and bend springs roughly double the constraint count for
 * a difference nobody sees at this size.
 */
export class Cloth {
  readonly width: number
  readonly height: number
  readonly particles: Particle[] = []
  readonly constraints: Constraint[] = []
  readonly geometry: BufferGeometry

  constructor(
    readonly xSegments: number,
    readonly ySegments: number,
    readonly restDistance: number,
    mass: number,
  ) {
    this.width = restDistance * xSegments
    this.height = restDistance * ySegments

    const cols = xSegments + 1
    const rows = ySegments + 1
    const particleMass = mass / (cols * rows)

    for (let v = 0; v < rows; v++) {
      for (let u = 0; u < cols; u++) {
        this.particles.push(
          new Particle(
            new Vector3((u / xSegments) * this.width, (v / ySegments) * this.height, 0),
            particleMass,
          ),
        )
      }
    }

    // Structural — every horizontal and vertical neighbour pair.
    for (let v = 0; v < rows; v++) {
      for (let u = 0; u < cols; u++) {
        if (u < xSegments) {
          this.constraints.push(
            new Constraint(this.particleAt(u, v), this.particleAt(u + 1, v), restDistance),
          )
        }
        if (v < ySegments) {
          this.constraints.push(
            new Constraint(this.particleAt(u, v), this.particleAt(u, v + 1), restDistance),
          )
        }
      }
    }

    // Shear — both diagonals of every cell. Without these the sheet folds flat like
    // paper instead of billowing.
    const diagonal = Math.SQRT2 * restDistance
    for (let v = 0; v < ySegments; v++) {
      for (let u = 0; u < xSegments; u++) {
        this.constraints.push(
          new Constraint(this.particleAt(u, v), this.particleAt(u + 1, v + 1), diagonal),
        )
        this.constraints.push(
          new Constraint(this.particleAt(u + 1, v), this.particleAt(u, v + 1), diagonal),
        )
      }
    }

    this.geometry = buildGeometry(this.particles, cols, xSegments, ySegments)
  }

  /** Particle at grid column u, row v. Row 0 is the bottom edge. */
  particleAt(u: number, v: number): Particle {
    return this.particles[u + v * (this.xSegments + 1)]
  }

  reset(): void {
    for (const p of this.particles) {
      p.previous.copy(p.position.copy(p.original))
    }
  }

  simulate(deltaTime: number): void {
    const deltaTimeSq = deltaTime * deltaTime

    for (const p of this.particles) p.integrate(deltaTimeSq)

    for (let n = 0; n < ITERATION_COUNT; n++) {
      for (const c of this.constraints) c.resolve()
    }
  }

  /** Copy particle positions into the vertex buffer and recompute lighting normals. */
  render(): void {
    const attribute = this.geometry.getAttribute('position') as BufferAttribute
    const positions = attribute.array as Float32Array

    for (let i = 0; i < this.particles.length; i++) {
      const { x, y, z } = this.particles[i].position
      const j = i * 3
      positions[j] = x
      positions[j + 1] = y
      positions[j + 2] = z
    }

    attribute.needsUpdate = true
    this.geometry.computeVertexNormals()
  }

  dispose(): void {
    this.geometry.dispose()
  }
}

/**
 * Build the mesh that mirrors the particle grid.
 *
 * Vertex i must be particle i — render() writes straight into this buffer by index, so
 * any reordering here silently shreds the flag. That one-to-one mapping is the reason
 * this is hand-built instead of borrowed from PlaneGeometry, whose rows run top-to-bottom
 * while the particle grid runs bottom-to-top.
 *
 * UVs put v=0 at the bottom edge, so with three's default flipY the top row of the
 * texture image lands on the top of the flag.
 */
function buildGeometry(
  particles: Particle[],
  cols: number,
  xSegments: number,
  ySegments: number,
): BufferGeometry {
  const positions = new Float32Array(particles.length * 3)
  const uvs = new Float32Array(particles.length * 2)

  for (let i = 0; i < particles.length; i++) {
    const { x, y, z } = particles[i].position
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    uvs[i * 2] = (i % cols) / xSegments
    uvs[i * 2 + 1] = Math.floor(i / cols) / ySegments
  }

  // Two triangles per cell, wound counter-clockwise so the front face points at +z.
  const indices: number[] = []
  for (let v = 0; v < ySegments; v++) {
    for (let u = 0; u < xSegments; u++) {
      const a = u + v * cols
      const b = a + 1
      const c = a + cols + 1
      const d = a + cols
      indices.push(a, b, c, a, c, d)
    }
  }

  const geometry = new BufferGeometry()
  const positionAttribute = new BufferAttribute(positions, 3)

  // Tells the GPU driver this buffer is rewritten every frame, so it doesn't put it
  // somewhere optimised for data that never changes.
  positionAttribute.setUsage(StreamDrawUsage)

  geometry.setAttribute('position', positionAttribute)
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}
