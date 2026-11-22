#!/usr/bin/env node
/**
 * Lesion territory audit: for every plate, level, zone and side, the drawn
 * territory (src/ui/lesionTerritory.ts) must agree with what the simulator
 * computes from data/pathways — each station the lesion cuts has at least
 * one of its plate items inside the territory, each station at that level it
 * spares has none (unless the item is shared with a cut station).
 *
 *   node scripts/audit-lesions.mjs           → "mismatches: 0" expected
 *   node scripts/audit-lesions.mjs --hits    → also list every territory's structures
 */
import puppeteer from 'puppeteer-core'
const showHits = process.argv.includes('--hits')
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] })
const p = await b.newPage()
await p.goto(process.env.NA_URL ?? 'http://localhost:3019/', { waitUntil: 'domcontentloaded' })
const res = await p.evaluate(async () => {
  const { SECTIONS } = await import('/src/data/sections/index.ts')
  const { LEVELS } = await import('/src/data/lesions.ts')
  const { PATHWAYS } = await import('/src/data/pathways.ts')
  const { territoryOn } = await import('/src/ui/lesionTerritory.ts')
  const bad = [],
    rows = []
  for (const s of SECTIONS) {
    const onPlate = new Set(s.items.map((i) => i.id))
    for (const lv of LEVELS)
      for (const z of lv.zones)
        for (const side of ['L', 'R']) {
          const t = territoryOn(s, { level: lv.id, side, zone: z.id })
          if (!t) continue
          const hit = new Set(t.hits)
          rows.push(`${s.code} ${lv.id}/${z.id}/${side}: ${t.hits.join(' ')}`)
          const cutItems = new Set()
          const checks = []
          for (const pw of PATHWAYS)
            for (const st of pw.stations) {
              // A station's plate items draw it at its own level: an 'also' run (thalamocortical axons in the capsule) is only checked when the station has no plate of its own.
              const runs = [{ level: st.level, zones: st.zones }, ...(st.plate ? [] : (st.also ?? []))].filter((r) => r.level === lv.id)
              if (!runs.length) continue
              const items = st.items.filter((i) => onPlate.has(i))
              if (!items.length) continue
              const cut = runs.some((r) => r.zones.includes(z.id))
              if (cut) items.forEach((i) => cutItems.add(i))
              checks.push({ id: `${pw.id}/${st.id}`, items, cut })
            }
          for (const c of checks) {
            if (c.cut && !c.items.some((i) => hit.has(i))) bad.push(`${s.code} ${lv.id}/${z.id}/${side}: ${c.id} cut but outside (${c.items})`)
            if (!c.cut && c.items.some((i) => hit.has(i) && !cutItems.has(i))) bad.push(`${s.code} ${lv.id}/${z.id}/${side}: ${c.id} spared but inside (${c.items})`)
          }
        }
  }
  return { bad, rows }
})
if (showHits) console.log(res.rows.join('\n'))
console.log(res.bad.join('\n'))
console.log(`territories: ${res.rows.length}, mismatches: ${res.bad.length}`)
await b.close()
