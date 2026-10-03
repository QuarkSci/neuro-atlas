import { useEffect, useRef, useState } from 'react'
import { LAYER_BY_ID, SYSTEM_BY_ID } from '@/data'
import type { Section } from '@/data/sections'
import type { LayerId, Part } from '@/data/types'
import { atlasSlice, type AtlasSlice, type SliceRegion } from '@/scene/atlasSlice'
import { LAYER_COLORS } from '@/scene/materials'
import { useL, useT } from '@/i18n'
import { mix } from './sectionLayout'

const BASE = '#161b23'

/** Stable per-structure colour: hue from the concept id around the layer's own tint, like the 3D parcellation colours. */
export function regionColor(part: Part): string {
  if (part.system === 'ventricles') return '#6fb7de'
  if (part.system === 'white-matter') return '#cfc8b8'
  if (part.system === 'arteries') return '#d8524e'
  if (part.system === 'veins') return '#5f6fc4'
  let h = 0
  for (const ch of part.concept) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const base = LAYER_COLORS[part.layer]
  const r = parseInt(base.slice(1, 3), 16) / 255,
    g = parseInt(base.slice(3, 5), 16) / 255,
    b = parseInt(base.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let hue = 0
  if (max !== min) hue = max === r ? ((g - b) / (max - min) + 6) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4
  const spread = part.layer === 'gross' ? 0.5 : 0.36
  const step = ((h % 997) * 0.6180339887) % 1
  const hh = ((hue / 6 + (step - 0.5) * spread + 1) % 1) * 360
  const l = 50 + ((h >> 4) % 5) * 3
  return hslHex(hh, 0.55, l / 100)
}

function hslHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))))
  return `#${((f(0) << 16) | (f(8) << 8) | f(4)).toString(16).padStart(6, '0')}`
}

export function regionPath(r: SliceRegion) {
  return r.loops.map((l) => `M${l.map(([x, y]) => `${x.toFixed(2)},${(-y).toFixed(2)}`).join('L')}Z`).join('')
}

if (import.meta.env.DEV) (window as unknown as { __atlasSlice: typeof atlasSlice }).__atlasSlice = atlasSlice

export function useAtlasSlice(section: Section, layers: LayerId[], enabled: boolean) {
  const [state, setState] = useState<{
    id: string
    data: AtlasSlice | null
    error?: boolean
  } | null>(null)
  useEffect(() => {
    if (!enabled) return
    let live = true
    setState(null)
    atlasSlice(section, layers)
      .then((data) => live && setState({ id: section.id, data }))
      .catch(() => live && setState({ id: section.id, data: null, error: true }))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id, layers.join(','), enabled])
  return state && state.id === section.id ? state : null
}

/**
 * The real atlas at this level: every mesh of the cut's layers sliced by the
 * section's own plane and drawn as filled, outlined regions in millimetres —
 * what the 3D cut face shows, flattened and labelled. Hovering reads out the
 * structure, its source atlas and the MNI coordinate under the cursor.
 */
