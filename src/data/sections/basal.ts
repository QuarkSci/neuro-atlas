import { B, D, E, L, sym } from './shapes'
import type { Section, Shape } from './types'

/**
 * Basal-ganglia plates B1–B5. Unlike the brainstem figures these are drawn
 * to scale: every point is given in MNI millimetres (x = distance from the
 * midline on the patient's right, which the viewer mirrors to the left;
 * z = height, or y = antero-posterior for the axial plate) and read off the
 * atlas's own meshes (BodyParts3D caudate/putamen/pallidum, Julich-Brain
 * accumbens, VP, Ch4, STN, ZI, SN) cut at the same plane — so proportions
 * match the "Atlas (MNI)" view of the same level.
 */
const C = 320
type P = [number, number]
type Scale = { k: number; top: number; y0: number }
const at = (s: Scale) => (x: number, v: number): P => [C - x * s.k, s.y0 + (s.top - v) * s.k]
const kit = (s: Scale) => {
  const p = at(s)
  return {
    b: (...q: P[]): Shape => B(...q.map(([x, v]) => p(x, v))),
    e: (x: number, v: number, rx: number, rv: number, a = 0): Shape => E(...p(x, v), rx * s.k, rv * s.k, a),
    l: (w: number, ...q: P[]): Shape => L(w, ...q.map(([x, v]) => p(x, v))),
    d: (w: number, ...q: P[]): Shape => D(w, ...q.map(([x, v]) => p(x, v))),
    o: (...q: P[]): Shape => B(...sym(q.map(([x, v]) => p(x, v)), C)),
    pt: p,
  }
}

const AXES_COR: Section['axes'] = [
  { en: 'Dorsal', uz: 'Dorsal (yuqori)' },
  { en: 'Ventral', uz: 'Ventral (pastki)' },
  { en: 'Right', uz: "O'ng" },
  { en: 'Left', uz: 'Chap' },
]
const AXES_AX: Section['axes'] = [
  { en: 'Anterior', uz: 'Old' },
  { en: 'Posterior', uz: 'Orqa' },
  { en: 'Right', uz: "O'ng" },
  { en: 'Left', uz: 'Chap' },
]
const CORONAL = { en: 'Coronal, viewed from the front · drawn to scale (MNI mm)', uz: "Koronal, old tomondan ko'rinish · masshtabda chizilgan (MNI mm)" }
const BG_MESH = /^g-(left|right)-(caudate-nucleus|putamen|globus-pallidus)$/
const coronal = (y: number) => ({ point: [0, y, 0] as [number, number, number], normal: [0, 1, 0] as [number, number, number] })

const SRC_BG = [
  { title: 'Wikipedia — Basal ganglia', url: 'https://en.wikipedia.org/wiki/Basal_ganglia' },
  { title: 'Purves et al., Neuroscience 2nd ed. — Modulation of movement by the basal ganglia (NCBI Bookshelf)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK10868/' },
  { title: 'StatPearls — Neuroanatomy, Basal Ganglia', url: 'https://www.ncbi.nlm.nih.gov/books/NBK537141/' },
  { title: 'Alexander, DeLong & Strick 1986 — Parallel organization of functionally segregated circuits linking basal ganglia and cortex', url: 'https://doi.org/10.1146/annurev.ne.09.030186.002041' },
]
const SRC_VS = [
  { title: 'Wikipedia — Nucleus accumbens', url: 'https://en.wikipedia.org/wiki/Nucleus_accumbens' },
  { title: 'Haber & Knutson 2010 — The reward circuit: linking primate anatomy and human imaging', url: 'https://doi.org/10.1038/npp.2009.129' },
]
const SRC_IC = [
  { title: 'Wikipedia — Internal capsule', url: 'https://en.wikipedia.org/wiki/Internal_capsule' },
  { title: 'Wikipedia — Fields of Forel', url: 'https://en.wikipedia.org/wiki/Fields_of_Forel' },
]

// Lateral wall shared by every coronal plate: external capsule, claustrum,
// extreme capsule and insula, `dx` = putamen's lateral edge (mm).
const lateralWall = (k: ReturnType<typeof kit>, dx: number, top: number, bot: number): Section['items'] => [
  { id: 'ec', mirror: true, shapes: [k.l(5, [dx - 2, top], [dx + 0.8, top - 10], [dx + 1.2, 0], [dx + 0.2, bot + 4], [dx - 3, bot])] },
  { id: 'cl', mirror: true, shapes: [k.b([dx, top + 1], [dx + 1.2, top + 1], [dx + 3, top - 10], [dx + 3.4, 0], [dx + 2.4, bot + 3], [dx - 1, bot - 1.5], [dx - 1.6, bot - 0.8], [dx + 1.6, bot + 3.6], [dx + 2.2, 0], [dx + 1.6, top - 10])] },
  { id: 'xc', mirror: true, shapes: [k.l(5, [dx + 2, top + 2], [dx + 4.4, top - 10], [dx + 4.8, 0], [dx + 3.8, bot + 3], [dx + 0.5, bot - 2])] },
  { id: 'ins', mirror: true, at: k.pt(dx + 7.4, 0), shapes: [k.b([dx + 3.5, top + 4], [dx + 6, top + 3], [dx + 8.6, top - 6], [dx + 9.6, 0], [dx + 8.6, bot + 2], [dx + 4, bot - 3], [dx + 2.4, bot - 3.4], [dx + 5.4, bot + 2.4], [dx + 6.3, 0], [dx + 5.4, top - 8])] },
]

