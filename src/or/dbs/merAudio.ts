/**
 * OP-2 DBS Microelectrode Recording (MER) deterministic pattern model & WebAudio synthesizer (AG-16).
 *
 * - `merPattern(target, depthMm)`: pure deterministic function matching `MerPatternFn` (`src/or/dbs/types.ts`).
 * - `merWaveform(pattern, durationS, sampleRate, seed)`: deterministic spike-train PCM generator for spike plots & tests.
 * - `MerAudioEngine`: zero-asset WebAudio engine producing background "rain" noise + biphasic extracellular action potentials.
 */
import { DBS_MER_BY_TARGET } from './data'
import type { DbsTargetId, MerKind, MerLayer, MerPattern, MerPatternFn } from './types'

/** Half-width of the smooth transition zone around every layer boundary, mm (types.ts line 102). */
const BLEND_MM = 0.5

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mid = (r: { min: number; max: number }) => (r.min + r.max) * 0.5

const baseAmplitude = (kind: MerKind, isTarget: boolean): number => {
  if (isTarget) return 0.88
  switch (kind) {
    case 'silent':
      return 0.16
    case 'white-matter':
      return 0.18
    case 'regular-high':
      return 0.78
    case 'pauser-burster':
      return 0.65
    case 'sensory-burst':
      return 0.68
    case 'border':
      return 0.52
    case 'sparse-burst':
      return 0.48
    default:
      return 0.75
  }
}

/**
 * Pure deterministic MER electrophysiological readout for `(target, depthMm)`.
 * `depthMm` is relative to the planned target (`+` = above target, `0` = target center, `-` = below target).
 */
export const merPattern: MerPatternFn = (target: DbsTargetId, depthMm: number): MerPattern => {
  const layers = DBS_MER_BY_TARGET[target]
  let idx = layers.findIndex((l) => depthMm <= l.fromMm && depthMm > l.toMm)
  if (idx < 0) {
    idx = depthMm > layers[0].fromMm ? 0 : layers.length - 1
  }
  const layer = layers[idx]

  // Distance to the nearest boundary of the active layer.
  const dTop = Math.abs(depthMm - layer.fromMm)
  const dBot = Math.abs(depthMm - layer.toMm)
  const toBoundaryMm = Math.min(dTop, dBot)

  // Slow deterministic spatial drift (±6%) so the signal feels organic yet reproducible.
  const drift = 1 + 0.06 * Math.sin(depthMm * 1.7 + idx * 0.9)
  let rateHz = mid(layer.rateHz.value) * drift
  let burstiness = layer.burstiness
  let noise = layer.noise
  let amplitude = baseAmplitude(layer.kind, layer.isTarget)

  // Blend smoothly across ±BLEND_MM around internal layer boundaries.
  const blendWith = (neighbor: MerLayer, distToEdge: number) => {
    const w = 0.5 * (1 - clamp(distToEdge / BLEND_MM, 0, 1))
    if (w <= 0) return
    rateHz = lerp(rateHz, mid(neighbor.rateHz.value), w)
    burstiness = lerp(burstiness, neighbor.burstiness, w)
    noise = lerp(noise, neighbor.noise, w)
    amplitude = lerp(amplitude, baseAmplitude(neighbor.kind, neighbor.isTarget), w)
  }

  if (dTop < BLEND_MM && idx > 0) blendWith(layers[idx - 1], dTop)
  if (dBot < BLEND_MM && idx < layers.length - 1) blendWith(layers[idx + 1], dBot)

  // Attenuate slightly if outside the mapped track bounds.
  if (depthMm > layers[0].fromMm || depthMm < layers[layers.length - 1].toMm) {
    amplitude *= 0.6
    noise *= 0.6
  }

  const tremorHz = layer.tremorHz ? Number((mid(layer.tremorHz.value) + 0.25 * Math.sin(depthMm * 2.1)).toFixed(2)) : null

  return {
    layerId: layer.id,
    kind: layer.kind,
    rateHz: Number(Math.max(0.5, rateHz).toFixed(2)),
    burstiness: Number(clamp(burstiness, 0, 1).toFixed(3)),
    noise: Number(clamp(noise, 0, 1).toFixed(3)),
    amplitude: Number(clamp(amplitude, 0, 1).toFixed(3)),
    tremorHz,
    response: layer.response,
    inTarget: layer.isTarget,
    toBoundaryMm: Number(toBoundaryMm.toFixed(3)),
  }
}

