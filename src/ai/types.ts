/**
 * The AI panel's provider layer (PLAN 5.6): one small interface over
 * Anthropic, OpenAI, Google, OpenRouter and local OpenAI-compatible servers.
 * Calls go straight from the browser to the provider with the user's own
 * credentials — there is no Neuro Atlas server in between.
 */
export type ProviderId = 'openrouter' | 'anthropic' | 'openai' | 'google' | 'local' | 'mock'

export interface Credential {
  /** API key (absent for a local server without auth). */
  key?: string
  /** Base URL for the local OpenAI-compatible server. */
  baseUrl?: string
}

export interface ModelInfo {
  id: string
  name: string
}

/** A tool the model may call (JSON Schema parameters). */
export interface ToolSpec {
  name: string
  description: string
  parameters: { type: 'object'; properties: Record<string, unknown>; required?: string[]; additionalProperties?: false }
}

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface ToolResult {
  id: string
  name: string
  content: string
  isError?: boolean
}

/**
 * The conversation in provider-neutral form. An assistant turn may carry the
 * provider's own content (`raw`) — Anthropic thinking blocks and Gemini thought
 * signatures must go back unchanged in a tool loop; another provider ignores it.
 */
export type ChatTurn =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; calls?: ToolCall[]; raw?: { provider: ProviderId; content: unknown } }
  | { role: 'tool'; results: ToolResult[] }

export interface ChatRequest {
  model: string
  system: string
  messages: ChatTurn[]
  tools?: ToolSpec[]
  signal: AbortSignal
}

export type StreamEvent =
  | { type: 'text'; text: string }
  | { type: 'usage'; input?: number; output?: number }
  /** The model declined (Anthropic `refusal` stop reason). */
  | { type: 'refusal'; detail?: string }
  /** End of the model's turn: the tool calls it made (empty: a final answer) and its raw content. */
  | { type: 'turn'; calls: ToolCall[]; raw?: unknown }

export interface Provider {
  id: ProviderId
  listModels(cred: Credential, signal?: AbortSignal): Promise<ModelInfo[]>
  stream(cred: Credential, req: ChatRequest): AsyncGenerator<StreamEvent>
}

/** Why a call failed, in terms the panel can explain to a student. */
export type AIErrorKind = 'auth' | 'credit' | 'rate' | 'model' | 'network' | 'server' | 'bad' | 'abort'

export class AIError extends Error {
  kind: AIErrorKind
  status?: number
  constructor(kind: AIErrorKind, message: string, status?: number) {
    super(message)
    this.kind = kind
    this.status = status
  }
}

export function kindOf(status: number): AIErrorKind {
  if (status === 401 || status === 403) return 'auth'
  if (status === 402) return 'credit'
  if (status === 429) return 'rate'
  if (status === 404) return 'model'
  if (status >= 500) return 'server'
  return 'bad'
}

/** A failed HTTP response → AIError, with the provider's own message when it gives one. */
export async function httpError(res: Response): Promise<AIError> {
  let msg = res.statusText
  try {
    const body = await res.json()
    msg = body?.error?.message ?? body?.message ?? body?.[0]?.error?.message ?? msg
  } catch {}
  return new AIError(kindOf(res.status), String(msg || res.status), res.status)
}

/** fetch() that turns a network/CORS failure into AIError('network') and an abort into AIError('abort'). */
export async function call(url: string, init: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, init)
    if (!res.ok) throw await httpError(res)
    return res
  } catch (e) {
    if (e instanceof AIError) throw e
    if ((e as Error)?.name === 'AbortError') throw new AIError('abort', 'aborted')
    throw new AIError('network', (e as Error)?.message ?? 'network error')
  }
}
