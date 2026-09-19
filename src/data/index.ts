import raw from './parts.json'
import type { Atlas, Concept, L10n, Layer, LayerId, Part, System, SystemId } from './types'

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
  { id: 'julich', name: { en: 'Julich-Brain cytoarchitecture', uz: 'Julich-Brain sitoarxitektonikasi' }, source: 'Julich-Brain Atlas v3.1, Forschungszentrum Jülich / EBRAINS', license: 'CC BY-NC-SA 4.0', url: 'https://julich-brain-atlas.de/', parcellation: true },
  { id: 'brodmann', name: { en: 'Brodmann areas', uz: 'Brodmann maydonlari' }, source: 'Brodmann (1909) areas on Conte69, Scalable Brain Atlas, via neuroparc', license: 'free for research & education', url: 'https://scalablebrainatlas.incf.org/human/B05_on_Conte69', parcellation: true },
  { id: 'desikan', name: { en: 'Desikan-Killiany', uz: 'Desikan-Killiany' }, source: 'Desikan et al. 2006 (FreeSurfer aparc+aseg), via neuroparc', license: 'FreeSurfer licence', url: 'https://doi.org/10.1016/j.neuroimage.2006.01.021', parcellation: true },
  { id: 'destrieux', name: { en: 'Destrieux', uz: 'Destrieux' }, source: 'Destrieux et al. 2010 (FreeSurfer aparc.a2009s), via neuroparc', license: 'FreeSurfer licence', url: 'https://doi.org/10.1016/j.neuroimage.2010.06.010', parcellation: true },
  { id: 'glasser', name: { en: 'Glasser HCP-MMP1', uz: 'Glasser HCP-MMP1' }, source: 'Glasser et al. 2016, Human Connectome Project multimodal parcellation, via neuroparc', license: 'WU-Minn HCP Open Access Data Use Terms', url: 'https://doi.org/10.1038/nature18933', parcellation: true },
  { id: 'jhu', name: { en: 'JHU white-matter tracts', uz: 'JHU oq modda traktlari' }, source: 'JHU ICBM-DTI-81 white-matter labels (Mori et al.), via neuroparc', license: 'FSL licence, non-commercial', url: 'https://doi.org/10.1016/j.neuroimage.2007.12.035' },
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

// ── Depth shells (the "peel" slider) ───────────────────────────────────

export interface DepthLevel {
  rank: number
  name: L10n
}

/**
 * Anatomical shells from outside in. The peel slider strips them in this
 * order, so deep structures that are normally hidden inside the hemispheres
 * become visible without exploding or cutting the model.
 */
const SHELLS: DepthLevel[] = [
  { rank: 0, name: { en: 'Skull', uz: 'Bosh suyagi' } },
  { rank: 1, name: { en: 'Meninges & vessels', uz: 'Pardalar va tomirlar' } },
  { rank: 2, name: { en: 'Cerebral cortex', uz: "Bosh miya po'stlog'i" } },
  { rank: 3, name: { en: 'White matter', uz: 'Oq modda' } },
  { rank: 4, name: { en: 'Basal ganglia & limbic', uz: 'Bazal yadrolar va limbik' } },
  { rank: 5, name: { en: 'Ventricles', uz: 'Qorinchalar' } },
  { rank: 6, name: { en: 'Diencephalon', uz: 'Oraliq miya' } },
  { rank: 7, name: { en: 'Brainstem & cerebellum', uz: 'Miya ustuni va miyacha' } },
]

const DEEP_TELENCEPHALON = /amygdala|hippocamp|caudate|putamen|pallid|accumbens|striatum|fornix|basal forebrain|subic|dentate gyrus|\bca[123]\b|\bdg\b|hata|entorhinal|\bec\b|transsubiculum/i

function shellRank(p: Part): number {
  switch (p.system) {
    case 'skull':
      return 0
    case 'meninges':
    case 'arteries':
    case 'veins':
      return 1
    case 'telencephalon':
      return DEEP_TELENCEPHALON.test(p.name.en) ? 4 : 2
    case 'white-matter':
      return /fornix/i.test(p.name.en) ? 4 : 3
    case 'ventricles':
      return 5
    case 'diencephalon':
      return 6
    default:
      return 7
  }
}

const RANK_BY_ID = new Map(LEAF_PARTS.map((p) => [p.id, shellRank(p)]))
const PRESENT = [...new Set(RANK_BY_ID.values())].sort((a, b) => a - b)

/** Shells that actually have parts in this build, outermost first. */
export const DEPTH_LEVELS: DepthLevel[] = SHELLS.filter((s) => PRESENT.includes(s.rank))

/** Gross-anatomy cortex: hidden while a cortical parcellation stands in for it. */
export const GROSS_CORTEX_IDS = new Set(LEAF_PARTS.filter((p) => p.layer === 'gross' && RANK_BY_ID.get(p.id) === 2).map((p) => p.id))
export const PARCELLATION_IDS = new Set<LayerId>(LAYERS.filter((l) => l.parcellation).map((l) => l.id))

/** Compact shell index (0 = outermost present shell) for a leaf part. */
export function depthOf(id: string): number {
  const rank = RANK_BY_ID.get(id)
  return rank === undefined ? 0 : PRESENT.indexOf(rank)
}
