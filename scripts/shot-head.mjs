#!/usr/bin/env node
/**
 * RL-B B-1 layered scalp and incision, headless: HeadLayers (skin, fat, galea, pericranium, temporalis), the slot test per layer, retractor,
 * bone exposure, the hook from the EVD incision step, and three screenshots (hairline cut, skin opened, to the bone with the retractor).
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-head.mjs <out-dir>
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = process.argv[2] ?? 'head-out'
const url = process.env.NA_URL ?? 'http://localhost:3019/'
fs.mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--hide-scrollbars'],
})
let failed = false
const check = (ok, msg) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`)
  if (!ok) failed = true
}
const f = (x, n = 2) => (typeof x === 'number' ? x.toFixed(n) : String(x))
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 900, height: 560, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => {
    console.error('[page error]', e.message)
    failed = true
  })
  page.on('console', (m) => m.type() === 'error' && console.error('[console]', m.text()))
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 90000 })
  await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
  check(await page.evaluate(() => window.__orMode.enterOR()), 'operating room on')
  const shot = async (name) => {
    await new Promise((r) => setTimeout(r, 1800))
    await page.screenshot({ path: `${out}/${name}.png` })
  }

  const R = await page.evaluate(async () => {
    const head = window.__orMode.head()
    const res = { have: !!head }
    if (!head) return res
    const room = window.__orMode.activeRoom()
    const V = room.scalp.centre.constructor
    const site = new V(0.28, 0.88, 0.38)
    const t0 = performance.now()
    res.begin = head.begin(room.scalp.surfaceAt(site), 25, null)
    res.beginMs = performance.now() - t0
    res.meshes = head.group.children.map((c) => c.name).filter((n) => n.startsWith('head-'))
    res.r0 = head.report()
    res.exposed0 = head.boneExposed
    head.setCut(1)
    res.r1 = head.report()
    head.setDepth(0.25)
    head.setRetract(0.8)
    res.r2 = head.report()
    res.exposed2 = head.boneExposed
    head.setDepth(1)
    res.r3 = head.report()
    res.exposed3 = head.boneExposed
    res.skullShown = window.__atlas.getState().visible.includes('skull')
    res.retractorVisible = head.retractor?.visible
    // Layers do not pick (the scalp keeps picking), skin brain-only hides the sheets.
    res.unpickable = head.group.children.every((c) => {
      const h = []
      c.raycast({}, h)
      return h.length === 0
    })
    head.setSkin('off')
    res.hiddenOff = !head.group.visible
    head.setSkin('on')
    head.close()
    res.closed = !head.active
    res.skullHidden = !window.__atlas.getState().visible.includes('skull')
    return res
  })
  check(R.have, 'HeadLayers exists in the room')
  if (R.have) {
    check(R.begin, `incision planned (${f(R.beginMs, 0)} ms)`)
    check(
      ['head-fat', 'head-galea', 'head-pericranium'].every((n) => R.meshes.includes(n)),
      `layer sheets: ${R.meshes.join(', ')}`,
    )
    check(
      R.r0.thicknessMm > 2 && R.r0.thicknessMm < 12,
      `soft tissue ${f(R.r0.thicknessMm)} mm at the site (provisional: skin ${f(R.r0.layersMm.skin)}, fat ${f(R.r0.layersMm.fat)}, galea ${f(R.r0.layersMm.galea)}, pericranium ${f(R.r0.layersMm.pericranium)})`,
    )
    check(R.r0.cutThrough === null && !R.exposed0, 'before the cut: nothing cut, bone covered')
    check(Math.abs(R.r1.lengthMm - 25) < 0.01 && R.r1.cutThrough === null, 'full-length line only (depth 0): still not cut')
    check(R.r2.cutThrough === 'skin' && !R.exposed2, 'depth 0.25: through the skin only')
    check(R.r3.cutThrough === 'pericranium' && R.exposed3 && R.r3.boneAreaMm2 > 100, `depth 1 + retraction: bone exposed (${f(R.r3.boneAreaMm2, 0)} mm²)`)
    check(R.skullShown, 'the bone layer is shown under the skin while the wound is open')
    check(R.retractorVisible, 'retractor stands in the wound')
    check(R.unpickable, 'layer sheets are not pickable')
    check(R.hiddenOff, 'brain-only skin hides the scalp layers')
    check(R.closed && R.skullHidden, 'closing the incision restores the bone layer')
  }

  // The hook: the EVD session reaching the incision step plans the incision at the mark.
  const H = await page.evaluate(async () => {
    const s = window.__orMode.evd().session
    const head = window.__orMode.head()
    const res = {}
    s.begin({ level: 1, side: 'right', laser: true })
    s.setPosition({ side: 'right', neutralHead: true, headUp30to45: true, coagAndAntibiotic: true })
    s.confirm('position')
    const k = s.snapshot().kocher
    s.placeMark(k.entry)
    res.beforeStep = head.active
    s.confirm('mark')
    res.step = s.snapshot().step
    res.active = head.active
    res.offset = head.report()?.offsetMm
    return res
  })
  check(H.step === 'incision' && H.active, `EVD incision step plans the scalp incision (offset from Kocher ${f(H.offset, 1)} mm)`)

  // Screenshots: microscope view, skin layer on.
  await page.evaluate(async () => {
    const { useOR } = await import('/src/or/useOR.ts')
    useOR.setState({ skin: 'on', camera: 'microscope' })
    const head = window.__orMode.head()
    const room = window.__orMode.activeRoom()
    const V = room.scalp.centre.constructor
    head.begin(room.scalp.surfaceAt(new V(0.28, 0.88, 0.38)), 25)
    head.setCut(1)
  })
  await shot('1-line')
  await page.evaluate(() => {
    const head = window.__orMode.head()
    head.setDepth(0.7)
    head.setRetract(0.7)
  })
  await shot('2-layers')
  await page.evaluate(() => {
    const head = window.__orMode.head()
    head.setDepth(1)
    head.setRetract(1)
  })
  await shot('3-bone-retractor')
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
