#!/usr/bin/env node
/**
 * SX-6 DBS logic, headless on the real atlas meshes (distances, centroids) with the test data of scripts/dbs-fixture.mjs.
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-dbs.mjs <out-dir>
 *
 * AC–PC frame and its error, planned vs atlas target, trajectory angles and risk (a good line and one through the
 * ventricle), MER sequence and boundary marks on a centre and an off-centre track, stimulation window, brain shift, and
 * two full sessions (careful vs careless) that must score apart.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = process.argv[2] ?? 'dbs-out'
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
  page.on('pageerror', (e) => {
    console.error('[page error]', e.message)
    failed = true
  })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 90000 })
  await page.evaluate(() => window.__orMode.enterOR())

  const R = await page.evaluate(async () => {
    const { sceneWorld } = await import('/src/or/evd/world.ts')
    const { DbsSession } = await import('/src/or/dbs/session.ts')
    const { makeFrame, toAcpc, fromAcpc, lineAngles } = await import('/src/or/dbs/geometry.ts')
    const { DBS_PARAMS } = await import('/src/or/dbs/params.ts')
    const { analyseTrajectory } = await import('/src/or/dbs/trajectory.ts')
    const { DATA } = await import('/scripts/dbs-fixture.mjs')
    const { PART_BY_ID } = await import('/src/data/index.ts')
    const sw = sceneWorld(window.__scene)
    const world = {
      isInside: (id, p) => sw.isInside(id, p),
      distanceTo: (id, p) => sw.distanceTo(id, p),
      centroid: (id) => PART_BY_ID.get(id)?.centroid ?? sw.centroid(id),
    }
    const res = {}
    const add = (a, b, k = 1) => a.map((x, i) => x + b[i] * k)
    const sub = (a, b) => a.map((x, i) => x - b[i])
    const unit = (a) => {
      const l = Math.hypot(...a)
      return a.map((x) => x / l)
    }
    const AC = world.centroid('g-anterior-commissure'),
      PC = world.centroid('g-posterior-commissure')

    // ── Frame ──
    const fr = makeFrame(AC, PC)
    const probe = [12, -8, -3]
    const back = fromAcpc(fr, toAcpc(fr, probe))
    res.frame = { len: fr.lengthMm, round: Math.hypot(...sub(back, probe)), mcp: fr.mcp, acpcOfAc: toAcpc(fr, AC), acpcOfPc: toAcpc(fr, PC) }

    // ── Sessions need a clock ──
    let clock = 0
    const mkSession = (id) => {
      clock = 0
      const s = new DbsSession(world, DATA, DBS_PARAMS, () => clock)
      s.begin(id, 'right')
      return s
    }
    // entry from the planned target: up, anterior and lateral at the literature angles (sag, cor)
    const entryFrom = (T, frame, sag, cor, len = 95) => {
      const dz = 1,
        dy = dz / Math.tan((sag * Math.PI) / 180),
        dx = dz * Math.tan((cor * Math.PI) / 180)
      const u = unit([dx, dy, dz])
      const dirMni = add(
        add(
          frame.ex.map((v) => v * u[0]),
          frame.ey.map((v) => v * u[1]),
        ),
        frame.ez.map((v) => v * u[2]),
      )
      return add(T, dirMni, len)
    }

    // ── Planned vs atlas target (cross-atlas) ──
    const planOf = (id) => {
      const s = mkSession(id)
      s.markAcpc(AC, PC)
      return { s, T: s.planned() }
    }
    const stn = planOf('stn'),
      gpi = planOf('gpi'),
      vim = planOf('vim')
    const jstn = world.centroid('j-stn-right')
    res.plan = {
      stnAcpc: toAcpc(fr, stn.T),
      gpiAcpc: toAcpc(fr, gpi.T),
      vimAcpc: toAcpc(fr, vim.T),
      stnVsJulich: Math.hypot(...sub(stn.T, jstn)),
    }
    // left side mirrors x
    {
      const s = new DbsSession(world, DATA, DBS_PARAMS, () => clock)
      s.begin('stn', 'left')
      s.markAcpc(AC, PC)
      res.leftX = toAcpc(fr, s.planned())[0]
    }

    // ── Trajectory ──
    const tryEntries = []
    let best = null
    for (const cor of [10, 15, 17, 20, 25])
      // 10 and 25 are outside dbs.md 3.3 (15–20°) and only show up in the scan
      for (const sag of [55, 60, 65]) {
        const e = entryFrom(stn.T, fr, sag, cor)
        const a = analyseTrajectory(world, DATA, DBS_PARAMS, fr, 'stn', 'right', e, stn.T)
        tryEntries.push({ sag, cor, coll: a.collisions, clr: a.minClearanceMm })
        if (!a.anglesOk) continue
        if (!best || a.collisions < best.a.collisions || (a.collisions === best.a.collisions && a.minClearanceMm > best.a.minClearanceMm)) best = { sag, cor, e, a }
      }
    res.scan = tryEntries
    res.best = {
      sag: best.sag,
      cor: best.cor,
      coll: best.a.collisions,
      clr: best.a.minClearanceMm,
      ang: [best.a.sagittalDeg, best.a.coronalDeg],
      ok: best.a.anglesOk,
      items: best.a.items.map((i) => [i.partId, +i.minMm.toFixed(1), i.crossed]),
    }
    // a line through the lateral ventricle: from straight above its body to the planned target
    const vc = world.centroid('g-right-lateral-ventricle')
    const bad = analyseTrajectory(world, DATA, DBS_PARAMS, fr, 'stn', 'right', add(vc, [0, 0, 60]), stn.T)
    res.bad = { coll: bad.collisions, ids: bad.collisionIds, clr: bad.minClearanceMm }
    window.__best = best

    // ── MER sequence ──
    const runMer = (s, offset) => {
      s.confirm('plan')
      s.setEntry(best.e)
      s.confirm('trajectory')
      s.confirm('burr')
      s.sealDura()
      s.guideTo(15)
      s.confirm('guide')
      if (offset && offset !== 'center') s.newTrack(offset)
      const seq = []
      let enter = null,
        exit = null
      for (let d = 15; d >= -5; d -= 0.5) {
        const r = s.drive(d)
        if (!seq.length || seq[seq.length - 1] !== r.pattern.layerId) seq.push(r.pattern.layerId)
        if (r.pattern.inTarget) {
          if (enter === null) enter = d
          exit = d
        }
      }
      return { seq, enter, exit }
    }
    const sA = mkSession('stn')
    sA.markAcpc(AC, PC)
    const mA = runMer(sA, 'center')
    res.merCenter = mA
    const sB = mkSession('stn')
    sB.markAcpc(AC, PC)
    const mB = runMer(sB, 'anterior')
    res.merAnterior = mB
    const sC = mkSession('stn')
    sC.markAcpc(AC, PC)
    const mC = runMer(sC, 'lateral')
    res.merLateral = mC
    res.oneTrack = sA.tracksUsed

    // ── Stim: at the true target vs moved toward the capsule ──
    const dbg = sA.debug()
    const sS = mkSession('stn')
    sS.markAcpc(AC, PC)
    runMer(sS, 'center')
    const wAt = (d) => sS.stimulate(d, 5)
    const mid = mA.enter !== null ? (mA.enter + mA.exit) / 2 : 0
    const good = wAt(mid)
    res.stim = { mid, window: good.windowMa, benefitThr: good.benefitThresholdMa, effects: good.effects.map((e) => e.id) }
    // a contact 4 mm lateral (towards the capsule): compare analytically through the stim model
    const { stimulate } = await import('/src/or/dbs/stim.ts')
    const T = dbg.truth
    const lat = add(T, fr.ex, 4)
    const near = stimulate(world, DATA, DBS_PARAMS, 'stn', 'right', lat, T, 5)
    const far = stimulate(world, DATA, DBS_PARAMS, 'stn', 'right', T, T, 5)
    res.stimLat = { windowCentre: far.windowMa, windowLat4: near.windowMa, benefitCentre: far.benefitThresholdMa, benefitLat4: near.benefitThresholdMa }

    // ── Brain shift ──
    const shiftOf = (seal, minutes) => {
      const s = mkSession('stn')
      s.markAcpc(AC, PC)
      s.confirm('plan')
      s.setEntry(best.e)
      s.confirm('trajectory')
      s.confirm('burr')
      if (seal) s.sealDura()
      clock += minutes * 60
      return s.brainShiftMm()
    }
    res.shift = { open10: shiftOf(false, 10), sealed10: shiftOf(true, 10), open40: shiftOf(false, 40) }

    // ── Out of order ──
    {
      const s = mkSession('stn')
      res.ooo = { entryEarly: s.setEntry(best.e), driveEarly: s.drive(0), confirmTraj: s.confirm('trajectory'), events: s.events.filter((e) => e.type === 'out-of-order').length }
    }

    // ── Full sessions ──
    const careful = () => {
      const s = mkSession('stn')
      s.markAcpc(AC, PC)
      s.confirm('plan')
      s.setEntry(best.e)
      s.confirm('trajectory')
      clock += 30
      s.confirm('burr')
      s.sealDura()
      clock += 60
      s.guideTo(15)
      s.confirm('guide')
      // two passes (centre, medial): keep the one with the longer target window, mark it, test, implant at its centre
      const scan = () => {
        let enter = null,
          exit = null
        for (let d = 15; d >= -5; d -= 0.5) {
          const r = s.drive(d)
          clock += 4
          if (r.pattern.inTarget) {
            if (enter === null) enter = d
            exit = d
          }
        }
        return { enter, exit, len: enter === null ? 0 : enter - exit }
      }
      const c = scan()
      const tr2 = s.newTrack('medial')
      const m = scan()
      const pick = m.len > c.len ? { ...m, id: tr2.id } : { ...c, id: 1 }
      s.selectTrack(pick.id)
      s.markBoundary('enter', pick.enter)
      s.markBoundary('exit', pick.exit)
      s.confirm('mer')
      const dep = (pick.enter + pick.exit) / 2
      s.stimulate(dep, 2)
      clock += 120
      const rep = s.implant(dep)
      return rep
    }
    const careless = () => {
      const s = mkSession('stn')
      // AC and PC marked 3 mm off, no sealing, a line through the ventricle, four tracks, no MER marks, implant at the planned depth
      s.markAcpc(add(AC, [3, 0, 0]), add(PC, [-3, 0, 0]))
      s.confirm('plan')
      s.setEntry(add(vc, [0, 0, 60]))
      s.confirm('trajectory')
      s.confirm('burr')
      clock += 40 * 60
      s.guideTo(8)
      s.confirm('guide')
      s.confirm('mer')
      s.newTrack('anterior')
      s.newTrack('posterior')
      s.newTrack('medial')
      return s.implant(0)
    }
    const g = careful(),
      b = careless()
    const brief = (r) =>
      r && {
        total: r.total,
        radial: r.metrics.radialErrorMm,
        clr: r.metrics.clearanceMm,
        coll: r.metrics.collisions,
        mer: r.metrics.merBoundaryErrorMm,
        win: r.metrics.windowMa,
        tracks: r.metrics.tracks,
        frame: r.metrics.frameErrorMm,
        shift: r.metrics.brainShiftMm,
        caps: r.caps.length,
        sc: Object.fromEntries(Object.entries(r.scores).map(([k, v]) => [k, v.score])),
        exp: r.export,
        plan: r.planVsAtlasMm,
      }
    res.careful = brief(g)
    res.careless = brief(b)
    return res
  })

  // ── Frame ──
  check(
    Math.abs(R.frame.len - 32) < 0.5 && R.frame.round < 1e-9,
    `AC–PC length ${f(R.frame.len, 1)} mm (atlas; literature 23–28), coordinates round-trip ${R.frame.round.toExponential(1)}`,
  )
  check(Math.abs(R.frame.acpcOfAc[1] - R.frame.len / 2) < 1e-6 && Math.abs(R.frame.acpcOfPc[1] + R.frame.len / 2) < 1e-6, 'AC at +half, PC at −half on the y axis')
  const [sx, sy, sz] = R.plan.stnAcpc
  check(
    Math.abs(sx - 11.5) < 1e-6 && Math.abs(sy + 3) < 1e-6 && Math.abs(sz + 4.5) < 1e-6,
    `planned STN in AC–PC (${f(sx, 1)}, ${f(sy, 1)}, ${f(sz, 1)}) = mid-range of dbs.md 3.2`,
  )
  check(Math.abs(R.leftX + 11.5) < 1e-6, `left side mirrors x (${f(R.leftX, 1)})`)
  check(R.plan.stnVsJulich < 4, `planned STN is ${f(R.plan.stnVsJulich, 1)} mm from the Julich STN centroid (cross-atlas offset)`)

  // ── Trajectory ──
  check(
    R.best.ok && Math.abs(R.best.ang[0] - R.best.sag) < 0.6 && Math.abs(R.best.ang[1] - R.best.cor) < 0.6,
    `entry built at sag ${R.best.sag}° / cor ${R.best.cor}° measured as ${f(R.best.ang[0], 1)}° / ${f(R.best.ang[1], 1)}°`,
  )
  check(
    R.best.coll === 0 && R.best.clr >= 1,
    `best literature line: ${R.best.coll} collisions, clearance ${f(R.best.clr, 1)} mm  [${R.best.items.map((i) => i.join(' ')).join(' | ')}]`,
  )
  check(R.bad.coll >= 1 && R.bad.ids.includes('g-right-lateral-ventricle'), `a line through the ventricle is a collision (${R.bad.ids.join(', ')})`)
  console.log('  scan (sag,cor → collisions, clearance):', R.scan.map((s) => `${s.sag}/${s.cor}:${s.coll}/${f(s.clr, 1)}`).join('  '))

  // ── MER ──
  const seq = R.merCenter.seq
  check(seq.join('>') === 'stn-thal>stn-zi>stn>stn-snr' || seq.join('>').includes('stn-zi>stn>stn-snr'), `MER layers on the centre track: ${seq.join(' → ')}`)
  const lenC = R.merCenter.enter - R.merCenter.exit,
    lenA = R.merAnterior.enter === null ? 0 : R.merAnterior.enter - R.merAnterior.exit,
    lenL = R.merLateral.enter === null ? 0 : R.merLateral.enter - R.merLateral.exit
  check(lenC >= 3 && lenC <= 6, `STN window on the centre track ${f(lenC, 1)} mm (4–5 mm ideal)`)
  check(lenA <= lenC + 0.01 || lenL <= lenC + 0.01, `an off-centre pass shortens or equals the window: centre ${f(lenC, 1)}, anterior ${f(lenA, 1)}, lateral ${f(lenL, 1)} mm`)
  // ── Stimulation ──
  check(
    R.stim.window > 0 && R.stimLat.windowCentre > 1.5 && R.stimLat.windowCentre < 5,
    `window ${f(R.stim.window)} mA on the centre track (2 mm off the atlas STN, benefit from ${f(R.stim.benefitThr)} mA); at the true target ${f(R.stimLat.windowCentre)} mA`,
  )
  check(
    R.stimLat.windowLat4 < R.stimLat.windowCentre && R.stimLat.benefitLat4 > R.stimLat.benefitCentre,
    `4 mm lateral: window ${f(R.stimLat.windowLat4)} < ${f(R.stimLat.windowCentre)} mA at the centre; benefit needs ${f(R.stimLat.benefitLat4)} vs ${f(R.stimLat.benefitCentre)} mA`,
  )
  // ── Shift ──
  check(
    R.shift.sealed10 < R.shift.open10 && R.shift.open40 === 4,
    `brain shift 10 min open ${f(R.shift.open10)} mm, sealed ${f(R.shift.sealed10)} mm, 40 min open capped at ${f(R.shift.open40)} mm`,
  )
  // ── Order ──
  check(
    R.ooo.entryEarly === null && R.ooo.driveEarly === null && R.ooo.confirmTraj === false && R.ooo.events === 3,
    `steps out of order are refused and recorded (${R.ooo.events} events)`,
  )
  // ── Sessions ──
  const g = R.careful,
    b = R.careless
  console.log('  careful :', JSON.stringify({ ...g, exp: undefined }))
  console.log('  careless:', JSON.stringify({ ...b, exp: undefined }))
  check(g.total >= 3.5 && g.coll === 0 && g.radial < 2.5, `careful session scores ${g.total} (radial ${f(g.radial)} mm, window ${f(g.win)} mA, ${g.tracks} tracks)`)
  check(
    b.total <= 2 && b.coll >= 1 && b.caps >= 1,
    `careless session scores ${b.total} with caps (collisions ${b.coll}, frame error ${f(b.frame)} mm, shift ${f(b.shift)} mm, ${b.tracks} tracks)`,
  )
  check(g.total - b.total >= 1.5, `scores are far apart: ${g.total} vs ${b.total}`)
  check(
    g.exp && [g.exp.acpcX, g.exp.mniY, g.exp.grossZ, g.exp.atlasOffsetMm].every(Number.isFinite) && Math.abs(g.exp.atlasOffsetMm - 7.6) < 0.5,
    `export row: STN gross↔Julich offset ${f(g.exp?.atlasOffsetMm, 1)} mm (dbs.md 3.4: 7.6)`,
  )
  fs.writeFileSync(`${out}/dbs-results.json`, JSON.stringify(R, null, 1))
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
