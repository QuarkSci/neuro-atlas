import { CRANIAL_SIGNS, LEVELS, LEVEL_BY_ID, signature, type CranialSign, type Findings, type Lesion } from '@/data/lesions'
import { PATHWAYS, type BodySide } from '@/data/pathways'
import { SECTION_BY_ID } from '@/data/sections'
import { territoryOn } from './lesionTerritory'

/**
 * The cranial-nerve (level) signs of a lesion, read off its territory on the
 * level's own plate: a structure of the sign inside the territory gives it,
 * on the side its rule says. Kept in the UI layer because it runs the
 * plate geometry (ui/lesionTerritory); data/lesions only lists the signs.
 */
export interface SignHit {
  sign: CranialSign
  /** Side of the face / eye / limbs the sign is on. */
  side: BodySide | 'B'
  /** Plate structures that give it (empty for a territory rule). */
  via: string[]
}

const other = (s: BodySide): BodySide => (s === 'L' ? 'R' : 'L')
const cache = new Map<string, SignHit[]>()

export function cranialSigns(lesion: Lesion): SignHit[] {
  const key = `${lesion.level}:${lesion.side}:${lesion.zone}`
  const known = cache.get(key)
  if (known) return known
  const plate = SECTION_BY_ID.get(LEVEL_BY_ID.get(lesion.level)?.plate ?? '')
  const hits = new Set(plate ? (territoryOn(plate, lesion)?.hits ?? []) : [])
  const out: SignHit[] = []
  for (const sign of CRANIAL_SIGNS) {
    const sides = new Set<BodySide>()
    const via: string[] = []
    if (!sign.levels || sign.levels.includes(lesion.level))
      for (const it of sign.items ?? [])
        if (hits.has(it.id)) {
          sides.add(it.side === 'ipsi' ? lesion.side : other(lesion.side))
          via.push(it.id)
        }
    for (const z of sign.zones ?? []) if (z.level === lesion.level && z.zones.includes(lesion.zone)) sides.add(z.side === 'ipsi' ? lesion.side : other(lesion.side))
    if (sides.size) out.push({ sign, side: sides.size === 2 ? 'B' : [...sides][0], via })
  }
  cache.set(key, out)
  return out
}

/** Cranial findings the user entered: sign id → side. */
export type CranialFindings = Record<string, BodySide | 'none'>

/**
 * Every one-sided lesion whose long-tract signature equals the findings and
 * which gives each entered cranial sign on the entered side. Cranial signs
 * not entered are not held against a lesion (they may not have been
 * examined); long-tract findings are exact, as before.
 */
export function localiseWithSigns(findings: Findings, cranial: CranialFindings): Lesion[] {
  const wanted = Object.entries(cranial).filter(([, s]) => s !== 'none') as [string, BodySide][]
  const anyTract = PATHWAYS.some((p) => (findings[p.id] ?? 'none') !== 'none')
  if (!anyTract && !wanted.length) return []
  const out: Lesion[] = []
  for (const lv of LEVELS)
    for (const side of ['L', 'R'] as const)
      for (const z of lv.zones) {
        const lesion = { level: lv.id, side, zone: z.id }
        const sig = signature(lesion)
        if (!PATHWAYS.every((p) => sig[p.id] === (findings[p.id] ?? 'none'))) continue
        const signs = cranialSigns(lesion)
        if (wanted.every(([id, s]) => signs.some((h) => h.sign.id === id && (h.side === s || h.side === 'B')))) out.push(lesion)
      }
  return out
}
