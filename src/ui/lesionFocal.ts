import type { Section, Shape } from '@/data/sections'
import { SECTION_BY_ID, STRUCTURE_BY_ID } from '@/data/sections'
import { CRANIAL_SIGNS, LEVEL_BY_ID, type LesionZone } from '@/data/lesions'
import { PATHWAYS, type BodySide, type LesionLevel } from '@/data/pathways'
import frames from '../../pipeline/section_frames.json'
import affine from '../../pipeline/plate_affine.json'
import { itemShapes, polygonArea, sectionEntries, shapePolygon } from './sectionLayout'
import { plateLevel } from './pathTrace'
import { insidePolygon, plateShows, shapeSamples, zoneOn, type TerritoryOnPlate } from './lesionTerritory'
import type { SignHit } from './lesionSigns'

type P = [number, number]

/**
 * A free lesion: a disc the user drops anywhere on a transverse plate,
 * instead of picking a whole vascular territory. Everything the simulator
 * says about it is read off the plate itself — the structures under the
 * disc, on which side of the midline — with the same pathway stations
 * (data/pathways) and cranial signs (data/lesions) the territory mode uses.
 * So a small lacune can be shown to catch the lemniscus but not the
 * pyramid, or to cross the midline and give bilateral signs.
 *
 * Scale: the plates are schematic, so a millimetre is estimated per plate
 * from the atlas cut of the same level (pipeline/section_frames.json: the
 * level's own meshes plus a 5 mm margin each side) over the drawn
 * silhouette's width. It is an approximation and is shown as "≈".
 */
export interface FocalLesion {
  plate: string
  /** Centre in plate units. */
  x: number
  y: number
  /** Radius in mm. */
  rMm: number
  /** When it appeared, months from the first lesion (time axis; default 0). */
  t?: number
  /** Gadolinium-enhancing on MRI (an active lesion, weeks old). */
  gd?: boolean
}

export interface FocalHit {
  id: string
  /** Patient side(s) of the structure the disc takes in. */
  sides: BodySide[]
  /** Share of the structure (its outline samples, on the hit side) inside the disc, 0–1. */
  share: number
}

export interface FocalZone {
  zone: LesionZone
  side: BodySide
  /** Share of the disc inside the zone, 0–1. */
  overlap: number
}

export interface FocalResult {
  level: LesionLevel
  /** Patient side of the centre; 'B' when the disc crosses the midline. */
  side: BodySide | 'B'
  rUnits: number
  /** mm per plate unit (estimated), null when the plate has no atlas frame. */
  mmPerUnit: number | null
  hits: FocalHit[]
  sig: Record<string, BodySide | 'none' | 'B'>
  signs: SignHit[]
  /** Classic territories the disc lies in, most overlap first. */
  zones: FocalZone[]
  territory: TerritoryOnPlate
}

/**
 * Fibres in transit at a level they have no station of their own on: the
 * thalamocortical radiation (DCML, ALS and trigeminal third neurons) runs
 * through the posterior limb, drawn there as the limb and the radiation.
 */
const TRANSIT: Partial<Record<LesionLevel, string[]>> = { capsule: ['ic-pl', 'tcr'] }

/** The atlas cut of each plate (scripts/export-section-frames.mjs): MNI = origin + a·u + b·v, window [a0, b0, a1, b1]. */
interface Frame {
  id: string
  origin: number[]
  u: number[]
  v: number[]
  window: number[]
}
const FRAMES = new Map((frames as Frame[]).map((f) => [f.id, f]))
const DEFAULT_UNITS_PER_MM = 8

/** Estimated mm per plate unit: the atlas cut's width over the silhouette's. */
export function mmPerUnit(section: Section): number | null {
  const w = FRAMES.get(section.id)?.window
  const pts = section.outline.flatMap((s) => shapePolygon(s) ?? [])
  if (!w || !pts.length) return null
  const xs = pts.map((p) => p[0])
  const units = Math.max(...xs) - Math.min(...xs)
  const mm = w[2] - w[0] - 10
  return units > 0 && mm > 0 ? mm / units : null
}

