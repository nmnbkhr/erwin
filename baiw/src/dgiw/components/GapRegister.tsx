/**
 * Gap Register — the screen over `gapRegister()`, and nothing but it.
 *
 * G3: every number here comes from src/dgiw/gap/register.ts through
 * `useGapRegister()`. This page computes NO gap, NO priority and NO exclusion
 * of its own — a screen that disagrees with the gap-statement PDF is the
 * failure `scoring.ts` exists to prevent, one register over.
 *
 * Two kinds of honesty this page owes the consultant:
 *
 *  - "Why is this critical?" must be answerable from the screen: every row
 *    expands to the priority formula with ITS OWN inputs substituted, the
 *    mapped drivers by name, and the framework dimensions that rest on the
 *    pillar.
 *  - Exclusion is visible, never silent: pillars with a missing measurement
 *    are LISTED under the table with the reason, because an absent row and a
 *    row that was never computed look identical from above.
 */
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, NotebookPen } from 'lucide-react'
import { Card, PageHeader, SectionTitle, TableWrap } from './ui'
import { useGapRegister } from '../gap/state'
import { CRITICAL_MIN, GAIN_DECISIVENESS, GAIN_DRIVER, HIGH_MIN, type GapEntry, type PriorityBand } from '../gap/register'
import { TIER_META } from '../tier'
import { useProgramIntake } from '../intake/state'
import { mappedDrivers } from '../intake/types'
import { downloadCsv, type CsvColumn } from '../../report/csv'
import { useDeliverable } from '../report/useDeliverable'
import { useAssessmentTier, useDiagnosticTargets } from '../assessmentState'
import { useDiagnosticAnswers } from '../answers'
import { useOrgName } from '../../engagement/useOrgName'
import { useEngagement } from '../../engagement/context'
import { FileText } from 'lucide-react'
import frameworksData from '../../frameworks/data/frameworks.json'
import type { FrameworksData } from '../types'

const FW = frameworksData as unknown as FrameworksData

/**
 * String literal, the ProgramDesign convention: importing the generator's
 * exported constant would statically pull the jsPDF chain into this chunk.
 * The register row for it is in implementationPlan.json (G3).
 */
const GAP_ARTEFACT_ID = 'AR-55'

const BAND_STYLE: Record<PriorityBand, string> = {
  critical: 'bg-rose-100 text-rose-700 border-rose-200',
  high: 'bg-amber-100 text-amber-700 border-amber-200',
  moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  met: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const show1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)
const show2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2)

