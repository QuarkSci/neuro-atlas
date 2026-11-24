import type { L10n, Mni, Range, ScoreBand } from '../types'
import { dist } from '../vec'
import { sideId } from './params'
import type { EvdMetricScores, EvdMetrics, EvdParams, EvdWorld, Kakarla, KakarlaGrade, MetricScore, Side, TipRegion } from './types'

/** First band whose `upTo` the value does not exceed (bands run best → worst). */
export function bandOf(value: number, bands: readonly ScoreBand[]): ScoreBand {
  for (const b of bands) if (value <= b.upTo) return b
  return bands[bands.length - 1]
}

const metric = <K extends keyof EvdMetricScores>(id: K, value: number, score: 1 | 3 | 5, band: L10n): MetricScore => ({ id, value, score, band })
const fromBands = (id: keyof EvdMetricScores, value: number, bands: readonly ScoreBand[]) => {
  const b = bandOf(value, bands)
  return metric(id, value, b.score, b.label)
}

// ── Kinematics ─────────────────────────────────────────────────────────────

export interface TimedPoint {
  t: number
  p: Mni
}

/** Sum of segment lengths, mm. */
export function pathLength(pts: readonly { p: Mni }[]) {
  let l = 0
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1].p, pts[i].p)
  return l
}

/** Centred moving average with a window of `n` samples (truncated at the ends). */
function movingAverage(x: Float64Array, n: number) {
  const out = new Float64Array(x.length)
  const h = Math.max(1, Math.floor(n / 2))
  for (let i = 0; i < x.length; i++) {
    const a = Math.max(0, i - h),
      b = Math.min(x.length - 1, i + h)
    let s = 0
    for (let j = a; j <= b; j++) s += x[j]
    out[i] = s / (b - a + 1)
  }
  return out
}

const RESAMPLE_HZ = 50

/**
 * RMS of the `hz` band (default 4–12 Hz) of the tip position, mm. The trace is resampled to 50 Hz, then band-passed with
 * a moving average x − MA(1/f_low) that removes the slow, intended motion, then a 3-tap smoother that takes the edge off the fast noise. Both
 * filters are zero-phase, so the RMS is not biased by the lag. The 3D norm of the three channels is returned.
 * Windows shorter than 1 s return 0 (not enough to judge a tremor).
 */
export function tremorRms(trace: readonly TimedPoint[], hz: Range = { min: 4, max: 12 }): number {
  if (trace.length < 8) return 0
  const t0 = trace[0].t
  const dur = trace[trace.length - 1].t - t0
  if (dur < 1) return 0
  const n = Math.floor(dur * RESAMPLE_HZ)
  const ch = [new Float64Array(n), new Float64Array(n), new Float64Array(n)]
  let k = 0
  for (let i = 0; i < n; i++) {
    const t = t0 + i / RESAMPLE_HZ
    while (k < trace.length - 2 && trace[k + 1].t < t) k++
    const a = trace[k],
      b = trace[k + 1]
    const u = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 0
    for (let c = 0; c < 3; c++) ch[c][i] = a.p[c] + (b.p[c] - a.p[c]) * u
  }
  const long = Math.round(RESAMPLE_HZ / hz.min)
  // 3-tap smoothing (a gentle low-pass: gain 0.69 at 8 Hz, 0.33 at 25 Hz); the 1/0.69 below restores unit gain at the band centre.
  const BAND_GAIN = 1 / 0.69
  const band = ch.map((x) => {
    const slow = movingAverage(x, long)
    const hp = x.map((v, i) => v - slow[i])
    return movingAverage(hp, 3).map((v) => v * BAND_GAIN)
  })
  const edge = Math.ceil(long)
  let ss = 0,
    cnt = 0
  for (let i = edge; i < n - edge; i++) {
    ss += band[0][i] ** 2 + band[1][i] ** 2 + band[2][i] ** 2
    cnt++
  }
  return cnt ? Math.sqrt(ss / cnt) : 0
}

// ── Kakarla ────────────────────────────────────────────────────────────────

/** Where the tip is, in terms the Kakarla grade needs. */
export function tipRegion(w: EvdWorld, P: EvdParams, side: Side, tip: Mni, tableDepthMm: number | null): TipRegion {
  const ids = P.ids
  const ipsi = side === 'right' ? ids.ventricle : ids.contraVentricle
  const contra = side === 'right' ? ids.contraVentricle : ids.ventricle
  if (w.isInside(ids.thirdVentricle, tip)) return 'third-ventricle'
  if (w.isInside(ipsi, tip)) return tip[1] > P.frontalHornYMm.value ? 'frontal-horn' : 'ventricle-other'
  if (w.isInside(contra, tip)) return 'contra-ventricle'
  if (tableDepthMm != null && tableDepthMm < 12) return 'extra-axial'
  for (const h of P.hazards) if (h.eloquent && h.kind === 'solid' && w.isInside(sideId(h.partId, side), tip)) return 'eloquent-parenchyma'
  return 'silent-parenchyma'
}

/**
 * Kakarla et al. 2008 placement grade from the FINAL tip position (evd.md 7.1):
 *  1 optimal: ipsilateral frontal horn or the third ventricle, within `grade1MonroMm` of the foramen;
 *  2 functional but not ideal: any other part of a lateral ventricle (incl. the contralateral one through the septum);
 *  3 non-functional / eloquent: tip outside the ventricles.
 * Path hazards (a caudate or vessel hit on the way) are NOT part of the grade; they are the `collisions` metric and the score caps.
 */
