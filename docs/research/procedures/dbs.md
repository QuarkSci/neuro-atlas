# OP-2: Miya chuqur stimulyatsiyasi (DBS — Deep Brain Stimulation) — protsedura ssenariysi

> **Vazifa:** AG-9 (`AI.md` §5.4 · `docs/SURGERY.md` §2 SX-6) · **Sana:** 2026-11-23  
> **Maqsad:** `sx/main` branchidagi OP-2 DBS simulyatori (SX-6) uchun stereotaktik koordinatalar (AC–PC va MNI), traektoriya xavfsizligi, mikroelektrod yozuvi (MER), makrostimulyatsiya va baholash spetsifikatsiyasi.  
> **Ogohlantirish (App Store 1.4.1 / `docs/SURGERY.md` §0.3):** Ushbu hujjat va uning asosida quriladigan simulyator **faqat ta'lim va mashg'ulot uchun** mo'ljallangan; real bemorlar uchun stereotaktik rejalashtirish vositasi emas. Koordinatalar o'rtacha atlas miyasi bo'yicha beriladi; real klinikada har bemorning shaxsiy 3T MRI/CT tasvirida bevosita (direct) nishonlash shart.

---

## 1. Ko'rsatmalar va qarshi ko'rsatmalar

### 1.1 Klinik ko'rsatmalar va nishon tanlovi
*Manbalar: [Deuschl et al. 2006; Benabid et al. 2009; Follett et al. 2010; Schuepbach et al. 2013; Krauss et al. 2020; StatPearls NBK557847]*

