# Neuro Atlas — loyiha holati (Claude uchun qo'llanma)

> Yangi chatda ishni davom ettirish uchun shu faylni va `PLAN.md`ni o'qing.
> Foydalanuvchi (MuhammadYusuf) o'zbek tilida yozadi, javoblar o'zbek tilida.
> Kod izohlari ingliz tilida.
>
> Oxirgi yangilanish: 2026-10-09 (Darslar: 3D qadamma-qadam darslar — qorinchalar, qadoqsimon tana, gippokamp/fornix/Papez; BG-1 undan oldin).

## 0. YANGI SESSIYADA BIRINCHI QADAMLAR (shu tartibda)

1. Shu faylni to'liq o'qing; `PLAN.md` 3-bo'lim (bosqichlar jadvali) va
   4-bo'lim (xavflar) — qisqa.
2. Holatni tekshiring: `git status` toza, `git log --oneline | head -3`
   oxirgi commit — "Darslar: …" (2026-10-09) yoki
   undan keyingisi; `git rev-parse HEAD origin/master` bir
   xil bo'lishi kerak.
3. Meshlar diskda bor — gitignore'da, QAYTA HOSIL QILISH SHART EMAS:
   `public/meshes/` 196 MB (9 papka: gross 42, glasser 34, julich 29,
   destrieux/brodmann/desikan/jhu, bstem 4.7, suit 4.4 MB),
   `data/raw/` 154 MB (bp3d, julich, neuroparc, brainstem, suit).
   Yangi kompyuterda: `pipeline/README.md` — to'liq retsept, barcha
   yuklab olish URL'lari 2026-09-22 da sinovdan o'tkazilgan (neuroparc
   fayllari baytma-bayt mos chiqdi).
