import * as T from 'three'
import { duraMaterial } from './materials'
import { chainAt, dirOf } from './shells'
import type { LayerStack } from './layerStack'

export type DuraStage = 'closed' | 'cutting' | 'open'

export interface OpeningReport {
  stage: DuraStage
  radiusMm: number
  areaMm2: number
  /** Cut progress 0..1 (the circular incision, hinge arc left uncut) and flap angle in degrees. */
  cut: number
  flapDeg: number
  /** CSF depth under the opening (arachnoid → cortex), mm: the room left before the cortex. */
  csfMinMm: number
  csfMeanMm: number
  /** Hinge side: toward the midline, the usual base of a convexity dural flap. */
  hinge: [number, number, number]
}

const HINGE_ARC = (70 * Math.PI) / 180
const MAX_FLAP = 2.35
const SEGMENTS = 72

/**
 * Opening the dura (docs/REALISM.md A-3): a circular incision with the hinge toward the midline (progress `cut` 0..1), then the flap
 * folds back (`flap` 0..1) and the arachnoid and CSF show under it. The disc is removed from the dura by a fragment test
 * (the shader of `materials.ts`), the flap is a copy of the dura inside the disc turned about the hinge line. Nothing in the
 * atlas meshes changes; `close()` puts everything back. PROVISIONAL membrane thickness: see `shells.ts`.
 */
export class DuraOpening {
  readonly centre = new T.Vector3()
  readonly normal = new T.Vector3(0, 1, 0)
  readonly hinge = new T.Vector3(1, 0, 0)
  radius = 12
  cut = 0
  flap = 0
  private line: T.Line | null = null
  private flapMesh: T.Mesh | null = null
  private axis = new T.Vector3()
  private sign = 1
  private begun = false

  private stack: LayerStack

  constructor(stack: LayerStack) {
    this.stack = stack
    stack.flap = this
  }

  get stage(): DuraStage {
    return !this.begun || this.cut <= 0 ? 'closed' : this.cut >= 1 ? 'open' : 'cutting'
  }

  /** Plan the opening around a point near the dura (scene mm); the circle sits on the dura at the radial projection of the point. */
  begin(point: T.Vector3, radius = 12): boolean {
    this.clear()
    const gc = this.stack.grid.centre
    const u = point.clone().sub(gc).normalize()
    const r = this.stack.boundaryAt(u, 'boneInner')
    if (r == null) return false
    this.radius = radius
    this.centre.copy(gc).addScaledVector(u, r - 0.01)
    this.normal.copy(u)
    const toMid = new T.Vector3(gc.x - this.centre.x, 0, 0)
    toMid.addScaledVector(this.normal, -toMid.dot(this.normal))
    if (toMid.lengthSq() < 1e-4) toMid.set(0, 0, 1).addScaledVector(this.normal, -this.normal.z)
    this.hinge.copy(toMid.normalize())
    this.axis.crossVectors(this.normal, this.hinge).normalize()
    this.begun = true
    this.cut = 0
    this.flap = 0
    this.buildLine()
    this.buildFlap()
    const o = this.stack.open
    o.uOpC.value.copy(this.centre)
    o.uOpN.value.copy(this.normal)
    o.uOpR.value = radius
    o.uOpOn.value = 0
    this.apply()
    return true
  }

  setCut(p: number) {
    if (!this.begun) return
    this.cut = Math.max(0, Math.min(1, p))
    if (this.cut < 1) this.flap = 0
    this.apply()
  }
  setFlap(f: number) {
    if (!this.begun || this.cut < 1) return
    this.flap = Math.max(0, Math.min(1, f))
    this.apply()
  }

  close() {
    this.clear()
    this.stack.open.uOpOn.value = 0
    this.stack.scene.redraw()
  }

  refreshVisible() {
    this.apply()
  }

  dispose() {
    this.clear()
    this.stack.flap = null
  }

  report(): OpeningReport | null {
    if (!this.begun) return null
    const g = this.stack.grid
    const d = new T.Vector3()
    const p = new T.Vector3()
    let min = Infinity,
      sum = 0,
      n = 0
    for (let j = 0; j <= g.nPhi; j++)
      for (let k = 0; k < g.nTheta; k++) {
        const c = chainAt(g, j * g.nTheta + k)
        if (!c) continue
        dirOf((k / g.nTheta) * Math.PI * 2, (j / g.nPhi) * g.phiMax, d)
        p.copy(g.centre).addScaledVector(d, c.boneInner).sub(this.centre)
        p.addScaledVector(this.normal, -p.dot(this.normal))
        if (p.length() > this.radius) continue
        const csf = c.arachInner - c.cortex
        min = Math.min(min, csf)
        sum += csf
        n++
      }
    return {
      stage: this.stage,
      radiusMm: this.radius,
      areaMm2: Math.PI * this.radius * this.radius,
      cut: this.cut,
      flapDeg: (this.flap * MAX_FLAP * 180) / Math.PI,
      csfMinMm: n ? min : NaN,
      csfMeanMm: n ? sum / n : NaN,
      hinge: this.hinge.toArray() as [number, number, number],
    }
  }

