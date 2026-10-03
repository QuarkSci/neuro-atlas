import type { Section, SectionItem, Shape } from '@/data/sections'
import { mirrorShape, shapeCentre } from '@/data/sections/shapes'

type P = [number, number]

/** How an entry of the figure is drawn: the enclosing tissue, a shaded territory, or a named structure. */
export type EntryKind = 'ground' | 'region' | 'item'

export interface Entry {
  item: SectionItem
  n: number
  kind: EntryKind
}

/** Shapes of an item including its mirrored copy. */
export function itemShapes(section: Section, item: SectionItem): Shape[] {
  const cx = section.w / 2
  return item.mirror ? [...item.shapes, ...item.shapes.map((s) => mirrorShape(s, cx))] : item.shapes
}

/** Polygon approximation of a filled shape (null for strokes). */
export function shapePolygon(s: Shape): P[] | null {
  switch (s.t) {
    case 'b':
      return s.p
    case 'e': {
      const a = ((s.a ?? 0) * Math.PI) / 180
      const out: P[] = []
      for (let i = 0; i < 28; i++) {
        const t = (i / 28) * Math.PI * 2
        const x = Math.cos(t) * s.r[0],
          y = Math.sin(t) * s.r[1]
        out.push([s.c[0] + x * Math.cos(a) - y * Math.sin(a), s.c[1] + x * Math.sin(a) + y * Math.cos(a)])
      }
      return out
    }
    case 'p':
      return s.closed ? [...s.d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])] as P) : null
    case 'l':
      return null
  }
}

export function polygonArea(p: P[]): number {
  let a = 0
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += p[j][0] * p[i][1] - p[i][0] * p[j][1]
  return Math.abs(a / 2)
}

function inside(p: P[], x: number, y: number) {
  let c = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i],
      [xj, yj] = p[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

function segDist(x: number, y: number, a: P, b: P) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy)
}

function edgeDist(p: P[], x: number, y: number, closed = true) {
  let d = Infinity
  const n = closed ? p.length : p.length - 1
  for (let i = 0; i < n; i++) d = Math.min(d, segDist(x, y, p[i], p[(i + 1) % p.length]))
  return d
}

/**
 * Point of the `own` shapes farthest from every other drawn shape and from
 * its own border: where the badge of a ground / region entry reads as
 * belonging to the tissue itself rather than to a structure inside it.
 */
export function freeSpot(own: Shape[], others: Shape[]): P {
  const polys = own.map(shapePolygon).filter(Boolean) as P[][]
  if (!polys.length) return shapeCentre(own[0])
  const blocks = others.map((s) => ({
    poly: shapePolygon(s),
    line: s.t === 'l' ? { p: s.p, w: (s.w ?? 4) / 2 } : null,
  }))
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  for (const p of polys)
    for (const [x, y] of p) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  let best: P = shapeCentre(own[0]),
    score = -Infinity
  for (let y = y0; y <= y1; y += 4)
    for (let x = x0; x <= x1; x += 4) {
      const home = polys.find((p) => inside(p, x, y))
      if (!home) continue
      let d = edgeDist(home, x, y)
      for (const b of blocks) {
        if (b.poly) d = Math.min(d, inside(b.poly, x, y) ? -1 : edgeDist(b.poly, x, y))
        else if (b.line) d = Math.min(d, edgeDist(b.line.p, x, y, false) - b.line.w)
        if (d < score) break
      }
      if (d > score) {
        score = d
        best = [x, y]
      }
    }
  return best
}

/** Every entry of a section: its named items, then its territories and the ground (numbered last). */
export function sectionEntries(section: Section): Entry[] {
  const out: Entry[] = section.items.map((item) => ({
    item,
    n: 0,
    kind: 'item' as const,
  }))
  const itemShapesAll = section.items.flatMap((i) => itemShapes(section, i))
  const regionShapes: Shape[] = []
  for (const r of section.regions ?? []) {
    if (!r.id) continue
    out.push({
      item: {
        id: r.id,
        shapes: r.shapes,
        at: r.at ?? freeSpot(r.shapes, itemShapesAll),
      },
      n: 0,
      kind: 'region',
    })
    regionShapes.push(...r.shapes)
  }
  const grounds = Array.isArray(section.ground) ? section.ground : section.ground ? section.outline.map(() => section.ground as string) : []
  const byId = new Map<string, Shape[]>()
  section.outline.forEach((s, i) => {
    const id = grounds[i]
    if (!id || s.t === 'l') return
    byId.set(id, [...(byId.get(id) ?? []), s])
  })
  for (const [id, shapes] of byId)
    out.push({
      item: {
        id,
        shapes,
        at: freeSpot(shapes, [...itemShapesAll, ...regionShapes]),
      },
      n: 0,
      kind: 'ground',
    })
  out.forEach((e, i) => (e.n = i + 1))
  return out
}

/** Largest filled area of an item, for painter's ordering (big first, small on top). */
export function itemArea(section: Section, item: SectionItem) {
  let a = 0
  for (const s of itemShapes(section, item)) {
    const p = shapePolygon(s)
    if (p) a = Math.max(a, polygonArea(p))
  }
  return a
}

/**
 * Badge positions: each starts at its structure's anchor; badges closer
 * than one badge-diameter are pushed apart (with a weak pull back home), so
 * numbers never sit on top of each other however tight the nuclei are.
 */
export function badgePositions(entries: Entry[]): Map<string, { x: number; y: number; hx: number; hy: number }> {
  const R = 19.5
  const b = entries.map((e) => {
    const [x, y] = e.item.at ?? shapeCentre(e.item.shapes[0])
    return { id: e.item.id, x, y, hx: x, hy: y }
  })
  for (let it = 0; it < 120; it++) {
    let moved = false
    for (let i = 0; i < b.length; i++)
      for (let j = i + 1; j < b.length; j++) {
        let dx = b[j].x - b[i].x,
          dy = b[j].y - b[i].y
        let d = Math.hypot(dx, dy)
        if (d >= R) continue
        if (d < 0.01) {
          dx = 0
          dy = 1
          d = 1
        }
        const push = (R - d) / 2 + 0.2
        b[i].x -= (dx / d) * push
        b[i].y -= (dy / d) * push
        b[j].x += (dx / d) * push
        b[j].y += (dy / d) * push
        moved = true
      }
    for (const p of b) {
      p.x += (p.hx - p.x) * 0.04
      p.y += (p.hy - p.y) * 0.04
    }
    if (!moved && it > 4) break
  }
  return new Map(b.map((p) => [p.id, p]))
}

/** Mix two #rrggbb colours: `t` of `a` over `b`. */
export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16)
  const ch = (s: number) => Math.round(((pa >> s) & 255) * t + ((pb >> s) & 255) * (1 - t))
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`
}
