# Neuro Atlas — Apple ilovalari (macOS, iPadOS) va veb ↔ native ko'prik

> Manba: foydalanuvchi spetsifikatsiyasi `neuro_atlas_macos_ipados_va_bridge_spetsifikatsiyasi.md` (2026-11-22).
> Bu hujjat uni **loyihaning haqiqiy kodiga moslashtirilgan** shakli: nomlar, turlar va bosqichlar `src/` dagi mavjud
> store, sahna va AI qatlamiga bog'langan; amalga oshmaydigan yoki xavfli joylar belgilangan. Spetsifikatsiyadagi har bir
> g'oya shu yerda saqlangan (3-bo'lim jadvali). Bosqichlar `PLAN.md` 5.7 va `AI.md` taxtasida (CL-7, AG-6, AG-7).

---

## 0. Asosiy qarorlar

1. **Bitta veb-kod, ikki qobiq.** Xcode ilovasi — SwiftUI multiplatform (macOS + iPadOS) ichida `WKWebView`; 3D, darslar,
   AI — hammasi hozirgi veb-kod. Native qism faqat veb qila olmaydiganini qiladi (menyu, haptik, Pencil Pro, Spotlight,
   AR, iCloud, Handoff). Alohida repo: `QuarkSci/neuro-atlas-apple` (1-bosqichda ochiladi), veb `dist/` uning ichiga
   build vaqtida ko'chiriladi.
2. **Veb-kod native'ni bilmaydi.** Hamma aloqa bitta modul orqali: `src/bridge/` (0-bosqich). Vebda ko'prik "jim" —
   chaqiruvlar hech narsa qilmaydi, xato bermaydi.
3. **Bitta buyruq qatlami.** Native buyruqlari, `#s=` havolalari va AI tool'lari (`src/ai/tools.ts`) bir xil store amallarini
   chaqiradi — uch xil yo'l, bitta mantiq. Yangi imkoniyat bir marta yoziladi.
4. **Ilova bepul bo'ladi** (to'lov, obuna, reklama yo'q) — 5-bo'lim: Julich, JHU, BigBrain, HCP ma'lumotlari tijoratsiz
   litsenziyada. Pullik variant faqat o'sha qatlamlarsiz mumkin.
5. **Veb-kod ilova ichida, internetdan emas.** `dist/` va meshlar ilova paketida (`WKURLSchemeHandler`, `neuroatlas-local://`):
   oflayn ishlaydi, App Review "masofadan kod yuklash" (2.5.2) savoli tug'ilmaydi; yangilanish — App Store orqali.

---

## 1. Ko'prik (0-bosqich, vebda — CL-7)

### 1.1 Fayllar
```
src/bridge/
  types.ts      PlatformType, NativeCapabilities, WebToNativeEvent, NativeToWebCommand (quyida)
  bridge.ts     detect(), emit(event), on(command, handler), dispatch(); vebda no-op
  commands.ts   NativeToWebCommand → store amallari (useAtlas) va BrainScene; natija qaytaradi
  state.ts      sahna holati ⇄ JSON ⇄ `#s=` (veb) / `neuroatlas://open?s=` (native); versiyalangan
  export.ts     shaffof fonli PNG (2K/4K) — eksport tugmasi, native ulashish va AI uchun
