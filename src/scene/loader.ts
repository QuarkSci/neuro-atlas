import * as T from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Part } from '@/data/types'

/**
 * MNI152 is RAS (+X right, +Y anterior, +Z superior); three.js scenes are
 * Y-up with the camera's "front" view looking down −Z. Mapping
 * three = (−x, z, y) is a proper rotation that puts superior up, anterior
 * toward +Z (facing the front camera) and the subject's left on the viewer's
 * right — the ordinary anatomical convention. Baked into each geometry once
 * so everything downstream works in plain scene coordinates.
 */
export const MNI_TO_SCENE = new T.Matrix4().set(-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1)

const MESHES_URL = `${import.meta.env.BASE_URL}meshes/`

export interface LoadedGeometry {
  part: Part
  geometry: T.BufferGeometry
}

/**
 * Fetch every leaf mesh with bounded concurrency, reporting progress as a
 * fraction. A missing file is logged and skipped rather than failing the
 * whole atlas, so a partial mesh set still renders.
 */
export async function loadGeometries(parts: Part[], onProgress: (done: number, total: number) => void, concurrency = 12): Promise<LoadedGeometry[]> {
  const loader = new GLTFLoader()
  const out: LoadedGeometry[] = []
  let next = 0
  let done = 0
  const worker = async () => {
    while (next < parts.length) {
      const part = parts[next++]
      try {
        const gltf = await loader.loadAsync(MESHES_URL + part.mesh)
        let geometry: T.BufferGeometry | null = null
        gltf.scene.traverse((o) => {
          if (!geometry && o instanceof T.Mesh) geometry = o.geometry as T.BufferGeometry
        })
        if (geometry) {
          const g = geometry as T.BufferGeometry
          g.applyMatrix4(MNI_TO_SCENE)
          if (!g.attributes.normal) g.computeVertexNormals()
          g.computeBoundingBox()
          g.computeBoundingSphere()
          out.push({ part, geometry: g })
        } else console.warn(`No mesh inside ${part.mesh}`)
      } catch (e) {
        console.warn(`Could not load ${part.mesh}`, e)
      }
      done++
      onProgress(done, parts.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, parts.length) }, worker))
  return out
}
