import type { Mni } from '../types'
import { dist } from '../vec'
import { sideId } from '../evd/params'
import type { DbsData, DbsParams, DbsSide, DbsWorld, StimReading } from './logic'
import type { DbsTargetId } from './types'

/**
 * Macrostimulation at a contact position (dbs.md 4.3, 6 row 4). Design model: the field falls with distance, so the
 * current needed to reach a structure grows as d²: threshold = mid(range) · (d / dRef)². The therapeutic threshold grows
 * with the contact's distance `r` from the true target: base · (1 + (r / scale)²). Window = lowest side-effect threshold − benefit threshold.
 */
export function stimulate(world: DbsWorld, data: DbsData, P: DbsParams, id: DbsTargetId, side: DbsSide, tip: Mni, truth: Mni, mA: number): StimReading {
  const r = dist(tip, truth)
  const benefitThr = P.benefitBaseMa * (1 + (r / P.benefitScaleMm) ** 2)
  const effects = []
  let lowest = Infinity
  for (const e of data.effects) {
    if (e.target !== id) continue
    const part = sideId(e.partId, side)
    let d = world.distanceTo(part, tip)
    if (d === null) {
      const c = world.centroid(part)
      if (!c) continue
      d = dist(tip, c)
    }
    d = Math.max(P.minEffectDistMm, d)
    const base = (e.thresholdMa.value.min + e.thresholdMa.value.max) / 2
    const thr = base * (d / P.effectRefDistMm) ** 2
    lowest = Math.min(lowest, thr)
    if (mA >= thr) effects.push({ id: e.id, partId: part, thresholdMa: thr, effect: e.effect, remedy: e.remedy })
  }
  return { mA, benefit: mA >= benefitThr, benefitThresholdMa: benefitThr, effects, windowMa: (Number.isFinite(lowest) ? lowest : 10) - benefitThr }
}
