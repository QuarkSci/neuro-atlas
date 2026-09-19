"""Fit the BodyParts3D -> MNI152 affine from landmark centroids.

BodyParts3D is one subject in a whole-body frame; Julich-Brain is MNI152.
Pairs below match a BodyParts3D structure with the union of the Julich areas
that tile it.  Centroids are volume-weighted (trimesh), the fit is a full
12-parameter affine by least squares; residuals are printed so a bad pair
shows up.  Result: pipeline/align_bp3d.json (row-major 4x4).
"""
import json, pathlib, re
import numpy as np, trimesh

ROOT = pathlib.Path(__file__).resolve().parents[1]
G = json.load(open(ROOT / 'data/gross.json'))
J = json.load(open(ROOT / 'data/julich.json'))

# (bp3d name regex, julich name regex) — both evaluated per hemisphere
PAIRS = [
    (r'^{h} amygdala$',            r'\((Amygdala)\) {h}$'),
    (r'^{h} hippocampus proper$',  r'^(CA1|CA2|CA3|DG) \(Hippocampus\) {h}$'),
    (r'^{h} thalamus$',            r'\(Thalamus,.*\) {h}$|\(Metathalamus\) {h}$'),
    (r'^{h} precentral gyrus$',    r'^Area (4a|4p|6d1|6d2|6v1|6v2|6v3|6r1) \(PreCG\) {h}$'),
    (r'^{h} postcentral gyrus$',   r'^Area (3a|3b|1) \(PostCG\) {h}$|^Area 2 \(PostCS\) {h}$'),
    (r'^{h} insula$',              r'\(Insula\) {h}$'),
    # dropped — Julich tiles only part of the gyrus (residual 10–24 mm):
    # (r'^{h} fusiform gyrus$',      r'\(FusG\) {h}$'),
    # dropped — Julich tiles only part of the gyrus (residual 10–24 mm):
    # (r'^{h} parahippocampal gyrus$', r'\(PhG\) {h}$'),
    (r'^{h} inferior frontal gyrus$', r'^Area (44|45) \(IFG\) {h}$'),
    (r'^{h} (anterior|lateral|medial|posterior) orbital gyrus$', r'\(OFC\) {h}$'),
    (r'^{h} angular gyrus$',       r'^Area PG[ap] \(IPL\) {h}$'),
    (r'^{h} supramarginal gyrus$', r'^Area PF\w* \(IPL\) {h}$'),
    # dropped — Julich tiles only part of the gyrus (residual 10–24 mm):
    # (r'^{h} lingual gyrus$',       r'^Area hOc(3v|4v) \(LingG\) {h}$'),
    # dropped — Julich tiles only part of the gyrus (residual 10–24 mm):
    # (r'^{h} superior temporal gyrus$', r'\(HESCHL\) {h}$|\(STG\) {h}$'),
]

def centroid(paths):
    ms = [trimesh.load(p, force='mesh') for p in paths]
    w = np.array([abs(m.volume) for m in ms]); c = np.array([m.center_mass for m in ms])
    return (c * w[:, None]).sum(0) / w.sum()

src, dst, tags = [], [], []
for h in ('left', 'right'):
    for bp_re, ju_re in PAIRS:
        bp = [p for p in G if re.search(bp_re.format(h=h.capitalize()), p['name'])]
        ju = [p for p in J if re.search(ju_re.format(h=h), p['name'])]
        if not bp or not ju:
            print('skip', h, bp_re, len(bp), len(ju)); continue
        src.append(centroid([ROOT / f'public/meshes/gross/{p["id"]}.glb' for p in bp]))
        dst.append(centroid([ROOT / f'public/meshes/julich/{p["id"]}.glb' for p in ju]))
        tags.append(f'{h[0].upper()} {bp[0]["name"]} ({len(ju)} julich)')
src, dst = np.array(src), np.array(dst)
A = np.hstack([src, np.ones((len(src), 1))])
M, *_ = np.linalg.lstsq(A, dst, rcond=None)          # (4x3): dst = [src 1] @ M
aff = np.eye(4); aff[:3, :] = M.T
res = A @ M - dst
for t, r in zip(tags, res): print(f'{np.linalg.norm(r):5.1f} mm  {t}')
print('rms', np.sqrt((res ** 2).sum(1).mean()).round(2), 'mm')
print('scale per axis', np.linalg.norm(M[:3], axis=0).round(3))
json.dump(dict(affine=aff.round(6).tolist(), rms_mm=float(np.sqrt((res ** 2).sum(1).mean())),
               landmarks=tags), open(ROOT / 'pipeline/align_bp3d.json', 'w'), indent=1)
