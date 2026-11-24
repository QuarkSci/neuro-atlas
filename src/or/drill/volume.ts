import type { Mni } from '../types'
import { add, dot, len, mul, sub, unit } from '../vec'
import type { BoneLayer } from './types'

/**
 * SX-4 bone volume: a small voxel patch of the skull around the burr site (default 40 × 40 mm, 0.5 mm, 28 mm deep), kept as a
 * signed distance field (negative inside bone) so the drill can carve it and a surface-nets mesher can show a smooth hole.
 * Pure TypeScript: the atlas meshes reach it only through `BoneSource`, so the same code runs in tests and in the scene.
 *
 * Frame: `w` points into the head (against the outer-table normal), `u`, `v` span the surface. Sample (i, j, k) sits at
 * `center + u·(i − (nu−1)/2)·h + v·(j − (nv−1)/2)·h + w·(k·h + z0)`; `z0` is negative so the grid starts above the skull.
 */

/** Where the bone is. `columns` returns sorted [enter, exit] distances along a ray (origin, unit dir) that lie inside bone. */
export interface BoneSource {
  columns(origin: Mni, dir: Mni, maxLen: number): [number, number][]
}

export interface VolumeOptions {
  /** Outer-table point the patch is centred on and the outer normal there (pointing out of the head). */
  center: Mni
  outerNormal: Mni
  /** Voxel edge, mm (default 0.5), patch size in voxels. */
  h?: number
  nu?: number
  nv?: number
  nw?: number
  /** Height of the grid above the outer surface, mm (default 4). */
  above?: number
  /** Table thickness range, mm: each table is 20 % of the column's bone, clamped to this. */
  tableMm?: { min: number; max: number }
  /** Dura membrane thickness under the inner table, mm (default 1). */
  duraMm?: number
}

export interface ThicknessMap {
  nu: number
  nv: number
  h: number
  /** Bone thickness of every column, mm (0 where the column has no bone). */
  mm: Float32Array
  min: number
  mean: number
  max: number
  /** Share of the columns that have bone. */
  coverage: number
}

const LAYER_CODE: BoneLayer[] = ['air', 'outer-table', 'diploe', 'inner-table', 'dura', 'brain']
export const layerOfCode = (c: number): BoneLayer => LAYER_CODE[c]

/** Frame vector `u` ⟂ `w`: a stable choice that does not flip near the poles. */
function frameOf(w: Mni): { u: Mni; v: Mni } {
  const a: Mni = Math.abs(w[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]
  const u = unit(sub(a, mul(w, dot(a, w))))
  const v = unit([w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]])
  return { u, v }
}

export class BoneVolume {
  readonly h: number
  readonly nu: number
  readonly nv: number
  readonly nw: number
  readonly z0: number
  readonly center: Mni
  readonly u: Mni
  readonly v: Mni
  readonly w: Mni
  readonly duraMm: number
  /** Signed distance, mm, negative inside bone; clamped to ±`CLAMP`. */
  readonly sdf: Float32Array
  /** Layer codes of the ORIGINAL bone (immutable; drives feel and warnings even after the voxel is cut). */
  readonly layer: Uint8Array
  /** Per column: top and bottom of the original bone along w (mm from the outer plane), `NaN` when empty. */
  readonly top: Float32Array
  readonly bottom: Float32Array
  removedMm3 = 0
  /** Bumped by every carve; the mesher reads dirty chunks. */
  version = 0
  readonly chunk = 16
  private dirty = new Set<number>()
  readonly nChunks: [number, number, number]

  static readonly CLAMP = 2

  constructor(src: BoneSource, o: VolumeOptions) {
    this.h = o.h ?? 0.5
    this.nu = o.nu ?? 80
    this.nv = o.nv ?? 80
    this.nw = o.nw ?? 56
    this.z0 = -(o.above ?? 4)
    this.duraMm = o.duraMm ?? 1
    this.center = o.center
    this.w = unit(mul(o.outerNormal, -1))
    const f = frameOf(this.w)
    this.u = f.u
    this.v = f.v
    const n = this.nu * this.nv * this.nw
    this.sdf = new Float32Array(n).fill(BoneVolume.CLAMP)
    this.layer = new Uint8Array(n)
    this.top = new Float32Array(this.nu * this.nv).fill(NaN)
    this.bottom = new Float32Array(this.nu * this.nv).fill(NaN)
    this.nChunks = [Math.ceil(this.nu / this.chunk), Math.ceil(this.nv / this.chunk), Math.ceil(this.nw / this.chunk)]
    this.build(src, o.tableMm ?? { min: 0.5, max: 1.5 })
  }

