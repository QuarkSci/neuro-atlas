import { useEffect } from 'react'
import { SceneView } from '@/scene/SceneView'
import { useAtlas } from '@/store/useAtlas'
import { useT } from '@/i18n'
import { Identity, TopActions } from '@/ui/Header'
import { SideRail } from '@/ui/SideRail'
import { SystemsPanel } from '@/ui/SystemsPanel'
import { SearchPanel } from '@/ui/SearchPanel'
import { PlanesPanel } from '@/ui/ViewControls'
import { BottomBar } from '@/ui/BottomBar'
import { Inspector } from '@/ui/Inspector'
import { About } from '@/ui/About'
import { Credit, Footer, HoverLabel, Loading } from '@/ui/Overlays'

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
      if (e.key === '/' && !typing) {
        e.preventDefault()
        if (useAtlas.getState().panel !== 'search') setPanel('search')
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [setPanel])

  return (
    <main className="studio">
      <SceneView />
      <div className="vignette" />
      <Identity />
      <TopActions />
      <SideRail />
      <SystemsPanel />
      {panel === 'search' && <SearchPanel />}
      {cutaway && <PlanesPanel />}
      <BottomBar />
      <Footer />
      <Credit />
      <HoverLabel />
      <Loading />
      <Inspector />
      <About />
    </main>
  )
}
