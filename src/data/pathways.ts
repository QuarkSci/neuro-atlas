import type { L10n } from './types'
import type { Mni } from './lessons/types'

/**
 * The three long tracts every student must be able to trace from end to end:
 * corticospinal (motor), dorsal column – medial lemniscus (fine touch,
 * vibration, position) and the anterolateral (spinothalamic) system (pain,
 * temperature). Each is written as an ordered list of stations, and each
 * station names the schematic items that draw it on the cross-section plates,
 * the side of the midline its fibres are on at that level, and the lesion
 * zones (data/lesions) it belongs to.
 *
 * Convention: every pathway is traced for ONE body half — the RIGHT side of
 * the body, i.e. the LEFT hemisphere. So the motor tract starts in the left
 * precentral gyrus and ends in the right spinal cord; both sensory tracts
 * start on the right of the body and end in the left postcentral gyrus. A
 * lesion on the station's side hits this copy (right-body signs); a lesion on
 * the other side hits the mirror copy (left-body signs). That single rule is
 * what the lesion simulator computes.
 *
 * 3D points are MNI mm. Where an atlas mesh exists they are its cut centroid
 * at the plate's plane (JHU ICBM-DTI-81 corticospinal tract / medial
 * lemniscus / cerebral peduncle / internal capsule, Allen–AAN pyramid,
 * Julich VPL, 4p, 3b); the ALS, the dorsal-column nuclei and the spinal
 * segment have no mesh and are placed relative to those (lateral to the
 * lemniscus, dorsal to the pyramid), with the cord continued along the
 * brainstem axis. They show the course, not a tractography result.
 */

/** Where a lesion can sit, top to bottom. */
export type LesionLevel = 'cortex' | 'capsule' | 'thalamus' | 'midbrain' | 'pons' | 'medulla-rostral' | 'medulla-caudal' | 'cord'
/** Patient side: L / R. */
export type BodySide = 'L' | 'R'

export interface PathStation {
  id: string
  name: L10n
  /** Short form for the 3D label. */
  label: L10n
  text: L10n
  memo?: L10n
  deep?: L10n
  /** 1st, 2nd or 3rd neuron of the chain at this station. */
  neuron: 1 | 2 | 3
  level: LesionLevel
  /** Side of the midline the traced fibres occupy here (for a crossing: the side they come from). */
  side: BodySide
  /** The fibres cross the midline at this station. */
  cross?: boolean
  /** Lesion zones at this level (data/lesions) that contain the station. */
  zones: string[]
  /** Further levels the same fibres pass through (thalamocortical axons in the capsule…), same side. */
  also?: { level: LesionLevel; zones: string[] }[]
  /** Schematic item ids that draw this station on the plates. */
  items: string[]
  /** The plate a lesson step opens for this station. */
  plate?: string
  /** 3D structures shown for this station (concept + hemisphere). */
  show: { concept: string; side?: 'left' | 'right' }[]
  /** Label anchor, MNI mm. */
  at: Mni
  /** Camera direction for this station's lesson step. */
  view: Mni
}

export interface Pathway {
  id: string
  short: L10n
  title: L10n
  blurb: L10n
  color: string
  /** What the pathway carries — what is lost when it is cut. */
  modality: L10n
  /** Ascending (receptor → cortex) or descending (cortex → cord). */
  dir: 'up' | 'down'
  /** Where the fibres cross the midline, in one line. */
  crossing: L10n
  /** The course for the 3D flow, MNI mm, in the direction of conduction. */
  path: Mni[]
  stations: PathStation[]
  sources: { title: string; url: string }[]
}

const L = 'left' as const
const R = 'right' as const
const FROM_LEFT: Mni = [-1, 0.25, 0.15]
const FROM_FRONT_LEFT: Mni = [-0.7, 0.7, 0.1]
const FROM_BEHIND_LEFT: Mni = [-0.6, -0.8, 0.1]

