/**
 * SX-4 bone drilling procedural WebAudio synthesizer & gamepad rumble patterns (AG-17).
 *
 * Implements `CreateDrillAudio` / `DrillAudio` and `CreateDrillHaptics` / `DrillHaptics` from `src/or/drill/types.ts`.
 * Zero external audio samples; starts strictly on a user gesture (`start()`).
 */
import { LAYER_FEEL } from './dust'
import type { CreateDrillAudio, CreateDrillHaptics, DrillAudio, DrillEvent, DrillHaptics, DrillState, HapticPulse } from './types'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// ── Procedural Drill Sound (WebAudio) ──────────────────────────────────────

/** Compute target spindle acoustic frequency (Hz) from instantaneous `DrillState`. Pure helper for tests & synthesis. */
export function drillPitchHz(s: DrillState): number {
  const feel = LAYER_FEEL[s.layer]
  const rpmNorm = clamp(s.rpm / Math.max(1, s.maxRpm), 0, 1)
  const baseHz = 135 + rpmNorm * 640
  const sag = 1 - clamp(s.resistance, 0, 1) * feel.load * 0.22
  return Number((baseHz * feel.pitch * sag).toFixed(1))
}

export const createDrillAudio: CreateDrillAudio = (providedCtx?: AudioContext): DrillAudio => {
  let ctx: AudioContext | null = providedCtx ?? null
  const ownsCtx = !providedCtx
  let master: GainNode | null = null
  let oscMain: OscillatorNode | null = null
  let oscHarm: OscillatorNode | null = null
  let motorGain: GainNode | null = null
  let gritSource: AudioBufferSourceNode | null = null
  let gritFilter: BiquadFilterNode | null = null
  let gritGain: GainNode | null = null
  let muted = false
  let initialized = false

  const ensureGraph = () => {
    if (initialized || typeof window === 'undefined') return
    if (!ctx) {
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      ctx = new AudioCtx()
    }
    initialized = true

    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.45
    master.connect(ctx.destination)

    // 1. Spindle motor whine (sawtooth + 2x harmonic triangle through low-pass)
    const motorFilter = ctx.createBiquadFilter()
    motorFilter.type = 'lowpass'
    motorFilter.frequency.value = 2600
    motorFilter.Q.value = 1.4

    motorGain = ctx.createGain()
    motorGain.gain.value = 0.0001

    oscMain = ctx.createOscillator()
    oscMain.type = 'sawtooth'
    oscMain.frequency.value = 220

    oscHarm = ctx.createOscillator()
    oscHarm.type = 'triangle'
    oscHarm.frequency.value = 440

    const harmGain = ctx.createGain()
    harmGain.gain.value = 0.35

    oscMain.connect(motorFilter)
    oscHarm.connect(harmGain)
    harmGain.connect(motorFilter)
    motorFilter.connect(motorGain)
    motorGain.connect(master)

    oscMain.start()
    oscHarm.start()

    // 2. Bone-cutting grit (band-pass white noise modulated by resistance & speed)
    const bufLen = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

    gritFilter = ctx.createBiquadFilter()
    gritFilter.type = 'bandpass'
    gritFilter.frequency.value = 1400
    gritFilter.Q.value = 1.2

    gritGain = ctx.createGain()
    gritGain.gain.value = 0.0001

    gritSource = ctx.createBufferSource()
    gritSource.buffer = buf
    gritSource.loop = true
    gritSource.connect(gritFilter)
    gritFilter.connect(gritGain)
    gritGain.connect(master)
    gritSource.start()
  }

  const playTone = (freqStart: number, freqEnd: number, durationS: number, peakGain: number, delayS = 0, type: OscillatorType = 'sine') => {
    if (!ctx || !master || muted) return
    const t0 = ctx.currentTime + delayS
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freqStart, t0)
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + durationS)
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.linearRampToValueAtTime(peakGain, t0 + 0.006)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + durationS)
    osc.connect(env)
    env.connect(master)
    osc.start(t0)
    osc.stop(t0 + durationS + 0.01)
  }

  const start = () => {
    ensureGraph()
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume()
    }
  }

  const update = (s: DrillState) => {
    if (!ctx || !motorGain || !oscMain || !oscHarm || !gritGain || !gritFilter) return
    const now = ctx.currentTime
    if (!s.running || s.rpm <= 1) {
      motorGain.gain.setTargetAtTime(0.0001, now, 0.04)
      gritGain.gain.setTargetAtTime(0.0001, now, 0.04)
      return
    }

    const feel = LAYER_FEEL[s.layer]
    const rpmNorm = clamp(s.rpm / Math.max(1, s.maxRpm), 0, 1)
    const freq = drillPitchHz(s)
    oscMain.frequency.setTargetAtTime(freq, now, 0.03)
    oscHarm.frequency.setTargetAtTime(freq * 2.02, now, 0.03)

    const motorLevel = clamp(0.04 + rpmNorm * 0.16 + s.resistance * 0.08, 0.0001, 0.3)
    motorGain.gain.setTargetAtTime(motorLevel, now, 0.03)

    const cutting = s.speedMmS > 0.02 ? clamp(0.35 + s.speedMmS * 0.25, 0.35, 1) : 0.2
    const gritLevel = clamp(feel.load * s.resistance * cutting * 0.36, 0.0001, 0.38)
    gritGain.gain.setTargetAtTime(gritLevel, now, 0.03)
    gritFilter.frequency.setTargetAtTime(900 + feel.pitch * 900 + rpmNorm * 400, now, 0.04)
  }

  const event = (e: DrillEvent) => {
    if (!ctx || !master) return
    switch (e.type) {
      case 'layer':
        // Subtle tactile-acoustic cue on cortical/spongy transition
        playTone(e.to === 'diploe' ? 420 : 640, e.to === 'diploe' ? 320 : 780, 0.045, 0.12, 0, 'triangle')
        break
      case 'plunge-warning':
        // Urgent double beep: approaching inner table with excessive push
        playTone(880, 880, 0.065, 0.24, 0, 'sine')
        playTone(1180, 1180, 0.075, 0.26, 0.085, 'sine')
        break
      case 'breakthrough':
        // Distinct pop-through release chirp
        playTone(960, 260, 0.14, 0.3, 0, 'sawtooth')
        break
      case 'stall':
        // Low-frequency bog-down thud
        playTone(180, 75, 0.16, 0.28, 0, 'triangle')
        break
      default:
        break
    }
  }

  const mute = (on: boolean) => {
    muted = on
    if (master && ctx) {
      master.gain.setTargetAtTime(muted ? 0 : 0.45, ctx.currentTime, 0.02)
    }
  }

  const dispose = () => {
    try {
      oscMain?.stop()
      oscHarm?.stop()
      gritSource?.stop()
    } catch {
      /* already stopped */
    }
    oscMain?.disconnect()
    oscHarm?.disconnect()
    gritSource?.disconnect()
    gritFilter?.disconnect()
    gritGain?.disconnect()
    motorGain?.disconnect()
    master?.disconnect()
    if (ownsCtx && ctx) void ctx.close()
    ctx = null
    master = null
    oscMain = null
    oscHarm = null
    motorGain = null
    gritSource = null
    gritFilter = null
    gritGain = null
    initialized = false
  }

  return { start, update, event, mute, dispose }
}