  // ── Indexing ─────────────────────────────────────────────────────────────
  idx(i: number, j: number, k: number) {
    return (k * this.nv + j) * this.nu + i
  }
  /** MNI position of sample (i, j, k). */
  pos(i: number, j: number, k: number): Mni {
    const a = (i - (this.nu - 1) / 2) * this.h,
      b = (j - (this.nv - 1) / 2) * this.h,
      c = k * this.h + this.z0
    return [
      this.center[0] + this.u[0] * a + this.v[0] * b + this.w[0] * c,
      this.center[1] + this.u[1] * a + this.v[1] * b + this.w[1] * c,
      this.center[2] + this.u[2] * a + this.v[2] * b + this.w[2] * c,
    ]
  }
  /** Local (a, b, c) of an MNI point: along u, v, w in mm from the centre (c = depth below the outer plane). */
  local(p: Mni): Mni {
    const d = sub(p, this.center)
    return [dot(d, this.u), dot(d, this.v), dot(d, this.w)]
  }
  private col(a: number, b: number) {
    const i = Math.round(a / this.h + (this.nu - 1) / 2),
      j = Math.round(b / this.h + (this.nv - 1) / 2)
    return i < 0 || j < 0 || i >= this.nu || j >= this.nv ? -1 : j * this.nu + i
  }

