/**
 * Hands → instrument. While an instrument is on, the hand engine (src/hands) stops turning the camera and reports the
 * hand here instead: the open hand points, a pinch grips the instrument (the ray freezes, moving the hand down pushes it in).
 */
export const handTool = {
  active: false,
  /** Screen position (viewport px) of the pinch point / index tip, and whether the hand pinches. */
  hand: (_x: number, _y: number, _grip: boolean) => {},
  /** No hand in view. */
  lost: () => {},
}
