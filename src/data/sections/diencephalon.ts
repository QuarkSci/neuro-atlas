import { B, D, E, L, sym } from './shapes'
import type { Section } from './types'

const AXES_COR: Section['axes'] = [
  { en: 'Dorsal', uz: 'Dorsal (yuqori)' },
  { en: 'Ventral', uz: 'Ventral (pastki)' },
  { en: 'Right', uz: "O'ng" },
  { en: 'Left', uz: 'Chap' },
]
const AXES_SAG: Section['axes'] = [
  { en: 'Dorsal', uz: 'Dorsal (yuqori)' },
  { en: 'Ventral', uz: 'Ventral (pastki)' },
  { en: 'Anterior', uz: 'Old' },
  { en: 'Posterior', uz: 'Orqa' },
]
const CORONAL = { en: 'Coronal, viewed from the front · dorsal up', uz: "Koronal, old tomondan ko'rinish · dorsal tomon yuqorida" }
const SRC_TH = [
  { title: 'Wikipedia — Thalamus (nuclei)', url: 'https://en.wikipedia.org/wiki/Thalamus' },
  { title: 'StatPearls — Neuroanatomy, Thalamus', url: 'https://www.ncbi.nlm.nih.gov/books/NBK542184/' },
]
const SRC_HY = [
  { title: 'Wikipedia — Hypothalamus (nuclei & zones)', url: 'https://en.wikipedia.org/wiki/Hypothalamus' },
  { title: 'StatPearls — Neuroanatomy, Hypothalamus', url: 'https://www.ncbi.nlm.nih.gov/books/NBK525993/' },
  { title: 'Saper & Lowell 2014 — The hypothalamus (Curr Biol, open access)', url: 'https://doi.org/10.1016/j.cub.2014.10.023' },
]
const THAL_MESH = /^g-(left|right)-thalamus$/
const HYPO_MESH = /^g-hypothalamus$|^g-mammillary-body$|^g-optic-chiasm$/
const C = 320
const H = 260

/** Coronal plane at MNI y (normal points anterior). */
const coronal = (y: number) => ({ point: [0, y, 0] as [number, number, number], normal: [0, 1, 0] as [number, number, number] })

/** Hypothalamic crop: 3rd ventricle in the middle, thalamus above, walls either side. */
// Lateral edge follows the internal capsule: the crop stops where the
// hypothalamus does, so no lentiform tissue is left unnamed beside it.
const hypoOutline = [B(...sym([[H, 40], [200, 40], [138, 46], [100, 72], [86, 130], [84, 200], [90, 270], [114, 330], [176, 366], [236, 370], [H, 362]], H))]
const hypoRegions = (sulcus: number): Section['regions'] => [
  { id: 'thal', shapes: [B([H - 6, 46], [196, 48], [128, 62], [118, sulcus - 8], [200, sulcus], [H - 6, sulcus + 6]), B([H + 6, 46], [324, 48], [392, 62], [402, sulcus - 8], [320, sulcus], [H + 6, sulcus + 6])], label: { en: 'Thalamus', uz: 'Talamus' }, at: [160, 86] },
  { shapes: [L(2, [H - 4, sulcus + 8], [196, sulcus + 2]), L(2, [H + 4, sulcus + 8], [324, sulcus + 2])] },
]

