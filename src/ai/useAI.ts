import { create } from 'zustand'
import { useAtlas } from '@/store/useAtlas'
import { PROVIDERS, pickModel } from './providers'
import { AIError, type AIErrorKind, type ChatTurn, type Credential, type ModelInfo, type ProviderId, type ToolCall, type ToolResult } from './types'
import { TOOLS, VERIFIED, runTool, type ActionNote } from './tools'
import type { ImagePart } from './types'
import { finishOpenRouterLogin, startOpenRouterLogin } from './openrouterAuth'
import { brief, briefSection } from './context'

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
  /** References in the answer that no tool verified this conversation (AI-5): DOIs / PMIDs. */
  unverified?: string[]
  /** User turns: the on-screen context sent with it (chip label and the full brief), when context was on. */
  context?: { label: string; text: string }
  /** User turns: pictures sent with it (AI-4), as data URLs for the thumbnails. */
  images?: { url: string; label: string }[]
  /** Assistant turns: the app actions it took (AI-3), each re-runnable from its chip. */
  actions?: (ActionNote & { call: ToolCall })[]
  /** Still streaming. */
  live?: boolean
}

type Creds = Partial<Record<ProviderId, Credential>>

export interface Attachment {
  /** JPEG/PNG data URL. */
  url: string
  /** What it shows, for the model and the chip ("3D view · lateral", "Plate K3 · real slice", a file name). */
  label: string
}

const toPart = (url: string): ImagePart | null => {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(url)
  return m ? { mediaType: m[1] as ImagePart['mediaType'], data: m[2] } : null
}

interface AIState {
  open: boolean
  view: 'chat' | 'accounts'
  creds: Creds
  remember: boolean
  provider: ProviderId | null
  model: Partial<Record<ProviderId, string>>
  models: Partial<Record<ProviderId, ModelInfo[]>>
  messages: ChatMessage[]
  /** The conversation as the models see it (tool calls and results included). */
  turns: ChatTurn[]
  /** Pictures waiting to go with the next message (AI-4). */
  attachments: Attachment[]
  busy: boolean
  /** OpenRouter sign-in in progress / just finished with an error. */
  login: 'idle' | 'working' | { error: string }
  /** Send what is on screen (AI-2) with each message. */
  withContext: boolean
  /** How the tutor teaches (AI-5). */
  mode: TutorMode

  setOpen: (v: boolean) => void
  toggle: () => void
  setView: (v: AIState['view']) => void
  setCred: (p: ProviderId, c: Credential) => void
  signOut: (p: ProviderId) => void
  setRemember: (v: boolean) => void
  setWithContext: (v: boolean) => void
  setMode: (m: TutorMode) => void
  choose: (p: ProviderId, model?: string) => void
  loadModels: (p: ProviderId) => Promise<ModelInfo[]>
  signInOpenRouter: () => Promise<void>
  send: (text: string) => Promise<void>
  stop: () => void
  attach: (a: Attachment) => void
  detach: (i: number) => void
  redo: (call: ToolCall) => Promise<ActionNote>
  clear: () => void
}

const PREFS = 'na:ai'
const CREDS = 'na:ai:creds'

