"""Merge the per-source catalogues into src/data/parts.json for the app.

Reads data/gross.json (BodyParts3D) and data/julich.json (Julich-Brain) and
assigns every mesh a system, a side, a concept (bilateral pair) and, for
Julich areas, a parent group (the nucleus / gyrus named in parentheses).
Duplicate BodyParts3D names on the same side keep the higher-resolution mesh;
same name on opposite sides (e.g. two "Pons" halves) become left/right.

Usage: python3 pipeline/build_catalogue.py
"""
import json, pathlib, re
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
G = json.load(open(ROOT / 'data/gross.json'))
J = json.load(open(ROOT / 'data/julich.json'))

GROSS_SYSTEM = [
    (r'ventricle|aqueduct|choroid plexus', 'ventricles'),
    (r'optic nerve', 'cranial-nerves'),
    (r'tentorium|falx|dura|arachnoid|pia', 'meninges'),
    (r'artery|arteries', 'arteries'),
    (r'vein|sinus', 'veins'),
    (r'cerebell', 'cerebellum'),
    (r'pons|medulla|colliculus|brachium|midbrain|peduncle', 'brainstem'),
    (r'thalam|pineal|pituitary|hypophysis|optic chiasm|optic tract|mammillary|stria medullaris|hypothalam', 'diencephalon'),
    (r'corpus callosum|fornix|internal capsule|commissure', 'white-matter'),
    (r'.', 'telencephalon'),
]
JULICH_SYSTEM = {
    'Thalamus': 'diencephalon', 'Metathalamus': 'diencephalon', 'Subthalamus': 'diencephalon',
    'Midbrain': 'brainstem', 'Cerebellum': 'cerebellum',
}

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def gross_system(name):
    for rx, sys_ in GROSS_SYSTEM:
        if re.search(rx, name, re.I):
            return sys_

def side_of(name, centroid):
    if re.match(r'^(Left|Right)\b', name):
        return name.split()[0].lower()
    x = centroid[0]
    return 'left' if x < -4 else 'right' if x > 4 else 'midline'

parts = []

# ── BodyParts3D ─────────────────────────────────────────────────────────
by_name = defaultdict(list)
for p in G:
    by_name[p['name']].append(p)
for name, group in by_name.items():
    # Two meshes with the same name: mirrored halves become left/right,
    # same-side duplicates keep the more detailed mesh.
    if len(group) > 1 and not re.match(r'^(Left|Right)\b', name):
        xs = sorted(group, key=lambda p: p['centroid'][0])
        if xs[0]['centroid'][0] < 0 < xs[-1]['centroid'][0] and xs[-1]['centroid'][0] - xs[0]['centroid'][0] > 3:
            for p in xs:
                p['_side'] = 'left' if p['centroid'][0] < 0 else 'right'
                p['_name'] = f"{p['_side'].capitalize()} {name[0].lower() + name[1:]}"
            keep = xs
        else:
            keep = [max(group, key=lambda p: p['faces'])]
    else:
        keep = [max(group, key=lambda p: p['faces'])]
    for p in keep:
        n = p.get('_name', name)
        side = p.get('_side') or side_of(n, p['centroid'])
        base = re.sub(r'^(Left|Right) ', '', n)
        parts.append(dict(
            id=f"g-{slug(n)}", name={'en': n}, system=gross_system(n), layer='gross', side=side,
            concept=slug(base), mesh=f"gross/{p['id']}.glb", centroid=p['centroid'], bbox=p['bbox'],
            faces=p['faces'], ref=p['fma'],
        ))

# ── Julich-Brain ────────────────────────────────────────────────────────
groups = {}
for p in J:
    m = re.match(r'^(.*?) \((.*)\) (left|right)$', p['name'])
    if not m:
        print('?? unparsed', p['name']); continue
    area, paren, hemi = m.groups()
    head = paren.split(',')[0].strip()          # "Thalamus", "PostCG", "Amygdala"…
    sys_ = JULICH_SYSTEM.get(head, 'telencephalon')
    gid = f"j-{slug(head)}-{hemi}"
    if gid not in groups:
        groups[gid] = dict(id=gid, name={'en': f"{head} — {hemi} (Julich-Brain)"}, system=sys_, layer='julich',
                           side=hemi, group=True, concept=f"j-{slug(head)}")
    parts.append(dict(
        id=f"j-{slug(area)}-{hemi}", name={'en': f"{hemi.capitalize()} {area} ({paren})"}, system=sys_, layer='julich', side=hemi,
        parent=gid, concept=f"j-{slug(area)}", mesh=f"julich/{p['id']}.glb", centroid=p['centroid'],
        bbox=p['bbox'], faces=p['faces'], ref=str(p['label']),
    ))
parts = list(groups.values()) + parts

# ── Overall bounds ──────────────────────────────────────────────────────
lo = [min(p['bbox'][0][i] for p in parts if 'bbox' in p) for i in range(3)]
hi = [max(p['bbox'][1][i] for p in parts if 'bbox' in p) for i in range(3)]

out = ROOT / 'src/data/parts.json'
out.write_text(json.dumps(dict(bbox=[lo, hi], parts=parts), ensure_ascii=False, separators=(',', ':')))
from collections import Counter
print(len(parts), 'parts ->', out, f'({out.stat().st_size // 1024} KB)')
print(Counter(p['system'] for p in parts))
print(Counter(p['layer'] for p in parts))
