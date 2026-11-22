# Neuro Atlas — to'liq tarix arxivi (2026-11-14 gacha CLAUDE.md)

> Bu fayl avtomatik yuklanmaydi. Qisqa qo'llanma — ildizdagi `CLAUDE.md`.
> Bu yerdagi "keyingi vazifa" bandlari eskirgan bo'lishi mumkin — CLAUDE.md ustun.

> Yangi chatda ishni davom ettirish uchun shu faylni va `PLAN.md`ni o'qing.
> Foydalanuvchi (MuhammadYusuf) o'zbek tilida yozadi, javoblar o'zbek tilida.
> Kod izohlari ingliz tilida.
>
> Oxirgi yangilanish: 2026-10-23 (yangi chatga topshirish; oxirgi ish 2026-10-09:
> kesimda pick tuzatishi, O'rganish tabi, Darslar, BG-1).

## 0. YANGI SESSIYADA BIRINCHI QADAMLAR (shu tartibda)

1. Shu faylni to'liq o'qing; `PLAN.md` 3-bo'lim (bosqichlar jadvali) va
   4-bo'lim (xavflar) — qisqa.
2. Holatni tekshiring: `git status` toza, `git log --oneline | head -3`
   oxirgi commit — "Hujjatlar: keyingi sessiyaga topshirish …" (2026-11-16) yoki
   undan keyingisi; **vazifa CLAUDE.md boshidagi "KEYINGI SESSIYA" bo'limida**; `git rev-parse HEAD origin/master` bir
   xil bo'lishi kerak.
3. Meshlar diskda bor — gitignore'da, QAYTA HOSIL QILISH SHART EMAS:
   `public/meshes/` 196 MB (9 papka: gross 42, glasser 34, julich 29,
   destrieux/brodmann/desikan/jhu, bstem 4.7, suit 4.4 MB),
   `data/raw/` 154 MB (bp3d, julich, neuroparc, brainstem, suit) + `data/raw/bigbrain/` 9.2 GB
   (Real kesimlar uchun; kesimlar allaqachon `public/sections/real/`da, hajm faqat qayta kesishga kerak).
   `pipeline/.venv` 2026-11-16 da qayta yaratilgan (numpy, nibabel, scipy, pillow).
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
   Kesim atlasi smoke-testi (O'rganish rejimi + bitta sxema; `openSection`
   id'lari `src/data/sections/*.ts` dagi `id:`):
   ```bash
   node scripts/shot.mjs /tmp/sec.png --lang uz --w 1400 --h 860 --setup "const a=__atlas.getState(); a.setMode('learn'); a.openSection('midbrain-superior-colliculus')" --wait 1500
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
   Darslar (O'rganish tabida): barcha qadamlarni bitta sessiyada suratga olish
   (21 qadam ≈ 3.5 daqiqa; headless'da fade sekin — `--wait 8000`):
   ```bash
   node scripts/shot-lessons.mjs /tmp/les --only ventricles:0,limbic:3 --wait 8000
   ```
   Store'dan: `a.setTopic('limbic'); __atlas.getState().setLesson('limbic'); __atlas.getState().setLessonStep(3)`
   (`setTopic`/`setLesson` o'zi `learn` rejimiga o'tkazadi);
   viktorina javobi: `__atlas.getState().setLessonPick('g-third-ventricle')`.
   Kesim (clip) yoqilganda hover/bosish to'g'ri tuzilmani nomlashi
   (`diff: 0` bo'lishi kerak): `node scripts/audit-pick.mjs`.
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

**KEYINGI VAZIFA — FOYDALANUVCHI HALI TANLAMAGAN (2026-10-09 oxirgi savol).**
Avval so'rang, ikki variant taklif qilingan edi:
1. **Mavzu viktorinasi** — kesim viktorinasi (sxemada nomsiz tuzilmani
   bosish, `SectionViewer` quiz) va dars viktorinasi (3D'da bosish,
   `LessonPanel`) hozir ALOHIDA; ularni mavzu bo'yicha bitta aralash
   viktorinaga birlashtirish (O'rganish tabini taklif qilganda va'da
   qilingan, lekin hali qilinmagan — foydalanuvchiga ochiq aytilgan).
2. **BG-2** — bazal yadrolar yo'llari sxemasi (quyida), `basal-ganglia`
   mavzusining 3D darsi/paneli sifatida.
Foydalanuvchi o'zi boshqa narsa yozsa — o'shani boshlang.

**Yordamchi vositalar (repoda, 2026-10-23):** `pipeline/tools/slice_svg.py`
(meshlarni koronal/aksial tekislikda kesib mm to'rli SVG — yangi masshtabli
kesim sxemasi chizishdan oldin), `pipeline/tools/landmarks.py` (mesh
ekstremal nuqtalari va y-bo'laklar markazi — dars yorliqlari/oqim yo'li
uchun MNI nuqtalar). Ikkalasi `pipeline/.venv/bin/python` bilan, repo
ildizidan. Ilgari scratchpad'da edi va o'chib ketgan — endi repoda.

**O'rganish tabi (2026-10-09, foydalanuvchi bilan kelishilgan):** Kesimlar va
Darslar alohida tab EDI — bitta mavzu ikki joyga bo'linib ketardi. Endi
bitta `mode: 'learn'`, mazmun `src/data/topics.ts` MAVZULAR bo'yicha
(har mavzu = `lessons[]` + `sections[]`; bitta plastinka bir nechta
mavzuda bo'lishi mumkin). YANGI DARS YOKI KESIM QO'SHGANDA uni tegishli
mavzu(lar)ga ham yozing, aks holda O'rganish tabida ko'rinmaydi (kesim
oynasining "barcha kesimlar" qatorida baribir chiqadi). BG-2/BG-3 kabi
yangi funksiyalar YANGI TAB OCHMAYDI — o'z mavzusiga (masalan
`basal-ganglia`) kiradi.

**Darslar (2026-10-09, foydalanuvchi talabi):** "qorinchalar, qadoqsimon tana,
gippokamp, fornix — o'zim ham o'qib tushunmadim; talabalar uchun esdan
chiqmaydigan qilib ko'rsatib, tushuntiradigan qism". ✅ 3 dars tayyor
(3-bo'lim). Yangi dars qo'shish: `src/data/lessons/<id>.ts` (`Lesson` tipi)
→ `index.ts` `LESSONS`. Har qadam: `show` (konsept + `side` + o'quv rangi),
`context` (`@tizim` yoki konsept — xira fon), `labels` (MNI nuqta —
meshdan o'lchang: `pipeline/tools/landmarks.py <part-id> --slabs` — ekstremal
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
  signal oqimi animatsiyasi. Yangi ko'rinish — `basal-ganglia` mavzusi ichida (alohida tab EMAS;
  'map' turidagi sxema yoki panel) — tugunlar 3D konseptlarga bog'lansin.
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
  - (2026-10-09 dan O'rganish tabining bir qismi.) Pastki dock'da 3-tab **Kesimlar** (`mode: 'sections'`, endi `'learn'`): tizimlar
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
    meshlari shu tekislikda kesib o'lchangan (`pipeline/tools/slice_svg.py`,
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
  - (2026-10-09 dan O'rganish tabining bir qismi, `mode: 'learn'`.) 4-tab **Darslar** (`mode: 'lessons'`, `GraduationCap`): ro'yxat
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
- ✅ O'rganish tabi — Kesimlar + Darslar birlashtirildi (2026-10-09):
  - Sabab (foydalanuvchi savoli): ikkalasi o'xshash vazifali, alohida tab
    mavzuni ikki joyga bo'lardi, bir-biriga bog'lanmagan edi, telefonda 4
    tab tor. Mazmun turi saqlandi (kesim = ma'lumotnoma, dars = qo'llanma),
    navigatsiya mavzu bo'yicha birlashtirildi.
  - `Mode = 'explode' | 'peel' | 'learn'`; store `topic` + `setTopic`;
    `enterLearn()` istalgan rejimdan kirishda tizimlarni saqlaydi/yoqadi;
    `setLesson` mavzusiz chaqirilsa darsning mavzusini o'zi tanlaydi;
    `cutSection` darsni yopadi.
  - Dock (`LearnDock`, BottomBar): mavzu kartochkalari (7: qorinchalar,
    qadoqsimon tana, limbik, bazal yadrolar, talamus/gipotalamus, miya
    ustuni, miyacha; "3D dars" va "N ta kesim" belgilari) → mavzu: "3D
    dars" tugmasi + kesim kodlari → dars: qadam nuqtalari; kesim bo'yicha
    kesilganda eski kesim paneli.
  - 3D: mavzu ochiq bo'lsa faqat shu mavzuning daraja markerlari
    (`SceneSnapshot.topicSections`); dars ochiq bo'lsa markerlar yo'q.
  - O'zaro havolalar: `LessonStep.section` → kartada "Kesimda ko'rish"
    (9 qadamda: masalan "beshta C" → B3, fornix → G3); oxirgi qadamda
    mavzuning barcha plastinkalari; kesim oynasida "3D darsda o'rganish"
    (yoki dars ochiq bo'lsa "Darsga qaytish"); mavzu ichida kesim oynasi
    ← → va kodlar qatori faqat mavzu plastinkalari bo'yicha.
  - Skriptlar (`shot-sections`, `audit-sections`, `shot-lessons`) `learn`
    rejimiga o'tkazildi.
- ✅ Kesimda pick tuzatishi + kartochkalar (2026-10-09): clip faol bo'lsa
  `raycaster.firstHitOnly = false` (medial yuzada 33 % noto'g'ri nom edi →
  0 %, `scripts/audit-pick.mjs`); mavzu kartochkalari: "3D" qisqa belgi,
  wrap, aniq kenglikdagi auto-fill to'r (4-bo'lim 23–24).
- ⬜ 6–7.

### R1 — Realizm: yorug'lik va material (2026-11-14)

Muammo: sahna oqarib ketgan va yassi edi (ACES + hemi 0.8 + key 2.0 + rim 1.4 + muhit 0.7
och ranglar ustida) — po'stloq pushti-oq "plastik", suyak butunlay kuygan.

- `src/scene/materials.ts`: `ColorMode = 'real' | 'atlas'`. Har material ikkala ko'rinishni
  `userData.looks`da saqlaydi; `applyColorMode(m, mode)` roughness/sheen/envMapIntensity ni
  qo'yadi va rejim rangini QAYTARADI (`userData.base`ni chaqiruvchi yozadi, chunki dars uni
  o'quv rangiga bo'yagan bo'lishi mumkin — unda rang `atlasBase`ga yoziladi).
- `REAL` presetlari: po'stloq `#ad8a80`, chuqur yadrolar jigarrang-kulrang, miya ustuni/oq modda
  krem, arteriya `#a8231d`, vena `#43437c`, nerv sadafrang, dura, suyak fil suyagi.
  `REAL_BY_ID`: qora modda (neyromelanin), qizil yadro, globus pallidus, xoroid chigal, gipofiz,
  epifiz, kulrang tizimga yozilgan tolalar (fornix, crus cerebri, ...), dural sinuslar.
- Nam yaltirash clearcoat'siz (kesimni buzadi): roughness 0.3–0.46 + muhit aksi + yengil `sheen`
  (yumshoq to'qima cheti; sheen yoqilishi/o'chishi shader kalitida → `needsUpdate`).
- `BrainScene.RIGS`: atlas = eski qiymatlar (o'zgarmagan); real = `NeutralToneMapping`,
  exposure 0.8, hemi 0.1, key 2.1, rim 0.85, fill 0.1. Rang bloki kadr siklida dars blokidan OLDIN.
- Saboq: muhit xaritasi (`envMapIntensity`) diffuz yoritishni ham oshiradi — uni ko'tarish
  "nam" emas, "yassi" qiladi; shakl uchun yo'nalgan chiroq ko'tariladi, muhit pasaytiriladi.
  Pushti sheen + to'yingan asos = "saqich" ko'rinishi; asos kulrangroq olinadi.
- Sozlash (2026-11-15): yaqindan po'stloq loydek xira edi → roughness 0.38 → 0.27 (nam yaltirash
  faqat ~0.3 dan pastda ko'rinadi); oq modda/miya ustuni/suyak sarg'ish va kuygan edi → asos
  rang neytralroq va to'qroq (`#a9a195`), key 2.3 → 2.1. Saboq: och to'qimalarda albedo ~0.4
  dan oshsa Neutral tone mapping ham shaklni yuvib yuboradi; yaqin plan (`camera.fov = 15`)
  bilan ham suratga oling — uzoqdan yaltirash ko'rinmaydi.
- Parcellation qatlamlari (Julich, Glasser, ...) ikkala rejimda xarita rangida qoladi.
- Tekshiruv: `audit-pick.mjs` diff 0; screenshotlar ¾, lateral (ichki tizimlar), kesim, telefon
  390 px, atlas↔real ish vaqtida almashtirish, darsga kirib-chiqish.
- Yangi mashinada `node_modules` to'liq bo'lmasa (`vite: command not found`) — `npm install`.

### LG-1 — Liquid Glass: boshqaruv elementlari (2026-11-15)

Namuna: foydalanuvchining ekran yozuvi (iOS 26 tab bar). Kadrlardan uchta belgi ajratildi: (1) shisha chetida
orqa fon egiladi; (2) tanlov — bitta kapsula, tablar orasida sirg'aladi, bosilganda bardan chiqib ketadigan
shaffof linzaga aylanadi va ostidagi belgini kattalashtirib ko'k rangga bo'yaydi; (3) qo'yib yuborilganda
prujinadek joyiga qaytadi.

- `src/ui/liquidGlass.ts` — `installLiquidGlass()` (`main.tsx`dan chaqiriladi). Har `.lens` element uchun
  kanvasda displacement xaritasi (yumaloq to'rtburchak SDF, chetdan 5–15 px "bezel", ichkariga yo'nalgan siljish),
  uch kanal uchun 1 / 0.9 / 0.8 kuch (xromatik hoshiya), `<filter id="lg-WxHrR">`. ResizeObserver + MutationObserver,
  ishlatilmagan filtrlar o'chiriladi. Faqat Blink (`Chrome/` UA); boshqalarda `lg-on` sinfi qo'yilmaydi.
- `.lens` olganlar: yuqori panel, belgi tugmasi, yon rels, rejim tablari, gauge, slayder kartasi, kesim tasmasi,
  dars progressi. Katta panellar hozircha oddiy `.glass` (unumdorlik va o'qilish uchun) — LG-2.
- `src/ui/useLens.ts` — holat React'da emas, to'g'ridan-to'g'ri style'da (`--bx/--by/--bw/--bh`). Pointer capture
  ISHLATILMAYDI (aks holda tugmaning o'z `click`i yo'qoladi); boshqa tab ustida qo'yib yuborilsa `target.click()`.
- Xato va saboq: bosilgan linzaga ham kattalashtiruvchi filtr qo'yilgan edi — ichma-ich `backdrop-filter`da bola
  faqat ota elementning (deyarli shaffof) tarkibini ko'radi va egilgan nusxani asl ustiga chizadi → yozuv ikkilandi.
  Yechim: linza ostidagi element `scale: 1.16` (`.lens-over`), filtr faqat yuqori darajadagi shishada.
- Tekshirildi: DPR 1 va 2 da sinish bir xil (`--stripes` bilan), 900×560 va 390×700, `audit-pick` diff 0,
  tsc + build. Tekshirilmadi: haqiqiy telefonda FPS, Safari'da ko'rinish (faqat kod bo'yicha zaxira).

### UI-1 — iPad uslubidagi tuzilish (2026-11-15)

Sabab: foydalanuvchi LG-1 dan qoniqmadi va interfeysni "chiroyli, foydali" qilib qayta qurishni so'radi. Savol-javob
bilan kelishildi: tuzilish — iPad uslubi; fon — yorug' rejim ham qo'shiladi; birinchi ekranda Atlas va O'rganish
teng. Kesimlar alohida tab emas, O'rganish mavzulari ichida qoladi.

- Tepa panelda 13 ta tugma tiqilib turgan edi → `TabBar` (4 element) + `ViewGroup` (3 tugma, ikki menyu).
- `Sidebar` bitta komponent: Atlas'da `AtlasList` (tez tanlov segmenti linza bilan, qatlam chiplari, tizimlar),
  O'rganish'da `TopicList` (akkordeon). Avval mavzu kartalari pastki dockda edi — matn sig'mas edi.
- Store: `sidebar` alohida maydon (`panel` endi faqat `'search' | null`), `reset`da saqlanadi, telefonda qism
  tanlansa / dars yoki kesim ochilsa o'zi yopiladi (`isPhone()`), standart ≥1100px da ochiq.
- Kamera: `BrainScene.insets()` selektorlari yangilandi (`.tab-bar` — tepada yoki telefonda pastda, `.view-group`,
  `.sidebar.open`). Yon panel almashtirilganda kamera QAYTA moslanmaydi (foydalanuvchi burgan ko'rinish saqlansin),
  keyingi `fit`da hisobga olinadi.
- CSS: eski xrom qoidalari (`.top-actions`, `.side-rail`, `.mode-tab*`, `.gauge*`, `.sheet`, `.topic-card*` ...)
  skript bilan o'chirildi, yangisi fayl oxirida "Layout II". O'lchamlar Figma kitidan: bar 44, tab 36, 15px/500.
- Tekshirildi: 1280×760 (Atlas, O'rganish), 1100×680 (dars, menyu), 390×760 (telefon, varaq), linza bosilgan/
  sudralgan, `audit-pick` diff 0, tsc + build. Tekshirilmadi: kesim tasmasi (`sectionCut`) va qidiruv paneli
  yangi joyda suratga olinmadi; haqiqiy telefonda sinalmadi.

### UI-2 — yorug' rejim va shisha sozlash (2026-11-15)

- Falcon'dan meros `:root { --background: qora }` shadcn'ning yorug' tokenlarini bosib turardi; endi qora qiymatlar
  `.dark` ichida, yorug'i `:root`da. `--fa-*` tokenlar bloki `:root, .dark` selektoriga ko'chdi — aks holda `.dark`
  orol ichida `var(--ink)` qayta hisoblanmaydi (custom property e'lon qilingan elementda yechiladi).
- 21 ta `color-mix(#fff N%)` → `var(--ink)`. Oqligicha qolganlar: shisha `--lg-rim`/`--lg-dome` (yorug'lik chiziqlari),
  tugma matni, slayder tutqichi.
- Sahna: fon `#e9edf3`, zamin `#f6f8fb`, hemi oq/kulrang, ambient ×1.12. To'qima ranglari o'zgarmadi.
- Shisha: qorada `--lg-through: brightness(0.74)` — miya panel ostiga kelganda yozuv o'qilmay qolayotgan edi.
- Yon panel + Inspector birga ochiq va oyna <1340px bo'lsa pastki tasma yozuvlarini tashlaydi (yon panelga kirib ketardi).
- Tekshirildi: yorug'da 1280×760 (Atlas), 1100×680 (Inspector+menyu, dars), 900×440 DPR2 yaqin surat ikkala rejimda,
  tsc + build, `audit-pick`. Tekshirilmadi: yorug'da telefon ko'rinishi, kesim paneli (PlanesPanel), qidiruv, About.

### 5.2 — Real kesim ko'rinishi (2026-11-16)

- Litsenziya: BigBrain — `ftp.bigbrainproject.org/bigbrain-ftp/License.txt`: CC BY-NC-SA 4.0 (moslashtirilgan
  material ruxsat, o'sha litsenziyada ulashiladi). Sayt rasmlaridagi "CC BY-SA" yozuvi ma'lumotga TEGISHLI EMAS.
  MNI ICBM152 2009b — erkin ruxsatnoma (hozircha ishlatilmadi).
- Ro'yxatga olish muammosi yo'q: tasvir ilovaning o'z kesim ramkasida (origin, u, v, oyna) namunalanadi, shuning
  uchun atlas konturlari bilan bir koordinatada. Farq faqat biologik: populyatsiya atlasi ↔ bitta miya (1–2 mm).
- Hajm 1970×2330×1890 @ 0.1 mm, uint16; `.nii.gz` bir marta ochiladi (8.7 GB) va memmap bilan faqat kerakli blok o'qiladi.
- Kontrast: butun oyna bo'yicha cho'zilganda miya ustuni oqarib ketdi (atrofdagi miyacha po'stlog'i qora) →
  foizlar oynaning markazidagi to'qimadan olinadi, gamma 1.25.
- Yuklash saboqi: bitta ulanish ~430 KB/s; `curl -r` bilan 8 parallel bo'lak ~6 MB/s. Sessiya uzilganda eski curl
  jarayoni tirik qolib, yangi jarayon bilan BIR faylga yozdi → bo'lak buzildi. Qayta boshlashdan oldin `pkill`,
  oxirida hajm + `gzip -t` tekshiruvi.
- Tekshirildi: B3, K2, T1 suratda (tasvir va kontur mos), tsc + build. Tekshirilmadi: qolgan 14 daraja suratda
  ko'rilmadi; chap/o'ng yo'nalishi simmetrik hajmda ko'z bilan tasdiqlanmaydi (ramka kodi bo'yicha to'g'ri);
  yorug' rejim va telefon.

### 5.1 — T2 tutash bo'linma (2026-11-16)

- `tiling()`: tugunlar (3+ chegara uchrashadigan nuqtalar), qirralar (tugun, erkin nuqtalar, tugun — ochiq
  Catmull-Rom, har oraliq 8 namunа), sohalar (qirralar tartibi, `-nom` teskari). Qirra bir marta namunalanadi,
  ikki soha AYNAN shu nuqtalarni ishlatadi → tirqish ham, ustma-ustlik ham geometrik jihatdan mumkin emas.
  Chiqish — zich ko'pburchakli xom yo'l (`t: 'p'`), Bezier emas: `shapePolygon` yo'ldagi sonlarni o'qiydi,
  boshqaruv nuqtalari maydon/markaz hisobini buzardi.
- T2 anatomiyasi: Y-plastinka o'z maydoniga ega tasma (ayrida oldingi yadro, ustida MD, ostida lateral guruh);
  CM — tasmaning orqa kengaygan uchi (intralaminar yadrolar plastinka ichida yotadi); dorsal qavat LD→LP,
  ventral qavat VA→VL→VPL→VPM, orqada pulvinar. `ground: 'thal'` olib tashlandi — nomsiz to'qima qolmadi
  (aks holda "16-raqamli" bo'sh element kontur ustida paydo bo'ldi).
- `th-mid` (o'rta chiziq yadrolari) endi dorsal chet tashqarisida chiziladi — avval MD ustida ko'rinmay qolgan edi;
  `th-ret` yorlig'i plastinka limbi ustidan o'z shtrix chizig'i yoniga ko'chdi.
- Tekshirildi: coverage auditi, `--min 0.15` (T2 "ok"), Sxema (raqam va nomlar) hamda Nissl suratda, tsc + build.
  Tekshirilmadi: Mielin ko'rinishi va viktorina rejimi suratda ko'rilmadi (shakl turi o'zgarmagan, kod o'sha).

### 5.2b — Real kesimda sxema raqamlari (2026-11-16)

- `SectionViewer` `marks`: sxema tuzilmasi (`StructureInfo.part`) → `conceptLeafIds` → atlas qismi id → `SliceMark
  { ns, items, color }`. `AtlasSliceView` `placeMarks()`: nishon sohaning ichki nuqtasida (mm birligida), joy band
  bo'lsa qisqa chiziq bilan chetga suriladi; masshtab chizig'i burchagi bo'sh qoldiriladi; <0.5 mm² parchalar o'tkaziladi.
- Atlas sxemadan qo'polroq bo'lsa (bitta rangpar shar meshi = GPe + GPi + plastinkalar) nishon barcha raqamlarni
  ko'rsatadi ("4·22"; uchtadan ko'p bo'lsa "12·13 +4"), yon panel hammasini sanaydi. Yagona mos kelganda yon panelda
  sxema matni (vazifa + shikastlanish) chiqadi.
- "Raqamlar" tugmasi Real ko'rinishda ham bor; "Konturlar"dan mustaqil (konturlarsiz raqam = gistologiyada o'z-o'zini sinash).
- O'lchov (nishonlar / sxema yozuvlari): B3 29 nishon (25 bog'langan yozuvdan 17 tasi kesilgan), B4 30, B5 25, B2 24,
  T1 21, G2 11, G1 10, B1 11; miya ustuni U2 4, U3–K2 7, O1 9, O2 4, O3 2.
- TOPILMA 1: miya ustunida kam nishon — bog'lanish xatosi emas, `bstem` qatlamida atigi 24 konsept bor (traktlar va
  bosh nerv yadrolari yo'q). Bog'lanmagan mos konseptlar: `rf` ↔ PnO / mRt (bitta `part` yetmaydi), LDTg (sxemada yo'q).
- TOPILMA 2: O2 va O3 tekisligi sxemaga mos emas — O2 da `sc`, `rn`, `mgb` umuman kesilmaydi, O3 da 14 bog'langan
  yozuvdan 1 tasi kesiladi (kesim gipotalamus/talamus orqali o'tadi). Tekislikni tekshirish kerak (K3/Mc oynasi bilan birga).
- TOPILMA 3: `snc`/`snr` Julich'ga (`j-snc`, `j-snr`) bog'langan, lekin `CUT_LAYERS.midbrain` da Julich yo'q → qora modda raqamsiz.
- `scripts/shot-sections.mjs` ro'yxatiga `basal` qo'shildi (B1–B5 avval o'tkazib yuborilardi).
- Tekshirildi: 15 ta real kesimda nishonlar soni (DOM), T1 / B3 / O2 suratda, B3 to'liq ko'ruvchi (tanlov + yon panel),
  tsc + build. Tekshirilmadi: yorug' rejim, telefon kengligi, "Nomlar" yoqilganda nishonning ko'tarilishi suratda ko'rilmadi.

### 5.2c — O'rta miya tekisliklari tuzatildi (2026-11-16)

- Sabab: `brainstemPlane(z)` uchun z darslikdan olingan edi, bu atlas (BodyParts3D) geometriyasida esa tektum pastroq:
  yuqori do'nglik markazi z −11, qizil yadro −16. O2 (z −9) ularning ustidan o'tib, gipotalamus/talamusni kesardi.
- O'lchov (z bo'yicha sinov, bog'langan tuzilmalar kesim yuzasi mm²): O1 −17 → `ic` 3; −19 → `ic` 40 (tegmentum 71).
  O2 −9 → `sc`/`rn`/`mgb` 0; −13 → `sc` 37, `rn` 29, `mgb` 31, `snc` 65. O3 −2 → faqat `pretect` 2; −8 → `pc` 59, `pin` 41, `hab` 1.
- Tuzatish: O1 −19, O2 −13, O3 −8; lokator chiziqlari (`loc`) 2 birlik/mm bo'yicha surildi; `CUT_LAYERS.midbrain` ga
  `julich` qo'shildi (SNc/SNr endi kesiladi va raqam oladi). Uch real kesim qayta kesildi.
- Natija (nishonlar): O1 9 → 11, O2 4 → 15, O3 2 → 12.
- Tekshirildi: O2 va O3 Real ko'rinishda suratda, O2 3D kesimi Julich bilan/siz taqqoslandi (farq — qo'shimcha konturlar),
  tsc + build. Tekshirilmadi: O1 surati ko'rilmadi (faqat son), Atlas (MNI) ko'rinishi va 3D marker o'rni suratda ko'rilmadi.
- O3 da sxemadagi qizil yadro kesilmaydi (bu geometriyada u z −11 dan pastda tugaydi) — sxema va atlas shu yerda farq qiladi.

### 5.3 (1+2) — Uzun yo'llar va shikastlanish simulyatori (2026-11-16/17)

- `src/data/pathways.ts`: CST, DCML, ALS — tartibli bekatlar (neyron 1/2/3, `level`, `zones`, `also`, `side`, `cross`,
  `midline`, sxema `items`, `plate`, 3D `show`, `label`, `at`). Hammasi O'NG tana / CHAP yarim shar uchun chizilgan.
- `src/data/lessons/pathways.ts`: shu ma'lumotdan 3 ta 3D dars (umumiy → bekatlar → kesishma + viktorina);
  mavzu `pathways` ("Uzun yo'llar va shikastlanish").
- Kesim ko'ruvchisi: "Yo'l" tasmasi (`store.pathway`, dars boshlansa avtomatik), plastinka ustida parda + yo'l
  rangidagi bekat (`src/ui/pathTrace.ts`: tomon x bo'yicha; chiziq qayerdan BOSHLANSA o'sha tomonniki), ←/→ yo'lning
  o'z plastinkalari bo'ylab. `LessonPanel` plastinka ochiq bo'lsa strelkalarni olmaydi.
- `src/data/lesions.ts` + `src/ui/LesionPanel.tsx` ("Shikastlanish" tabi): daraja × tomon × hudud → har yo'l uchun
  qaysi tana tomoni (o'sha / qarama-qarshi), hudud sindromi (StatPearls, eutils bilan tekshirilgan). Teskari rejim:
  belgilar → barcha mos o'choqlar (`localise`). Tekshirilgan: o'ng yarim kesilish = Brown-Séquard; chap paramedian
  uzunchoq = Dejerine; chap lateral = Wallenberg; faqat CST o'ngda → po'stloq / kapsula / Weber / ko'prik asosi.
- 3D nuqtalar meshlardan o'lchandi (JHU CST/ML/CP/PLIC, bstem piramida, Julich VPL/4p/3b — plastinka tekisligidagi
  kesim markazi). Sxema → MNI chiziqli o'tkazish rad etildi (K3 oynasi xatosi tufayli 20+ mm).
- ✅ o'choqni plastinkada chizish va 3D da o'choq — "5.3-3a" bo'limiga qarang. QOLDI: kalla nervlari yadrolarini simulyatorga qo'shish
  (hozir `extra` matnida); yuz (trigeminal) yo'li; kortikobulbar.

### 5.5 — Zoom, real kesim qamrovi, tomirlar simmetriyasi (2026-11-17)

- **C (`9345a50`)** `src/ui/ZoomPane.tsx`: barcha 5 ko'rinishda g'ildirak/pinch zoom (1–8x), sudrab surish, ikki marta
  bosish, tugmalar (o'ng pastda); F — to'liq ekran, Esc avval undan chiqadi. CSS transform (SVG o'tkir qoladi);
  nishonlar faqat √zoom bilan o'sadi (`--zs`). 4 px dan ortiq siljish — surish, click tuzilmani tanlamaydi.
- **B (`a650ccc`)** 22 dan 21 tasida real tasvir. K3: tekislik ko'prik meshi tepasidan (z −22.7) o'tardi → oyna barcha
  sohalarga qaytib 145 mm bo'lardi; contour = pons + cerebral-crus + inferior-colliculus (45×40). Mc: `MAX_SPAN_MM` 130
  (butun miyacha, 124 mm haqiqiy). T2 → B5, G4 → G2 (`REAL_STAND_IN`, sariq yozuv bilan). U1 — manba yo'q, halol qoldi.
- **A** `pipeline/mirror_vessels.py`: 68 ta juftsiz tomirga ko'zgu juft (mirror + o'ng→chap affin, 97 juft markaz bo'yicha,
  RMS 2.82 → 1.36 mm; botish tekshiruvi: hech biri yomonlashmadi). Toq: Galen venasi, qo'shilish, ensa sinusi, dorsal
  medullyar vena — ko'zgulanmaydi. `build_catalogue.py` → `mirrorOf` + `meshSource` ("mirrored"). Arteriyalar 83 chap /
  81 o'ng (avval 46/76), venalar 27/31 (avval 1/31). `content/index.ts`: konsept nomidagi left↔right almashtirilgan
  yozuvga qaytadi (twin'lar kontent va "Chap ..." uz nomini oladi). audit-pick diff 0.
- QOLDI: U1 real tasviri (boshqa ochiq histologik manba); Villiz doirasi variantlari (PhD); BigBrain 20 mkm plitkalar.

### 5.3-3a — O'choq plastinkada va 3D da (2026-11-17)

- `src/ui/lesionTerritory.ts`: o'choq hududi. Miya ustuni/orqa miya — yarim kesimning o'z koordinatasidagi ko'pburchak
  (u: o'rta chiziq 0 → lateral chet 1; v: dorsal 0 → ventral 1, kontur bbox'idan), shuning uchun bitta qon tomir havzasi
  o'sha darajaning barcha plastinkalariga mos keladi. Kontur bilan qirqiladi (`clipPath`). Oldingi miya — tuzilmaning
  o'zi (kapsula: `ic-pl`/`cst-ic`, talamus: `th-vpl`/`th-vpm`). Havzalar Tatu 1996 (Neurology, doi:10.1212/WNL.47.5.1125)
  bo'yicha: paramedian / qisqa / uzun aylanma. Tuzilma hududga tushadi = o'choq tomonidagi namuna nuqtalarining ≥34%
  ichida (ikkinchi nusxa hisobga olinmaydi — aks holda ulush ikki baravar kamayadi); likvor bo'shliqlari chiqarilgan.
  Sagittal plastinkalarda chizilmaydi. `plateShows()`: `plateLevel(plate) === level` yoki darajaning o'z plastinkasi.
- Natija: U3 lateral = vestibulyar yadrolar, ICP, spinal V trakt+yadro, ikki ma'noli yadro, X ildizi, ALS (Wallenberg
  to'liq); U3 medial = XII yadrosi+ildizi, MLF, ML, piramida (Dejerine); K1 lateral = VII yadrosi va ildizi, spinal V,
  vestibulyar, MCP, ALS (AICA); K1 medial = VI, VII tizzasi, PPRF, ML, CST (Foville/Millard-Gubler); O2 ventral = oyoqcha
  + III ildizi (Weber); O2 dorsal = qizil yadro, ML, ALS, III yadrosi (Claude/Benedikt).
- `scripts/audit-lesions.mjs` (dev server kerak): 86 hudud × yo'l bekatlari — simulyator "kesiladi" degan bekatning
  kamida bitta itemi ichida, "saqlanadi" deganlari tashqarida. `--hits` hamma ro'yxatni chiqaradi. Hozir 0 nomuvofiqlik.
  Hudud o'zgarsa — shu audit. `also` o'tishlari faqat plastinkasi yo'q bekat uchun tekshiriladi (`als-vpl` kapsulada
  `th-vpl` itemi bilan chizilmaydi).
- Kesim ko'ruvchisi: o'choq holati `SectionViewer`ga ko'chirildi (`LesionPanel` props: `lesion`, `setLesion`,
  `territory`, `onPick`); "Shikastlanish" tabi ochiq bo'lsa `Figure` qizil shtrixli hududni chizadi (`.sv-lesion-zone`).
  Panelda "O'choqqa tushgan tuzilmalar" (bosilsa tuzilma tanlanadi) va "3D da ko'rish".
- 3D: `src/data/lessons/lesion.ts` — o'choqdan dars yasaladi (id `lesion:<level>:<side>:<zone>`, `LESSON_BY_ID`
  `LessonRegistry` uni birinchi so'ralganda quradi). Qadamlar: umumiy → har kesilgan yo'l (ipsi/kontra sababi bilan) →
  hudud sindromi. `lesionSphere()`: kesilgan bekatlar `at` nuqtalarining o'rtasi (o'choq tomoniga ko'zgulangan), radius
  = tarqoqlik + 2.5 (4.5–10 mm); faqat `also` o'tish bo'lsa — o'sha darajadagi bekatlar balandligi. Chap tana nusxasi =
  yo'l `path`ining ko'zgusi. `LessonStep.flows[]` (bir nechta oqim, `cut`) va `lesion` (shar); `LessonStage.flow` →
  `flows[]`. `BrainScene.buildFlow`: oqim o'choqqa eng yaqin nuqtada to'xtaydi (30 mm dan uzoq bo'lsa kesilmaydi),
  undan keyingi qism kulrang shtrix (Waller degeneratsiyasi); shar + pulsatsiyalanuvchi halo, `depthTest: false`.
  Kontekst — o'choq tomonidagi yarim shar. PhD: Waller degeneratsiyasining DTI dagi ko'rinishi (Thomalla 2004, Puig 2010).
- QOLDI: plastinkani bosib o'choq qo'yish; trigeminal yo'l; po'stloq o'chog'i plastinkasiz (faqat 3D).

### 5.3-3b — Kalla nervlari simulyatorda (2026-11-17)

- `src/data/lesions.ts` `CRANIAL_SIGNS` (14 belgi): III, INO (MLF, faqat ko'prik/o'rta miya), gorizontal qarash (VI
  yadrosi/PPRF — yadro o'chog'i qarash falajini beradi), VI fastikula, VII periferik, yuzning markaziy falaji
  (kortikobulbar, qarama-qarshi; po'stloq/kapsula/oyoqcha — hudud qoidasi), spinal V (faqat miya ustuni darajalari),
  V asosiy/harakat yadrosi, vestibulyar, eshitish (koxlear yadro/ildiz), ikki ma'noli yadro, XII, ataksiya (ICP/MCP/SCP
  o'sha tomonda, qizil yadro — qarama-qarshi), Horner (lateral miya ustuni + bo'yin yarim kesilishi — hudud qoidasi).
- `src/ui/lesionSigns.ts`: `cranialSigns(lesion)` — o'choq hududi DARAJANING O'Z plastinkasida (`LEVEL.plate`) yuritiladi,
  hududga tushgan itemlar → belgi (keshlanadi). Ma'lumot qatlami UI geometriyasiga bog'lanmasin deb UI'da.
  `localiseWithSigns()`: uzun yo'llar aniq mos, kiritilgan kalla belgilari majburiy, kiritilmaganlari hisobga olinmaydi.
- Panel: oldinga rejimda "Kalla nervlari va daraja belgilari" ro'yxati + "kesishgan belgilar" eslatmasi; teskari rejimda
  belgi × tomon tanlovi (faqat biror o'choq bera oladigan belgilar — eshitish hozircha yo'q, koxlear yadrolar U4 da) va
  har nomzodda "yana kutiladi" (ajratuvchi belgi). Misol: ALS o'ngda + yuz og'rig'i chapda → ko'prik lateral (VII,
  vestibulyar, ataksiya, Horner) yoki Wallenberg (vestibulyar, disfagiya, ataksiya, Horner).
- Tekshirilgan: Weber (CST o'ng + III chap → faqat O'rta miya chap ventral), Dejerine (XII chap + CST/DCML o'ng → faqat
  medial uzunchoq), Benedikt/Claude (qizil yadro → qarama-qarshi ataksiya), Raymond (ko'prik ventral: VI + CST).
- `medulla-caudal` dorsal hududi medialda sayozlashtirildi (v 0.32) — XII yadrosi orqa ustun o'chog'iga tushmasin.
- QOLDI: eshitish belgisi uchun U4 darajasi.

### 5.3-3c — Trigeminotalamik yo'l (2026-11-17)

- `src/data/pathways.ts` `V5` (`path-v`, rang `#2ecfb4`, `body: 'face'`): o'ng yuz → chap yarim shar. Bekatlar: `v-root`
  (tugun + ildiz, ko'prik lateral, `n5-root`, K2) → `v-tract` (spinal V trakt, PASTGA, rostral uzunchoq lateral +
  ko'prik lateral, `sp5t`, U3) → `v-caudalis` (2-neyron, kesishma, kaudal uzunchoq dorsal, `sp5t`/`sp5n`, U2) →
  `v-ascending` (ventral trigeminotalamik, ko'prik medial, `ml` itemi bilan; rostral uzunchoqda faqat `all` —
  Dejerine ham, Wallenberg ham qarama-qarshi yuzga tegmaydi; o'rta miya dorsal) → `v-vpm` (VPM → S1 yuz, `th-vpm`).
  Manba: StatPearls NBK482283 (eutils bilan tekshirilgan). 3D: uchlik nerv tanasi (gross), j-vpm, j-area-3b.
- Simulyatorda yuz og'rig'i endi UZUN YO'L (kesishma qoidasi bilan): `CRANIAL_SIGNS`dan `face-pain` olib tashlandi.
  `Pathway.body = 'face'` → panel va darsda "chap/o'ng yuz", teskari rejimda ham. Natija: Wallenberg/AICA — yuz o'sha
  tomonda, tana qarama-qarshi; o'rta miya dorsal, talamus, po'stloq — yuz ham, tana ham qarama-qarshi; ko'prik va
  rostral uzunchoq butun yarmi — yuz ikki tomonda (kesishmagan trakt + kesishgan trakt). Kesishgan sezgi + disfagiya
  → faqat Wallenberg.
- `topics.ts` pathways mavzusiga `path-v` darsi (7 qadam, viktorina — VPM). audit-lesions 0.

### 5.3-3d — Plastinkani bosib erkin o'choq (2026-11-19)

- Shikastlanish tabi → "O'choq → belgilar" ichida "Hudud | Nuqta" (faqat ko'ndalang/koronar/aksial plastinkada —
  `focalPlate()` = `plateLevel` + `plateShows`). Nuqta rejimida `Figure` `onPlace` oladi: SVG `getScreenCTM()` orqali
  plastinka birligi, `stopPropagation` (ZoomPane bo'sh joy → to'liq ekranga o'tmaydi), tuzilmalarni bosish tanlamaydi.
  Sudrash — surish, o'choq qo'ymaydi (ZoomPane `clickCapture`). Disk + oq nishon (`pin`), radius slayderi 0.5–12 mm.
- `src/ui/lesionFocal.ts` `focalOn(section, {plate,x,y,rMm})`:
  - masshtab: `pipeline/section_frames.json` oynasi (darajaning o'z meshlari + 5 mm chegara) − 10 mm, plastinka
    silueti kengligiga bo'linadi. U1 0.058 … B5 0.160 mm/birlik. Taxminiy, UI'da "≈".
  - tuzilma tushadi: har yarmida alohida, kontur namunalarining ≥20% diskda, yoki markaz shu tuzilmada (ENG ICHKI
    kontur yoki chiziqqa ≤ eni masofa — aks holda CST lakunasi `ic-pl`ni ham olib sezgi yo'lini kesardi), chiziq
    tuzilmalar uchun istalgan namuna.
  - yo'l kesiladi: shu darajadagi bekat itemi S tomonda tushsa → S === bekat tomoni ? o'ng tana : chap tana; o'rta chiziq
    bekati + disk o'rta chiziqni kesib o'tsa → ikki tomon. `also` orqali o'tuvchi bekatlarga `TRANSIT` itemlari qo'shiladi
    (kapsula: `ic-pl`, `tcr` — DCML/ALS/V talamokortikal tolalari).
  - klassik hududlar: diskdagi 9×9 to'r nuqtalarining hudud ko'pburchagiga tushgan ulushi (`zoneOn()` —
    `lesionTerritory.ts` dan eksport); uv `all` (butun yarim) tashlanadi, kapsula/talamus `all` (tuzilma) qoladi.
    Hududga bog'liq kalla belgilari (Horner, markaziy yuz falaji) — ustma-ustlik ≥50% bo'lsa.
- Natija (headless): U3 ALS r2 → ALS qarama-qarshi + disfagiya + Horner, PICA 100%; U3 piramida → CST + XII (Dejerine);
  U3 o'rta chiziq r3 → DCML ikki tomonda; K1 VI yadrosi → INO + qarash falaji + VI + VII (Foville), paramedian 99%;
  O2 qizil yadro → III + qarama-qarshi ataksiya (Claude); B5 `cst-ic` r1–2 → faqat CST (sof harakat lakunasi),
  `tcr` → DCML+ALS+V (sof sezgi), `ic-pl` r4 → sensomotor; U1 `lcst` → CST o'sha tomonda + Horner.
- Panel: daraja · tomon (o'rta chiziq → "ikki tomonda"), diametr <15 mm → lakuna eslatmasi, yo'llar va kalla belgilari
  jadvali (hudud rejimi bilan umumiy `tractTable`/`signTable`), "kesishgan belgilar", klassik hududlar %, tuzilmalar ulush
  % bilan, "Butun hudud bilan solishtirish" (eng ko'p ustma-ust hududga o'tadi) va "3D da ko'rish" (o'sha hudud darsi).
- audit-lesions 0 (hudud rejimi o'zgarmagan; `uvPolygon` faqat ajratib olindi).
- **Bir nechta o'choq (2026-11-19):** `foci: FocalLesion[]`, faol o'choq (radius slayderi unga), "Yana o'choq" (keyingi
  bosish qo'shadi), chiplar (raqam · plastinka · mm, × o'chirish, bosilsa o'sha plastinka ochiladi), "Hammasini
  tozalash". Faol o'choq boshqa plastinkada bo'lsa, bosish yangi o'choq qo'shadi — turli darajalardagi o'choqlar
  (SM: "makonda tarqalish"). `focalSet()`: har o'choq o'z plastinkasida (`SECTION_BY_ID`), yo'l va kalla belgilari
  tomonlari qo'shiladi (L+R = B); `focalTerritory()`: ochiq plastinkadagi disklar, nishonlar klip tashqarisida raqam
  bilan. Panel: "Barcha o'choqlar birgalikda" jadvali + eslatma (bir daraja: ikki tomonlama → o'rta chiziq jarayoni;
  turli daraja: SM, emboliya, metastaz, vaskulit), so'ng faol o'choq tafsiloti. Bir necha o'choq turli tomonda
  bo'lsa "o'sha tomonda/qarama-qarshi" yozilmaydi. Tekshiruv: ikki tomonlama PICA → ALS, disfagiya, Horner B;
  K1 MLF chap + O2 oyoqcha o'ng → 2 daraja, CST chap tana, INO chap; ikki tomonlama ko'prik asosi → CST B.
- QOLDI / PhD: vaqt o'qi (SM "vaqtda tarqalish"); real kesim / atlas ko'rinishida bosish
  (MNI nuqta → atlas sohalari); 3D darsda aynan shu disk (hozir eng yaqin hudud darsi); tomir havzasi chegara zonasi
  ehtimolligi (Tatu 1996 xaritalari ehtimollik emas).

### 5.3-3e — Vaqt o'qi va McDonald mezonlari (2026-11-21)

Foydalanuvchi: "nima ustida bo'lsak shuni oxirgi max darajaga olib chiq" → erkin o'choqning PhD davomi (SM: vaqtda tarqalish).
- `FocalLesion` ga `t` (birinchi o'choqdan oylar) va `gd` (Gd+). `focalSet(foci, now)` — `now` dan keyin paydo bo'lgan
  o'choqlar `each[i] = null` (plastinkada chizilmaydi, jadvallarga kirmaydi). `SectionViewer`: `now` holati (null = hammasi);
  yangi o'choq `now` (yoki eng oxirgi `t`) vaqtida qo'yiladi.
- `src/ui/mcdonald.ts`: `mcArea()` — miya ustuni darajasi → infratentorial; oldingi miya plastinkasida disk `lv` ga
  (≤ radius + 1 mm) tegsa → periventrikulyar, `ins` ga → po'stloq yoni, aks holda "chuqur" (soha emas). Diametr <3 mm
  hisoblanmaydi. Xuruj = belgili yangi o'choq paydo bo'lgan har bir vaqt (+ optik nevrit). DIT: bitta MRTda Gd+ va Gd−
  (eskiroq o'choq Gd− hisoblanadi), kuzatuvda yangi o'choq, likvor OCB, 2-xuruj. 2017 jadvali (xurujlar × belgili o'choqlar);
  2024 (soddalashtirilgan): 5 soha (+ ko'ruv nervi), ≥4 → TS; 2–3 → DIT / likvor / CVS·PRL; RIS ham bo'lishi mumkin.
  Ogohlantirishlar: >2 sm (tumefaktiv), bir vaqtda ≥8 mm va arterial hududni ≥80% to'ldirgan o'choqlar (insult).
  `msCase()` — o'quv keysi: K3 MLF Gd+ r 1.5 (sof chap INO, 0 oy; K1 da xuddi shu disk VI yadro va VII tizzasini ham
  oladi — "bir yarim" sindromi) + B2 yon qorincha (0 oy) + B3 orolcha (6 oy).
- Manbalar (Crossref bilan tekshirilgan): Thompson 2018 Lancet Neurol 17:162, doi:10.1016/S1474-4422(17)30470-2;
  Montalban 2025 Lancet Neurol 24:850, doi:10.1016/S1474-4422(25)00270-4.
- UI: `src/ui/McDonaldPanel.tsx` — faol o'choq uchun "Paydo bo'lgan vaqti" (0/1/3/6/12/24 oy) + Gd+; vaqt o'qi SVG
  (√t masshtab, soha rangi, belgili = to'liq, Gd+ = sariq shtrix halqa, tikni bosish = shu vaqt) + slayder (oxiri = hammasi);
  soha kartalari, plastinkadan tashqari topilmalar (orqa miya, po'stloq, ko'ruv nervi, optik nevrit xuruji, likvor, CVS/PRL),
  xurujlar/DIS/DIT qatorlari, 2017 va 2024 xulosasi ("hali emas: …" nima yetishmasligi bilan).
- Tekshiruv: 10 stsenariy headless (CIS → DIS+DIT kerak; Gd+ MLF + Gd− PV → TS; 3 oyda DIT yo'q, 6 oyda yangi o'choq → TS;
  OCB → TS; RIS; 2024 4 soha → TS; tumefaktiv bayroq), audit-lesions 0, tsc, build, 4 screenshot.
- QOLDI / PhD: 3D da aynan shu disklar (plastinka → MNI), real kesim/atlasda bosish → MNI nuqta; PPMS yo'li (1 yil
  progressiya); o'choq shakli (Douson barmoqlari — kallozal-septal oval), MRT T2/FLAIR ko'rinishi.

### 5.3-3f — Erkin o'choqlar 3D da (2026-11-21)

- Plastinka → MNI: `focalMni(f)` (`src/ui/lesionFocal.ts`). Asos — kesim ramkasi (`section_frames.json`: MNI = origin +
  a·u + b·v). Plastinka (x, y) → (a, b) uchun `pipeline/plate_affine.json` — `scripts/export-plate-affine.mjs` har
  plastinkada 3D jufti bor tuzilmalarni (`StructureInfo.part`) ilovaning o'z atlas kesimidagi shu tuzilma bilan
  (tomon bo'yicha, eng katta kesim) juftlaydi: kontur maydon markazi ↔ soha markazi; eng kichik kvadratlar affin,
  2.5×mediandan katta qoldiqlar tashlanib qayta moslanadi. Qoldiq median: O1 1.2, U4 2.0, T1 2.2, O2 2.5, B2 3.0,
  K1–K3 3.5–3.9, B1 3.9, B3/B4 4.4–4.5, B5 6.0 mm (cho'zinchoq tuzilmalar — dum, qorincha — markaz solishtirishning
  o'zi noaniq). U1–U3 (juft <4) — quti usuli (siluet qutisi → o'z meshlar qutisi, y teskari). B5 aksialda quti usuli
  teskari ag'darilgan edi (det > 0) — affin buni o'zi tuzatdi. Plastinka chizmasi yoki tekislik o'zgarsa:
  `export-section-frames.mjs` → `export-plate-affine.mjs`.
- Sahna: `LessonStep.lesions[]` (`color`, `dim`), `LessonStage.lesions` (eski `lesion` ham shu ro'yxatga qo'shiladi);
  `BrainScene.lesionMarks[]` — har biri o'z halosi bilan. `frameLesson` xira bo'lmagan o'choqlarni ≥7 mm atrofi bilan
  kadrga oladi (belgisiz o'choq ekranni to'ldirmaydi, boshqa darajadagi xira o'choqlar kamerani uzoqlashtirmaydi).
- `src/ui/focalLesson.ts` `focalLesson(foci, set)`: `focal:<vaqt>` darsi `LESSON_BY_ID`ga yoziladi (oldingisi
  o'chiriladi). Umumiy qadam (barcha sharlar raqam bilan, Gd+ sariq; kesilgan yo'l vaqt bo'yicha birinchi kesgan
  o'choqqacha oqadi) + har o'choq uchun qadam (vaqt tartibida; boshqalari xira; daraja, tomon, diametr, Gd, kesilgan
  yo'llar, daraja belgilari yorliq bilan; "Kesimda ko'rish" o'sha plastinka). Bitta o'choqda umumiy qadam yo'q.
  Kontekst: oldingi miya faqat o'rta chiziqdan >4 mm uzoq o'choqlar tomonida.
- Panel: "Barcha o'choqlar 3D da" (bir nechta), "Shu o'choq 3D da" (bitta); eski tugma "Eng yaqin hudud 3D da".
- Tekshiruv: B5 `cst-ic` lakunasi → CST po'stloqdan aynan sharga qadar oqadi, pastda qorong'i (screenshot); TS keysi
  3D (4 qadam); eski `lesion:pons:L:medial` darsi o'zgarishsiz; McDonald xulosasi; audit-lesions 0; tsc; build.

### AI-fix 2 — Band provayder: avtomatik qayta urinish, "Boshqa model" (2026-11-21)

- Foydalanuvchi: `gemini-3.8-flash` → 503 "This model is currently experiencing high demand" (Google tomonidagi vaqtinchalik
  yuklama). `useAI.send`: raundda hali matn kelmagan bo'lsa `server`/`rate` xatoda 2 marta qayta urinadi (2 s, 5 s; `wait`
  bekor qilinadi), xabarda "Provayder band — qayta urinilyapti (n/2)…" (`retrying`).
- `retry(model?)`: oxirgi savol-javob transkriptdan va `turns` dan olinadi (takrorlanmaydi), rasmlar biriktirmalarga
  qaytadi, ixtiyoriy boshqa model tanlanadi va savol qayta yuboriladi. `RetryBar` (faqat oxirgi xabarda; auth/credit/abort
  bundan mustasno): "Qayta urinish" va "Boshqa model: …" (`pickModel` joriy modelsiz).
- Mock: `busy` — birinchi chaqiruv 503, keyingisi javob. Tekshiruv: `busy` avtomatik tiklandi; `error:server` → tugmalar;
  `retry('mock-lite')` → bitta user + bitta assistant qoldi, `turns` 1, model almashdi. tsc, build.

### AI-fix — Gemini: chatga yaramaydigan modellar (2026-11-21)

- Foydalanuvchi xatosi: avtomatik tanlangan `gemini-3.8-flash-lite-tts` → "Developer instruction is not enabled for this
  model". Sabab: `generateContent` ni TTS/rasm/audio/embedding modellari ham e'lon qiladi; afzallik regexlari mos kelmasa
  ro'yxatning birinchisi olinardi.
- `gemini.ts`: `NOT_CHAT` (tts, image, imagen, veo, lyria, embedding, aqa, audio, live, native, transcri, computer-use,
  robotics, learnlm) ro'yxatdan chiqariladi; tizim ko'rsatmasi rad etilsa (400 "instruction/system") so'rov bir marta
  `systemInstruction`siz, ko'rsatma birinchi user qismiga qo'yilib qayta yuboriladi. OpenRouter ro'yxatidan ham tts/image/
  audio/embedding/realtime/live olib tashlandi. `pickModel` google: `-pro` → `-flash` (aniq, keyin `-latest`, keyin har qanday).
- Saqlangan eski model keyingi `loadModels`da ro'yxatda bo'lmagani uchun avtomatik almashadi (sahifani yangilash yetarli).
- Tekshiruv: soxta ro'yxat (11 model) → 4 chat modeli qoldi, `gemini-3.8-pro` tanlandi; 400 dan keyin ko'rsatmasiz qayta
  urinish matn qaytardi.

### AI-5 — PhD qatlami: rejimlar, yashirin simulyator, adabiyot, Anki (2026-11-21)

- Rejimlar (`useAI.mode`, `na:ai`da saqlanadi; panelda model ostida 4 tugma): **Repetitor** (tushuntirish + ko'rsatish),
  **Sokratik** (bittadan savol, 3 urinishdan keyin yoki so'ralganda javob), **Keys** (simulyatordan bemor keysi: belgilar
  FAQAT `simulate_*` natijasidan; talaba topadi; `localise` bilan baholanadi va differensial; `place_lesion`/
  `set_lesion_territory` bilan ochiladi; keyin Anki), **Tadqiqot** (PhD/neyroxirurg; avval `search_pubmed`/`verify_doi`,
  faqat shular qaytargan ishlarni PMID/DOI havolasi bilan keltiradi, dalil turi). Har rejimga o'z tez savollari.
- Yangi tool'lar (`src/ai/tools.ts`, jami 15; `runTool` endi async): `simulate_lesion`, `simulate_territory` (ekranni
  o'zgartirmaydi — keys uchun), `localise` (teskari rejim `localiseWithSigns`; parametrlar massiv — Gemini sxemasiga mos),
  `search_pubmed` (NCBI E-utilities esearch `sort=relevance` + esummary: PMID, sarlavha, mualliflar, jurnal, yil, nashr
  turlari, DOI; `tool=neuro-atlas`, email yuborilmaydi), `verify_doi` (Crossref), `make_flashcards` (≤ 60 karta).
  `resolveLesion`/`focalReadout` — place/simulate uchun umumiy. NCBI va Crossref brauzerdan CORS bilan ishlaydi (tekshirildi).
- Uydirma havolaga qarshi: `VERIFIED` (shu suhbatda tool'lar qaytargan PMID/DOI) + kontekst brief'idagi atlas manbalari;
  javob oxirida matndagi DOI va PMID'lar tekshiriladi → tekshirilmaganlari xabar ostida to'q sariq ogohlantirish.
- Anki: `make_flashcards` natijasi xabarda karta ko'rinishi (4 tasi) + "Anki uchun yuklab olish (.txt)" — `#separator:tab`,
  `#html:false`, `#deck:` sarlavhalari bilan tab bilan ajratilgan fayl (foydalanuvchi bosganda yuklanadi).
- Mock: keys rejimida `simulate_territory`, tadqiqotda `search_pubmed` (haqiqiy tarmoq), "anki/karta" → kartalar;
  "uydirma" so'zi bo'lsa javobga soxta DOI qo'shadi — ogohlantirishni sinash uchun.
- Tekshiruv: tadqiqot (haqiqiy PubMed → Montalban 2024, PMID tekshirilgan, 10.9999/fake… ogohlantirildi), keys + Anki
  screenshotlari; `runTool`: simulate (Wallenberg o'ng), localise (ALS chap + V o'ng + Horner o'ng → lateral ko'prik va
  Wallenberg — differensial), simulate_lesion K1 MLF, verify_doi haqiqiy ✓ / soxta 404; ekran o'zgarmadi. tsc, build,
  audit-lesions 0.
- QOLDI: `look_at_screen` tool; AI-6 (ChatGPT/Google hisob bilan kirish); suhbatni saqlash/eksport.

### AI-4 — Ko'rish: AI'ga sahna, plastinka yoki o'z rasmingizni yuborish (2026-11-21)

- 3D: `BrainScene.snapshot(maxSide)` — kadr shu vazifada render qilinib nusxalanadi (`preserveDrawingBuffer` kerak emas),
  JPEG ≤ 1280 px; `src/scene/capture.ts` (`registerSnapshot` — SceneView sahna tirikligida ro'yxatdan o'tkazadi,
  `sceneSnapshot()`). HTML ustqatlamlar (yorliqlar, markerlar) suratga kirmaydi.
- Plastinka: `src/ui/plateCapture.ts` `capturePlate()` — ko'rinib turgan `.sv-svg` (sxema, mielin/Nissl, atlas, real)
  klonlanadi, har elementga hisoblangan uslublar (fill/stroke/opacity/shrift…) yoziladi, `<image>` (BigBrain webp)
  data URL ga aylantiriladi, ko'ruvchi foni ustida JPEG. `captureFile()` — foydalanuvchi rasmi (MRT, darslik rasmi),
  ≤ 1568 px JPEG. Hajm ~85–90 KB.
- Turlar: `ImagePart` (`mediaType`, base64), user turn `images`. Provayderlar: Anthropic `image` bloki (base64) matndan
  oldin, OpenAI-mos `image_url` (data URL) matndan keyin, Gemini `inlineData` matndan oldin; mock — kelgan rasmlar soni
  va hajmini aytadi.
- `useAI`: `attachments` (≤ 4, `attach`/`detach`), yuborishda modelga "[Attached: …]" bilan nima ekanini aytadi; rasm
  faqat O'Z xabari bilan (va shu xabarning tool raundlarida) yuboriladi — keyin tarixda matn ("sent earlier") qoladi
  (narx). Bo'sh matn + rasm → standart savol ("Bu rasmda nima ko'rinyapti? …").
- UI: yozish maydonida rasm tugmasi → menyu (3D ko'rinish, ochiq kesim plastinkasi — faqat plastinka ochiq bo'lsa,
  fayldan); rasmni maydonga joylashtirish (paste); kichik rasmlar × bilan; yuborilgan xabar ustida rasmlar.
  QOIDA: forma ichidagi tugmalarga `type="button"` (aks holda bosish xabarni yuboradi — shu xato topilib tuzatildi).
- Tekshiruv: 3D, K3 sxema, K3 real kesim suratlari diskka saqlanib ko'rildi (to'liq, shtrix va raqamlar bilan); panel
  orqali 3D + plastinka biriktirildi va yuborildi (mock: 2 rasm, 88 + 86 KB); 3 provayder yuklamasi (image/image_url/
  inlineData) soxta fetch bilan; tsc, build, audit-lesions 0.
- QOLDI / PhD: `look_at_screen` tool (AI o'zi surat so'raydi — Anthropic tool_result rasm oladi, OpenAI uchun alohida
  user xabari kerak); 3D suratga yorliqlarni chizish; MRT ustida o'choqni aniqlab plastinkaga qo'yish (AI-5).

### AI-3 — AI ilovani boshqaradi (tools + amal chiplari) (2026-11-21)

- Turlar (`src/ai/types.ts`): `ToolSpec` (JSON Schema), `ToolCall`, `ToolResult`; `ChatTurn` = user | assistant (`calls`,
  `raw` — provayderning o'z kontenti) | tool (`results`); `StreamEvent` `turn` — model navbati oxirida chaqiruvlar + raw.
- Provayderlar: Anthropic — `tools` (`input_schema`, `eager_input_streaming: true`), `finalMessage()` dan `tool_use`
  (faqat `stop_reason === 'tool_use'`; `max_tokens`/refusal — hech nima bajarilmaydi), Claude'ning o'z navbatlari
  (thinking bloklari imzosi bilan) keyingi so'rovga O'ZGARISHSIZ qaytadi, boshqa provayderniki — text + tool_use;
  natija — `tool_result` (+ `is_error`). OpenAI-mos — `tools[].function`, oqimda `delta.tool_calls` indeks bo'yicha
  yig'iladi (id/nom, argument JSON bo'laklari), `finish_reason: length` → chaqiruv yo'q, yaroqsiz JSON → `__invalid_json`
  (tool xato qaytaradi), natija — `role: tool`. Gemini — `functionDeclarations` (`additionalProperties` olib tashlanadi),
  `functionCall` qismlari, model qismlari (`thoughtSignature` bilan) o'zgarishsiz qaytadi, natija — `functionResponse`
  (`id` faqat model bergan bo'lsa).
- `src/ai/tools.ts` — 9 tool: `find_structure` (umumiy `src/data/search.ts` — qidiruv paneldan ajratildi),
  `select_structure` (concept/part/nom → `selectParts`, ochiq plastinkani yopadi), `open_plate` (kod yoki id; javobda
  plastinkadagi tuzilmalar id: nom), `place_lesion` (plastinka + tuzilma + tomon, radius/vaqt/Gd/almashtirish; javobda
  `focalOn` natijasi), `set_lesion_territory` (daraja/tomon/hudud → sindrom, yo'llar, belgilar, 3D dars id),
  `clear_lesions`, `trace_pathway`, `open_lesson` (+ "placed-lesions" → `focalLesson`), `set_view` (ko'rinish, qatlamlar).
  Tavsiflarda plastinkalar, darslar, daraja/hududlar ro'yxati. Har kirish tekshiriladi (enum, son chegaralari, nom → id).
  `runTool()` → `{ result, note }`; noma'lum tool / xato → `isError`.
- Kesim ko'ruvchisi buyruqlari: `useScreen.command` (`focal` | `territory` | `clear` | `tab`, `plate: '*'` — ochiq
  plastinka); `SectionViewer` o'z plastinkasi ochilganda bajaradi va o'chiradi. `structureCentre(plate, id, side)` —
  `lesionFocal.ts` ga ko'chirildi (`msCase` ham shuni ishlatadi).
- `useAI`: `turns` (modellar ko'radigan to'liq tarix), agent sikli ≤ 6 raund (stream → chaqiruvlar → `runTool` →
  natijalar → yana), matnlar bitta javobga qo'shiladi, token yig'iladi; tool qo'llamaydigan model/server
  (400 "tool/function") — birinchi raundda tool'siz qayta urinadi; yakunda natijasiz chaqiruv tarixdan olib tashlanadi.
  `redo(call)` — chip bosilsa amal qayta bajariladi. Tizim promptida: kerak bo'lganda 1–2 amal, id'ni o'ylab topmaslik,
  amaldan keyin ekranda nima borligini tushuntirish.
- UI: javob ichida amal chiplari (✓ yashil / ⚠ to'q sariq, bosilsa qayta bajariladi); tez savol "Wallenberg o'chog'ini
  ko'rsat va belgilarini tushuntir". Markdown: `_kursiv_` faqat so'z chegarasida (snake_case buzilmaydi).
- Mock: "wallenberg" → `set_lesion_territory`, "MLF/INO" → `place_lesion` K3, "talamus … ko'rsat" → `select_structure`;
  tool natijasidan keyin xulosa.
- Tekshiruv: headless — Wallenberg (U3 ochildi, chap lateral hudud, kontekst "U3 · Lateral medullyar (Wallenberg)"),
  MLF (K3 da o'choq, "K3 · 1 o'choq"), talamus tanlandi; soxta fetch bilan 3 format to'liq aylanish (OpenAI bo'lakli
  argumentlar → 2-raundda `tool_calls` + `tool`; Gemini `thoughtSignature` saqlandi, sxemada `additionalProperties` yo'q;
  Anthropic thinking `THINKSIG` + text + tool_use → `tool_result`); `runTool` xato yo'li. tsc, build, audit-lesions 0.
- QOLDI: inspektor kartasi AI panel ostida qoladi (ikkalasi o'ngda) — joylashuvni keyin hal qilish; AI-4 vision.

### AI-2 — Kontekst: AI ekranda nima borligini biladi (2026-11-21)

- `src/ai/screen.ts` (`useScreen`): kesim ko'ruvchisi o'z ichki holatini ko'zgulaydi — plastinka, tab, ko'rinish, sxemada
  va atlasda tanlangan tuzilma, o'choq rejimi, hudud o'chog'i, erkin o'choqlar, faol o'choq, vaqt o'qi; `McDonaldPanel`
  plastinkadan tashqari topilmalarni (`mcExtra`). Ko'ruvchi yopilganda tozalanadi. Ko'ruvchi AI haqida hech narsa bilmaydi.
- `src/ai/context.ts` `brief()` → `{ text, label }`: ilova tabi va 3D ko'rinish, qatlamlar, mavzu; 3D da tanlangan qism
  (nomi + uz nomi, qatlam, tizim, tomon, MNI markaz, atlas matni / funksiya / klinika qisqartirilgan, manbalar Markdown
  havola sifatida); kuzatilayotgan yo'l; dars va qadam matni; ochiq plastinka (kod, nom, yo'nalish, ko'rinish), unda
  tanlangan tuzilma (`info`, `lesion`); hudud rejimi — daraja/tomon/hudud = sindrom, kesilgan yo'llar (bemor tomoni),
  kalla belgilari; erkin o'choqlar — har biri: plastinka, daraja, tomon, diametr, vaqt, Gd, tuzilmalar %, yo'llar, belgilar,
  klassik hududlar; birgalikdagi natija; McDonald 2017/2024 (ilova hisobi). Matn modelga inglizcha, nomlar uz bilan.
  `briefSection()` — tizim promptiga "Live state" bo'limi + qanday ishlatish ("bu/shu" deganda; atlas manbalarini havola
  qilish; tashqi bilim bo'lsa aytish; simulyator sxematik ekanini eslatish).
- `useAI`: `withContext` (standart yoqiq, `na:ai`da saqlanadi); har yuborishda o'sha paytdagi `brief()` tizim promptiga
  qo'shiladi va foydalanuvchi xabarida `context` (yorliq + to'liq matn) saqlanadi.
- UI: yozish maydoni ustida "Kontekst" chipi (yoqish/o'chirish) + jonli yorliq ("Chap talamus", "K3 · 3 o'choq"), ko'z
  tugmasi — AI'ga aynan nima yuborilishi; yuborilgan xabar ostida 📍 yorliq — bosilsa o'sha suratni ko'rsatadi.
  `ContextBar` faqat tegishli store maydonlariga obuna (`useShallow`), hover/kamera harakatida qayta hisoblanmaydi.
- Mock: tizim promptidagi "Live state" dan bir necha qatorni javob oxiriga qaytaradi — kontekst yetib borganini headless
  ko'rish uchun.
- Tekshiruv: 3D da chap talamus tanlangan → chip "Chap talamus", oldindan ko'rishda atlas matni va MNI markaz; B2 → TS keysi
  → panel kesim ko'ruvchisi ustida, javobda K3, 3 o'choq, #1 MLF 100% Gd+, McDonald qatorlari. tsc, build, audit-lesions 0.
- QOLDI: AI-3 (tools — ilovani boshqarish), kontekstga vision (AI-4).

### AI-1 — AI panel: provayderlar, Hisoblar, oqimli chat (2026-11-21)

Reja va faktlar: `PLAN.md` 5.6. Qarorlar: OpenRouter bilan kirish + o'z API kaliti + lokal model; panel o'ngdan varaq.
- `src/ai/types.ts` (`Provider`: `listModels`, `stream` → `text | usage | refusal`; `AIError.kind`: auth/credit/rate/model/
  network/server/bad/abort; `call()` — fetch xatosi → `network`, abort → `abort`), `src/ai/sse.ts` (SSE: CRLF, ko'p qatorli
  `data`, izohlar, oxirgi bo'sh qatorsiz hodisa).
- Provayderlar `src/ai/providers/`: `anthropic.ts` — rasmiy `@anthropic-ai/sdk` 1.12 (foydalanuvchi ruxsati bilan qo'shildi;
  dinamik import → alohida `sdk-*.js` bo'lak 378 KB / 82 KB gzip, asosiy bundle'ga kirmaydi), `dangerouslyAllowBrowser`,
  `fetch: globalThis.fetch` (testda almashtirish uchun), `beta.messages.stream`, `max_tokens` 64000, Fable 5.2/5.1, Opus
  5.5/5, Sonnet 5.5 uchun `fallbacks: "default"` (`server-side-fallback-2026-07-01`), `refusal` → eslatma; `compat.ts` —
  OpenAI Chat Completions (OpenAI, OpenRouter — `HTTP-Referer`/`X-Title`, ochiq model ro'yxati faqat anthropic/openai/google;
  lokal — standart `http://localhost:11434/v1`); `gemini.ts` — `streamGenerateContent?alt=sse`, `x-goog-api-key`, `thought`
  qismlari tashlanadi; `mock.ts` — faqat dev (headless sinov). `pickModel()` — model ro'yxatidan afzallik tartibi (qattiq id yo'q;
  Anthropic'da `claude-opus-5-5` birinchi).
- `src/ai/openrouterAuth.ts`: PKCE (S256, verifier sessionStorage'da), `openrouter.ai/auth?callback_url=<sahifa>` →
  qaytishda `?code=` → `POST /api/v1/auth/keys` → foydalanuvchining kaliti; kod URL'dan darhol olib tashlanadi.
- `src/ai/useAI.ts` (zustand, dev'da `__ai`): `creds` (eslab qolish yoqilsa localStorage `na:ai:creds`, aks holda
  sessionStorage), `provider`/`model` (`na:ai`), `models` keshi, `messages` (xotirada), `send`/`stop`/`clear`;
  AI-1 tizim prompti (ta'limiy repetitor, ilova tilida, ishonchsiz bo'lsa "bilmayman", bemor ma'lumoti yo'q).
- UI: `src/ui/AIPanel.tsx` (+ `aiMarkdown.tsx` — React tugunlari, HTML yo'q: paragraf, sarlavha, ro'yxat, iqtibos, kod,
  qalin/kursiv, faqat http(s) havola). Ulanmagan bo'lsa — "AI hisobini ulang" (OpenRouter bilan kirish / API kalit);
  model tanlagich (ulangan provayderlar bo'yicha guruh), tez savollar, Enter yuborish / Shift+Enter qator, to'xtatish,
  token soni, xatolar odam tilida. Hisoblar: har provayder qatori (kirish/kalit/chiqish/tekshirish → "N model"), lokal URL,
  "Bu qurilmada eslab qolish", maxfiylik eslatmasi. `ViewGroup`da ✨ tugma, `⌘/` (Ctrl+/). Telefonda pastki varaq.
  Uslublar `index.css` oxirida "AI panel" — tokenlar bilan (yorug' rejimda "qora orol" emas), z 24 (kesim ko'ruvchisidan yuqori).
- Tekshiruv: mock bilan headless (ulanish ekrani, Hisoblar, oqimli javob + markdown, `error:auth`, yorug' rejim, telefon);
  5 provayder oqim tahlilchisi soxta fetch bilan (OpenAI, OpenRouter izoh qatori bilan, lokal, Gemini `thought`, Anthropic SDK
  hodisalari) — matn va token to'g'ri; 401 → auth, server o'chiq → network. tsc, build, audit-lesions 0.
- SINALMAGAN: haqiqiy kalitlar va OpenRouter redirect (foydalanuvchi hisobi kerak) — foydalanuvchi o'zi sinaydi.
- QOLDI: CSP (`<meta http-equiv>` — `connect-src` faqat provayderlar + o'z domen); suhbatni saqlash; AI-2 kontekst.

### 5.3-3g — Real kesim va atlasda o'choq qo'yish (2026-11-21)

- `lesionFocal.ts`: `cutMatrix(plate)` (affin yoki quti — ikkalasi ham 2×3), `plateToCut()` va teskarisi `cutToPlate()`;
  `focalMni` endi `plateToCut` + ramka.
- `AtlasSliceView` `focal` prop (`FocalOnCut`): disklar kesim tekisligida HAQIQIY mm radiusda (raqamli nishon, Gd+ sariq,
  faol bo'lmagani xira); Nuqta rejimida bosish → (a, b) → `cutToPlate` → `placeFocus` (sxemadagi bilan bir xil o'choq:
  surish, "Yana o'choq", vaqt, McDonald, 3D). Soha bosish o'choq rejimida tanlamaydi; `stopPropagation` — ZoomPane to'liq
  ekranga o'tmaydi. Faqat `cutSec === section` (T2/G4 o'rinbosar kesimida emas).
- "O'choq ostida (atlas)": faol disk ustidagi 15×15 to'r nuqtalarining har bir atlas sohasi (`inLoops`, even-odd)
  ichidagi ulushi ≥5% — sxema hisobiga (`focalOn`) qarshi mustaqil tekshiruv. Qatlamlar ustma-ust, yig'indi 1 emas.
  Memo raqamlar bo'yicha (hover qayta chizishda qayta hisoblanmaydi).
- Tekshiruv: B5 real kesim (BigBrain) bosish → ichki kapsula 81%, talamus 17%; sxemada o'sha o'choq kapsula tizzasi
  yonida (B5 qoldig'i ~6 mm). K1 atlas: chap ko'prik asosi → "ko'prikning bazilyar qismi 100%", CST o'ng tanada.
  audit-lesions 0, tsc, build.
- QOLDI / PhD: sxema va atlas ostidagi tuzilmalar farq qilsa ogohlantirish; atlas sohalaridan bevosita yo'l belgilari
  (JHU tolalari → yo'llar); PPMS; T2/FLAIR.

### PERF-1 — Real kesimda qotish (2026-11-19)

- Foydalanuvchi: "real suratda harakat juda kech, interfeys qotib ishlavotti". `scripts/perf-real.mjs` (CDP
  `Performance.getMetrics`, har hodisaga script/style/layout/task): B5 real kesim — sichqoncha harakati 369 ms script
  (sxemada 10 ms).
- Sabab: `AtlasSliceView` `onPointerMove` → `setCursor` (MNI o'qi) → butun komponent qayta render: har soha uchun
  `regionPath` (minglab nuqta → satr), `placeLabels` (`interior()` qidiruvi), `placeMarks` — har harakatda.
- Tuzatish: `regionPath` natijasi `WeakMap<SliceRegion,string>`da; `named`/`badges` `useMemo` (til — `useAtlas(s=>s.lang)`,
  chunki `useL()` har renderda yangi funksiya); kursor `MniCursor` komponentida (ref orqali bog'langan setter), SVG
  qayta render bo'lmaydi. `ZoomPane`: g'ildirak, pinch va surish paytida `.sv-zoom-inner.moving` (`will-change:
  transform`, 180 ms sukunatdan keyin olinadi) — qatlam GPU'da suriladi, keyin aniq rasterlanadi.
- Natija (task ms/hodisa): real hover 377 → 12–15, surish 16 → 3–6, g'ildirak 5–6 (o'zgarmagan); atlas va U3 ham
  shunday. MNI kursori ishlaydi (tekshirilgan), zoomdan keyin rasm o'tkir (screenshot).

### 5.5 D — Bosib to'liq ekranga (2026-11-17)

- `ZoomPane`: rasmning BO'SH joyiga (tuzilma, nishon, yorliq, atlas sohasi, tugma emas — `closest()` bilan) bitta bosish
  → `onFull(true)`. 260 ms kutadi va `e.detail > 1` ni o'tkazib yuboradi — ikki marta bosish faqat zoom qiladi.
  Kursor `zoom-in` (`.sv-zoom.can-full:not(.zoomed)`, atlas/real `.as-svg` ham). Esc / F / tugma — chiqish.
  Sxemada zamin to'qimasi ham tuzilma, shuning uchun bo'sh joy = kesim siluetidan tashqari; real kesimda — sohalar orasi.
  Headless tekshiruv: tuzilma → tanlandi, to'liq ekran yo'q; ikki marta → zoom, to'liq ekran yo'q; bo'sh → to'liq; Esc → chiqdi.
- ✅ 3D darsda (2026-11-17): `lessons/lesion.ts` `setLesionSignProvider()` — `ui/lesionSigns.ts` yuklanganda o'zini
  ro'yxatdan o'tkazadi (darslar so'ralganda quriladi, shuning uchun tartib xavfsiz; ma'lumot qatlami UI'ni import
  qilmaydi). Umumiy qadam matniga "Daraja belgilari: ..." qo'shildi; yangi 2-qadam "Darajani aniqlaydigan belgilar":
  har belgi alohida qatorda (`.lesson-text` `white-space: pre-line`), kesishgan belgilar bo'lsa `memo`; o'choq atrofida
  to'q sariq yorliqlar (`CranialSign.short`); 3D meshi bor tuzilmalar (miyacha oyoqchalari, qizil yadro) to'q sariq
  yoritiladi — kalla nervi yadrolarining atlasda meshi yo'q.

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
23. `raycaster.firstHitOnly = true` + clip tekislik: kesilgan meshning
    birinchi kesishuvi olib tashlangan yarmida bo'ladi → rad etiladi, uning
    ko'rinib turgan kesim yuzasi tekshirilmaydi → hover ORTDAGI tuzilmani
    nomlaydi (2026-10-09: medial yuzada 33 % xato — qadoqsimon tana/septum
    "o'ng yon qorincha", III qorincha "talamus"). Kesim faol bo'lsa
    `firstHitOnly = false`. Tekshiruv: `scripts/audit-pick.mjs`.
24. Dock ichidagi `grid auto-fill` — dock paneli kengligini mazmunga qarab
    qisqartiradi, auto-fill esa doim minimal ustun oladi (2 ustun, baland
    panel). To'rga aniq `width: min(...)` bering. Belgilar/yorliqlarni
    `nowrap` qilsangiz inglizcha (uzunroq) matnda kartadan chiqib qo'shni
    kartaga minadi — har doim EN va UZ da suratga oling.

## AG-1 — parcellation ta'riflari (2026-11-22)
Antigravity: `src/data/content/{desikan,jhu,destrieux,glasser}.json` (35+27+74+179 konsept, 626 qism), `content/index.ts` ga ulandi. Claude tekshirdi (id'lar parts.json bilan to'liq mos, Crossref DOI'lar, audit-lesions 0, audit-pick 0) va birlashtirdi (`616d941`). Buzuq Wikipedia havolasi tuzatildi.

## CL-2 (2026-11-22): AI panel joylashuvi, look_at_screen, AI-6 tadqiqoti
- `src/index.css` "CL-2": `--ai-w`; ≥1560 px (yoki ≥1100 px va yon panel yopiq) kartalar AI panelning chapiga suriladi va markaz `--free-r` bilan
  ergashadi; torroqda AI ochiq paytda kartalar yashirinadi; telefonda pastki varaq.
- `look_at_screen` (`src/ai/tools.ts`): `capturePlate()` yoki `sceneSnapshot(1024)`; tool natijasi matn, surat `useAI` sikli
  orqali keyingi user xabari (`images`) bo'lib ketadi; `gemini.ts`/`anthropic.ts` uni tool natijalari bilan bitta user xabariga birlashtiradi.
  Mock: "ekranga qara" / "look at screen". Surat keyingi xabarlarda qayta yuborilmaydi (mavjud mexanizm).
- AI-6 (SIWC): ochiq manbali yo'l `dynamic_agent_client` + PKCE + faqat `http://127.0.0.1:<port>/auth/callback`, tokenlar mahalliy faylda;
  scope `offline_access resource.invoke chatgpt.tokens.use.direct`; inference `POST /v1/responses` (`store:false`, `stream:true`).
  Statik GitHub Pages klienti hujjatlashtirilmagan (https redirect, CORS, brauzer saqlash) — OpenAI'dan so'rash kerak.

## CL-6 — plastinka ko'ruvchisida rasm kattaroq, kursor javobi tez (2026-11-22)

Gipotezalar o'lchandi (headless, 1280×720, Mc "Real kesim", CDP tracing): (1) `backdrop-filter` — o'chirilganda farq shovqin ichida
(RunTask 72→66–73); karta baribir ~93% shaffofmas, ya'ni blur hech narsa ko'rsatmas edi; (2) sahna sikli — `BrainScene` faqat `dirty` bo'lsa
render qiladi: viewer ochiqligida WebGL render 0/50 (rAF qaytarilishi arzon); (3) `stroke-dasharray` — o'chirilganda farq yo'q;
(4) hover SVG qayta chizilishi PERF-1 da tuzatilgan (4.5 ms). Asosiy sabab — joy: rasm 410×299 px (karta balandligining 44%).
Tuzatish: `.sv-bar` (tablar + chiplar bir qatorda), izohlar ⓘ qalqib chiquvchida (`sv-hint-pop`), "≈ B5" belgisi (stand-in), afsona faqat
sxemada, `AtlasSliceView` vertikal hoshiya 0.034 (yon 0.07 — o'q so'zlari uchun), manba satri rasm ustida; blur olib tashlandi,
`.as-region`/`.sv-item` opacity `transition` olib tashlandi (hover darhol), `BrainScene.animate` `sectionId` bo'lsa kadrni o'tkazib yuboradi.
`scripts/perf-real.mjs --trace` — GPUTask/RunTask/Paint/WebGL render soni. Natija: rasm Mc 427, B4 416, K3 433 px (62/61/63%);
hover RunTask 72→45 ms. QOLDI: foydalanuvchi real GPU'li brauzerida Performance yozuvi bilan tasdiqlashi; zoom g'ildiragida
qayta rasterlash (headless GPUTask 20 ms) — real GPU'da o'lchash kerak.

## AG-3 (2026-11-22): Draco meshlar va deploy (Antigravity, Claude tekshirdi)
- `pipeline/tools/draco_meshes.py` (DracoPy, qb 14, nqb 10, cl 7): 196.21 MB → 21.04 MB; `--tar` Release arxivi.
- `src/scene/loader.ts`: `DRACOLoader` (`public/draco/` — three.js gltf dekoderi), `VITE_MESH_BASE`; siqilgan va siqilmagan GLB birdek.
- `deploy.yml`: `vars.VITE_MESH_BASE` bo'lmasa `meshes-v1` Release'dan `meshes-draco.tar.gz` → `public/meshes` → Pages (bir origin).
- Sinash: Draco meshlarni vaqtincha `public/_draco_tmp/` ga qo'yib `VITE_MESH_BASE=/_draco_tmp/ npx vite --port 3021`, keyin
  `NA_URL=http://localhost:3021/ node scripts/audit-pick.mjs` (production preview'da `__atlas` yo'q).
- Ochiq: `meshes-v1` Release; kod litsenziyasi (`LICENSE` fayli yo'q).

## CL-3 — 5.1 yopildi (2026-11-22)

`audit-sections.mjs --coverage`: hamma 22 plastinkada egasiz 0.0% (T2 ✅ 2026-11-16 dan keyin boshqa plastinkalarda ham, zamin/hudud
hisobga olinganda); zamin ulushi 25–75% — haqiqiy to'qima (tegmentum, yarim shar oq moddasi, hypo-grey, miyacha oq moddasi), uni "bo'linma"ga
aylantirish anatomik xato bo'lardi. `--min 0.15` da haqiqiy tirqish-ustma-ustliklar: U3 vn×icp (vn ichki nuqtalari o'ngga), O3 inc
(PAG'dan tashqariga), B4 gpi (GPe medial chegarasidan chap), B5 ic-g (ic-al ostidan). Ataylab qolganlar: ichma-ich yadrolar va B1 striatal
ko'priklari. Tekshirildi: audit (`--min 0.15`, `--coverage`), audit-lesions 0, audit-pick 0, tsc, B4 sxema surati.


## AG-5 birlashtirildi (2026-11-22)

`ag/AG-5` (200 ikki tilli viktorina savoli, `src/data/quiz/*.json`) tekshirildi va birlashtirildi. Tasdiqlandi: sxema/ref/plate 0 xato, 47 manba
Crossref + eutils bilan mos. Tuzatildi: ikki noto'g'ri Purves NBK ID (savollarda va eski `gross-brain.json` da). Qoldi (AG-5b): to'g'ri javob 83%
savolda eng uzun, ishonarsiz distraktorlar, 57 savolda kod identifikatorlari. Ma'lumot CL-4 UI ulanmaguncha faol emas.

## CL-4 — mavzu viktorinasi + Anki (2026-11-22)

- `src/quiz/engine.ts`: `loadBank` (`import.meta.glob`, mavzu bo'yicha bo'lak), `rng` (mulberry32, urug'li), `toCard` (variantlar aralashadi, to'g'ri indeks
  qayta hisoblanadi), Leitner qutilari 0–3 (dam olish 0/1/3/7 kun; xato → 0, to'g'ri → +1), `pickDeck` (`mixed`: yangi → muddati kelgan → qolgani;
  `weak`: xato qilingan va qutisi <2, eng ko'p xato birinchi), `summarise` (daraja bo'yicha, kalibratsiya: ishonchli/ishonchsiz aniqlik, zaif `refs`),
  holat `localStorage` `na:quiz`.
- `src/ui/QuizPanel.tsx`: sozlash (daraja, soni, rejim) → savol (1–4 tugma, Enter, Esc; "Ishonchim komil"; izoh + manbalar; "3D da ko'rsat" — oyna yashirinadi,
  "Viktorinaga qaytish" tugmasi; "Plastinkada ko'rsat" — ustida ochiladi, Esc avval plastinkani yopadi) → natija (ball, daraja, kalibratsiya, zaif tuzilmalar,
  "Xatolarni qayta", Anki: xatolar/hammasi). Kirish: O'rganish tabi, har mavzu ostida "Viktorina" kartasi (`topic-quiz`).
- `src/quiz/anki.ts`: `ankiText`/`downloadAnki` (`#tags column:3`); AIPanel kartalari ham shuni ishlatadi.
- PhD/neyroxirurg qatlami: ekspert daraja klinik lokalizatsiya keyslari, kalibratsiya (xavfli "ishonchli xato"), takrorlash oraliqlari.
- Tekshirildi: engine skripti (bir urug' = bir deck, weak/Leitner, variant o'rni taqsimoti, Anki matni), UI (qora va yorug' rejim, 3D/plastinka), tsc, build,
  audit-lesions 0, audit-pick 0. Tekshirilmadi: telefon kengligi, foydalanuvchi o'z brauzerida. Savollar sifati — AG-5b.
