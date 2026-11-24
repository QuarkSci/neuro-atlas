/**
 * SX-6 logic types (CC). The CONTRACT types for data live in `types.ts` (AG-16 fills them); this file holds what the logic
 * takes in (`DbsData`, `DbsWorld`) and what it gives out. The logic never imports data: it is injected, so tests and the
 * real data (AG-16) run the same code.
 */
import type { L10n, Mni, ScoreBand } from '../types'
import type { DbsAvoid, DbsExportRow, DbsTarget, DbsTargetId, MerLayer, MerPattern, StimEffect } from './types'

export type DbsSide = 'right' | 'left'

export interface DbsData {
  targets: Readonly<Record<DbsTargetId, DbsTarget>>
  layers: readonly MerLayer[]
  effects: readonly StimEffect[]
}

/** Geometry the logic asks the atlas (ids are right-hand ids; `sideId` derives the left). */
export interface DbsWorld {
  isInside(partId: string, p: Mni): boolean | null
  distanceTo(partId: string, p: Mni): number | null
  centroid(partId: string): Mni | null
}

export interface AcPcFrame {
  ac: Mni
  pc: Mni
  /** Mid-commissural point, MNI. */
  mcp: Mni
  /** Unit axes in MNI: lateral (+ right), anterior, superior. */
  ex: Mni
  ey: Mni
  ez: Mni
  /** AC–PC length, mm. */
  lengthMm: number
}

export const DBS_STEPS = ['plan', 'trajectory', 'burr', 'guide', 'mer', 'stim', 'implant'] as const
export type DbsStepId = (typeof DBS_STEPS)[number]

export type TrackOffset = 'center' | 'anterior' | 'posterior' | 'medial' | 'lateral'

export interface TrajectoryItem {
  partId: string
  kind: DbsAvoid['kind']
  /** Ventricle, vessel or sulcus: crossing or touching one is a collision (dbs.md 6 row 2); capsule, nucleus and tract crossings are only listed. */
  critical: boolean
  /** Closest approach to the structure along the line, mm (0 when inside). */
  minMm: number
  crossed: boolean
  /** Distance from the entry where the closest approach / crossing is, mm. */
  atMm: number
  severity: import('../types').Severity
  consequence: L10n
}

export interface TrajectoryAnalysis {
  lengthMm: number
  /** Angle of the line to the AC–PC plane in the sagittal view (dbs.md 3.3: 55–65°) and from the midline in the coronal view (5–25°), degrees. */
  sagittalDeg: number
  coronalDeg: number
  items: readonly TrajectoryItem[]
  minClearanceMm: number
  collisions: number
  collisionIds: readonly string[]
  /** Angles inside the literature ranges of the target. */
  anglesOk: boolean
}

export interface TrackState {
  id: number
  offset: TrackOffset
  entry: Mni
  target: Mni
  /** Unit vector entry → target. */
  dir: Mni
  /** Deepest depth driven on this track (relative to the planned target, + above), mm; `Infinity` before any step. */
  deepestMm: number
  shallowestMm: number
  /** Learner's boundary marks on this track (depth relative to the planned target). */
  enterMm: number | null
  exitMm: number | null
}

export interface MerReading {
  depthMm: number
  pattern: MerPattern
  /** Where the tip is, MNI. */
  tip: Mni
}

export interface StimReading {
  mA: number
  /** Therapeutic benefit reached at this current (tremor / rigidity falls). */
  benefit: boolean
  benefitThresholdMa: number
  effects: readonly { id: string; partId: string; thresholdMa: number; effect: L10n; remedy: L10n }[]
  /** Lowest side-effect threshold minus the benefit threshold, mA (can be negative). */
  windowMa: number
}

export type DbsEvent =
  | { t: number; type: 'step'; step: DbsStepId }
  | { t: number; type: 'frame'; errorMm: number }
  | { t: number; type: 'trajectory'; analysis: TrajectoryAnalysis }
  | { t: number; type: 'track'; id: number; offset: TrackOffset }
  | { t: number; type: 'shift'; mm: number }
  | { t: number; type: 'too-deep'; depthMm: number }
  | { t: number; type: 'out-of-order'; wanted: DbsStepId }
  | { t: number; type: 'implant'; radialMm: number }

export interface DbsMetrics {
  radialErrorMm: number
  clearanceMm: number
  collisions: number
  merBoundaryErrorMm: number | null
  windowMa: number
  tracks: number
  frameErrorMm: number
  durationS: number
  brainShiftMm: number
  tremorRmsMm: number | null
}

export interface DbsMetricScore {
  id: keyof DbsMetricScores
  value: number | null
  score: 1 | 3 | 5
  band: L10n
}
export interface DbsMetricScores {
  radial: DbsMetricScore
  clearance: DbsMetricScore
  mer: DbsMetricScore
  window: DbsMetricScore
  tracks: DbsMetricScore
  frame: DbsMetricScore
  tremor?: DbsMetricScore
}

export interface DbsReport {
  finishedAt: string
  target: DbsTargetId
  side: DbsSide
  metrics: DbsMetrics
  scores: DbsMetricScores
  total: number
  caps: readonly L10n[]
  export: DbsExportRow
  /** Cross-atlas note (PhD): the planned point against the Julich structure centroid, mm; null when there is none. */
  planVsAtlasMm: number | null
}

export interface DbsParams {
  /** Bands, best → worst (dbs.md 6). */
  radialBandsMm: readonly ScoreBand[]
  clearanceBandsMm: readonly ScoreBand[]
  merBandsMm: readonly ScoreBand[]
  windowBandsMa: readonly ScoreBand[]
  trackBands: readonly ScoreBand[]
  frameBandsMm: readonly ScoreBand[]
  tremorBandsMm: readonly ScoreBand[]
  /** Ben-Gun offset, mm. */
  trackOffsetMm: number
  /** Brain shift: rate (mm per minute) with the dura open and sealed, cap, direction in AC–PC (posterior, inferior). */
  shiftRateMmMin: number
  shiftRateSealedMmMin: number
  shiftCapMm: number
  /** Half-size of the target nucleus used to shorten its MER window on an off-centre track, mm. */
  chordRadiusMm: Readonly<Record<DbsTargetId, number>>
  /** Guide tube stops this far above the target, mm (dbs.md 4.1 step 4: 10–15). Deeper = mechanical injury. */
  guideAboveMm: number
  /** MER window: from +15 mm above to −5 mm below, step 0.5 mm. */
  merTopMm: number
  merBottomMm: number
  merStepMm: number
  /** Stimulation model: benefit threshold = base · (1 + (r / scale)²); side-effect threshold = reference · (d / dRef)². */
  benefitBaseMa: number
  benefitScaleMm: number
  effectRefDistMm: number
  /** Contact distances closer than this are clamped (no zero threshold), mm. */
  minEffectDistMm: number
  /** Collisions with these distances count as contact, mm. */
  contactMm: number
  safeClearanceMm: number
  timeBandsS: readonly ScoreBand[]
}
