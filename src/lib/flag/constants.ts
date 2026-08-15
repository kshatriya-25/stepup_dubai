/**
 * Physics constants for the cloth simulation.
 *
 * Ported from FlagWaver (MIT) — see LICENSE-flagwaver.md in this directory.
 *
 * These are tuned as a set. Changing one in isolation usually makes the cloth either
 * gelatinous or explosive, so if you touch DRAG or ITERATION_COUNT, watch the flag for
 * a minute before deciding it looks right.
 */

/**
 * The simulation always advances in whole 1/60s steps, never in "however long the last
 * frame took".
 *
 * Verlet integration derives velocity from the gap between the current and previous
 * position, which silently bakes the timestep into that gap. Feed it a variable dt and
 * a single long frame — a GC pause, a tab regaining focus — reads as an enormous
 * velocity, and the cloth tears itself apart and never recovers. A fixed step with an
 * accumulator keeps it stable at any frame rate. See runFlagScene().
 */
export const TIME_STEP = 1 / 60

/** Constraint relaxation passes per step. 2 is FlagWaver's default and looks right. */
export const ITERATION_COUNT = 2

/** Velocity retained each step — the cloth's internal friction. */
const DAMPING = 0.03
export const DRAG = 1 - DAMPING

/** How hard the wind pushes on a triangle facing it. */
export const DRAG_COEFFICIENT = 0.12

export const AIR_DENSITY = 1.225 // kg/m³
export const G = 9.80665 // m/s²
