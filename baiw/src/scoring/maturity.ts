/**
 * Category maturity scoring — one implementation for TAIW and HAIW.
 *
 * WHY THIS FILE EXISTS
 *
 * There were four implementations of "the mean of the answered questions in a
 * category", and three different rules for rolling them into a headline score:
 *
 *   TradeMaturityAssessment.tsx   mean over answered, overall ÷ ALL categories
 *   QuickAssessment.tsx           mean over answered, overall ÷ SCORED
 *   HealthMaturityAssessment.tsx  mean over answered, overall ÷ SCORED
 *   healthReportGenerator.ts      aggregate(), overall ÷ ALL categories
 *
 * On a half-finished assessment — four of eight categories answered, every
 * question at 3 — those rules print **1.5 and 3.0 for the same client on the same
 * day**. TAIW's own quick and deep screens disagreed with each other; HAIW's
 * screen disagreed with its PDF. Neither showed up in a golden baseline because
 * every fixture answers every question, and at 8-of-8 all four rules coincide.
 *
 * ÷ SCORED is the correct rule and it is DGIW's: an unmeasured thing leaves the
 * numerator AND the denominator, rather than entering as a zero. `scoring.ts`
 * has said so since Phase C. This module is that rule, for the two modules whose
 * unit is a category rather than a pillar.
 *
 * THREE STATES, NOT TWO. Lifted from `dgiw/scoring.ts` and from the `Aggregate`
 * union D-003 put into `healthReportGenerator.ts`:
 *
 *   'scored'         — applicable questions, at least one answered
 *   'not-assessed'   — applicable questions, none answered
 *   'not-applicable' — no applicable questions at all
 *
 * The union is the enforcement. `current: number` carrying 0 for "unmeasured" is
 * the shape that produced D-003, and making the number unreachable in the other
 * two states is how the compiler refuses it rather than a reviewer catching it.
 *
 * WEIGHTING IS AN ARGUMENT, NOT A SECOND FUNCTION. `aggregate()` takes a weight
 * per entry, and every caller in the suite now passes 1: TACR carries no `weight`
 * field at all, and HACR's was flattened to 1 in D5 stage A.
 *
 * The parameter stays. It is what lets a module become weighted without a second
 * implementation of the mean, and CLAUDE.md's rule holds — that is a content
 * decision with its own before/after, not a refactor done in passing.
 *
 * WHAT HACR'S WEIGHT ACTUALLY WAS. This file used to say "HACR questions carry
 * `weight` 0.8–1.2", which read as domain judgement. It was
 * `W[(i + 1) % 5]` over the file, W = [0.8, 0.9, 1.0, 1.1, 1.2] — a counter, for
 * all 720. Flattening it moved 46 of 108 printed capability scores and five
 * priority bands on the golden fixture (all 108 scores and nine bands on the
 * partial one, one of them off the top of page 13's ranking).
 * `HAIW-WEIGHT` now asserts `=== 1` so the field cannot drift back without someone
 * changing the rule file. docs/known-defects.md D-015.
 *
 * ROUNDING. `current` and `desired` are rounded to one decimal because the gap a
 * reader computes from the two printed numbers must equal the gap printed next to
 * them. `currentRaw`/`desiredRaw` are not, and they are what the overall is built
 * from: recomposing a headline from rounded parts is how a diagnostic reports 3.2
 * when the evidence says 3.15, which `dgiw/scoring.ts` warns about in as many
 * words and which every one of the four implementations above was doing.
 */

/** One client response. Both modules store this shape. */
export interface MaturityAnswer {
  currentState: number
  desiredState: number
}

/** One question that applies to whatever is being scored, answered or not. */
export interface Applicable {
  weight: number
  /** `undefined` when the client has not answered it. */
  answer: MaturityAnswer | undefined
}

export type ScoreState = 'scored' | 'not-assessed' | 'not-applicable'

export type Aggregate =
  | {
      state: 'scored'
      /** Rounded to 1dp, for display. */
      current: number
      desired: number
      gap: number
      /** Unrounded. The only thing an overall may be built from. */
      currentRaw: number
      desiredRaw: number
      answered: number
      applicable: number
    }
  | { state: 'not-assessed'; current: null; desired: null; gap: null; currentRaw: null; desiredRaw: null; answered: 0; applicable: number }
  | { state: 'not-applicable'; current: null; desired: null; gap: null; currentRaw: null; desiredRaw: null; answered: 0; applicable: 0 }

const round1 = (n: number): number => parseFloat(n.toFixed(1))

/**
 * Score one group of applicable questions.
 *
 * Unanswered questions leave both the numerator and the denominator rather than
 * counting as zero. That is the difference between "this is weak" and "nobody has
 * told us about this yet", and the two must not print the same digit.
 */
