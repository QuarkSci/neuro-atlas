import * as T from 'three'

/**
 * Plane ∩ mesh geometry, shared by the 3D level markers and the 2D atlas
 * slice. Everything works in one coordinate frame (whatever the geometry is
 * in — scene space here) and returns either raw segments or closed 2D loops
 * in an in-plane basis (u, v).
 */

export type P2 = [number, number]

/** Triangle edges crossing the plane, as segment pairs [x0,y0,z0, x1,y1,z1, …]. */
export function sliceSegments(geometry: T.BufferGeometry, plane: T.Plane, matrix?: T.Matrix4): number[] {
  const out: number[] = []
  const a = new T.Vector3(),
    b = new T.Vector3(),
    c = new T.Vector3()
  const pts: T.Vector3[] = []
  const cross = (p: T.Vector3, q: T.Vector3, dp: number, dq: number) => pts.push(p.clone().lerp(q, dp / (dp - dq)))
  const pos = geometry.getAttribute('position')
  const idx = geometry.getIndex()
  const count = idx ? idx.count : pos.count
  for (let t = 0; t < count; t += 3) {
    a.fromBufferAttribute(pos, idx ? idx.getX(t) : t)
    b.fromBufferAttribute(pos, idx ? idx.getX(t + 1) : t + 1)
    c.fromBufferAttribute(pos, idx ? idx.getX(t + 2) : t + 2)
    if (matrix) {
      a.applyMatrix4(matrix)
      b.applyMatrix4(matrix)
      c.applyMatrix4(matrix)
    }
    const da = plane.distanceToPoint(a),
      db = plane.distanceToPoint(b),
      dc = plane.distanceToPoint(c)
    if ((da > 0 && db > 0 && dc > 0) || (da < 0 && db < 0 && dc < 0)) continue
    pts.length = 0
    if (da * db < 0) cross(a, b, da, db)
    if (db * dc < 0) cross(b, c, db, dc)
    if (dc * da < 0) cross(c, a, dc, da)
    if (pts.length === 2) out.push(pts[0].x, pts[0].y, pts[0].z, pts[1].x, pts[1].y, pts[1].z)
  }
  return out
}

/**
 * Orthonormal in-plane basis: `v` is `up` projected onto the plane, `u`
 * completes a right-handed frame so that looking against the normal
 * (from the side the normal points to) u runs to the right of the screen.
 */
export function planeBasis(normal: T.Vector3, up: T.Vector3) {
  const n = normal.clone().normalize()
  const v = up.clone().addScaledVector(n, -up.dot(n)).normalize()
  // Viewer on the +n side looking along −n: right = v × n.
  const u = new T.Vector3().crossVectors(v, n).normalize()
  return { u, v, n }
}

/** Chains 2D segments into closed loops by matching endpoints (snapped to `eps`). */
export function chainLoops(seg: number[], eps = 1e-3): P2[][] {
  const key = (x: number, y: number) => `${Math.round(x / eps)},${Math.round(y / eps)}`
  const pts: P2[] = []
  const adj = new Map<string, number[]>()
  for (let i = 0; i < seg.length; i += 4) {
    const s = pts.length
    pts.push([seg[i], seg[i + 1]], [seg[i + 2], seg[i + 3]])
    for (const [j, x, y] of [
      [s, seg[i], seg[i + 1]],
      [s + 1, seg[i + 2], seg[i + 3]],
    ] as const) {
      const k = key(x, y)
      const list = adj.get(k)
      if (list) list.push(j)
      else adj.set(k, [j])
    }
  }
  const used = new Uint8Array(pts.length / 2)
  const loops: P2[][] = []
  for (let s = 0; s < used.length; s++) {
    if (used[s]) continue
    used[s] = 1
    const loop: P2[] = [pts[2 * s]]
    let end = 2 * s + 1
    for (let guard = 0; guard < used.length; guard++) {
      const p = pts[end]
      loop.push(p)
      const next = adj.get(key(p[0], p[1]))?.find((j) => !used[j >> 1])
      if (next === undefined) break
      used[next >> 1] = 1
      end = next ^ 1
    }
    if (loop.length >= 4) loops.push(loop)
  }
  return loops
}

export function polyArea(p: P2[]): number {
  let a = 0
  // Shoelace: positive for counter-clockwise (x right, y up).
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += p[j][0] * p[i][1] - p[i][0] * p[j][1]
  return a / 2
}

/**
 * Union of a set of (possibly overlapping, possibly open-seamed) loops,
 * returned as its outer boundary loops: rasterise every loop with the
 * even-odd rule on a fine grid, OR them, close one-cell gaps, then trace the
 * mask with marching squares. Robust to the left/right half-meshes and the
 * internal nuclei that make a raw plane cut a tangle of overlapping rings.
 */