/** Plate (x, y) → cut plane (a, b) affine maps fitted on matching structures (scripts/export-plate-affine.mjs). */
const AFFINE = affine as Record<string, { m: number[][]; n: number; median: number; max: number }>

/**
 * Where a free lesion sits in MNI space (mm), through the atlas cut of the
 * same level. Where the plate has enough structures with a 3D counterpart,
 * the landmark-fitted affine map (median residual 1–6 mm); otherwise (the
 * caudal medulla) the plate's silhouette box laid onto the box of the level's
 * own meshes (the frame window less its 5 mm margin), the figure's y running
 * down while the cut's b runs up. Approximate (≈), like the plate's scale.
 */
/** The plate → cut-plane map as a 2×3 matrix [[a_x, a_y, a_0], [b_x, b_y, b_0]] (both methods are affine). */
function cutMatrix(plate: string): number[][] | null {
  const m = AFFINE[plate]?.m
  if (m) return m
  const section = SECTION_BY_ID.get(plate)
  const fr = FRAMES.get(plate)
  const pts = section?.outline.flatMap((s) => shapePolygon(s) ?? []) ?? []
  if (!section || !fr || !pts.length) return null
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const [a0, b0, a1, b1] = fr.window
  const sa = (a1 - a0 - 10) / (x1 - x0)
  const sb = (b1 - b0 - 10) / (y1 - y0)
  return [
    [sa, 0, (a0 + a1) / 2 - ((x0 + x1) / 2) * sa],
    [0, -sb, (b0 + b1) / 2 + ((y0 + y1) / 2) * sb],
  ]
}

/** A plate point in the plane of the level's atlas cut (a, b mm — the atlas and real-slice views' coordinates). */
export function plateToCut(plate: string, x: number, y: number): [number, number] | null {
  const m = cutMatrix(plate)
  return m ? [m[0][0] * x + m[0][1] * y + m[0][2], m[1][0] * x + m[1][1] * y + m[1][2]] : null
}

/** The inverse: a point clicked on the atlas / real slice, back on the schematic plate. */
export function cutToPlate(plate: string, a: number, b: number): [number, number] | null {
  const m = cutMatrix(plate)
  if (!m) return null
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0]
  if (Math.abs(det) < 1e-12) return null
  const da = a - m[0][2]
  const db = b - m[1][2]
  return [(m[1][1] * da - m[0][1] * db) / det, (-m[1][0] * da + m[0][0] * db) / det]
}

export function focalMni(f: FocalLesion): { at: [number, number, number]; r: number } | null {
  const fr = FRAMES.get(f.plate)
  const ab = plateToCut(f.plate, f.x, f.y)
  if (!fr || !ab) return null
  const at = [0, 1, 2].map((i) => fr.origin[i] + ab[0] * fr.u[i] + ab[1] * fr.v[i]) as [number, number, number]
  return { at, r: f.rMm }
}

/** Can a free lesion be placed on this plate? */
export const focalPlate = (section: Section) => {
  const lv = plateLevel(section)
  return lv && plateShows(section, lv) ? lv : null
}

const other = (s: BodySide): BodySide => (s === 'L' ? 'R' : 'L')
/** The patient's left is on the figure's right (plates are viewed from rostral / front). */
const sideOf = (section: Section, x: number): BodySide => (x >= section.w / 2 ? 'L' : 'R')

