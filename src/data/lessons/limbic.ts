import type { Lesson } from './types'

const HIP = '#ff9d4d'
const FX = '#ffe066'
const MB = '#ff6fae'
const MTT = '#c084fc'
const AV = '#e0a35a'
const CING = '#57d163'
const PHG = '#22c1c3'
const LV = '#4fa3ff'
const CAU = '#c9975b'
const ST = '#b8d33a'

const LEFT_HEMI = [{ ref: '@telencephalon', side: 'left' as const }]

/** Papez circuit through the left hemisphere, MNI mm (gross meshes + Julich AV). */
const PAPEZ: [number, number, number][] = [
  [-31, -20, -20], [-24, -37, -3], [-21, -38, 1.5], [-12, -26, 10], [-2, -13, 14], [-3, -4, 10], [-3, 4, 1], [-3, -2, -9], [-2.5, -7, -17], [-5, -9, -12], [-5.5, -10.5, -7],
  [-6, -10, 4], [-6.2, -10.3, 14.7], [-6.5, -8, 30], [-7, -22, 36], [-8, -36, 37], [-6, -50, 30], [-15, -63, 15], [-17, -55, -5], [-19, -40, -10], [-23, -15, -31], [-28, -10, -24],
]

export const LIMBIC: Lesson = {
  id: 'limbic',
  title: { en: 'Hippocampus, fornix and the memory circuit', uz: 'Gippokamp, fornix va xotira halqasi' },
  blurb: { en: 'The seahorse, its arching output cable, why everything here is C-shaped, the Papez circuit and the trisynaptic loop.', uz: "Dengiz oti, uning ravoqsimon chiqish kabeli, nega bu yerda hammasi C shaklida, Papez halqasi va trisinaptik zanjir." },
  steps: [
    {
      title: { en: 'The hippocampus — a seahorse in the temporal lobe', uz: "Gippokamp — chakka bo'lagidagi dengiz oti" },
      text: {
        en: 'The hippocampus is a curved fold of grey matter inside the temporal lobe, forming the floor of the temporal horn of the lateral ventricle. Its name is Greek for "seahorse" (Arantius, 1587) — the shape it shows in section. It has a head (in front, behind the amygdala), a body, and a tail that rises backwards under the splenium.',
        uz: "Gippokamp — chakka bo'lagi ichidagi egilgan kulrang modda burmasi; u yon qorincha chakka shoxining tubini hosil qiladi. Nomi yunoncha 'dengiz oti' (Arantius, 1587) — kesimda shunday ko'rinadi. Boshi (oldinda, amigdala ortida), tanasi va orqada splenium ostiga ko'tariladigan dumi bor.",
      },
      memo: { en: 'A seahorse swimming in the "water" of the ventricle — on the floor of the temporal horn.', uz: "Dengiz oti qorinchaning 'suvi'da suzadi — chakka shoxining tubida." },
      deep: {
        en: 'The hippocampus is three-layered archicortex (neocortex has six). Its head carries digitations (pes hippocampi) that disappear in mesial temporal sclerosis on MRI. Volume ≈ 3–3.5 cm³ per side; it shrinks by 3–5 % a year in Alzheimer disease versus ≈ 1 % in normal ageing.',
        uz: "Gippokamp — 3 qavatli arxikorteks (neokorteks 6 qavatli). Boshida 'barmoqchalar' (pes hippocampi) bor — MRTda medial chakka sklerozida ular yo'qoladi. Hajmi har tomonda ≈ 3–3.5 sm³; Altsgeymer kasalligida yiliga 3–5 % kamayadi, normal qarishda ≈ 1 %.",
      },
      show: [
        { concept: 'hippocampus-proper', color: HIP },
        { concept: 'lateral-ventricle', color: LV },
        { concept: 'amygdala', color: '#b8a3ff' },
      ],
      context: [{ ref: '@telencephalon' }],
      labels: [
        { text: { en: 'Head', uz: 'Boshi' }, at: [-27, -8, -26], color: HIP },
        { text: { en: 'Body', uz: 'Tanasi' }, at: [-33, -22, -20], color: HIP },
        { text: { en: 'Tail', uz: 'Dumi' }, at: [-24, -37, -3], color: HIP },
        { text: { en: 'Amygdala', uz: 'Amigdala' }, at: [-28, 0, -20], color: '#b8a3ff' },
      ],
      view: [-1, 0.15, 0.1],
    },
    {
      title: { en: 'The fornix — the hippocampus’s output cable', uz: 'Fornix — gippokampning chiqish kabeli' },
      text: {
        en: 'Hippocampal axons gather on its surface as a white fringe — the fimbria. The fimbria runs back and, behind the thalamus, bends up as the crus of the fornix. The two crura converge under the corpus callosum into the body; in front the body splits again into two columns that plunge down to the mammillary bodies.',
        uz: "Gippokamp aksonlari uning yuzasida oq hoshiya — fimbriyaga yig'iladi. Fimbriya orqaga yo'naladi va talamus ortida yuqoriga bukiladi — bu fornixning oyog'i (crus). Ikki oyoq qadoqsimon tana ostida yaqinlashib tanani hosil qiladi; oldinda tana yana ikki ustunga ajraladi va ular pastga — so'rg'ichsimon tanalarga tushadi.",
      },
      memo: {
        en: 'Fornix is Latin for "arch": fimbria → crus → body → column. It follows the same C as the ventricle: back – up – forward – down.',
        uz: "Fornix lotincha 'ravoq': fimbriya → oyoq → tana → ustun. U ham qorinchaning C yo'lini takrorlaydi: orqaga – yuqoriga – oldinga – pastga.",
      },
      deep: {
        en: 'About 1.2 million axons per side, mostly from the subiculum. Postcommissural columns → mammillary bodies; precommissural fibres → septal nuclei and nucleus accumbens. Bilateral fornix injury (e.g. third-ventricle tumour surgery) → severe anterograde amnesia. Fornix DBS (ADvance trial) has been tried to drive the memory network in early Alzheimer disease.',
        uz: "Har tomonda ~1.2 million akson, asosan subikulumdan. Komissuradan keyingi ustunlar → so'rg'ichsimon tanalar; komissuradan oldingi tolalar → septal yadrolar va accumbens. Ikki tomonlama fornix shikasti (masalan III qorincha o'smasi operatsiyasida) → og'ir anterograd amneziya. Erta Altsgeymerda xotira tarmog'ini kuchaytirish uchun fornix DBS (ADvance sinovi) sinab ko'rilgan.",
      },
      show: [
        { concept: 'hippocampus-proper', side: 'left', color: HIP },
        { concept: 'fornix-of-forebrain', side: 'left', color: FX },
        { concept: 'commissure-of-fornix-of-forebrain', color: FX },
        { concept: 'mammillary-body', color: MB },
      ],
      context: [...LEFT_HEMI, { ref: 'thalamus', side: 'left' }],
      labels: [
        { text: { en: 'Fimbria', uz: 'Fimbriya' }, at: [-31, -24, -14], color: FX },
        { text: { en: 'Crus', uz: "Oyog'i (crus)" }, at: [-21, -38, 1.5], color: FX },
        { text: { en: 'Body', uz: 'Tanasi' }, at: [-2, -13, 14], color: FX },
        { text: { en: 'Column', uz: 'Ustuni' }, at: [-3, 5, 1], color: FX },
        { text: { en: 'Mammillary body', uz: "So'rg'ichsimon tana" }, at: [-2.5, -7, -17], color: MB },
      ],
      view: [-0.85, -0.45, 0.45],
    },
    {
      title: { en: 'Why is everything here C-shaped?', uz: 'Nega bu yerda hammasi C shaklida?' },
      text: {
        en: 'In development the hemisphere grows forward, up, back and then down and forward around the insula — like a ram’s horn curling. The ventricle inside and everything stuck to its wall follow the same curve: the lateral ventricle, the caudate nucleus, the fornix–hippocampus and the stria terminalis (from the amygdala).',
        uz: "Rivojlanishda yarim shar oldinga, yuqoriga, orqaga, so'ng orolcha atrofida pastga va oldinga o'sadi — xuddi qo'chqor shoxi buralgandek. Ichidagi qorincha va uning devoriga yopishgan hamma narsa shu egrilikni takrorlaydi: yon qorincha, dumli yadro, fornix–gippokamp va stria terminalis (amigdaladan).",
      },
      memo: {
        en: 'One letter, five structures: Ventricle, Caudate, Fornix, Stria terminalis, Hippocampus. In the temporal horn they end on opposite sides: the caudate tail on the ROOF, the hippocampus on the FLOOR.',
        uz: "Bitta harf — beshta tuzilma: Qorincha, Kaudat, Fornix, Stria terminalis, Gippokamp. Chakka shoxida ular qarama-qarshi tomonda tugaydi: kaudat dumi — TOMIDA, gippokamp — TUBIDA.",
      },
      deep: {
        en: 'This is why one coronal section shows the caudate twice (head/body above, tail in the roof of the temporal horn) — a classic trap when reading MRI and atlas plates. The C-rotation is driven by the insula lagging behind while the opercula grow over it.',
        uz: "Shuning uchun bitta koronal kesimda kaudat ikki marta ko'rinadi (bosh/tana tepada, dum chakka shoxi tomida) — MRT va atlas plastinkalarini o'qishdagi klassik tuzoq. C-buralishning sababi: orolcha o'sishda ortda qoladi, operkulumlar esa uning ustini yopib o'sadi.",
      },
      show: [
        { concept: 'lateral-ventricle', side: 'left', color: LV },
        { concept: 'caudate-nucleus', side: 'left', color: CAU },
        { concept: 'fornix-of-forebrain', side: 'left', color: FX },
        { concept: 'stria-terminalis', side: 'left', color: ST },
        { concept: 'hippocampus-proper', side: 'left', color: HIP },
      ],
      context: LEFT_HEMI,
      labels: [
        { text: { en: 'Lateral ventricle', uz: 'Yon qorincha' }, at: [-17, -76, 7.6], color: LV },
        { text: { en: 'Caudate nucleus', uz: 'Dumli yadro' }, at: [-14, 18, 8], color: CAU },
        { text: { en: 'Fornix', uz: 'Fornix' }, at: [-2, -13, 14], color: FX },
        { text: { en: 'Stria terminalis', uz: 'Stria terminalis' }, at: [-21, -30, 3], color: ST },
        { text: { en: 'Hippocampus', uz: 'Gippokamp' }, at: [-33, -22, -20], color: HIP },
      ],
      view: [-1, 0, 0.2],
    },
    {
      title: { en: 'The Papez circuit — a memory train with seven stops', uz: 'Papez halqasi — yetti bekatli xotira poyezdi' },
      text: {
        en: 'In 1937 James Papez described a closed loop: hippocampus → fornix → mammillary body → mammillothalamic tract → anterior nucleus of the thalamus → cingulate gyrus (via the cingulum) → parahippocampal / entorhinal cortex → back into the hippocampus. Today it is seen above all as a circuit for episodic memory.',
        uz: "1937 yilda James Papez yopiq halqani tasvirladi: gippokamp → fornix → so'rg'ichsimon tana → mamillotalamik trakt → talamusning oldingi yadrosi → belbog' pushtasi (cingulum orqali) → parahippokampal / entorinal po'stloq → yana gippokamp. Bugun u avvalo epizodik xotira halqasi deb qaraladi.",
      },
      memo: {
        en: 'A train on a circular line, seven stops: Hippocampus · Fornix · Mammillary body · MTT · Anterior thalamus · Cingulate · Parahippocampal — and round again.',
        uz: "Aylana yo'ldagi poyezd, yetti bekat: Gippokamp · Fornix · So'rg'ichsimon tana · Mamillotalamik trakt · Talamus (oldingi yadro) · Belbog' pushtasi · Parahippokampal po'stloq — va yana boshidan.",
      },
      deep: {
        en: 'Break any link and memory fails: hippocampus (patient H.M., bilateral medial temporal resection 1953 — Scoville & Milner 1957), fornix (surgery), mammillary bodies and anterior thalamus (Korsakoff syndrome — thiamine deficiency), paramedian thalamic infarct, retrosplenial cortex (retrosplenial amnesia). For emotion the parallel basolateral (Yakovlev) circuit — amygdala, orbitofrontal cortex, MD thalamus — matters more.',
        uz: "Istalgan bo'g'in uzilsa xotira buziladi: gippokamp (bemor H.M., 1953 yilda ikki tomonlama medial chakka rezeksiyasi — Scoville va Milner 1957), fornix (operatsiya), so'rg'ichsimon tanalar va oldingi talamus (Korsakoff sindromi — tiamin tanqisligi), paramedian talamus infarkti, retrosplenial po'stloq (retrosplenial amneziya). Hissiyot uchun parallel bazolateral (Yakovlev) halqasi — amigdala, orbitofrontal po'stloq, MD talamus — muhimroq.",
      },
      show: [
        { concept: 'hippocampus-proper', side: 'left', color: HIP },
        { concept: 'fornix-of-forebrain', side: 'left', color: FX },
        { concept: 'mammillary-body', color: MB },
        { concept: 'mammillothalamic-tract-of-hypothalamus', side: 'left', color: MTT },
        { concept: 'j-av', side: 'left', color: AV },
        { concept: 'cingulate-gyrus', side: 'left', color: CING },
        { concept: 'parahippocampal-gyrus', side: 'left', color: PHG },
      ],
      context: [{ ref: 'thalamus', side: 'left' }, { ref: 'corpus-callosum' }],
      layers: ['julich'],
      flow: { path: PAPEZ, color: '#fff3b0', loop: true },
      labels: [
        { text: { en: '1 · Hippocampus', uz: '1 · Gippokamp' }, at: [-31, -20, -20], color: HIP },
        { text: { en: '2 · Fornix', uz: '2 · Fornix' }, at: [-2, -13, 14], color: FX },
        { text: { en: '3 · Mammillary body', uz: "3 · So'rg'ichsimon tana" }, at: [-2.5, -7, -17], color: MB },
        { text: { en: '4 · Mammillothalamic tract', uz: '4 · Mamillotalamik trakt' }, at: [-5, -9.5, -10], color: MTT },
        { text: { en: '5 · Anterior thalamic nucleus', uz: '5 · Talamusning oldingi yadrosi' }, at: [-6.2, -10.3, 14.7], color: AV },
        { text: { en: '6 · Cingulate gyrus', uz: "6 · Belbog' pushtasi" }, at: [-7, -22, 36], color: CING },
        { text: { en: '7 · Parahippocampal gyrus', uz: '7 · Parahippokampal pushta' }, at: [-19, -40, -10], color: PHG },
      ],
      // Medial surface of the left hemisphere, seen from the right.
      view: [1, 0.05, 0.15],
    },
    {
      title: { en: 'Inside the hippocampus — the trisynaptic loop', uz: 'Gippokamp ichida — trisinaptik zanjir' },
      text: {
        en: 'Inside, signals run in one direction: entorhinal cortex → (perforant path) → dentate gyrus → (mossy fibres) → CA3 → (Schaffer collaterals) → CA1 → subiculum → back to the entorhinal cortex. This loop encodes new episodes and builds the spatial map (place cells). The coloured areas are the real Julich-Brain subfields.',
        uz: "Ichkarida signal bir yo'nalishda yuradi: entorinal po'stloq → (perforant yo'l) → tishsimon pushta → (moxsimon tolalar) → CA3 → (Schaffer kollaterallari) → CA1 → subikulum → yana entorinal po'stloq. Bu zanjir yangi voqealarni kodlaydi va fazoviy xaritani (joy hujayralari) quradi. Rangli sohalar — haqiqiy Julich-Brain submaydonlari.",
      },
      memo: { en: 'E-D-3-1-S: Entrance → Dentate gate → room 3 → room 1 → Subiculum exit.', uz: "E-T-3-1-S: Eshik (entorinal) → Tishli darvoza → 3-xona → 1-xona → Subikulum (chiqish)." },
      deep: {
        en: 'CA1 (Sommer’s sector) is the most hypoxia-sensitive neuron population — it dies selectively after cardiac arrest; transient global amnesia shows punctate DWI dots in CA1. The dentate gyrus is one of the few sites of adult neurogenesis (contested in humans). In Alzheimer disease tau pathology starts in the transentorhinal/entorhinal cortex (Braak I–II) before the hippocampus. Place cells (O’Keefe) and grid cells (the Mosers): Nobel Prize 2014.',
        uz: "CA1 (Sommer sektori) — gipoksiyaga eng sezgir neyronlar: yurak to'xtashidan keyin tanlab nobud bo'ladi; tranzitor global amneziyada DWI'da CA1 da nuqtali o'choqlar ko'rinadi. Tishsimon pushta — kattalarda neyrogenez davom etadigan kam joylardan biri (odamda munozarali). Altsgeymer kasalligida tau patologiyasi gippokampdan oldin transentorinal/entorinal po'stloqda boshlanadi (Braak I–II). Joy hujayralari (O'Keefe) va to'r hujayralari (Moserlar): 2014 yil Nobel mukofoti.",
      },
      show: [
        { concept: 'j-area-ec', side: 'left', color: PHG },
        { concept: 'j-dg', side: 'left', color: '#ff6f91' },
        { concept: 'j-ca3', side: 'left', color: '#ffb36b' },
        { concept: 'j-ca2', side: 'left', color: '#ffe066' },
        { concept: 'j-ca1', side: 'left', color: '#57d163' },
        { concept: 'j-subc', side: 'left', color: '#7b8cff' },
      ],
      context: [{ ref: 'lateral-ventricle', side: 'left' }, { ref: 'amygdala', side: 'left' }],
      layers: ['julich'],
      flow: { via: [{ concept: 'j-area-ec', side: 'left' }, { concept: 'j-dg', side: 'left' }, { concept: 'j-ca3', side: 'left' }, { concept: 'j-ca1', side: 'left' }, { concept: 'j-subc', side: 'left' }], color: '#ffffff', loop: true },
      labels: [
        { text: { en: 'Entorhinal cortex', uz: "Entorinal po'stloq" }, at: [-23.4, -14.7, -31.7], color: PHG },
        { text: { en: 'Dentate gyrus', uz: 'Tishsimon pushta' }, at: [-28.1, -16.2, -20.6], color: '#ff6f91' },
        { text: { en: 'CA3', uz: 'CA3' }, at: [-26.6, -16.1, -18.4], color: '#ffb36b' },
        { text: { en: 'CA1', uz: 'CA1' }, at: [-29.2, -21.9, -18.6], color: '#57d163' },
        { text: { en: 'Subiculum', uz: 'Subikulum' }, at: [-21.5, -23.9, -18.2], color: '#7b8cff' },
      ],
      view: [-0.55, 0.15, -0.8],
    },
    {
      title: { en: 'Check yourself', uz: "O'zingizni tekshiring" },
      text: { en: 'Tap the structure named in the question on the model.', uz: 'Savolda aytilgan tuzilmani modelda bosing.' },
      show: [
        { concept: 'hippocampus-proper', side: 'left' },
        { concept: 'fornix-of-forebrain', side: 'left' },
        { concept: 'mammillary-body' },
        { concept: 'mammillothalamic-tract-of-hypothalamus', side: 'left' },
        { concept: 'cingulate-gyrus', side: 'left' },
        { concept: 'parahippocampal-gyrus', side: 'left' },
      ],
      context: [{ ref: 'thalamus', side: 'left' }],
      view: [1, 0.05, 0.15],
      quiz: [
        { ask: { en: 'Find the "seahorse".', uz: "'Dengiz oti'ni toping." }, answer: ['hippocampus-proper'] },
        { ask: { en: 'Which arch carries the hippocampus’s output?', uz: 'Gippokamp chiqishini qaysi ravoq olib ketadi?' }, answer: ['fornix-of-forebrain'] },
        { ask: { en: 'Which structure shrinks in Korsakoff syndrome?', uz: 'Korsakoff sindromida qaysi tuzilma kichrayadi?' }, answer: ['mammillary-body'] },
        { ask: { en: 'Stop 6 of the Papez circuit?', uz: 'Papez halqasining 6-bekati?' }, answer: ['cingulate-gyrus'] },
      ],
    },
  ],
  sources: [
    { title: 'StatPearls — Neuroanatomy, Hippocampus', url: 'https://www.ncbi.nlm.nih.gov/books/NBK482171/' },
    { title: 'Papez 1937 — A proposed mechanism of emotion', url: 'https://doi.org/10.1001/archneurpsyc.1937.02260220069003' },
    { title: 'Scoville & Milner 1957 — Loss of recent memory after bilateral hippocampal lesions', url: 'https://doi.org/10.1136/jnnp.20.1.11' },
    { title: 'Wikipedia — Hippocampus anatomy', url: 'https://en.wikipedia.org/wiki/Hippocampus_anatomy' },
    { title: 'Wikipedia — Fornix (neuroanatomy)', url: 'https://en.wikipedia.org/wiki/Fornix_(neuroanatomy)' },
    { title: 'Wikipedia — Papez circuit', url: 'https://en.wikipedia.org/wiki/Papez_circuit' },
  ],
}
