import { useState } from 'react'
import { FileText, BarChart3, Presentation, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import type { HaiwAssessmentAnswer, HaiwCapability, HacrQuestion } from '../types'
import { useOrgName } from '../../engagement/useOrgName'
import { useReportMeta, REPORT_PROFILES } from '../../engagement/useReportMeta'

interface HealthReportGeneratorProps {
  answers: HaiwAssessmentAnswer[]
  capabilities: HaiwCapability[]
  /**
   * The HACR question bank the parent already loaded.
   *
   * Threaded through rather than loaded here: the generator needs `capabilityLinks`
   * and `weight` to score a capability from the questions that assess it, and
   * `hacrQuestions.json` is 1.18 MB that `HealthMaturityAssessment` is already
   * holding to render the assessment itself.
   */
  questions: HacrQuestion[]
  /**
   * True when `capabilities.json` failed to load — distinct from an empty array,
   * which also means "still loading". D-008: the generators used to synthesise
   * plausible rows from the empty array, so a failed fetch produced a deliverable
   * instead of an error. They now emit nothing, and this is what lets the panel
   * say why.
   */
  capabilitiesFailed: boolean
  answeredCategories: number
  totalCategories: number
}

export default function HealthReportGenerator({ answers, capabilities, capabilitiesFailed, questions, answeredCategories, totalCategories }: HealthReportGeneratorProps) {
  const [expanded, setExpanded] = useState(false)
  // The client's name lives on the active engagement, not in this component.
  const [orgName, setOrgName] = useOrgName()
  // Engagement identity, date and page chrome for the two spine deliverables.
  // The org name it reads is the same useOrgName() the input below writes to.
  const metaFor = useReportMeta(REPORT_PROFILES.haiw)
  const [generating, setGenerating] = useState<string | null>(null)
  /** Set when a download produced no file, so the button never fails silently. */
  const [failure, setFailure] = useState<string | null>(null)

  const hasData = answeredCategories > 0
  const isComplete = answeredCategories >= totalCategories
  const progress = Math.round((answeredCategories / totalCategories) * 100)

  if (!hasData) return null

  const handleGenerate = async (type: 'pdf' | 'csv' | 'markdown') => {
    setGenerating(type)
    setFailure(null)
    try {
      await new Promise(r => setTimeout(r, 100))
      // The artefact ids come out of the dynamic import too. Importing them at
      // the top of this file would pull healthReportGenerator — and with it
      // jsPDF — into the page chunk, which is the whole reason this import is
      // here rather than up there.
      const gen = await import('../utils/healthReportGenerator')
      if (type === 'pdf') {
        // isDraft is not passed: the generator derives it from the answers, which
        // is where it has always been derived. See the note on reportMeta there.
        gen.generateHealthMaturityPDF(answers, capabilities, questions, undefined, metaFor(gen.HEALTH_MATURITY_ARTEFACT_ID))
      } else if (type === 'csv') {
        // On src/report/csv.ts since 2026-08-01 — it was the last hand-rolled CSV
        // in the suite. It shares the PDF's capability scoring, so the two cannot
        // disagree, and it keeps the -GAP id because HAIW's gap column is real.
        //
        // D-008: returns false and writes NOTHING when the capability dataset is
        // unavailable. It used to invent 108 rows instead. A silent no-op reads as
        // a broken button, so the failure is surfaced rather than swallowed.
        const written = gen.generateHealthGapCSV(answers, capabilities, questions, metaFor(gen.HEALTH_GAP_ARTEFACT_ID))
        if (!written) {
          setFailure(
            'No file was written: the HCF capability dataset could not be loaded, so there are ' +
            'no capabilities to export. Reload the page to try again. Nothing has been saved and ' +
            'your answers are unaffected.',
          )
        }
      } else {
        // `questions` is passed since D4: category scoring is built from the
        // question universe, not the answer set, so that an unanswered category
        // reads NOT ASSESSED rather than 0.0.
        gen.generateHealthRoadmapMarkdown(answers, capabilities, questions, metaFor(gen.HEALTH_ROADMAP_ARTEFACT_ID))
      }
    } catch (err) {
      // Previously any throw here vanished into `finally` and the user saw the
      // spinner stop with no file and no explanation.
      console.error('[haiw] report generation failed', err)
      setFailure(err instanceof Error ? `Report generation failed: ${err.message}` : 'Report generation failed.')
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

          {/*
            D-008. Warn BEFORE the buttons, not after a click. The capability
            dataset drives page 13 of the PDF and the whole CSV; both used to
            invent rows when it was missing, so the user had no way to know.
          */}
          {capabilitiesFailed && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                <span className="font-semibold">The HCF capability dataset failed to load.</span>{' '}
                The Gap Analysis CSV cannot be produced, and the capability page of the PDF will
                be empty and say so. Category maturity — the radar, the scorecard and the eight
                deep dives — is unaffected, and your answers are safe. Reload the page to retry.
              </div>
            </div>
          )}

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
              // Disabled rather than left clickable to write nothing: the export
              // has no rows without the dataset. D-008.
              disabled={generating !== null || capabilities.length === 0}
              className="flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 size={20} className="text-blue-600" />
              <div className="text-left">
                <div className="text-sm font-semibold text-blue-800">
                  {generating === 'csv' ? 'Generating...' : 'Gap Analysis CSV'}
                </div>
                {/* Counted from the data — it was a hardcoded "108" that would
                    have kept claiming 108 while the export produced nothing. */}
                <div className="text-xs text-blue-600">
                  {capabilities.length > 0 ? `${capabilities.length} capability scores` : 'Capability data unavailable'}
                </div>
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

          {/* A download that produced no file, explained. See D-008. */}
          {failure && (
            <div role="alert" className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{failure}</p>
            </div>
          )}

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
