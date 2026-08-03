/**
 * The framework crosswalk page, once, for any module with a projection.
 *
 * ─── WHY SHARED ────────────────────────────────────────────────────────────
 *
 * `src/dgiw/components/Frameworks.tsx` is the original and it is 470 lines. D5 stage E3
 * needs the same page for TAIW and HAIW, which by this repo's dominant habit would have
 * been two more copies of it differing by an accent colour and a noun — the "seventh
 * copy of the layout shell" CLAUDE.md names as the thing not to do, one level down.
 *
 * So the page takes the SAME `ProjectionReportModule` descriptor the two PDF generators
 * take. That is the property worth having: the screen and the paper read one object, so
 * "the page shows three frameworks and the scorecard shows four" is not a state this
 * code can reach. The caveats come from `../notes` and each module's own
 * `report/frameworkNotes.ts`, imported rather than retyped, for the reason DGIW's file
 * gives — these are exactly the statements that go stale silently, and a client holding
 * a PDF that contradicts the screen they were shown is the failure.
 *
 * DGIW's page is deliberately NOT migrated onto this. It renders findings-collapsing
 * (`worstFindings`), a layer selector and pillar short-names, none of which the other
 * two modules have; migrating it would put DGIW UI changes inside a TAIW/HAIW feature.
 * The duplication is recorded in `notes.ts` rather than left to be discovered.
 *
 * ─── EVERY NUMBER COMES FROM THE ENGINE ────────────────────────────────────
 *
 * Nothing here computes a score. `mod.engine` reads `src/scoring/maturity.ts` through the
 * module's `projection.ts`, which is the same path the assessment screen and the report
 * take. A scorecard that disagreed with the diagnostic behind it is worse than no
 * scorecard.
 *
 * ─── THE DISCLOSURES ARE THE DELIVERABLE ───────────────────────────────────
 *
 * Six statements are on this page in body weight, above the tables rather than under
 * them: one assessment in N vocabularies · the weights are Godaitec's and the structure
 * is published · the module's own findings (TAIW's absent DGI and unreachable DM07,
 * HAIW's nine template stems) · the spine nodes no framework maps and why · the two
 * shares, never merged · scores on the module's own 1-5 scale and not rescaled.
 *
 * A reader who works out for themselves that four "independent" scores are one
 * measurement has already decided the numbers are suspect. Placement is the whole point:
 * a caveat under a table a reader has already quoted has not been read.
 */
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Info } from 'lucide-react'
import type { DimensionDecomposition, FrameworkProjection } from './projection'
import {
  unmappedSpineNodes,
  type ProjectionReportModule,
} from './report/projectionReports'
import {
  RETAINED_IS_STRUCTURAL,
  SHARES_EXPLAINED,
  STRUCTURE_CAVEATS,
  THREE_STATES,
  WEIGHTS_ARE_OURS,
  confidenceLine,
  levelLabelFor,
  oneAssessment,
  scaleCaveat,
} from './notes'

/**
 * Tailwind class strings, not a colour value.
 *
 * Tailwind 4 scans source for literal class names, so an interpolated
 * `text-${colour}-600` produces no CSS at all. Passing the finished strings from each
 * module's wrapper is what keeps them in the scan — and it makes the page's palette
 * something a module declares rather than something this file switches on.
 */
export interface PageAccent {
  /** `text-teal-600` */
  text: string
  /** `bg-teal-600 hover:bg-teal-700` */
  button: string
  /** `border-l-teal-500` */
  borderL: string
  /** `text-teal-600 hover:text-teal-700` */
  link: string
}

export interface FrameworkScorecardPageProps<Answers> {
  mod: ProjectionReportModule<Answers>
  answers: Answers
  accent: PageAccent
  /** How many questions have been answered, for the coverage line. */
  answeredCount: number
  totalQuestions: number
  /** Where the assessment lives, so an empty page can send the reader somewhere. */
  assessmentHref: string
  /** Non-null while a document is generating; the value is the key passed to onGenerate. */
  busy: string | null
  message: { text: string; tone: 'info' | 'error' } | null
  onGenerateScorecard: () => void
  onGenerateAlignment: (frameworkId: string, code: string) => void
}

const pct = (x: number): string => `${Math.round(x * 100)}%`
const show1 = (n: number | null): string => (n === null ? '—' : (Math.round(n * 10) / 10).toFixed(1))

