import type { L10n } from '../types'

/**
 * Functional class of a structure in a cross-section schematic. Colours
 * follow the convention most whiteboard / Netter-style teaching figures use
 * (descending motor red, ascending sensory blue, cranial-nerve motor orange…)
 * so the figure reads at a glance before a single label is read.
 */
export type SectionCategory =
  | 'motor' // descending motor tracts (corticospinal, corticobulbar, rubrospinal…)
  | 'sensory' // ascending somatosensory tracts (dorsal columns, lemnisci, ALS)
  | 'cn-motor' // cranial-nerve motor nuclei and roots (GSE, SVE)
  | 'cn-sensory' // cranial-nerve sensory nuclei (GSA, SVA, GVA, SSA)
  | 'autonomic' // preganglionic parasympathetic (GVE) and autonomic hubs
  | 'cerebellar' // precerebellar nuclei, cerebellar peduncles, deep nuclei
  | 'modulatory' // reticular formation, raphe, LC, PAG, VTA — the arousal/modulatory core
  | 'relay' // thalamic, basal-ganglia and other forebrain/midbrain grey relays
  | 'hypothalamic' // hypothalamic nuclei and areas
  | 'limbic' // fornix, mammillothalamic tract, limbic connections
  | 'visual-auditory' // special-sense relays: colliculi, geniculates, optic pathway
  | 'pathway' // other fibre systems (MLF, central tegmental tract, commissures, capsules)
  | 'csf' // ventricles, aqueduct, central canal
  | 'region' // outlines of larger territories (tegmentum, basis, cortex)

/**
 * One drawable primitive, in the section's own viewBox units.
 * - `b`: closed smooth blob through the points (Catmull-Rom)
 * - `e`: ellipse, optional rotation in degrees
 * - `l`: open smooth stroke (fibre bundles, nerve roots), `w` = stroke width
 * - `p`: raw SVG path data
 */
export type Shape =
  | { t: 'b'; p: [number, number][] }
  | { t: 'e'; c: [number, number]; r: [number, number]; a?: number }
  | { t: 'l'; p: [number, number][]; w?: number; dash?: boolean }
  | { t: 'p'; d: string; closed?: boolean }

/** Shared description of a structure; one entry is reused by every section it appears in. */
export interface StructureInfo {
  name: L10n
  cat: SectionCategory
  /** What it does — afferents/efferents, transmitter, function. */
  info: L10n
  /** Lesion / clinical correlate, when there is a classic one. */
  lesion?: L10n
  /** Concept id of the matching 3D structure, if the atlas has one. */
  part?: string
}

/** A structure as drawn in one particular section. */
export interface SectionItem {
  id: string
  shapes: Shape[]
  /** Draw a mirrored copy across the vertical midline (bilateral structures). */
  mirror?: boolean
  /** Where the number badge sits; defaults to the first shape's centre. */
  at?: [number, number]
  /** Per-section qualifier appended to the shared name (e.g. "principal nucleus"). */
  note?: L10n
}

export type SectionPlane =
  /** A plane through `point` with unit `normal`, both MNI (RAS, mm). */
  { point: [number, number, number]; normal: [number, number, number] }

export interface Section {
  id: string
  /** Short badge code shown on the 3D marker ("U3", "K1"…). */
  code: string
  region: 'medulla' | 'pons' | 'midbrain' | 'diencephalon' | 'hypothalamus' | 'basal-ganglia' | 'cerebellum'
  title: L10n
  /** How the cut is oriented, for the caption. */
  orientation: L10n
  /** Plane in MNI space for the 3D marker and the 3D cut; maps have none. */
  plane?: SectionPlane
  /** Part ids (scene meshes, gross layer) whose outline traces the marker contour in 3D. */
  contour?: RegExp
  /** Which end of the outline the 3D badge hangs from; `off` (mm) staggers neighbours. */
  pin?: { side: 'front' | 'back' | 'top' | 'bottom'; off?: number; dy?: number }
  /** The level line on the mid-sagittal locator figure ([x1,y1,x2,y2] in its 0–200 box). */
  loc?: [number, number, number, number]
  /** viewBox width/height. */
  w: number
  h: number
  /** Edge labels for the figure's orientation: [top, bottom, left, right]. */
  axes: [L10n, L10n, L10n, L10n]
  /** Background outline (the section silhouette), drawn first. */
  outline: Shape[]
  /**
   * Structure id of the tissue the outline encloses (per outline shape when
   * an array): what is left between the named items — tegmentum, white
   * matter… — so no part of the figure is unassigned.
   */
  ground?: string | string[]
  /** Faint territory shading (tegmentum vs basis…) drawn under the structures; with `id` it is a clickable structure. */
  regions?: { id?: string; shapes: Shape[]; label?: L10n; at?: [number, number] }[]
  items: SectionItem[]
  /** What identifies this level at a glance. */
  landmarks: L10n
  /** Arterial supply of this level. */
  blood: L10n
  /** Lesion syndromes classically localised to this level. */
  syndromes: { name: L10n; text: L10n }[]
  /** Literature the drawing and text were checked against. */
  sources: { title: string; url: string }[]
}
