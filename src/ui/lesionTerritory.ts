import type { Section, Shape } from '@/data/sections'
import type { Lesion } from '@/data/lesions'
import type { LesionLevel } from '@/data/pathways'
import { LEVEL_BY_ID } from '@/data/lesions'
import { STRUCTURE_BY_ID } from '@/data/sections'
import { itemShapes, sectionEntries, shapePolygon } from './sectionLayout'
import { plateLevel } from './pathTrace'

type P = [number, number]

/**
 * Where a lesion sits on a plate. A brainstem / cord territory is a polygon
 * in the half-section's own frame — u from the midline (0) to the lateral
 * edge (1), v from the dorsal (0) to the ventral (1) edge of the outline —
 * so the same vascular territory fits every plate of its level. A forebrain
 * lesion is the named structure itself (the posterior limb, VPL/VPM).
 *
 * The polygons follow the classic arterial territories (paramedian /
 * short circumferential / long circumferential; Tatu et al. 1996, Neurology,
 * "Arterial territories of human brain", doi:10.1212/WNL.47.5.1125) and are checked against data/pathways by
 * scripts/audit-lesions.mjs: every tract the simulator says is cut must lie
 * inside, every tract it says is spared must lie outside.
 */
type Territory = { uv: P[] } | { items: string[] }

const HALF: Territory = {
  uv: [
    [-0.02, -0.2],
    [1.3, -0.2],
    [1.3, 1.3],
    [-0.02, 1.3],
  ],
}

const TERRITORY: Partial<Record<LesionLevel, Record<string, Territory>>> = {
  capsule: { all: { items: ['ic-pl', 'cst-ic'] }, motor: { items: ['cst-ic'] } },
  thalamus: { all: { items: ['th-vpl', 'th-vpm'] } },
  midbrain: {
    all: HALF,
    // Crus and the oculomotor fascicles leaving through the interpeduncular fossa: the paramedian / PCA perforators of Weber.
    ventral: {
      uv: [
        [0.04, 0.6],
        [0.22, 0.6],
        [0.3, 0.75],
        [0.75, 0.75],
        [1.3, 0.68],
        [1.3, 1.3],
        [0.04, 1.3],
      ],
    },
    // Tegmentum: red nucleus, lemnisci, SCP — between the aqueduct's grey and the substantia nigra.
    dorsal: {
      uv: [
        [-0.02, 0.3],
        [1.3, 0.24],
        [1.3, 0.66],
        [0.75, 0.74],
        [0.4, 0.74],
        [-0.02, 0.72],
      ],
    },
  },
  pons: {
    all: HALF,
    // Paramedian basilar branches: a wedge from the ventral surface up to the floor of the 4th ventricle.
    medial: {
      uv: [
        [-0.02, 0.05],
        [0.2, 0.05],
        [0.3, 0.33],
        [0.46, 0.45],
        [0.56, 0.7],
        [0.5, 1.3],
        [-0.02, 1.3],
      ],
    },
    // Small perforator lacune of the basis.
    ventral: {
      uv: [
        [0.08, 0.6],
        [0.55, 0.58],
        [0.62, 0.95],
        [0.3, 1.02],
        [0.08, 0.98],
      ],
    },
    // Long circumferential (AICA / SCA): lateral tegmentum and the middle peduncle.
    lateral: {
      uv: [
        [0.46, -0.2],
        [1.3, -0.2],
        [1.3, 0.7],
        [0.72, 0.5],
        [0.56, 0.47],
        [0.46, 0.43],
        [0.44, 0.3],
      ],
    },
  },
  'medulla-rostral': {
    all: HALF,
    // Anterior spinal / vertebral paramedian branches: pyramid, lemniscus, MLF, XII.
    medial: {
      uv: [
        [-0.02, -0.1],
        [0.2, -0.1],
        [0.24, 0.5],
        [0.36, 0.78],
        [0.36, 1.3],
        [-0.02, 1.3],
      ],
    },
    // PICA: the dorsolateral wedge, sparing pyramid and olive.
    lateral: {
      uv: [
        [0.42, -0.2],
        [1.3, -0.2],
        [1.3, 0.84],
        [0.82, 0.82],
        [0.62, 0.7],
        [0.48, 0.46],
        [0.4, 0.2],
      ],
    },
  },
  'medulla-caudal': {
    all: HALF,
    // Paramedian: pyramid, lemniscus and the arcuate crossing; the dorsal columns belong to the posterior spinal arteries.
    medial: {
      uv: [
        [-0.02, 0.28],
        [0.38, 0.28],
        [0.38, 0.75],
        [0.32, 1.3],
        [-0.02, 1.3],
      ],
    },
    dorsal: {
      uv: [
        [-0.02, -0.2],
        [1.3, -0.2],
        [1.3, 0.42],
        [0.3, 0.34],
        [-0.02, 0.32],
      ],
    },
    lateral: {
      uv: [
        [0.52, 0.36],
        [1.3, 0.3],
        [1.3, 1.3],
        [0.62, 1.3],
      ],
    },
  },
  cord: {
    all: HALF,
    dorsal: {
      uv: [
        [-0.02, -0.2],
        [1.3, -0.2],
        [1.3, 0.42],
        [-0.02, 0.42],
      ],
    },
    // Anterior spinal artery: everything but the dorsal columns and horns.
    ventral: {
      uv: [
        [-0.02, 0.42],
        [1.3, 0.36],
        [1.3, 1.3],
        [-0.02, 1.3],
      ],
    },
  },
}