  // ── Build ────────────────────────────────────────────────────────────────
  private build(src: BoneSource, tables: { min: number; max: number }) {
    const { nu, nv, nw, h, z0 } = this
    const span = nw * h
    const colTop = new Float32Array(nu * nv).fill(NaN)
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = (i - (nu - 1) / 2) * h,
          b = (j - (nv - 1) / 2) * h
        const origin = add(add(add(this.center, mul(this.u, a)), mul(this.v, b)), mul(this.w, z0))
        // Only the first run is the calvaria: a deeper one (orbital roof, petrous bone) is another structure.
        const iv = src.columns(origin, this.w, span).slice(0, 1)
        const c = j * nu + i
        if (!iv.length) continue
        // Intervals along the ray from the grid top; convert to depth below the outer plane (c = t + z0).
        const lo = iv[0][0] + z0,
          hi = iv[iv.length - 1][1] + z0
        this.top[c] = lo
        this.bottom[c] = hi
        colTop[c] = lo
        const thick = hi - lo
        const table = Math.min(tables.max, Math.max(tables.min, 0.2 * thick))
        for (let k = 0; k < nw; k++) {
          const t = k * h // distance along the ray
          // signed distance to the nearest interval boundary along the column
          let inside = false,
            d = Infinity
          for (const [a0, a1] of iv) {
            if (t >= a0 && t <= a1) inside = true
            d = Math.min(d, Math.abs(t - a0), Math.abs(t - a1))
          }
          // A sample exactly on a boundary counts as bone (−ε), so `sdf ≥ 0` always means "cut".
          const s = Math.max(-BoneVolume.CLAMP, Math.min(BoneVolume.CLAMP, inside ? -Math.max(d, 0.01) : d))
          const id = this.idx(i, j, k)
          this.sdf[id] = s
          const depth = t + z0
          if (inside) this.layer[id] = depth < lo + table ? 1 : depth > hi - table ? 3 : 2
          else if (depth > hi && depth <= hi + this.duraMm) this.layer[id] = 4
          else if (depth > hi + this.duraMm) this.layer[id] = 5
        }
      }
    // Lateral smoothing is not needed: columns are independent but the meshes are continuous, so neighbours agree.
    void colTop
  }

  // ── Queries ──────────────────────────────────────────────────────────────
  /** Layer of the original bone at an MNI point (even if it is cut already). `air` above the skull. */
  layerAt(p: Mni): BoneLayer {
    const [a, b, c] = this.local(p)
    const col = this.col(a, b)
    if (col < 0) return 'air'
    const lo = this.top[col],
      hi = this.bottom[col]
    if (Number.isNaN(lo)) return 'air'
    if (c < lo) return 'air'
    if (c > hi + this.duraMm) return 'brain'
    if (c > hi) return 'dura'
    const thick = hi - lo
    const table = Math.min(1.5, Math.max(0.5, 0.2 * thick))
    return c < lo + table ? 'outer-table' : c > hi - table ? 'inner-table' : 'diploe'
  }

  /** Depth of the point below the outer table of ITS column, mm (negative above it); `NaN` outside the patch / no bone. */
  depthBelowOuter(p: Mni): number {
    const [a, b, c] = this.local(p)
    const col = this.col(a, b)
    if (col < 0 || Number.isNaN(this.top[col])) return NaN
    return c - this.top[col]
  }

  /** Thickness of the original bone at the point's column, mm; 0 when none. */
  thicknessAt(p: Mni): number {
    const [a, b] = this.local(p)
    const col = this.col(a, b)
    return col < 0 || Number.isNaN(this.top[col]) ? 0 : this.bottom[col] - this.top[col]
  }

  /**
   * Distance along the drill axis from `p` to the next layer boundary, mm (stepping 0.1 mm up to `max`).
   * Past the dura it is `Infinity` (nothing left to break through).
   */
  toNextLayer(p: Mni, axis: Mni, max = 6): number {
    const here = this.layerAt(p)
    if (here === 'brain') return Infinity
    for (let s = 0.1; s <= max; s += 0.1) if (this.layerAt(add(p, mul(axis, s))) !== here) return s
    return max
  }

  /** How far `p` is past the end of the bone in its column, mm (positive under the inner table, negative inside the bone); 0 with no bone. */
  pastBone(p: Mni): number {
    const [a, b, c] = this.local(p)
    const col = this.col(a, b)
    return col < 0 || Number.isNaN(this.top[col]) ? 0 : c - this.bottom[col]
  }

  /** Bone left in the column under `p` (from `p` down to the inner table's end), mm; 0 when through. */
  boneBelow(p: Mni): number {
    const [a, b, c] = this.local(p)
    const col = this.col(a, b)
    if (col < 0 || Number.isNaN(this.top[col])) return 0
    return Math.max(0, this.bottom[col] - Math.max(c, this.top[col]))
  }

  /** Bone thickness of every column: the PhD "skull thickness map". */
  thicknessMap(): ThicknessMap {
    const n = this.nu * this.nv
    const mm = new Float32Array(n)
    let min = Infinity,
      max = 0,
      sum = 0,
      cnt = 0
    for (let c = 0; c < n; c++) {
      if (Number.isNaN(this.top[c])) continue
      const t = this.bottom[c] - this.top[c]
      mm[c] = t
      min = Math.min(min, t)
      max = Math.max(max, t)
      sum += t
      cnt++
    }
    return { nu: this.nu, nv: this.nv, h: this.h, mm, min: cnt ? min : 0, mean: cnt ? sum / cnt : 0, max, coverage: cnt / n }
  }

  /**
   * Deepest cut below the outer table, mm, and the width of the opening at the outer plane (largest extent of cut columns,
   * mm). A column counts as cut at depth `d` when its sample there has `sdf ≥ 0` although the original had bone.
   */
  holeStats(): { depthMm: number; widthMm: number; columns: number } {
    const { nu, nv, nw, h } = this
    let depth = 0,
      cols = 0,
      i0 = nu,
      i1 = -1,
      j0 = nv,
      j1 = -1
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const c = j * nu + i
        if (Number.isNaN(this.top[c])) continue
        let deepest = -1
        for (let k = 0; k < nw; k++) {
          const id = this.idx(i, j, k)
          if (this.layer[id] >= 1 && this.layer[id] <= 3 && this.sdf[id] >= 0) deepest = k
        }
        if (deepest < 0) continue
        cols++
        const reach = deepest * h + this.z0 - this.top[c] + h / 2
        depth = Math.max(depth, reach)
        i0 = Math.min(i0, i)
        i1 = Math.max(i1, i)
        j0 = Math.min(j0, j)
        j1 = Math.max(j1, j)
      }
    return { depthMm: depth, widthMm: cols ? Math.max(i1 - i0 + 1, j1 - j0 + 1) * h : 0, columns: cols }
  }

  // ── Carving ──────────────────────────────────────────────────────────────
  /**
   * Remove a sphere of radius `r` at `p` (CSG: `sdf = max(sdf, r − |x − p|)`). Returns the bone removed, mm³ (voxels that
   * flipped from inside to outside). Cost is the sphere's bounding box only.
   */
  carveSphere(p: Mni, r: number): number {
    const [a, b, c] = this.local(p)
    const { h, nu, nv, nw } = this
    const i0 = Math.max(0, Math.floor((a - r) / h + (nu - 1) / 2) - 1),
      i1 = Math.min(nu - 1, Math.ceil((a + r) / h + (nu - 1) / 2) + 1),
      j0 = Math.max(0, Math.floor((b - r) / h + (nv - 1) / 2) - 1),
      j1 = Math.min(nv - 1, Math.ceil((b + r) / h + (nv - 1) / 2) + 1),
      k0 = Math.max(0, Math.floor((c - r - this.z0) / h) - 1),
      k1 = Math.min(nw - 1, Math.ceil((c + r - this.z0) / h) + 1)
    let flipped = 0
    for (let k = k0; k <= k1; k++) {
      const dc = k * h + this.z0 - c
      for (let j = j0; j <= j1; j++) {
        const db = (j - (nv - 1) / 2) * h - b
        for (let i = i0; i <= i1; i++) {
          const da = (i - (nu - 1) / 2) * h - a
          const cut = r - Math.sqrt(da * da + db * db + dc * dc)
          if (cut <= -BoneVolume.CLAMP) continue
          const id = this.idx(i, j, k)
          const was = this.sdf[id]
          const now = Math.max(was, Math.min(BoneVolume.CLAMP, cut))
          if (now !== was) {
            this.sdf[id] = now
            if (was < 0 && now >= 0) flipped++
            this.mark(i, j, k)
          }
        }
      }
    }
    const mm3 = flipped * h * h * h
    this.removedMm3 += mm3
    if (flipped || k1 >= k0) this.version++
    return mm3
  }

  /** Carve along the segment a → b with spheres no further than half a voxel apart (a fast stroke leaves no gaps). */
  carveSegment(a: Mni, b: Mni, r: number): number {
    const d = len(sub(b, a))
    const n = Math.max(1, Math.ceil(d / (this.h * 0.5)))
    let total = 0
    for (let s = 0; s <= n; s++) total += this.carveSphere(add(a, mul(sub(b, a), s / n)), r)
    return total
  }

  /** Is there bone at `p` right now (after cuts)? Trilinear sample of the field. */
  solidAt(p: Mni): boolean {
    return this.sample(p) < 0
  }

  /** Trilinear field value at an MNI point; `CLAMP` outside the patch. */
  sample(p: Mni): number {
    const [a, b, c] = this.local(p)
    const x = a / this.h + (this.nu - 1) / 2,
      y = b / this.h + (this.nv - 1) / 2,
      z = (c - this.z0) / this.h
    if (x < 0 || y < 0 || z < 0 || x >= this.nu - 1 || y >= this.nv - 1 || z >= this.nw - 1) return BoneVolume.CLAMP
    const i = Math.floor(x),
      j = Math.floor(y),
      k = Math.floor(z)
    const fx = x - i,
      fy = y - j,
      fz = z - k
    const s = (di: number, dj: number, dk: number) => this.sdf[this.idx(i + di, j + dj, k + dk)]
    const l = (a0: number, a1: number, t: number) => a0 + (a1 - a0) * t
    return l(l(l(s(0, 0, 0), s(1, 0, 0), fx), l(s(0, 1, 0), s(1, 1, 0), fx), fy), l(l(s(0, 0, 1), s(1, 0, 1), fx), l(s(0, 1, 1), s(1, 1, 1), fx), fy), fz)
  }

  // ── Dirty chunks (for the mesher) ────────────────────────────────────────
  private mark(i: number, j: number, k: number) {
    const c = this.chunk
    // A sample moves the vertices of the 8 cells around it, and those vertices are used by quads of edges up to 2 samples away,
    // so every chunk that owns an edge in [−2, +1] of the sample is rebuilt.
    const span = (x: number) => [Math.floor((x - 2) / c), Math.floor(x / c), Math.floor((x + 1) / c)]
    const ci = span(i),
      cj = span(j),
      ck = span(k)
    for (const a of ci)
      for (const b of cj)
        for (const d of ck) if (a >= 0 && b >= 0 && d >= 0 && a < this.nChunks[0] && b < this.nChunks[1] && d < this.nChunks[2]) this.dirty.add(this.chunkId(a, b, d))
  }
  chunkId(a: number, b: number, c: number) {
    return (c * this.nChunks[1] + b) * this.nChunks[0] + a
  }
  chunkCoords(id: number): [number, number, number] {
    const [na, nb] = this.nChunks
    return [id % na, Math.floor(id / na) % nb, Math.floor(id / (na * nb))]
  }
  /** All chunk ids (first build). */
  allChunks() {
    return Array.from({ length: this.nChunks[0] * this.nChunks[1] * this.nChunks[2] }, (_, i) => i)
  }
  /** Chunks changed since the last call; clears the set. */
  takeDirty(): number[] {
    const out = [...this.dirty]
    this.dirty.clear()
    return out
  }
}
