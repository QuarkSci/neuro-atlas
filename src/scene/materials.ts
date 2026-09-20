import * as T from 'three'
import type { LayerId, SystemId } from '@/data/types'

interface Preset {
  color: string
  roughness: number
  metalness?: number
}

/**
 * Tissue looks per system. clearcoat stays at 0 everywhere: three.js's
 * clearcoat pass on MeshPhysicalMaterial does not respect clippingPlanes,
 * which silently breaks the cutaway view.
 */
const PRESETS: Record<SystemId, Preset> = {
  telencephalon: { color: '#cfa08f', roughness: 0.62 },
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

export interface PartMaterial extends T.MeshPhysicalMaterial {
  userData: { base: T.Color }
}

/** One physically-based material per part so selection and hover can tint individually. */
export function createPartMaterial(system: SystemId, layer: LayerId, seed: number): PartMaterial {
  const p = PRESETS[system]
  const base = new T.Color(p.color)
  const tintColor = LAYER_TINT[layer]
  if (tintColor) {
    // Parcellation areas must be tellable apart at a glance: spread hues
    // around the layer's own colour (golden-ratio stepping keeps neighbours
    // apart) with a little lightness variation, like a printed atlas.
    const hsl = { h: 0, s: 0, l: 0 }
    tintColor.getHSL(hsl)
    const step = (seed * 0.6180339887) % 1
    base.setHSL((hsl.h + (step - 0.5) * 0.38 + 1) % 1, 0.62, 0.46 + (((seed * 7) % 5) - 2) * 0.04)
  } else {
    // Neighbouring gross structures get slightly different shades so borders read.
    base.offsetHSL(((seed % 17) - 8) / 300, 0, ((seed % 7) - 3) / 60)
  }
  const m = new T.MeshPhysicalMaterial({
    color: base,
    metalness: p.metalness ?? 0,
    roughness: p.roughness,
    clearcoat: 0,
    side: T.DoubleSide,
    envMapIntensity: 0.7,
  }) as PartMaterial
  m.userData = { base: base.clone() }
  return m
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
