import { AIError, type Provider, type StreamEvent } from '../types'

/**
 * Development only: a provider that answers from a script, so the panel can
 * be checked headless (screenshots, streaming, stop) without a real key.
 * Never offered in a production build.
 */
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((ok, no) => {
    const t = setTimeout(ok, ms)
    signal.addEventListener('abort', () => (clearTimeout(t), no(new AIError('abort', 'aborted'))), { once: true })
  })

export const mock: Provider = {
  id: 'mock',
  async listModels() {
    return [{ id: 'mock-tutor', name: 'Mock tutor' }]
  },
  async *stream(_cred, req): AsyncGenerator<StreamEvent> {
    const q = req.messages.at(-1)?.text ?? ''
    if (/^error:(\w+)/.test(q)) throw new AIError(q.slice(6) as AIError['kind'], 'mock error', 401)
    const uz = /[ʻ'’]|qayer|nima|qanday|tushuntir/i.test(q)
    const text = uz
      ? `**Talamus** — oraliq miyaning eng katta qismi, po'stloqqa boradigan deyarli barcha sezgi yo'llarining **bekati**.\n\n- **VPL** — tanadan (orqa ustun va spinotalamik yo'l)\n- **VPM** — yuzdan (trigeminal)\n- **LGN** — ko'ruv, **MGN** — eshitish\n\nShikastlansa: qarama-qarshi tomonda barcha sezgilar yo'qoladi, keyin *Dejerine–Roussy* og'rig'i paydo bo'lishi mumkin.\n\n> Savolingiz: "${q.slice(0, 80)}"`
      : `The **thalamus** is the largest part of the diencephalon and the **relay** for nearly every sensory pathway on its way to the cortex.\n\n- **VPL** — body (dorsal columns, spinothalamic)\n- **VPM** — face (trigeminal)\n- **LGN** vision, **MGN** hearing\n\nA lesion takes all sensation on the opposite side, sometimes followed by *Dejerine–Roussy* pain.\n\n> You asked: "${q.slice(0, 80)}"`
    const words = text.split(/(?<=\s)/)
    for (const w of words) {
      await sleep(18, req.signal)
      yield { type: 'text', text: w }
    }
    yield { type: 'usage', input: 420 + q.length, output: words.length * 2 }
  },
}
