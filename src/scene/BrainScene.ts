import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'
import type { LayerId, Part, SystemId } from '@/data/types'
import { DEPTH_LEVELS, depthOf } from '@/data'
import type { View } from '@/store/useAtlas'
import { inventoryLayout, separationVector } from './explode'
import { createGround } from './ground'
import type { LoadedGeometry } from './loader'
import { createPartMaterial, tint, type PartMaterial } from './materials'
import { PointerTap } from './PointerTap'

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
  cutawayAngle: number
  resetTick: number
  inspectorOpen: boolean
  hovered: string | null
}

export interface SceneCallbacks {
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onError: (message: string) => void
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
}

interface Insets {
  top: number
  bottom: number
  left: number
  right: number
}

/** The atlas renders dark only. */
const THEME = { clear: '#0b0e14', ground: '#151a22', hemiSky: 0xbfcbe0, hemiGround: 0x1a1d24 } as const

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
  private env: T.Texture
  private fly: { pos: T.Vector3; target: T.Vector3; t: number } | null = null
  private isolateKey = ''
  private layoutKey = ''
  private selectionKey = ''
  /** Shared clip plane for the cutaway view; pushed far away (constant) to disable. */
  private clipPlane = new T.Plane(new T.Vector3(1, 0, 0), 1e5)
  private clipIndicator: T.Group
  /** Shared matte material for cut interiors, so a slice reads as solid tissue rather than a mirrored shell. */
  private interiorMaterial: T.MeshStandardMaterial
  private labelLayer: HTMLDivElement
  /** Assembled bounds of the whole model. */
  private modelBox = new T.Box3()
  private modelCentre = new T.Vector3()
  private modelRadius = 100
  /** Smoothed explode amount that chases the store value. */
  private amount = 0
  private lastFitAmount = -1
  /** Smoothed peel depth that chases the store value. */
  private peel = 0
  private lastFitPeel = 0

  constructor(host: HTMLElement, geometries: LoadedGeometry[], cb: SceneCallbacks) {
    this.host = host
    this.cb = cb
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
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

    // Bounds first: lights, ground, camera and the clip indicator are all sized from them.
    for (const g of geometries) this.modelBox.union(g.geometry.boundingBox!)
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
    c.addEventListener('start', () => (this.fly = null))

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

    // A gradient floor well below the brain gives the orbit a horizon without
    // reading as a table the brain sits on.
    this.ground = createGround(THEME.ground, THEME.clear, this.modelRadius * 12)
    this.ground.position.y = this.modelBox.min.y - this.modelRadius * 0.9
    this.ground.position.x = this.modelCentre.x
    this.ground.position.z = this.modelCentre.z
    this.scene.add(this.ground)

    // A closed shell's exterior material is DoubleSide, so its own backface
    // would otherwise render at the exact same depth as this interior cap
    // and win the depth test at random (z-fighting). The polygon offset
    // nudges the cap fractionally closer to the camera so it always wins.
    this.interiorMaterial = new T.MeshStandardMaterial({
      color: '#9c7f78',
      roughness: 0.95,
      metalness: 0.0,
      side: T.BackSide,
      clippingPlanes: [this.clipPlane],
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    })

    // Structure meshes.
    let seed = 0
    for (const { part, geometry } of geometries) {
      geometry.computeBoundsTree()
      const material = createPartMaterial(part.system, part.layer === 'julich', seed++)
      material.clippingPlanes = [this.clipPlane]
      const mesh = new T.Mesh(geometry, material)
      mesh.name = part.id
      // A back-facing child sharing the same geometry: invisible normally
      // (front and back faces coincide), it only becomes visible where the
      // clip plane has sliced the shell open.
      const cap = new T.Mesh(geometry, this.interiorMaterial)
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
      }
      this.parts.push(entry)
      this.byId.set(part.id, entry)
      this.scene.add(mesh)
    }

    this.clipIndicator = this.makeClipIndicator()
    this.scene.add(this.clipIndicator)

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
    this.host.addEventListener('wheel', this.onWheel, { capture: true, passive: false })

    this.animate()
  }

  // ── Public API ──────────────────────────────────────────────────────

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
    el.remove()
  }

  // ── Setup helpers ───────────────────────────────────────────────────

  /**
   * A faint quad marking the cutaway plane, plus a bright edge — the plane
   * itself has no visible thickness, so without this the "missing" half
   * would give no sense of where the cut actually is. Oriented at
   * rotation.y = 0 for a plane whose normal is +Z; the frame loop rotates the
   * whole group to match the clip plane's current angle.
   */
  private makeClipIndicator() {
    const group = new T.Group()
    const size = this.modelRadius * 2.3
    const fill = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.05, side: T.DoubleSide, depthWrite: false }))
    group.add(fill)
    const edges = new T.EdgesGeometry(new T.PlaneGeometry(size, size))
    const line = new T.LineSegments(edges, new T.LineBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.35 }))
    group.add(line)
    group.position.copy(this.modelCentre)
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
      const identity = root.querySelector('.identity')
      const topActions = root.querySelector('.top-actions')
      for (const el of [identity, topActions]) {
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.width > 0 && overlapsH(r)) grow('top', r.bottom - hostRect.top + 16)
      }
      const rail = root.querySelector('.side-rail')
      if (rail) {
        const r = rail.getBoundingClientRect()
        if (r.width > 0 && overlapsV(r)) grow('left', r.right - hostRect.left + gap)
      }
      const dock = root.querySelector('.bottom-dock')
      if (dock) {
        const r = dock.getBoundingClientRect()
        if (r.width > 0) grow('bottom', hostRect.bottom - r.top + 16)
      }
      if (mobile) {
        // Panels are bottom sheets or a top strip on narrow screens.
        const inspector = root.querySelector('.inspector.open')
        const systems = root.querySelector('.sheet.open')
        const search = root.querySelector('.search-panel')
        for (const el of [inspector, systems]) {
          if (!el) continue
          const r = (el as HTMLElement).getBoundingClientRect()
          if (r.width > 0 && overlapsH(r)) grow('bottom', hostRect.bottom - r.top + gap)
        }
        if (search) {
          const r = (search as HTMLElement).getBoundingClientRect()
          if (r.width > 0) grow('top', r.bottom - hostRect.top + gap)
        }
      } else {
        const systems = root.querySelector('.sheet.open')
        if (systems) {
          const r = systems.getBoundingClientRect()
          if (r.width > 0 && overlapsV(r)) grow('left', r.right - hostRect.left + gap)
        }
        const inspector = root.querySelector('.inspector.open')
        if (inspector) {
          const r = (inspector as HTMLElement).getBoundingClientRect()
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
  private fitBox(box: T.Box3, view: View, insets: Insets, animate: boolean, margin = 1.08) {
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
    this.goTo(centre.clone().addScaledVector(this.viewDirection(view), distance), centre, animate)
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
    if (s.isolate) {
      const box = this.visibleBox()
      if (!box.isEmpty()) this.fitBox(box, s.view, this.insets(), animate, 0.95)
      return
    }
    if (this.amount < 0.02) {
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

  private pick(x: number, y: number): string | null {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    const ndc = new T.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    this.raycaster.firstHitOnly = true
    const candidates = this.parts.filter((p) => p.mesh.visible).map((p) => p.mesh)
    const hits = this.raycaster.intersectObjects(candidates, false)
    // Respect the cutaway: a hit on the clipped-away side of the plane is
    // invisible and must not be selectable.
    for (const hit of hits) {
      if (this.clipPlane.constant >= 1e4 || this.clipPlane.distanceToPoint(hit.point) >= 0) return hit.object.name
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

  // ── Frame loop ──────────────────────────────────────────────────────

  private animate = () => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.animate)
    this.timer.update()
    const dt = Math.min(this.timer.getDelta(), 0.05)
    const s = this.state
    if (!s) return
    const last = this.last
    const first = last === null

    // Cutaway plane: rotate to the chosen azimuth, or push it far away to
    // disable clipping entirely (cheaper than toggling clippingPlanes on
    // every material).
    if (first || last.cutaway !== s.cutaway || last.cutawayAngle !== s.cutawayAngle) {
      if (s.cutaway) {
        const rad = T.MathUtils.degToRad(s.cutawayAngle)
        // Negated: we want to remove the near (camera-facing) half so the
        // cut reveals the interior toward the viewer, not the far side.
        this.clipPlane.normal.set(-Math.cos(rad), 0, -Math.sin(rad))
        this.clipPlane.constant = -this.clipPlane.normal.dot(this.modelCentre)
        this.clipIndicator.rotation.y = Math.PI / 2 - rad
      } else {
        this.clipPlane.constant = 1e5
      }
      this.dirty = true
    }
    const showIndicator = s.cutaway && !s.isolate
    if (this.clipIndicator.visible !== showIndicator) {
      this.clipIndicator.visible = showIndicator
      this.dirty = true
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
    const visibilityChanged = first || peeling || last.visible !== s.visible || last.layers !== s.layers || last.selected !== s.selected || last.isolate !== s.isolate
    if (visibilityChanged) {
      for (const p of this.parts) {
        const shown = s.isolate ? selection.has(p.id) : (visibleSet.has(p.system) && layerSet.has(p.layer)) || selection.has(p.id)
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
    this.ground.visible = !s.isolate && this.amount < 0.45

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
    if (viewChanged || isolateChanged) {
      this.frameFor(s, !first)
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

    // Camera fly-to.
    if (this.fly) {
      this.fly.t = Math.min(1, this.fly.t + dt / 0.75)
      const k = 1 - Math.pow(1 - this.fly.t, 3)
      this.camera.position.lerp(this.fly.pos, k)
      this.controls.target.lerp(this.fly.target, k)
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
      const targetSel = selection.has(p.id) ? 1 : 0
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
      this.renderer.render(this.scene, this.camera)
      this.updateLabels()
      this.dirty = false
    }
  }
}

/** Ease-in-out so pieces settle gently at both ends of a phase. */
function smooth(t: number) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}