const SRC = {
  cst: { title: 'StatPearls — Neuroanatomy, Corticospinal Cord Tract', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535423/' },
  dc: { title: 'StatPearls — Neuroanatomy, Posterior Column (Dorsal Column)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK507888/' },
  ml: { title: 'StatPearls — Neuroanatomy, Medial Lemniscus', url: 'https://www.ncbi.nlm.nih.gov/books/NBK526040/' },
  stt: { title: 'StatPearls — Neuroanatomy, Spinothalamic Tract', url: 'https://www.ncbi.nlm.nih.gov/books/NBK507824/' },
  ic: { title: 'StatPearls — Neuroanatomy, Internal Capsule', url: 'https://www.ncbi.nlm.nih.gov/books/NBK542181/' },
  thal: { title: 'StatPearls — Neuroanatomy, Thalamus', url: 'https://www.ncbi.nlm.nih.gov/books/NBK542184/' },
  bs: { title: 'StatPearls — Brown-Séquard Syndrome', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538135/' },
  knob: { title: 'Yousry et al. 1997, Brain — Localization of the motor hand area to a knob on the precentral gyrus', url: 'https://doi.org/10.1093/brain/120.1.141' },
  jhu: { title: 'Mori et al. 2008, NeuroImage — Stereotaxic white matter atlas based on DTI in an ICBM template', url: 'https://doi.org/10.1016/j.neuroimage.2007.12.035' },
}

// ── Corticospinal tract ─────────────────────────────────────────────────

const CST: Pathway = {
  id: 'path-cst',
  short: { en: 'Corticospinal', uz: 'Kortikospinal' },
  title: { en: 'Corticospinal tract — the voluntary motor pathway', uz: "Kortikospinal yo'l — ixtiyoriy harakat yo'li" },
  blurb: {
    en: 'Two neurons from the precentral gyrus to the muscle: capsule, crus, basis pontis, pyramid, decussation, lateral column, anterior horn.',
    uz: "Oldingi markaziy pushtadan mushakkacha ikki neyron: kapsula, oyoqcha, ko'prik asosi, piramida, kesishma, lateral tizimcha, oldingi shox.",
  },
  color: '#ff5a5a',
  modality: { en: 'Voluntary movement (upper motor neuron)', uz: 'Ixtiyoriy harakat (yuqori motoneyron)' },
  dir: 'down',
  crossing: { en: 'Crosses at the pyramidal decussation (caudal medulla, U1).', uz: 'Piramidalar kesishmasida kesishadi (uzunchoq miyaning pastki qismi, U1).' },
  path: [
    [-37, -20, 56],
    [-30, -16, 44],
    [-23, -12, 30],
    [-20, -14, 7],
    [-13.5, -17, -10],
    [-11, -19.6, -14.5],
    [-8.9, -23, -19.7],
    [-8.2, -22.7, -23.5],
    [-6.2, -24, -31.9],
    [-4.4, -27.1, -40.8],
    [-3.8, -31.3, -48.3],
    [-3.1, -33.3, -56.5],
    [-2.8, -38.9, -66.9],
    [-1.5, -41, -73],
    [1.5, -44.5, -75.5],
    [4.5, -47.5, -79],
    [4.5, -51, -92],
  ],
  stations: [
    {
      id: 'm1',
      label: { en: 'M1 (area 4)', uz: 'M1 (4-maydon)' },
      name: { en: 'Primary motor cortex (precentral gyrus)', uz: "Birlamchi harakat po'stlog'i (oldingi markaziy pushta)" },
      text: {
        en: 'The first neuron (upper motor neuron) sits in layer V of the precentral gyrus — area 4. Only about 3–5 % of the axons come from giant Betz cells; the rest from smaller pyramidal cells of areas 4 and 6 and of the parietal lobe (3, 1, 2, 5). The body is mapped upside down: leg on the medial surface, then trunk, arm, hand and face down the lateral convexity.',
        uz: "Birinchi neyron (yuqori motoneyron) oldingi markaziy pushtaning (4-maydon) V qavatida yotadi. Aksonlarning faqat 3–5 % gigant Bets hujayralaridan; qolgani 4 va 6-maydonlar hamda tepa bo'lagi (3, 1, 2, 5) ning kichikroq piramidal hujayralaridan chiqadi. Tana teskari joylashgan: oyoq medial yuzada, keyin tana, qo'l, kaft va yuz lateral qavariq yuzada pastga qarab.",
      },
      memo: { en: 'The homunculus hangs upside down, feet over the edge into the midline.', uz: "Gomunkulus boshi pastga osilgan, oyoqlari o'rta chiziq tomon ichkariga tushgan." },
      deep: {
        en: 'The hand area is a knob on the precentral gyrus, an inverted omega in axial MRI, at about the level of the superior frontal sulcus — a reliable landmark for presurgical mapping (Yousry 1997). Leg cortex is fed by the anterior cerebral artery, arm and face by the middle cerebral artery: an ACA stroke weakens the contralateral leg, an MCA stroke the face and arm.',
        uz: "Qo'l sohasi oldingi markaziy pushtadagi bo'rtiq — aksial MRTda teskari omega shaklida, yuqori peshona egati darajasida; operatsiyadan oldingi xaritalashda ishonchli mo'ljal (Yousry 1997). Oyoq po'stlog'ini oldingi miya arteriyasi, qo'l va yuzni o'rta miya arteriyasi ta'minlaydi: ACA insultida qarama-qarshi oyoq, MCA insultida yuz va qo'l zaiflashadi.",
      },
      neuron: 1,
      level: 'cortex',
      side: 'L',
      zones: ['all', 'motor'],
      items: [],
      show: [
        { concept: 'j-area-4p', side: L },
        { concept: 'j-area-4a', side: L },
      ],
      at: [-37, -20, 56],
      view: [-1, 0.1, 0.5],
    },
    {
      id: 'capsule',
      label: { en: 'Internal capsule', uz: 'Ichki kapsula' },
      name: { en: 'Corona radiata and internal capsule', uz: 'Nursimon toj va ichki kapsula' },
      text: {
        en: 'The axons converge through the corona radiata into the posterior limb of the internal capsule, between the thalamus medially and the lentiform nucleus laterally. Corticobulbar fibres for the face lie at the genu, then arm, trunk and leg fibres towards the back of the posterior limb.',
        uz: "Aksonlar nursimon toj orqali yig'ilib ichki kapsulaning orqa oyog'iga kiradi — medialda talamus, lateralda yasmiqsimon yadro orasida. Yuz uchun kortikobulbar tolalar tizzada, keyin qo'l, tana va oyoq tolalari orqa oyoqning orqasiga qarab joylashadi.",
      },
      memo: {
        en: 'A whole hemisphere of motor fibres squeezed into a strip a few millimetres wide — a tiny lesion here paralyses a whole half of the body.',
        uz: "Butun yarim sharning harakat tolalari bir necha millimetrlik tasmaga siqilgan — bu yerdagi kichik o'choq tananing butun yarmini falaj qiladi.",
      },
      deep: {
        en: 'Lacunar infarcts of the lenticulostriate or anterior choroidal arteries in the posterior limb give "pure motor hemiparesis" of face, arm and leg equally — the commonest lacunar syndrome. Diffusion tractography of the CST through the posterior limb is routine before glioma surgery near the capsule.',
        uz: "Orqa oyoqdagi lentikulostriar yoki oldingi xoroid arteriya lakunar infarkti yuz, qo'l va oyoqni teng darajada falaj qiladi — 'sof harakat gemiparezi', eng ko'p uchraydigan lakunar sindrom. Kapsula yaqinidagi glioma operatsiyasidan oldin CST ning diffuziya traktografiyasi odatiy amaliyot.",
      },
      neuron: 1,
      level: 'capsule',
      side: 'L',
      zones: ['all', 'motor'],
      items: ['cst-ic', 'ic-pl'],
      plate: 'bg-capsule-axial',
      show: [
        { concept: 'wm-superior-corona-radiata', side: L },
        { concept: 'wm-internal-capsule-posterior-limb', side: L },
      ],
      at: [-20, -14, 7],
      view: FROM_LEFT,
    },
    {
      id: 'crus',
      label: { en: 'Crus cerebri', uz: 'Miya oyoqchasi' },
      name: { en: 'Crus cerebri (midbrain)', uz: "Miya oyoqchasi (o'rta miya)" },
      text: {
        en: 'In the midbrain the fibres occupy the middle three-fifths of the crus cerebri, ventral to the substantia nigra: face fibres medial, then arm, leg lateral. Frontopontine fibres run medial to them and parieto-temporo-pontine fibres lateral.',
        uz: "O'rta miyada tolalar miya oyoqchasining o'rtadagi beshdan uch qismini egallaydi, qora moddadan ventralda: yuz tolalari medialda, keyin qo'l, oyoq lateralda. Ulardan medialda peshona-ko'prik, lateralda tepa-chakka-ko'prik tolalari o'tadi.",
      },
      deep: {
        en: 'Weber syndrome (paramedian PCA/P1 branches): crus + oculomotor fascicles → ipsilateral III palsy with contralateral hemiparesis. Wallerian degeneration of the CST after a capsular stroke is visible on MRI as T2 hyperintensity and shrinkage of the crus months later.',
        uz: "Weber sindromi (PCA/P1 paramedian shoxlari): oyoqcha + III nerv tolalari → o'sha tomonda III falaji va qarama-qarshi gemiparez. Kapsula insultidan bir necha oy keyin CST ning Waller degeneratsiyasi MRTda oyoqchaning T2 giperintensivligi va kichrayishi bo'lib ko'rinadi.",
      },
      neuron: 1,
      level: 'midbrain',
      side: 'L',
      zones: ['all', 'ventral'],
      items: ['crus-cst'],
      plate: 'midbrain-superior-colliculus',
      show: [{ concept: 'wm-cerebral-peduncle', side: L }],
      at: [-11, -19.6, -14.5],
      view: FROM_FRONT_LEFT,
    },
    {
      id: 'pons',
      label: { en: 'Basis pontis', uz: "Ko'prik asosi" },
      name: { en: 'Basis pontis', uz: "Ko'prik asosi" },
      text: {
        en: 'In the pons the compact bundle is broken into many small fascicles by the pontine nuclei and the transverse pontocerebellar fibres. Corticobulbar fibres peel off at each level to the cranial nerve motor nuclei (mostly bilaterally).',
        uz: "Ko'prikda zich tutam ko'prik yadrolari va ko'ndalang ko'prik-miyacha tolalari orasida ko'plab mayda tutamlarga bo'linadi. Kortikobulbar tolalar har darajada kalla nervlarining harakat yadrolariga ajralib chiqadi (asosan ikki tomonlama).",
      },
      deep: {
        en: 'Bilateral basis pontis infarction (basilar artery occlusion) gives the locked-in syndrome: quadriplegia and anarthria with preserved consciousness and vertical eye movements, because the tegmentum above is spared.',
        uz: "Ikki tomonlama ko'prik asosi infarkti (bazilyar arteriya okklyuziyasi) 'qamalib qolish' sindromini beradi: hush va vertikal ko'z harakatlari saqlangan holda tetraplegiya va anartriya — chunki ustidagi tegmentum zararlanmagan.",
      },
      neuron: 1,
      level: 'pons',
      side: 'L',
      zones: ['all', 'medial'],
      items: ['basis-cst'],
      plate: 'pons-trigeminal',
      show: [{ concept: 'wm-corticospinal-tract', side: L }],
      at: [-6.2, -24, -31.9],
      view: FROM_FRONT_LEFT,
    },
    {
      id: 'pyramid',
      label: { en: 'Pyramid', uz: 'Piramida' },
      name: { en: 'Pyramid (medulla)', uz: 'Piramida (uzunchoq miya)' },
      text: {
        en: 'The fascicles regroup into the pyramid on the ventral medulla, either side of the anterior median fissure, still on the side they started from. About one million axons pass through each pyramid.',
        uz: "Tutamlar uzunchoq miyaning ventral yuzasida, old o'rta yoriqning ikki yonida yana piramidaga yig'iladi — hali boshlangan tomonida. Har bir piramidadan ~1 million akson o'tadi.",
      },
      deep: {
        en: 'Medial medullary (Dejerine) syndrome — anterior spinal / vertebral paramedian branches: pyramid + medial lemniscus + XII → contralateral hemiparesis sparing the face, contralateral loss of position and vibration, ipsilateral tongue deviation. A pure pyramidal lesion (rare, experimental in primates) gives weakness of fine finger movement with less spasticity than capsular lesions.',
        uz: "Medial medullyar (Dejerine) sindromi — oldingi spinal / vertebral paramedian shoxlar: piramida + medial lemnisk + XII → yuz saqlangan qarama-qarshi gemiparez, qarama-qarshi tomonda holat va tebranish sezgisi yo'qolishi, til o'sha tomonga og'adi. Faqat piramida zararlanishi (kam uchraydi, primatlarda tajribada) kapsula o'chog'idan ko'ra kamroq spastiklik bilan barmoqlarning nozik harakati zaifligini beradi.",
      },
      neuron: 1,
      level: 'medulla-rostral',
      side: 'L',
      zones: ['all', 'medial'],
      items: ['pyramid'],
      plate: 'medulla-olive',
      show: [{ concept: 'bs-pyramid-of-medulla-oblongata', side: L }],
      at: [-3.1, -33.3, -56.5],
      view: FROM_FRONT_LEFT,
    },
    {
      id: 'decussation',
      label: { en: 'Pyramidal decussation', uz: 'Piramidalar kesishmasi' },
      name: { en: 'Pyramidal decussation', uz: 'Piramidalar kesishmasi' },
      text: {
        en: 'At the medulla–cord junction 85–90 % of the fibres cross the midline, sweeping dorsolaterally into the opposite lateral funiculus. The remaining 10–15 % stay on the same side as the anterior corticospinal tract and cross segmentally lower down. From here on, the left hemisphere drives the right half of the body.',
        uz: "Uzunchoq miya – orqa miya chegarasida tolalarning 85–90 % o'rta chiziqni kesib, qarama-qarshi lateral tizimchaga dorsolateral tomon o'tadi. Qolgan 10–15 % o'sha tomonda old kortikospinal trakt bo'lib qoladi va pastroqda segmentar kesishadi. Shu yerdan boshlab chap yarim shar tananing o'ng yarmini boshqaradi.",
      },
      memo: {
        en: 'Above the decussation a lesion paralyses the opposite side; below it, the same side.',
        uz: "Kesishmadan yuqorida o'choq qarama-qarshi tomonni, pastda — o'sha tomonni falaj qiladi.",
      },
      deep: {
        en: 'Arm fibres cross rostral to leg fibres, so a small lesion exactly at the decussation can weaken one arm and the opposite leg ("cruciate hemiplegia"). This is also why foramen magnum tumours can start with weakness of one arm, then the other.',
        uz: "Qo'l tolalari oyoq tolalaridan yuqoriroqda kesishadi, shuning uchun aynan kesishmadagi kichik o'choq bir qo'l va qarama-qarshi oyoqni zaiflashtirishi mumkin ('krestsimon gemiplegiya'). Katta teshik o'smalari avval bir qo'l, keyin ikkinchisining zaifligi bilan boshlanishi ham shundan.",
      },
      neuron: 1,
      level: 'medulla-caudal',
      side: 'L',
      cross: true,
      zones: ['all', 'medial'],
      items: ['pyr-dec', 'pyramid'],
      plate: 'medulla-pyramidal-decussation',
      show: [
        { concept: 'bs-pyramid-of-medulla-oblongata', side: L },
        { concept: 'bs-pyramid-of-medulla-oblongata', side: R },
      ],
      at: [1.5, -44.5, -75.5],
      view: [-0.3, 1, -0.2],
    },
    {
      id: 'lcst',
      label: { en: 'Lateral CST → anterior horn', uz: 'Lateral CST → oldingi shox' },
      name: { en: 'Lateral corticospinal tract → anterior horn', uz: 'Lateral kortikospinal trakt → oldingi shox' },
      text: {
        en: 'Now on the right, the tract descends in the lateral funiculus of the spinal cord and ends, mostly via interneurons, on the second neuron — the lower motor neuron in the anterior horn — whose axon leaves in the ventral root to the muscle.',
        uz: "Endi o'ng tomonda trakt orqa miyaning lateral tizimchasida pastga tushadi va asosan oraliq neyronlar orqali ikkinchi neyronda — oldingi shoxdagi pastki motoneyronda tugaydi; uning aksoni old ildiz orqali mushakka boradi.",
      },
      memo: {
        en: 'Upper motor neuron lesion: spastic, brisk reflexes, Babinski, little wasting. Lower motor neuron lesion: flaccid, absent reflexes, wasting, fasciculations.',
        uz: "Yuqori motoneyron zararlanishi: spastik, reflekslar oshgan, Babinski, atrofiya kam. Pastki motoneyron: sust (flaksid), reflekslar yo'q, atrofiya, fassikulyatsiyalar.",
      },
      deep: {
        en: 'In the lateral funiculus the tract is laminated with cervical fibres medial and sacral lateral. Direct cortico-motoneuronal synapses (without interneurons) exist mainly for distal hand muscles in primates — the substrate of independent finger movement, lost early in ALS and after capsular strokes.',
        uz: "Lateral tizimchada trakt qatlamlangan: bo'yin tolalari medialda, dumg'aza tolalari lateralda. To'g'ridan-to'g'ri kortiko-motoneyron sinapslari (oraliq neyronsiz) primatlarda asosan qo'lning distal mushaklari uchun bor — barmoqlarning mustaqil harakati asosi; ALS va kapsula insultida birinchi yo'qoladi.",
      },
      neuron: 2,
      level: 'cord',
      side: 'R',
      zones: ['all', 'ventral'],
      items: ['lcst'],
      plate: 'medulla-pyramidal-decussation',
      show: [{ concept: 'bs-pyramid-of-medulla-oblongata', side: L }],
      at: [4.5, -51, -92],
      view: FROM_BEHIND_LEFT,
    },
  ],
  sources: [SRC.cst, SRC.ic, SRC.knob, SRC.jhu, SRC.bs],
}

// ── Dorsal column – medial lemniscus ────────────────────────────────────

const DCML: Pathway = {
  id: 'path-dcml',
  short: { en: 'Dorsal column', uz: 'Orqa ustun' },
  title: { en: 'Dorsal column – medial lemniscus', uz: 'Orqa ustun – medial lemnisk' },
  blurb: {
    en: 'Fine touch, vibration and position sense: up the same side of the cord, cross in the medulla, relay in VPL.',
    uz: "Nozik teginish, tebranish va holat sezgisi: orqa miyada o'sha tomonda ko'tariladi, uzunchoq miyada kesishadi, VPL da almashadi.",
  },
  color: '#4f8bff',
  modality: { en: 'Fine touch, vibration, joint position', uz: "Nozik teginish, tebranish, bo'g'im holati" },
  dir: 'up',
  crossing: {
    en: 'Crosses as the internal arcuate fibres (sensory decussation, caudal medulla, U2).',
    uz: "Ichki yoysimon tolalar bo'lib kesishadi (sezgi kesishmasi, uzunchoq miya pasti, U2).",
  },
  path: [
    [2, -54, -95],
    [2, -51, -84],
    [2, -48.5, -73.5],
    [2, -46, -66.5],
    [0, -43, -65.5],
    [-1.5, -40.5, -64.5],
    [-2, -36.5, -56],
    [-2.5, -35, -48],
    [-4.5, -37.5, -37.5],
    [-5.1, -35.8, -28.1],
    [-8, -32, -21.5],
    [-10, -26, -18],
    [-12, -22.5, -12.5],
    [-14, -21, -6],
    [-19.9, -25.5, 3.9],
    [-23, -25, 16],
    [-30, -25, 34],
    [-40, -25, 50],
  ],
  stations: [
    {
      id: 'dc-cord',
      label: { en: 'Dorsal columns', uz: 'Orqa ustunlar' },
      name: { en: 'Dorsal root ganglion → dorsal columns', uz: 'Orqa ildiz tuguni → orqa ustunlar' },
      text: {
        en: 'The first neuron is a pseudo-unipolar cell in the dorsal root ganglion with large myelinated (Aβ) fibres. Its central branch enters the cord and ascends WITHOUT crossing in the dorsal column of the same side: fasciculus gracilis (leg and lower trunk, below T6, medial) and fasciculus cuneatus (arm, above T6, lateral).',
        uz: "Birinchi neyron — orqa ildiz tugunidagi psevdounipolyar hujayra, yo'g'on miyelinli (Aβ) tolali. Uning markaziy shoxi orqa miyaga kirib, o'sha tomondagi orqa ustunda KESISHMASDAN ko'tariladi: nozik tutam (oyoq va tananing pastki qismi, T6 dan pastda, medialda) va ponasimon tutam (qo'l, T6 dan yuqorida, lateralda).",
      },
      memo: {
        en: 'Gracilis = graceful legs (medial); cuneatus = arms (lateral, added from above T6).',
        uz: "Gracilis — 'nozik' oyoqlar (medialda); cuneatus — qo'llar (lateralda, T6 dan yuqorida qo'shiladi).",
      },
      deep: {
        en: 'Selective dorsal column disease — tabes dorsalis, B12 deficiency (subacute combined degeneration, with the lateral columns), copper deficiency, nitrous-oxide abuse — produces sensory ataxia with a positive Romberg test: the patient is steady with eyes open, falls with eyes closed.',
        uz: "Orqa ustunlarning tanlab zararlanishi — tabes dorsalis, B12 tanqisligi (subakut qo'shma degeneratsiya, lateral ustunlar bilan birga), mis tanqisligi, azot oksidi suiiste'moli — Romberg sinovi musbat sezgi ataksiyasini beradi: ko'z ochiq turganda barqaror, yumilganda yiqiladi.",
      },
      neuron: 1,
      level: 'cord',
      side: 'R',
      zones: ['all', 'dorsal'],
      items: ['fg', 'fc'],
      plate: 'medulla-pyramidal-decussation',
      show: [{ concept: 'bs-tegmentum-of-medulla-oblongata', side: R }],
      at: [2, -54, -95],
      view: FROM_BEHIND_LEFT,
    },
    {
      id: 'dc-nuclei',
      label: { en: 'Gracile & cuneate nuclei', uz: 'Nozik va ponasimon yadrolar' },
      name: { en: 'Nucleus gracilis and nucleus cuneatus', uz: 'Nozik va ponasimon yadrolar' },
      text: {
        en: 'In the caudal medulla the fibres end on the second neuron in the nucleus gracilis and nucleus cuneatus, under the gracile and cuneate tubercles of the dorsal surface. Up to here everything is still on the same side as the body.',
        uz: "Uzunchoq miyaning pastki qismida tolalar dorsal yuzadagi nozik va ponasimon do'mboqchalar ostida joylashgan nozik va ponasimon yadrolardagi ikkinchi neyronda tugaydi. Shu yergacha hamma narsa hali tananing o'sha tomonida.",
      },
      neuron: 2,
      level: 'medulla-caudal',
      side: 'R',
      zones: ['all', 'dorsal'],
      items: ['fg', 'fc', 'ng', 'nc'],
      plate: 'medulla-sensory-decussation',
      show: [{ concept: 'bs-tegmentum-of-medulla-oblongata', side: R }],
      at: [2, -46, -66.5],
      view: FROM_BEHIND_LEFT,
    },
    {
      id: 'dc-decussation',
      label: { en: 'Sensory decussation', uz: 'Sezgi kesishmasi' },
      name: { en: 'Internal arcuate fibres — sensory decussation', uz: 'Ichki yoysimon tolalar — sezgi kesishmasi' },
      text: {
        en: 'Axons of the second neuron curve ventromedially as the internal arcuate fibres, cross the midline just above the pyramidal decussation and turn upward as the medial lemniscus on the opposite side, dorsal to the pyramid.',
        uz: "Ikkinchi neyron aksonlari ichki yoysimon tolalar bo'lib ventromedial tomonga egiladi, piramidalar kesishmasidan sal yuqorida o'rta chiziqni kesadi va qarama-qarshi tomonda piramidadan dorsalda medial lemnisk bo'lib yuqoriga buriladi.",
      },
      memo: {
        en: 'Two crossings, one above the other in the caudal medulla: motor (pyramidal) below, sensory (lemniscal) just above.',
        uz: 'Uzunchoq miya pastida ikki kesishma bir-birining ustida: pastda harakat (piramida), sal yuqorida sezgi (lemnisk).',
      },
      neuron: 2,
      level: 'medulla-caudal',
      side: 'R',
      cross: true,
      zones: ['all', 'medial'],
      items: ['ia'],
      plate: 'medulla-sensory-decussation',
      show: [
        { concept: 'bs-pyramid-of-medulla-oblongata', side: L },
        { concept: 'bs-pyramid-of-medulla-oblongata', side: R },
      ],
      at: [0, -43, -65.5],
      view: [-0.3, 1, -0.2],
    },
    {
      id: 'ml-medulla',
      label: { en: 'ML · medulla', uz: 'ML · uzunchoq miya' },
      name: { en: 'Medial lemniscus in the medulla', uz: 'Uzunchoq miyada medial lemnisk' },
      text: {
        en: 'In the rostral medulla the lemniscus is a vertical ribbon beside the midline, between the pyramid and the MLF, with the leg ventral and the neck dorsal — a man standing upright on the pyramid.',
        uz: "Uzunchoq miyaning yuqori qismida lemnisk o'rta chiziq yonidagi vertikal tasma — piramida bilan MLF orasida; oyoq ventralda, bo'yin dorsalda: piramida ustida tik turgan odam.",
      },
      deep: {
        en: 'Because the lemniscus and the pyramid share the paramedian territory, Dejerine syndrome removes both; the spinothalamic fibres, lateral in Wallenberg territory, are spared — the two medullary syndromes are mirror images of each other.',
        uz: "Lemnisk va piramida paramedian hududni bo'lishgani uchun Dejerine sindromi ikkalasini ham olib tashlaydi; Wallenberg hududida lateralda yotgan spinotalamik tolalar saqlanadi — ikki medullyar sindrom bir-birining ko'zgudagi aksi.",
      },
      neuron: 2,
      level: 'medulla-rostral',
      side: 'L',
      zones: ['all', 'medial'],
      items: ['ml'],
      plate: 'medulla-olive',
      show: [
        { concept: 'bs-inferior-olive', side: L },
        { concept: 'bs-pyramid-of-medulla-oblongata', side: L },
      ],
      at: [-2, -36.5, -56],
      view: FROM_FRONT_LEFT,
    },
    {
      id: 'ml-pons',
      label: { en: 'ML · pons', uz: "ML · ko'prik" },
      name: { en: 'Medial lemniscus in the pons and midbrain', uz: "Ko'prik va o'rta miyada medial lemnisk" },
      text: {
        en: 'In the pons the ribbon lies flat at the junction of tegmentum and basis (leg lateral); in the midbrain it drifts dorsolaterally, lateral to the red nucleus, alongside the spinothalamic fibres.',
        uz: "Ko'prikda tasma tegmentum va asos chegarasida yotiq holatda yotadi (oyoq lateralda); o'rta miyada qizil yadrodan lateralda, spinotalamik tolalar bilan yonma-yon dorsolateral tomonga suriladi.",
      },
      neuron: 2,
      level: 'pons',
      side: 'L',
      zones: ['all', 'medial'],
      items: ['ml'],
      plate: 'pons-trigeminal',
      show: [{ concept: 'wm-medial-lemniscus', side: L }],
      at: [-5.1, -35.8, -28.1],
      view: FROM_LEFT,
    },
    {
      id: 'ml-midbrain',
      label: { en: 'ML · midbrain', uz: "ML · o'rta miya" },
      name: { en: 'Medial lemniscus in the midbrain', uz: "O'rta miyada medial lemnisk" },
      text: {
        en: 'In the midbrain tegmentum the lemniscus lies lateral to the red nucleus and dorsal to the substantia nigra, on its way to the thalamus.',
        uz: "O'rta miya tegmentumida lemnisk qizil yadrodan lateralda va qora moddadan dorsalda yotadi — talamusga yo'lda.",
      },
      neuron: 2,
      level: 'midbrain',
      side: 'L',
      zones: ['all', 'dorsal'],
      items: ['ml'],
      plate: 'midbrain-superior-colliculus',
      show: [{ concept: 'red-nucleus', side: L }],
      at: [-12, -22.5, -12.5],
      view: FROM_LEFT,
    },
    {
      id: 'vpl',
      label: { en: 'VPL', uz: 'VPL' },
      name: { en: 'VPL nucleus of the thalamus', uz: 'Talamusning VPL yadrosi' },
      text: {
        en: 'The third neuron sits in the ventral posterolateral nucleus (VPL) of the thalamus. (The face, via the trigeminal lemniscus, relays next door in VPM.)',
        uz: 'Uchinchi neyron talamusning ventral orqa-lateral yadrosida (VPL). (Yuz sezgisi trigeminal lemnisk orqali yonidagi VPM da almashadi.)',
      },
      neuron: 3,
      level: 'thalamus',
      side: 'L',
      zones: ['all'],
      items: ['th-vpl'],
      plate: 'thalamus-coronal',
      show: [{ concept: 'j-vpl', side: L }],
      at: [-19.9, -25.5, 3.9],
      view: FROM_LEFT,
    },
    {
      id: 's1',
      label: { en: 'S1 (3, 1, 2)', uz: 'S1 (3, 1, 2)' },
      name: { en: 'Posterior limb → primary somatosensory cortex', uz: "Orqa oyoq → birlamchi somatosensor po'stloq" },
      text: {
        en: 'Thalamocortical axons pass through the posterior limb of the internal capsule and the corona radiata to the postcentral gyrus (areas 3a, 3b, 1, 2), mapped like the motor strip — leg medial, face lateral.',
        uz: "Talamokortikal aksonlar ichki kapsulaning orqa oyog'i va nursimon toj orqali orqa markaziy pushtaga (3a, 3b, 1, 2-maydonlar) boradi; xarita harakat tasmasi kabi — oyoq medialda, yuz lateralda.",
      },
      deep: {
        en: 'Cortical lesions spare crude sensation but destroy discriminative sensation: astereognosis, agraphaesthesia, loss of two-point discrimination and sensory extinction — "cortical sensory loss", with primary modalities nearly intact.',
        uz: "Po'stloq o'choqlari dag'al sezgini saqlaydi, lekin farqlovchi sezgini buzadi: astereognoz, agrafesteziya, ikki nuqtani farqlashning yo'qolishi va sezgi 'so'nishi' — birlamchi turlar deyarli saqlangan 'po'stloq sezgi buzilishi'.",
      },
      neuron: 3,
      level: 'cortex',
      side: 'L',
      zones: ['all', 'sensory'],
      also: [{ level: 'capsule', zones: ['all'] }],
      items: ['ic-pl'],
      show: [{ concept: 'j-area-3b', side: L }],
      at: [-40, -25, 50],
      view: [-1, 0.1, 0.5],
    },
  ],
  sources: [SRC.dc, SRC.ml, SRC.thal, SRC.jhu],
}

// ── Anterolateral (spinothalamic) system ───────────────────────────────

const ALS: Pathway = {
  id: 'path-als',
  short: { en: 'Spinothalamic', uz: 'Spinotalamik' },
  title: { en: 'Anterolateral system (spinothalamic tract)', uz: "Anterolateral tizim (spinotalamik yo'l)" },
  blurb: {
    en: 'Pain and temperature: cross at once in the cord, run lateral through the brainstem, relay in VPL.',
    uz: "Og'riq va harorat: orqa miyada darhol kesishadi, miya ustunining lateral qismidan o'tadi, VPL da almashadi.",
  },
  color: '#b07cff',
  modality: { en: 'Pain, temperature, crude touch', uz: "Og'riq, harorat, dag'al teginish" },
  dir: 'up',
  crossing: {
    en: 'Crosses in the anterior white commissure of the cord, within 1–2 segments of entry.',
    uz: 'Orqa miyaning old oq bitishmasida, kirgan joyidan 1–2 segment ichida kesishadi.',
  },
  path: [
    [5, -52, -98],
    [0.5, -49, -95],
    [-5, -48, -90],
    [-6, -45.5, -74],
    [-6.5, -42.5, -66],
    [-9, -37.5, -56],
    [-10, -36, -48],
    [-11, -37, -38],
    [-11, -34, -29],
    [-11, -31, -22],
    [-12, -28, -17],
    [-13, -24, -12],
    [-14.5, -21.5, -6],
    [-19.9, -25.5, 3.9],
    [-23, -25, 16],
    [-30, -25, 34],
    [-40, -25, 50],
  ],
  stations: [
    {
      id: 'als-cord',
      label: { en: 'Anterior white commissure', uz: 'Old oq bitishma' },
      name: { en: 'Dorsal horn and anterior white commissure', uz: 'Orqa shox va old oq bitishma' },
      text: {
        en: 'Thin Aδ and C fibres of the first neuron enter the dorsal horn (ascending or descending a segment or two in Lissauer’s tract) and synapse in laminae I, II and V. The second neuron’s axon crosses at once in the anterior white commissure and ascends in the opposite anterolateral column.',
        uz: "Birinchi neyronning ingichka Aδ va C tolalari orqa shoxga kiradi (Lissauer traktida bir-ikki segment yuqoriga yoki pastga o'tib) va I, II, V plastinkalarda sinaps hosil qiladi. Ikkinchi neyron aksoni darhol old oq bitishmada kesishadi va qarama-qarshi anterolateral ustunda ko'tariladi.",
      },
      memo: { en: 'Pain crosses at once; touch waits for the medulla.', uz: "Og'riq darhol kesishadi; teginish uzunchoq miyagacha kutadi." },
      deep: {
        en: 'Syringomyelia expands the central canal and cuts the crossing fibres of several segments on both sides: a "cape" of lost pain and temperature over shoulders and arms with touch preserved (dissociated sensory loss). Anterolateral cordotomy — cutting this column — is still used for intractable unilateral cancer pain; relief is on the opposite side, starting a few segments below the cut.',
        uz: "Siringomieliya markaziy kanalni kengaytirib bir necha segmentdagi kesishuvchi tolalarni ikki tomonda uzadi: yelka va qo'llarda 'pelerin' shaklida og'riq va harorat sezgisi yo'qoladi, teginish saqlanadi (dissotsiatsiyalangan sezgi buzilishi). Anterolateral xordotomiya — shu ustunni kesish — davolab bo'lmaydigan bir tomonlama saraton og'rig'ida hozir ham qo'llanadi; og'riq qarama-qarshi tomonda, kesimdan bir necha segment pastdan boshlab yo'qoladi.",
      },
      neuron: 2,
      level: 'cord',
      side: 'L',
      cross: true,
      zones: ['all', 'ventral'],
      items: [],
      show: [
        { concept: 'bs-pyramid-of-medulla-oblongata', side: L },
        { concept: 'bs-pyramid-of-medulla-oblongata', side: R },
      ],
      at: [-5, -48, -90],
      view: FROM_BEHIND_LEFT,
    },
    {
      id: 'als-medulla',
      label: { en: 'ALS · medulla', uz: 'ALS · uzunchoq miya' },
      name: { en: 'Spinal lemniscus in the lateral medulla', uz: 'Lateral uzunchoq miyada spinal lemnisk' },
      text: {
        en: 'Already crossed, the fibres run in the lateral medulla, dorsal to the olive, beside the spinal trigeminal tract and nucleus — which carry pain from the SAME side of the face.',
        uz: "Allaqachon kesishgan tolalar uzunchoq miyaning lateral qismida, zaytundan dorsalda — o'sha tomondagi yuz og'rig'ini olib boruvchi uchlik nervning spinal trakti va yadrosi yonida o'tadi.",
      },
      deep: {
        en: 'Lateral medullary (Wallenberg) syndrome — PICA or vertebral artery: loss of pain and temperature on the opposite body (ALS) and on the same side of the face (spinal V) — the classic crossed sensory loss — with ataxia, vertigo, dysphagia, hoarseness and Horner syndrome. Touch and position are spared because the lemniscus is medial.',
        uz: "Lateral medullyar (Wallenberg) sindromi — PICA yoki vertebral arteriya: qarama-qarshi tana (ALS) va o'sha tomondagi yuzda (spinal V) og'riq va harorat sezgisi yo'qoladi — klassik 'kesishgan' sezgi buzilishi; bunga ataksiya, bosh aylanishi, disfagiya, xirillash va Horner sindromi qo'shiladi. Lemnisk medialda bo'lgani uchun teginish va holat saqlanadi.",
      },
      neuron: 2,
      level: 'medulla-rostral',
      side: 'L',
      zones: ['all', 'lateral'],
      also: [{ level: 'medulla-caudal', zones: ['all', 'lateral'] }],
      items: ['als'],
      plate: 'medulla-olive',
      show: [
        { concept: 'bs-inferior-olive', side: L },
        { concept: 'bs-pyramid-of-medulla-oblongata', side: L },
      ],
      at: [-9, -37.5, -56],
      view: FROM_LEFT,
    },
    {
      id: 'als-pons',
      label: { en: 'ALS · pons', uz: "ALS · ko'prik" },
      name: { en: 'Lateral pons and midbrain', uz: "Ko'prik va o'rta miyaning lateral qismi" },
      text: {
        en: 'Through the pons and midbrain the tract stays in the lateral tegmentum, lateral to the medial lemniscus, which it joins in the midbrain before reaching the thalamus. Collaterals leave to the reticular formation (arousal) and the periaqueductal grey (descending pain control).',
        uz: "Ko'prik va o'rta miyada trakt lateral tegmentumda, medial lemniskdan lateralda qoladi va talamusga yetmasdan o'rta miyada unga qo'shiladi. Kollaterallari retikulyar formatsiyaga (uyg'oqlik) va suv yo'li atrofidagi kulrang moddaga (og'riqni pastga nazorat qilish) ketadi.",
      },
      deep: {
        en: 'Only part of the system is "neospinothalamic" (to VPL → S1: where and how strong). Paleospinothalamic, spinoreticular and spinomesencephalic fibres reach the intralaminar and medial thalamus, then the anterior cingulate and insula — the affective, unpleasant side of pain, targeted by cingulotomy.',
        uz: "Tizimning faqat bir qismi 'neospinotalamik' (VPL → S1: qayerda va qanchalik kuchli). Paleospinotalamik, spinoretikulyar va spinomezensefalik tolalar talamusning intralaminar va medial yadrolariga, so'ng old belbog' pushtasi va orolchaga boradi — og'riqning affektiv, yoqimsiz tomoni; singulotomiya shunga qaratilgan.",
      },
      neuron: 2,
      level: 'pons',
      side: 'L',
      zones: ['all', 'lateral'],
      items: ['als'],
      plate: 'pons-trigeminal',
      show: [{ concept: 'bs-pontine-tegmentum', side: L }],
      at: [-11, -34, -29],
      view: FROM_LEFT,
    },
    {
      id: 'als-midbrain',
      label: { en: 'ALS · midbrain', uz: "ALS · o'rta miya" },
      name: { en: 'Midbrain tegmentum', uz: "O'rta miya tegmentumi" },
      text: {
        en: 'In the midbrain the spinothalamic fibres lie dorsolateral, just under the surface, next to the medial lemniscus.',
        uz: "O'rta miyada spinotalamik tolalar dorsolateralda, yuzaning ostida, medial lemnisk yonida yotadi.",
      },
      neuron: 2,
      level: 'midbrain',
      side: 'L',
      zones: ['all', 'dorsal'],
      items: ['als'],
      plate: 'midbrain-superior-colliculus',
      show: [{ concept: 'bs-periaqueductal-grey-pag' }],
      at: [-13, -24, -12],
      view: FROM_LEFT,
    },
    {
      id: 'als-vpl',
      label: { en: 'VPL → S1', uz: 'VPL → S1' },
      name: { en: 'VPL → postcentral gyrus', uz: 'VPL → orqa markaziy pushta' },
      text: {
        en: 'The third neuron in VPL projects through the posterior limb of the internal capsule to the postcentral gyrus, side by side with the lemniscal relay.',
        uz: "VPL dagi uchinchi neyron ichki kapsulaning orqa oyog'i orqali orqa markaziy pushtaga — lemnisk relesi bilan yonma-yon boradi.",
      },
      deep: {
        en: 'A VPL infarct (thalamogeniculate branches of the PCA) causes contralateral loss of all modalities, and weeks later may leave severe burning central pain — Dejerine–Roussy (thalamic pain) syndrome.',
        uz: "VPL infarkti (PCA ning talamogenikulyar shoxlari) qarama-qarshi tomonda barcha sezgi turlarini yo'qotadi, bir necha haftadan keyin kuchli achishtiruvchi markaziy og'riq qoldirishi mumkin — Dejerine–Roussy (talamik og'riq) sindromi.",
      },
      neuron: 3,
      level: 'thalamus',
      side: 'L',
      zones: ['all'],
      also: [
        { level: 'capsule', zones: ['all'] },
        { level: 'cortex', zones: ['all', 'sensory'] },
      ],
      items: ['th-vpl'],
      plate: 'thalamus-coronal',
      show: [
        { concept: 'j-vpl', side: L },
        { concept: 'j-area-3b', side: L },
      ],
      at: [-19.9, -25.5, 3.9],
      view: FROM_LEFT,
    },
  ],
  sources: [SRC.stt, SRC.thal, { title: 'StatPearls — Dejerine-Roussy Syndrome', url: 'https://www.ncbi.nlm.nih.gov/books/NBK519047/' }],
}

export const PATHWAYS: Pathway[] = [CST, DCML, ALS]
export const PATHWAY_BY_ID = new Map(PATHWAYS.map((p) => [p.id, p]))
