#!/usr/bin/env node
/**
 * One headless page, every cross-section figure: much faster than one
 * shot.mjs run per section (the 3D scene loads once).
 *
 *   node scripts/shot-sections.mjs outdir [--only id,id] [--setup "JS per section"] [--full]
 *
 * Saves <outdir>/<section-id>.png — the figure only, or the whole viewer with --full.
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const dir = args[0] ?? 'sections'
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : def
}
const only = opt('only', '')
const setup = opt('setup', '')
const full = args.includes('--full')
mkdirSync(dir, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--hide-scrollbars'],
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 860, deviceScaleFactor: 1.5 })
  page.on('pageerror', (e) => console.error('[page error]', e.message))
  await page.evaluateOnNewDocument(() => localStorage.setItem('na:lang', 'uz'))
  await page.goto(opt('url', 'http://localhost:3019/'), { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
  const ids = only
    ? only.split(',')
    : ['medulla', 'pons', 'midbrain', 'diencephalon', 'cerebellum'].flatMap((f) =>
        [...readFileSync(`src/data/sections/${f}.ts`, 'utf8').matchAll(/^    id: '([a-z0-9-]+)'/gm)].map((m) => m[1]),
      )
  await page.evaluate(() => window.__atlas.getState().setMode('learn'))
  for (const id of ids) {
    await page.evaluate((id) => window.__atlas.getState().openSection(id), id)
    await new Promise((r) => setTimeout(r, 250))
    if (setup) await page.evaluate(setup)
    await new Promise((r) => setTimeout(r, +opt('wait', 400)))
    const el = await page.$(full ? '.sv-card' : '.sv-figure')
    await (el ?? page).screenshot({ path: `${dir}/${id}.png` })
    console.log('saved', id)
  }
} finally {
  await browser.close()
}
