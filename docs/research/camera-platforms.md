# Kamera funksiyalari qaysi platformada: Veb / macOS / iPadOS (HT-1, HP-1, HT-2, OP-*)

> **Vazifa:** AG-8 (`AI.md` §5.4 · `docs/HANDS.md` §4 · `docs/SURGERY.md` §0.1, §3) · **Sana:** 2026-11-24  
> **Maqsad:** Qo'l bilan boshqarish (`HT-1`), bosh bilan qarash / "3D oyna" (`HP-1`), asbob dvigateli (`HT-2`) va jarrohlik simulyatori (`OP-*` / `sx/main`) ni umumiy vebga (`master`) qo'shish yoki Mac/iPad native ilovalariga qoldirish bo'yicha texnik va App Store qaror asosini berish.  
> **Izoh:** Haqiqiy Mac/iPad qurilmasida o'lchanmagan tezlik va kechikish raqamlari ochiqcha ***(taxmin)*** deb belgilangan.

---

## 1. macOS Vision framework vs MediaPipe Web (`@mediapipe/tasks-vision`)

Apple'ning **Vision** framework'i WWDC 2020 Session 10653 ("Detect Body and Hand Pose with Vision") dan beri tizim darajasida qo'l va yuz nuqtalarini aniqlashni ta'minlaydi [1][2][3].

| Mezon | macOS Vision (`VNDetectHumanHandPoseRequest` + `VNDetectFaceLandmarksRequest`) | MediaPipe Web (`@mediapipe/tasks-vision`) |
|---|---|---|
| **Minimal OS / brauzer** | Hand Pose: **macOS 11.0+ / iOS 14.0+** [2]; Face Landmarks: **macOS 10.13+ / iOS 11.0+** [3] | Chrome, Safari 16+, Firefox (WebGL2 + WASM SIMD) [10] |
| **Chiqish nuqtalari** | Qo'l: **21 ta 2D normallashtirilgan nuqta** + `confidence` (3D metrik chuqurlik yo'q) [1][2]; Yuz: 76 nuqta + `yaw`/`pitch`/`roll` | Qo'l: **21 ta 2D + 3D metrik `worldLandmarks`**; Yuz: `BlazeFace` / 478 nuqta |
| **Tezlatish** | Apple Neural Engine (ANE) + Metal GPU — brauzer WebGL konteksti bilan raqobatlashmaydi | WebGL2 (`delegate: "GPU"`) yoki WASM SIMD/XNNPACK (CPU) [10] |
| **Kechikish *(taxmin)*** | ~5–12 ms/kadr Apple Silicon ANE'da *(taxmin — haqiqiy Mac'da o'lchanmagan)* | ~12–25 ms/kadr MacBook GPU'da; ~30–50 ms CPU fallback *(taxmin)* |
| **Ilova hajmi / RAM** | **0 MB** qo'shimcha yuklama (OS ichida) | **~15 MB** WASM + `.task` / `.tflite` modellar (`public/models/`) |
| **Cross-platform** | Faqat Apple (macOS / iPadOS / iOS) | Windows, Linux, macOS, Android, iPadOS (bitta kod) |

**Xulosa:** Native Mac ilovasida Vision ANE'da ishlaydi va Three.js WebGL kanvasi bilan GPU xotirasini talashmaydi. Lekin `VNDetectHumanHandPoseRequest` faqat **2D** nuqtalar beradi (chuqurlikni kaft o'lchami bo'yicha baholash kerak — xuddi hozirgi `src/hands/mapping.ts` kabi).

---

## 2. iPadOS: ARKit Face Tracking (TrueDepth) va Apple Pencil

