import { create } from 'zustand'
import type { Skin } from './room'

export type OrCamera = 'surgeon' | 'microscope' | 'free'

/** A measurement between two surface points (scene mm). */
export interface Measure {
  id: number
  a: [number, number, number]
  b: [number, number, number]
  mm: number
}

export interface ORState {
  on: boolean
  camera: OrCamera
  skin: Skin
  lamp: boolean
  /** The ruler: two taps on a surface make a measurement. */
  measure: boolean
  measures: Measure[]
  /** First point of a measurement in progress. */
  pending: [number, number, number] | null
  /** Draws per second of the last half second (the scene draws only when something changes). */
  fps: number
  set: (p: Partial<Omit<ORState, 'set'>>) => void
}

export const useOR = create<ORState>((set) => ({
  on: false,
  camera: 'surgeon',
  skin: 'on',
  lamp: true,
  measure: false,
  measures: [],
  pending: null,
  fps: 0,
  set: (p) => set(p),
}))

if (import.meta.env.DEV) (window as unknown as { __or: typeof useOR }).__or = useOR
