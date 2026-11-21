import { LAYER_BY_ID, PART_BY_ID, SYSTEM_BY_ID } from '@/data'
import { LESSON_BY_ID } from '@/data/lessons'
import { LEVEL_BY_ID, signature } from '@/data/lesions'
import { PATHWAYS, PATHWAY_BY_ID, type BodySide } from '@/data/pathways'
import { SECTION_BY_ID, STRUCTURE_BY_ID } from '@/data/sections'
import { TOPIC_BY_ID } from '@/data/topics'
import type { L10n, Part } from '@/data/types'
import { useAtlas } from '@/store/useAtlas'
import { cranialSigns } from '@/ui/lesionSigns'
import { focalSet } from '@/ui/lesionFocal'
import { MC_AREAS, NO_EXTRA, mcdonald } from '@/ui/mcdonald'
import { useScreen } from './screen'

/**
 * AI-2: what the user is looking at, as a short plain-text brief the tutor
 * gets with every message — the selected structure and the atlas's own text
 * and sources on it, the open lesson step, the traced tract, the open plate,
 * the structure picked on it, and the lesions placed (with the simulator's
 * own read-out: tracts cut, cranial signs, McDonald). The model can then
 * answer "what is this?" or "why these signs?" from the same facts the app
 * shows, and cite the same sources.
 *
 * Written in English for the model; names carry the Uzbek form too when the
 * app is in Uzbek, so the answer can use the names the student sees.
 */
export interface Brief {
  /** The text sent to the model (empty when nothing is on screen worth telling). */
  text: string
  /** One short line for the panel chip, in the app's language. */
  label: string
}

const cut = (s: string | undefined, n: number) => (!s ? '' : s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '…')
const side = (s: BodySide | 'B') => (s === 'B' ? 'both sides' : s === 'L' ? 'left' : 'right')