export function focalOn(section: Section, f: FocalLesion): FocalResult | null {
  const level = focalPlate(section)
  if (!level || f.plate !== section.id) return null
  const mpu = mmPerUnit(section)
  const r = f.rMm / (mpu ?? 1 / DEFAULT_UNITS_PER_MM)
  const cx = section.w / 2
  const crosses = Math.abs(f.x - cx) < r
  const side: BodySide | 'B' = crosses ? 'B' : sideOf(section, f.x)
  const inDisc = ([x, y]: P) => (x - f.x) ** 2 + (y - f.y) ** 2 <= r * r

  const entries = sectionEntries(section).filter((e) => e.kind === 'item' && STRUCTURE_BY_ID.get(e.item.id)?.cat !== 'csf')
  // The structure the centre sits in: the innermost (smallest) outline around it, as drawn on top —
  // so a lacune in the corticospinal fibres is not also "in" the whole posterior limb around them.
  let core: string | null = null
  let coreArea = Infinity
  for (const e of entries)
    for (const sh of itemShapes(section, e.item)) {
      // A fibre stroke under the centre is the innermost of all (drawn over the fills).
      if (sh.t === 'l') {
        const w = Math.max(sh.w ?? 4, 3)
        if (shapeSamples(sh).some(([x, y]) => (x - f.x) ** 2 + (y - f.y) ** 2 <= w * w)) ((core = e.item.id), (coreArea = 0))
        continue
      }
      const poly = shapePolygon(sh)
      if (!poly || !insidePolygon(poly, f.x, f.y)) continue
      const a = polygonArea(poly)
      if (a < coreArea) ((core = e.item.id), (coreArea = a))
    }

  // Structures under the disc, each half of a bilateral one on its own.
  const hits: FocalHit[] = []
  for (const e of entries) {
    const shapes = itemShapes(section, e.item)
    const sides: BodySide[] = []
    let best = 0
    for (const s of ['L', 'R'] as const) {
      const pts = shapes.flatMap(shapeSamples).filter(([x]) => sideOf(section, x) === s)
      if (!pts.length) continue
      const share = pts.filter(inDisc).length / pts.length
      // The centre inside a filled outline counts too: a disc smaller than the nucleus it sits in.
      const centreIn = core === e.item.id && sideOf(section, f.x) === s
      if (share >= 0.2 || centreIn || (shapes.every((sh) => sh.t === 'l') && share > 0)) {
        sides.push(s)
        best = Math.max(best, centreIn ? Math.max(share, 0.2) : share)
      }
    }
    if (sides.length) hits.push({ id: e.item.id, sides, share: best })
  }
  const hitOn = (id: string, s: BodySide) => hits.some((h) => h.id === id && h.sides.includes(s))

  // Long tracts: a station of this level whose structure is hit on side S is cut —
  // on the traced (right) body half when S is the station's side, else on the mirror copy.
  const sig: FocalResult['sig'] = {}
  for (const p of PATHWAYS) {
    const out = new Set<BodySide>()
    for (const st of p.stations) {
      const own = st.level === level
      if (!own && !st.also?.some((a) => a.level === level)) continue
      const items = own ? st.items : [...st.items, ...(TRANSIT[level] ?? [])]
      for (const s of ['L', 'R'] as const) {
        if (!items.some((id) => hitOn(id, s))) continue
        if (st.midline && st.level === level && crosses) (out.add('L'), out.add('R'))
        else out.add(s === st.side ? 'R' : 'L')
      }
    }
    sig[p.id] = out.size === 0 ? 'none' : out.size === 2 ? 'B' : [...out][0]
  }

  // Classic territories the disc lies in, by area (a grid over the disc).
  const grid: P[] = []
  const n = 9
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const p: P = [f.x - r + ((i + 0.5) * 2 * r) / n, f.y - r + ((j + 0.5) * 2 * r) / n]
      if (inDisc(p)) grid.push(p)
    }
  const lv = LEVEL_BY_ID.get(level)!
  const zones: FocalZone[] = []
  for (const z of lv.zones) {
    for (const s of ['L', 'R'] as const) {
      const t = zoneOn(section, level, z.id, s)
      // The whole half says nothing; a forebrain 'all' (the posterior limb, VPL) is a real structure.
      if (!t || (z.id === 'all' && 'poly' in t)) continue
      const overlap =
        'poly' in t ? grid.filter((p) => sideOf(section, p[0]) === s && insidePolygon(t.poly, p[0], p[1])).length / grid.length : t.items.some((id) => hitOn(id, s)) ? 1 : 0
      if (overlap >= 0.15) zones.push({ zone: z, side: s, overlap })
    }
  }
  zones.sort((a, b) => b.overlap - a.overlap)

  // Cranial and level signs: structure rules from the hits, territory rules from the zones the centre is in.
  const signs: SignHit[] = []
  for (const sign of CRANIAL_SIGNS) {
    const sides = new Set<BodySide>()
    const via: string[] = []
    if (!sign.levels || sign.levels.includes(level))
      for (const it of sign.items ?? [])
        for (const s of ['L', 'R'] as const)
          if (hitOn(it.id, s)) {
            sides.add(it.side === 'ipsi' ? s : other(s))
            if (!via.includes(it.id)) via.push(it.id)
          }
    for (const zr of sign.zones ?? []) {
      if (zr.level !== level) continue
      for (const z of zones) if (z.overlap >= 0.5 && zr.zones.includes(z.zone.id)) sides.add(zr.side === 'ipsi' ? z.side : other(z.side))
    }
    if (sides.size) signs.push({ sign, side: sides.size === 2 ? 'B' : [...sides][0], via })
  }

  const disc: Shape = { t: 'e', c: [f.x, f.y], r: [r, r] }
  return {
    level,
    side,
    rUnits: r,
    mmPerUnit: mpu,
    hits: hits.sort((a, b) => b.share - a.share),
    sig,
    signs,
    zones,
    territory: { shapes: [disc], clip: true, hits: hits.map((h) => h.id), pins: [{ at: [f.x, f.y], n: 1, active: true }] },
  }
}

