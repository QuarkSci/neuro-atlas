import { useState } from 'react'
import { X } from 'lucide-react'
import { PART_BY_ID } from '@/data'
import { useAtlas } from '@/store/useAtlas'
import { activeDbs } from '../orMode'
import { DBS_MER_LAYERS, DBS_STEPS as STEP_TEXT, DBS_TARGETS } from './data'
import type { DbsStepId, TrackOffset } from './logic'
import { DBS_STRINGS } from './strings'
import { useDbs } from './useDbs'
import type { DbsTargetId } from './types'

const STEPS: DbsStepId[] = ['plan', 'trajectory', 'burr', 'guide', 'mer', 'stim', 'implant']
const TEXT_ID: Record<DbsStepId, string> = { plan: 'acpc', trajectory: 'trajectory', burr: 'burr', guide: 'guide', mer: 'mer', stim: 'macrostim', implant: 'implant' }
const OFFSETS: TrackOffset[] = ['center', 'anterior', 'posterior', 'medial', 'lateral']
const OFF_LABEL: Record<TrackOffset, { uz: string; en: string }> = {
  center: { uz: 'Markaz', en: 'Centre' },
  anterior: { uz: 'Oldingi', en: 'Anterior' },
  posterior: { uz: 'Orqa', en: 'Posterior' },
  medial: { uz: 'Medial', en: 'Medial' },
  lateral: { uz: 'Lateral', en: 'Lateral' },
}
const T = {
  uz: {
    begin: 'Boshlash',
    next: 'Keyingi qadam',
    assisted: 'Atlas AC–PC (yordam)',
    clickAc: 'AC ni bosing',
    clickPc: 'PC ni bosing',
    clickEntry: 'Kirish nuqtasini boshda bosing',
    frame: 'AC–PC uzunligi / xato',
    planned: 'Reja (lateral, old, yuqori)',
    angles: 'Burchaklar (sagittal / koronal)',
    nothing: 'Hech narsa kesilmadi',
    shift: 'Brain shift',
    seal: 'Dura ni yopish (fibrin)',
    sealed: 'Yopilgan',
    guide: 'Kanula (nishondan yuqorida)',
    track: 'Yo‘l',
    newTrack: 'Yangi yo‘l',
    rate: 'Chastota',
    stimTitle: 'Makrostimulyatsiya',
    benefit: 'Foyda chegarasi',
    noEffect: 'Nojo‘ya ta’sir yo‘q',
    implant: 'Elektrodni qo‘yish',
    report: 'Hisobot',
    total: 'Umumiy',
    copy: 'CSV nusxa',
    again: 'Qaytadan',
    fmt: 'AC / PC belgilari',
    assistedNote: 'Yordamli rejimda belgilash xatosi simulyatsiya qilinmaydi.',
  },
  en: {
    begin: 'Begin',
    next: 'Next step',
    assisted: 'Atlas AC–PC (assisted)',
    clickAc: 'Click AC',
    clickPc: 'Click PC',
    clickEntry: 'Click the entry point on the head',
    frame: 'AC–PC length / error',
    planned: 'Plan (lateral, ant., sup.)',
    angles: 'Angles (sagittal / coronal)',
    nothing: 'Nothing crossed',
    shift: 'Brain shift',
    seal: 'Seal the dura (fibrin)',
    sealed: 'Sealed',
    guide: 'Guide tube (above target)',
    track: 'Track',
    newTrack: 'New track',
    rate: 'Rate',
    stimTitle: 'Macrostimulation',
    benefit: 'Benefit threshold',
    noEffect: 'No side effect',
    implant: 'Implant the lead',
    report: 'Report',
    total: 'Total',
    copy: 'Copy CSV',
    again: 'Again',
    fmt: 'AC / PC marks',
    assistedNote: 'In assisted mode the marking error is not simulated.',
  },
}
const mm = (v: number | null | undefined, n = 1) => (v != null && isFinite(v) ? `${v.toFixed(n)} mm` : '—')
const partName = (id: string, lang: 'uz' | 'en') => PART_BY_ID.get(id)?.name[lang] ?? PART_BY_ID.get(id)?.name.en ?? id
const scoreColor = (s: number) => (s === 5 ? '#34c759' : s === 3 ? '#f2b51f' : '#ff6b5e')

