import type { L10n } from '@/data/types'
import { SECTION_BY_ID } from '@/data/sections'
import type { LesionLevel } from '@/data/pathways'
import { itemShapes, shapePolygon } from './sectionLayout'
import { insidePolygon, shapeSamples } from './lesionTerritory'
import type { FocalLesion, FocalResult } from './lesionFocal'

/**
 * Multiple sclerosis criteria over the free lesions: the lesions the user
 * drops on the plates, each with a time (months from the first attack) and
 * gadolinium enhancement, are sorted into the McDonald CNS areas and read
 * for dissemination in space (DIS) and in time (DIT).
 *
 * - 2017: Thompson AJ et al., Lancet Neurol 2018;17:162–173,
 *   doi:10.1016/S1474-4422(17)30470-2 — DIS ≥1 T2 lesion in ≥2 of 4 areas;
 *   DIT = Gd+ and Gd− lesions together, a new lesion on follow-up, or CSF
 *   oligoclonal bands; attacks × lesions decide what is still needed.
 * - 2024: Montalban X et al., Lancet Neurol 2025;24:850–865,
 *   doi:10.1016/S1474-4422(25)00270-4 — optic nerve is a fifth area; DIS in
 *   ≥4 areas suffices; in 2–3 areas DIS plus DIT, positive CSF (OCB/κFLC) or
 *   an MRI biomarker (central vein sign, paramagnetic rim lesion); a
 *   radiologically isolated syndrome can qualify. Shown in simplified form.
 *
 * Only what the plates can show is classified automatically (brainstem →
 * infratentorial; forebrain plates → periventricular when the lesion touches
 * the lateral ventricle, juxtacortical when it touches the insular cortex,
 * else deep — which counts for no area). The spinal cord, cortex elsewhere
 * and the optic nerve are entered as findings outside the plates.
 */
export type McArea = 'pv' | 'ctx' | 'it' | 'sc' | 'on'

export const MC_AREAS: { id: McArea; name: L10n; v2017: boolean }[] = [
  { id: 'pv', name: { en: 'Periventricular', uz: 'Periventrikulyar' }, v2017: true },
  { id: 'ctx', name: { en: 'Cortical / juxtacortical', uz: "Po'stloq / po'stloq yoni" }, v2017: true },
  { id: 'it', name: { en: 'Infratentorial', uz: 'Infratentorial' }, v2017: true },
  { id: 'sc', name: { en: 'Spinal cord', uz: 'Orqa miya' }, v2017: true },
  { id: 'on', name: { en: 'Optic nerve', uz: "Ko'ruv nervi" }, v2017: false },
]

/** Findings beyond the plates. */
export interface McExtra {
  /** T2 lesion in the spinal cord on MRI. */
  cord: boolean
  /** Cortical lesion away from the plates. */
  cortex: boolean
  /** Optic nerve involvement (MRI, OCT or VEP) — a DIS area in 2024 only. */
  optic: boolean
  /** Optic neuritis was a clinical attack (adds an attack, not a lesion on the plates). */
  opticAttack: boolean
  /** CSF-specific oligoclonal bands (2024: or raised κ free light chains). */
  csf: boolean
  /** Central vein sign / paramagnetic rim lesion (2024 MRI biomarkers). */
  cvs: boolean
}

export const NO_EXTRA: McExtra = { cord: false, cortex: false, optic: false, opticAttack: false, csf: false, cvs: false }

const INFRA: LesionLevel[] = ['midbrain', 'pons', 'medulla-rostral', 'medulla-caudal']

/** Smallest lesion McDonald counts: 3 mm in long axis. */
export const MIN_DIAMETER_MM = 3

export interface McLesion {
  i: number
  t: number
  gd: boolean
  area: McArea | 'deep'
  /** Gives a clinical deficit (some tract or cranial sign) — a symptomatic lesion. */
  symptomatic: boolean
  /** ≥3 mm: counts as an MS-type T2 lesion. */
  counts: boolean
}

export interface McResult {
  lesions: McLesion[]
  /** Clinical attacks: distinct times with a new symptomatic lesion (+ optic neuritis). */
  attacks: number
  /** Distinct symptomatic lesions — objective clinical evidence. */
  clinical: number
  areas2017: McArea[]
  areas2024: McArea[]
  dis2017: boolean
  /** Why DIT holds (empty: it does not). */
  dit: ('gd' | 'new' | 'csf' | 'attacks')[]
  /** 2017 verdict and what is missing. */
  v2017: { ms: boolean; need: ('dis' | 'dit' | 'attack')[]; ris: boolean }
  v2024: { ms: boolean; need: ('dis' | 'support')[] }
  /** MS-atypical features: a better explanation must be excluded first. */
  flags: ('tumefactive' | 'vascular')[]
}

/** Shortest distance from a point to an item's drawn outline on the plate, in plate units (0 inside). */
function distTo(plate: string, id: string, x: number, y: number): number {
  const s = SECTION_BY_ID.get(plate)
  const it = s?.items.find((i) => i.id === id)
  if (!s || !it) return Infinity
  let d = Infinity
  for (const sh of itemShapes(s, it)) {
    const poly = shapePolygon(sh)
    if (poly && insidePolygon(poly, x, y)) return 0
    for (const [px, py] of shapeSamples(sh)) d = Math.min(d, Math.hypot(px - x, py - y))
  }
  return d
}

