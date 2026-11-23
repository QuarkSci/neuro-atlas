import * as T from 'three'
import { useAtlas } from '@/store/useAtlas'
import { activeScene } from '@/scene/sceneRef'
import type { BrainScene } from '@/scene/BrainScene'
import type { SystemId } from '@/data/types'
import { OperatingRoom, type Skin } from './room'
import { SKULL_IDS } from './scalp'
import { useOR, type Measure, type OrCamera } from './useOR'

/** Atlas fields the room overrides while it is on (restored exactly on the way out). */
const FORCED = { explode: 0, peel: 0, isolate: false, cutaway: false, autoRotate: false, sidebar: false } as const
const KEYS = [...Object.keys(FORCED), 'visible']

type CamView = { fullWidth: number; fullHeight: number; offsetX: number; offsetY: number; width: number; height: number }

interface Session {
  scene: BrainScene
  room: OperatingRoom
  atlas: Record<string, unknown>
  cam: {
    pos: T.Vector3
    target: T.Vector3
    fov: number
    up: T.Vector3
    near: number
    far: number
    min: number
    max: number
    polar: [number, number]
    view: CamView | null
  }
  envIntensity: number
  measureGroup: T.Group
  unsub: (() => void)[]
}

let session: Session | null = null
export const orActive = () => !!session
/** The live room (dev checks and the panel's readouts). */
export const activeRoom = () => session?.room ?? null

const UP = new T.Vector3(0, 0, 1)

/** Eye and target of a camera preset, in scene mm. */
export function presetPose(room: OperatingRoom, preset: Exclude<OrCamera, 'free'>) {
  const hcScene = room.scalp.centre
  if (preset === 'surgeon') {
    const hc = room.toRoom(hcScene)
    return { pos: room.toScene(hc.clone().add(new T.Vector3(330, 400, -420))), target: hcScene.clone(), fov: 40 }
  }
  // Microscope: above the right frontal convexity (the Kocher region), looking straight down its normal.
  const site = room.scalp.surfaceAt(new T.Vector3(0.28, 0.88, 0.38))
  const normal = site.clone().sub(hcScene).normalize()
  return { pos: site.clone().addScaledVector(normal, 420), target: site, fov: 9 }
}

export function enterOR(): boolean {
  const scene = activeScene()
  if (!scene || session) return false
  const atlas = useAtlas.getState()
  if (atlas.mode === 'learn' || atlas.sectionId) return false
  const meshes = SKULL_IDS.map((id) => scene.partMesh(id)).filter((m): m is NonNullable<typeof m> => !!m)
  if (meshes.length < 8) return false

  const room = new OperatingRoom(meshes.map((m) => m.geometry))
  const saved: Record<string, unknown> = {}
  for (const k of KEYS) saved[k] = (atlas as unknown as Record<string, unknown>)[k]
  const cam = scene.camera
  const c = scene.controls
  const s: Session = {
    scene,
    room,
    atlas: saved,
    cam: {
      pos: cam.position.clone(),
      target: c.target.clone(),
      fov: cam.fov,
      up: cam.up.clone(),
      near: cam.near,
      far: cam.far,
      min: c.minDistance,
      max: c.maxDistance,
      polar: [c.minPolarAngle, c.maxPolarAngle],
      view: cam.view ? { ...cam.view } : null,
    },
    envIntensity: scene.scene.environmentIntensity,
    measureGroup: new T.Group(),
    unsub: [],
  }
  session = s

  useAtlas.setState({ ...FORCED })
  scene.scene.add(room.group, room.lights, room.scalpMesh, s.measureGroup)
  scene.setOrMode(true)
  scene.setUp(UP)
  cam.clearViewOffset()
  c.minDistance = 40
  c.maxDistance = 2200
  c.minPolarAngle = Math.PI * 0.02
  c.maxPolarAngle = Math.PI * 0.98
  scene.scene.environmentIntensity = room.envIntensity

  const o = useOR.getState()
  room.setSkin(o.skin)
  showLayers(o.skin)
  room.setLamp(o.lamp)
  room.setTheme(atlas.theme)
  scene.scene.environmentIntensity = room.envIntensity
  useOR.setState({ on: true, measures: [], pending: null })
  applyCamera(useOR.getState().camera, false)

  s.unsub.push(
    useOR.subscribe((st, prev) => {
      if (!session) return
      if (st.skin !== prev.skin) {
        room.setSkin(st.skin)
        showLayers(st.skin)
      }
      if (st.lamp !== prev.lamp) room.setLamp(st.lamp)
      if (st.camera !== prev.camera) applyCamera(st.camera, true)
      if (st.measure !== prev.measure && !st.measure) useOR.setState({ pending: null })
      if (st.measures !== prev.measures || st.pending !== prev.pending) drawMeasures()
      scene.scene.environmentIntensity = room.envIntensity
      scene.redraw()
    }),
    useAtlas.subscribe((st, prev) => {
      if (st.theme !== prev.theme) {
        room.setTheme(st.theme)
        scene.scene.environmentIntensity = room.envIntensity
        scene.redraw()
      }
      // The room needs the plain assembled head: anything that rearranges it ends the visit instead of fighting it.
      if (st.mode === 'learn' || st.sectionId) exitOR()
    }),
  )
  scene.tapOverride = (x, y) => {
    if (!useOR.getState().measure) return false
    const hit = scene.pickPoint(x, y, [room.scalpMesh])
    if (hit) addPoint(hit.point.toArray() as [number, number, number])
    return true
  }
  scene.redraw()
  return true
}

