import * as T from 'three'
import { chainLoops, planeBasis, polyArea, sliceSegments, type P2 } from './slice'

/**
 * Cut faces. A clipped closed mesh is hollow: through the clip plane one sees
 * the inside of its far wall, which reads as an empty tube. Here every part the
 * plane crosses gets its true cross-section polygon (plane ∩ mesh → loops →
 * triangulated, holes kept) filled with the part's own flat colour, lying in the
 * plane — the stained-section look of a textbook figure.
 */

export interface CapPart {
  geometry: T.BufferGeometry
  colour: T.Color
}

function inside(p: P2, poly: P2[]): boolean {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i],
      [xj, yj] = poly[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

/** One part's section as polygons with holes: even nesting depth = outline, odd = hole of its tightest container. */
function polygons(loops: P2[][]): { outer: P2[]; holes: P2[][] }[] {
  const L = loops
    .map((l) => {
      const closed = Math.hypot(l[0][0] - l.at(-1)![0], l[0][1] - l.at(-1)![1]) < 0.05
      return closed ? l.slice(0, -1) : null
    })
    .filter((l): l is P2[] => !!l && l.length >= 3)
    .map((pts) => ({ pts, a: Math.abs(polyArea(pts)) }))
    .filter((l) => l.a > 1e-4)
    .sort((p, q) => q.a - p.a)
  const depth = L.map((l, i) => L.reduce((n, m, j) => n + (j < i && inside(l.pts[0], m.pts) ? 1 : 0), 0))
  const out: { outer: P2[]; holes: P2[][] }[] = []
  const at = new Map<number, { outer: P2[]; holes: P2[][] }>()
  L.forEach((l, i) => {
    if (depth[i] % 2 === 0) {
      const poly = { outer: l.pts, holes: [] as P2[][] }
      at.set(i, poly)
      out.push(poly)
    }
  })
  L.forEach((l, i) => {
    if (depth[i] % 2 === 1) {
      // Tightest container = the smallest earlier loop that holds it.
      for (let j = i - 1; j >= 0; j--)
        if (depth[j] === depth[i] - 1 && inside(l.pts[0], L[j].pts)) {
          at.get(j)?.holes.push(l.pts)
          break
        }
    }
  })
  return out
}

/**
 * Triangles of every part's cross-section with `plane`, coloured per part, in one geometry.
 * Parts are drawn biggest section first so a nucleus lies over the structure that holds it.
 */
export function buildCap(parts: CapPart[], plane: T.Plane): T.BufferGeometry | null {
  const { u, v } = planeBasis(plane.normal, Math.abs(plane.normal.y) > 0.9 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0))
  const origin = plane.coplanarPoint(new T.Vector3())
  const q = new T.Vector3()
  const items: { polys: { outer: P2[]; holes: P2[][] }[]; area: number; colour: T.Color }[] = []
  for (const part of parts) {
    const seg = sliceSegments(part.geometry, plane)
    if (!seg.length) continue
    const flat: number[] = []
    for (let i = 0; i < seg.length; i += 3) {
      q.set(seg[i] - origin.x, seg[i + 1] - origin.y, seg[i + 2] - origin.z)
      flat.push(q.dot(u), q.dot(v))
    }
    const polys = polygons(chainLoops(flat, 1e-3))
    if (!polys.length) continue
    items.push({ polys, area: polys.reduce((s, p) => s + Math.abs(polyArea(p.outer)), 0), colour: part.colour })
  }
  items.sort((a, b) => b.area - a.area)
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (const it of items)
    for (const poly of it.polys) {
      const ring = [poly.outer, ...poly.holes]
      const base = pos.length / 3
      for (const r of ring)
        for (const [x, y] of r) {
          q.copy(origin).addScaledVector(u, x).addScaledVector(v, y)
          pos.push(q.x, q.y, q.z)
          col.push(it.colour.r, it.colour.g, it.colour.b)
        }
      let faces: number[][] = []
      try {
        faces = T.ShapeUtils.triangulateShape(
          poly.outer.map(([x, y]) => new T.Vector2(x, y)),
          poly.holes.map((h) => h.map(([x, y]) => new T.Vector2(x, y))),
        )
      } catch {
        faces = []
      }
      for (const f of faces) idx.push(base + f[0], base + f[1], base + f[2])
    }
  if (!idx.length) return null
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new T.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}
