import type { L10n, Mni } from '../types'
import { angleDeg, dist, mul, sub, unit } from '../vec'
import { findKocher, judgeMark, projectToSkull, type KocherModel } from './kocher'
import { EVD_PARAMS, sideId } from './params'
import { kakarla, pathLength, scoreAll, tipRegion, tremorRms } from './score'
import {
  EVD_STEPS,
  type EvdApi,
  type EvdEvent,
  type EvdMetrics,
  type EvdOptions,
  type EvdParams,
  type EvdReport,
  type EvdSnapshot,
  type EvdStepId,
  type EvdStepRecord,
  type EvdWorld,
  type MarkResult,
  type PositionChecks,
  type TipSample,
} from './types'

/** Length of the back-ray used to find where the instrument crossed the outer table, mm. */
const BACK_MM = 300
/** Below this scalp depth the tip is in or on the head's shell; hazard checks start deeper. */
const HAZARD_FROM_MM = 12
const TRACE_MIN_DT = 0.01
const TRACE_MAX = 40000
const PUBLISH_MS = 60

interface Pt {
  t: number
  p: Mni
  /** Scalp depth, mm (positive = inside the head). */
  d: number
}
interface PassEntry {
  entry: Mni
  normal: Mni
}
interface HazardState {
  inside: boolean
  warned: boolean
  hits: number
}

const idx = (s: EvdStepId) => EVD_STEPS.indexOf(s)

/**
 * The EVD procedure engine (SX-3): step state machine, Kocher point, pass counting, hazard collisions, CSF detection,
 * metrics and score. It owns no rendering and no input source: geometry comes through `EvdWorld`, the catheter through
 * `feed()`. Time comes from `clock` (seconds) so tests are deterministic.
 */
export class EvdSession implements EvdApi {
  private P: EvdParams
  private world: EvdWorld
  private clock: () => number
  private listeners = new Set<(s: EvdSnapshot) => void>()
  private lastPublish = 0

  private opts: EvdOptions = { level: 2, side: 'right', laser: false }
  private ids = EVD_PARAMS.ids
  private running = false
  private finished = false
  private t0 = 0
  private kocher: KocherModel | null = null
  private steps: EvdStepRecord[] = []
  private position: PositionChecks | null = null
  private mark: MarkResult | null = null
  private marks = 0
  private passes = 0
  private inPass = false
  private entries: PassEntry[] = []
  private csf = false
  private trace: Pt[] = []
  private events: EvdEvent[] = []
  private hazards = new Map<string, HazardState>()
  private minHazard = Infinity
  private nearest: EvdSnapshot['nearest'] = null
  private tipInfo: EvdSnapshot['tip'] = null
  private lastSample: TipSample | null = null
  private lastTable: number | null = null
  private sequenceErrors = 0
  private earlyLatch = false
  private overshootLatched = false
  private metrics: EvdMetrics | null = null
  private report: EvdReport | null = null

