# OP-1: Tashqi ventrikulyar drenaj (EVD / Ventrikulostomiya) — protsedura ssenariysi

> **Vazifa:** AG-9 (`AI.md` §5.4 · `docs/SURGERY.md` §2 SX-3) · **Sana:** 2026-11-23  
> **Maqsad:** `sx/main` branchidagi OP-1 EVD simulyatori (SX-3) uchun anatomik, klinik, geometrik va baholash spetsifikatsiyasi.  
> **Ogohlantirish (App Store 1.4.1 / `docs/SURGERY.md` §0.3):** Ushbu hujjat va uning asosida quriladigan simulyator **faqat ta'lim va mashg'ulot uchun** mo'ljallangan; real bemorlar uchun jarrohlik rejasi yoki klinik tavsiya o'rnini bosmaydi. Barcha 3D koordinatalar va masofalar o'rtacha atlas miyasi (`MNI ICBM152` / `BodyParts3D`) bo'yicha beriladi.

---

## 1. Ko'rsatmalar va qarshi ko'rsatmalar

### 1.1 Klinik ko'rsatmalar (Indications)
Tashqi ventrikulyar drenaj (EVD) bosh miya ichki bosimini (ICP) o'lchash va serebrospinal suyuqlikni (likvor / CSF) nazorat ostida chiqarish uchun oltin standart hisoblanadi [Fried et al. 2016; Muralidharan 2015; StatPearls NBK545317]:
1. **O'tkir gidrosefaliya** (subaraxnoidal qon ketish — SAH, qorincha ichki qon ketishi — IVH, o'sma yoki miyacha infarkti tufayli likvor yo'llarining to'silishi).
2. **Og'ir bosh miya jarohati (TBI)** — GCS ≤ 8 va KT da patologiya (yoki yosh > 40, motor pozitsiya, SBP < 90 mmHg) bo'lganda ICP monitoringi va terapevtik drenaj [Fried et al. 2016].
3. **Katta miya ichki qon ketishi (ICH)** va intraventrikulyar kengayish bilan birga bosim oshishi.
4. **Infeksiyalangan ventrikuloperitoneal (VP) shunt** ni olib tashlangandan so'ng vaqtinchalik drenaj va intratekal antibiotik yuborish.
5. **Bosh suyagi asosi yoki orqa chuqurcha operatsiyalarida** miyani bo'shashtirish (brain relaxation) uchun profilaktik drenaj.

### 1.2 Qarshi ko'rsatmalar (Contraindications)
*Manba: [Fried et al. 2016; StatPearls NBK545317]*

| Toifa | Holat | Klinik chegara / izoh |
|---|---|---|
| **Mutlaq (nisbiy-shoshilinch istisnolar bilan)** | Kirish joyida faol teri/suyak infeksiyasi (abssess, osteomiyelit) | Boshqa taraf (kontralateral) yoki muqobil nuqta tanlanadi |
| **Nisbiy (tuzatish talab etiladi)** | Koagulopatiya | Odatda **INR > 1.4–1.6** yoki **aPTT** cho'zilishi — shoshilinch hayotiy ko'rsatma bo'lmasa avval tuzatiladi [Fried et al. 2016] |
| **Nisbiy** | Trombotsitopeniya | Odatda **trombotsitlar < 100 000 / µL** (ayrim markazlarda shoshilinch holatda < 50 000 / µL) [Fried et al. 2016] |
| **Nisbiy** | Antiagregant / antikoagulyant qabul qilish | Warfarin, DOAC, klopidogrel — imkon qadar bekor qilish / neytrallash [Fried et al. 2016] |
| **Nisbiy (anatomik)** | Yoriqsimon (slit) qorinchalar yoki kuchli o'rta chiziq siljishi | Erkin qo'l (freehand) bilan xato xavfi keskin oshadi → neyronavigatsiya / UZI afzal |
| **Nisbiy** | Kichik (orqa chuqurcha) hajmli o'sma + yuqoriga transtentorial churrasi xavfi | Tez drenaj yuqoriga churrasi (upward herniation) keltirib chiqarishi mumkin — yuqori drenaj darajasi (15–20 cmH2O) bilan ehtiyotkor drenaj |

---

## 2. Bemor holati va operatsiyaga tayyorgarlik

*Manbalar: [Friedman & Vries 1980; Fried et al. 2016; StatPearls NBK545317]*

