# Neyroxirurgik simulyatorlar validatsiyasi va mahorat o'lchovlari

> **Vazifa:** AG-12 (`AI.md` §5.4 · `docs/SURGERY.md` §3, §6) · **Sana:** 2026-11-24  
> **Maqsad:** `sx/main` branchidagi jarrohlik simulyatori (SX-3 EVD, SX-4 burg'ulash, SX-6 DBS) baholash tizimi va o'rganish egri chizig'i uchun PhD darajasidagi ilmiy asos yaratish.  
> **Ogohlantirish (`docs/SURGERY.md` §0.3):** Ushbu hujjat ta'limiy simulyator metrikalarini loyihalash uchun mo'ljallangan; real klinik sertifikatlash yoki bemor rejalashtirish o'rnini bosmaydi.

---

## 1. Neyroxirurgik simulyatorlar validatsiya tadqiqotlari

Jarrohlik simulyatsiyasida ilmiy ishonchlilik quyidagi validlik pog'onalari bilan baholanadi [Kirkman et al. 2014; Alizadeh et al. 2024]:
- **Face / Content validity (Tashqi va mazmuniy validlik):** ekspert neyroxirurglar tomonidan anatomik ko'rinish va klinik qadamlarning haqiqatga mosligi (odatda 5 balli Likert shkalasi).
- **Construct validity (Konstrukt validligi):** simulyator metrikalari tajribali mutaxassis (attending / senior resident) va novichok (talaba / junior resident) o'rtasida statistik ahamiyatli farqni ajrata olishi.
- **Concurrent / Predictive validity (Parallel va bashorat validligi):** simulyatordagi ballarning OSATS/GRS ekspert bahosi bilan korrelyatsiyasi hamda real operatsiya xonasidagi (OR) natijalarga ko'chishi (transfer).

### 1.1 Asosiy platformalar sharhi

| Platforma | Asosiy vazifalar | Validatsiya darajasi | Asosiy topilmalar va cheklovlar | Manbalar |
|---|---|---|---|---|
| **NeuroTouch / NeuroVR** (NRC Canada) | Miya o'smasini olib tashlash (subpial rezeksiya), gemostaz, bimanual mikroxirurgiya | Yuqori (konstrukt validlik, benchmarklar, AI/ML tasniflash, RCT) | Kuch (force), o'sma/sog'lom to'qima hajmi, bimanual koordinatsiya va yo'l uzunligi ekspertlarni novichoklardan aniq ajratadi; AI-asosli tushuntiriluvchi fikr-mulohaza (VOA) o'rganishni tezlashtiradi. Cheklov: qimmat statsionar haptik stansiya. | [Delorme et al. 2012; Gélinas-Phaneuf et al. 2014; Alotaibi et al. 2015; AlZhrani et al. 2015; Mirchi et al. 2020; Ledwos et al. 2022; Fazlollahi et al. 2022] |
| **ImmersiveTouch** (UIC) | Ventrikulostomiya (EVD), pedikula vinti, trigeminal rizotomiya | Yuqori (konstrukt validlik + virtual miyalar kutubxonasi + transfer) | Bosh va qo'l kuzatuvli stereo-haptik tizim; EVD da birinchi urinish muvaffaqiyati va Monro teshigigacha masofa sezilarli yaxshilanadi; turli qorincha o'lchamlari (keng, normal, yoriqsimon/siljigan) kutubxonasi ko'nikmani mustahkamlaydi. | [Luciano et al. 2006; Lemole et al. 2007; Banerjee et al. 2007; Yudkowsky et al. 2013] |
| **Aralash reallik EVD (Mixed Reality / 3D-bosma)** | EVD / ventrikulostomiya (fizik bosh + optik/EM kuzatuv) | O'rta–yuqori (konstrukt validlik, ko'p markazli) | Real kateter hissi + virtual qorincha baholashi; rezidentlarda urinishlar soni kamayishi va Kakarla darajasi yaxshilanishi ko'rsatilgan. | [Schirmer et al. 2013; Hooten et al. 2014; Alizadeh et al. 2024] |
| **UpSurgeOn (TNS Box / CranialBox)** | Endoskopik transsfenoidal, pterional kraniotomiya (gibrid fizik + AR) | O'rta (face/content + boshlang'ich konstrukt validlik) | Qulay narx va portativlik; anatomik orientatsiya va mikroskop/endoskop ishlashida ijobiy baholar, lekin avtomatik kinematik metrikalar cheklangan. | [Newall et al. 2022] |
| **Wraith-VR** (Ghost Productions) | Ortopedik (tizza protezi), umurtqa va tibbiy qurilma namoyishlari | **Neyroxirurgik validatsiya mavjud emas** | PubMed / Crossref qidiruvlarida (2026-11-24 holati) Wraith-VR bo'yicha neyroxirurgik mahorat yoki konstrukt validlik tadqiqoti topilmadi; u asosan tijoriy/ta'limiy vizualizatsiya platformasidir. Shu sababli Neuro Atlas baholash tizimi NeuroTouch/NeuroVR va ImmersiveTouch ilmiy standartlariga tayanadi. | — (2026-11-24 tekshiruvi) |