// ── B1 · y +14: caudate head, anterior limb, accumbens ───────────────
const s1 = kit({ k: 7, top: 27, y0: 14 })
const B1: Section = {
  id: 'bg-accumbens',
  code: 'B1',
  region: 'basal-ganglia',
  title: { en: 'Striatum — caudate head and nucleus accumbens (y +14)', uz: 'Striatum — kaudat boshi va accumbens yadrosi (y +14)' },
  orientation: CORONAL,
  plane: coronal(14),
  contour: BG_MESH,
  pin: { side: 'top' },
  loc: [31, 16, 31, 84],
  w: 640,
  h: 330,
  axes: AXES_COR,
  outline: [s1.o([0, 27], [14, 27], [26, 23], [36, 18], [42, 10], [43, 0], [42, -9], [36, -15], [22, -16.5], [8, -16.5], [0, -16])],
  ground: 'hemi-wm',
  items: [
    { id: 'cca', at: s1.pt(-12, 23.2), shapes: [s1.b([0, 25], [10, 25], [18, 23], [18, 20.5], [10, 22], [0, 22], [-10, 22], [-18, 20.5], [-18, 23], [-10, 25]), s1.b([0, -2], [6, -3], [7, -6], [0, -7], [-7, -6], [-6, -3])], note: { en: 'body and rostrum', uz: 'tanasi va tumshug\'i' } },
    { id: 'sp', at: s1.pt(0, 9), shapes: [s1.b([0.8, 21.5], [0.8, -2], [-0.8, -2], [-0.8, 21.5])] },
    { id: 'lv', mirror: true, at: s1.pt(4.5, 15), shapes: [s1.b([1.4, 20.6], [8.6, 20.6], [9.4, 19.4], [6.8, 14.6], [4.7, 9], [3.7, 2], [1.4, -0.4])], note: { en: 'frontal horn', uz: 'frontal shoxi' } },
    { id: 'cau-head', mirror: true, at: s1.pt(11.5, 8), shapes: [s1.b([10, 19.5], [14, 17.5], [17, 12], [17.4, 4], [15.5, -3], [11, -5.6], [7, -4], [4.2, 2], [5.2, 9], [7.4, 14])] },
    { id: 'ic-al', mirror: true, at: s1.pt(19.5, 16), shapes: [s1.b([12, 21], [15, 18.5], [17.8, 13], [18.3, 4], [16.8, -3], [18.5, -7], [19.8, -4], [20, 2], [20.8, 8], [21, 13], [18.5, 19], [15.5, 22.5])] },
    { id: 'str-br', mirror: true, at: s1.pt(19.3, 6), shapes: [s1.e(19.3, 9, 1.5, 0.5, -12), s1.e(19.2, 3.2, 1.4, 0.5, -8), s1.e(18.6, -2.2, 1.3, 0.5, -4)] },
    { id: 'put', mirror: true, at: s1.pt(26.5, 1), shapes: [s1.b([22, 12], [26, 13], [30, 10], [32, 2], [31, -7], [27, -11], [22, -12], [19.5, -9], [20.5, -2], [21.5, 6])] },
    { id: 'acb-core', mirror: true, at: s1.pt(13, -8), shapes: [s1.e(13, -8, 3.6, 2.4)] },
    { id: 'acb-shell', mirror: true, at: s1.pt(6.2, -9.5), shapes: [s1.b([4.5, -5], [8, -5.5], [8.8, -8.5], [11, -11], [15, -11.2], [17, -12], [14, -13.6], [8, -13.4], [4.5, -10.5], [3.8, -7.5])] },
    ...lateralWall(s1, 32, 13, -12),
  ],
  landmarks: {
    en: 'Rostral to the anterior commissure: the frontal horns sit under the corpus callosum, separated by the septum pellucidum, and the head of the caudate bulges into their lateral wall. The anterior limb of the internal capsule cuts obliquely between caudate (medial) and putamen (lateral), crossed by grey cell bridges — the "striped body". Ventrally the capsule ends and caudate and putamen fuse into the ventral striatum: nucleus accumbens (core lateral, shell medial/ventral), which continues onto the basal surface (olfactory tubercle). No globus pallidus yet — it appears at the commissural level (B2). Laterally: external capsule, claustrum, extreme capsule, insula.',
    uz: "Oldingi komissuradan oldinda: frontal shoxlar qadoqsimon tana ostida, shaffof to'siq bilan ajralgan; kaudat boshi ularning lateral devoriga bo'rtib turadi. Ichki kapsulaning oldingi oyog'i kaudat (medialda) va putamen (lateralda) orasidan qiyshiq kesib o'tadi, uni kulrang hujayra ko'prikchalari kesib o'tadi — 'yo'l-yo'l tana'. Ventralda kapsula tugaydi, kaudat va putamen qo'shilib ventral striatumni hosil qiladi: accumbens yadrosi (o'zak lateralda, qobiq medial/ventralda), u asosiy yuzaga (hid do'mbog'i) davom etadi. Rangpar shar hali yo'q — u komissura darajasida (B2) paydo bo'ladi. Lateralda: tashqi kapsula, klaustrum, eng tashqi kapsula, orolcha.",
  },
  blood: {
    en: "Recurrent artery of Heubner (from A1/A2 junction): anteromedial caudate head, anterior limb and accumbens; medial lenticulostriate arteries (A1): ventromedial striatum; lateral lenticulostriate arteries (M1): putamen and dorsal anterior limb. Venous: anterior caudate and septal veins → internal cerebral veins.",
    uz: "Heubner qaytuvchi arteriyasi (A1/A2 tutashuvidan): kaudat boshining anteromedial qismi, oldingi oyoq va accumbens; medial lentikulostriar arteriyalar (A1): ventromedial striatum; lateral lentikulostriar arteriyalar (M1): putamen va oldingi oyoqning dorsal qismi. Vena: oldingi kaudat va septal venalar → ichki miya venalari.",
  },
  syndromes: [
    { name: { en: 'Huntington disease', uz: 'Huntington kasalligi' }, text: { en: 'CAG-repeat expansion in HTT (autosomal dominant, anticipation). Indirect-pathway (D2/enkephalin) MSNs of the caudate die first → GPe over-inhibited → STN under-driven → GPi output falls → chorea; later direct-pathway loss → rigidity, akinesia. MRI: caudate head atrophy, "boxcar" frontal horns (bicaudate ratio ↑). Cognitive and psychiatric decline from the associative/limbic striatum.', uz: "HTT genidagi CAG-takrorlanish kengayishi (autosom-dominant, antitsipatsiya). Avval kaudatning bilvosita yo'l (D2/enkefalin) MSN'lari nobud bo'ladi → GPe ortiqcha tormozlanadi → STN kam qo'zg'aladi → GPi chiqishi kamayadi → xoreya; keyinroq to'g'ri yo'l ham yo'qoladi → rigidlik, akineziya. MRT: kaudat boshi atrofiyasi, 'quti' frontal shoxlar (bikaudat indeksi ↑). Assotsiativ/limbik striatumdan kognitiv va psixiatrik buzilishlar." } },
    { name: { en: 'Caudate infarct (Heubner artery)', uz: 'Kaudat infarkti (Heubner arteriyasi)' }, text: { en: 'Abulia, apathy or disinhibition, executive dysfunction; little weakness unless the anterior limb/genu is involved. Neglect with right-sided lesions.', uz: "Abuliya, apatiya yoki tormozsizlik, ijro funksiyasi buzilishi; oldingi oyoq/tizza qo'shilmasa kuchsizlik kam. O'ng tomonlama o'choqda e'tiborsizlik." } },
    { name: { en: 'Addiction and the shell', uz: 'Giyohvandlik va qobiq' }, text: { en: 'All addictive drugs raise dopamine preferentially in the accumbens shell (Di Chiara). With repeated use control shifts from ventral (accumbens) to dorsal (dorsolateral putamen) striatum — from goal-directed to habitual drug seeking (Everitt & Robbins).', uz: "Barcha giyohvand moddalar dofaminni ayniqsa accumbens qobig'ida oshiradi (Di Chiara). Takroriy qabulda nazorat ventral (accumbens) striatumdan dorsal (dorsolateral putamen) striatumga o'tadi — maqsadli izlanishdan odatiy izlanishga (Everitt va Robbins)." } },
    { name: { en: 'OCD and the ventral capsule (VC/VS DBS)', uz: 'OKB va ventral kapsula (VC/VS DBS)' }, text: { en: 'Hyperactive orbitofrontal–ventral striatal–MD loop. Anterior capsulotomy or DBS of the ventral anterior limb / ventral striatum (FDA humanitarian exemption 2009) relieves ~50–60 % of refractory patients.', uz: "Orbitofrontal–ventral striatum–MD halqasi giperfaol. Oldingi kapsulotomiya yoki ventral oldingi oyoq / ventral striatum DBS'i (FDA gumanitar ruxsati 2009) dori-chidamli bemorlarning ~50–60 % ida yengillik beradi." } },
  ],
  sources: [...SRC_BG, ...SRC_VS],
}

