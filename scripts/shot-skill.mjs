#!/usr/bin/env node
/**
 * LDJ and LC-CUSUM (src/or/skill.ts) and their place in the EVD report and history tab.
 *
 *   NA_URL=http://localhost:3021/ node scripts/shot-skill.mjs <out-dir>
 *
 * Oracles: a minimum-jerk reach has DJ = 720 whatever its size and duration; a trembling or stop-and-go path is less smooth;
 * LC-CUSUM adds ln((1−p1)/(1−p0)) per success, so 14 clean sessions in a row signal at h = 2.5, and failures pull S back to 0.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = process.argv[2] ?? 'skill-out'
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
const f = (x, n = 2) => (typeof x === 'number' ? x.toFixed(n) : String(x))
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
  await page.evaluate(() => window.__orMode.enterOR())

  const R = await page.evaluate(async () => {
    const { ldj, lcCusum, CUSUM } = await import('/src/or/skill.ts')
    const res = {}
    // ── LDJ oracles ──
    const minJerk = (L, D, hz = 100, tremor = 0) =>
      Array.from({ length: Math.round(D * hz) + 1 }, (_, i) => {
        const t = i / hz,
          tau = t / D
        const s = L * (10 * tau ** 3 - 15 * tau ** 4 + 6 * tau ** 5)
        const w = tremor * Math.sin(2 * Math.PI * 8 * t)
        return { t, p: [s * 0.6 + w, s * 0.8, 0] }
      })
    res.mjA = ldj(minJerk(50, 2))
    res.mjB = ldj(minJerk(10, 5))
    res.expected = -Math.log(720)
    res.trem = ldj(minJerk(50, 2, 100, 0.4))
    // three stop-and-go sub-movements of the same total length and time
    const stopGo = []
    for (let k = 0; k < 3; k++) for (const p of minJerk(50 / 3, 2 / 3, 100)) stopGo.push({ t: p.t + (k * 2) / 3, p: [p.p[0] + (k * 50 * 0.6) / 3, p.p[1] + (k * 50 * 0.8) / 3, 0] })
    res.stopGo = ldj(stopGo)
    res.short = ldj(minJerk(10, 0.5))
    res.still = ldj(Array.from({ length: 200 }, (_, i) => ({ t: i / 50, p: [1, 1, 1] })))
    // ── LC-CUSUM ──
    const up = Math.log(0.9 / 0.75),
      down = Math.log(0.1 / 0.25)
    const all = lcCusum(Array(20).fill(true))
    res.allSignal = all.signalAt
    res.step = all.s[0]
    res.upExpected = up
    const mixed = lcCusum([true, true, true, false, true, false, false, true])
    res.mixed = mixed.s
    res.mixedSignal = mixed.signalAt
    res.floor = lcCusum([false, false, false]).s
    res.downExpected = down
    res.recover = lcCusum([...Array(10).fill(true), false, ...Array(14).fill(true)]).signalAt
    res.cfg = CUSUM
    return res
  })
  check(
    Math.abs(R.mjA - R.expected) < 0.15 && Math.abs(R.mjB - R.expected) < 0.15,
    `minimum-jerk reach: LDJ ${f(R.mjA)} / ${f(R.mjB)} for 50 mm·2 s and 10 mm·5 s, theory −ln 720 = ${f(R.expected)}`,
  )
  check(R.trem < R.mjA - 2, `8 Hz tremor lowers smoothness: ${f(R.trem)} vs ${f(R.mjA)}`)
  check(R.stopGo < R.mjA - 0.5, `stop-and-go (3 sub-movements) is less smooth: ${f(R.stopGo)} vs ${f(R.mjA)}`)
  check(R.short === null && R.still === null, 'a path shorter than 1 s, or one that does not move, has no LDJ')
  check(
    Math.abs(R.step - R.upExpected) < 1e-9 && R.allSignal === 14,
    `LC-CUSUM: each success adds ${f(R.step, 4)} = ln(0.9/0.75); 14 clean sessions in a row signal (got ${R.allSignal})`,
  )
  check(
    R.floor.every((v) => v === 0) && R.mixedSignal === null && Math.max(...R.mixed) < 2.5,
    `failures pull S down to 0 (floor) and a mixed record does not signal: ${R.mixed.map((v) => v.toFixed(2)).join(' ')}`,
  )
  check(R.recover !== null && R.recover > 14, `one failure delays the signal (session ${R.recover} instead of 14)`)

  // ── EVD: ldj in the report and in the history row ──
  const E = await page.evaluate(async () => {
    const { sceneWorld } = await import('/src/or/evd/world.ts')
    const { findKocher } = await import('/src/or/evd/kocher.ts')
    const { EVD_PARAMS: P } = await import('/src/or/evd/params.ts')
    const { EvdSession } = await import('/src/or/evd/session.ts')
    const { reportToRow, historyToCsv, learningCurve } = await import('/src/or/evd/history.ts')
    const world = sceneWorld(window.__scene)
    const k = findKocher(world, P, 'right')
    const run = (tremor) => {
      let clock = 0
      const s = new EvdSession(world, P, () => clock)
      s.begin({ level: 1, side: 'right', laser: true })
      s.setPosition({ side: 'right', neutralHead: true, headUp30to45: true, coagAndAntibiotic: true })
      clock += 5
      s.confirm('position')
      s.placeMark(k.entry)
      clock += 8
      s.confirm('mark')
      for (const id of ['incision', 'burr', 'dura']) {
        clock += 10
        s.confirm(id)
      }
      const dt = 1 / 60
      const dir = k.ideal
      for (let d = 0; d <= 62; d += 12 * dt) {
        clock += dt
        const w = tremor * Math.sin(2 * Math.PI * 8 * clock)
        const tip = k.entry.map((v, i) => v + dir[i] * d + (i === 0 ? w : 0))
        s.feed({ t: clock, tip, dir, scalpDepthMm: d + 7, tableDepthMm: null })
      }
      clock += 1
      s.seat()
      clock += 1
      s.confirm('secure')
      return s.finish()
    }
    const smooth = run(0),
      shaky = run(0.6)
    const rows = [reportToRow(smooth), reportToRow(shaky)]
    return {
      smooth: smooth.metrics.ldj,
      shaky: shaky.metrics.ldj,
      rowLdj: rows[0].ldj,
      csvHeader: historyToCsv(rows).split('\n')[0],
      curve: learningCurve([...rows, { ...rows[0], ldj: undefined }], 'ldj').length,
    }
  })
  check(E.smooth !== null && E.shaky !== null && E.shaky < E.smooth - 1, `EVD report: smooth pass LDJ ${f(E.smooth)}, trembling pass ${f(E.shaky)}`)
  check(typeof E.rowLdj === 'number' && E.csvHeader.endsWith(',ldj'), `history row and CSV carry ldj (header …${E.csvHeader.slice(-18)})`)
  check(E.curve === 2, 'sessions saved before LDJ existed are skipped on the LDJ curve')

  // ── History tab: LC-CUSUM card ──
  await page.evaluate(() => {
    const row = (i, ok) => ({
      timestamp: `2026-11-${String(10 + i).padStart(2, '0')}T10:00:00Z`,
      level: 1,
      side: 'right',
      durationS: 200,
      passes: 1,
      angleErrDeg: ok ? 3 : 14,
      angleVsGhajarDeg: 5,
      entryErrMm: 3,
      tipToMonroMm: ok ? 6 : 20,
      depthMm: 60,
      kakarlaGrade: ok ? 1 : 3,
      tremorRmsMm: 0.4,
      pathEfficiency: 0.9,
      collisions: ok ? 0 : 1,
      sequenceErrors: 0,
      total: ok ? 4.6 : 2,
      ldj: -9 - (ok ? 0 : 3),
    })
    const rows = Array.from({ length: 17 }, (_, i) => row(i, i !== 2))
    localStorage.setItem('na:evd:history', JSON.stringify(rows))
    window.__evdUi.getState().set(true)
  })
  await sleep(800)
  const tabClicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.evd-dock button')].find((x) => /^(history|tarix)\b/i.test(x.textContent.trim()))
    if (b) b.click()
    return !!b
  })
  await sleep(500)
  const H = await page.evaluate(() => {
    const d = document.querySelector('.evd-dock')
    return { text: d?.textContent ?? '', svg: !!d?.querySelector('[data-testid="cusum"]'), dots: d?.querySelectorAll('[data-testid="cusum"] circle').length ?? 0 }
  })
  check(tabClicked && H.svg && H.dots === 17, `history tab shows the LC-CUSUM chart with 17 sessions (${H.dots} points)`)
  check(/Stable competence|Barqaror kompetent/.test(H.text), 'the card says stable competence (16 of 17 sessions are successes, the signal comes at the 17th)')
  for (const theme of ['dark', 'light']) {
    await page.evaluate((th) => window.__atlas.getState().setTheme?.(th) ?? window.__atlas.setState({ theme: th }), theme)
    await sleep(900)
    await page.screenshot({ path: `${out}/skill-${theme}.png` })
    console.log(`  saved ${out}/skill-${theme}.png`)
  }
  await page.evaluate(() => localStorage.removeItem('na:evd:history'))
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
