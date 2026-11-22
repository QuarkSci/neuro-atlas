import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  Box,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  FileImage,
  ImagePlus,
  KeyRound,
  Layers,
  LoaderCircle,
  LogOut,
  MapPin,
  RotateCcw,
  Sparkles,
  Square,
  TriangleAlert,
  X,
} from 'lucide-react'
import type { L10n } from '@/data/types'
import { useL } from '@/i18n'
import { PROVIDER_META, PROVIDER_ORDER, pickModel } from '@/ai/providers'
import { DEFAULT_LOCAL_URL } from '@/ai/providers/compat'
import { connected, useAI, type ChatMessage, type TutorMode } from '@/ai/useAI'
import { BookOpen, Download, GraduationCap, MessageCircleQuestion, Stethoscope } from 'lucide-react'
import type { AIErrorKind, ProviderId } from '@/ai/types'
import { Markdown } from './aiMarkdown'
import { capturePlate, captureFile, plateFigure } from './plateCapture'
import { sceneSnapshot } from '@/scene/capture'
import { SECTION_BY_ID } from '@/data/sections'
import { brief } from '@/ai/context'
import { useScreen } from '@/ai/screen'
import { useAtlas } from '@/store/useAtlas'
import { useShallow } from 'zustand/react/shallow'

const TX = {
  title: { en: 'AI tutor', uz: 'AI yordamchi' },
  accounts: { en: 'Accounts', uz: 'Hisoblar' },
  back: { en: 'Back to chat', uz: 'Suhbatga qaytish' },
  clear: { en: 'New chat', uz: 'Yangi suhbat' },
  close: { en: 'Close', uz: 'Yopish' },
  placeholder: { en: 'Ask about any structure, tract or lesion…', uz: "Istalgan tuzilma, yo'l yoki o'choq haqida so'rang…" },
  send: { en: 'Send', uz: 'Yuborish' },
  stop: { en: 'Stop', uz: "To'xtatish" },
  thinking: { en: 'Thinking…', uz: "O'ylayapti…" },
  disclaimer: {
    en: 'AI can be wrong — check against the atlas and your textbook. Education only, not medical advice.',
    uz: "AI xato qilishi mumkin — atlas va darslik bilan solishtiring. Faqat ta'lim uchun, tibbiy maslahat emas.",
  },
  connectTitle: { en: 'Connect an AI account', uz: 'AI hisobini ulang' },
  connectText: {
    en: 'Sign in with OpenRouter (Claude, GPT and Gemini in one account) or add your own Anthropic, OpenAI or Google key. You pay the provider directly; Neuro Atlas has no server and never sees your key.',
    uz: "OpenRouter bilan kiring (Claude, GPT va Gemini bitta hisobda) yoki o'z Anthropic, OpenAI yoki Google kalitingizni qo'shing. To'lovni to'g'ridan-to'g'ri provayderga qilasiz; Neuro Atlas'ning serveri yo'q va kalitingizni ko'rmaydi.",
  },
  signInOR: { en: 'Sign in with OpenRouter', uz: 'OpenRouter bilan kirish' },
  addKey: { en: 'Add an API key', uz: "API kalit qo'shish" },
  suggest: { en: 'Try', uz: "Sinab ko'ring" },
  s1: { en: 'Explain the thalamic nuclei and where each one projects', uz: 'Talamus yadrolarini va har biri qayerga proyeksiya berishini tushuntir' },
  s2: { en: 'Why does a lateral medullary lesion give crossed sensory loss?', uz: "Nega lateral uzunchoq miya o'chog'i kesishgan sezgi yo'qolishini beradi?" },
  s3: { en: 'Show me a Wallenberg lesion and explain the signs', uz: "Wallenberg o'chog'ini ko'rsat va belgilarini tushuntir" },
  model: { en: 'Model', uz: 'Model' },
  noModels: { en: 'Connect an account to pick a model', uz: 'Model tanlash uchun hisob ulang' },
  // Accounts sheet
  connectedTo: { en: 'Connected', uz: 'Ulangan' },
  active: { en: 'Active', uz: 'Faol' },
  use: { en: 'Use', uz: 'Tanlash' },
  signOut: { en: 'Sign out', uz: 'Chiqish' },
  save: { en: 'Save', uz: 'Saqlash' },
  connect: { en: 'Connect', uz: 'Ulash' },
  getKey: { en: 'Get a key', uz: 'Kalit olish' },
  checking: { en: 'Checking…', uz: 'Tekshirilmoqda…' },
  models: { en: 'models', uz: 'model' },
  remember: { en: 'Remember on this device', uz: 'Bu qurilmada eslab qolish' },
  rememberOff: { en: 'Off: keys are forgotten when this tab closes.', uz: "O'chiq: kalitlar shu tab yopilganda unutiladi." },
  privacy: {
    en: 'Keys stay in this browser and go only to their own provider. Neuro Atlas has no server. Anyone with access to this browser profile can read them — use "Remember" only on your own device.',
    uz: "Kalitlar faqat shu brauzerda saqlanadi va faqat o'z provayderiga yuboriladi. Neuro Atlas'ning serveri yo'q. Bu brauzer profiliga kira oladigan odam ularni o'qiy oladi — \"Eslab qolish\"ni faqat o'z qurilmangizda yoqing.",
  },
  orText: {
    en: 'One click: Claude, GPT and Gemini models in one account. You approve on openrouter.ai and top up credit there.',
    uz: "Bir bosishda: Claude, GPT va Gemini modellari bitta hisobda. openrouter.ai sahifasida ruxsat berasiz va hisobni o'sha yerda to'ldirasiz.",
  },
  orKey: { en: 'or paste a key', uz: 'yoki kalitni kiriting' },
  anthropicText: {
    en: 'Claude models with your Anthropic Console API key. (A Claude.ai Pro/Max subscription cannot be used by other apps.)',
    uz: 'Anthropic Console API kalitingiz bilan Claude modellari. (Claude.ai Pro/Max obunasini boshqa ilovalar ishlata olmaydi.)',
  },
  openaiText: {
    en: 'GPT models with your OpenAI Platform API key. Signing in with a ChatGPT plan is not yet available to websites.',
    uz: 'OpenAI Platform API kalitingiz bilan GPT modellari. ChatGPT rejasi bilan kirish hozircha veb-saytlar uchun mavjud emas.',
  },
  googleText: { en: 'Gemini models with a Google AI Studio key (has a free tier).', uz: 'Google AI Studio kaliti bilan Gemini modellari (bepul tarifi bor).' },
  localText: {
    en: 'A model on your own computer (Ollama, LM Studio): free, offline, private. Ollama must allow this site: OLLAMA_ORIGINS="*".',
    uz: 'O\'z kompyuteringizdagi model (Ollama, LM Studio): bepul, oflayn, maxfiy. Ollama bu saytga ruxsat berishi kerak: OLLAMA_ORIGINS="*".',
  },
  mockText: { en: 'Scripted answers for development.', uz: 'Ishlab chiqish uchun tayyor javoblar.' },
  loginWorking: { en: 'Opening openrouter.ai…', uz: 'openrouter.ai ochilmoqda…' },
  loginFailed: { en: 'OpenRouter sign-in failed: ', uz: 'OpenRouter orqali kirish amalga oshmadi: ' },
  refused: { en: 'The model declined to answer this.', uz: 'Model bunga javob berishdan bosh tortdi.' },
  tokens: { en: 'tokens', uz: 'token' },
  redo: { en: 'Do it again', uz: 'Qayta bajarish' },
  retrying: { en: 'The provider is busy — trying again ({n}/2)…', uz: 'Provayder band — qayta urinilyapti ({n}/2)…' },
  retry: { en: 'Try again', uz: 'Qayta urinish' },
  otherModel: { en: 'Use', uz: 'Boshqa model:' },
  modeTutor: { en: 'Tutor', uz: 'Repetitor' },
  modeSocratic: { en: 'Socratic', uz: 'Sokratik' },
  modeCase: { en: 'Case', uz: 'Keys' },
  modeResearch: { en: 'Research', uz: 'Tadqiqot' },
  modeTutorHint: { en: 'Explains and shows on the model.', uz: "Tushuntiradi va modelda ko'rsatadi." },
  modeSocraticHint: { en: 'Leads you to the answer with one question at a time.', uz: 'Javobga bittadan savol bilan olib boradi.' },
  modeCaseHint: {
    en: 'A patient case built from the simulator: you localise the lesion, it grades with the reverse mode and shows it.',
    uz: "Simulyatordan qurilgan bemor keysi: siz o'choqni topasiz, u teskari rejim bilan baholaydi va ko'rsatadi.",
  },
  modeResearchHint: {
    en: 'PhD level, with PubMed and Crossref: cites only references it has checked.',
    uz: 'PhD darajasi, PubMed va Crossref bilan: faqat tekshirilgan manbalarni keltiradi.',
  },
  unverified: { en: 'Not verified by PubMed/Crossref in this chat — check before using:', uz: 'Bu suhbatda PubMed/Crossref bilan tekshirilmagan — ishlatishdan oldin tekshiring:' },
  cardsTitle: { en: 'Anki cards', uz: 'Anki kartalari' },
  cardsDownload: { en: 'Download for Anki (.txt)', uz: 'Anki uchun yuklab olish (.txt)' },
  cardsHow: { en: 'Anki → File → Import → this file (tab-separated: front, back).', uz: 'Anki → File → Import → shu fayl (tab bilan ajratilgan: savol, javob).' },
  c1: { en: 'Give me a brainstem case to localise', uz: 'Menga topish uchun miya ustuni keysini ber' },
  c2: { en: 'A harder case: two lesions, PhD level', uz: "Qiyinroq keys: ikki o'choq, PhD darajasi" },
  c3: { en: 'An internal capsule lacune case', uz: 'Ichki kapsula lakunasi keysi' },
  q1: { en: 'Why is the lesion contralateral above the decussation?', uz: "Nega kesishmadan yuqoridagi o'choq qarama-qarshi tomonda belgi beradi?" },
  q2: { en: 'Help me work out the blood supply of the medulla', uz: "Uzunchoq miyaning qon ta'minotini o'zim topishimga yordam ber" },
  q3: { en: 'Quiz me on the facial colliculus', uz: "Yuz do'ngligi bo'yicha meni sinab ko'r" },
  r1: { en: 'Current evidence on lateral medullary syndrome outcomes', uz: "Lateral uzunchoq miya sindromi oqibatlari bo'yicha hozirgi dalillar" },
  r2: { en: 'Central vein sign in MS diagnosis: what does the literature say?', uz: 'TS tashxisida markaziy vena belgisi: adabiyot nima deydi?' },
  r3: { en: 'DTI of the corticospinal tract after capsular stroke', uz: "Kapsula insultidan keyin kortikospinal yo'lning DTI tasviri" },
  attach: { en: 'Attach a picture', uz: 'Rasm biriktirish' },
  shot3d: { en: '3D view as it is now', uz: "3D ko'rinish (hozirgi holati)" },
  shotPlate: { en: 'The open plate', uz: 'Ochiq kesim plastinkasi' },
  shotFile: { en: 'From a file… (MRI, figure)', uz: 'Fayldan… (MRT, rasm)' },
  shotPaste: { en: 'or paste an image into the box', uz: 'yoki rasmni yozish maydoniga joylashtiring' },
  removeImage: { en: 'Remove', uz: 'Olib tashlash' },
  noScene: { en: 'The 3D view is not ready yet', uz: "3D ko'rinish hali tayyor emas" },
  context: { en: 'Context', uz: 'Kontekst' },
  contextOff: { en: 'off — the AI does not see the screen', uz: "o'chiq — AI ekranni ko'rmaydi" },
  contextNone: { en: 'nothing selected yet', uz: 'hali hech narsa tanlanmagan' },
  contextShow: { en: 'Show what is sent', uz: "Nima yuborilishini ko'rsatish" },
  contextHint: {
    en: 'Sent with your next message: what is selected, the open lesson and plate, and the lesion simulator read-out. Nothing else leaves the app.',
    uz: 'Keyingi xabaringiz bilan yuboriladi: tanlangan tuzilma, ochiq dars va plastinka, shikastlanish simulyatori natijasi. Boshqa hech narsa ilovadan chiqmaydi.',
  },
  sentContext: { en: 'Context sent with this message', uz: 'Shu xabar bilan yuborilgan kontekst' },
} satisfies Record<string, L10n>

