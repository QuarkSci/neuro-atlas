import { B, E, L, sym } from './shapes'
import type { Section } from './types'

const C = 320

/**
 * Horizontal section through the deep cerebellar nuclei, perpendicular to
 * the neuraxis like the brainstem levels, so it shows the caudal pons in
 * front and both hemispheres behind. Displayed posterior-up (cerebellum on
 * top, pons below) to match the brainstem figures' dorsal-up convention.
 */
export const CEREBELLUM: Section[] = [
  {
    id: 'cerebellum-deep-nuclei',
    code: 'Mc',
    region: 'cerebellum',
    title: { en: 'Cerebellum — deep nuclei level (with caudal pons)', uz: "Miyacha — chuqur yadrolar darajasi (kaudal ko'prik bilan)" },
    orientation: { en: 'Horizontal, perpendicular to the neuraxis · posterior (dorsal) up', uz: "Gorizontal, neyraksisga perpendikulyar · orqa (dorsal) tomon yuqorida" },
    // Through the dentate centroid of this atlas (MNI y −60, z −34), tilted with the brainstem axis.
    plane: { point: [0, -60, -34], normal: [0, 0.3095, 0.9509] },
    contour: /^g-(left|right)-(cerebellum|pons)$/,
    pin: { side: 'back' },
    loc: [48, 146, 178, 104],
    w: 640,
    h: 460,
    axes: [
      { en: 'Posterior (dorsal)', uz: 'Orqa (dorsal)' },
      { en: 'Anterior (pons)', uz: "Old (ko'prik)" },
      { en: 'Right', uz: "O'ng" },
      { en: 'Left', uz: 'Chap' },
    ],
    outline: [
      B(...sym([[C, 48], [300, 30], [230, 24], [150, 42], [86, 88], [54, 160], [62, 232], [98, 292], [150, 322], [210, 332], [256, 318], [286, 300], [C, 296]], C)),
      B(...sym([[C, 314], [262, 318], [214, 336], [196, 376], [214, 414], [264, 436], [C, 440]], C)),
    ],
    ground: ['cb-wm', 'basis-pontis'],
    regions: [{ shapes: [B(...sym([[C, 336], [266, 340], [224, 356], [214, 388], [232, 418], [276, 432], [C, 436]], C))] }],
    items: [
      { id: 'vermis', at: [C, 96], shapes: [B(...sym([[C, 34], [300, 40], [290, 90], [292, 160], [300, 226], [C, 244]], C))] },
      { id: 'hemi', mirror: true, at: [118, 150], shapes: [B([282, 36], [230, 28], [150, 46], [90, 92], [60, 160], [68, 230], [104, 290], [152, 318], [204, 326], [246, 312], [222, 286], [152, 258], [118, 200], [128, 124], [196, 82], [270, 62])] },
      { id: 'nod', shapes: [E(C, 252, 16, 10)] },
      { id: 'dent', mirror: true, at: [214, 226], shapes: [L(4.5, [256, 204], [244, 192], [232, 201], [220, 190], [206, 200], [194, 214], [200, 228], [192, 242], [204, 256], [218, 248], [230, 260], [244, 252], [256, 262])] },
      { id: 'embol', mirror: true, shapes: [E(264, 232, 6, 13)] },
      { id: 'glob', mirror: true, shapes: [E(283, 228, 5, 8)] },
      { id: 'fast', mirror: true, shapes: [E(298, 248, 6, 5)] },
      { id: 'scp', mirror: true, shapes: [B([272, 262], [262, 282], [274, 302], [290, 296], [288, 268])] },
      { id: 'v4', shapes: [B(...sym([[C, 262], [302, 270], [292, 292], [304, 314], [C, 320]], C))] },
      { id: 'mcp', mirror: true, shapes: [B([212, 328], [178, 322], [152, 342], [176, 372], [208, 370], [222, 348])] },
      { id: 'basis-cst', mirror: true, at: [284, 380], shapes: [E(290, 376, 10, 7), E(262, 398, 11, 7), E(290, 414, 9, 6)] },
      { id: 'tpf', shapes: [L(2.4, [220, 372], [270, 390], [C, 392], [370, 390], [420, 372]), L(2.4, [232, 406], [276, 418], [C, 420], [364, 418], [408, 406])], at: [372, 404] },
    ],
    landmarks: {
      en: 'The crumpled dentate nucleus sits in each hemisphere\'s white matter with its hilum facing medially-forward into the superior cerebellar peduncle; medially in turn lie the emboliform, globose and — in the roof of the 4th ventricle — fastigial nuclei ("Don\'t Eat Greasy Food", lateral → medial). Vermis in the midline with the nodulus overhanging the ventricle; the pons lies in front.',
      uz: "Burmalangan tishsimon yadro har bir yarim shar oq moddasida, hilumi medial-old tomonga — yuqori miyacha oyoqchasiga qaragan; undan medialda ketma-ket tiqinsimon, sharsimon va — IV qorincha tomida — chodirsimon yadrolar (inglizcha eslatma: 'Don't Eat Greasy Food', lateraldan medialga). O'rta chiziqda chuvalchang, nodulus qorincha ustiga osilgan; oldinda ko'prik.",
    },
    blood: {
      en: 'Superior cerebellar artery (superior surface, dentate nucleus and SCP), AICA (anterior-inferior surface, flocculus, MCP), PICA (inferior vermis, tonsils, inferior hemisphere).',
      uz: "Yuqori miyacha arteriyasi (yuqori yuza, tishsimon yadro va SCP), AICA (old-pastki yuza, flokkulus, MCP), PICA (pastki chuvalchang, bodomchalar, pastki yarim shar).",
    },
    syndromes: [
      { name: { en: 'Hemispheric syndrome', uz: 'Yarim shar sindromi' }, text: { en: 'Ipsilateral limb ataxia, dysmetria, intention tremor, dysdiadochokinesia, hypotonia, scanning dysarthria — the cerebellum controls the SAME side (double crossing).', uz: "O'sha tomonda oyoq-qo'l ataksiyasi, dismetriya, intension tremor, disdiadoxokineziya, gipotoniya, skandirlangan nutq — miyacha O'SHA tomonni boshqaradi (ikki marta kesishish)." } },
      { name: { en: 'Midline (vermian) syndrome', uz: "O'rta chiziq (chuvalchang) sindromi" }, text: { en: 'Truncal ataxia, wide-based gait, titubation, nystagmus — alcohol (anterior superior vermis), medulloblastoma (nodulus/roof of 4th ventricle).', uz: "Gavda ataksiyasi, keng qadamli yurish, titubatsiya, nistagm — alkogol (old-yuqori chuvalchang), medulloblastoma (nodulus/IV qorincha tomi)." } },
      { name: { en: 'Cerebellar haemorrhage / infarct with swelling', uz: "Shish bilan kechuvchi miyacha qon quyilishi / infarkti" }, text: { en: 'Neurosurgical emergency: compression of the 4th ventricle (hydrocephalus) and brainstem; suboccipital decompression when >3 cm, deteriorating or with hydrocephalus.', uz: "Neyroxirurgik shoshilinch holat: IV qorincha (gidrotsefaliya) va miya ustuni bosilishi; >3 sm, holat yomonlashsa yoki gidrotsefaliya bo'lsa — suboksipital dekompressiya." } },
      { name: { en: 'Cerebellar mutism syndrome', uz: 'Miyacha mutizmi sindromi' }, text: { en: 'After midline posterior-fossa tumour resection in children (dentato-rubro-thalamic pathway injury): delayed-onset mutism, emotional lability, hypotonia.', uz: "Bolalarda orqa chuqurcha o'rta chiziq o'smasi olib tashlangandan keyin (dentato-rubro-talamik yo'l jarohati): kechikib boshlanadigan mutizm, hissiy beqarorlik, gipotoniya." } },
    ],
    sources: [
      { title: 'Wikipedia — Cerebellum (deep nuclei)', url: 'https://en.wikipedia.org/wiki/Cerebellum' },
      { title: 'StatPearls — Neuroanatomy, Cerebellum', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538167/' },
      { title: 'Diedrichsen et al. 2011 — Imaging the deep cerebellar nuclei (NeuroImage)', url: 'https://doi.org/10.1016/j.neuroimage.2010.10.035' },
    ],
  },
]
