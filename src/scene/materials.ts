import * as T from 'three'
import type { SystemId } from '@/data/types'

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

/** Cytoarchitectonic areas read as a cooler, denser material than the gross tissue they sit in. */
const JULICH_TINT = new T.Color('#5aa8ff')

export const HIGHLIGHT = new T.Color('#0088ff')
export const HOVER = new T.Color('#9fd0ff')

export interface PartMaterial extends T.MeshPhysicalMaterial {
  userData: { base: T.Color }
}

/** One physically-based material per part so selection and hover can tint individually. */
export function createPartMaterial(system: SystemId, julich: boolean, seed: number): PartMaterial {
  const p = PRESETS[system]
  const base = new T.Color(p.color)
  // Neighbouring structures get slightly different shades so borders read.
  base.offsetHSL(((seed % 17) - 8) / 300, 0, ((seed % 7) - 3) / 60)
  if (julich) base.lerp(JULICH_TINT, 0.55)
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