/** Three states as words. A bare 0 here would be a wrong number, not a missing one. */
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

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}>{children}</div>
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-slate-900">{children}</h2>
      {hint && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{hint}</p>}
    </div>
  )
}

export default function FrameworkScorecardPage<Answers>({
  mod,
  answers,
  accent,
  answeredCount,
  totalQuestions,
  assessmentHref,
  busy,
  message,
  onGenerateScorecard,
  onGenerateAlignment,
}: FrameworkScorecardPageProps<Answers>) {
  const [open, setOpen] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const projections: FrameworkProjection[] = useMemo(
    () => mod.engine.projectAll(answers),
    [mod, answers],
  )
  const caveats = useMemo(
    () => mod.moduleCaveats.filter((c) => c !== mod.headlineDisclosure),
    [mod],
  )
  const unmapped = useMemo(() => unmappedSpineNodes(mod), [mod])
  /** Structural, so it does not move when someone answers a question. */
  const unmappedByFramework = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const p of projections) {
      const w = mod.engine.inducedSpineWeights(p.frameworkId)
      out[p.frameworkId] = mod.spine.filter((n) => (w[n.id] ?? 0) === 0).map((n) => n.name)
    }
    return out
  }, [mod, projections])

  const scored = projections.filter((p) => p.state === 'scored')
  const spread = scored.length
    ? Math.max(...scored.map((p) => p.overall as number)) - Math.min(...scored.map((p) => p.overall as number))
    : 0

  const detail = projections.find((p) => p.frameworkId === open)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Framework Crosswalk</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            One {mod.moduleLabel} assessment, projected onto {mod.frameworks.length} published
            frameworks. Every figure is derived from the same answers through the same{' '}
            {mod.spine.length} {mod.spineLabelPlural}.
          </p>
        </div>
        <button
          onClick={onGenerateScorecard}
          disabled={busy !== null}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-white ${accent.button} disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
        >
          <FileText size={15} />
          {busy === 'scorecard' ? 'Generating…' : 'Multi-framework scorecard (PDF)'}
        </button>
      </div>

      {/* ── The framing, above the numbers rather than under them ── */}
      <Card className={`p-5 border-l-4 ${accent.borderL}`}>
        <div className="flex items-start gap-3">
          <Info size={18} className={`${accent.text} shrink-0 mt-0.5`} />
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">
              One assessment, {mod.frameworks.length} vocabularies
            </h2>
            {/* HAIW's instrument disclosure lands HERE — first, in body weight, above
                every 100% figure it qualifies. It is the most impressive number this
                page carries and the one most needing the qualification. */}
            {mod.headlineDisclosure && (
              <p className="text-sm text-slate-800 leading-relaxed font-medium">{mod.headlineDisclosure}</p>
            )}
            <p className="text-sm text-slate-600 leading-relaxed">
              {oneAssessment(mod.frameworks.length, mod.spine.length, mod.spineLabelPlural)}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">{WEIGHTS_ARE_OURS}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{scaleCaveat(mod.moduleLabel)}</p>
          </div>
        </div>
      </Card>

      {/* ── The module's own findings, in full ──
          Minus the headline, which is already rendered above in body weight. The same
          90 words twice on one screen reads as a layout bug and trains a reader to skip
          the block — the opposite of what a disclosure is for. */}
      {caveats.length > 0 && (
        <Card className="p-5">
          <SectionTitle hint="Measured against the assessment, not asserted. Each of these fails a build check the day it stops being true.">
            What {mod.moduleLabel}&rsquo;s assessment can and cannot evidence
          </SectionTitle>
          <ul className="space-y-2.5">
            {caveats.map((c) => (
              <li key={c.slice(0, 32)} className="text-sm text-slate-600 leading-relaxed flex gap-2">
                <span className="text-slate-300">&bull;</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

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

      {/* THE COVERAGE DENOMINATOR. 3.0 from a tenth of the questions is not the same
          claim as 3.0 from all of them, and the number alone cannot tell them apart. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat value={projections.length} label="Frameworks offered" accent={accent} />
        <Stat value={scored.length} label="Scored" />
        <Stat value={scored.length > 1 ? spread.toFixed(2) : '—'} label="Spread across frameworks" />
        <Stat value={`${answeredCount} / ${totalQuestions}`} label="Questions answered" />
      </div>

      {answeredCount === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Nothing has been answered yet, so every dimension below reads NOT ASSESSED rather than 0.
          That is not a score of zero — it means nobody has told us. Start at{' '}
          <a href={assessmentHref} className={`underline ${accent.link}`}>
            the maturity assessment
          </a>
          .
        </div>
      )}

      {/* ── One card per framework ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {projections.map((p) => {
          const f = mod.frameworks.find((x) => x.id === p.frameworkId)
          const leaves = p.dimensions.filter((d) => d.isLeaf)
          const na = leaves.filter((d) => d.state === 'not-applicable')
          const notAssessed = leaves.filter((d) => d.state === 'not-assessed')
          const reached = mod.spine.length - (unmappedByFramework[p.frameworkId]?.length ?? 0)

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
                      <p className={`text-3xl font-bold ${accent.text} leading-none`}>{show1(p.overall)}</p>
                      {/* The module's scale, named on the card. DCAM is 1-6 and COBIT
                          0-5, and nothing here is rescaled to either. */}
                      <p className="text-[11px] text-slate-400 mt-1">of 5.0 · {mod.moduleLabel} scale</p>
                      <p className="text-xs text-slate-600 mt-0.5">{levelLabelFor(p.overall)}</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-amber-700 uppercase">{p.state.replace('-', ' ')}</p>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-slate-100 pt-3">
                <div>
                  <dt className="text-slate-400">{mod.spineLabelPlural} reached</dt>
                  <dd className="text-slate-700">
                    {reached} of {mod.spine.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Leaf dimensions</dt>
                  <dd className="text-slate-700">{leaves.length}</dd>
                </div>
                {/* TWO COLUMNS, NEVER ONE. They answer different questions and a merged
                    "coverage" figure would hide whichever of the two is worse. */}
                <div>
                  <dt className="text-slate-400">Retained share</dt>
                  <dd className={p.retainedShare < 1 - 1e-9 ? 'text-amber-700 font-medium' : 'text-slate-700'}>
                    {pct(p.retainedShare)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Scored share</dt>
                  <dd className="text-slate-700">{pct(p.scoredShare)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Not applicable</dt>
                  <dd className={na.length ? 'text-amber-700' : 'text-slate-700'}>
                    {na.length === 0
                      ? 'None — every leaf dimension is mapped'
                      : `${na.map((d) => d.code).join(', ')} — mapped by nothing this assessment asks about`}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">In scope but not measured</dt>
                  <dd className={notAssessed.length ? 'text-amber-700' : 'text-slate-700'}>
                    {notAssessed.length === 0 ? 'None' : `${notAssessed.length} of ${leaves.length}`}
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
                  onClick={() => onGenerateAlignment(p.frameworkId, p.code)}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FileText size={15} />
                  {busy === `alignment:${p.frameworkId}` ? 'Generating…' : 'Alignment pack (PDF)'}
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Drill-down: the decomposition, which is what makes a score an argument ── */}
      {detail && (
        <Card className="p-5">
          <SectionTitle hint={`${SHARES_EXPLAINED} ${RETAINED_IS_STRUCTURAL}`}>
            {detail.code} — leaf dimensions
          </SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-medium">Code</th>
                  <th className="py-2 pr-3 font-medium">Dimension</th>
                  <th className="py-2 pr-3 font-medium text-center">Score</th>
                  <th className="py-2 pr-3 font-medium text-center">Retained share</th>
                  <th className="py-2 pr-3 font-medium text-center">Scored share</th>
                  <th className="py-2 pr-3 font-medium">Contributing {mod.spineLabelPlural}</th>
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
                        <td className="py-2 pr-3 text-center">
                          <span
                            className={
                              d.scoredShare < d.retainedShare - 1e-9 ? 'text-amber-700 font-medium' : 'text-slate-600'
                            }
                          >
                            {pct(d.scoredShare)}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          {d.contributions.length === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <button
                              onClick={() => setExpanded((prev) => ({ ...prev, [d.dimensionId]: !isOpen }))}
                              className={`inline-flex items-center gap-1 text-xs ${accent.link}`}
                            >
                              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {d.contributions.length} {d.contributions.length === 1 ? mod.spineLabel : mod.spineLabelPlural}
                            </button>
                          )}
                        </td>
                      </tr>,
                      isOpen && d.contributions.length > 0 ? (
                        <tr key={`${d.dimensionId}-detail`} className="border-b border-slate-100 bg-slate-50/60">
                          <td />
                          <td colSpan={5} className="py-2 pr-3">
                            <p className="text-xs text-slate-500 mb-1.5">
                              Weights are renormalised over the SCORED {mod.spineLabelPlural}, so they sum to 100% and{' '}
                              {d.code}&rsquo;s score is their weighted mean. An unanswered{' '}
                              {mod.spineLabel} leaves the numerator and the denominator rather than entering as a zero.
                            </p>
                            <div className="overflow-x-auto">
                              <table className="text-xs w-full max-w-3xl">
                                <thead>
                                  <tr className="text-left text-slate-400">
                                    <th className="py-1 pr-3 font-medium">Id</th>
                                    <th className="py-1 pr-3 font-medium">{mod.spineLabel}</th>
                                    <th className="py-1 pr-3 font-medium text-center">Score</th>
                                    <th className="py-1 pr-3 font-medium text-center">Weight</th>
                                    <th className="py-1 pr-3 font-medium text-center">Contribution</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {d.contributions.map((c) => (
                                    <tr key={c.spineId} className="text-slate-600">
                                      <td className="py-1 pr-3 font-mono">{c.spineId}</td>
                                      <td className="py-1 pr-3">
                                        {mod.spine.find((n) => n.id === c.spineId)?.name ?? c.spineId}
                                      </td>
                                      <td className="py-1 pr-3 text-center">{show1(c.spineScore)}</td>
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
                            </div>
                          </td>
                        </tr>
                      ) : null,
                    ]
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── What no framework reaches: a finding, not a gap ── */}
      <Card className="p-5">
        <SectionTitle
          hint="Computed from the crosswalk on every render, never a written list — a hand-authored one is a second copy of something the dataset already determines."
        >
          {mod.spineLabelPlural} no framework maps
        </SectionTitle>
        {unmapped.length === 0 ? (
          <p className="text-sm text-slate-600 leading-relaxed">
            None — every one of the {mod.spine.length} {mod.spineLabelPlural} is reached by at least one
            framework, so nothing this assessment measures counts toward no scorecard.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600 leading-relaxed">
              {unmapped.length} of {mod.spine.length} {mod.spineLabelPlural} are reached by none of the{' '}
              {mod.frameworks.length} frameworks. They are still scored on the assessment and they still
              appear in the {mod.moduleLabel} maturity report — they simply contribute to no framework
              scorecard.
            </p>
            {mod.unmappedNote && (
              <p className="text-sm text-slate-500 leading-relaxed mt-2">{mod.unmappedNote}</p>
            )}
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {unmapped.map((n) => (
                <li key={n.id} className="text-xs text-slate-600 flex gap-2">
                  <span className="text-slate-300">&bull;</span>
                  <span>{n.name}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* ── Per-framework silence: which one says nothing about what ── */}
      <Card className="p-5">
        <SectionTitle hint="A framework that maps nothing to part of the assessment is not incomplete — that is a statement about its scope, and knowing which one is silent about what matters when choosing which to be held to.">
          What each framework does not reach
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {projections.map((p) => {
            const silent = unmappedByFramework[p.frameworkId] ?? []
            return (
              <div key={p.frameworkId} className="border border-slate-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-slate-800">{p.code}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {mod.spineLabelPlural} this framework maps nothing to
                </p>
                <p className="text-xs text-slate-700 mt-0.5">
                  {silent.length === 0
                    ? `None — it reaches all ${mod.spine.length}`
                    : `${silent.length} of ${mod.spine.length}: ${silent.slice(0, 6).join('; ')}${silent.length > 6 ? `; and ${silent.length - 6} more` : ''}`}
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle hint={THREE_STATES}>Structural qualifications</SectionTitle>
        <ul className="space-y-2">
          {mod.frameworks.map((f) => (
            <li key={f.id} className="text-xs text-slate-500 leading-relaxed">
              {confidenceLine(f)}
            </li>
          ))}
          {STRUCTURE_CAVEATS.map((c) => (
            <li key={c.slice(0, 24)} className="text-sm text-slate-600 leading-relaxed flex gap-2 pt-1">
              <span className="text-slate-300">&bull;</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function Stat({ value, label, accent }: { value: string | number; label: string; accent?: PageAccent }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <p className={`text-2xl font-bold leading-none ${accent ? accent.text : 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1.5">{label}</p>
    </div>
  )
}
