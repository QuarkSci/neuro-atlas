// Test data for the SX-6 logic: targets, MER layers and side effects as in docs/research/procedures/dbs.md (3.2, 3.3, 4.2, 4.3).
// The real data is AG-16's `src/or/dbs/data.ts`; this file only lets the logic be tested before it lands. Not shipped.
const S = (value, refs = ['starr2002']) => ({ value, refs, origin: 'literature' })
const R = (min, max) => ({ min, max })
const L = (uz, en = uz) => ({ uz, en })

const avoidCommon = [
  {
    partId: 'g-right-lateral-ventricle',
    kind: 'ventricle',
    severity: 'major',
    safeMm: S(3, ['zrinzo2012']),
    consequence: L('Qorincha kesib o‘tildi: ICH xavfi', 'Ventricle crossed: ICH risk'),
  },
  { partId: 'g-right-caudate-nucleus', kind: 'nucleus', severity: 'minor', safeMm: S(2, ['zrinzo2012']), consequence: L('Dumli yadro', 'Caudate') },
  { partId: 'g-right-superior-thalamostriate-vein', kind: 'vessel', severity: 'major', safeMm: S(3, ['zrinzo2012']), consequence: L('Tomir: qon ketish', 'Vessel: bleeding') },
]
const entry = (lat, sag, cor) => ({ lateralMm: S(lat), sagittalDeg: S(sag), coronalDeg: S(cor), aheadOfCoronalMm: S(R(0, 10)) })

export const TARGETS = {
  stn: {
    id: 'stn',
    name: L('STN'),
    indication: L('Parkinson'),
    partId: 'j-stn-right',
    acpc: { lateral: S(R(11, 12)), y: S(R(-4, -2)), z: S(R(-5, -4)) },
    entry: entry(R(25, 35), R(55, 65), R(15, 20)),
    avoid: avoidCommon,
  },
  gpi: {
    id: 'gpi',
    name: L('GPi'),
    indication: L('Distoniya'),
    partId: 'g-right-globus-pallidus',
    acpc: { lateral: S(R(19, 22)), y: S(R(2, 3)), z: S(R(-6, -4)) },
    entry: entry(R(30, 40), R(55, 65), R(5, 15)),
    avoid: avoidCommon,
  },
  vim: {
    id: 'vim',
    name: L('Vim'),
    indication: L('Tremor'),
    partId: 'j-vim-right',
    acpc: { lateral: S(R(13, 15)), y: S(R(-7, -6)), z: S(R(0, 0)) },
    entry: entry(R(25, 35), R(55, 65), R(15, 25)),
    avoid: avoidCommon,
  },
}

const lay = (id, target, fromMm, toMm, partId, kind, rate, burst, noise, response, isTarget, extra = {}) => ({
  id,
  target,
  fromMm,
  toMm,
  partId,
  name: L(id),
  kind,
  rateHz: S(rate),
  burstiness: burst,
  noise,
  response,
  isTarget,
  refs: ['starr2002'],
  ...extra,
})

export const LAYERS = [
  lay('stn-thal', 'stn', 15, 6, 'j-vla-right', 'sparse-burst', R(10, 30), 0.7, 0.2, 'none', false),
  lay('stn-zi', 'stn', 6, 3, 'j-zi-right', 'silent', R(2, 8), 0.1, 0.05, 'none', false),
  lay('stn', 'stn', 3, -2.5, 'j-stn-right', 'dense-irregular', R(25, 45), 0.6, 0.9, 'kinesthetic', true),
  lay('stn-snr', 'stn', -2.5, -5, 'j-snr-right', 'regular-high', R(60, 90), 0.05, 0.4, 'none', false),
  lay('gpi-gpe', 'gpi', 12, 5, 'g-right-globus-pallidus', 'pauser-burster', R(40, 60), 0.6, 0.4, 'weak', false),
  lay('gpi-lam', 'gpi', 5, 4, 'g-right-globus-pallidus', 'border', R(20, 40), 0.05, 0.2, 'none', false),
  lay('gpi', 'gpi', 4, -2, 'g-right-globus-pallidus', 'tonic-irregular', R(60, 90), 0.3, 0.7, 'kinesthetic', true),
  lay('gpi-ot', 'gpi', -2, -5, 'g-right-optic-tract', 'white-matter', R(0, 5), 0, 0.05, 'visual-flash', false),
  lay('vim-voa', 'vim', 10, 3, 'j-vla-right', 'sparse-burst', R(15, 30), 0.4, 0.3, 'voluntary', false),
  lay('vim', 'vim', 3, -1, 'j-vim-right', 'tremor-locked', R(15, 30), 0.8, 0.5, 'kinesthetic', true, { tremorHz: S(R(4, 6)) }),
  lay('vim-vc', 'vim', -1, -5, 'j-vpl-right', 'sensory-burst', R(20, 40), 0.8, 0.5, 'tactile', false),
]

const eff = (id, target, partId, thr, effect, remedy) => ({ id, target, drift: 'lateral', partId, effect: L(effect), thresholdMa: S(thr, ['machado2006']), remedy: L(remedy) })
export const EFFECTS = [
  eff('stn-capsule', 'stn', 'g-right-internal-capsule', R(2.5, 3), 'Tonic contraction (capsule)', 'Shift medially'),
  eff('stn-ml', 'stn', 'wm-medial-lemniscus-right', R(2.5, 3), 'Paresthesia', 'Shift anteriorly'),
  eff('stn-iii', 'stn', 'g-trunk-of-right-oculomotor-nerve', R(2.5, 3), 'Diplopia', 'Shift laterally and up'),
  eff('gpi-ot', 'gpi', 'g-right-optic-tract', R(2.5, 3), 'Phosphenes', 'Withdraw 1–2 mm'),
  eff('gpi-capsule', 'gpi', 'g-right-internal-capsule', R(2.5, 3), 'Tonic contraction (capsule)', 'Shift laterally'),
  eff('vim-vc', 'vim', 'j-vpl-right', R(2.5, 3), 'Paresthesia (Vc)', 'Shift anteriorly'),
]

export const DATA = { targets: TARGETS, layers: LAYERS, effects: EFFECTS }
