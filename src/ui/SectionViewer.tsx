import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Box, ChevronLeft, ChevronRight, Eye, EyeOff, GraduationCap, Hash, Shuffle, Tags, X } from 'lucide-react'
import { CONCEPT_BY_ID, conceptLeafIds } from '@/data'
import { SECTIONS, SECTION_BY_ID, SECTION_REGIONS, STRUCTURE_BY_ID, type Section, type SectionItem, type Shape } from '@/data/sections'
import { mirrorShape, shapeCentre, shapePath } from '@/data/sections/shapes'
import type { LayerId } from '@/data/types'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { CATEGORY, CATEGORY_ORDER, FIBRE } from './sectionStyle'

/** Layers whose meshes make the 3D cut face informative for each region. */
const CUT_LAYERS: Record<Section['region'], LayerId[]> = {
  medulla: ['gross', 'bstem', 'suit'],
  pons: ['gross', 'bstem', 'suit'],
  midbrain: ['gross', 'bstem'],
  diencephalon: ['gross', 'julich'],
  hypothalamus: ['gross'],
  cerebellum: ['gross', 'suit', 'bstem'],
}

interface Numbered {
  item: SectionItem
  n: number
}

/** Shapes of an item including its mirrored copy, flagged so only the original carries the badge. */
function itemShapes(section: Section, item: SectionItem): Shape[] {
  const cx = section.w / 2
  return item.mirror ? [...item.shapes, ...item.shapes.map((s) => mirrorShape(s, cx))] : item.shapes
}

/**
 * The cross-section atlas: one textbook transverse (or coronal) level at a
 * time, drawn as a numbered schematic with every structure clickable for
 * its function, connections and lesion picture, plus the level's blood
 * supply and classic syndromes. A quiz mode hides the names for self-test.
 */
