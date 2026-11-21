import { PATHWAYS, type BodySide, type PathStation, type Pathway } from '../pathways'
import { LEVEL_BY_ID, cutBy, type Lesion } from '../lesions'
import type { L10n } from '../types'
import type { ContextItem, Lesson, LessonStep, Mni, StageItem } from './types'

/**
 * A 3D lesson built on the fly from the lesion simulator: the lesion as a
 * sphere where the cut tracts run at that level, each cut tract streaming
 * from its source up to the lesion and dark beyond it (the part that has
 * lost its input — the stretch that undergoes Wallerian degeneration), one
 * step per cut tract with the crossing rule, and the territory's syndrome.
 *
 * Pathways are drawn for the right body half; the left body half's copy is
 * the same course mirrored across the midline.
 */

export const LESION_COLOR = '#ff3b30'
export const LESION_PREFIX = 'lesion:'

/** Faint context: the brainstem whole, the forebrain only on the lesion's side (both hemispheres would fog the stage). */
const ghost = (l: Lesion): ContextItem[] => {
  const side = l.side === 'L' ? 'left' : 'right'
  return [{ ref: '@brainstem' }, { ref: '@diencephalon', side }, { ref: '@telencephalon', side }]
}
export const LAYERS = ['jhu', 'julich', 'bstem'] as LessonStep['layers']

const TX = {
  lesion: { en: 'Lesion', uz: "O'choq" },
  title: { en: 'Lesion in 3D', uz: "O'choq 3D da" },
  L: { en: 'left', uz: 'chap' },
  R: { en: 'right', uz: "o'ng" },
  cut: { en: 'Cut', uz: 'Kesiladi' },
  spared: { en: 'Spared', uz: 'Saqlanadi' },
  none: { en: 'no long tract', uz: "uzun yo'l yo'q" },
} satisfies Record<string, L10n>

export const WALLER = [
  {
    title: 'Thomalla et al. 2004, NeuroImage — DTI detects early Wallerian degeneration of the pyramidal tract after ischemic stroke',
    url: 'https://doi.org/10.1016/j.neuroimage.2004.03.041',
  },
  {
    title: 'Puig et al. 2010, AJNR — Wallerian degeneration in the corticospinal tract evaluated by DTI correlates with motor deficit 30 days after MCA stroke',
    url: 'https://doi.org/10.3174/ajnr.A2038',
  },
]

export const mirror = (p: Mni): Mni => [-p[0], p[1], p[2]]
const flipSide = (s?: 'left' | 'right') => (s === 'left' ? 'right' : s === 'right' ? 'left' : undefined)
const join = (xs: string[]) => xs.join(', ')
const uz = (x: L10n) => x.uz ?? x.en

/** The id under which a lesion's lesson is registered. */
export const lesionLessonId = (l: Lesion) => `${LESION_PREFIX}${l.level}:${l.side}:${l.zone}`

export function parseLesionId(id: string): Lesion | null {
  if (!id.startsWith(LESION_PREFIX)) return null
  const [level, side, zone] = id.slice(LESION_PREFIX.length).split(':')
  const lv = LEVEL_BY_ID.get(level as Lesion['level'])
  if (!lv || (side !== 'L' && side !== 'R') || !lv.zones.some((z) => z.id === zone)) return null
  return { level: lv.id, side, zone }
}

/** Stations of a tract the lesion takes in, and whether through its own level or an `also` passage. */
function hitStations(p: Pathway, lesion: Lesion) {
  return p.stations
    .map((st) => {
      const own = st.level === lesion.level && st.zones.includes(lesion.zone)
      const also = (st.also ?? []).some((r) => r.level === lesion.level && r.zones.includes(lesion.zone))
      return own || also ? { st, own } : null
    })
    .filter((x): x is { st: PathStation; own: boolean } => !!x)
}

/** A station's anchor on the lesion's side of the midline. */
const atOnSide = (st: PathStation, lesion: Lesion): Mni => (st.side === lesion.side ? st.at : mirror(st.at))