4. Dev server: `npm run dev` → http://localhost:3019 (**3019**, Falcon 3017
   band). Tekshirish: `curl -s -o /dev/null -w "%{http_code}" localhost:3019`
   — `000` bo'lsa server to'xtagan (foydalanuvchi yopgan bo'lishi mumkin):
   Bash `run_in_background` bilan `npm run dev` ni qayta ishga tushiring
   (`timeout: 7200000` — fon vazifasi maksimal 2 soat yashaydi, keyin
   avtomatik o'chadi; kerak bo'lsa yana ishga tushiring). `preview_start` vositasi ishlamasa (Falcon konfiguratsiyasini
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
   Kesim atlasi smoke-testi (Kesimlar rejimi + bitta sxema; `openSection`
   id'lari `src/data/sections/*.ts` dagi `id:`):
   ```bash
   node scripts/shot.mjs /tmp/sec.png --lang uz --w 1400 --h 860 --setup "const a=__atlas.getState(); a.setMode('sections'); a.openSection('midbrain-superior-colliculus')" --wait 1500
   ```
   Sxema ichidagi tugmalarni bosish (React delegatsiyasi ishlaydi):
   `document.querySelector('.sv-item[data-id="ml"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`
   (`.sv-views button` [0]=Sxema [1]=Mielin [2]=Nissl [3]=Atlas (MNI);
   `.sv-tools button` [0]=Raqamlar [1]=Nomlar [2]=Viktorina — Atlas
   ko'rinishida faqat [0]=Nomlar; `.sv-tabs button` [1]=Daraja haqida).
   BARCHA 17 kesimni bitta brauzer sessiyasida suratga olish (~1 daqiqa;
   `--full` butun oyna, `--setup` har kesimdan keyin bajariladi; atlas uchun
   `--wait 7000`):
   ```bash
   node scripts/shot-sections.mjs /tmp/sec --only medulla-olive,pons-trigeminal --setup "[...document.querySelectorAll('.sv-views button')][3].click()" --wait 7000
   ```
   Darslar (Darslar tabi): barcha qadamlarni bitta sessiyada suratga olish
   (21 qadam ≈ 3.5 daqiqa; headless'da fade sekin — `--wait 8000`):
   ```bash
   node scripts/shot-lessons.mjs /tmp/les --only ventricles:0,limbic:3 --wait 8000
   ```
   Store'dan: `a.setMode('lessons'); a.setLesson('limbic'); __atlas.getState().setLessonStep(3)`;
   viktorina javobi: `__atlas.getState().setLessonPick('g-third-ventricle')`.
   Sxemalarda ustma-ust tushgan juftlar (kichigining necha foizi yopilgan):
   `node scripts/audit-sections.mjs --min 0.15`. 2026-10-03 da qolganlari
   ATAYLAB: konteyner (cg/pag ichidagi yadrolar), tutam ichidagi yadro
   (fg×ng, fc×nc), icp×vn 18%, crus×snr 13%.
   Kesim ma'lumotlari butunligi (har item / ground lug'atda bor, `part` haqiqiy konsept):
   ```bash
   python3 - <<'EOF'
   import re, json
   src=''.join(open(f'src/data/sections/structures-{n}.ts').read() for n in ['brainstem','forebrain','basal','ground'])
   keys=set(re.findall(r"^\s+'?([\w-]+)'?: S\(", src, re.M)); used=set()
   for f in ['medulla','pons','midbrain','diencephalon','basal','cerebellum']:
       t=open(f'src/data/sections/{f}.ts').read()
       ids=re.findall(r"\{ id: '([\w-]+)'", t)+re.findall(r"ground: '([\w-]+)'", t)+[x for g in re.findall(r"ground: \[([^\]]*)\]", t) for x in re.findall(r"'([\w-]+)'", g)]
       used|=set(ids)
       print(f, 'missing', [i for i in ids if i not in keys])
   print('unused', sorted(keys-used))
   c={p['concept'] for p in json.load(open('src/data/parts.json'))['parts']}
   print('bad part links', [x for x in re.findall(r",\s*'([a-z0-9-]+)'\)\s*,\s*\n", src) if x not in c])
   EOF
   ```
   Kontent ma'lumotlari butunligi (unmatched bo'sh, har yozuvda sources va uz matn):
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
   `Co-Authored-By:` qatori bilan (tizim eslatmasidagi joriy model nomi;
   2026-10-02 da `Claude Opus 5.5 <noreply@anthropic.com>`). Push
   `origin master`. Uzun xabarni `-F fayl` bilan bering (ichida `"`
   bo'lsa `-m` buziladi — bir marta shunday xato bo'lgan).
7. Har bosqich oxirida shu faylning 3-bo'limi va `PLAN.md` jadvalini
   yangilang.

**Darslar (2026-10-09, foydalanuvchi talabi):** "qorinchalar, qadoqsimon tana,
gippokamp, fornix — o'zim ham o'qib tushunmadim; talabalar uchun esdan
chiqmaydigan qilib ko'rsatib, tushuntiradigan qism". ✅ 3 dars tayyor
(3-bo'lim). Yangi dars qo'shish: `src/data/lessons/<id>.ts` (`Lesson` tipi)
→ `index.ts` `LESSONS`. Har qadam: `show` (konsept + `side` + o'quv rangi),
`context` (`@tizim` yoki konsept — xira fon), `labels` (MNI nuqta —
meshdan o'lchang, scratchpad'dagi `landmarks.py` uslubi: trimesh ekstremal
nuqtalar/y-bo'laklar markazi), `view` (MNI yo'nalish, kameradan nishonga
emas — nishondan kameraga), `flow` (MNI yo'l yoki `via` konsept
markazlari), `memo` (o'xshatish/mnemonika), `deep` (klinika/PhD), oxirida
`quiz`. Taklif etilgan keyingi darslar: bazal yadrolar halqasi (BG-2 bilan
birlashtirish mumkin), talamus yadrolari, Willis halqasi, bosh nervlari
chiqish joylari, miyacha oyoqchalari, ko'rish yo'li.

**Joriy vazifa (2026-10-09 dan): BAZAL YADROLAR MODULI, 4 bosqich.**
Foydalanuvchi talabi: bazal yadrolar "bakalavrdan PhD gacha oltin standart"
bo'lsin (Ninja Nerd 40 daqiqada tushuntirgan mavzu — undan chuqurroq).
Bosqichlar (har biri alohida commit, brauzerda tekshirib):
- ✅ **BG-1** kesimlar — `basal-ganglia` tizimi + B1–B5 (3-bo'limga qarang).
- ⬜ **BG-2** yo'llar sxemasi — direct / indirect / hyperdirect /
  nigrostriatal; har bog'lanish: mediator (GABA/Glu/DA), qo'zg'atuvchi/
  tormozlovchi, D1/D2, ko-transmitterlar (P modda/dinorfin vs enkefalin);
  signal oqimi animatsiyasi. Yangi ko'rinish (Kesimlar rejimiga 'map'
  turidagi sxema yoki alohida panel) — tugunlar 3D konseptlarga bog'lansin.
- ⬜ **BG-3** kasallik simulyatori — Parkinson / Huntington / gemiballizm /
  distoniya (+ DBS yoqish): har yadro faollik ustuni (Gs), Albin–DeLong
  1989 tezlik modeli; PhD: beta tebranish, modelning cheklovlari (Cui
  2013 ko-aktivatsiya, Mallet arkipallidal).
- ⬜ **BG-4** Alexander 1986 5 halqa (motor, okulomotor, DLPFC, OFC,
  limbik) + DBS nishonlari (STN/GPi/Vim, AC–PC va MNI) + 3D'da zanjirni
  yoritish (tugun bosilsa 3D'da yadro va sheriklari).
Undan keyin A / C / D (quyida).
**Doimiy talab (2026-10-03):** har yangi funksiya bilan birga PhD /
neyroxirurg darajasidagi imkoniyat ham qo'shilsin (foydalanuvchi talaba,
ularni o'zi bilmaydi — taklif qilib, nima uchunligini qisqa tushuntiring).
Misollar: MNI koordinata, mm shkala, kesim yuzasi mm², manba atlas,
bo'yoq turlari, tekislik tenglamasi.

**D) Kesim atlasini kengaytirish (4b davomi, ixtiyoriy).** Qanday qo'shiladi:
yangi obyekt `src/data/sections/<soha>.ts` massiviga (`Section` tipi,
`types.ts`); tuzilma yo'q bo'lsa avval `structures-*.ts` ga `S(...)` yozuv
(kategoriya, en/uz/lotin nom, info en/uz, zararlanish en/uz, 3D konsept);
`plane` — miya ustuni uchun `brainstemPlane(z)`, diensefalon uchun koronal;
`contour` — gross mesh id regex (3D chiziq); `pin` — belgi joyi
(`side/off/dy`); `loc` — lokator chizig'i. Har yangi kesimni headless
screenshot bilan ko'ring, ustma-ust raqamlarni `at` bilan tuzating.
Taklif etilgan yangi darajalar: obex/area postrema, pontomezensefal
chegara, bazal yadrolar koronal (oldingi komissura, kaudat boshi, GPi),
gippokamp/amigdala koronal, ichki kapsula aksial; sxemani 3D kesim yuzasi
bilan "yonma-yon" ko'rsatish rejimi. Yangi kesimda `ground` (fon to'qima
id, `structures-ground.ts`) va `regions[].id` bering — sxemada nomsiz joy
qolmasin; `scripts/audit-sections.mjs` bilan ustma-ust tushishni tekshiring.

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

**B) ✅ 4-bosqich — kesim (3 tekislik) TUGADI (2026-09-25); 4b — ko'ndalang
kesim atlasi (17 sxema) TUGADI (2026-10-02).** Mumkin bo'lgan davomi:
ko'prik/uzunchoq miya uchun qo'shimcha darajalar (obex, pontomezensefal),
bazal yadrolar koronal kesimlari (oldingi komissura, kaudat boshi),
gippokamp/amigdala kesimlari; har sxemaga 3D kesim yuzasi bilan
"yonma-yon" taqqoslash.

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
- ✅ 4b-bosqich: ko'ndalang kesim atlasi (2026-10-02) — foydalanuvchi
  talabi (doskadagi sxemalar rasmi bilan): miya ustuni, o'rta miya,
  talamus, gipotalamus, miyachada darslikdagi kabi ko'ndalang kesim yuzalari;
  modelda kesim chizig'i, bosilsa yuza ochiladi; bakalavr va PhD darajasi.
  - Pastki dock'da 3-tab **Kesimlar** (`mode: 'sections'`): tizimlar
    brainstem/diencephalon/cerebellum'ga o'tadi (oldingisi
    `sectionsPrevVisible`da saqlanib, chiqishda tiklanadi), yon ko'rinish,
    kamera ko'rinadigan qismga moslanadi; pastda daraja kodlari qatori.
  - `src/data/sections/` — 17 kesim: U1–U4 (uzunchoq miya: piramida
    kesishmasi, sezgi kesishmasi, o'rta zaytun, rostral/VIII), K1–K3
    (ko'prik: yuz do'ngligi, trigeminal, isthmus/LC), O1–O3 (o'rta miya: IC,
    SC/RN, pretektum/orqa komissura), T1 (talamus koronal), T2 (talamus
    yadrolari "tuxum" xaritasi), G1–G3 (gipotalamus koronal: xiazmatik,
    tuberal, mamillyar), G4 (gipotalamus zonalari sagittal xaritasi), Mc
    (miyacha chuqur yadrolari). Har kesimda: sxema (SVG, `shapes.ts`:
    Catmull-Rom blob/ellips/chiziq, `mirror` juft tuzilmalar uchun),
    `landmarks`, `blood`, `syndromes`, `sources`.
  - Tuzilmalar lug'ati `structures-brainstem.ts` + `structures-forebrain.ts`
    (~150 ta, `S(cat, en, uz, la, info, infoUz, lesion, lesionUz, part)`):
    bitta yozuv barcha kesimlarda qayta ishlatiladi; `part` — 3D konsept
    ("3D da ko'rsatish" tugmasi). Kategoriya ranglari `ui/sectionStyle.ts`
    (harakat qizil, sezgi ko'k, BN harakat to'q sariq…); tolalar shtrixli.
  - Brainstem kesimlari MNI aksial emas — **neyraksisga perpendikulyar**:
    atlas geometriyasidan o'q (medulla y−38,z−55 → midbrain y−24,z−12),
    normal (0, 0.31, 0.95), `plane.ts` `brainstemPlane(z)`. Diensefalon —
    koronal (normal +y), miyacha — tishsimon yadro markazi orqali.
  - Ko'ruvchi `ui/SectionViewer.tsx`: raqamlar, "Nomlar" (atlas uslubida
    ikki ustun + yetakchi chiziqlar, `labelLayout`), viktorina (nomlar
    yashirin, tasodifiy, ball), kategoriya filtri, lokator (o'rta sagittal
    mini-sxema, daraja chiziqlari bosiladi), ← → klavishlar, "Daraja haqida"
    tabi. Yo'nalish: rostraldan qaralgan, dorsal yuqorida → bemorning chap
    tomoni ekranning o'ngida (3D kesim kamerasi bilan bir xil).
  - 3D: `BrainScene` 4-kesim tekisligi (`clipPlanes[3]`, qiyshiq);
    `buildMarkers()` — har kesim tekisligining gross meshlar bilan haqiqiy
    kesishuv konturi (`contour()`, LineSegments2 qalin chiziq, depthTest
    o'chiq) + DOM nishon (`.section-marker`, `pin.side/off/dy` bilan
    siljitiladi). "3D da kesish" → `cutSection(id, layers)`: rostral/oldingi
    yarim olib tashlanadi, kamera kesim yuzasiga qaraydi; kesim yuzalari
    endi har tuzilma rangida (`MeshBasicMaterial` BackSide cap) — bstem/suit
    /julich qatlamlari bilan rangli atlas kesimi bo'ladi.
- ✅ 4c-bosqich: kesim ko'rinishlari va sifat (2026-10-03) — foydalanuvchi
  talabi (rasmlar bilan): 3D chiziqlar "gologramma" kabi (orqa tomondagi
  chiziqlar ham ko'rinardi, chap/o'ng yarim meshlar va ichki yadrolar
  halqalari chalkashardi), sxemalarda chegaralar aralashgan, hech qaysi
  guruhga kirmagan joylar bor; real kesim ko'rinishi va PhD funksiyalari.
  - `src/scene/slice.ts` — umumiy geometriya: `sliceSegments` (tekislik ∩
    uchburchaklar), `chainLoops` (segment → yopiq halqa), `unionOutline`
    (rasterlash 0.25 mm + morfologik yopish + marching squares → faqat TASHQI
    kontur), `smoothLoop` (Chaikin), `offsetLoop`, `decimate`, `planeBasis`.
  - 3D markerlar (`BrainScene.outline/buildMarkers/updateMarkers`): har
    daraja = bitta tashqi kontur, 0.6 mm tashqariga surilgan, `depthTest:
    true` — model orqasidagi qismi yashirinadi. Yorliqlar: yon ko'rinishda
    har halqaning old (anterior) chetidan 26px narida, to'qnashsa pastga
    suriladi (zinapoya); old/yuqori ko'rinishda bitta ustun; SVG yetakchi
    chiziq (`.section-leaders`), insets (`markerInsets` kesh) ichida.
  - Sxema renderi (`SectionViewer` `Figure` + `ui/sectionLayout.ts`):
    rassom tartibi — fon to'qima (`ground`) → hududlar → tola chiziqlari →
    to'ldirilgan tuzilmalar KATTADAN KICHIKKA; ranglar shaffof emas (`mix`
    karta foniga); tola chiziqlari ingichka (`strokeW`); raqamlar
    to'qnashsa avtomatik itariladi (`badgePositions`, siljigan raqamda
    nuqta+chiziq). `Section.ground` (string | outline shakli bo'yicha
    massiv) va `regions[].id` — ular ham raqamlangan, bosiladigan tuzilma
    (ro'yxat oxirida). 8 yangi tuzilma `structures-ground.ts`: tegm-med/
    pons/mid, basis-pontis, cb-wm, hemi-wm, thal, hypo-grey. Gipotalamus
    kesimi lateral chegarasi ichki kapsulagacha qisqartirildi. Audit bilan
    tuzatilgan ustma-ustlar: U3 ap/tst/mlf/ml, K2 ctt/tl, T1 ic3/gpe/gpi
    (lateral→medial: putamen, GPe, GPi, kapsula), Mc fastigial.
  - Ko'rinishlar (`.sv-views`): **Sxema · Mielin · Nissl · Atlas (MNI)**.
    Mielin (Weigert/LFB) — tolalar to'q ko'k-qora, kulrang modda och;
    Nissl (krezil-binafsha) — yadrolar to'q binafsha nuqtali, harakat
    yadrolari eng to'q, tolalar och. `sectionStyle.tissueOf()` (fibre/grey/
    mixed/csf) + `STAIN`, naqshlar `StainDefs` (deterministik nuqtalar).
  - Atlas (MNI): `scene/atlasSlice.ts` — kesim qatlamlari (`CUT_LAYERS`)
    meshlarini aynan shu tekislikda kesadi (bbox bilan tanlab, faqat
    keraklilarini yuklab, keshlab), mm koordinatada, sxema yo'nalishida
    (rostral/old tomondan, dorsal yuqorida, bemorning chapi o'ngda);
    oyna = daraja konturi meshlari + 5 mm. Har soha 0.5 mm morfologik
    yopiladi (Allen yorliqlaridagi ingichka yoriqlar), yuza/markaz xom
    kesimdan. `ui/AtlasSliceView.tsx`: hover → nom, qatlam, tizim, mm²;
    kursor ostidagi MNI koordinata; 5/10 mm shkala; "Nomlar" — to'qnashmas
    yorliqlar (eng keng ichki nuqtada); yon ro'yxat: soha, mm², markaz
    MNI, manba atlas, "Sxemada ko'rsatish"/"3D da ko'rsatish"; ogohlantirish
    (BodyParts3D ≈5 mm). Sxema ↔ atlas tanlovi `part` konsept orqali
    bog'langan. Dev: `window.__atlasSlice(section, layers)`.
  - "Daraja haqida": `PlaneFacts` — tekislik nuqtasi, birlik normal,
    aksial/koronaldan og'ish (miya ustuni 18.0°), MRTda oblique reslice
    eslatmasi.
- 🟡 5-bosqich: kontent — boshlandi (2026-09-20), 487 yozuv (2026-10-02):
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
- ✅ BG-1: bazal yadrolar — tizim va kesim plastinkalari (2026-10-09):
  - Yangi tizim `basal-ganglia` ("Bazal yadrolar", rang `#c98fb4`):
    `build_catalogue.py` gross regex `caudate|putamen|globus pallidus|
    accumbens|lentiform|claustrum` + Julich `Ventral Striatum`/`Ventral
    Pallidum` guruhlari → 20 qism (oldin `telencephalon`da edi; parts.json
    boshqa farqsiz qayta hosil qilingan). STN/SN o'z tizimlarida qoladi
    (diensefalon/miya ustuni). Ulangan joylar: `SystemId`, `SYSTEMS`,
    `shellRank` (4), `materials.ts`, `SideRail` DEEP, `BRAIN_SYSTEMS`,
    `LEVEL_SYSTEMS`, `SECTION_SYSTEMS` (Kesimlar rejimida ko'rinadi).
  - `src/data/sections/basal.ts` — 5 plastinka, **MASSHTABDA**: nuqtalar
    MNI mm'da (`kit({k, top, y0})`: x = o'rta chiziqdan masofa, z/y), atlas
    meshlari shu tekislikda kesib o'lchangan (scratchpad `slices.py`,
    trimesh section → SVG). B1 y+14 (kaudat boshi, oldingi oyoq, ko'prikchalar,
    accumbens o'zak/qobiq), B2 y+1 (AC, GPe, VP, Meynert Ch4, BNST, preoptik),
    B3 y−6 (GPe/GPi, medial/lateral medullyar plastinkalar, ansa, H2,
    oldingi talamus), B4 y−13 (DBS darajasi: H1→ZI→H2→STN→SNc/SNr, H
    maydoni, VLa/VLp, mamillyar), B5 aksial z+4 (ichki kapsula '>' shakli,
    somatotopiya: CST qo'l→oyoq, talamokortikal, retrolentikulyar).
    `lateralWall()` — tashqi kapsula/klaustrum/eng tashqi kapsula/orolcha.
  - `structures-basal.ts` — 30 yangi tuzilma (en/uz/lotin, PhD tafsilot:
    MSN/striosoma-matriks, TAN, prototipik/arkipallidal GPe, GPi 60–100 Gs,
    STN uch qismli, DBS AC–PC koordinatalari, mikroelektrod belgilar);
    put/gpe/gpi/stn yozuvlari boyitildi. Mielin ko'rinishida GPe/GPi/VP
    `MIXED` (Weigert'da pallidum putamendan to'q — nomi "rangpar" bo'lsa ham).
  - Lokator: striatum silueti (`.loc-shape.bg`), B1–B4 vertikal, B5
    gorizontal chiziq. Pastki dock darajalar qatori desktopda ikki qatorga
    o'raladi (7 guruh sig'masdi), telefonda gorizontal scroll.
- ✅ Darslar — 3D qadamma-qadam darslar (2026-10-09):
  - 4-tab **Darslar** (`mode: 'lessons'`, `GraduationCap`): ro'yxat
    (`LessonStrip`, dock'da kartochkalar) → dars ochilganda o'ngda
    `LessonPanel` (`.lesson-panel`, telefonda pastki karta, yig'ish tugmasi):
    matn, **Eslab qoling** (o'xshatish/mnemonika, sariq quti), **Chuqurroq:
    klinika va tadqiqot** (ochiladigan), oxirgi qadamda manbalar; dock'da
    qadam nuqtalari (`LessonProgress`); ← → / Esc. Viktorina: savol →
    talaba 3D'da bosadi → `lessonPick` → konsept tekshiriladi, ball.
    Dars rejimida bosish Inspector'ni OCHMAYDI (`SceneView` onSelect).
  - Store: `lesson {id, step}`, `lessonPick {id, tick}`, `setLesson/
    setLessonStep/setLessonPick`; `setMode` ularni tozalaydi; `reset`
    dars rejimida qoladi.
  - Ma'lumot: `src/data/lessons/` — `ventricles.ts` (8 qadam: 4 qorincha,
    yon qorincha 5 qismi, devorlari, Monro/III, suv yo'li/IV + Magendie/
    Luschka, tomirli chigal, likvor oqimi animatsiyasi, viktorina),
    `callosum.ts` (7: ko'prik, rostrum-genu-tana-splenium, topografiya
    medial yuzada rangli giruslar bilan, septum, AC/gippokamp komissurasi,
    split-brain, viktorina), `limbic.ts` (6: gippokamp bosh/tana/dum,
    fornix fimbriya→oyoq→tana→ustun, "beshta C", Papez 7 bekat + aylanuvchi
    zarrachalar, Julich CA1/CA2/CA3/DG/subikulum/EC trisinaptik zanjiri,
    viktorina). `lessonStage()` konseptlarni mesh id'ga, `@tizim`ni gross
    qismlarga aylantiradi; viktorinada o'quv ranglari va yorliqlar o'chadi.
  - `BrainScene` dars rejimi (`stageLesson/endLesson/frameLesson/
    buildLessonLabels/updateLessonLabels/buildFlow`): fokus qismlar o'quv
    rangida asta paydo bo'ladi (`lessonAmount` damp), kontekst — xira
    `GHOST_COLOR` 0.07, faqat FrontSide (DoubleSide bo'lsa har giros 2
    qatlam beradi va sahna oq tumanga cho'kadi), qolgani yo'qoladi; cap
    (kesim yuzasi) shaffof qismda yashiriladi; xira qismlar bosilmaydi
    (`pick` faqat fokus). Yorliqlar — atlas uslubidagi ikki ustun, yetakchi
    chiziq + nuqta, ekran/panel ichida qisiladi. Oqim — CatmullRom yo'l,
    LineSegments2 + 22 mm/s zarrachalar, `depthTest: false`. Chiqishda
    ranglar `atlasBase`dan, opacity `peelAmount = -1` bilan tiklanadi.
  - Manbalar eutils/Crossref bilan tekshirilgan: StatPearls Ventricular
    System NBK532932, CSF NBK519007, Corpus Callosum NBK448209, Hippocampus
    NBK482171; Papez 1937, Scoville & Milner 1957, Hofer & Frahm 2006.
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
15. Python `open(p,'w').write(open(p).read())` — 'w' faylni OLDIN bo'shatadi,
    keyin bo'sh o'qiladi → fayl yo'qoladi (BrainScene.ts shunday o'chdi, git
    bilan tiklandi). Patchlarni `/tmp/p.py` faylga yozing, matnli o'zgartirishda
    uch qo'shtirnoq (`"""`) ishlating — ichida `'` va `"` aralash bo'ladi.
16. NCBI Bookshelf (StatPearls) curl/WebFetch'ga reCAPTCHA qaytaradi — HTTP 200
    havola to'g'riligini isbotlamaydi. NBK raqamini WebSearch bilan sarlavhaga
    solishtiring. 2026-10-02 da topildi: Medulla = NBK551589, Midbrain =
    NBK551509, Pons = NBK560589, Brainstem = NBK544297 (oldingi
    `brainstem.json`dagi 551684/551599/535392 NOTO'G'RI edi — tuzatildi).
    DOI'larni Crossref sarlavhasi bilan tekshiring (HTTP 200 emas).
    ENG ISHONCHLI YO'L (2026-10-09): NCBI eutils captchasiz ishlaydi —
    `esearch.fcgi?db=books&retmode=json&term="<sarlavha>"[Title]` →
    `esummary.fcgi?db=books&id=…` → `accessionid` (NBK…). Shunday topildi:
    Purves "Modulation of Movement by the Basal Ganglia" = NBK10868 (taxmin
    qilingan 10865 noto'g'ri edi), StatPearls Basal Ganglia = NBK537141,
    Internal Capsule = NBK542181.
17. Sxema raqamlari ustma-ust tushsa (yadro tutam ichida) — `at: [x, y]`
    bilan siljiting (2026-10-03 dan `badgePositions` qolganini o'zi
    itaradi). Chizish tartibi endi `items` tartibi EMAS: to'ldirilgan
    shakllar maydoni bo'yicha kattadan kichikka (`itemArea`), chiziqlar
    ulardan oldin.
18. `npx prettier --write` loyihada konfiguratsiyasiz ishlasa standart
    uslub (nuqtali vergul, 80 ustun) butun faylni qayta formatlaydi. Loyiha
    uslubi: `npx prettier --no-semi --single-quote --print-width 180`.
19. Atlas kesimi (`atlasSlice`) qiyshiq tekislik bo'lgani uchun o'rta miya
    darajasida pulvinar va gipotalamus ham kesimga tushadi — bu xato emas
    (haqiqiy oblique kesim), oyna faqat daraja konturi meshlari + 5 mm.
20. Bash'da `cat > fayl` (heredoc'siz) stdin kutib osilib qoladi — 2 daqiqa
    timeout. Patch skriptlarini Write vositasi bilan yozing.
21. Yangi sxema chizishdan OLDIN atlas meshlarini shu tekislikda kesib
    o'lchang (trimesh `mesh.section`, `pipeline/.venv`), keyin mm'da
    chizing — ko'z bilan chizilgan proporsiyalar Atlas (MNI) ko'rinishi
    bilan mos kelmaydi.
22. three.js: `material.side` shader dasturi kalitining qismi — uni
    o'zgartirgach `material.needsUpdate = true` SHART, aks holda eski dastur
    ishlatiladi (darslarda xira qismlar butunlay noshaffof chiqdi).
