/**
 * TAIW's binding to the shared projection engine.
 *
 * The engine is `src/frameworks/projection.ts`. This file is the three things it
 * does not know, supplied once:
 *
 *   SPINE      TACR's thirty-five sections, derived from the question bank.
 *   OUTCOMES   `scoreCategories` from `src/scoring/maturity.ts`, over those groups.
 *   LAYER      none. TACR carries no core/banking tag on any of its 640 questions —
 *              verified against `tacrQuestions.json` in D4, not assumed.
 *
 * ─── THIS COMPOSITION MOVED HERE FROM THE RULE FILE, WHICH IS THE POINT ─────
 *
 * It lived in `scripts/check/modules/taiw.mjs`, labelled STAND-IN, because D5 stage
 * C shipped TAIW's datasets and checks with no UI to consume them. That comment said
 * what had to happen next, in as many words: "When the UI lands and that binding is
 * written, THIS COMPOSITION MOVES INTO IT and the rule file loads it the way
 * dgiw.mjs loads DGIW's. Two copies of it would be exactly the drift this file
 * spends nine other checks preventing."
 *
 * D5 stage E3 is that stage. The rule file now loads this module through `tsModules`
 * and holds no composition of its own, so `PROJECTION-INVARIANT` verifies the code
 * the page and the PDFs actually run rather than a second implementation that agrees
 * with it today. `src/haiw/projection.ts` is the sibling and `src/dgiw/projection.ts`
 * is the precedent; all three are now the same shape.
 *
 * ─── WHY NOT DGI ───────────────────────────────────────────────────────────
 *
 * `TAIW_CROSSWALK_FRAMEWORKS` is three of the four, and the absence is a FINDING
 * rather than an omission. DGI reaches 59% of itself on TACR: Decision Rights,
 * Accountabilities, the Data Governance Office and Data Stewards land on nothing,
 * because a customs assessment does not ask who chairs the data governance council.
 * Offering a DGI score built on the 59% that does map would be a number whose
 * missing 41% is invisible on the page.
 *
 * That is the kind of finding a generic maturity model cannot produce — it comes from
 * projecting one evidence base through four published vocabularies and reading which
 * one fails to fit. HAIW, on the same crosswalk factory, reaches 100% on all four.
 *
 * ─── WHY SECTIONS AND NOT CATEGORIES ───────────────────────────────────────
 *
 * At TACR's 8 categories all three frameworks put 31-50% of their induced weight on
 * the single 'Data Governance' category, and every pairwise L1 distance still cleared
 * the floor — so distinctness passed and told nobody anything.
 * `CROSSWALK-CONCENTRATION` exists because of that measurement, and 35 sections is
 * the granularity that brought the peak down to 17.2%.
 *
 * ─── QUESTIONS ARE A PARAMETER, DELIBERATELY ───────────────────────────────
 *
 * `tacrQuestions.json` is 595 kB and the assessment screen already holds it. Taking
 * it as a parameter keeps a second copy out of the report chunk, exactly as
 * `healthReportGenerator.ts` and `src/haiw/projection.ts` do with HACR's 1.18 MB.
 *
 * The parameter is the CATEGORY TREE rather than a flat question list, and that is a
 * data difference rather than a style one: HACR questions carry `category` and
 * `subcategory` on the record, so HAIW can narrow to a flat `Pick`. TACR's carry
 * `id`, `text` and `levels` only — the section and category names live on the
 * parents — so a spine node's name is unreachable from a question alone.
 */
import { createProjectionEngine, type ProjectionEngine } from '../frameworks/projection'
import { scoreCategories, type Applicable, type MaturityAnswer } from '../scoring/maturity'
import type { Framework, FrameworkDimension, FrameworksData, SpineMapping, SpineNode, SpineOutcome } from '../frameworks/types'
import frameworksData from '../frameworks/data/frameworks.json'
import crosswalkData from '../data/taiw/crosswalk.json'

/**
 * DMBOK2, DCAM and COBIT 2019. NOT DGI — see the header; the absence is measured.
 */
export const TAIW_CROSSWALK_FRAMEWORKS = ['FW-01', 'FW-02', 'FW-04'] as const

/** The framework TACR cannot evidence at all, and why. Rendered, never silent. */
export const TAIW_UNREACHED_FRAMEWORK = Object.freeze({
  code: 'DGI',
  reach: 0.59,
  lost: ['Decision Rights', 'Accountabilities', 'Data Governance Office', 'Data Stewards'],
  why:
    'DGI reaches 59% of itself on TACR. Decision Rights, Accountabilities, the Data Governance ' +
    'Office and Data Stewards are mapped by nothing, because a customs assessment does not ask who ' +
    'chairs a data governance council. A DGI score built on the 59% that does map would carry an ' +
    'invisible 41% gap, so DGI is not offered at all.',
})

/**
 * The framework leaf TACR cannot evidence, and why. Mirrors `REACH_EXCEPTIONS` in
 * the rule file, which fails if this stops being true.
 */
