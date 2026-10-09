import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Box, ChevronLeft, ChevronRight, Eye, EyeOff, GraduationCap, Hash, Layers, Microscope, PenTool, ScanLine, Shuffle, Tags, X } from 'lucide-react'
import { CONCEPT_BY_ID, conceptLeafIds } from '@/data'
import { SECTIONS, SECTION_BY_ID, SECTION_REGIONS, STRUCTURE_BY_ID, type Section, type SectionItem } from '@/data/sections'
import { shapePath } from '@/data/sections/shapes'
import type { LayerId } from '@/data/types'
import { useL, useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { CATEGORY, CATEGORY_ORDER, FIBRE, NISSL_DARK, STAIN, tissueOf, type Stain } from './sectionStyle'
import { AtlasSliceView, regionColor, useAtlasSlice } from './AtlasSliceView'
import { LAYER_BY_ID, PART_BY_ID } from '@/data'
import { TOPIC_BY_ID, topicsOfSection } from '@/data/topics'
import { badgePositions, itemArea, itemShapes, mix, sectionEntries, type Entry } from './sectionLayout'

/** Layers whose meshes make the 3D cut face informative for each region. */
const CUT_LAYERS: Record<Section['region'], LayerId[]> = {
  medulla: ['gross', 'bstem', 'suit'],
  pons: ['gross', 'bstem', 'suit'],
  midbrain: ['gross', 'bstem'],
  diencephalon: ['gross', 'julich'],
  hypothalamus: ['gross'],
  'basal-ganglia': ['gross', 'julich'],
  cerebellum: ['gross', 'suit', 'bstem'],
}

type Numbered = Entry

/**
 * The cross-section atlas: one textbook transverse (or coronal) level at a
 * time, drawn as a numbered schematic with every structure clickable for
 * its function, connections and lesion picture, plus the level's blood
 * supply and classic syndromes. A quiz mode hides the names for self-test.
 */
export function SectionViewer() {
  const t = useT()
  const l = useL()
  const { sectionId, openSection, cutSection, selectParts, lang, topic, lesson, setLesson } = useAtlas()
  const section = sectionId ? SECTION_BY_ID.get(sectionId) : undefined
  // Inside a topic the plates step through that topic only; otherwise through all.
  const tp = topic ? TOPIC_BY_ID.get(topic) : undefined
  const order = tp && sectionId && tp.sections.includes(sectionId) ? tp.sections.map((id) => SECTION_BY_ID.get(id)!).filter(Boolean) : SECTIONS
  // The 3D lesson that teaches this plate's structures (own topic first).
  const lessonFor = sectionId ? (tp?.lessons[0] ?? topicsOfSection(sectionId).find((x) => x.lessons.length)?.lessons[0]) : undefined
  const [selected, setSelected] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [labels, setLabels] = useState(false)
  const [numbers, setNumbers] = useState(true)
  const [quiz, setQuiz] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'structures' | 'level'>('structures')
  const [focusCat, setFocusCat] = useState<string | null>(null)
  const [view, setView] = useState<'scheme' | Stain | 'atlas'>('scheme')
  const [atlasSel, setAtlasSel] = useState<string | null>(null)

  // A new section starts clean.
  useEffect(() => {
    setSelected(null)
    setHover(null)
    setRevealed(new Set())
    setFocusCat(null)
    setAtlasSel(null)
    if (section && !section.plane) setView((v) => (v === 'atlas' ? 'scheme' : v))
  }, [sectionId])

  useEffect(() => {
    if (!section) return
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') openSection(null)
      const i = order.findIndex((s) => s.id === section.id)
      if (e.key === 'ArrowRight' && i < order.length - 1) openSection(order[i + 1].id)
      if (e.key === 'ArrowLeft' && i > 0) openSection(order[i - 1].id)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [section, openSection, order])

  const numbered: Numbered[] = useMemo(() => (section ? sectionEntries(section) : []), [section])
  const cats = useMemo(() => {
    const present = new Set(numbered.map(({ item }) => STRUCTURE_BY_ID.get(item.id)?.cat).filter(Boolean))
    return CATEGORY_ORDER.filter((c) => present.has(c))
  }, [numbered])

  const atlas = useAtlasSlice(section ?? SECTIONS[0], section ? CUT_LAYERS[section.region] : [], !!section?.plane && view === 'atlas')
  if (!section) return null
  const index = order.findIndex((s) => s.id === section.id)
  const prev = order[index - 1],
    next = order[index + 1]
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

  // Selection follows the user across views: a schematic structure linked to
  // a 3D concept lights up its atlas region, and back.
  const switchView = (next: typeof view) => {
    if (next === 'atlas' && selInfo?.part) setAtlasSel(null)
    if (view === 'atlas' && next !== 'atlas' && atlasSel) {
      const concept = PART_BY_ID.get(atlasSel)?.concept
      const match = numbered.find(({ item }) => STRUCTURE_BY_ID.get(item.id)?.part === concept)
      if (match) setSelected(match.item.id)
    }
    if (next === 'atlas') setQuiz(false)
    setView(next)
  }
  const atlasPart = atlasSel ? atlas?.data?.regions.find((r) => r.part.id === atlasSel) : undefined
  const viewHint = view === 'myelin' ? t.svViewMyelinHint : view === 'nissl' ? t.svViewNisslHint : view === 'atlas' ? t.svViewAtlasHint : null

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
            {lesson ? (
              <button className="sv-learn" onClick={() => openSection(null)} title={t.lnBackLesson}>
                <ArrowLeft size={14} />
                <span>{t.lnBackLesson}</span>
              </button>
            ) : lessonFor ? (
              <button className="sv-learn" onClick={() => { openSection(null); setLesson(lessonFor) }} title={t.lnLearn3d}>
                <GraduationCap size={14} />
                <span>{t.lnLearn3d}</span>
              </button>
            ) : null}
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
          {order !== SECTIONS && tp ? (
            <div className="sv-region">
              <span>{l(tp.title)}</span>
              {order.map((s) => (
                <button key={s.id} className={`sv-chip ${s.id === section.id ? 'active' : ''}`} onClick={() => openSection(s.id)} title={l(s.title)}>
                  {s.code}
                </button>
              ))}
            </div>
          ) : SECTION_REGIONS.map((r) => {
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
            <div className="sv-views" role="tablist" aria-label={t.svLevel}>
              {(
                [
                  ['scheme', PenTool, t.svViewScheme],
                  ['myelin', Layers, t.svViewMyelin],
                  ['nissl', Microscope, t.svViewNissl],
                  ['atlas', ScanLine, t.svViewAtlas],
                ] as const
              ).map(([id, Icon, name]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={view === id}
                  className={view === id ? 'on' : ''}
                  disabled={id === 'atlas' && !section.plane}
                  onClick={() => switchView(id)}
                >
                  <Icon size={13} />
                  <span>{name}</span>
                </button>
              ))}
            </div>
            <div className="sv-tools">
              {view !== 'atlas' && (
                <button className={numbers ? 'on' : ''} onClick={() => setNumbers(!numbers)} title={t.svNumbers}>
                  <Hash size={13} />
                  <span>{t.svNumbers}</span>
                </button>
              )}
              <button className={labels ? 'on' : ''} onClick={() => setLabels(!labels)} disabled={quiz} title={t.svLabels}>
                <Tags size={13} />
                <span>{t.svLabels}</span>
              </button>
              {view !== 'atlas' && (
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
              )}
              {quiz && view !== 'atlas' && (
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
            {view === 'atlas' ? (
              atlas?.data ? (
                <AtlasSliceView
                  section={section}
                  slice={atlas.data}
                  selected={atlasSel}
                  highlightConcept={atlasSel ? null : (selInfo?.part ?? null)}
                  labels={labels}
                  axes={section.axes.map((a) => l(a)) as [string, string, string, string]}
                  onPick={setAtlasSel}
                />
              ) : (
                <div className="as-status">{atlas ? t.asEmpty : t.asLoading}</div>
              )
            ) : (
              <Figure
                stain={view === 'scheme' ? undefined : view}
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
            )}
            {viewHint && <p className="sv-view-hint">{viewHint}</p>}
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

            {tab === 'structures' && view === 'atlas' ? (
              <AtlasList
                regions={atlas?.data?.regions ?? []}
                selected={atlasSel}
                part={atlasPart}
                onPick={setAtlasSel}
                onScheme={(concept) => {
                  const match = numbered.find(({ item }) => STRUCTURE_BY_ID.get(item.id)?.part === concept)
                  if (match) {
                    setSelected(match.item.id)
                    setView('scheme')
                  }
                }}
                hasScheme={(concept) => numbered.some(({ item }) => STRUCTURE_BY_ID.get(item.id)?.part === concept)}
                onShow3D={showIn3D}
              />
            ) : tab === 'structures' ? (
              <>
                {sel && selInfo && (
                  <div
                    className="sv-detail"
                    style={
                      {
                        '--cat': CATEGORY[selInfo.cat].color,
                      } as React.CSSProperties
                    }
                  >
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
                {section.plane && <PlaneFacts plane={section.plane} />}
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
  stain,
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
  stain?: Stain
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
  const pos = useMemo(() => badgePositions(numbered), [numbered])
  const layout = labels ? labelLayout(section, numbered, pos) : null
  const cats = Object.keys(CATEGORY) as (keyof typeof CATEGORY)[]
  // Painter's order, like a printed atlas plate: tissue ground, shaded
  // territories, fibre strokes, then filled structures largest first so a
  // small nucleus is never hidden under a big one. Fills are opaque —
  // overlaps read as "in front of", never as muddy blends.
  const order = useMemo(() => {
    const items = numbered.filter((e) => e.kind === 'item')
    return {
      ground: numbered.filter((e) => e.kind === 'ground'),
      region: numbered.filter((e) => e.kind === 'region'),
      strokes: items.filter((e) => e.item.shapes.some((sh) => sh.t === 'l')),
      fills: items.filter((e) => e.item.shapes.some((sh) => sh.t !== 'l')).sort((p, q) => itemArea(section, q.item) - itemArea(section, p.item)),
    }
  }, [numbered, section])
  const state = (e: Numbered) => {
    const info = STRUCTURE_BY_ID.get(e.item.id)
    const isActive = active === e.item.id
    const dim = (!!active && !isActive) || (!!focusCat && info?.cat !== focusCat)
    return `sv-item ${e.kind} ${isActive ? 'active' : ''} ${selected === e.item.id ? 'selected' : ''} ${dim ? 'dim' : ''}`
  }
  const handlers = (id: string) => ({
    onPointerEnter: () => onHover(id),
    onPointerLeave: () => onHover(null),
    onClick: () => onPick(id),
  })
  const paint = (e: Numbered, which: 'fill' | 'stroke') => {
    const info = STRUCTURE_BY_ID.get(e.item.id)
    if (!info) return null
    const color = CATEGORY[info.cat].color
    const fibre = FIBRE.has(e.item.id)
    const shapes = itemShapes(section, e.item).filter((sh) => (which === 'stroke' ? sh.t === 'l' : sh.t !== 'l'))
    return (
      <g key={`${which}-${e.item.id}`} className={state(e)} data-id={e.item.id} {...handlers(e.item.id)}>
        {shapes.map((sh, i) => {
          const p = shapePath(sh)
          const tissue = tissueOf(e.item.id, info.cat)
          if (stain) {
            if (p.stroke) {
              const ink = stain === 'myelin' ? (tissue === 'fibre' ? '#262b4d' : '#e9dfc8') : tissue === 'fibre' ? '#ece3f1' : '#6b3d8c'
              return <path key={i} d={p.d} fill="none" stroke={ink} strokeWidth={strokeW(p.w)} strokeLinecap="round" className="sv-stroke" />
            }
            const fill = stain === 'nissl' && tissue === 'grey' && NISSL_DARK.has(info.cat) ? 'url(#st-nissl-motor)' : STAIN[stain][tissue]
            return <path key={i} d={p.d} fill={fill} className="sv-fill sv-stained" />
          }
          if (p.stroke)
            return (
              <path
                key={i}
                d={p.d}
                fill="none"
                stroke={color}
                strokeWidth={strokeW(p.w)}
                strokeLinecap="round"
                strokeDasharray={p.dash ? '5 4' : undefined}
                className="sv-stroke"
              />
            )
          if (e.kind === 'ground') return <path key={i} d={p.d} className="sv-fill sv-ground" />
          if (e.kind === 'region') return <path key={i} d={p.d} className="sv-fill sv-region-fill" />
          const fill = fibre ? `url(#hatch-${info.cat})` : mix(color, BASE, info.cat === 'csf' ? 0.32 : 0.46)
          return <path key={i} d={p.d} fill={fill} stroke={color} strokeWidth={1.3} className="sv-fill" />
        })}
      </g>
    )
  }
  return (
    <svg className={`sv-svg ${stain ? `stained ${stain}` : ''}`} viewBox={vb} role="img" aria-label={section.code}>
      <defs>
        <StainDefs />
        {cats.map((c) => (
          <pattern key={c} id={`hatch-${c}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={mix(CATEGORY[c].color, BASE, 0.24)} />
            <line x1="0" y1="0" x2="0" y2="6" stroke={CATEGORY[c].color} strokeWidth="2.2" strokeOpacity="0.85" />
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

      {section.outline.map((sh, i) => {
        const p = shapePath(sh)
        return p.stroke ? null : <path key={i} d={p.d} className="sv-outline" />
      })}
      {order.ground.map((e) => paint(e, 'fill'))}
      {section.regions?.map((r, i) =>
        r.id
          ? null
          : r.shapes.map((sh, j) => {
              const p = shapePath(sh)
              return p.stroke ? (
                <path key={`${i}-${j}`} d={p.d} className="sv-region-line" strokeWidth={p.w} strokeDasharray={p.dash ? '5 4' : undefined} />
              ) : (
                <path key={`${i}-${j}`} d={p.d} className="sv-region-fill" />
              )
            }),
      )}
      {order.region.map((e) => paint(e, 'fill'))}
      {section.outline.map((sh, i) => {
        const p = shapePath(sh)
        return p.stroke ? <path key={`ol-${i}`} d={p.d} className="sv-outline-line" strokeWidth={p.w} /> : null
      })}
      {section.regions?.map((r, i) =>
        r.label && r.at && !r.id ? (
          <text key={`rl-${i}`} className="sv-region-label" x={r.at[0]} y={r.at[1]} textAnchor="middle">
            {regionName(r.label)}
          </text>
        ) : null,
      )}
      {order.strokes.map((e) => paint(e, 'stroke'))}
      {order.fills.map((e) => paint(e, 'fill'))}
      {section.outline.map((sh, i) => {
        const p = shapePath(sh)
        return p.stroke ? null : <path key={`rim-${i}`} d={p.d} className="sv-rim" />
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
            <g key={`l-${item.id}`} className={`sv-leader ${dim ? 'dim' : ''} ${active === item.id ? 'active' : ''}`} {...handlers(item.id)}>
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
          const b = pos.get(item.id)
          if (!info || !b) return null
          const color = CATEGORY[info.cat].color
          const dim = (active && active !== item.id) || (focusCat && info.cat !== focusCat)
          const moved = Math.hypot(b.x - b.hx, b.y - b.hy) > 9
          return (
            <g key={`b-${item.id}`} className={`sv-badge ${dim ? 'dim' : ''} ${active === item.id ? 'active' : ''}`} {...handlers(item.id)}>
              {numbers ? (
                <>
                  {moved && (
                    <>
                      <line className="sv-tick" x1={b.hx} y1={b.hy} x2={b.x} y2={b.y} stroke={color} />
                      <circle className="sv-dot" cx={b.hx} cy={b.hy} r={1.8} fill={color} />
                    </>
                  )}
                  <circle cx={b.x} cy={b.y} r={8.5} stroke={color} />
                  <text x={b.x} y={b.y} textAnchor="middle" dominantBaseline="central">
                    {n}
                  </text>
                </>
              ) : (
                <circle cx={b.hx} cy={b.hy} r={3} fill={color} stroke="none" />
              )}
            </g>
          )
        })}
    </svg>
  )
}

/** Fibre strokes are drawn thin so they read as bundles passing between nuclei, not as walls. */
const strokeW = (w = 4) => (w > 3 ? 2.2 + (w - 3) * 0.45 : w)

/** Card colour the opaque fills are mixed toward. */
const BASE = '#161b23'

/**
 * Label column positions: each structure goes to the side its badge is on
 * (midline ones alternate), sorted top-to-bottom and pushed apart to a
 * minimum gap, then pulled back up if the column overruns the figure.
 */
function labelLayout(section: Section, numbered: Numbered[], pos: Map<string, { hx: number; hy: number }>) {
  const gap = 15
  const cx = section.w / 2
  const rows = numbered.map(({ item }) => {
    const b = pos.get(item.id)!
    const x = b.hx,
      y = b.hy
    return {
      id: item.id,
      x,
      y,
      left: x < cx,
      ly: y,
      free: !!item.mirror || Math.abs(x - cx) < 4,
    }
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
      {/* striatum: caudate C-arc over the thalamus and the lentiform nucleus in front of it */}
      <path className="loc-shape bg" d="M16,44 C14,26 34,14 58,16 C84,18 110,20 128,30 L126,36 C108,28 84,26 60,24 C40,24 26,32 26,46 C26,56 20,58 16,44 Z" />
      <path className="loc-shape bg" d="M22,62 C28,50 50,46 74,50 C92,54 100,62 98,70 C92,78 66,80 44,76 C30,74 20,70 22,62 Z" />
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

/** Textures for the stained views: fibre grain, Nissl cell stipple. Deterministic so screenshots are stable. */
function StainDefs() {
  const dots = (n: number, size: number, seed: number) => {
    const out: [number, number][] = []
    let x = seed
    for (let i = 0; i < n; i++) {
      x = (x * 16807) % 2147483647
      const a = (x % 1000) / 1000
      x = (x * 16807) % 2147483647
      const b = (x % 1000) / 1000
      out.push([a * size, b * size])
    }
    return out
  }
  return (
    <>
      <pattern id="st-myelin-fibre" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
        <rect width="5" height="5" fill="#2c3154" />
        <line x1="0" y1="1" x2="5" y2="1" stroke="#1b1f3a" strokeWidth="0.9" />
        <line x1="0" y1="3.4" x2="5" y2="3.4" stroke="#363c63" strokeWidth="0.6" />
      </pattern>
      <pattern id="st-myelin-mixed" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#b3aebc" />
        {dots(9, 14, 7).map(([x, y], i) => (
          <line key={i} x1={x} y1={y} x2={x + 2.6} y2={y + (i % 2 ? 1.2 : -1.2)} stroke="#4c4e6e" strokeWidth="0.8" strokeLinecap="round" />
        ))}
      </pattern>
      <pattern id="st-nissl-grey" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="#c9a9db" />
        {dots(16, 12, 11).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.75} fill="#5b2b7a" />
        ))}
      </pattern>
      <pattern id="st-nissl-motor" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#b58acb" />
        {dots(9, 14, 23).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.5} fill="#3e1559" />
        ))}
      </pattern>
      <pattern id="st-nissl-mixed" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#e6daee" />
        {dots(7, 16, 5).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.7} fill="#7d4ea0" />
        ))}
      </pattern>
    </>
  )
}

/** Side list of the atlas view: regions largest first, with area, centroid and source. */
function AtlasList({
  regions,
  selected,
  part,
  onPick,
  onScheme,
  hasScheme,
  onShow3D,
}: {
  regions: import('@/scene/atlasSlice').SliceRegion[]
  selected: string | null
  part: import('@/scene/atlasSlice').SliceRegion | undefined
  onPick: (id: string) => void
  onScheme: (concept: string) => void
  hasScheme: (concept: string) => boolean
  onShow3D: (concept: string) => void
}) {
  const t = useT()
  const l = useL()
  const fmt = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1)
  return (
    <>
      {part && (
        <div className="sv-detail" style={{ '--cat': regionColor(part.part) } as React.CSSProperties}>
          <div className="sv-detail-top">
            <span className="sv-cat">{l(LAYER_BY_ID.get(part.part.layer)!.short ?? LAYER_BY_ID.get(part.part.layer)!.name)}</span>
          </div>
          <h3>{l(part.part.name)}</h3>
          <dl className="as-facts">
            <dt>{t.asArea}</dt>
            <dd>{part.area.toFixed(1)} mm²</dd>
            <dt>{t.asCentroid}</dt>
            <dd>
              {fmt(part.centroid[0])}, {fmt(part.centroid[1])}, {fmt(part.centroid[2])}
            </dd>
            <dt>{t.asSource}</dt>
            <dd>{part.part.meshSource?.title ?? LAYER_BY_ID.get(part.part.layer)!.source}</dd>
          </dl>
          {part.part.description && <p>{l(part.part.description)}</p>}
          <div className="as-actions">
            {hasScheme(part.part.concept) && (
              <button className="sv-3d" onClick={() => onScheme(part.part.concept)}>
                <PenTool size={14} /> {t.asInScheme}
              </button>
            )}
            <button className="sv-3d" onClick={() => onShow3D(part.part.concept)}>
              <Box size={14} /> {t.svShow3D}
            </button>
          </div>
        </div>
      )}
      {!part && <p className="sv-hint">{t.asHint}</p>}
      <div className="sv-list">
        <div className="sv-group">
          <div className="sv-group-name">
            {t.asRegions} · {regions.length}
          </div>
          {regions.map((r) => (
            <button key={r.part.id} className={`sv-row ${selected === r.part.id ? 'active' : ''}`} onClick={() => onPick(r.part.id)}>
              <span className="as-swatch" style={{ background: regionColor(r.part) }} />
              <span className="sv-row-name">{l(r.part.name)}</span>
              <em className="as-area">{r.area < 10 ? r.area.toFixed(1) : r.area.toFixed(0)}</em>
            </button>
          ))}
        </div>
      </div>
      <p className="sv-note">{t.asNote}</p>
    </>
  )
}

/**
 * The level's plane in MNI terms: a point, the unit normal and the tilt
 * from the standard planes — what is needed to reproduce the cut on an
 * MRI volume (e.g. an oblique reslice perpendicular to Meynert's axis).
 */
function PlaneFacts({ plane }: { plane: NonNullable<Section['plane']> }) {
  const t = useT()
  const [nx, ny, nz] = plane.normal
  const len = Math.hypot(nx, ny, nz)
  const deg = (v: number) => ((Math.acos(Math.min(1, Math.abs(v) / len)) * 180) / Math.PI).toFixed(1)
  const f = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(v % 1 ? 2 : 0)
  const coronal = Math.abs(ny) / len > 0.9
  return (
    <>
      <h4>{t.svPlane}</h4>
      <dl className="as-facts">
        <dt>{t.svPlanePoint}</dt>
        <dd>({plane.point.map(f).join(', ')}) mm</dd>
        <dt>{t.svPlaneNormal}</dt>
        <dd>({plane.normal.map((v) => f(v / len)).join(', ')})</dd>
        <dt>{coronal ? t.svTiltCoronal : t.svTiltAxial}</dt>
        <dd>{coronal ? deg(ny) : deg(nz)}°</dd>
      </dl>
      <p className="sv-note">{coronal ? t.svPlaneNoteCoronal : t.svPlaneNoteAxis}</p>
    </>
  )
}
