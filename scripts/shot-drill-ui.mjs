#!/usr/bin/env node
/**
 * SX-4 in the operating room: the drill tool wired to ToolEngine (patch, cutout, frame loop, panel).
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-drill-ui.mjs <out-dir>
 *
 * The drill is driven through `ToolEngine.setInput` (what the mouse and the hand call), in real time: the tip goes down the
 * Kocher normal at 5 mm/s with the spindle on. Checks the layers, the hole, the cut-out of the atlas bone and the panel.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = process.argv[2] ?? 'drill-ui-out'
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
  await page.setViewport({ width: 900, height: 700, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => {
    console.error('[page error]', e.message)
    failed = true
  })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 90000 })
  await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
  check(await page.evaluate(() => window.__orMode.enterOR()), 'operating room on')
  await page.evaluate(() => window.__or.getState().set({ skin: 'off' }))
  await page.evaluate(() => window.__tool.getState().set({ tool: 'drill' }))
  await sleep(600)
  const ready = await page.evaluate(() => ({ ready: window.__drill.getState().ready, thick: window.__drill.getState().thicknessMm }))
  check(ready.ready && ready.thick > 4 && ready.thick < 9, `drill rig ready, bone ${ready.thick.toFixed(1)} mm at the burr site`)

  // Drive the tip down the Kocher normal at 5 mm/s, spindle on, light push.
  const run = await page.evaluate(async () => {
    const rig = window.__orMode.tools().drill
    const V = window.__scene.camera.position.constructor
    const sc = (p) => new V(-p[0], p[2], p[1])
    const n = rig.vol.w // inward, MNI
    const e = rig.entry
    const at = (d) => sc([e[0] + n[0] * d, e[1] + n[1] * d, e[2] + n[2] * d])
    const dir = sc(n).sub(sc([0, 0, 0]))
    window.__drill.getState().set({ spin: true, push: 0.4 })
    const thick = window.__drill.getState().thicknessMm
    const goal = thick - 0.4
    const seen = new Set()
    const log = { audio: [], haptics: [], maxDust: 0 }
    const wrap = (o, k, tag) => {
      const f = o[k].bind(o)
      o[k] = (e) => {
        log[tag].push(e.type)
        return f(e)
      }
    }
    wrap(rig.audio, 'event', 'audio')
    wrap(rig.haptics, 'event', 'haptics')
    window.__feel = log
    rig.manual = true
    // Fixed 60 Hz steps, 5 mm/s down, then 1.2 s of dwell (the spindle keeps cutting where the tip is).
    const steps = Math.round(((goal + 4) / 5 + 1.2) * 60)
    for (let i = 0; i <= steps; i++) {
      const d = Math.min(goal, -4 + (i / 60) * 5)
      window.__orMode.tools().setInput(at(d), dir)
      rig.tick(1 / 60, performance.now() + i * 20)
      seen.add(window.__drill.getState().layer)
      log.maxDust = Math.max(log.maxDust, rig.dust.object.geometry.drawRange.count)
    }
    const s = window.__drill.getState()
    return {
      layers: [...seen],
      hole: s.holeDepthMm,
      width: s.holeWidthMm,
      removed: s.removedMm3,
      thick,
      goal,
      layer: s.layer,
      rpm: s.rpm,
      breached: s.breached,
      events: s.events.map((x) => x.type),
    }
  })
  check(run.layers.includes('outer-table') && run.layers.includes('diploe') && run.layers.includes('inner-table'), `layers seen on the way: ${run.layers.join(' → ')}`)
  check(Math.abs(run.hole - run.goal) <= 1.2, `hole depth ${run.hole.toFixed(2)} mm for a tip ${run.goal.toFixed(2)} mm deep (bone ${run.thick.toFixed(2)})`)
  check(run.width > 3 && run.width < 6, `hole width ${run.width.toFixed(1)} mm`)
  check(run.removed > 10 && !run.breached, `bone removed ${run.removed.toFixed(0)} mm³, inner table intact`)
  check(run.rpm > 40000, `spindle at ${Math.round(run.rpm)} rpm under load`)

  const F = await page.evaluate(async () => {
    const rig = window.__orMode.tools().drill
    const log = window.__feel
    const dust = log.maxDust
    // Finish the job through the inner table with a hard push: warning + breakthrough reach audio and haptics.
    const V = window.__scene.camera.position.constructor
    const sc = (p) => new V(-p[0], p[2], p[1])
    const n = rig.vol.w
    const e = rig.entry
    const thick = window.__drill.getState().thicknessMm
    const dir = sc(n).sub(sc([0, 0, 0]))
    window.__drill.getState().set({ push: 0.9 })
    for (let i = 0; i < 60 * 4; i++) {
      const d = Math.min(thick + 1.5, thick - 0.4 + (i / 60) * 4)
      window.__orMode.tools().setInput(sc([e[0] + n[0] * d, e[1] + n[1] * d, e[2] + n[2] * d]), dir)
      rig.tick(1 / 60, performance.now() + 100000 + i * 20)
    }
    let soundErr = null
    try {
      rig.setSound(true)
    } catch (err) {
      soundErr = String(err)
    }
    const feel = await import('/src/or/drill/drillAudio.ts')
    const base = {
      t: 0,
      running: true,
      rpm: 60000,
      maxRpm: 75000,
      push: 0.5,
      tip: [0, 0, 0],
      axis: [0, 0, -1],
      depthMm: 1,
      layer: 'outer-table',
      layerProgress: 0.2,
      resistance: 0.5,
      speedMmS: 2,
      removedMm3: 0,
      toNextMm: 1,
    }
    return {
      maxDust: dust,
      audio: log.audio,
      haptics: log.haptics,
      soundErr,
      soundOn: window.__drill.getState().sound,
      pitchOuter: feel.drillPitchHz(base),
      pitchDiploe: feel.drillPitchHz({ ...base, layer: 'diploe' }),
      rumble: feel.hapticPulseForEvent({ t: 0, type: 'breakthrough', depthMm: 6, push: 0.9 }),
    }
  })
  check(F.maxDust > 20, `bone dust: up to ${F.maxDust} particles in the scene while cutting`)
  check(
    F.audio.includes('layer') && F.audio.includes('breakthrough') && F.audio.includes('plunge-warning'),
    `drill events reach the sound engine: ${[...new Set(F.audio)].join(', ')}`,
  )
  check(F.haptics.includes('breakthrough') && F.haptics.length === F.audio.length, `…and the rumble driver (${F.haptics.length} events, no gamepad = silent no-op)`)
  check(F.soundErr === null && F.soundOn, 'sound switch starts the engine without errors')
  check(F.pitchOuter > 100 && Math.abs(F.pitchOuter - F.pitchDiploe) > 5, `bit pitch differs by layer: outer table ${F.pitchOuter} Hz, diploë ${F.pitchDiploe} Hz`)
  check(F.rumble && F.rumble.strong >= 0.9, 'breakthrough gives the strongest rumble impulse')
  // Atlas bone is cut out where the patch is, and comes back with the tool.
  const cut = await page.evaluate(() => {
    const rig = window.__orMode.tools().drill
    return rig.view.group.parent !== null && rig.view.group.children.length > 0
  })
  check(cut, 'carved patch is in the scene')
  await page.evaluate(() => {
    const rig = window.__orMode.tools().drill
    const V = window.__scene.camera.position.constructor
    const sc = (p) => new V(-p[0], p[2], p[1])
    const e = rig.entry
    const n = rig.vol.w
    const eye = sc([e[0] - n[0] * 55 + 0, e[1] - n[1] * 55 - 12, e[2] - n[2] * 55])
    window.__scene.flyCamera(eye, sc(e), { fov: 30, animate: false })
  })
  for (const theme of ['dark', 'light']) {
    await page.evaluate((th) => window.__atlas.getState().setTheme?.(th) ?? window.__atlas.setState({ theme: th }), theme)
    await sleep(1500)
    await page.screenshot({ path: `${out}/drill-ui-${theme}.png` })
    console.log(`  saved ${out}/drill-ui-${theme}.png`)
  }
  // Tool off: the rig goes away and the atlas bone returns.
  await page.evaluate(() => window.__tool.getState().set({ tool: 'off' }))
  await sleep(400)
  const off = await page.evaluate(() => ({ rig: window.__orMode.tools().drill, ready: window.__drill.getState().ready }))
  const gone = await page.evaluate(() => !window.__scene.scene.getObjectByName('drill-dust'))
  check(off.rig === null && !off.ready && gone, 'tool off: drill rig and its dust disposed')
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
