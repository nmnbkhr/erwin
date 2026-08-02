/**
 * The BACR assessment axis — one declaration, replacing three.
 *
 * ─── D-011 ──────────────────────────────────────────────────────────────────
 *
 * `pages/MaturityAssessment.tsx`, `utils/reportGenerator.ts` and
 * `components/dashboard/MaturityRadarCard.tsx` each carried their own nine-entry
 * copy of this list. `bacrQuestions.json` holds 804 questions across EIGHT
 * categories and none of them is `"Overall Assessment"`, so the ninth entry was a
 * category no client answer could ever populate — and every one of the three
 * copies rendered it.
 *
 * What it cost, on a live BAIW assessment:
 *
 *  - a ninth radar axis pinned at 0, drawn like a measurement;
 *  - a ninth scorecard row reading `0.0 / 0.0 / 0.0 / Not Assessed`;
 *  - four hardcoded `: 1.86` fallbacks in the generator existing only to service
 *    a category with no questions;
 *  - and `isDraft = answeredCategories < totalCategories` — 8 < 9 — so **every
 *    complete BAIW report was stamped DRAFT**, permanently, because the ninth
 *    category can never be answered.
 *
 * ─── WHY THIS IS DECLARED AND NOT DERIVED ──────────────────────────────────
 *
 * Deriving it would be better and the dataset does not allow it. A BACR question
 * is `{ id, category, subcategory, text, weight }` — no ordinal, no category id,
 * no category table. The only derivable order is order of first appearance, which
 * is
 *
 *   Business, Information, Applications, Systems, Agility, Culture, Governance, Outcomes
 *
 * — NOT the order below, and not the order the radar, the eight deep-dive pages,
 * the scorecard and the benchmark table have shipped in. Deriving would silently
 * reorder four rendered surfaces to match an accident of how the file was
 * generated. And a runtime derivation means importing the 188 kB question bank
 * into the dashboard card, which lazy-loads it today precisely to avoid that.
 *
 * So the ORDER is declared here, once, and the SET is the gate's job: the join
 * from this list to `bacrQuestions.json` belongs in `scripts/check/modules/baiw.mjs`
 * alongside BENCHMARK-ROLLUP, which already joins the benchmark file to the same
 * questions. Three hand-maintained copies is how they diverged; one is how they
 * stop. See docs/known-defects.md D-011.
 */
export const BACR_CATEGORIES = [
  'Business',
  'Culture',
  'Governance',
  'Information',
  'Applications',
  'Systems',
  'Agility',
  'Outcomes',
] as const

/**
 * How many questions the standard assessment asks per category.
 *
 * `MaturityAssessment.tsx` slices each category's questions to this; the answer
 * count a complete standard assessment produces is therefore
 * `BACR_CATEGORIES.length * QUESTIONS_PER_CATEGORY`. It lived as a bare `8` next
 * to the nine-entry list, which is why `CATEGORIES.length * QUESTIONS_PER_CATEGORY`
 * over-counted the denominator of the progress bar by one category's worth.
 */
export const QUESTIONS_PER_CATEGORY = 8

export type BacrCategory = (typeof BACR_CATEGORIES)[number]

/**
 * The category a BACR question id belongs to, from the segment before its first
 * underscore — `business_summary_001` -> `Business`.
 *
 * ─── WHY THIS RELATION IS SAFE TO USE, AND CHECKED ─────────────────────────
 *
 * All 804 ids match `<prefix>_<rest>`, the eight prefixes map one-to-one onto the
 * eight categories, and no prefix serves two categories. That is a property of
 * the DATA, so `BACR-CATEGORY-PREFIX` in scripts/check/modules/baiw.mjs asserts
 * it on every build rather than leaving it as an assumption this file makes.
 * TAIW's `TACR-CATEGORY-PREFIX` is the same rule for the same reason.
 *
 * It exists because `MaturityRadarCard` needs category attribution and must not
 * import `bacrQuestions.json` — 188 kB pulled into the dashboard chunk to read a
 * `category` field the id already encodes. Before D-012 the card had no
 * attribution at all: it sliced the answer array into equal positional blocks and
 * called each block a category.
 *
 * Returns `null` for an unrecognised prefix rather than guessing. A question that
 * cannot be attributed leaves the numerator and the denominator, as an unanswered
 * one does — it does not silently land in whichever bucket came first.
 */
const CATEGORY_BY_ID_PREFIX: Readonly<Record<string, BacrCategory>> = {
  business: 'Business',
  culture: 'Culture',
  governance: 'Governance',
  information: 'Information',
  applications: 'Applications',
  systems: 'Systems',
  agility: 'Agility',
  outcomes: 'Outcomes',
}

export const bacrCategoryOf = (questionId: string): BacrCategory | null =>
  CATEGORY_BY_ID_PREFIX[questionId.split('_')[0]] ?? null

/** The prefix table, for the gate to assert against the dataset. */
export const BACR_ID_PREFIXES = CATEGORY_BY_ID_PREFIX
