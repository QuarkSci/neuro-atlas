import { B, E, L, sym } from './shapes'
import { brainstemPlane } from './plane'
import type { Section, SectionItem } from './types'

const AXES_BS: Section['axes'] = [
  { en: 'Dorsal (tectum)', uz: 'Dorsal (tektum)' },
  { en: 'Ventral (crura)', uz: 'Ventral (oyoqchalar)' },
  { en: 'Right', uz: "O'ng" },
  { en: 'Left', uz: 'Chap' },
]
const ORIENT = { en: 'Transverse, perpendicular to the neuraxis · dorsal up', uz: "Ko'ndalang, neyraksisga perpendikulyar · dorsal tomon yuqorida" }
const SRC = [
  { title: 'Wikipedia — Midbrain (cross-sections)', url: 'https://en.wikipedia.org/wiki/Midbrain' },
  { title: 'StatPearls — Neuroanatomy, Mesencephalon (Midbrain)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK551509/' },
  { title: 'Ruchalski & Hathout 2012 — A medley of midbrain maladies (Radiol Res Pract, open access)', url: 'https://doi.org/10.1155/2012/258524' },
]
/** Gross meshes that together outline the midbrain at these levels. */
const MIDBRAIN_MESH = /^g-(left|right)-(superior-colliculus|inferior-colliculus|cerebral-crus|substantia-nigra|red-nucleus)$|^g-cerebral-aqueduct$/
const C = 280

/** Midbrain silhouette: tectal mounds, tegmentum, crura splayed around the interpeduncular fossa. */
const OUTLINE = B(...sym([[C, 68], [262, 50], [226, 42], [188, 52], [160, 78], [146, 112], [136, 150], [128, 196], [118, 240], [100, 280], [88, 322], [104, 356], [168, 376], [226, 372], [252, 346], [266, 310], [C, 296]], C))

/** Substantia nigra, VTA and the three-part crus are drawn the same at both levels. */
const VENTRAL: SectionItem[] = [
  { id: 'snc', mirror: true, shapes: [B([248, 278], [214, 270], [176, 276], [146, 292], [174, 290], [214, 284], [246, 288])] },
  { id: 'snr', mirror: true, at: [182, 300], shapes: [B([246, 292], [210, 290], [170, 298], [132, 316], [170, 312], [214, 304], [244, 302])] },
  { id: 'vta', mirror: true, shapes: [E(258, 272, 9, 7)] },
  { id: 'crus-fp', mirror: true, shapes: [B([262, 308], [236, 306], [228, 324], [230, 350], [250, 340])] },
  { id: 'crus-cst', mirror: true, shapes: [B([228, 306], [180, 316], [152, 322], [156, 356], [190, 366], [222, 360], [222, 330])], note: { en: 'face medial → arm → leg lateral', uz: "yuz medialda → qo'l → oyoq lateralda" } },
  { id: 'crus-ptop', mirror: true, shapes: [B([148, 322], [118, 326], [98, 334], [104, 348], [126, 358], [150, 356])] },
]

