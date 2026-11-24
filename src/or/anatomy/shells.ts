import * as T from 'three'
import type { MeshBVH } from 'three-mesh-bvh'
import { pairSurfaces } from '../drill/boneWorld'

type Geo = T.BufferGeometry & { boundsTree?: MeshBVH }

/**
 * PROVISIONAL thicknesses, mm (docs/REALISM.md 1: TAXMINIY). AG-21's `src/or/anatomy/layers.ts` (Sourced values) replaces them; until
 * then every use is marked provisional. Dura 0.3–1, arachnoid 0.1–0.2; the CSF takes whatever is left up to the cortex.
 */
export const PROVISIONAL_MM = { dura: 0.6, arachnoid: 0.2 } as const

/** See `SHELLS.csf`. */
export const CSF_INSET_MM = 1

export type LayerKind = 'dura' | 'arachnoid' | 'csf'

/** Radial height fields from the brain centre: inner bone surface and cortex surface in every grid direction (NaN = unknown). */
export interface ShellGrid {
  centre: T.Vector3
  nTheta: number
  nPhi: number
  phiMax: number
  /** Distance from the centre to the inner table of the vault. */
  inner: Float32Array
  /** Distance from the centre to the outer cortex surface under it. */
  cortex: Float32Array
}

const dirOf = (theta: number, phi: number, out = new T.Vector3()) => out.set(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta))
export { dirOf }

/**
 * Sample the grid. The vault is the first bone run seen from the centre (pair-by-parity, like the drilling model); the cortex is the
 * nearest cortical surface looking back from the inner table. Cells without both stay NaN (skull base, orbits).
 */
export function sampleGrid(skull: Geo[], cortex: Geo[], opt: { nTheta?: number; nPhi?: number; phiMaxDeg?: number } = {}): ShellGrid {
  const nTheta = opt.nTheta ?? 192
  const nPhi = opt.nPhi ?? 72
  const phiMax = ((opt.phiMaxDeg ?? 118) * Math.PI) / 180
  const box = new T.Box3()
  for (const g of cortex) {
    g.boundingBox ?? g.computeBoundingBox()
    box.union(g.boundingBox!)
  }
  const centre = box.getCenter(new T.Vector3())
  const inner = new Float32Array((nPhi + 1) * nTheta).fill(NaN)
  const cx = new Float32Array((nPhi + 1) * nTheta).fill(NaN)
  const ray = new T.Ray()
  const d = new T.Vector3()
  const o = new T.Vector3()
  const hit = (list: Geo[], org: T.Vector3, dir: T.Vector3, far: number) => {
    ray.origin.copy(org)
    ray.direction.copy(dir)
    const h: number[] = []
    for (const g of list) for (const x of g.boundsTree!.raycast(ray, T.DoubleSide, 0, far)) h.push(x.distance)
    return h
  }
  for (let j = 0; j <= nPhi; j++)
    for (let k = 0; k < nTheta; k++) {
      dirOf((k / nTheta) * Math.PI * 2, (j / nPhi) * phiMax, d)
      const runs = pairSurfaces(hit(skull, centre, d, 400))
      if (!runs.length) continue
      const inn = runs[0][0]
      // Back from just inside the inner table toward the centre: the first cortical surface met is the outer surface.
      o.copy(centre).addScaledVector(d, inn - 0.05)
      ray.origin.copy(o)
      ray.direction.copy(d).negate()
      let best = Infinity
      for (const g of cortex) {
        const h = g.boundsTree!.raycastFirst(ray, T.DoubleSide, 0, inn)
        if (h && h.distance < best) best = h.distance
      }
      if (!isFinite(best)) continue
      inner[j * nTheta + k] = inn
      cx[j * nTheta + k] = inn - 0.05 - best
    }
  // The pole row is one point: every cell of it shares the mean (a ray along the axis would otherwise graze a fan of edges).
  let si = 0,
    sc = 0,
    n = 0
  for (let k = 0; k < nTheta; k++)
    if (inner[k] > 0 && cx[k] > 0) {
      si += inner[k]
      sc += cx[k]
      n++
    }
  for (let k = 0; k < nTheta; k++) {
    inner[k] = n ? si / n : NaN
    cx[k] = n ? sc / n : NaN
  }
  return { centre, nTheta, nPhi, phiMax, inner, cortex: cx }
}

