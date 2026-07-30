/**
 * DGIW diagnostic answers, filed under the active engagement.
 *
 * These were `useState` inside Diagnostic.tsx, which meant two things. They were
 * lost on every reload — alone among the suite's four assessments, since BAIW,
 * TAIW and HAIW all went through usePersistedState in Phase A. And they were
 * unreachable from anywhere else, so the deliverables page could not generate the
 * diagnostic report at all: it would have produced a document reporting every
 * pillar as "not assessed" while the consultant was looking at a completed
 * assessment on the next screen.
 *
 * One hook, one key, one validator, imported by both call sites — the answers and
 * the report must agree about where the answers live, and two copies of a storage
 * key is how they stop agreeing.
 */
import { usePersistedState } from '../engagement/usePersistedState'

/** Also listed in PERSISTED_BASES, which is what makes it survive export/import. */
export const DIAGNOSTIC_ANSWERS_KEY = 'dgiw-diagnostic-answers'

/**
 * questionId → 1..5.
 *
 * Rejects the whole map if any value is out of range rather than dropping the bad
 * entry: a stored answer of 0 or 7 would flow straight into the weighted mean and
 * produce a maturity score no scale explains.
 */
export function isAnswerMap(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
  return Object.values(parsed as Record<string, unknown>).every(
    (v) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5,
  )
}

export function useDiagnosticAnswers() {
  return usePersistedState<Record<string, number>>(DIAGNOSTIC_ANSWERS_KEY, {}, isAnswerMap)
}
