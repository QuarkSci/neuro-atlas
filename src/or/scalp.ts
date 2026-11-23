import * as T from 'three'

/** Cranial and facial bones the scalp is wrapped around (all `skull` parts of the gross layer). */
export const SKULL_IDS = [
  'g-frontal-bone',
  'g-left-parietal-bone',
  'g-right-parietal-bone',
  'g-left-temporal-bone',
  'g-right-temporal-bone',
  'g-occipital-bone',
  'g-sphenoid-bone',
  'g-ethmoid',
  'g-left-zygomatic-bone',
  'g-right-zygomatic-bone',
  'g-left-maxilla',
  'g-right-maxilla',
  'g-left-nasal-bone',
  'g-right-nasal-bone',
  'g-mandible',
]

export interface ScalpOptions {
  /** Soft-tissue thickness added over the bone, mm (vault 5–7 mm). */
  thickness?: number
  /** Grid resolution: azimuth × polar steps. */
  nTheta?: number
  nPhi?: number
}

export interface Scalp {
  geometry: T.BufferGeometry
  /** Head centre (scene mm): the origin of the radial grid. */
  centre: T.Vector3
  /** Scalp surface point in a direction (scene mm), from the radial grid. */
  surfaceAt: (dir: T.Vector3) => T.Vector3
  /** Lowest point of the skull (the chin), scene y. */
  chinY: number
  /** Top of the skull (vertex), scene y. */
  vertexY: number
  /** Skull bounds, scene mm. */
  box: T.Box3
  thickness: number
}

const dirOf = (theta: number, phi: number, out = new T.Vector3()) => out.set(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta))

/**
 * A head from the skull: the bone's outer radius in every direction from the head centre (a radial height field),
 * dilated, smoothed, thickened by the soft tissue, then lofted into a neck. The face is a simplification (the nose
 * is a smooth bulge, the orbits are not hollowed): the scalp is there to carry the pins, drapes and the "skin"
 * layer, not to be anatomy. Every skull vertex is inside it by at least `thickness - 1` mm.
 */
