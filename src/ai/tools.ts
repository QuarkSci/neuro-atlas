import { CONCEPT_BY_ID, LAYERS, PART_BY_ID, leafIds, conceptLeafIds } from '@/data'
import { LESSONS, LESSON_BY_ID } from '@/data/lessons'
import { lesionLessonId } from '@/data/lessons/lesion'
import { LEVELS, LEVEL_BY_ID, signature, type Lesion } from '@/data/lesions'
import { PATHWAYS, PATHWAY_BY_ID, type BodySide, type LesionLevel } from '@/data/pathways'
import { normalise, resultLeaves, searchAtlas } from '@/data/search'
import { SECTIONS, SECTION_BY_ID, STRUCTURE_BY_ID } from '@/data/sections'
import type { LayerId, Part } from '@/data/types'
import { useAtlas, type View } from '@/store/useAtlas'
import { cranialSigns } from '@/ui/lesionSigns'
import { focalOn, focalPlate, focalSet, structureCentre, type FocalLesion } from '@/ui/lesionFocal'
import { focalLesson } from '@/ui/focalLesson'
import { useScreen } from './screen'
import type { ToolCall, ToolResult, ToolSpec } from './types'

/**
 * AI-3: the tutor drives the app. Each tool is a reversible UI action on the
 * store (select a structure, open a plate, place a lesion, trace a tract,
 * open a lesson, change the view) and returns a short factual result the
 * model reads back — for a lesion, the simulator's own read-out — so it can
 * explain what the student is now looking at. Every call is shown in the chat
 * as an action chip.
 */

const VIEWS: View[] = ['three-quarter', 'lateral', 'front', 'top']
const plateList = SECTIONS.filter((s) => s.plane || focalPlate(s))
  .map((s) => `${s.code}=${s.title.en.split(' — ')[0]}`)
  .join('; ')
const lessonList = LESSONS.map((l) => `${l.id} (${l.title.en})`).join('; ')
const levelList = LEVELS.map((lv) => `${lv.id}: ${lv.zones.map((z) => z.id + (z.syndrome ? `=${z.syndrome.name.en}` : '')).join(', ')}`).join(' | ')

const str = { type: 'string' }
const obj = (properties: Record<string, unknown>, required: string[] = []): ToolSpec['parameters'] => ({ type: 'object', properties, required, additionalProperties: false })

