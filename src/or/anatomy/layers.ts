/**
 * Literature-sourced anatomical layer thicknesses and optical/color properties
 * from scalp skin down to cerebral cortex (AG-21 / A-3 / B-1).
 *
 * Pure data module (no scene or UI imports). Structurally matches `Sourced<T>`,
 * `Ref`, `Range`, and `L10n` from `src/or/types.ts` on `sx/main`.
 */

export interface L10n {
  uz: string
  en: string
}

export type RefId = 'hori1972' | 'lillie2016' | 'antonakakis2020' | 'protasoni2011' | 'kinaci2020' | 'zwirner2022' | 'saboori2015' | 'hutchings1986' | 'fischl2000'

export interface Ref {
  id: RefId
  label: string
  cite: string
  doi: string
  /** ISO date verified against Crossref API. */
  checked: string
}

export interface Sourced<T> {
  value: T
  refs: readonly RefId[]
  origin: 'literature' | 'derived' | 'design'
  note?: string
}

export interface Range {
  min: number
  max: number
}

export type CranialLayerId = 'skin' | 'subcutis' | 'galea' | 'pericranium' | 'skull' | 'epidural' | 'dura' | 'subdural' | 'arachnoid' | 'csf' | 'pia' | 'cortex'

export interface CranialLayerSpec {
  id: CranialLayerId
  order: number
  name: L10n
  /** Typical thickness range in millimetres. */
  thicknessMm: Sourced<Range>
  /** Nominal mean thickness in millimetres used for shell generation / cross-section UI. */
  nominalMm: Sourced<number>
  /** True for potential spaces (epidural, subdural) that are 0 mm in healthy anatomy. */
  potentialSpace: boolean
  /** Visual / PBR baseline (sRGB hex, roughness, opacity) for A-3 / A-5 / B-1 shaders. */
  appearance: {
    colorHex: string
    roughness: number
    opacity: number
    ior?: number
  }
}

export const ANATOMY_REFS: Record<RefId, Ref> = {
  hori1972: {
    id: 'hori1972',
    label: 'Hori 1972',
    cite: 'Hori H, Moretti G, Rebora A, Crovato F (1972). The Thickness of Human Scalp: Normal and Bald. J Invest Dermatol 58(6):396–399.',
    doi: '10.1111/1523-1747.ep12540633',
    checked: '2026-11-25',
  },
  lillie2016: {
    id: 'lillie2016',
    label: 'Lillie 2016',
    cite: 'Lillie EM, Urban JE, Lynch SK, Weaver AA, Stitzel JD (2016). Evaluation of Skull Cortical Thickness Changes With Age and Sex From Computed Tomography Scans. J Bone Miner Res 31(2):299–307.',
    doi: '10.1002/jbmr.2613',
    checked: '2026-11-25',
  },
  antonakakis2020: {
    id: 'antonakakis2020',
    label: 'Antonakakis 2020',
    cite: 'Antonakakis M, Schrader S, Aydin Ü, et al. (2020). Inter-Subject Variability of Skull Conductivity and Thickness in Calibrated Realistic Head Models. NeuroImage 223:117353.',
    doi: '10.1016/j.neuroimage.2020.117353',
    checked: '2026-11-25',
  },
  protasoni2011: {
    id: 'protasoni2011',
    label: 'Protasoni 2011',
    cite: 'Protasoni M, Sangiorgi S, Cividini A, et al. (2011). The collagenic architecture of human dura mater. J Neurosurg 114(6):1723–1730.',
    doi: '10.3171/2010.12.jns101732',
    checked: '2026-11-25',
  },
  kinaci2020: {
    id: 'kinaci2020',
    label: 'Kinaci 2020',
    cite: 'Kinaci A, Bergmann W, Bleys RLAW, van der Zwan A, van Doormaal TPC (2020). Histologic Comparison of the Dura Mater among Species. Comp Med 70(2):170–175.',
    doi: '10.30802/aalas-cm-19-000022',
    checked: '2026-11-25',
  },
  zwirner2022: {
    id: 'zwirner2022',
    label: 'Zwirner 2022',
    cite: 'Zwirner J, Ondruschka B, Scholze M, Hammer N (2022). Biomechanics of vascular areas of the human cranial dura mater. J Mech Behav Biomed Mater 125:104866.',
    doi: '10.1016/j.jmbbm.2021.104866',
    checked: '2026-11-25',
  },
  saboori2015: {
    id: 'saboori2015',
    label: 'Saboori 2015',
    cite: 'Saboori P, Sadegh A (2015). Histology and Morphology of the Brain Subarachnoid Trabeculae. Anat Res Int 2015:279814.',
    doi: '10.1155/2015/279814',
    checked: '2026-11-25',
  },
  hutchings1986: {
    id: 'hutchings1986',
    label: 'Hutchings 1986',
    cite: 'Hutchings M, Weller RO (1986). Anatomical relationships of the pia mater to cerebral blood vessels in man. J Neurosurg 65(3):316–325.',
    doi: '10.3171/jns.1986.65.3.0316',
    checked: '2026-11-25',
  },
  fischl2000: {
    id: 'fischl2000',
    label: 'Fischl 2000',
    cite: 'Fischl B, Dale AM (2000). Measuring the thickness of the human cerebral cortex from magnetic resonance images. PNAS 97(20):11050–11055.',
    doi: '10.1073/pnas.200033797',
    checked: '2026-11-25',
  },
}

