import type { L10n } from './types'
import { SECTIONS, SECTION_BY_ID, type Section } from './sections'
import { LESSON_BY_ID } from './lessons'

/**
 * The "Learn" tab is organised by topic, not by format: each topic gathers
 * its guided 3D lesson(s) and its cross-section plates, so a student who
 * wants "the hippocampus" finds the 3D walk-through and the sections it
 * appears in, in one place. A plate may belong to several topics (the
 * internal-capsule level shows the ventricles, the callosum and the
 * basal ganglia alike).
 */
export interface Topic {
  id: string
  title: L10n
  blurb: L10n
  /** Guided 3D lessons, in order (data/lessons ids). */
  lessons: string[]
  /** Cross-section plates, caudal → rostral or in teaching order (section ids). */
  sections: string[]
}

const regionIds = (...regions: Section['region'][]) => SECTIONS.filter((s) => regions.includes(s.region)).map((s) => s.id)

export const TOPICS: Topic[] = [
  {
    id: 'ventricles',
    title: { en: 'Ventricles and CSF', uz: 'Qorinchalar va likvor' },
    blurb: { en: 'Four cavities, where CSF is made, how it flows, where it blocks.', uz: "To'rt bo'shliq: likvor qayerda hosil bo'ladi, qanday oqadi, qayerda to'siladi." },
    lessons: ['ventricles'],
    sections: ['bg-accumbens', 'bg-capsule-axial', 'thalamus-coronal', 'midbrain-superior-colliculus', 'pons-trigeminal', 'medulla-rostral'],
  },
  {
    id: 'callosum',
    title: { en: 'Corpus callosum and commissures', uz: 'Qadoqsimon tana va komissuralar' },
    blurb: { en: 'The bridge between the hemispheres, the septum beneath it, the split brain.', uz: "Yarim sharlar ko'prigi, uning ostidagi septum, 'bo'lingan miya'." },
    lessons: ['callosum'],
    sections: ['bg-accumbens', 'bg-commissural', 'bg-capsule-axial'],
  },
  {
    id: 'limbic',
    title: { en: 'Limbic system and memory', uz: 'Limbik tizim va xotira' },
    blurb: { en: 'Hippocampus, fornix, mammillary bodies, the Papez circuit.', uz: "Gippokamp, fornix, so'rg'ichsimon tanalar, Papez halqasi." },
    lessons: ['limbic'],
    sections: ['bg-pallidal', 'hypothalamus-mammillary', 'thalamus-coronal', 'thalamus-nuclei-map'],
  },
  {
    id: 'basal-ganglia',
    title: { en: 'Basal ganglia', uz: 'Bazal yadrolar' },
    blurb: { en: 'Striatum, pallidum, STN and SN to scale; DBS targets.', uz: 'Striatum, pallidum, STN va SN masshtabda; DBS nishonlari.' },
    lessons: [],
    sections: regionIds('basal-ganglia'),
  },
  {
    id: 'diencephalon',
    title: { en: 'Thalamus and hypothalamus', uz: 'Talamus va gipotalamus' },
    blurb: { en: 'Thalamic nuclei and hypothalamic levels and zones.', uz: 'Talamus yadrolari, gipotalamus darajalari va zonalari.' },
    lessons: [],
    sections: regionIds('diencephalon', 'hypothalamus'),
  },
  {
    id: 'brainstem',
    title: { en: 'Brainstem', uz: 'Miya ustuni' },
    blurb: { en: 'Ten classic levels from the pyramidal decussation to the pretectum.', uz: "Piramida kesishmasidan pretektumgacha o'nta klassik daraja." },
    lessons: [],
    sections: regionIds('medulla', 'pons', 'midbrain'),
  },
  {
    id: 'cerebellum',
    title: { en: 'Cerebellum', uz: 'Miyacha' },
    blurb: { en: 'Deep cerebellar nuclei and their outflow.', uz: 'Miyachaning chuqur yadrolari va ularning chiqishi.' },
    lessons: [],
    sections: regionIds('cerebellum'),
  },
]

export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]))

/** First topic teaching a lesson (lessons opened from elsewhere land in their topic). */
export const topicOfLesson = (lessonId: string) => TOPICS.find((t) => t.lessons.includes(lessonId))
/** Topics a plate belongs to. */
export const topicsOfSection = (sectionId: string) => TOPICS.filter((t) => t.sections.includes(sectionId))

// Fail loudly in development if a topic names something that does not exist.
if (import.meta.env.DEV) {
  for (const t of TOPICS) {
    for (const id of t.sections) if (!SECTION_BY_ID.has(id)) console.error(`topic ${t.id}: unknown section ${id}`)
    for (const id of t.lessons) if (!LESSON_BY_ID.has(id)) console.error(`topic ${t.id}: unknown lesson ${id}`)
  }
}
