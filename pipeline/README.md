# pipeline

```bash
python3 -m venv pipeline/.venv && pipeline/.venv/bin/pip install numpy nibabel scikit-image trimesh siibra
python3 pipeline/fetch_bp3d.py --list pipeline/bp3d_phase1.txt   # BodyParts3D OBJ → data/raw/bp3d/meshes
pipeline/.venv/bin/python pipeline/julich_to_glb.py               # Julich-Brain 3.1 → public/meshes/julich + data/julich.json
pipeline/.venv/bin/python pipeline/bp3d_to_glb.py                 # (1) un-aligned gross meshes
pipeline/.venv/bin/python pipeline/align_bp3d.py                  # fit affine → pipeline/align_bp3d.json
pipeline/.venv/bin/python pipeline/bp3d_to_glb.py                 # (2) aligned gross meshes → public/meshes/gross + data/gross.json
python3 -m http.server 3018   # then open /pipeline/preview/index.html?layers=gross,julich&opacity=gross:0.22
```
