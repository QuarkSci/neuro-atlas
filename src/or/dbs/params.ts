import type { ScoreBand } from '../types'
import type { DbsParams } from './logic'

/**
 * Numbers the DBS logic runs on. Bands are from docs/research/procedures/dbs.md 6 (AG-10; Martin 1997, Kirkman 2014, Zrinzo 2012);
 * values marked "design" are simulator choices the literature does not fix. Targets, MER layers and side effects are NOT here:
 * they are `DbsData` (AG-16).
 */
const band = (upTo: number, score: 1 | 3 | 5, uz: string, en: string): ScoreBand => ({ upTo, score, label: { uz, en } })
const A = (upTo: number) => band(upTo, 5, "a'lo", 'excellent')
const S = (upTo: number) => band(upTo, 3, 'qoniqarli', 'satisfactory')
const P = (upTo: number) => band(upTo, 1, 'qoniqarsiz', 'poor')

export const DBS_PARAMS: DbsParams = {
  radialBandsMm: [A(1.5), S(2.5), P(Infinity)],
  // Clearance is "larger is better": stored as the shortfall 3 − clearance so that the same first-fit banding works (see score.ts).
  clearanceBandsMm: [A(0), S(2), P(Infinity)],
  merBandsMm: [A(0.5), S(1), P(Infinity)],
  // Window is also larger-is-better: shortfall = 1.5 − window.
  windowBandsMa: [A(0), S(0.5), P(Infinity)],
  trackBands: [A(2), S(3), P(Infinity)],
  frameBandsMm: [A(1), S(2), P(Infinity)],
  tremorBandsMm: [A(0.4), S(1), P(Infinity)],
  timeBandsS: [A(1200), S(2400), P(Infinity)],

  trackOffsetMm: 2,
  // design (dbs.md 5: clinically relevant shift 2–4 mm; sealing at once keeps it small)
  shiftRateMmMin: 0.25,
  shiftRateSealedMmMin: 0.05,
  shiftCapMm: 4,
  chordRadiusMm: { stn: 3, gpi: 4, vim: 2.5 },
  guideAboveMm: 15,
  merTopMm: 15,
  merBottomMm: -5,
  merStepMm: 0.5,
  // design
  benefitBaseMa: 0.8,
  benefitScaleMm: 3,
  // calibrated on the atlas: the internal capsule surface is 7 mm from the STN centre → threshold ≈ 3.7 mA there (dbs.md 6: side effects > 3.5 mA at a good position)
  effectRefDistMm: 6,
  minEffectDistMm: 0.5,
  contactMm: 1,
  safeClearanceMm: 3,
}
