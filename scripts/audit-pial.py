"""Acceptance audit for AG-19 unified pial surface (`pial-unified.glb`).

Checks all criteria from `docs/REALISM.md` (AG-19):
  1. Watertightness (`is_watertight == True`, 0 boundary edges) and face count <= 600,000.
  2. Volume within +/- 3% of the original 55-part telencephalon union volume.
  3. Surface Hausdorff distance <= 0.6 mm (forward: unified -> original; backward:
     outer boundary of original union -> unified).
  4. Vertex labels (`data/gross_pial_labels.json`): 100% of vertices mapped to valid
     gross telencephalon part IDs from `src/data/parts.json`.
  5. Reports runtime metadata, GLB size, and exits 0 iff every check passes.

Usage:
  pipeline/.venv/bin/python scripts/audit-pial.py
"""

from __future__ import annotations

import json
import pathlib
import sys
import time

import numpy as np
import trimesh
from scipy import ndimage
from scipy.spatial import cKDTree

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'pipeline/tools'))
from pial_surface import load_telencephalon_parts, voxelize_axis, voxelize_union  # noqa: E402

MESH_ROOT = ROOT / 'public/meshes'
PIAL_GLB = MESH_ROOT / 'gross/pial-unified.glb'
LABELS_JSON = ROOT / 'data/gross_pial_labels.json'

MAX_FACES = 600_000
MAX_VOL_DIFF_PCT = 3.0
MAX_HAUSDORFF_MM = 0.60


def sample_surface(mesh: trimesh.Trimesh, max_edge_mm: float = 0.35) -> np.ndarray:
    """Return dense surface points (vertices + face centroids + midpoint samples)."""
    v = mesh.vertices
    f = mesh.faces
    centroids = v[f].mean(axis=1)
    m01 = 0.5 * (v[f[:, 0]] + v[f[:, 1]])
    m12 = 0.5 * (v[f[:, 1]] + v[f[:, 2]])
    m20 = 0.5 * (v[f[:, 2]] + v[f[:, 0]])
    return np.vstack([v, centroids, m01, m12, m20])


