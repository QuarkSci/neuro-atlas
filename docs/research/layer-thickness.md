# Bosh terisidan miya po'stlog'igacha: qatlam qalinliklari va to'qima ranglari (AG-21 tadqiqoti)

> **Vazifa:** AG-21 (`docs/REALISM.md` 3-bo'lim) · **Sana:** 2026-11-25 · **Tekshirilgan sana:** 2026-11-25  
> **Maqsad:** `docs/REALISM.md` 1-bo'limidagi taxminiy qatlam qalinliklarini Crossref API bilan tasdiqlangan ilmiy manbalar asosida tekshirish/tuzatish, hamda A-3 (meninges qobiqlari), A-5 (ho'l to'qima shaderi) va B-1 (qatlamli bosh terisi kesimi) uchun to'qima ranglari va qalinlik diapazonlarini belgilash.

---

## 1. Qatlamlar jadvali (`REALISM.md` 1-bo'limini tasdiqlash va tuzatish)

| # | Qatlam | `REALISM.md` taxmini | Adabiyot bo'yicha diapazon (o'rtacha) | Holat | Optik / rang referensi (tirik / operatsion) | Asosiy manbalar |
|---|---|---|---|---|---|---|
| 1 | **Teri (epidermis + dermis)** | 3–6 mm | **1.5–4.0 mm** (o'rtacha ~2.5 mm; bosh tepasida qalinroq) | 🔧 **Tuzatildi** (3–6 mm butun teri+yog' uchun edi) | Iliq teri ohanglari (`#d8a88c` / Fitzpatrick I–VI), `roughness 0.55–0.70`, SSS | Hori et al. 1972; Antonakakis et al. 2020 |
| 2 | **Teri osti yog' (subkutis)** | 2–6 mm | **1.5–5.5 mm** (o'rtacha ~3.0 mm; jami bosh terisi 5–8 mm) | ✅ Mos (biroz aniqlashtirildi) | Sarg'ish-oltin yog' bo'lakchalari (`#e4be6a`), `roughness 0.35–0.45` | Hori et al. 1972; Antonakakis et al. 2020 |
| 3 | **Galea aponeurotica + bo'sh biriktiruvchi to'qima** | 1–3 mm | **0.8–2.5 mm** (galea ~0.5–1.0 mm + bo'sh qatlam ~0.5–1.5 mm) | ✅ Mos | Oqish-kumush tolali parda (`#dfd8ce`), `roughness 0.40–0.50` | Hori et al. 1972 |
| 4 | **Perikranium (periosteum)** | ≈ 0.5 mm | **0.2–0.5 mm** (o'rtacha ~0.35 mm) | ✅ Mos | Yupqa oqish-pushti parda (`#e6d8cc`), `roughness 0.35` | Hori et al. 1972; Lillie et al. 2016 |
| 5 | **Bosh suyagi (calvaria: tashqi / diploe / ichki)** | 6 mm (o'lchandi) | **4.5–9.0 mm** (frontal/parietal o'rtacha ~6.0–6.5 mm; atlas Kocher'da 6.03 mm) | ✅ Tasdiqlandi | Tashqi/ichki plastinka fil suyagi (`#e8e0cf`), diploe qizg'ish-g'ovak (`#a85d56`) | Lillie et al. 2016; Antonakakis et al. 2020 |
| 6 | **Epidural bo'shliq** | 0 (potentsial) | **0 mm** (normalda potentsial; dura ichki plastinkaga yopishgan) | ✅ Tasdiqlandi | — | Protasoni et al. 2011 |
| 7 | **Qattiq parda (dura mater)** | 0.3–1 mm | **0.3–1.1 mm** (konveksitetda o'rtacha **0.55–0.75 mm**) | ✅ Tasdiqlandi | Oqish-marvarid, zich tolali, yengil ko'kish-kulrang jilo (`#dcd8d2`), `roughness 0.35–0.45` | Protasoni et al. 2011; Kinaci et al. 2020; Zwirner et al. 2022 |
| 8 | **Subdural bo'shliq** | 0 (potentsial) | **0 mm** (potentsial; 3D renderda z-fighting oldini olish uchun 0.1–0.2 mm dizayn tirqishi) | ✅ Tasdiqlandi | — | Protasoni et al. 2011 |
| 9 | **O'rgimchak to'r parda (arachnoid mater)** | 0.1–0.2 mm | **0.08–0.20 mm** (o'rtacha ~0.15 mm; trabekulalar diametri 5–30 µm) | ✅ Tasdiqlandi | Yarim-shaffof sutrang-kumush parda (`#dce6f0`, `opacity 0.22–0.35`), egatlar ustidan ko'prik hosil qiladi | Saboori & Sadegh 2015 |
| 10 | **Subaraxnoidal likvor (CSF)** | 1–5 mm | **0.8–5.0 mm** (burma tepasida ~0.8–1.5 mm, egatlarda 2.5–5.0 mm) | ✅ Tasdiqlandi | Tiniq rangsiz suyuqlik (`IOR 1.335`, yengil moviy tarqalish `#c8e4f4`, `transmission 0.90`) | Antonakakis et al. 2020; Saboori & Sadegh 2015 |
| 11 | **Yumshoq parda (pia mater)** | ≈ 0.02 mm | **0.015–0.050 mm** (o'rtacha ~0.025 mm; 3D qobiq offset 0.04 mm) | ✅ Tasdiqlandi | Tiniq ho'l yaltiroq plyonka (`roughness 0.08–0.15`, kuchli spekulyar refleks) | Hutchings & Weller 1986 |
| 12 | **Miya po'stlog'i (kulrang modda)** | 2.5–4 mm | **1.5–4.5 mm** (o'rtacha **2.5 mm**; motor po'stloqda ~4 mm, oksipitalda ~1.6 mm) | ✅ Mos (quyi chegara 1.5 mm ga kengaytirildi) | Tirik perfuziyali pushti-kulrang (`#d9a59c`), ho'l spekulyar + taxminiy SSS | Fischl & Dale 2000 |

---

## 2. A-3 meninges qobiqlari generatsiyasi (`meninges_shells.py`) usul tanlovi

Atlasda `g-cerebral-hemisphere-segment-of-dura-mater` mavjud bo'lib, konveksitetda (`z > 10 mm`) u `pial-unified.glb` dan median `2.38 mm` (p10 `0.75 mm`, p90 `5.05 mm`), bosh suyagi gumbazidan esa median `2.27 mm` masofada yotadi.

Qobiqlar bir-birini **hech qachon kesmasligi** uchun barcha 4 ta qobiq bitta **monoton skalyar daraja-sirtlari (nested level-sets)** oilasidan olinadi:
1. **`meninges-pia.glb`:** `pial-unified.glb` ning silliq decimated nusxasini vertex normali bo'ylab tashqariga `+0.04 mm` siljitish (`0.015–0.050 mm` diapazonida).
2. **`meninges-csf.glb` (subaraxnoidal likvor tashqi chegarasi):** `pial-unified.glb` voksellarini morfologik yopish (egatlar ustidan ko'prik hosil qilish) + silliq masofa maydoni orqali burma tepasida `~1.0–1.5 mm`, egatlarda `2.0–4.8 mm` qalinlikdagi uzluksiz likvor qobig'i.
3. **`meninges-arachnoid.glb`:** likvor chegarasidan tashqariga aniq `+0.15 mm` (diapazon `0.08–0.20 mm`) daraja-sirti.
4. **`meninges-dura.glb`:** arachnoid'dan tashqarida (minimum `0.20 mm` xavfsiz oraliq) va konveksitetda mavjud `g-cerebral-hemisphere-segment-of-dura-mater` yuzasiga silliq moslashtirilgan (median farq `≤ 1.0 mm`), `0.60 mm` qalinlikdagi (`0.3–1.1 mm`) to'liq konveksitet qattiq pardasi.

---

## 3. Tekshirilgan ilmiy manbalar (Crossref API bilan tasdiqlangan)

1. **Hori H, Moretti G, Rebora A, Crovato F (1972).** *The Thickness of Human Scalp: Normal and Bald.* Journal of Investigative Dermatology, 58(6), 396–399. DOI: [`10.1111/1523-1747.ep12540633`](https://doi.org/10.1111/1523-1747.ep12540633)
2. **Lillie EM, Urban JE, Lynch SK, Weaver AA, Stitzel JD (2016).** *Evaluation of Skull Cortical Thickness Changes With Age and Sex From Computed Tomography Scans.* Journal of Bone and Mineral Research, 31(2), 299–307. DOI: [`10.1002/jbmr.2613`](https://doi.org/10.1002/jbmr.2613)
3. **Antonakakis M, Schrader S, Aydin Ü, et al. (2020).** *Inter-Subject Variability of Skull Conductivity and Thickness in Calibrated Realistic Head Models.* NeuroImage, 223, 117353. DOI: [`10.1016/j.neuroimage.2020.117353`](https://doi.org/10.1016/j.neuroimage.2020.117353)
4. **Protasoni M, Sangiorgi S, Cividini A, et al. (2011).** *The collagenic architecture of human dura mater.* Journal of Neurosurgery, 114(6), 1723–1730. DOI: [`10.3171/2010.12.jns101732`](https://doi.org/10.3171/2010.12.jns101732)
5. **Kinaci A, Bergmann W, Bleys RLAW, van der Zwan A, van Doormaal TPC (2020).** *Histologic Comparison of the Dura Mater among Species.* Comparative Medicine, 70(2), 170–175. DOI: [`10.30802/aalas-cm-19-000022`](https://doi.org/10.30802/aalas-cm-19-000022)
6. **Zwirner J, Ondruschka B, Scholze M, Hammer N (2022).** *Biomechanics of vascular areas of the human cranial dura mater.* Journal of the Mechanical Behavior of Biomedical Materials, 125, 104866. DOI: [`10.1016/j.jmbbm.2021.104866`](https://doi.org/10.1016/j.jmbbm.2021.104866)
7. **Saboori P, Sadegh A (2015).** *Histology and Morphology of the Brain Subarachnoid Trabeculae.* Anatomy Research International, 2015, 279814. DOI: [`10.1155/2015/279814`](https://doi.org/10.1155/2015/279814)
8. **Hutchings M, Weller RO (1986).** *Anatomical relationships of the pia mater to cerebral blood vessels in man.* Journal of Neurosurgery, 65(3), 316–325. DOI: [`10.3171/jns.1986.65.3.0316`](https://doi.org/10.3171/jns.1986.65.3.0316)
9. **Fischl B, Dale AM (2000).** *Measuring the thickness of the human cerebral cortex from magnetic resonance images.* PNAS, 97(20), 11050–11055. DOI: [`10.1073/pnas.200033797`](https://doi.org/10.1073/pnas.200033797)
