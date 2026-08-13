import { usePersistedState } from '../../engagement/usePersistedState'
import { ASSURANCE_CATALOGUE } from './registry'
import type { AssuranceState, ControlAssessment } from './types'

export const ASSURANCE_STATE_BASE = 'dgiw.assurance'

export const EMPTY_ASSURANCE_STATE: AssuranceState = {
  jurisdictions: ['PK'],
  exclusions: {},
  assessments: {},
}

const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')

function isAssessment(value: unknown): value is ControlAssessment {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const row = value as Record<string, unknown>
  return ['not-started', 'in-progress', 'implemented'].includes(String(row.implementation))
    && ['pending', 'accepted', 'rejected'].includes(String(row.reviewDecision))
    && ['owner', 'evidenceReference', 'evidenceSummary', 'reviewer', 'reviewedOn', 'notes'].every((key) => typeof row[key] === 'string')
}

/**
 * SHAPE only — deliberately not id membership.
 *
 * usePersistedState treats a validator failure as "discard and re-write the
 * initial value", so anything this function rejects is DESTROYED on the next
 * render, not merely ignored. When id membership lived in here, a single
 * assessment keyed to a control the catalogue no longer carried invalidated the
 * whole object, and one renamed id in complianceCatalogue.json would have wiped
 * every engagement's evidence, exclusions and jurisdiction alike.
 *
 * So the split is: a malformed record is still rejected outright (nothing can be
 * salvaged from it), while an id that has left the catalogue is handled by
 * pruneAssuranceState below, which drops that entry and keeps its siblings.
 */
export function isAssuranceState(value: unknown): value is AssuranceState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const state = value as Record<string, unknown>
  if (!strings(state.jurisdictions) || !state.jurisdictions.every((code) => code === 'PK' || code === 'US')) return false
  if (new Set(state.jurisdictions).size !== state.jurisdictions.length) return false
  if (!state.exclusions || typeof state.exclusions !== 'object' || Array.isArray(state.exclusions)) return false
  const exclusionsValid = Object.values(state.exclusions as Record<string, unknown>).every((exclusion) => {
    if (!exclusion || typeof exclusion !== 'object' || Array.isArray(exclusion)) return false
    const row = exclusion as Record<string, unknown>
    // reviewer may be empty: exclusions recorded before the reviewer field was
    // required must survive a reload. The form requires one going forward.
    return typeof row.reason === 'string' && row.reason.trim().length > 0
      && typeof row.reviewer === 'string' && typeof row.reviewedOn === 'string'
  })
  if (!exclusionsValid) return false
  if (!state.assessments || typeof state.assessments !== 'object' || Array.isArray(state.assessments)) return false
  return Object.values(state.assessments as Record<string, unknown>).every((assessment) => isAssessment(assessment))
}

/**
 * Drop entries whose obligation or control has left the catalogue, keeping every
 * other record intact. Returns the SAME object when nothing was stale, so the
 * common path allocates nothing and React sees a stable reference.
 */
export function pruneAssuranceState(state: AssuranceState): AssuranceState {
  const obligationIds = new Set(ASSURANCE_CATALOGUE.obligations.map((row) => row.id))
  const controlIds = new Set(ASSURANCE_CATALOGUE.controls.map((row) => row.id))
  const staleExclusions = Object.keys(state.exclusions).filter((id) => !obligationIds.has(id))
  const staleAssessments = Object.keys(state.assessments).filter((id) => !controlIds.has(id))
  if (staleExclusions.length === 0 && staleAssessments.length === 0) return state
  const exclusions = { ...state.exclusions }
  const assessments = { ...state.assessments }
  for (const id of staleExclusions) delete exclusions[id]
  for (const id of staleAssessments) delete assessments[id]
  return { ...state, exclusions, assessments }
}

export function useAssuranceState() {
  const [state, setState] = usePersistedState<AssuranceState>(ASSURANCE_STATE_BASE, EMPTY_ASSURANCE_STATE, isAssuranceState)
  return [pruneAssuranceState(state), setState] as const
}