### 2.1 `ARFaceTrackingConfiguration` va TrueDepth — "3D oyna" (HP-1) uchun haqiqiy chuqurlik
- `ARFaceTrackingConfiguration` foydalanuvchi yuzining **haqiqiy metrik 3D pozasi** (`ARFaceAnchor.transform` — metrda $x, y, z$ va to'liq 3D burilish) ni 3 metrgacha masofada kuzatadi [4].
- **Haqiqiy chuqurlik beradimi?** **Ha.** Hozirgi RGB veb-kameradagi `HP-1` ko'zlar orasidagi 2D masofa orqali taxminiy chuqurlik hisoblaydi; TrueDepth esa infraqizil nuqta proyektori orqali aniq metrik chuqurlik beradi — natijada off-axis "3D oyna" (*head-coupled perspective*) qorong'i xonada ham barqaror va silkinishsiz ishlaydi.
- **TrueDepth kameraga ega iPad modellari ro'yxati:**
  - **iPad Pro 11-inch:** 1-avlod (2018), 2-avlod (2020), 3-avlod (M1, 2021), 4-avlod (M2, 2022), M4 (2024)
  - **iPad Pro 12.9-inch:** 3-avlod (2018), 4-avlod (2020), 5-avlod (M1, 2021), 6-avlod (M2, 2022)
  - **iPad Pro 13-inch:** M4 (2024)
  - *(iPad Air, iPad mini va bazaviy iPad modellarida TrueDepth yo'q — ularda `ARFaceTrackingConfiguration.isSupported == false` bo'ladi va 2D RGB kamera yoki oddiy sensorli boshqaruvga tushiladi.)*

### 2.2 Apple Pencil — jarrohlik asbobi sifatida (`HT-2` / `OP-*`)
iPad'da kamerasiz va chop etilgan markersiz eng aniq jarrohlik kiritish vositasi — **Apple Pencil** (ayniqsa **Apple Pencil Pro** + M2/M4 iPad Pro / M2+ iPad Air):
- **Hover (`UIHoverGestureRecognizer.zOffset` / `PencilHoverPose`):** ekran ustida ~12 mm gacha balandlikda qalam uchini va qiyaligini ko'rsatadi [5] → EVD kateteri yoki zondni bosh suyagi ustida **tekkizmasdan nishonlash** (Kocher nuqtasi).
- **Azimuth va Altitude (`azimuthAngle(in:)`, `altitudeAngle`):** qalamning 3D yo'nalish vektori (sagittal + koronal burchaklar) → EVD/DBS traektoriyasini bevosita tabiiy qo'l burchagi bilan berish.
- **Barrel Roll (`UITouch.rollAngle` / `PencilHoverPose.roll`):** qalamning o'z o'qi atrofida aylanishi (Apple Pencil Pro) [6] → egri zond, mikroskop yoki DBS yo'naltirilgan kontaktini aylantirish.
- **Bosim (`UITouch.force`) + Haptik teskari aloqa (Apple Pencil Pro):** burg'ulashda (SX-4) bosim kuchi (`push`) va ichki plastinka ogohlantirishi / ependimal "pop" uchun to'g'ridan-to'g'ri barmoqda seziladigan haptik signal!

---

## 3. `WKWebView` da `getUserMedia` va Native → Web ko'prik

### 3.1 `WKWebView` da `getUserMedia` shartlari
1. **OS versiyalari:** dastlabki qo'llab-quvvatlash **iOS 14.3+**, barqaror ruxsat delegati esa **iOS 15.0+ va macOS 12.0+** (`WKUIDelegate.webView(_:requestMediaCapturePermissionFor:initiatedByFrame:type:decisionHandler:)`) [7]. Ushbu delegat yozilmasa, `WKWebView` har safar qayta so'raydi yoki bloklaydi.
2. **`Info.plist` va Entitlements:**
   - `NSCameraUsageDescription` — aniq sabab bilan yozilishi shart (aks holda ilova qulaydi).
   - **macOS App Sandbox:** `com.apple.security.device.camera` entitlement yoqilishi shart.
3. **Xavfsiz kontekst (Secure Context):** `file://` URL'larida `getUserMedia` **ishlamaydi**; lokal HTML/JS to'plami uchun `WKURLSchemeHandler` yoki lokal `http://127.0.0.1` server (yoki `https://`) zarur.

### 3.2 Native → Web landmark uzatish (`postMessage` / `evaluateJavaScript`)
`WKWebView` ichida MediaPipe WASM ishlatish o'rniga, native Swift qatlami (Vision / ARKit) kadrni o'zi qayta ishlab, vebga faqat kichik sonli paket yuboradi (`docs/SURGERY.md` §0.6: dvigatel `HandFrame` / `FaceObs` manbasiga bog'liq emas):
- **Paket hajmi:** 21 qo'l nuqtasi × 3 float + 1 yuz pozasi ≈ **400–650 bayt JSON** (yoki `Float32Array` ~300 bayt).
- **Chastota va o'tkazish:** 30–60 Hz da **~18–36 KB/s**, `evaluateJavaScript` kechikishi **~1–3 ms** *(taxmin — haqiqiy qurilmada o'lchanmagan)*.
- **Afzalligi:** WebView ichida 15 MB WASM yuklanmaydi, kamera ruxsati faqat bitta (native) marta so'raladi, WebGL xotira chegarasi (iPad WKWebView, `docs/research/app-store.md`) tejaladi.

---

## 4. App Store: kamera maxfiyligi, Privacy Manifest va Guideline 5.1.1 / 5.1.2

Rasmiy App Store Review Guidelines (`https://developer.apple.com/app-store/review/guidelines/`, tekshirilgan sana: **2026-11-24**) dan joriy iqtiboslar [9]:

> **5.1.1 Data Collection and Storage (i) Privacy Policies:**  
> *"All apps must include a link to their privacy policy in the App Store Connect metadata field and within the app in an easily accessible manner. The privacy policy must clearly and explicitly: Identify what data, if any, the app/service collects, how it collects that data, and all uses of that data."* [9]

> **5.1.2 Data Use and Sharing (i):**  
> *"Unless otherwise permitted by law, you may not use, transmit, or share someone’s personal data without first obtaining their permission. You must provide access to information about how and where the data will be used. You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so."* [9]

**Neuro Atlas uchun amaliy ta'siri:**
1. **Kamera kadrlarining qurilmada qolishi (`SURGERY.md` §0.5):** Video kadrlar serverga ham, uchinchi tomon AI'ga ham yuborilmaydi → App Store Privacy Nutrition Label'da kamera/video uchun **"Data Not Collected"** ko'rsatiladi (faqat AI chat paneli alohida 5.1.2 rozilik oynasi talab qiladi, `docs/research/app-store.md` da yozilganidek).
2. **`NSCameraUsageDescription`:** aniq va konkret bo'lishi shart (masalan: *"Camera is used locally on-device for hands-free 3D brain rotation and head-tracked viewing; no video is recorded or transmitted."*).
3. **Privacy Manifest (`PrivacyInfo.xcprivacy`):** [8] `NSPrivacyAccessedAPITypes` bo'limida ilova yoki SDK ishlatadigan *Required Reason API* lar (masalan, `UserDefaults` — `CA92.1`) ko'rsatilishi shart; kamera API'sining o'zi Required Reason ro'yxatida emas, lekin `PrivacyInfo.xcprivacy` faylining o'zi barcha yangi App Store yuklamalari uchun majburiy.

---

## 5. Safari va Firefox'da `@mediapipe/tasks-vision` holati

Rasmiy Google AI Edge MediaPipe Web hujjatlari va brauzer mosligi tahlili [10]:
- **WASM + WASM SIMD (XNNPACK CPU):** Chrome, Safari (macOS/iOS 16.4+) va Firefox'da to'liq ishlaydi. Server `.wasm` fayllarini `application/wasm` MIME turi bilan uzatishi kerak (Vite + GitHub Pages buni bajaradi).
- **GPU Delegate (`delegate: "GPU"`):** **WebGL2** ustida ishlaydi (WebGPU emas).
  - **Safari:** ishlaydi, lekin ayrim macOS/iOS versiyalarida WebGL2 shader / yarim-aniqlik (half-float) farqlari tufayli ba'zan kontekst xatosi kuzatilishi mumkin.
  - **Firefox:** WebGL2 bor, biroq ba'zi grafik drayverlarda GPU delegate ishga tushmay qolishi mumkin; shuningdek Firefox'da `MediaStreamTrackProcessor` (Insertable Streams) to'liq qo'llab-quvvatlanmagani uchun jonli video `<video>`/`<canvas>` orqali uzatiladi.
- **Amaliy qoida:** vebda MediaPipe doimo **GPU → CPU (WASM SIMD)** avtomatik zaxira zanjiri bilan ishga tushirilishi va faqat foydalanuvchi tugmani bosganda (lazy-load) yuklanishi shart.

---

## 6. Yakuniy tavsiya jadvali (`docs/HANDS.md` §4 A/B/C qarori uchun)

**Umumiy strategiya (Gibrid B/C):** Umumiy veb (`master`) asosiy 3D atlas va darslar uchun yengil va tez qoladi; kamera va simulyator (`sx/main`) vebda faqat ixtiyoriy/lazy-load beta rejimda, native **Mac** va **iPad** ilovalarida esa Apple'ning o'z sensorlari (Vision, TrueDepth ARKit, Apple Pencil Pro) bilan maksimal sifatda beriladi.

| Funksiya | Veb (`master` / GitHub Pages) | macOS ilovasi (WKWebView + Swift) | iPadOS ilovasi (WKWebView + Swift) | Asosiy sabab |
|---|---|---|---|---|
| **HT-1: Qo'l bilan boshqarish** | **Ixtiyoriy (lazy-load beta)** — MediaPipe WebGL2 → CPU fallback; standart o'chiq | **Ha (asosiy)** — Native `VNDetectHumanHandPoseRequest` (ANE) → `postMessage` | **Ixtiyoriy / ikkilamchi** — iPad'da barmoq/Pencil qo'l kamerasidan qulayroq | Vebda 15 MB WASM asosiy yuklanishni sekinlashtirmasligi kerak; Mac'da Vision ANE eng tez va GPU'ni bo'sh qoldiradi. |
| **HP-1: Bosh bilan qarash ("3D oyna")** | **Ixtiyoriy (lazy-load beta)** — MediaPipe Face (2D chuqurlik taxmini) | **Ha (asosiy)** — Native Vision Face Landmarks → `postMessage` | **Ha (flagman — iPad Pro)** — **`ARFaceTrackingConfiguration` (TrueDepth)** haqiqiy 3D chuqurlik | TrueDepth iPad Pro'da haqiqiy metrik 3D chuqurlik berib, shlemsiz "3D oyna" effektini eng yuqori darajaga chiqaradi. |
| **HT-2: Jarrohlik asbobi (zond / kateter / burg'u)** | **Sichqoncha + ixtiyoriy AprilTag 6DoF qalam (AG-13)** | **Sichqoncha + AprilTag 6DoF qalam (SX-5)** + ixtiyoriy qo'l | **Apple Pencil Pro (flagman)** — hover, azimuth/altitude, barrel roll, bosim + haptika | iPad'da Apple Pencil Pro markersiz va kamerasiz eng aniq 5–6DoF + bosim + haptik asbobdir; Mac/vebda esa sichqoncha + AprilTag qalam. |
| **OP-* Simulyator (`sx/main`: EVD, burg'u, DBS)** | **Alohida `/surgery` yoki beta yoqilg'ich** (sichqoncha to'liq ishlaydi) | **Ha (to'liq)** — native Vision/marker + geympad + yuqori GPU byudjeti | **Ha (iPad Pro M2/M4)** — TrueDepth 3D oyna + Apple Pencil Pro | Vebda hamma sinab ko'ra oladi (sichqoncha bilan), Mac va iPad Pro'da esa haqiqiy "shlemsiz VR" hissi beriladi. |

---

## 7. Tekshirilgan rasmiy havolalar (Sana: 2026-11-24)

Barcha havolalar 2026-11-24 da HTTP `200` bilan ochib tekshirildi:

1. **Apple WWDC 2020 Session 10653:** *Detect Body and Hand Pose with Vision* — `https://developer.apple.com/videos/play/wwdc2020/10653/`
2. **Apple Developer — Vision:** `VNDetectHumanHandPoseRequest` — `https://developer.apple.com/documentation/vision/vndetecthumanhandposerequest`
3. **Apple Developer — Vision:** `VNDetectFaceLandmarksRequest` — `https://developer.apple.com/documentation/vision/vndetectfacelandmarksrequest`
4. **Apple Developer — ARKit:** `ARFaceTrackingConfiguration` — `https://developer.apple.com/documentation/arkit/arfacetrackingconfiguration`
5. **Apple Developer — UIKit:** `UIHoverGestureRecognizer.zOffset` — `https://developer.apple.com/documentation/uikit/uihovergesturerecognizer/zoffset`
6. **Apple Developer — UIKit:** `UITouch.rollAngle` — `https://developer.apple.com/documentation/uikit/uitouch/rollangle`
7. **Apple Developer — WebKit:** `WKUIDelegate.webView(_:requestMediaCapturePermissionFor:initiatedByFrame:type:decisionHandler:)` — `https://developer.apple.com/documentation/webkit/wkuidelegate/webview(_:requestmediacapturepermissionfor:initiatedbyframe:type:decisionhandler:)`
8. **Apple Developer — Bundle Resources:** *Privacy manifest files* — `https://developer.apple.com/documentation/bundleresources/privacy-manifest-files`
9. **Apple Developer — App Review Guidelines (5.1.1, 5.1.2):** — `https://developer.apple.com/app-store/review/guidelines/`
10. **Google AI Edge — MediaPipe Web Setup Guide:** — `https://developers.google.com/edge/mediapipe/solutions/setup_web`
