# App Store muvofiqligi, ma'lumotlar litsenziyasi va iPad WKWebView WebGL chegaralari

> **Vazifa:** AG-6 (`AI.md` §5.4) · **Sana:** 2026-11-22 · **Tekshirilgan sana:** 2026-11-22  
> **Maqsad:** `docs/APPLE.md` bo'yicha yaratiladigan bepul macOS / iPadOS ilovasi (SwiftUI + `WKWebView`, oflayn `dist/` + Draco meshlar) uchun: (1) barcha 9 ta 3D qatlam va BigBrain kesimlarining App Store'da qayta tarqatish shartlari, (2) Apple App Review Guidelines 4.2, 2.5.2, 5.1.2 va 1.4.1 talablari, (3) iPadOS `WKWebView` da WebGL xotira chegaralari va xavflarni kamaytirish rejasi.
>
> *Eslatma: Ushbu hujjat texnik va litsenziya tadqiqoti bo'lib, rasmiy yuridik maslahat (legal advice) o'rnini bosmaydi.*

---

## Qisqa xulosa (qarorlar uchun)

1. **Ilova 100% bepul bo'lishi shart** (narx, obuna, IAP, reklama yo'q): `julich`, `jhu`, `suit` (qisman) va `BigBrain` notijorat (NC) litsenziyalarda. Pullik versiya faqat ushbu qatlamlarsiz chiqarilishi mumkin.
2. **Eng nozik litsenziya nuqtalari (3 ta):**
   - **JHU (`jhu`, FSL Licence):** FSL litsenziyasi bepul/notijorat tarqatishga ruxsat beradi, lekin qabul qiluvchiga FSL shartlari qo'yilishi va asl/o'zgartirilgan manba kodi qo'shilishi talab qilinadi. App Store binar paketi ichida `ATTRIBUTION.md` + to'liq FSL litsenziya matni + ochiq GitHub repo havolasi berilishi kerak; **eng xavfsiz yo'l** — `susumu@mri.jhu.edu` dan bepul App Store ta'limiy ilovasi uchun qisqa yozma rozilik olish yoki `jhu` ni ixtiyoriy yuklanadigan paket qilish.
   - **Glasser (`glasser`, WU-Minn HCP Open Access Data Use Terms):** Hosila ma'lumotni qayta tarqatishga **ruxsat bor**, lekin aynan shu Data Use Terms ostida va majburiy minnatdorchilik matni (NIH grant `1U54MH091657`, Van Essen & Ugurbil) ilovada ko'rinishi shart.
   - **Creative Commons ShareAlike + App Store FairPlay DRM (`gross` CC BY-SA 2.1 JP, `julich` va `BigBrain` CC BY-NC-SA 4.0):** CC 4.0 §2(a)(4) "Effective Technological Measures" (DRM) ni taqiqlaydi; Apple App Store esa barcha ilovalarga FairPlay DRM qo'yadi. Amaliy yechim: (a) ilova ichidagi barcha CC ma'lumotlarining DRM'siz asl/hosila nusxalari (Draco `.glb` va BigBrain `.webp`) GitHub Release'da ochiq turadi ("parallel distribution"), va (b) ilovaning About / Licenses ekranida Apple Standard EULA ustidan emas, har bir ma'lumot qatlami o'z CC litsenziyasi ostida ekani va DRM'siz manba havolasi ko'rsatiladi.
3. **App Review Guidelines (4.2, 2.5.2, 5.1.2, 1.4.1):**
   - **4.2 (Minimum Functionality):** Oddiy WebView wrapper rad etiladi — 1-bosqichda native menyu, haptik, oflayn paket, Split View drag-and-drop, Pencil/hotkey integratsiyasi bo'lishi shart.
   - **2.5.2 (Self-Contained Bundles):** Barcha JS/HTML/CSS va meshlar ilova ichida (`WKURLSchemeHandler`, `neuroatlas-local://`) bo'lishi to'g'ri qaror; hech qanday masofaviy JS yuklanmasligi kerak.
   - **5.1.2 (Third-Party AI):** Joriy matn uchinchi tomon AI provayderlariga (OpenRouter, Anthropic, OpenAI, Google) ma'lumot yuborishdan oldin **aniq oshkor qilish va foydalanuvchining ochiq roziligini (explicit permission)** majburiy qiladi — AI panelga birinchi kirishda alohida rozilik oynasi (consent sheet) qo'shilishi shart.
   - **1.4.1 (Medical):** Ilova diagnostika/davolash vositasi emas, balki ta'limiy atlas ekani aniq ko'rsatilishi, har qismdagi manba/metodologiya (bizda `sources` bor) va tibbiy qarorlar uchun shifokorga murojaat qilish haqida eslatma (disclaimer) bo'lishi shart.
