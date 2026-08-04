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
import { useCallback, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { usePersistedState } from '../engagement/usePersistedState'
import { isAnswerMap, normaliseAnswers, type AnswerMap, type StoredAnswerMap } from './answerShape'

/** Also listed in PERSISTED_BASES, which is what makes it survive export/import. */
export const DIAGNOSTIC_ANSWERS_KEY = 'dgiw-diagnostic-answers'

/*
 * The shape logic lives in answerShape.ts (pure — the gate's ANSWER-SHAPE
 * check compiles and runs it; report generators import it outside React).
 * Re-exported here so pre-G2 importers keep their one import path.
 */
export { isAnswerMap, normaliseAnswers, answerScores, answerEvidence } from './answerShape'
export type { AnswerMap, DiagnosticAnswer, StoredAnswerMap } from './answerShape'

/**
 * The answers, ALWAYS in the G2 shape — a legacy `{id: 4}` map is upgraded in
 * memory on read (`normaliseAnswers`, lossless by the ANSWER-SHAPE gate), and
 * the first write persists the upgraded map. Until that write the stored
 * legacy bytes are untouched, which is migrate.ts's only-ever-copy contract
 * one level down.
 */
export function useDiagnosticAnswers(): [AnswerMap, Dispatch<SetStateAction<AnswerMap>>] {
  const [stored, setStored] = usePersistedState<StoredAnswerMap>(DIAGNOSTIC_ANSWERS_KEY, {}, isAnswerMap)
  const answers = useMemo(() => normaliseAnswers(stored), [stored])
  const setAnswers = useCallback<Dispatch<SetStateAction<AnswerMap>>>(
    (action) =>
      setStored((prev) => {
        const rich = normaliseAnswers(prev)
        return typeof action === 'function' ? (action as (p: AnswerMap) => AnswerMap)(rich) : action
      }),
    [setStored],
  )
  return [answers, setAnswers]
}
