import { create } from 'zustand'
import type { Mni } from '../types'
import type { DbsReport, DbsSide, DbsStepId, MerReading, StimReading, TrackOffset, TrajectoryAnalysis } from './logic'
import type { DbsTargetId } from './types'

/** What the DBS panel shows (the link writes it after every action). */
export interface DbsUi {
  open: boolean
  running: boolean
  target: DbsTargetId
  side: DbsSide
  step: DbsStepId
  pick: 'ac' | 'pc' | 'entry' | null
  marks: { ac: boolean; pc: boolean }
  frame: { lengthMm: number; errorMm: number } | null
  /** Planned target in AC–PC (lateral, y, z). */
  plannedAcpc: Mni | null
  analysis: TrajectoryAnalysis | null
  shiftMm: number
  sealed: boolean
  tracks: { id: number; offset: TrackOffset }[]
  track: number
  depth: number
  reading: MerReading | null
  mA: number
  stim: StimReading | null
  audio: boolean
  report: DbsReport | null
  notice: string | null
  set: (p: Partial<Omit<DbsUi, 'set'>>) => void
}

export const useDbs = create<DbsUi>((set) => ({
  open: false,
  running: false,
  target: 'stn',
  side: 'right',
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
  mA: 1,
  stim: null,
  audio: false,
  report: null,
  notice: null,
  set: (p) => set(p),
}))

if (import.meta.env.DEV) (window as unknown as { __dbsUi: typeof useDbs }).__dbsUi = useDbs
