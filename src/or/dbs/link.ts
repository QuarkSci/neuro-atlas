import * as T from 'three'
import type { BrainScene } from '@/scene/BrainScene'
import { PART_BY_ID } from '@/data'
import { mniToScene, sceneToMni, type Mni } from '../types'
import { sceneWorld } from '../evd/world'
import { DBS_MER_LAYERS, DBS_STIM_EFFECTS, DBS_TARGETS } from './data'
import { toAcpc } from './geometry'
import type { DbsData, DbsSide, DbsStepId, DbsWorld, TrackOffset } from './logic'
import { MerAudioEngine } from './merAudio'
import { DbsSession } from './session'
import { useDbs } from './useDbs'
import type { DbsTargetId } from './types'

const AC = 'g-anterior-commissure',
  PC = 'g-posterior-commissure'
const SKULL = ['g-frontal-bone', 'g-right-parietal-bone', 'g-left-parietal-bone']
const DATA: DbsData = { targets: DBS_TARGETS, layers: DBS_MER_LAYERS, effects: DBS_STIM_EFFECTS }
const v3 = (p: Mni) => new T.Vector3(...mniToScene(p))

/**
 * Connects the DBS logic (SX-6) to the operating room: owns the `DbsSession`, takes the AC / PC marks and the entry point from
 * clicks, draws the trajectory (line), the planned target (blue ball) and the electrode tip (orange), and plays the MER sound.
 * Atlas structures that are not loaded (Julich, JHU) fall back to their catalogue centroid.
 */
export class DbsLink {
  private scene: BrainScene
  private world: DbsWorld & { raycast: ReturnType<typeof sceneWorld>['raycast'] }
  session: DbsSession
  private group = new T.Group()
  private line: T.Line
  private target: T.Mesh
  private tip: T.Mesh
  private audio = new MerAudioEngine()
  private ac: Mni | null = null
  private pc: Mni | null = null

