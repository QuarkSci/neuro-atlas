import * as T from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { buildScalp, type Scalp } from './scalp'

/**
 * Procedural operating room, in scene millimetres.
 *
 * Room frame (the group's local axes): x = patient's left→right on screen from the foot, y = up (the room's
 * up is the patient's anterior axis: the patient lies supine), z = along the table towards the feet.
 * Origin: the table-top surface at the head end, on the midline. `group` carries the rotation into atlas
 * scene space (scene up = superior y, anterior = +z), so brain meshes, picking and instruments keep atlas
 * coordinates: nothing in the atlas is ever rotated.
 *
 * Every dimension is a real one (table 620 × 1950 mm, floor tiles 600 mm, wall tiles 300 mm, lamp 600 mm):
 * the room is a ruler. Props are procedural; real assets (AG-11) replace them later.
 */
export const TABLE_HEIGHT = 950
const ROOM = { x: 2900, zMin: -2700, zMax: 3500, ceiling: 1900 }

/** Layers of the head, outside in: skin, skin as a ghost over the skull, skull alone, brain alone. */
export type Skin = 'on' | 'ghost' | 'bone' | 'off'
export type RoomTheme = 'dark' | 'light'

const noRay = (o: T.Object3D) => (o.raycast = () => {})

function tileTexture(base: string, grout: string, cells: number, size = 512, noise = 6) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = base
  g.fillRect(0, 0, size, size)
  // Faint mottling so a flat colour does not read as CG.
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * noise * 0.01})`
    g.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 18, 2 + Math.random() * 18)
  }
  g.strokeStyle = grout
  g.lineWidth = Math.max(2, size / cells / 28)
  const step = size / cells
  for (let i = 0; i <= cells; i++) {
    g.beginPath()
    g.moveTo(i * step, 0)
    g.lineTo(i * step, size)
    g.moveTo(0, i * step)
    g.lineTo(size, i * step)
    g.stroke()
  }
  const t = new T.CanvasTexture(c)
  t.wrapS = t.wrapT = T.RepeatWrapping
  t.colorSpace = T.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function monitorTexture() {
  const c = document.createElement('canvas')
  c.width = 320
  c.height = 200
  const g = c.getContext('2d')!
  g.fillStyle = '#04090c'
  g.fillRect(0, 0, 320, 200)
  const trace = (y: number, color: string, f: (x: number) => number) => {
    g.strokeStyle = color
    g.lineWidth = 2
    g.beginPath()
    for (let x = 0; x < 230; x++) g[x ? 'lineTo' : 'moveTo'](x, y + f(x))
    g.stroke()
  }
  trace(34, '#35e06f', (x) => (x % 46 < 4 ? -22 : x % 46 < 7 ? 12 : Math.sin(x / 9) * 1.5))
  trace(84, '#4fb7ff', (x) => -Math.max(0, Math.sin(((x % 46) / 46) * Math.PI)) * 16)
  trace(134, '#ffd54a', (x) => Math.sin(x / 22) * 9)
  g.font = 'bold 34px sans-serif'
  g.fillStyle = '#35e06f'
  g.fillText('72', 248, 46)
  g.fillStyle = '#4fb7ff'
  g.fillText('99', 248, 98)
  g.fillStyle = '#ffd54a'
  g.font = 'bold 22px sans-serif'
  g.fillText('118/74', 238, 150)
  g.font = '11px sans-serif'
  g.fillStyle = '#7a8a92'
  g.fillText('DEMO · ta’lim uchun', 12, 190)
  const t = new T.CanvasTexture(c)
  t.colorSpace = T.SRGBColorSpace
  return t
}

export class OperatingRoom {
  /** Room frame → atlas scene (see the file header). Add this, and only this, to the scene. */
  readonly group = new T.Group()
  /** Lights live in scene space (a hemisphere light's direction is a world direction). */
  readonly lights = new T.Group()
  readonly scalp: Scalp
  readonly scalpMesh: T.Mesh<T.BufferGeometry, T.MeshPhysicalMaterial>
  /** Head centre in room-frame mm and the table-end origin in scene mm. */
  readonly origin = new T.Vector3()
  /** Pin tips on the skull (room frame): one side single, the other side double, as the Mayfield clamp. */
  readonly pins: T.Vector3[] = []
  private hemi: T.HemisphereLight
  private spot: T.SpotLight
  private cone: T.Mesh
  private lampGlow: T.MeshStandardMaterial
  private screen!: T.MeshBasicMaterial
  private walls: T.MeshStandardMaterial[] = []
  private disposables: { dispose: () => void }[] = []
  private skin: Skin = 'on'
  private theme: RoomTheme = 'dark'
  private lampOn = true

  constructor(skull: T.BufferGeometry[]) {
    this.scalp = buildScalp(skull)
    const { centre, box, thickness } = this.scalp
    // Table-top plane just under the occiput; head end of the table a little above the shoulders.
    const zTable = box.min.z - thickness - 35
    const yHead = this.scalp.chinY - 6 - 224 + 40
    this.origin.set(centre.x, yHead, zTable)
    this.group.rotation.x = Math.PI / 2
    this.group.position.copy(this.origin)
    this.group.name = 'operating-room'

    const hc = this.toRoom(centre)
    this.buildShell()
    this.buildTable()
    this.buildDrape()
    this.buildProps()
    this.scalpMesh = this.buildScalpMesh()
    this.buildMayfield(hc)
    const lamp = this.buildLamp(hc)
    this.hemi = lamp.hemi
    this.spot = lamp.spot
    this.cone = lamp.cone
    this.lampGlow = lamp.glow
    this.screen = lamp.screen

    this.group.traverse((o) => {
      if (o !== this.scalpMesh && (o as T.Mesh).isMesh) noRay(o)
    })
    this.setTheme('dark')
  }

  /** Room frame → scene. */
  toScene(p: T.Vector3) {
    return p.clone().applyMatrix4(this.matrix())
  }
  toRoom(p: T.Vector3) {
    return p.clone().applyMatrix4(this.matrix().invert())
  }
  private matrix() {
    this.group.updateMatrixWorld(true)
    return this.group.matrixWorld.clone()
  }

  private mat(color: string | number, o: Partial<T.MeshStandardMaterialParameters> = {}) {
    const m = new T.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o })
    this.disposables.push(m)
    return m
  }
  private add<G extends T.BufferGeometry>(geo: G, mat: T.Material, pos: [number, number, number], parent: T.Object3D = this.group) {
    const m = new T.Mesh(geo, mat)
    m.position.set(...pos)
    this.disposables.push(geo)
    parent.add(m)
    return m
  }

  private buildShell() {
    const { x, zMin, zMax, ceiling } = ROOM
    const floorY = -TABLE_HEIGHT
    const w = x * 2,
      d = zMax - zMin,
      h = ceiling - floorY
    const floorTex = tileTexture('#8a949b', '#6f787f', 1, 256, 10)
    floorTex.repeat.set(w / 600, d / 600)
    const wallTexA = tileTexture('#9fb4b8', '#8aa0a5', 2, 256, 8)
    const wallTexB = wallTexA.clone()
    wallTexA.repeat.set(d / 600, h / 600)
    wallTexB.repeat.set(w / 600, h / 600)
    this.disposables.push(floorTex, wallTexA, wallTexB)
    const floor = this.mat(0xffffff, { map: floorTex, roughness: 0.32 })
    const wallA = this.mat(0xffffff, { map: wallTexA, roughness: 0.55 })
    const wallB = this.mat(0xffffff, { map: wallTexB, roughness: 0.55 })
    const ceil = this.mat('#cfd6da', { roughness: 0.9 })
    this.walls = [floor, wallA, wallB, ceil]
    const cz = (zMin + zMax) / 2
    const plane = (mat: T.Material, wd: number, ht: number, pos: [number, number, number], rot: [number, number, number]) => {
      const m = this.add(new T.PlaneGeometry(wd, ht), mat, pos)
      m.rotation.set(...rot)
      return m
    }
    plane(floor, w, d, [0, floorY, cz], [-Math.PI / 2, 0, 0])
    plane(ceil, w, d, [0, ceiling, cz], [Math.PI / 2, 0, 0])
    plane(wallA, d, h, [-x, (ceiling + floorY) / 2, cz], [0, Math.PI / 2, 0])
    plane(wallA, d, h, [x, (ceiling + floorY) / 2, cz], [0, -Math.PI / 2, 0])
    plane(wallB, w, h, [0, (ceiling + floorY) / 2, zMin], [0, 0, 0])
    plane(wallB, w, h, [0, (ceiling + floorY) / 2, zMax], [0, Math.PI, 0])
    // Ceiling light panels (they carry the "bright room" look in the light theme).
    const panel = this.mat(0xffffff, { emissive: new T.Color(0xffffff), emissiveIntensity: 0.9 })
    this.walls.push(panel)
    for (const px of [-1300, 1300])
      for (const pz of [-1400, 500, 2400]) {
        const m = this.add(new T.BoxGeometry(1100, 12, 600), panel, [px, ceiling - 6, pz])
        m.name = 'ceiling-panel'
      }
  }

  private buildTable() {
    const steel = this.mat('#b9c1c8', { metalness: 0.7, roughness: 0.38 })
    const pad = this.mat('#2c4a5a', { roughness: 0.7 })
    const L = 1950,
      W = 620
    this.add(new RoundedBoxGeometry(W, 60, L, 3, 22), pad, [0, -30, L / 2])
    this.add(new T.BoxGeometry(W - 40, 56, L - 80), steel, [0, -88, L / 2])
    // Pedestal and base.
    this.add(new T.BoxGeometry(300, TABLE_HEIGHT - 190, 420), steel, [0, -(TABLE_HEIGHT - 190) / 2 - 116, 900])
    this.add(new RoundedBoxGeometry(900, 70, 1200, 3, 20), this.mat('#2b3138', { roughness: 0.5, metalness: 0.4 }), [0, -TABLE_HEIGHT + 35, 900])
    // Side rails with 100 mm marks: the table is also a ruler.
    const rail = this.mat('#d5dade', { metalness: 0.85, roughness: 0.3 })
    for (const s of [-1, 1]) this.add(new T.BoxGeometry(14, 22, L - 120), rail, [s * (W / 2 + 12), -70, L / 2])
    const mark = this.mat('#1d2a33', { roughness: 0.8 })
    for (let z = 100; z < L - 120; z += 100) for (const s of [-1, 1]) this.add(new T.BoxGeometry(2, 1, z % 500 === 0 ? 16 : 8), mark, [s * (W / 2 - 18), 0.6, z])
  }

  /** The body is under a sterile drape: a rounded block from the shoulders to the feet. */
  private buildDrape() {
    const drape = this.mat('#2f8a8c', { roughness: 0.95 })
    const head = this.add(new RoundedBoxGeometry(600, 230, 1500, 4, 80), drape, [0, 105, 80 + 750])
    head.name = 'drape-body'
    // Head-end sheet: the drape folded over the table's head end beneath the Mayfield.
    this.add(new T.BoxGeometry(520, 8, 380), drape, [0, 4, -190])
  }

  private buildProps() {
    const steel = this.mat('#c6cdd3', { metalness: 0.75, roughness: 0.35 })
    const grey = this.mat('#59636b', { roughness: 0.55 })
    // Mayo stand with an instrument tray (beside the surgeon, at the table's right).
    const mx = 820,
      mz = -300
    this.add(new T.CylinderGeometry(16, 16, 700, 16), steel, [mx, -TABLE_HEIGHT + 350, mz])
    this.add(new T.CylinderGeometry(230, 230, 40, 32), grey, [mx, -TABLE_HEIGHT + 20, mz])
    this.add(new T.BoxGeometry(520, 18, 380), steel, [mx, -TABLE_HEIGHT + 720, mz])
    for (let i = 0; i < 6; i++)
      this.add(new T.BoxGeometry(150 + (i % 3) * 20, 7, 12), steel, [mx - 150 + i * 52, -TABLE_HEIGHT + 738, mz - 90 + (i % 2) * 70]).rotation.y = i * 0.13
    // Anaesthesia cart behind the head, with a vitals monitor.
    const cx = -420,
      cz = -1250
    this.add(new RoundedBoxGeometry(700, 900, 560, 3, 24), this.mat('#d8dde0', { roughness: 0.5 }), [cx, -TABLE_HEIGHT + 450, cz])
    this.add(new T.BoxGeometry(660, 10, 520), grey, [cx, -TABLE_HEIGHT + 905, cz])
    this.add(new T.BoxGeometry(430, 300, 40), grey, [cx, -TABLE_HEIGHT + 1090, cz - 100])
    const screenMat = new T.MeshBasicMaterial({ map: monitorTexture(), toneMapped: false })
    this.disposables.push(screenMat, screenMat.map!)
    const scr = this.add(new T.PlaneGeometry(390, 244), screenMat, [cx, -TABLE_HEIGHT + 1090, cz - 79])
    scr.rotation.y = Math.PI
    this.screen = screenMat
    // Instrument table at the foot end.
    this.add(new T.BoxGeometry(1100, 30, 600), steel, [-900, -TABLE_HEIGHT + 800, 2500])
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.add(new T.CylinderGeometry(18, 18, 800, 12), steel, [-900 + sx * 500, -TABLE_HEIGHT + 400, 2500 + sz * 260])
  }

  private buildScalpMesh() {
    const material = new T.MeshPhysicalMaterial({
      color: '#d9a690',
      roughness: 0.6,
      metalness: 0,
      sheen: 0.35,
      sheenColor: new T.Color('#ffd8c8'),
      sheenRoughness: 0.6,
      side: T.FrontSide,
    })
    this.disposables.push(material, this.scalp.geometry)
    const mesh = new T.Mesh(this.scalp.geometry, material)
    mesh.name = 'scalp'
    // The scalp geometry is in scene space already: it sits outside the (rotated) room group.
    return mesh
  }

  /** Mayfield-type skull clamp: three pins (one + two), a half-ring under the head, a post to the table. */
  private buildMayfield(hc: T.Vector3) {
    const steel = this.mat('#aeb6be', { metalness: 0.85, roughness: 0.33 })
    const pinMat = this.mat('#e8ecef', { metalness: 0.9, roughness: 0.2 })
    // Pin sites (scene directions from the head centre): temporo-parietal, above the ear.
    const dirs = [new T.Vector3(1, 0.42, -0.18), new T.Vector3(-1, 0.55, -0.34), new T.Vector3(-1, 0.3, 0.12)]
    const tips = dirs.map((d) => this.toRoom(this.scalp.surfaceAt(d)))
    const reach = 118
    const clampEnds: T.Vector3[] = []
    for (const [i, tip] of tips.entries()) {
      // Radial direction in the room frame (outward), pin tip at the skull (through the scalp).
      const out = tip
        .clone()
        .sub(hc)
        .setY(tip.y - hc.y)
        .normalize()
      const inner = tip.clone().addScaledVector(out, -this.scalp.thickness + 1)
      this.pins.push(inner.clone())
      const quat = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), out)
      const place = (geo: T.BufferGeometry, mat: T.Material, from: number, len: number) => {
        const m = this.add(geo, mat, [0, 0, 0])
        m.quaternion.copy(quat)
        m.position.copy(inner).addScaledVector(out, from + len / 2)
        return m
      }
      place(new T.CylinderGeometry(2.4, 2.4, 34, 10), pinMat, 0, 34)
      place(new T.CylinderGeometry(9, 12, 46, 18), steel, 34, 46)
      clampEnds.push(inner.clone().addScaledVector(out, 80))
      void i
    }
    // Half-ring in the coronal plane through the head centre, under the occiput.
    const pts: T.Vector3[] = []
    for (let a = -100; a <= 100; a += 10) {
      const r = (a * Math.PI) / 180
      // theta measured from straight down (room -y); the ring is ~ 118 mm from the head centre.
      pts.push(new T.Vector3(hc.x + Math.sin(r) * reach, hc.y - Math.cos(r) * (reach - 6), hc.z - 2))
    }
    const ring = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, 6.5, 10, false)
    this.add(ring, steel, [0, 0, 0])
    // Arms: each clamp head is carried to the nearest point of the ring.
    for (const tip of clampEnds) {
      const to = pts.reduce((best, p) => (p.distanceTo(tip) < best.distanceTo(tip) ? p : best), pts[0])
      const arm = this.add(new T.CylinderGeometry(5.5, 5.5, 1, 10), steel, [0, 0, 0])
      arm.position.copy(tip).add(to).multiplyScalar(0.5)
      arm.scale.y = tip.distanceTo(to)
      arm.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), to.clone().sub(tip).normalize())
    }
    // Post from the ring's lowest point to a clamp block at the table's head end.
    const bottom = new T.Vector3(hc.x, hc.y - (reach - 6), hc.z - 2)
    const post = this.add(new T.CylinderGeometry(7, 7, 1, 12), steel, [0, 0, 0])
    const target = new T.Vector3(0, 10, -40)
    post.position.copy(bottom).add(target).multiplyScalar(0.5)
    post.scale.y = bottom.distanceTo(target)
    post.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), target.clone().sub(bottom).normalize())
    this.add(new RoundedBoxGeometry(110, 46, 90, 2, 8), steel, [0, -8, -40])
  }

  private buildLamp(hc: T.Vector3) {
    // Lamp head over the head end, arm to the ceiling; a spot light and a faint visible cone.
    const lampPos = new T.Vector3(hc.x + 120, hc.y + 1050, hc.z + 350)
    const body = this.mat('#dfe4e8', { roughness: 0.4, metalness: 0.3 })
    const glow = this.mat('#fff6e6', { emissive: new T.Color('#fff1d6'), emissiveIntensity: 2.2, roughness: 0.4 })
    const head = this.add(new T.CylinderGeometry(300, 300, 50, 48), body, [lampPos.x, lampPos.y, lampPos.z])
    this.add(new T.CylinderGeometry(260, 260, 8, 48), glow, [lampPos.x, lampPos.y - 27, lampPos.z])
    this.add(new T.CylinderGeometry(18, 18, ROOM.ceiling - lampPos.y, 12), body, [lampPos.x, (ROOM.ceiling + lampPos.y) / 2, lampPos.z])
    void head
    const lampScene = this.toScene(lampPos)
    const targetScene = this.scalp.centre.clone().add(new T.Vector3(0, 10, 18))
    const spot = new T.SpotLight(0xfff0d9, 3.4, 0, 0.2, 0.55, 0)
    spot.position.copy(lampScene)
    spot.target.position.copy(targetScene)
    const hemi = new T.HemisphereLight(0xdde9ee, 0x3a4248, 0.5)
    hemi.position.set(0, 0, 1)
    this.lights.add(spot, spot.target, hemi)
    // The visible cone: additive, a gradient from the lamp to the table.
    const len = lampScene.distanceTo(targetScene) + 80
    const radius = Math.tan(0.2) * len
    const geo = new T.ConeGeometry(radius, len, 40, 1, true)
    this.disposables.push(geo)
    const cm = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      side: T.DoubleSide,
      uniforms: { k: { value: 0.1 } },
      vertexShader:
        'varying float vY; varying vec3 vN; void main(){ vY = position.y; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: `uniform float k; varying float vY; varying vec3 vN;
        void main(){ float t = clamp(0.5 - vY/${len.toFixed(1)}, 0.0, 1.0); float a = k*(1.0-t*0.85)*smoothstep(0.0,0.08,t);
        gl_FragColor = vec4(vec3(1.0,0.93,0.8)*a, a); }`,
    })
    this.disposables.push(cm)
    const cone = new T.Mesh(geo, cm)
    cone.raycast = () => {}
    cone.renderOrder = 6
    const dir = targetScene.clone().sub(lampScene).normalize()
    cone.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), dir)
    cone.position.copy(lampScene).addScaledVector(dir, len / 2)
    this.lights.add(cone)
    return { spot, hemi, cone, glow, screen: this.screen }
  }

  /** Dark theme: a dim room lit by the lamp; light theme: a bright room. */
  setTheme(theme: RoomTheme) {
    this.theme = theme
    const dark = theme === 'dark'
    this.hemi.intensity = dark ? 0.34 : 0.6
    this.spot.intensity = this.lampOn ? (dark ? 3.4 : 1.5) : 0
    ;(this.cone.material as T.ShaderMaterial).uniforms.k.value = this.lampOn ? (dark ? 0.1 : 0.05) : 0
    this.lampGlow.emissiveIntensity = this.lampOn ? 2.2 : 0.05
    for (const m of this.walls) {
      if (m.emissive && m.emissive.getHex() === 0xffffff) m.emissiveIntensity = dark ? 0.5 : 0.9
      else m.color.set(dark ? '#8f9aa0' : '#ffffff')
    }
    this.clearColor = dark ? '#05070a' : '#dfe6ea'
  }
  clearColor = '#05070a'
  /** Scale factor for the scene's image-based lighting while the room is on. */
  get envIntensity() {
    return this.theme === 'dark' ? 0.2 : 0.35
  }

  setLamp(on: boolean) {
    this.lampOn = on
    this.setTheme(this.theme)
  }

  /** The scalp: opaque, a ghost that shows the skull through it, or off. */
  setSkin(skin: Skin) {
    this.skin = skin
    const m = this.scalpMesh.material
    m.transparent = skin === 'ghost'
    m.opacity = skin === 'ghost' ? 0.2 : 1
    m.depthWrite = skin !== 'ghost'
    m.needsUpdate = true
    this.scalpMesh.visible = skin === 'on' || skin === 'ghost'
    this.scalpMesh.renderOrder = skin === 'ghost' ? 4 : 0
  }
  get skinMode() {
    return this.skin
  }

  dispose() {
    for (const d of this.disposables) d.dispose()
    this.group.removeFromParent()
    this.lights.removeFromParent()
    this.scalpMesh.removeFromParent()
  }
}
