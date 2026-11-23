import * as T from 'three'
import type { MeshBVH } from 'three-mesh-bvh'
import type { BrainScene } from '@/scene/BrainScene'
import type { OperatingRoom } from '../room'
import { buildTool } from './models'
import { handTool } from './handBridge'
import { EMPTY, useTool, type Kind, type Readout, type ToolEvent } from './useTool'

/** Tip closer than this to a vessel or nerve surface = contact (a collision event), mm. */
export const CONTACT_MM = 1
/** Warning ladder for the HUD, mm. */
export const WARN_MM = 5
const SAMPLE_MM = 0.2
const SAMPLE_MS = 50

export interface Sample {
  t: number
  p: [number, number, number]
  skinMm: number
  hazardMm: number
}

type Geo = T.BufferGeometry & { boundsTree?: MeshBVH }
interface Target {
  id: string
  kind: Kind
  geo: Geo
}

const kindOf = (system: string): Kind => {
  switch (system) {
    case 'arteries':
    case 'veins':
      return 'vessel'
    case 'cranial-nerves':
      return 'nerve'
    case 'skull':
      return 'bone'
    case 'meninges':
      return 'dura'
    case 'ventricles':
      return 'ventricle'
    default:
      return 'brain'
  }
}

const SCALP = 'scalp'
const hit = { point: new T.Vector3(), distance: 0, faceIndex: 0 }
const RAY_DIR = new T.Vector3(0.5773, 0.5774, 0.5773).normalize()

/**
 * Instrument engine (SX-2). Takes a tip and a direction of travel from any source (mouse, hand, later a tracked
 * pen), poses the instrument model, and answers on every move: which structures the tip is inside, the nearest
 * surface, the nearest vessel/nerve surface, the depth under the scalp. All in atlas scene millimetres.
 * Distances come from three-mesh-bvh on the atlas meshes themselves (closest point on the surface); "inside" is a
 * ray-parity test on the closed meshes.
 */
export class ToolEngine {
  readonly model = new T.Group()
  private targets: Target[] = []
  private scalp: Geo
  private tool: T.Group | null = null
  private tip = new T.Vector3()
  private dir = new T.Vector3(0, 0, -1)
  private have = false
  private inside = new Set<string>()
  private hazardNear = false
  private t0 = 0
  private lastPublish = 0
  private last: Sample | null = null
  readonly trace: Sample[] = []
  private path = 0
  private disposers: (() => void)[] = []
  // Mouse / hand ray state.
  private ray: { x: number; y: number } | null = null
  private gripFrom: { x: number; y: number; depth: number } | null = null

  private scene: BrainScene
  private room: OperatingRoom

  constructor(scene: BrainScene, room: OperatingRoom) {
    this.scene = scene
    this.room = room
    this.scene.scene.add(this.model)
    this.scalp = room.scalpMesh.geometry as Geo
    if (!this.scalp.boundsTree) (this.scalp as unknown as { computeBoundsTree: () => void }).computeBoundsTree()
    this.refreshTargets()
  }

  /** Re-read the loaded structures (layers load on demand). */
  refreshTargets() {
    this.targets = this.scene
      .toolTargets()
      .filter((t) => t.geometry.boundsTree)
      .map((t) => ({ id: t.id, kind: kindOf(t.system), geo: t.geometry }))
  }

  setTool(kind: 'off' | 'probe' | 'catheter' | 'drill') {
    if (this.tool) {
      this.model.remove(this.tool)
      this.tool.traverse((o) => {
        const m = o as T.Mesh
        m.geometry?.dispose()
        ;(m.material as T.Material | undefined)?.dispose()
      })
      this.tool = null
    }
    handTool.active = kind !== 'off'
    if (kind === 'off') {
      this.detach()
      this.have = false
      this.scene.redraw()
      return
    }
    this.tool = buildTool(kind)
    this.tool.visible = this.have
    this.model.add(this.tool)
    this.t0 = performance.now()
    this.trace.length = 0
    this.path = 0
    this.last = null
    this.inside.clear()
    useTool.setState({ events: [], samples: 0, pathMm: 0, maxDepthMm: 0, minHazardMm: Infinity, readout: EMPTY, depth: 0, lock: false })
    this.attach()
    if (this.have) this.setInput(this.tip, this.dir)
  }

