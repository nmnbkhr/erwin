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

/**
 * One person, normalised for comparison. Case and internal whitespace only —
 * nothing cleverer. Fuzzy matching would either wave through "J. Smith" against
 * "John Smith" or reject two genuinely different people with similar names, and
 * a control that silently changes meaning on a spelling is worse than one that
 * asks the reviewer to be explicit.
 */
const person = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Maker-checker: the person accountable for the control (maker) may not be the
 * person who accepts its evidence (checker).
 *
 * Both must be NAMED. Before this, `verified` required a named reviewer but not
 * a named owner, so the register could carry a verified control with nobody
 * accountable for it — and nothing at all stopped one person entering their own
 * name in both fields and accepting their own evidence.
 */
export function segregationOf(assessment: ControlAssessment): 'ok' | 'maker-missing' | 'checker-missing' | 'same-person' {
  const maker = person(assessment.owner)
  const checker = person(assessment.reviewer)
  if (!maker) return 'maker-missing'
  if (!checker) return 'checker-missing'
  return maker === checker ? 'same-person' : 'ok'
}

export function assuranceStatus(assessment?: ControlAssessment): AssuranceStatus {
  if (!assessment || assessment.implementation === 'not-started') return 'not-assessed'
  if (assessment.reviewDecision === 'rejected') return 'rejected'
  if (assessment.implementation === 'in-progress') return 'in-progress'
  if (!assessment.evidenceReference.trim() || !assessment.evidenceSummary.trim()) return 'evidence-pending'
  if (assessment.reviewDecision !== 'accepted' || !assessment.reviewer.trim() || !assessment.reviewedOn.trim()) return 'review-pending'
  // Last, and deliberately after acceptance: the question is only meaningful
  // once somebody HAS accepted. Asking it earlier would report a segregation
  // breach against a control nobody has reviewed yet.
  if (segregationOf(assessment) !== 'ok') return 'segregation-blocked'
  return 'verified'
}
