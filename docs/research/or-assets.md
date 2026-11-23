# Virtual operatsiya xonasi uchun ochiq 3D assetlar va teksturalar ro'yxati

> **Vazifa:** AG-10 (`AI.md` §5.4 · `docs/SURGERY.md` §3) · **Sana:** 2026-11-23 · **Tekshirilgan sana:** 2026-11-23  
> **Maqsad:** `sx/main` branchidagi virtual operatsiya xonasi (SX-1) va asbob dvigateli (SX-2…SX-6) uchun **faqat CC0 yoki CC BY** litsenziyali 3D modellar, HDRI va PBR teksturalarini tanlash. **AG-11** (`pipeline/tools/or_assets.py`) ushbu ro'yxat asosida fayllarni yuklab, mm masshtabda Draco `.glb` ga o'tkazadi.  
> **Qat'iy litsenziya filtri (`docs/SURGERY.md` §0.4):** faqat **CC0 1.0** va **CC BY 4.0** (Attribution). **CC BY-ND, CC BY-NC, Standard va Editorial litsenziyalar qat'iyan rad etildi.**

---

## 1. Qisqa xulosa va hajm byudjeti (≤ 20 MB)

Barcha manbalar 2026-11-23 kuni rasmiy API'lar (`api.polyhaven.com`, `ambientcg.com/api/v2`, `api.sketchfab.com/v3`) va NIH 3D (`3d.nih.gov`) orqali tekshirildi:

- **Tayyor ochiq assetlar bilan to'liq qoplanadi:** Operatsiya xonasi HDRI (Poly Haven CC0), neyroxirurgik operatsiya stoli, jarrohlik chirog'i, Sugita neyroxirurgik bosh ramasi, monitor, so'rg'ich kanistri, umumiy jarrohlik asboblari, retraktor (Sketchfab CC BY 4.0) hamda jarrohlik choyshabi/po'lat/pol PBR teksturalari (Poly Haven va ambientCG CC0).
- **Ochiq CC0/CC BY model topilmagan tor-ixtisosli neyroxirurgik asboblar:** Mayfield 3-pinli qisqich, neyroxirurgik kraniotom/burg'u, Frazier burchakli so'rg'ich, EVD ventrikulyar kateteri (mm belgilari bilan) va DBS elektrodi (1.27 mm, 4 kontakt). **Tavsiya (AG-11):** ularni `pipeline/tools/or_assets.py` da parametrik CAD (`trimesh` / Blender Python, **CC0**) bilan yaratish — ham litsenziya 100% toza bo'ladi, ham SX-3/SX-4/SX-6 uchun **millimetr aniqlikdagi uch (tip) pivot** kafolatlanadi.
- **Byudjet:** Tavsiya etilgan barcha assetlarning jami hajmi Draco + 1K WebP optimizatsiyasidan keyin **~8.5–10.5 MB** (limit: ≤ 20 MB), har bir model **≤ 60k uchburchak** (limit: ≤ 150k).

---

## 2. HDRI muhit yorug'ligi (Poly Haven — 100% CC0)

Poly Haven barcha aktivlari **CC0 1.0** (jamoat mulki, attribution majburiy emas) ostida tarqatiladi.

| ID | Nomi | Havola | Litsenziya | Format | Hajm (1K / 2K `.hdr`) | Tavsiya |
|---|---|---|---|---|---|---|
| `or-hdri-surgery` | **Surgery** (Asosiy) | https://polyhaven.com/a/surgery | **CC0 1.0** | `.hdr` / `.exr` | **1.41 MB** / 5.66 MB | **Tavsiya etiladi (1K `.hdr`)** — haqiqiy operatsiya xonasi va jarrohlik chirog'i refleksiyasi |
| `or-hdri-hospital` | Hospital Room (Zaxira) | https://polyhaven.com/a/hospital_room | **CC0 1.0** | `.hdr` / `.exr` | 1.34 MB / 5.32 MB | Muqobil yumshoq klinika yorug'ligi |
| `or-hdri-hospital2` | Hospital Room 2 (Zaxira) | https://polyhaven.com/a/hospital_room_2 | **CC0 1.0** | `.hdr` / `.exr` | 1.61 MB / 6.37 MB | Yorug' (light) rejim uchun muqobil |

---

## 3. Operatsiya xonasi jihozlari (Sketchfab — CC BY 4.0)