const ERR: Record<AIErrorKind, L10n> = {
  auth: {
    en: 'The key was rejected (invalid, expired or without access). Check it in Accounts.',
    uz: "Kalit rad etildi (noto'g'ri, muddati o'tgan yoki ruxsati yo'q). Hisoblarda tekshiring.",
  },
  credit: { en: 'No credit left on this account — top up with the provider.', uz: "Bu hisobda mablag' qolmagan — provayder sahifasida to'ldiring." },
  rate: { en: 'Too many requests right now — wait a moment and try again.', uz: "Hozir so'rovlar juda ko'p — biroz kutib, qayta urinib ko'ring." },
  model: { en: 'This model is not available to your account — pick another one.', uz: 'Bu model hisobingizda mavjud emas — boshqasini tanlang.' },
  network: {
    en: 'Could not reach the provider (network or browser block). For a local server, start it with CORS allowed (OLLAMA_ORIGINS="*").',
    uz: "Provayderga ulanib bo'lmadi (tarmoq yoki brauzer to'sig'i). Lokal server bo'lsa, CORS ruxsati bilan ishga tushiring (OLLAMA_ORIGINS=\"*\").",
  },
  server: { en: 'The provider had an error — try again in a little while.', uz: 'Provayder tomonida xato — birozdan keyin qayta urinib ko‘ring.' },
  bad: { en: 'The provider refused the request:', uz: "Provayder so'rovni qabul qilmadi:" },
  abort: { en: 'Stopped.', uz: "To'xtatildi." },
}

