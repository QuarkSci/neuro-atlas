/**
 * OP-2 DBS (Deep Brain Stimulation) clinical data, verified references, AC–PC targets,
 * MER electrophysiological layer tables, macrostimulation side-effects, and OSATS bands (AG-16).
 *
 * Every clinical value and citation comes from `docs/research/procedures/dbs.md`
 * (AG-9; DOIs verified against Crossref API and StatPearls against NCBI E-utilities on 2026-11-23).
 */
import type { Disclaimer, L10n, Range, ScoreBand, Sourced } from '../types'
import type { DbsMetricSpecs, DbsRef, DbsRefId, DbsTarget, DbsTargetId, MerLayer, StimEffect } from './types'

// ── Training Disclaimer (SURGERY.md §0.3 · App Store 1.4.1) ────────────────

export const DBS_DISCLAIMER: Disclaimer = {
  text: {
    uz: "Faqat ta'lim va mashg'ulot uchun; real bemorlar uchun stereotaktik rejalashtirish vositasi emas. Koordinatalar o'rtacha atlas miyasi bo'yicha beriladi; klinikada har bemorning 3T MRI/CT tasvirida bevosita nishonlash shart.",
    en: 'For training and education only; not a stereotactic planning tool for real patients. Coordinates are based on the average atlas brain; clinical cases require direct 3T MRI/CT targeting.',
  },
}

// ── Verified References (dbs.md §8; checked 2026-11-23) ────────────────────

export const DBS_REFS: Record<DbsRefId, DbsRef> = {
  starr2002: {
    id: 'starr2002',
    label: 'Starr 2002',
    cite: 'Starr PA (2002). Placement of Deep Brain Stimulators into the Subthalamic Nucleus or Globus pallidus internus: Technical Approach. Stereotactic and Functional Neurosurgery.',
    doi: '10.1159/000070828',
    pmid: '12890973',
    checked: '2026-11-23',
  },
  machado2006: {
    id: 'machado2006',
    label: 'Machado 2006',
    cite: "Machado A, Rezai AR, Kopell BH, Gross RE, Sharan AD, Benabid AL (2006). Deep brain stimulation for Parkinson's disease: Surgical technique and perioperative management. Movement Disorders.",
    doi: '10.1002/mds.20959',
    pmid: '16810722',
    checked: '2026-11-23',
  },
  gross2006: {
    id: 'gross2006',
    label: 'Gross 2006',
    cite: "Gross RE, Krack P, Rodriguez-Oroz MC, Rezai AR, Benabid AL (2006). Electrophysiological mapping for the implantation of deep brain stimulators for Parkinson's disease and tremor. Movement Disorders.",
    doi: '10.1002/mds.20960',
    pmid: '16810720',
    checked: '2026-11-23',
  },
  deuschl2006: {
    id: 'deuschl2006',
    label: 'Deuschl 2006',
    cite: "Deuschl G, Schade-Brittinger C, Krack P, et al. (2006). A Randomized Trial of Deep-Brain Stimulation for Parkinson's Disease. New England Journal of Medicine.",
    doi: '10.1056/nejmoa060281',
    checked: '2026-11-23',
  },
  benabid2009: {
    id: 'benabid2009',
    label: 'Benabid 2009',
    cite: "Benabid AL, Chabardes S, Mitrofanis J, Pollak P (2009). Deep brain stimulation of the subthalamic nucleus for the treatment of Parkinson's disease. The Lancet Neurology.",
    doi: '10.1016/S1474-4422(08)70291-6',
    pmid: '19081516',
    checked: '2026-11-23',
  },
  follett2010: {
    id: 'follett2010',
    label: 'Follett 2010',
    cite: "Follett KA, Weaver FM, Stern M, et al. (2010). Pallidal versus Subthalamic Deep-Brain Stimulation for Parkinson's Disease. New England Journal of Medicine.",
    doi: '10.1056/NEJMoa0907083',
    pmid: '20519680',
    checked: '2026-11-23',
  },
  schuepbach2013: {
    id: 'schuepbach2013',
    label: 'Schuepbach 2013',
    cite: "Schuepbach WM, Rau J, Knudsen K, et al. (2013). Neurostimulation for Parkinson's Disease with Early Motor Complications (EARLYSTIM). New England Journal of Medicine.",
    doi: '10.1056/NEJMoa1205158',
    pmid: '23406026',
    checked: '2026-11-23',
  },
  papavassiliou2004: {
    id: 'papavassiliou2004',
    label: 'Papavassiliou 2004',
    cite: 'Papavassiliou E, Rau G, Heath S, et al. (2004). Thalamic Deep Brain Stimulation for Essential Tremor: Relation of Lead Location to Outcome. Neurosurgery.',
    doi: '10.1227/01.neu.0000119329.66931.9e',
    pmid: '15113466',
    checked: '2026-11-23',
  },
  zrinzo2012: {
    id: 'zrinzo2012',
    label: 'Zrinzo 2012',
    cite: 'Zrinzo L, Foltynie T, Limousin P, Hariz MI (2012). Reducing hemorrhagic complications in functional neurosurgery: a large case series and systematic literature review. Journal of Neurosurgery.',
    doi: '10.3171/2011.8.JNS101407',
    pmid: '21905798',
    checked: '2026-11-23',
  },
  fenoy2014: {
    id: 'fenoy2014',
    label: 'Fenoy & Simpson 2014',
    cite: 'Fenoy AJ, Simpson RK (2014). Risks of common complications in deep brain stimulation surgery: management and avoidance. Journal of Neurosurgery.',
    doi: '10.3171/2013.10.JNS131225',
    pmid: '24236657',
    checked: '2026-11-23',
  },
  horn2019: {
    id: 'horn2019',
    label: 'Horn 2019',
    cite: 'Horn A, Li N, Dembek TA, et al. (2019). Lead-DBS v2: Towards a comprehensive pipeline for deep brain stimulation imaging. NeuroImage.',
    doi: '10.1016/j.neuroimage.2018.08.068',
    checked: '2026-11-23',
  },
  krauss2020: {
    id: 'krauss2020',
    label: 'Krauss 2020',
    cite: 'Krauss JK, Lipsman N, Aziz T, et al. (2020/2021). Technology of deep brain stimulation: current status and future directions. Nature Reviews Neurology.',
    doi: '10.1038/s41582-020-00426-z',
    checked: '2026-11-23',
  },
  'statpearls-nbk557847': {
    id: 'statpearls-nbk557847',
    label: 'StatPearls NBK557847',
    cite: 'StatPearls (NCBI Bookshelf). Deep Brain Stimulation. Accession: NBK557847 (https://www.ncbi.nlm.nih.gov/books/NBK557847/).',
    checked: '2026-11-23',
  },
  martin1997: {
    id: 'martin1997',
    label: 'Martin 1997',
    cite: 'Martin JA, Regehr G, Reznick R, et al. (1997). Objective structured assessment of technical skill (OSATS) for surgical residents. British Journal of Surgery.',
    doi: '10.1046/j.1365-2168.1997.02502.x',
    pmid: '9052454',
    checked: '2026-11-23',
  },
  kirkman2014: {
    id: 'kirkman2014',
    label: 'Kirkman 2014',
    cite: 'Kirkman MA, Ahmed M, Albert AF, Wilson MH, Nandi D, Sevdalis N (2014). The use of simulation in neurosurgical education and training. Journal of Neurosurgery.',
    doi: '10.3171/2014.5.JNS131766',
    pmid: '24949680',
    checked: '2026-11-23',
  },
}

