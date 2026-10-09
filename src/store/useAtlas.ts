import { create } from 'zustand'
import type { LayerId, SystemId } from '@/data/types'
import { ALL_SYSTEM_IDS, LAYER_BY_ID } from '@/data'

export type Lang = 'en' | 'uz'
export type View = 'three-quarter' | 'lateral' | 'front' | 'top'
export type Panel = 'systems' | 'search' | null
/** Which control the bottom dock shows: explode slider, peel slider or the cross-section atlas. */
export type Mode = 'explode' | 'peel' | 'sections' | 'lessons'
export type Focus = { kind: 'concept'; id: string } | { kind: 'part'; id: string }

/** One of the three orthogonal cross-section planes. */
export type ClipAxis = 'sagittal' | 'coronal' | 'axial'
export interface ClipState {
  enabled: boolean
  /** MNI mm along the plane's axis (x for sagittal, y for coronal, z for axial). */
  mm: number
  /** Which half is removed; the scene decides the concrete side per axis. */
  flip: boolean
}

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
  /** Master switch for the cross-section planes below (the "Kesim" panel). */
  cutaway: boolean
  /** Sagittal (x), coronal (y) and axial (z) clip planes, each independently toggled. */
  clip: Record<ClipAxis, ClipState>
  /** Cross-section schematic open in the viewer (see data/sections), or null. */
  sectionId: string | null
  /** Section whose oblique plane currently cuts the 3D model, or null. */
  sectionCut: string | null
  /** Systems shown before entering the sections mode, restored on leaving it. */
  sectionsPrevVisible: SystemId[] | null
  /** Guided 3D lesson in progress (see data/lessons), or null for the lesson list. */
  lesson: { id: string; step: number } | null
  /** Structure the student last tapped during a lesson (quiz answers, "what was that?"). */
  lessonPick: { id: string; tick: number } | null
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
  setClipAxis: (axis: ClipAxis, patch: Partial<ClipState>) => void
  /** Jumps to a classic teaching cross-section: axial clip only, at this MNI z. */
  jumpToLevel: (mm: number) => void
  /** Opens (or closes, with null) the cross-section viewer. */
  openSection: (id: string | null) => void
  /** Starts a lesson at its first step, or (null) returns to the lesson list. */
  setLesson: (id: string | null) => void
  setLessonStep: (step: number) => void
  setLessonPick: (id: string | null) => void
  /** Cuts the 3D model along a section's plane (null removes the cut). */
  cutSection: (id: string | null, layers?: LayerId[]) => void
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
  clip: {
    sagittal: { enabled: true, mm: 0, flip: false },
    coronal: { enabled: false, mm: 0, flip: false },
    axial: { enabled: false, mm: 0, flip: false },
  } as Record<ClipAxis, ClipState>,
  panel: null as Panel,
  inspectorOpen: false,
  hovered: null as string | null,
  sectionId: null as string | null,
  sectionCut: null as string | null,
  sectionsPrevVisible: null as SystemId[] | null,
  lesson: null as { id: string; step: number } | null,
  lessonPick: null as { id: string; tick: number } | null,
}

