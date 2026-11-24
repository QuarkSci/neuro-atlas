#!/usr/bin/env node
/**
 * EVD panel wired into the operating room (SX-3 logic + AG-15 UI + SX-4 drill), headless.
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-evd-ui.mjs <out-dir>
 *
 * Real path: click on the scalp places the mark; the drill's breakthrough ends the burr-hole step; the catheter tip fed
 * by ToolEngine.setInput reaches the ventricle (CSF) and the report is produced; the panel docks beside the OR panel.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = process.argv[2] ?? 'evd-ui-out'
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1100, height: 760, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => {
    console.error('[page error]', e.message)
    failed = true
  })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 90000 })
  await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
  check(await page.evaluate(() => window.__orMode.enterOR()), 'operating room on')
  await page.evaluate(() => window.__or.getState().set({ skin: 'on', camera: 'surgeon' }))
  await page.evaluate(() => window.__evdUi.getState().set(true))
  await sleep(800)

  const dock = await page.evaluate(() => {
    const a = document.querySelector('.evd-dock .or-panel')?.getBoundingClientRect()
    const b = [...document.querySelectorAll('.or-panel')].find((e) => !e.closest('.evd-dock'))?.getBoundingClientRect()
    return a && b ? { a: [a.left, a.right], b: [b.left, b.right] } : null
  })
  check(dock && dock.a[0] >= dock.b[1] - 1, `EVD panel docks beside the OR panel (EVD from x=${dock?.a[0]}, OR panel ends x=${dock?.b[1]})`)

  const R = await page.evaluate(async () => {
    const link = window.__orMode.evd()
    const s = link.session
    const res = {}
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    s.begin({ level: 1, side: 'right', laser: true })
    s.setPosition({ side: 'right', neutralHead: true, headUp30to45: true, coagAndAntibiotic: true })
    s.confirm('position')
    res.step1 = s.snapshot().step
    const k = s.snapshot().kocher
    res.kocher = k && k.entry
    const V = window.__scene.camera.position.constructor
    // Mark: click on the scalp above the Kocher point, through the scene's tap hook.
    const sc = (p) => new V(-p[0], p[2], p[1])
    const cam = window.__scene.camera
    const host = window.__scene.hostElement.getBoundingClientRect()
    const proj = sc(k.entry).project(cam)
    // the scalp lies above the skull: aim at the point 7 mm outwards along the normal
    const out7 = sc(k.entry.map((v, i) => v + k.normal[i] * 7)).project(cam)
    const x = ((out7.x + 1) / 2) * host.width,
      y = ((1 - out7.y) / 2) * host.height
    res.tapUsed = window.__scene.tapOverride(x, y)
    const m = s.snapshot().mark
    res.mark = m && { err: m.errorMm, ok: m.onTarget, flags: m.flags }
    res.markBall = link.group.children[0].visible
    res.targetRing = link.group.children[1].visible
    void proj
    s.confirm('mark')
    s.confirm('incision')
    res.stepBurr = s.snapshot().step

    // Burr: drill through the inner table with the drill tool; the breakthrough must end the step.
    window.__tool.getState().set({ tool: 'drill' })
    await sleep(500)
    const rig = window.__orMode.tools().drill
    rig.manual = true
    const inward = rig.vol.w
    const e = rig.entry
    const at = (d) => sc([e[0] + inward[0] * d, e[1] + inward[1] * d, e[2] + inward[2] * d])
    const dir = sc(inward).sub(sc([0, 0, 0]))
    window.__drill.getState().set({ spin: true, push: 0.4 })
    const thick = window.__drill.getState().thicknessMm
    for (let i = 0; i < 60 * 6; i++) {
      const d = Math.min(thick + 1.5, -4 + (i / 60) * 4)
      window.__orMode.tools().setInput(at(d), dir)
      rig.tick(1 / 60, performance.now() + i * 20)
    }
    res.afterDrill = s.snapshot().step
    res.drillBreached = window.__drill.getState().breached
    s.confirm('dura')

    // Catheter along the ideal line from the real entry.
    window.__tool.getState().set({ tool: 'catheter' })
    await sleep(500)
    const ideal = s.snapshot().kocher.ideal
    const cat = (d) => sc(k.entry.map((v, i) => v + ideal[i] * d))
    const cdir = sc(ideal).sub(sc([0, 0, 0]))
    res.stepInsert = s.snapshot().step
    for (let d = -10; d <= 70; d += 1) {
      window.__orMode.tools().setInput(cat(d), cdir)
      if (s.snapshot().csf) break
    }
    const sn = s.snapshot()
    res.csf = sn.csf
    res.tip = sn.tip && { monro: sn.tip.monroMm, angle: sn.tip.angleToIdealDeg, table: sn.tip.tableDepthMm }
    res.passes = sn.passes
    res.stepAfter = sn.step
    window.__evdSnap = sn
    return res
  })
  check(R.step1 === 'mark', `position confirmed → step ${R.step1}`)
  check(R.tapUsed === true && R.mark && R.mark.err < 12, `click on the scalp placed the mark (error ${R.mark?.err?.toFixed(1)} mm, flags ${R.mark?.flags?.join(',') || 'none'})`)
  check(R.markBall && R.targetRing, 'mark ball and Kocher ring (laser) are drawn')
  check(R.stepBurr === 'burr', `incision confirmed → step ${R.stepBurr}`)
  check(R.drillBreached && R.afterDrill === 'dura', `drill breakthrough ended the burr step → ${R.afterDrill}`)
  check(R.stepInsert === 'insert', `dura confirmed → step ${R.stepInsert}`)
  check(
    R.csf && R.passes === 1,
    `catheter fed by ToolEngine reached the ventricle: CSF, ${R.passes} pass, Monro ${R.tip?.monro?.toFixed(1)} mm, angle ${R.tip?.angle?.toFixed(1)}°`,
  )

  await sleep(300) // the panel gets the last (throttled) snapshot
  const panelDepth = await page.evaluate(() => document.querySelector('.evd-dock')?.textContent ?? '')
  check(/Passes:?\s*1|O.tishlar:?\s*1/i.test(panelDepth) || !/Awaiting CSF/.test(panelDepth), 'panel shows the final catheter state, not a stale throttled one')
  await page.evaluate(() => window.__tool.getState().set({ lock: true })) // no re-aim from the pointer while the picture is taken
  await page.evaluate(() => {
    const k = window.__evdSnap.kocher
    const V = window.__scene.camera.position.constructor
    const sc = (p) => new V(-p[0], p[2], p[1])
    window.__orMode.activeRoom?.()
    const t = sc(k.entry.map((v, i) => v + k.ideal[i] * 30))
    window.__scene.flyCamera(new V(t.x - 300, t.y + 80, t.z + 30), t, { fov: 32, animate: false })
  })
  await page.evaluate(() => window.__or.getState().set({ skin: 'ghost' }))
  for (const theme of ['dark', 'light']) {
    await page.evaluate((th) => window.__atlas.getState().setTheme?.(th) ?? window.__atlas.setState({ theme: th }), theme)
    await sleep(1500)
    await page.screenshot({ path: `${out}/evd-ui-${theme}.png` })
    console.log(`  saved ${out}/evd-ui-${theme}.png`)
  }
  // Finish → report in the panel; exiting the room closes everything.
  const fin = await page.evaluate(async () => {
    const s = window.__orMode.evd().session
    s.seat()
    s.confirm('secure')
    const rep = s.finish()
    return rep && { total: rep.total, kakarla: rep.metrics.kakarla.grade }
  })
  check(fin && fin.kakarla <= 2 && fin.total > 3, `report: total ${fin?.total}, Kakarla ${fin?.kakarla}`)
  await page.evaluate(() => window.__orMode.exitOR())
  const closed = await page.evaluate(() => ({ open: window.__evdUi.getState().open, dock: !!document.querySelector('.evd-dock') }))
  check(!closed.open && !closed.dock, 'leaving the room closes the EVD panel')
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
