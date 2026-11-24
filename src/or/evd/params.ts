import type { EvdParams } from './types'
import type { ScoreBand } from '../types'

/**
 * Numbers the EVD logic runs on. Every value is from docs/research/procedures/evd.md (AG-9; DOIs checked 2026-11-23);
 * `origin: 'design'` marks simulator choices that the literature does not fix. Ranges stay ranges; the logic picks the default.
 */

const band = (upTo: number, score: 1 | 3 | 5, uz: string, en: string): ScoreBand => ({ upTo, score, label: { uz, en } })
const A = (upTo: number) => band(upTo, 5, "a'lo", 'excellent')
const S = (upTo: number) => band(upTo, 3, 'qoniqarli', 'satisfactory')
const P = (upTo: number) => band(upTo, 1, 'qoniqarsiz', 'poor')

export const EVD_PARAMS: EvdParams = {
  kocherLateralMm: { value: 28, refs: ['morone2019', 'friedman1980'], origin: 'literature', note: 'evd.md 3.1: 25–30 mm from the midline' },
  kocherLateralRange: { value: { min: 25, max: 35 }, refs: ['morone2019'], origin: 'literature', note: 'mid-pupillary line' },
  kocherAheadOfCoronalMm: { value: 15, refs: ['morone2019'], origin: 'literature', note: 'evd.md: 10–15 mm (range 10–20) anterior to the coronal suture' },
  kocherAheadRange: { value: { min: 10, max: 20 }, refs: ['morone2019'], origin: 'literature' },
  sinusRiskLateralMm: { value: 20, refs: ['morone2019'], origin: 'literature', note: 'venous lacunae within ≤ 20 mm of the midline' },
  markOkMm: { value: 8, refs: [], origin: 'design', note: 'radius for the "on target" ring in the UI' },
  sutureGapMm: { value: 2, refs: [], origin: 'derived', note: 'frontal vertices within 2 mm of the right parietal bone = coronal suture' },

  monroPartId: 'g-interventricular-foramen',
  frontalHornYMm: { value: -5, refs: ['kakarla2008'], origin: 'literature', note: 'evd.md 7.1: anterior horn = y > −5 mm' },

  depthBestMm: { value: { min: 55, max: 65 }, refs: ['huyette2008', 'statpearls-nbk545317'], origin: 'literature' },
  depthOkMm: { value: { min: 50, max: 70 }, refs: ['huyette2008', 'statpearls-nbk545317'], origin: 'literature' },
  popBandMm: { value: { min: 40, max: 50 }, refs: ['huyette2008', 'statpearls-nbk545317'], origin: 'literature' },
  // Atlas head is larger than the literature mean (entry→Monro ≈ 83 mm vs 55–65 mm), so the score uses the deviation from the ideal depth: ≤ 5 / ≤ 10 mm.
  depthDevBandsMm: [A(5), S(10), P(Infinity)],
  redDepthMm: { value: 70, refs: ['statpearls-nbk545317'], origin: 'literature', note: '> 70 mm: third-ventricle floor, hypothalamus, basilar artery' },

  // Angle: ≤ 5° excellent, 5–10° satisfactory, > 10° poor (evd.md 4.3 / 7.2).
  angleBandsDeg: [A(5), S(10), P(Infinity)],
  // Tip to the Monro foramen: ≤ 5 / 5–12 / > 12 mm (evd.md 7.2).
  monroBandsMm: [A(5), S(12), P(Infinity)],

  grade1MonroMm: {
    value: 10,
    refs: ['kakarla2008'],
    origin: 'literature',
    note: 'evd.md 7.1: Grade 1 = within 10 mm of the foramen. 10–15 mm is not defined there: scored Grade 2 (functional, not ideal)',
  },
  gradeScore: { value: { 1: 100, 2: 60, 3: 0 }, refs: ['kakarla2008'], origin: 'literature' },

  passEnterDepthMm: { value: 25, refs: [], origin: 'design', note: 'tip deeper than 25 mm below the scalp = inside the brain (scalp ≈ 5–8 mm + skull ≈ 6–8 mm + dura/cortex)' },
  passExitDepthMm: { value: 15, refs: [], origin: 'design', note: 'withdrawn above 15 mm ends the pass (hysteresis against jitter)' },

  // OSATS-style bands (evd.md 7.2 table, rows 1, 2, 7). Time: ≤ 180 s / ≤ 360 s; passes 1 / 2 / ≥ 3; tremor RMS ≤ 0.5 / ≤ 1.2 mm.
  timeBandsS: [A(180), S(360), P(Infinity)],
  passBands: [A(1), S(2), P(Infinity)],
  tremorBandsMm: [A(0.5), S(1.2), P(Infinity)],
  // E ≥ 0.85 excellent, 0.65–0.85 satisfactory, < 0.65 poor, written as loss = 1 − E.
  efficiencyLossBands: [A(0.15), S(0.35), P(Infinity)],
  tremorHz: { value: { min: 4, max: 12 }, refs: ['hooten2014'], origin: 'design', note: 'evd.md 7.2 row 7: 4–12 Hz component' },

  ids: {
    ventricle: 'g-right-lateral-ventricle',
    thirdVentricle: 'g-third-ventricle',
    contraVentricle: 'g-left-lateral-ventricle',
    septum: 'g-septum-of-telencephalon',
    skullFrontal: 'g-frontal-bone',
    skullParietal: 'g-right-parietal-bone',
    dura: 'g-cerebral-hemisphere-segment-of-dura-mater',
    superiorSagittalSinus: 'g-superior-sagittal-sinus',
  },

  // Structures from evd.md 3.3 (right-hand ids; the left side is derived by `sideId`).
  hazards: [
    {
      partId: 'g-superior-sagittal-sinus',
      region: 'medial',
      kind: 'surface',
      severity: 'fatal',
      eloquent: false,
      warnMm: 6,
      contactMm: 1,
      consequence: { uz: 'Yuqori sagittal sinus: halokatli venoz qon ketish.', en: 'Superior sagittal sinus: catastrophic venous bleeding.' },
      refs: ['morone2019'],
    },
    {
      partId: 'g-right-pericallosal-artery',
      region: 'vessel',
      kind: 'surface',
      severity: 'major',
      eloquent: false,
      warnMm: 5,
      contactMm: 1,
      consequence: { uz: 'Perikallozal arteriya: interhemisferik arterial qon ketish.', en: 'Pericallosal artery: interhemispheric arterial bleeding.' },
      refs: ['statpearls-nbk545317'],
    },
    {
      partId: 'g-right-fornix-of-forebrain',
      region: 'medial',
      kind: 'solid',
      severity: 'major',
      eloquent: true,
      warnMm: 4,
      contactMm: 0,
      consequence: { uz: 'Gumbaz (fornix): xotira buzilishi.', en: 'Fornix: memory impairment.' },
      refs: ['statpearls-nbk545317'],
    },
    {
      partId: 'g-right-caudate-nucleus',
      region: 'lateral',
      kind: 'solid',
      severity: 'major',
      eloquent: true,
      warnMm: 4,
      contactMm: 0,
      consequence: { uz: "Dumli yadro: lateral og'ish (Kakarla 3 xavfi).", en: 'Caudate nucleus: lateral deviation (Kakarla 3 risk).' },
      refs: ['kakarla2008'],
    },
    {
      partId: 'g-right-internal-capsule',
      region: 'lateral',
      kind: 'solid',
      severity: 'major',
      eloquent: true,
      warnMm: 4,
      contactMm: 0,
      consequence: { uz: 'Ichki kapsula: kontralateral gemiparez.', en: 'Internal capsule: contralateral hemiparesis.' },
      refs: ['statpearls-nbk545317'],
    },
    {
      partId: 'g-right-precentral-gyrus',
      region: 'posterior',
      kind: 'solid',
      severity: 'major',
      eloquent: true,
      warnMm: 5,
      contactMm: 0,
      consequence: { uz: "Precentral pushta (motor po'stloq): motor defitsit.", en: 'Precentral gyrus (motor cortex): motor deficit.' },
      refs: ['morone2019'],
    },
    {
      partId: 'g-right-thalamus',
      region: 'deep',
      kind: 'solid',
      severity: 'major',
      eloquent: true,
      warnMm: 4,
      contactMm: 0,
      consequence: { uz: 'Talamus: talamik qon ketish.', en: 'Thalamus: thalamic hemorrhage.' },
      refs: ['statpearls-nbk545317'],
    },
    {
      partId: 'g-hypothalamus',
      region: 'deep',
      kind: 'solid',
      severity: 'fatal',
      eloquent: true,
      warnMm: 6,
      contactMm: 0,
      consequence: { uz: 'Gipotalamus: vegetativ buzilish.', en: 'Hypothalamus: autonomic disturbance.' },
      refs: ['statpearls-nbk545317'],
    },
    {
      partId: 'g-right-superior-thalamostriate-vein',
      region: 'vessel',
      kind: 'surface',
      severity: 'major',
      eloquent: false,
      warnMm: 4,
      contactMm: 1,
      consequence: { uz: 'Yuqori talamostriat vena: intraventrikulyar qon ketish.', en: 'Superior thalamostriate vein: intraventricular bleeding.' },
      refs: ['statpearls-nbk545317'],
    },
    {
      partId: 'g-right-internal-cerebral-vein',
      region: 'vessel',
      kind: 'surface',
      severity: 'major',
      eloquent: false,
      warnMm: 4,
      contactMm: 1,
      consequence: { uz: 'Ichki miya venasi: chuqur venoz qon ketish.', en: 'Internal cerebral vein: deep venous bleeding.' },
      refs: ['statpearls-nbk545317'],
    },
    {
      partId: 'g-right-choroid-plexus-of-cerebral-hemisphere',
      region: 'vessel',
      kind: 'surface',
      severity: 'minor',
      eloquent: false,
      warnMm: 3,
      contactMm: 1,
      consequence: { uz: 'Xorioid chigal: qon ketish va kateter tiqilishi.', en: 'Choroid plexus: bleeding and catheter occlusion.' },
      refs: ['statpearls-nbk545317'],
    },
    {
      partId: 'g-superior-cerebral-vein',
      region: 'vessel',
      kind: 'surface',
      severity: 'major',
      eloquent: false,
      warnMm: 3,
      contactMm: 1,
      consequence: { uz: 'Kortikal vena: subdural / intraparenximal qon ketish.', en: 'Cortical vein: subdural / intraparenchymal bleeding.' },
      refs: ['statpearls-nbk545317'],
    },
  ],
}

/** Replace the right-hand part of an id for the left side (`g-right-caudate-nucleus` → `g-left-caudate-nucleus`). */
export const sideId = (id: string, side: 'right' | 'left') => (side === 'right' ? id : id.replace(/^g-right-/, 'g-left-').replace(/-right$/, '-left'))
