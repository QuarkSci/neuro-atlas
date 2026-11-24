import type { Mni } from '../types'
import { add, dist, mul, sub, unit } from '../vec'
import type { BoneLayer, DrillEvent, DrillState } from './types'
import type { BoneVolume } from './volume'

/** Numbers the drill runs on (design values: the literature gives no cutting law for a simulator). */
export interface DrillParams {
  maxRpm: number
  /** Radius of the round burr, mm. */
  bitRadiusMm: number
  /** Free-cutting speed at full rpm, full push and hardness 1, mm/s. */
  cutRateMmS: number
  /** How hard each layer is to cut, 0 (free) … 1. */
  hardness: Record<BoneLayer, number>
  /** Warn when the inner table has less than this left and push is above `plungePush`. */
  warnMm: number
  plungePush: number
  /** Spin-up time to full rpm, s. */
  spinUpS: number
  /** How far the bit lurches past the inner table on a full-push breakthrough, mm. */
  lungeMm: number
}

export const DRILL_PARAMS: DrillParams = {
  maxRpm: 75000,
  bitRadiusMm: 2,
  cutRateMmS: 5,
  hardness: { air: 0, scalp: 0.1, 'outer-table': 0.8, diploe: 0.45, 'inner-table': 0.9, dura: 0.25, brain: 0.15 },
  warnMm: 1,
  plungePush: 0.6,
  spinUpS: 0.4,
  lungeMm: 3,
}

export interface DrillInput {
  /** Where the learner wants the bit tip (MNI mm) and its axis (handle → tip). */
  target: Mni
  axis: Mni
  /** Push, 0…1. */
  push: number
  dt: number
  running: boolean
}

export interface DrillMetrics {
  durationS: number
  removedMm3: number
  holeDepthMm: number
  holeWidthMm: number
  /** Went through the inner table; push at that moment; deepest the bit went past the bone's end (dura tear risk), mm. */
  breached: boolean
  breachPush: number
  plunged: boolean
  pastBoneMm: number
  warnings: number
  stalls: number
}

/**
 * The drill: a round burr moves through a `BoneVolume`. The tip follows the target, but cutting bone is rate-limited
 * (`cutRate × rpm × push ÷ hardness`), so pushing harder than the bit can cut leaves the tip behind and raises resistance.
 * Publishes `DrillState` (a 30 Hz+ stream) and `DrillEvent`s (layer change, warning, breakthrough, stall).
 */
export class DrillSession {
  private tip: Mni
  private axis: Mni = [0, 0, -1]
  private rpm = 0
  private t = 0
  private layer: BoneLayer = 'air'
  private spinning = false
  private warned = false
  private stallT = 0
  private lastStall = -9
  private listeners = new Set<(e: DrillEvent) => void>()
  private m: DrillMetrics = { durationS: 0, removedMm3: 0, holeDepthMm: 0, holeWidthMm: 0, breached: false, breachPush: 0, plunged: false, pastBoneMm: 0, warnings: 0, stalls: 0 }
  readonly events: DrillEvent[] = []

  readonly vol: BoneVolume
  readonly P: DrillParams

  constructor(vol: BoneVolume, start: Mni, P: DrillParams = DRILL_PARAMS) {
    this.vol = vol
    this.P = P
    this.tip = start
  }

