import { useEffect, useRef, useState } from 'react'
import { Box, Check, Ellipsis, Info, Languages, Palette, SunMoon, PanelLeft, RotateCw, Search, Slice, Sparkles } from 'lucide-react'
import { LEAF_PARTS } from '@/data'
import { useT } from '@/i18n'
import { useAtlas, type View } from '@/store/useAtlas'
import { useLens } from './useLens'
import { useAI } from '@/ai/useAI'

const VIEWS: View[] = ['three-quarter', 'lateral', 'front', 'top']

/** The atlas mark: a brain in profile. */
export function Mark({ size = '64%' }: { size?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 3.5a3 3 0 0 0-3 3 3 3 0 0 0-2 4.5 3 3 0 0 0 1 5 3 3 0 0 0 4 2.5V3.5Z" />
      <path d="M14.5 3.5a3 3 0 0 1 3 3 3 3 0 0 1 2 4.5 3 3 0 0 1-1 5 3 3 0 0 1-4 2.5V3.5Z" />
      <path d="M9.5 18.5v2M14.5 18.5v2M6.5 6.5c1 .5 2 .5 3 0M17.5 6.5c-1 .5-2 .5-3 0" />
    </svg>
  )
}

/** Wordmark in the top-left corner while the sidebar (which carries its own) is closed. */
export function Identity() {
  const t = useT()
  const sidebar = useAtlas((s) => s.sidebar)
  const setAboutOpen = useAtlas((s) => s.setAboutOpen)
  if (sidebar) return null
  return (
    <header className="identity">
      <button className="identity-mark glass lens" onClick={() => setAboutOpen(true)} aria-label={t.about} title={t.about}>
        <Mark />
      </button>
      <div className="identity-text">
        <h1>{t.title}</h1>
        <div className="identity-meta">
          {t.metaPieces(LEAF_PARTS.length)} <span>·</span> {t.metaSpace}
        </div>
      </div>
    </header>
  )
}

/**
 * The tab bar (iPadOS pattern): sidebar toggle, the two top-level places —
 * the free atlas and the study tab — and search. Everything else hangs off
 * one of those.
 */
export function TabBar() {
  const t = useT()
  const { mode, setMode, sidebar, setSidebar, panel, setPanel } = useAtlas()
  const tabsRef = useRef<HTMLDivElement>(null)
  const blobRef = useRef<HTMLSpanElement>(null)
  useLens(tabsRef, blobRef, '.tab')
  const learn = mode === 'learn'
  return (
    <nav className="tab-bar glass lens" aria-label={t.tools}>
      <button className={`bar-icon ${sidebar ? 'active' : ''}`} onClick={() => setSidebar(!sidebar)} aria-pressed={sidebar} aria-label={t.sidebar} title={t.sidebar}>
        <PanelLeft size={19} />
      </button>
      <div className="tab-group" role="tablist" aria-label={t.modeTabs} ref={tabsRef}>
        <span className="lens-blob" ref={blobRef} aria-hidden />
        <button role="tab" className={`tab ${learn ? '' : 'active'}`} aria-selected={!learn} onClick={() => learn && setMode('explode')}>
          {t.tabAtlas}
        </button>
        <button role="tab" className={`tab ${learn ? 'active' : ''}`} aria-selected={learn} onClick={() => setMode('learn')}>
          {t.tabLearn}
        </button>
      </div>
      <button
        className={`bar-icon ${panel === 'search' ? 'active' : ''}`}
        onClick={() => setPanel('search')}
        aria-pressed={panel === 'search'}
        aria-label={t.findPart}
        title={`${t.findPart} ( / )`}
      >
        <Search size={19} />
      </button>
    </nav>
  )
}

/**
 * Camera and display controls, folded into three buttons: the view menu, the
 * cutaway toggle, and "more" (rotation, colours, language, about). The menus
 * are siblings of the glass group rather than children — glass nested in
 * glass cannot see the scene behind it.
 */
