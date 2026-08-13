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

export function isAssuranceState(value: unknown): value is AssuranceState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const state = value as Record<string, unknown>
  if (!strings(state.jurisdictions) || !state.jurisdictions.every((code) => code === 'PK' || code === 'US')) return false
  if (new Set(state.jurisdictions).size !== state.jurisdictions.length) return false
  const obligationIds = new Set(ASSURANCE_CATALOGUE.obligations.map((row) => row.id))
  if (!state.exclusions || typeof state.exclusions !== 'object' || Array.isArray(state.exclusions)) return false
  const exclusionsValid = Object.entries(state.exclusions as Record<string, unknown>).every(([id, exclusion]) => {
    if (!obligationIds.has(id) || !exclusion || typeof exclusion !== 'object' || Array.isArray(exclusion)) return false
    const row = exclusion as Record<string, unknown>
    return typeof row.reason === 'string' && row.reason.trim().length > 0
      && typeof row.reviewer === 'string' && typeof row.reviewedOn === 'string'
  })
  if (!exclusionsValid) return false
  if (!state.assessments || typeof state.assessments !== 'object' || Array.isArray(state.assessments)) return false
  const controlIds = new Set(ASSURANCE_CATALOGUE.controls.map((row) => row.id))
  return Object.entries(state.assessments as Record<string, unknown>)
    .every(([id, assessment]) => controlIds.has(id) && isAssessment(assessment))
}

export function useAssuranceState() {
  return usePersistedState<AssuranceState>(ASSURANCE_STATE_BASE, EMPTY_ASSURANCE_STATE, isAssuranceState)
}