// ── Perioperative & AC–PC Frame Constants (dbs.md §2, §3.1, §4.1) ──────────

export const DBS_FRAME_CONSTANTS = {
  /** Normal adult AC–PC length, mm (dbs.md §3.1; mean ~25 mm). */
  acpcLengthMm: { value: { min: 23, max: 28 } as Range, refs: ['starr2002', 'machado2006'] as readonly DbsRefId[], origin: 'literature' as const, note: 'Mean ~25 mm' },
  /** Semi-sitting / beach-chair head elevation, deg (dbs.md §2). */
  headElevationDeg: { value: { min: 20, max: 30 } as Range, refs: ['machado2006'] as readonly DbsRefId[], origin: 'literature' as const },
  /** OFF-medication window prior to awake PD DBS, hours (dbs.md §2). */
  offMedicationHours: { value: 12, refs: ['machado2006'] as readonly DbsRefId[], origin: 'literature' as const },
  /** Guide tube stop distance above planned target, mm (dbs.md §4.1 step 4). */
  guideTubeAboveMm: { value: { min: 10, max: 15 } as Range, refs: ['machado2006'] as readonly DbsRefId[], origin: 'literature' as const },
  /** Typical brain shift with pneumocephalus, mm (dbs.md §4.1 step 3 / §5). */
  brainShiftMm: { value: { min: 2, max: 4 } as Range, refs: ['machado2006'] as readonly DbsRefId[], origin: 'literature' as const },
  /** Standard macrostimulation frequency, Hz (dbs.md §4.3). */
  macroStimHz: { value: 130, refs: ['machado2006', 'benabid2009'] as readonly DbsRefId[], origin: 'literature' as const },
  /** Standard macrostimulation pulse width, µs (dbs.md §4.3). */
  macroStimUs: { value: { min: 60, max: 90 } as Range, refs: ['machado2006', 'benabid2009'] as readonly DbsRefId[], origin: 'literature' as const },
  /** Atlas part ids for AC and PC (dbs.md §3.4). */
  acPartId: 'g-anterior-commissure',
  pcPartId: 'g-posterior-commissure',
} as const

// ── 3 Primary Stereotactic Targets (dbs.md §1.1, §3.2, §3.3, §3.4) ─────────

const safe3 = (refs: readonly DbsRefId[]): Sourced<number> => ({ value: 3, refs, origin: 'literature', note: 'dbs.md §6: ≥ 3 mm clearance = excellent' })