  subscribe(fn: (e: DrillEvent) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private emit(e: DrillEvent) {
    this.events.push(e)
    for (const f of this.listeners) f(e)
  }

  get position(): Mni {
    return this.tip
  }

  metrics(): DrillMetrics {
    const hs = this.vol.holeStats()
    return { ...this.m, durationS: this.t, removedMm3: this.vol.removedMm3, holeDepthMm: hs.depthMm, holeWidthMm: hs.widthMm }
  }

  update(inp: DrillInput): DrillState {
    const { vol, P } = this
    const dt = Math.max(1e-4, inp.dt)
    this.t += dt
    this.axis = unit(inp.axis)
    const push = Math.max(0, Math.min(1, inp.push))
    // Spindle: spins up / down linearly.
    if (inp.running !== this.spinning) {
      this.spinning = inp.running
      this.emit({ t: this.t, type: inp.running ? 'start' : 'stop' })
    }
    this.rpm = Math.max(0, Math.min(P.maxRpm, this.rpm + ((inp.running ? 1 : -1) * P.maxRpm * dt) / P.spinUpS))
    const rpmFrac = this.rpm / P.maxRpm

    // Motion: free in air; in bone the cut rate limits the advance, a stopped bit cannot enter bone at all.
    const want = sub(inp.target, this.tip)
    const need = Math.hypot(want[0], want[1], want[2])
    let step = need
    let blocked = 0
    const layerHere = vol.layerAt(this.tip)
    const r = P.bitRadiusMm
    // The burr is a sphere whose distal point is the tip, so its centre sits one radius behind it.
    const centre = (tip: Mni): Mni => sub(tip, mul(this.axis, r))
    if (need > 1e-6) {
      const cand = add(this.tip, want)
      const touches = vol.sample(centre(cand)) < r
      if (touches) {
        const h = Math.max(P.hardness[layerHere === 'air' ? vol.layerAt(add(this.tip, mul(unit(want), P.bitRadiusMm))) : layerHere], 0.2)
        const vmax = rpmFrac < 0.15 ? 0 : (P.cutRateMmS * rpmFrac * (0.2 + 0.8 * push)) / h
        step = Math.min(need, vmax * dt)
        blocked = 1 - step / need
      }
    }
    const from = this.tip
    const to = need > 1e-6 ? add(this.tip, mul(want, step / need)) : this.tip
    let removed = 0
    if (inp.running && rpmFrac > 0.15) removed = vol.carveSegment(centre(from), centre(to), r)
    this.tip = to
    const speed = dist(from, to) / dt

    // Layer bookkeeping.
    const layer = vol.layerAt(this.tip)
    const depth = vol.depthBelowOuter(this.tip)
    const toNext = vol.toNextLayer(this.tip, this.axis)
    if (layer !== this.layer) {
      const prev = this.layer
      this.emit({ t: this.t, type: 'layer', from: prev, to: layer, depthMm: depth })
      if (prev === 'inner-table' && (layer === 'dura' || layer === 'brain')) {
        this.m.breached = true
        this.m.breachPush = push
        if (push > P.plungePush) {
          this.m.plunged = true
          // The resistance that held the bit back is gone: it lurches forward by an amount that grows with the push.
          const lunge = (P.lungeMm * (push - P.plungePush)) / (1 - P.plungePush)
          this.tip = add(this.tip, mul(this.axis, lunge))
        }
        this.emit({ t: this.t, type: 'breakthrough', depthMm: depth, push })
      }
      this.layer = layer
      this.warned = false
    }
    if (layer === 'inner-table' && !this.warned && toNext < P.warnMm && push > P.plungePush && inp.running) {
      this.warned = true
      this.m.warnings++
      this.emit({ t: this.t, type: 'plunge-warning', toNextMm: toNext, push })
    }
    if (layer === 'dura' || layer === 'brain') {
      this.m.pastBoneMm = Math.max(this.m.pastBoneMm, vol.pastBone(this.tip))
    }

    // Resistance and stall.
    const hard = P.hardness[layer]
    const bit = inp.running && layer !== 'air' ? 0.3 * hard + 0.7 * blocked : 0
    const contact = blocked > 0 ? 0.4 + 0.6 * blocked : 0
    const resistance = Math.min(1, Math.max(bit, contact))
    if (resistance > 0.9) {
      this.stallT += dt
      if (this.stallT > 0.3 && this.t - this.lastStall > 1) {
        this.lastStall = this.t
        this.m.stalls++
        this.emit({ t: this.t, type: 'stall', resistance })
      }
    } else this.stallT = 0

    // Progress through the current layer.
    let back = 0
    for (let s = 0.1; s <= 6; s += 0.1) {
      if (vol.layerAt(sub(this.tip, mul(this.axis, s))) !== layer) break
      back = s
    }
    const total = back + (Number.isFinite(toNext) ? toNext : 0)

    return {
      t: this.t,
      running: inp.running,
      rpm: this.rpm * (1 - 0.35 * resistance),
      maxRpm: P.maxRpm,
      push,
      tip: this.tip,
      axis: this.axis,
      depthMm: Number.isNaN(depth) ? -Infinity : depth,
      layer,
      layerProgress: total > 0 ? Math.min(1, back / total) : 0,
      resistance,
      speedMmS: speed,
      removedMm3: removed,
      toNextMm: toNext,
    }
  }
}
