# AG-4 — Tadqiqot: U1 gistologiya manbalari va BigBrain 20 mkm plitkalar

Branch: `ag/AG-4` (asos: `origin/master`) · Sana: 2026-11-24

## Nima qilindi

- `docs/research/u1-histology.md` yozildi:
  - Piramidalar kesishmasi (`U1`) uchun ochiq litsenziyali (CC BY-ND'siz) 4 ta manba tahlil qilindi: **Agostinelli et al. (2023)** (*J Neurosci*, `PMC9838717`, CC BY 4.0 / CC BY-NC-SA 4.0 — **asosiy tavsiya**, MRI juftlangan), **NextBrain** (`Puonti et al. 2025`, CC BY 4.0, MNI152 hosilasi bor), **Allen Human Brain Atlas** (maxsus notijorat ToU) va **Public Domain** Weigert/mielin plastinkalari (Wikimedia Commons — tezkor zaxira).
  - MNI ga moslash imkoni, kesim burchagi va litsenziya xavflari ko'rsatildi.
- `docs/research/bigbrain-20um.md` yozildi:
  - Jonli EBRAINS Neuroglancer Precomputed endpoint'i tekshirildi (`https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/8bit/info` — HTTP `200`, `CORS: *`, 7 daraja `1280um → 20um`, `6572×7404×5711`, `64³` `uint8` chunk).
  - Bitta jonli 20 µm chunk yuklab o'lchandi (`20 149 bayt`, `gzip`, `CORS: *`).
  - Litsenziya (`CC BY-NC-SA 4.0`, `Amunts et al. 2013`), 2 ta brauzer arxitekturasi (Variant A: to'g'ridan-to'g'ri EBRAINS `64³` chunk oqimi vs Variant B: 21 plastinka uchun 2D WebP piramidasi + GitHub Release, ~60–150 MB) hamda tavsiya va xavflar yozildi.

## O'zgargan fayllar (AI.md 5.4 ro'yxatida)

- `docs/research/u1-histology.md` (yangi)
- `docs/research/bigbrain-20um.md` (yangi)
- `docs/handoff/AG-4.md` (ushbu handoff)

## Tekshiruv

- Kod o'zgartirilmadi (faqat hujjat).
- **Havolalar va DOI tekshiruvi (2026-11-24):**
  - `https://bigbrainproject.org/`, `https://bigbrainproject.org/maps-and-models.html`, `https://alleninstitute.org/legal/terms-of-use`, `https://pmc.ncbi.nlm.nih.gov/articles/PMC9838717/` — HTTP `200` ✅
  - `https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/8bit/info` va 20 µm chunk — HTTP `200`, `CORS: *`, `gzip` (`20 149 bayt`) ✅
  - Crossref API: `Agostinelli 2023` (`10.1523/jneurosci.0587-22.2022`), `Amunts 2013` (`10.1126/science.1235381`), `Puonti 2025` (`10.1101/2025.09.22.673638`) ✅

## Ochiq savollar / qolgan ishlar

- 21 plastinka uchun 20 µm WebP piramidasini yaratish (Variant B) va `U1` kesimini `Agostinelli 2023` dan ajratish keyingi alohida pipeline vazifasi sifatida rejalashtirilishi mumkin.

## Ko'rib chiqish (Claude to'ldiradi)
