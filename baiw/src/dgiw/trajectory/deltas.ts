/**
 * The delta engine — movement between two frozen snapshots, under strict
 * comparability rules. Pure: no React, no storage, no clock. G6.
 *
 * ═══ DELTAS ONLY BETWEEN COMPARABLE THINGS ═════════════════════════════════
 *
 * A pillar delta exists only when BOTH snapshots have that pillar 'scored'
 * AND both snapshots were captured at the SAME tier and layer. Cross-tier
 * pairs are never compared — coverage differs by construction, so a Quick
 * score moving against a Deep score is noise wearing a trend costume. The
 * same holds one axis over for the layer filter, which is why snapshots
 * capture it (snapshots.ts's header). A cross-tier or cross-layer input
 * returns a `comparable: false` result carrying both tiers, both layers and
 * the rule's own statement — it does NOT throw: a UI showing "these two
 * cannot be compared and here is why" is the honest surface, and only
 * generators refuse.
 *
 * A pillar scored in one snapshot but not the other appears as an EXCLUSION
 * with the reason, never as a zero-delta — a zero it did not earn would claim
 * "no movement" about a pillar that was not measured twice. Overall movement
 * is computed only across the pillars comparable in both, and says so via
 * `pillarCount`.
 *
 * ═══ EVERY DELTA CLAIM CITES ITS TWO DIGESTS ═══════════════════════════════
 *
 * The result carries both snapshot labels, capture dates and content digests.
 * Reproducibility means a reader can name exactly which two frozen states
 * produced the number — the digests are the same stableFileId idiom a PDF
 * trailer /ID uses, so the citation is checkable, not decorative.
 *
 * Scoring is `scorePillars` over the frozen maps — the SAME compiled function
 * every live surface calls, maths untouched. This engine computes no score of
 * its own; it subtracts two that scoring.ts produced.
 */
import { applicableQuestions, overallScore, scorePillars, type PillarOutcome } from '../scoring'
import { answerScores } from '../answerShape'
import { TIER_META } from '../tier'
import pillarsData from '../data/pillars.json'
import diagnosticData from '../data/diagnostic.json'
import type { DiagnosticData, Pillar } from '../types'
import type { AssessmentSnapshot } from './snapshots'

const PILLARS = pillarsData as Pillar[]
const DIAG = diagnosticData as DiagnosticData

/* ── the boundary statements — exported so surfaces render, never restate ── */

export const B_SAME_TIER =
  'DELTAS ONLY BETWEEN COMPARABLE CAPTURES. Two snapshots are compared only when both were ' +
  'taken at the same assessment tier and the same layer scope. Coverage differs across tiers ' +
  'by construction, so a Quick score moving against a Deep score is a change of instrument, ' +
  'not a change of maturity — such pairs are listed as not comparable, with both tiers named.'

export const B_SCORED_BOTH =
  'A PILLAR DELTA REQUIRES TWO SCORES. A pillar contributes a delta only when it is scored in ' +
  'BOTH snapshots. Scored in one but not the other, it is listed as excluded with the reason ' +
  '— never rendered as a zero, because a zero claims "no movement" about a thing that was not ' +
  'measured twice. The overall figure is computed only across the pillars comparable in both, ' +
  'and states that count.'

export const B_NO_FORECAST =
  'MOVEMENT IS REPORTED AS PAST FACT. A delta states what happened between two captured, ' +
  'digest-cited states and nothing more: no line is drawn beyond the captured points, no ' +
  'future value is suggested, and no direction is promised. What the next capture will show ' +
  'is not this instrument\'s to say.'

/* ── result shapes ─────────────────────────────────────────────────────── */

export interface PillarDelta {
  pillarId: string
  pillarName: string
  pillarShort: string
  /** Unrounded weighted means from scorePillars. Rounding is display-only. */
  from: number
  to: number
  /** to - from. Signed; a regression is a fact, not an error. */
  delta: number
  /** Coverage in each snapshot, so a delta's evidence base is visible. */
  fromCoverage: { answered: number; applicable: number }
  toCoverage: { answered: number; applicable: number }
}

/** Why a pillar contributes no delta. Listed, never silent. */
export interface DeltaExclusion {
  pillarId: string
  pillarName: string
  reasons: string[]
}

/** Both snapshots, citable: a reader can name the exact frozen states. */
export interface DeltaCitations {
  aId: string
  aLabel: string
  aAt: string
  aDigest: string
  bId: string
  bLabel: string
  bAt: string
  bDigest: string
}

export interface ComparableDeltas {
  comparable: true
  /** The SHARED tier and layer — the precondition, restated as fact. */
  tier: AssessmentSnapshot['tier']
  layer: AssessmentSnapshot['layer']
  deltas: PillarDelta[]
  exclusions: DeltaExclusion[]
  /**
   * Movement of the weighted overall, over ONLY the comparable pillars'
   * questions — null when no pillar is comparable in both.
   */
  overall: { from: number; to: number; delta: number; pillarCount: number } | null
  citations: DeltaCitations
}

export interface NotComparableDeltas {
  comparable: false
  aTier: AssessmentSnapshot['tier']
  bTier: AssessmentSnapshot['tier']
  aLayer: AssessmentSnapshot['layer']
  bLayer: AssessmentSnapshot['layer']
  /** The rule's own statement, for the surface to render verbatim. */
  rule: string
  citations: DeltaCitations
}