```

### 1.2 Platformani aniqlash
User-Agent emas — native qobiq sahifa yuklanishidan oldin (`WKUserScript`, `atDocumentStart`) global qo'yadi:
```ts
export type PlatformType = 'web' | 'macos' | 'ipados' | 'android'
export interface NativeCapabilities {
  platform: PlatformType
  isNativeApp: boolean
  supportsHaptics: boolean
  supportsApplePencil: boolean
  supportsPencilPro: boolean // squeeze, barrel roll — faqat native orqali
  supportsAR: boolean
  supportsLocalAssets: boolean
  meshBase?: string // 'neuroatlas-local://meshes/' — AG-3 dagi VITE_MESH_BASE ni ish vaqtida almashtiradi
}
// Native: window.__NA_NATIVE__ = { platform: 'ipados', ... }. Yo'q bo'lsa → { platform: 'web', isNativeApp: false, ... }
```

### 1.3 Aloqa protokoli (spetsifikatsiyadan, loyiha nomlariga moslangan)
- Web → Native: `window.webkit?.messageHandlers?.neuroBridge?.postMessage({ type, payload })`
- Native → Web: `window.NeuroAtlasNative.dispatch({ command, data })` → **Promise qaytaradi** (Swift `callAsyncJavaScript`
  bilan natijani oladi — masalan PNG eksportda katta base64'ni hodisa bilan emas, javob sifatida olish uchun).

```ts
// Web → Native
export type WebToNativeEvent =
  | { type: 'APP_READY'; payload: { version: string; lang: 'uz' | 'en' } }
  | { type: 'HAPTIC_TICK'; payload: { style: 'light' | 'medium' | 'selection' } }
  | { type: 'STRUCTURE_HOVERED'; payload: { id: string; name: string; system: string } | null } // faqat o'zgarganda, ≤10/s
  | { type: 'STRUCTURE_SELECTED'; payload: { id: string; name: string; latin?: string; system: string; layer: string } }
  | { type: 'STATE_CHANGED'; payload: { state: SceneState; title: string } } // kamera "end" dan 250 ms keyin; Handoff + deep link
  | { type: 'REQUEST_CONTEXT_MENU'; payload: { structureId: string; x: number; y: number } } // faqat native'da preventDefault
  | { type: 'REQUEST_SPEAK_TERM'; payload: { text: string; lang: 'la' | 'en' | 'uz' } }
  | { type: 'REQUEST_AR_LAUNCH'; payload: { partIds: string[] } } // 2-bosqich, USDZ kerak (AG-7)
  | { type: 'INDEX_SPOTLIGHT_ITEMS'; payload: { items: { id: string; title: string; subtitle: string; keywords: string[] }[] } }
  | { type: 'STUDY_PROGRESS_UPDATED'; payload: { streak: number; completed: number } } // CL-4 viktorinasidan keyin

// Native → Web
export type NativeToWebCommand =
  | { command: 'SET_VIEW'; data: { view: 'three-quarter' | 'lateral' | 'front' | 'top' | 'back' | 'left' | 'right' | 'reset' } }
  | { command: 'CAMERA_GESTURE'; data: { kind: 'rotate' | 'zoom' | 'pan'; dx: number; dy: number; scale?: number } }
  | { command: 'SET_TAB'; data: { tab: 'atlas' | 'learn' } }
  | { command: 'SET_EXPLODE'; data: { value: number } } // 0..1 — "Tarqatish" (store.explode)
  | { command: 'SET_PEEL'; data: { value: number } } // 0..1 — "Chuqurlik" (store.peel)
  | { command: 'SET_SYSTEM'; data: { system: string; visible?: boolean } } // arteries, veins, cranial-nerves, ... (SYSTEMS)
  | { command: 'SET_LAYERS'; data: { layers: string[] } } // gross, julich, desikan, ... (LAYERS)
  | { command: 'FOCUS_STRUCTURE'; data: { query: string } } // id yoki nom (uz/en/la) — searchAtlas() bilan
  | { command: 'SET_CLIP'; data: { axis: 'sagittal' | 'coronal' | 'axial'; mm: number; enabled?: boolean } }
  | { command: 'OPEN_SECTION'; data: { id: string; cut?: boolean } }
  | { command: 'OPEN_SEARCH'; data: {} } // ⌘K
  | { command: 'RESTORE_STATE'; data: { s: string } } // deep link / Handoff / iCloud
  | { command: 'SET_THEME'; data: { theme: 'light' | 'dark' } }
  | { command: 'SET_LANG'; data: { lang: 'uz' | 'en' } }
  | { command: 'SET_POWER_PROFILE'; data: { lowPower: boolean; maxFps: 30 | 60 | 120 } }
  | { command: 'EXPORT_PNG'; data: { width: number; transparent: boolean } } // → Promise<{ dataUrl, title }>
  | { command: 'ASK_AI'; data: { text: string; image?: boolean } } // ovoz, Circle-to-Ask, Services → useAI.send()
  | { command: 'PENCIL_PRO'; data: { action: 'squeeze' | 'barrel'; angle?: number } } // 2-bosqich