/** The McDonald area of one lesion on its plate. */
export function mcArea(f: FocalLesion, r: FocalResult): McArea | 'deep' {
  if (INFRA.includes(r.level)) return 'it'
  // Touching (or within 1 mm of) the lateral ventricle / the insular cortex.
  const margin = r.rUnits + (r.mmPerUnit ? 1 / r.mmPerUnit : 0)
  if (distTo(f.plate, 'lv', f.x, f.y) <= margin) return 'pv'
  if (distTo(f.plate, 'ins', f.x, f.y) <= margin) return 'ctx'
  return 'deep'
}

/** Centre of an item's copy on the patient's left (the figure's right half). */
function itemCentre(plate: string, id: string): [number, number] | null {
  const s = SECTION_BY_ID.get(plate)
  const it = s?.items.find((i) => i.id === id)
  if (!s || !it) return null
  const polys = itemShapes(s, it)
    .map((sh) => shapePolygon(sh) ?? [])
    .filter((q) => q.length)
  const mean = (q: [number, number][], k: 0 | 1) => q.reduce((a, b) => a + b[k], 0) / q.length
  const q = polys.find((q) => mean(q, 0) > s.w / 2) ?? polys[0]
  return q ? [mean(q, 0), mean(q, 1)] : null
}

/**
 * A teaching case: internuclear ophthalmoplegia from an enhancing MLF plaque
 * in the rostral pons (the first attack), a silent periventricular lesion on the same scan, and a
 * new juxtacortical lesion at six months — DIS and DIT both met.
 */
export function msCase(): FocalLesion[] {
  // The MLF in the rostral pons (K3), 3 mm across: a pure left INO — at the facial colliculus (K1) the same disc
  // would also take the VI nucleus and the facial genu (a one-and-a-half syndrome).
  const spec: [string, string, number, boolean, number][] = [
    ['pons-isthmus', 'mlf', 0, true, 1.5],
    ['bg-commissural', 'lv', 0, false, 2.5],
    ['bg-pallidal', 'ins', 6, false, 2.5],
  ]
  return spec.flatMap(([plate, id, t, gd, rMm]) => {
    const c = itemCentre(plate, id)
    return c ? [{ plate, x: c[0], y: c[1], rMm, t, gd }] : []
  })
}

export function mcdonald(foci: FocalLesion[], each: (FocalResult | null)[], extra: McExtra): McResult {
  const lesions: McLesion[] = []
  foci.forEach((f, i) => {
    const r = each[i]
    if (!r) return
    const symptomatic = Object.values(r.sig).some((s) => s !== 'none') || r.signs.length > 0
    lesions.push({ i, t: f.t ?? 0, gd: !!f.gd, area: mcArea(f, r), symptomatic, counts: f.rMm * 2 >= MIN_DIAMETER_MM })
  })
  const counted = lesions.filter((x) => x.counts)

  const has = new Set<McArea>(counted.flatMap((x) => (x.area === 'deep' ? [] : [x.area])))
  if (extra.cord) has.add('sc')
  if (extra.cortex) has.add('ctx')
  if (extra.optic) has.add('on')
  const areas2024 = MC_AREAS.filter((a) => has.has(a.id)).map((a) => a.id)
  const areas2017 = areas2024.filter((a) => a !== 'on')

  // Attacks: each time a new symptomatic lesion appears; optic neuritis is one more.
  const attackTimes = new Set(lesions.filter((x) => x.symptomatic).map((x) => x.t))
  const attacks = attackTimes.size + (extra.opticAttack ? 1 : 0)
  const clinical = lesions.filter((x) => x.symptomatic).length + (extra.opticAttack ? 1 : 0)

  const dit: McResult['dit'] = []
  const times = [...new Set(counted.map((x) => x.t))]
  // On one scan: a new enhancing lesion next to one that no longer enhances (older, or simply Gd−).
  if (times.some((t) => counted.some((x) => x.t === t && x.gd) && counted.some((x) => x.t < t || (x.t === t && !x.gd)))) dit.push('gd')
  if (times.length > 1) dit.push('new')
  if (extra.csf) dit.push('csf')
  if (attacks >= 2) dit.push('attacks')

  const dis2017 = areas2017.length >= 2
  const ditMri = dit.some((d) => d !== 'attacks')
  const need2017: McResult['v2017']['need'] = []
  if (attacks === 0) {
    if (!dis2017) need2017.push('dis')
    need2017.push('attack')
  } else if (attacks >= 2) {
    if (clinical < 2 && !dis2017) need2017.push('dis')
  } else {
    if (clinical < 2 && !dis2017) need2017.push('dis')
    if (!ditMri) need2017.push('dit')
  }
  const ris = attacks === 0 && dis2017

  const n = areas2024.length
  const need2024: McResult['v2024']['need'] = []
  if (n < 2) need2024.push('dis')
  else if (n < 4 && !(ditMri || attacks >= 2 || extra.cvs)) need2024.push('support')

  const flags: McResult['flags'] = []
  if (foci.some((f) => f.rMm * 2 > 20)) flags.push('tumefactive')
  // All at once, each larger than a plaque and filling an arterial territory: a stroke (or emboli) until proven otherwise.
  if (lesions.length && times.length <= 1 && lesions.every((x) => foci[x.i].rMm * 2 >= 8 && (each[x.i]!.zones[0]?.overlap ?? 0) >= 0.8)) flags.push('vascular')

  return {
    lesions,
    attacks,
    clinical,
    areas2017,
    areas2024,
    dis2017,
    dit,
    v2017: { ms: need2017.length === 0, need: need2017, ris },
    v2024: { ms: need2024.length === 0 && counted.length > 0, need: need2024 },
    flags,
  }
}