export function buildScalp(skull: T.BufferGeometry[], opt: ScalpOptions = {}): Scalp {
  const thickness = opt.thickness ?? 6
  const nT = opt.nTheta ?? 144
  const nP = opt.nPhi ?? 84
  const box = new T.Box3()
  for (const g of skull) {
    g.computeBoundingBox()
    box.union(g.boundingBox!)
  }
  // Centre of the braincase: the middle of the cranial vault (not the face, which would drag it forward).
  const size = box.getSize(new T.Vector3())
  const centre = new T.Vector3((box.min.x + box.max.x) / 2, box.min.y + size.y * 0.62, box.min.z + size.z * 0.5)
  const PHI_MAX = (152 * Math.PI) / 180
  const nPg = Math.round((nP * PHI_MAX) / Math.PI)

  // 1. Outermost bone radius per (theta, phi) bin.
  const raw = new Float32Array((nPg + 1) * nT).fill(0)
  const v = new T.Vector3()
  for (const g of skull) {
    const pos = g.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).sub(centre)
      const r = v.length()
      if (r < 1e-3) continue
      const phi = Math.acos(Math.max(-1, Math.min(1, v.y / r)))
      if (phi > PHI_MAX + 0.05) continue
      let theta = Math.atan2(v.x, v.z)
      if (theta < 0) theta += Math.PI * 2
      const j = Math.min(nPg, Math.round((phi / PHI_MAX) * nPg))
      const k = Math.floor((theta / (Math.PI * 2)) * nT) % nT
      const idx = j * nT + k
      if (r > raw[idx]) raw[idx] = r
    }
  }
  // 2. Fill empty bins from their neighbours (propagate until none is left).
  const R = raw.slice()
  const get = (a: Float32Array, j: number, k: number) => a[Math.max(0, Math.min(nPg, j)) * nT + ((k + nT) % nT)]
  for (let pass = 0; pass < 40; pass++) {
    let empty = 0
    const next = R.slice()
    for (let j = 0; j <= nPg; j++)
      for (let k = 0; k < nT; k++) {
        if (R[j * nT + k] > 0) continue
        let sum = 0,
          n = 0
        for (const [dj, dk] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const a = get(R, j + dj, k + dk)
          if (a > 0) {
            sum += a
            n++
          }
        }
        if (n) next[j * nT + k] = sum / n
        else empty++
      }
    R.set(next)
    if (!empty) break
  }
  // The pole bins share one value: the highest bone point straight up.
  let top = 0
  for (let k = 0; k < nT; k++) top = Math.max(top, R[k], R[nT + k])
  for (let k = 0; k < nT; k++) R[k] = top

  // 3. Dilate (so bone never pokes through after smoothing), smooth, never fall below the bone.
  const dilate = (a: Float32Array, rad: number) => {
    const o = a.slice()
    for (let j = 0; j <= nPg; j++)
      for (let k = 0; k < nT; k++) {
        let m = 0
        for (let dj = -rad; dj <= rad; dj++) for (let dk = -rad; dk <= rad; dk++) m = Math.max(m, get(a, j + dj, k + dk))
        o[j * nT + k] = m
      }
    return o
  }
  const blur = (a: Float32Array) => {
    const o = a.slice()
    for (let j = 1; j <= nPg; j++)
      for (let k = 0; k < nT; k++) {
        o[j * nT + k] =
          (4 * get(a, j, k) +
            2 * (get(a, j - 1, k) + get(a, j + 1, k) + get(a, j, k - 1) + get(a, j, k + 1)) +
            get(a, j - 1, k - 1) +
            get(a, j - 1, k + 1) +
            get(a, j + 1, k - 1) +
            get(a, j + 1, k + 1)) /
          16
      }
    return o
  }
  let S = dilate(R, 2)
  for (let i = 0; i < 4; i++) S = blur(S)
  for (let i = 0; i < S.length; i++) S[i] = Math.max(S[i], R[i]) + thickness
  for (let i = 0; i < 2; i++) S = blur(S)
  for (let i = 0; i < S.length; i++) S[i] = Math.max(S[i], R[i] + thickness - 1)

  // 4. Rows of ring points: the head, a loft into the neck, the neck tube.
  const rows: T.Vector3[][] = []
  const d = new T.Vector3()
  for (let j = 0; j <= nPg; j++) {
    const ring: T.Vector3[] = []
    for (let k = 0; k <= nT; k++) {
      const theta = (k / nT) * Math.PI * 2
      dirOf(theta, (j / nPg) * PHI_MAX, d)
      ring.push(
        d
          .clone()
          .multiplyScalar(S[j * nT + (k % nT)])
          .add(centre),
      )
    }
    rows.push(ring)
  }
  const last = rows[rows.length - 1]
  let lowY = Infinity
  for (const p of last) lowY = Math.min(lowY, p.y)
  // The neck sits behind the jaw: an ellipse a little posterior to the head centre.
  const neckC = new T.Vector3(centre.x, 0, centre.z - 14)
  const rx = 56,
    rz = 62
  const neckRing = (y: number) => {
    const ring: T.Vector3[] = []
    for (let k = 0; k <= nT; k++) {
      const th = (k / nT) * Math.PI * 2
      ring.push(new T.Vector3(neckC.x + rx * Math.sin(th), y, neckC.z + rz * Math.cos(th)))
    }
    return ring
  }
  const loftTo = lowY - 34
  const nLoft = 10
  const sm = (t: number) => t * t * (3 - 2 * t)
  const end = neckRing(loftTo)
  for (let i = 1; i <= nLoft; i++) {
    const t = i / nLoft
    const s = sm(t)
    rows.push(last.map((p, k) => new T.Vector3(p.x + (end[k].x - p.x) * s, p.y + (loftTo - p.y) * t, p.z + (end[k].z - p.z) * s)))
  }
  const tubeEnd = loftTo - 190
  for (let i = 1; i <= 6; i++) rows.push(neckRing(loftTo + ((tubeEnd - loftTo) * i) / 6))

  // 5. Indexed mesh.
  const nRow = rows.length
  const position = new Float32Array(nRow * (nT + 1) * 3)
  rows.forEach((ring, j) => ring.forEach((p, k) => p.toArray(position, (j * (nT + 1) + k) * 3)))
  const index: number[] = []
  for (let j = 0; j < nRow - 1; j++)
    for (let k = 0; k < nT; k++) {
      const a = j * (nT + 1) + k,
        b = a + 1,
        c = a + (nT + 1),
        e = c + 1
      // Outward-facing winding (checked against the vertex normals in shot-or.mjs).
      index.push(a, c, b, b, c, e)
    }
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.BufferAttribute(position, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  // A smooth mesh: the pole and the seam share normals instead of a crease.
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  const surfaceAt = (dir: T.Vector3) => {
    const u = dir.clone().normalize()
    const phi = Math.acos(Math.max(-1, Math.min(1, u.y)))
    let theta = Math.atan2(u.x, u.z)
    if (theta < 0) theta += Math.PI * 2
    const jf = Math.min(nPg, (phi / PHI_MAX) * nPg)
    const kf = (theta / (Math.PI * 2)) * nT
    const j0 = Math.floor(jf),
      k0 = Math.floor(kf) % nT,
      fj = jf - j0,
      fk = kf - Math.floor(kf)
    const val = (j: number, k: number) => S[Math.min(nPg, j) * nT + (k % nT)]
    const r = val(j0, k0) * (1 - fj) * (1 - fk) + val(j0 + 1, k0) * fj * (1 - fk) + val(j0, k0 + 1) * (1 - fj) * fk + val(j0 + 1, k0 + 1) * fj * fk
    return u.multiplyScalar(r).add(centre)
  }
  return { geometry, centre, surfaceAt, chinY: box.min.y, vertexY: box.max.y, box, thickness }
}
