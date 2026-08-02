import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts'
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  RotateCcw, Check, Circle, Minus, Info
} from 'lucide-react'
import { loadHacrQuestions, loadCapabilities } from '../data'
import type { HacrData, HacrQuestion, HaiwAssessmentAnswer, HaiwCapability } from '../types'
import HealthReportGenerator from './HealthReportGenerator'
import { usePersistedState } from '../../engagement/usePersistedState'
import { HACR_ANSWERS_KEY } from '../hacr'
import {
  scoreCategories, coverageStatement,
  overallCurrent as overallCurrentOf, overallDesired as overallDesiredOf,
} from '../../scoring/maturity'

// ── Constants ──────────────────────────────────────────────────────────

/**
 * Base key only — the value is filed under the active engagement.
 *
 * Imported rather than typed, since D-013: the dashboard reads the same answers,
 * and a reader whose spelling of the key can drift from the writer's is D4's
 * site 3.
 */
const STORAGE_KEY = HACR_ANSWERS_KEY

const MATURITY_LABELS: Record<number, string> = {
  1: 'Initial',
  2: 'Developing',
  3: 'Defined',
  4: 'Managed',
  5: 'Optimizing',
}

// ── Helpers ────────────────────────────────────────────────────────────

function isAnswerMap(parsed: unknown): boolean {
  return !!parsed && typeof parsed === 'object' && !Array.isArray(parsed)
}

function gapColor(gap: number): string {
  if (gap >= 3) return 'bg-red-600'
  if (gap >= 2) return 'bg-red-500'
  if (gap >= 1) return 'bg-amber-500'
  if (gap > 0) return 'bg-yellow-400'
  return 'bg-emerald-500'
}

function gapTextColor(gap: number): string {
  if (gap >= 2) return 'text-red-700 bg-red-100'
  if (gap >= 1) return 'text-amber-700 bg-amber-100'
  return 'text-emerald-700 bg-emerald-100'
}

function priorityLabel(gap: number): string {
  if (gap >= 2.5) return 'Critical'
  if (gap >= 1.5) return 'High'
  if (gap >= 0.5) return 'Medium'
  return 'Low'
}

// ── Component ──────────────────────────────────────────────────────────

