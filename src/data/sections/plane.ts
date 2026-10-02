/**
 * Brainstem levels are cut perpendicular to the neuraxis, not the MNI axial
 * plane: in this atlas's own geometry the medulla→midbrain axis runs from
 * (y −38, z −55) to (y −24, z −12), i.e. tilted ~18° forward (Meynert's
 * axis). `brainstemPlane(z)` gives the textbook transverse plane at MNI z.
 */
const AXIS = (() => {
  const d = [0, 14, 43]
  const n = Math.hypot(d[1], d[2])
  return [0, d[1] / n, d[2] / n] as [number, number, number]
})()
export function brainstemPlane(z: number): { point: [number, number, number]; normal: [number, number, number] } {
  return { point: [0, -38 + (z + 55) * (14 / 43), z], normal: AXIS }
}
