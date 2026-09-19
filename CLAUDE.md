# Neuro Atlas — loyiha holati (Claude uchun qo'llanma)

> Yangi chatda ishni davom ettirish uchun shu faylni va `PLAN.md`ni o'qing.
> Foydalanuvchi (MuhammadYusuf) o'zbek tilida yozadi, javoblar o'zbek tilida.
> Kod izohlari ingliz tilida.
>
> Oxirgi yangilanish: 2026-09-19 (2-bosqich: ilova skeleti ishlaydi).

## 1. Loyiha nima

Neyroxirurg/neyroanatomlar uchun ochiq, bepul, ta'limiy 3D neyroanatomiya
atlasi — 1700+ qism (gross anatomiya + Brodmann + bir nechta po'stloq
parcellation qatlamlari + traktlar + tomirlar + bosh nervlar).
**Falcon Atlas** (`../falcon-atlas`, https://github.com/QuarkSci/falcon-atlas)
ning davomi: o'sha dizayn (Liquid Glass), o'sha arxitektura (Three.js
custom scene klassi + zustand + shadcn), lekin geometriya procedural emas —
haqiqiy atlas meshlari (`PLAN.md` 1-2 bo'limlar).

Tamoyil: **"perfektlik vaqtdan ustun"**. Hech narsa brauzerda screenshot
bilan tekshirilmasdan "tayyor" deyilmaydi.

- GitHub: https://github.com/QuarkSci/neuro-atlas (akkaunt **QuarkSci**,
  git sozlamasidagi `MuhammadYusuf-scientist` bilan adashtirmang)
- Sayt: https://quarksci.github.io/neuro-atlas/ (deploy 6-bosqichda)

## 2. Qat'iy qoidalar

- Litsenziya: faqat ochiq/bepul/ta'limiy manbalar. **CC BY-ND — TAQIQ**
  (mesh hosil qilish derivativ). NC — mumkin. Har bir qism `source`
  maydonida manba + litsenziyani olib yuradi.
- Falcon'dagi barcha texnik saboqlar shu yerda ham amal qiladi
  (`../falcon-atlas/CLAUDE.md` 5, 11, 12-bo'limlar): `clearcoat: 0`,
  DOM-asosli kamera insets, `warmUp()`, wheel listener ota elementda,
  `.bottom-dock` nomi, fluid `--u` shkala, faqat qora rejim.
- Dizayn farqlari Falcon'dan: Inspector `.glass` foni to'qroq (matn
  o'qilishi uchun), pastki burchakda `by MuhammadYusuf · with Claude`.
- Har commit'dan oldin: `npx tsc -p tsconfig.app.json --noEmit`,
  `npm run build`, `rm -rf dist`. Commit xabarlari o'zbek tilida, batafsil.
- `data/raw/` va `public/meshes/` hech qachon commit qilinmaydi.

## 3. Hozirgi holat

- ✅ 0-bosqich: manbalar auditi (`PLAN.md` 1-bo'lim).
- ✅ 1-bosqich: pipeline sinovi (2026-09-19) — brauzerda tasdiqlangan:
  - `pipeline/fetch_bp3d.py` — BodyParts3D 4.3 OBJ'larni GitHub LFS
    mirror'dan (olivercase/body_parts_3d_api) yuklaydi; fayl nomidagi FMA id
    ishonchli, MANIFEST.csv'dagi `fma_id` esa yo'q (ota-konsept).
  - `pipeline/bp3d_to_glb.py` — OBJ → GLB. BodyParts3D freymi: mm, +X chap,
    +Y orqa, +Z yuqori, z≈1500 (oyoqdan). `TO_RAS` flip + `align_bp3d.json`
    affine bilan MNI152'ga o'tkaziladi.
  - `pipeline/julich_to_glb.py` — siibra orqali Julich-Brain 3.1 MNI152
    labelled map (2 fragment: chap/o'ng yarim shar, 414 hudud) → marching
    cubes → Taubin silliqlash → GLB. Birinchi ishga tushishda siibra ~7 min
    konfiguratsiya yuklaydi (keyin kesh).
  - `pipeline/align_bp3d.py` — 20 landmark juftligi (po'stloq osti + Julich
    to'liq qoplaydigan gyruslar) bo'yicha 12-parametrli affine, RMS 5.3 mm.
    Julich faqat qisman qoplaydigan gyruslar (parahippocampal, lingual,
    fusiform, STG) landmark sifatida YARAMAYDI (10–24 mm xato) — chiqarilgan.
  - `pipeline/preview/index.html` — minimal Three.js viewer
    (`?layers=gross,julich&opacity=gross:0.22&view=lateral|front|top`),
    `python3 -m http.server 3018` bilan ochiladi.
  - Muhim: trimesh `export(file_type='glb')` normal yozmaydi → mesh qora
    ko'rinadi. `include_normals=True` shart.
- ✅ 2-bosqich: ilova skeleti (2026-09-19) — brauzerda tekshirilgan
  (desktop 800px va telefon 375×812): 585 qism (76 gross + 508 Julich, shu
  jumladan 14 ta Julich guruh-qismi) yuklanadi, tanlash/hover/Inspector/
  qidiruv (juftlik konseptlari)/tizim va qatlam toggle/isolate/kesim/
  explode+inventar/4 kamera ko'rinishi ishlaydi.
  - `src/data/parts.json` — `pipeline/build_catalogue.py` hosil qiladi
    (gross.json + julich.json). Tizim nom bo'yicha regex bilan, Julich
    guruhlari qavs ichidagi bosh so'zdan (`Thalamus`, `PostCG`…).
    Bir xil nomli BodyParts3D meshlar: ko'zguli bo'lsa chap/o'ng yarim,
    aks holda ko'p yuzlisi qoladi.
  - `src/scene/loader.ts` — GLTFLoader, 12 parallel; MNI (RAS) → sahna
    `(−x, z, y)` matritsasi geometriyaga "pishiriladi" (Y yuqoriga, old
    kamera +Z dan). Meshlar `public/meshes/<layer>/<id>.glb` — gitignore.
  - `src/scene/BrainScene.ts` — RocketScene'dan; flight/alanga/pad yo'q,
    three-mesh-bvh raycast, kesim tanlovni hisobga oladi, kamera sfera
    bo'yicha kadrlaydi (margin 0.68 — sfera uzunchoq miya uchun katta).
  - `L10n.uz/la` ixtiyoriy; `useL()` inglizchaga tushadi (kontent 5-bosqich).
  - Dizayn: `.inspector.glass` to'qroq (78% qora ramp, blur 18px),
    `.studio-credit` pastki o'ng burchak (telefonda yuqori panel ostida).
  - Dev server porti **3019** (Falcon 3017 bilan to'qnashmasin).
  - Preview vositasi (`preview_start`) sessiya Falcon papkasida boshlangan
    bo'lsa hamon 3017 ni o'qiydi — bunda `npm run dev` fonda ishga tushirib
    `navigate` bilan ochish kerak. Brauzer pane screenshot'i ba'zan bir
    qadam kechikadi — `wait` qo'shib qayta oling.
- ⬜ 3-bosqich: to'liq import — KEYINGI QADAM (qolgan BodyParts3D bosh
  qismlari: tomirlar, bosh nervlari, meninges, bosh suyagi; Brodmann; DK/
  Destrieux; Glasser; traktlar; performance).
- ⬜ 4–7.

## 4. Ma'lum xatolar tarixi

(hali bo'sh — Falcon'dagi ro'yxatni takrorlamang)