// ── Gamepad Rumble Patterns (DrillHaptics / HapticPulse) ───────────────────

/** Pure mapping from instantaneous `DrillState` to a dual-rumble pulse (or `null` when idle). */
export function hapticPulseForState(s: DrillState): HapticPulse | null {
  if (!s.running || s.rpm <= 1) return null
  const feel = LAYER_FEEL[s.layer]
  const rpmNorm = clamp(s.rpm / Math.max(1, s.maxRpm), 0, 1)
  const load = clamp(s.resistance * (0.4 + 0.6 * feel.load), 0, 1)
  const strong = Number(clamp(load * 0.65, 0, 1).toFixed(3))
  const weak = Number(clamp(0.08 * rpmNorm + load * 0.55, 0, 1).toFixed(3))
  if (strong < 0.02 && weak < 0.02) return null
  return { durationMs: 60, strong, weak }
}

/** Pure mapping from discrete `DrillEvent` to a high-priority rumble impulse. */
export function hapticPulseForEvent(e: DrillEvent): HapticPulse | null {
  switch (e.type) {
    case 'layer':
      return { durationMs: 55, strong: 0.25, weak: 0.45 }
    case 'plunge-warning':
      return { durationMs: 110, strong: 0.45, weak: 0.9 }
    case 'breakthrough':
      return { durationMs: 180, strong: 0.95, weak: 0.7 }
    case 'stall':
      return { durationMs: 150, strong: 0.85, weak: 0.35 }
    default:
      return null
  }
}

interface RumbleActuator {
  playEffect?: (type: string, params: { duration: number; strongMagnitude: number; weakMagnitude: number }) => Promise<unknown>
}

const fireGamepadRumble = (pulse: HapticPulse) => {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return
  const pads = navigator.getGamepads()
  for (const pad of pads) {
    const act = (pad as unknown as { vibrationActuator?: RumbleActuator } | null)?.vibrationActuator
    if (act && typeof act.playEffect === 'function') {
      void act.playEffect('dual-rumble', {
        duration: pulse.durationMs,
        strongMagnitude: pulse.strong,
        weakMagnitude: pulse.weak,
      })
    }
  }
}

/**
 * Rate-limited gamepad rumble driver (`CreateDrillHaptics`). Clean no-op when no gamepad is connected.
 */
export const createDrillHaptics: CreateDrillHaptics = (): DrillHaptics => {
  const MIN_INTERVAL_MS = 45
  let lastMs = 0

  const update = (s: DrillState) => {
    const now = performance.now()
    if (now - lastMs < MIN_INTERVAL_MS) return
    const pulse = hapticPulseForState(s)
    if (!pulse) return
    lastMs = now
    fireGamepadRumble(pulse)
  }

  const event = (e: DrillEvent) => {
    const pulse = hapticPulseForEvent(e)
    if (!pulse) return
    lastMs = performance.now()
    fireGamepadRumble(pulse)
  }

  return { update, event }
}
