"""Reference slices of the real atlas meshes, for drawing schematics to scale.

Cuts every gross and Julich mesh at the given planes and writes an HTML page
of SVGs in MNI millimetres (10 mm grid, labels at polygon centroids). Draw a
new cross-section plate over these numbers (see src/data/sections/basal.ts,
`kit({k, top, y0})`), so the schematic matches the "Atlas (MNI)" view.

Coronal: viewed from the front, patient's right on screen left, dorsal up.
Axial:   viewed from below (radiological), anterior up.

Usage (repo root):
  pipeline/.venv/bin/python pipeline/tools/slice_svg.py out.html "y=14,y=-6,z=4"
then screenshot it, e.g. with headless Chrome / puppeteer.
"""
import json, sys, colorsys
import numpy as np, trimesh

parts = json.load(open('src/data/parts.json'))['parts']
SKIP = {'arteries', 'veins', 'skull', 'meninges', 'cranial-nerves'}


def slice_level(axis, mm, layer, xr=(-45, 45)):
    n = [0, 1, 0] if axis == 'y' else [0, 0, 1]
    o = [0, mm, 0] if axis == 'y' else [0, 0, mm]
    k = 1 if axis == 'y' else 2
    out = []
    for p in parts:
        if p['layer'] != layer or p.get('group') or p['system'] in SKIP or 'mesh' not in p:
            continue
        lo, hi = p['bbox']
        if not (lo[k] < mm < hi[k]) or hi[0] < xr[0] or lo[0] > xr[1]:
            continue
        m = trimesh.load(f"public/meshes/{p['mesh']}", force='mesh')
        sec = m.section(plane_origin=o, plane_normal=n)
        if sec is None:
            continue
        loops = [[(-q[0], -q[2]) if axis == 'y' else (-q[0], -q[1]) for q in d] for d in sec.discrete]
        out.append((p['id'], loops))
    return out


def svg(title, items, box):
    x0, y0, x1, y1 = box
    s = 8
    g = [f'<div style="display:inline-block"><h3>{title}</h3><svg width="{(x1 - x0) * s}" height="{(y1 - y0) * s}" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}" style="background:#111">']
    for i, (pid, loops) in enumerate(items):
        r, gg, b = colorsys.hsv_to_rgb((i * 0.618) % 1, 0.55, 0.95)
        col = f'rgb({int(r * 255)},{int(gg * 255)},{int(b * 255)})'
        for L in loops:
            d = 'M' + ' L'.join(f'{a:.1f},{c:.1f}' for a, c in L) + 'Z'
            g.append(f'<path d="{d}" fill="{col}" fill-opacity="0.25" stroke="{col}" stroke-width="0.2"/>')
        pts = np.array([q for L in loops for q in L])
        if len(pts):
            cx, cy = pts.mean(0)
            short = pid.replace('g-left-', 'L.').replace('g-right-', 'R.').replace('g-', '').replace('j-', 'J.')
            g.append(f'<text x="{cx:.1f}" y="{cy:.1f}" font-size="1.4" fill="#fff" text-anchor="middle">{short}</text>')
    for gx in range(int(x0) // 10 * 10, int(x1) + 1, 10):
        g.append(f'<line x1="{gx}" y1="{y0}" x2="{gx}" y2="{y1}" stroke="#333" stroke-width="0.1"/><text x="{gx}" y="{y1 - 0.5}" font-size="1.2" fill="#666">{-gx}</text>')
    for gy in range(int(y0) // 10 * 10, int(y1) + 1, 10):
        g.append(f'<line x1="{x0}" y1="{gy}" x2="{x1}" y2="{gy}" stroke="#333" stroke-width="0.1"/><text x="{x0 + 0.3}" y="{gy}" font-size="1.2" fill="#666">{-gy}</text>')
    g.append('</svg></div>')
    return '\n'.join(g)


levels = [(a, float(v)) for a, v in (x.split('=') for x in sys.argv[2].split(','))]
html = ['<html><body style="background:#000;color:#ccc;font:12px sans-serif">']
for axis, mm in levels:
    box = (-45, -30, 45, 30) if axis == 'y' else (-45, -45, 45, 40)
    for layer in ['gross', 'julich']:
        html.append(svg(f'{axis}={mm} {layer}', slice_level(axis, mm, layer), box))
html.append('</body></html>')
open(sys.argv[1], 'w').write('\n'.join(html))
