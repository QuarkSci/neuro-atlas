/**
 * OP-1 EVD (ventriculostomy) UI shell (AG-15).
 *
 * Pure presentation layer over `EvdApi` / `EvdSnapshot` (implemented by CC in `session.ts`).
 * Contains no simulation or grading logic: every action delegates to `api`, every clinical
 * number/text comes from `data.ts` (sourced to `docs/research/procedures/evd.md`).
 */
import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, RotateCcw, Trash2, X } from 'lucide-react'
import { PART_BY_ID } from '@/data'
import { useAtlas, type Lang } from '@/store/useAtlas'
import { EVD_COMPLICATIONS, EVD_DISCLAIMER, EVD_KAKARLA_DESC, EVD_LANDMARKS, EVD_LEVELS, EVD_REFS, EVD_STEPS_DATA, EVD_STEP_BY_ID } from './data'
import { appendReport, clearHistory, competence, downloadCsv, historyToCsv, learningCurve, loadHistory, traceToCsv, type CurveMetric } from './history'
import { EVD_STRINGS } from './strings'
import type { EvdApi, EvdEvent, EvdHistoryRow, EvdLevel, EvdMetricScores, EvdReport, EvdSnapshot, PositionChecks, Side } from './types'

export interface EvdPanelProps {
  api: EvdApi
  onClose?: () => void
}

type TabId = 'procedure' | 'history' | 'reference'

const partName = (id: string, lang: Lang) => PART_BY_ID.get(id)?.name[lang] ?? PART_BY_ID.get(id)?.name.en ?? id
const fmt = (v: number | null | undefined, digits = 1, unit = '') => (v != null && Number.isFinite(v) ? `${v.toFixed(digits)}${unit ? ' ' + unit : ''}` : '—')

const kakarlaColor = (grade: number) => (grade === 1 ? '#34c759' : grade === 2 ? '#f2b51f' : '#ff6b5e')
const scoreColor = (score: 1 | 3 | 5) => (score === 5 ? '#34c759' : score === 3 ? '#f2b51f' : '#ff6b5e')

const cardStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 12,
  background: 'color-mix(in oklab, var(--ink) 6%, transparent)',
  border: '1px solid color-mix(in oklab, var(--ink) 10%, transparent)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const mutedStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'color-mix(in oklab, var(--ink) 60%, transparent)',
  lineHeight: 1.4,
}

/** LC-CUSUM trace S_t against the threshold h: the line crosses h when the evidence of competence is enough. */
function CusumSvg({ s, h, signalAt }: { s: readonly number[]; h: number; signalAt: number | null }) {
  const W = 256,
    H = 70,
    padL = 28,
    padR = 10,
    padT = 8,
    padB = 14
  const maxV = Math.max(h * 1.2, ...s, 1)
  const xAt = (i: number) => (s.length <= 1 ? (padL + W - padR) / 2 : padL + (i / (s.length - 1)) * (W - padL - padR))
  const yAt = (v: number) => padT + (1 - v / maxV) * (H - padT - padB)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="LC-CUSUM" style={{ display: 'block' }} data-testid="cusum">
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="currentColor" strokeOpacity={0.22} />
      <line x1={padL} y1={yAt(h)} x2={W - padR} y2={yAt(h)} stroke="#34c759" strokeOpacity={0.8} strokeDasharray="4 3" />
      <text x={padL - 4} y={yAt(h) + 3} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.6}>
        h
      </text>
      {s.length > 1 && (
        <polyline fill="none" stroke="currentColor" strokeOpacity={0.75} strokeWidth={1.6} points={s.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ')} />
      )}
      {s.map((v, i) => (
        <circle key={i} cx={xAt(i)} cy={yAt(v)} r={signalAt === i + 1 ? 3.6 : 2} fill={signalAt !== null && i + 1 >= signalAt ? '#34c759' : 'currentColor'} fillOpacity={0.85} />
      ))}
    </svg>
  )
}

