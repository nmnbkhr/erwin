/**
 * HAIW framework alignment — "how this HACR assessment satisfies <framework>".
 *
 * The document is `src/frameworks/report/projectionReports.ts`; this file is the
 * artefact id and the binding. `src/taiw/report/frameworkAlignment.ts` carries the full
 * note on why the id is `MR-` rather than `AR-`, and on why declaring
 * `src/haiw/report` as a report source is what makes ARTEFACT-IMPL apply here at all.
 *
 * FOUR DOCUMENTS FROM ONE ID, where TAIW produces three. DGI is offered here because it
 * reaches 100% of itself on HACR; that contrast is stated in `HAIW_CAVEATS` rather than
 * left as an unexplained difference between two sibling modules.
 */
import type jsPDF from 'jspdf'
import { buildProjectionAlignmentPdf } from '../../frameworks/report/projectionReports'
import type { ReportMeta } from '../../report/types'
import type { HacrSpineQuestion } from '../projection'
import { haiwProjectionModule, type HaiwAnswers } from './projectionModule'

export const HAIW_ALIGNMENT_ARTEFACT_ID = 'MR-HAIW-ALIGNMENT'

export interface HaiwAlignmentInput {
  meta: ReportMeta
  answers: HaiwAnswers
  /** The question bank — see projectionModule.ts on why it is a parameter. */
  questions: readonly HacrSpineQuestion[]
  frameworkId: string
}

export function buildHaiwFrameworkAlignmentPdf(input: HaiwAlignmentInput): jsPDF {
  const { meta, answers, questions, frameworkId } = input
  return buildProjectionAlignmentPdf(haiwProjectionModule(questions), { meta, answers, frameworkId })
}
