# Neuro Atlas — Attribution & Data Licences / Manbalar va Litsenziyalar

Neuro Atlas dasturiy kodi **MIT** litsenziyasi ostida tarqatiladi. Biroq ilovadagi 3D anatomik modellar, parcellation atlaslari, gistologik kesimlar va ta'limiy ma'lumotlar turli ochiq ilmiy loyihalardan olingan bo'lib, **har biri o'z asl litsenziyasi va mualliflik shartlariga bo'ysunadi**.

Ushbu loyiha **faqat notijorat, ta'lim va ilmiy tadqiqot maqsadlari** uchun mo'ljallangan (ba'zi atlaslar `NC` — Non-Commercial shartiga ega). `CC BY-ND` (NoDerivatives — hosila ishlarni taqiqlovchi) manbalar loyihaga kiritilmagan.

---

## Summary Table / Umumiy jadval

| Qatlam ID (`layer`) | Nomi (EN / UZ) | Qismlar / Fayllar | Asosiy manba | Litsenziya | Havola |
|---|---|---:|---|---|---|
| `gross` | Gross anatomy / Makroskopik anatomiya | 447 (379 asl + 68 ko'zgulangan tomir) | BodyParts3D / Anatomography v4.3 (DBCLS, Yaponiya) | **CC BY-SA 2.1 JP** | https://lifesciencedb.jp/bp3d/ |
| `julich` | Julich-Brain cytoarchitecture / Julich-Brain sitoarxitektonikasi | 414 mesh (+ 94 guruh = 508 qism) | Julich-Brain Atlas v3.1 (Forschungszentrum Jülich / EBRAINS) | **CC BY-NC-SA 4.0** | https://julich-brain-atlas.de/ |
| `brodmann` | Brodmann areas / Brodmann maydonlari | 82 | Brodmann (1909) on Conte69, Scalable Brain Atlas, via `neuroparc` | **Free for research & education** | https://scalablebrainatlas.incf.org/human/B05_on_Conte69 |
| `desikan` | Desikan-Killiany cortical parcellation | 70 | Desikan et al. 2006 (FreeSurfer `aparc+aseg`), via `neuroparc` | **FreeSurfer Licence** | https://doi.org/10.1016/j.neuroimage.2006.01.021 |
| `destrieux` | Destrieux cortical parcellation | 148 | Destrieux et al. 2010 (FreeSurfer `aparc.a2009s`), via `neuroparc` | **FreeSurfer Licence** | https://doi.org/10.1016/j.neuroimage.2010.06.010 |
| `glasser` | Glasser HCP-MMP1.0 | 358 | Glasser et al. 2016 (Human Connectome Project), via `neuroparc` | **WU-Minn HCP Open Access Data Use Terms** | https://doi.org/10.1038/nature18933 |
| `jhu` | JHU white-matter tracts / JHU oq modda traktlari | 48 | JHU ICBM-DTI-81 white-matter labels (Mori et al. 2008), via `neuroparc` | **FSL Licence (non-commercial)** | https://doi.org/10.1016/j.neuroimage.2007.12.035 |
| `bstem` | Brainstem subdivisions & nuclei / Miya ustuni bo'limlari va yadrolari | 38 (22 Allen + 16 AAN, + 3 guruh) | Allen Human Reference Atlas – 3D 2020 (Ding et al.) + Harvard AAN Atlas v2.0 (Edlow & Kinney 2023) | **CC BY 4.0** (Allen) + **CC0 1.0** (AAN) | https://doi.org/10.5061/dryad.zw3r228d2 |
| `suit` | Cerebellar lobules (SUIT) / Miyacha bo'lakchalari (SUIT) | 32 (+ 4 guruh) | Diedrichsen et al. 2009/2011 probabilistic cerebellar atlas (SUIT) | **CC BY-NC 3.0** | https://github.com/DiedrichsenLab/cerebellar_atlases |
| *Real slices* (`public/sections/real/`) | BigBrain histological cross-sections / BigBrain real gistologik kesimlari | 21 kesim (`.webp`) | BigBrain 100 µm MNI ICBM152 2009b sym (Amunts et al. 2013) | **CC BY-NC-SA 4.0** | https://doi.org/10.1126/science.1235381 |

---

## Detailed Attribution by Source / Manbalar bo'yicha batafsil ma'lumot

### 1. BodyParts3D (`gross`)
- **Manba (Source):** BodyParts3D, © The Database Center for Life Science (DBCLS), Mishima, Shizuoka, Japan (version 4.3, FMA identifiers).
- **Sitata (Citation):** Mitsuhashi N, Fujieda K, Tamura T, Kawamoto S, Takagi T, Okubo K. *BodyParts3D: 3D structure database for anatomical concepts.* Nucleic Acids Research. 2009;37(Database issue):D782–D785. https://doi.org/10.1093/nar/gkn613
- **Litsenziya (Licence):** [Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP)](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en_US).
- **URL:** https://lifesciencedb.jp/bp3d/
- **O'zgarishlar (Modifications):**
  1. OBJ fayllar segmentlar bo'yicha birlashtirilib, MNI152 (RAS, mm) fazosiga 20 ta anatomik tayanch nuqta orqali affin transformatsiya qilingan (`pipeline/align_bp3d.json`, RMS ≈ 5.3 mm) va katta meshlar (bosh suyagi, qattiq parda) ≤24 000 uchburchakkacha soddalashtirilib `.glb` (Draco) formatga o'tkazilgan.
  2. BodyParts3D'da faqat bir tomonda modellashtirilgan 68 ta juftsiz qon tomir (asosan venalar va ayrim arteriya shoxlari) qarama-qarshi yarim sharga affin moslashtirib ko'zgulangan (`pipeline/mirror_vessels.py`). Ushbu sun'iy juftlar katalogda `mirrorOf` va `meshSource: "BodyParts3D 4.3 · mirrored from the right/left side..."` yorlig'i bilan aniq ko'rsatilgan.

### 2. Julich-Brain Cytoarchitectonic Atlas (`julich`)
- **Manba (Source):** Julich-Brain Cytoarchitectonic Atlas v3.1 (MNI152 maximum-probability labelled map, accessed via `siibra`), Institute of Neuroscience and Medicine (INM-1), Forschungszentrum Jülich, Germany / EBRAINS.
- **Sitata (Citation):** Amunts K, Mohlberg H, Bludau S, Zilles K. *Julich-Brain: A 3D probabilistic atlas of the human brain's cytoarchitecture.* Science. 2020;369(6506):988–992. https://doi.org/10.1126/science.abb4588
- **Litsenziya (Licence):** [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/).
- **URL:** https://julich-brain-atlas.de/
- **O'zgarishlar (Modifications):** Voksel yorliqlaridan marching cubes va Taubin silliqlash orqali 3D sirt meshlar (`.glb`) hosil qilingan.

### 3. Brodmann Areas (`brodmann`)
- **Manba (Source):** Brodmann (1909) cortical areas mapped onto the Conte69 surface / MNI152NLin6 1 mm volume via Scalable Brain Atlas (`B05_on_Conte69`) and standardized in [`neurodata/neuroparc`](https://github.com/neurodata/neuroparc).
- **Sitata (Citation):**
  - Brodmann K. *Vergleichende Lokalisationslehre der Grosshirnrinde in ihren Prinzipien dargestellt auf Grund des Zellenbaues.* Leipzig: Johann Ambrosius Barth; 1909.
  - Bakker R, Tiesinga P, Kötter R. *The Scalable Brain Atlas: Instant Web-Based Access to Public Brain Atlases and Related Content.* Neuroinformatics. 2015;13(3):353–366. https://doi.org/10.1007/s12021-014-9258-x
  - Lawrence RM, Bridgeford EW, Myers PE, et al. *Standardizing human brain parcellations.* Scientific Data. 2021;8:78. https://doi.org/10.1038/s41597-021-00849-3
- **Litsenziya (Licence):** Free for scientific research and educational use.
- **URL:** https://scalablebrainatlas.incf.org/human/B05_on_Conte69

### 4. Desikan-Killiany Atlas (`desikan`)
- **Manba (Source):** FreeSurfer `aparc+aseg` gyral-based cortical parcellation in MNI152NLin6 1 mm space via [`neurodata/neuroparc`](https://github.com/neurodata/neuroparc).
- **Sitata (Citation):** Desikan RS, Ségonne F, Fischl B, et al. *An automated labeling system for subdividing the human cerebral cortex on MRI scans into gyral based regions of interest.* NeuroImage. 2006;31(3):968–980. https://doi.org/10.1016/j.neuroimage.2006.01.021
- **Litsenziya (Licence):** [FreeSurfer Software License Agreement](https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense).
- **URL:** https://doi.org/10.1016/j.neuroimage.2006.01.021

### 5. Destrieux Atlas (`destrieux`)
- **Manba (Source):** FreeSurfer `aparc.a2009s` sulcal- and gyral-based cortical parcellation in MNI152NLin6 1 mm space via [`neurodata/neuroparc`](https://github.com/neurodata/neuroparc).
- **Sitata (Citation):** Destrieux C, Fischl B, Dale A, Halgren E. *Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature.* NeuroImage. 2010;53(1):1–15. https://doi.org/10.1016/j.neuroimage.2010.06.010
- **Litsenziya (Licence):** [FreeSurfer Software License Agreement](https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense).
- **URL:** https://doi.org/10.1016/j.neuroimage.2010.06.010

### 6. Glasser HCP-MMP1.0 (`glasser`)
- **Manba (Source):** Human Connectome Project Multi-Modal Parcellation version 1.0 (180 areas per hemisphere) projected to MNI152NLin6 1 mm volume via [`neurodata/neuroparc`](https://github.com/neurodata/neuroparc).
- **Sitata (Citation):** Glasser MF, Coalson TS, Robinson EC, et al. *A multi-modal parcellation of human cerebral cortex.* Nature. 2016;536(7615):171–178. https://doi.org/10.1038/nature18933
- **Litsenziya (Licence):** [WU-Minn HCP Open Access Data Use Terms](https://www.humanconnectome.org/study/hcp-young-adult/document/wu-minn-hcp-consortium-open-access-data-use-terms). Data were provided in part by the Human Connectome Project, WU-Minn Consortium (Principal Investigators: David Van Essen and Kamil Ugurbil; 1U54MH091657) funded by the 16 NIH Institutes and Centers that support the NIH Blueprint for Neuroscience Research; and by the McDonnell Center for Systems Neuroscience at Washington University.
- **URL:** https://doi.org/10.1038/nature18933

### 7. JHU ICBM-DTI-81 White-Matter Tract Labels (`jhu`)
- **Manba (Source):** Johns Hopkins University ICBM-DTI-81 white-matter labels atlas in MNI152NLin6 1 mm space via [`neurodata/neuroparc`](https://github.com/neurodata/neuroparc).
- **Sitata (Citation):**
  - Mori S, Oishi K, Jiang H, et al. *Stereotaxic white matter atlas based on diffusion tensor imaging in an ICBM template.* NeuroImage. 2008;40(2):570–582. https://doi.org/10.1016/j.neuroimage.2007.12.035
  - Hua K, Zhang J, Wakana S, et al. *Tract probability maps in stereotaxic spaces: analyses of white matter anatomy and tract-specific quantification.* NeuroImage. 2008;39(1):336–347. https://doi.org/10.1016/j.neuroimage.2007.07.053
- **Litsenziya (Licence):** FSL Licence (non-commercial academic and educational use).
- **URL:** https://doi.org/10.1016/j.neuroimage.2007.12.035

### 8. Brainstem Subdivisions & Arousal Nuclei (`bstem`)
Ushbu qatlam ikki ochiq manbani birlashtiradi:

1. **Allen Human Reference Atlas – 3D, 2020 (22 qism — miya ustuni bo'linmalari):**
   - **Sitata (Citation):** Ding SL, Royall JJ, Sunkin SM, et al. *Comprehensive cellular-resolution atlas of the adult human brain.* Journal of Comparative Neurology. 2016;524(16):3127–3481. https://doi.org/10.1002/cne.24080
   - **Litsenziya (Licence):** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) (2022-09-01 yangilangan Allen Institute shartlari bo'yicha).
   - **URL:** https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/

2. **Harvard Ascending Arousal Network (AAN) Atlas v2.0 (16 qism — uyg'onish yadrolari: LC, DR, MnR, PAG, VTA, PTg, LDTg, PBC, PnO, mRt):**
   - **Sitata (Citation):** Edlow BL, Takahashi E, Wu O, et al. *Neuroanatomic connectivity of the human ascending arousal system critical to consciousness and its disorders.* Journal of Neuropathology & Experimental Neurology. 2012;71(6):531–546. (v2.0 release: Edlow & Kinney 2023, Dryad / Zenodo).
   - **Litsenziya (Licence):** [Creative Commons Zero v1.0 Universal (CC0 1.0)](https://creativecommons.org/publicdomain/zero/1.0/).
   - **URL:** https://doi.org/10.5061/dryad.zw3r228d2 (Zenodo mirror: https://zenodo.org/records/8161638)

### 9. SUIT Cerebellar Atlas (`suit`)
- **Manba (Source):** Spatially Unbiased Infratentorial Template (SUIT) probabilistic cerebellar lobules and deep nuclei atlas in MNI space (`atl-Anatom_space-MNI_dseg.nii`).
- **Sitata (Citation):**
  - Diedrichsen J, Balsters JH, Flavell J, Cussans E, Ramnani N. *A probabilistic MR atlas of the human cerebellum.* NeuroImage. 2009;46(1):39–46. https://doi.org/10.1016/j.neuroimage.2009.01.045
  - Diedrichsen J, Maderwald S, Küper M, et al. *Imaging the deep cerebellar nuclei: a probabilistic atlas and normalization procedure.* NeuroImage. 2011;54(3):1786–1794. https://doi.org/10.1016/j.neuroimage.2010.10.035
- **Litsenziya (Licence):** [Creative Commons Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0)](https://creativecommons.org/licenses/by-nc/3.0/) (reponing `LICENSE` faylida CC BY-NC 3.0 ko'rsatilgan; qat'iyroq shartga amal qilinadi).
- **URL:** https://github.com/DiedrichsenLab/cerebellar_atlases

### 10. BigBrain Histological Cross-Sections (`public/sections/real/*.webp`)
- **Manba (Source):** BigBrain 100 µm whole-brain histological volume registered to MNI ICBM152 2009b symmetric space (`full8_100um_2009b_sym.nii.gz`).
- **Sitata (Citation):** Amunts K, Lepage C, Borgeat L, et al. *BigBrain: An Ultrahigh-Resolution 3D Human Brain Model.* Science. 2013;340(6139):1472–1475. https://doi.org/10.1126/science.1235381
- **Litsenziya (Licence):** [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/).
- **O'zgarishlar (Modifications):** `pipeline/tools/real_slices.py` orqali 21 ta anatomik kesim tekisligida qiya kesib olingan va kontrast moslashtirilib `.webp` tasvirlarga o'tkazilgan.

---

## Third-Party Software & Decoders / Uchinchi tomon dasturlari

- **Three.js & Draco 3D Data Compression (`public/draco/*`):**
  Google Draco WebAssembly/JS dekoderi ([Apache License 2.0](https://github.com/google/draco/blob/master/LICENSE)) va Three.js ([MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE)).
- **Anatomical & Clinical References (`src/data/content/*.json`):**
  Har bir anatomik tuzilma kartasida (`Inspector`) ko'rsatilgan ilmiy maqolalar (DOI) va NCBI Bookshelf (StatPearls) manbalari Crossref hamda NCBI E-utilities orqali tasdiqlangan va bevosita havola bilan berilgan.
