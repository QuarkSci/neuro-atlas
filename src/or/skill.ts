import type { Mni } from './types'

/**
 * Skill-tracking maths shared by the procedures (docs/research/sim-metrics.md 3.3, 5.3):
 * `ldj` — smoothness of a tip trajectory (log dimensionless jerk, Hogan & Sternad 2009 form), and
 * `lcCusum` — LC-CUSUM (Biau et al. 2008): has the learner shown, session by session, a stable acceptable failure rate?
 */

export interface TimedPoint {
  t: number
  p: Mni
}

const RESAMPLE_HZ = 50

/** Moving average with a 3-sample window (edges truncated): takes the sampling noise off before the third derivative. */
function smooth3(x: Float64Array) {
  const o = new Float64Array(x.length)
  for (let i = 0; i < x.length; i++) {
    const a = Math.max(0, i - 1),
      b = Math.min(x.length - 1, i + 1)
    let s = 0
    for (let j = a; j <= b; j++) s += x[j]
    o[i] = s / (b - a + 1)
  }
  return o
}

/**
 * Dimensionless jerk of a trajectory: DJ = D⁵ / L² · ∫ |j|² dt, D = duration (s), L = path length (mm), j = third derivative of
 * position. The number does not depend on the movement's size or speed; a minimum-jerk reach has DJ = 720 exactly.
 * Returns LDJ = −ln(DJ): larger (less negative) is smoother. `null` when the trace is shorter than 1 s or does not move.
 */
export function ldj(trace: readonly TimedPoint[]): number | null {
  if (trace.length < 8) return null
  const t0 = trace[0].t
  const D = trace[trace.length - 1].t - t0
  if (D < 1) return null
  const n = Math.floor(D * RESAMPLE_HZ) + 1
  const dt = 1 / RESAMPLE_HZ
  const ch = [new Float64Array(n), new Float64Array(n), new Float64Array(n)]
  let k = 0
  for (let i = 0; i < n; i++) {
    const t = t0 + i * dt
    while (k < trace.length - 2 && trace[k + 1].t < t) k++
    const a = trace[k],
      b = trace[k + 1]
    const u = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 0
    for (let c = 0; c < 3; c++) ch[c][i] = a.p[c] + (b.p[c] - a.p[c]) * u
  }
  let L = 0
  for (let i = 1; i < n; i++) L += Math.hypot(ch[0][i] - ch[0][i - 1], ch[1][i] - ch[1][i - 1], ch[2][i] - ch[2][i - 1])
  if (L < 1e-6) return null
  const sm = ch.map(smooth3)
  let acc = 0
  for (let i = 0; i + 3 < n; i++) {
    let j2 = 0
    for (let c = 0; c < 3; c++) {
      const j = (sm[c][i + 3] - 3 * sm[c][i + 2] + 3 * sm[c][i + 1] - sm[c][i]) / (dt * dt * dt)
      j2 += j * j
    }
    acc += j2 * dt
  }
  const dj = (D ** 5 / (L * L)) * acc
  return dj > 0 ? -Math.log(dj) : null
}

export interface CusumParams {
  /** Unacceptable and acceptable failure rates (H0, H1). */
  p0: number
  p1: number
  /** Decision threshold. */
  h: number
}

/** Defaults of sim-metrics.md 5.3. */
export const CUSUM: CusumParams = { p0: 0.25, p1: 0.1, h: 2.5 }

export interface CusumResult {
  /** S after each session (S₀ = 0 is not included). */
  s: number[]
  /** 1-based session at which S first reached h; `null` until then. */
  signalAt: number | null
  /** Where S stands now, and the threshold. */
  current: number
  h: number
}

/**
 * LC-CUSUM over a list of session outcomes (`true` = success). A success adds ln((1−p1)/(1−p0)) > 0, a failure adds
 * ln(p1/p0) < 0, and S never drops below 0. S ≥ h is the evidence that the failure rate is the acceptable one.
 */
export function lcCusum(success: readonly boolean[], c: CusumParams = CUSUM): CusumResult {
  const up = Math.log((1 - c.p1) / (1 - c.p0)),
    down = Math.log(c.p1 / c.p0)
  const s: number[] = []
  let cur = 0,
    signal: number | null = null
  success.forEach((ok, i) => {
    cur = Math.max(0, cur + (ok ? up : down))
    s.push(cur)
    if (signal === null && cur >= c.h) signal = i + 1
  })
  return { s, signalAt: signal, current: cur, h: c.h }
}
