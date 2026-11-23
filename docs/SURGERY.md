# SURGERY.md: shlemsiz VR jarrohlik simulyatori, ish paketi

> **Yagona hujjat** Claude Code (CC) va Antigravity (AGY) uchun. Yo'nalish: foydalanuvchi talabi (2026-11-22/23), ya'ni
> Wraith-VR darajasidagi jarrohlik simulyatoriga **VR shlemsiz**, Mac kamerasi va aylanma yo'llar bilan yaqinlashish.
> Reja: `PLAN.md` 5.8. Boshlang'ich qatlamlar (qo'l HT-1, bosh "3D oyna" HP-1): `docs/HANDS.md`.

## 0. Qat'iy qarorlar

1. **Master'ga BIRLASHTIRILMAYDI.** Simulyator kodi **`sx/main`** integratsiya branchida yashaydi. Umumiy loyihaga qaysi qism
   kirishi (veb / faqat Mac / faqat iPad) keyin foydalanuvchi tomonidan hal qilinadi (AG-8 tadqiqoti shu qaror uchun).
   Master'ga faqat **hujjatlar** yoziladi: shu fayl, `AI.md` taxtasi, `PLAN.md`, AGY tadqiqotlari.
2. Master → `sx/main` yo'nalishida birlashtirish mumkin va kerak (har SX boshida, master'dagi tuzatishlar kelishi uchun).
   Teskari yo'nalishda mumkin emas.
3. **Ta'lim simulyatori.** Har operatsiya ekranida "ta'lim uchun; real bemor uchun reja emas" ogohlantirishi turadi
   (App Store 1.4.1, `docs/research/app-store.md`). Masofa va baholar "o'rtacha atlas miyasi" bo'yicha hisoblanadi; bu interfeysda yoziladi.
4. **Litsenziya.** 3D asset va teksturalar faqat **CC0 yoki CC BY** bo'ladi, CC BY-ND va "editorial" taqiqlanadi. Rhoton va
   operatsiya video-rasmlari ishlatilmaydi: vizual o'zimizniki, faktlar DOI bilan beriladi (Crossref va eutils orqali tekshirilgan).
5. **Kamera maxfiyligi.** Modellar va WASM o'z originimizdan yuklanadi. Kadr brauzerdan chiqmaydi. Kamera faqat foydalanuvchi
   yoqqanda ishlaydi va tab yashirilganda to'xtaydi.
6. **Kiritish qatlami alohida.** Dvigatel `HandFrame` / `FaceObs` / asbob holatini qabul qiladi va manbasiga qaramaydi
   (sichqoncha, MediaPipe, marker qalam, keyinchalik native Mac/iPad). Har funksiya **sichqoncha bilan ham** ishlashi shart.
7. Har SX bilan **PhD/neyroxirurg darajasidagi** imkoniyat ham qo'shiladi (o'lchov, eksport, adabiyotga bog'lash).

## 1. Sharoit (papkalar, portlar, branchlar)

| Papka | Branch | Port | Kim | Nima uchun |
|---|---|---|---|---|
| `neuro-atlas` | `master` | 3019 | Claude (integrator) | Umumiy loyiha; hujjatlar; AGY ishini tekshirish |
| `neuro-atlas-sx` | `sx/main` | 3021 | Claude Code (SX sessiyalari) | **Simulyator kodi** |
| `neuro-atlas-ag` | `ag/AG-*` | 3020 | Antigravity | Tadqiqot, kontent, asset pipeline |

`neuro-atlas-sx` papkasi bo'lmasa, uni yaratish:
```bash
cd /Users/apple/Documents/Loyihalar/neuro-atlas && git fetch origin && git worktree add ../neuro-atlas-sx sx/main
```
```bash
cd ../neuro-atlas-sx && npm ci && ln -s ../../neuro-atlas/public/meshes public/meshes
```
```bash
npx vite --port 3021 --strictPort
```
Tekshiruv (headless, sintetik qo'l va bosh; hammasi ✓ bo'lishi kerak):
```bash
NA_URL=http://localhost:3021/ node scripts/shot-hands.mjs /tmp/sx-check
```
Qolgan auditlar (`audit-pick` diff 0, `audit-lesions` 0) ham `NA_URL=http://localhost:3021/` bilan ishga tushiriladi.

