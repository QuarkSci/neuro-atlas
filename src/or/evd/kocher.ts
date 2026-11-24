import type { Mni } from '../types'
import { angleDeg, dist, dot, mul, sub, unit } from '../vec'
import { sideId } from './params'
import type { EvdParams, EvdWorld, KocherResult, MarkResult, Side } from './types'

const DOWN: Mni = [0, 0, -1]
/** Vertices of the frontal bone examined for the suture (all of them when the mesh is smaller). */
const SUTURE_SCAN = 20000
/** Suture points within this lateral window around the wanted x are used for the local fit, mm. */
const WINDOW_MM = 4

export interface KocherModel extends KocherResult {
  /** Coronal suture position (y, z) at lateral distance `x` (toward the side), interpolated along the suture; null if outside the found range. */
  sutureAt(lateralMm: number): Mni | null
}

/** Left-right mirror of a point (x → −x). */
const flip = (p: Mni, side: Side): Mni => (side === 'right' ? p : [-p[0], p[1], p[2]])

/**
 * Find the Kocher point from the meshes (evd.md 3.3 algorithm):
 *  1. the coronal suture = frontal-bone vertices closer than `sutureGapMm` to the parietal bone;
 *  2. at the wanted lateral distance take the suture's local y, z (mean of the points inside a ±4 mm window);
 *  3. step `aheadOfCoronalMm` anterior and drop onto the outer table of the skull (ray from above);
 *  4. ideal direction = entry → Monro foramen; Ghajar direction = inward surface normal there.
 * Returns null when a structure is not loaded or no suture is found.
 */
export function findKocher(w: EvdWorld, P: EvdParams, side: Side = 'right', lateralMm = P.kocherLateralMm.value, aheadMm = P.kocherAheadOfCoronalMm.value): KocherModel | null {
  const frontal = P.ids.skullFrontal
  const parietal = sideId(P.ids.skullParietal, side)
  const verts = w.vertices(frontal, SUTURE_SCAN)
  if (!verts?.length) return null
  // Suture points in a canonical right-side frame (x ≥ 0 = toward the operated side).
  const pts: Mni[] = []
  for (const v of verts) {
    const lat = side === 'right' ? v[0] : -v[0]
    if (lat < 5 || lat > 60) continue
    const d = w.distanceTo(parietal, v)
    if (d == null) return null
    if (d < P.sutureGapMm.value) pts.push([lat, v[1], v[2]])
  }
  if (pts.length < 20) return null
  pts.sort((a, b) => a[0] - b[0])

  const sutureAt = (x: number): Mni | null => {
    const near = pts.filter((p) => Math.abs(p[0] - x) <= WINDOW_MM)
    if (near.length < 3) return null
    // The suture is a curve y(x) running roughly posterior-lateral, so average position and x together: a local line fit y = a + b·x.
    let sx = 0,
      sy = 0,
      sz = 0
    for (const p of near) {
      sx += p[0]
      sy += p[1]
      sz += p[2]
    }
    const n = near.length
    const mx = sx / n,
      my = sy / n,
      mz = sz / n
    let cxx = 0,
      cxy = 0,
      cxz = 0
    for (const p of near) {
      cxx += (p[0] - mx) ** 2
      cxy += (p[0] - mx) * (p[1] - my)
      cxz += (p[0] - mx) * (p[2] - mz)
    }
    const by = cxx > 1e-6 ? cxy / cxx : 0
    const bz = cxx > 1e-6 ? cxz / cxx : 0
    return [x, my + by * (x - mx), mz + bz * (x - mx)]
  }

  const s = sutureAt(lateralMm)
  if (!s) return null
  const x = side === 'right' ? lateralMm : -lateralMm
  const y = s[1] + aheadMm
  const skull = [frontal, parietal]
  const hit = w.raycast(skull, [x, y, 300], DOWN)
  if (!hit) return null
  const monro = w.centroid(P.monroPartId)
  if (!monro) return null
  const lengthMm = dist(hit.point, monro)
  const ideal = unit(sub(monro, hit.point))
  // Outward normal of the outer table (pointing up/out); the inward one is the Ghajar direction.
  const outward = dot(hit.normal, DOWN) > 0 ? mul(hit.normal, -1) : hit.normal
  const ghajar = unit(mul(outward, -1))
  return {
    entry: hit.point,
    normal: outward,
    suture: flip(s, side),
    sutureSamples: pts.length,
    lateralMm,
    aheadOfCoronalMm: aheadMm,
    ideal,
    monro,
    ghajar,
    ghajarVsIdealDeg: angleDeg(ghajar, ideal),
    lengthMm,
    sutureAt: (lat: number) => {
      const r = sutureAt(lat)
      return r ? flip(r, side) : null
    },
  }
}

/** Grade a mark the learner placed: where it is relative to the midline and the suture, and which risks it carries. */
export function judgeMark(k: KocherModel, P: EvdParams, side: Side, p: Mni): MarkResult {
  const lat = side === 'right' ? p[0] : -p[0]
  const s = k.sutureAt(lat)
  // Ahead of the suture at this lateral distance; when the suture is not defined there (too lateral / medial), fall back to the Kocher suture.
  const sy = s ? s[1] : k.suture[1]
  const ahead = p[1] - sy
  const flags: MarkResult['flags'][number][] = []
  if (lat < 0) flags.push('wrong-side')
  if (lat < P.sinusRiskLateralMm.value) flags.push('sinus')
  if (ahead < 0) flags.push('motor')
  const latOk = lat >= P.kocherLateralRange.value.min && lat <= P.kocherLateralRange.value.max
  const aheadOk = ahead >= P.kocherAheadRange.value.min && ahead <= P.kocherAheadRange.value.max
  const onTarget = latOk && aheadOk
  if (!onTarget && !flags.length) flags.push('off-target')
  return { point: p, errorMm: dist(p, k.entry), lateralMm: lat, aheadOfCoronalMm: ahead, flags, onTarget }
}

/** Drop a point onto the outer table (vertical ray); returns the surface hit or null. */
export function projectToSkull(w: EvdWorld, P: EvdParams, side: Side, p: Mni) {
  return w.raycast([P.ids.skullFrontal, sideId(P.ids.skullParietal, side)], [p[0], p[1], 300], DOWN)
}