interface Saved {
  remember?: boolean
  withContext?: boolean
  mode?: TutorMode
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

function save(s: Pick<AIState, 'remember' | 'provider' | 'model' | 'creds' | 'withContext' | 'mode'>) {
  try {
    localStorage.setItem(PREFS, JSON.stringify({ remember: s.remember, provider: s.provider, model: s.model, withContext: s.withContext, mode: s.mode }))
    const keep = s.remember ? localStorage : sessionStorage
    const drop = s.remember ? sessionStorage : localStorage
    keep.setItem(CREDS, JSON.stringify(s.creds))
    drop.removeItem(CREDS)
  } catch {}
}

/** A provider counts as connected when it has a key (or, for a local server, a URL). */
export const connected = (p: ProviderId, creds: Creds) => (p === 'mock' ? !!creds.mock : p === 'local' ? !!creds.local?.baseUrl : !!creds[p]?.key)

/** AI-1 system prompt: an educational neuroanatomy tutor in the app's language. Context of what is on screen arrives in AI-2. */
export type TutorMode = 'tutor' | 'socratic' | 'case' | 'research'

/** AI-5: how each mode teaches, appended to the base prompt. */
const MODE_PROMPT: Record<TutorMode, string> = {
  tutor: 'Mode: tutor — explain clearly, show on the model or the plates when it helps.',
  socratic: [
    'Mode: Socratic tutor. Do not give the answer straight away.',
    'Ask ONE guiding question at a time that builds on what the student already knows; wait for the reply; confirm what is right, correct what is wrong with a hint, then ask the next question.',
    'Reveal the full answer only when the student asks for it or after three unsuccessful tries. Use the app to show, not tell (open the plate, select the structure) without naming the answer in the action.',
  ].join(' '),
  case: [
    'Mode: clinical case. Run one case at a time, at the level the student asks for (default: medical student; PhD/neurology resident when asked — add imaging, vascular, time course and differentials).',
    '1) Pick a lesion (vary levels and mechanisms) and compute its findings with simulate_lesion or simulate_territory — NEVER invent signs; every examination finding must come from that read-out (you may add a plausible history, age and onset).',
    '2) Present the history and examination findings without naming the level, the lesion or the syndrome, and ask the student to localise it (level, side, structure, artery).',
    '3) Grade the answer with localise (it lists every lesion consistent with the findings — the differential) and explain each step of the reasoning (long tracts → above/below a crossing; cranial nerves → the level).',
    '4) Reveal it on screen with place_lesion or set_lesion_territory, then offer make_flashcards.',
  ].join(' '),
  research: [
    'Mode: research. Answer at PhD / neurosurgeon level: mechanisms, anatomical variants, imaging correlates, controversies, levels of evidence.',
    'Search the literature with search_pubmed (and verify_doi for a known DOI) BEFORE citing. Cite ONLY works those tools returned in this conversation, each as a Markdown link to its PubMed or DOI URL with first author, year and journal. Never cite from memory; if the search finds nothing suitable, say so.',
    'Prefer reviews, guidelines and landmark studies; say what kind of evidence each is (from its publication types).',
  ].join(' '),
}

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
    'You can drive the app with tools: select structures in 3D, open cross-section plates, place lesions and read the simulator, trace tracts, open lessons, turn the view. Use them when the user asks to show, open, place or find something, or when one or two actions make your explanation clearly better — not for every answer. Never invent ids: get them from find_structure or open_plate. After acting, say briefly what is now on screen and explain the result (e.g. why those signs appear).',
  ].join('\n')
}

let controller: AbortController | null = null

const { prefs, creds } = load()

