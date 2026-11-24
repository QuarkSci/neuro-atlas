import { RotateCcw } from 'lucide-react'
import { useAtlas } from '@/store/useAtlas'
import { activeTools } from '../orMode'
import type { L10n } from '../types'
import type { BoneLayer, DrillEvent } from './types'
import { useDrill } from './useDrill'

const LAYER: Record<BoneLayer, L10n> = {
  air: { uz: 'Havo', en: 'Air' },
  scalp: { uz: 'Bosh terisi', en: 'Scalp' },
  'outer-table': { uz: 'Tashqi plastinka', en: 'Outer table' },
  diploe: { uz: 'Diploe (g‘ovak suyak)', en: 'Diploë' },
  'inner-table': { uz: 'Ichki plastinka', en: 'Inner table' },
  dura: { uz: 'Qattiq parda', en: 'Dura mater' },
  brain: { uz: 'Miya', en: 'Brain' },
}
const T = {
  uz: {
    spin: 'Burg‘u aylanadi',
    spinHint: 'Space ni bosib turing yoki tugmani yoqing. G‘ildirak — chuqurlik.',
    push: 'Bosim',
    layer: 'Qatlam',
    depth: 'Chuqurlik',
    toNext: 'Keyingi qatlamgacha',
    hole: 'Teshik',
    removed: 'Olingan suyak',
    thick: 'Suyak qalinligi (bu nuqtada)',
    rpm: 'Aylanish',
    reset: 'Yangi suyak',
    warn: 'Ichki plastinka yupqa: bosimni kamaytiring!',
    plunge: 'Qattiq bosildi: burg‘u pardaga sakradi',
    breach: 'Ichki plastinka teshildi',
    past: 'Suyakdan o‘tib ketdi',
    none: 'Hali hodisa yo‘q',
    ev: { layer: 'qatlam', 'plunge-warning': 'ogohlantirish', breakthrough: 'teshib o‘tdi', stall: 'qotdi', start: '', stop: '' },
    site: 'Kocher nuqtasi (o‘ng): 40 × 40 mm suyak bo‘lagi',
  },
  en: {
    spin: 'Spin the drill',
    spinHint: 'Hold Space or toggle the button. Wheel = depth.',
    push: 'Push',
    layer: 'Layer',
    depth: 'Depth',
    toNext: 'To next layer',
    hole: 'Hole',
    removed: 'Bone removed',
    thick: 'Bone thickness (here)',
    rpm: 'Speed',
    reset: 'New bone',
    warn: 'Inner table is thin: ease off the push!',
    plunge: 'Pushed too hard: the bit lurched into the dura',
    breach: 'Inner table breached',
    past: 'Past the bone',
    none: 'No events yet',
    ev: { layer: 'layer', 'plunge-warning': 'warning', breakthrough: 'breakthrough', stall: 'stall', start: '', stop: '' },
    site: 'Kocher point (right): 40 × 40 mm bone patch',
  },
}
const mm = (v: number, n = 1) => (isFinite(v) ? `${v.toFixed(n)} mm` : '—')

const describe = (e: DrillEvent, lang: 'uz' | 'en') => {
  const t = T[lang]
  if (e.type === 'layer') return `${t.ev.layer}: ${LAYER[e.from][lang]} → ${LAYER[e.to][lang]}`
  if (e.type === 'plunge-warning') return `${t.ev['plunge-warning']}: ${e.toNextMm.toFixed(1)} mm`
  if (e.type === 'breakthrough') return `${t.ev.breakthrough} (${t.push.toLowerCase()} ${e.push.toFixed(2)})`
  if (e.type === 'stall') return t.ev.stall
  return ''
}

/** Drill rows of the operating-room panel (SX-4): spindle, push, layer, hole size, warnings. */
export function DrillPanel() {
  const lang = useAtlas((s) => s.lang) === 'uz' ? 'uz' : 'en'
  const t = T[lang]
  const d = useDrill()
  if (!d.ready) return null
  const level = d.layer === 'inner-table' && d.toNextMm < 1 ? 'warn' : ''
  return (
    <>
      <p className="or-hint">{t.site}</p>
      <div className="or-row">
        <button className={`or-chip ${d.spin ? 'on' : ''}`} style={{ whiteSpace: 'nowrap' }} aria-pressed={d.spin} onClick={() => d.set({ spin: !d.spin })} type="button">
          {t.spin}
        </button>
        <button className="or-chip" onClick={() => activeTools()?.resetDrill()} type="button" aria-label={t.reset} title={t.reset} style={{ whiteSpace: 'nowrap' }}>
          <RotateCcw size={14} /> {t.reset}
        </button>
      </div>
      <div className="or-row">
        <label className="or-label" htmlFor="drill-push" style={{ whiteSpace: 'nowrap' }}>
          {t.push} {d.push.toFixed(2)}
        </label>
        <input id="drill-push" style={{ flex: 1, minWidth: 0 }} type="range" min={0} max={1} step={0.05} value={d.push} onChange={(e) => d.set({ push: +e.target.value })} />
      </div>
      <p className="or-scale">{t.spinHint}</p>
      <div className="tool-grid">
        <span>{t.layer}</span>
        <b className={level}>{LAYER[d.layer][lang]}</b>
        <span>{t.depth}</span>
        <b>{isFinite(d.depthMm) ? mm(d.depthMm) : '—'}</b>
        <span>{t.toNext}</span>
        <b className={level}>{isFinite(d.toNextMm) ? mm(d.toNextMm) : '—'}</b>
        <span>{t.rpm}</span>
        <b>{Math.round(d.rpm / 100) * 100} rpm</b>
        <span>{t.hole}</span>
        <b>
          {mm(d.holeDepthMm)} × ⌀ {mm(d.holeWidthMm)}
        </b>
        <span>{t.removed}</span>
        <b>{d.removedMm3.toFixed(0)} mm³</b>
        <span>{t.thick}</span>
        <b>{mm(d.thicknessMm)}</b>
      </div>
      {d.layer === 'inner-table' && d.toNextMm < 1 && <p className="or-hint tool-ev hazard">{t.warn}</p>}
      {d.breached && (
        <p className={`or-hint tool-ev ${d.plunged ? 'hazard' : ''}`}>
          {d.plunged ? t.plunge : t.breach} · {t.past}: {mm(d.pastBoneMm)}
        </p>
      )}
      <div className="tool-events">
        {d.events.length === 0 && <span className="or-scale">{t.none}</span>}
        {d.events
          .slice(-4)
          .reverse()
          .map((e, i) => (
            <div key={`${e.t}-${i}`} className={`tool-ev ${e.type === 'plunge-warning' || e.type === 'stall' ? 'hazard' : ''}`}>
              <span>{e.t.toFixed(1)} s</span> {describe(e, lang)}
            </div>
          ))}
      </div>
    </>
  )
}
