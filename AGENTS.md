# Neuro Atlas — agentlar uchun qoidalar (Antigravity / Gemini va boshqalar)

> Bu fayl ish maydonining umumiy qoidalari. Claude Code o'zining `CLAUDE.md` faylini o'qiydi — ikkalasi bir xil
> qoidalarni aytadi. **Vazifalar taqsimoti va kim nima ustida ishlayotgani: `docs/TASKS.md`** — ishni boshlashdan oldin
> o'qing va o'z vazifangizni "ishlanmoqda" deb belgilang.

## Loyiha

Ochiq, bepul, ta'limiy 3D neyroanatomiya atlasi: Vite + React + TypeScript, Three.js sahna (`src/scene/BrainScene.ts`),
zustand store (`src/store/useAtlas.ts`, dev'da `window.__atlas`), Liquid Glass UI, qora va yorug' rejim, o'zbek va ingliz tili.
1740 qism, 9 atlas qatlami (BodyParts3D, Julich-Brain, Brodmann, Desikan, Destrieux, Glasser, JHU, miya ustuni, miyacha),
22 kesim plastinkasi, shikastlanish simulyatori, AI panel (`src/ai/`).
Tamoyil: **"perfektlik vaqtdan ustun"** — screenshot yoki sonli audit bilan tekshirilmagan narsa "tayyor" emas.
Foydalanuvchi o'zbekcha yozadi → javoblar o'zbekcha, kod izohlari inglizcha.

## Qat'iy qoidalar

- **Litsenziya:** faqat ochiq manbalar. **CC BY-ND taqiq** (Brainstem Navigator, USC — rad etilgan); NC mumkin.
  Har qism / kontent yozuvining `sources` maydonida manba va litsenziya bo'lsin. Atlas yoki rasm yuklashdan oldin
  litsenziya sahifasini o'qing.
- **Manbalar haqiqiy bo'lsin:** DOI → Crossref API (`https://api.crossref.org/works/<doi>`) sarlavhasi bilan tekshiriladi;
  NCBI Bookshelf / PubMed → E-utilities (`esearch` / `esummary`), "HTTP 200 qaytdi" yetarli emas. Xotiradan manba yozmang.
- **Hech qachon commit qilinmaydi:** `data/raw/`, `public/meshes/` (196 MB, gitignore), `.env`, API kalitlari.
  Haqiqiy AI kalitlari kodga, testga yoki hujjatga yozilmaydi — AI tekshiruvi `mock` provayder bilan.
- **Three.js:** `clearcoat: 0`; `material.side` o'zgarsa `needsUpdate = true`; clip faol bo'lsa
  `raycaster.firstHitOnly = false`; `material.clippingPlanes` massivi qayta tayinlanmaydi.
- `src/data/levels.ts` → `index.ts` import qiladi; `index.ts` uni QAYTA EKSPORT QILMASIN (aylanma import).
- `uz` nomlarga "Chap/O'ng" yozilmaydi — `sidedName()` qo'shadi.
- **Formatlash:** `npx prettier --no-semi --single-quote --print-width 180 --write <fayllar>` (konfiguratsiyasiz ishlatmang,
  butun repo'ni qayta formatlamang — faqat o'zgartirgan fayllaringizni).
- Forma ichidagi `<button>` larga `type="button"` (aks holda forma yuboriladi).
- `pointermove` da katta komponent holatini o'zgartirmang (real kesim 369 ms qotishi shundan edi).
- Har yangi funksiya bilan PhD / neyroxirurg darajasidagi imkoniyat ham taklif qilinsin.

## Ish tartibi

- Dev server: `npm run dev` → http://localhost:3019 (3017 — boshqa loyiha).
- Tekshiruv (headless afzal):
  `node scripts/shot.mjs /tmp/x.png --lang uz --w 900 --h 560 --wait 13000 --setup "__atlas.getState().setView('lateral')"`;
  `node scripts/audit-lesions.mjs` (0 bo'lishi shart), `scripts/audit-pick.mjs`, `scripts/audit-sections.mjs --min 0.15`.
  Screenshotlar kichik (≈900×560), bosqichga 2–4 ta; qolgani sonli audit bilan.
- **Commit oldidan:** `npx tsc -p tsconfig.app.json --noEmit && npm run build && rm -rf dist`.
- **Commit xabari** o'zbekcha, batafsil: nima va NEGA, qanday tekshirildi. Git akkaunt — **QuarkSci** (GitHub: QuarkSci/neuro-atlas).
- **Ikki agent bir repoda:** Antigravity o'z vazifasini **alohida branchda** qiladi (`ag/<vazifa-id>`, masalan `ag/AG-1`),
  `master`ga to'g'ridan-to'g'ri push qilmaydi. Tugagach — `docs/TASKS.md` da holatni yangilang va foydalanuvchiga
  (yoki PR orqali) birlashtirish uchun bering. Claude `master`da ishlaydi va boshida birlashtirilmagan `ag/*` branchlarni tekshiradi.
- **Fayl egaligi:** `docs/TASKS.md` dagi har vazifada "Tegadigan fayllar" ro'yxati bor — faqat ularni o'zgartiring.
  `src/index.css` umumiy: faqat o'z bo'limingizni oxiriga qo'shing yoki vazifada ko'rsatilgan bloklarni o'zgartiring,
  faylni qayta tartiblamang.
- Bosqich oxirida tafsilot `docs/HISTORY.md` ga (o'z bo'limi, vazifa id bilan), qisqa holat `docs/TASKS.md` ga.

## Kod xaritasi (qisqa)

- `src/scene/` — `BrainScene.ts` (sahna, kesimlar, darslar), `loader.ts` (MNI→sahna `(−x, z, y)`), `materials.ts`, `atlasSlice.ts`.
- `src/data/` — `parts.json` (`pipeline/build_catalogue.py` hosil qiladi), `index.ts`, `content/*.json` (ta'riflar + manbalar),
  `sections/` (plastinkalar, `structures-*.ts`), `lessons/`, `pathways.ts`, `lesions.ts`, `topics.ts`, `search.ts`.
- `src/ui/` — `Header`, `Sidebar`, `BottomBar`, `SectionViewer` (+ `LesionPanel`, `McDonaldPanel`, `AtlasSliceView`, `ZoomPane`),
  `LessonPanel`, `Inspector`, `AIPanel`.
- `src/ai/` — AI panel: provayderlar, kontekst, tool'lar (hozircha Claude egaligida).
- To'liq tarix va har bosqich tafsiloti: `docs/HISTORY.md` (kerak bo'lganda qidiring, butunlay o'qimang). Reja: `PLAN.md`.
