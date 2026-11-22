#!/usr/bin/env node
/**
 * Interaction cost of a plate view (dev server on :3019): moves the pointer
 * across the figure, then drags (pan) at 3× zoom, and reports the main-thread
 * time per event (script + style + layout + paint) from CDP metrics.
 *
 *   node scripts/perf-real.mjs [plate-id] [view-button-text]
 *   node scripts/perf-real.mjs bg-capsule-axial "Real kesim"
 */
import puppeteer from 'puppeteer-core'
const plate = process.argv[2] ?? 'bg-capsule-axial'
const viewBtn = process.argv[3] ?? 'Real kesim'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 1280, height: 800 })
await p.evaluateOnNewDocument(() => localStorage.setItem('na:lang', 'uz'))
await p.goto(process.env.NA_URL ?? 'http://localhost:3019/', { waitUntil: 'domcontentloaded' })
await p.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
await p.evaluate((id) => window.__atlas.getState().openSection(id), plate)
await new Promise((r) => setTimeout(r, 800))
await p.evaluate((t) => [...document.querySelectorAll('.section-viewer button')].find((x) => x.textContent.trim().startsWith(t))?.click(), viewBtn)
await p.waitForSelector('.sv-zoom svg', { timeout: 30000 })
await new Promise((r) => setTimeout(r, 2500))
const box = await p.evaluate(() => {
  const r = document.querySelector('.sv-zoom').getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height }
})
const cdp = await p.target().createCDPSession()
await cdp.send('Performance.enable')
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
const frame = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
async function run(name, n, step) {
  const a = await metrics()
  const t0 = Date.now()
  for (let i = 0; i < n; i++) {
    await step(i)
    await frame()
  }
  const z = await metrics()
  const d = (k) => ((z[k] - a[k]) * 1000) / n
  console.log(
    `${name.padEnd(6)} per event: wall ${((Date.now() - t0) / n).toFixed(1)} ms · script ${d('ScriptDuration').toFixed(1)} · style ${d('RecalcStyleDuration').toFixed(1)} · layout ${d('LayoutDuration').toFixed(1)} · task ${d('TaskDuration').toFixed(1)} ms`,
  )
}
const at = (i) => [box.x + box.w * (0.2 + (0.6 * ((i * 37) % 100)) / 100), box.y + box.h * (0.25 + (0.5 * ((i * 53) % 100)) / 100)]
await run('hover', 80, (i) => p.mouse.move(...at(i)))
// Zoom 3× with the wheel, then pan by dragging.
await p.mouse.move(box.x + box.w / 2, box.y + box.h / 2)
for (let i = 0; i < 6; i++) await p.mouse.wheel({ deltaY: -100 })
await frame()
await p.mouse.down()
await run('pan', 60, (i) => p.mouse.move(box.x + box.w / 2 + Math.sin(i / 6) * 120, box.y + box.h / 2 + Math.cos(i / 6) * 80))
await p.mouse.up()
await run('wheel', 30, (i) => p.mouse.wheel({ deltaY: i % 2 ? 60 : -60 }))
await b.close()
