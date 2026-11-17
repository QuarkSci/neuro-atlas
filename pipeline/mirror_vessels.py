"""Give every one-sided BodyParts3D vessel a mirrored twin on the other side.

BodyParts3D models one person and gives most veins (and many arterial branches)
on the right side only, so the atlas showed a transverse sinus, a superficial
middle cerebral vein, a middle meningeal artery... on one side.  Real anatomy
is bilateral (with normal asymmetries — e.g. the right transverse sinus is
often dominant), so the model shows both sides and the content says which is
usually larger.

The twin is not a plain x → −x flip: this specimen's hemispheres are not
mirror images (left structures sit ~2 mm posterior to their right partners).
An affine "mirror, then right → left" map is fitted by least squares on the
centroids of every gross structure present on both sides, and its residual is
reported.  Each twin is checked for sinking into the opposite hemisphere:
depth of its vertices under the target side's cortical surface, compared with
the original's depth under its own.

Unpaired midline vessels are never mirrored (great cerebral vein, confluence,
occipital sinus, dorsal medullary vein).  Twins are marked as mirrored in the
catalogue (`meshSource`) — artificial, and not hidden.

Input:  src/data/parts.json (current catalogue), public/meshes/gross/*.glb
Output: public/meshes/gross/<id>-mirror.glb, data/gross_mirrored.json
Usage:  pipeline/.venv/bin/python pipeline/mirror_vessels.py   (then build_catalogue.py)
"""
import json, pathlib, re
import numpy as np, trimesh
from scipy.spatial import cKDTree

ROOT = pathlib.Path(__file__).resolve().parents[1]
MESH = ROOT / 'public/meshes'
UNPAIRED = re.compile(r'great cerebral vein|sinus confluence|occipital sinus|dorsal medullary vein', re.I)
SIDE_WORD = re.compile(r'\b(left|right|Left|Right)\b')
SWAP = {'left': 'right', 'right': 'left', 'Left': 'Right', 'Right': 'Left'}

parts = json.load(open(ROOT / 'src/data/parts.json'))['parts']
gross = [p for p in parts if p['layer'] == 'gross' and 'centroid' in p and not p['id'].endswith('-mirror')]
by_id = {p['id']: p for p in gross}
vessels = [p for p in gross if p['system'] in ('arteries', 'veins')]
names = {p['name']['en'] for p in vessels}


def swap(n):
    return SIDE_WORD.sub(lambda m: SWAP[m.group(1)], n)


def lone(p):
    n = p['name']['en']
    if p['side'] == 'midline' or UNPAIRED.search(n):
        return False
    if SIDE_WORD.search(n):
        return swap(n) not in names
    return not any(q['name']['en'] == n and q['side'] != p['side'] for q in vessels)


# ── Fit: mirror(right) → left, and mirror(left) → right ────────────────
MIR = np.diag([-1.0, 1.0, 1.0])
pairs = [(by_id[i], by_id['g-right-' + i[7:]]) for i in by_id if i.startswith('g-left-') and 'g-right-' + i[7:] in by_id]
L = np.array([a['centroid'] for a, _ in pairs])
R = np.array([b['centroid'] for _, b in pairs])


def fit(src, dst):
    """Affine A (4×4) with dst ≈ A · mirror(src), least squares."""
    X = np.c_[src @ MIR.T, np.ones(len(src))]
    sol, *_ = np.linalg.lstsq(X, dst, rcond=None)
    A = np.eye(4)
    A[:3, :3] = sol[:3].T
    A[:3, 3] = sol[3]
    M = np.eye(4)
    M[:3, :3] = MIR
    return A @ M


def rms(src, dst, T):
    p = (np.c_[src, np.ones(len(src))] @ T.T)[:, :3]
    return float(np.sqrt(((p - dst) ** 2).sum(1).mean()))


plain = np.diag([-1.0, 1.0, 1.0, 1.0])
TO = {'left': fit(R, L), 'right': fit(L, R)}  # key: side of the twin
print(f'{len(pairs)} bilateral pairs; centroid RMS — plain flip R→L {rms(R, L, plain):.2f} mm, fitted {rms(R, L, TO["left"]):.2f} mm;'
      f' L→R {rms(L, R, plain):.2f} → {rms(L, R, TO["right"]):.2f} mm')


# ── Cortex of each side, for the sinking check ──────────────────────────
def cortex(side):
    ms = [trimesh.load(MESH / p['mesh'], force='mesh') for p in gross if p['system'] == 'telencephalon' and p['side'] == side and 'mesh' in p]
    m = trimesh.util.concatenate(ms)
    return cKDTree(m.vertices), m.vertex_normals


CTX = {s: cortex(s) for s in ('left', 'right')}


def sunk(vertices, side, n=600):
    """Share of (sampled) vertices more than 1.5 mm under the side's cortical surface."""
    tree, normals = CTX[side]
    v = vertices[np.linspace(0, len(vertices) - 1, min(n, len(vertices))).astype(int)]
    d, i = tree.query(v)
    depth = ((v - tree.data[i]) * normals[i]).sum(1)
    return float((depth < -1.5).mean())


out, worse = [], []
for p in sorted(filter(lone, vessels), key=lambda p: p['name']['en']):
    side = 'left' if p['side'] == 'right' else 'right'
    m = trimesh.load(MESH / p['mesh'], force='mesh')
    before = sunk(m.vertices, p['side'])
    m.apply_transform(TO[side])  # trimesh flips the winding of a reflecting transform
    m.fix_normals()
    after = sunk(m.vertices, side)
    n = p['name']['en']
    twin = swap(n) if SIDE_WORD.search(n) else f'{side.capitalize()} {n[0].lower() + n[1:]}'
    gid = pathlib.Path(p['mesh']).stem + '-mirror'
    (MESH / 'gross' / f'{gid}.glb').write_bytes(m.export(file_type='glb', include_normals=True))
    lo, hi = m.bounds
    out.append(dict(id=gid, name=twin, of=p['id'], fma=p.get('ref'), side=side, faces=int(len(m.faces)),
                    bbox=[lo.round(2).tolist(), hi.round(2).tolist()], centroid=m.centroid.round(2).tolist(),
                    sunk=[round(before, 3), round(after, 3)]))
    if after - before > 0.15:
        worse.append((n, before, after))
    print(f'  {p["system"][:3]} → {side[0]}  sunk {before:4.0%} → {after:4.0%}  {twin}')

(ROOT / 'data/gross_mirrored.json').write_text(json.dumps(out, indent=1))
print(f'{len(out)} twins → data/gross_mirrored.json; sinking worse by >15 points: {len(worse)}')
for n, b, a in worse:
    print(f'  ! {n}: {b:.0%} → {a:.0%}')