**Headless'ga oid eslatmalar:** dasturiy WebGL taxminan 1.5 kadr/s ishlaydi, shuning uchun testlar `engine.ticks` ni kutadi,
vaqtni emas. Kamera yo'q, uning o'rnida `__handsDev.synthHand/synthFace` + `engine.feed/feedFace` ishlatiladi. Haqiqiy
kamera yo'li `--camera` (Chrome soxta kamerasi) bilan tekshiriladi. Dev'dagi tutqichlar: `__atlas`, `__scene`, `__hands`, `__handsDev`.

**Mavjud kod (sx/main):** `src/hands/` (tracker, engine, rig, synth, oneEuro, mapping, useHands, HandsLayer, strings),
`src/scene/sceneRef.ts`, `BrainScene` API (`externalHover/externalTap/orbitBy/dollyBy/setEye/withEye`),
`public/models/` (hand_landmarker.task, blaze_face_short_range.tflite).

## 2. Yo'l xaritasi (CC: SX vazifalari, tartib bilan)

Har SX uchun bitta sessiya, bitta yoki bir necha commit `sx/main` ga, push `origin sx/main`.

| ID | Vazifa | Bog'liqlik | Tayyor bo'lish mezoni (DoD) |
|---|---|---|---|
| **SX-1** | **Virtual operatsiya xonasi.** "Operatsiya" ko'rinishi (menyuda yoqiladi): protsedurali xona (pol, devorlar, operatsiya stoli, jarrohlik chirog'i yorug'lik konusi bilan, qoplamalar), bemor boshi (teri bosh suyagi meshidan: offset va silliqlash), soddalashtirilgan Mayfield moslamasi; "OR" yorug'lik rigi; kamera presetlari "jarroh" va "mikroskop" (tor FOV, vinyetka); HP-1 "3D oyna" bilan ishlaydi. Assetlar avval protsedurali bo'ladi, keyin AG-11 dan keladi | — | Atlasga qaytganda holat aynan tiklanadi; qora va yorug' rejim screenshot; Mac'da FPS o'lchovi (qo'l + bosh yoqilgan holda); `audit-pick` 0. **PhD:** xona masshtabi mm da, ruler/o'lchov asbobi |
| **SX-2** | **Asbob dvigateli (HT-2).** Zond, kateter va burg'u (protsedurali modellar); chimdilgan qo'l asbobni ushlaydi; uchi = chimdish nuqtasi 3D da (sirtga ray + qo'l yaqinligi orqali chuqurlik); `three-mesh-bvh` bilan eng yaqin tuzilmagacha masofa (mm) va to'qnashuv; xavf HUD'i; geympad titrashi (Gamepad API `vibrationActuator`); sichqoncha zaxirasi | SX-1 | Sintetik qo'l testi: asbob uchi koordinatasi, masofa ±0.5 mm (ma'lum nuqtaga nisbatan), to'qnashuv hodisasi. **PhD:** uchining traektoriyasi yoziladi (vaqt, xyz) |
| **SX-3** | **OP-1 EVD (ventrikulostomiya).** Kocher nuqtasi avtomatik (koronar chok = frontal va parietal suyak chegarasi; qiymatlar AG-9 dan); qadamlar: holat → belgilash → burg'u teshigi → qattiq parda → kateterni o'tkazish (yo'nalish orientirlari) → qorinchaga tushganda "likvor" signali → chuqurlik → hisobot. **Baholash:** vaqt, urinishlar soni, ideal burchakdan og'ish, uchdan Monro teshigigacha masofa, kesib o'tilgan tuzilmalar, titrash RMS, yo'l samaradorligi. CSV eksport, mashg'ulotlar tarixi va o'rganish egri chizig'i | SX-2, **AG-9**, AG-12 | Ideal va noto'g'ri traektoriyalar uchun sintetik testlar (to'g'ri va noto'g'ri baho chiqishi kerak); ogohlantirish ko'rinadi; screenshotlar |
| **SX-4** | **Suyakni burg'ulash.** Bosh suyagining kichik voksel bo'lagi (≈ 40 mm, 0.5 mm), meshdan SDF, marching cubes yoki surface nets; burg'u vokselni o'chiradi; chang zarrachalari, protsedurali ovoz (WebAudio), titrash; ichki plastinkadan o'tilsa ogohlantirish | SX-2 | Teshik chuqurligi o'lchami to'g'ri chiqadi; kadr byudjeti ≤ 8 ms (Mac). **PhD:** suyak qalinligi xaritasi |
| **SX-5** | **Kuzatiladigan qalam (6DoF).** Chop etiladigan marker (ArUco yoki AprilTag; kutubxona AG-13 tavsiyasi bo'yicha), kamera ichki parametrlari (oddiy kalibrlash), qalam uchi offseti, qo'l kuzatuvi bilan birlashtirish | SX-2, **AG-13** | Aniqlikni o'lchash protokoli (chop etilgan katakli qog'oz): xato mm da hujjatlashtiriladi |
| **SX-6** | **OP-2 DBS.** AC–PC, nishonlar (STN/GPi/Vim, AG-9), kirish nuqtasini tanlash, traektoriya xavfi (tomirlar, egatlar, qorincha), mikrodrayv, MER ovoz naqshlari (talamus → ZI → STN → SNr), makrostimulyatsiya nojo'ya ta'sirlari kontakt joyiga qarab (kapsula, medial lemnisk, III nerv) | SX-3 | Har nishon uchun ideal traektoriya testi; MER ketma-ketligi to'g'ri. **PhD:** koordinata eksporti, atlaslararo farq |
| **SX-7** | **Mikroskop va pterional** (keyinroq): CSG suyak qopqog'i, Silviy yorig'ini soddalashtirilgan ajratish, anevrizma klipsi (noto'g'ri klips → insult hududi, shikastlanish simulyatori bilan bog'lanadi) | SX-4, SX-6 | Alohida rejalashtiriladi |

## 3. Antigravity vazifalari (tafsilot `AI.md` 5.4)

Tartib: **AG-9 → AG-10 → AG-12 → AG-11 → AG-13 → AG-8**.

| ID | Nima | Natija | Qayerga birlashtiriladi |
|---|---|---|---|
| AG-9 | EVD va DBS ssenariylari (orientirlar mm, traektoriya, qadamlar, asoratlar, baholash) | `docs/research/procedures/*.md` | master (hujjat) |
| AG-10 | Operatsiya xonasi uchun ochiq assetlar ro'yxati | `docs/research/or-assets.md` | master (hujjat) |
| AG-12 | Simulyator validatsiyasi va mahorat o'lchovlari adabiyoti | `docs/research/sim-metrics.md` | master (hujjat) |
| AG-11 | AG-10 da tanlangan assetlarni yuklab, glb + Draco ga o'tkazish | `pipeline/tools/or_assets.py` va `public/or/*.glb` | **`sx/main`** (master'ga emas) |
| AG-13 | Marker kuzatuvi kutubxonalari (litsenziya, aniqlik, kalibrlash) + chop etiladigan marker | `docs/research/marker-tracking.md` | master (hujjat) |
| AG-8 | Kamera funksiyalari: veb / Mac / iPad | `docs/research/camera-platforms.md` | master (hujjat) |

## 4. Promptlar (foydalanuvchi yangi chatga nusxalaydi)

### 4.1 Claude Code: SX vazifasi (har yangi SX uchun bitta yangi sessiya)
```
Neuro Atlas — shlemsiz VR jarrohlik simulyatori. Avval o'qi: docs/SURGERY.md (to'liq), keyin CLAUDE.md va AI.md 2-bo'lim.
Ish papkasi: /Users/apple/Documents/Loyihalar/neuro-atlas-sx (branch sx/main, port 3021). Papka bo'lmasa SURGERY.md 1-bo'lim bo'yicha yarat.
master'ga HECH NARSA birlashtirma; sx/main ga commit qil va origin sx/main ga push qil.
Boshida: git fetch, master'ni sx/main ga birlashtir (faqat master → sx/main), shot-hands.mjs bilan hammasi ✓ ekanini tekshir.
Keyin SURGERY.md 2-bo'limdagi navbatdagi ⏳ SX vazifani (AI.md 9-bo'lim taxtasiga qara) bajar: avval menga qisqa reja ko'rsat,
so'ng bajar. DoD dagi testlarni scripts/ ga qo'sh, 2–4 screenshot ol, tsc + build. Oxirida SURGERY.md va AI.md taxtasidagi
holatni yangila (master'da, faqat hujjatlar), docs/HISTORY.md ga tafsilot yoz (sx/main da). Javoblar o'zbekcha.
```

### 4.2 Antigravity: jarrohlik vazifalari
```
Neuro Atlas loyihasi. /Users/apple/Documents/Loyihalar/neuro-atlas/AI.md ni o'qi (0–5, 7, 9-bo'limlar) va docs/SURGERY.md ni to'liq o'qi.
Sen — Antigravity, bajaruvchi. Ish papkang: ../neuro-atlas-ag (port 3020). SURGERY.md 3-bo'limdagi tartib bo'yicha taxtadagi
(AI.md 9) birinchi ⏳ vazifani ol: AG-9, AG-10, AG-12, AG-11, AG-13, AG-8. Har biri uchun `git switch -c ag/<id> origin/master`
(AG-11 bundan mustasno: `origin/sx/main` dan boshla). Faqat vazifadagi "Tegadigan fayllar"ga yoz; src/ ga tegma (AG-11 ham
faqat pipeline/ va public/or/ ga yozadi). Har manba ochib tekshirilsin (DOI → Crossref sarlavhasi, NCBI → eutils), sana bilan.
Tugagach docs/handoff/<id>.md yoz, branchni push qil va menga qisqa xulosa ber. Javoblar o'zbekcha.
```

### 4.3 Claude Code: integrator (AGY ishini tekshirish)
```
Neuro Atlas. AI.md 6.1–6.2 va docs/SURGERY.md ni o'qi. origin'dagi yangi ag/* branchlarni tekshir (6.2 protokoli: qamrov, diff,
manbalarni Crossref/eutils bilan 3–5 tasini qayta tekshirish, tsc/build/auditlar). Hujjat vazifalari roziligim bilan master'ga;
AG-11 (assetlar) esa faqat sx/main ga birlashtiriladi (neuro-atlas-sx papkasida). Natijani menga ayt. Javoblar o'zbekcha.
```

## 5. Har SX uchun tekshiruv ro'yxati

- [ ] Boshida master → `sx/main` birlashtirilgan, `shot-hands.mjs` hammasi ✓.
- [ ] Yangi funksiya **sichqoncha bilan ham** ishlaydi; qo'l va bosh bilan ham ishlaydi.
- [ ] Headless test(lar) `scripts/` da (sintetik kiritish, sonli tekshiruvlar), 2–4 screenshot (≈ 900×560), qora va yorug' rejim.
- [ ] `npx tsc -p tsconfig.app.json --noEmit && npm run build && rm -rf dist`; `audit-pick` 0.
- [ ] Ta'lim ogohlantirishi (operatsiya ekranlarida). Asset litsenziyalari `ATTRIBUTION.md` da.
- [ ] Commit o'zbekcha (nima va NEGA), `Co-Authored-By` qatori; push `origin sx/main`. Master'ga faqat hujjat yangilanishlari.
- [ ] Haqiqiy kamera bilan sinalmagan narsalar ochiq yoziladi ("tekshirilmadi").
