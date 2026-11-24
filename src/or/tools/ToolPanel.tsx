import { useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { PART_BY_ID } from '@/data'
import { useAtlas } from '@/store/useAtlas'
import { OR_STRINGS } from '../strings'
import { activeTools } from '../orMode'
import { WARN_MM, CONTACT_MM } from './engine'
import { DrillPanel } from '../drill/DrillPanel'
import { useTool, type ToolId } from './useTool'

const nameOf = (id: string | null, lang: 'en' | 'uz') =>
  id ? (id === 'scalp' ? (lang === 'uz' ? 'Bosh terisi' : 'Scalp') : (PART_BY_ID.get(id)?.name[lang] ?? PART_BY_ID.get(id)?.name.en ?? id)) : '—'
const mm = (v: number) => (isFinite(v) ? `${v.toFixed(1)} mm` : '—')

/** Instrument rows of the operating-room panel: tool choice, readouts, events, trajectory. */
export function ToolPanel() {
  const lang = useAtlas((s) => s.lang)
  const t = OR_STRINGS[lang]
  const tool = useTool((s) => s.tool)
  const lock = useTool((s) => s.lock)
  const depth = useTool((s) => s.depth)
  const r = useTool((s) => s.readout)
  const events = useTool((s) => s.events)
  const rec = useTool((s) => s.rec)
  const samples = useTool((s) => s.samples)
  const pathMm = useTool((s) => s.pathMm)
  const maxDepth = useTool((s) => s.maxDepthMm)
  const minHaz = useTool((s) => s.minHazardMm)
  const set = useTool((s) => s.set)
  const [copied, setCopied] = useState(false)
  const pick = (v: ToolId, label: string) => (
    <button className={tool === v ? 'active' : ''} aria-pressed={tool === v} onClick={() => set({ tool: v })} type="button">
      {label}
    </button>
  )
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(activeTools()?.csv() ?? '')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <>
      <div className="or-row">
        <span className="or-label">{t.tool}</span>
        <div className="seg" role="group" aria-label={t.tool}>
          {pick('off', t.toolOff)}
          {pick('probe', t.probe)}
          {pick('catheter', t.catheter)}
          {pick('drill', t.drill)}
        </div>
      </div>
      {tool !== 'off' && (
        <>
          <p className="or-hint">{lock ? t.locked : t.toolHint}</p>
          {tool === 'drill' && <DrillPanel />}
          <div className="tool-grid">
            <span>{t.inside}</span>
            <b>{r.inside.length ? r.inside.map((id) => nameOf(id, lang)).join(', ') : t.nothing}</b>
            <span>{t.nearest}</span>
            <b>
              {nameOf(r.nearestId, lang)} · {mm(r.nearestMm)}
            </b>
            <span>{t.hazard}</span>
            <b className={r.contact ? 'bad' : r.hazardMm < WARN_MM ? 'warn' : ''}>
              {nameOf(r.hazardId, lang)} · {mm(r.hazardMm)}
            </b>
            <span>{r.skinMm < 0 ? t.skinDepth : t.skinAbove}</span>
            <b>{mm(Math.abs(r.skinMm))}</b>
            <span>+ {mm(depth)}</span>
            <b />
          </div>
          <div className="or-row">
            <button className={`or-chip ${rec ? 'on' : ''}`} aria-pressed={rec} onClick={() => set({ rec: !rec })} type="button">
              {t.rec}
            </button>
            <button className="or-chip" onClick={() => activeTools()?.clearTrace()} type="button" aria-label={t.clearTrace} title={t.clearTrace}>
              <Trash2 size={14} />
            </button>
            <button className="or-chip" onClick={copy} type="button">
              <Copy size={14} /> {copied ? t.copied : t.copyTrace}
            </button>
          </div>
          <p className="or-scale">
            {t.path}: {mm(pathMm)} · {t.maxDepth}: {mm(maxDepth)} · {t.minHazard}: {mm(minHaz)} · {samples} pts
          </p>
          <div className="tool-events">
            {events.length === 0 && <span className="or-scale">{t.noEvents}</span>}
            {events
              .slice(-5)
              .reverse()
              .map((e, i) => (
                <div key={`${e.t}-${i}`} className={`tool-ev ${e.type}`}>
                  <span>{e.t.toFixed(1)} s</span> {e.type === 'enter' ? t.evEnter : e.type === 'exit' ? t.evExit : t.evHazard} {nameOf(e.id, lang)} · {mm(e.depth)}
                </div>
              ))}
          </div>
        </>
      )}
    </>
  )
}

/** The risk readout on the picture itself: a ring that fills red as a vessel or nerve comes close. */
export function ToolHUD() {
  const lang = useAtlas((s) => s.lang)
  const t = OR_STRINGS[lang]
  const tool = useTool((s) => s.tool)
  const r = useTool((s) => s.readout)
  if (tool === 'off') return null
  const level = r.hazardMm < CONTACT_MM ? 'bad' : r.hazardMm < WARN_MM ? 'warn' : 'ok'
  return (
    <>
      {level !== 'ok' && <div className={`tool-pulse ${level}`} aria-hidden />}
      <div className={`tool-hud glass ${level}`} role="status" aria-live="polite">
        <b>{r.contact ? t.contact : mm(r.hazardMm)}</b>
        <span>{nameOf(r.hazardId, lang)}</span>
      </div>
    </>
  )
}