export const DBS_TARGETS: Record<DbsTargetId, DbsTarget> = {
  stn: {
    id: 'stn',
    name: { uz: 'Subtalamik yadro (STN)', en: 'Subthalamic nucleus (STN)' },
    indication: {
      uz: 'Parkinson kasalligi (motor fluktuatsiyalar, levodopa diskineziyalari, dori-rezistent tremor; UPDRS-III ≥ 30% levodopa javobi).',
      en: "Parkinson's disease (motor fluctuations, levodopa-induced dyskinesia, medication-refractory tremor; ≥ 30% UPDRS-III levodopa response).",
    },
    partId: 'j-stn-right',
    acpc: {
      lateral: { value: { min: 11, max: 12 }, refs: ['starr2002', 'benabid2009'], origin: 'literature', note: 'dbs.md §3.2: ~3 mm lateral to red nucleus lateral border' },
      y: { value: { min: -4, max: -2 }, refs: ['starr2002', 'benabid2009'], origin: 'literature', note: 'Posterior to MCP (level of anterior border of red nucleus)' },
      z: { value: { min: -5, max: -4 }, refs: ['starr2002', 'benabid2009'], origin: 'literature', note: 'Inferior to AC–PC plane' },
    },
    entry: {
      lateralMm: { value: { min: 25, max: 35 }, refs: ['starr2002', 'machado2006'], origin: 'literature' },
      sagittalDeg: { value: { min: 55, max: 65 }, refs: ['starr2002', 'machado2006'], origin: 'literature', note: 'Anterior from AC–PC plane' },
      coronalDeg: { value: { min: 15, max: 20 }, refs: ['starr2002', 'machado2006'], origin: 'literature', note: 'Lateral from midline' },
      aheadOfCoronalMm: { value: { min: 0, max: 10 }, refs: ['starr2002', 'machado2006'], origin: 'literature' },
    },
    avoid: [
      {
        partId: 'g-right-lateral-ventricle',
        kind: 'ventricle',
        severity: 'major',
        safeMm: safe3(['zrinzo2012', 'machado2006']),
        consequence: {
          uz: "Yon qorincha devorini kesish: intraventrikulyar qon ketish va traektoriya og'ishi.",
          en: 'Traversing lateral ventricle wall: intraventricular hemorrhage and trajectory deflection.',
        },
      },
      {
        partId: 'g-right-internal-capsule',
        kind: 'capsule',
        severity: 'major',
        safeMm: safe3(['machado2006', 'benabid2009']),
        consequence: {
          uz: 'Ichki kapsula (lateral/oldingi): past oqimda kapsulyar tetaniya va dizartriya.',
          en: 'Internal capsule (lateral/anterior): low-threshold capsular tetany and dysarthria.',
        },
      },
      {
        partId: 'wm-medial-lemniscus-right',
        kind: 'tract',
        severity: 'major',
        safeMm: safe3(['machado2006', 'gross2006']),
        consequence: {
          uz: 'Medial lemnisk (orqa/medial): kontralateral yuz/qo‘lda doimiy paresteziya.',
          en: 'Medial lemniscus (posterior/medial): persistent contralateral facial/hand paresthesia.',
        },
      },
      {
        partId: 'g-trunk-of-right-oculomotor-nerve',
        kind: 'nerve',
        severity: 'major',
        safeMm: safe3(['machado2006', 'benabid2009']),
        consequence: {
          uz: "III kalla nervi (medial/pastki): diplopiya, ko'zning medial og'ishi, midriaz.",
          en: 'Oculomotor nerve (medial/inferior): diplopia, ipsilateral eye adduction, mydriasis.',
        },
      },
      {
        partId: 'g-right-red-nucleus',
        kind: 'nucleus',
        severity: 'minor',
        safeMm: safe3(['starr2002', 'benabid2009']),
        consequence: { uz: 'Qizil yadro (medial): ataksiya va dismetriya.', en: 'Red nucleus (medial): ataxia and dysmetria.' },
      },
      {
        partId: 'g-right-caudate-nucleus',
        kind: 'nucleus',
        severity: 'minor',
        safeMm: safe3(['zrinzo2012']),
        consequence: { uz: "Dumli yadro: traektoriya bo'ylab parenxima va tomir xavfi.", en: 'Caudate nucleus: parenchymal and ependymal vessel risk along trajectory.' },
      },
    ],
  },

  gpi: {
    id: 'gpi',
    name: { uz: 'Ichki rangpar shar (GPi)', en: 'Globus pallidus internus (GPi)' },
    indication: {
      uz: "Birlamchi distoniya; Parkinson kasalligida og'ir levodopa diskineziyalari va kognitiv xavf pastroq bo'lgan nishon.",
      en: "Primary dystonia; Parkinson's disease with prominent levodopa-induced dyskinesia or cognitive vulnerability.",
    },
    partId: 'g-right-globus-pallidus',
    acpc: {
      lateral: { value: { min: 19, max: 22 }, refs: ['starr2002', 'machado2006'], origin: 'literature' },
      y: { value: { min: 2, max: 3 }, refs: ['starr2002', 'machado2006'], origin: 'literature', note: 'Anterior to MCP' },
      z: { value: { min: -6, max: -4 }, refs: ['starr2002', 'machado2006'], origin: 'literature', note: '2–3 mm superior to optic tract' },
    },
    entry: {
      lateralMm: { value: { min: 30, max: 40 }, refs: ['starr2002', 'machado2006'], origin: 'literature' },
      sagittalDeg: { value: { min: 55, max: 65 }, refs: ['starr2002', 'machado2006'], origin: 'literature' },
      coronalDeg: { value: { min: 5, max: 15 }, refs: ['starr2002', 'machado2006'], origin: 'literature', note: 'More vertical than STN' },
      aheadOfCoronalMm: { value: { min: 0, max: 10 }, refs: ['starr2002', 'machado2006'], origin: 'literature' },
    },
    avoid: [
      {
        partId: 'wm-internal-capsule-posterior-limb-right',
        kind: 'capsule',
        severity: 'major',
        safeMm: safe3(['starr2002', 'machado2006']),
        consequence: {
          uz: 'Ichki kapsula orqa oyoqchasi (medial/orqa): tonik motor qisqarish va dizartriya.',
          en: 'Posterior limb of internal capsule (medial/posterior): tonic motor contraction and dysarthria.',
        },
      },
      {
        partId: 'g-right-optic-tract',
        kind: 'tract',
        severity: 'major',
        safeMm: safe3(['starr2002', 'machado2006']),
        consequence: {
          uz: "Ko'rish trakti (pastki): kontralateral ko'rish maydonida fosfenlar va ko'rish nuqsoni.",
          en: 'Optic tract (inferior): contralateral visual phosphenes and visual field deficit.',
        },
      },
      {
        partId: 'g-right-lateral-ventricle',
        kind: 'ventricle',
        severity: 'major',
        safeMm: safe3(['zrinzo2012']),
        consequence: { uz: 'Yon qorincha: intraventrikulyar qon ketish xavfi.', en: 'Lateral ventricle: risk of intraventricular hemorrhage.' },
      },
    ],
  },

  vim: {
    id: 'vim',
    name: { uz: 'Talamus ventral oraliq yadrosi (Vim)', en: 'Ventral intermediate nucleus (Vim)' },
    indication: {
      uz: 'Dori terapiyasiga chidamli essensial tremor (ET) va tremor-dominant Parkinson kasalligi.',
      en: "Medication-refractory essential tremor (ET) and tremor-dominant Parkinson's disease.",
    },
    partId: 'j-vim-right',
    acpc: {
      lateral: { value: { min: 13, max: 15 }, refs: ['papavassiliou2004', 'gross2006'], origin: 'literature', note: 'Or 11–11.5 mm lateral to third ventricle wall' },
      y: { value: { min: -7, max: -6 }, refs: ['papavassiliou2004', 'gross2006'], origin: 'literature', note: 'Or 25% of AC–PC length anterior to PC' },
      z: { value: { min: 0, max: 0 }, refs: ['papavassiliou2004', 'gross2006'], origin: 'literature', note: 'On the AC–PC plane' },
    },
    entry: {
      lateralMm: { value: { min: 25, max: 35 }, refs: ['papavassiliou2004', 'gross2006'], origin: 'literature' },
      sagittalDeg: { value: { min: 55, max: 65 }, refs: ['papavassiliou2004', 'gross2006'], origin: 'literature' },
      coronalDeg: { value: { min: 15, max: 25 }, refs: ['papavassiliou2004', 'gross2006'], origin: 'literature' },
      aheadOfCoronalMm: { value: { min: 0, max: 15 }, refs: ['papavassiliou2004', 'gross2006'], origin: 'literature' },
    },
    avoid: [
      {
        partId: 'j-vpl-right',
        kind: 'nucleus',
        severity: 'major',
        safeMm: safe3(['papavassiliou2004', 'gross2006']),
        consequence: {
          uz: 'Vc sezgi talamusi (orqa): kontralateral barmoqlar va labda doimiy paresteziya.',
          en: 'Vc sensory thalamus (posterior): persistent contralateral finger/lip paresthesia.',
        },
      },
      {
        partId: 'g-right-internal-capsule',
        kind: 'capsule',
        severity: 'major',
        safeMm: safe3(['gross2006']),
        consequence: { uz: 'Ichki kapsula (lateral): kapsulyar tetaniya va dizartriya.', en: 'Internal capsule (lateral): capsular tetany and dysarthria.' },
      },
      {
        partId: 'g-right-lateral-ventricle',
        kind: 'ventricle',
        severity: 'major',
        safeMm: safe3(['zrinzo2012']),
        consequence: { uz: 'Yon qorincha: intraventrikulyar qon ketish va og‘ish xavfi.', en: 'Lateral ventricle: intraventricular hemorrhage and deflection risk.' },
      },
    ],
  },
}

