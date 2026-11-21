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

/**
 * A request from the AI tools to the plate viewer (AI-3): the viewer owns its
 * lesion state, so the tool leaves an order here and the viewer carries it out
 * once the plate it names is open. `plate: '*'` — whichever plate is open.
 */
export type PlateCommand =
  | { plate: string; kind: 'focal'; foci: FocalLesion[]; replace: boolean }
  | { plate: string; kind: 'territory'; lesion: Lesion }
  | { plate: string; kind: 'clear' }
  | { plate: string; kind: 'tab'; tab: PlateScreen['tab'] }

interface Screen {
  plate: PlateScreen | null
  mcExtra: McExtra | null
  command: PlateCommand | null
  setPlate: (p: PlateScreen | null) => void
  setMcExtra: (x: McExtra | null) => void
  setCommand: (c: PlateCommand | null) => void
}

export const useScreen = create<Screen>((set) => ({
  plate: null,
  mcExtra: null,
  command: null,
  setPlate: (plate) => set({ plate }),
  setCommand: (command) => set({ command }),
  setMcExtra: (mcExtra) => set({ mcExtra }),
}))
