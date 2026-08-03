import { useState } from 'react'
import { FileText, BarChart3, Presentation, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import {
  generateTradeMaturityPDF, generateTradeCapabilityRegisterCSV, generateTradeRoadmapMarkdown,
  TRADE_MATURITY_ARTEFACT_ID, TRADE_ROADMAP_ARTEFACT_ID, TRADE_REGISTER_ARTEFACT_ID,
  TRADE_CAPABILITY_COUNT,
} from '../utils/tradeReportGenerator'
import { useOrgName } from '../../engagement/useOrgName'
import { useReportMeta, REPORT_PROFILES } from '../../engagement/useReportMeta'
import FrameworkDeliverables from '../../frameworks/FrameworkDeliverables'
import { TAIW_CROSSWALK_FRAMEWORKS, type TacrSpineCategory } from '../projection'
import type { MaturityAnswer } from '../../scoring/maturity'

interface CategoryScore {
  category: string
  current: number
  desired: number
  gap: number
}

/** teal-600, matching REPORT_PROFILES.taiw and the workbench chrome. */
const TAIW_ACCENT = {
  button: 'bg-teal-600 hover:bg-teal-700',
  text: 'text-teal-600',
  link: 'text-teal-600 hover:text-teal-700',
}

interface TradeReportGeneratorProps {
  scores: CategoryScore[]
  overallScore: number
  answeredCategories: number
  totalCategories: number
  /**
   * The raw answers and the category tree, for the two framework deliverables.
   *
   * The three original artefacts read `scores` — category means, already aggregated.
   * A framework projection cannot: it buckets by TACR SECTION, which is a finer unit
   * than a category, so it needs the question-level answers and the tree that says
   * which section each question belongs to. Threaded from the parent rather than
   * re-read here, so this panel and the assessment screen are looking at one object.
   */
  answers: Readonly<Record<string, MaturityAnswer>>
  categories: readonly TacrSpineCategory[]
}

export default function TradeReportGenerator({ scores, overallScore, answeredCategories, totalCategories, answers, categories }: TradeReportGeneratorProps) {
  const [expanded, setExpanded] = useState(false)
  // The client's name lives on the active engagement, not in this component.
  const [orgName, setOrgName] = useOrgName()
  // Engagement identity, date and page chrome for the two spine deliverables.
  // The org name it reads is the same useOrgName() the input below writes to.
  const metaFor = useReportMeta(REPORT_PROFILES.taiw)
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
      await new Promise(r => setTimeout(r, 100))
      if (type === 'pdf') {
        // isDraft is not passed: the generator derives it from assessmentData,
        // which is where it has always been derived.
        generateTradeMaturityPDF(assessmentData, metaFor(TRADE_MATURITY_ARTEFACT_ID))
      } else if (type === 'csv') {
        // The capability REGISTER, not a gap analysis: D-001 was closed by
        // removing the fabricated per-capability scores, so this no longer reads
        // the assessment at all — it exports the 100 authored TCF capabilities.
        generateTradeCapabilityRegisterCSV(metaFor(TRADE_REGISTER_ARTEFACT_ID))
      } else {
        generateTradeRoadmapMarkdown(assessmentData, metaFor(TRADE_ROADMAP_ARTEFACT_ID))
      }
    } finally {
      setGenerating(null)
    }
  }

  /*
   * Separate handler, separate busy key. The three original artefacts are keyed by
   * format ('pdf' / 'csv' / 'markdown'); these two are keyed by what they are, because
   * there are two PDFs here and a shared 'pdf' key would light both spinners.
   */
  const handleFramework = async (which: 'scorecard' | 'alignment') => {
    setGenerating(which)
    try {
      const [{ saveReport }, { reportFilename }] = await Promise.all([
        import('../../report/spine'),
        import('../../report/naming'),
      ])
      if (which === 'scorecard') {
        const gen = await import('../report/multiFrameworkScorecard')
        const meta = metaFor(gen.TAIW_SCORECARD_ARTEFACT_ID)
        saveReport(gen.buildTaiwScorecardPdf({ meta, answers, categories }), reportFilename(meta, 'pdf'))
      } else {
        const gen = await import('../report/frameworkAlignment')
        const meta = metaFor(gen.TAIW_ALIGNMENT_ARTEFACT_ID)
        // DMBOK2 — the one TAIW framework at HIGH structure confidence, matching
        // DGIW's Deliverables.tsx. The other two are generated from the crosswalk
        // page, where the medium-confidence qualification is shown first.
        const name = reportFilename(meta, 'pdf').replace(/\.pdf$/, '_dmbok2.pdf')
        saveReport(
          gen.buildTaiwFrameworkAlignmentPdf({ meta, answers, categories, frameworkId: 'FW-01' }),
          name,
        )
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
          <BarChart3 size={20} className="text-teal-600" />
          <span className="font-semibold text-slate-800">Generate Trade Assessment Report</span>
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
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="e.g., Pakistan Customs, FBR"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-teal-500'}`}
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
              <p className="text-xs text-slate-500 mb-1">Trade Maturity Assessment</p>
              <p className="text-xs text-slate-400 mb-3">18 pages • Radar chart • WCO DM conformity</p>
              <div className="mt-auto">
                <button
                  onClick={() => handleGenerate('pdf')}
                  disabled={generating !== null}
                  className="w-full px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <p className="text-xs text-slate-500 mb-1">TCF Capability Register</p>
              {/* Counted from the dataset, not typed. The old card said 96 — the
                  number of rows the synthesiser happened to emit — against 100
                  real capabilities. */}
              <p className="text-xs text-slate-400 mb-3">{TRADE_CAPABILITY_COUNT} capabilities • Themes, priority, WCO DM</p>
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
                <Presentation size={18} className="text-cyan-500" />
                <span className="font-medium text-slate-700 text-sm">Roadmap</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">Presentation Slides</p>
              <p className="text-xs text-slate-400 mb-3">12 slides • Markdown format</p>
              <div className="mt-auto">
                <button
                  onClick={() => handleGenerate('markdown')}
                  disabled={generating !== null}
                  className="w-full px-3 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generating === 'markdown' ? 'Generating...' : 'Download Markdown'}
                </button>
              </div>
            </div>
          </div>

          <FrameworkDeliverables
            moduleLabel="TAIW"
            frameworkCount={TAIW_CROSSWALK_FRAMEWORKS.length}
            primaryFrameworkCode="DMBOK2"
            crosswalkHref="/taiw/frameworks"
            accent={TAIW_ACCENT}
            busy={generating}
            onGenerateScorecard={() => void handleFramework('scorecard')}
            onGeneratePrimaryAlignment={() => void handleFramework('alignment')}
          />

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
