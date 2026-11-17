import type { L10n } from './types'
import { PATHWAYS, type BodySide, type LesionLevel, type Pathway } from './pathways'

/**
 * Lesion simulator. A lesion is a level, a side and a zone (the whole half,
 * or a vascular territory such as the paramedian or lateral medulla). Which
 * long tracts it cuts — and on which side of the body their deficit appears —
 * is computed from data/pathways alone: each station says at which levels and
 * in which zones its fibres run, and on which side. The pathways are traced
 * for the right body half, so a lesion on the station's side gives right-body
 * signs and one on the other side hits the mirror copy (left-body signs).
 *
 * The reverse mode runs every level × side × zone through the same function
 * and keeps those whose signature matches the findings — which shows exactly
 * why long-tract signs alone cannot place a lesion and cranial-nerve or
 * cortical signs are needed (each zone's `extra`).
 */

export interface LesionZone {
  id: string
  name: L10n
  /** Classic syndrome of this territory, with what the long tracts do not tell (cranial nerves, cortex). */
  syndrome?: { name: L10n; extra: L10n; source?: { title: string; url: string } }
}

export interface LevelInfo {
  id: LesionLevel
  name: L10n
  /** Plate to open for this level. */
  plate?: string
  zones: LesionZone[]
}

const SP = (title: string, nbk: string) => ({ title: `StatPearls — ${title}`, url: `https://www.ncbi.nlm.nih.gov/books/${nbk}/` })
const WHOLE: L10n = { en: 'Whole half', uz: 'Butun yarmi' }

