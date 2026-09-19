import raw from './parts.json'
import type { Atlas, Concept, Layer, LayerId, Part, System, SystemId } from './types'

export const SYSTEMS: System[] = [
  { id: 'telencephalon', name: { en: 'Telencephalon', uz: 'Oxirgi miya', la: 'Telencephalon' }, color: '#e0b7a8', description: { en: 'Cerebral cortex, basal ganglia and the limbic structures of the two hemispheres.', uz: "Bosh miya po'stlog'i, bazal yadrolar va ikki yarim sharning limbik tuzilmalari." } },
  { id: 'diencephalon', name: { en: 'Diencephalon', uz: "Oraliq miya", la: 'Diencephalon' }, color: '#d9a066', description: { en: 'Thalamus, hypothalamus, epithalamus and subthalamus, between the hemispheres and the brainstem.', uz: "Talamus, gipotalamus, epitalamus va subtalamus — yarim sharlar bilan miya ustuni orasida." } },
  { id: 'brainstem', name: { en: 'Brainstem', uz: 'Miya ustuni', la: 'Truncus encephali' }, color: '#c2b280', description: { en: 'Midbrain, pons and medulla oblongata.', uz: "O'rta miya, ko'prik va uzunchoq miya." } },
  { id: 'cerebellum', name: { en: 'Cerebellum', uz: 'Miyacha', la: 'Cerebellum' }, color: '#a8c5a0', description: { en: 'Cerebellar hemispheres, vermis and deep nuclei.', uz: "Miyacha yarim sharlari, chuvalchang va chuqur yadrolar." } },
  { id: 'ventricles', name: { en: 'Ventricles', uz: 'Qorinchalar', la: 'Ventriculi' }, color: '#7fb8d6', description: { en: 'The cerebrospinal-fluid spaces inside the brain.', uz: "Miya ichidagi orqa miya suyuqligi bo'shliqlari." } },
  { id: 'white-matter', name: { en: 'White matter', uz: 'Oq modda', la: 'Substantia alba' }, color: '#e8e2d6', description: { en: 'Commissures, capsules and fibre tracts.', uz: "Komissuralar, kapsulalar va tola traktlari." } },
  { id: 'cranial-nerves', name: { en: 'Cranial nerves', uz: 'Bosh miya nervlari', la: 'Nervi craniales' }, color: '#f2d06b', description: { en: 'The twelve cranial nerve pairs.', uz: "O'n ikki juft bosh miya nervi." } },
  { id: 'arteries', name: { en: 'Arteries', uz: 'Arteriyalar', la: 'Arteriae' }, color: '#d8524e', description: { en: 'Cerebral arterial supply.', uz: "Miyaning arterial qon ta'minoti." } },
  { id: 'veins', name: { en: 'Veins & sinuses', uz: 'Venalar va sinuslar', la: 'Venae et sinus' }, color: '#5f6fc4', description: { en: 'Cerebral veins and dural venous sinuses.', uz: "Miya venalari va qattiq parda venoz sinuslari." } },
  { id: 'meninges', name: { en: 'Meninges', uz: 'Miya pardalari', la: 'Meninges' }, color: '#b9a9c9', description: { en: 'Dura, arachnoid and pia mater.', uz: "Qattiq, o'rgimchak to'r va yumshoq pardalar." } },
  { id: 'skull', name: { en: 'Skull', uz: 'Bosh suyagi', la: 'Cranium' }, color: '#ded7c6', description: { en: 'Neurocranium.', uz: 'Neyrokranium.' } },
]

export const LAYERS: Layer[] = [
  { id: 'gross', name: { en: 'Gross anatomy', uz: 'Makroskopik anatomiya' }, source: 'BodyParts3D 4.3, Database Center for Life Science (Japan)', license: 'CC BY-SA 2.1 JP', url: 'https://lifesciencedb.jp/bp3d/' },
  { id: 'julich', name: { en: 'Julich-Brain cytoarchitecture', uz: 'Julich-Brain sitoarxitektonikasi' }, source: 'Julich-Brain Atlas v3.1, Forschungszentrum Jülich / EBRAINS', license: 'CC BY-NC-SA 4.0', url: 'https://julich-brain-atlas.de/' },
]

const data = raw as unknown as { bbox: Atlas['bbox']; parts: Part[] }

export const PARTS: Part[] = data.parts
export const ATLAS: Atlas = { systems: SYSTEMS, layers: LAYERS, parts: PARTS, bbox: data.bbox }

export const PART_BY_ID = new Map(PARTS.map((p) => [p.id, p]))
export const SYSTEM_BY_ID = new Map(SYSTEMS.map((s) => [s.id, s]))
export const LAYER_BY_ID = new Map(LAYERS.map((l) => [l.id, l]))

/** Systems that actually have parts in this build, in display order. */
export const ACTIVE_SYSTEMS: System[] = SYSTEMS.filter((s) => PARTS.some((p) => p.system === s.id))
export const ALL_SYSTEM_IDS: SystemId[] = ACTIVE_SYSTEMS.map((s) => s.id)
export const ALL_LAYER_IDS: LayerId[] = LAYERS.map((l) => l.id)

/** Bilateral concepts: "amygdala" → left + right amygdala; a midline part is a concept of one. */
function buildConcepts(): Concept[] {
  const byConcept = new Map<string, Part[]>()
  for (const p of PARTS) {
    const list = byConcept.get(p.concept) ?? []
    list.push(p)
    byConcept.set(p.concept, list)
  }
  const out: Concept[] = []
  for (const [id, members] of byConcept) {
    const first = members[0]
    const en = first.name.en.replace(/^(Left|Right) /, (m) => (members.length > 1 ? '' : m)).replace(/ — (left|right) /, ' ')
    out.push({ id, name: { en: en.charAt(0).toUpperCase() + en.slice(1), uz: first.name.uz, la: first.name.la }, parts: members.map((m) => m.id) })
  }
  return out
}

export const CONCEPTS: Concept[] = buildConcepts()
export const CONCEPT_BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]))

// ── Hierarchy helpers ──────────────────────────────────────────────────

const CHILDREN = new Map<string, Part[]>()
for (const p of PARTS) {
  if (!p.parent) continue
  const list = CHILDREN.get(p.parent) ?? []
  list.push(p)
  CHILDREN.set(p.parent, list)
}

export function childrenOf(id: string): Part[] {
  return CHILDREN.get(id) ?? []
}

/** Ids of every mesh-bearing descendant (or the part itself when it is a leaf). */
export function leafIds(id: string): string[] {
  const part = PART_BY_ID.get(id)
  if (!part) return []
  if (!part.group) return [id]
  return childrenOf(id).flatMap((c) => leafIds(c.id))
}

export function parentOf(id: string): Part | undefined {
  const p = PART_BY_ID.get(id)
  return p?.parent ? PART_BY_ID.get(p.parent) : undefined
}

/** Leaf ids for a concept: every member expanded through groups. */
export function conceptLeafIds(conceptId: string): string[] {
  const c = CONCEPT_BY_ID.get(conceptId)
  if (!c) return []
  return [...new Set(c.parts.flatMap((id) => leafIds(id)))]
}

/** Parts that carry geometry. */
export const LEAF_PARTS = PARTS.filter((p) => !p.group)
