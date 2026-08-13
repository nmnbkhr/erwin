import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Scale, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEngagement } from '../../engagement/context'
import { useUseCaseSelection } from '../../industry/selectionState'
import {
  ASSURANCE_CATALOGUE,
  applicableControls,
  applicableObligations,
  assuranceStatus,
  authorityById,
  instrumentById,
} from '../assurance/registry'
import { useAssuranceState } from '../assurance/state'
import { EMPTY_CONTROL_ASSESSMENT, JURISDICTIONS, type ControlAssessment, type Jurisdiction } from '../assurance/types'
import { useDeliverable } from '../report/useDeliverable'
import { Card, PageHeader, Stat } from './ui'

const FLOW = [
  ['1', 'Scope', 'Select funded industry use cases'],
  ['2', 'Applicability', 'Confirm jurisdiction and exclusions'],
  ['3', 'Controls', 'Assign accountable implementation'],
  ['4', 'Evidence', 'Cite reviewable artefacts'],
  ['5', 'Review', 'Independent accept or reject'],
  ['6', 'Output', 'Export the assurance register'],
]

const STATUS_STYLE = {
  'not-assessed': 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-blue-50 text-blue-700',
  'evidence-pending': 'bg-amber-50 text-amber-700',
  'review-pending': 'bg-violet-50 text-violet-700',
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
} as const

const label = (value: string) => value.replaceAll('-', ' ')

interface ExclusionDraft {
  reason: string
  reviewer: string
}

