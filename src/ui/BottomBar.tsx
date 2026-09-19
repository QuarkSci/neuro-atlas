import { Blocks, Brain, Layers, RotateCcw } from 'lucide-react'
import { LAYERS } from '@/data'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

/** Half the knob's width — the travel of a range input is inset by this much at both ends. */
const KNOB = 12

/**
 * macOS-style track: a thin rail with tick marks beneath it, an icon at each
 * end and a raised round knob. A native range input carries the interaction
 * so keyboard, touch and pointer all behave the way the platform expects.
 */
function MacSlider({ value, onChange, label, ticks, left, right }: { value: number; onChange: (v: number) => void; label: string; ticks: number[]; left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="mac-slider">
      <span className="mac-slider-end">{left}</span>
      <div className="mac-slider-rail">
        <input type="range" min={0} max={1000} step={1} value={Math.round(value * 1000)} onChange={(e) => onChange(Number(e.target.value) / 1000)} aria-label={label} style={{ '--fill': `${value * 100}%` } as React.CSSProperties} />
        <div className="mac-ticks">
          {ticks.map((t) => (
            <span key={t} className="mac-tick" style={{ left: `calc(${KNOB}px + (100% - ${KNOB * 2}px) * ${t})` }} />
          ))}
        </div>
      </div>
      <span className="mac-slider-end">{right}</span>
    </div>
  )
}

/** Circular progress dial showing the explode amount; pressing it resets the view. */
function Gauge() {
  const t = useT()
  const { explode, reset } = useAtlas()
  const r = 21
  const circumference = 2 * Math.PI * r
  return (
    <div className="gauge-card glass">
      <button className="gauge" onClick={reset} aria-label={t.reset} title={t.reset}>
        <svg viewBox="0 0 50 50" aria-hidden>
          <circle className="gauge-track" cx="25" cy="25" r={r} />
          <circle className="gauge-value" cx="25" cy="25" r={r} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - explode)} />
        </svg>
        <span className="gauge-glyph">
          <RotateCcw size={15} />
        </span>
      </button>
    </div>
  )
}

/** iOS-style bottom tab bar: one tab per atlas layer, so the two data sources can be shown together or alone. */
function LayerTabs() {
  const t = useT()
  const l = useL()
  const { layers, toggleLayer } = useAtlas()
  return (
    <nav className="mode-tabs glass" role="tablist" aria-label={t.layers}>
      {LAYERS.map((layer) => {
        const on = layers.includes(layer.id)
        return (
          <button key={layer.id} role="tab" className={`mode-tab ${on ? 'active' : ''}`} aria-selected={on} onClick={() => toggleLayer(layer.id)} title={layer.source}>
            {layer.id === 'gross' ? <Brain size={20} /> : <Layers size={20} />}
            <span>{l(layer.name).replace(/ .*/, '')}</span>
          </button>
        )
      })}
    </nav>
  )
}

const EXPLODE_TICKS = [0, 0.25, 0.5, 0.75, 1]

/** The whole bottom stack: the explode slider, its dial, and the layer tabs. */
export function BottomBar() {
  const t = useT()
  const { explode, setExplode } = useAtlas()
  return (
    <div className="bottom-dock">
      <div className="dock-row">
        <div className="slider-card bare">
          <MacSlider value={explode} onChange={setExplode} label={t.explode} ticks={EXPLODE_TICKS} left={<Brain size={15} />} right={<Blocks size={16} />} />
        </div>
        <Gauge />
      </div>
      <LayerTabs />
    </div>
  )
}
