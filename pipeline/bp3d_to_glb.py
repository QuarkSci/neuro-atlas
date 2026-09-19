"""Convert downloaded BodyParts3D OBJ meshes to per-part GLB + a catalogue.

BodyParts3D frame: millimetres, Z up (z ~ 1500 mm = head height above the
feet), +X = subject's left, +Y = posterior.  We convert to the RAS frame used
by MNI atlases (+X right, +Y anterior, +Z superior) with the origin left as-is;
the MNI alignment (translation/scale) is a separate calibration step
(pipeline/align_bp3d.json) once Julich meshes are available to compare.

Output: public/meshes/gross/<fma>.glb and data/gross.json (id, name, fma, fj,
bbox, centroid, faces).
"""
import json, pathlib, re, sys
import numpy as np, trimesh

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/raw/bp3d/meshes'
OUT = ROOT / 'public/meshes/gross'
NAME_RE = re.compile(r'^(FJ\d+M?)_(BP\d+)_(FMA\d+)_(.+)\.obj$')

# BodyParts3D (left, posterior, up) -> RAS (right, anterior, up)
TO_RAS = np.diag([-1.0, -1.0, 1.0, 1.0])
# RAS body frame -> MNI152 mm, fitted by pipeline/align_bp3d.py (run that first
# with ALIGN absent to produce the un-aligned meshes it needs, then re-run this).
ALIGN = ROOT / 'pipeline/align_bp3d.json'
TO_MNI = np.array(json.load(open(ALIGN))['affine']) if ALIGN.exists() else np.eye(4)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    cat = []
    for f in sorted(SRC.glob('*.obj')):
        m = NAME_RE.match(f.name)
        if not m:
            print('skip', f.name); continue
        fj, bp, fma, name = m.groups()
        mesh = trimesh.load(f, force='mesh', process=True)
        mesh.apply_transform(TO_MNI @ TO_RAS)
        mesh.fix_normals()
        pid = f'{fma.lower()}-{fj.lower()}'
        (OUT / f'{pid}.glb').write_bytes(mesh.export(file_type='glb', include_normals=True))
        lo, hi = mesh.bounds
        cat.append(dict(id=pid, name=name, fma=fma, fj=fj, bp=bp,
                        faces=int(len(mesh.faces)),
                        bbox=[lo.round(2).tolist(), hi.round(2).tolist()],
                        centroid=mesh.centroid.round(2).tolist(),
                        source='BodyParts3D 4.3 (DBCLS) CC BY-SA 2.1 JP'))
        print(f'{len(mesh.faces):7d}  {pid}  {name}')
    (ROOT / 'data').mkdir(exist_ok=True)
    (ROOT / 'data/gross.json').write_text(json.dumps(cat, indent=1, ensure_ascii=False))
    print(len(cat), 'parts ->', OUT)

if __name__ == '__main__':
    main()
