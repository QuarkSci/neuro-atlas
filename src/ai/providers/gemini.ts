import { AIError, call, type Provider, type StreamEvent } from '../types'
import { sse } from '../sse'

/** Google Gemini API (AI Studio key), streamGenerateContent over SSE. */
const BASE = 'https://generativelanguage.googleapis.com/v1beta'

export const gemini: Provider = {
  id: 'google',
  async listModels(cred, signal) {
    const res = await call(`${BASE}/models?pageSize=1000`, { headers: { 'x-goog-api-key': cred.key ?? '' }, signal })
    const body = await res.json()
    return (body.models ?? [])
      .filter((m: { name: string; supportedGenerationMethods?: string[] }) => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: { name: string; displayName?: string }) => ({ id: m.name.replace(/^models\//, ''), name: m.displayName || m.name }))
  },
  async *stream(cred, req): AsyncGenerator<StreamEvent> {
    const res = await call(`${BASE}/models/${encodeURIComponent(req.model)}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': cred.key ?? '' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: req.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
      }),
      signal: req.signal,
    })
    let usage: StreamEvent | null = null
    try {
      for await (const { data } of sse(res, req.signal)) {
        let j
        try {
          j = JSON.parse(data)
        } catch {
          continue
        }
        if (j.error) throw new AIError('server', j.error.message ?? 'stream error', j.error.code)
        if (j.promptFeedback?.blockReason) yield { type: 'refusal', detail: j.promptFeedback.blockReason }
        const cand = j.candidates?.[0]
        // Thought summaries (thought: true) are not part of the answer.
        for (const p of cand?.content?.parts ?? []) if (p.text && !p.thought) yield { type: 'text', text: p.text }
        if (cand?.finishReason === 'SAFETY') yield { type: 'refusal', detail: 'SAFETY' }
        if (j.usageMetadata) usage = { type: 'usage', input: j.usageMetadata.promptTokenCount, output: j.usageMetadata.candidatesTokenCount }
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw new AIError('abort', 'aborted')
      throw e
    }
    if (usage) yield usage
  },
}
