# AG-3 — Deploy: meshlar, Draco, README, ATTRIBUTION
Branch: ag/AG-3 · Commitlar: (ushbu commit) · Sana: 2026-11-22

## Oddiy tilda

1. **Nima o'zgardi?**
   Miyaning barcha 1637 ta uch o'lchamli bo'laklari maxsus siqish usuli yordamida qariyb o'n barobar kichraytirildi (196 megabaytdan 21 megabaytga tushdi) va dasturga ularni o'qiy oladigan yangi mexanizm qo'shildi. Shuningdek, loyiha haqidagi qo'llanma ikki tilda yangilandi va barcha ilmiy manbalar hamda ularning ruxsatnomalari alohida hujjatga tartib bilan yozib chiqildi.
2. **Nima yaxshilandi (foydalanuvchi endi nimani ko'radi/qila oladi)?**
   Endi sayt internetga joylanganda uch o'lchamli miya modellari o'n barobar kamroq joy egallaydi va foydalanuvchi brauzerida ancha tez yuklanadi. Bundan tashqari, har bir atlas va miya kesimi qaysi ilmiy manbadan olingani va qanday shartlar asosida ishlatilayotganini hamma ochiq ko'ra oladi.
3. **Nima hali tayyor emas yoki tekshirilmagan?**
   Siqilgan 3D modellar arxivi kompyuterda tayyorlanib sinovdan o'tkazildi, biroq uni GitHub saytidagi "Releases" bo'limiga bir marta yuklab qo'yish kerak bo'ladi — shundan keyingina jonli sayt ularni avtomatik ravishda tortib oladi.

---

## Nima qilindi
- **Draco siqish skripti (`pipeline/tools/draco_meshes.py`):**
  - `public/meshes/` ichidagi barcha 1637 ta `.glb` faylni (9 ta qatlam) o'qib, glTF 2.0 `KHR_draco_mesh_compression` kengaytmasi (`DracoPy`, `quantization_bits=14`, `normal_quantization_bits=10`, `compression_level=7`) bilan siqib chiqaradi.
  - Siqish natijasida umumiy hajm **196.21 MB dan 21.04 MB ga (10.7%, −89.3%)** tushdi (barcha 1637 fayl 4.3 soniyada siqildi).
  - `--tar /tmp/meshes-draco.tar.gz` bayrog'i orqali GitHub Release uchun tayyor `.tar.gz` arxiv hosil qiladi.
- **Draco dekoder va `VITE_MESH_BASE` (`src/scene/loader.ts`, `public/draco/*`):**
  - Three.js `DRACOLoader` (`public/draco/draco_decoder.wasm`, `draco_wasm_wrapper.js`, `draco_decoder.js`) `GLTFLoader` ga ulandi (tashqi CDN'siz, mahalliy `${import.meta.env.BASE_URL}draco/` manzilidan).
  - Meshlar bazaviy manzili `import.meta.env.VITE_MESH_BASE` dan o'qiladigan qilindi (standart qiymati: `${import.meta.env.BASE_URL}meshes/`). Ham siqilmagan (dev), ham Draco bilan siqilgan GLB'lar birdek yuklanadi.
- **GitHub Pages deploy workflow (`.github/workflows/deploy.yml`):**
  - `VITE_MESH_BASE` muhit o'zgaruvchisi (`vars.VITE_MESH_BASE`) qo'llab-quvvatlandi.
  - Agar `VITE_MESH_BASE` berilmagan bo'lsa, workflow avtomatik tarzda GitHub Release'dan (`vars.MESH_RELEASE_TAG` yoki standart `meshes-v1`) `meshes-draco.tar.gz` assetini yuklab olib, `public/meshes/` ichiga yoyadi va Pages artefaktiga bir xil origin'da (`/<repo>/meshes/...`) qo'shadi (CORS muammosisiz va Pages 1 GB limitidan ~50 barobar kichik: ~21 MB).
- **Hujjatlar (`README.md`, `ATTRIBUTION.md`):**
  - `README.md` o'zbek va ingliz tillarida to'liq yangilandi: loyiha imkoniyatlari, arxitektura, ishga tushirish, Draco bilan siqish hamda GitHub Release (`meshes-v1`) yaratish yo'riqnomasi yozildi.
  - `ATTRIBUTION.md` yaratildi: barcha 9 ta 3D qatlam (`gross`, `julich`, `brodmann`, `desikan`, `destrieux`, `glasser`, `jhu`, `bstem`, `suit`), 68 ta ko'zgulangan tomir, 21 ta BigBrain real gistologik kesimi hamda uchinchi tomon dasturlarining manbalari, ilmiy sitatalari (DOI), litsenziyalari va havolalari batafsil keltirildi.

### Hajm jadvali (Oldin / Keyin — `draco_meshes.py` natijasi)

| Qatlam (Layer) | Fayllar | Oldin (Uncompressed) | Keyin (Draco) | Nisbat (Ratio) | Tejaldi |
|---|---:|---:|---:|---:|---:|
| `brodmann` | 82 | 24.18 MB | 2.37 MB | 9.8% | −90.2% |
| `bstem` | 38 | 4.63 MB | 0.47 MB | 10.1% | −89.9% |
| `desikan` | 70 | 27.76 MB | 3.02 MB | 10.9% | −89.1% |
| `destrieux` | 148 | 23.23 MB | 2.18 MB | 9.4% | −90.6% |
| `glasser` | 358 | 33.73 MB | 3.63 MB | 10.8% | −89.2% |
| `gross` | 447 | 44.18 MB | 5.18 MB | 11.7% | −88.3% |
| `jhu` | 48 | 5.56 MB | 0.54 MB | 9.7% | −90.3% |
| `julich` | 414 | 28.60 MB | 3.23 MB | 11.3% | −88.7% |
| `suit` | 32 | 4.34 MB | 0.43 MB | 9.9% | −90.1% |
| **Jami (Total)** | **1637** | **196.21 MB** | **21.04 MB** | **10.7%** | **−89.3%** |

## O'zgargan fayllar (hammasi vazifa ro'yxatida bo'lishi shart)
- `pipeline/tools/draco_meshes.py` (yangi)
- `src/scene/loader.ts`
- `public/draco/draco_decoder.js` (yangi)
- `public/draco/draco_decoder.wasm` (yangi)
- `public/draco/draco_wasm_wrapper.js` (yangi)
- `.github/workflows/deploy.yml`
- `README.md`
- `ATTRIBUTION.md` (yangi)
- `docs/handoff/AG-3.md` (yangi)
- `docs/handoff/AG-3/dev-uncompressed.png` (yangi)
- `docs/handoff/AG-3/preview-draco.png` (yangi)

## Tekshiruv
- `npx tsc -p tsconfig.app.json --noEmit` ✅
- `npm run build && rm -rf dist` ✅
- `audit-lesions`: `territories: 86, mismatches: 0` ✅
- `audit-pick` (siqilmagan dev meshlar bilan): `{"same": 418, "diff": 0, "ex": {}}` ✅
- `audit-pick` (Draco bilan siqilgan meshlar bilan): `{"same": 418, "diff": 0, "ex": {}}` ✅
- Screenshotlar:
  - `docs/handoff/AG-3/dev-uncompressed.png` — `npm run dev` (3020-port) da siqilmagan meshlar bilan 3D sahna o'zgarishsiz yuklangani.
  - `docs/handoff/AG-3/preview-draco.png` — Draco bilan siqilgan meshlar (`21.04 MB`) bilan `npm run build && npm run preview` da 3D sahna mahalliy `public/draco/` dekoderi orqali xatosiz yuklangani.
- Manbalar (`ATTRIBUTION.md` ichidagi DOI'lar — loyiha bazasida Crossref orqali tasdiqlangan):
  - `10.1093/nar/gkn613` — Mitsuhashi et al. 2009, *Nucleic Acids Research* — "BodyParts3D: 3D structure database for anatomical concepts"
  - `10.1126/science.abb4588` — Amunts et al. 2020, *Science* — "Julich-Brain: A 3D probabilistic atlas of the human brain's cytoarchitecture"
  - `10.1007/s12021-014-9258-x` — Bakker et al. 2015, *Neuroinformatics* — "The Scalable Brain Atlas: Instant Web-Based Access to Public Brain Atlases and Related Content"
  - `10.1038/s41597-021-00849-3` — Lawrence et al. 2021, *Scientific Data* — "Standardizing human brain parcellations"
  - `10.1016/j.neuroimage.2006.01.021` — Desikan et al. 2006, *NeuroImage* — "An automated labeling system for subdividing the human cerebral cortex on MRI scans into gyral based regions of interest"
  - `10.1016/j.neuroimage.2010.06.010` — Destrieux et al. 2010, *NeuroImage* — "Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature"
  - `10.1038/nature18933` — Glasser et al. 2016, *Nature* — "A multi-modal parcellation of human cerebral cortex"
  - `10.1016/j.neuroimage.2007.12.035` — Mori et al. 2008, *NeuroImage* — "Stereotaxic white matter atlas based on diffusion tensor imaging in an ICBM template"
  - `10.1016/j.neuroimage.2007.07.053` — Hua et al. 2008, *NeuroImage* — "Tract probability maps in stereotaxic spaces: analyses of white matter anatomy and tract-specific quantification"
  - `10.1002/cne.24080` — Ding et al. 2016, *Journal of Comparative Neurology* — "Comprehensive cellular-resolution atlas of the adult human brain"
  - `10.5061/dryad.zw3r228d2` — Edlow et al. 2023, *Dryad* — "Harvard Ascending Arousal Network Atlas v2.0"
  - `10.1016/j.neuroimage.2009.01.045` — Diedrichsen et al. 2009, *NeuroImage* — "A probabilistic MR atlas of the human cerebellum"
  - `10.1016/j.neuroimage.2010.10.035` — Diedrichsen et al. 2011, *NeuroImage* — "Imaging the deep cerebellar nuclei: a probabilistic atlas and normalization procedure"
  - `10.1126/science.1235381` — Amunts et al. 2013, *Science* — "BigBrain: An Ultrahigh-Resolution 3D Human Brain Model"

## Ochiq savollar / qolgan ishlar
- GitHub Pages'da jonli sayt 3D modellarni avtomatik olishi uchun bir marta `meshes-v1` relizini yaratib, `/tmp/meshes-draco.tar.gz` arxivini yuklash kerak (`README.md` da buyrug'i berilgan: `gh release create meshes-v1 /tmp/meshes-draco.tar.gz --repo QuarkSci/neuro-atlas --title "3D Meshes v1 (Draco)"`).

## Ko'rib chiqish (Claude to'ldiradi)
