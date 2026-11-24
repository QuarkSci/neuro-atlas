import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'
import type { LayerId, Part, SystemId } from '@/data/types'
import { DEPTH_LEVELS, coveredIds, depthOf } from '@/data'
import type { ClipAxis, ClipState, View } from '@/store/useAtlas'
import { inventoryLayout, separationVector } from './explode'
import { createGround } from './ground'
import type { LoadedGeometry } from './loader'
import { applyColorMode, createPartMaterial, tint, type ColorMode, type PartMaterial } from './materials'
import { PointerTap } from './PointerTap'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { SECTIONS, scenePlane, type Section } from '@/data/sections'
import { buildCap } from './caps'
import { chainLoops, decimate, planeBasis, sliceSegments, smoothLoop, unionOutline } from './slice'
import type { Mode } from '@/store/useAtlas'
import type { LessonStage, Mni } from '@/data/lessons'

// Hover picking runs a raycast against every visible mesh each frame the
// pointer moves; with hundreds of 5–40k-triangle meshes that is only smooth
// through a BVH per geometry.
T.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
T.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
T.Mesh.prototype.raycast = acceleratedRaycast

export interface SceneSnapshot {
  visible: SystemId[]
  layers: LayerId[]
  selected: string[]
  isolate: boolean
  explode: number
  /** 0 = every shell shown, 1 = only the innermost (see data DEPTH_LEVELS). */
  peel: number
  view: View
  autoRotate: boolean
  cutaway: boolean
  clip: Record<ClipAxis, ClipState>
  mode: Mode
  sectionCut: string | null
  /** Viewer open: markers stay but the scene behind is idle. */
  sectionId: string | null
  resetTick: number
  inspectorOpen: boolean
  hovered: string | null
  /** Guided lesson step on stage (lessons mode), already resolved to mesh ids. */
  lesson: LessonStage | null
  /** Structure the student last tapped in a lesson — highlighted like a selection. */
  lessonPick: string | null
  /** Plates of the open topic: only their level markers are drawn (null = all). */
  topicSections: string[] | null
  /** UI theme: sets the backdrop and ambient light. */
  theme: 'dark' | 'light'
  /** Fresh-tissue look or the didactic atlas palette (see materials.ts). */
  colorMode: ColorMode
  /** Screen-space ambient occlusion on (still frames of the assembled model only). */
  ao: boolean
}

export interface SceneCallbacks {
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onError: (message: string) => void
  /** A cross-section level marker was pressed. */
  onSection: (id: string) => void
}

/** One cross-section level drawn on the model: its outline and the badge that opens it. */
interface Marker {
  section: Section
  line: LineSegments2 | null
  material: LineMaterial
  pill: HTMLButtonElement
  /** Centre of the outline, scene space (sorts the badge column). */
  anchor: T.Vector3
  /** Outline points (scene space) the leader line may attach to. */
  ring: T.Vector3[]
  lead: SVGPolylineElement
  /** Its badge is under the pointer: the ring is drawn bright and thick. */
  hot: boolean
}

interface PartEntry {
  part: Part
  id: string
  system: SystemId
  layer: LayerId
  mesh: T.Mesh<T.BufferGeometry, PartMaterial>
  /** Assembled-position bounds, never mutated. */
  bounds: T.Box3
  centre: T.Vector3
  /** Full-separation displacement (first half of the slider). */
  separation: T.Vector3
  /** Inventory displacement (second half), recomputed per layout. */
  inventory: T.Vector3
  /** Inventory cell width in millimetres, for label fitting. */
  cellWidth: number
  /** Compact shell index, 0 = outermost; the peel slider fades shells out in this order. */
  depth: number
  /** Current peel opacity, 1 = fully shown. */
  peelAmount: number
  selectedAmount: number
  hoverAmount: number
  label: HTMLDivElement
  /** Lesson opacity: 1 on stage, a ghost for context, 0 off stage. */
  lessonAmount: number
  /** The atlas colour, kept while a lesson repaints the part in a teaching colour. */
  atlasBase: T.Color | null
}

/** One lesson label: a name pill in a side column, a leader to its anchor point. */
interface LessonLabelEl {
  el: HTMLDivElement
  line: SVGPolylineElement
  dot: SVGCircleElement
  anchor: T.Vector3
}

/** Context structures fade to this: enough to read where you are, faint enough not to hide the stage. */
const GHOST_OPACITY = 0.07
const GHOST_COLOR = new T.Color('#7d8ba3')
const mniToScene = ([x, y, z]: Mni) => new T.Vector3(-x, z, y)

interface Insets {
  top: number
  bottom: number
  left: number
  right: number
}

/** The atlas renders dark only. */
/** Backdrop and ambient light per UI theme: a dark studio, or a bright neutral room. */
const THEMES = {
  dark: { clear: '#0b0e14', ground: '#151a22', hemiSky: 0xbfcbe0, hemiGround: 0x1a1d24, ambient: 1 },
  light: { clear: '#e9edf3', ground: '#f6f8fb', hemiSky: 0xffffff, hemiGround: 0xaeb4c0, ambient: 1.12 },
} as const
const THEME = THEMES.dark

/**
 * Light rig per colour mode. `atlas` is flat and bright so every hue reads;
 * `real` is a single warm operating-light key with deeper falloff, and a
 * tone curve that keeps tissue colours true instead of bleaching them.
 */
const RIGS: Record<ColorMode, { tone: T.ToneMapping; exposure: number; hemi: number; key: number; rim: number; fill: number }> = {
  atlas: { tone: T.ACESFilmicToneMapping, exposure: 1.05, hemi: 0.8, key: 2.0, rim: 1.4, fill: 0.5 },
  real: { tone: T.NeutralToneMapping, exposure: 0.8, hemi: 0.1, key: 2.1, rim: 0.85, fill: 0.1 },
}

/** Systems whose extent defines the model for camera framing. */
const BRAIN_SYSTEMS = new Set<SystemId>(['telencephalon', 'basal-ganglia', 'diencephalon', 'brainstem', 'cerebellum', 'ventricles', 'white-matter'])

/** Slider fraction where separation ends and the inventory grid begins. */
const SPLIT = 0.5

/**
 * Owns the WebGL renderer, camera and every structure mesh. React drives it
 * through `setState`; the scene renders only when something changed.
 * Coordinates are scene millimetres (MNI rotated Y-up, see loader.ts).
 */
export class BrainScene {
  renderer: T.WebGLRenderer
  scene = new T.Scene()
  camera: T.PerspectiveCamera
  controls: OrbitControls
  private host: HTMLElement
  private cb: SceneCallbacks
  private parts: PartEntry[] = []
  private byId = new Map<string, PartEntry>()
  private raycaster = new T.Raycaster()
  private tap = new PointerTap()
  private timer = new T.Timer()
  private frame = 0
  private dirty = true
  /** Extra frames rendered after the last change so compositors always get a settled image. */
  private settle = 0

  /**
   * Render for a short stretch rather than a single frame. The drawing
   * buffer is not preserved, so a lone frame drawn before the page's first
   * real paint — or while the tab was hidden — is simply discarded, and the
   * canvas shows empty until something happens to touch it again. A brief
   * warm-up survives that.
   */
  private warmUp(frames = 24) {
    this.settle = Math.max(this.settle, frames)
    this.dirty = true
  }
  private disposed = false
  private state: SceneSnapshot | null = null
  private last: SceneSnapshot | null = null
  private pendingHover: { x: number; y: number } | null = null
  private hoveredId: string | null = null
  private observer: ResizeObserver
  private ground: T.Mesh
  private hemi: T.HemisphereLight
  private keyLight!: T.DirectionalLight
  private rimLight!: T.DirectionalLight
  private fillLight!: T.DirectionalLight
  private env: T.Texture
  private fly: { pos: T.Vector3; target: T.Vector3; t: number; fov?: { from: number; to: number } } | null = null
  private isolateKey = ''
  private layoutKey = ''
  private selectionKey = ''
  /**
   * Sagittal (x), coronal (y) and axial (z) cross-section planes — always a
   * 3-element array so material.clippingPlanes never has to be reassigned;
   * a disabled plane is just pushed far away (huge constant) so it never
   * clips anything, which is cheaper than toggling arrays on every material.
   */
  private clipPlanes: [T.Plane, T.Plane, T.Plane, T.Plane] = [
    new T.Plane(new T.Vector3(1, 0, 0), 1e5),
    new T.Plane(new T.Vector3(0, 0, 1), 1e5),
    new T.Plane(new T.Vector3(0, 1, 0), 1e5),
    // Fourth: the oblique plane of a textbook cross-section (sections mode).
    new T.Plane(new T.Vector3(0, 1, 0), 1e5),
  ]
  private markers: Marker[] = []
  private markerLayer: HTMLDivElement
  private markersBuilt = false
  private leaders: SVGSVGElement | null = null
  private markerInsets: Insets | null = null
  private cutKey = ''
  /** Filled cut faces (caps.ts): rebuilt once the planes and the visible parts have stopped changing. */
  private capsGroup: T.Group | null = null
  private capsKey = ''
  private capsAt = 0
  private capsBuilt = true
  private capsVis = 0
  private clipIndicators: T.Group[] = []
  private labelLayer: HTMLDivElement
  /** Assembled bounds of the whole model. */
  private modelBox = new T.Box3()
  private modelCentre = new T.Vector3()
  private modelRadius = 100
  private seed = 0
  /** Screen-space AO: built on first use (its code is a separate chunk), skipped while the camera moves. */
  private aoPipe: {
    pass: import('three/examples/jsm/postprocessing/GTAOPass.js').GTAOPass
    quad: import('three/examples/jsm/postprocessing/Pass.js').FullScreenQuad
    mat: T.ShaderMaterial
  } | null = null
  private aoLoading = false
  private aoKey = ''
  private interacting = false
  private aoTimer = 0
  /** Smoothed explode amount that chases the store value. */
  private amount = 0
  private lastFitAmount = -1
  private framedOnce = false
  /** Smoothed peel depth that chases the store value. */
  private peel = 0
  private lastFitPeel = 0
  // ── Lessons ──
  private lessonActive = false
  private lessonKey = ''
  private lessonFramedKey = ''
  private lessonFocus = new Map<string, string | undefined>()
  private lessonContext = new Set<string>()
  private lessonLayer: HTMLDivElement
  private lessonSvg: SVGSVGElement
  private lessonLabels: LessonLabelEl[] = []
  /** Lesson flows; `end` is where a cut stream stops (1 = runs the whole course). */
  private flows: { group: T.Group; curve: T.CatmullRomCurve3; dots: T.Mesh[]; lines: LineSegments2[]; loop: boolean; t: number; period: number; end: number }[] = []
  private lesionMarks: { group: T.Group; halo: T.Mesh; t: number }[] = []

