import { create } from 'zustand'
import type { LayerId, SystemId } from '@/data/types'
import { ALL_SYSTEM_IDS, LAYER_BY_ID } from '@/data'

export type Lang = 'en' | 'uz'
export type View = 'three-quarter' | 'lateral' | 'front' | 'top'
export type Panel = 'systems' | 'search' | null
/** Which slider the bottom dock drives. */
export type Mode = 'explode' | 'peel'
export type Focus = { kind: 'concept'; id: string } | { kind: 'part'; id: string }

/**
 * Global UI + scene state. The scene modes `explode`, `isolate` and `cutaway`
 * are mutually exclusive; every action that turns one on clears the others
 * by hand (there is no central reducer), so keep that in mind when adding a
 * mode.
 */
export interface AtlasState {
  lang: Lang
  /** Systems currently shown. */
  visible: SystemId[]
  /** Atlas layers currently shown (independent of systems). */
  layers: LayerId[]
  /** Selected part ids (a concept may select several). */
  selected: string[]
  /** What the inspector describes: a concept, a single part, or a group. */
  focus: Focus | null
  isolate: boolean
  explode: number
  mode: Mode
  /** Depth of the peel: 0 shows every shell, 1 only the innermost. Exclusive with explode/isolate. */
  peel: number
  view: View
  autoRotate: boolean
  /** Whether a vertical wedge is clipped away to reveal interiors. */
  cutaway: boolean
  /** Azimuth of the cut, in degrees around the vertical axis. */
  cutawayAngle: number
  /** Bumped to force a camera re-fit. */
  resetTick: number
  panel: Panel
  inspectorOpen: boolean
  aboutOpen: boolean
  hovered: string | null
  progress: number
  error: string

  setLang: (l: Lang) => void
  toggleSystem: (id: SystemId) => void
  showOnly: (ids: SystemId[]) => void
  toggleLayer: (id: LayerId) => void
  setLayers: (ids: LayerId[]) => void
  selectParts: (ids: string[], focus: Focus | null) => void
  clearSelection: () => void
  setIsolate: (v: boolean) => void
  setExplode: (v: number) => void
  setMode: (m: Mode) => void
  setPeel: (v: number) => void
  setView: (v: View) => void
  setAutoRotate: (v: boolean) => void
  setCutaway: (v: boolean) => void
  setCutawayAngle: (deg: number) => void
  setPanel: (p: Panel) => void
  setInspectorOpen: (v: boolean) => void
  setAboutOpen: (v: boolean) => void
  setHovered: (id: string | null) => void
  setProgress: (n: number) => void
  setError: (s: string) => void
  reset: () => void
}

const initialLang = (): Lang => {
  try {
    const saved = localStorage.getItem('na:lang')
    if (saved === 'uz' || saved === 'en') return saved
  } catch {}
  return navigator.language?.toLowerCase().startsWith('uz') ? 'uz' : 'en'
}

/** The skull and dura wrap everything else, so they start hidden. */
const DEFAULT_VISIBLE = ALL_SYSTEM_IDS.filter((id) => id !== 'skull' && id !== 'meninges')

const sceneDefaults = {
  visible: DEFAULT_VISIBLE,
  // Gross anatomy only; parcellations tile the same cortex and are opted into.
  layers: ['gross'] as LayerId[],
  selected: [] as string[],
  focus: null as Focus | null,
  isolate: false,
  explode: 0,
  mode: 'explode' as Mode,
  peel: 0,
  view: 'three-quarter' as View,
  autoRotate: false,
  cutaway: false,
  cutawayAngle: 200,
  panel: null as Panel,
  inspectorOpen: false,
  hovered: null as string | null,
}

export const useAtlas = create<AtlasState>((set) => ({
  lang: initialLang(),
  ...sceneDefaults,
  resetTick: 0,
  aboutOpen: false,
  progress: 0,
  error: '',

  setLang: (lang) => {
    try {
      localStorage.setItem('na:lang', lang)
    } catch {}
    set({ lang })
  },
  toggleSystem: (id) =>
    set((s) => ({
      visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id],
      selected: [],
      focus: null,
      isolate: false,
      inspectorOpen: false,
    })),
  showOnly: (ids) => set({ visible: ids, selected: [], focus: null, isolate: false, inspectorOpen: false }),
  toggleLayer: (id) =>
    set((s) => ({
      // Cortical parcellations tile the same surface, so switching one on
      // replaces whichever other parcellation was showing.
      layers: s.layers.includes(id)
        ? s.layers.filter((x) => x !== id)
        : [...s.layers.filter((x) => !(LAYER_BY_ID.get(id)?.parcellation && LAYER_BY_ID.get(x)?.parcellation)), id],
      selected: [],
      focus: null,
      isolate: false,
      inspectorOpen: false,
    })),
  setLayers: (layers) => set({ layers, selected: [], focus: null, isolate: false, inspectorOpen: false }),
  selectParts: (ids, focus) => set({ selected: ids, focus, isolate: false, inspectorOpen: ids.length > 0, panel: null, autoRotate: false }),
  clearSelection: () => set({ selected: [], focus: null, isolate: false, inspectorOpen: false }),
  setIsolate: (isolate) => set({ isolate, explode: 0, peel: 0 }),
  setExplode: (explode) => set((s) => ({ explode, peel: 0, autoRotate: false, view: explode > 0.8 ? 'front' : s.view })),
  setMode: (mode) => set({ mode, explode: 0, peel: 0 }),
  setPeel: (peel) => set({ peel: Math.max(0, Math.min(1, peel)), explode: 0, isolate: false }),
  setView: (view) => set((s) => ({ view, resetTick: s.resetTick + 1, autoRotate: false })),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setCutaway: (cutaway) => set({ cutaway, autoRotate: false }),
  setCutawayAngle: (cutawayAngle) => set({ cutawayAngle }),
  setPanel: (panel) => set((s) => ({ panel: s.panel === panel ? null : panel, inspectorOpen: panel ? false : s.inspectorOpen })),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setAboutOpen: (aboutOpen) => set({ aboutOpen, panel: null, inspectorOpen: false }),
  setHovered: (hovered) => set({ hovered }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  reset: () => set((s) => ({ ...sceneDefaults, resetTick: s.resetTick + 1 })),
}))

if (import.meta.env.DEV) (window as unknown as { __atlas: typeof useAtlas }).__atlas = useAtlas
