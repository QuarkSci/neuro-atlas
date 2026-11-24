#!/usr/bin/env node
/**
 * Unified verification runner for Neuro Atlas (AG-18).
 *
 * Runs typecheck, production build, lesion/pick audits, surgical simulator checks
 * (shot-hands, shot-or, shot-tools when present on the branch), and dark/light
 * atlas screenshots, then writes a one-page markdown report to:
 *   docs/handoff/checks/<YYYY-MM-DD>.md
 *
 * Usage:
 *   NA_URL=http://localhost:3020/ node scripts/check-all.mjs
 *   node scripts/check-all.mjs --url http://localhost:3021/ --date 2026-11-24
 *   node scripts/check-all.mjs --skip-build --only audit-lesions,audit-pick,shots-theme
 */
import { spawn, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def
}
const hasFlag = (name) => args.includes(`--${name}`)

const pad2 = (n) => String(n).padStart(2, '0')
const localDateStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

const url = opt('url', process.env.NA_URL ?? 'http://localhost:3019/')
const dateStr = opt('date', localDateStr())
const width = +opt('w', 900)
const height = +opt('h', 560)
const skipBuild = hasFlag('skip-build')
const onlyRaw = opt('only', '')
const onlySet = onlyRaw
  ? new Set(
      onlyRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
  : null

const rootDir = process.cwd()
const checksDir = path.join(rootDir, 'docs', 'handoff', 'checks')
const reportPath = path.join(checksDir, `${dateStr}.md`)
const curatedDir = path.join(checksDir, dateStr)
const tmpDir = opt('tmp-dir', path.join(os.tmpdir(), `na-check-${dateStr}`))

fs.mkdirSync(checksDir, { recursive: true })
fs.mkdirSync(curatedDir, { recursive: true })
fs.mkdirSync(tmpDir, { recursive: true })

const gitInfo = () => {
  const run = (gitArgs) => {
    try {
      return execFileSync('git', gitArgs, { cwd: rootDir, encoding: 'utf8' }).trim()
    } catch {
      return 'unknown'
    }
  }
  return {
    branch: run(['rev-parse', '--abbrev-ref', 'HEAD']),
    commit: run(['rev-parse', '--short', 'HEAD']),
    dirty: run(['status', '--porcelain']).length > 0,
  }
}

const runCmd = (cmd, cmdArgs, envExtra = {}) =>
  new Promise((resolve) => {
    const t0 = Date.now()
    const child = spawn(cmd, cmdArgs, {
      cwd: rootDir,
      env: { ...process.env, NA_URL: url, ...envExtra },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      const s = chunk.toString()
      stdout += s
    })
    child.stderr.on('data', (chunk) => {
      const s = chunk.toString()
      stderr += s
    })
    child.on('error', (err) => {
      resolve({
        code: 1,
        stdout,
        stderr: `${stderr}\n${err.message}`.trim(),
        durationSec: (Date.now() - t0) / 1000,
      })
    })
    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
        durationSec: (Date.now() - t0) / 1000,
      })
    })
  })

const scriptExists = (relPath) => fs.existsSync(path.join(rootDir, relPath))
const shouldRun = (id) => !onlySet || onlySet.has(id)

const parseCheckMarks = (text) => {
  const passed = (text.match(/^✓ /gm) ?? []).length
  const failed = (text.match(/^✗ /gm) ?? []).length
  const failedLines = text
    .split('\n')
    .filter((l) => l.startsWith('✗ '))
    .map((l) => l.trim())
  return { passed, failed, failedLines }
}

const extractErrors = (stderr, stdout = '') => {
  const lines = `${stderr}\n${stdout}`
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('[page error]') || l.startsWith('[console error]') || l.startsWith('✗ ') || /error TS\d+:/i.test(l))
  return [...new Set(lines)].slice(0, 20)
}

const copyIfExists = (srcPath, destName, screenshots) => {
  if (!fs.existsSync(srcPath)) return false
  const stat = fs.statSync(srcPath)
  if (stat.size < 1024) return false
  const destPath = path.join(curatedDir, destName)
  fs.copyFileSync(srcPath, destPath)
  screenshots.push({
    name: destName,
    relPath: `${dateStr}/${destName}`,
    sizeKb: Math.round(stat.size / 1024),
  })
  return true
}

