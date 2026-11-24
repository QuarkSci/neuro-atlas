# BigBrain 20 mkm plitkalar (zoomda yuklash tadqiqoti)

> **Vazifa:** AG-4 / 2-qism (`AI.md` §5.4) · **Sana:** 2026-11-24  
> **Joriy holat:** `public/sections/real/*.webp` fayllari BigBrain 100 µm hajmidan kesib olingan (CC BY-NC-SA 4.0). Zoom qilinganda hujayra darajasidagi (20 µm) tafsilotni yuklash yo'llari o'rganildi.

---

## 1. Rasmiy manzil, format, hajm va litsenziya (2026-11-24 jonli tekshiruv)

### 1.1 Jonli Neuroglancer Precomputed serveri (EBRAINS / HBP)
- **Manzil (`info` metama'lumoti):**  
  `https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/8bit/info` (HTTP `200`, **`Access-Control-Allow-Origin: *`** ✅)
- **Format:** `neuroglancer-precomputed` — 3D ko'p-rezolyutsiyali piramida (`type: "image"`, `data_type: "uint8"`, `num_channels: 1`, `encoding: "raw"` + HTTP `Content-Encoding: gzip`, chunk o'lchami **`64 × 64 × 64`** voksel).
- **Piramida darajalari (7 ta):**
  - `20um`: `6572 × 7404 × 5711` voksel (`[21.17, 20.0, 21.17] µm`)
  - `40um`: `3286 × 3702 × 2856`
  - `80um`: `1643 × 1851 × 1428`
  - `160um`: `822 × 926 × 714`
  - `320um`: `411 × 463 × 357`
  - `640um`: `206 × 232 × 179`
  - `1280um`: `103 × 116 × 90`
- **Hajm:**
  - To'liq 20 µm 3D hajm: `6572 × 7404 × 5711` ≈ **277.9 GB** (siqilmagan 8-bit) — GitHub Pages (1 GB) yoki GitHub Releases (2 GB/fayl) ga sig'maydi.
  - Bitta `64 × 64 × 64` chunk: `262 144 bayt` xom, tarmoqda `gzip` bilan **~20–80 KB** (2026-11-24 jonli sinov: `.../20um/3200-3264_3712-3776_2816-2880` → HTTP `200`, `CORS=*`, `gzip`, **`20 149 bayt`**!).
  - Bitta 2D kesimning zoom qilingan ko'rinishi (`512 × 512` px @ 20 µm): ~64 ta chunk ≈ **1.3–5 MB**.

### 1.2 Litsenziya
- **Litsenziya:** **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** (Forschungszentrum Jülich va MNI, [Amunts et al. 2013], DOI: `10.1126/science.1235381`).
- **Rasmiy sahifa iqtibosi (`https://bigbrainproject.org/maps-and-models.html`, 2026-11-24):**  
  *"The BigBrain is an open dataset accessible to anyone."* (bosh sahifada va litsenziya matnida `CC BY-NC-SA 4.0` / `CC BY-SA` eslatmalari; tarqatishda notijorat ta'limiy maqsad va to'liq attribution saqlanishi shart).
