import type { L10n } from '@/data/types'

/** Topic quiz engine: banks, shuffling, spaced repetition and session analysis. Pure logic, no React. */

export type Level = 'student' | 'resident' | 'expert'
export const LEVELS: Level[] = ['student', 'resident', 'expert']

export interface RawQuestion {
  id: string
  level: Level
  topic: string
  type: 'mcq'
  q: L10n
  options: L10n[]
  /** Index of the right option in `options` (the banks keep it at 0; the engine shuffles). */
  answer: number
  why: L10n
  /** Concept / part / schematic-structure ids the question is about. */
  refs: string[]
  plate?: string
  sources?: { title: string; url: string }[]
}

/** A question as asked: options in a shuffled order. */
export interface Card {
  raw: RawQuestion
  /** Indices into `raw.options`, in display order. */
  order: number[]
  /** Display position of the right option. */
  correct: number
}

const banks = import.meta.glob<RawQuestion[]>('/src/data/quiz/*.json', { import: 'default' })

/** Topics that have a question bank (file name = topic id). */
export const BANK_TOPICS = new Set(Object.keys(banks).map((p) => p.replace(/^.*\/(.+)\.json$/, '$1')))

const cache = new Map<string, RawQuestion[]>()
export async function loadBank(topic: string): Promise<RawQuestion[]> {
  const hit = cache.get(topic)
  if (hit) return hit
  const load = banks[`/src/data/quiz/${topic}.json`]
  const bank = load ? await load() : []
  cache.set(topic, bank)
  return bank
}

// ── Random numbers ───────────────────────────────────────────────────

/** Seeded generator (mulberry32): the same seed gives the same deck, so a session can be reproduced. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(list: T[], rnd: () => number): T[] {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function toCard(raw: RawQuestion, rnd: () => number): Card {
  const order = shuffle(
    raw.options.map((_, i) => i),
    rnd,
  )
  return { raw, order, correct: order.indexOf(raw.answer) }
}

// ── Spaced repetition (Leitner boxes) ────────────────────────────────

export interface Stat {
  /** Times asked / times wrong. */
  n: number
  w: number
  /** Leitner box 0–3: a miss sends the question back to 0, a hit moves it up. */
  box: number
  /** Last asked, ms since epoch. */
  last: number
}
export type Stats = Record<string, Stat>

const DAY = 86_400_000
/** Days a question rests in each box before it is due again. */
export const REST = [0, 1, 3, 7]

export const isDue = (s: Stat | undefined, now: number) => !s || now - s.last >= REST[Math.min(s.box, 3)] * DAY

export function record(stats: Stats, id: string, ok: boolean, now = Date.now()): Stats {
  const s = stats[id] ?? { n: 0, w: 0, box: 0, last: 0 }
  return { ...stats, [id]: { n: s.n + 1, w: s.w + (ok ? 0 : 1), box: ok ? Math.min(3, s.box + 1) : 0, last: now } }
}

export type Mode = 'mixed' | 'weak'

export interface DeckOptions {
  level: Level | 'all'
  count: number
  mode: Mode
}

/**
 * The questions to ask. `mixed`: due and unseen questions first (unseen before due-again, oldest first),
 * then anything else to fill the count. `weak`: only what was missed and has not been put right yet
 * (box below 2), most-missed first.
 */
export function pickDeck(bank: RawQuestion[], o: DeckOptions, stats: Stats, rnd: () => number, now = Date.now()): Card[] {
  const pool = bank.filter((q) => o.level === 'all' || q.level === o.level)
  let chosen: RawQuestion[]
  if (o.mode === 'weak') {
    chosen = pool.filter((q) => (stats[q.id]?.w ?? 0) > 0 && (stats[q.id]?.box ?? 0) < 2).sort((a, b) => stats[b.id].w - stats[a.id].w || stats[a.id].last - stats[b.id].last)
  } else {
    const unseen = shuffle(
      pool.filter((q) => !stats[q.id]),
      rnd,
    )
    const due = pool.filter((q) => stats[q.id] && isDue(stats[q.id], now)).sort((a, b) => stats[a.id].last - stats[b.id].last)
    const rest = shuffle(
      pool.filter((q) => stats[q.id] && !isDue(stats[q.id], now)),
      rnd,
    )
    chosen = [...unseen, ...due, ...rest]
  }
  // Within the count the order is shuffled again so levels and topics are not asked in blocks.
  return shuffle(chosen.slice(0, o.count), rnd).map((q) => toCard(q, rnd))
}

// ── Session analysis ─────────────────────────────────────────────────

export interface Answer {
  id: string
  level: Level
  ok: boolean
  /** The student marked the answer as a sure one before seeing the result. */
  sure: boolean
  refs: string[]
}

export interface Summary {
  total: number
  right: number
  byLevel: Record<Level, { n: number; ok: number }>
  /** Calibration: accuracy when "sure" against when not, and how many "sure" answers were wrong. */
  sure: { n: number; ok: number }
  unsure: { n: number; ok: number }
  /** Structures behind the missed questions, most-missed first. */
  weakRefs: { ref: string; misses: number }[]
}

export function summarise(answers: Answer[]): Summary {
  const byLevel = { student: { n: 0, ok: 0 }, resident: { n: 0, ok: 0 }, expert: { n: 0, ok: 0 } }
  const sure = { n: 0, ok: 0 }
  const unsure = { n: 0, ok: 0 }
  const miss = new Map<string, number>()
  for (const a of answers) {
    byLevel[a.level].n++
    if (a.ok) byLevel[a.level].ok++
    const c = a.sure ? sure : unsure
    c.n++
    if (a.ok) c.ok++
    if (!a.ok) for (const r of a.refs) miss.set(r, (miss.get(r) ?? 0) + 1)
  }
  return {
    total: answers.length,
    right: answers.filter((a) => a.ok).length,
    byLevel,
    sure,
    unsure,
    weakRefs: [...miss].map(([ref, misses]) => ({ ref, misses })).sort((a, b) => b.misses - a.misses),
  }
}

// ── Persistence ──────────────────────────────────────────────────────

const KEY = 'na:quiz'
export function loadStats(): Stats {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return s && typeof s === 'object' ? s : {}
  } catch {
    return {}
  }
}
export function saveStats(s: Stats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Private mode or full storage: the quiz still works, it just forgets.
  }
}

/** How many of a topic's questions are mastered (box 2 or 3), and how many are missed and still open. */
export function progress(bank: RawQuestion[], stats: Stats) {
  let mastered = 0
  let open = 0
  for (const q of bank) {
    const s = stats[q.id]
    if (s && s.box >= 2) mastered++
    if (s && s.w > 0 && s.box < 2) open++
  }
  return { total: bank.length, mastered, open }
}
