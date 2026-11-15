import { useRef } from 'react'
import { Blocks, Brain, Layers2, ListTree, RotateCcw, ScanLine, X } from 'lucide-react'
import { LessonProgress } from './LessonPanel'
import { DEPTH_LEVELS } from '@/data'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { SECTION_BY_ID } from '@/data/sections'
import { useLens } from './useLens'

/** Half the knob's width — the travel of a range input is inset by this much at both ends. */
const KNOB = 12

/**
 * macOS-style track: a thin rail with tick marks beneath it, an icon at each
 * end and a raised round knob. A native range input carries the interaction
 * so keyboard, touch and pointer all behave the way the platform expects.
 */
function MacSlider({
  value,
  onChange,
  label,
  ticks,
  activeTick,
  onTick,
  left,
  right,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  ticks: number[]
  activeTick?: number
  onTick?: (t: number) => void
  left: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <div className="mac-slider">
      <span className="mac-slider-end">{left}</span>
      <div className="mac-slider-rail">
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={Math.round(value * 1000)}
          onChange={(e) => onChange(Number(e.target.value) / 1000)}
          aria-label={label}
          style={{ '--fill': `${value * 100}%` } as React.CSSProperties}
        />
        <div className="mac-ticks">
          {ticks.map((t) => {
            const pos = `calc(${KNOB}px + (100% - ${KNOB * 2}px) * ${t})`
            return onTick ? (
              <button key={t} className={`mac-tick pressable ${activeTick === t ? 'active' : ''}`} style={{ left: pos }} onClick={() => onTick(t)} tabIndex={-1} aria-hidden />
            ) : (
              <span key={t} className="mac-tick" style={{ left: pos }} />
            )
          })}
        </div>
      </div>
      <span className="mac-slider-end">{right}</span>
    </div>
  )
}

const EXPLODE_TICKS = [0, 0.25, 0.5, 0.75, 1]

/** Atlas tab: pick the tool (explode / peel by depth), drag its slider, reset the view. */
function AtlasStrip() {
  const t = useT()
  const l = useL()
  const { mode, setMode, explode, setExplode, peel, setPeel, reset } = useAtlas()
  const segRef = useRef<HTMLDivElement>(null)
  const blobRef = useRef<HTMLSpanElement>(null)
  useLens(segRef, blobRef, '.seg-item')
  // One tick per shell; the caption names the outermost shell still shown.
  const steps = Math.max(1, DEPTH_LEVELS.length - 1)
  const peelTicks = DEPTH_LEVELS.map((_, i) => i / steps)
  const shown = DEPTH_LEVELS[Math.min(DEPTH_LEVELS.length - 1, Math.round(peel * steps))]
  const peeling = mode === 'peel'
  return (
    <div className="tool-strip glass lens">
      <div className="seg" role="tablist" aria-label={t.modeTabs} ref={segRef}>
        <span className="lens-blob" ref={blobRef} aria-hidden />
        <button role="tab" className={`seg-item ${peeling ? '' : 'active'}`} aria-selected={!peeling} onClick={() => setMode('explode')} title={t.explode}>
          <Blocks size={16} /> <span>{t.tabExplode}</span>
        </button>
        <button role="tab" className={`seg-item ${peeling ? 'active' : ''}`} aria-selected={peeling} onClick={() => setMode('peel')} title={t.peel}>
          <Layers2 size={16} /> <span>{t.tabPeel}</span>
        </button>
      </div>
      <div className="tool-slider">
        {peeling ? (
          <MacSlider
            value={peel}
            onChange={setPeel}
            label={t.peel}
            ticks={peelTicks}
            activeTick={Math.round(peel * steps) / steps}
            onTick={setPeel}
            left={<Brain size={16} />}
            right={<Layers2 size={16} />}
          />
        ) : (
          <MacSlider value={explode} onChange={setExplode} label={t.explode} ticks={EXPLODE_TICKS} left={<Brain size={16} />} right={<Blocks size={16} />} />
        )}
        {peeling && (
          <output className="tool-caption">
            {shown ? l(shown.name) : ''} · {Math.round(peel * steps)}/{steps}
          </output>
        )}
      </div>
      <button className="bar-icon" onClick={reset} aria-label={t.reset} title={t.reset}>
        <RotateCcw size={18} />
      </button>
    </div>
  )
}

/**
 * Study tab: the strip only carries what is in progress — a running lesson's
 * step dots, or the plate the model is cut along. Choosing a topic happens
 * in the sidebar; with it closed, the strip offers the way back to it.
 */
function LearnStrip() {
  const t = useT()
  const l = useL()
  const { sectionCut, lesson, sidebar, setSidebar, openSection, cutSection } = useAtlas()
  const cut = sectionCut ? SECTION_BY_ID.get(sectionCut) : undefined
  if (lesson && !cut) return <LessonProgress />
  if (cut)
    return (
      <div className="tool-strip glass lens">
        <span className="sv-code">{cut.code}</span>
        <strong className="tool-title">{l(cut.title)}</strong>
        <button className="strip-btn accent" onClick={() => openSection(cut.id)}>
          <ScanLine size={15} /> {t.svFace}
        </button>
        <button className="strip-btn" onClick={() => cutSection(null)}>
          <X size={15} /> {t.svUncut}
        </button>
      </div>
    )
  if (sidebar) return null
  return (
    <button className="tool-strip glass lens as-button" onClick={() => setSidebar(true)}>
      <ListTree size={17} /> {t.lnTopics}
    </button>
  )
}

/** The one strip under the model; its contents follow the current tab. */
export function BottomBar() {
  const mode = useAtlas((s) => s.mode)
  return <div className="bottom-dock">{mode === 'learn' ? <LearnStrip /> : <AtlasStrip />}</div>
}
