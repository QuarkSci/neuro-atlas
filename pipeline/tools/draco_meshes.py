#!/usr/bin/env python3
"""Compress all GLB meshes in public/meshes/ using Draco (KHR_draco_mesh_compression).

Reads each .glb file under --src (default: public/meshes), compresses vertex
positions, faces, and normals (if present) via DracoPy, and writes a valid
glTF 2.0 binary (.glb) with KHR_draco_mesh_compression to --out (default:
build/meshes-draco). Also prints a per-layer and total size comparison table
(before vs. after), and optionally packs a release tarball or flat asset layout.

Usage:
  pipeline/.venv/bin/python pipeline/tools/draco_meshes.py [--src public/meshes] [--out /tmp/meshes-draco]
"""
from __future__ import annotations

import argparse
import json
import pathlib
import struct
import sys
import tarfile
import time
from collections import defaultdict

import DracoPy
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]


def encode_draco_glb(data: bytes, qb: int = 14, cl: int = 7, nqb: int = 10) -> tuple[bytes, bool]:
    """Encode an uncompressed single-primitive GLB with KHR_draco_mesh_compression.
    Returns (new_glb_bytes, was_compressed). If already Draco-compressed, returns as-is.
    """
    magic, version, _ = struct.unpack('<4sII', data[:12])
    if magic != b'glTF' or version != 2:
        raise ValueError('Not a valid glTF 2.0 binary')
    chunk_len, chunk_type = struct.unpack('<I4s', data[12:20])
    if chunk_type != b'JSON':
        raise ValueError('First GLB chunk is not JSON')
    j = json.loads(data[20 : 20 + chunk_len])
    prim = j['meshes'][0]['primitives'][0]
    if 'extensions' in prim and 'KHR_draco_mesh_compression' in prim['extensions']:
        return data, False

    bin_offset = 20 + chunk_len + 8
    bin_data = data[bin_offset:]

    idx_acc = j['accessors'][prim['indices']]
    idx_bv = j['bufferViews'][idx_acc['bufferView']]
    idx_off = idx_bv.get('byteOffset', 0) + idx_acc.get('byteOffset', 0)
    idx_dtype = np.uint32 if idx_acc['componentType'] == 5125 else np.uint16
    faces = np.frombuffer(bin_data, dtype=idx_dtype, count=idx_acc['count'], offset=idx_off).astype(np.uint32).reshape(-1, 3)

    pos_acc = j['accessors'][prim['attributes']['POSITION']]
    pos_bv = j['bufferViews'][pos_acc['bufferView']]
    pos_off = pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
    pos = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc['count'] * 3, offset=pos_off).reshape(-1, 3)

    norm = None
    norm_acc = None
    if 'NORMAL' in prim['attributes']:
        norm_acc = j['accessors'][prim['attributes']['NORMAL']]
        norm_bv = j['bufferViews'][norm_acc['bufferView']]
        norm_off = norm_bv.get('byteOffset', 0) + norm_acc.get('byteOffset', 0)
        norm = np.frombuffer(bin_data, dtype=np.float32, count=norm_acc['count'] * 3, offset=norm_off).reshape(-1, 3).astype(float)

    drc = DracoPy.encode(
        pos,
        faces=faces,
        normals=norm,
        quantization_bits=qb,
        compression_level=cl,
        normal_quantization_bits=nqb,
    )
    dec = DracoPy.decode(drc)
    n_verts = int(len(dec.points))
    n_idx = int(len(dec.faces) * 3)
    uid_by_type = {a['attribute_type']: a['unique_id'] for a in dec.attributes}

    idx_acc.pop('bufferView', None)
    idx_acc.pop('byteOffset', None)
    idx_acc['count'] = n_idx
    idx_acc['max'] = [n_verts - 1]
    idx_acc['min'] = [0]

    pos_acc.pop('bufferView', None)
    pos_acc.pop('byteOffset', None)
    pos_acc['count'] = n_verts

    draco_attrs: dict[str, int] = {'POSITION': int(uid_by_type[0])}
    if norm_acc is not None and 1 in uid_by_type:
        norm_acc.pop('bufferView', None)
        norm_acc.pop('byteOffset', None)
        norm_acc['count'] = n_verts
        draco_attrs['NORMAL'] = int(uid_by_type[1])

    prim['extensions'] = {
        'KHR_draco_mesh_compression': {
            'bufferView': 0,
            'attributes': draco_attrs,
        }
    }
    j['extensionsUsed'] = ['KHR_draco_mesh_compression']
    j['extensionsRequired'] = ['KHR_draco_mesh_compression']
    j['bufferViews'] = [{'buffer': 0, 'byteOffset': 0, 'byteLength': len(drc)}]
    j['buffers'] = [{'byteLength': len(drc)}]

    pad_bin = (4 - (len(drc) % 4)) % 4
    bin_chunk = drc + (b'\x00' * pad_bin)

    json_bytes = json.dumps(j, separators=(',', ':')).encode('utf-8')
    pad_json = (4 - (len(json_bytes) % 4)) % 4
    json_chunk = json_bytes + (b' ' * pad_json)

    total_len = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    out = (
        struct.pack('<4sII', b'glTF', 2, total_len)
        + struct.pack('<I4s', len(json_chunk), b'JSON')
        + json_chunk
        + struct.pack('<I4s', len(bin_chunk), b'BIN\x00')
        + bin_chunk
    )
    return out, True


