import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { LAYER_BY_ID, SYSTEM_BY_ID } from '@/data'
import type { Section } from '@/data/sections'
import { REAL_SOURCES, realSliceUrl, type RealSlice } from '@/data/sections/real'
import type { LayerId, Part } from '@/data/types'
import { atlasSlice, type AtlasSlice, type SliceRegion } from '@/scene/atlasSlice'
import { LAYER_COLORS } from '@/scene/materials'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { mix } from './sectionLayout'

const BASE = '#161b23'
/** Regions larger than this (mm²) are not outlined over a real slice. */
const REAL_MAX_AREA = 400

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
  const known = PATHS.get(r)
  if (known) return known
  const d = r.loops.map((l) => `M${l.map(([x, y]) => `${x.toFixed(2)},${(-y).toFixed(2)}`).join('L')}Z`).join('')
  PATHS.set(r, d)
  return d
}
/** A region's path string is built once: a slice has thousands of outline points and the figure re-renders on hover. */
const PATHS = new WeakMap<SliceRegion, string>()

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
  real,
  contours = true,
  marks,
  focal,
}: {
  section: Section
  slice: AtlasSlice
  /** A real image slice to draw under the regions; they then become dashed outlines. */
  real?: RealSlice
  /** Outline visibility in the real view (off = the bare slice). */
  contours?: boolean
  /** Schematic numbers by part id: the same badge the drawn plate uses, set on the matching atlas region. */
  marks?: Map<string, SliceMark>
  selected: string | null
  highlightConcept: string | null
  labels: boolean
  axes: [string, string, string, string]
  onPick: (id: string | null) => void
  /** Free lesions on this cut (mm, cut plane) and, in point mode, a click that drops one. */
  focal?: FocalOnCut
}) {
  const l = useL()
  const t = useT()
  const svg = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  // The MNI cursor lives in the readout only: setting it here re-rendered the whole figure on every pointer move.
  const setCursor = useRef<((c: [number, number] | null) => void) | null>(null)
  // The image dictates the window it was cut for; the live slice normally agrees.
  const [x0, y0, x1, y1] = real ? real.window : slice.window
  const w = x1 - x0,
    h = y1 - y0
  // Side margins hold the axis words; top and bottom only a line of text, so the slice gets the height.
  const pad = Math.max(w, h) * 0.07
  const padY = Math.max(w, h) * 0.034
  const vb = `${x0 - pad} ${-y1 - padY} ${w + pad * 2} ${h + padY * 2}`
  const active = hover ?? selected
  const font = Math.max(w, h) / 46
  const bar = w > 60 ? 10 : 5

  // Pointer → cut plane (a, b mm); the figure draws b upwards.
  const toCut = (e: { clientX: number; clientY: number }): [number, number] | null => {
    const m = svg.current?.getScreenCTM()
    if (!m) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return [p.x, -p.y]
  }
  const move = (e: React.PointerEvent) => {
    const c = toCut(e)
    if (c) setCursor.current?.(c)
  }
  const placing = !!focal?.onPlace
  // What the active lesion takes in on the atlas itself: the share of the disc in each region of the cut.
  const activeDisc = focal?.discs.find((d) => d.active)
  // Keyed on the numbers: the disc object is new on every render (hovering a region re-renders the figure).
  const [da, db, dr] = activeDisc ? [activeDisc.a, activeDisc.b, activeDisc.r] : [0, 0, 0]
  const under = useMemo(() => (dr > 0 ? regionsUnder(slice.regions, { a: da, b: db, r: dr }) : []), [da, db, dr, slice.regions])
  const hovered = hover ? slice.regions.find((r) => r.part.id === hover) : undefined
  const ordered = slice.regions
  const showNames = labels && (!real || contours)
  // `l` is a new function each render; the language is what the names depend on.
  const lang = useAtlas((s) => s.lang)
  // Label and badge placement search the outlines: computed once per figure, not per hover.
  const named = useMemo(
    () => (showNames ? placeLabels(ordered, (r) => short(l(r.part.name)), font, (w * h) / 400, slice.window) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showNames, ordered, lang, font, w, h, slice.window],
  )
  const badgeR = font * 0.92
  const badges = useMemo(
    () => (marks ? placeMarks(ordered, marks, badgeR, [x0, y0, x1, y1], new Set(named.map((p) => p.id)), font * 1.5, [x0 + w * 0.04 + bar, y0 + h * 0.05 + font * 1.6]) : []),
    [marks, ordered, badgeR, x0, y0, x1, y1, named, font, w, h, bar],
  )

  return (
    <div className="as-wrap">
      <svg
        ref={svg}
        viewBox={vb}
        onPointerMove={move}
        onPointerLeave={() => setCursor.current?.(null)}
        onClick={(e) => {
          const c = placing ? toCut(e) : null
          if (c) {
            // Not a tap on empty space (ZoomPane would go full screen).
            e.stopPropagation()
            focal!.onPlace!(c[0], c[1])
          } else onPick(null)
        }}
        className={`sv-svg as-svg ${placing ? 'placing' : ''}`}
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
          {real && <image href={realSliceUrl(real)} x={x0} y={-y1} width={w} height={h} preserveAspectRatio="none" className="as-real" />}
          {ordered.map((r) => {
            const color = regionColor(r.part)
            const on = active === r.part.id || (!!highlightConcept && r.part.concept === highlightConcept)
            const dim = !!active && !on
            // Lobe-sized territories (lobar white matter, unmapped cortex) would only bury the slice in lines.
            if (real && r.area > REAL_MAX_AREA && !on) return null
            if (real)
              // Over a real slice the tissue must stay visible: a dashed border, a tint only when picked.
              return (
                <path
                  key={r.part.id}
                  d={regionPath(r)}
                  fillRule="evenodd"
                  fill={color}
                  fillOpacity={on ? 0.3 : 0}
                  stroke={on ? '#fff' : color}
                  strokeWidth={on ? 2.2 : 1.5}
                  strokeDasharray={on ? undefined : '5 4'}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="all"
                  className={`as-region as-outline ${dim ? 'dim' : ''} ${contours || on ? '' : 'off'}`}
                  onPointerEnter={() => setHover(r.part.id)}
                  onPointerLeave={() => setHover(null)}
                  onClick={(e) => {
                    if (placing) return
                    e.stopPropagation()
                    onPick(r.part.id)
                  }}
                />
              )
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
                  if (placing) return
                  e.stopPropagation()
                  onPick(r.part.id)
                }}
              />
            )
          })}
          {named.map((p) => (
            <text key={`t-${p.id}`} className="as-label" x={p.x} y={-p.y} fontSize={font} textAnchor="middle" dominantBaseline="central">
              {p.text}
            </text>
          ))}
          {badges.map((b) => {
            const on = active === b.id
            return (
              <g
                key={`m-${b.id}`}
                className={`as-mark ${on ? 'active' : ''} ${active && !on ? 'dim' : ''}`}
                onPointerEnter={() => setHover(b.id)}
                onPointerLeave={() => setHover(null)}
                onClick={(e) => {
                  if (placing) return
                  e.stopPropagation()
                  onPick(b.id)
                }}
              >
                {b.moved && (
                  <>
                    <line x1={b.hx} y1={-b.hy} x2={b.x} y2={-b.y} stroke={b.color} vectorEffect="non-scaling-stroke" />
                    <circle className="as-mark-dot" cx={b.hx} cy={-b.hy} r={badgeR * 0.22} fill={b.color} />
                  </>
                )}
                <rect x={b.x - b.hw} y={-b.y - badgeR} width={b.hw * 2} height={badgeR * 2} rx={badgeR} stroke={b.color} vectorEffect="non-scaling-stroke" />
                <text x={b.x} y={-b.y} fontSize={badgeR * 1.05} textAnchor="middle" dominantBaseline="central">
                  {b.text}
                </text>
              </g>
            )
          })}
          {focal?.discs.map((d) => (
            <g key={`f-${d.n}`} className={`as-focus ${d.active ? 'active' : ''} ${d.gd ? 'gd' : ''}`}>
              <circle cx={d.a} cy={-d.b} r={d.r} vectorEffect="non-scaling-stroke" />
              <circle className="pin" cx={d.a} cy={-d.b} r={font * 0.62} vectorEffect="non-scaling-stroke" />
              <text x={d.a} y={-d.b} fontSize={font * 0.8} textAnchor="middle" dominantBaseline="central">
                {d.n}
              </text>
            </g>
          ))}
        </g>
        <rect className="as-frame" x={x0} y={-y1} width={w} height={h} rx={Math.min(w, h) * 0.06} vectorEffect="non-scaling-stroke" />
        <text className="as-axis" x={x0 + w / 2} y={-y1 - padY * 0.3} fontSize={font} textAnchor="middle">
          {axes[0]}
        </text>
        <text className="as-axis" x={x0 + w / 2} y={-y0 + padY * 0.72} fontSize={font} textAnchor="middle">
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
      {real && (
        <p className="as-credit">
          <a href={REAL_SOURCES[real.source].url} target="_blank" rel="noreferrer">
            {REAL_SOURCES[real.source].label}
          </a>{' '}
          · {REAL_SOURCES[real.source].license} · {Math.round(real.mmPerPx * 1000)} µm/px
        </p>
      )}
      <div className="as-readout">
        {under.length > 0 && !hovered ? (
          <span className="as-under">
            <b>{t.asUnder}</b>{' '}
            {under
              .slice(0, 6)
              .map((u) => `${short(l(u.part.name))} ${Math.round(u.share * 100)}%`)
              .join(' · ')}
          </span>
        ) : hovered ? (
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
        <MniCursor slice={slice} bind={setCursor} />
      </div>
    </div>
  )
}