  constructor(host: HTMLElement, geometries: LoadedGeometry[], cb: SceneCallbacks) {
    this.host = host
    this.cb = cb
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    const r = this.renderer
    r.setPixelRatio(Math.min(devicePixelRatio, host.clientWidth < 768 ? 1.5 : 2))
    r.outputColorSpace = T.SRGBColorSpace
    r.toneMapping = T.ACESFilmicToneMapping
    r.toneMappingExposure = 1.05
    r.localClippingEnabled = true
    r.domElement.setAttribute('aria-label', 'Interactive brain. Drag to orbit, scroll to zoom, tap a structure to inspect it.')
    host.appendChild(r.domElement)

    this.labelLayer = document.createElement('div')
    this.labelLayer.className = 'part-labels'
    host.appendChild(this.labelLayer)
    this.markerLayer = document.createElement('div')
    this.markerLayer.className = 'section-markers'
    host.appendChild(this.markerLayer)
    this.lessonLayer = document.createElement('div')
    this.lessonLayer.className = 'lesson-labels'
    this.lessonSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.lessonSvg.classList.add('lesson-leaders')
    this.lessonLayer.appendChild(this.lessonSvg)
    host.appendChild(this.lessonLayer)

    // Bounds first: lights, ground, camera and the clip indicator are all
    // sized from them. Only the brain proper counts — the skull, dura and
    // vessels reach far outside it (the jugular runs to the neck) and would
    // push the camera back until the brain is a thumbnail.
    for (const g of geometries) if (BRAIN_SYSTEMS.has(g.part.system)) this.modelBox.union(g.geometry.boundingBox!)
    if (this.modelBox.isEmpty()) for (const g of geometries) this.modelBox.union(g.geometry.boundingBox!)
    this.modelBox.getCenter(this.modelCentre)
    this.modelRadius = this.modelBox.getSize(new T.Vector3()).length() / 2

    this.camera = new T.PerspectiveCamera(30, 1, 1, 6000)
    this.controls = new OrbitControls(this.camera, r.domElement)
    const c = this.controls
    c.enableDamping = true
    c.dampingFactor = 0.08
    c.minDistance = 20
    c.maxDistance = 3000
    // Keep a small margin off both poles: near vertical, azimuth becomes
    // ill-defined and OrbitControls can snap or spin unpredictably.
    c.minPolarAngle = Math.PI * 0.04
    c.maxPolarAngle = Math.PI * 0.94
    // Disabled while isolating a part (see the frame loop): cursor-relative
    // zoom does not account for the camera's view offset there and can
    // fling the framed part off-screen.
    c.zoomToCursor = true
    c.target.copy(this.modelCentre)
    this.camera.position.copy(this.modelCentre).add(new T.Vector3(300, 150, 350))
    c.addEventListener('change', () => (this.dirty = true))
    c.addEventListener('start', () => {
      this.fly = null
      this.interacting = true
    })
    // While the camera moves frames are plain; the occlusion pass joins once it has rested.
    c.addEventListener('end', () => {
      window.clearTimeout(this.aoTimer)
      window.clearTimeout(this.eyeRestTimer)
      this.aoTimer = window.setTimeout(() => {
        this.interacting = false
        this.dirty = true
      }, 220)
    })

    // Image-based lighting from a neutral studio, plus key, rim and fill lights.
    const pmrem = new T.PMREMGenerator(r)
    const room = new RoomEnvironment()
    this.env = pmrem.fromScene(room, 0.04).texture
    this.scene.environment = this.env
    room.dispose()
    pmrem.dispose()

    this.hemi = new T.HemisphereLight(THEME.hemiSky, THEME.hemiGround, 0.8)
    this.scene.add(this.hemi)
    const key = new T.DirectionalLight(0xfff7ee, 2.0)
    key.position.set(-300, 500, 400)
    this.scene.add(key)
    const rim = new T.DirectionalLight(0xdde8ff, 1.4)
    rim.position.set(400, 200, -500)
    this.scene.add(rim)
    const fill = new T.DirectionalLight(0xffffff, 0.5)
    fill.position.set(0, -200, 300)
    this.scene.add(fill)
    this.keyLight = key
    this.rimLight = rim
    this.fillLight = fill

    // A gradient floor well below the brain gives the orbit a horizon without
    // reading as a table the brain sits on.
    this.ground = createGround(THEME.ground, THEME.clear, this.modelRadius * 12)
    this.ground.position.y = this.modelBox.min.y - this.modelRadius * 0.9
    this.ground.position.x = this.modelCentre.x
    this.ground.position.z = this.modelCentre.z
    this.scene.add(this.ground)

    this.addGeometries(geometries)

    this.clipIndicators = (['sagittal', 'coronal', 'axial'] as ClipAxis[]).map((axis) => this.makeClipIndicator(axis))
    for (const g of this.clipIndicators) this.scene.add(g)

    this.renderer.setClearColor(THEME.clear)
    this.warmUp()

    document.addEventListener('visibilitychange', this.onVisible)
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(host)
    this.resize()

    const el = r.domElement
    el.addEventListener('pointerdown', this.onDown)
    el.addEventListener('pointermove', this.onMove)
    el.addEventListener('pointerup', this.onUp)
    el.addEventListener('pointercancel', this.onCancel)
    el.addEventListener('pointerleave', this.onLeave)
    el.addEventListener('webglcontextlost', this.onContextLost)
    // Attached to the host (the canvas's parent), not the canvas itself:
    // OrbitControls' own wheel listener lives on the canvas, and a listener
    // on the same target fires in registration order regardless of the
    // capture flag. A true ancestor genuinely sees the event first during
    // the capture phase, letting us stop it before OrbitControls ever does.
    this.host.addEventListener('wheel', this.onWheel, {
      capture: true,
      passive: false,
    })

    this.animate()
  }

  // ── Public API ──────────────────────────────────────────────────────

  /**
   * Add structure meshes to the scene. Layers load on demand (a parcellation
   * is only fetched when it is switched on), so this runs once at start-up
   * with the gross anatomy and again for each layer that is opened later.
   */
  addGeometries(geometries: LoadedGeometry[]) {
    for (const { part, geometry } of geometries) {
      if (this.byId.has(part.id)) continue
      geometry.computeBoundsTree()
      const material = createPartMaterial(part.system, part.layer, this.seed++, part.id)
      material.clippingPlanes = this.clipPlanes
      const mesh = new T.Mesh(geometry, material)
      mesh.name = part.id
      // A back-facing child sharing the same geometry: invisible normally
      // (front and back faces coincide), it only becomes visible where the
      // clip plane has sliced the shell open.
      // Coloured per structure (flat, unlit) so a cut reads like a stained
      // atlas section: each nucleus/tract face keeps its own colour.
      const cap = new T.Mesh(
        geometry,
        new T.MeshBasicMaterial({
          color: material.userData.base.clone().multiplyScalar(0.82),
          side: T.BackSide,
          clippingPlanes: this.clipPlanes,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          polygonOffsetUnits: -4,
        }),
      )
      cap.raycast = () => {}
      mesh.add(cap)
      const bounds = geometry.boundingBox!.clone()
      const centre = bounds.getCenter(new T.Vector3())
      const label = document.createElement('div')
      label.className = 'part-label'
      label.hidden = true
      this.labelLayer.appendChild(label)
      const entry: PartEntry = {
        part,
        id: part.id,
        system: part.system,
        layer: part.layer,
        mesh,
        bounds,
        centre,
        separation: separationVector(centre, this.modelCentre),
        inventory: new T.Vector3(),
        cellWidth: 0,
        depth: depthOf(part.id),
        peelAmount: 1,
        selectedAmount: 0,
        hoverAmount: 0,
        label,
        lessonAmount: 0,
        atlasBase: null,
      }
      this.parts.push(entry)
      this.byId.set(part.id, entry)
      this.scene.add(mesh)
    }
    // Force the visibility / layout pass to run again for the new meshes,
    // and re-stage the running lesson so they get its colours.
    this.last = null
    this.lessonKey = ''
    this.layoutKey = ''
    this.dirty = true
    this.warmUp()
  }

  /** Names for newly added parts; existing labels are left alone. */
  setLabelsFor(names: Record<string, string>) {
    for (const p of this.parts) if (names[p.id] !== undefined) p.label.textContent = names[p.id]
  }

  setState(state: SceneSnapshot) {
    this.state = state
    this.dirty = true
  }

