import { ChevronDown } from 'lucide-react'
import type { SystemId } from '@/data/types'
import { ALL_SYSTEM_IDS } from '@/data'
import { useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

const CORTEX: SystemId[] = ['telencephalon']
const DEEP: SystemId[] = ['diencephalon', 'brainstem', 'cerebellum', 'ventricles', 'white-matter', 'cranial-nerves']

const populated = (ids: SystemId[]) => ids.filter((id) => ALL_SYSTEM_IDS.includes(id))

/**
 * Left-edge pill of vertically-set visibility presets, with a chevron that
 * expands the full systems sheet — the rail is the shortcut, the sheet is
 * the whole list.
 */
export function SideRail() {
  const t = useT()
  const { visible, showOnly, panel, setPanel } = useAtlas()
  const open = panel === 'systems'
  const items: { key: string; label: string; ids: SystemId[] }[] = [
    { key: 'all', label: t.all, ids: ALL_SYSTEM_IDS },
    { key: 'cortex', label: t.cortex, ids: populated(CORTEX) },
    { key: 'deep', label: t.deep, ids: populated(DEEP) },
  ]
  const sameSet = (ids: SystemId[]) => ids.length === visible.length && ids.every((id) => visible.includes(id))
  return (
    <nav className="side-rail glass" aria-label={t.systems}>
      {items.map((item) => (
        <button key={item.key} className={`rail-item ${sameSet(item.ids) ? 'active' : ''}`} aria-pressed={sameSet(item.ids)} onClick={() => showOnly(item.ids)}>
          {item.label}
        </button>
      ))}
      <button className={`rail-expand ${open ? 'open' : ''}`} onClick={() => setPanel('systems')} aria-expanded={open} aria-label={t.systems} title={t.systems}>
        <ChevronDown size={16} />
      </button>
    </nav>
  )
}
