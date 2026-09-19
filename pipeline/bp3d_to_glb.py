"""Convert downloaded BodyParts3D OBJ meshes to per-part GLB + a catalogue.

BodyParts3D frame: millimetres, Z up (z ~ 1500 mm = head height above the
feet), +X = subject's left, +Y = posterior.  We convert to the RAS frame used
by MNI atlases (+X right, +Y anterior, +Z superior) and then apply the
landmark-fitted affine from pipeline/align_bp3d.json (run align_bp3d.py once
with that file absent to produce the un-aligned meshes it needs).

Same-named OBJs are one anatomical part cut into segments (a vessel comes as
5–20 files) — they are merged — unless they are mirror halves of a midline
structure (two "Pons" files), which become Left/Right parts.  Big meshes are
decimated to MAX_FACES so the skull and dura do not dominate the download.

Output: public/meshes/gross/<id>.glb and data/gross.json.
"""
import json, pathlib, re
from collections import defaultdict
import numpy as np, trimesh

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/raw/bp3d/meshes'
OUT = ROOT / 'public/meshes/gross'
NAME_RE = re.compile(r'^(FJ\d+M?)_(BP\d+)_(FMA\d+)_(.+)\.obj$')
MAX_FACES = 24000

# BodyParts3D (left, posterior, up) -> RAS (right, anterior, up)
TO_RAS = np.diag([-1.0, -1.0, 1.0, 1.0])
ALIGN = ROOT / 'pipeline/align_bp3d.json'
TO_MNI = np.array(json.load(open(ALIGN))['affine']) if ALIGN.exists() else np.eye(4)

def load(path):
    m = trimesh.load(path, force='mesh', process=True)
    m.apply_transform(TO_MNI @ TO_RAS)
    return m

def finish(mesh):
    if len(mesh.faces) > MAX_FACES:
        mesh = mesh.simplify_quadric_decimation(face_count=MAX_FACES)
    mesh.fix_normals()
    return mesh

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    groups = defaultdict(list)
    for f in sorted(SRC.glob('*.obj')):
        m = NAME_RE.match(f.name)
        if not m:
            print('skip', f.name); continue
        fj, bp, fma, name = m.groups()
        groups[name].append((f, fj, bp, fma))

    cat = []
    def emit(name, mesh, fj, bp, fma, n_src):
        mesh = finish(mesh)
        pid = f'{fma.lower()}-{fj.lower()}'
        (OUT / f'{pid}.glb').write_bytes(mesh.export(file_type='glb', include_normals=True))
        lo, hi = mesh.bounds
        cat.append(dict(id=pid, name=name, fma=fma, fj=fj, bp=bp, faces=int(len(mesh.faces)), segments=n_src,
                        bbox=[lo.round(2).tolist(), hi.round(2).tolist()],
                        centroid=mesh.centroid.round(2).tolist(),
                        source='BodyParts3D 4.3 (DBCLS) CC BY-SA 2.1 JP'))
        print(f'{len(mesh.faces):7d}  {n_src:2d}  {pid}  {name}')

    for name, items in groups.items():
        meshes = [(load(f), fj, bp, fma) for f, fj, bp, fma in items]
        if len(meshes) == 1:
            m, fj, bp, fma = meshes[0]
            emit(name, m, fj, bp, fma, 1); continue
        xs = [m.centroid[0] for m, *_ in meshes]
        sided = re.match(r'^(Left|Right)\b', name)
        # Mirror halves: exactly two files, one clearly each side of the midline.
        if not sided and len(meshes) == 2 and min(xs) < -3 and max(xs) > 3:
            for m, fj, bp, fma in meshes:
                side = 'Left' if m.centroid[0] < 0 else 'Right'
                emit(f'{side} {name[0].lower() + name[1:]}', m, fj, bp, fma, 1)
            continue
        # Segments of one structure: merge, keep the id of the largest piece.
        big = max(meshes, key=lambda t: len(t[0].faces))
        merged = trimesh.util.concatenate([m for m, *_ in meshes])
        emit(name, merged, big[1], big[2], big[3], len(meshes))

    (ROOT / 'data').mkdir(exist_ok=True)
    (ROOT / 'data/gross.json').write_text(json.dumps(cat, indent=1, ensure_ascii=False))
    print(len(cat), 'parts ->', OUT)

if __name__ == '__main__':
    main()
