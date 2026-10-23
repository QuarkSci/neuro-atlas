"""Landmark points (MNI mm) on meshes — anchors for lesson labels and flow paths.

For each part id prints its extreme vertices (most anterior / posterior /
superior / inferior / lateral / medial) and centroid, and with --slabs the
mean vertex of 3 mm slabs along y (follows a C-shaped structure such as the
lateral ventricle, fornix or caudate). Copy the numbers into a lesson's
`labels[].at` or `flow.path` (src/data/lessons/*.ts).

Usage (repo root):
  pipeline/.venv/bin/python pipeline/tools/landmarks.py g-left-lateral-ventricle g-left-fornix-of-forebrain --slabs
"""
import json, sys
import numpy as np, trimesh

parts = {p['id']: p for p in json.load(open('src/data/parts.json'))['parts']}
ids = [a for a in sys.argv[1:] if not a.startswith('--')]
slabs = '--slabs' in sys.argv

for pid in ids:
    v = trimesh.load(f"public/meshes/{parts[pid]['mesh']}", force='mesh').vertices
    out = {}
    for name, axis, f in [('ant', 1, np.argmax), ('post', 1, np.argmin), ('sup', 2, np.argmax), ('inf', 2, np.argmin), ('lat', 0, np.argmin), ('med', 0, np.argmax)]:
        out[name] = v[f(v[:, axis])].round(1).tolist()
    out['centroid'] = v.mean(0).round(1).tolist()
    print(pid, json.dumps(out))
    if slabs:
        lo, hi = v[:, 1].min(), v[:, 1].max()
        row = []
        for y in np.linspace(lo + 1, hi - 1, 9):
            m = (v[:, 1] >= y - 1.5) & (v[:, 1] <= y + 1.5)
            if m.any():
                row.append((round(float(y)), v[m].mean(0).round(1).tolist()))
        print('  slabs y:', row)
