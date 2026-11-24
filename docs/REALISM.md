# Realizm rejasi: suyak ostidan miyagacha va odam boshi (RL)

> Yaratildi 2026-11-24 (foydalanuvchi talabi: "hammasi juda general, har detalga alohida agent"). Hujjat `docs/SURGERY.md` ning davomi.
> **Qaror (foydalanuvchi, 2026-11-24):** agentlar **aralash** (sahnaga tegadigan kod — Claude/subagentlar; asset va tadqiqot — Antigravity yo'laklari);
> hozir ochiladigan yo'laklar: **A) anatomiya (suyakdan miyagacha)** va **B) odam boshi (teri va yumshoq to'qima)**; sifat — **tibbiy video darajasi,
> Mac Chrome da ≥ 30 FPS** (iPad keyin). Qo'l/asboblar (C) va stol/xona (D) keyinroq. Anatomiya yo'li: **litsenziya muammosi bo'lmasin VA real chiqsin** → quyidagi 2-bo'lim.

## 0. Hozirgi muammolar (kuzatuv va o'lchov)

1. Suyak teshilgach (SX-4) pastda **havo**: tomirlar va miya havoda muallaq ko'rinadi. Oraliq qatlamlar yo'q: arachnoid, subaraxnoidal likvor, pia, subdural bo'shliq.
2. O'lchov (Kocher nuqtasi, o'ng): suyak 6.03 mm; qattiq parda (`g-cerebral-hemisphere-segment-of-dura-mater`) suyak tagida 6.09 mm da — **dura bor**.
   Meninges faqat 4 ta mesh: dura segmenti, falx, tentorium (2). Konveksitet bo'ylab to'liq dura yo'q, arachnoid va pia yo'q.
3. Miya po'stlog'i **55 ta alohida g'ijim mesh** (`telencephalon`, ≈ 3–3.5 ming yuz har biri): bitta yaxlit po'stloq yuzasi yo'q, silliq "bo'laklar". Tomirlar 246 ta mesh (437 ming yuz) — po'stloq yuzasiga **moslashmagan**.
4. Bosh terisi suyakdan offset bilan yasalgan umumiy "bo'lak" (`src/or/scalp.ts`): yuz, soch, quloq, teri qatlamlari yo'q.
5. Qo'l umuman o'xshamaydi; stol/xona sodda (C, D — keyinroq).

## 1. Maqsad qatlam ketma-ketligi (teridan po'stloqqacha; qalinliklar TAXMINIY, AG-21 manba bilan tasdiqlaydi)

