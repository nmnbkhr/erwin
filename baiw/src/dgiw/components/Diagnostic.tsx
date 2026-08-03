import { useState, useMemo, useCallback } from 'react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts'
import { ChevronDown, ChevronUp, FileText, RotateCcw } from 'lucide-react'
import { Card, PageHeader, SectionTitle, Stat, ExportButton, TableWrap } from './ui'
import { LayerBadge } from '../LayerContext'
import { useLayer } from '../layer'
import { downloadCSV, downloadJSON } from '../../utils/export'
import diagnostic from '../data/diagnostic.json'
import pillars from '../data/pillars.json'
import implementationPlan from '../data/implementationPlan.json'
import type { DiagnosticData, Pillar, ImplementationPlanData } from '../types'
import { useOrgName } from '../../engagement/useOrgName'
import { useEngagement } from '../../engagement/context'
import { useDiagnosticAnswers } from '../answers'
// Every number on this page comes from scoring.ts, so the PDF cannot disagree
// with the screen. See the three-state model documented there.
import {
  LEVEL_LABEL,
  RANK_MIN_CONFIDENCE,
  applicableQuestions,
  overallScore,
  rankPillars,
  scorePillars,
  type PillarOutcome,
} from '../scoring'

const DIAG = diagnostic as DiagnosticData
const PILLARS = pillars as Pillar[]
const PLAN = implementationPlan as ImplementationPlanData

const WEIGHT_LABEL: Record<number, string> = {
  1: 'Contextual', 2: 'Important', 3: 'Decisive',
}

/** Heatmap cell colour by score. Unanswered pillars stay neutral rather than reading as zero. */
function heatColour(score: number | null): string {
  if (score === null) return 'bg-slate-100 text-slate-400'
  if (score < 1.75) return 'bg-rose-600 text-white'
  if (score < 2.5) return 'bg-rose-400 text-white'
  if (score < 3.25) return 'bg-amber-400 text-slate-900'
  if (score < 4.0) return 'bg-lime-400 text-slate-900'
  return 'bg-emerald-500 text-white'
}

/** One decimal for display. Scores are held unrounded so the overall doesn't inherit rounding drift. */
const show1 = (n: number | null) => (n === null ? '—' : (Math.round(n * 10) / 10).toFixed(1))