export function unionOutline(loops: P2[][], cell = 0.25, minFraction = 0.12): P2[][] {
  if (!loops.length) return []
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  for (const l of loops)
    for (const [x, y] of l) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  const pad = 3
  const W = Math.ceil((x1 - x0) / cell) + 2 * pad,
    H = Math.ceil((y1 - y0) / cell) + 2 * pad
  const ox = x0 - pad * cell,
    oy = y0 - pad * cell
  let mask = new Uint8Array(W * H)
  const row = new Uint8Array(W * H)
  for (const l of loops) {
    row.fill(0)
    for (let j = 0; j < H; j++) {
      const y = oy + (j + 0.5) * cell
      const xs: number[] = []
      for (let i = 0, k = l.length - 1; i < l.length; k = i++) {
        const [ax, ay] = l[k],
          [bx, by] = l[i]
        if (ay > y !== by > y) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax))
      }
      xs.sort((p, q) => p - q)
      for (let s = 0; s + 1 < xs.length; s += 2) {
        const a = Math.max(0, Math.ceil((xs[s] - ox) / cell - 0.5)),
          b = Math.min(W - 1, Math.floor((xs[s + 1] - ox) / cell - 0.5))
        for (let i = a; i <= b; i++) row[j * W + i] = 1
      }
    }
    for (let i = 0; i < mask.length; i++) mask[i] |= row[i]
  }
  // Morphological close (dilate then erode, 2 cells) seals the seams between half-meshes.
  mask = erode(dilate(mask, W, H, 2), W, H, 2)
  const segs = marching(mask, W, H, ox, oy, cell)
  const out = chainLoops(segs, cell / 4)
    .map((l) => ({ l, a: Math.abs(polyArea(l)) }))
    .sort((p, q) => q.a - p.a)
  if (!out.length) return []
  // Outer boundaries only: holes (ventricles, aqueduct) wind the other way.
  const sign = Math.sign(polyArea(out[0].l))
  return out.filter((o) => o.a >= out[0].a * minFraction && Math.sign(polyArea(o.l)) === sign).map((o) => o.l)
}

function dilate(m: Uint8Array, W: number, H: number, r: number) {
  const o = new Uint8Array(m.length)
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      if (!m[j * W + i]) continue
      for (let dj = -r; dj <= r; dj++)
        for (let di = -r; di <= r; di++) {
          const x = i + di,
            y = j + dj
          if (x >= 0 && y >= 0 && x < W && y < H && di * di + dj * dj <= r * r) o[y * W + x] = 1
        }
    }
  return o
}
function erode(m: Uint8Array, W: number, H: number, r: number) {
  const inv = m.map((v) => (v ? 0 : 1))
  return dilate(inv, W, H, r).map((v) => (v ? 0 : 1))
}

/** Marching squares on a binary mask → boundary segments [x0,y0,x1,y1,…] at cell-edge midpoints. */
function marching(m: Uint8Array, W: number, H: number, ox: number, oy: number, cell: number) {
  const out: number[] = []
  const at = (i: number, j: number) => (i >= 0 && j >= 0 && i < W && j < H ? m[j * W + i] : 0)
  const X = (i: number) => ox + (i + 0.5) * cell,
    Y = (j: number) => oy + (j + 0.5) * cell
  for (let j = -1; j < H; j++)
    for (let i = -1; i < W; i++) {
      const a = at(i, j),
        b = at(i + 1, j),
        c = at(i + 1, j + 1),
        d = at(i, j + 1)
      const code = a | (b << 1) | (c << 2) | (d << 3)
      if (code === 0 || code === 15) continue
      // Edge midpoints: top (a-b), right (b-c), bottom (d-c), left (a-d).
      const top: P2 = [X(i) + cell / 2, Y(j)],
        right: P2 = [X(i + 1), Y(j) + cell / 2],
        bottom: P2 = [X(i) + cell / 2, Y(j + 1)],
        left: P2 = [X(i), Y(j) + cell / 2]
      const push = (p: P2, q: P2) => out.push(p[0], p[1], q[0], q[1])
      switch (code) {
        case 1:
        case 14:
          push(left, top)
          break
        case 2:
        case 13:
          push(top, right)
          break
        case 3:
        case 12:
          push(left, right)
          break
        case 4:
        case 11:
          push(right, bottom)
          break
        case 6:
        case 9:
          push(top, bottom)
          break
        case 7:
        case 8:
          push(left, bottom)
          break
        case 5:
          push(left, top)
          push(right, bottom)
          break
        case 10:
          push(top, right)
          push(left, bottom)
          break
      }
    }
  return out
}

/** Chaikin corner-cutting on a closed loop. */
export function smoothLoop(l: P2[], iterations = 2): P2[] {
  let p = l
  if (p.length > 2 && p[0][0] === p[p.length - 1][0] && p[0][1] === p[p.length - 1][1]) p = p.slice(0, -1)
  for (let k = 0; k < iterations; k++) {
    const q: P2[] = []
    for (let i = 0; i < p.length; i++) {
      const a = p[i],
        b = p[(i + 1) % p.length]
      q.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]])
    }
    p = q
  }
  return p
}

/** Pushes every vertex of a closed loop `d` outward along its averaged normal. */
export function offsetLoop(l: P2[], d: number): P2[] {
  const s = Math.sign(polyArea(l)) || 1
  return l.map((p, i) => {
    const a = l[(i - 1 + l.length) % l.length],
      b = l[(i + 1) % l.length]
    const tx = b[0] - a[0],
      ty = b[1] - a[1]
    const len = Math.hypot(tx, ty) || 1
    // For a counter-clockwise loop the outward normal is (ty, −tx).
    return [p[0] + ((s * ty) / len) * d, p[1] - ((s * tx) / len) * d]
  })
}

/** Drops vertices closer than `min` to the previous kept one. */
export function decimate(l: P2[], min: number): P2[] {
  const out: P2[] = [l[0]]
  for (const p of l) {
    const q = out[out.length - 1]
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= min) out.push(p)
  }
  return out
}
