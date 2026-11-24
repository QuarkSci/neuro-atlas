import type { Mni } from '../types'
import { add, dist, mul, sub, unit } from '../vec'
import { tremorRms, type TimedPoint } from '../evd/score'
import { sideId } from '../evd/params'
import { fromAcpc, lineMiss, makeFrame, plannedPoint, toAcpc } from './geometry'
import { DBS_PARAMS } from './params'
import { trackTruth, type TrackTruth } from './mer'
import { scoreDbs } from './score'
import { stimulate } from './stim'
import { analyseTrajectory } from './trajectory'
import {
  DBS_STEPS,
  type AcPcFrame,
  type DbsData,
  type DbsEvent,
  type DbsMetrics,
  type DbsParams,
  type DbsReport,
  type DbsSide,
  type DbsStepId,
  type DbsWorld,
  type MerReading,
  type StimReading,
  type TrackOffset,
  type TrackState,
  type TrajectoryAnalysis,
} from './logic'
import type { DbsExportRow, DbsTargetId } from './types'

const AC_ID = 'g-anterior-commissure',
  PC_ID = 'g-posterior-commissure'
/** Targets whose atlas structure stands for the nucleus itself (Julich); the others use the literature point in the true frame (dbs.md 3.4). */
const ATLAS_TRUTH: Partial<Record<DbsTargetId, string>> = { stn: 'j-stn-right' }
/** Julich ↔ BodyParts3D pairs for the cross-atlas offset in the export. */
const GROSS_PAIR: Partial<Record<DbsTargetId, string>> = { stn: 'g-right-subthalamic-nucleus' }

const mid = (r: { min: number; max: number }) => (r.min + r.max) / 2

/**
 * OP-2 DBS session (dbs.md 4.1): plan → trajectory → burr → guide → MER → stimulation → implant. Pure logic over an injected
 * `DbsWorld` + `DbsData`; time comes from an injectable clock so tests are deterministic.
 */
export class DbsSession {
  private world: DbsWorld
  private data: DbsData
  private P: DbsParams
  private clock: () => number
  private t0 = 0
  private step: DbsStepId = 'plan'
  private id: DbsTargetId = 'stn'
  private side: DbsSide = 'right'
  private running = false
  private finished = false
  private frame: AcPcFrame | null = null
  private trueFrame: AcPcFrame | null = null
  private frameError = 0
  private entry: Mni | null = null
  private analysis: TrajectoryAnalysis | null = null
  private burrAt: number | null = null
  private sealed = false
  private sealedAt: number | null = null
  private guideDepth: number | null = null
  private tracks: TrackState[] = []
  private cur = -1
  private trace: TimedPoint[] = []
  readonly events: DbsEvent[] = []
  private report: DbsReport | null = null

  constructor(world: DbsWorld, data: DbsData, P: DbsParams = DBS_PARAMS, clock: () => number = () => performance.now() / 1000) {
    this.world = world
    this.data = data
    this.P = P
    this.clock = clock
  }

  private now() {
    return this.clock() - this.t0
  }
  private push(e: DbsEvent) {
    this.events.push(e)
  }
  private outOfOrder(wanted: DbsStepId) {
    this.push({ t: this.now(), type: 'out-of-order', wanted })
    return false
  }

  begin(id: DbsTargetId, side: DbsSide) {
    this.id = id
    this.side = side
    this.t0 = this.clock()
    this.step = 'plan'
    this.running = true
    this.finished = false
    this.frame = this.trueFrame = null
    this.frameError = 0
    this.entry = null
    this.analysis = null
    this.burrAt = this.sealedAt = null
    this.sealed = false
    this.guideDepth = null
    this.tracks = []
    this.cur = -1
    this.trace = []
    this.events.length = 0
    this.report = null
    this.push({ t: 0, type: 'step', step: 'plan' })
    const ac = this.world.centroid(AC_ID),
      pc = this.world.centroid(PC_ID)
    if (ac && pc) this.trueFrame = makeFrame(ac, pc)
  }

  get currentStep() {
    return this.step
  }
  get acpcFrame() {
    return this.frame
  }
  get trajectory() {
    return this.analysis
  }
  get tracksUsed() {
    return this.tracks.length
  }

