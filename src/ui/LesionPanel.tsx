import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Box, Crosshair, GraduationCap, MousePointerClick, Plus, Search, Shapes, Trash2, X } from 'lucide-react'
import { PATHWAYS, type BodySide, type LesionLevel } from '@/data/pathways'
import { CRANIAL_SIGNS, LEVELS, LEVEL_BY_ID, signature, type Findings, type Lesion } from '@/data/lesions'
import { SECTION_BY_ID, STRUCTURE_BY_ID, type Section } from '@/data/sections'
import { lesionLessonId } from '@/data/lessons/lesion'
import type { L10n } from '@/data/types'
import { useL } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { plateLevel } from './pathTrace'
import { CATEGORY } from './sectionStyle'
import type { TerritoryOnPlate } from './lesionTerritory'
import { cranialSigns, localiseWithSigns, type CranialFindings, type SignHit } from './lesionSigns'
import { focalPlate, type FocalLesion, type FocalSet } from './lesionFocal'
import { FocusTime, McDonaldPanel } from './McDonaldPanel'
import { msCase } from './mcdonald'
import { focalLesson } from './focalLesson'

const TX = {
  forward: { en: 'Lesion → signs', uz: "O'choq → belgilar" },
  reverse: { en: 'Signs → lesion', uz: "Belgilar → o'choq" },
  level: { en: 'Level', uz: 'Daraja' },
  side: { en: 'Side of the lesion', uz: "O'choq tomoni" },
  zone: { en: 'Territory', uz: 'Hudud' },
  L: { en: 'Left', uz: 'Chap' },
  R: { en: 'Right', uz: "O'ng" },
  none: { en: 'None', uz: "Yo'q" },
  bodyL: { en: 'left body', uz: 'chap tana' },
  bodyR: { en: 'right body', uz: "o'ng tana" },
  faceL: { en: 'left face', uz: 'chap yuz' },
  faceR: { en: 'right face', uz: "o'ng yuz" },
  both: { en: 'both sides', uz: 'ikki tomonda' },
  ipsi: { en: 'ipsilateral', uz: "o'sha tomonda" },
  contra: { en: 'contralateral', uz: 'qarama-qarshi' },
  spared: { en: 'spared', uz: 'saqlanadi' },
  lost: { en: 'Lost', uz: "Yo'qoladi" },
  open: { en: 'Open the plate', uz: 'Plastinkani ochish' },
  hits: { en: 'Structures in the lesion (this plate)', uz: "O'choqqa tushgan tuzilmalar (shu plastinka)" },
  hitsHint: {
    en: 'Everything in the territory, not only the long tracts: the cranial-nerve nuclei here are what place the lesion. Tap one to read it.',
    uz: "Hududdagi hamma narsa, faqat uzun yo'llar emas: o'choq darajasini aynan shu yerdagi kalla nervlari yadrolari aniqlaydi. O'qish uchun bosing.",
  },
  offPlate: { en: 'This level is not on the open plate.', uz: "Bu daraja ochiq plastinkada yo'q." },
  in3d: { en: 'Show in 3D', uz: "3D da ko'rish" },
  findings: { en: 'Which long-tract signs, on which side of the body?', uz: "Qaysi uzun yo'l belgilari, tananing qaysi tomonida?" },
  candidates: { en: 'Lesions that explain exactly these signs', uz: "Aynan shu belgilarni beradigan o'choqlar" },
  pick: { en: 'Choose at least one finding.', uz: 'Kamida bitta belgini tanlang.' },
  noMatch: {
    en: 'No single one-sided lesion gives this combination — think of two lesions or a bilateral process (anterior spinal artery, B12, demyelination).',
    uz: "Bunday birikmani bitta bir tomonlama o'choq bermaydi — ikki o'choq yoki ikki tomonlama jarayonni o'ylang (oldingi spinal arteriya, B12, demiyelinizatsiya).",
  },
  many: {
    en: 'These differ in what else they give: check the "also expect" signs at the bedside — the cranial nerves set the level (cortical signs and a sensory level above and below the brainstem).',
    uz: 'Ular boshqa belgilari bilan farqlanadi: bemorda "yana kutiladi" belgilarini tekshiring — darajani kalla nervlari aniqlaydi (miya ustunidan yuqori va pastda — po\'stloq belgilari va sezgi sathi).',
  },
  cranial: { en: 'Cranial-nerve and level signs', uz: 'Kalla nervlari va daraja belgilari' },
  noCranial: {
    en: 'No cranial-nerve sign: above the brainstem (or in the cord) the level is told by cortical signs, the face or a sensory level.',
    uz: "Kalla nervi belgisi yo'q: miya ustunidan yuqorida (yoki orqa miyada) darajani po'stloq belgilari, yuz yoki sezgi sathi aytadi.",
  },
  crossed: {
    en: 'Crossed signs: cranial nerve on the side of the lesion, long tract on the other — the hallmark of a brainstem lesion.',
    uz: "Kesishgan belgilar: kalla nervi o'choq tomonida, uzun yo'l — qarama-qarshi tomonda. Bu miya ustuni o'chog'ining asosiy belgisi.",
  },
  cranialAsk: { en: 'Cranial-nerve signs, on which side? (optional)', uz: 'Kalla nervi belgilari, qaysi tomonda? (ixtiyoriy)' },
  sideL: { en: 'left', uz: 'chap' },
  sideR: { en: 'right', uz: "o'ng" },
  expect: { en: 'also expect', uz: 'yana kutiladi' },
  byZone: { en: 'Territory', uz: 'Hudud' },
  byPoint: { en: 'Point', uz: 'Nuqta' },
  placeHint: {
    en: 'Tap anywhere on the plate — the scheme, the real slice or the atlas cut — to drop a lesion there; tap again to move it.',
    uz: "O'choq qo'yish uchun plastinkaning istalgan joyini bosing — sxemada, real kesimda yoki atlasda; boshqa joyni bossangiz o'choq o'sha yerga ko'chadi.",
  },
  radius: { en: 'Radius', uz: 'Radius' },
  add: { en: 'Another lesion', uz: "Yana o'choq" },
  addHint: {
    en: 'Tap the plate to add the new lesion — here or on another level (open its plate first).',
    uz: "Yangi o'choqni qo'shish uchun plastinkani bosing — shu yerda yoki boshqa darajada (avval o'sha plastinkani oching).",
  },
  remove: { en: 'Remove', uz: "O'chirish" },
  clear: { en: 'Clear all', uz: 'Hammasini tozalash' },
  together: { en: 'All lesions together', uz: "Barcha o'choqlar birgalikda" },
  msCase: { en: 'MS case', uz: 'TS keysi' },
  all3d: { en: 'All lesions in 3D', uz: "Barcha o'choqlar 3D da" },
  focal3d: { en: 'This lesion in 3D', uz: "Shu o'choq 3D da" },
  zone3d: { en: 'Nearest territory in 3D', uz: 'Eng yaqin hudud 3D da' },
  msCaseHint: {
    en: 'Teaching case: INO from an enhancing MLF plaque, a silent periventricular lesion, a new juxtacortical one at 6 months.',
    uz: "O'quv keysi: Gd+ MLF o'chog'idan INO, belgisiz periventrikulyar o'choq, 6 oyda yangi po'stloq yoni o'chog'i.",
  },
  oneFocus: { en: 'Lesion {n}', uz: "{n}-o'choq" },
  multiLevel: {
    en: 'Lesions at different levels: a picture no single lesion explains — think multiple sclerosis (lesions separated in space), emboli, metastases or vasculitis.',
    uz: "Turli darajadagi o'choqlar: buni bitta o'choq bilan tushuntirib bo'lmaydi — tarqoq skleroz (makonda tarqalgan o'choqlar), emboliya, metastaz yoki vaskulitni o'ylang.",
  },
  multiSame: {
    en: 'Deficits add up: a tract lost on the left by one lesion and on the right by another is lost on both sides — bilateral signs at one level point to a midline process.',
    uz: "Yetishmovchiliklar qo'shiladi: bir o'choq chapda, ikkinchisi o'ngda kesgan yo'l ikki tomonda yo'qoladi — bir darajadagi ikki tomonlama belgilar o'rta chiziq jarayoniga ishora qiladi.",
  },
  approx: {
    en: 'The plates are schematic: millimetres are estimated from the atlas cut of the same level (≈).',
    uz: 'Plastinkalar sxematik: millimetr shu darajadagi atlas kesimidan taxminan hisoblanadi (≈).',
  },
  where: { en: 'Where it lies', uz: 'Qayerda joylashgan' },
  midline: { en: 'crosses the midline — signs on both sides', uz: "o'rta chiziqni kesib o'tadi — belgilar ikki tomonda" },
  inZone: { en: 'Classic territories under the lesion', uz: "O'choq ostidagi klassik hududlar" },
  noZone: {
    en: 'Outside every classic territory (or between them): a border-zone or atypical lesion.',
    uz: "Birorta klassik hududga to'g'ri kelmaydi (yoki ular orasida): chegara zonasi yoki atipik o'choq.",
  },
  toZone: { en: 'Compare with the whole territory', uz: 'Butun hudud bilan solishtirish' },
  share: { en: 'share of the structure in the lesion', uz: "tuzilmaning o'choqqa tushgan ulushi" },
  lacune: {
    en: 'under 15 mm across: the size of a lacune (a single penetrating artery).',
    uz: "diametri 15 mm dan kichik: lakuna o'lchami (bitta penetratsiyalovchi arteriya).",
  },
  rule: {
    en: 'Rule: a lesion above a tract’s crossing gives signs on the opposite side of the body, below it on the same side.',
    uz: "Qoida: yo'l kesishmasidan yuqoridagi o'choq belgilarni tananing qarama-qarshi tomonida, pastdagisi — o'sha tomonda beradi.",
  },
} satisfies Record<string, L10n>