  constructor(world: EvdWorld, params: EvdParams = EVD_PARAMS, clock: () => number = () => performance.now() / 1000) {
    this.world = world
    this.P = params
    this.clock = clock
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  begin(opts: EvdOptions) {
    this.reset()
    this.opts = opts
    const side = opts.side
    this.ids = {
      ...this.P.ids,
      ventricle: sideId(this.P.ids.ventricle, side),
      contraVentricle: side === 'right' ? this.P.ids.contraVentricle : this.P.ids.ventricle,
      skullParietal: sideId(this.P.ids.skullParietal, side),
    }
    this.kocher = findKocher(this.world, this.P, side)
    this.t0 = this.clock()
    this.running = true
    this.steps = EVD_STEPS.map((id, i) => ({ id, status: i === 0 ? 'active' : 'locked', startedAt: i === 0 ? 0 : null, doneAt: null }))
    this.push({ t: 0, type: 'step', step: 'position', status: 'active' })
    this.publish(true)
  }

  reset() {
    this.running = false
    this.finished = false
    this.kocher = null
    this.steps = []
    this.position = null
    this.mark = null
    this.marks = 0
    this.passes = 0
    this.inPass = false
    this.entries = []
    this.csf = false
    this.trace = []
    this.events = []
    this.hazards.clear()
    this.minHazard = Infinity
    this.nearest = null
    this.tipInfo = null
    this.lastSample = null
    this.lastTable = null
    this.sequenceErrors = 0
    this.earlyLatch = false
    this.overshootLatched = false
    this.metrics = null
    this.report = null
    this.publish(true)
  }

  private now() {
    return this.clock() - this.t0
  }

  private get cur(): EvdStepRecord {
    return this.steps.find((s) => s.status === 'active') ?? this.steps[this.steps.length - 1]
  }

  private push(e: EvdEvent) {
    this.events.push(e)
    if (this.events.length > 400) this.events.splice(0, this.events.length - 400)
  }

  private complete(id: EvdStepId) {
    const t = this.now()
    const i = idx(id)
    const s = this.steps[i]
    if (s.status === 'done') return
    s.status = 'done'
    s.doneAt = t
    this.push({ t, type: 'step', step: id, status: 'done' })
    const next = this.steps[i + 1]
    if (next && next.status === 'locked') {
      next.status = 'active'
      next.startedAt = t
      this.push({ t, type: 'step', step: next.id, status: 'active' })
    }
  }

  private outOfOrder(wanted: EvdStepId) {
    this.sequenceErrors++
    this.push({ t: this.now(), type: 'out-of-order', wanted, current: this.cur.id })
    this.publish(true)
  }

  // ── Steps ────────────────────────────────────────────────────────────

  setPosition(c: PositionChecks) {
    if (!this.running || this.cur.id !== 'position') return
    this.position = c
    const issues: ('side' | 'head' | 'elevation' | 'coag')[] = []
    if (c.side !== this.opts.side) issues.push('side')
    if (!c.neutralHead) issues.push('head')
    if (!c.headUp30to45) issues.push('elevation')
    if (!c.coagAndAntibiotic) issues.push('coag')
    this.push({ t: this.now(), type: 'position', issues })
    this.publish(true)
  }

  placeMark(p: Mni): MarkResult | null {
    if (!this.running || !this.kocher) return null
    if (this.cur.id !== 'mark') {
      this.outOfOrder('mark')
      return null
    }
    const hit = projectToSkull(this.world, this.P, this.opts.side, p)
    const on = hit ? hit.point : p
    this.mark = judgeMark(this.kocher, this.P, this.opts.side, on)
    this.marks++
    this.push({ t: this.now(), type: 'mark', mark: this.mark })
    this.publish(true)
    return this.mark
  }

  confirm(step?: EvdStepId): boolean {
    if (!this.running || this.finished) return false
    const cur = this.cur.id
    const want = step ?? cur
    if (want !== cur) {
      this.outOfOrder(want)
      return false
    }
    switch (cur) {
      case 'position':
        if (!this.position) return false
        break
      case 'mark':
        if (!this.mark) return false
        break
      case 'incision':
      case 'burr':
      case 'dura':
        break
      case 'secure':
        this.finish()
        return true
      default:
        return false // insert / csf / seat are driven by the catheter
    }
    this.complete(cur)
    this.publish(true)
    return true
  }

  // ── Catheter ─────────────────────────────────────────────────────────

  /** Depth of the tip below the outer table, found by sending a ray along the instrument from outside the skull. */
  private tableDepth(tip: Mni, dir: Mni) {
    const origin = sub(tip, mul(dir, BACK_MM))
    const hit = this.world.raycast([this.P.ids.skullFrontal, this.ids.skullParietal], origin, dir)
    if (!hit) return { depth: null as number | null, hit: null }
    return { depth: BACK_MM - hit.distance, hit }
  }

  feed(s: TipSample) {
    if (!this.running || this.finished) return
    const c = this.cur.id
    const k = idx(c)
    this.lastSample = s
    if (k < idx('insert')) {
      // The catheter may not enter the head before the earlier steps are done: recorded once per approach.
      if (s.scalpDepthMm > 5 && !this.earlyLatch) {
        this.earlyLatch = true
        this.outOfOrder('insert')
      } else if (s.scalpDepthMm < 0) this.earlyLatch = false
      return
    }
    if (c === 'secure') return
    const dir = unit(s.dir)
    const td = this.tableDepth(s.tip, dir)
    const table = s.tableDepthMm ?? td.depth
    this.lastTable = table
    const t = this.now()

    const last = this.trace[this.trace.length - 1]
    if (!last || s.t - last.t >= TRACE_MIN_DT) {
      this.trace.push({ t: s.t, p: s.tip, d: s.scalpDepthMm })
      if (this.trace.length > TRACE_MAX) this.trace.shift()
    }

    // Passes (hysteresis on the scalp depth).
    if (!this.inPass && s.scalpDepthMm > this.P.passEnterDepthMm.value) {
      this.inPass = true
      this.passes++
      this.entries.push({ entry: td.hit?.point ?? s.tip, normal: td.hit?.normal ?? [0, 0, 1] })
      this.push({ t, type: 'pass-start', pass: this.passes })
    } else if (this.inPass && s.scalpDepthMm < this.P.passExitDepthMm.value) {
      this.inPass = false
      this.push({ t, type: 'pass-end', pass: this.passes })
    }

    // Hazards.
    this.nearest = null
    if (s.scalpDepthMm > HAZARD_FROM_MM) this.checkHazards(s, t)

    // CSF: the tip reaches a ventricle.
    if (!this.csf && s.scalpDepthMm > this.P.passEnterDepthMm.value) {
      const w = this.world
      const hit = [this.ids.ventricle, this.ids.thirdVentricle, this.ids.contraVentricle].some((id) => w.isInside(id, s.tip))
      if (hit) {
        this.csf = true
        this.push({ t, type: 'csf', depthMm: table ?? s.scalpDepthMm, tableDepthMm: table })
        this.complete('insert')
        this.complete('csf')
      }
    }
    if (!this.csf && !this.overshootLatched && table != null && table > this.P.redDepthMm.value) {
      this.overshootLatched = true
      this.push({ t, type: 'overshoot', depthMm: table })
    }

    const monro = this.kocher?.monro ?? null
    this.tipInfo = {
      p: s.tip,
      scalpDepthMm: s.scalpDepthMm,
      tableDepthMm: table,
      monroMm: monro ? dist(s.tip, monro) : null,
      angleToIdealDeg: monro ? angleDeg(dir, sub(monro, s.tip)) : null,
    }
    this.publish(false)
  }

  private checkHazards(s: TipSample, t: number) {
    const w = this.world
    // CSF-filled space cannot injure tissue, and the atlas meshes of the caudate and fornix overlap the ventricle: no solid hit while the tip is in a ventricle.
    const inVentricle = [this.ids.ventricle, this.ids.thirdVentricle, this.ids.contraVentricle].some((id) => w.isInside(id, s.tip))
    for (const h of this.P.hazards) {
      const id = sideId(h.partId, this.opts.side)
      let st = this.hazards.get(id)
      if (!st) this.hazards.set(id, (st = { inside: false, warned: false, hits: 0 }))
      let mm: number | null
      if (h.kind === 'solid') {
        const inside = w.isInside(id, s.tip)
        if (inside == null) continue
        mm = inside ? 0 : w.distanceTo(id, s.tip)
        const bad = !!inside && !inVentricle
        if (bad && !st.inside) this.hit(id, h, t, s.tip, st)
        st.inside = bad
      } else {
        mm = w.distanceTo(id, s.tip)
        if (mm == null) continue
        if (mm < h.contactMm && !st.inside) this.hit(id, h, t, s.tip, st)
        if (mm < h.contactMm) st.inside = true
        else if (mm > h.contactMm + 0.5) st.inside = false
      }
      if (mm == null) continue
      if (mm < this.minHazard) this.minHazard = mm
      if (!this.nearest || mm < this.nearest.mm) this.nearest = { partId: id, mm, severity: h.severity }
      if (mm < h.warnMm && !st.warned) {
        st.warned = true
        this.push({ t, type: 'warn', partId: id, mm, severity: h.severity })
      } else if (mm > h.warnMm + 1) st.warned = false
    }
  }

  private hit(id: string, h: EvdParams['hazards'][number], t: number, tip: Mni, st: HazardState) {
    st.hits++
    this.push({ t, type: 'collision', partId: id, severity: h.severity, consequence: h.consequence, tip })
  }

  /** Step 8: stylet out, depth set. Freezes the tip and computes the metrics. */
  seat() {
    if (!this.running || this.finished) return
    const c = this.cur.id
    if (c !== 'insert' && c !== 'csf' && c !== 'seat') {
      this.outOfOrder('seat')
      return
    }
    const s = this.lastSample
    if (!s || !this.kocher) return
    if (c === 'insert') {
      // No CSF was ever seen: the catheter is in the parenchyma. The steps still close; the Kakarla grade says why it failed.
      this.complete('insert')
      this.complete('csf')
    }
    this.complete('seat')
    this.metrics = this.computeMetrics(s)
    this.publish(true)
  }

  private computeMetrics(s: TipSample): EvdMetrics {
    const k = this.kocher!
    const P = this.P
    const tip = s.tip
    const last = this.entries[this.entries.length - 1]
    const dir = unit(s.dir)
    const entry = last?.entry ?? this.tableDepth(tip, dir).hit?.point ?? k.entry
    const normal = last?.normal ?? k.normal
    const actual = unit(sub(tip, entry))
    const ideal = unit(sub(k.monro, entry))
    const inHead = this.trace.filter((p) => p.d > 0)
    const lActual = pathLength(inHead)
    const lIdeal = dist(entry, tip)
    const toMonro = dist(tip, k.monro)
    const table = this.lastTable ?? lIdeal
    const region = tipRegion(this.world, P, this.opts.side, tip, this.lastTable)
    const cols: string[] = []
    let n = 0
    for (const [id, st] of this.hazards) {
      if (st.hits > 0) {
        cols.push(id)
        n += st.hits
      }
    }
    const steps = this.steps
    const start = steps[idx('mark')].startedAt ?? 0
    const end = steps[idx('seat')].doneAt ?? this.now()
    return {
      durationS: Math.max(0, end - start),
      passes: this.passes,
      angleErrDeg: angleDeg(actual, ideal),
      angleVsGhajarDeg: angleDeg(actual, mul(normal, -1)),
      entryErrMm: dist(entry, k.entry),
      tipToMonroMm: toMonro,
      depthMm: Math.max(0, table),
      idealDepthMm: dist(entry, k.monro),
      collisionIds: cols,
      collisions: n,
      minHazardMm: this.minHazard,
      tremorRmsMm: tremorRms(
        inHead.map((p) => ({ t: p.t, p: p.p })),
        P.tremorHz.value,
      ),
      pathEfficiency: lActual > 1e-6 ? Math.min(1, lIdeal / lActual) : 0,
      sequenceErrors: this.sequenceErrors,
      kakarla: kakarla(P, region, toMonro),
    }
  }

  /** Step 9: report. */
  finish(): EvdReport | null {
    if (!this.running) return null
    if (!this.metrics) {
      this.outOfOrder('seat')
      return null
    }
    if (this.finished) return this.report
    this.complete('secure')
    this.finished = true
    this.push({ t: this.now(), type: 'finish' })
    const m = { ...this.metrics, sequenceErrors: this.sequenceErrors }
    const sc = scoreAll(m, this.P)
    this.report = {
      finishedAt: new Date().toISOString(),
      options: this.opts,
      kocher: this.kocher,
      mark: this.mark,
      marks: this.marks,
      position: this.position,
      metrics: m,
      scores: sc.scores,
      total: sc.total,
      caps: sc.caps as readonly L10n[],
      trace: this.trace.filter((p) => p.d > -5).map((p) => ({ t: p.t, p: p.p })),
      events: [...this.events],
    }
    this.publish(true)
    return this.report
  }

  // ── Store ────────────────────────────────────────────────────────────

  snapshot(): EvdSnapshot {
    return {
      running: this.running,
      finished: this.finished,
      options: this.opts,
      step: this.steps.length ? this.cur.id : 'position',
      steps: this.steps.map((s) => ({ ...s })),
      elapsedS: this.running ? this.now() : 0,
      kocher: this.kocher,
      mark: this.mark,
      marks: this.marks,
      passes: this.passes,
      csf: this.csf,
      tip: this.tipInfo,
      nearest: this.nearest,
      events: [...this.events],
      report: this.report,
    }
  }

  subscribe(fn: (s: EvdSnapshot) => void) {
    this.listeners.add(fn)
    fn(this.snapshot())
    return () => this.listeners.delete(fn)
  }

  private publish(force: boolean) {
    const now = performance.now()
    if (!force && now - this.lastPublish < PUBLISH_MS) return
    this.lastPublish = now
    if (!this.listeners.size) return
    const s = this.snapshot()
    for (const f of this.listeners) f(s)
  }
}
