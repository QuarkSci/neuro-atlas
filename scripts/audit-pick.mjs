#!/usr/bin/env node
/**
 * Picking audit under a clip plane: over a grid on the sagittal (medial)
 * cut, compares what BrainScene.pick() names with the nearest surface
 * actually drawn there (every hit of every mesh, first one on the kept side
 * of all planes). Any mismatch means hover / tap names the wrong structure.
 *
 *   node scripts/audit-pick.mjs        → {"same": N, "diff": 0, "ex": {}} expected
 */
import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] })
const p = await b.newPage(); await p.setViewport({ width: 1400, height: 860 })
await p.goto('http://localhost:3019/', { waitUntil: 'networkidle0' })
await p.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
await p.evaluate(() => { const a = __atlas.getState(); a.setCutaway(true); a.setView('lateral') })
await new Promise((r) => setTimeout(r, 6000))
const res = await p.evaluate(() => {
  const s = __scene, T = s.camera.constructor // not used
  let same = 0, diff = 0, ex = {}
  for (let x = 520; x <= 940; x += 20) for (let y = 160; y <= 520; y += 20) {
    const cur = s.pick(x, y)
    // reference: every hit of every visible mesh, nearest one on the kept side of all planes
    const w = s.host.clientWidth, h = s.host.clientHeight
    s.raycaster.setFromCamera({ x: (x / w) * 2 - 1, y: -(y / h) * 2 + 1 }, s.camera)
    s.raycaster.firstHitOnly = false
    const hits = s.raycaster.intersectObjects(s.parts.filter((q) => q.mesh.visible).map((q) => q.mesh), false)
    const ok = hits.find((hh) => s.clipPlanes.every((pl) => pl.constant >= 1e4 || pl.distanceToPoint(hh.point) >= 0))
    const ref = ok ? ok.object.name : null
    if (cur === ref) same++
    else { diff++; const k = `${ref} -> shown as ${cur}`; ex[k] = (ex[k] || 0) + 1 }
  }
  return { same, diff, ex }
})
console.log(JSON.stringify(res, null, 1))
await b.close()
