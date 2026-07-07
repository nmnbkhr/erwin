import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip,
} from 'recharts'
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  RotateCcw, Check, Circle, CircleDot, BarChart3, Download,
  Zap, ClipboardList, Microscope, Mail,
} from 'lucide-react'
import { downloadJSON, downloadCSV } from '../utils/export'
import TradeReportGenerator from './TradeReportGenerator'
import QuickAssessment from '../../components/QuickAssessment'
import { loadTacrQuestions } from '../data'
import type { TacrData, TacrCategory, TacrSection } from '../types'
import tradeQuickData from '../../data/taiw/quickAssessment.json'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AnswerMap {
  [questionId: string]: { currentState: number; desiredState: number }
}

const STORAGE_KEY = 'taiw_maturity'

const MATURITY_LABELS: Record<number, string> = {
  1: 'Initial',
  2: 'Developing',
  3: 'Defined',
  4: 'Managed',
  5: 'Optimizing',
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadAnswers(): AnswerMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AnswerMap) : {}
  } catch {
    return {}
  }
}

function saveAnswers(answers: AnswerMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TradeMaturityAssessment() {
  const [data, setData] = useState<TacrData | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<AnswerMap>(loadAnswers)
  const [catIdx, setCatIdx] = useState(0)
  const [secIdx, setSecIdx] = useState(0)
  const [assessmentMode, setAssessmentMode] = useState<'select' | 'quick' | 'standard' | 'deep'>('select')
  const [viewMode, setViewMode] = useState<'assessment' | 'results'>('assessment')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // ---- Load data ----
  useEffect(() => {
    loadTacrQuestions().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  // ---- Persist answers ----
  useEffect(() => {
    saveAnswers(answers)
  }, [answers])

  // ---- Derived ----
  const categories = data?.categories ?? []
  const totalQuestions = data?.totalQuestions ?? 0
  const currentCategory: TacrCategory | undefined = categories[catIdx]
  const sections: TacrSection[] = currentCategory?.sections ?? []
  const currentSection: TacrSection | undefined = sections[secIdx]
  const questions = currentSection?.questions ?? []

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers],
  )

  const progressPct = totalQuestions > 0
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0

  // Category completion map
  const categoryCompletion = useMemo(() => {
    return categories.map((cat) => {
      let total = 0
      let done = 0
      for (const sec of cat.sections) {
        for (const q of sec.questions) {
          total++
          if (answers[q.id]) done++
        }
      }
      return { total, done, complete: total > 0 && done === total }
    })
  }, [categories, answers])

  const answeredCategoryCount = useMemo(() => {
    return categoryCompletion.filter(cp => cp.done > 0).length
  }, [categoryCompletion])

  // ---- Handlers ----
  const setAnswer = useCallback(
    (qid: string, field: 'currentState' | 'desiredState', value: number) => {
      setAnswers((prev) => {
        const existing = prev[qid] || { currentState: 0, desiredState: 0 }
        return { ...prev, [qid]: { ...existing, [field]: value } }
      })
    },
    [],
  )

  const toggleExpand = useCallback((qid: string) => {
    setExpanded((prev) => ({ ...prev, [qid]: !prev[qid] }))
  }, [])

  const handleReset = useCallback(() => {
    setAnswers({})
    setCatIdx(0)
    setSecIdx(0)
    setViewMode('assessment')
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Navigation helpers
  const goNextSection = useCallback(() => {
    if (secIdx < sections.length - 1) {
      setSecIdx(secIdx + 1)
    } else if (catIdx < categories.length - 1) {
      setCatIdx(catIdx + 1)
      setSecIdx(0)
    }
  }, [secIdx, sections.length, catIdx, categories.length])

  const goPrevSection = useCallback(() => {
    if (secIdx > 0) {
      setSecIdx(secIdx - 1)
    } else if (catIdx > 0) {
      const prevCat = categories[catIdx - 1]
      setCatIdx(catIdx - 1)
      setSecIdx(prevCat ? prevCat.sections.length - 1 : 0)
    }
  }, [secIdx, catIdx, categories])

  const isFirstSection = catIdx === 0 && secIdx === 0
  const isLastSection =
    catIdx === categories.length - 1 && secIdx === sections.length - 1

  // ---- Radar data ----
  const radarData = useMemo(() => {
    return categories.map((cat) => {
      const allQ = cat.sections.flatMap((s) => s.questions)
      const answered = allQ.filter((q) => answers[q.id])
      const currentAvg =
        answered.length > 0
          ? answered.reduce((s, q) => s + (answers[q.id]?.currentState || 0), 0) / answered.length
          : 0
      const desiredAvg =
        answered.length > 0
          ? answered.reduce((s, q) => s + (answers[q.id]?.desiredState || 0), 0) / answered.length
          : 0
      return {
        category: cat.name.length > 14 ? cat.name.slice(0, 12) + '...' : cat.name,
        fullName: cat.name,
        current: Math.round(currentAvg * 10) / 10,
        desired: Math.round(desiredAvg * 10) / 10,
        gap: Math.round((desiredAvg - currentAvg) * 10) / 10,
      }
    })
  }, [categories, answers])

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="flex gap-6">
          <div className="w-[220px] h-[500px] bg-white rounded-lg shadow-sm animate-pulse" />
          <div className="flex-1 h-[500px] bg-white rounded-lg shadow-sm animate-pulse" />
        </div>
      </div>
    )
  }

  // ---- Quick Assessment Mode ----
  if (assessmentMode === 'quick') {
    return (
      <QuickAssessment
        questions={tradeQuickData.questions}
        title={tradeQuickData.title}
        variant="trade"
        onBack={() => setAssessmentMode('select')}
      />
    )
  }

  // ---- Deep mode: contact CTA ----
  if (assessmentMode === 'deep') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Microscope size={48} className="text-teal-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Deep Dive Workshop</h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            A half-day facilitated workshop with your trade and customs leadership. Produces a detailed
            WCO DM conformity plan with implementation roadmap and capacity building recommendations.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="mailto:info@godai.tech" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              <Mail size={16} /> Contact Godaitec
            </a>
            <button onClick={() => setAssessmentMode('select')} className="px-6 py-3 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50">
              Back
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-4">godai.tech | info@godai.tech</p>
        </div>
      </div>
    )
  }

  // ---- Mode Selector ----
  if (assessmentMode === 'select') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 text-center">Choose Your Assessment Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Quick */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-teal-200 hover:border-teal-400 transition-colors p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Zap size={20} className="text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Quick</h3>
                <p className="text-xs text-teal-600 font-medium">FREE</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">24 questions</p>
            <p className="text-sm text-slate-600 mb-1">10 minutes</p>
            <p className="text-xs text-slate-400 mb-4">3-page Quick Scan PDF with radar chart, strengths, and gaps</p>
            <div className="mt-auto">
              <button onClick={() => setAssessmentMode('quick')} className="w-full px-4 py-2.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700">
                Start Quick Scan
              </button>
            </div>
          </div>

          {/* Standard */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-cyan-200 hover:border-cyan-400 transition-colors p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <ClipboardList size={20} className="text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Standard</h3>
                <p className="text-xs text-cyan-600 font-medium">FULL REPORT</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">640+ questions (TACR)</p>
            <p className="text-sm text-slate-600 mb-1">45 minutes</p>
            <p className="text-xs text-slate-400 mb-4">18-page PDF with WCO DM conformity, TCF gaps, roadmap</p>
            <div className="mt-auto">
              <button onClick={() => setAssessmentMode('standard')} className="w-full px-4 py-2.5 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700">
                Start Assessment
              </button>
            </div>
          </div>

          {/* Deep */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 hover:border-slate-400 transition-colors p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Microscope size={20} className="text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Deep</h3>
                <p className="text-xs text-slate-600 font-medium">WORKSHOP</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Facilitated session</p>
            <p className="text-sm text-slate-600 mb-1">Half day</p>
            <p className="text-xs text-slate-400 mb-4">WCO DM conformity plan with capacity building roadmap</p>
            <div className="mt-auto">
              <button onClick={() => setAssessmentMode('deep')} className="w-full px-4 py-2.5 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---- Results view ----
  if (viewMode === 'results') {
    return (
      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">TACR Maturity Assessment Results</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAssessmentMode('select')}
              className="px-3 py-2 text-sm rounded-lg bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            >
              Modes
            </button>
            <button
              onClick={() => downloadJSON({
                answers,
                radarData,
                answeredCount,
                totalQuestions,
                progressPct,
              }, `taiw-maturity-assessment-${new Date().toISOString().slice(0, 10)}.json`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-white text-slate-600 hover:bg-teal-50 border border-slate-200"
            >
              <Download size={14} /> JSON
            </button>
            <button
              onClick={() => downloadCSV(
                radarData.map(r => ({
                  category: r.fullName, current: r.current, desired: r.desired, gap: r.gap,
                  priority: r.gap >= 2 ? 'High' : r.gap >= 1 ? 'Medium' : 'Low',
                })),
                `taiw-maturity-scores-${new Date().toISOString().slice(0, 10)}.csv`,
              )}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-white text-slate-600 hover:bg-teal-50 border border-slate-200"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={() => setViewMode('assessment')}
              className="px-4 py-2 text-sm rounded-lg bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            >
              Back to Assessment
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">Maturity Radar</h3>
          <ResponsiveContainer width="100%" height={420}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 11 }} tickCount={6} />
              <Radar
                name="Current"
                dataKey="current"
                stroke="#0d9488"
                fill="#0d9488"
                fillOpacity={0.2}
              />
              <Radar
                name="Desired"
                dataKey="desired"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.15}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Gap Analysis Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">Gap Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Category</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Current Avg</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Desired Avg</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Gap</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Priority</th>
                </tr>
              </thead>
              <tbody>
                {[...radarData].sort((a, b) => b.gap - a.gap).map((r) => (
                  <tr key={r.fullName} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">{r.fullName}</td>
                    <td className="px-4 py-3 text-center font-medium text-teal-600">{r.current}</td>
                    <td className="px-4 py-3 text-center font-medium text-cyan-600">{r.desired}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.gap >= 2
                            ? 'bg-red-100 text-red-700'
                            : r.gap >= 1
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {r.gap}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500">
                      {r.gap >= 2 ? 'High' : r.gap >= 1 ? 'Medium' : 'Low'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Generator */}
        <TradeReportGenerator
          scores={radarData.map(r => ({ category: r.fullName, current: r.current, desired: r.desired, gap: r.gap }))}
          overallScore={Math.round(radarData.reduce((s, r) => s + r.current, 0) / radarData.length * 10) / 10}
          answeredCategories={answeredCategoryCount}
          totalCategories={categories.length}
        />
      </div>
    )
  }

  // ---- Assessment view ----
  return (
    <div className="space-y-4">
      {/* Top bar: mode toggle + progress */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setAssessmentMode('select')}
            className="px-3 py-2 text-sm rounded-lg bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          >
            Modes
          </button>
          <button
            onClick={() => setViewMode('assessment')}
            className="px-4 py-2 text-sm rounded-lg bg-teal-600 text-white"
          >
            Assessment
          </button>
          <button
            onClick={() => setViewMode('results')}
            className="px-4 py-2 text-sm rounded-lg bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 size={14} /> View Results
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {answeredCount} / {totalQuestions} answered
          </span>
          <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm font-medium text-teal-600">{progressPct}%</span>
          <button
            onClick={handleReset}
            className="ml-2 p-2 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
            title="Reset assessment"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ---- LEFT Sidebar: Category Stepper ---- */}
        <div className="w-[220px] shrink-0 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Categories</h3>
          <div className="space-y-1">
            {categories.map((cat, i) => {
              const comp = categoryCompletion[i]
              const isActive = i === catIdx
              const isComplete = comp?.complete
              const hasProgress = (comp?.done ?? 0) > 0 && !isComplete
              return (
                <button
                  key={cat.name}
                  onClick={() => { setCatIdx(i); setSecIdx(0) }}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-lg flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isComplete
                        ? 'bg-teal-500 text-white'
                        : isActive
                          ? 'bg-teal-100 text-teal-600'
                          : hasProgress
                            ? 'bg-cyan-100 text-cyan-600'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isComplete ? (
                      <Check size={12} />
                    ) : isActive ? (
                      <CircleDot size={12} />
                    ) : (
                      <Circle size={10} />
                    )}
                  </span>
                  <span className="truncate flex-1">{cat.name}</span>
                  <span className={`text-xs ml-auto shrink-0 ${
                    isComplete ? 'text-teal-500 font-medium' : 'text-slate-400'
                  }`}>
                    {comp?.done ?? 0}/{comp?.total ?? 0}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Overall progress bar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-500">Overall</span>
              <span className="text-xs font-semibold text-teal-600">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5 text-center">
              {answeredCount}/{totalQuestions} answered
            </p>
          </div>
        </div>

        {/* ---- CENTER: Question Cards ---- */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          {/* Category title */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {currentCategory?.name ?? ''}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Category {catIdx + 1} of {categories.length}
            </p>
          </div>

          {/* Section tabs */}
          {sections.length > 1 && (
            <div className="flex gap-1 mb-6 border-b border-slate-100 pb-px">
              {sections.map((sec, si) => {
                const isActive = si === secIdx
                return (
                  <button
                    key={sec.name}
                    onClick={() => setSecIdx(si)}
                    className={`px-3 py-2 text-xs rounded-t-lg transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-medium border-b-2 border-teal-500'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {sec.name}
                  </button>
                )
              })}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-5">
            {questions.map((q) => {
              const answer = answers[q.id]
              const isExpanded = expanded[q.id] ?? false
              return (
                <div key={q.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-700 mb-4 leading-relaxed">{q.text}</p>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Current Maturity */}
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block">
                        Current Maturity:{' '}
                        <span className="font-medium text-teal-600">
                          {answer?.currentState
                            ? `${answer.currentState} - ${MATURITY_LABELS[answer.currentState]}`
                            : 'Not rated'}
                        </span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <label
                            key={v}
                            className={`flex-1 text-center cursor-pointer rounded-md py-2 text-xs font-medium transition-colors ${
                              answer?.currentState === v
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-teal-300 hover:text-teal-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`${q.id}-current`}
                              value={v}
                              checked={answer?.currentState === v}
                              onChange={() => setAnswer(q.id, 'currentState', v)}
                              className="sr-only"
                            />
                            {v}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Desired Maturity */}
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block">
                        Desired Maturity:{' '}
                        <span className="font-medium text-cyan-600">
                          {answer?.desiredState
                            ? `${answer.desiredState} - ${MATURITY_LABELS[answer.desiredState]}`
                            : 'Not rated'}
                        </span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <label
                            key={v}
                            className={`flex-1 text-center cursor-pointer rounded-md py-2 text-xs font-medium transition-colors ${
                              answer?.desiredState === v
                                ? 'bg-cyan-600 text-white shadow-sm'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-cyan-300 hover:text-cyan-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`${q.id}-desired`}
                              value={v}
                              checked={answer?.desiredState === v}
                              onChange={() => setAnswer(q.id, 'desiredState', v)}
                              className="sr-only"
                            />
                            {v}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expandable level descriptions */}
                  <button
                    onClick={() => toggleExpand(q.id)}
                    className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? 'Hide' : 'Show'} level descriptions
                  </button>
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 pl-1">
                      {Object.entries(q.levels).map(([level, desc]) => {
                        const lvl = Number(level)
                        const isCurrent = answer?.currentState === lvl
                        const isDesired = answer?.desiredState === lvl
                        return (
                          <div
                            key={level}
                            className={`flex gap-2 text-xs rounded-md px-2 py-1.5 transition-colors ${
                              isCurrent && isDesired
                                ? 'bg-gradient-to-r from-teal-50 to-cyan-50 ring-1 ring-teal-300'
                                : isCurrent
                                  ? 'bg-teal-50 ring-1 ring-teal-200'
                                  : isDesired
                                    ? 'bg-cyan-50 ring-1 ring-cyan-200'
                                    : ''
                            }`}
                          >
                            <span className={`font-medium shrink-0 w-14 ${
                              isCurrent ? 'text-teal-700' : isDesired ? 'text-cyan-700' : 'text-teal-600'
                            }`}>
                              Level {level}:
                            </span>
                            <span className={`leading-relaxed flex-1 ${
                              isCurrent || isDesired ? 'text-slate-700' : 'text-slate-500'
                            }`}>{desc}</span>
                            {(isCurrent || isDesired) && (
                              <span className="flex items-center gap-1 shrink-0">
                                {isCurrent && (
                                  <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-teal-100 text-teal-700 rounded">
                                    CURRENT
                                  </span>
                                )}
                                {isDesired && (
                                  <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-cyan-100 text-cyan-700 rounded">
                                    DESIRED
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={goPrevSection}
              disabled={isFirstSection}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <span className="text-xs text-slate-400">
              {currentSection?.name ?? ''}
              {sections.length > 1 && ` (${secIdx + 1}/${sections.length})`}
            </span>

            <button
              onClick={goNextSection}
              disabled={isLastSection}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