export const LEVELS: LevelInfo[] = [
  {
    id: 'cortex',
    name: { en: 'Cortex', uz: "Po'stloq" },
    zones: [
      { id: 'all', name: { en: 'Central region', uz: 'Markaziy soha' } },
      {
        id: 'motor',
        name: { en: 'Precentral gyrus', uz: 'Oldingi markaziy pushta' },
        syndrome: {
          name: { en: 'Motor cortex (ACA / MCA)', uz: "Harakat po'stlog'i (ACA / MCA)" },
          extra: {
            en: 'Distribution tells the artery: leg-predominant weakness = ACA (medial surface), face and arm = MCA (convexity). Aphasia with a dominant (usually left) MCA lesion, neglect with a non-dominant one.',
            uz: "Taqsimot arteriyani ko'rsatadi: oyoqda ustun zaiflik = ACA (medial yuza), yuz va qo'l = MCA (qavariq yuza). Dominant (odatda chap) MCA o'chog'ida afaziya, dominant bo'lmaganda neglekt.",
          },
          source: SP('Middle Cerebral Artery Stroke', 'NBK556132'),
        },
      },
      {
        id: 'sensory',
        name: { en: 'Postcentral gyrus', uz: 'Orqa markaziy pushta' },
        syndrome: {
          name: { en: 'Cortical sensory loss', uz: "Po'stloq sezgi buzilishi" },
          extra: {
            en: 'Primary modalities are only blunted; discriminative ones are lost — astereognosis, agraphaesthesia, two-point discrimination, extinction.',
            uz: "Birlamchi sezgi faqat susayadi; farqlovchi sezgi yo'qoladi — astereognoz, agrafesteziya, ikki nuqtani farqlash, so'nish.",
          },
          source: SP('Anterior Cerebral Artery Stroke', 'NBK537333'),
        },
      },
    ],
  },
  {
    id: 'capsule',
    name: { en: 'Internal capsule', uz: 'Ichki kapsula' },
    plate: 'bg-capsule-axial',
    zones: [
      { id: 'all', name: { en: 'Posterior limb, whole', uz: 'Orqa oyoq, butunlay' } },
      {
        id: 'motor',
        name: { en: 'Posterior limb, anterior part', uz: 'Orqa oyoqning old qismi' },
        syndrome: {
          name: { en: 'Pure motor lacune', uz: 'Sof harakat lakunasi' },
          extra: {
            en: 'Face, arm and leg equally weak, no sensory, visual or cognitive signs — the commonest lacunar syndrome (lenticulostriate or anterior choroidal artery).',
            uz: "Yuz, qo'l va oyoq teng zaif; sezgi, ko'rish va kognitiv belgilar yo'q — eng ko'p uchraydigan lakunar sindrom (lentikulostriar yoki oldingi xoroid arteriya).",
          },
          source: SP('Lacunar Stroke', 'NBK563216'),
        },
      },
    ],
  },
  {
    id: 'thalamus',
    name: { en: 'Thalamus (VPL)', uz: 'Talamus (VPL)' },
    plate: 'thalamus-coronal',
    zones: [
      {
        id: 'all',
        name: { en: 'Ventral posterior nucleus', uz: 'Ventral orqa yadro' },
        syndrome: {
          name: { en: 'Pure sensory stroke → Dejerine–Roussy', uz: 'Sof sezgi insulti → Dejerine–Roussy' },
          extra: {
            en: 'All modalities lost on the opposite face (VPM) and body (VPL), no weakness; weeks later a burning central pain may follow (thalamogeniculate branches of the PCA).',
            uz: "Qarama-qarshi yuz (VPM) va tanada (VPL) barcha sezgi turlari yo'qoladi, zaiflik yo'q; bir necha haftadan keyin achishtiruvchi markaziy og'riq paydo bo'lishi mumkin (PCA talamogenikulyar shoxlari).",
          },
          source: SP('Dejerine-Roussy Syndrome', 'NBK519047'),
        },
      },
    ],
  },
  {
    id: 'midbrain',
    name: { en: 'Midbrain', uz: "O'rta miya" },
    plate: 'midbrain-superior-colliculus',
    zones: [
      { id: 'all', name: WHOLE },
      {
        id: 'ventral',
        name: { en: 'Ventral (crus)', uz: 'Ventral (oyoqcha)' },
        syndrome: {
          name: { en: 'Weber syndrome', uz: 'Weber sindromi' },
          extra: {
            en: 'Plus ipsilateral oculomotor palsy (eye down and out, ptosis, dilated pupil).',
            uz: "Qo'shimcha: o'sha tomonda III nerv falaji (ko'z pastga-tashqariga, ptoz, kengaygan qorachiq).",
          },
          source: SP('Weber Syndrome', 'NBK559158'),
        },
      },
      {
        id: 'dorsal',
        name: { en: 'Tegmentum', uz: 'Tegmentum' },
        syndrome: {
          name: { en: 'Claude / Benedikt (tegmental)', uz: 'Claude / Benedikt (tegmental)' },
          extra: {
            en: 'Plus ipsilateral III palsy with contralateral ataxia (red nucleus / SCP — Claude) or tremor and choreoathetosis (Benedikt).',
            uz: "Qo'shimcha: o'sha tomonda III falaji va qarama-qarshi ataksiya (qizil yadro / SCP — Claude) yoki tremor va xoreoatetoz (Benedikt).",
          },
          source: SP('Benedikt Syndrome', 'NBK560509'),
        },
      },
    ],
  },
  {
    id: 'pons',
    name: { en: 'Pons', uz: "Ko'prik" },
    plate: 'pons-facial-colliculus',
    zones: [
      { id: 'all', name: WHOLE },
      {
        id: 'medial',
        name: { en: 'Paramedian (basilar branches)', uz: 'Paramedian (bazilyar shoxlari)' },
        syndrome: {
          name: { en: 'Millard–Gubler / ventral pontine', uz: "Millard–Gubler / ventral ko'prik" },
          extra: {
            en: 'At the facial colliculus level: plus ipsilateral VI and VII palsy (crossed hemiplegia). Bilateral: locked-in syndrome.',
            uz: "Yuz do'mboqchasi darajasida: qo'shimcha o'sha tomonda VI va VII falaji (kesishgan gemiplegiya). Ikki tomonlama: 'qamalib qolish' sindromi.",
          },
          source: SP('Millard-Gubler Syndrome', 'NBK532907'),
        },
      },
      {
        id: 'ventral',
        name: { en: 'Basis pontis (lacune)', uz: "Ko'prik asosi (lakuna)" },
        syndrome: {
          name: { en: 'Pure motor lacune / dysarthria–clumsy hand', uz: "Sof harakat lakunasi / dizartriya – qo'l noaniqligi" },
          extra: {
            en: 'A small paramedian perforator infarct in the basis pontis can mimic a capsular lacune; dysarthria with a clumsy hand, or ataxic hemiparesis (weakness and ataxia in the same limbs, from pontocerebellar fibres), points to the pons.',
            uz: "Ko'prik asosidagi kichik paramedian perforator infarkti kapsula lakunasiga o'xshashi mumkin; dizartriya bilan qo'l noaniqligi yoki ataktik gemiparez (bir xil oyoq-qo'llarda zaiflik va ataksiya, ko'prik-miyacha tolalaridan) ko'prikni ko'rsatadi.",
          },
          source: SP('Lacunar Stroke', 'NBK563216'),
        },
      },
      {
        id: 'lateral',
        name: { en: 'Lateral (AICA / SCA)', uz: 'Lateral (AICA / SCA)' },
        syndrome: {
          name: { en: 'Lateral pontine', uz: "Lateral ko'prik" },
          extra: {
            en: 'Plus ipsilateral facial pain/temperature loss, facial weakness, deafness and vertigo (AICA), ipsilateral ataxia and Horner syndrome.',
            uz: "Qo'shimcha: o'sha tomonda yuz og'riq/harorat sezgisi yo'qolishi, yuz zaifligi, karlik va bosh aylanishi (AICA), o'sha tomonda ataksiya va Horner sindromi.",
          },
        },
      },
    ],
  },
  {
    id: 'medulla-rostral',
    name: { en: 'Medulla (olive level)', uz: 'Uzunchoq miya (zaytun darajasi)' },
    plate: 'medulla-olive',
    zones: [
      { id: 'all', name: WHOLE },
      {
        id: 'medial',
        name: { en: 'Paramedian', uz: 'Paramedian' },
        syndrome: {
          name: { en: 'Medial medullary (Dejerine)', uz: 'Medial medullyar (Dejerine)' },
          extra: { en: 'Plus ipsilateral tongue weakness — it deviates toward the lesion (XII).', uz: "Qo'shimcha: o'sha tomonda til zaifligi — til o'choq tomonga og'adi (XII)." },
          source: SP('Medial Medullary Syndrome', 'NBK560590'),
        },
      },
      {
        id: 'lateral',
        name: { en: 'Lateral (PICA / vertebral)', uz: 'Lateral (PICA / vertebral)' },
        syndrome: {
          name: { en: 'Lateral medullary (Wallenberg)', uz: 'Lateral medullyar (Wallenberg)' },
          extra: {
            en: 'Plus ipsilateral facial pain/temperature loss (spinal V) — crossed sensory loss — ataxia, vertigo, nystagmus, dysphagia and hoarseness (nucleus ambiguus), Horner syndrome. No weakness.',
            uz: "Qo'shimcha: o'sha tomonda yuzda og'riq/harorat sezgisi yo'qoladi (spinal V) — kesishgan sezgi buzilishi — ataksiya, bosh aylanishi, nistagm, disfagiya va xirillash (ikki ma'noli yadro), Horner sindromi. Zaiflik yo'q.",
          },
          source: SP('Lateral Medullary Syndrome (Wallenberg Syndrome)', 'NBK551670'),
        },
      },
    ],
  },
  {
    id: 'medulla-caudal',
    name: { en: 'Medulla (decussations)', uz: 'Uzunchoq miya (kesishmalar)' },
    plate: 'medulla-sensory-decussation',
    zones: [
      { id: 'all', name: WHOLE },
      {
        id: 'medial',
        name: { en: 'Paramedian (decussations)', uz: 'Paramedian (kesishmalar)' },
        syndrome: {
          name: { en: 'Cervicomedullary junction', uz: "Bo'yin-medullyar chegara" },
          extra: {
            en: 'Fibres are crossing here: a small lesion can split arm and leg ("cruciate hemiplegia"); a midline lesion is bilateral. Typical of foramen magnum tumours.',
            uz: "Bu yerda tolalar kesishmoqda: kichik o'choq qo'l va oyoqni ajratishi mumkin ('krestsimon gemiplegiya'); o'rta chiziqdagi o'choq ikki tomonlama. Katta teshik o'smalariga xos.",
          },
        },
      },
      { id: 'dorsal', name: { en: 'Dorsal (gracile / cuneate)', uz: 'Dorsal (nozik / ponasimon)' } },
      { id: 'lateral', name: { en: 'Lateral', uz: 'Lateral' } },
    ],
  },
  {
    id: 'cord',
    name: { en: 'Cervical cord', uz: "Orqa miya (bo'yin)" },
    plate: 'medulla-pyramidal-decussation',
    zones: [
      {
        id: 'all',
        name: { en: 'Hemisection', uz: 'Yarim kesilish' },
        syndrome: {
          name: { en: 'Brown-Séquard syndrome', uz: 'Brown-Séquard sindromi' },
          extra: {
            en: 'Plus ipsilateral lower motor neuron signs and a band of total anaesthesia at the level itself; pain/temperature loss on the other side begins 1–2 segments below (fibres cross obliquely).',
            uz: "Qo'shimcha: shu segmentda o'sha tomonda pastki motoneyron belgilari va to'liq sezgisizlik tasmasi; qarama-qarshi tomonda og'riq/harorat yo'qolishi 1–2 segment pastdan boshlanadi (tolalar qiya kesishadi).",
          },
          source: SP('Brown-Séquard Syndrome', 'NBK538135'),
        },
      },
      {
        id: 'dorsal',
        name: { en: 'Dorsal columns', uz: 'Orqa ustunlar' },
        syndrome: {
          name: { en: 'Posterior cord (B12, tabes)', uz: 'Orqa ustun (B12, tabes)' },
          extra: {
            en: 'Sensory ataxia with positive Romberg. Usually bilateral (B12 / copper deficiency, tabes dorsalis); B12 also involves the lateral columns — subacute combined degeneration.',
            uz: "Romberg musbat sezgi ataksiyasi. Odatda ikki tomonlama (B12 / mis tanqisligi, tabes dorsalis); B12 lateral ustunlarni ham oladi — subakut qo'shma degeneratsiya.",
          },
          source: SP('Spinal Cord Subacute Combined Degeneration', 'NBK560728'),
        },
      },
      {
        id: 'ventral',
        name: { en: 'Anterior two-thirds', uz: 'Oldingi uchdan ikki qismi' },
        syndrome: {
          name: { en: 'Anterior cord (anterior spinal artery)', uz: 'Oldingi ustun (oldingi spinal arteriya)' },
          extra: {
            en: 'The artery is midline, so the syndrome is usually bilateral: paraplegia or tetraplegia and pain/temperature loss below the level, with vibration and position spared.',
            uz: "Arteriya o'rta chiziqda, shuning uchun sindrom odatda ikki tomonlama: sathdan pastda para- yoki tetraplegiya va og'riq/harorat yo'qolishi, tebranish va holat saqlanadi.",
          },
          source: SP('Anterior Cord Syndrome (Ventral Cord Syndrome)', 'NBK541011'),
        },
      },
    ],
  },
]
export const LEVEL_BY_ID = new Map(LEVELS.map((l) => [l.id, l]))

