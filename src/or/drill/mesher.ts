import type { Mni } from '../types'
import type { BoneVolume } from './volume'

/**
 * Surface nets over one chunk of the bone field. Vertices are placed at the mean of the edge crossings of a cell (linear
 * interpolation of the sdf), quads are emitted per sign-changing edge whose lower sample lies in the chunk. A cell on a chunk
 * border is computed by both chunks from the same samples, so the seam is exact and a chunk can be rebuilt alone.
 * Output is in MNI mm (the scene converts); normals come from the field gradient.
 */
export interface ChunkMesh {
  positions: Float32Array
  normals: Float32Array
  indices: Uint32Array
  /** Quad count (2 triangles each). */
  quads: number
}

const CORNERS: [number, number, number][] = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
]
const EDGES: [number, number][] = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
]

export function meshChunk(vol: BoneVolume, chunkId: number): ChunkMesh {
  const { nu, nv, nw, chunk } = vol
  const [ci, cj, ck] = vol.chunkCoords(chunkId)
  const i0 = ci * chunk,
    j0 = cj * chunk,
    k0 = ck * chunk
  // Half-open ownership: an edge belongs to the chunk that holds its lower sample, so no quad is emitted twice.
  const i1 = Math.min(nu, i0 + chunk),
    j1 = Math.min(nv, j0 + chunk),
    k1 = Math.min(nw, k0 + chunk)
  const s = vol.sdf
  const pos: number[] = [],
    nor: number[] = [],
    idx: number[] = []
  const cache = new Map<number, number>()
  const sv = new Float64Array(8)

  /** Vertex index of cell (i, j, k) (its min corner), creating it when the cell is crossed; −1 if not crossed. */
  const cellVertex = (i: number, j: number, k: number): number => {
    const key = (k * nv + j) * nu + i
    const hit = cache.get(key)
    if (hit !== undefined) return hit
    if (i < 0 || j < 0 || k < 0 || i >= nu - 1 || j >= nv - 1 || k >= nw - 1) return -1
    let mask = 0
    for (let c = 0; c < 8; c++) {
      const [a, b, d] = CORNERS[c]
      sv[c] = s[vol.idx(i + a, j + b, k + d)]
      if (sv[c] < 0) mask |= 1 << c
    }
    if (mask === 0 || mask === 255) {
      cache.set(key, -1)
      return -1
    }
    let x = 0,
      y = 0,
      z = 0,
      n = 0
    for (const [e0, e1] of EDGES) {
      const a = sv[e0],
        b = sv[e1]
      if (a < 0 === b < 0) continue
      const t = a / (a - b)
      const c0 = CORNERS[e0],
        c1 = CORNERS[e1]
      x += c0[0] + (c1[0] - c0[0]) * t
      y += c0[1] + (c1[1] - c0[1]) * t
      z += c0[2] + (c1[2] - c0[2]) * t
      n++
    }
    x = i + x / n
    y = j + y / n
    z = k + z / n
    const p = grid(vol, x, y, z)
    const g = gradient(vol, p)
    const id = pos.length / 3
    pos.push(p[0], p[1], p[2])
    nor.push(g[0], g[1], g[2])
    cache.set(key, id)
    return id
  }

  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return
    if (flip) idx.push(a, d, c, a, c, b)
    else idx.push(a, b, c, a, c, d)
  }

  // Edges owned by the chunk: lower sample in [i0, i1) etc. (the last chunk also owns its upper face).
  for (let k = k0; k < k1; k++)
    for (let j = j0; j < j1; j++)
      for (let i = i0; i < i1; i++) {
        const here = s[vol.idx(i, j, k)] < 0
        // x edge: samples (i,j,k)-(i+1,j,k); cells (i, j-1..j, k-1..k)
        if (i < nu - 1 && j > 0 && k > 0 && j < nv - 1 && k < nw - 1 && here !== s[vol.idx(i + 1, j, k)] < 0)
          quad(cellVertex(i, j - 1, k - 1), cellVertex(i, j, k - 1), cellVertex(i, j, k), cellVertex(i, j - 1, k), !here)
        if (j < nv - 1 && i > 0 && k > 0 && i < nu - 1 && k < nw - 1 && here !== s[vol.idx(i, j + 1, k)] < 0)
          quad(cellVertex(i - 1, j, k - 1), cellVertex(i - 1, j, k), cellVertex(i, j, k), cellVertex(i, j, k - 1), !here)
        if (k < nw - 1 && i > 0 && j > 0 && i < nu - 1 && j < nv - 1 && here !== s[vol.idx(i, j, k + 1)] < 0)
          quad(cellVertex(i - 1, j - 1, k), cellVertex(i, j - 1, k), cellVertex(i, j, k), cellVertex(i - 1, j, k), !here)
      }

  return { positions: new Float32Array(pos), normals: new Float32Array(nor), indices: new Uint32Array(idx), quads: idx.length / 6 }
}

/** MNI position of fractional grid coordinates. */
function grid(vol: BoneVolume, x: number, y: number, z: number): Mni {
  const a = (x - (vol.nu - 1) / 2) * vol.h,
    b = (y - (vol.nv - 1) / 2) * vol.h,
    c = z * vol.h + vol.z0
  return [
    vol.center[0] + vol.u[0] * a + vol.v[0] * b + vol.w[0] * c,
    vol.center[1] + vol.u[1] * a + vol.v[1] * b + vol.w[1] * c,
    vol.center[2] + vol.u[2] * a + vol.v[2] * b + vol.w[2] * c,
  ]
}

/** Outward normal (towards positive sdf) at an MNI point: central differences of the trilinear field. */
function gradient(vol: BoneVolume, p: Mni): Mni {
  const e = vol.h
  const d = (ax: 0 | 1 | 2) => {
    const a: [number, number, number] = [p[0], p[1], p[2]],
      b: [number, number, number] = [p[0], p[1], p[2]]
    a[ax] += e
    b[ax] -= e
    return vol.sample(a) - vol.sample(b)
  }
  const g: Mni = [d(0), d(1), d(2)]
  const l = Math.hypot(g[0], g[1], g[2]) || 1
  return [g[0] / l, g[1] / l, g[2] / l]
}
