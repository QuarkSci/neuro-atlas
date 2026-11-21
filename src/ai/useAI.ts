import { create } from 'zustand'
import { useAtlas } from '@/store/useAtlas'
import { PROVIDERS, pickModel } from './providers'
import { AIError, type AIErrorKind, type Credential, type ModelInfo, type ProviderId } from './types'
import { finishOpenRouterLogin, startOpenRouterLogin } from './openrouterAuth'

/**
 * The AI panel's state: accounts (credentials per provider), the chosen
 * model, and the conversation. Credentials live only in this browser —
 * localStorage when "remember on this device" is on, else sessionStorage —
 * and each is sent only to its own provider.
 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  provider?: ProviderId
  model?: string
  usage?: { input?: number; output?: number }
  error?: { kind: AIErrorKind; message: string }
  refusal?: string | true
  /** Still streaming. */
  live?: boolean
}

type Creds = Partial<Record<ProviderId, Credential>>

interface AIState {
  open: boolean
  view: 'chat' | 'accounts'
  creds: Creds
  remember: boolean
  provider: ProviderId | null
  model: Partial<Record<ProviderId, string>>
  models: Partial<Record<ProviderId, ModelInfo[]>>
  messages: ChatMessage[]
  busy: boolean
  /** OpenRouter sign-in in progress / just finished with an error. */
  login: 'idle' | 'working' | { error: string }

  setOpen: (v: boolean) => void
  toggle: () => void
  setView: (v: AIState['view']) => void
  setCred: (p: ProviderId, c: Credential) => void
  signOut: (p: ProviderId) => void
  setRemember: (v: boolean) => void
  choose: (p: ProviderId, model?: string) => void
  loadModels: (p: ProviderId) => Promise<ModelInfo[]>
  signInOpenRouter: () => Promise<void>
  send: (text: string) => Promise<void>
  stop: () => void
  clear: () => void
}

const PREFS = 'na:ai'
const CREDS = 'na:ai:creds'

interface Saved {
  remember?: boolean
  provider?: ProviderId | null
  model?: AIState['model']
}

function load(): { prefs: Saved; creds: Creds } {
  let prefs: Saved = {}
  let creds: Creds = {}
  try {
    prefs = JSON.parse(localStorage.getItem(PREFS) ?? '{}')
    const store = prefs.remember === false ? sessionStorage : localStorage
    creds = JSON.parse(store.getItem(CREDS) ?? '{}')
  } catch {}
  return { prefs, creds }
}

function save(s: Pick<AIState, 'remember' | 'provider' | 'model' | 'creds'>) {
  try {
    localStorage.setItem(PREFS, JSON.stringify({ remember: s.remember, provider: s.provider, model: s.model }))
    const keep = s.remember ? localStorage : sessionStorage
    const drop = s.remember ? sessionStorage : localStorage
    keep.setItem(CREDS, JSON.stringify(s.creds))
    drop.removeItem(CREDS)
  } catch {}
}

/** A provider counts as connected when it has a key (or, for a local server, a URL). */
export const connected = (p: ProviderId, creds: Creds) => (p === 'mock' ? !!creds.mock : p === 'local' ? !!creds.local?.baseUrl : !!creds[p]?.key)

/** AI-1 system prompt: an educational neuroanatomy tutor in the app's language. Context of what is on screen arrives in AI-2. */
function systemPrompt() {
  const lang = useAtlas.getState().lang
  return [
    'You are the tutor inside Neuro Atlas, a free, open educational 3D neuroanatomy atlas (MNI152 space; atlases: BodyParts3D, Julich-Brain, Brodmann, Desikan, Destrieux, Glasser, JHU, brainstem and cerebellar atlases).',
    'Your users range from first-year medical students to PhD researchers and neurosurgeons: match the depth to the question, and give the clinical correlate where it helps.',
    lang === 'uz'
      ? 'Answer in Uzbek (Latin script) unless the user writes in another language; keep Latin anatomical terms in parentheses where useful.'
      : 'Answer in English unless the user writes in another language.',
    'Be concise and precise. Use short paragraphs, lists and **bold** key terms (Markdown). If you are not sure, say so instead of guessing; do not invent references.',
    'This is education, not medical advice: do not diagnose or treat real patients, and remind the user to keep patient data out of the chat if they share any.',
  ].join('\n')
}

let controller: AbortController | null = null

