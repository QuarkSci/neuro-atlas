import { LEAF_PARTS, PART_BY_ID, conceptLeafIds } from '../index'
import type { LayerId, SystemId } from '../types'
import type { Lesson, LessonStep, Mni } from './types'
import { VENTRICLES } from './ventricles'
import { CALLOSUM } from './callosum'
import { LIMBIC } from './limbic'

export type { Lesson, LessonStep, LessonLabel, Mni } from './types'

/** Guided 3D lessons, in teaching order. */
export const LESSONS: Lesson[] = [VENTRICLES, CALLOSUM, LIMBIC]
export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]))

/** What the 3D scene needs for one lesson step, resolved to mesh ids. */
export interface LessonStage {
  key: string
  focus: { id: string; color?: string }[]
  context: string[]
  labels: { text: string; at: Mni; color?: string }[]
  view: Mni
  flow: { path: Mni[]; color: string; loop: boolean } | null
  layers: LayerId[]
}

const sided = (ids: string[], side?: 'left' | 'right') => (side ? ids.filter((id) => PART_BY_ID.get(id)?.side === side) : ids)

function contextIds(ref: string, side?: 'left' | 'right') {
  if (ref.startsWith('@')) {
    const sys = ref.slice(1) as SystemId
    return LEAF_PARTS.filter((p) => p.layer === 'gross' && p.system === sys && (!side || p.side === side || p.side === 'midline')).map((p) => p.id)
  }
  return sided(conceptLeafIds(ref), side)
}

/** Centroid of a concept's (one-sided) parts, MNI mm. */
function conceptCentroid(concept: string, side?: 'left' | 'right'): Mni | null {
  const cs = sided(conceptLeafIds(concept), side)
    .map((id) => PART_BY_ID.get(id)?.centroid)
    .filter((c): c is [number, number, number] => !!c)
  if (!cs.length) return null
  return [0, 1, 2].map((i) => cs.reduce((a, c) => a + c[i], 0) / cs.length) as Mni
}

export function lessonStage(lesson: Lesson, index: number, lang: 'en' | 'uz', quiz: boolean): LessonStage {
  const step: LessonStep = lesson.steps[index]
  const focus: LessonStage['focus'] = []
  const seen = new Set<string>()
  for (const item of step.show) {
    for (const id of sided(conceptLeafIds(item.concept), item.side)) {
      if (seen.has(id)) continue
      seen.add(id)
      // A quiz hides the teaching colours: the student must recognise the shape.
      focus.push({ id, color: quiz ? undefined : item.color })
    }
  }
  const context = [...new Set((step.context ?? []).flatMap((c) => contextIds(c.ref, c.side)))].filter((id) => !seen.has(id))
  let flow: LessonStage['flow'] = null
  if (step.flow) {
    const path = step.flow.path ?? (step.flow.via ?? []).map((v) => conceptCentroid(v.concept, v.side)).filter((p): p is Mni => !!p)
    if (path.length > 1) flow = { path, color: step.flow.color, loop: !!step.flow.loop }
  }
  const layers = [...new Set([...(step.layers ?? []), ...focus.map((f) => PART_BY_ID.get(f.id)!.layer)])]
  return {
    key: `${lesson.id}:${index}:${quiz ? 'q' : ''}`,
    focus,
    context,
    labels: quiz ? [] : (step.labels ?? []).map((l) => ({ text: l.text[lang] ?? l.text.en, at: l.at, color: l.color })),
    view: step.view,
    flow: quiz ? null : flow,
    layers,
  }
}
