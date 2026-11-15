#!/usr/bin/env node
/**
 * Liquid Glass check: close-ups of the glass controls at rest and while the
 * selection lens is held and dragged, at device pixel ratio 2.
 *
 *   node scripts/shot-glass.mjs outDir [--w 900 --h 560 --dpr 2 --wait 9000]
 *
 * Writes rest.png (whole page), dock-rest.png, dock-held.png, dock-drag.png,
 * top-held.png and prints the filters `liquidGlass.ts` has registered.
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const out = args[0] ?? 'glass-shots'
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : def
}
const width = +opt('w', 900),
  height = +opt('h', 560),
  dpr = +opt('dpr', 2),
  wait = +opt('wait', 9000)
mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--hide-scrollbars'],
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
try {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: dpr })
  page.on('pageerror', (e) => console.error('[page error]', e.message))
  page.on('console', (m) => m.type() === 'error' && console.error('[console]', m.text()))
  await page.evaluateOnNewDocument(() => localStorage.setItem('na:lang', 'uz'))
  await page.goto(opt('url', 'http://localhost:3019/'), { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
  // Spread the model so there is something behind every bar to refract.
  await page.evaluate(() => {
    const a = window.__atlas.getState()
    a.setView('front')
    a.setExplode(0.3)
  })
  // --stripes: a bright diagonal grid behind the UI, to make the bending measurable.
  if (args.includes('--stripes'))
    await page.evaluate(() => {
      const d = document.createElement('div')
      d.style.cssText =
        'position:absolute;inset:0;z-index:0;pointer-events:none;background:repeating-linear-gradient(45deg,#e8eef7 0 6px,#1b2a44 6px 12px, #ff8a3d 12px 18px, #1b2a44 18px 24px)'
      document.querySelector('.scene').after(d)
    })
  await sleep(wait)
  await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
  await sleep(300)
  console.log('filters:', await page.evaluate(() => [...document.querySelectorAll('filter')].map((f) => f.id).join(' ')))
  console.log('lg-on:', await page.evaluate(() => document.documentElement.classList.contains('lg-on')))

  const box = async (sel, pad = 26) => {
    const r = await page.evaluate((s) => {
      const b = document.querySelector(s).getBoundingClientRect()
      return { x: b.x, y: b.y, width: b.width, height: b.height }
    }, sel)
    return { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.width + pad * 2, height: Math.min(height - Math.max(0, r.y - pad), r.height + pad * 2) }
  }
  const centre = (sel, n) =>
    page.evaluate(
      (s, i) => {
        const b = document.querySelectorAll(s)[i].getBoundingClientRect()
        return [b.x + b.width / 2, b.y + b.height / 2]
      },
      sel,
      n,
    )

  await page.screenshot({ path: `${out}/rest.png` })
  const dock = await box('.bottom-dock')
  await page.screenshot({ path: `${out}/dock-rest.png`, clip: dock })

  // Press the first mode tab, then scrub towards the second.
  const [x0, y0] = await centre('.mode-tab', 0)
  const [x1] = await centre('.mode-tab', 1)
  await page.mouse.move(x0, y0)
  await page.mouse.down()
  await sleep(500)
  await page.screenshot({ path: `${out}/dock-held.png`, clip: dock })
  await page.mouse.move((x0 + x1) / 2, y0, { steps: 6 })
  await sleep(350)
  await page.screenshot({ path: `${out}/dock-drag.png`, clip: dock })
  await page.mouse.move(x0, y0, { steps: 4 })
  await page.mouse.up()
  await sleep(500)

  const [tx, ty] = await centre('.tab', 2)
  await page.mouse.move(tx, ty)
  await page.mouse.down()
  await sleep(500)
  await page.screenshot({ path: `${out}/top-held.png`, clip: await box('.top-actions') })
  await page.mouse.up()
  console.log('saved', out)
} finally {
  await browser.close()
}
