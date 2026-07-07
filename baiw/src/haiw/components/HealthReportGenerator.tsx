import { useState } from 'react'
import { FileText, BarChart3, Presentation, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import type { HaiwAssessmentAnswer, HaiwCapability } from '../types'

interface HealthReportGeneratorProps {
  answers: HaiwAssessmentAnswer[]
  capabilities: HaiwCapability[]
  answeredCategories: number
  totalCategories: number
}

export default function HealthReportGenerator({ answers, capabilities, answeredCategories, totalCategories }: HealthReportGeneratorProps) {
  const [expanded, setExpanded] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [generating, setGenerating] = useState<string | null>(null)

  const hasData = answeredCategories > 0
  const isComplete = answeredCategories >= totalCategories
  const progress = Math.round((answeredCategories / totalCategories) * 100)

  if (!hasData) return null

  const handleGenerate = async (type: 'pdf' | 'csv' | 'markdown') => {
    const name = orgName.trim() || 'Your Healthcare Organization'
    setGenerating(type)
    try {
      await new Promise(r => setTimeout(r, 100))
      const { generateHealthMaturityPDF, generateHealthGapCSV, generateHealthRoadmapMarkdown } = await import('../utils/healthReportGenerator')
      if (type === 'pdf') generateHealthMaturityPDF(answers, capabilities, undefined, name)
      else if (type === 'csv') generateHealthGapCSV(answers, capabilities)
      else generateHealthRoadmapMarkdown(answers, capabilities, name)
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
          <BarChart3 size={20} className="text-emerald-600" />
          <span className="font-semibold text-slate-800">Generate Your Healthcare Assessment Report</span>
          {!isComplete && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              <AlertTriangle size={12} />
              {progress}% complete
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-100">
          <div className="mt-4 mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="e.g., Aga Khan University Hospital"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* PDF Report */}
            <button
              onClick={() => handleGenerate('pdf')}
              disabled={generating !== null}
              className="flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <FileText size={20} className="text-emerald-600" />
              <div className="text-left">
                <div className="text-sm font-semibold text-emerald-800">
                  {generating === 'pdf' ? 'Generating...' : 'PDF Report'}
                </div>
                <div className="text-xs text-emerald-600">18-page maturity assessment</div>
              </div>
            </button>

            {/* CSV Export */}
            <button
              onClick={() => handleGenerate('csv')}
              disabled={generating !== null}
              className="flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <BarChart3 size={20} className="text-blue-600" />
              <div className="text-left">
                <div className="text-sm font-semibold text-blue-800">
                  {generating === 'csv' ? 'Generating...' : 'Gap Analysis CSV'}
                </div>
                <div className="text-xs text-blue-600">108 capability scores</div>
              </div>
            </button>

            {/* Markdown Roadmap */}
            <button
              onClick={() => handleGenerate('markdown')}
              disabled={generating !== null}
              className="flex items-center gap-3 px-4 py-3 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <Presentation size={20} className="text-violet-600" />
              <div className="text-left">
                <div className="text-sm font-semibold text-violet-800">
                  {generating === 'markdown' ? 'Generating...' : 'Roadmap Slides'}
                </div>
                <div className="text-xs text-violet-600">12-slide markdown</div>
              </div>
            </button>
          </div>

          {!isComplete && (
            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1">
              <AlertTriangle size={12} />
              Complete all {totalCategories} categories for the most accurate report. Currently {answeredCategories}/{totalCategories} done.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