---

## 2. Konstrukt validligi: mutaxassis va novichokni nima ajratadi?

Ko'p markazli simulyatsiya tadqiqotlari (NeuroTouch, ICSAD, ImmersiveTouch) shuni ko'rsatadiki, **faqat bajarish vaqtining o'zi (time) zaif ko'rsatkichdir**: shoshilgan novichok tez, lekin xavfli harakat qilishi mumkin [Datta et al. 2001; AlZhrani et al. 2015; Mirchi et al. 2020]. Mutaxassis va novichokni eng ishonchli ajratuvchi o'lchov guruhlari:

1. **Harakat tejamkorligi va yo'l uzunligi (Economy of Movement / Path Length):**
   - ICSAD elektromagnit kuzatuv tadqiqotida qo'l harakatlari soni va umumiy yo'l uzunligi OSATS GRS ballari bilan kuchli korrelyatsiya qilgan [Datta et al. 2001].
   - NeuroTouch bimanual vazifalarida ekspertlar ham yetakchi, ham yordamchi qo'lda ancha qisqa va silliq traektoriya chizadi [Alotaibi et al. 2015].
2. **Anatomik aniqlik va nishon xatosi (Target Accuracy):**
   - EVD simulyatorlarida kateter uchidan Monro teshigigacha masofa (mm), ideal traektoriyadan burchak og'ishi (°) va birinchi urinishdagi muvaffaqiyat (first-pass rate) eng kuchli konstrukt validlikka ega [Banerjee et al. 2007; Yudkowsky et al. 2013; Schirmer et al. 2013; Hooten et al. 2014].
3. **Xavfsizlik va to'qima hurmati (Tissue Respect / Collisions / Force):**
   - NeuroTouch da sog'lom miya to'qimasiga zarar yetkazish hajmi va maksimal qo'llanilgan kuch (peak force) rezident va ekspertlarni ajratuvchi asosiy "Tier-1" benchmark mezonlari sifatida aniqlangan [AlZhrani et al. 2015; Mirchi et al. 2020].
   - Shlemsiz (haptik kuch datchigisiz) tizimlarda kuch o'rnini **xavfli tuzilmalarga minimal yaqinlashuv (min clearance, mm)**, **to'qnashuvlar soni** va **chuqurlik chegarasidan o'tish (overshoot)** bosadi.
4. **Silliqlik va titrash (Smoothness / Tremor):**
   - Yuqori chastotali qo'l titrashi (4–12 Hz fiziologik/harakat tremori) va tezlanish o'zgarishi (jerk) mikroxirurgik nazorat va avtomatiklik darajasini aks ettiradi [Hooten et al. 2014; Mirchi et al. 2020].
