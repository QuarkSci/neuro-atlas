# pipeline

Raw inputs live in `data/raw/`, generated meshes in `public/meshes/` —
both gitignored. The per-source catalogues (`data/*.json`) and the merged
`src/data/parts.json` ARE committed, so the app builds without re-running
anything here. Re-run only when adding structures or on a fresh machine.

```bash
python3 -m venv pipeline/.venv && pipeline/.venv/bin/pip install numpy nibabel scikit-image trimesh fast-simplification siibra
```

## 1. BodyParts3D → gross anatomy (379 parts)

`data/raw/bp3d/files.txt` (the mesh path index) and `MANIFEST.csv` come
from the Git-LFS mirror
[olivercase/body_parts_3d_api](https://github.com/olivercase/body_parts_3d_api);
`fetch_bp3d.py` reads `files.txt` and pulls each OBJ from
`https://media.githubusercontent.com/media/olivercase/body_parts_3d_api/main/<path>`.
The selection lives in three phase lists (phase 1 = first 77 structures,
phase 3 = vessels/nerves/skull/meninges, phase 4 = the 2026-09-20 gaps).
Caveat: the FMA id in the file NAME is reliable, the `fma_id` column of
MANIFEST.csv is not (it names the parent concept).

```bash
python3 pipeline/fetch_bp3d.py --list pipeline/bp3d_phase1.txt   # then phase3, phase4
pipeline/.venv/bin/python pipeline/bp3d_to_glb.py                # (1) un-aligned meshes
pipeline/.venv/bin/python pipeline/align_bp3d.py                 # 20 landmarks → pipeline/align_bp3d.json (RMS 5.3 mm)
pipeline/.venv/bin/python pipeline/bp3d_to_glb.py                # (2) aligned → public/meshes/gross + data/gross.json
```

## 2. Julich-Brain 3.1 (508 parts)

```bash
pipeline/.venv/bin/python pipeline/julich_to_glb.py   # siibra; first run downloads config (~7 min), then cached
```

## 3. neuroparc atlases — Brodmann, Desikan, Destrieux, Glasser, JHU

Source: [neurodata/neuroparc](https://github.com/neurodata/neuroparc),
`atlases/label/Human/`. Files are renamed on download (`<Atlas>.nii.gz`,
`<Atlas>.json`) because `volume_to_glb.py` expects the short names.

```bash
B=https://raw.githubusercontent.com/neurodata/neuroparc/master/atlases/label/Human
mkdir -p data/raw/neuroparc
for a in Brodmann Desikan Destrieux Glasser JHU DKT; do
  curl -sL -o data/raw/neuroparc/$a.nii.gz "$B/${a}_space-MNI152NLin6_res-1x1x1.nii.gz"
  curl -sL -o data/raw/neuroparc/$a.json   "$B/Metadata-json/${a}_space-MNI152NLin6_res-1x1x1.json"
done
for a in brodmann desikan destrieux glasser jhu; do
  pipeline/.venv/bin/python pipeline/volume_to_glb.py $a
done
```

## 4. Brainstem (`bstem`, 38 meshes) and cerebellum (`suit`, 32 meshes)

Allen Human Reference Atlas – 3D 2020 (CC BY 4.0) + Harvard Ascending
Arousal Network v2.0 (CC0) + SUIT/Diedrichsen 2009 (CC BY-NC 3.0).
See the docstring of `subcortical_to_glb.py` for what each label is.

```bash
mkdir -p data/raw/brainstem data/raw/suit
A=https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1
curl -sL -o data/raw/brainstem/allen_annotation_full.nii.gz "$A/annotation_full.nii.gz"
# -g is required: the URL contains [ ] which curl would otherwise treat as a glob
curl -sgL 'http://api.brain-map.org/api/v2/data/query.json?criteria=model::Structure,rma::criteria,[graph_id$eq16],rma::options[num_rows$eqall]' \
  | python3 -c 'import json,sys;json.dump(json.load(sys.stdin)["msg"],open("data/raw/brainstem/allen_ontology_graph16.json","w"))'
Z=https://zenodo.org/api/records/8161638/files
curl -sL -o data/raw/brainstem/AAN_Brainstem_MNI152_1mm_v2p0.nii "$Z/AAN_Brainstem_MNI152_1mm_v2p0.nii/content"
S=https://raw.githubusercontent.com/DiedrichsenLab/cerebellar_atlases/master/Diedrichsen_2009
curl -sL -o data/raw/suit/atl-Anatom_space-MNI_dseg.nii "$S/atl-Anatom_space-MNI_dseg.nii"
curl -sL -o data/raw/suit/atl-Anatom.tsv "$S/atl-Anatom.tsv"

pipeline/.venv/bin/python pipeline/subcortical_to_glb.py bstem
pipeline/.venv/bin/python pipeline/subcortical_to_glb.py suit
```

## 5. Merge everything → the app

```bash
pipeline/.venv/bin/python pipeline/build_catalogue.py   # data/*.json → src/data/parts.json (1672 parts, 9 layers)
```

## Standalone preview (no app build)

```bash
python3 -m http.server 3018   # then /pipeline/preview/index.html?layers=gross,julich&opacity=gross:0.22
```

## Licence notes

- Rejected, no redistribution allowed: **Brainstem Navigator** (MGH, 31
  nuclei) and the **USC brainstem connectome atlas** (Tang 2018) — both
  say "YOU MAY NOT DISTRIBUTE … files or of information derived from them".
  Read the NITRC agreement page before downloading: `curl` returns the
  agreement HTML, not the zip.
- SUIT: the repo README says CC BY, but `tpl-SUIT/LICENSE` says
  **CC BY-NC 3.0** — the licence file wins, and that is what we record.