// ── B2 · y +1: anterior commissure, ventral pallidum, basal forebrain ─
const s2 = kit({ k: 7, top: 24, y0: 14 })
const B2: Section = {
  id: 'bg-commissural',
  code: 'B2',
  region: 'basal-ganglia',
  title: { en: 'Commissural level — anterior commissure, GPe, ventral pallidum, nucleus basalis (y +1)', uz: "Komissura darajasi — oldingi komissura, GPe, ventral pallidum, bazal yadro (y +1)" },
  orientation: CORONAL,
  plane: coronal(1),
  contour: BG_MESH,
  pin: { side: 'top', off: 8 },
  loc: [52, 16, 52, 84],
  w: 640,
  h: 366,
  axes: AXES_COR,
  outline: [s2.o([0, 24], [14, 24], [26, 20], [36, 16], [42.5, 9], [43.5, 0], [42, -10], [35, -16], [31, -25], [18, -25.5], [10, -21], [4, -20.5], [0, -20.5])],
  ground: 'hemi-wm',
  regions: [{ id: 'hypo-grey', shapes: [s2.b([1.1, -6], [6, -6.5], [7.5, -11], [6.5, -15.5], [1.1, -15.5]), s2.b([-1.1, -6], [-6, -6.5], [-7.5, -11], [-6.5, -15.5], [-1.1, -15.5])], label: { en: 'Preoptic area', uz: 'Preoptik soha' }, at: s2.pt(-4.5, -12) }],
  items: [
    { id: 'cca', at: s2.pt(-12, 20.2), shapes: [s2.b([0, 22], [10, 22], [18, 20], [18, 17.5], [10, 19], [0, 19], [-10, 19], [-18, 17.5], [-18, 20], [-10, 22])] },
    { id: 'sp', at: s2.pt(0, 13), shapes: [s2.b([0.7, 18.6], [0.7, 7], [-0.7, 7], [-0.7, 18.6])] },
    { id: 'lv', mirror: true, at: s2.pt(5, 16.3), shapes: [s2.b([1.3, 18.5], [8.5, 18.5], [9.5, 16], [5, 13.5], [1.3, 13.2])] },
    { id: 'fx', mirror: true, shapes: [s2.e(2.3, 3.6, 1.3, 2.4)], note: { en: 'columns', uz: 'ustunlari' } },
    { id: 'bnst', mirror: true, shapes: [s2.e(5.2, -0.6, 2, 1.5)] },
    { id: 'ac', at: s2.pt(-9, -5.6), shapes: [s2.l(5, [-26, -12], [-18, -9.5], [-10, -6], [0, -4.2], [10, -6], [18, -9.5], [26, -12])] },
    { id: 'v3', at: s2.pt(0, -9), shapes: [s2.b([1, -6], [1, -13.5], [-1, -13.5], [-1, -6])] },
    { id: 'och', at: s2.pt(0, -17.6), shapes: [s2.e(0, -17.6, 7, 1.7)] },
    { id: 'cau-head', mirror: true, at: s2.pt(11.3, 9), shapes: [s2.b([9, 17], [13, 15.5], [15.2, 10], [15, 4], [12.5, 0], [9, 1.5], [8, 6.5], [8, 12])] },
    { id: 'ic3', mirror: true, at: s2.pt(17.5, 14.5), shapes: [s2.b([11.4, 17.4], [13.8, 16.4], [15.8, 12.4], [16, 7], [14.7, 2], [13, -1.5], [15.2, -3.2], [16.4, 0], [18, 5], [19.8, 10], [21.2, 14], [20.6, 16.4], [16.4, 17.2])], note: { en: 'at the genu (anterior limb above it)', uz: "tizzasi (ustida oldingi oyog'i)" } },
    { id: 'gpe', mirror: true, at: s2.pt(21, -1), shapes: [s2.b([20.5, 9], [23, 7], [24, 2], [23.5, -4], [21, -8], [17.5, -8.5], [16.2, -5], [17.2, 0], [18.8, 5])] },
    { id: 'lml', mirror: true, at: s2.pt(23.8, 6), shapes: [s2.l(2, [22, 10.5], [24, 4.5], [24.2, -3], [22.4, -8.6])] },
    { id: 'put', mirror: true, at: s2.pt(28, 1), shapes: [s2.b([24.5, 13], [28, 14], [31, 10], [32.5, 2], [31.5, -7], [28, -11], [24, -11.5], [22.6, -8.5], [24.8, -3], [24.9, 3], [23.6, 8.5])] },
    { id: 'vp', mirror: true, at: s2.pt(11.5, -10.5), shapes: [s2.b([8, -8], [12, -7.5], [15.5, -10], [14.5, -13], [10, -13.5], [7, -11.5])] },
    { id: 'nbm', mirror: true, at: s2.pt(20.5, -13.8), shapes: [s2.b([16, -11.8], [21, -12], [25, -13.6], [23, -15.8], [18, -15.5], [15, -14])] },
    { id: 'amy', mirror: true, shapes: [s2.e(24, -20.4, 6, 3.6, 10)], note: { en: 'anterior pole', uz: 'oldingi qutbi' } },
    ...lateralWall(s2, 32.5, 14, -12),
  ],
  landmarks: {
    en: 'The anterior commissure crosses the midline just behind the fornix columns and sweeps laterally beneath the lentiform nucleus toward the temporal lobes — it is the zero point of MNI and AC–PC stereotactic space. The external pallidal segment (GPe) appears medial to the putamen, separated by the lateral medullary lamina; together they form the lentiform ("lens-shaped") nucleus. Beneath the commissure lie the ventral pallidum and, further lateral, the large cholinergic cells of the nucleus basalis of Meynert in the sublenticular substantia innominata. The bed nucleus of the stria terminalis caps the commissure; the preoptic hypothalamus flanks the 3rd ventricle above the optic chiasm. The amygdala\'s anterior pole appears in the temporal lobe.',
    uz: "Oldingi komissura fornix ustunlarining ortidan o'rta chiziqni kesib o'tadi va yasmiqsimon yadro ostidan chakka bo'laklariga lateral tomon yoyiladi — u MNI va AC–PC stereotaktik fazosining nol nuqtasi. Putamendan medialda tashqi pallidal segment (GPe) paydo bo'ladi, ularni lateral medullyar plastinka ajratadi; ikkalasi birgalikda yasmiqsimon yadroni hosil qiladi. Komissura ostida ventral pallidum, undan lateralroqda sublentikulyar substantia innominatadagi Meynert bazal yadrosining yirik xolinergik hujayralari yotadi. Stria terminalis to'shak yadrosi komissura ustida; preoptik gipotalamus ko'rish kesishmasi ustida III qorinchaning ikki yonida. Chakka bo'lagida amigdalaning oldingi qutbi ko'rinadi.",
  },
  blood: {
    en: 'Medial lenticulostriate arteries (A1) and lateral lenticulostriate arteries (M1, 6–12 perforators entering the anterior perforated substance): lentiform nucleus, genu and adjacent capsule. Anterior choroidal artery: medial GP. Preoptic area and BNST: anterior communicating perforators.',
    uz: "Medial lentikulostriar arteriyalar (A1) va lateral lentikulostriar arteriyalar (M1, oldingi teshikli moddaga kiruvchi 6–12 ta perforant): yasmiqsimon yadro, tizza va unga yondosh kapsula. Oldingi xorioidal arteriya: GP'ning medial qismi. Preoptik soha va BNST: oldingi biriktiruvchi arteriya perforantlari.",
  },
  syndromes: [
    { name: { en: 'Hypertensive putaminal haemorrhage', uz: 'Gipertonik putamen qon quyilishi' }, text: { en: 'Commonest site of hypertensive ICH (~35 %) — rupture of lateral lenticulostriate microaneurysms (Charcot–Bouchard). Contralateral hemiparesis and hemisensory loss via the internal capsule, conjugate gaze deviation toward the lesion; aphasia (left) or neglect (right).', uz: "Gipertonik miya ichi qon quyilishining eng ko'p joyi (~35 %) — lateral lentikulostriar mikroanevrizmalar (Charcot–Bouchard) yorilishi. Ichki kapsula orqali qarama-qarshi gemiparez va gemigipesteziya, ko'zlar o'choq tomonga burilgan; afaziya (chap) yoki e'tiborsizlik (o'ng)." } },
    { name: { en: 'Alzheimer disease — cholinergic basal forebrain', uz: 'Altsgeymer kasalligi — xolinergik bazal old miya' }, text: { en: 'Loss of Ch4 neurons (nucleus basalis) is early and correlates with cortical acetylcholine deficit; MRI volumetry of the basal forebrain predicts progression from MCI. Basis of cholinesterase inhibitors.', uz: "Ch4 neyronlari (bazal yadro) erta yo'qoladi va po'stloq atsetilxolin tanqisligi bilan mos keladi; bazal old miyaning MRT volumetriyasi yengil kognitiv buzilishdan rivojlanishni bashorat qiladi. Xolinesteraza ingibitorlari asosi." } },
    { name: { en: 'Carbon-monoxide / hypoxic pallidal necrosis', uz: 'Is gazi / gipoksik pallidar nekroz' }, text: { en: 'The globus pallidus is selectively vulnerable (high iron, border-zone supply): bilateral pallidal T2 hyperintensity, delayed parkinsonism and apathy (delayed post-hypoxic leukoencephalopathy).', uz: "Rangpar shar tanlab zararlanadi (temir ko'p, chegara zonali qon ta'minoti): ikki tomonlama pallidar T2 giperintensivligi, kechikkan parkinsonizm va apatiya (kechikkan posthipoksik leykoensefalopatiya)." } },
  ],
  sources: [...SRC_BG, { title: 'Wikipedia — Anterior commissure', url: 'https://en.wikipedia.org/wiki/Anterior_commissure' }, { title: 'Wikipedia — Nucleus basalis', url: 'https://en.wikipedia.org/wiki/Nucleus_basalis' }],
}