5. **Urinishlar soni va tartib intizomi (Passes & Sequence):**
   - EVD da har qo'shimcha urinish (pass) klinik qon ketish xavfini oshiradi; simulyatorlarda ham urinishlar soni tajriba bilan teskari korrelyatsiya qiladi [Yudkowsky et al. 2013; Hooten et al. 2014].

---

## 3. Kinematik o'lchovlarning matematik formulalari

Asbob uchi traektoriyasi $\mathbf{p}_i = (x_i, y_i, z_i)$ (mm) va vaqt belgilari $t_i$ (s), $i = 0, \dots, N-1$, $\Delta t_i = t_i - t_{i-1}$ ko'rinishida berilsin.

### 3.1 Umumiy yo'l uzunligi (Path Length, $L_{\text{actual}}$) va Yo'l samaradorligi (Path Efficiency, $E$)
$$L_{\text{actual}} = \sum_{i=1}^{N-1} \|\mathbf{p}_i - \mathbf{p}_{i-1}\|_2, \qquad L_{\text{ideal}} = \|\mathbf{p}_{\text{end}} - \mathbf{p}_{\text{entry}}\|_2$$
$$E = \operatorname{clamp}\!\left(\frac{L_{\text{ideal}}}{L_{\text{actual}}},\; 0,\; 1\right)$$
- **Izoh:** $E = 1.0$ ideal to'g'ri chiziqli kiritishni bildiradi; qayta urinishlar (withdraw + re-insert) $L_{\text{actual}}$ ni keskin oshirib, $E$ ni pasaytiradi. (Ko'p vazifali asboblar uchun *Economy of Movement* odatda $L_{\text{actual}}$ yoki $E$ ko'rinishida beriladi [Datta et al. 2001; Alotaibi et al. 2015].)

### 3.2 Yuqori chastotali titrash (Tremor RMS, 4–12 Hz)
Fiziologik qo'l tremori 4–12 Hz diapazonida yotadi; sekin ixtiyoriy harakat (< 2–3 Hz) va kadr shovqini (> 15–20 Hz) chiqarib tashlanadi:
1. Traektoriya tekis vaqt qadamiga ($\Delta t$, masalan 50–100 Hz) interpolyatsiya qilinadi.
2. Har o'q ($x, y, z$) bo'yicha 4–12 Hz band-pass filtr (masalan, 2-tartibli nol-fazali Butterworth yoki kaskad HPF 4 Hz + LPF 12 Hz) qo'llanilib, $\tilde{\mathbf{p}}_i$ olinadi.
3. O'rtacha kvadratik og'ish (RMS, mm):
$$\text{Tremor}_{\text{RMS}} = \sqrt{\frac{1}{N}\sum_{i=0}^{N-1} \|\tilde{\mathbf{p}}_i\|_2^2}$$
- **SX-3 muvofiqligi:** `src/or/evd/score.ts` da aynan 4–12 Hz filtrlangan RMS (`tremorRms`) ishlatiladi va `scripts/shot-evd.mjs` da 8 Hz (1 mm) signalga javob, 0.5 Hz sekin harakat va 25 Hz shovqinni rad etish bilan tekshirilgan.

### 3.3 Harakat silliqligi (Dimensionless Jerk, $DJ$ — PhD kengaytmasi)
Vaqt va masofa masshtabiga bog'liq bo'lmagan silliqlik o'lchovi (past qiymat = silliqroq, ekspert harakat):
$$\mathbf{j}(t) = \frac{d^3 \mathbf{p}(t)}{dt^3}, \qquad DJ = \frac{D^5}{L_{\text{actual}}^2} \int_{t_0}^{t_1} \|\mathbf{j}(t)\|_2^2\, dt$$
bu yerda $D = t_1 - t_0$ — harakat davomiyligi. Logarifmik ko'rinishi $\text{LDJ} = -\ln(DJ)$ ko'pincha statistik tahlilda normal taqsimotga yaqinroq bo'ladi.

