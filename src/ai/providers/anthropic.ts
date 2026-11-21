import type Anthropic from '@anthropic-ai/sdk'
import { AIError, kindOf, type Credential, type Provider, type StreamEvent } from '../types'

/**
 * Claude through the official SDK, loaded only when the AI panel first calls
 * it. Browser use needs `dangerouslyAllowBrowser`: the key is the user's own,
 * kept in their browser and sent only to api.anthropic.com.
 */
const sdk = () => import('@anthropic-ai/sdk').then((m) => m.default)

async function client(cred: Credential) {
  const A = await sdk()
  if (!cred.key) throw new AIError('auth', 'no key')
  // The page's fetch at call time (not one captured at load), so tests can stand in for the network.
  return { A, c: new A({ apiKey: cred.key, dangerouslyAllowBrowser: true, maxRetries: 1, fetch: (url, init) => globalThis.fetch(url, init) }) }
}

/** Models that take the server-side refusal fallback (`fallbacks: "default"`). */
const FALLBACK = new Set(['claude-fable-5-2', 'claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'])

function mapError(A: typeof Anthropic, e: unknown): AIError {
  if (e instanceof AIError) return e
  if (e instanceof A.APIUserAbortError) return new AIError('abort', 'aborted')
  if (e instanceof A.APIConnectionError) return new AIError('network', e.cause instanceof Error ? `${e.message} (${e.cause.message})` : e.message)
  if (e instanceof A.APIError && typeof e.status === 'number') return new AIError(kindOf(e.status), e.message, e.status)
  return new AIError('bad', (e as Error)?.message ?? String(e))
}

export const anthropic: Provider = {
  id: 'anthropic',
  async listModels(cred) {
    const { A, c } = await client(cred)
    try {
      const out = []
      for await (const m of c.models.list()) out.push({ id: m.id, name: m.display_name || m.id })
      return out
    } catch (e) {
      throw mapError(A, e)
    }
  },
  async *stream(cred, req): AsyncGenerator<StreamEvent> {
    const { A, c } = await client(cred)
    try {
      const stream = c.beta.messages.stream(
        {
          model: req.model,
          max_tokens: 64000,
          system: req.system,
          messages: req.messages.map((m) => ({ role: m.role, content: m.text })),
          ...(FALLBACK.has(req.model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        },
        { signal: req.signal },
      )
      for await (const ev of stream) if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') yield { type: 'text', text: ev.delta.text }
      const final = await stream.finalMessage()
      yield { type: 'usage', input: final.usage.input_tokens, output: final.usage.output_tokens }
      if (final.stop_reason === 'refusal') yield { type: 'refusal', detail: final.stop_details?.explanation ?? undefined }
    } catch (e) {
      throw mapError(A, e)
    }
  },
}