export function kakarla(P: EvdParams, region: TipRegion, tipToMonroMm: number): Kakarla {
  const why: L10n[] = []
  let grade: KakarlaGrade
  if (region === 'frontal-horn' || region === 'third-ventricle') {
    if (tipToMonroMm <= P.grade1MonroMm.value) {
      grade = 1
      why.push({ uz: 'Uch frontal shox / uchinchi qorinchada, Monro teshigiga yaqin.', en: 'Tip in the frontal horn / third ventricle, close to the foramen of Monro.' })
    } else {
      grade = 2
      why.push({
        uz: `Qorincha ichida, lekin Monro teshigidan ${tipToMonroMm.toFixed(0)} mm uzoqda (> ${P.grade1MonroMm.value} mm).`,
        en: `Inside the ventricle but ${tipToMonroMm.toFixed(0)} mm from the foramen (> ${P.grade1MonroMm.value} mm).`,
      })
    }
  } else if (region === 'ventricle-other' || region === 'contra-ventricle') {
    grade = 2
    why.push(
      region === 'contra-ventricle'
        ? {
            uz: "Uch qarama-qarshi yon qorinchada (shaffof to'siq kesib o'tilgan): ishlaydi, lekin ideal emas.",
            en: 'Tip in the contralateral ventricle (septum crossed): functional, not ideal.',
          }
        : { uz: 'Uch yon qorinchaning oldingi shoxidan orqada: ishlaydi, lekin ideal emas.', en: 'Tip in the ventricle behind the frontal horn: functional, not ideal.' },
    )
  } else {
    grade = 3
    why.push(
      region === 'eloquent-parenchyma'
        ? {
            uz: 'Uch elokvent parenximada (kapsula, bazal gangliya, talamus yoki gipotalamus).',
            en: 'Tip in eloquent parenchyma (capsule, basal ganglia, thalamus or hypothalamus).',
          }
        : region === 'extra-axial'
          ? { uz: 'Uch miyadan tashqarida (suyak / pardalar orasida).', en: 'Tip outside the brain (skull / meningeal space).' }
          : { uz: 'Uch qorinchadan tashqarida (parenxima).', en: 'Tip outside the ventricles (parenchyma).' },
    )
  }
  return { grade, percent: P.gradeScore.value[grade], region, why }
}

// ── Scoring ────────────────────────────────────────────────────────────────

const WORDS = {
  best: { uz: "a'lo", en: 'excellent' },
  ok: { uz: 'qoniqarli', en: 'satisfactory' },
  bad: { uz: 'qoniqarsiz', en: 'poor' },
}

/** Depth: deviation from the ideal depth of the atlas (see `depthDevBandsMm`). The literature window 55–65 mm is shown in the UI only. */
export function depthScore(depthMm: number, idealMm: number, P: EvdParams): MetricScore {
  const b = bandOf(Math.abs(depthMm - idealMm), P.depthDevBandsMm)
  return metric('depth', depthMm, b.score, b.label)
}

/** Collisions (evd.md 7.2 row 6): none and nothing within 3 mm = 5; none but a close call = 3; any collision = 1. */
export function collisionScore(m: Pick<EvdMetrics, 'collisions' | 'minHazardMm'>): MetricScore {
  if (m.collisions >= 1) return metric('collisions', m.collisions, 1, WORDS.bad)
  if (m.minHazardMm < 3) return metric('collisions', m.collisions, 3, WORDS.ok)
  return metric('collisions', m.collisions, 5, WORDS.best)
}

/** Efficiency is stored as E (higher is better) but banded on the loss 1 − E. */
export function efficiencyScore(e: number, P: EvdParams): MetricScore {
  const b = bandOf(1 - e, P.efficiencyLossBands)
  return metric('efficiency', e, b.score, b.label)
}

export function scoreAll(m: EvdMetrics, P: EvdParams): { scores: EvdMetricScores; total: number; caps: L10n[] } {
  const scores: EvdMetricScores = {
    time: fromBands('time', m.durationS, P.timeBandsS),
    passes: fromBands('passes', m.passes, P.passBands),
    angle: fromBands('angle', m.angleErrDeg, P.angleBandsDeg),
    monro: fromBands('monro', m.tipToMonroMm, P.monroBandsMm),
    depth: depthScore(m.depthMm, m.idealDepthMm, P),
    collisions: collisionScore(m),
    tremor: fromBands('tremor', m.tremorRmsMm, P.tremorBandsMm),
    efficiency: efficiencyScore(m.pathEfficiency, P),
  }
  const list = Object.values(scores)
  let total = list.reduce((s, x) => s + x.score, 0) / list.length
  const caps: L10n[] = []
  if (m.kakarla.grade === 3) {
    total = Math.min(total, 2)
    caps.push({ uz: 'Kakarla 3: kateter ishlamaydi, umumiy baho 2.0 dan oshmaydi.', en: 'Kakarla 3: the drain does not work; total capped at 2.0.' })
  }
  if (m.collisions >= 1 && m.collisionIds.some((id) => P.hazards.find((h) => id === h.partId || id === sideId(h.partId, 'left'))?.severity === 'fatal')) {
    total = Math.min(total, 1.5)
    caps.push({ uz: 'Halokatli tuzilma shikastlandi: umumiy baho 1.5 dan oshmaydi.', en: 'A fatal structure was hit; total capped at 1.5.' })
  }
  return { scores, total: Math.round(total * 100) / 100, caps }
}
