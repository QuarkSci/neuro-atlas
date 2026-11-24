import * as T from 'three'
import type { MeshBVH } from 'three-mesh-bvh'
import type { BrainScene } from '@/scene/BrainScene'
import type { OperatingRoom } from '../room'

type Geo = T.BufferGeometry & { boundsTree?: MeshBVH }

/**
 * PROVISIONAL split of the soft-tissue thickness (docs/REALISM.md 1: teri 3–6, yog' 2–6, galea 1–3, perikranium ≈ 0.5 mm; TAXMINIY — AG-21 manbasi
 * kelgach `layers.ts` dan olinadi). The scalp of `scalp.ts` is one thickness everywhere, so the layers are fractions of it, outside → in.
 */
export const HEAD_FRACTIONS = { skin: [0, 0.4], fat: [0.4, 0.68], galea: [0.68, 0.9], pericranium: [0.9, 0.97] } as const
export type HeadLayer = keyof typeof HEAD_FRACTIONS | 'temporalis'
const ORDER = ['skin', 'fat', 'galea', 'pericranium'] as const
/** Depth progress (0..1) at which each layer has been cut through. */
const CUT_AT: Record<(typeof ORDER)[number], number> = { skin: 0.2, fat: 0.4, galea: 0.6, pericranium: 0.8 }

const PATCH_MM = 90
const STEP_MM = 1.6
const WIDTH_MM = 11
const STAIR_MM = 1.3

export interface HeadReport {
  lengthMm: number
  widthMm: number
  depth: number
  retract: number
  /** Soft-tissue thickness at the site and per layer, mm (provisional). */
  thicknessMm: number
  layersMm: Record<(typeof ORDER)[number], number>
  /** Deepest layer cut so far, or null. */
  cutThrough: HeadLayer | null
  boneExposed: boolean
  /** Outer table area uncovered, mm² (the slot at the pericranium's width; 0 until it is cut). */
  boneAreaMm2: number
  /** Distance from the incision centre to the wanted point (Kocher or the mark), mm, or null. */
  offsetMm: number | null
}

/** Shared slot uniforms: a capsule (segment of half-length `uL` along U, radius = the layer's own half-width) in the tangent plane at `uC`. */
export interface SlotShared {
  uSlotC: { value: T.Vector3 }
  uSlotU: { value: T.Vector3 }
  uSlotN: { value: T.Vector3 }
  uSlotL: { value: number }
}
interface SlotOwn {
  uSlotW: { value: number }
  uSlotOn: { value: number }
}
const patched = new WeakSet<T.Material>()