export type SnapshotDeltas = ComparableDeltas | NotComparableDeltas

/* ── scoring a frozen snapshot — one implementation, shared by every surface ── */

/**
 * Pillar outcomes for a snapshot's frozen state, through the same
 * `applicableQuestions` + `scorePillars` composition the live Diagnostic page
 * uses. The trajectory chart, the delta table and the PDF all read THIS, so a
 * plotted point can never disagree with the screen that captured it.
 */
export function scoreSnapshot(s: AssessmentSnapshot): PillarOutcome[] {
  const questions = applicableQuestions(DIAG.questions, s.layer, s.tier)
  return scorePillars(PILLARS, questions, answerScores(s.answers))
}

const citationsOf = (a: AssessmentSnapshot, b: AssessmentSnapshot): DeltaCitations => ({
  aId: a.id, aLabel: a.label, aAt: a.capturedAt, aDigest: a.digest,
  bId: b.id, bLabel: b.label, bAt: b.capturedAt, bDigest: b.digest,
})

const notScoredReason = (o: PillarOutcome, s: AssessmentSnapshot, which: string): string => {
  if (o.state === 'not-applicable') {
    return `not applicable in ${which} "${s.label}" — no questions for this pillar under the ${s.layer === 'all' ? 'combined' : s.layer} layer`
  }
  return (
    `not scored in ${which} "${s.label}" — ${o.total} applicable question${o.total === 1 ? '' : 's'} at the ` +
    `${TIER_META[s.tier].label} tier, none answered`
  )
}

/* ── the engine ────────────────────────────────────────────────────────── */

/**
 * Movement from snapshot `a` to snapshot `b`. Order matters: `a` is the
 * earlier state being moved FROM. The engine does not reorder — a caller
 * comparing backwards gets honestly negative arithmetic, not a correction.
 */
export function snapshotDeltas(a: AssessmentSnapshot, b: AssessmentSnapshot): SnapshotDeltas {
  if (a.tier !== b.tier || a.layer !== b.layer) {
    const halves: string[] = []
    if (a.tier !== b.tier) {
      halves.push(
        `"${a.label}" was captured at the ${TIER_META[a.tier].label} tier and "${b.label}" at the ` +
        `${TIER_META[b.tier].label} tier`,
      )
    }
    if (a.layer !== b.layer) {
      halves.push(`"${a.label}" was captured under the ${a.layer} layer scope and "${b.label}" under ${b.layer}`)
    }
    return {
      comparable: false,
      aTier: a.tier, bTier: b.tier, aLayer: a.layer, bLayer: b.layer,
      rule: `${halves.join('; ')}. ${B_SAME_TIER}`,
      citations: citationsOf(a, b),
    }
  }

  const aOutcomes = scoreSnapshot(a)
  const bOutcomes = scoreSnapshot(b)
  const bByPillar = new Map(bOutcomes.map((o) => [o.pillarId, o]))

  const deltas: PillarDelta[] = []
  const exclusions: DeltaExclusion[] = []

  for (const ao of aOutcomes) {
    const bo = bByPillar.get(ao.pillarId) as PillarOutcome
    const aScored = ao.state === 'scored'
    const bScored = bo.state === 'scored'
    if (aScored && bScored) {
      deltas.push({
        pillarId: ao.pillarId,
        pillarName: ao.name,
        pillarShort: ao.short,
        from: ao.score as number,
        to: bo.score as number,
        delta: (bo.score as number) - (ao.score as number),
        fromCoverage: { answered: ao.answered, applicable: ao.total },
        toCoverage: { answered: bo.answered, applicable: bo.total },
      })
      continue
    }
    // Not-applicable in BOTH is silence about a pillar neither capture was
    // asked about — but silence must still be a written fact, so it is an
    // exclusion too, with the reason from either side.
    const reasons: string[] = []
    if (!aScored) reasons.push(notScoredReason(ao, a, 'the earlier snapshot'))
    if (!bScored) reasons.push(notScoredReason(bo, b, 'the later snapshot'))
    exclusions.push({ pillarId: ao.pillarId, pillarName: ao.name, reasons })
  }

  // The overall, over ONLY the comparable pillars' questions — the same
  // weighted mean scoring.ts::overallScore computes, restricted to the set
  // both snapshots measured. Recomposing from rounded pillar means is the
  // drift scoring.ts warns about, so the raw responses are used.
  const comparableIds = new Set(deltas.map((d) => d.pillarId))
  const questions = applicableQuestions(DIAG.questions, a.layer, a.tier)
    .filter((q) => comparableIds.has(q.pillarId))
  const overallFrom = overallScore(questions, answerScores(a.answers))
  const overallTo = overallScore(questions, answerScores(b.answers))
  const overall =
    overallFrom !== null && overallTo !== null
      ? { from: overallFrom, to: overallTo, delta: overallTo - overallFrom, pillarCount: deltas.length }
      : null

  return {
    comparable: true,
    tier: a.tier,
    layer: a.layer,
    deltas,
    exclusions,
    overall,
    citations: citationsOf(a, b),
  }
}
