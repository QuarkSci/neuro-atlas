"""Extract centerlines/radii of gross vessels and snap cortical segments to pial-unified.glb.

Pipeline (AG-20 / A-4):
  1. Load all 246 `layer == "gross", system in ("arteries", "veins")` meshes and
     the unified watertight pial surface `public/meshes/gross/pial-unified.glb`.
  2. For each vessel mesh, extract a clean 1D centerline tree (nodes, edges, local
     cross-sectional radius) using spatial clustering + minimum spanning tree so
     fragmented BodyParts3D tube segments become continuous polylines.
  3. Compute per-vertex mean curvature on `pial-unified.glb` to detect sulci.
  4. Snap centerline nodes within <= 6.0 mm of the pial surface onto the cortex
     with sulcal sinking (deeper offset where curvature < 0), smooth transition
     for 6.0..8.5 mm (bridging veins / basal trunks), and iterative 1D elastic
     relaxation followed by surface re-projection.
  5. Reconstruct clean, non-self-intersecting tubular meshes (Parallel Transport
     frames, bend-curvature radius clamping, clearance trimming at junctions and
     between non-adjacent segments) and export `public/meshes/gross/vessels-snapped.glb`.

Usage:
  pipeline/.venv/bin/python pipeline/tools/vessel_snap.py
  pipeline/.venv/bin/python pipeline/tools/vessel_snap.py --with-grown
"""

from __future__ import annotations

import argparse
import json
import pathlib
import time
from collections import defaultdict

import numpy as np
import trimesh
from scipy import sparse
from scipy.sparse.csgraph import minimum_spanning_tree
from scipy.spatial import cKDTree

ROOT = pathlib.Path(__file__).resolve().parents[2]
PARTS_JSON = ROOT / 'src/data/parts.json'
MESH_ROOT = ROOT / 'public/meshes'
PIAL_GLB = MESH_ROOT / 'gross/pial-unified.glb'
OUT_GLB = MESH_ROOT / 'gross/vessels-snapped.glb'

SNAP_DIST_MM = 6.0
RAMP_END_MM = 8.5


def load_vessel_parts() -> list[dict]:
    """Return all gross artery and vein parts sorted by ID."""
    data = json.loads(PARTS_JSON.read_text(encoding='utf-8'))
    parts = [
        p for p in data['parts']
        if p.get('layer') == 'gross' and p.get('system') in ('arteries', 'veins')
    ]
    parts.sort(key=lambda p: p['id'])
    return parts


def compute_pial_curvature(pial: trimesh.Trimesh) -> np.ndarray:
    """Compute approximate signed mean curvature per vertex (>0 gyral crown, <0 sulcus)."""
    n = len(pial.vertices)
    f = pial.faces
    i = np.concatenate([f[:, 0], f[:, 1], f[:, 2]])
    j = np.concatenate([f[:, 1], f[:, 2], f[:, 0]])
    rows = np.concatenate([i, j])
    cols = np.concatenate([j, i])
    adj = sparse.coo_matrix((np.ones(len(rows), dtype=np.float64), (rows, cols)), shape=(n, n)).tocsr()
    adj.data[:] = 1.0
    deg = np.asarray(adj.sum(axis=1)).ravel()
    inv_deg = np.where(deg > 0, 1.0 / deg, 0.0)
    avg = (sparse.diags(inv_deg) @ adj) @ pial.vertices
    lap = pial.vertices - avg
    return np.einsum('ij,ij->i', lap, pial.vertex_normals)