// ── Deterministic Spike-Train Generator (for oscilloscope / tests) ─────────

const mulberry32 = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a deterministic synthetic extracellular MER waveform (`-1…1`) for spike plotting or offline testing.
 */
export function merWaveform(pattern: MerPattern, durationS = 0.5, sampleRate = 4000, seed = 1337): Float32Array {
  const n = Math.max(1, Math.floor(durationS * sampleRate))
  const out = new Float32Array(n)
  const rng = mulberry32(seed)

  // Background multi-unit "rain" noise
  const bgScale = 0.04 + pattern.noise * 0.22
  for (let i = 0; i < n; i++) {
    out[i] = (rng() * 2 - 1) * bgScale
  }

  // Biphasic action-potential spikes (~1.5 ms duration)
  const spikeLen = Math.max(4, Math.round(sampleRate * 0.0015))
  let t = 0
  while (t < durationS) {
    const tremorMod = pattern.tremorHz ? 0.5 + 0.5 * Math.sin(2 * Math.PI * pattern.tremorHz * t) : 1
    const effRate = Math.max(1, pattern.rateHz * (pattern.tremorHz ? 0.25 + 1.5 * tremorMod : 1))
    // Burstiness mixes exponential (irregular/bursty) and periodic inter-spike intervals.
    const u = Math.max(1e-6, rng())
    const expIsi = -Math.log(u) / effRate
    const regIsi = 1 / effRate
    const isi = lerp(regIsi, expIsi, clamp(pattern.burstiness * 1.15, 0.05, 1))
    t += isi
    if (t >= durationS) break

    const start = Math.floor(t * sampleRate)
    const amp = pattern.amplitude * (0.65 + 0.35 * rng())
    for (let k = 0; k < spikeLen && start + k < n; k++) {
      const phase = k / spikeLen
      // Fast negative depolarization followed by broader positive repolarization
      const shape = phase < 0.35 ? -Math.sin((phase / 0.35) * Math.PI) : 0.6 * Math.sin(((phase - 0.35) / 0.65) * Math.PI)
      out[start + k] = clamp(out[start + k] + shape * amp, -1, 1)
    }
  }
  return out
}

// ── Live WebAudio MER Synthesizer ──────────────────────────────────────────

/**
 * Procedural WebAudio MER synthesizer (zero external audio files).
 * Combines a band-pass filtered background "rain" noise bed with scheduled biphasic extracellular clicks.
 */
