import * as T from 'three'
import { MeshBVH } from 'three-mesh-bvh'
import type { BrainScene } from '@/scene/BrainScene'
import type { Skin } from '../room'
import { SKULL_IDS } from '../scalp'
import { arachnoidMaterial, csfMaterial, duraMaterial, LAYER_ORDER, makeOpenUniforms, type OpenUniforms } from './materials'
import { chainAt, dirOf, sampleGrid, shellGeometry, SHELLS, type LayerKind, type ShellGrid } from './shells'

type Geo = T.BufferGeometry & { boundsTree?: MeshBVH }

/** Vault bones (not the face): what the layers lie under. */
const VAULT = SKULL_IDS.filter((id) => /frontal|parietal|temporal|occipital|sphenoid/.test(id))

export interface Layer {
  id: string
  kind: LayerKind
  mesh: T.Mesh
}

/**
 * The membranes between the inner table and the cortex (docs/REALISM.md A-3): dura, arachnoid and the CSF that fills the rest, so
 * there is no air under the bone. PROVISIONAL: built from radial height fields over the atlas meshes (`shells.ts`); AG-21's
 * generator replaces them. Layers are never pickable (the cortex and bone keep their picking) and share the scene's section planes.
 */
export class LayerStack {
  readonly group = new T.Group()
  readonly layers: Layer[] = []
  readonly grid: ShellGrid
  readonly open: OpenUniforms = makeOpenUniforms()
  readonly time = { value: 0 }
  private override: Partial<Record<LayerKind, boolean>> = {}
  private skin: Skin = 'on'
  readonly buildMs: number

  readonly scene: BrainScene

  constructor(scene: BrainScene) {
    this.scene = scene
    const t0 = performance.now()
    const targets = scene.toolTargets().filter((t) => t.geometry.boundsTree)
    const skull = targets.filter((t) => VAULT.includes(t.id)).map((t) => t.geometry as Geo)
    const cortex = targets.filter((t) => t.system === 'telencephalon').map((t) => t.geometry as Geo)
    if (skull.length < 4 || cortex.length < 20) throw new Error('layer stack: skull or cortex meshes are not loaded')
    this.grid = sampleGrid(skull, cortex)
    this.group.name = 'anatomy-layers'
    const planes = scene.sectionPlanes
    const mats: Record<LayerKind, T.Material> = {
      dura: duraMaterial(planes, this.open, 'outside'),
      arachnoid: arachnoidMaterial(planes),
      csf: csfMaterial(planes, this.time),
    }
    for (const kind of ['dura', 'arachnoid', 'csf'] as const) {
      const g = shellGeometry(this.grid, SHELLS[kind].outer, SHELLS[kind].inner) as Geo
      g.boundsTree = new MeshBVH(g)
      const mesh = new T.Mesh(g, mats[kind])
      mesh.name = `anat-${kind}`
      mesh.renderOrder = LAYER_ORDER[kind]
      mesh.raycast = () => {}
      mesh.frustumCulled = false
      // The CSF sheen pulses with the wall clock (a real pulse source comes with A-6).
      if (kind === 'csf') mesh.onBeforeRender = () => (this.time.value = performance.now() / 1000)
      this.group.add(mesh)
      this.layers.push({ id: mesh.name, kind, mesh })
    }
    this.buildMs = performance.now() - t0
    this.refresh()
  }

  /** Geometries with BVH, shaped like `toolTargets()` entries (the audit and the tools read layers the same way). */
  targets() {
    return this.layers.map((l) => ({ id: l.id, system: 'anat', geometry: l.mesh.geometry as Geo }))
  }

  /** Dura shows with the bone layers; with the brain alone only the films over it (arachnoid, CSF) remain. */
  setSkin(skin: Skin) {
    this.skin = skin
    this.refresh()
  }
  setLayer(kind: LayerKind, on: boolean | undefined) {
    this.override[kind] = on
    this.refresh()
  }
  isVisible(kind: LayerKind) {
    return this.override[kind] ?? (kind === 'dura' ? this.skin !== 'off' : true)
  }
  private refresh() {
    for (const l of this.layers) l.mesh.visible = this.isVisible(l.kind)
    this.flap?.refreshVisible()
    this.scene.redraw()
  }
  /** The flap lives next to the stack; set by `DuraOpening`. */
  flap: { refreshVisible(): void } | null = null

  /** Radius of a layer boundary in a direction (nearest grid cell), or null where the grid has no data. */
  boundaryAt(dir: T.Vector3, which: 'boneInner' | 'duraInner' | 'arachInner' | 'cortex'): number | null {
    const u = dir.clone().normalize()
    const phi = Math.acos(Math.max(-1, Math.min(1, u.y)))
    if (phi > this.grid.phiMax) return null
    let theta = Math.atan2(u.x, u.z)
    if (theta < 0) theta += Math.PI * 2
    const j = Math.round((phi / this.grid.phiMax) * this.grid.nPhi)
    const k = Math.round((theta / (Math.PI * 2)) * this.grid.nTheta) % this.grid.nTheta
    const c = chainAt(this.grid, j * this.grid.nTheta + k)
    return c ? c[which] : null
  }

  /**
   * PhD: the bone-to-cortex distance map over the vault (what the dura and CSF fill), one row per grid cell: direction (azimuth,
   * polar in the scene frame), point on the inner table (MNI mm) and the gap. For planning corridors and for the audit.
   */
  gapCsv(): string {
    const { nTheta, nPhi, phiMax, centre } = this.grid
    const rows = ['theta_deg,phi_deg,x_mni,y_mni,z_mni,gap_mm']
    const d = new T.Vector3()
    for (let j = 0; j <= nPhi; j++)
      for (let k = 0; k < nTheta; k++) {
        const c = chainAt(this.grid, j * nTheta + k)
        if (!c) continue
        const th = (k / nTheta) * Math.PI * 2,
          ph = (j / nPhi) * phiMax
        dirOf(th, ph, d)
        const x = centre.x + d.x * c.boneInner,
          y = centre.y + d.y * c.boneInner,
          z = centre.z + d.z * c.boneInner
        rows.push([(th * 180) / Math.PI, (ph * 180) / Math.PI, -x, z, y, c.boneInner - c.cortex].map((v) => +v.toFixed(2)).join(','))
      }
    return rows.join('\n')
  }

  dispose() {
    this.group.removeFromParent()
    for (const l of this.layers) {
      l.mesh.geometry.dispose()
      ;(l.mesh.material as T.Material).dispose()
    }
  }
}
