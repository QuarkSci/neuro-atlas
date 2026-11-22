import { useEffect, useRef, useState } from 'react'
import { Crosshair, Hand, ScanFace, Video, VideoOff, X } from 'lucide-react'
import { PART_BY_ID } from '@/data'
import { useAtlas } from '@/store/useAtlas'
import { useL } from '@/i18n'
import { activeScene } from '@/scene/sceneRef'
import { HandsEngine } from './engine'
import { useHands } from './useHands'
import { HAND_STRINGS } from './strings'
import { synthFace, synthFrame, synthHand } from './synth'

/**
 * Camera features. Hand control: the person's own hands drawn over the atlas
 * (their canvas sits above everything but never takes a pointer event) and a
 * cursor ring that names what the index finger points at. Head-tracked view:
 * the scene's perspective follows the head (BrainScene.setEye). A small glass
 * panel holds the camera picture, both switches and the current hint.
 */
export function HandsLayer() {
  const status = useHands((s) => s.status)
  const source = useHands((s) => s.source)
  const session = useHands((s) => s.session)
  const active = status === 'starting' || status === 'on'
  const canvas = useRef<HTMLCanvasElement>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const ripples = useRef<HTMLDivElement>(null)
  const [engine, setEngine] = useState<HandsEngine | null>(null)

  useEffect(() => {
    if (!active || !canvas.current) return
    const hands = useHands.getState()
    const eng = new HandsEngine(canvas.current, {
      report: hands.report,
      theme: () => useAtlas.getState().theme,
      cursor: (c) => {
        const el = cursor.current
        if (!el) return
        el.hidden = !c
        if (!c) return
        el.style.transform = `translate(${c.x}px, ${c.y}px)`
        el.classList.toggle('grab', c.grab)
      },
      tap: (x, y) => {
        const scene = activeScene()
        if (scene) {
          const r = scene.hostElement.getBoundingClientRect()
          scene.externalTap(x - r.left, y - r.top)
        }
        const host = ripples.current
        if (!host) return
        const dot = document.createElement('span')
        dot.className = 'hand-ripple'
        dot.style.transform = `translate(${x}px, ${y}px)`
        host.appendChild(dot)
        window.setTimeout(() => dot.remove(), 650)
      },
    })
    setEngine(eng)
    document.documentElement.classList.add('hands-on')
    const onResize = () => eng.resize()
    window.addEventListener('resize', onResize)
    if (source === 'camera')
      eng.startCamera().then(
        () => useHands.getState().report({ status: 'on' }),
        (code) => useHands.getState().report({ status: 'error', error: code }),
      )
    else useHands.getState().report({ status: 'on' })
    if (import.meta.env.DEV) (window as unknown as { __handsDev: object }).__handsDev = { engine: eng, synthHand, synthFrame, synthFace }
    // Leaving the tab releases the camera; coming back does not silently turn it on again.
    const onHide = () => document.hidden && source === 'camera' && useHands.getState().stop()
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onHide)
      document.documentElement.classList.remove('hands-on')
      eng.dispose()
      setEngine(null)
    }
  }, [active, source, session])

  return (
    <>
      <canvas ref={canvas} className="hands-canvas" hidden={!active} aria-hidden />
      <div ref={ripples} className="hands-ripples" aria-hidden />
      <div ref={cursor} className="hand-cursor" hidden aria-hidden>
        <span className="ring" />
        <HoverName />
      </div>
      {status !== 'off' && <HandsHud engine={engine} />}
    </>
  )
}

function HoverName() {
  const l = useL()
  const hovered = useAtlas((s) => s.hovered)
  const part = hovered ? PART_BY_ID.get(hovered) : undefined
  return part ? <span className="name">{l(part.name)}</span> : null
}

function HandsHud({ engine }: { engine: HandsEngine | null }) {
  const lang = useAtlas((s) => s.lang)
  const t = HAND_STRINGS[lang]
  const { status, error, preview, count, gesture, setPreview, stop, start, source, hands, head, face, headGain, setHeadGain, recenter, toggle } = useHands()
  const pv = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!engine) return
    engine.setPreviewCanvas(preview && source === 'camera' ? pv.current : null)
    return () => engine.setPreviewCanvas(null)
  }, [engine, preview, source, status])

  const handHint = count === 0 ? t.noHands : gesture === 'grab' ? t.grab : gesture === 'zoom' ? t.zoom : t.point
  const headHint = face ? t.headHint : t.noFace
  const hint = status === 'starting' ? t.starting : status === 'error' ? t[error ?? 'load'] : hands && count > 0 ? handHint : head ? headHint : handHint

  return (
    <div className={`hands-hud glass ${status}`} role="status" aria-live="polite">
      <div className="hands-hud-row">
        <div className="hands-feats" role="group" aria-label={t.camera}>
          <button className={hands ? 'on' : ''} aria-pressed={hands} onClick={() => toggle('hands')} title={t.menu}>
            <Hand size={14} /> {t.title}
            <span className="hands-dots" aria-hidden>
              <i className={hands && count >= 1 ? 'on' : ''} />
              <i className={hands && count >= 2 ? 'on' : ''} />
            </span>
          </button>
          <button className={head ? 'on' : ''} aria-pressed={head} onClick={() => toggle('head')} title={t.headMenu}>
            <ScanFace size={14} /> {t.head}
            <span className="hands-dots" aria-hidden>
              <i className={head && face ? 'on' : ''} />
            </span>
          </button>
        </div>
        {source === 'camera' && status === 'on' && (
          <button className="hands-hud-btn" aria-pressed={preview} title={t.preview} aria-label={t.preview} onClick={() => setPreview(!preview)}>
            {preview ? <Video size={15} /> : <VideoOff size={15} />}
          </button>
        )}
        <button className="hands-hud-btn" title={t.stop} aria-label={t.stop} onClick={stop}>
          <X size={15} />
        </button>
      </div>
      {preview && source === 'camera' && status === 'on' && <canvas ref={pv} className="hands-preview" width={224} height={126} aria-label={t.preview} />}
      {head && status === 'on' && (
        <div className="head-row">
          <label>
            <span>{t.strength}</span>
            <input type="range" min={0.3} max={2} step={0.05} value={headGain} onChange={(e) => setHeadGain(+e.target.value)} aria-label={t.strength} />
          </label>
          <button className="hands-hud-btn" title={t.recenter} aria-label={t.recenter} onClick={recenter}>
            <Crosshair size={15} />
          </button>
        </div>
      )}
      <p className="hands-hint">{hint}</p>
      {status === 'error' ? (
        <button className="hands-retry" onClick={() => start()}>
          {t.retry}
        </button>
      ) : (
        source === 'camera' && <p className="hands-privacy">{t.privacy}</p>
      )}
    </div>
  )
}
