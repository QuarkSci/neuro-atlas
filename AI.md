# AI.md — Neuro Atlas: ikki agent uchun yagona ish hujjati

> **Kim o'qiydi:** Claude Code (Anthropic) va Antigravity (Google). Bu fayl — loyihaning yagona "boshqaruv paneli":
> holat, qoidalar, kim nima qiladi, qanday topshiriladi va tasdiqlanadi.
> Yangilangan: **2026-11-22**. Oxirgi `master` commit (shu fayl yozilganda): `6813487` + shu fayl commiti.
>
> **O'qish tartibi**
> - **Antigravity:** 0 → 1 → 2 → 3 → 4 → **5 (siz uchun)** → 7 (kod xaritasi, kerakli joyini) → 9 (taxta).
> - **Claude:** 0 → 1 → 2 → 3 → 4 → **6 (siz uchun)** → 7 → 8 → 9.
> - Boshqa hujjatlar faqat kerak bo'lganda: `CLAUDE.md` (Claude'ning qisqa qo'llanmasi), `docs/HISTORY.md` (har bosqich
>   tafsiloti — `grep` qiling, butunlay o'qimang), `PLAN.md` (bosqichlar jadvali, xavflar, 5-bo'lim g'oyalar).
>   `AGENTS.md` va `docs/TASKS.md` shu faylga yo'naltiradi.

---

## 0. Ishni boshlash (foydalanuvchi uchun tayyor promptlar)

**Antigravity'ga (yangi chat):**
```
Neuro Atlas loyihasi. /Users/apple/Documents/Loyihalar/neuro-atlas/AI.md faylini to'liq o'qi (0–5, 7, 9-bo'limlar).
Sen — Antigravity, "bajaruvchi" agentsan. 5.1-bo'limdagi bir martalik sozlashni bajar (alohida worktree, port 3020),
so'ng 9-bo'limdagi taxtadan birinchi ⏳ AG vazifani ol va 5-bo'limdagi tartib bilan bajar. master'ga hech narsa
yozma, faqat o'z ag/<id> branchingda ishla. Tugagach docs/handoff/<id>.md yoz, branchni push qil va menga qisqa xulosa ber.
Javoblar o'zbekcha.
```

**Claude Code'ga (yangi chat):**
```
Neuro Atlas loyihasi. AI.md ni o'qi (0–4, 6–9-bo'limlar). Sen — Claude, "tekshiruvchi va integrator"san.
Avval 6.1 dagi sessiya boshi ro'yxatini bajar: Antigravity tayyorlagan ag/* branchlar bormi — bo'lsa 6.2 bo'yicha
tekshir (diff, tsc, build, auditlar, screenshot, manbalar) va menga natijani ayt; men rozi bo'lsam master'ga birlashtir.
Keyin 9-bo'limdagi navbatdagi CL vazifani (CL-1 dan) davom ettir. Javoblar o'zbekcha.
```

**Jarrohlik simulyatori (sx/main) uchun alohida promptlar:** `docs/SURGERY.md` 4-bo'lim (CC: SX vazifa, AGY: jarrohlik
vazifalari, CC: integrator). Simulyator kodi master'ga birlashtirilmaydi.

---

## 1. Loyiha va joriy holat

**Neuro Atlas** — ochiq, bepul, ta'limiy 3D neyroanatomiya atlasi (talabadan PhD/neyroxirurggacha).
Vite + React 19 + TypeScript, Three.js sahna, zustand store, Tailwind + o'z CSS (Liquid Glass dizayn), qora va yorug'
rejim, o'zbek va ingliz tili. GitHub: **QuarkSci/neuro-atlas** (GitHub Pages'ga `master`dan avtomatik deploy).
Foydalanuvchi — **MuhammadYusuf**, o'zbekcha yozadi → javoblar o'zbekcha, kod izohlari inglizcha.
Tamoyil: **"perfektlik vaqtdan ustun"** — screenshot yoki sonli audit bilan tekshirilmagan narsa "tayyor" emas.

**Nima bor (tayyor):**
- 3D atlas: 1740 qism (68 ko'zgulangan tomir bilan), 9 qatlam — BodyParts3D (makroskopik, 447), Julich-Brain (414),
  Brodmann (82), Desikan (70), Destrieux (148), Glasser (360), JHU oq modda (48), miya ustuni Allen/AAN (38), miyacha SUIT (32).
  Tarqatish / chuqurlik rejimlari, 3 tekislikda kesish, qidiruv (uz/en/lat), Inspector kartasi (ta'rif + manbalar).
- O'rganish tabi: 7 mavzu, 3D qadamma-qadam darslar (qorinchalar, qadoqsimon tana, limbik) + 4 yo'l darsi.
- 22 kesim plastinkasi (uzunchoq miya U1–U4, ko'prik K1–K3, o'rta miya O1–O3, talamus T1–T2, gipotalamus G1–G4,
  bazal yadrolar B1–B5, miyacha Mc): sxema, mielin/Nissl uslubi, atlas kesimi (MNI), real BigBrain gistologiyasi; zoom.
- Yo'llar (CST, DCML, ALS, trigeminotalamik) plastinkalar va 3D da; **shikastlanish simulyatori**: klassik hudud
  o'choqlari, erkin (nuqtali) o'choqlar, bir nechta o'choq, kalla nervi belgilari, teskari rejim (belgilar → o'choq),
  3D da o'choq darslari (Waller degeneratsiyasi), tarqoq skleroz uchun vaqt o'qi va McDonald 2017/2024, real kesim
  va atlas ko'rinishida o'choq qo'yish.
- **AI panel** (AI-1…AI-5): OpenRouter bilan kirish (PKCE) yoki o'z kaliti (Anthropic, OpenAI, Google) yoki lokal model;
  kontekst (ekrandagi holat), 15 tool (AI ilovani boshqaradi), rasm yuborish, 4 rejim (repetitor, Sokratik, klinik keys,
  tadqiqot — PubMed/Crossref, uydirma havola ogohlantirishi, Anki eksport).

**Ochiq muammo:** yo'q. (Gemini: sabab Google tomonidagi 503 "high demand" — bepul tarif; panel endi xatoni to'liq ko'rsatadi va band modeldan boshqasiga o'tadi.)

**Hozirgi yo'nalishlar:** realizm (R2–R4), Liquid Glass (LG-3), kontent to'ldirish, deploy, plastinka chegaralari (5.1).

---

## 2. Qat'iy qoidalar (ikkala agent uchun)

1. **Litsenziya:** faqat ochiq manbalar. **CC BY-ND taqiqlangan** (Brainstem Navigator, USC rad etilgan); NC mumkin.
   Har qism / kontent yozuvida `sources` (manba + havola). Atlas, rasm yoki ma'lumot yuklashdan oldin litsenziya sahifasini o'qing.
2. **Manbalar haqiqiy bo'lsin.** DOI → Crossref API'da sarlavhasi tekshiriladi (`https://api.crossref.org/works/<doi>`);
   PubMed / NCBI Bookshelf → E-utilities (`esearch` / `esummary`). "HTTP 200 qaytdi" yetarli emas. Xotiradan manba yozilmaydi.
3. **Hech qachon commit qilinmaydi:** `data/raw/` (9.3 GB), `public/meshes/` (199 MB), `node_modules/`, `.env`, API kalitlari,
   `dist/`. Haqiqiy AI kalitlari kodga, testga, hujjatga, commit xabariga yozilmaydi — AI tekshiruvi `mock` provayder bilan.
4. **Three.js:** `clearcoat: 0`; `material.side` o'zgarsa `needsUpdate = true`; clip faol bo'lsa `raycaster.firstHitOnly = false`;
   `material.clippingPlanes` massivi qayta tayinlanmaydi.
5. `src/data/levels.ts` → `index.ts` import qiladi; `index.ts` uni **qayta eksport qilmaydi** (aylanma import).
6. `uz` nomlarga "Chap/O'ng" yozilmaydi — `sidedName()` qo'shadi.
7. **Prettier** faqat shunday, faqat o'zgartirgan fayllaringizga:
   `npx prettier --no-semi --single-quote --print-width 180 --write <fayllar>`. Butun repo qayta formatlanmaydi.
8. Forma ichidagi `<button>` larga `type="button"`. `pointermove` da katta komponent holati o'zgartirilmaydi (qotish).
9. Python patch skriptlari faylga yoziladi; bitta faylni bir vaqtda 'w' bilan ochib o'qimang.
10. Har yangi funksiya bilan PhD / neyroxirurg darajasidagi imkoniyat ham taklif qilinsin (foydalanuvchi talabi).
11. **Faqat o'z vazifangiz fayllari.** Vazifada ko'rsatilmagan faylni o'zgartirish kerak bo'lsa — to'xtang va handoff'da yozing.

---

## 3. Muhit va buyruqlar

