import { LESSON_BY_ID, type Lesson, type LessonStep, type Mni } from '@/data/lessons'
import { LAYERS, LESION_COLOR, SIGN_COLOR, WALLER, itemsFor, pathFor } from '@/data/lessons/lesion'
import type { ContextItem, StageItem } from '@/data/lessons/types'
import { LEVEL_BY_ID } from '@/data/lesions'
import { PATHWAYS, type BodySide } from '@/data/pathways'
import { SECTION_BY_ID } from '@/data/sections'
import type { L10n } from '@/data/types'
import { focalMni, type FocalLesion, type FocalSet } from './lesionFocal'

/**
 * The free lesions in 3D: each disc dropped on a plate becomes a sphere at
 * its own place in MNI space (focalMni — the plate laid over the atlas cut of
 * the same level), not the nearest classic territory's. Every tract a lesion
 * cuts streams up to that very lesion and is dark beyond it. One overview
 * step with all of them, then one step per lesion in time order, with the
 * others left faint — so multifocal disease reads as places and times.
 */
export const FOCAL_PREFIX = 'focal:'
const GD_COLOR = '#ffd60a'

const TX = {
  title: { en: 'Free lesions in 3D', uz: "Erkin o'choqlar 3D da" },
  all: { en: 'All lesions', uz: "Barcha o'choqlar" },
  one: { en: 'Lesion {n}', uz: "{n}-o'choq" },
  month: { en: 'mo', uz: 'oy' },
  cut: { en: 'Cut', uz: 'Kesiladi' },
  none: { en: 'no long tract', uz: "uzun yo'l kesilmaydi" },
  silent: { en: ' — a silent lesion, seen only on MRI', uz: " — belgisiz o'choq, faqat MRTda ko'rinadi" },
  signs: { en: 'Level signs', uz: 'Daraja belgilari' },
  bodyL: { en: 'left body', uz: 'chap tana' },
  bodyR: { en: 'right body', uz: "o'ng tana" },
  faceL: { en: 'left face', uz: 'chap yuz' },
  faceR: { en: 'right face', uz: "o'ng yuz" },
  both: { en: 'both sides', uz: 'ikki tomonda' },
  L: { en: 'left', uz: 'chap' },
  R: { en: 'right', uz: "o'ng" },
  gd: { en: 'enhancing (Gd+)', uz: "kontrast yig'adi (Gd+)" },
  overview: {
    en: 'Each sphere stands where its disc lies on the plate (placed through the atlas cut of that level, ≈ a few mm). Every cut tract streams up to the lesion that cuts it and is dark beyond it. Yellow: enhancing (Gd+) lesions — active, weeks old.',
    uz: "Har bir shar plastinkadagi diski turgan joyda (o'sha darajaning atlas kesimi orqali, ≈ bir necha mm aniqlikda). Kesilgan har bir yo'l uni kesgan o'choqqacha oqadi, undan keyin qorong'i. Sariq: Gd+ o'choqlar — faol, bir necha haftalik.",
  },
  deep: {
    en: 'In multiple sclerosis the place of a plaque explains the attack, but the count of places and times is what makes the diagnosis: dissemination in space and in time (McDonald). Silent lesions — periventricular, juxtacortical — outnumber symptomatic ones roughly ten to one, which is why MRI, not the clinic, usually proves dissemination.',
    uz: "Tarqoq sklerozda pilakchaning joyi xurujni tushuntiradi, lekin tashxisni joylar va vaqtlar soni qo'yadi: makonda va vaqtda tarqalish (McDonald). Belgisiz o'choqlar — periventrikulyar, po'stloq yoni — belgilisidan taxminan o'n barobar ko'p, shuning uchun tarqalishni odatda klinika emas, MRT isbotlaydi.",
  },
} satisfies Record<string, L10n>

const uz = (x: L10n) => x.uz ?? x.en
const both = (f: (x: L10n) => string, parts: (L10n | string)[]) => parts.map((p) => (typeof p === 'string' ? p : f(p))).join('')
const tr = (parts: (L10n | string)[]): L10n => ({ en: both((x) => x.en, parts), uz: both(uz, parts) })

let made: string | null = null