```
**Spetsifikatsiyadan o'zgarishlar va sabablari:**
| Spetsifikatsiyada | Bu yerda | Nega |
|---|---|---|
| `TOGGLE_LAYER: arteries/veins/nerves/cortex` | `SET_SYSTEM` + `SET_LAYERS` | Loyihada arteriya, vena, nerv — **tizim** (`SYSTEMS`), Julich/Desikan — **qatlam** (`LAYERS`); ikkalasi alohida |
| `SET_MODE: atlas/learn` | `SET_TAB` | Store'da `Mode = explode \| peel \| learn`; tab = atlas (explode/peel) yoki learn |
| `SET_DEPTH` | `SET_PEEL` | Store nomi `peel` |
| `SET_CAMERA_PRESET` | `SET_VIEW` (+ back/left/right) | Mavjud `View` turi; orqa/chap/o'ng — yangi (CL-7 da qo'shiladi) |
| `REQUEST_EXPORT_PNG` (base64 hodisada) | `EXPORT_PNG` buyruq → Promise | 4K PNG ≈ 10–30 MB; native so'raydi va javobni oladi |
| `CAMERA_STATE_CHANGED` + `SYNC_USER_ACTIVITY` | bitta `STATE_CHANGED` | Holat bitta formatda (1.4), Handoff ham deep link ham undan foydalanadi |
| `SET_THEME: trueBlack` | olib tashlandi (keyin) | Hozir faqat `light/dark`; OLED qora — LG ishlari bilan |
| `SET_PRESENTER_MODE` | 2-bosqich (native oyna) | Ikkinchi ekran — native; vebda faqat "UI yashirish" kerak |
| `PENCIL_ACTION` (nuqtalar massivi) | olib tashlandi | Pencil bosimi, og'ishi va hover'i WebKit Pointer Events'da bor (`pressure`, `altitudeAngle`, `pointerType: 'pen'`) — vebda to'g'ridan-to'g'ri; native faqat squeeze/barrel |
| `VOICE_COMMAND` | `ASK_AI` | Matnga aylangan ovoz AI panelga (`useAI.send`) — u allaqachon ilovani boshqaradi (16 tool) |
| `SLICE_PLANE: custom angle` | `SET_CLIP` (+ 2-bosqichda erkin tekislik) | 3 o'q + plastinka tekisligi bor; erkin burchak — `clipPlanes[3]` orqali keyin |

### 1.4 Sahna holati (deep link, Handoff, iCloud — bitta format)
```ts
interface SceneState {
  v: 1
  tab: 'atlas' | 'learn'
  cam?: { pos: [number, number, number]; target: [number, number, number] }
  view?: View
  explode: number; peel: number
  layers: LayerId[]; systems: string[]; selected: string[]; isolate: boolean
  clip?: Partial<Record<ClipAxis, { mm: number; flip: boolean }>>
  section?: string; cut?: string; topic?: string; lesson?: { id: string; step: number }
  lang: 'uz' | 'en'
}
```
- Vebda: `https://<sayt>/#s=<base64url(JSON)>` — **hozir ham foydali**: "Havolani nusxalash" (kursdoshga aniq rakurs yuborish).
- Native'da: `neuroatlas://open?s=...` (Obsidian/Notion/Anki/Notes'dan ochiladi).
- `BrainScene` ga `getCamera()` / `setCamera()` kerak (hozir faqat `view` preset bor).

