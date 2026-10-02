import { B, E, L, sym } from './shapes'
import { brainstemPlane } from './plane'
import type { Section, Shape } from './types'

const AXES_BS: Section['axes'] = [
  { en: 'Dorsal', uz: 'Dorsal (orqa)' },
  { en: 'Ventral', uz: 'Ventral (old)' },
  { en: 'Right', uz: "O'ng" },
  { en: 'Left', uz: 'Chap' },
]
const ORIENT = { en: 'Transverse, perpendicular to the neuraxis · dorsal up', uz: "Ko'ndalang, neyraksisga perpendikulyar · dorsal tomon yuqorida" }
const SRC = [
  { title: 'Wikipedia — Pons (cross-sections)', url: 'https://en.wikipedia.org/wiki/Pons' },
  { title: 'StatPearls — Neuroanatomy, Pons', url: 'https://www.ncbi.nlm.nih.gov/books/NBK560589/' },
  { title: 'StatPearls — Neuroanatomy, Brainstem', url: 'https://www.ncbi.nlm.nih.gov/books/NBK544297/' },
]
const PONS_MESH = /^g-(left|right)-pons$/
const C = 280

/** The basilar pons: same silhouette at every level, scaled by `top` (tegmentum–basis border). */
const basis = (top: number): Shape => B(...sym([[C, top], [230, top + 2], [180, top + 8], [130, top + 22], [96, top + 50], [96, top + 100], [130, top + 142], [190, top + 170], [240, top + 178], [C, top + 180]], C))
/** Corticospinal/corticobulbar bundles scattered through the basis. */
const cstBundles = (top: number): Shape[] => [E(248, top + 58, 14, 10), E(214, top + 88, 16, 11), E(250, top + 118, 14, 10), E(196, top + 50, 12, 9), E(182, top + 112, 14, 10), E(222, top + 146, 12, 8)]
const pontineNuclei = (top: number): Shape[] => [E(270, top + 88, 6, 5), E(232, top + 30, 6, 5), E(214, top + 64, 6, 4), E(244, top + 154, 6, 5), E(170, top + 80, 6, 5), E(200, top + 132, 6, 5), E(150, top + 60, 5, 4)]
const transverse = (top: number): Shape[] => [L(2.6, [104, top + 40], [180, top + 72], [C, top + 76], [380, top + 72], [456, top + 40]), L(2.6, [104, top + 98], [190, top + 102], [C, top + 104], [370, top + 102], [456, top + 98]), L(2.6, [130, top + 140], [200, top + 136], [C, top + 140], [360, top + 136], [430, top + 140])]

