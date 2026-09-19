# Neuro Atlas — loyiha holati (Claude uchun qo'llanma)

> Yangi chatda ishni davom ettirish uchun shu faylni va `PLAN.md`ni o'qing.
> Foydalanuvchi (MuhammadYusuf) o'zbek tilida yozadi, javoblar o'zbek tilida.
> Kod izohlari ingliz tilida.
>
> Oxirgi yangilanish: 2026-09-19 (repo yaratildi, 0-bosqich bajarildi).

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
- ⬜ 1-bosqich: pipeline sinovi — KEYINGI QADAM.
- ⬜ 2–7.

## 4. Ma'lum xatolar tarixi

(hali bo'sh — Falcon'dagi ro'yxatni takrorlamang)