  /** Structure names for the inventory labels, in the active language. */
  setLabels(names: Record<string, string>) {
    for (const p of this.parts) p.label.textContent = names[p.id] ?? p.id
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    window.clearTimeout(this.aoTimer)
    if (this.aoPipe) {
      this.aoPipe.pass.dispose()
      this.aoPipe.quad.dispose()
      this.aoPipe.mat.dispose()
    }
    this.observer.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this.onDown)
    el.removeEventListener('pointermove', this.onMove)
    el.removeEventListener('pointerup', this.onUp)
    el.removeEventListener('pointercancel', this.onCancel)
    el.removeEventListener('pointerleave', this.onLeave)
    el.removeEventListener('webglcontextlost', this.onContextLost)
    this.host.removeEventListener('wheel', this.onWheel, { capture: true })
    document.removeEventListener('visibilitychange', this.onVisible)
    this.controls.dispose()
    this.scene.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.LineSegments) {
        o.geometry.disposeBoundsTree?.()
        o.geometry.dispose()
        const ms = Array.isArray(o.material) ? o.material : [o.material]
        ms.forEach((m) => m.dispose())
      }
    })
    this.env.dispose()
    this.renderer.dispose()
    this.labelLayer.remove()
    this.markerLayer.remove()
    this.lessonLayer.remove()
    el.remove()
  }

  /**
   * Points a clip plane (and its indicator quad) at the store's mm value
   * for one axis, in scene space (the loader bakes MNI (RAS) → scene
   * (−x, z, y) into every mesh, so sagittal follows scene x, coronal scene
   * z, axial scene y). `flip` swaps which half is kept; the same
   * `constant = flip ? mm : -mm` works for all three because the normal's
   * sign flips with it.
   */
  private updateClipPlane(axis: ClipAxis, index: 0 | 1 | 2, s: SceneSnapshot) {
    const c = s.clip[axis]
    const plane = this.clipPlanes[index]
    const indicator = this.clipIndicators[index]
    if (!s.cutaway || !c.enabled) {
      plane.constant = 1e5
      return
    }
    const mm = c.mm
    plane.constant = c.flip ? mm : -mm
    if (axis === 'axial') {
      plane.normal.set(0, c.flip ? -1 : 1, 0)
      indicator.position.set(this.modelCentre.x, mm, this.modelCentre.z)
    } else if (axis === 'coronal') {
      plane.normal.set(0, 0, c.flip ? -1 : 1)
      indicator.position.set(this.modelCentre.x, this.modelCentre.y, mm)
    } else {
      plane.normal.set(c.flip ? 1 : -1, 0, 0)
      indicator.position.set(-mm, this.modelCentre.y, this.modelCentre.z)
    }
  }

  // ── Cut faces ───────────────────────────────────────────────────────

  private clearCaps() {
    if (!this.capsGroup) return
    this.scene.remove(this.capsGroup)
    this.capsGroup.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose()
        ;(o.material as T.Material).dispose()
      }
    })
    this.capsGroup = null
  }

  private updateCaps(s: SceneSnapshot, visibilityChanged: boolean) {
    const active = [0, 1, 2, 3].filter((i) => this.clipPlanes[i].constant < 1e4)
    const want = active.length > 0 && !s.lesson && this.amount < 0.02 && this.peel < 0.005
    if (visibilityChanged) this.capsVis++
    const key = want
      ? active
          .map((i) => {
            const p = this.clipPlanes[i]
            return `${i}:${p.normal.x.toFixed(3)},${p.normal.y.toFixed(3)},${p.normal.z.toFixed(3)},${p.constant.toFixed(2)}`
          })
          .join('|') + `#${this.capsVis}`
      : ''
    if (key !== this.capsKey) {
      this.capsKey = key
      this.capsAt = performance.now()
      this.capsBuilt = false
      // Faces built for the old planes would hang in the air: hide them until the new ones are ready.
      if (this.capsGroup) this.capsGroup.visible = false
      this.dirty = true
    }
    if (this.capsBuilt) return
    if (!want) {
      this.clearCaps()
      this.capsBuilt = true
      this.dirty = true
      return
    }
    // Wait for a slider to settle, then build (slicing every crossed part takes a moment).
    if (performance.now() - this.capsAt < 130) {
      this.dirty = true
      return
    }
    this.clearCaps()
    const group = new T.Group()
    for (const k of active) {
      const plane = this.clipPlanes[k]
      const parts = this.parts
        .filter((p) => p.mesh.visible && plane.intersectsBox(p.bounds))
        .map((p) => ({ geometry: p.mesh.geometry, colour: (p.mesh.material.userData.base as T.Color).clone().multiplyScalar(0.92) }))
      const geometry = buildCap(parts, plane)
      if (!geometry) continue
      const material = new T.MeshBasicMaterial({
        vertexColors: true,
        side: T.DoubleSide,
        // Always passes yet still writes depth: the faces cover what lies behind the plane, in the order they were built (big sections first).
        depthFunc: T.AlwaysDepth,
        clippingPlanes: this.clipPlanes.filter((_, j) => j !== k),
        // A hair behind the plane, so the section outline drawn on it stays in front.
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 4,
      })
      const mesh = new T.Mesh(geometry, material)
      mesh.renderOrder = -10
      mesh.frustumCulled = false
      mesh.raycast = () => {}
      group.add(mesh)
    }
    this.scene.add(group)
    this.capsGroup = group
    this.capsBuilt = true
    this.dirty = true
  }

  // ── Setup helpers ───────────────────────────────────────────────────

  /**
   * A faint quad marking one clip plane, plus a bright edge — the plane
   * itself has no visible thickness, so without this the "missing" part
   * would give no sense of where the cut actually is. A PlaneGeometry's
   * default normal is +Z (coronal, no rotation needed); sagittal and axial
   * rotate it onto +X / +Y respectively. Position and sign are set per
   * frame from the store's mm value, not baked in here.
   */
  private makeClipIndicator(axis: ClipAxis) {
    const group = new T.Group()
    const size = this.modelRadius * 2.3
    const color = axis === 'sagittal' ? 0x0088ff : axis === 'coronal' ? 0x22c07a : 0xf0a030
    const fill = new T.Mesh(
      new T.PlaneGeometry(size, size),
      new T.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.05,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    )
    group.add(fill)
    const edges = new T.EdgesGeometry(new T.PlaneGeometry(size, size))
    const line = new T.LineSegments(edges, new T.LineBasicMaterial({ color, transparent: true, opacity: 0.35 }))
    group.add(line)
    if (axis === 'sagittal') group.rotation.y = Math.PI / 2
    else if (axis === 'axial') group.rotation.x = Math.PI / 2
    group.visible = false
    group.renderOrder = 5
    return group
  }

  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    if (!w || !h) return
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, w < 768 || h < 600 ? 1.5 : 2))
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.aoPipe?.pass.setSize(w, h)
    for (const m of this.markers) m.material.resolution.set(w, h)
    for (const f of this.flows) for (const l of f.lines) (l.material as LineMaterial).resolution.set(w, h)
    this.markerInsets = null
    this.layoutKey = ''
    this.isolateKey = ''
    this.lastFitAmount = -1
    if (this.state) this.frameFor(this.state, false)
    this.warmUp()
  }

  // ── Camera ──────────────────────────────────────────────────────────

  private viewDirection(view: View) {
    switch (view) {
      case 'front':
        return new T.Vector3(0, 0.06, 1).normalize()
      case 'lateral':
        // From the subject's left (scene +X), the textbook lateral view.
        return new T.Vector3(1, 0.06, 0).normalize()
      case 'top':
        return new T.Vector3(0.02, 1, 0.14).normalize()
      default:
        return new T.Vector3(0.75, 0.32, 0.6).normalize()
    }
  }

  private isMobile() {
    return this.host.clientWidth < 768
  }

  /**
   * Screen areas covered by UI chrome, in CSS pixels. Measured from the real
   * DOM (siblings of the canvas in `.studio`) rather than guessed, so the
   * isolated-part camera always leaves clear space next to whatever panels
   * actually happen to be open, at any window size.
   */
  private insets(): Insets {
    const mobile = this.isMobile()
    const hostRect = this.host.getBoundingClientRect()
    const gap = 20
    const base: Insets = mobile ? { top: 88, bottom: 84, left: 16, right: 16 } : { top: 88, bottom: 96, left: 24, right: 24 }
    const root = this.host.parentElement
    const overlapsV = (r: DOMRect) => r.bottom > hostRect.top && r.top < hostRect.bottom
    const overlapsH = (r: DOMRect) => r.right > hostRect.left && r.left < hostRect.right
    const grow = (key: keyof Insets, value: number) => {
      base[key] = Math.max(base[key], value)
    }
    if (root) {
      for (const el of [root.querySelector('.identity'), root.querySelector('.tab-bar'), root.querySelector('.view-group')]) {
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || !overlapsH(r)) continue
        // On a phone the tab bar sits at the bottom edge instead.
        if (r.top > hostRect.top + hostRect.height / 2) grow('bottom', hostRect.bottom - r.top + 16)
        else grow('top', r.bottom - hostRect.top + 16)
      }
      const dock = root.querySelector('.bottom-dock')
      if (dock) {
        const r = dock.getBoundingClientRect()
        if (r.width > 0) grow('bottom', hostRect.bottom - r.top + 16)
      }
      if (mobile) {
        // Panels are bottom sheets or a top strip on narrow screens.
        const inspector = root.querySelector('.inspector.open')
        const systems = root.querySelector('.sidebar.open')
        const search = root.querySelector('.search-panel')
        const lesson = root.querySelector('.lesson-panel')
        for (const el of [inspector, systems, lesson]) {
          if (!el) continue
          const r = (el as HTMLElement).getBoundingClientRect()
          if (r.width > 0 && overlapsH(r)) grow('bottom', hostRect.bottom - r.top + gap)
        }
        if (search) {
          const r = (search as HTMLElement).getBoundingClientRect()
          if (r.width > 0) grow('top', r.bottom - hostRect.top + gap)
        }
      } else {
        const systems = root.querySelector('.sidebar.open')
        if (systems) {
          const r = systems.getBoundingClientRect()
          if (r.width > 0 && overlapsV(r)) grow('left', r.right - hostRect.left + gap)
        }
        for (const el of [root.querySelector('.inspector.open'), root.querySelector('.lesson-panel')]) {
          if (!el) continue
          const r = (el as HTMLElement).getBoundingClientRect()
          if (r.width > 0 && overlapsV(r)) grow('right', hostRect.right - r.left + gap)
        }
      }
    }
    return base
  }

  /** World-space centre of the selected parts, with explode offsets applied. */
  private selectionCentre(selected: string[]) {
    const ids = new Set(selected)
    const box = new T.Box3()
    for (const p of this.parts) if (p.mesh.visible && ids.has(p.id)) box.union(p.bounds.clone().translate(p.mesh.position))
    return box.isEmpty() ? null : box.getCenter(new T.Vector3())
  }

  /**
   * Move the orbit pivot onto `centre` and carry the camera the same way, so
   * the view neither swings nor changes distance — the point simply settles
   * where the camera was already looking. Orbiting then turns around it.
   */
  private pivotTo(centre: T.Vector3, animate: boolean) {
    const delta = centre.clone().sub(this.controls.target)
    if (delta.lengthSq() < 1e-6) return
    this.goTo(this.camera.position.clone().add(delta), centre, animate)
  }

  /**
   * Aim the camera so `box` fills the region left free by `insets`. Framed
   * by bounding sphere rather than per-axis extents so it holds for any view
   * direction, including the near-vertical superior view.
   */
  private fitBox(box: T.Box3, view: View | T.Vector3, insets: Insets, animate: boolean, margin = 1.08) {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    const left = insets.left,
      right = w - insets.right,
      top = insets.top,
      bottom = h - insets.bottom
    const availW = Math.max(150, right - left),
      availH = Math.max(80, bottom - top)
    const centre = box.getCenter(new T.Vector3())
    const radius = Math.max(4, box.getSize(new T.Vector3()).length() / 2)
    this.camera.setViewOffset(w, h, w / 2 - (left + right) / 2, h / 2 - (top + bottom) / 2, w, h)
    const vfov = T.MathUtils.degToRad(this.camera.fov / 2) * (availH / h)
    const hfov = Math.atan(Math.tan(T.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect) * (availW / w)
    const distance = Math.max(radius / Math.sin(vfov), radius / Math.sin(hfov)) * margin
    this.controls.maxDistance = Math.max(3000, distance * 3)
    const dir = view instanceof T.Vector3 ? view : this.viewDirection(view)
    this.goTo(centre.clone().addScaledVector(dir, distance), centre, animate)
  }

  private goTo(pos: T.Vector3, target: T.Vector3, animate: boolean) {
    if (!animate) {
      this.camera.position.copy(pos)
      this.controls.target.copy(target)
      this.controls.update()
      this.fly = null
    } else {
      this.fly = { pos, target, t: 0 }
    }
    this.dirty = true
  }

  /** Bounding box of the currently visible parts at their current offsets. */
  private visibleBox() {
    const box = new T.Box3()
    for (const p of this.parts) if (p.mesh.visible) box.union(p.bounds.clone().translate(p.mesh.position))
    return box
  }

  /** Choose the framing for the current mode: assembled, exploded or isolated. */
  private frameFor(s: SceneSnapshot, animate: boolean) {
    if (s.lesson && this.frameLesson(s.lesson, animate)) return
    if (s.isolate) {
      const box = this.visibleBox()
      if (!box.isEmpty()) this.fitBox(box, s.view, this.insets(), animate, 0.95)
      return
    }
    if (this.amount < 0.02) {
      if (s.mode === 'learn' && !s.lesson && !s.sectionCut) {
        const box = this.visibleBox()
        if (!box.isEmpty()) this.fitBox(box, s.view, this.insets(), animate, 0.78)
        return
      }
      if (s.peel > 0.01) {
        const box = this.visibleBox()
        if (!box.isEmpty()) this.fitBox(box, s.view, this.insets(), animate, 0.8)
        return
      }
      // The whole model, whatever is toggled: switching systems should not
      // make the camera jump around.
      this.fitBox(this.modelBox, s.view, this.insets(), animate, 0.68)
      return
    }
    const box = this.visibleBox()
    if (!box.isEmpty()) this.fitBox(box, this.amount > 0.8 ? 'front' : s.view, this.insets(), animate, 0.75)
  }

  // ── Explode ─────────────────────────────────────────────────────────

  /** Recompute inventory cells whenever the visible set or aspect changes. */
  private updateLayout(visibleParts: PartEntry[]) {
    const key = visibleParts.map((p) => p.id).join(',') + ':' + this.camera.aspect.toFixed(3)
    if (key === this.layoutKey) return
    this.layoutKey = key
    const { cells } = inventoryLayout(visibleParts, this.camera.aspect)
    for (const p of this.parts) {
      const cell = cells.get(p.id)
      if (cell) {
        p.inventory.set(this.modelCentre.x + cell.x - p.centre.x, this.modelCentre.y + cell.y - p.centre.y, this.modelCentre.z - p.centre.z)
        p.cellWidth = cell.width
      } else p.inventory.set(0, 0, 0)
    }
  }

  /** Apply the blended separation / inventory offsets to every mesh. */
  private applyOffsets() {
    const a = this.amount
    for (const p of this.parts) {
      const pos = p.mesh.position
      if (a <= SPLIT) {
        const t = smooth(a / SPLIT)
        pos.copy(p.separation).multiplyScalar(t)
      } else {
        const t = smooth((a - SPLIT) / (1 - SPLIT))
        pos.copy(p.separation).lerp(p.inventory, t)
      }
    }
  }

  // ── Pointer ─────────────────────────────────────────────────────────

  private onDown = (e: PointerEvent) => {
    this.tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 12 : 5)
  }
  private onMove = (e: PointerEvent) => {
    this.tap.move(e.pointerId, e.clientX, e.clientY)
    if (e.buttons || e.pointerType === 'touch') {
      this.pendingHover = null
      this.setHovered(null)
      return
    }
    const rect = this.host.getBoundingClientRect()
    this.pendingHover = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    this.dirty = true
  }
  private onLeave = () => {
    this.pendingHover = null
    this.setHovered(null)
  }
  private onCancel = (e: PointerEvent) => this.tap.cancel(e.pointerId)
  private onUp = (e: PointerEvent) => {
    if (!this.tap.up(e.pointerId, e.clientX, e.clientY)) return
    const rect = this.host.getBoundingClientRect()
    if (this.tapOverride?.(e.clientX - rect.left, e.clientY - rect.top)) return
    this.cb.onSelect(this.pick(e.clientX - rect.left, e.clientY - rect.top))
  }
  private onVisible = () => {
    if (!document.hidden) this.warmUp()
  }

  private onContextLost = (e: Event) => {
    e.preventDefault()
    this.cb.onError('context-lost')
  }

  /**
   * Trackpads send plain two-finger scrolling and pinch-to-zoom as the same
   * DOM `wheel` event, distinguished only by `ctrlKey` (which the browser
   * sets synthetically for a pinch gesture). OrbitControls treats every
   * wheel event as zoom; this handler runs in the capture phase so it sees
   * the event before OrbitControls' own bubble-phase listener does, and
   * stops it there. Scroll = pan, pinch = zoom.
   */
  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const c = this.controls
    if (e.ctrlKey) {
      const offset = this.camera.position.clone().sub(c.target)
      const scale = Math.pow(0.985, -e.deltaY)
      const dist = T.MathUtils.clamp(offset.length() * scale, c.minDistance, c.maxDistance)
      offset.setLength(dist)
      this.camera.position.copy(c.target).add(offset)
    } else {
      // The camera moves *with* the fingers (so the model travels the
      // opposite way), which is what scrolling a document does.
      const offset = this.camera.position.clone().sub(c.target)
      const targetDistance = offset.length() * Math.tan(T.MathUtils.degToRad(this.camera.fov / 2))
      const panX = new T.Vector3().setFromMatrixColumn(this.camera.matrix, 0)
      const panY = new T.Vector3().setFromMatrixColumn(this.camera.matrix, 1)
      const h = this.host.clientHeight || 1
      panX.multiplyScalar((e.deltaX * 2 * targetDistance) / h)
      panY.multiplyScalar((-e.deltaY * 2 * targetDistance) / h)
      const pan = panX.add(panY)
      this.camera.position.add(pan)
      c.target.add(pan)
    }
    c.update()
    this.fly = null
    this.dirty = true
  }

  // ── External pointers (hand tracking, src/hands) ─────────────────────
  // Points are in pixels relative to the scene host, like a pointer event's.

  /** Hover whatever lies under (x, y); null clears it. Raycast once per frame. */
  externalHover(x: number | null, y = 0) {
    if (x === null) {
      this.pendingHover = null
      this.setHovered(null)
    } else this.pendingHover = { x, y }
    this.dirty = true
  }

  /** A tap at (x, y): selects exactly as a click there would. */
  externalTap(x: number, y: number) {
    if (this.tapOverride?.(x, y)) return
    this.cb.onSelect(this.pick(x, y))
  }

  /** Orbit around the target by (yaw, pitch) radians, the way a mouse drag turns the model. */
  orbitBy(yaw: number, pitch: number) {
    const c = this.controls
    if (!c.enableRotate) return
    const q = (c as unknown as { _quat: T.Quaternion })._quat
    const offset = this.camera.position.clone().sub(c.target).applyQuaternion(q)
    const sph = new T.Spherical().setFromVector3(offset)
    sph.theta -= yaw
    sph.phi = T.MathUtils.clamp(sph.phi - pitch, Math.max(0.05, c.minPolarAngle), Math.min(Math.PI - 0.05, c.maxPolarAngle))
    offset.setFromSpherical(sph).applyQuaternion(q.clone().invert())
    this.camera.position.copy(c.target).add(offset)
    this.camera.lookAt(c.target)
    this.fly = null
    this.dirty = true
  }

  /** Move the camera towards (factor < 1) or away from (> 1) the target. */
  dollyBy(factor: number) {
    const c = this.controls
    const offset = this.camera.position.clone().sub(c.target)
    const d = T.MathUtils.clamp(offset.length() * factor, c.minDistance, c.maxDistance)
    this.camera.position.copy(c.target).add(offset.setLength(d))
    this.fly = null
    this.dirty = true
  }

  // ── Operating-room mode (src/or) ────────────────────────────────────
  private orActive = false
  /** While set, a tap goes here first; returning true consumes it (the measuring tool). */
  tapOverride: ((x: number, y: number) => boolean) | null = null

  /** The atlas rig, for the room to dim or restore. */
  get rig() {
    return { hemi: this.hemi, key: this.keyLight, rim: this.rimLight, fill: this.fillLight, ground: this.ground }
  }

  /** The atlas backdrop, ground, lights and crease shadows step aside for the room. */
  setOrMode(on: boolean, settle?: { explode: number; peel: number }) {
    this.orActive = on
    // The room needs the assembled head at once, and leaving it must not make the atlas refit the camera
    // (it would chase an explode / peel change): both take their values instantly, with no framing.
    const st = on ? { explode: 0, peel: 0 } : settle
    if (st) {
      this.amount = st.explode
      this.peel = st.peel
      this.lastFitAmount = st.explode
      this.lastFitPeel = st.peel
      this.last = null
    }
    for (const l of [this.hemi, this.keyLight, this.rimLight, this.fillLight]) l.visible = !on
    this.ground.visible = !on
    if (!on) {
      const th = THEMES[this.state?.theme ?? 'dark']
      this.renderer.setClearColor(th.clear)
    }
    this.aoKey = ''
    this.warmUp()
  }

  /** Turn the camera's "up" (the room's up is the patient's anterior axis). OrbitControls caches it at construction. */
  setUp(up: T.Vector3) {
    this.camera.up.copy(up)
    const c = this.controls as unknown as { _quat: T.Quaternion; _quatInverse: T.Quaternion }
    c._quat.setFromUnitVectors(up, new T.Vector3(0, 1, 0))
    c._quatInverse.copy(c._quat).invert()
    this.dirty = true
  }

  /** Camera to `pos` looking at `target`, optionally with a new field of view. */
  flyCamera(pos: T.Vector3, target: T.Vector3, o: { fov?: number; animate?: boolean } = {}) {
    const animate = o.animate !== false
    if (animate) {
      this.fly = { pos: pos.clone(), target: target.clone(), t: 0, fov: o.fov === undefined ? undefined : { from: this.camera.fov, to: o.fov } }
      this.dirty = true
      return
    }
    if (o.fov !== undefined) {
      this.camera.fov = o.fov
      this.camera.updateProjectionMatrix()
    }
    this.goTo(pos.clone(), target.clone(), false)
  }

  /** A structure's mesh (assembled geometry), for the room to build the scalp from. */
  partMesh(id: string) {
    return this.byId.get(id)?.mesh ?? null
  }

  /** First surface point under (x, y): visible structures plus `extra` objects. Null when nothing is hit. */
  pickPoint(x: number, y: number, extra: T.Object3D[] = []): { point: T.Vector3; id: string; normal: T.Vector3; dir: T.Vector3 } | null {
    return this.withEye(() => {
      const w = this.host.clientWidth,
        h = this.host.clientHeight
      this.raycaster.setFromCamera(new T.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1), this.camera)
      this.raycaster.firstHitOnly = true
      const objs = [...this.parts.filter((p) => p.mesh.visible).map((p) => p.mesh), ...extra.filter((o) => o.visible)]
      const hit = this.raycaster.intersectObjects(objs, false)[0]
      if (!hit) return null
      const dir = this.raycaster.ray.direction.clone()
      // Face normal in scene space (the meshes carry no rotation in the room), turned to face the viewer.
      const normal = hit.face ? hit.face.normal.clone() : dir.clone().negate()
      if (normal.dot(dir) > 0) normal.negate()
      return { point: hit.point.clone(), id: hit.object.name, normal, dir }
    })
  }

  /** Every loaded structure's geometry (with its BVH), for the instrument engine's distance queries. */
  toolTargets() {
    return this.parts.map((p) => ({ id: p.id, system: p.system, geometry: p.mesh.geometry as T.BufferGeometry & { boundsTree?: import('three-mesh-bvh').MeshBVH } }))
  }

  /** The shared section planes: layers added outside the atlas parts (src/or/anatomy) clip with the same array. */
  get sectionPlanes() {
    return this.clipPlanes
  }

  /** Ask for a redraw (the room animates lights and screens on its own). */
  redraw() {
    this.dirty = true
  }

  /** Scene host, for converting screen coordinates. */
  get hostElement() {
    return this.host
  }

  // ── Head-coupled perspective ("window" view, src/hands) ─────────────
  //
  // The screen is treated as a window onto the scene: the viewer's eye moves
  // with their head, the window (the plane through the orbit target, framed as
  // the camera frames it now) stays put, and the frustum skews to keep it so —
  // an off-axis projection (Kooima, "Generalized Perspective Projection").
  // The orbit camera itself is never moved: the eye is applied around drawing
  // and picking only, so OrbitControls, fly-to and framing are unaffected.

  private eye = { x: 0, y: 0, z: 0, on: false }
  private eyeMovingUntil = 0
  private eyeRestTimer = 0
  private eyeSaved = { pos: new T.Vector3(), proj: new T.Matrix4(), projInv: new T.Matrix4() }

  /**
   * Viewer's eye relative to the screen centre: x, y in half-widths / half-heights of the window
   * (+x right, +y up), z as a fraction of the viewing distance towards the scene. null switches it off.
   */
  setEye(e: { x: number; y: number; z: number } | null) {
    const on = !!e
    const next = e ?? { x: 0, y: 0, z: 0 }
    const moved = Math.abs(next.x - this.eye.x) + Math.abs(next.y - this.eye.y) + Math.abs(next.z - this.eye.z) > 1e-4
    if (!moved && on === this.eye.on) return
    this.eye = { ...next, on }
    this.dirty = true
    // Crease shadows wait while the head moves (they would be recomputed every frame), and come back once it rests.
    this.eyeMovingUntil = performance.now() + 220
    window.clearTimeout(this.eyeRestTimer)
    this.eyeRestTimer = window.setTimeout(() => (this.dirty = true), 240)
  }

  private withEye<R>(fn: () => R): R {
    const e = this.eye
    if (!e.on || Math.abs(e.x) + Math.abs(e.y) + Math.abs(e.z) < 1e-5) return fn()
    const cam = this.camera
    const sv = this.eyeSaved
    sv.pos.copy(cam.position)
    sv.proj.copy(cam.projectionMatrix)
    sv.projInv.copy(cam.projectionMatrixInverse)
    cam.updateMatrixWorld()
    // The current frustum (view offset for side panels and zoom included), read back from the matrix.
    const m = cam.projectionMatrix.elements
    const n = cam.near
    const l = (n * (m[8] - 1)) / m[0],
      r = (n * (m[8] + 1)) / m[0]
    const b = (n * (m[9] - 1)) / m[5],
      t = (n * (m[9] + 1)) / m[5]
    // The window: that frustum's cross-section at the orbit target.
    const D = Math.max(cam.near * 4, cam.position.distanceTo(this.controls.target))
    const k = D / n
    const W = ((r - l) / 2) * k,
      H = ((t - b) / 2) * k
    const cx = ((r + l) / 2) * k,
      cy = ((t + b) / 2) * k
    // The eye, in camera space (the camera sits at the origin; e = 0 reproduces the plain frame exactly).
    const ex = e.x * W,
      ey = e.y * H
    const ez = T.MathUtils.clamp(e.z, -0.6, 0.45) * D
    const d = D - ez
    const right = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0)
    const up = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1)
    const back = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 2)
    cam.position.addScaledVector(right, ex).addScaledVector(up, ey).addScaledVector(back, -ez)
    // Skew the frustum so the window's edges stay where they are on screen.
    const s = n / d
    cam.projectionMatrix.makePerspective((cx - W - ex) * s, (cx + W - ex) * s, (cy + H - ey) * s, (cy - H - ey) * s, n, cam.far)
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()
    cam.updateMatrixWorld()
    try {
      return fn()
    } finally {
      cam.position.copy(sv.pos)
      cam.projectionMatrix.copy(sv.proj)
      cam.projectionMatrixInverse.copy(sv.projInv)
      cam.updateMatrixWorld()
    }
  }

  private pick(x: number, y: number): string | null {
    return this.withEye(() => this.pickRaw(x, y))
  }

  private pickRaw(x: number, y: number): string | null {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    const ndc = new T.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    // With a clip plane on, a mesh's first hit is often on its cut-away half;
    // its visible cut face lies further along the ray. Taking only the first
    // hit per mesh then rejects the structure you are pointing at and falls
    // through to whatever lies behind it (the callosum and septum read as
    // the lateral ventricle). So: every hit per mesh while cutting.
    const clipping = this.clipPlanes.some((p) => p.constant < 1e4)
    this.raycaster.firstHitOnly = !clipping
    const candidates = this.parts.filter((p) => p.mesh.visible && (!this.lessonActive || this.lessonFocus.has(p.id))).map((p) => p.mesh)
    const hits = this.raycaster.intersectObjects(candidates, false)
    // Respect the clip planes: a hit clipped away on any active plane is
    // invisible and must not be selectable.
    for (const hit of hits) {
      if (this.clipPlanes.every((p) => p.constant >= 1e4 || p.distanceToPoint(hit.point) >= 0)) return hit.object.name
    }
    return null
  }

  private setHovered(id: string | null) {
    if (id === this.hoveredId) return
    this.hoveredId = id
    this.renderer.domElement.style.cursor = id ? 'pointer' : this.amount > 0.8 ? 'move' : 'grab'
    this.cb.onHover(id)
    this.dirty = true
  }

  // ── Cross-section markers ───────────────────────────────────────────

  /**
   * The level's outline on the model: plane ∩ every loaded part matching
   * `match`, merged into the OUTER boundary only (the left/right half
   * meshes and the nuclei inside would otherwise draw a tangle of rings),
   * smoothed and lifted 0.6 mm off the surface so the depth test can hide
   * the half that runs behind the model. Returns closed loops, scene space.
   */
  private outline(plane: T.Plane, match: RegExp): T.Vector3[][] {
    const { u, v } = planeBasis(plane.normal, Math.abs(plane.normal.y) > 0.9 ? new T.Vector3(0, 0, -1) : new T.Vector3(0, 1, 0))
    const origin = plane.coplanarPoint(new T.Vector3())
    const flat: number[] = []
    const q = new T.Vector3()
    for (const part of this.parts) {
      if (!match.test(part.id)) continue
      const seg = sliceSegments(part.mesh.geometry, plane)
      for (let i = 0; i < seg.length; i += 3) {
        q.set(seg[i] - origin.x, seg[i + 1] - origin.y, seg[i + 2] - origin.z)
        flat.push(q.dot(u), q.dot(v))
      }
    }
    if (!flat.length) return []
    return unionOutline(chainLoops(flat, 1e-3), 0.25, 0.12, 0.5).map((loop) =>
      decimate(smoothLoop(loop, 3), 0.35).map(([a, b]) => origin.clone().addScaledVector(u, a).addScaledVector(v, b)),
    )
  }

  /** Bounds of every loaded part whose id matches. */
  private matchBox(match: RegExp) {
    const box = new T.Box3()
    for (const p of this.parts) if (match.test(p.id)) box.union(p.bounds)
    return box
  }

  /** Builds every level marker once (the gross meshes they trace are loaded at start-up). */
  private buildMarkers() {
    this.markersBuilt = true
    const res = new T.Vector2(this.host.clientWidth, this.host.clientHeight)
    this.leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.leaders.classList.add('section-leaders')
    this.markerLayer.appendChild(this.leaders)
    for (const section of SECTIONS) {
      // Depth-tested: the part of the ring behind the brainstem (or behind
      // the cerebellum) is hidden, as a line drawn on a real specimen would be.
      const material = new LineMaterial({
        color: 0x5ad1ff,
        linewidth: 2.2,
        transparent: true,
        opacity: 0.95,
        depthTest: true,
        depthWrite: false,
        resolution: res,
      })
      const sp = scenePlane(section)
      const match = section.contour ?? /$^/
      let line: LineSegments2 | null = null
      const ring: T.Vector3[] = []
      if (sp) {
        const plane = new T.Plane().setFromNormalAndCoplanarPoint(new T.Vector3(...sp.normal).normalize(), new T.Vector3(...sp.point))
        const segs: number[] = []
        for (const loop of this.outline(plane, match)) {
          for (let i = 0; i < loop.length; i++) {
            const a = loop[i],
              b = loop[(i + 1) % loop.length]
            segs.push(a.x, a.y, a.z, b.x, b.y, b.z)
          }
          ring.push(...loop)
        }
        if (segs.length) {
          line = new LineSegments2(new LineSegmentsGeometry().setPositions(segs), material)
          line.renderOrder = 30
          line.visible = false
          this.scene.add(line)
        }
      }
      // Maps (no plane) hang their badge off the structure's own box.
      const box = this.matchBox(match)
      const anchor = ring.length ? new T.Box3().setFromPoints(ring).getCenter(new T.Vector3()) : box.isEmpty() ? new T.Vector3() : box.getCenter(new T.Vector3())
      if (!ring.length && !box.isEmpty())
        ring.push(new T.Vector3(anchor.x, anchor.y, box.max.z), new T.Vector3(anchor.x, anchor.y, box.min.z), new T.Vector3(anchor.x, box.max.y, anchor.z))
      const pill = document.createElement('button')
      pill.className = 'section-marker'
      pill.type = 'button'
      pill.dataset.region = section.region
      const code = document.createElement('b')
      code.textContent = section.code
      const name = document.createElement('span')
      pill.append(code, name)
      pill.hidden = true
      const lead = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
      lead.dataset.region = section.region
      this.leaders.appendChild(lead)
      const hot = (on: boolean) => {
        const m = this.markers.find((x) => x.section === section)
        if (m) m.hot = on
        lead.classList.toggle('hot', on)
        this.dirty = true // updateMarkers restyles the rings
      }
      pill.addEventListener('click', (e) => {
        e.stopPropagation()
        this.cb.onSection(section.id)
      })
      pill.addEventListener('pointerenter', () => hot(true))
      pill.addEventListener('pointerleave', () => hot(false))
      this.markerLayer.appendChild(pill)
      this.markers.push({ section, line, material, pill, anchor, ring, lead, hot: false })
    }
  }

  /** Marker names in the active language. */
  setMarkerNames(names: Record<string, string>) {
    for (const m of this.markers) {
      const span = m.pill.querySelector('span')
      if (span) span.textContent = names[m.section.id] ?? ''
    }
  }

  private markerNames: Record<string, string> = {}
  setSectionNames(names: Record<string, string>) {
    this.markerNames = names
    this.setMarkerNames(names)
  }

  private updateMarkers() {
    const s = this.state
    const on = !!s && s.mode === 'learn' && !s.lesson && !s.isolate && this.amount < 0.02
    if (on && !this.markersBuilt) {
      this.buildMarkers()
      this.setMarkerNames(this.markerNames)
    }
    if (this.markerLayer.hidden !== !on) this.markerLayer.hidden = !on
    if (!on) {
      this.markerInsets = null
      for (const m of this.markers)
        if (m.line?.visible) {
          m.line.visible = false
          this.dirty = true
        }
      return
    }
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    this.leaders?.setAttribute('viewBox', `0 0 ${w} ${h}`)
    const v = new T.Vector3()
    const toScreen = (p: T.Vector3): [number, number] | null => {
      v.copy(p).project(this.camera)
      return v.z < -1 || v.z > 1 ? null : [((v.x + 1) * w) / 2, ((1 - v.y) * h) / 2]
    }
    // Each badge sits just beyond its ring on the anterior side of the
    // model (where textbooks label the levels), joined by a short leader;
    // badges that would collide are pushed down one by one, so they read as
    // a tidy staggered column that follows the brainstem's own tilt.
    if (!this.markerInsets) this.markerInsets = this.insets()
    const ins = this.markerInsets
    const rows: {
      m: Marker
      pts: [number, number][]
      x: number
      y: number
      at: [number, number]
    }[] = []
    let minX = Infinity,
      maxX = -Infinity
    const isActive = (m: Marker) => (s!.sectionCut ? s!.sectionCut === m.section.id : !s!.topicSections || s!.topicSections.includes(m.section.id))
    // Several levels at once (a topic's plates) project onto each other and their rings cross: draw them faint and thin,
    // and only the ring whose badge is under the pointer bright, so one ring at a time reads as a single clear outline.
    const crowded = this.markers.filter((m) => m.line && isActive(m)).length > 1
    for (const m of this.markers) {
      const active = isActive(m)
      if (m.line && m.line.visible !== active) {
        m.line.visible = active
        this.dirty = true
      }
      const dim = crowded && !m.hot
      const want = { color: m.hot ? 0xffd166 : 0x5ad1ff, width: m.hot ? 3.4 : dim ? 1.4 : 2.2, opacity: dim ? 0.4 : 0.95 }
      if (m.material.linewidth !== want.width || m.material.opacity !== want.opacity || m.material.color.getHex() !== want.color) {
        m.material.color.set(want.color)
        m.material.linewidth = want.width
        m.material.opacity = want.opacity
        if (m.line) m.line.renderOrder = m.hot ? 31 : 30
        this.dirty = true
      }
      const pts = active ? (m.ring.map(toScreen).filter(Boolean) as [number, number][]) : []
      if (!pts.length) {
        m.pill.hidden = true
        m.lead.setAttribute('points', '')
        continue
      }
      for (const [x] of pts) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
      }
      rows.push({ m, pts, x: 0, y: 0, at: pts[0] })
    }
    if (!rows.length) return
    const c0 = toScreen(this.modelCentre),
      c1 = toScreen(this.modelCentre.clone().add(new T.Vector3(0, 0, 30)))
    const dx = c0 && c1 ? c1[0] - c0[0] : 0
    // Seen from the side, badges follow each ring; seen from the front or
    // top the rings stack on one another, so the badges form one straight
    // column clear of the whole model instead.
    const lateral = Math.abs(dx) > 12
    const right = lateral ? dx > 0 : w - maxX >= minX
    for (const r of rows) {
      let best = r.pts[0]
      for (const p of r.pts) if (right ? p[0] > best[0] : p[0] < best[0]) best = p
      r.at = best
      r.x = lateral ? best[0] + (right ? 26 : -26) : right ? maxX + 34 : minX - 34
      r.y = best[1]
    }
    const PW = 46,
      PH = 27
    const top = ins.top + 14,
      bottom = h - ins.bottom - 14
    rows.sort((a, b) => a.y - b.y)
    const place = () => {
      for (let i = 0; i < rows.length; i++) {
        rows[i].y = Math.max(rows[i].y, top)
        for (let j = 0; j < i; j++) if (Math.abs(rows[j].x - rows[i].x) < PW && rows[i].y - rows[j].y < PH) rows[i].y = rows[j].y + PH
      }
    }
    place()
    const over = Math.max(...rows.map((r) => r.y)) - bottom
    if (over > 0) {
      for (const r of rows) r.y -= over
      place()
    }
    for (const r of rows) {
      const [ax, ay] = r.at
      const end = right ? r.x - 2 : r.x + 2
      const elbow = right ? Math.max(ax + 8, end - 10) : Math.min(ax - 8, end + 10)
      r.m.lead.setAttribute('points', `${ax.toFixed(1)},${ay.toFixed(1)} ${elbow.toFixed(1)},${r.y.toFixed(1)} ${end.toFixed(1)},${r.y.toFixed(1)}`)
      r.m.pill.style.transform = `translate(${right ? '0' : '-100%'}, -50%) translate(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px)`
      r.m.pill.classList.toggle('left', !right)
      r.m.pill.classList.toggle('active', !!s?.sectionCut && s.sectionCut === r.m.section.id)
      if (r.m.pill.hidden) r.m.pill.hidden = false
    }
  }

  /**
   * Cuts the model along a section's own (oblique) plane, keeping the
   * caudal / posterior half, and turns the camera to look at the cut face
   * from the removed side — the way the textbook figure is drawn.
   */
  private applySectionCut(id: string | null) {
    const plane = this.clipPlanes[3]
    const section = id ? SECTIONS.find((x) => x.id === id) : undefined
    const sp = section ? scenePlane(section) : null
    if (!section || !sp) {
      plane.constant = 1e5
      return
    }
    const n = new T.Vector3(...sp.normal).normalize()
    const p = new T.Vector3(...sp.point)
    plane.normal.copy(n).negate()
    plane.constant = -plane.normal.dot(p)
    const marker = this.markers.find((m) => m.section.id === id)
    const box = new T.Box3()
    if (marker?.line) {
      marker.line.geometry.computeBoundingBox()
      box.copy(marker.line.geometry.boundingBox!)
    }
    if (box.isEmpty()) box.setFromCenterAndSize(p, new T.Vector3(40, 40, 40))
    box.expandByScalar(section.region === 'cerebellum' ? 8 : 14)
    // Tilt the view a little off-axis so the cut face reads as a surface on a
    // solid, not a flat drawing.
    const dir = n
      .clone()
      .add(new T.Vector3(0.18, 0.1, 0))
      .normalize()
    this.fitBox(box, dir, this.insets(), true, 1.0)
  }

  // ── Labels ──────────────────────────────────────────────────────────

  private updateLabels() {
    const show = this.amount > 0.72 && !this.state?.isolate
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    const v = new T.Vector3()
    const edge = new T.Vector3()
    const fade = Math.min(1, (this.amount - 0.72) / 0.2)
    this.labelLayer.style.opacity = String(fade)
    const selection = new Set(this.state?.selected ?? [])
    for (const p of this.parts) {
      let visible = show && p.mesh.visible
      if (visible) {
        // Anchor just below the part's bounding box; measure the cell width on screen.
        v.set(p.centre.x + p.mesh.position.x, p.bounds.min.y + p.mesh.position.y - 3, p.centre.z + p.mesh.position.z).project(this.camera)
        edge.set(p.centre.x + p.mesh.position.x + p.cellWidth / 2, p.bounds.min.y + p.mesh.position.y - 3, p.centre.z + p.mesh.position.z).project(this.camera)
        const cellPx = Math.abs(edge.x - v.x) * w
        const emphasised = p.id === this.hoveredId || selection.has(p.id)
        if (v.z < -1 || v.z > 1 || (cellPx < 46 && !emphasised)) visible = false
        else {
          const x = ((v.x + 1) * w) / 2,
            y = ((1 - v.y) * h) / 2
          p.label.style.transform = `translate(-50%, 0) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
          p.label.style.maxWidth = emphasised ? '220px' : `${Math.max(46, cellPx - 6).toFixed(0)}px`
          p.label.classList.toggle('emphasised', emphasised)
        }
      }
      if (p.label.hidden !== !visible) p.label.hidden = !visible
    }
  }

  // ── Lessons ─────────────────────────────────────────────────────────

  /**
   * Puts a lesson step on stage: structures in focus fade in (in their
   * teaching colours), context fades to a ghost, everything else fades out.
   * Runs every frame while a lesson is open; the expensive part (colours,
   * labels, flow, camera) only when the step changes.
   */
  private stageLesson(s: SceneSnapshot, dt: number) {
    const st = s.lesson!
    if (st.key !== this.lessonKey) {
      if (!this.lessonActive) for (const p of this.parts) p.lessonAmount = p.mesh.visible ? p.peelAmount : 0
      this.lessonActive = true
      this.lessonKey = st.key
      this.lessonFocus = new Map(st.focus.map((f) => [f.id, f.color]))
      this.lessonContext = new Set(st.context)
      for (const p of this.parts) {
        const color = this.lessonFocus.get(p.id)
        const want = color ? new T.Color(color) : this.lessonContext.has(p.id) ? GHOST_COLOR : null
        const base = p.mesh.material.userData.base
        if (want) {
          if (!p.atlasBase) p.atlasBase = base.clone()
          base.copy(want)
        } else if (p.atlasBase) {
          base.copy(p.atlasBase)
          p.atlasBase = null
        }
        tint(p.mesh.material, p.selectedAmount, p.hoverAmount)
        ;(p.mesh.children[0] as T.Mesh<T.BufferGeometry, T.MeshBasicMaterial> | undefined)?.material.color.copy(base).multiplyScalar(0.82)
      }
      this.buildLessonLabels(st)
      this.buildFlow(st)
      this.markerInsets = null
      this.dirty = true
    }
    // Frame once every focus mesh is in (a step may wait for a layer to load).
    if (this.lessonFramedKey !== st.key && st.focus.every((f) => this.byId.has(f.id))) {
      this.lessonFramedKey = st.key
      this.frameLesson(st, true)
    }
    let moving = false
    for (const p of this.parts) {
      const target = this.lessonFocus.has(p.id) ? 1 : this.lessonContext.has(p.id) ? GHOST_OPACITY : 0
      if (p.lessonAmount !== target) {
        p.lessonAmount = T.MathUtils.damp(p.lessonAmount, target, 5, dt)
        if (Math.abs(p.lessonAmount - target) < 0.003) p.lessonAmount = target
        moving = true
      }
      const a = p.lessonAmount
      const m = p.mesh.material
      // A ghost shows its front faces only: with both sides, every gyrus
      // would stack two layers and the stage behind would drown in white.
      const side = this.lessonFocus.has(p.id) ? T.DoubleSide : T.FrontSide
      // `side` is part of the shader program key: a change needs a recompile.
      if (m.side !== side) {
        m.side = side
        m.needsUpdate = true
      }
      if (m.opacity !== a) {
        m.opacity = a
        m.transparent = a < 0.999
        m.depthWrite = a >= 0.999
      }
      p.mesh.visible = a > 0.005
      // The back-face cut cap would show through a see-through shell.
      const cap = p.mesh.children[0]
      if (cap) cap.visible = a >= 0.999
    }
    if (moving) this.dirty = true
  }

  /** Leaves lesson mode: atlas colours back, opacity handed back to the peel/visibility pass. */
  private endLesson() {
    this.lessonActive = false
    this.lessonKey = ''
    this.lessonFramedKey = ''
    this.lessonFocus.clear()
    this.lessonContext.clear()
    for (const p of this.parts) {
      if (p.atlasBase) {
        p.mesh.material.userData.base.copy(p.atlasBase)
        ;(p.mesh.children[0] as T.Mesh<T.BufferGeometry, T.MeshBasicMaterial> | undefined)?.material.color.copy(p.atlasBase).multiplyScalar(0.82)
        p.atlasBase = null
        tint(p.mesh.material, p.selectedAmount, p.hoverAmount)
      }
      const cap = p.mesh.children[0]
      if (cap) cap.visible = true
      if (p.mesh.material.side !== T.DoubleSide) {
        p.mesh.material.side = T.DoubleSide
        p.mesh.material.needsUpdate = true
      }
      p.peelAmount = -1 // forces the visibility pass to rewrite opacity
    }
    this.buildLessonLabels(null)
    this.buildFlow(null)
  }

  /** Frames the step's focus structures from its viewpoint; false if none is loaded yet. */
  private frameLesson(st: LessonStage, animate: boolean) {
    const box = new T.Box3()
    for (const f of st.focus) {
      const p = this.byId.get(f.id)
      if (p) box.union(p.bounds)
    }
    for (const l of st.labels) box.expandByPoint(mniToScene(l.at))
    // A lesion with nothing else in focus (a silent one) is framed with ~7 mm of its surroundings, not filling the view.
    for (const les of st.lesions) {
      if (les.dim) continue
      const c = mniToScene(les.at)
      const m = Math.max(7, les.r * 2)
      box.expandByPoint(c.clone().addScalar(m)).expandByPoint(c.clone().addScalar(-m))
    }
    if (box.isEmpty()) return false
    this.markerInsets = null
    const dir = mniToScene(st.view).normalize()
    this.fitBox(box, dir, this.insets(), animate, 0.95)
    return true
  }

  private buildLessonLabels(st: LessonStage | null) {
    for (const l of this.lessonLabels) {
      l.el.remove()
      l.line.remove()
      l.dot.remove()
    }
    this.lessonLabels = []
    if (!st) return
    const NS = 'http://www.w3.org/2000/svg'
    for (const lab of st.labels) {
      const el = document.createElement('div')
      el.className = 'lesson-label'
      if (lab.color) {
        const sw = document.createElement('i')
        sw.style.background = lab.color
        el.appendChild(sw)
      }
      el.appendChild(document.createTextNode(lab.text))
      this.lessonLayer.appendChild(el)
      const line = document.createElementNS(NS, 'polyline')
      const dot = document.createElementNS(NS, 'circle')
      dot.setAttribute('r', '3.2')
      if (lab.color) {
        line.style.stroke = lab.color
        dot.style.fill = lab.color
      }
      this.lessonSvg.append(line, dot)
      this.lessonLabels.push({ el, line, dot, anchor: mniToScene(lab.at) })
    }
  }

  /**
   * Atlas-style label columns: each label goes to the side of the stage its
   * anchor is on, columns are de-overlapped top to bottom, and a leader runs
   * from the pill to the anchor dot.
   */
  private updateLessonLabels() {
    if (!this.lessonLabels.length) return
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    this.lessonSvg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    const box = new T.Box3()
    for (const id of this.lessonFocus.keys()) {
      const p = this.byId.get(id)
      if (p && p.mesh.visible) box.union(p.bounds)
    }
    const toScreen = (v: T.Vector3) => {
      const q = v.clone().project(this.camera)
      return { x: ((q.x + 1) * w) / 2, y: ((1 - q.y) * h) / 2 }
    }
    let minX = Infinity,
      maxX = -Infinity
    const pts = this.lessonLabels.map((l) => toScreen(l.anchor))
    if (!box.isEmpty()) {
      for (let i = 0; i < 8; i++) {
        const c = new T.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
        const sp = toScreen(c)
        minX = Math.min(minX, sp.x)
        maxX = Math.max(maxX, sp.x)
      }
    }
    for (const p of pts) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
    }
    const ins = this.markerInsets ?? (this.markerInsets = this.insets())
    const mid = (minX + maxX) / 2
    const leftX = Math.max(ins.left + 12, minX - 28)
    const rightX = Math.min(w - ins.right - 12, maxX + 28)
    const sides: { i: number; y: number }[][] = [[], []]
    pts.forEach((p, i) => sides[p.x < mid ? 0 : 1].push({ i, y: p.y }))
    const GAP = 28
    sides.forEach((col, side) => {
      col.sort((a, b) => a.y - b.y)
      const ys = col.map((c) => c.y)
      for (let k = 1; k < ys.length; k++) ys[k] = Math.max(ys[k], ys[k - 1] + GAP)
      // Shift the column back up if it ran off the bottom.
      const over = ys.length ? ys[ys.length - 1] - (h - ins.bottom - 12) : 0
      if (over > 0) for (let k = 0; k < ys.length; k++) ys[k] -= over
      col.forEach((c, k) => {
        const l = this.lessonLabels[c.i]
        const a = pts[c.i]
        const y = Math.max(ins.top + 12, ys[k])
        // Keep the whole pill on screen and clear of the side panels.
        const pw = l.el.offsetWidth
        const x = side === 0 ? Math.max(leftX, ins.left + 8 + pw) : Math.min(rightX, w - ins.right - 8 - pw)
        l.el.style.transform =
          side === 0 ? `translate(-100%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` : `translate(0, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
        const elbow = side === 0 ? x + 10 : x - 10
        l.line.setAttribute('points', `${x.toFixed(1)},${y.toFixed(1)} ${elbow.toFixed(1)},${y.toFixed(1)} ${a.x.toFixed(1)},${a.y.toFixed(1)}`)
        l.dot.setAttribute('cx', a.x.toFixed(1))
        l.dot.setAttribute('cy', a.y.toFixed(1))
      })
    })
  }

  /** Particles streaming along the step's path (CSF flow, a circuit), drawn over the ghosts. */
  private buildFlow(st: LessonStage | null) {
    const drop = (g: T.Group) => {
      this.scene.remove(g)
      g.traverse((o) => {
        if (o instanceof T.Mesh || o instanceof LineSegments2) {
          o.geometry.dispose()
          ;(o.material as T.Material).dispose()
        }
      })
    }
    for (const f of this.flows) drop(f.group)
    this.flows = []
    for (const m of this.lesionMarks) drop(m.group)
    this.lesionMarks = []
    if (!st) return
    const res = [this.host.clientWidth, this.host.clientHeight] as const
    const segLine = (pts: T.Vector3[], color: string, opacity: number, dashed: boolean) => {
      const pos: number[] = []
      for (let i = 0; i < pts.length - 1; i++) {
        // A dashed stretch: every other pair of segments left out.
        if (dashed && i % 4 >= 2) continue
        pos.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z)
      }
      const geo = new LineSegmentsGeometry()
      geo.setPositions(pos)
      const mat = new LineMaterial({ color, linewidth: 2, transparent: true, opacity, depthTest: false })
      mat.resolution.set(res[0], res[1])
      const line = new LineSegments2(geo, mat)
      line.renderOrder = 30
      return line
    }
    for (const fl of st.flows) {
      const loop = fl.loop
      const curve = new T.CatmullRomCurve3(fl.path.map(mniToScene), loop, 'centripetal')
      const group = new T.Group()
      const samples = curve.getSpacedPoints(240)
      // A cut stream stops at the sample nearest the lesion (if the course passes within reach of it).
      let end = 1
      let cutAt = samples.length - 1
      if (fl.cut) {
        const c = mniToScene(fl.cut)
        let best = Infinity
        samples.forEach((p, i) => {
          const d = p.distanceTo(c)
          if (d < best) ((best = d), (cutAt = i))
        })
        if (best < 30) end = cutAt / (samples.length - 1)
        else cutAt = samples.length - 1
      }
      const lines = [segLine(samples.slice(0, cutAt + 1), fl.color, 0.45, false)]
      // Beyond the lesion: the disconnected stretch, dark and dashed.
      if (cutAt < samples.length - 1) lines.push(segLine(samples.slice(cutAt), '#5a6270', 0.55, true))
      for (const l of lines) group.add(l)
      const length = curve.getLength() * end
      const n = Math.max(5, Math.round(length / 14))
      const dotGeo = new T.SphereGeometry(1.1, 12, 8)
      const dots: T.Mesh[] = []
      for (let i = 0; i < n; i++) {
        const d = new T.Mesh(dotGeo, new T.MeshBasicMaterial({ color: fl.color, transparent: true, depthTest: false }))
        d.renderOrder = 31
        d.raycast = () => {}
        group.add(d)
        dots.push(d)
      }
      this.scene.add(group)
      // ~22 mm/s: slow enough to follow with the eye.
      this.flows.push({ group, curve, dots, lines, loop, t: 0, period: Math.max(3, length / 22), end })
    }
    for (const les of st.lesions) {
      const group = new T.Group()
      group.position.copy(mniToScene(les.at))
      const color = les.color ?? '#ff3b30'
      const core = new T.Mesh(
        new T.SphereGeometry(les.r, 32, 20),
        new T.MeshBasicMaterial({ color, transparent: true, opacity: les.dim ? 0.2 : 0.42, depthTest: false, depthWrite: false }),
      )
      core.renderOrder = 32
      const halo = new T.Mesh(
        new T.SphereGeometry(les.r * 1.45, 32, 20),
        new T.MeshBasicMaterial({ color, transparent: true, opacity: les.dim ? 0.05 : 0.14, depthTest: false, depthWrite: false }),
      )
      halo.renderOrder = 32
      core.raycast = () => {}
      halo.raycast = () => {}
      group.add(halo, core)
      this.scene.add(group)
      this.lesionMarks.push({ group, halo, t: 0 })
    }
  }

  // ── Frame loop ──────────────────────────────────────────────────────

  private animate = () => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.animate)
    this.timer.update()
    const dt = Math.min(this.timer.getDelta(), 0.05)
    const s = this.state
    if (!s) return
    // The plate viewer covers the whole scene: skip the frame work (state changes made meanwhile
    // are picked up through `last` the moment it closes).
    if (s.sectionId) return
    const last = this.last
    const first = last === null
    // A later addGeometries() resets `last` to re-run visibility; that must
    // not re-frame the camera the way the very first frame does.
    const firstEver = first && !this.framedOnce

    // Colour mode: light rig, tone curve and every part's surface. Runs
    // before the lesson pass, which may repaint `base` on top of it.
    if (first || last.theme !== s.theme) {
      const th = THEMES[s.theme]
      this.renderer.setClearColor(th.clear)
      this.hemi.color.set(th.hemiSky)
      this.hemi.groundColor.set(th.hemiGround)
      const u = (this.ground.material as T.ShaderMaterial).uniforms
      u.pad.value.set(th.ground)
      u.sky.value.set(th.clear)
    }
    if (first || last.colorMode !== s.colorMode || last.theme !== s.theme) {
      const rig = RIGS[s.colorMode]
      this.renderer.toneMapping = rig.tone
      this.renderer.toneMappingExposure = rig.exposure
      this.hemi.intensity = rig.hemi * THEMES[s.theme].ambient
      this.keyLight.intensity = rig.key
      this.rimLight.intensity = rig.rim
      this.fillLight.intensity = rig.fill
      for (const p of this.parts) {
        const color = applyColorMode(p.mesh.material, s.colorMode)
        // In a lesson `base` holds a teaching colour; the mode's colour waits in atlasBase.
        if (p.atlasBase) p.atlasBase.copy(color)
        else {
          p.mesh.material.userData.base.copy(color)
          ;(p.mesh.children[0] as T.Mesh<T.BufferGeometry, T.MeshBasicMaterial> | undefined)?.material.color.copy(color).multiplyScalar(0.82)
          tint(p.mesh.material, p.selectedAmount, p.hoverAmount)
        }
      }
      this.dirty = true
    }

    // Cross-section planes: each is pushed far away (huge constant) to
    // disable it entirely when off, cheaper than toggling clippingPlanes
    // arrays on every material.
    if (first || last.cutaway !== s.cutaway || last.clip.sagittal !== s.clip.sagittal || last.clip.coronal !== s.clip.coronal || last.clip.axial !== s.clip.axial) {
      this.updateClipPlane('sagittal', 0, s)
      this.updateClipPlane('coronal', 1, s)
      this.updateClipPlane('axial', 2, s)
      this.dirty = true
    }
    // Oblique section cut (sections mode); built markers give the framing box.
    const cutKey = s.mode === 'learn' ? (s.sectionCut ?? '') : ''
    if (cutKey !== this.cutKey) {
      if (cutKey && !this.markersBuilt) {
        this.buildMarkers()
        this.setMarkerNames(this.markerNames)
      }
      this.cutKey = cutKey
      this.applySectionCut(cutKey || null)
      this.dirty = true
    }
    const axes: ClipAxis[] = ['sagittal', 'coronal', 'axial']
    for (let i = 0; i < 3; i++) {
      const visible = s.cutaway && !s.isolate && s.clip[axes[i]].enabled
      if (this.clipIndicators[i].visible !== visible) {
        this.clipIndicators[i].visible = visible
        this.dirty = true
      }
    }

    // Explode amount chases the slider.
    const moving = Math.abs(this.amount - s.explode) > 0.0005
    if (moving) {
      this.amount = T.MathUtils.damp(this.amount, s.explode, 9, dt)
      if (Math.abs(this.amount - s.explode) < 0.0005) this.amount = s.explode
    }

    // Visibility: a structure shows when its system and its layer are both
    // on, or when it is selected; isolate shows only the selection.
    const visibleSet = new Set(s.visible),
      layerSet = new Set(s.layers),
      selection = new Set(s.selected)
    // Peel depth chases the slider; each shell fades over one slider step
    // so the strip reads as "lifting away" rather than popping.
    const peeling = Math.abs(this.peel - s.peel) > 0.0005
    if (peeling) {
      this.peel = T.MathUtils.damp(this.peel, s.peel, 10, dt)
      if (Math.abs(this.peel - s.peel) < 0.0005) this.peel = s.peel
    }
    const shells = Math.max(1, DEPTH_LEVELS.length - 1)
    let lessonEnded = false
    if (s.lesson) this.stageLesson(s, dt)
    else if (this.lessonActive) {
      this.endLesson()
      lessonEnded = true
    }
    const visibilityChanged =
      first || peeling || lessonEnded || last.visible !== s.visible || last.layers !== s.layers || last.selected !== s.selected || last.isolate !== s.isolate
    if (visibilityChanged && !s.lesson) {
      // A finer layer replaces the gross part it subdivides (parcellation →
      // cortex, brainstem layer → pons/medulla) rather than hiding inside it.
      const coveredSet = coveredIds(s.layers)
      for (const p of this.parts) {
        const covered = coveredSet.has(p.id)
        const shown = s.isolate ? selection.has(p.id) : (visibleSet.has(p.system) && layerSet.has(p.layer) && !covered) || selection.has(p.id)
        const peelAmount = selection.has(p.id) || s.isolate ? 1 : T.MathUtils.clamp(p.depth - this.peel * shells + 1, 0, 1)
        if (peelAmount !== p.peelAmount) {
          p.peelAmount = peelAmount
          const m = p.mesh.material
          m.transparent = peelAmount < 1
          m.opacity = peelAmount
          m.depthWrite = peelAmount >= 1
        }
        p.mesh.visible = shown && peelAmount > 0.01
      }
      this.dirty = true
    }
    this.ground.visible = !s.isolate && this.amount < 0.45 && !this.orActive
    this.updateCaps(s, visibilityChanged)
    if (lessonEnded) this.frameFor(s, true)

    // Offsets.
    if (moving || visibilityChanged) {
      this.updateLayout(this.parts.filter((p) => p.mesh.visible))
      this.applyOffsets()
      this.dirty = true
    }

    // Camera framing.
    const viewChanged = first || last.resetTick !== s.resetTick || last.view !== s.view
    const isolateKey = s.isolate ? `${s.selected.join(',')}:${s.inspectorOpen}` : ''
    const isolateChanged = isolateKey !== this.isolateKey
    const selectionKey = s.selected.join(',')
    const selectionChanged = !first && selectionKey !== this.selectionKey
    this.selectionKey = selectionKey
    if (this.orActive) {
      // The room owns the camera: no atlas framing while it is on.
      this.isolateKey = isolateKey
      this.lastFitAmount = this.amount
      this.lastFitPeel = this.peel
    } else if (firstEver || (!first && (viewChanged || isolateChanged))) {
      this.framedOnce = true
      this.frameFor(s, !firstEver)
      this.isolateKey = isolateKey
      this.lastFitAmount = this.amount
    } else if (selectionChanged && !s.isolate) {
      // Selecting a structure makes it the thing the camera turns around;
      // clearing the selection hands the pivot back to the whole brain.
      const centre = s.selected.length ? this.selectionCentre(s.selected) : null
      if (centre) this.pivotTo(centre, true)
      else this.frameFor(s, true)
    } else if (moving && !s.isolate && this.amount > 0.02) {
      // Follow the expanding assembly while the slider moves.
      this.frameFor(s, false)
      this.lastFitAmount = this.amount
    } else if (!moving && this.lastFitAmount > 0.02 && this.amount < 0.02) {
      this.frameFor(s, true)
      this.lastFitAmount = 0
    } else if (!peeling && this.peel !== this.lastFitPeel) {
      // Once the shells have settled, refit so the (smaller) remaining
      // structures fill the frame, and hand the pivot to them.
      this.lastFitPeel = this.peel
      this.frameFor(s, true)
    }

    // Lesson flow particles run continuously.
    for (const f of this.flows) {
      f.t = (f.t + dt / f.period) % 1
      const n = f.dots.length
      f.dots.forEach((d, i) => {
        const k = (f.t + i / n) % 1
        f.curve.getPointAt(k * f.end, d.position)
        // Open paths fade in at the source and out at the exit (or into the lesion).
        const m = d.material as T.MeshBasicMaterial
        m.opacity = f.loop ? 0.95 : 0.95 * Math.min(1, k * 8, (1 - k) * 8)
      })
      this.dirty = true
    }
    for (const L of this.lesionMarks) {
      L.t += dt
      L.halo.scale.setScalar(1 + 0.12 * Math.sin(L.t * 2.6))
      this.dirty = true
    }

    // Camera fly-to.
    if (this.fly) {
      this.fly.t = Math.min(1, this.fly.t + dt / 0.75)
      const k = 1 - Math.pow(1 - this.fly.t, 3)
      this.camera.position.lerp(this.fly.pos, k)
      this.controls.target.lerp(this.fly.target, k)
      if (this.fly.fov) {
        this.camera.fov = this.fly.fov.from + (this.fly.fov.to - this.fly.fov.from) * k
        this.camera.updateProjectionMatrix()
      }
      if (this.fly.t >= 1) this.fly = null
      this.dirty = true
    }

    // Hover raycast (once per frame at most).
    if (this.pendingHover) {
      this.setHovered(this.pick(this.pendingHover.x, this.pendingHover.y))
      this.pendingHover = null
    }

    // Smooth highlight amounts.
    for (const p of this.parts) {
      const targetSel = selection.has(p.id) || (s.lessonPick !== null && p.id === s.lessonPick) ? 1 : 0
      const targetHov = p.id === this.hoveredId ? 1 : 0
      if (Math.abs(p.selectedAmount - targetSel) > 0.002 || Math.abs(p.hoverAmount - targetHov) > 0.002) {
        p.selectedAmount = T.MathUtils.damp(p.selectedAmount, targetSel, 14, dt)
        p.hoverAmount = T.MathUtils.damp(p.hoverAmount, targetHov, 18, dt)
        tint(p.mesh.material, p.selectedAmount, p.hoverAmount)
        this.dirty = true
      }
    }

    // Controls behave like a 2D board once the inventory is laid out.
    const board = this.amount > 0.8
    const c = this.controls
    c.enableRotate = !board
    c.mouseButtons.LEFT = board ? T.MOUSE.PAN : T.MOUSE.ROTATE
    c.touches.ONE = board ? T.TOUCH.PAN : T.TOUCH.ROTATE
    c.zoomToCursor = !s.isolate
    c.autoRotate = s.autoRotate && !s.isolate && this.amount < 0.4
    c.autoRotateSpeed = 0.6
    c.update()
    if (c.autoRotate) this.dirty = true

    this.last = s
    if (this.dirty) this.settle = Math.max(this.settle, 3)
    if (this.settle > 0) {
      this.settle--
      // Labels and markers are projected through the same (head-coupled) camera the frame is drawn with.
      this.withEye(() => {
        this.draw(s)
        this.updateLabels()
        this.updateMarkers()
        this.updateLessonLabels()
      })
      this.dirty = false
    }
  }

  /**
   * Crease shadows only where they are right: the model whole (nothing exploded, peeled, cut, isolated or
   * in a lesson — the occlusion pass sees every mesh as solid and unclipped) and the camera at rest.
   */
  private aoWanted(s: SceneSnapshot) {
    return (
      s.ao &&
      !this.orActive &&
      !this.interacting &&
      performance.now() > this.eyeMovingUntil &&
      this.amount < 0.02 &&
      this.peel < 0.005 &&
      !s.cutaway &&
      !s.isolate &&
      !s.lesson &&
      !this.cutKey &&
      !s.sectionId
    )
  }

  private draw(s: SceneSnapshot) {
    // The frame is drawn as ever (tone curve, MSAA, background untouched); the occlusion is computed
    // from depth and normals and multiplied over it.
    this.renderer.render(this.scene, this.camera)
    if (!this.aoWanted(s)) return
    if (!this.aoPipe) {
      if (!this.aoLoading) this.loadAo()
      return
    }
    const { pass, quad, mat } = this.aoPipe
    // Atlas colours are flat and bright: the creases get a lighter touch there.
    mat.uniforms.strength.value = s.colorMode === 'real' ? 1 : 0.7
    // Depth and normals cost a second pass over every mesh: redo them only when the view or what is shown changed
    // (hover and selection fades repaint the colours, not the creases).
    const key = `${this.camera.matrixWorld.elements.join()}|${this.camera.projectionMatrix.elements[0]}|${this.host.clientWidth}x${this.host.clientHeight}|${s.visible.join()}|${JSON.stringify(s.layers)}|${this.parts.length}`
    if (key !== this.aoKey) {
      pass.render(this.renderer, null as unknown as T.WebGLRenderTarget, null as unknown as T.WebGLRenderTarget, 0, false)
      this.aoKey = key
    }
    mat.uniforms.tAO.value = pass.gtaoMap
    this.renderer.setRenderTarget(null)
    const auto = this.renderer.autoClear
    this.renderer.autoClear = false
    quad.render(this.renderer)
    this.renderer.autoClear = auto
  }

  private async loadAo() {
    this.aoLoading = true
    try {
      const [{ GTAOPass }, { FullScreenQuad }] = await Promise.all([import('three/examples/jsm/postprocessing/GTAOPass.js'), import('three/examples/jsm/postprocessing/Pass.js')])
      if (this.disposed) return
      const pass = new GTAOPass(this.scene, this.camera, this.host.clientWidth, this.host.clientHeight)
      pass.output = GTAOPass.OUTPUT.Off
      // Scene units are millimetres: a sulcus is 2–6 mm wide, so the sampling radius is a few of them.
      pass.updateGtaoMaterial({ radius: 4, distanceExponent: 1.6, thickness: 2, scale: 1, samples: 24, distanceFallOff: 1 })
      pass.updatePdMaterial({ lumaPhi: 14, depthPhi: 1.5, normalPhi: 4, radius: 8, radiusExponent: 1, rings: 3, samples: 24 })
      const mat = new T.ShaderMaterial({
        uniforms: { tAO: { value: null }, strength: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader:
          'uniform sampler2D tAO; uniform float strength; varying vec2 vUv; void main() { float ao = texture2D(tAO, vUv).r; gl_FragColor = vec4(vec3(mix(1.0, ao, strength)), 1.0); }',
        // result = frame × occlusion
        blending: T.CustomBlending,
        blendEquation: T.AddEquation,
        blendSrc: T.ZeroFactor,
        blendDst: T.SrcColorFactor,
        depthTest: false,
        depthWrite: false,
        transparent: true,
      })
      this.aoPipe = { pass, quad: new FullScreenQuad(mat), mat }
      this.dirty = true
    } catch (e) {
      console.warn('Crease shadows unavailable', e)
    }
  }

  /**
   * The model as it is on screen, as a JPEG data URL no larger than
   * `maxSide` px (for the AI tutor, AI-4). The drawing buffer is not kept
   * between frames, so the frame is rendered and copied in the same task.
   * HTML overlays (labels, markers) are not part of the canvas.
   */
  snapshot(maxSide = 1280): string {
    this.renderer.render(this.scene, this.camera)
    const src = this.renderer.domElement
    const k = Math.min(1, maxSide / Math.max(src.width, src.height))
    const out = document.createElement('canvas')
    out.width = Math.round(src.width * k)
    out.height = Math.round(src.height * k)
    out.getContext('2d')!.drawImage(src, 0, 0, out.width, out.height)
    return out.toDataURL('image/jpeg', 0.88)
  }
}

/** Ease-in-out so pieces settle gently at both ends of a phase. */
function smooth(t: number) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}