// ── MER Electrophysiological Layers (dbs.md §4.2) ──────────────────────────

export const DBS_MER_LAYERS: readonly MerLayer[] = [
  // STN track: +15 mm → -5 mm
  {
    id: 'stn-thalamus',
    target: 'stn',
    fromMm: 15,
    toMm: 6,
    partId: 'j-vla-right',
    name: { uz: 'Talamus (VA / VLa)', en: 'Thalamus (VA / VLa)' },
    kind: 'sparse-burst',
    rateHz: { value: { min: 10, max: 30 }, refs: ['starr2002', 'gross2006'], origin: 'literature' },
    burstiness: 0.45,
    noise: 0.25,
    response: 'weak',
    isTarget: false,
    refs: ['starr2002', 'gross2006'],
  },
  {
    id: 'stn-zi',
    target: 'stn',
    fromMm: 6,
    toMm: 3,
    partId: 'j-zi-right',
    name: { uz: 'Zona incerta (sokin zona)', en: 'Zona incerta (quiet zone)' },
    kind: 'silent',
    rateHz: { value: { min: 2, max: 8 }, refs: ['starr2002', 'gross2006'], origin: 'literature', note: 'Low background noise, sparse cells' },
    burstiness: 0.1,
    noise: 0.1,
    response: 'none',
    isTarget: false,
    refs: ['starr2002', 'gross2006'],
  },
  {
    id: 'stn-target',
    target: 'stn',
    fromMm: 3,
    toMm: -2.5,
    partId: 'j-stn-right',
    name: { uz: 'Subtalamik yadro (STN)', en: 'Subthalamic nucleus (STN)' },
    kind: 'dense-irregular',
    rateHz: { value: { min: 25, max: 45 }, refs: ['starr2002', 'gross2006', 'machado2006'], origin: 'literature', note: 'Ideal span ≥ 4–5 mm; loud "rain" background' },
    burstiness: 0.75,
    noise: 0.85,
    response: 'kinesthetic',
    isTarget: true,
    refs: ['starr2002', 'gross2006', 'machado2006'],
  },
  {
    id: 'stn-snr',
    target: 'stn',
    fromMm: -2.5,
    toMm: -5,
    partId: 'j-snr-right',
    name: { uz: 'Qora modda pars reticulata (SNr)', en: 'Substantia nigra pars reticulata (SNr)' },
    kind: 'regular-high',
    rateHz: { value: { min: 60, max: 90 }, refs: ['starr2002', 'gross2006', 'machado2006'], origin: 'literature', note: 'High-pitched regular "motor" discharge' },
    burstiness: 0.12,
    noise: 0.55,
    response: 'none',
    isTarget: false,
    refs: ['starr2002', 'gross2006', 'machado2006'],
  },

  // GPi track: +12 mm → -5 mm
  {
    id: 'gpi-gpe',
    target: 'gpi',
    fromMm: 12,
    toMm: 5,
    partId: 'g-right-globus-pallidus',
    name: { uz: 'Tashqi rangpar shar (GPe)', en: 'Globus pallidus externus (GPe)' },
    kind: 'pauser-burster',
    rateHz: { value: { min: 40, max: 60 }, refs: ['starr2002', 'gross2006'], origin: 'literature', note: 'Pauser and burster units' },
    burstiness: 0.7,
    noise: 0.5,
    response: 'weak',
    isTarget: false,
    refs: ['starr2002', 'gross2006'],
  },
  {
    id: 'gpi-lamina',
    target: 'gpi',
    fromMm: 5,
    toMm: 4,
    partId: 'g-right-globus-pallidus',
    name: { uz: 'Ichki medulyar lamina (border cells)', en: 'Internal medullary lamina (border cells)' },
    kind: 'border',
    rateHz: { value: { min: 20, max: 40 }, refs: ['starr2002', 'gross2006'], origin: 'literature', note: 'Very regular border cells' },
    burstiness: 0.08,
    noise: 0.25,
    response: 'none',
    isTarget: false,
    refs: ['starr2002', 'gross2006'],
  },
  {
    id: 'gpi-target',
    target: 'gpi',
    fromMm: 4,
    toMm: -2,
    partId: 'g-right-globus-pallidus',
    name: { uz: 'Ichki rangpar shar (GPi)', en: 'Globus pallidus internus (GPi)' },
    kind: 'tonic-irregular',
    rateHz: { value: { min: 60, max: 90 }, refs: ['starr2002', 'gross2006', 'machado2006'], origin: 'literature' },
    burstiness: 0.35,
    noise: 0.85,
    response: 'kinesthetic',
    isTarget: true,
    refs: ['starr2002', 'gross2006', 'machado2006'],
  },
  {
    id: 'gpi-optic',
    target: 'gpi',
    fromMm: -2,
    toMm: -5,
    partId: 'g-right-optic-tract',
    name: { uz: "Ko'rish trakti (Optic tract)", en: 'Optic tract' },
    kind: 'white-matter',
    rateHz: { value: { min: 2, max: 10 }, refs: ['starr2002', 'gross2006'], origin: 'literature', note: 'Quiet white matter; strobe-flash background rise at -3…-5 mm' },
    burstiness: 0.05,
    noise: 0.15,
    response: 'visual-flash',
    isTarget: false,
    refs: ['starr2002', 'gross2006'],
  },

  // Vim track: +10 mm → -5 mm
  {
    id: 'vim-voa',
    target: 'vim',
    fromMm: 10,
    toMm: 3,
    partId: 'j-vla-right',
    name: { uz: 'Voa / Vop talamus', en: 'Voa / Vop thalamus' },
    kind: 'sparse-burst',
    rateHz: { value: { min: 15, max: 30 }, refs: ['gross2006', 'papavassiliou2004'], origin: 'literature' },
    burstiness: 0.35,
    noise: 0.3,
    response: 'voluntary',
    isTarget: false,
    refs: ['gross2006', 'papavassiliou2004'],
  },
  {
    id: 'vim-target',
    target: 'vim',
    fromMm: 3,
    toMm: -1,
    partId: 'j-vim-right',
    name: { uz: 'Vim (tremor hujayralari)', en: 'Vim (tremor cells)' },
    kind: 'tremor-locked',
    rateHz: { value: { min: 20, max: 40 }, refs: ['gross2006', 'papavassiliou2004'], origin: 'literature' },
    burstiness: 0.85,
    noise: 0.7,
    tremorHz: { value: { min: 4, max: 6 }, refs: ['gross2006'], origin: 'literature', note: '4–6 Hz tremor-synchronous bursts' },
    response: 'kinesthetic',
    isTarget: true,
    refs: ['gross2006', 'papavassiliou2004'],
  },
  {
    id: 'vim-vc',
    target: 'vim',
    fromMm: -1,
    toMm: -5,
    partId: 'j-vpl-right',
    name: { uz: 'Vc sezgi talamusi (VPL / VPM)', en: 'Vc sensory thalamus (VPL / VPM)' },
    kind: 'sensory-burst',
    rateHz: { value: { min: 25, max: 50 }, refs: ['gross2006', 'papavassiliou2004'], origin: 'literature', note: 'Short bursts locked to light cutaneous touch' },
    burstiness: 0.65,
    noise: 0.55,
    response: 'tactile',
    isTarget: false,
    refs: ['gross2006', 'papavassiliou2004'],
  },
]