export function SectionViewer() {
  const t = useT()
  const l = useL()
  const { sectionId, openSection, cutSection, selectParts, lang } = useAtlas()
  const section = sectionId ? SECTION_BY_ID.get(sectionId) : undefined
  const [selected, setSelected] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [labels, setLabels] = useState(false)
  const [numbers, setNumbers] = useState(true)
  const [quiz, setQuiz] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'structures' | 'level'>('structures')
  const [focusCat, setFocusCat] = useState<string | null>(null)

  // A new section starts clean.
  useEffect(() => {
    setSelected(null)
    setHover(null)
    setRevealed(new Set())
    setFocusCat(null)
  }, [sectionId])

  useEffect(() => {
    if (!section) return
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') openSection(null)
      const i = SECTIONS.findIndex((s) => s.id === section.id)
      if (e.key === 'ArrowRight' && i < SECTIONS.length - 1) openSection(SECTIONS[i + 1].id)
      if (e.key === 'ArrowLeft' && i > 0) openSection(SECTIONS[i - 1].id)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [section, openSection])

  const numbered: Numbered[] = useMemo(() => (section ? section.items.map((item, i) => ({ item, n: i + 1 })) : []), [section])
  const cats = useMemo(() => {
    const present = new Set(numbered.map(({ item }) => STRUCTURE_BY_ID.get(item.id)?.cat).filter(Boolean))
    return CATEGORY_ORDER.filter((c) => present.has(c))
  }, [numbered])

  if (!section) return null
  const index = SECTIONS.findIndex((s) => s.id === section.id)
  const prev = SECTIONS[index - 1],
    next = SECTIONS[index + 1]
  const active = hover ?? selected
  const sel = selected ? numbered.find((x) => x.item.id === selected) : undefined
  const selInfo = sel ? STRUCTURE_BY_ID.get(sel.item.id) : undefined
  const hidden = (id: string) => quiz && !revealed.has(id)
  const nameOf = (item: SectionItem) => {
    const info = STRUCTURE_BY_ID.get(item.id)
    return info ? l(info.name) : item.id
  }
  const pick = (id: string) => {
    setSelected(id)
    setTab('structures')
  }
  const randomQuiz = () => {
    const pool = numbered.filter(({ item }) => !revealed.has(item.id))
    if (!pool.length) return
    pick(pool[Math.floor(Math.random() * pool.length)].item.id)
  }
  const showIn3D = (concept: string) => {
    const ids = conceptLeafIds(concept)
    if (!ids.length) return
    openSection(null)
    selectParts(ids, { kind: 'concept', id: concept })
  }

  return (
    <div className="section-viewer" role="dialog" aria-modal="true" aria-label={l(section.title)} onClick={() => openSection(null)}>
      <div className="sv-card glass" onClick={(e) => e.stopPropagation()}>
        <header className="sv-head">
          <span className="sv-code">{section.code}</span>
          <div className="sv-heading">
            <h2>{l(section.title)}</h2>
            <p>{l(section.orientation)}</p>
          </div>
          <div className="sv-nav">
            <button className="sv-icon" disabled={!prev} onClick={() => prev && openSection(prev.id)} aria-label={t.svPrev} title={prev ? `${prev.code} · ${l(prev.title)}` : ''}>
              <ChevronLeft size={17} />
            </button>
            <button className="sv-icon" disabled={!next} onClick={() => next && openSection(next.id)} aria-label={t.svNext} title={next ? `${next.code} · ${l(next.title)}` : ''}>
              <ChevronRight size={17} />
            </button>
            {section.plane && (
              <button className="sv-cut" onClick={() => cutSection(section.id, CUT_LAYERS[section.region])} title={t.svCutHint}>
                <Box size={14} />
                <span>{t.svCut}</span>
              </button>
            )}
            <button className="sv-icon" onClick={() => openSection(null)} aria-label={t.close}>
              <X size={17} />
            </button>
          </div>
        </header>

        <nav className="sv-regions" aria-label={t.svLevels}>
          {SECTION_REGIONS.map((r) => {
            const list = SECTIONS.filter((s) => s.region === r.id)
            if (!list.length) return null
            return (
              <div className="sv-region" key={r.id}>
                <span>{l(r.name)}</span>
                {list.map((s) => (
                  <button key={s.id} className={`sv-chip ${s.id === section.id ? 'active' : ''}`} onClick={() => openSection(s.id)} title={l(s.title)}>
                    {s.code}
                  </button>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="sv-body">
          <div className="sv-figure">
            <div className="sv-tools">
              <button className={numbers ? 'on' : ''} onClick={() => setNumbers(!numbers)} title={t.svNumbers}>
                <Hash size={13} />
                <span>{t.svNumbers}</span>
              </button>
              <button className={labels ? 'on' : ''} onClick={() => setLabels(!labels)} disabled={quiz} title={t.svLabels}>
                <Tags size={13} />
                <span>{t.svLabels}</span>
              </button>
              <button
                className={quiz ? 'on quiz' : ''}
                onClick={() => {
                  setQuiz(!quiz)
                  setRevealed(new Set())
                  setLabels(false)
                  setSelected(null)
                }}
                title={t.svQuizHint}
              >
                <GraduationCap size={13} />
                <span>{t.svQuiz}</span>
              </button>
              {quiz && (
                <>
                  <button onClick={randomQuiz} title={t.svRandom}>
                    <Shuffle size={13} />
                    <span>{t.svRandom}</span>
                  </button>
                  <span className="sv-score">
                    {revealed.size}/{numbered.length}
                  </span>
                </>
              )}
            </div>
            <Figure
              section={section}
              numbered={numbered}
              active={active}
              selected={selected}
              focusCat={focusCat}
              numbers={numbers}
              labels={labels && !quiz}
              nameOf={nameOf}
              axes={section.axes.map((a) => l(a)) as [string, string, string, string]}
              onHover={setHover}
              onPick={pick}
            />
            <Locator section={section} onPick={(id) => openSection(id)} title={t.svLocator} />
            <div className="sv-legend">
              {cats.map((c) => (
                <button key={c} className={focusCat === c ? 'on' : focusCat ? 'dim' : ''} onClick={() => setFocusCat(focusCat === c ? null : c)}>
                  <i style={{ background: CATEGORY[c].color }} />
                  {l(CATEGORY[c].name)}
                </button>
              ))}
            </div>
          </div>

          <aside className="sv-side">
            <div className="sv-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'structures'} className={tab === 'structures' ? 'active' : ''} onClick={() => setTab('structures')}>
                {t.svStructures} <em>{numbered.length}</em>
              </button>
              <button role="tab" aria-selected={tab === 'level'} className={tab === 'level' ? 'active' : ''} onClick={() => setTab('level')}>
                {t.svLevel}
              </button>
            </div>

            {tab === 'structures' ? (
              <>
                {sel && selInfo && (
                  <div className="sv-detail" style={{ '--cat': CATEGORY[selInfo.cat].color } as React.CSSProperties}>
                    <div className="sv-detail-top">
                      <span className="sv-num">{sel.n}</span>
                      <span className="sv-cat">{l(CATEGORY[selInfo.cat].name)}</span>
                    </div>
                    {hidden(sel.item.id) ? (
                      <>
                        <h3 className="sv-quiz-q">{t.svWhat}</h3>
                        <button className="sv-reveal" onClick={() => setRevealed(new Set([...revealed, sel.item.id]))}>
                          <Eye size={14} /> {t.svReveal}
                        </button>
                      </>
                    ) : (
                      <>
                        <h3>
                          {l(selInfo.name)}
                          {sel.item.note && <small> — {l(sel.item.note)}</small>}
                        </h3>
                        {selInfo.name.la && <p className="sv-latin">{selInfo.name.la}</p>}
                        {lang !== 'en' && <p className="sv-en">{selInfo.name.en}</p>}
                        <p>{l(selInfo.info)}</p>
                        {selInfo.lesion && (
                          <p className="sv-lesion">
                            <b>{t.svLesion}</b> {l(selInfo.lesion)}
                          </p>
                        )}
                        {selInfo.part && CONCEPT_BY_ID.has(selInfo.part) && (
                          <button className="sv-3d" onClick={() => showIn3D(selInfo.part!)}>
                            <Box size={14} /> {t.svShow3D}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                {!sel && <p className="sv-hint">{quiz ? t.svQuizHint : t.svHint}</p>}
                <div className="sv-list">
                  {cats.map((c) => (
                    <div key={c} className="sv-group">
                      <div className="sv-group-name">
                        <i style={{ background: CATEGORY[c].color }} />
                        {l(CATEGORY[c].name)}
                      </div>
                      {numbered
                        .filter(({ item }) => STRUCTURE_BY_ID.get(item.id)?.cat === c)
                        .map(({ item, n }) => (
                          <button
                            key={item.id}
                            className={`sv-row ${selected === item.id ? 'active' : ''} ${hover === item.id ? 'hover' : ''}`}
                            onClick={() => pick(item.id)}
                            onPointerEnter={() => setHover(item.id)}
                            onPointerLeave={() => setHover(null)}
                          >
                            <span className="sv-num" style={{ borderColor: CATEGORY[c].color }}>
                              {n}
                            </span>
                            <span className="sv-row-name">{hidden(item.id) ? <EyeOff size={12} /> : nameOf(item)}</span>
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="sv-level">
                <h4>{t.svLandmarks}</h4>
                <p>{l(section.landmarks)}</p>
                <h4>{t.svBlood}</h4>
                <p>{l(section.blood)}</p>
                {section.syndromes.length > 0 && <h4>{t.svSyndromes}</h4>}
                {section.syndromes.map((s, i) => (
                  <div className="sv-syndrome" key={i}>
                    <b>{l(s.name)}</b>
                    <p>{l(s.text)}</p>
                  </div>
                ))}
                <h4>{t.sources}</h4>
                {section.sources.map((s) => (
                  <a key={s.url} className="source-link" href={s.url} target="_blank" rel="noreferrer">
                    {s.title} <ArrowUpRight size={12} />
                  </a>
                ))}
                <p className="sv-note">{t.svDisclaimer}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

/** The schematic itself. */
function Figure({
  section,
  numbered,
  active,
  selected,
  focusCat,
  numbers,
  labels,
  nameOf,
  axes,
  onHover,
  onPick,
}: {
  section: Section
  numbered: Numbered[]
  active: string | null
  selected: string | null
  focusCat: string | null
  numbers: boolean
  labels: boolean
  nameOf: (item: SectionItem) => string
  axes: [string, string, string, string]
  onHover: (id: string | null) => void
  onPick: (id: string) => void
}) {
  const regionName = useL()
  const pad = 26
  // Named mode: labels stack in a column on each side, joined to their
  // badge by a leader line (atlas style), so the figure itself stays clear.
  const side = labels ? 215 : 0
  const vb = `${-pad - side} ${-pad} ${section.w + (pad + side) * 2} ${section.h + pad * 2}`
  const layout = labels ? labelLayout(section, numbered) : null
  const cats = Object.keys(CATEGORY)
  return (
    <svg className="sv-svg" viewBox={vb} role="img" aria-label={section.code}>
      <defs>
        {cats.map((c) => (
          <pattern key={c} id={`hatch-${c}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={CATEGORY[c as keyof typeof CATEGORY].color} fillOpacity="0.28" />
            <line x1="0" y1="0" x2="0" y2="6" stroke={CATEGORY[c as keyof typeof CATEGORY].color} strokeWidth="2.2" strokeOpacity="0.85" />
          </pattern>
        ))}
      </defs>
      <text className="sv-axis" x={section.w / 2} y={-pad + 12} textAnchor="middle">
        {axes[0]}
      </text>
      <text className="sv-axis" x={section.w / 2} y={section.h + pad - 4} textAnchor="middle">
        {axes[1]}
      </text>
      <text className="sv-axis" x={-pad - side + 4} y={labels ? -pad + 12 : section.h / 2} textAnchor="start" dominantBaseline="middle">
        {axes[2]}
      </text>
      <text className="sv-axis" x={section.w + pad + side - 4} y={labels ? -pad + 12 : section.h / 2} textAnchor="end" dominantBaseline="middle">
        {axes[3]}
      </text>

      {section.outline.map((s, i) => {
        const p = shapePath(s)
        return p.stroke ? <path key={i} d={p.d} className="sv-outline-line" strokeWidth={p.w} /> : <path key={i} d={p.d} className="sv-outline" />
      })}
      {section.regions?.map((r, i) =>
        r.shapes.map((s, j) => {
          const p = shapePath(s)
          return p.stroke ? (
            <path key={`${i}-${j}`} d={p.d} className="sv-region-line" strokeWidth={p.w} strokeDasharray={p.dash ? '5 4' : undefined} />
          ) : (
            <path key={`${i}-${j}`} d={p.d} className="sv-region-fill" />
          )
        }),
      )}
      {section.regions?.map((r, i) =>
        r.label && r.at ? (
          <text key={`rl-${i}`} className="sv-region-label" x={r.at[0]} y={r.at[1]} textAnchor="middle">
            {regionName(r.label)}
          </text>
        ) : null,
      )}

      {numbered.map(({ item }) => {
        const info = STRUCTURE_BY_ID.get(item.id)
        if (!info) return null
        const color = CATEGORY[info.cat].color
        const fibre = FIBRE.has(item.id)
        const isActive = active === item.id
        const dim = (active && !isActive) || (focusCat && info.cat !== focusCat)
        return (
          <g
            key={item.id}
            className={`sv-item ${isActive ? 'active' : ''} ${selected === item.id ? 'selected' : ''} ${dim ? 'dim' : ''}`}
            onPointerEnter={() => onHover(item.id)}
            onPointerLeave={() => onHover(null)}
            onClick={() => onPick(item.id)}
          >
            {itemShapes(section, item).map((s, i) => {
              const p = shapePath(s)
              if (p.stroke)
                return (
                  <path key={i} d={p.d} fill="none" stroke={color} strokeWidth={p.w} strokeLinecap="round" strokeDasharray={p.dash ? '5 4' : undefined} className="sv-stroke" />
                )
              const csf = info.cat === 'csf'
              return (
                <path
                  key={i}
                  d={p.d}
                  fill={fibre ? `url(#hatch-${info.cat})` : color}
                  fillOpacity={fibre ? 1 : csf ? 0.32 : 0.55}
                  stroke={color}
                  strokeWidth={1.4}
                  className="sv-fill"
                />
              )
            })}
          </g>
        )
      })}

      {labels &&
        layout &&
        numbered.map(({ item }) => {
          const info = STRUCTURE_BY_ID.get(item.id)
          const L = layout.get(item.id)
          if (!info || !L) return null
          const dim = (active && active !== item.id) || (focusCat && info.cat !== focusCat)
          const edge = L.left ? -10 : section.w + 10
          return (
            <g key={`l-${item.id}`} className={`sv-leader ${dim ? 'dim' : ''} ${active === item.id ? 'active' : ''}`} onPointerEnter={() => onHover(item.id)} onPointerLeave={() => onHover(null)} onClick={() => onPick(item.id)}>
              <polyline points={`${L.x},${L.y} ${edge},${L.ly} ${L.left ? edge - 6 : edge + 6},${L.ly}`} stroke={CATEGORY[info.cat].color} />
              <text className="sv-label" x={L.left ? edge - 9 : edge + 9} y={L.ly} textAnchor={L.left ? 'end' : 'start'} dominantBaseline="central">
                {nameOf(item)}
              </text>
            </g>
          )
        })}
      {(numbers || labels) &&
        numbered.map(({ item, n }) => {
          const info = STRUCTURE_BY_ID.get(item.id)
          if (!info) return null
          const [x, y] = item.at ?? shapeCentre(item.shapes[0])
          const color = CATEGORY[info.cat].color
          const dim = (active && active !== item.id) || (focusCat && info.cat !== focusCat)
          return (
            <g key={`b-${item.id}`} className={`sv-badge ${dim ? 'dim' : ''} ${active === item.id ? 'active' : ''}`} onPointerEnter={() => onHover(item.id)} onPointerLeave={() => onHover(null)} onClick={() => onPick(item.id)}>
              {numbers ? (
                <>
                  <circle cx={x} cy={y} r={8.5} stroke={color} />
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
                    {n}
                  </text>
                </>
              ) : (
                <circle cx={x} cy={y} r={3} fill={color} stroke="none" />
              )}
            </g>
          )
        })}
    </svg>
  )
}

/**
 * Label column positions: each structure goes to the side its badge is on
 * (midline ones alternate), sorted top-to-bottom and pushed apart to a
 * minimum gap, then pulled back up if the column overruns the figure.
 */
function labelLayout(section: Section, numbered: Numbered[]) {
  const gap = 15
  const cx = section.w / 2
  const rows = numbered.map(({ item }) => {
    const [x, y] = item.at ?? shapeCentre(item.shapes[0])
    return { id: item.id, x, y, left: x < cx, ly: y, free: !!item.mirror || Math.abs(x - cx) < 4 }
  })
  // Bilateral and midline structures can be labelled from either side:
  // alternate them top-to-bottom so both columns fill evenly; a right-side
  // label leads to the mirrored copy.
  const free = rows.filter((r) => r.free).sort((a, b) => a.y - b.y)
  let leftCount = rows.filter((r) => !r.free && r.left).length,
    rightCount = rows.filter((r) => !r.free && !r.left).length
  for (const r of free) {
    r.left = leftCount <= rightCount
    if (r.left) leftCount++
    else rightCount++
    if (!r.left && r.x < cx) r.x = 2 * cx - r.x
    if (r.left && r.x > cx) r.x = 2 * cx - r.x
  }
  for (const leftSide of [true, false]) {
    const col = rows.filter((r) => r.left === leftSide).sort((a, b) => a.y - b.y)
    for (let i = 0; i < col.length; i++) col[i].ly = Math.max(col[i].y, i ? col[i - 1].ly + gap : 0)
    const over = col.length ? col[col.length - 1].ly - section.h : 0
    if (over > 0) for (let i = col.length - 1; i >= 0; i--) col[i].ly = Math.min(col[i].ly - over, i < col.length - 1 ? col[i + 1].ly - gap : Infinity)
  }
  return new Map(rows.map((r) => [r.id, r]))
}

/**
 * Mid-sagittal thumbnail of brainstem, diencephalon and cerebellum
 * (anterior to the left) with every level line; the open one highlighted.
 */
function Locator({ section, onPick, title }: { section: Section; onPick: (id: string) => void; title: string }) {
  return (
    <svg className="sv-locator" viewBox="0 0 200 210" aria-label={title}>
      <title>{title}</title>
      {/* thalamus, hypothalamus, midbrain, pons, medulla, cerebellum, 4th ventricle */}
      <path className="loc-shape" d="M60,40 C70,24 112,22 124,38 C134,52 122,72 100,76 C82,79 62,70 58,58 Z" />
      <path className="loc-shape" d="M44,74 C50,66 66,66 74,74 C76,84 70,94 60,96 C50,96 42,86 44,74 Z" />
      <path className="loc-shape" d="M66,78 C78,74 98,74 106,80 L104,104 C92,108 78,108 64,104 Z" />
      <path className="loc-shape" d="M60,106 C78,104 96,104 104,108 L102,150 C88,158 64,158 50,148 C42,136 44,116 60,106 Z" />
      <path className="loc-shape" d="M60,152 C74,158 92,158 102,152 L104,200 C94,204 80,204 70,200 Z" />
      <path className="loc-shape cb" d="M110,108 C134,96 170,104 178,130 C184,156 166,178 140,178 C122,178 110,166 108,150 C112,136 112,122 110,108 Z" />
      <path className="loc-csf" d="M104,116 L116,134 L104,150 Z" />
      {SECTIONS.filter((s) => s.loc).map((s) => {
        const [x1, y1, x2, y2] = s.loc!
        const on = s.id === section.id
        return (
          <g key={s.id} className={`loc-line ${on ? 'on' : ''}`} onClick={() => onPick(s.id)}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <line className="loc-hit" x1={x1} y1={y1} x2={x2} y2={y2} />
            {on && (
              <text x={x2 + 3} y={y2} dominantBaseline="central">
                {s.code}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
