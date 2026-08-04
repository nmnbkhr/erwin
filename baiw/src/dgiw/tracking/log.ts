/**
 * Delivery-tracking primitives — pure, no React, no storage, no clock.
 *
 * G5: the workbench learns to RUN an engagement, and everything it records is
 * append-only history:
 *
 *   dgiw.status  per artefactId, a transition log [{to, at, note?}]. The
 *                current state is the LAST entry — nothing is edited, nothing
 *                is deleted, and a regression (delivered -> in-progress) is a
 *                new entry beside the old one, not a correction of it. This
 *                log is the audit-trail seed the suite's backend trigger
 *                condition names, so its shape is treated as a record, not a
 *                cache: the module deliberately exports NO function that can
 *                return a log with fewer or altered entries, and the
 *                STATUS-LOG gate asserts that absence against the compiled
 *                module.
 *
 *   dgiw.kpi     captured measurements [{kpiId, value, capturedAt, source}].
 *                CAPTURED, NOT COMPUTED — no KPI value is ever derived by
 *                the tool; an entry exists only when a person records one,
 *                and `value` is a string because the tool has no business
 *                doing arithmetic on a number it did not measure.
 *
 * An artefact with no transitions has NO state — `currentState` returns null
 * and the caller says "not tracked". Defaulting it to 'planned' would be a
 * record nobody made, the D-001 shape at the level of a lifecycle.
 *
 * The reporting period is a consultant-chosen label with date boundaries.
 * `inPeriod` compares ISO dates as strings (timezone-free by construction:
 * `at` is truncated to its date part), inclusive on both ends; an empty
 * boundary means unbounded on that side, and the council pack prints the
 * boundaries it filtered by so a reader can check the claim.
 *
 * No React and no clock on purpose: the gate compiles this file and runs it,
 * and the hooks in tracking/state.ts stamp `at`/`capturedAt` at the moment a
 * person acts — the one place a real timestamp is the honest value.
 */

export const STATUS_STATES = ['planned', 'in-progress', 'delivered', 'accepted'] as const
export type StatusState = (typeof STATUS_STATES)[number]

export interface StatusTransition {
  to: StatusState
  /** ISO 8601, stamped when the person recorded the transition. */
  at: string
  note?: string
}

/** artefactId → append-only transition log. Current state = last entry. */
export type StatusLog = Record<string, StatusTransition[]>

export interface KpiCapture {
  /** A wave KPI id (K-W1-01 style) — KPI-ID asserts it exists in the plan. */
  kpiId: string
  /** Verbatim as recorded. Never parsed, never summed, never derived. */
  value: string
  /** ISO 8601, stamped when the person recorded the measurement. */
  capturedAt: string
  /** Where the number came from — the half of a measurement that makes it one. */
  source: string
}

/** Append-only capture log, in recording order. */
export type KpiLog = KpiCapture[]

export interface ReportingPeriod {
  /** The consultant's own name for the period — printed, never interpreted. */
  label: string
  /** ISO date (YYYY-MM-DD), inclusive. Empty = unbounded on this side. */
  from: string
  /** ISO date (YYYY-MM-DD), inclusive. Empty = unbounded on this side. */
  to: string
}

/* ── append — the ONLY way this module changes a log ─────────────────────── */

/**
 * A new log with one transition appended to `artefactId`'s history. The input
 * log and every existing entry are untouched (fresh objects on the changed
 * path), so a caller holding the old value holds the old record.
 */
export function appendTransition(
  log: StatusLog,
  artefactId: string,
  transition: StatusTransition,
): StatusLog {
  return { ...log, [artefactId]: [...(log[artefactId] ?? []), transition] }
}

/** A new capture log with one entry appended. Same contract as above. */
export function appendCapture(log: KpiLog, capture: KpiCapture): KpiLog {
  return [...log, capture]
}

/* ── reads ───────────────────────────────────────────────────────────────── */

/**
 * The last transition's state, or null when nothing was ever recorded —
 * "not tracked" is a fact the caller must render, never default away.
 */
export function currentState(log: StatusLog, artefactId: string): StatusState | null {
  const entries = log[artefactId]
  return entries && entries.length > 0 ? entries[entries.length - 1].to : null
}

/**
 * How many tracked artefacts sit in each state right now, plus how many of
 * `artefactIds` have no history at all. The denominator travels with the
 * counts because "3 delivered" of 17 and of 56 are different claims.
 */
export function stateCounts(
  log: StatusLog,
  artefactIds: string[],
): { counts: Record<StatusState, number>; tracked: number; untracked: number } {
  const counts = Object.fromEntries(STATUS_STATES.map((s) => [s, 0])) as Record<StatusState, number>
  let tracked = 0
  for (const id of artefactIds) {
    const state = currentState(log, id)
    if (state === null) continue
    counts[state]++
    tracked++
  }
  return { counts, tracked, untracked: artefactIds.length - tracked }
}

/** True when an ISO timestamp's DATE falls inside the period, inclusive. */
export function inPeriod(at: string, period: ReportingPeriod): boolean {
  const day = at.slice(0, 10)
  if (period.from && day < period.from) return false
  if (period.to && day > period.to) return false
  return true
}

/** Every transition in the period, flattened with its artefact id, log order. */
export function transitionsInPeriod(
  log: StatusLog,
  period: ReportingPeriod,
): { artefactId: string; transition: StatusTransition }[] {
  const out: { artefactId: string; transition: StatusTransition }[] = []
  for (const artefactId of Object.keys(log).sort()) {
    for (const transition of log[artefactId]) {
      if (inPeriod(transition.at, period)) out.push({ artefactId, transition })
    }
  }
  return out
}

/** Every capture in the period, in recording order. */
export function capturesInPeriod(log: KpiLog, period: ReportingPeriod): KpiCapture[] {
  return log.filter((c) => inPeriod(c.capturedAt, period))
}

/* ── shape guards, for usePersistedState ─────────────────────────────────── */

const isTransition = (v: unknown): v is StatusTransition => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  const t = v as Record<string, unknown>
  return (
    typeof t.to === 'string' &&
    (STATUS_STATES as readonly string[]).includes(t.to) &&
    typeof t.at === 'string' &&
    t.at.length > 0 &&
    (t.note === undefined || typeof t.note === 'string')
  )
}

/** A stored value that fails this is ignored, never crashed on. */
export function isStatusLog(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
  return Object.values(parsed as Record<string, unknown>).every(
    (entries) => Array.isArray(entries) && entries.every(isTransition),
  )
}

const isCapture = (v: unknown): v is KpiCapture => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  const c = v as Record<string, unknown>
  return (
    typeof c.kpiId === 'string' &&
    c.kpiId.length > 0 &&
    typeof c.value === 'string' &&
    typeof c.capturedAt === 'string' &&
    c.capturedAt.length > 0 &&
    typeof c.source === 'string'
  )
}

export function isKpiLog(parsed: unknown): boolean {
  return Array.isArray(parsed) && parsed.every(isCapture)
}

export function isReportingPeriod(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
  const p = parsed as Record<string, unknown>
  return typeof p.label === 'string' && typeof p.from === 'string' && typeof p.to === 'string'
}
