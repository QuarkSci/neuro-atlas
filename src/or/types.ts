/**
 * Shared contract types for the operating-room procedures (SX-3 EVD, SX-6 DBS, SX-4 drill).
 * Owned by CC. AGY fills data / UI against these and does not change them (write the need into the handoff instead).
 *
 * COORDINATES. Every position in a contract is **MNI millimetres** `[x, y, z]`: +x right, +y anterior, +z superior
 * (the same space as `src/data/parts.json` centroids). The 3D scene uses (−x, z, y); convert with `mniToScene` / `sceneToMni`.
 */

export type Mni = readonly [number, number, number]

export const mniToScene = (p: Mni): [number, number, number] => [-p[0], p[2], p[1]]
export const sceneToMni = (p: Mni): [number, number, number] => [-p[0], p[2], p[1]]

/** Two-language text. uz is the primary language; en may be empty only in data that is never shown. */
export interface L10n {
  uz: string
  en: string
}

/** Id of a verified reference, a key into the procedure's `REFS` table (`EvdRef` / `DbsRef`). */
export type RefId = string

export interface Ref {
  id: RefId
  /** "Fried 2016" style short label shown in the UI. */
  label: string
  /** Full citation as in the AG-9 documents. */
  cite: string
  doi?: string
  pmid?: string
  /** Date the DOI / PMID was checked against Crossref / eutils (ISO). */
  checked: string
}

/**
 * Every number in the data carries where it comes from. `refs` may be empty ONLY when `origin` is `'derived'`
 * (computed from the atlas meshes, e.g. a centroid) or `'design'` (a simulator choice, e.g. a UI threshold);
 * a clinical number without a ref is a data error (the audit script fails on it).
 */
export interface Sourced<T> {
  value: T
  refs: readonly RefId[]
  origin: 'literature' | 'derived' | 'design'
  /** Optional note, e.g. "range 100–120 mm". */
  note?: string
}

/** Closed numeric range. */
export interface Range {
  min: number
  max: number
}

/** Training warning that every procedure screen shows (SURGERY.md 0.3). */
export interface Disclaimer {
  text: L10n
}

/** A 1/3/5 style score band for one metric: the value is graded by the first band whose `upTo` it does not exceed. */
export interface ScoreBand {
  /** Upper bound of this band (inclusive); `Infinity` for the last one. */
  upTo: number
  /** OSATS-style score, 1 (poor) … 5 (excellent). */
  score: 1 | 3 | 5
  label: L10n
}

/** Where a metric is better when lower (`'low'`) or when inside a window (`'window'`). */
export interface MetricSpec {
  id: string
  name: L10n
  unit: string
  better: 'low' | 'high' | 'window'
  /** For 'low' / 'high': bands in order of the best first. For 'window': see `window`. */
  bands: readonly ScoreBand[]
  /** For 'window' metrics, e.g. depth 55–65 mm = 5, 50–55 / 65–70 = 3, otherwise 1. */
  window?: { best: Range; ok: Range }
  refs: readonly RefId[]
  origin: Sourced<unknown>['origin']
}

export type Severity = 'fatal' | 'major' | 'minor' | 'info'
