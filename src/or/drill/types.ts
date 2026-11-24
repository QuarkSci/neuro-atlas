/**
 * SX-4 bone drilling: contract types for feel (dust, sound, rumble). Owned by CC; AGY (AG-17) implements
 * `dust.ts`, `drillAudio.ts`, `haptics.ts` against them. The voxel engine (CC, SX-4) produces `DrillState` and `DrillEvent`.
 * Units: millimetres, seconds, rpm. Positions in MNI mm (see ../types).
 */
import type { Object3D } from 'three'
import type { L10n, Mni } from '../types'

/** What the bit is cutting. */
export type BoneLayer = 'air' | 'scalp' | 'outer-table' | 'diploe' | 'inner-table' | 'dura' | 'brain'

/** Per-layer feel table (AGY data, `drill/feel.ts` or inside `dust.ts`); the engine does not read it. */
export interface LayerFeel {
  layer: BoneLayer
  /** Dust colour (CSS hex) and how much of it: 0 none … 1 heavy. */
  dustColor: string
  dustAmount: number
  /** Pitch multiplier of the bit sound and load (rpm sag) at full push, 0…1. */
  pitch: number
  load: number
  /** Short note for the code reader, e.g. "diploe is spongy: pitch drops, dust darker". */
  note: string
}

/** Instantaneous drill state, published ≥ 30 Hz while the drill is on. */
export interface DrillState {
  /** Seconds since the session began. */
  t: number
  running: boolean
  /** Spindle speed, 0 … `maxRpm`. */
  rpm: number
  maxRpm: number
  /** How hard the learner pushes, 0…1 (mouse wheel / hand depth / pen pressure). */
  push: number
  /** Bit tip and axis (unit vector, handle → tip), MNI mm. */
  tip: Mni
  axis: Mni
  /** Depth of the tip below the outer table, mm (negative above it). */
  depthMm: number
  /** Layer the tip is cutting now, and 0…1 progress through it. */
  layer: BoneLayer
  layerProgress: number
  /** Resistance the bit feels, 0 free … 1 stalled (drives sound load and rumble). */
  resistance: number
  /** Speed of cutting, mm/s along the axis, and bone removed this tick, mm³. */
  speedMmS: number
  removedMm3: number
  /** Thickness left to the next layer boundary, mm (the warning ladder reads this). */
  toNextMm: number
}

export type DrillEvent =
  | { t: number; type: 'start' }
  | { t: number; type: 'stop' }
  | { t: number; type: 'layer'; from: BoneLayer; to: BoneLayer; depthMm: number }
  /** Inner table is about to give way: `toNextMm` under the warning distance and push too high. */
  | { t: number; type: 'plunge-warning'; toNextMm: number; push: number }
  /** The bit broke through the inner table (the dura is next). */
  | { t: number; type: 'breakthrough'; depthMm: number; push: number }
  | { t: number; type: 'stall'; resistance: number }

/** A gamepad rumble impulse (`vibrationActuator.playEffect('dual-rumble', …)`). */
export interface HapticPulse {
  durationMs: number
  strong: number
  weak: number
}

// ── What AGY implements ────────────────────────────────────────────────────

export interface DustOptions {
  /** Hard cap on live particles. */
  max?: number
}

/** `dust.ts`: a Points / InstancedMesh emitter that lives in the scene graph and follows the drill. */
export interface DustEmitter {
  object: Object3D
  /** Called every frame with the elapsed seconds since the last call. Emits while `s.running && s.speedMmS > 0`. */
  update(dt: number, s: DrillState): void
  clear(): void
  dispose(): void
}
export type CreateDust = (opts?: DustOptions) => DustEmitter

/** `drillAudio.ts`: procedural bit sound (WebAudio). No samples. Starts on a user gesture only. */
export interface DrillAudio {
  /** Resume the context (call from a click / key). */
  start(): void
  update(s: DrillState): void
  event(e: DrillEvent): void
  mute(on: boolean): void
  dispose(): void
}
export type CreateDrillAudio = (ctx?: AudioContext) => DrillAudio

/** `haptics.ts`: `DrillState` / `DrillEvent` → rumble. Rate-limited; a no-op without a gamepad. */
export interface DrillHaptics {
  update(s: DrillState): void
  event(e: DrillEvent): void
}
export type CreateDrillHaptics = () => DrillHaptics

/** Plain-language names of the layers for the HUD. */
export type LayerNames = Record<BoneLayer, L10n>
