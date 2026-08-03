/**
 * `/haiw/frameworks` — HACR projected onto DMBOK2, DCAM, DGI and COBIT 2019.
 *
 * The page is `src/frameworks/FrameworkScorecardPage.tsx`; this file loads the data,
 * owns the deliverable buttons and supplies the accent. See
 * `src/taiw/components/TradeFrameworks.tsx` for the full note on the shared page and on
 * why jsPDF is behind `await import()`.
 *
 * ─── THE ONE THING THIS PAGE MUST NOT DO QUIETLY ───────────────────────────
 *
 * All four frameworks reach 100% of themselves here. That number is genuinely correct
 * and genuinely misleading, and `HACR_INSTRUMENT_DISCLOSURE` is passed as the
 * descriptor's `headlineDisclosure` so the shared page renders it FIRST, in body weight,
 * above every figure it qualifies. Nine template stems over 720 questions is a property
 * of how the question bank was generated, not evidence of depth, and a reader who works
 * that out after quoting the page has been misled by placement whatever the small print
 * said.
 *
 * ─── QUESTIONS ARE PASSED, NOT IMPORTED ────────────────────────────────────
 *
 * `hacrQuestions.json` is 1.18 MB. This page loads it (it has to — the spine is derived
 * from it) and hands the projection a `HacrSpineQuestion[]`. Neither `projectionModule`
 * nor either generator imports the bank, which keeps a second copy out of the report
 * chunk. Same contract `healthReportGenerator.ts` keeps.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import FrameworkScorecardPage from '../../frameworks/FrameworkScorecardPage'
import { haiwProjectionModule, type HaiwAnswers } from '../report/projectionModule'
import type { HacrSpineQuestion } from '../projection'
import { HACR_ANSWERS_KEY } from '../hacr'
import { usePersistedState } from '../../engagement/usePersistedState'
import { useReportMeta, REPORT_PROFILES } from '../../engagement/useReportMeta'
import { loadHacrQuestions } from '../data'
import PageSkeleton from '../../components/layout/PageSkeleton'
import type { HacrData } from '../types'

/** emerald-500/600, matching the workbench's own accent and REPORT_PROFILES.haiw. */
const HAIW_ACCENT = {
  text: 'text-emerald-600',
  button: 'bg-emerald-600 hover:bg-emerald-700',
  borderL: 'border-l-emerald-500',
  link: 'text-emerald-600 hover:text-emerald-700',
}

const isAnswerMap = (parsed: unknown): boolean =>
  !!parsed && typeof parsed === 'object' && !Array.isArray(parsed)

export default function HealthFrameworks() {
  const [data, setData] = useState<HacrData | null>(null)
  const [answers] = usePersistedState<HaiwAnswers>(HACR_ANSWERS_KEY, {}, isAnswerMap)
  const metaFor = useReportMeta(REPORT_PROFILES.haiw)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'error' } | null>(null)

  useEffect(() => {
    loadHacrQuestions().then(setData)
  }, [])

  /*
   * Flattened back to a question list, and narrowed to the three fields the projection
   * reads. `loadHacrQuestions` groups the flat file into categories → sections for the
   * assessment screen; the spine is derived from `id` and `subcategory`, so this is the
   * honest projection rather than passing the whole record through.
   */
  const questions: HacrSpineQuestion[] = useMemo(
    () =>
      (data?.categories ?? []).flatMap((c) =>
        c.sections.flatMap((s) =>
          s.questions.map((q) => ({ id: q.id, category: q.category, subcategory: q.subcategory })),
        ),
      ),
    [data],
  )

  const mod = useMemo(() => haiwProjectionModule(questions), [questions])
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const run = useCallback(async (key: string, work: () => Promise<void>) => {
    setBusy(key)
    setMessage(null)
    try {
      await work()
    } catch (e) {
      setMessage({ text: `Could not generate the document: ${(e as Error).message}`, tone: 'error' })
    } finally {
      setBusy(null)
    }
  }, [])

  const onGenerateScorecard = useCallback(() => {
    void run('scorecard', async () => {
      const [{ buildHaiwScorecardPdf, HAIW_SCORECARD_ARTEFACT_ID }, { saveReport }, { reportFilename }] =
        await Promise.all([
          import('../report/multiFrameworkScorecard'),
          import('../../report/spine'),
          import('../../report/naming'),
        ])
      const meta = metaFor(HAIW_SCORECARD_ARTEFACT_ID)
      saveReport(buildHaiwScorecardPdf({ meta, answers, questions }), reportFilename(meta, 'pdf'))
    })
  }, [run, metaFor, answers, questions])

  const onGenerateAlignment = useCallback(
    (frameworkId: string, code: string) => {
      void run(`alignment:${frameworkId}`, async () => {
        const [{ buildHaiwFrameworkAlignmentPdf, HAIW_ALIGNMENT_ARTEFACT_ID }, { saveReport }, { reportFilename }] =
          await Promise.all([
            import('../report/frameworkAlignment'),
            import('../../report/spine'),
            import('../../report/naming'),
          ])
        const meta = metaFor(HAIW_ALIGNMENT_ARTEFACT_ID)
        const name = reportFilename(meta, 'pdf').replace(/\.pdf$/, `_${code.toLowerCase()}.pdf`)
        saveReport(buildHaiwFrameworkAlignmentPdf({ meta, answers, questions, frameworkId }), name)
      })
    },
    [run, metaFor, answers, questions],
  )

  if (!data) return <PageSkeleton />

  return (
    <FrameworkScorecardPage
      mod={mod}
      answers={answers}
      accent={HAIW_ACCENT}
      answeredCount={answeredCount}
      totalQuestions={data.totalQuestions ?? 0}
      assessmentHref="/haiw/maturity"
      busy={busy}
      message={message}
      onGenerateScorecard={onGenerateScorecard}
      onGenerateAlignment={onGenerateAlignment}
    />
  )
}