  /** Where the instrument is and where it points (direction of travel, handle → tip). */
  setInput(tip: T.Vector3, dir: T.Vector3) {
    this.tip.copy(tip)
    this.dir.copy(dir).normalize()
    this.have = true
    if (!this.tool) return
    this.tool.visible = true
    this.tool.position.copy(tip)
    this.tool.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), this.dir.clone().negate())
    this.query()
    this.scene.redraw()
  }

  // ── Queries ──────────────────────────────────────────────────────────

  /** Distance from `p` to the surface of one structure, mm (null when not loaded). */
  distanceTo(id: string, p: T.Vector3): number | null {
    const geo = id === SCALP ? this.scalp : this.targets.find((t) => t.id === id)?.geo
    if (!geo?.boundsTree) return null
    return geo.boundsTree.closestPointToPoint(p, hit)?.distance ?? null
  }

  /** Is `p` inside the closed mesh? (First surface hit along a fixed ray is a back face.) */
  isInside(id: string, p: T.Vector3): boolean {
    const geo = id === SCALP ? this.scalp : this.targets.find((t) => t.id === id)?.geo
    return geo ? this.insideGeo(geo, p) : false
  }

  private insideGeo(geo: Geo, p: T.Vector3) {
    const bvh = geo.boundsTree
    if (!bvh) return false
    const h = bvh.raycastFirst(new T.Ray(p, RAY_DIR), T.DoubleSide)
    return !!h && !!h.face && h.face.normal.dot(RAY_DIR) > 0
  }

  private query() {
    const p = this.tip
    const out: Readout = { inside: [], nearestId: null, nearestMm: Infinity, hazardId: null, hazardMm: Infinity, skinMm: Infinity, contact: false }
    for (const t of this.targets) {
      const bb = t.geo.boundingBox ?? (t.geo.computeBoundingBox(), t.geo.boundingBox!)
      const hazard = t.kind === 'vessel' || t.kind === 'nerve'
      const bound = bb.distanceToPoint(p)
      if (bound > out.nearestMm && (!hazard || bound > out.hazardMm)) continue
      const d = t.geo.boundsTree!.closestPointToPoint(p, hit)?.distance ?? Infinity
      if (d < out.nearestMm) {
        out.nearestMm = d
        out.nearestId = t.id
      }
      if (hazard && d < out.hazardMm) {
        out.hazardMm = d
        out.hazardId = t.id
      }
      if (!hazard && bb.containsPoint(p) && this.insideGeo(t.geo, p)) out.inside.push(t.id)
    }
    const dSkin = this.scalp.boundsTree!.closestPointToPoint(p, hit)?.distance ?? Infinity
    out.skinMm = this.insideGeo(this.scalp, p) ? -dSkin : dSkin
    out.contact = out.hazardMm < CONTACT_MM

    // Events on change.
    const now = this.seconds()
    const events: ToolEvent[] = []
    const depth = Math.max(0, -out.skinMm)
    const cur = new Set(out.inside)
    for (const id of cur) if (!this.inside.has(id)) events.push({ t: now, type: 'enter', id, depth })
    for (const id of this.inside) if (!cur.has(id)) events.push({ t: now, type: 'exit', id, depth })
    if (out.contact && !this.hazardNear && out.hazardId) events.push({ t: now, type: 'hazard', id: out.hazardId, depth })
    this.inside = cur
    this.hazardNear = out.contact

    this.record(now, out)
    this.buzz(out)
    const st = useTool.getState()
    const tNow = performance.now()
    if (events.length || tNow - this.lastPublish > 70) {
      this.lastPublish = tNow
      useTool.setState({
        readout: out,
        events: events.length ? [...st.events, ...events].slice(-60) : st.events,
        samples: this.trace.length,
        pathMm: this.path,
        maxDepthMm: Math.max(st.maxDepthMm, depth),
        minHazardMm: Math.min(st.minHazardMm, out.hazardMm),
      })
    }
  }

  private seconds() {
    return (performance.now() - this.t0) / 1000
  }

  // ── Trajectory ───────────────────────────────────────────────────────

  private record(t: number, r: Readout) {
    if (!useTool.getState().rec) return
    const p: [number, number, number] = this.tip.toArray()
    const l = this.last
    if (l) {
      const moved = Math.hypot(p[0] - l.p[0], p[1] - l.p[1], p[2] - l.p[2])
      if (moved < SAMPLE_MM || (t - l.t) * 1000 < SAMPLE_MS) return
      this.path += moved
    }
    const s: Sample = { t, p, skinMm: r.skinMm, hazardMm: r.hazardMm }
    this.trace.push(s)
    this.last = s
  }

  clearTrace() {
    this.trace.length = 0
    this.path = 0
    this.last = null
    useTool.setState({ samples: 0, pathMm: 0, maxDepthMm: 0, minHazardMm: Infinity, events: [] })
  }

  /** CSV of the trajectory in MNI millimetres (scene = (−x, z, y)). */
  csv() {
    const rows = ['t_s,x_mni,y_mni,z_mni,skin_mm,hazard_mm']
    for (const s of this.trace)
      rows.push(
        [
          s.t.toFixed(3),
          (-s.p[0]).toFixed(2),
          s.p[2].toFixed(2),
          s.p[1].toFixed(2),
          isFinite(s.skinMm) ? s.skinMm.toFixed(2) : '',
          isFinite(s.hazardMm) ? s.hazardMm.toFixed(2) : '',
        ].join(','),
      )
    return rows.join('\n')
  }

  // ── Feedback ─────────────────────────────────────────────────────────

  private lastBuzz = 0
  /** Gamepad rumble that grows as a vessel or nerve gets close; the HUD shows the same thing on screen. */
  private buzz(r: Readout) {
    const now = performance.now()
    if (now - this.lastBuzz < 90 || r.hazardMm > WARN_MM) return
    this.lastBuzz = now
    const k = Math.min(1, 1 - r.hazardMm / WARN_MM)
    try {
      for (const pad of navigator.getGamepads?.() ?? []) {
        const act = (pad as unknown as { vibrationActuator?: { playEffect: (t: string, o: object) => void } } | null)?.vibrationActuator
        act?.playEffect('dual-rumble', { duration: 80, strongMagnitude: k, weakMagnitude: k * 0.6 })
      }
    } catch {
      /* no gamepad */
    }
  }

  // ── Sources ──────────────────────────────────────────────────────────

  /** Pointer / hand at screen (x, y) relative to the scene host: the tip goes under it, pushed in by `depth` mm. */
  private aim(x: number, y: number) {
    const h = this.scene.pickPoint(x, y, [this.room.scalpMesh])
    if (!h) return false
    const depth = useTool.getState().depth
    const dir = this.tool?.name === 'tool-probe' ? h.dir : h.normal.clone().negate().lerp(h.dir, 0.15).normalize()
    this.setInput(h.point.clone().addScaledVector(dir, depth), dir)
    return true
  }

  private onMove = (e: PointerEvent) => {
    if (useTool.getState().lock || e.buttons) return
    const r = this.scene.hostElement.getBoundingClientRect()
    this.ray = { x: e.clientX - r.left, y: e.clientY - r.top }
    this.aim(this.ray.x, this.ray.y)
  }
  private onWheel = (e: WheelEvent) => {
    if (!this.scene.hostElement.contains(e.target as Node)) return // panels keep their own scrolling
    if (e.shiftKey || e.ctrlKey || e.metaKey) return // pinch (ctrl) zooms and shift pans, as in the atlas
    e.preventDefault()
    e.stopPropagation()
    this.pushDepth(-e.deltaY * 0.05)
  }

  pushDepth(mm: number) {
    const st = useTool.getState()
    useTool.setState({ depth: Math.max(-20, Math.min(120, st.depth + mm)) })
    if (this.ray) this.aim(this.ray.x, this.ray.y)
  }

  /** A click freezes the instrument; another releases it. */
  tap() {
    useTool.setState((s) => ({ lock: !s.lock }))
    return true
  }

  private attach() {
    if (this.disposers.length) return
    const el = this.scene.hostElement
    el.addEventListener('pointermove', this.onMove)
    // On the host's parent: the atlas's own wheel handler (it pans) sits on the host in the capture phase, and this must come first.
    const up = el.parentElement ?? el
    up.addEventListener('wheel', this.onWheel, { capture: true, passive: false })
    this.disposers.push(
      () => el.removeEventListener('pointermove', this.onMove),
      () => up.removeEventListener('wheel', this.onWheel, { capture: true }),
    )
    // Hands: the open hand points, a pinch grips (the ray freezes, moving the hand down pushes the tip in).
    handTool.hand = (x, y, grip) => {
      const r = this.scene.hostElement.getBoundingClientRect()
      const lx = x - r.left,
        ly = y - r.top
      if (useTool.getState().lock) return
      if (grip) {
        if (!this.gripFrom) this.gripFrom = { x: lx, y: ly, depth: useTool.getState().depth }
        const depth = this.gripFrom.depth + (ly - this.gripFrom.y) * 0.25
        useTool.setState({ depth: Math.max(-20, Math.min(120, depth)) })
        this.aim(this.ray?.x ?? this.gripFrom.x, this.ray?.y ?? this.gripFrom.y)
        return
      }
      this.gripFrom = null
      this.ray = { x: lx, y: ly }
      this.aim(lx, ly)
    }
    handTool.lost = () => (this.gripFrom = null)
  }
  private detach() {
    for (const d of this.disposers) d()
    this.disposers = []
    handTool.active = false
    handTool.hand = () => {}
    handTool.lost = () => {}
    this.gripFrom = null
  }

  dispose() {
    this.setTool('off')
    this.model.removeFromParent()
  }
}
