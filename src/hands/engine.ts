import * as T from 'three'
import { activeScene } from '@/scene/sceneRef'
import { CameraTracker } from './tracker'
import { HandFilter } from './oneEuro'
import { HandRig, type HandPose } from './rig'
import { BONES, INDEX_TIP, MIDDLE_MCP, THUMB_TIP, WRIST, type HandFrame, type Pt } from './types'
import type { Gesture, HandsError, HandsState } from './useHands'
import { imageToScreen, REACH_GAIN } from './mapping'

type Side = 'left' | 'right'

/** Thumb–index gap over palm length: scale-free, so it reads the same near and far from the camera. */
export function pinchRatio(world: Pt[]) {
  const d = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
  return d(world[THUMB_TIP], world[INDEX_TIP]) / Math.max(1e-4, d(world[WRIST], world[MIDDLE_MCP]))
}

// Hysteresis: a pinch closes below ON and opens only above OFF, so it does not flicker at the edge.
const PINCH_ON = 0.3
const PINCH_OFF = 0.46
/** A pinch released this quickly without travelling is a tap (select). */
const TAP_MS = 380
const TAP_PX = 16
/** Lost for longer than this → the hand is gone (fade, release). */
const LOST_MS = 350

interface SideState {
  filterImg: HandFilter
  filterWorld: HandFilter
  pinched: boolean
  pinchLook: number
  seenAt: number
  down: { t: number; x: number; y: number; travel: number } | null
  last: { x: number; y: number } | null
}

export interface EngineHooks {
  report: HandsState['report']
  /** Screen position (viewport px) of the cursor and the hovered structure, or null when no hand. */
  cursor: (c: { x: number; y: number; grab: boolean } | null) => void
  tap: (x: number, y: number) => void
  theme: () => 'dark' | 'light'
}

/**
 * Camera (or synthetic frames) → filtered hands → drawn hands + gestures that
 * drive the atlas camera:
 *   • point (open hand)        – hover the structure under the index finger
 *   • pinch and move           – grab the model and turn it, with a little inertia
 *   • quick pinch              – select what is under the fingers
 *   • pinch with both hands    – pull apart / together to zoom
 */
export class HandsEngine {
  readonly rig: HandRig
  private tracker: CameraTracker | null = null
  private sides: Record<Side, SideState>
  private raf = 0
  private lastT = 0
  private aspect = 16 / 9
  private synthetic: HandFrame | null = null
  private zoomDist: number | null = null
  private velocity = { yaw: 0, pitch: 0 }
  private hovering = false
  private stopped = false
  private preview: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null
  private lastFrame: HandFrame | null = null
  /** Longest pinch (ms) that still counts as a tap. */
  tapMs = TAP_MS
  /** Frames processed so far (headless checks wait on it). */
  ticks = 0

  private hooks: EngineHooks

  constructor(canvas: HTMLCanvasElement, hooks: EngineHooks) {
    this.hooks = hooks
    this.rig = new HandRig(canvas)
    const side = (): SideState => ({
      filterImg: new HandFilter(1.4, 0.04),
      filterWorld: new HandFilter(1.0, 0.6),
      pinched: false,
      pinchLook: 0,
      seenAt: -1e9,
      down: null,
      last: null,
    })
    this.sides = { left: side(), right: side() }
    this.resize()
    this.raf = requestAnimationFrame(this.tick)
  }

  /** Start the webcam. Resolves when tracking runs; rejects with a HandsError code. */
  async startCamera(): Promise<void> {
    const tr = new CameraTracker()
    this.tracker = tr
    try {
      await tr.start()
    } catch (e) {
      tr.stop()
      this.tracker = null
      const name = (e as { name?: string })?.name
      const code: HandsError = name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'nocam' : 'load'
      console.error('[hands]', e)
      throw code
    }
    if (this.stopped) tr.stop()
  }

  get video() {
    return this.tracker?.video ?? null
  }

  setPreviewCanvas(canvas: HTMLCanvasElement | null) {
    this.preview = canvas ? { canvas, ctx: canvas.getContext('2d')! } : null
  }