export const DBS_MER_BY_TARGET: Record<DbsTargetId, readonly MerLayer[]> = {
  stn: DBS_MER_LAYERS.filter((l) => l.target === 'stn'),
  gpi: DBS_MER_LAYERS.filter((l) => l.target === 'gpi'),
  vim: DBS_MER_LAYERS.filter((l) => l.target === 'vim'),
}

// ── Macrostimulation Side-Effects (dbs.md §4.3) ────────────────────────────

const threshLow = (refs: readonly DbsRefId[]): Sourced<Range> => ({
  value: { min: 1.5, max: 3.0 },
  refs,
  origin: 'literature',
  note: 'dbs.md §4.3: side effect below 2.5–3.0 mA requires trajectory shift',
})

export const DBS_STIM_EFFECTS: readonly StimEffect[] = [
  {
    id: 'stn-capsule',
    target: 'stn',
    drift: 'lateral-anterior',
    partId: 'g-right-internal-capsule',
    effect: {
      uz: "Kontralateral og'iz burchagi yoki qo'l tonik qisqarishi (kapsulyar tetaniya), dizartriya.",
      en: 'Contralateral face/hand tonic contraction (capsular tetany) and dysarthria.',
    },
    thresholdMa: threshLow(['machado2006', 'benabid2009']),
    remedy: { uz: 'Traektoriyani 2 mm medialga siljiting (Ben-Gun medial ofset).', en: 'Shift trajectory 2 mm medially (Ben-Gun medial offset).' },
  },
  {
    id: 'stn-lemniscus',
    target: 'stn',
    drift: 'posterior-medial',
    partId: 'wm-medial-lemniscus-right',
    effect: {
      uz: "Kontralateral yuz va qo'lda doimiy paresteziya (uvishish).",
      en: 'Persistent contralateral facial and hand paresthesia.',
    },
    thresholdMa: threshLow(['machado2006', 'gross2006']),
    remedy: { uz: 'Traektoriyani 2 mm oldinga siljiting (Ben-Gun anterior ofset).', en: 'Shift trajectory 2 mm anteriorly (Ben-Gun anterior offset).' },
  },
  {
    id: 'stn-oculomotor',
    target: 'stn',
    drift: 'medial-inferior',
    partId: 'g-trunk-of-right-oculomotor-nerve',
    effect: {
      uz: "Ipsilateral ko'zning medial/pastga og'ishi, diplopiya, midriaz, ataksiya (III nerv / qizil yadro).",
      en: 'Ipsilateral eye adduction/depression, diplopia, mydriasis, ataxia (CN III / red nucleus).',
    },
    thresholdMa: threshLow(['machado2006', 'benabid2009']),
    remedy: { uz: 'Traektoriyani 2 mm lateral va yuqoriga siljiting.', en: 'Shift trajectory 2 mm laterally and superiorly.' },
  },
  {
    id: 'stn-ventromedial',
    target: 'stn',
    drift: 'ventromedial',
    partId: 'g-hypothalamus',
    effect: {
      uz: "Terlash, ko'ngil aynishi, xavotir, gipomaniya (limbik STN / gipotalamus).",
      en: 'Diaphoresis, nausea, anxiety, hypomania (limbic STN / hypothalamus).',
    },
    thresholdMa: threshLow(['machado2006', 'benabid2009']),
    remedy: { uz: 'Kontaktlarni dorsolateral (yuqoriroq) qismga ko‘chiring.', en: 'Move active contacts dorsolaterally (more superiorly).' },
  },
  {
    id: 'gpi-capsule',
    target: 'gpi',
    drift: 'medial-posterior',
    partId: 'wm-internal-capsule-posterior-limb-right',
    effect: {
      uz: "Kontralateral og'iz/qo'l tonik qisqarishi (kapsulyar tetaniya), dizartriya.",
      en: 'Contralateral face/hand tonic contraction (capsular tetany) and dysarthria.',
    },
    thresholdMa: threshLow(['machado2006', 'starr2002']),
    remedy: { uz: 'Traektoriyani 2 mm lateralga siljiting (Ben-Gun lateral ofset).', en: 'Shift trajectory 2 mm laterally (Ben-Gun lateral offset).' },
  },
  {
    id: 'gpi-optic',
    target: 'gpi',
    drift: 'inferior',
    partId: 'g-right-optic-tract',
    effect: {
      uz: "Kontralateral ko'rish maydonida yorug'lik chaqnashlari (fosfenlar).",
      en: 'Contralateral visual field flashes (phosphenes).',
    },
    thresholdMa: threshLow(['machado2006', 'starr2002']),
    remedy: { uz: 'Elektrodni 1–2 mm yuqoriga torting.', en: 'Withdraw the lead 1–2 mm superiorly.' },
  },
  {
    id: 'vim-vc',
    target: 'vim',
    drift: 'posterior',
    partId: 'j-vpl-right',
    effect: {
      uz: 'Kontralateral barmoqlar va labda doimiy paresteziya (Vc talamus).',
      en: 'Persistent contralateral finger and lip paresthesia (Vc thalamus).',
    },
    thresholdMa: threshLow(['gross2006', 'papavassiliou2004']),
    remedy: { uz: 'Traektoriyani 2 mm oldinga siljiting (Ben-Gun anterior ofset).', en: 'Shift trajectory 2 mm anteriorly (Ben-Gun anterior offset).' },
  },
]

