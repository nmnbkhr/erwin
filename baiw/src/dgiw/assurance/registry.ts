import catalogueJson from '../data/complianceCatalogue.json'
import { SOURCE_MODULES, type SourceModule } from '../../industry/types'
import type {
  AssuranceCatalogue,
  AssuranceControl,
  AssuranceObligation,
  AssuranceState,
  AssuranceStatus,
  ControlAssessment,
} from './types'

export const ASSURANCE_CATALOGUE = catalogueJson as AssuranceCatalogue

export const authorityById = new Map(ASSURANCE_CATALOGUE.authorities.map((row) => [row.id, row]))
export const instrumentById = new Map(ASSURANCE_CATALOGUE.instruments.map((row) => [row.id, row]))
export const obligationById = new Map(ASSURANCE_CATALOGUE.obligations.map((row) => [row.id, row]))
export const controlById = new Map(ASSURANCE_CATALOGUE.controls.map((row) => [row.id, row]))

export function scopedModules(selectedUseCaseIds: readonly string[]): Set<SourceModule> {
  const modules = new Set<SourceModule>()
  for (const id of selectedUseCaseIds) {
    const prefix = id.slice(0, id.indexOf(':'))
    if (SOURCE_MODULES.includes(prefix as SourceModule)) modules.add(prefix as SourceModule)
  }
  return modules
}

export function applicableObligations(
  selectedUseCaseIds: readonly string[],
  state: AssuranceState,
): AssuranceObligation[] {
  const modules = scopedModules(selectedUseCaseIds)
  return ASSURANCE_CATALOGUE.obligations.filter((obligation) => {
    if (state.exclusions[obligation.id]) return false
    if (!obligation.sourceModules.some((module) => modules.has(module))) return false
    const instrument = instrumentById.get(obligation.instrumentId)
    if (!instrument) return false
    return instrument.jurisdictions.includes('GLOBAL') || instrument.jurisdictions.some((code) => state.jurisdictions.includes(code as 'PK' | 'US'))
  })
}

export function applicableControls(obligations: readonly AssuranceObligation[]): AssuranceControl[] {
  const ids = new Set(obligations.flatMap((row) => row.controlIds))
  return ASSURANCE_CATALOGUE.controls.filter((row) => ids.has(row.id))
}

export function assuranceStatus(assessment?: ControlAssessment): AssuranceStatus {
  if (!assessment || assessment.implementation === 'not-started') return 'not-assessed'
  if (assessment.reviewDecision === 'rejected') return 'rejected'
  if (assessment.implementation === 'in-progress') return 'in-progress'
  if (!assessment.evidenceReference.trim() || !assessment.evidenceSummary.trim()) return 'evidence-pending'
  if (assessment.reviewDecision !== 'accepted' || !assessment.reviewer.trim() || !assessment.reviewedOn.trim()) return 'review-pending'
  return 'verified'
}