### 1.5 Vebga qoldiriladigan "tishlar" (hook nuqtalari)
| # | Qayerda | Nima |
|---|---|---|
| 1 | `BottomBar` slayderlari | belgilangan chiziqdan o'tganda `HAPTIC_TICK` (`selection`) |
| 2 | `SceneView` `onHover` / `onSelect` | `STRUCTURE_HOVERED` (o'zgarganda) / `STRUCTURE_SELECTED` |
| 3 | `commands.ts` | `SET_VIEW`, `CAMERA_GESTURE`, `FOCUS_STRUCTURE` va boshqalar → store / BrainScene |
| 4 | `state.ts` | holat ⇄ `#s=` / `neuroatlas://`; `STATE_CHANGED` |
| 5 | `export.ts` + `BrainScene.snapshot()` | shaffof fonli 2K/4K PNG (render target, `alpha`), vebda "Rasm saqlash" tugmasi |
| 6 | `loader.ts` (AG-3 dan keyin) | mesh manzili: `__NA_NATIVE__.meshBase` → `VITE_MESH_BASE` → `/meshes/` |
| 7 | `App.tsx` | klaviatura: `1–5` rakurslar, `R` tiklash, `E`/`D` slayderga fokus, `⌘K` qidiruv (vebda ham) |
| 8 | `contextmenu` | native'da `REQUEST_CONTEXT_MENU`, vebda o'zimizning menyu (Ajratish, Yashirish, AI tahlil, nomni nusxalash) |

---

## 2. Bosqichlar (spetsifikatsiya 4-qismi, moslangan)

| Bosqich | Qayerda | Qamrov | Tayyor mezoni |
|---|---|---|---|
| **0 — veb tishlari (CL-7)** | shu repo | `src/bridge/*`, holat havolasi `#s=` + "Havolani nusxalash", shaffof PNG eksport, orqa/chap/o'ng rakurs, hotkey'lar 1–5/R/⌘K, kontekst menyu, hook'lar (1.5) | vebda hammasi ishlaydi (native'siz); `__NA_NATIVE__` soxta obyekt bilan headless sinov: buyruqlar → store, hodisalar → `postMessage` jurnali; audit-pick 0 |
| **1 — Xcode MVP** | `neuro-atlas-apple` | SwiftUI multiplatform + `WKWebView`; `WKURLSchemeHandler` (dist + Draco meshlar ilova ichida, oflayn); shaffof titlebar; menyu (Ko'rinish/Tizimlar/Qatlamlar/Asboblar); hotkey'lar; haptik (Mac trackpad, iPad Taptic); Pencil hover/bosim (veb Pointer Events); eksport → ulashish oynasi; Split View drag-and-drop (PNG + ta'rif + manba) | iPad Air / M-seriyali Mac'da 60 FPS, xotira ≤1.2 GB; TestFlight |
| **2 — Pro va PhD** | ikkalasi | Spotlight (1740 tuzilma), `neuroatlas://` havolalari, AR "stol ustidagi miya" (USDZ — AG-7), ikkinchi ekran / taqdimot rejimi + lazer, iCloud (saqlangan rakurslar, viktorina natijalari), Circle-to-Ask (doira → tanlov → AI), Pencil Pro squeeze (radial menyu) va barrel roll (kesim burchagi), ovoz → `ASK_AI`, talaffuz (`AVSpeechSynthesizer`) | App Store'ga birinchi topshirish |
| **3 — ekotizim** | native | Handoff + Continuity Sketch, Menu Bar mini-ilova (kunlik karta), vidjetlar, Live Text skaner, Siri/AppIntents, ReplayKit dars yozish, Touch ID (shaxsiy qaydlar), SpaceMouse/geympad, Quick Look `.neuro`, macOS Services | — |

**Tartib sababi:** 0-bosqich vebga ham foyda beradi (havola ulashish, PNG, hotkey), Xcode'siz sinaladi va keyingi
bosqichlarni bloklamaydi. 1-bosqich AG-3 (Draco, mesh manzili) va CL-6 (tezlik) dan keyin — aks holda iPad xotirasi va
GPU yetmaydi.

---

## 3. To'liq imkoniyatlar ro'yxati (spetsifikatsiya 2–3-qismlari) — baholangan

Belgilar: **V** — vebda qilinadi (Pointer/Keyboard API), **N** — native kerak, **V+N** — veb mantiq + native kirish;
bosqich raqami; ⚠ — xavf yoki katta tadqiqot.

### macOS
| Imkoniyat | Tur | Bosq. | Izoh |
|---|---|---|---|
| Trackpad haptik (slayder chiziqlari, tomir ustida) | V+N | 1 | `NSHapticFeedbackManager`; hover tebranishi faqat tizim/tomir o'zgarganda (charchatmasin) |
| Pinch/rotate/pan trackpad | V | 1 | WebKit `gesturechange` + `wheel` (ctrlKey = pinch) — `CAMERA_GESTURE` shart emas |
| Shaffof titlebar, toolbar birlashuvi | N | 1 | `fullSizeContentView`; veb tab bar `--titlebar-inset` ga suriladi |
| Menu Bar (Ko'rinish, Tizimlar, Qatlamlar, Asboblar, Help qidiruv) | N | 1 | buyruqlar = 1.3 |
| Ko'p oyna, Stage Manager | N | 2 | har oyna o'z `WKWebView` + `RESTORE_STATE` |
| Suzuvchi PiP oyna | N | 2 | kichik oyna, UI yashirin |
| Ikkinchi ekran / taqdimot + lazer | N | 2 | vebda "toza ko'rinish" (UI yashirish) rejimi kerak |
| Hotkey'lar 1–5, R, E, D, ⌘K, Space+drag, Option+drag | V | 0 | `P` (qalam) — chizish asbobi yo'q, 2-bosqich |
| Spotlight | N | 2 | `INDEX_SPOTLIGHT_ITEMS` (nom uz/en/la, tizim) |
| Menu Bar mini-ilova (kunlik flashcard) | N | 3 | CL-4 viktorina banki (AG-5) dan |
| Keynote/Notes eksport (shaffof 4K PNG) | V+N | 0/1 | `EXPORT_PNG` |
| Kontekst menyu | V+N | 0/1 | 1.5 #8 |
| Deep link `neuroatlas://` | V+N | 0/2 | 1.4 |
| Drag-and-drop (rasm + ta'rif + manba) | N | 1 | ta'rif `content/*.json` dan |
| Quick Look `.neuro` | N | 3 | `.neuro` = `SceneState` JSON + kichik rasm |
| macOS Services "Neuro Atlas'da ko'rish" | N | 3 | → `FOCUS_STRUCTURE` |
| Ovozli boshqaruv, talaffuz | N | 2 | ovoz → `ASK_AI`; lotincha talaffuz sifati ⚠ (TTS'da lotin tili yo'q — italyancha ovoz bilan sinash) |
| Handoff, Continuity Sketch | N | 3 | `STATE_CHANGED` |
| Siri / AppIntents, Focus | N | 3 | "Talamusni ko'rsat" → `FOCUS_STRUCTURE` |
| iCloud | N | 2 | rakurslar, natijalar; AI kalitlari **iCloud Keychain**'da, `localStorage`da emas |
| SpaceMouse / geympad | N | 3 | `GameController` → `CAMERA_GESTURE` |
| Touch ID | N | 3 | faqat shaxsiy qaydlar uchun |
| Oflayn (`WKURLSchemeHandler`) | N | 1 | 0-qaror 5 |
| 120 Hz, tizim mavzusi | V+N | 1 | `SET_POWER_PROFILE`, `SET_THEME` |
| Quvvat tejash | V+N | 1 | `pixelRatio` cheklovi, sahna pauzasi (CL-6 dagi pauza bilan bir mexanizm) |

### iPadOS — Apple Pencil
| Imkoniyat | Tur | Bosq. | Izoh |
|---|---|---|---|
| 3D sirtga yopishuvchi chizmalar | V | 2 | pointer → raycast → sirt nuqtalari → `Line2` (sahna bilan aylanadi); PencilKit shart emas |
| Virtual skalpel (lasso kesish) | V | 2 ⚠ | haqiqiy CSG og'ir; v1: lasso ichidagi tuzilmalarni yashirish/shaffof qilish ("oyna ochish") |
| Bosimga sezgir qatlam tozalash | V | 2 | `pressure` → `peel` mahalliy (faqat tegilgan joyda) ⚠ shader ishi |
| Circle-to-Ask | V | 2 | doira → shu hududdagi tuzilmalar + `look_at_screen` surati → AI (CL-2 da tayyor tool) |
| Qon oqimi yo'lini chizish testi | V | 2 | `pathways.ts` va tomir meshlari; viktorina (CL-4) bilan |
| Pin izohlar 3D da | V | 2 | `SceneState` ga `pins[]` |
| Endoskopik chiroq (`altitudeAngle`) | V | 2 | WebKit'da `altitudeAngle`/`azimuthAngle` bor → `SpotLight` |
| Pencil Pro squeeze / barrel roll | N | 2 | `PENCIL_PRO` buyrug'i |
| Pencil hover (nomni ko'rsatish) | V | 1 | `pointerType === 'pen'` + hover — mavjud hover yorlig'i |
| Double-tap almashinuv | N | 2 | `UIPencilInteraction` → asbob almashinuvi |
| Scribble qidiruv | V | 1 | oddiy `<input>` bo'lsa iPadOS o'zi qiladi — tekshirish kifoya |

### iPadOS — Pencil'siz
| Imkoniyat | Tur | Bosq. | Izoh |
|---|---|---|---|
| AR "stol ustidagi miya" | N | 2 ⚠ | `RealityKit`, USDZ eksport (AG-7); 1740 mesh emas — tanlangan tizimlar, ≤150k uchburchak |
| Giroskop bilan aylantirish | V+N | 2 | `DeviceOrientationEvent` (ruxsat bilan) yoki `CoreMotion` |
| Bosh bilan parallaks (TrueDepth) | N | 3 ⚠ | foydasi kam, batareya — past ustuvor |
| Multi-touch: ikki barmoq kesim, uch barmoq undo | V | 1 | Pointer Events; undo uchun store tarixi kerak (yangi) |
| Taptic | N | 1 | `HAPTIC_TICK` |
| Tashqi monitor "pult" | N | 3 | ikkinchi ekran (macOS bilan umumiy) |
| Live Text / VisionKit skaner | N | 3 | atama → `FOCUS_STRUCTURE` |
| Split View, GoodNotes drag-and-drop | N | 1 | shaffof PNG |
| ReplayKit dars yozish | N | 3 | — |
| Magic Keyboard hotkey'lar | V | 0 | vebdagi hotkey'lar o'zi ishlaydi |
| Home Screen vidjetlari | N | 3 | AG-5 savollar banki |

---

## 4. Ishlash va xotira (iPad uchun hal qiluvchi)
- 1740 mesh, 199 MB → Draco (AG-3) + qatlamlarni kerak bo'lganda yuklash (hozir gross boshida, qolganlari yoqilganda).
- WKWebView veb-jarayoni iPad'da ≈1.5 GB dan keyin o'ldiriladi — 1-bosqich mezoni ≤1.2 GB.
- CL-6 (sahna pauzasi, `backdrop-filter` ni olib tashlash) va kesim yuzalari (caps.ts) iPad GPU'sida ham sinalsin.

## 5. Litsenziya va App Store xavflari (AG-6 tadqiqoti tasdiqlashi kerak)
| Xavf | Holat | Choralar |
|---|---|---|
| Tijoratsiz litsenziyalar: Julich (CC BY-NC-SA), BigBrain (CC BY-NC-SA), JHU (FSL, non-commercial), Glasser (HCP Open Access Data Use Terms), Desikan/Destrieux (FreeSurfer licence) | App Store'da **bepul** tarqatish NC bilan mos bo'lishi kerak — har birining matni tekshirilsin; HCP shartlari qayta tarqatishga ruxsat beradimi — alohida savol ⚠ | bepul ilova, reklama/IAP yo'q; ATTRIBUTION ilova ichida (About) |
| Guideline 4.2 (minimal funksionallik, "veb-o'rovchi") | WKWebView ilovalari rad etilishi mumkin | 1-bosqichda native menyu, oflayn, haptik, Pencil, drag-and-drop — haqiqiy native qiymat |
| 2.5.2 (yuklab olingan kod) | — | veb-kod ilova paketida (0-qaror 5) |
| 5.1.2 — ma'lumotni uchinchi tomon AI'ga yuborish | AI panel foydalanuvchi kaliti bilan Anthropic/OpenAI/Google/OpenRouter'ga yuboradi | birinchi ishlatishda aniq rozilik oynasi (nima, kimga yuboriladi); AI'siz ham to'liq ishlaydi |
| 1.4.1 tibbiy | ta'limiy | "Faqat ta'lim uchun, tibbiy maslahat emas" — About va AI panelda (bor) |
| Kirish (OpenRouter PKCE) | ilova hisobi emas, provayder ulanishi | `ASWebAuthenticationSession`; Sign in with Apple talab qilinmasligi tekshirilsin |
| Kalitlarni saqlash | vebda `localStorage` | native'da Keychain (`STORE_SECRET` / `GET_SECRET` — 1-bosqichda ko'prikka qo'shiladi) |

## 6. Swift skeleti (1-bosqich boshlanishi)
Spetsifikatsiyadagi `NeuroBridgeManager` asos sifatida olinadi, o'zgarishlar: `sendToWeb` → `callAsyncJavaScript` (natija
qaytadi); xabar turlari `types.ts` bilan bir xil (Swift `Codable` enum'lari TS'dan avtomatik hosil qilish — `quicktype`);
`WKUserScript` `__NA_NATIVE__` ni `atDocumentStart` da qo'yadi; har handler alohida fayl (`Haptics.swift`, `Spotlight.swift`, ...).
