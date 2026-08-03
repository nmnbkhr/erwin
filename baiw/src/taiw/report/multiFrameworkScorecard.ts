/**
 * TAIW multi-framework scorecard — three published frameworks, one TACR assessment.
 *
 * The document is `src/frameworks/report/projectionReports.ts`; this file is the
 * artefact id and the binding. See `frameworkAlignment.ts` for why the id is `MR-` and
 * why the generator is shared.
 *
 * THREE, NOT FOUR, AND THE PAGE SAYS SO. DGI is absent from
 * `TAIW_CROSSWALK_FRAMEWORKS` because it reaches 59% of itself on TACR, and
 * `TAIW_CAVEATS` carries that finding onto every page of this document. A scorecard
 * quietly showing three where its sibling module shows four would read as an omission;
 * the omission IS the finding, so it is stated rather than left to be noticed.
 */
import type jsPDF from 'jspdf'
import { buildProjectionScorecardPdf } from '../../frameworks/report/projectionReports'
import type { ReportMeta } from '../../report/types'
import type { TacrSpineCategory } from '../projection'
import { taiwProjectionModule, type TaiwAnswers } from './projectionModule'

export const TAIW_SCORECARD_ARTEFACT_ID = 'MR-TAIW-SCORECARD'

export interface TaiwScorecardInput {
  meta: ReportMeta
  answers: TaiwAnswers
  categories: readonly TacrSpineCategory[]
}

export function buildTaiwScorecardPdf(input: TaiwScorecardInput): jsPDF {
  const { meta, answers, categories } = input
  return buildProjectionScorecardPdf(taiwProjectionModule(categories), { meta, answers })
}
