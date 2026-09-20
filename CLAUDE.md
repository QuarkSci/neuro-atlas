# Neuro Atlas — loyiha holati (Claude uchun qo'llanma)

> Yangi chatda ishni davom ettirish uchun shu faylni va `PLAN.md`ni o'qing.
> Foydalanuvchi (MuhammadYusuf) o'zbek tilida yozadi, javoblar o'zbek tilida.
> Kod izohlari ingliz tilida.
>
> Oxirgi yangilanish: 2026-09-20 (3b: miya ustuni/miyacha qatlamlari; 5-bosqich kontent 281 yozuv).

## 0. YANGI SESSIYADA BIRINCHI QADAMLAR (shu tartibda)

1. Shu faylni to'liq o'qing; `PLAN.md` 3-bo'lim (bosqichlar jadvali) va
   4-bo'lim (xavflar) — qisqa.
2. Holatni tekshiring: `git status` toza, `git log --oneline | head -5`
   oxirgi commit `3b`-bosqich commit'i ("Miya ustuni va miyacha...") yoki undan keyingisi bo'lishi kerak.
3. Meshlar diskda bor (`public/meshes/` ~195 MB, 9 papka; `data/raw/`
   ~125 MB) — gitignore'da, QAYTA HOSIL QILISH SHART EMAS. Agar yo'q bo'lsa
   (yangi kompyuter): `pipeline/README.md` retsepti (barcha yuklab olish
   URL'lari shu yerda va skript docstringlarida).
4. Dev server: `npm run dev` → http://localhost:3019 (**3019**, Falcon 3017
   band). `preview_start` vositasi ishlamasa (Falcon konfiguratsiyasini
   o'qib qolgan bo'lsa) — `npm run dev`ni fonda Bash bilan ishga tushirib
   `navigate` qiling.
5. Tekshiruv uchun ikki yo'l: brauzer pane (foydalanuvchi bir vaqtda
   pane'da ishlayotgan bo'lsa state o'zgarib turadi — bunda ishlatmang) yoki
   headless: `node scripts/shot.mjs out.png --lang uz --setup "JS" --wait
   3000` (`__atlas.getState()`, `__scene` global). Qatlam yuklanishi
   kerak bo'lsa `--wait 12000`+.
6. Har commit oldidan: `npx tsc -p tsconfig.app.json --noEmit && npm run
   build && rm -rf dist`. Commit xabari o'zbekcha, batafsil (nima va NEGA),
   `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` bilan. Push
   `origin master`. Uzun xabarni `-F fayl` bilan bering (ichida `"`
   bo'lsa `-m` buziladi — bir marta shunday xato bo'lgan).
7. Har bosqich oxirida shu faylning 3-bo'limi va `PLAN.md` jadvalini
   yangilang.

