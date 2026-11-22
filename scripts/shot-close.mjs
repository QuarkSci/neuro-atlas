// Close-up of the glass with the brain zoomed in behind it (DPR 2):  node scripts/shot-close.mjs out.png [light|dark]
import puppeteer from 'puppeteer-core'
const out = process.argv[2],
  theme = process.argv[3] ?? ''
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({ width: 900, height: 440, deviceScaleFactor: 2 })
page.on('pageerror', (e) => console.error('[page error]', e.message))
await page.evaluateOnNewDocument((theme) => {
  localStorage.setItem('na:lang', 'uz')
  localStorage.setItem('na:sidebar', '0')
  if (theme) localStorage.setItem('na:theme', theme)
}, theme)
await page.goto(process.env.NA_URL ?? 'http://localhost:3019/', { waitUntil: 'networkidle0' })
await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
await page.evaluate(() => window.__atlas.getState().setView('lateral'))
await new Promise((r) => setTimeout(r, 7000))
// Zoom in so the cortex runs under both bars.
await page.mouse.move(450, 220)
for (let i = 0; i < 2; i++) {
  await page.mouse.wheel({ deltaY: -240 })
  await new Promise((r) => setTimeout(r, 120))
}
await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
await new Promise((r) => setTimeout(r, 1500))
await page.screenshot({ path: out })
await browser.close()
