#!/usr/bin/env node
/**
 * RL-A A-3 provisional membrane layers, headless: LayerStack (dura, arachnoid, CSF under the bone), the dura opening (incision, flap),
 * the bone-to-cortex gap map, and three screenshots (dura closed, opened with the flap back, brain with CSF and arachnoid only).
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-layers.mjs <out-dir>
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = process.argv[2] ?? 'layers-out'
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
    const an = window.__orMode.anatomy()
    const du = window.__orMode.dura()
    const room = window.__orMode.activeRoom()
    const res = { have: !!an && !!du }
    if (!res.have) return res
    res.buildMs = an.buildMs
    res.kinds = an.layers.map((l) => `${l.kind}:${l.mesh.geometry.getAttribute('position').count}`)
    res.bvh = an.layers.every((l) => !!l.mesh.geometry.boundsTree)
    res.unpickable = an.layers.every((l) => {
      const hits = []
      l.mesh.raycast({}, hits)
      return hits.length === 0
    })
    // Grid coverage and the gap map.
    const csv = an.gapCsv().split('\n')
    res.gapRows = csv.length - 1
    const gaps = csv.slice(1).map((r) => +r.split(',')[5])
    res.gapMin = Math.min(...gaps)
    res.gapMean = gaps.reduce((a, b) => a + b, 0) / gaps.length
    // Layer visibility by skin.
    const vis = () => Object.fromEntries(an.layers.map((l) => [l.kind, l.mesh.visible]))
    res.visBone = (an.setSkin('bone'), vis())
    res.visOff = (an.setSkin('off'), vis())
    an.setLayer('dura', true)
    res.visOffDura = vis()
    an.setLayer('dura', undefined)
    an.setSkin('bone')
    // Dura opening.
    const T3 = room.scalp.centre.constructor
    const site = room.scalp.surfaceAt(new T3(0.28, 0.88, 0.38))
    res.begin = du.begin(site, 12)
    res.stage0 = du.stage
    du.setCut(0.5)
    res.stage1 = du.stage
    res.lineVisible = du.line?.visible
    res.uOnMid = an.open.uOpOn.value
    du.setCut(1)
    res.stage2 = du.stage
    res.uOnOpen = an.open.uOpOn.value
    du.setFlap(1)
    res.rep = du.report()
    // The sign that lifts the far edge: a point of the flap's far side must end up above the dura (along the normal).
    const mesh = du.flapMesh
    mesh.updateMatrixWorld(true)
    const far = du.centre.clone().addScaledVector(du.hinge, -du.radius).sub(du.centre.clone().addScaledVector(du.hinge, du.radius))
    const pivotPos = mesh.position.clone()
    const farLocal = far
    const farWorld = farLocal.clone().applyQuaternion(mesh.quaternion).add(pivotPos)
    res.flapLift = farWorld.clone().sub(du.centre).dot(du.normal)
    du.setFlap(0)
    res.flapRest = du.report().flapDeg
    du.setCut(0)
    res.stage3 = du.stage
    res.uOff = an.open.uOpOn.value
    return res
  })
  check(R.have, 'LayerStack and DuraOpening exist in the room')
  if (R.have) {
    console.log(`  build ${f(R.buildMs, 0)} ms; layers ${R.kinds.join(', ')}`)
    check(R.kinds.length === 3 && R.bvh, 'three layers, each with a BVH (the audit reads them)')
    check(R.unpickable, 'layers are not pickable')
    check(R.gapRows > 5000, `gap map has ${R.gapRows} cells`)
    console.log(`  bone→cortex gap: min ${f(R.gapMin)} mean ${f(R.gapMean)} mm`)
    check(R.visBone.dura && R.visBone.arachnoid && R.visBone.csf, 'bone skin: dura, arachnoid and CSF shown')
    check(!R.visOff.dura && R.visOff.arachnoid && R.visOff.csf, 'brain-only skin: dura hidden, films shown')
    check(R.visOffDura.dura, 'dura can be forced on over the brain')
    check(R.begin && R.stage0 === 'closed', 'opening planned, dura still closed')
    check(R.stage1 === 'cutting' && R.lineVisible && R.uOnMid === 0, 'half the incision: cutting, line shown, nothing removed yet')
    check(R.stage2 === 'open' && R.uOnOpen === 1, 'full incision: disc removed from the dura')
    check(R.rep.flapDeg > 130 && R.rep.flapDeg < 140, `flap folds back ${f(R.rep.flapDeg, 0)}°`)
    check(R.flapLift > 5, `flap lifts away from the brain (far edge ${f(R.flapLift, 1)} mm above the dura)`)
    check(Number.isFinite(R.rep.csfMinMm) && R.rep.csfMinMm > 0, `CSF under the opening: min ${f(R.rep.csfMinMm)} mean ${f(R.rep.csfMeanMm)} mm`)
    check(R.flapRest === 0 && R.stage3 === 'closed' && R.uOff === 0, 'flap back at rest and incision undone → dura closed again')
  }

  // Screenshots from the microscope view over the Kocher region, brain with the dura forced on.
  await page.evaluate(async () => {
    const { useOR } = await import('/src/or/useOR.ts')
    useOR.setState({ skin: 'off' }) // brain alone: the scalp would hide everything (the stack follows through orMode)
    const an = window.__orMode.anatomy()
    const du = window.__orMode.dura()
    window.__orMode.applyCamera('microscope', false)
    an.setLayer('dura', true)
    const room = window.__orMode.activeRoom()
    const T3 = room.scalp.centre.constructor
    du.begin(room.scalp.surfaceAt(new T3(0.28, 0.88, 0.38)), 14)
  })
  await shot('1-dura-closed')
  await page.evaluate(() => {
    const du = window.__orMode.dura()
    du.setCut(1)
    du.setFlap(1)
  })
  await shot('2-dura-open')
  await page.evaluate(() => {
    const an = window.__orMode.anatomy()
    an.setLayer('dura', false)
  })
  await shot('3-csf-films')
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