Barcha Sketchfab modellari `api.sketchfab.com/v3` orqali `downloadable=true` va `license.label == "CC Attribution"` (CC BY 4.0) bilan tasdiqlangan.

| Kategoriya | Model nomi | Muallif | Havola | Litsenziya | Format | Uchburchaklar | Asl glTF hajmi | AG-11 holati |
|---|---|---|---|---|---|---|---|---|
| **Operatsiya stoli** | **C Arm Neurosurgery Operating Table** | `INGSOC1984` | https://sketchfab.com/3d-models/f92ebb77ec8249f8bb53cb9f256f55cc | **CC BY 4.0** | glTF / GLB | **9,230** | **0.12 MB** | **Asosiy tavsiya** (neyroxirurgiya uchun maxsus, juda yengil) |
| **Operatsiya stoli (zaxira)** | Hospital Operating Room/Examination Bed | `Chenchanchong` | https://sketchfab.com/3d-models/e3d748837ab14ef3aab1348faa20991d | **CC BY 4.0** | glTF / GLB | 72,381 | 1.36 MB | Zaxira (batafsilroq stol kerak bo'lsa) |
| **Jarrohlik chirog'i** | **Operating room lamps** | `House Doctor` | https://sketchfab.com/3d-models/04a8ddf6e47141289ce0372e9e842167 | **CC BY 4.0** | glTF / GLB | **57,328** | **1.06 MB** | **Asosiy tavsiya** (shiftga osilgan ikki boshli jarrohlik chirog'i) |
| **Boshni mahkamlash (Sugita)** | **Sugita Neurosurgical Head Frame System** | `INGSOC1984` | https://sketchfab.com/3d-models/0e710ddc70614f6a907627e31830ca71 | **CC BY 4.0** | glTF / GLB | **37,024** | **0.33 MB** | **Asosiy tavsiya** — Mayfield uchun CC0/CC BY model topilmadi; Sugita 4-pinli neyroxirurgik bosh ramasi uning real klinik muqobili |
| **Monitor (ixtiyoriy)** | **Stylized Patient Monitor Cart** | `Poras_Gamer` | https://sketchfab.com/3d-models/ddd733b99bfd4314871bb8c53861e4f8 | **CC BY 4.0** | glTF / FBX | 47,812 | 0.79 MB | Tavsiya (fon/OR realizmi uchun; ICP/EKG ekrani dinamik tekstura qilinishi mumkin) |
| **Shift monitorlari (ixtiyoriy)** | Operating Room Roof Monitors | `kareem.elgayyar` | https://sketchfab.com/3d-models/359aea63962d467cb81b42d942870644 | **CC BY 4.0** | glTF / GLB | 91,218 | 1.24 MB | Zaxira (kengaytirilgan OR uchun) |
| **So'rg'ich kanistri** | **Suction-canister** | `Dwayne.Barnett` | https://sketchfab.com/3d-models/34f41e2382fb4b66a9732cbebc8e872d | **CC BY 4.0** | glTF / GLB | 31,260 | 0.41 MB | Tavsiya (xona jihozi) |

