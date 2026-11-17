"""Cut real-image slices for the cross-section viewer's "Real" view.

For every frame in pipeline/section_frames.json (written by
scripts/export-section-frames.mjs from the app's own atlasSlice()), sample an
MNI-space image volume on that exact plane and window, and write one WebP per
section plus a manifest the viewer reads. Because the frame is the one the
atlas contours are drawn in, image and contours register by construction.

    pipeline/.venv/bin/python pipeline/tools/real_slices.py \
        data/raw/bigbrain/full8_100um_2009b_sym.nii.gz

Volume: BigBrain (Amunts et al. 2013, Science 340:1472) in MNI ICBM152 2009b
symmetric space — CC BY-NC-SA 4.0; the slices inherit that licence.

The 100 µm volume is ~8.5 GB uncompressed, so a .nii.gz is unpacked once next
to itself and then memory-mapped: only the block a slice needs is ever read.
"""

from __future__ import annotations

import gzip
import json
import shutil
import sys
from pathlib import Path

import nibabel as nib
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

ROOT = Path(__file__).resolve().parents[2]
FRAMES = ROOT / 'pipeline' / 'section_frames.json'
OUT_DIR = ROOT / 'public' / 'sections' / 'real'
MANIFEST = ROOT / 'src' / 'data' / 'sections' / 'real.json'

PX_MM = 0.1  # target sampling, mm per pixel (the volume's own resolution)
MAX_PX = 1100  # longest side of an output image
MAX_SPAN_MM = 130  # a window wider than this is not a level close-up; skip it (Mc, the whole cerebellum, is 124 mm)
MIN_TISSUE = 0.25  # share of the window's centre that must hold tissue
GAMMA = 1.25  # >1 deepens mid-greys: pale fibre-rich levels gain contrast


def unpacked(path: Path) -> Path:
    """Return an uncompressed .nii for `path`, unpacking a .nii.gz once."""
    if path.suffix != '.gz':
        return path
    target = path.with_suffix('')
    if not target.exists():
        print(f'unpacking {path.name} → {target.name} (once)…', flush=True)
        tmp = target.with_suffix('.part')
        with gzip.open(path, 'rb') as src, open(tmp, 'wb') as dst:
            shutil.copyfileobj(src, dst, length=1 << 24)
        tmp.rename(target)
    return target


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    volume = unpacked(Path(sys.argv[1]))
    only = set(sys.argv[2:])
    img = nib.load(str(volume), mmap=True)
    data = img.dataobj
    shape = np.array(img.shape[:3])
    to_voxel = np.linalg.inv(img.affine)
    voxel_mm = float(np.abs(np.linalg.det(img.affine[:3, :3])) ** (1 / 3))
    print(f'volume {tuple(shape)} @ {voxel_mm:.3f} mm', flush=True)

    frames = json.loads(FRAMES.read_text())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}

    for f in frames:
        if only and f['id'] not in only and f['code'] not in only:
            continue
        x0, y0, x1, y1 = f['window']
        w_mm, h_mm = x1 - x0, y1 - y0
        if max(w_mm, h_mm) > MAX_SPAN_MM:
            print(f"{f['code']:4} skipped: window {w_mm:.0f}×{h_mm:.0f} mm is not a close-up")
            continue
        step = max(PX_MM, voxel_mm, max(w_mm, h_mm) / MAX_PX)
        w, h = int(round(w_mm / step)), int(round(h_mm / step))
        # Pixel centres in plane coordinates; row 0 is the top of the figure (y1).
        xs = x0 + (np.arange(w) + 0.5) * (w_mm / w)
        ys = y1 - (np.arange(h) + 0.5) * (h_mm / h)
        gx, gy = np.meshgrid(xs, ys)
        o, u, v = (np.array(f[k], dtype=np.float64) for k in ('origin', 'u', 'v'))
        mni = o + gx[..., None] * u + gy[..., None] * v  # (h, w, 3)
        vox = mni @ to_voxel[:3, :3].T + to_voxel[:3, 3]

        lo = np.clip(np.floor(vox.reshape(-1, 3).min(0)).astype(int) - 1, 0, shape - 1)
        hi = np.clip(np.ceil(vox.reshape(-1, 3).max(0)).astype(int) + 2, 1, shape)
        if np.any(hi - lo < 2):
            print(f"{f['code']:4} skipped: outside the volume")
            continue
        block = np.asarray(data[lo[0] : hi[0], lo[1] : hi[1], lo[2] : hi[2]], dtype=np.float32)
        coords = (vox - lo).transpose(2, 0, 1)
        # Outside the scanned block is "no tissue"; the corner voxel of the volume says what that looks like.
        blank = float(np.asarray(data[0:1, 0:1, 0:1]).ravel()[0])
        sl = map_coordinates(block, coords, order=1, mode='constant', cval=blank)

        # Contrast from the level's own tissue: the middle of the window, minus
        # blank background. Stretching over the whole frame lets the dark
        # cerebellar cortex around a brainstem level wash the brainstem out.
        ch, cw = h // 4, w // 4
        centre = sl[ch : h - ch, cw : w - cw]
        tissue = centre[np.abs(centre - blank) > 0.02 * max(abs(blank), 1.0)]
        drop = None
        if tissue.size < MIN_TISSUE * centre.size:
            drop = f'only {tissue.size / centre.size:.0%} tissue — the volume does not reach this level'
        else:
            p_lo, p_hi = np.percentile(tissue, [1, 99.7])
            if p_hi - p_lo < 1e-3:
                drop = 'flat slice'
        if drop:
            print(f"{f['code']:4} skipped: {drop}")
            manifest.pop(f['id'], None)
            (OUT_DIR / f"{f['id']}.webp").unlink(missing_ok=True)
            continue
        out = np.clip((sl - p_lo) / (p_hi - p_lo), 0, 1) ** GAMMA
        name = f"{f['id']}.webp"
        Image.fromarray((out * 255).astype(np.uint8), mode='L').save(OUT_DIR / name, 'WEBP', quality=84, method=6)
        manifest[f['id']] = {'file': name, 'window': [round(x, 3) for x in f['window']], 'px': [w, h], 'mmPerPx': round(w_mm / w, 4), 'source': 'bigbrain'}
        kb = (OUT_DIR / name).stat().st_size / 1024
        print(f"{f['code']:4} {name:40} {w}×{h}px  {w_mm / w * 1000:.0f} µm/px  {kb:.0f} KB  range {p_lo:.0f}–{p_hi:.0f}", flush=True)

    MANIFEST.write_text(json.dumps(manifest, indent=1, sort_keys=True) + '\n')
    print(f'{len(manifest)} slices in manifest → {MANIFEST.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