def fmt_mb(n_bytes: int) -> str:
    return f'{n_bytes / (1024 * 1024):.2f} MB'


def main() -> None:
    ap = argparse.ArgumentParser(description='Compress GLB meshes with Draco (KHR_draco_mesh_compression).')
    ap.add_argument('--src', type=pathlib.Path, default=ROOT / 'public/meshes', help='Source meshes directory')
    ap.add_argument('--out', type=pathlib.Path, default=pathlib.Path('/tmp/neuro-atlas-meshes-draco'), help='Output directory for Draco GLBs')
    ap.add_argument('--qb', type=int, default=14, help='Position quantization bits (default: 14)')
    ap.add_argument('--nqb', type=int, default=10, help='Normal quantization bits (default: 10)')
    ap.add_argument('--cl', type=int, default=7, help='Compression level 0-10 (default: 7)')
    ap.add_argument('--tar', type=pathlib.Path, default=None, help='Optional output .tar.gz path for GitHub Release asset (e.g. /tmp/meshes-draco.tar.gz)')
    args = ap.parse_args()

    src_dir = args.src.resolve()
    out_dir = args.out.resolve()
    if not src_dir.exists():
        sys.exit(f'Source directory not found: {src_dir}')

    files = sorted(src_dir.rglob('*.glb'))
    if not files:
        sys.exit(f'No .glb files found under {src_dir}')

    t0 = time.monotonic()
    stats: dict[str, list[int]] = defaultdict(lambda: [0, 0, 0])  # layer -> [count, before_bytes, after_bytes]

    for i, f in enumerate(files, 1):
        rel = f.relative_to(src_dir)
        layer = rel.parts[0] if len(rel.parts) > 1 else 'root'
        raw = f.read_bytes()
        comp, _ = encode_draco_glb(raw, qb=args.qb, cl=args.cl, nqb=args.nqb)
        dst = out_dir / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(comp)
        s = stats[layer]
        s[0] += 1
        s[1] += len(raw)
        s[2] += len(comp)
        if i % 250 == 0 or i == len(files):
            print(f'[{i:4d}/{len(files)}] {rel} ({len(raw) // 1024} KB -> {len(comp) // 1024} KB)', flush=True)

    dt = time.monotonic() - t0
    tot_count = sum(v[0] for v in stats.values())
    tot_before = sum(v[1] for v in stats.values())
    tot_after = sum(v[2] for v in stats.values())

    print(f'\nDone in {dt:.1f}s -> {out_dir}\n')
    print('| Qatlam (Layer) | Fayllar | Oldin (Uncompressed) | Keyin (Draco) | Nisbat (Ratio) | Tejaldi |')
    print('|---|---:|---:|---:|---:|---:|')
    for layer in sorted(stats.keys()):
        cnt, bef, aft = stats[layer]
        ratio = (aft / bef * 100) if bef else 0
        saved = 100 - ratio
        print(f'| `{layer}` | {cnt} | {fmt_mb(bef)} | {fmt_mb(aft)} | {ratio:.1f}% | −{saved:.1f}% |')
    tot_ratio = (tot_after / tot_before * 100) if tot_before else 0
    tot_saved = 100 - tot_ratio
    print(f'| **Jami (Total)** | **{tot_count}** | **{fmt_mb(tot_before)}** | **{fmt_mb(tot_after)}** | **{tot_ratio:.1f}%** | **−{tot_saved:.1f}%** |')

    if args.tar:
        tar_path = args.tar.resolve()
        tar_path.parent.mkdir(parents=True, exist_ok=True)
        with tarfile.open(tar_path, 'w:gz') as tf:
            for f in sorted(out_dir.rglob('*.glb')):
                tf.add(f, arcname=str(f.relative_to(out_dir)))
        print(f'\nPacked release archive: {tar_path} ({fmt_mb(tar_path.stat().st_size)})')


if __name__ == '__main__':
    main()