function LearningCurveSvg({ rows, metric }: { rows: readonly EvdHistoryRow[]; metric: CurveMetric }) {
  const pts = learningCurve(rows, metric)
  if (pts.length === 0) return null
  const W = 256
  const H = 96
  const padL = 28
  const padR = 10
  const padT = 10
  const padB = 18
  const vals = pts.map((p) => p.value)
  const rawMin = Math.min(...vals)
  const rawMax = Math.max(...vals)
  const minV = metric === 'total' ? 1 : Math.min(0, rawMin)
  const maxV = metric === 'total' ? 5 : rawMax === minV ? rawMax + 1 : rawMax
  const xAt = (i: number) => (pts.length === 1 ? (padL + W - padR) / 2 : padL + (i / (pts.length - 1)) * (W - padL - padR))
  const yAt = (v: number) => padT + (1 - (v - minV) / (maxV - minV || 1)) * (H - padT - padB)
  const poly = pts.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Learning curve (${metric})`} style={{ display: 'block' }}>
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="currentColor" strokeOpacity={0.22} strokeWidth={1} />
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="currentColor" strokeOpacity={0.22} strokeWidth={1} />
      <text x={padL - 4} y={padT + 4} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.55}>
        {maxV.toFixed(metric === 'total' ? 0 : 1)}
      </text>
      <text x={padL - 4} y={H - padB} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.55}>
        {minV.toFixed(metric === 'total' ? 0 : 1)}
      </text>
      {pts.length > 1 && <polyline fill="none" stroke="currentColor" strokeOpacity={0.7} strokeWidth={1.6} points={poly} />}
      {pts.map((p, i) => (
        <circle key={p.timestamp} cx={xAt(i)} cy={yAt(p.value)} r={3.4} fill={kakarlaColor(p.kakarla)}>
          <title>{`#${p.index}: ${p.value} (Kakarla ${p.kakarla})`}</title>
        </circle>
      ))}
      <text x={W - padR} y={H - 4} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.5}>
        n = {pts.length}
      </text>
    </svg>
  )
}

function EventLine({ ev, lang }: { ev: EvdEvent; lang: Lang }) {
  const t = EVD_STRINGS[lang]
  let cls = 'tool-ev'
  let text = ''
  switch (ev.type) {
    case 'out-of-order':
      cls += ' hazard'
      text = `${t.evOutOfOrder}: ${EVD_STEP_BY_ID[ev.wanted].name[lang]}`
      break
    case 'pass-start':
      text = `${t.evPassStart} #${ev.pass}`
      break
    case 'csf':
      text = `${t.evCsf} (${fmt(ev.depthMm, 1, 'mm')})`
      break
    case 'overshoot':
      cls += ' hazard'
      text = `${t.evOvershoot} (${fmt(ev.depthMm, 1, 'mm')})`
      break
    case 'warn':
      cls += ' hazard'
      text = `${t.evWarn}: ${partName(ev.partId, lang)} (${fmt(ev.mm, 1, 'mm')})`
      break
    case 'collision':
      cls += ' hazard'
      text = `${t.evCollision}: ${partName(ev.partId, lang)}`
      break
    default:
      return null
  }
  return (
    <div className={cls}>
      <span>{ev.t.toFixed(1)} s</span> {text}
    </div>
  )
}

