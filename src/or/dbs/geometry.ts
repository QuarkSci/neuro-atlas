import type { Mni } from '../types'
import { add, dist, dot, len, mul, sub, unit } from '../vec'
import type { AcPc } from './types'
import type { AcPcFrame, DbsSide } from './logic'

const cross = (a: Mni, b: Mni): Mni => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

/**
 * AC–PC frame (dbs.md 3.1): origin at the mid-commissural point, y towards the anterior commissure, z in the mid-sagittal
 * plane pointing up, x lateral (+ right). `up` is a point or direction that fixes the sagittal plane (default +z of MNI).
 */
export function makeFrame(ac: Mni, pc: Mni, up: Mni = [0, 0, 1]): AcPcFrame {
  const mcp = mul(add(ac, pc), 0.5)
  const ey = unit(sub(ac, pc))
  const ez = unit(sub(up, mul(ey, dot(up, ey))))
  const ex = cross(ey, ez)
  return { ac, pc, mcp, ex, ey, ez, lengthMm: dist(ac, pc) }
}

export const toAcpc = (f: AcPcFrame, p: Mni): AcPc => {
  const d = sub(p, f.mcp)
  return [dot(d, f.ex), dot(d, f.ey), dot(d, f.ez)]
}

export const fromAcpc = (f: AcPcFrame, a: AcPc): Mni => add(f.mcp, add(add(mul(f.ex, a[0]), mul(f.ey, a[1])), mul(f.ez, a[2])))

/** Planned target in MNI from the mid-range of the AC–PC coordinates of the target; the left side mirrors x. */
export function plannedPoint(f: AcPcFrame, mid: AcPc, side: DbsSide): Mni {
  return fromAcpc(f, [side === 'right' ? mid[0] : -mid[0], mid[1], mid[2]])
}

/**
 * Angles of the line entry → target in the AC–PC frame: `sagittalDeg` between the line and the AC–PC plane seen from
 * the side (≈ 60°), `coronalDeg` between the line and the vertical seen from the front (≈ 15–20°).
 */
export function lineAngles(f: AcPcFrame, entry: Mni, target: Mni) {
  const a = toAcpc(f, entry),
    b = toAcpc(f, target)
  const d = sub(b, a)
  const dz = Math.abs(d[2]) || 1e-9
  return {
    sagittalDeg: (Math.atan2(dz, Math.abs(d[1])) * 180) / Math.PI,
    coronalDeg: (Math.atan2(Math.abs(d[0]), dz) * 180) / Math.PI,
  }
}

/** Closest point of the infinite line (through `a`, direction `d`) to `p`: signed distance along the line from `a`, and the miss, mm. */
export function lineMiss(a: Mni, d: Mni, p: Mni) {
  const u = unit(d)
  const s = dot(sub(p, a), u)
  return { s, missMm: len(sub(p, add(a, mul(u, s)))) }
}
