#!/usr/bin/env node
/**
 * Export the in-plane frame of every cross-section that has a real cutting
 * plane: origin, the two in-plane unit axes (MNI mm) and the window the atlas
 * view shows. `pipeline/tools/real_slices.py` samples image volumes on exactly
 * this frame, so a real slice and the atlas contours drawn over it share one
 * coordinate system by construction.
 *
 *   node scripts/export-section-frames.mjs        → pipeline/section_frames.json
 *
 * Needs the dev server (localhost:3019); the frame comes from the app's own
 * `atlasSlice()`, not from a re-implementation of it.
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})
try {
  const page = await browser.newPage()
  page.on('pageerror', (e) => console.error('[page error]', e.message))
  await page.goto('http://localhost:3019/', { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
  const frames = await page.evaluate(async () => {
    const { SECTIONS } = await import('/src/data/sections/index.ts')
    const { CUT_LAYERS } = await import('/src/ui/SectionViewer.tsx')
    const out = []
    for (const s of SECTIONS) {
      if (!s.plane) continue
      const slice = await window.__atlasSlice(s, CUT_LAYERS[s.region])
      if (!slice) continue
      const o = slice.toMNI(0, 0)
      const ux = slice.toMNI(1, 0)
      const vx = slice.toMNI(0, 1)
      out.push({
        id: s.id,
        code: s.code,
        region: s.region,
        origin: o,
        u: ux.map((x, i) => x - o[i]),
        v: vx.map((x, i) => x - o[i]),
        window: slice.window,
      })
    }
    return out
  })
  writeFileSync('pipeline/section_frames.json', JSON.stringify(frames, null, 1) + '\n')
  for (const f of frames) console.log(f.code.padEnd(4), f.id.padEnd(34), f.window.map((x) => x.toFixed(1)).join(' '))
  console.log(frames.length, 'frames → pipeline/section_frames.json')
} finally {
  await browser.close()
}
