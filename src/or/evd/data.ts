/**
 * OP-1 EVD (ventriculostomy) clinical data, verified references, step definitions,
 * landmarks, complication rates, and difficulty tiers (AG-15).
 *
 * Every clinical value and citation comes from `docs/research/procedures/evd.md`
 * (AG-9; DOIs verified against Crossref API and StatPearls against NCBI E-utilities on 2026-11-23).
 */
import type { Disclaimer, L10n, Range, Sourced } from '../types'
import type { EvdLevel, EvdRef, EvdRefId, EvdStepDef, EvdStepId, KakarlaGrade } from './types'

// ── Training Disclaimer (SURGERY.md §0.3 · App Store 1.4.1) ────────────────

export const EVD_DISCLAIMER: Disclaimer = {
  text: {
    uz: "Faqat ta'lim va mashg'ulot uchun; real bemor uchun jarrohlik rejasi emas. Masofa va baholar o'rtacha atlas miyasi (MNI ICBM152 / BodyParts3D) bo'yicha hisoblanadi.",
    en: 'For training and education only; not a surgical plan for a real patient. Distances and scores are computed on the average atlas brain (MNI ICBM152 / BodyParts3D).',
  },
}

// ── Verified References (evd.md §9; checked 2026-11-23) ────────────────────