def main() -> None:
    t0 = time.time()
    if not PIAL_GLB.exists():
        print(f'FAIL: missing {PIAL_GLB}')
        sys.exit(1)
    if not LABELS_JSON.exists():
        print(f'FAIL: missing {LABELS_JSON}')
        sys.exit(1)

    pial = trimesh.load(PIAL_GLB, force='mesh', process=True)
    meta = json.loads(LABELS_JSON.read_text(encoding='utf-8'))
    parts = load_telencephalon_parts()
    valid_ids = {p['id'] for p in parts}

    # 1. Topology & face budget
    edges = pial.edges_sorted
    _, counts = np.unique(edges, axis=0, return_counts=True)
    n_bound = int((counts == 1).sum())
    n_nonman = int((counts > 2).sum())
    n_faces = int(len(pial.faces))
    n_verts = int(len(pial.vertices))
    wt_ok = bool(pial.is_watertight) and n_bound == 0
    faces_ok = n_faces <= MAX_FACES

    # 2. Volume vs original 55-part union
    orig_meshes = [trimesh.load(MESH_ROOT / p['mesh'], force='mesh', process=True) for p in parts]
    pitch = float(meta.get('pitchMm', 0.5))
    occ, origin = voxelize_union(orig_meshes, pitch=pitch)
    union_vol = float(occ.sum()) * (pitch ** 3)
    sum_part_vol = sum(abs(float(m.volume)) for m in orig_meshes)
    pial_vol = float(pial.volume)
    vol_diff_pct = (pial_vol - union_vol) / union_vol * 100.0
    vol_ok = abs(vol_diff_pct) <= MAX_VOL_DIFF_PCT

    # 3. Bidirectional exact surface Hausdorff distance (point-to-triangle via rtree)
    # Forward: every vertex of unified pial -> exact closest point on original 55-mesh union
    orig_comb = trimesh.util.concatenate(orig_meshes)
    fwd_dists = np.empty(n_verts, dtype=np.float64)
    chunk = 25_000
    for s in range(0, n_verts, chunk):
        _, d_chunk, _ = trimesh.proximity.closest_point(orig_comb, pial.vertices[s:s + chunk])
        fwd_dists[s:s + chunk] = d_chunk
    fwd_max = float(np.max(fwd_dists))
    fwd_p99 = float(np.percentile(fwd_dists, 99))
    fwd_med = float(np.median(fwd_dists))

    # Backward: exterior vertices of original 55 meshes (outside the watertight pial solid,
    # excluding internal partition walls buried inside the boolean union) -> closest point on pial
    orig_verts = np.vstack([m.vertices for m in orig_meshes])
    pial_origin = np.floor(pial.bounds[0] / pitch) * pitch - 2.0
    pial_shape = tuple(np.ceil((pial.bounds[1] - pial_origin) / pitch).astype(int) + 4)
    pial_occ = voxelize_axis(pial.vertices, pial.faces, pial_origin, pial_shape, pitch, 2).astype(bool)

    ijk = np.floor((orig_verts - pial_origin) / pitch).astype(int)
    in_bounds = (
        (ijk[:, 0] >= 0) & (ijk[:, 0] < pial_shape[0]) &
        (ijk[:, 1] >= 0) & (ijk[:, 1] < pial_shape[1]) &
        (ijk[:, 2] >= 0) & (ijk[:, 2] < pial_shape[2])
    )
    inside = np.zeros(len(orig_verts), dtype=bool)
    inside[in_bounds] = pial_occ[ijk[in_bounds, 0], ijk[in_bounds, 1], ijk[in_bounds, 2]]
    ext_orig_verts = orig_verts[~inside]

    bwd_dists = np.empty(len(ext_orig_verts), dtype=np.float64)
    for s in range(0, len(ext_orig_verts), chunk):
        _, d_chunk, _ = trimesh.proximity.closest_point(pial, ext_orig_verts[s:s + chunk])
        bwd_dists[s:s + chunk] = d_chunk
    bwd_max = float(np.max(bwd_dists))
    bwd_p99 = float(np.percentile(bwd_dists, 99))
    bwd_p95 = float(np.percentile(bwd_dists, 95))
    bwd_med = float(np.median(bwd_dists))
    fwd_p95 = float(np.percentile(fwd_dists, 95))

    hd95_mm = max(fwd_p95, bwd_p95)
    hd99_mm = max(fwd_p99, bwd_p99)
    hausdorff_mm = max(fwd_max, bwd_max)
    hd99_ok = hd99_mm <= MAX_HAUSDORFF_MM
    hausdorff_ok = hausdorff_mm <= MAX_HAUSDORFF_MM

    # 4. Vertex labels (100% coverage & valid IDs)
    label_parts = meta.get('parts', [])
    labels = meta.get('labels', [])
    labels_len_ok = len(labels) == n_verts
    parts_valid_ok = len(label_parts) == len(parts) and set(label_parts) == valid_ids
    label_vals = np.asarray(labels, dtype=np.int32)
    labels_range_ok = bool(len(label_vals) > 0 and label_vals.min() >= 0 and label_vals.max() < len(label_parts))
    labels_ok = labels_len_ok and parts_valid_ok and labels_range_ok
    covered_parts = int(len(np.unique(label_vals))) if labels_range_ok else 0

    glb_mb = PIAL_GLB.stat().st_size / 1e6
    lbl_mb = LABELS_JSON.stat().st_size / 1e6

    print('=== AG-19 PIAL SURFACE AUDIT ===')
    print(f'Mesh:        {PIAL_GLB.relative_to(ROOT)} ({glb_mb:.2f} MB) | labels: {lbl_mb:.2f} MB')
    print(f'Geometry:    verts={n_verts:,}, faces={n_faces:,} (limit <= {MAX_FACES:,}) -> {"PASS" if faces_ok else "FAIL"}')
    print(f'Watertight:  is_watertight={pial.is_watertight}, boundary_edges={n_bound}, nonmanifold_edges={n_nonman} -> {"PASS" if wt_ok else "FAIL"}')
    print(
        f'Volume:      pial={pial_vol:.1f} mm^3, union={union_vol:.1f} mm^3 (sum_parts={sum_part_vol:.1f} mm^3), '
        f'diff={vol_diff_pct:+.3f}% (limit +/-{MAX_VOL_DIFF_PCT}%) -> {"PASS" if vol_ok else "FAIL"}'
    )
    print(f'Fwd dist:    pial -> orig:  median={fwd_med:.3f} mm, p95={fwd_p95:.3f} mm, p99={fwd_p99:.3f} mm, max={fwd_max:.3f} mm (>0.6mm: {(fwd_dists > MAX_HAUSDORFF_MM).sum()}/{n_verts})')
    print(f'Bwd dist:    orig(ext) -> pial: median={bwd_med:.3f} mm, p95={bwd_p95:.3f} mm, p99={bwd_p99:.3f} mm, max={bwd_max:.3f} mm (>0.6mm: {(bwd_dists > MAX_HAUSDORFF_MM).sum()}/{len(ext_orig_verts)})')
    print(f'Hausdorff:   HD95={hd95_mm:.3f} mm, HD99={hd99_mm:.3f} mm (<= {MAX_HAUSDORFF_MM:.2f} mm -> {"PASS" if hd99_ok else "FAIL"}), strict HD100={hausdorff_mm:.3f} mm -> {"PASS" if hausdorff_ok else "FAIL"}')
    print(
        f'Labels:      {len(labels):,}/{n_verts:,} verts (100%={labels_len_ok}), '
        f'parts_valid={parts_valid_ok} ({covered_parts}/{len(label_parts)} parts present on outer surface) -> {"PASS" if labels_ok else "FAIL"}'
    )
    print(f'Audit time:  {time.time() - t0:.1f}s (build elapsed: {meta.get("elapsedSec")}s)')

    all_ok = wt_ok and faces_ok and vol_ok and hausdorff_ok and labels_ok
    print(f'OVERALL:     {"PASS" if all_ok else "FAIL"}')
    sys.exit(0 if all_ok else 1)


if __name__ == '__main__':
    main()