/** Lesion centre and radius (MNI mm), from where the cut fibres run at this level. */
export function lesionSphere(lesion: Lesion): { at: Mni; r: number } {
  const hits = PATHWAYS.flatMap((p) => hitStations(p, lesion))
  const own = hits.filter((h) => h.own)
  let pts = own.map((h) => atOnSide(h.st, lesion))
  if (!pts.length) {
    // Only passing fibres (the ALS through the caudal medulla): their place, at the height of this level's own stations.
    const level = PATHWAYS.flatMap((p) => p.stations).filter((st) => st.level === lesion.level)
    const z = level.length ? level.reduce((a, st) => a + st.at[2], 0) / level.length : null
    pts = hits.map((h) => {
      const a = atOnSide(h.st, lesion)
      return [a[0], a[1], z ?? a[2]] as Mni
    })
  }
  if (!pts.length) return { at: [0, 0, 0], r: 0 }
  const at = [0, 1, 2].map((i) => pts.reduce((a, p) => a + p[i], 0) / pts.length) as Mni
  const spread = Math.max(0, ...pts.map((p) => Math.hypot(p[0] - at[0], p[1] - at[1], p[2] - at[2])))
  const r = Math.min(10, Math.max(4.5, spread + 2.5))
  return { at, r }
}

/** The tract's stage items for one body half (the left half is the mirror copy). */
export function itemsFor(p: Pathway, body: BodySide): StageItem[] {
  const out: StageItem[] = []
  for (const st of p.stations)
    for (const s of st.show) {
      const side = body === 'R' ? s.side : flipSide(s.side)
      if (!out.some((x) => x.concept === s.concept && x.side === side)) out.push({ concept: s.concept, side, color: p.color })
    }
  return out
}

export const pathFor = (p: Pathway, body: BodySide): Mni[] => (body === 'R' ? p.path : p.path.map(mirror))

/**
 * Cranial-nerve / level signs of a lesion. They are computed from the plate
 * geometry in the UI layer (ui/lesionSigns), which registers itself here at
 * load — before any lesson is built, since lessons are built on demand.
 */
export interface LessonSign {
  name: L10n
  short: L10n
  detail: L10n
  side: BodySide | 'B'
  /** 3D concepts that carry the sign, where the atlas has them (cerebellar peduncles, red nucleus). */
  concepts: string[]
}
let signProvider: ((l: Lesion) => LessonSign[]) | null = null
export const setLesionSignProvider = (f: (l: Lesion) => LessonSign[]) => {
  signProvider = f
}

export const SIGN_COLOR = '#ff9f0a'

