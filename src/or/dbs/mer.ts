import type { Mni } from '../types'
import type { DbsData } from './logic'
import type { DbsParams } from './logic'
import type { DbsTargetId, MerLayer, MerPattern } from './types'

/**
 * What the electrode would record on one track. Depth is relative to the PLANNED target, + above. The atlas target may lie
 * deeper or shallower than planned (`shiftMm` = how much deeper along the track) and the track may pass beside it
 * (`missMm`): an off-centre pass shortens the target layer to a chord (`chord` 0…1; 0 = the track misses the nucleus).
 */
export interface TrackTruth {
  /** The target nucleus window on this track, relative to the planned target: [lower, upper] mm, or null when missed. */
  targetWindow: [number, number] | null
  layerAt(depthMm: number): MerLayer | null
  pattern(depthMm: number): MerPattern
}

const mid = (r: { min: number; max: number }) => (r.min + r.max) / 2

export function trackTruth(data: DbsData, P: DbsParams, id: DbsTargetId, deeperMm: number, missMm: number): TrackTruth {
  const layers = data.layers.filter((l) => l.target === id)
  const R = P.chordRadiusMm[id]
  const chord = missMm >= R ? 0 : Math.sqrt(1 - (missMm / R) ** 2)
  // Window of a layer in the planned-depth coordinate (u = d + deeper  ⇒  d = u − deeper).
  const win = (l: MerLayer): [number, number] | null => {
    let lo = l.toMm,
      hi = l.fromMm
    if (l.isTarget) {
      if (chord === 0) return null
      const m = (lo + hi) / 2,
        h = ((hi - lo) / 2) * chord
      lo = m - h
      hi = m + h
    }
    return [lo - deeperMm, hi - deeperMm]
  }
  const wins = layers.map((l) => ({ l, w: win(l) }))
  const tw = wins.find((x) => x.l.isTarget)?.w ?? null

  const layerAt = (d: number): MerLayer | null => {
    for (const { l, w } of wins) if (w && d >= w[0] && d <= w[1]) return l
    // A gap left by a missed or shortened target layer: the neighbour on that side wins.
    const sorted = wins.filter((x) => x.w).sort((a, b) => b.w![1] - a.w![1])
    const above = sorted.filter((x) => x.w![0] > d).pop()
    const below = sorted.find((x) => x.w![1] < d)
    if (above && below) return d - below.w![1] < above.w![0] - d ? below.l : above.l
    return above?.l ?? below?.l ?? null
  }

  const pattern = (d: number): MerPattern => {
    const l = layerAt(d)
    if (!l)
      return {
        layerId: 'none',
        kind: 'white-matter',
        rateHz: 0,
        burstiness: 0,
        noise: 0.05,
        amplitude: 0.05,
        tremorHz: null,
        response: 'none',
        inTarget: false,
        toBoundaryMm: Infinity,
      }
    let near = Infinity
    for (const { w } of wins) if (w) near = Math.min(near, Math.abs(d - w[0]), Math.abs(d - w[1]))
    return {
      layerId: l.id,
      kind: l.kind,
      rateHz: mid(l.rateHz.value),
      burstiness: l.burstiness,
      noise: l.noise,
      amplitude: 0.3 + 0.6 * l.noise,
      tremorHz: l.tremorHz ? mid(l.tremorHz.value) : null,
      response: l.response,
      inTarget: l.isTarget && !!tw && d >= tw[0] && d <= tw[1],
      toBoundaryMm: near,
    }
  }
  return { targetWindow: tw, layerAt, pattern }
}

export type { Mni }
