import type { Section, StructureInfo } from './types'
import { MEDULLA } from './medulla'
import { PONS } from './pons'
import { MIDBRAIN } from './midbrain'
import { DIENCEPHALON } from './diencephalon'
import { CEREBELLUM } from './cerebellum'
import { BASAL } from './basal'
import { STRUCTURES } from './structures'

export type { Section, SectionItem, StructureInfo, SectionCategory, Shape } from './types'

/** Every cross-section, caudal → rostral, then diencephalon, basal ganglia and cerebellum. */
export const SECTIONS: Section[] = [...MEDULLA, ...PONS, ...MIDBRAIN, ...DIENCEPHALON, ...BASAL, ...CEREBELLUM]
export const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]))
export const STRUCTURE_BY_ID: Map<string, StructureInfo> = new Map(Object.entries(STRUCTURES))

export const SECTION_REGIONS: { id: Section['region']; name: { en: string; uz: string } }[] = [
  { id: 'medulla', name: { en: 'Medulla', uz: 'Uzunchoq miya' } },
  { id: 'pons', name: { en: 'Pons', uz: "Ko'prik" } },
  { id: 'midbrain', name: { en: 'Midbrain', uz: "O'rta miya" } },
  { id: 'diencephalon', name: { en: 'Thalamus', uz: 'Talamus' } },
  { id: 'hypothalamus', name: { en: 'Hypothalamus', uz: 'Gipotalamus' } },
  { id: 'basal-ganglia', name: { en: 'Basal ganglia', uz: 'Bazal yadrolar' } },
  { id: 'cerebellum', name: { en: 'Cerebellum', uz: 'Miyacha' } },
]

/** Scene-space (MNI → (−x, z, y)) plane of a section, or null for maps. */
export function scenePlane(s: Section): { point: [number, number, number]; normal: [number, number, number] } | null {
  if (!s.plane) return null
  const [px, py, pz] = s.plane.point
  const [nx, ny, nz] = s.plane.normal
  return { point: [-px, pz, py], normal: [-nx, nz, ny] }
}

