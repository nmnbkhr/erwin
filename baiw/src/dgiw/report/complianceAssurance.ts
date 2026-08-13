/**
 * AR-59 — evidence-based industry assurance register.
 *
 * CSV is primary because this is a working register, not a presentation deck.
 * Every row retains the source instrument, limitation, engagement assessment
 * and review decision. The status engine deliberately has no `compliant` value.
 */
import type { ReportMeta } from '../../report/types'
import { byStringKey, type CsvColumn } from '../../report/csv'
import {
  applicableControls,
  applicableObligations,
  assuranceStatus,
  authorityById,
  instrumentById,
} from '../assurance/registry'
import type { AssuranceState } from '../assurance/types'

export const COMPLIANCE_ASSURANCE_ARTEFACT_ID = 'AR-59'

export interface ComplianceAssuranceInput {
  meta: ReportMeta
  selectedUseCaseIds: string[]
  state: AssuranceState
}

export interface ComplianceAssuranceRow {
  controlId: string
  control: string
  status: string
  implementation: string
  owner: string
  evidenceReference: string
  evidenceSummary: string
  reviewer: string
  reviewedOn: string
  reviewDecision: string
  obligationId: string
  obligation: string
  reference: string
  instrument: string
  instrumentVersion: string
  authority: string
  legalForce: string
  jurisdictions: string
  sourceModules: string
  selectedUseCases: string
  sourceUrl: string
  sourceReviewState: string
  limitation: string
  claimBoundary: string
}

const COLUMNS: CsvColumn<ComplianceAssuranceRow>[] = [
  { key: 'controlId', header: 'Control ID' },
  { key: 'control', header: 'Control' },
  { key: 'status', header: 'Assurance status' },
  { key: 'implementation', header: 'Implementation' },
  { key: 'owner', header: 'Control owner' },
  { key: 'evidenceReference', header: 'Evidence reference' },
  { key: 'evidenceSummary', header: 'Evidence summary' },
  { key: 'reviewer', header: 'Independent reviewer' },
  { key: 'reviewedOn', header: 'Reviewed on' },
  { key: 'reviewDecision', header: 'Review decision' },
  { key: 'obligationId', header: 'Obligation ID' },
  { key: 'obligation', header: 'Obligation' },
  { key: 'reference', header: 'Clause or principle reference' },
  { key: 'instrument', header: 'Instrument' },
  { key: 'instrumentVersion', header: 'Version' },
  { key: 'authority', header: 'Authority or standards body' },
  { key: 'legalForce', header: 'Legal force' },
  { key: 'jurisdictions', header: 'Jurisdictions' },
  { key: 'sourceModules', header: 'Applicable workbenches' },
  { key: 'selectedUseCases', header: 'Selected use cases' },
  { key: 'sourceUrl', header: 'Official source' },
  { key: 'sourceReviewState', header: 'Source review state' },
  { key: 'limitation', header: 'Limitation' },
  { key: 'claimBoundary', header: 'Claim boundary' },
]

export function buildComplianceAssuranceRows(input: ComplianceAssuranceInput): {
  rows: ComplianceAssuranceRow[]
  columns: CsvColumn<ComplianceAssuranceRow>[]
} {
  const obligations = applicableObligations(input.selectedUseCaseIds, input.state)
  const controls = applicableControls(obligations)
  const rows: ComplianceAssuranceRow[] = []

  for (const control of controls) {
    const assessment = input.state.assessments[control.id]
    for (const obligation of obligations.filter((row) => row.controlIds.includes(control.id))) {
      const instrument = instrumentById.get(obligation.instrumentId)
      if (!instrument) continue
      const authority = authorityById.get(instrument.authorityId)
      // Registry ids are contractually namespaced `<sourceModule>:<sourceId>`.
      // The export needs only those stable identities, not live source titles;
      // this keeps AR-59's declared dataset boundary to the assurance catalogue.
      const useCases = input.selectedUseCaseIds.filter((id) =>
        obligation.sourceModules.some((module) => id.startsWith(`${module}:`)),
      )
      rows.push({
        controlId: control.id,
        control: control.title,
        status: assuranceStatus(assessment).toUpperCase().replaceAll('-', ' '),
        implementation: assessment?.implementation ?? 'not-started',
        owner: assessment?.owner || control.ownerRole,
        evidenceReference: assessment?.evidenceReference ?? '',
        evidenceSummary: assessment?.evidenceSummary ?? '',
        reviewer: assessment?.reviewer ?? '',
        reviewedOn: assessment?.reviewedOn ?? '',
        reviewDecision: assessment?.reviewDecision ?? 'pending',
        obligationId: obligation.id,
        obligation: obligation.title,
        reference: obligation.reference,
        instrument: instrument.title,
        instrumentVersion: instrument.version,
        authority: authority?.name ?? instrument.authorityId,
        legalForce: instrument.force,
        jurisdictions: instrument.jurisdictions.join('; '),
        sourceModules: obligation.sourceModules.join('; '),
        selectedUseCases: useCases.join('; '),
        sourceUrl: instrument.sourceUrl,
        sourceReviewState: instrument.reviewState,
        limitation: instrument.limitation,
        claimBoundary: 'Evidence register only — not a certification or legal opinion.',
      })
    }
  }

  rows.sort(byStringKey((row) => `${row.controlId}\u0001${row.obligationId}`))
  return { rows, columns: COLUMNS }
}
