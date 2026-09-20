"""Brainstem and cerebellum sub-parcellations -> per-region GLB.

Two layers, each from open (redistributable) MNI label volumes:

  bstem  Allen Human Reference Atlas - 3D, 2020 (Ding et al.; CC BY 4.0)
         brainstem subdivisions (tegmenta, basilar pons, pyramid, inferior
         olive, peduncles, pretectum) — file is hemisphere-mirrored and uses
         one label for both sides, so each region is split at x = 0 —
         plus the Harvard Ascending Arousal Network atlas v2.0 (Edlow &
         Kinney 2023; CC0) — ten arousal nuclei (LC, DR, MnR, PAG, VTA, PTg,
         LDTg, PBC, PnO, mRt), already sided in the combined label file.
  suit   Diedrichsen 2009 probabilistic cerebellar atlas (CC BY-NC 3.0 per the
         repo LICENSE; its README says CC BY — we cite the stricter), maximum-
         probability lobules I–X / Crus I–II / vermis + dentate / interposed
         nuclei (the fastigial max-prob label has < 5 voxels; Julich has it).

Rejected on licence grounds (no redistribution): Brainstem Navigator (MGH)
and the USC brainstem connectome pathway atlas — see PLAN.md 1.

Raw inputs (never committed):
  data/raw/brainstem/allen_annotation_full.nii.gz      (0.5 mm, ICBM 2009b sym)
  data/raw/brainstem/allen_ontology_graph16.json       (Allen API structure graph)
  data/raw/brainstem/AAN_Brainstem_MNI152_1mm_v2p0.nii (1 mm, MNI152)
  data/raw/suit/atl-Anatom_space-MNI_dseg.nii          (1 mm, MNI152NLin6Asym)

Usage:  pipeline/.venv/bin/python pipeline/subcortical_to_glb.py bstem|suit
Output: public/meshes/<layer>/<id>.glb and data/<layer>.json
"""
import json, pathlib, re, sys
import numpy as np, nibabel as nib, trimesh
from skimage import measure

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw'
MAX_FACES = 16000

ALLEN_SRC = 'Allen Human Reference Atlas – 3D, 2020 (Ding et al.) · CC BY 4.0'
AAN_SRC = 'Harvard Ascending Arousal Network Atlas v2.0 (Edlow & Kinney 2023) · CC0'
SUIT_SRC = 'Diedrichsen 2009 probabilistic cerebellar atlas (SUIT) · CC BY-NC 3.0'

# Allen label -> (display name, group). Every one of these is split left/right.
ALLEN = {
    12195: ('Midbrain tegmentum', 'midbrain'),
    12181: ('Pretectal region', 'midbrain'),
    12330: ('Cerebral peduncle (crus cerebri)', 'midbrain'),
    12405: ('Basilar part of pons', 'pons'),
    12416: ('Pontine tegmentum', 'pons'),
    12354: ('Superior cerebellar peduncle', 'pons'),
    12768: ('Middle cerebellar peduncle', 'pons'),
    12535: ('Pyramid of medulla oblongata', 'medulla'),
    12538: ('Tegmentum of medulla oblongata', 'medulla'),
    12600: ('Inferior olive', 'medulla'),
    12741: ('Inferior cerebellar peduncle', 'medulla'),
}
# AAN label -> (display name, side, group)
AAN = {
    7201: ('Dorsal raphe nucleus (DR)', 'midline', 'midbrain'),
    7202: ('Median raphe nucleus (MnR)', 'midline', 'pons'),
    7203: ('Periaqueductal grey (PAG)', 'midline', 'midbrain'),
    7204: ('Ventral tegmental area (VTA)', 'midline', 'midbrain'),
    7301: ('Locus coeruleus (LC)', 'left', 'pons'), 7401: ('Locus coeruleus (LC)', 'right', 'pons'),
    7302: ('Laterodorsal tegmental nucleus (LDTg)', 'left', 'pons'), 7402: ('Laterodorsal tegmental nucleus (LDTg)', 'right', 'pons'),
    7303: ('Mesencephalic reticular formation (mRt)', 'left', 'midbrain'), 7403: ('Mesencephalic reticular formation (mRt)', 'right', 'midbrain'),
    7304: ('Parabrachial complex (PBC)', 'left', 'pons'), 7404: ('Parabrachial complex (PBC)', 'right', 'pons'),
    7305: ('Pontine reticular formation, oral part (PnO)', 'left', 'pons'), 7405: ('Pontine reticular formation, oral part (PnO)', 'right', 'pons'),
    7306: ('Pedunculotegmental (pedunculopontine) nucleus (PTg)', 'left', 'midbrain'), 7406: ('Pedunculotegmental (pedunculopontine) nucleus (PTg)', 'right', 'midbrain'),
}
# SUIT label name -> (display name, side, group)
SUIT_GROUP = {'I_IV': 'anterior-lobe', 'V': 'anterior-lobe', 'VI': 'posterior-lobe', 'CrusI': 'posterior-lobe',
              'CrusII': 'posterior-lobe', 'VIIb': 'posterior-lobe', 'VIIIa': 'posterior-lobe', 'VIIIb': 'posterior-lobe',
              'IX': 'posterior-lobe', 'X': 'flocculonodular-lobe', 'Dentate': 'deep-nuclei', 'Interposed': 'deep-nuclei',
              'Fastigial': 'deep-nuclei'}
