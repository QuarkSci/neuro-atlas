import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Check, Download, ExternalLink, ListChecks, RotateCcw, ScanLine, X } from 'lucide-react'
import { CONCEPT_BY_ID, PART_BY_ID, conceptLeafIds, leafIds } from '@/data'
import { SECTION_BY_ID, STRUCTURE_BY_ID } from '@/data/sections'
import { TOPIC_BY_ID } from '@/data/topics'
import type { L10n } from '@/data/types'
import { useL } from '@/i18n'
import { downloadAnki, type AnkiCard } from '@/quiz/anki'
import {
  LEVELS,
  loadBank,
  loadStats,
  pickDeck,
  progress,
  record,
  rng,
  saveStats,
  summarise,
  toCard,
  type Answer,
  type Card,
  type Level,
  type Mode,
  type RawQuestion,
  type Stats,
} from '@/quiz/engine'
import { useAtlas } from '@/store/useAtlas'

const TX = {
  title: { en: 'Quiz', uz: 'Viktorina' },
  close: { en: 'Close', uz: 'Yopish' },
  level: { en: 'Level', uz: 'Daraja' },
  all: { en: 'All', uz: 'Hammasi' },
  count: { en: 'Questions', uz: 'Savollar soni' },
  mode: { en: 'Mode', uz: 'Rejim' },
  mixed: { en: 'New and due', uz: 'Yangi va takrorlash' },
  weak: { en: 'My mistakes', uz: 'Xatolarim' },
  weakNone: { en: 'No open mistakes yet', uz: "Hali ochiq xato yo'q" },
  start: { en: 'Start', uz: 'Boshlash' },
  noDeck: { en: 'Nothing to ask with these settings', uz: "Bu sozlamada savol yo'q" },
  student: { en: 'Student', uz: 'Talaba' },
  resident: { en: 'Resident', uz: 'Rezident' },
  expert: { en: 'Expert (clinical)', uz: 'Ekspert (klinik)' },
  mastered: { en: 'mastered', uz: "o'zlashtirilgan" },
  open: { en: 'open mistakes', uz: 'ochiq xato' },
  sure: { en: "I'm sure", uz: 'Ishonchim komil' },
  sureHint: {
    en: 'Mark before you answer: the result compares how sure you were with how right you were.',
    uz: "Javobdan oldin belgilang: natijada ishonchingiz bilan to'g'riligingiz taqqoslanadi.",
  },
  right: { en: 'Correct', uz: "To'g'ri" },
  wrong: { en: 'Not quite', uz: "Noto'g'ri" },
  why: { en: 'Why', uz: 'Nega' },
  show3d: { en: 'Show in 3D', uz: "3D da ko'rsat" },
  plate: { en: 'Show the plate', uz: "Plastinkada ko'rsat" },
  next: { en: 'Next', uz: 'Keyingisi' },
  finish: { en: 'Results', uz: 'Natija' },
  back: { en: 'Back to the quiz', uz: 'Viktorinaga qaytish' },
  score: { en: 'Score', uz: 'Natija' },
  byLevel: { en: 'By level', uz: 'Daraja bo‘yicha' },
  calib: { en: 'Calibration', uz: 'Kalibratsiya' },
  weakRefs: { en: 'Structures to revisit', uz: 'Qayta ko‘rib chiqiladigan tuzilmalar' },
  again: { en: 'Redo the mistakes', uz: 'Xatolarni qayta' },
  restart: { en: 'New round', uz: 'Yangi tur' },
  ankiMissed: { en: 'Anki: mistakes', uz: 'Anki: xatolar' },
  ankiAll: { en: 'Anki: all', uz: 'Anki: hammasi' },
  ankiHow: { en: 'Anki → File → Import → this file (front, back, tags).', uz: 'Anki → File → Import → shu fayl (savol, javob, teglar).' },
  loading: { en: 'Loading questions…', uz: 'Savollar yuklanmoqda…' },
  sources: { en: 'Sources', uz: 'Manbalar' },
  keys: { en: '1–4 answer · Enter next · Esc close', uz: '1–4 javob · Enter keyingisi · Esc yopish' },
} satisfies Record<string, L10n>

const LETTER = ['A', 'B', 'C', 'D']
const COUNTS = [10, 20, 0] // 0 = every question available

/** What a quiz reference points at: a concept, a part, or a schematic structure's concept. */
function conceptOf(ref: string): string | null {
  if (CONCEPT_BY_ID.has(ref)) return ref
  const s = STRUCTURE_BY_ID.get(ref)?.part
  if (s && CONCEPT_BY_ID.has(s)) return s
  const p = PART_BY_ID.get(ref)
  return p && CONCEPT_BY_ID.has(p.concept) ? p.concept : null
}
const nameOf = (ref: string): L10n | undefined => CONCEPT_BY_ID.get(ref)?.name ?? PART_BY_ID.get(ref)?.name ?? STRUCTURE_BY_ID.get(ref)?.name

