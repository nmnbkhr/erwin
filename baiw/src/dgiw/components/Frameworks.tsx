/**
 * Framework crosswalk scorecard.
 *
 * One assessment read four ways. Everything on this page comes from
 * projection.ts, which reads scoring.ts — no score is computed here, because a
 * scorecard that disagrees with the diagnostic behind it is worse than no
 * scorecard, and this page and the two PDFs must be the same document in two
 * media.
 *
 * The caveats are not footnotes. `frameworkNotes.ts` holds them once and both
 * this page and the generators import them, so the screen and the paper cannot
 * drift into making different claims about the same dataset.
 *
 * retainedShare and scoredShare get their own columns and their own headings
 * throughout. They answer different questions — how much of the framework's own
 * definition is in scope, and how much of that was measured — and a single
 * merged "coverage" figure would hide whichever of the two is worse.
 */
import { useMemo, useState } from 'react'
import { FileText, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Card, PageHeader, SectionTitle, Stat, TableWrap } from './ui'
import { useLayer } from '../layer'
import { useDiagnosticAnswers } from '../answers'
import { useDeliverable } from '../report/useDeliverable'
import { inducedPillarWeights, projectAll, type DimensionDecomposition } from '../projection'
import { findingCodes, leafCount, worstFindings } from '../report/findings'
import { LEVEL_LABEL } from '../scoring'
import {
  FRAMEWORKS,
  ONE_ASSESSMENT,
  SCALE_CAVEAT,
  SHARES_EXPLAINED,
  STRUCTURE_CAVEATS,
  WEIGHTS_ARE_OURS,
} from '../report/frameworkNotes'
import pillarsData from '../data/pillars.json'
import type { Pillar } from '../types'

const PILLARS = [...(pillarsData as Pillar[])].sort((a, b) => (a.id < b.id ? -1 : 1))
const pillarShort = (id: string) => PILLARS.find((p) => p.id === id)?.short ?? id

const pct = (x: number) => `${Math.round(x * 100)}%`
const show1 = (n: number | null) => (n === null ? '—' : (Math.round(n * 10) / 10).toFixed(1))

/** Three states, rendered as words. A bare 0 here would be a wrong number. */
function StateCell({ d }: { d: DimensionDecomposition }) {
  if (d.state === 'not-applicable')
    return <span className="text-xs font-semibold text-slate-500">NOT APPLICABLE</span>
  if (d.state === 'not-assessed')
    return <span className="text-xs font-semibold text-amber-700">NOT ASSESSED</span>
  return <span className="font-semibold text-slate-900">{show1(d.score)}</span>
}

