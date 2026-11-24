import * as T from 'three'
import type { BrainScene } from '@/scene/BrainScene'
import { mniToScene, sceneToMni, type Mni } from '../types'
import type { ToolEngine } from '../tools/engine'
import type { DrillEvent } from '../drill/types'
import { EVD_PARAMS } from './params'
import { EvdSession } from './session'
import { sceneWorld } from './world'
import type { EvdSnapshot } from './types'

const toMni = (v: T.Vector3): Mni => sceneToMni([v.x, v.y, v.z])

/**
 * Connects the EVD logic to the operating room (SX-3 → UI): owns the `EvdSession`, feeds it the catheter tip from
 * `ToolEngine`, takes the mark from a click on the scalp, ends the burr-hole step when the drill breaks through the inner
 * table, and draws the mark (red ball) and, with the laser option, the ideal Kocher point (green ring).
 */
export class EvdLink {
  readonly session: EvdSession
  private group = new T.Group()
  private mark: T.Mesh
  private target: T.Mesh
  private unsub: () => void
  private snap: EvdSnapshot
  private prevStep: string | null = null
  /** Fired once when the incision step begins: scene point of the mark (or Kocher) and the wanted Kocher point. orMode plans the scalp incision there. */
  onIncisionStep: ((at: T.Vector3, want: T.Vector3 | null) => void) | null = null

  private scene: BrainScene
  private tools: ToolEngine

  constructor(scene: BrainScene, tools: ToolEngine) {
    this.scene = scene
    this.tools = tools
    this.session = new EvdSession(sceneWorld(scene), EVD_PARAMS)
    this.snap = this.session.snapshot()
    this.mark = new T.Mesh(new T.SphereGeometry(1.6, 16, 12), new T.MeshBasicMaterial({ color: 0xff3b30, depthTest: false }))
    this.target = new T.Mesh(new T.TorusGeometry(4, 0.45, 8, 40), new T.MeshBasicMaterial({ color: 0x34c759, depthTest: false }))
    for (const m of [this.mark, this.target]) {
      m.visible = false
      m.renderOrder = 20
      this.group.add(m)
    }
    scene.scene.add(this.group)
    this.unsub = this.session.subscribe((s) => this.onSnap(s))
    tools.onSample = (tip, dir, skinMm) => {
      const s = this.snap
      if (!s.running || s.finished) return
      this.session.feed({ t: performance.now() / 1000, tip: toMni(tip), dir: toMni(dir), scalpDepthMm: -skinMm, tableDepthMm: null })
    }
    tools.onDrillEvent = (e: DrillEvent) => {
      if (e.type === 'breakthrough' && this.snap.running && this.snap.step === 'burr') this.session.confirm('burr')
    }
  }

  /** A click on the scalp while the mark step is active places the mark there. Returns true when it used the click. */
  tap(x: number, y: number, scalp: T.Object3D): boolean {
    const s = this.snap
    if (!s.running || s.finished || s.step !== 'mark') return false
    const hit = this.scene.pickPoint(x, y, [scalp])
    if (!hit) return false
    this.session.placeMark(toMni(hit.point))
    this.scene.redraw()
    return true
  }

  private onSnap(s: EvdSnapshot) {
    this.snap = s
    const step = s.running ? s.step : null
    if (step === 'incision' && this.prevStep !== 'incision') {
      const k = s.kocher
      const want = k ? new T.Vector3(...mniToScene(k.entry)) : null
      const at = s.mark ? new T.Vector3(...mniToScene(s.mark.point)) : want
      if (at) this.onIncisionStep?.(at, want)
    }
    this.prevStep = step
    const m = s.mark
    this.mark.visible = !!m
    if (m) this.mark.position.set(...mniToScene(m.point))
    const k = s.kocher
    this.target.visible = !!k && s.running && s.options.laser
    if (k) {
      this.target.position.set(...mniToScene(k.entry))
      const n = new T.Vector3(...mniToScene(k.normal))
      this.target.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n.sub(new T.Vector3(...mniToScene([0, 0, 0]))).normalize())
    }
    this.scene.redraw()
  }

  dispose() {
    this.unsub()
    this.tools.onSample = null
    this.tools.onDrillEvent = null
    this.group.removeFromParent()
    for (const m of [this.mark, this.target]) {
      m.geometry.dispose()
      ;(m.material as T.Material).dispose()
    }
  }
}