export const TOOLS: ToolSpec[] = [
  {
    name: 'find_structure',
    description: 'Search the atlas (English, Uzbek or Latin names and abbreviations) for 3D structures. Returns ids to use with select_structure.',
    parameters: obj({ query: { ...str, description: 'Name or abbreviation, e.g. "thalamus", "area 4a", "ko\'k dog\'"' } }, ['query']),
  },
  {
    name: 'select_structure',
    description: 'Select and highlight a structure in the 3D model (both sides for a paired concept) and open its info card. Give an id from find_structure, or a name.',
    parameters: obj({ id: { ...str, description: 'Part or concept id (preferred)' }, query: { ...str, description: 'Name, if no id' } }),
  },
  {
    name: 'open_plate',
    description: `Open a cross-section plate in the plate viewer. Plates: ${plateList}. Returns the structures drawn on it (ids for place_lesion).`,
    parameters: obj(
      {
        plate: { ...str, description: 'Plate code (e.g. "U3", "K1") or id' },
        tab: { type: 'string', enum: ['structures', 'level', 'lesion'], description: 'Side panel tab to show' },
      },
      ['plate'],
    ),
  },
  {
    name: 'place_lesion',
    description:
      "Drop a free (disc) lesion on a plate, centred on a structure, on the patient's left or right (or the midline). Opens the plate on the lesion tab. Returns what the simulator computes: structures inside, tracts lost (patient body side), cranial-nerve signs, classic territories. For multiple sclerosis teaching, give time_months and gd.",
    parameters: obj(
      {
        plate: { ...str, description: 'Plate code or id (brainstem, thalamus or capsule plates)' },
        structure: { ...str, description: 'Structure id on that plate (from open_plate) or its name' },
        side: { type: 'string', enum: ['left', 'right', 'midline'] },
        radius_mm: { type: 'number', description: 'Radius in mm, 0.5–12 (default 2)' },
        time_months: { type: 'number', description: 'Months after the first lesion (MS time axis), default 0' },
        gd: { type: 'boolean', description: 'Gadolinium-enhancing (active)' },
        replace: { type: 'boolean', description: 'Clear the earlier lesions first (default false: add)' },
      },
      ['plate', 'structure', 'side'],
    ),
  },
  {
    name: 'set_lesion_territory',
    description: `Show a classic vascular-territory lesion (e.g. Wallenberg = medulla-rostral lateral) on its plate, with the simulator's read-out. Levels and zones: ${levelList}.`,
    parameters: obj(
      {
        level: { type: 'string', enum: LEVELS.map((l) => l.id) },
        side: { type: 'string', enum: ['left', 'right'] },
        zone: { ...str, description: 'Zone id of that level' },
      },
      ['level', 'side', 'zone'],
    ),
  },
  {
    name: 'clear_lesions',
    description: 'Remove the free lesions placed on the plates.',
    parameters: obj({}),
  },
  {
    name: 'trace_pathway',
    description: `Highlight a long tract along the plates and in 3D, or clear it. Pathways: ${PATHWAYS.map((p) => `${p.id} (${p.short.en})`).join(', ')}.`,
    parameters: obj({ pathway: { type: 'string', enum: [...PATHWAYS.map((p) => p.id), 'none'] } }, ['pathway']),
  },
  {
    name: 'open_lesson',
    description: `Open a guided 3D lesson: ${lessonList}; or the 3D lesson of a territory lesion, id "lesion:<level>:<L|R>:<zone>"; or "placed-lesions" for the free lesions now on the plates.`,
    parameters: obj({ lesson: str, step: { type: 'number', description: 'Step index from 0' } }, ['lesson']),
  },
  {
    name: 'set_view',
    description: `Turn the 3D model to a view and/or choose the atlas layers shown. Layers: ${LAYERS.map((l) => `${l.id} (${l.name.en})`).join(', ')}.`,
    parameters: obj({
      view: { type: 'string', enum: VIEWS },
      layers: { type: 'array', items: { type: 'string', enum: LAYERS.map((l) => l.id) } },
    }),
  },
]

/** What a tool did, for the chat chip (in the app's language). */
export interface ActionNote {
  text: string
  ok: boolean
}

type Out = { content: unknown; note: string; ok?: boolean }
const side = (s: BodySide | 'B') => (s === 'B' ? 'both' : s === 'L' ? 'left' : 'right')

/** Plate by code or id (case-insensitive). */
function plateOf(x: unknown) {
  const q = String(x ?? '').trim()
  return SECTION_BY_ID.get(q) ?? SECTIONS.find((s) => s.code.toLowerCase() === q.toLowerCase())
}

/** A plate structure by id, or by English / Uzbek / Latin name. */
function structureOn(plateId: string, x: unknown): string | null {
  const s = SECTION_BY_ID.get(plateId)
  if (!s) return null
  const q = String(x ?? '').trim()
  if (s.items.some((i) => i.id === q)) return q
  const n = normalise(q)
  if (!n) return null
  const hit = s.items.find((i) => {
    const info = STRUCTURE_BY_ID.get(i.id)
    return !!info && [info.name.en, info.name.uz ?? '', info.name.la ?? ''].some((v) => normalise(v).includes(n))
  })
  return hit?.id ?? null
}

