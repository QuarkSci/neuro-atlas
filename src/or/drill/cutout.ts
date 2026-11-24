import * as T from 'three'
import { mniToScene } from '../types'
import type { BoneVolume } from './volume'

/**
 * Removes the atlas bone inside the patch box so the carved `DrillMeshView` shows instead of it. A fragment test in the
 * bone materials (onBeforeCompile) discards fragments inside the oriented box; `material.clippingPlanes` is not touched
 * (the section planes own it). Works for every mesh passed in; `clear()` switches it off.
 */
const UNIFORMS = {
  uCutOn: { value: 0 },
  uCutC: { value: new T.Vector3() },
  uCutU: { value: new T.Vector3(1, 0, 0) },
  uCutV: { value: new T.Vector3(0, 1, 0) },
  uCutW: { value: new T.Vector3(0, 0, 1) },
  uCutH: { value: new T.Vector3() },
}

const patched = new WeakSet<T.Material>()

function patch(m: T.Material) {
  if (patched.has(m)) return
  patched.add(m)
  const prev = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    prev?.call(m, shader, renderer)
    Object.assign(shader.uniforms, UNIFORMS)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCutPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;\nuniform float uCutOn;\nuniform vec3 uCutC, uCutU, uCutV, uCutW, uCutH;')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
if (uCutOn > 0.5) { vec3 d = vCutPos - uCutC; if (abs(dot(d, uCutU)) < uCutH.x && abs(dot(d, uCutV)) < uCutH.y && abs(dot(d, uCutW)) < uCutH.z) discard; }`,
      )
  }
  const key = m.customProgramCacheKey?.bind(m)
  m.customProgramCacheKey = () => (key ? key() : '') + '|cutout'
  m.needsUpdate = true
}

export class BoneCutout {
  private mats: T.Material[] = []

  /** `meshes`: the atlas bone meshes that the patch replaces locally. */
  constructor(meshes: T.Mesh[]) {
    for (const mesh of meshes) for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (!this.mats.includes(m)) this.mats.push(m)
    for (const m of this.mats) patch(m)
  }

  /** Cut the box of the volume (scene frame), a hair inside the grid so the carved mesh covers the rim. */
  set(vol: BoneVolume) {
    const s = (v: readonly [number, number, number]) => new T.Vector3(...mniToScene(v))
    UNIFORMS.uCutC.value.copy(s(vol.pos((vol.nu - 1) / 2, (vol.nv - 1) / 2, 0)))
    UNIFORMS.uCutU.value.copy(
      s(vol.u)
        .sub(s([0, 0, 0]))
        .normalize(),
    )
    UNIFORMS.uCutV.value.copy(
      s(vol.v)
        .sub(s([0, 0, 0]))
        .normalize(),
    )
    UNIFORMS.uCutW.value.copy(
      s(vol.w)
        .sub(s([0, 0, 0]))
        .normalize(),
    )
    const hu = ((vol.nu - 1) / 2) * vol.h - 0.05,
      hv = ((vol.nv - 1) / 2) * vol.h - 0.05
    const top = vol.z0,
      bot = (vol.nw - 1) * vol.h + vol.z0
    // The box is centred at c = 0 (outer plane) along w: half-height covers the grid, centre shifted by the grid's mid-depth.
    UNIFORMS.uCutC.value.addScaledVector(UNIFORMS.uCutW.value, (top + bot) / 2)
    UNIFORMS.uCutH.value.set(hu, hv, (bot - top) / 2 - 0.05)
    UNIFORMS.uCutOn.value = 1
  }

  clear() {
    UNIFORMS.uCutOn.value = 0
  }
}
