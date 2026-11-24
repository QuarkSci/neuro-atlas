import type { Mni } from '../types'
import { add, dist, mul, sub, unit } from '../vec'
import { sideId } from '../evd/params'
import { lineAngles } from './geometry'
import type { AcPcFrame, DbsData, DbsParams, DbsSide, DbsWorld, TrajectoryAnalysis, TrajectoryItem } from './logic'
import type { DbsTargetId } from './types'

const STEP_MM = 0.5

/**
 * Risk of the straight line entry → target (dbs.md 3.4, 6 row 2): for every structure the target says to avoid, the closest
 * approach and whether the line goes through it. A crossing (or a pass within `contactMm`) of a ventricle or vessel is a collision.
 */
export function analyseTrajectory(world: DbsWorld, data: DbsData, P: DbsParams, frame: AcPcFrame, id: DbsTargetId, side: DbsSide, entry: Mni, target: Mni): TrajectoryAnalysis {
  const T = data.targets[id]
  const length = dist(entry, target)
  const dir = unit(sub(target, entry))
  const n = Math.max(1, Math.floor(length / STEP_MM))
  const items: TrajectoryItem[] = []
  for (const a of T.avoid) {
    const part = sideId(a.partId, side)
    let min = Infinity,
      at = 0,
      crossed = false,
      known = false
    for (let i = 0; i <= n; i++) {
      const s = (i * length) / n
      const p = add(entry, mul(dir, s))
      const inside = world.isInside(part, p)
      const d = world.distanceTo(part, p)
      if (d === null && inside === null) break
      known = true
      if (inside) {
        crossed = true
        min = 0
        at = s
        break
      }
      if (d !== null && d < min) {
        min = d
        at = s
      }
    }
    if (!known) continue
    items.push({ partId: part, minMm: min, crossed, atMm: at, severity: a.severity, consequence: a.consequence })
  }
  items.sort((x, y) => x.minMm - y.minMm)
  const bad = items.filter((x) => x.crossed || x.minMm < P.contactMm)
  const ang = lineAngles(frame, entry, target)
  const lim = (r: { min: number; max: number }, v: number) => v >= r.min - 2 && v <= r.max + 2
  return {
    lengthMm: length,
    sagittalDeg: ang.sagittalDeg,
    coronalDeg: ang.coronalDeg,
    items,
    minClearanceMm: items.length ? items[0].minMm : Infinity,
    collisions: bad.length,
    collisionIds: bad.map((x) => x.partId),
    anglesOk: lim(T.entry.sagittalDeg.value, ang.sagittalDeg) && lim(T.entry.coronalDeg.value, ang.coronalDeg),
  }
}
