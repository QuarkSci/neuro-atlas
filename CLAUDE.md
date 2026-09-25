# Neuro Atlas — loyiha holati (Claude uchun qo'llanma)

> Yangi chatda ishni davom ettirish uchun shu faylni va `PLAN.md`ni o'qing.
> Foydalanuvchi (MuhammadYusuf) o'zbek tilida yozadi, javoblar o'zbek tilida.
> Kod izohlari ingliz tilida.
>
> Oxirgi yangilanish: 2026-09-25 (4-bosqich tugadi: 3 tekislikli kesim + 8 ta klassik "daraja" xaritkasi, ma'lumotdan hisoblanadigan tuzilma ro'yxati bilan).

## 0. YANGI SESSIYADA BIRINCHI QADAMLAR (shu tartibda)

1. Shu faylni to'liq o'qing; `PLAN.md` 3-bo'lim (bosqichlar jadvali) va
   4-bo'lim (xavflar) — qisqa.
2. Holatni tekshiring: `git status` toza, `git log --oneline | head -3`
   oxirgi commit — "4-bosqich: 3 tekislikli kesim…" (2026-09-25) yoki undan
   keyingisi; `git rev-parse HEAD origin/master` bir xil bo'lishi kerak.
3. Meshlar diskda bor — gitignore'da, QAYTA HOSIL QILISH SHART EMAS:
   `public/meshes/` 196 MB (9 papka: gross 42, glasser 34, julich 29,
   destrieux/brodmann/desikan/jhu, bstem 4.7, suit 4.4 MB),
   `data/raw/` 154 MB (bp3d, julich, neuroparc, brainstem, suit).
   Yangi kompyuterda: `pipeline/README.md` — to'liq retsept, barcha
   yuklab olish URL'lari 2026-09-22 da sinovdan o'tkazilgan (neuroparc
   fayllari baytma-bayt mos chiqdi).
4. Dev server: `npm run dev` → http://localhost:3019 (**3019**, Falcon 3017
   band). `preview_start` vositasi ishlamasa (Falcon konfiguratsiyasini
   o'qib qolgan bo'lsa) — `npm run dev`ni fonda Bash bilan ishga tushirib
   `navigate` qiling.
5. Tekshiruv uchun ikki yo'l: brauzer pane (foydalanuvchi bir vaqtda
   pane'da ishlayotgan bo'lsa state o'zgarib turadi — bunda ishlatmang) yoki
   headless: `node scripts/shot.mjs out.png --lang uz --setup "JS" --wait
   3000` (`__atlas.getState()`, `__scene` global). Qatlam yuklanishi
   kerak bo'lsa `--wait 12000`+. Tayyor smoke-test (miya ustuni + miyacha
   qatlamlari yuklanadi, 449 mesh ko'rinadi):
   ```bash
   node scripts/shot.mjs /tmp/smoke.png --lang uz --wait 13000 --setup "const a=__atlas.getState(); a.showOnly(['brainstem','cerebellum','diencephalon']); a.setLayers(['gross','bstem','suit']); a.setView('lateral')"
   ```
   Ma'lumotlar butunligi (unmatched bo'sh, har yozuvda sources va uz matn):
   ```bash
   python3 -c "
   import json,glob
   c={p['concept'] for p in json.load(open('src/data/parts.json'))['parts']}
   k={}
   for f in glob.glob('src/data/content/*.json'):
       for a,b in json.load(open(f)).items():
           k[a]=f; assert b.get('sources'), (f,a); assert 'uz' in b['description'], (f,a)
   print('yozuv',len(k),'unmatched',[x for x in k if x not in c])"
   ```
6. Har commit oldidan: `npx tsc -p tsconfig.app.json --noEmit && npm run
   build && rm -rf dist`. Commit xabari o'zbekcha, batafsil (nima va NEGA),
   `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` bilan. Push
   `origin master`. Uzun xabarni `-F fayl` bilan bering (ichida `"`
   bo'lsa `-m` buziladi — bir marta shunday xato bo'lgan).
7. Har bosqich oxirida shu faylning 3-bo'limi va `PLAN.md` jadvalini
   yangilang.

**Keyingi vazifa — foydalanuvchi tanlaydi. B tugadi, A va C tayyor turibdi:**

