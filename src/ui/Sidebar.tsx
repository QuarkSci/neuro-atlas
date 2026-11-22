import { useCallback, useMemo, useRef, useState } from 'react'
import { ChevronRight, Eye, EyeOff, GraduationCap, ListChecks, ScanLine, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { ACTIVE_SYSTEMS, ALL_SYSTEM_IDS, LAYERS, LEAF_PARTS } from '@/data'
import { LESSON_BY_ID } from '@/data/lessons'
import { SECTION_BY_ID } from '@/data/sections'
import { TOPICS } from '@/data/topics'
import { BANK_TOPICS } from '@/quiz/engine'
import type { LayerId, SystemId } from '@/data/types'
import { useL, useT } from '@/i18n'
import { LAYER_COLORS } from '@/scene/materials'
import { useAtlas } from '@/store/useAtlas'
import { Mark } from './Header'
import { useLens } from './useLens'

/** Distance the sheet must be pulled down before release dismisses it (phone). */
const DISMISS_PX = 90

const CORTEX: SystemId[] = ['telencephalon']
const DEEP: SystemId[] = ['basal-ganglia', 'diencephalon', 'brainstem', 'cerebellum', 'ventricles', 'white-matter', 'cranial-nerves']
const populated = (ids: SystemId[]) => ids.filter((id) => ALL_SYSTEM_IDS.includes(id))

/**
 * iOS sheet behaviour for the phone layout: the grabber drags the sheet down
 * only, and a release past `DISMISS_PX` closes it instead of springing back.
 */
function useSheetDrag(onDismiss: () => void) {
  const [dy, setDy] = useState(0)
  const start = useRef<number | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.preventDefault()
    start.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (start.current === null) return
    setDy(Math.max(0, e.clientY - start.current))
  }, [])

  const end = useCallback(() => {
    if (start.current === null) return
    start.current = null
    setDy((d) => {
      if (d > DISMISS_PX) onDismiss()
      return 0
    })
  }, [onDismiss])

  return { dy, handleProps: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } }
}

/** Atlas tab: what is shown — quick sets, atlas layers, and every system with its switch. */
function AtlasList() {
  const t = useT()
  const l = useL()
  const { visible, layers, isolate, selected, toggleSystem, showOnly, toggleLayer } = useAtlas()
  const setsRef = useRef<HTMLDivElement>(null)
  const blobRef = useRef<HTMLSpanElement>(null)
  useLens(setsRef, blobRef, '.seg-item')
  const counts = useMemo(() => {
    const bySystem = Object.fromEntries(ACTIVE_SYSTEMS.map((s) => [s.id, 0])) as Record<SystemId, number>
    const byLayer = Object.fromEntries(LAYERS.map((l) => [l.id, 0])) as Record<LayerId, number>
    for (const p of LEAF_PARTS) {
      bySystem[p.system]++
      byLayer[p.layer]++
    }
    return { bySystem, byLayer }
  }, [])
  const visibleCount = LEAF_PARTS.filter((p) => (isolate ? selected.includes(p.id) : (visible.includes(p.system) && layers.includes(p.layer)) || selected.includes(p.id))).length
  const sets: { key: string; label: string; ids: SystemId[] }[] = [
    { key: 'all', label: t.all, ids: ALL_SYSTEM_IDS },
    { key: 'cortex', label: t.cortex, ids: populated(CORTEX) },
    { key: 'deep', label: t.deep, ids: populated(DEEP) },
  ]
  const sameSet = (ids: SystemId[]) => ids.length === visible.length && ids.every((id) => visible.includes(id))

  return (
    <>
      <div className="side-scroll">
        <h3 className="side-title">{t.quickSets}</h3>
        <div className="seg wide" role="group" aria-label={t.quickSets} ref={setsRef}>
          <span className="lens-blob" ref={blobRef} aria-hidden />
          {sets.map((s) => (
            <button key={s.key} className={`seg-item ${sameSet(s.ids) ? 'active' : ''}`} aria-pressed={sameSet(s.ids)} onClick={() => showOnly(s.ids)}>
              {s.label}
            </button>
          ))}
        </div>

        <h3 className="side-title">{t.layers}</h3>
        <div className="presets" role="group" aria-label={t.layers}>
          {LAYERS.map((layer) => (
            <button key={layer.id} aria-pressed={layers.includes(layer.id)} onClick={() => toggleLayer(layer.id)} title={`${layer.source} · ${layer.license}`}>
              <span className="layer-swatch" style={{ background: LAYER_COLORS[layer.id] }} />
              {layer.short ? l(layer.short) : l(layer.name).replace(/ .*/, '')} <span className="system-count">{counts.byLayer[layer.id]}</span>
            </button>
          ))}
        </div>

        <h3 className="side-title">{t.systems}</h3>
        <div className="system-list">
          {ACTIVE_SYSTEMS.map((s) => (
            <div className={`system-row ${visible.includes(s.id) ? 'enabled' : ''}`} key={s.id}>
              <button className="system-name" title={t.showOnly(l(s.name))} onClick={() => showOnly([s.id])}>
                <span className="system-dot" style={{ background: s.color }} />
                {l(s.name)}
                <span className="system-count">{counts.bySystem[s.id]}</span>
              </button>
              <Switch checked={visible.includes(s.id)} onCheckedChange={() => toggleSystem(s.id)} aria-label={t.show(l(s.name))} />
            </div>
          ))}
        </div>
      </div>
      <div className="panel-foot">
        <span>{t.visibleCount(visibleCount)}</span>
        <span className="foot-actions">
          <button onClick={() => showOnly(ALL_SYSTEM_IDS)} aria-label={t.showAll} title={t.showAll}>
            <Eye size={15} />
          </button>
          <button onClick={() => showOnly([])} aria-label={t.hideAll} title={t.hideAll}>
            <EyeOff size={15} />
          </button>
        </span>
      </div>
    </>
  )
}