export function AtlasSliceView({
  section,
  slice,
  selected,
  highlightConcept,
  labels,
  axes,
  onPick,
}: {
  section: Section
  slice: AtlasSlice
  selected: string | null
  highlightConcept: string | null
  labels: boolean
  axes: [string, string, string, string]
  onPick: (id: string | null) => void
}) {
  const l = useL()
  const t = useT()
  const svg = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [cursor, setCursor] = useState<[number, number] | null>(null)
  const [x0, y0, x1, y1] = slice.window
  const w = x1 - x0,
    h = y1 - y0
  const pad = Math.max(w, h) * 0.07
  const vb = `${x0 - pad} ${-y1 - pad} ${w + pad * 2} ${h + pad * 2}`
  const active = hover ?? selected
  const font = Math.max(w, h) / 46
  const bar = w > 60 ? 10 : 5

  const move = (e: React.PointerEvent) => {
    const el = svg.current
    const m = el?.getScreenCTM()
    if (!el || !m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    setCursor([p.x, -p.y])
  }
  const hovered = hover ? slice.regions.find((r) => r.part.id === hover) : undefined
  const mni = cursor ? slice.toMNI(cursor[0], cursor[1]) : null
  const ordered = slice.regions

  return (
    <div className="as-wrap">
      <svg
        ref={svg}
        className="sv-svg as-svg"
        viewBox={vb}
        onPointerMove={move}
        onPointerLeave={() => setCursor(null)}
        onClick={() => onPick(null)}
        role="img"
        aria-label={section.code}
      >
        <defs>
          <clipPath id="as-window">
            <rect x={x0} y={-y1} width={w} height={h} rx={Math.min(w, h) * 0.06} />
          </clipPath>
        </defs>
        <rect className="as-field" x={x0} y={-y1} width={w} height={h} rx={Math.min(w, h) * 0.06} />
        <g clipPath="url(#as-window)">
          {ordered.map((r) => {
            const color = regionColor(r.part)
            const on = active === r.part.id || (!!highlightConcept && r.part.concept === highlightConcept)
            const dim = !!active && !on
            return (
              <path
                key={r.part.id}
                d={regionPath(r)}
                fillRule="evenodd"
                fill={mix(color, BASE, on ? 0.85 : 0.62)}
                stroke={on ? '#fff' : mix(color, '#000000', 0.55)}
                strokeWidth={on ? 2 : 0.9}
                vectorEffect="non-scaling-stroke"
                className={`as-region ${dim ? 'dim' : ''}`}
                onPointerEnter={() => setHover(r.part.id)}
                onPointerLeave={() => setHover(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  onPick(r.part.id)
                }}
              />
            )
          })}
          {labels &&
            placeLabels(ordered, (r) => short(l(r.part.name)), font, (w * h) / 400, slice.window).map((p) => (
              <text key={`t-${p.id}`} className="as-label" x={p.x} y={-p.y} fontSize={font} textAnchor="middle" dominantBaseline="central">
                {p.text}
              </text>
            ))}
        </g>
        <rect className="as-frame" x={x0} y={-y1} width={w} height={h} rx={Math.min(w, h) * 0.06} vectorEffect="non-scaling-stroke" />
        <text className="as-axis" x={x0 + w / 2} y={-y1 - pad * 0.35} fontSize={font} textAnchor="middle">
          {axes[0]}
        </text>
        <text className="as-axis" x={x0 + w / 2} y={-y0 + pad * 0.7} fontSize={font} textAnchor="middle">
          {axes[1]}
        </text>
        <text className="as-axis" x={x0 - pad * 0.3} y={-(y0 + y1) / 2} fontSize={font} textAnchor="end" dominantBaseline="middle">
          {axes[2]}
        </text>
        <text className="as-axis" x={x1 + pad * 0.3} y={-(y0 + y1) / 2} fontSize={font} textAnchor="start" dominantBaseline="middle">
          {axes[3]}
        </text>
        {/* Scale bar, millimetres */}
        <g className="as-scale">
          <line x1={x0 + w * 0.04} y1={-y0 - h * 0.05} x2={x0 + w * 0.04 + bar} y2={-y0 - h * 0.05} vectorEffect="non-scaling-stroke" />
          <text x={x0 + w * 0.04 + bar / 2} y={-y0 - h * 0.05 - font * 0.5} fontSize={font * 0.85} textAnchor="middle">
            {bar} mm
          </text>
        </g>
      </svg>
      <div className="as-readout">
        {hovered ? (
          <>
            <b>{l(hovered.part.name)}</b>
            <span>
              {l(LAYER_BY_ID.get(hovered.part.layer)!.short ?? LAYER_BY_ID.get(hovered.part.layer)!.name)} ·{' '}
              {SYSTEM_BY_ID.get(hovered.part.system) ? l(SYSTEM_BY_ID.get(hovered.part.system)!.name) : ''} · {hovered.area.toFixed(1)} mm²
            </span>
          </>
        ) : (
          <span>{t.asHint}</span>
        )}
        {mni && (
          <code>
            MNI x {fmt(mni[0])} · y {fmt(mni[1])} · z {fmt(mni[2])} mm
          </code>
        )}
      </div>
    </div>
  )
}

const fmt = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1)
/** Drop the side prefix and anything in brackets so in-figure labels stay short. */
function short(name: string) {
  const s = name
    .replace(/^(Left|Right|Chap|O'ng)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Greedy label placement, largest region first: a label sits at its
 * region's widest interior point and is dropped if it would collide with
 * one already placed — a clean subset beats a pile of overlapping names.
 */
function placeLabels(regions: SliceRegion[], name: (r: SliceRegion) => string, font: number, minArea: number, [wx0, wy0, wx1, wy1]: [number, number, number, number]) {
  const placed: {
    id: string
    text: string
    x: number
    y: number
    w: number
    h: number
  }[] = []
  const seen = new Set<string>()
  for (const r of regions) {
    if (r.area < minArea) continue
    const text = name(r)
    // One label per concept and side is enough; mirror twins both keep theirs.
    const key = `${r.part.concept}|${r.part.side}`
    if (seen.has(key)) continue
    const [x, y] = interior(r.loops)
    const w = text.length * font * 0.56,
      h = font * 1.2
    // Keep the whole label inside the field of view.
    if (x - w / 2 < wx0 || x + w / 2 > wx1 || y - h / 2 < wy0 || y + h / 2 > wy1) continue
    if (placed.some((p) => Math.abs(p.x - x) < (p.w + w) / 2 && Math.abs(p.y - y) < (p.h + h) / 2)) continue
    seen.add(key)
    placed.push({ id: r.part.id, text, x, y, w, h })
  }
  return placed
}

/** A point well inside the largest loop: the grid point farthest from its edge. */
function interior(loops: [number, number][][]): [number, number] {
  const loop = loops.reduce((a, b) => (b.length > a.length ? b : a))
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  for (const [x, y] of loop) {
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x)
    y1 = Math.max(y1, y)
  }
  const step = Math.max(x1 - x0, y1 - y0) / 24
  let best: [number, number] = [(x0 + x1) / 2, (y0 + y1) / 2],
    score = -1
  for (let y = y0 + step / 2; y < y1; y += step)
    for (let x = x0 + step / 2; x < x1; x += step) {
      let inside = false
      let d = Infinity
      for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
        const [xi, yi] = loop[i],
          [xj, yj] = loop[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
        const dx = xj - xi,
          dy = yj - yi
        const t = Math.max(0, Math.min(1, ((x - xi) * dx + (y - yi) * dy) / (dx * dx + dy * dy || 1)))
        d = Math.min(d, Math.hypot(x - xi - t * dx, y - yi - t * dy))
      }
      if (inside && d > score) {
        score = d
        best = [x, y]
      }
    }
  return best
}