export interface Lesion {
  level: LesionLevel
  side: BodySide
  zone: string
}

/** Body sides whose share of a pathway the lesion cuts (empty: spared). */
export function cutBy(p: Pathway, lesion: Lesion): Set<BodySide> {
  const out = new Set<BodySide>()
  for (const st of p.stations) {
    const runs = [{ level: st.level, zones: st.zones }, ...(st.also ?? [])]
    if (!runs.some((r) => r.level === lesion.level && r.zones.includes(lesion.zone))) continue
    if (st.midline && runs[0].level === lesion.level) (out.add('L'), out.add('R'))
    else out.add(lesion.side === st.side ? 'R' : 'L')
  }
  return out
}

export type Finding = BodySide | 'none'
/** One finding per pathway id. */
export type Findings = Record<string, Finding>

/** The pathway signature of a lesion: which body side each tract's deficit is on. 'B' = both. */
export function signature(lesion: Lesion): Record<string, BodySide | 'none' | 'B'> {
  const out: Record<string, BodySide | 'none' | 'B'> = {}
  for (const p of PATHWAYS) {
    const s = cutBy(p, lesion)
    out[p.id] = s.size === 0 ? 'none' : s.size === 2 ? 'B' : [...s][0]
  }
  return out
}

/** Every one-sided lesion whose long-tract signature equals the findings (at least one finding required). */
export function localise(findings: Findings): Lesion[] {
  if (PATHWAYS.every((p) => (findings[p.id] ?? 'none') === 'none')) return []
  const out: Lesion[] = []
  for (const lv of LEVELS)
    for (const side of ['L', 'R'] as const)
      for (const z of lv.zones) {
        const lesion = { level: lv.id, side, zone: z.id }
        const sig = signature(lesion)
        if (PATHWAYS.every((p) => sig[p.id] === (findings[p.id] ?? 'none'))) out.push(lesion)
      }
  return out
}

