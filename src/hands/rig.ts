import * as T from 'three'
import { BONES, MIDDLE_MCP, PALM, THUMB_TIP, INDEX_TIP, WRIST, type Pt } from './types'
import { imageToScreen } from './mapping'

/**
 * The person's hands drawn in front of the atlas, as if reaching into it.
 *
 * Shape comes from MediaPipe's metric world landmarks; where the hand sits on
 * screen comes from the image landmarks, and how far away it is from its
 * apparent size, so pushing a hand towards the camera brings it forward. The
 * hands live in their own transparent canvas and camera: they never touch the
 * brain's renderer, its materials or its clip planes.
 */

const FOV = 40
/** Drawn hands are a little smaller than life, so they point at the atlas without covering it. */
const HAND_SCALE = 0.85

const VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  vP = mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`

/** Frosted glass: a soft body, a bright fresnel rim, and the rim warms while pinching. */
const FRAG = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uRim;
uniform vec3 uAccent;
uniform float uPinch;
uniform float uOpacity;
uniform vec3 uWrist;
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV);
  float facing = clamp(abs(dot(n, v)), 0.0, 1.0);
  float f = pow(1.0 - facing, 2.2);
  float key = clamp(dot(n, normalize(vec3(-0.35, 0.8, 0.55))), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-normalize(vec3(-0.35, 0.8, 0.55)), n), v), 0.0, 1.0), 24.0);
  vec3 rim = mix(uRim, uAccent, uPinch);
  vec3 col = uBase * (0.62 + 0.38 * key) + rim * f * 1.4 + vec3(spec * 0.4);
  // The hand dissolves towards the wrist instead of ending in a cut.
  float wrist = mix(0.12, 1.0, smoothstep(0.0, 0.045, distance(vP, uWrist)));
  float a = (0.4 + 0.55 * f + spec * 0.3) * uOpacity * wrist;
  gl_FragColor = vec4(col, a);
}`

export interface HandPose {
  side: 'left' | 'right'
  image: Pt[]
  world: Pt[]
  /** 0 open … 1 pinched (smoothed, for the look only). */
  pinch: number
}

const THEMES = {
  dark: { base: new T.Color('#e4ecf7'), rim: new T.Color('#9ad6ff'), accent: new T.Color('#ffc56b') },
  light: { base: new T.Color('#f4f7fb'), rim: new T.Color('#3d8be0'), accent: new T.Color('#e8900f') },
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const t = new T.CanvasTexture(c)
  t.colorSpace = T.SRGBColorSpace
  return t
}

const UP = new T.Vector3(0, 1, 0)

class HandMesh {
  readonly group = new T.Group()
  readonly glow = new T.Group()
  readonly material: T.ShaderMaterial
  private joints: T.Mesh[] = []
  private bones: T.Mesh[] = []
  private palm: T.Mesh
  private palmGeo = new T.BufferGeometry()
  private tips: T.Sprite[] = []
  /** Scene-space landmark positions of the last pose. */
  readonly pts = Array.from({ length: 21 }, () => new T.Vector3())
  opacity = 0
  present = false
  pinch = 0

