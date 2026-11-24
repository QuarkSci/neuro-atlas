#!/usr/bin/env node
/**
 * DBS panel in the operating room (SX-6 logic + AG-16 data + AG-16 MER audio), headless.
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-dbs-ui.mjs <out-dir>
 *
 * Drives the panel by its buttons where cheap (begin, assisted AC–PC, next), the rest through DbsLink; checks that the panel docks,
 * the trajectory / target / tip are drawn, the MER layers read out in order, the stimulation window shows, and the report appears.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = process.argv[2] ?? 'dbs-ui-out'
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
  await page.evaluate(() => window.__or.getState().set({ skin: 'ghost', camera: 'surgeon' }))
  await page.evaluate(() => window.__dbsUi.getState().set({ open: true }))
  await sleep(700)
  const click = (text) =>
    page.evaluate((t) => {
      const b = [...document.querySelectorAll('.evd-dock button')].find((x) => x.textContent.trim().toLowerCase().startsWith(t.toLowerCase()))
      if (b) b.click()
      return !!b
    }, text)
  const dock = await page.evaluate(() => {
    const a = document.querySelector('.evd-dock .or-panel')?.getBoundingClientRect()
    const b = [...document.querySelectorAll('.or-panel')].find((e) => !e.closest('.evd-dock'))?.getBoundingClientRect()
    return a && b ? a.left >= b.right - 1 : false
  })
  check(dock, 'DBS panel docks beside the OR panel')
  check(await click('Begin'), 'Begin button works')
  await sleep(200)
  check(await click('Atlas AC'), 'assisted AC–PC button works')
  await sleep(200)
  const A = await page.evaluate(async () => {
    const u = () => window.__dbsUi.getState()
    const link = window.__orMode.dbs()
    const res = { frame: u().frame, planned: u().plannedAcpc, stepAfterFrame: u().step }
    const dbg = link.session.debug()
    const fr = dbg.frame
    // entry at the literature angles (65° / 20°) from the planned target
    const t = Math.tan
    const up = [t((20 * Math.PI) / 180), 1 / t((65 * Math.PI) / 180), 1]
    const l = Math.hypot(...up)
    const dir = fr.ex.map((_, i) => (fr.ex[i] * up[0] + fr.ey[i] * up[1] + fr.ez[i] * up[2]) / l)
    const entry = dbg.planned.map((v, i) => v + dir[i] * 95)
    // 1) the click path: aim the scene's tap hook at a scalp point, pick mode 'entry' (needs a trajectory step first)
    link.confirm('plan')
    res.stepTraj = u().step
    u().set({ pick: 'entry' })
    const cam = window.__scene.camera
    const host = window.__scene.hostElement.getBoundingClientRect()
    const V = cam.position.constructor
    const sc = (p) => new V(-p[0], p[2], p[1])
    const near = sc(dbg.planned.map((v, i) => v + dir[i] * 60)).project(cam)
    res.tapUsed = window.__scene.tapOverride(((near.x + 1) / 2) * host.width, ((1 - near.y) / 2) * host.height)
    res.clickEntry = !!u().analysis
    // 2) then the exact literature line for the rest
    link.setEntry(entry)
    res.analysis = u().analysis && { sag: u().analysis.sagittalDeg, cor: u().analysis.coronalDeg, coll: u().analysis.collisions, ok: u().analysis.anglesOk }
    link.confirm('trajectory')
    link.sealDura()
    link.confirm('burr')
    link.guideTo(15)
    link.confirm('guide')
    res.stepMer = u().step
    // MER scan, remember the target window
    const seq = []
    let enter = null,
      exit = null
    for (let d = 15; d >= -5; d -= 0.5) {
      link.drive(d)
      const r = u().reading
      if (!seq.length || seq[seq.length - 1] !== r.pattern.layerId) seq.push(r.pattern.layerId)
      if (r.pattern.inTarget) {
        if (enter === null) enter = d
        exit = d
      }
    }
    res.seq = seq
    res.window = [enter, exit]
    link.newTrack('medial')
    let e2 = null,
      x2 = null
    for (let d = 15; d >= -5; d -= 0.5) {
      link.drive(d)
      if (u().reading.pattern.inTarget) {
        if (e2 === null) e2 = d
        x2 = d
      }
    }
    res.window2 = [e2, x2]
    const pick = e2 !== null && e2 - x2 > enter - exit ? { id: 2, e: e2, x: x2 } : { id: 1, e: enter, x: exit }
    link.selectTrack(pick.id)
    link.drive(pick.e)
    link.mark('enter')
    link.drive(pick.x)
    link.mark('exit')
    const dep = (pick.e + pick.x) / 2
    link.drive(dep)
    link.confirm('mer')
    link.stimulate(2)
    res.stim = u().stim && { window: u().stim.windowMa, benefit: u().stim.benefit, effects: u().stim.effects.length }
    link.confirm('stim')
    res.stepImplant = u().step
    res.drawn = { line: link.line.visible, target: link.target.visible, tip: link.tip.visible }
    window.__dep = dep
    return res
  })
  check(
    A.frame && Math.abs(A.frame.lengthMm - 32) < 0.5 && A.frame.errorMm === 0 && A.stepAfterFrame === 'plan',
    `assisted AC–PC: ${A.frame?.lengthMm.toFixed(1)} mm, error ${A.frame?.errorMm} (planned ${A.planned?.map((v) => v.toFixed(1)).join(', ')})`,
  )
  check(A.stepTraj === 'trajectory', 'plan confirmed → trajectory')
  check(A.tapUsed === true && A.clickEntry, 'a click on the head set the entry point and analysed the line')
  check(
    A.analysis && A.analysis.ok && A.analysis.coll === 0 && Math.abs(A.analysis.sag - 65) < 0.7,
    `literature line: ${A.analysis?.sag.toFixed(0)}° / ${A.analysis?.cor.toFixed(0)}°, collisions ${A.analysis?.coll}`,
  )
  check(A.stepMer === 'mer', `burr → guide → ${A.stepMer}`)
  check(A.seq.length === 4 && /zi/i.test(A.seq[1]), `MER layers in the panel's reading: ${A.seq.join(' → ')}`)
  check(A.window[0] !== null && A.window[0] - A.window[1] >= 3, `target window ${A.window.join(' … ')} (medial track ${A.window2.join(' … ')})`)
  check(A.stim && A.stim.window > 0 && A.stepImplant === 'implant', `stimulation window ${A.stim?.window.toFixed(1)} mA, benefit ${A.stim?.benefit}; step ${A.stepImplant}`)
  check(A.drawn.line && A.drawn.target && A.drawn.tip, 'trajectory line, planned target and electrode tip are drawn')

  await page.evaluate(() => window.__tool.getState().set({ tool: 'off' }))
  await page.evaluate(() => window.__or.getState().set({ skin: 'off' }))
  await page.evaluate(() => {
    const d = window.__orMode.dbs().session.debug()
    const V = window.__scene.camera.position.constructor
    const sc = (p) => new V(-p[0], p[2], p[1])
    const t = sc(d.planned)
    window.__scene.flyCamera(new V(t.x - 230, t.y + 60, t.z + 50), t, { fov: 30, animate: false })
  })
  for (const theme of ['dark', 'light']) {
    await page.evaluate((th) => window.__atlas.getState().setTheme?.(th) ?? window.__atlas.setState({ theme: th }), theme)
    await sleep(1500)
    await page.screenshot({ path: `${out}/dbs-ui-${theme}.png` })
    console.log(`  saved ${out}/dbs-ui-${theme}.png`)
  }
  const rep = await page.evaluate(async () => {
    const link = window.__orMode.dbs()
    link.implant()
    await new Promise((r) => setTimeout(r, 400))
    const u = window.__dbsUi.getState()
    return { total: u.report?.total, radial: u.report?.metrics.radialErrorMm, text: document.querySelector('.evd-dock')?.textContent ?? '' }
  })
  check(rep.total >= 3.5 && rep.radial < 2.5, `report: total ${rep.total}, radial ${rep.radial?.toFixed(2)} mm`)
  check(/Report|Hisobot/.test(rep.text), 'the report is in the panel')
  await sleep(300)
  await page.screenshot({ path: `${out}/dbs-ui-report.png` })
  await page.evaluate(() => window.__orMode.exitOR())
  const closed = await page.evaluate(() => ({ open: window.__dbsUi.getState().open, dock: !!document.querySelector('.evd-dock') }))
  check(!closed.open && !closed.dock, 'leaving the room closes the DBS panel')
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