// ── Complications (dbs.md §5) ──────────────────────────────────────────────

export interface DbsComplication {
  id: string
  name: L10n
  rate: Sourced<L10n>
  risk: L10n
  refs: readonly DbsRefId[]
}

export const DBS_COMPLICATIONS: readonly DbsComplication[] = [
  {
    id: 'ich',
    name: { uz: 'Intrakranial qon ketish (ICH)', en: 'Intracranial hemorrhage (ICH)' },
    rate: {
      value: { uz: 'KT da ~2.0%–5.0%; simptomatik ~1.1%–2.1%; doimiy defitsit < 1%', en: '~2.0%–5.0% on CT; ~1.1%–2.1% symptomatic; permanent deficit < 1%' },
      refs: ['zrinzo2012', 'fenoy2014'],
      origin: 'literature',
    },
    risk: {
      uz: "Gipertenziya, koagulopatiya, qorincha devorini kesish, sulkal tomir, ortiqcha MER yo'llari.",
      en: 'Hypertension, coagulopathy, ventricular transgression, sulcal vessels, excessive MER tracks.',
    },
    refs: ['zrinzo2012', 'fenoy2014'],
  },
  {
    id: 'infection',
    name: { uz: 'Infeksiya (IPG / elektrod)', en: 'Hardware infection (IPG / lead)' },
    rate: {
      value: { uz: '~3.0%–5.0% (yirik seriyalarda ~3.1%–4.7%)', en: '~3.0%–5.0% (~3.1%–4.7% in large series)' },
      refs: ['fenoy2014', 'follett2010'],
      origin: 'literature',
    },
    risk: { uz: 'Steril texnika, profilaktik antibiotik, teri eroziyasini oldini olish.', en: 'Strict asepsis, prophylactic antibiotics, preventing skin erosion.' },
    refs: ['fenoy2014', 'follett2010'],
  },
  {
    id: 'hardware',
    name: { uz: 'Apparat asoratlari (siljish/sinish)', en: 'Hardware complications (migration/fracture)' },
    rate: {
      value: { uz: '~2.0%–5.0%', en: '~2.0%–5.0%' },
      refs: ['fenoy2014'],
      origin: 'literature',
    },
    risk: { uz: "Burr hole qopqog'ini mahkamlash va uzaytirgichda taranglik qoldirmaslik.", en: 'Secure burr-hole cap fixation and tension-free extension tunneling.' },
    refs: ['fenoy2014'],
  },
  {
    id: 'brain-shift',
    name: { uz: 'Pnevmosefaliya / Brain shift', en: 'Pneumocephalus / Brain shift' },
    rate: {
      value: { uz: 'Klinik siljish 2–4 mm gacha', en: 'Up to 2–4 mm deep nuclear shift' },
      refs: ['machado2006'],
      origin: 'literature',
    },
    risk: {
      uz: "Dura ochilgach darhol fibrin yelim / gelfoam bilan yopish, bosh ko'tarilishini me'yorlash.",
      en: 'Immediate fibrin glue / gelfoam sealing after durotomy, controlled head elevation.',
    },
    refs: ['machado2006'],
  },
  {
    id: 'stim-side-effects',
    name: { uz: "Stimulyatsiyaga bog'liq nojo'ya ta'sirlar", en: 'Stimulation-related side effects' },
    rate: {
      value: { uz: 'Dizartriya ~5%–10%, paresteziya, muvozanat/kognitiv o‘zgarishlar', en: 'Dysarthria ~5%–10%, paresthesia, gait/cognitive effects' },
      refs: ['follett2010', 'benabid2009'],
      origin: 'literature',
    },
    risk: { uz: "To'g'ri elektrod joylashuvi va bipolyar / yo'naltirilgan dasturlash.", en: 'Accurate lead placement and bipolar / directional programming.' },
    refs: ['follett2010', 'benabid2009'],
  },
]

