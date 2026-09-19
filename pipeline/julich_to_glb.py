"""Julich-Brain 3.1 (CC BY-NC-SA 4.0, Forschungszentrum Jülich) -> per-area GLB.

Fetches the MNI152 *labelled* (maximum-probability) map through siibra, runs
marching cubes per label, maps voxel coordinates through the NIfTI affine
(so vertices are MNI152 millimetres, RAS), smooths, and writes
public/meshes/julich/<id>.glb + data/julich.json.

Usage: python3 pipeline/julich_to_glb.py [--limit N] [--filter substring]
"""
import json, pathlib, re, sys
import numpy as np, nibabel as nib, trimesh
from skimage import measure
import siibra

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/meshes/julich'
RAW = ROOT / 'data/raw/julich'

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def main():
    args = sys.argv[1:]
    limit = int(args[args.index('--limit') + 1]) if '--limit' in args else None
    flt = args[args.index('--filter') + 1].lower() if '--filter' in args else None
    OUT.mkdir(parents=True, exist_ok=True); RAW.mkdir(parents=True, exist_ok=True)

    parc = siibra.parcellations.get('julich 3.1')
    m = parc.get_map(space=siibra.spaces.get('mni152'), maptype='labelled')
    cat, n = [], 0
    for frag in sorted(m.fragments):
        nii_path = RAW / f'julich31_{slug(frag)}.nii.gz'
        if not nii_path.exists():
            img = m.fetch(fragment=frag)
            nib.save(img, nii_path)
        img = nib.load(nii_path)
        vol = np.asanyarray(img.dataobj).astype(np.int32)
        aff = img.affine
        print(frag, vol.shape, 'labels', len(np.unique(vol)) - 1, 'voxel', nib.affines.voxel_sizes(aff))
        for region in m.regions:
            hemi = 'left' if 'left' in region.lower() else 'right' if 'right' in region.lower() else None
            if hemi and hemi not in frag: continue
            if flt and flt not in region.lower(): continue
            try:
                idx = m.get_index(region)
            except Exception as e:
                print('  ?? no index for', region, e); continue
            if idx.fragment and idx.fragment != frag: continue
            mask = vol == idx.label
            if not mask.any(): continue
            padded = np.pad(mask, 1)
            verts, faces, _, _ = measure.marching_cubes(padded.astype(np.uint8), level=0.5, step_size=1)
            verts -= 1
            verts = nib.affines.apply_affine(aff, verts)
            mesh = trimesh.Trimesh(verts, faces, process=True)
            trimesh.smoothing.filter_taubin(mesh, lamb=0.5, nu=-0.53, iterations=10)
            mesh.fix_normals()
            pid = slug(region)
            (OUT / f'{pid}.glb').write_bytes(mesh.export(file_type='glb', include_normals=True))
            lo, hi = mesh.bounds
            cat.append(dict(id=pid, name=region, label=int(idx.label), fragment=frag,
                            faces=int(len(mesh.faces)),
                            bbox=[lo.round(2).tolist(), hi.round(2).tolist()],
                            centroid=mesh.centroid.round(2).tolist(),
                            source='Julich-Brain 3.1 (FZ Jülich) CC BY-NC-SA 4.0'))
            n += 1
            print(f'{len(mesh.faces):7d}  {pid}')
            if limit and n >= limit: break
        if limit and n >= limit: break
    (ROOT / 'data/julich.json').write_text(json.dumps(cat, indent=1, ensure_ascii=False))
    print(len(cat), 'areas ->', OUT)

if __name__ == '__main__':
    main()