**A) 5-bosqich davomi — kontent (eng ko'p qolgan ish).**
Format: `src/data/content/<fayl>.json`, kalit = konsept id, qiymat =
`{la?, uz?, description{en,uz}, role?{en,uz}, clinical?{en,uz}, sources[]}`.
Yangi faylni `src/data/content/index.ts` `FILES` massiviga qo'shing.
`uz` — tuzilma NOMI (tomonsiz); ilova `Chap/O'ng` prefiksini o'zi qo'shadi
(`sidedName()`, `src/data/index.ts`; rim raqamlari/qisqartmalar katta
harfda qoladi). Ustuvorlik tartibi:
1. ✅ `uz` nomlar — barcha 487 yozuvda bor (2026-09-24).
2. ✅ Julich alohida hududlari — 206 konsept, `julich-areas.json`
   (2026-09-24). Manba generatori scratchpad'da edi; yangi fayllar uchun
   xuddi shu uslub: bir qatorda bitta yozuv, kalit tartibi
   `uz, description, role?, clinical?, sources`.
3. QOLGAN: Glasser 179 (`gl-<slug>`), Destrieux 74 (`ds-<slug>`),
   Desikan 35 (`dk-<slug>`), JHU 27 (`wm-<slug>`).
Manba URL'larini yozgach tekshiring: DOI — Crossref API
(`https://api.crossref.org/works/<doi>`, doi.org nashriyotga 403 beradi),
Wikipedia — HTTP 200 (2026-09-24 da ikki sahifa 404 chiqdi va almashtirildi).
Id ro'yxatini olish:
```bash
python3 -c "import json;d=json.load(open('src/data/parts.json'));print(sorted({p['concept'] for p in d['parts'] if p['layer']=='julich' and not p.get('group')}))"
```
Har yozuvda `sources` SHART. Tugatgach 0-bo'lim 5-bandidagi butunlik
skriptini ishlating (`unmatched` bo'sh bo'lishi kerak).

**B) ✅ 4-bosqich — kesim (3 tekislik) TUGADI (2026-09-25).**