export const EVD_REFS: Record<EvdRefId, EvdRef> = {
  fried2016: {
    id: 'fried2016',
    label: 'Fried 2016',
    cite: 'Fried HI, Nathan BR, Rowe AS, et al. (2016). The Insertion and Management of External Ventricular Drains: An Evidence-Based Consensus Statement. Neurocritical Care.',
    doi: '10.1007/s12028-015-0224-8',
    checked: '2026-11-23',
  },
  kakarla2008: {
    id: 'kakarla2008',
    label: 'Kakarla 2008',
    cite: 'Kakarla UK, Kim LJ, Chang SW, Theodore N, Spetzler RF (2008). Safety and Accuracy of Bedside External Ventricular Drain Placement. Operative Neurosurgery.',
    doi: '10.1227/01.neu.0000312390.83127.7f',
    pmid: '18728595',
    checked: '2026-11-23',
  },
  huyette2008: {
    id: 'huyette2008',
    label: 'Huyette 2008',
    cite: 'Huyette DR, Turnbow BJ, Kaufman C, Vaslow DF, Whiting BB, Oh MY (2008). Accuracy of the freehand pass technique for ventriculostomy catheter placement: retrospective assessment using computed tomography scans. Journal of Neurosurgery.',
    doi: '10.3171/JNS/2008/108/01/0088',
    pmid: '18173315',
    checked: '2026-11-23',
  },
  friedman1980: {
    id: 'friedman1980',
    label: 'Friedman & Vries 1980',
    cite: 'Friedman WA, Vries JK (1980). Percutaneous tunnel ventriculostomy. Journal of Neurosurgery.',
    doi: '10.3171/jns.1980.53.5.0662',
    pmid: '7431075',
    checked: '2026-11-23',
  },
  ghajar1985: {
    id: 'ghajar1985',
    label: 'Ghajar 1985',
    cite: 'Ghajar JB (1985). A guide for ventricular catheter placement. Journal of Neurosurgery.',
    doi: '10.3171/jns.1985.63.6.0985',
    pmid: '4056916',
    checked: '2026-11-23',
  },
  morone2019: {
    id: 'morone2019',
    label: 'Morone 2019',
    cite: "Morone PJ, Dewan MC, Zuckerman SL, Tubbs RS, Singer RJ (2019/2020). Craniometrics and Ventricular Access: A Review of Kocher's, Kaufman's, Paine's, Menovksy's, Tubbs', Keen's, Frazier's, Dandy's, and Sanchez's Points. Operative Neurosurgery.",
    doi: '10.1093/ons/opz194',
    checked: '2026-11-23',
  },
  bauer2011: {
    id: 'bauer2011',
    label: 'Bauer 2011',
    cite: 'Bauer DF, Razdan SN, Bartolucci AA, Markert JM (2011). Meta-Analysis of Hemorrhagic Complications From Ventriculostomy Placement by Neurosurgeons. Neurosurgery.',
    doi: '10.1227/NEU.0b013e31821a45ba',
    pmid: '21471831',
    checked: '2026-11-23',
  },
  lozier2002: {
    id: 'lozier2002',
    label: 'Lozier 2002',
    cite: 'Lozier AP, Sciacca RR, Romagnoli MF, Connolly ES (2002). Ventriculostomy-related Infections: A Critical Review of the Literature. Neurosurgery.',
    doi: '10.1097/00006123-200207000-00024',
    pmid: '12182415',
    checked: '2026-11-23',
  },
  ramanan2015: {
    id: 'ramanan2015',
    label: 'Ramanan 2015',
    cite: 'Ramanan M, Lipman J, Shorr A, Shankar A (2015). A meta-analysis of ventriculostomy-associated cerebrospinal fluid infections. BMC Infectious Diseases.',
    doi: '10.1186/s12879-014-0712-z',
    pmid: '25567583',
    checked: '2026-11-23',
  },
  muralidharan2015: {
    id: 'muralidharan2015',
    label: 'Muralidharan 2015',
    cite: 'Muralidharan R (2015). External ventricular drains: Management and complications. Surgical Neurology International.',
    doi: '10.4103/2152-7806.157620',
    pmid: '26069848',
    checked: '2026-11-23',
  },
  'statpearls-nbk545317': {
    id: 'statpearls-nbk545317',
    label: 'StatPearls NBK545317',
    cite: 'StatPearls (NCBI Bookshelf). Ventriculostomy. Accession: NBK545317 (https://www.ncbi.nlm.nih.gov/books/NBK545317/).',
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
  yudkowsky2013: {
    id: 'yudkowsky2013',
    label: 'Yudkowsky 2013',
    cite: "Yudkowsky R, Luciano C, Banerjee P, et al. (2013). Practice on an Augmented Reality/Haptic Simulator and Library of Virtual Brains Improves Residents' Ability to Perform a Ventriculostomy. Simulation in Healthcare.",
    doi: '10.1097/SIH.0b013e3182662c69',
    pmid: '23117306',
    checked: '2026-11-23',
  },
  hooten2014: {
    id: 'hooten2014',
    label: 'Hooten 2014',
    cite: 'Hooten KG, Lister JR, Lombard G, et al. (2014). Mixed Reality Ventriculostomy Simulation. Operative Neurosurgery.',
    doi: '10.1227/NEU.0000000000000503',
    pmid: '25050577',
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

// ── 9-Step Procedure Sequence (evd.md §5) ──────────────────────────────────

export const EVD_STEPS_DATA: readonly EvdStepDef[] = [
  {
    id: 'position',
    index: 1,
    kind: 'confirm',
    name: { uz: 'Holat va tayyorgarlik', en: 'Position & preparation' },
    instruction: {
      uz: "Bemor chalqancha, karavot boshi 30°–45° ko'tarilgan, bosh qat'iy neytral (burun shipga), tomon (odatda o'ng nodominant), koagulogramma (INR/trombotsit) va profilaktik antibiotikni tasdiqlang.",
      en: 'Confirm supine position with head of bed elevated 30°–45°, head strictly neutral (nose to ceiling), side (usually right non-dominant), coagulation profile, and prophylactic antibiotic.',
    },
    mistake: {
      uz: "Bosh burilgan holda boshlansa, keyingi barcha erkin qo'l (freehand) burchaklari tizimli ravishda og'adi.",
      en: 'Starting with a rotated head introduces systematic error into every freehand trajectory angle.',
    },
    refs: ['friedman1980', 'fried2016', 'statpearls-nbk545317'],
  },
  {
    id: 'mark',
    index: 2,
    kind: 'mark',
    name: { uz: 'Kocher nuqtasini belgilash', en: 'Mark Kocher point' },
    instruction: {
      uz: "Naziondan 100–120 mm (standart 110 mm) orqaga — koronar chokdan 10–20 mm (standart 15 mm) oldinga va o'rta chiziqdan 25–30 mm lateral (o'rta qorachiq chizig'i) nuqtani belgilang.",
      en: 'Mark 100–120 mm (standard 110 mm) posterior to nasion — 10–20 mm (standard 15 mm) anterior to the coronal suture — and 25–30 mm lateral to midline (mid-pupillary line).',
    },
    mistake: {
      uz: "20 mm dan medial kirish yuqori sagittal sinus va venoz lakunalarga, koronar chokdan orqada kirish esa precentral pushta (motor po'stloq) ga xavf soladi.",
      en: 'Entry < 20 mm from midline risks the superior sagittal sinus and venous lacunae; entry behind the coronal suture risks the precentral gyrus (motor cortex).',
    },
    refs: ['friedman1980', 'huyette2008', 'morone2019', 'statpearls-nbk545317'],
  },
  {
    id: 'incision',
    index: 3,
    kind: 'confirm',
    name: { uz: 'Teri kesmasi va periost', en: 'Skin incision & periosteum' },
    instruction: {
      uz: "Kocher nuqtasi ustida 2–3 sm chiziqli kesma bajaring, periostni ajrating va suyak yuzasini ochish uchun retraktor qo'ying.",
      en: 'Make a 2–3 cm linear incision over Kocher point, strip the periosteum, and place a self-retaining retractor to expose the outer table.',
    },
    mistake: {
      uz: "Noto'g'ri joydagi kesma kateter burchagini cheklaydi; galea qonashini nazorat qilmaslik ko'rish maydonini yopadi.",
      en: 'A misplaced incision restricts catheter angulation; uncontrolled galeal bleeding obscures landmarks.',
    },
    refs: ['statpearls-nbk545317'],
  },
  {
    id: 'burr',
    index: 4,
    kind: 'burr',
    name: { uz: "Burg'u teshigi (Burr hole)", en: 'Burr hole' },
    instruction: {
      uz: "10–14 mm burg'u bilan tashqi plastinka → diploe → ichki plastinkani nazorat ostida oching (SX-4 ulanguncha bosqichni tasdiqlang).",
      en: 'Drill a 10–14 mm burr hole controlled through outer table → diploe → inner table (confirm step until SX-4 voxel drill is connected).',
    },
    mistake: {
      uz: 'Haddan tashqari bosim («plunging») qattiq miya pardasi yirtilishiga va kortikal qon ketishga olib keladi.',
      en: 'Excessive downward force (plunging) lacerates the dura mater and causes cortical hemorrhage.',
    },
    refs: ['statpearls-nbk545317'],
  },
  {
    id: 'dura',
    index: 5,
    kind: 'confirm',
    name: { uz: 'Dura ochilishi va kortikotomiya', en: 'Durotomy & corticotomy' },
    instruction: {
      uz: "Qattiq miya pardasini xochsimon kesing, pia-araxnoid va yuzaki kortikal venalarni koagulyatsiya qilib o'rta frontal pushtada kichik kortikotomiya bajaring.",
      en: 'Open the dura in a cruciate fashion, coagulate the pia-arachnoid while sparing superficial cortical veins, and perform a small corticotomy on the middle frontal gyrus.',
    },
    mistake: {
      uz: 'Yuzaki kortikal venani shikastlash subdural yoki intraparenximal qon ketish keltirib chiqaradi.',
      en: 'Injuring a superficial cortical vein causes subdural or intraparenchymal hemorrhage.',
    },
    refs: ['statpearls-nbk545317'],
  },
  {
    id: 'insert',
    index: 6,
    kind: 'catheter',
    name: { uz: "Kateterni yo'naltirish va kiritish", en: 'Aim & insert catheter' },
    instruction: {
      uz: "Styletli kateterni koronal tekislikda ipsilateral medial ko'z burchagiga (5°–12° medial), sagittal tekislikda tashqi eshituv yo'lidan 10–15 mm oldinga (yoki Ghajar 90° sirt normali bo'ylab) bir tekis va sekin kiriting.",
      en: 'Advance the styletted catheter smoothly toward the ipsilateral medial canthus in the coronal plane (5°–12° medial) and 10–15 mm anterior to the EAM in the sagittal plane (or perpendicular to the skull per Ghajar).',
    },
    mistake: {
      uz: "Burchak > 10° og'ishi dumli yadro, ichki kapsula yoki perikallozal arteriya to'qnashuviga olib keladi; har yangi urinish (pass) qon ketish xavfini oshiradi.",
      en: 'Angular deviation > 10° risks the caudate nucleus, internal capsule, or pericallosal artery; each additional pass raises hemorrhage risk.',
    },
    refs: ['friedman1980', 'ghajar1985', 'huyette2008', 'kakarla2008'],
  },
  {
    id: 'csf',
    index: 7,
    kind: 'auto',
    name: { uz: 'Qorinchaga tushish («Pop» + Likvor)', en: 'Ventricle entry (Pop + CSF)' },
    instruction: {
      uz: '40–50 mm chuqurlikda ependimal qarshilik pasayishi («pop») va likvor (CSF) oqishini kuzating. 65–70 mm dan chuqurroq kirmang.',
      en: 'Expect an ependymal "pop" and CSF egress at 40–50 mm depth. Never advance blindly beyond 65–70 mm.',
    },
    mistake: {
      uz: 'Likvor kelmasdan > 70 mm ga kirish uchinchi qorincha tubi, talamus, gipotalamus yoki bazilyar arteriyani shikastlaydi.',
      en: 'Advancing > 70 mm without CSF risks the third-ventricle floor, thalamus, hypothalamus, or basilar artery.',
    },
    refs: ['huyette2008', 'statpearls-nbk545317'],
  },
  {
    id: 'seat',
    index: 8,
    kind: 'catheter',
    name: { uz: 'Styletni olish va chuqurlikni sozlash', en: 'Remove stylet & seat depth' },
    instruction: {
      uz: "Likvor olingach styletni chiqaring va yumshoq kateterni tashqi suyak plastinkasidan 55–65 mm (Monro teshigi ustiga) o'rnating.",
      en: 'Once CSF flows, withdraw the rigid stylet and advance the soft catheter to 55–65 mm from the outer table (above the foramen of Monro).',
    },
    mistake: {
      uz: 'Stylet bilan chuqur surish xorioid chigal yoki yuqori talamostriat venadan intraventrikulyar qon ketishga sabab bo‘ladi.',
      en: 'Advancing deeper with the stylet in place risks bleeding from the choroid plexus or superior thalamostriate vein.',
    },
    refs: ['huyette2008', 'kakarla2008', 'statpearls-nbk545317'],
  },
  {
    id: 'secure',
    index: 9,
    kind: 'confirm',
    name: { uz: 'Tunnellash, mahkamlash va nolga keltirish', en: 'Tunnel, secure & zero' },
    instruction: {
      uz: 'Kateterni teri ostidan 5 sm uzoqqa tunnellang, tikib mahkamlang va bosim transdyuserini tragus (Monro teshigi) darajasiga nolga keltiring.',
      en: 'Tunnel the catheter ≥ 5 cm subcutaneously, suture securely, and zero the transducer to the tragus (level of the foramen of Monro).',
    },
    mistake: {
      uz: "Tunnellamaslik ventrikulit (VRI) xavfini oshiradi; drenaj kamerasi juda past qo'yilsa ortiqcha drenaj (overdrainage) yuz beradi.",
      en: 'Omitting subcutaneous tunneling increases ventriculitis risk; setting the drip chamber too low causes overdrainage.',
    },
    refs: ['friedman1980', 'fried2016', 'lozier2002', 'muralidharan2015'],
  },
]

export const EVD_STEP_BY_ID: Record<EvdStepId, EvdStepDef> = EVD_STEPS_DATA.reduce(
  (acc, step) => {
    acc[step.id] = step
    return acc
  },
  {} as Record<EvdStepId, EvdStepDef>,
)

// ── Anatomical Landmarks & Access Points (evd.md §3.1, §3.2, §4) ───────────

export interface EvdAccessPoint {
  id: 'kocher' | 'frazier' | 'keen' | 'dandy' | 'paine'
  name: L10n
  landmark: L10n
  target: L10n
  use: L10n
  refs: readonly EvdRefId[]
}

export const EVD_LANDMARKS = {
  /** Distance posterior to nasion, mm (evd.md §3.1). */
  nasionPosteriorMm: {
    value: { min: 100, max: 120 } as Range,
    refs: ['friedman1980', 'huyette2008', 'morone2019'] as readonly EvdRefId[],
    origin: 'literature' as const,
    note: 'Standard 110 mm',
  },
  /** Distance anterior to coronal suture, mm (evd.md §3.1). */
  coronalAnteriorMm: { value: { min: 10, max: 20 } as Range, refs: ['morone2019'] as readonly EvdRefId[], origin: 'literature' as const, note: 'Standard 10–15 mm' },
  /** Lateral distance from midline, mm (evd.md §3.1). */
  midlineLateralMm: {
    value: { min: 25, max: 35 } as Range,
    refs: ['morone2019', 'friedman1980'] as readonly EvdRefId[],
    origin: 'literature' as const,
    note: 'Standard 25–30 mm (mid-pupillary line)',
  },
  /** Coronal plane medial angulation toward ipsilateral medial canthus, deg (evd.md §4.1). */
  coronalMedialAngleDeg: {
    value: { min: 5, max: 12 } as Range,
    refs: ['friedman1980', 'huyette2008', 'statpearls-nbk545317'] as readonly EvdRefId[],
    origin: 'literature' as const,
  },
  /** Sagittal plane aim anterior to EAM / tragus, mm (evd.md §4.1). */
  sagittalAnteriorToEamMm: { value: { min: 10, max: 15 } as Range, refs: ['friedman1980', 'statpearls-nbk545317'] as readonly EvdRefId[], origin: 'literature' as const },
  /** Ghajar perpendicular skull-normal rule, deg (evd.md §4.1.3). */
  ghajarNormalDeg: { value: 90, refs: ['ghajar1985'] as readonly EvdRefId[], origin: 'literature' as const },
  /** Standard final catheter depth from outer table, mm (evd.md §4.2). */
  outerTableDepthMm: { value: { min: 55, max: 65 } as Range, refs: ['huyette2008', 'statpearls-nbk545317'] as readonly EvdRefId[], origin: 'literature' as const },
  /** Expected ependymal "pop" depth, mm (evd.md §4.2). */
  ependymalPopMm: { value: { min: 40, max: 50 } as Range, refs: ['huyette2008', 'statpearls-nbk545317'] as readonly EvdRefId[], origin: 'literature' as const },
  /** Red-zone depth threshold, mm (evd.md §4.2). */
  redZoneDepthMm: { value: 70, refs: ['statpearls-nbk545317'] as readonly EvdRefId[], origin: 'literature' as const },
  /** Head of bed elevation, deg (evd.md §2). */
  headElevationDeg: { value: { min: 30, max: 45 } as Range, refs: ['fried2016', 'statpearls-nbk545317'] as readonly EvdRefId[], origin: 'literature' as const },
  /** Subcutaneous tunneling length, mm (evd.md §5 step 9). */
  tunnelLengthMm: { value: 50, refs: ['friedman1980', 'fried2016'] as readonly EvdRefId[], origin: 'literature' as const },
  /** Alternative ventricular access points (evd.md §3.2, Morone 2019). */
  accessPoints: [
    {
      id: 'kocher',
      name: { uz: 'Kocher (standart)', en: 'Kocher (standard)' },
      landmark: { uz: "Naziondan 100–110 mm orqaga, o'rta chiziqdan 25–30 mm lateral", en: '100–110 mm posterior to nasion, 25–30 mm lateral to midline' },
      target: { uz: 'Frontal shox (Monro teshigi)', en: 'Frontal horn (foramen of Monro)' },
      use: { uz: "O'tkir EVD (90%+ holatlar)", en: 'Acute EVD (>90% of cases)' },
      refs: ['morone2019', 'friedman1980'],
    },
    {
      id: 'frazier',
      name: { uz: 'Frazier', en: 'Frazier' },
      landmark: { uz: "Iniondan 60 mm yuqoriga, o'rta chiziqdan 30–40 mm lateral", en: '60 mm superior to inion, 30–40 mm lateral to midline' },
      target: { uz: 'Oktsipital shox / atrium', en: 'Occipital horn / atrium' },
      use: { uz: 'Orqa chuqurcha operatsiyalari, VP shunt', en: 'Posterior fossa surgery, VP shunt' },
      refs: ['morone2019'],
    },
    {
      id: 'keen',
      name: { uz: 'Keen', en: 'Keen' },
      landmark: { uz: "Tashqi eshituv yo'lidan 25–30 mm orqaga va 25–30 mm yuqoriga", en: '25–30 mm posterior and 25–30 mm superior to pinna/EAM' },
      target: { uz: 'Atrium (trigone)', en: 'Atrium (trigone)' },
      use: { uz: 'Tez parieto-oktsipital kirish', en: 'Rapid parieto-occipital access' },
      refs: ['morone2019'],
    },
    {
      id: 'dandy',
      name: { uz: 'Dandy', en: 'Dandy' },
      landmark: { uz: "Iniondan 30 mm yuqoriga, o'rta chiziqdan 20 mm lateral", en: '30 mm superior to inion, 20 mm lateral to midline' },
      target: { uz: 'Oktsipital shox', en: 'Occipital horn' },
      use: { uz: "Tarixiy (ko'rish yo'llariga yaqin)", en: 'Historical (close to optic radiations)' },
      refs: ['morone2019'],
    },
    {
      id: 'paine',
      name: { uz: 'Paine', en: 'Paine' },
      landmark: { uz: "Silviy yorig'i va qosh yoyi bo'ylab 25 × 25 mm", en: '25 × 25 mm along Sylvian fissure and orbital roof' },
      target: { uz: 'Frontal shox (intraoperatsion)', en: 'Frontal horn (intraoperative)' },
      use: { uz: 'Pterional kraniotomiyada tez dekompressiya', en: 'Rapid decompression during pterional craniotomy' },
      refs: ['morone2019'],
    },
  ] as readonly EvdAccessPoint[],
} as const

// ── Complication Table (evd.md §6) ─────────────────────────────────────────

export interface EvdComplication {
  id: string
  name: L10n
  rate: Sourced<L10n>
  cause: L10n
  refs: readonly EvdRefId[]
}

export const EVD_COMPLICATIONS: readonly EvdComplication[] = [
  {
    id: 'malposition',
    name: { uz: "Noto'g'ri joylashish (Malposition)", en: 'Malposition' },
    rate: {
      value: {
        uz: '22%–40% (Huyette 2008: 22.4% parenxima/SA; Kakarla 2008: G1 77%, G2 10%, G3 13%)',
        en: '22%–40% (Huyette 2008: 22.4% parenchymal/SA; Kakarla 2008: G1 77%, G2 10%, G3 13%)',
      },
      refs: ['huyette2008', 'kakarla2008'],
      origin: 'literature',
    },
    cause: {
      uz: 'Boshning burilganligi, burchak xatosi > 10°, tor yoki siljigan qorincha.',
      en: 'Head rotation, angular error > 10°, slit or shifted ventricles.',
    },
    refs: ['huyette2008', 'kakarla2008'],
  },
  {
    id: 'multiple-passes',
    name: { uz: 'Bir nechta urinish (Multiple passes)', en: 'Multiple passes' },
    rate: {
      value: { uz: "O'rtacha ~2 urinish", en: 'Mean ~2 passes' },
      refs: ['huyette2008'],
      origin: 'literature',
    },
    cause: {
      uz: 'Har qo‘shimcha urinish trakt qon ketishi va parenxima shikastlanishini oshiradi.',
      en: 'Each additional pass increases tract hemorrhage and parenchymal injury.',
    },
    refs: ['huyette2008'],
  },
  {
    id: 'hemorrhage',
    name: { uz: 'Qon ketish (EVD hemorrhage)', en: 'EVD-related hemorrhage' },
    rate: {
      value: { uz: 'KT da ~7.0%; simptomatik ~0.8%', en: '~7.0% on CT; ~0.8% symptomatic' },
      refs: ['bauer2011', 'fried2016'],
      origin: 'literature',
    },
    cause: {
      uz: "Koagulopatiya, ko'p urinish, talamostriat vena / xorioid chigal / kortikal tomir shikastlanishi.",
      en: 'Coagulopathy, multiple passes, injury to thalamostriate vein, choroid plexus, or cortical vessel.',
    },
    refs: ['bauer2011', 'fried2016'],
  },
  {
    id: 'infection',
    name: { uz: 'Infeksiya (VRI / Ventrikulit)', en: 'Ventriculostomy-related infection (VRI)' },
    rate: {
      value: { uz: '~8.8% (Lozier 2002); 11.4 / 1000 kateter-kun (Ramanan 2015)', en: '~8.8% (Lozier 2002); 11.4 / 1000 catheter-days (Ramanan 2015)' },
      refs: ['lozier2002', 'ramanan2015', 'fried2016'],
      origin: 'literature',
    },
    cause: {
      uz: 'Uzoq turishi (> 5 kun), tez-tez likvor olish, tunnellash yetishmasligi, IVH.',
      en: 'Prolonged duration (> 5 days), frequent CSF sampling, inadequate tunneling, IVH.',
    },
    refs: ['lozier2002', 'ramanan2015', 'fried2016'],
  },
  {
    id: 'occlusion',
    name: { uz: 'Mexanik tiqilish / siljish', en: 'Mechanical occlusion / dislodgement' },
    rate: {
      value: { uz: '~10%–20% (IVH da yuqoriroq)', en: '~10%–20% (higher in IVH)' },
      refs: ['muralidharan2015', 'statpearls-nbk545317'],
      origin: 'literature',
    },
    cause: {
      uz: "Qon laxtasi, xorioid chigalga kirib qolish, kateterning noto'g'ri mahkamlanishi.",
      en: 'Blood clot, choroid plexus ingrowth, inadequate securing.',
    },
    refs: ['muralidharan2015', 'statpearls-nbk545317'],
  },
  {
    id: 'overdrainage',
    name: { uz: 'Ortiqcha drenaj (Overdrainage)', en: 'Overdrainage' },
    rate: {
      value: { uz: "O'zgaruvchan (sozlashga bog'liq)", en: 'Variable (height-dependent)' },
      refs: ['muralidharan2015', 'fried2016'],
      origin: 'literature',
    },
    cause: {
      uz: 'Drenaj kamerasi Monro/tragus darajasidan juda past bo‘lishi → subdural gematoma, yuqoriga churra.',
      en: 'Drip chamber set too low below Monro/tragus → subdural hematoma, upward herniation.',
    },
    refs: ['muralidharan2015', 'fried2016'],
  },
]

// ── Difficulty Levels (evd.md §8.1 · Yudkowsky 2013) ───────────────────────

export interface EvdLevelDef {
  level: EvdLevel
  title: L10n
  summary: L10n
  defaultLaser: boolean
  refs: readonly EvdRefId[]
}

export const EVD_LEVELS: readonly EvdLevelDef[] = [
  {
    level: 1,
    title: { uz: '1 — Talaba', en: '1 — Student' },
    summary: {
      uz: "3D traektoriya lazeri yoqilgan; orientirlar va yo'nalish bo'yicha mashq.",
      en: '3D trajectory laser enabled; guided practice on landmarks and aiming.',
    },
    defaultLaser: true,
    refs: ['yudkowsky2013'],
  },
  {
    level: 2,
    title: { uz: '2 — Rezident', en: '2 — Resident' },
    summary: {
      uz: "Normal atlas qorinchasi, lazer o'chirilgan (faqat tashqi anatomik orientirlar).",
      en: 'Normal atlas ventricle, trajectory laser off (freehand external landmarks only).',
    },
    defaultLaser: false,
    refs: ['yudkowsky2013', 'huyette2008'],
  },
  {
    level: 3,
    title: { uz: '3 — Neyroxirurg (PhD)', en: '3 — Neurosurgeon (PhD)' },
    summary: {
      uz: "Yuqori aniqlik talabi (yoriqsimon / siljigan qorincha geometriyasi keyingi bosqichda qo'shiladi), lazer o'chirilgan.",
      en: 'High-precision mode (slit / shifted ventricle geometry arrives in a later stage), laser off.',
    },
    defaultLaser: false,
    refs: ['yudkowsky2013', 'kakarla2008'],
  },
]

// ── Kakarla Grade Descriptions (evd.md §7.1 · Kakarla 2008) ────────────────

export const EVD_KAKARLA_DESC: Record<KakarlaGrade, { title: L10n; summary: L10n; percent: number; refs: readonly EvdRefId[] }> = {
  1: {
    title: { uz: 'Kakarla 1 — Optimal', en: 'Kakarla Grade 1 — Optimal' },
    summary: {
      uz: 'Kateter uchi ipsilateral frontal shoxda (Monro teshigidan ≤ 10 mm) yoki uchinchi qorinchada.',
      en: 'Tip in ipsilateral frontal horn (≤ 10 mm of foramen of Monro) or third ventricle.',
    },
    percent: 100,
    refs: ['kakarla2008'],
  },
  2: {
    title: { uz: 'Kakarla 2 — Funksional (suboptimal)', en: 'Kakarla Grade 2 — Functional (suboptimal)' },
    summary: {
      uz: "Kontralateral yon qorinchada yoki no-elokvent po'stloq/bo'shliqda (ishlaydi, lekin ideal emas).",
      en: 'In contralateral lateral ventricle or non-eloquent cortex/space (functional, not ideal).',
    },
    percent: 60,
    refs: ['kakarla2008'],
  },
  3: {
    title: { uz: 'Kakarla 3 — Suboptimal / Xavfli', en: 'Kakarla Grade 3 — Suboptimal / Hazard' },
    summary: {
      uz: 'Elokvent parenxima (ichki kapsula, bazal gangliyalar, talamus, gipotalamus) yoki qorinchadan tashqarida.',
      en: 'In eloquent parenchyma (internal capsule, basal ganglia, thalamus, hypothalamus) or extraventricular.',
    },
    percent: 0,
    refs: ['kakarla2008'],
  },
}

/** Aggregated EVD text/data bundle matching the contract comment in `types.ts`. */
export const EVD_TEXT = {
  disclaimer: EVD_DISCLAIMER,
  steps: EVD_STEPS_DATA,
  stepById: EVD_STEP_BY_ID,
  landmarks: EVD_LANDMARKS,
  complications: EVD_COMPLICATIONS,
  levels: EVD_LEVELS,
  kakarla: EVD_KAKARLA_DESC,
} as const
