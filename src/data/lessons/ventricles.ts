import type { Lesson } from './types'

const LV = '#4fa3ff'
const V3 = '#36c5d6'
const AQ = '#9be7ff'
const V4 = '#7b8cff'
const MONRO = '#ffd84f'
const CP = '#ff6f91'

const GHOST_BRAIN = [{ ref: '@telencephalon' }, { ref: '@basal-ganglia' }, { ref: '@diencephalon' }, { ref: '@brainstem' }, { ref: '@cerebellum' }]
const ALL_VENTRICLES = [
  { concept: 'lateral-ventricle', color: LV },
  { concept: 'interventricular-foramen', color: MONRO },
  { concept: 'third-ventricle', color: V3 },
  { concept: 'cerebral-aqueduct', color: AQ },
  { concept: 'fourth-ventricle', color: V4 },
]

/** Path of CSF from the left atrium to the median aperture, MNI mm (read off the meshes). */
const CSF_PATH: [number, number, number][] = [
  [-25, -42, 6], [-20, -28, 12], [-14, -12, 19], [-11, -2, 16], [-5, 2, 7], [0, -3, 0], [0, -12, -3], [0.7, -20, -7], [0.8, -26.5, -14], [1, -31, -23], [1, -40, -36], [1.2, -50, -50], [1.5, -60, -60],
]