function ConfidencePill({ value }: { value: string }) {
  const tone =
    value === 'high'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : value === 'medium-high'
        ? 'bg-lime-50 text-lime-700 ring-lime-200'
        : 'bg-amber-50 text-amber-700 ring-amber-200'
  return (
    <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 ${tone}`}>
      {value} confidence
    </span>
  )
}

export default function Frameworks() {
  const { filter } = useLayer()
  const [answers] = useDiagnosticAnswers()
  const { busy, message, metaFor, run } = useDeliverable()
  const [open, setOpen] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const projections = useMemo(() => projectAll(answers, filter), [answers, filter])
  const unmappedByFramework = useMemo(() => {
    const out: Record<string, Pillar[]> = {}
    for (const p of projections) {
      const w = inducedPillarWeights(p.frameworkId, filter)
      out[p.frameworkId] = PILLARS.filter((pl) => (w[pl.id] ?? 0) === 0)
    }
    return out
  }, [projections, filter])

  const scored = projections.filter((p) => p.state === 'scored')
  const spread = scored.length
    ? Math.max(...scored.map((p) => p.overall as number)) - Math.min(...scored.map((p) => p.overall as number))
    : 0

  const generateScorecard = () =>
    run('AR-48:pdf', async () => {
      const [{ buildMultiFrameworkScorecardPdf, MULTI_FRAMEWORK_ARTEFACT_ID }, { saveReport }, { reportFilename }] =
        await Promise.all([
          import('../report/multiFrameworkScorecard'),
          import('../../report/spine'),
          import('../../report/naming'),
        ])
      const meta = metaFor(MULTI_FRAMEWORK_ARTEFACT_ID)
      saveReport(buildMultiFrameworkScorecardPdf({ meta, answers }), reportFilename(meta, 'pdf'))
      return null
    })

  const generateAlignment = (frameworkId: string, code: string) =>
    run(`AR-47:${frameworkId}`, async () => {
      const [{ buildFrameworkAlignmentPdf, FRAMEWORK_ALIGNMENT_ARTEFACT_ID }, { saveReport }, { reportFilename }] =
        await Promise.all([
          import('../report/frameworkAlignment'),
          import('../../report/spine'),
          import('../../report/naming'),
        ])
      const meta = metaFor(FRAMEWORK_ALIGNMENT_ARTEFACT_ID)
      const name = reportFilename(meta, 'pdf').replace(/\.pdf$/, `_${code.toLowerCase()}.pdf`)
      saveReport(buildFrameworkAlignmentPdf({ meta, answers, frameworkId }), name)
      return null
    })

  const detail = projections.find((p) => p.frameworkId === open)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Framework Crosswalk"
        subtitle="One assessment, projected onto four published frameworks. Every figure is derived from the same diagnostic answers through the same eleven capability pillars."
        actions={
          <button
            onClick={generateScorecard}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FileText size={15} />
            {busy === 'AR-48:pdf' ? 'Generating…' : 'Multi-framework scorecard (PDF)'}
          </button>
        }
      />

      {/* The framing, above the numbers rather than under them. */}
      <Card className="p-5 border-l-4 border-l-rose-500">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">One assessment, four vocabularies</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{ONE_ASSESSMENT}</p>
            <p className="text-sm text-slate-600 leading-relaxed">{WEIGHTS_ARE_OURS}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{SCALE_CAVEAT}</p>
          </div>
        </div>
      </Card>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat value={projections.length} label="Frameworks" tone="rose" />
        <Stat value={scored.length} label="Scored under this layer" />
        <Stat value={scored.length ? spread.toFixed(2) : '—'} label="Spread across frameworks" />
        <Stat
          value={filter === 'all' ? 'Core + banking' : filter === 'core' ? 'Core only' : 'Banking only'}
          label="Layer scope"
        />
      </div>

      {/* ── Four cards ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {projections.map((p) => {
          const f = FRAMEWORKS.find((x) => x.id === p.frameworkId)
          const leaves = p.dimensions.filter((d) => d.isLeaf)
          const partial = leaves.filter((d) => d.state === 'scored' && d.retainedShare < 1 - 1e-9)
          const w = inducedPillarWeights(p.frameworkId, filter)
          const mapped = PILLARS.filter((pl) => (w[pl.id] ?? 0) > 0).length

          return (
            <Card key={p.frameworkId} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{p.code}</span>
                    {f && <ConfidencePill value={f.structureConfidence} />}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-1">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {f?.publisher} · {f?.versionLabel}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {p.state === 'scored' ? (
                    <>
                      <p className="text-3xl font-bold text-rose-600 leading-none">{show1(p.overall)}</p>
                      <p className="text-[11px] text-slate-400 mt-1">of 5.0 · DGIW scale</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {LEVEL_LABEL[Math.round(p.overall as number)]}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-amber-700 uppercase">
                      {p.state.replace('-', ' ')}
                    </p>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-slate-100 pt-3">
                <div>
                  <dt className="text-slate-400">Pillars mapped</dt>
                  <dd className="text-slate-700">
                    {mapped} of {PILLARS.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Leaf dimensions</dt>
                  <dd className="text-slate-700">{leaves.length}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Retained share</dt>
                  <dd className="text-slate-700">{pct(p.retainedShare)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Scored share</dt>
                  <dd className="text-slate-700">{pct(p.scoredShare)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Partly in scope</dt>
                  <dd className={partial.length ? 'text-amber-700' : 'text-slate-700'}>
                    {partial.length === 0
                      ? 'None — every dimension is fully in scope under this layer'
                      : `${partial.length} dimension${partial.length === 1 ? '' : 's'} scored from less than the framework's full definition`}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setOpen(open === p.frameworkId ? null : p.frameworkId)}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {open === p.frameworkId ? 'Hide dimensions' : 'Show dimensions'}
                </button>
                <button
                  onClick={() => generateAlignment(p.frameworkId, p.code)}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FileText size={15} />
                  {busy === `AR-47:${p.frameworkId}` ? 'Generating…' : 'Alignment pack (PDF)'}
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Weakest findings ──
          Mirrors the scorecard PDF's "Priorities by framework" page exactly,
          through the same worstFindings() call. This is the table a consultant
          presents, so screen and paper agreeing is not optional. */}
      <Card className="p-5">
        <SectionTitle hint="Three FINDINGS, which is not always three dimensions. Two dimensions scoring identically through an identical set of pillars cannot diverge — they are one finding, shown on one row with the reason stated. Dimensions that merely happen to share a number today are kept apart.">
          Weakest findings by framework
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {projections.map((p) => {
            const findings = worstFindings(p, 3)
            const covered = leafCount(findings)
            return (
              <div key={p.frameworkId} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{p.code}</p>
                  <p className="text-[11px] text-slate-400">
                    {covered === findings.length
                      ? `${findings.length} finding${findings.length === 1 ? '' : 's'}`
                      : `${findings.length} findings across ${covered} dimensions`}
                  </p>
                </div>
                {findings.length === 0 ? (
                  <p className="text-xs text-slate-500 mt-2">
                    No dimension of this framework is scored, so no priorities can be drawn.
                  </p>
                ) : (
                  <ol className="mt-2 space-y-1.5">
                    {findings.map((f) => (
                      <li key={f.codes.join('|')} className="text-xs flex gap-2">
                        <span className="font-mono text-slate-500 shrink-0">{findingCodes(f)}</span>
                        <span className="text-slate-700 flex-1">
                          {f.leaves.map((d) => d.name).join(' · ')}
                          {f.cause && (
                            <span className="text-amber-700"> — {f.cause}</span>
                          )}
                        </span>
                        {/* Two decimals HERE and nowhere else on the page. This
                            list's premise is that a repeated number means "one
                            finding, shown once". At one decimal DGI04/05 (2.50)
                            and DGI09 (2.55) both print 2.5, so two genuinely
                            distinct findings look like a collapse that failed —
                            the exact confusion this section exists to remove. */}
                        <span className="font-semibold text-slate-900 shrink-0">{f.score.toFixed(2)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Drill-down ── */}
      {detail && (
        <Card className="p-5">
          <SectionTitle hint={SHARES_EXPLAINED}>
            {detail.code} — leaf dimensions
          </SectionTitle>
          <TableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-medium">Code</th>
                  <th className="py-2 pr-3 font-medium">Dimension</th>
                  <th className="py-2 pr-3 font-medium text-center">Score</th>
                  <th className="py-2 pr-3 font-medium text-center">Retained share</th>
                  <th className="py-2 pr-3 font-medium text-center">Scored share</th>
                  <th className="py-2 pr-3 font-medium">Contributing pillars</th>
                </tr>
              </thead>
              <tbody>
                {detail.dimensions
                  .filter((d) => d.isLeaf)
                  .map((d) => {
                    const isOpen = expanded[d.dimensionId] ?? false
                    return [
                      <tr key={d.dimensionId} className="border-b border-slate-100 align-top">
                        <td className="py-2 pr-3 font-mono text-xs text-slate-500">{d.code}</td>
                        <td className="py-2 pr-3 text-slate-700">{d.name}</td>
                        <td className="py-2 pr-3 text-center">
                          <StateCell d={d} />
                        </td>
                        <td className="py-2 pr-3 text-center">
                          <span className={d.retainedShare < 1 - 1e-9 ? 'text-amber-700 font-medium' : 'text-slate-600'}>
                            {pct(d.retainedShare)}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-center text-slate-600">{pct(d.scoredShare)}</td>
                        <td className="py-2 pr-3">
                          {d.contributions.length === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <button
                              onClick={() =>
                                setExpanded((prev) => ({ ...prev, [d.dimensionId]: !isOpen }))
                              }
                              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
                            >
                              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {d.contributions.length} pillar{d.contributions.length === 1 ? '' : 's'}
                            </button>
                          )}
                        </td>
                      </tr>,
                      isOpen && d.contributions.length > 0 ? (
                        <tr key={`${d.dimensionId}-detail`} className="border-b border-slate-100 bg-slate-50/60">
                          <td />
                          <td colSpan={5} className="py-2 pr-3">
                            <p className="text-xs text-slate-500 mb-1.5">
                              Weights are renormalised over the scored pillars, so they sum to 100% and{' '}
                              {d.code}&rsquo;s score is their weighted mean.
                            </p>
                            <table className="text-xs w-full max-w-2xl">
                              <thead>
                                <tr className="text-left text-slate-400">
                                  <th className="py-1 pr-3 font-medium">Pillar</th>
                                  <th className="py-1 pr-3 font-medium">Capability</th>
                                  <th className="py-1 pr-3 font-medium text-center">Pillar score</th>
                                  <th className="py-1 pr-3 font-medium text-center">Weight</th>
                                  <th className="py-1 pr-3 font-medium text-center">Contribution</th>
                                </tr>
                              </thead>
                              <tbody>
                                {d.contributions.map((c) => (
                                  <tr key={c.pillarId} className="text-slate-600">
                                    <td className="py-1 pr-3 font-mono">{c.pillarId}</td>
                                    <td className="py-1 pr-3">{pillarShort(c.pillarId)}</td>
                                    <td className="py-1 pr-3 text-center">{show1(c.pillarScore)}</td>
                                    <td className="py-1 pr-3 text-center">{pct(c.weight)}</td>
                                    <td className="py-1 pr-3 text-center">{c.contribution.toFixed(3)}</td>
                                  </tr>
                                ))}
                                <tr className="text-slate-900 font-medium border-t border-slate-200">
                                  <td className="py-1 pr-3" colSpan={3}>
                                    {d.code} score
                                  </td>
                                  <td className="py-1 pr-3 text-center">100%</td>
                                  <td className="py-1 pr-3 text-center">{(d.score as number).toFixed(3)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      ) : null,
                    ]
                  })}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      {/* ── Coverage: the differentiation ── */}
      <Card className="p-5">
        <SectionTitle hint="A framework that maps nothing to a capability is not incomplete — it is a statement about that framework's scope, and knowing which one is silent about a capability matters when choosing which to be held to.">
          What each framework does not reach
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {projections.map((p) => {
            const unmapped = unmappedByFramework[p.frameworkId] ?? []
            const leaves = p.dimensions.filter((d) => d.isLeaf)
            const na = leaves.filter((d) => d.state === 'not-applicable')
            const notAssessed = leaves.filter((d) => d.state === 'not-assessed')
            return (
              <div key={p.frameworkId} className="border border-slate-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-slate-800">{p.code}</p>
                <dl className="text-xs mt-1.5 space-y-1">
                  <div>
                    <dt className="text-slate-400">Pillars this framework maps nothing to</dt>
                    <dd className="text-slate-700">
                      {unmapped.length === 0
                        ? 'None — it reaches all eleven capabilities'
                        : unmapped.map((pl) => `${pl.id} ${pl.short}`).join(', ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Dimensions DGIW cannot speak to under this layer</dt>
                    <dd className="text-slate-700">
                      {na.length === 0 ? 'None' : na.map((d) => d.code).join(', ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">In scope but not yet measured</dt>
                    <dd className={notAssessed.length ? 'text-amber-700' : 'text-slate-700'}>
                      {notAssessed.length === 0 ? 'None' : `${notAssessed.length} of ${leaves.length}`}
                    </dd>
                  </div>
                </dl>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle hint="Recorded in frameworks.json and repeated on every generated document. An honestly incomplete framework is recoverable; a confidently wrong one is not.">
          Structural qualifications
        </SectionTitle>
        <ul className="space-y-2">
          {STRUCTURE_CAVEATS.map((c) => (
            <li key={c.slice(0, 24)} className="text-sm text-slate-600 leading-relaxed flex gap-2">
              <span className="text-slate-300">&bull;</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
