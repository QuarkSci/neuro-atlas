# HANDS.md: kamera bilan boshqarish (HT-1, HP-1), saqlangan holat

> **Davomi: `docs/SURGERY.md`** — ish endi `sx/main` integratsiya branchida (`../neuro-atlas-sx`, port 3021) davom etadi.
>
> **Holat (2026-11-23): saqlab qo'yilgan, master'ga BIRLASHTIRILMAYDI.** Foydalanuvchi qarori: avval funksiyaning qaysi qismi
> umumiy veb loyihaga kirishini, qaysi qismi faqat maxsus qurilmalar (faqat Mac yoki faqat iPad, Apple ilovasi
> `docs/APPLE.md`) uchun bo'lishini hal qilish kerak. Kod faqat **`hands/HT-1`** branchida (origin'da ham bor). Uni master'ga faqat
> foydalanuvchi aniq aytgandan keyin qo'shing.

## 1. Nima tayyor

| ID | Funksiya | Holat |
|---|---|---|
| HT-1 | **Qo'l bilan boshqarish.** Mac kamerasi → MediaPipe Hand Landmarker (mahalliy). Ekranda 3D muzlatilgan shisha qo'llar, kursor halqasi tuzilma nomini ko'rsatadi. Imo-ishoralar: ko'rsatish = hover, chimdish + surish = burash (inersiya bilan), tez chimdish = tanlash, ikki qo'l = zoom | ✅ headless'da sinalgan, haqiqiy qo'l bilan sinalmagan |
| HP-1 | **Bosh bilan qarash ("3D oyna").** BlazeFace yuz detektori → off-axis proyeksiya (`BrainScene.setEye`). Ekran deraza bo'lib ko'rinadi, shlemsiz chuqurlik hissi beradi. Kuch slayderi va markazlash bor | ✅ headless'da sinalgan, haqiqiy yuz bilan sinalmagan |

Branchdagi commitlar: `e084c79` (HT-1), `dfe03fd` (HP-1). Ular `bddd735` ustida (R2 va LG-3 bilan).
Tafsilot branchdagi `docs/HISTORY.md` ning "HT-1" va "HP-1" bo'limlarida.

## 2. Qayta ochish

```bash
git worktree add ../neuro-atlas-hands hands/HT-1
```
```bash
cd ../neuro-atlas-hands && ln -s ../neuro-atlas/node_modules node_modules && ln -s ../../neuro-atlas/public/meshes public/meshes
```
```bash
npm install && npx vite --port 3021 --strictPort
```
Sinov (headless, sintetik qo'l va bosh, 13 ta tekshiruv) hamda soxta kamera bilan modellar ishga tushishi:
```bash
NA_URL=http://localhost:3021/ node scripts/shot-hands.mjs /tmp/hands
```
```bash
NA_URL=http://localhost:3021/ node scripts/shot-hands.mjs /tmp/hands-cam --camera
```
Foydalanuvchi sinovi: Chrome yoki Safari → `localhost:3021` → "⋯" menyusi → "Qo'l bilan boshqarish" / "Bosh bilan qarash (3D oyna)".

## 3. Master bilan tutashish nuqtalari (birlashtirishda ziddiyat shu yerlarda chiqadi)

- `src/scene/BrainScene.ts`: "External pointers" bloki (`externalHover`, `externalTap`, `orbitBy`, `dollyBy`, `hostElement`) va
  "Head-coupled perspective" bloki (`setEye`, `withEye`, `pick` → `pickRaw`). Render bloki `withEye(...)` ichiga o'ralgan,
  `aoWanted` esa `eyeMovingUntil` ni tekshiradi.
- `src/scene/SceneView.tsx`: `setActiveScene` qo'shilgan (2 qator) + yangi `src/scene/sceneRef.ts`.
- `src/ui/Header.tsx`: "boshqa" menyusiga `HandsMenuItem` qo'shilgan. `src/App.tsx`: `<HandsLayer />`.
- `src/index.css`: oxirida "Hand control" bloki. `package.json`: `@mediapipe/tasks-vision@1.2.3` (aniq versiya).
- Qolgan hammasi alohida: `src/hands/*`, `public/models/*` (7.8 MB + 0.23 MB), `scripts/shot-hands.mjs`.
- O'lcham: WASM 14.6 MB va modellar faqat funksiya yoqilganda yuklanadi; asosiy bundle'ga ta'siri kichik.

Branchni yangilash: worktree'da `git rebase master`. Hujjatlardagi ziddiyatlar (AI.md, HISTORY) odatda "ikkalasini ham qoldirish" bilan hal bo'ladi.

## 4. Ochiq qaror: qayerga qo'shiladi

| Variant | Mazmuni | Afzallik | Kamchilik |
|---|---|---|---|
| A. Veb, hamma uchun | Menyuda "tajribaviy" belgisi bilan | Bitta kod, darhol hamma ko'radi | Veb-kamera aniqligi past, brauzerlar orasida farq bor (GPU delegate), 15 MB qo'shimcha yuklama |
| B. Faqat Apple ilovasi | macOS: Vision framework (`VNDetectHumanHandPoseRequest`, yuz nuqtalari) native ishlaydi, natijalar `src/bridge/` orqali vebga uzatiladi. iPad: TrueDepth / ARKit yuz kuzatuvi (haqiqiy chuqurlik bilan "3D oyna") va Apple Pencil asbob sifatida | Aniqroq, tezroq, qurilma imkoniyatlaridan to'liq foydalanadi | Faqat Apple foydalanuvchilari, A1 bosqichiga bog'liq |
| C. Gibrid | Vebda yengil HP-1 ("3D oyna"). Qo'l va asbob simulyatori (HT-2, OP-*) Mac/iPad ilovasida native kuzatuv bilan | Har platformada eng yaxshisi | Ikki kiritish yo'li bo'ladi, lekin dvigatel bitta: kiritish qatlami allaqachon alohida (`HandFrame`, `FaceObs`) |

Qaror uchun ma'lumotni **AG-8** to'playdi (AI.md 5.4). Engine `HandFrame`/`FaceObs` ni qayerdan kelganiga qaramaydi:
sintetik, MediaPipe yoki kelajakda native ko'prik. Shuning uchun C varianti kodni qayta yozishni talab qilmaydi.

## 5. Keyingi bosqichlar (`PLAN.md` 5.8)

HT-2 (qo'ldagi asbob, chuqurlik, to'qnashuv) → virtual operatsiya xonasi (assetlar: AG-10) → kuzatiladigan qalam (chop etilgan
marker, 6DoF) + voksel burg'u + geympad titrashi → OP-1 EVD (kontent: AG-9) → OP-2 DBS → OP-3 trepanatsiya/pterional → OP-5 erkin rejalashtiruvchi.

## 6. Ma'lum cheklovlar

- Haqiqiy kamerada sinalmagan: chimdish chegarasi (0.30/0.46), burash sezgirligi, `HAND_SCALE` 0.85, `HEAD_GAIN_X` 3 kabi
  qiymatlar sintetik ma'lumot bo'yicha tanlangan.
- Qo'llar barcha panellar ustida chiziladi. Imo-ishoralar faqat 3D sahnani boshqaradi, kesim ko'ruvchisini emas.
- "3D oyna" effekti bir kishi uchun; yonidagilarga ekran suzayotgandek ko'rinadi.
- Headless WebGL taxminan 1.5 kadr/s ishlaydi, shuning uchun testlar vaqtni emas, `engine.ticks` ni kutadi.
