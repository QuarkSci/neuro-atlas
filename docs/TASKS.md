# Vazifalar taqsimoti — Claude Code va Antigravity (2026-11-21)

Ikki agent bitta repoda ishlaydi. Qoidalar: `AGENTS.md` (Antigravity) va `CLAUDE.md` (Claude) — bir xil.
**Har vazifa faqat o'z "Tegadigan fayllar"ini o'zgartiradi** — shunda ikki agent bir-birining ishini buzmaydi.
Antigravity har vazifani alohida branchda qiladi (`ag/<id>`), `master`ga to'g'ridan-to'g'ri push qilmaydi.

Holat belgilari: ⏳ kutmoqda · 🔨 ishlanmoqda (kim, sana) · 👀 tekshiruvga tayyor (branch) · ✅ birlashtirildi.

| ID | Vazifa | Kim | Holat |
|---|---|---|---|
| AG-1 | Kontent: Desikan, JHU, Destrieux, Glasser ta'riflari | Antigravity | ⏳ |
| AG-2 | Yorug' rejim: dars kartasi va kesim ko'ruvchisi ("qora orol") | Antigravity | ⏳ |
| AG-3 | Deploy: meshlar GitHub Release'da + Draco, README, ATTRIBUTION | Antigravity | ⏳ |
| AG-4 | Tadqiqot: U1 uchun ochiq gistologik manba; BigBrain 20 mkm plitkalar | Antigravity | ⏳ |
| CL-1 | AI panel haqiqiy kalit bilan ishlamayapti (Gemini) — tuzatish | Claude | ⏳ birinchi |
| CL-2 | AI-6: ChatGPT / Google hisobi bilan kirish; AI panel va Inspector ustma-ust | Claude | ⏳ |
| CL-3 | 5.1: 21 plastinkada chegaralar 100% tutashsin | Claude | ⏳ |
| CL-4 | Mavzu viktorinasi (kesim + dars) va Anki | Claude | ⏳ |
| CL-5 | R2 realizm (ambient occlusion), LG-3 harakat | Claude | ⏳ |

---

## AG-1 — Kontent: parcellation qatlamlari ta'riflari

**Nega:** Inspector kartasida Desikan (70), JHU (48), Destrieux (148), Glasser (360) qismlarining aksariyatida o'z matni
yo'q (oila matni meros qilinadi yoki bo'sh). Hozir yozuvlar: `src/data/content/*.json` — 487 ta (gross 112, Brodmann 41,
Julich 206 + guruhlar, miya ustuni, miyacha, tomirlar).

**Tartib (har biri alohida commit):** Desikan (~35 konsept) → JHU (~27) → Destrieux (~74) → Glasser (~179).
Konsept = chap+o'ng jufti; id'lar `src/data/parts.json` dagi `concept` maydonidan (qatlam: `layer`).

**Yozuv shakli** (mavjud fayllar bilan bir xil, masalan `brodmann.json`):
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
- Yangi fayllar: `src/data/content/desikan.json`, `jhu.json`, `destrieux.json`, `glasser.json`; ularni
  `src/data/content/index.ts` dagi `FILES` ro'yxatiga qo'shing.
