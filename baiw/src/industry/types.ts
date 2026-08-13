/**
 * Shared industry vocabulary.
 *
 * `sector` answers which industry owns the use case. `sourceModule` answers
 * which workbench authored it. Keeping those axes separate is what lets COE
 * and ALM remain distinct workbenches while correctly belonging to banking.
 */
export const INDUSTRY_SECTORS = ['banking', 'trade', 'health'] as const
export type IndustrySector = (typeof INDUSTRY_SECTORS)[number]

export const SOURCE_MODULES = ['baiw', 'coe', 'alm', 'taiw', 'haiw'] as const
export type SourceModule = (typeof SOURCE_MODULES)[number]

export const INDUSTRY_DOMAINS = [
  'banking-analytics',
  'cash-operations',
  'treasury-alm',
  'trade-analytics',
  'healthcare-analytics',
] as const
export type IndustryDomain = (typeof INDUSTRY_DOMAINS)[number]

export type ModelVocabulary = 'FSDM' | 'WCO-DM' | 'FHIR' | 'HCDM' | 'IMPLEMENTATION'

export interface ModelReference {
  vocabulary: ModelVocabulary
  reference: string
}
export interface GovernanceReferences {
  /** Authored links only. Empty means not mapped, never zero readiness. */
  cdeRefs: string[]
  dqRuleRefs: string[]
  policyRefs: string[]
}

export interface IndustryUseCase {
  /** Namespaced identity. Source ids collide across modules, so they are never used alone. */
  id: string
  sourceId: string
  sourceModule: SourceModule
  sector: IndustrySector
  domain: IndustryDomain
  title: string
  objective: string
  businessValue: string | null
  owner: string | null
  phase: number | null
  capabilityLabels: string[]
  modelRefs: ModelReference[]
  measures: string[]
  inputs: string[]
  outputs: string[]
  kpis: string[]
  dependencies: string[]
  governance: GovernanceReferences
  sourceRoute: string
  sourceDataset: string
}

export interface IndustryDomainDefinition {
  id: IndustryDomain
  sector: IndustrySector
  sourceModule: SourceModule
  label: string
  description: string
  route: string
}
