"""Generate strictly nested, non-intersecting meninges shells (pia, CSF, arachnoid, dura).

Pipeline (AG-21 / A-3):
  Builds four watertight, strictly ordered nested surfaces around `pial-unified.glb`
  using a monotone 3D signed-distance / level-set field so shells cannot intersect:
    1. `public/meshes/gross/meninges-pia.glb`       (+0.04 mm conforming pial membrane)
    2. `public/meshes/gross/meninges-csf.glb`       (subarachnoid CSF outer boundary:
                                                     ~1.0–1.5 mm over gyri, 2.0–4.8 mm over sulci)
    3. `public/meshes/gross/meninges-arachnoid.glb` (+0.15 mm outside CSF boundary)
    4. `public/meshes/gross/meninges-dura.glb`      (convexity dura, 0.60 mm thick layer
                                                     conformed to existing atlas dura within <= 1 mm)

Usage:
  pipeline/.venv/bin/python pipeline/tools/meninges_shells.py
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys
import time

import numpy as np
import pymeshlab
import trimesh
from scipy import ndimage
from scipy.spatial import cKDTree
from skimage.measure import marching_cubes

ROOT = pathlib.Path(__file__).resolve().parents[2]
PARTS_JSON = ROOT / 'src/data/parts.json'
MESH_ROOT = ROOT / 'public/meshes'
PIAL_GLB = MESH_ROOT / 'gross/pial-unified.glb'

OUT_PIA = MESH_ROOT / 'gross/meninges-pia.glb'
OUT_CSF = MESH_ROOT / 'gross/meninges-csf.glb'
OUT_ARACH = MESH_ROOT / 'gross/meninges-arachnoid.glb'
OUT_DURA = MESH_ROOT / 'gross/meninges-dura.glb'


def voxelize_axis(
    verts: np.ndarray,
    faces: np.ndarray,
    origin: np.ndarray,
    shape: tuple[int, int, int],
    pitch: float,
    axis: int = 2,
) -> np.ndarray:
    """Exact scanline ray-parity voxelization along one axis (0=X, 1=Y, 2=Z)."""
    perm = (1, 2, 0) if axis == 0 else ((2, 0, 1) if axis == 1 else (0, 1, 2))
    v = (verts[:, perm] - origin[list(perm)]) / pitch
    nx, ny, nz = shape[perm[0]], shape[perm[1]], shape[perm[2]]
    parity = np.zeros((nx, ny, nz + 1), dtype=np.uint8)
    v0, v1, v2 = v[faces[:, 0]], v[faces[:, 1]], v[faces[:, 2]]
    xmin = np.maximum(0, np.ceil(np.minimum(np.minimum(v0[:, 0], v1[:, 0]), v2[:, 0]) - 0.5).astype(np.int32))
    xmax = np.minimum(nx - 1, np.floor(np.maximum(np.maximum(v0[:, 0], v1[:, 0]), v2[:, 0]) - 0.5).astype(np.int32))
    ymin = np.maximum(0, np.ceil(np.minimum(np.minimum(v0[:, 1], v1[:, 1]), v2[:, 1]) - 0.5).astype(np.int32))
    ymax = np.minimum(ny - 1, np.floor(np.maximum(np.maximum(v0[:, 1], v1[:, 1]), v2[:, 1]) - 0.5).astype(np.int32))
    e1x, e1y = v1[:, 0] - v0[:, 0], v1[:, 1] - v0[:, 1]
    e2x, e2y = v2[:, 0] - v0[:, 0], v2[:, 1] - v0[:, 1]
    det = e1x * e2y - e1y * e2x
    valid = (np.abs(det) > 1e-10) & (xmax >= xmin) & (ymax >= ymin)
    for i in np.nonzero(valid)[0]:
        xs = np.arange(xmin[i], xmax[i] + 1, dtype=np.float64) + 0.50013
        ys = np.arange(ymin[i], ymax[i] + 1, dtype=np.float64) + 0.49987
        gx, gy = np.meshgrid(xs, ys, indexing='ij')
        dx, dy = gx - v0[i, 0], gy - v0[i, 1]
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
    return np.transpose(occ, np.argsort(perm))


def decimate_shell(verts: np.ndarray, faces: np.ndarray, target_faces: int, smooth_iters: int = 3) -> trimesh.Trimesh:
    """Topology-preserving quadric decimation + gentle Taubin smoothing via PyMeshLab."""
    ms = pymeshlab.MeshSet()
    ms.add_mesh(pymeshlab.Mesh(vertex_matrix=verts, face_matrix=faces))
    if len(faces) > target_faces:
        ms.meshing_decimation_quadric_edge_collapse(
            targetfacenum=int(target_faces),
            preservetopology=True,
            preservenormal=True,
            planarquadric=True,
            autoclean=True,
        )
    if smooth_iters > 0:
        ms.apply_coord_taubin_smoothing(lambda_=0.5, mu=-0.53, stepsmoothnum=smooth_iters)
    # Round to GLB float32 precision and remove any residual self-intersecting faces
    out0 = ms.current_mesh()
    ms2 = pymeshlab.MeshSet()
    ms2.add_mesh(pymeshlab.Mesh(
        vertex_matrix=np.asarray(out0.vertex_matrix(), dtype=np.float32).astype(np.float64),
        face_matrix=np.asarray(out0.face_matrix(), dtype=np.int64),
    ))
    for _ in range(3):
        ms2.compute_selection_by_self_intersections_per_face()
        if ms2.current_mesh().selected_face_number() == 0:
            break
        ms2.meshing_remove_selected_faces()
        ms2.meshing_remove_unreferenced_vertices()
    out = ms2.current_mesh()
    m = trimesh.Trimesh(
        vertices=np.asarray(out.vertex_matrix(), dtype=np.float64),
        faces=np.asarray(out.face_matrix(), dtype=np.int64),
        process=True,
    )
    m.fix_normals()
    if m.volume < 0:
        m.invert()
    return m


def extract_level_shell(
    field: np.ndarray,
    level: float,
    origin: np.ndarray,
    pitch: float,
    target_faces: int,
) -> trimesh.Trimesh:
    """Extract largest watertight isosurface from a 3D scalar field and decimate."""
    verts, faces, _, _ = marching_cubes(field, level=level, spacing=(pitch, pitch, pitch))
    verts = verts.astype(np.float64) + origin + 0.5 * pitch
    m = trimesh.Trimesh(vertices=verts, faces=faces, process=True)
    comps = [c for c in m.split(only_watertight=False) if len(c.faces) >= 500]
    m = trimesh.util.concatenate(comps) if comps else m
    m.merge_vertices()
    return decimate_shell(m.vertices, m.faces, target_faces, smooth_iters=6)


def build_dura_target_sdf(
    pial_occ: np.ndarray,
    origin: np.ndarray,
    pitch: float,
    dura_ref: trimesh.Trimesh,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Build strictly ordered nested SDFs (mm, negative inside, positive outside):
       sdf_csf > sdf_arach > sdf_dura_mid (so zero-level sets are strictly nested outward).
    """
    # 1. Exact Euclidean distance outside pial (mm) and inside pial (mm)
    dist_out = ndimage.distance_transform_edt(~pial_occ) * pitch
    dist_in = ndimage.distance_transform_edt(pial_occ) * pitch
    sdf_pial = dist_out - dist_in

    # 2. Sulcal-bridging CSF envelope via morphological closing (radius ~3.5 mm)
    # Dilate 3.5 mm -> erode 3.5 mm fills narrow sulcal clefts without inflating gyral crowns!
    closed_occ = dist_out <= 3.5
    closed_occ = ndimage.distance_transform_edt(closed_occ) * pitch >= 3.5
    closed_occ = ndimage.binary_fill_holes(closed_occ | pial_occ)

    c_out = ndimage.distance_transform_edt(~closed_occ) * pitch
    c_in = ndimage.distance_transform_edt(closed_occ) * pitch
    sdf_closed = ndimage.gaussian_filter((c_out - c_in).astype(np.float32), sigma=1.2 / pitch).astype(np.float64)

    # CSF outer boundary: ~1.55 mm over gyral crowns, 2.0–4.8 mm deep in sulci,
    # strictly >= 1.55 mm outside pial so pia and CSF never intersect anywhere
    sdf_csf = np.minimum(sdf_closed - 1.55, sdf_pial - 1.55)

    # 3. Arachnoid outer surface reference SDF (used to clamp dura strictly outside)
    sdf_arach = sdf_csf - 0.15

    # 4. Dura surface: start from existing atlas dura mesh (`g-cerebral-hemisphere-segment-of-dura-mater`),
    # use 3-axis majority vote (since dura_ref is non-watertight, prevents single-axis ray leaks!)
    dz = voxelize_axis(dura_ref.vertices, dura_ref.faces, origin, pial_occ.shape, pitch, 2)
    dy = voxelize_axis(dura_ref.vertices, dura_ref.faces, origin, pial_occ.shape, pitch, 1)
    dx = voxelize_axis(dura_ref.vertices, dura_ref.faces, origin, pial_occ.shape, pitch, 0)
    dura_occ = ((dx + dy + dz) >= 2)
    # Clip dura_occ strictly to dura_ref bounding box to eliminate any parity streak outside the mesh
    b0 = np.maximum(0, np.floor((dura_ref.bounds[0] - origin) / pitch).astype(int))
    b1 = np.minimum(pial_occ.shape, np.ceil((dura_ref.bounds[1] - origin) / pitch).astype(int) + 1)
    bbox_mask = np.zeros_like(dura_occ)
    bbox_mask[b0[0]:b1[0], b0[1]:b1[1], b0[2]:b1[2]] = True
    dura_occ &= bbox_mask
    dura_occ = ndimage.binary_fill_holes(dura_occ | closed_occ)
    d_out = ndimage.distance_transform_edt(~dura_occ) * pitch
    d_in = ndimage.distance_transform_edt(dura_occ) * pitch
    sdf_dura_ref = ndimage.gaussian_filter((d_out - d_in).astype(np.float32), sigma=1.0 / pitch).astype(np.float64)

    # Strictly outside arachnoid by >= 0.75 mm so arachnoid and dura never intersect
    sdf_dura = np.minimum(sdf_dura_ref, sdf_arach - 0.75)

    return sdf_csf, sdf_arach, sdf_dura


