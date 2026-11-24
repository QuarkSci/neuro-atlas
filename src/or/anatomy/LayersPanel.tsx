import { useState } from 'react'
import * as T from 'three'
import { useAtlas } from '@/store/useAtlas'
import { activeAnatomy, activeDura, activeRoom } from '../orMode'
import type { LayerKind } from './shells'

const NAMES: Record<LayerKind, { uz: string; en: string }> = {
  dura: { uz: 'Dura', en: 'Dura' },
  arachnoid: { uz: 'Araxnoid', en: 'Arachnoid' },
  csf: { uz: 'Likvor', en: 'CSF' },
}

/** Membrane layers under the bone and the dura opening (RL-A A-3). Provisional thicknesses: see `shells.ts`. */
export function LayersPanel() {
  const lang = useAtlas((s) => s.lang)
  const [, bump] = useState(0)
  const an = activeAnatomy()
  const du = activeDura()
  if (!an || !du) return null
  const uz = lang === 'uz'
  const rep = du.report()
  const refresh = () => bump((n) => n + 1)
  const plan = () => {
    const room = activeRoom()
    if (!room) return
    // The Kocher side (right frontal convexity), the same site the microscope view looks at.
    du.begin(room.scalp.surfaceAt(new T.Vector3(0.28, 0.88, 0.38)), 12)
    refresh()
  }
  return (
    <>
      <div className="or-row">
        <span className="or-label">{uz ? 'Pardalar' : 'Membranes'}</span>
        {(['dura', 'arachnoid', 'csf'] as const).map((k) => (
          <button
            key={k}
            className={`or-chip ${an.isVisible(k) ? 'on' : ''}`}
            aria-pressed={an.isVisible(k)}
            onClick={() => {
              an.setLayer(k, !an.isVisible(k))
              refresh()
            }}
            type="button"
          >
            {NAMES[k][lang]}
          </button>
        ))}
      </div>
      <div className="or-row">
        <button className={`or-chip ${rep ? 'on' : ''}`} aria-pressed={!!rep} onClick={() => (rep ? (du.close(), refresh()) : plan())} type="button">
          {rep ? (uz ? 'Durani yopish' : 'Close dura') : uz ? 'Durani ochish' : 'Open dura'}
        </button>
        {rep && (
          <>
            <label className="or-label">
              {uz ? 'Kesish' : 'Incision'}
              <input type="range" min={0} max={1} step={0.02} value={rep.cut} onChange={(e) => (du.setCut(+e.target.value), refresh())} />
            </label>
            <label className="or-label">
              {uz ? 'Burish' : 'Flap'}
              <input type="range" min={0} max={1} step={0.02} value={rep.flapDeg / 134.7} disabled={rep.cut < 1} onChange={(e) => (du.setFlap(+e.target.value), refresh())} />
            </label>
          </>
        )}
      </div>
      {rep && (
        <p className="or-hint">
          {uz ? 'Ochiq maydon' : 'Opening'} {rep.areaMm2.toFixed(0)} mm² · {uz ? 'likvor chuqurligi' : 'CSF depth'} {rep.csfMinMm.toFixed(1)}–{rep.csfMeanMm.toFixed(1)} mm (
          {uz ? 'taxminiy' : 'provisional'})
        </p>
      )}
    </>
  )
}
