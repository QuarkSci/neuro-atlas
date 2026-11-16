import manifest from './real.json'

/**
 * Real-image slices cut by `pipeline/tools/real_slices.py` on each section's
 * own plane and window (see scripts/export-section-frames.mjs). `window` is
 * the plane-coordinate rectangle (mm) the image covers, so the viewer can lay
 * atlas contours over it without any further registration.
 */
export interface RealSlice {
  file: string
  /** [x0, y0, x1, y1] in plane millimetres. */
  window: [number, number, number, number]
  px: [number, number]
  mmPerPx: number
  source: 'bigbrain'
}

export const REAL_SLICES = manifest as unknown as Record<string, RealSlice>

export const realSliceUrl = (s: RealSlice) => `${import.meta.env.BASE_URL}sections/real/${s.file}`

/** Credit line per image source; BigBrain slices are CC BY-NC-SA 4.0. */
export const REAL_SOURCES = {
  bigbrain: {
    label: 'BigBrain — Amunts et al., Science 2013',
    license: 'CC BY-NC-SA 4.0',
    url: 'https://bigbrainproject.org',
    doi: '10.1126/science.1235381',
  },
} as const