**C) 6-bosqich — deploy.** Meshlar 196 MB, `public/meshes` gitignore'da.
GitHub Pages limiti 1 GB — sig'adi, lekin variantlar: Draco siqish
(`gltf-transform optimize --compress draco`) + GitHub Release asset, yoki
alohida `neuro-atlas-data` repo + `MESHES_URL` env. `deploy.yml` Falcon'dan
ko'chirilgan, `VITE_BASE` ishlaydi.

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
- ✅ 4-bosqich: kesim — 3 mustaqil tekislik + klassik "daraja" xaritkalari
  (2026-09-25):
  - `useAtlas.clip: Record<'sagittal'|'coronal'|'axial', {enabled,mm,flip}>`
    eski `cutaway`/`cutawayAngle`ni almashtirdi; `cutaway: boolean` panel
    ochiq/yopiqligi va bosh o'chirgich bo'lib qoladi (o'chirilganda barcha
    tekisliklar `BrainScene`da e'tiborga olinmaydi, lekin `clip` holati
    saqlanadi — panel qayta ochilganda tiklanadi). `setClipAxis(axis,
    patch)`, `jumpToLevel(mm)` (aksial=mm, sagittal/koronal o'chadi,
    `view:'lateral'` — yuqoridan qaralganda gorizontal kesim ko'rinmaydi).
  - `BrainScene.clipPlanes: [T.Plane,T.Plane,T.Plane]` — doim 3 uzunlikdagi
    massiv (`material.clippingPlanes` hech qachon qayta tayinlanmaydi,
    faqat `constant` o'zgaradi: o'chirilgan tekislik 1e5ga suriladi).
    MNI(RAS)→sahna `(−x,z,y)` pishirilgan matritsaga mos: sagittal sahna
    X'ga, koronal sahna Z'ga, aksial sahna Y'ga bog'liq; barcha uch o'qda
    `constant = flip ? mm : -mm` formulasi ishlaydi (normal belgisi flip
    bilan teskarilanadi). `pick()` va interior-cap material barcha uchta
    tekislikni hisobga oladi. 3 ta indikator (`clipIndicators`, rang bilan
    ajratilgan: sagittal ko'k, koronal yashil, aksial to'q sariq) — bir
    vaqtda bir nechta tekislik yoqilsa burchak kesim (intersection) hosil
    bo'ladi.
  - `src/data/levels.ts` — `LEVELS`: 8 ta klassik o'quv darajasi (uzunchoq
    miya 3, ko'prik 2, o'rta miya 2, talamus 1), MNI z mm qiymatlari
    ATLASNING O'Z geometriyasidan (Allen/neuroparc bbox) olingan, daraja
    soni konvensiyasi Haines/Blumenfeld darsliklaridan. `partsAtAxialLevel
    (mm, visible, layers)` — berilgan z darajasida haqiqatda ko'rinadigan
    qismlarni HAR SAFAR HAQIQIY `bbox`dan hisoblaydi (qo'lda yozilgan matn
    emas) — shuning uchun har qanday mm uchun to'g'ri, sinovdan o'tgan
    (masalan z=-54: pastki zaytun + piramida + tegmentum + miyacha —
    darslikdagi "o'rta-olivar daraja"ga mos). `CLIP_RANGE` — slayder
    chegaralari, PARTS bbox'idan.
  - Muhim: `levels.ts` → `index.ts`ni import qiladi (LEAF_PARTS,
    coveredIds); `index.ts` `levels.ts`ni qayta eksport QILMASIN — aylanma
    import ESM'da "Cannot access before initialization" beradi (import
    hoisting: barcha import'lar joriy modul tanasidan OLDIN bajariladi).
    UI komponentlari `levels.ts`dan to'g'ridan-to'g'ri import qiladi.
  - `src/ui/ViewControls.tsx` `PlanesPanel` (eski `CutawayPanel` o'rnida):
    3 slayder+flip tugmasi, darajalar tugmalari (tuzilma bo'yicha
    guruhlangan), aksial yoqilganda "shu darajadagi tuzilmalar" ro'yxati
    (bosilsa tanlanadi/Inspector ochiladi).
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
  - 2026-09-24: +206 `julich-areas.json` (talamusning 29 yadrosi — VIM/STN
    DBS koordinatalari bilan, amigdala, gippokamp CA1–3/DG, bazal old miya,
    po'stloqning barcha Julich maydonlari, GapMap'lar); `uz` nomlar
    gross-vessels/julich-groups/brodmann'da ham. Jami 487 yozuv; o'z yozuvi
    bor leaf qism: 795/1571.
  - `sidedName()` (`data/index.ts`): Julich guruhlari ham Chap/O'ng oladi
    (ular yon tomonli); atlas kodlari (`Fo1`, `PGa`, `Te 1.0`, `GapMap`),
    rim raqamli nomlar (`Crus I`) va `EPONYM` ro'yxatidagi xos otlar
    (Brodmann, Geshl, Meynert, Kalleja…) kichik harfga tushirilmaydi.
  - QOLGAN: Glasser 179, Destrieux 74, Desikan 35, JHU 27.
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
12. `shot.mjs --setup`da `selectParts(ids, null)` Inspector'ni OCHMAYDI —
    `focus` shart: `{kind:'part', id}` yoki `{kind:'concept', id}`; qatlam
    yuklanishini kutish uchun `setTimeout(..., 9000)` + `--wait 16000`.
13. Tomonga xos konsept (`white-matter-of-left-temporal-lobe`) `uz` nomiga
    "Chap" yozilmaydi — `sidedName()` o'zi qo'shadi ("Chap chap …" xatosi).
14. `src/data/levels.ts` `index.ts`dan import qiladi; `index.ts` uni QAYTA
    EKSPORT qilsa aylanma import hosil bo'ladi va brauzerda "Cannot access
    'LEAF_PARTS' before initialization" beradi (tsc buni USHLAMAYDI — faqat
    runtime'da chiqadi). Sabab: ESM import hoisting — bir modulning barcha
    `import`/`export...from` satrlari, hatto fayl OXIRIDA yozilgan bo'lsa
    ham, o'sha modul tanasidagi HECH BIR kod bajarilishidan OLDIN
    bajariladi. Qoida: bitta yo'nalishli bog'liqlik saqlang (levels.ts →
    index.ts, hech qachon aksincha); UI komponentlari kerak bo'lsa
    levels.ts'dan to'g'ridan-to'g'ri import qilsin.
