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
function plan(q: string): ToolCall[] {
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
      yield* say(`${uz ? 'Bajarildi. Ilova natijasi' : 'Done. The app returned'}:\n\n${r}`, req.signal)
      yield { type: 'turn', calls: [] }
      return
    }
    if (/^error:(\w+)/.test(q)) throw new AIError(q.slice(6) as AIError['kind'], 'mock error', 401)
    const calls = req.tools?.length ? plan(q) : []
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