/**
 * The lesion simulator in the plate viewer: place a lesion (level, side,
 * territory) and read which long tracts it cuts and on which side of the
 * body; or enter the findings and get every lesion that explains them.
 */
export function LesionPanel({
  section,
  lesion,
  setLesion,
  territory,
  onPick,
  point,
}: {
  section: Section
  lesion: Lesion
  setLesion: (f: Lesion | ((x: Lesion) => Lesion)) => void
  /** The lesion's territory on the open plate (null: the plate does not show this level). */
  territory: TerritoryOnPlate | null
  onPick: (itemId: string) => void
  /** Point mode: a free disc lesion dropped on the plate. */
  point: {
    on: boolean
    set: (on: boolean) => void
    foci: FocalLesion[]
    setFoci: (f: FocalLesion[]) => void
    active: number
    setActive: (i: number) => void
    /** The next click adds a lesion instead of moving the active one. */
    adding: boolean
    setAdding: (on: boolean) => void
    set$: FocalSet
    /** Time axis position in months (null: every lesion). */
    now: number | null
    setNow: (t: number | null) => void
  }
}) {
  const l = useL()
  const { openSection, setPathway, setLesson } = useAtlas()
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward')
  const [findings, setFindings] = useState<Findings>({})

  // Opening another plate moves the lesion to that plate's level.
  useEffect(() => {
    const lv = plateLevel(section)
    // A plate opened for the lesion's own level (the cord's is U1) keeps it.
    if (lv) setLesion((x) => (x.level === lv || LEVEL_BY_ID.get(x.level)?.plate === section.id ? x : { ...x, level: lv, zone: 'all' }))
  }, [section, setLesion])

  const level = LEVEL_BY_ID.get(lesion.level)!
  const zone = level.zones.find((z) => z.id === lesion.zone) ?? level.zones[0]
  const sig = useMemo(() => signature(lesion), [lesion])
  const signs = useMemo(() => cranialSigns(lesion), [lesion])
  const [cranial, setCranial] = useState<CranialFindings>({})
  const matches = useMemo(() => localiseWithSigns(findings, cranial), [findings, cranial])
  const anyFinding = PATHWAYS.some((p) => (findings[p.id] ?? 'none') !== 'none') || Object.values(cranial).some((s) => s !== 'none')
  // Signs some lesion of the simulator can give (others cannot be entered usefully).
  const askable = useMemo(() => {
    const ids = new Set(LEVELS.flatMap((lv) => lv.zones.flatMap((z) => cranialSigns({ level: lv.id, side: 'L', zone: z.id }).map((h) => h.sign.id))))
    return CRANIAL_SIGNS.filter((c) => ids.has(c.id))
  }, [])
  // Crossed: a cranial sign on one side, a long tract on the other.
  const crossed = signs.some((h) => h.side === lesion.side && h.via.length) && PATHWAYS.some((p) => sig[p.id] !== 'none' && sig[p.id] !== lesion.side)
  // Ipsi / contra relative to the lesion's side (none for a free lesion across the midline).
  // Several lesions on different sides have no single "ipsilateral".
  const fsides = new Set(point.set$.each.flatMap((r) => (r ? [r.side] : [])))
  const refSide: BodySide | 'B' = point.on && fsides.size ? (fsides.size === 1 ? [...fsides][0] : 'B') : lesion.side
  const rel = (s: BodySide) => (refSide === 'B' ? '' : ` · ${l(s === refSide ? TX.ipsi : TX.contra)}`)
  const sideText = (s: BodySide | 'B') => (s === 'B' ? l(TX.both) : `${l(s === 'L' ? TX.sideL : TX.sideR)}${rel(s)}`)

  const half = (s: BodySide, face?: boolean) => l(face ? (s === 'L' ? TX.faceL : TX.faceR) : s === 'L' ? TX.bodyL : TX.bodyR)
  const bodyText = (s: BodySide | 'B', face?: boolean) => (s === 'B' ? l(TX.both) : `${half(s, face)}${rel(s)}`)
  const plate = level.plate ? SECTION_BY_ID.get(level.plate) : undefined
  const canPlace = !!focalPlate(section)

  const tractTable = (sg: Record<string, BodySide | 'none' | 'B'>) => (
    <div className="lz-table">
      {PATHWAYS.map((p) => {
        const s = sg[p.id]
        return (
          <button
            key={p.id}
            className={`lz-row ${s === 'none' ? 'spared' : 'hit'}`}
            style={{ '--c': p.color } as React.CSSProperties}
            onClick={() => setPathway(p.id)}
            title={l(p.title)}
          >
            <i />
            <span className="lz-mod">
              <b>{l(p.short)}</b>
              <small>{l(p.modality)}</small>
            </span>
            <span className="lz-res">{s === 'none' ? l(TX.spared) : `${l(TX.lost)}: ${bodyText(s, p.body === 'face')}`}</span>
          </button>
        )
      })}
    </div>
  )
  const signTable = (list: SignHit[]) =>
    list.length ? (
      <div className="lz-table">
        {list.map((h) => (
          <div key={h.sign.id} className="lz-row hit lz-cn" title={h.via.map((id) => (STRUCTURE_BY_ID.get(id) ? l(STRUCTURE_BY_ID.get(id)!.name) : id)).join(', ')}>
            <i />
            <span className="lz-mod">
              <b>{l(h.sign.name)}</b>
              <small>{l(h.sign.detail)}</small>
            </span>
            <span className="lz-res">{sideText(h.side)}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="sv-hint">{l(TX.noCranial)}</p>
    )
  const isCrossed = (sg: Record<string, BodySide | 'none' | 'B'>, list: SignHit[], side: BodySide | 'B') =>
    side !== 'B' && list.some((h) => h.side === side && h.via.length) && PATHWAYS.some((p) => sg[p.id] !== 'none' && sg[p.id] !== side)

  // Point mode: what the discs dropped on the plates take in — each one, and all of them together.
  const focalView = () => {
    const { foci, active, set$ } = point
    const f = foci[active]
    const r = set$.each[active] ?? null
    const rMm = f?.rMm ?? 3
    const best = r?.zones[0]
    const many = foci.length > 1
    // The lesions as spheres at their own places (not the nearest territory's lesson).
    const open3d = () => {
      const id = focalLesson(foci, set$)
      if (id) setLesson(id)
    }
    const remove = (i: number) => {
      point.setFoci(foci.filter((_, j) => j !== i))
      point.setActive(Math.max(0, Math.min(active > i ? active - 1 : active, foci.length - 2)))
    }
    return (
      <>
        <p className="sv-hint">{l(point.adding ? TX.addHint : TX.placeHint)}</p>
        <div className="lz-foci">
          {foci.map((x, i) => (
            <span key={i} className={`lz-focus ${i === active ? 'on' : ''}`}>
              <button
                onClick={() => {
                  point.setActive(i)
                  if (x.plate !== section.id) openSection(x.plate)
                }}
              >
                <b>{i + 1}</b> {SECTION_BY_ID.get(x.plate)?.code} · {x.rMm.toFixed(1)} mm
              </button>
              <button className="x" onClick={() => remove(i)} aria-label={l(TX.remove)} title={l(TX.remove)}>
                <X size={11} />
              </button>
            </span>
          ))}
          {foci.length > 0 && (
            <button className={`lz-add ${point.adding ? 'on' : ''}`} onClick={() => point.setAdding(!point.adding)}>
              <Plus size={12} /> {l(TX.add)}
            </button>
          )}
          <button
            className="lz-add"
            title={l(TX.msCaseHint)}
            onClick={() => {
              const c = msCase()
              point.setFoci(c)
              point.setActive(0)
              point.setAdding(false)
              point.setNow(null)
              if (c[0] && c[0].plate !== section.id) openSection(c[0].plate)
            }}
          >
            <GraduationCap size={12} /> {l(TX.msCase)}
          </button>
          {many && (
            <button
              className="lz-add"
              onClick={() => {
                point.setFoci([])
                point.setActive(0)
                point.setAdding(false)
              }}
            >
              <Trash2 size={12} /> {l(TX.clear)}
            </button>
          )}
        </div>
        {f && (
          <>
            <h4>
              {many ? `${active + 1} · ` : ''}
              {l(TX.radius)} · {r?.mmPerUnit ? '≈ ' : ''}
              {rMm.toFixed(1)} mm
            </h4>
            <input
              className="lz-range"
              type="range"
              min={0.5}
              max={12}
              step={0.5}
              value={rMm}
              onChange={(e) => point.setFoci(foci.map((x, i) => (i === active ? { ...x, rMm: Number(e.target.value) } : x)))}
              aria-label={l(TX.radius)}
            />
            <FocusTime f={f} set={(g) => point.setFoci(foci.map((x, i) => (i === active ? g : x)))} />
          </>
        )}
        {many && (
          <>
            <h4>
              {l(TX.together)} · {foci.length} · {set$.levels.map((lv) => l(LEVEL_BY_ID.get(lv)!.name)).join(', ')}
            </h4>
            {tractTable(set$.sig)}
            <h4>{l(TX.cranial)}</h4>
            {signTable(set$.signs)}
            <div className="lz-actions">
              <button className="sv-3d" onClick={() => open3d()}>
                <Box size={13} /> {l(TX.all3d)}
              </button>
            </div>
            <p className="sv-note">{l(set$.levels.length > 1 ? TX.multiLevel : TX.multiSame)}</p>
          </>
        )}
        {r && (
          <>
            {many && <h4 className="lz-sub">{l(TX.oneFocus).replace('{n}', String(active + 1))}</h4>}
            <p className="sv-note">
              <b>{l(LEVEL_BY_ID.get(r.level)!.name)}</b> · {r.side === 'B' ? l(TX.midline) : l(TX[r.side])}
              {rMm * 2 < 15 ? ` — ${l(TX.lacune)}` : ''}
            </p>
            {tractTable(r.sig)}
            <h4>{l(TX.cranial)}</h4>
            {signTable(r.signs)}
            {isCrossed(r.sig, r.signs, r.side) && <p className="sv-note lz-crossed">{l(TX.crossed)}</p>}

            <h4>{l(TX.inZone)}</h4>
            {r.zones.length ? (
              <div className="lz-table">
                {r.zones.map((z) => (
                  <div key={`${z.zone.id}-${z.side}`} className="lz-row lz-zone">
                    <i />
                    <span className="lz-mod">
                      <b>
                        {l(z.zone.name)} · {l(TX[z.side])}
                      </b>
                      {z.zone.syndrome && <small>{l(z.zone.syndrome.name)}</small>}
                    </span>
                    <span className="lz-res">{Math.round(z.overlap * 100)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sv-hint">{l(TX.noZone)}</p>
            )}

            <h4>{l(TX.hits)}</h4>
            <div className="lz-hits">
              {r.hits.map((h) => {
                const info = STRUCTURE_BY_ID.get(h.id)
                if (!info) return null
                return (
                  <button
                    key={h.id}
                    style={{ '--c': CATEGORY[info.cat].color } as React.CSSProperties}
                    onClick={() => onPick(h.id)}
                    title={`${Math.round(h.share * 100)}% — ${l(TX.share)}`}
                  >
                    <i />
                    {l(info.name)}
                    <small>{Math.round(h.share * 100)}%</small>
                  </button>
                )
              })}
            </div>
            <div className="lz-actions">
              {!many && (
                <button className="sv-3d" onClick={() => open3d()}>
                  <Box size={13} /> {l(TX.focal3d)}
                </button>
              )}
              {best && (
                <button
                  className="sv-3d"
                  onClick={() => {
                    setLesion({ level: r.level, side: best.side, zone: best.zone.id })
                    point.set(false)
                  }}
                >
                  <Shapes size={13} /> {l(TX.toZone)}
                </button>
              )}
              {best && (
                <button className="sv-3d" onClick={() => setLesson(lesionLessonId({ level: r.level, side: best.side, zone: best.zone.id }))}>
                  <Box size={13} /> {l(TX.zone3d)}
                </button>
              )}
            </div>
            {r.mmPerUnit && <p className="sv-note">{l(TX.approx)}</p>}
          </>
        )}
        {foci.length > 0 && <McDonaldPanel foci={foci} set$={set$} now={point.now} setNow={point.setNow} active={active} setActive={point.setActive} />}
      </>
    )
  }

  return (
    <div className="lz">
      <div className="lz-modes" role="tablist">
        {(['forward', 'reverse'] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
            {m === 'forward' ? <Crosshair size={13} /> : <Search size={13} />}
            {l(TX[m])}
          </button>
        ))}
      </div>

      {mode === 'forward' && canPlace && (
        <div className="lz-seg lz-how">
          <button className={!point.on ? 'on' : ''} onClick={() => point.set(false)}>
            <Shapes size={13} /> {l(TX.byZone)}
          </button>
          <button className={point.on ? 'on' : ''} onClick={() => point.set(true)}>
            <MousePointerClick size={13} /> {l(TX.byPoint)}
          </button>
        </div>
      )}

      {mode === 'forward' && point.on && canPlace ? (
        focalView()
      ) : mode === 'forward' ? (
        <>
          <h4>{l(TX.level)}</h4>
          <div className="lz-chips">
            {LEVELS.map((lv) => (
              <button key={lv.id} className={lv.id === lesion.level ? 'on' : ''} onClick={() => setLesion({ ...lesion, level: lv.id as LesionLevel, zone: 'all' })}>
                {l(lv.name)}
              </button>
            ))}
          </div>
          <h4>{l(TX.side)}</h4>
          <div className="lz-seg">
            {(['L', 'R'] as const).map((s) => (
              <button key={s} className={lesion.side === s ? 'on' : ''} onClick={() => setLesion({ ...lesion, side: s })}>
                {l(TX[s])}
              </button>
            ))}
          </div>
          <h4>{l(TX.zone)}</h4>
          <div className="lz-chips">
            {level.zones.map((z) => (
              <button key={z.id} className={z.id === zone.id ? 'on' : ''} onClick={() => setLesion({ ...lesion, zone: z.id })}>
                {l(z.name)}
              </button>
            ))}
          </div>

          {tractTable(sig)}

          <h4>{l(TX.cranial)}</h4>
          {signTable(signs)}
          {crossed && <p className="sv-note lz-crossed">{l(TX.crossed)}</p>}

          {zone.syndrome && (
            <div className="sv-syndrome lz-syn">
              <b>{l(zone.syndrome.name)}</b>
              <p>{l(zone.syndrome.extra)}</p>
              {zone.syndrome.source && (
                <a className="source-link" href={zone.syndrome.source.url} target="_blank" rel="noreferrer">
                  {zone.syndrome.source.title} <ArrowUpRight size={12} />
                </a>
              )}
            </div>
          )}
          {territory ? (
            <>
              <h4>{l(TX.hits)}</h4>
              <div className="lz-hits">
                {territory.hits.map((id) => {
                  const info = STRUCTURE_BY_ID.get(id)
                  if (!info) return null
                  return (
                    <button key={id} style={{ '--c': CATEGORY[info.cat].color } as React.CSSProperties} onClick={() => onPick(id)}>
                      <i />
                      {l(info.name)}
                    </button>
                  )
                })}
              </div>
              <p className="sv-note">{l(TX.hitsHint)}</p>
            </>
          ) : (
            level.plate && <p className="sv-hint">{l(TX.offPlate)}</p>
          )}
          <div className="lz-actions">
            <button className="sv-3d" onClick={() => setLesson(lesionLessonId({ ...lesion, zone: zone.id }))}>
              <Box size={13} /> {l(TX.in3d)}
            </button>
            {plate && plate.id !== section.id && (
              <button className="sv-3d" onClick={() => openSection(plate.id)}>
                {l(TX.open)} · {plate.code}
              </button>
            )}
          </div>
          <p className="sv-note">{l(TX.rule)}</p>
        </>
      ) : (
        <>
          <h4>{l(TX.findings)}</h4>
          {PATHWAYS.map((p) => (
            <div key={p.id} className="lz-find" style={{ '--c': p.color } as React.CSSProperties}>
              <span className="lz-mod">
                <b>{l(p.modality)}</b>
              </span>
              <div className="lz-seg">
                {(['none', 'L', 'R'] as const).map((s) => (
                  <button key={s} className={(findings[p.id] ?? 'none') === s ? 'on' : ''} onClick={() => setFindings({ ...findings, [p.id]: s })}>
                    {s === 'none' ? l(TX.none) : half(s, p.body === 'face')}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <h4>{l(TX.cranialAsk)}</h4>
          {askable.map((c) => (
            <div key={c.id} className="lz-find lz-find-cn">
              <span className="lz-mod">
                <b>{l(c.name)}</b>
              </span>
              <div className="lz-seg">
                {(['none', 'L', 'R'] as const).map((s) => (
                  <button key={s} className={(cranial[c.id] ?? 'none') === s ? 'on' : ''} onClick={() => setCranial({ ...cranial, [c.id]: s })}>
                    {l(s === 'none' ? TX.none : s === 'L' ? TX.sideL : TX.sideR)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <h4>{l(TX.candidates)}</h4>
          {!anyFinding ? (
            <p className="sv-hint">{l(TX.pick)}</p>
          ) : matches.length === 0 ? (
            <p className="sv-hint">{l(TX.noMatch)}</p>
          ) : (
            <>
              <div className="lz-cands">
                {matches.map((m) => {
                  const lv = LEVEL_BY_ID.get(m.level)!
                  const z = lv.zones.find((x) => x.id === m.zone)!
                  return (
                    <button
                      key={`${m.level}-${m.side}-${m.zone}`}
                      className="lz-cand"
                      onClick={() => {
                        setLesion(m)
                        setMode('forward')
                        if (lv.plate && lv.plate !== section.id) openSection(lv.plate)
                      }}
                    >
                      <span>
                        <b>{l(lv.name)}</b> · {l(TX[m.side])} · {l(z.name)}
                      </span>
                      {z.syndrome && <small>{l(z.syndrome.name)}</small>}
                      {(() => {
                        // What else this lesion gives that was not entered: the bedside test that would confirm it.
                        const more = cranialSigns(m).filter((h) => (cranial[h.sign.id] ?? 'none') === 'none')
                        return more.length ? (
                          <small className="lz-expect">
                            {l(TX.expect)}: {more.map((h) => `${l(h.sign.name)} (${l(h.side === 'L' ? TX.sideL : h.side === 'R' ? TX.sideR : TX.both)})`).join(', ')}
                          </small>
                        ) : null
                      })()}
                    </button>
                  )
                })}
              </div>
              {matches.length > 1 && <p className="sv-note">{l(TX.many)}</p>}
            </>
          )}
        </>
      )}
    </div>
  )
}