  private apply() {
    const o = this.stack.open
    const duraOn = this.stack.isVisible('dura')
    o.uOpOn.value = this.begun && this.cut >= 1 && duraOn ? 1 : 0
    if (this.line) {
      this.line.visible = duraOn && this.cut > 0 && this.cut < 1
      this.line.geometry.setDrawRange(0, Math.max(0, Math.round(this.cut * SEGMENTS)) + 1)
    }
    if (this.flapMesh) {
      this.flapMesh.visible = duraOn && this.cut >= 1
      const theta = this.flap * MAX_FLAP
      this.flapMesh.quaternion.setFromAxisAngle(this.axis, theta * this.sign)
    }
    this.stack.scene.redraw()
  }

  private clear() {
    for (const o of [this.line, this.flapMesh]) {
      if (!o) continue
      o.removeFromParent()
      o.geometry.dispose()
      ;(o.material as T.Material).dispose()
    }
    this.line = this.flapMesh = null
    this.begun = false
    this.cut = 0
    this.flap = 0
  }

  /** The incision: a circle on the dura, starting at the hinge's far end and running both ways round, the hinge arc left out. */
  private buildLine() {
    const t1 = this.hinge.clone()
    const t2 = new T.Vector3().crossVectors(this.normal, t1)
    const pts: T.Vector3[] = []
    const gc = this.stack.grid.centre
    // Angle 0 = the hinge direction; the cut starts at one end of the hinge arc and sweeps the rest of the circle.
    const a0 = HINGE_ARC / 2,
      a1 = Math.PI * 2 - HINGE_ARC / 2
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = a0 + ((a1 - a0) * i) / SEGMENTS
      const q = this.centre
        .clone()
        .addScaledVector(t1, Math.cos(a) * this.radius)
        .addScaledVector(t2, Math.sin(a) * this.radius)
      const dir = q.clone().sub(gc).normalize()
      const r = this.stack.boundaryAt(dir, 'boneInner')
      pts.push(r == null ? q : gc.clone().addScaledVector(dir, r + 0.05))
    }
    const line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7a1010 }))
    line.renderOrder = 4
    line.raycast = () => {}
    line.frustumCulled = false
    this.line = line
    this.stack.group.add(line)
  }

  /** The flap: the dura triangles over the disc, relative to the hinge point, drawn only inside the disc by the flap shader. */
  private buildFlap() {
    const dura = this.stack.layers.find((l) => l.kind === 'dura')!.mesh.geometry
    const pos = dura.getAttribute('position')
    const idx = dura.getIndex()!
    const pivot = this.centre.clone().addScaledVector(this.hinge, this.radius)
    const keep: number[] = []
    const a = new T.Vector3(),
      b = new T.Vector3(),
      c = new T.Vector3(),
      m = new T.Vector3()
    for (let i = 0; i < idx.count; i += 3) {
      a.fromBufferAttribute(pos, idx.getX(i))
      b.fromBufferAttribute(pos, idx.getX(i + 1))
      c.fromBufferAttribute(pos, idx.getX(i + 2))
      m.copy(a).add(b).add(c).divideScalar(3).sub(this.centre)
      if (Math.abs(m.dot(this.normal)) > 6) continue
      m.addScaledVector(this.normal, -m.dot(this.normal))
      if (m.length() < this.radius + 3.5) keep.push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2))
    }
    const used = new Map<number, number>()
    const p: number[] = []
    const nrm = dura.getAttribute('normal')
    const nn: number[] = []
    const ni: number[] = []
    for (const v of keep) {
      let k = used.get(v)
      if (k === undefined) {
        k = p.length / 3
        used.set(v, k)
        p.push(pos.getX(v) - pivot.x, pos.getY(v) - pivot.y, pos.getZ(v) - pivot.z)
        nn.push(nrm.getX(v), nrm.getY(v), nrm.getZ(v))
      }
      ni.push(k)
    }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3))
    g.setAttribute('normal', new T.Float32BufferAttribute(nn, 3))
    g.setIndex(ni)
    const mesh = new T.Mesh(g, duraMaterial(this.stack.scene.sectionPlanes, this.stack.open, 'inside', pivot))
    mesh.position.copy(pivot)
    mesh.renderOrder = 3
    mesh.raycast = () => {}
    mesh.frustumCulled = false
    this.flapMesh = mesh
    this.stack.group.add(mesh)
    // Rotation sign that lifts the far edge toward the surgeon (+normal): checked on the far point rather than assumed.
    const far = this.hinge.clone().multiplyScalar(-2 * this.radius)
    const test = far.clone().applyAxisAngle(this.axis, Math.PI / 2)
    this.sign = test.dot(this.normal) > 0 ? 1 : -1
  }
}