export const TAIW_NOT_APPLICABLE_DIMENSIONS = Object.freeze({
  DM07:
    'Document & Content Management. 0 of 640 TACR questions mention document or content ' +
    'management. Customs runs on declarations, manifests and certificates, so this is a real gap ' +
    'in the ASSESSMENT rather than an absence in the domain — and forcing it onto Clearance ' +
    'Automation would be a mapping nobody could defend. HAIW does not share it: DM07 lands on ' +
    'ii_document_exchange there, because health runs on clinical documents.',
})

/** Everything the projection reads off a TACR question. Nothing else is loaded. */
export interface TacrSpineQuestion {
  id: string
}
export interface TacrSpineSection {
  name: string
  questions: readonly TacrSpineQuestion[]
}
export interface TacrSpineCategory {
  name: string
  sections: readonly TacrSpineSection[]
}

interface TaiwCrosswalkEntry {
  id: string
  dimensionId: string
  spineId: string
  coverageWeight: number
  rationale: string
}

const FW = frameworksData as unknown as FrameworksData
const XW = crosswalkData as unknown as { entries: TaiwCrosswalkEntry[] }

const FRAMEWORKS: Framework[] = FW.frameworks.filter((f) =>
  (TAIW_CROSSWALK_FRAMEWORKS as readonly string[]).includes(f.id),
)
const DIMENSIONS: FrameworkDimension[] = FW.dimensions.filter((d) =>
  (TAIW_CROSSWALK_FRAMEWORKS as readonly string[]).includes(d.frameworkId),
)
const MAPPINGS: SpineMapping[] = XW.entries.map((e) => ({
  id: e.id,
  dimensionId: e.dimensionId,
  spineId: e.spineId,
  coverageWeight: e.coverageWeight,
}))

/** The crosswalk entries as authored, rationale and all — for a report that shows its working. */
export const taiwCrosswalkEntries = (): readonly TaiwCrosswalkEntry[] => XW.entries

/**
 * `<category>_<section>` from a question id: `str_mod_001` -> `str_mod`.
 *
 * Measured 1:1 with all 35 sections and zero ambiguous, which is what makes the
 * derivation safe. Never positional — slicing every N questions in file order is the
 * shape that silently remaps the moment someone inserts a question.
 */
export const tacrSectionIdOf = (questionId: string): string =>
  String(questionId).split('_').slice(0, 2).join('_')

/**
 * The 35 sections, in dataset order, as spine nodes.
 *
 * Dataset order rather than sorted: the engine sorts everything it walks, so this is
 * the order a caller rendering the spine wants, and it is the order the assessment
 * screen presents.
 */
export function tacrSpine(categories: readonly TacrSpineCategory[]): SpineNode[] {
  const out: SpineNode[] = []
  for (const c of categories)
    for (const sec of c.sections) {
      const first = sec.questions[0]
      if (!first) continue
      out.push({ id: tacrSectionIdOf(first.id), name: `${c.name} / ${sec.name}` })
    }
  return out
}

/**
 * One outcome per section, through the real primitive.
 *
 * Every question in the bank is an applicable entry, answered or not — the QUESTION
 * UNIVERSE, not the answer set. A section nobody has answered must come back
 * `not-assessed` and one that does not exist `not-applicable`; bucketing answers
 * collapses the two, which is the defect `computeCategoryOutcomes` carried before
 * D-003. Weight 1 throughout: TACR carries no `weight` field at all.
 */
export function tacrSectionOutcomes(
  categories: readonly TacrSpineCategory[],
  answers: Readonly<Record<string, MaturityAnswer>>,
): SpineOutcome[] {
  const groups: { name: string; entries: Applicable[] }[] = []
  for (const c of categories)
    for (const sec of c.sections) {
      if (sec.questions.length === 0) continue
      groups.push({
        name: tacrSectionIdOf(sec.questions[0].id),
        entries: sec.questions.map((q) => ({ weight: 1, answer: answers[q.id] })),
      })
    }
  return scoreCategories(groups).map((o) => ({
    spineId: o.name,
    state: o.agg.state,
    // `currentRaw`, never the 1dp `current`. Recomposing a projection from rounded
    // parts is the defect `dgiw/scoring.ts` warns about, one level up.
    score: o.agg.state === 'scored' ? o.agg.currentRaw : null,
  }))
}

/** An engine over these sections. Cheap to build; hold it if you project repeatedly. */
export function createTaiwProjection(
  categories: readonly TacrSpineCategory[],
): ProjectionEngine<Readonly<Record<string, MaturityAnswer>>> {
  return createProjectionEngine<Readonly<Record<string, MaturityAnswer>>>({
    frameworks: FRAMEWORKS,
    dimensions: DIMENSIONS,
    mappings: MAPPINGS,
    spine: tacrSpine(categories),
    outcomes: (answers) => tacrSectionOutcomes(categories, answers),
  })
}