  // ── Step 1: AC–PC and target ─────────────────────────────────────────

  /** Mark AC and PC (MNI mm). The error against the atlas commissures is the mean of the two distances. */
  markAcpc(ac: Mni, pc: Mni, up?: Mni) {
    if (!this.running || this.step !== 'plan') {
      this.outOfOrder('plan')
      return null
    }
    this.frame = makeFrame(ac, pc, up)
    const tf = this.trueFrame
    this.frameError = tf ? (dist(ac, tf.ac) + dist(pc, tf.pc)) / 2 : 0
    this.push({ t: this.now(), type: 'frame', errorMm: this.frameError })
    return { lengthMm: this.frame.lengthMm, errorMm: this.frameError }
  }

  /** Planned target in MNI from the learner's frame (mid-range literature coordinates). */
  planned(): Mni | null {
    if (!this.frame) return null
    const t = this.data.targets[this.id]
    return plannedPoint(this.frame, [mid(t.acpc.lateral.value), mid(t.acpc.y.value), mid(t.acpc.z.value)], this.side)
  }

  /** The atlas target the electrode is judged against, before brain shift (MNI). */
  private truthBase(): Mni | null {
    const atlas = ATLAS_TRUTH[this.id]
    if (atlas) {
      const c = this.world.centroid(this.side === 'right' ? atlas : sideId(atlas, 'left'))
      if (c) return c
    }
    const f = this.trueFrame ?? this.frame
    const t = this.data.targets[this.id]
    return f ? plannedPoint(f, [mid(t.acpc.lateral.value), mid(t.acpc.y.value), mid(t.acpc.z.value)], this.side) : null
  }

  /** Brain shift now, mm (posterior and inferior in the AC–PC frame), from the time the dura has been open. */
  brainShiftMm(): number {
    if (this.burrAt === null) return 0
    const end = this.now()
    const sealAt = this.sealedAt ?? end
    const open = Math.max(0, sealAt - this.burrAt) / 60
    const sealed = Math.max(0, end - sealAt) / 60
    return Math.min(this.P.shiftCapMm, open * this.P.shiftRateMmMin + (this.sealedAt !== null ? sealed * this.P.shiftRateSealedMmMin : 0))
  }

  private truthPoint(): Mni | null {
    const b = this.truthBase()
    if (!b) return null
    const f = this.trueFrame ?? this.frame
    const k = this.brainShiftMm()
    if (!f || k === 0) return b
    // Posterior and inferior, equal parts.
    const d = unit(add(mul(f.ey, -1), mul(f.ez, -1)))
    return add(b, mul(d, k))
  }

  // ── Step 2: entry and trajectory ─────────────────────────────────────

  setEntry(entry: Mni): TrajectoryAnalysis | null {
    if (!this.running || this.step !== 'trajectory') {
      this.outOfOrder('trajectory')
      return null
    }
    const T = this.planned()
    if (!T || !this.frame) return null
    this.entry = entry
    this.analysis = analyseTrajectory(this.world, this.data, this.P, this.frame, this.id, this.side, entry, T)
    this.push({ t: this.now(), type: 'trajectory', analysis: this.analysis })
    return this.analysis
  }

  // ── Steps ────────────────────────────────────────────────────────────

  confirm(step?: DbsStepId): boolean {
    if (!this.running || this.finished) return false
    const want = step ?? this.step
    if (want !== this.step) return this.outOfOrder(want)
    if (this.step === 'plan' && !this.frame) return this.outOfOrder('plan')
    if (this.step === 'trajectory' && !this.entry) return this.outOfOrder('trajectory')
    if (this.step === 'burr') this.burrAt = this.now()
    if (this.step === 'mer' && this.tracks.length === 0) return this.outOfOrder('mer')
    const i = DBS_STEPS.indexOf(this.step)
    if (i >= DBS_STEPS.length - 1) return false
    this.step = DBS_STEPS[i + 1]
    this.push({ t: this.now(), type: 'step', step: this.step })
    if (this.step === 'mer' && this.tracks.length === 0) this.newTrack('center')
    return true
  }