export default function Diagnostic() {
  const { filter, shows } = useLayer()
  // Persisted per engagement, not component state: they survive a reload and the
  // deliverables page reads the same answers this page is collecting.
  const [answers, setAnswers] = useDiagnosticAnswers()
  // The client's name lives on the active engagement, not in this component.
  const [orgName, setOrgName] = useOrgName()
  const [showResults, setShowResults] = useState(false)
  const [expandedQ, setExpandedQ] = useState<Record<string, boolean>>({})
  const [openPillar, setOpenPillar] = useState<string | null>(PILLARS[0]?.id ?? null)
  const [generating, setGenerating] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const { active } = useEngagement()

  const questions = useMemo(() => applicableQuestions(DIAG.questions, filter), [filter])

  const answeredCount = questions.filter((q) => answers[q.id]).length
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0

  /** All eleven pillars, each tagged scored / not-assessed / not-applicable. */
  const allOutcomes = useMemo<PillarOutcome[]>(
    () => scorePillars(PILLARS, questions, answers),
    [questions, answers]
  )

  /**
   * What this page renders: pillars that exist under the current layer. The
   * not-applicable ones are excluded here — as they always were — but they are no
   * longer invisible, because the generated report lists them explicitly with the
   * reason. See scoring.ts.
   */
  const pillarScores = useMemo(
    () => allOutcomes.filter((p) => p.state !== 'not-applicable'),
    [allOutcomes]
  )

  const overall = useMemo<number | null>(() => overallScore(questions, answers), [questions, answers])

  /** Unanswered pillars are omitted, not plotted at zero — a zero reads as a finding. */
  const radarData = useMemo(
    () =>
      pillarScores
        .filter((p) => p.score !== null)
        .map((p) => ({ category: p.short, fullName: p.name, score: Math.round(p.score! * 10) / 10 })),
    [pillarScores]
  )

  /** Ranking, coverage floor and the strengths/gaps partition all live in scoring.ts. */
  const { ranked, underCovered, strengths, gaps } = useMemo(
    () => rankPillars(allOutcomes),
    [allOutcomes]
  )

  /**
   * Gap-to-roadmap: the weakest pillars, mapped to the waves that address them.
   *
   * The banking layer is *additive* — a banking engagement runs the core waves and
   * the banking ones on top. Filtering waves through `shows()` therefore hid every
   * core wave in banking-only mode and left seven of eleven pillars with an empty
   * roadmap cell. Core waves always apply; banking waves apply when banking is shown.
   */
  const derivedRoadmap = useMemo(() => {
    return ranked.slice(0, 5).map((gap) => {
      const pillar = PILLARS.find((p) => p.id === gap.pillarId)
      const waves = PLAN.waves.filter(
        (w) => w.pillarIds.includes(gap.pillarId) && (w.layer === 'core' || shows(w.layer))
      )
      return {
        pillarId: gap.pillarId,
        name: gap.name,
        score: gap.score,
        confidence: gap.confidence,
        firstDeliverable: pillar?.deliverables[0] ?? '',
        waves: waves.map((w) => `W${w.wave} ${w.name} (${w.weeks})`),
      }
    })
  }, [ranked, shows])

  // setAnswers is a stable useCallback from usePersistedState, so naming it here
  // costs nothing and keeps the hook honest about what it closes over.
  const setAnswer = useCallback((qid: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }))
  }, [setAnswers])

  const handleReset = () => {
    setAnswers({})
    setShowResults(false)
  }

  const exportScores = () => {
    downloadCSV(
      pillarScores.map((p) => ({
        pillar_id: p.pillarId,
        pillar: p.name,
        // Empty, not 0. A spreadsheet cannot tell "unassessed" from "worst possible"
        // once a zero is written, and it will average the zero into the total.
        weighted_score: p.score === null ? '' : Math.round(p.score * 100) / 100,
        maturity_level: p.score === null ? 'Not assessed' : LEVEL_LABEL[Math.round(p.score)],
        questions_answered: p.answered,
        questions_total: p.total,
        coverage_pct: Math.round(p.confidence * 100),
        ranked: p.score === null ? 'n/a' : p.confidence >= RANK_MIN_CONFIDENCE ? 'YES' : 'below coverage floor',
      })),
      `dg-diagnostic-${orgName.trim().replace(/\s+/g, '-').toLowerCase() || 'assessment'}`
    )
  }

  /**
   * The generator and the PDF engine are pulled at click time, not imported at
   * the top of this file — the HAIW pattern, and the only one of the three
   * existing report components that keeps jsPDF out of the page's own chunk.
   */
  const generatePdf = async () => {
    setPdfError(null)
    setGenerating(true)
    try {
      const [{ buildDiagnosticReport, DIAGNOSTIC_ARTEFACT_ID }, { saveReport }, { reportFilename }] =
        await Promise.all([
          import('../report/diagnosticReport'),
          import('../../report/spine'),
          import('../../report/naming'),
        ])
      const meta = {
        orgName: orgName.trim() || 'Unnamed engagement',
        engagementId: active?.id ?? '',
        // Read here, once, rather than inside the report — and truncated to the
        // day on purpose. This is a dated deliverable, so millisecond precision
        // buys nothing and would make two clicks on the same afternoon produce
        // files differing only in PDF metadata. Same engagement + same answers +
        // same layer + same day now means byte-identical output.
        generatedAt: `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
        layer: filter,
        accent: [225, 29, 72] as const, // rose-600, the DGIW accent
        isDraft: progress < 100,
        artefactId: DIAGNOSTIC_ARTEFACT_ID,
      }
      saveReport(buildDiagnosticReport({ meta, answers }), reportFilename(meta, 'pdf'), meta)
    } catch (err) {
      console.error('[dgiw] diagnostic report failed', err)
      setPdfError(err instanceof Error ? err.message : 'Report generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const exportFull = () => {
    downloadJSON(
      {
        organisation: orgName.trim() || 'Unnamed',
        layerScope: filter,
        overallScore: overall === null ? null : Math.round(overall * 100) / 100,
        rankingCoverageFloor: RANK_MIN_CONFIDENCE,
        pillarScores: pillarScores.map((p) => ({
          ...p,
          score: p.score === null ? null : Math.round(p.score * 100) / 100,
          confidence: Math.round(p.confidence * 100) / 100,
        })),
        responses: questions
          .filter((q) => answers[q.id])
          .map((q) => ({ id: q.id, pillarId: q.pillarId, layer: q.layer, weight: q.weight, score: answers[q.id] })),
        derivedRoadmap,
      },
      `dg-diagnostic-full-${orgName.trim().replace(/\s+/g, '-').toLowerCase() || 'assessment'}`
    )
  }

  // ── Results view ──
  if (showResults) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Diagnostic Results"
          subtitle={`Weighted maturity across ${pillarScores.length} pillars, scored on ${answeredCount} of ${questions.length} questions in the ${filter === 'all' ? 'combined core + banking' : filter} layer.`}
          actions={
            <>
              <button
                onClick={() => void generatePdf()}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={14} />
                {generating ? 'Generating…' : 'Generate diagnostic report'}
              </button>
              <ExportButton onClick={exportScores} label="Export scores (CSV)" />
              <ExportButton onClick={exportFull} label="Export full (JSON)" />
              <button
                onClick={() => setShowResults(false)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                Back to questions
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </>
          }
        />

        {pdfError && (
          <Card className="p-4 border border-red-200">
            <p className="text-sm text-red-600">Report generation failed: {pdfError}</p>
          </Card>
        )}

        <Card className="p-4">
          <label className="text-sm text-slate-600 mb-1 block">Organisation name (used in exports)</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. United Bank Limited"
            className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm text-slate-500 mb-2">Weighted overall maturity</p>
              <p className="text-5xl font-bold text-rose-600">{show1(overall)}</p>
              <p className="text-lg text-slate-400 mt-1">/ 5.0</p>
              <p className="text-sm text-slate-500 mt-2">{overall === null ? 'Not assessed' : LEVEL_LABEL[Math.round(overall)]}</p>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <Stat value={answeredCount} label="Questions answered" />
              <Stat value={`${progress}%`} label="Coverage" tone="rose" />
            </div>
          </div>

          <Card className="lg:col-span-2 p-6">
            <SectionTitle hint="Weighted mean per pillar. Decisive questions carry three times the influence of contextual ones.">
              Maturity radar
            </SectionTitle>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 11 }} tickCount={6} />
                <Radar name="Weighted score" dataKey="score" stroke="#e11d48" fill="#e11d48" fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Heatmap */}
        <Card className="p-6">
          <SectionTitle hint="Unassessed pillars are shown neutral rather than as a zero score. A dot marks a pillar answered too thinly to rank.">
            Pillar heatmap
          </SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {pillarScores.map((p) => (
              <div key={p.pillarId} className={`rounded-lg p-3 ${heatColour(p.score)}`}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono opacity-70">{p.pillarId}</p>
                  {p.score !== null && p.confidence < RANK_MIN_CONFIDENCE && (
                    <span title="Below the coverage floor — not ranked" className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  )}
                </div>
                <p className="text-sm font-semibold leading-tight mt-0.5">{p.short}</p>
                <p className="text-2xl font-bold mt-2">{show1(p.score)}</p>
                <p className="text-[11px] opacity-80 mt-0.5">{p.answered}/{p.total} answered</p>
              </div>
            ))}
          </div>
          {underCovered.length > 0 && (
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {underCovered.length} pillar{underCovered.length > 1 ? 's are' : ' is'} scored on under{' '}
              {Math.round(RANK_MIN_CONFIDENCE * 100)}% of {underCovered.length > 1 ? 'their' : 'its'} question weight
              ({underCovered.map((p) => p.short).join(', ')}) and {underCovered.length > 1 ? 'are' : 'is'} excluded from
              the strength and gap rankings. The score is shown; it is not yet defensible.
            </p>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <SectionTitle hint="Ranked only among pillars answered on at least half their question weight, and never the same pillar as a priority gap.">
              Top strengths
            </SectionTitle>
            {strengths.map((s, i) => (
              <div key={s.pillarId} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{i + 1}. {s.name}</span>
                <span className="text-sm font-medium text-emerald-600">{show1(s.score)}</span>
              </div>
            ))}
            {strengths.length === 0 && (
              <p className="text-sm text-slate-400">
                {ranked.length === 0
                  ? 'No pillar is yet answered on enough of its question weight to rank.'
                  : 'Only one pillar has enough coverage to rank, and it is reported as a gap. Answer more before claiming a strength.'}
              </p>
            )}
          </Card>
          <Card className="p-6">
            <SectionTitle hint="The weakest ranked pillars. These drive the roadmap below.">
              Priority gaps
            </SectionTitle>
            {gaps.map((g, i) => (
              <div key={g.pillarId} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{i + 1}. {g.name}</span>
                <span className="text-sm font-medium text-rose-600">{show1(g.score)}</span>
              </div>
            ))}
            {gaps.length === 0 && (
              <p className="text-sm text-slate-400">
                No pillar is yet answered on enough of its question weight to rank.
              </p>
            )}
          </Card>
        </div>

        {/* Derived roadmap */}
        <Card className="p-6">
          <SectionTitle hint="Generated from the weakest pillars and the implementation waves that address them — the diagnostic's roadmap output, not a generic template.">
            Derived roadmap
          </SectionTitle>
          <TableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Pillar</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Coverage</th>
                  <th className="py-2 pr-4 font-medium">First deliverable that moves it</th>
                  <th className="py-2 font-medium">Addressed in</th>
                </tr>
              </thead>
              <tbody>
                {derivedRoadmap.map((r) => (
                  <tr key={r.pillarId} className="border-b border-slate-100 last:border-0 align-top">
                    <td className="py-3 pr-4 text-slate-700">{r.name}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${heatColour(r.score)}`}>{show1(r.score)}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{Math.round(r.confidence * 100)}%</td>
                    <td className="py-3 pr-4 text-slate-600 leading-snug">{r.firstDeliverable}</td>
                    <td className="py-3 text-slate-600 leading-snug">
                      {r.waves.length ? r.waves.join(' · ') : <span className="text-slate-400">No wave addresses this pillar</span>}
                    </td>
                  </tr>
                ))}
                {derivedRoadmap.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-sm text-slate-400">
                      No pillar has reached {Math.round(RANK_MIN_CONFIDENCE * 100)}% question coverage yet. Answer more
                      questions in a pillar to generate a roadmap from it.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      </div>
    )
  }

  // ── Question flow ──
  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Governance Maturity Diagnostic"
        subtitle={DIAG.description}
        actions={
          <button
            onClick={() => setShowResults(true)}
            disabled={answeredCount === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
          >
            View results ({answeredCount}/{questions.length})
          </button>
        }
      />

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 shrink-0">{answeredCount} / {questions.length} answered</span>
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm font-medium text-rose-600 shrink-0">{progress}%</span>
        </div>
      </Card>

      {PILLARS.map((pillar) => {
        const qs = questions.filter((q) => q.pillarId === pillar.id)
        if (qs.length === 0) return null
        const isOpen = openPillar === pillar.id
        const pillarAnswered = qs.filter((q) => answers[q.id]).length

        return (
          <Card key={pillar.id} className="overflow-hidden">
            <button
              onClick={() => setOpenPillar(isOpen ? null : pillar.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-mono text-slate-400 shrink-0">{pillar.id}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-slate-800">{pillar.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{pillarAnswered} of {qs.length} answered</p>
              </div>
              {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {qs.map((q, qi) => {
                  const val = answers[q.id] || 0
                  const isExpanded = expandedQ[q.id] ?? false
                  return (
                    <div key={q.id} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${val > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'}`}>
                          {qi + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 leading-relaxed">{q.text}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <LayerBadge layer={q.layer} />
                            <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 bg-slate-50 text-slate-500 ring-slate-200">
                              Weight {q.weight} · {WEIGHT_LABEL[q.weight]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pl-10">
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={1}
                            max={5}
                            value={val || 3}
                            onChange={(e) => setAnswer(q.id, Number(e.target.value))}
                            // An unrated slider already sits at 3, so selecting 3 fires no change
                            // event. Commit the displayed value on release so "3" is answerable.
                            onPointerUp={(e) => {
                              if (!val) setAnswer(q.id, Number((e.target as HTMLInputElement).value))
                            }}
                            className="flex-1 accent-rose-600"
                          />
                          <span className="text-sm font-medium w-32 text-rose-600 shrink-0">
                            {val > 0 ? `${val} — ${LEVEL_LABEL[val]}` : 'Not rated'}
                          </span>
                        </div>

                        <button
                          onClick={() => setExpandedQ((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Hide' : 'Show'} level descriptions
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(q.levelDescriptions).map(([level, desc]) => {
                              const lvl = Number(level)
                              const isSelected = val === lvl
                              return (
                                <div key={level} className={`flex gap-2 text-xs rounded-md px-2 py-1.5 ${isSelected ? 'bg-rose-50 ring-1 ring-rose-200' : ''}`}>
                                  <span className={`font-medium shrink-0 w-14 ${isSelected ? 'text-rose-700' : 'text-rose-600'}`}>
                                    Level {level}:
                                  </span>
                                  <span className={`leading-relaxed ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>{desc}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
