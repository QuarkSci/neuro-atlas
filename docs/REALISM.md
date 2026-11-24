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

### Antigravity yo'laklari (tadqiqot va asset; faqat hujjat/asset, `src/` ga tegmaydi)
| ID | Vazifa |
|---|---|
| **AG-19** | Realistik po'stloq yuzasi manbalari: BigBrain sirtlari, fsaverage, HCP group average, MNI152 CIVET va b. — litsenziya sahifasidan iqtibos (ND yo'q; NC mumkin), format, ko'pburchak soni, MNI ga moslash, hajm; tavsiya bitta |
| **AG-20** | Pial qon tomirlar realizmi: ochiq tomir atlaslari/to'plamlari (litsenziya), protsedural tomir o'stirish adabiyoti (space colonization, L-system, DOI bilan), arteriya/vena rang va devor tuzilishi, pulsatsiya chastotalari |
| **AG-21** | Qatlam qalinliklari va rang referenslari: bosh terisi, galea, perikranium, dura, arachnoid, subaraxnoidal likvor (konveksitet va egatlarda), po'stloq — **DOI/PMID bilan** (bu hujjatdagi 1-bo'lim jadvalini tasdiqlash yoki tuzatish); to'qima ranglari (ho'l po'stloq, dura, tomirlar) uchun ochiq manbalar |
| **AG-22** | Real bosh/yuz assetlari: CC0 / CC BY bazaviy bosh (MakeHuman/MPFB CC0, Smithsonian 3D, Sketchfab CC0 va b.), teri PBR teksturalari (CC0), soch kartalari, ko'z, quloq; litsenziya iqtibosi, ko'pburchak soni, UV, atlas skullga moslash usuli (non-rigid registration) |

## 4. Tartib

1. **A-0 audit** (CC, 1 sessiya) — hajm aniq bo'ladi; shu paytda AG-19…AG-22 parallel boshlanadi.
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
