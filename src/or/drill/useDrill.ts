import { create } from 'zustand'
import type { BoneLayer, DrillEvent } from './types'

/** What the drill panel shows (the engine writes it ≤ 15 Hz; the voxel work never goes through React). */
export interface DrillUi {
  ready: boolean
  /** The learner's switch (Space held also turns it on). */
  spin: boolean
  push: number
  rpm: number
  layer: BoneLayer
  depthMm: number
  toNextMm: number
  resistance: number
  holeDepthMm: number
  holeWidthMm: number
  removedMm3: number
  thicknessMm: number
  breached: boolean
  plunged: boolean
  pastBoneMm: number
  warnings: number
  events: DrillEvent[]
  set: (p: Partial<Omit<DrillUi, 'set'>>) => void
}

export const useDrill = create<DrillUi>((set) => ({
  ready: false,
  spin: false,
  push: 0.5,
  rpm: 0,
  layer: 'air',
  depthMm: 0,
  toNextMm: Infinity,
  resistance: 0,
  holeDepthMm: 0,
  holeWidthMm: 0,
  removedMm3: 0,
  thicknessMm: 0,
  breached: false,
  plunged: false,
  pastBoneMm: 0,
  warnings: 0,
  events: [],
  set: (p) => set(p),
}))

if (import.meta.env.DEV) (window as unknown as { __drill: typeof useDrill }).__drill = useDrill
