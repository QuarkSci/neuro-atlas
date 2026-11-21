#!/usr/bin/env node
/**
 * Plate → atlas-cut registration for the free lesions in 3D (src/ui/lesionFocal.ts `focalMni`).
 *
 * For every plate a free lesion can be placed on, each drawn structure that
 * has a 3D counterpart (StructureInfo.part) is paired with the same structure
 * in the app's own atlas cut of that level (atlasSlice — the frame of
 * pipeline/section_frames.json), side by side: the area centroid of the
 * plate's outline against the region's centroid in the cut plane (a, b mm).
 * A least-squares affine map plate (x, y) → (a, b) is fitted, the worst pairs
 * (residual over 2.5 × median) dropped and the map refitted — so a schematic
 * plate lands on the atlas by its landmarks, not just by its bounding box.
 *
 *   npm run dev   (localhost:3019)
 *   node scripts/export-plate-affine.mjs   → pipeline/plate_affine.json
 *
 * Rerun after a plate's drawing or a cutting plane changes (and after
 * export-section-frames.mjs).
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
  const out = await page.evaluate(async () => {
    const { SECTIONS, STRUCTURE_BY_ID } = await import('/src/data/sections/index.ts')
    const { CUT_LAYERS } = await import('/src/ui/SectionViewer.tsx')
    const { itemShapes, shapePolygon, polygonArea } = await import('/src/ui/sectionLayout.ts')
    const { focalPlate } = await import('/src/ui/lesionFocal.ts')
    const frames = (await import('/pipeline/section_frames.json')).default
    const FR = new Map((frames ?? []).map((f) => [f.id, f]))

    // Area centroid of a polygon.
    const centroid = (q) => {
      let a = 0,
        x = 0,
        y = 0
      for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
        const c = q[j][0] * q[i][1] - q[i][0] * q[j][1]
        a += c
        x += (q[j][0] + q[i][0]) * c
        y += (q[j][1] + q[i][1]) * c
      }
      return Math.abs(a) < 1e-9 ? [q.reduce((s, p) => s + p[0], 0) / q.length, q.reduce((s, p) => s + p[1], 0) / q.length] : [x / (3 * a), y / (3 * a)]
    }
    // Least squares t = c0·x + c1·y + c2 (normal equations, 3×3).
    const solve = (pairs, k) => {
      const M = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]
      const r = [0, 0, 0]
      for (const { p, t } of pairs) {
        const v = [p[0], p[1], 1]
        for (let i = 0; i < 3; i++) {
          r[i] += v[i] * t[k]
          for (let j = 0; j < 3; j++) M[i][j] += v[i] * v[j]
        }
      }
      // Gaussian elimination.
      for (let i = 0; i < 3; i++) {
        let piv = i
        for (let j = i + 1; j < 3; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j
        ;[M[i], M[piv]] = [M[piv], M[i]]
        ;[r[i], r[piv]] = [r[piv], r[i]]
        for (let j = i + 1; j < 3; j++) {
          const f = M[j][i] / M[i][i]
          for (let c = i; c < 3; c++) M[j][c] -= f * M[i][c]
          r[j] -= f * r[i]
        }
      }
      const x = [0, 0, 0]
      for (let i = 2; i >= 0; i--) {
        let acc = r[i]
        for (let j = i + 1; j < 3; j++) acc -= M[i][j] * x[j]
        x[i] = acc / M[i][i]
      }
      return x
    }
    const apply = (m, p) => [m[0][0] * p[0] + m[0][1] * p[1] + m[0][2], m[1][0] * p[0] + m[1][1] * p[1] + m[1][2]]
    const fit = (pairs) => [solve(pairs, 0), solve(pairs, 1)]
    const err = (m, pr) => Math.hypot(...apply(m, pr.p).map((v, i) => v - pr.t[i]))

    const result = []
    for (const s of SECTIONS) {
      if (!focalPlate(s)) continue
      const fr = FR.get(s.id)
      const slice = await window.__atlasSlice(s, CUT_LAYERS[s.region])
      if (!slice || !fr) continue
      // A region centroid (MNI) back into the cut plane: a = (c−o)·u, b = (c−o)·v (u, v orthonormal).
      const toAB = (c) => {
        const d = c.map((x, i) => x - fr.origin[i])
        return [d[0] * fr.u[0] + d[1] * fr.u[1] + d[2] * fr.u[2], d[0] * fr.v[0] + d[1] * fr.v[1] + d[2] * fr.v[2]]
      }
      const pairs = []
      for (const it of s.items) {
        const concept = STRUCTURE_BY_ID.get(it.id)?.part
        if (!concept) continue
        for (const sh of itemShapes(s, it)) {
          const q = shapePolygon(sh)
          if (!q || q.length < 3 || Math.abs(polygonArea(q)) < 1) continue
          const p = centroid(q)
          const left = p[0] >= s.w / 2 // the figure's right half is the patient's left (MNI x < 0)
          const regs = slice.regions.filter((r) => r.part.concept === concept && (r.part.side === 'midline' || r.centroid[0] < 0 === left))
          if (!regs.length) continue
          // The largest cut of that structure on that side.
          const reg = regs.sort((a, b) => b.area - a.area)[0]
          pairs.push({ id: it.id, p, t: toAB(reg.centroid) })
        }
      }
      if (pairs.length < 4) {
        result.push({ id: s.id, code: s.code, n: pairs.length })
        continue
      }
      let use = pairs
      let m = fit(use)
      for (let k = 0; k < 2; k++) {
        const e = use.map((pr) => err(m, pr)).sort((a, b) => a - b)
        const cut = Math.max(2, 2.5 * e[e.length >> 1])
        const kept = use.filter((pr) => err(m, pr) <= cut)
        if (kept.length < 4 || kept.length === use.length) break
        use = kept
        m = fit(use)
      }
      const es = use.map((pr) => err(m, pr)).sort((a, b) => a - b)
      const det = m[0][0] * m[1][1] - m[0][1] * m[1][0]
      result.push({
        id: s.id,
        code: s.code,
        n: use.length,
        of: pairs.length,
        median: +es[es.length >> 1].toFixed(2),
        max: +es.at(-1).toFixed(2),
        // Flipped (det < 0) as expected: the figure's y runs down, the cut's b up.
        det: +det.toFixed(4),
        m: m.map((r) => r.map((x) => +x.toFixed(5))),
      })
    }
    return result
  })
  const ok = out.filter((r) => r.m)
  writeFileSync('pipeline/plate_affine.json', JSON.stringify(Object.fromEntries(ok.map(({ id, m, n, median, max }) => [id, { m, n, median, max }])), null, 1) + '\n')
  for (const r of out) console.log(r.code.padEnd(4), r.m ? `n ${r.n}/${r.of}  median ${r.median} mm  max ${r.max} mm  det ${r.det}` : `skipped (${r.n} pairs)`)
  console.log(ok.length, 'plates → pipeline/plate_affine.json')
} finally {
  await browser.close()
}