export function lesionLesson(lesion: Lesion): Lesson {
  const level = LEVEL_BY_ID.get(lesion.level)!
  const zone = level.zones.find((z) => z.id === lesion.zone) ?? level.zones[0]
  const sphere = lesionSphere(lesion)
  const sideName = TX[lesion.side]
  const where: L10n = {
    en: `${level.name.en} · ${sideName.en} · ${zone.name.en}`,
    uz: `${uz(level.name)} · ${uz(sideName)} · ${uz(zone.name)}`,
  }

  const cut = PATHWAYS.map((p) => ({ p, sides: [...cutBy(p, lesion)] as BodySide[] })).filter((x) => x.sides.length)
  const spared = PATHWAYS.filter((p) => !cut.some((c) => c.p.id === p.id))
  const lesionLabel = { text: TX.lesion, at: sphere.at, color: LESION_COLOR }
  const firstHit = cut.length ? (hitStations(cut[0].p, lesion).find((h) => h.own) ?? hitStations(cut[0].p, lesion)[0]) : undefined
  const view: Mni = firstHit ? (lesion.side === firstHit.st.side ? firstHit.st.view : mirror(firstHit.st.view)) : [lesion.side === 'L' ? -1 : 1, 0.3, 0.2]

  const bodyText = (sides: BodySide[], lang: 'en' | 'uz', face?: boolean) => {
    if (sides.length === 2) return lang === 'en' ? 'both sides of the body' : 'tananing ikki tomonida'
    const s = sides[0]
    const ipsi = s === lesion.side
    return lang === 'en'
      ? `${TX[s].en} ${face ? 'face' : 'body'} (${ipsi ? 'ipsilateral' : 'contralateral'})`
      : `${uz(TX[s])} ${face ? 'yuzda' : 'tanada'} (${ipsi ? "o'sha tomonda" : 'qarama-qarshi'})`
  }
  const why = (sides: BodySide[], p: Pathway, lang: 'en' | 'uz') => {
    if (sides.length === 2)
      return lang === 'en'
        ? 'The lesion sits on the crossing itself, where fibres of both halves meet in the midline.'
        : "O'choq aynan kesishmaning ustida: bu yerda ikki yarmning tolalari o'rta chiziqda uchrashadi."
    const ipsi = sides[0] === lesion.side
    return lang === 'en'
      ? `${ipsi ? 'The lesion is below the crossing — the fibres have not crossed yet,' : 'The lesion is above the crossing — the fibres have already crossed,'} so the deficit is ${ipsi ? 'on the same side' : 'on the opposite side'}. ${p.crossing.en}`
      : `${ipsi ? "O'choq kesishmadan pastda — tolalar hali kesishmagan," : "O'choq kesishmadan yuqorida — tolalar allaqachon kesishgan,"} shuning uchun belgi ${ipsi ? "o'sha tomonda" : 'qarama-qarshi tomonda'}. ${uz(p.crossing)}`
  }

  const flows = cut.flatMap(({ p, sides }) => sides.map((s) => ({ path: pathFor(p, s), color: p.color, cut: sphere.at })))
  const show = cut.flatMap(({ p, sides }) => sides.flatMap((s) => itemsFor(p, s)))

  const signs = signProvider?.(lesion) ?? []
  // Crossed signs (cranial nerve on the lesion's side, long tract on the other) are the hallmark of a brainstem lesion.
  const crossedMemo: L10n | undefined =
    signs.some((h) => h.side === lesion.side) && cut.some(({ sides }) => sides.length === 1 && sides[0] !== lesion.side)
      ? {
          en: 'Crossed signs — cranial nerve on the side of the lesion, body on the other — mean the brainstem.',
          uz: "Kesishgan belgilar — kalla nervi o'choq tomonida, tana qarama-qarshi tomonda — miya ustunini bildiradi.",
        }
      : undefined
  const signSide = (s: BodySide | 'B', lang: 'en' | 'uz') =>
    s === 'B'
      ? lang === 'en'
        ? 'both sides'
        : 'ikki tomonda'
      : `${lang === 'en' ? TX[s].en : uz(TX[s])}${s === lesion.side ? (lang === 'en' ? ', ipsilateral' : ", o'sha tomonda") : lang === 'en' ? ', contralateral' : ', qarama-qarshi'}`
  const signList = (lang: 'en' | 'uz') => join(signs.map((h) => `${lang === 'en' ? h.name.en : uz(h.name)} (${signSide(h.side, lang)})`))
  // Sign labels fan out around the lesion, on its outer side, so each one's leader ends at the lesion.
  const out = lesion.side === 'L' ? -1 : 1
  const signLabels = signs.map((h, i) => ({
    text: h.short,
    at: [sphere.at[0] + out * sphere.r * 0.6, sphere.at[1], sphere.at[2] + (i - (signs.length - 1) / 2) * 1.2] as Mni,
    color: SIGN_COLOR,
  }))
  const hemi = lesion.side === 'L' ? ('left' as const) : ('right' as const)
  const signShow: StageItem[] = [...new Set(signs.flatMap((h) => h.concepts))].map((concept) => ({ concept, side: hemi, color: SIGN_COLOR }))

  const overview: LessonStep = {
    title: { en: `${TX.title.en}: ${where.en}`, uz: `${TX.title.uz}: ${where.uz}` },
    text: {
      en: cut.length
        ? `${TX.cut.en}: ${join(cut.map(({ p, sides }) => `${p.short.en} → ${bodyText(sides, 'en', p.body === 'face')}`))}. ${spared.length ? `${TX.spared.en}: ${join(spared.map((p) => p.short.en))}.` : ''} ${signs.length ? `Level signs: ${signList('en')}.` : ''} Each tract streams from its origin up to the lesion; the dark stretch beyond it has lost its input and will undergo Wallerian degeneration.`
        : `${TX.cut.en}: ${TX.none.en}.`,
      uz: cut.length
        ? `${TX.cut.uz}: ${join(cut.map(({ p, sides }) => `${uz(p.short)} → ${bodyText(sides, 'uz', p.body === 'face')}`))}. ${spared.length ? `${TX.spared.uz}: ${join(spared.map((p) => uz(p.short)))}.` : ''} ${signs.length ? `Daraja belgilari: ${signList('uz')}.` : ''} Har bir yo'l boshidan o'choqqacha oqadi; undan keyingi qorong'i qism kirishini yo'qotgan va Waller degeneratsiyasiga uchraydi.`
        : `${TX.cut.uz}: ${TX.none.uz}.`,
    },
    deep: {
      en: 'Wallerian degeneration runs away from the cell body: below a capsular or brainstem lesion the corticospinal tract shrinks over weeks to months and becomes visible on MRI/DTI as a thin, hyperintense or low-FA pyramid — DTI shows it within days (Thomalla 2004), and the FA drop in the pontine tract at 30 days correlates with the motor deficit (Puig 2010).',
      uz: "Waller degeneratsiyasi hujayra tanasidan uzoqlashadi: kapsula yoki miya ustuni o'chog'idan pastda kortikospinal yo'l haftalar-oylar davomida kichrayadi va MRT/DTI da ingichka, giperintens yoki past FA li piramida bo'lib ko'rinadi — DTI uni bir necha kunda ko'radi (Thomalla 2004), 30-kunda ko'prikdagi yo'lda FA pasayishi harakat nuqsoni bilan bog'liq (Puig 2010).",
    },
    show,
    context: ghost(lesion),
    labels: [lesionLabel],
    view,
    flows,
    lesion: sphere,
    layers: LAYERS,
    section: level.plate,
  }

  const steps: LessonStep[] = cut.map(({ p, sides }) => {
    const hits = hitStations(p, lesion)
    const st = (hits.find((h) => h.own) ?? hits[0]).st
    return {
      title: { en: `${p.short.en}: ${bodyText(sides, 'en', p.body === 'face')}`, uz: `${uz(p.short)}: ${bodyText(sides, 'uz', p.body === 'face')}` },
      text: { en: `${p.modality.en} — lost. ${why(sides, p, 'en')}`, uz: `${uz(p.modality)} — yo'qoladi. ${why(sides, p, 'uz')}` },
      memo: st.memo,
      show: sides.flatMap((s) => itemsFor(p, s)),
      context: ghost(lesion),
      labels: [lesionLabel, ...p.stations.filter((x) => x.cross).flatMap((x) => sides.map((s) => ({ text: x.label, at: s === 'R' ? x.at : mirror(x.at), color: p.color })))],
      view,
      flows: sides.map((s) => ({ path: pathFor(p, s), color: p.color, cut: sphere.at })),
      lesion: sphere,
      layers: LAYERS,
      section: level.plate,
    }
  })

  // What sets the level: the cranial-nerve nuclei and fascicles in the territory (most have no 3D mesh — the labels stand in).
  const signStep: LessonStep[] = signs.length
    ? [
        {
          title: { en: 'Signs that set the level', uz: 'Darajani aniqlaydigan belgilar' },
          text: {
            en: `${signs.map((h) => `• ${h.name.en} — ${signSide(h.side, 'en')}. ${h.detail.en}`).join('\n')}\n\nLong-tract signs only say "above or below a crossing"; these say exactly where.`,
            uz: `${signs.map((h) => `• ${uz(h.name)} — ${signSide(h.side, 'uz')}. ${uz(h.detail)}`).join('\n')}\n\nUzun yo'l belgilari faqat "kesishmadan yuqori yoki past" deydi; bular aniq joyni aytadi.`,
          },
          memo: crossedMemo,
          show: signShow.length ? [...signShow, ...show] : show,
          context: ghost(lesion),
          labels: [lesionLabel, ...signLabels],
          view,
          flows,
          lesion: sphere,
          layers: LAYERS,
          section: level.plate,
        },
      ]
    : []

  const syndrome: LessonStep[] = zone.syndrome
    ? [
        {
          title: zone.syndrome.name,
          text: zone.syndrome.extra,
          show,
          context: ghost(lesion),
          labels: [lesionLabel],
          view,
          flows,
          lesion: sphere,
          layers: LAYERS,
          section: level.plate,
        },
      ]
    : []

  return {
    id: lesionLessonId(lesion),
    title: { en: `${TX.title.en} · ${where.en}`, uz: `${TX.title.uz} · ${where.uz}` },
    blurb: where,
    steps: [overview, ...signStep, ...steps, ...syndrome],
    sources: [...(zone.syndrome?.source ? [zone.syndrome.source] : []), ...cut.flatMap(({ p }) => p.sources.slice(0, 1)), ...WALLER],
  }
}
