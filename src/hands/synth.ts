import type { FaceObs, HandFrame, Pt, TrackedHand } from './types'

/**
 * Synthetic hands for headless checks (no camera there): a canonical open or
 * pinching right hand in MediaPipe's own conventions — world points in metres
 * around the hand's centre (x right, y down, z away from the camera), image
 * points normalised to a 16:9 frame.
 */

// Palm towards the camera, fingers up.
const OPEN: [number, number, number][] = [
  [0, 0.08, 0],
  [0.025, 0.065, -0.01],
  [0.045, 0.045, -0.015],
  [0.06, 0.025, -0.02],
  [0.07, 0.005, -0.025],
  [0.022, 0, 0],
  [0.025, -0.035, 0],
  [0.026, -0.058, 0],
  [0.027, -0.078, 0],
  [0, -0.002, 0],
  [0, -0.04, 0],
  [0, -0.065, 0],
  [0, -0.087, 0],
  [-0.02, 0.003, 0],
  [-0.022, -0.032, 0],
  [-0.023, -0.055, 0],
  [-0.024, -0.074, 0],
  [-0.038, 0.012, 0],
  [-0.042, -0.012, 0],
  [-0.044, -0.028, 0],
  [-0.045, -0.044, 0],
]

// Thumb and index tips meet; the other fingers stay as they were.
const PINCH: [number, number, number][] = OPEN.map((p, i) => {
  const moved: Record<number, [number, number, number]> = {
    3: [0.055, 0.0, -0.035],
    4: [0.05, -0.022, -0.045],
    6: [0.03, -0.03, -0.015],
    7: [0.04, -0.04, -0.035],
    8: [0.048, -0.028, -0.046],
  }
  return moved[i] ?? p
})

const ASPECT = 16 / 9

/**
 * One hand centred at image point (cx, cy) (0..1 of the un-mirrored frame),
 * `size` = palm length as a fraction of frame height.
 */
export function synthHand(cx: number, cy: number, opts: { pinch?: boolean; side?: 'left' | 'right'; size?: number } = {}): TrackedHand {
  const src = opts.pinch ? PINCH : OPEN
  const flip = opts.side === 'left' ? -1 : 1
  const world: Pt[] = src.map(([x, y, z]) => ({ x: x * flip, y, z }))
  const scale = (opts.size ?? 0.16) / 0.082 // world palm length ≈ 0.082 m
  const image: Pt[] = world.map((w) => ({ x: cx + (w.x * scale) / ASPECT, y: cy + w.y * scale, z: w.z * scale }))
  return { side: opts.side ?? 'right', image, world, score: 1 }
}

export const synthFrame = (hands: TrackedHand[], time = performance.now()): HandFrame => ({ hands, aspect: ASPECT, time })

/** A head at image point (x, y) of the un-mirrored 16:9 frame; `iod` = eye gap in frame heights (≈ 0.11 at arm's length). */
export const synthFace = (x: number, y: number, iod = 0.11): FaceObs => ({ x, y, iod, aspect: ASPECT, score: 1 })