// ── Cranial-nerve and other "level" signs ──────────────────────────────

/**
 * What places a brainstem lesion: the cranial-nerve nuclei and fascicles,
 * cerebellar connections and the descending sympathetics caught with the
 * long tracts. A sign is given by the plate structures inside the lesion's
 * territory (ui/lesionSigns runs the territory over the level's own plate),
 * or — for fibres the plates do not draw — by an explicit list of
 * territories. Nuclei and fascicles give ipsilateral signs; the red nucleus
 * (after the SCP has crossed) and the corticobulbar fibres to the lower face
 * give contralateral ones.
 */
export interface CranialSign {
  id: string
  name: L10n
  /** For a 3D label. */
  short: L10n
  /** What the examiner finds. */
  detail: L10n
  items?: { id: string; side: 'ipsi' | 'contra' }[]
  /** Item signs only count at these levels. */
  levels?: LesionLevel[]
  zones?: { level: LesionLevel; zones: string[]; side: 'ipsi' | 'contra' }[]
}

const ipsi = (...ids: string[]) => ids.map((id) => ({ id, side: 'ipsi' as const }))

export const CRANIAL_SIGNS: CranialSign[] = [
  {
    id: 'cn3',
    short: { en: 'III palsy', uz: 'III falaji' },
    name: { en: 'Oculomotor palsy (III)', uz: 'III nerv falaji' },
    detail: { en: 'Ptosis, eye down and out, dilated unreactive pupil.', uz: "Ptoz, ko'z pastga-tashqariga, kengaygan va reaksiyasiz qorachiq." },
    items: ipsi('n3', 'n3-root', 'ew'),
  },
  {
    id: 'ino',
    short: { en: 'INO (MLF)', uz: 'INO (MLF)' },
    name: { en: 'Internuclear ophthalmoplegia (MLF)', uz: 'Internuklear oftalmoplegiya (MLF)' },
    detail: {
      en: 'On looking away from the lesion the eye on its side does not adduct; the abducting eye beats in nystagmus. Convergence spared.',
      uz: "O'choqdan teskari tomonga qaraganda o'sha tomondagi ko'z ichkariga kelmaydi; tashqariga ketgan ko'zda nistagm. Konvergensiya saqlanadi.",
    },
    items: ipsi('mlf'),
    levels: ['pons', 'midbrain'],
  },
  {
    id: 'gaze',
    short: { en: 'Gaze palsy', uz: 'Qarash falaji' },
    name: { en: 'Horizontal gaze palsy (VI nucleus / PPRF)', uz: 'Gorizontal qarash falaji (VI yadrosi / PPRF)' },
    detail: {
      en: 'Neither eye can look toward the side of the lesion — the abducens nucleus drives both eyes (via the MLF), so a nuclear lesion gives a gaze palsy, not a lone lateral rectus palsy.',
      uz: "Ikkala ko'z ham o'choq tomonga qaray olmaydi — VI yadrosi ikkala ko'zni boshqaradi (MLF orqali), shuning uchun yadro o'chog'i alohida lateral to'g'ri mushak falajini emas, qarash falajini beradi.",
    },
    items: ipsi('n6', 'pprf'),
  },
  {
    id: 'cn6',
    short: { en: 'VI palsy', uz: 'VI falaji' },
    name: { en: 'Abducens palsy (VI fascicle)', uz: 'VI nerv falaji (fastikula)' },
    detail: {
      en: 'The eye on the side of the lesion cannot abduct; horizontal diplopia worse looking toward it.',
      uz: "O'choq tomondagi ko'z tashqariga burilmaydi; o'sha tomonga qaraganda kuchayadigan gorizontal diplopiya.",
    },
    items: ipsi('n6-root'),
  },
  {
    id: 'cn7',
    short: { en: 'Facial palsy (VII)', uz: 'Yuz falaji (VII)' },
    name: { en: 'Peripheral facial palsy (VII)', uz: 'Yuzning periferik falaji (VII)' },
    detail: {
      en: 'The whole half of the face, forehead included; with the genu, often together with the VI nucleus (facial colliculus).',
      uz: "Yuzning butun yarmi, peshona ham; tizza sohasida ko'pincha VI yadrosi bilan birga (yuz do'mboqchasi).",
    },
    items: ipsi('n7', 'n7-root', 'n7-genu'),
  },
  {
    id: 'face-central',
    short: { en: 'Central facial palsy', uz: 'Markaziy yuz falaji' },
    name: { en: 'Central facial palsy (corticobulbar)', uz: 'Yuzning markaziy falaji (kortikobulbar)' },
    detail: {
      en: 'Lower face only on the opposite side — the forehead is spared because its motor neurons get input from both hemispheres.',
      uz: 'Faqat qarama-qarshi tomonda yuzning pastki qismi — peshona saqlanadi, chunki uning motoneyronlari ikkala yarim shardan tola oladi.',
    },
    zones: [
      { level: 'cortex', zones: ['all', 'motor'], side: 'contra' },
      { level: 'capsule', zones: ['all', 'motor'], side: 'contra' },
      { level: 'midbrain', zones: ['all', 'ventral'], side: 'contra' },
    ],
  },
  {
    id: 'face-pain',
    short: { en: 'Face pain/temp (V)', uz: "Yuz og'riq/harorat (V)" },
    name: { en: 'Facial pain & temperature loss (spinal V)', uz: "Yuzda og'riq va harorat sezgisi yo'qolishi (spinal V)" },
    detail: {
      en: 'Same side of the face; with the ALS cut too, the body loss is on the other side — crossed (alternating) sensory loss.',
      uz: "Yuzning o'sha tomonida; ALS ham kesilsa, tanada qarama-qarshi tomonda — kesishgan (almashinuvchi) sezgi buzilishi.",
    },
    items: ipsi('sp5t', 'sp5n'),
    // The tract reaches C2–C3, but a cervical hemisection is taught (and examined) without the face.
    levels: ['pons', 'medulla-rostral', 'medulla-caudal'],
  },
  {
    id: 'cn5',
    short: { en: 'V touch / jaw', uz: "V teginish / jag'" },
    name: { en: 'Trigeminal touch / jaw weakness (V)', uz: 'Yuz teginish sezgisi / chaynov zaifligi (V)' },
    detail: {
      en: 'Facial touch lost (principal nucleus), jaw deviates toward the lesion on opening (motor nucleus).',
      uz: "Yuzda teginish sezgisi yo'qoladi (asosiy yadro), og'iz ochilganda jag' o'choq tomonga og'adi (harakat yadrosi).",
    },
    items: ipsi('pr5', 'mo5', 'n5-root'),
  },
  {
    id: 'vestib',
    short: { en: 'Vertigo, nystagmus', uz: 'Bosh aylanishi, nistagm' },
    name: { en: 'Vertigo, nystagmus (vestibular nuclei)', uz: 'Bosh aylanishi, nistagm (vestibulyar yadrolar)' },
    detail: { en: 'Vertigo, vomiting, nystagmus, falling toward the lesion.', uz: "Bosh aylanishi, qusish, nistagm, o'choq tomonga yiqilish." },
    items: ipsi('vn'),
  },
  {
    id: 'hearing',
    short: { en: 'Hearing loss', uz: 'Eshitish pasayishi' },
    name: { en: 'Hearing loss (VIII / cochlear nuclei)', uz: 'Eshitish pasayishi (VIII / koxlear yadrolar)' },
    detail: {
      en: 'Only at the root or cochlear nuclei: above them hearing is carried on both sides, so a central lesion does not deafen one ear.',
      uz: "Faqat ildiz yoki koxlear yadrolar darajasida: ulardan yuqorida eshitish ikki tomonlama o'tadi, shuning uchun markaziy o'choq bir quloqni kar qilmaydi.",
    },
    items: ipsi('cochn', 'n8-root'),
  },
  {
    id: 'bulbar',
    short: { en: 'Dysphagia, dysphonia', uz: 'Disfagiya, disfoniya' },
    name: { en: 'Dysphagia, dysphonia (nucleus ambiguus)', uz: "Disfagiya, disfoniya (ikki ma'noli yadro)" },
    detail: {
      en: 'Hoarse voice, difficulty swallowing; the palate and uvula pull away from the lesion, absent gag on that side.',
      uz: "Xirillagan ovoz, yutish qiyinligi; yumshoq tanglay va tilcha o'choqdan teskari tomonga tortiladi, o'sha tomonda qusish refleksi yo'q.",
    },
    items: ipsi('amb', 'n9-root', 'n10-root'),
  },
  {
    id: 'cn12',
    short: { en: 'Tongue (XII)', uz: 'Til (XII)' },
    name: { en: 'Tongue weakness (XII)', uz: 'Til zaifligi (XII)' },
    detail: {
      en: 'The protruded tongue deviates toward the lesion; atrophy and fasciculations later.',
      uz: "Chiqarilgan til o'choq tomonga og'adi; keyinroq atrofiya va fassikulyatsiyalar.",
    },
    items: ipsi('n12', 'n12-root'),
  },
  {
    id: 'ataxia',
    short: { en: 'Ataxia', uz: 'Ataksiya' },
    name: { en: 'Limb ataxia (cerebellar connections)', uz: "Oyoq-qo'l ataksiyasi (miyacha aloqalari)" },
    detail: {
      en: 'Below the SCP decussation (ICP, MCP, SCP) on the same side; at the red nucleus, after the crossing, on the opposite side (Claude).',
      uz: "SCP kesishmasidan pastda (ICP, MCP, SCP) o'sha tomonda; qizil yadro darajasida, kesishmadan keyin — qarama-qarshi tomonda (Claude).",
    },
    items: [...ipsi('icp', 'mcp', 'scp'), { id: 'rn', side: 'contra' }],
  },
  {
    id: 'horner',
    short: { en: 'Horner', uz: 'Horner' },
    name: { en: 'Horner syndrome (descending sympathetics)', uz: 'Horner sindromi (tushuvchi simpatik tolalar)' },
    detail: {
      en: 'Ptosis, miosis, facial anhidrosis on the same side: the hypothalamospinal fibres run in the lateral tegmentum to the cord (T1).',
      uz: "O'sha tomonda ptoz, mioz, yuzda terlash yo'qligi: gipotalamospinal tolalar lateral tegmentumda orqa miyagacha (T1) tushadi.",
    },
    zones: [
      { level: 'pons', zones: ['all', 'lateral'], side: 'ipsi' },
      { level: 'medulla-rostral', zones: ['all', 'lateral'], side: 'ipsi' },
      { level: 'medulla-caudal', zones: ['all', 'lateral'], side: 'ipsi' },
      { level: 'cord', zones: ['all'], side: 'ipsi' },
    ],
  },
]
export const CRANIAL_BY_ID = new Map(CRANIAL_SIGNS.map((c) => [c.id, c]))