export function EvdPanel({ api, onClose }: EvdPanelProps) {
  const lang = useAtlas((s) => s.lang)
  const t = EVD_STRINGS[lang]

  const [snap, setSnap] = useState<EvdSnapshot>(() => api.snapshot())
  const [tab, setTab] = useState<TabId>('procedure')
  const [level, setLevel] = useState<EvdLevel>(1)
  const [side, setSide] = useState<Side>('right')
  const [laser, setLaser] = useState<boolean>(true)
  const [posChecks, setPosChecks] = useState<PositionChecks>({
    side: 'right',
    neutralHead: false,
    headUp30to45: false,
    coagAndAntibiotic: false,
  })
  const [history, setHistory] = useState<EvdHistoryRow[]>(() => loadHistory())
  const [curveMetric, setCurveMetric] = useState<CurveMetric>('total')
  const [copied, setCopied] = useState(false)
  const savedFinishedAt = useRef<string | null>(null)

  useEffect(() => api.subscribe(setSnap), [api])

  // Persist finished report once per unique timestamp.
  useEffect(() => {
    const rep = snap.report
    if (!snap.finished || !rep || savedFinishedAt.current === rep.finishedAt) return
    savedFinishedAt.current = rep.finishedAt
    setHistory(appendReport(rep))
  }, [snap.finished, snap.report])

  const pickLevel = (lv: EvdLevel) => {
    setLevel(lv)
    const def = EVD_LEVELS.find((d) => d.level === lv)
    if (def) setLaser(def.defaultLaser)
  }

  const handleBegin = () => {
    savedFinishedAt.current = null
    setPosChecks({ side, neutralHead: false, headUp30to45: false, coagAndAntibiotic: false })
    api.begin({ level, side, laser })
  }

  const handleConfirmPosition = () => {
    api.setPosition({ ...posChecks, side: snap.options.side })
    api.confirm('position')
  }

  const handleCopyCsv = async (rows: readonly EvdHistoryRow[]) => {
    try {
      await navigator.clipboard.writeText(historyToCsv(rows))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked */
    }
  }

  const handleDownloadHistoryCsv = (rows: readonly EvdHistoryRow[]) => {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`neuro-atlas-evd-history-${stamp}.csv`, historyToCsv(rows))
  }

  const handleDownloadTraceCsv = (report: EvdReport) => {
    const stamp = report.finishedAt.slice(0, 19).replace(/[:T]/g, '-')
    downloadCsv(`neuro-atlas-evd-trace-${stamp}.csv`, traceToCsv(report))
  }

  const activeDef = EVD_STEP_BY_ID[snap.step]
  const interestingEvents = snap.events.filter((e) => e.type !== 'step' && e.type !== 'pass-end' && e.type !== 'position' && e.type !== 'mark' && e.type !== 'finish')

  const segBtn = <V extends string | number>(value: V, cur: V, label: string, onPick: (v: V) => void) => (
    <button key={String(value)} className={cur === value ? 'active' : ''} aria-pressed={cur === value} onClick={() => onPick(value)} type="button">
      {label}
    </button>
  )

  return (
    <aside className="or-panel glass" aria-label={t.title} style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', width: 312 }}>
      <header className="or-head">
        <strong>{t.title}</strong>
        {snap.running && (
          <button className="or-close" onClick={() => api.reset()} aria-label={t.reset} title={t.reset} type="button">
            <RotateCcw size={14} />
          </button>
        )}
        {onClose && (
          <button className="or-close" onClick={onClose} aria-label={t.close} title={t.close} type="button">
            <X size={16} />
          </button>
        )}
      </header>

      <div className="seg" role="tablist" aria-label={t.title}>
        {segBtn<TabId>('procedure', tab, t.tabProcedure, setTab)}
        {segBtn<TabId>('history', tab, `${t.tabHistory}${history.length ? ` (${history.length})` : ''}`, setTab)}
        {segBtn<TabId>('reference', tab, t.tabReference, setTab)}
      </div>

      {/* ── TAB 1: PROCEDURE ───────────────────────────────────────── */}
      {tab === 'procedure' && (
        <>
          {!snap.running && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="or-row">
                <span className="or-label">{t.level}</span>
                <div className="seg" role="group" aria-label={t.level}>
                  {segBtn<EvdLevel>(1, level, '1', pickLevel)}
                  {segBtn<EvdLevel>(2, level, '2', pickLevel)}
                  {segBtn<EvdLevel>(3, level, '3', pickLevel)}
                </div>
              </div>
              {(() => {
                const lv = EVD_LEVELS.find((d) => d.level === level)
                return lv ? (
                  <div style={cardStyle}>
                    <strong style={{ fontSize: 12 }}>{lv.title[lang]}</strong>
                    <span style={mutedStyle}>{lv.summary[lang]}</span>
                  </div>
                ) : null
              })()}
              <div className="or-row">
                <span className="or-label">{t.side}</span>
                <div className="seg" role="group" aria-label={t.side}>
                  {segBtn<Side>('right', side, t.sideRight, setSide)}
                  {segBtn<Side>('left', side, t.sideLeft, setSide)}
                </div>
              </div>
              <div className="or-row">
                <button className={`or-chip ${laser ? 'on' : ''}`} aria-pressed={laser} onClick={() => setLaser(!laser)} type="button">
                  {t.laser}: {laser ? 'ON' : 'OFF'}
                </button>
                <button className="or-chip on" onClick={handleBegin} type="button" style={{ marginLeft: 'auto' }}>
                  {t.start}
                </button>
              </div>
            </div>
          )}

          {snap.running && !snap.finished && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* 9-step progress strip */}
              <div style={{ display: 'flex', gap: 3 }} aria-label="EVD steps">
                {snap.steps.map((rec, i) => {
                  const bg = rec.status === 'done' ? '#34c759' : rec.status === 'active' ? 'var(--ink)' : 'color-mix(in oklab, var(--ink) 16%, transparent)'
                  return <div key={rec.id} title={`${i + 1}. ${EVD_STEP_BY_ID[rec.id].name[lang]}`} style={{ flex: 1, height: 4, borderRadius: 99, background: bg }} />
                })}
              </div>

              {/* Active step card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                  <strong style={{ fontSize: 12.5 }}>
                    {activeDef.index}/{EVD_STEPS_DATA.length}. {activeDef.name[lang]}
                  </strong>
                  <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', opacity: 0.6 }}>{snap.elapsedS.toFixed(0)} s</span>
                </div>
                <p className="or-hint" style={{ fontSize: 11.5 }}>
                  {activeDef.instruction[lang]}
                </p>
                <div style={{ fontSize: 11, color: 'color-mix(in oklab, #d98a00 78%, var(--ink) 22%)', lineHeight: 1.35 }}>
                  <b>{t.mistakeLabel}:</b> {activeDef.mistake[lang]}
                </div>
                <div style={{ fontSize: 10, opacity: 0.55 }}>{activeDef.refs.map((id) => EVD_REFS[id].label).join(' · ')}</div>
              </div>

              {/* Step 1: position checklist */}
              {snap.step === 'position' && (
                <div style={cardStyle}>
                  <span style={mutedStyle}>{t.checkHint}</span>
                  {(
                    [
                      ['neutralHead', t.checkNeutral],
                      ['headUp30to45', t.checkElevation],
                      ['coagAndAntibiotic', t.checkCoag],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11.5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={posChecks[key]} onChange={(e) => setPosChecks((prev) => ({ ...prev, [key]: e.target.checked }))} />
                      <span>{label}</span>
                    </label>
                  ))}
                  <button
                    className="or-chip on"
                    type="button"
                    disabled={!(posChecks.neutralHead && posChecks.headUp30to45 && posChecks.coagAndAntibiotic)}
                    onClick={handleConfirmPosition}
                    style={{ alignSelf: 'flex-end', opacity: posChecks.neutralHead && posChecks.headUp30to45 && posChecks.coagAndAntibiotic ? 1 : 0.45 }}
                  >
                    <Check size={14} /> {t.confirmStep}
                  </button>
                </div>
              )}

              {/* Step 2: Kocher mark readout */}
              {snap.step === 'mark' && (
                <div style={cardStyle}>
                  {!snap.mark ? (
                    <span style={mutedStyle}>{t.markHint}</span>
                  ) : (
                    <>
                      <div className="tool-grid">
                        <span>{t.markError}</span>
                        <b className={snap.mark.onTarget ? '' : 'warn'}>{fmt(snap.mark.errorMm, 1, 'mm')}</b>
                        <span>{t.markLateral}</span>
                        <b>{fmt(snap.mark.lateralMm, 1, 'mm')}</b>
                        <span>{t.markAhead}</span>
                        <b>{fmt(snap.mark.aheadOfCoronalMm, 1, 'mm')}</b>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {snap.mark.onTarget && <span style={{ fontSize: 11, color: '#34c759', fontWeight: 600 }}>{t.markOnTarget}</span>}
                        {snap.mark.flags.map((f) => (
                          <span key={f} style={{ fontSize: 11, color: f === 'sinus' || f === 'motor' ? '#ff6b5e' : '#f2b51f', fontWeight: 600 }}>
                            {f === 'sinus' ? t.markFlagSinus : f === 'motor' ? t.markFlagMotor : f === 'wrong-side' ? t.markFlagSide : t.markFlagOff}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  <button
                    className="or-chip on"
                    type="button"
                    disabled={!snap.mark}
                    onClick={() => api.confirm('mark')}
                    style={{ alignSelf: 'flex-end', opacity: snap.mark ? 1 : 0.45 }}
                  >
                    <Check size={14} /> {t.confirmStep}
                  </button>
                </div>
              )}

              {/* Steps 3, 4, 5: confirm */}
              {(snap.step === 'incision' || snap.step === 'burr' || snap.step === 'dura') && (
                <button className="or-chip on" type="button" onClick={() => api.confirm(snap.step)} style={{ alignSelf: 'flex-end' }}>
                  <Check size={14} /> {t.confirmStep}
                </button>
              )}

              {/* Steps 6, 7, 8: live catheter telemetry + seat */}
              {(snap.step === 'insert' || snap.step === 'csf' || snap.step === 'seat') && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: snap.csf ? '#34c759' : 'color-mix(in oklab, var(--ink) 65%, transparent)',
                      }}
                    >
                      {snap.csf ? t.csfFlowing : t.csfWaiting}
                    </span>
                    <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                      {t.passes}: <b>{snap.passes}</b>
                    </span>
                  </div>
                  <div className="tool-grid">
                    <span>{t.depthTable}</span>
                    <b className={(snap.tip?.tableDepthMm ?? 0) > 70 ? 'bad' : ''}>{fmt(snap.tip?.tableDepthMm, 1, 'mm')}</b>
                    <span>{t.depthScalp}</span>
                    <b>{fmt(snap.tip?.scalpDepthMm, 1, 'mm')}</b>
                    <span>{t.distMonro}</span>
                    <b>{fmt(snap.tip?.monroMm, 1, 'mm')}</b>
                    <span>{t.angleIdeal}</span>
                    <b className={(snap.tip?.angleToIdealDeg ?? 0) > 10 ? 'warn' : ''}>{fmt(snap.tip?.angleToIdealDeg, 1, '°')}</b>
                    {snap.nearest && (
                      <>
                        <span>{t.nearestHazard}</span>
                        <b className={snap.nearest.mm < 2 ? 'bad' : snap.nearest.mm < 5 ? 'warn' : ''}>
                          {partName(snap.nearest.partId, lang)} · {fmt(snap.nearest.mm, 1, 'mm')}
                        </b>
                      </>
                    )}
                  </div>
                  <button className="or-chip on" type="button" disabled={!snap.tip} onClick={() => api.seat()} style={{ alignSelf: 'flex-end', opacity: snap.tip ? 1 : 0.45 }}>
                    <Check size={14} /> {t.seatBtn}
                  </button>
                </div>
              )}

              {/* Step 9: finish */}
              {snap.step === 'secure' && (
                <button className="or-chip on" type="button" onClick={() => api.finish()} style={{ alignSelf: 'flex-end' }}>
                  <Check size={14} /> {t.finishBtn}
                </button>
              )}

              {/* Recent events */}
              {interestingEvents.length > 0 && (
                <div className="tool-events" aria-label={t.eventsTitle}>
                  {interestingEvents
                    .slice(-4)
                    .reverse()
                    .map((ev, i) => (
                      <EventLine key={`${ev.t}-${ev.type}-${i}`} ev={ev} lang={lang} />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Finished report */}
          {snap.finished && snap.report && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 13 }}>{t.reportTitle}</strong>
                  <span style={{ fontWeight: 700, fontSize: 13, color: kakarlaColor(snap.report.metrics.kakarla.grade) }}>
                    {t.osatsMean}: {snap.report.total.toFixed(2)} / 5
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: kakarlaColor(snap.report.metrics.kakarla.grade) }}>
                  {EVD_KAKARLA_DESC[snap.report.metrics.kakarla.grade].title[lang]} ({snap.report.metrics.kakarla.percent}%)
                </div>
                <span style={mutedStyle}>{EVD_KAKARLA_DESC[snap.report.metrics.kakarla.grade].summary[lang]}</span>
                {snap.report.metrics.kakarla.why.map((w, i) => (
                  <span key={i} style={{ fontSize: 11, opacity: 0.8 }}>
                    • {w[lang]}
                  </span>
                ))}
                {snap.report.caps.length > 0 && (
                  <div style={{ fontSize: 11, color: '#ff6b5e', fontWeight: 600 }}>
                    {t.hardFails}: {snap.report.caps.map((c) => c[lang]).join(' · ')}
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <div className="tool-grid">
                  {(Object.keys(snap.report.scores) as (keyof EvdMetricScores)[]).map((k) => {
                    const ms = snap.report!.scores[k]
                    const displayVal = k === 'efficiency' ? `${(ms.value * 100).toFixed(0)}%` : Number.isInteger(ms.value) ? String(ms.value) : ms.value.toFixed(2)
                    return (
                      <div key={k} style={{ display: 'contents' }}>
                        <span>{t.metrics[k]}</span>
                        <b style={{ color: scoreColor(ms.score) }}>
                          {displayVal} · {ms.score}/5 ({ms.band[lang]})
                        </b>
                      </div>
                    )
                  })}
                  <span>{t.ghajarCompare}</span>
                  <b>{fmt(snap.report.metrics.angleVsGhajarDeg, 1, '°')}</b>
                  <span>{t.entryError}</span>
                  <b>{fmt(snap.report.metrics.entryErrMm, 1, 'mm')}</b>
                  <span>{t.seqErrors}</span>
                  <b>{snap.report.metrics.sequenceErrors}</b>
                  <span>{t.curveMetrics.ldj}</span>
                  <b>{fmt(snap.report.metrics.ldj, 1)}</b>
                </div>
              </div>

              <div className="or-row" style={{ flexWrap: 'wrap' }}>
                <button className="or-chip" type="button" onClick={() => handleCopyCsv(history.length ? history : [])}>
                  <Copy size={13} /> {copied ? t.copied : t.copyCsv}
                </button>
                <button className="or-chip" type="button" onClick={() => handleDownloadHistoryCsv(history)}>
                  <Download size={13} /> {t.downloadCsv}
                </button>
                <button className="or-chip" type="button" onClick={() => handleDownloadTraceCsv(snap.report!)}>
                  <Download size={13} /> {t.downloadTrace}
                </button>
                <button className="or-chip on" type="button" onClick={() => api.reset()} style={{ marginLeft: 'auto' }}>
                  <RotateCcw size={13} /> {t.newAttempt}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: HISTORY & LEARNING CURVE ────────────────────────── */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.length === 0 ? (
            <p className="or-hint">{t.historyEmpty}</p>
          ) : (
            <>
              <div style={cardStyle}>
                <div className="tool-grid">
                  <span>{t.sessionsCount}</span>
                  <b>{history.length}</b>
                  <span>{t.grade1Rate}</span>
                  <b>{Math.round((history.filter((r) => Number(r.kakarlaGrade) === 1).length / history.length) * 100)}%</b>
                  <span>{t.bestScore}</span>
                  <b>{Math.max(...history.map((r) => Number(r.total))).toFixed(2)} / 5</b>
                </div>
              </div>

              {(() => {
                const c = competence(history)
                return (
                  <div style={cardStyle}>
                    <strong style={{ fontSize: 12 }}>{t.cusumTitle}</strong>
                    <CusumSvg s={c.s} h={c.h} signalAt={c.signalAt} />
                    <span style={{ ...mutedStyle, color: c.signalAt !== null ? '#34c759' : undefined }}>
                      {c.signalAt !== null ? t.cusumCompetent(c.signalAt) : t.cusumProgress(c.current, c.h)}
                    </span>
                    <span style={mutedStyle}>{t.cusumHint}</span>
                  </div>
                )
              })()}

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <strong style={{ fontSize: 12 }}>{t.curveTitle}</strong>
                  <select
                    aria-label={t.curveTitle}
                    value={curveMetric}
                    onChange={(e) => setCurveMetric(e.target.value as CurveMetric)}
                    style={{
                      fontSize: 11,
                      background: 'color-mix(in oklab, var(--ink) 8%, transparent)',
                      color: 'inherit',
                      border: 'none',
                      borderRadius: 8,
                      padding: '2px 6px',
                    }}
                  >
                    {(Object.keys(t.curveMetrics) as CurveMetric[]).map((m) => (
                      <option key={m} value={m}>
                        {t.curveMetrics[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <LearningCurveSvg rows={history} metric={curveMetric} />
              </div>

              <div style={{ ...cardStyle, maxHeight: 140, overflowY: 'auto', gap: 4 }}>
                {history
                  .slice()
                  .reverse()
                  .map((row, i) => (
                    <div key={`${row.timestamp}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ opacity: 0.65 }}>{String(row.timestamp).slice(5, 16).replace('T', ' ')}</span>
                      <span>
                        <b style={{ color: kakarlaColor(Number(row.kakarlaGrade)) }}>G{row.kakarlaGrade}</b> · {Number(row.total).toFixed(2)} · {row.angleErrDeg}° ·{' '}
                        {row.tipToMonroMm} mm
                      </span>
                    </div>
                  ))}
              </div>

              <div className="or-row" style={{ flexWrap: 'wrap' }}>
                <button className="or-chip" type="button" onClick={() => handleCopyCsv(history)}>
                  <Copy size={13} /> {copied ? t.copied : t.copyCsv}
                </button>
                <button className="or-chip" type="button" onClick={() => handleDownloadHistoryCsv(history)}>
                  <Download size={13} /> {t.downloadCsv}
                </button>
                <button
                  className="or-chip"
                  type="button"
                  onClick={() => {
                    clearHistory()
                    setHistory([])
                  }}
                  style={{ marginLeft: 'auto' }}
                  aria-label={t.clearHistory}
                  title={t.clearHistory}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 3: CLINICAL REFERENCE (evd.md) ─────────────────────── */}
      {tab === 'reference' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={cardStyle}>
            <strong style={{ fontSize: 12 }}>{t.refLandmarks}</strong>
            <div className="tool-grid">
              <span>Nasion → AP</span>
              <b>
                {EVD_LANDMARKS.nasionPosteriorMm.value.min}–{EVD_LANDMARKS.nasionPosteriorMm.value.max} mm
              </b>
              <span>Coronal → AP</span>
              <b>
                {EVD_LANDMARKS.coronalAnteriorMm.value.min}–{EVD_LANDMARKS.coronalAnteriorMm.value.max} mm
              </b>
              <span>Midline → ML</span>
              <b>
                {EVD_LANDMARKS.midlineLateralMm.value.min}–{EVD_LANDMARKS.midlineLateralMm.value.max} mm
              </b>
              <span>Outer table depth</span>
              <b>
                {EVD_LANDMARKS.outerTableDepthMm.value.min}–{EVD_LANDMARKS.outerTableDepthMm.value.max} mm
              </b>
              <span>Ependymal pop</span>
              <b>
                {EVD_LANDMARKS.ependymalPopMm.value.min}–{EVD_LANDMARKS.ependymalPopMm.value.max} mm
              </b>
              <span>Red zone</span>
              <b className="bad">&gt; {EVD_LANDMARKS.redZoneDepthMm.value} mm</b>
            </div>
          </div>

          <div style={cardStyle}>
            <strong style={{ fontSize: 12 }}>{t.refAccessPoints}</strong>
            {EVD_LANDMARKS.accessPoints.map((ap) => (
              <div key={ap.id} style={{ fontSize: 11, lineHeight: 1.35 }}>
                <b>{ap.name[lang]}:</b> {ap.landmark[lang]} → {ap.target[lang]}
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <strong style={{ fontSize: 12 }}>{t.refComplications}</strong>
            {EVD_COMPLICATIONS.map((c) => (
              <div key={c.id} style={{ fontSize: 11, lineHeight: 1.35 }}>
                <b>{c.name[lang]}:</b> {c.rate.value[lang]} <span style={{ opacity: 0.6 }}>({c.refs.map((id) => EVD_REFS[id].label).join(', ')})</span>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <strong style={{ fontSize: 12 }}>{t.refSources}</strong>
            {Object.values(EVD_REFS).map((ref) => {
              const href = ref.doi ? `https://doi.org/${ref.doi}` : ref.id === 'statpearls-nbk545317' ? 'https://www.ncbi.nlm.nih.gov/books/NBK545317/' : undefined
              return (
                <div key={ref.id} style={{ fontSize: 10.5, lineHeight: 1.35, opacity: 0.8 }}>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {ref.label}
                    </a>
                  ) : (
                    <b>{ref.label}</b>
                  )}
                  : {ref.cite}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Training-only disclaimer (always visible, SURGERY.md §0.3) */}
      <p className="or-scale" role="note" style={{ borderTop: '1px solid color-mix(in oklab, var(--ink) 10%, transparent)', paddingTop: 6 }}>
        {EVD_DISCLAIMER.text[lang]}
      </p>
    </aside>
  )
}
