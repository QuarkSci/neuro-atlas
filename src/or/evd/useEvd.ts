import { create } from 'zustand'

/** Whether the EVD panel is open (the session itself lives in `EvdLink`, created with the operating room). */
export const useEvd = create<{ open: boolean; set: (open: boolean) => void }>((set) => ({ open: false, set: (open) => set({ open }) }))

if (import.meta.env.DEV) (window as unknown as { __evdUi: typeof useEvd }).__evdUi = useEvd
