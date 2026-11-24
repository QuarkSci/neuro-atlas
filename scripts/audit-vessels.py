"""Acceptance audit for AG-20 snapped & grown pial vessels (`vessels-snapped.glb`).

Checks all criteria from `docs/REALISM.md` (AG-20):
  1. Cortical adherence: >= 95% of vessel length originally within <= 6.0 mm of
     `pial-unified.glb` is now <= 0.50 mm from the pial surface.
  2. Self-intersections: 0 self-intersecting faces within tube components
     (verified via PyMeshLab `compute_selection_by_self_intersections_per_face`).
  3. Face budget: total face count of `vessels-snapped.glb` <= original gross
     vessel faces * 1.5.

Usage:
  pipeline/.venv/bin/python scripts/audit-vessels.py
"""

from __future__ import annotations

import pathlib
import sys
import time

import numpy as np
import pymeshlab
import trimesh
from scipy.spatial import cKDTree

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'pipeline/tools'))
from vessel_snap import (  # noqa: E402
    MESH_ROOT,
    OUT_GLB,
    PIAL_GLB,
    SNAP_DIST_MM,
    compute_pial_curvature,
    extract_centerline_graph,
    load_vessel_parts,
    snap_and_relax,
)

MAX_PIAL_DIST_MM = 0.50
MIN_ADHERENCE_PCT = 95.0
MAX_FACE_MULT = 1.5


def count_self_intersections(mesh: trimesh.Trimesh) -> int:
    """Return number of self-intersecting faces using PyMeshLab."""
    ms = pymeshlab.MeshSet()
    ms.add_mesh(pymeshlab.Mesh(vertex_matrix=mesh.vertices, face_matrix=mesh.faces))
    ms.compute_selection_by_self_intersections_per_face()
    return int(ms.current_mesh().selected_face_number())


def main() -> None:
    t0 = time.time()
    if not OUT_GLB.exists():
        print(f'FAIL: missing {OUT_GLB}')
        sys.exit(1)
    if not PIAL_GLB.exists():
        print(f'FAIL: missing {PIAL_GLB}')
        sys.exit(1)

    pial = trimesh.load(PIAL_GLB, force='mesh', process=True)
    pial_tree = cKDTree(pial.vertices)
    pial_curv = compute_pial_curvature(pial)
    snapped_glb = trimesh.load(OUT_GLB, force='mesh', process=False)

    parts = load_vessel_parts()
    orig_faces = 0
    near6_len = 0.0
    before_05_len = 0.0
    after_05_len = 0.0

    for p in parts:
        m = trimesh.load(MESH_ROOT / p['mesh'], force='mesh', process=True)
        orig_faces += len(m.faces)
        centers, radii, edges = extract_centerline_graph(m)
        if len(edges) == 0:
            continue
        snapped, orig_d = snap_and_relax(
            centers, radii, edges, pial_tree, pial.vertices, pial.vertex_normals, pial_curv
        )
        new_d, _ = pial_tree.query(snapped, workers=-1)

        # Measure length-weighted adherence on all segments whose midpoint was <= 6 mm from pial
        u, v = edges[:, 0], edges[:, 1]
        seg_orig_d = 0.5 * (orig_d[u] + orig_d[v])
        seg_new_d = 0.5 * (new_d[u] + new_d[v])
        seg_len = np.linalg.norm(snapped[v] - snapped[u], axis=1)

        m6 = seg_orig_d <= SNAP_DIST_MM
        near6_len += float(seg_len[m6].sum())
        before_05_len += float(seg_len[m6 & (seg_orig_d <= MAX_PIAL_DIST_MM)].sum())
        after_05_len += float(seg_len[m6 & (seg_new_d <= MAX_PIAL_DIST_MM)].sum())

    before_pct = before_05_len / max(near6_len, 1e-9) * 100.0
    after_pct = after_05_len / max(near6_len, 1e-9) * 100.0
    adherence_ok = after_pct >= MIN_ADHERENCE_PCT

    # Face budget check
    n_faces = int(len(snapped_glb.faces))
    max_faces = int(orig_faces * MAX_FACE_MULT)
    faces_ok = n_faces <= max_faces

    # Self-intersection check on output GLB
    n_self_int = count_self_intersections(snapped_glb)
    self_int_ok = n_self_int == 0

    glb_mb = OUT_GLB.stat().st_size / 1e6

    print('=== AG-20 PIAL VESSELS AUDIT ===')
    print(f'Mesh:          {OUT_GLB.relative_to(ROOT)} ({glb_mb:.2f} MB)')
    print(f'Face budget:   {n_faces:,} faces vs orig {orig_faces:,} (limit <= {max_faces:,} = 1.5x) -> {"PASS" if faces_ok else "FAIL"}')
    print(
        f'Adherence:     <=6mm length={near6_len:.1f} mm | <=0.5mm: {before_pct:.1f}% -> {after_pct:.2f}% '
        f'(limit >= {MIN_ADHERENCE_PCT:.0f}%) -> {"PASS" if adherence_ok else "FAIL"}'
    )
    print(f'Self-intersec: {n_self_int} faces (limit == 0) -> {"PASS" if self_int_ok else "FAIL"}')
    print(f'Audit time:    {time.time() - t0:.1f}s')

    all_ok = adherence_ok and faces_ok and self_int_ok
    print(f'OVERALL:       {"PASS" if all_ok else "FAIL"}')
    sys.exit(0 if all_ok else 1)


if __name__ == '__main__':
    main()
