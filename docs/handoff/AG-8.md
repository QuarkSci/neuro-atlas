# AG-8 — Tadqiqot: kamera funksiyalari qaysi platformada (veb / Mac / iPad)

Branch: `ag/AG-8` (asos: `origin/master`) · Sana: 2026-11-24

## Nima qilindi

- `docs/research/camera-platforms.md` yozildi (faqat hujjat, `src/` ga tegilmadi):
  1. **macOS Vision vs MediaPipe Web:** `VNDetectHumanHandPoseRequest` (macOS 11+, 21 ta 2D nuqta, ANE, WWDC 2020 #10653) va `VNDetectFaceLandmarksRequest` (macOS 10.13+) bilan `@mediapipe/tasks-vision` (15 MB WASM, WebGL2/SIMD, 3D `worldLandmarks`) qiyosi.
  2. **iPadOS:** `ARFaceTrackingConfiguration` (TrueDepth haqiqiy metrik 3D chuqurlik — "3D oyna" uchun eng yaxshi yechim), TrueDepth'li iPad Pro modellari ro'yxati hamda **Apple Pencil Pro** (hover `zOffset`, azimuth/altitude, `rollAngle`, bosim + haptika) jarrohlik asbobi sifatida.
  3. **`WKWebView` da `getUserMedia` va Native → Web ko'prik:** iOS 15+ / macOS 12+ `WKUIDelegate.webView(_:requestMediaCapturePermissionFor:...)`, `NSCameraUsageDescription`, `com.apple.security.device.camera`, `file://` cheklovi, hamda native → web landmark uzatish (`postMessage`/`evaluateJavaScript`, ~18–36 KB/s).
  4. **App Store maxfiyligi:** Guideline **5.1.1(i)** va **5.1.2(i)** joriy matnidan aniq iqtiboslar, `PrivacyInfo.xcprivacy` (`NSPrivacyAccessedAPITypes`), kamera kadrlari qurilmada qolgani uchun "Data Not Collected" ustunligi.
  5. **Safari va Firefox'da MediaPipe:** WebGL2 GPU delegate + WASM SIMD/XNNPACK CPU fallback zanjiri, Firefox `MediaStreamTrackProcessor` cheklovi.
  6. **Yakuniy tavsiya jadvali (Gibrid B/C):** HT-1, HP-1, HT-2 va OP-* ning har biri uchun Veb / macOS / iPadOS taqsimoti.

## O'zgargan fayllar (AI.md 5.4 ro'yxatida)

- `docs/research/camera-platforms.md` (yangi)
- `docs/handoff/AG-8.md` (ushbu handoff)

## Tekshiruv

- Kod o'zgartirilmadi (faqat hujjat).
- **Havolalar tekshiruvi (2026-11-24):** barcha 10 ta rasmiy Apple Developer, WWDC 2020, App Review Guidelines va Google AI Edge MediaPipe havolalari HTTP `200` bilan ochib tekshirildi; o'lchanmagan kechikish raqamlari ochiqcha `*(taxmin)*` deb belgilandi.

## Ochiq savollar / qolgan ishlar

- Foydalanuvchi ushbu jadval asosida `docs/HANDS.md` §4 dagi A/B/C qarorini tasdiqlagach, native bridge (`CL-7`) va `sx/main` integratsiya yo'li aniqlashadi.

## Ko'rib chiqish (Claude to'ldiradi)