- Asosiy nusxa: `/Users/apple/Documents/Loyihalar/neuro-atlas` (Claude, `master`, port **3019**).
- Antigravity nusxasi: `/Users/apple/Documents/Loyihalar/neuro-atlas-ag` (git worktree, `ag/*` branchlar, port **3020**) — 5.1.
- Dev server: `npm run dev` (3019) yoki `npm run dev -- --port 3020 --strictPort` (Antigravity).
- Barcha tekshiruv skriptlari `NA_URL` o'zgaruvchisini o'qiydi (standart `http://localhost:3019/`):
  - Screenshot: `NA_URL=http://localhost:3020/ node scripts/shot.mjs /tmp/x.png --lang uz --w 900 --h 560 --wait 13000 --setup "<JS>"`
    (`--theme light|dark`, `--setup` sahifada bajariladi: `__atlas.getState()...`). Plastinkalar: `scripts/shot-sections.mjs`,
    darslar: `shot-lessons.mjs`, yaqindan: `shot-close.mjs out.png light|dark`, shisha: `shot-glass.mjs`.
  - Auditlar (0 bo'lishi shart): `node scripts/audit-lesions.mjs`, `node scripts/audit-pick.mjs` (diff 0),
    `node scripts/audit-sections.mjs --min 0.15`. Tezlik: `node scripts/perf-real.mjs`.
- **Commit oldidan har doim:** `npx tsc -p tsconfig.app.json --noEmit && npm run build && rm -rf dist`.
- Screenshotlar kichik (≈900×560), bosqichga 2–4 ta; qolganini sonli audit bilan (token tejash).
- TS mantiqni tez sinash: vaqtinchalik `scripts/_x_tmp.mjs` (puppeteer) — dev serverdan `await import('/src/...ts')`, keyin faylni o'chiring.
- Dev'da global ilgaklar: `window.__atlas` (store), `window.__ai` (AI store), `window.__scene` (BrainScene), `window.__atlasSlice`.
- Commit xabari **o'zbekcha, batafsil**: nima, NEGA, qanday tekshirildi. Git akkaunt: **QuarkSci**.
  Har agent o'z `Co-Authored-By:` qatorini qo'shadi (o'z vositasi aytgan).

---

## 4. Hamkorlik protokoli (rollar, branchlar, tasdiqlash)

**Rollar.**
- **Antigravity — bajaruvchi.** Aniq belgilangan, mustaqil vazifalarni tez va arzon bajaradi (kontent, CSS, deploy, tadqiqot).
  Ish natijasi **taklif** hisoblanadi: `ag/<id>` branchda turadi, saytda ishlamaydi.
- **Claude — tekshiruvchi va integrator.** Antigravity ishini tekshiradi (6.2), foydalanuvchi rozi bo'lsa `master`ga
  birlashtiradi — **shundan keyingina kod "faol"** (GitHub Pages `master`dan deploy qiladi). Murakkab/arxitektura vazifalarini
  (CL-*) o'zi bajaradi.

**Qoidalar.**
1. Antigravity `master`ga hech qachon commit yoki push qilmaydi; faqat o'z worktree'sida, har vazifa alohida branch:
   `ag/AG-1`, `ag/AG-2`, … (har biri `origin/master`dan boshlanadi).
2. **Fayl egaligi:** har vazifa faqat o'zining "Tegadigan fayllar" ro'yxatini o'zgartiradi. Claude ochiq AG vazifasining
   fayllariga tegmaydi (va aksincha). Umumiy fayl `src/index.css`: faqat ko'rsatilgan bloklar yoki oxiriga o'z bo'limingiz
   (`/* AG-2: ... */` sarlavha bilan); qayta tartiblash yo'q.
3. **Holat taxtasi (9-bo'lim) ni faqat Claude yangilaydi** (`master`da). Antigravity buning o'rniga topshiriq yozadi:
   `docs/handoff/<id>.md` (shablon 5.3) — shunda AI.md da birlashtirish to'qnashuvi bo'lmaydi.
4. Antigravity tugagach: handoff yozadi → commit → `git push -u origin ag/<id>` → foydalanuvchiga xabar.
5. Claude sessiya boshida `ag/*` branchlarni ko'radi, tekshiradi (6.2), natijani foydalanuvchiga aytadi; rozilik bo'lsa
   `git merge --no-ff` bilan birlashtiradi va taxtada ✅ qo'yadi. Rad etilsa — sabab va aniq tuzatishlar
   `docs/handoff/<id>.md` ning "Ko'rib chiqish" bo'limiga yoziladi, taxtada 🔧.
6. Vazifa noaniq bo'lsa yoki boshqa vazifa fayllariga tegish kerak bo'lsa — to'xtab, handoff'da savol yozing (taxmin qilmang).

---

## 5. ANTIGRAVITY UCHUN

### 5.1 Bir martalik sozlash (alohida nusxa — Claude bilan to'qnashmaslik uchun)

Ikkalangiz bitta papkada ishlasangiz, branch almashtirish Claude'ning ishini buzadi. Shuning uchun **git worktree**:
```bash
cd /Users/apple/Documents/Loyihalar/neuro-atlas
git fetch origin
git worktree add ../neuro-atlas-ag -b ag/AG-1 origin/master     # birinchi vazifa branchi bilan
cd ../neuro-atlas-ag
npm ci                                                           # o'z paketlari (~330 MB; umumiy .vite keshi to'qnashmasin)
ln -s ../../neuro-atlas/public/meshes public/meshes              # 3D meshlar (gitignore'da, 199 MB) — faqat havola
npm run dev -- --port 3020 --strictPort                          # o'z dev serveringiz
NA_URL=http://localhost:3020/ node scripts/audit-lesions.mjs     # "mismatches: 0" chiqishi kerak
```
Keyingi vazifalar (oldingisi commit qilingach): `git switch -c ag/AG-2 origin/master` (avval `git fetch origin`).
Antigravity'da ish maydoni sifatida **`neuro-atlas-ag`** papkasini oching. Asosiy `neuro-atlas` papkaga yozmang.

### 5.2 Har vazifa uchun ish tartibi

1. 9-bo'lim taxtasidan birinchi ⏳ AG vazifani oling; 5.4 dagi tavsifini to'liq o'qing.
2. Faqat vazifaga kerakli fayllarni o'qing (7-bo'lim xaritasi yordam beradi) — token tejang.
3. Bajaring → prettier (faqat o'z fayllaringiz) → `npx tsc -p tsconfig.app.json --noEmit && npm run build && rm -rf dist`
   → vazifadagi auditlar va screenshotlar (`NA_URL=http://localhost:3020/`). Screenshotlarni `docs/handoff/<id>/` ga
   saqlang (PNG, ≈900×560, 2–4 ta) — Claude ularni ko'radi.
4. `docs/handoff/<id>.md` yozing (5.3), commit (o'zbekcha, batafsil), `git push -u origin ag/<id>`.
5. Foydalanuvchiga qisqa xulosa: nima qilindi, qanday tekshirildi, nima qoldi.

### 5.3 Handoff shabloni — `docs/handoff/<id>.md`

```markdown
# <id> — <vazifa nomi>
Branch: ag/<id> · Commitlar: <hash> … · Sana: <YYYY-MM-DD>

## Nima qilindi
- ...
## O'zgargan fayllar (hammasi vazifa ro'yxatida bo'lishi shart)
- ...
## Tekshiruv
- tsc ✅/❌, build ✅/❌, audit-lesions: 0, audit-pick: diff 0, ...
- Screenshotlar: docs/handoff/<id>/*.png (nima ko'rsatadi)
- Manbalar: tekshirilgan DOI'lar ro'yxati (Crossref sarlavhasi bilan)
## Ochiq savollar / qolgan ishlar
- ...
## Ko'rib chiqish (Claude to'ldiradi)
```

### 5.4 Antigravity vazifalari

#### AG-1 — Kontent: parcellation qatlamlari ta'riflari
**Nega:** Inspector kartasida Desikan (70 qism), JHU (48), Destrieux (148), Glasser (360) qismlarining ko'pchiligida o'z
matni yo'q (oila matni meros qilinadi yoki bo'sh). Mavjud yozuvlar: `src/data/content/*.json` — 487 ta.
**Tartib (har biri alohida commit):** Desikan (~35 konsept) → JHU (~27) → Destrieux (~74) → Glasser (~179).
Konsept = chap+o'ng jufti; id'lar `src/data/parts.json` dagi `concept` maydonidan (`layer` bo'yicha filtrlang).
**Yozuv shakli** (`src/data/content/brodmann.json` kabi):
```json
"<concept-id>": {
  "la": "lotincha nomi (bo'lsa)",
  "uz": "o'zbekcha nomi, Chap/O'ng SIZ",
  "description": { "en": "...", "uz": "..." },
  "role": { "en": "...", "uz": "..." },
  "clinical": { "en": "...", "uz": "..." },
  "sources": [{ "title": "Muallif yil, jurnal — sarlavha", "url": "https://doi.org/..." }]
}
```
- Yangi fayllar `src/data/content/{desikan,jhu,destrieux,glasser}.json`; `src/data/content/index.ts` dagi importlar va
  `FILES` ro'yxatiga qo'shing (boshqa narsaga tegmang).
- Matn birinchi marta ko'rayotgan talaba uchun, qisqa va aniq; `clinical` — klassik klinik bog'lanish bo'lsa.
- O'zbekcha atamalar mavjud yozuvlar uslubida (`gross-brain.json`). "Chap/O'ng" yozilmaydi.
- Manbalar (Crossref bilan tasdiqlangan): Desikan 2006 `10.1016/j.neuroimage.2006.01.021`; Destrieux 2010
  `10.1016/j.neuroimage.2010.06.010`; Glasser 2016 `10.1038/nature18933`. JHU (Mori / Oishi) DOI'sini o'zingiz Crossref'da
  tekshiring. Ochiq darsliklar (NCBI Bookshelf) mumkin — eutils bilan tekshirib.
**Tegadigan fayllar:** `src/data/content/{desikan,jhu,destrieux,glasser}.json` (yangi), `src/data/content/index.ts`
(faqat import va `FILES`), `docs/handoff/AG-1.md`, `docs/handoff/AG-1/*.png`.
**Tayyor mezoni:** har konsept id `parts.json`da bor (kichik skript bilan: noma'lum id = 0 — natijani handoff'ga yozing);
JSON yaroqli; tsc + build; 2 screenshot (Inspector kartasi uz va en — masalan Desikan qatlamida superior frontal tanlangan:
`--setup "const a=__atlas.getState(); a.setLayers(['desikan']); ..."`); tekshirilgan DOI ro'yxati.

#### AG-2 — Yorug' rejim: dars kartasi va kesim ko'ruvchisi
**Nega:** yorug' rejimda (`theme: 'light'`) ikki panel hali qora — "qora orol": dars kartasi `.lesson-panel` va kesim
ko'ruvchisi `.section-viewer` (ularga `.dark` sinfi yoki qora uchun yozilgan `rgba(255,255,255,…)`, `#fff` ranglar berilgan).
Tokenlar `src/index.css` oxiridagi "Themes" bo'limida: `--ink` (qorada oq, yorug'da to'q), `--foreground`, `--background`,
`--fa-muted`, `--fa-fill`. Namuna: Inspector (`.inspector.glass`) va AI panel (`.ai-panel`) tokenlar bilan to'g'ri ishlaydi.
**Qilish:** qattiq oq/qora ranglarni tokenlarga (`color-mix(in oklab, var(--ink) N%, transparent)`) o'tkazish, `.dark`
majburlashni olib tashlash. Plastinka figurasi (SVG) foni qorong'i qolishi mumkin — figura uchun qora maydon maqbul,
panelning o'zi yorug' bo'lsin. Sahna yorliqlari (qora kapsulalar) — ixtiyoriy.
**Tegadigan fayllar:** `src/index.css` (faqat `.lesson-*`, `.section-viewer`, `.sv-*`, `.lz-*`, `.mc-*`, `.as-*` bloklari),
`src/ui/LessonPanel.tsx`, `src/ui/SectionViewer.tsx`, `src/ui/LesionPanel.tsx`, `src/ui/McDonaldPanel.tsx`,
`src/ui/AtlasSliceView.tsx` — **faqat `className` va inline ranglar**, mantiqqa tegmang. **Tegmang:** `src/ai/**`, `src/ui/AIPanel.tsx`.
**Tayyor mezoni:** 4 screenshot — dars ochiq va plastinka ochiq, `--theme light` va `--theme dark` (qorong'i avvalgidek
qolishi shart). Masalan: `--setup "__atlas.getState().openSection('pons-isthmus')"` va
`--setup "__atlas.getState().setLesson('ventricles')"`; `audit-lesions` 0; tsc + build.

#### AG-3 — Deploy: meshlar, Draco, README, ATTRIBUTION
**Nega:** `.github/workflows/deploy.yml` saytni GitHub Pages'ga quradi, lekin `public/meshes/` gitignore'da — saytda 3D
modellar yo'q. Reja (PLAN 4-bo'lim): meshlarni Draco bilan siqish, GitHub Release asset sifatida joylash, ilova ularni o'sha
URL'dan yuklaydi (Pages 1 GB limiti).
**Qilish:** (1) meshlarni Draco'ga o'tkazish skripti (yangi: `scripts/draco-meshes.mjs` yoki `pipeline/tools/draco_meshes.py`)
va hajm jadvali (oldin/keyin); (2) `src/scene/loader.ts` da meshlar bazaviy URL'i `import.meta.env.VITE_MESH_BASE`
(standart — hozirgi mahalliy `/meshes/`) va Three.js `DRACOLoader` (dekoder fayllari `public/draco/` ga; CDN'siz);
(3) Release'ga yuklash yo'riqnomasi yoki workflow qadami; (4) `README.md` (o'zbekcha + inglizcha) va yangi `ATTRIBUTION.md`
— har atlas: manba, litsenziya, havola (`src/data/index.ts` dagi `LAYERS` va `pipeline/README.md` dan).
**Tegadigan fayllar:** yangi skript, `src/scene/loader.ts` (faqat URL va dekoder), `public/draco/*`,
`.github/workflows/deploy.yml`, `README.md`, `ATTRIBUTION.md`, `vite.config.ts` (kerak bo'lsa).
**Tegmang:** `public/meshes/` ni commit qilmang; `BrainScene.ts`.
**Tayyor mezoni:** dev (siqilmagan) o'zgarishsiz ishlaydi — screenshot; Draco bilan `npm run build && npm run preview`
da modellar yuklanadi — screenshot; hajm jadvali; `audit-pick.mjs` diff 0.

#### AG-4 — Tadqiqot (faqat hujjat, kod yo'q)
1. **U1 plastinkasi** (piramidalar kesishmasi) uchun real kesim yo'q — BigBrain hajmi u darajaga yetmaydi. Ochiq litsenziyali
   (CC BY-ND emas!) gistologik kesim manbalarini toping: manba, litsenziya (sahifadan iqtibos), aniqlik, MNI ga moslash imkoni.
2. **BigBrain 20 mkm plitkalar** (zoomda yuklanadigan): manzil, format, hajm, litsenziya (hozirgisi 100 mkm, CC BY-NC-SA 4.0),
   brauzerda plitka sifatida berish yo'li.
**Tegadigan fayllar:** `docs/research/u1-histology.md`, `docs/research/bigbrain-20um.md`, `docs/handoff/AG-4.md`.
**Tayyor mezoni:** har havola ochib tekshirilgan, litsenziya sahifasidan iqtibos bilan; aniq tavsiya va xavflar.

#### AG-5 — Kontent: viktorina savollar banki (CL-4 uchun xom ashyo, kod yo'q)
**Nega:** CL-4 (mavzu viktorinasi + Anki) dvigatelini Claude yozadi; savollarni esa Antigravity tayyorlaydi — fayllar umuman
kesishmaydi, shuning uchun parallel ishlash mumkin.
**Qilish:** 8 mavzu (`src/data/topics.ts`: ventricles, callosum, limbic, basal-ganglia, diencephalon, pathways, brainstem,
cerebellum) × ≥25 savol, 3 daraja (`student` / `resident` / `expert`; taxminan 40/40/20%). Faqat yangi fayllar:
`src/data/quiz/<topic-id>.json` — massiv, har element:
```json
{ "id": "q-basal-ganglia-001", "level": "student", "topic": "basal-ganglia", "type": "mcq",
  "q": { "en": "...", "uz": "..." },
  "options": [ { "en": "...", "uz": "..." }, "... jami 4 ta" ],
  "answer": 0,
  "why": { "en": "...", "uz": "..." },
  "refs": ["<concept-id yoki plastinka tuzilma id>"],
  "plate": "bg-subthalamic",
  "sources": [ { "title": "Muallif yil, jurnal — sarlavha", "url": "https://doi.org/..." } ] }
```
- `answer` — to'g'ri variant indeksi; variantlar tartibini Claude tasodifiy aralashtiradi. `plate` ixtiyoriy (savol qaysi
  plastinkaga bog'liq bo'lsa — `src/data/sections/*.ts` dagi id).
- Javoblar faqat `src/data/content/*.json` va `src/data/lesions.ts` / `pathways.ts` dagi ma'lumotga mos; yangi fakt kerak bo'lsa —
  `sources` bilan (Crossref / eutils tekshiruvi, 2-bo'lim). `uz` da "Chap/O'ng" yozilmaydi.
- `expert` daraja: klinik-lokalizatsiya keyslari ("quyidagi belgilar — qaysi daraja/hudud?"), `lesions.ts` simulyatori bilan mos.
- Yomon variantlar ishonarli (bir tizimdagi qo'shni tuzilmalar), "yuqoridagilarning barchasi" yo'q.
**Tegadigan fayllar:** `src/data/quiz/*.json` (yangi), `docs/handoff/AG-5.md`. **Tegmang:** `src/data/index.ts`, `topics.ts`, har qanday `.ts/.tsx`.
**Tayyor mezoni:** kichik skript bilan: JSON yaroqli, `refs` dagi id'lar `parts.json` / `STRUCTURE_BY_ID` / `CONCEPTS` da bor
(noma'lum = 0), har savolda 4 variant va `answer` 0–3, takroriy `id` yo'q; 5 ta tasodifiy savolning javobi qo'lda manbadan tekshirilgan.

#### AG-6 — Tadqiqot: App Store muvofiqligi (faqat hujjat, kod yo'q)
**Nega:** Apple ilovasi (`docs/APPLE.md`) bepul tarqatiladi, lekin ma'lumotlarning bir qismi tijoratsiz/maxsus shartlarda.
**Qilish:** `docs/research/app-store.md`: (1) har qatlam litsenziyasi (`src/data/index.ts` `LAYERS` + BigBrain) — App Store'da
bepul ilova ichida qayta tarqatishga ruxsat bormi, attribution talabi; HCP Open Access Data Use Terms va FSL (JHU) matnidan iqtibos;
(2) App Review Guidelines 4.2, 2.5.2, 5.1.2 (uchinchi tomon AI'ga ma'lumot), 1.4.1 — joriy matndan iqtibos va bizga ta'siri;
(3) WKWebView'da WebGL xotira chegarasi iPad'da (Apple/WebKit manbalari). Har havola ochib tekshirilgan, sana bilan.
**Tegadigan fayllar:** `docs/research/app-store.md`, `docs/handoff/AG-6.md`.

#### AG-7 — Pipeline: AR uchun USDZ eksport (Apple 2-bosqichi; hozir emas)
GLB meshlardan tizim bo'yicha USDZ (`pipeline/tools/`), ≤150k uchburchak, ranglar `materials.ts` REAL presetidan. AG-3 dan keyin.

> **AG-8…AG-10 — neyroxirurgik simulyator yo'nalishi (PLAN 5.8, `docs/HANDS.md`).** Kod `hands/HT-1` branchida saqlangan va
> master'ga qo'shilmagan. Bu uch vazifa — faqat hujjat. `src/` ga ham, `hands/HT-1` branchiga ham tegmang.

#### AG-11 — Pipeline: operatsiya xonasi assetlari (AG-10 dan keyin; natija sx/main ga)
**Nega:** SX-1 protsedurali xonani real assetlar bilan almashtiradi.
**Qilish:** AG-10 ro'yxatidan tavsiya etilgan (faqat CC0 / CC BY) assetlarni yuklab olish, `pipeline/tools/or_assets.py` bilan
glb + Draco ga o'tkazish (millimetr masshtab, Y yuqoriga, ≤ 20 MB jami, har biri ≤ 150k uchburchak) → `public/or/*.glb` +
`public/or/manifest.json` (id, fayl, litsenziya, muallif, manba URL, o'lcham). `ATTRIBUTION.md` ga bo'lim. Branch
**`origin/sx/main` dan** boshlanadi (`git switch -c ag/AG-11 origin/sx/main`); `src/` ga tegmang. Claude uni faqat `sx/main` ga birlashtiradi.
**Tegadigan fayllar:** `pipeline/tools/or_assets.py`, `public/or/*`, `ATTRIBUTION.md`, `docs/handoff/AG-11.md`.

#### AG-12 — Tadqiqot: simulyator validatsiyasi va mahorat o'lchovlari (faqat hujjat)
**Nega:** SX-3/SX-6 baholash tizimi (vaqt, titrash, yo'l samaradorligi, xavfli tegishlar) ilmiy asosga ega bo'lsin (PhD daraja).
**Qilish:** `docs/research/sim-metrics.md`: neyroxirurgik simulyatorlar (NeuroVR/NeuroTouch, ImmersiveTouch, Wraith-VR va b.)
validatsiya tadqiqotlari; qaysi o'lchovlar mutaxassis va novichokni ajratadi (konstrukt validligi), titrash va yo'l samaradorligini
hisoblash formulalari, OSATS va GRS shkalalari, o'rganish egri chizig'i modellari, EVD/ventrikulostomiya simulyatori tadqiqotlari.
Har maqola: DOI (Crossref sarlavhasi tekshirilgan) yoki PMID (eutils), ochiq yoki ochiq emasligi. Bizga tavsiya: SX-3 uchun 6–10 ta
o'lchov, formulasi va chegaralari bilan.
**Tegadigan fayllar:** `docs/research/sim-metrics.md`, `docs/handoff/AG-12.md`.

#### AG-13 — Tadqiqot: kamera orqali marker kuzatuvi (SX-5 uchun; faqat hujjat)
**Nega:** chop etilgan marker yopishtirilgan qalam = shlemsiz 6DoF jarrohlik asbobi.
**Qilish:** `docs/research/marker-tracking.md`: brauzer kutubxonalari (js-aruco2, AprilTag WASM portlari, OpenCV.js aruco va b.):
litsenziya (CC BY-ND/GPL ehtiyotkorligi; MIT/BSD/Apache afzal), hajm, tezlik, 6DoF pose aniqligi; bitta veb-kamera bilan kalibrlash
(katakli qog'oz), qalam uchi offsetini kalibrlash; adabiyot (masalan, DodecaPen, UIST 2017) — DOI tekshirilgan. Tavsiya: bitta
kutubxona + marker shakli (kub yoki dodekaedr) + chop etiladigan fayl spetsifikatsiyasi (o'lcham mm).
**Tegadigan fayllar:** `docs/research/marker-tracking.md`, `docs/handoff/AG-13.md`.

#### AG-8 — Tadqiqot: kamera funksiyalari qaysi platformada (faqat hujjat, kod yo'q)
**Nega:** foydalanuvchi qo'l va bosh bilan boshqarishni (HT-1, HP-1) umumiy vebga qo'shish yoki faqat Mac/iPad ilovasiga
qoldirishni hal qilishi kerak (`docs/HANDS.md` 4-bo'lim, A/B/C variantlar).
**Qilish:** `docs/research/camera-platforms.md`:
(1) macOS Vision framework: `VNDetectHumanHandPoseRequest`, yuz nuqtalari — aniqlik, kechikish, minimal macOS versiyasi. MediaPipe
veb bilan solishtiring (Apple Developer hujjatlari, WWDC sessiyasi havolasi bilan);
(2) iPadOS: ARKit face tracking. Qaysi iPad'larda TrueDepth bor (ro'yxat). U "3D oyna" uchun haqiqiy chuqurlik beradimi?
Apple Pencil (hover, barrel roll, bosim) jarrohlik asbobi sifatida;
(3) WKWebView'da `getUserMedia`: iOS/macOS versiyalari, ruxsat oqimi, `NSCameraUsageDescription`;
`WKUIDelegate` media ruxsati; native → veb landmark uzatish tezligi (`postMessage`, chastota);
(4) App Store: kamera ma'lumoti maxfiyligi, Privacy Manifest, Guideline 5.1.1/5.1.2 — joriy matndan iqtibos;
(5) Safari va Firefox'da MediaPipe tasks-vision holati (GPU delegate, WASM SIMD);
(6) **tavsiya jadvali**: HT-1 qo'llar, HP-1 bosh, HT-2 asbob, OP-* simulyator — har biri uchun veb / Mac / iPad, sababi bilan.
Har havola ochib tekshirilsin, sana bilan. Taxmin bo'lsa, "taxmin" deb yozilsin.
**Tegadigan fayllar:** `docs/research/camera-platforms.md`, `docs/handoff/AG-8.md`.

#### AG-9 — Kontent: EVD va DBS protsedura ssenariylari (OP-1, OP-2 uchun xom ashyo; kod yo'q)
**Nega:** simulyator dvigateli (OP-1/OP-2) uchun har qadamning anatomik va klinik asosi kerak. Bu PhD/neyroxirurg darajasidagi kontent.
**Qilish:** `docs/research/procedures/evd.md` va `docs/research/procedures/dbs.md`, har biri:
ko'rsatma va qarshi ko'rsatmalar; bemor holati; anatomik orientirlar mm bilan (Kocher nuqtasi: nazion/koronar chokdan masofa,
o'rta chiziqdan; DBS: AC–PC, STN/GPi/Vim koordinatalari, kirish nuqtasi); traektoriya va burchaklar; qadamlar ketma-ketligi
(har qadam: nima qilinadi, nima ko'rinadi, xato bo'lsa nima bo'ladi); asoratlar va ularning chastotasi; mahoratni baholash
mezonlari (OSATS yoki shunga o'xshash, simulyator tadqiqotlaridan). Har fakt manba bilan: DOI → Crossref sarlavhasi tekshirilsin,
NCBI Bookshelf → eutils; faqat ochiq yoki tekshiriladigan manbalar. Atlasimizda bor qismlarning id'lari ham yozilsin
(`src/data/parts.json`, masalan `g-interventricular-foramen`). Tasvirlar ko'chirilmaydi (Rhoton va boshqalar — mualliflik huquqi).
**Tegadigan fayllar:** `docs/research/procedures/*.md`, `docs/handoff/AG-9.md`.

#### AG-10 — Tadqiqot: virtual operatsiya xonasi uchun ochiq 3D assetlar (faqat hujjat)
**Nega:** keyingi bosqich — virtual operatsiya xonasi (stol, chiroq, bemor, asboblar), "3D oyna" bilan birga shlemsiz VR'ga
eng yaqin ko'rinish.
**Qilish:** `docs/research/or-assets.md`: HDRI (operatsiya xonasi yoki klinika), operatsiya stoli, jarrohlik chirog'i,
Mayfield boshni mahkamlash moslamasi, neyroxirurgik asboblar (kraniotom, burg'u, so'rg'ich, bipolyar, retraktor, ventrikulyar
kateter, DBS elektrodi), mato/qoplama teksturalari. Har asset uchun: havola, litsenziya (faqat CC0 yoki CC BY; **CC BY-ND
va NC bo'lmagan "editorial" taqiqlanadi**), format, uchburchaklar soni, hajm. Manbalar: Poly Haven, ambientCG, Sketchfab
(litsenziya filtri), NIH 3D. Yuklab, repoga qo'shmang — faqat ro'yxat va tavsiya (≤ 20 MB jami).
**Tegadigan fayllar:** `docs/research/or-assets.md`, `docs/handoff/AG-10.md`.

---

## 6. CLAUDE UCHUN

### 6.1 Sessiya boshi (har safar)
1. `git status` toza, `git fetch origin && git rev-parse HEAD origin/master` bir xil.
2. `git branch -a --list '*ag/*'` va `ls docs/handoff/` — Antigravity topshirgan ishlar bormi.
3. Bor bo'lsa → 6.2 (foydalanuvchiga natijani ayting, rozilik bilan birlashtiring). Yo'q bo'lsa → 9-bo'limdagi navbatdagi CL.
4. Dev server: `curl -s -o /dev/null -w "%{http_code}" localhost:3019` — `000` bo'lsa `npm run dev` ni fonda ishga tushiring.

### 6.2 Antigravity ishini tekshirish ("faollashtirish")
1. **Qamrov:** `git log --oneline master..ag/<id>` va `git diff --stat master...ag/<id>` — o'zgargan har fayl vazifaning
   "Tegadigan fayllar" ro'yxatida bo'lishi kerak; `data/raw`, `public/meshes`, kalitlar yo'q.
2. **Kod:** `git diff master...ag/<id>` ni o'qing — qoidalar (2-bo'lim), mantiq, xavfsizlik (HTML injection, tashqi skript yo'q).
3. **Ishga tushirish:** vaqtinchalik birlashtirish branchida — `git switch -c review/<id> master && git merge --no-ff ag/<id>`,
   keyin tsc + build + `audit-lesions` (0) + `audit-pick` (diff 0) + vazifaga oid auditlar + 2–4 o'z screenshotingiz
   (handoff'dagilarni ham ko'ring).
4. **Mazmun (kontent/tadqiqot):** manbalardan tasodifiy 3–5 tasini Crossref/eutils bilan qayta tekshiring; anatomik aniqlik
   va o'zbekcha atamalarni tanlab tekshiring.
5. **Qaror:** foydalanuvchiga xulosa (nima yaxshi, nima tuzatiladi). Rozilik bo'lsa: `git switch master &&
   git merge --no-ff ag/<id>` (o'zbekcha xabar: nima birlashtirildi, qanday tekshirildi), push, `review/<id>` ni o'chirish,
   9-bo'limda ✅ va jurnal yozuvi, `docs/HISTORY.md` ga qisqa bo'lim. Rad etilsa: `docs/handoff/<id>.md` "Ko'rib chiqish"ga
   aniq tuzatishlar ro'yxati (`master`da commit), taxtada 🔧.
6. Antigravity'ning kichik xatosini o'zingiz tuzatish mumkin (birlashtirishdan keyin alohida commit) — handoff'da qayd eting.

### 6.3 Claude vazifalari

#### CL-1 — AI panel haqiqiy Gemini kaliti bilan ishlamayapti (BIRINCHI)
Tarix (2026-11-21): (1) avtomatik `gemini-3.8-flash-lite-tts` tanlandi → "Developer instruction is not enabled" — tuzatildi
(`827e81d`: chatga yaramaydigan modellar filtri `NOT_CHAT`, tizim ko'rsatmasiz zaxira); (2) `gemini-3.8-flash` → 503
"high demand" — avtomatik qayta urinish (2 s, 5 s) va "Qayta urinish / Boshqa model" tugmalari (`9b18a8f`);
(3) shundan keyin ham foydalanuvchi: "bo'lmayapti, ishlamayapti" — **sababi aniqlanmagan**.
**Reja (foydalanuvchi bilan birga):** sahifa haqiqatan yangilanganmi (eski kod); DevTools → Network: so'rov URL, status,
javob tanasi; `__ai.getState().models.google` va tanlangan model; boshqa model (Pro, flash-lite) bilan; bepul tarif
kvotasi (429/RESOURCE_EXHAUSTED); `listModels` javobi. Kalitni chatga yozdirmang — foydalanuvchi brauzerda kiritadi.
Kerak bo'lsa `src/ai/providers/gemini.ts` ga diagnostika (xato tanasini to'liq ko'rsatish). Kodlar: `src/ai/`.

#### CL-2 — AI-6 va AI panel joylashuvi
ChatGPT rejasi bilan kirish (OpenAI "Sign in with ChatGPT" — hozir faqat lokal/loopback ilovalar uchun, preview) va Google
OAuth (Cloud loyiha + verifikatsiya) — avval shartlarni qayta tekshiring (PLAN 5.6 A). Inspector kartasi AI panel ostida
qoladi (ikkalasi o'ngda) — joylashuvni hal qilish. `look_at_screen` tool (AI o'zi surat so'raydi).

#### CL-6 — Plastinka ko'ruvchisi: rasm kattaroq va kursor javobi tez bo'lsin (foydalanuvchi, 2026-11-22)
Kuzatuv (Mc, "Real kesim"): rasm panelning ~⅓ qismini egallaydi (≈445×325 px, panel ≈1280×660) — sarlavha, tablar, chiplar va
uch qator izoh joyni yeydi; zoom ham rasmni "to'liq ko'rish" uchun kichik. Kursor ostidagi soha javobi kech.
Sabab gipotezalari (tartib bilan tekshiring): (1) `.section-viewer { backdrop-filter: blur(6px) }` butun ekran bo'yicha —
panel ichida har qayta chizishda orqa fon (jonli WebGL kanvas) qayta xiralashadi; (2) viewer ochiqligida 3D sahna rAF sikli
to'xtamaydi (`BrainScene` `sectionId` bo'yicha pauza yo'q); (3) nuqtali (`stroke-dasharray`) konturlar yuzlab yo'l bilan;
(4) hover uchun katta SVG qayta chizilishi. `perf-real.mjs` headless'da CPU ≈ 7 ms/hodisa ko'rsatadi (wall ≈ 50 ms — dasturiy GL
shovqini), ya'ni kechikish GPU/chizish tomonida: foydalanuvchining haqiqiy brauzerida Performance yozuvi kerak
(qo'shimcha: DevTools konsolda `document.querySelector('.section-viewer').style.backdropFilter='none'` — tezlashsa, (1) tasdiqlanadi).
**Qilish:** rasm bo'sh joyni to'ldirsin (grid; izohlar bitta "ⓘ" ochiluvchi qatorga/qisqa tasmaga); zoom boshlang'ich "fit"
kattaroq; `backdrop-filter`ni statik xiralashtirishsiz qoraytirish bilan almashtirish; viewer ochiqligida sahna pauza; konturlarni
yengillashtirish (dash o'rniga ingichka to'liq chiziq yoki kesh); `perf-real.mjs` ga `--trace` (CDP tracing, kadr vaqti).
**Tegadigan fayllar:** `src/ui/{SectionViewer,AtlasSliceView,ZoomPane}.tsx`, `src/index.css` (`.section-viewer`, `.sv-*`, `.as-*`,
zoom), `src/scene/BrainScene.ts` (faqat pauza). **Tayyor mezoni:** Mc/B4/K3 da rasm ≥60% balandlik; zoom/hover Performance yozuvida
kadr ≤16 ms; foydalanuvchi o'z brauzerida tasdiqlaydi; `audit-lesions` 0, `audit-pick` 0.

#### CL-7 — Apple ko'prigi, 0-bosqich: vebdagi "tishlar" (`docs/APPLE.md` 1–2-bo'limlar)
`src/bridge/{types,bridge,commands,state,export}.ts`; holat havolasi `#s=` + "Havolani nusxalash"; shaffof 2K/4K PNG eksport;
`View` ga back/left/right; hotkey'lar 1–5/R/⌘K; kontekst menyu; 8 hook (1.5). Vebda native'siz to'liq ishlaydi; sinov —
soxta `__NA_NATIVE__` bilan headless (buyruq → store, hodisa → postMessage jurnali). Bog'liq: AG-3 (mesh manzili), CL-6 (pauza).

#### CL-3 — 5.1: plastinkalarda chegaralar 100% tutashsin
21 plastinka kutmoqda (T2 ✅). Tafsilot: `PLAN.md` 5.1, `docs/HISTORY.md` "5.1". Audit: `scripts/audit-sections.mjs`.

#### CL-4 — Mavzu viktorinasi (kesim + dars) va Anki
PLAN 5.3-3. AI-5 dagi `make_flashcards` va Anki .txt eksportini qayta ishlating. Savollar banki — **AG-5** (`src/data/quiz/*.json`, sxema AG-5 da); Claude faqat dvigatel va UI (aralashtirish, ball, xatolar ustida ishlash, Anki) yozadi.

#### CL-5 — Realizm R2 (ambient occlusion, yumshoq soyalar) va Liquid Glass LG-3 (harakat)
`CLAUDE.md` "Joriy holat" bo'limida tafsilot.

Qolgan g'oyalar (foydalanuvchi tanlaydi): Villiz doirasi variantlari, erkin o'choqning PhD davomi (sxema↔atlas farqi,
JHU tolalaridan yo'llar, PPMS, T2/FLAIR, 3D da o'choqni sudrash), BG-2…BG-4, yangi kesim darajalari.

---

## 7. Kod xaritasi

```
src/
  main.tsx, App.tsx            ilova ildizi; ⌘/ — AI panel, / — qidiruv; OpenRouter qaytishi (completeOpenRouterLogin)
  store/useAtlas.ts            zustand: lang, theme, colorMode, layers, selected, mode (explode|peel|learn), view,
                               clip, sectionId (ochiq plastinka), pathway, topic, lesson {id, step}, panel, sidebar ...
  i18n/strings.ts, index.ts    UI satrlari (en/uz); useT() — satrlar, useL() — L10n {en, uz} tanlash
  scene/
    BrainScene.ts (1733)       Three.js sahna: meshlar, materiallar, kesimlar, markerlar, dars rejimi (focus, flows, lesions),
                               kamera (fitBox, frameLesson), snapshot() — AI uchun surat
    SceneView.tsx              sahnani React'ga ulaydi; store → scene.setState; registerSnapshot
    loader.ts                  GLB yuklash; MNI → sahna (−x, z, y)
    materials.ts               ATLAS / REAL rang presetlari (R1)
    atlasSlice.ts, slice.ts    atlas meshlarini tekislik bilan kesish (atlas/real ko'rinish uchun)
    capture.ts                 sceneSnapshot() ro'yxati
  data/
    parts.json                 1740 qism (pipeline/build_catalogue.py hosil qiladi — qo'lda tahrirlamang)
    index.ts                   PARTS, LAYERS, SYSTEMS, CONCEPTS, contentFor bilan ta'riflarni ulash
    content/*.json + index.ts  ta'riflar (description/role/clinical/sources), FILES ro'yxati, FAMILIES meros
    search.ts                  searchAtlas() — qidiruv paneli va AI find_structure
    sections/                  22 plastinka (medulla/pons/midbrain/diencephalon/basal/cerebellum.ts), structures-*.ts
                               lug'at (STRUCTURE_BY_ID), real.json (BigBrain kesimlari), types.ts
    pathways.ts                CST/DCML/ALS/V bekatlari (O'NG tana = CHAP yarim shar)
    lesions.ts                 LEVELS/zonalar/sindromlar, signature(), localise(), CRANIAL_SIGNS
    lessons/                   3D darslar (ventricles, callosum, limbic, pathways, lesion:<level>:<side>:<zone>)
    topics.ts                  O'rganish mavzulari (darslar + plastinkalar)
  ui/
    Header.tsx                 TabBar, ViewGroup (✨ AI tugmasi), Identity
    Sidebar.tsx, BottomBar.tsx, SearchPanel.tsx, Inspector.tsx, LessonPanel.tsx, About.tsx, Overlays.tsx, ViewControls.tsx
    SectionViewer.tsx (1171)   plastinka ko'ruvchisi: sxema/mielin/Nissl/atlas/real, tablar, erkin o'choq holati,
                               useScreen ko'zgu + AI buyruqlari (command)
    LesionPanel.tsx            Shikastlanish tabi (hudud/nuqta, oldinga/teskari), McDonaldPanel.tsx (vaqt o'qi, McDonald)
    AtlasSliceView.tsx         atlas/real kesim (MNI kursor, disklar, "O'choq ostida (atlas)")
    ZoomPane.tsx               zoom / surish / to'liq ekran
    lesionFocal.ts             erkin o'choq: focalOn, focalSet, focalMni (plastinka→MNI affin), cutToPlate, structureCentre
    lesionTerritory.ts, lesionSigns.ts, mcdonald.ts, focalLesson.ts, pathTrace.ts, sectionLayout.ts
    AIPanel.tsx, aiMarkdown.tsx, plateCapture.ts    AI panel UI, xavfsiz markdown, plastinka surati
    liquidGlass.ts, useLens.ts Liquid Glass effektlari
  ai/
    types.ts                   Provider, ChatTurn, ToolSpec/Call/Result, ImagePart, AIError
    providers/                 anthropic.ts (rasmiy SDK, dinamik import), compat.ts (OpenAI/OpenRouter/lokal),
                               gemini.ts, mock.ts (dev), index.ts (PROVIDERS, pickModel)
    useAI.ts                   AI store: hisoblar, model, rejim, turns, agent sikli (≤6 raund), retry, attachments
    context.ts, screen.ts      ekran holati → brief; kesim ko'ruvchisi ko'zgusi + buyruqlar
    tools.ts                   15 tool + runTool (async), VERIFIED (tekshirilgan PMID/DOI)
    openrouterAuth.ts, sse.ts  PKCE kirish; SSE tahlilchisi
  index.css                    barcha uslublar (oxirida: Themes, Liquid Glass II, Layout II, AI panel bo'limlari)
scripts/                       shot*.mjs, audit-*.mjs, perf-real.mjs, export-section-frames.mjs, export-plate-affine.mjs
pipeline/                      Python: meshlar (bp3d_to_glb, julich_to_glb, volume_to_glb, ...), build_catalogue.py,
                               tools/ (slice_svg, landmarks, real_slices); README.md — to'liq retsept; .venv
docs/                          HISTORY.md (tarix), TASKS.md → AI.md, handoff/ (AG topshiriqlari), research/
public/                        meshes/ (gitignore), sections/real/*.webp (commit qilinadi), draco/ (AG-3 dan keyin)
```

---

## 8. Ma'lum muammolar va tuzoqlar

- AI panel: haqiqiy Gemini kaliti bilan ishlamayapti (CL-1). Mock bilan hammasi ishlaydi: `__ai.getState().setCred('mock',
  {key:'mock'})`, `choose('mock','mock-tutor')`, `send('...')`; mock iboralari: "wallenberg", "MLF", "talamusni ko'rsat",
  "busy" (503 keyin tiklanish), "error:server", keys/tadqiqot rejimlari, "anki", "uydirma" (soxta DOI ogohlantirishi).
- Inspector kartasi AI panel ostida qoladi (ikkalasi o'ngda).
- Real kesim tezligini foydalanuvchi o'z brauzerida hali tasdiqlamagan.
- Plastinkalar sxematik: o'choq mm'lari taxminiy (≈); plastinka→MNI affin xatosi median 1–6 mm (B5 eng katta).
- Pane yashirin bo'lsa rAF ishlamaydi — headless screenshot ishlating.
- `npx -y tsx` ruxsat bermaydi — TS mantiqni `scripts/_x_tmp.mjs` (puppeteer + dev server import) bilan sinang, keyin o'chiring.
- `build_catalogue.py` qayta ishga tushirilsa `parts.json` aynan qayta hosil bo'ladi (xavfsiz).

---

## 9. Holat taxtasi va jurnal (faqat Claude yangilaydi)

Belgilar: ⏳ kutmoqda · 🔨 ishlanmoqda · 👀 tekshiruvga tayyor (branch) · 🔧 tuzatish kerak · ✅ birlashtirildi (faol).

**Parallel yo'llar (fayllar kesishmaydi — ikkalasi bir vaqtda ishlashi mumkin):**
- **Jarrohlik simulyatori yo'li** (`docs/SURGERY.md`): Claude Code SX-1 → SX-7 `../neuro-atlas-sx` da (`sx/main`, port 3021, master'ga
  birlashtirilmaydi); Antigravity AG-9 → AG-10 → AG-12 → AG-11 → AG-13 → AG-8.
- **Antigravity yo'li** (ketma-ket, bitta worktree; AG-8 → AG-9 → AG-10 ham — faqat hujjat): AG-3 (deploy: `loader.ts`, vite, workflow, README) → AG-5 (savollar banki,
  yangi JSON) → AG-6 (App Store tadqiqoti) → AG-4 (tadqiqot hujjatlari). Hech biri `src/ui/**`, `BrainScene.ts` ga tegmaydi.
- **Claude yo'li** (ketma-ket): CL-6 (plastinka ko'ruvchisi: `SectionViewer/AtlasSliceView/ZoomPane`, `index.css` sv-/as-) → CL-3
  (`src/data/sections/*.ts`) → CL-7 (Apple ko'prigi, veb tishlari) → CL-4 (viktorina dvigateli, AG-5 tayyor bo'lgach) → CL-5 (R2/LG-3). AI-6 — OpenAI javobini kutadi.
- Birlashtirish tartibi: avval AG-3 (sayt 3D'siz ochilmasin), keyin AG-5; Claude o'z ishini har bosqichda `master`ga commit qiladi.

| ID | Vazifa | Kim | Holat | Branch / handoff |
|---|---|---|---|---|
| AG-1 | Kontent: Desikan, JHU, Destrieux, Glasser ta'riflari | Antigravity | ✅ 2026-11-22 | birlashtirildi (`616d941`) · docs/handoff/AG-1.md |
| AG-2 | Yorug' rejim: dars kartasi va kesim ko'ruvchisi | Antigravity | ✅ 2026-11-22 | birlashtirildi · docs/handoff/AG-2.md |
| AG-3 | Deploy: meshlar Release + Draco, README, ATTRIBUTION | Antigravity | ✅ 2026-11-22 (qoldi: `meshes-v1` Release'ni foydalanuvchi yuklaydi) | birlashtirildi (`6d6156f`) · docs/handoff/AG-3.md |
| AG-4 | Tadqiqot: U1 gistologiya; BigBrain 20 mkm | Antigravity | ✅ 2026-11-25 birlashtirildi (3 DOI Crossref ✓) | ag/AG-4 |
| CL-1 | AI panel: haqiqiy Gemini kaliti bilan ishlamayapti | Claude | ✅ tashxis: Google 503 (bepul tarif, band model); xato tafsiloti + avtomatik model almashtirish (`cd06af4`, `8b8ef1b`) | master |
| CL-2 | AI-6 (ChatGPT/Google kirish), panel joylashuvi, look_at_screen | Claude | 🔨 panel joylashuvi va `look_at_screen` ✅ 2026-11-22; AI-6 — OpenAI javobini kutmoqda (SIWC statik sayt uchun hujjatlashtirilmagan) | master |
| AG-5 | Kontent: viktorina savollar banki (CL-4 uchun) | Antigravity | ✅ 2026-11-22 (birlashtirildi; sifat tuzatishlari AG-5b da) | docs/handoff/AG-5.md |
| AG-5b | Viktorina savollarini sayqallash: to'g'ri javob uzunligi, ishonarli distraktorlar, kod identifikatorlarisiz matn | Antigravity | ✅ 2026-11-23 (eng uzun to'g'ri javob 83% → 23%) | birlashtirildi (`9a76c7f`) · docs/handoff/AG-5b.md |
| CL-6 | Plastinka ko'ruvchisi: rasm kattaroq, kursor javobi tez | Claude | ✅ 2026-11-22 (rasm 61–63%; foydalanuvchi o'z brauzerida tasdiqladi) | master |
| CL-7 | Apple ko'prigi 0-bosqich (veb tishlari) — `docs/APPLE.md` | Claude | ⏳ (AG-3 dan keyin; CL-6 ✅) | master |
| AG-6 | Tadqiqot: App Store muvofiqligi, litsenziyalar | Antigravity | ✅ 2026-11-23 (iqtiboslar tasdiqlandi; Jetsam raqamlari — taxmin) | birlashtirildi (`09ded73`) · docs/handoff/AG-6.md |
| AG-7 | USDZ eksport (AR, Apple 2-bosqichi) | Antigravity | ⏳ (keyin) | ag/AG-7 |
| CL-3 | 5.1: 21 plastinkada chegaralar 100% | Claude | ✅ 2026-11-22 (egasiz 0% hamma 22 plastinkada; haqiqiy ustma-ustliklar tuzatildi) | master |
| CL-4 | Mavzu viktorinasi + Anki | Claude | ✅ 2026-11-22 (foydalanuvchi tasdiqladi; savollar sayqali AG-5b da) | master |
| CL-5 | R2 realizm ✅ 2026-11-22 (burmalardagi soyalar); LG-3 harakat ✅ 2026-11-22 (prujina fizikasi) | Claude | ✅ foydalanuvchi tasdiqladi | master |
| HT-1 | Qo'l bilan boshqarish (Mac kamerasi, MediaPipe) — PLAN 5.8 | Claude | ✅ sx/main da (master'ga QO'SHILMAYDI, foydalanuvchi 2026-11-23) | sx/main · docs/HANDS.md |
| HP-1 | Bosh bilan qarash ("3D oyna", off-axis) — PLAN 5.8 | Claude | ✅ sx/main da (master'ga QO'SHILMAYDI) | sx/main · docs/HANDS.md |
| AG-8 | Tadqiqot: kamera funksiyalari — veb / Mac / iPad | Antigravity | ✅ 2026-11-25 birlashtirildi (HT-1/HP-1 qarori foydalanuvchida) | ag/AG-8 |
| AG-9 | Kontent: EVD va DBS protsedura ssenariylari | Antigravity | ✅ 2026-11-23 (tekshirildi, master'ga birlashtirildi) | docs/research/procedures/ · docs/handoff/AG-9.md |
| AG-10 | Tadqiqot: virtual operatsiya xonasi uchun ochiq assetlar | Antigravity | ✅ 2026-11-23 (tekshirildi, master'ga birlashtirildi) | docs/research/or-assets.md · docs/handoff/AG-10.md |
| AG-11 | Pipeline: operatsiya xonasi assetlari (glb + Draco) → sx/main | Antigravity | ⏳ (Sketchfab tokeni kerak) | ag/AG-11 (origin/sx/main dan) |
| AG-14 | Xonaga assetlarni ulash (`src/or/assets.ts`) — SURGERY.md 6 | Antigravity | ⏳ (AG-11 dan keyin) | ag/AG-14 (sx/main dan) |
| AG-15 | EVD ma'lumot + UI qobig'i + mashg'ulotlar tarixi — SURGERY.md 6 | Antigravity | ✅ 2026-11-24 tekshirildi va `sx/main` ga birlashtirildi (5 DOI qayta tekshirildi). `EvdPanel` ORPanel/EvdSession ga ulandi (SX-3b) | ag/AG-15 |
| AG-16 | DBS ma'lumot + MER tovushi — SURGERY.md 6 | Antigravity | ✅ 2026-11-24 tekshirildi va `sx/main` ga birlashtirildi (12 DOI Crossref ✓; SX-6 mantig'i `--real` ma'lumot bilan ✓) | ag/AG-16 |
| AG-17 | Burg'u chang zarrachalari va tovushi — SURGERY.md 6 | Antigravity | ✅ 2026-11-24 birlashtirildi va `DrillRig` ga ulandi (SX-4c) | ag/AG-17 |
| AG-18 | Yagona tekshiruv `scripts/check-all.mjs` + hisobot | Antigravity | ✅ 2026-11-24 tekshirildi, sx/main ga birlashtirildi (`927a95f`; CC: `shot-evd` qo'shdi) | ag/AG-18 |
| AG-12 | Tadqiqot: simulyator validatsiyasi va mahorat o'lchovlari | Antigravity | ✅ 2026-11-24 tekshirildi, master ga birlashtirildi (2 tuzatish) | ag/AG-12 |
| AG-13 | Tadqiqot: marker kuzatuvi (6DoF qalam) | Antigravity | ✅ 2026-11-25 birlashtirildi (3 DOI Crossref ✓) | ag/AG-13 |
| SX-1 | Virtual operatsiya xonasi (docs/SURGERY.md 2) | Claude Code | ✅ 2026-11-23 (`1bb44e0`) | sx/main |
| SX-2 | Asbob dvigateli (HT-2): masofa, to'qnashuv, titrash | Claude Code | ✅ 2026-11-23 (`0fa0815`) | sx/main |
| SX-3 | OP-1 EVD: faqat mantiq (Kocher, baholash, hodisalar); ma'lumot/UI → AG-15 | Claude Code | ✅ 2026-11-24 (`a9ad416`): Kocher, qadam mashinasi, baholash; `shot-evd` 29 ✓. UI/ma'lumot → AG-15; `sceneWorld` ni ToolEngine/ORPanel bilan ulash hali yo'q | sx/main |
| SX-4 | Suyakni burg'ulash (voksel) | Claude Code | ✅ 2026-11-24 (`54fc3fd`): BoneVolume + surface nets + DrillSession, `shot-drill` 21 ✓; real suyak 6.0 mm; UI/ToolEngine ga ulanmagan, AG-17 `DrillState` ni oladi | sx/main |
| SX-5 | Kuzatiladigan qalam (6DoF marker) | Claude Code | ⏳ (AG-13) | sx/main |
| SX-6 | OP-2 DBS | Claude Code | ✅ mantiq 2026-11-24 (`9cf7fb6`): `src/or/dbs/` AC–PC, traektoriya xavfi, MER, stim, baho, sessiya; `shot-dbs` 22 ✓. Ma'lumot `DbsData` sifatida inyeksiya — AG-16 shu shaklda yozsin (`src/or/dbs/logic.ts`); UI/3D yo'q | sx/main |
| SX-7 | Mikroskop + pterional | Claude Code | ⏳ (keyin) | sx/main |
| RL-A | Realizm A: anatomiya suyakdan miyagacha (A-0 audit → A-1 yaxlit po'stloq → A-3 meninges/likvor → A-4 tomirlar → A-2/A-5/A-6) — `docs/REALISM.md` | Claude Code (+ subagentlar) | 🔨 A-0 audit ✅ 2026-11-25; 2-qadam ✅ 2026-11-25 (qatlam dvigateli, likvor, dura ochish — vaqtinchalik qobiqlar, docs/HISTORY.md); keyingi: B-1 qatlamli bosh terisi | sx/main |
| RL-B | Realizm B: odam boshi (qatlamli teri, kesim, real yuz/soch) — `docs/REALISM.md` | Claude Code | 🔨 B-1 ✅ 2026-11-25 (qatlamli teri, kesma, retraktor — docs/HISTORY.md); B-2 AG-22 dan keyin | sx/main |
| AG-19 | Tadqiqot (cortex-surface) + QURISH: `pial_surface.py` (A-1 yaxlit po'stloq) — `docs/REALISM.md` | Antigravity | ⏳ | ag/AG-19 (origin/sx/main dan) |
| AG-20 | Tadqiqot (pial tomirlar) + QURISH: `vessel_snap.py`, `pial_vessels_grow.py` (A-4) | Antigravity | ⏳ (A-1 dan keyin) | ag/AG-20 (origin/sx/main dan) |
| AG-21 | Tadqiqot (qatlam qalinliklari) + QURISH: `meninges_shells.py`, `src/or/anatomy/layers.ts` (A-3) | Antigravity | ⏳ | ag/AG-21 (origin/sx/main dan) |
| AG-22 | Tadqiqot (CC0 bosh assetlari) + QURISH: `head_fit.py` → `public/or/head.glb` (B-2) | Antigravity | ⏳ | ag/AG-22 (origin/sx/main dan) |
| AG-23 | Tadqiqot (ho'l to'qima shaderi) + QURISH: `src/or/anatomy/wetTissue.ts` + demo sahifa (A-5) | Antigravity | ⏳ | ag/AG-23 (origin/sx/main dan) |

**Jurnal** (yangisi pastda; har yozuv: sana · kim · nima):
- 2026-11-21 · Claude · AI panel AI-1…AI-5 tayyor; Gemini tuzatishlari (`827e81d`, `9b18a8f`); haqiqiy kalit bilan muammo ochiq.
- 2026-11-21 · Claude · Ish taqsimoti: `AGENTS.md`, `docs/TASKS.md` (`6813487`).
- 2026-11-22 · Claude · Yagona `AI.md`; skriptlar `NA_URL` ni o'qiydi (Antigravity 3020 portda ishlaydi); TASKS/AGENTS → AI.md.
- 2026-11-22 · Claude · CL-1: Gemini 503 tashxisi, xato tafsiloti va avtomatik model almashtirish (`cd06af4`, `8b8ef1b`).
- 2026-11-22 · Claude · AG-1 tekshirildi va birlashtirildi (`616d941`); kichik tuzatish: buzuq Wikipedia havolasi `Lateral_occipital_gyrus` → `Occipital_lobe` (desikan.json, gross-brain.json).
- 2026-11-22 · Claude · CL-2: AI panel va o'ng kartalar (Inspector/dars/qidiruv) ustma-ust tushmaydi (index.css "CL-2" bloki); `look_at_screen` tool (16-tool; surat keyingi user xabari bo'lib ketadi, Anthropic/Gemini'da tool_result bilan birlashtiriladi). AI-6 tadqiqoti: SIWC ochiq manbali yo'li faqat loopback (`127.0.0.1`) mahalliy klient uchun; https/GitHub Pages, CORS va brauzerda token saqlash hujjatda yo'q, "remotely hosted" ilovalar qiziqish formasiga yo'naltiriladi → OpenAI'dan so'rash yoki mahalliy yordamchi kerak. Anthropic Claude.ai login — taqiqlangan; Google OAuth — verifikatsiya talab qiladi.
- 2026-11-22 · Claude · AG-2 tekshirildi (tsc, build, audit-lesions 0, audit-pick 0, light+dark screenshot) va birlashtirildi: dars kartasi va kesim ko'ruvchisi yorug' rejimga o'tdi.
- 2026-11-22 · Claude · Yangi vazifalar: CL-6 (plastinka ko'ruvchisi tezligi va rasm hajmi), AG-5 (viktorina savollar banki); ikki yo'lli parallel reja (9-bo'lim boshi).
- 2026-11-22 · Claude · CL-6: o'lchov — sahna viewer ochiqligida render qilmaydi (0/50), dash va blur headless'da ta'sirsiz (shovqin ichida), asosiy sabab joy: rasm 299 px edi. Tuzatish: bitta asboblar qatori (tablar+chiplar), izoh → ⓘ qalqib chiquvchi, afsona faqat sxemada, vertikal hoshiya 0.07→0.034, manba satri rasm ustiga; blur olib tashlandi (karta 93% shaffofmas), `.as-region`/`.sv-item` opacity-o'tishi olib tashlandi (hover darhol), BrainScene viewer ochiqligida kadrni o'tkazib yuboradi; `perf-real.mjs --trace`. Rasm Mc 427, B4 416, K3 433 px (balandlikning 62/61/63%); hover RunTask 72→45 ms/hodisa (headless), main-thread task 8 ms; audit-lesions 0, audit-pick 0.
- 2026-11-22 · Claude · Apple ilovalari rejasi: foydalanuvchi spetsifikatsiyasi loyihaga moslashtirildi (`docs/APPLE.md`, PLAN 5.7); yangi vazifalar CL-7, AG-6, AG-7.
- 2026-11-22 · Claude · AG-3 tekshirildi va birlashtirildi (`6d6156f`): dekoder three.js gltf nusxasi bilan bir xil; Draco meshlar bilan audit-pick 0, audit-lesions 0; build+preview xatosiz. Ochiq: `meshes-v1` Release (foydalanuvchi), LICENSE fayli yo'q (README MIT deydi).
- 2026-11-22 · Claude · Kod litsenziyasi: MIT (foydalanuvchi qarori) — `LICENSE`, `package.json`; ma'lumotlar o'z litsenziyalarida (ATTRIBUTION.md).
- 2026-11-22 · Claude · AI panel Gemini: haqiqiy kalit bilan o'lchandi — 3.8/3.5/flash-latest 503 (band), 3.7-flash 70 s jim (0 bayt), Pro 429 (kvota yo'q), 3.5-flash-lite/3.1-flash-lite/3-flash-preview 1–8 s'da javob beradi. Tuzatish: qorovul 30 s (jim model → keyingisiga), zaxira tartibi `FALLBACK` (flash-lite → flash-preview, Pro hech qachon), "O'ylayapti… N s". E2E: 3.8-flash band → 21 s'da 3.5-flash-lite javob berdi.
- 2026-11-22 · Claude · CL-3 yopildi: `--coverage` auditi hamma 22 plastinkada UNOWNED 0.0% (nuqta tuzilma → hudud → nomlangan zamin bo'yicha egasiga ega; zamin haqiqiy to'qima: tegmentum, oq modda, hypo-grey). `--min 0.15` da qolgan haqiqiy ustma-ustliklar tuzatildi: U3 icp×vn 18%, O3 pretectal pag×inc 21%, B4 gpe×gpi 16%, B5 ic-al×ic-g 17% (shared 0.3→0.1, 0.7→0.6). Qolganlari ataylab: ichma-ich yadrolar (PAG ichida aq/dr/ew, cg ichida cc/n12, fc×nc) va B1 striatal ko'priklari kapsula ichida (str-br×ic-al 88%). T1/G4 zamin ulushi (52%/75%) haqiqiy to'qima — qoldirildi.
- 2026-11-22 · Claude · AG-5 tekshirildi va birlashtirildi. Tasdiqlandi: 200 savol (80/80/40), sxema/ref/plate/dublikat 0 xato (o'z skriptim), 47 manbaning hammasi Crossref (DOI sarlavhasi mos) va eutils bilan tekshirildi, 7 tasodifiy savol anatomik jihatdan to'g'ri. TOPILDI: (1) 2 ta noto'g'ri Purves ID (NBK11020 "Critical Periods", NBK10994 "CNS Dimorphisms…" — savol manbasi "amygdala"/"hippocampus" deb yozilgan) — shu ID `gross-brain.json` da ham bor edi (eski xato) — tuzatildi: NBK10891 (The importance of the amygdala), NBK482171 (StatPearls Hippocampus). (2) SIFAT: to'g'ri javob 83% savolda eng uzun variant (o'rtacha 2.1× distraktor), ko'p distraktor ishonarsiz ("VTA→V1"); (3) 57 savolda o'quvchiga ko'rinadigan kod identifikatorlari (`n6`, `BRAINSTEM_STRUCTURES`, `lesions.ts`). Ma'lumot CL-4 gacha faol emas (UI ulanmagan), shuning uchun birlashtirildi; AG-5b CL-4 ni chiqarishdan oldin tuzatadi.
- 2026-11-22 · Claude · CL-4: viktorina. `src/quiz/engine.ts` (bank yuklash, urug'li aralashtirish, Leitner 0–3 qutilari `na:quiz`, `pickDeck` mixed/weak, `summarise` + kalibratsiya), `src/quiz/anki.ts` (3 ustunli .txt, umumiy; AIPanel ham shuni ishlatadi), `src/ui/QuizPanel.tsx` (sozlash → savol → natija), store `quizTopic/openQuiz`, O'rganish tabida har mavzuda "Viktorina" kartasi (yangi tab yo'q). PhD qatlami: 'Ishonchim komil' belgisi → kalibratsiya (ishonchli xatolar), ekspert klinik keyslar, zaif tuzilmalar (3D da), takrorlash rejimi. Tekshirildi: engine (urug' bir xil deck, weak/Leitner, variant o'rni 85–111/400, Anki matni), UI (3D qaytish, plastinka ustida Esc, qora+yorug' rejim), tsc, build, audit-lesions 0, audit-pick 0. QOLDI: AG-5b savollari (uzunlik tarafkashligi) va foydalanuvchi sinovi.
- 2026-11-22 · Claude · CL-5/R2: burmalardagi soyalar (GTAO). Tanlov: vertexga pishirish rad etildi — 1.0M gross vertex × 8 nur ≈ 8M nur (headless 150k nur/s → ~1 daq), qo'shni qismlar bir-biriga tegib turgani uchun (nurlarning 65% urilishi) tarqatish/kesimda noto'g'ri qorong'u yuzalar beradi, Draco vertex tartibini o'zgartirishi mumkin. Dinamik SSAO: kadr odatdagidek chiziladi (ton egri chizig'i, MSAA, fon o'zgarmaydi), AO chuqurlik+normaldan hisoblanib ustiga ko'paytiriladi (`CustomBlending`). Faqat yig'ilgan model, kamera tinch, kesim/tarqatish/ajratish/dars yo'q (`aoWanted`); depth/normal o'tish kamera yoki ko'rinish o'zgarganda qayta hisoblanadi (hover/tanlash o'tishlarida emas). GTAO alohida chunk (7.8 kB gzip), «…» menyusida «Burmalardagi soyalar» (`na:ao`, telefonda standart o'chiq). Tekshirildi: qora+yorug' rejim, kesim/tarqatish/sudrashda o'chadi, tinchlikda qaytadi, tsc, build, audit-lesions 0, audit-pick 0. TEKSHIRILMAGAN: haqiqiy GPU'da kadr vaqti (headless dasturiy GL) — foydalanuvchi sinovi.
- 2026-11-22 · Claude · CL-5/LG-3: harakat. Namuna video (`Screen Recording 2026-11-15 at 18.54.53.mov`) Desktop'da yo'q bo'lib chiqdi — kadrma-kadr emas, haqiqiy prujina modeli bo'yicha: `scripts/gen-spring.mjs` (SwiftUI `response/damping` → CSS `linear()`; glide 0.34 s/0.78 → overshoot 2.0 %, 0.43 s; spring 0.30 s/0.62 → 8.4 %, 0.48 s), `@supports (linear())` bilan cubic-bezier zaxirasi. Tanlov kapsulasi sayohatda cho'ziladi (squash & stretch, masofaga qarab ≤ 1.34×, 430 ms) va sudralganda barmoq tezligiga qarab (`--sx/--sy`); menyu, dars kartasi, AI panel, plastinka/viktorina kartasi prujinada va xiralikdan chiqadi (`prefers-reduced-motion` o'chiradi). O'lchandi (WAAPI currentTime): siljish 71 px, overshoot 2.0 %, cho'zilish cho'qqisi 1.24× @100 ms, 430 ms da joyiga. TEKSHIRILMAGAN: haqiqiy qurilmada "hissi" — foydalanuvchi sinovi; kerak bo'lsa video qayta berilsa kadrlar bilan solishtiriladi.
- 2026-11-23 · Claude · HT-1 (qo'l bilan boshqarish) va HP-1 (bosh bilan qarash, "3D oyna") `hands/HT-1` branchida tayyor; foydalanuvchi qarori bilan master'ga qo'shilmaydi (veb / faqat Mac / faqat iPad keyin hal qilinadi). Holat: `docs/HANDS.md`. Antigravity uchun AG-8 (platformalar tadqiqoti), AG-9 (EVD/DBS kontenti), AG-10 (operatsiya xonasi assetlari).
- 2026-11-23 · Claude · AG-5b va AG-6 tekshirildi va birlashtirildi. AG-5b: mustaqil skript (o'zgarmas maydonlar 0 farq, eng uzun to'g'ri javob 166→46), 6 savol anatomik tekshiruvi, audit-lesions 0, audit-pick 0, viktorina UI. AG-6: Apple 4.2/2.5.2/1.4.1/5.1.2, FSL, HCP, CC iqtiboslari asl manbalardan tasdiqlandi; Jetsam raqamlari "taxmin" deb belgilandi, SUIT litsenziya izohi aniqlashtirildi. Muhim xulosalar (App Store'dan oldin): AI rozilik oynasi (5.1.2), tibbiy ogohlantirish (1.4.1), JHU uchun yozma ruxsat, HCP minnatdorchilik matni.
- 2026-11-23 · Claude · Jarrohlik simulyatori ish paketi: `docs/SURGERY.md` (qarorlar, sharoit, SX-1…SX-7, promptlar), integratsiya branchi `sx/main` (= hands/HT-1 + master, `../neuro-atlas-sx`, port 3021, shot-hands 13/13), yangi AGY vazifalari AG-11 (assetlar → sx/main), AG-12 (validatsiya o'lchovlari), AG-13 (marker kuzatuvi).
- 2026-11-23 · Claude · SX-2 tayyor (`sx/main` `0fa0815`, push qilindi): `src/or/tools/` asbob dvigateli (zond/kateter/burg'u, BVH masofa, to'qnashuv, HUD, titrash, traektoriya CSV); `scripts/shot-tools.mjs` hammasi ✓ (masofa xatosi ~1e-15 mm), shot-or 20/20, shot-hands 13/13, audit 0. Tekshirilmadi: haqiqiy kamera/gamepad. Keyingi: SX-3 (AG-9 va AG-12 hujjatlari master'da bormi — tekshirish kerak).
- 2026-11-23 · Claude · AG-9 va AG-10 tekshirildi (Crossref/eutils/Sketchfab API) va master'ga birlashtirildi. **Qayta taqsimot** (foydalanuvchi talabi): CC — kritik mantiq va tekshiruv, AGY — ma'lumot/UI/tovush/test kodi `sx/main` dan olingan `ag/*` branchlarda; yangi AG-14…AG-18, qoidalar `docs/SURGERY.md` 6.
- 2026-11-23 · Claude · SX-1 tayyor (`sx/main` `1bb44e0`, push qilindi): `src/or/` virtual operatsiya xonasi, bosh terisi suyakdan, Mayfield, chiroq, chizg'ich; `scripts/shot-or.mjs` 20 tekshiruv ✓, `audit-pick` 0, `audit-lesions` 0, `shot-hands` 13/13. Tafsilot: sx/main `docs/HISTORY.md` "SX-1". Tekshirilmadi: haqiqiy kamera, Mac FPS. Keyingi: SX-2.
- 2026-11-24 · Claude · Shartnomalar (`src/or/{types,evd/types,dbs/types,drill/types}.ts`, `sx/main` `528061f`) — AGY boshlashi mumkin. SX-3 mantig'i tayyor (`a9ad416`): real meshlarda Kocher (28 mm lateral, suture +15 mm), 9 qadam, baholash; ideal o'tish 4.75/5, noto'g'ri yo'llar past; `shot-evd` ✓, tsc/build, audit-pick 0, audit-lesions 0. AG-18 tekshirildi va sx/main ga birlashtirildi. Ongli chetga chiqishlar (chuqurlik atlasga nisbatan, Kakarla asl ta'rifi) — sx/main `docs/HISTORY.md` "SX-3". Tekshirilmadi: haqiqiy kamera/gamepad, chap tomon, SX-4 gacha suyak teshiksiz.
- 2026-11-24 · Claude · SX-4 tayyor (`sx/main` `54fc3fd`): `src/or/drill/` voksel suyak (0.5 mm, sdf), surface nets, burg'u sessiyasi (tezlik/qarshilik, plunge-ogohlantirish, breakthrough, qalinlik xaritasi). Topilma: atlas suyaklari juft yupqa qatlam → ray urilishlari parity bo'yicha juftlanadi. `shot-drill` 21 ✓, tsc/build, audit-pick 0, audit-lesions 0. Tekshirilmadi: haqiqiy kamera/geympad, Mac kadr byudjeti (headless CPU 1 ms), ToolEngine/ORPanel ulanishi. AGY navbati: AG-15 → AG-11 → AG-14 → AG-16 → AG-17.
- 2026-11-24 · Claude · SX-4b: burg'u ToolEngine ga ulandi (`sx/main`): Kocher nuqtasida suyak kesiladi (shader discard), panel, `shot-drill-ui` 9 ✓; shot-tools/or/hands, audit-pick 0, audit-lesions 0. AG-15 birlashtirildi. AGY keyingisi: AG-11 (bloklansa AG-14). Sinalmagan: real vaqtda sichqoncha/qo'l bilan, Mac FPS.
- 2026-11-24 · Claude · SX-3b: EvdPanel ORPanel ga ulandi (`sx/main`): belgi (scalp bosish), burg'u breakthrough → 'burr' qadami, kateter ToolEngine orqali, hisobot; `shot-evd-ui` 12 ✓, regressiya (shot-evd/tools/or/drill-ui) ✗ 0, audit-pick 0, audit-lesions 0. Xato tuzatildi: panel throttle oxirgi holatni yo'qotardi. SX-5 AG-13 (marker tadqiqoti) ni kutadi.
- 2026-11-24 · Claude · SX-6 mantig'i tayyor (`sx/main` `9cf7fb6`): AC–PC ramka (atlas AC–PC 32 mm), traektoriya xavfi, MER (qatlam oynalari, chord modeli), brain shift, stimulyatsiya oynasi, baho (dbs.md 6); ehtiyotkor 5.0 vs beparvo 2.0. AG-16 uchun: ma'lumot `DbsData` (`logic.ts`) shaklida; `effectRefDistMm` 6 mm atlasga kalibrlangan. UI, 3D elektrod, GPi/Vim to'liq sessiyalari, real AG-16 ma'lumoti — keyin.
- 2026-11-24 · Claude · SX-6b: DBS paneli ORPanel ga ulandi (`sx/main`): 7 qadam, AC–PC (yordamli/bosish), kirish nuqtasi bosish, MER+audio, stim, hisobot; `shot-dbs-ui` 16 ✓, `shot-dbs --real` 22 ✓, regressiya ✗ 0, audit-pick 0, audit-lesions 0. AG-16 va AG-17 tekshirilib birlashtirildi. AG-12 branchi (tadqiqot) hali ko'rilmagan: u AI.md/SURGERY.md ga ham tegibdi — ko'rib chiqiladi. Keyingi: AG-17 ni DrillRig ga ulash (chang/ovoz/titrash), SX-5 AG-13 ni kutadi.
- 2026-11-24 · Claude · SX-4c: AG-17 DrillRig ga ulandi (`sx/main`): chang (`drill-dust`), tovush ("Tovush" tugmasi, bosishdan keyin), geympad titrashi; `shot-drill-ui` 15 ✓, regressiya ✗ 0, audit-pick 0, audit-lesions 0. Sinalmagan: tovush eshitilishi, geympad, chang ko'rinishi (headless). AG-12 hali ko'rilmagan.
- 2026-11-24 · Claude · AG-12 (simulyator validatsiyasi tadqiqoti) tekshirildi va master ga birlashtirildi: manbalar ✓, ikki izoh tuzatildi (8+1 metrika, chegaralar dizayn qiymati). Taklif: LC-CUSUM + LDJ — keyingi PhD qatlami (EVD/DBS tarix tabiga).
- 2026-11-24 · Claude · PhD qatlami (`sx/main`): LDJ (silliqlik) va LC-CUSUM (kompetentlik) — `src/or/skill.ts`, EVD hisobot/tarix/CSV, tarix tabida LC-CUSUM kartasi; `shot-skill` 14 ✓, regressiya ✗ 0, audit-pick 0, audit-lesions 0. Ochiq: DBS tarixi yo'q (LC-CUSUM u yerga keyin), p0/p1/h simulyatsiya bilan tanlanmagan, LDJ chegaralari ekspert ma'lumotisiz kalibrlanmagan.
- 2026-11-24 · Claude · Realizm rejasi (`docs/REALISM.md`): foydalanuvchi talabi — suyak/parda ostida havo (arachnoid, likvor, pia yo'q; tomirlar va miya muallaq), bosh/qo'l/stol realistik emas. Qaror: aralash agentlar (kod — Claude, tadqiqot/asset — AGY), hozir A (anatomiya) va B (bosh), sifat — tibbiy video, Mac ≥ 30 FPS; yondashuv: atlas tuzilmasi + ochiq real sirt + protsedural PBR (litsenziya toza va real). Yangi vazifalar RL-A, RL-B, AG-19…AG-22. Kuzatuv: meninges 4 mesh (dura 6.09 mm da suyak tagida), po'stloq 55 bo'lak, tomirlar 246 mesh.
- 2026-11-24 · Claude · Foydalanuvchi: AGY ga boshidan faqat tadqiqot berilgan, u o'zi real narsa qurib ko'rsin. REALISM.md yangilandi: AG-19…AG-23 endi "tadqiqot + QURISH" (pipeline vositalari va sof modullar: pial_surface.py, vessel_snap.py, meninges_shells.py, head_fit.py, wetTissue.ts), har birida qabul skripti. Sahnaga ulashni Claude qiladi.
- 2026-11-25 · Claude · AG-4, AG-8, AG-13 (faqat hujjat) tekshirildi: 6 DOI Crossref, havolalar; foydalanuvchi roziligi bilan master ga birlashtirildi.
