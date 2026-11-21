import { AIError, call, type ChatTurn, type Credential, type ModelInfo, type Provider, type ProviderId, type StreamEvent } from '../types'
import { sse } from '../sse'

/**
 * OpenAI Chat Completions and the servers that speak it: OpenAI itself,
 * OpenRouter (Claude, GPT and Gemini behind one key) and local servers
 * (Ollama, LM Studio). Plain fetch + SSE.
 */
interface Opts {
  id: ProviderId
  base: (c: Credential) => string
  headers: (c: Credential) => Record<string, string>
  /** Which listed models are chat models worth offering. */
  keep: (m: ModelInfo) => boolean
  /** Model list without credentials (OpenRouter's is public). */
  publicModels?: boolean
}

function compat(o: Opts): Provider {
  return {
    id: o.id,
    async listModels(cred, signal) {
      const res = await call(`${o.base(cred)}/models`, { headers: o.publicModels ? {} : o.headers(cred), signal })
      const body = await res.json()
      const list: ModelInfo[] = (body.data ?? body.models ?? []).map((m: { id: string; name?: string }) => ({ id: m.id, name: m.name || m.id }))
      return list.filter(o.keep)
    },
    async *stream(cred, req): AsyncGenerator<StreamEvent> {
      const res = await call(`${o.base(cred)}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...o.headers(cred) },
        body: JSON.stringify({
          model: req.model,
          stream: true,
          stream_options: { include_usage: true },
          messages: [{ role: 'system', content: req.system }, ...toMessages(req.messages)],
          ...(req.tools?.length ? { tools: req.tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })) } : {}),
        }),
        signal: req.signal,
      })
      // Tool calls stream in pieces by index: id and name first, arguments as JSON fragments.
      const calls: { id: string; name: string; args: string }[] = []
      let text = ''
      let finish = ''
      try {
        for await (const { data } of sse(res, req.signal)) {
          if (data === '[DONE]') break
          let j
          try {
            j = JSON.parse(data)
          } catch {
            continue
          }
          if (j.error) throw new AIError('server', j.error.message ?? 'stream error', j.error.code)
          const ch = j.choices?.[0]
          const t = ch?.delta?.content
          if (t) {
            text += t
            yield { type: 'text', text: t }
          }
          for (const tc of ch?.delta?.tool_calls ?? []) {
            const i = tc.index ?? calls.length
            calls[i] ??= { id: '', name: '', args: '' }
            if (tc.id) calls[i].id = tc.id
            if (tc.function?.name) calls[i].name += tc.function.name
            if (tc.function?.arguments) calls[i].args += tc.function.arguments
          }
          if (ch?.finish_reason) finish = ch.finish_reason
          if (finish === 'content_filter') yield { type: 'refusal' }
          if (j.usage) yield { type: 'usage', input: j.usage.prompt_tokens, output: j.usage.completion_tokens }
        }
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') throw new AIError('abort', 'aborted')
        throw e
      }
      // A turn cut off by the length limit may hold half a call: run none of it.
      const done = finish === 'length' ? [] : calls.filter((c) => c?.name)
      yield {
        type: 'turn',
        calls: done.map((c, i) => {
          let args: Record<string, unknown> = {}
          try {
            args = c.args ? JSON.parse(c.args) : {}
          } catch {
            args = { __invalid_json: c.args }
          }
          return { id: c.id || `call_${i}`, name: c.name, args }
        }),
        raw: { text },
      }
    },
  }
}

/** Neutral turns → Chat Completions messages (assistant tool_calls, then one `tool` message per result). */
function toMessages(turns: ChatTurn[]) {
  const out: Record<string, unknown>[] = []
  for (const t of turns) {
    if (t.role === 'user')
      out.push({
        role: 'user',
        content: t.images?.length
          ? [{ type: 'text', text: t.text }, ...t.images.map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mediaType};base64,${im.data}` } }))]
          : t.text,
      })
    else if (t.role === 'tool') for (const r of t.results) out.push({ role: 'tool', tool_call_id: r.id, content: r.content })
    else
      out.push({
        role: 'assistant',
        content: t.text || null,
        ...(t.calls?.length ? { tool_calls: t.calls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.args) } })) } : {}),
      })
  }
  return out
}

const bearer = (c: Credential): Record<string, string> => (c.key ? { authorization: `Bearer ${c.key}` } : {})

/** Chat models only: no embeddings, audio, image, moderation or realtime endpoints. */
const OPENAI_CHAT = /^(gpt-|o\d|chatgpt-)/
const OPENAI_SKIP = /(audio|realtime|tts|transcribe|image|embedding|moderation|search|instruct|codex)/

export const openai = compat({
  id: 'openai',
  base: () => 'https://api.openai.com/v1',
  headers: bearer,
  keep: (m) => OPENAI_CHAT.test(m.id) && !OPENAI_SKIP.test(m.id),
})

export const openrouter = compat({
  id: 'openrouter',
  base: () => 'https://openrouter.ai/api/v1',
  headers: (c) => ({ ...bearer(c), 'HTTP-Referer': location.origin, 'X-Title': 'Neuro Atlas' }),
  // The three families the panel offers (OpenRouter lists hundreds).
  keep: (m) => /^(anthropic|openai|google)\//.test(m.id),
  publicModels: true,
})

export const DEFAULT_LOCAL_URL = 'http://localhost:11434/v1'

export const local = compat({
  id: 'local',
  base: (c) => (c.baseUrl || DEFAULT_LOCAL_URL).replace(/\/+$/, ''),
  headers: bearer,
  keep: () => true,
})
