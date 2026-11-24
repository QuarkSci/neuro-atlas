import * as T from 'three'
import { mniToScene } from '../types'
import { meshChunk } from './mesher'
import type { BoneVolume } from './volume'

/**
 * Draws a `BoneVolume` in the 3D scene: one mesh per 16³ chunk, rebuilt only when the drill touched it. The scene frame is
 * (−x, z, y); the mesher output is MNI, so vertices are swapped here (a proper rotation, winding is kept).
 */
export class DrillMeshView {
  readonly group = new T.Group()
  private meshes = new Map<number, T.Mesh>()
  readonly material: T.Material

  readonly vol: BoneVolume

  constructor(vol: BoneVolume, material?: T.Material) {
    this.vol = vol
    this.material = material ?? new T.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.75, metalness: 0, side: T.DoubleSide })
    this.group.name = 'drill-bone'
    this.sync(Infinity, true)
  }

  /**
   * Rebuild the dirty chunks (all of them when `all`), stopping when `budgetMs` is used up (the rest stays dirty for the
   * next call). Returns { chunks, ms }.
   */
  sync(budgetMs = 4, all = false) {
    const t0 = performance.now()
    const ids = all ? this.vol.allChunks() : this.vol.takeDirty()
    let done = 0
    for (const id of ids) {
      if (!all && performance.now() - t0 > budgetMs) {
        this.pending.push(id)
        continue
      }
      this.rebuild(id)
      done++
    }
    // Chunks postponed by an earlier call go first next time.
    if (!all && this.pending.length) {
      const again = this.pending.splice(0)
      for (const id of again) {
        if (performance.now() - t0 > budgetMs) this.pending.push(id)
        else {
          this.rebuild(id)
          done++
        }
      }
    }
    return { chunks: done, ms: performance.now() - t0, pending: this.pending.length }
  }
  private pending: number[] = []

  private rebuild(id: number) {
    const m = meshChunk(this.vol, id)
    let mesh = this.meshes.get(id)
    if (!m.indices.length) {
      if (mesh) {
        mesh.visible = false
      }
      return
    }
    const pos = new Float32Array(m.positions.length),
      nor = new Float32Array(m.normals.length)
    for (let i = 0; i < m.positions.length; i += 3) {
      const p = mniToScene([m.positions[i], m.positions[i + 1], m.positions[i + 2]])
      pos.set(p, i)
      const n = mniToScene([m.normals[i], m.normals[i + 1], m.normals[i + 2]])
      nor.set(n, i)
    }
    if (!mesh) {
      mesh = new T.Mesh(new T.BufferGeometry(), this.material)
      mesh.frustumCulled = false
      this.meshes.set(id, mesh)
      this.group.add(mesh)
    }
    mesh.visible = true
    const g = mesh.geometry
    g.setAttribute('position', new T.BufferAttribute(pos, 3))
    g.setAttribute('normal', new T.BufferAttribute(nor, 3))
    g.setIndex(new T.BufferAttribute(m.indices, 1))
    g.computeBoundingSphere()
  }

  dispose() {
    for (const m of this.meshes.values()) m.geometry.dispose()
    this.material.dispose()
    this.group.removeFromParent()
  }
}
