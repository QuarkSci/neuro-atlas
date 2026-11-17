import { SECTIONS, type Section, type SectionItem, type Shape } from '@/data/sections'
import { shapeCentre } from '@/data/sections/shapes'
import type { LesionLevel, PathStation, Pathway } from '@/data/pathways'
import { itemShapes } from './sectionLayout'

/** Lesion level a plate stands for (null: a plate no long tract crosses as such). */
export function plateLevel(s: Section): LesionLevel | null {
  switch (s.region) {
    case 'medulla':
      return s.id === 'medulla-pyramidal-decussation' || s.id === 'medulla-sensory-decussation' ? 'medulla-caudal' : 'medulla-rostral'
    case 'pons':
      return 'pons'
    case 'midbrain':
      return 'midbrain'
    case 'diencephalon':
      return 'thalamus'
    case 'basal-ganglia':
      return 'capsule'
    default:
      return null
  }
}

const stationsWith = (p: Pathway, id: string) => p.stations.filter((st) => st.items.includes(id))

/** Plates that draw at least one station of the tract, in the direction of conduction. */
export function routePlates(p: Pathway): Section[] {
  const ids = new Set(p.stations.flatMap((st) => st.items))
  const list = SECTIONS.filter((s) => s.items.some((it) => ids.has(it.id)))
  return p.dir === 'up' ? list : [...list].reverse()
}

/** The station an item of this plate belongs to: the one opened on this plate, else at this level, else the first. */
function stationFor(p: Pathway, s: Section, id: string): PathStation | undefined {
  const all = stationsWith(p, id)
  const level = plateLevel(s)
  return all.find((st) => st.plate === s.id) ?? all.find((st) => st.level === level) ?? all[0]
}

export interface TraceItem {
  station: PathStation
  item: SectionItem
  /** The copies of the item on the traced side (a crossing stroke: the copy that starts there). */
  shapes: Shape[]
}

/**
 * What of the tract this plate shows. The plates are viewed from rostral /
 * front, so the patient's left is on the figure's right; a stroke is sided by
 * where it starts, so a decussation picks the copy that leaves the traced side.
 */
export function traceOn(p: Pathway, s: Section): TraceItem[] {
  const sided = s.axes[2].en === 'Right'
  const cx = s.w / 2
  const out: TraceItem[] = []
  for (const item of s.items) {
    const station = stationFor(p, s, item.id)
    if (!station) continue
    const all = itemShapes(s, item)
    const keep = sided
      ? all.filter((sh) => {
          const x = sh.t === 'l' ? sh.p[0][0] : shapeCentre(sh)[0]
          return Math.abs(x - cx) < 1 || x > cx === (station.side === 'L')
        })
      : all
    out.push({ station, item, shapes: keep.length ? keep : all })
  }
  return out
}
