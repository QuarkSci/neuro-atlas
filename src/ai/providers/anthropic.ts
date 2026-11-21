import type Anthropic from '@anthropic-ai/sdk'
import { AIError, kindOf, type ChatTurn, type Credential, type Provider, type StreamEvent } from '../types'

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
          messages: toMessages(req.messages),
          ...(req.tools?.length
            ? {
                // Streamed tool input arrives as generated; tools.ts validates every input before it runs.
                tools: req.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters, eager_input_streaming: true })),
              }
            : {}),
          ...(FALLBACK.has(req.model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        },
        { signal: req.signal },
      )
      for await (const ev of stream) if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') yield { type: 'text', text: ev.delta.text }
      const final = await stream.finalMessage()
      yield { type: 'usage', input: final.usage.input_tokens, output: final.usage.output_tokens }
      if (final.stop_reason === 'refusal') {
        yield { type: 'refusal', detail: final.stop_details?.explanation ?? undefined }
        yield { type: 'turn', calls: [] }
        return
      }
      // A turn cut off by max_tokens may hold a half-written tool call: run none of it.
      const calls =
        final.stop_reason === 'tool_use'
          ? final.content.flatMap((b) => (b.type === 'tool_use' ? [{ id: b.id, name: b.name, args: (b.input ?? {}) as Record<string, unknown> }] : []))
          : []
      yield { type: 'turn', calls, raw: final.content }
    } catch (e) {
      throw mapError(A, e)
    }
  },
}

/**
 * Neutral turns → Messages API. Claude's own earlier turns go back exactly as
 * returned (thinking blocks included — required in a tool loop); turns from
 * another provider become plain text and tool_use blocks.
 */
function toMessages(turns: ChatTurn[]): Anthropic.Beta.BetaMessageParam[] {
  const out: Anthropic.Beta.BetaMessageParam[] = []
  for (const t of turns) {
    if (t.role === 'user') out.push({ role: 'user', content: t.text })
    else if (t.role === 'tool')
      out.push({
        role: 'user',
        content: t.results.map((r) => ({ type: 'tool_result' as const, tool_use_id: r.id, content: r.content, ...(r.isError ? { is_error: true } : {}) })),
      })
    else if (t.raw?.provider === 'anthropic') out.push({ role: 'assistant', content: t.raw.content as Anthropic.Beta.BetaContentBlockParam[] })
    else {
      const content: Anthropic.Beta.BetaContentBlockParam[] = []
      if (t.text) content.push({ type: 'text', text: t.text })
      for (const c of t.calls ?? []) content.push({ type: 'tool_use', id: c.id, name: c.name, input: c.args })
      if (content.length) out.push({ role: 'assistant', content })
    }
  }
  return out
}