  /** Headless checks: show this frame instead of the camera's (null → back to the camera). */
  feed(frame: HandFrame | null) {
    this.synthetic = frame
  }

  resize() {
    this.rig.resize(window.innerWidth, window.innerHeight)
  }

  private tick = (now: number) => {
    if (this.stopped) return
    this.raf = requestAnimationFrame(this.tick)
    this.ticks++
    const dt = Math.min(0.1, this.lastT ? (now - this.lastT) / 1000 : 1 / 60)
    this.lastT = now

    const frame = this.synthetic ? { ...this.synthetic, time: now } : this.tracker?.detect(now)
    if (frame) this.ingest(frame, now)
    else if (this.lastFrame && now - this.lastFrame.time > LOST_MS) this.ingest({ hands: [], aspect: this.aspect, time: now }, now)

    this.gestures(dt, now)
    this.rig.theme = this.hooks.theme()
    this.rig.render(dt)
    this.drawPreview()
  }

  private ingest(frame: HandFrame, now: number) {
    this.lastFrame = frame
    this.aspect = frame.aspect
    const poses: HandPose[] = []
    const seen = new Set<Side>()
    for (const h of frame.hands) {
      if (seen.has(h.side)) continue // two hands with one label: keep the more confident (first)
      seen.add(h.side)
      const s = this.sides[h.side]
      if (now - s.seenAt > LOST_MS) {
        s.filterImg.reset()
        s.filterWorld.reset()
      }
      s.seenAt = now
      const image = s.filterImg.apply(h.image, now)
      const world = s.filterWorld.apply(h.world, now)
      const r = pinchRatio(world)
      s.pinched = s.pinched ? r < PINCH_OFF : r < PINCH_ON
      s.pinchLook = T.MathUtils.damp(s.pinchLook, s.pinched ? 1 : T.MathUtils.clamp((0.75 - r) / 0.45, 0, 0.6), 18, 1 / 30)
      poses.push({ side: h.side, image, world, pinch: s.pinchLook })
    }
    for (const side of ['left', 'right'] as Side[]) {
      if (!seen.has(side) && now - this.sides[side].seenAt > LOST_MS) {
        const s = this.sides[side]
        s.pinched = false
        s.down = null
        s.last = null
      }
    }
    this.rig.update(poses, frame.aspect)
    this.hooks.report({ count: seen.size })
  }

  private present(side: Side, now: number) {
    return now - this.sides[side].seenAt <= LOST_MS
  }

