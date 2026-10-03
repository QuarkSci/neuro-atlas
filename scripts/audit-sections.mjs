#!/usr/bin/env node
/**
 * Overlap audit of the cross-section schematics: for every pair of filled
 * structures in a figure, the share of the smaller one covered by the
 * other (sampled with SVG isPointInFill on the rendered page). Prints pairs
 * above --min (default 0.2) so unintended overlaps can be fixed in the data.
 *
 *   node scripts/audit-sections.mjs [--min 0.2] [--only id,id]
 */
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const opt = (n, d) => (args.indexOf(`--${n}`) >= 0 ? args[args.indexOf(`--${n}`) + 1] : d)
const min = +opt('min', 0.2)
const only = opt('only', '')
const ids = only
  ? only.split(',')
  : ['medulla', 'pons', 'midbrain', 'diencephalon', 'cerebellum'].flatMap((f) =>
      [...readFileSync(`src/data/sections/${f}.ts`, 'utf8').matchAll(/^    id: '([a-z0-9-]+)'/gm)].map((m) => m[1]),
    )

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 860 })
  await page.goto('http://localhost:3019/', { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
  await page.evaluate(() => window.__atlas.getState().setMode('sections'))
  for (const id of ids) {
    await page.evaluate((id) => window.__atlas.getState().openSection(id), id)
    await new Promise((r) => setTimeout(r, 300))
    const rows = await page.evaluate(() => {
      const groups = [...document.querySelectorAll('.sv-svg g.sv-item.item[data-id]')]
      const items = []
      for (const g of groups) {
        const paths = [...g.querySelectorAll('path.sv-fill')]
        if (!paths.length) continue
        let box = null
        for (const p of paths) {
          const b = p.getBBox()
          box = box
            ? { x0: Math.min(box.x0, b.x), y0: Math.min(box.y0, b.y), x1: Math.max(box.x1, b.x + b.width), y1: Math.max(box.y1, b.y + b.height) }
            : { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height }
        }
        items.push({ id: g.dataset.id, paths, box })
      }
      const pt = new DOMPoint()
      const hit = (it, x, y) => {
        pt.x = x
        pt.y = y
        return it.paths.some((p) => p.isPointInFill(pt))
      }
      const out = []
      for (let i = 0; i < items.length; i++)
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i],
            b = items[j]
          const x0 = Math.max(a.box.x0, b.box.x0),
            x1 = Math.min(a.box.x1, b.box.x1),
            y0 = Math.max(a.box.y0, b.box.y0),
            y1 = Math.min(a.box.y1, b.box.y1)
          if (x0 >= x1 || y0 >= y1) continue
          let both = 0,
            na = 0,
            nb = 0
          const step = 1.5
          for (let y = Math.min(a.box.y0, b.box.y0); y <= Math.max(a.box.y1, b.box.y1); y += step)
            for (let x = Math.min(a.box.x0, b.box.x0); x <= Math.max(a.box.x1, b.box.x1); x += step) {
              const ha = hit(a, x, y),
                hb = hit(b, x, y)
              if (ha) na++
              if (hb) nb++
              if (ha && hb) both++
            }
          if (both) out.push({ a: a.id, b: b.id, frac: both / Math.min(na, nb) })
        }
      return out
    })
    const bad = rows.filter((r) => r.frac >= min).sort((p, q) => q.frac - p.frac)
    console.log(`${id}: ${bad.length ? bad.map((r) => `${r.a}×${r.b} ${(r.frac * 100).toFixed(0)}%`).join(', ') : 'ok'}`)
  }
} finally {
  await browser.close()
}