export interface Chain {
  /** Radial boundaries, outer → inner: inner bone | dura | arachnoid | CSF | cortex. */
  boneInner: number
  duraInner: number
  arachInner: number
  cortex: number
}

/** The layer boundaries in one cell; thin gaps shrink the membranes in proportion so the chain always closes with no air. */
export function chainAt(grid: ShellGrid, idx: number): Chain | null {
  const inn = grid.inner[idx],
    cx = grid.cortex[idx]
  if (!(inn > 0) || !(cx > 0)) return null
  const gap = inn - cx
  if (gap < 0.04) return null
  const td = Math.min(PROVISIONAL_MM.dura, gap * 0.6)
  const ta = Math.min(PROVISIONAL_MM.arachnoid, gap * 0.2)
  return { boneInner: inn, duraInner: inn - td, arachInner: inn - td - ta, cortex: cx }
}

/**
 * Closed-looking membrane volume: an outer sheet and an inner sheet (inner winding flipped), radii `rOuter(idx)` / `rInner(idx)`.
 * Cells without a chain are skipped, so the shell stops where the grid has no data. Seams wrap in theta.
 */
export function shellGeometry(grid: ShellGrid, rOuter: (c: Chain) => number, rInner: (c: Chain) => number): T.BufferGeometry {
  const { nTheta: nT, nPhi: nP } = grid
  const pos: number[] = []
  const index: number[] = []
  const vid = new Int32Array((nP + 1) * nT * 2).fill(-1)
  const d = new T.Vector3()
  const chains: (Chain | null)[] = []
  for (let i = 0; i < (nP + 1) * nT; i++) chains.push(chainAt(grid, i))
  for (let j = 0; j <= nP; j++)
    for (let k = 0; k < nT; k++) {
      const i = j * nT + k
      const c = chains[i]
      if (!c) continue
      dirOf((k / nT) * Math.PI * 2, (j / nP) * grid.phiMax, d)
      for (const [s, r] of [rOuter(c), rInner(c)].entries()) {
        vid[i * 2 + s] = pos.length / 3
        pos.push(grid.centre.x + d.x * r, grid.centre.y + d.y * r, grid.centre.z + d.z * r)
      }
    }
  for (let j = 0; j < nP; j++)
    for (let k = 0; k < nT; k++) {
      const k1 = (k + 1) % nT
      const a = j * nT + k,
        b = j * nT + k1,
        c = (j + 1) * nT + k,
        e = (j + 1) * nT + k1
      for (let s = 0; s < 2; s++) {
        const ia = vid[a * 2 + s],
          ib = vid[b * 2 + s],
          ic = vid[c * 2 + s],
          ie = vid[e * 2 + s]
        if (ia < 0 || ib < 0 || ic < 0 || ie < 0) continue
        // Outward winding on the outer sheet (as scalp.ts), flipped on the inner one. The pole row is one point: its quads are one triangle.
        if (j === 0) {
          if (s === 0) index.push(ib, ic, ie)
          else index.push(ib, ie, ic)
        } else if (s === 0) index.push(ia, ic, ib, ib, ic, ie)
        else index.push(ia, ib, ic, ib, ie, ic)
      }
    }
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  g.computeBoundingBox()
  g.computeBoundingSphere()
  return g
}

export const SHELLS: Record<LayerKind, { outer: (c: Chain) => number; inner: (c: Chain) => number }> = {
  dura: { outer: (c) => c.boneInner - 0.01, inner: (c) => c.duraInner },
  arachnoid: { outer: (c) => c.duraInner, inner: (c) => c.arachInner },
  // The CSF fills everything left up to the cortex surface. Its inner sheet runs CSF_INSET mm INSIDE the cortex (opaque, so never seen): the
  // grid interpolates the cortex radius between nodes, and across steep gyri that can fall short of the true surface by a few tenths of a mm.
  csf: { outer: (c) => c.arachInner, inner: (c) => c.cortex - CSF_INSET_MM },
}
