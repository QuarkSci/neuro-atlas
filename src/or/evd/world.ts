import * as T from 'three'
import type { MeshBVH } from 'three-mesh-bvh'
import type { BrainScene } from '@/scene/BrainScene'
import { mniToScene, sceneToMni, type Mni } from '../types'
import type { EvdWorld, SurfaceHit } from './types'

type Geo = T.BufferGeometry & { boundsTree?: MeshBVH }

const hit = { point: new T.Vector3(), distance: 0, faceIndex: 0 }
const INSIDE_DIR = new T.Vector3(0.5773, 0.5774, 0.5773).normalize()
const v = (p: Mni) => {
  const s = mniToScene(p)
  return new T.Vector3(s[0], s[1], s[2])
}
const m = (p: T.Vector3): Mni => sceneToMni([p.x, p.y, p.z])

/**
 * `EvdWorld` over the atlas meshes in the scene (their BVHs: three-mesh-bvh). Scene frame is (−x, z, y), the contract is
 * MNI, so every call converts. Structures load on demand: a missing id answers `null`, never throws.
 */
export function sceneWorld(scene: BrainScene): EvdWorld {
  let geos = new Map<string, Geo>()
  const refresh = () => {
    geos = new Map()
    for (const t of scene.toolTargets()) if (t.geometry.boundsTree) geos.set(t.id, t.geometry)
  }
  refresh()
  const get = (id: string) => geos.get(id) ?? (refresh(), geos.get(id))
  const cache = new Map<string, Mni | null>()

  return {
    isInside(id, p) {
      const g = get(id)
      if (!g?.boundsTree) return null
      const bb = g.boundingBox ?? (g.computeBoundingBox(), g.boundingBox!)
      const sp = v(p)
      if (!bb.containsPoint(sp)) return false
      const h = g.boundsTree.raycastFirst(new T.Ray(sp, INSIDE_DIR), T.DoubleSide)
      return !!h && !!h.face && h.face.normal.dot(INSIDE_DIR) > 0
    },
    distanceTo(id, p) {
      const g = get(id)
      if (!g?.boundsTree) return null
      return g.boundsTree.closestPointToPoint(v(p), hit)?.distance ?? null
    },
    centroid(id) {
      if (cache.has(id)) return cache.get(id)!
      const g = get(id)
      let c: Mni | null = null
      if (g) {
        const pos = g.attributes.position
        let x = 0,
          y = 0,
          z = 0
        for (let i = 0; i < pos.count; i++) {
          x += pos.getX(i)
          y += pos.getY(i)
          z += pos.getZ(i)
        }
        c = m(new T.Vector3(x / pos.count, y / pos.count, z / pos.count))
      }
      cache.set(id, c)
      return c
    },
    raycast(ids, origin, dir) {
      const ray = new T.Ray(v(origin), v(dir).normalize())
      let best: SurfaceHit | null = null
      for (const id of ids) {
        const g = get(id)
        const h = g?.boundsTree?.raycastFirst(ray, T.DoubleSide)
        if (!h || !h.face) continue
        if (!best || h.distance < best.distance) {
          const n = h.face.normal
          best = { point: m(h.point), normal: m(n.clone()), distance: h.distance }
        }
      }
      return best
    },
    vertices(id, max) {
      const g = get(id)
      if (!g) return null
      const pos = g.attributes.position
      const step = Math.max(1, Math.ceil(pos.count / max))
      const out: Mni[] = []
      const t = new T.Vector3()
      for (let i = 0; i < pos.count; i += step) out.push(m(t.set(pos.getX(i), pos.getY(i), pos.getZ(i))))
      return out
    },
  }
}
