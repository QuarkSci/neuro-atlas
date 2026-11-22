#!/usr/bin/env node
/**
 * Hand control, checked headless (no real camera there).
 *
 *   node scripts/shot-hands.mjs <out-dir> [--w 900 --h 560] [--camera]
 *
 * Default: synthetic hands (src/hands/synth.ts) are fed into the engine and
 * the gestures are exercised — hover, grab-turn, quick-pinch select, two-hand
 * zoom — with numbers printed and a screenshot per stage.
 * --camera: Chrome's fake webcam instead, to prove the camera → WASM → model
 * path starts without errors (the fake picture has no hands in it).
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const args = process.argv.slice(2)
const out = args[0] ?? 'hands-out'
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d)
const W = +opt('w', 900),
  H = +opt('h', 560)
const camera = args.includes('--camera')
const url = process.env.NA_URL ?? 'http://localhost:3019/'
fs.mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    '--hide-scrollbars',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
  ],
})
let failed = false
const check = (ok, msg) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`)
  if (!ok) failed = true
}
try {
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.error('[page error]', e.message))
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warn') && console.error(`[${m.type()}]`, m.text().slice(0, 300)))
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
  await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const shot = async (name) => {
    await sleep(250)
    await page.screenshot({ path: `${out}/${name}.png` })
    console.log('  saved', `${out}/${name}.png`)
  }

  if (camera) {
    await page.evaluate(() => window.__hands.getState().start('camera'))
    await page.waitForFunction(() => ['on', 'error'].includes(window.__hands.getState().status), { timeout: 60000 })
    const s = await page.evaluate(() => ({ status: window.__hands.getState().status, error: window.__hands.getState().error }))
    check(s.status === 'on', `camera path starts (status ${s.status}${s.error ? ', ' + s.error : ''})`)
    await sleep(1500)
    await shot('camera')
  } else {
    await page.evaluate(() => window.__hands.getState().start('synthetic'))
    await page.waitForFunction(() => window.__hands.getState().status === 'on' && window.__handsDev)
    // Headless WebGL is software-rendered (a frame or two per second), so steps wait on engine frames, not on time.
    const feed = (hands, frames = 1) =>
      page.evaluate(
        async (hands, frames) => {
          const d = window.__handsDev
          d.engine.feed(d.synthFrame(hands.map((h) => d.synthHand(h.x, h.y, h))))
          const until = d.engine.ticks + frames
          while (d.engine.ticks < until) await new Promise((r) => setTimeout(r, 10))
        },
        hands,
        frames,
      )
    const cam = () => page.evaluate(() => ({ p: window.__scene.camera.position.toArray(), t: window.__scene.controls.target.toArray() }))
    const dist = (c) => Math.hypot(c.p[0] - c.t[0], c.p[1] - c.t[1], c.p[2] - c.t[2])

    // 1. Open hand over the middle: hover names a structure.
    await feed([{ x: 0.5, y: 0.55 }], 4)
    const hov = await page.evaluate(() => ({ hovered: window.__atlas.getState().hovered, count: window.__hands.getState().count, gesture: window.__hands.getState().gesture }))
    check(hov.count === 1 && hov.gesture === 'point', `one hand, pointing (${hov.count}, ${hov.gesture})`)
    check(!!hov.hovered, `index finger hovers a structure (${hov.hovered})`)
    await shot('1-point')

    // 2. Pinch and drag: the model turns.
    const before = await cam()
    await feed([{ x: 0.5, y: 0.55, pinch: true }], 3)
    for (let i = 1; i <= 8; i++) await feed([{ x: 0.5 - i * 0.02, y: 0.55, pinch: true }])
    const g = await page.evaluate(() => window.__hands.getState().gesture)
    check(g === 'grab', `pinch reads as grab (${g})`)
    await shot('2-grab')
    const after = await cam()
    const moved = Math.hypot(...after.p.map((v, i) => v - before.p[i]))
    check(moved > 20, `grab turned the camera (${moved.toFixed(1)} mm)`)
    check(Math.abs(dist(after) - dist(before)) < 1, 'turning keeps the distance')

    // 3. Release, then a quick pinch selects.
    await feed([{ x: 0.5, y: 0.55 }], 12) // let go, let the coast die out
    await page.evaluate(() => window.__atlas.getState().clearSelection?.())
    const target = await page.evaluate(() => window.__atlas.getState().hovered)
    // A tap is judged in wall time (< 380 ms); here one frame alone can take longer, so widen the window for this step.
    await page.evaluate(() => (window.__handsDev.engine.tapMs = 60000))
    await feed([{ x: 0.5, y: 0.55, pinch: true }], 1)
    await feed([{ x: 0.5, y: 0.55 }], 2)
    await page.evaluate(() => (window.__handsDev.engine.tapMs = 380))
    const sel = await page.evaluate(() => [...window.__atlas.getState().selected])
    check(sel.length > 0, `quick pinch selected ${sel.join(',')} (hovered before: ${target})`)
    await shot('3-select')

    // 4. Two hands pinching, pulled apart: zoom in.
    await page.evaluate(() => window.__atlas.getState().clearSelection?.())
    await sleep(400)
    const z0 = dist(await cam())
    await feed(
      [
        { x: 0.42, y: 0.55, pinch: true, side: 'right' },
        { x: 0.58, y: 0.55, pinch: true, side: 'left' },
      ],
      3,
    )
    for (let i = 1; i <= 6; i++)
      await feed([
        { x: 0.42 - i * 0.02, y: 0.55, pinch: true, side: 'right' },
        { x: 0.58 + i * 0.02, y: 0.55, pinch: true, side: 'left' },
      ])
    const z1 = dist(await cam())
    const zg = await page.evaluate(() => window.__hands.getState().gesture)
    check(zg === 'zoom' && z1 < z0 * 0.85, `two-hand pull zooms in (${zg}, ${z0.toFixed(0)} → ${z1.toFixed(0)} mm)`)
    await shot('4-zoom')

    // 5. Hands gone: they fade and hover clears.
    await page.evaluate(() => window.__handsDev.engine.feed(null))
    await sleep(2500)
    const gone = await page.evaluate(() => ({ count: window.__hands.getState().count, hovered: window.__atlas.getState().hovered }))
    check(gone.count === 0 && !gone.hovered, `hands leave cleanly (${gone.count}, ${gone.hovered})`)
  }
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
