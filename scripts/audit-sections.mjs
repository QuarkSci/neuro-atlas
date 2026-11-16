#!/usr/bin/env node
/**
 * Overlap audit of the cross-section schematics: for every pair of filled
 * structures in a figure, the share of the smaller one covered by the
 * other (sampled with SVG isPointInFill on the rendered page). Prints pairs
 * above --min (default 0.2) so unintended overlaps can be fixed in the data.
 *
 *   node scripts/audit-sections.mjs [--min 0.2] [--only id,id]
 *
 * --coverage switches to the tiling audit (PLAN.md 5.1): the figure's outline
 * is sampled on a grid and every point is counted as owned by no filled
 * structure ("unowned"), by exactly one, or by several ("shared"). The goal
 * for a finished plate is unowned 0 % and shared 0 %. Stroke-only structures
 * (fibre laminae drawn as lines) own nothing, by design of the measurement.
 *
 *   node scripts/audit-sections.mjs --coverage [--only id,id] [--step 1.5]
 */
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const opt = (n, d) => (args.indexOf(`--${n}`) >= 0 ? args[args.indexOf(`--${n}`) + 1] : d)
const min = +opt('min', 0.2)
const only = opt('only', '')
const coverage = args.includes('--coverage')
const step = +opt('step', 1.5)
const ids = only
  ? only.split(',')
  : ['medulla', 'pons', 'midbrain', 'diencephalon', 'basal', 'cerebellum'].flatMap((f) =>
      [...readFileSync(`src/data/sections/${f}.ts`, 'utf8').matchAll(/^ {2,4}id: '([a-z0-9-]+)'/gm)].map((m) => m[1]),
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
  await page.evaluate(() => window.__atlas.getState().setMode('learn'))
  for (const id of ids) {
    await page.evaluate((id) => window.__atlas.getState().openSection(id), id)
    await new Promise((r) => setTimeout(r, 300))
    if (coverage) {
      const c = await page.evaluate((step) => {
        const outline = [...document.querySelectorAll('.sv-svg path.sv-outline')]
        if (!outline.length) return null
        const fills = [...document.querySelectorAll('.sv-svg g.sv-item.item[data-id]')].map((g) => [...g.querySelectorAll('path.sv-fill')]).filter((a) => a.length)
        let x0 = Infinity,
          y0 = Infinity,
          x1 = -Infinity,
          y1 = -Infinity
        for (const o of outline) {
          const b = o.getBBox()
          x0 = Math.min(x0, b.x)
          y0 = Math.min(y0, b.y)
          x1 = Math.max(x1, b.x + b.width)
          y1 = Math.max(y1, b.y + b.height)
        }
        const pt = new DOMPoint()
        let inside = 0,
          unowned = 0,
          shared = 0
        for (let y = y0; y <= y1; y += step)
          for (let x = x0; x <= x1; x += step) {
            pt.x = x
            pt.y = y
            if (!outline.some((o) => o.isPointInFill(pt))) continue
            inside++
            let owners = 0
            for (const paths of fills) if (paths.some((q) => q.isPointInFill(pt))) owners++
            if (owners === 0) unowned++
            else if (owners > 1) shared++
          }
        return { inside, unowned, shared, structures: fills.length }
      }, step)
      if (!c) console.log(`${id.padEnd(34)} no outline`)
      else console.log(`${id.padEnd(34)} unowned ${((c.unowned / c.inside) * 100).toFixed(1).padStart(5)}%   shared ${((c.shared / c.inside) * 100).toFixed(1).padStart(5)}%   (${c.structures} filled structures)`)
      continue
    }
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
