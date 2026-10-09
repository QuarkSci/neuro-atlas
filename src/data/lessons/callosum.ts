import type { Lesson } from './types'

const CC = '#f2c14e'
const LV = '#4fa3ff'
const FX = '#ffe066'
const SP = '#b9c7d8'
const AC = '#ff7a59'
const HC = '#ffb36b'
const PREF = '#5aa8ff'
const MOT = '#ff8a5a'
const VIS = '#57d163'

export const CALLOSUM: Lesson = {
  id: 'callosum',
  title: { en: 'Corpus callosum and the commissures', uz: 'Qadoqsimon tana va komissuralar' },
  blurb: { en: 'The bridge between the hemispheres: its parts, what each part connects, what lies beneath it and the split brain.', uz: "Yarim sharlar orasidagi ko'prik: qismlari, har bir qism nimani bog'laydi, ostida nima bor va 'bo'lingan miya'." },
  steps: [
    {
      title: { en: 'A bridge of 200 million fibres', uz: "200 million toladan iborat ko'prik" },
      text: {
        en: 'The corpus callosum is the largest white-matter bridge between the two hemispheres — about 200 million axons, roughly 10 cm long. It lies deep in the longitudinal fissure, above the lateral ventricles. Because of it, the right hand "knows" what the left hand is doing.',
        uz: "Qadoqsimon tana (corpus callosum) — ikki yarim sharni bog'lovchi eng katta oq modda ko'prigi: ~200 million akson, uzunligi ~10 sm. U bo'ylama yoriq tubida, yon qorinchalar ustida yotadi. Aynan shu ko'prik tufayli o'ng qo'l chap qo'l nima qilayotganini 'biladi'.",
      },
      memo: { en: 'A cable joining two computers — with 200 million wires.', uz: "Ikki kompyuterni ulovchi kabel — ichida 200 million sim." },
      deep: {
        en: 'Fibre spectrum: the genu carries many thin, lightly myelinated prefrontal axons; the splenium carries thick, fast visual axons. Popular claims of a sex difference in splenium shape did not survive large meta-analyses (Bishop & Wahlsten 1997).',
        uz: "Tolalar tarkibi: tizzada ingichka, kam miyelinli prefrontal aksonlar ko'p; spleniumda yo'g'on, tez o'tkazuvchi ko'rish aksonlari. Splenium shaklidagi jinsiy farq haqidagi mashhur da'volar katta meta-tahlillarda tasdiqlanmagan (Bishop va Wahlsten 1997).",
      },
      show: [{ concept: 'corpus-callosum', color: CC }],
      context: [{ ref: '@telencephalon' }, { ref: '@basal-ganglia' }],
      labels: [{ text: { en: 'Corpus callosum', uz: 'Qadoqsimon tana' }, at: [0, -9, 26], color: CC }],
      view: [-0.75, 0.25, 0.6],
    },
    {
      title: { en: 'Four parts, front to back', uz: "To'rt qism: oldindan orqaga" },
      text: {
        en: 'From front to back: the rostrum — the thin tip curving down and back; the genu — the front bend (knee); the body (trunk) — the long middle part; the splenium — the thick rounded back end.',
        uz: "Oldindan orqaga: tumshuq (rostrum) — pastga va orqaga qayrilgan ingichka uchi; tizza (genu) — oldingi bukilish; tana (truncus) — eng uzun o'rta qism; qalinlashma (splenium) — orqadagi yo'g'on, dumaloq uchi.",
      },
      memo: {
        en: 'Seen from the side it is a lying hook: Rostrum – Genu – Body – Splenium ("Really Good Brain Stuff").',
        uz: "Yon tomondan u yotgan ilmoq: T-T-T-Q — Tumshuq, Tizza, Tana, Qalinlashma. Ilmoqning boshi oldinda bukilgan, dumi orqada yo'g'on.",
      },
      deep: {
        en: 'Typical adult MRI thickness: genu and splenium ≈ 10–12 mm, body ≈ 6 mm. Myelination proceeds from back to front (splenium before genu) and looks mature on T1 by about 8 months.',
        uz: "Kattalarda MRTdagi odatiy qalinlik: tizza va splenium ≈ 10–12 mm, tana ≈ 6 mm. Miyelinlanish orqadan oldinga boradi (splenium tizzadan oldin) va T1 da ~8 oylikda yetuk ko'rinadi.",
      },
      show: [{ concept: 'corpus-callosum', color: CC }],
      context: [{ ref: '@telencephalon', side: 'left' }],
      labels: [
        { text: { en: 'Rostrum', uz: 'Tumshuq (rostrum)' }, at: [0, 24, -8], color: CC },
        { text: { en: 'Genu', uz: 'Tizza (genu)' }, at: [0, 37, 3], color: CC },
        { text: { en: 'Body (trunk)', uz: 'Tana (truncus)' }, at: [0, -9, 26], color: CC },
        { text: { en: 'Splenium', uz: 'Qalinlashma (splenium)' }, at: [0, -46, 15], color: CC },
      ],
      view: [1, 0.05, 0.15],
    },
    {
      title: { en: 'Which part connects what?', uz: "Qaysi qism nimani bog'laydi?" },
      text: {
        en: 'The fibres are topographic. The genu links the frontal lobes (the U-shaped forceps minor); the body links motor, sensory and parietal areas; the splenium links the occipital (visual) and temporal areas (the forceps major).',
        uz: "Tolalar topografik joylashgan. Tizza peshona bo'laklarini bog'laydi (U shaklidagi 'kichik qisqich' — forceps minor); tana — harakat, sezgi va tepa sohalarini; splenium — ensa (ko'rish) va chakka sohalarini ('katta qisqich' — forceps major).",
      },
      memo: { en: 'Front = thinking (prefrontal), middle = moving and feeling, back = seeing.', uz: "Old — o'ylash (prefrontal), o'rta — harakat va sezish, orqa — ko'rish." },
      deep: {
        en: 'Diffusion tractography divides the callosum into five sectors (Hofer & Frahm 2006): I prefrontal, II premotor/SMA, III motor, IV sensory, V parietal–temporal–occipital. Damage to the splenial fibres plus the left visual cortex gives pure alexia without agraphia (Dejerine 1892): the patient writes but cannot read what was written.',
        uz: "Diffuziya traktografiyasi qadoqsimon tanani besh sektorga bo'ladi (Hofer va Frahm 2006): I prefrontal, II premotor/SMA, III harakat, IV sezgi, V tepa–chakka–ensa. Splenium tolalari va chap ko'rish po'stlog'i birga zararlansa — agrafiyasiz sof aleksiya (Dejerine 1892): bemor yoza oladi, lekin yozganini o'qiy olmaydi.",
      },
      show: [
        { concept: 'corpus-callosum', color: CC },
        { concept: 'superior-frontal-gyrus', side: 'left', color: PREF },
        { concept: 'precentral-gyrus', side: 'left', color: MOT },
        { concept: 'postcentral-gyrus', side: 'left', color: MOT },
        { concept: 'cuneus', side: 'left', color: VIS },
        { concept: 'lingual-gyrus', side: 'left', color: VIS },
      ],
      context: [{ ref: '@telencephalon', side: 'left' }],
      labels: [
        { text: { en: 'Genu → frontal lobes', uz: "Tizza → peshona bo'laklari" }, at: [0, 37, 3], color: PREF },
        { text: { en: 'Body → motor & sensory', uz: 'Tana → harakat va sezgi' }, at: [0, -15, 26], color: MOT },
        { text: { en: 'Splenium → occipital (vision)', uz: "Splenium → ensa (ko'rish)" }, at: [0, -46, 15], color: VIS },
      ],
      // Medial surface of the left hemisphere, seen from the right.
      view: [1, 0.05, 0.2],
    },
    {
      title: { en: 'Underneath: ventricle roof and septum pellucidum', uz: "Ostida: qorincha tomi va shaffof to'siq" },
      text: {
        en: 'The corpus callosum is the roof of both lateral ventricles. From its underside a thin double sheet — the septum pellucidum — hangs down in the midline to the fornix, separating the two frontal horns.',
        uz: "Qadoqsimon tana ikkala yon qorinchaning tomi. Uning ostidan o'rta chiziq bo'ylab yupqa qo'sh varaq — shaffof to'siq (septum pellucidum) — pastdagi fornixgacha osilib turadi va ikki frontal shoxni ajratadi.",
      },
      memo: { en: 'A curtain (septum) hanging from the ceiling (callosum), its lower edge hooked onto a curtain rod (fornix), separating two rooms.', uz: "Shiftdan (qadoqsimon tana) osilgan parda (septum); uning pastki cheti karnizga (fornix) ilingan va ikki xonani ajratadi." },
      deep: {
        en: 'Cavum septi pellucidi (a cleft between the two leaves) is normal in newborns; persisting in adults it is commoner in boxers (chronic traumatic encephalopathy) and schizophrenia. Septo-optic dysplasia (de Morsier): absent septum + optic-nerve hypoplasia + pituitary deficiency.',
        uz: "Cavum septi pellucidi (ikki varaq orasidagi yoriq) chaqaloqlarda normal; kattalarda saqlanib qolsa, bokschilarda (surunkali travmatik ensefalopatiya) va shizofreniyada ko'proq. Septo-optik displaziya (de Morsier): septum yo'q + ko'rish nervi gipoplaziyasi + gipofiz yetishmovchiligi.",
      },
      show: [
        { concept: 'corpus-callosum', color: CC },
        { concept: 'septum-of-telencephalon', color: SP },
        { concept: 'lateral-ventricle', color: LV },
        { concept: 'fornix-of-forebrain', color: FX },
      ],
      context: [{ ref: '@telencephalon' }],
      labels: [
        { text: { en: 'Corpus callosum (roof)', uz: 'Qadoqsimon tana (tom)' }, at: [0, -9, 26], color: CC },
        { text: { en: 'Septum pellucidum', uz: "Shaffof to'siq" }, at: [0, 12, 10], color: SP },
        { text: { en: 'Frontal horn', uz: 'Frontal shox' }, at: [-15.7, 30, 1], color: LV },
        { text: { en: 'Fornix', uz: 'Fornix' }, at: [-2, -13, 13], color: FX },
      ],
      view: [-0.5, 0.85, 0.35],
    },
    {
      title: { en: 'The other commissures', uz: 'Boshqa komissuralar' },
      text: {
        en: 'The callosum is not the only bridge. The anterior commissure links the temporal lobes and the olfactory system; the hippocampal commissure (commissure of the fornix), under the splenium, links the two hippocampi.',
        uz: "Qadoqsimon tana yagona ko'prik emas. Oldingi komissura chakka bo'laklari va hid tizimini bog'laydi; gippokamp komissurasi (fornix komissurasi) splenium ostida ikki gippokampni bog'laydi.",
      },
      memo: { en: 'The anterior commissure is "zero": every millimetre on a brain map (MNI, Talairach) is measured from it.', uz: "Oldingi komissura — 'nol nuqta': miya xaritasidagi (MNI, Talairach) har bir millimetr shu yerdan o'lchanadi." },
      deep: {
        en: 'The AC–PC line (anterior to posterior commissure) is the main axis of Talairach and MNI space; DBS targets are given in millimetres from the mid-commissural point. In callosal agenesis the anterior commissure is often enlarged, partly compensating.',
        uz: "AC–PC chizig'i (oldingi va orqa komissuralar orasidagi) — Talairach va MNI fazosining asosiy o'qi; DBS nishonlari o'rta komissural nuqtadan millimetrda beriladi. Qadoqsimon tana agenezida oldingi komissura ko'pincha kattalashib, qisman o'rnini bosadi.",
      },
      show: [
        { concept: 'corpus-callosum', color: CC },
        { concept: 'anterior-commissure', color: AC },
        { concept: 'commissure-of-fornix-of-forebrain', color: HC },
      ],
      context: [{ ref: '@telencephalon', side: 'left' }, { ref: '@diencephalon' }],
      labels: [
        { text: { en: 'Anterior commissure', uz: 'Oldingi komissura' }, at: [0, 6, -6], color: AC },
        { text: { en: 'Hippocampal commissure', uz: 'Gippokamp komissurasi' }, at: [0, -30, 7], color: HC },
        { text: { en: 'Corpus callosum', uz: 'Qadoqsimon tana' }, at: [0, -9, 26], color: CC },
      ],
      view: [1, 0.05, 0.15],
    },
    {
      title: { en: 'A cut bridge: the split brain', uz: "Kesilgan ko'prik: 'bo'lingan miya'" },
      text: {
        en: 'In severe epilepsy the callosum is cut (callosotomy) so seizures cannot spread across. Sperry and Gazzaniga showed that such a patient cannot name an object shown to the left visual field (it reaches the right hemisphere; speech is on the left) — yet the left hand picks it out correctly.',
        uz: "Og'ir epilepsiyada tutqanoq bir yarim shardan ikkinchisiga o'tmasligi uchun qadoqsimon tana kesiladi (kallozotomiya). Sperry va Gazzaniga ko'rsatdi: bunday bemor chap ko'rish maydoniga ko'rsatilgan narsani ayta olmaydi (u o'ng yarim sharga boradi, nutq esa chapda) — lekin chap qo'li bilan uni to'g'ri topib beradi.",
      },
      memo: { en: 'Seen — but cannot say it: the words are on the left, the picture on the right, and the bridge is cut.', uz: "Ko'rdi — lekin ayta olmaydi: so'z chapda, rasm o'ngda, ko'prik esa kesilgan." },
      deep: {
        en: 'Disconnection syndromes: alien-hand sign, left-hand anomia and apraxia, pure alexia. Pathology: Marchiafava–Bignami (alcohol, callosal necrosis), "butterfly" glioblastoma crossing through the callosum, Dawson fingers at the callososeptal interface in multiple sclerosis, cytotoxic lesions of the splenium (CLOCC: antiepileptics, infections), agenesis (Probst bundles, parallel "racing-car" ventricles). Sperry: Nobel Prize 1981.',
        uz: "Diskonneksiya sindromlari: 'begona qo'l' belgisi, chap qo'l anomiyasi va apraksiyasi, sof aleksiya. Patologiya: Marchiafava–Bignami (alkogol, qadoqsimon tana nekrozi), qadoqsimon tana orqali ikki tomonga o'tgan 'kapalak' glioblastoma, tarqoq sklerozda kallozoseptal chegaradagi Dawson barmoqlari, spleniumning sitotoksik o'choqlari (CLOCC: epilepsiyaga qarshi dorilar, infeksiyalar), agenezis (Probst tutamlari, parallel 'poyga mashinasi' qorinchalar). Sperry — 1981 yil Nobel mukofoti.",
      },
      show: [{ concept: 'corpus-callosum', color: CC }],
      context: [{ ref: '@telencephalon' }],
      view: [0.05, -0.2, 1],
    },
    {
      title: { en: 'Check yourself', uz: "O'zingizni tekshiring" },
      text: { en: 'Tap the structure named in the question on the model.', uz: 'Savolda aytilgan tuzilmani modelda bosing.' },
      show: [{ concept: 'corpus-callosum' }, { concept: 'septum-of-telencephalon' }, { concept: 'fornix-of-forebrain' }, { concept: 'anterior-commissure' }, { concept: 'lateral-ventricle', side: 'left' }],
      context: [{ ref: '@telencephalon', side: 'left' }],
      view: [0.9, 0.3, 0.3],
      quiz: [
        { ask: { en: 'Which structure is the roof of the lateral ventricles?', uz: 'Yon qorinchalarning tomi qaysi tuzilma?' }, answer: ['corpus-callosum'] },
        { ask: { en: 'Find the sheet that separates the two frontal horns.', uz: "Ikki frontal shoxni ajratib turuvchi pardani toping." }, answer: ['septum-of-telencephalon'] },
        { ask: { en: 'Find the "zero point" of MNI space.', uz: "MNI fazosining 'nol nuqtasi'ni toping." }, answer: ['anterior-commissure'] },
        { ask: { en: 'What does the septum hang down to?', uz: "Shaffof to'siq pastda nimaga ilingan?" }, answer: ['fornix-of-forebrain'] },
      ],
    },
  ],
  sources: [
    { title: 'StatPearls — Neuroanatomy, Corpus Callosum', url: 'https://www.ncbi.nlm.nih.gov/books/NBK448209/' },
    { title: 'Hofer & Frahm 2006 — Topography of the human corpus callosum revisited (DTI)', url: 'https://doi.org/10.1016/j.neuroimage.2006.05.044' },
    { title: 'Wikipedia — Corpus callosum', url: 'https://en.wikipedia.org/wiki/Corpus_callosum' },
    { title: 'Wikipedia — Split-brain', url: 'https://en.wikipedia.org/wiki/Split-brain' },
    { title: 'Wikipedia — Septum pellucidum', url: 'https://en.wikipedia.org/wiki/Septum_pellucidum' },
  ],
}
