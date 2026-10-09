import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, ChevronsDownUp, ChevronsUpDown, GraduationCap, Lightbulb, Microscope, RotateCcw, X } from 'lucide-react'
import { PART_BY_ID } from '@/data'
import { LESSONS, LESSON_BY_ID } from '@/data/lessons'
import { SECTION_BY_ID } from '@/data/sections'
import { TOPIC_BY_ID } from '@/data/topics'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

/** Step dots under the stage: where you are in the lesson, tap to jump. */
export function LessonProgress() {
  const t = useT()
  const l = useL()
  const { lesson, setLessonStep, setLesson } = useAtlas()
  const ls = lesson ? LESSON_BY_ID.get(lesson.id) : undefined
  if (!lesson || !ls) return null
  return (
    <div className="lesson-progress glass">
      <button className="strip-btn" onClick={() => setLesson(null)} title={t.lsAll}>
        <BookOpen size={14} /> <span>{t.lsAll}</span>
      </button>
      <div className="lesson-dots" role="tablist" aria-label={l(ls.title)}>
        {ls.steps.map((st, i) => (
          <button key={i} role="tab" aria-selected={i === lesson.step} className={`lesson-dot ${i === lesson.step ? 'on' : i < lesson.step ? 'done' : ''} ${st.quiz ? 'quiz' : ''}`} onClick={() => setLessonStep(i)} title={l(st.title)}>
            {st.quiz ? <GraduationCap size={12} /> : i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * The lesson card beside the 3D stage: what you are looking at, an analogy
 * to remember it by, the clinical / research depth, and a tap-the-model quiz
 * at the end. ← → step through it.
 */
export function LessonPanel() {
  const t = useT()
  const l = useL()
  const { mode, lesson, lessonPick, topic, setLessonStep, setLesson, setLessonPick, openSection } = useAtlas()
  const ls = mode === 'learn' && lesson ? LESSON_BY_ID.get(lesson.id) : undefined
  const step = ls && lesson ? ls.steps[lesson.step] : undefined
  const body = useRef<HTMLDivElement>(null)
  const [deepOpen, setDeepOpen] = useState(false)
  // Folded down to title + buttons, so a phone screen is left to the model.
  const [folded, setFolded] = useState(false)
  const fold = () => {
    setFolded((v) => !v)
    // Let the panel resize, then have the camera refit into the freed space.
    requestAnimationFrame(() => useAtlas.setState((s) => ({ resetTick: s.resetTick + 1 })))
  }
  // Quiz state, reset whenever the step changes.
  const [q, setQ] = useState(0)
  const [score, setScore] = useState(0)
  const [verdict, setVerdict] = useState<{ ok: boolean; name: string } | null>(null)
  const stepKey = lesson ? `${lesson.id}:${lesson.step}` : ''

  useEffect(() => {
    setQ(0)
    setScore(0)
    setVerdict(null)
    setDeepOpen(false)
    body.current?.scrollTo({ top: 0 })
  }, [stepKey])

  // A tap on the model: grade it in a quiz, otherwise just name it.
  useEffect(() => {
    if (!lessonPick || !step) return
    const part = PART_BY_ID.get(lessonPick.id)
    if (!part) return
    const name = l(part.name)
    const quiz = step.quiz
    if (!quiz || q >= quiz.length) {
      setVerdict({ ok: true, name })
      return
    }
    const ok = quiz[q].answer.includes(part.concept)
    setVerdict({ ok, name })
    if (ok) {
      setScore((s) => s + 1)
      const id = window.setTimeout(() => {
        setQ((n) => n + 1)
        setVerdict(null)
        setLessonPick(null)
      }, 1100)
      return () => window.clearTimeout(id)
    }
    // Only the pick tick re-runs this; the question index is read as of the tap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonPick?.tick])

  useEffect(() => {
    if (!ls || !lesson) return
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (typing) return
      if (e.key === 'ArrowRight' && lesson.step < ls.steps.length - 1) setLessonStep(lesson.step + 1)
      else if (e.key === 'ArrowLeft' && lesson.step > 0) setLessonStep(lesson.step - 1)
      else if (e.key === 'Escape') setLesson(null)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [ls, lesson, setLessonStep, setLesson])

  if (!ls || !lesson || !step) return null
  const last = lesson.step === ls.steps.length - 1
  const next = LESSONS[LESSONS.indexOf(ls) + 1]
  const quiz = step.quiz
  const quizDone = quiz && q >= quiz.length
  const plate = step.section ? SECTION_BY_ID.get(step.section) : undefined
  const topicPlates = last ? (TOPIC_BY_ID.get(topic ?? '')?.sections ?? []).map((id) => SECTION_BY_ID.get(id)).filter((s) => !!s) : []

  return (
    <aside className={`lesson-panel glass ${folded ? 'folded' : ''}`} aria-label={l(ls.title)}>
      <header className="lesson-head">
        <div>
          <span className="lesson-eyebrow">
            {l(ls.title)} · {lesson.step + 1}/{ls.steps.length}
          </span>
          <h2>{l(step.title)}</h2>
        </div>
        <div className="lesson-head-btns">
          <button className="icon-button" onClick={fold} aria-label={folded ? t.lsUnfold : t.lsFold} title={folded ? t.lsUnfold : t.lsFold} aria-expanded={!folded}>
            {folded ? <ChevronsUpDown size={16} /> : <ChevronsDownUp size={16} />}
          </button>
          <button className="icon-button" onClick={() => setLesson(null)} aria-label={t.lsAll} title={t.lsAll}>
            <X size={16} />
          </button>
        </div>
      </header>
      <div className="lesson-body" ref={body}>
        <p className="lesson-text">{l(step.text)}</p>

        {quiz && (
          <div className="lesson-quiz">
            {!quizDone ? (
              <>
                <div className="quiz-count">
                  {t.lsQuestion} {q + 1}/{quiz.length} · {t.lsScore} {score}
                </div>
                <div className="quiz-ask">{l(quiz[q].ask)}</div>
                {verdict ? (
                  <div className={`quiz-verdict ${verdict.ok ? 'ok' : 'bad'}`}>{verdict.ok ? <><Check size={14} /> {t.lsRight}: {verdict.name}</> : <>{t.lsWrong(verdict.name)}</>}</div>
                ) : (
                  <div className="quiz-hint">{t.lsTapHint}</div>
                )}
              </>
            ) : (
              <div className="quiz-result">
                <strong>
                  {t.lsResult} {score}/{quiz.length}
                </strong>
                <span>{score === quiz.length ? t.lsPerfect : t.lsAgainHint}</span>
                <button className="strip-btn" onClick={() => { setQ(0); setScore(0); setVerdict(null) }}>
                  <RotateCcw size={14} /> {t.lsRetry}
                </button>
              </div>
            )}
          </div>
        )}

        {!quiz && verdict && (
          <div className="lesson-pick">
            {t.lsTapped}: <strong>{verdict.name}</strong>
          </div>
        )}

        {plate && (
          <button className="lesson-plate" onClick={() => openSection(plate.id)}>
            <span className="sv-code">{plate.code}</span>
            <span>
              <strong>{t.lnSeePlate}</strong>
              <small>{l(plate.title)}</small>
            </span>
          </button>
        )}

        {step.memo && (
          <div className="lesson-memo">
            <span className="lesson-box-title">
              <Lightbulb size={14} /> {t.lsMemo}
            </span>
            <p>{l(step.memo)}</p>
          </div>
        )}

        {step.deep && (
          <div className={`lesson-deep ${deepOpen ? 'open' : ''}`}>
            <button className="lesson-box-title" onClick={() => setDeepOpen((v) => !v)} aria-expanded={deepOpen}>
              <Microscope size={14} /> {t.lsDeep}
              <ChevronDown size={14} className="chev" />
            </button>
            {deepOpen && <p>{l(step.deep)}</p>}
          </div>
        )}

        {topicPlates.length > 0 && (
          <div className="lesson-plates">
            <span>{t.lnPlatesTopic}</span>
            <div>
              {topicPlates.map((s) => (
                <button key={s!.id} className="sv-chip" onClick={() => openSection(s!.id)} title={l(s!.title)}>
                  {s!.code}
                </button>
              ))}
            </div>
          </div>
        )}

        {last && (
          <div className="lesson-sources">
            <span>{t.sources}</span>
            {ls.sources.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                {s.title} <ArrowUpRight size={11} />
              </a>
            ))}
          </div>
        )}
      </div>
      <footer className="lesson-nav">
        <button className="strip-btn" disabled={lesson.step === 0} onClick={() => setLessonStep(lesson.step - 1)}>
          <ArrowLeft size={14} /> {t.lsPrev}
        </button>
        {!last ? (
          <button className="strip-btn accent" onClick={() => setLessonStep(lesson.step + 1)}>
            {t.lsNext} <ArrowRight size={14} />
          </button>
        ) : next ? (
          <button className="strip-btn accent" onClick={() => setLesson(next.id)}>
            {t.lsNextLesson} <ArrowRight size={14} />
          </button>
        ) : (
          <button className="strip-btn accent" onClick={() => setLesson(null)}>
            {t.lsAll}
          </button>
        )}
      </footer>
    </aside>
  )
}
