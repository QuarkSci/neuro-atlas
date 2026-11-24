import * as T from 'three'
import type { LayerKind } from './shells'

/** Shared uniforms of the dura opening (one disc at a time); the flap material tests the same disc inverted. */
export interface OpenUniforms {
  uOpOn: { value: number }
  uOpC: { value: T.Vector3 }
  uOpN: { value: T.Vector3 }
  uOpR: { value: number }
}
export const makeOpenUniforms = (): OpenUniforms => ({ uOpOn: { value: 0 }, uOpC: { value: new T.Vector3() }, uOpN: { value: new T.Vector3(0, 1, 0) }, uOpR: { value: 12 } })

/**
 * Dura: opaque, slightly glossy, off-white. Inside the opening disc the membrane is discarded (`keep = 'outside'`) or, for the flap,
 * everything outside it is (`keep = 'inside'`). `offset` turns the flap's pivot-relative positions back into the original ones.
 * `material.clippingPlanes` is the scene's shared array and is never reassigned.
 */
export function duraMaterial(planes: T.Plane[], u: OpenUniforms, keep: 'outside' | 'inside', offset = new T.Vector3()): T.MeshStandardMaterial {
  const m = new T.MeshStandardMaterial({ color: 0xd9d0c0, roughness: 0.5, metalness: 0, side: keep === 'inside' ? T.DoubleSide : T.FrontSide, clippingPlanes: planes })
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u, { uOff: { value: offset } })
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vOpPos;\nuniform vec3 uOff;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvOpPos = position + uOff;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vOpPos;\nuniform float uOpOn, uOpR;\nuniform vec3 uOpC, uOpN;')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
if (uOpOn > 0.5) { vec3 d = vOpPos - uOpC; d -= uOpN * dot(d, uOpN); bool inDisc = length(d) < uOpR; if (${keep === 'outside' ? 'inDisc' : '!inDisc'}) discard; }`,
      )
  }
  m.customProgramCacheKey = () => `dura-${keep}`
  return m
}

/** Arachnoid: a thin, faintly milky film that lets the cortex show through. */
export function arachnoidMaterial(planes: T.Plane[]): T.MeshPhysicalMaterial {
  return new T.MeshPhysicalMaterial({
    color: 0xe8edf0,
    roughness: 0.22,
    metalness: 0,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: T.FrontSide,
    clippingPlanes: planes,
    clearcoat: 0,
  })
}

/**
 * CSF: clear water over the cortex. Nearly invisible face-on, bright and glassy at grazing angles (Fresnel), with a slow
 * pulsation of the sheen (`uTime` ~ arterial pulse; the real flow is A-6). No refraction pass: a transmissive material would cost a
 * second scene render, the budget is ≤ 6 ms for all layers.
 */
export function csfMaterial(planes: T.Plane[], time: { value: number }): T.MeshPhysicalMaterial {
  const m = new T.MeshPhysicalMaterial({
    color: 0xbfe2ea,
    roughness: 0.03,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: T.FrontSide,
    clippingPlanes: planes,
    clearcoat: 0,
    ior: 1.34,
    specularIntensity: 1,
  })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime;').replace(
      '#include <opaque_fragment>',
      `float fr = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 3.0);
float pulse = 0.5 + 0.5 * sin(uTime * 7.5);
gl_FragColor = vec4(outgoingLight + vec3(0.05, 0.08, 0.1) * fr * (0.8 + 0.4 * pulse), diffuseColor.a * (0.7 + 2.2 * fr));`,
    )
  }
  m.customProgramCacheKey = () => 'csf-fresnel'
  return m
}

export const LAYER_ORDER: Record<LayerKind, number> = { dura: 2, arachnoid: 5, csf: 6 }
