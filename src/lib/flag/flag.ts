/**
 * A flag: cloth, mesh, and the pins that hold it to a pole.
 *
 * Ported from FlagWaver (MIT) — see LICENSE-flagwaver.md in this directory.
 *
 * The object's origin sits at the TOP of the hoist, with the flag hanging below it, so
 * placing this is just "put the origin at the top of the pole".
 */

import { DoubleSide, Mesh, MeshStandardMaterial, Object3D, Texture } from 'three'

import { ITERATION_COUNT } from './constants'
import { Cloth, FixedConstraint, Particle } from './physics'

export type FlagOptions = {
  /** Metres. A 3:2 national flag is width 1.5, height 1. */
  width: number
  height: number
  /** Fabric density in kg/m². Bunting is light; 0.11 is a reasonable flag. */
  mass?: number
  /**
   * Grid spacing in metres. This is the quality/cost dial and it is quadratic — halving
   * it roughly quadruples the particle count and the per-frame work.
   */
  restDistance?: number
  texture: Texture
}

export class Flag {
  readonly cloth: Cloth
  readonly mesh: Mesh
  readonly object = new Object3D()

  private readonly pins: Particle[] = []
  private readonly lengthConstraints: FixedConstraint[] = []
  private readonly material: MeshStandardMaterial

  constructor(options: FlagOptions) {
    const { width, height, mass = 0.11, restDistance = height / 12, texture } = options

    this.cloth = new Cloth(
      Math.max(1, Math.round(width / restDistance)),
      Math.max(1, Math.round(height / restDistance)),
      restDistance,
      mass * width * height,
    )

    this.material = new MeshStandardMaterial({
      map: texture,
      // A real flag is visible from both sides, and the reverse of the tricolour is its
      // mirror image — which is exactly what DoubleSide gives us for free.
      side: DoubleSide,
      metalness: 0.05,
      roughness: 0.88,
    })

    this.mesh = new Mesh(this.cloth.geometry, this.material)
    // Cloth coordinates run 0..height upward; drop the mesh so the hoist top is at y=0.
    this.mesh.position.set(0, -this.cloth.height, 0)

    this.object.add(this.mesh)

    this.pinHoist()
    this.buildLengthConstraints()
  }

  /** Pin every particle on the left edge — the hoist — to the pole. */
  private pinHoist(): void {
    for (let v = 0; v <= this.cloth.ySegments; v++) {
      this.pins.push(this.cloth.particleAt(0, v))
    }
  }

  /**
   * Chain one-way constraints from hoist to fly, row by row.
   *
   * Order matters and is not cosmetic: each constraint pulls its outer particle back
   * toward an inner one that has already been corrected this pass. Resolve them
   * out-of-order and the correction never propagates back to the pole, which is the
   * "super elastic" bug where a gust stretches the flag to twice its length.
   */
  private buildLengthConstraints(): void {
    const { xSegments, ySegments, restDistance } = this.cloth

    for (let v = 0; v <= ySegments; v++) {
      for (let u = 0; u < xSegments; u++) {
        this.lengthConstraints.push(
          new FixedConstraint(
            this.cloth.particleAt(u, v),
            this.cloth.particleAt(u + 1, v),
            restDistance,
          ),
        )
      }
    }
  }

  simulate(deltaTime: number): void {
    this.cloth.simulate(deltaTime)

    // Snap pinned particles back. Done after the solve, not before, so nothing the
    // constraints did can drag the flag off its pole.
    for (const particle of this.pins) {
      particle.previous.copy(particle.position.copy(particle.original))
    }

    for (let n = 0; n < ITERATION_COUNT; n++) {
      for (const constraint of this.lengthConstraints) constraint.resolve()
    }
  }

  render(): void {
    this.cloth.render()
  }

  /**
   * Give the cloth a shove so it starts from a plausible shape.
   *
   * Without this the flag begins as a perfectly flat plane and visibly "inflates" over
   * the first second or two, which reads as a loading glitch. Displacing the free
   * corners breaks that symmetry immediately.
   */
  disturb(): void {
    const { xSegments, ySegments } = this.cloth

    for (let v = 0; v <= ySegments; v++) {
      for (let u = 1; u <= xSegments; u++) {
        const particle = this.cloth.particleAt(u, v)
        // Scaled by distance from the hoist, so the pinned edge stays put.
        const z = Math.sin(v * 0.9) * 0.05 * (u / xSegments)
        particle.position.z += z
        // Move `previous` with it: the gap between the two is velocity, and leaving it
        // behind would launch the cloth instead of merely displacing it.
        particle.previous.z += z
      }
    }
  }

  dispose(): void {
    this.cloth.dispose()
    this.material.map?.dispose()
    this.material.dispose()
  }
}