- **Litsenziya talabi:** `CC BY-ND` **emas** (kesish, plitkalash, WebP ga siqishga ruxsat bor), lekin `NC` (tijoriy sotuv taqiqlangan) va `SA` (hosila plitkalar ham shu litsenziyada bo'lishi kerak).

---

## 2. Brauzerda plitka sifatida berish yo'llari (2 ta arxitektura)

| Mezon | Variant A: To'g'ridan-to'g'ri EBRAINS Neuroglancer chunk oqimi | Variant B: Faqat 21 plastinka uchun oldindan kesilgan 2D WebP plitka piramidasi |
|---|---|---|
| **Qanday ishlaydi** | `ZoomPane` da zoom > 2× bo'lganda MNI/BigBrain kesim tekisligidagi ko'rinuvchi `64³` chunklar bevosita `neuroglancer.humanbrainproject.eu` dan `fetch()` qilinadi (`CORS: *`) va Web Worker'da 2D kesim `<canvas>` ga chiziladi. | `pipeline/tools/` skripti bilan faqat bizdagi 21 plastinka 20 µm da kesiladi (~1200–3500 px) → `256×256` WebP plitka piramidasi (DZI/XYZ) → GitHub Release asset (`histology-v1`, AG-3 `meshes-v1` kabi). |
| **Server / xosting hajmi** | **0 MB** (bizda hech narsa saqlanmaydi) | **~60–150 MB** (jami 21 plastinka × 2–7 MB WebP piramida) |
| **Brauzer kodi murakkabligi** | O'rta–yuqori (3D qiyshiq tekislik → `64³` chunk indekslari, trilinear kesish, LRU kesh) | **Oddiy** (standart 2D XYZ plitkalar `z/x/y.webp`, `ZoomPane` ga oson ulanadi) |
| **Tashqi serverga bog'liqlik** | **Yuqori** — EBRAINS serveri sekinlashsa yoki URL o'zgarsa ishlamay qoladi | **Nol** — GitHub Release CDN + oflayn/App Store ichida keshlash mumkin |
| **Ko'rinish sifati** | Istalgan burchak va darajada 20 µm (cheksiz kesimlar) | Faqat bizning 21 plastinkamiz (lekin 100% 2D WebP, tezkor yuklanish) |

---

## 3. Tavsiya va xavflar

- **Tavsiya (2 bosqichli):**
  1. **Asosiy (21 plastinka uchun — Variant B):** `SectionViewer` dagi mavjud 21 ta plastinka uchun 20 µm 2D WebP plitka piramidasini (`256×256` px, 3 daraja: `100µm` → `40µm` → `20µm`) oldindan `pipeline` da tayyorlab, GitHub Release'ga joylash. Bu `ZoomPane` da bir zumda (≤ 100 ms/plitka) ochiladi va EBRAINS serveri uzilishlariga chidamli.
  2. **PhD / erkin kesim uchun (keyinroq — Variant A):** Foydalanuvchi 3D atlasda ixtiyoriy tekislik kesganda `neuroglancer.humanbrainproject.eu` dan jonli `64³` chunklarni (`CORS: *`) to'g'ridan-to'g'ri oqim bilan yuklash (bunda 100 µm kesh har doim zaxira bo'lib turadi).
- **Xavflar:**
  - **BigBrain ↔ MNI152 farqi:** BigBrain anatomiyasi MNI152 o'rtacha shablonidan mahalliy no-chiziqli farq qiladi; 20 µm da kontur chegaralari (masalan, kichik miya ustuni yadrolari) 100 µm ga qaraganda sezilarliroq siljib ko'rinishi mumkin → konturlar ustida "taxminiy (≈)" izohi saqlanishi kerak.
  - **Tarmoq va xotira (iPad WKWebView):** 20 µm plitkalar faqat ko'rinuvchi viewport uchun yuklanishi va `canvas` LRU keshi ≤ 32 MB da cheklanishi shart (`docs/research/app-store.md`).
  - **Litsenziya:** `CC BY-NC-SA 4.0` sababli tijoriy versiya qilinadigan bo'lsa, BigBrain plitkalari chiqarib tashlanishi yoki alohida ruxsat olinishi kerak.

---

## 4. Tekshirilgan havolalar (Sana: 2026-11-24)

1. **BigBrain Project bosh sahifasi:** `https://bigbrainproject.org/` (HTTP 200 ✅)
2. **BigBrain Maps & Models (litsenziya sahifasi):** `https://bigbrainproject.org/maps-and-models.html` (HTTP 200 ✅)
3. **EBRAINS BigBrain 20 µm Neuroglancer `info` JSON:** `https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/8bit/info` (HTTP 200 ✅, `CORS: *`)
4. **Jonli 20 µm chunk sinovi:** `https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/8bit/20um/3200-3264_3712-3776_2816-2880` (HTTP 200 ✅, `gzip`, `20 149 bayt`)
5. **Amunts K et al. (2013):** *BigBrain: An Ultrahigh-Resolution 3D Human Brain Model.* Science. DOI: `10.1126/science.1235381` (Crossref API ✅)