/** Free lesions drawn on the cut (centre and radius in mm on the cut plane). */
export interface FocalOnCut {
  discs: { a: number; b: number; r: number; n: number; active: boolean; gd?: boolean }[]
  onPlace?: (a: number, b: number) => void
}

/** Even-odd: inside a region whose outline may have holes. */
function inLoops(loops: [number, number][][], x: number, y: number) {
  let c = false
  for (const l of loops)
    for (let i = 0, j = l.length - 1; i < l.length; j = i++) {
      const [xi, yi] = l[i],
        [xj, yj] = l[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
    }
  return c
}

/** Atlas regions under a disc, by the share of the disc (a grid over it) each covers. Finer layers overlap coarser ones, so shares need not sum to 1. */
function regionsUnder(regions: SliceRegion[], d: { a: number; b: number; r: number }) {
  const pts: [number, number][] = []
  const n = 15
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = d.a - d.r + ((i + 0.5) * 2 * d.r) / n
      const y = d.b - d.r + ((j + 0.5) * 2 * d.r) / n
      if ((x - d.a) ** 2 + (y - d.b) ** 2 <= d.r * d.r) pts.push([x, y])
    }
  return regions
    .map((r) => ({ part: r.part, share: pts.filter(([x, y]) => inLoops(r.loops, x, y)).length / pts.length }))
    .filter((u) => u.share >= 0.05)
    .sort((a, b) => b.share - a.share)
}

