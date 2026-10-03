import * as T from 'three'
import { LEAF_PARTS, coveredIds } from '@/data'
import type { Section } from '@/data/sections'
import type { LayerId, Part, SystemId } from '@/data/types'
import { MNI_TO_SCENE, loadGeometries } from './loader'
import { chainLoops, planeBasis, polyArea, sliceSegments, smoothLoop, unionOutline, type P2 } from './slice'

/** One atlas structure as it appears in the plane: closed loops in mm (x right = patient left, y up). */
export interface SliceRegion {
  part: Part
  loops: P2[][]
  /** Cross-sectional area in mm² (even-odd: holes subtracted). */
  area: number
  /** Centroid of the cut face, MNI mm. */
  centroid: [number, number, number]
}

export interface AtlasSlice {
  regions: SliceRegion[]
  /** Window shown (mm, plane coordinates): [x0, y0, x1, y1]. */
  window: [number, number, number, number]
  /** Plane coordinates → MNI mm. */
  toMNI: (x: number, y: number) => [number, number, number]
}

/** Tissue the real cut never needs (bone, dura) — they only frame the brain. */
const SKIP: Set<SystemId> = new Set(['skull', 'meninges'])

const cache = new Map<string, Promise<AtlasSlice | null>>()

/**
 * The real atlas at a section's plane: every mesh of the given layers that
 * the plane passes through (within a window around the level's own
 * structure), cut into closed outlines. Coordinates are in the plane, in
 * millimetres, oriented like the schematic — viewed from rostral / front,
 * dorsal up, the patient's left on the right.
 */
export function atlasSlice(section: Section, layers: LayerId[]): Promise<AtlasSlice | null> {
  const key = `${section.id}|${layers.join(',')}`
  let p = cache.get(key)
  if (!p) {
    p = build(section, layers)
    cache.set(key, p)
    p.catch(() => cache.delete(key))
  }
  return p
}

async function build(section: Section, layers: LayerId[]): Promise<AtlasSlice | null> {
  if (!section.plane) return null
  const n = new T.Vector3(...section.plane.normal).normalize()
  const o = new T.Vector3(...section.plane.point)
  const plane = new T.Plane().setFromNormalAndCoplanarPoint(n, o)
  // Brainstem and cerebellar levels are read dorsal-up; coronal ones superior-up.
  const coronal = Math.abs(n.y) > 0.9
  const { u, v } = planeBasis(n, coronal ? new T.Vector3(0, 0, 1) : new T.Vector3(0, -1, 0))
  const toPlane = (q: T.Vector3): P2 => {
    const d = q.clone().sub(o)
    return [d.dot(u), d.dot(v)]
  }

  // Window: the level's own structure (the meshes its 3D marker traces) plus a margin.
  const match = section.contour ?? /$^/
  const own = LEAF_PARTS.filter((p) => match.test(p.id) && p.mesh)
  const ownBox = new T.Box3()
  for (const p of own) if (p.bbox) ownBox.union(new T.Box3(new T.Vector3(...p.bbox[0]), new T.Vector3(...p.bbox[1])))
  const reach = ownBox.clone().expandByScalar(16)

  const covered = coveredIds(layers)
  const straddles = (p: Part) => {
    if (!p.bbox) return false
    const box = new T.Box3(new T.Vector3(...p.bbox[0]), new T.Vector3(...p.bbox[1]))
    return box.intersectsBox(reach) && plane.intersectsBox(box)
  }
  const drawn = (p: Part) => layers.includes(p.layer) && !SKIP.has(p.system) && !covered.has(p.id)
  // The level's own meshes are always cut (they frame the window) even when a
  // finer layer stands in for them in the drawing.
  const chosen = LEAF_PARTS.filter((p) => p.mesh && (own.includes(p) || drawn(p)) && straddles(p))
  const geometries = await loadGeometries(chosen, () => {})

  const regions: SliceRegion[] = []
  const ownLoops: P2[][] = []
  for (const { part, geometry } of geometries) {
    // Geometry arrives baked into scene space; the mapping is its own inverse.
    geometry.applyMatrix4(MNI_TO_SCENE)
    const seg = sliceSegments(geometry, plane)
    geometry.dispose()
    if (!seg.length) continue
    const flat: number[] = []
    const q = new T.Vector3()
    for (let i = 0; i < seg.length; i += 3) {
      const [a, b] = toPlane(q.set(seg[i], seg[i + 1], seg[i + 2]))
      flat.push(a, b)
    }
    const loops = chainLoops(flat, 1e-4).filter((l) => Math.abs(polyArea(l)) > 0.05)
    if (!loops.length) continue
    if (own.includes(part)) ownLoops.push(...loops)
    if (!drawn(part)) continue
    // Even-odd area and centroid (holes wind against the outer loop's sign only by
    // nesting, so use absolute areas: outermost largest, inner ones subtract).
    const sorted = loops.map((l) => ({ l, a: Math.abs(polyArea(l)) })).sort((x, y) => y.a - x.a)
    let area = 0,
      cx = 0,
      cy = 0
    for (const { l, a } of sorted) {
      const inner = sorted.some((s) => s.a > a && contains(s.l, l[0]))
      const sign = inner ? -1 : 1
      area += sign * a
      const [mx, my] = mean(l)
      cx += sign * a * mx
      cy += sign * a * my
    }
    if (area <= 0.05) continue
    const c = o
      .clone()
      .addScaledVector(u, cx / area)
      .addScaledVector(v, cy / area)
    // Display outline: a 0.5 mm morphological close seals the hairline cracks
    // marching cubes leaves in some atlas labels; area and centroid above
    // stay those of the raw cut.
    const clean = unionOutline(loops, 0.25, 0.02).map((l) => smoothLoop(l, 2))
    regions.push({
      part,
      loops: clean.length ? clean : loops,
      area,
      centroid: [c.x, c.y, c.z],
    })
  }
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  for (const l of ownLoops.length ? ownLoops : regions.flatMap((r) => r.loops))
    for (const [x, y] of l) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  if (!isFinite(x0)) return null
  const m = 5
  const win: [number, number, number, number] = [x0 - m, y0 - m, x1 + m, y1 + m]
  // Only what is actually inside the field of view is drawn and listed.
  const visible = regions.filter((r) => r.loops.some((l) => l.some(([x, y]) => x > win[0] && x < win[2] && y > win[1] && y < win[3])))
  visible.sort((a, b) => b.area - a.area)
  return {
    regions: visible,
    window: win,
    toMNI: (x, y) => {
      const p = o.clone().addScaledVector(u, x).addScaledVector(v, y)
      return [p.x, p.y, p.z]
    },
  }
}

function mean(l: P2[]): P2 {
  let x = 0,
    y = 0
  for (const p of l) {
    x += p[0]
    y += p[1]
  }
  return [x / l.length, y / l.length]
}

function contains(poly: P2[], [x, y]: P2) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i],
      [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