/** Build the lesson for these lesions, register it, and return its id (the previous one is dropped). */
export function focalLesson(foci: FocalLesion[], set: FocalSet): string | null {
  const spheres = foci.map((f) => focalMni(f))
  const live = foci.map((_, i) => i).filter((i) => spheres[i] && set.each[i])
  if (!live.length) return null

  const side = (i: number): 'left' | 'right' => (spheres[i]!.at[0] < 0 ? 'left' : 'right')
  // Forebrain context only on the side(s) of lesions clearly off the midline (both hemispheres fog the stage).
  const off = live.filter((i) => Math.abs(spheres[i]!.at[0]) > 4)
  const sides = [...new Set((off.length ? off : live).map(side))]
  const context: ContextItem[] = [
    { ref: '@brainstem' },
    ...sides.flatMap((s) => [{ ref: '@diencephalon', side: s } as ContextItem, { ref: '@telencephalon', side: s } as ContextItem]),
  ]
  const ball = (i: number, dim = false) => ({ ...spheres[i]!, color: foci[i].gd ? GD_COLOR : LESION_COLOR, dim })
  const label = (i: number) => ({ text: { en: String(i + 1), uz: String(i + 1) }, at: spheres[i]!.at, color: foci[i].gd ? GD_COLOR : LESION_COLOR })

  // The tracts each lesion cuts, per body half; a tract streams to the first lesion (in time) that cuts it.
  const cutOf = (i: number) =>
    PATHWAYS.flatMap((p) => {
      const s = set.each[i]!.sig[p.id]
      return s === 'none' ? [] : (s === 'B' ? (['L', 'R'] as BodySide[]) : [s]).map((b) => ({ p, b }))
    })
  const order = [...live].sort((a, b) => (foci[a].t ?? 0) - (foci[b].t ?? 0) || a - b)
  const flowsFor = (list: number[]) => {
    const seen = new Set<string>()
    const out: NonNullable<LessonStep['flows']> = []
    for (const i of list)
      for (const { p, b } of cutOf(i)) {
        if (seen.has(p.id + b)) continue
        seen.add(p.id + b)
        out.push({ path: pathFor(p, b), color: p.color, cut: spheres[i]!.at })
      }
    return out
  }
  const showFor = (list: number[]): StageItem[] => {
    const out: StageItem[] = []
    for (const i of list) for (const { p, b } of cutOf(i)) for (const it of itemsFor(p, b)) if (!out.some((x) => x.concept === it.concept && x.side === it.side)) out.push(it)
    return out
  }
  const body = (b: BodySide | 'B', face: boolean) => (b === 'B' ? TX.both : face ? (b === 'L' ? TX.faceL : TX.faceR) : b === 'L' ? TX.bodyL : TX.bodyR)
  const view = (i: number): Mni => [spheres[i]!.at[0] < 0 ? -1 : 1, 0.15, 0.35]

  const centre = live.map((i) => spheres[i]!.at).reduce((a, p) => a.map((x, k) => x + p[k] / live.length) as Mni, [0, 0, 0] as Mni)
  const overview: LessonStep = {
    title: tr([TX.all, ` · ${live.length}`]),
    text: TX.overview,
    deep: TX.deep,
    show: showFor(order),
    context,
    labels: order.map(label),
    view: [centre[0] < 0 ? -1 : 1, 0.2, 0.5],
    flows: flowsFor(order),
    lesions: order.map((i) => ball(i)),
    layers: LAYERS,
  }

  const steps: LessonStep[] = order.map((i) => {
    const f = foci[i]
    const r = set.each[i]!
    const plate = SECTION_BY_ID.get(f.plate)
    const cuts = PATHWAYS.filter((p) => r.sig[p.id] !== 'none')
    const lines: (L10n | string)[] = [
      LEVEL_BY_ID.get(r.level)!.name,
      ' · ',
      r.side === 'B' ? TX.both : TX[r.side],
      ` · ${(f.rMm * 2).toFixed(0)} mm`,
      f.gd ? ' · ' : '',
      ...(f.gd ? [TX.gd] : []),
      '. ',
      TX.cut,
      ': ',
    ]
    if (cuts.length) cuts.forEach((p, k) => lines.push(...(k ? [', '] : []), p.short, ' → ', body(r.sig[p.id] as BodySide | 'B', p.body === 'face')))
    else lines.push(TX.none, ...(r.signs.length ? [] : [TX.silent]))
    lines.push('.')
    if (r.signs.length) {
      lines.push(' ', TX.signs, ': ')
      r.signs.forEach((h, k) => lines.push(...(k ? [', '] : []), h.sign.name, ' (', h.side === 'B' ? TX.both : TX[h.side], ')'))
      lines.push('.')
    }
    return {
      title: {
        en: `${TX.one.en.replace('{n}', String(i + 1))} · ${plate?.code ?? ''} · ${f.t ?? 0} ${TX.month.en}`,
        uz: `${uz(TX.one).replace('{n}', String(i + 1))} · ${plate?.code ?? ''} · ${f.t ?? 0} ${uz(TX.month)}`,
      },
      text: tr(lines),
      show: showFor([i]),
      context,
      labels: [
        label(i),
        ...r.signs.map((h, k) => ({
          text: h.sign.short,
          at: [spheres[i]!.at[0] + (spheres[i]!.at[0] < 0 ? -1 : 1) * f.rMm * 0.6, spheres[i]!.at[1], spheres[i]!.at[2] + (k - (r.signs.length - 1) / 2) * 1.2] as Mni,
          color: SIGN_COLOR,
        })),
      ],
      view: view(i),
      flows: flowsFor([i]),
      lesions: [ball(i), ...live.filter((j) => j !== i).map((j) => ball(j, true))],
      layers: LAYERS,
      section: f.plate,
    }
  })

  const id = `${FOCAL_PREFIX}${Date.now().toString(36)}`
  const lesson: Lesson = {
    id,
    title: TX.title,
    blurb: tr([TX.all, ` · ${live.length}`]),
    // One lesion: its own step says it all.
    steps: steps.length > 1 ? [overview, ...steps] : steps.map((st) => ({ ...st, deep: TX.deep })),
    sources: [
      {
        title: 'Thompson et al. 2018, Lancet Neurol — Diagnosis of multiple sclerosis: 2017 revisions of the McDonald criteria',
        url: 'https://doi.org/10.1016/S1474-4422(17)30470-2',
      },
      ...WALLER,
    ],
  }
  if (made) LESSON_BY_ID.delete(made)
  LESSON_BY_ID.set(id, lesson)
  made = id
  return id
}
