/**
 * SX-6 OP-2 DBS: contract types (data + MER). Owned by CC; AGY (AG-16) fills `data.ts` and `merAudio.ts` against them.
 * Source: docs/research/procedures/dbs.md (AG-9). Coordinates: AC–PC frame in mm unless a field says MNI.
 * The trajectory-risk and AC–PC logic (SX-6) is CC's and arrives later; these types are what the data must look like.
 */
import type { L10n, Mni, Range, Ref, ScoreBand, Severity, Sourced } from '../types'

export const DBS_REF_IDS = [
  'starr2002',
  'machado2006',
  'gross2006',
  'deuschl2006',
  'benabid2009',
  'follett2010',
  'schuepbach2013',
  'papavassiliou2004',
  'zrinzo2012',
  'fenoy2014',
  'horn2019',
  'krauss2020',
  'statpearls-nbk557847',
  'martin1997',
  'kirkman2014',
] as const
export type DbsRefId = (typeof DBS_REF_IDS)[number]
export type DbsRef = Ref & { id: DbsRefId }

export type DbsTargetId = 'stn' | 'gpi' | 'vim'

/** Position in the AC–PC frame: origin = mid-commissural point, x lateral, y anterior (+), z superior (+), mm. */
export type AcPc = readonly [number, number, number]

export interface DbsTarget {
  id: DbsTargetId
  name: L10n
  /** Disease the target treats (dbs.md 1.1). */
  indication: L10n
  /** Julich structure used as the reference (`j-stn-right`, `g-right-globus-pallidus` for the GPi, `j-vim-right`). */
  partId: string
  /** Indirect coordinates from the mid-commissural point: lateral, y (+ anterior), z (+ superior), each a range. */
  acpc: { lateral: Sourced<Range>; y: Sourced<Range>; z: Sourced<Range> }
  /** Entry (skull) and angles (dbs.md 3.3). */
  entry: { lateralMm: Sourced<Range>; sagittalDeg: Sourced<Range>; coronalDeg: Sourced<Range>; aheadOfCoronalMm: Sourced<Range> }
  /** Structures the trajectory must stay away from, with the consequence of touching them (dbs.md 3.4, 4.3). */
  avoid: readonly DbsAvoid[]
}

export interface DbsAvoid {
  partId: string
  kind: 'ventricle' | 'vessel' | 'sulcus' | 'capsule' | 'tract' | 'nerve' | 'nucleus'
  severity: Severity
  /** Minimum safe distance, mm (dbs.md 6: ≥ 3 mm excellent). */
  safeMm: Sourced<number>
  consequence: L10n
}

// ── MER ────────────────────────────────────────────────────────────────────

/** Sound / spike character of one electrophysiological layer (dbs.md 4.2). */
export type MerKind =
  | 'sparse-burst' // thalamus, 10–30 Hz
  | 'silent' // zona incerta, quiet
  | 'dense-irregular' // STN, 25–45 Hz, loud background
  | 'regular-high' // SNr, 60–90 Hz, regular
  | 'pauser-burster' // GPe
  | 'border' // lamina, 20–40 Hz, very regular
  | 'tonic-irregular' // GPi, 60–90 Hz
  | 'white-matter' // optic tract (quiet; flash response)
  | 'tremor-locked' // Vim, 4–6 Hz bursts
  | 'sensory-burst' // Vc, short bursts to touch

export type MerResponse = 'none' | 'weak' | 'kinesthetic' | 'voluntary' | 'tactile' | 'visual-flash'

export interface MerLayer {
  /** e.g. 'stn-zi'. */
  id: string
  target: DbsTargetId
  /** Depth window relative to the planned target, mm; positive = above the target (earlier on the way down). `from` > `to`. */
  fromMm: number
  toMm: number
  partId: string
  name: L10n
  kind: MerKind
  /** Mean firing rate, Hz. */
  rateHz: Sourced<Range>
  /** 0 = tonic, 1 = bursting. */
  burstiness: number
  /** 0 = silent background, 1 = loud background ("rain"). */
  noise: number
  /** Present only for tremor-locked layers. */
  tremorHz?: Sourced<Range>
  response: MerResponse
  /** Marks the layer that IS the target (the electrode should sit here). */
  isTarget: boolean
  refs: readonly DbsRefId[]
}

/** What `merPattern(target, depthMm)` returns for one depth: everything the audio and the spike graph need, no clinical text. */
export interface MerPattern {
  layerId: string
  kind: MerKind
  /** Mean firing rate at this depth, Hz (inside a layer: layer midpoint ± a small slow drift; at boundaries blends 0.5 mm). */
  rateHz: number
  burstiness: number
  noise: number
  /** Spike amplitude 0…1 for the synthesis (not mV). */
  amplitude: number
  tremorHz: number | null
  response: MerResponse
  inTarget: boolean
  /** Distance to the nearest layer boundary, mm (the learner reads boundaries from this changing). */
  toBoundaryMm: number
}

/** Pure function the audio and the scoring both call. `depthMm` is relative to the target (+ above). Must be deterministic. */
export type MerPatternFn = (target: DbsTargetId, depthMm: number) => MerPattern

// ── Stimulation ────────────────────────────────────────────────────────────

export interface StimEffect {
  id: string
  target: DbsTargetId
  /** Direction the contact has drifted (dbs.md 4.3). */
  drift: 'lateral-anterior' | 'posterior-medial' | 'medial-inferior' | 'inferior' | 'posterior' | 'ventromedial' | 'medial-posterior' | 'lateral'
  partId: string
  effect: L10n
  /** Current at which the effect appears, mA (a range = patient variation). */
  thresholdMa: Sourced<Range>
  /** What to do (shift the trajectory …). */
  remedy: L10n
}

// ── Scoring ────────────────────────────────────────────────────────────────

export interface DbsMetricSpecs {
  radialErrorMm: readonly ScoreBand[]
  trajectoryClearanceMm: readonly ScoreBand[]
  merBoundaryErrorMm: readonly ScoreBand[]
  therapeuticWindowMa: readonly ScoreBand[]
  tracks: readonly ScoreBand[]
}

/** Report row, one per session (dbs.md 7.1 coordinate export). */
export interface DbsExportRow {
  timestamp: string
  target: DbsTargetId
  side: 'right' | 'left'
  acpcX: number
  acpcY: number
  acpcZ: number
  mniX: number
  mniY: number
  mniZ: number
  /** Same point in the BodyParts3D frame, and the julich ↔ gross offset (dbs.md 3.4). */
  grossX: number
  grossY: number
  grossZ: number
  atlasOffsetMm: number
  radialErrorMm: number
  tracks: number
  windowMa: number
}

/** Helper type: a structure position in both frames. */
export interface DualFrame {
  mni: Mni
  acpc: AcPc
}
