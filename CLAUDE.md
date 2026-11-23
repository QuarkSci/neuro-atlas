# Neuro Atlas — Claude uchun qisqa qo'llanma

> Foydalanuvchi (MuhammadYusuf) o'zbekcha yozadi → javoblar o'zbekcha, kod izohlari inglizcha.
> To'liq tarix, bosqichlar tafsiloti, barcha tekshiruv skriptlari va xatolar ro'yxati:
> **`docs/HISTORY.md`** — kerak bo'lganda `grep` qiling, butunlay o'qimang.
> Bosqichlar jadvali va xavflar: `PLAN.md` 3–4-bo'limlar.

## Loyiha

Ochiq, bepul, ta'limiy 3D neyroanatomiya atlasi (1740 qism, shu jumladan 68 ko'zgulangan tomir; 9 qatlam: gross
BodyParts3D, Julich, Brodmann, Desikan, Destrieux, Glasser, JHU, bstem Allen/AAN,
suit). Falcon Atlas (`../falcon-atlas`) davomi: Three.js `BrainScene` + zustand
(`useAtlas`, dev'da `__atlas`) + shadcn, Liquid Glass dizayn, qora va yorug' rejim (`theme`, `na:theme`).
Tamoyil: **"perfektlik vaqtdan ustun"** — screenshot bilan tekshirilmagan narsa "tayyor" emas.
GitHub: QuarkSci/neuro-atlas (akkaunt **QuarkSci**, git user `MuhammadYusuf-scientist` emas).

## Qat'iy qoidalar

- Litsenziya: faqat ochiq manbalar; **CC BY-ND taqiq**; NC mumkin; har qism `source`da manba+litsenziya.
  Atlas yuklashdan oldin litsenziya sahifasini o'qing (Brainstem Navigator, USC — rad etilgan).
- `data/raw/` va `public/meshes/` (196 MB, gitignore) hech qachon commit qilinmaydi;
  diskda bor, qayta hosil qilish shart emas (retsept: `pipeline/README.md`).
- Three.js: `clearcoat: 0`; `material.side` o'zgarsa `needsUpdate = true`; clip faol bo'lsa
  `raycaster.firstHitOnly = false`; `material.clippingPlanes` massivi qayta tayinlanmaydi.
- `src/data/levels.ts` → `index.ts` import qiladi; `index.ts` uni QAYTA EKSPORT QILMASIN (aylanma import).
- `uz` nomlarga "Chap/O'ng" yozilmaydi — `sidedName()` qo'shadi.
- Prettier: `npx prettier --no-semi --single-quote --print-width 180` (konfiguratsiyasiz ishlatmang).
- Patch skriptlarini Write bilan faylga yozing; Python'da bir faylni bir vaqtda 'w' bilan ochib o'qimang.
- Manbalar: DOI → Crossref API sarlavhasi; NCBI Bookshelf → eutils (`esearch`/`esummary`), HTTP 200 emas.
- Har yangi funksiya bilan PhD/neyroxirurg darajasidagi imkoniyat ham taklif qilinsin.

## Ish tartibi

- Holat: `git status` toza, `git rev-parse HEAD origin/master` bir xil.
- Dev server: `npm run dev` → http://localhost:3019 (3017 — Falcon). `curl -s -o /dev/null -w "%{http_code}" localhost:3019`
  `000` bo'lsa Bash `run_in_background` bilan qayta ishga tushiring. `preview_start` ishlamasa — fonda `npm run dev` + `navigate`.
- Tekshiruv: foydalanuvchi pane'da ishlayotgan bo'lishi mumkin → headless afzal:
  ```bash
  node scripts/shot.mjs /tmp/smoke.png --lang uz --w 900 --h 560 --wait 13000 --setup "const a=__atlas.getState(); a.setView('lateral')"
  ```
  Boshqalar: `scripts/shot-sections.mjs`, `shot-lessons.mjs`, `audit-pick.mjs` (diff 0),
  `audit-sections.mjs --min 0.15`, `audit-lesions.mjs` (0); ma'lumot butunligi skriptlari — `docs/HISTORY.md` 0-bo'lim.
  Tokenni tejash: screenshotlar kichik (≈900×560) va bosqichga 2–4 ta; qolgani sonli audit bilan.
  Pane yashirin bo'lsa rAF ishlamaydi — headless ishlating.
- Commit oldidan: `npx tsc -p tsconfig.app.json --noEmit && npm run build && rm -rf dist`.
  Xabar o'zbekcha, batafsil (nima va NEGA), `-F fayl` bilan, oxirida tizim eslatmasidagi
  `Co-Authored-By:` qatori. Push `origin master`.
- Bosqich oxirida: shu faylning "Joriy holat" bo'limi + `PLAN.md` jadvali yangilansin,
  tafsilot `docs/HISTORY.md`ga yoziladi.
- Bitta bosqich = bitta sessiya (kontekst tejaladi).

## Kod xaritasi (qisqa)

- `src/scene/BrainScene.ts` — sahna, kesim tekisliklari, markerlar, dars rejimi; `loader.ts` (MNI→sahna `(−x,z,y)`),
  `materials.ts`, `slice.ts`, `atlasSlice.ts`.
- `src/data/` — `parts.json` (`pipeline/build_catalogue.py`), `index.ts`, `levels.ts`, `topics.ts` (O'rganish mavzulari),
  `sections/` (17+5 kesim, `structures-*.ts` lug'at), `lessons/` (3 dars + 4 yo'l darsi `pathways.ts` dan + `lesion.ts`
  o'choq darslari), `pathways.ts` (CST/DCML/ALS/V), `lesions.ts` (+ `CRANIAL_SIGNS`), `content/*.json` (487 yozuv).
- `src/ui/` — `Header` (`TabBar`, `ViewGroup`, `Identity`), `Sidebar`, `BottomBar` (kontekstli tasma), `SectionViewer`
  (+ `ZoomPane`, `LesionPanel`, `pathTrace.ts`, `lesionTerritory.ts`, `lesionSigns.ts`),
  `AtlasSliceView`, `LessonPanel`, `ViewControls`, Inspector; `liquidGlass.ts`, `useLens.ts`.
- Rejimlar: `explode | peel | learn`. Yangi dars/kesim → tegishli mavzuga (`topics.ts`) yozilsin; yangi tab ochilmaydi.
- Pipeline vositalari: `pipeline/tools/slice_svg.py`, `landmarks.py` (`pipeline/.venv/bin/python`, repo ildizidan).

## KEYINGI SESSIYA — shu yerdan boshlang (2026-11-22, ikki agent: Claude + Antigravity)

**Avval `AI.md` ni o'qing** (0–4, 6–9-bo'limlar) — yagona ish hujjati: holat, rollar, tasdiqlash protokoli, vazifalar
taxtasi. Claude — tekshiruvchi va integrator: sessiya boshida `ag/*` branchlar va `docs/handoff/` ni ko'ring (AI.md 6.1–6.2),
foydalanuvchi rozi bo'lsa `master`ga birlashtiring — Antigravity kodi shundan keyingina faol. Holat taxtasini (AI.md 9)
faqat Claude yangilaydi. Birinchi CL vazifa — **CL-1** (AI panel haqiqiy Gemini kaliti bilan ishlamayapti).
Antigravity alohida worktree'da (`../neuro-atlas-ag`, port 3020); skriptlar `NA_URL` ni o'qiydi (standart 3019).

Oxirgi sessiya (2026-11-21): erkin o'choqqa vaqt o'qi + McDonald 2017/2024 (`docs/HISTORY.md` "5.3-3e"),
so'ng erkin o'choqlar 3D da ("5.3-3f": `focalMni` + `pipeline/plate_affine.json`, `src/ui/focalLesson.ts`).
So'ng real kesim / atlas ko'rinishida bosib o'choq qo'yish ("5.3-3g": `cutToPlate`, `AtlasSliceView` `focal`, "O'choq ostida (atlas)").
Tekshiruv zanjiri: `node scripts/audit-lesions.mjs` (0) + tsc + build + 2–4 screenshot; tezlik —
`node scripts/perf-real.mjs`. Erkin o'choqni headless sinash: Shikastlanish tabi → "Nuqta" → "TS keysi" tugmasi (3 o'choq
tayyor) yoki `.sv-svg` ichidagi `[data-id=...] path` markaziga `MouseEvent('click')`; vaqt — `.mc-tick` ni bosish.

**Vaqt o'qi va McDonald ✅ (2026-11-21)** — `src/ui/mcdonald.ts` (`mcArea`, `mcdonald`, `msCase`), `src/ui/McDonaldPanel.tsx`
(`FocusTime`, vaqt o'qi SVG + slayder, sohalar, plastinkadan tashqari topilmalar, 2017/2024 xulosa). `FocalLesion.t/gd`,
`focalSet(foci, now)`. Soha plastinkadan: miya ustuni → infratentorial, `lv` ga tegsa → periventrikulyar, `ins` → po'stloq yoni.

**Erkin (nuqtali) o'choq ✅ (2026-11-19)** — `docs/HISTORY.md` "5.3-3d": Shikastlanish tabida "Hudud | Nuqta";
plastinkani bosish → disk (radius 0.5–12 mm, ≈ masshtab `pipeline/section_frames.json` oynasidan). `src/ui/lesionFocal.ts`
(`focalOn()`: tuzilmalar ulushi, yo'llar, kalla belgilari, klassik hududlar bilan ustma-ustlik %). Markazdagi tuzilma =
eng ichki kontur yoki chiziq (aks holda kapsula lakunasi butun orqa oyoqni "oladi"); `TRANSIT` — kapsulada talamokortikal
tolalar (`ic-pl`, `tcr`). **Bir nechta o'choq ✅ (2026-11-19):** `SectionViewer` `foci[]` + `activeFocus` + `adding`
("Yana o'choq" → keyingi bosish qo'shadi; boshqa plastinkada bosish ham yangi o'choq), `focalSet()` (har biri o'z
plastinkasida, tomonlar qo'shiladi: L+R = B), `focalTerritory()` (shu plastinkadagi disklar, raqamli nishon).

**Trigeminotalamik yo'l ✅ (2026-11-17)** — `docs/HISTORY.md` "5.3-3c": `path-v` (4-yo'l, `body: 'face'`), yuz og'rig'i
endi kalla belgisi emas, yo'l. Kattalashtirish (PLAN 5.5 C) allaqachon bor: `ZoomPane` (g'ildirak, ikki marta bosish,
tugmalar, F; bo'sh joyni bir marta bosish — to'liq ekran).

**Kalla nervlari simulyatorda ✅ (2026-11-17)** — `docs/HISTORY.md` "5.3-3b": `CRANIAL_SIGNS` (lesions.ts),
`src/ui/lesionSigns.ts` (`cranialSigns`, `localiseWithSigns`), panelda oldinga ro'yxat + teskari tanlov + "yana kutiladi";
3D o'choq darsida ham ("Darajani aniqlaydigan belgilar" qadami, `setLesionSignProvider`).

**O'choq plastinkada va 3D da ✅ (2026-11-17)** — tafsilot `docs/HISTORY.md` "5.3-3a". `src/ui/lesionTerritory.ts`
(havza = u/v ko'pburchak yoki tuzilma; `territoryOn()` → shakl + hududdagi tuzilmalar), `scripts/audit-lesions.mjs`
(simulyator bilan mosligi, 0 bo'lishi shart), `src/data/lessons/lesion.ts` (`lesion:<level>:<side>:<zone>` darsi;
`LessonStep.flows[]` + `cut`, `lesion` shari). O'choq holati `SectionViewer`da.

**Yo'llar va shikastlanish ✅ (2026-11-17)** — tafsilot `docs/HISTORY.md` "5.3 (1+2)". Qisqa xarita:
`src/data/pathways.ts` (CST/DCML/ALS/V bekatlari, O'NG tana = CHAP yarim shar), `src/data/lessons/pathways.ts` (3D darslar
avtomatik), `src/ui/pathTrace.ts` (plastinkada yoritish, `store.pathway`), `src/data/lesions.ts` + `src/ui/LesionPanel.tsx`
(kesim ko'ruvchisining "Shikastlanish" tabi, teskari rejim `localise`). Mantiq tekshiruvi: headless brauzerda
`import('/src/data/lesions.ts')` → `signature()` (Brown-Séquard, Dejerine, Wallenberg, Weber to'g'ri chiqadi).
O'choq chizish ✅ 5.3-3a, kalla nervlari ✅ 5.3-3b, trigeminal ✅ 5.3-3c.

**5.5 ✅ (2026-11-17)** — tafsilot `docs/HISTORY.md` "5.5": `src/ui/ZoomPane.tsx` (zoom, F = to'liq ekran),
real kesim 21/22 (`REAL_STAND_IN` T2→B5, G4→G2; U1 manbasiz), `pipeline/mirror_vessels.py` (68 tomir ko'zgu jufti,
`mirrorOf`, `data/gross_mirrored.json`; meshlar qayta hosil qilinsa — mirror_vessels.py → build_catalogue.py).

**Real kesim qotishi ✅ (2026-11-19)** — foydalanuvchi: "real suratda harakat juda kech, interfeys qotib ishlavotti".
Sabab: `AtlasSliceView`da MNI kursor holati har pointer harakatida butun SVG'ni qayta qurardi (soha yo'llari matni,
`placeLabels`, `placeMarks`) — B5 da 369 ms/harakat. Tuzatish: `regionPath` WeakMap keshi, yorliq/nishonlar `useMemo`
(`lang` bo'yicha — `useL()` har renderda yangi funksiya), kursor alohida `MniCursor`da; `ZoomPane` imo-ishora paytida
`.moving` → `will-change: transform` (180 ms dan keyin o'chadi, rasm yana o'tkir). Natija 4.5 ms/harakat.
O'lchash: `node scripts/perf-real.mjs [plate] ["Real kesim"|"Atlas"|"Sxema"]` (CDP: script/style/layout har hodisaga;
headless "wall" vaqti dasturiy GPU tufayli shovqinli). QOIDA: pointermove'da katta komponent holatini o'zgartirmang.

**AI panel — AI-1…AI-5 ✅ (2026-11-21), KEYINGI: AI-6 (hisob bilan kirish) yoki foydalanuvchi sinovi** — reja `PLAN.md` 5.6,
tafsilot `docs/HISTORY.md` "AI-1"…"AI-5".
`src/ai/` (`types.ts`, `sse.ts`, `providers/` anthropic (rasmiy SDK, dinamik import) | compat (OpenAI/OpenRouter/lokal) |
gemini | mock (dev), `openrouterAuth.ts` PKCE, `useAI.ts` — dev'da `__ai`), `src/ui/AIPanel.tsx` + `aiMarkdown.tsx`, ✨ tugma
va `⌘/`. Headless sinov: `__ai.getState().setCred('mock',{key:'mock'})`, `choose('mock','mock-tutor')`, `send(...)`;
`send('error:auth')` — xato ko'rinishi. Haqiqiy kalitlar repoga YOZILMAYDI. Kontekst: `src/ai/context.ts` `brief()` +
`src/ai/screen.ts` (`useScreen` — kesim ko'ruvchisi holati + `command` — AI'dan buyruqlar); mock "Kontekstdan:" qaytaradi.
Tools: `src/ai/tools.ts` (9 ta, `runTool`), agent sikli `useAI.send` (`turns`, ≤ 6 raund); mock: "wallenberg", "MLF",
"talamusni ko'rsat" → amallar. Provayder raw'i (Claude thinking, Gemini thoughtSignature) o'zgarishsiz qaytariladi.
Rasm: `sceneSnapshot()` (`src/scene/capture.ts`), `capturePlate()`/`captureFile()` (`src/ui/plateCapture.ts`), `useAI.attachments`;
rasm faqat o'z xabari bilan yuboriladi. Rejimlar (`useAI.mode`): tutor | socratic | case | research (`MODE_PROMPT`);
15 tool, async `runTool`; `VERIFIED` — tekshirilgan PMID/DOI, qolganlari ogohlantiriladi; mock: keys/tadqiqot/anki/"uydirma".

**Navbatdagi vazifa — foydalanuvchi tanlaydi** (avval qisqa reja ko'rsating): PLAN 5.3-3 mavzu viktorinasi + Anki;
Villiz doirasi variantlari (PhD); U1 uchun ochiq histologik manba; BigBrain 20 mkm plitkalar (zoomda);
5.4 UI qoldiqlari (dars kartasi va kesim ko'ruvchisi yorug' rejimda "qora orol"); erkin o'choqning PhD davomi
(sxema↔atlas farqi ogohlantirishi, JHU tolalaridan yo'llar, PPMS yo'li, T2/FLAIR ko'rinishi, 3D da o'choqni sudrash). Tezlik: real kesimni foydalanuvchi o'z brauzerida hali tasdiqlamagan — so'rang.

**Kamera bilan boshqarish 🅿️ (2026-11-23)** — qo'l (HT-1) va bosh "3D oyna" (HP-1) `hands/HT-1` branchida tayyor, lekin
foydalanuvchi qarori bilan master'ga QO'SHILMAYDI (veb / faqat Mac / faqat iPad keyin hal qilinadi). Hammasi `docs/HANDS.md` da;
reja PLAN 5.8 (neyroxirurgik simulyator). **Davomi — `docs/SURGERY.md`** (shlemsiz VR jarrohlik simulyatori: `sx/main`,
`../neuro-atlas-sx`, port 3021; SX-1…SX-7; AGY AG-8…AG-13; tayyor promptlar 4-bo'limda).

Ish uslubi bo'yicha eslatmalar (2026-11-17):
- TS mantiqni tekshirish: `npx -y tsx` ruxsat bermadi → vaqtinchalik `scripts/_x_tmp.mjs` (puppeteer) da dev serverdan
  `await import('/src/...ts')` qilib, keyin faylni o'chiring.
- `pipeline/.venv` ga `trimesh` o'rnatildi (mirror_vessels.py uchun).
- `build_catalogue.py` qayta ishga tushirilsa parts.json aynan qayta hosil bo'ladi (cmp bilan tekshirilgan) — xavfsiz.
- Kesim ko'ruvchisi tablari: Tuzilmalar | Daraja haqida | Shikastlanish; tepada "Yo'l" tasmasi.

5.1 dan qolgan ixtiyoriy ishlar: T1 talamus ichida yadrolar tutashishi (zamin 52%), G4 (zamin 75%), ustma-ustlik U1 1.8%, K3 1.5%.

## Joriy holat (2026-11-21)

Tayyor: 0–4c bosqichlar, BG-1, 3 dars + 3 yo'l darsi va shikastlanish simulyatori (5.3 1+2, o'choq plastinkada/3D 5.3-3a, kalla nervlari 5.3-3b, trigeminal 5.3-3c, erkin o'choq + bir nechta o'choq 5.3-3d, vaqt o'qi + McDonald 5.3-3e, 3D da 5.3-3f, real kesimda 5.3-3g), AI panel AI-1…AI-5, PERF-1 (real kesim tezligi), 5.5 (zoom, real kesim 21/22, tomirlar simmetriyasi), O'rganish tabi, kontent 487 yozuv (🟡), **R1** (2026-11-14), **LG-1**, **UI-1**, **UI-2** (2026-11-15).

**Hozirgi yo'nalish — realizm (foydalanuvchi talabi 2026-11-14):** butun ko'rinishni iloji
boricha real qilish. Reja (har biri alohida sessiya va commit):
- **R1** ✅ yorug'lik/material: `colorMode: 'real' | 'atlas'` (store, `na:colors`, standart `real`;
  yuqori paneldagi tomchi/palitra tugmasi). `materials.ts` — `ATLAS`/`REAL` presetlari, `REAL_BY_ID`
  (qora modda, qizil yadro, ...), `applyColorMode()`; `BrainScene` — `RIGS` (tone mapping + chiroqlar).
  Parcellation qatlamlari ikkala rejimda xarita rangini saqlaydi. Keyingisi — **R2**.
- **R2** chuqurlik: egatlarda ambient occlusion (vertexga pishirilgan yoki SSAO), yumshoq soyalar.
- **R3** kesim yuzalari: 3D kesimda kulrang/oq modda ko'rinishi; Mielin/Nissl'ni preparatga yaqinlashtirish.
- **R4** mayda detal: mikro-relyef, tomir yaltirashi, pardalar yarim shaffof; telefonda FPS tekshiruvi.

**LG — Liquid Glass (foydalanuvchi talabi 2026-11-15):** butun UI haqiqiy Apple OS Liquid Glass'ga JUDA yaqin
bo'lsin. Namuna video: `/Users/apple/Desktop/Screen Recording 2026-11-15 at 18.54.53.mov` (tab bar: chetda sinish,
tanlov kapsulasi bosilganda shaffof linzaga aylanib barmoq ortidan sirg'aladi).
- **LG-1** ✅ boshqaruv elementlari: `src/ui/liquidGlass.ts` — `.glass.lens` elementlariga o'lchamiga mos SVG
  displacement filtri (`--lg-url`, faqat Chromium → `html.lg-on`; Safari/Firefox'da avvalgi xira shisha qoladi).
  `src/ui/useLens.ts` + `<span class="lens-blob">` — sirg'aluvchi tanlov kapsulasi (yuqori tablar, yon rels, pastki
  rejim tablari): bosilganda kattalashadi, sudralsa ergashadi, boshqa tab ustida qo'yib yuborilsa uni tanlaydi.
  Bosilish fizikasi: `scale` + `--lg-spring`. Uslublar `index.css` oxirida ("Liquid Glass II").
  Tekshiruv: `node scripts/shot-glass.mjs <papka> [--stripes] [--dpr 2]`.
  QOIDA: filtrlangan shisha ICHIDAGI elementga `backdrop-filter: url()` qo'ymang — tasvir ikkilanadi.
- Foydalanuvchi LG-1 ni ko'rib "o'ylaganimdek emas" dedi (chet yaltirashi sun'iy, shisha sezilmaydi, animatsiya
  hissi boshqacha) va interfeysni qayta qurishni so'radi. Kelishilgan reja (2026-11-15), tartib bilan:
  - **UI-1** ✅ tuzilish, iPad uslubi: tepada tab bar (`TabBar`: yon panel tugmasi, Atlas | O'rganish, qidiruv),
    chapda `Sidebar` (store `sidebar`, `na:sidebar`; Atlas'da tez tanlov/qatlamlar/tizimlar, O'rganish'da mavzular
    akkordeoni → darslar va kesimlar), o'ngda `ViewGroup` (ko'rinish menyusi, kesim, "boshqa" menyusi: aylanish,
    ranglar, til, atlas haqida), pastda bitta kontekstli tasma (`BottomBar`: Atlas'da Tarqatish/Chuqurlik + slayder
    + reset; O'rganish'da dars nuqtalari yoki kesim). Telefonda tab bar pastda, yon panel — pastki varaq.
    `SideRail`, `SystemsPanel`, gauge, rejim tablari olib tashlandi. `Mode` o'zgarmagan (`explode|peel|learn`).
    Menyular shisha guruhning BOLASI emas, qo'shnisi (ichma-ich shisha sahnani ko'rmaydi).
    Uslublar: `index.css` oxirida "Layout II"; `--free-x`/`--free-r` — panel ochiq bo'lsa markazni suradi.
  - **UI-2** ✅ yorug' rejim: store `theme` (`dark` standart; "boshqa" menyusida almashtirgich), `<html>`da `dark`
    sinfi + `data-theme`. CSS: `--ink` (qorada oq, yorug'da to'q) — barcha "N% oq" tuslar endi `var(--ink)`dan;
    tokenlar `index.css` oxirida "Themes" (`:root` = yorug', `.dark` = qora). `.dark` sinfi istalgan elementda
    ishlaydi → qora uchun chizilgan panellar yorug' rejimda "qora orol" bo'lib qoladi: HOZIRCHA dars kartasi
    (`.lesson-panel`) va kesim ko'ruvchisi (`.section-viewer`). Sahna: `BrainScene` `THEMES` (fon, zamin, hemi).
    QOLDI: dars kartasi va kesim ko'ruvchisini yorug' rejimga o'tkazish; sahna yorliqlari (qora kapsulalar).
    Tekshiruv: `node scripts/shot.mjs out.png --theme light`, `node scripts/shot-close.mjs out.png light|dark`.
  - **LG-2** material Figma bo'yicha qayta: fayl **falcon-anatomy** (`73v6ZFOiY8ccMLOkQfgjX2`, Figma MCP,
    `get_design_context` + `disableCodeConnect: true`). Figma shisha effektining o'zini kod qilib BERMAYDI
    ("Glass Effect" qatlami bo'sh) — faqat tana retsepti, soya, o'lcham va parametrlar (Refraction 70, Depth 30,
    Dispersion 20, Frost 6/16, Splay 20, Opacity 25). Ko'chirish kerak: chetda faqat ±1.25px yon chiziq + 0.5px
    kontur (yorqin pastki chiziq va konus halqa olib tashlanadi); neytral kulrang tana (plus-lighter/luminosity);
    tanlov — tekis to'ldirish; slayder tutqichi 38×24 kapsula, yo'l 6px; varaq tepa radiusi 34px, keng soya;
    "prominent" tugma — aksent to'ldirish. Fayldagi komponentlar faqat Light variantda.
    ✅ 2026-11-15 hoshiya qismi bajarildi: `.glass` = `--lg-fill` + `--lg-rim` + `--lg-drop`, `::before/::after` yo'q,
    tanlov kapsulasi tekis, rang ajralishi kichik (spread 0.03). Keyin foydalanuvchi "shaffofroq va bo'rtiq" so'radi:
    `--lg-fill` 8%, `--lg-dome` (ichki soyalar), chuqur bezel (20px), `--lg-through` (qorada orqa fonni xiralashtiradi —
    yozuv o'qilishi uchun). Slayder kit bo'yicha: yo'l 6px, tutqich 38×24 (`KNOB = 19`). QOLDI: varaq radiusi, katta panellar.
  - **LG-3** harakat: linza, sirg'alish, varaq ochilishi video kadrlari bilan yonma-yon sozlanadi.

**Kelajak imkoniyatlari — `PLAN.md` 5-bo'lim** (2026-11-15): 5.1 kesim sxemalarida chegaralar 100% tutashsin
(TALAB; **T2 ✅ 2026-11-16**, qolgan 21 plastinka kutmoqda), 5.2 Real tasvir + shtrix kontur, 5.3 g'oyalar (bakalavr → PhD), 5.4 UI qoldiqlari.
- **5.2 Real kesim** ✅ v1 (2026-11-16): kesim ko'ruvchisida 5-ko'rinish. BigBrain 100 mkm (CC BY-NC-SA 4.0,
  `data/raw/bigbrain/`, 1.1 GB gz + 8.7 GB ochilgan, gitignore). Zanjir: `node scripts/export-section-frames.mjs`
  (ilovaning o'z `atlasSlice()` ramkasi → `pipeline/section_frames.json`) → `pipeline/.venv/bin/python
  pipeline/tools/real_slices.py data/raw/bigbrain/full8_100um_2009b_sym.nii.gz` → `public/sections/real/*.webp`
  (17 ta, 452 KB, COMMIT QILINADI) + `src/data/sections/real.json`. Ko'rinish: `AtlasSliceView` `real` prop —
  tasvir + atlas chegaralari shtrix (400 mm² dan katta sohalar chizilmaydi), "Konturlar" tugmasi.
  Yo'q: U1 (hajm u darajaga yetmaydi), K3 va Mc (oyna >110 mm — bu oyna xatosi, alohida tuzatish kerak), T2 (kesim emas).
  **Sxema raqamlari ✅ (2026-11-16):** `SectionViewer` `marks` (sxema `part` → atlas qismi) → `AtlasSliceView` `placeMarks()`;
  bitta atlas sohasi bir necha sxema tuzilmasiga to'g'ri kelsa nishon hammasini yozadi ("4·22", "12·13 +4").
  **O'rta miya tekisliklari ✅ (2026-11-16):** O1 z −19, O2 −13, O3 −8 (avval −17/−9/−2 — nomidagi tuzilmalarni kesmasdi);
  `CUT_LAYERS.midbrain` ga Julich qo'shildi (SNc/SNr). QOIDA: `brainstemPlane(z)` uchun z meshlardan o'lchanadi
  (z bo'yicha sinab, bog'langan tuzilmalar kesim yuzasini sanang), darslik rasmidan emas. Tekislik o'zgarsa:
  `export-section-frames.mjs` → `real_slices.py` (3 s) qayta ishga tushiriladi.
  QOLDI: sxema↔real aralashtirish; MRI varianti; K3/Mc oynasi; miya ustunida nishon kam (U2 4) — `bstem`
  qatlamida 24 konsept, bu atlas chegarasi.
  `pipeline/.venv` qayta yaratildi (numpy, nibabel, scipy, pillow) — eski muhit diskda yo'q edi.

Keyin (foydalanuvchi tanlaydi): mavzu viktorinasi (kesim+dars birlashgan), BG-2 yo'llar sxemasi,
BG-3 kasallik simulyatori, BG-4 Alexander halqalari + DBS; A) kontent: Glasser 179, Destrieux 74,
Desikan 35, JHU 27; C) deploy (Draco + Release asset); D) yangi kesim darajalari.
Har birining batafsil tavsifi — `docs/HISTORY.md`.