/** Study tab: every topic, the open one unfolded into its 3D lessons and cross-section plates. */
function TopicList() {
  const t = useT()
  const l = useL()
  const { topic, lesson, sectionCut, setTopic, setLesson, openSection, openQuiz } = useAtlas()
  return (
    <div className="side-scroll">
      <h3 className="side-title">{t.lnTopics}</h3>
      <p className="side-hint">{t.lnHint}</p>
      <div className="topic-list">
        {TOPICS.map((tp) => {
          const on = topic === tp.id
          return (
            <div key={tp.id} className={`topic ${on ? 'open' : ''}`}>
              <button className="topic-head" aria-expanded={on} onClick={() => setTopic(on ? null : tp.id)}>
                <ChevronRight size={15} className="topic-caret" />
                <span className="topic-name">
                  <strong>{l(tp.title)}</strong>
                  <small>{l(tp.blurb)}</small>
                </span>
              </button>
              {on && (
                <div className="topic-body">
                  {tp.lessons.map((id) => {
                    const ls = LESSON_BY_ID.get(id)
                    return ls ? (
                      <button key={id} className={`topic-lesson ${lesson?.id === id ? 'active' : ''}`} onClick={() => setLesson(id)} title={l(ls.blurb)}>
                        <GraduationCap size={16} />
                        <span>
                          <strong>{l(ls.title)}</strong>
                          <small>
                            {t.ln3dLesson} · {t.lsSteps(ls.steps.length)}
                          </small>
                        </span>
                      </button>
                    ) : null
                  })}
                  {BANK_TOPICS.has(tp.id) && (
                    <button className="topic-lesson topic-quiz" onClick={() => openQuiz(tp.id)}>
                      <ListChecks size={16} />
                      <span>
                        <strong>{l({ en: 'Quiz', uz: 'Viktorina' })}</strong>
                        <small>{l({ en: '3 levels · review · Anki', uz: '3 daraja · takrorlash · Anki' })}</small>
                      </span>
                    </button>
                  )}
                  {tp.sections.length > 0 && (
                    <>
                      <div className="topic-sub">
                        <ScanLine size={13} /> {t.lnPlates}
                      </div>
                      <div className="topic-plates">
                        {tp.sections.map((id) => {
                          const s = SECTION_BY_ID.get(id)
                          return s ? (
                            <button key={id} className={`plate-row ${sectionCut === id ? 'active' : ''}`} onClick={() => openSection(id)}>
                              <span className="sv-code">{s.code}</span>
                              <span className="plate-name">{l(s.title)}</span>
                            </button>
                          ) : null
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The left sidebar (iPadOS pattern): the wordmark, then the contents of the
 * current tab — what the atlas shows, or the study topics. A floating glass
 * column on wide screens, a bottom sheet with a grabber on a phone.
 */
export function Sidebar() {
  const t = useT()
  const { sidebar, setSidebar, mode, setAboutOpen } = useAtlas()
  const close = useCallback(() => setSidebar(false), [setSidebar])
  const { dy, handleProps } = useSheetDrag(close)
  return (
    <aside
      className={`sidebar glass ${sidebar ? 'open' : ''} ${dy ? 'dragging' : ''}`}
      style={{ '--sheet-dy': `${dy}px` } as React.CSSProperties}
      aria-label={t.sidebar}
      aria-hidden={!sidebar}
    >
      <div className="sheet-grabber" {...handleProps} />
      <header className="side-head">
        <button className="side-mark" onClick={() => setAboutOpen(true)} aria-label={t.about} title={t.about}>
          <Mark />
        </button>
        <div className="side-brand">
          <strong>{t.title}</strong>
          <span>
            {t.metaPieces(LEAF_PARTS.length)} · {t.metaSpace}
          </span>
        </div>
        <button className="sheet-round" onClick={close} aria-label={t.close}>
          <X size={17} />
        </button>
      </header>
      {mode === 'learn' ? <TopicList /> : <AtlasList />}
    </aside>
  )
}