**Keyingi vazifa (foydalanuvchi tanlaydi, ikkalasi ham navbatda):**
- **5-bosqich davomi — kontent.** Fayl formati va id'lar quyida
  (3-bo'lim, 5-bosqich). Ustuvorlik: (a) `uz` nomlar — mexanizm TAYYOR
  (yozuvda `"uz": "Ko'k dog'"`, ilova `Chap/O'ng` prefiksini o'zi qo'shadi,
  `sidedName()` `data/index.ts`); gross-brain 112, brainstem 24, cerebellum
  24 yozuvda bor; QOLGAN: gross-vessels 33, julich-groups 47, brodmann 41;
  (b) Julich 207 alohida hudud
  (`julich-areas.json`, id = `j-<slug>` masalan `j-vim`, `j-ca1`,
  `j-area-4a`); (c) Desikan 35 (`dk-<slug>`), Destrieux 75 (`ds-<slug>`),
  JHU ~30 (`wm-<slug>`), Glasser 180 (`gl-<slug>`). Id'larni olish:
  `python3 -c "import json;d=json.load(open('src/data/parts.json'));
  print(sorted(set(p['concept'] for p in d['parts'] if p['layer']=='julich')))"`.
  Yangi faylni `content/index.ts` `FILES` ro'yxatiga qo'shing. Har
  yozuvda `sources` shart. Tekshiruv: JSON yuklanadi + `unmatched` bo'sh
  (skript 5-bosqich bandida).
- **4-bosqich — kesim.** Hozirgi `cutaway` bitta vertikal tekislik
  (Falcon'dan). Kerak: sagittal/koronal/aksial 3 slayder (MNI mm),
  `clipPlane` → 3 ta `T.Plane`, `interiorMaterial`/`material.clippingPlanes`
  massivini yangilash, Inspector/PlanesPanel'da MNI koordinata ko'rsatish,
  kesilgan tomon pick'da e'tiborsiz (`pick()` allaqachon plane'ni
  tekshiradi — 3 taga kengaytiring). `ui/ViewControls.tsx` → `PlanesPanel`.
- **6-bosqich — deploy:** meshlar 183 MB — GitHub Pages'ga sig'adi (1 GB),
  lekin `public/meshes` gitignore'da; variant: Draco siqish
  (`gltf-transform`) + GitHub Release asset yoki alohida `neuro-atlas-data`
  repo + `MESHES_URL` env. `deploy.yml` Falcon'dan ko'chirilgan, `VITE_BASE`
  ishlaydi.

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
- ✅ Chuqurlik (peel) rejimi (2026-09-19): pastki tablar Tarqatish/Chuqurlik,
  `DEPTH_LEVELS` qobiqlari (`data/index.ts`), har qobiq bir qadamda
  shaffoflashib yo'qoladi, damp tugagach kamera qayta kadrlanadi.
- ✅ 3-bosqich: to'liq import (2026-09-20) — 1571 qism, 7 qatlam:
  - gross 355 (BodyParts3D: miya + tomirlar 178 + bosh nervlari 29 +
    bosh suyagi 22 + pardalar 4 + gipotalamus yadrolari, qizil yadro,
    substantia nigra, subtalamik yadro…). `pipeline/bp3d_phase3.txt` —
    tanlov manifest `fma_id` oilalari + nom regex bilan (`bp3d_to_glb.py`
    bir nomli segmentlarni birlashtiradi — tomirlar 5–20 fayl; ko'zguli
    juftlik bo'lsa chap/o'ng; MAX_FACES 24000 decimatsiya,
    fast-simplification).
  - julich 508, brodmann 82, desikan 70, destrieux 148, glasser 360,
    jhu 48 — `pipeline/volume_to_glb.py <atlas>` neuroparc (neurodata,
    MNI152NLin6 1 mm) NIfTI'laridan; "simmetrik" atlaslar (Brodmann,
    Glasser, Destrieux) yarim sharlarni bir label bilan beradi — x<0
    bo'yicha chap/o'ngga bo'linadi. Fayllar `data/raw/neuroparc/`.
  - Qatlamlar **talab bo'yicha yuklanadi** (`SceneView.tsx` `loadLayer`,
    `BrainScene.addGeometries`): boshida faqat gross (38 MB), qatlam
    yoqilganda yoki undagi qism tanlanganda qolgani. `last = null`
    qayta-visibility uchun; `framedOnce` bayrog'i kamerani qayta
    kadrlashdan saqlaydi.
  - Po'stloq parcellation'lari (`Layer.parcellation`) o'zaro istisno
    (`toggleLayer`), yoqilganda gross po'stloq (`GROSS_CORTEX_IDS`)
    yashiriladi — parcellation po'stloq o'rnini bosadi.
  - Parcellation maydonlari ranglari golden-ratio hue tarqalishi bilan
    (`materials.ts`), qatlam rangi atrofida; `LAYER_COLORS` UI swatch'lar.
  - Kamera `modelBox` faqat miya tizimlaridan (`BRAIN_SYSTEMS`) — jugular
    vena bo'yingacha tushadi, aks holda miya kichrayib qolardi. Bosh
    suyagi va pardalar sukut bo'yicha yashirin (`DEFAULT_VISIBLE`).
  - `scripts/shot.mjs` port 3019, `na:lang`. Brauzer pane'da foydalanuvchi
    ishlayotgan bo'lsa headless screenshot ishlating.