/** DBS (OP-2) panel: the seven steps of dbs.md 4.1 over `DbsLink` (SX-6 logic + AG-16 data). */
export function DbsPanel() {
  const lang = useAtlas((s) => s.lang) === 'uz' ? 'uz' : 'en'
  const t = T[lang]
  const S = DBS_STRINGS[lang]
  const u = useDbs()
  const link = activeDbs()
  const [copied, setCopied] = useState(false)
  if (!link) return null
  const stepIdx = STEPS.indexOf(u.step)
  const def = STEP_TEXT.find((d) => d.id === TEXT_ID[u.step])
  const chip = (label: string, onClick: () => void, on = false, disabled = false) => (
    <button className={`or-chip ${on ? 'on' : ''}`} type="button" onClick={onClick} disabled={disabled} style={{ whiteSpace: 'nowrap', opacity: disabled ? 0.45 : 1 }}>
      {label}
    </button>
  )
  const a = u.analysis
  const range = DBS_TARGETS[u.target].entry

  const csv = () => {
    const e = u.report?.export
    if (!e) return ''
    const keys = Object.keys(e) as (keyof typeof e)[]
    return keys.join(',') + '\n' + keys.map((k) => e[k]).join(',')
  }

  return (
    <aside className="or-panel glass" aria-label={S.title} style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', width: 312 }}>
      <header className="or-head">
        <strong>{S.title}</strong>
        <button className="or-close" onClick={() => useDbs.getState().set({ open: false })} aria-label="close" type="button">
          <X size={16} />
        </button>
      </header>

      {!u.running && !u.report && (
        <>
          <div className="or-row">
            <span className="or-label">{S.target}</span>
            <div className="seg" role="group">
              {(['stn', 'gpi', 'vim'] as DbsTargetId[]).map((id) => (
                <button key={id} className={u.target === id ? 'active' : ''} type="button" onClick={() => u.set({ target: id })}>
                  {id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="or-row">
            <span className="or-label">{S.side}</span>
            <div className="seg" role="group">
              <button className={u.side === 'right' ? 'active' : ''} type="button" onClick={() => u.set({ side: 'right' })}>
                {S.sideRight}
              </button>
              <button className={u.side === 'left' ? 'active' : ''} type="button" onClick={() => u.set({ side: 'left' })}>
                {S.sideLeft}
              </button>
            </div>
          </div>
          <p className="or-hint">{DBS_TARGETS[u.target].indication[lang]}</p>
          {chip(t.begin, () => link.begin(u.target, u.side), true)}
        </>
      )}

      {(u.running || u.report) && (
        <>
          <div style={{ display: 'flex', gap: 3 }} aria-hidden>
            {STEPS.map((s, i) => (
              <span
                key={s}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: i < stepIdx || u.report ? '#34c759' : i === stepIdx ? 'var(--ink)' : 'color-mix(in oklab, var(--ink) 18%, transparent)',
                }}
              />
            ))}
          </div>
          {def && !u.report && (
            <div className="or-hint">
              <b>
                {def.index}/7. {def.name[lang]}
              </b>
              <br />
              {def.instruction[lang]}
              <br />
              <span style={{ color: '#f2b51f' }}>{def.mistake[lang]}</span>
            </div>
          )}

          {u.step === 'plan' && u.running && (
            <>
              <div className="or-row">
                {chip(t.assisted, () => link.markFromAtlas(), false)}
                {chip(t.clickAc, () => u.set({ pick: 'ac' }), u.pick === 'ac')}
                {chip(t.clickPc, () => u.set({ pick: 'pc' }), u.pick === 'pc')}
              </div>
              <div className="tool-grid">
                <span>{t.fmt}</span>
                <b>
                  {u.marks.ac ? 'AC ✓' : 'AC —'} · {u.marks.pc ? 'PC ✓' : 'PC —'}
                </b>
                <span>{t.frame}</span>
                <b>{u.frame ? `${mm(u.frame.lengthMm)} / ${mm(u.frame.errorMm)}` : '—'}</b>
                <span>{t.planned}</span>
                <b>{u.plannedAcpc ? u.plannedAcpc.map((x) => x.toFixed(1)).join(', ') : '—'}</b>
              </div>
              <p className="or-scale">{t.assistedNote}</p>
            </>
          )}

          {u.step === 'trajectory' && u.running && (
            <>
              {chip(t.clickEntry, () => u.set({ pick: 'entry' }), u.pick === 'entry')}
              {a && (
                <div className="tool-grid">
                  <span>{t.angles}</span>
                  <b className={a.anglesOk ? '' : 'warn'}>
                    {a.sagittalDeg.toFixed(0)}° / {a.coronalDeg.toFixed(0)}° ({range.sagittalDeg.value.min}–{range.sagittalDeg.value.max}° / {range.coronalDeg.value.min}–
                    {range.coronalDeg.value.max}°)
                  </b>
                  {a.items.slice(0, 5).map((i) => (
                    <span key={i.partId} style={{ display: 'contents' }}>
                      <span>{partName(i.partId, lang)}</span>
                      <b className={i.critical && (i.crossed || i.minMm < 1) ? 'bad' : i.critical && i.minMm < 3 ? 'warn' : ''}>
                        {i.crossed ? `✗ ${i.consequence[lang].slice(0, 28)}` : mm(i.minMm)}
                      </b>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {u.step === 'burr' && u.running && (
            <div className="or-row">
              {chip(u.sealed ? t.sealed : t.seal, () => link.sealDura(), u.sealed)}
              <span className="or-scale">
                {t.shift}: {mm(u.shiftMm)}
              </span>
            </div>
          )}

          {u.step === 'guide' && u.running && (
            <div className="or-row">
              <label className="or-label" htmlFor="dbs-guide" style={{ whiteSpace: 'nowrap' }}>
                {t.guide} {u.depth.toFixed(0)} mm
              </label>
              <input
                id="dbs-guide"
                style={{ flex: 1, minWidth: 0 }}
                type="range"
                min={5}
                max={25}
                step={1}
                value={Math.max(5, Math.min(25, u.depth))}
                onChange={(e) => link.guideTo(+e.target.value)}
              />
            </div>
          )}

          {(u.step === 'mer' || u.step === 'stim') && u.running && (
            <>
              <div className="or-row" style={{ flexWrap: 'wrap' }}>
                {OFFSETS.map((o) => chip(OFF_LABEL[o][lang], () => link.newTrack(o), false))}
              </div>
              <div className="or-row" style={{ flexWrap: 'wrap' }}>
                <span className="or-label">{t.track}</span>
                {u.tracks.map((x) => chip(`${x.id} ${OFF_LABEL[x.offset][lang]}`, () => link.selectTrack(x.id), x.id === u.track))}
              </div>
              <div className="or-row">
                <label className="or-label" htmlFor="dbs-depth" style={{ whiteSpace: 'nowrap' }}>
                  {S.depthLabel} {u.depth.toFixed(1)}
                </label>
                <input id="dbs-depth" style={{ flex: 1, minWidth: 0 }} type="range" min={-5} max={15} step={0.5} value={u.depth} onChange={(e) => link.drive(+e.target.value)} />
              </div>
              {u.reading && (
                <div className="tool-grid">
                  <span>{S.layerLabel}</span>
                  <b className={u.reading.pattern.inTarget ? '' : ''}>
                    {DBS_MER_LAYERS.find((l) => l.id === u.reading!.pattern.layerId)?.name[lang] ?? u.reading.pattern.layerId} {u.reading.pattern.inTarget ? '· ' + S.inTarget : ''}
                  </b>
                  <span>{t.rate}</span>
                  <b>{u.reading.pattern.rateHz.toFixed(0)} Hz</b>
                  <span>{S.responses[u.reading.pattern.response] ? '↯' : ''}</span>
                  <b>{S.responses[u.reading.pattern.response]}</b>
                </div>
              )}
              <div className="or-row" style={{ flexWrap: 'wrap' }}>
                {chip(u.audio ? S.audioStop : S.audioPlay, () => link.setAudio(!u.audio), u.audio)}
                {chip(S.provokeBtn, () => link.provoke(), false, !u.audio)}
                {chip(S.markEntry, () => link.mark('enter'))}
                {chip(S.markExit, () => link.mark('exit'))}
              </div>
              <div className="or-row">
                <label className="or-label" htmlFor="dbs-ma" style={{ whiteSpace: 'nowrap' }}>
                  {S.currentMa} {u.mA.toFixed(1)}
                </label>
                <input id="dbs-ma" style={{ flex: 1, minWidth: 0 }} type="range" min={0} max={6} step={0.1} value={u.mA} onChange={(e) => link.stimulate(+e.target.value)} />
              </div>
              {u.stim && (
                <div className="tool-grid">
                  <span>{t.benefit}</span>
                  <b>
                    {u.stim.benefit ? '✓ ' : '— '}
                    {u.stim.benefitThresholdMa.toFixed(1)} mA
                  </b>
                  <span>{S.therapeuticWindow}</span>
                  <b className={u.stim.windowMa >= 1.5 ? '' : 'warn'}>{u.stim.windowMa.toFixed(1)} mA</b>
                  {u.stim.effects.length === 0 ? (
                    <>
                      <span />
                      <b>{t.noEffect}</b>
                    </>
                  ) : (
                    u.stim.effects.map((e) => (
                      <span key={e.id} style={{ display: 'contents' }}>
                        <span>{partName(e.partId, lang)}</span>
                        <b className="bad">{e.effect[lang]}</b>
                      </span>
                    ))
                  )}
                </div>
              )}
              <p className="or-scale">
                {t.shift}: {mm(u.shiftMm)}
              </p>
            </>
          )}

          {u.step === 'implant' && u.running && <div className="or-row">{chip(`${t.implant} (${u.depth.toFixed(1)})`, () => link.implant(), true)}</div>}

          {u.running && u.step !== 'implant' && <div className="or-row">{chip(t.next, () => link.confirm(), true)}</div>}
          {u.notice === 'out-of-order' && (
            <p className="or-hint tool-ev hazard">⚠ {lang === 'uz' ? 'Qadam tartibi buzildi yoki shart bajarilmadi' : 'Out of order, or the step is not ready'}</p>
          )}

          {u.report && (
            <>
              <p className="or-hint">
                <b>
                  {t.report}: {t.total} {u.report.total.toFixed(2)} / 5
                </b>
              </p>
              <div className="tool-grid">
                {Object.values(u.report.scores).map((s) => (
                  <span key={s.id} style={{ display: 'contents' }}>
                    <span>
                      {
                        (
                          {
                            radial: S.radialError,
                            clearance: S.clearance,
                            mer: S.merError,
                            window: S.therapeuticWindow,
                            tracks: S.tracks,
                            frame: S.acpcFrame,
                            tremor: 'RMS',
                          } as Record<string, string>
                        )[s.id]
                      }
                    </span>
                    <b style={{ color: scoreColor(s.score) }}>
                      {s.value === null ? '—' : s.value.toFixed(1)} · {s.band[lang]}
                    </b>
                  </span>
                ))}
                <span>{S.atlasOffset}</span>
                <b>{mm(u.report.export.atlasOffsetMm)}</b>
                <span>{lang === 'uz' ? 'Reja ↔ Julich' : 'Plan ↔ Julich'}</span>
                <b>{mm(u.report.planVsAtlasMm)}</b>
              </div>
              {u.report.caps.map((c, i) => (
                <p key={i} className="or-hint tool-ev hazard">
                  {c[lang]}
                </p>
              ))}
              <div className="or-row">
                {chip(copied ? S.copied : t.copy, async () => {
                  try {
                    await navigator.clipboard.writeText(csv())
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1400)
                  } catch {
                    /* clipboard blocked */
                  }
                })}
                {chip(t.again, () => link.begin(u.target, u.side))}
              </div>
            </>
          )}
        </>
      )}
    </aside>
  )
}
