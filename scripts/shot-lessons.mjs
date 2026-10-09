#!/usr/bin/env node
/**
 * Screenshot lesson steps in one browser session.
 *
 *   node scripts/shot-lessons.mjs outDir [--only ventricles:0,limbic:3] [--lang uz] [--w 1400 --h 860] [--wait 9000]
 *
 * Without --only every step of every lesson is captured. Files are named
 * <lesson>-<step>.png. Steps fade over ~1 s in a real browser but headless
 * software GL renders few frames, so give each step several seconds.
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const args = process.argv.slice(2)
const outDir = args[0] ?? 'lessons'
const opt = (n, d) => (args.indexOf(`--${n}`) >= 0 ? args[args.indexOf(`--${n}`) + 1] : d)
const only = opt('only', '')
const lang = opt('lang', 'uz')
const width = +opt('w', 1400),
  height = +opt('h', 860)
const wait = +opt('wait', 9000)
fs.mkdirSync(outDir, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--hide-scrollbars'],
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.error('[page error]', e.message))
  await page.evaluateOnNewDocument((lang) => localStorage.setItem('na:lang', lang), lang)
  await page.goto('http://localhost:3019/', { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
  const plan = only
    ? only.split(',').map((x) => x.split(':')).map(([id, step]) => ({ id, step: +step }))
    : await page.evaluate(async () => {
        const { LESSONS } = await import('/src/data/lessons/index.ts')
        return LESSONS.flatMap((l) => l.steps.map((_, step) => ({ id: l.id, step })))
      })
  await page.evaluate(() => __atlas.getState().setMode('learn'))
  let current = ''
  for (const { id, step } of plan) {
    await page.evaluate(
      (id, step, fresh) => {
        const a = __atlas.getState()
        if (fresh) a.setLesson(id)
        __atlas.getState().setLessonStep(step)
      },
      id,
      step,
      id !== current,
    )
    current = id
    await new Promise((r) => setTimeout(r, wait))
    await page.evaluate(() => (window.__scene.dirty = true))
    await new Promise((r) => setTimeout(r, 300))
    const out = `${outDir}/${id}-${step}.png`
    await page.screenshot({ path: out })
    console.log('saved', out)
  }
} finally {
  await browser.close()
}
