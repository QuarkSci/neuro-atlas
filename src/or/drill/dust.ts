/**
 * SX-4 bone drilling feel: per-layer feel table, bilingual layer names, and Three.js bone-dust emitter (AG-17).
 *
 * Implements `CreateDust` / `DustEmitter`, `LayerFeel`, and `LayerNames` from `src/or/drill/types.ts`.
 * Coordinates enter in MNI mm and are converted to Three.js scene space (`mniToScene`).
 * In the operating room scene (`src/or/room.ts`), `+z` is up (patient anterior), so dust gravity acts along `-z`.
 */
import * as THREE from 'three'
import { mniToScene } from '../types'
import type { BoneLayer, CreateDust, DrillState, DustEmitter, DustOptions, LayerFeel, LayerNames } from './types'

/** Per-layer acoustic & dust profile (simulator design choices matching surgical cranial burr feel). */
export const LAYER_FEEL: Record<BoneLayer, LayerFeel> = {
  air: {
    layer: 'air',
    dustColor: '#ffffff',
    dustAmount: 0,
    pitch: 1.0,
    load: 0,
    note: 'Free-spinning burr in air: no dust, no load.',
  },
  scalp: {
    layer: 'scalp',
    dustColor: '#c87a6e',
    dustAmount: 0.08,
    pitch: 0.94,
    load: 0.15,
    note: 'Soft scalp tissue: minimal mist, light drag.',
  },
  'outer-table': {
    layer: 'outer-table',
    dustColor: '#efe6d5',
    dustAmount: 0.95,
    pitch: 1.08,
    load: 0.78,
    note: 'Dense cortical outer table: heavy ivory bone dust, high crisp pitch, strong load.',
  },
  diploe: {
    layer: 'diploe',
    dustColor: '#b96b5a',
    dustAmount: 0.75,
    pitch: 0.82,
    load: 0.45,
    note: 'Spongy diploe with marrow: pitch drops noticeably, darker reddish-tan dust.',
  },
  'inner-table': {
    layer: 'inner-table',
    dustColor: '#f2eadc',
    dustAmount: 0.9,
    pitch: 1.14,
    load: 0.85,
    note: 'Thin dense inner table: sharp high-pitched whine just before breakthrough.',
  },
  dura: {
    layer: 'dura',
    dustColor: '#d88a8a',
    dustAmount: 0.05,
    pitch: 0.72,
    load: 0.25,
    note: 'Fibrous dura mater: sudden resistance drop — stop immediately.',
  },
  brain: {
    layer: 'brain',
    dustColor: '#d89b96',
    dustAmount: 0,
    pitch: 0.68,
    load: 0.1,
    note: 'Brain parenchyma: no bone dust.',
  },
}