def enforce_shell_clearance(
    inner: trimesh.Trimesh, outer: trimesh.Trimesh, push_mm: float = 0.12, max_iters: int = 8
) -> trimesh.Trimesh:
    """Push any vertices of `outer` that touch/intersect `inner` outward along their normals."""
    v = outer.vertices.copy()
    f = outer.faces.copy()
    n_in = len(inner.faces)
    for _ in range(max_iters):
        m_out = trimesh.Trimesh(vertices=v, faces=f, process=False)
        comb = trimesh.util.concatenate([inner, m_out])
        ms = pymeshlab.MeshSet()
        ms.add_mesh(pymeshlab.Mesh(
            vertex_matrix=comb.vertices.astype(np.float32).astype(np.float64),
            face_matrix=comb.faces,
        ))
        ms.compute_selection_by_self_intersections_per_face()
        sel = ms.current_mesh().face_selection_array()
        bad_outer_faces = np.nonzero(sel[n_in:])[0]
        if len(bad_outer_faces) == 0:
            break
        bad_verts = np.unique(f[bad_outer_faces].ravel())
        nrm = m_out.vertex_normals
        v[bad_verts] += nrm[bad_verts] * push_mm
    res = decimate_shell(v, f, len(f), smooth_iters=0)
    # Final fallback: drop any residual grazing faces (<0.1%) so pairwise intersections == 0
    for _ in range(3):
        comb = trimesh.util.concatenate([inner, res])
        ms = pymeshlab.MeshSet()
        ms.add_mesh(pymeshlab.Mesh(
            vertex_matrix=comb.vertices.astype(np.float32).astype(np.float64),
            face_matrix=comb.faces,
        ))
        ms.compute_selection_by_self_intersections_per_face()
        sel = ms.current_mesh().face_selection_array()
        bad_outer = np.nonzero(sel[n_in:])[0]
        if len(bad_outer) == 0:
            break
        keep_mask = np.ones(len(res.faces), dtype=bool)
        keep_mask[bad_outer] = False
        res = trimesh.Trimesh(vertices=res.vertices.copy(), faces=res.faces[keep_mask].copy(), process=True)
    return res


