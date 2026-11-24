#!/usr/bin/env node
/**
 * A-0 anatomy audit (docs/REALISM.md 3-bo'lim): what lies between the outer skull and the cortex, and are vessels on the cortex?
 * It is also the acceptance gauge for AG-19…AG-23 deliveries (`--strict`).
 *
 *   NA_URL=http://localhost:3021/ node scripts/audit-anatomy.mjs [out-dir] [--strict] [--rays 3000] [--vessels 80000] [--layers id1,id2] [--shot]
 *
 * 1. Sites (Kocher, pterional, vertex, occipital, temporal): a ray from the brain centre outward. Reported along it: outer and inner skull
 *    surface, bone thickness, dura, cortex surface, and the UNFILLED gap = (inner bone → cortex) minus the length covered by layer volumes.
 * 2. Calvarium sweep (Fibonacci rays over the upper hemisphere): the same, as distributions and coverage fractions.
 * 3. Vessels: samples of every artery/vein vertex vs. the union of cortical meshes. Near-surface (≤ 6 mm outside the cortex) samples farther than
 *    0.5 mm from it are "airborne". Counts are by VERTEX (a proxy of length, the meshes are tubes with fairly even vertices).
 *
 * Layer volumes = meshes of system `meninges` plus `--layers` ids (and any id starting `anat-`), paired by parity like the bone sheets.
 * Everything is geometry from the loaded atlas meshes (BVH), MNI mm; scene frame is (−x, z, y).
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const args = process.argv.slice(2)
const flag = (n) => args.includes(n)
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
const out = args.find((a) => !a.startsWith('--') && isNaN(+a) && !/[,]/.test(a) && a !== opt('--layers')) ?? '/tmp/anatomy-audit'
const url = process.env.NA_URL ?? 'http://localhost:3019/'
const RAYS = +opt('--rays', 3000)
const VESSELS = +opt('--vessels', 80000)
const EXTRA = (opt('--layers', '') || '').split(',').filter(Boolean)
fs.mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--hide-scrollbars'],
})
let failed = false
const check = (ok, msg) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`)
  if (!ok && flag('--strict')) failed = true
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
  if (!(await page.evaluate(() => window.__orMode.enterOR()))) throw new Error('operating room did not open')

  const R = await page.evaluate(
    async (RAYS, VESSELS, EXTRA) => {
      const { mniToScene, sceneToMni } = await import('/src/or/types.ts')
      const { pairSurfaces } = await import('/src/or/drill/boneWorld.ts')
      const { sceneWorld } = await import('/src/or/evd/world.ts')
      const { findKocher } = await import('/src/or/evd/kocher.ts')
      const { EVD_PARAMS: P } = await import('/src/or/evd/params.ts')
      const scene = window.__scene
      // The page has no bare 'three' import: take the constructors from live objects (same copy the BVHs were built with).
      const THREE = { Vector3: scene.camera.position.constructor, Ray: scene.raycaster.ray.constructor, DoubleSide: 2 }
      const first = scene.toolTargets()[0].geometry
      first.boundingBox ?? first.computeBoundingBox()
      THREE.Box3 = first.boundingBox.constructor
      const targets = scene.toolTargets()
      const geo = (t) => t.geometry
      const bySys = (s) => targets.filter((t) => t.system === s && geo(t).boundsTree)
      const skull = bySys('skull'),
        cortex = bySys('telencephalon'),
        vessels = [...bySys('arteries'), ...bySys('veins')]
      // Layers built by the room (LayerStack: `anat-*`, two sheets each) replace the atlas meninges when present.
      const anat = window.__orMode.anatomy?.()?.targets() ?? []
      const layerT = anat.length ? anat : targets.filter((t) => geo(t).boundsTree && (t.system === 'meninges' || t.id.startsWith('anat-') || EXTRA.includes(t.id)))
      const plainPair = (h) => {
        const q = [...h].sort((a, b) => a - b)
        const o = []
        for (let i = 0; i + 1 < q.length; i += 2) o.push([q[i], q[i + 1]])
        return o
      }
      const res = { counts: { skull: skull.length, cortex: cortex.length, vessels: vessels.length, layers: layerT.map((t) => t.id) } }
      const ray = new THREE.Ray()
      const hitsOf = (list, o, d, far) => {
        ray.origin.set(o[0], o[1], o[2])
        ray.direction.set(d[0], d[1], d[2])
        const h = []
        for (const t of list) for (const x of geo(t).boundsTree.raycast(ray, THREE.DoubleSide, 0, far)) h.push(x.distance)
        return h
      }
      const stats = (a) => {
        if (!a.length) return null
        const s = [...a].sort((x, y) => x - y)
        const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]
        return { n: a.length, min: s[0], p5: q(0.05), median: q(0.5), mean: a.reduce((x, y) => x + y, 0) / a.length, p95: q(0.95), max: s[s.length - 1] }
      }

      // Brain centre: bbox centre of all cortical meshes (scene frame).
      const bb = new THREE.Box3()
      for (const t of cortex) {
        const g = geo(t)
        g.boundingBox ?? g.computeBoundingBox()
        bb.union(g.boundingBox)
      }
      const c = bb.getCenter(new THREE.Vector3())
      const centre = [c.x, c.y, c.z]
      res.centreMni = sceneToMni(centre)
      const FAR = 400

      // One ray from the centre: the layer sequence.
      const probe = (dirScene) => {
        const d = new THREE.Vector3(...dirScene).normalize()
        const dir = [d.x, d.y, d.z]
        const bone = pairSurfaces(hitsOf(skull, centre, dir, FAR))
        if (!bone.length) return null
        // Skull seen from inside: the first run is the vault (inner → outer table).
        const [inner, outer] = bone[0]
        const cortexHits = hitsOf(cortex, centre, dir, inner + 0.01)
        const cortexOuter = cortexHits.length ? Math.max(...cortexHits.filter((h) => h <= inner + 0.01)) : null
        // Layer volumes paired by parity (a single mesh can hold several shells; they are not told apart), clipped to the gap.
        // Each layer is paired on its own (shared boundaries of neighbouring layers must not cancel); ours exactly, atlas sheets with the 0.15 mm collapse.
        const layerRuns = []
        for (const t of layerT) {
          const h = hitsOf([t], centre, dir, inner + 5)
          layerRuns.push(...(t.system === 'anat' ? plainPair(h) : pairSurfaces(h)))
        }
        layerRuns.sort((a, b) => a[0] - b[0])
        const duraHits = hitsOf(layerT, centre, dir, FAR).sort((a, b) => a - b)
        const lo = cortexOuter ?? inner
        let covered = 0
        let reach = lo
        for (const [a, b] of layerRuns) {
          const a2 = Math.max(a, reach, lo),
            b2 = Math.min(b, inner)
          if (b2 > a2) {
            covered += b2 - a2
            reach = b2
          }
        }
        const gap = cortexOuter == null ? null : inner - cortexOuter
        return {
          outer,
          inner,
          boneMm: outer - inner,
          cortexOuter,
          gapMm: gap,
          layerSurfaces: duraHits.filter((h) => h <= outer + 0.5).map((h) => +h.toFixed(2)),
          duraBetween: duraHits.some((h) => cortexOuter != null && h > cortexOuter - 0.2 && h < inner + 0.6),
          coveredMm: covered,
          unfilledMm: gap == null ? null : Math.max(0, gap - covered),
          entry: sceneToMni([centre[0] + dir[0] * outer, centre[1] + dir[1] * outer, centre[2] + dir[2] * outer]),
        }
      }

      // ── 1. Sites ──
      const world = sceneWorld(scene)
      const k = findKocher(world, P, 'right')
      const toScene = (m) => mniToScene(m)
      const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
      const dirMni = (m) => sub(toScene(m), centre) // direction given as MNI point → scene vector from the centre
      const mniDir = (dx, dy, dz) => {
        const a = mniToScene([dx, dy, dz]) // MNI vector → scene vector (linear)
        return a
      }
      const sites = {
        kocher: k ? dirMni(k.entry) : null,
        pterional: mniDir(0.92, 0.38, -0.02),
        vertex: mniDir(0.12, 0, 1),
        occipital: mniDir(0.15, -1, 0.1),
        temporal: mniDir(1, -0.05, -0.25),
      }
      res.sites = {}
      for (const [n, d] of Object.entries(sites)) res.sites[n] = d ? probe(d) : null

      // ── 2. Calvarium sweep (upper hemisphere + a band below the equator to reach temporal/occipital) ──
      const sweep = []
      const N = RAYS
      for (let i = 0; i < N; i++) {
        const zz = 1 - ((i + 0.5) / N) * 1.25 // z from 1 down to −0.25 (MNI up)
        const r = Math.sqrt(Math.max(0, 1 - zz * zz))
        const ph = i * 2.399963229728653
        const m = [r * Math.cos(ph), r * Math.sin(ph), zz]
        const p = probe(mniToScene(m))
        if (p) sweep.push({ ...p, m })
      }
      const has = sweep.filter((p) => p.gapMm != null)
      res.sweep = {
        rays: N,
        hit: sweep.length,
        boneMm: stats(sweep.map((p) => p.boneMm)),
        gapMm: stats(has.map((p) => p.gapMm)),
        unfilledMm: stats(has.map((p) => p.unfilledMm)),
        duraCoverage: has.filter((p) => p.duraBetween).length / Math.max(1, has.length),
        gapOver0p5: has.filter((p) => p.gapMm > 0.5).length / Math.max(1, has.length),
        unfilledOver0p5: has.filter((p) => p.unfilledMm > 0.5).length / Math.max(1, has.length),
        // Rays that run down the interhemispheric fissure (cortex first met > 10 mm under the bone) are a different problem (falx, a deep slit a
        // radial shell cannot follow): reported apart, the strict gauge uses the rest.
        fissureFrac: has.filter((p) => p.gapMm > 10).length / Math.max(1, has.length),
        unfilledOver0p5NoFissure: has.filter((p) => p.gapMm <= 10 && p.unfilledMm > 0.5).length / Math.max(1, has.filter((p) => p.gapMm <= 10).length),
        negativeGap: has.filter((p) => p.gapMm < 0).length, // cortex pokes through the inner table: mesh overlap
        worstUnfilled: [...has]
          .sort((a, b) => b.unfilledMm - a.unfilledMm)
          .slice(0, 8)
          .map((p) => ({ mni: p.m.map((x) => +x.toFixed(2)), gap: +p.gapMm.toFixed(2), unfilled: +p.unfilledMm.toFixed(2), entry: p.entry.map((x) => Math.round(x)) })),
      }

      // ── 3. Vessels vs cortex ──
      const hitO = { point: new THREE.Vector3(), distance: 0, faceIndex: 0 }
      const cb = cortex.map((t) => {
        const g = geo(t)
        g.boundingBox ?? g.computeBoundingBox()
        return { g, box: g.boundingBox }
      })
      const dCortex = (p) => {
        let best = Infinity
        for (const { g, box } of cb) {
          if (box.distanceToPoint(p) >= best) continue
          const h = g.boundsTree.closestPointToPoint(p, hitO)
          if (h && h.distance < best) best = h.distance
        }
        return best
      }
      const INSIDE = new THREE.Vector3(0.31, 0.52, 0.79).normalize()
      const inside = (p) => {
        const hits = []
        ray.origin.copy(p)
        ray.direction.copy(INSIDE)
        for (const { g, box } of cb) {
          if (!box.containsPoint(p) && !box.intersectsBox(new THREE.Box3().setFromCenterAndSize(p, new THREE.Vector3(0.01, 0.01, 0.01)))) {
            // the ray can still enter the box from outside, so only skip when the box is behind the point along the ray
            const tmp = new THREE.Vector3()
            if (!ray.intersectBox(box, tmp)) continue
          }
          for (const x of g.boundsTree.raycast(ray, THREE.DoubleSide, 0, 400)) hits.push(x.distance)
        }
        const s = [...hits].sort((a, b) => a - b)
        let n = 0,
          last = -1
        for (const d of s) {
          if (last < 0 || d - last >= 0.15) n++
          last = d
        }
        return n % 2 === 1
      }
      let total = 0
      for (const t of vessels) total += geo(t).attributes.position.count
      const stride = Math.max(1, Math.ceil(total / VESSELS))
      const NEAR = 6,
        AIR = 0.5
      const agg = { sampled: 0, inCortex: 0, near: 0, onSurface: 0, air05: 0, air1: 0, air2: 0, far: 0 }
      const per = []
      const v = new THREE.Vector3()
      const dists = []
      for (const t of vessels) {
        const pos = geo(t).attributes.position
        const m = { id: t.id, n: 0, near: 0, air: 0 }
        for (let i = 0; i < pos.count; i += stride) {
          v.set(pos.getX(i), pos.getY(i), pos.getZ(i))
          agg.sampled++
          m.n++
          const d = dCortex(v)
          if (d > NEAR + 1) {
            agg.far++
            continue
          }
          // inside the cortical volume (buried, which is fine) vs. outside (sulcal CSF space or air)
          if (inside(v)) {
            agg.inCortex++
            continue
          }
          if (d > NEAR) {
            agg.far++
            continue
          }
          agg.near++
          m.near++
          dists.push(d)
          if (d <= AIR) agg.onSurface++
          else {
            agg.air05++
            m.air++
            if (d > 1) agg.air1++
            if (d > 2) agg.air2++
          }
        }
        if (m.near >= 20) per.push(m)
      }
      per.sort((a, b) => b.air / b.near - a.air / a.near)
      res.vessels = {
        stride,
        totalVertices: total,
        ...agg,
        airborneFracOfNear: agg.near ? agg.air05 / agg.near : 0,
        over1FracOfNear: agg.near ? agg.air1 / agg.near : 0,
        nearDist: stats(dists),
        worst: per.slice(0, 8).map((m) => ({ id: m.id, near: m.near, airFrac: +(m.air / m.near).toFixed(2) })),
        meshesWithNear: per.length,
      }
      return res
    },
    RAYS,
    VESSELS,
    EXTRA,
  )

  fs.writeFileSync(`${out}/audit-anatomy.json`, JSON.stringify(R, null, 2))
  const f = (x, n = 2) => (typeof x === 'number' ? x.toFixed(n) : String(x))
  const sd = (s) => (s ? `n=${s.n} min ${f(s.min)} p5 ${f(s.p5)} med ${f(s.median)} mean ${f(s.mean)} p95 ${f(s.p95)} max ${f(s.max)}` : '—')
  console.log(`\nmeshes: skull ${R.counts.skull}, cortex ${R.counts.cortex}, vessels ${R.counts.vessels}; layer meshes: ${R.counts.layers.join(', ') || "yo'q"}`)
  console.log(`brain centre (MNI): ${R.centreMni.map((x) => f(x, 1)).join(', ')}\n\nSites (mm):`)
  for (const [n, s] of Object.entries(R.sites)) {
    if (!s) console.log(`  ${n.padEnd(10)} — (skull not hit)`)
    else
      console.log(
        `  ${n.padEnd(10)} entry ${s.entry
          .map((x) => f(x, 0))
          .join(',')
          .padEnd(
            12,
          )} bone ${f(s.boneMm)} | inner→cortex gap ${s.gapMm == null ? '—' : f(s.gapMm)} | unfilled ${s.unfilledMm == null ? '—' : f(s.unfilledMm)} | dura ${s.duraBetween ? 'bor' : "YO'Q"} | layer surfaces [${s.layerSurfaces.join(', ')}]`,
      )
  }
  const S = R.sweep
  console.log(`\nCalvarium sweep (${S.hit}/${S.rays} rays hit the skull):`)
  console.log(`  bone thickness   ${sd(S.boneMm)}`)
  console.log(`  inner→cortex gap ${sd(S.gapMm)}`)
  console.log(`  unfilled gap     ${sd(S.unfilledMm)}`)
  if (S.worstUnfilled?.length) console.log(`  worst unfilled rays: ${S.worstUnfilled.map((w) => `dir[${w.mni}] gap ${w.gap} unfilled ${w.unfilled}`).join(' | ')}`)
  console.log(`  deep-fissure rays (gap > 10 mm): ${f(S.fissureFrac * 100, 1)} %; unfilled > 0.5 mm outside them: ${f(S.unfilledOver0p5NoFissure * 100, 2)} %`)
  console.log(
    `  dura between bone and cortex: ${f(S.duraCoverage * 100, 1)} % of rays; gap > 0.5 mm: ${f(S.gapOver0p5 * 100, 1)} %; unfilled > 0.5 mm: ${f(S.unfilledOver0p5 * 100, 1)} %; negative gap (overlap): ${S.negativeGap}`,
  )
  const V = R.vessels
  console.log(
    `\nVessels: ${V.sampled} samples of ${V.totalVertices} vertices (stride ${V.stride}): inside cortex ${V.inCortex}, farther than 6 mm ${V.far}, near-surface ${V.near}`,
  )
  console.log(
    `  near-surface: on surface (≤ 0.5 mm) ${V.onSurface}, airborne > 0.5 mm ${V.air05} (${f(V.airborneFracOfNear * 100, 1)} %), > 1 mm ${V.air1} (${f(V.over1FracOfNear * 100, 1)} %), > 2 mm ${V.air2}`,
  )
  console.log(`  near-surface distance: ${sd(V.nearDist)}`)
  console.log(`  worst meshes (airborne fraction): ${V.worst.map((w) => `${w.id} ${w.airFrac} (${w.near})`).join('; ')}`)

  console.log('\nQabul mezonlari (--strict):')
  check(
    S.unfilledOver0p5NoFissure <= 0.01,
    `bo'shliq: qatlamlar bilan to'lmagan oraliq > 0.5 mm bo'lgan nurlar ≤ 1 % (o'rta yoriqdan tashqari; yoriq ${f(S.fissureFrac * 100, 1)} %)  (hozir ${f(S.unfilledOver0p5NoFissure * 100, 2)} %)`,
  )
  check(S.duraCoverage >= 0.99, `dura: suyak va po'stloq orasida ≥ 99 % nurda  (hozir ${f(S.duraCoverage * 100, 1)} %)`)
  check(S.negativeGap === 0, `po'stloq ichki plastinkaga kirmaydi  (kirgan: ${S.negativeGap})`)
  check(V.airborneFracOfNear <= 0.05, `tomirlar: yuzaga yaqin namunalarning ≥ 95 % i po'stloqdan ≤ 0.5 mm  (hozir havoda ${f(V.airborneFracOfNear * 100, 1)} %)`)
  console.log(`\nJSON: ${out}/audit-anatomy.json`)
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
