import * as T from 'three'
import type { LayerId, SystemId } from '@/data/types'

/**
 * `atlas`: the didactic palette — every system its own saturated hue, like a
 * printed atlas. `real`: tissue as it looks in a fresh specimen — grey and
 * white matter, arterial red, venous blue-purple, pearly nerves, ivory bone —
 * with a moist surface.
 */
export type ColorMode = 'real' | 'atlas'

interface Preset {
  color: string
  roughness: number
  /** Soft-tissue fuzz at grazing angles (0 = off). Cheap stand-in for subsurface scatter. */
  sheen?: number
  sheenColor?: string
  /** Strength of the studio reflections; higher reads as wetter. */
  env?: number
}

/**
 * Tissue looks per system. clearcoat stays at 0 everywhere: three.js's
 * clearcoat pass on MeshPhysicalMaterial does not respect clippingPlanes,
 * which silently breaks the cutaway view. The moist look therefore comes
 * from low roughness + environment reflections instead.
 */
const ATLAS: Record<SystemId, Preset> = {
  telencephalon: { color: '#cfa08f', roughness: 0.62 },
  'basal-ganglia': { color: '#c98fb4', roughness: 0.6 },
  diencephalon: { color: '#d39c69', roughness: 0.6 },
  brainstem: { color: '#c7b78a', roughness: 0.6 },
  cerebellum: { color: '#a9c3a0', roughness: 0.62 },
  ventricles: { color: '#7fb8d6', roughness: 0.35 },
  'white-matter': { color: '#e6dfd2', roughness: 0.7 },
  'cranial-nerves': { color: '#f0cf6e', roughness: 0.55 },
  arteries: { color: '#d8524e', roughness: 0.45 },
  veins: { color: '#5f6fc4', roughness: 0.45 },
  meninges: { color: '#b9a9c9', roughness: 0.7 },
  skull: { color: '#ded7c6', roughness: 0.8 },
}

const TISSUE_SHEEN = '#ffd6c8'

const REAL: Record<SystemId, Preset> = {
  // Pial surface of the cortex: grey matter seen through a film of CSF.
  telencephalon: { color: '#ab8d82', roughness: 0.38, sheen: 0.2, sheenColor: TISSUE_SHEEN, env: 0.6 },
  // Deep grey nuclei are a browner, duller grey than cortex.
  'basal-ganglia': { color: '#9c786c', roughness: 0.45, sheen: 0.22, sheenColor: TISSUE_SHEEN, env: 0.55 },
  diencephalon: { color: '#a48272', roughness: 0.45, sheen: 0.22, sheenColor: TISSUE_SHEEN, env: 0.55 },
  // The brainstem surface is myelinated fibre: creamy white.
  brainstem: { color: '#bfae94', roughness: 0.4, sheen: 0.15, sheenColor: '#ffe2c8', env: 0.55 },
  cerebellum: { color: '#a08379', roughness: 0.4, sheen: 0.2, sheenColor: TISSUE_SHEEN, env: 0.6 },
  // Casts of CSF spaces: clear, straw-tinted fluid.
  ventricles: { color: '#9db6bd', roughness: 0.16, env: 0.9 },
  'white-matter': { color: '#c6b9a1', roughness: 0.46, sheen: 0.12, sheenColor: '#fff0dc', env: 0.5 },
  'cranial-nerves': { color: '#cfc19c', roughness: 0.4, sheen: 0.1, sheenColor: '#fff3d0', env: 0.55 },
  arteries: { color: '#a8231d', roughness: 0.3, env: 0.9 },
  veins: { color: '#43437c', roughness: 0.32, env: 0.9 },
  // Dura: dense, pearly connective tissue.
  meninges: { color: '#bfb5ad', roughness: 0.5, sheen: 0.2, sheenColor: '#ffffff', env: 0.55 },
  skull: { color: '#cfc2a6', roughness: 0.72, env: 0.4 },
}

/** Gross structures whose fresh-tissue colour differs from the rest of their system. */
const REAL_BY_ID: [RegExp, Partial<Preset>][] = [
  // Neuromelanin.
  [/substantia-nigra/, { color: '#4a3a35' }],
  // Iron and dense capillaries.
  [/red-nucleus/, { color: '#b0685d' }],
  // "Pale globe": heavily myelinated.
  [/globus-pallidus/, { color: '#bba593' }],
  [/choroid-plexus/, { color: '#a44a41', roughness: 0.5 }],
  [/pituitary-gland/, { color: '#c4857a' }],
  [/pineal-body/, { color: '#b48c7c' }],
  // Fibre bundles filed under grey systems.
  [/cerebral-crus|mammillothalamic-tract|stria-medullaris|stria-terminalis|brachium-of|fornix|commissure|optic-(tract|chiasm)/, { color: '#c2b399' }],
  // Dural venous sinuses: blood seen through dura.
  [/sinus/, { color: '#4b4f84', roughness: 0.4 }],
]

