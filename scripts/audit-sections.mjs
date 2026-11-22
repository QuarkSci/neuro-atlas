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
 * is sampled on a grid and every point is attributed, in this order, to a
 * drawn structure, else to a named territory (`regions`), else to the named
 * ground tissue of the outline (`ground`), else to nothing. UNOWNED must be
 * 0 %: a reader pointing anywhere in the figure gets a name. "shared" is the
 * share lying in two structures at once. A large "ground" share is fine where
 * the ground is real tissue (reticular formation around brainstem nuclei) and
 * a defect where it is a catch-all for the organ itself.
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
      [...readFileSync(`src/data/sections/${f}.ts`, 'utf8').matchAll(/^ {2,4}id: '([a-z0-9-]+)',\n\s+code:/gm)].map((m) => m[1]),
    )

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 860 })
  await page.goto(process.env.NA_URL ?? 'http://localhost:3019/', { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
  await page.evaluate(() => window.__atlas.getState().setMode('learn'))
  for (const id of ids) {
    await page.evaluate((id) => window.__atlas.getState().openSection(id), id)
    await new Promise((r) => setTimeout(r, 300))
    if (coverage) {
      const c = await page.evaluate((step) => {
        const outline = [...document.querySelectorAll('.sv-svg path.sv-outline')]
        if (!outline.length) return null
        const groups = [...document.querySelectorAll('.sv-svg g[data-id]')]
        const pick = (sel) => groups.map((g) => ({ id: g.dataset.id, paths: [...g.querySelectorAll(sel)] })).filter((x) => x.paths.length)
        const items = pick('path.sv-fill:not(.sv-ground):not(.sv-region-fill)')
        const regions = pick('path.sv-region-fill')
        const ground = pick('path.sv-ground')
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
        const owners = (set) => set.filter((s) => s.paths.some((q) => q.isPointInFill(pt))).length
        const n = { inside: 0, item: 0, region: 0, ground: 0, none: 0, shared: 0 }
        for (let y = y0; y <= y1; y += step)
          for (let x = x0; x <= x1; x += step) {
            pt.x = x
            pt.y = y
            if (!outline.some((o) => o.isPointInFill(pt))) continue
            n.inside++
            const k = owners(items)
            if (k > 1) n.shared++
            if (k) n.item++
            else if (owners(regions)) n.region++
            else if (owners(ground)) n.ground++
            else n.none++
          }
        return { ...n, groundIds: ground.map((g) => g.id), regions: regions.length, items: items.length }
      }, step)
      if (!c) {
        console.log(`${id.padEnd(32)} no outline`)
        continue
      }
      const pc = (k) => `${((c[k] / c.inside) * 100).toFixed(1).padStart(5)}%`
      console.log(`${id.padEnd(32)} structure ${pc('item')}  territory ${pc('region')}  ground ${pc('ground')}  UNOWNED ${pc('none')}  shared ${pc('shared')}   ground: ${c.groundIds.join(', ') || '—'}`)
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
