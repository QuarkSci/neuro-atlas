import type { ModelInfo, Provider, ProviderId } from '../types'
import { anthropic } from './anthropic'
import { local, openai, openrouter } from './compat'
import { gemini } from './gemini'
import { mock } from './mock'

export const PROVIDERS: Record<ProviderId, Provider> = { openrouter, anthropic, openai, google: gemini, local, mock }

/** Shown in the accounts sheet, in this order (mock only in development). */
export const PROVIDER_ORDER: ProviderId[] = ['openrouter', 'anthropic', 'openai', 'google', 'local', ...(import.meta.env.DEV ? (['mock'] as const) : [])]

export const PROVIDER_META: Record<ProviderId, { name: string; keyUrl?: string; keyHint?: string }> = {
  openrouter: { name: 'OpenRouter', keyUrl: 'https://openrouter.ai/settings/keys', keyHint: 'sk-or-…' },
  anthropic: { name: 'Anthropic · Claude', keyUrl: 'https://console.anthropic.com/settings/keys', keyHint: 'sk-ant-…' },
  openai: { name: 'OpenAI · ChatGPT', keyUrl: 'https://platform.openai.com/api-keys', keyHint: 'sk-…' },
  google: { name: 'Google · Gemini', keyUrl: 'https://aistudio.google.com/apikey', keyHint: 'AIza…' },
  local: { name: 'Local (Ollama / LM Studio)' },
  mock: { name: 'Mock (dev)' },
}

/**
 * A sensible first model once the list is known: the provider's current
 * flagship family first. Lists change often, so this is a preference order
 * over what the provider returns, never a hard-coded id the user must have.
 */
const PREFER: Partial<Record<ProviderId, RegExp[]>> = {
  anthropic: [/^claude-opus-5-5$/, /^claude-opus/, /^claude-sonnet/],
  openrouter: [/^anthropic\/claude-opus/, /^anthropic\/claude-sonnet/, /^openai\/gpt-5/, /^google\/gemini/],
  openai: [/^gpt-5(\.\d+)?$/, /^gpt-5/, /^gpt-4\.1$/, /^gpt-4o$/],
  google: [/^gemini-[\d.]+-pro$/, /^gemini-[\d.]+-flash$/, /^gemini-[\d.]+-pro(-latest)?$/, /^gemini-[\d.]+-flash(-latest)?$/, /^gemini-[\d.]+-pro/, /^gemini-[\d.]+-flash/],
}

/**
 * When the chosen model is busy or silent, the next one tried. Measured on a free Google key (2026-11-22): the newest
 * flash models answer 503 or send nothing for a minute, Pro models 429 (no quota), while the -lite and preview
 * flash models answered in 1–8 s — so those come first, Pro never.
 */
const FALLBACK: Partial<Record<ProviderId, RegExp[]>> = {
  google: [/^gemini-[\d.]+-flash-lite$/, /^gemini-[\d.]+-flash-preview$/, /^gemini-[\d.]+-flash-lite/],
}

export function pickModel(p: ProviderId, models: ModelInfo[], fallback = false): string | null {
  if (!models.length) return null
  // Newest first: ids sort with their version numbers.
  const sorted = [...models].sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }))
  for (const re of fallback ? (FALLBACK[p] ?? []) : []) {
    const hit = sorted.find((m) => re.test(m.id))
    if (hit) return hit.id
  }
  for (const re of PREFER[p] ?? []) {
    const hit = sorted.find((m) => re.test(m.id))
    if (hit) return hit.id
  }
  return models[0].id
}
