import { Blocks, Brain, Layers2, RotateCcw } from 'lucide-react'
import { DEPTH_LEVELS } from '@/data'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

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
        <input type="range" min={0} max={1000} step={1} value={Math.round(value * 1000)} onChange={(e) => onChange(Number(e.target.value) / 1000)} aria-label={label} style={{ '--fill': `${value * 100}%` } as React.CSSProperties} />
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

/** Circular progress dial showing the active slider's value; pressing it resets the view. */
function Gauge() {
  const t = useT()
  const { mode, explode, peel, reset } = useAtlas()
  const value = mode === 'peel' ? peel : explode
  const r = 21
  const circumference = 2 * Math.PI * r
  return (
    <div className="gauge-card glass">
      <button className="gauge" onClick={reset} aria-label={t.reset} title={t.reset}>
        <svg viewBox="0 0 50 50" aria-hidden>
          <circle className="gauge-track" cx="25" cy="25" r={r} />
          <circle className="gauge-value" cx="25" cy="25" r={r} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value)} />
        </svg>
        <span className="gauge-glyph">
          <RotateCcw size={15} />
        </span>
      </button>
    </div>
  )
}

/** iOS-style bottom tab bar: explode the model apart, or peel it shell by shell. */
function ModeTabs() {
  const t = useT()
  const { mode, setMode } = useAtlas()
  return (
    <nav className="mode-tabs glass" role="tablist" aria-label={t.modeTabs}>
      <button role="tab" className={`mode-tab ${mode === 'explode' ? 'active' : ''}`} aria-selected={mode === 'explode'} onClick={() => setMode('explode')}>
        <Blocks size={20} />
        <span>{t.tabExplode}</span>
      </button>
      <button role="tab" className={`mode-tab ${mode === 'peel' ? 'active' : ''}`} aria-selected={mode === 'peel'} onClick={() => setMode('peel')}>
        <Layers2 size={20} />
        <span>{t.tabPeel}</span>
      </button>
    </nav>
  )
}

const EXPLODE_TICKS = [0, 0.25, 0.5, 0.75, 1]

/** The whole bottom stack: the active mode's slider, its dial, and the mode tabs. */
export function BottomBar() {
  const t = useT()
  const l = useL()
  const { mode, explode, setExplode, peel, setPeel } = useAtlas()
  // One tick per shell; the caption names the outermost shell still shown.
  const steps = Math.max(1, DEPTH_LEVELS.length - 1)
  const peelTicks = DEPTH_LEVELS.map((_, i) => i / steps)
  const shown = DEPTH_LEVELS[Math.min(DEPTH_LEVELS.length - 1, Math.round(peel * steps))]

  return (
    <div className="bottom-dock">
      <div className="dock-row">
        {mode === 'peel' ? (
          <div className="slider-card glass">
            <div className="flight-label">
              <strong>{shown ? l(shown.name) : ''}</strong>
              <output>{Math.round(peel * steps)}/{steps}</output>
            </div>
            <MacSlider value={peel} onChange={setPeel} label={t.peel} ticks={peelTicks} activeTick={Math.round(peel * steps) / steps} onTick={setPeel} left={<Brain size={15} />} right={<Layers2 size={15} />} />
          </div>
        ) : (
          // Bare track, no caption and no card: the two end icons already say
          // what the slider does, and the dial beside it reads out the value.
          <div className="slider-card bare">
            <MacSlider value={explode} onChange={setExplode} label={t.explode} ticks={EXPLODE_TICKS} left={<Brain size={15} />} right={<Blocks size={16} />} />
          </div>
        )}
        <Gauge />
      </div>
      <ModeTabs />
    </div>
  )
}
