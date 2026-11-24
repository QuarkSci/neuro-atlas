# U1 plastinkasi (piramidalar kesishmasi) uchun ochiq litsenziyali gistologiya manbalari

> **Vazifa:** AG-4 / 1-qism (`AI.md` §5.4) · **Sana:** 2026-11-24  
> **Muammo:** Hozirgi `public/sections/real/*.webp` kesimlari BigBrain 100 µm hajmidan olingan, lekin BigBrain 2015 hajmi pastki uzunchoq miyadagi **piramidalar kesishmasi (`U1`)** darajasigacha yetmaydi.  
> **Litsenziya qoidasi (`AI.md` §2.1):** Faqat ochiq litsenziyalar (**CC0 / Public Domain / CC BY / CC BY-NC-SA**); **CC BY-ND qat'iyan taqiqlanadi** (Brainstem Navigator, USC rad etilgan).

---

## 1. Tekshirilgan nomzod manbalar

| # | Manba | Litsenziya (tekshirilgan iqtibos) | Aniqlik va bo'yoq | U1 (piramidalar kesishmasi) qamrovi | MNI ga moslash imkoni |
|---|---|---|---|---|---|
| **1** | **Agostinelli et al. (2023)** — *Human Brainstem and Cerebellum Atlas: Chemoarchitecture and Cytoarchitecture Paired to MRI* (*J Neurosci*, `PMC9838717`) | **CC BY 4.0** (PMC sahifasidan iqtibos: *"Creative Commons Attribution 4.0 International license"*); Crossref metama'lumotida `CC BY-NC-SA 4.0` ko'rsatilgan — ikkala holda ham **CC BY-ND emas**, hosila kesish/kesib olishga ruxsat bor. | Yagona hujayra darajasidagi yuqori aniqlikdagi Nissl / kimyoarxitektura kesimlari + juftlangan 3D MRI | **To'liq qamraydi:** butun inson miya ustuni va pastki uzunchoq miya (piramidalar kesishmasi / spino-medullyar o'tish) | **Yuqori:** gistologiya bevosita shu namunaning 3D MRI hajmiga juftlangan → MNI152 ga affin/no-chiziqli ro'yxatga olish mumkin. |
| **2** | **NextBrain** (*Casamitjana / Puonti et al. 2025*, *Nature* / bioRxiv `10.1101/2025.09.22.673638` + FreeSurfer v8.1+) | **CC BY 4.0** (Crossref `http://creativecommons.org/licenses/by/4.0/`). *(Eslatma: FreeSurfer dasturiy to'plami o'z litsenziyasiga ega, lekin NextBrain ma'lumotlari/atlasi CC BY.)* | ~10 000 ketma-ket gistologik kesimdan tuzilgan 3D probabilistik atlas (100–250 µm rekonstruksiya) | **Qisman / yaxshi:** miya ustuni va uzunchoq miya yadrolari/oq moddasi kiritilgan; piramidalar kesishmasi chegarasi namunaga bog'liq. | **Tayyor:** `MNI152` (1 mm) fazosiga o'tkazilgan hosila (`nextbrain-mni-atlas`) mavjud. |
| **3** | **Allen Human Brain Atlas** (2D Nissl / mielin referent kesimlari) | **Maxsus notijorat litsenziya** (`alleninstitute.org/legal/terms-of-use` iqtibos: *"You may not redistribute the Content or Improvements for commercial purposes without our written permission."*) — CC BY-ND emas, notijorat ta'limiy qayta ishlash mumkin, lekin App Store / tijoriy cheklov bor. | 1 µm skanerlangan 2D Nissl kesimlari | **Tekshirish talab etiladi:** asosiy to'liq miya seriyasi (H0351) asosan ko'prik/o'rta uzunchoq miyagacha, ayrim kesimlarda spino-medullyar qism kesilgan. | **O'rta:** faqat 2D kesimlar → qo'lda orientirlar bo'yicha 2D affin moslash (`export-plate-affine.mjs`) talab qiladi. |
| **4** | **Wikimedia Commons — Jamoat mulki (Public Domain) klassik Weigert/mielin plastinkalari** (masalan, *Gray's Anatomy* 1918, Obersteiner / Ranson) | **Public Domain (PD / CC0)** — mualliflik huquqi muddati tugagan; qayta ishlash va App Store'da cheklov yo'q. | O'rta (skanerlangan bosma plastinka, mielin bo'yog'i) | **To'liq:** klassik piramidalar kesishmasi (decussatio pyramidum) ko'ndalang kesimi mavjud. | **Past–o'rta:** faqat 2D sxematik/tarixiy rasm → `lesionFocal.ts` uchun 2D orientir affin transformatsiyasi kerak. |

### Rad etilgan manbalar (`AI.md` §2.1)
- **Brainstem Navigator** va **USC** gistologiya/MRI atlaslari — **CC BY-ND** (hosila ishlarga ruxsat yo'q) → foydalanilmaydi.

---

## 2. Aniq tavsiya va xavflar

1. **Asosiy tavsiya (`Agostinelli et al. 2023`, PMC9838717):**
   - `U1` plastinkasi uchun `Agostinelli et al. (2023)` ochiq **CC BY 4.0** miya ustuni atlasidan piramidalar kesishmasi darajasidagi ko'ndalang gistologik kesimni (va uning MRI juftini) ajratib olish.
   - `pipeline/tools/real_slices.py` uslubida `public/sections/real/medulla-decussation.webp` (~800–1200 px) yaratish va `src/data/sections/real.json` hamda `ATTRIBUTION.md` ga `Agostinelli et al. (2023), J Neurosci, DOI: 10.1523/jneurosci.0587-22.2022, CC BY 4.0` manbasini qo'shish.
2. **Zaxira tavsiya (eng tez):** Agar `Agostinelli` ma'lumot to'plamining xom tasvirlarini yuklash katta hajm talab qilsa, 1-bosqichda **Public Domain (Wikimedia Commons)** klassik Weigert mielin kesimini 2D orientir affini bilan ulab, keyin `Agostinelli` bilan almashtirish.
3. **Xavflar:**
   - **Kesim burchagi farqi:** Pastki uzunchoq miyada miya ustuni egilishi sababli 2D gistologik kesim burchagi MNI aksial tekisligidan 10°–20° farq qilishi mumkin → `export-plate-affine.mjs` bilan orientirlar (piramidalar, nozik/ponasimon yadrolar, markaziy kanal, trigeminal spinal trakt) bo'yicha 2D affin qoldiq xatosini (mm) albatta o'lchash kerak.
   - **Litsenziya izchilligi:** `Agostinelli et al. 2023` PMC sahifasida `CC BY 4.0`, Crossref metama'lumotida `CC BY-NC-SA 4.0` ko'rsatilgan — eng ehtiyotkor talqin sifatida notijorat ta'limiy foydalanish va to'liq attribution (`ATTRIBUTION.md`) saqlanishi lozim.

---

## 3. Tekshirilgan havolalar (Sana: 2026-11-24)

1. **Agostinelli LJ et al. (2023)** (*J Neurosci*, DOI `10.1523/jneurosci.0587-22.2022`, `PMC9838717`) — `https://pmc.ncbi.nlm.nih.gov/articles/PMC9838717/` (HTTP 200 ✅; Crossref ✅)
2. **Puonti O / NextBrain (2025)** (DOI `10.1101/2025.09.22.673638`, CC BY 4.0) — Crossref API ✅
3. **Allen Institute Terms of Use** — `https://alleninstitute.org/legal/terms-of-use` (HTTP 200 ✅)
