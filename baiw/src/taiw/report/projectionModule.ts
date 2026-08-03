/**
 * TAIW's `ProjectionReportModule` — the descriptor both generators and the page share.
 *
 * One place where "which frameworks, which spine, which caveats" is decided. The two
 * generator files below it are three lines each because everything that differs between
 * TAIW and HAIW is here, and everything that differs between the alignment pack and the
 * scorecard is in `src/frameworks/report/projectionReports.ts`.
 *
 * ─── WHY THE ENGINE IS BUILT PER CALL AND NOT MEMOISED HERE ────────────────
 *
 * `createTaiwProjection` closes over the CATEGORY TREE, which the caller loads
 * asynchronously — `tacrQuestions.json` is 595 kB and neither this module nor the report
 * chunk may import it (see `src/taiw/projection.ts` on why questions are a parameter).
 * So the descriptor is a function of the categories rather than a constant. The page
 * memoises it with `useMemo`; a generator builds one and discards it, which is a few
 * milliseconds over 640 questions.
 */
import { taiwCrosswalkEntries, createTaiwProjection, tacrSpine, type TacrSpineCategory } from '../projection'
import type { MaturityAnswer } from '../../scoring/maturity'
import type { ProjectionReportModule } from '../../frameworks/report/projectionReports'
import type { Framework, FrameworksData } from '../../frameworks/types'
import { TAIW_CROSSWALK_FRAMEWORKS } from '../projection'
import frameworksData from '../../frameworks/data/frameworks.json'
import {
  TAIW_CAVEATS,
  TAIW_MODULE_LABEL,
  TAIW_SPINE_LABEL,
  TAIW_SPINE_LABEL_PLURAL,
  TAIW_UNMAPPED_NOTE,
} from './frameworkNotes'

export type TaiwAnswers = Readonly<Record<string, MaturityAnswer>>

/**
 * The three offered frameworks, in the file's own order.
 *
 * Exported because the page renders one card per framework and needs the publisher,
 * version label and structure confidence off the record — the projection carries what
 * was computed, not what was published.
 */
export const TAIW_FRAMEWORKS: Framework[] = (frameworksData as unknown as FrameworksData).frameworks.filter(
  (f) => (TAIW_CROSSWALK_FRAMEWORKS as readonly string[]).includes(f.id),
)

export function taiwProjectionModule(
  categories: readonly TacrSpineCategory[],
): ProjectionReportModule<TaiwAnswers> {
  return {
    moduleLabel: TAIW_MODULE_LABEL,
    spineLabel: TAIW_SPINE_LABEL,
    spineLabelPlural: TAIW_SPINE_LABEL_PLURAL,
    engine: createTaiwProjection(categories),
    frameworks: TAIW_FRAMEWORKS,
    entries: taiwCrosswalkEntries(),
    spine: tacrSpine(categories),
    moduleCaveats: TAIW_CAVEATS,
    unmappedNote: TAIW_UNMAPPED_NOTE,
  }
}
