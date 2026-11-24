"""Build a single watertight unified pial surface from the 55 gross telencephalon meshes.

Pipeline (AG-19 / A-1):
  1. Load all 55 `layer == "gross", system == "telencephalon"` GLB meshes from
     `public/meshes/` using `src/data/parts.json`.
  2. Voxelize each mesh onto a shared 0.5 mm lattice using exact 3-axis scanline
     ray-parity (majority vote across X, Y, Z) so open boundary seams in BodyParts3D
     meshes do not cause ray leaks or outward surface inflation, then take their
     boolean union.
  3. Fill any tiny enclosed interior pockets (`binary_fill_holes`), apply gentle
     Gaussian smoothing (sigma=0.5 voxels) and extract a closed isosurface via
     Marching Cubes (Lorensen & Cline 1987).
  4. Apply shrinkage-free Taubin smoothing (Taubin 1995) and quadric decimation
     (`fast_simplification`) to <= 600,000 faces while preserving watertightness.
  5. Assign every vertex of the unified mesh to the nearest original telencephalon
     part ID via a `cKDTree` over dense original surface samples.

Outputs:
  - public/meshes/gross/pial-unified.glb   (gitignored)
  - data/gross_pial_labels.json            (committed)

Usage:
  pipeline/.venv/bin/python pipeline/tools/pial_surface.py
"""

from __future__ import annotations

import argparse
import json
import pathlib
import time
from datetime import datetime, timezone

import numpy as np
import pymeshlab
import trimesh
from scipy import ndimage, sparse
from scipy.spatial import cKDTree
from skimage.measure import marching_cubes

ROOT = pathlib.Path(__file__).resolve().parents[2]
PARTS_JSON = ROOT / 'src/data/parts.json'
MESH_ROOT = ROOT / 'public/meshes'
OUT_GLB = MESH_ROOT / 'gross/pial-unified.glb'
OUT_LABELS = ROOT / 'data/gross_pial_labels.json'


def load_telencephalon_parts() -> list[dict]:
    """Return all 55 gross telencephalon part entries sorted by ID."""
    data = json.loads(PARTS_JSON.read_text(encoding='utf-8'))
    parts = [
        p for p in data['parts']
        if p.get('layer') == 'gross' and p.get('system') == 'telencephalon'
    ]
    parts.sort(key=lambda p: p['id'])
    return parts


def voxelize_axis(
    verts: np.ndarray,
    faces: np.ndarray,
    origin: np.ndarray,
    shape: tuple[int, int, int],
    pitch: float,
    axis: int,
) -> np.ndarray:
    """Exact scanline ray-parity voxelization along one axis (0=X, 1=Y, 2=Z).

    Voxel (ix, iy, iz) has its center at `origin + (idx + 0.5) * pitch`.
    A tiny deterministic sub-voxel offset prevents rays from grazing shared
    triangle edges or vertices.
    """
    if axis == 0:
        perm = (1, 2, 0)
    elif axis == 1:
        perm = (2, 0, 1)
    else:
        perm = (0, 1, 2)

    v = (verts[:, perm] - origin[list(perm)]) / pitch
    nx, ny, nz = shape[perm[0]], shape[perm[1]], shape[perm[2]]
    parity = np.zeros((nx, ny, nz + 1), dtype=np.uint8)

    v0 = v[faces[:, 0]]
    v1 = v[faces[:, 1]]
    v2 = v[faces[:, 2]]

    xmin = np.maximum(
        0, np.ceil(np.minimum(np.minimum(v0[:, 0], v1[:, 0]), v2[:, 0]) - 0.5).astype(np.int32)
    )
    xmax = np.minimum(
        nx - 1, np.floor(np.maximum(np.maximum(v0[:, 0], v1[:, 0]), v2[:, 0]) - 0.5).astype(np.int32)
    )
    ymin = np.maximum(
        0, np.ceil(np.minimum(np.minimum(v0[:, 1], v1[:, 1]), v2[:, 1]) - 0.5).astype(np.int32)
    )
    ymax = np.minimum(
        ny - 1, np.floor(np.maximum(np.maximum(v0[:, 1], v1[:, 1]), v2[:, 1]) - 0.5).astype(np.int32)
    )

    e1x = v1[:, 0] - v0[:, 0]
    e1y = v1[:, 1] - v0[:, 1]
    e2x = v2[:, 0] - v0[:, 0]
    e2y = v2[:, 1] - v0[:, 1]
    det = e1x * e2y - e1y * e2x

    valid = (np.abs(det) > 1e-10) & (xmax >= xmin) & (ymax >= ymin)
    for i in np.nonzero(valid)[0]:
        xs = np.arange(xmin[i], xmax[i] + 1, dtype=np.float64) + 0.50013
        ys = np.arange(ymin[i], ymax[i] + 1, dtype=np.float64) + 0.49987
        gx, gy = np.meshgrid(xs, ys, indexing='ij')
        dx = gx - v0[i, 0]
        dy = gy - v0[i, 1]
        inv_d = 1.0 / det[i]
        u = (dx * e2y[i] - dy * e2x[i]) * inv_d
        w = (e1x[i] * dy - e1y[i] * dx) * inv_d
        mask = (u >= 0.0) & (w >= 0.0) & (u + w <= 1.0)
        if not np.any(mask):
            continue
        z = v0[i, 2] + u[mask] * (v1[i, 2] - v0[i, 2]) + w[mask] * (v2[i, 2] - v0[i, 2])
        iz = np.clip(np.ceil(z - 0.5).astype(np.int32), 0, nz)
        ix, iy = np.nonzero(mask)
        np.bitwise_xor.at(parity, (ix + xmin[i], iy + ymin[i], iz), 1)

    occ = np.bitwise_xor.accumulate(parity, axis=2)[:, :, :nz]
    inv_perm = np.argsort(perm)
    return np.transpose(occ, inv_perm)