export const MIDBRAIN: Section[] = [
  // ── O1 · Caudal midbrain, inferior colliculus ──────────────────────
  {
    id: 'midbrain-inferior-colliculus',
    code: 'O1',
    region: 'midbrain',
    title: { en: 'Caudal midbrain — inferior colliculus (CN IV)', uz: "Kaudal o'rta miya — pastki do'nglik (IV nerv)" },
    orientation: ORIENT,
    plane: brainstemPlane(-17),
    contour: MIDBRAIN_MESH,
    pin: { side: 'front', dy: -3 },
    loc: [64, 100, 104, 87],
    w: 560,
    h: 420,
    axes: AXES_BS,
    outline: [OUTLINE],
    ground: 'tegm-mid',
    items: [
      { id: 'ic', mirror: true, shapes: [B([276, 72], [256, 56], [222, 52], [194, 64], [186, 92], [214, 108], [256, 106], [274, 96])] },
      { id: 'bic', mirror: true, shapes: [B([184, 98], [162, 106], [150, 130], [166, 134], [186, 114])] },
      { id: 'pag', shapes: [E(C, 136, 36, 30)], at: [306, 156] },
      { id: 'aq', shapes: [E(C, 130, 7, 10)] },
      { id: 'dr', shapes: [E(C, 158, 6, 7)] },
      { id: 'mes5', mirror: true, at: [246, 124], shapes: [L(3, [254, 112], [248, 128], [250, 144])] },
      { id: 'n4', mirror: true, shapes: [E(262, 172, 8, 6)] },
      { id: 'mlf', mirror: true, shapes: [E(256, 186, 8, 5)] },
      { id: 'll', mirror: true, shapes: [B([168, 138], [150, 154], [142, 180], [156, 178], [172, 154])], note: { en: 'ending in the IC', uz: "pastki do'nglikda tugaydi" } },
      { id: 'rf', mirror: true, at: [222, 180], shapes: [B([236, 168], [212, 170], [204, 192], [230, 192])], note: { en: 'mesencephalic RF (mRt / cuneiform)', uz: "mezensefal RF (mRt / ponasimon)" } },
      { id: 'ppn', mirror: true, shapes: [E(188, 200, 9, 8)] },
      { id: 'ctt', mirror: true, shapes: [E(230, 208, 7, 7)] },
      { id: 'scp-dec', mirror: true, shapes: [L(8, [222, 214], [252, 228], [308, 242], [338, 254])], at: [C, 235] },
      { id: 'als', mirror: true, shapes: [E(164, 216, 10, 7)] },
      { id: 'tl', mirror: true, shapes: [E(196, 228, 9, 5)] },
      { id: 'ml', mirror: true, shapes: [B([226, 246], [190, 246], [160, 254], [148, 268], [176, 266], [216, 258])] },
      { id: 'rst', mirror: true, shapes: [E(214, 238, 5, 5)] },
      { id: 'ipn', shapes: [E(C, 284, 10, 7)] },
      ...VENTRAL,
    ],
    landmarks: {
      en: 'Paired inferior colliculi form the dorsal surface; the trochlear nucleus indents the MLF in the ventral periaqueductal grey and its fibres head dorsally to cross in the velum below. The superior cerebellar peduncles decussate in the midline tegmentum. Lemnisci form a lateral arc (ML → trigeminal → spinal → lateral lemniscus ending in the IC). Ventrally: substantia nigra and the crus cerebri around the interpeduncular fossa.',
      uz: "Juft pastki do'ngliklar dorsal yuzani hosil qiladi; g'altak yadrosi ventral periakveduktal kulrang moddada MLFga botadi, tolalari dorsal yo'nalib pastda pardada kesishadi. Yuqori miyacha oyoqchalari o'rta chiziq tegmentumida kesishadi. Lemniskalar lateral yoy hosil qiladi (ML → trigeminal → spinal → pastki do'nglikda tugovchi lateral lemnisk). Ventralda: qora modda va oyoqchalararo chuqurcha atrofida miya oyoqchasi.",
    },
    blood: {
      en: 'Paramedian: basilar-tip and P1 perforators (thalamoperforating / interpeduncular). Lateral: collicular & quadrigeminal (from PCA/SCA) and superior cerebellar artery; posterior choroidal branches to the tectum.',
      uz: "Paramedian: bazilyar uchi va P1 perforantlari (talamoperforant / oyoqchalararo). Lateral: kollikulyar va to'rt tepalik arteriyalari (PCA/SCA dan) hamda yuqori miyacha arteriyasi; tektumga orqa xorioidal shoxlar.",
    },
    syndromes: [
      { name: { en: 'Wernekink commissure syndrome', uz: 'Wernekink komissura sindromi' }, text: { en: 'Midline caudal-midbrain infarct at the SCP decussation: bilateral cerebellar ataxia, often with delayed palatal tremor and internuclear ophthalmoplegia.', uz: "SCP kesishmasidagi o'rta chiziq kaudal o'rta miya infarkti: ikki tomonlama miyacha ataksiyasi, ko'pincha kechikkan tanglay tremori va internuklear oftalmoplegiya bilan." } },
      { name: { en: 'Trochlear nucleus / fascicle lesion', uz: "G'altak yadrosi / tolalari zararlanishi" }, text: { en: 'Nucleus → CONTRALATERAL superior-oblique palsy (vertical diplopia, head tilt away from the weak eye); with the descending sympathetics → contralateral IV + ipsilateral Horner.', uz: "Yadro → QARAMA-QARSHI yuqori qiyshiq mushak falaji (vertikal diplopiya, bosh zaif ko'zdan teskari tomonga egiladi); tushuvchi simpatik tolalar bilan → qarama-qarshi IV + o'sha tomonda Horner." } },
    ],
    sources: SRC,
  },

  // ── O2 · Rostral midbrain, superior colliculus ─────────────────────
  {
    id: 'midbrain-superior-colliculus',
    code: 'O2',
    region: 'midbrain',
    title: { en: 'Rostral midbrain — superior colliculus & red nucleus (CN III)', uz: "Rostral o'rta miya — yuqori do'nglik va qizil yadro (III nerv)" },
    orientation: ORIENT,
    plane: brainstemPlane(-9),
    contour: MIDBRAIN_MESH,
    pin: { side: 'front', dy: 4 },
    loc: [66, 86, 104, 73],
    w: 560,
    h: 420,
    axes: AXES_BS,
    outline: [OUTLINE],
    ground: 'tegm-mid',
    items: [
      { id: 'sc', mirror: true, shapes: [B([276, 74], [254, 56], [218, 52], [190, 66], [184, 94], [214, 110], [256, 108], [274, 98])], note: { en: 'layered: superficial visual, deep motor', uz: "qatlamli: yuza — ko'rish, chuqur — harakat" } },
      { id: 'bsc', mirror: true, shapes: [B([186, 100], [166, 108], [154, 128], [170, 130], [188, 114])] },
      { id: 'mgb', mirror: true, shapes: [B([156, 128], [136, 144], [128, 178], [144, 188], [160, 164], [166, 142])] },
      { id: 'pag', shapes: [E(C, 136, 36, 30)], at: [306, 158] },
      { id: 'aq', shapes: [E(C, 130, 6, 9)] },
      { id: 'ew', mirror: true, shapes: [E(273, 152, 4, 6)] },
      { id: 'n3', mirror: true, at: [258, 172], shapes: [B([272, 160], [256, 160], [248, 176], [262, 188], [275, 182])] },
      { id: 'mlf', mirror: true, shapes: [E(246, 192, 7, 5)] },
      { id: 'dtd', shapes: [L(4, [252, 202], [C, 210], [308, 202])], at: [C, 208] },
      { id: 'rf', mirror: true, at: [214, 194], shapes: [B([226, 178], [202, 184], [196, 210], [222, 206])], note: { en: 'mesencephalic RF', uz: 'mezensefal RF' } },
      { id: 'ctt', mirror: true, shapes: [E(208, 222, 7, 7)] },
      { id: 'rn', mirror: true, shapes: [E(240, 238, 20, 18)] },
      { id: 'n3-root', mirror: true, at: [253, 262], shapes: [L(2.4, [262, 188], [252, 214], [252, 248], [262, 276], [268, 302])] },
      { id: 'vtd', shapes: [L(4, [248, 262], [C, 270], [312, 262])], at: [C, 270] },
      { id: 'als', mirror: true, shapes: [E(160, 232, 9, 6)] },
      { id: 'tl', mirror: true, shapes: [E(188, 246, 7, 5)] },
      { id: 'ml', mirror: true, shapes: [B([206, 256], [178, 260], [156, 274], [170, 282], [200, 270])] },
      ...VENTRAL,
    ],
    landmarks: {
      en: 'Superior colliculi on the dorsal surface with their brachia and the medial geniculate bodies laterally. The V-shaped oculomotor complex (with the Edinger–Westphal nucleus dorsally) lies in the ventral periaqueductal grey; its fascicles stream ventrally through the red nucleus and the medial substantia nigra into the interpeduncular fossa. Rubrospinal (ventral) and tectospinal (dorsal) tegmental decussations cross the midline.',
      uz: "Dorsal yuzada yuqori do'ngliklar, ularning dastalari va lateral tomonda medial tizzasimon tanalar. V-shaklli ko'zni harakatlantiruvchi kompleks (dorsalda Edinger–Westphal yadrosi) ventral periakveduktal kulrang moddada; uning tolalari qizil yadro va qora moddaning medial qismi orqali oyoqchalararo chuqurchaga oqib tushadi. Rubrospinal (ventral) va tektospinal (dorsal) tegmental kesishmalar o'rta chiziqni kesadi.",
    },
    blood: {
      en: 'Paramedian: P1 / basilar-tip perforators (III nucleus & fascicles, RN, medial SN, crus) — the artery of Percheron when single. Lateral: PCA circumferential branches (lateral tegmentum, MGB); posterior medial choroidal and collicular arteries (tectum).',
      uz: "Paramedian: P1 / bazilyar uchi perforantlari (III yadro va tolalari, RN, medial SN, oyoqcha) — yagona bo'lsa Percheron arteriyasi. Lateral: PCA aylanma shoxlari (lateral tegmentum, MGB); orqa medial xorioidal va kollikulyar arteriyalar (tektum).",
    },
    syndromes: [
      { name: { en: 'Weber (ventral)', uz: 'Weber (ventral)' }, text: { en: 'Crus + III fascicles: ipsilateral oculomotor palsy (down-and-out eye, ptosis, dilated pupil) + contralateral hemiplegia with lower-face and tongue weakness.', uz: "Oyoqcha + III tolalari: o'sha tomonda III falaji (ko'z pastga-tashqariga, ptoz, kengaygan qorachiq) + qarama-qarshi gemiplegiya (yuzning pastki qismi va til zaifligi bilan)." } },
      { name: { en: 'Claude / Benedikt (tegmental)', uz: 'Claude / Benedikt (tegmental)' }, text: { en: 'Red nucleus + SCP fibres + III fascicles: ipsilateral III palsy with contralateral ataxia (Claude) or with contralateral tremor/choreoathetosis and hemiparesis (Benedikt — extends into the crus/SN).', uz: "Qizil yadro + SCP tolalari + III tolalari: o'sha tomonda III falaji va qarama-qarshi ataksiya (Claude) yoki qarama-qarshi tremor/xoreoatetoz va gemiparez (Benedikt — oyoqcha/SN ga tarqaladi)." } },
      { name: { en: 'Parinaud (dorsal midbrain)', uz: "Parinaud (dorsal o'rta miya)" }, text: { en: 'Pineal tumour or hydrocephalus compressing the tectum/posterior commissure: up-gaze palsy, light–near dissociation, convergence–retraction nystagmus, eyelid retraction (Collier sign).', uz: "Tektum/orqa komissurani bosuvchi pineal o'sma yoki gidrotsefaliya: yuqoriga qarash falaji, yorug'lik–yaqin dissotsiatsiyasi, konvergensiya–retraksiya nistagmi, qovoq tortilishi (Collier belgisi)." } },
      { name: { en: 'Uncal herniation', uz: 'Unkal churra' }, text: { en: 'Medial temporal lobe pushes through the tentorial notch: ipsilateral fixed dilated pupil (III), then contralateral or — via Kernohan notch — ipsilateral hemiparesis, then Duret haemorrhages.', uz: "Medial chakka bo'lagi chodir o'yig'iga suqiladi: o'sha tomonda qotgan kengaygan qorachiq (III), keyin qarama-qarshi yoki — Kernohan o'yig'i orqali — o'sha tomonda gemiparez, so'ng Duret qon quyilishlari." } },
    ],
    sources: SRC,
  },
  // ── O3 · Midbrain–diencephalon junction (pretectal level) ───────────
  {
    id: 'midbrain-pretectal',
    code: 'O3',
    region: 'midbrain',
    title: { en: 'Midbrain–diencephalon junction — pretectum & posterior commissure', uz: "O'rta miya–oraliq miya chegarasi — pretektum va orqa komissura" },
    orientation: ORIENT,
    plane: brainstemPlane(-2),
    contour: /^g-(left|right)-(thalamus|red-nucleus|substantia-nigra|cerebral-crus|lateral-geniculate-body|medial-geniculate-body)$|^g-(pineal-body|posterior-commissure)$/,
    pin: { side: 'front', dy: 10, off: 4 },
    loc: [70, 76, 104, 64],
    w: 560,
    h: 420,
    axes: AXES_BS,
    outline: [B(...sym([[C, 70], [250, 58], [200, 58], [150, 74], [112, 108], [96, 160], [100, 212], [108, 256], [96, 300], [104, 342], [160, 372], [224, 370], [252, 346], [266, 312], [C, 300]], C))],
    ground: 'tegm-mid',
    items: [
      { id: 'pin', shapes: [E(C, 52, 16, 11)] },
      { id: 'hab', mirror: true, shapes: [E(254, 70, 8, 6)] },
      { id: 'pc', shapes: [L(6, [228, 88], [C, 82], [332, 88])], at: [306, 84] },
      { id: 'pretect', mirror: true, shapes: [B([238, 94], [208, 92], [190, 106], [206, 120], [236, 114])] },
      { id: 'th-pul', mirror: true, shapes: [B([190, 70], [150, 80], [118, 112], [126, 150], [160, 140], [190, 108])] },
      { id: 'mgb', mirror: true, shapes: [B([152, 156], [134, 172], [134, 198], [152, 194], [160, 172])] },
      { id: 'lgn', mirror: true, shapes: [B([126, 172], [106, 192], [110, 226], [130, 216], [138, 192])] },
      { id: 'pag', shapes: [E(C, 130, 32, 26)], at: [306, 150] },
      { id: 'aq', shapes: [E(C, 122, 7, 10)], note: { en: 'opening into the 3rd ventricle', uz: 'III qorinchaga ochiladi' } },
      { id: 'inc', mirror: true, shapes: [E(258, 152, 6, 5)] },
      { id: 'rimlf', mirror: true, shapes: [E(250, 168, 7, 5)] },
      { id: 'mlf', mirror: true, shapes: [E(244, 184, 6, 5)] },
      { id: 'ctt', mirror: true, shapes: [E(206, 204, 7, 7)] },
      { id: 'rn', mirror: true, shapes: [E(240, 224, 22, 18)], note: { en: 'rostral part', uz: 'rostral qismi' } },
      { id: 'als', mirror: true, shapes: [E(158, 226, 9, 6)] },
      { id: 'ml', mirror: true, shapes: [B([204, 252], [176, 254], [152, 268], [166, 276], [198, 264])] },
      ...VENTRAL,
    ],
    landmarks: {
      en: 'The aqueduct widens into the 3rd ventricle under the posterior commissure, with the pineal gland and habenulae above it. Pretectal nuclei flank the commissure (pupillary light reflex); riMLF and the interstitial nucleus of Cajal — the vertical-gaze centres — sit in the rostral periaqueductal region. Laterally the pulvinar and both geniculate bodies already belong to the thalamus; ventrally the red nuclei, substantia nigra and crura continue.',
      uz: "Suv yo'li orqa komissura ostida III qorinchaga kengayadi, uning ustida epifiz va habenulalar. Pretektal yadrolar komissura yonida (qorachiqning yorug'lik refleksi); riMLF va Cajal interstitsial yadrosi — vertikal qarash markazlari — rostral periakveduktal sohada. Lateralda pulvinar va ikkala tizzasimon tana allaqachon talamusga tegishli; ventralda qizil yadrolar, qora modda va oyoqchalar davom etadi.",
    },
    blood: {
      en: 'Posterior choroidal arteries (pineal region, pulvinar, LGN), P1 thalamoperforating / artery of Percheron (riMLF, INC, rostral midbrain tegmentum), quadrigeminal artery (pretectum, superior colliculus).',
      uz: "Orqa xorioidal arteriyalar (pineal soha, pulvinar, LGN), P1 talamoperforant / Percheron arteriyasi (riMLF, INC, rostral o'rta miya tegmentumi), to'rt tepalik arteriyasi (pretektum, yuqori do'nglik).",
    },
    syndromes: [
      { name: { en: 'Dorsal midbrain (Parinaud) syndrome', uz: "Dorsal o'rta miya (Parinaud) sindromi" }, text: { en: 'Pineal tumour or aqueductal hydrocephalus compressing the posterior commissure and pretectum: up-gaze palsy, light–near dissociation, convergence–retraction nystagmus, eyelid retraction (Collier), skew deviation.', uz: "Orqa komissura va pretektumni bosuvchi pineal o'sma yoki suv yo'li gidrotsefaliyasi: yuqoriga qarash falaji, yorug'lik–yaqin dissotsiatsiyasi, konvergensiya–retraksiya nistagmi, qovoq tortilishi (Collier), qiyshiq og'ish." } },
      { name: { en: 'Top-of-the-basilar syndrome', uz: 'Bazilyar arteriya uchi sindromi' }, text: { en: 'Embolus at the basilar tip: bilateral thalamic and rostral midbrain infarcts — vertical gaze palsy (riMLF/INC), pupillary abnormalities, somnolence/coma, memory loss, often with occipital (PCA) hemianopia or cortical blindness.', uz: "Bazilyar uchidagi embol: ikki tomonlama talamus va rostral o'rta miya infarktlari — vertikal qarash falaji (riMLF/INC), qorachiq o'zgarishlari, uyquchanlik/koma, xotira buzilishi, ko'pincha ensa (PCA) gemianopiyasi yoki po'stloq ko'rligi bilan." } },
      { name: { en: 'Progressive supranuclear palsy', uz: 'Progressiv supranuklear falaj' }, text: { en: 'Tauopathy with early riMLF/INC involvement: slow, then absent vertical (down-first) saccades, axial rigidity, early falls; midbrain atrophy ("hummingbird sign").', uz: "riMLF/INC erta zararlanadigan taupatiya: vertikal (avval pastga) sakkadalarning sekinlashishi, keyin yo'qolishi, aksial rigidlik, erta yiqilishlar; o'rta miya atrofiyasi ('kolibri belgisi')." } },
    ],
    sources: SRC,
  },
]
