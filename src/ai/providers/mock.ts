import { AIError, type ChatTurn, type Provider, type StreamEvent, type ToolCall } from '../types'

/**
 * Development only: a provider that answers from a script, so the panel can
 * be checked headless (screenshots, streaming, stop, tool calls) without a
 * real key. Never offered in a production build.
 */
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((ok, no) => {
    const t = setTimeout(ok, ms)
    signal.addEventListener('abort', () => (clearTimeout(t), no(new AIError('abort', 'aborted'))), { once: true })
  })

/** Scripted tool use: a few phrases map to app actions (only when tools are offered). */
function plan(q: string, system: string): ToolCall[] {
  if (/anki|karta|flashcard/i.test(q))
    return [
      {
        id: 'm6',
        name: 'make_flashcards',
        args: {
          deck: 'Wallenberg',
          cards: [
            { front: 'Lateral medullary syndrome: artery?', back: 'PICA / vertebral' },
            { front: 'Horner in Wallenberg: which side?', back: 'Ipsilateral (descending sympathetic fibres)' },
          ],
        },
      },
    ]
  if (system.includes('Mode: clinical case')) return [{ id: 'm4', name: 'simulate_territory', args: { level: 'medulla-rostral', side: 'right', zone: 'lateral' } }]
  if (system.includes('Mode: research')) return [{ id: 'm5', name: 'search_pubmed', args: { query: q.replace(/uydirma|fake/gi, '').trim(), max: 3 } }]
  if (/ekranga qara|look at (the )?screen/i.test(q)) return [{ id: 'm7', name: 'look_at_screen', args: { target: 'auto' } }]
  if (/wallenberg/i.test(q)) return [{ id: 'm1', name: 'set_lesion_territory', args: { level: 'medulla-rostral', side: 'left', zone: 'lateral' } }]
  if (/\bmlf\b|\bino\b/i.test(q)) return [{ id: 'm2', name: 'place_lesion', args: { plate: 'K3', structure: 'mlf', side: 'left', radius_mm: 1.5, gd: true, replace: true } }]
  if (/(talamus|thalamus).*(ko'rsat|tanla|show|select)|(ko'rsat|show).*(talamus|thalamus)/i.test(q)) return [{ id: 'm3', name: 'select_structure', args: { query: 'thalamus' } }]
  return []
}

async function* say(text: string, signal: AbortSignal): AsyncGenerator<StreamEvent> {
  const words = text.split(/(?<=\s)/)
  for (const w of words) {
    await sleep(14, signal)
    yield { type: 'text', text: w }
  }
  yield { type: 'usage', input: 420, output: words.length * 2 }
}

/** Answer in Uzbek when the user's first message looks Uzbek. */
function uzbek(turns: ChatTurn[]) {
  const first = turns.find((t) => t.role === 'user')
  return !!first && first.role === 'user' && /[ʻ'’]|qayer|nima|qanday|tushuntir|ko'rsat/i.test(first.text)
}

let busyCalls = 0

export const mock: Provider = {
  id: 'mock',
  async listModels() {
    return [{ id: 'mock-tutor', name: 'Mock tutor' }]
  },
  async *stream(_cred, req): AsyncGenerator<StreamEvent> {
    const last = req.messages.at(-1)
    const q = last?.role === 'user' ? last.text : ''
    const uz = uzbek(req.messages)
    // After a tool round: report what the app returned.
    if (last?.role === 'tool') {
      const r = last.results.map((x) => `- \`${x.name}\`${x.isError ? ' ⚠' : ''}: ${x.content.slice(0, 220)}`).join('\n')
      // Research: cite the first PubMed hit (verified), and a made-up DOI when asked to — the panel must flag it.
      const first = /"pmid":"(\d+)"/.exec(last.results[0]?.content ?? '')
      const asked = req.messages.findLast((t) => t.role === 'user')
      const cite = first ? `\n\n${uz ? 'Manba' : 'Source'}: [PMID ${first[1]}](https://pubmed.ncbi.nlm.nih.gov/${first[1]}/)` : ''
      const fake = asked?.role === 'user' && /uydirma|fake/i.test(asked.text) ? ' · doi:10.9999/fake.2026.001' : ''
      yield* say(`${uz ? 'Bajarildi. Ilova natijasi' : 'Done. The app returned'}:\n\n${r}${cite}${fake}`, req.signal)
      yield { type: 'turn', calls: [] }
      return
    }
    // A picture attached: say what arrived (size, kind), as a vision model would see it.
    if (last?.role === 'user' && last.images?.length) {
      const kb = last.images.map((im) => `${im.mediaType} · ${Math.round((im.data.length * 3) / 4 / 1024)} KB`).join(', ')
      yield* say(
        `${uz ? 'Rasm(lar) qabul qilindi' : 'Image(s) received'}: ${last.images.length} (${kb}).\n\n${uz ? 'Bu yerda haqiqiy model rasmni tasvirlaydi.' : 'A real model would describe the picture here.'}`,
        req.signal,
      )
      yield { type: 'turn', calls: [] }
      return
    }
    // "busy": the first call fails as overloaded (503), the retry succeeds — checks the automatic retry.
    if (q === 'busy' && busyCalls++ % 2 === 0) throw new AIError('server', 'This model is currently experiencing high demand.', 503)
    if (/^error:(\w+)/.test(q)) throw new AIError(q.slice(6) as AIError['kind'], 'mock error', 401)
    const calls = req.tools?.length ? plan(q, req.system) : []
    if (calls.length) {
      yield* say(uz ? "Ko'rsataman." : 'Let me show you.', req.signal)
      yield { type: 'turn', calls }
      return
    }
    const text = uz
      ? `**Talamus** — oraliq miyaning eng katta qismi, po'stloqqa boradigan deyarli barcha sezgi yo'llarining **bekati**.\n\n- **VPL** — tanadan (orqa ustun va spinotalamik yo'l)\n- **VPM** — yuzdan (trigeminal)\n- **LGN** — ko'ruv, **MGN** — eshitish\n\nShikastlansa: qarama-qarshi tomonda barcha sezgilar yo'qoladi, keyin *Dejerine–Roussy* og'rig'i paydo bo'lishi mumkin.\n\n> Savolingiz: "${q.slice(0, 80)}"`
      : `The **thalamus** is the largest part of the diencephalon and the **relay** for nearly every sensory pathway on its way to the cortex.\n\n- **VPL** — body (dorsal columns, spinothalamic)\n- **VPM** — face (trigeminal)\n- **LGN** vision, **MGN** hearing\n\nA lesion takes all sensation on the opposite side, sometimes followed by *Dejerine–Roussy* pain.\n\n> You asked: "${q.slice(0, 80)}"`
    // Echo the first lines of the live-state brief, so a headless check can see the context arrive.
    const live = req.system.split('## Live state')[1]
    const seen = live
      ? live
          .split('\n')
          .filter((x) => /^(Selected|Cross-section|  Free|  #1|  McDonald|3D lesson)/.test(x))
          .slice(0, 4)
      : []
    const tail = seen.length ? `\n\n${uz ? 'Kontekstdan' : 'From context'}:\n${seen.map((x) => `- ${x.trim().slice(0, 140)}`).join('\n')}` : ''
    yield* say(text + tail, req.signal)
    yield { type: 'turn', calls: [] }
  },
}