export const VENTRICLES: Lesson = {
  id: 'ventricles',
  title: { en: 'Ventricles and the CSF pathway', uz: "Qorinchalar va likvor yo'li" },
  blurb: { en: 'Four connected cavities, where CSF is made, how it flows and where it is blocked.', uz: "To'rtta ulangan bo'shliq: likvor qayerda hosil bo'ladi, qanday oqadi va qayerda to'siladi." },
  steps: [
    {
      title: { en: 'Four ventricles — water channels inside the brain', uz: "To'rtta qorincha — miya ichidagi suv yo'llari" },
      text: {
        en: 'Inside the brain lie four connected cavities filled with cerebrospinal fluid (CSF): two lateral ventricles (one in each hemisphere — traditionally the 1st and 2nd), the slit-like third ventricle in the midline between the thalami, and the fourth ventricle behind the pons and medulla, in front of the cerebellum. A thin canal — the cerebral aqueduct — joins the third to the fourth.',
        uz: "Miya ichida orqa miya suyuqligi (likvor) bilan to'lgan to'rtta ulangan bo'shliq bor: ikkita yon qorincha (har yarim sharda bittadan — an'anaviy I va II), o'rta chiziqda ikki talamus orasidagi yoriqsimon III qorincha va ko'prik hamda uzunchoq miya ortida, miyacha oldida IV qorincha. III ni IV ga ingichka quvur — Silviy suv yo'li bog'laydi.",
      },
      memo: {
        en: 'Think of a house: two big rooms (lateral ventricles) → two doors (foramina of Monro) → one narrow hallway (3rd ventricle) → a thin pipe (aqueduct) → a tent at the bottom (4th ventricle) → three exits to the outside.',
        uz: "Uyni tasavvur qiling: ikkita katta xona (yon qorinchalar) → ikkita eshik (Monro teshiklari) → bitta tor yo'lak (III qorincha) → ingichka quvur (Silviy) → pastdagi chodir (IV qorincha) → tashqariga uchta chiqish.",
      },
      deep: {
        en: 'Volumes: ventricles ≈ 25 mL, total CSF ≈ 150 mL (the rest is in the subarachnoid space and spinal canal). About 500 mL is secreted per day, so CSF is renewed 3–4 times daily. Normal lumbar opening pressure 6–20 cm H₂O (lying on the side).',
        uz: "Hajmlar: qorinchalar ≈ 25 mL, umumiy likvor ≈ 150 mL (qolgani subaraxnoidal bo'shliq va orqa miya kanalida). Sutkasiga ≈ 500 mL ishlab chiqariladi — likvor kuniga 3–4 marta to'liq yangilanadi. Normal lumbal bosim 6–20 sm suv ustuni (yonboshlab yotganda).",
      },
      show: ALL_VENTRICLES,
      context: GHOST_BRAIN,
      labels: [
        { text: { en: 'Lateral ventricle', uz: 'Yon qorincha' }, at: [-13, -10, 22], color: LV },
        { text: { en: '3rd ventricle', uz: 'III qorincha' }, at: [0.5, -10, -4], color: V3 },
        { text: { en: 'Cerebral aqueduct', uz: "Silviy suv yo'li" }, at: [0.7, -26.5, -14], color: AQ },
        { text: { en: '4th ventricle', uz: 'IV qorincha' }, at: [1.5, -48, -44], color: V4 },
      ],
      view: [-0.85, 0.35, 0.4],
    },
    {
      title: { en: 'The lateral ventricle — a ram’s horn', uz: "Yon qorincha — qo'chqor shoxi" },
      text: {
        en: 'Each lateral ventricle is C-shaped and has five parts: the frontal (anterior) horn in the frontal lobe; the body under the parietal lobe; the atrium (trigone), where three horns meet; the occipital (posterior) horn; and the temporal (inferior) horn, which curls down and forward into the temporal lobe.',
        uz: "Har bir yon qorincha C shaklida va besh qismdan iborat: peshona bo'lagidagi oldingi (frontal) shox; tepa bo'lagi ostidagi tana; uchta shox qo'shiladigan bo'lma (atrium, uchburchak); orqa (ensa) shox; pastga va oldinga qayrilib chakka bo'lagiga kiradigan pastki (chakka) shox.",
      },
      memo: {
        en: 'A ram’s horn: it runs back from the forehead, then curls down and forward towards the ear. Five parts, front to back and round: frontal horn – body – atrium – occipital horn – temporal horn.',
        uz: "Qo'chqor shoxi: peshonadan orqaga ketadi, orqada pastga qayrilib, yana oldinga — quloq tomonga buriladi. Besh qism: Oldingi shox – Tana – Bo'lma – Orqa shox – Pastki shox (O-T-B-O-P).",
      },
      deep: {
        en: 'Radiology: the glomus of the choroid plexus in the atrium often calcifies (a bright dot on CT — normal). Dilated temporal horns (> 2 mm) are the earliest CT sign of hydrocephalus. Colpocephaly — disproportionately large occipital horns — accompanies agenesis of the corpus callosum.',
        uz: "Radiologiya: bo'lmadagi tomirli chigal glomusi ko'pincha kalsinatlanadi (KTda yorqin nuqta — normal). Chakka shoxlarining kengayishi (> 2 mm) — gidrotsefaliyaning eng erta KT belgisi. Kolpotsefaliya — orqa shoxlarning nomutanosib kattaligi — qadoqsimon tana agenezida uchraydi.",
      },
      show: [{ concept: 'lateral-ventricle', side: 'left', color: LV }],
      context: [{ ref: '@telencephalon', side: 'left' }, { ref: '@cerebellum' }, { ref: '@brainstem' }],
      labels: [
        { text: { en: 'Frontal (anterior) horn', uz: 'Oldingi (frontal) shox' }, at: [-15.7, 30, 1], color: LV },
        { text: { en: 'Body', uz: 'Tana' }, at: [-13, -10, 22], color: LV },
        { text: { en: 'Atrium (trigone)', uz: "Bo'lma (atrium)" }, at: [-25, -45, 6], color: LV },
        { text: { en: 'Occipital (posterior) horn', uz: 'Orqa (ensa) shox' }, at: [-17, -76, 7.6], color: LV },
        { text: { en: 'Temporal (inferior) horn', uz: 'Pastki (chakka) shox' }, at: [-29, -6, -25], color: LV },
      ],
      section: 'bg-capsule-axial',
      view: [-1, 0, 0.18],
    },
    {
      title: { en: 'The walls of the room', uz: 'Xonaning devorlari' },
      text: {
        en: 'Learn the ventricle by its walls. Roof: the corpus callosum. Lateral wall: the caudate nucleus, which follows the ventricle’s C all the way round. Floor of the body: the thalamus. Floor of the temporal horn: the hippocampus. Medial wall: the septum pellucidum and the fornix.',
        uz: "Qorinchani devorlari orqali o'rganing. Tomi — qadoqsimon tana. Lateral devori — dumli yadro, u qorinchaning C shaklini butunlay takrorlaydi. Tanasining tubi — talamus. Chakka shoxining tubi — gippokamp. Medial devori — shaffof to'siq va fornix.",
      },
      memo: {
        en: 'Room = ventricle: ceiling = corpus callosum, side wall = caudate, floor = thalamus, floor of the basement (temporal horn) = hippocampus.',
        uz: "Xona = qorincha: shift = qadoqsimon tana, yon devor = kaudat, pol = talamus, yerto'la (chakka shoxi) poli = gippokamp.",
      },
      deep: {
        en: 'In the caudothalamic groove run the stria terminalis and the thalamostriate vein; the vein joins the septal vein at the posterior margin of the foramen of Monro (the "venous angle") — the endoscopist’s landmark for finding the foramen.',
        uz: "Kaudotalamik egatda stria terminalis va talamostriar vena yotadi; vena Monro teshigining orqa chetida septal vena bilan qo'shiladi ('venoz burchak') — endoskopist teshikni shu belgi bo'yicha topadi.",
      },
      show: [
        { concept: 'lateral-ventricle', side: 'left', color: LV },
        { concept: 'corpus-callosum', color: '#f2e6c9' },
        { concept: 'caudate-nucleus', side: 'left', color: '#c9975b' },
        { concept: 'thalamus', side: 'left', color: '#e0a35a' },
        { concept: 'hippocampus-proper', side: 'left', color: '#ff9d4d' },
      ],
      context: [{ ref: '@telencephalon', side: 'left' }],
      labels: [
        { text: { en: 'Roof — corpus callosum', uz: 'Tomi — qadoqsimon tana' }, at: [-4, -20, 23], color: '#f2e6c9' },
        { text: { en: 'Lateral wall — caudate', uz: 'Lateral devor — kaudat' }, at: [-12, 16, 6], color: '#c9975b' },
        { text: { en: 'Floor — thalamus', uz: 'Tubi — talamus' }, at: [-13, -17, 10], color: '#e0a35a' },
        { text: { en: 'Temporal-horn floor — hippocampus', uz: 'Chakka shoxi tubi — gippokamp' }, at: [-31, -18, -21], color: '#ff9d4d' },
      ],
      section: 'thalamus-coronal',
      view: [-0.8, 0.45, 0.45],
    },
    {
      title: { en: 'The doors: foramen of Monro and the 3rd ventricle', uz: 'Eshiklar: Monro teshigi va III qorincha' },
      text: {
        en: 'Each lateral ventricle opens into the third ventricle through one small interventricular foramen (of Monro), between the column of the fornix in front and the front of the thalamus behind. The third ventricle is a narrow vertical slit (~5 mm) between the two thalami; its floor is the hypothalamus.',
        uz: "Har bir yon qorincha III qorinchaga bitta kichik qorinchalararo (Monro) teshigi orqali ochiladi; u oldinda fornix ustuni va orqada talamusning oldingi uchi orasida. III qorincha — ikki talamus orasidagi tor tik yoriq (~5 mm), uning tubi — gipotalamus.",
      },
      memo: { en: 'Monro = the door between each room and the hallway. Two doors (left, right), one hallway.', uz: "Monro — har xonadan yo'lakka ochiladigan eshik. Ikki eshik (chap, o'ng), bitta yo'lak." },
      deep: {
        en: 'A colloid cyst grows exactly at the foramen of Monro and can block both doors at once → acute obstructive hydrocephalus, positional headache, even sudden death. Endoscopic third ventriculostomy (ETV): the endoscope passes through the foramen and perforates the floor of the 3rd ventricle (tuber cinereum, between the mammillary bodies and the infundibulum) so CSF bypasses a blocked aqueduct.',
        uz: "Kolloid kista aynan Monro teshigida o'sadi va ikkala eshikni birdan yopishi mumkin → o'tkir obstruktiv gidrotsefaliya, holatga bog'liq bosh og'rig'i, hatto to'satdan o'lim. Endoskopik III ventrikulostomiya (ETV): endoskop teshik orqali kirib, III qorincha tubini (so'rg'ichsimon tanalar bilan voronka orasidagi kulrang do'mboq) teshadi — likvor to'silgan suv yo'lini chetlab o'tadi.",
      },
      show: [
        { concept: 'lateral-ventricle', color: LV },
        { concept: 'interventricular-foramen', color: MONRO },
        { concept: 'third-ventricle', color: V3 },
      ],
      context: [{ ref: 'thalamus' }, { ref: 'fornix-of-forebrain' }, { ref: '@telencephalon' }],
      labels: [
        { text: { en: 'Foramen of Monro', uz: 'Monro teshigi' }, at: [-5, 2, 7], color: MONRO },
        { text: { en: '3rd ventricle', uz: 'III qorincha' }, at: [0.5, -12, -6], color: V3 },
      ],
      section: 'bg-commissural',
      view: [-0.55, 0.8, 0.3],
    },
    {
      title: { en: 'The pipe and the tent: aqueduct and 4th ventricle', uz: "Quvur va chodir: Silviy suv yo'li va IV qorincha" },
      text: {
        en: 'From the third ventricle CSF runs down the cerebral aqueduct (of Sylvius) through the midbrain — about 15 mm long and only 1–2 mm wide — into the tent-shaped fourth ventricle between the brainstem and the cerebellum. Three openings let it out into the subarachnoid space around the brain: the median aperture (Magendie) and the two lateral apertures (Luschka).',
        uz: "III qorinchadan likvor o'rta miya ichidagi Silviy suv yo'li orqali (uzunligi ~15 mm, kengligi atigi 1–2 mm) miya ustuni va miyacha orasidagi chodirsimon IV qorinchaga tushadi. Uchta teshik uni miya atrofidagi subaraxnoidal bo'shliqqa chiqaradi: o'rtadagi Magendie teshigi va yonlardagi ikkita Luschka teshigi.",
      },
      memo: { en: 'Magendie = Median, Luschka = Lateral (M–M, L–L).', uz: "Magendie — Medial (o'rtada), Luschka — Lateral (yonda): M–M, L–L." },
      deep: {
        en: 'Aqueductal stenosis is the commonest cause of congenital obstructive hydrocephalus: lateral and third ventricles dilate while the fourth stays normal — that pattern localises the block on MRI. Dandy–Walker malformation: atresia of the apertures, cystic 4th ventricle, vermian hypoplasia. Chiari II: the 4th ventricle is pulled down through the foramen magnum.',
        uz: "Suv yo'li stenozi — tug'ma obstruktiv gidrotsefaliyaning eng ko'p sababi: yon va III qorinchalar kengayadi, IV esa normal qoladi — MRT blok darajasini shu manzaradan aniqlaydi. Dandy–Walker nuqsoni: teshiklar atreziyasi, kistasimon IV qorincha, vermis gipoplaziyasi. Chiari II: IV qorincha katta teshik orqali pastga tortilgan.",
      },
      show: [
        { concept: 'third-ventricle', color: V3 },
        { concept: 'cerebral-aqueduct', color: AQ },
        { concept: 'fourth-ventricle', color: V4 },
      ],
      context: [{ ref: '@brainstem' }, { ref: '@cerebellum' }, { ref: '@diencephalon' }],
      labels: [
        { text: { en: 'Cerebral aqueduct (Sylvius)', uz: "Silviy suv yo'li" }, at: [0.7, -26.5, -14], color: AQ },
        { text: { en: '4th ventricle', uz: 'IV qorincha' }, at: [1.5, -45, -40], color: V4 },
        { text: { en: 'Median aperture (Magendie)', uz: 'Magendie teshigi (medial)' }, at: [1.5, -60, -58], color: V4 },
        { text: { en: 'Lateral aperture (Luschka)', uz: 'Luschka teshigi (lateral)' }, at: [-14, -49, -51], color: V4 },
      ],
      section: 'midbrain-superior-colliculus',
      view: [-1, 0.05, 0.1],
    },
    {
      title: { en: 'Who makes CSF? The choroid plexus', uz: 'Likvorni kim ishlab chiqaradi? Tomirli chigal' },
      text: {
        en: 'About 70–80 % of CSF is secreted by the choroid plexus — cauliflower-like tufts of capillaries covered by epithelium that hang inside the ventricles. It lies in the body, atrium and temporal horn of each lateral ventricle and in the roofs of the third and fourth ventricles — but NOT in the frontal or occipital horns.',
        uz: "Likvorning ~70–80 % ini tomirli chigal ishlab chiqaradi — qorinchalar ichida osilib turgan, epiteliy bilan qoplangan kapillyarlarning gulkaramga o'xshash to'plamlari. U har bir yon qorinchaning tanasi, bo'lmasi va chakka shoxida hamda III va IV qorinchalar tomida bor — lekin frontal va orqa shoxlarda YO'Q.",
      },
      memo: { en: 'The tips of the horns are empty: no plexus in the frontal or occipital horn. A favourite exam question!', uz: "Shoxlarning uchlari bo'sh: oldingi va orqa shoxda chigal yo'q. Imtihonning sevimli savoli!" },
      deep: {
        en: 'The epithelium secretes fluid via Na⁺/K⁺-ATPase and carbonic anhydrase (the target of acetazolamide); its tight junctions form the blood–CSF barrier. A choroid plexus papilloma (children: atrium) can cause hydrocephalus by over-production — the rare "secretory" type.',
        uz: "Epiteliy suyuqlikni Na⁺/K⁺-ATPaza va karboanhidraza (atsetazolamid nishoni) orqali chiqaradi; uning zich kontaktlari qon–likvor to'sig'ini hosil qiladi. Tomirli chigal papillomasi (bolalarda — bo'lmada) ortiqcha ishlab chiqarish orqali gidrotsefaliya berishi mumkin — kam uchraydigan 'sekretor' turi.",
      },
      show: [
        { concept: 'choroid-plexus-of-cerebral-hemisphere', side: 'left', color: CP },
        { concept: 'lateral-ventricle', side: 'left', color: LV },
      ],
      context: [{ ref: '@telencephalon', side: 'left' }],
      labels: [
        { text: { en: 'Glomus (atrium)', uz: "Glomus (bo'lmada)" }, at: [-26, -40, 1], color: CP },
        { text: { en: 'No plexus in the frontal horn', uz: "Frontal shoxda chigal yo'q" }, at: [-15.7, 30, 1], color: LV },
        { text: { en: 'No plexus in the occipital horn', uz: "Orqa shoxda chigal yo'q" }, at: [-17, -76, 7.6], color: LV },
      ],
      view: [-0.9, 0.1, 0.6],
    },
    {
      title: { en: 'Follow the flow', uz: "Oqimni kuzating" },
      text: {
        en: 'Now watch the whole route: lateral ventricle → foramen of Monro → 3rd ventricle → aqueduct → 4th ventricle → Magendie/Luschka → subarachnoid space and cisterns → over the convexity to the arachnoid granulations, where CSF drains into the venous blood of the superior sagittal sinus.',
        uz: "Endi butun yo'lni kuzating: yon qorincha → Monro teshigi → III qorincha → Silviy suv yo'li → IV qorincha → Magendie/Luschka → subaraxnoidal bo'shliq va sisternalar → miya qabarig'i ustidan araxnoidal donachalarga (Pachioni), u yerda likvor yuqori sagittal sinusning venoz qoniga so'riladi.",
      },
      memo: { en: 'Made inside, absorbed on top. The flow goes one way only: from inside out, from below up.', uz: "Ichkarida hosil bo'ladi, tepada so'riladi. Oqim faqat bir tomonga: ichdan tashqariga, pastdan tepaga." },
      deep: {
        en: 'Hydrocephalus is classified by where the flow stops: obstructive (block inside the ventricles, e.g. aqueduct) or communicating (absorption fails — after meningitis or subarachnoid haemorrhage). Normal-pressure hydrocephalus: gait apraxia, dementia, urinary incontinence ("wet, wobbly, wacky"); Evans index > 0.3; tap test, then ventriculoperitoneal shunt. Newer physiology: the glymphatic system — during sleep CSF enters the parenchyma along arteries and washes out solutes, including β-amyloid.',
        uz: "Gidrotsefaliya oqim qayerda to'xtashiga ko'ra tasniflanadi: obstruktiv (qorinchalar ichida blok, masalan suv yo'lida) yoki kommunikatsiyalanuvchi (so'rilish buzilgan — meningit yoki subaraxnoidal qon quyilishidan keyin). Normal bosimli gidrotsefaliya: yurish apraksiyasi, demensiya, siydik tutolmaslik ('ho'l, chayqaluvchi, g'alati'); Evans indeksi > 0.3; lumbal sinov, so'ng ventrikuloperitoneal shunt. Yangi fiziologiya: glimfatik tizim — uyquda likvor arteriyalar bo'ylab parenximaga kirib, eruvchan chiqindilarni, jumladan β-amiloidni yuvadi.",
      },
      show: ALL_VENTRICLES,
      context: GHOST_BRAIN,
      flow: { path: CSF_PATH, color: '#9be7ff' },
      labels: [
        { text: { en: '1 · Lateral ventricle', uz: '1 · Yon qorincha' }, at: [-25, -42, 6], color: LV },
        { text: { en: '2 · Foramen of Monro', uz: '2 · Monro teshigi' }, at: [-5, 2, 7], color: MONRO },
        { text: { en: '3 · 3rd ventricle', uz: '3 · III qorincha' }, at: [0.5, -10, -4], color: V3 },
        { text: { en: '4 · Aqueduct', uz: "4 · Suv yo'li" }, at: [0.7, -26.5, -14], color: AQ },
        { text: { en: '5 · 4th ventricle → exits', uz: '5 · IV qorincha → chiqishlar' }, at: [1.5, -55, -55], color: V4 },
      ],
      view: [-1, 0.2, 0.25],
    },
    {
      title: { en: 'Check yourself', uz: "O'zingizni tekshiring" },
      text: { en: 'Tap the structure named in the question on the model. Rotate it freely.', uz: "Savolda aytilgan tuzilmani modelda bosing. Modelni bemalol aylantiring." },
      show: ALL_VENTRICLES.map((s) => ({ concept: s.concept })),
      context: GHOST_BRAIN,
      view: [-0.85, 0.35, 0.4],
      quiz: [
        { ask: { en: 'Where is the foramen of Monro?', uz: 'Monro teshigi qayerda?' }, answer: ['interventricular-foramen'] },
        { ask: { en: 'Find the cerebral aqueduct.', uz: "Silviy suv yo'lini toping." }, answer: ['cerebral-aqueduct'] },
        { ask: { en: 'Which ventricle lies between the two thalami?', uz: 'Ikki talamus orasidagi qorincha qaysi?' }, answer: ['third-ventricle'] },
        { ask: { en: 'Which cavity stays normal in aqueductal stenosis?', uz: "Suv yo'li stenozida qaysi bo'shliq normal qoladi?" }, answer: ['fourth-ventricle'] },
      ],
    },
  ],
  sources: [
    { title: 'StatPearls — Neuroanatomy, Ventricular System', url: 'https://www.ncbi.nlm.nih.gov/books/NBK532932/' },
    { title: 'StatPearls — Physiology, Cerebral Spinal Fluid', url: 'https://www.ncbi.nlm.nih.gov/books/NBK519007/' },
    { title: 'Wikipedia — Ventricular system', url: 'https://en.wikipedia.org/wiki/Ventricular_system' },
    { title: 'Wikipedia — Cerebrospinal fluid', url: 'https://en.wikipedia.org/wiki/Cerebrospinal_fluid' },
    { title: 'Wikipedia — Choroid plexus', url: 'https://en.wikipedia.org/wiki/Choroid_plexus' },
  ],
}
