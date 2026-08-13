/**
 * Suite-level compliance assurance contract.
 *
 * This gate protects the boundary the UI promises: source-backed instruments
 * and referentially complete obligation/control links may produce VERIFIED
 * only from implementation + evidence + named independent acceptance. No path
 * emits or infers COMPLIANT.
 */
import fs from 'node:fs'
import path from 'node:path'
import { unique } from '../lib/assert.mjs'

const MODULES = ['baiw', 'coe', 'alm', 'taiw', 'haiw']
const SECTORS = ['banking', 'trade', 'health']
const FORCES = ['regulation', 'regulatory-standard', 'standard', 'guidance']

const referential = {
  code: 'ASSURANCE-REFERENTIAL',
  run(ctx) {
    const d = ctx.data.catalogue
    const f = ctx.failAs
    let examined = 0
    examined += unique(f, 'ASSURANCE-REFERENTIAL', 'assurance authority', d.authorities.map((row) => row.id))
    examined += unique(f, 'ASSURANCE-REFERENTIAL', 'assurance instrument', d.instruments.map((row) => row.id))
    examined += unique(f, 'ASSURANCE-REFERENTIAL', 'assurance obligation', d.obligations.map((row) => row.id))
    examined += unique(f, 'ASSURANCE-REFERENTIAL', 'assurance control', d.controls.map((row) => row.id))
    const authorities = new Set(d.authorities.map((row) => row.id))
    const instruments = new Set(d.instruments.map((row) => row.id))
    const controls = new Set(d.controls.map((row) => row.id))
    const reachedControls = new Set()

    for (const instrument of d.instruments) {
      examined++
      if (!authorities.has(instrument.authorityId)) ctx.fail(`${instrument.id} points to missing authority ${instrument.authorityId}`)
      if (!FORCES.includes(instrument.force)) ctx.fail(`${instrument.id} has unsupported legal force ${JSON.stringify(instrument.force)}`)
      if (!/^https:\/\//.test(instrument.sourceUrl)) ctx.fail(`${instrument.id} has no HTTPS official source`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(instrument.sourceVerifiedOn)) ctx.fail(`${instrument.id} has no ISO source verification date`)
      if (!instrument.limitation?.trim()) ctx.fail(`${instrument.id} has no written claim limitation`)
      if (!instrument.sectors?.length || instrument.sectors.some((sector) => !SECTORS.includes(sector)))
        ctx.fail(`${instrument.id} has an empty or unsupported sector scope`)
    }

    for (const obligation of d.obligations) {
      examined++
      if (!instruments.has(obligation.instrumentId)) ctx.fail(`${obligation.id} points to missing instrument ${obligation.instrumentId}`)
      if (!obligation.sourceModules?.length || obligation.sourceModules.some((module) => !MODULES.includes(module)))
        ctx.fail(`${obligation.id} has an empty or unsupported source-module scope`)
      if (!obligation.controlIds?.length) ctx.fail(`${obligation.id} has no controls — an obligation with no enforcement path is decorative`)
      for (const id of obligation.controlIds ?? []) {
        reachedControls.add(id)
        if (!controls.has(id)) ctx.fail(`${obligation.id} points to missing control ${id}`)
      }
    }

    const cdes = new Set(ctx.data.cdes.map((row) => row.id))
    const rules = new Set(ctx.data.rules.map((row) => row.id))
    for (const control of d.controls) {
      examined++
      if (!reachedControls.has(control.id)) ctx.fail(`${control.id} is referenced by no obligation`)
      if (!control.evidenceRequirements?.length) ctx.fail(`${control.id} names no evidence requirement`)
      for (const key of ['cdeRefs', 'dqRuleRefs', 'policyRefs']) {
        if (!Array.isArray(control[key])) ctx.fail(`${control.id}.${key} must be an explicit array, including when unmapped`)
      }
      for (const id of control.cdeRefs ?? []) if (!cdes.has(id)) ctx.fail(`${control.id} points to missing CDE ${id}`)
      for (const id of control.dqRuleRefs ?? []) if (!rules.has(id)) ctx.fail(`${control.id} points to missing DQ rule ${id}`)
      if ((control.policyRefs ?? []).length) ctx.fail(`${control.id} claims policy mappings while DGIW has no authored policy dataset`)
    }
    return { examined, authorities: d.authorities.length, instruments: d.instruments.length, obligations: d.obligations.length, controls: d.controls.length }
  },
}

const claimBoundary = {
  code: 'ASSURANCE-CLAIM',
  run(ctx) {
    const registry = ctx.ts?.assuranceRegistry
    const industry = ctx.ts?.industryRegistry
    if (!registry || !industry) {
      ctx.fail(`assurance registry could not be loaded: ${ctx.tsLoadError ?? 'unknown error'}`)
      return { examined: 0 }
    }
    let examined = 9
    const complete = {
      implementation: 'implemented', owner: 'Owner', evidenceReference: 'EV-1', evidenceSummary: 'Reviewed evidence',
      reviewer: 'Independent reviewer', reviewedOn: '2026-08-13', reviewDecision: 'accepted', notes: '',
    }
    if (registry.assuranceStatus() !== 'not-assessed') ctx.fail('an absent assessment is not reported as not-assessed')
    if (registry.assuranceStatus({ ...complete, evidenceReference: '' }) !== 'evidence-pending') ctx.fail('implemented control with no evidence is not held at evidence-pending')
    if (registry.assuranceStatus({ ...complete, reviewDecision: 'pending' }) !== 'review-pending') ctx.fail('unaccepted evidence is not held at review-pending')
    if (registry.assuranceStatus(complete) !== 'verified') ctx.fail('complete independently accepted evidence does not reach verified')
    if (registry.assuranceStatus({ ...complete, reviewDecision: 'rejected' }) !== 'rejected') ctx.fail('rejected evidence is not reported as rejected')
    const statuses = [undefined, { ...complete, evidenceReference: '' }, { ...complete, reviewDecision: 'pending' }, complete]
      .map((row) => registry.assuranceStatus(row))
    if (statuses.some((status) => /compliant/i.test(status))) ctx.fail('the status engine emits a compliance claim from workflow state')

    const health = industry.INDUSTRY_USE_CASES.find((row) => row.sourceModule === 'haiw')
    const pk = { jurisdictions: ['PK'], exclusions: {}, assessments: {} }
    const us = { jurisdictions: ['US'], exclusions: {}, assessments: {} }
    const pkIds = registry.applicableObligations([health.id], pk).map((row) => row.id)
    const usIds = registry.applicableObligations([health.id], us).map((row) => row.id)
    if (pkIds.some((id) => id.startsWith('OBL-HEALTH-US'))) ctx.fail('HIPAA is applied to a Pakistan-only healthcare scope')
    if (!usIds.some((id) => id.startsWith('OBL-HEALTH-US'))) ctx.fail('HIPAA is absent from an explicitly US healthcare scope')

    const byId = new Map(ctx.data.catalogue.instruments.map((row) => [row.id, row]))
    if (byId.get('INST-DCAM3')?.version !== 'DCAM v3') ctx.fail('the assurance source catalogue does not distinguish current DCAM v3 from the legacy scorecard')
    if (byId.get('INST-WCO-DM')?.version !== '4.3.0') ctx.fail('the assurance source catalogue does not carry current WCO DM 4.3.0')
    return { examined, statuses: statuses.length }
  },
}

const stateContract = {
  code: 'ASSURANCE-STATE',
  run(ctx) {
    const state = ctx.ts?.assuranceState
    if (!state) {
      ctx.fail(`assurance state guard could not be loaded: ${ctx.tsLoadError ?? 'unknown error'}`)
      return { examined: 0 }
    }
    let examined = 5
    if (!state.isAssuranceState(state.EMPTY_ASSURANCE_STATE)) ctx.fail('the assurance state guard rejects its own empty state')
    if (state.isAssuranceState({ ...state.EMPTY_ASSURANCE_STATE, jurisdictions: ['PK', 'PK'] })) ctx.fail('the assurance state guard accepts duplicate jurisdictions')
    if (state.isAssuranceState({ ...state.EMPTY_ASSURANCE_STATE, assessments: { 'CTL-STALE': {} } })) ctx.fail('the assurance state guard accepts a stale control id')
    if (state.isAssuranceState({ ...state.EMPTY_ASSURANCE_STATE, exclusions: { 'OBL-GOV-01': { reason: '', reviewer: '', reviewedOn: '' } } }))
      ctx.fail('the assurance state guard accepts a reasonless applicability exclusion')
    const engagementTypes = fs.readFileSync(path.join(ctx.root, 'src/engagement/types.ts'), 'utf8')
    if (!engagementTypes.includes("'dgiw.assurance'")) ctx.fail('dgiw.assurance is absent from PERSISTED_BASES — evidence would be omitted by duplicate, export/import and delete')
    return { examined }
  },
}

const moduleCoverage = {
  code: 'ASSURANCE-COVERAGE',
  run(ctx) {
    const obligations = ctx.data.catalogue.obligations
    let examined = 0
    for (const module of MODULES) {
      examined++
      if (!obligations.some((row) => row.sourceModules.includes(module))) ctx.fail(`${module} has no assurance obligation path`)
    }
    return { examined, modules: MODULES.length }
  },
}

const outputContract = {
  code: 'ASSURANCE-OUTPUT',
  run(ctx) {
    const report = ctx.ts?.assuranceReport
    if (!report) {
      ctx.fail(`assurance CSV generator could not be loaded: ${ctx.tsLoadError ?? 'unknown error'}`)
      return { examined: 0 }
    }
    let examined = 6
    const meta = {
      orgName: 'Assurance probe', engagementId: 'eng-assurance', generatedAt: '2026-08-13T00:00:00.000Z',
      layer: 'all', accent: [0, 0, 0], isDraft: false, artefactId: 'AR-59',
    }
    const complete = {
      implementation: 'implemented', owner: 'Control owner', evidenceReference: 'EV-001',
      evidenceSummary: 'Approved charter and decision record reviewed for the current period.',
      reviewer: 'Independent reviewer', reviewedOn: '2026-08-13', reviewDecision: 'accepted', notes: '',
    }
    const input = {
      meta,
      selectedUseCaseIds: ['taiw:UC-T01'],
      state: { jurisdictions: ['PK'], exclusions: {}, assessments: { 'CTL-001': complete } },
    }
    const { rows, columns } = report.buildComplianceAssuranceRows(input)
    if (!rows.length) ctx.fail('AR-59 emits no rows for a selected TAIW use case in Pakistan scope')
    if (!columns.some((column) => column.key === 'claimBoundary')) ctx.fail('AR-59 omits the claim-boundary column')
    if (rows.some((row) => /compliant/i.test(row.status))) ctx.fail('AR-59 emits a compliance status')
    if (!rows.some((row) => row.controlId === 'CTL-001' && row.status === 'VERIFIED'))
      ctx.fail('AR-59 does not preserve the real status engine\'s independently accepted VERIFIED result')
    if (rows.some((row) => !row.sourceUrl?.startsWith('https://') || !row.authority || !row.limitation || !row.claimBoundary))
      ctx.fail('AR-59 drops authoritative source, authority, limitation or claim-boundary provenance')
    const excluded = report.buildComplianceAssuranceRows({
      ...input,
      state: { ...input.state, exclusions: { 'OBL-TRADE-01': { reason: 'Out of contracted scope', reviewer: 'Scope owner', reviewedOn: '2026-08-13' } } },
    }).rows
    if (excluded.some((row) => row.obligationId === 'OBL-TRADE-01')) ctx.fail('AR-59 exports an obligation carrying a reasoned applicability exclusion')
    return { examined, rows: rows.length, columns: columns.length }
  },
}

export default {
  id: '_assurance',
  title: 'shared compliance assurance catalogue',
  dataDir: 'src',
  datasets: {
    catalogue: 'dgiw/data/complianceCatalogue.json',
    cdes: 'dgiw/data/cdeRegister.json',
    rules: 'dgiw/data/dqRules.json',
  },
  tsModules: {
    assuranceRegistry: 'src/dgiw/assurance/registry.ts',
    assuranceState: 'src/dgiw/assurance/state.ts',
    assuranceReport: 'src/dgiw/report/complianceAssurance.ts',
    industryRegistry: 'src/industry/registry.ts',
  },
  checks: [referential, claimBoundary, stateContract, moduleCoverage, outputContract],
  summary(ctx) {
    const result = ctx.results['ASSURANCE-REFERENTIAL'] ?? {}
    return [
      `ASSURANCE ${result.instruments ?? 0} instruments from ${result.authorities ?? 0} authorities/bodies` +
        ` — ${result.obligations ?? 0} obligations, ${result.controls ?? 0} shared controls`,
      `  applicability covers ${ctx.results['ASSURANCE-COVERAGE']?.modules ?? 0} workbenches; HIPAA is US-only; DCAM v3 and WCO DM 4.3.0 are explicit`,
      `  statuses stop at VERIFIED evidence — no maturity score or workflow state emits COMPLIANT`,
      `  AR-59 ${ctx.results['ASSURANCE-OUTPUT']?.rows ?? 0} obligation-control probe rows preserve source and review provenance`,
    ]
  },
}
