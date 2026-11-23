import { useEffect, useState } from 'react'
import { Copy, Lamp, Ruler, X } from 'lucide-react'
import { useAtlas } from '@/store/useAtlas'
import { activeScene } from '@/scene/sceneRef'
import { OR_STRINGS } from './strings'
import { useOR, type OrCamera } from './useOR'
import { exitOR, measuresCsv, sceneToMni } from './orMode'
import type { Skin } from './room'

/** The operating-room panel: views, scalp, lamp, ruler, and the teaching-only notice. */
export function ORPanel() {
  const on = useOR((s) => s.on)
  const lang = useAtlas((s) => s.lang)
  const camera = useOR((s) => s.camera)
  const skin = useOR((s) => s.skin)
  const lamp = useOR((s) => s.lamp)
  const measure = useOR((s) => s.measure)
  const measures = useOR((s) => s.measures)
  const pending = useOR((s) => s.pending)
  const fps = useOR((s) => s.fps)
  const set = useOR((s) => s.set)
  const [copied, setCopied] = useState(false)
  const t = OR_STRINGS[lang]

  // Draws per second: the scene renders only when something changes, so this reads the renderer's own counter.
  useEffect(() => {
    if (!on) return
    let last = activeScene()?.renderer.info.render.frame ?? 0
    const id = window.setInterval(() => {
      const f = activeScene()?.renderer.info.render.frame ?? last
      useOR.setState({ fps: Math.round(((f - last) * 1000) / 500) })
      last = f
    }, 500)
    return () => window.clearInterval(id)
  }, [on])

  useEffect(() => {
    document.documentElement.classList.toggle('or-on', on)
    return () => document.documentElement.classList.remove('or-on')
  }, [on])

  if (!on) return null
  const seg = <V extends string>(value: V, cur: V, label: string, onPick: (v: V) => void) => (
    <button className={cur === value ? 'active' : ''} aria-pressed={cur === value} onClick={() => onPick(value)} type="button">
      {label}
    </button>
  )
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(measuresCsv(measures))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked */
    }
  }
  const mni = (p: [number, number, number]) =>
    sceneToMni(p)
      .map((v) => v.toFixed(0))
      .join(', ')

  return (
    <>
      {camera === 'microscope' && <div className="or-scope" aria-hidden />}
      <aside className="or-panel glass" aria-label={t.title}>
        <header className="or-head">
          <strong>{t.title}</strong>
          <span className="or-fps" title={t.fps}>
            {fps} {t.fps}
          </span>
          <button className="or-close" onClick={exitOR} aria-label={t.exit} title={t.exit} type="button">
            <X size={16} />
          </button>
        </header>
        <div className="or-row">
          <span className="or-label">{t.camera}</span>
          <div className="seg" role="group" aria-label={t.camera}>
            {seg<OrCamera>('surgeon', camera, t.surgeon, (v) => set({ camera: v }))}
            {seg<OrCamera>('microscope', camera, t.microscope, (v) => set({ camera: v }))}
            {seg<OrCamera>('free', camera, t.free, (v) => set({ camera: v }))}
          </div>
        </div>
        <div className="or-row">
          <span className="or-label">{t.skin}</span>
          <div className="seg" role="group" aria-label={t.skin}>
            {seg<Skin>('on', skin, t.skinOn, (v) => set({ skin: v }))}
            {seg<Skin>('ghost', skin, t.skinGhost, (v) => set({ skin: v }))}
            {seg<Skin>('bone', skin, t.skinBone, (v) => set({ skin: v }))}
            {seg<Skin>('off', skin, t.skinOff, (v) => set({ skin: v }))}
          </div>
        </div>
        <div className="or-row">
          <button className={`or-chip ${lamp ? 'on' : ''}`} aria-pressed={lamp} onClick={() => set({ lamp: !lamp })} type="button">
            <Lamp size={15} /> {t.lamp}
          </button>
          <button className={`or-chip ${measure ? 'on' : ''}`} aria-pressed={measure} onClick={() => set({ measure: !measure })} type="button">
            <Ruler size={15} /> {t.ruler}
          </button>
        </div>
        {measure && <p className="or-hint">{pending ? t.rulerNext : t.rulerHint}</p>}
        {measures.length > 0 && (
          <div className="or-measures">
            {measures.map((m, i) => (
              <div key={m.id} className="or-measure">
                <b>{m.mm.toFixed(1)} mm</b>
                <span>
                  {i + 1}: ({mni(m.a)}) → ({mni(m.b)})
                </span>
              </div>
            ))}
            <div className="or-row">
              <button className="or-chip" onClick={() => set({ measures: [], pending: null })} type="button">
                {t.clear}
              </button>
              <button className="or-chip" onClick={copy} type="button">
                <Copy size={14} /> {copied ? t.copied : t.copy}
              </button>
            </div>
          </div>
        )}
        <p className="or-scale">{t.scale}</p>
      </aside>
      <div className="or-warn glass" role="note">
        {t.warn}
      </div>
    </>
  )
}