### 3.4 Traektoriya burchak xatosi ($\theta_{\text{err}}$) va Ghajar og'ishi ($\theta_{\text{Ghajar}}$)
$$\hat{\mathbf{v}}_{\text{user}} = \frac{\mathbf{p}_{\text{tip}} - \mathbf{p}_{\text{entry}}}{\|\mathbf{p}_{\text{tip}} - \mathbf{p}_{\text{entry}}\|_2}, \qquad \hat{\mathbf{v}}_{\text{ideal}} = \frac{\mathbf{p}_{\text{Monro}} - \mathbf{p}_{\text{entry}}}{\|\mathbf{p}_{\text{Monro}} - \mathbf{p}_{\text{entry}}\|_2}$$
$$\theta_{\text{err}} = \arccos\!\left(\operatorname{clamp}(\hat{\mathbf{v}}_{\text{user}} \cdot \hat{\mathbf{v}}_{\text{ideal}}, -1, 1)\right) \cdot \frac{180^\circ}{\pi}$$
Xuddi shu formula suyak tashqi plastinkasining ichki normali $-\hat{\mathbf{n}}_{\text{skull}}$ bilan solishtirilganda Ghajar qoidasidan og'ishni beradi.

---

## 4. OSATS, GRS va AI-asosli baholash shkalalari

