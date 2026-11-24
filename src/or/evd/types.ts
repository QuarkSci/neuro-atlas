/**
 * SX-3 OP-1 EVD (ventriculostomy): contract types. Owned by CC; AGY (AG-15) builds data / UI / history against these.
 * Source of every number: docs/research/procedures/evd.md (AG-9, DOIs checked against Crossref / eutils 2026-11-23).
 *
 * Split of work:
 *   - `params.ts`  (CC)  the numbers the logic needs, each `Sourced`. Checked against evd.md; AGY may proofread, not change.
 *   - `data.ts`    (AGY) `EVD_REFS` (one `Ref` per `EvdRefId`), `EVD_TEXT` (step names / instructions / consequences, uz + en),
 *                         complication table (evd.md 6), difficulty-level descriptions.
 *   - `logic.ts`, `session.ts`, `score.ts`, `kocher.ts` (CC)  the engine. AGY only calls the API at the bottom of this file.
 */
import type { L10n, Mni, Ref, Sourced, Range, ScoreBand, Severity } from '../types'

// ── References ─────────────────────────────────────────────────────────────

/** The reference ids `params.ts` cites. `EVD_REFS` (data.ts) must contain exactly these. */
export const EVD_REF_IDS = [
  'fried2016',
  'kakarla2008',
  'huyette2008',
  'friedman1980',
  'ghajar1985',
  'morone2019',
  'bauer2011',
  'lozier2002',
  'ramanan2015',
  'muralidharan2015',
  'statpearls-nbk545317',
  'martin1997',
  'yudkowsky2013',
  'hooten2014',
  'kirkman2014',
] as const
export type EvdRefId = (typeof EVD_REF_IDS)[number]
export type EvdRef = Ref & { id: EvdRefId }

// ── Anatomy ────────────────────────────────────────────────────────────────

export type Side = 'right' | 'left'

/** What a structure means to the EVD score. */
export type EvdRole =
  | 'target' // Monro foramen
  | 'ventricle' // the ipsilateral lateral ventricle (CSF signal) and the third ventricle
  | 'contra-ventricle' // the other lateral ventricle (Kakarla 2)
  | 'septum' // septum pellucidum: crossing it = contralateral ventricle
  | 'hazard' // see `EvdHazard`

export interface EvdHazard {
  /** Id in `src/data/parts.json` (the right-sided id; the left one is derived with `mirrorId`). */
  partId: string
  region: 'medial' | 'lateral' | 'posterior' | 'deep' | 'vessel'
  /** `solid`: bad when the tip is INSIDE the mesh. `surface`: bad when the tip comes within `contactMm` of a thin / tubular mesh. */
  kind: 'solid' | 'surface'
  severity: Severity
  /** Counts as "eloquent" for Kakarla 3. */
  eloquent: boolean
  /** Warn (HUD) when the nearest distance falls under this, mm. */
  warnMm: number
  /** Collision when the tip is closer than this (`surface` kind), mm. */
  contactMm: number
  /** What happens to the patient (evd.md 3.3). */
  consequence: L10n
  refs: readonly EvdRefId[]
}

export interface EvdParams {
  // — Kocher point (evd.md 3.1, algorithm in the box under 3.3) —
  /** Lateral distance from the midline, mm. Default and the accepted range. */
  kocherLateralMm: Sourced<number>
  kocherLateralRange: Sourced<Range>
  /** Anterior to the coronal suture, mm. */
  kocherAheadOfCoronalMm: Sourced<number>
  kocherAheadRange: Sourced<Range>
  /** Medial of this the superior sagittal sinus is at risk (mark flagged 'sinus'), mm from the midline. */
  sinusRiskLateralMm: Sourced<number>
  /** Tolerance for a placed mark: within this distance of the ideal point it is "on target", mm. */
  markOkMm: Sourced<number>
  /** Two meshes are "at the suture" where their surfaces are closer than this, mm (derived from the atlas meshes). */
  sutureGapMm: Sourced<number>

  // — Target and direction —
  /** Ideal tip is the Monro foramen. Ghajar surface-normal rule is a second reference (evd.md 4.1.3). */
  monroPartId: string
  /** Frontal horn: the tip counts as inside it for y (MNI) greater than this, mm. */
  frontalHornYMm: Sourced<number>