  constructor(scene: BrainScene) {
    this.scene = scene
    const sw = sceneWorld(scene)
    this.world = {
      isInside: (id, p) => sw.isInside(id, p),
      distanceTo: (id, p) => sw.distanceTo(id, p),
      centroid: (id) => (PART_BY_ID.get(id)?.centroid as Mni | undefined) ?? sw.centroid(id),
      raycast: (ids, o, d) => sw.raycast(ids, o, d),
    }
    this.session = new DbsSession(this.world, DATA)
    const mat = (c: number) => new T.MeshBasicMaterial({ color: c, depthTest: false })
    this.line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), new T.LineBasicMaterial({ color: 0xffd60a, depthTest: false }))
    this.target = new T.Mesh(new T.SphereGeometry(1.4, 16, 12), mat(0x0a84ff))
    this.tip = new T.Mesh(new T.SphereGeometry(1.1, 16, 12), mat(0xff9f0a))
    for (const o of [this.line, this.target, this.tip]) {
      o.visible = false
      o.renderOrder = 20
      this.group.add(o)
    }
    scene.scene.add(this.group)
  }

  private set = (p: Parameters<ReturnType<typeof useDbs.getState>['set']>[0]) => useDbs.getState().set(p)

  begin(target: DbsTargetId, side: DbsSide) {
    this.session.begin(target, side)
    this.ac = this.pc = null
    this.entryPoint = null
    this.audio.stop()
    this.set({
      running: true,
      target,
      side,
      step: 'plan',
      pick: null,
      marks: { ac: false, pc: false },
      frame: null,
      plannedAcpc: null,
      analysis: null,
      shiftMm: 0,
      sealed: false,
      tracks: [],
      track: 0,
      depth: 15,
      reading: null,
      stim: null,
      audio: false,
      report: null,
      notice: null,
    })
    this.draw()
  }

  /** Assisted: the commissures of the atlas (no marking tolerance is simulated). */
  markFromAtlas() {
    const ac = this.world.centroid(AC),
      pc = this.world.centroid(PC)
    if (!ac || !pc) return this.set({ notice: 'AC / PC not available' })
    this.applyFrame(ac, pc)
  }

  private applyFrame(ac: Mni, pc: Mni) {
    const r = this.session.markAcpc(ac, pc)
    if (!r) return
    const p = this.session.planned()
    const f = this.session.acpcFrame
    this.set({ frame: r, plannedAcpc: p && f ? toAcpc(f, p) : null, marks: { ac: true, pc: true }, pick: null })
    this.draw()
  }

  /** Click handling: AC / PC marks (a click on the structure snaps to its centroid) and the entry point on the skull. */
  tap(x: number, y: number, scalp: T.Object3D): boolean {
    const u = useDbs.getState()
    if (!u.open || !u.running || !u.pick) return false
    if (u.pick === 'ac' || u.pick === 'pc') {
      const hit = this.scene.pickPoint(x, y)
      if (!hit) return true
      const want = u.pick === 'ac' ? AC : PC
      const c = this.world.centroid(want)
      const p: Mni = hit.id === want && c ? c : sceneToMni([hit.point.x, hit.point.y, hit.point.z])
      if (u.pick === 'ac') this.ac = p
      else this.pc = p
      this.set({ marks: { ac: !!this.ac, pc: !!this.pc }, pick: null })
      if (this.ac && this.pc) this.applyFrame(this.ac, this.pc)
      return true
    }
    const hit = this.scene.pickPoint(x, y, [scalp])
    if (!hit) return true
    // The skull outer surface under the click: from the scalp point inwards.
    const o = sceneToMni([hit.point.x, hit.point.y, hit.point.z])
    const d = sceneToMni([-hit.normal.x, -hit.normal.y, -hit.normal.z])
    const sk = this.world.raycast(SKULL, o, d)
    this.setEntry(sk ? sk.point : o)
    return true
  }

  setEntry(entry: Mni) {
    this.entryPoint = entry
    const a = this.session.setEntry(entry)
    this.set({ analysis: a, pick: null })
    this.draw()
  }

  confirm(step?: DbsStepId) {
    const ok = this.session.confirm(step)
    this.set({ step: this.session.currentStep, notice: ok ? null : 'out-of-order' })
    this.draw()
  }
  sealDura() {
    this.session.sealDura()
    this.set({ sealed: this.session.sealedDura })
  }
  guideTo(d: number) {
    this.session.guideTo(d)
    this.set({ depth: d })
  }
  newTrack(o: TrackOffset) {
    const t = this.session.newTrack(o)
    if (t) {
      this.set({ tracks: this.session.trackList.map((x) => ({ id: x.id, offset: x.offset })), track: t.id })
      this.draw()
      this.drive(useDbs.getState().depth)
    }
  }
  selectTrack(id: number) {
    this.session.selectTrack(id)
    this.set({ track: id })
    this.draw()
    this.drive(useDbs.getState().depth)
  }
  drive(depth: number) {
    const r = this.session.drive(depth)
    this.set({ depth, reading: r, shiftMm: this.session.brainShiftMm() })
    if (r && useDbs.getState().audio) this.audio.update(r.pattern)
    this.draw()
  }
  provoke() {
    this.audio.triggerResponse()
  }
  setAudio(on: boolean) {
    if (on) {
      this.audio.start(useDbs.getState().reading?.pattern)
      this.audio.setMuted(false)
    } else this.audio.stop()
    this.set({ audio: on })
  }
  mark(kind: 'enter' | 'exit') {
    this.session.markBoundary(kind, useDbs.getState().depth)
    this.set({ notice: kind })
  }
  stimulate(mA: number) {
    const s = this.session.stimulate(useDbs.getState().depth, mA)
    this.set({ mA, stim: s })
  }
  implant() {
    const rep = this.session.implant(useDbs.getState().depth)
    this.set({ report: rep, running: !rep, step: this.session.currentStep })
    this.audio.stop()
    this.draw()
  }

  /** Redraw the trajectory, the planned target and the electrode tip. */
  private draw() {
    const tr = this.session.activeTrack
    const planned = this.session.planned()
    this.target.visible = !!planned
    if (planned) this.target.position.copy(v3(planned))
    const e = tr ? tr.entry : this.entryPoint
    const t = tr ? tr.target : planned
    this.line.visible = !!e && !!t
    if (e && t) this.line.geometry.setFromPoints([v3(e), v3(t)])
    const r = useDbs.getState().reading
    this.tip.visible = !!r && !!tr
    if (r && tr) this.tip.position.copy(v3(r.tip))
    this.scene.redraw()
  }
  private entryPoint: Mni | null = null

  dispose() {
    this.audio.dispose()
    this.group.removeFromParent()
    this.line.geometry.dispose()
    ;(this.line.material as T.Material).dispose()
    for (const m of [this.target, this.tip]) {
      m.geometry.dispose()
      ;(m.material as T.Material).dispose()
    }
    useDbs.setState({ open: false, running: false })
  }
}
