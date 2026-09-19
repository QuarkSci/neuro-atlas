import { useAtlas } from '@/store/useAtlas'
import type { L10n } from '@/data/types'
import { STRINGS, type Strings } from './strings'

/** UI strings for the active language. */
export function useT(): Strings {
  const lang = useAtlas((s) => s.lang)
  return STRINGS[lang] as Strings
}

/** Resolve a catalogue field in the active language, falling back to English (the source atlases' language). */
export function useL() {
  const lang = useAtlas((s) => s.lang)
  return (text: L10n | undefined) => (text ? (text[lang] ?? text.en) : '')
}