  // — Depth (evd.md 4.2) —
  depthBestMm: Sourced<Range>
  depthOkMm: Sourced<Range>
  /** Ependymal "pop" is expected in this band below the outer table, mm. */
  popBandMm: Sourced<Range>
  /** Deeper than this the tip is in the red zone (hypothalamus / third-ventricle floor / brainstem), mm. */
  redDepthMm: Sourced<number>

  // — Angle and distance bands (evd.md 4.3, 7.2) —
  angleBandsDeg: readonly ScoreBand[]
  monroBandsMm: readonly ScoreBand[]

  // — Kakarla (evd.md 7.1) —
  /** Grade 1 needs the tip this close to the Monro foramen (inside the ipsilateral frontal horn or the third ventricle), mm. */
  grade1MonroMm: Sourced<number>
  /** Percent weights per grade (evd.md 7.1: 100 / 60 / 0). */
  gradeScore: Sourced<Record<1 | 2 | 3, number>>

  // — Pass counting and kinematics (evd.md 7.2; thresholds are simulator choices, origin 'design') —
  /** A pass starts when the tip is deeper than this below the scalp, mm. */
  passEnterDepthMm: Sourced<number>
  /** …and ends when it is withdrawn shallower than this, mm. */
  passExitDepthMm: Sourced<number>
  timeBandsS: readonly ScoreBand[]
  passBands: readonly ScoreBand[]
  tremorBandsMm: readonly ScoreBand[]
  /** Path efficiency bands. `upTo` is on `1 - E` so that "lower is better" holds for every band list; 0.15 means E ≥ 0.85. */
  efficiencyLossBands: readonly ScoreBand[]
  /** Tremor band, Hz. */
  tremorHz: Sourced<Range>

  hazards: readonly EvdHazard[]
  /** Ids used by the Kakarla classification. */
  ids: {
    ventricle: string
    thirdVentricle: string
    contraVentricle: string
    septum: string
    skullFrontal: string
    skullParietal: string
    dura: string
    superiorSagittalSinus: string
  }
}

// ── Steps ──────────────────────────────────────────────────────────────────

export const EVD_STEPS = ['position', 'mark', 'incision', 'burr', 'dura', 'insert', 'csf', 'seat', 'secure'] as const
export type EvdStepId = (typeof EVD_STEPS)[number]

/** How a step is completed in SX-3. `catheter`: by the instrument engine. `burr`: SX-4 reports it; until then a confirm. */
export type EvdStepKind = 'confirm' | 'mark' | 'burr' | 'catheter' | 'auto'

export interface EvdStepDef {
  id: EvdStepId
  /** 1…9 as in evd.md 5. */
  index: number
  kind: EvdStepKind
  name: L10n
  /** What to do. */
  instruction: L10n
  /** What goes wrong, anatomically (evd.md 5, last column). */
  mistake: L10n
  refs: readonly EvdRefId[]
}

export type EvdStepStatus = 'locked' | 'active' | 'done'

export interface EvdStepRecord {
  id: EvdStepId
  status: EvdStepStatus
  /** Seconds since the session began. */
  startedAt: number | null
  doneAt: number | null
}

// ── Inputs ─────────────────────────────────────────────────────────────────

/** Step 1 checklist the learner answers (evd.md 2). */
export interface PositionChecks {
  side: Side
  /** Head neutral, nose to the ceiling. */
  neutralHead: boolean
  /** Head of the bed raised 30–45°. */
  headUp30to45: boolean
  /** Coagulation checked (INR / platelets) and antibiotic given. */
  coagAndAntibiotic: boolean
}

export type EvdLevel = 1 | 2 | 3

export interface EvdOptions {
  /** 1 student (laser on, enlarged ventricle), 2 resident (normal atlas, laser off), 3 neurosurgeon (slit / shift; geometry arrives later). */
  level: EvdLevel
  side: Side
  /** Show the trajectory laser (true for level 1). */
  laser: boolean
}

/** One catheter-tip sample (from `ToolEngine` after conversion to MNI). */
export interface TipSample {
  /** Seconds. */
  t: number
  tip: Mni
  /** Unit vector of travel, handle → tip. */
  dir: Mni
  /** Signed distance below the scalp surface (positive = inside the head), mm. */
  scalpDepthMm: number
  /** Signed distance below the outer table of the skull at the entry, mm; `null` before the entry is known. */
  tableDepthMm: number | null
}