export function exitOR() {
  const s = session
  if (!s) return
  session = null
  for (const u of s.unsub) u()
  const { scene, cam: k } = s
  scene.tapOverride = null
  s.measureGroup.removeFromParent()
  disposeGroup(s.measureGroup)
  s.room.dispose()
  scene.setOrMode(false, { explode: (s.atlas.explode as number) ?? 0, peel: (s.atlas.peel as number) ?? 0 })
  scene.setUp(k.up)
  const camera = scene.camera
  camera.near = k.near
  camera.far = k.far
  if (k.view) camera.setViewOffset(k.view.fullWidth, k.view.fullHeight, k.view.offsetX, k.view.offsetY, k.view.width, k.view.height)
  scene.controls.minDistance = k.min
  scene.controls.maxDistance = k.max
  scene.controls.minPolarAngle = k.polar[0]
  scene.controls.maxPolarAngle = k.polar[1]
  scene.scene.environmentIntensity = s.envIntensity
  scene.flyCamera(k.pos, k.target, { fov: k.fov, animate: false })
  useAtlas.setState(s.atlas)
  useOR.setState({ on: false, measure: false, measures: [], pending: null })
  scene.redraw()
}

/** The skull is an atlas system (hidden by default): shown under a ghost scalp and for the bone layer, hidden for the brain layer. */
function showLayers(skin: Skin) {
  const s = session
  if (!s) return
  const base = (s.atlas.visible as SystemId[]) ?? []
  const rest = base.filter((id) => id !== 'skull')
  useAtlas.setState({ visible: skin === 'ghost' || skin === 'bone' ? [...rest, 'skull'] : rest })
}

export const toggleOR = () => (session ? (exitOR(), true) : enterOR())

export function applyCamera(preset: OrCamera, animate: boolean) {
  const s = session
  if (!s || preset === 'free') return
  const p = presetPose(s.room, preset)
  s.scene.flyCamera(p.pos, p.target, { fov: p.fov, animate })
}

// ── Ruler ────────────────────────────────────────────────────────────

let seq = 0
function addPoint(p: [number, number, number]) {
  const st = useOR.getState()
  if (!st.pending) {
    useOR.setState({ pending: p })
    return
  }
  const mm = new T.Vector3(...st.pending).distanceTo(new T.Vector3(...p))
  const m: Measure = { id: ++seq, a: st.pending, b: p, mm }
  useOR.setState({ measures: [...st.measures, m], pending: null })
}

/** Atlas scene mm → MNI mm (scene = (−x, z, y)). */
export const sceneToMni = (p: [number, number, number]): [number, number, number] => [-p[0], p[2], p[1]]

function labelSprite(text: string) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(20,24,30,0.82)'
  g.beginPath()
  g.roundRect(4, 8, 248, 48, 24)
  g.fill()
  g.font = '600 30px -apple-system, system-ui, sans-serif'
  g.fillStyle = '#ffd24d'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 128, 33)
  const tex = new T.CanvasTexture(c)
  tex.colorSpace = T.SRGBColorSpace
  const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }))
  sp.scale.set(0.16, 0.04, 1)
  sp.renderOrder = 20
  sp.raycast = () => {}
  return sp
}

function disposeGroup(g: T.Group) {
  for (const o of [...g.children]) {
    g.remove(o)
    const m = o as T.Mesh
    m.geometry?.dispose?.()
    const mat = m.material as T.Material & { map?: T.Texture }
    mat?.map?.dispose?.()
    mat?.dispose?.()
  }
}

function drawMeasures() {
  const s = session
  if (!s) return
  disposeGroup(s.measureGroup)
  const { measures, pending } = useOR.getState()
  const pts: number[] = []
  for (const m of measures) pts.push(...m.a, ...m.b)
  if (pending) pts.push(...pending)
  if (pts.length) {
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(pts, 3))
    const pm = new T.Points(g, new T.PointsMaterial({ color: 0xffc233, size: 11, sizeAttenuation: false, depthTest: false, transparent: true }))
    pm.renderOrder = 19
    pm.raycast = () => {}
    s.measureGroup.add(pm)
  }
  for (const m of measures) {
    const g = new T.BufferGeometry().setFromPoints([new T.Vector3(...m.a), new T.Vector3(...m.b)])
    const line = new T.Line(g, new T.LineBasicMaterial({ color: 0xffc233, depthTest: false, transparent: true }))
    line.renderOrder = 18
    line.raycast = () => {}
    s.measureGroup.add(line)
    const sp = labelSprite(`${m.mm.toFixed(1)} mm`)
    sp.position.copy(new T.Vector3(...m.a).lerp(new T.Vector3(...m.b), 0.5))
    s.measureGroup.add(sp)
  }
}

/** CSV of the measurements: scene-independent MNI endpoints and the distance. */
export function measuresCsv(measures: Measure[]) {
  const rows = ['n,ax_mni,ay_mni,az_mni,bx_mni,by_mni,bz_mni,distance_mm']
  measures.forEach((m, i) => rows.push([i + 1, ...sceneToMni(m.a), ...sceneToMni(m.b), m.mm].map((v) => (typeof v === 'number' ? +v.toFixed(2) : v)).join(',')))
  return rows.join('\n')
}

if (import.meta.env.DEV) (window as unknown as { __orMode: unknown }).__orMode = { enterOR, exitOR, toggleOR, applyCamera, activeRoom }
