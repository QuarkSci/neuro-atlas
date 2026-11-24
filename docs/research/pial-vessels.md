# Pial tomirlar realizmi: ochiq manbalar, protsedural o'stirish va devor/pulsatsiya (AG-20 tadqiqoti)

> **Vazifa:** AG-20 (`docs/REALISM.md` 3-bo'lim) · **Sana:** 2026-11-25 · **Tekshirilgan sana:** 2026-11-25  
> **Maqsad:** `docs/REALISM.md` A-4 (tomirlarni po'stloqqa yopishtirish va mayda pial tomirlarni protsedural o'stirish) hamda A-5/A-6 (tomir devori shaderi va arterial pulsatsiya) uchun ochiq serebrovaskulyar ma'lumotlar to'plamlari, protsedural tomir o'stirish algoritmlari va fiziologik parametrlarni tahlil qilish.

---

## 1. Qisqa xulosa va usul tanlovi

1. **Hozirgi muammo (o'lchangan):** Loyihada `gross` qatlamida **246 ta tomir meshi** (175 arteriya, 71 vena; jami 437 406 yuz, 266 018 vertex) bor. Ulardan **201 tasi** (196 098 vertex = 73.7 %) yaxlit po'stloq yuzasidan (`pial-unified.glb`) `≤ 6 mm` masofada joylashgan, lekin ularning **faqat 7.7 %** i (`15 079` vertex) `≤ 0.5 mm` ichida — ya'ni kortikal tomirlarning **92.3 % i havoda muallaq** turibdi.
2. **A-4 uchun tanlangan gibrid usul (litsenziya toza + realistik):**
   - **Asosiy tomirlar (`pipeline/tools/vessel_snap.py`):** Mavjud 246 ta BodyParts3D tomirlarining (CC BY-SA 2.1 JP) 1D markaz chizig'i va mahalliy radiusini ajratish, `pial-unified.glb` ga `≤ 6 mm` yaqin qismlarini silliq relaksatsiya bilan po'stloq yuzasiga yopishtirish (egatlar — manfiy egrilik zonasida biroz cho'ktirish), `> 6 mm` chuqur bazal tomirlar va ko'prik venalar (masalan, Villiz doirasi, ichki uyqu arteriyasi, yuqori sagittal sinusga o'tish) ning ildizlarini buzmasdan silliq o'tish berish va o'z-o'zini kesmaydigan toza naychalar (`vessels-snapped.glb`) qurish.
   - **Mayda pial tarmoq (`pipeline/tools/pial_vessels_grow.py`):** Yopishtirilgan kortikal arteriya/vena uchlaridan boshlab po'stloq yuzasi bo'ylab **Space Colonization** (Runions et al. 2005) + **Murray qonuni** ($r_p^3 = r_1^3 + r_2^3$, Murray 1926) bilan 2–4 darajali pial arteriola/venulalarni (radius `0.35 → 0.12 mm`) protsedural o'stirish.
   - **Nega tashqi MRA/CTA tomir to'plamlari to'g'ridan-to'g'ri ishlatilmaydi?** MRA/CTA (TopCoW, BraVa, Bullitt) faqat diametri `> 0.6–0.8 mm` bo'lgan yirik arteriyalarni (Villiz doirasi va M1–M3/A1–A3) ko'rsatadi; pial mikrotsirkulyatsiya (`0.1–0.5 mm`, Duvernoy 1981) klinik MRA da ko'rinmaydi va tashqi individual subyekt tomirlari BodyParts3D burmalariga (gyri/sulci) mos tushmaydi.

---

## 2. Ochiq serebrovaskulyar ma'lumotlar to'plamlari

| To'plam | Manba / Modallik | Litsenziya (ND bormi?) | Tarkib va aniqlik | Bizga mosligi |
|---|---|---|---|---|
| **BraVa** (Wright et al. 2013) | 61 sog'lom odam TOF-MRA (Krasnow Inst., `cng.gmu.edu/brava`) | Ochiq akademik / ilmiy tarqatish (CC BY-ND emas) | 6 ta asosiy arterial daraxt (ACA/MCA/PCA) SWC markaz chizig'i + radius | Morfometrik parametrlar (tarmoqlanish burchagi, radius nisbati, uzunlik) validatsiyasi uchun a'lo; individual anatomiya BP3D egatlariga mos emas |
| **TopCoW** (MICCAI 2023/2024, Zenodo) | Juft MRA + CTA (Villiz doirasi) | **CC BY-NC** (Zenodo; tijoratga ruxsat kerak; ND yo'q) | 13 ta Villiz doirasi segmenti voksel segmentatsiyasi | Villiz doirasi anatomik variantlari (kelajakda PLAN 5.x) uchun yaxshi; pial tomirlarni qamramaydi |
| **TubeTK / Bullitt Healthy MR** (Bullitt et al. 2005) | 100 sog'lom odam 3T TOF-MRA (CASILab / Kitware) | Ochiq (CC BY / MIDAS) | Yirik intrakranial arteriyalar (`0.5×0.5×0.8 mm` voksel) | Tortuosity (egrilik) statistikasi uchun referens; pial arteriolalar ko'rinmaydi |
| **BodyParts3D 4.3** (loyihada mavjud) | 246 ta arteriya + vena meshi (`gross`) | **CC BY-SA 2.1 JP** (ND yo'q) | Barcha asosiy kortikal arteriyalar, ko'prik venalar va dural sinuslar (nomlangan, MNI152 da) | **Asosiy tayanch** — `vessel_snap.py` bilan yuzaga moslangach, nomlar va klik tanlash saqlanadi |

---

## 3. Protsedural tomir o'stirish adabiyoti

1. **Space Colonization Algorithm (Runions et al. 2005):** Attraktor nuqtalar to'plami (bizda — po'stloq yuzasida, ayniqsa egatlarda zichroq tarqatilgan nuqtalar) tomon mavjud tomir tugunlaridan bosqichma-bosqich shoxlar o'stirish.
   - **Afzalligi:** 2D egri sirt (po'stloq) ustida tabiiy ravishda egatlarni kuzatadi, qo'shni tomirlar bilan to'qnashmaydi (`kill_distance` orqali), hisoblash vaqti sekundlar ichida.
2. **Constrained Constructive Optimization — CCO / ACCO (Schreiner & Buxbaum 1993; Talou et al. 2021):** Gidrodinamik bosim pasayishi (Poiseuille qonuni) va hajm minimizatsiyasi bo'yicha optimal arterial daraxt quradi.
   - **Cheklovi:** Katta tarmoqlar uchun hisoblash og'ir; egri 2D pial sirtda Space Colonization + Murray qonuni vizual va anatomik jihatdan yetarli hamda 50× tezroq.
3. **Murray qonuni (Murray 1926):** Bifurkatsiyada ona tomir radiusi $r_p$ va qiz tomirlar radiuslari $r_1, r_2$ orasidagi bog'lanish:
   $$r_p^\gamma = r_1^\gamma + r_2^\gamma, \quad \gamma \approx 3.0 \text{ (laminar oqim uchun } 2.7\text{–}3.0\text{)}$$
   Tarmoqlanish burchagi odatda $35^\circ\text{–}75^\circ$ oralig'ida bo'ladi (simmetrik bo'linishda $\approx 75^\circ$, kichik yon shoxda $\approx 60^\circ\text{–}85^\circ$).
4. **Kortikal qon tomir anatomiyasi (Duvernoy et al. 1981):** Pial arteriyalar subaraxnoidal bo'shliqda egatlar bo'ylab yotib, po'stloqqa perpendikulyar kiruvchi kortikal arteriolalarni beradi; pial arteriyalar diametri `0.15–0.8 mm`, pial venalar biroz kengroq va yuzaroq (subaraxnoidal yuqori qatlamda) bo'lib, ko'prik venalar orqali yuqori sagittal sinusga quyiladi.

---

## 4. Devor, rang va pulsatsiya parametrlari (A-4 / A-5 / A-6 uchun)

| Parametr | Pial arteriyalar | Pial venalar va ko'prik venalar |
|---|---|---|
| **Rang (sRGB / albedo)** | Yorqin kislorodli qizil (`#b82528` – `#d43530`), devori nisbatan qalinroq | To'q ko'kish-binafsha / to'q qizil (`#4a233d` – `#3a2a54`), yupqa yarim-shaffof devor |
| **Ho'l yaltirash (PBR)** | `roughness: 0.18–0.28`, kuchli spekulyar refleks (pia + likvor plyonkasi) | `roughness: 0.15–0.25`, devor yaltiroq, ichki qon qorong'i |
| **Pulsatsiya (A-6)** | Yurak sikli `1.0–1.2 Hz` (60–72 zarb/daq); radial kengayish `2–4 %` (sistolik tez ko'tarilish + dikrotik o'yiq, diastolik sekin pasayish) | Arterial pulsatsiya yo'q; nafas sikli `0.2–0.25 Hz` (12–15/daq) da yumshoq `~1–2 %` tebranish |

---

## 5. Tekshirilgan ilmiy manbalar (Crossref API bilan tasdiqlangan)

1. **Duvernoy HM, Delon S, Vannson JL (1981).** *Cortical blood vessels of the human brain.* Brain Research Bulletin, 7(5), 519–579. DOI: [`10.1016/0361-9230(81)90007-1`](https://doi.org/10.1016/0361-9230(81)90007-1)
2. **Wright SN, Kochunov P, Mut F, et al. (2013).** *Digital reconstruction and morphometric analysis of human brain arterial vasculature from magnetic resonance angiography.* NeuroImage, 82, 170–181. DOI: [`10.1016/j.neuroimage.2013.05.089`](https://doi.org/10.1016/j.neuroimage.2013.05.089)
3. **Runions A, Fuhrer M, Lane B, Federl P, Rolland-Lagan AG, Prusinkiewicz P (2005).** *Modeling and visualization of leaf venation patterns.* ACM Transactions on Graphics (SIGGRAPH), 24(3), 702–711. DOI: [`10.1145/1186822.1073251`](https://doi.org/10.1145/1186822.1073251)
4. **Murray CD (1926).** *The Physiological Principle of Minimum Work: I. The Vascular System and the Cost of Blood Volume.* PNAS, 12(3), 207–214. DOI: [`10.1073/pnas.12.3.207`](https://doi.org/10.1073/pnas.12.3.207)
5. **Schreiner W, Buxbaum PF (1993).** *Computer-optimization of vascular trees.* IEEE Transactions on Biomedical Engineering, 40(5), 482–491. DOI: [`10.1109/10.243413`](https://doi.org/10.1109/10.243413)
6. **Talou GDM, Safaei S, Hunter PJ, Blanco PJ (2021).** *Adaptive constrained constructive optimisation for complex vascularisation processes.* Scientific Reports, 11, 6180. DOI: [`10.1038/s41598-021-85434-9`](https://doi.org/10.1038/s41598-021-85434-9)
7. **Bullitt E, Zeng D, Gerig G, et al. (2005).** *Vessel Tortuosity and Brain Tumor Malignancy: A Blinded Study.* Academic Radiology, 12(10), 1232–1240. DOI: [`10.1016/j.acra.2005.05.027`](https://doi.org/10.1016/j.acra.2005.05.027)
