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
| Brodmann (alternativ) | Julich-Brain'dan Brodmann'ga mos sitoarxitektonik hududlar (BA1,2,3a,3b,4a,4p,6,17,18,44,45…) | CC BY-NC-SA 4.0 | ✅ mos | — |
| **Desikan-Killiany / Destrieux** | FreeSurfer `fsaverage` aparc — FreeSurfer litsenziyasi ro'yxatdan o'tishni talab qiladi; MNI'dagi qayta tarqatilgan nusxa: G-Node "FreeSurfer parcellations in MNI space" | FS: registratsiya; G-Node `?` | ⚠ tekshirish | 68 / 148 |
| **Glasser HCP-MMP1** | BALSA / Kevin Weiner MNI versiyasi | WU-Minn HCP Open Access Data Use Terms — qayta tarqatish shu shartlar ostida mumkin, attribution shart | ✅ mos (shartlar ATTRIBUTION'da) | 360 |
| **Julich-Brain v3.x** (sitoarxitektonika, ~300 hudud, MNI152 + fsaverage) | EBRAINS / siibra | **CC BY-NC-SA 4.0** | ✅ mos | ~300 |
| Po'stloq osti + talamus | FreeSurfer aseg (MNI'dagi nusxa) + THOMAS talamus yadrolari `?` | ⚠ tekshirish | ~40 + ~25 |
| **Miyacha bo'laklari** | ~~SUIT/Diedrichsen to'plami~~ — **CC BY-ND → MOS EMAS** | ❌ | — |
| Miyacha (alternativ) | BodyParts3D miyacha bo'laklari + Julich-Brain miyacha yadrolari (dentate, fastigial…) | CC BY-SA / BY-NC-SA | ✅ mos | ~20 |
| **Oq modda traktlari** | TractSeg 72 bundle (MNI, probabilistik) | **CC BY** | ✅ mos | 72 |
| Harvard-Oxford, AAL, Schaefer… (qo'shimcha qatlamlar) | neuroparc (neurodata) | atlasga qarab `?` | keyinroq | — |
| Allen Human Reference Atlas 3D (141 hudud) | Allen Institute | Allen terms — nokommersial `?` | keyinroq | 141 |

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
| 3 | To'liq import | Barcha qatlamlar, ierarxiya, 1700+ qism, 60 fps desktop / 30 fps telefon |
| 4 | Kesim + qatlamlar | 3 tekislik, MNI koordinata, parcellation almashtirish |
| 5 | Kontent | parts.json skeleton (nom uz/en/la, tizim, funksiya, klinik ahamiyat, manba) → foydalanuvchi ko'rib chiqadi |
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