export const DIENCEPHALON: Section[] = [
  // ── T1 · Mid-thalamic coronal ──────────────────────────────────────
  {
    id: 'thalamus-coronal',
    code: 'T1',
    region: 'diencephalon',
    title: { en: 'Thalamus — mid-thalamic coronal level (VPL/VPM, CM, STN)', uz: "Talamus — o'rta talamik koronal daraja (VPL/VPM, CM, STN)" },
    orientation: CORONAL,
    plane: coronal(-18),
    contour: THAL_MESH,
    pin: { side: 'top' },
    loc: [94, 24, 94, 112],
    w: 640,
    h: 420,
    axes: AXES_COR,
    outline: [B(...sym([[C, 24], [220, 24], [110, 36], [66, 84], [56, 190], [70, 296], [112, 358], [196, 384], [272, 380], [C, 352]], C))],
    ground: 'hemi-wm',
    regions: [{ id: 'thal', shapes: [B([310, 112], [280, 104], [244, 108], [214, 124], [196, 152], [192, 196], [204, 236], [232, 262], [270, 272], [304, 268], [312, 240]), B([330, 112], [360, 104], [396, 108], [426, 124], [444, 152], [448, 196], [436, 236], [408, 262], [370, 272], [336, 268], [328, 240])], label: { en: 'Thalamus', uz: 'Talamus' } }],
    items: [
      { id: 'cca', mirror: true, at: [214, 52], shapes: [B([C, 36], [250, 34], [180, 42], [124, 62], [130, 78], [188, 60], [254, 52], [C, 54])] },
      { id: 'lv', mirror: true, shapes: [B([304, 62], [254, 62], [210, 72], [214, 88], [258, 84], [304, 80])], note: { en: 'body', uz: 'tanasi' } },
      { id: 'fx', mirror: true, shapes: [E(304, 96, 10, 7)], note: { en: 'body', uz: 'tanasi' } },
      { id: 'cau', mirror: true, shapes: [B([208, 74], [184, 82], [174, 104], [196, 108], [214, 92])] },
      { id: 'sm', mirror: true, shapes: [E(305, 114, 6, 5)] },
      { id: 'th-md', mirror: true, shapes: [B([308, 124], [284, 118], [262, 126], [254, 152], [262, 182], [286, 192], [308, 182])] },
      { id: 'th-iml', mirror: true, at: [252, 132], shapes: [L(3, [292, 110], [264, 120], [248, 150], [250, 190], [266, 212])] },
      { id: 'th-cm', mirror: true, shapes: [E(282, 212, 13, 10)] },
      { id: 'th-pf', mirror: true, shapes: [E(302, 222, 7, 7)] },
      { id: 'th-lp', mirror: true, shapes: [B([244, 114], [220, 126], [212, 150], [234, 158], [248, 138])] },
      { id: 'th-vpl', mirror: true, shapes: [B([236, 168], [212, 176], [206, 206], [220, 234], [242, 224], [244, 194])] },
      { id: 'th-vpm', mirror: true, shapes: [B([258, 200], [248, 202], [246, 232], [258, 248], [268, 234], [266, 210])] },
      { id: 'th-eml', mirror: true, at: [204, 140], shapes: [L(2.4, [222, 118], [204, 146], [198, 190], [208, 232], [232, 256])] },
      { id: 'th-ret', mirror: true, at: [190, 190], shapes: [B([212, 116], [190, 140], [182, 190], [194, 236], [222, 262], [214, 240], [200, 192], [204, 146], [218, 122])] },
      { id: 'v3', shapes: [B([316, 104], [313, 150], [313, 220], [316, 300], [324, 300], [327, 220], [327, 150], [324, 104])], at: [C, 160] },
      { id: 'ic3', mirror: true, at: [166, 208], shapes: [B([186, 112], [170, 124], [160, 160], [156, 214], [164, 262], [178, 264], [178, 214], [182, 160], [192, 124])], note: { en: 'posterior limb', uz: "orqa oyog'i" } },
      { id: 'put', mirror: true, shapes: [B([124, 112], [104, 140], [96, 190], [106, 232], [124, 226], [128, 170], [132, 124])] },
      { id: 'gpe', mirror: true, shapes: [B([137, 150], [128, 178], [132, 210], [140, 198], [142, 168])] },
      { id: 'gpi', mirror: true, shapes: [B([149, 172], [144, 190], [147, 210], [153, 195])] },
      { id: 'zi', mirror: true, at: [236, 278], shapes: [L(4, [298, 284], [266, 282], [232, 278], [204, 272])] },
      { id: 'stn', mirror: true, shapes: [E(250, 302, 26, 9, -12)] },
      { id: 'rn', mirror: true, shapes: [E(290, 318, 14, 13)], note: { en: 'rostral pole', uz: 'rostral qutbi' } },
      { id: 'snr', mirror: true, at: [236, 330], shapes: [B([262, 322], [238, 318], [220, 334], [244, 344], [266, 336])], note: { en: 'substantia nigra (rostral)', uz: 'qora modda (rostral)' } },
      { id: 'crus', mirror: true, at: [196, 330], shapes: [B([222, 312], [196, 306], [168, 294], [150, 286], [146, 312], [168, 344], [204, 360], [232, 352])] },
      { id: 'ot', mirror: true, shapes: [E(144, 336, 11, 7, 30)] },
    ],
    landmarks: {
      en: 'Both thalami flank the slit-like 3rd ventricle. The Y-shaped internal medullary lamina separates the medial MD from the lateral group; CM sits inside it. Laterally the ventral tier (VPL lateral, VPM medial) and dorsal tier (LP) are wrapped by the external medullary lamina and the reticular nucleus, then the posterior limb of the internal capsule and the lentiform nucleus. Below: zona incerta, the lens-shaped STN on the crus, substantia nigra and the rostral red nucleus.',
      uz: "Ikki talamus yoriqsimon III qorinchaning ikki yonida. Y-shaklli ichki medullyar plastinka medial MD'ni lateral guruhdan ajratadi; CM uning ichida. Lateralda ventral qavat (VPL lateral, VPM medial) va dorsal qavat (LP) — ularni tashqi medullyar plastinka va to'rsimon yadro o'raydi, keyin ichki kapsulaning orqa oyog'i va yasmiqsimon yadro. Pastda: zona incerta, oyoqcha ustidagi yasmiqsimon STN, qora modda va qizil yadroning rostral qutbi.",
    },
    blood: {
      en: 'Four thalamic territories: tuberothalamic (PCom: anterior, VA, ventral VL), paramedian / thalamoperforating (P1: MD, CM, intralaminar — artery of Percheron), inferolateral / thalamogeniculate (P2: VPL, VPM, VL), posterior choroidal (pulvinar, LGN, LP). Internal capsule posterior limb: anterior choroidal and lenticulostriate arteries.',
      uz: "To'rt talamik hudud: tuberotalamik (PCom: oldingi, VA, ventral VL), paramedian / talamoperforant (P1: MD, CM, intralaminar — Percheron arteriyasi), inferolateral / talamogenikulyar (P2: VPL, VPM, VL), orqa xorioidal (pulvinar, LGN, LP). Ichki kapsula orqa oyog'i: oldingi xorioidal va lentikulostriar arteriyalar.",
    },
    syndromes: [
      { name: { en: 'Dejerine–Roussy (thalamic pain)', uz: "Dejerine–Roussy (talamik og'riq)" }, text: { en: 'Inferolateral (thalamogeniculate) infarct of VPL/VPM: contralateral hemianaesthesia, then burning allodynic central pain; hemiataxia, choreoathetosis.', uz: "VPL/VPM ning inferolateral (talamogenikulyar) infarkti: qarama-qarshi gemianesteziya, keyin achishtiruvchi allodinik markaziy og'riq; gemiataksiya, xoreoatetoz." } },
      { name: { en: 'Artery of Percheron infarct', uz: 'Percheron arteriyasi infarkti' }, text: { en: 'Bilateral paramedian thalami (MD, intralaminar) ± rostral midbrain: coma or hypersomnolence, vertical gaze palsy, amnesia, apathy.', uz: "Ikki tomonlama paramedian talamus (MD, intralaminar) ± rostral o'rta miya: koma yoki gipersomnoliya, vertikal qarash falaji, amneziya, apatiya." } },
      { name: { en: 'Hemiballismus', uz: 'Gemiballizm' }, text: { en: 'Lacunar lesion of the subthalamic nucleus: violent flinging movements of the contralateral limbs (loss of STN drive to GPi → thalamic disinhibition).', uz: "Subtalamik yadroning lakunar zararlanishi: qarama-qarshi oyoq-qo'llarning keskin otilib ketuvchi harakatlari (STN → GPi qo'zg'alishi yo'qolishi → talamus tormozdan chiqadi)." } },
    ],
    sources: SRC_TH,
  },

  // ── T2 · Thalamic nuclei map (lateral view) ────────────────────────
  {
    id: 'thalamus-nuclei-map',
    code: 'T2',
    region: 'diencephalon',
    title: { en: 'Thalamic nuclei — 3D map (dorsolateral view)', uz: "Talamus yadrolari — fazoviy xarita (dorsolateral ko'rinish)" },
    orientation: { en: 'Not a cut: the classic "egg" diagram of the left thalamus, anterior to the left', uz: "Kesim emas: chap talamusning klassik 'tuxum' sxemasi, old tomon chapda" },
    contour: THAL_MESH,
    pin: { side: 'top', off: 12 },
    w: 640,
    h: 380,
    axes: AXES_SAG,
    outline: [B([110, 196], [134, 124], [214, 82], [336, 74], [452, 96], [526, 150], [548, 214], [516, 276], [420, 306], [300, 308], [188, 290], [130, 254])],
    ground: 'thal',
    items: [
      { id: 'th-iml', at: [356, 182], shapes: [L(7, [440, 186], [372, 182], [304, 178]), L(7, [304, 178], [252, 146], [176, 120]), L(7, [304, 178], [244, 204], [170, 214])] },
      { id: 'th-an', shapes: [B([168, 128], [236, 140], [282, 174], [238, 196], [172, 206], [140, 172])] },
      { id: 'th-md', shapes: [B([270, 96], [350, 86], [420, 104], [446, 150], [420, 172], [340, 170], [292, 156], [262, 128])] },
      { id: 'th-cm', shapes: [E(410, 184, 18, 8)] },
      { id: 'th-ld', shapes: [B([300, 192], [340, 190], [348, 212], [306, 216], [282, 208])] },
      { id: 'th-lp', shapes: [B([352, 192], [416, 196], [424, 220], [356, 222])] },
      { id: 'th-pul', shapes: [B([452, 108], [520, 152], [544, 214], [512, 270], [460, 278], [432, 236], [430, 196], [448, 172])] },
      { id: 'th-va', shapes: [B([150, 222], [196, 216], [222, 228], [216, 268], [172, 266], [140, 246])] },
      { id: 'th-vl', shapes: [B([226, 226], [290, 222], [300, 262], [290, 290], [232, 282], [220, 260])], note: { en: 'VLa (pallidal) + VLp/Vim (cerebellar)', uz: 'VLa (pallidar) + VLp/Vim (miyacha)' } },
      { id: 'th-vpl', shapes: [B([306, 226], [380, 228], [392, 262], [370, 296], [310, 296], [300, 262])] },
      { id: 'th-vpm', shapes: [B([384, 232], [426, 236], [432, 270], [400, 298], [378, 290], [394, 262])] },
      { id: 'lgn', shapes: [E(476, 312, 26, 16, -10)] },
      { id: 'mgb', shapes: [E(418, 326, 22, 14)] },
      { id: 'th-ret', at: [128, 214], shapes: [D(3, [120, 220], [140, 272], [196, 302], [300, 318], [420, 316])] },
      { id: 'th-mid', at: [220, 112], shapes: [D(3, [186, 108], [240, 96], [280, 90])] },
    ],
    landmarks: {
      en: 'Y-shaped internal medullary lamina: anterior group in the fork (Papez circuit), medial group (MD, prefrontal) dorsomedially, lateral group below/lateral. The lateral group has a dorsal tier (LD → LP → pulvinar, association) and a ventral tier from front to back VA → VL → VPL/VPM (motor → somatosensory). Metathalamus: LGN (vision) and MGN (hearing) under the pulvinar. CM (intralaminar) sits in the lamina; the reticular nucleus caps the lateral surface.',
      uz: "Y-shaklli ichki medullyar plastinka: oldingi guruh ayrida (Papez halqasi), medial guruh (MD, prefrontal) dorsomedialda, lateral guruh pastda/lateralda. Lateral guruhning dorsal qavati (LD → LP → pulvinar, assotsiativ) va oldindan orqaga ventral qavati VA → VL → VPL/VPM (harakat → somatosensor). Metatalamus: pulvinar ostida LGN (ko'rish) va MGN (eshitish). CM (intralaminar) plastinka ichida; to'rsimon yadro lateral yuzani qoplaydi.",
    },
    blood: {
      en: 'Tuberothalamic (anterior/VA), paramedian (MD/CM), thalamogeniculate (VL/VPL/VPM), posterior choroidal (pulvinar/LGN/LP).',
      uz: "Tuberotalamik (oldingi/VA), paramedian (MD/CM), talamogenikulyar (VL/VPL/VPM), orqa xorioidal (pulvinar/LGN/LP).",
    },
    syndromes: [
      { name: { en: 'Specific vs non-specific nuclei', uz: 'Spetsifik va nospetsifik yadrolar' }, text: { en: 'Relay (specific) nuclei project to one cortical area (VPL → S1, LGN → V1, VL → M1); association nuclei (MD, pulvinar, LP) to association cortex; non-specific intralaminar/midline nuclei (CM, Pf) diffusely to cortex and striatum — arousal.', uz: "Bo'g'in (spetsifik) yadrolar bitta po'stloq sohasiga (VPL → S1, LGN → V1, VL → M1); assotsiativ yadrolar (MD, pulvinar, LP) assotsiativ po'stloqqa; nospetsifik intralaminar/o'rta chiziq yadrolari (CM, Pf) po'stloq va striatumga diffuz — uyg'oqlik." } },
      { name: { en: 'Stereotactic targets', uz: 'Stereotaktik nishonlar' }, text: { en: 'Vim (VLp) — tremor (DBS, MRgFUS thalamotomy); anterior nucleus — epilepsy (SANTE trial); CM–Pf — Tourette, generalized epilepsy; pulvinar — experimental for posterior-quadrant epilepsy.', uz: "Vim (VLp) — tremor (DBS, MRgFUS talamotomiya); oldingi yadro — epilepsiya (SANTE tadqiqoti); CM–Pf — Tourette, generallashgan epilepsiya; pulvinar — orqa kvadrant epilepsiyasida eksperimental." } },
    ],
    sources: SRC_TH,
  },

  // ── G1 · Hypothalamus, supraoptic (chiasmatic) level ───────────────
  {
    id: 'hypothalamus-chiasmatic',
    code: 'G1',
    region: 'hypothalamus',
    title: { en: 'Hypothalamus — supraoptic (chiasmatic) zone', uz: 'Gipotalamus — supraoptik (xiazmatik) zona' },
    orientation: CORONAL,
    plane: coronal(1.5),
    contour: HYPO_MESH,
    pin: { side: 'front', off: 10, dy: 9 },
    loc: [55, 64, 55, 100],
    w: 520,
    h: 400,
    axes: AXES_COR,
    outline: hypoOutline,
    ground: 'hypo-grey',
    regions: hypoRegions(150),
    items: [
      { id: 'ac', at: [H, 128], shapes: [B([150, 122], [200, 116], [H, 120], [320, 116], [370, 122], [366, 136], [H, 134], [154, 136])], note: { en: 'just rostral', uz: 'sal oldinda' } },
      { id: 'v3', shapes: [B([H - 5, 140], [H - 7, 220], [H - 4, 300], [H, 312], [H + 4, 300], [H + 7, 220], [H + 5, 140])], at: [H, 200], note: { en: 'with optic recess', uz: "ko'rish cho'ntagi bilan" } },
      { id: 'pvn', mirror: true, shapes: [B([252, 162], [234, 170], [232, 214], [252, 218])] },
      { id: 'fx', mirror: true, shapes: [E(208, 178, 9, 10)], note: { en: 'column — medial | lateral zone border', uz: 'ustuni — medial | lateral zona chegarasi' } },
      { id: 'ahn', mirror: true, shapes: [E(226, 248, 15, 15)] },
      { id: 'lha', mirror: true, shapes: [B([196, 196], [168, 212], [160, 268], [180, 292], [200, 276], [204, 230])] },
      { id: 'scn', mirror: true, shapes: [E(246, 300, 8, 9)] },
      { id: 'son', mirror: true, shapes: [B([214, 296], [190, 300], [176, 318], [198, 316], [222, 306])] },
      { id: 'och', at: [196, 336], shapes: [B([150, 318], [200, 316], [H, 320], [320, 316], [370, 318], [372, 344], [H, 350], [148, 344])] },
      { id: 'ic3', mirror: true, at: [118, 210], shapes: [B([140, 120], [118, 150], [104, 220], [112, 290], [130, 300], [136, 230], [150, 160])], note: { en: 'genu / posterior limb', uz: "tizza / orqa oyog'i" } },
      { id: 'gpi', mirror: true, at: [92, 200], shapes: [B([104, 160], [88, 190], [90, 240], [102, 236], [106, 196])] },
    ],
    landmarks: {
      en: 'Optic chiasm forms the floor; the 3rd ventricle dips into its optic recess. Medial zone (between ventricle and fornix column): SCN on the chiasm, PVN high on the ventricular wall, anterior hypothalamic nucleus between. Supraoptic nucleus straddles the lateral edge of the chiasm/optic tract. Lateral to the fornix: lateral hypothalamic area traversed by the medial forebrain bundle.',
      uz: "Ko'rish kesishmasi tubni hosil qiladi; III qorincha uning ko'rish cho'ntagiga tushadi. Medial zona (qorincha bilan gumbaz ustuni orasida): kesishma ustida SCN, qorincha devorining yuqorisida PVN, orasida oldingi gipotalamik yadro. Supraoptik yadro kesishma/ko'rish traktining lateral chetini egarlaydi. Gumbazdan lateralda: medial old miya tutami o'tadigan lateral gipotalamik soha.",
    },
    blood: {
      en: 'Anterior communicating / A1 perforators and superior hypophyseal arteries (preoptic–supraoptic region, chiasm); anteromedial branches of the circle of Willis.',
      uz: "Oldingi biriktiruvchi / A1 perforantlari va yuqori gipofizar arteriyalar (preoptik–supraoptik soha, kesishma); Willis halqasining anteromedial shoxlari.",
    },
    syndromes: [
      { name: { en: 'Central diabetes insipidus', uz: 'Markaziy qandsiz diabet' }, text: { en: 'Damage to SON/PVN or high stalk (craniopharyngioma, surgery, histiocytosis): polyuria of dilute urine, hypernatraemia; responds to desmopressin. Triphasic response after pituitary surgery (DI → SIADH → DI).', uz: "SON/PVN yoki oyoqchaning yuqori qismi zararlanishi (kraniofaringioma, jarrohlik, gistiotsitoz): suyultirilgan siydikli poliuriya, gipernatriyemiya; desmopressinga javob beradi. Gipofiz jarrohligidan keyin uch fazali javob (DI → SIADH → DI)." } },
      { name: { en: 'Chiasmal syndrome', uz: 'Xiazmal sindrom' }, text: { en: 'Pituitary macroadenoma from below → bitemporal superior quadrantanopia progressing to hemianopia; craniopharyngioma from above → inferior quadrants first.', uz: "Pastdan gipofiz makroadenomasi → bitemporal yuqori kvadrant anopsiyasi, keyin gemianopiya; yuqoridan kraniofaringioma → avval pastki kvadrantlar." } },
      { name: { en: 'Disturbed circadian rhythm / hyperthermia', uz: 'Sirkad ritm buzilishi / gipertermiya' }, text: { en: 'SCN and anterior hypothalamic (heat-loss) damage → irregular sleep–wake cycle and central hyperthermia.', uz: "SCN va oldingi gipotalamus (issiqlik chiqarish) zararlanishi → tartibsiz uyqu–uyg'oqlik sikli va markaziy gipertermiya." } },
    ],
    sources: SRC_HY,
  },

  // ── G2 · Hypothalamus, tuberal level ───────────────────────────────
  {
    id: 'hypothalamus-tuberal',
    code: 'G2',
    region: 'hypothalamus',
    title: { en: 'Hypothalamus — tuberal zone (arcuate, VMN, DMN)', uz: 'Gipotalamus — tuberal zona (yoysimon, VMN, DMN)' },
    orientation: CORONAL,
    plane: coronal(-3),
    contour: HYPO_MESH,
    pin: { side: 'front', off: 26, dy: 0 },
    loc: [62, 64, 62, 100],
    w: 520,
    h: 400,
    axes: AXES_COR,
    outline: hypoOutline,
    ground: 'hypo-grey',
    regions: hypoRegions(140),
    items: [
      { id: 'v3', shapes: [B([H - 5, 130], [H - 7, 220], [H - 5, 290], [H, 316], [H + 5, 290], [H + 7, 220], [H + 5, 130])], at: [H, 190], note: { en: 'infundibular recess below', uz: "pastida infundibulyar cho'ntak" } },
      { id: 'mtt', mirror: true, shapes: [E(220, 162, 6, 6)] },
      { id: 'fx', mirror: true, shapes: [E(204, 210, 9, 10)], note: { en: 'column', uz: 'ustuni' } },
      { id: 'dmn', mirror: true, shapes: [E(238, 214, 13, 11)] },
      { id: 'vmn', mirror: true, shapes: [E(232, 258, 17, 15)] },
      { id: 'arc', mirror: true, shapes: [B([252, 284], [236, 290], [236, 310], [252, 318])] },
      { id: 'me', at: [H, 344], shapes: [B([238, 318], [H, 322], [282, 318], [276, 352], [268, 384], [252, 384], [244, 352])] },
      { id: 'lha', mirror: true, shapes: [B([190, 170], [158, 190], [150, 262], [170, 292], [194, 276], [196, 226])] },
      { id: 'ot', mirror: true, shapes: [E(176, 312, 20, 9, -18)] },
      { id: 'ic3', mirror: true, at: [118, 210], shapes: [B([140, 120], [118, 150], [104, 220], [112, 290], [130, 300], [136, 230], [150, 160])], note: { en: 'posterior limb', uz: "orqa oyog'i" } },
    ],
    landmarks: {
      en: 'The tuber cinereum bulges at the base and narrows into the median eminence and pituitary stalk; the 3rd ventricle extends into the infundibular recess. Medial zone: arcuate nucleus hugging the recess, the large ventromedial nucleus, dorsomedial nucleus above it. Fornix columns and the mammillothalamic tracts mark the medial–lateral border; optic tracts lie on the ventrolateral surface.',
      uz: "Tuber cinereum tubda bo'rtadi va median bo'rtma hamda gipofiz oyoqchasiga torayadi; III qorincha infundibulyar cho'ntakka davom etadi. Medial zona: cho'ntakni o'rab turgan yoysimon yadro, yirik ventromedial yadro, uning ustida dorsomedial yadro. Gumbaz ustunlari va mamillotalamik traktlar medial–lateral chegarani belgilaydi; ko'rish traktlari ventrolateral yuzada.",
    },
    blood: {
      en: 'Posterior communicating artery perforators (tuberothalamic) and superior hypophyseal arteries forming the primary portal plexus in the median eminence.',
      uz: "Orqa biriktiruvchi arteriya perforantlari (tuberotalamik) va median bo'rtmada birlamchi portal chigalni hosil qiluvchi yuqori gipofizar arteriyalar.",
    },
    syndromes: [
      { name: { en: 'Hypothalamic obesity', uz: 'Gipotalamik semizlik' }, text: { en: 'VMN/arcuate damage (craniopharyngioma, surgery, radiation): hyperphagia and weight gain resistant to diet; leptin–melanocortin signalling lost.', uz: "VMN/yoysimon yadro zararlanishi (kraniofaringioma, jarrohlik, nurlanish): parhezga chidamli giperfagiya va vazn ortishi; leptin–melanokortin signali yo'qoladi." } },
      { name: { en: 'Stalk effect', uz: "Oyoqcha ta'siri" }, text: { en: 'Any mass compressing the stalk interrupts tuberoinfundibular dopamine → mild hyperprolactinaemia (usually < 100 ng/mL), distinguishing it from prolactinoma.', uz: "Oyoqchani bosuvchi har qanday hosila tuberoinfundibulyar dofaminni to'xtatadi → yengil giperprolaktinemiya (odatda < 100 ng/mL), prolaktinomadan farqlash belgisi." } },
      { name: { en: 'Hypothalamic hamartoma', uz: 'Gipotalamik gamartoma' }, text: { en: 'Tuber cinereum hamartoma: gelastic (laughing) seizures and central precocious puberty; laser ablation / endoscopic disconnection.', uz: "Tuber cinereum gamartomasi: gelastik (kulgili) tutqanoqlar va markaziy erta jinsiy yetilish; lazer ablatsiyasi / endoskopik ajratish." } },
    ],
    sources: SRC_HY,
  },

  // ── G3 · Hypothalamus, mammillary level ────────────────────────────
  {
    id: 'hypothalamus-mammillary',
    code: 'G3',
    region: 'hypothalamus',
    title: { en: 'Hypothalamus — mammillary zone', uz: 'Gipotalamus — mamillyar zona' },
    orientation: CORONAL,
    plane: coronal(-8),
    contour: HYPO_MESH,
    pin: { side: 'front', off: 10, dy: -9 },
    loc: [69, 64, 69, 100],
    w: 520,
    h: 400,
    axes: AXES_COR,
    outline: hypoOutline,
    ground: 'hypo-grey',
    regions: hypoRegions(130),
    items: [
      { id: 'v3', shapes: [B([H - 5, 120], [H - 7, 200], [H - 4, 262], [H, 272], [H + 4, 262], [H + 7, 200], [H + 5, 120])], at: [H, 180], note: { en: 'mammillary recess', uz: "mamillyar cho'ntak" } },
      { id: 'mtt', mirror: true, at: [222, 196], shapes: [L(4, [238, 278], [228, 234], [220, 190], [214, 146])] },
      { id: 'phn', mirror: true, shapes: [B([252, 200], [236, 206], [234, 248], [252, 256])] },
      { id: 'fx', mirror: true, at: [214, 262], shapes: [L(5, [200, 220], [212, 256], [228, 288])], note: { en: 'postcommissural fibres entering the MB', uz: "MB ga kiruvchi postkommissural tolalar" } },
      { id: 'mb', mirror: true, shapes: [B([H - 2, 278], [236, 278], [220, 296], [226, 324], [248, 332], [H - 2, 322])] },
      { id: 'lha', mirror: true, shapes: [B([196, 164], [170, 180], [166, 236], [184, 256], [200, 236], [202, 196])] },
      { id: 'zi', mirror: true, at: [160, 160], shapes: [L(4, [190, 152], [160, 160], [134, 172])] },
      { id: 'stn', mirror: true, shapes: [E(152, 212, 22, 9, -24)] },
      { id: 'crus', mirror: true, at: [146, 274], shapes: [B([196, 258], [168, 246], [134, 236], [116, 246], [124, 286], [158, 312], [196, 318], [210, 292])] },
      { id: 'ot', mirror: true, shapes: [E(130, 304, 14, 8, 36)] },
      { id: 'ic3', mirror: true, at: [100, 196], shapes: [B([122, 112], [100, 140], [90, 196], [96, 236], [112, 232], [116, 180], [130, 132])], note: { en: 'posterior limb', uz: "orqa oyog'i" } },
    ],
    landmarks: {
      en: 'The paired mammillary bodies bulge from the floor behind the tuber cinereum, receiving the postcommissural fornix and emitting the mammillothalamic tract dorsally (to the anterior thalamus). The posterior hypothalamic nucleus lies above them along the ventricle. Laterally the hypothalamus meets the subthalamus (zona incerta, STN) and the cerebral peduncle with the optic tract on its surface.',
      uz: "Juft so'rg'ichsimon tanalar tuber cinereum orqasida tubdan bo'rtib chiqadi; postkommissural gumbazni oladi va dorsal tomonga mamillotalamik traktni (oldingi talamusga) chiqaradi. Ularning ustida qorincha bo'ylab orqa gipotalamik yadro. Lateralda gipotalamus subtalamus (zona incerta, STN) va yuzasida ko'rish trakti bo'lgan miya oyoqchasi bilan chegaralanadi.",
    },
    blood: {
      en: 'Posterior communicating and P1 perforators (mammillary arteries, thalamoperforating branches); posterior hypothalamus also from the basilar tip.',
      uz: "Orqa biriktiruvchi va P1 perforantlari (mamillyar arteriyalar, talamoperforant shoxlar); orqa gipotalamus bazilyar uchidan ham.",
    },
    syndromes: [
      { name: { en: 'Wernicke–Korsakoff', uz: 'Wernicke–Korsakoff' }, text: { en: 'Thiamine deficiency (alcohol, hyperemesis, bariatric surgery): confusion, ophthalmoplegia, ataxia (Wernicke) → anterograde amnesia with confabulation (Korsakoff); MRI: mammillary, medial thalamic and periaqueductal T2/FLAIR signal. Give thiamine BEFORE glucose.', uz: "Tiamin tanqisligi (alkogol, qayt qilish, bariatrik jarrohlik): chalkashlik, oftalmoplegiya, ataksiya (Wernicke) → konfabulyatsiyali anterograd amneziya (Korsakoff); MRT: so'rg'ichsimon tana, medial talamus va periakveduktal T2/FLAIR signal. Tiaminni glyukozadan OLDIN bering." } },
      { name: { en: 'Poikilothermia', uz: 'Poykilotermiya' }, text: { en: 'Posterior hypothalamic (heat-conservation) lesions → body temperature drifts with the environment.', uz: "Orqa gipotalamus (issiqlikni saqlash) zararlanishi → tana harorati muhit haroratiga ergashadi." } },
    ],
    sources: SRC_HY,
  },

  // ── G4 · Hypothalamic zones map (mid-sagittal) ─────────────────────
  {
    id: 'hypothalamus-zones',
    code: 'G4',
    region: 'hypothalamus',
    title: { en: 'Hypothalamus — zones & nuclei map (mid-sagittal)', uz: "Gipotalamus — zonalar va yadrolar xaritasi (o'rta sagittal)" },
    orientation: { en: 'Not a cut: medial wall of the 3rd ventricle, anterior to the left', uz: "Kesim emas: III qorinchaning medial devori, old tomon chapda" },
    contour: HYPO_MESH,
    pin: { side: 'front', off: 44, dy: 0 },
    w: 640,
    h: 400,
    axes: AXES_SAG,
    outline: [B([96, 120], [140, 92], [260, 80], [420, 84], [520, 110], [560, 170], [546, 240], [500, 300], [430, 330], [330, 336], [260, 324], [196, 300], [120, 280], [92, 220])],
    ground: 'hypo-grey',
    regions: [
      { shapes: [D(1.4, [196, 94], [196, 330])] },
      { shapes: [D(1.4, [300, 86], [300, 334])] },
      { shapes: [D(1.4, [420, 86], [420, 330])] },
      { shapes: [], label: { en: 'Preoptic', uz: 'Preoptik' }, at: [146, 72] },
      { shapes: [], label: { en: 'Supraoptic (anterior)', uz: 'Supraoptik (oldingi)' }, at: [248, 72] },
      { shapes: [], label: { en: 'Tuberal', uz: 'Tuberal' }, at: [360, 72] },
      { shapes: [], label: { en: 'Mammillary (posterior)', uz: 'Mamillyar (orqa)' }, at: [494, 72] },
    ],
    items: [
      { id: 'lt', at: [104, 196], shapes: [L(4, [118, 116], [100, 170], [104, 230], [132, 276])] },
      { id: 'ac', shapes: [E(138, 112, 18, 13)] },
      { id: 'mpo', shapes: [E(158, 190, 26, 30)] },
      { id: 'pvn', shapes: [E(258, 140, 30, 18)] },
      { id: 'ahn', shapes: [E(250, 200, 30, 22)] },
      { id: 'scn', shapes: [E(206, 262, 16, 12)] },
      { id: 'son', shapes: [B([224, 252], [266, 246], [290, 262], [262, 276], [228, 272])] },
      { id: 'och', at: [196, 300], shapes: [B([140, 286], [200, 280], [260, 290], [258, 314], [196, 318], [146, 304])] },
      { id: 'dmn', shapes: [E(356, 170, 28, 20)] },
      { id: 'vmn', shapes: [E(360, 226, 30, 24)] },
      { id: 'arc', shapes: [B([316, 268], [372, 262], [400, 280], [360, 296], [320, 290])] },
      { id: 'me', at: [362, 326], shapes: [B([320, 300], [400, 296], [384, 340], [370, 392], [352, 392], [340, 340])] },
      { id: 'lha', at: [300, 118], shapes: [D(3, [228, 112], [300, 110], [400, 116], [470, 136])], note: { en: 'lateral zone, lateral to this plane (shown as dashed)', uz: "lateral zona, bu tekislikdan lateralda (punktir bilan)" } },
      { id: 'fx', at: [440, 168], shapes: [L(6, [196, 110], [300, 108], [420, 140], [470, 220], [480, 268])], note: { en: 'column, arching back to the mammillary body', uz: "ustuni, so'rg'ichsimon tanaga orqaga egiladi" } },
      { id: 'phn', shapes: [E(480, 168, 26, 22)] },
      { id: 'mb', shapes: [E(482, 288, 34, 26)] },
      { id: 'mtt', at: [520, 214], shapes: [L(4, [500, 272], [530, 210], [548, 150])] },
    ],
    landmarks: {
      en: 'Rostro-caudally four zones — preoptic, supraoptic (anterior), tuberal and mammillary (posterior); medio-laterally three — periventricular, medial and lateral (the fornix column is the medial/lateral border). Functional shorthand: anterior = parasympathetic & heat loss, posterior = sympathetic & heat conservation; VMN = satiety, LHA = hunger; SON/PVN = ADH & oxytocin; arcuate = releasing hormones, dopamine.',
      uz: "Old–orqa yo'nalishda to'rt zona — preoptik, supraoptik (oldingi), tuberal va mamillyar (orqa); medial–lateral yo'nalishda uch — periventrikulyar, medial va lateral (gumbaz ustuni medial/lateral chegara). Funksional qisqacha: oldingi = parasimpatik va issiqlik chiqarish, orqa = simpatik va issiqlikni saqlash; VMN = to'qlik, LHA = ochlik; SON/PVN = ADH va oksitotsin; yoysimon = rilizing gormonlar, dofamin.",
    },
    blood: {
      en: 'Anterior: A1/AComm perforators; middle: PComm (tuberothalamic) and superior hypophyseal; posterior: P1 / basilar-tip perforators.',
      uz: "Oldingi: A1/AComm perforantlari; o'rta: PComm (tuberotalamik) va yuqori gipofizar; orqa: P1 / bazilyar uchi perforantlari.",
    },
    syndromes: [
      { name: { en: 'Three functions, one structure', uz: 'Bitta tuzilma, uch vazifa' }, text: { en: 'Endocrine (magnocellular → posterior pituitary; parvocellular → portal system → anterior pituitary), autonomic (PVN → brainstem & spinal preganglionic neurons) and limbic (Papez circuit via fornix → mammillary body → MTT → anterior thalamus).', uz: "Endokrin (magnotsellyulyar → orqa gipofiz; parvotsellyulyar → portal tizim → oldingi gipofiz), vegetativ (PVN → ustun va orqa miya preganglionar neyronlari) va limbik (gumbaz → so'rg'ichsimon tana → MTT → oldingi talamus orqali Papez halqasi)." } },
      { name: { en: 'Feeding circuit', uz: 'Ovqatlanish zanjiri' }, text: { en: 'Leptin/insulin excite arcuate POMC/CART and inhibit NPY/AgRP neurons; ghrelin does the reverse. POMC → α-MSH → MC4R in PVN → satiety; NPY/AgRP → LHA orexin/MCH → hunger. VMN lesion → hyperphagic obesity; LHA lesion → aphagia.', uz: "Leptin/insulin yoysimon POMC/CART neyronlarini qo'zg'atadi va NPY/AgRP ni tormozlaydi; grelin aksincha. POMC → α-MSH → PVN'da MC4R → to'qlik; NPY/AgRP → LHA oreksin/MCH → ochlik. VMN zararlanishi → giperfagik semizlik; LHA zararlanishi → afagiya." } },
    ],
    sources: SRC_HY,
  },
]