export function aggregate(entries: readonly Applicable[]): Aggregate {
  if (entries.length === 0) {
    return { state: 'not-applicable', current: null, desired: null, gap: null, currentRaw: null, desiredRaw: null, answered: 0, applicable: 0 }
  }
  const answered = entries.filter(
    (e): e is { weight: number; answer: MaturityAnswer } => e.answer !== undefined,
  )
  if (answered.length === 0) {
    return { state: 'not-assessed', current: null, desired: null, gap: null, currentRaw: null, desiredRaw: null, answered: 0, applicable: entries.length }
  }
  const totalWeight = answered.reduce((s, e) => s + e.weight, 0)
  // A non-positive total weight divides to NaN, and "NaN" on a client deliverable
  // is worse than an unweighted mean. The weights would be unusable; the answers
  // still are not. HAIW-WEIGHT asserts it cannot happen with the live dataset; it
  // is handled here rather than assumed.
  const usable = totalWeight > 0
  const denom = usable ? totalWeight : answered.length
  const w = (e: { weight: number }) => (usable ? e.weight : 1)
  const currentRaw = answered.reduce((s, e) => s + e.answer.currentState * w(e), 0) / denom
  const desiredRaw = answered.reduce((s, e) => s + e.answer.desiredState * w(e), 0) / denom
  const current = round1(currentRaw)
  const desired = round1(desiredRaw)
  return {
    state: 'scored',
    current,
    desired,
    // Rounded inputs, deliberately: the gap a reader computes from the two
    // printed numbers must equal the gap printed next to them.
    gap: round1(desired - current),
    currentRaw,
    desiredRaw,
    answered: answered.length,
    applicable: entries.length,
  }
}

export interface CategoryOutcome {
  /** Display name, as authored in the dataset. */
  name: string
  agg: Aggregate
}

/** One category and the questions that apply to it, answered or not. */
export interface CategoryGroup {
  name: string
  entries: readonly Applicable[]
}

/**
 * Score every category, including the ones with nothing to score.
 *
 * Nothing is dropped: dropping is what made 'not-applicable' invisible in DGIW,
 * where a `.filter(s => s.total > 0)` silently removed those pillars from the
 * page rather than reporting them as out of scope.
 */
export function scoreCategories(groups: readonly CategoryGroup[]): CategoryOutcome[] {
  return groups.map((g) => ({ name: g.name, agg: aggregate(g.entries) }))
}

/**
 * The headline score: the mean of the SCORED categories' unrounded means.
 *
 * `null`, never 0, when nothing has been scored — a caller that wants to print
 * something must decide what, and "0.0" is not it.
 *
 * Mean-of-category-means rather than mean-over-questions, which is what both
 * modules' radars and scorecards already show and what a reader recomposing the
 * cover number from the table would arrive at. The two differ whenever categories
 * hold unequal numbers of questions, which in TACR they do (70–90).
 */
export function overallCurrent(outcomes: readonly CategoryOutcome[]): number | null {
  const scored = outcomes.filter((o) => o.agg.state === 'scored')
  if (scored.length === 0) return null
  return round1(scored.reduce((s, o) => s + (o.agg.currentRaw as number), 0) / scored.length)
}

/** As `overallCurrent`, for the target state. */
export function overallDesired(outcomes: readonly CategoryOutcome[]): number | null {
  const scored = outcomes.filter((o) => o.agg.state === 'scored')
  if (scored.length === 0) return null
  return round1(scored.reduce((s, o) => s + (o.agg.desiredRaw as number), 0) / scored.length)
}

/** Counts by state, for the coverage statement a deliverable has to print. */
export function stateCounts(outcomes: readonly CategoryOutcome[]): Record<ScoreState, number> {
  return {
    scored: outcomes.filter((o) => o.agg.state === 'scored').length,
    'not-assessed': outcomes.filter((o) => o.agg.state === 'not-assessed').length,
    'not-applicable': outcomes.filter((o) => o.agg.state === 'not-applicable').length,
  }
}

/**
 * The denominator, in words, for the page.
 *
 * A cover score of 3.0 from four of eight categories is not the same claim as 3.0
 * from eight, and the number alone cannot tell them apart. DGIW prints its scored
 * count for exactly this reason; without it, fixing the arithmetic leaves a reader
 * unable to distinguish a complete assessment from a half-finished one — which is
 * the D-003 lesson one level up, at the category rather than the capability.
 */
export function coverageStatement(outcomes: readonly CategoryOutcome[]): string {
  const c = stateCounts(outcomes)
  const total = outcomes.length
  const parts = [`Scored ${c.scored} of ${total} categories`]
  if (c['not-assessed'] > 0) parts.push(`not assessed ${c['not-assessed']}`)
  if (c['not-applicable'] > 0) parts.push(`not applicable ${c['not-applicable']}`)
  return `${parts.join(' · ')}.`
}

/** Display label for a category's score, never a bare 0. */
export function scoreLabel(agg: Aggregate): string {
  if (agg.state === 'not-applicable') return 'NOT APPLICABLE'
  if (agg.state === 'not-assessed') return 'NOT ASSESSED'
  return agg.current.toFixed(1)
}
