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

#### CL-3 — 5.1: plastinkalarda chegaralar 100% tutashsin
21 plastinka kutmoqda (T2 ✅). Tafsilot: `PLAN.md` 5.1, `docs/HISTORY.md` "5.1". Audit: `scripts/audit-sections.mjs`.

#### CL-4 — Mavzu viktorinasi (kesim + dars) va Anki
PLAN 5.3-3. AI-5 dagi `make_flashcards` va Anki .txt eksportini qayta ishlating.

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

| ID | Vazifa | Kim | Holat | Branch / handoff |
|---|---|---|---|---|
| AG-1 | Kontent: Desikan, JHU, Destrieux, Glasser ta'riflari | Antigravity | ✅ 2026-11-22 | birlashtirildi (`616d941`) · docs/handoff/AG-1.md |
| AG-2 | Yorug' rejim: dars kartasi va kesim ko'ruvchisi | Antigravity | ✅ 2026-11-22 | birlashtirildi · docs/handoff/AG-2.md |
| AG-3 | Deploy: meshlar Release + Draco, README, ATTRIBUTION | Antigravity | ⏳ | ag/AG-3 |
| AG-4 | Tadqiqot: U1 gistologiya; BigBrain 20 mkm | Antigravity | ⏳ | ag/AG-4 |
| CL-1 | AI panel: haqiqiy Gemini kaliti bilan ishlamayapti | Claude | ✅ tashxis: Google 503 (bepul tarif, band model); xato tafsiloti + avtomatik model almashtirish (`cd06af4`, `8b8ef1b`) | master |
| CL-2 | AI-6 (ChatGPT/Google kirish), panel joylashuvi, look_at_screen | Claude | 🔨 panel joylashuvi va `look_at_screen` ✅ 2026-11-22; AI-6 — OpenAI javobini kutmoqda (SIWC statik sayt uchun hujjatlashtirilmagan) | master |
| CL-3 | 5.1: 21 plastinkada chegaralar 100% | Claude | ⏳ | master |
| CL-4 | Mavzu viktorinasi + Anki | Claude | ⏳ | master |
| CL-5 | R2 realizm, LG-3 harakat | Claude | ⏳ | master |

**Jurnal** (yangisi pastda; har yozuv: sana · kim · nima):
- 2026-11-21 · Claude · AI panel AI-1…AI-5 tayyor; Gemini tuzatishlari (`827e81d`, `9b18a8f`); haqiqiy kalit bilan muammo ochiq.
- 2026-11-21 · Claude · Ish taqsimoti: `AGENTS.md`, `docs/TASKS.md` (`6813487`).
- 2026-11-22 · Claude · Yagona `AI.md`; skriptlar `NA_URL` ni o'qiydi (Antigravity 3020 portda ishlaydi); TASKS/AGENTS → AI.md.
- 2026-11-22 · Claude · CL-1: Gemini 503 tashxisi, xato tafsiloti va avtomatik model almashtirish (`cd06af4`, `8b8ef1b`).
- 2026-11-22 · Claude · AG-1 tekshirildi va birlashtirildi (`616d941`); kichik tuzatish: buzuq Wikipedia havolasi `Lateral_occipital_gyrus` → `Occipital_lobe` (desikan.json, gross-brain.json).
- 2026-11-22 · Claude · CL-2: AI panel va o'ng kartalar (Inspector/dars/qidiruv) ustma-ust tushmaydi (index.css "CL-2" bloki); `look_at_screen` tool (16-tool; surat keyingi user xabari bo'lib ketadi, Anthropic/Gemini'da tool_result bilan birlashtiriladi). AI-6 tadqiqoti: SIWC ochiq manbali yo'li faqat loopback (`127.0.0.1`) mahalliy klient uchun; https/GitHub Pages, CORS va brauzerda token saqlash hujjatda yo'q, "remotely hosted" ilovalar qiziqish formasiga yo'naltiriladi → OpenAI'dan so'rash yoki mahalliy yordamchi kerak. Anthropic Claude.ai login — taqiqlangan; Google OAuth — verifikatsiya talab qiladi.
- 2026-11-22 · Claude · AG-2 tekshirildi (tsc, build, audit-lesions 0, audit-pick 0, light+dark screenshot) va birlashtirildi: dars kartasi va kesim ko'ruvchisi yorug' rejimga o'tdi.
