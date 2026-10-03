import { S } from './structures-brainstem'
import type { StructureInfo } from './types'

/**
 * Territories: the tissue a schematic leaves between its named nuclei and
 * tracts. Drawn as the section's ground (or a shaded region) so that every
 * point of a figure belongs to something nameable — a real section has no
 * "blank" tissue. Wording checked against Haines (10th ed.), Blumenfeld
 * (3rd ed.), Purves *Neuroscience* and the StatPearls chapters cited by the
 * sections themselves.
 */
export const GROUND_STRUCTURES: Record<string, StructureInfo> = {
  'tegm-med': S(
    'region',
    'Medullary tegmentum (reticular core)',
    "Uzunchoq miya tegmentumi (retikulyar o'zak)",
    'Tegmentum medullae oblongatae',
    'All of the medulla dorsal to the pyramids and olives that is not a named nucleus or tract: the reticular formation — gigantocellular, parvocellular and lateral reticular nuclei — woven through criss-crossing fibres, hence "reticular" (net-like). It contains the respiratory rhythm generator (pre-Bötzinger complex), the vasomotor centre (rostral ventrolateral medulla) and the origin of the reticulospinal tracts.',
    "Uzunchoq miyaning piramida va zaytunlardan dorsaldagi, nomlangan yadro yoki trakt bo'lmagan butun qismi: retikulyar formatsiya — gigantotsellyulyar, parvotsellyulyar va lateral retikulyar yadrolar — kesishgan tolalar orasida to'r kabi joylashgan (\"retikulyar\" = to'rsimon). Unda nafas ritmi generatori (pre-Bötzinger kompleksi), vazomotor markaz (rostral ventrolateral medulla) va retikulospinal yo'llarning boshlanishi bor.",
    'Dorsolateral tegmental infarct (vertebral / PICA) → lateral medullary (Wallenberg) syndrome; bilateral tegmental damage can abolish automatic breathing (Ondine curse) and cause central hypoventilation.',
    "Dorsolateral tegmental infarkt (vertebral / PICA) → lateral medullyar (Wallenberg) sindromi; ikki tomonlama tegmental zararlanish avtomatik nafasni yo'qotishi (Ondina la'nati) va markaziy gipoventilyatsiyaga olib kelishi mumkin.",
    'bs-tegmentum-of-medulla-oblongata',
  ),
  'tegm-pons': S(
    'region',
    'Pontine tegmentum (reticular core)',
    "Ko'prik tegmentumi (retikulyar o'zak)",
    'Tegmentum pontis',
    'The dorsal pons above the trapezoid body / medial lemniscus, continuous with the medullary and midbrain tegmentum. Between its named nuclei (V–VIII, PPRF, locus coeruleus, parabrachial) lie the caudal and oral pontine reticular nuclei (PnC, PnO): REM-sleep atonia, horizontal gaze, startle and arousal (ascending reticular activating system).',
    "Trapetsiyasimon tana / medial lemniskdan yuqoridagi dorsal ko'prik; uzunchoq va o'rta miya tegmentumi bilan tutash. Nomlangan yadrolar (V–VIII, PPRF, ko'k dog', parabraxial) orasida kaudal va oral pontin retikulyar yadrolar (PnC, PnO) yotadi: REM uyqu atoniyasi, gorizontal nigoh, cho'chish reaksiyasi va uyg'oqlik (ko'tariluvchi retikulyar faollashtiruvchi tizim).",
    'Dorsal pontine lesions → horizontal gaze palsy, one-and-a-half syndrome, REM-sleep behaviour disorder; bilateral paramedian tegmental damage → coma.',
    'Dorsal ko\'prik zararlanishi → gorizontal nigoh falaji, "bir yarim" sindromi, REM uyqu xulq buzilishi; ikki tomonlama paramedian tegmental zararlanish → koma.',
    'bs-pontine-tegmentum',
  ),
  'tegm-mid': S(
    'region',
    'Midbrain tegmentum (reticular core)',
    "O'rta miya tegmentumi (retikulyar o'zak)",
    'Tegmentum mesencephali',
    'The midbrain between the periaqueductal grey and the substantia nigra. Its unnamed core is the mesencephalic reticular formation (mRt, cuneiform and subcuneiform nuclei — the "mesencephalic locomotor region"), traversed by the lemnisci, the central tegmental tract and the superior cerebellar peduncle fibres.',
    "O'rta miyaning periakveduktal kulrang modda va qora modda orasidagi qismi. Nomsiz o'zagi — mezensefal retikulyar formatsiya (mRt, ponasimon va ponasimon-osti yadrolar — \"mezensefal lokomotor soha\"); undan lemniskalar, markaziy tegmental trakt va yuqori miyacha oyoqchasi tolalari o'tadi.",
    'Paramedian tegmental infarct → Claude / Benedikt syndromes; bilateral lesions of the reticular core → hypersomnolence, akinetic mutism or coma.',
    "Paramedian tegmental infarkt → Claude / Benedikt sindromlari; retikulyar o'zakning ikki tomonlama zararlanishi → gipersomniya, akinetik mutizm yoki koma.",
    'bs-midbrain-tegmentum',
  ),
  'basis-pontis': S(
    'region',
    'Basis pontis (basilar pons)',
    "Ko'prik asosi (bazilyar qism)",
    'Pars basilaris pontis',
    'The ventral pons: pontine grey nuclei scattered among longitudinal corticospinal, corticobulbar and corticopontine bundles and the transverse pontocerebellar fibres that cross to form the opposite middle cerebellar peduncle — the relay of the cortico-ponto-cerebellar loop (≈20 million neurons per side).',
    "Ventral ko'prik: bo'ylama kortikospinal, kortikobulbar va kortikopontin tutamlar hamda qarama-qarshi o'rta miyacha oyoqchasini hosil qilish uchun kesishuvchi ko'ndalang pontotserebellyar tolalar orasida sochilgan ko'prik kulrang yadrolari — kortiko-ponto-tserebellyar halqaning bo'g'ini (har tomonda ≈20 million neyron).",
    'Bilateral ventral pontine infarct (basilar artery) → locked-in syndrome: quadriplegia and anarthria with vertical eye movements and blinking preserved. Unilateral paramedian lacune → pure motor hemiparesis, ataxic hemiparesis or dysarthria–clumsy hand.',
    "Ikki tomonlama ventral ko'prik infarkti (bazilyar arteriya) → \"qamalib qolish\" (locked-in) sindromi: tetraplegiya va anartriya, vertikal ko'z harakatlari va ko'z qisish saqlanadi. Bir tomonlama paramedian lakuna → sof harakat gemiparezi, ataktik gemiparez yoki dizartriya–\"qo'pol qo'l\".",
    'bs-basilar-part-of-pons',
  ),
  'cb-wm': S(
    'region',
    'Cerebellar white matter (medullary body)',
    'Miyacha oq moddasi (medullyar tana)',
    'Corpus medullare cerebelli',
    'The white core of each hemisphere in which the deep nuclei are embedded: mossy and climbing fibres running out to the cortex and Purkinje-cell axons running in to the deep nuclei. On a sagittal cut its branching into the folia gives the "arbor vitae" (tree of life).',
    "Har bir yarim sharning ichki oq o'zagi, chuqur yadrolar unga botib turadi: po'stloqqa boruvchi moxsimon va chirmashuvchi tolalar hamda chuqur yadrolarga qaytuvchi Purkinje hujayra aksonlari. Sagittal kesimda bargchalarga shoxlanishi \"hayot daraxti\" (arbor vitae) ko'rinishini beradi.",
    'Demyelination (multiple sclerosis), toxic leukoencephalopathy and multiple-system atrophy (MSA-C, "hot-cross-bun" and middle-peduncle signs on MRI) → progressive ataxia.',
    "Demiyelinizatsiya (tarqoq skleroz), toksik leykoensefalopatiya va ko'p tizimli atrofiya (MSA-C, MRTda \"hot-cross-bun\" va o'rta oyoqcha belgilari) → zo'rayib boruvchi ataksiya.",
    'cerebellum',
  ),
  'hemi-wm': S(
    'region',
    'Cerebral white matter (corona radiata)',
    'Yarim shar oq moddasi (nurli toj)',
    'Corona radiata',
    'White matter around the deep grey nuclei: projection fibres fanning out of the internal capsule (corona radiata), association bundles (superior longitudinal, arcuate, cingulum) and commissural fibres of the corpus callosum.',
    "Chuqur kulrang yadrolar atrofidagi oq modda: ichki kapsuladan yelpig'ich kabi tarqaluvchi proyeksion tolalar (nurli toj), assotsiativ tutamlar (yuqori bo'ylama, yoysimon, belbog') va qadoqsimon tananing komissural tolalari.",
    'Periventricular lesions: multiple-sclerosis plaques ("Dawson fingers"), small-vessel disease (leukoaraiosis, lacunes), periventricular leukomalacia of the preterm brain (spastic diplegia).',
    'Periventrikulyar o\'choqlar: tarqoq skleroz pilakchalari ("Dawson barmoqlari"), mayda tomirlar kasalligi (leykoarayoz, lakunalar), chala tug\'ilganlarda periventrikulyar leykomalyatsiya (spastik diplegiya).',
  ),
  thal: S(
    'relay',
    'Thalamus',
    'Talamus',
    'Thalamus',
    'Paired egg-shaped grey mass of the dorsal diencephalon; the internal medullary lamina divides it into anterior, medial and lateral groups. Almost every pathway to the cortex relays here (only olfaction bypasses it), and the thalamocortical loop gates attention, sleep and consciousness.',
    "Dorsal diensefalonning juft tuxumsimon kulrang massasi; ichki medullyar plastinka uni old, medial va lateral guruhlarga ajratadi. Po'stloqqa boruvchi deyarli barcha yo'llar shu yerda almashinadi (faqat hid bilish chetlab o'tadi); talamokortikal halqa diqqat, uyqu va ongni boshqaradi.",
    'Thalamic infarcts → contralateral hemisensory loss, Déjerine–Roussy central pain, thalamic aphasia / amnesia; bilateral paramedian (artery of Percheron) → coma and vertical gaze palsy.',
    "Talamus infarktlari → qarama-qarshi gemigipesteziya, Déjerine–Roussy markaziy og'rig'i, talamik afaziya / amneziya; ikki tomonlama paramedian (Percheron arteriyasi) → koma va vertikal nigoh falaji.",
    'thalamus',
  ),
  'hypo-grey': S(
    'region',
    'Hypothalamic grey (periventricular & medial zones)',
    'Gipotalamus kulrang moddasi (periventrikulyar va medial zonalar)',
    'Substantia grisea hypothalami',
    'The tissue between the named hypothalamic nuclei: a thin periventricular layer of small neuroendocrine cells lining the 3rd ventricle (TRH, CRH, somatostatin and dopamine to the median eminence) and the loosely packed medial-zone neuropil. In Nissl stains the nuclei merge gradually into it — the sharp borders of schematics are a teaching convention.',
    "Nomlangan gipotalamus yadrolari orasidagi to'qima: III qorincha devorini qoplovchi mayda neyroendokrin hujayralarning yupqa periventrikulyar qavati (median eminensiyaga TRH, CRH, somatostatin va dofamin) hamda siyrak joylashgan medial zona neyropili. Nissl bo'yog'ida yadrolar unga asta-sekin o'tib ketadi — sxemalardagi keskin chegaralar o'quv shartliligi.",
    'Mass lesions (craniopharyngioma, hamartoma, germinoma, sarcoid) → diabetes insipidus, hypopituitarism, hyperphagic obesity, temperature and sleep dysregulation; hamartoma → gelastic seizures and precocious puberty.',
    'Hajmli jarayonlar (kraniofaringioma, gamartoma, germinoma, sarkoidoz) → qandsiz diabet, gipopituitarizm, giperfagik semizlik, harorat va uyqu boshqaruvining buzilishi; gamartoma → gelastik tutqanoqlar va erta jinsiy yetilish.',
    'hypothalamus',
  ),
}
