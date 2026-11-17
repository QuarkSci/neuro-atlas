import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Maximize2, Minimize2, Minus, Plus, RotateCcw } from 'lucide-react'

type View = { k: number; x: number; y: number }
const ID: View = { k: 1, x: 0, y: 0 }
const MAX = 8

/**
 * Zoom and pan for a plate figure: wheel / pinch zoom about the pointer,
 * drag to pan, double-click to zoom in, buttons for keyboard and touch.
 * The figure is a vector SVG scaled by a CSS transform, which the browser
 * re-rasterises once the transform settles, so lines and numbers stay sharp
 * (only an embedded raster — the real slice — shows its own resolution).
 * Number badges grow only with √zoom (`--zs`) so they label the detail
 * instead of covering it.
 * A drag never turns into a click on the structure under it.
 */
export function ZoomPane({
  children,
  resetKey,
  full,
  onFull,
  labels,
}: {
  children: ReactNode
  /** Changing it (another plate or view) returns to the whole figure. */
  resetKey: string
  full: boolean
  onFull: (v: boolean) => void
  labels: { zoomIn: string; zoomOut: string; reset: string; full: string; exitFull: string }
}) {
  const box = useRef<HTMLDivElement>(null)
  const [v, setV] = useState<View>(ID)
  const view = useRef(v)
  view.current = v
  const drag = useRef<{ pts: Map<number, { x: number; y: number }>; moved: boolean; last?: { x: number; y: number; d: number } }>({ pts: new Map(), moved: false })

  useEffect(() => setV(ID), [resetKey])

  /** Zoom to scale k keeping the box point (px, py) fixed; clamped so the figure never leaves the box. */
  const zoomAt = (k: number, px: number, py: number, from = view.current) => {
    const el = box.current
    if (!el) return
    const nk = Math.min(MAX, Math.max(1, k))
    const r = nk / from.k
    setV(clamp({ k: nk, x: px - (px - from.x) * r, y: py - (py - from.y) * r }, el))
  }
  const clamp = (n: View, el: HTMLElement): View => {
    const w = el.clientWidth,
      h = el.clientHeight
    return { k: n.k, x: Math.min(0, Math.max(w - w * n.k, n.x)), y: Math.min(0, Math.max(h - h * n.k, n.y)) }
  }
  const local = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  // Wheel needs a non-passive listener to keep the page from scrolling.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = local(e)
      const step = e.ctrlKey ? 0.01 : 0.0018 // trackpad pinch arrives as ctrl+wheel
      zoomAt(view.current.k * Math.exp(-e.deltaY * step), p.x, p.y)
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const down = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const d = drag.current
    d.pts.set(e.pointerId, local(e))
    if (d.pts.size === 1) d.moved = false
    d.last = undefined
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.pts.has(e.pointerId)) return
    const start = d.pts.get(e.pointerId)!
    const p = local(e)
    if (d.pts.size >= 2) {
      // Pinch: scale by the change in finger distance about their midpoint.
      d.pts.set(e.pointerId, p)
      const [a, b] = [...d.pts.values()]
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }
      if (d.last && d.last.d > 0) {
        const cur = view.current
        const nk = Math.min(MAX, Math.max(1, (cur.k * mid.d) / d.last.d))
        const r = nk / cur.k
        setV(clamp({ k: nk, x: mid.x - (d.last.x - cur.x) * r, y: mid.y - (d.last.y - cur.y) * r }, box.current!))
      }
      d.last = mid
      d.moved = true
      return
    }
    const dx = p.x - start.x,
      dy = p.y - start.y
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) box.current?.setPointerCapture(e.pointerId)
    d.moved = true
    d.pts.set(e.pointerId, p)
    if (view.current.k > 1) setV((c) => clamp({ k: c.k, x: c.x + dx, y: c.y + dy }, box.current!))
  }
  const up = (e: React.PointerEvent) => {
    drag.current.pts.delete(e.pointerId)
    drag.current.last = undefined
  }
  // A drag or pinch is not a pick.
  const clickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.stopPropagation()
      e.preventDefault()
      drag.current.moved = false
    }
  }
  const dbl = (e: React.MouseEvent) => {
    const p = local(e)
    if (view.current.k >= MAX / 2) setV(ID)
    else zoomAt(view.current.k * 2, p.x, p.y)
  }
  const centre = () => ({ x: (box.current?.clientWidth ?? 0) / 2, y: (box.current?.clientHeight ?? 0) / 2 })

  return (
    <div
      ref={box}
      className={`sv-zoom ${v.k > 1 ? 'zoomed' : ''}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClickCapture={clickCapture}
      onDoubleClick={dbl}
    >
      <div className="sv-zoom-inner" style={{ transform: `translate(${v.x}px, ${v.y}px) scale(${v.k})`, '--zs': Math.sqrt(v.k) } as React.CSSProperties}>
        {children}
      </div>
      <div className="sv-zoom-ctl" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
        <button onClick={() => zoomAt(v.k * 1.5, centre().x, centre().y)} disabled={v.k >= MAX} aria-label={labels.zoomIn} title={labels.zoomIn}>
          <Plus size={14} />
        </button>
        <button onClick={() => zoomAt(v.k / 1.5, centre().x, centre().y)} disabled={v.k <= 1} aria-label={labels.zoomOut} title={labels.zoomOut}>
          <Minus size={14} />
        </button>
        {v.k > 1 && (
          <button onClick={() => setV(ID)} aria-label={labels.reset} title={labels.reset}>
            <RotateCcw size={13} />
            <span>{Math.round(v.k * 100)}%</span>
          </button>
        )}
        <button className={full ? 'on' : ''} onClick={() => onFull(!full)} aria-label={full ? labels.exitFull : labels.full} title={full ? labels.exitFull : labels.full}>
          {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  )
}