export const useAI = create<AIState>((set, get) => ({
  open: false,
  view: 'chat',
  creds,
  remember: prefs.remember !== false,
  withContext: prefs.withContext !== false,
  mode: prefs.mode && prefs.mode in MODE_PROMPT ? prefs.mode : 'tutor',
  provider: prefs.provider && connected(prefs.provider, creds) ? prefs.provider : null,
  model: prefs.model ?? {},
  models: {},
  messages: [],
  turns: [],
  attachments: [],
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
  setMode: (mode) => {
    set({ mode })
    save(get())
  },
  setWithContext: (withContext) => {
    set({ withContext })
    save(get())
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

  send: async (typed) => {
    const { provider, creds, busy } = get()
    // A picture alone is a question too.
    const text =
      typed.trim() ||
      (get().attachments.length
        ? useAtlas.getState().lang === 'uz'
          ? 'Bu rasmda nima ko‘rinyapti? Tuzilmalarni nomlab tushuntir.'
          : 'What does this picture show? Name and explain the structures.'
        : '')
    if (busy || !text) return
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
    const reply: ChatMessage = { role: 'assistant', text: '', provider, model, live: true }
    // The screen as it is now, sent with this message only (history keeps its own snapshots in the UI).
    const b = get().withContext ? brief() : null
    const context = b?.text ? { label: b.label, text: b.text } : undefined
    const att = get().attachments
    const images = att.flatMap((a) => toPart(a.url) ?? [])
    // The model is told what each picture is; the pictures themselves go with this message only.
    const said = att.length ? `${text}\n\n[Attached: ${att.map((a) => a.label).join('; ')}]` : text
    set({
      messages: [...get().messages, { role: 'user', text, context, ...(att.length ? { images: att.map((a) => ({ url: a.url, label: a.label })) } : {}) }, reply],
      attachments: [],
      busy: true,
    })
    controller = new AbortController()
    const patch = (p: Partial<ChatMessage>) =>
      set((s) => {
        const messages = s.messages.slice()
        messages[messages.length - 1] = { ...messages[messages.length - 1], ...p }
        return { messages }
      })
    const uz = useAtlas.getState().lang === 'uz'
    const turns: ChatTurn[] = [...get().turns, { role: 'user', text: said, ...(images.length ? { images } : {}) }]
    const actions: NonNullable<ChatMessage['actions']> = []
    const usage = { input: 0, output: 0 }
    let acc = ''
    let tools = true
    try {
      if (!model) throw new AIError('model', 'no model')
      // The tool loop: the model may act on the app, read the results and go on, a few rounds at most.
      for (let round = 0; round < 6; round++) {
        let said = ''
        let calls: ToolCall[] = []
        let raw: unknown
        if (acc && !acc.endsWith('\n')) patch({ text: (acc += '\n\n') })
        try {
          for await (const ev of PROVIDERS[provider].stream(creds[provider] ?? {}, {
            model,
            system: systemPrompt() + '\n' + MODE_PROMPT[get().mode] + (b ? briefSection(b) : ''),
            messages: turns,
            tools: tools ? TOOLS : undefined,
            signal: controller.signal,
          })) {
            if (ev.type === 'text') {
              said += ev.text
              patch({ text: (acc += ev.text) })
            } else if (ev.type === 'usage') {
              usage.input += ev.input ?? 0
              usage.output += ev.output ?? 0
              patch({ usage: { ...usage } })
            } else if (ev.type === 'refusal') patch({ refusal: ev.detail ?? true })
            else if (ev.type === 'turn') ((calls = ev.calls), (raw = ev.raw))
          }
        } catch (e) {
          // A model or local server without tool support: carry on as plain chat.
          if (tools && round === 0 && !said && e instanceof AIError && e.kind === 'bad' && /tool|function/i.test(e.message)) {
            tools = false
            round--
            continue
          }
          throw e
        }
        turns.push({ role: 'assistant', text: said, calls, raw: raw === undefined ? undefined : { provider, content: raw } })
        if (!calls.length) break
        const results: ToolResult[] = []
        for (const c of calls) {
          const { result, note } = await runTool(c, uz)
          results.push(result)
          actions.push({ ...note, call: c })
          patch({ actions: [...actions] })
        }
        turns.push({ role: 'tool', results })
      }
      // References the answer gives that no tool returned (or the atlas brief carries): flagged, never silently trusted.
      const allowed = (b?.text ?? '').toLowerCase()
      const unverified = [
        ...[...acc.matchAll(/\b10\.\d{4,9}\/[^\s)\]>"',;]+/g)]
          .map((m) => m[0].replace(/[.]+$/, ''))
          .filter((d) => !VERIFIED.dois.has(d.toLowerCase()) && !allowed.includes(d.toLowerCase())),
        ...[...acc.matchAll(/(?:PMID:?\s*|pubmed\.ncbi\.nlm\.nih\.gov\/)(\d{5,9})/gi)]
          .map((m) => m[1])
          .filter((id) => !VERIFIED.pmids.has(id))
          .map((id) => `PMID ${id}`),
      ]
      patch({ live: false, ...(unverified.length ? { unverified: [...new Set(unverified)] } : {}) })
    } catch (e) {
      const err = e instanceof AIError ? e : new AIError('bad', (e as Error)?.message ?? String(e))
      patch({ live: false, ...(err.kind === 'abort' ? {} : { error: { kind: err.kind, message: err.message } }) })
    } finally {
      // Keep only whole rounds: a tool call always travels with its result.
      const last = turns.at(-1)
      if (last?.role === 'assistant' && last.calls?.length) turns.pop()
      // Pictures are not resent with every later message (cost): the text keeps what they were.
      for (let i = 0; i < turns.length; i++) {
        const t = turns[i]
        if (t.role === 'user' && t.images) turns[i] = { role: 'user', text: `${t.text} (sent earlier; not shown again)` }
      }
      set({ turns, busy: false })
      controller = null
    }
  },
  /** Re-run an action from its chip (the same call, against the app as it is now). */
  redo: async (call: ToolCall) => (await runTool(call, useAtlas.getState().lang === 'uz')).note,
  stop: () => controller?.abort(),
  attach: (a) => set({ attachments: [...get().attachments, a].slice(-4) }),
  detach: (i) => set({ attachments: get().attachments.filter((_, j) => j !== i) }),
  clear: () => {
    controller?.abort()
    set({ messages: [], turns: [], attachments: [] })
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