/** Each parcellation gets its own tint so overlapping layers stay tellable apart. */
export const LAYER_COLORS: Record<LayerId, string> = {
  gross: '#d9b4a4',
  julich: '#5aa8ff',
  brodmann: '#ff8a5a',
  desikan: '#7ad48f',
  destrieux: '#c78bff',
  glasser: '#ffd35a',
  jhu: '#f4f0e6',
  bstem: '#e2a35a',
  suit: '#6fd6b8',
}
const LAYER_TINT: Partial<Record<LayerId, T.Color>> = Object.fromEntries(Object.entries(LAYER_COLORS).filter(([k]) => k !== 'gross').map(([k, v]) => [k, new T.Color(v)]))

export const HIGHLIGHT = new T.Color('#0088ff')
export const HOVER = new T.Color('#9fd0ff')

interface Look {
  color: T.Color
  roughness: number
  sheen: number
  sheenColor: T.Color
  env: number
}

export interface PartMaterial extends T.MeshPhysicalMaterial {
  userData: { base: T.Color; looks: Record<ColorMode, Look> }
}

function look(p: Preset, color: T.Color): Look {
  return { color, roughness: p.roughness, sheen: p.sheen ?? 0, sheenColor: new T.Color(p.sheenColor ?? '#000000'), env: p.env ?? 0.7 }
}

/** One physically-based material per part so selection and hover can tint individually. */
export function createPartMaterial(system: SystemId, layer: LayerId, seed: number, id = ''): PartMaterial {
  const atlasPreset = ATLAS[system]
  let realPreset = REAL[system]
  const atlas = new T.Color(atlasPreset.color)
  let real: T.Color
  const tintColor = LAYER_TINT[layer]
  if (tintColor) {
    // Parcellation areas must be tellable apart at a glance: spread hues
    // around the layer's own colour (golden-ratio stepping keeps neighbours
    // apart) with a little lightness variation, like a printed atlas.
    const hsl = { h: 0, s: 0, l: 0 }
    tintColor.getHSL(hsl)
    const step = (seed * 0.6180339887) % 1
    atlas.setHSL((hsl.h + (step - 0.5) * 0.38 + 1) % 1, 0.62, 0.46 + (((seed * 7) % 5) - 2) * 0.04)
    // A parcellation is a map painted on the tissue: it keeps its map
    // colours in both modes and only takes the moist surface.
    real = atlas.clone()
  } else {
    // Neighbouring gross structures get slightly different shades so borders read.
    atlas.offsetHSL(((seed % 17) - 8) / 300, 0, ((seed % 7) - 3) / 60)
    for (const [re, patch] of REAL_BY_ID) {
      if (re.test(id)) {
        realPreset = { ...realPreset, ...patch }
        break
      }
    }
    // Real tissue is far more uniform; a trace of variation keeps gyri apart.
    real = new T.Color(realPreset.color).offsetHSL(((seed % 17) - 8) / 900, 0, ((seed % 7) - 3) / 160)
  }
  const m = new T.MeshPhysicalMaterial({
    color: atlas,
    metalness: 0,
    roughness: atlasPreset.roughness,
    clearcoat: 0,
    side: T.DoubleSide,
    envMapIntensity: 0.7,
  }) as PartMaterial
  m.userData = { base: atlas.clone(), looks: { atlas: look(atlasPreset, atlas.clone()), real: look(realPreset, real) } }
  return m
}

/**
 * Switches a material's surface to a colour mode and returns that mode's
 * base colour. The caller owns `userData.base` (a lesson may have repainted
 * it), so the colour is handed back rather than written.
 */
export function applyColorMode(m: PartMaterial, mode: ColorMode): T.Color {
  const l = m.userData.looks[mode]
  m.roughness = l.roughness
  m.envMapIntensity = l.env
  // Sheen on/off is part of the shader program key: a change needs a recompile.
  if (m.sheen > 0 !== l.sheen > 0) m.needsUpdate = true
  m.sheen = l.sheen
  m.sheenColor.copy(l.sheenColor)
  m.sheenRoughness = 0.55
  return l.color
}

/** Tint a material toward the selection / hover colours without losing its base. */
export function tint(m: PartMaterial, selected: number, hovered: number) {
  const base = m.userData.base
  m.color.copy(base)
  if (selected > 0) m.color.lerp(HIGHLIGHT, selected * 0.72)
  else if (hovered > 0) m.color.lerp(HOVER, hovered * 0.35)
  m.emissive.set(0x000000)
  if (selected > 0) m.emissive.copy(HIGHLIGHT).multiplyScalar(0.12 * selected)
  else if (hovered > 0) m.emissive.copy(HOVER).multiplyScalar(0.06 * hovered)
}
