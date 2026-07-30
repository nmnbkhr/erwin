/**
 * Diagnostic scoring — the single source of truth for every number the
 * diagnostic reports, on screen or on paper.
 *
 * This was inline in Diagnostic.tsx. It moved here the moment a PDF generator
 * needed the same figures: a report that disagrees with the screen is worse than
 * no report, and the way that happens is two implementations of "the same"
 * weighted mean drifting apart. Diagnostic.tsx and diagnosticReport.ts both call
 * these functions; neither computes a score of its own.
 *
 * THREE STATES, NOT TWO. A pillar is:
 *
 *   'scored'         — has questions in this layer, at least one answered
 *   'not-assessed'   — has questions in this layer, none answered
 *   'not-applicable' — has no questions in this layer at all
 *
 * The last two are different facts about the engagement and must never collapse
 * into each other, and neither may be rendered as 0 or counted in any average.
 * "Not assessed" means nobody answered; "not applicable" means the question set
 * does not exist under this layer — a core-only engagement is not failing the
 * banking-specific pillars, it simply is not being asked about them. A reader who
 * sees 0 where the truth is "unmeasured" has been handed a wrong number, not a
 * missing one.
 */
import { layerShows } from './layer'
import type { DiagnosticQuestion, Layer, LayerFilter, Pillar } from './types'

/** British spelling, matching the rest of DGIW. One vocabulary, not two. */
export const LEVEL_LABEL: Record<number, string> = {
  1: 'Initial', 2: 'Developing', 3: 'Defined', 4: 'Managed', 5: 'Optimising',
}

/**
 * A pillar must have at least this share of its question weight answered before
 * it is allowed to be ranked as a strength or a priority gap. Without a floor,
 * the headline finding can rest on a single contextual question.
 */
export const RANK_MIN_CONFIDENCE = 0.5

export type PillarState = 'scored' | 'not-assessed' | 'not-applicable'

export interface PillarOutcome {
  pillarId: string
  name: string
  short: string
  state: PillarState
  /** Weighted mean of answered questions, unrounded. null unless state is 'scored'. */
  score: number | null
  answered: number
  /** Questions applicable under the current layer. 0 means 'not-applicable'. */
  total: number
  weightAnswered: number
  weightTotal: number
  /** Share of the pillar's question weight that was answered. */
  confidence: number
}

/** Questions in scope for a layer filter. */
export function applicableQuestions(
  questions: DiagnosticQuestion[],
  filter: LayerFilter,
): DiagnosticQuestion[] {
  return questions.filter((q) => layerShows(filter, q.layer as Layer))
}

/**
 * Score every pillar, including the ones with nothing to score.
 *
 * Returns all pillars in dataset order — callers decide what to show. Nothing is
 * dropped here, because dropping is what made 'not-applicable' invisible: the
 * component's old `.filter(s => s.total > 0)` silently removed those pillars from
 * the page rather than reporting them as out of scope.
 */
export function scorePillars(
  pillars: Pillar[],
  questions: DiagnosticQuestion[],
  answers: Record<string, number>,
): PillarOutcome[] {
  return pillars.map((p) => {
    const qs = questions.filter((q) => q.pillarId === p.id)
    const answeredQs = qs.filter((q) => answers[q.id])
    const weightAnswered = answeredQs.reduce((s, q) => s + q.weight, 0)
    const weightTotal = qs.reduce((s, q) => s + q.weight, 0)
    const weighted = answeredQs.reduce((s, q) => s + answers[q.id] * q.weight, 0)
    const state: PillarState =
      qs.length === 0 ? 'not-applicable' : weightAnswered === 0 ? 'not-assessed' : 'scored'
    return {
      pillarId: p.id,
      name: p.name,
      short: p.short,
      state,
      // Held unrounded. Rounding here and re-weighting in `overallScore` let up
      // to 0.05 of drift into the headline number for no benefit.
      score: weightAnswered ? weighted / weightAnswered : null,
      answered: answeredQs.length,
      total: qs.length,
      weightAnswered,
      weightTotal,
      confidence: weightTotal ? weightAnswered / weightTotal : 0,
    }
  })
}

/**
 * Weighted mean over every answered question, computed from raw responses rather
 * than by re-weighting the per-pillar means. The two agree mathematically, but
 * only if the pillar means are unrounded — recomposing from rounded values is how
 * a diagnostic ends up reporting 3.2 when the evidence says 3.15.
 *
 * Unanswered and inapplicable questions contribute nothing: they are absent from
 * the numerator AND the denominator, never a zero in either.
 */
export function overallScore(
  questions: DiagnosticQuestion[],
  answers: Record<string, number>,
): number | null {
  const answered = questions.filter((q) => answers[q.id])
  const w = answered.reduce((s, q) => s + q.weight, 0)
  if (!w) return null
  return answered.reduce((s, q) => s + answers[q.id] * q.weight, 0) / w
}

export interface RankedPillars {
  /** Scored and above the coverage floor, weakest first. */
  ranked: PillarOutcome[]
  /** Scored but too thinly to defend a claim. Surfaced, not dropped. */
  underCovered: PillarOutcome[]
  strengths: PillarOutcome[]
  gaps: PillarOutcome[]
}

/**
 * Strengths and gaps are a partition, never an overlap. With only three pillars
 * ranked, a naive top-3/bottom-3 lists each pillar as both a top strength and a
 * priority gap. Gaps take precedence when the ranked set is small: with one
 * pillar ranked, calling it a "top strength" overstates the evidence, calling it
 * a gap does not.
 */
export function rankPillars(outcomes: PillarOutcome[]): RankedPillars {
  const scored = outcomes.filter((p) => p.state === 'scored')
  const ranked = scored
    .filter((p) => p.confidence >= RANK_MIN_CONFIDENCE)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
  const underCovered = scored.filter((p) => p.confidence < RANK_MIN_CONFIDENCE)
  const nGaps = Math.min(3, Math.ceil(ranked.length / 2))
  const nStrengths = Math.min(3, ranked.length - nGaps)
  return {
    ranked,
    underCovered,
    gaps: ranked.slice(0, nGaps),
    strengths: nStrengths ? ranked.slice(ranked.length - nStrengths).reverse() : [],
  }
}

/** Counts by state, for the coverage statement the report has to print. */
export function stateCounts(outcomes: PillarOutcome[]): Record<PillarState, number> {
  return {
    scored: outcomes.filter((p) => p.state === 'scored').length,
    'not-assessed': outcomes.filter((p) => p.state === 'not-assessed').length,
    'not-applicable': outcomes.filter((p) => p.state === 'not-applicable').length,
  }
}

/** Display label for a pillar's score, never a bare 0. */
export function scoreLabel(p: PillarOutcome): string {
  if (p.state === 'not-applicable') return 'NOT APPLICABLE'
  if (p.state === 'not-assessed') return 'NOT ASSESSED'
  return (Math.round((p.score as number) * 10) / 10).toFixed(1)
}

/** Why a pillar carries no score. Empty for scored pillars. */
export function stateReason(p: PillarOutcome, filter: LayerFilter): string {
  if (p.state === 'not-applicable') {
    const scope = filter === 'all' ? 'the combined core and banking scope' : `the ${filter} layer`
    return `No diagnostic questions exist for this pillar in ${scope}.`
  }
  if (p.state === 'not-assessed') {
    return `${p.total} applicable question${p.total === 1 ? '' : 's'}, none answered.`
  }
  return ''
}
