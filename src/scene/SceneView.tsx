import { useEffect, useRef } from 'react'
import { LEAF_PARTS, PART_BY_ID } from '@/data'
import type { LayerId } from '@/data/types'
import { useAtlas, type AtlasState, type Lang } from '@/store/useAtlas'
import { useT } from '@/i18n'
import { BrainScene, type SceneSnapshot } from './BrainScene'
import { loadGeometries } from './loader'

const snapshot = (s: AtlasState): SceneSnapshot => ({
  visible: s.visible,
  layers: s.layers,
  selected: s.selected,
  isolate: s.isolate,
  explode: s.explode,
  peel: s.peel,
  view: s.view,
  autoRotate: s.autoRotate,
  cutaway: s.cutaway,
  clip: s.clip,
  resetTick: s.resetTick,
  inspectorOpen: s.inspectorOpen,
  hovered: s.hovered,
})

const labelsFor = (lang: Lang, ids?: Set<string>) => Object.fromEntries(LEAF_PARTS.filter((p) => !ids || ids.has(p.id)).map((p) => [p.id, p.name[lang] ?? p.name.en]))

/**
 * Mounts the Three.js scene once the gross anatomy is in and streams store
 * changes into it. Every other layer is fetched the first time it is
 * switched on (or a structure in it is selected) — the full atlas is far
 * too large to download up front.
 */
export function SceneView() {
  const host = useRef<HTMLDivElement>(null)
  const t = useT()
  const tRef = useRef(t)
  tRef.current = t

  useEffect(() => {
    const el = host.current
    if (!el) return
    const store = useAtlas
    const { setProgress, setError } = store.getState()
    let scene: BrainScene | null = null
    let cancelled = false
    let lang = store.getState().lang
    const loaded = new Set<LayerId>()
    const loading = new Set<LayerId>()

    const progress = (done: number, total: number) => setProgress(Math.min(95, Math.round((done / total) * 95)))

    const loadLayer = async (layer: LayerId) => {
      if (loaded.has(layer) || loading.has(layer)) return
      loading.add(layer)
      const parts = LEAF_PARTS.filter((p) => p.layer === layer)
      try {
        const geometries = await loadGeometries(parts, progress)
        if (cancelled || !scene) return
        scene.addGeometries(geometries)
        scene.setLabelsFor(labelsFor(store.getState().lang, new Set(parts.map((p) => p.id))))
        loaded.add(layer)
      } catch (e) {
        console.error(e)
      } finally {
        loading.delete(layer)
        if (!cancelled) setProgress(100)
      }
    }

    /** Layers the current state needs: every enabled one, plus any a selected structure lives in. */
    const neededLayers = (s: AtlasState) => {
      const need = new Set<LayerId>(s.layers)
      for (const id of s.selected) {
        const p = PART_BY_ID.get(id)
        if (p) need.add(p.layer)
      }
      return need
    }

    const initial = store.getState()
    const firstLayers = [...neededLayers(initial)]
    const firstParts = LEAF_PARTS.filter((p) => firstLayers.includes(p.layer))
    loadGeometries(firstParts, progress)
      .then((geometries) => {
        if (cancelled) return
        scene = new BrainScene(el, geometries, {
          onSelect: (id) => {
            const s = store.getState()
            if (!id) {
              if (!s.isolate) s.clearSelection()
              return
            }
            if (PART_BY_ID.has(id)) s.selectParts([id], { kind: 'part', id })
          },
          onHover: (id) => store.getState().setHovered(id),
          onError: (code) => setError(code === 'context-lost' ? tRef.current.contextLost : tRef.current.webgl),
        })
        for (const l of firstLayers) loaded.add(l)
        scene.setLabels(labelsFor(lang))
        scene.setState(snapshot(store.getState()))
        if (import.meta.env.DEV) (window as unknown as { __scene: BrainScene }).__scene = scene
        setProgress(100)
        for (const l of neededLayers(store.getState())) void loadLayer(l)
      })
      .catch((e) => {
        console.error(e)
        setError(tRef.current.webgl)
      })

    const unsubscribe = store.subscribe((s) => {
      if (!scene) return
      scene.setState(snapshot(s))
      if (s.lang !== lang) {
        lang = s.lang
        scene.setLabels(labelsFor(lang))
      }
      for (const l of neededLayers(s)) void loadLayer(l)
    })
    return () => {
      cancelled = true
      unsubscribe()
      scene?.dispose()
    }
  }, [])

  return <div className="scene" ref={host} />
}
