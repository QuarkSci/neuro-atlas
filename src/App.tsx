import { useEffect } from 'react'
import { SceneView } from '@/scene/SceneView'
import { useAtlas } from '@/store/useAtlas'
import { useT } from '@/i18n'
import { Identity, TabBar, ViewGroup } from '@/ui/Header'
import { Sidebar } from '@/ui/Sidebar'
import { SearchPanel } from '@/ui/SearchPanel'
import { PlanesPanel } from '@/ui/ViewControls'
import { SectionViewer } from '@/ui/SectionViewer'
import { QuizPanel } from '@/ui/QuizPanel'
import { LessonPanel } from '@/ui/LessonPanel'
import { BottomBar } from '@/ui/BottomBar'
import { Inspector } from '@/ui/Inspector'
import { About } from '@/ui/About'
import { Credit, Footer, HoverLabel, Loading } from '@/ui/Overlays'
import { AIPanel } from '@/ui/AIPanel'
import { completeOpenRouterLogin, useAI } from '@/ai/useAI'

export default function App() {
  const t = useT()
  const { lang, panel, setPanel, cutaway } = useAtlas()

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = `${t.title} · ${t.eyebrow.charAt(0) + t.eyebrow.slice(1).toLowerCase()}`
  }, [lang, t])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      // ⌘/ (Ctrl+/): the AI panel, from anywhere.
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        useAI.getState().toggle()
        return
      }
      if (e.key === '/' && !typing) {
        e.preventDefault()
        if (useAtlas.getState().panel !== 'search') setPanel('search')
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [setPanel])

  // Back from openrouter.ai with ?code=: finish the sign-in.
  useEffect(() => {
    completeOpenRouterLogin()
  }, [])

  return (
    <main className="studio">
      <SceneView />
      <div className="vignette" />
      <Identity />
      <TabBar />
      <ViewGroup />
      <Sidebar />
      {panel === 'search' && <SearchPanel />}
      {cutaway && <PlanesPanel />}
      <BottomBar />
      <Footer />
      <Credit />
      <HoverLabel />
      <Loading />
      <Inspector />
      <About />
      <QuizPanel />
      <SectionViewer />
      <LessonPanel />
      <AIPanel />
    </main>
  )
}