/** Ordered superficially (skin) to deep (cerebral cortex). */
export const CRANIAL_LAYERS: readonly CranialLayerSpec[] = [
  {
    id: 'skin',
    order: 1,
    name: { uz: 'Teri (epidermis + dermis)', en: 'Skin (epidermis + dermis)' },
    thicknessMm: { value: { min: 1.5, max: 4.0 }, refs: ['hori1972', 'antonakakis2020'], origin: 'literature' },
    nominalMm: { value: 2.5, refs: ['hori1972'], origin: 'literature' },
    potentialSpace: false,
    appearance: { colorHex: '#d8a88c', roughness: 0.62, opacity: 1.0 },
  },
  {
    id: 'subcutis',
    order: 2,
    name: { uz: "Teri osti yog' qatlami", en: 'Subcutaneous adipose tissue' },
    thicknessMm: { value: { min: 1.5, max: 5.5 }, refs: ['hori1972', 'antonakakis2020'], origin: 'literature' },
    nominalMm: { value: 3.0, refs: ['hori1972'], origin: 'literature' },
    potentialSpace: false,
    appearance: { colorHex: '#e4be6a', roughness: 0.4, opacity: 1.0 },
  },
  {
    id: 'galea',
    order: 3,
    name: { uz: "Galea aponeurotica va bo'sh biriktiruvchi to'qima", en: 'Galea aponeurotica & loose areolar tissue' },
    thicknessMm: { value: { min: 0.8, max: 2.5 }, refs: ['hori1972'], origin: 'literature' },
    nominalMm: { value: 1.4, refs: ['hori1972'], origin: 'literature' },
    potentialSpace: false,
    appearance: { colorHex: '#dfd8ce', roughness: 0.45, opacity: 1.0 },
  },
  {
    id: 'pericranium',
    order: 4,
    name: { uz: 'Perikranium (suyak usti pardasi)', en: 'Pericranium (periosteum)' },
    thicknessMm: { value: { min: 0.2, max: 0.5 }, refs: ['hori1972', 'lillie2016'], origin: 'literature' },
    nominalMm: { value: 0.35, refs: ['hori1972'], origin: 'literature' },
    potentialSpace: false,
    appearance: { colorHex: '#e6d8cc', roughness: 0.35, opacity: 1.0 },
  },
  {
    id: 'skull',
    order: 5,
    name: { uz: 'Bosh suyagi (tashqi / diploe / ichki plastinka)', en: 'Calvaria (outer table / diploe / inner table)' },
    thicknessMm: { value: { min: 4.5, max: 9.0 }, refs: ['lillie2016', 'antonakakis2020'], origin: 'literature', note: 'Atlas Kocher point measured 6.03 mm' },
    nominalMm: { value: 6.0, refs: ['lillie2016', 'antonakakis2020'], origin: 'literature' },
    potentialSpace: false,
    appearance: { colorHex: '#e8e0cf', roughness: 0.55, opacity: 1.0 },
  },
  {
    id: 'epidural',
    order: 6,
    name: { uz: "Epidural bo'shliq (potentsial)", en: 'Epidural space (potential)' },
    thicknessMm: { value: { min: 0, max: 0 }, refs: ['protasoni2011'], origin: 'literature' },
    nominalMm: { value: 0, refs: ['protasoni2011'], origin: 'literature' },
    potentialSpace: true,
    appearance: { colorHex: '#331c1c', roughness: 0.5, opacity: 0 },
  },
  {
    id: 'dura',
    order: 7,
    name: { uz: 'Qattiq parda (dura mater)', en: 'Dura mater' },
    thicknessMm: { value: { min: 0.3, max: 1.1 }, refs: ['protasoni2011', 'kinaci2020', 'zwirner2022'], origin: 'literature' },
    nominalMm: { value: 0.6, refs: ['protasoni2011', 'kinaci2020'], origin: 'literature' },
    potentialSpace: false,
    appearance: { colorHex: '#dcd8d2', roughness: 0.4, opacity: 1.0 },
  },
  {
    id: 'subdural',
    order: 8,
    name: { uz: "Subdural bo'shliq (potentsial)", en: 'Subdural space (potential)' },
    thicknessMm: { value: { min: 0, max: 0 }, refs: ['protasoni2011'], origin: 'literature', note: '3D shells keep >=0.15 mm clearance to avoid z-fighting' },
    nominalMm: { value: 0, refs: ['protasoni2011'], origin: 'literature' },
    potentialSpace: true,
    appearance: { colorHex: '#282c34', roughness: 0.5, opacity: 0 },
  },
  {
    id: 'arachnoid',
    order: 9,
    name: { uz: "O'rgimchak to'r parda (arachnoid mater)", en: 'Arachnoid mater' },
    thicknessMm: { value: { min: 0.08, max: 0.2 }, refs: ['saboori2015'], origin: 'literature' },
    nominalMm: { value: 0.15, refs: ['saboori2015'], origin: 'literature' },
    potentialSpace: false,
    appearance: { colorHex: '#dce6f0', roughness: 0.18, opacity: 0.28 },
  },
  {
    id: 'csf',
    order: 10,
    name: { uz: 'Subaraxnoidal likvor (CSF)', en: 'Subarachnoid CSF' },
    thicknessMm: {
      value: { min: 0.8, max: 5.0 },
      refs: ['antonakakis2020', 'saboori2015'],
      origin: 'literature',
      note: 'Thinner over gyral crowns (~1 mm), deeper in sulci (2.5–5 mm)',
    },
    nominalMm: { value: 2.0, refs: ['antonakakis2020'], origin: 'literature' },
    potentialSpace: false,
    appearance: { colorHex: '#c8e4f4', roughness: 0.05, opacity: 0.22, ior: 1.335 },
  },
  {
    id: 'pia',
    order: 11,
    name: { uz: 'Yumshoq parda (pia mater)', en: 'Pia mater' },
    thicknessMm: { value: { min: 0.015, max: 0.05 }, refs: ['hutchings1986'], origin: 'literature' },
    nominalMm: { value: 0.04, refs: ['hutchings1986'], origin: 'literature', note: '0.04 mm mesh offset within 0.015–0.05 mm range' },
    potentialSpace: false,
    appearance: { colorHex: '#f0d8d4', roughness: 0.1, opacity: 0.18 },
  },
  {
    id: 'cortex',
    order: 12,
    name: { uz: "Miya po'stlog'i (kulrang modda)", en: 'Cerebral cortex (gray matter)' },
    thicknessMm: { value: { min: 1.5, max: 4.5 }, refs: ['fischl2000'], origin: 'literature' },
    nominalMm: { value: 2.5, refs: ['fischl2000'], origin: 'literature' },
    potentialSpace: false,
    appearance: { colorHex: '#d9a59c', roughness: 0.24, opacity: 1.0 },
  },
] as const

export const CRANIAL_LAYER_BY_ID: Readonly<Record<CranialLayerId, CranialLayerSpec>> = Object.fromEntries(CRANIAL_LAYERS.map((l) => [l.id, l])) as Record<
  CranialLayerId,
  CranialLayerSpec
>

/** Total nominal depth from skin surface to cortical pial surface (mm). */
export const NOMINAL_SKIN_TO_CORTEX_MM: Sourced<number> = {
  value: CRANIAL_LAYERS.filter((l) => l.id !== 'cortex').reduce((sum, l) => sum + l.nominalMm.value, 0),
  refs: ['hori1972', 'lillie2016', 'antonakakis2020', 'protasoni2011', 'saboori2015', 'hutchings1986'],
  origin: 'derived',
  note: 'Sum of nominal superficial-to-pial layer thicknesses (~16.0 mm over gyral crown)',
}
