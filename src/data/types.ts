/**
 * Three-language text. `en` is always present (it is what the source atlases
 * ship); `uz` and `la` (Terminologia Anatomica) are filled in by the content
 * pass and fall back to `en` until then.
 */
export interface L10n {
  en: string
  uz?: string
  la?: string
}

export type SystemId =
  | 'telencephalon'
  | 'diencephalon'
  | 'brainstem'
  | 'cerebellum'
  | 'ventricles'
  | 'white-matter'
  | 'cranial-nerves'
  | 'arteries'
  | 'veins'
  | 'meninges'
  | 'skull'

/**
 * Which atlas a mesh comes from. Layers overlap in space (a Julich area sits
 * inside a BodyParts3D gyrus), so they are toggled independently of systems.
 */
export type LayerId = 'gross' | 'julich' | 'brodmann' | 'desikan' | 'destrieux' | 'glasser' | 'jhu' | 'bstem' | 'suit'

export type Side = 'left' | 'right' | 'midline'

export interface System {
  id: SystemId
  name: L10n
  /** Accent used for UI dots and part materials. */
  color: string
  description: L10n
}

export interface Layer {
  id: LayerId
  name: L10n
  /** Chip label in the layers row; the first word of `name` when absent. */
  short?: L10n
  /** Cortical parcellations tile the same surface, so only one shows at a time. */
  parcellation?: boolean
  /**
   * Gross parts this layer stands in for while it is on: a parcellation
   * replaces the gross cortex, the brainstem layer the solid pons/medulla
   * halves, the cerebellar layer the two gross hemispheres.
   */
  covers?: RegExp
  /** One-line provenance shown in the inspector and the about panel. */
  source: string
  license: string
  url: string
}

export interface Source {
  title: string
  url: string
}

export interface Part {
  id: string
  name: L10n
  system: SystemId
  layer: LayerId
  side: Side
  /** Parent part id for the hierarchy tree (an area → its nucleus/gyrus group). */
  parent?: string
  /** Assembly with no geometry of its own; selecting it selects its children. */
  group?: boolean
  /** Bilateral pairs share a concept (left + right amygdala → "amygdala"). */
  concept: string
  /** Mesh file relative to the meshes root; absent for groups. */
  mesh?: string
  /** MNI152 millimetres, RAS. */
  centroid?: [number, number, number]
  bbox?: [[number, number, number], [number, number, number]]
  faces?: number
  /** Atlas-native identifiers (FMA id for BodyParts3D, label index for Julich). */
  ref?: string
  /** Mesh provenance when a layer mixes atlases (brainstem: Allen vs AAN); the layer's source otherwise. */
  meshSource?: { title: string; url: string }
  description?: L10n
  /** Function / clinical relevance, filled by the content pass. */
  role?: L10n
  clinical?: L10n
  facts?: L10n[]
  sources?: Source[]
  /** Set when description/role/clinical were inherited from a family or group entry. */
  inheritedContent?: boolean
}

export interface Concept {
  id: string
  name: L10n
  /** Search aliases (abbreviations, alternative spellings, Uzbek/Latin variants). */
  aliases?: string[]
  parts: string[]
}

export interface Atlas {
  systems: System[]
  layers: Layer[]
  parts: Part[]
  /** Overall bounds in MNI mm, for camera framing. */
  bbox: [[number, number, number], [number, number, number]]
}
