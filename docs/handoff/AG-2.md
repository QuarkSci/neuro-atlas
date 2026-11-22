# AG-2 — Yorug' rejim: dars kartasi va kesim ko'ruvchisi

Branch: ag/AG-2 · Commitlar: 0cabdd9 (va shu handoff commiti) · Sana: 2026-11-22

## Oddiy tilda

1. **Nima o'zgardi?** Ilovadagi 3D dars oynasi va miya kesimlari oynasining doim qora rangda qolib ketadigan majburiy qulfi olib tashlandi. Ularning foni va yozuv ranglari tanlangan rejimga (kunduzgi yorug' yoki tungi qorong'i ko'rinishga) avtomatik moslashadigan qilindi.
2. **Nima yaxshilandi?** Yorug' rejim yoqilganda bu ikki oyna endi ekran o'rtasida qop-qora dog' bo'lib turmaydi, balki qolgan oynalar kabi tiniq oqish shisha ko'rinishiga o'tadi va ichidagi barcha matnlar oson o'qiladi. Qorong'i rejim esa o'zining avvalgi ko'rinishini to'liq saqlab qoldi.
3. **Nima hali tayyor emas yoki tekshirilmagan?** Kesim oynasi ichidagi miya chizmasi o'zining anatomik bo'yoqlari aniq ko'rinishi uchun kelishilganidek to'q fonda qoldirildi. Ushbu o'zgarishlar hozircha alohida ishchi tarmoqda turibdi va tekshiruvchi agent tasdiqlab asosiy saytga qo'shganidan keyin barcha foydalanuvchilarga ko'rinadi.

## Nima qilindi

- **`.dark` majburlashni olib tashlash:** `src/ui/LessonPanel.tsx` (`.lesson-panel`) va `src/ui/SectionViewer.tsx` (`.section-viewer`) konteynerlaridan majburiy `dark` sinfi olib tashlandi.
- **Tokenlarga o'tkazish (`src/index.css` — faqat 48 qator qo'lda o'zgartirildi, prettier ishlatilmadi):**
  - `.lesson-panel.glass` va `.sv-card.glass` fonlari `--background` tokenidan `color-mix(in oklab, var(--background) ...)` orqali hosil qilindi (xuddi `.inspector.glass` va `.ai-panel.glass` kabi).
  - `.lesson-*` blokida matn (`.lesson-text`), eslatma (`.lesson-memo`), chuqur ma'lumot (`.lesson-deep`), viktorina (`.quiz-verdict`) va manba havolalari (`.lesson-sources a`) `var(--ink)` asosidagi `color-mix` tokenlariga o'tkazildi.
  - `.section-viewer`, `.sv-*`, `.lz-*`, `.mc-*`, `.as-*` bloklarida qattiq oq/qora ranglar (`#fff`, `#000`, `#121822`, `#131a24`) `var(--ink)`, `var(--foreground)`, `var(--background)`, `var(--fa-fill)` va `var(--fa-line)` tokenlariga almashtirildi.
  - Plastinka figurasi (SVG sxema silueti `.sv-outline`, `.as-field` va `.sv-locator`) qorong'i fonda qoldirilib, tashqi o'q yorliqlari (`.as-axis`, `.sv-leader .sv-label`) va zoom boshqaruv tugmalari (`.sv-zoom-ctl`) har ikkala rejimda aniq ko'rinadigan qilindi.

## O'zgargan fayllar (hammasi vazifa ro'yxatida bo'lishi shart)

- `src/index.css` (faqat `.lesson-*`, `.section-viewer`, `.sv-*`, `.lz-*`, `.mc-*`, `.as-*` bloklaridagi 48 qator)
- `src/ui/LessonPanel.tsx` (faqat `.dark` sinfi olib tashlandi)
- `src/ui/SectionViewer.tsx` (faqat `.dark` sinfi olib tashlandi)
- `docs/handoff/AG-2.md` (yangi)
- `docs/handoff/AG-2/lesson-light.png` (yangi)
- `docs/handoff/AG-2/lesson-dark.png` (yangi)
- `docs/handoff/AG-2/section-light.png` (yangi)
- `docs/handoff/AG-2/section-dark.png` (yangi)

## Tekshiruv

- `tsc` ✅ (`npx tsc -p tsconfig.app.json --noEmit` — xatolar: 0)
- `build` ✅ (`npm run build && rm -rf dist` — muvaffaqiyatli)
- `audit-lesions`: `territories: 86, mismatches: 0` ✅
- **Screenshotlar (`docs/handoff/AG-2/*.png`, 900×560):**
  - `docs/handoff/AG-2/lesson-light.png` — `ventricles` darsi ochiq, `--theme light`: dars kartasi yorug' shisha uslubida, matn va "Eslab qoling" bloki yuqori kontrastli.
  - `docs/handoff/AG-2/lesson-dark.png` — `ventricles` darsi ochiq, `--theme dark`: qorong'i rejim avvalgidek saqlangan.
  - `docs/handoff/AG-2/section-light.png` — `pons-isthmus` (K3) plastinkasi ochiq, `--theme light`: kesim ko'ruvchisi paneli yorug', SVG figura o'z qorong'i fonida, barcha tugmalar va ro'yxatlar aniq o'qiladi.
  - `docs/handoff/AG-2/section-dark.png` — `pons-isthmus` (K3) plastinkasi ochiq, `--theme dark`: qorong'i rejim avvalgidek saqlangan.
- **Manbalar:** bu vazifada yangi ilmiy manba/DOI qo'shilmadi (faqat UI/CSS mavzu tokenlari).

## Ochiq savollar / qolgan ishlar

- Yo'q. `LesionPanel.tsx`, `McDonaldPanel.tsx` va `AtlasSliceView.tsx` dagi barcha ranglar `src/index.css` dagi `.lz-*`, `.mc-*`, `.as-*` sinflari orqali boshqarilgani sababli JSX mantiqiga teginmasdan CSS tokenlar orqali to'liq hal bo'ldi.

## Ko'rib chiqish (Claude to'ldiradi)
