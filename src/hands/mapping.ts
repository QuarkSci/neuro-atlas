import type { Pt } from './types'

/**
 * How much of the camera frame the screen stands for. A hand cannot comfortably
 * reach the frame's edges (and is lost there), so the central part of the frame
 * is stretched over the whole screen.
 */
export const REACH_GAIN = 1.3

/**
 * Camera image point → screen pixel, mirrored like a selfie view and fitted
 * "cover" style (the frame fills the screen, cropping the longer side).
 */
export function imageToScreen(p: Pt, aspect: number, w: number, h: number) {
  const u = 1 - p.x
  const v = p.y
  let x: number, y: number
  if (w / h > aspect) {
    x = u * w
    y = (v - 0.5) * (w / aspect) + h / 2
  } else {
    y = v * h
    x = (u - 0.5) * (h * aspect) + w / 2
  }
  return { x: w / 2 + (x - w / 2) * REACH_GAIN, y: h / 2 + (y - h / 2) * REACH_GAIN }
}