// ── 7 Procedure Steps (dbs.md §4.1) ────────────────────────────────────────

export interface DbsStepDef {
  id: 'acpc' | 'trajectory' | 'burr' | 'guide' | 'mer' | 'macrostim' | 'implant'
  index: number
  name: L10n
  instruction: L10n
  mistake: L10n
  refs: readonly DbsRefId[]
}

export const DBS_STEPS: readonly DbsStepDef[] = [
  {
    id: 'acpc',
    index: 1,
    name: { uz: 'AC–PC belgilash va nishon tanlash', en: 'AC–PC registration & target selection' },
    instruction: {
      uz: "AC, PC va o'rta chiziq nuqtalarini belgilang; klinik ko'rsatmaga ko'ra STN, GPi yoki Vim nishonini tanlang.",
      en: 'Mark AC, PC, and midline; select STN, GPi, or Vim according to clinical indication.',
    },
    mistake: {
      uz: 'AC/PC da 2 mm xato butun stereotaktik koordinata tizimini siljitadi.',
      en: 'A 2 mm error in AC/PC shifts the entire stereotactic coordinate frame.',
    },
    refs: ['starr2002', 'machado2006'],
  },
  {
    id: 'trajectory',
    index: 2,
    name: { uz: 'Kirish nuqtasi va traektoriya tekshiruvi', en: 'Entry point & trajectory check' },
    instruction: {
      uz: "Koronar chok atrofida pushta cho'qqisini tanlang; traektoriyaning yon qorincha, egat va tomirlardan ≥ 3 mm uzoqligini tekshiring.",
      en: 'Pick a gyral crown near the coronal suture; verify ≥ 3 mm clearance from lateral ventricle, sulci, and vessels.',
    },
    mistake: {
      uz: 'Yon qorincha yoki sulkal tomir kesib o‘tilsa intrakranial qon ketish (ICH) xavfi keskin oshadi.',
      en: 'Crossing the lateral ventricle or a sulcal vessel sharply increases ICH risk.',
    },
    refs: ['zrinzo2012', 'machado2006'],
  },
  {
    id: 'burr',
    index: 3,
    name: { uz: "Burg'u teshigi va dura ochilishi", en: 'Burr hole & durotomy' },
    instruction: {
      uz: "14 mm burg'u teshigi oching; dura kesilgach likvor yo'qotilishini to'xtatish uchun darhol fibrin yelim / gelfoam qo'ying.",
      en: 'Drill a 14 mm burr hole; seal immediately with fibrin glue / gelfoam after durotomy to prevent CSF loss.',
    },
    mistake: {
      uz: 'Dura uzoq ochiq qolsa pnevmosefaliya va 2–4 mm brain shift (chuqur yadrolar siljishi) yuz beradi.',
      en: 'Prolonged open dura causes pneumocephalus and 2–4 mm brain shift.',
    },
    refs: ['machado2006'],
  },
  {
    id: 'guide',
    index: 4,
    name: { uz: "Yo'naltiruvchi kanula (Guide tube)", en: 'Guide tube insertion' },
    instruction: {
      uz: 'Kanulani rejalangan nishondan 10–15 mm yuqorigacha kiriting.',
      en: 'Advance the guide tube to 10–15 mm above the planned target.',
    },
    mistake: {
      uz: "Kanulani juda chuqur kiritish nishon yadroning o'ziga mexanik shikast yetkazadi.",
      en: 'Advancing the guide tube too deep mechanically injures the target nucleus.',
    },
    refs: ['machado2006'],
  },
  {
    id: 'mer',
    index: 5,
    name: { uz: 'Mikrodrayv va MER xaritalash', en: 'Microdrive & MER mapping' },
    instruction: {
      uz: 'Mikroelektrodni 0.5 mm qadam bilan +15 mm dan −5 mm gacha tushiring; har qatlam tovushi, spike chastotasi va kinestetik javobini qayd eting.',
      en: 'Advance the microelectrode in 0.5 mm steps from +15 mm to −5 mm; identify layer boundaries by MER audio, firing rate, and kinesthetic response.',
    },
    mistake: {
      uz: 'MER chegaralarini noto‘g‘ri aniqlash elektrodni ZI yoki SNr da qoldirib samarasiz DBS ga olib keladi.',
      en: 'Misidentifying MER borders leaves the lead in ZI or SNr, causing ineffective stimulation.',
    },
    refs: ['starr2002', 'gross2006', 'machado2006'],
  },
  {
    id: 'macrostim',
    index: 6,
    name: { uz: 'Makrostimulyatsiya (Test stimulation)', en: 'Macrostimulation testing' },
    instruction: {
      uz: "130 Hz, 60–90 µs da 0.5–5.0 mA oqim bilan klinik foyda va nojo'ya ta'sir chegaralarini o'lchang (terapevtik oyna ≥ 1.5 mA).",
      en: 'Test 0.5–5.0 mA at 130 Hz, 60–90 µs to measure benefit vs side-effect thresholds (therapeutic window ≥ 1.5 mA).',
    },
    mistake: {
      uz: "Terapevtik oyna < 1.5 mA bo'lsa Ben-Gun 2 mm ofset bilan traektoriyani siljitmaslik doimiy nojo'ya ta'sir beradi.",
      en: 'Failing to shift 2 mm via Ben-Gun when therapeutic window < 1.5 mA leaves intolerable side effects.',
    },
    refs: ['machado2006', 'gross2006', 'benabid2009'],
  },
  {
    id: 'implant',
    index: 7,
    name: { uz: 'Doimiy elektrodni joylashtirish', en: 'Permanent lead implantation' },
    instruction: {
      uz: "4-kontaktli (yoki 8-kontaktli yo'naltirilgan) DBS elektrodini o'rnating va burr-hole qopqog'i bilan siljitmasdan mahkamlang.",
      en: 'Implant the 4-contact (or 8-contact directional) DBS lead and lock with the burr-hole cap without migration.',
    },
    mistake: {
      uz: 'Mahkamlash vaqtida siljish elektrodni 2–3 mm yuqoriga chiqarib yuborishi mumkin.',
      en: 'Lead slip during securing can pull contacts 2–3 mm superiorly.',
    },
    refs: ['machado2006', 'fenoy2014', 'krauss2020'],
  },
]