const { prefs, creds } = load()

export const useAI = create<AIState>((set, get) => ({
  open: false,
  view: 'chat',
  creds,
  remember: prefs.remember !== false,
  provider: prefs.provider && connected(prefs.provider, creds) ? prefs.provider : null,
  model: prefs.model ?? {},
  models: {},
  messages: [],
  busy: false,
  login: 'idle',

  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  setView: (view) => set({ view }),
  setCred: (p, c) => {
    const creds = { ...get().creds, [p]: c }
    // The first account connected becomes the active one.
    const provider = get().provider ?? p
    set({ creds, provider, models: { ...get().models, [p]: undefined } })
    save({ ...get(), creds, provider })
  },
  signOut: (p) => {
    const creds = { ...get().creds }
    delete creds[p]
    const provider = get().provider === p ? ((Object.keys(creds) as ProviderId[]).find((x) => connected(x, creds)) ?? null) : get().provider
    set({ creds, provider, models: { ...get().models, [p]: undefined } })
    save({ ...get(), creds, provider })
  },
  setRemember: (remember) => {
    set({ remember })
    save(get())
  },
  choose: (provider, m) => {
    const model = m ? { ...get().model, [provider]: m } : get().model
    set({ provider, model })
    save(get())
  },
  loadModels: async (p) => {
    const list = await PROVIDERS[p].listModels(get().creds[p] ?? {})
    const model = get().model[p] && list.some((m) => m.id === get().model[p]) ? get().model : { ...get().model, [p]: pickModel(p, list) ?? undefined }
    set({ models: { ...get().models, [p]: list }, model })
    save(get())
    return list
  },
  signInOpenRouter: async () => {
    set({ login: 'working' })
    try {
      await startOpenRouterLogin()
    } catch (e) {
      set({ login: { error: (e as Error).message } })
    }
  },

  send: async (text) => {
    const { provider, creds, busy } = get()
    if (busy || !text.trim()) return
    if (!provider) {
      set({ view: 'accounts' })
      return
    }
    let model = get().model[provider]
    if (!model) {
      try {
        await get().loadModels(provider)
      } catch {}
      model = get().model[provider]
    }
    const history = get().messages.filter((m) => !m.error && m.text)
    const reply: ChatMessage = { role: 'assistant', text: '', provider, model, live: true }
    set({ messages: [...get().messages, { role: 'user', text }, reply], busy: true })
    controller = new AbortController()
    const patch = (p: Partial<ChatMessage>) =>
      set((s) => {
        const messages = s.messages.slice()
        messages[messages.length - 1] = { ...messages[messages.length - 1], ...p }
        return { messages }
      })
    try {
      if (!model) throw new AIError('model', 'no model')
      const turns = [...history, { role: 'user' as const, text }].map((m) => ({ role: m.role, text: m.text }))
      let acc = ''
      for await (const ev of PROVIDERS[provider].stream(creds[provider] ?? {}, { model, system: systemPrompt(), messages: turns, signal: controller.signal })) {
        if (ev.type === 'text') patch({ text: (acc += ev.text) })
        else if (ev.type === 'usage') patch({ usage: { input: ev.input, output: ev.output } })
        else if (ev.type === 'refusal') patch({ refusal: ev.detail ?? true })
      }
      patch({ live: false })
    } catch (e) {
      const err = e instanceof AIError ? e : new AIError('bad', (e as Error)?.message ?? String(e))
      patch({ live: false, ...(err.kind === 'abort' ? {} : { error: { kind: err.kind, message: err.message } }) })
    } finally {
      controller = null
      set({ busy: false })
    }
  },
  stop: () => controller?.abort(),
  clear: () => {
    controller?.abort()
    set({ messages: [] })
  },
}))

/** Back from OpenRouter's consent page: store the key and open the panel on the chat. */
export async function completeOpenRouterLogin() {
  try {
    const key = await finishOpenRouterLogin()
    if (!key) return
    const s = useAI.getState()
    s.setCred('openrouter', { key })
    s.choose('openrouter')
    useAI.setState({ open: true, view: 'chat', login: 'idle' })
    s.loadModels('openrouter').catch(() => {})
  } catch (e) {
    useAI.setState({ open: true, view: 'accounts', login: { error: (e as Error).message } })
  }
}

if (import.meta.env.DEV) (window as unknown as { __ai: typeof useAI }).__ai = useAI