export function ViewGroup() {
  const t = useT()
  const { view, setView, explode, cutaway, setCutaway, autoRotate, setAutoRotate, isolate, lang, setLang, setAboutOpen, colorMode, setColorMode, theme, setTheme } = useAtlas()
  const [open, setOpen] = useState<'view' | 'more' | null>(null)
  const aiOpen = useAI((s) => s.open)
  const toggleAI = useAI((s) => s.toggle)
  const wrap = useRef<HTMLDivElement>(null)
  const frontOnly = explode > 0.8

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(null)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('pointerdown', away)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', away)
      window.removeEventListener('keydown', key)
    }
  }, [open])

  return (
    <div className="view-wrap" ref={wrap}>
      <div className="view-group glass lens" role="toolbar" aria-label={t.viewControls}>
        <button
          className={`bar-icon ${open === 'view' ? 'active' : ''}`}
          onClick={() => setOpen(open === 'view' ? null : 'view')}
          aria-haspopup="menu"
          aria-expanded={open === 'view'}
          aria-label={t.viewMenu}
          title={t.viewMenu}
        >
          <Box size={19} />
        </button>
        <button
          className={`bar-icon ${cutaway ? 'active' : ''}`}
          disabled={explode >= 0.4}
          onClick={() => setCutaway(!cutaway)}
          aria-pressed={cutaway}
          aria-label={t.cutaway}
          title={t.cutaway}
        >
          <Slice size={18} />
        </button>
        <button
          className={`bar-icon ${aiOpen ? 'active' : ''}`}
          onClick={() => {
            setOpen(null)
            toggleAI()
          }}
          aria-pressed={aiOpen}
          aria-label={t.aiPanel}
          title={`${t.aiPanel} (⌘/)`}
        >
          <Sparkles size={18} />
        </button>
        <button
          className={`bar-icon ${open === 'more' ? 'active' : ''}`}
          onClick={() => setOpen(open === 'more' ? null : 'more')}
          aria-haspopup="menu"
          aria-expanded={open === 'more'}
          aria-label={t.more}
          title={t.more}
        >
          <Ellipsis size={19} />
        </button>
      </div>
      {open === 'view' && (
        <div className="menu glass" role="menu" aria-label={t.viewMenu}>
          {VIEWS.map((v) => (
            <button
              key={v}
              role="menuitemradio"
              aria-checked={view === v}
              className="menu-item"
              disabled={frontOnly && v !== 'front'}
              onClick={() => {
                if (cutaway) setCutaway(false)
                setView(v)
                setOpen(null)
              }}
            >
              <span className="menu-check">{view === v && <Check size={15} />}</span>
              {t.views[v]}
            </button>
          ))}
        </div>
      )}
      {open === 'more' && (
        <div className="menu glass" role="menu" aria-label={t.more}>
          <button role="menuitemcheckbox" aria-checked={autoRotate} className="menu-item" disabled={explode >= 0.4 || isolate} onClick={() => setAutoRotate(!autoRotate)}>
            <span className="menu-check">{autoRotate && <Check size={15} />}</span>
            {t.autoRotate}
            <RotateCw size={16} className="menu-trail" />
          </button>
          <div className="menu-sep" />
          <div className="menu-row">
            <span className="menu-label">
              <SunMoon size={15} /> {t.theme}
            </span>
            <div className="seg" role="group" aria-label={t.theme}>
              <button className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
                {t.themeDark}
              </button>
              <button className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
                {t.themeLight}
              </button>
            </div>
          </div>
          <div className="menu-row">
            <span className="menu-label">
              <Palette size={15} /> {t.tissueColours}
            </span>
            <div className="seg" role="group" aria-label={t.tissueColours}>
              <button className={colorMode === 'real' ? 'active' : ''} aria-pressed={colorMode === 'real'} onClick={() => setColorMode('real')}>
                {t.colourReal}
              </button>
              <button className={colorMode === 'atlas' ? 'active' : ''} aria-pressed={colorMode === 'atlas'} onClick={() => setColorMode('atlas')}>
                {t.colourAtlas}
              </button>
            </div>
          </div>
          <div className="menu-row">
            <span className="menu-label">
              <Languages size={15} /> {t.language}
            </span>
            <div className="seg" role="group" aria-label={t.language}>
              <button className={lang === 'uz' ? 'active' : ''} aria-pressed={lang === 'uz'} onClick={() => setLang('uz')}>
                O'zbek
              </button>
              <button className={lang === 'en' ? 'active' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
                English
              </button>
            </div>
          </div>
          <div className="menu-sep" />
          <button
            role="menuitem"
            className="menu-item"
            onClick={() => {
              setOpen(null)
              setAboutOpen(true)
            }}
          >
            <span className="menu-check" />
            {t.about}
            <Info size={16} className="menu-trail" />
          </button>
        </div>
      )}
    </div>
  )
}
