import { useState, useEffect, useMemo } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useAssessment } from '../context/AssessmentContext'
import { loadBacrQuestions } from '../utils/dataLoader'
import { downloadJSON, downloadPDF } from '../utils/export'
import type { BacrQuestion } from '../types'
import { ChevronLeft, ChevronRight, Download, RotateCcw, FileText, Zap, ClipboardList, Microscope, Mail } from 'lucide-react'
import ReportGenerator from '../components/ReportGenerator'
import QuickAssessment from '../components/QuickAssessment'
import quickData from '../data/quickAssessment.json'

const MATURITY_LABELS = ['', 'Emerging', 'Developing', 'Practicing', 'Innovating', 'Leading']
const MATURITY_DESCRIPTIONS: Record<number, string> = {
  1: 'Ad-hoc, reactive, no formal process. Decisions based on intuition.',
  2: 'Some awareness, basic reporting, initial processes being established.',
  3: 'Documented processes, regular reporting, analytics team in place.',
  4: 'Advanced analytics in production, predictive models, measurable ROI.',
  5: 'AI/ML embedded in operations, real-time decisioning, continuous optimization.',
}

const CATEGORIES = [
  'Business', 'Culture', 'Governance', 'Information', 'Applications',
  'Systems', 'Agility', 'Outcomes', 'Overall Assessment'
]
const QUESTIONS_PER_CATEGORY = 8