4. **iPad `WKWebView` WebGL xotirasi:** `WKWebView` alohida `com.apple.WebKit.WebContent` va `com.apple.WebKit.GPU` jarayonlarida ishlaydi; host ilovaga beriladigan `com.apple.developer.kernel.increased-memory-limit` entitlement'i WebKit jarayonlari chegarasini oshirmaydi. 4–8 GB RAM'li iPadlarda WebContent/GPU jarayoni odatda ~500 MB–1.5 GB atrofida Jetsam tomonidan o'chirilishi mumkin (`webViewWebContentProcessDidTerminate(_:)`). Shu bois iPad'da qatlamlar bo'yicha lazy-load + geometriya/tekstura `dispose()`, `devicePixelRatio` cheklovi (≤ 2) va `webViewWebContentProcessDidTerminate` tiklanish mexanizmi majburiy.

---

## 1. Ma'lumot qatlamlari litsenziyalari (`LAYERS` + BigBrain)

Quyidagi jadval `src/data/index.ts` dagi barcha 9 ta 3D qatlam va `public/sections/real/` dagi BigBrain kesimlarini qamrab oladi. Barcha havolalar 2026-11-22 kuni ochib tekshirildi.

| Qatlam | Manba | Litsenziya | Bepul App Store ilovasida qayta tarqatish | Attribution / Majburiy shartlar | Xavf darajasi |
|---|---|---|---|---|---|
| `gross` | BodyParts3D 4.3 (DBCLS, Yaponiya) | **CC BY-SA 2.1 JP** | Ha (tijorat ham mumkin), ShareAlike + parallel DRM'siz manba bilan | DBCLS + Mitsuhashi et al. 2009 + o'zgarishlar (MNI affin + 68 ko'zgulangan tomir) + CC BY-SA 2.1 JP havolasi | Past–O'rta (SA + FairPlay) |
| `julich` | Julich-Brain v3.1 (FZ Jülich / EBRAINS) | **CC BY-NC-SA 4.0** | Ha, **faqat bepul/notijorat**; ShareAlike + parallel DRM'siz manba bilan | Amunts et al. 2020 + EBRAINS/FZ Jülich + o'zgarishlar + CC BY-NC-SA 4.0 havolasi | O'rta (NC + SA + FairPlay) |
| `brodmann` | Brodmann (1909) on Conte69, Scalable Brain Atlas (`B05_on_Conte69`), via `neuroparc` (Apache 2.0) | **Research & education** (SBA citation policy) | Ha (ta'limiy/notijorat); `neuroparc` Apache 2.0 ostida | Brodmann 1909 + Glasser & Van Essen 2011 (Conte69) + Bakker et al. 2015 (SBA) + Lawrence et al. 2021 (`neuroparc`) | Past |
| `desikan` | FreeSurfer `aparc+aseg` (Desikan et al. 2006), via `neuroparc` | **FreeSurfer Software License v1.0** | **Ha** (Part B: royalty-free distribution + derivative works) | Part B to'liq matni va majburiy prefiks ("All or portions of this licensed product... obtained under license from The General Hospital Corporation...") + klinik qo'llash taqiqi eslatmasi | Past (shart bajarilsa) |
| `destrieux` | FreeSurfer `aparc.a2009s` (Destrieux et al. 2010), via `neuroparc` | **FreeSurfer Software License v1.0** | **Ha** (Part B — `desikan` bilan bir xil) | `desikan` bilan bir xil + Destrieux et al. 2010 sitatasi | Past (shart bajarilsa) |
| `glasser` | Glasser et al. 2016 (HCP-MMP1.0), via `neuroparc` | **WU-Minn HCP Open Access Data Use Terms** | **Ha**, aynan shu Data Use Terms ostida qayta tarqatilganda | Majburiy NIH/WU-Minn minnatdorchilik matni (`1U54MH091657`) + Data Use Terms havolasi + Glasser et al. 2016 sitatasi | O'rta (shartni ilovada ko'rsatish shart) |
| `jhu` | JHU ICBM-DTI-81 (Mori et al. 2008), via `neuroparc` | **FSL Licence (non-commercial)** | Shartli (bepul, financial return yo'q, FSL shartlari + manba kodi bilan) | Mori et al. 2008, Hua et al. 2008 + to'liq FSL litsenziya matni + ochiq manba havolasi; tavsiya: `susumu@mri.jhu.edu` dan tasdiq olish | **Yuqori–O'rta** |
| `bstem` (Allen) | Allen Human Reference Atlas – 3D 2020 (Ding et al. 2016) | **CC BY 4.0** (2022-09-01 dan) | **Ha** (hatto tijorat uchun ham) | Ding et al. 2016 + Allen Institute Citation Policy + CC BY 4.0 havolasi | Juda past |
| `bstem` (AAN) | Harvard AAN Atlas v2.0 (Edlow & Kinney 2023) | **CC0 1.0** (Dryad `doi:10.5061/dryad.zw3r228d2`) | **Ha** (cheklovsiz, jamoat mulki) | Majburiy emas, lekin ilmiy odob sifatida Edlow et al. 2012 + Dryad DOI ko'rsatiladi | Yo'q |
| `suit` | SUIT cerebellar atlas (Diedrichsen et al. 2009/2011) | **CC BY** (repo README: "distributed under a Creative Commons CC BY (Attribution) license", versiya ko'rsatilmagan; "if not otherwise noted in the contributing paper" istisnosi bilan) / **CC BY-NC 3.0** (`ATTRIBUTION.md` da ehtiyotkorlik bilan NC) | **Ha** (bepul/notijoratda ikkala talqinda ham ruxsatli) | Diedrichsen et al. 2009 & 2011 + repo havolasi; eslatma: FSL ichidagi versiyasi CC BY-SA 4.0 ostida | Past |
| *Real slices* | BigBrain 100 µm MNI ICBM152 2009b sym (Amunts et al. 2013) | **CC BY-NC-SA 4.0** (`ftp.bigbrainproject.org/bigbrain-ftp/License.txt`) | Ha, **faqat bepul/notijorat**; ShareAlike + parallel DRM'siz manba bilan | Amunts et al. 2013 + o'zgarishlar (qiya kesim, kontrast, `.webp`) + CC BY-NC-SA 4.0 havolasi | O'rta (NC + SA + FairPlay) |

### 1.1 WU-Minn HCP Open Access Data Use Terms (rasmiy matndan iqtibos)

- **Manba:** https://www.humanconnectome.org/study/hcp-young-adult/document/wu-minn-hcp-consortium-open-access-data-use-terms (Release Date: Apr 26, 2013; tekshirildi: 2026-11-22)
- **Qayta tarqatish bandi:**
  > *"I may redistribute original WU-Minn HCP Open Access data and any derived data as long as the data are redistributed under these same Data Use Terms."*
- **Majburiy minnatdorchilik matni (verbatim):**
  > *"Papers, book chapters, books, posters, oral presentations, and all other printed and digital presentations of results derived from HCP data should contain the following wording in the acknowledgments section: 'Data were provided [in part] by the Human Connectome Project, WU-Minn Consortium (Principal Investigators: David Van Essen and Kamil Ugurbil; 1U54MH091657) funded by the 16 NIH Institutes and Centers that support the NIH Blueprint for Neuroscience Research; and by the McDonnell Center for Systems Neuroscience at Washington University.'"*
- **Bizga ta'siri:** Glasser HCP-MMP1.0 (`glasser`) 360 qismdan iborat guruh-o'rtacha (group-average) kortikal parcellation bo'lib, individual subyekt ma'lumotini o'z ichiga olmaydi. Qayta tarqatishga ruxsat bor, lekin: (1) ilovaning *About / Attribution* sahifasida yuqoridagi verbatim minnatdorchilik matni va HCP Data Use Terms havolasi turishi shart; (2) App Store tavsifida va litsenziyalar ekranida Glasser qatlami WU-Minn HCP Open Access Data Use Terms ostida tarqatilishi aniq ko'rsatilishi kerak.

### 1.2 FSL Licence — JHU ICBM-DTI-81 (rasmiy matndan iqtibos)

- **Manba:** https://fsl.fmrib.ox.ac.uk/fsl/docs/license.md (tekshirildi: 2026-11-22)
- **Notijorat va qayta tarqatish bandi:**
  > *"No part of the Software may be reproduced, modified, transmitted or transferred in any form or by any means, electronic or mechanical, without the express permission of the University. The permission of the University is not required if the said reproduction, modification, transmission or transference is done without financial return, the conditions of this Licence are imposed upon the receiver of the product, and all original and amended source code is included in any transmitted product."*
  > *"Use for which any financial return is received shall be defined as commercial use, and includes (1) integration of all or part of the source code or the Software into a product for sale or license by or on behalf of Licensee to third parties..."*
- **JHU atlasi haqida maxsus band (Standard Space Atlases bo'limi):**
  > *"The JHU, Juelich, Striatum and Thalamus atlases, whilst not being the property of Oxford, are released under the terms of the main FSL licence above, at the request of their owners. These atlases should therefore not be used for commercial purposes; for such purposes please contact the primary co-ordinator for the relevant atlas: JHU: susumu@mri.jhu.edu"*
- **Bizga ta'siri:**
  - Bepul ilovada moliyaviy daromad (`financial return`) yo'q, ammo FSL matni uchta shartni qo'yadi: (1) moliyaviy foyda olmaslik, (2) ushbu litsenziya shartlarini qabul qiluvchiga yetkazish, (3) barcha asl va o'zgartirilgan manba kodini qo'shish.
  - Bundan tashqari, App Store'da ilova Apple'ning standart EULA'si bilan tarqatiladi; shuning uchun **eng toza va xavfsiz qadam**: (a) ilova ichida to'liq FSL litsenziya matnini va ochiq GitHub repozitoriy (`QuarkSci/neuro-atlas`) havolasini berish, hamda (b) App Store'ga chiqarishdan oldin Prof. Susumu Mori (`susumu@mri.jhu.edu`) ga bepul ochiq ta'limiy ilovada JHU ICBM-DTI-81 3D meshlarini ko'rsatish bo'yicha qisqa yozma tasdiq so'rab murojaat qilish (yoki javob olinmasa, App Store versiyasida `jhu` ni olib tashlash / foydalanuvchi o'zi yuklab oladigan paketga o'tkazish imkonini saqlash).

### 1.3 FreeSurfer Software License Agreement v1.0 (`desikan`, `destrieux`)

- **Manba:** https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense (Version 1.0, February 2011; tekshirildi: 2026-11-22)
- **Part B iqtibosi:**
  > *"MGH hereby grants you, with right to sublicense... a royalty-free, non-exclusive license to use, reproduce, make derivative works of, display and distribute the Software, provided that: ... (b) in connection with any copy of or sublicense of all or any portion of the Software, all of the terms and conditions in this Software License shall appear in and shall apply to such copy and such sublicense... prefaced with the following words: 'All or portions of this licensed product (such portions are the "Software") have been obtained under license from The General Hospital Corporation and are subject to the following terms and conditions:'"*
  > *"YOU ACKNOWLEDGE AND AGREE THAT CLINICAL APPLICATIONS ARE NEITHER RECOMMENDED NOR ADVISED."*
- **Bizga ta'siri:** App Store'da bepul (hatto tijoriy) ilovada tarqatishga to'liq ruxsat bor, **faqat** ilovaning *Licenses / Attribution* bo'limida yuqoridagi majburiy prefiks va FreeSurfer Part B matni to'liq ko'rsatilishi kerak.

### 1.4 Creative Commons ShareAlike va App Store FairPlay DRM (ETM masalasi)

- **Manbalar:**
  - CC BY-NC-SA 4.0 Legal Code: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en (tekshirildi: 2026-11-22)
  - CC FAQ (DRM / Effective Technological Measures): https://creativecommons.org/faq/ (tekshirildi: 2026-11-22)
  - BigBrain License: https://ftp.bigbrainproject.org/bigbrain-ftp/License.txt (tekshirildi: 2026-11-22)
- **Iqtibos (CC BY-NC-SA 4.0 §2(a)(4)):**
  > *"No downstream restrictions. You may not offer or impose any additional or different terms or conditions on, or apply any Effective Technological Measures to, the Licensed Material if doing so restricts exercise of the Licensed Rights by any recipient of the Licensed Material."*
- **Iqtibos (CC FAQ):**
  > *"If someone is applying effective technological measures to your CC-licensed material that do restrict exercise of the licensed rights (such as applying DRM that restricts copying), this is a violation of the license terms unless you have chosen to grant this permission separately."*
- **Bizga ta'siri va yechim:** Apple App Store barcha ilovalarni FairPlay DRM bilan imzolaydi. Bu muammoni kamaytirish uchun ikki qatlamli yondashuv tavsiya etiladi:
  1. **Ochiq DRM'siz parallel tarqatish:** Barcha hosila `.glb` meshlar (GitHub Release `meshes-v1`) va BigBrain `.webp` kesimlari (`public/sections/real/`) DRM'siz, to'g'ridan-to'g'ri yuklab olinadigan shaklda ochiq repozitoriyda turadi; ilovaning *Licenses* ekranida foydalanuvchiga bu fayllarning ochiq DRM'siz manzili ko'rsatiladi.
  2. **Alohida ma'lumotlar yuklovi (ixtiyoriy zaxira reja):** Agar kelajakda huquqiy jihatdan mutlaqo DRM'siz ajratish talab qilinsa, CC-SA ma'lumotlari (Draco meshlar) ilova binariga emas, ilk ishga tushirishda GitHub Release'dan (oddiy HTTPS, DRM'siz) ilovaning Application Support papkasiga yuklab olinishi mumkin (bu holda App Review **4.2.3(ii)** bo'yicha hajmni oldindan ko'rsatib foydalanuvchidan tasdiq so'raladi).

---

## 2. Apple App Review Guidelines tahlili

- **Manba:** https://developer.apple.com/app-store/review/guidelines/ (tekshirildi: 2026-11-22)

### 2.1 Guideline 4.2 — Minimum Functionality (va 4.2.1, 4.2.3)

- **Joriy matndan iqtibos:**
  > *"4.2 Minimum Functionality: Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or 'app-like,' it doesn't belong on the App Store."*
  > *"4.2.1 Apps using ARKit should provide rich and integrated augmented reality experiences; merely dropping a model into an AR view or replaying animation is not enough."*
  > *"4.2.3 (i) Your app should work on its own without requiring installation of another app to function. (ii) If your app needs to download additional resources in order to function on initial launch, disclose the size of the download and prompt users before doing so."*
- **Bizga ta'siri va bajarish talablari:**
  - Oddiy `WKWebView` ichida saytni ochish **4.2 bo'yicha rad etilish xavfi yuqori**.
  - **1-bosqich (MVP) da majburiy native funksiyalar:** (a) to'liq oflayn ishlash (internet o'chiq paytda ham barcha 3D atlas, 22 kesim, 7 dars va 200 savolli viktorina ishlaydi), (b) macOS menyu satri va klaviatura yorliqlari, (c) iPad/Mac haptik (`UIImpactFeedbackGenerator` / `NSHapticFeedbackManager`), (d) Apple Pencil hover/bosim va Split View drag-and-drop eksporti, (e) native Share Sheet orqali 2K/4K PNG ulashish.
  - **2-bosqich AR (AG-7) uchun 4.2.1 ogohlantirishi:** Shunchaki Quick Look'da statik USDZ ko'rsatish emas, balki tizimlar bo'yicha alohida AR ko'rish, qismga tegib nomini ko'rish yoki masshtablash/kesish bilan boyitilgan tajriba kerak (aks holda App Store skrinshotlarida AR'ni asosiy funksiya sifatida emas, yordamchi eksport sifatida taqdim etish kerak).
  - **4.2.3(ii):** Agar Draco meshlar ilova paketida emas, birinchi ochilishda yuklansa — hajm (MB) aniq ko'rsatilib, foydalanuvchi tasdig'i bilan yuklanishi shart. Paket ichida saqlash (1-bosqich rejasi) bu talabni butunlay chetlab o'tadi.

### 2.2 Guideline 2.5.2 — Self-Contained Bundles & Executable Code

- **Joriy matndan iqtibos:**
  > *"2.5.2 Apps should be self-contained in their bundles, and may not read or write data outside the designated container area, nor may they download, install, or execute code which introduces or changes features or functionality of the app, including other apps."*
- **Bizga ta'siri:**
  - `docs/APPLE.md` dagi qaror — `dist/` va `public/draco/` (WebAssembly dekoderi bilan birga) ilova paketi ichida saqlanib, `WKURLSchemeHandler` (`neuroatlas-local://`) orqali yuklanishi — **2.5.2 ga 100% mos**.
  - **Diqqat (tuzoqlar):**
    1. Hech qanday CDN skripti (`<script src="https://...">`), masofaviy ESM moduli yoki dinamik `eval`/`Function` orqali internetdan yuklangan kod bo'lmasligi kerak. (`src/ai/providers/anthropic.ts` dagi dinamik import build paytida Vite bundle ichiga kiritiladi — shuni tekshirib turish kerak.)
    2. Draco WASM dekoderi (`public/draco/*`) mahalliy paketdan yuklanishi shart (AG-3 da allaqachon CDN'siz qilingan).
    3. AI panel tashqi API'ga faqat JSON/SSE ma'lumot so'rovi yuboradi, bajariladigan kod yuklamaydi — bu 2.5.2 ga zid emas.

### 2.3 Guideline 5.1.2 — Privacy: Data Use and Sharing (Uchinchi tomon AI!)

- **Joriy matndan iqtibos:**
  > *"5.1.2 Data Use and Sharing (i) Unless otherwise permitted by law, you may not use, transmit, or share someone's personal data without first obtaining their permission. You must provide access to information about how and where the data will be used. You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so."*
- **Bizga ta'siri (JUDA MUHIM — 2025/2026 yangilangan talab!):**
  - Neuro Atlas AI paneli foydalanuvchi yozgan savollar, yuklangan rasmlar (masalan, MRT kesim yoki darslik rasmi) va joriy ekran kontekstini uchinchi tomon AI provayderlariga (**OpenRouter, Anthropic, OpenAI, Google Gemini**) yuboradi.
  - **App Review'dan o'tish uchun majburiy choralar:**
    1. **Birinchi marta AI so'rov yuborishdan oldin aniq rozilik oynasi (Explicit Consent Dialog):** Qaysi ma'lumotlar yuborilishi (matnli savol, ixtiyoriy biriktirilgan rasm, joriy 3D/plastinka konteksti), qaysi uchinchi tomon provayderga yuborilishi (foydalanuvchi tanlagan OpenRouter / Anthropic / OpenAI / Google) va ularning maxfiylik siyosati havolasi ko'rsatilib, **"Roziman / I Agree"** tugmasi bosilmaguncha hech qanday so'rov ketmasligi kerak.
    2. **Shaxsiy/bemor ma'lumotlari ogohlantirishi:** Rasm yuklash va chat maydonida "Bemorning shaxsiy ma'lumotlarini (ISM, ID, tug'ilgan sana) yubormang" degan ogohlantirish bo'lishi kerak.
    3. **App Privacy Nutrition Labels (App Store Connect):** "Data Not Collected" deyish mumkin (chunki ishlab chiquvchi serveri yo'q, ma'lumot to'g'ridan-to'g'ri foydalanuvchi tanlagan AI provayderga ketadi), ammo Privacy Policy sahifasida uchinchi tomon AI provayderlariga yuborilish tartibi va BYOK / OpenRouter PKCE kaliti faqat qurilmada (`Keychain` / `localStorage`) saqlanishi aniq yozilishi shart.
    4. **AI panelni majburiy qilmaslik:** Ilova to'liq AI'siz (va hisobga kirmasdan) ishlashi shart — bizda shunday!

### 2.4 Guideline 1.4.1 — Safety: Medical Apps

- **Joriy matndan iqtibos:**
  > *"1.4.1 Medical apps that could provide inaccurate data or information, or that could be used for diagnosing or treating patients may be reviewed with greater scrutiny. Apps must clearly disclose data and methodology to support accuracy claims relating to health measurements, and if the level of accuracy or methodology cannot be validated, we will reject your app... Apps should remind users to check with a doctor in addition to using the app and before making medical decisions. If your medical app has received regulatory clearance, please submit a link to that documentation with your app."*
- **Bizga ta'siri va bajarish talablari:**
  - Neuro Atlas'da **"Shikastlanish simulyatori" (Lesion Simulator)** va **McDonald 2017/2024** (tarqoq skleroz) paneli bor — App Review tekshiruvchisi buni "diagnostika ilovasi" deb gumon qilishi mumkin!
  - **Majburiy himoya choralari:**
    1. **Aniq ta'limiy pozitsiya:** App Store tavsifi, kategoriyasi (`Education` asosiy, `Medical` ikkinchi darajali) va skrinshotlarda "Educational 3D Neuroanatomy Atlas" sifatida ko'rsatish; hech qayerda "diagnose patients" yoki "clinical decision support" da'vosini qilmaslik.
    2. **Ilova ichidagi tibbiy ogohlantirish (Disclaimer):** Birinchi ochilishda yoki About ekranida hamda Shikastlanish simulyatori / McDonald panelida ko'rinadigan qisqa eslatma: *"Faqat ta'lim va ilmiy o'rganish uchun. Klinik tashxis yoki davolash uchun mo'ljallanmagan; tibbiy qaror qabul qilishdan oldin shifokor bilan maslahatlashing."* (EN: *"For educational reference only. Not intended for clinical diagnosis or treatment; always consult a qualified physician before making medical decisions."*)
    3. **Metodologiya va manbalar shaffofligi:** Bizda har bir tuzilmada DOI/StatPearls `sources` va `ATTRIBUTION.md` mavjud — bu 1.4.1 dagi *"clearly disclose data and methodology"* talabi uchun kuchli ustunlik. App Review Notes'da ham buni alohida tushuntirib yozish kerak.

---

## 3. iPadOS `WKWebView` da WebGL xotira chegaralari

### 3.1 WebKit ko'p-jarayonli arxitekturasi va Jetsam

- **Rasmiy manbalar (tekshirildi: 2026-11-22):**
  - Apple Developer — `WKWebView`: https://developer.apple.com/documentation/webkit/wkwebview
  - Apple Developer — `WKURLSchemeHandler`: https://developer.apple.com/documentation/webkit/wkurlschemehandler
  - Apple Developer — `webViewWebContentProcessDidTerminate(_:)`: https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:)
  - Apple Developer — `com.apple.developer.kernel.increased-memory-limit`: https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.kernel.increased-memory-limit
  - Apple Developer — `com.apple.developer.kernel.extended-virtual-addressing`: https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.kernel.extended-virtual-addressing
  - Apple Developer — Identifying High Memory Use with Jetsam Event Reports: https://developer.apple.com/documentation/xcode/identifying-high-memory-use-with-jetsam-event-reports
  - WebKit Blog — New WebKit Features in Safari 15 (WebGL 2.0 / GPU Process): https://webkit.org/blog/11989/new-webkit-features-in-safari-15/

**Asosiy texnik faktlar:**

1. **Alohida jarayonlar:** `WKWebView` sahifani asosiy SwiftUI ilova jarayoni ichida emas, balki alohida **`com.apple.WebKit.WebContent`** (JS/DOM/WASM) va **`com.apple.WebKit.GPU`** (WebGL/Metal/Canvas) jarayonlarida ishlatadi.
2. **Jetsam chegaralari:** Apple WebKit jarayonlari uchun qattiq raqamli limitni hujjatlashtirmaydi — chegara qurilmaning jismoniy RAM hajmi, iPadOS versiyasi va tizim yuklamasiga qarab dinamik belgilanadi. **Quyidagi raqamlar TAXMIN** (hamjamiyat kuzatuvlari; Apple yoki WebKit rasmiy manbasi yo'q — Claude tekshiruvi 2026-11-23). Haqiqiy chegara A1 bosqichida Xcode Instruments bilan o'lchanadi:
   - **3–4 GB RAM'li iPadlar** (masalan, iPad 9/10-avlod, eski iPad Air): `WebContent` / `GPU` jarayoni **~350 MB – 700 MB** oralig'ida Jetsam (`per-process-limit`) tomonidan o'chirilishi mumkin.
   - **8–16 GB RAM'li iPadlar** (iPad Air M1/M2, iPad Pro M1/M2/M4): chegara kengroq (**~1.2 GB – 2.0 GB** atrofida), lekin qurilmaning barcha 8/16 GB xotirasidan foydalanib bo'lmaydi.
3. **`increased-memory-limit` entitlement'i `WKWebView` ga yordam bermaydi:** `com.apple.developer.kernel.increased-memory-limit` (iPadOS 15+) faqat asosiy native binar jarayonining xotira chegarasini oshiradi — u `com.apple.WebKit.WebContent` va `com.apple.WebKit.GPU` yordamchi jarayonlariga avtomatik tatbiq etilmaydi. Shu sababli xotira muammosi **faqat veb/Three.js tomonida** hal qilinishi kerak.
4. **Sokin qulash (White Screen):** Jetsam `WebContent` jarayonini o'chirganda JavaScript `try/catch` ishlamaydi, asosiy Swift ilova ham o'chmaydi (`didReceiveMemoryWarning` ham chaqirilmasligi mumkin) — faqat WebView oq ekranga aylanadi va `WKNavigationDelegate.webViewWebContentProcessDidTerminate(_:)` chaqiriladi.

### 3.2 Neuro Atlas uchun xotira byudjeti va optimizatsiya tavsiyalari

Neuro Atlas'da 9 qatlamda 1 740 ta 3D qism bor (Draco siqilgandan keyin diskda ancha kichik bo'lsa-da, GPU/RAM'da dekompressiya qilingach `Float32Array` vertex/normal/index buferlari + BVH raycast daraxti anchagina xotira egallaydi).

| Qatlam / Resurs | Xotira xavfi | Tavsiya etiladigan chora (iPadOS MVP va PhD rejimi uchun) |
|---|---|---|
| Bir nechta og'ir parcellation qatlami (masalan, `gross` + `julich` 414 + `glasser` 360 bir vaqtda) | GPU vertex buferlari + JS geometriya + BVH daraxtlari tez 600+ MB ga yetadi | **Lazy-load va qatlam bo'yicha `dispose()`:** O'chirilgan parcellation qatlamlari geometriyasi/BVH'sini LRU kesh (masalan, oxirgi 2 ta qatlam) bilan saqlash, qolganlarini `geometry.dispose()` qilish |
| Retina `devicePixelRatio` + MSAA | 12.9" iPad Pro (2732×2048) da 2× DPR + 4K eksport render target = katta framebuffer VRAM | Odatiy ko'rishda `Math.min(window.devicePixelRatio, 2)`; `lowPower` rejimida `1.5`; 4K PNG eksportdan so'ng `WebGLRenderTarget.dispose()` darhol chaqirilishi shart |
| BigBrain `.webp` kesimlar + `AtlasSliceView` | Bir nechta kesim almashganda dekodlangan bitmaplar keshda qolib ketishi | Faqat aktiv plastinka rasmini saqlash, yopilganda `img.src = ''` bilan bo'shatish |
| Jetsam qulashidan tiklanish | `WebContent` o'lsa foydalanuvchi joriy rakurs va darsini yo'qotadi | Swift'da `webViewWebContentProcessDidTerminate(_:)` ni ushlab, oxirgi `STATE_CHANGED` (`SceneState`) holati bilan WebView'ni qayta yuklash (`neuroatlas://open?s=...`); cheksiz reload siklini oldini olish uchun 10 soniyada max 2 qayta yuklash cheklovi + "Past xotira rejimi" taklifi |
| **PhD / neyroxirurg darajasi** | Bir vaqtda bir nechta parcellation + kesim tekisliklari + 4K eksport talabi | `SET_POWER_PROFILE` (`docs/APPLE.md` §1.3) orqali iPad RAM'ini `ProcessInfo.processInfo.physicalMemory` bilan aniqlab, ≤4 GB qurilmalarda bir vaqtda maksimal 1 ta parcellation qatlami + 2K eksport cheklovi, ≥8 GB M-seriyali iPad'larda to'liq ko'p-qatlamli va 4K eksport rejimini ochish |

---

## 4. App Store'ga topshirish oldidan tekshiruv ro'yxati (Checklist)

- [ ] **Bepul model:** App Store narxi `$0`, IAP/obuna/reklama yo'q.
- [ ] **Litsenziya ekrani (ilova ichida):** Barcha 10 ta manba (`ATTRIBUTION.md`), FreeSurfer Part B majburiy prefiksi va to'liq matni, WU-Minn HCP majburiy minnatdorchilik matni (`1U54MH091657`) va Data Use Terms havolasi, FSL litsenziya matni + GitHub repo havolasi, CC litsenziya havolalari + DRM'siz GitHub Release havolasi.
- [ ] **JHU tasdig'i:** `susumu@mri.jhu.edu` ga yozma so'rov (yoki JHU'ni App Store binaridan ajratish qarori).
- [ ] **Guideline 5.1.2 (AI roziligi):** Birinchi AI so'rovdan oldin uchinchi tomon provayderiga qanday ma'lumot ketishini ochiq tushuntiruvchi va foydalanuvchi roziligini oluvchi modal oyna + "Bemor shaxsiy ma'lumotlarini kiritmang" ogohlantirishi.
- [ ] **Guideline 1.4.1 (Tibbiy ogohlantirish):** Ilova ichida va Shikastlanish simulyatori / McDonald panelida ta'limiy maqsad va shifokorga murojaat qilish haqida aniq disclaimer; App Review Notes'da ilmiy manbalar (`sources`) metodologiyasini tushuntirish.
- [ ] **Guideline 4.2 & 2.5.2:** To'liq oflayn paket (`WKURLSchemeHandler`, CDN'siz Draco WASM), native menyu/haptik/Pencil/Share Sheet; masofaviy JS yo'q.
- [ ] **iPad xotira barqarorligi:** `webViewWebContentProcessDidTerminate(_:)` qayta tiklanish + `SceneState` saqlash, qatlam `dispose()`, 4K eksportdan keyin render target tozalash; 4 GB va 8 GB iPad'da Xcode Instruments (`com.apple.WebKit.WebContent` va `com.apple.WebKit.GPU`) bilan profil olish.