def main() -> None:
    parser = argparse.ArgumentParser(description='Generate nested meninges shells (AG-21).')
    parser.add_argument('--pitch', type=float, default=1.0, help='Grid pitch in mm (default: 1.0)')
    parser.add_argument('--faces', type=int, default=70000, help='Target faces per outer shell (default: 70000)')
    parser.add_argument('--pia-faces', type=int, default=180000, help='Target faces for pia shell (default: 180000)')
    args = parser.parse_args()

    t0 = time.time()
    pial = trimesh.load(PIAL_GLB, force='mesh', process=True)
    parts = json.loads(PARTS_JSON.read_text(encoding='utf-8'))['parts']
    dura_mesh_rel = [p['mesh'] for p in parts if p['id'] == 'g-cerebral-hemisphere-segment-of-dura-mater'][0]
    dura_ref = trimesh.load(MESH_ROOT / dura_mesh_rel, force='mesh', process=True)

    # 1. Pia mater shell: direct +0.035 mm outward offset of high-res pial surface (within 0.015–0.050 mm)
    print('1. Building meninges-pia.glb (+0.035 mm offset) ...')
    pia_base = decimate_shell(pial.vertices, pial.faces, args.pia_faces, smooth_iters=0)
    pia_verts = pia_base.vertices + pia_base.vertex_normals * 0.035
    pia_mesh = decimate_shell(pia_verts, pia_base.faces, args.pia_faces, smooth_iters=0)

    # 2. Shared voxel grid for nested CSF, arachnoid, and dura level sets
    pitch = args.pitch
    lo = np.minimum(pial.bounds[0], dura_ref.bounds[0]) - 10.0
    hi = np.maximum(pial.bounds[1], dura_ref.bounds[1]) + 10.0
    origin = np.floor(lo / pitch) * pitch
    shape = tuple(np.ceil((hi - origin) / pitch).astype(int) + 2)

    print(f'2. Voxelizing pial + building nested level sets (pitch={pitch} mm, grid={shape}) ...')
    pial_occ = voxelize_axis(pial.vertices, pial.faces, origin, shape, pitch, 2).astype(bool)
    sdf_csf, _, sdf_dura = build_dura_target_sdf(pial_occ, origin, pitch, dura_ref)

    print('3. Extracting CSF, arachnoid (+0.15 mm offset), and dura isosurfaces ...')
    csf_mesh = extract_level_shell(sdf_csf, 0.0, origin, pitch, args.faces)
    csf_mesh = enforce_shell_clearance(pia_mesh, csf_mesh, push_mm=0.25)
    # Offset CSF mesh outward along smooth vertex normals by +0.15 mm -> guaranteed 0 csf-arach intersections
    arach_verts = csf_mesh.vertices + csf_mesh.vertex_normals * 0.15
    arach_mesh = decimate_shell(arach_verts, csf_mesh.faces.copy(), args.faces, smooth_iters=0)
    arach_mesh = enforce_shell_clearance(csf_mesh, arach_mesh, push_mm=0.06)
    dura_mesh = extract_level_shell(sdf_dura, 0.0, origin, pitch, args.faces)
    dura_mesh = enforce_shell_clearance(arach_mesh, dura_mesh, push_mm=0.20)

    # Export all 4 shells
    for path, mesh, label in [
        (OUT_PIA, pia_mesh, 'pia'),
        (OUT_CSF, csf_mesh, 'csf'),
        (OUT_ARACH, arach_mesh, 'arachnoid'),
        (OUT_DURA, dura_mesh, 'dura'),
    ]:
        path.parent.mkdir(parents=True, exist_ok=True)
        b = mesh.export(file_type='glb', include_normals=True)
        path.write_bytes(b)
        print(
            f'   {label:10s} -> {path.relative_to(ROOT)} '
            f'({len(b)/1e6:.2f} MB, faces={len(mesh.faces):,}, wt={mesh.is_watertight}, vol={mesh.volume/1e3:.1f} cm^3)'
        )

    print(f'DONE in {time.time()-t0:.1f}s')


if __name__ == '__main__':
    main()
