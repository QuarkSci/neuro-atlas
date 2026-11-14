# Neuro Atlas — Claude uchun qisqa qo'llanma

> Foydalanuvchi (MuhammadYusuf) o'zbekcha yozadi → javoblar o'zbekcha, kod izohlari inglizcha.
> To'liq tarix, bosqichlar tafsiloti, barcha tekshiruv skriptlari va xatolar ro'yxati:
> **`docs/HISTORY.md`** — kerak bo'lganda `grep` qiling, butunlay o'qimang.
> Bosqichlar jadvali va xavflar: `PLAN.md` 3–4-bo'limlar.

## Loyiha

Ochiq, bepul, ta'limiy 3D neyroanatomiya atlasi (1672 qism, 9 qatlam: gross
BodyParts3D, Julich, Brodmann, Desikan, Destrieux, Glasser, JHU, bstem Allen/AAN,
suit). Falcon Atlas (`../falcon-atlas`) davomi: Three.js `BrainScene` + zustand
(`useAtlas`, dev'da `__atlas`) + shadcn, Liquid Glass dizayn, faqat qora rejim.
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
- `src/ui/` — `SectionViewer`, `AtlasSliceView`, `LessonPanel`, `ViewControls`, `BottomBar` (`LearnDock`), Inspector.
- Rejimlar: `explode | peel | learn`. Yangi dars/kesim → tegishli mavzuga (`topics.ts`) yozilsin; yangi tab ochilmaydi.
- Pipeline vositalari: `pipeline/tools/slice_svg.py`, `landmarks.py` (`pipeline/.venv/bin/python`, repo ildizidan).

## Joriy holat (2026-11-14)

Tayyor: 0–4c bosqichlar, BG-1, 3 dars, O'rganish tabi, kontent 487 yozuv (🟡).

**Hozirgi yo'nalish — realizm (foydalanuvchi talabi 2026-11-14):** butun ko'rinishni iloji
boricha real qilish. Reja (har biri alohida sessiya va commit):
- **R1** yorug'lik/material: muhit yoritilishi, tone mapping, to'qima ranglari (kulrang/oq modda,
  arteriya/vena, nerv, suyak), nam yaltirash; PhD: "Real / Atlas rangi" almashtirgichi.
- **R2** chuqurlik: egatlarda ambient occlusion (vertexga pishirilgan yoki SSAO), yumshoq soyalar.
- **R3** kesim yuzalari: 3D kesimda kulrang/oq modda ko'rinishi; Mielin/Nissl'ni preparatga yaqinlashtirish.
- **R4** mayda detal: mikro-relyef, tomir yaltirashi, pardalar yarim shaffof; telefonda FPS tekshiruvi.

Keyin (foydalanuvchi tanlaydi): mavzu viktorinasi (kesim+dars birlashgan), BG-2 yo'llar sxemasi,
BG-3 kasallik simulyatori, BG-4 Alexander halqalari + DBS; A) kontent: Glasser 179, Destrieux 74,
Desikan 35, JHU 27; C) deploy (Draco + Release asset); D) yangi kesim darajalari.
Har birining batafsil tavsifi — `docs/HISTORY.md`.