*(Rad etilganlar misoli: Sketchfab'dagi `Surgical / Instrument table collection` (`a1fcfeab...`) — **CC BY-NC** bo'lgani uchun rad etildi; `Operating Table` (`e3a45122...`) — CC BY 4.0 bo'lsa-da 70.33 MB teksturali bo'lgani uchun asosiy ro'yxatga kiritilmadi.)*

---

## 4. Neyroxirurgik asboblar (Sketchfab CC BY 4.0 + AG-11 Parametrik CAD)

| Asbob | Topilgan ochiq model / Yechim | Muallif / Manba | Havola | Litsenziya | Uchburchaklar | Hajm | Izoh (SX-2 / SX-3 / SX-4 / SX-6) |
|---|---|---|---|---|---|---|---|
| **Pinset / Bipolyar asos** | **Basic surgical instruments** (to'plam) | `lsirabella` (Sketchfab) | https://sketchfab.com/3d-models/fde4da61ef8041688ae6a7a792260d15 | **CC BY 4.0** | 38,652 | **0.56 MB** | Umumiy jarrohlik asboblari; bipolyar uchun uchi bo'yalgan/izolyatsiyalangan variant ham parametrik qo'shiladi |
| **Pinset (muqobil)** | Medical Forceps | `Fhay.Alonso` (Sketchfab) | https://sketchfab.com/3d-models/46e4d6704bcb42d0a0ea907275e3c780 | **CC BY 4.0** | 31,850 | 2.84 MB | Zaxira (bitta pinset) |
| **Retraktor** | **Retractor V1** | `Judith Solomon` (Sketchfab) | https://sketchfab.com/3d-models/39b64baa59fd4acfb8adf68fec0186de | **CC BY 4.0** | 38,438 | **2.44 MB** | Draco + tekstura siqish bilan ~0.7 MB |
| **Kraniotom / Neyroxirurgik burg'u** | **Parametrik CAD (`or_assets.py`)** | O'zimiz (AG-11) | Sketchfab/NIH 3D da CC0/CC BY model topilmadi (0 natija) | **CC0 1.0** | ~8,000 | **~0.08 MB** | SX-4 voksel burg'ulash uchun 14 mm perforator va kesuvchi burgu uchi aynan `(0,0,0)` pivotda bo'lishi shart |
| **Frazier so'rg'ich naychasi** | **Parametrik CAD (`or_assets.py`)** | O'zimiz (AG-11) | Sketchfab da faqat kanistr bor | **CC0 1.0** | ~4,000 | **~0.04 MB** | 120° burchakli, barmoq teshikli 3 mm neyroxirurgik so'rg'ich |
| **Ventrikulyar kateter (EVD)** | **Parametrik CAD (`or_assets.py`)** | O'zimiz (AG-11) | Sketchfab da faqat venoz kateter (`69f883fd...`, 0.31 MB) bor | **CC0 1.0** | ~3,500 | **~0.04 MB** | SX-3 uchun tashqi diametr **3.0 mm**, **5 / 6 / 7 cm** chuqurlik halqa belgilari va olinadigan metall stylet |
| **DBS elektrodi (4-kontakt / 1-3-3-1)** | **Parametrik CAD (`or_assets.py`)** | O'zimiz (AG-11) | Sketchfab va NIH 3D da CC0/CC BY model topilmadi | **CC0 1.0** | ~3,000 | **~0.03 MB** | SX-6 uchun **1.27 mm** diametr, **4 × 1.5 mm** platina-iridiy kontakt + **0.5 mm** oraliqlar |
| **Mayfield 3-pinli qisqich (ixtiyoriy)** | **Parametrik CAD (`or_assets.py`)** | O'zimiz (AG-11) | Sketchfab da faqat Sugita ramasi bor | **CC0 1.0** | ~5,000 | **~0.05 MB** | Sugita ramasi yonida klassik Mayfield 3-pinli taqa varianti |

> **NIH 3D (`3d.nih.gov`) tekshiruvi:** NIH 3D repozitoriyasida asosan 3D-bosma o'quv fantomlari (masalan, *Durotomy Repair Training Model for Neurosurgery* `3DPX-016949`, *Neurosurgical Phantom for Fluorescence Imaging*, *Hydrocephalus Shunt Testing Bioreactor*) mavjud — ular STLs/fantom bo'lib, operatsiya xonasi jihozlari yoki asboblari emas. Shuning uchun OR jihozlari uchun Sketchfab (CC BY 4.0) + Poly Haven/ambientCG (CC0) + parametrik CAD eng toza kombinatsiyadir.

---

## 5. Mato, qoplama, metall va pol PBR teksturalari (100% CC0)

| Foydalanish joyi | Asset ID / Nomi | Manba | Havola | Litsenziya | Format (1K) | Asl hajm | WebP (1K) taxminiy hajm |
|---|---|---|---|---|---|---|---|
| **Jarrohlik choyshabi (yashil)** | `stretch_poplin` (Stretch Poplin) | Poly Haven | https://polyhaven.com/a/stretch_poplin | **CC0 1.0** | JPG (diff+nor+rough) | 1.74 MB | **~0.75 MB** |
| **Jarrohlik qoplamasi (ko'k)** | `rough_linen` (Rough Linen) | Poly Haven | https://polyhaven.com/a/rough_linen | **CC0 1.0** | JPG (diff+nor+rough) | 2.84 MB | **~0.95 MB** |
| **Steril mato (zaxira)** | `Fabric081C` | ambientCG | https://ambientcg.com/view?id=Fabric081C | **CC0 1.0** | 1K-JPG ZIP | 5.04 MB | ~0.85 MB |
| **Zanglamas po'lat (asboblar/stol)** | `Metal049A` | ambientCG | https://ambientcg.com/view?id=Metal049A | **CC0 1.0** | 1K-JPG ZIP | 2.74 MB | **~0.65 MB** |
| **Operatsiya xonasi poli** | `old_linoleum_flooring_01` | Poly Haven | https://polyhaven.com/a/old_linoleum_flooring_01 | **CC0 1.0** | JPG (1K) | ~1.80 MB | **~0.75 MB** |
| **Tibbiy plastik korpus** | `Plastic010` | ambientCG | https://ambientcg.com/view?id=Plastic010 | **CC0 1.0** | 1K-JPG ZIP | 3.54 MB | ~0.55 MB |

---

## 6. AG-11 konvertatsiya spetsifikatsiyasi va yakuniy byudjet (≤ 20 MB)

**AG-11 (`pipeline/tools/or_assets.py`, branch `ag/AG-11` → `origin/sx/main`) uchun qat'iy texnik talablar:**
1. **Masshtab va o'qlar:** Barcha `.glb` fayllar **millimetr (mm)** birlikda (Neuro Atlas MNI fazosiga mos, 1 unit = 1 mm), **Y-up**, asboblarning ishchi uchi (tip) lokal `(0, 0, 0)` da va dastasi `+Y` (yoki `-Z`) bo'ylab yo'naltirilgan bo'ladi.
2. **Geometriya va tekstura siqish:** Har model ≤ 150k uchburchak (zarur bo'lsa quadric decimation), Draco siqish (`gltf-transform draco`), teksturalar 1024×1024 **WebP** (`q=80`).
3. **Manifest va Attribution:** `public/or/manifest.json` da har bir fayl uchun `{ id, file, license, author, sourceUrl, triangles, sizeBytes, tipOffsetMm }` yoziladi; barcha CC BY 4.0 mualliflari `ATTRIBUTION.md` ning yangi "Virtual Operating Room (`sx/main`)" bo'limiga kiritiladi.

### Yakuniy tavsiya etilgan paket byudjeti

| Asset guruhi | Litsenziya | Uchburchaklar (jami) | Draco + WebP hajmi (taxmin) |
|---|---|---|---|
| HDRI (`surgery` 1K `.hdr`) | CC0 1.0 | — | 1.41 MB |
| Operatsiya stoli (`C Arm Neurosurgery Operating Table`) | CC BY 4.0 | 9,230 | 0.10 MB |
| Bosh ramasi (`Sugita Neurosurgical Head Frame System`) | CC BY 4.0 | 37,024 | 0.25 MB |
| Jarrohlik chirog'i (`Operating room lamps`) | CC BY 4.0 | 57,328 | 0.70 MB |
| Monitor + So'rg'ich kanistri | CC BY 4.0 | 79,072 | 0.85 MB |
| Jarrohlik asboblari (`Basic surgical instruments` + `Retractor V1`) | CC BY 4.0 | 77,090 | 1.30 MB |
| Parametrik CAD neyroxirurgik asboblar (6 ta: burg'u, so'rg'ich, bipolyar, EVD, DBS, Mayfield) | CC0 1.0 | ~27,500 | 0.30 MB |
| PBR teksturalar (4 ta 1K WebP to'plam: yashil/ko'k choyshab, po'lat, linoleum) | CC0 1.0 | — | 3.10 MB |
| **JAMI** | **CC0 + CC BY 4.0** | **~287k** (har biri ≤ 58k) | **~8.0 MB** (limit ≤ 20 MB — **60% zaxira**) |

---

## 7. PhD / neyroxirurg darajasidagi qo'shimcha tavsiya (`AI.md` §2.10)

- **Kalibrlangan o'lchov aniqligi:** EVD kateteri (5/6/7 cm qora halqalar, 3.0 mm tashqi diametr) va DBS elektrodi (1.27 mm diametr, 1.5 mm kontaktlar, 0.5 mm bo'shliqlar — Medtronic 3389 geometriyasi) parametrik yaratilganda, foydalanuvchi SX-1/SX-3/SX-6 da millimetr chizg'ichi (ruler) bilan real klinik o'lchamlarni 1:1 ko'radi.
- **Klinik yorug'lik harorati:** Jarrohlik chirog'i (SX-1) 4300–4500 K (neytral-sovuq LED) va CRI > 95 refleksiya parametri bilan `surgery` HDRI ustiga qo'yilganda, miya po'stlog'i va qon tomirlarining rangi real operatsiya mikroskopi ko'rinishiga yaqinlashadi.