/** The MNI coordinate under the pointer: its own state, so a pointer move repaints one line. */
function MniCursor({ slice, bind }: { slice: AtlasSlice; bind: MutableRefObject<((c: [number, number] | null) => void) | null> }) {
  const [cursor, setCursor] = useState<[number, number] | null>(null)
  useEffect(() => {
    bind.current = setCursor
    return () => {
      bind.current = null
    }
  }, [bind])
  const mni = cursor ? slice.toMNI(cursor[0], cursor[1]) : null
  return mni ? (
    <code>
      MNI x {fmt(mni[0])} · y {fmt(mni[1])} · z {fmt(mni[2])} mm
    </code>
  ) : null
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

export interface SliceMark {
  /**
   * Numbers of the plate structures this atlas region stands for. Usually one;
   * several when the atlas is coarser than the drawing (one pallidum mesh for
   * GPe, GPi and the lamina between them) — the badge then lists them all.
   */
  ns: number[]
  color: string
  /** Schematic structure ids, parallel to `ns`. */
  items: string[]
}

/**
 * Number badges for the regions that have a schematic counterpart, largest
 * region first. A badge sits at its region's interior point; when that spot
 * is taken (or a name label is there) it steps aside on a short leader.
 */
function placeMarks(
  regions: SliceRegion[],
  marks: Map<string, SliceMark>,
  r: number,
  [wx0, wy0, wx1, wy1]: [number, number, number, number],
  labelled: Set<string>,
  lift: number,
  [sx, sy]: [number, number],
) {
  const out: { id: string; text: string; color: string; x: number; y: number; hw: number; hx: number; hy: number; moved: boolean }[] = []
  let hw = r
  // The scale bar keeps its corner (bottom-left, up to sx / sy).
  const free = (x: number, y: number) =>
    !(x - hw < sx && y - r < sy) &&
    x - hw > wx0 &&
    x + hw < wx1 &&
    y - r > wy0 &&
    y + r < wy1 &&
    !out.some((p) => Math.abs(p.x - x) < (p.hw + hw) * 1.06 && Math.abs(p.y - y) < r * 2.12)
  for (const reg of regions) {
    const m = marks.get(reg.part.id)
    // Slivers under ~0.5 mm² are cut edges of a nucleus, not a level it belongs to.
    if (!m || reg.area < 0.5) continue
    // More than three would bury the tissue: the first two and a count, the side panel lists them all.
    const text = m.ns.length > 3 ? `${m.ns[0]}·${m.ns[1]} +${m.ns.length - 2}` : m.ns.join('·')
    // A pill as wide as its text: one or two digits fit the circle.
    hw = Math.max(r, r * 0.42 + text.length * r * 0.31)
    const [hx, hy] = interior(reg.loops)
    if (hx < wx0 || hx > wx1 || hy < wy0 || hy > wy1) continue
    let spot: [number, number] | null = !labelled.has(reg.part.id) && free(hx, hy) ? [hx, hy] : null
    if (!spot && labelled.has(reg.part.id) && free(hx, hy + lift)) spot = [hx, hy + lift]
    for (let k = 1; !spot && k <= 3; k++)
      for (let a = 0; !spot && a < 12; a++) {
        const x = hx + Math.cos((a * Math.PI) / 6) * (hw + r) * 1.15 * k,
          y = hy + Math.sin((a * Math.PI) / 6) * r * 2.3 * k
        if (free(x, y)) spot = [x, y]
      }
    if (!spot) continue
    out.push({ id: reg.part.id, text, color: m.color, x: spot[0], y: spot[1], hw, hx, hy, moved: Math.hypot(spot[0] - hx, spot[1] - hy) > r * 1.6 })
  }
  return out
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
