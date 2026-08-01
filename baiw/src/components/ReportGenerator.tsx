import { useState } from 'react'
import { FileText, BarChart3, Presentation, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import {
  generateMaturityPDF, generateCapabilityRegisterCSV, generateRoadmapMarkdown,
  MATURITY_ARTEFACT_ID, ROADMAP_ARTEFACT_ID, REGISTER_ARTEFACT_ID, CAPABILITY_COUNT,
} from '../utils/reportGenerator'
import { useOrgName } from '../engagement/useOrgName'
import { useReportMeta, REPORT_PROFILES } from '../engagement/useReportMeta'

interface CategoryScore {
  category: string
  current: number
  desired: number
  gap: number
}

interface ReportGeneratorProps {
  scores: CategoryScore[]
  overallScore: number
  answeredCategories: number
  totalCategories: number
}

export default function ReportGenerator({ scores, overallScore, answeredCategories, totalCategories }: ReportGeneratorProps) {
  const [expanded, setExpanded] = useState(false)
  // The client's name lives on the active engagement, not in this component.
  const [bankName, setBankName] = useOrgName()
  // Engagement identity, date and page chrome for the two spine deliverables.
  // The org name it reads is the same useOrgName() the input below writes to,
  // and REPORT_PROFILES.baiw.orgFallback carries the 'Your Bank' default this
  // handler used to compute inline.
  const metaFor = useReportMeta(REPORT_PROFILES.baiw)
  const [generating, setGenerating] = useState<string | null>(null)

  const hasData = answeredCategories > 0
  const isComplete = answeredCategories >= totalCategories
  const progress = Math.round((answeredCategories / totalCategories) * 100)

  if (!hasData) return null

  const assessmentData = {
    scores,
    overallScore,
    answeredCategories,
    totalCategories,
  }

  const handleGenerate = async (type: 'pdf' | 'csv' | 'markdown') => {
    setGenerating(type)
    try {
      // Small delay to show loading state
      await new Promise(r => setTimeout(r, 100))
      if (type === 'pdf') {
        // isDraft is not passed: the generator derives it from assessmentData,
        // which is where it has always been derived.
        generateMaturityPDF(assessmentData, metaFor(MATURITY_ARTEFACT_ID))
      } else if (type === 'csv') {
        // The capability REGISTER, not a gap analysis: D-001 was closed by
        // removing the fabricated per-capability scores, so this no longer reads
        // the assessment at all — it exports the 112 authored BVF capabilities.
        generateCapabilityRegisterCSV(metaFor(REGISTER_ARTEFACT_ID))
      } else {
        generateRoadmapMarkdown(assessmentData, metaFor(ROADMAP_ARTEFACT_ID))
      }
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-purple-600" />
          <span className="font-semibold text-slate-800">Generate Your Assessment Report</span>
          {!isComplete && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">DRAFT</span>
          )}
        </div>
        {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4">
          {/* Organization name */}
          <div className="mb-4">
            <label className="text-sm text-slate-600 mb-1 block">Organization Name</label>
            <input
              type="text"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              placeholder="e.g., United Bank Limited"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-500">Assessment: {answeredCategories} of {totalCategories} categories scored</span>
              <span className="text-sm font-medium text-slate-700">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-purple-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Report cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* PDF Report */}
            <div className="border border-slate-200 rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-red-500" />
                <span className="font-medium text-slate-700 text-sm">PDF Report</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">Maturity Assessment</p>
              <p className="text-xs text-slate-400 mb-3">18 pages • Radar chart • Benchmarks</p>
              <div className="mt-auto">
                <button
                  onClick={() => handleGenerate('pdf')}
                  disabled={generating !== null}
                  className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generating === 'pdf' ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            </div>

            {/* CSV capability register — not a gap analysis; see D-001. */}
            <div className="border border-slate-200 rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={18} className="text-green-500" />
                <span className="font-medium text-slate-700 text-sm">CSV Export</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">BVF Capability Register</p>
              {/* Counted from the dataset rather than typed: the card next door
                  in SuiteLanding.tsx has drifted from its data three times. */}
              <p className="text-xs text-slate-400 mb-3">{CAPABILITY_COUNT} capabilities • Themes, phases, FSDM</p>
              <div className="mt-auto">
                <button
                  onClick={() => handleGenerate('csv')}
                  disabled={generating !== null}
                  className="w-full px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generating === 'csv' ? 'Generating...' : 'Download CSV'}
                </button>
              </div>
            </div>

            {/* Roadmap Markdown */}
            <div className="border border-slate-200 rounded-lg p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Presentation size={18} className="text-blue-500" />
                <span className="font-medium text-slate-700 text-sm">Roadmap</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">Presentation Slides</p>
              <p className="text-xs text-slate-400 mb-3">12 slides • Markdown format</p>
              <div className="mt-auto">
                <button
                  onClick={() => handleGenerate('markdown')}
                  disabled={generating !== null}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generating === 'markdown' ? 'Generating...' : 'Download Markdown'}
                </button>
              </div>
            </div>
          </div>

          {/* Warning for incomplete assessment */}
          {!isComplete && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Complete all {totalCategories} categories for the full report. Partial assessments generate draft reports with a DRAFT watermark.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
