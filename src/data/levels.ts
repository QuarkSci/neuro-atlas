import { LEAF_PARTS, coveredIds } from './index'
import type { L10n, LayerId, Part, SystemId } from './types'

/**
 * A classically-taught transverse (axial) cross-section level: the MNI z
 * (superior–inferior, mm) at which neuroanatomy courses conventionally cut
 * a structure to show its internal nuclei/tract layout in one plane. The
 * count per structure follows the standard teaching convention (medulla at
 * three levels, pons at two — Haines' *Neuroanatomy in Clinical Context*;
 * Blumenfeld's *Neuroanatomy through Clinical Cases*); the z mm values
 * themselves are read off this atlas's own MNI152-registered geometry
 * (Allen Human Reference Atlas / neuroparc), not traced from a textbook
 * figure, so "structures at this level" below is computed from real data.
 */
export interface AxialLevel {
  id: string
  system: SystemId
  /** The structure this level belongs to, for grouping in the UI. */
  structureId: string
  structureName: L10n
  name: L10n
  /** MNI z, millimetres (RAS), approximate — textbook levels are not stereotaxic points. */
  mm: number
}

export const LEVELS: AxialLevel[] = [
  {
    id: 'medulla-caudal',
    system: 'brainstem',
    structureId: 'bs-medulla',
    structureName: { en: 'Medulla oblongata', uz: 'Uzunchoq miya' },
    name: { en: 'Caudal level — pyramidal decussation', uz: 'Kaudal daraja — piramida dekussatsiyasi' },
    mm: -66,
  },
  {
    id: 'medulla-mid',
    system: 'brainstem',
    structureId: 'bs-medulla',
    structureName: { en: 'Medulla oblongata', uz: 'Uzunchoq miya' },
    name: { en: 'Mid level — inferior olive (classic)', uz: "O'rta daraja — pastki zaytun (klassik)" },
    mm: -54,
  },
  {
    id: 'medulla-rostral',
    system: 'brainstem',
    structureId: 'bs-medulla',
    structureName: { en: 'Medulla oblongata', uz: 'Uzunchoq miya' },
    name: { en: 'Rostral level — pontomedullary junction', uz: "Rostral daraja — ko'prik-uzunchoq miya chegarasi" },
    mm: -43,
  },
  {
    id: 'pons-caudal',
    system: 'brainstem',
    structureId: 'bs-pons',
    structureName: { en: 'Pons', uz: "Ko'prik" },
    name: { en: 'Caudal level — facial colliculus', uz: 'Kaudal daraja — yuz do\'ngligi' },
    mm: -30,
  },
  {
    id: 'pons-rostral',
    system: 'brainstem',
    structureId: 'bs-pons',
    structureName: { en: 'Pons', uz: "Ko'prik" },
    name: { en: 'Rostral level — trigeminal nerve', uz: 'Rostral daraja — uch shoxli nerv' },
    mm: -18,
  },
  {
    id: 'midbrain-caudal',
    system: 'brainstem',
    structureId: 'bs-midbrain',
    structureName: { en: 'Midbrain', uz: "O'rta miya" },
    name: { en: 'Caudal level — inferior colliculus', uz: 'Kaudal daraja — pastki do\'nglik' },
    mm: -13,
  },
  {
    id: 'midbrain-rostral',
    system: 'brainstem',
    structureId: 'bs-midbrain',
    structureName: { en: 'Midbrain', uz: "O'rta miya" },
    name: { en: 'Rostral level — superior colliculus', uz: 'Rostral daraja — yuqori do\'nglik' },
    mm: -5,
  },
  {
    id: 'thalamus-mid',
    system: 'diencephalon',
    structureId: 'g-left-thalamus',
    structureName: { en: 'Thalamus', uz: 'Talamus' },
    name: { en: 'Mid-thalamic level', uz: "O'rta talamik daraja" },
    mm: 6,
  },
]

/** Brain systems levels are meaningful for (skull/meninges/vessels clutter the list). */
const LEVEL_SYSTEMS = new Set<SystemId>(['brainstem', 'cerebellum', 'diencephalon', 'telencephalon', 'white-matter'])

/** MNI mm extent of the brain proper, per clip axis — the sliders' min/max. */
export const CLIP_RANGE: Record<'sagittal' | 'coronal' | 'axial', [number, number]> = (() => {
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity,
    z0 = Infinity,
    z1 = -Infinity
  for (const p of LEAF_PARTS) {
    if (!p.bbox || !LEVEL_SYSTEMS.has(p.system)) continue
    x0 = Math.min(x0, p.bbox[0][0])
    x1 = Math.max(x1, p.bbox[1][0])
    y0 = Math.min(y0, p.bbox[0][1])
    y1 = Math.max(y1, p.bbox[1][1])
    z0 = Math.min(z0, p.bbox[0][2])
    z1 = Math.max(z1, p.bbox[1][2])
  }
  return { sagittal: [x0, x1], coronal: [y0, y1], axial: [z0, z1] }
})()

/**
 * Leaf parts whose bounding box spans the given MNI z (mm), restricted to
 * what is actually on screen (visible systems, enabled layers, not covered
 * by a finer layer) — so the list matches what the axial clip plane reveals.
 */
export function partsAtAxialLevel(mm: number, visible: SystemId[], layers: LayerId[]): Part[] {
  const visibleSet = new Set(visible)
  const layerSet = new Set(layers)
  const hidden = coveredIds(layers)
  return LEAF_PARTS.filter(
    (p) => p.bbox && LEVEL_SYSTEMS.has(p.system) && visibleSet.has(p.system) && layerSet.has(p.layer) && !hidden.has(p.id) && p.bbox[0][2] <= mm && p.bbox[1][2] >= mm,
  ).sort((a, b) => a.name.en.localeCompare(b.name.en))
}