// ── Geometry the logic needs (injected: ToolEngine in the browser, a synthetic world in tests) ──────────────

export interface SurfaceHit {
  point: Mni
  /** Unit outward normal. */
  normal: Mni
  distance: number
}

export interface EvdWorld {
  /** Closed-mesh inside test for a structure that is loaded; `null` when the structure is not available. */
  isInside(partId: string, p: Mni): boolean | null
  /** Distance from `p` to the surface of the structure, mm; `null` when not available. */
  distanceTo(partId: string, p: Mni): number | null
  /** Centroid of the structure, MNI mm. */
  centroid(partId: string): Mni | null
  /** First hit of a ray (origin, unit direction) with the union of the given structures; `null` for none. */
  raycast(partIds: readonly string[], origin: Mni, dir: Mni): SurfaceHit | null
  /** A sample of the structure's vertices (≤ `max`), MNI mm; used to find the coronal suture. */
  vertices(partId: string, max: number): readonly Mni[] | null
}

// ── Kocher result ──────────────────────────────────────────────────────────

export interface KocherResult {
  /** Ideal entry point on the outer table of the skull. */
  entry: Mni
  /** Skull outer-surface normal there. */
  normal: Mni
  /** Where the coronal suture crosses the line x = lateral: y, z. */
  suture: Mni
  /** Number of suture points found (how well-defined the suture is in the meshes). */
  sutureSamples: number
  lateralMm: number
  aheadOfCoronalMm: number
  /** Ideal direction of travel: entry → Monro, unit. */
  ideal: Mni
  monro: Mni
  /** Ghajar rule: the inward surface normal at the entry, unit; `angleToIdealDeg` is how far it is from `ideal`. */
  ghajar: Mni
  ghajarVsIdealDeg: number
  /** Distance entry → Monro, mm. */
  lengthMm: number
}

export interface MarkResult {
  /** The mark the learner placed (projected onto the skull outer surface). */
  point: Mni
  /** Distance to the ideal Kocher point, mm. */
  errorMm: number
  /** Lateral distance from the midline (x) and distance anterior to the coronal suture, mm. */
  lateralMm: number
  aheadOfCoronalMm: number
  /** Flags: too medial (sinus), behind the suture (motor cortex), far from the ideal point. */
  flags: readonly ('sinus' | 'motor' | 'off-target' | 'wrong-side')[]
  onTarget: boolean
}

// ── Events and report ─────────────────────────────────────────────────────

export type EvdEvent =
  | { t: number; type: 'step'; step: EvdStepId; status: EvdStepStatus }
  | { t: number; type: 'out-of-order'; wanted: EvdStepId; current: EvdStepId }
  | { t: number; type: 'mark'; mark: MarkResult }
  | { t: number; type: 'pass-start'; pass: number }
  | { t: number; type: 'pass-end'; pass: number }
  | { t: number; type: 'csf'; depthMm: number; tableDepthMm: number | null }
  | { t: number; type: 'warn'; partId: string; mm: number; severity: Severity }
  | { t: number; type: 'collision'; partId: string; severity: Severity; consequence: L10n; tip: Mni }
  | { t: number; type: 'overshoot'; depthMm: number }
  | { t: number; type: 'finish' }

export type KakarlaGrade = 1 | 2 | 3

export type TipRegion = 'frontal-horn' | 'ventricle-other' | 'third-ventricle' | 'contra-ventricle' | 'eloquent-parenchyma' | 'silent-parenchyma' | 'extra-axial'

export interface Kakarla {
  grade: KakarlaGrade
  /** 100 / 60 / 0 from `gradeScore`. */
  percent: number
  region: TipRegion
  /** Reasons that decided the grade (shown in the report). */
  why: readonly L10n[]
}

