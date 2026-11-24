import * as T from 'three'
import type { BrainScene } from '@/scene/BrainScene'
import { sceneToMni, type Mni } from '../types'
import { sceneWorld } from '../evd/world'
import { findKocher } from '../evd/kocher'
import { EVD_PARAMS } from '../evd/params'
import { sceneBone } from './boneWorld'
import { BoneCutout } from './cutout'
import { DrillSession } from './session'
import { useDrill } from './useDrill'
import { DrillMeshView } from './view'
import { BoneVolume } from './volume'
import type { DrillEvent, DrillState } from './types'

const BONES = ['g-frontal-bone', 'g-right-parietal-bone']
const UI_MS = 66

/**
 * Wires the drill to the scene: builds the bone patch at the Kocher point, replaces the atlas bone there with the carved
 * mesh, and runs a frame loop that feeds the learner's tip to `DrillSession`. Input arrives through `aim` (tip and axis
 * in the scene frame, from the mouse, a hand or later a tracked pen); the spindle follows `useDrill.spin` or the Space key.
 */
export class DrillRig {
  readonly vol: BoneVolume
  readonly view: DrillMeshView
  session: DrillSession | null = null
  private cutout: BoneCutout
  private target: Mni | null = null
  private axis: Mni = [0, 0, -1]
  private raf = 0
  private last = 0
  private lastUi = 0
  private space = false
  private listeners: ((s: DrillState) => void)[] = []
  private eventListeners: ((e: DrillEvent) => void)[] = []
  private stopSub: (() => void) | null = null
  private scene: BrainScene
  readonly entry: Mni

  constructor(scene: BrainScene) {
    this.scene = scene
    const world = sceneWorld(scene)
    const k = findKocher(world, EVD_PARAMS, 'right')
    if (!k) throw new Error('drill: no Kocher point (skull not loaded)')
    this.entry = k.entry
    this.vol = new BoneVolume(sceneBone(scene, BONES), { center: k.entry, outerNormal: k.normal })
    this.view = new DrillMeshView(this.vol)
    scene.scene.add(this.view.group)
    const geos = new Set<unknown>(
      scene
        .toolTargets()
        .filter((t) => BONES.includes(t.id))
        .map((t) => t.geometry),
    )
    const meshes: T.Mesh[] = []
    scene.scene.traverse((o) => {
      const m = o as T.Mesh
      if (m.isMesh && geos.has(m.geometry)) meshes.push(m)
    })
    this.cutout = new BoneCutout(meshes)
    this.cutout.set(this.vol)
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKey)
    useDrill.setState({
      ready: true,
      events: [],
      thicknessMm: this.vol.thicknessAt(k.entry),
      breached: false,
      plunged: false,
      pastBoneMm: 0,
      warnings: 0,
      holeDepthMm: 0,
      holeWidthMm: 0,
      removedMm3: 0,
    })
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  onState(fn: (s: DrillState) => void) {
    this.listeners.push(fn)
  }
  onEvent(fn: (e: DrillEvent) => void) {
    this.eventListeners.push(fn)
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.code !== 'Space') return
    const el = e.target as HTMLElement | null
    if (el && /INPUT|TEXTAREA|SELECT|BUTTON/.test(el.tagName)) return
    this.space = e.type === 'keydown'
    if (this.space) e.preventDefault()
  }

  /** Tip and direction of travel in the scene frame. */
  aim(tip: T.Vector3, dir: T.Vector3) {
    this.target = sceneToMni([tip.x, tip.y, tip.z])
    const d = dir.clone().normalize()
    this.axis = sceneToMni([d.x, d.y, d.z])
    if (!this.session) {
      this.session = new DrillSession(this.vol, this.target)
      this.session.subscribe((e) => {
        const ev = useDrill.getState().events
        useDrill.setState({ events: [...ev, e].filter((x) => x.type !== 'start' && x.type !== 'stop').slice(-12) })
        for (const f of this.eventListeners) f(e)
      })
    }
  }

  /** Tests drive `tick` themselves with a fixed step (software GL runs at a few fps, so real time would starve the simulation). */
  manual = false

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame)
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    if (!this.manual && dt > 0) this.tick(dt, now)
  }

  tick(dt: number, now = performance.now()) {
    const s = this.session
    if (!s || !this.target) return
    const ui = useDrill.getState()
    const st = s.update({ target: this.target, axis: this.axis, push: ui.push, dt, running: ui.spin || this.space })
    for (const f of this.listeners) f(st)
    const sync = this.view.sync(4)
    if (sync.chunks || st.removedMm3 > 0) this.scene.redraw()
    if (now - this.lastUi > UI_MS) {
      this.lastUi = now
      const m = s.metrics()
      useDrill.setState({
        rpm: st.rpm,
        layer: st.layer,
        depthMm: st.depthMm,
        toNextMm: st.toNextMm,
        resistance: st.resistance,
        holeDepthMm: m.holeDepthMm,
        holeWidthMm: m.holeWidthMm,
        removedMm3: m.removedMm3,
        breached: m.breached,
        plunged: m.plunged,
        pastBoneMm: m.pastBoneMm,
        warnings: m.warnings,
      })
    }
  }

  /** Fresh bone (the patch is rebuilt from the atlas). */
  reset() {
    this.dispose()
    useDrill.setState({ events: [] })
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('keyup', this.onKey)
    this.cutout.clear()
    this.view.dispose()
    this.stopSub?.()
    useDrill.setState({ ready: false, rpm: 0, spin: false })
    this.scene.redraw()
  }
}