  /** Fibrin glue / gelfoam on the opened dura (dbs.md 4.1 step 3): the brain shift slows down. */
  sealDura() {
    if (this.burrAt === null || this.sealed) return
    this.sealed = true
    this.sealedAt = this.now()
  }

  /** Step 4: guide tube to `depthMm` above the planned target. Closer than 10 mm above the target is mechanical injury. */
  guideTo(depthMm: number) {
    if (!this.running || this.step !== 'guide') return this.outOfOrder('guide')
    this.guideDepth = depthMm
    if (depthMm < 10) this.push({ t: this.now(), type: 'too-deep', depthMm })
    return true
  }

  // ── Tracks and MER ───────────────────────────────────────────────────

  private offsetVector(o: TrackOffset): Mni {
    const f = this.frame!
    const k = this.P.trackOffsetMm
    const lat = this.side === 'right' ? f.ex : mul(f.ex, -1)
    switch (o) {
      case 'anterior':
        return mul(f.ey, k)
      case 'posterior':
        return mul(f.ey, -k)
      case 'lateral':
        return mul(lat, k)
      case 'medial':
        return mul(lat, -k)
      default:
        return [0, 0, 0]
    }
  }

  /** A new microdrive pass (Ben-Gun offset). Counts as a track; only in the guide / MER / stimulation steps. */
  newTrack(offset: TrackOffset = 'center'): TrackState | null {
    if (!this.running || !this.entry || !this.frame) return null
    if (!['mer', 'stim', 'guide'].includes(this.step)) {
      this.outOfOrder('mer')
      return null
    }
    const T = this.planned()!
    const off = this.offsetVector(offset)
    const target = add(T, off),
      entry = add(this.entry, off)
    const tr: TrackState = {
      id: this.tracks.length + 1,
      offset,
      entry,
      target,
      dir: unit(sub(target, entry)),
      deepestMm: -Infinity,
      shallowestMm: Infinity,
      enterMm: null,
      exitMm: null,
    }
    this.tracks.push(tr)
    this.cur = this.tracks.length - 1
    this.push({ t: this.now(), type: 'track', id: tr.id, offset })
    return tr
  }

  selectTrack(id: number) {
    const i = this.tracks.findIndex((t) => t.id === id)
    if (i >= 0) this.cur = i
  }

  private track() {
    return this.cur >= 0 ? this.tracks[this.cur] : null
  }

  /** Position on a track at `depth` (relative to its planned target, + above). */
  private at(tr: TrackState, depth: number): Mni {
    return sub(tr.target, mul(tr.dir, depth))
  }

  private truthFor(tr: TrackState): { truth: TrackTruth; T: Mni } | null {
    const T = this.truthPoint()
    if (!T) return null
    const m = lineMiss(tr.target, tr.dir, T)
    // m.s > 0: the true target lies deeper than the planned point along the track.
    return { truth: trackTruth(this.data, this.P, this.id, m.s, m.missMm), T }
  }

  /** Move the microelectrode to `depthMm` (clamped to the MER window) and read it. */
  drive(depthMm: number): MerReading | null {
    const tr = this.track()
    if (!this.running || !tr || !['mer', 'stim'].includes(this.step)) {
      this.outOfOrder('mer')
      return null
    }
    const d = Math.max(this.P.merBottomMm, Math.min(this.P.merTopMm, Math.round(depthMm / this.P.merStepMm) * this.P.merStepMm))
    tr.deepestMm = Math.max(tr.deepestMm, -d)
    tr.shallowestMm = Math.min(tr.shallowestMm, -d)
    const tf = this.truthFor(tr)
    if (!tf) return null
    const tip = this.at(tr, d)
    return { depthMm: d, pattern: tf.truth.pattern(d), tip }
  }

  /** The learner marks where the target layer starts (`enter`, first depth with target activity) or ends (`exit`). */
  markBoundary(kind: 'enter' | 'exit', depthMm: number) {
    const tr = this.track()
    if (!tr) return
    if (kind === 'enter') tr.enterMm = depthMm
    else tr.exitMm = depthMm
  }

  // ── Stimulation ──────────────────────────────────────────────────────

