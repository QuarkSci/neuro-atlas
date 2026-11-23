# AG-9 — Kontent: EVD va DBS protsedura ssenariylari (OP-1, OP-2 uchun xom ashyo)

Branch: `ag/AG-9` · Sana: `2026-11-23`

## Nima qilindi
Jarrohlik simulyatori (`docs/SURGERY.md` §2 — SX-3 EVD va SX-6 DBS) uchun ikkita PhD/neyroxirurg darajasidagi protsedura spetsifikatsiyasi yozildi (faqat hujjat, `src/` ga tegilmadi):

1. **`docs/research/procedures/evd.md` (OP-1 / SX-3 EVD):**
   - Ko'rsatmalar (o'tkir gidrosefaliya, og'ir TBI, ICH/IVH, VP shunt infeksiyasi) va qarshi ko'rsatmalar (koagulopatiya chegaralari: INR, trombotsitlar, antikoagulyantlar — Fried et al. 2016 NCS Consensus).
   - Bemor holati (30°–45° chalqancha, qat'iy neytral bosh, o'ng nodominant yarim shar).
   - Anatomik orientirlar mm da: Kocher nuqtasi (naziondan 100–120 mm, koronar chokdan 10–20 mm oldinga, o'rta chiziqdan 25–30 mm lateral) + muqobil nuqtalar (Frazier, Keen, Dandy, Paine — Morone et al. 2019).
   - SX-3 avtomatik Kocher nuqtasi algoritmi (`g-frontal-bone` ∩ `g-right-parietal-bone` koronar choki → `g-interventricular-foramen` vektori) va 26 ta `src/data/parts.json` ID'si + MNI centroidlari xaritasi.
   - Traektoriya burchaklari (medial canthus, EAM oldi 10–15 mm, Ghajar 90° sirt normali), chuqurlik (55–65 mm; ependimal "pop" 40–50 mm; > 70 mm qizil chegara).
   - 9 qadamli protsedura jadvali (nima qilinadi, vizual/haptik/audio javob, xato oqibatlari), asoratlar chastotasi (malposition 22–40%, qon ketish ~7% / simptomatik 0.8%, VRI ~8.8% / 11.4 per 1000 kateter-kun).
   - Baholash dvigateli: Kakarla Grade 1/2/3 avtomatik 3D mezonlari + OSATS / 7 ta SX-3 sonli metrikasi + PhD qatlami (patologik qorinchalar kutubxonasi, Ghajar taqqoslash, CSV eksport).

2. **`docs/research/procedures/dbs.md` (OP-2 / SX-6 DBS):**
   - Ko'rsatmalar va nishon tanlovi: Parkinson kasalligi (STN vs GPi — Deuschl 2006, Follett 2010, Schuepbach 2013 EARLYSTIM), essensial tremor (Vim — Papavassiliou 2004), distoniya (GPi), qarshi ko'rsatmalar.
   - Bemor holati (12 soat OFF-medication, semi-sitting 20°–30°, stereotaktik rama/ramasiz fuziya).
   - AC–PC koordinatalari (MCP ga nisbatan mm): STN (`X=11–12, Y=−2…−4, Z=−4…−5`), GPi (`X=19–22, Y=+2…+3, Z=−4…−6`), Vim (`X=13–15, Y=−6…−7, Z=0`); kirish nuqtalari, sagittal (55°–65°) va koronal (5°–25°) burchaklar, traektoriya xavfsizlik qoidalari (pushta cho'qqisi, qorinchadan o'tmaslik).
   - 26 ta `src/data/parts.json` ID'si + MNI centroidlari xaritasi va **muhim SX-6 PhD topilmasi**: `gross` (`BodyParts3D`) vs `julich` (`MNI ICBM152`) chuqur yadro ofseti (`g-right-subthalamic-nucleus` va `j-stn-right` orasida 7.6 mm farq; AC–PC `gross` da 31.95 mm) — stereotaktik hisob-kitob uchun `julich` MNI koordinatalari asosiy referens sifatida belgilandi.
   - 7 qadamli protsedura, 3 nishon uchun MER elektrofiziologik ovoz/signal jadvali (Talamus → ZI → STN → SNr; GPe → lamina → GPi → Optik trakt; Voa/Vop → Vim → Vc), makrostimulyatsiya nojo'ya ta'sirlari xaritasi (ichki kapsula, medial lemnisk, III nerv/qizil yadro, optik trakt, Vc) va Ben-Gun ofset qarorlari.
   - Asoratlar chastotasi (ICH 2–5% / simptomatik 1.1–2.1%, infeksiya 3–5%, apparat 2–5%, brain shift 2–4 mm), 6 ta SX-6 baholash metrikasi va PhD qatlami (atlaslararo eksport, yo'naltirilgan DBS / VTA, LFP beta-to'lqin, DRTT traktografiyasi).

## O'zgargan fayllar (hammasi vazifa ro'yxatida)
- `docs/research/procedures/evd.md` (yangi)
- `docs/research/procedures/dbs.md` (yangi)
- `docs/handoff/AG-9.md` (yangi)

## Tekshiruv
- `parts.json` ID auditi (Python skripti): jami **46 ta unikal atlas ID** (`evd.md`: 26, `dbs.md`: 26) `src/data/parts.json` da mavjudligi tekshirildi — **noma'lum ID = 0**.
- `npx tsc -p tsconfig.app.json --noEmit && npm run build && rm -rf dist` — ✅ (kodga tegilmadi, commit oldidan tasdiqlandi).
- **Manbalar (2026-11-23 da Crossref API va NCBI E-utilities orqali tasdiqlangan — jami 26 ta unikal DOI + 2 ta NCBI Bookshelf StatPearls ID):**
  - `10.1007/s12028-015-0224-8` — Fried et al. 2016 (*Neurocritical Care*): "The Insertion and Management of External Ventricular Drains: An Evidence-Based Consensus Statement"
  - `10.1227/01.neu.0000312390.83127.7f` — Kakarla et al. 2008 (*Operative Neurosurgery*): "SAFETY AND ACCURACY OF BEDSIDE EXTERNAL VENTRICULAR DRAIN PLACEMENT"
  - `10.3171/JNS/2008/108/01/0088` — Huyette et al. 2008 (*Journal of Neurosurgery*): "Accuracy of the freehand pass technique for ventriculostomy catheter placement: retrospective assessment using computed tomography scans"
  - `10.3171/jns.1980.53.5.0662` — Friedman & Vries 1980 (*Journal of Neurosurgery*): "Percutaneous tunnel ventriculostomy"
  - `10.3171/jns.1985.63.6.0985` — Ghajar 1985 (*Journal of Neurosurgery*): "A guide for ventricular catheter placement"
  - `10.1093/ons/opz194` — Morone et al. 2019 (*Operative Neurosurgery*): "Craniometrics and Ventricular Access: A Review of Kocher's, Kaufman's, Paine's, Menovksy's, Tubbs’, Keen's, Frazier's, Dandy's, and Sanchez's Points"
  - `10.1227/NEU.0b013e31821a45ba` — Bauer et al. 2011 (*Neurosurgery*): "Meta-Analysis of Hemorrhagic Complications From Ventriculostomy Placement by Neurosurgeons"
  - `10.1097/00006123-200207000-00024` — Lozier et al. 2002 (*Neurosurgery*): "Ventriculostomy-related Infections: A Critical Review of the Literature"
  - `10.1186/s12879-014-0712-z` — Ramanan et al. 2015 (*BMC Infectious Diseases*): "A meta-analysis of ventriculostomy-associated cerebrospinal fluid infections"
  - `10.4103/2152-7806.157620` — Muralidharan 2015 (*Surgical Neurology International*): "External ventricular drains: Management and complications"
  - `10.1046/j.1365-2168.1997.02502.x` — Martin et al. 1997 (*British Journal of Surgery*): "Objective structured assessment of technical skill (OSATS) for surgical residents"
  - `10.1097/SIH.0b013e3182662c69` — Yudkowsky et al. 2013 (*Simulation in Healthcare*): "Practice on an Augmented Reality/Haptic Simulator and Library of Virtual Brains Improves Residents’ Ability to Perform a Ventriculostomy"
  - `10.1227/NEU.0000000000000503` — Hooten et al. 2014 (*Operative Neurosurgery*): "Mixed Reality Ventriculostomy Simulation"
  - `10.3171/2014.5.JNS131766` — Kirkman et al. 2014 (*Journal of Neurosurgery*): "The use of simulation in neurosurgical education and training"
  - `10.1159/000070828` — Starr 2002 (*Stereotactic and Functional Neurosurgery*): "Placement of Deep Brain Stimulators into the Subthalamic Nucleus or Globus pallidus internus: Technical Approach"
  - `10.1002/mds.20959` — Machado et al. 2006 (*Movement Disorders*): "Deep brain stimulation for Parkinson's disease: Surgical technique and perioperative management"
  - `10.1002/mds.20960` — Gross et al. 2006 (*Movement Disorders*): "Electrophysiological mapping for the implantation of deep brain stimulators for Parkinson's disease and tremor"
  - `10.1056/nejmoa060281` — Deuschl et al. 2006 (*New England Journal of Medicine*): "A Randomized Trial of Deep-Brain Stimulation for Parkinson's Disease"
  - `10.1016/S1474-4422(08)70291-6` — Benabid et al. 2009 (*The Lancet Neurology*): "Deep brain stimulation of the subthalamic nucleus for the treatment of Parkinson's disease"
  - `10.1056/NEJMoa0907083` — Follett et al. 2010 (*New England Journal of Medicine*): "Pallidal versus Subthalamic Deep-Brain Stimulation for Parkinson's Disease"
  - `10.1056/NEJMoa1205158` — Schuepbach et al. 2013 (*New England Journal of Medicine*): "Neurostimulation for Parkinson's Disease with Early Motor Complications"
  - `10.1227/01.neu.0000119329.66931.9e` — Papavassiliou et al. 2004 (*Neurosurgery*): "Thalamic Deep Brain Stimulation for Essential Tremor: Relation of Lead Location to Outcome"
  - `10.3171/2011.8.JNS101407` — Zrinzo et al. 2012 (*Journal of Neurosurgery*): "Reducing hemorrhagic complications in functional neurosurgery: a large case series and systematic literature review"
  - `10.3171/2013.10.JNS131225` — Fenoy & Simpson 2014 (*Journal of Neurosurgery*): "Risks of common complications in deep brain stimulation surgery: management and avoidance"
  - `10.1016/j.neuroimage.2018.08.068` — Horn et al. 2019 (*NeuroImage*): "Lead-DBS v2: Towards a comprehensive pipeline for deep brain stimulation imaging"
  - `10.1038/s41582-020-00426-z` — Krauss et al. 2020 (*Nature Reviews Neurology*): "Technology of deep brain stimulation: current status and future directions"
  - NCBI Bookshelf (E-utilities `db=books` tasdiqlangan): `NBK545317` (*Ventriculostomy*, StatPearls), `NBK557847` (*Deep Brain Stimulation*, StatPearls).

## Ochiq savollar / qolgan ishlar
- SX-6 (OP-2 DBS) amalga oshirilganda `g-right-globus-pallidus` bitta umumiy mesh bo'lgani uchun (GPe va GPi alohida ajratilmagan), uning medial-posterior qismi geometrik kesim yoki AC–PC ofset orqali GPi nishoni sifatida ajratilishi kerak bo'ladi.
- `gross` (BodyParts3D) va `julich` (MNI ICBM152) chuqur yadrolari o'rtasidagi ~7.6 mm ofset SX-6 da "atlaslararo farq" PhD ko'rsatkichi sifatida ishlatilishi tavsiya etiladi.
- Navbatdagi jarrohlik vazifasi (`docs/SURGERY.md` §3 tartibida): **AG-10** (virtual operatsiya xonasi uchun ochiq 3D assetlar ro'yxati).

## Ko'rib chiqish (Claude to'ldiradi)

✅ 2026-11-23 Claude: 5 DOI Crossref bilan (Fried 2016, Morone 2019, Ghajar 1985, Follett 2010, Horn 2019) va 2 PMID eutils bilan (21471831, 7431075) sarlavhasi mos; 46 atlas ID auditi AG hisobotida (0 noma'lum). Hujjat, kod yo'q → master'ga birlashtirildi. SX-3/SX-6 uchun asosiy manba.
