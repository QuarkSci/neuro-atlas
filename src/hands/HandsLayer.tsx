import { useEffect, useRef, useState } from 'react'
import { Hand, Video, VideoOff, X } from 'lucide-react'
import { PART_BY_ID } from '@/data'
import { useAtlas } from '@/store/useAtlas'
import { useL } from '@/i18n'
import { activeScene } from '@/scene/sceneRef'
import { HandsEngine } from './engine'
import { useHands } from './useHands'
import { HAND_STRINGS } from './strings'
import { synthFrame, synthHand } from './synth'

/**
 * Hand control: the person's own hands drawn over the atlas (their canvas sits
 * above everything but never takes a pointer event), a cursor ring that names
 * what the index finger points at, and a small glass panel with the camera
 * picture and the current gesture.
 */
export function HandsLayer() {
  const status = useHands((s) => s.status)
  const source = useHands((s) => s.source)
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
    if (import.meta.env.DEV) (window as unknown as { __handsDev: object }).__handsDev = { engine: eng, synthHand, synthFrame }
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
  }, [active, source])

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
  const { status, error, preview, count, gesture, setPreview, stop, start, source } = useHands()
  const pv = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!engine) return
    engine.setPreviewCanvas(preview && source === 'camera' ? pv.current : null)
    return () => engine.setPreviewCanvas(null)
  }, [engine, preview, source, status])

  const hint =
    status === 'starting' ? t.starting : status === 'error' ? t[error ?? 'load'] : count === 0 ? t.noHands : gesture === 'grab' ? t.grab : gesture === 'zoom' ? t.zoom : t.point

  return (
    <div className={`hands-hud glass ${status}`} role="status" aria-live="polite">
      <div className="hands-hud-row">
        <Hand size={16} className="hands-hud-icon" />
        <span className="hands-hud-title">{t.title}</span>
        <span className="hands-dots" aria-hidden>
          <i className={count >= 1 ? 'on' : ''} />
          <i className={count >= 2 ? 'on' : ''} />
        </span>
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
