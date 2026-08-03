/**
 * HAIW's `ProjectionReportModule` — the descriptor both generators and the page share.
 *
 * The TAIW sibling's header explains the pattern; the one difference worth naming here
 * is the parameter. `hacrQuestions.json` is 1.18 MB and the assessment page already
 * holds it, so the spine is built from a `HacrSpineQuestion[]` the caller supplies —
 * `Pick<HacrQuestion, 'id' | 'category' | 'subcategory'>`, an honest contract about what
 * is read and the same one `healthReportGenerator.ts` keeps for its own questions
 * parameter. Importing the bank here would put a second copy in the report chunk.
 */
import { createHaiwProjection, haiwCrosswalkEntries, hacrSpine, HAIW_CROSSWALK_FRAMEWORKS, type HacrSpineQuestion } from '../projection'
import type { MaturityAnswer } from '../../scoring/maturity'
import type { ProjectionReportModule } from '../../frameworks/report/projectionReports'
import type { Framework, FrameworksData } from '../../frameworks/types'
import frameworksData from '../../frameworks/data/frameworks.json'
import {
  HACR_INSTRUMENT_DISCLOSURE,
  HAIW_CAVEATS,
  HAIW_MODULE_LABEL,
  HAIW_SPINE_LABEL,
  HAIW_SPINE_LABEL_PLURAL,
  HAIW_UNMAPPED_NOTE,
} from './frameworkNotes'

export type HaiwAnswers = Readonly<Record<string, MaturityAnswer>>

/** All four, in file order. The page reads publisher and version label off these. */
export const HAIW_FRAMEWORKS: Framework[] = (frameworksData as unknown as FrameworksData).frameworks.filter(
  (f) => (HAIW_CROSSWALK_FRAMEWORKS as readonly string[]).includes(f.id),
)

export function haiwProjectionModule(
  questions: readonly HacrSpineQuestion[],
): ProjectionReportModule<HaiwAnswers> {
  return {
    moduleLabel: HAIW_MODULE_LABEL,
    spineLabel: HAIW_SPINE_LABEL,
    spineLabelPlural: HAIW_SPINE_LABEL_PLURAL,
    engine: createHaiwProjection(questions),
    frameworks: HAIW_FRAMEWORKS,
    entries: haiwCrosswalkEntries(),
    spine: hacrSpine(questions),
    moduleCaveats: HAIW_CAVEATS,
    // The one deliverable in the suite whose headline number needs qualifying ABOVE the
    // table rather than beside it — see frameworkNotes.ts.
    headlineDisclosure: HACR_INSTRUMENT_DISCLOSURE,
    unmappedNote: HAIW_UNMAPPED_NOTE,
  }
}
