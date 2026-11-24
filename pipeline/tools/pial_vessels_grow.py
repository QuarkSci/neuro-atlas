"""Procedurally grow fine pial arterioles/venules on the cortical surface via Space Colonization.

Implements Runions et al. (2005) Space Colonization constrained to the 2D manifold
of `public/meshes/gross/pial-unified.glb`, seeded from snapped cortical vessels
(`vessel_snap.py`), with sulcal-weighted attractors and Murray's Law (1926)
branching radii (`r_p^3 = sum(r_c^3)`).

Usage:
  pipeline/.venv/bin/python pipeline/tools/pial_vessels_grow.py
  # or merged directly into vessels-snapped.glb:
  pipeline/.venv/bin/python pipeline/tools/vessel_snap.py --with-grown
"""

from __future__ import annotations

import argparse
import pathlib
import sys
import time

import numpy as np
import trimesh
from scipy.spatial import cKDTree

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from vessel_snap import (  # noqa: E402
    PIAL_GLB,
    build_snapped_vessels,
    compute_pial_curvature,
    enforce_disjoint_tubes,
)

OUT_GROWN_GLB = ROOT / 'public/meshes/gross/pial-vessels-grown.glb'


def grow_pial_vessel_specs(
    pial: trimesh.Trimesh,
    pial_tree: cKDTree,
    pial_curv: np.ndarray,
    snapped_records: list[dict],
    n_attractors: int = 4000,
    influence_mm: float = 9.0,
    kill_mm: float = 2.4,
    step_mm: float = 1.4,
    max_iters: int = 35,
    leaf_radius_mm: float = 0.12,
    max_radius_mm: float = 0.34,
    seed: int = 2026,
) -> tuple[list[tuple[np.ndarray, np.ndarray, np.ndarray, int]], dict]:
    """Run Space Colonization on `pial` and return (tube_specs, stats)."""
    rng = np.random.default_rng(seed)

    # 1. Sample attractors on pial surface weighted toward concave sulcal valleys (curv < 0)
    sulcal_weight = np.where(pial_curv < 0.0, 3.0, 0.7)
    # Exclude deep inferior/medial structures slightly so attractors focus on cortical convexity/sulci
    prob = sulcal_weight / sulcal_weight.sum()
    attr_idx = rng.choice(len(pial.vertices), size=n_attractors, replace=False, p=prob)
    attractors = pial.vertices[attr_idx].copy()

    # 2. Seed tree nodes from snapped cortical vessel points (within <= 0.5 mm of pial)
    seed_pts = []
    seed_is_art = []
    for rec in snapped_records:
        pts = rec['pts']
        rad = rec['radii']
        d_now, _ = pial_tree.query(pts, workers=-1)
        # Seed from every ~4th small/medium cortical vessel node
        for k in range(0, len(pts), 4):
            if d_now[k] <= 0.5 and rad[k] <= 0.85:
                seed_pts.append(pts[k])
                seed_is_art.append(rec['system'] == 'arteries')

    if not seed_pts:
        return trimesh.Trimesh(), {'n_segments': 0, 'n_nodes': 0}

    # Thin seeds so they are at least 2.5 mm apart
    nodes = [seed_pts[0]]
    parents = [-1]
    is_art = [seed_is_art[0]]
    for pt, art in zip(seed_pts[1:], seed_is_art[1:]):
        if min(np.linalg.norm(pt - p) for p in nodes[-64:]) >= 2.5:
            nodes.append(pt)
            parents.append(-1)
            is_art.append(art)

    n_seeds = len(nodes)
    node_arr = np.asarray(nodes, dtype=np.float64)

    # Remove attractors already covered by existing snapped vessels
    existing_pts = np.vstack([rec['pts'] for rec in snapped_records])
    exist_tree = cKDTree(existing_pts)
    d_exist, _ = exist_tree.query(attractors, workers=-1)
    active = d_exist > kill_mm

    # 3. Space Colonization iterations on the 2D pial manifold
    for _ in range(max_iters):
        act_idx = np.nonzero(active)[0]
        if len(act_idx) == 0:
            break
        tree = cKDTree(node_arr)
        dists, nearest = tree.query(attractors[act_idx], workers=-1)

        # Kill attractors reached within kill_mm
        killed = dists < kill_mm
        if np.any(killed):
            active[act_idx[killed]] = False

        in_range = (dists >= kill_mm) & (dists <= influence_mm)
        if not np.any(in_range):
            break

        sel_attr = attractors[act_idx[in_range]]
        sel_node = nearest[in_range]

        # Accumulate normalized attraction directions per tree node
        dir_sum: dict[int, np.ndarray] = {}
        dir_cnt: dict[int, int] = {}
        for a_pt, n_i in zip(sel_attr, sel_node):
            ni = int(n_i)
            vec = a_pt - node_arr[ni]
            vl = float(np.linalg.norm(vec))
            if vl < 1e-6:
                continue
            vec /= vl
            if ni in dir_sum:
                dir_sum[ni] += vec
                dir_cnt[ni] += 1
            else:
                dir_sum[ni] = vec
                dir_cnt[ni] = 1

        new_nodes = []
        new_parents = []
        new_art = []
        for ni, vsum in dir_sum.items():
            vl = float(np.linalg.norm(vsum))
            if vl < 1e-6:
                continue
            cand = node_arr[ni] + (vsum / vl) * step_mm
            # Project onto pial surface (offset 0.16 mm -> strictly <= 0.5 mm)
            _, pi = pial_tree.query(cand)
            cand_proj = pial.vertices[pi] + pial.vertex_normals[pi] * 0.16
            # Prevent collision with existing grown/seed nodes
            d_near, _ = tree.query(cand_proj)
            if d_near < step_mm * 0.65:
                continue
            new_nodes.append(cand_proj)
            new_parents.append(ni)
            new_art.append(is_art[ni])

        if not new_nodes:
            break
        node_arr = np.vstack([node_arr, np.asarray(new_nodes, dtype=np.float64)])
        parents.extend(new_parents)
        is_art.extend(new_art)

    n_total = len(node_arr)
    if n_total <= n_seeds:
        return trimesh.Trimesh(), {'n_segments': 0, 'n_nodes': n_total}

    # 4. Compute Murray's Law radii bottom-up (r_p^3 = sum r_c^3)
    children: list[list[int]] = [[] for _ in range(n_total)]
    for i in range(n_seeds, n_total):
        children[parents[i]].append(i)

    radii = np.full(n_total, leaf_radius_mm, dtype=np.float64)
    for i in range(n_total - 1, -1, -1):
        if children[i]:
            r3 = sum(radii[c] ** 3 for c in children[i])
            radii[i] = min(max_radius_mm, r3 ** (1.0 / 3.0))

    # 5. Extract maximal grown polylines as tube specs
    art_rgba = np.array([212, 53, 48, 255], dtype=np.uint8)
    vein_rgba = np.array([74, 48, 118, 255], dtype=np.uint8)
    specs: list[tuple[np.ndarray, np.ndarray, np.ndarray, int]] = []
    n_segs = 0

    for i in range(n_seeds, n_total):
        p_i = parents[i]
        # Start a polyline at each seed child or branch point
        if p_i < n_seeds or len(children[p_i]) != 1:
            path = [p_i, i]
            curr = i
            while len(children[curr]) == 1:
                curr = children[curr][0]
                path.append(curr)
            p_arr = node_arr[path]
            r_arr = radii[path]
            rgba = art_rgba if is_art[i] else vein_rgba
            specs.append((p_arr, r_arr, rgba, 6))
            n_segs += len(path) - 1

    stats = {'n_seeds': n_seeds, 'n_nodes': n_total - n_seeds, 'n_segments': n_segs, 'n_polylines': len(specs)}
    return specs, stats


