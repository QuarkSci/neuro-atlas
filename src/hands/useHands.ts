import { create } from 'zustand'

export type HandsStatus = 'off' | 'starting' | 'on' | 'error'
export type HandsError = 'denied' | 'nocam' | 'load'
/** What the hands are doing right now (drives the hint chip). */
export type Gesture = 'none' | 'point' | 'grab' | 'zoom'

export interface HandsState {
  status: HandsStatus
  error: HandsError | null
  /** Small mirrored camera picture in the corner. */
  preview: boolean
  /** Hands in view (0–2). */
  count: number
  gesture: Gesture
  /** Where frames come from: the webcam, or synthetic hands fed by headless checks. */
  source: 'camera' | 'synthetic'
  start: (source?: 'camera' | 'synthetic') => void
  stop: () => void
  toggle: () => void
  setPreview: (on: boolean) => void
  /** Engine → store; only changed fields. */
  report: (p: Partial<Pick<HandsState, 'status' | 'error' | 'count' | 'gesture'>>) => void
}

const loadPreview = () => {
  try {
    return localStorage.getItem('na:hands-preview') !== '0'
  } catch {
    return true
  }
}

/**
 * Hand tracking switch. Never on at load: the camera starts only when the
 * person asks for it, and stops when they switch it off or leave the page.
 */
export const useHands = create<HandsState>((set, get) => ({
  status: 'off',
  error: null,
  preview: loadPreview(),
  count: 0,
  gesture: 'none',
  source: 'camera',
  start: (source = 'camera') => {
    if (get().status === 'off' || get().status === 'error') set({ status: 'starting', error: null, source })
  },
  stop: () => set({ status: 'off', count: 0, gesture: 'none' }),
  toggle: () => (get().status === 'off' || get().status === 'error' ? get().start() : get().stop()),
  setPreview: (preview) => {
    try {
      localStorage.setItem('na:hands-preview', preview ? '1' : '0')
    } catch {
      /* private mode */
    }
    set({ preview })
  },
  report: (p) => {
    const s = get()
    if (Object.entries(p).some(([k, v]) => s[k as keyof HandsState] !== v)) set(p)
  },
}))

if (import.meta.env.DEV) (window as unknown as { __hands: typeof useHands }).__hands = useHands