  constructor(sphere: T.BufferGeometry, cylinder: T.BufferGeometry, glowTex: T.Texture) {
    this.material = new T.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthFunc: T.LessEqualDepth,
      side: T.DoubleSide,
      uniforms: {
        uBase: { value: new T.Color() },
        uRim: { value: new T.Color() },
        uAccent: { value: new T.Color() },
        uPinch: { value: 0 },
        uOpacity: { value: 0 },
        uWrist: { value: new T.Vector3() },
      },
    })
    for (let i = 0; i < 21; i++) {
      const m = new T.Mesh(sphere, this.material)
      this.joints.push(m)
      this.group.add(m)
    }
    for (let i = 0; i < BONES.length; i++) {
      const m = new T.Mesh(cylinder, this.material)
      this.bones.push(m)
      this.group.add(m)
    }
    // Palm: a fan around its centre (index 0) through the six rim landmarks.
    this.palmGeo.setAttribute('position', new T.BufferAttribute(new Float32Array((PALM.length + 1) * 3), 3))
    const idx: number[] = []
    for (let i = 0; i < PALM.length; i++) idx.push(0, i + 1, ((i + 1) % PALM.length) + 1)
    this.palmGeo.setIndex(idx)
    this.palm = new T.Mesh(this.palmGeo, this.material)
    this.group.add(this.palm)
    for (const _ of [THUMB_TIP, INDEX_TIP]) {
      const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, blending: T.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true }))
      this.tips.push(s)
      this.glow.add(s)
    }
  }

  /** Radius (m) of the tube at landmark i: thick at the knuckles, slim at the tips. */
  private static radius(i: number) {
    if (i === WRIST) return 0.012
    const k = (i - 1) % 4 // 0 base … 3 tip
    const thumb = i <= 4
    return (thumb ? 0.0105 : 0.0095) - k * 0.00085
  }

  place(points: T.Vector3[]) {
    for (let i = 0; i < 21; i++) this.pts[i].copy(points[i])
    for (let i = 0; i < 21; i++) {
      const r = HandMesh.radius(i)
      this.joints[i].position.copy(points[i])
      this.joints[i].scale.setScalar(r)
    }
    const dir = new T.Vector3()
    BONES.forEach(([a, b], i) => {
      const m = this.bones[i]
      dir.subVectors(points[b], points[a])
      const len = dir.length()
      m.position.addVectors(points[a], points[b]).multiplyScalar(0.5)
      const r = Math.min(HandMesh.radius(a), HandMesh.radius(b))
      m.scale.set(r, Math.max(1e-4, len), r)
      if (len > 1e-6) m.quaternion.setFromUnitVectors(UP, dir.multiplyScalar(1 / len))
    })
    const pos = this.palmGeo.getAttribute('position') as T.BufferAttribute
    const centre = new T.Vector3()
    PALM.forEach((j) => centre.add(points[j]))
    centre.multiplyScalar(1 / PALM.length)
    pos.setXYZ(0, centre.x, centre.y, centre.z)
    PALM.forEach((j, i) => pos.setXYZ(i + 1, points[j].x, points[j].y, points[j].z))
    pos.needsUpdate = true
    this.palmGeo.computeVertexNormals()
    this.palmGeo.computeBoundingSphere()
    // The hand camera never moves, so scene space is view space.
    this.material.uniforms.uWrist.value.copy(points[WRIST])
    this.tips[0].position.copy(points[THUMB_TIP])
    this.tips[1].position.copy(points[INDEX_TIP])
  }

  setLook(theme: 'dark' | 'light', dt: number) {
    const target = this.present ? 1 : 0
    this.opacity = T.MathUtils.damp(this.opacity, target, this.present ? 10 : 4, dt)
    const u = this.material.uniforms
    const c = THEMES[theme]
    u.uBase.value.copy(c.base)
    u.uRim.value.copy(c.rim)
    u.uAccent.value.copy(c.accent)
    u.uPinch.value = this.pinch
    u.uOpacity.value = this.opacity
    this.group.visible = this.glow.visible = this.opacity > 0.01
    const tint = new T.Color().copy(c.rim).lerp(c.accent, this.pinch)
    for (const s of this.tips) {
      const m = s.material as T.SpriteMaterial
      m.color.copy(tint)
      m.opacity = this.opacity * (0.35 + 0.65 * this.pinch)
      s.scale.setScalar(0.028 + 0.02 * this.pinch)
    }
  }
}

