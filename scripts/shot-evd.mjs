#!/usr/bin/env node
/**
 * SX-3 EVD logic, headless on the real atlas meshes plus pure-function checks.
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-evd.mjs <out-dir>
 *
 * Kocher point from the meshes, mark judging, the step machine (order errors), and six synthetic catheter runs: ideal,
 * lateral miss, contralateral ventricle, two passes, tremor, early entry. A good run must score well and a bad one badly.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = process.argv[2] ?? 'evd-out'
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
    const { sceneWorld } = await import('/src/or/evd/world.ts')
    const { findKocher, judgeMark } = await import('/src/or/evd/kocher.ts')
    const { EVD_PARAMS: P } = await import('/src/or/evd/params.ts')
    const { EvdSession } = await import('/src/or/evd/session.ts')
    const { tremorRms } = await import('/src/or/evd/score.ts')
    const world = sceneWorld(window.__scene)
    const res = {}

    // ── pure: tremor filter ──
    const sine = (hz, amp, secs = 4) => Array.from({ length: secs * 60 }, (_, i) => ({ t: i / 60, p: [amp * Math.sin(2 * Math.PI * hz * (i / 60)), 0, 0] }))
    res.tremor8 = tremorRms(sine(8, 1))
    res.tremor05 = tremorRms(sine(0.5, 10))
    res.tremor25 = tremorRms(sine(25, 1))
    res.tremorStill = tremorRms(sine(8, 0))

    // ── Kocher ──
    const t0 = performance.now()
    const k = findKocher(world, P, 'right')
    res.kocherMs = performance.now() - t0
    window.__k = k
    res.k = k && { entry: k.entry, lateral: k.lateralMm, ahead: k.aheadOfCoronalMm, samples: k.sutureSamples, len: k.lengthMm, ghajar: k.ghajarVsIdealDeg, normalZ: k.normal[2] }
    const onSkull = world.raycast(['g-frontal-bone', 'g-right-parietal-bone'], [k.entry[0], k.entry[1], 300], [0, 0, -1])
    res.entryOnSkullMm = Math.hypot(...k.entry.map((v, i) => v - onSkull.point[i]))
    const sut = k.sutureAt(28)
    res.aheadCheck = k.entry[1] - sut[1]
    const mk = (p) => judgeMark(k, P, 'right', p)
    res.mIdeal = mk(k.entry)
    res.mMedial = mk([12, k.entry[1], 70])
    res.mBehind = mk([28, sut[1] - 12, 70])
    res.mLeft = mk([-28, k.entry[1], 70])

    // ── Catheter runs ──
    const unit = (a) => {
      const l = Math.hypot(...a)
      return a.map((x) => x / l)
    }
    const sub = (a, b) => a.map((x, i) => x - b[i])
    const add = (a, b, s = 1) => a.map((x, i) => x + b[i] * s)
    const rotZ = (v, deg) => {
      const c = Math.cos((deg * Math.PI) / 180),
        s = Math.sin((deg * Math.PI) / 180)
      return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]
    }

    function newRun() {
      let clock = 0
      const s = new EvdSession(world, P, () => clock)
      s.begin({ level: 1, side: 'right', laser: true })
      return {
        s,
        tick: (dt) => (clock += dt),
        get clock() {
          return clock
        },
      }
    }
    function prep(r) {
      r.s.setPosition({ side: 'right', neutralHead: true, headUp30to45: true, coagAndAntibiotic: true })
      r.tick(5)
      r.s.confirm('position')
      r.s.placeMark(k.entry)
      r.tick(8)
      r.s.confirm('mark')
      for (const id of ['incision', 'burr', 'dura']) {
        r.tick(10)
        r.s.confirm(id)
      }
    }
    // Move the tip along `dir` from `entry` between depths d0 → d1 (below the outer table), mm/s speed, optional jitter fn(t) → offset.
    function move(r, entry, dir, d0, d1, jit) {
      const speed = 12,
        dt = 1 / 60
      const sgn = Math.sign(d1 - d0)
      for (let d = d0; sgn > 0 ? d <= d1 : d >= d1; d += sgn * speed * dt) {
        r.tick(dt)
        let tip = add(entry, dir, d)
        if (jit) tip = add(tip, jit(r.clock), 1)
        r.s.feed({ t: r.clock, tip, dir, scalpDepthMm: d + 7, tableDepthMm: null })
      }
    }
    const brief = (r) => {
      const rep = r.s.finish()
      const sn = r.s.snapshot()
      return { rep, sn }
    }
    const pick = (rep) =>
      rep && {
        k: rep.metrics.kakarla.grade,
        region: rep.metrics.kakarla.region,
        passes: rep.metrics.passes,
        angle: rep.metrics.angleErrDeg,
        monro: rep.metrics.tipToMonroMm,
        depth: rep.metrics.depthMm,
        ideal: rep.metrics.idealDepthMm,
        coll: rep.metrics.collisionIds,
        minH: rep.metrics.minHazardMm,
        tremor: rep.metrics.tremorRmsMm,
        eff: rep.metrics.pathEfficiency,
        seq: rep.metrics.sequenceErrors,
        total: rep.total,
        caps: rep.caps.length,
        scores: Object.fromEntries(Object.entries(rep.scores).map(([n, v]) => [n, v.score])),
        dur: rep.metrics.durationS,
      }

    // 1. ideal
    {
      const r = newRun()
      prep(r)
      const E = k.entry,
        D = k.ideal
      const tf = performance.now()
      move(r, E, D, -30, 76)
      res.feedMs = (performance.now() - tf) / (106 / 0.2)
      r.s.seat()
      r.tick(4)
      r.s.confirm('secure')
      const { rep, sn } = brief(r)
      res.ideal = pick(rep)
      res.idealCsf = sn.csf
      res.idealSteps = sn.steps.map((x) => x.status).join(',')
      res.idealWarnEvents = sn.events.filter((e) => e.type === 'warn').map((e) => e.partId)
      res.idealCsfDepth = sn.events.find((e) => e.type === 'csf')?.depthMm
    }
    // 2. lateral miss, 25° toward lateral
    {
      const r = newRun()
      prep(r)
      const D = unit(rotZ(k.ideal, 25))
      move(r, k.entry, D, -30, 70)
      r.s.seat()
      r.tick(3)
      r.s.confirm('secure')
      res.lateral = pick(brief(r).rep)
    }
    // 3. into the contralateral ventricle
    {
      const r = newRun()
      prep(r)
      // the right frontal-horn point of the ideal line, mirrored across the midline = a point inside the left frontal horn
      const hp = add(k.entry, k.ideal, 66)
      const c = [-hp[0], hp[1], hp[2]]
      const D = unit(sub(c, k.entry))
      move(r, k.entry, D, -30, Math.hypot(...sub(c, k.entry)))
      r.s.seat()
      r.tick(3)
      r.s.confirm('secure')
      res.contra = pick(brief(r).rep)
    }
    // 4. two passes: in to 45, out to −10, ideal again
    {
      const r = newRun()
      prep(r)
      move(r, k.entry, k.ideal, -30, 45)
      move(r, k.entry, k.ideal, 45, -10)
      move(r, k.entry, k.ideal, -10, 76)
      r.s.seat()
      r.tick(3)
      r.s.confirm('secure')
      res.twoPass = pick(brief(r).rep)
    }
    // 5. tremor: 8 Hz, 1 mm across the shaft
    {
      const r = newRun()
      prep(r)
      const perp = unit([k.ideal[1], -k.ideal[0], 0])
      move(r, k.entry, k.ideal, -30, 76, (t) => perp.map((x) => x * Math.sin(2 * Math.PI * 8 * t) * 1.2))
      r.s.seat()
      r.tick(3)
      r.s.confirm('secure')
      res.tremor = pick(brief(r).rep)
    }
    // 6. order errors
    {
      const r = newRun()
      res.earlyConfirm = r.s.confirm('burr')
      r.s.feed({ t: 0, tip: k.entry, dir: k.ideal, scalpDepthMm: 30, tableDepthMm: null })
      r.s.feed({ t: 0.1, tip: k.entry, dir: k.ideal, scalpDepthMm: 31, tableDepthMm: null })
      res.earlySeq = r.s.snapshot().events.filter((e) => e.type === 'out-of-order').length
      res.noCheckConfirm = r.s.confirm('position')
      res.earlyMark = r.s.placeMark(k.entry)
      res.finishEarly = r.s.finish()
    }
    return res
  })

  const f = (n, d = 2) => (typeof n === 'number' ? n.toFixed(d) : String(n))
  // pure filter
  check(R.tremor8 > 0.55 && R.tremor8 < 0.95, `tremor filter: 8 Hz, 1 mm amplitude → RMS ${f(R.tremor8)} mm (0.55–0.95)`)
  check(R.tremor05 < 0.3, `tremor filter: slow 0.5 Hz, 10 mm motion → ${f(R.tremor05)} mm (< 0.3)`)
  check(R.tremor25 < 0.4, `tremor filter: 25 Hz noise rejected → ${f(R.tremor25)} mm (< 0.4)`)
  check(R.tremorStill === 0, 'tremor filter: no motion → 0')
  // Kocher
  check(!!R.k, `Kocher found (${R.k?.samples} suture points, ${f(R.kocherMs, 0)} ms)`)
  check(R.entryOnSkullMm < 0.01, `entry lies on the outer table (Δ ${f(R.entryOnSkullMm, 3)} mm)`)
  check(Math.abs(R.aheadCheck - 15) < 1.5 && R.k.lateral === 28, `entry is 28 mm lateral and ${f(R.aheadCheck, 1)} mm anterior to the suture (≈ 15)`)
  check(R.k.normalZ > 0.3, `outer-table normal points up/out (z ${f(R.k.normalZ)})`)
  console.log(`  entry ${R.k.entry.map((v) => v.toFixed(1))}, entry → Monro ${f(R.k.len, 1)} mm, Ghajar vs ideal ${f(R.k.ghajar, 1)}°`)
  check(R.mIdeal.onTarget && !R.mIdeal.flags.length, `mark on Kocher: on target, no flags (err ${f(R.mIdeal.errorMm, 2)} mm)`)
  check(R.mMedial.flags.includes('sinus'), `mark at x = 12 mm: sinus flag (${R.mMedial.flags})`)
  check(R.mBehind.flags.includes('motor'), `mark 12 mm behind the suture: motor flag (${R.mBehind.flags}, ahead ${f(R.mBehind.aheadOfCoronalMm, 1)})`)
  check(R.mLeft.flags.includes('wrong-side'), 'mark on the left: wrong-side flag')
  // ideal
  const I = R.ideal
  check(R.idealCsf, `ideal: CSF seen at ${f(R.idealCsfDepth, 0)} mm below the table`)
  check(I.k === 1 && I.region === 'frontal-horn', `ideal: Kakarla ${I.k} (${I.region})`)
  check(I.passes === 1 && I.angle < 1 && I.coll.length === 0, `ideal: 1 pass, angle ${f(I.angle)}°, no collisions (${I.coll})`)
  check(I.eff > 0.9, `ideal: path efficiency ${f(I.eff)}`)
  check(I.total >= 4 && I.caps === 0, `ideal: total ${I.total} ≥ 4 (scores ${JSON.stringify(I.scores)})`)
  check(R.idealSteps === 'done,done,done,done,done,done,done,done,done', `ideal: all 9 steps done (${R.idealSteps})`)
  check(I.seq === 0 && I.tremor < 0.2, `ideal: no order errors, tremor ${f(I.tremor, 3)} mm`)
  // wrong runs
  const L = R.lateral
  check(L.k === 3 && L.total <= 2 && L.caps >= 1, `lateral miss: Kakarla ${L.k} (${L.region}), total ${L.total} ≤ 2, hit ${L.coll}, angle ${f(L.angle, 1)}°`)
  const C = R.contra
  check(C.k === 2 && C.region === 'contra-ventricle', `contralateral: Kakarla ${C.k} (${C.region}), total ${C.total}`)
  check(C.total < I.total, `contralateral scores below ideal (${C.total} < ${I.total})`)
  const T = R.twoPass
  check(T.passes === 2 && T.scores.passes === 3 && T.eff < 0.8, `two passes: counted ${T.passes}, passes score ${T.scores.passes}, efficiency ${f(T.eff)}`)
  const M = R.tremor
  check(M.tremor > 0.5 && M.scores.tremor < 5 && M.k === 1, `tremor 8 Hz: RMS ${f(M.tremor)} mm → score ${M.scores.tremor}, still Kakarla ${M.k}`)
  // order
  check(R.earlyConfirm === false && R.earlySeq >= 2, `out-of-order: confirm('burr') refused, ${R.earlySeq} order events (burr + early catheter)`)
  check(R.noCheckConfirm === false, 'position step needs the checklist first')
  check(R.earlyMark === null && R.finishEarly === null, 'mark before its step and finish before seat are refused')
  check(R.feedMs < 5, `catheter feed cost ${f(R.feedMs, 2)} ms (headless CPU, hazards + CSF + table depth)`)

  // ── screenshots: the ideal catheter in the head, ghost scalp, both themes ──
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  await page.evaluate(() => window.__or.getState().set({ skin: 'ghost' }))
  await page.evaluate(() => window.__tool.getState().set({ tool: 'catheter' }))
  await sleep(800)
  await page.evaluate(() => {
    const k = window.__k
    const V = window.__scene.camera.position.constructor
    const sc = (p) => new V(-p[0], p[2], p[1])
    const tip = k.entry.map((v, i) => v + k.ideal[i] * 59)
    window.__orMode.tools().setInput(sc(tip), sc(k.ideal).sub(sc([0, 0, 0])))
    const t = sc(k.entry.map((v, i) => v + k.ideal[i] * 30))
    window.__scene.flyCamera(new V(t.x - 260, t.y + 60, t.z + 20), t, { fov: 30, animate: false })
  })
  for (const theme of ['dark', 'light']) {
    await page.evaluate((th) => window.__atlas.getState().setTheme?.(th) ?? window.__atlas.setState({ theme: th }), theme)
    await sleep(1500)
    await page.screenshot({ path: `${out}/evd-${theme}.png` })
    console.log(`  saved ${out}/evd-${theme}.png`)
  }
  fs.writeFileSync(`${out}/evd-results.json`, JSON.stringify(R, null, 1))
  console.log(`  saved ${out}/evd-results.json`)
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
