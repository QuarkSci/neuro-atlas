import { AIError, call, type Credential, type ModelInfo, type Provider, type ProviderId, type StreamEvent } from '../types'
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
          messages: [{ role: 'system', content: req.system }, ...req.messages.map((m) => ({ role: m.role, content: m.text }))],
        }),
        signal: req.signal,
      })
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
          const t = j.choices?.[0]?.delta?.content
          if (t) yield { type: 'text', text: t }
          if (j.choices?.[0]?.finish_reason === 'content_filter') yield { type: 'refusal' }
          if (j.usage) yield { type: 'usage', input: j.usage.prompt_tokens, output: j.usage.completion_tokens }
        }
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') throw new AIError('abort', 'aborted')
        throw e
      }
    },
  }
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
