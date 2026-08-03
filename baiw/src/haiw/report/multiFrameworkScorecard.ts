/**
 * HAIW multi-framework scorecard — four published frameworks, one HACR assessment.
 *
 * The document is `src/frameworks/report/projectionReports.ts`; this file is the
 * artefact id and the binding.
 *
 * THIS IS THE DELIVERABLE THE INSTRUMENT DISCLOSURE EXISTS FOR. Four frameworks each
 * reaching 100% of themselves, printed side by side, is the most persuasive page in the
 * suite and the most misleading one available — so `haiwProjectionModule` passes the
 * disclosure as `headlineDisclosure`, and the shared generator renders it directly under
 * the title, above the comparison table, in body weight. CLAUDE.md's rule is that any
 * HAIW deliverable rendering a framework scorecard must carry that sentence beside it;
 * putting it in the descriptor rather than in this file is how the page and the two PDFs
 * carry one copy of it.
 */
import type jsPDF from 'jspdf'
import { buildProjectionScorecardPdf } from '../../frameworks/report/projectionReports'
import type { ReportMeta } from '../../report/types'
import type { HacrSpineQuestion } from '../projection'
import { haiwProjectionModule, type HaiwAnswers } from './projectionModule'

export const HAIW_SCORECARD_ARTEFACT_ID = 'MR-HAIW-SCORECARD'

export interface HaiwScorecardInput {
  meta: ReportMeta
  answers: HaiwAnswers
  questions: readonly HacrSpineQuestion[]
}

export function buildHaiwScorecardPdf(input: HaiwScorecardInput): jsPDF {
  const { meta, answers, questions } = input
  return buildProjectionScorecardPdf(haiwProjectionModule(questions), { meta, answers })
}