export default function ComplianceAssurance() {
  const { active } = useEngagement()
  const [selectedUseCases] = useUseCaseSelection()
  const [state, setState] = useAssuranceState()
  const { busy, message, metaFor, run } = useDeliverable()
  const [expandedControl, setExpandedControl] = useState<string | null>(null)
  const [showSources, setShowSources] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [exclusionDrafts, setExclusionDrafts] = useState<Record<string, ExclusionDraft>>({})
  const [exclusionError, setExclusionError] = useState<string | null>(null)
  const hasScope = selectedUseCases.length > 0

  // Candidate obligations ignore reasoned exclusions; applicable obligations do
  // not. Keeping both counts visible stops "excluded" from reading as "absent".
  const candidates = useMemo(
    () => applicableObligations(selectedUseCases, { ...state, exclusions: {} }),
    [selectedUseCases, state],
  )
  const obligations = useMemo(() => applicableObligations(selectedUseCases, state), [selectedUseCases, state])
  const controls = useMemo(() => applicableControls(obligations), [obligations])
  const statuses = useMemo(
    () => new Map(controls.map((control) => [control.id, assuranceStatus(state.assessments[control.id])])),
    [controls, state.assessments],
  )
  const visibleControls = controls.filter((control) => statusFilter === 'all' || statuses.get(control.id) === statusFilter)
  const verified = controls.filter((control) => statuses.get(control.id) === 'verified').length
  const gaps = controls.filter((control) => statuses.get(control.id) !== 'verified').length
  const applicableInstrumentIds = new Set(candidates.map((row) => row.instrumentId))
  const instruments = hasScope
    ? ASSURANCE_CATALOGUE.instruments.filter((row) => applicableInstrumentIds.has(row.id))
    : ASSURANCE_CATALOGUE.instruments

  const updateAssessment = (id: string, patch: Partial<ControlAssessment>) => {
    if (!active) return
    setState((current) => ({
      ...current,
      assessments: {
        ...current.assessments,
        [id]: { ...EMPTY_CONTROL_ASSESSMENT, ...current.assessments[id], ...patch },
      },
    }))
  }

  const toggleJurisdiction = (jurisdiction: Jurisdiction) => {
    if (!active) return
    setState((current) => ({
      ...current,
      jurisdictions: current.jurisdictions.includes(jurisdiction)
        ? current.jurisdictions.filter((item) => item !== jurisdiction)
        : [...current.jurisdictions, jurisdiction],
    }))
  }

  const exportRegister = () => run('assurance-csv', async () => {
    const [{ buildComplianceAssuranceRows, COMPLIANCE_ASSURANCE_ARTEFACT_ID }, { downloadCsv }, { reportFilename }] =
      await Promise.all([
        import('../report/complianceAssurance'),
        import('../../report/csv'),
        import('../../report/naming'),
      ])
    const meta = metaFor(COMPLIANCE_ASSURANCE_ARTEFACT_ID)
    const { rows, columns } = buildComplianceAssuranceRows({ meta, selectedUseCaseIds: selectedUseCases, state })
    const wrote = downloadCsv(rows, columns, reportFilename(meta, 'csv'), meta)
    return wrote ? null : 'No applicable obligation-control rows exist. Select use cases and confirm jurisdiction before exporting.'
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Assurance"
        subtitle="Trace industry use cases to applicable instruments, controls, evidence and independent review. This workbench reports verified controls and gaps; it never converts framework alignment into a legal compliance claim."
        actions={(
          <button
            disabled={!active || selectedUseCases.length === 0 || busy !== null}
            onClick={() => void exportRegister()}
            className="px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy === 'assurance-csv' ? 'Preparing…' : 'Export assurance CSV'}
          </button>
        )}
      />

      <Card className="p-4 border-l-4 border-l-amber-400">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Assurance boundary</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{ASSURANCE_CATALOGUE.claimBoundary}</p>
            {!active && <p className="text-sm text-rose-700 mt-2">Choose an engagement before recording jurisdiction, evidence or review decisions.</p>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat value={selectedUseCases.length} label="Use cases in engagement scope" tone="rose" />
        <Stat value={candidates.length} label="Candidate obligations" />
        <Stat value={controls.length} label="Applicable controls" />
        <Stat value={verified} label="Verified controls" tone="green" />
        <Stat value={gaps} label="Controls not verified" tone={gaps ? 'amber' : 'green'} />
      </div>

      {!hasScope && (
        <Card className="overflow-hidden border-rose-200 bg-gradient-to-br from-rose-50 via-white to-slate-50">
          <div className="p-5 lg:p-6 grid lg:grid-cols-[1.4fr_1fr] gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-rose-600">Start here</p>
              <h2 className="text-xl font-semibold text-slate-900 mt-2">Build an assurance scope from business use cases</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {active
                  ? `${active.orgName || 'This engagement'} has no selected use cases yet. Select the funded business outcomes that belong in this engagement; DGIW will then derive candidate obligations, applicable controls and evidence requirements.`
                  : 'Choose or create an engagement from the top bar, then select its funded business outcomes. DGIW will derive candidate obligations, applicable controls and evidence requirements without treating the reference catalogue as legal advice.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link to="/dg/use-cases" className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                  Select industry use cases
                </Link>
                <span className="text-xs text-slate-500">Banking · Trade · Healthcare</span>
              </div>
            </div>
            <div className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Reference catalogue available now</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><p className="text-2xl font-semibold text-slate-900">{ASSURANCE_CATALOGUE.instruments.length}</p><p className="text-xs text-slate-500">source instruments</p></div>
                <div><p className="text-2xl font-semibold text-slate-900">{ASSURANCE_CATALOGUE.authorities.length}</p><p className="text-xs text-slate-500">standards and regulatory bodies</p></div>
                <div><p className="text-2xl font-semibold text-slate-900">{ASSURANCE_CATALOGUE.obligations.length}</p><p className="text-xs text-slate-500">obligation patterns</p></div>
                <div><p className="text-2xl font-semibold text-slate-900">{ASSURANCE_CATALOGUE.controls.length}</p><p className="text-xs text-slate-500">shared controls</p></div>
              </div>
              <p className="text-xs text-slate-500 mt-4">Browse the source catalogue and control library below. Assessment records unlock only after engagement scope is selected.</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Assurance flow</p>
        <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-2">
          {FLOW.map(([step, title, detail]) => (
            <div key={step} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
              <span className="inline-flex w-6 h-6 rounded-full bg-slate-900 text-white items-center justify-center text-xs font-semibold">{step}</span>
              <p className="text-sm font-semibold text-slate-800 mt-2">{title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-800">Jurisdiction and applicability</h2>
            <p className="text-sm text-slate-500 mt-1">Global standards are always shown for selected modules. Jurisdiction-specific regulation appears only when its jurisdiction is selected.</p>
          </div>
          <div className="flex gap-2">
            {JURISDICTIONS.map((jurisdiction) => (
              <button
                key={jurisdiction}
                disabled={!active}
                aria-pressed={state.jurisdictions.includes(jurisdiction)}
                onClick={() => toggleJurisdiction(jurisdiction)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 ${state.jurisdictions.includes(jurisdiction) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                {jurisdiction === 'PK' ? 'Pakistan' : 'United States'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {candidates.map((obligation) => {
            const instrument = instrumentById.get(obligation.instrumentId)
            const excluded = state.exclusions[obligation.id]
            const draft = exclusionDrafts[obligation.id] ?? { reason: '', reviewer: '' }
            return (
              <details key={obligation.id} className={`rounded-lg border p-3 ${excluded ? 'border-slate-200 bg-slate-50' : 'border-emerald-200 bg-emerald-50/40'}`}>
                <summary className="cursor-pointer list-none flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-slate-400">{obligation.id}</span>
                  <span className="font-medium text-slate-800">{obligation.title}</span>
                  <span className={`ml-auto text-[10px] uppercase font-semibold px-2 py-1 rounded ${excluded ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>{excluded ? 'excluded with rationale' : 'applicable'}</span>
                </summary>
                <div className="mt-3 border-t border-slate-200 pt-3 space-y-3">
                  <p className="text-sm text-slate-600">{obligation.requirement}</p>
                  <p className="text-xs text-slate-500">{instrument?.title} · {obligation.reference}</p>
                  {excluded ? (
                    <div className="rounded bg-white border border-slate-200 p-3 text-sm text-slate-600">
                      <p><span className="font-medium">Reason:</span> {excluded.reason}</p>
                      <p className="text-xs mt-1">Reviewed by {excluded.reviewer || 'not named'} {excluded.reviewedOn ? `on ${excluded.reviewedOn}` : '— review date pending'}</p>
                      <button
                        disabled={!active}
                        onClick={() => setState((current) => {
                          const exclusions = { ...current.exclusions }
                          delete exclusions[obligation.id]
                          return { ...current, exclusions }
                        })}
                        className="mt-2 text-xs font-medium text-rose-600 disabled:opacity-40"
                      >Return to applicable scope</button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-2">
                      <input
                        value={draft.reason}
                        onChange={(event) => {
                          setExclusionError(null)
                          setExclusionDrafts((current) => ({
                            ...current,
                            [obligation.id]: { ...draft, reason: event.target.value },
                          }))
                        }}
                        placeholder="Reason not applicable"
                        aria-label={`${obligation.id} exclusion reason`}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                      />
                      <input
                        value={draft.reviewer}
                        onChange={(event) => setExclusionDrafts((current) => ({
                          ...current,
                          [obligation.id]: { ...draft, reviewer: event.target.value },
                        }))}
                        placeholder="Applicability reviewer"
                        aria-label={`${obligation.id} applicability reviewer`}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
                      />
                      <button
                        disabled={!active}
                        onClick={() => {
                          const reason = draft.reason.trim()
                          const reviewer = draft.reviewer.trim()
                          if (!reason) {
                            setExclusionError(obligation.id)
                            return
                          }
                          setState((current) => ({
                            ...current,
                            exclusions: { ...current.exclusions, [obligation.id]: { reason, reviewer, reviewedOn: new Date().toISOString().slice(0, 10) } },
                          }))
                          setExclusionDrafts((current) => {
                            const next = { ...current }
                            delete next[obligation.id]
                            return next
                          })
                          setExclusionError(null)
                        }}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                      >Record reasoned exclusion</button>
                      {exclusionError === obligation.id && (
                        <p role="alert" className="md:col-span-3 text-xs text-rose-700">
                          State why the obligation is not applicable before excluding it.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </details>
            )
          })}
          {!hasScope && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">No applicability decisions yet</p>
              <p className="text-sm text-slate-500 mt-1">Select use cases on Industry Use Cases first. Applicability is derived from funded scope, jurisdiction and reasoned exclusions—not from sector labels alone.</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-800">{hasScope ? 'Control assurance' : 'Reference control library'}</h2>
            <p className="text-sm text-slate-500 mt-1">{hasScope
              ? 'A control becomes verified only after implementation, evidence citation, a named reviewer, review date and acceptance.'
              : 'These reusable controls are catalogue references, not assessed or applicable records. Select use cases to establish traceable applicability.'}</p>
          </div>
          {hasScope && (
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white">
              <option value="all">All statuses</option>
              {Object.keys(STATUS_STYLE).map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </select>
          )}
        </div>
      </Card>

      {!hasScope && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ASSURANCE_CATALOGUE.controls.map((control) => (
            <Card key={control.id} className="p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-slate-400">{control.id}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{control.title}</p>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{control.objective}</p>
                  <p className="text-xs text-slate-500 mt-3">Default owner · {control.ownerRole}</p>
                  <p className="text-xs text-slate-500 mt-1">{control.evidenceRequirements.length} expected evidence item{control.evidenceRequirements.length === 1 ? '' : 's'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {visibleControls.map((control) => {
          const assessment = state.assessments[control.id] ?? EMPTY_CONTROL_ASSESSMENT
          const status = statuses.get(control.id) ?? 'not-assessed'
          const linkedObligations = obligations.filter((row) => row.controlIds.includes(control.id))
          const expanded = expandedControl === control.id
          return (
            <Card key={control.id} className={status === 'verified' ? 'ring-1 ring-emerald-300' : ''}>
              <button onClick={() => setExpandedControl(expanded ? null : control.id)} className="w-full p-4 text-left flex items-center gap-3 hover:bg-slate-50">
                <ShieldCheck size={18} className={status === 'verified' ? 'text-emerald-600' : 'text-slate-400'} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-400">{control.id}</p>
                  <p className="text-sm font-semibold text-slate-800">{control.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{linkedObligations.length} applicable obligation{linkedObligations.length === 1 ? '' : 's'} · default owner {control.ownerRole}</p>
                </div>
                <span className={`text-[10px] uppercase font-semibold px-2 py-1 rounded ${STATUS_STYLE[status]}`}>{label(status)}</span>
                {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>

              {expanded && (
                <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50/50">
                  <p className="text-sm text-slate-600">{control.objective}</p>
                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white border border-slate-200 p-3">
                      <p className="text-xs uppercase font-semibold tracking-wide text-slate-500 mb-2">Applicable obligations</p>
                      <ul className="space-y-2">
                        {linkedObligations.map((obligation) => {
                          const instrument = instrumentById.get(obligation.instrumentId)
                          return <li key={obligation.id} className="text-sm text-slate-600"><span className="font-medium text-slate-800">{obligation.id}</span> · {instrument?.title} · {obligation.reference}</li>
                        })}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 p-3">
                      <p className="text-xs uppercase font-semibold tracking-wide text-slate-500 mb-2">Evidence expected</p>
                      <ul className="space-y-1.5">{control.evidenceRequirements.map((item) => <li key={item} className="text-sm text-slate-600">• {item}</li>)}</ul>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    <label className="text-xs text-slate-500">Implementation
                      <select disabled={!active} value={assessment.implementation} onChange={(event) => updateAssessment(control.id, { implementation: event.target.value as ControlAssessment['implementation'] })} className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white disabled:opacity-40">
                        <option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="implemented">Implemented</option>
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">Control owner
                      <input disabled={!active} value={assessment.owner} onChange={(event) => updateAssessment(control.id, { owner: event.target.value })} placeholder={control.ownerRole} className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40" />
                    </label>
                    <label className="text-xs text-slate-500">Evidence reference
                      <input disabled={!active} value={assessment.evidenceReference} onChange={(event) => updateAssessment(control.id, { evidenceReference: event.target.value })} placeholder="Document ID, URL or repository path" className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40" />
                    </label>
                    <label className="text-xs text-slate-500 md:col-span-2 xl:col-span-3">Evidence summary
                      <textarea disabled={!active} value={assessment.evidenceSummary} onChange={(event) => updateAssessment(control.id, { evidenceSummary: event.target.value })} placeholder="What was reviewed, its period and what it demonstrates" rows={2} className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40" />
                    </label>
                    <label className="text-xs text-slate-500">Independent reviewer
                      <input disabled={!active} value={assessment.reviewer} onChange={(event) => updateAssessment(control.id, { reviewer: event.target.value })} className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40" />
                    </label>
                    <label className="text-xs text-slate-500">Reviewed on
                      <input type="date" disabled={!active} value={assessment.reviewedOn} onChange={(event) => updateAssessment(control.id, { reviewedOn: event.target.value })} className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 disabled:opacity-40" />
                    </label>
                    <label className="text-xs text-slate-500">Review decision
                      <select disabled={!active} value={assessment.reviewDecision} onChange={(event) => updateAssessment(control.id, { reviewDecision: event.target.value as ControlAssessment['reviewDecision'] })} className="mt-1 block w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white disabled:opacity-40">
                        <option value="pending">Pending</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option>
                      </select>
                    </label>
                  </div>
                  {status === 'verified' && <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={16} /> Evidence accepted by {assessment.reviewer} on {assessment.reviewedOn}. This verifies the control record; it is not an organisation-wide certification.</p>}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <button onClick={() => setShowSources(!showSources)} className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50">
          <Scale size={18} className="text-slate-400" />
          <span className="flex-1 text-sm font-semibold text-slate-800">{hasScope ? 'Applicable standards and regulatory bodies' : 'Standards and regulatory source catalogue'} ({instruments.length})</span>
          {showSources ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>
        {showSources && <div className="border-t border-slate-200 divide-y divide-slate-100">{instruments.map((instrument) => {
          const authority = authorityById.get(instrument.authorityId)
          return <div key={instrument.id} className="p-4 grid lg:grid-cols-[1fr_auto] gap-3">
            <div><p className="text-sm font-semibold text-slate-800">{instrument.title}</p><p className="text-xs text-slate-500 mt-1">{authority?.name} · {instrument.jurisdictions.join(', ')} · {instrument.version} · {instrument.force} · source checked {instrument.sourceVerifiedOn}</p><p className="text-sm text-slate-600 mt-2">{instrument.limitation}</p></div>
            <a href={instrument.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-rose-600">Official source <ExternalLink size={14} /></a>
          </div>
        })}</div>}
      </Card>

      {message && <Card className={`p-3 text-sm ${message.tone === 'error' ? 'text-rose-700 border-rose-200' : 'text-slate-600'}`}>{message.text}</Card>}
    </div>
  )
}