/**
 * The AI panel (PLAN 5.6, AI-1): a sheet from the right with the chat and,
 * behind the key icon, the accounts list — Xcode's Intelligence settings in
 * spirit: sign in with OpenRouter, or bring your own Anthropic / OpenAI /
 * Google key, or a local model.
 */
export function AIPanel() {
  const l = useL()
  const { open, view, setOpen, setView, clear, messages, provider } = useAI()
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open, setOpen])

  return (
    <aside className={`ai-panel glass ${open ? 'open' : ''}`} aria-hidden={!open} aria-label={l(TX.title)}>
      <header className="ai-head">
        <span className="ai-title">
          <Sparkles size={16} /> {view === 'accounts' ? l(TX.accounts) : l(TX.title)}
        </span>
        <span className="ai-head-actions">
          {view === 'chat' && messages.length > 0 && (
            <button className="icon-button" onClick={clear} aria-label={l(TX.clear)} title={l(TX.clear)}>
              <RotateCcw size={15} />
            </button>
          )}
          <button
            className={`icon-button ${view === 'accounts' ? 'active' : ''}`}
            onClick={() => setView(view === 'accounts' ? 'chat' : 'accounts')}
            aria-label={view === 'accounts' ? l(TX.back) : l(TX.accounts)}
            title={view === 'accounts' ? l(TX.back) : l(TX.accounts)}
          >
            <KeyRound size={15} />
          </button>
          <button className="icon-button" onClick={() => setOpen(false)} aria-label={l(TX.close)} title={l(TX.close)}>
            <X size={16} />
          </button>
        </span>
      </header>
      {view === 'accounts' ? <Accounts /> : provider ? <Chat /> : <Connect />}
    </aside>
  )
}

