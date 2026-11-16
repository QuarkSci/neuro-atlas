import type { Shape } from './types'

type P = [number, number]

/** Closed Catmull-Rom spline through the points, as cubic Béziers. */
function closedSpline(pts: P[], tension = 1): string {
  const n = pts.length
  if (n < 3) return ''
  const k = tension / 6
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n],
      p1 = pts[i],
      p2 = pts[(i + 1) % n],
      p3 = pts[(i + 2) % n]
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k]
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k]
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

/** Open Catmull-Rom spline (end points duplicated so the curve reaches them). */
function openSpline(pts: P[]): string {
  if (pts.length < 2) return ''
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`
  const q = [pts[0], ...pts, pts[pts.length - 1]]
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 1; i < q.length - 2; i++) {
    const p0 = q[i - 1],
      p1 = q[i],
      p2 = q[i + 1],
      p3 = q[i + 2]
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

function ellipsePath(c: P, r: P, a = 0): string {
  // Two arcs; rotation applied through the arc's x-axis-rotation and endpoints.
  const rad = (a * Math.PI) / 180
  const dx = Math.cos(rad) * r[0],
    dy = Math.sin(rad) * r[0]
  const x1 = c[0] - dx,
    y1 = c[1] - dy,
    x2 = c[0] + dx,
    y2 = c[1] + dy
  return `M${x1.toFixed(1)},${y1.toFixed(1)}A${r[0]},${r[1]} ${a} 1 0 ${x2.toFixed(1)},${y2.toFixed(1)}A${r[0]},${r[1]} ${a} 1 0 ${x1.toFixed(1)},${y1.toFixed(1)}Z`
}

/** SVG path data for a shape, and whether it is a filled area or a stroke. */
export function shapePath(s: Shape): { d: string; stroke: boolean; w?: number; dash?: boolean } {
  switch (s.t) {
    case 'b':
      return { d: closedSpline(s.p), stroke: false }
    case 'e':
      return { d: ellipsePath(s.c, s.r, s.a), stroke: false }
    case 'l':
      return { d: openSpline(s.p), stroke: true, w: s.w ?? 4, dash: s.dash }
    case 'p':
      return { d: s.d, stroke: !s.closed }
  }
}

/** Mirror a shape across the vertical line x = cx. */
export function mirrorShape(s: Shape, cx: number): Shape {
  const m = (p: P): P => [2 * cx - p[0], p[1]]
  switch (s.t) {
    case 'b':
      return { t: 'b', p: s.p.map(m) }
    case 'e':
      return { t: 'e', c: m(s.c), r: s.r, a: s.a ? -s.a : 0 }
    case 'l':
      return { ...s, p: s.p.map(m) }
    case 'p':
      // Raw paths are only used for midline features; mirror numbers pairwise.
      return { ...s, d: s.d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(2 * cx - Number(x)).toFixed(1)},${y}`) }
  }
}

/** Centre of a shape's control points — default anchor for its number badge. */
export function shapeCentre(s: Shape): P {
  if (s.t === 'e') return s.c
  if (s.t === 'p') {
    const nums = [...s.d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])] as P)
    return avg(nums)
  }
  if (s.t === 'l') return s.p[Math.floor(s.p.length / 2)]
  return avg(s.p)
}

function avg(ps: P[]): P {
  if (!ps.length) return [0, 0]
  let x = 0,
    y = 0
  for (const p of ps) {
    x += p[0]
    y += p[1]
  }
  return [x / ps.length, y / ps.length]
}

/**
 * Symmetric outline: give the left half from top-centre down to
 * bottom-centre (x ≤ cx), get the closed full outline back.
 */
export function sym(left: P[], cx: number): P[] {
  const right = left
    .slice(1, -1)
    .reverse()
    .map((p): P => [2 * cx - p[0], p[1]])
  return [...left, ...right]
}

/** Shorthands used by the section data files. */
export const B = (...p: P[]): Shape => ({ t: 'b', p })
export const E = (cx: number, cy: number, rx: number, ry: number, a = 0): Shape => ({ t: 'e', c: [cx, cy], r: [rx, ry], a })
export const L = (w: number, ...p: P[]): Shape => ({ t: 'l', p, w })
export const D = (w: number, ...p: P[]): Shape => ({ t: 'l', p, w, dash: true })

/** Points along an open Catmull-Rom spline through `pts` (ends included), `n` samples per span. */
function sampleOpen(pts: P[], n = 8): P[] {
  if (pts.length < 3) return pts.slice()
  const q = [pts[0], ...pts, pts[pts.length - 1]]
  const out: P[] = [pts[0]]
  for (let i = 1; i < q.length - 2; i++) {
    const [p0, p1, p2, p3] = [q[i - 1], q[i], q[i + 1], q[i + 2]]
    for (let k = 1; k <= n; k++) {
      const s = k / n
      const s2 = s * s,
        s3 = s2 * s
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (c - a) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (3 * b - a - 3 * c + d) * s3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  return out
}

/**
 * A gap-free partition of a figure. Neighbouring structures do not each draw
 * their own border: a border is one **edge**, declared once, and both faces
 * that meet along it reuse the very same sampled points (one of them walking
 * it backwards). Two faces therefore cannot leave a sliver between them or
 * overlap — the property the plates are audited for
 * (`scripts/audit-sections.mjs --coverage`: unowned 0 %, shared 0 %).
 *
 * - `nodes`  named points where three or more borders meet (or a border ends);
 * - `edges`  node name, any number of free points to bend through, node name;
 * - `faces`  the edges round each face in order; `-name` walks an edge backwards.
 *
 * Returns one closed raw-path shape per face. Throws while the data is being
 * written if a face does not close, so a typo cannot ship as a hole.
 */
export function tiling<F extends string>(nodes: Record<string, P>, edges: Record<string, (string | P)[]>, faces: Record<F, string[]>): Record<F, Shape> {
  const sampled: Record<string, P[]> = {}
  for (const [name, spec] of Object.entries(edges)) {
    const pts = spec.map((s) => {
      if (typeof s !== 'string') return s
      if (!nodes[s]) throw new Error(`tiling: edge "${name}" names unknown node "${s}"`)
      return nodes[s]
    })
    sampled[name] = sampleOpen(pts)
  }
  const walk = (ref: string): P[] => {
    const back = ref.startsWith('-')
    const pts = sampled[back ? ref.slice(1) : ref]
    if (!pts) throw new Error(`tiling: unknown edge "${ref}"`)
    return back ? pts.slice().reverse() : pts
  }
  const out = {} as Record<F, Shape>
  for (const [name, refs] of Object.entries(faces) as [F, string[]][]) {
    const loop: P[] = []
    refs.forEach((ref, i) => {
      const pts = walk(ref)
      const prev = loop[loop.length - 1]
      if (prev && Math.hypot(prev[0] - pts[0][0], prev[1] - pts[0][1]) > 1e-6) throw new Error(`tiling: face "${name}" breaks before edge "${ref}"`)
      loop.push(...(i ? pts.slice(1) : pts))
    })
    const [a, b] = [loop[0], loop[loop.length - 1]]
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-6) throw new Error(`tiling: face "${name}" does not close`)
    loop.pop()
    out[name] = { t: 'p', closed: true, d: 'M' + loop.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join('L') + 'Z' }
  }
  return out
}