export default function MaturityAssessment() {
  const { state, dispatch } = useAssessment()
  const [questions, setQuestions] = useState<BacrQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [assessmentMode, setAssessmentMode] = useState<'select' | 'quick' | 'standard' | 'deep'>('select')
  const [viewMode, setViewMode] = useState<'assessment' | 'results'>(
    state.completed ? 'results' : 'assessment'
  )

  useEffect(() => {
    loadBacrQuestions().then((q) => {
      setQuestions(q)
      setLoading(false)
    })
  }, [])

  const categoryQuestions = useMemo(() => {
    const category = CATEGORIES[state.currentCategory]
    if (!category) return []
    return questions
      .filter((q) => q.category === category)
      .slice(0, QUESTIONS_PER_CATEGORY)
  }, [questions, state.currentCategory])

  // A3: Category progress
  const categoryProgress = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catQuestions = questions.filter((q) => q.category === cat).slice(0, QUESTIONS_PER_CATEGORY)
      const answered = catQuestions.filter((q) => state.answers[q.id]).length
      return { category: cat, answered, total: catQuestions.length }
    })
  }, [questions, state.answers])

  const radarData = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catQuestions = questions.filter((q) => q.category === cat)
      const answered = catQuestions.filter((q) => state.answers[q.id])
      const currentAvg = answered.length > 0
        ? answered.reduce((s, q) => s + (state.answers[q.id]?.currentState || 0), 0) / answered.length
        : 0
      const desiredAvg = answered.length > 0
        ? answered.reduce((s, q) => s + (state.answers[q.id]?.desiredState || 0), 0) / answered.length
        : 0
      return {
        category: cat.length > 12 ? cat.slice(0, 10) + '...' : cat,
        fullName: cat,
        current: Math.round(currentAvg * 10) / 10,
        desired: Math.round(desiredAvg * 10) / 10,
        gap: Math.round((desiredAvg - currentAvg) * 10) / 10,
      }
    })
  }, [questions, state.answers])

  const overallScore = useMemo(() => {
    const scores = radarData.filter((r) => r.current > 0)
    if (scores.length === 0) return 0
    return Math.round((scores.reduce((s, r) => s + r.current, 0) / scores.length) * 10) / 10
  }, [radarData])

  const progress = useMemo(() => {
    const total = CATEGORIES.length * QUESTIONS_PER_CATEGORY
    return Math.round((Object.keys(state.answers).length / total) * 100)
  }, [state.answers])

  const answeredCategoryCount = useMemo(() => {
    return categoryProgress.filter(cp => cp.answered > 0).length
  }, [categoryProgress])

  if (loading) {
    return <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-120px)] animate-pulse" />
  }

  // ── Quick Assessment Mode ──
  if (assessmentMode === 'quick') {
    return (
      <QuickAssessment
        questions={quickData.questions}
        title={quickData.title}
        variant="banking"
        onBack={() => setAssessmentMode('select')}
      />
    )
  }

  // ── Deep mode: contact CTA ──
  if (assessmentMode === 'deep') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Microscope size={48} className="text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Deep Dive Workshop</h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            A half-day facilitated workshop with your leadership team. Produces a detailed implementation plan
            with PKR investment estimates, vendor recommendations, and quick-win identification.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="mailto:info@godai.tech" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
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

  // ── Mode Selector ──
  if (assessmentMode === 'select') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 text-center">Choose Your Assessment Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Quick */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 hover:border-purple-400 transition-colors p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Zap size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Quick</h3>
                <p className="text-xs text-purple-600 font-medium">FREE</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">24 questions</p>
            <p className="text-sm text-slate-600 mb-1">10 minutes</p>
            <p className="text-xs text-slate-400 mb-4">3-page Quick Scan PDF with radar chart, strengths, and gaps</p>
            <div className="mt-auto">
              <button onClick={() => setAssessmentMode('quick')} className="w-full px-4 py-2.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                Start Quick Scan
              </button>
            </div>
          </div>

          {/* Standard */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 hover:border-blue-400 transition-colors p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ClipboardList size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Standard</h3>
                <p className="text-xs text-blue-600 font-medium">FULL REPORT</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">793 questions (BACR)</p>
            <p className="text-sm text-slate-600 mb-1">45 minutes</p>
            <p className="text-xs text-slate-400 mb-4">18-page PDF, CSV gap analysis, roadmap with PKR estimates</p>
            <div className="mt-auto">
              <button onClick={() => setAssessmentMode('standard')} className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
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
            <p className="text-xs text-slate-400 mb-4">Detailed plan with vendor recommendations and quick wins</p>
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

  // ── Standard Assessment Mode (existing) ──
  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
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
            className={`px-4 py-2 text-sm rounded-lg ${
              viewMode === 'assessment' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Assessment Mode
          </button>
          <button
            onClick={() => setViewMode('results')}
            className={`px-4 py-2 text-sm rounded-lg ${
              viewMode === 'results' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Results
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Progress: {progress}%</span>
          <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {viewMode === 'assessment' ? (
        <div className="flex gap-6">
          {/* A3: Category Progress Stepper */}
          <div className="w-[220px] shrink-0 bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Categories</h3>
            <div className="space-y-1">
              {categoryProgress.map((cp, i) => {
                const isActive = i === state.currentCategory
                const isComplete = cp.answered === cp.total && cp.total > 0
                const hasProgress = cp.answered > 0 && !isComplete
                return (
                  <button
                    key={cp.category}
                    onClick={() => dispatch({ type: 'SET_CATEGORY', payload: i })}
                    className={`w-full text-left px-3 py-2 text-xs rounded flex items-center gap-2 ${
                      isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      isComplete ? 'bg-green-500 text-white' :
                      hasProgress ? 'bg-blue-500 text-white' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {isComplete ? '✓' : hasProgress ? '·' : ''}
                    </span>
                    <span className="truncate">{cp.category}</span>
                    {cp.answered > 0 && (
                      <span className="ml-auto text-xs text-slate-400">{cp.answered}/{cp.total}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Questions panel */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => dispatch({ type: 'SET_CATEGORY', payload: Math.max(0, state.currentCategory - 1) })}
                disabled={state.currentCategory === 0}
                className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-800">
                  {CATEGORIES[state.currentCategory]}
                </h2>
                <p className="text-xs text-slate-400">
                  Category {state.currentCategory + 1} of {CATEGORIES.length}
                </p>
              </div>
              <button
                onClick={() => {
                  if (state.currentCategory === CATEGORIES.length - 1) {
                    dispatch({ type: 'COMPLETE' })
                    setViewMode('results')
                  } else {
                    dispatch({ type: 'SET_CATEGORY', payload: state.currentCategory + 1 })
                  }
                }}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {categoryQuestions.map((q) => {
                const answer = state.answers[q.id]
                return (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 mb-4">{q.text}</p>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">
                          Current State: <span className="font-medium text-blue-600">{MATURITY_LABELS[answer?.currentState || 0] || 'Not rated'}</span>
                        </label>
                        <input
                          type="range" min={1} max={5}
                          value={answer?.currentState || 1}
                          onChange={(e) =>
                            dispatch({
                              type: 'SET_ANSWER',
                              payload: { questionId: q.id, currentState: Number(e.target.value), desiredState: answer?.desiredState || 3 },
                            })
                          }
                          className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          {[1, 2, 3, 4, 5].map((v) => <span key={v}>{v}</span>)}
                        </div>
                        {/* A1: Level Description */}
                        {answer?.currentState && (
                          <p className="text-xs text-blue-600 mt-2 italic leading-tight">{MATURITY_DESCRIPTIONS[answer.currentState]}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block">
                          Desired State: <span className="font-medium text-emerald-600">{MATURITY_LABELS[answer?.desiredState || 0] || 'Not rated'}</span>
                        </label>
                        <input
                          type="range" min={1} max={5}
                          value={answer?.desiredState || 3}
                          onChange={(e) =>
                            dispatch({
                              type: 'SET_ANSWER',
                              payload: { questionId: q.id, currentState: answer?.currentState || 1, desiredState: Number(e.target.value) },
                            })
                          }
                          className="w-full accent-emerald-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          {[1, 2, 3, 4, 5].map((v) => <span key={v}>{v}</span>)}
                        </div>
                        {/* A1: Level Description */}
                        {answer?.desiredState && (
                          <p className="text-xs text-emerald-600 mt-2 italic leading-tight">{MATURITY_DESCRIPTIONS[answer.desiredState]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div id="page-maturity-results" className="space-y-6">
          {/* Radar Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-700">Maturity Radar</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadJSON({ answers: state.answers, radarData, overallScore }, 'baiw-assessment.json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Download size={14} /> JSON
                </button>
                <button
                  onClick={() => downloadPDF('page-maturity-results', 'baiw-assessment', 'BAIW Maturity Assessment')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  onClick={() => { dispatch({ type: 'RESET' }); setViewMode('assessment') }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Radar name="Current" dataKey="current" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
                <Radar name="Desired" dataKey="desired" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
              <p className="text-sm text-slate-500 mb-2">Overall Maturity Score</p>
              <p className="text-5xl font-bold text-blue-600">{overallScore}</p>
              <p className="text-sm text-slate-400 mt-1">{MATURITY_LABELS[Math.round(overallScore)] || 'Not assessed'}</p>
            </div>

            {/* A2: Heat Map with Gap column */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-base font-semibold text-slate-700 mb-4">Score Heat Map</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-4 text-xs text-slate-500 font-medium">
                  <span>Category</span>
                  <span className="text-center">Current</span>
                  <span className="text-center">Desired</span>
                  <span className="text-center">Gap</span>
                </div>
                {radarData.map((r) => {
                  const curColor = r.current <= 1 ? 'bg-red-600' : r.current <= 2 ? 'bg-orange-500' : r.current <= 3 ? 'bg-amber-500' : r.current <= 4 ? 'bg-green-400' : 'bg-green-600'
                  const desColor = r.desired <= 1 ? 'bg-red-600' : r.desired <= 2 ? 'bg-orange-500' : r.desired <= 3 ? 'bg-amber-500' : r.desired <= 4 ? 'bg-green-400' : 'bg-green-600'
                  const gapColor = r.gap >= 2 ? 'bg-red-500' : r.gap >= 1 ? 'bg-amber-500' : 'bg-green-500'
                  return (
                    <div key={r.fullName} className="grid grid-cols-4 items-center text-xs">
                      <span className="text-slate-600 truncate">{r.fullName}</span>
                      <div className="flex justify-center">
                        <span className={`w-9 h-8 rounded flex items-center justify-center text-white font-medium ${curColor}`}>{r.current}</span>
                      </div>
                      <div className="flex justify-center">
                        <span className={`w-9 h-8 rounded flex items-center justify-center text-white font-medium ${desColor}`}>{r.desired}</span>
                      </div>
                      <div className="flex justify-center">
                        <span className={`w-9 h-8 rounded flex items-center justify-center text-white font-medium ${gapColor}`}>{r.gap}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Gap Analysis Table */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Gap Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Category</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">Current Avg</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">Desired Avg</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">Gap</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {[...radarData].sort((a, b) => b.gap - a.gap).map((r) => (
                    <tr key={r.fullName} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700">{r.fullName}</td>
                      <td className="px-4 py-3 text-center text-blue-600 font-medium">{r.current}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-medium">{r.desired}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.gap >= 2 ? 'bg-red-100 text-red-700' : r.gap >= 1 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>{r.gap}</span>
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
          <ReportGenerator
            scores={radarData.map(r => ({ category: r.fullName, current: r.current, desired: r.desired, gap: r.gap }))}
            overallScore={overallScore}
            answeredCategories={answeredCategoryCount}
            totalCategories={CATEGORIES.length}
          />
        </div>
      )}
    </div>
  )
}
