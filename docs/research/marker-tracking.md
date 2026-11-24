# Kamera orqali 6DoF marker kuzatuvi (SX-5 uchun tadqiqot)

> **Vazifa:** AG-13 (`AI.md` §5.4 · `docs/SURGERY.md` §2 SX-5, §3) · **Sana:** 2026-11-24  
> **Maqsad:** Chop etilgan marker yopishtirilgan oddiy qalamni shlemsiz, bitta veb-kamera orqali 6DoF jarrohlik asbobiga (zond / EVD kateteri / burg'u) aylantirish uchun brauzer kutubxonasi, kalibrlash matematikasi, marker geometriyasi va chop etish spetsifikatsiyasini tanlash.  
> **Maxfiylik talabi (`docs/SURGERY.md` §0.5):** WASM va skriptlar o'z originimizdan yuklanadi; kamera kadri brauzerdan chiqmaydi.

---

## 1. Brauzer kutubxonalari taqqoslanishi

Litsenziya talabi (`AI.md` §2.1, §5.4): **MIT / BSD / Apache-2.0** afzal; GPL va CC BY-ND taqiqlanadi. Barcha repolar 2026-11-24 da GitHub API orqali tekshirildi:

| Kutubxona / Repo | Texnologiya | Litsenziya (tekshirilgan) | Taxminiy hajm (gzip/xom) | Tezlik (640×480, CPU/WASM) | 6DoF pose usuli va aniqligi | Afzallik / kamchilik |
|---|---|---|---|---|---|---|
| **`arenaxr/apriltag-js-standalone`** (`AprilRobotics/apriltag` C → WASM) | C (AprilTag 3) → Emscripten WASM + Web Worker | **BSD-3-Clause** (wrapper) + **BSD-2-Clause** (C yadro, `LICENSE.md` tekshirildi) | ~250–600 KB WASM + glue | ~5–12 ms/kadr (Web Worker'da, 30–60 FPS) | **Yuqori:** `estimate_tag_pose_orthogonal_iteration` (sub-piksel qirralar, homografiya + ortogonal iteratsiya) | Faol qo'llab-quvvatlanadi (oxirgi push: `2026-11-17`); qisman soya va past yorug'likda eng barqaror; `tag36h11` da yolg'on aniqlash deyarli nol [Olson 2011; Wang & Olson 2016]. |
| **`damianofalcioni/js-aruco2`** | Sof JavaScript (eski `js-aruco` forki) | `NOASSERTION` (GitHub API da ildiz `LICENSE` fayli yo'q; asl `js-aruco` MIT) | ~50–150 KB JS | ~8–18 ms/kadr (sof JS) | **O'rta:** o'rnatilgan POSIT (kuchsiz sub-piksel aniqlik, bitta markerdagi pose-flip'ga sezgir) | Eng yengil va WASM'siz, lekin 2023-08 dan beri yangilanmagan; litsenziya fayli yo'qligi va sub-piksel aniqlik pastligi sababli SX-5 aniqligi uchun cheklangan. |
| **`OpenCV.js` (`opencv/opencv`, `aruco` moduli)** | C++ → Emscripten WASM | **Apache-2.0** | ~8–11 MB (to'liq build); custom aruco-only ~2–3 MB | ~6–15 ms/kadr | **Yuqori:** `solvePnP` (`SOLVEPNP_IPPE_SQUARE`, `SOLVEPNP_ITERATIVE`), `calibrateCamera` (Zhang 2000) | Eng boy API (ArUco + ChArUco + kamera kalibrlash tayyor) [Garrido-Jurado 2014; Romero-Ramirez 2018], lekin standart bundle juda katta (8+ MB) va custom Emscripten build talab qiladi. |
| **`AprilRobotics/apriltag` (o'zimizning minimal WASM build)** | C → Emscripten WASM | **BSD-2-Clause** | ~180–300 KB WASM (faqat `tag36h11`) | ~4–10 ms/kadr | **Yuqori:** AprilTag 3 native pose + ko'p-yuzli PnP (o'z TS/LM optimizatorimiz bilan) | Eng kichik va toza paket, lekin Emscripten CI/build zanjirini saqlash kerak; 1-bosqichda `apriltag-js-standalone` tayyor holda tezroq ishga tushadi. |

### Nima uchun bitta tekis marker yetarli emas? (Planar Pose Ambiguity)
Bitta kvadrat tekis markerning 6DoF pozasi perspektiv proyeksiya tufayli ayniqsa kamera markerga perpendikulyar (0°–20°) qaraganda **ikki xil burilish yechimi** o'rtasida sakrashi ("pose flip") bilan mashhur [Schweighofer & Pinz 2006; Collins & Bartoli 2014]. Bu muammo **IPPE** (*Infinitesimal Plane-Based Pose Estimation*) bilan yumshatiladi [Collins & Bartoli 2014], lekin jarrohlik qalami uchun eng ishonchli yechim — **ko'p yuzli 3D marker tanasi** (kub yoki dodekaedr) bo'lib, unda bir vaqtda 2–3 yuzning burchaklari bitta qattiq jism PnP tenglamasida birlashtiriladi [Wu et al. 2017].

---

## 2. Marker shakli: Kub vs Dodekaedr

| Xususiyat | 6-yoqli Kub (30 mm) | 12-yoqli Dodekaedr (*DodecaPen*) |
|---|---|---|
| **Ilmiy asos** | Standart ko'p-yuzli ArUco/AprilTag rigi | **DodecaPen (UIST 2017)** [Wu et al. 2017]: 12 beshburchak yuz, passiv stilus uchun ~0.4 mm pozitsiya va ~0.5° burchak aniqligi |
| **Ko'rinuvchi yuzlar (har kadrda)** | 1–3 yuz (5 ta markerli yuz + 1 ta qalam teshigi) | 2–5 yuz (11 ta markerli yuz + 1 ta qalam teshigi) |
| **Uyda yasash (A4 qog'oz + qaychi + yelim)** | **Oson (5 daqiqa)** — har talaba/shifokor darhol yig'a oladi | **Murakkab (20–30 daqiqa)** — qog'oz qirralari burchakda egilib qolishi mumkin (3D-bosma karkas afzal) |
| **Ko'r burchak (tracking loss)** | Qalam uchi kameraga to'g'ri qarasa 1 yuz qolishi mumkin | Deyarli 360° uzluksiz kuzatuv |
| **SX-5 uchun rol** | **1-bosqich standart (MVP)** — hamma uchun kirish to'sig'i nol | **2-bosqich PhD / 3D-bosma varianti** — maksimal aniqlik uchun |

---

## 3. Kalibrlash protokoli (Bitta veb-kamera + qalam uchi)

### 3.1 Kamera ichki parametrlari (Zhang 2000)
Aniq millimetr o'lchovi uchun kameraning ichki matritsasi $K$ va radial buzilish koeffitsientlari $(k_1, k_2)$ kerak [Zhang 2000]:
$$K = \begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}$$
- **Tezkor rejim (nol-kalibrlash zaxirasi):** Foydalanuvchi hali katakli qog'ozni chop etmagan bo'lsa, kamera gorizontal ko'rish burchagi $\text{HFOV} \approx 65^\circ$ (MacBook FaceTime HD tipik qiymati) deb olinadi: $f_x = f_y = \frac{W}{2 \tan(\text{HFOV}/2)} \approx 0.785\,W$, $c_x = W/2$, $c_y = H/2$, $k_1 = k_2 = 0$. Bu nisbiy harakat uchun yetarli, lekin mutlaq masofada ~3–6% xato beradi.
- **Aniq rejim (Zhang katakli qog'oz kalibrlashi):** Chop etilgan 7×10 katakli (6×9 ichki burchak, har katak **22.0 mm**) shaxmat taxtasini kamera oldida 12–15 ta turli qiyalik va masofada ko'rsatish; homografiyalar orqali $K, k_1, k_2$ hisoblanadi (`localStorage` da kamera `deviceId` bo'yicha saqlanadi). Reproyeksiya xatosi **< 0.5 px** bo'lsa kalibrlash tasdiqlanadi [Zhang 2000].

### 3.2 Qalam uchi offseti — Pivot kalibrlash [Yaniv 2015]
Marker kubi qalamning orqa uchiga o'rnatiladi; bizga qalamning **ishchi uchi** (marker lokal koordinatasidagi $\mathbf{p}_{\text{tip}} \in \mathbb{R}^3$) kerak.
1. Foydalanuvchi qalam uchini stol ustidagi bitta qo'zg'almas nuqtaga (masalan, qog'ozdagi kichik teshikcha/nuqtaga) tiraydi va uch sirpanmasdan qalamni 30°–50° konus bo'ylab sekin aylantiradi (**30–50 ta barqaror kadr** yig'iladi).
2. Har $i$-kadrda marker kuzatuvi $(R_i, \mathbf{t}_i)$ (marker → kamera) ni beradi. Uch nuqtasi kamera fazosida qo'zg'almas $\mathbf{p}_{\text{world}}$ bo'lgani uchun:
$$R_i \mathbf{p}_{\text{tip}} + \mathbf{t}_i = \mathbf{p}_{\text{world}} \implies \begin{bmatrix} R_i & -I_3 \end{bmatrix} \begin{bmatrix} \mathbf{p}_{\text{tip}} \\ \mathbf{p}_{\text{world}} \end{bmatrix} = -\mathbf{t}_i$$
3. Barcha $N$ kadr ustma-ust qo'yilib, $3N \times 6$ chiziqli tizim eng kichik kvadratlar (SVD / normal tenglamalar) bilan yechiladi (TypeScript'da ~35 qator, tashqi kutubxonasiz) [Yaniv 2015].
4. **Sifat nazorati:** har kadrdagi qoldiq xato $e_i = \|R_i \mathbf{p}_{\text{tip}} + \mathbf{t}_i - \mathbf{p}_{\text{world}}\|_2$ ning RMS qiymati **≤ 1.0 mm** bo'lsa kalibrlash muvaffaqiyatli; aks holda 10% eng katta outlier kadrlar (RANSAC / trimmed LS) chiqarilib qayta hisoblanadi [Yaniv 2015].

### 3.3 Qo'l kuzatuvi (MediaPipe) bilan birlashtirish
- **Asosiy holat (marker ko'rinmoqda):** 6DoF poza (pozitsiya + o'q vektori) to'liq AprilTag kubidan keladi va `src/hands/oneEuro.ts` (One Euro Filter) orqali silliqlanadi.
- **Qisqa yo'qolish (< 250 ms):** oxirgi tezlik bo'yicha qisqa ekstrapolyatsiya yoki muzlatish; MediaPipe chimdish nuqtasi faqat chuqurlik/mavjudlik zaxirasi sifatida ishlaydi (kadr ikki marta dekodlanmaydi — bir xil `<video>` elementi).
- **Sichqoncha zaxirasi (`SURGERY.md` §0.6):** SX-5 da ham barcha asboblar sichqoncha bilan ishlashda davom etadi.

---

## 4. SX-5 uchun yakuniy tavsiya va chop etish spetsifikatsiyasi

### 4.1 Tanlangan stek
- **Kutubxona:** `arenaxr/apriltag-js-standalone` (AprilTag 3 WASM, **BSD-3-Clause** / **BSD-2-Clause**), `tag36h11` oilasi; WASM fayli `public/models/apriltag/` ga joylanib o'z originimizdan yuklanadi.
- **Ko'p-yuzli poza yechimi (CC, SX-5):** Har kadrda ko'ringan kub yuzlarining (1–3 yuz) 4 tadan burchak nuqtalari kubning ma'lum 3D koordinatalariga bog'lanib, bitta umumiy PnP (IPPE boshlang'ich taxmin + Levenberg-Marquardt) bilan barqaror 6DoF poza olinadi — bu 1-yuzli pose-flip muammosini butunlay bartaraf etadi.
- **Marker shakli:** 1-bosqich — **30 mm qog'oz kub**; 2-bosqich — **DodecaPen 12-yoqli dodekaedr**.

### 4.2 Chop etiladigan PDF/SVG spetsifikatsiyasi (A4: 210 × 297 mm, 300 DPI)
Chop etishda brauzer/printer sozlamasi qat'iy **`100% / Actual Size`** ("Fit to page" O'CHIQ) bo'lishi shart; varaq chetida **50.0 mm va 100.0 mm tekshiruv chizg'ichi** bosiladi (foydalanuvchi oddiy lineyka bilan ±0.5 mm aniqlikni tekshiradi):

1. **Qalam kubi yoyi (Net — 1-bet yuqorisi):**
   - Kub qirrasi: **`30.0 × 30.0 mm`** (6 ta yuz, xochsimon yoyilma, `6.0 mm` yopishtirish quloqchalari bilan).
   - Markerlar: **`tag36h11` ID `0, 1, 2, 3, 4`** (5 ta yuz — tepa + 4 yon yuz).
   - Har markerning qora chegarasi: **`22.0 × 22.0 mm`** (8×8 ichki hujayra = `2.75 mm/bit`, atrofida **`4.0 mm` oq hoshiya / quiet zone** ≥ 1.45 bit).
   - Pastki (6-chi) yuz markazida qalam tanasi uchun **Ø 8.0 mm** kesish doirasi (oddiy qalam/ruchka Ø 7–8.5 mm ga zich kiyiladi).
   - Qog'oz tavsiyasi: **160–250 g/m²** mat (yaltiramaydigan) karton qog'oz — porloq qog'oz chiroq aksini berib aniqlashni yomonlashtiradi.
2. **Kamera kalibrlash shaxmat taxtasi (1-bet pasti / 2-bet):**
   - **7 × 10 katak** (6 × 9 ichki burchak), har katak **`22.0 × 22.0 mm`**, umumiy o'lcham **`154.0 × 220.0 mm`** (A4 ga bemalol sig'adi, atrofida ≥ 15 mm oq hoshiya).
   - Qattiq tekis yuzaga (kitob muqovasi yoki karton) tekis yopishtirilishi shart.
3. **SX-5 aniqlik o'lchash protokoli (`SURGERY.md` §2 DoD):**
   - Chop etilgan **100 × 100 mm** sinov panjarasida (har 25 mm da kesishma) 5 ta ma'lum nuqtaga pivot-kalibrlangan qalam uchini 2 sekunddan tekkizish.
   - Hujjatlashtiriladigan ko'rsatkichlar: (a) juft nuqtalar orasidagi o'lchangan vs haqiqiy masofa xatosi (mm, maqsad **≤ 2.0 mm** @ 40–50 sm masofada), (b) tinch holatdagi statik titrash RMS (mm, maqsad **≤ 0.8 mm**), (c) kuzatuv uzluksizligi (% kadrlar).

---

## 5. Tasdiqlangan manbalar (Tekshirilgan sana: 2026-11-24)

Barcha ilmiy maqolalar Crossref API (`https://api.crossref.org/works/<doi>`), repolar esa GitHub API orqali tekshirildi:

| # | Muallif (yil) / Repo | Sarlavha / Tavsif | DOI / URL | Litsenziya / Holat |
|---|---|---|---|---|
| 1 | **Wu PC et al. (2017)** | *DodecaPen: Accurate 6-DoF Tracking of a Passive Stylus.* ACM UIST 2017. | `10.1145/3126594.3126664` | Crossref ✅ (ACM) |
| 2 | **Garrido-Jurado S et al. (2014)** | *Automatic generation and detection of highly reliable fiducial markers under occlusion.* Pattern Recognition. | `10.1016/j.patcog.2014.01.005` | Crossref ✅ |
| 3 | **Romero-Ramirez FJ et al. (2018)** | *Speeded up detection of squared fiducial markers.* Image and Vision Computing. | `10.1016/j.imavis.2018.05.004` | Crossref ✅ |
| 4 | **Olson E (2011)** | *AprilTag: A robust and flexible visual fiducial system.* IEEE ICRA 2011. | `10.1109/icra.2011.5979561` | Crossref ✅ |
| 5 | **Wang J, Olson E (2016)** | *AprilTag 2: Efficient and robust fiducial detection.* IEEE/RSJ IROS 2016. | `10.1109/iros.2016.7759617` | Crossref ✅ |
| 6 | **Zhang Z (2000)** | *A flexible new technique for camera calibration.* IEEE TPAMI. | `10.1109/34.888718` | Crossref ✅ |
| 7 | **Schweighofer G, Pinz A (2006)** | *Robust Pose Estimation from a Planar Target.* IEEE TPAMI. | `10.1109/tpami.2006.252` | Crossref ✅ |
| 8 | **Collins T, Bartoli A (2014)** | *Infinitesimal Plane-Based Pose Estimation.* Int J Comput Vis. | `10.1007/s11263-014-0725-5` | Crossref ✅ |
| 9 | **Yaniv Z (2015)** | *Which pivot calibration?* SPIE Medical Imaging. | `10.1117/12.2081348` | Crossref ✅ |
| 10 | **`AprilRobotics/apriltag`** | Rasmiy AprilTag 3 C kutubxonasi | `https://github.com/AprilRobotics/apriltag` | **BSD-2-Clause** (`LICENSE.md` ✅) |
| 11 | **`arenaxr/apriltag-js-standalone`** | AprilTag 3 WASM brauzer porti | `https://github.com/arenaxr/apriltag-js-standalone` | **BSD-3-Clause** (GitHub API ✅) |
| 12 | **`opencv/opencv`** | OpenCV / OpenCV.js | `https://github.com/opencv/opencv` | **Apache-2.0** (GitHub API ✅) |
| 13 | **`damianofalcioni/js-aruco2`** | Sof JS ArUco forki | `https://github.com/damianofalcioni/js-aruco2` | `NOASSERTION` (ildiz `LICENSE` fayli yo'q; 2023-08) |
