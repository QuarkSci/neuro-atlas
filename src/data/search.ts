import { CONCEPTS, PART_BY_ID, PARTS, conceptLeafIds, leafIds } from '.'
import type { L10n, Part, SystemId } from './types'

/**
 * Name search over every concept (left + right pairs) and part, in English,
 * Uzbek and Latin, with aliases — shared by the search panel and the AI
 * tutor's `find_structure` tool.
 */
export type SearchResult = { kind: 'concept' | 'part'; id: string; name: L10n; system: SystemId; count: number }

export const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ʼ’‘`]/g, "'")
    .replace(/o'/g, 'o')
    .replace(/g'/g, 'g')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()

interface Indexed {
  result: SearchResult
  hay: string
  primary: string[]
}

const names = (n: L10n) => [n.en, n.uz ?? '', n.la ?? ''].filter(Boolean)

function buildIndex(): Indexed[] {
  const out: Indexed[] = []
  for (const c of CONCEPTS) {
    if (c.parts.length < 2) continue
    const first = PART_BY_ID.get(c.parts[0])
    if (!first) continue
    const members = c.parts.map((id) => PART_BY_ID.get(id)).filter((p): p is Part => !!p)
    out.push({
      result: { kind: 'concept', id: c.id, name: c.name, system: first.system, count: conceptLeafIds(c.id).length },
      hay: normalise([...names(c.name), ...(c.aliases ?? []), ...members.flatMap((m) => names(m.name))].join(' ')),
      primary: [...names(c.name), ...(c.aliases ?? [])].map(normalise),
    })
  }
  for (const p of PARTS) {
    out.push({
      result: { kind: 'part', id: p.id, name: p.name, system: p.system, count: leafIds(p.id).length },
      hay: normalise([...names(p.name), p.id, p.ref ?? ''].join(' ')),
      primary: names(p.name).map(normalise),
    })
  }
  return out
}

export const INDEX = buildIndex()

/** Best matches for a query, most relevant first; `name` breaks ties by length in the reader's language. */
export function searchAtlas(query: string, name: (n: L10n) => string = (n) => n.en, limit = 60): SearchResult[] {
  const q = normalise(query)
  if (!q) return []
  const terms = q.split(/\s+/)
  const scored = INDEX.map((x) => {
    let s = 0
    for (const term of terms) {
      if (!x.hay.includes(term)) return { x, s: -1 }
      if (x.primary.some((p) => p.startsWith(term))) s += 3
      else if (x.primary.some((p) => p.includes(term))) s += 2
      else s += 1
    }
    if (x.result.kind === 'concept') s += 0.5
    return { x, s }
  })
  return scored
    .filter((r) => r.s >= 0)
    .sort((a, b) => b.s - a.s || name(a.x.result.name).length - name(b.x.result.name).length)
    .map((r) => r.x.result)
    .slice(0, limit)
}

/** The mesh ids a result selects (a concept: both sides' leaves). */
export const resultLeaves = (r: SearchResult) => (r.kind === 'concept' ? conceptLeafIds(r.id) : leafIds(r.id))
