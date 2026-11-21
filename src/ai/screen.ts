import { create } from 'zustand'
import type { Lesion } from '@/data/lesions'
import type { FocalLesion } from '@/ui/lesionFocal'
import type { McExtra } from '@/ui/mcdonald'

/**
 * What the plate viewer shows, published for the AI context (AI-2). The
 * viewer keeps this state locally (it is UI state, not app state); it mirrors
 * it here so the tutor can read "the plate I'm looking at", the structure
 * picked on it and the lesions placed on it, without the viewer knowing
 * anything about AI.
 */
export interface PlateScreen {
  plate: string
  tab: 'structures' | 'level' | 'lesion'
  view: string
  /** Structure picked on the drawn plate (section structure id). */
  picked: string | null
  /** Region picked on the atlas / real cut (part id). */
  atlasPicked: string | null
  lesionMode: 'zone' | 'point'
  lesion: Lesion
  foci: FocalLesion[]
  activeFocus: number
  now: number | null
}

interface Screen {
  plate: PlateScreen | null
  mcExtra: McExtra | null
  setPlate: (p: PlateScreen | null) => void
  setMcExtra: (x: McExtra | null) => void
}

export const useScreen = create<Screen>((set) => ({
  plate: null,
  mcExtra: null,
  setPlate: (plate) => set({ plate }),
  setMcExtra: (mcExtra) => set({ mcExtra }),
}))
