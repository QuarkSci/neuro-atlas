import * as T from 'three'
import type { MeshBVH } from 'three-mesh-bvh'
import type { BrainScene } from '@/scene/BrainScene'
import { mniToScene, type Mni } from '../types'
import type { BoneSource } from './volume'

type Geo = T.BufferGeometry & { boundsTree?: MeshBVH }

/** Union of intervals, sorted. */
export function mergeIntervals(iv: [number, number][]): [number, number][] {
  const s = [...iv].sort((a, b) => a[0] - b[0])
  const out: [number, number][] = []
  for (const x of s) {
    const last = out[out.length - 1]
    if (last && x[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], x[1])
    else out.push([x[0], x[1]])
  }
  return out
}

/** Hits closer than this are one surface (the atlas bones are double sheets: two coincident faces per surface). */
const SHEET_MM = 0.15

/**
 * Pair surface distances (sorted) into bone runs by parity: 1st–2nd surface is bone, 3rd–4th the next bone, and so on.
 * Near-coincident hits collapse into one surface first. This does not depend on face winding, which the atlas meshes
 * do not keep (a hit list can read enter, exit, exit, enter for one sheet pair).
 */
export function pairSurfaces(hits: number[]): [number, number][] {
  const s = [...hits].sort((a, b) => a - b)
  const surf: number[] = []
  for (const d of s) {
    const last = surf[surf.length - 1]
    if (last !== undefined && d - last < SHEET_MM) continue
    surf.push(d)
  }
  const out: [number, number][] = []
  for (let i = 0; i + 1 < surf.length; i += 2) out.push([surf[i], surf[i + 1]])
  return out
}

/**
 * `BoneSource` over the atlas skull meshes (their BVHs). The atlas bones are sheet pairs (outer and inner table), so the
 * bone is what lies between the 1st and 2nd surface along the ray; overlapping bones (a suture) share the hit list.
 */
export function sceneBone(scene: BrainScene, ids: readonly string[]): BoneSource {
  const geos = scene
    .toolTargets()
    .filter((t) => ids.includes(t.id) && (t.geometry as Geo).boundsTree)
    .map((t) => t.geometry as Geo)
  const ray = new T.Ray()
  return {
    columns(origin: Mni, dir: Mni, maxLen: number) {
      const o = mniToScene(origin),
        d = mniToScene(dir)
      ray.origin.set(o[0], o[1], o[2])
      ray.direction.set(d[0], d[1], d[2])
      const hits: number[] = []
      for (const g of geos) for (const h of g.boundsTree!.raycast(ray, T.DoubleSide, 0, maxLen)) hits.push(h.distance)
      return pairSurfaces(hits)
    },
  }
}
