/**
 * A hook for taking a picture of the 3D view without reaching into the scene
 * component: SceneView registers its BrainScene's `snapshot` here while the
 * scene is alive (AI-4: "look at what I see").
 */
let take: ((maxSide?: number) => string) | null = null

export const registerSnapshot = (fn: typeof take) => {
  take = fn
}

/** JPEG data URL of the 3D view, or null before the scene has loaded. */
export const sceneSnapshot = (maxSide?: number): string | null => (take ? take(maxSide) : null)