export interface EvdMetrics {
  /** Step 2 start → step 8 done, seconds. */
  durationS: number
  passes: number
  /** Angle between the actual direction (entry → final tip) and the ideal direction (entry → Monro), degrees. */
  angleErrDeg: number
  /** Angle between the actual direction and the Ghajar rule (inward surface normal at the entry), degrees. */
  angleVsGhajarDeg: number
  /** Actual entry vs the ideal Kocher point, mm. */
  entryErrMm: number
  tipToMonroMm: number
  /** Final tip, below the outer table of the skull, mm. */
  depthMm: number
  /** Distinct hazard structures hit (inside a solid, or touching a surface), and how many hits in total. */
  collisionIds: readonly string[]
  collisions: number
  /** Closest approach to any hazard over the whole path, mm (∞ when none loaded). */
  minHazardMm: number
  /** RMS of the 4–12 Hz component of the tip position, mm. */
  tremorRmsMm: number
  /** L_ideal / L_actual in 0…1 (L_actual includes every pass). */
  pathEfficiency: number
  /** Wrong-order attempts. */
  sequenceErrors: number
  kakarla: Kakarla
}

export interface MetricScore {
  id: keyof EvdMetricScores
  value: number
  score: 1 | 3 | 5
  band: L10n
}

export interface EvdMetricScores {
  time: MetricScore
  passes: MetricScore
  angle: MetricScore
  monro: MetricScore
  depth: MetricScore
  collisions: MetricScore
  tremor: MetricScore
  efficiency: MetricScore
}

export interface EvdReport {
  /** ISO time the session finished. */
  finishedAt: string
  options: EvdOptions
  kocher: KocherResult | null
  mark: MarkResult | null
  marks: number
  metrics: EvdMetrics
  scores: EvdMetricScores
  /** Mean of the 8 scores, 1…5. */
  total: number
  /** Hard fails that cap the result regardless of the mean (Kakarla 3, a collision with a fatal hazard). */
  caps: readonly L10n[]
  /** Tip trajectory, MNI mm (for the 3D replay and the CSV). */
  trace: readonly { t: number; p: Mni }[]
  events: readonly EvdEvent[]
}

// ── CSV / history (AG-15 history.ts uses these) ────────────────────────────

/** Column order of one stored session (evd.md 8.3, extended). */
export const EVD_CSV_COLUMNS = [
  'timestamp',
  'level',
  'side',
  'durationS',
  'passes',
  'angleErrDeg',
  'angleVsGhajarDeg',
  'entryErrMm',
  'tipToMonroMm',
  'depthMm',
  'kakarlaGrade',
  'tremorRmsMm',
  'pathEfficiency',
  'collisions',
  'sequenceErrors',
  'total',
] as const
export type EvdCsvColumn = (typeof EVD_CSV_COLUMNS)[number]
export type EvdHistoryRow = Record<EvdCsvColumn, string | number>

// ── The API the UI calls (implemented by `session.ts`) ─────────────────────

/** Read model for the panel. Immutable snapshots: a new object on every change (zustand-friendly). */
export interface EvdSnapshot {
  running: boolean
  finished: boolean
  options: EvdOptions
  step: EvdStepId
  steps: readonly EvdStepRecord[]
  /** Seconds since the session began. */
  elapsedS: number
  kocher: KocherResult | null
  mark: MarkResult | null
  marks: number
  passes: number
  /** CSF seen (tip reached the ipsilateral ventricle). */
  csf: boolean
  /** Latest tip readout (null before the catheter appears). */
  tip: { p: Mni; scalpDepthMm: number; tableDepthMm: number | null; monroMm: number | null; angleToIdealDeg: number | null } | null
  /** Nearest hazard now (for the HUD). */
  nearest: { partId: string; mm: number; severity: Severity } | null
  events: readonly EvdEvent[]
  report: EvdReport | null
}

export interface EvdApi {
  /** Locate the Kocher point from the meshes and open step 1. */
  begin(opts: EvdOptions): Promise<void> | void
  /** Step 1: answer the checklist. */
  setPosition(checks: PositionChecks): void
  /** Step 2: place or move the mark (a point on the skull outer surface; the engine projects it). */
  placeMark(p: Mni): MarkResult | null
  /** Steps 1 (after `setPosition`), 3, 4 (until SX-4), 5, 9: "done". Out-of-order calls are recorded, not applied. */
  confirm(step?: EvdStepId): boolean
  /** Instrument engine → logic, every move while the catheter is active. */
  feed(s: TipSample): void
  /** Step 8: stylet out, depth set: freezes the tip and computes the report. */
  seat(): void
  /** Step 9 → report. */
  finish(): EvdReport | null
  reset(): void
  subscribe(fn: (s: EvdSnapshot) => void): () => void
  snapshot(): EvdSnapshot
}