/** Plain-language layer names for the drilling HUD (`uz` / `en`). */
export const LAYER_NAMES: LayerNames = {
  air: { uz: 'Havo', en: 'Air' },
  scalp: { uz: 'Bosh terisi', en: 'Scalp' },
  'outer-table': { uz: 'Tashqi suyak plastinkasi', en: 'Outer table' },
  diploe: { uz: 'Diploe (g‘ovak qatlam)', en: 'Diploe (spongy bone)' },
  'inner-table': { uz: 'Ichki suyak plastinkasi', en: 'Inner table' },
  dura: { uz: 'Qattiq miya pardasi (Dura)', en: 'Dura mater' },
  brain: { uz: 'Miya parenximasi', en: 'Brain parenchyma' },
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Gravity in OR scene space (mm/s², acting along `-z` since `+z` is patient anterior / room up). */
const GRAVITY_Z_MM_S2 = -260

/**
 * Create a zero-allocation ring-buffered Three.js `Points` bone-dust emitter.
 */
export const createDust: CreateDust = (opts?: DustOptions): DustEmitter => {
  const max = Math.max(16, opts?.max ?? 600)

  const positions = new Float32Array(max * 3)
  const colors = new Float32Array(max * 3)
  const vx = new Float32Array(max)
  const vy = new Float32Array(max)
  const vz = new Float32Array(max)
  const age = new Float32Array(max)
  const life = new Float32Array(max)
  const baseR = new Float32Array(max)
  const baseG = new Float32Array(max)
  const baseB = new Float32Array(max)

  let count = 0
  let spawnCarry = 0

  const geometry = new THREE.BufferGeometry()
  const posAttr = new THREE.BufferAttribute(positions, 3)
  const colAttr = new THREE.BufferAttribute(colors, 3)
  posAttr.setUsage(THREE.DynamicDrawUsage)
  colAttr.setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('position', posAttr)
  geometry.setAttribute('color', colAttr)
  geometry.setDrawRange(0, 0)

  const material = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
  })

  const points = new THREE.Points(geometry, material)
  points.name = 'drill-dust'
  points.frustumCulled = false

  const tmpColor = new THREE.Color()
  const ax = new THREE.Vector3()
  const u = new THREE.Vector3()
  const v = new THREE.Vector3()
  const upRef = new THREE.Vector3(0, 0, 1)
  const altRef = new THREE.Vector3(1, 0, 0)

  const swapRemove = (i: number) => {
    const last = count - 1
    if (i !== last) {
      positions[i * 3] = positions[last * 3]
      positions[i * 3 + 1] = positions[last * 3 + 1]
      positions[i * 3 + 2] = positions[last * 3 + 2]
      colors[i * 3] = colors[last * 3]
      colors[i * 3 + 1] = colors[last * 3 + 1]
      colors[i * 3 + 2] = colors[last * 3 + 2]
      vx[i] = vx[last]
      vy[i] = vy[last]
      vz[i] = vz[last]
      age[i] = age[last]
      life[i] = life[last]
      baseR[i] = baseR[last]
      baseG[i] = baseG[last]
      baseB[i] = baseB[last]
    }
    count = last
  }

  const update = (rawDt: number, s: DrillState) => {
    const dt = clamp(Number.isFinite(rawDt) ? rawDt : 0, 0, 0.1)
    let dirty = false

    // 1. Advance and expire existing particles
    const drag = Math.exp(-3.2 * dt)
    for (let i = count - 1; i >= 0; i--) {
      age[i] += dt
      if (age[i] >= life[i]) {
        swapRemove(i)
        dirty = true
        continue
      }
      vx[i] *= drag
      vy[i] *= drag
      vz[i] = vz[i] * drag + GRAVITY_Z_MM_S2 * dt
      positions[i * 3] += vx[i] * dt
      positions[i * 3 + 1] += vy[i] * dt
      positions[i * 3 + 2] += vz[i] * dt

      const fade = 1 - age[i] / life[i]
      colors[i * 3] = baseR[i] * fade
      colors[i * 3 + 1] = baseG[i] * fade
      colors[i * 3 + 2] = baseB[i] * fade
      dirty = true
    }

    // 2. Spawn new bone-dust particles while cutting
    const feel = LAYER_FEEL[s.layer]
    if (s.running && s.speedMmS > 0 && feel.dustAmount > 0 && dt > 0) {
      const rpmNorm = clamp(s.rpm / Math.max(1, s.maxRpm), 0, 1)
      const ratePerSec = feel.dustAmount * (45 + 160 * rpmNorm) * clamp(0.4 + s.speedMmS * 0.35, 0.4, 2.2)
      spawnCarry += ratePerSec * dt + Math.max(0, s.removedMm3) * 8 * feel.dustAmount
      const toSpawn = Math.min(Math.floor(spawnCarry), max - count)
      spawnCarry -= Math.floor(spawnCarry)

      if (toSpawn > 0) {
        const tipS = mniToScene(s.tip)
        const axisS = mniToScene(s.axis)
        ax.set(axisS[0], axisS[1], axisS[2])
        if (ax.lengthSq() < 1e-6) ax.set(0, 0, -1)
        else ax.normalize()

        // Orthonormal basis perpendicular to the drill axis for radial spray
        u.crossVectors(ax, Math.abs(ax.z) < 0.9 ? upRef : altRef).normalize()
        v.crossVectors(ax, u).normalize()
        tmpColor.set(feel.dustColor)

        for (let k = 0; k < toSpawn; k++) {
          const i = count++
          const theta = Math.random() * Math.PI * 2
          const jitter = Math.random() * 1.6
          const cosT = Math.cos(theta)
          const sinT = Math.sin(theta)

          positions[i * 3] = tipS[0] + (u.x * cosT + v.x * sinT) * jitter
          positions[i * 3 + 1] = tipS[1] + (u.y * cosT + v.y * sinT) * jitter
          positions[i * 3 + 2] = tipS[2] + (u.z * cosT + v.z * sinT) * jitter

          // Eject out of the burr hole (-ax) plus radial swirl
          const backSpd = 18 + Math.random() * 42 * (0.4 + 0.6 * rpmNorm)
          const radSpd = 14 + Math.random() * 38 * (0.4 + 0.6 * rpmNorm)
          vx[i] = -ax.x * backSpd + (u.x * cosT + v.x * sinT) * radSpd
          vy[i] = -ax.y * backSpd + (u.y * cosT + v.y * sinT) * radSpd
          vz[i] = -ax.z * backSpd + (u.z * cosT + v.z * sinT) * radSpd

          age[i] = 0
          life[i] = 0.25 + Math.random() * 0.45

          const shade = 0.85 + Math.random() * 0.15
          baseR[i] = tmpColor.r * shade
          baseG[i] = tmpColor.g * shade
          baseB[i] = tmpColor.b * shade
          colors[i * 3] = baseR[i]
          colors[i * 3 + 1] = baseG[i]
          colors[i * 3 + 2] = baseB[i]
        }
        dirty = true
      }
    }

    if (dirty) {
      geometry.setDrawRange(0, count)
      posAttr.needsUpdate = true
      colAttr.needsUpdate = true
    }
  }

  const clear = () => {
    count = 0
    spawnCarry = 0
    geometry.setDrawRange(0, 0)
  }

  const dispose = () => {
    clear()
    geometry.dispose()
    material.dispose()
  }

  return { object: points, update, clear, dispose }
}