/**
 * Several free lesions at once — on one plate or at different levels (the
 * multifocal picture of MS, bilateral lacunes). Each is read on its own
 * plate; the deficits add up: a tract lost on the left by one lesion and on
 * the right by another is lost on both sides.
 */
export interface FocalSet {
  /** One per lesion, in order (null: its plate cannot take a lesion). */
  each: (FocalResult | null)[]
  sig: Record<string, BodySide | 'none' | 'B'>
  signs: SignHit[]
  /** Distinct levels the lesions are at. */
  levels: LesionLevel[]
}

const merge = (a: BodySide | 'none' | 'B', b: BodySide | 'none' | 'B') => (a === 'none' ? b : b === 'none' || a === b ? a : 'B')

/** `now`: the time on the time axis (months) — lesions that appear later are left out; null takes them all. */
export function focalSet(foci: FocalLesion[], now: number | null = null): FocalSet {
  const each = foci.map((f) => {
    const s = SECTION_BY_ID.get(f.plate)
    return s && (now === null || (f.t ?? 0) <= now) ? focalOn(s, f) : null
  })
  const sig: FocalSet['sig'] = Object.fromEntries(PATHWAYS.map((p) => [p.id, 'none' as const]))
  const signs = new Map<string, SignHit>()
  for (const r of each) {
    if (!r) continue
    for (const p of PATHWAYS) sig[p.id] = merge(sig[p.id], r.sig[p.id])
    for (const h of r.signs) {
      const was = signs.get(h.sign.id)
      signs.set(h.sign.id, was ? { sign: h.sign, side: merge(was.side, h.side) as BodySide | 'B', via: [...new Set([...was.via, ...h.via])] } : h)
    }
  }
  return {
    each,
    sig,
    signs: CRANIAL_SIGNS.flatMap((c) => signs.get(c.id) ?? []),
    levels: [...new Set(each.flatMap((r) => (r ? [r.level] : [])))],
  }
}

/** What the open plate draws: the discs of the lesions placed on it, numbered. */
export function focalTerritory(section: Section, foci: FocalLesion[], set: FocalSet, active: number): TerritoryOnPlate | null {
  const shapes: Shape[] = []
  const pins: NonNullable<TerritoryOnPlate['pins']> = []
  const hits = new Set<string>()
  foci.forEach((f, i) => {
    const r = set.each[i]
    if (!r || f.plate !== section.id) return
    shapes.push(...r.territory.shapes)
    pins.push({ at: [f.x, f.y], n: i + 1, active: i === active })
    r.territory.hits.forEach((h) => hits.add(h))
  })
  return shapes.length ? { shapes, clip: true, hits: [...hits], pins } : null
}
