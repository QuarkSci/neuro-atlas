# Neuro Atlas

**Ochiq, bepul, ta'limiy 3D neyroanatomiya atlasi** — tibbiyot talabasidan tortib PhD tadqiqotchi va neyroxirurggacha.
**An open, free, educational 3D neuroanatomy atlas** — from medical students to PhD researchers and neurosurgeons.

**Live:** https://quarksci.github.io/neuro-atlas/ · **Asos / Foundation:** [Falcon Atlas](https://github.com/QuarkSci/falcon-atlas) · **Reja / Roadmap:** [PLAN.md](PLAN.md) · **Manbalar / Licences:** [ATTRIBUTION.md](ATTRIBUTION.md)

---

## O'zbekcha

### Nima qila oladi?

- **3D Atlas (1740 qism, 9 qatlam, MNI152 fazosida):**
  - **Makroskopik anatomiya** (`gross`, BodyParts3D — 447 qism, jumladan 68 ta simmetrik ko'zgulangan qon tomir),
  - **Po'stloq parcellation qatlamlari** — **Julich-Brain v3.1** (sitoarxitektonika, 414 hudud), **Brodmann** (82), **Desikan-Killiany** (70), **Destrieux** (148), **Glasser HCP-MMP1** (358),
  - **Oq modda traktlari** (`jhu`, JHU ICBM-DTI-81 — 48 trakt),
  - **Miya ustuni** (`bstem`, Allen 3D + Harvard AAN uyg'onish yadrolari — 38 qism) va **Miyacha** (`suit`, Diedrichsen SUIT — 32 qism).
- **Ko'rish va tahlil rejimlari:**
  - *Real / Atlas rangi* (tabiiy nam to'qima ko'rinishi yoki o'quv atlas ranglari), *Qora / Yorug'* mavzu (Liquid Glass interfeysi),
  - *Tarqatish (Explode)* va *Qavatma-qavat ochish (Peel — bosh suyagidan chuqur yadrolargacha 9 qobiq)*,
  - *3 tekislikda kesish* (sagittal, koronal, aksial — MNI koordinatalari bilan),
  - *Qidiruv va Inspector* — o'zbek (`uz`), ingliz (`en`) va lotin (`la`, *Terminologia Anatomica*) tillarida nomlar, ta'rif, vazifa, klinik ahamiyati va tasdiqlangan ilmiy manbalar (DOI / NCBI).
- **O'rganish va 22 ta ko'ndalang kesim plastinkasi:**
  - Uzunchoq miya (`U1–U4`), ko'prik (`K1–K3`), o'rta miya (`O1–O3`), talamus (`T1–T2`), gipotalamus (`G1–G4`), bazal yadrolar (`B1–B5`) va miyacha (`Mc`),
  - 5 xil ko'rinish: *Sxema*, *Mielin*, *Nissl*, *Atlas (MNI meshlar kesimi)* va *Real kesim* (BigBrain 100 mkm gistologiyasi ustida atlas konturlari), zoom va to'liq ekran,
  - 3D qadamma-qadam interaktiv darslar (qorinchalar va likvor yo'li, qadoqsimon tana, limbik/Papez halqasi, o'tkazuvchi yo'llar).
- **O'tkazuvchi yo'llar va shikastlanish simulyatori:**
  - Kortikospinal (`CST`), orqa ustun–medial lemnisk (`DCML`), spinotalamik (`ALS`) va trigeminotalamik yo'llar,
  - Klassik tomir havzasi sindromlari (Wallenberg, Weber, Millard-Gubler va b.), **erkin (nuqtali) o'choq qo'yish** (sxema, atlas yoki real kesim ustida bosib radiusli o'choq qo'yish → 3D sahnada ko'rish va Waller degeneratsiyasi),
  - **Teskari rejim** (klinik belgilar va bosh miya nervlari simptomlaridan o'choq joyini topish) hamda **Tarqoq skleroz (McDonald 2017/2024)** vaqt o'qi (DIS/DIT).
- **AI Panel (`⌘/`):**
  - OpenRouter (bir bosishda PKCE kirish), shaxsiy API kalit (Anthropic, OpenAI, Google Gemini) yoki lokal model (Ollama / LM Studio),
  - Ekrandagi joriy holatni tushunadi, 16 ta vosita (`tools`) orqali 3D sahna va kesimlarni boshqaradi, sahna/plastinka suratini ko'radi, 4 ta o'quv rejimida (Repetitor, Sokratik, Klinik keys, Tadqiqot — PubMed/Crossref tekshiruvi va Anki eksport) ishlaydi.
  - *Maxfiylik:* ilova to'liq statik — API kalitlar faqat foydalanuvchi brauzerida saqlanadi va to'g'ridan-to'g'ri tanlangan AI provayderga yuboriladi.

### Texnologiyalar

Vite 8 · React 19 · TypeScript 6 · Three.js (`three-mesh-bvh`, `DRACOLoader`) · Zustand · Tailwind CSS 4 + Liquid Glass CSS.

### Ishga tushirish (Development)

```bash
npm install
npm run dev        # http://localhost:3019
npm run build      # TypeScript tekshiruvi + dist/ ga yig'ish
```

> **3D meshlar (`public/meshes/`):** 1637 ta `.glb` fayl (siqilmagan holda ~196 MB, Draco bilan **~21 MB**) `.gitignore` da turadi. Ularni hosil qilish retsepti [`pipeline/README.md`](pipeline/README.md) da, Draco bilan siqish va GitHub Release'ga chiqarish esa quyida keltirilgan.

### Draco bilan siqish va Deploy (GitHub Pages + Release)

```bash
# 1. public/meshes/ ichidagi GLB'larni Draco bilan siqish va Release arxivini yaratish (~196 MB -> ~21 MB):
pipeline/.venv/bin/python pipeline/tools/draco_meshes.py \
  --src public/meshes \
  --out /tmp/neuro-atlas-meshes-draco \
  --tar /tmp/meshes-draco.tar.gz

# 2. GitHub Release ('meshes-v1') yaratib, arxivni asset sifatida yuklash:
gh release create meshes-v1 /tmp/meshes-draco.tar.gz \
  --repo QuarkSci/neuro-atlas \
  --title "3D Meshes v1 (Draco)" \
  --notes "Draco-compressed GLB meshes for Neuro Atlas (1637 files, 21 MB)."
```

- **Standart deploy (`.github/workflows/deploy.yml`):** `master` ga har push bo'lganda workflow `meshes-v1` (yoki `vars.MESH_RELEASE_TAG`) relizidan `meshes-draco.tar.gz` assetini yuklab olib `public/meshes/` ga yoyadi va GitHub Pages artefaktiga qo'shadi (bir xil origin — CORS muammosi yo'q, sahifa ~21 MB mesh to'plami bilan tez yuklanadi).
- **Maxsus CDN / tashqi URL (`VITE_MESH_BASE`):** Agar meshlarni alohida CDN yoki tashqi manzildan bermoqchi bo'lsangiz, `VITE_MESH_BASE=https://.../meshes/` muhit o'zgaruvchisini bering (`src/scene/loader.ts` uni avtomatik o'qiydi, standart qiymati `${BASE_URL}meshes/`).
- **Lokal Draco decode:** Three.js `DRACOLoader` dekoder fayllari (`draco_decoder.wasm`, `draco_wasm_wrapper.js`, `draco_decoder.js`) `public/draco/` ichida saqlanadi — tashqi CDN talab qilinmaydi.

---

## English

### Features

- **Multi-Atlas 3D Scene (1,740 parts across 9 layers in MNI152 space):**
  - **Gross Anatomy** (`gross`, BodyParts3D v4.3 — 447 parts including 68 affinely mirrored bilateral vessels),
  - **Cortical Parcellations** — **Julich-Brain v3.1** (cytoarchitecture, 414 areas), **Brodmann** (82), **Desikan-Killiany** (70), **Destrieux** (148), **Glasser HCP-MMP1.0** (358),
  - **White-Matter Tracts** (`jhu`, JHU ICBM-DTI-81 — 48 tracts),
  - **Brainstem** (`bstem`, Allen Human Reference Atlas 3D + Harvard Ascending Arousal Network v2.0 — 38 parts) & **Cerebellum** (`suit`, Diedrichsen SUIT — 32 parts).
- **Interactive Exploration:**
  - *Realistic tissue vs. Atlas palette*, *Dark & Light Liquid Glass themes*,
  - *Explode* and *9-shell anatomical Peel* (from skull and meninges down to deep brainstem/cerebellar nuclei),
  - *3-axis MNI clipping planes* (sagittal, coronal, axial) with live cross-section caps,
  - *Trilingual Search & Inspector* (`uz` / `en` / `la`) with curated descriptions, functions, clinical correlates, and verified DOI / NCBI citations.
- **22 Cross-Section Plates & Step-by-Step 3D Lessons:**
  - Medulla (`U1–U4`), Pons (`K1–K3`), Midbrain (`O1–O3`), Thalamus (`T1–T2`), Hypothalamus (`G1–G4`), Basal Ganglia (`B1–B5`), and Cerebellum (`Mc`),
  - 5 synchronized views per level: *Schematic*, *Myelin stain*, *Nissl stain*, *Atlas MNI mesh cut*, and *Real histology* (BigBrain 100 µm slices with overlaid atlas contours),
  - Guided 3D lessons on ventricles & CSF flow, corpus callosum, limbic/Papez circuit, and major tracts.
- **Pathway Tracer & Lesion Simulator:**
  - Corticospinal (`CST`), dorsal column–medial lemniscus (`DCML`), spinothalamic (`ALS`), and trigeminothalamic pathways,
  - Classical vascular territory syndromes, **free-form focal lesion placement** (click on schematic, atlas, or BigBrain histology to place a lesion disk in mm → projected into 3D with Wallerian degeneration),
  - **Reverse localization** (signs & cranial nerve deficits → candidate lesion sites) and **Multiple Sclerosis (McDonald 2017/2024)** timeline simulator.
- **Built-in AI Tutor & Research Assistant (`⌘/`):**
  - Connect via OpenRouter (one-click PKCE login), your own API key (Anthropic, OpenAI, Google Gemini), or a local model (Ollama / LM Studio),
  - Context-aware, controls the 3D scene and section viewer via 16 tools, supports visual inspection of the 3D canvas/plates, and offers Tutor, Socratic, Clinical Case, and Research modes (with live PubMed/Crossref verification and Anki flashcard export).

### Licence & Attribution

- **Source code:** MIT License — see [LICENSE](LICENSE).
- **Anatomical meshes, parcellations & histological slices:** Each dataset retains its respective open licence (CC BY-SA 2.1 JP, CC BY-NC-SA 4.0, CC BY 4.0, CC0, CC BY-NC 3.0, FreeSurfer, FSL, WU-Minn HCP Terms). Non-commercial educational use only. See **[ATTRIBUTION.md](ATTRIBUTION.md)** for full citations and licence terms.

*by MuhammadYusuf · with Claude*
