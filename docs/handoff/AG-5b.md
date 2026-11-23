# AG-5b — Viktorina savollarini sayqallash (uzunlik balansi, ishonarli distraktorlar, kod identifikatorlarisiz matn)

Branch: `ag/AG-5b` · Sana: `2026-11-22`

## Nima qilindi
CL-4 viktorinasi uchun `docs/handoff/AG-5.md` ("Ko'rib chiqish") bo'limida ko'rsatilgan barcha 5 ta sifat talabi bo'yicha 8 ta mavzu (`200` ta ikki tilli savol) to'liq sayqallandi:

1. **To'g'ri javob uzunligi tarafkashligi yo'qotildi:**
   - Oldin to'g'ri javob `166/200` (83.0% EN) va `173/200` (86.5% UZ) savolda eng uzun variant edi (o'rtacha `2.14×` / `2.22×`).
   - Ortiqcha izohlar va qavs ichidagi tafsilotlar to'g'ri variantdan `why` ga ko'chirildi; barcha 3 ta distraktor grammatik tuzilishi, ohangi va aniqligi bo'yicha to'g'ri javobga parallel qilib qayta yozildi.
   - Natija: to'g'ri javob eng uzun (`>= max`) ulushi **46/200 (23.0% EN, qat'iy 14.0%)** va **51/200 (25.5% UZ, qat'iy 15.5%)**, o'rtacha uzunlik nisbati **0.98× (EN)** va **0.99× (UZ)** (talab: `<= 35%`, tasodifiy ideal `≈ 25%`).
2. **Ishonarli distraktorlar:**
   - Bir qarashda noto'g'riligi ko'rinadigan chalg'ituvchi variantlar (masalan, "VTA → V1 dopamin yo'li", "velum motor neyronlari", to'r parda / miyacha po'stlog'i bilan nomunosib solishtirishlar) bir xil anatomik tizimdagi qo'shni yadro, yo'l, arteriya yoki klinik differensial sindromlar bilan almashtirildi.
3. **Kod identifikatorlari va backticklar to'liq olib tashlandi:**
   - 57 ta savoldagi barcha `1 122` ta backtick belgisi va ichki kod identifikatorlari (`n6`, `sp5n`, `n4-dec`, `n7-genu`, `n12-root`, `ic-rl`, `medulla-olive`, `pons-facial-colliculus`, `bs-*`, `cau-head`, `th-an`, `j-rt`, `BRAINSTEM_STRUCTURES`, `BASAL_STRUCTURES`, `FOREBRAIN_STRUCTURES`, `CRANIAL_SIGNS`, `lesions.ts`, `pathways.ts`, `level: '...'`) toza anatomik nomlarga almashtirildi.
   - `why` ichidagi `"As noted in ..."` va ichki fayllarga havolalar olib tashlandi.
   - `diencephalon.json` va `callosum.json` dagi 3 ta aralash yozuvli imlo xatosi (`o'ngاقay`) ham tuzatildi.
4. **O'zgarmas maydonlar saqlandi:**
   - Barcha 200 ta savolda `id`, `level`, `topic`, `type`, `answer`, `refs`, `plate` va `sources` maydonlari `origin/master` bilan baytma-bayt bir xil ekanligi skript bilan tasdiqlandi.

## Fayllar bo'yicha natijalar

| Fayl | Savollar | EN eng uzun (`>= max`) | EN nisbat | UZ eng uzun (`>= max`) | UZ nisbat |
|---|---:|---:|---:|---:|---:|
| `basal-ganglia.json` | 25 | 7 (28.0%) | 1.00× | 8 (32.0%) | 0.99× |
| `brainstem.json` | 25 | 7 (28.0%) | 0.99× | 6 (24.0%) | 0.99× |
| `callosum.json` | 25 | 5 (20.0%) | 0.96× | 5 (20.0%) | 0.98× |
| `cerebellum.json` | 25 | 6 (24.0%) | 0.97× | 7 (28.0%) | 0.99× |
| `diencephalon.json` | 25 | 5 (20.0%) | 0.94× | 6 (24.0%) | 0.99× |
| `limbic.json` | 25 | 5 (20.0%) | 1.01× | 7 (28.0%) | 0.99× |
| `pathways.json` | 25 | 6 (24.0%) | 0.99× | 6 (24.0%) | 0.99× |
| `ventricles.json` | 25 | 5 (20.0%) | 0.98× | 6 (24.0%) | 0.98× |
| **Jami** | **200** | **46 (23.0%)** | **0.98×** | **51 (25.5%)** | **0.99×** |

## O'zgargan fayllar (hammasi vazifa ro'yxatida)
- `src/data/quiz/basal-ganglia.json`
- `src/data/quiz/brainstem.json`
- `src/data/quiz/callosum.json`
- `src/data/quiz/cerebellum.json`
- `src/data/quiz/diencephalon.json`
- `src/data/quiz/limbic.json`
- `src/data/quiz/pathways.json`
- `src/data/quiz/ventricles.json`
- `docs/handoff/AG-5b.md`

## Tekshiruv
- Avtomatik validatsiya (`validate_ag5b.py`):
  - `200` savol (`student: 80`, `resident: 80`, `expert: 40`), takroriy `id`: `0`
  - `refs`: `1 019` (noma'lum: `0`), `plate`: `167` (noma'lum: `0`)
  - `origin/master` ga nisbatan `id`/`level`/`topic`/`type`/`answer`/`refs`/`plate`/`sources` o'zgarishi: `0`
  - Backticklar: `0`, ichki kod identifikatorlari / fayl havolalari: `0`, no-lotin belgilar: `0`, `"all of the above"` / `"yuqoridagilarning barchasi"`: `0`
  - To'g'ri javob eng uzun ulushi: EN `23.0%`, UZ `25.5%` (ikkalasi ham `<= 35%`)
- Prettier (`--no-semi --single-quote --print-width 180`): faqat `src/data/quiz/*.json` ga qo'llandi ✅
- `npx tsc -p tsconfig.app.json --noEmit`: ✅
- `npm run build && rm -rf dist`: ✅ (`vite build`, 8 ta quiz chunki xatosiz yig'ildi)
- Manbalar: `sources` maydoni o'zgartirilmadi (AG-5 ko'rib chiqishida Claude tomonidan Crossref / E-utilities bilan tasdiqlangan va tuzatilgan holatda qoldi).

## Ochiq savollar / qolgan ishlar
- Yo'q. `ag/AG-5b` tekshiruv va `master`ga birlashtirishga tayyor.

## Ko'rib chiqish (Claude to'ldiradi)
