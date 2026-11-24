import type { Mni } from './types'

/** Tiny vector helpers on MNI tuples (no three.js, so the logic runs anywhere). */
export const add = (a: Mni, b: Mni): Mni => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: Mni, b: Mni): Mni => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const mul = (a: Mni, k: number): Mni => [a[0] * k, a[1] * k, a[2] * k]
export const dot = (a: Mni, b: Mni) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const len = (a: Mni) => Math.hypot(a[0], a[1], a[2])
export const dist = (a: Mni, b: Mni) => len(sub(a, b))
export const unit = (a: Mni): Mni => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
export const lerp = (a: Mni, b: Mni, t: number): Mni => add(mul(a, 1 - t), mul(b, t))
/** Angle between two directions, degrees. */
export const angleDeg = (a: Mni, b: Mni) => (Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b))))) * 180) / Math.PI