def voxelize_union(
    meshes: list[trimesh.Trimesh], pitch: float, pad_voxels: int = 4
) -> tuple[np.ndarray, np.ndarray]:
    """Voxelize all meshes onto a shared lattice and return (occ_bool, origin_mm)."""
    lo = np.min([m.bounds[0] for m in meshes], axis=0)
    hi = np.max([m.bounds[1] for m in meshes], axis=0)
    origin = np.floor(lo / pitch) * pitch - pad_voxels * pitch
    shape = tuple(np.ceil((hi - origin) / pitch).astype(int) + pad_voxels)
    occ = np.zeros(shape, dtype=bool)

    for idx, mesh in enumerate(meshes):
        mlo, mhi = mesh.bounds
        i0 = np.maximum(0, np.floor((mlo - origin) / pitch).astype(int) - 1)
        i1 = np.minimum(shape, np.ceil((mhi - origin) / pitch).astype(int) + 2)
        sub_origin = origin + i0 * pitch
        sub_shape = tuple((i1 - i0).tolist())

        oz = voxelize_axis(mesh.vertices, mesh.faces, sub_origin, sub_shape, pitch, 2)
        oy = voxelize_axis(mesh.vertices, mesh.faces, sub_origin, sub_shape, pitch, 1)
        ox = voxelize_axis(mesh.vertices, mesh.faces, sub_origin, sub_shape, pitch, 0)
        sub_occ = (ox + oy + oz) >= 2
        occ[i0[0]:i1[0], i0[1]:i1[1], i0[2]:i1[2]] |= sub_occ

        if (idx + 1) % 15 == 0 or idx + 1 == len(meshes):
            print(f'  voxelized {idx + 1}/{len(meshes)} meshes ...')

    return occ, origin


def taubin_smooth(
    verts: np.ndarray,
    faces: np.ndarray,
    lamb: float = 0.5,
    nu: float = -0.53,
    iterations: int = 8,
) -> np.ndarray:
    """Fast sparse-matrix Taubin smoothing (shrinkage-free Laplacian filter)."""
    n = len(verts)
    i = np.concatenate([faces[:, 0], faces[:, 1], faces[:, 2]])
    j = np.concatenate([faces[:, 1], faces[:, 2], faces[:, 0]])
    rows = np.concatenate([i, j])
    cols = np.concatenate([j, i])
    data = np.ones(len(rows), dtype=np.float64)
    adj = sparse.coo_matrix((data, (rows, cols)), shape=(n, n)).tocsr()
    adj.data[:] = 1.0  # deduplicate shared edges

    deg = np.asarray(adj.sum(axis=1)).ravel()
    inv_deg = np.where(deg > 0, 1.0 / deg, 0.0)
    w_mat = sparse.diags(inv_deg) @ adj

    v = verts.astype(np.float64, copy=True)
    for _ in range(iterations):
        v = v + lamb * (w_mat @ v - v)
        v = v + nu * (w_mat @ v - v)
    return v


