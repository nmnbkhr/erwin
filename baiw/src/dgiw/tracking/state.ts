/**
 * Delivery-tracking persistence — the hooks over tracking/log.ts.
 *
 * All three stores go through `usePersistedState`, namespaced per engagement
 * — never raw localStorage. The status and KPI hooks deliberately do NOT
 * return the raw setter: the only mutations they expose are APPENDS, so a
 * component cannot rewrite history without leaving this module, and the
 * STATUS-LOG gate's no-edit-path assertion covers the UI's reach as well as
 * the primitives'. The timestamps are stamped HERE, at the moment a person
 * acts — the one place a real clock is the honest value (log.ts itself is
 * clockless so the gate can run it deterministically).
 */
import { useCallback } from 'react'
import { usePersistedState } from '../../engagement/usePersistedState'
import {
  appendCapture,
  appendTransition,
  isKpiLog,
  isReportingPeriod,
  isStatusLog,
  type KpiLog,
  type ReportingPeriod,
  type StatusLog,
  type StatusState,
} from './log'

export const STATUS_BASE = 'dgiw.status'
export const KPI_BASE = 'dgiw.kpi'
export const PERIOD_BASE = 'dgiw.period'

export const EMPTY_PERIOD: ReportingPeriod = { label: '', from: '', to: '' }

/** The status log and the one legal mutation: record a transition, now. */
export function useStatusLog(): [
  StatusLog,
  (artefactId: string, to: StatusState, note?: string) => void,
] {
  const [log, setLog] = usePersistedState<StatusLog>(STATUS_BASE, {}, isStatusLog)
  const record = useCallback(
    (artefactId: string, to: StatusState, note?: string) => {
      setLog((prev) =>
        appendTransition(prev, artefactId, {
          to,
          at: new Date().toISOString(),
          ...(note && note.trim() ? { note: note.trim() } : {}),
        }),
      )
    },
    [setLog],
  )
  return [log, record]
}

/** The capture log and the one legal mutation: record a measurement, now. */
export function useKpiLog(): [KpiLog, (kpiId: string, value: string, source: string) => void] {
  const [log, setLog] = usePersistedState<KpiLog>(KPI_BASE, [], isKpiLog)
  const capture = useCallback(
    (kpiId: string, value: string, source: string) => {
      setLog((prev) =>
        appendCapture(prev, { kpiId, value, capturedAt: new Date().toISOString(), source }),
      )
    },
    [setLog],
  )
  return [log, capture]
}

/** The reporting period is plain state — a label is not a history. */
export function useReportingPeriod(): [
  ReportingPeriod,
  (period: ReportingPeriod) => void,
] {
  const [period, setPeriod] = usePersistedState<ReportingPeriod>(
    PERIOD_BASE,
    EMPTY_PERIOD,
    isReportingPeriod,
  )
  return [period, setPeriod]
}