export function QuizPanel() {
  const topicId = useAtlas((s) => s.quizTopic)
  return topicId ? <Quiz key={topicId} topicId={topicId} /> : null
}

type Phase = 'setup' | 'ask' | 'done'

function Quiz({ topicId }: { topicId: string }) {
  const l = useL()
  const { openQuiz, openSection, selectParts } = useAtlas()
  const topic = TOPIC_BY_ID.get(topicId)
  const [bank, setBank] = useState<RawQuestion[] | null>(null)
  const [stats, setStats] = useState<Stats>(loadStats)
  const [phase, setPhase] = useState<Phase>('setup')
  const [level, setLevel] = useState<Level | 'all'>('all')
  const [count, setCount] = useState(10)
  const [mode, setMode] = useState<Mode>('mixed')
  const [deck, setDeck] = useState<Card[]>([])
  const [at, setAt] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [sure, setSure] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [peek, setPeek] = useState(false)

  useEffect(() => {
    let live = true
    loadBank(topicId).then((b) => live && setBank(b))
    return () => {
      live = false
    }
  }, [topicId])

  const prog = useMemo(() => (bank ? progress(bank, stats) : null), [bank, stats])
  const levelCount = useCallback((lv: Level | 'all') => (bank ?? []).filter((q) => lv === 'all' || q.level === lv).length, [bank])
  const preview = useMemo(() => (bank ? pickDeck(bank, { level, count: count || 9999, mode }, stats, rng(1)).length : 0), [bank, level, count, mode, stats])

  const begin = (cards: Card[]) => {
    setDeck(cards)
    setAt(0)
    setPicked(null)
    setSure(false)
    setAnswers([])
    setPhase('ask')
  }
  const start = () => bank && begin(pickDeck(bank, { level, count: count || 9999, mode }, stats, rng(Date.now())))

  const card = deck[at]
  const answer = useCallback(
    (shown: number) => {
      if (!card || picked !== null) return
      const ok = shown === card.correct
      setPicked(shown)
      setStats((s) => {
        const next = record(s, card.raw.id, ok)
        saveStats(next)
        return next
      })
      setAnswers((a) => [...a, { id: card.raw.id, level: card.raw.level, ok, sure, refs: card.raw.refs }])
    },
    [card, picked, sure],
  )
  const next = useCallback(() => {
    if (picked === null) return
    if (at + 1 >= deck.length) setPhase('done')
    else {
      setAt(at + 1)
      setPicked(null)
      setSure(false)
    }
  }, [picked, at, deck.length])

  useEffect(() => {
    if (peek) return
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // A plate opened from a question sits on top and takes its own Escape.
        if (useAtlas.getState().sectionId) return
        openQuiz(null)
      } else if (phase === 'ask' && /^[1-4]$/.test(e.key) && !e.metaKey && !e.ctrlKey) answer(+e.key - 1)
      else if (phase === 'ask' && (e.key === 'Enter' || e.key === ' ') && picked !== null && !(e.target instanceof HTMLButtonElement && e.key === 'Enter')) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [phase, picked, answer, next, openQuiz, peek])

  const show3d = (refs: string[]) => {
    const concept = refs.map(conceptOf).find((c) => c && conceptLeafIds(c).length)
    if (concept) {
      selectParts(conceptLeafIds(concept), { kind: 'concept', id: concept })
      setPeek(true)
      return
    }
    const part = refs.find((r) => PART_BY_ID.has(r))
    if (part) {
      selectParts(leafIds(part), { kind: 'part', id: part })
      setPeek(true)
    }
  }

  const summary = useMemo(() => summarise(answers), [answers])
  const cardOf = (id: string) => deck.find((c) => c.raw.id === id)
  const ankiFor = (ids: string[]): AnkiCard[] =>
    ids.flatMap((id) => {
      const c = cardOf(id) ?? (bank ? bank.filter((q) => q.id === id).map((q) => toCard(q, () => 0))[0] : undefined)
      if (!c) return []
      const r = c.raw
      const sources = (r.sources ?? []).map((s) => s.title).join('; ')
      return [{ front: l(r.q), back: `${l(r.options[r.answer])} — ${l(r.why)}${sources ? ` [${sources}]` : ''}`, tags: `neuro-atlas ${r.topic} ${r.level}` }]
    })
  const missedIds = answers.filter((a) => !a.ok).map((a) => a.id)

  if (peek)
    return (
      <button className="qz-return glass" onClick={() => setPeek(false)}>
        <ListChecks size={15} /> {l(TX.back)}
      </button>
    )

  return (
    <div className="section-viewer qz" role="dialog" aria-modal="true" aria-label={l(TX.title)} onClick={() => openQuiz(null)}>
      <div className="qz-card sv-card glass" onClick={(e) => e.stopPropagation()}>
        <header className="qz-head">
          <ListChecks size={18} />
          <div className="sv-heading">
            <h2>
              {l(TX.title)} · {topic ? l(topic.title) : topicId}
            </h2>
            {phase === 'ask' && (
              <p>
                {at + 1} / {deck.length} · {l(TX[card.raw.level])}
              </p>
            )}
          </div>
          <button className="sv-icon" onClick={() => openQuiz(null)} aria-label={l(TX.close)}>
            <X size={17} />
          </button>
        </header>
        {phase === 'ask' && <div className="qz-bar" style={{ ['--p' as string]: `${((at + (picked !== null ? 1 : 0)) / deck.length) * 100}%` }} />}

        <div className="qz-body">
          {!bank || !prog ? (
            <p className="qz-muted">{l(TX.loading)}</p>
          ) : phase === 'setup' ? (
            <div className="qz-setup">
              <p className="qz-muted">
                {prog.total} · {prog.mastered} {l(TX.mastered)} · {prog.open} {l(TX.open)}
              </p>
              <div className="qz-group">
                <span>{l(TX.level)}</span>
                {(['all', ...LEVELS] as const).map((lv) => (
                  <button key={lv} className={`sv-chip ${level === lv ? 'active' : ''}`} onClick={() => setLevel(lv)}>
                    {l(lv === 'all' ? TX.all : TX[lv])} <em>{levelCount(lv)}</em>
                  </button>
                ))}
              </div>
              <div className="qz-group">
                <span>{l(TX.count)}</span>
                {COUNTS.map((c) => (
                  <button key={c} className={`sv-chip ${count === c ? 'active' : ''}`} onClick={() => setCount(c)}>
                    {c || l(TX.all)}
                  </button>
                ))}
              </div>
              <div className="qz-group">
                <span>{l(TX.mode)}</span>
                <button className={`sv-chip ${mode === 'mixed' ? 'active' : ''}`} onClick={() => setMode('mixed')}>
                  {l(TX.mixed)}
                </button>
                <button className={`sv-chip ${mode === 'weak' ? 'active' : ''}`} onClick={() => setMode('weak')}>
                  {l(TX.weak)} <em>{prog.open}</em>
                </button>
              </div>
              <button className="qz-primary" onClick={start} disabled={preview === 0}>
                {l(TX.start)} · {Math.min(preview, count || preview)}
              </button>
              {preview === 0 && <p className="qz-muted">{mode === 'weak' ? l(TX.weakNone) : l(TX.noDeck)}</p>}
            </div>
          ) : phase === 'ask' && card ? (
            <div className="qz-ask">
              <h3 className="qz-q">{l(card.raw.q)}</h3>
              <label className={`qz-sure ${sure ? 'on' : ''} ${picked !== null ? 'locked' : ''}`} title={l(TX.sureHint)}>
                <input type="checkbox" checked={sure} disabled={picked !== null} onChange={(e) => setSure(e.target.checked)} /> {l(TX.sure)}
              </label>
              <div className="qz-options">
                {card.order.map((oi, shown) => {
                  const state = picked === null ? '' : shown === card.correct ? 'right' : shown === picked ? 'wrong' : 'dim'
                  return (
                    <button key={oi} className={`qz-opt ${state}`} disabled={picked !== null} onClick={() => answer(shown)}>
                      <b>{LETTER[shown]}</b>
                      <span>{l(card.raw.options[oi])}</span>
                      {state === 'right' && <Check size={16} />}
                    </button>
                  )
                })}
              </div>
              {picked !== null && (
                <div className={`qz-reveal ${picked === card.correct ? 'ok' : 'no'}`}>
                  <strong>{picked === card.correct ? l(TX.right) : l(TX.wrong)}</strong>
                  <p>
                    <b>{l(TX.why)}: </b>
                    {l(card.raw.why)}
                  </p>
                  {card.raw.sources && card.raw.sources.length > 0 && (
                    <p className="qz-src">
                      {l(TX.sources)}:{' '}
                      {card.raw.sources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noreferrer">
                          {s.title} <ExternalLink size={10} />
                        </a>
                      ))}
                    </p>
                  )}
                  <div className="qz-actions">
                    {card.raw.refs.some((r) => conceptOf(r) || PART_BY_ID.has(r)) && (
                      <button className="sv-3d" onClick={() => show3d(card.raw.refs)}>
                        <Box size={14} /> {l(TX.show3d)}
                      </button>
                    )}
                    {card.raw.plate && SECTION_BY_ID.has(card.raw.plate) && (
                      <button className="sv-3d" onClick={() => openSection(card.raw.plate!)}>
                        <ScanLine size={14} /> {l(TX.plate)} · {SECTION_BY_ID.get(card.raw.plate)!.code}
                      </button>
                    )}
                    <button className="qz-primary" onClick={next}>
                      {at + 1 >= deck.length ? l(TX.finish) : l(TX.next)}
                    </button>
                  </div>
                </div>
              )}
              <p className="qz-keys">{l(TX.keys)}</p>
            </div>
          ) : (
            <Results
              summary={summary}
              missed={missedIds.length}
              onAgain={() => bank && begin(missedIds.map((id) => deck.find((c) => c.raw.id === id)!).map((c) => toCard(c.raw, rng(Date.now() + at))))}
              onRestart={() => setPhase('setup')}
              onAnki={(ids) => downloadAnki(`Neuro Atlas — ${topic ? l(topic.title) : topicId}`, ankiFor(ids))}
              missedIds={missedIds}
              allIds={answers.map((a) => a.id)}
              onRef={(r) => {
                const c = conceptOf(r)
                if (c) {
                  selectParts(conceptLeafIds(c), { kind: 'concept', id: c })
                  setPeek(true)
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

function Results({
  summary,
  missed,
  onAgain,
  onRestart,
  onAnki,
  missedIds,
  allIds,
  onRef,
}: {
  summary: ReturnType<typeof summarise>
  missed: number
  onAgain: () => void
  onRestart: () => void
  onAnki: (ids: string[]) => void
  missedIds: string[]
  allIds: string[]
  onRef: (ref: string) => void
}) {
  const l = useL()
  const { sure, unsure } = summary
  const overconfident = sure.n - sure.ok
  return (
    <div className="qz-done">
      <div className="qz-score">
        <strong>
          {summary.right}/{summary.total}
        </strong>
        <span>{pct(summary.right, summary.total)}%</span>
      </div>
      <div className="qz-block">
        <h4>{l(TX.byLevel)}</h4>
        {LEVELS.filter((lv) => summary.byLevel[lv].n > 0).map((lv) => (
          <div className="qz-row" key={lv}>
            <span>{l(TX[lv])}</span>
            <i style={{ ['--p' as string]: `${pct(summary.byLevel[lv].ok, summary.byLevel[lv].n)}%` }} />
            <em>
              {summary.byLevel[lv].ok}/{summary.byLevel[lv].n}
            </em>
          </div>
        ))}
      </div>
      <div className="qz-block">
        <h4>{l(TX.calib)}</h4>
        <p className="qz-muted">
          {l(TX.sure)}: {sure.ok}/{sure.n} ({pct(sure.ok, sure.n)}%) · {l({ en: 'not sure', uz: 'ishonchsiz' })}: {unsure.ok}/{unsure.n} ({pct(unsure.ok, unsure.n)}%)
          {overconfident > 0 && (
            <>
              {' · '}
              {l({
                en: `${overconfident} confident answer(s) were wrong — the dangerous kind of mistake`,
                uz: `${overconfident} ta ishonchli javob noto‘g‘ri edi — eng xavfli xato turi`,
              })}
            </>
          )}
        </p>
      </div>
      {summary.weakRefs.length > 0 && (
        <div className="qz-block">
          <h4>{l(TX.weakRefs)}</h4>
          <div className="qz-refs">
            {summary.weakRefs.slice(0, 12).map((w) => {
              const n = nameOf(w.ref)
              return n ? (
                <button key={w.ref} className="sv-chip" onClick={() => onRef(w.ref)} title={l({ en: 'Show in 3D', uz: "3D da ko'rsat" })}>
                  {l(n)} <em>×{w.misses}</em>
                </button>
              ) : null
            })}
          </div>
        </div>
      )}
      <div className="qz-actions">
        {missed > 0 && (
          <button className="qz-primary" onClick={onAgain}>
            <RotateCcw size={14} /> {l(TX.again)} · {missed}
          </button>
        )}
        <button className="sv-3d" onClick={onRestart}>
          {l(TX.restart)}
        </button>
        {missed > 0 && (
          <button className="sv-3d" onClick={() => onAnki(missedIds)}>
            <Download size={14} /> {l(TX.ankiMissed)}
          </button>
        )}
        <button className="sv-3d" onClick={() => onAnki(allIds)}>
          <Download size={14} /> {l(TX.ankiAll)}
        </button>
      </div>
      <p className="qz-keys">{l(TX.ankiHow)}</p>
    </div>
  )
}
