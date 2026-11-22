# AG-1 — Kontent: parcellation qatlamlari ta'riflari (Desikan, JHU, Destrieux, Glasser)

Branch: ag/AG-1 · Commitlar: b2803a7, 0b7e969, 641e653, 6f363d5 (va shu handoff commiti) · Sana: 2026-11-22

## Nima qilindi

- **Desikan-Killiany (`src/data/content/desikan.json`, 1-commit):** barcha 35 ta konsept (70 ta 3D qism) uchun lotincha (`la`), o'zbekcha (`uz`, "Chap/O'ng" qo'shimchasisiz), inglizcha va o'zbekcha tavsif (`description`), vazifasi (`role`), klinik ahamiyati (`clinical`) va manbalar (`sources`) yozildi.
- **JHU ICBM-DTI-81 oq modda traktlari (`src/data/content/jhu.json`, 2-commit):** barcha 27 ta konsept (48 ta 3D qism — o'rta chiziq va juft traktlar) uchun lotincha va o'zbekcha nomlar, anatomik yo'nalishi, o'tkazuvchi tolalari, klinik uzilish va shikastlanish sindromlari hamda Crossref'da tasdiqlangan Mori et al. 2008, Wakana et al. 2004 va Hua et al. 2008 manbalari kiritildi.
- **Destrieux pushta va egatlar (`src/data/content/destrieux.json`, 3-commit):** FreeSurfer `aparc.a2009s` qatlamining barcha 74 ta konsepti (148 ta 3D qism) uchun lotincha va o'zbekcha nomlar, sulkal/giral anatomik chegaralar, funksional va neyroxirurgik/klinik ahamiyati hamda Destrieux et al. 2010 manbasi yozildi.
- **Glasser HCP-MMP1 (`src/data/content/glasser.json`, 4-commit):** Human Connectome Project multimodal parcellatsiyasining `parts.json` dagi barcha 179 ta konsepti (360 ta 3D qism) uchun o'zbekcha nomlar, funksional/mielin/topografik tavsifi, tarmoq vazifasi, klinik bog'lanishi va Glasser et al. 2016 Nature manbasi yozildi.
- **Ulanish (`src/data/content/index.ts`):** faqat 4 ta yangi JSON fayl importi va `FILES` ro'yxatiga qo'shilishi bajarildi (jami 315 ta yangi konsept, 626 ta 3D qism o'z shaxsiy ta'rifiga ega bo'ldi; `inheritedContent = false`).

## O'zgargan fayllar (hammasi vazifa ro'yxatida bo'lishi shart)

- `src/data/content/desikan.json` (yangi)
- `src/data/content/jhu.json` (yangi)
- `src/data/content/destrieux.json` (yangi)
- `src/data/content/glasser.json` (yangi)
- `src/data/content/index.ts` (faqat importlar va `FILES`)
- `docs/handoff/AG-1.md` (yangi)
- `docs/handoff/AG-1/desikan-uz.png` (yangi)
- `docs/handoff/AG-1/desikan-en.png` (yangi)
- `docs/handoff/AG-1/jhu-uz.png` (yangi)
- `docs/handoff/AG-1/glasser-uz.png` (yangi)

## Tekshiruv

- `tsc` ✅ (`npx tsc -p tsconfig.app.json --noEmit` — xatolar: 0)
- `build` ✅ (`npm run build && rm -rf dist` — muvaffaqiyatli)
- `audit-lesions`: `territories: 86, mismatches: 0` ✅
- `audit-pick`: `diff 0` ✅
- **Konsept ID tekshiruvi (`parts.json` bilan solishtirma):**
  - `desikan`: kutilgan = 35, yozilgan = 35, noma'lum id = **0**, yetishmayotgan id = **0**
  - `jhu`: kutilgan = 27, yozilgan = 27, noma'lum id = **0**, yetishmayotgan id = **0**
  - `destrieux`: kutilgan = 74, yozilgan = 74, noma'lum id = **0**, yetishmayotgan id = **0**
  - `glasser`: kutilgan = 179, yozilgan = 179, noma'lum id = **0**, yetishmayotgan id = **0**
  - `uz` maydonida "Chap/O'ng" qatnashgan yozuvlar = **0**
- **Screenshotlar (`docs/handoff/AG-1/*.png`, 900×560):**
  - `docs/handoff/AG-1/desikan-uz.png` — Desikan-Killiany qatlamida `dk-superior-frontal-gyrus` (Yuqori peshona pushtasi) tanlangan, Inspector kartasi o'zbek tilida.
  - `docs/handoff/AG-1/desikan-en.png` — Desikan-Killiany qatlamida `dk-superior-frontal-gyrus` tanlangan, Inspector kartasi ingliz tilida.
  - `docs/handoff/AG-1/jhu-uz.png` — JHU oq modda qatlamida `wm-superior-longitudinal-fasciculus` (Yuqori bo'ylama tutam) tanlangan, Inspector kartasi o'zbek tilida.
  - `docs/handoff/AG-1/glasser-uz.png` — Glasser HCP-MMP1 qatlamida `gl-primary-motor-cortex` (Birlamchi harakat po'stlog'i) tanlangan, Inspector kartasi o'zbek tilida.
- **Manbalar (Crossref API `https://api.crossref.org/works/<doi>` orqali tekshirilgan DOI'lar ro'yxati):**
  - `10.1016/j.neuroimage.2006.01.021` — _Desikan et al. 2006, NeuroImage — An automated labeling system for subdividing the human cerebral cortex on MRI scans into gyral based regions of interest_
  - `10.1016/j.neuroimage.2007.12.035` — _Mori et al. 2008, NeuroImage — Stereotaxic white matter atlas based on diffusion tensor imaging in an ICBM template_
  - `10.1148/radiol.2301021640` — _Wakana et al. 2004, Radiology — Fiber Tract–based Atlas of Human White Matter Anatomy_
  - `10.1016/j.neuroimage.2007.07.053` — _Hua et al. 2008, NeuroImage — Tract probability maps in stereotaxic spaces: Analyses of white matter anatomy and tract-specific quantification_
  - `10.1016/j.neuroimage.2010.06.010` — _Destrieux et al. 2010, NeuroImage — Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature_
  - `10.1038/nature18933` — _Glasser et al. 2016, Nature — A multi-modal parcellation of human cerebral cortex_

## Ochiq savollar / qolgan ishlar

- Yo'q. Barcha 4 qatlam (315 ta konsept / 626 ta qism) to'liq yozildi va tekshirildi.

## Ko'rib chiqish (Claude to'ldiradi)
✅ Qabul qilindi va birlashtirildi (2026-11-22). Tekshirildi: qamrov, id'lar (0/0), maydonlar to'liqligi, 'Chap/O'ng' yo'q, 6 DOI Crossref'da, Wikipedia havolalari, tsc/build/audit-lesions/audit-pick, Glasser screenshot, tanlab anatomik o'qish. Bitta xato: `Lateral_occipital_gyrus` Wikipedia'da 404 (shu havola `gross-brain.json` da ham bor edi) — `Occipital_lobe` ga almashtirildi. Eslatma kelgusi kontent uchun: Wikipedia havolasini yozishdan oldin sahifa mavjudligini tekshiring.