/** Plate result: the structures on it, so the model can name one for place_lesion. */
const plateContent = (plateId: string) => {
  const s = SECTION_BY_ID.get(plateId)!
  return {
    plate: s.code,
    title: s.title.en,
    orientation: s.orientation.en,
    lesions_possible: !!focalPlate(s),
    structures: [...new Set(s.items.map((i) => i.id))].map((id) => `${id}: ${STRUCTURE_BY_ID.get(id)?.name.en ?? id}`),
  }
}

function lesionReadout(lesion: Lesion) {
  const sig = signature(lesion)
  const lv = LEVEL_BY_ID.get(lesion.level)!
  const z = lv.zones.find((x) => x.id === lesion.zone)
  return {
    level: lv.name.en,
    side: side(lesion.side),
    zone: z?.name.en,
    syndrome: z?.syndrome?.name.en ?? null,
    tracts_lost: PATHWAYS.filter((p) => sig[p.id] !== 'none').map((p) => `${p.short.en} → ${side(sig[p.id] as BodySide | 'B')} ${p.body === 'face' ? 'face' : 'body'}`),
    cranial_signs: cranialSigns(lesion).map((h) => `${h.sign.name.en} (${side(h.side)})`),
  }
}

const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d)

const RUN: Record<string, (a: Record<string, unknown>, uz: boolean) => Out> = {
  find_structure: (a, uz) => {
    const hits = searchAtlas(String(a.query ?? ''), (n) => n.en, 8)
    return {
      content: hits.length ? hits.map((r) => ({ id: r.id, kind: r.kind, name: r.name.en, uz: r.name.uz, structures: r.count })) : 'no match',
      note: `${uz ? 'Qidiruv' : 'Search'}: “${String(a.query ?? '')}” · ${hits.length}`,
      ok: hits.length > 0,
    }
  },

  select_structure: (a, uz) => {
    const id = String(a.id ?? '')
    let leaves: string[] = []
    let focus: { kind: 'concept' | 'part'; id: string } | null = null
    let part: Part | undefined
    if (CONCEPT_BY_ID.has(id)) ((leaves = conceptLeafIds(id)), (focus = { kind: 'concept', id }), (part = PART_BY_ID.get(leaves[0])))
    else if (PART_BY_ID.has(id)) ((leaves = leafIds(id)), (focus = { kind: 'part', id }), (part = PART_BY_ID.get(id)))
    else {
      const r = searchAtlas(String(a.query ?? a.id ?? ''), (n) => n.en, 1)[0]
      if (r) ((leaves = resultLeaves(r)), (focus = { kind: r.kind, id: r.id }), (part = PART_BY_ID.get(r.kind === 'part' ? r.id : leaves[0])))
    }
    if (!leaves.length || !focus || !part) return { content: 'not found — use find_structure first', note: uz ? 'Tuzilma topilmadi' : 'Structure not found', ok: false }
    const st = useAtlas.getState()
    // Selection lives in the 3D explorer; leave a plate or lesson in the way.
    if (st.sectionId) st.openSection(null)
    st.selectParts(leaves, focus)
    const name = focus.kind === 'concept' ? CONCEPT_BY_ID.get(focus.id)!.name : part.name
    return {
      content: { selected: name.en, layer: part.layer, system: part.system, centroid_mni: part.centroid, description: part.description?.en?.slice(0, 400) ?? null },
      note: `${uz ? 'Tanlandi' : 'Selected'}: ${uz ? (name.uz ?? name.en) : name.en}`,
    }
  },

  open_plate: (a, uz) => {
    const s = plateOf(a.plate)
    if (!s) return { content: `unknown plate "${a.plate}"`, note: uz ? 'Plastinka topilmadi' : 'Plate not found', ok: false }
    useAtlas.getState().openSection(s.id)
    const tab = a.tab
    if (tab === 'structures' || tab === 'level' || tab === 'lesion') useScreen.getState().setCommand({ plate: s.id, kind: 'tab', tab })
    return { content: plateContent(s.id), note: `${s.code} ${uz ? 'ochildi' : 'opened'}` }
  },

  place_lesion: (a, uz) => {
    const s = plateOf(a.plate)
    if (!s) return { content: `unknown plate "${a.plate}"`, note: uz ? 'Plastinka topilmadi' : 'Plate not found', ok: false }
    if (!focalPlate(s))
      return {
        content: `${s.code} takes no free lesion (brainstem, thalamus and capsule plates do)`,
        note: `${s.code}: ${uz ? "o'choq qo'yib bo'lmaydi" : 'no lesions here'}`,
        ok: false,
      }
    const id = structureOn(s.id, a.structure)
    if (!id) return { content: { error: `no structure "${a.structure}" on ${s.code}`, ...plateContent(s.id) }, note: uz ? 'Tuzilma topilmadi' : 'Structure not found', ok: false }
    const sd = a.side === 'right' ? 'R' : a.side === 'midline' ? 'M' : 'L'
    const c = structureCentre(s.id, id, sd)
    if (!c) return { content: 'structure has no outline', note: uz ? 'Kontur yo‘q' : 'No outline', ok: false }
    const f: FocalLesion = { plate: s.id, x: c[0], y: c[1], rMm: num(a.radius_mm, 0.5, 12, 2), t: num(a.time_months, 0, 120, 0), gd: a.gd === true }
    const replace = a.replace === true
    useAtlas.getState().openSection(s.id)
    useScreen.getState().setCommand({ plate: s.id, kind: 'focal', foci: [f], replace })
    const r = focalOn(s, f)!
    const name = STRUCTURE_BY_ID.get(id)!.name
    return {
      content: {
        placed: `${s.code} · ${name.en} · ${a.side} · ⌀ ${(f.rMm * 2).toFixed(1)} mm · ${f.t} mo${f.gd ? ' · Gd+' : ''}`,
        level: LEVEL_BY_ID.get(r.level)?.name.en,
        crosses_midline: r.side === 'B',
        structures: r.hits.slice(0, 8).map((h) => `${STRUCTURE_BY_ID.get(h.id)?.name.en ?? h.id} ${Math.round(h.share * 100)}%`),
        tracts_lost: PATHWAYS.filter((p) => r.sig[p.id] !== 'none').map((p) => `${p.short.en} → ${side(r.sig[p.id] as BodySide | 'B')} ${p.body === 'face' ? 'face' : 'body'}`),
        cranial_signs: r.signs.map((h) => `${h.sign.name.en} (${side(h.side)})`),
        classic_territories: r.zones.slice(0, 3).map((z) => `${z.zone.name.en} ${side(z.side)} ${Math.round(z.overlap * 100)}%`),
        note: 'Schematic plate; mm are approximate. Added to any lesions already placed unless replace=true.',
      },
      note: `${uz ? "O'choq" : 'Lesion'}: ${s.code} · ${uz ? (name.uz ?? name.en) : name.en} · ${uz ? { left: 'chap', right: "o'ng", midline: "o'rta" }[a.side as string] : a.side}`,
    }
  },

  set_lesion_territory: (a, uz) => {
    const lv = LEVEL_BY_ID.get(a.level as LesionLevel)
    const z = lv?.zones.find((x) => x.id === a.zone)
    if (!lv || !z) return { content: `unknown level/zone. ${levelList}`, note: uz ? 'Hudud topilmadi' : 'Territory not found', ok: false }
    const lesion: Lesion = { level: lv.id, side: a.side === 'right' ? 'R' : 'L', zone: z.id }
    if (lv.plate) {
      useAtlas.getState().openSection(lv.plate)
      useScreen.getState().setCommand({ plate: lv.plate, kind: 'territory', lesion })
    }
    return {
      content: { ...lesionReadout(lesion), plate: lv.plate ? SECTION_BY_ID.get(lv.plate)?.code : null, lesson_3d: lesionLessonId(lesion) },
      note: `${uz ? 'Hudud' : 'Territory'}: ${uz ? (z.syndrome?.name.uz ?? lv.name.uz ?? lv.name.en) : (z.syndrome?.name.en ?? lv.name.en)}`,
    }
  },

  clear_lesions: (_a, uz) => {
    useScreen.getState().setCommand({ plate: '*', kind: 'clear' })
    return { content: 'cleared', note: uz ? "O'choqlar tozalandi" : 'Lesions cleared' }
  },

  trace_pathway: (a, uz) => {
    const id = String(a.pathway ?? '')
    if (id === 'none') {
      useAtlas.getState().setPathway(null)
      return { content: 'cleared', note: uz ? "Yo'l o'chirildi" : 'Tract cleared' }
    }
    const p = PATHWAY_BY_ID.get(id)
    if (!p) return { content: `unknown pathway "${id}"`, note: uz ? "Yo'l topilmadi" : 'Tract not found', ok: false }
    useAtlas.getState().setPathway(p.id)
    return { content: { traced: p.title.en, modality: p.modality.en, crossing: p.crossing.en }, note: `${uz ? "Yo'l" : 'Tract'}: ${uz ? (p.short.uz ?? p.short.en) : p.short.en}` }
  },

  open_lesson: (a, uz) => {
    let id = String(a.lesson ?? '')
    if (id === 'placed-lesions') {
      const foci = useScreen.getState().plate?.foci ?? []
      const made = foci.length ? focalLesson(foci, focalSet(foci)) : null
      if (!made) return { content: 'no free lesions are placed', note: uz ? "O'choq yo'q" : 'No lesions placed', ok: false }
      id = made
    }
    const l = LESSON_BY_ID.get(id)
    if (!l) return { content: `unknown lesson "${id}". Lessons: ${lessonList}`, note: uz ? 'Dars topilmadi' : 'Lesson not found', ok: false }
    const st = useAtlas.getState()
    st.setLesson(id)
    const step = num(a.step, 0, l.steps.length - 1, 0)
    if (step) st.setLessonStep(step)
    return {
      content: { lesson: l.title.en, steps: l.steps.map((s, i) => `${i}: ${s.title.en}`), showing_step: step },
      note: `${uz ? 'Dars' : 'Lesson'}: ${(uz ? (l.title.uz ?? l.title.en) : l.title.en).slice(0, 40)}`,
    }
  },

  set_view: (a, uz) => {
    const st = useAtlas.getState()
    const notes: string[] = []
    if (VIEWS.includes(a.view as View)) {
      st.setView(a.view as View)
      notes.push(String(a.view))
    }
    const layers = Array.isArray(a.layers) ? (a.layers.filter((x) => LAYERS.some((l) => l.id === x)) as LayerId[]) : []
    if (layers.length) {
      st.setLayers(layers)
      notes.push(layers.join('+'))
    }
    return { content: notes.length ? `view: ${notes.join(', ')}` : 'nothing changed', note: `${uz ? "Ko'rinish" : 'View'}: ${notes.join(', ') || '—'}`, ok: notes.length > 0 }
  },
}

/** Run one tool call against the app. Unknown tools and bad input come back as errors the model can read. */
export function runTool(call: ToolCall, uz: boolean): { result: ToolResult; note: ActionNote } {
  const fn = RUN[call.name]
  let out: Out
  try {
    if (!fn) out = { content: `unknown tool ${call.name}`, note: call.name, ok: false }
    else if ('__invalid_json' in call.args) out = { content: 'invalid JSON arguments — call again with valid JSON', note: call.name, ok: false }
    else out = fn(call.args ?? {}, uz)
  } catch (e) {
    out = { content: `failed: ${(e as Error).message}`, note: call.name, ok: false }
  }
  const ok = out.ok !== false
  return {
    result: { id: call.id, name: call.name, content: typeof out.content === 'string' ? out.content : JSON.stringify(out.content), isError: !ok },
    note: { text: out.note, ok },
  }
}