### 4.1 Klassik OSATS (Martin et al. 1997)
**OSATS** (*Objective Structured Assessment of Technical Skill*) ikki komponentdan iborat [Martin et al. 1997]:
1. **Vazifaga xos cheklist (Task-Specific Checklist):** binar (bajarildi / bajarilmadi) qadamlar ro'yxati (masalan, EVD ning 9 qadami).
2. **Global Rating Scale (GRS):** 7 ta mezon, har biri **1** (qoniqarsiz), **3** (qoniqarli/kompetent), **5** (a'lo/ekspert) tayanch nuqtali 5 balli shkalada baholanadi:
   - *Respect for tissue* (to'qimaga hurmat) → simulyatorda: **to'qnashuvlar soni va minimal xavf masofasi**;
   - *Time and motion* (vaqt va harakat) → **umumiy vaqt, yo'l samaradorligi $E$, titrash RMS**;
   - *Instrument handling* (asbob boshqaruvi) → **burchak barqarorligi, chuqurlik nazorati, silliqlik**;
   - *Knowledge of instruments* (asbob bilimi) → **to'g'ri asbob/qadam tanlovi**;
   - *Flow of operation* (operatsiya oqimi) → **tartib xatolari (`sequenceErrors`), urinishlar soni (`passes`)**;
   - *Use of assistants* (yordamchidan foydalanish — yakka simulyatorda qo'llanmaydi);
   - *Knowledge of specific procedure* (protsedura bilimi) → **Kocher/AC–PC orientiri va cheklist aniqligi**.

### 4.2 Tushuntiriluvchi AI baholash va "Hard Fail" qoidasi
- **Virtual Operative Assistant (VOA)** tadqiqotida NeuroVR metrikalari asosida SVM/ML modeli ekspertlarni ~90%+ aniqlik bilan ajratgan va o'quvchiga aynan qaysi 2–3 metrikada (masalan, kuch yoki yo'l uzunligi) ekspert chegarasidan chiqqanini ko'rsatgan [Mirchi et al. 2020].
- Randomizatsiyalangan klinik tadqiqotda (RCT, *JAMA Network Open*) AI-asosli avtomatik fikr-mulohaza tibbiyot talabalarida o'rganish natijasini inson instruktori bilan solishtirganda yuqori darajaga olib chiqqan [Fazlollahi et al. 2022].
- **Klinik xavfsizlik cheklovi (Hard Fail / Cap):** OSATS o'rtacha balli yuqori bo'lsa ham, halokatli tuzilma (yuqori sagittal sinus, gipotalamus) bilan to'qnashuv yoki Kakarla Grade 3 (qorinchadan tashqarida / elokvent parenximada) umumiy bahoni qat'iy cheklashi shart (SX-3 `caps` mexanizmi).

---

## 5. O'rganish egri chizig'i modellari (Learning Curve Models)

`EvdPanel` tarix tabi (`src/or/evd/history.ts`) da sessiyalar ketma-ketligi saqlanadi. Ilmiy adabiyotda o'rganish dinamikasini sonli tavsiflash uchun uchta asosiy model qo'llanadi:

### 5.1 Teskari egri chiziq — Learning Plateau va Learning Rate [Feldman et al. 2009]
$$Y(n) = a - \frac{b}{n + c}$$
bu yerda $n = 1, 2, \dots$ — mashg'ulot raqami:
- **Learning Plateau ($a$):** nazariy maksimal mahorat darajasi ($n \to \infty$);
- **Learning Rate:** platoning 90% qismiga yetish uchun zarur urinishlar soni ($N_{90}$). Bu model ikki talabaning nafaqat yakuniy darajasini, balki o'zlashtirish tezligini ham taqqoslash imkonini beradi [Feldman et al. 2009].

### 5.2 Quvvat qonuni (Power Law of Practice)
Xato metrikalari (masalan, burchak xatosi $\theta_{\text{err}}$, Monro masofasi, umumiy vaqt) uchun klassik log-chiziqli model:
$$M(n) = M_1 \cdot n^{-\alpha} + M_\infty$$
bu yerda $\alpha > 0$ — o'rganish ko'rsatkichi; log-log grafikda chiziqli pasayishni beradi.

### 5.3 Individual kompetensiya nazorati — LC-CUSUM [Biau et al. 2008]
**LC-CUSUM** (*Learning Curve Cumulative Summation*) o'quvchi barqaror kompetentlik darajasiga yetgan-yetmaganini har sessiyadan so'ng statistik tekshiradi [Biau et al. 2008]:
- Har sessiya natijasi binar baholanadi: $X_t = 0$ (muvaffaqiyat: masalan, Kakarla 1, 0 to'qnashuv, OSATS ≥ 4.0) yoki $X_t = 1$ (muvaffaqiyatsizlik).
- Nol gipoteza $H_0$: nomaqbul xato darajasi $p_0$ (masalan, $p_0 = 0.25$); muqobil $H_1$: maqbul ekspert xato darajasi $p_1$ (masalan, $p_1 = 0.10$).
- Qadam og'irligi:
$$W_t = \begin{cases} \ln\!\left(\dfrac{1 - p_1}{1 - p_0}\right) > 0, & X_t = 0 \text{ (muvaffaqiyat)} \\[8pt] \ln\!\left(\dfrac{p_1}{p_0}\right) < 0, & X_t = 1 \text{ (xato)} \end{cases}$$
- Kumulyativ yig'indi (pastdan 0 da chegaralanadi):
$$S_t = \max(0,\; S_{t-1} + W_t), \qquad S_0 = 0$$
- $S_t \ge h$ (odatda simulyatsiya orqali tanlangan chegara $h \approx 2.0\text{–}3.0$) bo'lganda $H_0$ rad etiladi va o'quvchi **barqaror kompetent** deb e'lon qilinadi. NeuroVR da AI-tanlangan ko'p o'lchovli metrikalar ham shunga o'xshash individual o'rganish egri chizig'ini kuzatishda qo'llangan [Ledwos et al. 2022].

---

## 6. EVD / ventrikulostomiya simulyatori tadqiqotlari xulosasi

1. **ImmersiveTouch EVD [Luciano et al. 2006; Lemole et al. 2007; Banerjee et al. 2007]:**
   - Bosh va qo'l kuzatuvli stereo-haptik tizimda neyroxirurgiya rezidentlari va stajyorlarining kateter uchi Monro teshigidan o'rtacha masofasi klinik adabiyotdagi (CT) ko'rsatkichlar bilan mos tushgan [Banerjee et al. 2007].
2. **Virtual miyalar kutubxonasi [Yudkowsky et al. 2013]:**
   - Faqat bitta "normal" anatomiyada mashq qilish yetarli emas; normal, kengaygan, yoriqsimon (slit) va siljigan (midline shift) qorinchalar kutubxonasida mashq qilgan rezidentlarning haqiqiy bemorlardagi birinchi urinish muvaffaqiyati va aniqligi sezilarli oshgan. Bu Neuro Atlas dagi 3 darajali (`EvdLevel = 1 | 2 | 3`) tizimning to'g'ridan-to'g'ri ilmiy asosidir.
3. **Aralash reallik va ko'p markazli EVD mashg'uloti [Schirmer et al. 2013; Hooten et al. 2014]:**
   - Simulyatsiya mashg'ulotidan so'ng rezidentlarda burchak aniqligi oshgan, keraksiz urinishlar soni kamaygan va Kakarla Grade 1 ulushi yuqorilagan.
4. **Tizimli sharhlar [Kirkman et al. 2014; Alizadeh et al. 2024]:**
   - EVD neyroxirurgiyada VR/AR simulyatsiyasi eng ko'p o'rganilgan protseduralardan biri bo'lib, ob'ektiv geometrik metrikalar (uch masofasi, burchak, urinishlar soni, Kakarla darajasi) + tuzilgan fikr-mulohaza eng yuqori ta'limiy samarani beradi.

---

## 7. Neuro Atlas SX-3 (EVD) uchun tavsiya etilgan 8+2 o'lchovlar tizimi

Quyidagi 8 ta asosiy o'lchov `src/or/evd/params.ts` va `score.ts` da amalga oshirilgan; 9–10-o'lchovlar PhD darajasidagi keyingi kengaytma sifatida tavsiya etiladi:

| # | O'lchov | Formula / ta'rif | A'lo (5) | Qoniqarli (3) | Qoniqarsiz (1) | Ilmiy asos |
|---|---|---|---|---|---|---|
| **1** | **Kakarla joylashuvi** (Hard cap) | Uch qaysi anatomik sohada va Monro gacha masofa | Grade 1 (≤ 10 mm, frontal shox / 3-qorincha) | Grade 2 (kontralateral / funksional) | Grade 3 (parenxima / elokvent → **Cap**) | [Yudkowsky et al. 2013; Hooten et al. 2014] |
| **2** | **Uchdan Monro gacha masofa** | $\|\mathbf{p}_{\text{tip}} - \mathbf{p}_{\text{Monro}}\|_2$ (mm) | ≤ 5 mm | 5–12 mm | > 12 mm | [Banerjee et al. 2007; Alizadeh et al. 2024] |
| **3** | **Ideal burchakdan og'ish** | $\arccos(\hat{\mathbf{v}}_{\text{user}} \cdot \hat{\mathbf{v}}_{\text{ideal}})$ (°) | ≤ 5° | 5°–10° | > 10° | [Schirmer et al. 2013; Hooten et al. 2014] |
| **4** | **Chuqurlik og'ishi** | $\|d_{\text{table}} - d_{\text{ideal}}\|$ (mm; qizil chegara > 70 mm) | ≤ 5 mm | 5–10 mm | > 10 mm | [Banerjee et al. 2007; Alizadeh et al. 2024] |
| **5** | **Urinishlar soni (Passes)** | Bosh ichiga (> 25 mm) kirib-chiqishlar soni | 1 | 2 | ≥ 3 | [Yudkowsky et al. 2013; Hooten et al. 2014] |
| **6** | **Xavfli tuzilma to'qnashuvi** | BVH to'qnashuvlar soni (`sinus`, `internal capsule`, `caudate`, `thalamus`, `hypothalamus`, tomirlar) | 0 (va `minHazardMm` ≥ 3 mm) | 0 (faqat yaqinlik ogohlantirishi) | ≥ 1 (fatal → **Cap**) | [AlZhrani et al. 2015; Mirchi et al. 2020] |
| **7** | **Titrash (Tremor RMS)** | 4–12 Hz filtrlangan uch pozitsiyasi RMS (mm) | ≤ 0.5 mm | 0.5–1.2 mm | > 1.2 mm | [Hooten et al. 2014; Mirchi et al. 2020] |
| **8** | **Yo'l samaradorligi ($E$)** | $L_{\text{ideal}} / L_{\text{actual}} \in [0, 1]$ | ≥ 0.85 | 0.65–0.85 | < 0.65 | [Datta et al. 2001; Alotaibi et al. 2015] |
| **9** | **Umumiy vaqt** | Qadam 2 → 8 davomiyligi (s) | ≤ 180 s | 180–360 s | > 360 s | [Martin et al. 1997; Datta et al. 2001] |
| **10** | *(PhD kengaytma)* **LDJ silliqlik + LC-CUSUM** | $-\ln(DJ)$ va $S_t = \max(0, S_{t-1} + W_t)$ ($p_0=0.25, p_1=0.10, h=2.5$) | $S_t \ge h$ (barqaror kompetent) | O'sish bosqichi | $S_t = 0$ (takroriy xatolar) | [Biau et al. 2008; Feldman et al. 2009; Ledwos et al. 2022] |

> **SX-6 (DBS) uchun qo'shimcha eslatma:** DBS da bularga nishonga radial xato (≤ 1.5 mm), traektoriya xavfsizlik zaxirasi (≥ 3 mm), MER chegara xatosi (±0.5 mm), makrostimulyatsiya terapevtik oynasi (≥ 1.5 mA) va MER yo'llari soni (1–2) qo'shiladi (`src/or/dbs/data.ts` `DBS_METRICS`).

---

## 8. Tasdiqlangan manbalar (Tekshirilgan sana: 2026-11-24)

Barcha maqolalar NCBI PubMed E-utilities (`esearch` / `esummary`) va/yoki Crossref API (`https://api.crossref.org/works/<doi>`) orqali sarlavhasi bilan tekshirildi:

| # | Muallif (yil) | Sarlavha | DOI / PMID | Ochiqlik |
|---|---|---|---|---|
| 1 | **Delorme S et al. (2012)** | *NeuroTouch: a physics-based virtual simulator for cranial microneurosurgery training.* Neurosurgery. | `10.1227/NEU.0b013e318249c744` · PMID: `22233921` | Yopiq (obuna) |
| 2 | **Gélinas-Phaneuf N et al. (2014)** | *Assessing performance in brain tumor resection using a novel virtual reality simulator.* Int J Comput Assist Radiol Surg. | `10.1007/s11548-013-0905-8` · PMID: `23784222` | Yopiq (obuna) |
| 3 | **Alotaibi FE et al. (2015)** | *Assessing bimanual performance in brain tumor resection with NeuroTouch, a virtual reality simulator.* Neurosurgery. | `10.1227/NEU.0000000000000631` · PMID: `25599201` | Yopiq (obuna) |
| 4 | **AlZhrani G et al. (2015)** | *Proficiency performance benchmarks for removal of simulated brain tumors using a virtual reality simulator NeuroTouch.* J Surg Educ. | `10.1016/j.jsurg.2014.12.014` · PMID: `25687956` | Yopiq (obuna) |
| 5 | **Mirchi N et al. (2020)** | *The Virtual Operative Assistant: An explainable artificial intelligence tool for simulation-based training in surgery and medicine.* PLoS One. | `10.1371/journal.pone.0229596` · PMID: `32106247` · `PMC7046231` | **Ochiq (CC BY / OA)** |
| 6 | **Ledwos N et al. (2022)** | *Assessment of learning curves on a simulated neurosurgical task using metrics selected by artificial intelligence.* J Neurosurg. | `10.3171/2021.12.JNS211563` · PMID: `35120309` | Yopiq (obuna) |
| 7 | **Fazlollahi AM et al. (2022)** | *Effect of Artificial Intelligence Tutoring vs Expert Instruction on Learning Simulated Surgical Skills Among Medical Students: A Randomized Clinical Trial.* JAMA Netw Open. | `10.1001/jamanetworkopen.2021.49008` · PMID: `35191972` · `PMC8864513` | **Ochiq (OA / PMC)** |
| 8 | **Luciano C et al. (2006)** | *Second generation haptic ventriculostomy simulator using the ImmersiveTouch system.* Stud Health Technol Inform. | PMID: `16404075` | Yopiq (obuna) |
| 9 | **Lemole GM Jr et al. (2007)** | *Virtual reality in neurosurgical education: part-task ventriculostomy simulation with dynamic visual and haptic feedback.* Neurosurgery. | `10.1227/01.neu.0000279734.22931.21` · PMID: `17621029` | Yopiq (obuna) |
| 10 | **Banerjee PP et al. (2007)** | *Accuracy of ventriculostomy catheter placement using a head- and hand-tracked high-resolution virtual reality simulator with haptic feedback.* J Neurosurg. | `10.3171/JNS-07/09/0515` · PMID: `17886549` | Yopiq (obuna) |
| 11 | **Yudkowsky R et al. (2013)** | *Practice on an augmented reality/haptic simulator and library of virtual brains improves residents' ability to perform a ventriculostomy.* Simul Healthc. | `10.1097/SIH.0b013e3182662c69` · PMID: `23117306` | Yopiq (obuna) |
| 12 | **Schirmer CM et al. (2013)** | *Virtual reality-based simulation training for ventriculostomy: an evidence-based approach.* Neurosurgery. | `10.1227/NEU.0000000000000074` · PMID: `24051886` | Yopiq (obuna) |
| 13 | **Hooten KG et al. (2014)** | *Mixed Reality Ventriculostomy Simulation.* Operative Neurosurgery. | `10.1227/NEU.0000000000000503` · PMID: `25050577` | Yopiq (obuna) |
| 14 | **Kirkman MA et al. (2014)** | *The use of simulation in neurosurgical education and training. A systematic review.* J Neurosurg. | `10.3171/2014.5.JNS131766` · PMID: `24949680` | Yopiq (obuna) |
| 15 | **Alizadeh M et al. (2024)** | *Virtual and Augmented Reality in Ventriculostomy: A Systematic Review.* World Neurosurgery. | `10.1016/j.wneu.2024.05.151` · PMID: `38823448` | Yopiq (obuna) |
| 16 | **Martin JA et al. (1997)** | *Objective structured assessment of technical skill (OSATS) for surgical residents.* Br J Surg. | `10.1046/j.1365-2168.1997.02502.x` · PMID: `9052454` | Yopiq (obuna) |
| 17 | **Datta V et al. (2001)** | *The use of electromagnetic motion tracking analysis to objectively measure open surgical skill in the laboratory-based model.* J Am Coll Surg. | `10.1016/s1072-7515(01)01041-9` · PMID: `11708503` | Yopiq (obuna) |
| 18 | **Feldman LS et al. (2009)** | *A method to characterize the learning curve for performance of a fundamental laparoscopic simulator task: defining "learning plateau" and "learning rate".* Surgery. | `10.1016/j.surg.2009.02.021` · PMID: `19628099` | Yopiq (obuna) |
| 19 | **Biau DJ et al. (2008)** | *Quantitative and individualized assessment of the learning curve using LC-CUSUM.* Br J Surg. | `10.1002/bjs.6056` · PMID: `18498126` | Yopiq (obuna) |
| 20 | **Newall N et al. (2022)** | *High fidelity simulation of the endoscopic transsphenoidal approach: Validation of the UpSurgeOn TNS Box.* Front Surg. | `10.3389/fsurg.2022.1049685` · PMID: `36561572` · `PMC9764859` | **Ochiq (CC BY / OA)** |
