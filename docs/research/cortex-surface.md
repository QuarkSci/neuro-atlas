# Realistik po'stloq yuzasi manbalari (AG-19 tadqiqoti)

> **Vazifa:** AG-19 (`docs/REALISM.md` 3-bo'lim) · **Sana:** 2026-11-25 · **Tekshirilgan sana:** 2026-11-25  
> **Maqsad:** `docs/REALISM.md` dagi A-1 (yaxlit po'stloq yuzasi) va A-2 (realistik egat tafsilotli po'stloq) bosqichlari uchun ochiq kortikal sirt manbalarini (BigBrain, FreeSurfer `fsaverage`, HCP S1200 `fs_LR`, MNI152 CIVET) litsenziya, format, aniqlik va MNI152 / BodyParts3D atlasimizga moslash (registration) bo'yicha solishtirish hamda aniq texnik tavsiya berish.

---

## 1. Qisqa xulosa va usul tanlovi

1. **A-1 bosqichi (hozirgi qadam — AG-19 qurish qismi):** Mavjud BodyParts3D (`gross`) 55 ta `telencephalon` qismini 0.5 mm voksellashtirish → Marching Cubes → Taubin silliqlash → kvadrik soddalashtirish (≤ 600k yuz) orqali bitta suv o'tkazmaydigan (`watertight`) meshga (`public/meshes/gross/pial-unified.glb`) birlashtirish va har vertexga eng yaqin asl qism ID sini (`data/gross_pial_labels.json`) yozish.
   - **Nega aynan shu usul birinchi?** BodyParts3D qismlari allaqachon loyihaning MNI152 fazosiga tekislangan (`pipeline/align_bp3d.json`, RMS 5.3 mm) va barcha 246 ta tomir hamda 4 ta parda meshiga koordinata jihatdan bog'langan. Bu bosqichda **litsenziya o'zgarmaydi** (CC BY-SA 2.1 JP saqlanadi), qismlarni bosib tanlash (`audit-pick`) uchun 100 % mos yorliq xaritasi olinadi va A-3 (meninges qobiqlari) hamda A-4 (tomirlarni yopishtirish) uchun darhol tayyor suv o'tkazmaydigan asos yaratiladi.
2. **A-2 bosqichi (keyingi qadam — real egat tafsiloti):** Tashqi ochiq sirtlar ichida **BigBrain 3D Pial Surface (MNI-ICBM152 2009b sym)** eng kuchli nomzod:
   - Tayyor `MNI-ICBM152 2009b sym` fazosidagi `.surf.gii` (GIfTI) fayllari mavjud (`gray_left_327680_2009b_sym.surf.gii`, `gray_right_327680_2009b_sym.surf.gii`), har yarim sharda 327 680 uchburchak (real individual gistologik egat chuqurligi, guruh-o'rtacha silliqlashish yo'q).
   - Litsenziyasi **CC BY-NC-SA 4.0** — loyihada allaqachon BigBrain real kesimlari (`public/sections/real/`) va Julich-Brain shu litsenziyada ishlatilmoqda (CC BY-ND emas, bepul ta'limiy ilova uchun to'liq mos).
   - **Zaxira (tijoratga mos eng yengil litsenziya kerak bo'lsa):** **MNI152 ICBM 2009c / CIVET** (McGill BIC permissive litsenziyasi) — lekin u 152 kishilik guruh o'rtachasi bo'lgani uchun ikkilamchi/uchlamchi egatlar (sulci) silliqlashib ketgan.

---

## 2. Ochiq kortikal sirt manbalari qiyosiy jadvali

Barcha litsenziya sahifalari va FTP/veb manzillar 2026-11-25 (hamda AG-6 da 2026-11-22) holatiga ko'ra ochib tekshirildi.

| Manba | Litsenziya (ND bormi?) | Format va hajm | Fazosi (Space) | Egat tafsiloti (sulci) | Atlasimizga (MNI152 / BP3D) moslash | Baho |
|---|---|---|---|---|---|---|
| **BigBrain 3D Surfaces (Apr7_2016)** | **CC BY-NC-SA 4.0** (ND yo'q; NC + SA bor) | `.surf.gii` (GIfTI), `.obj` (MNI/Wavefront), `.stl`; 327 680 yuz / yarim shar (655k jami) | Native BigBrain VA tayyor **`MNI-ICBM152 2009b sym`** | **Eng yuqori** — bitta 65 yoshli inson miyasi (20 µm gistologiya asosida), chuqur haqiqiy egatlar | To'g'ridan-to'g'ri MNI152 fazosida; BodyParts3D bilan 12-DoF affin + mahalliy non-rigid (yoki A-1 ustiga displacement) talab etiladi | **A-2 uchun tavsiya etiladi** |
| **FreeSurfer `fsaverage`** | **FreeSurfer Software License v1.0** (Part B: qayta tarqatish mumkin, majburiy prefiks + klinik taqiq eslatmasi; ND yo'q) | FreeSurfer binar (`lh.pial`, `rh.pial`), `fsaverage` (~327k yuz/hem), `fsaverage6` (~82k), `fsaverage5` (~20k) | **MNI305** (MNI152 emas!) | O'rtacha — 40 kishilik sirt-o'rtacha (birlamchi egatlar aniq, ikkilamchi egatlar yumshoq) | MNI305 → MNI152 affin (`mni152.register.dat` / Wu et al. 2018 RF-ANTs) + BP3D moslash kerak | Yaxshi zaxira, lekin MNI305 farqi va guruh silliqlashishi bor |
| **HCP S1200 Group Average (`fs_LR 32k / 164k`)** | **WU-Minn HCP Open Access Data Use Terms** (qayta tarqatish aynan shu shartlarda + majburiy NIH `1U54MH091657` matni; ND yo'q) | `.surf.gii` (GIfTI / CIFTI-2); `32k` (~65k yuz/hem) yoki `164k` (~328k yuz/hem) | **MNI152NLin6Asym** (MSMAll tekislangan) | O'rtacha–Yuqori (1200 kishilik MSMAll — funktsional-anatomik tekislash tufayli birlamchi egatlar aniq, lekin o'rtacha sirt) | MNI152NLin6 fazosida (`neuroparc`/Glasser bilan aynan mos!); `glasser` parcellation bilan 1:1 bog'lanadi | Glasser qatlami uchun ideal, lekin jarrohlik realizmi uchun bitta miya (BigBrain) tabiiyroq |
| **MNI152 ICBM 2009c / CIVET** | **McGill BIC Permissive** (har qanday maqsadga bepul, copyright eslatmasi saqlanadi; NC/ND yo'q) | MNI `.obj` (BIC polygon format), ~81 920 yuz / yarim shar (CIVET `icbm_avg_mid_sym` / `pial`) | **MNI152NLin2009c** | Past–O'rtacha — 152 kishilik hajmiy o'rtacha shablon, ikkilamchi egatlar silliq | To'g'ridan-to'g'ri MNI152 fazosida | Eng toza litsenziya, lekin vizual tafsilot yetarli emas |

---

## 3. Litsenziya iqtiboslari (asl sahifalardan)

### 3.1 BigBrain — CC BY-NC-SA 4.0
- **Manba:** `https://ftp.bigbrainproject.org/bigbrain-ftp/License.txt` (tekshirildi: 2026-11-25)
- **3D sirtlar manzili:** `https://ftp.bigbrainproject.org/bigbrain-ftp/BigBrainRelease.2015/3D_Surfaces/Apr7_2016/gii/`
  - Fayllar: `gray_left_327680_2009b_sym.surf.gii`, `gray_right_327680_2009b_sym.surf.gii` (hamda `white_*` va `MNI-obj/`, `stl/`, `wavefront-obj/` nusxalari).
- **Litsenziya iqtibosi:**
  > *"BigBrain is licensed under: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License. ... You are free to: Share — copy and redistribute the material in any medium or format; Adapt — remix, transform, and build upon the material ... Under the following terms: Attribution ... NonCommercial — You may not use the material for commercial purposes."*
- **Moslik:** CC BY-ND **emas**. Bepul va notijorat Neuro Atlas uchun to'liq ruxsatli (allqachon `public/sections/real/` da qo'llanmoqda).

### 3.2 FreeSurfer `fsaverage` — FreeSurfer Software License Agreement v1.0
- **Manba:** `https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense` (tekshirildi: 2026-11-22, AG-6 bilan tasdiqlangan)
- **Litsenziya iqtibosi (Part B):**
  > *"MGH hereby grants you, with right to sublicense... a royalty-free, non-exclusive license to use, reproduce, make derivative works of, display and distribute the Software, provided that: ... (b) in connection with any copy of or sublicense of all or any portion of the Software, all of the terms and conditions in this Software License shall appear in and shall apply to such copy and such sublicense... prefaced with the following words: 'All or portions of this licensed product (such portions are the "Software") have been obtained under license from The General Hospital Corporation and are subject to the following terms and conditions:'"*
- **Moslik:** CC BY-ND emas; qayta tarqatish mumkin, lekin majburiy prefiks va litsenziya matni ilovada bo'lishi shart.

### 3.3 HCP S1200 (`fs_LR`) — WU-Minn HCP Open Access Data Use Terms
- **Manba:** `https://www.humanconnectome.org/study/hcp-young-adult/document/wu-minn-hcp-consortium-open-access-data-use-terms` (tekshirildi: 2026-11-22, AG-6 bilan tasdiqlangan)
- **Litsenziya iqtibosi:**
  > *"I may redistribute original WU-Minn HCP Open Access data and any derived data as long as the data are redistributed under these same Data Use Terms."*
- **Moslik:** Ruxsatli, lekin majburiy NIH (`1U54MH091657`) minnatdorchilik matni va Data Use Terms havolasi ko'rsatilishi shart (loyihada `glasser` qatlami uchun allaqachon `ATTRIBUTION.md` da bor).

### 3.4 MNI152 ICBM 2009c / CIVET — McGill BIC License
- **Manba:** `https://www.bic.mni.mcgill.ca/ServicesAtlases/ICBM152NLin2009` (tekshirildi: 2026-11-25)
- **Litsenziya iqtibosi:**
  > *"Copyright (C) 1993–2004 Louis Collins, McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University. Permission to use, copy, modify, and distribute this software and its documentation for any purpose and without fee is hereby granted, provided that the above copyright notice appear in all copies."*
- **Moslik:** Eng erkin (hatto tijoriy maqsadga ham ruxsatli), ND/NC cheklovlari yo'q.

---

## 4. A-1 (AG-19) uchun texnik usul tanlovi

`src/data/parts.json` da `layer == "gross"` va `system == "telencephalon"` bo'lgan **55 ta mesh** (jami 506 695 yuz, 255 537 noyob vertex, umumiy bounding box `149.6 × 193.1 × 135.8 mm`, musbat imzoli hajm yig'indisi `926.7 cm³`) mavjud. Ulardan faqat 1 tasi (`g-left-hippocampus-proper`) to'liq suv o'tkazmaydigan (`watertight`), qolgan 54 tasida qo'shni g'ijimlar tutashgan joylarda ochiq chegaralar (`6 394` ta chegara qirrasi) mavjud.

Shuning uchun `pipeline/tools/pial_surface.py` quyidagi ketma-ketlikni bajaradi:
1. **0.5 mm voksellashtirish:** Har bir asl meshni uch o'q (X, Y, Z) bo'yicha nur-kesishuv (ray-parity) ko'pchilik ovozi bilan to'ldirish (ochiq tirqishlardagi bitta o'q xatosini bartaraf etadi) va 55 ta hajmning mantiqiy birlashmasini (boolean union) olish. Kichik sirt yoriqlari uchun 1 vokselli (0.5 mm) ichki bo'shliq to'ldirish (`binary_fill_holes`).
2. **Marching Cubes:** `skimage.measure.marching_cubes` (Lorensen & Cline 1987) — kichik Gauss silliqlash (`sigma` bilan izosirt) orqali zinapoya effektini (staircasing) kamaytirib, kafolatlangan yopiq (`watertight`) sirt olish.
3. **Taubin silliqlash:** Hajmni qisqartirmaydigan (shrinkage-free) ikki bosqichli Laplas filtri (Taubin 1995: `λ > 0`, `μ < -λ`) — hajm ±3 % va Hausdorff ≤ 0.6 mm chegarasini saqlagan holda silliq organik yuzani beradi.
4. **Kvadrik soddalashtirish (Decimation):** `fast_simplification` orqali ≤ 600 000 yuzga (maqsad ~400–500k yuz) tushirish va `is_watertight == True` holatini saqlash.
5. **Gyrus yorliqlash:** 55 ta asl mesh yuzasidan zich nuqtalar to'plami (vertexlar + yuz markazlari) ustida `scipy.spatial.cKDTree` qurib, yaxlit meshning har bir vertexini eng yaqin asl `part.id` ga bog'lash (`data/gross_pial_labels.json`).

---

## 5. Tekshirilgan ilmiy manbalar (Crossref API bilan tasdiqlangan)

1. **Amunts K, Lepage C, Borgeat L, et al. (2013).** *BigBrain: An Ultrahigh-Resolution 3D Human Brain Model.* Science, 340(6139), 1472–1475. DOI: [`10.1126/science.1235381`](https://doi.org/10.1126/science.1235381)
2. **Wagstyl K, Larocque S, Cucurull G, et al. (2020).** *BigBrain 3D atlas of cortical layers: Cortical and laminar thickness gradients diverge in sensory and motor cortices.* PLOS Biology, 18(4), e3000678. DOI: [`10.1371/journal.pbio.3000678`](https://doi.org/10.1371/journal.pbio.3000678)
3. **Fischl B (2012).** *FreeSurfer.* NeuroImage, 62(2), 774–781. DOI: [`10.1016/j.neuroimage.2012.01.021`](https://doi.org/10.1016/j.neuroimage.2012.01.021)
4. **Van Essen DC, Smith SM, Barch DM, et al. (2013).** *The WU-Minn Human Connectome Project: An overview.* NeuroImage, 80, 62–79. DOI: [`10.1016/j.neuroimage.2013.05.041`](https://doi.org/10.1016/j.neuroimage.2013.05.041)
5. **Glasser MF, Sotiropoulos SN, Wilson JA, et al. (2013).** *The minimal preprocessing pipelines for the Human Connectome Project.* NeuroImage, 80, 105–124. DOI: [`10.1016/j.neuroimage.2013.04.127`](https://doi.org/10.1016/j.neuroimage.2013.04.127)
6. **Fonov V, Evans AC, Botteron K, et al. (2011).** *Unbiased average age-appropriate atlases for pediatric studies.* NeuroImage, 54(1), 313–327. DOI: [`10.1016/j.neuroimage.2010.07.033`](https://doi.org/10.1016/j.neuroimage.2010.07.033) (ICBM 2009: Fonov et al. 2009, DOI: [`10.1016/s1053-8119(09)70884-5`](https://doi.org/10.1016/s1053-8119(09)70884-5))
7. **MacDonald D, Kabani N, Avis D, Evans AC (2000).** *Automated 3-D Extraction of Inner and Outer Surfaces of Cerebral Cortex from MRI.* NeuroImage, 12(3), 340–356. DOI: [`10.1006/nimg.1999.0534`](https://doi.org/10.1006/nimg.1999.0534)
8. **Lorensen WE, Cline HE (1987).** *Marching cubes: A high resolution 3D surface construction algorithm.* ACM SIGGRAPH Computer Graphics, 21(4), 163–169. DOI: [`10.1145/37401.37422`](https://doi.org/10.1145/37401.37422)
9. **Taubin G (1995).** *A signal processing approach to fair surface design.* Proceedings of SIGGRAPH '95, 351–358. DOI: [`10.1145/218380.218473`](https://doi.org/10.1145/218380.218473)