def extract_centerline_graph(
    mesh: trimesh.Trimesh, cell_mm: float = 2.4, max_edge_mm: float = 5.5
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Extract (nodes [N,3], radii [N], edges [E,2]) from a tubular vessel mesh."""
    verts = mesh.vertices
    if len(verts) < 6:
        return np.empty((0, 3)), np.empty(0), np.empty((0, 2), dtype=np.int32)

    # Spatial voxel-grid clustering to collapse tube cross-sections to centerline nodes
    keys = np.floor(verts / cell_mm).astype(np.int64)
    uniq, inv = np.unique(keys, axis=0, return_inverse=True)
    n_c = len(uniq)
    if n_c < 2:
        c = verts.mean(axis=0, keepdims=True)
        r = np.array([float(np.clip(np.median(np.linalg.norm(verts - c, axis=1)), 0.18, 1.5))])
        return c, r, np.empty((0, 2), dtype=np.int32)

    counts = np.bincount(inv, minlength=n_c).astype(np.float64)
    centers = np.zeros((n_c, 3), dtype=np.float64)
    for ax in range(3):
        centers[:, ax] = np.bincount(inv, weights=verts[:, ax], minlength=n_c) / counts

    # Estimate local radius per cluster as median radial distance from cluster center
    dists = np.linalg.norm(verts - centers[inv], axis=1)
    radii = np.zeros(n_c, dtype=np.float64)
    for k in range(n_c):
        d_k = dists[inv == k]
        radii[k] = float(np.clip(np.median(d_k) * 0.72 if len(d_k) else 0.30, 0.18, 1.40))

    # Build sparse proximity graph & take Minimum Spanning Tree (cycle-free vessel tree)
    tree = cKDTree(centers)
    pairs = tree.query_pairs(r=max_edge_mm, output_type='ndarray')
    if len(pairs) == 0:
        return centers, radii, np.empty((0, 2), dtype=np.int32)

    seg_len = np.linalg.norm(centers[pairs[:, 0]] - centers[pairs[:, 1]], axis=1)
    g = sparse.csr_matrix((seg_len, (pairs[:, 0], pairs[:, 1])), shape=(n_c, n_c))
    mst = minimum_spanning_tree(g).tocoo()
    edges = np.column_stack([mst.row, mst.col]).astype(np.int32)

    # Prune 1-edge hairbrush twigs attached to degree >= 3 junctions
    adj: list[set[int]] = [set() for _ in range(n_c)]
    for u, v in edges:
        adj[int(u)].add(int(v))
        adj[int(v)].add(int(u))

    for _ in range(2):
        pruned = False
        for k in range(n_c):
            if len(adj[k]) == 1:
                nb = next(iter(adj[k]))
                if len(adj[nb]) >= 3 and np.linalg.norm(centers[k] - centers[nb]) < cell_mm * 1.4:
                    adj[k].remove(nb)
                    adj[nb].remove(k)
                    pruned = True
        if not pruned:
            break

    kept_edges = []
    for u in range(n_c):
        for v in adj[u]:
            if u < v:
                kept_edges.append([u, v])
    if not kept_edges:
        return centers, radii, np.empty((0, 2), dtype=np.int32)
    edges = np.asarray(kept_edges, dtype=np.int32)

    # Smooth degree-2 nodes gently to remove grid-clustering jitter
    for _ in range(3):
        new_c = centers.copy()
        new_r = radii.copy()
        for k in range(n_c):
            if len(adj[k]) == 2:
                a, b = list(adj[k])
                new_c[k] = 0.5 * centers[k] + 0.25 * (centers[a] + centers[b])
                new_r[k] = 0.5 * radii[k] + 0.25 * (radii[a] + radii[b])
        centers, radii = new_c, new_r

    return centers, radii, edges


def snap_and_relax(
    centers: np.ndarray,
    radii: np.ndarray,
    edges: np.ndarray,
    pial_tree: cKDTree,
    pial_verts: np.ndarray,
    pial_normals: np.ndarray,
    pial_curv: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    """Snap centerline nodes <= 6 mm from pial surface with sulcal sinking and relaxation.

    Returns (snapped_centers [N,3], orig_pial_dists [N]).
    """
    n = len(centers)
    if n == 0:
        return centers, np.empty(0)

    orig_dists, nn = pial_tree.query(centers, workers=-1)
    weights = np.zeros(n, dtype=np.float64)
    weights[orig_dists <= SNAP_DIST_MM] = 1.0
    ramp = (orig_dists > SNAP_DIST_MM) & (orig_dists < RAMP_END_MM)
    weights[ramp] = (RAMP_END_MM - orig_dists[ramp]) / (RAMP_END_MM - SNAP_DIST_MM)

    def target_on_pial(pts: np.ndarray, rad: np.ndarray) -> np.ndarray:
        _, idx = pial_tree.query(pts, workers=-1)
        q = pial_verts[idx]
        nrm = pial_normals[idx]
        curv = pial_curv[idx]
        # Sink slightly deeper into concave sulci (curv < 0), stay <= 0.35 mm on gyri
        sink = np.where(curv < 0.0, np.minimum(rad * 0.35, 0.20), np.minimum(rad * 0.55, 0.32))
        return q + nrm * sink[:, None]

    adj: list[list[int]] = [[] for _ in range(n)]
    for u, v in edges:
        adj[int(u)].append(int(v))
        adj[int(v)].append(int(u))

    pos = centers.copy()
    tgt = target_on_pial(pos, radii)
    pos = (1.0 - weights[:, None]) * centers + weights[:, None] * tgt

    # Iterative 1D elastic relaxation along vessel graph + re-projection onto pial
    for _ in range(6):
        relaxed = pos.copy()
        for k in range(n):
            nb = adj[k]
            if len(nb) >= 2:
                relaxed[k] = 0.55 * pos[k] + 0.45 * pos[nb].mean(axis=0)
        tgt = target_on_pial(relaxed, radii)
        pos = (1.0 - weights[:, None]) * centers + weights[:, None] * (0.35 * relaxed + 0.65 * tgt)

    # Final exact projection for all nodes originally within <= 6.0 mm
    snapped_mask = orig_dists <= SNAP_DIST_MM
    if np.any(snapped_mask):
        pos[snapped_mask] = target_on_pial(pos[snapped_mask], radii[snapped_mask])

    return pos, orig_dists


def split_into_polylines(n_nodes: int, edges: np.ndarray) -> list[list[int]]:
    """Decompose a 1D tree graph into maximal degree-2 polylines between leaves/junctions."""
    if len(edges) == 0:
        return []
    adj: list[list[int]] = [[] for _ in range(n_nodes)]
    for u, v in edges:
        adj[int(u)].append(int(v))
        adj[int(v)].append(int(u))

    visited_edges: set[tuple[int, int]] = set()
    polylines: list[list[int]] = []

    special = [k for k in range(n_nodes) if len(adj[k]) != 2 and len(adj[k]) > 0]
    for start in special:
        for nxt in adj[start]:
            ek = (min(start, nxt), max(start, nxt))
            if ek in visited_edges:
                continue
            path = [start, nxt]
            visited_edges.add(ek)
            prev, curr = start, nxt
            while len(adj[curr]) == 2:
                a, b = adj[curr]
                step = b if a == prev else a
                ek2 = (min(curr, step), max(curr, step))
                if ek2 in visited_edges:
                    break
                visited_edges.add(ek2)
                path.append(step)
                prev, curr = curr, step
            polylines.append(path)
    return polylines


def sweep_polyline_tube(
    pts: np.ndarray,
    radii: np.ndarray,
    n_sides: int = 8,
    trim_start: float = 0.0,
    trim_end: float = 0.0,
) -> tuple[np.ndarray, np.ndarray]:
    """Sweep a smooth, non-self-intersecting closed tube along a 3D polyline.

    Uses Parallel Transport (Bishop) frames and clamps local radius against local
    bend radius so inner bends never fold or self-intersect.
    """
    if len(pts) < 2:
        return np.empty((0, 3)), np.empty((0, 3), dtype=np.int64)

    # Remove consecutive duplicate points
    keep = [0]
    for i in range(1, len(pts)):
        if np.linalg.norm(pts[i] - pts[keep[-1]]) > 1e-4:
            keep.append(i)
    pts = pts[keep]
    radii = radii[keep]
    if len(pts) < 2:
        return np.empty((0, 3)), np.empty((0, 3), dtype=np.int64)

    # Optional endpoint trim (for clean junction clearance -> 0 self-intersections)
    seg_lens = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    total_len = float(seg_lens.sum())
    if total_len <= trim_start + trim_end + 0.15:
        return np.empty((0, 3)), np.empty((0, 3), dtype=np.int64)

    if trim_start > 0 or trim_end > 0:
        cum = np.concatenate([[0.0], np.cumsum(seg_lens)])
        s0, s1 = trim_start, total_len - trim_end
        mid_mask = (cum > s0 + 0.05) & (cum < s1 - 0.05)
        s_new = np.concatenate([[s0], cum[mid_mask], [s1]])
        new_pts = np.column_stack([np.interp(s_new, cum, pts[:, ax]) for ax in range(3)])
        new_rad = np.interp(s_new, cum, radii)
        pts, radii = new_pts, new_rad

    m = len(pts)
    # Compute unit tangents
    tangents = np.zeros((m, 3), dtype=np.float64)
    tangents[0] = pts[1] - pts[0]
    tangents[-1] = pts[-1] - pts[-2]
    if m > 2:
        tangents[1:-1] = pts[2:] - pts[:-2]
    t_norm = np.linalg.norm(tangents, axis=1, keepdims=True)
    tangents = np.where(t_norm > 1e-9, tangents / np.maximum(t_norm, 1e-9), np.array([0.0, 0.0, 1.0]))

    # Clamp local radius against bend curvature so inner bend cannot self-intersect
    r_clamped = radii.copy()
    for i in range(1, m - 1):
        d1 = pts[i] - pts[i - 1]
        d2 = pts[i + 1] - pts[i]
        l1 = float(np.linalg.norm(d1))
        l2 = float(np.linalg.norm(d2))
        if l1 > 1e-6 and l2 > 1e-6:
            cos_a = float(np.clip(np.dot(d1, d2) / (l1 * l2), -1.0, 1.0))
            sin_half = np.sqrt(max(0.0, 0.5 * (1.0 - cos_a)))
            if sin_half > 1e-3:
                max_r = 0.42 * min(l1, l2) / sin_half
                r_clamped[i] = min(r_clamped[i], max(0.08, max_r))

    # Parallel transport frame along polyline
    ref = np.array([1.0, 0.0, 0.0]) if abs(tangents[0, 0]) < 0.85 else np.array([0.0, 1.0, 0.0])
    nrm = np.cross(tangents[0], ref)
    nrm /= np.linalg.norm(nrm)
    binrm = np.cross(tangents[0], nrm)

    angles = np.linspace(0.0, 2.0 * np.pi, n_sides, endpoint=False)
    cos_t = np.cos(angles)[:, None]
    sin_t = np.sin(angles)[:, None]

    rings = np.zeros((m, n_sides, 3), dtype=np.float64)
    rings[0] = pts[0] + r_clamped[0] * (cos_t * nrm + sin_t * binrm)

    for i in range(1, m):
        t_prev, t_cur = tangents[i - 1], tangents[i]
        axis = np.cross(t_prev, t_cur)
        sin_a = float(np.linalg.norm(axis))
        if sin_a > 1e-7:
            axis /= sin_a
            cos_a = float(np.clip(np.dot(t_prev, t_cur), -1.0, 1.0))
            # Rodrigues rotation of nrm around axis
            nrm = nrm * cos_a + np.cross(axis, nrm) * sin_a + axis * np.dot(axis, nrm) * (1.0 - cos_a)
        nrm = nrm - np.dot(nrm, t_cur) * t_cur
        n_len = float(np.linalg.norm(nrm))
        if n_len > 1e-9:
            nrm /= n_len
        binrm = np.cross(t_cur, nrm)
        rings[i] = pts[i] + r_clamped[i] * (cos_t * nrm + sin_t * binrm)

    # Assemble vertices: rings + 2 cap centers
    verts = np.vstack([rings.reshape(-1, 3), pts[0:1], pts[-1:]])
    c_start = m * n_sides
    c_end = m * n_sides + 1

    faces = []
    for i in range(m - 1):
        b0 = i * n_sides
        b1 = (i + 1) * n_sides
        for s in range(n_sides):
            sn = (s + 1) % n_sides
            faces.append([b0 + s, b1 + s, b1 + sn])
            faces.append([b0 + s, b1 + sn, b0 + sn])

    # End caps
    b_last = (m - 1) * n_sides
    for s in range(n_sides):
        sn = (s + 1) % n_sides
        faces.append([c_start, sn, s])
        faces.append([c_end, b_last + s, b_last + sn])

    return verts, np.asarray(faces, dtype=np.int64)


def enforce_disjoint_tubes(
    tube_specs: list[tuple[np.ndarray, np.ndarray, np.ndarray, int]],
) -> trimesh.Trimesh:
    """Sweep all polylines with collision-free radii and drop any self-intersecting pieces.

    Each spec is (pts, radii, rgba, n_sides). Uses a global spatial KD-tree over
    dense polyline samples to clamp radii strictly below half the clearance to any
    non-adjacent tube, then verifies zero self-intersections with PyMeshLab and
    prunes any residual intersecting triangles.
    """
    import pymeshlab

    # 1. Resample dense reference points across all tubes for clearance clamping
    ref_pts = []
    ref_tid = []
    ref_s = []
    for tid, (pts, _, _, _) in enumerate(tube_specs):
        if len(pts) < 2:
            continue
        seg_l = np.linalg.norm(np.diff(pts, axis=0), axis=1)
        cum = np.concatenate([[0.0], np.cumsum(seg_l)])
        total = float(cum[-1])
        if total < 0.2:
            continue
        n_samp = max(2, int(np.ceil(total / 0.8)) + 1)
        s_grid = np.linspace(0.0, total, n_samp)
        sp = np.column_stack([np.interp(s_grid, cum, pts[:, ax]) for ax in range(3)])
        ref_pts.append(sp)
        ref_tid.append(np.full(n_samp, tid, dtype=np.int32))
        ref_s.append(s_grid)

    if not ref_pts:
        return trimesh.Trimesh()

    all_ref = np.vstack(ref_pts)
    all_tid = np.concatenate(ref_tid)
    all_s = np.concatenate(ref_s)
    tree = cKDTree(all_ref)

    meshes: list[trimesh.Trimesh] = []
    for tid, (pts, radii, rgba, n_sides) in enumerate(tube_specs):
        if len(pts) < 2:
            continue
        seg_l = np.linalg.norm(np.diff(pts, axis=0), axis=1)
        cum = np.concatenate([[0.0], np.cumsum(seg_l)])
        if cum[-1] < 0.35:
            continue

        # Clamp each node's radius against nearest non-adjacent tube sample
        dists, idxs = tree.query(pts, k=min(16, len(all_ref)), workers=-1)
        r_safe = radii.copy()
        for i in range(len(pts)):
            min_clr = 1e9
            for d_val, j in zip(dists[i], idxs[i]):
                if all_tid[j] != tid or abs(all_s[j] - cum[i]) > max(2.2, 3.0 * radii[i]):
                    if d_val < min_clr:
                        min_clr = float(d_val)
            if min_clr < 1e8:
                r_safe[i] = min(r_safe[i], max(0.05, 0.38 * min_clr))

        # Trim ends slightly if very close to another tube (junction clearance)
        t0 = float(r_safe[0] * 1.35) if dists[0, 1] < radii[0] * 2.5 else 0.0
        t1 = float(r_safe[-1] * 1.35) if dists[-1, 1] < radii[-1] * 2.5 else 0.0
        tv, tf = sweep_polyline_tube(pts, r_safe, n_sides=n_sides, trim_start=t0, trim_end=t1)
        if len(tf) == 0:
            continue
        tm = trimesh.Trimesh(vertices=tv, faces=tf, process=False)
        tm.visual.vertex_colors = np.tile(rgba, (len(tv), 1))
        meshes.append(tm)

    if not meshes:
        return trimesh.Trimesh()

    combined = trimesh.util.concatenate(meshes)

    # 2. Final safety pass at GLB float32 precision: iteratively remove any self-intersecting faces
    ms = pymeshlab.MeshSet()
    ms.add_mesh(pymeshlab.Mesh(
        vertex_matrix=combined.vertices.astype(np.float32).astype(np.float64),
        face_matrix=combined.faces,
        v_color_matrix=combined.visual.vertex_colors.astype(np.float64) / 255.0,
    ))
    n_bad_total = 0
    for _ in range(3):
        ms.compute_selection_by_self_intersections_per_face()
        n_bad = int(ms.current_mesh().selected_face_number())
        if n_bad == 0:
            break
        n_bad_total += n_bad
        ms.meshing_remove_selected_faces()
        ms.meshing_remove_unreferenced_vertices()
    out = ms.current_mesh()
    res = trimesh.Trimesh(
        vertices=np.asarray(out.vertex_matrix(), dtype=np.float32).astype(np.float64),
        faces=np.asarray(out.face_matrix(), dtype=np.int64),
        process=False,
    )
    if out.has_vertex_color():
        vc = np.clip(np.asarray(out.vertex_color_matrix()) * 255.0, 0, 255).astype(np.uint8)
        res.visual.vertex_colors = vc
    print(f'  Disjoint tube pass: pruned {n_bad_total} residual intersecting faces -> {len(res.faces):,} clean faces')
    return res


def build_snapped_vessels(
    pial: trimesh.Trimesh,
    pial_tree: cKDTree,
    pial_curv: np.ndarray,
    n_sides: int = 6,
) -> tuple[list[tuple[np.ndarray, np.ndarray, np.ndarray, int]], list[dict]]:
    """Process all 246 gross vessel meshes and return (tube_specs, branch_records)."""
    parts = load_vessel_parts()
    tube_specs: list[tuple[np.ndarray, np.ndarray, np.ndarray, int]] = []
    records: list[dict] = []

    orig_faces_total = 0
    for idx, p in enumerate(parts):
        m = trimesh.load(MESH_ROOT / p['mesh'], force='mesh', process=True)
        orig_faces_total += len(m.faces)
        centers, radii, edges = extract_centerline_graph(m)
        if len(edges) == 0:
            continue

        snapped, orig_d = snap_and_relax(
            centers, radii, edges, pial_tree, pial.vertices, pial.vertex_normals, pial_curv
        )
        polylines = split_into_polylines(len(snapped), edges)

        is_artery = p['system'] == 'arteries'
        rgba = np.array([196, 42, 46, 255], dtype=np.uint8) if is_artery else np.array([62, 42, 108, 255], dtype=np.uint8)

        for poly in polylines:
            p_arr = snapped[poly]
            r_arr = radii[poly]
            d_arr = orig_d[poly]
            tube_specs.append((p_arr, r_arr, rgba, n_sides))
            records.append({
                'part': p['id'],
                'system': p['system'],
                'pts': p_arr,
                'radii': r_arr,
                'orig_dists': d_arr,
            })

        if (idx + 1) % 60 == 0 or idx + 1 == len(parts):
            print(f'  snapped {idx + 1}/{len(parts)} vessel meshes ...')

    print(f'  Original gross vessels: {orig_faces_total:,} faces -> {len(records)} clean polylines')
    return tube_specs, records


def main() -> None:
    parser = argparse.ArgumentParser(description='Snap gross cerebral vessels to unified pial surface.')
    parser.add_argument('--sides', type=int, default=6, help='Tube radial segments (default: 6)')
    parser.add_argument('--with-grown', action='store_true', help='Also run pial_vessels_grow.py and merge grown pial arterioles')
    args = parser.parse_args()

    t0 = time.time()
    pial = trimesh.load(PIAL_GLB, force='mesh', process=True)
    pial_tree = cKDTree(pial.vertices)
    pial_curv = compute_pial_curvature(pial)
    print(f'Loaded {PIAL_GLB.name}: {len(pial.vertices):,} verts, {len(pial.faces):,} faces [{time.time()-t0:.1f}s]')

    tube_specs, records = build_snapped_vessels(pial, pial_tree, pial_curv, n_sides=args.sides)

    if args.with_grown:
        from pial_vessels_grow import grow_pial_vessel_specs
        grown_specs, grown_stats = grow_pial_vessel_specs(pial, pial_tree, pial_curv, records)
        print(f'Added grown pial vessels: +{len(grown_specs)} polylines ({grown_stats["n_segments"]} segments)')
        tube_specs.extend(grown_specs)

    out_mesh = enforce_disjoint_tubes(tube_specs)

    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    glb_bytes = out_mesh.export(file_type='glb', include_normals=True)
    OUT_GLB.write_bytes(glb_bytes)
    print(f'DONE in {time.time()-t0:.1f}s -> {OUT_GLB.relative_to(ROOT)} ({len(glb_bytes)/1e6:.2f} MB, {len(out_mesh.faces):,} faces)')


if __name__ == '__main__':
    main()