// ── B3 · y −6: GPe + GPi, ansa lenticularis, anterior thalamus ────────
const s3 = kit({ k: 7, top: 24, y0: 14 })
const B3: Section = {
  id: 'bg-pallidal',
  code: 'B3',
  region: 'basal-ganglia',
  title: { en: 'Pallidal level — GPe, GPi, ansa lenticularis (y −6)', uz: 'Pallidar daraja — GPe, GPi, ansa lenticularis (y −6)' },
  orientation: CORONAL,
  plane: coronal(-6),
  contour: BG_MESH,
  pin: { side: 'top', off: 16 },
  loc: [63, 16, 63, 84],
  w: 640,
  h: 366,
  axes: AXES_COR,
  outline: [s3.o([0, 24], [14, 24], [26, 20], [36, 16], [43, 9], [44, 0], [42.5, -10], [36, -18], [32, -26], [18, -26], [11, -18], [6, -16], [0, -16])],
  ground: 'hemi-wm',
  regions: [
    { id: 'thal', shapes: [s3.b([1.2, 12], [7, 13], [12, 11], [14.5, 6], [13, 0], [8, -3], [1.2, -2]), s3.b([-1.2, 12], [-7, 13], [-12, 11], [-14.5, 6], [-13, 0], [-8, -3], [-1.2, -2])], label: { en: 'Thalamus (anterior)', uz: 'Talamus (oldingi qismi)' }, at: s3.pt(-7.5, 5) },
    { id: 'hypo-grey', shapes: [s3.b([1.1, -4], [7, -4.5], [8.5, -10], [6.5, -15], [1.1, -14.5]), s3.b([-1.1, -4], [-7, -4.5], [-8.5, -10], [-6.5, -15], [-1.1, -14.5])], label: { en: 'Hypothalamus', uz: 'Gipotalamus' }, at: s3.pt(-4.6, -11.5) },
  ],
  items: [
    { id: 'cca', at: s3.pt(-12, 20.2), shapes: [s3.b([0, 22], [10, 22], [18, 20], [18, 17.5], [10, 19], [0, 19], [-10, 19], [-18, 17.5], [-18, 20], [-10, 22])] },
    { id: 'lv', mirror: true, at: s3.pt(6, 16.2), shapes: [s3.b([2, 18.5], [10, 18.5], [12, 16], [8, 14.2], [3, 14]), s3.b([25.8, -12.6], [29.6, -12], [31, -13.9], [27.4, -15.2])], note: { en: 'body and temporal horn', uz: 'tanasi va chakka shoxi' } },
    { id: 'fx', mirror: true, at: s3.pt(2.6, 12.2), shapes: [s3.e(2.6, 12.4, 1.9, 1.1), s3.e(4, -7.5, 1.1, 1.1)], note: { en: 'body; postcommissural column in the hypothalamus', uz: 'tanasi; gipotalamusdagi komissuradan keyingi ustuni' } },
    { id: 'cau', mirror: true, at: s3.pt(14, 12.5), shapes: [s3.b([12, 15.5], [15, 14.2], [16.6, 11], [14.5, 9.4], [11.4, 12])] },
    { id: 'stt', mirror: true, shapes: [s3.e(11.4, 9.6, 1.1, 0.8)] },
    { id: 'th-an', mirror: true, shapes: [s3.e(5, 9.6, 3, 2)] },
    { id: 'th-va', mirror: true, shapes: [s3.b([9, 8], [12.6, 6], [13, 1.4], [10, -0.8], [7.6, 2.2])] },
    { id: 'mtt', mirror: true, shapes: [s3.e(4.4, 3.4, 1.1, 1.1)] },
    { id: 'th-ret', mirror: true, at: s3.pt(13.9, 3), shapes: [s3.l(2.6, [12, 11.6], [14.8, 6], [14.2, 0], [9.6, -3.2])] },
    { id: 'v3', at: s3.pt(0, 3), shapes: [s3.b([0.9, 11], [0.9, -12], [-0.9, -12], [-0.9, 11])] },
    { id: 'ic-pl', mirror: true, at: s3.pt(17.6, 12), shapes: [s3.b([16, 17.5], [15.6, 10], [13.6, 3], [10.6, -4], [8.4, -8], [11.8, -8.6], [14.7, -3], [17.6, 4], [19.6, 10], [20.2, 17.5])], note: { en: 'posterior limb, anterior part', uz: "orqa oyog'i, oldingi qismi" } },
    { id: 'gpe', mirror: true, at: s3.pt(22.6, -1.5), shapes: [s3.b([20, 7.4], [23, 6], [25, 1], [24.5, -5], [21.5, -8.5], [18.6, -7.6], [20.8, -3.8], [21.2, 1], [20.4, 5.6])] },
    { id: 'gpi', mirror: true, at: s3.pt(17.8, -1.4), shapes: [s3.b([18.4, 4.6], [20, 1], [19.6, -3.6], [17.2, -6.2], [15.4, -3.6], [16.8, 1])] },
    { id: 'mml', mirror: true, at: s3.pt(20.2, 4), shapes: [s3.l(1.8, [19.6, 5.8], [20.6, 1], [20.2, -4.4], [18.2, -7.2])] },
    { id: 'lml', mirror: true, at: s3.pt(25.1, 6), shapes: [s3.l(2, [23.6, 8.6], [25.8, 2], [25.4, -5.6], [22, -9.6])] },
    { id: 'put', mirror: true, at: s3.pt(29.2, 1), shapes: [s3.b([26.5, 12], [30, 12.5], [32.5, 8], [33, 0], [31.5, -7], [27.5, -9.5], [23.6, -10], [25.4, -6], [26.4, 0], [25.9, 6])] },
    { id: 'lf', mirror: true, at: s3.pt(12.5, -1.6), shapes: [s3.l(2.4, [15.8, -0.4], [13, -1.4], [10, -2.6], [7.6, -3.4])], note: { en: 'crossing the capsule (H2)', uz: 'kapsulani kesib o\'tishi (H2)' } },
    { id: 'ansa', mirror: true, at: s3.pt(12, -11.4), shapes: [s3.l(3, [18.8, -7], [15.4, -10.2], [11, -11.2], [7.6, -10], [6, -7.6])] },
    { id: 'nbm', mirror: true, at: s3.pt(22, -13), shapes: [s3.b([17, -11.2], [22, -11.2], [26.5, -12.6], [25, -14.6], [19, -14.4], [15.6, -13])] },
    { id: 'ot', mirror: true, shapes: [s3.e(14.4, -15.6, 2.6, 1.3, -20)] },
    { id: 'amy', mirror: true, shapes: [s3.e(24.5, -20, 6, 4.2, 10)] },
    { id: 'cau-tail', mirror: true, shapes: [s3.e(28.2, -10.9, 1.5, 0.7, -10)] },
    ...lateralWall(s3, 33, 13, -10),
  ],
  landmarks: {
    en: 'Both pallidal segments are now present: GPe lateral, GPi medial, separated by the medial medullary lamina, with the putamen lateral to them across the lateral medullary lamina. Medial to the lentiform nucleus the posterior limb of the internal capsule descends obliquely toward the cerebral peduncle; on its other side the anterior thalamus (anterior nucleus with the mammillothalamic tract entering it, VA) wrapped by the reticular nucleus. GPi output leaves by two routes: the lenticular fasciculus pierces the capsule (dorsal), the ansa lenticularis loops around its ventral edge — both head for Forel field H (plate B4). Beneath: sublenticular nucleus basalis, optic tract, amygdala with the caudate tail and temporal horn above it.',
    uz: "Endi ikkala pallidar segment ham bor: GPe lateralda, GPi medialda, ularni medial medullyar plastinka ajratadi; ulardan lateralda — lateral medullyar plastinka ortida — putamen. Yasmiqsimon yadrodan medialda ichki kapsulaning orqa oyog'i miya oyoqchasi tomon qiyshiq tushadi; uning narigi tomonida oldingi talamus (unga mamillotalamik trakt kiruvchi oldingi yadro, VA), uni to'rsimon yadro o'raydi. GPi chiqishi ikki yo'l bilan ketadi: yasmiqsimon tutam kapsulani teshib o'tadi (dorsal), ansa lenticularis uning pastki chetini aylanib o'tadi — ikkalasi Forel H maydoniga (B4 plastinkasi) boradi. Pastda: sublentikulyar bazal yadro, ko'rish trakti, amigdala, uning ustida kaudat dumi va chakka shoxi.",
  },
  blood: {
    en: 'Lateral lenticulostriate arteries (M1): putamen, GPe, dorsal capsule. Anterior choroidal artery (ICA): GPi, inferior posterior limb, optic tract, amygdala/hippocampal head. Tuberothalamic (polar) artery from PCom: anterior thalamic nuclei and VA.',
    uz: "Lateral lentikulostriar arteriyalar (M1): putamen, GPe, kapsulaning dorsal qismi. Oldingi xorioidal arteriya (ICA): GPi, orqa oyoqning pastki qismi, ko'rish trakti, amigdala/gippokamp boshi. PCom'dan tuberotalamik (qutb) arteriya: oldingi talamus yadrolari va VA.",
  },
  syndromes: [
    { name: { en: 'Pallidal DBS / pallidotomy', uz: 'Pallidar DBS / pallidotomiya' }, text: { en: 'Target: posteroventral GPi, AC–PC ≈ 19–22 mm lateral, 2–3 mm anterior to the mid-commissural point, 4–6 mm below the AC–PC plane, ~3–4 mm lateral to the internal capsule and just above the optic tract. Microelectrode recording: irregular pausing GPe cells → border cells of the medial medullary lamina → tonic 60–100 Hz GPi cells with movement-related responses. Capsular contractions = too medial/posterior; phosphenes = too deep (optic tract).', uz: "Nishon: posteroventral GPi, AC–PC ≈ 19–22 mm lateral, o'rta komissural nuqtadan 2–3 mm oldinda, AC–PC tekisligidan 4–6 mm pastda, ichki kapsuladan ~3–4 mm lateralda va ko'rish trakti ustida. Mikroelektrod yozuvi: noto'g'ri pauzali GPe hujayralari → medial medullyar plastinkaning chegara hujayralari → harakatga javob beruvchi tonik 60–100 Gs GPi hujayralari. Kapsula qisqarishi = juda medial/orqada; fosfenlar = juda chuqur (ko'rish trakti)." } },
    { name: { en: 'Anterior choroidal artery syndrome', uz: 'Oldingi xorioidal arteriya sindromi' }, text: { en: 'Hemiparesis (inferior posterior limb), hemisensory loss and homonymous hemianopia (optic tract / LGN) — the triad, often with preserved cognition.', uz: "Gemiparez (orqa oyoqning pastki qismi), gemigipesteziya va gomonim gemianopiya (ko'rish trakti / LGN) — triada, ko'pincha kognitiv funksiya saqlangan." } },
    { name: { en: 'Kernicterus and pallidal vulnerability', uz: 'Yadro sariqligi va pallidum zaifligi' }, text: { en: 'Unconjugated bilirubin stains the GP, STN and hippocampus in neonates → choreoathetoid cerebral palsy, gaze palsy, hearing loss. Symmetric GP T1 hyperintensity also in manganese toxicity (liver failure, TPN).', uz: "Bog'lanmagan bilirubin chaqaloqlarda GP, STN va gippokampni bo'yaydi → xoreoatetoid serebral falaj, nigoh falaji, karlik. Simmetrik GP T1 giperintensivligi marganets zaharlanishida ham (jigar yetishmovchiligi, parenteral oziqlanish)." } },
  ],
  sources: [...SRC_BG, ...SRC_IC],
}

