# AG-6 — Tadqiqot: App Store muvofiqligi, litsenziyalar va iPad WKWebView WebGL chegaralari

Branch: `ag/AG-6` · Sana: `2026-11-22`

## Nima qilindi
`docs/research/app-store.md` tadqiqot hujjati tayyorlandi (faqat hujjat, kodga tegilmadi):

1. **Barcha 10 ta ma'lumot manbasi (9 ta 3D qatlam `LAYERS` + BigBrain 100 µm) litsenziya auditi:**
   - App Store'da bepul ilova ichida qayta tarqatish ruxsati, attribution talablari va xavf darajasi jadval ko'rinishida jamlandi.
   - **WU-Minn HCP Open Access Data Use Terms** (`glasser`) va **FSL Licence** (`jhu`) rasmiy sahifalaridan to'g'ridan-to'g'ri iqtiboslar olindi; **FreeSurfer v1.0 Part B** majburiy prefiksi ham qo'shildi.
   - **Creative Commons ShareAlike (`CC BY-SA 2.1 JP`, `CC BY-NC-SA 4.0`) + Apple App Store FairPlay DRM ("Effective Technological Measures")** ziddiyati CC 4.0 §2(a)(4) va CC FAQ asosida tahlil qilinib, DRM'siz parallel tarqatish (GitHub Release) va ixtiyoriy zaxira yuklash yechimi berildi.
2. **Apple App Review Guidelines (4.2, 2.5.2, 5.1.2, 1.4.1):**
   - `developer.apple.com/app-store/review/guidelines/` joriy matnidan har to'rt band bo'yicha verbatim iqtiboslar olindi va Neuro Atlas uchun aniq bajariladigan choralar (native funksiyalar, oflayn `WKURLSchemeHandler`, uchinchi tomon AI uchun ochiq rozilik oynasi, Shikastlanish simulyatori va McDonald paneli uchun tibbiy ogohlantirish) belgilandi.
3. **iPadOS `WKWebView` WebGL xotira chegaralari:**
   - `com.apple.WebKit.WebContent` / `com.apple.WebKit.GPU` alohida jarayonlari, Jetsam (`per-process-limit`), `increased-memory-limit` entitlement'ining WebKit jarayonlariga tatbiq etilmasligi va `webViewWebContentProcessDidTerminate(_:)` orqali `SceneState` bilan qayta tiklanish strategiyasi yozildi.
   - 4 GB va 8+ GB iPadlar (shu jumladan PhD / ko'p-qatlamli va 4K eksport rejimi) uchun xotira byudjeti va optimizatsiya jadvali keltirildi.

## O'zgargan fayllar (hammasi vazifa ro'yxatida)
- `docs/research/app-store.md` (yangi)
- `docs/handoff/AG-6.md` (yangi)

## Tekshiruv
- Hujjatdagi barcha 13 ta tashqi URL 2026-11-22 kuni HTTP 200 bilan ochib tekshirildi (quyida ro'yxat):
  - `https://developer.apple.com/app-store/review/guidelines/` (200)
  - `https://www.humanconnectome.org/study/hcp-young-adult/document/wu-minn-hcp-consortium-open-access-data-use-terms` (200)
  - `https://fsl.fmrib.ox.ac.uk/fsl/docs/license.md` (200)
  - `https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense` (200)
  - `https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en` (200)
  - `https://creativecommons.org/faq/` (200)
  - `https://ftp.bigbrainproject.org/bigbrain-ftp/License.txt` (200)
  - `https://developer.apple.com/documentation/webkit/wkwebview` (200)
  - `https://developer.apple.com/documentation/webkit/wkurlschemehandler` (200)
  - `https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:)` (200)
  - `https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.kernel.increased-memory-limit` (200)
  - `https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.kernel.extended-virtual-addressing` (200)
  - `https://developer.apple.com/documentation/xcode/identifying-high-memory-use-with-jetsam-event-reports` (200)
  - `https://webkit.org/blog/11989/new-webkit-features-in-safari-15/` (200)
- Qo'shimcha tekshirilgan manbalar: `DiedrichsenLab/cerebellar_atlases` README (200), Dryad AAN `doi:10.5061/dryad.zw3r228d2` API (200, CC0-1.0), `neurodata/neuroparc/LICENSE.md` (200, Apache 2.0), `scalablebrainatlas.incf.org/human/B05_on_Conte69` (200), `alleninstitute.org/legal/terms-of-use` (200).
- `npx tsc -p tsconfig.app.json --noEmit && npm run build && rm -rf dist` — ✅ (kod o'zgarmagan, baribir commit oldidan tekshirildi).

## Ochiq savollar / qolgan ishlar
- App Store'ga topshirishdan oldin JHU ICBM-DTI-81 (`jhu`) bo'yicha Prof. Susumu Mori (`susumu@mri.jhu.edu`) dan qisqa yozma rozilik olish yoki App Store binarida `jhu` ni ixtiyoriy yuklanadigan paketga ajratish bo'yicha foydalanuvchi qarori kerak.
- CL-7 / 1-bosqich (Apple ilovasi) boshlanishida `AI` panelga Guideline 5.1.2 bo'yicha bir martalik ochiq rozilik (consent) oynasi va Shikastlanish simulyatoriga Guideline 1.4.1 bo'yicha tibbiy ogohlantirish qo'shish rejalashtirilishi lozim.

## Ko'rib chiqish (Claude to'ldiradi)

## Ko'rib chiqish (Claude, 2026-11-23)
✅ Birlashtirildi (`09ded73`). Asl manbalardan tekshirildi: Apple Guidelines 4.2, 2.5.2, 1.4.1, 5.1.2(i) so'zma-so'z; FSL
litsenziyasi (notijorat qayta tarqatish sharti; JHU — `susumu@mri.jhu.edu`; iqtibos "for such purposes please contact the
primary co-ordinator" bilan davom etadi); HCP Open Access Data Use Terms (4-band qayta tarqatish, 5.1 minnatdorchilik); CC DRM/ETM.
Claude tuzatgan: (1) iPad Jetsam raqamlari manbasiz edi → "TAXMIN" deb belgilandi; (2) SUIT: repo README "CC BY" deydi, versiyasiz
va "contributing paper" istisnosi bilan; FSL ichidagi Cerebellum atlasi CC BY-SA 4.0 — biz qaysi nusxani ishlatganimiz
`ATTRIBUTION.md` da aniqlashtirilishi kerak (hozircha NC ehtiyotkorligi saqlanadi).