export const PONS: Section[] = [
  // ── K1 · Caudal pons, facial colliculus ─────────────────────────────
  {
    id: 'pons-facial-colliculus',
    code: 'K1',
    region: 'pons',
    title: { en: 'Caudal pons — facial colliculus (CN VI, VII)', uz: "Kaudal ko'prik — yuz do'ngligi (VI, VII nervlar)" },
    orientation: ORIENT,
    plane: brainstemPlane(-39),
    contour: PONS_MESH,
    pin: { side: 'front' },
    loc: [52, 146, 104, 129],
    w: 560,
    h: 420,
    axes: AXES_BS,
    outline: [B(...sym([[C, 124], [258, 110], [236, 114], [206, 104], [176, 92], [146, 88], [110, 108], [84, 150], [74, 204], [80, 262], [102, 318], [146, 362], [206, 392], [254, 402], [C, 404]], C)), L(2.2, [C, 404], [C, 384])],
    regions: [{ shapes: [basis(222)], label: { en: 'Basis pontis', uz: "Ko'prik asosi" } }],
    items: [
      { id: 'v4', shapes: [B(...sym([[C, 40], [220, 44], [160, 62], [186, 86], [214, 100], [248, 104], [C, 120]], C))] },
      { id: 'n6', mirror: true, shapes: [E(252, 124, 11, 10)] },
      { id: 'n7-genu', mirror: true, at: [266, 104], shapes: [L(4.5, [190, 196], [214, 160], [236, 126], [254, 106], [270, 116], [262, 138], [236, 146])] },
      { id: 'n7', mirror: true, shapes: [E(188, 200, 12, 10)] },
      { id: 'n7-root', mirror: true, at: [118, 236], shapes: [L(4.5, [236, 146], [196, 178], [150, 212], [104, 244], [62, 262])] },
      { id: 'ssn', mirror: true, shapes: [E(216, 158, 6, 6)] },
      { id: 'mlf', mirror: true, at: [272, 150], shapes: [E(268, 140, 5, 7)] },
      { id: 'pprf', mirror: true, shapes: [B([266, 154], [252, 158], [250, 196], [266, 200])] },
      { id: 'n6-root', mirror: true, at: [238, 300], shapes: [L(2.6, [246, 134], [240, 200], [236, 290], [232, 398])] },
      { id: 'vn', mirror: true, shapes: [B([226, 108], [196, 98], [168, 92], [158, 108], [186, 126], [220, 124])], note: { en: 'medial & lateral (Deiters)', uz: 'medial va lateral (Deiters)' } },
      { id: 'sp5t', mirror: true, shapes: [B([138, 130], [126, 160], [130, 190], [144, 170], [148, 140])] },
      { id: 'sp5n', mirror: true, shapes: [B([154, 134], [148, 166], [158, 190], [172, 166], [168, 140])] },
      { id: 'mcp', mirror: true, at: [100, 178], shapes: [B([146, 90], [110, 108], [84, 150], [76, 204], [86, 240], [112, 232], [124, 186], [130, 130])] },
      { id: 'ctt', mirror: true, shapes: [E(230, 180, 8, 8)] },
      { id: 'so', mirror: true, shapes: [E(164, 210, 10, 7)] },
      { id: 'ml', mirror: true, shapes: [B([276, 204], [224, 202], [190, 210], [194, 222], [240, 222], [276, 220])] },
      { id: 'tb', shapes: [L(4, [152, 214], [204, 216], [C, 212], [356, 216], [408, 214])], at: [306, 214] },
      { id: 'als', mirror: true, shapes: [E(150, 226, 11, 7)] },
      { id: 'raphe', shapes: [L(5, [C, 132], [C, 202])], at: [C, 176] },
      { id: 'basis-cst', mirror: true, shapes: cstBundles(222), at: [214, 310] },
      { id: 'pn', mirror: true, shapes: pontineNuclei(222), at: [170, 302] },
      { id: 'tpf', shapes: transverse(222), at: [370, 294] },
    ],
    landmarks: {
      en: 'The facial colliculus bulges into the 4th-ventricle floor: abducens nucleus underneath, wrapped by the internal genu of VII. Facial motor nucleus and superior olive sit in the ventrolateral tegmentum; the trapezoid body crosses through the now horizontal medial lemnisci. The large basis pontis (corticospinal bundles, pontine nuclei, transverse fibres) is joined laterally by the middle cerebellar peduncle.',
      uz: "Yuz do'ngligi IV qorincha tubiga bo'rtib turadi: ostida uzoqlashtiruvchi yadro, uni VII nervning ichki tizzasi o'rab oladi. Yuz harakat yadrosi va yuqori zaytun ventrolateral tegmentumda; trapetsiyasimon tana endi yotiq holatdagi medial lemniskalar orqali kesishadi. Katta ko'prik asosi (kortikospinal tutamlar, ko'prik yadrolari, ko'ndalang tolalar) lateral tomonda o'rta miyacha oyoqchasiga qo'shiladi.",
    },
    blood: {
      en: 'Basilar artery: paramedian perforators (basis, ML, MLF, PPRF, VI), short circumferential (lateral basis, VII nucleus, SO), long circumferential AICA (lateral tegmentum, MCP, vestibular & cochlear territory, VII–VIII roots).',
      uz: "Bazilyar arteriya: paramedian perforantlar (asos, ML, MLF, PPRF, VI), qisqa aylanma shoxlar (lateral asos, VII yadrosi, SO), uzun aylanma AICA (lateral tegmentum, MCP, vestibulyar va eshitish hududi, VII–VIII ildizlari).",
    },
    syndromes: [
      { name: { en: 'Foville (dorsal caudal pons)', uz: "Foville (dorsal kaudal ko'prik)" }, text: { en: 'Ipsilateral horizontal gaze palsy (VI nucleus/PPRF) + ipsilateral LMN facial palsy (genu) ± contralateral hemiparesis.', uz: "O'sha tomonga gorizontal qarash falaji (VI yadro/PPRF) + o'sha tomonda periferik yuz falaji (tizza) ± qarama-qarshi gemiparez." } },
      { name: { en: 'Millard–Gubler (ventral caudal pons)', uz: "Millard–Gubler (ventral kaudal ko'prik)" }, text: { en: 'VII ± VI fascicles + corticospinal tract: ipsilateral facial palsy (and abduction weakness) with contralateral hemiplegia.', uz: "VII ± VI tolalari + kortikospinal trakt: o'sha tomonda yuz falaji (va abduksiya zaifligi) va qarama-qarshi gemiplegiya." } },
      { name: { en: 'One-and-a-half syndrome', uz: "'Bir yarim' sindromi" }, text: { en: 'Abducens nucleus/PPRF + ipsilateral MLF: no horizontal movement of the ipsilateral eye; the contralateral eye can only abduct (with nystagmus).', uz: "Uzoqlashtiruvchi yadro/PPRF + o'sha tomon MLF: o'sha tomon ko'zi gorizontal harakatlanmaydi; qarama-qarshi ko'z faqat tashqariga boradi (nistagm bilan)." } },
    ],
    sources: SRC,
  },

  // ── K2 · Mid pons, trigeminal nuclei ───────────────────────────────
  {
    id: 'pons-trigeminal',
    code: 'K2',
    region: 'pons',
    title: { en: 'Mid pons — trigeminal motor & principal sensory nuclei', uz: "O'rta ko'prik — uch shoxli nerv harakat va asosiy sezuvchi yadrolari" },
    orientation: ORIENT,
    plane: brainstemPlane(-30),
    contour: PONS_MESH,
    pin: { side: 'front', off: 16, dy: -2 },
    loc: [50, 128, 104, 110],
    w: 560,
    h: 420,
    axes: AXES_BS,
    outline: [B(...sym([[C, 110], [250, 104], [222, 96], [196, 82], [170, 70], [140, 72], [106, 96], [80, 140], [70, 196], [76, 256], [98, 314], [144, 360], [206, 392], [254, 402], [C, 404]], C)), L(2.2, [C, 404], [C, 384])],
    regions: [{ shapes: [basis(214)], label: { en: 'Basis pontis', uz: "Ko'prik asosi" } }],
    items: [
      { id: 'v4', shapes: [B(...sym([[C, 42], [236, 46], [196, 60], [214, 84], [244, 98], [C, 108]], C))], note: { en: 'narrowing rostrally', uz: 'rostral tomonga torayib boradi' } },
      { id: 'scp', mirror: true, shapes: [B([198, 62], [174, 66], [168, 92], [190, 104], [210, 90])] },
      { id: 'mes5', mirror: true, at: [208, 112], shapes: [L(3, [214, 86], [214, 102], [204, 116])] },
      { id: 'mlf', mirror: true, at: [270, 126], shapes: [E(266, 118, 5, 7)] },
      { id: 'pr5', mirror: true, shapes: [B([168, 118], [148, 128], [144, 152], [160, 164], [176, 146])] },
      { id: 'mo5', mirror: true, shapes: [E(198, 146, 11, 12)] },
      { id: 'n5-root', mirror: true, at: [92, 210], shapes: [L(7, [168, 156], [140, 178], [112, 202], [80, 222], [40, 236])] },
      { id: 'mcp', mirror: true, at: [96, 150], shapes: [B([140, 72], [106, 96], [80, 140], [72, 196], [80, 236], [104, 228], [118, 176], [128, 110])] },
      { id: 'll', mirror: true, shapes: [B([150, 172], [132, 186], [128, 204], [144, 204], [158, 186])] },
      { id: 'rf', mirror: true, at: [246, 146], shapes: [B([246, 128], [222, 140], [220, 184], [248, 188], [260, 156])], note: { en: 'pontine RF, caudal & oral parts', uz: 'pontin RF, kaudal va oral qismlar' } },
      { id: 'ctt', mirror: true, shapes: [E(226, 168, 8, 8)] },
      { id: 'tl', mirror: true, shapes: [E(214, 194, 8, 5)] },
      { id: 'ml', mirror: true, shapes: [B([272, 196], [230, 194], [192, 200], [196, 212], [236, 212], [272, 212])] },
      { id: 'als', mirror: true, shapes: [E(168, 206, 11, 7)] },
      { id: 'raphe', shapes: [L(5, [C, 116], [C, 196])], at: [C, 160] },
      { id: 'basis-cst', mirror: true, shapes: cstBundles(214), at: [214, 302] },
      { id: 'pn', mirror: true, shapes: pontineNuclei(214), at: [170, 294] },
      { id: 'tpf', shapes: transverse(214), at: [370, 286] },
    ],
    landmarks: {
      en: 'The trigeminal nerve leaves through the middle cerebellar peduncle; just medial to its entry lie the principal sensory nucleus (lateral) and the motor nucleus (medial) of V. The 4th ventricle narrows and the superior cerebellar peduncles form its dorsolateral walls, with the mesencephalic tract of V at their medial edge. The basis is at its largest.',
      uz: "Uch shoxli nerv o'rta miyacha oyoqchasi orqali chiqadi; uning kirish joyidan sal medialda V nervning asosiy sezuvchi yadrosi (lateral) va harakat yadrosi (medial) yotadi. IV qorincha torayadi, uning dorsolateral devorlarini yuqori miyacha oyoqchalari hosil qiladi, ularning medial chetida V nervning mezensefal trakti. Asos eng katta holatda.",
    },
    blood: {
      en: 'Basilar paramedian and short circumferential branches; the superior cerebellar artery (and AICA) loop around the lateral pons — the SCA often contacts the trigeminal root entry zone.',
      uz: "Bazilyar paramedian va qisqa aylanma shoxlar; yuqori miyacha arteriyasi (va AICA) ko'prik yon tomonini aylanadi — SCA ko'pincha uch shoxli nerv ildiz kirish zonasiga tegib turadi.",
    },
    syndromes: [
      { name: { en: 'Locked-in syndrome', uz: "'Qulflangan odam' sindromi" }, text: { en: 'Bilateral ventral pontine infarct (basilar thrombosis) or central pontine myelinolysis: quadriplegia and anarthria with preserved consciousness, vertical eye movements and blinking (dorsal tegmentum and midbrain spared).', uz: "Ikki tomonlama ventral ko'prik infarkti (bazilyar tromboz) yoki markaziy pontin miyelinoliz: hush saqlangan holda tetraplegiya va anartriya; vertikal ko'z harakatlari va ko'z qisish saqlanadi (dorsal tegmentum va o'rta miya zararlanmagan)." } },
      { name: { en: 'Trigeminal neuralgia', uz: 'Trigeminal nevralgiya' }, text: { en: 'Neurovascular compression of the root entry zone (usually SCA) or an MS plaque at this level: paroxysmal electric facial pain; microvascular decompression.', uz: "Ildiz kirish zonasining tomir bilan bosilishi (ko'pincha SCA) yoki shu darajadagi RS pilakchasi: yuzda xurujsimon 'elektr' og'riq; mikrovaskulyar dekompressiya." } },
      { name: { en: 'Ataxic hemiparesis / dysarthria–clumsy hand', uz: "Ataktik gemiparez / dizartriya–noqulay qo'l" }, text: { en: 'Lacunar infarct of the basis (corticospinal + pontocerebellar fibres): weakness and ataxia on the same, contralateral side.', uz: "Asosning lakunar infarkti (kortikospinal + ponto-tserebellyar tolalar): qarama-qarshi tomonda zaiflik va ataksiya birgalikda." } },
    ],
    sources: SRC,
  },

  // ── K3 · Rostral pons (isthmus) ────────────────────────────────────
  {
    id: 'pons-isthmus',
    code: 'K3',
    region: 'pons',
    title: { en: 'Rostral pons (isthmus) — locus coeruleus & SCP', uz: "Rostral ko'prik (bo'yin) — ko'k dog' va yuqori miyacha oyoqchasi" },
    orientation: ORIENT,
    plane: brainstemPlane(-22),
    contour: PONS_MESH,
    pin: { side: 'front', dy: 4 },
    loc: [54, 112, 104, 94],
    w: 560,
    h: 420,
    axes: AXES_BS,
    outline: [B(...sym([[C, 62], [248, 60], [214, 66], [186, 76], [158, 90], [128, 114], [104, 150], [96, 200], [100, 254], [118, 310], [158, 356], [212, 386], [256, 396], [C, 398]], C)), L(2.2, [C, 398], [C, 380])],
    regions: [{ shapes: [B(...sym([[C, 222], [234, 224], [190, 230], [146, 246], [116, 272], [118, 318], [154, 356], [210, 384], [252, 392], [C, 394]], C))], label: { en: 'Basis pontis', uz: "Ko'prik asosi" } }],
    items: [
      { id: 'smv', shapes: [B(...sym([[C, 62], [248, 60], [226, 66], [232, 74], [254, 70], [C, 72]], C))], at: [C, 66] },
      { id: 'n4-dec', shapes: [L(3, [226, 70], [C, 66], [334, 70])], at: [306, 66] },
      { id: 'pag', shapes: [E(C, 104, 46, 34)], at: [306, 128] },
      { id: 'v4', shapes: [E(C, 96, 22, 16)], note: { en: 'upper end, opening into the aqueduct', uz: "yuqori uchi, suv yo'liga ochiladi" } },
      { id: 'dr', shapes: [E(C, 128, 6, 8)] },
      { id: 'lc', mirror: true, shapes: [E(236, 104, 6, 10)] },
      { id: 'mes5', mirror: true, at: [222, 92], shapes: [L(3, [228, 82], [222, 96], [222, 112])] },
      { id: 'scp', mirror: true, shapes: [B([212, 80], [186, 90], [170, 120], [184, 146], [210, 134], [222, 108])] },
      { id: 'pbc', mirror: true, shapes: [B([186, 84], [162, 96], [150, 124], [164, 120], [176, 98])] },
      { id: 'll', mirror: true, shapes: [B([150, 130], [126, 150], [112, 186], [128, 188], [148, 158])] },
      { id: 'mlf', mirror: true, at: [272, 156], shapes: [E(264, 148, 6, 7)] },
      { id: 'ppn', mirror: true, shapes: [E(178, 166, 9, 8)] },
      { id: 'rf', mirror: true, shapes: [B([248, 160], [224, 170], [216, 200], [246, 206], [262, 182])], note: { en: 'oral pontine RF (PnO)', uz: 'oral pontin RF (PnO)' } },
      { id: 'ctt', mirror: true, shapes: [E(214, 176, 8, 8)] },
      { id: 'mnr', shapes: [E(C, 196, 6, 9)] },
      { id: 'tl', mirror: true, shapes: [E(196, 204, 9, 5)] },
      { id: 'ml', mirror: true, shapes: [B([252, 214], [214, 210], [176, 212], [148, 222], [158, 232], [204, 226], [252, 228])] },
      { id: 'als', mirror: true, shapes: [E(142, 206, 10, 7)] },
      { id: 'basis-cst', mirror: true, shapes: [E(248, 272, 14, 10), E(214, 300, 16, 11), E(250, 330, 14, 10), E(196, 262, 12, 9), E(186, 330, 14, 10), E(222, 358, 12, 8)], at: [214, 300] },
      { id: 'pn', mirror: true, shapes: [E(270, 300, 6, 5), E(232, 248, 6, 5), E(214, 278, 6, 4), E(244, 362, 6, 5), E(170, 296, 6, 5), E(200, 346, 6, 5)], at: [170, 296] },
      { id: 'tpf', shapes: [L(2.6, [126, 280], [200, 292], [C, 296], [360, 292], [434, 280]), L(2.6, [134, 334], [200, 330], [C, 334], [360, 330], [426, 334])], at: [370, 292] },
    ],
    landmarks: {
      en: 'Isthmus: the 4th ventricle is narrowing into the aqueduct under a thin superior medullary velum where the trochlear nerves cross. The superior cerebellar peduncles sweep ventromedially toward their decussation; the pigmented locus coeruleus lies at the lateral edge of the ventricular floor next to the mesencephalic tract of V; parabrachial nuclei wrap the peduncle and the lateral lemniscus is near the surface.',
      uz: "Bo'yin (isthmus): IV qorincha yupqa yuqori miya pardasi ostida suv yo'liga torayadi, pardada g'altak nervlari kesishadi. Yuqori miyacha oyoqchalari kesishmasi tomon ventromedial buriladi; pigmentli ko'k dog' qorincha tubining yon chetida, V nervning mezensefal trakti yonida; parabraxial yadrolar oyoqchani o'raydi, lateral lemnisk yuzaga yaqin.",
    },
    blood: {
      en: 'Basilar paramedian branches; superior cerebellar artery (dorsolateral tegmentum, SCP, LC, lateral lemniscus).',
      uz: "Bazilyar paramedian shoxlari; yuqori miyacha arteriyasi (dorsolateral tegmentum, SCP, LC, lateral lemnisk).",
    },
    syndromes: [
      { name: { en: 'Superior cerebellar artery syndrome', uz: 'Yuqori miyacha arteriyasi sindromi' }, text: { en: 'Ipsilateral limb ataxia and intention tremor (SCP, dentate), ipsilateral Horner, contralateral loss of pain/temperature (ALS) and hearing reduction (lateral lemniscus), sometimes contralateral IV palsy.', uz: "O'sha tomonda oyoq-qo'l ataksiyasi va intension tremor (SCP, tishsimon yadro), o'sha tomonda Horner, qarama-qarshi tomonda og'riq/harorat yo'qolishi (ALS) va eshitish pasayishi (lateral lemnisk), ba'zan qarama-qarshi IV falaji." } },
    ],
    sources: SRC,
  },
]
