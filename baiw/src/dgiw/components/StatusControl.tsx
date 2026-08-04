/**
 * The per-artefact delivery-status control — ONE component, imported by the
 * Deliverables pack view and the ImplementationPlan register listing.
 *
 * G5 shipped it inline on the 17 generated-artefact cards; G5.1 extracted it
 * so the other 40 hand-produced register rows get the SAME control rather
 * than a second copy (the layout-shell lesson at component scale — the log
 * already handled arbitrary register ids, only the UI was missing, and that
 * gap is recorded beside D-021).
 *
 * Status is the engagement's delivery lifecycle — a DIFFERENT fact from the
 * register's builtFrom disposition, and the sky-family styling exists so the
 * two never read as one. Every press APPENDS to the engagement's transition
 * log; a regression is a new entry beside the old one, never a correction.
 *
 * `compact` renders the same controls without the strip chrome, for table
 * rows; the default keeps the card styling the pack view shipped with.
 */
import { useState } from 'react'
import { STATUS_STATES, currentState, type StatusLog, type StatusState } from '../tracking/log'
import { STATUS_CHIP } from './statusChip'

export function StatusControl({
  artefactId,
  log,
  record,
  compact = false,
}: {
  artefactId: string
  log: StatusLog
  record: (artefactId: string, to: StatusState, note?: string) => void
  compact?: boolean
}) {
  const [to, setTo] = useState<StatusState>('planned')
  const [note, setNote] = useState('')
  const state = currentState(log, artefactId)
  const history = log[artefactId] ?? []

  const controls = (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {!compact && (
        <span className="uppercase tracking-wide font-semibold text-sky-800">Engagement status</span>
      )}
      {state ? (
        <span className={`px-2 py-0.5 rounded ${STATUS_CHIP[state]}`}>{state}</span>
      ) : (
        <span className="text-slate-400">not tracked</span>
      )}
      {!compact && history.length > 0 && (
        <span className="text-slate-400">{history.length} transition{history.length === 1 ? '' : 's'} logged</span>
      )}
      <select
        value={to}
        onChange={(e) => setTo(e.target.value as StatusState)}
        className="border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-700"
        aria-label={`Next status for ${artefactId}`}
      >
        {STATUS_STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="note (optional)"
        className={`border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-700 ${compact ? 'w-28' : 'w-40'}`}
        aria-label={`Transition note for ${artefactId}`}
      />
      <button
        onClick={() => {
          record(artefactId, to, note)
          setNote('')
        }}
        className="px-2 py-1 rounded bg-sky-600 text-white hover:bg-sky-700"
      >
        Record
      </button>
    </div>
  )

  if (compact) return controls
  return (
    <div className="border-t border-sky-100 bg-sky-50/40 -mx-1 px-3 py-2 rounded-md">
      {controls}
      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
        Append-only per engagement: every change is a new log entry, regressions included. The
        register disposition above is a different fact and does not move.
      </p>
    </div>
  )
}
