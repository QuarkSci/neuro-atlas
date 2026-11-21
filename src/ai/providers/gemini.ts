import { AIError, call, type ChatTurn, type Provider, type StreamEvent } from '../types'
import { sse } from '../sse'

/** Google Gemini API (AI Studio key), streamGenerateContent over SSE. */
const BASE = 'https://generativelanguage.googleapis.com/v1beta'

/**
 * Gemini variants that are not chat models, though they list generateContent:
 * speech (TTS), image and video generation, embeddings, live/native audio,
 * computer use, robotics. They reject a system instruction, tools or text
 * answers ("Developer instruction is not enabled for this model").
 */
const NOT_CHAT = /(tts|image|imagen|veo|lyria|embedding|aqa|audio|live|native|transcri|computer-use|robotics|learnlm)/i

export const gemini: Provider = {
  id: 'google',
  async listModels(cred, signal) {
    const res = await call(`${BASE}/models?pageSize=1000`, { headers: { 'x-goog-api-key': cred.key ?? '' }, signal })
    const body = await res.json()
    return (body.models ?? [])
      .filter(
        (m: { name: string; supportedGenerationMethods?: string[] }) =>
          m.name.includes('gemini') && !NOT_CHAT.test(m.name) && m.supportedGenerationMethods?.includes('generateContent'),
      )
      .map((m: { name: string; displayName?: string }) => ({ id: m.name.replace(/^models\//, ''), name: m.displayName || m.name }))
  },
  async *stream(cred, req): AsyncGenerator<StreamEvent> {
    const post = (system: boolean) => {
      const contents = toContents(req.messages)
      // Without a system instruction the tutor's brief goes in front of the first user turn.
      if (!system && contents[0]?.role === 'user') contents[0] = { role: 'user', parts: [{ text: `${req.system}\n\n---\n` }, ...contents[0].parts] }
      return call(`${BASE}/models/${encodeURIComponent(req.model)}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': cred.key ?? '' },
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
          contents,
          ...(req.tools?.length
            ? { tools: [{ functionDeclarations: req.tools.map((t) => ({ name: t.name, description: t.description, parameters: clean(t.parameters) })) }] }
            : {}),
        }),
        signal: req.signal,
      })
    }
    let res: Response
    try {
      res = await post(true)
    } catch (e) {
      // Some models (Gemma, a few previews) take no system instruction: send it as text instead.
      if (!(e instanceof AIError && e.kind === 'bad' && /instruction|system/i.test(e.message))) throw e
      res = await post(false)
    }
    let usage: StreamEvent | null = null
    // Every part the model sent (thought signatures included) goes back unchanged on the next turn.
    const parts: GPart[] = []
    let finish = ''
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
        for (const p of (cand?.content?.parts ?? []) as GPart[]) {
          parts.push(p)
          // Thought summaries (thought: true) are not part of the answer.
          if (p.text && !p.thought) yield { type: 'text', text: p.text }
        }
        if (cand?.finishReason) finish = cand.finishReason
        if (finish === 'SAFETY') yield { type: 'refusal', detail: 'SAFETY' }
        if (j.usageMetadata) usage = { type: 'usage', input: j.usageMetadata.promptTokenCount, output: j.usageMetadata.candidatesTokenCount }
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw new AIError('abort', 'aborted')
      throw e
    }
    if (usage) yield usage
    const calls =
      finish === 'MAX_TOKENS'
        ? []
        : parts.flatMap((p, i) => (p.functionCall ? [{ id: p.functionCall.id ?? `fc_${i}`, name: p.functionCall.name, args: p.functionCall.args ?? {} }] : []))
    yield { type: 'turn', calls, raw: parts }
  },
}

interface GPart {
  text?: string
  inlineData?: { mimeType: string; data: string }
  thought?: boolean
  thoughtSignature?: string
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> }
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> }
}

/** Gemini's schema dialect (OpenAPI subset) has no `additionalProperties`. */
function clean(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(clean)
  if (!v || typeof v !== 'object') return v
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>)
      .filter(([k]) => k !== 'additionalProperties')
      .map(([k, x]) => [k, clean(x)]),
  )
}

/** Neutral turns → Gemini contents (model turns replayed as sent; results as functionResponse parts). */
function toContents(turns: ChatTurn[]) {
  const out: { role: 'user' | 'model'; parts: GPart[] }[] = []
  for (const t of turns) {
    if (t.role === 'user') out.push({ role: 'user', parts: [...(t.images ?? []).map((im) => ({ inlineData: { mimeType: im.mediaType, data: im.data } })), { text: t.text }] })
    else if (t.role === 'tool')
      out.push({
        role: 'user',
        parts: t.results.map((r) => ({
          functionResponse: { ...(r.id.startsWith('fc_') ? {} : { id: r.id }), name: r.name, response: { [r.isError ? 'error' : 'result']: r.content } },
        })),
      })
    else if (t.raw?.provider === 'google') out.push({ role: 'model', parts: t.raw.content as GPart[] })
    else {
      const parts: GPart[] = []
      if (t.text) parts.push({ text: t.text })
      for (const c of t.calls ?? []) parts.push({ functionCall: { id: c.id, name: c.name, args: c.args } })
      if (parts.length) out.push({ role: 'model', parts })
    }
  }
  return out
}
