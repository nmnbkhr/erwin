/**
 * Snapshot persistence — the hook over trajectory/snapshots.ts.
 *
 * The store goes through `usePersistedState` under the active engagement —
 * never raw localStorage — and the base is registered in PERSISTED_BASES, so
 * a snapshot survives engagement export/import/duplicate and dies with an
 * engagement deletion. A time series that silently failed to travel with its
 * engagement bundle would be a defect shipped on day one; registration is
 * what CP1 shows the diff line for.
 *
 * CAPTURE TAKES THE LIVE STATE AS AN ARGUMENT, deliberately. The obvious
 * shape — this hook instantiating its own useDiagnosticAnswers/useTier/
 * useTargets and closing over them — was built first and captured EMPTY
 * state: usePersistedState instances do not sync within a mount (each
 * re-reads only on engagement change), so a second instance of the answers
 * hook still held the mount-time value while the consultant's edits lived in
 * the Diagnostic page's own instance. A snapshot must freeze what the screen
 * shows, so the page passes the exact objects it renders. Found by the CP3
 * click-through, not by reading the code.
 *
 * On tracking/state.ts's contract, the raw setter is NOT returned: the only
 * mutation this hook exposes is `capture`, which appends — a component cannot
 * rewrite or delete history without leaving this module. The timestamp is
 * stamped HERE, at the moment a person acts (snapshots.ts itself is clockless
 * so the gate can run it deterministically).
 */
import { useCallback } from 'react'
import { usePersistedState } from '../../engagement/usePersistedState'
import {
  appendSnapshot,
  captureSnapshot,
  isSnapshotList,
  type AssessmentSnapshot,
  type LiveAssessmentState,
} from './snapshots'

export const SNAPSHOTS_BASE = 'dgiw.snapshots'

/**
 * The snapshot list and the one legal mutation: freeze the live assessment
 * state the CALLER renders, under a label, now. Returns the snapshot so the
 * UI can confirm what was filed; throws (from captureSnapshot) on an empty
 * label.
 */
export function useSnapshots(): [
  AssessmentSnapshot[],
  (live: LiveAssessmentState, label: string) => AssessmentSnapshot,
] {
  const [list, setList] = usePersistedState<AssessmentSnapshot[]>(SNAPSHOTS_BASE, [], isSnapshotList)

  const capture = useCallback(
    (live: LiveAssessmentState, label: string): AssessmentSnapshot => {
      const snapshot = captureSnapshot(live, label, new Date().toISOString())
      setList((prev) => appendSnapshot(prev, snapshot))
      return snapshot
    },
    [setList],
  )

  return [list, capture]
}
