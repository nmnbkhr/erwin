/**
 * `/taiw/frameworks` — TACR projected onto DMBOK2, DCAM and COBIT 2019.
 *
 * The page is `src/frameworks/FrameworkScorecardPage.tsx`; this file loads the data,
 * owns the deliverable buttons and supplies the accent. Everything that would otherwise
 * be a second 400-line copy is shared, and everything TAIW-specific — three frameworks
 * not four, DM07, the seven unmapped sections — comes from the same
 * `taiwProjectionModule()` descriptor the two PDF generators take. The screen and the
 * paper cannot disagree about which frameworks are offered, because there is one object
 * that says.
 *
 * ─── THE ANSWERS KEY, AND WHY IT IS READ THIS WAY ──────────────────────────
 *
 * `usePersistedState('taiw_maturity', …)` is the same call `TradeMaturityAssessment.tsx`
 * makes, so this page reads exactly what that screen wrote, under the active engagement.
 * Reading the bare `taiw_maturity` key is the bug `TCFCapabilityNavigator.tsx` carried —
 * nothing has written it since answers were namespaced per engagement, so the component
 * silently saw an empty object forever and its fabricated badge never rendered. That is
 * D4's fifth D-001 instance and this is how not to repeat it.
 *
 * ─── jsPDF IS BEHIND await import() ────────────────────────────────────────
 *
 * Both generators are loaded on click, not at module scope. A static import here would
 * pull jsPDF into the page chunk, which is what every other deliverable surface in this
 * suite is careful not to do.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import FrameworkScorecardPage from '../../frameworks/FrameworkScorecardPage'
import { taiwProjectionModule, type TaiwAnswers } from '../report/projectionModule'
import { usePersistedState } from '../../engagement/usePersistedState'
import { useReportMeta, REPORT_PROFILES } from '../../engagement/useReportMeta'
import { loadTacrQuestions } from '../data'
import PageSkeleton from '../../components/layout/PageSkeleton'
import type { TacrData } from '../types'

/** teal-600/500, matching the workbench's own accent and REPORT_PROFILES.taiw. */
const TAIW_ACCENT = {
  text: 'text-teal-600',
  button: 'bg-teal-600 hover:bg-teal-700',
  borderL: 'border-l-teal-500',
  link: 'text-teal-600 hover:text-teal-700',
}

/** Base key only — the value is filed under the active engagement. */
const STORAGE_KEY = 'taiw_maturity'

const isAnswerMap = (parsed: unknown): boolean =>
  !!parsed && typeof parsed === 'object' && !Array.isArray(parsed)

export default function TradeFrameworks() {
  const [data, setData] = useState<TacrData | null>(null)
  const [answers] = usePersistedState<TaiwAnswers>(STORAGE_KEY, {}, isAnswerMap)
  const metaFor = useReportMeta(REPORT_PROFILES.taiw)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'error' } | null>(null)

  useEffect(() => {
    loadTacrQuestions().then(setData)
  }, [])

  const categories = useMemo(() => data?.categories ?? [], [data])
  const mod = useMemo(() => taiwProjectionModule(categories), [categories])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  /*
   * An empty result is a legitimate output and the two reasons for one are different
   * facts. "The dataset failed to load" and "nobody has answered anything" produce the
   * same zero rows and mean opposite things; a silent no-op reads as a broken button and
   * sends the user to retry rather than to report the real fault.
   */
  const run = useCallback(
    async (key: string, work: () => Promise<void>) => {
      setBusy(key)
      setMessage(null)
      try {
        await work()
      } catch (e) {
        setMessage({ text: `Could not generate the document: ${(e as Error).message}`, tone: 'error' })
      } finally {
        setBusy(null)
      }
    },
    [],
  )

  const onGenerateScorecard = useCallback(() => {
    void run('scorecard', async () => {
      const [{ buildTaiwScorecardPdf, TAIW_SCORECARD_ARTEFACT_ID }, { saveReport }, { reportFilename }] =
        await Promise.all([
          import('../report/multiFrameworkScorecard'),
          import('../../report/spine'),
          import('../../report/naming'),
        ])
      const meta = metaFor(TAIW_SCORECARD_ARTEFACT_ID)
      saveReport(buildTaiwScorecardPdf({ meta, answers, categories }), reportFilename(meta, 'pdf'))
    })
  }, [run, metaFor, answers, categories])

  const onGenerateAlignment = useCallback(
    (frameworkId: string, code: string) => {
      void run(`alignment:${frameworkId}`, async () => {
        const [{ buildTaiwFrameworkAlignmentPdf, TAIW_ALIGNMENT_ARTEFACT_ID }, { saveReport }, { reportFilename }] =
          await Promise.all([
            import('../report/frameworkAlignment'),
            import('../../report/spine'),
            import('../../report/naming'),
          ])
        const meta = metaFor(TAIW_ALIGNMENT_ARTEFACT_ID)
        // One artefact id, one document per framework — the filename is what separates
        // them, exactly as DGIW's AR-47 does.
        const name = reportFilename(meta, 'pdf').replace(/\.pdf$/, `_${code.toLowerCase()}.pdf`)
        saveReport(buildTaiwFrameworkAlignmentPdf({ meta, answers, categories, frameworkId }), name)
      })
    },
    [run, metaFor, answers, categories],
  )

  if (!data) return <PageSkeleton />

  return (
    <FrameworkScorecardPage
      mod={mod}
      answers={answers}
      accent={TAIW_ACCENT}
      answeredCount={answeredCount}
      totalQuestions={data.totalQuestions ?? 0}
      assessmentHref="/taiw/maturity"
      busy={busy}
      message={message}
      onGenerateScorecard={onGenerateScorecard}
      onGenerateAlignment={onGenerateAlignment}
    />
  )
}