export class MerAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private bgGain: GainNode | null = null
  private bgFilter: BiquadFilterNode | null = null
  private bgSource: AudioBufferSourceNode | null = null
  private timer: number | null = null
  private pattern: MerPattern = merPattern('stn', 10)
  private volume = 0.5
  private muted = false
  private responseUntilMs = 0
  private nextSpikeTime = 0
  private phaseStart = 0

  /** Start WebAudio synthesis (must be called after a user gesture in browsers). */
  start(initial?: MerPattern): void {
    if (initial) this.pattern = initial
    if (typeof window === 'undefined') return
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    if (!this.ctx) {
      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.muted ? 0 : this.volume
      this.masterGain.connect(this.ctx.destination)

      // 2-second looping white noise buffer for multi-unit background hash ("rain")
      const bufLen = this.ctx.sampleRate * 2
      const noiseBuf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate)
      const ch = noiseBuf.getChannelData(0)
      for (let i = 0; i < bufLen; i++) ch[i] = Math.random() * 2 - 1

      this.bgFilter = this.ctx.createBiquadFilter()
      this.bgFilter.type = 'bandpass'
      this.bgFilter.frequency.value = 1100
      this.bgFilter.Q.value = 0.9

      this.bgGain = this.ctx.createGain()
      this.bgGain.gain.value = 0.01

      this.bgSource = this.ctx.createBufferSource()
      this.bgSource.buffer = noiseBuf
      this.bgSource.loop = true
      this.bgSource.connect(this.bgFilter)
      this.bgFilter.connect(this.bgGain)
      this.bgGain.connect(this.masterGain)
      this.bgSource.start()
      this.phaseStart = this.ctx.currentTime
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    this.nextSpikeTime = this.ctx.currentTime + 0.02
    this.applyBackground()

    if (this.timer == null) {
      this.timer = window.setInterval(() => this.scheduleWindow(), 40)
    }
  }

  /** Update the live MER pattern as the microdrive moves to a new depth. */
  update(pattern: MerPattern): void {
    this.pattern = pattern
    this.applyBackground()
  }

  /** Trigger a kinesthetic / tactile / visual-flash provocation boost (e.g. passive limb flexion). */
  triggerResponse(durationMs = 900): void {
    if (this.pattern.response === 'none') return
    this.responseUntilMs = performance.now() + durationMs
    this.applyBackground()
  }

  setVolume(v: number): void {
    this.volume = clamp(v, 0, 1)
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.03)
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.02)
    }
  }

  get active(): boolean {
    return this.timer != null
  }

  stop(): void {
    if (this.timer != null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
    if (this.bgGain && this.ctx) {
      this.bgGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03)
    }
  }

  dispose(): void {
    this.stop()
    try {
      this.bgSource?.stop()
    } catch {
      /* already stopped */
    }
    this.bgSource?.disconnect()
    this.bgFilter?.disconnect()
    this.bgGain?.disconnect()
    this.masterGain?.disconnect()
    void this.ctx?.close()
    this.ctx = null
    this.masterGain = null
    this.bgGain = null
    this.bgFilter = null
    this.bgSource = null
  }

  private applyBackground(): void {
    if (!this.ctx || !this.bgGain || !this.bgFilter) return
    const boost = performance.now() < this.responseUntilMs ? 1.45 : 1
    const gain = clamp((0.015 + this.pattern.noise * 0.16) * boost, 0, 0.32)
    const freq = this.pattern.kind === 'regular-high' ? 1750 : this.pattern.kind === 'dense-irregular' ? 1250 : 950
    this.bgGain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.05)
    this.bgFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05)
  }

  private scheduleWindow(): void {
    if (!this.ctx || !this.masterGain || this.muted) return
    const lookAhead = 0.08
    const now = this.ctx.currentTime
    if (this.nextSpikeTime < now) this.nextSpikeTime = now

    const p = this.pattern
    const provoked = performance.now() < this.responseUntilMs && p.response !== 'none'
    const boost = provoked ? 1.55 : 1

    while (this.nextSpikeTime < now + lookAhead) {
      const elapsed = this.nextSpikeTime - this.phaseStart
      const tremorMod = p.tremorHz ? 0.25 + 1.5 * (0.5 + 0.5 * Math.sin(2 * Math.PI * p.tremorHz * elapsed)) : 1
      const effRate = Math.max(1, p.rateHz * boost * tremorMod)

      this.emitSpike(this.nextSpikeTime, clamp(p.amplitude * (provoked ? 1.15 : 1), 0.05, 1), p.kind)

      const u = Math.max(1e-5, Math.random())
      const expIsi = -Math.log(u) / effRate
      const regIsi = 1 / effRate
      const isi = lerp(regIsi, expIsi, clamp(p.burstiness * 1.15, 0.05, 1))
      this.nextSpikeTime += Math.max(0.004, isi)
    }
  }

  private emitSpike(when: number, amp: number, kind: MerKind): void {
    if (!this.ctx || !this.masterGain) return
    const osc = this.ctx.createOscillator()
    const env = this.ctx.createGain()
    osc.type = kind === 'regular-high' || kind === 'border' ? 'sine' : 'triangle'
    const baseFreq = kind === 'regular-high' ? 1650 : kind === 'dense-irregular' ? 1150 : kind === 'tremor-locked' ? 980 : 1050
    osc.frequency.setValueAtTime(baseFreq * (0.9 + Math.random() * 0.2), when)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, when + 0.0018)

    env.gain.setValueAtTime(0.0001, when)
    env.gain.linearRampToValueAtTime(amp * 0.35, when + 0.0003)
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.0022)

    osc.connect(env)
    env.connect(this.masterGain)
    osc.start(when)
    osc.stop(when + 0.0025)
  }
}