// ── B4 · y −13: subthalamic level, fields of Forel (DBS level) ────────
const s4 = kit({ k: 7, top: 24, y0: 14 })
const B4: Section = {
  id: 'bg-subthalamic',
  code: 'B4',
  region: 'basal-ganglia',
  title: { en: 'Subthalamic level — STN, zona incerta, fields of Forel H/H1/H2 (y −13)', uz: 'Subtalamik daraja — STN, zona incerta, Forel H/H1/H2 maydonlari (y −13)' },
  orientation: CORONAL,
  plane: coronal(-13),
  contour: BG_MESH,
  pin: { side: 'top', off: 24 },
  loc: [75, 16, 75, 84],
  w: 640,
  h: 366,
  axes: AXES_COR,
  outline: [s4.o([0, 24], [14, 24], [26, 20], [36, 15], [42.5, 8], [43.5, 0], [42, -9], [36, -16], [30, -18], [24, -20], [20, -24], [14, -26], [8, -23], [4, -17], [0, -16])],
  ground: 'hemi-wm',
  regions: [
    { id: 'thal', shapes: [s4.b([1.2, 14], [8, 15], [15, 13], [19, 8], [18.5, 0], [14, -4], [6, -5], [1.2, -3]), s4.b([-1.2, 14], [-8, 15], [-15, 13], [-19, 8], [-18.5, 0], [-14, -4], [-6, -5], [-1.2, -3])], label: { en: 'Thalamus', uz: 'Talamus' }, at: s4.pt(-13, 12) },
    { id: 'hypo-grey', shapes: [s4.b([1.1, -6.5], [6, -7], [7.5, -11], [5.5, -14.5], [1.1, -14]), s4.b([-1.1, -6.5], [-6, -7], [-7.5, -11], [-5.5, -14.5], [-1.1, -14])], label: { en: 'Posterior hypothalamus', uz: 'Orqa gipotalamus' }, at: s4.pt(-4.4, -8.4) },
  ],
  items: [
    { id: 'cca', at: s4.pt(-12, 20.2), shapes: [s4.b([0, 22], [10, 22], [18, 20], [18, 17.5], [10, 19], [0, 19], [-10, 19], [-18, 17.5], [-18, 20], [-10, 22])] },
    { id: 'lv', mirror: true, at: s4.pt(7, 16.6), shapes: [s4.b([2, 18.6], [11, 18.6], [13, 16.4], [8, 15.4], [3, 15.4]), s4.b([25.6, -14], [29.4, -13.4], [30.8, -15.2], [27.2, -16.4])], note: { en: 'body and temporal horn', uz: 'tanasi va chakka shoxi' } },
    { id: 'fx', mirror: true, at: s4.pt(2.8, 14.1), shapes: [s4.e(2.8, 14.1, 1.7, 0.9)], note: { en: 'body', uz: 'tanasi' } },
    { id: 'cau', mirror: true, at: s4.pt(15.6, 14.8), shapes: [s4.b([13.4, 17], [17, 15.6], [18.4, 13], [16, 12.6], [13, 15])] },
    { id: 'th-md', mirror: true, at: s4.pt(4.6, 6), shapes: [s4.b([1.6, 11], [6, 12], [8.4, 7], [7, 1], [3, -1], [1.6, 2])] },
    { id: 'th-iml', mirror: true, at: s4.pt(9.3, 8), shapes: [s4.l(2, [9, 12.6], [9.5, 6], [8.6, 1], [6.2, -2])] },
    { id: 'th-vl', mirror: true, at: s4.pt(14.2, 6), shapes: [s4.b([11, 12], [16, 10.6], [18, 6], [16.6, 1], [12.6, 0], [10.6, 5])], note: { en: 'VLa (pallidal) / VLp–Vim (cerebellar)', uz: 'VLa (pallidar) / VLp–Vim (miyacha)' } },
    { id: 'th-ret', mirror: true, at: s4.pt(18.9, 3), shapes: [s4.l(2.4, [16, 13], [19.4, 7], [18.8, 0], [15, -4])] },
    { id: 'v3', at: s4.pt(0, 4), shapes: [s4.b([0.9, 12], [0.9, -10], [-0.9, -10], [-0.9, 12])] },
    { id: 'mtt', mirror: true, shapes: [s4.e(3.4, -4.6, 1, 1)] },
    { id: 'mb', mirror: true, shapes: [s4.e(3, -12.6, 2.2, 2)] },
    { id: 'ic-pl', mirror: true, at: s4.pt(21.2, 10), shapes: [s4.b([19.4, 15], [19.6, 8], [18.2, 0], [16, -6], [15.8, -10.6], [18.4, -11], [19.6, -6], [21.4, 1], [23, 8], [23, 15])] },
    { id: 'gpe', mirror: true, at: s4.pt(25.2, -1.6), shapes: [s4.b([22.6, 5], [25.6, 3.6], [27, -1], [25.6, -6], [22.6, -7.6], [21.4, -5], [23.6, -2], [23.4, 2])] },
    { id: 'gpi', mirror: true, at: s4.pt(21.8, -2.4), shapes: [s4.b([21.6, 2], [23.2, -1], [22.8, -5], [21, -6.4], [19.8, -4], [20.8, -1])], note: { en: 'caudal pole', uz: 'kaudal qutbi' } },
    { id: 'put', mirror: true, at: s4.pt(29.6, 1), shapes: [s4.b([27, 9], [30, 9], [32, 4], [31.6, -4], [28.6, -7], [26, -7.2], [27.6, -2], [27.6, 4])] },
    { id: 'tf', mirror: true, at: s4.pt(11.8, -3.2), shapes: [s4.l(2.4, [5.6, -6.2], [7.2, -4], [11, -3.4], [14, -1.4])] },
    { id: 'zi', mirror: true, at: s4.pt(11.4, -5.6), shapes: [s4.l(3.6, [14.6, -5.4], [11, -5.8], [7.6, -5.6])] },
    { id: 'lf', mirror: true, at: s4.pt(14.5, -7.6), shapes: [s4.l(2.4, [17.6, -6.8], [14, -7.4], [10, -7.6], [6.6, -7.2])] },
    { id: 'forel-h', mirror: true, shapes: [s4.e(6.2, -7.8, 1.4, 1.2)] },
    { id: 'stn', mirror: true, shapes: [s4.e(11.2, -9.8, 3.7, 1.5, 15)] },
    { id: 'snc', mirror: true, at: s4.pt(9.4, -12.9), shapes: [s4.b([7.4, -12.4], [11, -12.1], [14.6, -12.6], [14.4, -13.4], [11, -13.2], [7.4, -13.4])] },
    { id: 'snr', mirror: true, at: s4.pt(13, -15.4), shapes: [s4.b([9.6, -13.8], [14, -13.6], [17, -15], [15, -17.6], [10.4, -17])] },
    { id: 'crus', mirror: true, at: s4.pt(17.4, -19.2), shapes: [s4.b([15.4, -11.4], [19.4, -12], [22, -15], [20.5, -20], [15, -23.5], [10.5, -22.5], [9, -19.5], [13, -18.6], [16.6, -16.2], [16.4, -13])] },
    { id: 'ot', mirror: true, shapes: [s4.e(23.6, -19, 2.2, 1.1, -60)] },
    { id: 'cau-tail', mirror: true, shapes: [s4.e(27.8, -12.5, 1.5, 0.7, -10)] },
    ...lateralWall(s4, 32, 10, -7),
  ],
  landmarks: {
    en: 'The DBS level. Beneath the thalamus, between the 3rd ventricle and the internal capsule, the subthalamus is stacked like a sandwich from dorsal to ventral: thalamic fasciculus (H1) → zona incerta → lenticular fasciculus (H2) → subthalamic nucleus (STN), lying on the dorsomedial surface of the cerebral peduncle; the substantia nigra (compacta band above reticulata) lies beneath the STN. Medially the fibres converge in the prerubral field H. The motor thalamus (VLa receiving pallidal, VLp/Vim receiving cerebellar input) sits directly above H1 — so basal-ganglia and cerebellar outflow meet here. Mammillary bodies and posterior hypothalamus flank the floor of the 3rd ventricle; the caudal tip of GPi still lies lateral to the capsule.',
    uz: "DBS darajasi. Talamus ostida, III qorincha va ichki kapsula orasida subtalamus dorsaldan ventralga 'sendvich' kabi taxlangan: talamik tutam (H1) → zona incerta → yasmiqsimon tutam (H2) → subtalamik yadro (STN), u miya oyoqchasining dorsomedial yuzasida yotadi; STN ostida qora modda (zich qismi to'rsimon qism ustida). Medialda tolalar prerubral H maydonida yig'iladi. Harakat talamusi (pallidar kirishli VLa, miyacha kirishli VLp/Vim) to'g'ridan-to'g'ri H1 ustida — bazal yadrolar va miyacha chiqishlari shu yerda uchrashadi. III qorincha tubining ikki yonida so'rg'ichsimon tanalar va orqa gipotalamus; GPi'ning kaudal uchi hali kapsuladan lateralda.",
  },
  blood: {
    en: 'Thalamoperforating (paramedian) arteries from P1: STN, ZI, fields of Forel, medial thalamus; posterior communicating perforators: anterior subthalamus; anterior choroidal: lateral peduncle/optic tract; inferolateral (thalamogeniculate, P2): VL/Vim.',
    uz: "P1 dan talamoperforant (paramedian) arteriyalar: STN, ZI, Forel maydonlari, medial talamus; orqa biriktiruvchi arteriya perforantlari: oldingi subtalamus; oldingi xorioidal: oyoqchaning lateral qismi / ko'rish trakti; inferolateral (talamogenikulyar, P2): VL/Vim.",
  },
  syndromes: [
    { name: { en: 'STN DBS for Parkinson disease', uz: 'Parkinson kasalligida STN DBS' }, text: { en: 'Target: dorsolateral (sensorimotor) STN, AC–PC ≈ 11–13 mm lateral, 2–4 mm posterior to the mid-commissural point, 4–6 mm below the AC–PC plane (≈ MNI ±12, −13, −5); on MRI 2 mm lateral to the anterior edge of the red nucleus. Microelectrode: quiet zona incerta → STN with dense 20–50 Hz irregular firing and beta oscillatory LFPs → quiet → SNr (regular ~70 Hz). Side effects map onto the neighbours: capsular contractions (lateral), diplopia/eye deviation (medial: III nerve fibres), paraesthesia (posterior: medial lemniscus), mood change (medial tip).', uz: "Nishon: dorsolateral (sensomotor) STN, AC–PC ≈ 11–13 mm lateral, o'rta komissural nuqtadan 2–4 mm orqada, AC–PC tekisligidan 4–6 mm pastda (≈ MNI ±12, −13, −5); MRTda qizil yadro oldingi chetidan 2 mm lateralda. Mikroelektrod: sokin zona incerta → zich 20–50 Gs noto'g'ri razryadli va beta tebranishli LFP'li STN → sokinlik → SNr (muntazam ~70 Gs). Nojo'ya ta'sirlar qo'shnilarga mos: kapsula qisqarishlari (lateral), diplopiya/ko'z og'ishi (medial: III nerv tolalari), paresteziya (orqa: medial lemnisk), kayfiyat o'zgarishi (medial uchi)." } },
    { name: { en: 'Hemiballismus', uz: 'Gemiballizm' }, text: { en: 'Small paramedian infarct (or non-ketotic hyperglycaemia — "diabetic striatopathy") of the contralateral STN: loss of excitatory drive to GPi → thalamus disinhibited → violent proximal flinging movements. Usually remits over weeks.', uz: "Qarama-qarshi STN ning kichik paramedian infarkti (yoki ketoatsidozsiz giperglikemiya — 'diabetik striatopatiya'): GPi'ning qo'zg'atuvchi kirishi yo'qoladi → talamus tormozdan chiqadi → proksimal qismlarning keskin otilib ketuvchi harakatlari. Odatda bir necha haftada kamayadi." } },
    { name: { en: 'Posterior subthalamic area / caudal ZI for tremor', uz: 'Orqa subtalamik soha / kaudal ZI tremorda' }, text: { en: 'DBS just posteromedial to the STN (caudal zona incerta, prelemniscal radiation, dentato-rubro-thalamic tract) suppresses essential and parkinsonian tremor; MR-guided focused ultrasound lesions of Vim or the pallidothalamic tract (Forel H) are incision-free alternatives.', uz: "STN dan biroz orqa-medialdagi DBS (kaudal zona incerta, prelemniskal radiatsiya, dentato-rubro-talamik trakt) essensial va parkinson tremorini bosadi; Vim yoki pallidotalamik trakt (Forel H) ning MRT nazoratidagi fokuslangan ultratovush lezioni — kesmasiz muqobil." } },
  ],
  sources: [...SRC_BG, ...SRC_IC, { title: 'Nambu, Tokuno & Takada 2002 — Functional significance of the cortico-subthalamo-pallidal "hyperdirect" pathway', url: 'https://doi.org/10.1016/S0168-0102(02)00027-5' }],
}

