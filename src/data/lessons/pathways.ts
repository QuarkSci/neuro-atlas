import { PATHWAYS, type Pathway } from '../pathways'
import type { L10n } from '../types'
import type { ContextItem, Lesson, LessonStep, StageItem } from './types'

/**
 * The three long-tract lessons are generated from data/pathways: an overview
 * of the whole course, one step per station (opening its plate), and a
 * summary with the crossing rule and a tap-quiz. Writing the pathway once
 * keeps the 3D lesson, the plate trace and the lesion simulator in step.
 */

const ORDINAL: Record<1 | 2 | 3, L10n> = {
  1: { en: '1st neuron', uz: '1-neyron' },
  2: { en: '2nd neuron', uz: '2-neyron' },
  3: { en: '3rd neuron', uz: '3-neyron' },
}

const GHOST: ContextItem[] = [{ ref: '@brainstem' }, { ref: '@diencephalon', side: 'left' }, { ref: '@telencephalon', side: 'left' }]

const QUIZ: Record<string, { ask: L10n; answer: string[] }> = {
  'path-cst': { ask: { en: 'Tap the cerebral peduncle the tract runs through.', uz: "Trakt o'tadigan miya oyoqchasini bosing." }, answer: ['wm-cerebral-peduncle'] },
  'path-dcml': { ask: { en: 'Tap the medial lemniscus.', uz: 'Medial lemniskni bosing.' }, answer: ['wm-medial-lemniscus'] },
  'path-als': { ask: { en: 'Tap the thalamic relay of the pathway.', uz: "Yo'lning talamusdagi relesini bosing." }, answer: ['j-vpl'] },
}

const key = (s: StageItem) => `${s.concept}|${s.side ?? ''}`

function pathwayLesson(p: Pathway): Lesson {
  const all: StageItem[] = []
  for (const st of p.stations) for (const s of st.show) if (!all.some((x) => key(x) === key(s))) all.push({ ...s, color: p.color })
  const flow = { path: p.path, color: p.color }
  const layers = ['jhu', 'julich', 'bstem'] as LessonStep['layers']
  const label = (i: number) => {
    const st = p.stations[i]
    return { text: st.label, at: st.at, color: p.color }
  }

  const overview: LessonStep = {
    title: p.title,
    text: {
      en: `${p.blurb.en} Carries: ${p.modality.en.toLowerCase()}. ${p.crossing.en} Traced here for the right half of the body (left hemisphere).`,
      uz: `${p.blurb.uz} Olib boradi: ${(p.modality.uz ?? p.modality.en).toLowerCase()}. ${p.crossing.uz} Bu yerda tananing o'ng yarmi (chap yarim shar) uchun ko'rsatilgan.`,
    },
    show: all,
    context: GHOST,
    labels: p.stations.map((_, i) => label(i)),
    view: [-1, 0.35, 0.1],
    flow,
    layers,
  }

  const steps: LessonStep[] = p.stations.map((st, i) => ({
    title: { en: `${ORDINAL[st.neuron].en} · ${st.name.en}`, uz: `${ORDINAL[st.neuron].uz} · ${st.name.uz}` },
    text: st.text,
    memo: st.memo,
    deep: st.deep,
    show: st.show.map((s) => ({ ...s, color: p.color })),
    context: [...GHOST, ...all.filter((a) => !st.show.some((s) => key(s) === key(a))).map((a) => ({ ref: a.concept, side: a.side }))],
    labels: [label(i)],
    view: st.view,
    flow,
    layers,
    section: st.plate,
  }))

  const summary: LessonStep = {
    title: { en: 'Where it crosses — and what a lesion does', uz: "Qayerda kesishadi — va o'choq nima qiladi" },
    text: {
      en: `${p.crossing.en} A lesion above the crossing gives signs on the opposite side of the body; below it, on the same side. Open a plate and use the Lesion tab to test any level and side.`,
      uz: `${p.crossing.uz} Kesishmadan yuqoridagi o'choq belgilarni tananing qarama-qarshi tomonida, pastdagisi — o'sha tomonda beradi. Plastinkani ochib, "Shikastlanish" bo'limida istalgan daraja va tomonni sinab ko'ring.`,
    },
    show: all,
    context: GHOST,
    labels: p.stations.filter((s) => s.cross).map((s) => ({ text: s.label, at: s.at, color: p.color })),
    view: [-0.6, 0.8, 0.1],
    flow,
    layers,
    section: p.stations.find((s) => s.cross)?.plate,
    quiz: QUIZ[p.id] ? [QUIZ[p.id]] : undefined,
  }

  return { id: p.id, title: p.title, blurb: p.blurb, steps: [overview, ...steps, summary], sources: p.sources }
}

export const PATHWAY_LESSONS: Lesson[] = PATHWAYS.map(pathwayLesson)
