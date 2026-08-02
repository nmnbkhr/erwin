/**
 * HAIW's binding to the shared projection engine.
 *
 * The engine is `src/frameworks/projection.ts`. This file is the three things it
 * does not know, supplied once:
 *
 *   SPINE      HACR's eighty subcategories, derived from the question bank.
 *   OUTCOMES   `scoreCategories` from `src/scoring/maturity.ts`, over those groups.
 *   LAYER      none. HACR carries no core/banking tag on any of its 720 questions.
 *
 * ─── WHY THIS IS A SOURCE FILE AND NOT A RULE-FILE STAND-IN ────────────────
 *
 * TAIW's equivalent composition currently lives inside `scripts/check/modules/
 * taiw.mjs`, marked as a stand-in, because D5 stage C shipped datasets and checks
 * with no UI. HAIW's goes here from the start. The reason is the one this repo
 * spends nine checks on: two copies of a scoring composition drift, and the drift
 * is invisible because both copies are individually correct. `src/dgiw/
 * projection.ts` is the precedent and this is its shape.
 *
 * TAIW's stand-in moves to `src/taiw/projection.ts` in its own change — that edit
 * belongs to `src/taiw/`, which is not this stage's scope, and folding it in would
 * mean a TAIW source move riding on a HAIW dataset change.
 *
 * ─── THE OUTCOMES FUNCTION IS THE POINT ────────────────────────────────────
 *
 * The engine is handed a score per subcategory; it never derives one.
 * `maturity.ts` stays the single source of every HAIW category-shaped figure — the
 * assessment screen, the report and now the projection all reach the same
 * arithmetic, by construction rather than by anyone remembering. That is D-003's
 * rule expressed as a function signature.
 *
 * ─── QUESTIONS ARE A PARAMETER, DELIBERATELY ───────────────────────────────
 *
 * `hacrQuestions.json` is 1.18 MB. `healthReportGenerator.ts` already takes it as
 * a parameter rather than importing it, so the report chunk does not carry a
 * second copy, and the same contract holds here: this module imports the crosswalk
 * (37 kB) and the framework definitions (18 kB) but never the question bank. The
 * `Pick` is an honest statement of what is read — id and subcategory only.
 *
 * ─── WHAT THE SPINE IS BUILT FROM ──────────────────────────────────────────
 *
 * The QUESTION UNIVERSE, not the answer set. A subcategory nobody has answered
 * must come back `not-assessed`, and one that does not exist must come back
 * `not-applicable`; bucketing answers would collapse the two, which is the defect
 * `computeCategoryOutcomes` carried before D-003. Grouping the questions and
 * leaving the answers `undefined` is what keeps them apart.
 */
import { createProjectionEngine, type ProjectionEngine } from '../frameworks/projection'
import { scoreCategories, type Applicable, type MaturityAnswer } from '../scoring/maturity'
import { hacrSubcategoryIdOf } from './hacr'
import type { Framework, FrameworkDimension, FrameworksData, SpineMapping, SpineNode, SpineOutcome } from '../frameworks/types'
import type { HacrQuestion } from './types'
import frameworksData from '../frameworks/data/frameworks.json'
import crosswalkData from './../data/haiw/crosswalk.json'

/** All four. DGI reaches 100% of itself on HACR, where on TACR it reached 59%. */
export const HAIW_CROSSWALK_FRAMEWORKS = ['FW-01', 'FW-02', 'FW-03', 'FW-04'] as const

/** Everything the projection reads off a question. Nothing else is loaded. */
export type HacrSpineQuestion = Pick<HacrQuestion, 'id' | 'category' | 'subcategory'>

interface HaiwCrosswalkEntry {
  id: string
  dimensionId: string
  spineId: string
  coverageWeight: number
  rationale: string
}

const FW = frameworksData as unknown as FrameworksData
const XW = crosswalkData as unknown as { entries: HaiwCrosswalkEntry[] }

const FRAMEWORKS: Framework[] = FW.frameworks.filter((f) =>
  (HAIW_CROSSWALK_FRAMEWORKS as readonly string[]).includes(f.id),
)
const DIMENSIONS: FrameworkDimension[] = FW.dimensions.filter((d) =>
  (HAIW_CROSSWALK_FRAMEWORKS as readonly string[]).includes(d.frameworkId),
)
/** Already `spineId` in the file — HAIW was authored after the engine was generic. */
const MAPPINGS: SpineMapping[] = XW.entries.map((e) => ({
  id: e.id,
  dimensionId: e.dimensionId,
  spineId: e.spineId,
  coverageWeight: e.coverageWeight,
}))

/** The crosswalk entries as authored, rationale and all — for a scorecard that shows its working. */
export const haiwCrosswalkEntries = (): readonly HaiwCrosswalkEntry[] => XW.entries

/**
 * The 80 subcategories, in dataset order, deduplicated by derived id.
 *
 * Order is dataset order rather than sorted: the engine sorts everything it walks,
 * so this is the order a caller rendering the spine would want, and it matches the
 * order the assessment screen presents.
 */
export function hacrSpine(questions: readonly HacrSpineQuestion[]): SpineNode[] {
  const out: SpineNode[] = []
  const seen = new Set<string>()
  for (const q of questions) {
    const id = hacrSubcategoryIdOf(q.id, q.subcategory)
    if (id === null || seen.has(id)) continue
    seen.add(id)
    out.push({ id, name: `${q.category} / ${q.subcategory}` })
  }
  return out
}

/**
 * One outcome per subcategory, through the real primitive.
 *
 * Every question in the bank is an applicable entry, answered or not — see the
 * header on why that is the question universe and not the answer set. Weight 1
 * throughout: HACR is unweighted and `HAIW-WEIGHT` asserts it.
 */
export function hacrSubcategoryOutcomes(
  questions: readonly HacrSpineQuestion[],
  answers: Readonly<Record<string, MaturityAnswer>>,
): SpineOutcome[] {
  const groups = new Map<string, Applicable[]>()
  for (const q of questions) {
    const id = hacrSubcategoryIdOf(q.id, q.subcategory)
    if (id === null) continue
    if (!groups.has(id)) groups.set(id, [])
    groups.get(id)!.push({ weight: 1, answer: answers[q.id] })
  }
  return scoreCategories([...groups].map(([name, entries]) => ({ name, entries }))).map((o) => ({
    spineId: o.name,
    state: o.agg.state,
    // `currentRaw`, never the 1dp `current`. Recomposing a projection from rounded
    // parts is the defect `dgiw/scoring.ts` warns about, one level up.
    score: o.agg.state === 'scored' ? o.agg.currentRaw : null,
  }))
}

/** An engine over these questions. Cheap to build; hold it if you project repeatedly. */
export function createHaiwProjection(
  questions: readonly HacrSpineQuestion[],
): ProjectionEngine<Readonly<Record<string, MaturityAnswer>>> {
  return createProjectionEngine<Readonly<Record<string, MaturityAnswer>>>({
    frameworks: FRAMEWORKS,
    dimensions: DIMENSIONS,
    mappings: MAPPINGS,
    spine: hacrSpine(questions),
    outcomes: (answers) => hacrSubcategoryOutcomes(questions, answers),
  })
}
