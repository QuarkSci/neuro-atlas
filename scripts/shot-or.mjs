#!/usr/bin/env node
/**
 * Virtual operating room (SX-1), checked headless.
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-or.mjs <out-dir> [--w 900 --h 560]
 *
 * Numbers first (scalp encloses the skull, real-millimetre scale, ruler, exact restore on leaving,
 * head-window compatibility), then screenshots: surgeon / microscope / ghost skin, dark and light.
 * Software WebGL draws ~1–2 frames/s, so the printed draws/s is a floor, not a Mac figure: the
 * panel's own readout (draws/s) is the one to read on the Mac with hands and head switched on.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const args = process.argv.slice(2)
const out = args[0] ?? 'or-out'
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d)
const W = +opt('w', 900),
  H = +opt('h', 560)
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
try {
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => {
    console.error('[page error]', e.message)
    failed = true
  })
  page.on('console', (m) => m.type() === 'error' && console.error('[console error]', m.text().slice(0, 300)))
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 90000 })
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
  const shot = async (name) => {
    await sleep(500)
    await page.screenshot({ path: `${out}/${name}.png` })
    console.log('  saved', `${out}/${name}.png`)
  }
  /** Wait until the scene has drawn `n` more frames. */
  const frames = (n) =>
    page.evaluate(async (n) => {
      const r = window.__scene.renderer.info.render
      const to = r.frame + n
      while (r.frame < to) await new Promise((x) => setTimeout(x, 30))
    }, n)

  // ── 0. before ──
  const grab = () =>
    page.evaluate(() => {
      const s = window.__scene,
        a = window.__atlas.getState()
      const v = (x) => [x.x, x.y, x.z]
      return {
        pos: v(s.camera.position),
        target: v(s.controls.target),
        up: v(s.camera.up),
        fov: s.camera.fov,
        near: s.camera.near,
        far: s.camera.far,
        min: s.controls.minDistance,
        max: s.controls.maxDistance,
        env: s.scene.environmentIntensity,
        atlas: {
          explode: a.explode,
          peel: a.peel,
          isolate: a.isolate,
          cutaway: a.cutaway,
          autoRotate: a.autoRotate,
          sidebar: a.sidebar,
          mode: a.mode,
          view: a.view,
          theme: a.theme,
        },
        ground: s.rig.ground.visible,
        lights: [s.rig.hemi.visible, s.rig.key.visible, s.rig.rim.visible, s.rig.fill.visible],
        kids: s.scene.children.length,
      }
    })
  // A non-default atlas state, so a restore that only "resets" would be caught.
  await page.evaluate(() => {
    const a = window.__atlas.getState()
    a.setView('lateral')
    window.__atlas.setState({ sidebar: true })
    window.__atlas.getState().setExplode(0.15)
  })
  await sleep(2500)
  const before = await grab()

  // ── 1. enter ──
  const entered = await page.evaluate(() => window.__orMode.enterOR())
  check(entered === true, 'enterOR() succeeds with the gross atlas loaded')
  await frames(3)
  const inOr = await grab()
  check(inOr.up[2] === 1 && inOr.up[1] === 0, `room up = patient's anterior axis (camera.up ${inOr.up})`)
  check(
    inOr.atlas.explode === 0 && inOr.atlas.sidebar === false && inOr.ground === false && inOr.lights.every((l) => !l),
    'atlas rig steps aside (explode 0, sidebar closed, ground and lights off)',
  )

  // ── 2. scale and scalp ──
  const geo = await page.evaluate(() => {
    const room = window.__orMode.activeRoom()
    const sc = window.__scene
    const sk = room.scalp
    const size = sk.box.getSize(new sk.box.min.constructor())
    // Scalp extents.
    sk.geometry.computeBoundingBox()
    const sb = sk.geometry.boundingBox
    const sbs = sb.getSize(new sb.min.constructor())
    // Every skull vertex must lie inside the scalp (radially) by about the soft-tissue thickness.
    const ids = [
      'g-frontal-bone',
      'g-left-parietal-bone',
      'g-right-parietal-bone',
      'g-occipital-bone',
      'g-left-temporal-bone',
      'g-right-temporal-bone',
      'g-mandible',
      'g-left-zygomatic-bone',
      'g-left-nasal-bone',
    ]
    let worst = Infinity,
      n = 0,
      outside = 0
    for (const id of ids) {
      const pos = sc.partMesh(id).geometry.getAttribute('position')
      const step = Math.max(1, Math.floor(pos.count / 400))
      for (let i = 0; i < pos.count; i += step) {
        const v = new sb.min.constructor(pos.getX(i), pos.getY(i), pos.getZ(i))
        const d = v.clone().sub(sk.centre)
        // Below the chin the grid hands over to the neck loft: judged by eye, not by this radial test.
        if (Math.acos(d.y / d.length()) > (147 * Math.PI) / 180) continue
        const surf = sk.surfaceAt(d).sub(sk.centre).length()
        const margin = surf - d.length()
        worst = Math.min(worst, margin)
        if (margin < 0) outside++
        n++
      }
    }
    // Table: top-surface width from the model itself.
    let table = null
    room.group.traverse((o) => {
      if (o.isMesh && o.geometry.type === 'ExtrudeGeometry') return
    })
    return { size: [size.x, size.y, size.z], scalp: [sbs.x, sbs.y, sbs.z], worst, n, outside, origin: room.origin.toArray(), table }
  })
  check(geo.outside === 0 && geo.worst >= 4, `scalp encloses ${geo.n} skull vertices (worst margin ${geo.worst.toFixed(1)} mm, ${geo.outside} outside)`)
  check(
    geo.size[0] > 120 && geo.size[0] < 180 && geo.size[1] > 190 && geo.size[1] < 270 && geo.size[2] > 150 && geo.size[2] < 240,
    `skull size plausible (${geo.size.map((v) => v.toFixed(0)).join(' × ')} mm)`,
  )
  console.log(`  scalp bounds ${geo.scalp.map((v) => v.toFixed(0)).join(' × ')} mm (head to the neck loft)`)

  // The scalp faces outward: the vertex normal at the vertex of the head points up and away from the centre.
  const nrm = await page.evaluate(() => {
    const room = window.__orMode.activeRoom()
    const g = room.scalp.geometry,
      p = g.getAttribute('position'),
      n = g.getAttribute('normal')
    let ok = 0
    const C = room.scalp.centre
    let total = 0
    for (let i = 0; i < p.count; i += 7) {
      const dx = p.getX(i) - C.x,
        dy = p.getY(i) - C.y,
        dz = p.getZ(i) - C.z
      if (dy < -0.5 * Math.hypot(dx, dy, dz)) continue
      total++
      if (dx * n.getX(i) + dy * n.getY(i) + dz * n.getZ(i) > 0) ok++
    }
    return { ok, total }
  })
  check(nrm.ok / Math.max(1, nrm.total) > 0.97, `scalp normals face outward (${nrm.ok} of ${nrm.total} sampled above the jaw line)`)

  // Room scale: measure two known table features through the room frame (rail separation = 620 + 24 mm).
  const rails = await page.evaluate(() => {
    const room = window.__orMode.activeRoom()
    const xs = []
    room.group.traverse((o) => {
      if (o.isMesh && o.geometry.parameters && o.geometry.parameters.width === 14 && o.geometry.parameters.height === 22) xs.push(o.position.x)
    })
    return xs
  })
  check(rails.length === 2 && Math.abs(Math.abs(rails[0] - rails[1]) - 644) < 0.01, `table rails ${Math.abs(rails[0] - rails[1])} mm apart (620 + 2 × 12)`)

  // ── 3. ruler: two surface points, distance independent of the pointer path ──
  await page.evaluate(() => window.__or.getState().set({ measure: true, skin: 'on' }))
  await sleep(300)
  const tapAt = (fx, fy) => page.evaluate((fx, fy) => window.__scene.tapOverride(fx * window.__scene.hostElement.clientWidth, fy * window.__scene.hostElement.clientHeight), fx, fy)
  const r1 = await tapAt(0.48, 0.45)
  const r2 = await tapAt(0.6, 0.55)
  const m = await page.evaluate(() => window.__or.getState())
  check(r1 && r2 && m.measures.length === 1 && m.pending === null, 'two taps on the head make one measurement')
  if (m.measures.length) {
    const me = m.measures[0]
    const d = Math.hypot(me.a[0] - me.b[0], me.a[1] - me.b[1], me.a[2] - me.b[2])
    check(Math.abs(d - me.mm) < 1e-6 && me.mm > 5 && me.mm < 200, `ruler reads ${me.mm.toFixed(1)} mm = Euclidean distance of its two points`)
  }
  await shot('ruler')
  await page.evaluate(() => window.__or.getState().set({ measure: false, measures: [], pending: null }))

  // ── 4. screenshots: surgeon / microscope / ghost / bone, both themes ──
  const setTheme = (t) => page.evaluate((t) => window.__atlas.getState().setTheme(t), t)
  for (const theme of ['dark', 'light']) {
    await setTheme(theme)
    await page.evaluate(() => window.__or.getState().set({ camera: 'surgeon', skin: 'on' }))
    await page.evaluate(() => window.__orMode.applyCamera('surgeon', false))
    await frames(3)
    await shot(`${theme}-surgeon`)
    await page.evaluate(() => window.__or.getState().set({ skin: 'ghost' }))
    await frames(3)
    await shot(`${theme}-ghost`)
    await page.evaluate(() => window.__or.getState().set({ skin: 'bone' }))
    await frames(3)
    await shot(`${theme}-bone`)
    await page.evaluate(() => window.__or.getState().set({ skin: 'off' }))
    await frames(3)
    await shot(`${theme}-brain`)
    await page.evaluate(() => window.__or.getState().set({ skin: 'on', camera: 'microscope' }))
    await page.evaluate(() => window.__orMode.applyCamera('microscope', false))
    await frames(3)
    await shot(`${theme}-microscope`)
    const fov = await page.evaluate(() => window.__scene.camera.fov)
    check(fov < 12, `microscope narrows the field (fov ${fov}°)`)
    await page.evaluate(() => window.__or.getState().set({ camera: 'surgeon' }))
  }
  await setTheme('dark')

  // ── 5. head window (HP-1) still works in the room ──
  await page.evaluate(() => {
    window.__orMode.applyCamera('surgeon', false)
    window.__hands.getState().setFeature('head', true, 'synthetic')
  })
  await page.waitForFunction(() => window.__hands.getState().status === 'on', { timeout: 30000 })
  await page.evaluate(() => (window.__handsDev.engine.calibFrames = 1))
  const face = (x) =>
    page.evaluate(async (x) => {
      const d = window.__handsDev
      d.engine.feedFace(d.synthFace(x, 0.45, 0.11))
      const until = d.engine.ticks + 3
      while (d.engine.ticks < until) await new Promise((r) => setTimeout(r, 10))
    }, x)
  await face(0.5)
  const pos0 = await page.evaluate(() => window.__scene.camera.position.toArray())
  await face(0.36)
  await frames(2)
  const skew = await page.evaluate(() => window.__scene.withEye(() => window.__scene.camera.projectionMatrix.elements[8]))
  const pos1 = await page.evaluate(() => window.__scene.camera.position.toArray())
  check(Math.abs(skew) > 1e-4, `head window skews the frustum in the room (${skew.toFixed(4)})`)
  check(Math.hypot(pos0[0] - pos1[0], pos0[1] - pos1[1], pos0[2] - pos1[2]) < 1e-6, 'orbit camera itself does not move with the head')
  await shot('head-window')
  await page.evaluate(() => window.__hands.getState().setFeature('head', false))
  await sleep(500)

  // ── 6. draws per second ──
  await page.evaluate(() => window.__orMode.applyCamera('surgeon', false))
  const fps = await page.evaluate(async () => {
    const r = window.__scene.renderer.info.render
    const f0 = r.frame,
      t0 = performance.now()
    while (performance.now() - t0 < 4000) await new Promise((x) => setTimeout(x, 50))
    return ((r.frame - f0) * 1000) / (performance.now() - t0)
  })
  console.log(`  draws/s in the room (software WebGL, floor figure): ${fps.toFixed(1)}`)

  // ── 7. leave: exact restore ──
  await page.evaluate(() => window.__orMode.exitOR())
  await sleep(3000)
  const after = await grab()
  const near = (a, b, tol = 1e-3) => a.every((v, i) => Math.abs(v - b[i]) < tol)
  check(
    near(after.pos, before.pos) && near(after.target, before.target) && near(after.up, before.up),
    `camera position, target and up restored (Δpos ${Math.hypot(...after.pos.map((v, i) => v - before.pos[i])).toExponential(1)})`,
  )
  check(
    after.fov === before.fov && after.near === before.near && after.far === before.far && after.min === before.min && after.max === before.max,
    `fov / near / far / distance limits restored (fov ${after.fov}/${before.fov}, near ${after.near}/${before.near}, far ${after.far}/${before.far}, dist ${after.min}-${after.max} / ${before.min}-${before.max})`,
  )
  check(JSON.stringify(after.atlas) === JSON.stringify(before.atlas), `atlas state restored ${JSON.stringify(after.atlas)}`)
  check(after.env === before.env && after.ground === before.ground && JSON.stringify(after.lights) === JSON.stringify(before.lights), 'environment, ground and lights restored')
  check(after.kids === before.kids, `scene graph back to ${before.kids} children (room removed, ${after.kids} now)`)
  await shot('back-in-atlas')
} catch (e) {
  console.error(e)
  failed = true
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
