import type { L10n, LayerId, SystemId } from '../types'

/** A point in MNI space (RAS, millimetres). */
export type Mni = [number, number, number]

/**
 * What a lesson step puts on stage. Structures are named by concept id (a
 * bilateral pair is one concept); `side` keeps only one hemisphere's copy so
 * a C-shaped structure is not hidden behind its twin.
 */
export interface StageItem {
  concept: string
  side?: 'left' | 'right'
  /** Teaching colour overriding the atlas colour for this step. */
  color?: string
}

/** Faint context: '@<system>' (gross parts of a system, e.g. '@telencephalon') or a concept. */
export interface ContextItem {
  ref: string
  side?: 'left' | 'right'
}

export interface LessonLabel {
  text: L10n
  /** Where the label's leader points, MNI mm. */
  at: Mni
  /** Optional colour dot matching the structure's teaching colour. */
  color?: string
}

export interface LessonStep {
  title: L10n
  /** The explanation: what you are looking at and how it fits together. */
  text: L10n
  /** "Eslab qol": an analogy or mnemonic that makes it stick. */
  memo?: L10n
  /** Clinical / research depth (PhD, neurosurgery). */
  deep?: L10n
  show: StageItem[]
  context?: ContextItem[]
  labels?: LessonLabel[]
  /** Camera direction from the target, MNI axes (e.g. [-1, 0, 0.2] = from the left, slightly above). */
  view: Mni
  /** Animated particles along a path: explicit MNI points, or through the centroids of concepts. */
  flow?: { path?: Mni[]; via?: { concept: string; side?: 'left' | 'right' }[]; color: string; loop?: boolean }
  /** Extra atlas layers the step needs (e.g. Julich hippocampal subfields). */
  layers?: LayerId[]
  /** A cross-section plate (data/sections id) showing this step's structures in section. */
  section?: string
  /** Self-test: tap the named structure on the model. */
  quiz?: { ask: L10n; answer: string[] }[]
}

export interface Lesson {
  id: string
  title: L10n
  /** One line under the title in the lesson list. */
  blurb: L10n
  steps: LessonStep[]
  sources: { title: string; url: string }[]
}

/** System ids allowed after '@' in a context reference. */
export type ContextSystem = SystemId
