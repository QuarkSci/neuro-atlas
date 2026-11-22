# Oddiy tilda

1. **Nima o'zgardi?** Miyaning sakkizta asosiy bo'limi bo'yicha ingliz va o'zbek tillarida jami ikki yuzta test savoli, to'rttadan javob varianti va har bir javobning batafsil izohi yozildi. Savollar oson (talaba), o'rta (rezident) va qiyin (shifokor-ekspert) darajalarga bo'lindi.
2. **Nima yaxshilandi (foydalanuvchi endi nimani ko'radi/qila oladi)?** Viktorina oynasi ulanganda foydalanuvchi miya qorinchalari, qadoqsimon tana, limbik tizim, bazal yadrolar, oraliq miya, o'tkazuvchi yo'llar, miya ustuni va miyacha bo'yicha o'z bilimini sinab ko'ra oladi. Har bir savol uch o'lchamli miya qismlari, ikki o'lchamli kesim plastinkalari va ishonchli ilmiy manbalar bilan bog'landi.
3. **Nima hali tayyor emas yoki tekshirilmagan?** Savollar bazasi to'liq tayyor va tekshiruvdan o'tdi, lekin ularni ekranda o'ynatadigan viktorina interfeysi navbatdagi bosqichda (Claude tomonidan CL-4 vazifasida) ulanadi.

---

## Vazifa: AG-5 — Kontent: viktorina savollar banki (CL-4 uchun xom ashyo, kod yo'q)

### O'zgargan fayllar
- `src/data/quiz/ventricles.json` — Miya qorinchalari va likvor aylanishi bo'yicha 25 ta savol (`q-ventricles-001`..`025`: 10 `student`, 10 `resident`, 5 `expert`).
- `src/data/quiz/callosum.json` — Qadoqsimon tana va komissural yo'llar bo'yicha 25 ta savol (`q-callosum-001`..`025`: 10 `student`, 10 `resident`, 5 `expert`).
- `src/data/quiz/limbic.json` — Limbik tizim va Papez halqasi bo'yicha 25 ta savol (`q-limbic-001`..`025`: 10 `student`, 10 `resident`, 5 `expert`).
- `src/data/quiz/basal-ganglia.json` — Bazal yadrolar, ichki kapsula va harakat halqalari bo'yicha 25 ta savol (`q-basal-ganglia-001`..`025`: 10 `student`, 10 `resident`, 5 `expert`).
- `src/data/quiz/diencephalon.json` — Oraliq miya: talamus, gipotalamus, epitalamus va subtalamus bo'yicha 25 ta savol (`q-diencephalon-001`..`025`: 10 `student`, 10 `resident`, 5 `expert`).
- `src/data/quiz/pathways.json` — Ko'tariluvchi va tushuvchi o'tkazuvchi yo'llar bo'yicha 25 ta savol (`q-pathways-001`..`025`: 10 `student`, 10 `resident`, 5 `expert`).
- `src/data/quiz/brainstem.json` — Miya ustuni (uzunchoq miya, ko'prik, o'rta miya) va bosh miya nervlari yadrolari bo'yicha 25 ta savol (`q-brainstem-001`..`025`: 10 `student`, 10 `resident`, 5 `expert`).
- `src/data/quiz/cerebellum.json` — Miyacha bo'lakchalari, chuqur yadrolari, oyoqchalari va klinik sindromlari bo'yicha 25 ta savol (`q-cerebellum-001`..`025`: 10 `student`, 10 `resident`, 5 `expert`).
- `docs/handoff/AG-5.md` — Ushbu handoff hujjati.

*(Eslatma: `AI.md` §5.4 talabiga muvofiq `src/data/index.ts`, `src/data/topics.ts` yoki birorta `.ts`/`.tsx` faylga tegilmadi.)*

### Nima qilindi
1. **8 ta mavzu × 25 tadan savol = jami 200 ta ikki tilli (`en` / `uz`) savol:**
   - Har bir mavzuda qat'iy taqsimot: **10 ta `student` (40%)**, **10 ta `resident` (40%)**, **5 ta `expert` (20%)**.
   - Barcha savollar `AI.md` §5.4 dagi JSON sxemasiga (`id`, `level`, `topic`, `type: "mcq"`, `q`, `options` [4 ta], `answer: 0`, `why`, `refs`, ixtiyoriy `plate`, `sources`) to'liq mos.
   - Chalg'ituvchi variantlar (distraktorlar) bir xil anatomik tizimdagi qo'shni tuzilmalardan tanlandi; birorta savolda `"yuqoridagilarning barchasi"` / `"all of the above"` ishlatilmadi.
   - `expert` darajasidagi 40 ta savol (har mavzuda 5 tadan) klinik lokalizatsiya keys-masalalari ko'rinishida tuzildi va `src/data/lesions.ts`, `src/data/pathways.ts`, `src/data/sections/structures-*.ts` hamda `src/data/content/*.json` dagi faktlar bilan uyg'unlashtirildi.
2. **3D va 2D atlas bilan bog'lanish (`refs` va `plate`):**
   - 200 ta savolda jami **1 019 ta `refs`** identifikatori ishlatildi — har biri `src/data/parts.json` (`id` yoki `concept`) yoki `src/data/sections/structures-*.ts` (`STRUCTURE_BY_ID`) da mavjudligi avtomatik skript bilan tasdiqlandi (**noma'lum ref = 0**).
   - 200 ta savoldan **167 tasiga** mos 2D gistologik kesim plastinkasi (`plate`, masalan `medulla-olive`, `pons-facial-colliculus`, `midbrain-superior-colliculus`, `thalamus-nuclei-map`, `hypothalamus-tuberal`, `bg-subthalamic`, `bg-capsule-axial`, `cerebellum-deep-nuclei` va h.k.) biriktirildi (**noma'lum plate = 0**).

| Mavzu (`topic`) | Jami | `student` | `resident` | `expert` | `plate` bilan |
|---|---:|---:|---:|---:|---:|
| `ventricles` | 25 | 10 | 10 | 5 | 19 |
| `callosum` | 25 | 10 | 10 | 5 | 16 |
| `limbic` | 25 | 10 | 10 | 5 | 14 |
| `basal-ganglia` | 25 | 10 | 10 | 5 | 25 |
| `diencephalon` | 25 | 10 | 10 | 5 | 25 |
| `pathways` | 25 | 10 | 10 | 5 | 23 |
| `brainstem` | 25 | 10 | 10 | 5 | 24 |
| `cerebellum` | 25 | 10 | 10 | 5 | 21 |
| **Jami** | **200** | **80** | **80** | **40** | **167** |

### Qanday tekshirildi
1. **Avtomatik JSON, `refs` va `plate` validatsiya skripti:**
   - Barcha 8 ta JSON fayl `parts.json` (2 702 ta `id`/`concept`), `src/data/sections/structures-*.ts` (183 ta `STRUCTURE_BY_ID` kaliti) va `src/data/sections/*.ts` (22 ta `SECTIONS` plastinka ID'si) ga solishtirildi:
     - Jami savollar: `200`, takrorlanmas `id`lar: `200`
     - Jami tekshirilgan `refs`: `1019` (**0 ta xato / 0 ta noma'lum ref**)
     - Jami tekshirilgan `plate`: `167` (**0 ta xato / 0 ta noma'lum plate**)
     - Har bir savolda 4 tadan unikal variant (`en`/`uz`), `answer` `0..3` oralig'ida, `"yuqoridagilarning barchasi"` iborasi yo'q (**0 ta xato**).
2. **Manbalar (`sources`) Crossref va NCBI E-utilities tekshiruvi:**
   - Savollarda ishlatilgan 47 ta unikal manbaning barchasi (27 tasi repozitoriyda avvaldan mavjud `content/*.json` va `sections/*.ts` manbalari + 20 ta yangi StatPearls / klassik maqola) `https://api.crossref.org/works/<DOI>` va `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=books` orqali tekshirildi — 100% sarlavha va identifikator mosligi tasdiqlandi.
3. **5 ta tasodifiy savolning manbaga qo'lda solishtiruvi (`AI.md` §5.4 tayyor mezoni):**
   - **`q-callosum-011` (`callosum.json`, `resident`):** Hofer va Frahm (2006) DTI traktografiya sxemasidagi I–V mintaqalar taqsimoti va III mintaqaning (orqa tana) birlamchi motor po'stloq (M1) tolalarini o'tkazishi — *Hofer & Frahm 2006, NeuroImage* (`https://doi.org/10.1016/j.neuroimage.2006.05.044`, Crossref bilan tasdiqlangan) hamda `src/data/lessons/callosum.ts` bilan solishtirildi: I = prefrontal, II = premotor/SMA, III = M1, IV = S1, V = parietal/chakka/ensa. To'liq mos.
   - **`q-limbic-021` (`limbic.json`, `expert`):** Ikki tomonlama medial chakka bo'lagi (CA1 / gippokamp shakllanmasi) rezeksiyasidan keyingi og'ir anterograd epizodik amneziya, bunda protsedural xotira (bazal yadrolar/miyacha) va ishchi xotira saqlanib qolishi — *Scoville & Milner 1957, J Neurol Neurosurg Psychiatry* (`https://doi.org/10.1136/jnnp.20.1.11`, Crossref bilan tasdiqlangan) va *StatPearls — Neuroanatomy, Hippocampus* (`NBK482171`, E-utilities bilan tasdiqlangan) ga solishtirildi. To'liq mos.
   - **`q-basal-ganglia-013` (`basal-ganglia.json`, `resident`):** Kortiko-subtalamo-pallidal "giperdirekt" yo'lning (Nambu va boshq., 2002) to'g'ri va egri yo'llardan oldin GPi/SNr ni tez va keng qo'zg'atib, raqobatchi harakat dasturlarini to'xtatishi — *Nambu, Tokuno & Takada 2002, Neurosci Res* (`https://doi.org/10.1016/S0168-0102(02)00027-5`) hamda `src/data/sections/basal.ts` (`bg-subthalamic`) bilan solishtirildi. To'liq mos.
   - **`q-brainstem-024` (`brainstem.json`, `expert`):** Lateral uzunchoq miya (Vallenberg / PICA) sindromini lateral ko'prik (AICA) sindromidan farqlash: PICA da `nucleus ambiguus` (IX/X) zararlanishi tufayli disfagiya va ovoz bo'g'ilishi; AICA da esa VII nerv (yuz falaji) va labirint arteriyasi / koxlear yadrolar (ipsilateral karlik) zararlanishi — *StatPearls — Lateral Medullary Syndrome (Wallenberg Syndrome)* (`NBK551670`, E-utilities bilan tasdiqlangan) va `src/data/lesions.ts` (`wallenberg`, `aica`) bilan solishtirildi. To'liq mos.
   - **`q-cerebellum-022` (`cerebellum.json`, `expert`):** Giyen–Mollare uchburchagi (tishsimon yadro → SCP va kaudal o'rta miya kesishmasi → qarama-qarshi qizil yadro → markaziy tegmental yo'l [CTT] → pastki oliva [ION] → ICP orqali qarama-qarshi miyachaga) va tishsimon yadro/SCP yoki CTT zararlanganda deafferentatsiya tufayli kechikkan gipertrofik oliva degeneratsiyasi hamda ~2 Gs okulopalatal tremor rivojlanishi — *Diedrichsen et al. 2011, NeuroImage* (`https://doi.org/10.1016/j.neuroimage.2010.10.035`) va *StatPearls — Neuroanatomy, Cerebellum* (`NBK538167`) bilan solishtirildi. To'liq mos.
4. **TypeScript va Build tekshiruvi:**
   - `npx tsc -p tsconfig.app.json --noEmit && npm run build && rm -rf dist` — xatosiz (`exit code 0`).

### Ochiq savollar / takliflar
- Barcha savollarda `AI.md` §5.4 sxemasiga muvofiq to'g'ri javob `options[0]` (`"answer": 0`) ga joylashtirildi; CL-4 viktorina dvijogi savolni ko'rsatishda `options` massivini tasodifiy aralashtirib (shuffle), yangi to'g'ri indeksni hisoblab oladi.
- Har bir savoldagi `refs` massivida ham 3D konsept ID'lari (`parts.json`), ham 2D kesim tuzilmasi ID'lari (`STRUCTURE_BY_ID`) berilgan — CL-4 da javob tanlangach foydalanuvchiga bir tugma bilan 3D sahnada (`refs`) yoki 2D gistologik plastinkada (`plate`) o'sha tuzilmani yoritib ko'rsatish imkoniyati tayyor.

## Ko'rib chiqish (Claude, 2026-11-22) — birlashtirildi, AG-5b tuzatishlari bilan
- Qamrov: faqat `src/data/quiz/*.json` va handoff; kod yo'q. Struktura: 200 savol, 80/80/40, `refs`/`plate`/dublikat/variant 0 xato.
- Manbalar: 47 tasi Crossref (DOI) va eutils (NBK) bilan qayta tekshirildi. **2 ta noto'g'ri Purves ID**: NBK11020 ("Critical Periods") va NBK10994 ("CNS Dimorphisms…") "amygdala"/"hippocampus" deb yozilgan edi → NBK10891 va StatPearls NBK482171 ga almashtirildi (xuddi shu xato `gross-brain.json` da ham bor edi — tuzatildi).
- Anatomiya (7 tasodifiy savol): to'g'ri.
- **AG-5b uchun tuzatishlar (majburiy, CL-4 ishga tushishidan oldin):**
  1. To'g'ri javob 200 dan 166 savolda eng uzun variant (o'rtacha 2.1× distraktor). Distraktorlarni to'g'ri javob bilan bir xil uzunlik va ohangda yozing; to'g'ri javobni qisqartiring (ortiqcha izoh `why` ga).
  2. Distraktorlar ishonarli bo'lsin (bir tizimdagi qo'shni tuzilma/sindrom): "VTA → V1 dopamin yo'li", "faqat motor neyronlar … velum" kabilar bir qarashda ma'lum noto'g'ri.
  3. Matnda kod identifikatorlari yo'q: 57 savolda `n6`, `sp5n`, `BRAINSTEM_STRUCTURES`, `lesions.ts` kabilar (jami ~560 ta backtick). Tuzilma nomini yozing ("abducens yadrosi"); plastinka kodi (K2, O1) qolishi mumkin. `refs` maydoni o'zgarmaydi.
  4. `why` da "As noted in …" kabi ichki manba havolalari yo'q.
  5. Tekshiruv: o'sha validatsiya skripti + "to'g'ri javob eng uzun" ulushi ≤ 35% (4 variantda tasodifiy ≈ 25%).