  stimulate(depthMm: number, mA: number): StimReading | null {
    const tr = this.track()
    if (!this.running || !tr || !['mer', 'stim'].includes(this.step)) {
      this.outOfOrder('stim')
      return null
    }
    const T = this.truthPoint()
    if (!T) return null
    return stimulate(this.world, this.data, this.P, this.id, this.side, this.at(tr, depthMm), T, mA)
  }

  /** Feed the hand/tool tip for the tremor metric (optional). */
  feed(t: number, tip: Mni) {
    this.trace.push({ t, p: tip })
  }

  // ── Implant and report ───────────────────────────────────────────────

  /** Final lead on the selected track at `depthMm`. Ends the session with a report. */
  implant(depthMm: number): DbsReport | null {
    const tr = this.track()
    if (!this.running || this.finished || !tr) return null
    let at: DbsStepId = this.step
    if (at === 'mer' || at === 'stim') {
      while (at !== 'implant' && this.confirm()) at = this.step
    }
    if (at !== 'implant') {
      this.outOfOrder('implant')
      return null
    }
    const T = this.truthPoint()!
    const tip = this.at(tr, depthMm)
    const radial = dist(tip, T)
    const f = this.frame!
    const tf = this.truthFor(tr)!
    const stim = stimulate(this.world, this.data, this.P, this.id, this.side, tip, T, 0)
    // MER boundaries: the learner's marks on the selected track against the true target window.
    let merErr: number | null = null
    const w = tf.truth.targetWindow
    if (w && tr.enterMm !== null && tr.exitMm !== null) merErr = (Math.abs(tr.enterMm - w[1]) + Math.abs(tr.exitMm - w[0])) / 2
    const a = this.analysis
    const m: DbsMetrics = {
      radialErrorMm: radial,
      clearanceMm: a ? a.minClearanceMm : Infinity,
      collisions: a ? a.collisions : 0,
      merBoundaryErrorMm: merErr,
      windowMa: stim.windowMa,
      tracks: this.tracks.length,
      frameErrorMm: this.frameError,
      durationS: this.now(),
      brainShiftMm: this.brainShiftMm(),
      tremorRmsMm: this.trace.length >= 8 ? tremorRms(this.trace) : null,
    }
    const { scores, total, caps } = scoreDbs(m, this.P)
    const ac = toAcpc(f, tip)
    const pair = GROSS_PAIR[this.id],
      atlas = ATLAS_TRUTH[this.id]
    let off = 0
    let gross: Mni = tip
    if (pair && atlas) {
      const g = this.world.centroid(this.side === 'right' ? pair : sideId(pair, 'left')),
        j = this.world.centroid(this.side === 'right' ? atlas : sideId(atlas, 'left'))
      if (g && j) {
        gross = add(tip, sub(g, j))
        off = dist(g, j)
      }
    }
    const row: DbsExportRow = {
      timestamp: new Date().toISOString(),
      target: this.id,
      side: this.side,
      acpcX: ac[0],
      acpcY: ac[1],
      acpcZ: ac[2],
      mniX: tip[0],
      mniY: tip[1],
      mniZ: tip[2],
      grossX: gross[0],
      grossY: gross[1],
      grossZ: gross[2],
      atlasOffsetMm: off,
      radialErrorMm: radial,
      tracks: this.tracks.length,
      windowMa: stim.windowMa,
    }
    const planned = this.planned()
    const j = atlas ? this.world.centroid(this.side === 'right' ? atlas : sideId(atlas, 'left')) : null
    this.finished = true
    this.running = false
    this.push({ t: this.now(), type: 'implant', radialMm: radial })
    this.report = {
      finishedAt: row.timestamp,
      target: this.id,
      side: this.side,
      metrics: m,
      scores,
      total,
      caps,
      export: row,
      planVsAtlasMm: planned && j ? dist(planned, j) : null,
    }
    return this.report
  }

  /** Read-only: where the electrode is for a track/depth (for drawing) and the true target (for tests and the PhD overlay). */
  debug() {
    return {
      guideDepth: this.guideDepth,
      truth: this.truthPoint(),
      planned: this.planned(),
      frame: this.frame,
      trueFrame: this.trueFrame,
      fromAcpc: this.frame ? (a: [number, number, number]) => fromAcpc(this.frame!, a) : null,
    }
  }
}