def build_label_tree(meshes: list[trimesh.Trimesh], max_edge_mm: float = 1.0) -> tuple[cKDTree, np.ndarray]:
    """Build a KD-tree over subdivided original surfaces so large flat triangles are accurately labeled."""
    pts_list = []
    ids_list = []
    for idx, m in enumerate(meshes):
        v, f = trimesh.remesh.subdivide_to_size(m.vertices, m.faces, max_edge=max_edge_mm)
        centroids = v[f].mean(axis=1)
        pts = np.vstack([v, centroids])
        pts_list.append(pts)
        ids_list.append(np.full(len(pts), idx, dtype=np.int16))
    all_pts = np.vstack(pts_list)
    all_ids = np.concatenate(ids_list)
    return cKDTree(all_pts), all_ids


def decimate_watertight(verts: np.ndarray, faces: np.ndarray, target_faces: int) -> trimesh.Trimesh:
    """Quadric edge collapse with strict topology preservation (PyMeshLab)."""
    ms = pymeshlab.MeshSet()
    ms.add_mesh(pymeshlab.Mesh(vertex_matrix=verts, face_matrix=faces))
    ms.meshing_decimation_quadric_edge_collapse(
        targetfacenum=int(target_faces),
        preservetopology=True,
        preservenormal=True,
        planarquadric=True,
        autoclean=True,
    )
    out = ms.current_mesh()
    return trimesh.Trimesh(
        vertices=np.asarray(out.vertex_matrix(), dtype=np.float64),
        faces=np.asarray(out.face_matrix(), dtype=np.int64),
        process=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description='Generate unified watertight pial surface.')
    parser.add_argument('--pitch', type=float, default=0.5, help='Voxel pitch in mm (default: 0.5)')
    parser.add_argument('--sigma', type=float, default=0.35, help='Gaussian pre-filter sigma in voxels (default: 0.35)')
    parser.add_argument('--smooth-iters', type=int, default=4, help='Taubin smoothing iterations (default: 4)')
    parser.add_argument('--target-faces', type=int, default=500000, help='Target face count <= 600000 (default: 500000)')
    args = parser.parse_args()

    t_start = time.time()
    parts = load_telencephalon_parts()
    print(f'Loaded {len(parts)} gross telencephalon parts from {PARTS_JSON.name}')

    meshes: list[trimesh.Trimesh] = []
    sum_vol = 0.0
    for p in parts:
        mp = MESH_ROOT / p['mesh']
        m = trimesh.load(mp, force='mesh', process=True)
        meshes.append(m)
        sum_vol += abs(float(m.volume))

    t1 = time.time()
    print(f'1. Voxelizing union at pitch={args.pitch} mm ...')
    occ, origin = voxelize_union(meshes, pitch=args.pitch)
    raw_union_vol = float(occ.sum()) * (args.pitch ** 3)
    occ = ndimage.binary_fill_holes(occ)
    filled_union_vol = float(occ.sum()) * (args.pitch ** 3)
    print(
        f'   Grid={occ.shape}, union_vol={raw_union_vol:.1f} mm^3, '
        f'after fill_holes={filled_union_vol:.1f} mm^3 (sum_parts={sum_vol:.1f} mm^3) [{time.time()-t1:.1f}s]'
    )

    t2 = time.time()
    print(f'2. Extracting Marching Cubes isosurface (sigma={args.sigma}) ...')
    field = occ.astype(np.float32)
    if args.sigma > 0:
        field = ndimage.gaussian_filter(field, sigma=args.sigma)
    verts, faces, _, _ = marching_cubes(field, level=0.5, spacing=(args.pitch, args.pitch, args.pitch))
    verts = verts.astype(np.float64) + origin + 0.5 * args.pitch
    print(f'   Raw MC mesh: verts={len(verts):,}, faces={len(faces):,} [{time.time()-t2:.1f}s]')

    # Remove tiny disconnected noise specks (< 200 faces) while preserving real components
    mc_mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=True)
    comps = mc_mesh.split(only_watertight=False)
    kept = [c for c in comps if len(c.faces) >= 200]
    print(f'   Connected components: {len(comps)} total, {len(kept)} kept (>=200 faces)')
    mc_mesh = trimesh.util.concatenate(kept)
    mc_mesh.merge_vertices()

    t3 = time.time()
    print(f'3. Taubin smoothing ({args.smooth_iters} iters) ...')
    smooth_v = taubin_smooth(mc_mesh.vertices, mc_mesh.faces, lamb=0.5, nu=-0.53, iterations=args.smooth_iters)
    print(f'   Done [{time.time()-t3:.1f}s]')

    t4 = time.time()
    cur_faces = len(mc_mesh.faces)
    if cur_faces > args.target_faces:
        print(f'4. Topology-preserving quadric decimation: {cur_faces:,} -> {args.target_faces:,} faces ...')
        final_mesh = decimate_watertight(smooth_v, mc_mesh.faces, args.target_faces)
    else:
        final_mesh = trimesh.Trimesh(vertices=smooth_v, faces=mc_mesh.faces, process=True)

    final_mesh.fix_normals()
    if final_mesh.volume < 0:
        final_mesh.invert()
    print(
        f'   Final mesh: verts={len(final_mesh.vertices):,}, faces={len(final_mesh.faces):,}, '
        f'watertight={final_mesh.is_watertight}, vol={final_mesh.volume:.1f} mm^3 [{time.time()-t4:.1f}s]'
    )

    t5 = time.time()
    print('5. Assigning per-vertex gyrus labels (cKDTree) ...')
    tree, ref_ids = build_label_tree(meshes)
    dists, nn_idx = tree.query(final_mesh.vertices, workers=-1)
    v_labels = ref_ids[nn_idx].astype(int)
    part_ids = [p['id'] for p in parts]
    counts = [int(np.sum(v_labels == i)) for i in range(len(part_ids))]
    n_present = sum(1 for c in counts if c > 0)
    print(
        f'   Labeled {len(v_labels):,} vertices across {n_present}/{len(part_ids)} parts; '
        f'v->orig dist: median={np.median(dists):.3f} mm, p99={np.percentile(dists, 99):.3f} mm, '
        f'max={np.max(dists):.3f} mm [{time.time()-t5:.1f}s]'
    )

    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    glb_bytes = final_mesh.export(file_type='glb', include_normals=True)
    OUT_GLB.write_bytes(glb_bytes)

    elapsed = time.time() - t_start
    label_payload = {
        'mesh': 'gross/pial-unified.glb',
        'source': 'BodyParts3D 4.3 (DBCLS) CC BY-SA 2.1 JP — unified telencephalon pial surface',
        'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'pitchMm': args.pitch,
        'vertexCount': int(len(final_mesh.vertices)),
        'faceCount': int(len(final_mesh.faces)),
        'watertight': bool(final_mesh.is_watertight),
        'volumeMm3': round(float(final_mesh.volume), 1),
        'unionVolumeMm3': round(raw_union_vol, 1),
        'volumeDiffPct': round((float(final_mesh.volume) - raw_union_vol) / raw_union_vol * 100.0, 3),
        'glbBytes': len(glb_bytes),
        'elapsedSec': round(elapsed, 2),
        'parts': part_ids,
        'counts': counts,
        'labels': v_labels.tolist(),
    }
    OUT_LABELS.parent.mkdir(parents=True, exist_ok=True)
    OUT_LABELS.write_text(json.dumps(label_payload, separators=(',', ':')), encoding='utf-8')

    print(
        f'DONE in {elapsed:.1f}s -> {OUT_GLB.relative_to(ROOT)} ({len(glb_bytes)/1e6:.2f} MB), '
        f'{OUT_LABELS.relative_to(ROOT)} ({OUT_LABELS.stat().st_size/1e6:.2f} MB)'
    )


if __name__ == '__main__':
    main()
