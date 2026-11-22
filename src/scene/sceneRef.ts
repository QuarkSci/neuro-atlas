import type { BrainScene } from './BrainScene'

/**
 * The live BrainScene for modules that drive it from outside React's data flow
 * (hand tracking). SceneView sets it while the scene exists.
 */
let current: BrainScene | null = null

export const setActiveScene = (s: BrainScene | null) => {
  current = s
}

export const activeScene = () => current