/** A fragment test in a material (onBeforeCompile, chained): discards the fragments inside the slot of this layer. */
function slotPatch(m: T.Material, shared: SlotShared, own: SlotOwn) {
  const prev = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    prev?.call(m, shader, renderer)
    Object.assign(shader.uniforms, shared, own)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSlotPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSlotPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSlotPos;\nuniform vec3 uSlotC, uSlotU, uSlotN;\nuniform float uSlotL, uSlotW, uSlotOn;')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
if (uSlotOn > 0.5 && uSlotW > 0.0) { vec3 d = vSlotPos - uSlotC; float h = dot(d, uSlotN); vec3 t = d - uSlotN * h; float a = dot(t, uSlotU); float b = length(t - uSlotU * a);
  float q = clamp(a, -uSlotL, uSlotL); if (abs(h) < 14.0 && length(vec2(a - q, b)) < uSlotW) discard; }`,
      )
  }
  const key = m.customProgramCacheKey?.bind(m)
  m.customProgramCacheKey = () => (key ? key() : '') + '|slot'
  patched.add(m)
}

/**
 * The scalp in layers where an incision is made (RL-B B-1): skin (the room's scalp mesh itself), fat, galea, pericranium, and the temporalis
 * muscle over the temporal fossa, as sheets between the scalp surface and the outer table of the bone. A linear incision (progress `cut`
 * along its length, depth `depth` through the layers) and retraction (`retract` widens it): each deeper layer opens a little less
 * wide, so the layers show as coloured steps at the edge; at full depth and retraction the self-retaining retractor stands in the wound
 * and the outer table shows. Skin is the room's mesh with a fragment test, the rest are local sheets built on `begin()`.
 */
export class HeadLayers {
  readonly group = new T.Group()
  private scene: BrainScene
  private room: OperatingRoom
  private skull: Geo[]
  private shared: SlotShared = { uSlotC: { value: new T.Vector3() }, uSlotU: { value: new T.Vector3(0, 0, 1) }, uSlotN: { value: new T.Vector3(0, 1, 0) }, uSlotL: { value: 0 } }
  private own: Record<(typeof ORDER)[number], SlotOwn> = {
    skin: { uSlotW: { value: 0 }, uSlotOn: { value: 0 } },
    fat: { uSlotW: { value: 0 }, uSlotOn: { value: 0 } },
    galea: { uSlotW: { value: 0 }, uSlotOn: { value: 0 } },
    pericranium: { uSlotW: { value: 0 }, uSlotOn: { value: 0 } },
  }
  private meshes: Partial<Record<HeadLayer, T.Mesh>> = {}
  private temporalOwn: SlotOwn = { uSlotW: { value: 0 }, uSlotOn: { value: 0 } }
  private line: T.Line | null = null
  private retractor: T.Group | null = null
  private begun = false
  private lengthMm = 25
  private target: T.Vector3 | null = null
  private thickness = 6
  readonly centre = new T.Vector3()
  cut = 0
  depth = 0
  retract = 0
  /** Fired when exposure of the bone changes (the bone layer must be shown under the skin then). */
  onChange: (() => void) | null = null

  constructor(scene: BrainScene, room: OperatingRoom, skull: Geo[]) {
    this.scene = scene
    this.room = room
    this.skull = skull
    this.group.name = 'head-layers'
    slotPatch(room.scalpMesh.material, this.shared, this.own.skin)
  }

  /** The layer sheets belong to the scalp: shown only while the scalp is (skin on or ghost). */
  setSkin(skin: string) {
    this.group.visible = skin === 'on' || skin === 'ghost'
    this.scene.redraw()
  }

  get active() {
    return this.begun
  }
  /** The outer table is uncovered: pericranium cut through and the wound opened. */
  get boneExposed() {
    return this.begun && this.depth >= CUT_AT.pericranium && this.cut > 0 && this.retract > 0.15
  }

  /**
   * Plan a linear incision centred on a scalp point (scene mm), `lengthMm` long along the antero-posterior direction, optionally measured against the
   * wanted point `want` (Kocher or the mark). Builds the local layer sheets; returns false when the skull is not found under the point.
   */
  begin(point: T.Vector3, lengthMm = 25, want: T.Vector3 | null = null): boolean {
    this.clear()
    const sc = this.room.scalp
    const dir = point.clone().sub(sc.centre).normalize()
    const site = sc.surfaceAt(dir)
    const n = dir.clone()
    const u = new T.Vector3(0, 0, 1).addScaledVector(n, -n.z).normalize() // scene z = MNI y: anterior-posterior
    if (u.lengthSq() < 0.5) u.set(1, 0, 0)
    const v = new T.Vector3().crossVectors(n, u).normalize()
    this.centre.copy(site)
    this.target = want ? want.clone() : null
    this.lengthMm = lengthMm
    const grid = this.sampleGrid(site, u, v)
    if (!grid) return false
    this.thickness = grid.thick[(grid.n >> 1) * grid.n + (grid.n >> 1)]
    const planes = this.scene.sectionPlanes
    const mk = (layer: (typeof ORDER)[number], color: number, opt: Partial<T.MeshPhysicalMaterialParameters> = {}) => {
      const [f0, f1] = HEAD_FRACTIONS[layer]
      const m = new T.MeshPhysicalMaterial({ color, roughness: 0.6, metalness: 0, clippingPlanes: planes, clearcoat: 0, ...opt })
      slotPatch(m, this.shared, this.own[layer])
      this.addMesh(layer, this.sheetGeometry(grid, f0, f1, null), m, 1)
    }
    mk('fat', 0xe9c66b, { roughness: 0.75 })
    mk('galea', 0xe6dfd0, { sheen: 0.5, sheenColor: new T.Color(0xffffff), roughness: 0.5 })
    mk('pericranium', 0xd9c5b6, { roughness: 0.45 })
    // Temporalis: only where the direction lies over the temporal fossa; it replaces fat and galea there (bulk is not modelled: provisional).
    const mask = (d: T.Vector3) => {
      const lateral = Math.abs(d.x),
        up = d.y
      return lateral > 0.78 && up > -0.12 && up < 0.5 ? 1 : 0
    }
    const g = this.sheetGeometry(grid, HEAD_FRACTIONS.fat[0], HEAD_FRACTIONS.pericranium[0], mask)
    if (g.getIndex()!.count > 0) {
      const m = new T.MeshPhysicalMaterial({ color: 0x8d3a35, roughness: 0.55, clippingPlanes: planes, clearcoat: 0 })
      slotPatch(m, this.shared, this.temporalOwn)
      this.addMesh('temporalis', g, m, 2)
    }
    this.begun = true
    this.cut = this.depth = this.retract = 0
    this.shared.uSlotC.value.copy(site)
    this.shared.uSlotU.value.copy(u)
    this.shared.uSlotN.value.copy(n)
    this.buildLine(u)
    this.apply()
    return true
  }

  setCut(p: number) {
    if (!this.begun) return
    this.cut = clamp01(p)
    this.apply()
  }
  setDepth(d: number) {
    if (!this.begun) return
    this.depth = clamp01(d)
    this.apply()
  }
  setRetract(r: number) {
    if (!this.begun) return
    this.retract = clamp01(r)
    this.apply()
  }

  close() {
    this.clear()
    this.apply()
    this.onChange?.()
  }

  dispose() {
    this.clear()
    this.group.removeFromParent()
  }

  report(): HeadReport | null {
    if (!this.begun) return null
    const t = this.thickness
    const layersMm = Object.fromEntries(ORDER.map((l) => [l, (HEAD_FRACTIONS[l][1] - HEAD_FRACTIONS[l][0]) * t])) as HeadReport['layersMm']
    let cutThrough: HeadLayer | null = null
    if (this.cut > 0) for (const l of ORDER) if (this.depth >= CUT_AT[l]) cutThrough = l
    const wPer = this.widthFor('pericranium')
    const L = (this.cut * this.lengthMm) / 2
    return {
      lengthMm: this.cut * this.lengthMm,
      widthMm: 2 * this.widthFor('skin'),
      depth: this.depth,
      retract: this.retract,
      thicknessMm: t,
      layersMm,
      cutThrough,
      boneExposed: this.boneExposed,
      boneAreaMm2: this.depth >= CUT_AT.pericranium && wPer > 0 ? 2 * L * 2 * wPer + Math.PI * wPer * wPer : 0,
      // Lateral offset only: the wanted point is on the bone, the incision centre on the skin, so the depth difference is not an error.
      offsetMm: this.target
        ? this.target.clone().sub(this.centre).addScaledVector(this.shared.uSlotN.value, -this.target.clone().sub(this.centre).dot(this.shared.uSlotN.value)).length()
        : null,
    }
  }

  // ── internals ──────────────────────────────────────────────────────

  private widthFor(layer: (typeof ORDER)[number]) {
    return Math.max(0, this.retract * WIDTH_MM - ORDER.indexOf(layer) * STAIR_MM)
  }

  private apply() {
    const sh = this.shared
    sh.uSlotL.value = (this.cut * this.lengthMm) / 2
    for (const l of ORDER) {
      const o = this.own[l]
      o.uSlotOn.value = this.begun && this.cut > 0 && this.depth >= CUT_AT[l] ? 1 : 0
      // A cut with no retraction is a hairline; the slot opens only as the wound is spread.
      o.uSlotW.value = this.widthFor(l)
    }
    // Temporalis (when present) opens with the galea step.
    this.temporalOwn.uSlotOn.value = this.own.galea.uSlotOn.value
    this.temporalOwn.uSlotW.value = this.widthFor('galea')
    if (this.line) {
      this.line.visible = this.cut > 0 && this.retract < 0.15
      this.line.geometry.setDrawRange(0, Math.round(this.cut * 40) + 1)
    }
    if (this.retractor) {
      this.retractor.visible = this.boneExposed
      this.layoutRetractor()
    }
    this.scene.redraw()
    this.onChange?.()
  }

  private clear() {
    for (const o of [...Object.values(this.meshes), this.line]) {
      if (!o) continue
      o.removeFromParent()
      o.geometry.dispose()
      ;(o.material as T.Material).dispose()
    }
    if (this.retractor) {
      this.retractor.removeFromParent()
      for (const c of this.retractor.children) {
        ;(c as T.Mesh).geometry.dispose()
        ;((c as T.Mesh).material as T.Material).dispose()
      }
    }
    this.meshes = {}
    this.line = null
    this.retractor = null
    this.begun = false
    this.cut = this.depth = this.retract = 0
    for (const o of [...Object.values(this.own), this.temporalOwn]) o.uSlotOn.value = 0
    this.shared.uSlotL.value = 0
  }

  private addMesh(layer: HeadLayer, g: T.BufferGeometry, m: T.Material, order: number) {
    const mesh = new T.Mesh(g, m)
    mesh.name = `head-${layer}`
    mesh.renderOrder = order
    mesh.raycast = () => {}
    mesh.frustumCulled = false
    this.group.add(mesh)
    this.meshes[layer] = mesh
  }

  /** Radial samples over a square patch: unit direction, scalp radius and total soft-tissue thickness in each cell. */
  private sampleGrid(site: T.Vector3, u: T.Vector3, v: T.Vector3) {
    const sc = this.room.scalp
    const n = Math.round(PATCH_MM / STEP_MM) + 1
    const dirs: T.Vector3[] = []
    const rs = new Float32Array(n * n)
    const thick = new Float32Array(n * n)
    const ray = new T.Ray()
    let found = 0
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const a = (i / (n - 1) - 0.5) * PATCH_MM,
          b = (j / (n - 1) - 0.5) * PATCH_MM
        const q = site.clone().addScaledVector(u, a).addScaledVector(v, b)
        const d = q.sub(sc.centre).normalize()
        const s = sc.surfaceAt(d)
        const r = s.distanceTo(sc.centre)
        ray.origin.copy(sc.centre).addScaledVector(d, r + 6)
        ray.direction.copy(d).negate()
        let best = Infinity
        for (const g of this.skull) {
          const h = g.boundsTree?.raycastFirst(ray, T.DoubleSide, 0, 60)
          if (h && h.distance < best) best = h.distance
        }
        dirs.push(d)
        rs[j * n + i] = r
        if (isFinite(best)) {
          // `best` is measured from r+6 inward: bone outer radius = r + 6 − best, so the soft tissue = best − 6.
          thick[j * n + i] = Math.max(1.5, Math.min(12, best - 6))
          found++
        } else thick[j * n + i] = 0
      }
    if (found < n * n * 0.5) return null
    // Cells without a bone hit take their neighbours' mean thickness (the patch may run off the vault).
    const mean = thick.reduce((x, y) => x + y, 0) / found
    for (let k = 0; k < thick.length; k++) if (!thick[k]) thick[k] = mean
    return { n, dirs, rs, thick }
  }

  /** A closed-looking sheet pair between depth fractions f0 and f1 of the soft tissue (outer sheet outward winding, inner flipped). */
  private sheetGeometry(grid: NonNullable<ReturnType<HeadLayers['sampleGrid']>>, f0: number, f1: number, mask: ((d: T.Vector3) => number) | null) {
    const { n, dirs, rs, thick } = grid
    const c = this.room.scalp.centre
    const pos: number[] = []
    for (const f of [f0, f1])
      for (let k = 0; k < n * n; k++) {
        const r = rs[k] - f * thick[k]
        pos.push(c.x + dirs[k].x * r, c.y + dirs[k].y * r, c.z + dirs[k].z * r)
      }
    const idx: number[] = []
    const off = n * n
    for (let j = 0; j < n - 1; j++)
      for (let i = 0; i < n - 1; i++) {
        const a = j * n + i,
          b = a + 1,
          cc = a + n,
          e = cc + 1
        if (mask && !(mask(dirs[a]) && mask(dirs[b]) && mask(dirs[cc]) && mask(dirs[e]))) continue
        idx.push(a, cc, b, b, cc, e, a + off, b + off, cc + off, b + off, e + off, cc + off)
      }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }

  /** The incision itself: a dark line along U on the skin that grows with `cut`. */
  private buildLine(u: T.Vector3) {
    const sc = this.room.scalp
    const pts: T.Vector3[] = []
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40 - 0.5) * this.lengthMm
      const q = this.centre.clone().addScaledVector(u, a)
      const d = q.sub(sc.centre).normalize()
      pts.push(sc.surfaceAt(d).addScaledVector(d, 0.1))
    }
    // Grows from the middle outward: order the points that way so the draw range reveals it symmetrically.
    const order: T.Vector3[] = [pts[20]]
    for (let i = 1; i <= 20; i++) order.push(pts[20 - i], pts[20 + i])
    const line = new T.Line(new T.BufferGeometry().setFromPoints(order), new T.LineBasicMaterial({ color: 0x5a0d0d }))
    line.renderOrder = 4
    line.raycast = () => {}
    line.frustumCulled = false
    this.line = line
    this.group.add(line)
    this.buildRetractor(u)
  }

  /** Self-retaining retractor: two steel blades along the wound edges, a ratchet bar across one end. Sized and placed by `layoutRetractor`. */
  private buildRetractor(u: T.Vector3) {
    const steel = new T.MeshStandardMaterial({ color: 0xcdd3d9, metalness: 0.4, roughness: 0.35 })
    const g = new T.Group()
    const blade = () => new T.Mesh(new T.BoxGeometry(1, 1, 1), steel)
    const b1 = blade(),
      b2 = blade(),
      bar = blade()
    for (const m of [b1, b2, bar]) {
      m.raycast = () => {}
      m.frustumCulled = false
      g.add(m)
    }
    g.visible = false
    this.retractor = g
    this.group.add(g)
    this.retractorU = u.clone()
  }
  private retractorU = new T.Vector3()

  private layoutRetractor() {
    const g = this.retractor
    if (!g) return
    const u = this.retractorU
    const n = this.shared.uSlotN.value
    const v = new T.Vector3().crossVectors(n, u).normalize()
    const half = (this.cut * this.lengthMm) / 2
    const w = this.widthFor('skin')
    const basis = new T.Matrix4().makeBasis(u, v, n)
    g.quaternion.setFromRotationMatrix(basis)
    g.position.copy(this.centre)
    const [b1, b2, bar] = g.children
    // Blades stand on the skin edge (a little outside the slot), a few mm tall; the bar bridges them at one end.
    b1.scale.set(half * 2, 1.2, 4)
    b1.position.set(0, w + 0.6, 1.5)
    b2.scale.set(half * 2, 1.2, 4)
    b2.position.set(0, -w - 0.6, 1.5)
    bar.scale.set(2, w * 2 + 3.6, 2)
    bar.position.set(half + 1, 0, 3.2)
  }
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
