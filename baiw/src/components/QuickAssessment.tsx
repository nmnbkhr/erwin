import { useState, useMemo, useCallback } from 'react'
import { Zap, ChevronDown, ChevronUp, Download, RotateCcw } from 'lucide-react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip,
} from 'recharts'
import { generateQuickPDF } from '../utils/quickPdfGenerator'
import { useOrgName } from '../engagement/useOrgName'

interface QuickQuestion {
  id: string
  category: string
  questionText: string
  levelDescriptions: Record<string, string>
}

interface QuickAssessmentProps {
  questions: QuickQuestion[]
  title: string
  /** 'banking' for BAIW (purple), 'trade' for TAIW (teal) */
  variant: 'banking' | 'trade'
  onBack: () => void
}

const MATURITY_LABELS: Record<number, string> = {
  1: 'Initial', 2: 'Developing', 3: 'Defined', 4: 'Managed', 5: 'Optimizing',
}

export default function QuickAssessment({ questions, title, variant, onBack }: QuickAssessmentProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  // The client's name lives on the active engagement, not in this component.
  const [orgName, setOrgName] = useOrgName()
  const [showResults, setShowResults] = useState(false)
  const [expandedQ, setExpandedQ] = useState<Record<string, boolean>>({})

  const isTeal = variant === 'trade'
  const accent = isTeal ? 'teal' : 'purple'
  const accentFill = isTeal ? '#0d9488' : '#7c3aed'
  const accentFill2 = isTeal ? '#06b6d4' : '#2563eb'

  const categories = useMemo(() => {
    const cats: string[] = []
    questions.forEach(q => { if (!cats.includes(q.category)) cats.push(q.category) })
    return cats
  }, [questions])

  const answeredCount = Object.keys(answers).length
  const progress = Math.round((answeredCount / questions.length) * 100)

  const radarData = useMemo(() => {
    return categories.map(cat => {
      const catQs = questions.filter(q => q.category === cat)
      const answered = catQs.filter(q => answers[q.id])
      const avg = answered.length > 0
        ? answered.reduce((s, q) => s + (answers[q.id] || 0), 0) / answered.length
        : 0
      return {
        category: cat.length > 14 ? cat.slice(0, 12) + '...' : cat,
        fullName: cat,
        current: Math.round(avg * 10) / 10,
      }
    })
  }, [categories, questions, answers])

  const overallScore = useMemo(() => {
    const scored = radarData.filter(r => r.current > 0)
    if (scored.length === 0) return 0
    return Math.round((scored.reduce((s, r) => s + r.current, 0) / scored.length) * 10) / 10
  }, [radarData])

  const setAnswer = useCallback((qid: string, value: number) => {
    setAnswers(prev => ({ ...prev, [qid]: value }))
  }, [])

  const handleComplete = () => {
    setShowResults(true)
  }

  const handleReset = () => {
    setAnswers({})
    setShowResults(false)
  }

  const handleDownloadPDF = () => {
    const name = orgName.trim() || (isTeal ? 'Pakistan Customs' : 'Your Bank')
    generateQuickPDF(radarData, overallScore, name, variant)
  }

  if (showResults) {
    const sorted = [...radarData].sort((a, b) => b.current - a.current)
    const strengths = sorted.filter(r => r.current > 0).slice(0, 3)
    const gaps = [...sorted].filter(r => r.current > 0).reverse().slice(0, 3)

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={20} className={`text-${accent}-500`} />
            <h2 className="text-lg font-semibold text-slate-800">Quick Scan Results</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadPDF} className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-${accent}-600 text-white hover:bg-${accent}-700`}>
              <Download size={14} /> Download PDF
            </button>
            <button onClick={handleReset} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={onBack} className="px-4 py-2 text-sm rounded-lg bg-white text-slate-600 hover:bg-slate-50 border border-slate-200">
              Back
            </button>
          </div>
        </div>

        {/* Org Name for PDF */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="text-sm text-slate-600 mb-1 block">Organization Name (for PDF)</label>
          <input
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder={isTeal ? 'e.g., Pakistan Customs, FBR' : 'e.g., United Bank Limited'}
            className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-${accent}-500 focus:border-transparent`}
          />
        </div>

        {/* Score + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center">
            <p className="text-sm text-slate-500 mb-2">Overall Score</p>
            <p className={`text-5xl font-bold`} style={{ color: accentFill }}>{overallScore}</p>
            <p className="text-lg text-slate-500 mt-1">/ 5.0</p>
            <p className="text-sm text-slate-400 mt-2">{MATURITY_LABELS[Math.round(overallScore)] || 'Not assessed'}</p>
          </div>
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">Maturity Radar</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 11 }} tickCount={6} />
                <Radar name="Your Score" dataKey="current" stroke={accentFill} fill={accentFill} fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strengths & Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-green-600 mb-4">Top Strengths</h3>
            {strengths.map((s, i) => (
              <div key={s.fullName} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{i + 1}. {s.fullName}</span>
                <span className="text-sm font-medium text-green-600">{s.current}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-red-600 mb-4">Top Gaps</h3>
            {gaps.map((g, i) => (
              <div key={g.fullName} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{i + 1}. {g.fullName}</span>
                <span className="text-sm font-medium text-red-600">{g.current}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={`bg-gradient-to-r ${isTeal ? 'from-teal-50 to-cyan-50 border-teal-200' : 'from-purple-50 to-blue-50 border-purple-200'} rounded-lg border p-6 text-center`}>
          <p className="text-base font-semibold text-slate-800 mb-2">Want the full picture?</p>
          <p className="text-sm text-slate-600 mb-4">
            Take the Standard Assessment ({isTeal ? '640' : '793'} questions) for a comprehensive 18-page report with capability gaps, roadmap, and investment estimates.
          </p>
          <button onClick={onBack} className={`px-6 py-2.5 bg-${accent}-600 text-white rounded-lg text-sm font-medium hover:bg-${accent}-700`}>
            Take Standard Assessment
          </button>
        </div>
      </div>
    )
  }

  // ── Question Flow ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap size={20} className={`text-${accent}-500`} />
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <span className={`text-xs px-2 py-0.5 rounded bg-${accent}-100 text-${accent}-700`}>10 min</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{answeredCount} / {questions.length}</span>
          <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full bg-${accent}-500 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }} />
          </div>
          <span className={`text-sm font-medium text-${accent}-600`}>{progress}%</span>
          <button onClick={onBack} className="ml-2 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg">
            Back
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => {
          const val = answers[q.id] || 0
          const isExpanded = expandedQ[q.id] ?? false
          return (
            <div key={q.id} className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${val > 0 ? `bg-${accent}-100 text-${accent}-700` : 'bg-slate-100 text-slate-400'}`}>
                  {qi + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 leading-relaxed">{q.questionText}</p>
                  <p className="text-xs text-slate-400 mt-1">{q.category}</p>
                </div>
              </div>

              {/* Slider */}
              <div className="pl-10">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={val || 3}
                    onChange={(e) => setAnswer(q.id, Number(e.target.value))}
                    className={`flex-1 accent-${accent}-600`}
                  />
                  <span className={`text-sm font-medium w-28 text-${accent}-600`}>
                    {val > 0 ? `${val} - ${MATURITY_LABELS[val]}` : 'Not rated'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1 pr-32">
                  {[1, 2, 3, 4, 5].map(v => <span key={v}>{v}</span>)}
                </div>

                {/* Expandable level descriptions */}
                <button
                  onClick={() => setExpandedQ(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                  className={`mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-${accent}-600 transition-colors`}
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
                        <div key={level} className={`flex gap-2 text-xs rounded-md px-2 py-1.5 ${isSelected ? `bg-${accent}-50 ring-1 ring-${accent}-200` : ''}`}>
                          <span className={`font-medium shrink-0 w-14 ${isSelected ? `text-${accent}-700` : `text-${accent}-600`}`}>
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

      {/* Complete Button */}
      {answeredCount > 0 && (
        <div className="text-center py-4">
          <button
            onClick={handleComplete}
            className={`px-8 py-3 bg-${accent}-600 text-white rounded-lg text-sm font-medium hover:bg-${accent}-700 transition-colors`}
          >
            View Results ({answeredCount}/{questions.length} answered)
          </button>
        </div>
      )}
    </div>
  )
}