| Qatlam | Taxminiy qalinlik | Hozir | Reja |
|---|---|---|---|
| Teri (epidermis + dermis) | 3–6 mm | umumiy offset mesh | B-1 |
| Teri osti yog' | 2–6 mm | yo'q | B-1 |
| Galea aponeurotica + bo'sh biriktiruvchi to'qima | 1–3 mm | yo'q | B-1 |
| Perikranium | ≈ 0.5 mm | yo'q | B-1 |
| Suyak (tashqi plastinka / diploe / ichki plastinka) | 6 mm (o'lchandi) | SX-4 voksel | tayyor |
| Epidural (potentsial) | 0 | — | A-3 |
| Dura | 0.3–1 mm | bitta segment | A-3: to'liq konveksitet |
| Subdural (potentsial) | 0 | — | A-3 |
| Arachnoid (+ trabekulalar) | 0.1–0.2 mm | yo'q | A-3 |
| Subaraxnoidal likvor | 1–5 mm (egatlarda chuqurroq) | yo'q | A-3 (shaffof suyuqlik) |
| Pia | ≈ 0.02 mm | yo'q | A-5 (yaltiroq parda sifatida) |
| Po'stloq (kulrang modda) | 2.5–4 mm | 55 bo'lak | A-1 |

## 2. Yondashuv: "litsenziya toza + real" (foydalanuvchi talabi)

Tashqi tayyor bosh modeli (litsenziya, koordinata mos kelmasligi xavfi) ham, faqat protsedural (sun'iy ko'rinish) ham emas. **Gibrid:**
- **Tuzilma** — o'z atlas meshlarimizdan (koordinatalar va nomlar saqlanadi): po'stloq yuzasi birlashtiriladi, qatlamlar undan offset bilan, tomirlar yuzaga yopishtiriladi.
- **Real detal** — ikki manbadan, ikkalasi ham litsenziyasi tekshirilgan: (a) **ochiq ma'lumotli sirt** (BigBrain, fsaverage, HCP, MNI152 CIVET va b. — AG-19 litsenziyani o'qib tanlaydi; NC ruxsat etiladi, ND yo'q) po'stloq egatlari uchun; (b) **protsedural PBR**: ho'l to'qima
  shaderi (yaltiroq parda, mikro-relyef, taxminiy sub-surface), po'stloq ranglari, tomir devori, pulsatsiya, likvor (shaffof, sinish). Teri/soch/ko'z uchun faqat **CC0 / CC BY** assetlar (masalan CC0 MakeHuman bazaviy mesh — AG-22 tekshiradi).
- Shu tufayli: litsenziya muammosi minimal (har manba `source` da), tashqi koordinata mos kelmasligi yo'q (atlasga register qilinadi), natija esa sun'iy "bo'lak" emas.

## 3. Ish paketlari

### A — Anatomiya (suyakdan miyagacha) — kod: Claude (+ subagentlar), tadqiqot: AGY
| ID | Vazifa | Kim | Tayyor mezoni |
|---|---|---|---|
| **A-0** | Audit: 5 nuqtada (Kocher, pterional, vertex, oksipital, temporal) suyak → dura → po'stloq masofalari; po'stloqdan > 1 mm uzoqdagi tomir segmentlari soni va ulushi; skrinshotlar | CC | raqamlar `docs/HISTORY.md` da; qaysi tomirlar "havoda" ekani ro'yxati; A-1…A-4 hajmi aniq |
| **A-1** | Yaxlit po'stloq yuzasi: 55 bo'lakni voksellashtirish → marching cubes → silliqlash → bitta suv o'tkazmaydigan mesh; gyrus id lari vertex yorlig'i (bosish/nom saqlanadi). Real egat tafsiloti uchun AG-19 tavsiyasi (ochiq sirt) bilan solishtirish | CC | bitta mesh, ≤ 600k yuz (LOD), nomlar saqlanadi, `audit-pick` diff 0 |
| **A-2** | Realistik po'stloq yuzasi: AG-19 tanlagan ochiq sirtni atlasga register qilish (affin + mahalliy), yoki A-1 + displacement | CC (AG-19 dan keyin) | egat chuqurligi manbaga mos; register xatosi mm da hujjatlashtirilgan |
| **A-3** | Meninges to'plami: konveksitet dura (ichki suyak yuzasidan offset 0.3–1 mm), arachnoid, subaraxnoidal likvor (shaffof suyuqlik: sinish, egatlarda chuqur), pia; dura ochish operatsiyasi (kesish, burish) | CC | suyak teshilgach: dura → likvor → po'stloq tartibi ko'rinadi, havo yo'q; kadr byudjeti ≤ 6 ms |
| **A-4** | Tomirlarni po'stloqqa yopishtirish: markaz chiziqlarini yuzaga relaksatsiya, egatlarga cho'kish; yetishmagan mayda pial tomirlarni protsedural o'stirish; ko'prik venalar → yuqori sagittal sinus; devor shaderi, arterial pulsatsiya | CC (+ AG-20 tadqiqot) | po'stloqdan > 0.5 mm uzoqda "havoda" tomir 0; vizual: tomirlar yuzaga yotadi |
| **A-5** | Ho'l to'qima shaderi va yorug'lik: pia yaltirashi, mikro-relyef, taxminiy SSS, rang (AG-21 referens) | CC | qora/yorug' rejimda screenshot, ≥ 30 FPS Mac |
| **A-6** | Dinamika: likvor oqishi dura ochilganda, miya pulsatsiyasi, brain shift (DBS modeli bilan bog'lash) | CC | videoda tabiiy; DBS shift mos |

### B — Odam boshi (teri va yumshoq to'qima)
| ID | Vazifa | Kim | Tayyor mezoni |
|---|---|---|---|
| **B-1** | Qatlamli bosh terisi (teri, yog', galea, perikranium, temporal mushak) va kesim: EVD "incision" qadamida teri kesiladi, qatlamlar ochiladi, retraktor | CC (+ AG-21 qalinliklar) | kesim chizig'i bo'ylab qatlamlar ketma-ket ko'rinadi |
| **B-2** | Real bosh/yuz: CC0/CC BY bazaviy mesh (AG-22 tanlaydi), atlas skulliga mos deformatsiya (teri qalinligi xaritasi), teri PBR + SSS, soch (kartalar), ko'z, quloq | CC (AG-22 dan keyin) | yuz tanish odam ko'rinishida; bosh suyagiga kirmaydi; ≥ 30 FPS |
| **B-3** | Steril qoplamalar, Mayfield pinlar, teri tozalash rangi, belgi chiziqlari | CC / keyin AGY asset | amaliy ko'rinish |

### Antigravity yo'laklari: avval qisqa tadqiqot, KEYIN o'zi real narsa quradi (foydalanuvchi talabi, 2026-11-24)
Har yo'lak ikki bosqich: **(1)** ≤ 1 kunlik tadqiqot hujjati (manba, litsenziya, usul tanlovi); **(2)** shu asosda **o'zi qurgan, sinovdan o'tkazilgan mahsulot**
(pipeline vositasi yoki sof modul) va qabul skripti. Sahnaga (BrainScene, orMode, UI) ulashni Claude qiladi; AGY faqat o'z fayllarida ishlaydi va `docs/handoff/<id>.md` ga
natijani, o'lchovni va screenshotni yozadi. Qabul mezoni bajarilmasa branch "tayyor" emas (AI.md 6.2).

| ID | (1) Tadqiqot | (2) QURADI | Tegadigan fayllar | Qabul (AGY o'zi yuguradi) |
|---|---|---|---|---|
| **AG-19** | Realistik po'stloq yuzasi manbalari (BigBrain, fsaverage, HCP, CIVET; litsenziya, format, MNI ga moslash) → `docs/research/cortex-surface.md` | **A-1 pipeline:** `pipeline/tools/pial_surface.py` — 55 ta `telencephalon` g'ijimini voksellashtirish (0.5 mm) → marching cubes → Taubin silliqlash → decimate (≤ 600k yuz) → bitta suv o'tkazmaydigan mesh; har vertexga gyrus id (eng yaqin asl mesh) | `pipeline/tools/pial_surface.py`, `public/meshes/gross/pial-unified.glb` (gitignore), `data/gross_pial_labels.json`, `scripts/audit-pial.py`, `pipeline/README.md` (retsept) | watertight; hajm asl birlashmadan ±3 %; Hausdorff ≤ 0.6 mm; yorliqlar 100 %; vaqt va hajm yozilgan |
| **AG-20** | Pial tomirlar realizmi (ochiq to'plamlar, protsedural o'stirish adabiyoti, devor/rang/pulsatsiya) → `docs/research/pial-vessels.md` | **A-4 vosita:** `pipeline/tools/vessel_snap.py` — tomir meshlarining markaz chizig'i va radiusi, po'stloq yuzasiga ≤ 6 mm ichida bo'lganlarni relaksatsiya bilan yuzaga yopishtirish (egatga cho'kish); `pial_vessels_grow.py` — yuzada mayda tomirlarni o'stirish (space colonization) | `pipeline/tools/vessel_snap.py`, `pipeline/tools/pial_vessels_grow.py`, `public/meshes/gross/vessels-snapped.glb`, `scripts/audit-vessels.py` | yuzaga ≤ 6 mm yaqin tomir uzunligining ≥ 95 % i po'stloqdan ≤ 0.5 mm; o'z-o'zini kesish 0; hajm (yuz soni) ≤ asl × 1.5 |
| **AG-21** | Qatlam qalinliklari va to'qima ranglari (DOI/PMID) → `docs/research/layer-thickness.md` (REALISM.md 1-bo'lim jadvalini tasdiqlash/tuzatish) | **A-3 generator:** `pipeline/tools/meninges_shells.py` — ichki suyak yuzasidan dura (konveksitet), po'stloqdan arachnoid va pia qobig'i (qalinlik xaritasi bilan), likvor hajmi chegarasi; `src/or/anatomy/layers.ts` — qalinliklar `Sourced<T>` bilan tipli | `pipeline/tools/meninges_shells.py`, `public/meshes/gross/meninges-*.glb`, `src/or/anatomy/layers.ts`, `scripts/audit-meninges.py` | qobiqlar bir-birini kesmaydi; o'lchangan qalinlik jadvaldagi diapazonda; suyak tagidagi dura mavjud dura meshiga mos (≤ 1 mm) |
| **AG-22** | Real bosh/yuz assetlari (CC0/CC BY: MakeHuman/MPFB, Smithsonian 3D va b.), teri PBR, soch, ko'z, quloq → `docs/research/head-assets.md` | **B-2 vosita:** `pipeline/tools/head_fit.py` — bazaviy boshni atlas skullga non-rigid moslash (teri qalinligi xaritasi bilan, suyakka kirmaydi) → `public/or/head.glb` + teri teksturalari | `pipeline/tools/head_fit.py`, `public/or/head.glb`, `public/or/skin/*`, `scripts/audit-head.py`, `ATTRIBUTION.md` | teri–suyak masofa ≥ minimal qalinlik hamma joyda; kirish 0; ≤ 150k yuz; fayl ≤ 20 MB |
| **AG-23** | (tadqiqot qisqa) ho'l to'qima shaderi: SSS taxminlari, ho'l yuza modellari, real vaqtli usullar → `docs/research/wet-tissue-shading.md` | **A-5 modul:** `src/or/anatomy/wetTissue.ts` — three.js material quruvchi (po'stloq/pia/tomir/dura/teri preset), `onBeforeCompile` bilan, `clippingPlanes` ga tegmaydi; mustaqil sinov sahifa `scripts/shader-demo.html` va skript (qora/yorug', FPS o'lchovi) | `src/or/anatomy/wetTissue.ts`, `scripts/shader-demo.html`, `scripts/shot-shader.mjs` | demo sahifada har preset screenshot (qora+yorug'); Mac Chrome da ≥ 60 FPS demo, sahna ichida ≥ 30 FPS ni Claude tekshiradi |

Tartib: AG-19 (A-1) birinchi (hammasi unga tayanadi; AG-20 va AG-21 tadqiqot bosqichi parallel, qurish bosqichi A-1 natijasi bilan); AG-22 va AG-23 mustaqil, parallel.
Yangi `src/or/anatomy/` papkasi AGY niki (sof modullar); sahnaga ulash `src/or/` boshqa fayllarida Claude'da.

## 4. Tartib

1. **A-0 audit** (CC, 1 sessiya) — hajm aniq bo'ladi; shu paytda AG-19…AG-23 parallel boshlanadi.
2. **A-1 → A-3 → A-4** (ketma-ket, po'stloq yuzasi hammasiga asos); A-2 AG-19 tayyor bo'lgach.
3. **B-1** (A-3 bilan parallel mumkin, boshqa fayllar), **B-2** AG-22 dan keyin.
4. A-5, A-6, B-3 — oxirida.
5. Keyin: C (qo'l, asboblar), D (stol, xona) — shu hujjatga qo'shiladi.
Har bir paket: screenshot (qora + yorug'), kadr byudjeti o'lchovi, referens bilan yonma-yon solishtirish; har yangi funksiyaga PhD darajasidagi imkoniyat (masalan: qatlam qalinligi xaritasi eksporti, po'stloq–suyak masofa xaritasi).

## 5. Xavflar

- Birlashtirilgan po'stloq yuzasi tanlash (bosish, yorliq, `audit-pick`) dvigatelini buzmasligi kerak: tanlash gyrus bo'laklari bo'yicha qoladi, ko'rinish yaxlit mesh bilan.
- Po'stloq mesh hajmi va likvor shaderi Mac FPS ga ta'siri: LOD va chunk bo'yicha yuklash.
- Ochiq sirt (BigBrain/fsaverage) va BodyParts3D tomirlari orasidagi register xatosi: tomirlar A-4 da yuzaga moslanadi, shuning uchun mm xato ko'rinmaydi, lekin anatomik aniqlik o'lchovi (register xatosi) hisobotga yoziladi.
- Real teri/yuz assetlari uchun CC0 sifati noaniq: bo'lmasa B-2 protsedural (displacement + PBR) bilan boshlanadi.
- Bu hujjatdagi qalinliklar TAXMINIY; klinik aniqlik talab qilinadigan joyda AG-21 manbasisiz ishlatilmaydi.