- ✅ 3b-bosqich: miya ustuni / miyacha chuqurlashtirish (2026-09-20) —
  foydalanuvchi talabi: po'stloqdagi kabi sopi/o'rta miya/miyacha ham
  sub-qismlarga bo'linsin. 1672 qism, 9 qatlam:
  - `bstem` (41: 3 guruh + 38 mesh) — Allen Human Reference Atlas 3D 2020
    (CC BY 4.0; 0.5 mm, hemisfera-ko'zguli → x<0 bo'yicha chap/o'ng):
    o'rta miya tegmentumi, pretektum, crus cerebri, bazilyar ko'prik, ko'prik
    tegmentumi, 3 miyacha oyoqchasi, piramida, medulla tegmentumi, pastki
    zaytun; + Harvard AAN v2.0 (CC0): LC, DR, MnR, PAG, VTA, PTg(PPN), LDTg,
    PBC, PnO, mRt. Guruhlar `bs-midbrain`/`bs-pons`/`bs-medulla`.
  - `suit` (36: 4 guruh + 32) — Diedrichsen 2009 (CC BY-NC 3.0): I–IV, V,
    VI, Crus I/II, VIIb, VIIIa/b, IX, X yarim shar + vermis, dentate,
    interposed (fastigial max-prob'da 3 voksel — o'tkazildi, Julich'da bor).
    Guruhlar `cb-anterior-lobe`/`cb-posterior-lobe`/`cb-flocculonodular-lobe`/
    `cb-deep-nuclei`.
  - gross +24 (`pipeline/bp3d_phase4.txt`): precuneus, cuneus, superior
    parietal lobule, septum, fornix komissurasi, chakka oq moddasi, cerebral
    crus, stria medullaris, tuber cinereum, lateral/medial preoptic, SCN,
    supraoptic, periventricular yadrolar.
  - `pipeline/subcortical_to_glb.py bstem|suit` (bbox-crop marching cubes);
    `build_catalogue.py` `SUB` bloki guruhlar + `meshSource` (Inspector'da
    aralash qatlam uchun mesh manbasi alohida ko'rsatiladi).
  - `Layer.covers` (RegExp) — qatlam yoqilganda yashiriladigan gross
    qismlar (`bstem` → pons/medulla/crus, `suit` → miyacha L/R);
    parcellation'lar `GROSS_CORTEX_IDS`. `coveredIds()` BrainScene'da.
  - Peel 8-qobiq "Miya ustuni va miyacha yadrolari" (`DEEP_HINDBRAIN`
    regex): tegmentum yechilganda LC/raphe/PAG/VTA/olive/SN/RN/dentate qoladi.
  - RAD ETILDI (litsenziya, tarqatish taqiq): Brainstem Navigator (MGH, 31
    yadro), USC brainstem pathways (Tang 2018). Bosh nerv yadrolari
    (III–XII motor/sezgi, ambiguus, solitarius, cuneate/gracile) uchun ochiq
    MNI atlas TOPILMADI — Inspector matnida tegmentum yozuvlarida sanab
    o'tilgan. Kelajak: Allen 3D'ning old miya qismi (amigdala 9 yadro,
    gippokamp bosh/tana/dum, kaudat 3, BNST, septal, bazal old miya) alohida
    qatlam sifatida.
- ⬜ 4-bosqich: kesim (3 tekislik + MNI koordinata) — parcellation
  almashtirish 3-bosqichda qilindi.
- 🟡 5-bosqich: kontent — boshlandi (2026-09-20), 281 yozuv:
  - Mexanizm: `src/data/content/*.json` — konsept id bo'yicha (chap/o'ng
    juftlik bitta yozuv): `la`, `description`, `role`, `clinical` (en/uz),
    `sources`. `content/index.ts` `contentFor()` — o'z yozuvi yo'q bo'lsa
    Julich sub-hududi ota guruhidan, tomir shoxi `FAMILIES` regex bo'yicha
    oila yozuvidan meros oladi (`inheritedContent` → Inspector'da eslatma).
    `data/index.ts` kontentni PARTS'ga bir marta yopishtiradi.
  - Yozilgan: gross-brain.json 112 (gyruslar, chuqur yadrolar, gipotalamus
    yadrolari, miya ustuni, miyacha, qorinchalar, oq modda, 12 bosh nervi,
    pardalar, bosh suyagi; barchasida `uz` nom), gross-vessels.json 33
    (Willis halqasi, asosiy arteriyalar, sinuslar, venalar), julich-groups.json
    47 (barcha Julich guruhlari), brodmann.json 41, brainstem.json 24,
    cerebellum.json 24 (neyroxirurgik daraja: DBS nishonlari, sindromlar).
  - QOLGAN: Julich alohida hududlari (207), Desikan (35), Destrieux (75),
    Glasser (180), JHU traktlari (~30); `uz` nomlar vessels/julich-groups/
    brodmann yozuvlarida.
  - Manbalar: Wikipedia (CC BY-SA), NCBI Bookshelf (Purves Neuroscience,
    StatPearls), Julich-Brain asl maqolalari (DOI). Har yozuvda `sources`.
- ⬜ 6–7.

## 4. Ma'lum xatolar tarixi (takrorlamaslik uchun)

1. trimesh GLB eksporti normal yozmaydi → meshlar qora (`include_normals`).
2. Julich qisman qoplaydigan gyruslar landmark sifatida 10–24 mm xato.
3. Peel qayta-kadrlash sharti `last.peel !== s.peel` faqat birinchi kadrda
   rost — damp tugamasdan o'tib ketardi; `lastFitPeel` bilan tuzatildi.
4. Sfera bo'yicha kadrlash uzunchoq miya uchun katta bo'sh joy qoldiradi —
   margin 0.68.
5. Tomirlar/jugular bo'yingacha tushadi — `modelBox` faqat `BRAIN_SYSTEMS`.
6. Brauzer pane screenshot'i bir qadam kechikishi va foydalanuvchi bir
   vaqtda pane'da ishlashi mumkin — muhim tekshiruvlarni headless qiling.
7. `git commit -m` ichida `"` — pathspec xatosi; `-F` ishlating.
8. `--setup`da noto'g'ri id (`j-vim-thalamus-...`) → bo'sh tanlov + isolate
   → qora ekran; id'larni `parts.json`dan tekshiring (`j-vim-left`).
9. Brauzer pane yashirin (fonda) bo'lsa `requestAnimationFrame` ishlamaydi —
   `setState` qo'llanmaydi, `mesh.visible` eski qoladi. JS bilan tekshirishdan
   oldin `screenshot` oling (tab oldinga chiqadi) yoki headless ishlating.
10. NITRC'dagi "ochiq" atlaslar (Brainstem Navigator, USC brainstem
    pathways) litsenziyasi "may not distribute ... derived" — yuklashdan
    OLDIN agreement sahifasini o'qing (`curl` zip o'rniga HTML qaytaradi).
11. SUIT: README CC BY, LICENSE fayli CC BY-NC 3.0 — fayl ustun.
