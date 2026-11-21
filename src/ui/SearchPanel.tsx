import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { SYSTEM_BY_ID, conceptLeafIds, leafIds } from '@/data'
import { INDEX, normalise, searchAtlas, type SearchResult } from '@/data/search'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

const FEATURED = ['precentral-gyrus', 'hippocampus-proper', 'thalamus', 'amygdala', 'cerebellum', 'corpus-callosum', 'j-area-4a-precg', 'j-area-hoc1-v1-17-calcs']

type Result = SearchResult

export function SearchPanel() {
  const t = useT()
  const l = useL()
  const { setPanel, selectParts } = useAtlas()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => input.current?.focus(), [])

  const results = useMemo<Result[]>(() => {
    const q = normalise(query)
    if (!q) return FEATURED.map((id) => INDEX.find((x) => x.result.id === id)?.result).filter((r): r is Result => !!r)
    return searchAtlas(query, l)
  }, [query, l])

  useEffect(() => setCursor(0), [results])

  const choose = (r: Result) => {
    if (r.kind === 'concept') selectParts(conceptLeafIds(r.id), { kind: 'concept', id: r.id })
    else selectParts(leafIds(r.id), { kind: 'part', id: r.id })
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setPanel(null)
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && results[cursor]) choose(results[cursor])
  }

  return (
    <section className="search-panel glass" aria-label={t.findPart}>
      <div className="panel-heading">
        <span>{t.findPart}</span>
        <button className="icon-button" onClick={() => setPanel(null)} aria-label={t.close}>
          <X size={18} />
        </button>
      </div>
      <div className="search-input">
        <Search size={15} style={{ opacity: 0.5 }} />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchAria}
          role="combobox"
          aria-expanded
          aria-controls="search-results"
          aria-activedescendant={results[cursor] ? `sr-${results[cursor].kind}-${results[cursor].id}` : undefined}
        />
      </div>
      <div className="search-results" id="search-results" role="listbox">
        {results.length === 0 && <div className="search-empty">{t.noMatches}</div>}
        {results.map((r, i) => {
          const system = SYSTEM_BY_ID.get(r.system)
          return (
            <button
              key={`${r.kind}-${r.id}`}
              id={`sr-${r.kind}-${r.id}`}
              role="option"
              aria-selected={i === cursor}
              className="search-result"
              onMouseEnter={() => setCursor(i)}
              onClick={() => choose(r)}
            >
              <span>
                {l(r.name)}
                <span className="sub">
                  {system && <span className="system-dot" style={{ background: system.color, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />}
                  {system ? l(system.name) : ''}
                  {r.kind === 'concept' && <span className="kind-badge">{t.conceptBadge}</span>}
                </span>
              </span>
              <span className="small-number">
                {r.count} {r.count === 1 ? t.piece : t.pieces}
              </span>
            </button>
          )
        })}
      </div>
      <p className="search-note">{query ? t.searchHintQuery : t.searchHint}</p>
    </section>
  )
}
