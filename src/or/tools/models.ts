import * as T from 'three'

export type ToolKind = 'probe' | 'catheter' | 'drill'

/**
 * Instrument models, in millimetres. Local frame: the tip is the origin and the shaft runs along +Y (away from the tip),
 * so the engine only has to aim local −Y along the direction of travel. Procedural: real assets replace them later (AG-11).
 */
export function buildTool(kind: ToolKind): T.Group {
  const g = new T.Group()
  g.name = `tool-${kind}`
  const steel = new T.MeshStandardMaterial({ color: '#c9d0d6', metalness: 0.9, roughness: 0.25 })
  const dark = new T.MeshStandardMaterial({ color: '#2b3036', roughness: 0.5, metalness: 0.3 })
  const add = (geo: T.BufferGeometry, mat: T.Material, y: number) => {
    const m = new T.Mesh(geo, mat)
    m.position.y = y
    m.raycast = () => {}
    g.add(m)
    return m
  }
  if (kind === 'probe') {
    const tip = add(new T.ConeGeometry(1.5, 8, 16), steel, 4)
    tip.rotation.x = Math.PI
    add(new T.CylinderGeometry(1.5, 1.5, 130, 16), steel, 8 + 65)
    add(new T.CylinderGeometry(6.5, 6.5, 70, 20), dark, 8 + 130 + 35)
    for (let i = 0; i < 4; i++) add(new T.TorusGeometry(6.6, 0.8, 8, 20), steel, 150 + i * 14).rotation.x = Math.PI / 2
  } else if (kind === 'catheter') {
    // 2.7 mm outside diameter (a 8 Fr ventricular catheter), blunt tip, a depth mark every 10 mm, a hub at the top.
    const tipCap = add(new T.SphereGeometry(1.35, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new T.MeshStandardMaterial({ color: '#eef2f4', roughness: 0.4 }), 0)
    tipCap.scale.y = 1
    add(new T.CylinderGeometry(1.35, 1.35, 200, 16), new T.MeshStandardMaterial({ color: '#eef2f4', roughness: 0.4, transparent: true, opacity: 0.92 }), 100)
    for (let mm = 10; mm <= 100; mm += 10) add(new T.CylinderGeometry(1.45, 1.45, mm % 50 === 0 ? 2 : 0.8, 16), dark, mm)
    add(new T.CylinderGeometry(1.35, 4.5, 14, 16), new T.MeshStandardMaterial({ color: '#4aa3df', roughness: 0.5 }), 207)
    add(new T.CylinderGeometry(4.5, 4.5, 16, 16), new T.MeshStandardMaterial({ color: '#4aa3df', roughness: 0.5 }), 222)
  } else {
    const bit = add(new T.CylinderGeometry(2.4, 0.4, 24, 16), steel, 12)
    bit.rotation.y = 0.5
    add(new T.CylinderGeometry(4.5, 4.5, 22, 20), steel, 35)
    add(new T.CylinderGeometry(12, 11, 90, 24), dark, 91)
    add(new T.CylinderGeometry(7, 12, 14, 24), steel, 143)
    add(new T.CylinderGeometry(2.5, 2.5, 70, 10), dark, 185)
  }
  return g
}