- Matn talaba uchun (birinchi marta ko'rayotgan), qisqa; `clinical` — klassik klinik bog'lanish bo'lsa.
- **Har manba haqiqiy:** DOI → Crossref'dan sarlavha tekshirilsin (`https://api.crossref.org/works/<doi>`). Asosiy manbalar:
  Desikan 2006 (doi:10.1016/j.neuroimage.2006.01.021), Destrieux 2010 (doi:10.1016/j.neuroimage.2010.06.010),
  Glasser 2016 (doi:10.1038/nature18933), JHU — Mori/Oishi (Crossref bilan tekshiring). Ochiq darsliklar (NCBI Bookshelf) mumkin.
- O'zbekcha atamalar mavjud yozuvlar uslubida (masalan `gross-brain.json`), "Chap/O'ng" yozilmaydi.

**Tegadigan fayllar:** `src/data/content/{desikan,jhu,destrieux,glasser}.json` (yangi), `src/data/content/index.ts` (faqat `FILES`
va import qatorlari), `docs/HISTORY.md` (o'z bo'limi), `docs/TASKS.md` (holat).

**Tayyor mezoni:** har konsept id `parts.json`da mavjud (skript bilan tekshirilgan: noma'lum id = 0); JSON yaroqli;
`npx tsc ... && npm run build` o'tadi; 2 ta screenshot (Inspector kartasi, uz va en) — masalan Desikan qatlamida
`superior frontal` tanlanib; manbalar ro'yxati Crossref natijasi bilan.

---

## AG-2 — Yorug' rejim: dars kartasi va kesim ko'ruvchisi

**Nega:** yorug' rejimda (`theme: 'light'`) ikki panel hali qora qolgan ("qora orol"): dars kartasi `.lesson-panel` va kesim
ko'ruvchisi `.section-viewer` — ularga `.dark` sinfi yoki qora uchun yozilgan ranglar (`rgba(255,255,255,…)`, `#fff`) berilgan.
Tokenlar: `src/index.css` oxiridagi "Themes" bo'limi — `--ink` (qorada oq, yorug'da to'q), `--foreground`, `--background`,
`--fa-muted`, `--fa-fill`. Namuna: Inspector va AI panel allaqachon tokenlar bilan ishlaydi (`.inspector.glass`, `.ai-panel`).

**Qilish kerak:** qattiq yozilgan oq/qora ranglarni tokenlarga o'tkazish (`color-mix(in oklab, var(--ink) N%, transparent)`),
`.dark` majburlashini olib tashlash; sxema plastinkalari (SVG) ichidagi ranglar o'qilishini saqlash (sxema foni qorong'i
qolishi mumkin — figura uchun "qora maydon" maqbul, panel esa yorug'). Sahna yorliqlari (qora kapsulalar) — ixtiyoriy.

**Tegadigan fayllar:** `src/index.css` (faqat `.lesson-*`, `.section-viewer`, `.sv-*`, `.lz-*`, `.mc-*` bloklari),
`src/ui/LessonPanel.tsx`, `src/ui/SectionViewer.tsx` (faqat `className`), `src/ui/LesionPanel.tsx`, `src/ui/McDonaldPanel.tsx`
(faqat `className`/inline rang). **Tegmang:** `src/ai/**`, `src/ui/AIPanel.tsx`, mantiq (`useState`, hisob-kitob).

**Tayyor mezoni:** `node scripts/shot.mjs out.png --theme light` va `--theme dark` — dars ochiq va plastinka ochiq holatlarda
4 ta screenshot (yorug'da panel yorug', qorong'ida avvalgidek); `node scripts/audit-lesions.mjs` 0; tsc + build.

---

## AG-3 — Deploy (PLAN 3-bo'lim, 6-bosqich)

**Nega:** `.github/workflows/deploy.yml` GitHub Pages'ga quradi, lekin `public/meshes/` (196 MB) gitignore'da — saytda 3D
modellar yo'q. Reja (PLAN 4-bo'lim, xavflar): meshlarni Draco bilan siqish va GitHub Release asset sifatida joylash,
ilova ularni o'sha URL'dan yuklaydi; Pages 1 GB limit.

**Qilish kerak:** (1) meshlarni Draco'ga o'tkazish skripti (`pipeline/` ichida, yangi fayl) va hajm hisobi;
(2) `src/scene/loader.ts` da meshlar uchun bazaviy URL (`VITE_MESH_BASE`, standart — mahalliy `/meshes/`) va Draco dekoderi
(Three.js `DRACOLoader`, dekoder fayllari `public/` ga yoki CDN'siz); (3) Release'ga yuklash yo'riqnomasi (qo'lda yoki
workflow); (4) `README.md` (o'zbekcha + inglizcha) va `ATTRIBUTION.md` (har atlas: manba, litsenziya, havola —
`src/data/index.ts` dagi `LAYERS` va `pipeline/README.md` dan).

**Tegadigan fayllar:** `pipeline/tools/draco_*.py` yoki `scripts/draco-*.mjs` (yangi), `src/scene/loader.ts` (faqat URL va
dekoder), `.github/workflows/deploy.yml`, `README.md`, `ATTRIBUTION.md` (yangi), `vite.config.ts` (kerak bo'lsa).
**Tegmang:** `public/meshes/` ni commit qilmang; `BrainScene.ts`.

**Tayyor mezoni:** mahalliy dev o'zgarishsiz ishlaydi (screenshot); Draco meshlar bilan build `npm run preview` da yuklanadi
(screenshot); hajm jadvali (oldin/keyin); `audit-pick.mjs` diff 0.

---

## AG-4 — Tadqiqot (faqat hujjat, kod yo'q)

1. **U1 plastinkasi** (piramidalar kesishmasi) uchun real kesim yo'q: BigBrain hajmi u darajaga yetmaydi. Ochiq litsenziyali
   (CC BY-ND emas!) gistologik kesim manbalarini toping: manba, litsenziya, aniqlik, MNI ga moslash imkoni.
2. **BigBrain 20 mkm plitkalar** (zoomda yuklanadigan): manzil, format, hajm, litsenziya (hozirgisi 100 mkm, CC BY-NC-SA 4.0).

**Tegadigan fayllar:** `docs/research/u1-histology.md`, `docs/research/bigbrain-20um.md` (yangi), `docs/TASKS.md`.
**Tayyor mezoni:** har manba havolasi ochilib tekshirilgan, litsenziya sahifasidan iqtibos bilan; tavsiya va xavflar.

---

## CL-1 — AI panel haqiqiy kalit bilan ishlamayapti (Claude, keyingi sessiyada birinchi)

Foydalanuvchi Google (Gemini) kaliti bilan sinadi (2026-11-21):
1. `gemini-3.8-flash-lite-tts` avtomatik tanlandi → "Developer instruction is not enabled" — tuzatildi (`827e81d`: chatga
   yaramaydigan modellar filtri, tizim ko'rsatmasiz zaxira).
2. `gemini-3.8-flash` → 503 "high demand" — avtomatik qayta urinish va "Boshqa model" qo'shildi (`9b18a8f`).
3. Shundan keyin ham "bo'lmayapti, ishlamayapti" — **sababi aniqlanmagan.** Keyingi sessiyada foydalanuvchi bilan birga:
   DevTools → Network (so'rov URL, status, javob tanasi), model ro'yxati (`__ai.getState().models.google`), sahifa yangilangani
   (eski kod keshda qolmaganmi), bepul tarif cheklovlari (Pro modellari kvotasi), boshqa model (flash-lite) bilan sinash.
   Kalitni chatga yozdirmang — foydalanuvchi o'zi brauzerda kiritadi.

Qolgan CL vazifalar tafsiloti: `CLAUDE.md` "KEYINGI SESSIYA" va `PLAN.md` 5-bo'lim.
