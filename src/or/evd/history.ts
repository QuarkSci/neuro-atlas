/**
 * EVD training session history (localStorage), CSV export, and learning-curve helpers (AG-15).
 * Strictly follows `EVD_CSV_COLUMNS` and `EvdHistoryRow` from `src/or/evd/types.ts`.
 */
import { CUSUM, lcCusum, type CusumResult } from '../skill'
import { EVD_CSV_COLUMNS, type EvdHistoryRow, type EvdReport } from './types'

export const EVD_HISTORY_KEY = 'na:evd:history'
const MAX_ROWS = 200

export type CurveMetric = 'total' | 'angleErrDeg' | 'tipToMonroMm' | 'durationS' | 'tremorRmsMm' | 'ldj'

export interface CurvePoint {
  index: number
  value: number
  kakarla: number
  timestamp: string
}

const r = (v: number, digits = 2) => (Number.isFinite(v) ? Number(v.toFixed(digits)) : 0)

/** Convert a finished `EvdReport` into a flat `EvdHistoryRow` matching `EVD_CSV_COLUMNS`. */
export function reportToRow(report: EvdReport): EvdHistoryRow {
  const m = report.metrics
  return {
    timestamp: report.finishedAt,
    level: report.options.level,
    side: report.options.side,
    durationS: r(m.durationS, 1),
    passes: m.passes,
    angleErrDeg: r(m.angleErrDeg, 2),
    angleVsGhajarDeg: r(m.angleVsGhajarDeg, 2),
    entryErrMm: r(m.entryErrMm, 2),
    tipToMonroMm: r(m.tipToMonroMm, 2),
    depthMm: r(m.depthMm, 2),
    kakarlaGrade: m.kakarla.grade,
    tremorRmsMm: r(m.tremorRmsMm, 3),
    pathEfficiency: r(m.pathEfficiency, 3),
    collisions: m.collisions,
    sequenceErrors: m.sequenceErrors,
    total: r(report.total, 2),
    ldj: m.ldj === null ? '' : r(m.ldj, 2),
  }
}

const isValidRow = (x: unknown): x is EvdHistoryRow => {
  if (!x || typeof x !== 'object') return false
  const obj = x as Record<string, unknown>
  return typeof obj.timestamp === 'string' && typeof obj.total === 'number' && typeof obj.kakarlaGrade === 'number'
}

const defaultStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function loadHistory(storage: Pick<Storage, 'getItem'> | null = defaultStorage()): EvdHistoryRow[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(EVD_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidRow)
  } catch {
    return []
  }
}

export function saveHistory(rows: readonly EvdHistoryRow[], storage: Pick<Storage, 'setItem'> | null = defaultStorage()): void {
  if (!storage) return
  try {
    storage.setItem(EVD_HISTORY_KEY, JSON.stringify(rows.slice(-MAX_ROWS)))
  } catch {
    /* storage quota or private mode */
  }
}

/** Append a completed report to history (deduplicated by `finishedAt`), persist, and return updated rows. */
export function appendReport(report: EvdReport, storage: Pick<Storage, 'getItem' | 'setItem'> | null = defaultStorage()): EvdHistoryRow[] {
  const rows = loadHistory(storage)
  if (rows.some((row) => row.timestamp === report.finishedAt)) return rows
  const next = [...rows, reportToRow(report)].slice(-MAX_ROWS)
  saveHistory(next, storage)
  return next
}

export function clearHistory(storage: Pick<Storage, 'removeItem'> | null = defaultStorage()): void {
  if (!storage) return
  try {
    storage.removeItem(EVD_HISTORY_KEY)
  } catch {
    /* ignore */
  }
}

const csvCell = (v: string | number) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Serialize history rows into RFC 4180 CSV using the exact `EVD_CSV_COLUMNS` order. */
export function historyToCsv(rows: readonly EvdHistoryRow[]): string {
  const header = EVD_CSV_COLUMNS.join(',')
  const body = rows.map((row) => EVD_CSV_COLUMNS.map((col) => csvCell(row[col] ?? '')).join(','))
  return [header, ...body].join('\n')
}

/** Serialize the 3D catheter tip trajectory of a finished report into MNI-millimetre CSV. */
export function traceToCsv(report: EvdReport): string {
  const header = 't_s,x_mni,y_mni,z_mni'
  const body = report.trace.map((pt) => `${pt.t.toFixed(3)},${pt.p[0].toFixed(2)},${pt.p[1].toFixed(2)},${pt.p[2].toFixed(2)}`)
  return [header, ...body].join('\n')
}

/** Trigger a client-side CSV file download. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Extract a 1-based learning curve series for the chosen metric. Sessions saved before a metric existed (no `ldj`) are skipped. */
export function learningCurve(rows: readonly EvdHistoryRow[], metric: CurveMetric): CurvePoint[] {
  const out: CurvePoint[] = []
  rows.forEach((row, i) => {
    const raw = row[metric]
    if (metric === 'ldj' && (raw === undefined || raw === '' || !Number.isFinite(Number(raw)))) return
    out.push({ index: i + 1, value: Number(raw) || 0, kakarla: Number(row.kakarlaGrade) || 3, timestamp: String(row.timestamp) })
  })
  return out
}

/** A session counts as a success for LC-CUSUM when it ends in Kakarla 1, with no collision, and an overall score of at least 4.0 (sim-metrics.md 5.3). */
export const isSuccess = (row: EvdHistoryRow) => Number(row.kakarlaGrade) === 1 && Number(row.collisions) === 0 && Number(row.total) >= 4

/** LC-CUSUM over the stored sessions (p0 = 0.25, p1 = 0.10, h = 2.5). */
export const competence = (rows: readonly EvdHistoryRow[]): CusumResult => lcCusum(rows.map(isSuccess), CUSUM)