export default function GapRegister() {
  const { entries, exclusions, tier, layer } = useGapRegister()
  const [intake] = useProgramIntake()
  const [answersRich] = useDiagnosticAnswers()
  const [targets] = useDiagnosticTargets()
  const [activeTier] = useAssessmentTier()
  const [orgName] = useOrgName()
  const { active } = useEngagement()
  const { busy, message, metaFor, run } = useDeliverable()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [csvNote, setCsvNote] = useState<string | null>(null)

  const generatePdf = () =>
    run('AR-55:pdf', async () => {
      const [{ buildGapStatementsPdf, gapStatementsRefusal, GAP_STATEMENTS_ARTEFACT_ID }, { saveReport }, { reportFilename }] =
        await Promise.all([
          import('../report/gapStatements'),
          import('../../report/spine'),
          import('../../report/naming'),
        ])
      // The single refusal predicate, checked BEFORE building so an expected
      // refusal is a notice, not a stack trace. The generator holds the same
      // predicate and throws — belt and braces cannot disagree, one function.
      const refusal = gapStatementsRefusal(intake, entries)
      if (refusal) return refusal
      const meta = {
        ...metaFor(GAP_STATEMENTS_ARTEFACT_ID, false, 'engagement'),
        assessmentTier: activeTier,
        assessmentCoverage: {
          answered: entries.reduce((s, e) => s + e.coverage.answered, 0),
          applicable: entries.reduce((s, e) => s + e.coverage.applicable, 0),
        },
      }
      saveReport(
        buildGapStatementsPdf({ meta, answers: answersRich, targets, tier: activeTier, intake }),
        reportFilename(meta, 'pdf'),
        meta,
      )
      return null
    })

  const driverText = useMemo(
    () => new Map(mappedDrivers(intake).map((d) => [d.key, d.text])),
    [intake],
  )
  const dimById = useMemo(() => new Map((FW.dimensions ?? []).map((d) => [d.id, d])), [])
  const fwById = useMemo(() => new Map((FW.frameworks ?? []).map((f) => [f.id, f])), [])

  const exportCsv = () => {
    const columns: CsvColumn<GapEntry>[] = [
      { key: 'pillarId', header: 'pillar_id' },
      { key: 'pillarName', header: 'pillar' },
      // The tier is a column, not a footnote: a Quick-tier gap and a Deep-tier
      // gap for the same pillar are different claims (G2's rule, in a cell).
      { key: 'tier', header: 'tier' },
      { key: 'current', header: 'current', format: (e) => show2(e.current) },
      { key: 'target', header: 'target' },
      { key: 'gap', header: 'gap', format: (e) => show2(e.gap) },
      { key: 'coverage', header: 'answered_at_tier', format: (e) => e.coverage.answered },
      { key: 'coverage', header: 'applicable_at_tier', format: (e) => e.coverage.applicable },
      { key: 'priority', header: 'priority_band', format: (e) => e.priority.band },
      { key: 'priority', header: 'priority_score', format: (e) => show2(e.priority.score) },
      { key: 'priority', header: 'gap_size', format: (e) => show2(e.priority.inputs.gapSize) },
      { key: 'priority', header: 'decisiveness', format: (e) => show2(e.priority.inputs.decisiveness) },
      { key: 'priority', header: 'driver_alignment', format: (e) => show2(e.priority.inputs.driverAlignment) },
      { key: 'priority', header: 'aligned_drivers', format: (e) => e.priority.inputs.driverIds.map((k) => driverText.get(k) ?? k).join('; ') },
      { key: 'frameworkRefs', header: 'framework_dimensions', format: (e) => e.frameworkRefs.length },
      { key: 'evidencePresent', header: 'evidence_present', format: (e) => (e.evidencePresent ? 'yes' : 'no') },
    ]
    const meta = {
      orgName: orgName.trim() || 'Unnamed engagement',
      engagementId: active?.id ?? '',
      generatedAt: `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
      layer,
      accent: [225, 29, 72] as const,
      isDraft: false,
      artefactId: GAP_ARTEFACT_ID,
      assessmentTier: tier,
      assessmentCoverage: {
        answered: entries.reduce((s, e) => s + e.coverage.answered, 0),
        applicable: entries.reduce((s, e) => s + e.coverage.applicable, 0),
      },
    }
    const wrote = downloadCsv(
      entries,
      columns,
      `dg-gap-register-${orgName.trim().replace(/\s+/g, '-').toLowerCase() || 'assessment'}`,
      meta,
    )
    // downloadCsv writes nothing on an empty set. Say so — a silent no-op
    // reads as a broken button and sends the user to retry, not to measure.
    setCsvNote(wrote ? null : 'Nothing to export: no pillar has both measurements yet.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gap Register"
        subtitle={`Target against current, at the ${TIER_META[tier].label} tier in the ${
          layer === 'all' ? 'combined core + banking' : layer
        } layer — ${entries.length} pillar${entries.length === 1 ? '' : 's'} with both measurements, ${
          exclusions.length
        } excluded and listed below.`}
        actions={
          <>
            <button
              onClick={() => void generatePdf()}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={14} />
              {busy === 'AR-55:pdf' ? 'Generating…' : 'Gap statements (PDF)'}
            </button>
            <button
              onClick={exportCsv}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            >
              Export register (CSV)
            </button>
          </>
        }
      />
      {message && (
        <Card className={`p-4 border ${message.tone === 'error' ? 'border-rose-200' : 'border-amber-200'}`}>
          <p className={`text-sm ${message.tone === 'error' ? 'text-rose-700' : 'text-amber-700'}`}>{message.text}</p>
        </Card>
      )}
      {csvNote && (
        <Card className="p-4 border border-amber-200">
          <p className="text-sm text-amber-700">{csvNote}</p>
        </Card>
      )}

      <Card className="p-5">
        <SectionTitle hint="A gap needs two measurements: a current score at the active tier and a target set on the Diagnostic results view. Rows expand to show why each priority is what it is.">
          Pillars with both measurements
        </SectionTitle>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">
            No pillar has both measurements yet. Score pillars on the{' '}
            <span className="font-medium">Diagnostic Instrument</span> and set targets on its
            results view — every pillar currently missing one or the other is listed below with
            the reason, not silently dropped.
          </p>
        ) : (
          <TableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3">Pillar</th>
                  <th className="py-2 pr-3 text-center">Current</th>
                  <th className="py-2 pr-3 text-center">Target</th>
                  <th className="py-2 pr-3 text-center">Gap</th>
                  <th className="py-2 pr-3 text-center">Coverage at tier</th>
                  <th className="py-2 pr-3">Priority</th>
                  <th className="py-2 pr-3 text-center">Score</th>
                  <th className="py-2 pr-3 text-center">Evidence</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const open = Boolean(expanded[e.pillarId])
                  const byFramework = new Map<string, string[]>()
                  for (const ref of e.frameworkRefs) {
                    const code = fwById.get(ref.frameworkId)?.code ?? ref.frameworkId
                    const dim = dimById.get(ref.dimensionId)
                    const label = `${dim?.code ?? ref.dimensionId} (${show2(ref.coverageWeight)})`
                    byFramework.set(code, [...(byFramework.get(code) ?? []), label])
                  }
                  return (
                    <FragmentRow
                      key={e.pillarId}
                      entry={e}
                      open={open}
                      toggle={() => setExpanded((p) => ({ ...p, [e.pillarId]: !open }))}
                      driverText={driverText}
                      byFramework={byFramework}
                    />
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      {/* Exclusion honesty: what the register does NOT contain, and why. */}
      <Card className="p-5">
        <SectionTitle hint="A pillar missing either measurement produces no gap entry — never a zero, never a default. Its absence is listed here so exclusion is a stated fact rather than something to notice.">
          Excluded from the register
        </SectionTitle>
        {exclusions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Every pillar has both measurements at this tier. This list is empty because the
            register excluded nothing, not because the check was skipped.
          </p>
        ) : (
          <ul className="space-y-2">
            {exclusions.map((x) => (
              <li key={x.pillarId} className="text-sm text-slate-600">
                <span className="font-medium">{x.pillarId}</span> · {x.pillarName}
                <span className="text-slate-400"> — {x.reasons.join('; ')}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function FragmentRow({
  entry: e,
  open,
  toggle,
  driverText,
  byFramework,
}: {
  entry: GapEntry
  open: boolean
  toggle: () => void
  driverText: Map<string, string>
  byFramework: Map<string, string[]>
}) {
  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={toggle}>
        <td className="py-2 pr-3">
          <span className="font-medium text-slate-700">{e.pillarId}</span>{' '}
          <span className="text-slate-500">{e.pillarShort}</span>
        </td>
        <td className="py-2 pr-3 text-center">{show1(e.current)}</td>
        <td className="py-2 pr-3 text-center">{e.target}</td>
        <td className="py-2 pr-3 text-center font-medium">{show1(e.gap)}</td>
        <td className="py-2 pr-3 text-center text-xs text-slate-500">
          {e.coverage.answered} / {e.coverage.applicable}
        </td>
        <td className="py-2 pr-3">
          <span className={`inline-block px-2 py-0.5 text-xs rounded border ${BAND_STYLE[e.priority.band]}`}>
            {e.priority.band}
          </span>
        </td>
        <td className="py-2 pr-3 text-center">{show2(e.priority.score)}</td>
        <td className="py-2 pr-3 text-center">
          {e.evidencePresent ? (
            <NotebookPen size={14} className="inline text-emerald-600" aria-label="Evidence recorded" />
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className="py-2 pr-3 text-slate-400">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
      </tr>
      {open && (
        <tr className="border-b border-slate-100 bg-slate-50/60">
          <td colSpan={9} className="py-3 px-4 text-xs text-slate-600">
            <p className="mb-1">
              <span className="font-medium">Priority = gapSize × (1 + {GAIN_DECISIVENESS} × decisiveness + {GAIN_DRIVER} × driverAlignment)</span>
              {' '}= {show2(e.priority.inputs.gapSize)} × (1 + {show2(e.priority.inputs.decisiveness)} +{' '}
              {show2(e.priority.inputs.driverAlignment)}) = <span className="font-medium">{show2(e.priority.score)}</span>
              <span className="text-slate-400"> · critical ≥ {CRITICAL_MIN}, high ≥ {HIGH_MIN}, met when gap ≤ 0</span>
            </p>
            <p className="mb-1">
              <span className="font-medium">Decisiveness</span> — {show2(e.priority.inputs.decisiveness)}: share of the
              framework leaf dimensions visible in this layer that rest on this pillar
              ({e.frameworkRefs.length} dimension{e.frameworkRefs.length === 1 ? '' : 's'}:{' '}
              {[...byFramework.entries()].map(([code, dims]) => `${code} ${dims.join(', ')}`).join(' · ') || 'none'}).
              Each weight is the share of that dimension this pillar accounts for.
            </p>
            <p>
              <span className="font-medium">Driver alignment</span> — {show2(e.priority.inputs.driverAlignment)}:{' '}
              {e.priority.inputs.driverIds.length === 0
                ? 'no mapped driver names this pillar. Drivers are mapped on Program Design; unmapped drivers contribute nothing.'
                : `named by ${e.priority.inputs.driverIds
                    .map((k) => `"${driverText.get(k) ?? k}"`)
                    .join(', ')} of the engagement's mapped drivers.`}
            </p>
          </td>
        </tr>
      )}
    </>
  )
}