/** Systems that make sense around brainstem / diencephalon cross-sections. */
const SECTION_SYSTEMS: SystemId[] = ['basal-ganglia', 'brainstem', 'diencephalon', 'cerebellum']

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
  setMode: (mode) =>
    set((s) => {
      if (mode === s.mode) return {}
      const base = { mode, explode: 0, peel: 0, isolate: false, lesson: null, lessonPick: null }
      // Entering the section atlas: show the deep structures the level
      // markers sit on, from the side where the brainstem levels read best.
      if (mode === 'sections')
        return { ...base, sectionsPrevVisible: s.visible, visible: SECTION_SYSTEMS.filter((id) => ALL_SYSTEM_IDS.includes(id)), cutaway: false, view: 'lateral' as View, resetTick: s.resetTick + 1, selected: [], focus: null, inspectorOpen: false, autoRotate: false }
      // Leaving it: drop the cut and hand back whatever was shown before.
      if (s.mode === 'sections') return { ...base, sectionCut: null, sectionId: null, visible: s.sectionsPrevVisible ?? s.visible, sectionsPrevVisible: null, resetTick: s.resetTick + 1 }
      return base
    }),
  openSection: (sectionId) => set({ sectionId, panel: null }),
  setLesson: (id) =>
    set((s) => ({
      lesson: id ? { id, step: 0 } : null,
      lessonPick: null,
      mode: 'lessons' as Mode,
      selected: [],
      focus: null,
      inspectorOpen: false,
      panel: null,
      cutaway: false,
      autoRotate: false,
      explode: 0,
      peel: 0,
      isolate: false,
      // Back to the list: frame the whole brain again.
      ...(id ? {} : { view: 'three-quarter' as View, resetTick: s.resetTick + 1 }),
    })),
  setLessonStep: (step) => set((s) => (s.lesson ? { lesson: { ...s.lesson, step }, lessonPick: null, selected: [], focus: null, inspectorOpen: false } : {})),
  setLessonPick: (id) => set((s) => ({ lessonPick: id ? { id, tick: (s.lessonPick?.tick ?? 0) + 1 } : null })),
  cutSection: (sectionCut, layers) =>
    set((s) => ({
      sectionCut,
      sectionId: null,
      cutaway: false,
      isolate: false,
      explode: 0,
      peel: 0,
      autoRotate: false,
      selected: [],
      focus: null,
      inspectorOpen: false,
      layers: layers ? [...new Set([...s.layers.filter((x) => !(LAYER_BY_ID.get(x)?.parcellation && layers.some((y) => LAYER_BY_ID.get(y)?.parcellation))), ...layers])] : s.layers,
      // A null cut returns to the overview of all level markers.
      ...(sectionCut ? {} : { view: 'lateral' as View, resetTick: s.resetTick + 1 }),
    })),
  setPeel: (peel) => set({ peel: Math.max(0, Math.min(1, peel)), explode: 0, isolate: false }),
  setView: (view) => set((s) => ({ view, resetTick: s.resetTick + 1, autoRotate: false })),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  // Turning the panel on must leave at least one plane active, or nothing
  // would visibly change; turning it off leaves the per-axis toggles alone
  // (BrainScene treats !cutaway as "ignore clip entirely" either way) so
  // reopening the panel remembers what was on.
  setCutaway: (cutaway) =>
    set((s) => ({
      cutaway,
      sectionCut: cutaway ? null : s.sectionCut,
      autoRotate: false,
      clip: cutaway && !s.clip.sagittal.enabled && !s.clip.coronal.enabled && !s.clip.axial.enabled ? { ...s.clip, sagittal: { ...s.clip.sagittal, enabled: true } } : s.clip,
    })),
  setClipAxis: (axis, patch) => set((s) => ({ clip: { ...s.clip, [axis]: { ...s.clip[axis], ...patch } } })),
  jumpToLevel: (mm) =>
    set((s) => ({
      cutaway: true,
      clip: {
        sagittal: { ...s.clip.sagittal, enabled: false },
        coronal: { ...s.clip.coronal, enabled: false },
        axial: { enabled: true, mm, flip: false },
      },
      isolate: false,
      explode: 0,
      peel: 0,
      // Lateral, not top: a horizontal (axial) cut is only visible in
      // profile — viewed from directly above it looks unchanged.
      view: 'lateral',
      resetTick: s.resetTick + 1,
      autoRotate: false,
    })),
  setPanel: (panel) => set((s) => ({ panel: s.panel === panel ? null : panel, inspectorOpen: panel ? false : s.inspectorOpen })),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  setAboutOpen: (aboutOpen) => set({ aboutOpen, panel: null, inspectorOpen: false }),
  setHovered: (hovered) => set({ hovered }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  reset: () => set((s) => ({ ...sceneDefaults, lesson: s.lesson, mode: s.mode === 'sections' || s.mode === 'lessons' ? s.mode : 'explode', visible: s.mode === 'sections' ? s.visible : sceneDefaults.visible, sectionsPrevVisible: s.sectionsPrevVisible, view: s.mode === 'sections' ? 'lateral' : sceneDefaults.view, resetTick: s.resetTick + 1 })),
}))

if (import.meta.env.DEV) (window as unknown as { __atlas: typeof useAtlas }).__atlas = useAtlas