export function brief(): Brief {
  const a = useAtlas.getState()
  const scr = useScreen.getState()
  const uz = a.lang === 'uz'
  const nm = (x: L10n | undefined) => (!x ? '' : uz && x.uz && x.uz !== x.en ? `${x.en} (uz: ${x.uz})` : x.en)
  const local = (x: L10n | undefined) => (!x ? '' : uz ? (x.uz ?? x.en) : x.en)
  const lines: string[] = []
  const chip: string[] = []

  // ── 3D scene
  const tab = a.mode === 'learn' ? 'Learn tab (topics, lessons, plates)' : `Atlas tab (3D explorer, ${a.mode === 'peel' ? 'depth/peel' : 'explode'} mode)`
  lines.push(`App: ${tab}. 3D view: ${a.view}. Atlas layers shown: ${a.layers.map((l) => LAYER_BY_ID.get(l)?.name.en ?? l).join(', ')}.`)
  if (a.topic) lines.push(`Topic open: ${nm(TOPIC_BY_ID.get(a.topic)?.title)}.`)

  const parts = a.selected.map((id) => PART_BY_ID.get(id)).filter((p): p is Part => !!p)
  if (parts.length) {
    const p = parts[0]
    chip.push(local(p.name))
    const c = p.centroid ? ` MNI centroid (${p.centroid.map((v) => v.toFixed(0)).join(', ')}) mm.` : ''
    lines.push(
      `Selected in 3D: ${nm(p.name)} — ${LAYER_BY_ID.get(p.layer)?.name.en ?? p.layer} layer, ${SYSTEM_BY_ID.get(p.system)?.name.en ?? p.system}, side ${p.side}.${c}` +
        (parts.length > 1
          ? ` (+${parts.length - 1} more: ${parts
              .slice(1, 6)
              .map((x) => x.name.en)
              .join(', ')})`
          : ''),
    )
    if (p.description) lines.push(`  Atlas text${p.inheritedContent ? ' (family entry)' : ''}: ${cut(p.description.en, 500)}`)
    if (p.role) lines.push(`  Function: ${cut(p.role.en, 350)}`)
    if (p.clinical) lines.push(`  Clinical: ${cut(p.clinical.en, 350)}`)
    if (p.sources?.length)
      lines.push(
        `  Atlas sources: ${p.sources
          .slice(0, 4)
          .map((s) => `[${s.title}](${s.url})`)
          .join('; ')}`,
      )
  }

  if (a.pathway) {
    const t = PATHWAY_BY_ID.get(a.pathway)
    if (t) {
      lines.push(`Tract traced: ${nm(t.title)} — ${t.modality.en}.`)
      chip.push(local(t.short))
    }
  }

  if (a.lesson) {
    const l = LESSON_BY_ID.get(a.lesson.id)
    const st = l?.steps[a.lesson.step]
    if (l && st) {
      lines.push(`3D lesson open: "${nm(l.title)}", step ${a.lesson.step + 1}/${l.steps.length} "${nm(st.title)}": ${cut(st.text.en, 600)}`)
      chip.push(`${local(l.title).slice(0, 28)} · ${a.lesson.step + 1}/${l.steps.length}`)
    }
  }

  // ── Cross-section plate
  const pl = scr.plate
  const sec = pl ? SECTION_BY_ID.get(pl.plate) : undefined
  if (pl && sec) {
    chip.push(sec.code)
    const views: Record<string, string> = {
      scheme: 'schematic drawing',
      myelin: 'myelin-stain style',
      nissl: 'Nissl-stain style',
      atlas: 'atlas cut (MNI meshes)',
      real: 'real BigBrain histology',
    }
    lines.push(`Cross-section plate open: ${sec.code} "${nm(sec.title)}" (${sec.orientation.en}); showing the ${views[pl.view] ?? pl.view}; side tab: ${pl.tab}.`)
    const picked = pl.picked ? STRUCTURE_BY_ID.get(pl.picked) : undefined
    if (picked) {
      lines.push(`  Picked on the plate: ${nm(picked.name)} — ${cut(picked.info.en, 350)}${picked.lesion ? ` Lesion: ${cut(picked.lesion.en, 250)}` : ''}`)
      chip.push(local(picked.name))
    }
    const ap = pl.atlasPicked ? PART_BY_ID.get(pl.atlasPicked) : undefined
    if (ap) lines.push(`  Picked on the atlas cut: ${nm(ap.name)} (${LAYER_BY_ID.get(ap.layer)?.name.en ?? ap.layer}).`)

    if (pl.tab === 'lesion' && pl.lesionMode === 'zone') {
      const lv = LEVEL_BY_ID.get(pl.lesion.level)
      const z = lv?.zones.find((x) => x.id === pl.lesion.zone)
      const sig = signature(pl.lesion)
      const cutTr = PATHWAYS.filter((t) => sig[t.id] !== 'none').map((t) => `${t.short.en} → ${side(sig[t.id] as BodySide | 'B')} ${t.body === 'face' ? 'face' : 'body'}`)
      const signs = cranialSigns(pl.lesion).map((h) => `${h.sign.name.en} (${side(h.side)})`)
      lines.push(
        `  Lesion simulator (territory mode): ${lv?.name.en} · ${side(pl.lesion.side)} · ${z?.name.en ?? pl.lesion.zone}${z?.syndrome ? ` = ${z.syndrome.name.en}` : ''}. Long tracts lost: ${cutTr.join(', ') || 'none'}. Cranial/level signs: ${signs.join(', ') || 'none'}. (Body sides are the patient's.)`,
      )
      chip.push(local(z?.syndrome?.name ?? lv?.name))
    }
  }

  // ── Free lesions (they can sit on several plates; listed whenever point mode is on)
  if (pl?.tab === 'lesion' && pl.lesionMode === 'point' && pl.foci.length) {
    const set = focalSet(pl.foci, pl.now)
    const mc = mcdonald(pl.foci, set.each, scr.mcExtra ?? NO_EXTRA)
    chip.push(uz ? `${pl.foci.length} o'choq` : `${pl.foci.length} lesion${pl.foci.length > 1 ? 's' : ''}`)
    lines.push(`  Free (disc) lesions placed: ${pl.foci.length}${pl.now !== null ? `; time axis at ${pl.now} months (later lesions hidden)` : ''}. Active: #${pl.activeFocus + 1}.`)
    pl.foci.forEach((f, i) => {
      const r = set.each[i]
      const s = SECTION_BY_ID.get(f.plate)
      if (!r) {
        lines.push(`  #${i + 1} ${s?.code ?? f.plate}: appears at ${f.t ?? 0} months (not yet on the time axis).`)
        return
      }
      const hits = r.hits.slice(0, 6).map((h) => `${STRUCTURE_BY_ID.get(h.id)?.name.en ?? h.id} ${Math.round(h.share * 100)}%`)
      const tr = PATHWAYS.filter((t) => r.sig[t.id] !== 'none').map((t) => `${t.short.en} → ${side(r.sig[t.id] as BodySide | 'B')}`)
      const zones = r.zones.slice(0, 2).map((z) => `${z.zone.name.en} ${side(z.side)} ${Math.round(z.overlap * 100)}%`)
      lines.push(
        `  #${i + 1} ${s?.code} (${LEVEL_BY_ID.get(r.level)?.name.en}), ${r.side === 'B' ? 'crosses the midline' : side(r.side)}, ⌀ ${(f.rMm * 2).toFixed(0)} mm, at ${f.t ?? 0} mo${f.gd ? ', Gd-enhancing' : ''}. Structures: ${hits.join(', ') || 'none'}. Tracts lost: ${tr.join(', ') || 'none'}. Signs: ${r.signs.map((h) => `${h.sign.name.en} (${side(h.side)})`).join(', ') || 'none'}. Classic territories: ${zones.join(', ') || 'none'}.`,
      )
    })
    if (pl.foci.length > 1)
      lines.push(
        `  All together: tracts lost ${
          PATHWAYS.filter((t) => set.sig[t.id] !== 'none')
            .map((t) => `${t.short.en} → ${side(set.sig[t.id] as BodySide | 'B')}`)
            .join(', ') || 'none'
        }; signs ${set.signs.map((h) => `${h.sign.name.en} (${side(h.side)})`).join(', ') || 'none'}.`,
      )
    const area = (id: string) => MC_AREAS.find((x) => x.id === id)?.name.en ?? id
    lines.push(
      `  McDonald (as the app computes it, simplified): attacks ${mc.attacks}, symptomatic lesions ${mc.clinical}; DIS areas ${mc.areas2017.map(area).join(', ') || 'none'} (${mc.areas2017.length}/4) → ${mc.dis2017 ? 'met' : 'not met'}; DIT: ${mc.dit.join(', ') || 'not met'}; 2017 → ${mc.v2017.ms ? 'MS' : `needs ${mc.v2017.need.join(' + ')}`}; 2024 (${mc.areas2024.length}/5 areas) → ${mc.v2024.ms ? 'MS' : `needs ${mc.v2024.need.join(' + ')}`}${mc.v2017.ris ? '; radiologically isolated syndrome' : ''}${mc.flags.length ? `; red flags: ${mc.flags.join(', ')}` : ''}.`,
    )
  }

  const body = lines.join('\n')
  return { text: body, label: chip.filter(Boolean).slice(0, 4).join(' · ') }
}

/** The brief as a system-prompt section, with how to use it. */
export function briefSection(b: Brief) {
  if (!b.text) return ''
  return [
    '',
    '## Live state of the app (snapshot taken when the user sent this message)',
    b.text,
    '',
    'Use this when the user says "this", "here", "bu", "shu" or asks about what is on screen. Prefer the atlas text and sources above when they answer the question, and cite those sources as Markdown links; when you go beyond them, say it is from general knowledge. The lesion read-out is the simulator\'s own computation on schematic plates: explain it, and say so if real anatomy would differ.',
  ].join('\n')
}