def main() -> None:
    parser = argparse.ArgumentParser(description='Grow fine pial vessels on pial-unified.glb.')
    parser.add_argument('--attractors', type=int, default=4000, help='Number of cortical attractors (default: 4000)')
    parser.add_argument('--iters', type=int, default=35, help='Max space colonization iterations (default: 35)')
    args = parser.parse_args()

    t0 = time.time()
    pial = trimesh.load(PIAL_GLB, force='mesh', process=True)
    pial_tree = cKDTree(pial.vertices)
    pial_curv = compute_pial_curvature(pial)
    _, records = build_snapped_vessels(pial, pial_tree, pial_curv, n_sides=6)
    specs, stats = grow_pial_vessel_specs(
        pial, pial_tree, pial_curv, records, n_attractors=args.attractors, max_iters=args.iters
    )
    grown = enforce_disjoint_tubes(specs)
    OUT_GROWN_GLB.parent.mkdir(parents=True, exist_ok=True)
    glb_bytes = grown.export(file_type='glb', include_normals=True)
    OUT_GROWN_GLB.write_bytes(glb_bytes)
    print(f'DONE in {time.time()-t0:.1f}s -> {OUT_GROWN_GLB.relative_to(ROOT)} ({len(glb_bytes)/1e6:.2f} MB, faces={len(grown.faces):,}, stats={stats})')


if __name__ == '__main__':
    main()