// ── Scoring Bands (dbs.md §6 · OSATS Martin 1997 / Kirkman 2014) ───────────

const band = (upTo: number, score: 1 | 3 | 5, uz: string, en: string): ScoreBand => ({ upTo, score, label: { uz, en } })
const A = (upTo: number) => band(upTo, 5, "a'lo", 'excellent')
const S = (upTo: number) => band(upTo, 3, 'qoniqarli', 'satisfactory')
const P = (upTo: number) => band(upTo, 1, 'qoniqarsiz', 'poor')

/**
 * Every band list is ordered by ascending `upTo` so `bands.find(b => value <= b.upTo)` works uniformly:
 * - Lower-is-better metrics (`radialErrorMm`, `merBoundaryErrorMm`, `tracks`): 5 → 3 → 1.
 * - Higher-is-better metrics (`trajectoryClearanceMm`, `therapeuticWindowMa`): 1 → 3 → 5.
 */
export const DBS_METRICS: DbsMetricSpecs = {
  // dbs.md §6 row 1: ≤ 1.5 mm excellent, 1.5–2.5 mm satisfactory, > 2.5 mm poor
  radialErrorMm: [A(1.5), S(2.5), P(Infinity)],
  // dbs.md §6 row 2: < 1 mm poor (collision/too close), 1–3 mm satisfactory, ≥ 3 mm excellent
  trajectoryClearanceMm: [P(1.0), S(3.0), A(Infinity)],
  // dbs.md §6 row 3: ±0.5 mm excellent, ±1.0 mm satisfactory, > 1.5 mm poor
  merBoundaryErrorMm: [A(0.5), S(1.0), P(Infinity)],
  // dbs.md §6 row 4: < 1.0 mA poor, 1.0–1.5 mA satisfactory, ≥ 1.5 mA excellent
  therapeuticWindowMa: [P(1.0), S(1.5), A(Infinity)],
  // dbs.md §6 row 5: 1–2 tracks excellent, 3 satisfactory, ≥ 4 poor (Zrinzo 2012)
  tracks: [A(2), S(3), P(Infinity)],
}