SUIT_NAME = {'I_IV': 'Lobules I–IV', 'V': 'Lobule V', 'VI': 'Lobule VI', 'CrusI': 'Crus I', 'CrusII': 'Crus II',
             'VIIb': 'Lobule VIIb', 'VIIIa': 'Lobule VIIIa', 'VIIIb': 'Lobule VIIIb', 'IX': 'Lobule IX', 'X': 'Lobule X',
             'Dentate': 'Dentate nucleus', 'Interposed': 'Interposed nucleus', 'Fastigial': 'Fastigial nucleus'}

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def to_mesh(mask, aff, smooth=10):
    # Crop to the mask's bounding box: the Allen volume is 70 M voxels.
    idx = np.argwhere(mask)
    lo, hi = idx.min(0), idx.max(0) + 1
    sub = np.pad(mask[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], 1)
    verts, faces, _, _ = measure.marching_cubes(sub.astype(np.uint8), level=0.5, step_size=1)
    verts = verts - 1 + lo
    verts = nib.affines.apply_affine(aff, verts)
    mesh = trimesh.Trimesh(verts, faces, process=True)
    trimesh.smoothing.filter_taubin(mesh, lamb=0.5, nu=-0.53, iterations=smooth)
    if len(mesh.faces) > MAX_FACES:
        mesh = mesh.simplify_quadric_decimation(face_count=MAX_FACES)
    mesh.fix_normals()
    return mesh

def emit(out, cat, pid, name, side, group, label, mesh, source):
    (out / f'{pid}.glb').write_bytes(mesh.export(file_type='glb', include_normals=True))
    lo, hi = mesh.bounds
    cat.append(dict(id=pid, name=name, side=side, group=group, label=label, faces=int(len(mesh.faces)),
                    bbox=[lo.round(2).tolist(), hi.round(2).tolist()], centroid=mesh.centroid.round(2).tolist(),
                    source=source))
    print(f'{len(mesh.faces):7d}  {pid}')

def bstem(out, cat):
    img = nib.load(RAW / 'brainstem/allen_annotation_full.nii.gz')
    vol = np.asanyarray(img.dataobj).astype(np.int32)
    xs = nib.affines.apply_affine(img.affine, np.stack([np.arange(vol.shape[0]), np.zeros(vol.shape[0]), np.zeros(vol.shape[0])], 1))[:, 0]
    left_cols = (xs < 0)[:, None, None]
    for label, (name, group) in ALLEN.items():
        mask = vol == label
        for side, piece in (('left', mask & left_cols), ('right', mask & ~left_cols)):
            if piece.sum() < 20:
                continue
            emit(out, cat, slug(f'{name}-{side}'), name, side, group, label, to_mesh(piece, img.affine), ALLEN_SRC)
    img = nib.load(RAW / 'brainstem/AAN_Brainstem_MNI152_1mm_v2p0.nii')
    vol = np.asanyarray(img.dataobj).astype(np.int32)
    for label, (name, side, group) in AAN.items():
        mask = vol == label
        if mask.sum() < 5:
            print('!! empty', label, name); continue
        # Tiny nuclei (LDTg is 17 voxels) need gentler smoothing to keep volume.
        emit(out, cat, slug(f'{name}-{side}'), name, side, group, label, to_mesh(mask, img.affine, smooth=4), AAN_SRC)

def suit(out, cat):
    img = nib.load(RAW / 'suit/atl-Anatom_space-MNI_dseg.nii')
    vol = np.asanyarray(img.dataobj).astype(np.int32)
    for line in (RAW / 'suit/atl-Anatom.tsv').read_text().splitlines()[1:]:
        idx, key, _ = line.split('\t')
        m = re.match(r'^(Left|Right|Vermis)_(.+)$', key)
        pre, lob = m.groups()
        side = 'midline' if pre == 'Vermis' else pre.lower()
        name = ('Vermis ' + SUIT_NAME[lob].replace('Lobule ', '').replace('Lobules ', '')) if pre == 'Vermis' else SUIT_NAME[lob]
        mask = vol == int(idx)
        if mask.sum() < 10:
            print('!! skipped (too few voxels)', key, int(mask.sum())); continue
        emit(out, cat, slug(f'{name}-{side}'), name, side, SUIT_GROUP[lob], int(idx), to_mesh(mask, img.affine), SUIT_SRC)

def main():
    layer = sys.argv[1]
    out = ROOT / 'public/meshes' / layer
    out.mkdir(parents=True, exist_ok=True)
    cat = []
    {'bstem': bstem, 'suit': suit}[layer](out, cat)
    (ROOT / 'data' / f'{layer}.json').write_text(json.dumps(cat, indent=1, ensure_ascii=False))
    print(len(cat), 'regions ->', out)

if __name__ == '__main__':
    main()
