import { create } from 'zustand'

export type HandsStatus = 'off' | 'starting' | 'on' | 'error'
export type HandsError = 'denied' | 'nocam' | 'load'
/** What the hands are doing right now (drives the hint chip). */
export type Gesture = 'none' | 'point' | 'grab' | 'zoom'

export interface HandsState {
  /** The camera (shared by both features). */
  status: HandsStatus
  error: HandsError | null
  /** Hand control: the hands drawn over the atlas, gestures drive the camera. */
  hands: boolean
  /** Head-coupled "window" view: the scene's perspective follows the viewer's head. */
  head: boolean
  /** Small mirrored camera picture in the corner. */
  preview: boolean
  /** Hands in view (0–2). */
  count: number
  /** A face is being tracked. */
  face: boolean
  gesture: Gesture
  /** Window effect strength (1 = the physical default). */
  headGain: number
  /** Bumped to take the current head position as the centre again. */
  recenterTick: number
  /** A new camera session each time the camera goes from off/error to starting (the engine is rebuilt per session). */
  session: number
  /** Where frames come from: the webcam, or synthetic hands/faces fed by headless checks. */
  source: 'camera' | 'synthetic'
  setFeature: (f: 'hands' | 'head', on: boolean, source?: 'camera' | 'synthetic') => void
  toggle: (f: 'hands' | 'head') => void
  /** Retry the camera after an error. */
  start: () => void
  stop: () => void
  setPreview: (on: boolean) => void
  setHeadGain: (g: number) => void
  recenter: () => void
  /** Engine → store; only changed fields. */
  report: (p: Partial<Pick<HandsState, 'status' | 'error' | 'count' | 'gesture' | 'face'>>) => void
}

const load = (key: string, def: string) => {
  try {
    return localStorage.getItem(key) ?? def
  } catch {
    return def
  }
}
const save = (key: string, v: string) => {
  try {
    localStorage.setItem(key, v)
  } catch {
    /* private mode */
  }
}

/**
 * Camera features. Never on at load: the camera starts only when the person
 * switches a feature on, and stops when every feature is off or the tab is left.
 */
export const useHands = create<HandsState>((set, get) => ({
  status: 'off',
  error: null,
  hands: false,
  head: false,
  preview: load('na:hands-preview', '1') !== '0',
  count: 0,
  face: false,
  gesture: 'none',
  headGain: Math.min(2, Math.max(0.3, +load('na:head-gain', '1') || 1)),
  recenterTick: 0,
  session: 0,
  source: 'camera',
  setFeature: (f, on, source) => {
    const s = get()
    const next = { hands: s.hands, head: s.head, [f]: on }
    if (!next.hands && !next.head) return set({ ...next, status: 'off', error: null, count: 0, face: false, gesture: 'none' })
    const patch: Partial<HandsState> = { ...next }
    if (source) patch.source = source
    if (s.status === 'off' || s.status === 'error') Object.assign(patch, { status: 'starting', error: null, session: s.session + 1 })
    set(patch)
  },
  toggle: (f) => get().setFeature(f, !get()[f]),
  start: () => {
    const s = get()
    if ((s.hands || s.head) && (s.status === 'off' || s.status === 'error')) set({ status: 'starting', error: null, session: s.session + 1 })
  },
  stop: () => set({ hands: false, head: false, status: 'off', error: null, count: 0, face: false, gesture: 'none' }),
  setPreview: (preview) => {
    save('na:hands-preview', preview ? '1' : '0')
    set({ preview })
  },
  setHeadGain: (headGain) => {
    save('na:head-gain', String(headGain))
    set({ headGain })
  },
  recenter: () => set({ recenterTick: get().recenterTick + 1 }),
  report: (p) => {
    const s = get()
    if (Object.entries(p).some(([k, v]) => s[k as keyof HandsState] !== v)) set(p)
  },
}))

if (import.meta.env.DEV) (window as unknown as { __hands: typeof useHands }).__hands = useHands