- **Yotish holati:** Chalqancha (supine), karavot/stol bosh qismi **30°–45°** ko'tarilgan (venoz qaytishni yaxshilash va ICP ni pasaytirish uchun).
- **Bosh holati:** Qat'iy **neytral** holatda (burilish va egilishsiz, burun qirg'og'i shipga qaratilgan) — bu erkin qo'l (freehand) burchak orientirlarini buzmaslik uchun hal qiluvchi ahamiyatga ega. Simulyatorda (SX-1 / SX-3) bosh suyagi MNI o'qlariga nisbatan neytral holatda yoki 30° ko'tarilgan stol ustida modellashtiriladi.
- **Tomon tanlovi:** Standart ravishda **o'ng (nodominant) yarim shar** tanlanadi (til markazlari ko'pincha chapda joylashgani uchun). Istisnolar: o'ng frontal qon ketish/o'sma/infeksiya, o'ng qorincha qon bilan to'liq tiqilib chap qorincha kengaygan holatlar.
- **Profilaktika:** Kesmadan oldin bir martalik tizimli antibiotik (masalan, sefazolin) va to'liq steril bariyer (xlorgeksidin, steril choyshab) [Fried et al. 2016].

---

## 3. Anatomik orientirlar (mm) va atlas xaritasi (`src/data/parts.json`)

### 3.1 Kocher nuqtasi (Standart frontal kirish nuqtasi)
Kocher nuqtasi yuqori sagittal sinus (`g-superior-sagittal-sinus`) dan xavfsiz lateral masofada va motor po'stloq (`g-right-precentral-gyrus`) dan xavfsiz oldinda joylashishi uchun tanlanadi [Friedman & Vries 1980; Huyette et al. 2008; Morone et al. 2019; StatPearls NBK545317]:

| Parametr | Standart qiymat | Diapazon | Anatomik sabab |
|---|---|---|---|
| **Naziondan orqaga (AP)** | **110 mm** (11 cm) | 100–120 mm | Koronar chokdan ~10–20 mm oldinda tushadi |
| **Koronar chokdan oldinga** | **10–15 mm** | 10–20 mm | Precentral egat (motor po'stloq) dan ~35–45 mm oldinda qolish uchun [Morone et al. 2019] |
| **O'rta chiziqdan lateral (ML)** | **25–30 mm** | 25–35 mm (o'rta qorachiq chizig'i / mid-pupillary line) | Yuqori sagittal sinus va venoz lakunalardan (o'rta chiziqdan ≤ 20 mm) qochish [Morone et al. 2019] |
| **Kortikal kirish sohasi** | O'ng o'rta frontal pushta (`g-right-middle-frontal-gyrus`) yoki yuqori frontal pushta (`g-right-superior-frontal-gyrus`) chegarasi | — | "Jim" (non-eloquent) premotor/prefrontal hudud |
| **Maqsad (Nishon)** | O'ng yon qorincha oldingi (frontal) shoxi, **Monro teshigi** (`g-interventricular-foramen`) usti | Monro dan ≤ 5 mm | Eng keng likvor bo'shlig'i, xorioid chigalsiz (tiqilish xavfi past) [Kakarla et al. 2008] |

### 3.2 Muqobil ventrikulyar kirish nuqtalari (PhD / neyroxirurg ma'lumotnomasi)
*Manba: [Morone et al. 2019]*

| Nuqta | Orientir (mm) | Nishon | Qo'llanilishi |
|---|---|---|---|
| **Kocher** (standart) | Naziondan 100–110 mm orqaga, o'rta chiziqdan 25–30 mm lateral | Frontal shox (Monro teshigi) | O'tkir EVD (90%+ holatlar) |
| **Frazier** | Iniondan 60 mm yuqoriga, o'rta chiziqdan 30–40 mm lateral | Oktsipital shox / atrium | Orqa chuqurcha operatsiyalari, VP shunt |
| **Keen** | Tashqi eshituv yo'lidan 25–30 mm orqaga va 25–30 mm yuqoriga | Atrium (trigone) | Tez parieto-oktsipital kirish |
| **Dandy** | Iniondan 30 mm yuqoriga, o'rta chiziqdan 20 mm lateral | Oktsipital shox | Tarixiy / ko'rish yo'llariga yaqinligi sabab kamroq qo'llanadi |
| **Paine** | Silviy yorig'i va qosh yoyi bo'ylab 25 × 25 mm | Frontal shox (intraoperatsion) | Pterional kraniotomiya vaqtida tez dekompressiya |

