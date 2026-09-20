import { useCallback, useMemo, useRef, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { ACTIVE_SYSTEMS, ALL_SYSTEM_IDS, LAYERS, LEAF_PARTS } from '@/data'
import type { LayerId, SystemId } from '@/data/types'
import { useL, useT } from '@/i18n'
import { LAYER_COLORS } from '@/scene/materials'
import { useAtlas } from '@/store/useAtlas'

/** Distance the sheet must be pulled down before release dismisses it. */
const DISMISS_PX = 90

/**
 * iOS sheet behaviour: the grabber drags the sheet down only (never up past
 * its resting place), and a release past `DISMISS_PX` closes it instead of
 * springing back.
 */
function useSheetDrag(onDismiss: () => void) {
  const [dy, setDy] = useState(0)
  const start = useRef<number | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.preventDefault()
    start.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (start.current === null) return
    setDy(Math.max(0, e.clientY - start.current))
  }, [])

  const end = useCallback(() => {
    if (start.current === null) return
    start.current = null
    setDy((d) => {
      if (d > DISMISS_PX) onDismiss()
      return 0
    })
  }, [onDismiss])

  return {
    dy,
    handleProps: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
  }
}

export function SystemsPanel() {
  const t = useT()
  const l = useL()
  const { visible, layers, isolate, selected, toggleSystem, showOnly, toggleLayer, panel, setPanel } = useAtlas()
  const close = useCallback(() => setPanel(null), [setPanel])
  const { dy, handleProps } = useSheetDrag(close)
  const counts = useMemo(() => {
    const bySystem = Object.fromEntries(ACTIVE_SYSTEMS.map((s) => [s.id, 0])) as Record<SystemId, number>
    const byLayer = Object.fromEntries(LAYERS.map((l) => [l.id, 0])) as Record<LayerId, number>
    for (const p of LEAF_PARTS) {
      bySystem[p.system]++
      byLayer[p.layer]++
    }
    return { bySystem, byLayer }
  }, [])
  const visibleCount = LEAF_PARTS.filter((p) => (isolate ? selected.includes(p.id) : (visible.includes(p.system) && layers.includes(p.layer)) || selected.includes(p.id))).length
  const open = panel === 'systems'

  return (
    <section
      className={`systems-panel sheet glass ${open ? 'open' : ''} ${dy ? 'dragging' : ''}`}
      style={{ '--sheet-dy': `${dy}px` } as React.CSSProperties}
      aria-label={t.systems}
      aria-hidden={!open}
    >
      <div className="sheet-grabber" {...handleProps} />
      <div className="sheet-head">
        <button className="sheet-round" onClick={close} aria-label={t.close}>
          <X size={17} />
        </button>
        <span className="sheet-title">{t.systems}</span>
        <button className="sheet-round accent" onClick={() => showOnly(ALL_SYSTEM_IDS)} aria-label={t.showAll} title={t.showAll}>
          <Eye size={16} />
        </button>
      </div>
      <div className="presets" role="group" aria-label={t.layers}>
        {LAYERS.map((layer) => (
          <button key={layer.id} aria-pressed={layers.includes(layer.id)} onClick={() => toggleLayer(layer.id)} title={`${layer.source} · ${layer.license}`}>
            <span className="layer-swatch" style={{ background: LAYER_COLORS[layer.id] }} />
            {layer.short ? l(layer.short) : l(layer.name).replace(/ .*/, '')} <span className="system-count">{counts.byLayer[layer.id]}</span>
          </button>
        ))}
      </div>
      <div className="system-list">
        {ACTIVE_SYSTEMS.map((s) => (
          <div className={`system-row ${visible.includes(s.id) ? 'enabled' : ''}`} key={s.id}>
            <button className="system-name" title={t.showOnly(l(s.name))} onClick={() => showOnly([s.id])}>
              <span className="system-dot" style={{ background: s.color }} />
              {l(s.name)}
              <span className="system-count">{counts.bySystem[s.id]}</span>
            </button>
            <Switch checked={visible.includes(s.id)} onCheckedChange={() => toggleSystem(s.id)} aria-label={t.show(l(s.name))} />
          </div>
        ))}
      </div>
      <div className="panel-foot">
        <span>{t.visibleCount(visibleCount)}</span>
        <button onClick={() => showOnly([])}>{t.hideAll}</button>
      </div>
    </section>
  )
}
