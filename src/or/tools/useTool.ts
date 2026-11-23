import { create } from 'zustand'
import type { ToolKind } from './models'

export type ToolId = 'off' | ToolKind
/** What a structure means to an instrument. */
export type Kind = 'skin' | 'bone' | 'dura' | 'brain' | 'ventricle' | 'vessel' | 'nerve'

export interface ToolEvent {
  /** Seconds since the tool was switched on. */
  t: number
  type: 'enter' | 'exit' | 'hazard'
  id: string
  /** Tip depth below the scalp surface, mm. */
  depth: number
}

export interface Readout {
  /** Structures the tip is inside of (closed meshes). */
  inside: string[]
  /** Nearest structure surface, any kind. */
  nearestId: string | null
  nearestMm: number
  /** Nearest vessel or nerve surface. */
  hazardId: string | null
  hazardMm: number
  /** Signed distance to the scalp surface: negative = inside the head (depth), positive = above it. */
  skinMm: number
  /** Tip is touching a vessel or nerve (under the contact threshold). */
  contact: boolean
}

export const EMPTY: Readout = { inside: [], nearestId: null, nearestMm: Infinity, hazardId: null, hazardMm: Infinity, skinMm: Infinity, contact: false }

export interface ToolState {
  tool: ToolId
  /** A click freezes the instrument where it is; another click releases it. */
  lock: boolean
  /** How far past the first surface under the pointer the tip has been pushed along its line, mm. */
  depth: number
  readout: Readout
  events: ToolEvent[]
  /** Trajectory recording. */
  rec: boolean
  samples: number
  pathMm: number
  maxDepthMm: number
  minHazardMm: number
  set: (p: Partial<Omit<ToolState, 'set'>>) => void
}

export const useTool = create<ToolState>((set) => ({
  tool: 'off',
  lock: false,
  depth: 0,
  readout: EMPTY,
  events: [],
  rec: true,
  samples: 0,
  pathMm: 0,
  maxDepthMm: 0,
  minHazardMm: Infinity,
  set: (p) => set(p),
}))

if (import.meta.env.DEV) (window as unknown as { __tool: typeof useTool }).__tool = useTool