const checkServerReachable = async () => {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

const needServer = ['audit-lesions', 'audit-pick', 'shot-hands', 'shot-or', 'shot-tools', 'shot-evd', 'shot-drill', 'shot-drill-ui', 'shots-theme'].some(shouldRun)
if (needServer) {
  const ok = await checkServerReachable()
  if (!ok) {
    console.error(`✗ Dev server javob bermadi: ${url}`)
    console.error('  Avval serverni ishga tushiring, masalan: npm run dev -- --port 3020 --strictPort')
    process.exit(1)
  }
}

const totalStart = Date.now()
const results = []
const screenshots = []

const record = (entry) => {
  results.push(entry)
  const icon = entry.status === 'pass' ? '✅' : entry.status === 'skip' ? '⏭️' : '❌'
  const dur = entry.durationSec != null ? ` (${entry.durationSec.toFixed(1)}s)` : ''
  console.log(`${icon} ${entry.id}: ${entry.summary}${dur}`)
}

// 1. TypeScript typecheck
if (shouldRun('tsc')) {
  if (skipBuild) {
    record({ id: 'tsc', label: 'TypeScript (`tsc`)', status: 'skip', summary: '--skip-build bilan o‘tkazib yuborildi', durationSec: 0, errors: [] })
  } else {
    const r = await runCmd('npx', ['tsc', '-p', 'tsconfig.app.json', '--noEmit'])
    const ok = r.code === 0
    record({
      id: 'tsc',
      label: 'TypeScript (`tsc`)',
      status: ok ? 'pass' : 'fail',
      summary: ok ? '0 xato' : `xato (exit ${r.code})`,
      durationSec: r.durationSec,
      errors: ok ? [] : extractErrors(r.stderr, r.stdout),
    })
  }
}

// 2. Production build (and clean dist/ afterwards)
if (shouldRun('build')) {
  if (skipBuild) {
    record({ id: 'build', label: 'Vite build', status: 'skip', summary: '--skip-build bilan o‘tkazib yuborildi', durationSec: 0, errors: [] })
  } else {
    const r = await runCmd('npm', ['run', 'build'])
    fs.rmSync(path.join(rootDir, 'dist'), { recursive: true, force: true })
    const ok = r.code === 0
    record({
      id: 'build',
      label: 'Vite build',
      status: ok ? 'pass' : 'fail',
      summary: ok ? 'muvaffaqiyatli (`dist/` tozalandi)' : `xato (exit ${r.code})`,
      durationSec: r.durationSec,
      errors: ok ? [] : extractErrors(r.stderr, r.stdout),
    })
  }
}

// 3. audit-lesions
if (shouldRun('audit-lesions')) {
  if (!scriptExists('scripts/audit-lesions.mjs')) {
    record({ id: 'audit-lesions', label: 'Lesion auditi (`audit-lesions`)', status: 'skip', summary: 'skript topilmadi', durationSec: 0, errors: [] })
  } else {
    const r = await runCmd('node', ['scripts/audit-lesions.mjs'])
    const m = r.stdout.match(/territories:\s*(\d+),\s*mismatches:\s*(\d+)/)
    const territories = m ? +m[1] : null
    const mismatches = m ? +m[2] : null
    const ok = r.code === 0 && mismatches === 0
    record({
      id: 'audit-lesions',
      label: 'Lesion auditi (`audit-lesions`)',
      status: ok ? 'pass' : 'fail',
      summary: m ? `territories: ${territories}, mismatches: ${mismatches}` : `chiqish tahlil qilinmadi (exit ${r.code})`,
      durationSec: r.durationSec,
      errors: ok ? [] : [r.stdout.trim(), r.stderr.trim()].filter(Boolean),
    })
  }
}

// 4. audit-pick
if (shouldRun('audit-pick')) {
  if (!scriptExists('scripts/audit-pick.mjs')) {
    record({ id: 'audit-pick', label: 'Pick auditi (`audit-pick`)', status: 'skip', summary: 'skript topilmadi', durationSec: 0, errors: [] })
  } else {
    const r = await runCmd('node', ['scripts/audit-pick.mjs'])
    let parsed = null
    try {
      const jsonStart = r.stdout.indexOf('{')
      if (jsonStart >= 0) parsed = JSON.parse(r.stdout.slice(jsonStart))
    } catch {
      parsed = null
    }
    const ok = r.code === 0 && parsed != null && parsed.diff === 0
    record({
      id: 'audit-pick',
      label: 'Pick auditi (`audit-pick`)',
      status: ok ? 'pass' : 'fail',
      summary: parsed ? `same: ${parsed.same}, diff: ${parsed.diff}` : `JSON tahlil qilinmadi (exit ${r.code})`,
      durationSec: r.durationSec,
      errors: ok ? [] : [r.stdout.trim(), r.stderr.trim()].filter(Boolean),
    })
  }
}

// 5. shot-hands (sx/main)
if (shouldRun('shot-hands')) {
  if (!scriptExists('scripts/shot-hands.mjs')) {
    record({ id: 'shot-hands', label: 'Qo‘l/bosh testi (`shot-hands`)', status: 'skip', summary: 'skript yo‘q (faqat `sx/main`)', durationSec: 0, errors: [] })
  } else {
    const outDir = path.join(tmpDir, 'hands')
    const r = await runCmd('node', ['scripts/shot-hands.mjs', outDir, '--w', String(width), '--h', String(height)])
    const cm = parseCheckMarks(r.stdout)
    const ok = r.code === 0 && cm.failed === 0 && cm.passed > 0
    record({
      id: 'shot-hands',
      label: 'Qo‘l/bosh testi (`shot-hands`)',
      status: ok ? 'pass' : 'fail',
      summary: `${cm.passed}/${cm.passed + cm.failed} ✓`,
      durationSec: r.durationSec,
      errors: ok ? [] : [...cm.failedLines, ...extractErrors(r.stderr)],
    })
  }
}

// 6. shot-or (sx/main)
if (shouldRun('shot-or')) {
  if (!scriptExists('scripts/shot-or.mjs')) {
    record({ id: 'shot-or', label: 'Operatsiya xonasi (`shot-or`)', status: 'skip', summary: 'skript yo‘q (faqat `sx/main`)', durationSec: 0, errors: [] })
  } else {
    const outDir = path.join(tmpDir, 'or')
    const r = await runCmd('node', ['scripts/shot-or.mjs', outDir, '--w', String(width), '--h', String(height)])
    const cm = parseCheckMarks(r.stdout)
    const fpsMatch = r.stdout.match(/draws\/s[^:]*:\s*([0-9.]+)/)
    const fpsNote = fpsMatch ? `, ${fpsMatch[1]} draws/s (swGL)` : ''
    const ok = r.code === 0 && cm.failed === 0 && cm.passed > 0
    copyIfExists(path.join(outDir, 'dark-surgeon.png'), 'or-dark-surgeon.png', screenshots)
    copyIfExists(path.join(outDir, 'light-surgeon.png'), 'or-light-surgeon.png', screenshots)
    record({
      id: 'shot-or',
      label: 'Operatsiya xonasi (`shot-or`)',
      status: ok ? 'pass' : 'fail',
      summary: `${cm.passed}/${cm.passed + cm.failed} ✓${fpsNote}`,
      durationSec: r.durationSec,
      errors: ok ? [] : [...cm.failedLines, ...extractErrors(r.stderr)],
    })
  }
}

// 7. shot-tools (sx/main)
if (shouldRun('shot-tools')) {
  if (!scriptExists('scripts/shot-tools.mjs')) {
    record({ id: 'shot-tools', label: 'Asbob dvigateli (`shot-tools`)', status: 'skip', summary: 'skript yo‘q (faqat `sx/main`)', durationSec: 0, errors: [] })
  } else {
    const outDir = path.join(tmpDir, 'tools')
    const r = await runCmd('node', ['scripts/shot-tools.mjs', outDir, '--w', String(width), '--h', String(height)])
    const cm = parseCheckMarks(r.stdout)
    const costMatch = r.stdout.match(/query cost:\s*([0-9.]+)\s*ms/)
    const costNote = costMatch ? `, ${costMatch[1]} ms/move` : ''
    const ok = r.code === 0 && cm.failed === 0 && cm.passed > 0
    copyIfExists(path.join(outDir, 'catheter-ghost-dark.png'), 'tools-catheter-dark.png', screenshots)
    copyIfExists(path.join(outDir, 'catheter-ghost-light.png'), 'tools-catheter-light.png', screenshots)
    record({
      id: 'shot-tools',
      label: 'Asbob dvigateli (`shot-tools`)',
      status: ok ? 'pass' : 'fail',
      summary: `${cm.passed}/${cm.passed + cm.failed} ✓${costNote}`,
      durationSec: r.durationSec,
      errors: ok ? [] : [...cm.failedLines, ...extractErrors(r.stderr)],
    })
  }
}

// 7b. shot-evd (sx/main)
if (shouldRun('shot-evd')) {
  if (!scriptExists('scripts/shot-evd.mjs')) {
    record({ id: 'shot-evd', label: 'EVD mantig‘i (`shot-evd`)', status: 'skip', summary: 'skript yo‘q (faqat `sx/main`)', durationSec: 0, errors: [] })
  } else {
    const outDir = path.join(tmpDir, 'evd')
    const r = await runCmd('node', ['scripts/shot-evd.mjs', outDir, '--w', String(width), '--h', String(height)])
    const cm = parseCheckMarks(r.stdout)
    const costNote = ''
    const ok = r.code === 0 && cm.failed === 0 && cm.passed > 0
    copyIfExists(path.join(outDir, 'evd-dark.png'), 'evd-dark.png', screenshots)
    copyIfExists(path.join(outDir, 'evd-light.png'), 'evd-light.png', screenshots)
    record({
      id: 'shot-evd',
      label: 'EVD mantig‘i (`shot-evd`)',
      status: ok ? 'pass' : 'fail',
      summary: `${cm.passed}/${cm.passed + cm.failed} ✓${costNote}`,
      durationSec: r.durationSec,
      errors: ok ? [] : [...cm.failedLines, ...extractErrors(r.stderr)],
    })
  }
}

// 7c. shot-drill (sx/main)
if (shouldRun('shot-drill')) {
  if (!scriptExists('scripts/shot-drill.mjs')) {
    record({ id: 'shot-drill', label: 'Suyak burg‘ulash (`shot-drill`)', status: 'skip', summary: 'skript yo‘q (faqat `sx/main`)', durationSec: 0, errors: [] })
  } else {
    const outDir = path.join(tmpDir, 'drill')
    const r = await runCmd('node', ['scripts/shot-drill.mjs', outDir, '--w', String(width), '--h', String(height)])
    const cm = parseCheckMarks(r.stdout)
    const costNote = ''
    const ok = r.code === 0 && cm.failed === 0 && cm.passed > 0
    copyIfExists(path.join(outDir, 'drill-dark.png'), 'drill-dark.png', screenshots)
    copyIfExists(path.join(outDir, 'drill-light.png'), 'drill-light.png', screenshots)
    record({
      id: 'shot-drill',
      label: 'Suyak burg‘ulash (`shot-drill`)',
      status: ok ? 'pass' : 'fail',
      summary: `${cm.passed}/${cm.passed + cm.failed} ✓${costNote}`,
      durationSec: r.durationSec,
      errors: ok ? [] : [...cm.failedLines, ...extractErrors(r.stderr)],
    })
  }
}

// 7d. shot-drill-ui-ui (sx/main)
if (shouldRun('shot-drill-ui')) {
  if (!scriptExists('scripts/shot-drill-ui.mjs')) {
    record({ id: 'shot-drill-ui', label: 'Burg‘u asbob dvigatelida (`shot-drill-ui`)', status: 'skip', summary: 'skript yo‘q (faqat `sx/main`)', durationSec: 0, errors: [] })
  } else {
    const outDir = path.join(tmpDir, 'drill-ui')
    const r = await runCmd('node', ['scripts/shot-drill-ui.mjs', outDir, '--w', String(width), '--h', String(height)])
    const cm = parseCheckMarks(r.stdout)
    const costNote = ''
    const ok = r.code === 0 && cm.failed === 0 && cm.passed > 0
    copyIfExists(path.join(outDir, 'drill-ui-dark.png'), 'drill-ui-dark.png', screenshots)
    copyIfExists(path.join(outDir, 'drill-ui-light.png'), 'drill-ui-light.png', screenshots)
    record({
      id: 'shot-drill-ui',
      label: 'Burg‘u asbob dvigatelida (`shot-drill-ui`)',
      status: ok ? 'pass' : 'fail',
      summary: `${cm.passed}/${cm.passed + cm.failed} ✓${costNote}`,
      durationSec: r.durationSec,
      errors: ok ? [] : [...cm.failedLines, ...extractErrors(r.stderr)],
    })
  }
}

// 8. Dark & Light atlas screenshots
if (shouldRun('shots-theme')) {
  if (!scriptExists('scripts/shot.mjs')) {
    record({ id: 'shots-theme', label: 'Qora + yorug‘ screenshotlar', status: 'skip', summary: '`scripts/shot.mjs` topilmadi', durationSec: 0, errors: [] })
  } else {
    const t0 = Date.now()
    const errs = []
    let captured = 0
    for (const theme of ['dark', 'light']) {
      const fileName = `atlas-${theme}.png`
      const outPath = path.join(curatedDir, fileName)
      const r = await runCmd('node', ['scripts/shot.mjs', outPath, '--theme', theme, '--lang', 'uz', '--w', String(width), '--h', String(height), '--wait', '3000'])
      const pageErrs = extractErrors(r.stderr)
      const size = fs.existsSync(outPath) ? fs.statSync(outPath).size : 0
      if (r.code === 0 && size > 10 * 1024 && pageErrs.length === 0) {
        captured++
        screenshots.push({
          name: fileName,
          relPath: `${dateStr}/${fileName}`,
          sizeKb: Math.round(size / 1024),
        })
      } else {
        errs.push(`${theme}: exit=${r.code}, size=${size}B`, ...pageErrs)
      }
    }
    const ok = captured === 2 && errs.length === 0
    record({
      id: 'shots-theme',
      label: 'Qora + yorug‘ screenshotlar',
      status: ok ? 'pass' : 'fail',
      summary: `${captured}/2 PNG (${width}×${height})`,
      durationSec: (Date.now() - t0) / 1000,
      errors: errs,
    })
  }
}

// Build one-page markdown report
const totalSec = (Date.now() - totalStart) / 1000
const git = gitInfo()
const failCount = results.filter((r) => r.status === 'fail').length
const passCount = results.filter((r) => r.status === 'pass').length
const skipCount = results.filter((r) => r.status === 'skip').length
const overallBadge = failCount === 0 ? '✅ HAMMASI O‘TDI' : `❌ ${failCount} TA XATO`

const statusIcon = (s) => (s === 'pass' ? '✅' : s === 'skip' ? '⏭️' : '❌')

const lines = [
  `# Tekshiruv hisoboti — ${dateStr}`,
  '',
  `- **Natija:** ${overallBadge} (${passCount} o‘tdi, ${failCount} xato, ${skipCount} o‘tkazib yuborildi)`,
  `- **Branch / Commit:** \`${git.branch}\` (\`${git.commit}\`${git.dirty ? ', uncommitted o‘zgarishlar bor' : ''})`,
  `- **URL:** \`${url}\` · **Umumiy vaqt:** ${totalSec.toFixed(1)} s · **O‘lcham:** ${width}×${height}`,
  '',
  '## Natijalar jadvali',
  '',
  '| Tekshiruv | Holat | Ko‘rsatkich | Vaqt |',
  '|---|---|---|---|',
  ...results.map((r) => `| ${r.label} | ${statusIcon(r.status)} | ${r.summary} | ${r.durationSec.toFixed(1)} s |`),
  '',
]

if (screenshots.length > 0) {
  lines.push('## Tanlangan screenshotlar (qora va yorug‘ rejim)', '')
  for (const s of screenshots) {
    lines.push(`- \`docs/handoff/checks/${s.relPath}\` (${s.sizeKb} KB)`)
  }
  lines.push('', `> To‘liq xom screenshotlar mahalliy vaqtinchalik papkada: \`${tmpDir}\``, '')
}

const failedResults = results.filter((r) => r.status === 'fail')
if (failedResults.length > 0) {
  lines.push('## Xatolar tafsiloti', '')
  for (const r of failedResults) {
    lines.push(`### ${r.label}`)
    for (const e of r.errors.slice(0, 15)) {
      lines.push(`- \`${e}\``)
    }
    lines.push('')
  }
}

lines.push(
  '## Headless rejimda tekshirilmaganlar',
  '',
  '- Haqiqiy veb-kamera oqimi (MediaPipe real kadrlar bilan)',
  '- Mac GPU’dagi haqiqiy FPS (headless dasturiy SwiftShader faqat pastki chegara)',
  '- Geympad titrashi (`Gamepad.vibrationActuator`)',
  '',
)

fs.writeFileSync(reportPath, lines.join('\n'), 'utf8')
console.log(`\nHisobot saqlandi: ${path.relative(rootDir, reportPath)}`)
console.log(`Umumiy natija: ${overallBadge} (${totalSec.toFixed(1)} s)`)

process.exit(failCount === 0 ? 0 : 1)