  private gestures(dt: number, now: number) {
    const scene = activeScene()
    const host = scene?.hostElement.getBoundingClientRect()
    const present = (['right', 'left'] as Side[]).filter((s) => this.present(s, now))
    const pinched = present.filter((s) => this.sides[s].pinched)
    const point = (side: Side) => (this.sides[side].pinched ? this.rig.screenOf(side, THUMB_TIP, INDEX_TIP) : this.rig.screenOf(side, INDEX_TIP))
    let gesture: Gesture = present.length ? 'point' : 'none'

    // Releases first: a pinch that ended this frame may be a tap.
    for (const side of present.concat((['left', 'right'] as Side[]).filter((s) => !present.includes(s)))) {
      const s = this.sides[side]
      if (s.down && !s.pinched) {
        const quick = now - s.down.t < this.tapMs && s.down.travel < TAP_PX && pinched.length === 0 && this.present(side, now)
        if (quick) this.hooks.tap(s.down.x, s.down.y)
        s.down = null
      }
    }

    if (pinched.length === 2) {
      gesture = 'zoom'
      const a = point('left'),
        b = point('right')
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      // Per-frame step is capped: a hand re-acquired mid-gesture must not slam the camera in or out.
      if (this.zoomDist !== null && d > 60 && this.zoomDist > 60) scene?.dollyBy(T.MathUtils.clamp(Math.pow(this.zoomDist / d, 1.4), 0.88, 1.14))
      this.zoomDist = d
      for (const side of pinched) {
        const s = this.sides[side]
        if (s.down) s.down.travel = Infinity // never a tap
        s.last = null
      }
      this.velocity = { yaw: 0, pitch: 0 }
    } else {
      this.zoomDist = null
      if (pinched.length === 1) {
        gesture = 'grab'
        const side = pinched[0]
        const s = this.sides[side]
        const p = point(side)
        if (!s.down) s.down = { t: now, x: p.x, y: p.y, travel: 0 }
        if (s.last) {
          const dx = p.x - s.last.x,
            dy = p.y - s.last.y
          s.down.travel += Math.hypot(dx, dy)
          // Same feel as a mouse drag: a screen height of travel ≈ one full turn.
          const k = (2 * Math.PI) / Math.max(400, window.innerHeight)
          // A tap must not nudge the model: turning starts once the fingers clearly travel.
          if (s.down.travel >= TAP_PX) {
            scene?.orbitBy(dx * k, dy * k)
            const yaw = (dx * k) / dt,
              pitch = (dy * k) / dt
            this.velocity.yaw = T.MathUtils.lerp(this.velocity.yaw, yaw, 0.35)
            this.velocity.pitch = T.MathUtils.lerp(this.velocity.pitch, pitch, 0.35)
          }
        }
        s.last = p
      } else {
        // Coast after letting go.
        const v = this.velocity
        if (Math.abs(v.yaw) + Math.abs(v.pitch) > 0.02) {
          scene?.orbitBy(v.yaw * dt, v.pitch * dt)
          const decay = Math.exp(-4.5 * dt)
          v.yaw *= decay
          v.pitch *= decay
        } else v.yaw = v.pitch = 0
      }
      for (const side of present) if (!this.sides[side].pinched) this.sides[side].last = null
    }

    // The cursor: the pinching hand, else the right hand, else the left.
    const lead = pinched[0] ?? present[0]
    if (lead && this.rig.visible(lead)) {
      const c = point(lead)
      this.hooks.cursor({ x: c.x, y: c.y, grab: gesture === 'grab' || gesture === 'zoom' })
      if (scene && host && gesture === 'point') {
        scene.externalHover(c.x - host.left, c.y - host.top)
        this.hovering = true
      }
    } else {
      this.hooks.cursor(null)
      if (this.hovering) {
        scene?.externalHover(null)
        this.hovering = false
      }
    }
    this.hooks.report({ gesture })
  }

  /** The corner picture: the mirrored camera with the tracked skeleton over it. */
  private drawPreview() {
    const p = this.preview
    if (!p) return
    const { canvas, ctx } = p
    const w = canvas.width,
      h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const v = this.video
    ctx.save()
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    if (v && v.readyState >= 2) {
      // cover-fit the frame into the preview box
      const va = v.videoWidth / v.videoHeight
      const ba = w / h
      const sw = va > ba ? v.videoHeight * ba : v.videoWidth
      const sh = va > ba ? v.videoHeight : v.videoWidth / ba
      ctx.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, w, h)
    }
    ctx.restore()
    const f = this.lastFrame
    if (!f) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    for (const hand of f.hands) {
      const s = this.sides[hand.side]
      ctx.strokeStyle = s.pinched ? '#ffc56b' : '#8fd0ff'
      ctx.fillStyle = ctx.strokeStyle
      const pt = (q: Pt) => {
        const m = imageToScreen(q, f.aspect, w, h)
        // undo the reach gain: the preview shows the true camera frame
        return { x: w / 2 + (m.x - w / 2) / REACH_GAIN, y: h / 2 + (m.y - h / 2) / REACH_GAIN }
      }
      ctx.beginPath()
      for (const [a, b] of BONES) {
        const pa = pt(hand.image[a]),
          pb = pt(hand.image[b])
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
      }
      ctx.stroke()
      for (const i of [THUMB_TIP, INDEX_TIP]) {
        const q = pt(hand.image[i])
        ctx.beginPath()
        ctx.arc(q.x, q.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  dispose() {
    this.stopped = true
    cancelAnimationFrame(this.raf)
    this.tracker?.stop()
    this.tracker = null
    if (this.hovering) activeScene()?.externalHover(null)
    this.hooks.cursor(null)
    this.rig.dispose()
  }
}
