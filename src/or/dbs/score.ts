import type { L10n } from '../types'
import { bandOf } from '../evd/score'
import type { DbsMetricScore, DbsMetricScores, DbsMetrics, DbsParams } from './logic'

const mk = (id: keyof DbsMetricScores, value: number | null, score: 1 | 3 | 5, band: L10n): DbsMetricScore => ({ id, value, score, band })
const fromBands = (id: keyof DbsMetricScores, value: number, shortfall: number, bands: Parameters<typeof bandOf>[1]) => {
  const b = bandOf(shortfall, bands)
  return mk(id, value, b.score, b.label)
}

/** The six metrics of dbs.md 6 (+ the AC–PC frame error of step 1). Larger-is-better values are banded on their shortfall. */
export function scoreDbs(m: DbsMetrics, P: DbsParams): { scores: DbsMetricScores; total: number; caps: L10n[] } {
  const clearance =
    m.collisions >= 1
      ? mk('clearance', m.clearanceMm, 1, { uz: 'qorincha / tomir kesib o‘tildi', en: 'ventricle / vessel crossed' })
      : fromBands('clearance', m.clearanceMm, Math.max(0, P.safeClearanceMm - m.clearanceMm), P.clearanceBandsMm)
  const scores: DbsMetricScores = {
    radial: fromBands('radial', m.radialErrorMm, m.radialErrorMm, P.radialBandsMm),
    clearance,
    mer:
      m.merBoundaryErrorMm === null
        ? mk('mer', null, 1, { uz: 'chegara belgilanmadi', en: 'no boundary marked' })
        : fromBands('mer', m.merBoundaryErrorMm, m.merBoundaryErrorMm, P.merBandsMm),
    window: fromBands('window', m.windowMa, Math.max(0, 1.5 - m.windowMa), P.windowBandsMa),
    tracks: fromBands('tracks', m.tracks, m.tracks, P.trackBands),
    frame: fromBands('frame', m.frameErrorMm, m.frameErrorMm, P.frameBandsMm),
  }
  if (m.tremorRmsMm !== null) scores.tremor = fromBands('tremor', m.tremorRmsMm, m.tremorRmsMm, P.tremorBandsMm)
  const list = Object.values(scores)
  let total = list.reduce((s, x) => s + x.score, 0) / list.length
  const caps: L10n[] = []
  if (m.collisions >= 1) {
    total = Math.min(total, 2)
    caps.push({ uz: 'Qorincha yoki tomir kesib o‘tildi (ICH xavfi): umumiy baho 2.0 dan oshmaydi.', en: 'Ventricle or vessel crossed (ICH risk): total capped at 2.0.' })
  }
  if (m.radialErrorMm > 2.5) {
    total = Math.min(total, 2)
    caps.push({
      uz: 'Radial xato > 2.5 mm: elektrodni qayta joylashtirish kerak, baho 2.0 dan oshmaydi.',
      en: 'Radial error > 2.5 mm: the lead must be repositioned; total capped at 2.0.',
    })
  }
  return { scores, total: Math.round(total * 100) / 100, caps }
}