| Kasallik / Sindrom | Asosiy nishon(lar) | Klinik mezon va dalillar |
|---|---|---|
| **Parkinson kasalligi (PD)** — motor fluktuatsiyalar, levodopa diskineziyalari, dori-rezistent tremor | **STN** (Subtalamik yadro) yoki **GPi** (Ichki rangpar shar) | Levodopaga aniq javob (UPDRS-III ≥ 30% yaxshilanish); erta motor asoratlarda ham samarali [Deuschl et al. 2006; Schuepbach et al. 2013]. **STN** dori dozasini ko'proq kamaytiradi; **GPi** diskineziyani bevosita bosadi va kognitiv/ruhiy nojo'ya ta'sir xavfi pastroq [Follett et al. 2010] |
| **Essensial tremor (ET)** va tremor-dominant PD | **Vim** (Talamusning ventral oraliq yadrosi) | Dori terapiyasiga (propranolol, primidon) chidamli, kundalik faoliyatni cheklovchi qo'l tremori [Papavassiliou et al. 2004; Gross et al. 2006] |
| **Birlamchi (idiopatik) distoniya** (generalizatsiyalashgan, segmentar, servikal) | **GPi** | Dori va botulinotoksin samarasiz bo'lganda [Krauss et al. 2020; StatPearls NBK557847] |
| **Dori-rezistent epilepsiya / OKB** (kengaytirilgan ko'rsatmalar) | ANT (talamus oldingi yadrosi) / VC-VS | Simulyatorning 1-bosqichida asosiy 3 nishon (**STN, GPi, Vim**) amalga oshiriladi [Krauss et al. 2020] |

### 1.2 Qarshi ko'rsatmalar
*Manbalar: [Machado et al. 2006; Benabid et al. 2009; StatPearls NBK557847]*
- **Mutlaq / kuchli:** Atipik parkinsonizm (MSA, PSP, CBD — levodopaga javobsiz); aniq demensiya yoki og'ir kognitiv pasayish; nazoratsiz og'ir depressiya, psixoz yoki suitsidal xavf; tuzatilmagan koagulopatiya; faol tizimli yoki teri infeksiyasi.
- **Nisbiy:** Og'ir umumiy miya atrofiyasi yoki keng miya qon-tomir patologiyasi (qon ketish xavfi yuqori); bemorning uyg'oq holatda hamkorlik qila olmasligi (bu holda intraoperatsion MRI/CT ostida uxlatilgan — *asleep* — DBS ko'rib chiqiladi).

---

## 2. Bemor holati va stereotaktik tayyorgarlik

*Manbalar: [Starr 2002; Machado et al. 2006; Benabid et al. 2009]*

- **Dori tayyorgarligi (Uyg'oq / Awake DBS):** Parkinson bemorlari operatsiyadan **12 soat oldin** dopaminergik dorilarni to'xtatadi ("OFF-medication" holat) — bu intraoperatsion makrostimulyatsiya samaradorligini (rigidlik, bradikineziya, tremor yo'qolishini) baholash uchun zarur [Machado et al. 2006].
- **Stereotaktik tizim:** Leksell yoki CRW stereotaktik ramasi (yoki ramasiz — *frameless* — suyak markerlari) mahalliy anesteziyada o'rnatiladi, so'ngra KT olinib operatsiyadan oldingi 3T MRI bilan birlashtiriladi (fusion).
- **Yotish holati:** Yarim-o'tirgan (**semi-sitting / beach-chair**, bosh qismi **20°–30°** ko'tarilgan) — venoz bosimni pasaytirish, ayni paytda havo emboliyasi va ortiqcha likvor chiqishi (pnevmosefaliya / *brain shift*) xavfini minimal darajada ushlash uchun [Machado et al. 2006].
- **Kirish va aloqa:** Steril choyshab shaffof oyna bilan qo'yiladi, shunda nevrolog bemorning yuz mimikasi, ko'z harakati (III nerv), nutqi va qo'l-oyoq tonusini uzluksiz tekshira oladi.

---

## 3. Stereotaktik koordinatalar (AC–PC, mm) va atlas xaritasi (`src/data/parts.json`)

### 3.1 AC–PC koordinata tizimi
- **AC (Anterior Commissure):** `g-anterior-commissure` orqa qirg'og'i.
- **PC (Posterior Commissure):** `g-posterior-commissure` oldingi qirg'og'i.
- **O'rtacha AC–PC uzunligi:** normal kattalarda **23–28 mm** (o'rtacha ~25 mm) [Starr 2002; Machado et al. 2006].
- **MCP (Mid-Commissural Point):** AC va PC ning o'rta nuqtasi — klassik bilvosita (indirect) koordinatalarning `(0, 0, 0)` boshi.

### 3.2 Asosiy 3 nishonning standart AC–PC koordinatalari (MCP ga nisbatan, mm)
*Manbalar: [Starr 2002; Papavassiliou et al. 2004; Gross et al. 2006; Machado et al. 2006; Benabid et al. 2009]*

| Nishon | Lateral (`X`, mm) | Old–Orqa (`Y`, MCP dan mm) | Yuqori–Past (`Z`, AC–PC dan mm) | Anatomik izoh (bevosita / direct MRI tekshiruvi) |
|---|---|---|---|---|
| **STN** (dorsolateral sensorimotor qism) | **11.0–12.0** | **−2.0 … −4.0** (orqaga) | **−4.0 … −5.0** (pastga) | Qizil yadro (`g-right-red-nucleus`) oldingi qirg'og'i darajasida, uning lateral chetidan ~3 mm lateral [Starr 2002; Benabid et al. 2009] |
| **GPi** (posteroventral motor qism) | **19.0–22.0** | **+2.0 … +3.0** (oldinga) | **−4.0 … −6.0** (pastga) | Optik trakt (`g-right-optic-tract`) dan **2–3 mm yuqorida**, ichki kapsula orqa oyoqchasidan lateral [Starr 2002; Machado et al. 2006] |
| **Vim** (ventral oraliq yadro) | **13.0–15.0** (yoki 3-qorincha devoridan 11–11.5 mm) | **−6.0 … −7.0** (yoki PC dan 25% AC–PC oldinga) | **0.0** (AC–PC tekisligida) | Vc (`j-vpl-right`/`j-vpm-right`) sezgi yadrosidan 2–3 mm oldinda [Papavassiliou et al. 2004; Gross et al. 2006] |

### 3.3 Kirish nuqtasi va traektoriya burchaklari
*Manbalar: [Starr 2002; Machado et al. 2006; Zrinzo et al. 2012]*

| Nishon | Kirish nuqtasi (bosh suyagi) | Sagittal burchak (AC–PC dan oldinga) | Koronal burchak (o'rta chiziqdan lateral) | Asosiy anatomik cheklovlar |
|---|---|---|---|---|
| **STN** | Koronar chok atrofida (0–10 mm oldinga), o'rta chiziqdan **25–35 mm lateral** (`g-right-middle-frontal-gyrus` / `g-right-superior-frontal-gyrus` pushta cho'qqisi) | **55°–65°** | **15°–20°** | Yon qorincha (`g-right-lateral-ventricle`) va sulkal tomirlardan qochish; 5–6 mm STN uzunligini kesib o'tish |
| **GPi** | Koronar chok atrofida, o'rta chiziqdan **30–40 mm lateral** | **55°–65°** | **5°–15°** (STN dan vertikalroq) | Ichki kapsula (`wm-internal-capsule-posterior-limb-right`) ni medialdan chetlab o'tish, optik trakt ustida to'xtash |
| **Vim** | Koronar chokdan 0–15 mm oldinga, o'rta chiziqdan **25–35 mm lateral** | **55°–65°** | **15°–25°** | Yon qorinchadan chetlab o'tish; Vc (`j-vpl-right`) ga tegmaslik |

### 3.4 `src/data/parts.json` tuzilmalar xaritasi va atlaslararo farq (SX-6 PhD qatlami)
Quyidagi barcha ID'lar `src/data/parts.json` dan tekshirilgan (`MNI` koordinatalar mm da):

| Rol | Tuzilma | `parts.json` ID | Qatlam | MNI centroid (mm) |
|---|---|---|---|---|
| **Referens** | Oldingi komissura (AC) | `g-anterior-commissure` | `gross` | `[0.08, 5.86, -6.38]` |
| **Referens** | Orqa komissura (PC) | `g-posterior-commissure` | `gross` | `[0.97, -26.08, -6.80]` |
| **NISHON 1** | O'ng subtalamik yadro (STN — MNI referens) | `j-stn-right` | `julich` | `[10.33, -12.98, -10.03]` |
| **NISHON 1 (gross)** | O'ng subtalamik yadro (BodyParts3D) | `g-right-subthalamic-nucleus` | `gross` | `[14.55, -19.18, -11.32]` |
| **NISHON 2** | O'ng rangpar shar (Globus pallidus) | `g-right-globus-pallidus` | `gross` | `[24.57, -0.44, -2.92]` |
| **NISHON 3** | O'ng Vim (Talamus ventral oraliq yadrosi) | `j-vim-right` | `julich` | `[13.78, -16.48, 0.16]` |
| **MER (STN usti)** | O'ng zona incerta (ZI) | `j-zi-right` | `julich` | `[10.67, -14.84, -7.06]` |
| **MER (STN osti)** | O'ng qora modda pars reticulata (SNr) | `j-snr-right` | `julich` | `[9.58, -15.69, -15.65]` |
| **MER (STN osti)** | O'ng qora modda pars compacta (SNc) | `j-snc-right` | `julich` | `[8.92, -22.18, -16.16]` |
| **MER (talamus)** | O'ng VA / VLa / VLp | `j-va-right`, `j-vla-right`, `j-vlp-right` | `julich` | `[10.83, -5.59, 5.12]` / `[13.99, -10.53, -0.96]` / `[14.61, -16.07, 11.34]` |
| **MER / Xavf (Vim orqa)** | O'ng VPL / VPM (Vc sezgi talamusi) | `j-vpl-right`, `j-vpm-right` | `julich` | `[18.11, -24.01, 4.44]` / `[12.33, -21.43, -5.00]` |
| **Xavf (medial STN)** | O'ng qizil yadro (Red nucleus) | `g-right-red-nucleus` | `gross` | `[6.35, -16.76, -16.12]` |
| **Xavf (medial/past STN)** | O'ng ko'zni harakatlantiruvchi nerv (III) | `g-trunk-of-right-oculomotor-nerve` | `gross` | `[20.24, 13.79, -42.10]` |
| **Xavf (lateral STN / medial GPi)** | O'ng ichki kapsula (orqa oyoqcha) | `g-right-internal-capsule` / `wm-internal-capsule-posterior-limb-right` | `gross` / `jhu` | `[21.23, -2.02, 4.46]` / `[20.20, -13.01, 7.55]` |
| **Xavf (orqa STN)** | O'ng medial lemnisk | `wm-medial-lemniscus-right` | `jhu` | `[5.61, -36.63, -33.39]` |
| **Xavf (GPi osti)** | O'ng ko'rish trakti (Optic tract) | `g-right-optic-tract` | `gross` | `[19.77, -15.59, -14.95]` |
| **Xavf (traektoriya)** | O'ng yon qorincha | `g-right-lateral-ventricle` | `gross` | `[18.46, -14.10, 5.20]` |
| **Xavf (traektoriya)** | O'ng dumli yadro (Caudate) | `g-right-caudate-nucleus` | `gross` | `[16.05, 0.86, 6.03]` |
| **Traktografiya (PhD)** | O'ng yuqori miyacha oyoqchasi (DRTT manbai) | `wm-superior-cerebellar-peduncle-right` | `jhu` | `[6.51, -41.73, -24.67]` |

> **Muhim PhD / SX-6 eslatma — Atlaslararo farq (Cross-atlas discrepancy):**  
> Bizning `parts.json` da `gross` (BodyParts3D affin tekislangan) va `julich` (Julich-Brain v3.1, MNI ICBM152) o'rtasida chuqur yadrolarda o'lchanadigan farq bor:
> - `g-anterior-commissure` → `g-posterior-commissure` masofasi `gross` da **31.95 mm** (klassik MNI ICBM152 da ~25 mm).
> - `j-stn-right` (`[10.33, -12.98, -10.03]`) va `g-right-subthalamic-nucleus` (`[14.55, -19.18, -11.32]`) centroidlari orasidagi masofa **7.6 mm**.
> - **SX-6 uchun tavsiya:** Stereotaktik nishonlash va MER chuqurligi uchun **`julich` (MNI ICBM152)** chuqur yadrolari (`j-stn-right`, `j-zi-right`, `j-snr-right`, `j-vim-right`, `j-vpl-right`) asosiy referens sifatida olinadi; `g-right-globus-pallidus` ichida medial-posterior segment GPi sifatida belgilanadi. PhD hisobotida esa atlaslararo farq (Lead-DBS tadqiqotlariga o'xshash [Horn et al. 2019]) alohida ko'rsatiladi.

---

## 4. Qadamlar ketma-ketligi, MER va makrostimulyatsiya (SX-6 dvigateli)

### 4.1 Protsedura bosqichlari

| # | Qadam | Nima qilinadi | Simulyatorda nima ko'rinadi / eshitiladi | Xato bo'lsa nima bo'ladi |
|---|---|---|---|---|
| **1** | **AC–PC belgilash va nishon tanlash** | AC, PC va o'rta chiziq nuqtalari belgilanadi; STN / GPi / Vim tanlanadi | AC–PC o'qi, MCP `(0,0,0)` va nishon koordinatalari (mm) | AC/PC da 2 mm xato → butun stereotaktik koordinata tizimi siljiydi |
| **2** | **Kirish nuqtasi va traektoriya tekshiruvi** | Koronar chok atrofida pushta cho'qqisi tanlanadi; 3D kesimlarda traektoriya tomir, egat va qorinchadan uzoqligi tekshiriladi | Traektoriya bo'ylab "probe's-eye view" kesimi va eng yaqin xavfli tuzilma masofasi (mm) | Qorincha (`g-right-lateral-ventricle`) yoki sulkal tomir kesib o'tilsa → ICH xavfi keskin oshadi [Zrinzo et al. 2012] |
| **3** | **Burg'u teshigi va dura ochilishi** | 14 mm burr hole; dura ochiladi, likvor oqib ketmasligi uchun darhol fibrin yelim / gelfoam qo'yiladi | Suyak teshigi ochiladi; ochiq qolgan vaqt hisoblagichi (brain shift ogohlantirishi) | Uzoq vaqt ochiq qolsa → pnevmosefaliya va **brain shift** (chuqur yadrolar 2–4 mm orqaga/pastga siljiydi) [Machado et al. 2006] |
| **4** | **Yo'naltiruvchi kanula (Guide tube)** | Kanula rejalangan nishondan **10–15 mm yuqorigacha** kiritiladi | Chuqurlik indikatori (`z_target + 15 mm`) | Juda chuqur kiritilsa → nishon yadroning o'ziga mexanik shikast |
| **5** | **Mikrodrayv va MER xaritalash** | Mikroelektrod 0.5 mm qadam bilan nishondan +15 mm dan −5 mm gacha tushiriladi; har qatlamning ovozi va spike grafigi tinglanadi | WebAudio sintezlangan MER tovushi + real-vaqt spike/chastota (Hz) grafigi + kinestetik sinov tugmasi | MER chegaralarini noto'g'ri aniqlash → elektrodni ZI yoki SNr da qoldirish (samarasiz DBS) |
| **6** | **Makrostimulyatsiya (Test stimulation)** | 0.5–5.0 mA oralig'ida oqim berilib, klinik foyda chegarasi va nojo'ya ta'sir chegarasi o'lchanadi | Simulyatsiya qilingan bemor reaksiyasi (tremor/rigidlik pasayishi vs nojo'ya ta'sir xabari) | Terapevtik oyna < 1.5 mA bo'lsa → traektoriyani 2 mm ga siljitish (Ben-Gun ofset: old/orqa/medial/lateral) shart |
| **7** | **Doimiy elektrodni joylashtirish va mahkamlash** | 4-kontaktli (yoki 8-kontaktli yo'naltirilgan) DBS elektrodi o'rnatiladi, qopqoq (burr hole cap) bilan mahkamlanadi | Kontaktlar (0–3) 3D nishon ichida ko'rinadi; radial xato (mm) va yakuniy hisobot | Mahkamlashda siljish → elektrod 2–3 mm yuqoriga chiqib ketishi |

### 4.2 MER elektrofiziologik signallari (SX-6 WebAudio va grafik spetsifikatsiyasi)
*Manbalar: [Starr 2002; Gross et al. 2006; Machado et al. 2006]*

| Nishon yo'li | Chuqurlik (nishonga nisbatan) | Tuzilma (`parts.json`) | MER chastotasi va naqshi | Kinestetik / sensor javob |
|---|---|---|---|---|
| **STN** | `+15 … +6 mm` | Talamus (`j-va-right` / `j-vla-right`) | 10–30 Hz, siyrak burst (pauzali) | Yo'q (yoki sust) |
| **STN** | `+6 … +3 mm` | **Zona incerta (`j-zi-right`)** | **Sokin zona** (past fon shovqini, kam hujayra) | Yo'q |
| **STN** | **`+3 … −2.5 mm`** (uzunlik ≥ 4–5 mm ideal) | **STN (`j-stn-right`)** | **25–45 Hz, baland fon shovqini**, keng tartibsiz portlashlar ("yomg'ir shovqini") | **Kuchli kinestetik** (kontralateral bilak/tirsak/to'piq passiv harakatiga sinxron) |
| **STN** | `−2.5 … −5 mm` | **SNr (`j-snr-right`)** | **60–90 Hz, muntazam, yuqori tonli** ("moshina dvigateli"dek tekis) | Yo'q |
| **GPi** | `+12 … +5 mm` | GPe (`g-right-globus-pallidus` tashqi) | 40–60 Hz, pauzer (uzoq sukutli) va burster hujayralar | Sust |
| **GPi** | `+5 … +4 mm` | Ichki medulyar lamina | 20–40 Hz, juda muntazam "border cells" | Yo'q |
| **GPi** | **`+4 … −2 mm`** | **GPi (`g-right-globus-pallidus` ichki)** | **60–90 Hz, yuqori zichlikdagi** tonik-tartibsiz razryadlar | **Kuchli kinestetik** |
| **GPi** | `−3 … −5 mm` | **Optik trakt (`g-right-optic-tract`)** | Sokin oq modda; yorug'lik chaqnashiga fon ko'tarilishi | Vizual chaqnash (strobe) ga javob |
| **Vim** | `+10 … +3 mm` | Voa / Vop (`j-vla-right`) | 15–30 Hz, mo'tadil | Ixtiyoriy harakatga bog'liq |
| **Vim** | **`+3 … −1 mm`** | **Vim (`j-vim-right`)** | **4–6 Hz tremor-sinxron portlashlar** ("tremor cells") | **Kinestetik** (bo'g'im harakati) |
| **Vim** (orqa chegara) | Orqaga > 2 mm | **Vc (`j-vpl-right`, `j-vpm-right`)** | Yuqori sezgirlikdagi qisqa burstlar | **Taktil** (yengil teri teginishiga darhol javob) |

### 4.3 Makrostimulyatsiya nojo'ya ta'sirlari (Kontakt og'ishi diagnostikasi)
*Manbalar: [Machado et al. 2006; Gross et al. 2006; Benabid et al. 2009]*

| Kontakt og'ish yo'nalishi | Yaqinlashgan tuzilma (`parts.json`) | Klinik nojo'ya ta'sir (130 Hz, 60–90 µs) | Chegara (< 2.5–3.0 mA bo'lsa) |
|---|---|---|---|
| **STN: Lateral / Oldingi** (yoki **GPi: Medial / Orqa**) | **Ichki kapsula** (`g-right-internal-capsule` / `wm-internal-capsule-posterior-limb-right`) | Kontralateral og'iz burchagi/qo'l tonik qisqarishi (kapsulyar tetaniya), dizartriya | Traektoriyani medialga (STN) yoki lateralga (GPi) 2 mm siljitish |
| **STN: Orqa / Medial** | **Medial lemnisk** (`wm-medial-lemniscus-right`) | Kontralateral yuz/qo'lda doimiy paresteziya (uvishish) | Traektoriyani oldinga 2 mm siljitish |
| **STN: Medial / Pastki** | **III nerv / Qizil yadro** (`g-trunk-of-right-oculomotor-nerve`, `g-right-red-nucleus`) | Ipsilateral ko'zning medial/pastga og'ishi, diplopiya, midriaz, ataksiya | Traektoriyani lateral/yuqoriga siljitish |
| **GPi: Pastki (Ventral)** | **Optik trakt** (`g-right-optic-tract`) | Kontralateral ko'rish maydonida yorug'lik chaqnashlari (fosfenlar) | Elektrodni 1–2 mm yuqoriga tortish |
| **Vim: Orqa** | **Vc talamus** (`j-vpl-right`, `j-vpm-right`) | Kontralateral barmoqlar/labda doimiy paresteziya | Traektoriyani 2 mm oldinga siljitish |
| **STN: Ventromedial** | Limbik/assotsiativ STN + gipotalamus (`g-hypothalamus`) | Terlash, ko'ngil aynishi, xavotir, gipomaniya | Kontaktlarni dorsolateral (yuqoriroq) qismga ko'chirish |

---

## 5. Asoratlar va ularning chastotasi

| Asorat | Adabiyotdagi chastota | Asosiy xavf omili / profilaktika | Manba |
|---|---|---|---|
| **Intrakranial qon ketish (ICH)** | Umumiy (KT da): **~2.0%–5.0%**; simptomatik: **~1.1%–2.1%**; doimiy defitsit/o'lim: **< 1%** | Gipertenziya, koagulopatiya, qorincha devorini kesib o'tish, sulkal tomirga tegish, ortiqcha MER yo'llari soni | [Zrinzo et al. 2012; Fenoy & Simpson 2014] |
| **Infeksiya (IPG / elektrod)** | **~3.0%–5.0%** (yirik seriyalarda ~3.1%–4.7%) | Steril texnika, profilaktik antibiotik, teri eroziyasini oldini olish | [Fenoy & Simpson 2014; Follett et al. 2010] |
| **Apparat asoratlari** (siljish, sinish, eroziya) | **~2.0%–5.0%** | Burr hole qopqog'ini ishonchli mahkamlash, bo'yin uzaytirgichida taranglik qoldirmaslik | [Fenoy & Simpson 2014] |
| **Pnevmosefaliya / Brain shift** | KT da havo ko'p uchraydi; klinik ahamiyatli siljish **2–4 mm** gacha | Dura ochilgach darhol fibrin yelim / gelfoam bilan yopish, bosh ko'tarilishini me'yorlash | [Machado et al. 2006] |
| **Stimulyatsiyaga bog'liq nojo'ya ta'sirlar** | Dizartriya ~5%–10%, paresteziya, muvozanat/kognitiv o'zgarishlar | To'g'ri elektrod joylashuvi + bipolyar/yo'naltirilgan dasturlash | [Follett et al. 2010; Benabid et al. 2009] |

---

## 6. Mahoratni baholash mezonlari (SX-6 baholash dvigateli)

OSATS tamoyillari [Martin et al. 1997; Kirkman et al. 2014] va stereotaktik aniqlik standartlari asosida SX-6 quyidagi 6 ta sonli o'lchovni hisoblaydi:

| SX-6 Metrika | A'lo (5) | Qoniqarli (3) | Qoniqarsiz (1) |
|---|---|---|---|
| **1. Nishonga radial xato (mm)** | **≤ 1.5 mm** | 1.5–2.5 mm | > 2.5 mm (qayta joylashtirish kerak) |
| **2. Traektoriya xavfsizligi** | Qorincha, sulkus va tomirlardan **≥ 3 mm** uzoqda, to'qnashuv = **0** | Yaqinlik 1–3 mm, to'qnashuv = 0 | Qorincha yoki tomir kesib o'tilgan (≥ 1) |
| **3. MER chegaralarini aniqlash** | STN/GPi/Vim kirish va chiqish chuqurligi **±0.5 mm** aniqlikda | ±1.0 mm | > 1.5 mm xato yoki SNr/optik traktni tanimaslik |
| **4. Makrostimulyatsiya terapevtik oynasi** | Foyda < 2.0 mA, nojo'ya ta'sir > 3.5 mA (oyna **≥ 1.5 mA**); kerak bo'lsa to'g'ri Ben-Gun ofset tanlangan | Oyna 1.0–1.5 mA | Oyna < 1.0 mA holda doimiy elektrod qo'yilgan |
| **5. MER yo'llari soni (Tracks)** | **1–2** yo'l | 3 yo'l | ≥ 4 yo'l (ICH xavfi ortadi [Zrinzo et al. 2012]) |
| **6. Umumiy vaqt va titrash RMS** | Rejalash + MER tartibli, titrash ≤ 0.4 mm | O'rtacha | Tartibsiz, yuqori titrash |

---

## 7. PhD / neyroxirurg darajasidagi qo'shimcha imkoniyatlar (`AI.md` §2.10)

1. **Atlaslararo koordinata eksporti (JSON/CSV):** Har yakuniy elektrod pozitsiyasi bir vaqtda 3 tizimda eksport qilinadi: (a) AC–PC / MCP (mm), (b) MNI ICBM152 (`julich`), (c) BodyParts3D (`gross`) — va `gross` vs `julich` ofseti (mm) hisoblanadi [Horn et al. 2019].
2. **Yo'naltirilgan (Directional) DBS va VTA (Volume of Tissue Activated):** Zamonaviy segmentlangan (1-3-3-1) elektrodlar elektr maydonini ichki kapsula yoki medial lemniskdan uzoqqa yo'naltirib terapevtik oynani kengaytiradi [Krauss et al. 2020]. SX-6 da soddalashtirilgan VTA sferasi/ellipsoidi kontakt atrofidagi nojo'ya ta'sir tuzilmalari bilan kesishuvini vizual ko'rsatishi mumkin.
3. **LFP beta-to'lqin (13–30 Hz) va Adaptiv DBS:** STN da kuchaygan beta-to'lqin faolligi bradikineziya/rigidlik biomarkeri bo'lib, zamonaviy sensing-enabled IPG lar yopiq zanjirli (closed-loop) adaptiv stimulyatsiyada qo'llanadi [Krauss et al. 2020].
4. **Traktografiya nishonlashi (DRTT):** Essensial tremor uchun Vim ni faqat AC–PC bilan emas, balki dentato-rubro-talamik trakt (`wm-superior-cerebellar-peduncle-right` → `g-right-red-nucleus` → `j-vim-right`) bo'ylab nishonlash imkoniyati [Horn et al. 2019; Krauss et al. 2020].

---

## 8. Tasdiqlangan manbalar (Tekshirilgan sana: 2026-11-23)

Barcha DOI'lar Crossref API (`https://api.crossref.org/works/<doi>`), StatPearls yozuvi esa NCBI E-utilities (`db=books`) orqali tekshirilgan:

1. **Starr PA (2002).** *Placement of Deep Brain Stimulators into the Subthalamic Nucleus or Globus pallidus internus: Technical Approach.* Stereotactic and Functional Neurosurgery. DOI: `https://doi.org/10.1159/000070828` (PMID: 12890973)
2. **Machado A, Rezai AR, Kopell BH, Gross RE, Sharan AD, Benabid AL (2006).** *Deep brain stimulation for Parkinson's disease: Surgical technique and perioperative management.* Movement Disorders. DOI: `https://doi.org/10.1002/mds.20959` (PMID: 16810722)
3. **Gross RE, Krack P, Rodriguez-Oroz MC, Rezai AR, Benabid AL (2006).** *Electrophysiological mapping for the implantation of deep brain stimulators for Parkinson's disease and tremor.* Movement Disorders. DOI: `https://doi.org/10.1002/mds.20960` (PMID: 16810720)
4. **Deuschl G, Schade-Brittinger C, Krack P, et al. (2006).** *A Randomized Trial of Deep-Brain Stimulation for Parkinson's Disease.* New England Journal of Medicine. DOI: `https://doi.org/10.1056/nejmoa060281`
5. **Benabid AL, Chabardes S, Mitrofanis J, Pollak P (2009).** *Deep brain stimulation of the subthalamic nucleus for the treatment of Parkinson's disease.* The Lancet Neurology. DOI: `https://doi.org/10.1016/S1474-4422(08)70291-6` (PMID: 19081516)
6. **Follett KA, Weaver FM, Stern M, et al. (2010).** *Pallidal versus Subthalamic Deep-Brain Stimulation for Parkinson's Disease.* New England Journal of Medicine. DOI: `https://doi.org/10.1056/NEJMoa0907083` (PMID: 20519680)
7. **Schuepbach WM, Rau J, Knudsen K, et al. (2013).** *Neurostimulation for Parkinson's Disease with Early Motor Complications (EARLYSTIM).* New England Journal of Medicine. DOI: `https://doi.org/10.1056/NEJMoa1205158` (PMID: 23406026)
8. **Papavassiliou E, Rau G, Heath S, et al. (2004).** *Thalamic Deep Brain Stimulation for Essential Tremor: Relation of Lead Location to Outcome.* Neurosurgery. DOI: `https://doi.org/10.1227/01.neu.0000119329.66931.9e` (PMID: 15113466)
9. **Zrinzo L, Foltynie T, Limousin P, Hariz MI (2012).** *Reducing hemorrhagic complications in functional neurosurgery: a large case series and systematic literature review.* Journal of Neurosurgery. DOI: `https://doi.org/10.3171/2011.8.JNS101407` (PMID: 21905798)
10. **Fenoy AJ, Simpson RK (2014).** *Risks of common complications in deep brain stimulation surgery: management and avoidance.* Journal of Neurosurgery. DOI: `https://doi.org/10.3171/2013.10.JNS131225` (PMID: 24236657)
11. **Horn A, Li N, Dembek TA, et al. (2019).** *Lead-DBS v2: Towards a comprehensive pipeline for deep brain stimulation imaging.* NeuroImage. DOI: `https://doi.org/10.1016/j.neuroimage.2018.08.068`
12. **Krauss JK, Lipsman N, Aziz T, et al. (2020/2021).** *Technology of deep brain stimulation: current status and future directions.* Nature Reviews Neurology. DOI: `https://doi.org/10.1038/s41582-020-00426-z`
13. **StatPearls (NCBI Bookshelf).** *Deep Brain Stimulation.* Accession: `NBK557847` · `https://www.ncbi.nlm.nih.gov/books/NBK557847/`
14. **Martin JA, Regehr G, Reznick R, et al. (1997).** *Objective structured assessment of technical skill (OSATS) for surgical residents.* British Journal of Surgery. DOI: `https://doi.org/10.1046/j.1365-2168.1997.02502.x` (PMID: 9052454)
15. **Kirkman MA, Ahmed M, Albert AF, Wilson MH, Nandi D, Sevdalis N (2014).** *The use of simulation in neurosurgical education and training.* Journal of Neurosurgery. DOI: `https://doi.org/10.3171/2014.5.JNS131766` (PMID: 24949680)
