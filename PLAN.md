# Neuro Atlas — reja

> Neyroxirurg va neyroanatomlar uchun **oltin standart** bo'ladigan ochiq,
> bepul, ta'limiy 3D neyroanatomiya exploreri. Falcon Atlas
> (https://github.com/QuarkSci/falcon-atlas) poydevorida quriladi.
>
> Tamoyil (foydalanuvchi so'zi bilan): **"perfektlik vaqtdan ustun"**.
> Har bir bosqich haqiqiy brauzerda screenshot bilan tasdiqlanadi.

## 0. Qat'iy qarorlar (2026-09-19)

| Savol | Qaror |
|---|---|
| Litsenziya | Faqat ochiq, mutlaqo bepul, ta'limiy. Kommersiya YO'Q — demak CC BY-NC manbalar ham mos. **CC BY-ND manbalar mos EMAS** (mesh hosil qilish derivativ ish). |
| Ko'lam (v1) | Miya + miya ustuni + miyacha + qorinchalar + tomirlar (arterial/venoz) + bosh nervlar (I–XII) + meninges + bosh suyagi. **Orqa miya — v2** (v1 bitgach). |
| Nom / repo | `neuro-atlas`, GitHub `QuarkSci/neuro-atlas`, sayt `quarksci.github.io/neuro-atlas/` |
| Boshlanish | Yangi repo; Falcon'dan UI/scene/store kerakli fayllari ko'chiriladi (fork emas). |
| Yangilik | Bitta atlas emas — **bir nechta parcellation qatlamlari almashtiriladi** (Brodmann / Desikan / Destrieux / Glasser / Julich) va gross anatomiya (BodyParts3D) bilan bitta sahnada. Bunday ochiq brauzer vositasi hozircha yo'q. |
| Tillar | `uz` / `en` / `la` (Terminologia Anatomica). |
| Kredit | Pastki burchakda `by MuhammadYusuf · with Claude`. |

## 1. Manbalar auditi (0-bosqich natijasi)

Litsenziyalar 2026-09-19 da tekshirilgan. `?` — hali tasdiqlanmagan,
yuklab olishda qayta tekshiriladi.

| Qatlam | Manba | Litsenziya | Holat | Taxminiy qismlar |
|---|---|---|---|---|
| **Gross anatomiya** (gyrus/sulcus, yadrolar, miya ustuni, miyacha, qorinchalar, bosh nervlar, tomirlar, sinuslar, meninges, bosh suyagi) | BodyParts3D / Anatomography 4.3 (DBCLS, Yaponiya), OBJ, FMA identifikatorlari bilan | **CC BY-SA 2.1 JP** | ✅ mos | 3210 mesh (butun tana) → nerv tizimi + bosh ~600 |
| Gross anatomiya — tozalangan/yaxshilangan versiya | Z-Anatomy (BodyParts3D'dan olingan, Blender) | **CC BY-SA 4.0** | ✅ mos — birinchi navbatda SHU (sifatliroq) | — |
| **Brodmann** | Talairach atlas "ba" darajasi (nilearn `fetch_atlas_talairach`) — Talairach fazosi, MNI'ga transformatsiya kerak | ochiq (Talairach Daemon) `?` | ⚠ tekshirish | 52×2 |
| ~~Brodmann (alternativ)~~ | (kerak bo'lmadi — neuroparc Brodmann ishlatildi) |
| Brodmann (alternativ, eski) | Julich-Brain'dan Brodmann'ga mos sitoarxitektonik hududlar (BA1,2,3a,3b,4a,4p,6,17,18,44,45…) | CC BY-NC-SA 4.0 | ✅ mos | — |
| **Desikan-Killiany / Destrieux** | FreeSurfer `fsaverage` aparc — FreeSurfer litsenziyasi ro'yxatdan o'tishni talab qiladi; MNI'dagi qayta tarqatilgan nusxa: G-Node "FreeSurfer parcellations in MNI space" | FS: registratsiya; G-Node `?` | ⚠ tekshirish | 68 / 148 |
| **Glasser HCP-MMP1** | BALSA / Kevin Weiner MNI versiyasi | WU-Minn HCP Open Access Data Use Terms — qayta tarqatish shu shartlar ostida mumkin, attribution shart | ✅ mos (shartlar ATTRIBUTION'da) | 360 |
| **Julich-Brain v3.x** (sitoarxitektonika, ~300 hudud, MNI152 + fsaverage) | EBRAINS / siibra | **CC BY-NC-SA 4.0** | ✅ mos | ~300 |
| Po'stloq osti + talamus | FreeSurfer aseg (MNI'dagi nusxa) + THOMAS talamus yadrolari `?` | ⚠ tekshirish | ~40 + ~25 |
| **Miyacha bo'laklari** | SUIT / Diedrichsen 2009 (`DiedrichsenLab/cerebellar_atlases`, MNI152NLin6) | **CC BY-NC 3.0** (repo LICENSE; README CC BY deydi — qat'iyrog'i olindi; 0-bosqichdagi "ND" taxmini 2026-09-20 da tekshirilib NOTO'G'RI chiqdi) | ✅ 28 bo'lak + dentate/interposed | 32 |
| **Miya ustuni bo'linmalari** | Allen Human Reference Atlas – 3D 2020 (Ding et al.), ICBM 2009b sym, 0.5 mm | **CC BY 4.0** (2022-09 dan) | ✅ tegmentum/basis/piramida/olive/oyoqchalar/pretektum (22) | 22 |
| **Miya ustuni uyg'onish yadrolari** | Harvard Ascending Arousal Network Atlas v2.0 (Edlow & Kinney 2023, Zenodo 8161638) | **CC0** | ✅ LC, DR, MnR, PAG, VTA, PTg, LDTg, PBC, PnO, mRt | 16 |
| ~~Miya ustuni 31 yadro~~ | Brainstem Navigator (MGH, Bianciardi) | "YOU MAY NOT DISTRIBUTE ... information derived" | ❌ tarqatish taqiq | — |
| ~~Miya ustuni traktlari~~ | USC brainstem connectome atlas (Tang 2018, NITRC) | xuddi shunday taqiq | ❌ | — |
| Miyacha (alternativ) | BodyParts3D miyacha bo'laklari + Julich-Brain miyacha yadrolari (dentate, fastigial…) | CC BY-SA / BY-NC-SA | ✅ mos | ~20 |
| **Oq modda traktlari** | TractSeg 72 bundle (MNI, probabilistik) | **CC BY** | ✅ mos | 72 |
| Harvard-Oxford, AAL, Schaefer… (qo'shimcha qatlamlar) | neuroparc (neurodata) | atlasga qarab `?` | keyinroq | — |
| Allen Human Reference Atlas 3D (141 hudud) | Allen Institute | **CC BY 4.0** (README.pdf, 2022-09-01 dan) | ✅ miya ustuni qismi olindi; amigdala 9 yadro, gippokamp bosh/tana/dum, kaudat 3, BNST, septal, bazal old miya — keyinroq | 141 |

**Umumiy hisob:** ~600 (gross) + 104 (Brodmann) + 216 (DK+Destrieux) + 360
(Glasser) + 300 (Julich) + 65 (subkortikal/talamus) + 72 (traktlar) ≈
**1700+** qism. Ustma-ust tushadigan po'stloq qatlamlari almashtiriladi,
qolganlari doim bor.

## 2. Arxitektura

### 2.1 Ma'lumotlar pipeline'i (`pipeline/`, Python)

```
data/raw/<source>/           ← yuklab olingan asl fayllar (gitignore)
pipeline/
  fetch_*.py                 ← har bir manba uchun yuklab oluvchi
  volume_to_meshes.py        ← NIfTI label → marching cubes (skimage)
                                → silliqlash (Taubin) → decimate (pymeshlab)
                                → har bir label alohida mesh
  obj_to_gltf.py             ← BodyParts3D/Z-Anatomy OBJ → tozalash → glTF
  build_catalogue.py         ← barcha manbalarni bitta parts.json'ga:
                                id, name{uz,en,la}, system, layer, parent,
                                source, mesh url, bbox, centroid (MNI)
public/meshes/<layer>/<id>.glb   ← Draco siqilgan (gitignore; Release'ga)
src/data/parts.json              ← katalog (commit qilinadi)
```

Barcha meshlar **MNI152 fazosida**, millimetrda, RAS orientatsiya.
BodyParts3D o'z fazosida — MNI'ga affine bilan tekislanadi (bir marta
qo'lda kalibrlanadi, `pipeline/align_bp3d.json`).

### 2.2 Ilova (`src/`, Falcon'dan ko'chirish)

Ko'chiriladi (deyarli o'zgarishsiz): `index.css` (Liquid Glass),
`store/useAtlas.ts`, `ui/*` (Flight.tsx dan tashqari), `scene/PointerTap.ts`,
`scene/materials.ts`, `scene/ground.ts`, `i18n/*`, `scripts/shot.mjs`,
`vite.config.ts`, `.github/workflows/deploy.yml`.

Yangi:
- `scene/BrainScene.ts` — RocketScene'dan: orbit, pivot, DOM insets, warmUp,
  isolate, hover. **Yangi:** glTF lazy loader, `three-mesh-bvh` raycast,
  3 tekislikli kesim (sagittal/koronal/aksial, MNI koordinata bilan),
  parcellation qatlamini almashtirish. Flight/flame/audio — yo'q.
- `data/types.ts` — `Part` ga `layer`, `source`, `mni: [x,y,z]`,
  `name.la` qo'shiladi; `SystemId` neyroanatomik tizimlar.
- `ui/LayerSwitch.tsx` — po'stloq parcellation tanlovi.
- `ui/PlanesPanel.tsx` — CutawayPanel o'rniga 3 slayder + koordinata.
- Inspector foni to'qroq (matn o'qilishi uchun), pastki burchak krediti.

### 2.3 Tizimlar (`SystemId`, v1)

`telencephalon`, `diencephalon`, `brainstem`, `cerebellum`, `ventricles`,
`white-matter`, `cranial-nerves`, `arteries`, `veins`, `meninges`, `skull`.
Har bir po'stloq parcellation — `layer` (`gross | brodmann | dk | destrieux |
glasser | julich`), tizim emas.

## 3. Bosqichlar

| # | Bosqich | Tayyor mezoni |
|---|---|---|
| 0 | Manbalar auditi | ✅ jadval yuqorida; `?` lar 1-bosqichda hal qilinadi |
| 1 | Pipeline sinovi | ✅ 2026-09-19: BodyParts3D 77 qism + Julich 414 hudud → GLB, MNI fazosida ustma-ust (RMS 5.3 mm), brauzerda tasdiqlangan |
| 2 | Ilova skeleti | ✅ 2026-09-19: Falcon UI/scene ko'chirildi, 585 qism, barcha asosiy interaktivlik brauzerda tasdiqlangan |
| 3 | To'liq import | ✅ 2026-09-20: 1571 qism, 7 qatlam (gross 355 + Julich 508 + Brodmann 82 + Desikan 70 + Destrieux 148 + Glasser 360 + JHU 48), qatlamlar talab bo'yicha yuklanadi, parcellation almashtirish |
| 3b | Miya ustuni / miyacha chuqurlashtirish | ✅ 2026-09-20: `bstem` (Allen 22 + AAN 16) va `suit` (32) qatlamlari, gross +24 (precuneus, cuneus, SPL, septum, crus cerebri, 9 gipotalamus yadrosi…) → 1672 qism, 9 qatlam; `Layer.covers`, peel 8-qobiq, kontent 62 yozuv + `name.uz` mexanizmi |
| 4 | Kesim + qatlamlar | ✅ 2026-09-25: 3 mustaqil tekislik (sagittal/koronal/aksial, birga qo'shilib burchak kesim beradi) + 8 ta klassik o'quv darajasi (medulla 3, ko'prik 2, o'rta miya 2, talamus 1), har darajadagi tuzilmalar ro'yxati haqiqiy MNI bbox'dan hisoblanadi; parcellation almashtirish 3-bosqichda qilingan |
| 4b | Ko'ndalang kesim atlasi | ✅ 2026-10-02: 17 interaktiv sxema (uzunchoq miya 4, ko'prik 3, o'rta miya 3, talamus 2, gipotalamus 4, miyacha 1), ~150 tuzilma uz/en/lat + vazifa + zararlanish, daraja bo'yicha qon ta'minoti va sindromlar, 3D daraja chiziqlari, neyraksisga perpendikulyar qiyshiq 3D kesim, viktorina |
| 4c | Kesim ko'rinishlari | ✅ 2026-10-03: 3D daraja konturlari bitta toza tashqi chiziq (orqasi yashirin), zinapoya yorliqlar; sxemalar atlas-plastinka uslubida (fon to'qima nomlangan, shaffofmas, kattadan kichikka, raqamlar avto-ajratiladi, ustma-ust audit); Mielin/Nissl bo'yoq ko'rinishlari; Atlas (MNI) — haqiqiy meshlar kesimi, MNI kursor, mm², markaz, mm shkala; tekislik tenglamasi |
| O'rganish | Kesimlar + Darslar bitta tabda | ✅ 2026-10-09: mavzular bo'yicha (7 mavzu), har mavzuda 3D dars + kesim plastinkalari, dars ↔ kesim havolalari, 3D'da faqat mavzu markerlari; pastda 3 tab |
| Darslar | 3D qadamma-qadam darslar | ✅ 2026-10-09: 4-tab Darslar — qorinchalar va likvor yo'li (8), qadoqsimon tana (7), gippokamp/fornix/Papez (6): fokus + xira kontekst, o'quv ranglari, 3D yorliqlar, oqim animatsiyasi, Eslab qoling / Chuqurroq qutilari, 3D'da bosiladigan viktorina |
| 5.5 | Zoom, real kesim, tomirlar | ✅ 2026-11-17: plastinkalarda zoom/surish/to'liq ekran; real kesim 21/22 (K3, Mc tuzatildi; T2, G4 eng yaqin kesimdan; U1 manba yo'q); 68 juftsiz tomirga ko'zgu juft (affin moslangan, belgilangan) |
| 5.3 | Yo'llar va shikastlanish | ✅ 2026-11-17: CST / DCML / ALS bekatlari (`pathways.ts`), 3 ta 3D dars, plastinkalarda yo'l yoritish (←/→ yo'l bo'ylab), "Shikastlanish" tabi: daraja×tomon×hudud → yo'qotish jadvali + sindrom; teskari rejim (belgilar → o'choqlar). ✅ 2026-11-17: o'choq plastinkada (Tatu havzalari, `audit-lesions.mjs` 0) va 3D da (shar, oqim o'choqda to'xtaydi, Waller). ✅ kalla nervlari: 14 belgi, teskari rejimda ajratuvchi belgilar, 3D darsda belgilar qadami. ✅ trigeminotalamik yo'l (4-yo'l, yuz). ✅ 2026-11-19: erkin o'choq — plastinkani bosib disk qo'yish (≈ mm radius, tuzilmalar ulushi, klassik hududlar bilan ustma-ustlik %, o'rta chiziq → ikki tomonlama). ✅ 2026-11-21: vaqt o'qi + McDonald 2017/2024 (DIS/DIT, Gd+, likvor, TS keysi); erkin o'choqlar 3D da (plastinka → MNI affin registratsiya); real kesim/atlasda bosib o'choq qo'yish. |
| BG-1 | Bazal yadrolar: kesimlar | ✅ 2026-10-09: `basal-ganglia` tizimi (20 qism), B1–B5 masshtabli plastinkalar (accumbens, AC/VP/Ch4, GPe/GPi/ansa, STN/Forel H-H1-H2, ichki kapsula aksial), 30 yangi tuzilma PhD tafsilot bilan. Keyin BG-2 yo'llar, BG-3 kasallik simulyatori, BG-4 halqalar/DBS/3D |
| UI-2 | Yorug' rejim | ✅ 2026-11-15: tema almashtirgichi, `--ink` tokeni, yorug' sahna foni va yoritish, shisha yorug' varianti (Figma kiti). Dars kartasi va kesim ko'ruvchisi hozircha qora orol. Shisha: shaffofroq, bo'rtiq, slayder kit o'lchamida |
| UI-1 | Interfeys: iPad uslubidagi tuzilish | ✅ 2026-11-15: tab bar (Atlas / O'rganish + qidiruv), yon panel (tizimlar yoki mavzular), ko'rinish guruhi menyular bilan, bitta kontekstli pastki tasma; telefonda tab bar pastda, yon panel varaq. Keyin UI-2 yorug' rejim, LG-2 material (Figma bo'yicha), LG-3 harakat |
| LG-1 | Liquid Glass: boshqaruv elementlari | ✅ 2026-11-15: chetda sinish (SVG displacement, Chromium), sirg'aluvchi linza-tanlov kapsulasi (3 ta tab guruhi), bosilish fizikasi (prujina), slayder tutqichi sudralganda shisha tomchi. Keyin LG-2: katta panellar, ochilish morfi, telefonda FPS |
| R1 | Realizm: yorug'lik/material | ✅ 2026-11-14: "Real / Atlas rangi" almashtirgichi (standart Real) — to'qima ranglari (po'stloq, chuqur yadrolar, oq modda, arteriya/vena, nerv, dura, suyak; qora modda/qizil yadro/xoroid chigal alohida), nam yaltirash (past roughness + sheen, clearcoat 0), Neutral tone mapping, bitta iliq asosiy chiroq. Keyin R2 chuqurlik (AO/soya), R3 kesim yuzalari, R4 mayda detal |
| 5 | Kontent | 🟡 2026-09-24: 487 yozuv (`src/data/content/*.json`, en/uz + manbalar); barcha yozuvlarda `uz` nom; Julich 206 alohida hudud tugadi. Qolgan: Glasser 179, Destrieux 74, Desikan 35, JHU 27 |
| AI | AI panel (5.6) | 🟡 2026-11-21: AI-1 ✅ (5 provayder + mock, OpenRouter PKCE kirish, API kalitlar, lokal model, oqimli chat, Hisoblar, ⌘/); keyingi AI-2 kontekst |
| 6 | Deploy | Pages, meshlar GitHub Release'da, README, ATTRIBUTION.md |
| 7 | v2 | Orqa miya, qo'shimcha atlaslar (neuroparc, Allen) |

## 4. Xavflar

1. **Fazo mosligi** — BodyParts3D (bitta odam, o'z koordinatalari) va MNI
   atlaslar (populyatsiya o'rtachasi) hech qachon mukammal ustma-ust
   tushmaydi. Yechim: affine kalibrlash + foydalanuvchiga "gross" va
   "parcellation" qatlamlari alohida manbadan ekanini Inspector'da ko'rsatish.
2. **Hajm** — 1700 mesh, Draco bilan ham 50–150 MB. Lazy load + tizim
   bo'yicha yuklash shart; GitHub Pages 1 GB limit (yetadi), lekin Release
   asset'lari orqali tarqatish ishonchliroq.
3. **Kontent hajmi** — 1700 × 3 til. Avtomatik skeleton + ustuvorlik
   (avval gross + Brodmann, keyin qolganlari).
4. **Litsenziya aralashuvi** — CC BY-SA (mesh) + CC BY-NC-SA (Julich) +
   HCP shartlari. Har bir qism o'z manbasi/litsenziyasini olib yuradi
   (`part.source`), ATTRIBUTION.md manba bo'yicha bo'linadi. Loyiha kodi
   MIT, ma'lumotlar har biri o'z litsenziyasida.

## 5. Kelajak imkoniyatlari (2026-11-15, foydalanuvchi bilan muhokama)

Maqsad: bakalavrdan PhD gacha foydalanadigan atlas. Tartib foydalanuvchi tanlovi bilan; har biri alohida
sessiya va commit. Hech biri hali boshlanmagan.

### 5.1 Kesim sxemalarida chegaralar 100% tutashsin (TALAB)

**T2 ✅ 2026-11-16:** egasiz 33.0% → 0.0%, ustma-ust 0.4% → 0.1% (`tiling()` — `sections/shapes.ts`; `EGG` —
`diencephalon.ts`). Qolgan 21 plastinka shu usulda; avval auditda hudud to'ldirishlarini egasi deb sanash kerak.

**Audit aniqlashtirildi (2026-11-16) — qolgan plastinkalarda egasiz maydon YO'Q.** Nuqta tartib bilan tuzilma →
hudud → nomlangan zamin → hech narsa deb sanaladi; hamma 21 plastinkada "hech narsa" 0.0%. Bo'shliqlar raqamlangan,
bosiladigan zaminga tegishli: miya ustunida tegmentum (retikulyar formatsiya) 25–59%, bazal yadrolarda yarim shar oq
moddasi 39–47%, gipotalamusda `hypo-grey` 39–75%, miyachada oq modda 59%. Bular haqiqiy to'qima — yadrolar uning
ichidagi orollar; to'liq bo'linma qilish anatomik xato bo'lardi. Qoldiq nomzodlar: T1 (talamus ichi), G4 (zonalar
xaritasi, zamin 75%), ustma-ustliklar (U1 1.8%, K3 1.5%, B1 1.3%, U2 1.1%).

Muammo (foydalanuvchi T2 "Talamus yadrolari" plastinkasida ko'rsatdi): sohalar orasida bo'sh joy bor — masalan
2 (oldingi yadro) va 3 (mediodorsal) orasi nimaga tegishli ekani tushunarsiz.

Hozirgi holat va sabab:
- T2 da 2 bilan 3 orasidan **ichki medullyar plastinka** (`th-iml`, 1-raqam, Y shakli) o'tadi, lekin u 7 birlik
  qalinlikdagi chiziq qilib chizilgan, yadrolar esa unga tegmaydi → ikki yonida `ground: 'thal'` rangidagi
  egasiz tasma qoladi. VA/VL/VPL, LD/LP va ventral qavat orasidagi bo'shliqlar — sof chizma artefakti: real
  talamusda bu yadrolar bir-biriga bevosita tutashadi.
- Sabab: har bir tuzilma mustaqil `B(...)` blob (nuqtalar orqali silliq egri), qo'shnilar umumiy chegarani
  bo'lishmaydi.

Talab:
1. Kontur ichidagi har bir nuqta **aniq bitta** nomlangan tuzilmaga tegishli bo'lsin: qoplash 100%, ustma-ustlik 0.
2. Qo'shni tuzilmalar **bitta umumiy chegara egri chizig'ini** bo'lishsin (ikki mustaqil egri emas).
3. Haqiqatan ham nomlanmagan to'qima qolsa (masalan intralaminar yadrolar, VM, Pf, reuniens), u ham ro'yxatda
   alohida element bo'lsin ("boshqa talamus yadrolari") — egasiz fon qolmasin.
4. Tolali plastinkalar (IML, tashqi medullyar plastinka) chiziq emas, o'z maydoniga ega soha bo'lsin yoki
   ikki qo'shni yadroning umumiy chegarasi sifatida chizilsin.

Boshlang'ich o'lchov (2026-11-16, `node scripts/audit-sections.mjs --coverage`, qadam 1.5):
T2 — egasiz 33.0%, ustma-ust 0.4%. Boshqa plastinkalar 39–75% egasiz ko'rsatadi, lekin u yerda hudud
to'ldirishlari (tegmentum, zamin, `sv-region-fill`) egasi deb sanalmagan — audit T2 dan keyin aniqlashtiriladi.
Ustma-ustlik hamma joyda ≤1.8%.

Amalga oshirish yo'li (taklif):
- `shapes.ts`ga topologik model: umumiy **tugunlar** va **qirralar**, har soha qirralar halqasi sifatida
  (planar bo'linma). Qirra bir marta beriladi, ikki sohada ishlatiladi → tirqish bo'lishi mumkin emas.
- Tekshiruv: `scripts/audit-sections.mjs --coverage` ✅ qo'shildi (2026-11-16): kontur ichini rastr bilan tanlab,
  egasiz nuqtalar ulushi va ustma-ustlikni chiqaradi. Maqsad: egasiz 0%, ustma-ust 0%.
- Avval T2, keyin qolgan 21 plastinka (miya ustuni kesimlarida fon — retikulyar formatsiya; uni ham nomlash).
- Bu 5.2 bilan bog'liq: real tasvir ustidagi konturlar ham xuddi shu tutash bo'linmadan olinadi.

### 5.2 Real tasvir + shtrix kontur (kesim ko'ruvchisida 5-ko'rinish) — ✅ v1 2026-11-16

Bajarildi: BigBrain 100 mkm dan 17 daraja uchun real kesim, ustida atlas chegaralari shtrix chiziq bilan
(tafsilot — CLAUDE.md "Joriy holat"). Litsenziya o'qildi: CC BY-NC-SA 4.0 (`License.txt`), ND emas.
Sxema raqamlari ✅ 2026-11-16 (nishonlar real kesim ustida; tafsilot HISTORY 5.2b).
Quyidagi matn — dastlabki reja; undan qolganlari: aralashtirish slayderi, MRI varianti. O1–O3 tekisligi ✅ 2026-11-16 (HISTORY 5.2c).


Hozir: Sxema · Mielin · Nissl · Atlas (MNI). Qo'shiladi: **Real** — haqiqiy miya kesimi, ustida har tuzilmaning
konturi shtrix chiziq bilan, sxemadagi raqamlar bilan.

- Tasvir nomzodlari (ikkalasi MNI fazosida, kesim tekisliklarimizga to'g'ri tushadi):
  BigBrain (gistologiya, 20 mkm; litsenziya TEKSHIRILMAGAN — esda CC BY-NC-SA) va MNI152 MRI shabloni.
  **Birinchi qadam — litsenziya sahifasini o'qish** (CC BY-ND taqiq). Diskda hozir real tasvir yo'q.
- Pipeline: hajmdan kesim tekisligi (`sections/plane.ts`) bo'yicha qiya kesim → webp (`pipeline/tools/`).
- Konturlar: `atlasSlice.ts` (atlas meshlarini shu tekislikda kesadi) → shtrix chiziq; 5.1 tugagach — tutash bo'linma.
- Cheklov: T2 kesim emas ("tuxum" sxemasi) → Real ko'rinish unga qo'llanmaydi; haqiqiy kesimlarda ishlaydi.
  Talamus yadrolari uchun atlasdagi bo'linma yetarli maydami — tekshirish kerak.
- PhD darajasi: kontur ustiga kursor → manba atlas, ehtimollik, kesim maydoni; sxema↔real aralashtirish slayderi.

### 5.3 G'oyalar ro'yxati

Bakalavr (tushunish va yodlash):
1. **Yo'llar animatsiyasi** (BG-2) — kortikospinal, orqa ustun, spinotalamik: 3D da boshidan oxirigacha, kesishish joyi.
2. **Shikastlanish simulyatori** (BG-3) — yo'lni "kesish" → qaysi tomonda nima yo'qoladi; teskari rejim: belgilardan o'choqni topish.
3. **Mavzu viktorinasi + Anki eksporti** — kesim va 3D savollar; xato qilingan tuzilmalar Anki kartasiga.
4. **Qon ta'minoti hududlari** — arteriya sohasi bo'yaladi; arteriyani "yopish" → insult sindromi.

Ordinator va klinitsist:
5. **MRI ko'ruvchi** — uch tekislik, 3D model bilan bog'langan (MRIda nuqta → modelda tuzilma).
6. **Klinik holatlar** — qisqa keys, "o'choq qayerda?", javob 3D da.
7. **DBS nishonlari** (BG-4) — STN, GPi, Vim, elektrod yo'li, Alexander halqalari.

PhD va tadqiqotchi:
8. **Koordinata vositasi** — MNI x,y,z → har atlasda qaysi soha; CSV eksport.
9. **Atlaslarni solishtirish** — bitta soha Julich/Brodmann/Glasser'da yonma-yon, ustma-ustlik foizi.
10. **Maqola uchun rasm eksporti** — yorliq, masshtab, manba iqtibosi bilan yuqori aniqlikda.
11. **Retseptor / gen xaritalari** — ochiq ma'lumot bor-yo'qligi tekshirilishi kerak.
12. **Lupa** — sahna ustida suriladigan linza: mayda yadrolarni kattalashtirib, nomlarini faqat ichida ko'rsatadi.

Tavsiya etilgan tartib: 5.1 (T2) ✅ → 5.2 ✅ → 1+2 (yo'llar va shikastlanish) ✅ → 5.5 (A, B, C) ✅ → erkin o'choq ✅ → McDonald ✅ → **3 (mavzu viktorinasi + Anki) yoki foydalanuvchi tanlovi ← KEYINGI** → 8.

### 5.5 Foydalanuvchi talablari (2026-11-16) — ✅ 2026-11-17 bajarildi (A, B 21/22, C); qoldiqlar `docs/HISTORY.md` "5.5"

**A. Qon tomirlar simmetrik bo'lsin.** Foydalanuvchi uch surat bilan ko'rsatdi: yuzaki venalar va ko'ndalang sinus
faqat bir tomonda, arteriyalar ham ikki yarim sharda har xil.
- O'lchov (`parts.json`, geometriyali qismlar): venalar 45 ta — o'ng 31, chap 1, o'rta 13; arteriyalar 133 ta — o'ng 76,
  chap 46, o'rta 11. Faqat bir tomonda bor konseptlar: venalarda 44 dan 30 tasi, arteriyalarda 114 dan 84 tasi.
  Sabab manbada: BodyParts3D venalarni asosan o'ng tomonda bergan.
- Yo'l: juftsiz yon tomir meshini o'rta sagittal tekislikdan ko'zgulash (MNI x → −x, uchburchak tartibi teskari),
  `pipeline/build_catalogue.py` da; yangi qism `side` va nomi bilan, `source`da "BodyParts3D, ko'zgulangan" deb belgilanadi
  (litsenziya o'zgarmaydi, lekin sun'iy ekanligi yashirilmaydi). Avval tekshiring: ko'zgulangan tomir qarama-qarshi
  yarim shar yuzasiga botib ketmaydimi (yarim sharlar to'liq simmetrik emas) — kerak bo'lsa yuzaga proyeksiya.
- Ehtiyot: haqiqiy anatomiyada ham asimmetriya bor (ko'ndalang sinus ko'pincha o'ngda yirik) — bu kontentda aytiladi,
  lekin model ikki tomonda ham tomirni ko'rsatishi kerak. Toq tuzilmalar (yuqori sagittal sinus, bazilyar) ko'zgulanmaydi.
- PhD darajasi: Villiz doirasi variantlari (fetal PCA, gipoplastik A1) almashtirgichi.

**B. Real preparat tasviri hamma kesimda bo'lsin.** Hozir 22 kesimdan 17 tasida bor. Yo'q:
- U1 (piramidalar kesishmasi) — BigBrain hajmi bu darajaga yetmaydi (6% to'qima). Boshqa ochiq manba kerak
  (litsenziyani O'QIB tekshiring; CC BY-ND taqiq) yoki "bu daraja uchun tasvir yo'q" deb halol qoldiriladi.
- K3 (isthmus) va Mc (miyacha yadrolari) — oyna 145×164 va 124×90 mm: kesim emas, OYNA xatosi (`contour` meshlari
  `atlasSlice` oynasini kengaytirib yuboradi). Oyna toraytirilsa `real_slices.py` ularni ham kesadi.
- T2 (talamus xaritasi) va G4 (gipotalamus zonalari) — tekisligi yo'q sxema-xaritalar. Variant: eng yaqin kesim
  tasvirini ko'rsatish (T2 → aksial talamus kesimi) yoki ularga `plane` berish.
- Foydalanuvchi "real preparat" deganda haqiqiy bo'yalgan preparat fotosini ham nazarda tutishi mumkin (Mielin/Nissl
  hozir chizma naqsh) — keyingi sessiyada aniqlashtirilsin.

**C. Tasvirni bosganda kattalashtirish.** Ayniqsa real kesim, lekin sxema/mielin/Nissl/atlas ham.
- To'liq ekran rejimi (ko'ruvchi kartasi ichida figura butun maydonni egallaydi, Esc bilan qaytadi) + g'ildirak/pinch
  bilan zoom va sudrab surish (SVG `viewBox`ni o'zgartirish — nishon va konturlar vektor, o'tkirligicha qoladi).
- Real tasvir 100 mkm/px: kattalashtirganda piksellashadi. PhD darajasi: BigBrain 20 mkm dan yuqori aniqlikdagi
  plitkalar (faqat kattalashtirilganda yuklanadi) — hajm va litsenziya tekshirilsin.
- Nishonlar bosiladigan bo'lgani uchun "bosish = kattalashtirish" to'qnashadi: alohida tugma + ikki marta bosish taklif etiladi.

### 5.4 Interfeys / Liquid Glass bo'yicha qolgan ishlar

- Dars kartasi va kesim ko'ruvchisini yorug' rejimga o'tkazish (hozir "qora orol").
- LG-3: linza, sirg'alish, varaq ochilishi — namuna video kadrlari bilan sozlash.
- Varaq radiusi (34px), katta panellar materiali; telefonda FPS va Safari ko'rinishini tekshirish.
- Native Apple qobig'i (SwiftUI `.glassEffect()`) — haqiqiy Liquid Glass faqat shu yo'l bilan; alohida loyiha.

### 5.6 AI panel — "Xcode Intelligence" uslubida (2026-11-21, rejalashtirish; hali kod yo'q)

Talab (foydalanuvchi): ilovada AI panel; foydalanuvchi o'z AI hisobi bilan kiradi (Xcode kabi) va foydalanadi;
provayderlar — Anthropic, OpenAI, Google.

#### A. Kirish usullari — tekshirilgan faktlar (2026-11-21)

Ilova STATIK (GitHub Pages, backend yo'q) — bu qaror hamma narsani belgilaydi.

| Provayder | "Hisob bilan kirish" | Statik sayt uchun haqiqiy yo'l |
|---|---|---|
| Anthropic | **Taqiqlangan.** 2026-fevral shartlari: uchinchi tomon ilovalari Claude.ai (Free/Pro/Max) login'ini taklif qilmaydi, 2026-04-04 dan majburiy. Xcode'dagi Claude login — Apple bilan alohida kelishuv. | API kalit (console.anthropic.com). Brauzerdan to'g'ridan-to'g'ri: `anthropic-dangerous-direct-browser-access: true` sarlavhasi (CORS). |
| OpenAI | "Sign in with ChatGPT" (SIWC) — Plus/Pro rejasi bilan modelga murojaat: **preview**, "open-source va lokal ilovalar" uchun; redirect faqat `http://127.0.0.1:<port>` (loopback), `localhost` emas; inference — `POST /v1/responses`, `stream=true`, `store=false`; `temperature`, `max_output_tokens` yo'q. Statik sahifa loopback callback qabul qila olmaydi. | Hozir: API kalit (platform.openai.com). Keyin: SIWC lokal yordamchi (desktop qobiq yoki `npx neuro-atlas-ai` loopback) orqali — AI-6. |
| Google | Gemini API OAuth bor, lekin Cloud loyiha + OAuth client + scope tekshiruvi (verifikatsiya) kerak; hujjatda faqat desktop/server oqimi. | API kalit (aistudio.google.com, bepul tarif bor). OAuth — AI-6 da tadqiqot. |
| OpenRouter | **Haqiqiy bir bosishli kirish**: OAuth PKCE, client ID/secret va backend kerak emas; `openrouter.ai/auth?callback_url=…` → `code` → `POST /api/v1/auth/keys` → foydalanuvchining o'z kaliti. Bitta hisob orqali Claude, GPT va Gemini modellari; to'lovni foydalanuvchi qiladi. | Xcode'ga eng yaqin tajriba — **asosiy "Kirish" tugmasi**. |
| Lokal | Ollama / LM Studio (OpenAI-mos `localhost` API) — Xcode ham qo'llaydi. | URL + model; Ollama uchun `OLLAMA_ORIGINS` sozlanadi. Bepul, oflayn, maxfiy. |

Manbalar: Apple "Setting up coding intelligence"; The Register 2026-02-20 (Anthropic); developers.openai.com/siwc
(quickstart, token-sharing-open-source); openrouter.ai/docs/guides/overview/auth/oauth; ai.google.dev/gemini-api/docs/oauth.

Xulosa: "Hisoblar" oynasida 3 xil ulanish — **OpenRouter bilan kirish** (bir bosish, uchala provayder modellari),
**o'z API kalitingiz** (Anthropic / OpenAI / Google), **lokal model**. ChatGPT rejasi bilan kirish — keyinroq (AI-6).

**Qarorlar (foydalanuvchi, 2026-11-21):** asosiy kirish — OpenRouter + o'z API kaliti (+ lokal model); AI ilovani
o'zi boshqaradi va har amalni chip bilan ko'rsatadi; panel — o'ngdan chiquvchi varaq (telefonda pastki varaq).

#### B. Arxitektura

- `src/ai/providers/` — `anthropic.ts`, `openai.ts` (Chat Completions + Responses), `gemini.ts`, `openrouter.ts`,
  `local.ts` (OpenAI-mos), `mock.ts` (faqat dev — headless test va screenshot uchun). Umumiy interfeys:
  `listModels()`, `stream(messages, tools, signal) → AsyncIterable<text | tool_call | usage | error>`.
  SDK'siz `fetch` + SSE tahlilchisi (bundle kichik; har provayderning oqim formati alohida test fixture bilan).
- `src/ai/accounts.ts` — kalitlar `localStorage` `na:ai:*` ("bu qurilmada eslab qol" o'chirilsa — faqat sessiya);
  OpenRouter PKCE (`code_verifier` sessionStorage'da, qaytishda `?code=` ushlanadi va URL tozalanadi); "Chiqish" =
  kalitni o'chirish. Kalit faqat o'z provayderiga yuboriladi; CSP `connect-src` ro'yxati.
- `src/ai/context.ts` — ilova holatidan qisqa kontekst: til, tanlangan qism + `content/*.json` yozuvi va manbalari,
  ochiq kesim plastinkasi va tuzilmalari, yo'l, o'choqlar (`focalSet`, McDonald natijasi), dars qadami. Hajm chegarasi.
- `src/ai/tools.ts` — AI ilovani boshqaradi (function calling → store amallari): `find_structure`, `select_structure`,
  `open_section`, `set_view`, `open_lesson`, `trace_pathway`, `place_lesion` (plastinka + tuzilma + radius + vaqt),
  `get_structure_info`. Har amal chatda "chip" bo'lib ko'rinadi (bosilsa takrorlanadi). Faqat UI amallari — qaytariladigan.
- UI: `src/ui/AIPanel.tsx` — o'ngdan chiquvchi Liquid Glass varaq (`ViewGroup`da ✨ tugma, `⌘/`), oqimli markdown,
  model tanlagich, to'xtatish, "Kontekst: K3 · 2 o'choq" yorlig'i, tez savollar. `AccountsSheet` — Xcode Intelligence
  ro'yxati kabi: provayder qatori → Kirish / Kalit / Chiqish, modellar, "Ulanishni tekshirish". uz/en.
- Store: `aiOpen`, `aiProvider`, `aiModel` (persist); suhbat tarixi xotirada (ixtiyoriy saqlash keyin).

#### C. Bosqichlar (har biri alohida sessiya va commit)

| # | Bosqich | Tayyor mezoni |
|---|---|---|
| AI-1 ✅ 2026-11-21 | Provayder qatlami + Hisoblar | 5 provayder + mock; OpenRouter PKCE kirish; kalit kiritish/chiqish; oqimli chat; xatolar odam tilida (401, 429, CORS, kredit yo'q); mock bilan headless screenshot; foydalanuvchi o'z kaliti bilan sinaydi |
| AI-2 | Kontekst | AI "nimaga qarayapman"ni biladi (tanlov, plastinka, o'choqlar, dars); javob ilova tilida; atlas `content` manbalariga havola |
| AI-3 | Ilovani boshqarish (tools) | "Menga Wallenberg o'chog'ini ko'rsat" → plastinka ochiladi, o'choq qo'yiladi, 3D dars; amal chiplari; har provayderda tool calling sinovi |
| AI-4 | Ko'rish (vision) | 3D sahna / plastinka surati yuboriladi (`canvas` → PNG, bir martalik render); "Bu nima?" |
| AI-5 | PhD qatlami | Sokratik repetitor (javobni aytmay savol beradi), klinik keys generatori (simulyator bilan tekshiriladi — AI keysi `focalSet` natijasiga mos kelmasa ko'rsatiladi), adabiyot: PubMed E-utilities + Crossref (DOI tekshiriladi, to'qilgan havola yo'q), "Viktorina" va Anki eksport bilan bog'lanish |
| AI-6 | Hisob bilan kirish kengaytmalari | ChatGPT rejasi (SIWC) — lokal yordamchi/desktop qobiq orqali, OpenAI'ning open-source partner shartlari tekshirilgach; Google OAuth (Cloud loyiha, verifikatsiya) |

#### D. Xavflar va qoidalar

- Kalit brauzerda: XSS bo'lsa o'g'irlanadi → tashqi skript yo'q, CSP, kalit faqat provayder domeniga; UI'da ogohlantirish
  va "faqat sessiya" rejimi. Bizning serverimiz yo'q — kalit hech qachon bizga kelmaydi (README'da yoziladi).
- Tibbiy aniqlik: tizim prompti — ta'limiy, bemor ma'lumotini kiritmaslik, ishonchsiz bo'lsa "bilmayman", atlas
  ma'lumotiga tayanish; javoblar ostida "AI xato qilishi mumkin" eslatmasi.
- Narx: foydalanuvchi to'laydi; har javobda token/narx taxmini; standart model — arzon/tez, "chuqur" rejim — kuchli model.
- Provayder API'lari tez o'zgaradi: model ro'yxati qattiq yozilmaydi (`listModels`), har provayderga fixture-test.
- OpenAI SIWC va Anthropic shartlari o'zgarishi mumkin — AI-6 dan oldin qayta tekshirilsin.