// ── B5 · axial z +4: internal capsule ────────────────────────────────
const s5 = kit({ k: 5.2, top: 36, y0: 14 })
const B5: Section = {
  id: 'bg-capsule-axial',
  code: 'B5',
  region: 'basal-ganglia',
  title: { en: 'Internal capsule — axial level of the foramen of Monro (z +4)', uz: "Ichki kapsula — Monro teshigi aksial darajasi (z +4)" },
  orientation: { en: 'Axial, viewed from below (radiological) · anterior up · to scale', uz: "Aksial, pastdan ko'rinish (radiologik) · old tomon yuqorida · masshtabda" },
  plane: { point: [0, 0, 4], normal: [0, 0, 1] },
  contour: BG_MESH,
  pin: { side: 'front' },
  loc: [14, 46, 128, 46],
  w: 640,
  h: 446,
  axes: AXES_AX,
  outline: [s5.o([0, 36], [14, 36], [24, 31], [34, 28], [43, 20], [44.5, 0], [43, -18], [36, -28], [30, -36], [22, -44], [10, -45], [0, -44])],
  ground: 'hemi-wm',
  regions: [{ id: 'thal', shapes: [s5.b([1.2, -3], [6, -1.5], [12, -2.5], [14.5, -5], [17, -9.5], [20, -16], [21, -23], [18, -29], [11, -31.5], [4, -30], [1.2, -26]), s5.b([-1.2, -3], [-6, -1.5], [-12, -2.5], [-14.5, -5], [-17, -9.5], [-20, -16], [-21, -23], [-18, -29], [-11, -31.5], [-4, -30], [-1.2, -26])], label: { en: 'Thalamus', uz: 'Talamus' }, at: s5.pt(-12, -27) }],
  items: [
    { id: 'cca', at: s5.pt(-9, 30.5), shapes: [s5.b([0, 33], [9, 32], [15, 27], [13, 24.5], [8, 28], [0, 29.5], [-8, 28], [-13, 24.5], [-15, 27], [-9, 32]), s5.b([0, -34], [10, -33], [16, -38], [10, -42], [0, -41], [-10, -42], [-16, -38], [-10, -33])], note: { en: 'genu and splenium', uz: 'tizzasi va qalinlashmasi (splenium)' } },
    { id: 'sp', at: s5.pt(0, 15), shapes: [s5.b([0.7, 26], [0.7, 4], [-0.7, 4], [-0.7, 26])] },
    { id: 'lv', mirror: true, at: s5.pt(3.6, 18), shapes: [s5.b([1.3, 26.5], [5.6, 27], [6.2, 22], [5.8, 14], [7.6, 6.5], [5, 4], [1.3, 4.2]), s5.b([17, -28], [21, -27], [24, -33], [21, -37], [16, -35], [15.5, -31.4])], note: { en: 'frontal horn and atrium', uz: "frontal shoxi va bo'lmasi (atrium)" } },
    { id: 'fx', mirror: true, shapes: [s5.e(2.6, 1.4, 1.5, 1.5)], note: { en: 'columns at the foramen of Monro', uz: 'Monro teshigidagi ustunlari' } },
    { id: 'cau-head', mirror: true, at: s5.pt(11, 14), shapes: [s5.b([6.5, 25], [11, 26], [16, 23.5], [17.4, 18], [15, 10], [13, 3], [9.5, 3.5], [6.8, 9], [6.2, 17])] },
    { id: 'ic-al', mirror: true, at: s5.pt(18.6, 14.5), shapes: [s5.b([13.6, 2], [15.8, 10], [18.2, 18], [20, 23.4], [23, 21.4], [21, 15], [19, 8.5], [17.5, 1.5])] },
    { id: 'ic-g', mirror: true, at: s5.pt(15.6, 0), shapes: [s5.b([13.2, 1.8], [17.5, 1.6], [18.4, -1.6], [14.4, -2.6])] },
    { id: 'ic-pl', mirror: true, at: s5.pt(17.6, -5.6), shapes: [s5.b([14.5, -2.6], [18.4, -1.8], [21, -8], [24, -15], [26.2, -21], [22.8, -22.6], [20.6, -16], [17.5, -9], [15, -4.6])] },
    { id: 'cst-ic', mirror: true, at: s5.pt(20.8, -12), shapes: [s5.l(2.6, [19, -8.4], [20.6, -12.2], [22, -15.6])], note: { en: 'arm anterior → leg posterior', uz: "qo'l oldinda → oyoq orqada" } },
    { id: 'tcr', mirror: true, at: s5.pt(24, -19.2), shapes: [s5.l(2.6, [22.6, -16.8], [23.8, -19], [24.8, -21.2])] },
    { id: 'ic-rl', mirror: true, at: s5.pt(27.8, -26), shapes: [s5.b([22.8, -22.6], [26.2, -21], [29.5, -24], [32, -29], [28.5, -30.5], [25, -27])] },
    { id: 'gpe', mirror: true, at: s5.pt(23, -2), shapes: [s5.b([20.8, 5], [22.4, 6], [24.5, 1], [24.5, -6], [22, -11], [20.8, -7.6], [21.6, -4], [21.8, 1])] },
    { id: 'gpi', mirror: true, at: s5.pt(19.9, -2.4), shapes: [s5.b([18.8, 1.8], [20.9, 2.2], [21.2, -4], [20.3, -7.2], [19.1, -3])], note: { en: 'dorsal tip', uz: 'dorsal uchi' } },
    { id: 'put', mirror: true, at: s5.pt(28, 2), shapes: [s5.b([23, 21], [27, 20], [30.5, 12], [31.5, 0], [30.5, -10], [27.5, -17], [25, -19], [23.4, -13], [25.2, -5], [25.2, 5], [23.6, 13])] },
    { id: 'th-an', mirror: true, shapes: [s5.e(5.6, -5, 3, 2.4)] },
    { id: 'th-md', mirror: true, at: s5.pt(4.6, -14), shapes: [s5.b([1.6, -8.4], [6, -8.4], [8, -14], [7, -20], [3, -21], [1.6, -16])] },
    { id: 'th-iml', mirror: true, at: s5.pt(9, -9), shapes: [s5.l(2, [9, -5], [8.8, -12], [8.4, -21])] },
    { id: 'th-vl', mirror: true, at: s5.pt(13.6, -10), shapes: [s5.b([11, -5.4], [15, -8], [17, -13], [13, -15], [10.6, -10])], note: { en: 'VA/VL', uz: 'VA/VL' } },
    { id: 'th-vpl', mirror: true, at: s5.pt(15.6, -19.4), shapes: [s5.b([12.6, -16], [18, -15.6], [19.6, -21], [15, -23], [11.6, -20])] },
    { id: 'th-pul', mirror: true, at: s5.pt(11, -27.4), shapes: [s5.b([6, -24], [13, -24], [16.4, -27], [14, -30.6], [6, -30])] },
    { id: 'th-ret', mirror: true, at: s5.pt(18.6, -12.6), shapes: [s5.l(2.2, [13.8, -3.6], [16.6, -9], [19.6, -16], [20.6, -23])] },
    { id: 'v3', at: s5.pt(0, -13), shapes: [s5.b([1, -2], [1, -24], [-1, -24], [-1, -2])] },
    { id: 'ec', mirror: true, shapes: [s5.l(4, [28.5, 21], [32, 12], [33, 0], [32, -10], [29, -18])] },
    { id: 'cl', mirror: true, shapes: [s5.b([30.5, 22], [32, 21], [34.8, 12], [35.6, 0], [34.6, -10], [31.5, -19], [30.5, -18.5], [33.5, -10], [34.3, 0], [33.4, 12])] },
    { id: 'xc', mirror: true, shapes: [s5.l(4, [33.5, 23], [36.5, 12], [37.3, 0], [36.3, -10], [33, -20])] },
    { id: 'ins', mirror: true, at: s5.pt(39.6, 0), shapes: [s5.b([35.5, 25], [38, 24], [40.5, 14], [41.5, 0], [40.5, -12], [36, -21], [34.5, -21], [38, -12], [39, 0], [38.2, 13])] },
  ],
  landmarks: {
    en: 'The classic ">" (boomerang) of the internal capsule, opening laterally: anterior limb between caudate head and lentiform nucleus, genu at the level of the interventricular foramen (fornix columns just medial), posterior limb between thalamus and lentiform nucleus, then the retrolenticular part behind the putamen. Somatotopy from front to back: frontopontine and thalamo-prefrontal fibres (anterior limb) → corticobulbar (genu) → corticospinal arm → trunk → leg (posterior half of the posterior limb) → thalamocortical somatosensory → optic radiation (retrolenticular). Lateral to the lentiform nucleus the "layer cake": external capsule, claustrum, extreme capsule, insula.',
    uz: "Ichki kapsulaning klassik '>' (bumerang) shakli, lateralga ochiq: oldingi oyoq kaudat boshi va yasmiqsimon yadro orasida, tizza qorinchalararo teshik darajasida (darhol medialda fornix ustunlari), orqa oyoq talamus va yasmiqsimon yadro orasida, so'ng putamen ortidagi retrolentikulyar qism. Oldindan orqaga somatotopiya: frontopontin va talamo-prefrontal tolalar (oldingi oyoq) → kortikobulbar (tizza) → kortikospinal qo'l → tana → oyoq (orqa oyoqning orqa yarmi) → talamokortikal sezgi → ko'rish radiatsiyasi (retrolentikulyar). Yasmiqsimon yadrodan lateralda 'qatlamli pirog': tashqi kapsula, klaustrum, eng tashqi kapsula, orolcha.",
  },
  blood: {
    en: 'Anterior limb: Heubner and medial lenticulostriate (ACA). Genu and dorsal posterior limb: lateral lenticulostriate (MCA). Ventral posterior limb and retrolenticular part: anterior choroidal artery. Thalamus: tuberothalamic (anterior), paramedian (medial), thalamogeniculate (VPL/VPM), posterior choroidal (pulvinar).',
    uz: "Oldingi oyoq: Heubner va medial lentikulostriar (OMA). Tizza va orqa oyoqning dorsal qismi: lateral lentikulostriar (O'MA). Orqa oyoqning ventral qismi va retrolentikulyar qism: oldingi xorioidal arteriya. Talamus: tuberotalamik (oldingi), paramedian (medial), talamogenikulyar (VPL/VPM), orqa xorioidal (pulvinar).",
  },
  syndromes: [
    { name: { en: 'Pure motor lacunar stroke', uz: 'Sof harakat lakunar insulti' }, text: { en: 'Lacune (< 15 mm) of the posterior limb: equal face–arm–leg hemiparesis without sensory, visual or cognitive signs — the commonest lacunar syndrome (Fisher). Capsular warning syndrome: stuttering, recurrent episodes before infarction.', uz: "Orqa oyoqdagi lakuna (< 15 mm): sezgi, ko'rish yoki kognitiv belgilarsiz yuz–qo'l–oyoqning teng gemiparezi — eng ko'p lakunar sindrom (Fisher). Kapsula ogohlantirish sindromi: infarktdan oldin takrorlanuvchi epizodlar." } },
    { name: { en: 'Ataxic hemiparesis / dysarthria–clumsy hand', uz: "Ataktik gemiparez / dizartriya–qo'l noaniqligi" }, text: { en: 'Lacunes of the genu/anterior limb or basis pontis interrupt corticopontocerebellar fibres together with the pyramidal tract.', uz: "Tizza/oldingi oyoq yoki ko'prik asosidagi lakunalar kortikopontoserebellyar tolalarni piramida yo'li bilan birga uzadi." } },
    { name: { en: 'Wallerian degeneration and DTI', uz: 'Valler degeneratsiyasi va DTI' }, text: { en: 'After cortical or capsular stroke, fractional anisotropy of the posterior limb falls along the corticospinal tract; posterior-limb FA asymmetry at 1–2 weeks predicts motor recovery (used in rehabilitation research, e.g. PREP2 algorithm with MEPs).', uz: "Po'stloq yoki kapsula insultidan keyin kortikospinal yo'l bo'ylab orqa oyoqning fraksion anizotropiyasi pasayadi; 1–2 haftadagi orqa oyoq FA asimmetriyasi harakat tiklanishini bashorat qiladi (reabilitatsiya tadqiqotlarida, masalan MEP bilan PREP2 algoritmi)." } },
  ],
  sources: [...SRC_IC, { title: 'StatPearls — Neuroanatomy, Internal Capsule', url: 'https://www.ncbi.nlm.nih.gov/books/NBK542181/' }],
}

export const BASAL: Section[] = [B1, B2, B3, B4, B5]
