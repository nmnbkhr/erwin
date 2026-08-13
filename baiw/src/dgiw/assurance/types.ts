import type { IndustrySector, SourceModule } from '../../industry/types'

export const JURISDICTIONS = ['PK', 'US'] as const
export type Jurisdiction = (typeof JURISDICTIONS)[number]
export type CatalogueJurisdiction = Jurisdiction | 'GLOBAL'
export type InstrumentForce = 'regulation' | 'regulatory-standard' | 'standard' | 'guidance'
export type ReviewState = 'source-verified' | 'review-required'

export interface AssuranceAuthority {
  id: string
  name: string
  acronym: string
  jurisdiction: CatalogueJurisdiction
  authorityType: 'regulator' | 'standard-setter' | 'professional-body'
  url: string
}

export interface AssuranceInstrument {
  id: string
  authorityId: string
  title: string
  version: string
  force: InstrumentForce
  jurisdictions: CatalogueJurisdiction[]
  sectors: IndustrySector[]
  sourceUrl: string
  sourceVerifiedOn: string
  reviewState: ReviewState
  limitation: string
}

export interface AssuranceObligation {
  id: string
  instrumentId: string
  reference: string
  title: string
  requirement: string
  sourceModules: SourceModule[]
  controlIds: string[]
}

export interface AssuranceControl {
  id: string
  title: string
  objective: string
  ownerRole: string
  evidenceRequirements: string[]
  cdeRefs: string[]
  dqRuleRefs: string[]
  policyRefs: string[]
}

export interface AssuranceCatalogue {
  catalogueVersion: string
  claimBoundary: string
  authorities: AssuranceAuthority[]
  instruments: AssuranceInstrument[]
  obligations: AssuranceObligation[]
  controls: AssuranceControl[]
}

export type ImplementationState = 'not-started' | 'in-progress' | 'implemented'
export type ReviewDecision = 'pending' | 'accepted' | 'rejected'

export interface ControlAssessment {
  implementation: ImplementationState
  owner: string
  evidenceReference: string
  evidenceSummary: string
  reviewer: string
  reviewedOn: string
  reviewDecision: ReviewDecision
  notes: string
}

export interface ApplicabilityExclusion {
  reason: string
  reviewer: string
  reviewedOn: string
}

export interface AssuranceState {
  jurisdictions: Jurisdiction[]
  /** A scoped obligation can be excluded only with a reviewable reason. */
  exclusions: Record<string, ApplicabilityExclusion>
  assessments: Record<string, ControlAssessment>
}

export type AssuranceStatus =
  | 'not-assessed'
  | 'in-progress'
  | 'evidence-pending'
  | 'review-pending'
  | 'verified'
  | 'rejected'

export const EMPTY_CONTROL_ASSESSMENT: ControlAssessment = {
  implementation: 'not-started',
  owner: '',
  evidenceReference: '',
  evidenceSummary: '',
  reviewer: '',
  reviewedOn: '',
  reviewDecision: 'pending',
  notes: '',
}
