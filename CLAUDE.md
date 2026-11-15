# Neuro Atlas — Claude uchun qisqa qo'llanma

> Foydalanuvchi (MuhammadYusuf) o'zbekcha yozadi → javoblar o'zbekcha, kod izohlari inglizcha.
> To'liq tarix, bosqichlar tafsiloti, barcha tekshiruv skriptlari va xatolar ro'yxati:
> **`docs/HISTORY.md`** — kerak bo'lganda `grep` qiling, butunlay o'qimang.
> Bosqichlar jadvali va xavflar: `PLAN.md` 3–4-bo'limlar.

## Loyiha

Ochiq, bepul, ta'limiy 3D neyroanatomiya atlasi (1672 qism, 9 qatlam: gross
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
  `audit-sections.mjs --min 0.15`; ma'lumot butunligi skriptlari — `docs/HISTORY.md` 0-bo'lim.
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
  `sections/` (17+5 kesim, `structures-*.ts` lug'at), `lessons/` (3 dars), `content/*.json` (487 yozuv).
- `src/ui/` — `Header` (`TabBar`, `ViewGroup`, `Identity`), `Sidebar`, `BottomBar` (kontekstli tasma), `SectionViewer`,
  `AtlasSliceView`, `LessonPanel`, `ViewControls`, Inspector; `liquidGlass.ts`, `useLens.ts`.
- Rejimlar: `explode | peel | learn`. Yangi dars/kesim → tegishli mavzuga (`topics.ts`) yozilsin; yangi tab ochilmaydi.
- Pipeline vositalari: `pipeline/tools/slice_svg.py`, `landmarks.py` (`pipeline/.venv/bin/python`, repo ildizidan).

## Joriy holat (2026-11-15)

Tayyor: 0–4c bosqichlar, BG-1, 3 dars, O'rganish tabi, kontent 487 yozuv (🟡), **R1** (2026-11-14), **LG-1**, **UI-1**, **UI-2** (2026-11-15).

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

Keyin (foydalanuvchi tanlaydi): mavzu viktorinasi (kesim+dars birlashgan), BG-2 yo'llar sxemasi,
BG-3 kasallik simulyatori, BG-4 Alexander halqalari + DBS; A) kontent: Glasser 179, Destrieux 74,
Desikan 35, JHU 27; C) deploy (Draco + Release asset); D) yangi kesim darajalari.
Har birining batafsil tavsifi — `docs/HISTORY.md`.
