/**
 * Assessment tier primitives — pure, no React.
 *
 * G2: the diagnostic runs at one of three tiers, nested by construction:
 * every quick question is a standard question, every standard question is a
 * deep question. A question's `tier` field is the MINIMUM tier at which it
 * appears, so visibility is a single comparison (`tierShows`) — the layer.ts
 * shape, and for the same reason: the report generators and the gate's
 * TIER-NESTING check both need the predicate outside a component, and a second
 * copy is how a PDF disagrees with the screen about what was asked.
 *
 * The tier axis and the layer axis (core/banking) are ORTHOGONAL. Neither is
 * derived from the other; `scoring.applicableQuestions` composes both, and
 * TIER-NESTING fails the build if every banking question drifts to deep —
 * the aliasing that would quietly turn two axes into one.
 *
 * No React in this file on purpose: scoring.ts imports it, and scoring.ts is
 * one of the gate's compiled `tsModules`. The persistence hook lives in
 * `assessmentState.ts`.
 */

export const ASSESSMENT_TIERS = ['quick', 'standard', 'deep'] as const
export type AssessmentTier = (typeof ASSESSMENT_TIERS)[number]

/** Nesting order. Lower appears in everything above it. */
const TIER_ORDER: Record<AssessmentTier, number> = { quick: 0, standard: 1, deep: 2 }

/**
 * Default for every caller that predates tiers — the full question set, which
 * is exactly what those callers always received. A generator or check that
 * never passes a tier keeps meaning "the whole assessment".
 */
export const DEFAULT_TIER: AssessmentTier = 'deep'

/**
 * What a NEW engagement's selector starts at — deliberately not DEFAULT_TIER.
 * `deep` is the identity for legacy callers; `standard` is the editorial
 * default for a real engagement (the full core chassis plus the decisive
 * overlay). Two defaults, two jobs; conflating them would either shrink every
 * pre-tier caller's set or start every engagement at a 55-question wall.
 */
export const DEFAULT_UI_TIER: AssessmentTier = 'standard'

/** True when a question tagged `questionTier` is asked at the active tier. */
export function tierShows(active: AssessmentTier, questionTier: AssessmentTier): boolean {
  return TIER_ORDER[questionTier] <= TIER_ORDER[active]
}

export function isTier(v: unknown): v is AssessmentTier {
  return typeof v === 'string' && (ASSESSMENT_TIERS as readonly string[]).includes(v)
}

/** What each tier is FOR — rendered beside the selector and nowhere retyped. */
export const TIER_META: Record<AssessmentTier, { label: string; hint: string }> = {
  quick: {
    label: 'Quick',
    hint: 'One decisive question per pillar — a directional first pass in under an hour, never a full assessment.',
  },
  standard: {
    label: 'Standard',
    hint: 'The full core chassis plus the decisive overlay questions — the default engagement assessment.',
  },
  deep: {
    label: 'Deep Dive',
    hint: 'Every question in the instrument — the complete evidence base for a defended maturity claim.',
  },
}
