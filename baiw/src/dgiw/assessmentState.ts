/**
 * G2 assessment state — the active tier and the per-pillar targets, persisted
 * per engagement through `usePersistedState`. No raw localStorage.
 *
 * Both live here rather than in the component so the Deliverables page and the
 * Diagnostic page read the SAME tier and the SAME targets — a PDF generated
 * from the pack view must be the assessment the consultant was just looking
 * at, which is the whole engagement-state argument replayed.
 */
import type { Dispatch, SetStateAction } from 'react'
import { usePersistedState } from '../engagement/usePersistedState'
import { DEFAULT_UI_TIER, isTier, type AssessmentTier } from './tier'

export const ASSESSMENT_TIER_KEY = 'dgiw.tier'
export const DIAGNOSTIC_TARGETS_KEY = 'dgiw.targets'

/**
 * pillarId → target maturity 1..5. Integer only — a target of 3.5 would be
 * manufactured precision on the axis G3's gap function derives from.
 * Pillar-id validity is the TARGET-RANGE gate's concern (against pillars.json,
 * on the stored fixture); at runtime a stale key is simply never rendered,
 * because every consumer iterates pillars, not this map.
 */
export type TargetMap = Record<string, 1 | 2 | 3 | 4 | 5>

export function isTargetMap(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
  return Object.values(parsed as Record<string, unknown>).every(
    (v) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5,
  )
}

export function useDiagnosticTargets(): [TargetMap, Dispatch<SetStateAction<TargetMap>>] {
  return usePersistedState<TargetMap>(DIAGNOSTIC_TARGETS_KEY, {}, isTargetMap)
}

export function useAssessmentTier(): [AssessmentTier, Dispatch<SetStateAction<AssessmentTier>>] {
  return usePersistedState<AssessmentTier>(ASSESSMENT_TIER_KEY, DEFAULT_UI_TIER, isTier)
}