export interface TerritoryOnPlate {
  /** Territory outline(s) in plate units. */
  shapes: Shape[]
  /** Clip to the section silhouette (uv territories only). */
  clip: boolean
  /** Ids of the plate's structures the lesion takes in (each counted once). */
  hits: string[]
  /** A free (point) lesion's centre: drawn with a crosshair. */
  pin?: [number, number]
}

/** Does this plate stand for the lesion's level (and show it in a transverse / coronal / axial cut)? */
export function plateShows(section: Section, level: LesionLevel): boolean {
  if (section.axes[2].en !== 'Right') return false
  return plateLevel(section) === level || LEVEL_BY_ID.get(level)?.plate === section.id
}

function inside(poly: P[], x: number, y: number) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i],
      [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

/** Sample points of a shape: polygon vertices, or a stroke's points densified. */
function samples(s: Shape): P[] {
  const poly = shapePolygon(s)
  if (poly) return poly
  if (s.t !== 'l') return []
  const out: P[] = []
  for (let i = 0; i < s.p.length - 1; i++)
    for (let k = 0; k < 4; k++) out.push([s.p[i][0] + ((s.p[i + 1][0] - s.p[i][0]) * k) / 4, s.p[i][1] + ((s.p[i + 1][1] - s.p[i][1]) * k) / 4])
  out.push(s.p[s.p.length - 1])
  return out
}

/** The patient's left is on the figure's right (plates are viewed from rostral / front). */
const onSide = (section: Section, side: 'L' | 'R', x: number) => {
  const cx = section.w / 2
  return side === 'L' ? x >= cx - 1 : x <= cx + 1
}

/** A uv territory in plate units on one side: the half-section frame from the silhouette's bounding box. */
function uvPolygon(section: Section, uv: P[], side: 'L' | 'R'): P[] | null {
  const pts = section.outline.flatMap((s) => shapePolygon(s) ?? [])
  if (!pts.length) return null
  const cx = section.w / 2
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1])
  const top = Math.min(...ys),
    bottom = Math.max(...ys)
  const edge = side === 'L' ? Math.max(...xs) : Math.min(...xs)
  return uv.map(([u, v]) => [cx + u * (edge - cx), top + v * (bottom - top)])
}

/**
 * A zone of a level on one side of the plate, for a free (clicked) lesion
 * to be compared with: the polygon of a vascular territory, or the named
 * structures of a forebrain one. Null when the level has no such zone.
 */
export function zoneOn(section: Section, level: LesionLevel, zone: string, side: 'L' | 'R'): { poly: P[] } | { items: string[] } | null {
  const t = TERRITORY[level]?.[zone]
  if (!t) return null
  if ('items' in t) return { items: t.items }
  const poly = uvPolygon(section, t.uv, side)
  return poly ? { poly } : null
}

export { inside as insidePolygon, samples as shapeSamples }

export function territoryOn(section: Section, lesion: Lesion): TerritoryOnPlate | null {
  if (!plateShows(section, lesion.level)) return null
  const t = TERRITORY[lesion.level]?.[lesion.zone]
  if (!t) return null
  // Named structures only: not the enclosing tissue, the shaded territories or the ventricles.
  const entries = sectionEntries(section).filter((e) => e.kind === 'item' && STRUCTURE_BY_ID.get(e.item.id)?.cat !== 'csf')

  if ('items' in t) {
    const shapes: Shape[] = []
    const hits: string[] = []
    for (const e of entries) {
      if (!t.items.includes(e.item.id)) continue
      const own = itemShapes(section, e.item).filter((sh) => samples(sh).some(([x]) => onSide(section, lesion.side, x)))
      if (!own.length) continue
      shapes.push(...own)
      hits.push(e.item.id)
    }
    return shapes.length ? { shapes, clip: false, hits } : null
  }

  const poly = uvPolygon(section, t.uv, lesion.side)
  if (!poly) return null

  const hits: string[] = []
  for (const e of entries) {
    // Only the lesion's half counts: a bilateral structure's twin is never in it.
    const pts = itemShapes(section, e.item)
      .flatMap(samples)
      .filter(([x]) => onSide(section, lesion.side, x))
    if (!pts.length) continue
    const n = pts.filter(([x, y]) => inside(poly, x, y)).length
    // A structure counts when a fair share of it lies in the territory.
    if (n / pts.length >= 0.34) hits.push(e.item.id)
  }
  return { shapes: [{ t: 'p', d: `M${poly.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z`, closed: true }], clip: true, hits }
}
