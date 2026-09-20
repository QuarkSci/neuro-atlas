# pipeline

```bash
python3 -m venv pipeline/.venv && pipeline/.venv/bin/pip install numpy nibabel scikit-image trimesh siibra
python3 pipeline/fetch_bp3d.py --list pipeline/bp3d_phase1.txt   # BodyParts3D OBJ → data/raw/bp3d/meshes
pipeline/.venv/bin/python pipeline/julich_to_glb.py               # Julich-Brain 3.1 → public/meshes/julich + data/julich.json
pipeline/.venv/bin/python pipeline/bp3d_to_glb.py                 # (1) un-aligned gross meshes
pipeline/.venv/bin/python pipeline/align_bp3d.py                  # fit affine → pipeline/align_bp3d.json
pipeline/.venv/bin/python pipeline/bp3d_to_glb.py                 # (2) aligned gross meshes → public/meshes/gross + data/gross.json
pipeline/.venv/bin/python pipeline/volume_to_glb.py brodmann         # neuroparc atlases (data/raw/neuroparc/*.nii.gz) → public/meshes/<layer>
# Brainstem (Allen 3D 2020 + Harvard AAN v2) and cerebellum (SUIT) — download recipe in subcortical_to_glb.py docstring:
#   Allen:  curl -O https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/annotation_full.nii.gz
#           + ontology: http://api.brain-map.org/api/v2/data/query.json?criteria=model::Structure,rma::criteria,[graph_id$eq16],rma::options[num_rows$eqall]
#   AAN:    https://zenodo.org/api/records/8161638/files/AAN_Brainstem_MNI152_1mm_v2p0.nii/content  (+ LUT, README)
#   SUIT:   https://raw.githubusercontent.com/DiedrichsenLab/cerebellar_atlases/master/Diedrichsen_2009/atl-Anatom_space-MNI_dseg.nii (+ atl-Anatom.tsv)
pipeline/.venv/bin/python pipeline/subcortical_to_glb.py bstem
pipeline/.venv/bin/python pipeline/subcortical_to_glb.py suit
pipeline/.venv/bin/python pipeline/build_catalogue.py               # everything → src/data/parts.json
python3 -m http.server 3018   # then open /pipeline/preview/index.html?layers=gross,julich&opacity=gross:0.22
```
