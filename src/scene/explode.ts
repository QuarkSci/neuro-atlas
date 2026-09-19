import * as T from 'three'

/**
 * Where a structure travels during the first half of the explode slider:
 * radially away from the brain's centre, further for peripheral pieces so
 * the cortex opens up like petals while deep nuclei move only a little.
 * Values are millimetres at full separation.
 */
export function separationVector(centre: T.Vector3, brainCentre: T.Vector3): T.Vector3 {
  const v = centre.clone().sub(brainCentre)
  const d = v.length()
  if (d < 1e-3) return new T.Vector3()
  v.normalize()
  return v.multiplyScalar(18 + d * 0.9)
}

export interface Cell {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Pack the visible parts into a front-facing grid. Every part keeps its own
 * orientation; cells are sized from the assembled bounding box.
 */
export function inventoryLayout(parts: { id: string; bounds: T.Box3 }[], aspect = 1) {
  // Horizontal padding keeps neighbours apart; the taller vertical padding
  // leaves room for a caption under every piece.
  const padX = 8,
    padY = 22
  const cards = parts.map((p) => {
    const size = p.bounds.getSize(new T.Vector3())
    return { id: p.id, width: Math.max(6, size.x) + padX, height: Math.max(6, size.y) + padY }
  })
  const area = cards.reduce((n, c) => n + c.width * c.height, 0)
  const maxWidth = Math.max(30, ...cards.map((c) => c.width))
  const targetWidth = Math.max(maxWidth, Math.sqrt(area * Math.max(0.6, Math.min(2.2, aspect))) * 1.15)
  cards.sort((a, b) => b.height - a.height || a.id.localeCompare(b.id))
  const cells = new Map<string, Cell>()
  let x = 0,
    y = 0,
    row = 0,
    usedWidth = 0
  for (const c of cards) {
    if (x > 0 && x + c.width > targetWidth) {
      x = 0
      y += row
      row = 0
    }
    // Cell centre sits slightly above the row middle so the caption gap is below.
    cells.set(c.id, { x: x + c.width / 2, y: -y - c.height / 2 + padY * 0.3, width: c.width, height: c.height })
    x += c.width
    usedWidth = Math.max(usedWidth, x)
    row = Math.max(row, c.height)
  }
  const height = y + row
  cells.forEach((c) => {
    c.x -= usedWidth / 2
    c.y += height / 2
  })
  return { cells, width: usedWidth, height }
}