export class HandRig {
  readonly renderer: T.WebGLRenderer
  readonly camera = new T.PerspectiveCamera(FOV, 1, 0.01, 20)
  private scene = new T.Scene()
  private glowScene = new T.Scene()
  private depthOnly = new T.MeshBasicMaterial({ colorWrite: false, side: T.DoubleSide })
  private hands: Record<'left' | 'right', HandMesh>
  private w = 1
  private h = 1
  theme: 'dark' | 'light' = 'dark'

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true })
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.autoClear = false
    const sphere = new T.SphereGeometry(1, 20, 14)
    const cylinder = new T.CylinderGeometry(1, 1, 1, 18, 1, true)
    const tex = glowTexture()
    this.hands = { left: new HandMesh(sphere, cylinder, tex), right: new HandMesh(sphere, cylinder, tex) }
    for (const h of Object.values(this.hands)) {
      this.scene.add(h.group)
      this.glowScene.add(h.glow)
    }
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w)
    this.h = Math.max(1, h)
    this.renderer.setSize(this.w, this.h, false)
    this.camera.aspect = this.w / this.h
    this.camera.updateProjectionMatrix()
  }

  /** Lay out every hand in this frame; hands not in it fade out where they were. */
  update(poses: HandPose[], aspect: number) {
    const seen = new Set<string>()
    const tanHalf = Math.tan(T.MathUtils.degToRad(FOV / 2))
    for (const p of poses) {
      const hand = this.hands[p.side]
      seen.add(p.side)
      const a = imageToScreen(p.image[WRIST], aspect, this.w, this.h)
      const b = imageToScreen(p.image[MIDDLE_MCP], aspect, this.w, this.h)
      const palmPx = Math.hypot(a.x - b.x, a.y - b.y)
      const w0 = p.world[WRIST],
        w9 = p.world[MIDDLE_MCP]
      const palmM = Math.max(0.05, Math.hypot(w0.x - w9.x, w0.y - w9.y, w0.z - w9.z))
      // Depth at which the real palm length projects to its size on screen.
      const depth = T.MathUtils.clamp(palmM / (2 * tanHalf * Math.max(1e-3, palmPx / this.h)), 0.22, 3)
      const anchor = this.unproject(b.x, b.y, depth)
      const pts = p.world.map((w) => new T.Vector3(-(w.x - w9.x), -(w.y - w9.y), -(w.z - w9.z)).multiplyScalar(HAND_SCALE).add(anchor))
      hand.place(pts)
      hand.present = true
      hand.pinch = p.pinch
    }
    for (const side of ['left', 'right'] as const) if (!seen.has(side)) this.hands[side].present = false
  }

  /** The point `depth` metres in front of the camera under screen pixel (x, y). */
  private unproject(x: number, y: number, depth: number) {
    const ndc = new T.Vector3((x / this.w) * 2 - 1, -(y / this.h) * 2 + 1, 0.5).unproject(this.camera)
    return ndc.normalize().multiplyScalar(depth / -ndc.z)
  }

  /** Screen pixel of a landmark of a drawn hand (what the person sees, so the cursor agrees with the picture). */
  screenOf(side: 'left' | 'right', a: number, b?: number) {
    const h = this.hands[side]
    const v = h.pts[a].clone()
    if (b !== undefined) v.add(h.pts[b]).multiplyScalar(0.5)
    v.project(this.camera)
    return { x: ((v.x + 1) / 2) * this.w, y: ((1 - v.y) / 2) * this.h }
  }

  visible(side: 'left' | 'right') {
    return this.hands[side].opacity > 0.05
  }

  render(dt: number) {
    for (const h of Object.values(this.hands)) h.setLook(this.theme, dt)
    const r = this.renderer
    r.clear()
    // Depth first, then colour on the nearest surface only: overlapping tubes
    // read as one smooth glass hand instead of stacking into bright seams.
    this.scene.overrideMaterial = this.depthOnly
    r.render(this.scene, this.camera)
    this.scene.overrideMaterial = null
    r.render(this.scene, this.camera)
    r.render(this.glowScene, this.camera)
  }

  get anyVisible() {
    return this.hands.left.opacity > 0.01 || this.hands.right.opacity > 0.01
  }

  dispose() {
    this.renderer.dispose()
  }
}
