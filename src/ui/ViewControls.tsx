import { FlipHorizontal2, Layers3, Slice } from 'lucide-react'
import { CLIP_RANGE, LEVELS, type AxialLevel, partsAtAxialLevel } from '@/data/levels'
import { Slider } from '@/components/ui/slider'
import { useL, useT } from '@/i18n'
import { useAtlas, type ClipAxis } from '@/store/useAtlas'
import { useDraggable } from './useDraggable'

const AXES: ClipAxis[] = ['sagittal', 'coronal', 'axial']

/** Level presets grouped by the structure they belong to, in LEVELS order. */
function groupLevels(): [string, AxialLevel[]][] {
  const byStructure = new Map<string, AxialLevel[]>()
  for (const lvl of LEVELS) {
    const arr = byStructure.get(lvl.structureId) ?? []
    arr.push(lvl)
    byStructure.set(lvl.structureId, arr)
  }
  return [...byStructure]
}
const GROUPED_LEVELS = groupLevels()

/**
 * Floating panel for the three cross-section planes (sagittal/coronal/axial,
 * each independent and combinable) plus the classic teaching-level
 * bookmarks for the brainstem and thalamus; shown only while the Kesim tab
 * is on. Structures listed under an active axial level are computed live
 * from each part's own MNI bounding box (see `partsAtAxialLevel`), not
 * hand-authored per level, so the list always matches what is on screen.
 */
export function PlanesPanel() {
  const t = useT()
  const l = useL()
  const { clip, setClipAxis, layers, visible, selectParts, jumpToLevel } = useAtlas()
  const { panelRef, style, handleProps } = useDraggable()

  const atLevel = clip.axial.enabled ? partsAtAxialLevel(clip.axial.mm, visible, layers) : []

  return (
    <section ref={panelRef as React.RefObject<HTMLElement>} style={style} className="planes-panel glass floating-panel open" aria-label={t.cutaway}>
      <div className="drag-handle drag-handle-h" {...handleProps} />
      <div className="planes-title">
        <Slice size={14} />
        <span>{t.cutaway}</span>
      </div>
      {AXES.map((axis) => {
        const c = clip[axis]
        const [min, max] = CLIP_RANGE[axis]
        return (
          <div className="plane-row" key={axis}>
            <button className={`plane-toggle ${c.enabled ? 'active' : ''}`} aria-pressed={c.enabled} onClick={() => setClipAxis(axis, { enabled: !c.enabled })}>
              {t.planeAxis[axis]}
            </button>
            <Slider
              aria-label={t.planeAxis[axis]}
              min={Math.floor(min)}
              max={Math.ceil(max)}
              step={1}
              value={[Math.round(c.mm)]}
              disabled={!c.enabled}
              onValueChange={(v) => setClipAxis(axis, { mm: Array.isArray(v) ? v[0] : v })}
            />
            <output>{Math.round(c.mm)}</output>
            <button className="plane-flip" aria-label={t.planeFlip} title={t.planeFlip} disabled={!c.enabled} onClick={() => setClipAxis(axis, { flip: !c.flip })}>
              <FlipHorizontal2 size={13} />
            </button>
          </div>
        )
      })}

      <div className="planes-divider" />
      <div className="planes-title">
        <Layers3 size={14} />
        <span>{t.levels}</span>
      </div>
      {GROUPED_LEVELS.map(([structureId, lvls]) => (
        <div className="level-group" key={structureId}>
          <div className="level-group-name">{l(lvls[0].structureName)}</div>
          <div className="level-buttons">
            {lvls.map((lvl) => (
              <button
                key={lvl.id}
                className={`level-btn ${clip.axial.enabled && Math.round(clip.axial.mm) === lvl.mm ? 'active' : ''}`}
                onClick={() => jumpToLevel(lvl.mm)}
                title={l(lvl.name)}
              >
                {l(lvl.name)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {clip.axial.enabled && (
        <>
          <div className="planes-divider" />
          <div className="level-group-name">{t.levelsAt(Math.round(clip.axial.mm))}</div>
          <p className="level-hint">{t.levelsHint}</p>
          <ul className="level-results">
            {atLevel.length === 0 && <li className="level-empty">—</li>}
            {atLevel.map((p) => (
              <li key={p.id}>
                <button onClick={() => selectParts([p.id], { kind: 'part', id: p.id })}>{l(p.name)}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