export default function HealthMaturityAssessment() {
  const [hacrData, setHacrData] = useState<HacrData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0)
  const [answers, setAnswers] = usePersistedState<Record<string, HaiwAssessmentAnswer>>(STORAGE_KEY, {}, isAnswerMap)
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({})
  const [capabilities, setCapabilities] = useState<HaiwCapability[]>([])
  /*
   * D-008. `[]` used to be the only signal a capability load had failed, and it
   * is ambiguous: "still loading" and "the fetch rejected" are the same value.
   * The report generators read that empty array and synthesised plausible rows
   * from it, so a failed fetch produced a deliverable rather than an error.
   *
   * Tracked explicitly so the report panel can say which of the two it is. The
   * error is still swallowed here on purpose — the assessment itself does not
   * need capabilities and must stay usable — but it is no longer silent.
   */
  const [capabilitiesFailed, setCapabilitiesFailed] = useState(false)

  // Load data
  useEffect(() => {
    loadHacrQuestions()
      .then(data => setHacrData(data))
      .finally(() => setLoading(false))
    loadCapabilities()
      .then(caps => { setCapabilities(caps); setCapabilitiesFailed(false) })
      .catch(err => {
        console.error('[haiw] capabilities.json failed to load; capability sections of the report are unavailable', err)
        setCapabilities([])
        setCapabilitiesFailed(true)
      })
  }, [])

  // Answers persist through usePersistedState, per engagement

  const categories = useMemo(() => hacrData?.categories ?? [], [hacrData])
  const currentCategory = categories[currentCategoryIdx]

  // Flatten all questions per category for scoring
  const questionsPerCategory = useMemo(() => {
    return categories.map(cat => {
      const qs: HacrQuestion[] = []
      cat.sections.forEach(s => qs.push(...s.questions))
      return { category: cat, questions: qs }
    })
  }, [categories])

  /**
   * Every question, flat. `questionsPerCategory` above keeps them grouped for
   * rendering; the report generator scores capabilities across category
   * boundaries, because a capability's linked questions are not confined to one.
   */
  const allQuestions = useMemo(
    () => questionsPerCategory.flatMap(({ questions: qs }) => qs),
    [questionsPerCategory],
  )

  // Category progress info
  const categoryProgress = useMemo(() => {
    return questionsPerCategory.map(({ category: cat, questions: qs }) => {
      const answered = qs.filter(q => answers[q.id]).length
      return {
        name: cat.name,
        categoryId: cat.categoryId,
        answered,
        total: qs.length,
        complete: answered === qs.length && qs.length > 0,
        touched: answered > 0,
      }
    })
  }, [questionsPerCategory, answers])

  /*
   * SCORED THROUGH src/scoring/maturity.ts, NOT HERE.
   *
   * This block used to be its own implementation of the category mean — one of
   * four in the suite — and the report generator was another. They agreed on this
   * page's numbers and disagreed on the cover: the screen divided the overall by
   * the SCORED categories, the PDF divided by all eight. Four of eight answered at
   * 3.0 printed 3.0 here and 1.5 there, for the same client on the same day, and
   * no golden fixture could see it because every fixture answers everything.
   *
   * The overall is now built from the UNROUNDED category means as well. Averaging
   * the 1dp values shown in the table is the recomposition `dgiw/scoring.ts` warns
   * about — it is how a headline reads 3.2 when the evidence says 3.15.
   */
  const outcomes = useMemo(
    () => scoreCategories(questionsPerCategory.map(({ category: cat, questions: qs }) => ({
      name: cat.name,
      entries: qs.map(q => ({ weight: 1, answer: answers[q.id] })),
    }))),
    [questionsPerCategory, answers],
  )

  const radarData = useMemo(
    () => outcomes.map(o => ({
      category: o.name.length > 14 ? o.name.slice(0, 12) + '..' : o.name,
      fullName: o.name,
      state: o.agg.state,
      // Recharts needs a number for the polygon. An unscored category is drawn at
      // 0 and LABELLED as unscored in the table below; the coverage line states
      // how many of the eight the overall rests on.
      current: o.agg.current ?? 0,
      target: o.agg.desired ?? 0,
      gap: o.agg.gap ?? 0,
    })),
    [outcomes],
  )

  const overallCurrent = useMemo(() => overallCurrentOf(outcomes) ?? 0, [outcomes])
  const overallTarget = useMemo(() => overallDesiredOf(outcomes) ?? 0, [outcomes])
  const coverage = useMemo(() => coverageStatement(outcomes), [outcomes])

  const touchedCategoryCount = useMemo(() => {
    return categoryProgress.filter(c => c.touched).length
  }, [categoryProgress])

  const totalAnswered = useMemo(() => Object.keys(answers).length, [answers])

  // Handlers
  const setAnswer = useCallback((questionId: string, currentState: number, desiredState: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { questionId, currentState, desiredState },
    }))
  }, [setAnswers])

  const toggleContext = useCallback((qId: string) => {
    setExpandedContexts(prev => ({ ...prev, [qId]: !prev[qId] }))
  }, [])

  const handleReset = useCallback(() => {
    if (window.confirm('Clear all assessment answers? This cannot be undone.')) {
      setAnswers({})
      setCurrentCategoryIdx(0)
    }
  }, [setAnswers])

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="h-[600px] bg-white rounded-lg shadow-sm animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">HACR Maturity Assessment</h1>
          <p className="text-sm text-slate-500">
            Healthcare Analytics Capability & Readiness — {hacrData?.totalQuestions ?? 0} questions across {categories.length} categories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {totalAnswered} / {hacrData?.totalQuestions ?? 0} answered
          </span>
          <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${hacrData ? (totalAnswered / hacrData.totalQuestions) * 100 : 0}%` }}
            />
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* ── Category Stepper ── */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {categoryProgress.map((cp, idx) => {
            const isActive = idx === currentCategoryIdx
            return (
              <button
                key={cp.categoryId}
                onClick={() => setCurrentCategoryIdx(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400'
                    : cp.complete
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : cp.touched
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  cp.complete
                    ? 'bg-emerald-500 text-white'
                    : isActive
                      ? 'bg-emerald-400 text-white'
                      : cp.touched
                        ? 'bg-amber-400 text-white'
                        : 'bg-slate-200 text-slate-400'
                }`}>
                  {cp.complete ? <Check size={12} /> : isActive ? <Circle size={8} fill="currentColor" /> : <Minus size={10} />}
                </span>
                <span className="hidden lg:inline">{cp.name}</span>
                <span className="lg:hidden">{idx + 1}</span>
                {cp.touched && (
                  <span className="text-xs opacity-70">{cp.answered}/{cp.total}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main Content: Questions + Radar ── */}
      <div className="flex gap-6 items-start">
        {/* Questions Panel */}
        <div className="flex-1 min-w-0">
          {/* Category header + nav */}
          <div className="bg-white rounded-lg shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentCategoryIdx(Math.max(0, currentCategoryIdx - 1))}
                disabled={currentCategoryIdx === 0}
                className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-800">{currentCategory?.name}</h2>
                <p className="text-xs text-slate-400">
                  Category {currentCategoryIdx + 1} of {categories.length}
                  {' '}&middot;{' '}
                  {currentCategory?.questionCount} questions in {currentCategory?.sections.length} sections
                </p>
              </div>
              <button
                onClick={() => setCurrentCategoryIdx(Math.min(categories.length - 1, currentCategoryIdx + 1))}
                disabled={currentCategoryIdx === categories.length - 1}
                className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Sections & Questions */}
          {currentCategory?.sections.map((section, sIdx) => (
            <div key={sIdx} className="mb-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-1.5 h-5 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-700">{section.name}</h3>
                <span className="text-xs text-slate-400">({section.questions.length} questions)</span>
              </div>

              <div className="space-y-3">
                {section.questions.map((q) => {
                  const answer = answers[q.id]
                  const currentVal = answer?.currentState ?? 0
                  const targetVal = answer?.desiredState ?? 0
                  const gap = answer ? targetVal - currentVal : 0
                  const isContextOpen = expandedContexts[q.id] ?? false

                  return (
                    <div key={q.id} className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
                      {/* Question header */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                          {q.id}
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed">{q.question}</p>
                      </div>

                      {/* Sliders */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {/* Current Score */}
                        <div className="bg-slate-50 rounded-lg p-3">
                          <label className="text-xs text-slate-500 mb-1.5 flex items-center justify-between">
                            <span>Current State</span>
                            <span className="font-semibold text-emerald-600">
                              {currentVal > 0 ? `${currentVal} — ${MATURITY_LABELS[currentVal]}` : 'Not rated'}
                            </span>
                          </label>
                          <input
                            type="range"
                            min={1} max={5} step={1}
                            value={currentVal || 1}
                            onChange={(e) => {
                              const v = Number(e.target.value)
                              setAnswer(q.id, v, targetVal || Math.max(v, 3))
                            }}
                            className="w-full accent-emerald-600 cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-0.5 px-0.5">
                            {[1, 2, 3, 4, 5].map(v => <span key={v}>{v}</span>)}
                          </div>
                          {currentVal > 0 && q.levelDescriptions[String(currentVal)] && (
                            <p className="text-xs text-emerald-600/80 mt-2 italic leading-tight">
                              {q.levelDescriptions[String(currentVal)]}
                            </p>
                          )}
                        </div>

                        {/* Target Score */}
                        <div className="bg-slate-50 rounded-lg p-3">
                          <label className="text-xs text-slate-500 mb-1.5 flex items-center justify-between">
                            <span>Target State</span>
                            <span className="font-semibold text-orange-600">
                              {targetVal > 0 ? `${targetVal} — ${MATURITY_LABELS[targetVal]}` : 'Not rated'}
                            </span>
                          </label>
                          <input
                            type="range"
                            min={1} max={5} step={1}
                            value={targetVal || 3}
                            onChange={(e) => {
                              const v = Number(e.target.value)
                              setAnswer(q.id, currentVal || 1, v)
                            }}
                            className="w-full accent-orange-500 cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-0.5 px-0.5">
                            {[1, 2, 3, 4, 5].map(v => <span key={v}>{v}</span>)}
                          </div>
                          {targetVal > 0 && q.levelDescriptions[String(targetVal)] && (
                            <p className="text-xs text-orange-600/80 mt-2 italic leading-tight">
                              {q.levelDescriptions[String(targetVal)]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Gap indicator + Pakistan context */}
                      <div className="flex items-center justify-between">
                        {answer ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Gap:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${gapTextColor(gap)}`}>
                              {gap > 0 ? `+${gap}` : gap}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unanswered</span>
                        )}

                        {q.pakistanContext && (
                          <button
                            onClick={() => toggleContext(q.id)}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                          >
                            <Info size={12} />
                            Pakistan Context
                            {isContextOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}
                      </div>

                      {isContextOpen && q.pakistanContext && (
                        <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <p className="text-xs text-emerald-800 leading-relaxed">{q.pakistanContext}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Bottom navigation */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
            <button
              onClick={() => setCurrentCategoryIdx(Math.max(0, currentCategoryIdx - 1))}
              disabled={currentCategoryIdx === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} /> Previous Category
            </button>
            <span className="text-xs text-slate-400">
              {currentCategoryIdx + 1} / {categories.length}
            </span>
            <button
              onClick={() => setCurrentCategoryIdx(Math.min(categories.length - 1, currentCategoryIdx + 1))}
              disabled={currentCategoryIdx === categories.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-30 transition-colors"
            >
              Next Category <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ── Sidebar: Radar + Summary ── */}
        <div className="w-[380px] shrink-0 space-y-4 sticky top-20">
          {/* Radar Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Maturity Radar</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} tickCount={6} />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="line"
                />
                <Tooltip
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value: number | undefined, name: string | undefined) => [value != null ? value.toFixed(1) : '0', name ?? '']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score Overview */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            {/* The denominator behind the three numbers below. 3.0 from four of
                eight categories is not the same claim as 3.0 from eight. */}
            <p className="text-xs text-slate-400 mb-2">{coverage}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Current</p>
                <p className="text-2xl font-bold text-emerald-600">{overallCurrent}</p>
                <p className="text-xs text-slate-400">{MATURITY_LABELS[Math.round(overallCurrent)] || '--'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Target</p>
                <p className="text-2xl font-bold text-orange-500">{overallTarget}</p>
                <p className="text-xs text-slate-400">{MATURITY_LABELS[Math.round(overallTarget)] || '--'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Gap</p>
                <p className="text-2xl font-bold text-slate-700">
                  {overallCurrent > 0 ? (overallTarget - overallCurrent).toFixed(1) : '--'}
                </p>
                <p className="text-xs text-slate-400">
                  {overallCurrent > 0 ? priorityLabel(overallTarget - overallCurrent) : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Report downloads — PDF / CSV / roadmap slides */}
          <HealthReportGenerator
            answers={Object.values(answers)}
            capabilities={capabilities}
            capabilitiesFailed={capabilitiesFailed}
            questions={allQuestions}
            answeredCategories={touchedCategoryCount}
            totalCategories={categories.length}
          />

          {/* Summary Panel — shown when all categories touched */}
          {touchedCategoryCount === categories.length && categories.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <Check size={14} className="text-emerald-500" />
                Assessment Summary
              </h3>

              {/* Category scorecard table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-1.5 text-slate-500 font-medium">Category</th>
                      <th className="text-center py-1.5 text-slate-500 font-medium">Cur</th>
                      <th className="text-center py-1.5 text-slate-500 font-medium">Tgt</th>
                      <th className="text-center py-1.5 text-slate-500 font-medium">Gap</th>
                      <th className="text-center py-1.5 text-slate-500 font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...radarData].sort((a, b) => b.gap - a.gap).map(r => (
                      <tr key={r.fullName} className="border-b border-slate-50">
                        <td className="py-1.5 text-slate-700 truncate max-w-[120px]" title={r.fullName}>
                          {r.fullName}
                        </td>
                        {/* An unscored category shows why, not a 0. A reader
                            cannot tell "measured at zero" from "nobody answered"
                            when both print the same digit — the D-003 lesson. */}
                        {r.state === 'scored' ? (
                          <>
                            <td className="py-1.5 text-center text-emerald-600 font-medium">{r.current}</td>
                            <td className="py-1.5 text-center text-orange-500 font-medium">{r.target}</td>
                            <td className="py-1.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${gapTextColor(r.gap)}`}>
                                {r.gap}
                              </span>
                            </td>
                            <td className="py-1.5 text-center text-slate-500">{priorityLabel(r.gap)}</td>
                          </>
                        ) : (
                          <td className="py-1.5 text-center text-slate-400 text-xs" colSpan={4}>
                            {r.state === 'not-applicable' ? 'NOT APPLICABLE' : 'NOT ASSESSED'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gap Heat Map */}
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-2">Gap Heat Map</h4>
                <div className="grid grid-cols-4 gap-1.5">
                  {radarData.map(r => (
                    <div
                      key={r.fullName}
                      className={`${gapColor(r.gap)} rounded p-1.5 text-center`}
                      title={`${r.fullName}: gap ${r.gap}`}
                    >
                      <p className="text-[11px] text-white font-medium leading-tight truncate">{r.category}</p>
                      <p className="text-sm text-white font-bold">{r.gap}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> 0</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400" /> 0-1</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> 1-2</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> 2-3</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600" /> 3+</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
