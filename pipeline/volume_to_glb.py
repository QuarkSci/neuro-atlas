"""Generic MNI label volume -> per-region GLB, for the neuroparc atlases.

neuroparc (neurodata) ships every atlas as a MNI152NLin6 1 mm label NIfTI
plus a JSON with {label index: name}.  Atlases marked "Symmetrical" use one
index for both hemispheres, so each such region is split at the midline
(voxel x < 0 mm => left) into two parts.

Usage:  python3 pipeline/volume_to_glb.py brodmann|desikan|destrieux|glasser|jhu|dkt

Output: public/meshes/<layer>/<id>.glb and data/<layer>.json
"""
import json, pathlib, re, sys
import numpy as np, nibabel as nib, trimesh
from skimage import measure

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/neuroparc'
MAX_FACES = 20000

ATLASES = {
    'brodmann': dict(file='Brodmann', symmetric=True, source='Brodmann areas (Scalable Brain Atlas B05 on Conte69, via neuroparc)', license='free for research and education'),
    'desikan': dict(file='Desikan', symmetric=False, source='Desikan-Killiany atlas (FreeSurfer, via neuroparc)', license='FreeSurfer licence'),
    'destrieux': dict(file='Destrieux', symmetric=True, source='Destrieux 2009 atlas (FreeSurfer, via neuroparc)', license='FreeSurfer licence'),
    'glasser': dict(file='Glasser', symmetric=True, source='HCP-MMP1.0 (Glasser et al. 2016, via neuroparc)', license='WU-Minn HCP Open Access Data Use Terms'),
    'jhu': dict(file='JHU', symmetric=False, source='JHU ICBM-DTI-81 white-matter labels (via neuroparc)', license='FSL licence, non-commercial'),
    'dkt': dict(file='DKT', symmetric=False, source='DKT31 protocol (Mindboggle, via neuroparc)', license='CC BY'),
}

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def pretty(label):
    return label.replace('_', ' ').replace('+', ' + ').strip()

def to_mesh(mask, aff):
    padded = np.pad(mask, 1)
    verts, faces, _, _ = measure.marching_cubes(padded.astype(np.uint8), level=0.5, step_size=1)
    verts -= 1
    verts = nib.affines.apply_affine(aff, verts)
    mesh = trimesh.Trimesh(verts, faces, process=True)
    trimesh.smoothing.filter_taubin(mesh, lamb=0.5, nu=-0.53, iterations=10)
    if len(mesh.faces) > MAX_FACES:
        mesh = mesh.simplify_quadric_decimation(face_count=MAX_FACES)
    mesh.fix_normals()
    return mesh

def main():
    layer = sys.argv[1]
    a = ATLASES[layer]
    out = ROOT / 'public/meshes' / layer
    out.mkdir(parents=True, exist_ok=True)
    img = nib.load(RAW / f"{a['file']}.nii.gz")
    vol = np.asanyarray(img.dataobj).astype(np.int32)
    aff = img.affine
    meta = json.load(open(RAW / f"{a['file']}.json"))['rois']
    # World x of every voxel column, for the hemisphere split.
    xs = nib.affines.apply_affine(aff, np.stack([np.arange(vol.shape[0]), np.zeros(vol.shape[0]), np.zeros(vol.shape[0])], 1))[:, 0]
    left_cols = (xs < 0)[:, None, None]
    print(layer, vol.shape, 'labels', len(np.unique(vol)) - 1)
    cat = []
    for key, roi in meta.items():
        label = int(key)
        if label == 0 or not roi.get('label'):
            continue
        name = pretty(roi['label'])
        mask = vol == label
        if not mask.any():
            continue
        if a['symmetric']:
            pieces = [('left', mask & left_cols), ('right', mask & ~left_cols)]
        else:
            m = re.match(r'^(L|R|Left|Right)[_ ](.*)$', roi['label'], re.I)
            if m:
                side = 'left' if m.group(1).lower().startswith('l') else 'right'
                name = pretty(m.group(2))
                pieces = [(side, mask)]
            else:
                pieces = [('midline', mask)]
        for side, piece in pieces:
            if piece.sum() < 20:
                continue
            mesh = to_mesh(piece, aff)
            pid = slug(f'{name}-{side}')
            (out / f'{pid}.glb').write_bytes(mesh.export(file_type='glb', include_normals=True))
            lo, hi = mesh.bounds
            cat.append(dict(id=pid, name=name, side=side, label=label, faces=int(len(mesh.faces)),
                            bbox=[lo.round(2).tolist(), hi.round(2).tolist()],
                            centroid=mesh.centroid.round(2).tolist(),
                            source=f"{a['source']} · {a['license']}"))
            print(f'{len(mesh.faces):7d}  {pid}')
    (ROOT / 'data' / f'{layer}.json').write_text(json.dumps(cat, indent=1, ensure_ascii=False))
    print(len(cat), 'regions ->', out)

if __name__ == '__main__':
    main()
