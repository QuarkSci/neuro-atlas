#!/usr/bin/env node
/**
 * Instrument engine (SX-2), checked headless with synthetic input.
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-tools.mjs <out-dir> [--w 900 --h 560]
 *
 * Distances against a brute-force point-to-triangle search, inside/outside on closed meshes, contact events,
 * mouse and (synthetic) hand giving the same tip, path length, CSV in MNI, exclusivity with the ruler, cost per move.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const args = process.argv.slice(2)
const out = args[0] ?? 'tools-out'
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
  await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const shot = async (name) => {
    await sleep(600)
    await page.screenshot({ path: `${out}/${name}.png` })
    console.log('  saved', `${out}/${name}.png`)
  }
  const frames = (n) =>
    page.evaluate(async (n) => {
      const r = window.__scene.renderer.info.render
      const to = r.frame + n
      while (r.frame < to) await new Promise((x) => setTimeout(x, 30))
    }, n)

  const kids0 = await page.evaluate(() => window.__scene.scene.children.length)
  check(await page.evaluate(() => window.__orMode.enterOR()), 'operating room on')
  await page.evaluate(() => window.__or.getState().set({ skin: 'ghost' }))
  await page.evaluate(() => window.__tool.getState().set({ tool: 'catheter' }))
  await frames(2)
  check(await page.evaluate(() => !!window.__orMode.tools() && window.__scene.scene.children.length > 0), 'catheter on, engine alive')

  // ── 1. distances against brute force ──
  const dist = await page.evaluate(async () => {
    const eng = window.__orMode.tools()
    const V = window.__scene.camera.position.constructor
    const targets = window.__scene.toolTargets()
    // Closest point on a triangle (Ericson, Real-Time Collision Detection).
    const cp = (p, a, b, c) => {
      const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]]
      const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
      const ab = sub(b, a),
        ac = sub(c, a),
        ap = sub(p, a)
      const d1 = dot(ab, ap),
        d2 = dot(ac, ap)
      if (d1 <= 0 && d2 <= 0) return a
      const bp = sub(p, b)
      const d3 = dot(ab, bp),
        d4 = dot(ac, bp)
      if (d3 >= 0 && d4 <= d3) return b
      const vc = d1 * d4 - d3 * d2
      const add = (u, v, k) => [u[0] + v[0] * k, u[1] + v[1] * k, u[2] + v[2] * k]
      if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, ab, d1 / (d1 - d3))
      const cpv = sub(p, c)
      const d5 = dot(ab, cpv),
        d6 = dot(ac, cpv)
      if (d6 >= 0 && d5 <= d6) return c
      const vb = d5 * d2 - d1 * d6
      if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, ac, d2 / (d2 - d6))
      const va = d3 * d6 - d5 * d4
      if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return add(b, sub(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6)))
      const den = 1 / (va + vb + vc)
      return add(add(a, ab, vb * den), ac, vc * den)
    }
    const res = []
    const pick = ['g-frontal-bone', targets.find((t) => t.system === 'ventricles').id, targets.find((t) => t.system === 'arteries').id]
    for (const id of pick) {
      const g = targets.find((t) => t.id === id).geometry
      g.computeBoundingBox()
      const bb = g.boundingBox
      const pos = g.getAttribute('position'),
        idx = g.index
      const n = idx ? idx.count / 3 : pos.count / 3
      const vert = (i) => [pos.getX(i), pos.getY(i), pos.getZ(i)]
      let worst = 0
      for (let k = 0; k < 12; k++) {
        const p = [bb.min.x + Math.random() * (bb.max.x - bb.min.x), bb.min.y + Math.random() * (bb.max.y - bb.min.y), bb.min.z + Math.random() * (bb.max.z - bb.min.z)]
        let best = Infinity
        for (let f = 0; f < n; f++) {
          const a = vert(idx ? idx.getX(f * 3) : f * 3),
            b = vert(idx ? idx.getX(f * 3 + 1) : f * 3 + 1),
            c = vert(idx ? idx.getX(f * 3 + 2) : f * 3 + 2)
          const q = cp(p, a, b, c)
          const dq = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
          if (dq < best) best = dq // degenerate triangles give NaN: skipped
        }
        worst = Math.max(worst, Math.abs(best - eng.distanceTo(id, new V(...p))))
      }
      res.push({ id, faces: n, worst })
    }
    return res
  })
  for (const r of dist) check(r.worst < 0.5, `${r.id} (${r.faces} faces): BVH distance vs brute force, worst error ${r.worst.toExponential(1)} mm (limit 0.5)`)

  // ── 2. inside / outside ──
  const ins = await page.evaluate(() => {
    const eng = window.__orMode.tools()
    const V = window.__scene.camera.position.constructor
    const t = window.__scene.toolTargets()
    // Ventricle with the most triangles (a solid, closed mesh).
    const vent = t.filter((x) => x.system === 'ventricles').sort((a, b) => (b.geometry.index?.count ?? 0) - (a.geometry.index?.count ?? 0))[0]
    const g = vent.geometry,
      pos = g.getAttribute('position'),
      idx = g.index
    const n = idx.count / 3
    let a = 0,
      b = 0,
      tot = 0
    let sample = null
    for (let k = 0; k < 60; k++) {
      const f = Math.floor((k / 60) * n)
      const v = [0, 1, 2].map((j) => new V(pos.getX(idx.getX(f * 3 + j)), pos.getY(idx.getX(f * 3 + j)), pos.getZ(idx.getX(f * 3 + j))))
      const nrm = v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize()
      const c = v[0]
        .clone()
        .add(v[1])
        .add(v[2])
        .multiplyScalar(1 / 3)
      const inn = eng.isInside(vent.id, c.clone().addScaledVector(nrm, -0.3))
      const outt = eng.isInside(vent.id, c.clone().addScaledVector(nrm, 0.3))
      if (inn && !outt) a++
      if (outt && !inn) b++
      if (inn && !outt && !sample) sample = { in: c.clone().addScaledVector(nrm, -0.3).toArray(), out: c.clone().addScaledVector(nrm, 0.3).toArray() }
      tot++
    }
    return { id: vent.id, a, b, tot, sample }
  })
  console.log(`  ${ins.id}: face-normal outward ${ins.a}/${ins.tot}, inward ${ins.b}/${ins.tot}`)
  check(Math.max(ins.a, ins.b) / ins.tot >= 0.9, 'inside / outside separates 0.3 mm either side of the surface in ≥ 90% of sampled faces')
  check(ins.a >= ins.b, 'mesh normals point outward (inside test is not inverted)')

  // ── 3. events: enter / exit once; vessel contact ──
  const ev = await page.evaluate(async () => {
    const eng = window.__orMode.tools()
    const V = window.__scene.camera.position.constructor
    const s = window.__tool
    const sleep = (m) => new Promise((r) => setTimeout(r, m))
    return { ok: true }
  })
  void ev
  const evt = await page.evaluate(
    async (sample, ventId) => {
      const eng = window.__orMode.tools()
      const V = window.__scene.camera.position.constructor
      const dir = new V(0, 0, -1)
      window.__tool.setState({ events: [] })
      eng.setInput(new V(...sample.out), dir)
      eng.setInput(new V(...sample.in), dir)
      eng.setInput(new V(...sample.in), dir)
      eng.setInput(new V(...sample.out), dir)
      await new Promise((r) => setTimeout(r, 150))
      const e = window.__tool.getState().events
      return {
        enters: e.filter((x) => x.type === 'enter' && x.id === ventId).length,
        exits: e.filter((x) => x.type === 'exit' && x.id === ventId).length,
        all: e.map((x) => `${x.type}:${x.id}`),
      }
    },
    ins.sample,
    ins.id,
  )
  check(evt.enters === 1 && evt.exits === 1, `ventricle: one enter, one exit event (${evt.all.join(' ')})`)

  const haz = await page.evaluate(async () => {
    const eng = window.__orMode.tools()
    const V = window.__scene.camera.position.constructor
    const t = window.__scene.toolTargets().find((x) => x.system === 'arteries')
    const pos = t.geometry.getAttribute('position')
    window.__tool.setState({ events: [] })
    const far = new V(0, 400, 400)
    eng.setInput(far, new V(0, 0, -1))
    eng.setInput(new V(pos.getX(10), pos.getY(10), pos.getZ(10)), new V(0, 0, -1))
    eng.setInput(new V(pos.getX(12), pos.getY(12), pos.getZ(12)), new V(0, 0, -1))
    await new Promise((r) => setTimeout(r, 150))
    const s = window.__tool.getState()
    return { contact: s.readout.contact, mm: s.readout.hazardMm, hazards: s.events.filter((x) => x.type === 'hazard').length, id: t.id }
  })
  check(haz.contact && haz.hazards === 1, `tip on an artery vertex: contact, one hazard event (${haz.mm.toFixed(2)} mm)`)
  await frames(2)
  await shot('contact-dark')

  // ── 4. mouse and hand give the same tip ──
  await page.evaluate(() => window.__orMode.applyCamera('surgeon', false))
  await page.evaluate(() => window.__tool.setState({ lock: false, depth: 0 }))
  await frames(2)
  const pt = { x: 0.52 * W, y: 0.5 * H }
  const mouse = await page.evaluate(async (pt) => {
    const sc = window.__scene
    const el = sc.hostElement
    const r = el.getBoundingClientRect()
    const hit = sc.pickPoint(pt.x, pt.y, [window.__orMode.activeRoom().scalpMesh])
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + pt.x, clientY: r.top + pt.y, pointerType: 'mouse', buttons: 0, bubbles: true }))
    const eng = window.__orMode.tools()
    const tip = eng.model.children[0].position.toArray()
    const { handTool } = await import('/src/or/tools/handBridge.ts')
    handTool.hand(r.left + pt.x + 5, r.top + pt.y + 5, false)
    handTool.hand(r.left + pt.x, r.top + pt.y, false)
    const tipHand = eng.model.children[0].position.toArray()
    // Wheel pushes the tip in along its line.
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -400, bubbles: true, cancelable: true }))
    const deeper = eng.model.children[0].position.toArray()
    const depth = window.__tool.getState().depth
    // Pinch grips: moving the hand down 40 px pushes 10 mm further.
    handTool.hand(r.left + pt.x, r.top + pt.y, true)
    handTool.hand(r.left + pt.x + 60, r.top + pt.y + 40, true)
    const gripDepth = window.__tool.getState().depth
    const gripTip = eng.model.children[0].position.toArray()
    handTool.hand(r.left + pt.x, r.top + pt.y, false)
    return { hit: hit ? hit.point.toArray() : null, tip, tipHand, deeper, depth, gripDepth, gripTip }
  }, pt)
  const dd = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
  check(mouse.hit && dd(mouse.hit, mouse.tip) < 1e-3, `mouse: tip is on the surface under the pointer (Δ ${mouse.hit ? dd(mouse.hit, mouse.tip).toExponential(1) : '—'} mm)`)
  check(dd(mouse.tip, mouse.tipHand) < 1e-3, `hand at the same screen point gives the same tip (Δ ${dd(mouse.tip, mouse.tipHand).toExponential(1)} mm)`)
  check(
    Math.abs(mouse.depth - 20) < 1e-6 && Math.abs(dd(mouse.tip, mouse.deeper) - 20) < 0.01,
    `wheel pushes the tip 20 mm along its line (depth ${mouse.depth}, moved ${dd(mouse.tip, mouse.deeper).toFixed(3)} mm)`,
  )
  check(Math.abs(mouse.gripDepth - 30) < 1e-6, `pinch + 40 px down pushes 10 mm more (depth ${mouse.gripDepth}), ray frozen while gripping`)
  await page.evaluate(() => window.__tool.setState({ depth: 25 }))
  await page.evaluate(() => {
    const el = window.__scene.hostElement
    const r = el.getBoundingClientRect()
    el.dispatchEvent(
      new PointerEvent('pointermove', { clientX: r.left + 0.5 * innerWidth * 0.99, clientY: r.top + 0.5 * innerHeight, pointerType: 'mouse', buttons: 0, bubbles: true }),
    )
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + 0.52 * innerWidth, clientY: r.top + 0.5 * innerHeight, pointerType: 'mouse', buttons: 0, bubbles: true }))
  })
  await frames(3)
  await shot('catheter-ghost-dark')
  await page.evaluate(() => window.__atlas.getState().setTheme('light'))
  await frames(3)
  await shot('catheter-ghost-light')
  await page.evaluate(() => window.__atlas.getState().setTheme('dark'))

  // click freezes
  const frozen = await page.evaluate(() => {
    const sc = window.__scene
    const a = sc.tapOverride(100, 100)
    const s1 = window.__tool.getState().lock
    sc.tapOverride(100, 100)
    return { a, s1, s2: window.__tool.getState().lock }
  })
  check(frozen.a && frozen.s1 && !frozen.s2, 'click freezes the instrument, a second click releases it')

  // ── 5. path ──
  const path = await page.evaluate(async () => {
    const eng = window.__orMode.tools()
    const V = window.__scene.camera.position.constructor
    window.__tool.setState({ rec: true, lock: false })
    eng.clearTrace()
    for (let i = 0; i <= 40; i++) {
      eng.setInput(new V(-30 + i, 20, 60), new V(0, 0, -1))
      await new Promise((r) => setTimeout(r, 55))
    }
    const csv = eng.csv().split('\n')
    return { n: eng.trace.length, path: window.__tool.getState().pathMm, head: csv[0], first: csv[1], rows: csv.length - 1, firstP: eng.trace[0].p }
  })
  check(Math.abs(path.path - 40) < 0.5 && path.n >= 35, `path 40 mm line recorded: ${path.path.toFixed(2)} mm in ${path.n} samples`)
  const x0 = +path.first.split(',')[1]
  check(
    path.head === 't_s,x_mni,y_mni,z_mni,skin_mm,hazard_mm' && path.rows === path.n && Math.abs(x0 + path.firstP[0]) < 0.01,
    `CSV: header, ${path.rows} rows, scene x ${path.firstP[0]} → MNI x ${x0}`,
  )

  // ── 6. exclusivity with the ruler, cost per move ──
  const ex = await page.evaluate(() => {
    window.__or.getState().set({ measure: true })
    const a = window.__tool.getState().tool
    window.__tool.getState().set({ tool: 'probe' })
    return { a, b: window.__or.getState().measure, c: window.__tool.getState().tool }
  })
  check(ex.a === 'off' && ex.b === false && ex.c === 'probe', 'ruler and instrument switch each other off')
  const cost = await page.evaluate(() => {
    const eng = window.__orMode.tools()
    const V = window.__scene.camera.position.constructor
    const c = eng.tip ?? new V()
    const t0 = performance.now()
    const N = 150
    for (let i = 0; i < N; i++) eng.setInput(new V(Math.sin(i) * 40, 20 + Math.cos(i * 1.3) * 30, 20 + Math.sin(i * 0.7) * 40), new V(0, 0, -1))
    return (performance.now() - t0) / N
  })
  console.log(`  query cost: ${cost.toFixed(2)} ms per move (headless CPU, 150 random tips in the head)`)
  check(cost < 20, `a move costs ${cost.toFixed(1)} ms (< 20)`)
  await frames(2)
  await shot('probe-dark')

  // ── 7. leave ──
  await page.evaluate(() => window.__orMode.exitOR())
  await sleep(1500)
  const kids1 = await page.evaluate(() => window.__scene.scene.children.length)
  check(kids1 === kids0 && (await page.evaluate(() => window.__tool.getState().tool)) === 'off', `instrument and room removed (${kids1}/${kids0} scene children, tool off)`)
} catch (e) {
  console.error(e)
  failed = true
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