### 3.3 SX-3 simulyatori uchun `src/data/parts.json` tuzilmalar xaritasi
Quyidagi barcha ID'lar `src/data/parts.json` dan tekshirilgan (`MNI` koordinatalar mm da, `[x, y, z]`: `+x` o'ng, `+y` oldinga, `+z` yuqoriga):

| Rol | Tuzilma (O'zbek / Ingliz) | `parts.json` ID | MNI centroid (mm) | Simulyatordagi vazifasi |
|---|---|---|---|---|
| **Orientir (suyak)** | Peshona suyagi (Frontal bone) | `g-frontal-bone` | `[-1.37, 57.29, 2.84]` | Koronar chokni (`g-frontal-bone` ∩ `g-right-parietal-bone`) avtomatik aniqlash; burg'ulash (SX-4) |
| **Orientir (suyak)** | O'ng tepa suyagi (Right parietal bone) | `g-right-parietal-bone` | `[49.80, -30.29, 45.90]` | Koronar chok chegarasi |
| **Parda** | Qattiq miya pardasi (Dura mater) | `g-cerebral-hemisphere-segment-of-dura-mater` | `[0.67, -20.36, 7.18]` | 5-qadam: dura ochilishi va qarshilik signali |
| **Yo'l (po'stloq)** | O'ng yuqori frontal pushta | `g-right-superior-frontal-gyrus` | `[12.51, 33.68, 40.46]` | Medial kirish chegarasi |
| **Yo'l (po'stloq)** | O'ng o'rta frontal pushta | `g-right-middle-frontal-gyrus` | `[32.88, 36.59, 36.15]` | Optimal kortikal kirish sohasi |
| **Yo'l (oq modda)** | O'ng oldingi toj nurlanishi (Anterior corona radiata) | `wm-anterior-corona-radiata-right` | `[21.22, 27.54, 9.73]` | Kateter normal o'tadigan oq modda |
| **Yo'l (oq modda)** | Qadoqsimon tana (Corpus callosum) | `g-corpus-callosum` | `[0.43, -8.61, 14.21]` | Frontal shox tomi; ependimal "pop" chegarasi |
| **NISHON (asosiy)** | **Monro teshigi** (Interventricular foramen) | `g-interventricular-foramen` | `[0.24, 1.66, 4.87]` | Ideal uch nuqtasi (masofa mm da o'lchanadi) |
| **NISHON (bo'shliq)** | **O'ng yon qorincha** (Right lateral ventricle) | `g-right-lateral-ventricle` | `[18.46, -14.10, 5.20]` | Oldingi shoxga tushganda "likvor" signali yoqiladi |
| **NISHON (qo'shni)** | Uchinchi qorincha (Third ventricle) | `g-third-ventricle` | `[0.49, -10.54, -3.06]` | Kakarla Grade 1 (chegaraviy) / chuqurlik nazorati |
| **Xavfli (medial)** | Yuqori sagittal sinus | `g-superior-sagittal-sinus` | `[0.95, -27.63, 43.32]` | Juda medial kirish → halokatli venoz qon ketish |
| **Xavfli (medial)** | Miya o'rog'i (Falx cerebri) | `g-falx-cerebri` | `[0.58, -15.12, 33.85]` | O'rta chiziq chegarasi |
| **Xavfli (medial)** | O'ng perikallozal arteriya | `g-right-pericallosal-artery` | `[2.43, 12.49, 14.95]` | Medial og'ish → interhemisferik arterial qon ketish |
| **Xavfli (medial)** | Shaffof to'siq (Septum pellucidum) | `g-septum-of-telencephalon` | `[0.09, 6.78, 8.77]` | Kontralateral qorinchaga o'tib ketish (Kakarla Grade 2) |
| **Xavfli (medial)** | O'ng gumbaz (Fornix) | `g-right-fornix-of-forebrain` | `[13.16, -16.60, 0.35]` | Monro atrofida juda medial/chuqur → xotira buzilishi |
| **Xavfli (lateral)** | O'ng dumli yadro (Caudate nucleus) | `g-right-caudate-nucleus` | `[16.05, 0.86, 6.03]` | Frontal shox lateral devori; lateral og'ish → Kakarla Grade 3 |
| **Xavfli (lateral)** | O'ng ichki kapsula (Internal capsule) | `g-right-internal-capsule` | `[21.23, -2.02, 4.46]` | Lateral + chuqur og'ish → kontralateral gemiparez |
| **Xavfli (lateral)** | O'ng ichki kapsula oldingi oyoqchasi (`jhu`) | `wm-internal-capsule-anterior-limb-right` | `[18.15, 7.80, 8.03]` | Oq modda trakt zararlanishi |
| **Xavfli (orqa)** | O'ng precentral pushta (Motor po'stloq) | `g-right-precentral-gyrus` | `[36.49, -8.21, 50.50]` | Koronar chokdan orqada kirish → motor defitsit |
| **Xavfli (chuqur)** | O'ng talamus (Thalamus) | `g-right-thalamus` | `[13.62, -17.43, 1.04]` | Orqaga va chuqur (> 65 mm) og'ish → talamik qon ketish |
| **Xavfli (chuqur)** | Gipotalamus (Hypothalamus) | `g-hypothalamus` | `[0.23, 0.96, -16.44]` | Haddan tashqari chuqur (> 70 mm) → vegetativ buzilish |
| **Xavfli (tomir)** | O'ng yuqori talamostriat vena | `g-right-superior-thalamostriate-vein` | `[9.62, -12.37, 11.72]` | Monro teshigi orqa devori → intraventrikulyar qon ketish |
| **Xavfli (tomir)** | O'ng ichki miya venasi | `g-right-internal-cerebral-vein` | `[2.98, -23.76, 2.35]` | Chuqur venoz qon ketish |
| **Xavfli (tomir)** | O'ng xorioid chigal | `g-right-choroid-plexus-of-cerebral-hemisphere` | `[20.74, -22.81, 0.66]` | Qon ketish va kateter tiqilishi |

> **SX-3 avtomatik Kocher nuqtasi algoritmi:**
> 1. `g-frontal-bone` va `g-right-parietal-bone` meshlarining eng yaqin tugunlari kesishuv chizig'idan koronar chok egri chizig'i topiladi.
> 2. O'rta chiziq (`x = 0` tekisligi) dan `+28 mm` o'ngga (`x ≈ +28 mm`) yuriladi va koronar chokdan `+15 mm` oldinga (`+y`) siljitiladi.
> 3. Shu `(x, y)` nuqtadan tashqi suyak yuzasiga proyeksiya qilinib, Kocher kirish nuqtasi `P_entry` olinadi. Ideal traektoriya vektori `V_ideal = normalize(P_monro - P_entry)`, bu yerda `P_monro` — `g-interventricular-foramen` centroidi (yoki o'ng frontal shox markazi, Monro dan 2–3 mm yuqorida va 2 mm o'ngda).

---

## 4. Traektoriya, burchaklar va chuqurlik

*Manbalar: [Friedman & Vries 1980; Ghajar 1985; Huyette et al. 2008; Kakarla et al. 2008; StatPearls NBK545317]*

### 4.1 Klassik tashqi orientirlar (Erkin qo'l / Freehand)
1. **Koronal tekislik (ML burchak):** Kateter **ipsilateral (o'ng) medial ko'z burchagi (medial canthus)** ga yo'naltiriladi (taxminan o'rta sagittal tekislikka nisbatan **5°–12° medial**).
2. **Sagittal tekislik (AP burchak):** Kateter **ipsilateral tashqi eshituv yo'li (EAM / tragus)** dan **10–15 mm oldinga** (yoki EAM ning o'ziga) yo'naltiriladi.
3. **Ghajar perpendikulyar qoidasi (PhD / muqobil geometriya):** Suyakning Kocher nuqtasidagi tashqi yuzasiga **qat'iy perpendikulyar (90°)** kiritilgan traektoriya ko'pchilik simmetrik bosh suyaklarida frontal shoxga aniq tushadi [Ghajar 1985]. Simulyatorda ikkala usul (anatomik orientir vs sirt normali) ning burchak farqi taqqoslanishi mumkin.

### 4.2 Chuqurlik (Depth)
- **Tashqi suyak plastinkasidan (outer table):** **55–65 mm** (5.5–6.5 cm) — eng ko'p qo'llaniladigan standart [Huyette et al. 2008; StatPearls NBK545317].
- **Teri yuzasidan:** ~60–70 mm (teri qalinligi ~5–8 mm).
- **Ependimal "pop" (qarshilik yo'qolishi):** odatda **40–50 mm** chuqurlikda seziladi; shundan so'ng mandren (stylet) olinadi va yumshoq kateter yana 10–15 mm (jami 55–65 mm gacha) muloyim suriladi.
- **Qizil chegara:** **> 70 mm** chuqurlik mutlaqo xavfli — uchinchi qorincha tubi, gipotalamus (`g-hypothalamus`), bazilyar arteriya yoki miya ustuniga zarar yetkazadi.

### 4.3 Simulyator uchun burchak og'ish chegaralari
- **A'lo (Optimal):** ideal traektoriyadan og'ish **≤ 5°** va uchdan `g-interventricular-foramen` gacha masofa **≤ 5 mm**.
- **Qoniqarli (Acceptable):** og'ish **5°–10°**, uch o'ng yon qorincha frontal shoxi ichida (`Kakarla Grade 1`).
- **Xavfli / Noto'g'ri:** og'ish **> 10°** (ko'pincha kontralateral qorinchaga yoki parenximaga — kaudat yadro / ichki kapsula — tushadi).

---

## 5. Qadamlar ketma-ketligi (SX-3 dvigateli uchun)

| # | Qadam | Nima qilinadi | Simulyatorda nima ko'rinadi / seziladi | Xato bo'lsa nima bo'ladi (anatomik oqibat) |
|---|---|---|---|---|
| **1** | **Holat va tayyorgarlik** | Bemor boshi neytral, 30° ko'tarilgan; tomon (o'ng) va koagulogramma/KT tekshiruvi tasdiqlanadi | Operatsiya stoli, bemor boshi, 30° burchak indikatori, ta'limiy ogohlantirish banneri | Bosh burilgan holda boshlansa — keyingi barcha freehand burchaklari tizimli ravishda og'adi |
| **2** | **Kocher nuqtasini belgilash** | Naziondan 110 mm orqaga (koronar chokdan 15 mm oldinga) va o'rta chiziqdan 28 mm o'ngga belgi qo'yiladi | Bosh suyagi/teri ustida o'lchagich (mm), koronar chok va sagittal chiziq yo'riqnomalari | `< 20 mm` medial → `g-superior-sagittal-sinus` xavfi; koronar chokdan orqada → `g-right-precentral-gyrus` (motor po'stloq) xavfi |
| **3** | **Teri kesmasi va periost** | 2–3 cm chiziqli kesma, periostni ajratish, retraktor qo'yish | Suyak yuzasi ochiladi | Keng qon ketish (galea), noto'g'ri joyda kesma → burchak cheklanishi |
| **4** | **Burg'u teshigi (Burr hole)** | 10–14 mm burgu bilan tashqi plastinka → diploe → ichki plastinka ochiladi (SX-4 voksel burg'ulash) | Suyak changi, tovush toni o'zgarishi, ichki plastinkada geympad titrashi + "plunge" ogohlantirishi | Haddan tashqari bosim ("plunging") → `g-cerebral-hemisphere-segment-of-dura-mater` yirtilishi va kortikal qon ketish |
| **5** | **Dura ochilishi va kortikotomiya** | Qattiq parda xochsimon kesiladi, pia-araxnoid va kortikal tomirlar koagulyatsiya qilinadi | Dura ochiladi, `g-right-middle-frontal-gyrus` yuzasi va yuzaki venalar (`g-superior-cerebral-vein`) ko'rinadi | Kortikal venani shikastlash → subdural/intraparenximal qon ketish |
| **6** | **Kateterni yo'naltirish va kiritish** | Styletli kateter Kocher nuqtasidan medial canthus + EAM oldi tekisligi bo'ylab bir tekis, sekin kiritiladi | 3D traektoriya lazeri (mashq rejimida yoqish/o'chirish mumkin), chuqurlik shkalasi (mm), eng yaqin xavfli tuzilma HUD'i | Traektoriya og'ishi → `g-right-caudate-nucleus`, `g-right-internal-capsule` yoki `g-right-pericallosal-artery` to'qnashuvi; har yangi urinish (pass) qon ketish xavfini oshiradi |
| **7** | **Qorinchaga tushish ("Pop" + Likvor)** | 40–50 mm da ependima teshiladi; kateter uchi `g-right-lateral-ventricle` oldingi shoxiga kiradi | Yengil qarshilik pasayishi (haptik "pop") + **likvor (CSF) oqishi** vizual/audio signali | Likvor kelmasa va > 65 mm ga kirilsa → `g-right-thalamus` / `g-hypothalamus` shikastlanishi; to'xtab, qayta tekshirish shart |
| **8** | **Styletni olish va chuqurlikni sozlash** | Stylet chiqariladi, yumshoq kateter 55–65 mm gacha (Monro teshigi ustiga) o'rnatiladi | Kateter uchi `g-interventricular-foramen` yaqinida barqarorlashadi; chuqurlik belgilari (5, 6, 7 cm) | Stylet bilan chuqur surish → xorioid chigal (`g-right-choroid-plexus-of-cerebral-hemisphere`) yoki `g-right-superior-thalamostriate-vein` dan qon ketish |
| **9** | **Tunnellash, mahkamlash va nolga keltirish** | Kateter teri ostidan 5 cm uzoqqa tunnellanadi (infeksiya profilaktikasi), tikiladi va transdyuser tragus (Monro) darajasiga nolga keltiriladi [Friedman & Vries 1980; Fried et al. 2016] | Yakuniy hisobot: Kakarla darajasi, OSATS balli, traektoriya 3D ko'rinishi, CSV eksport | Tunnellamaslik → VRI xavfi ortadi; drenaj juda past qo'yilsa → ortiqcha drenaj (overdrainage) |

---

## 6. Asoratlar va ularning chastotasi

| Asorat | Adabiyotdagi chastota | Asosiy sabab / xavf omili | Manba |
|---|---|---|---|
| **Noto'g'ri joylashish (Malposition)** | **22%–40%** (erkin qo'l bilan: Huyette et al. 2008 da 22.4% parenxima/subaraxnoidal; Kakarla et al. 2008 da Grade 1 = 77%, Grade 2 = 10%, Grade 3 = 13%) | Boshning burilganligi, burchak xatosi > 10°, tor/siljigan qorincha | [Huyette et al. 2008; Kakarla et al. 2008] |
| **Bir nechta urinish (Multiple passes)** | O'rtacha **~2 urinish** (Huyette et al. 2008) | Har qo'shimcha urinish trakt qon ketishi va parenxima shikastlanishini oshiradi | [Huyette et al. 2008] |
| **Qon ketish (EVD-related hemorrhage)** | Umumiy (KT da): **~7.0%** (meta-analiz); klinik ahamiyatli (simptomatik): **~0.8%** | Koagulopatiya, ko'p urinish, talamostriat vena / xorioid chigal / kortikal tomir shikastlanishi | [Bauer et al. 2011; Fried et al. 2016] |
| **Infeksiya (VRI / Ventrikulit)** | Umumiy: **~8.8%** (Lozier 2002); **11.4 / 1000 kateter-kun** (Ramanan 2015 meta-analizi) | Kateterning uzoq turishi (> 5 kun), tez-tez likvor olish, tunnellash yetishmasligi, IVH | [Lozier et al. 2002; Ramanan et al. 2015; Fried et al. 2016] |
| **Mexanik tiqilish / siljish** | **~10%–20%** (IVH da yuqoriroq) | Qon laxtasi, xorioid chigalga kirib qolish, kateterning noto'g'ri mahkamlanishi | [Muralidharan 2015; StatPearls NBK545317] |
| **Ortiqcha drenaj (Overdrainage)** | O'zgaruvchan | Drenaj kamerasi Monro/tragus darajasidan juda past bo'lishi → subdural gematoma, anevrizma qayta yorilishi, yuqoriga churrasi | [Muralidharan 2015; Fried et al. 2016] |

---

## 7. Mahoratni baholash mezonlari (SX-3 baholash dvigateli)

### 7.1 Kakarla joylashuv tasnifi (Avtomatik 3D baho)
*Manba: [Kakarla et al. 2008]*

| Daraja | Ta'rif | Simulyator (`parts.json`) tekshiruvi | Ball |
|---|---|---|---|
| **Grade 1 (Optimal)** | Kateter uchi ipsilateral frontal shoxda (Monro teshigi yaqinida) yoki uchinchi qorincha ichida | Uch `g-right-lateral-ventricle` (oldingi shox, `y > -5 mm`) ichida, Monro (`g-interventricular-foramen`) dan ≤ 10 mm, xavfli tuzilma kesilmagan | **100%** |
| **Grade 2 (Suboptimal, funksional)** | Kontralateral yon qorinchada yoki no-elokvent po'stloq/subaraxnoidal bo'shliqda (ishlaydi, lekin ideal emas) | Uch `g-left-lateral-ventricle` ichida (`g-septum-of-telencephalon` kesib o'tilgan) yoki frontal shoxdan uzoq (> 15 mm) | **60%** |
| **Grade 3 (Suboptimal, elokvent / ishlamaydi)** | Elokvent parenxima (ichki kapsula, bazal gangliyalar, talamus, miya ustuni) yoki qorinchadan tashqarida | Uch qorinchadan tashqarida YOKI `g-right-caudate-nucleus`, `g-right-internal-capsule`, `g-right-thalamus`, `g-hypothalamus`, tomirlar kesib o'tilgan | **0% (Xato)** |

### 7.2 OSATS Global Rating Scale (GRS) + EVD maxsus mezonlari
Klassik **OSATS** (Objective Structured Assessment of Technical Skill) [Martin et al. 1997] 7 ta 1–5 balli mezondan iborat; EVD simulyatorlarida (ImmersiveTouch, aralashtirilgan reallik simulyatorlari) ular ob'ektiv kinematik metrikalar bilan birlashtiriladi [Yudkowsky et al. 2013; Hooten et al. 2014; Kirkman et al. 2014].

| SX-3 Sonli metrika | Hisoblash formulasi | A'lo (5) | Qoniqarli (3) | Qoniqarsiz (1) |
|---|---|---|---|---|
| **1. Umumiy vaqt (s)** | Qadam 2 → 8 orasi | ≤ 180 s | 180–360 s | > 360 s |
| **2. Urinishlar soni (Passes)** | Korteksdan qaytib chiqib qayta kirishlar soni | **1** | 2 | ≥ 3 |
| **3. Burchak og'ishi (°)** | $\arccos(\hat{v}_{\text{user}} \cdot \hat{v}_{\text{ideal}})$ | **≤ 5°** | 5°–10° | > 10° |
| **4. Uchdan Monro gacha masofa (mm)** | $\|P_{\text{tip}} - P_{\text{monro}}\|_2$ | **≤ 5 mm** | 5–12 mm | > 12 mm |
| **5. Chuqurlik (mm)** | Tashqi suyak yuzasidan uchgacha masofa | **55–65 mm** | 50–55 yoki 65–70 mm | < 50 yoki > 70 mm |
| **6. Xavfli tuzilma to'qnashuvi** | BVH kesishuvlar soni (`sinus`, `caudate`, `internal capsule`, `thalamus`, `fornix`, `veins`, `arteries`) | **0** | 0 (faqat yaqinlik < 3 mm ogohlantirishi) | ≥ 1 to'qnashuv |
| **7. Titrash (Tremor RMS, mm) va yo'l samaradorligi** | Yuqori chastotali (4–12 Hz) og'ish RMS; $E = L_{\text{ideal}} / L_{\text{actual}}$ | RMS ≤ 0.5 mm, $E \ge 0.85$ | RMS 0.5–1.2 mm, $E$ 0.65–0.85 | RMS > 1.2 mm, $E < 0.65$ |

---

## 8. PhD / neyroxirurg darajasidagi qo'shimcha imkoniyatlar (`AI.md` §2.10)

1. **Qiyinlik darajalari (Patologik qorinchalar kutubxonasi — Yudkowsky et al. 2013 yondashuvi):**
   - *Daraja 1 (Talaba):* Kengaygan gidrosefalik qorincha (+30% hajm), 3D traektoriya lazeri yoqilgan.
   - *Daraja 2 (Rezident):* Normal o'lchamli atlas qorinchasi, traektoriya lazeri o'chirilgan (faqat tashqi orientirlar).
   - *Daraja 3 (Neyroxirurg / PhD):* Yoriqsimon (slit) qorincha yoki 6–8 mm o'rta chiziq siljishi (midline shift) — burchak korreksiyasini hisoblash talab etiladi.
2. **Ghajar normal vektori vs anatomik orientir solishtirmasi:** Har urinish yakunida foydalanuvchi traektoriyasi ham ideal Monro vektoriga, ham Kocher nuqtasidagi suyak normaliga nisbatan darajada ko'rsatiladi [Ghajar 1985].
3. **CSV / JSON eksport va o'rganish egri chizig'i:** Har sessiya `(timestamp, passCount, angleErrDeg, tipToMonroMm, depthMm, kakarlaGrade, tremorRmsMm, pathEfficiency, collisions)` qatori sifatida saqlanadi va vaqt bo'yicha o'rganish egri chizig'i chiziladi (batafsil validatsiya metrikalari AG-12 da).

---

## 9. Tasdiqlangan manbalar (Tekshirilgan sana: 2026-11-23)

Barcha DOI'lar Crossref API (`https://api.crossref.org/works/<doi>`), StatPearls yozuvi esa NCBI E-utilities (`db=books`) orqali tekshirilgan:

1. **Fried HI, Nathan BR, Rowe AS, et al. (2016).** *The Insertion and Management of External Ventricular Drains: An Evidence-Based Consensus Statement.* Neurocritical Care. DOI: `https://doi.org/10.1007/s12028-015-0224-8`
2. **Kakarla UK, Kim LJ, Chang SW, Theodore N, Spetzler RF (2008).** *Safety and Accuracy of Bedside External Ventricular Drain Placement.* Operative Neurosurgery. DOI: `https://doi.org/10.1227/01.neu.0000312390.83127.7f` (PMID: 18728595)
3. **Huyette DR, Turnbow BJ, Kaufman C, Vaslow DF, Whiting BB, Oh MY (2008).** *Accuracy of the freehand pass technique for ventriculostomy catheter placement: retrospective assessment using computed tomography scans.* Journal of Neurosurgery. DOI: `https://doi.org/10.3171/JNS/2008/108/01/0088` (PMID: 18173315)
4. **Friedman WA, Vries JK (1980).** *Percutaneous tunnel ventriculostomy.* Journal of Neurosurgery. DOI: `https://doi.org/10.3171/jns.1980.53.5.0662` (PMID: 7431075)
5. **Ghajar JB (1985).** *A guide for ventricular catheter placement.* Journal of Neurosurgery. DOI: `https://doi.org/10.3171/jns.1985.63.6.0985` (PMID: 4056916)
6. **Morone PJ, Dewan MC, Zuckerman SL, Tubbs RS, Singer RJ (2019/2020).** *Craniometrics and Ventricular Access: A Review of Kocher's, Kaufman's, Paine's, Menovksy's, Tubbs’, Keen's, Frazier's, Dandy's, and Sanchez's Points.* Operative Neurosurgery. DOI: `https://doi.org/10.1093/ons/opz194`
7. **Bauer DF, Razdan SN, Bartolucci AA, Markert JM (2011).** *Meta-Analysis of Hemorrhagic Complications From Ventriculostomy Placement by Neurosurgeons.* Neurosurgery. DOI: `https://doi.org/10.1227/NEU.0b013e31821a45ba` (PMID: 21471831)
8. **Lozier AP, Sciacca RR, Romagnoli MF, Connolly ES (2002).** *Ventriculostomy-related Infections: A Critical Review of the Literature.* Neurosurgery. DOI: `https://doi.org/10.1097/00006123-200207000-00024` (PMID: 12182415)
9. **Ramanan M, Lipman J, Shorr A, Shankar A (2015).** *A meta-analysis of ventriculostomy-associated cerebrospinal fluid infections.* BMC Infectious Diseases. DOI: `https://doi.org/10.1186/s12879-014-0712-z` (PMID: 25567583)
10. **Muralidharan R (2015).** *External ventricular drains: Management and complications.* Surgical Neurology International. DOI: `https://doi.org/10.4103/2152-7806.157620` (PMID: 26069848)
11. **StatPearls (NCBI Bookshelf).** *Ventriculostomy.* Accession: `NBK545317` · `https://www.ncbi.nlm.nih.gov/books/NBK545317/`
12. **Martin JA, Regehr G, Reznick R, et al. (1997).** *Objective structured assessment of technical skill (OSATS) for surgical residents.* British Journal of Surgery. DOI: `https://doi.org/10.1046/j.1365-2168.1997.02502.x` (PMID: 9052454)
13. **Yudkowsky R, Luciano C, Banerjee P, et al. (2013).** *Practice on an Augmented Reality/Haptic Simulator and Library of Virtual Brains Improves Residents’ Ability to Perform a Ventriculostomy.* Simulation in Healthcare. DOI: `https://doi.org/10.1097/SIH.0b013e3182662c69` (PMID: 23117306)
14. **Hooten KG, Lister JR, Lombard G, et al. (2014).** *Mixed Reality Ventriculostomy Simulation.* Operative Neurosurgery. DOI: `https://doi.org/10.1227/NEU.0000000000000503` (PMID: 25050577)
15. **Kirkman MA, Ahmed M, Albert AF, Wilson MH, Nandi D, Sevdalis N (2014).** *The use of simulation in neurosurgical education and training.* Journal of Neurosurgery. DOI: `https://doi.org/10.3171/2014.5.JNS131766` (PMID: 24949680)
