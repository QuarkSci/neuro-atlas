#!/usr/bin/env node
/**
 * SX-4 bone drilling, headless: voxel volume, surface nets, drill session, on a synthetic slab (known thickness) and on the
 * real skull meshes at the Kocher point.
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-drill.mjs <out-dir>
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = process.argv[2] ?? 'drill-out'
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
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 90000 })
  await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
  check(await page.evaluate(() => window.__orMode.enterOR()), 'operating room on')

  const R = await page.evaluate(async () => {
    const { BoneVolume } = await import('/src/or/drill/volume.ts')
    const { meshChunk } = await import('/src/or/drill/mesher.ts')
    const { DrillSession, DRILL_PARAMS } = await import('/src/or/drill/session.ts')
    const { sceneBone } = await import('/src/or/drill/boneWorld.ts')
    const { sceneWorld } = await import('/src/or/evd/world.ts')
    const { findKocher } = await import('/src/or/evd/kocher.ts')
    const { EVD_PARAMS: P } = await import('/src/or/evd/params.ts')
    const res = {}

    // Synthetic skull: a flat slab 8 mm thick under the plane z = 100 (outer face up), plus a curved shell of radius 80, thickness 7.
    const slab = (thick) => ({ columns: () => [[4, 4 + thick]] })
    const shell = (R0, thick) => ({
      // ray origin o, direction d (unit) against a spherical shell centred at c = (0, 0, 100 − R0): intersect both spheres
      columns: (o, d) => {
        const c = [0, 0, 100 - R0]
        const oc = [o[0] - c[0], o[1] - c[1], o[2] - c[2]]
        const b = oc[0] * d[0] + oc[1] * d[1] + oc[2] * d[2]
        const cc = oc[0] ** 2 + oc[1] ** 2 + oc[2] ** 2
        const hit = (r) => {
          const disc = b * b - (cc - r * r)
          return disc < 0 ? null : [-b - Math.sqrt(disc), -b + Math.sqrt(disc)]
        }
        const out = hit(R0),
          inn = hit(R0 - thick)
        if (!out) return []
        // the ray enters at out[0]; bone until inn[0] (or out[1] when it misses the inner sphere)
        return [[out[0], inn ? inn[0] : out[1]]]
      },
    })
    const top = { center: [0, 0, 100], outerNormal: [0, 0, 1] }
    const volOf = (src) => new BoneVolume(src, top)

    // ── Thickness map ──
    let t0 = performance.now()
    const vs = volOf(slab(8))
    res.buildMs = performance.now() - t0
    const tm = vs.thicknessMap()
    res.slab = { min: tm.min, mean: tm.mean, max: tm.max, coverage: tm.coverage }
    const vc = volOf(shell(80, 7))
    const tc = vc.thicknessMap()
    res.shell = { min: tc.min, mean: tc.mean, max: tc.max, coverage: tc.coverage }
    res.layerSeq = [-1, 0.5, 3, 4.5, 7.8, 8.5, 12].map((d) => vs.layerAt([0, 0, 100 - d]))

    // ── Mesh: every interior edge shared by two triangles (closed apart from the patch border) ──
    t0 = performance.now()
    const edges = new Map()
    let tris = 0
    const q = (p) => p.map((x) => Math.round(x * 1e3)).join(',')
    for (const id of vs.allChunks()) {
      const m = meshChunk(vs, id)
      for (let i = 0; i < m.indices.length; i += 3) {
        tris++
        const k = [0, 1, 2].map((c) => q([m.positions[m.indices[i + c] * 3], m.positions[m.indices[i + c] * 3 + 1], m.positions[m.indices[i + c] * 3 + 2]]))
        for (let e = 0; e < 3; e++) {
          const a = k[e],
            b = k[(e + 1) % 3]
          const key = a < b ? a + '|' + b : b + '|' + a
          edges.set(key, (edges.get(key) ?? 0) + 1)
        }
      }
    }
    res.meshMs = performance.now() - t0
    res.tris = tris
    let open = 0,
      openInside = 0,
      over = 0
    for (const [key, n] of edges) {
      if (n > 2) over++
      if (n === 1) {
        open++
        const [a] = key.split('|')
        const p = a.split(',').map((x) => +x / 1e3)
        const l = vs.local(p)
        const onBorder = Math.abs(Math.abs(l[0]) - 19.75) < 0.6 || Math.abs(Math.abs(l[1]) - 19.75) < 0.6
        if (!onBorder) openInside++
      }
    }
    res.edges = { open, openInside, over }

    // ── Plunge on the slab: slow push through all layers ──
    function drill(vol, o) {
      const s = new DrillSession(vol, [0, 0, 100 - o.from])
      const axis = [0, 0, -1]
      const out = { states: [], maxCpuMs: 0, ticks: 0, cpu: [] }
      let tipDepth = o.from
      const dt = 1 / 60
      const goal = 100 - o.to
      const step = o.speed * dt
      for (let n = 0; n < 60 * 120; n++) {
        const here = s.position
        const tgt = [o.x ?? 0, o.y ?? 0, Math.max(goal, here[2] - step)]
        const c0 = performance.now()
        const st = s.update({ target: tgt, axis, push: o.push, dt, running: o.running ?? true })
        out.cpu.push(performance.now() - c0)
        out.ticks++
        out.last = st
        if (Math.abs(s.position[2] - goal) < 0.01 && n > 30) break
      }
      out.session = s
      return out
    }
    const seq = (s) => s.events.filter((e) => e.type === 'layer').map((e) => `${e.from}>${e.to}`)

    // A careful plunge to 4 mm: the hole is the bit's depth plus its radius.
    const a = drill(volOf(slab(8)), { from: -2, to: 4, push: 0.5, speed: 8 })
    const am = a.session.metrics()
    res.careful = { holeDepth: am.holeDepthMm, holeWidth: am.holeWidthMm, tipZ: a.session.position[2], removed: am.removedMm3, breached: am.breached, layers: seq(a.session) }

    // Through the bone slowly (push 0.4) and a hard plunge (push 1.0).
    const b = drill(volOf(slab(8)), { from: -2, to: 10, push: 0.4, speed: 12 })
    const bm = b.session.metrics()
    res.slow = { breached: bm.breached, breachPush: bm.breachPush, plunged: bm.plunged, warnings: bm.warnings, pastBone: bm.pastBoneMm, layers: seq(b.session), time: bm.durationS }
    const c = drill(volOf(slab(8)), { from: -2, to: 10, push: 1.0, speed: 60 })
    const cm = c.session.metrics()
    res.hard = { breached: cm.breached, breachPush: cm.breachPush, plunged: cm.plunged, warnings: cm.warnings, pastBone: cm.pastBoneMm, time: cm.durationS }

    // Push limits the speed: the same plunge at push 0.2 takes longer than at 1.0 when the learner moves faster than the bit can cut.
    const slowTime = drill(volOf(slab(8)), { from: -2, to: 6, push: 0.2, speed: 60 }).session.metrics().durationS
    const fastTime = drill(volOf(slab(8)), { from: -2, to: 6, push: 1.0, speed: 60 }).session.metrics().durationS
    res.pushTime = { slow: slowTime, fast: fastTime }

    // A bit that is not spinning cannot enter bone.
    const d = drill(volOf(slab(8)), { from: -2, to: 4, push: 1, speed: 20, running: false })
    res.stopped = { z: 100 - d.session.position[2], resistance: d.last.resistance, removed: d.session.metrics().removedMm3 }

    // Removed volume agrees with the voxel count.
    {
      const v = a.session.vol
      let n = 0
      for (let k = 0; k < v.nw; k++)
        for (let j = 0; j < v.nv; j++)
          for (let i = 0; i < v.nu; i++) {
            const id = v.idx(i, j, k)
            if (v.layer[id] >= 1 && v.layer[id] <= 3 && v.sdf[id] >= 0) n++
          }
      res.volumeCheck = { counted: n * v.h ** 3, reported: v.removedMm3 }
    }

    // ── Real skull at the Kocher point ──
    const world = sceneWorld(window.__scene)
    const k = findKocher(world, P, 'right')
    const SK = ['g-frontal-bone', 'g-right-parietal-bone']
    t0 = performance.now()
    const rv = new BoneVolume(sceneBone(window.__scene, SK), { center: k.entry, outerNormal: k.normal })
    res.real = { buildMs: performance.now() - t0, entry: k.entry, normal: k.normal }
    const rt = rv.thicknessMap()
    res.real.thick = { min: rt.min, mean: rt.mean, max: rt.max, coverage: rt.coverage }
    const thickHere = rv.thicknessAt(k.entry)
    res.real.thickHere = thickHere
    // Drill straight in along the inward normal.
    const inward = [-k.normal[0], -k.normal[1], -k.normal[2]]
    const p0 = [k.entry[0] - inward[0] * 3, k.entry[1] - inward[1] * 3, k.entry[2] - inward[2] * 3]
    const s = new DrillSession(rv, p0)
    const cpu = []
    let n = 0
    const goalDepth = thickHere - 0.4
    for (; n < 60 * 90; n++) {
      const here = s.position
      const dep = rv.depthBelowOuter(here)
      const stepv = 8 / 60
      const tgt = here.map((x, i) => x + inward[i] * stepv)
      const useTgt = dep < goalDepth || Number.isNaN(dep) ? tgt : here
      const c0 = performance.now()
      s.update({ target: useTgt, axis: inward, push: 0.5, dt: 1 / 60, running: true })
      cpu.push(performance.now() - c0)
      if (dep >= goalDepth) break
    }
    cpu.sort((x, y) => x - y)
    res.real.drill = { ticks: n, p50: cpu[Math.floor(cpu.length * 0.5)], p95: cpu[Math.floor(cpu.length * 0.95)], max: cpu[cpu.length - 1], metrics: s.metrics(), layers: seq(s) }
    // Mesh budget on the real volume, chunk rebuild after a cut.
    const { DrillMeshView } = await import('/src/or/drill/view.ts')
    const view = new DrillMeshView(rv)
    const tm0 = performance.now()
    view.sync(Infinity, true)
    res.real.firstMeshMs = performance.now() - tm0
    rv.takeDirty()
    const cut = []
    for (let i = 0; i < 40; i++) {
      const p = p0.map((x, j) => x + inward[j] * (3 + i * 0.12))
      const c0 = performance.now()
      rv.carveSphere(p, 2)
      view.sync(Infinity)
      cut.push(performance.now() - c0)
    }
    cut.sort((x, y) => x - y)
    res.real.cutMesh = { p50: cut[20], p95: cut[38], max: cut[39] }
    // The carved mesh appears in the scene; hide the real bones there for the picture.
    window.__scene.scene.add(view.group)
    for (const p of window.__scene.parts) if (SK.includes(p.id)) p.mesh.visible = false
    window.__view = view
    window.__rv = rv
    window.__k = k
    return res
  })

  // ── Synthetic slab ──
  check(
    Math.abs(R.slab.mean - 8) < 0.05 && R.slab.min > 7.95 && R.slab.max < 8.05 && R.slab.coverage > 0.99,
    `slab thickness map: ${f(R.slab.min)}–${f(R.slab.max)} mm, mean ${f(R.slab.mean)} (8)`,
  )
  check(
    Math.abs(R.shell.mean - 7) < 0.8 && R.shell.coverage > 0.9,
    `curved shell thickness map: mean ${f(R.shell.mean)} mm (7 along the plane normal grows off-axis), coverage ${f(R.shell.coverage)}`,
  )
  check(R.layerSeq.join(',') === 'air,outer-table,diploe,diploe,inner-table,dura,brain', `layer sequence with depth: ${R.layerSeq.join(' → ')}`)
  check(
    R.edges.openInside === 0 && R.edges.over === 0 && R.tris > 1000,
    `mesh closed across chunk seams: ${R.tris} tris, open edges off the border ${R.edges.openInside}, over-shared ${R.edges.over}`,
  )
  check(R.buildMs < 600, `volume build ${f(R.buildMs, 0)} ms (6400 columns, synthetic)`)

  check(Math.abs(R.careful.holeDepth - 4) <= 0.6, `hole depth ${f(R.careful.holeDepth)} mm for a tip at 4 mm (expected 4 ± 0.6)`)
  check(Math.abs(R.careful.holeWidth - 4) <= 0.7, `hole width ${f(R.careful.holeWidth)} mm for a 4 mm burr`)
  check(!R.careful.breached && R.careful.layers.join() === 'air>outer-table,outer-table>diploe', `careful drilling stays in the bone: ${R.careful.layers.join(', ')}`)
  check(
    R.slow.breached && !R.slow.plunged && R.slow.warnings === 0 && R.slow.breachPush < 0.6,
    `slow breakthrough: push ${f(R.slow.breachPush)}, no plunge flag, no warning, past bone ${f(R.slow.pastBone)} mm`,
  )
  check(R.slow.layers.join() === 'air>outer-table,outer-table>diploe,diploe>inner-table,inner-table>dura,dura>brain', `layers on the way: ${R.slow.layers.join(' · ')}`)
  check(R.hard.breached && R.hard.plunged && R.hard.warnings === 1, `hard push: plunge flagged (push ${f(R.hard.breachPush)}), ${R.hard.warnings} warning before it`)
  check(R.hard.pastBone > R.slow.pastBone, `a hard push goes further past the bone: ${f(R.hard.pastBone)} vs ${f(R.slow.pastBone)} mm`)
  check(R.pushTime.slow > R.pushTime.fast * 2, `light push cuts slower: ${f(R.pushTime.slow)} s vs ${f(R.pushTime.fast)} s for the same 6 mm`)
  check(
    R.stopped.removed === 0 && Math.abs(R.stopped.z) < 0.6 && R.stopped.resistance > 0.3,
    `a stopped bit does not enter bone (z ${f(R.stopped.z)} mm, resistance ${f(R.stopped.resistance)})`,
  )
  check(
    Math.abs(R.volumeCheck.counted - R.volumeCheck.reported) / Math.max(1, R.volumeCheck.reported) < 0.01,
    `removed volume ${f(R.volumeCheck.reported, 1)} mm³ = voxel count ${f(R.volumeCheck.counted, 1)}`,
  )

  // ── Real skull ──
  const r = R.real
  check(
    r.thick.coverage > 0.9 && r.thick.mean > 3 && r.thick.mean < 14,
    `real skull at Kocher: coverage ${f(r.thick.coverage)}, thickness ${f(r.thick.min)}–${f(r.thick.max)} mm, mean ${f(r.thick.mean)} (build ${f(r.buildMs, 0)} ms)`,
  )
  check(r.drill.layers.join().includes('outer-table>diploe') && r.drill.layers.join().includes('diploe>inner-table'), `real bone layers: ${r.drill.layers.join(' · ')}`)
  const hd = r.drill.metrics.holeDepthMm
  check(Math.abs(hd - (r.thickHere - 0.4)) <= 0.8, `real hole depth ${f(hd)} mm (column thickness ${f(r.thickHere)} mm, tip stopped 0.4 mm short, in the inner table)`)
  check(r.drill.p95 < 8, `drill tick CPU p50 ${f(r.drill.p50, 2)} / p95 ${f(r.drill.p95, 2)} / max ${f(r.drill.max, 1)} ms (budget 8 ms)`)
  check(
    r.cutMesh.p95 < 8,
    `carve + dirty-chunk remesh p50 ${f(r.cutMesh.p50, 2)} / p95 ${f(r.cutMesh.p95, 2)} / max ${f(r.cutMesh.max, 1)} ms (budget 8 ms); first full mesh ${f(r.firstMeshMs, 0)} ms`,
  )

  // ── Screenshots ──
  const sleep = (ms) => new Promise((rr) => setTimeout(rr, ms))
  await page.evaluate(() => window.__or.getState().set({ skin: 'off' }))
  await page.evaluate(() => {
    const k = window.__k
    const V = window.__scene.camera.position.constructor
    const sc = (p) => new V(-p[0], p[2], p[1])
    const c = sc(k.entry.map((v, i) => v - k.normal[i] * 3))
    const eye = sc(k.entry.map((v, i) => v + k.normal[i] * 70 + (i === 1 ? -12 : 0)))
    window.__scene.flyCamera(eye, c, { fov: 30, animate: false })
  })
  for (const theme of ['dark', 'light']) {
    await page.evaluate((th) => window.__atlas.getState().setTheme?.(th) ?? window.__atlas.setState({ theme: th }), theme)
    await sleep(1500)
    await page.screenshot({ path: `${out}/drill-${theme}.png` })
    console.log(`  saved ${out}/drill-${theme}.png`)
  }
  fs.writeFileSync(`${out}/drill-results.json`, JSON.stringify(R, null, 1))
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