function Connect() {
  const l = useL()
  const { signInOpenRouter, setView, login } = useAI()
  return (
    <div className="ai-body ai-connect">
      <Sparkles size={28} className="ai-connect-mark" />
      <h3>{l(TX.connectTitle)}</h3>
      <p>{l(TX.connectText)}</p>
      <button className="ai-primary" onClick={signInOpenRouter} disabled={login === 'working'}>
        {login === 'working' ? <LoaderCircle size={15} className="spin" /> : null}
        {login === 'working' ? l(TX.loginWorking) : l(TX.signInOR)}
      </button>
      <button className="ai-secondary" onClick={() => setView('accounts')}>
        <KeyRound size={14} /> {l(TX.addKey)}
      </button>
      {typeof login === 'object' && <p className="ai-error">{l(TX.loginFailed) + login.error}</p>}
    </div>
  )
}

function Chat() {
  const l = useL()
  const { messages, busy, send, stop, attachments, mode } = useAI()
  const [draft, setDraft] = useState('')
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const open = useAI((s) => s.open)

  // Follow the answer as it streams, unless the reader scrolled up.
  const last = messages.at(-1)?.text.length ?? 0
  useEffect(() => {
    const el = list.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 120) el.scrollTop = el.scrollHeight
  }, [messages.length, last])
  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  const submit = (text = draft) => {
    if ((!text.trim() && !attachments.length) || busy) return
    setDraft('')
    send(text.trim())
  }

  return (
    <>
      <ModelPicker />
      <ModeBar />
      <div className="ai-body ai-messages" ref={list}>
        {messages.length === 0 && (
          <div className="ai-suggest">
            <span>{l(TX.suggest)}</span>
            {SUGGEST[mode].map((s) => (
              <button key={s.en} onClick={() => submit(l(s))}>
                {l(s)}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <Message key={i} m={m} last={i === messages.length - 1} />
        ))}
      </div>
      <ContextBar />
      <Attachments />
      <form
        className="ai-composer"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <AttachButton />
        <textarea
          ref={input}
          onPaste={(e) => {
            // A pasted screenshot or figure becomes an attachment.
            const file = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'))
            if (!file) return
            e.preventDefault()
            captureFile(file).then((url) => url && useAI.getState().attach({ url, label: file.name || 'pasted image' }))
          }}
          value={draft}
          rows={1}
          placeholder={l(TX.placeholder)}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
        />
        {busy ? (
          <button type="button" className="ai-send stop" onClick={stop} aria-label={l(TX.stop)} title={l(TX.stop)}>
            <Square size={12} fill="currentColor" />
          </button>
        ) : (
          <button type="submit" className="ai-send" disabled={!draft.trim() && !attachments.length} aria-label={l(TX.send)} title={l(TX.send)}>
            <ArrowUp size={16} />
          </button>
        )}
      </form>
      <p className="ai-foot">{l(TX.disclaimer)}</p>
    </>
  )
}

function Message({ m, last }: { m: ChatMessage; last?: boolean }) {
  const l = useL()
  const redo = useAI((s) => s.redo)
  if (m.role === 'user') return <UserMessage m={m} />
  return (
    <div className="ai-msg assistant">
      {m.text ? (
        <Markdown text={m.text} />
      ) : m.retrying ? (
        <span className="ai-thinking">{l(TX.retrying).replace('{n}', String(m.retrying))}</span>
      ) : m.live ? (
        <span className="ai-thinking">{l(TX.thinking)}</span>
      ) : null}
      {m.actions && m.actions.length > 0 && (
        <div className="ai-actions">
          {m.actions.map((x, i) => (
            <button key={i} className={`ai-action ${x.ok ? '' : 'failed'}`} onClick={() => redo(x.call)} title={l(TX.redo)}>
              {x.ok ? <Check size={11} /> : <TriangleAlert size={11} />} {x.text}
            </button>
          ))}
        </div>
      )}
      {m.actions?.flatMap((x, i) => (x.cards ? [<Flashcards key={`c${i}`} deck={x.cards.deck} cards={x.cards.cards} />] : []))}
      {m.unverified && (
        <p className="ai-note ai-unverified">
          <TriangleAlert size={12} /> {l(TX.unverified)} {m.unverified.join(', ')}
        </p>
      )}
      {m.refusal && <p className="ai-note">{l(TX.refused) + (typeof m.refusal === 'string' ? ` (${m.refusal})` : '')}</p>}
      {m.error && (
        <p className="ai-error">
          {l(ERR[m.error.kind])}
          {/* The provider's own words always show (status, model): "it does not work" must be diagnosable from the panel. */}
          {m.error.message ? (
            <small>
              {' '}
              {m.model ? `[${m.model}] ` : ''}
              {m.error.message}
            </small>
          ) : null}
        </p>
      )}
      {m.error && last && <RetryBar m={m} />}
      {!m.live && (m.usage || m.model) && (
        <span className="ai-meta">
          {m.model}
          {m.usage ? ` · ${(m.usage.input ?? 0) + (m.usage.output ?? 0)} ${l(TX.tokens)}` : ''}
        </span>
      )}
    </div>
  )
}

/** Provider · model, from the connected accounts; lists load on first open. */
function ModelPicker() {
  const l = useL()
  const { creds, provider, model, models, choose, loadModels } = useAI()
  const live = PROVIDER_ORDER.filter((p) => connected(p, creds))
  useEffect(() => {
    if (provider && !models[provider]) loadModels(provider).catch(() => {})
  }, [provider, models, loadModels])
  const value = provider ? `${provider}|${model[provider] ?? ''}` : ''
  return (
    <label className="ai-model">
      <span>{l(TX.model)}</span>
      <select
        value={value}
        onFocus={() => live.forEach((p) => !models[p] && loadModels(p).catch(() => {}))}
        onChange={(e) => {
          const [p, ...rest] = e.target.value.split('|')
          choose(p as ProviderId, rest.join('|') || undefined)
        }}
      >
        {!live.length && <option value="">{l(TX.noModels)}</option>}
        {live.map((p) => (
          <optgroup key={p} label={PROVIDER_META[p].name}>
            {(models[p] ?? (model[p] ? [{ id: model[p]!, name: model[p]! }] : [{ id: '', name: '…' }])).map((m) => (
              <option key={m.id} value={`${p}|${m.id}`}>
                {m.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}

const ROW_TEXT: Record<ProviderId, L10n> = {
  openrouter: TX.orText,
  anthropic: TX.anthropicText,
  openai: TX.openaiText,
  google: TX.googleText,
  local: TX.localText,
  mock: TX.mockText,
}

function Accounts() {
  const l = useL()
  const { remember, setRemember, login } = useAI()
  return (
    <div className="ai-body ai-accounts">
      {typeof login === 'object' && <p className="ai-error">{l(TX.loginFailed) + login.error}</p>}
      {PROVIDER_ORDER.map((p) => (
        <AccountRow key={p} p={p} />
      ))}
      <label className="ai-remember">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <span>
          {l(TX.remember)}
          {!remember && <small>{l(TX.rememberOff)}</small>}
        </span>
      </label>
      <p className="ai-foot">{l(TX.privacy)}</p>
    </div>
  )
}

function AccountRow({ p }: { p: ProviderId }) {
  const l = useL()
  const { creds, provider, setCred, signOut, choose, loadModels, signInOpenRouter, models, login } = useAI()
  const meta = PROVIDER_META[p]
  const on = connected(p, creds)
  const [key, setKey] = useState('')
  const [url, setUrl] = useState(creds.local?.baseUrl ?? DEFAULT_LOCAL_URL)
  const [status, setStatus] = useState<'idle' | 'checking' | { ok: number } | { error: string }>('idle')
  const count = useMemo(() => models[p]?.length, [models, p])

  const check = async () => {
    setStatus('checking')
    try {
      setStatus({ ok: (await loadModels(p)).length })
    } catch (e) {
      const kind = (e as { kind?: AIErrorKind }).kind
      setStatus({ error: kind ? l(ERR[kind]) : (e as Error).message })
    }
  }
  const connect = (c: { key?: string; baseUrl?: string }) => {
    setCred(p, c)
    setKey('')
    check()
  }

  return (
    <section className={`ai-account ${on ? 'on' : ''} ${provider === p ? 'active' : ''}`}>
      <div className="ai-account-head">
        <b>{meta.name}</b>
        {on && (
          <span className="ai-badge">
            <Check size={11} /> {provider === p ? l(TX.active) : l(TX.connectedTo)}
          </span>
        )}
      </div>
      <p>{l(ROW_TEXT[p])}</p>
      {on ? (
        <div className="ai-account-actions">
          {provider !== p && (
            <button className="ai-secondary" onClick={() => choose(p)}>
              {l(TX.use)}
            </button>
          )}
          <button className="ai-secondary" onClick={check}>
            {status === 'checking' ? <LoaderCircle size={13} className="spin" /> : null}
            {status === 'checking' ? l(TX.checking) : count !== undefined ? `${count} ${l(TX.models)}` : l(TX.connect)}
          </button>
          <button className="ai-secondary" onClick={() => (signOut(p), setStatus('idle'))}>
            <LogOut size={13} /> {l(TX.signOut)}
          </button>
        </div>
      ) : p === 'mock' ? (
        <div className="ai-account-actions">
          <button className="ai-secondary" onClick={() => connect({ key: 'mock' })}>
            {l(TX.connect)}
          </button>
        </div>
      ) : (
        <>
          {p === 'openrouter' && (
            <button className="ai-primary" onClick={signInOpenRouter} disabled={login === 'working'}>
              {login === 'working' ? l(TX.loginWorking) : l(TX.signInOR)}
            </button>
          )}
          {p === 'local' && <input className="ai-input" value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} aria-label="Base URL" />}
          <form
            className="ai-key"
            onSubmit={(e) => {
              e.preventDefault()
              if (p === 'local') connect({ baseUrl: url.trim(), key: key.trim() || undefined })
              else if (key.trim()) connect({ key: key.trim() })
            }}
          >
            <input
              className="ai-input"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={p === 'openrouter' ? l(TX.orKey) : p === 'local' ? 'API key (optional)' : (meta.keyHint ?? 'API key')}
              autoComplete="off"
              spellCheck={false}
              aria-label={`${meta.name} API key`}
            />
            <button className="ai-secondary" type="submit" disabled={p !== 'local' && !key.trim()}>
              {p === 'local' ? l(TX.connect) : l(TX.save)}
            </button>
          </form>
          {meta.keyUrl && (
            <a className="ai-link" href={meta.keyUrl} target="_blank" rel="noreferrer noopener">
              {l(TX.getKey)} <ExternalLink size={11} />
            </a>
          )}
        </>
      )}
      {typeof status === 'object' && 'error' in status && <p className="ai-error">{status.error}</p>}
      {typeof status === 'object' && 'ok' in status && <p className="ai-ok">✓ {`${status.ok} ${l(TX.models)}`}</p>}
    </section>
  )
}

function UserMessage({ m }: { m: ChatMessage }) {
  const l = useL()
  const [open, setOpen] = useState(false)
  return (
    <>
      {m.images && (
        <div className="ai-sent-images">
          {m.images.map((im, i) => (
            <img key={i} src={im.url} alt={im.label} title={im.label} />
          ))}
        </div>
      )}
      <div className="ai-msg user">{m.text}</div>
      {m.context && (
        <button className="ai-sent-context" onClick={() => setOpen(!open)} title={l(TX.sentContext)}>
          <MapPin size={11} /> {m.context.label || l(TX.context)}
        </button>
      )}
      {open && m.context && <pre className="ai-context-text">{m.context.text}</pre>}
    </>
  )
}

/** What the tutor will be told about the screen with the next message — live, and inspectable. */
function ContextBar() {
  const l = useL()
  const { withContext, setWithContext } = useAI()
  const [show, setShow] = useState(false)
  // Re-read the brief when what it describes changes — not on hover or camera moves (they re-render often).
  const atlasKey = useAtlas(useShallow((s) => [s.selected, s.lesson, s.pathway, s.topic, s.mode, s.view, s.layers, s.lang]))
  const screen = useScreen()
  const open = useAI((s) => s.open)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const b = useMemo(() => (open ? brief() : { text: '', label: '' }), [open, screen, ...atlasKey])
  return (
    <div className="ai-context">
      <div className="ai-context-row">
        <button className={`ai-context-toggle ${withContext ? 'on' : ''}`} onClick={() => setWithContext(!withContext)} aria-pressed={withContext} title={l(TX.contextHint)}>
          <MapPin size={12} /> {l(TX.context)}
        </button>
        <span className="ai-context-label">{withContext ? b.label || l(TX.contextNone) : l(TX.contextOff)}</span>
        {withContext && b.text && (
          <button className="icon-button" onClick={() => setShow(!show)} aria-label={l(TX.contextShow)} title={l(TX.contextShow)}>
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
      {show && withContext && <pre className="ai-context-text">{b.text}</pre>}
    </div>
  )
}

const VIEW_NAMES: Record<string, string> = { scheme: 'schematic', myelin: 'myelin style', nissl: 'Nissl style', atlas: 'atlas cut (MNI)', real: 'real BigBrain slice' }

/** Picture sources: the 3D view, the open plate, a file (or a paste into the box). */
function AttachButton() {
  const l = useL()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const attach = useAI((s) => s.attach)
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('pointerdown', away)
    return () => window.removeEventListener('pointerdown', away)
  }, [open])
  const plate = useScreen((s) => s.plate)
  const hasPlate = !!plate && !!plateFigure()

  const take3d = () => {
    setOpen(false)
    const url = sceneSnapshot()
    if (!url) return setError(l(TX.noScene))
    const a = useAtlas.getState()
    attach({ url, label: `3D view · ${a.view}${a.selected.length ? ' · selection highlighted' : ''}` })
  }
  const takePlate = async () => {
    setOpen(false)
    setBusy(true)
    try {
      const url = await capturePlate()
      const sec = plate ? SECTION_BY_ID.get(plate.plate) : undefined
      if (url) attach({ url, label: `Plate ${sec?.code ?? ''} · ${VIEW_NAMES[plate?.view ?? ''] ?? plate?.view ?? ''}` })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="ai-attach" ref={wrap}>
      <button type="button" className="ai-attach-btn" onClick={() => (setOpen(!open), setError(''))} aria-label={l(TX.attach)} title={error || l(TX.attach)} aria-expanded={open}>
        {busy ? <LoaderCircle size={15} className="spin" /> : <ImagePlus size={16} />}
      </button>
      {open && (
        <div className="ai-attach-menu menu glass" role="menu">
          <button type="button" role="menuitem" className="menu-item" onClick={take3d}>
            <Box size={14} /> {l(TX.shot3d)}
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={takePlate} disabled={!hasPlate}>
            <Layers size={14} /> {l(TX.shotPlate)}
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={() => (setOpen(false), file.current?.click())}>
            <FileImage size={14} /> {l(TX.shotFile)}
          </button>
          <small>{l(TX.shotPaste)}</small>
        </div>
      )}
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          const url = await captureFile(f)
          if (url) attach({ url, label: f.name })
        }}
      />
    </div>
  )
}

/** Pictures waiting to be sent, removable. */
function Attachments() {
  const l = useL()
  const { attachments, detach } = useAI()
  if (!attachments.length) return null
  return (
    <div className="ai-attachments">
      {attachments.map((a, i) => (
        <span key={i} className="ai-thumb" title={a.label}>
          <img src={a.url} alt={a.label} />
          <button onClick={() => detach(i)} aria-label={l(TX.removeImage)}>
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}

const MODES: { id: TutorMode; name: L10n; hint: L10n; icon: typeof Sparkles }[] = [
  { id: 'tutor', name: TX.modeTutor, hint: TX.modeTutorHint, icon: GraduationCap },
  { id: 'socratic', name: TX.modeSocratic, hint: TX.modeSocraticHint, icon: MessageCircleQuestion },
  { id: 'case', name: TX.modeCase, hint: TX.modeCaseHint, icon: Stethoscope },
  { id: 'research', name: TX.modeResearch, hint: TX.modeResearchHint, icon: BookOpen },
]

const SUGGEST: Record<TutorMode, L10n[]> = {
  tutor: [TX.s1, TX.s2, TX.s3],
  socratic: [TX.q1, TX.q2, TX.q3],
  case: [TX.c1, TX.c2, TX.c3],
  research: [TX.r1, TX.r2, TX.r3],
}

/** How the tutor teaches: explain, question, run a case, or research with checked sources. */
function ModeBar() {
  const l = useL()
  const { mode, setMode } = useAI()
  return (
    <div className="ai-modes" role="radiogroup" aria-label="Mode">
      {MODES.map((m) => (
        <button key={m.id} role="radio" aria-checked={mode === m.id} className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)} title={l(m.hint)}>
          <m.icon size={13} /> {l(m.name)}
        </button>
      ))}
    </div>
  )
}

/** Cards from make_flashcards: a preview and a tab-separated file Anki imports. */
function Flashcards({ deck, cards }: { deck: string; cards: { front: string; back: string }[] }) {
  const l = useL()
  const download = () => {
    // Tabs and newlines inside a field would break the columns.
    const clean = (x: string) => x.replace(/[\t\r\n]+/g, ' ').trim()
    const text = ['#separator:tab', '#html:false', `#deck:${clean(deck)}`, ...cards.map((c) => `${clean(c.front)}\t${clean(c.back)}`)].join('\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${clean(deck).replace(/[^\w-]+/g, '_') || 'neuro-atlas'}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="ai-cards">
      <b>
        <Layers size={12} /> {l(TX.cardsTitle)} · {deck} · {cards.length}
      </b>
      <ul>
        {cards.slice(0, 4).map((c, i) => (
          <li key={i}>
            <span>{c.front}</span>
            <small>{c.back}</small>
          </li>
        ))}
      </ul>
      <button className="ai-secondary" onClick={download}>
        <Download size={13} /> {l(TX.cardsDownload)}
      </button>
      <small>{l(TX.cardsHow)}</small>
    </div>
  )
}

/** After a failed answer: send it again, or on another model of the same account (busy, limit, model not available). */
function RetryBar({ m }: { m: ChatMessage }) {
  const l = useL()
  const { retry, models, busy } = useAI()
  const kind = m.error?.kind
  if (!kind || kind === 'auth' || kind === 'credit' || kind === 'abort') return null
  const list = m.provider ? (models[m.provider] ?? []) : []
  const alt =
    m.provider && (kind === 'server' || kind === 'rate' || kind === 'model' || kind === 'bad')
      ? pickModel(
          m.provider,
          list.filter((x) => x.id !== m.model),
        )
      : null
  const altName = alt ? (list.find((x) => x.id === alt)?.name ?? alt) : null
  return (
    <div className="ai-retry">
      <button className="ai-secondary" onClick={() => retry()} disabled={busy}>
        <RotateCcw size={12} /> {l(TX.retry)}
      </button>
      {alt && (
        <button className="ai-secondary" onClick={() => retry(alt)} disabled={busy} title={alt}>
          {l(TX.otherModel)} {altName}
        </button>
      )}
    </div>
  )
}
