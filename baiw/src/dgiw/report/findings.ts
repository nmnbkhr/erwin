/**
 * Worst-three as FINDINGS rather than rows.
 *
 * THE DEFECT THIS FIXES
 *
 * DGI04 Decision Rights and DGI05 Accountabilities both map 100% to P01, and
 * nothing else. Their scores are therefore not merely close — they are the same
 * number arrived at the same way, because both are P01's pillar score with a
 * weight of 1. Printing them as two rows of a "weakest three dimensions" table
 * told a client they had three problems to work on when they had one, and it
 * pushed a genuinely distinct third finding off the list.
 *
 * A tie like that is not noise to be broken. It is a fact about the crosswalk —
 * two framework dimensions that DGIW measures through exactly one pillar cannot
 * disagree — and the honest presentation states the cause rather than hiding it
 * behind a tiebreaker or, worse, adjusting weights until the display looks
 * better. (That second option was considered and rejected: see
 * `docs/dgi-p01-concentration.md`. It would have traded a real property of DGI
 * for a cosmetic one.)
 *
 * COLLAPSE IS DELIBERATELY NARROW
 *
 * Two leaves collapse only when the score is EXACTLY equal AND the decomposition
 * is identical — same pillars, same renormalised weights, same pillar scores.
 * Two leaves that land on the same number through different pillars are two
 * findings that happen to coincide today, they will diverge the moment one
 * answer changes, and merging them would be a false claim about why they agree.
 *
 * Equality is exact, not epsilon-based. Identical decompositions produce
 * bit-identical scores because they are the same arithmetic over the same
 * inputs, so a tolerance would only ever merge things that are genuinely
 * different — the failure mode that actually costs a client something.
 *
 * ONE COPY, TWO SURFACES
 *
 * The page and the multi-framework scorecard both call this. A PDF that
 * disagrees with the screen is worse than no PDF, and "which three findings"
 * is exactly the kind of derived judgement that drifts when it is written twice.
 */
import type { DimensionDecomposition, FrameworkProjection } from '../projection'
import pillarsData from '../data/pillars.json'
import type { Pillar } from '../types'

const PILLARS = pillarsData as Pillar[]

/** The pillar's published name, not its short label — a cause line has room. */
const pillarName = (id: string): string => PILLARS.find((p) => p.id === id)?.name ?? id

export interface Finding {
  /**
   * The leaves that resolve to this one finding, sorted by dimension id.
   * Length 1 for an ordinary finding, more when a tie collapsed.
   */
  leaves: DimensionDecomposition[]
  /** Shared by every leaf in the finding, by construction. */
  score: number
  /** `leaves.map(l => l.code)`, for labelling. */
  codes: string[]
  /**
   * Why these leaves are one finding, or null when there is only one leaf.
   * Rendered verbatim by both surfaces so they cannot word it differently.
   */
  cause: string | null
}

/**
 * The grouping key. Score first, then every contribution in full.
 *
 * `contributions` is already sorted by pillarId in `projection.ts`, so equal
 * decompositions produce equal strings without re-sorting here. Numbers are
 * stringified at full double precision — JS emits the shortest round-tripping
 * form, which is injective over distinct doubles, so this is exact equality and
 * not a rounded comparison.
 */
const signature = (d: DimensionDecomposition): string =>
  [
    String(d.score),
    ...d.contributions.map((c) => `${c.spineId}:${c.weight}:${c.spineScore}`),
  ].join('|')

/** "all mapped wholly to P01 Governance & Operating Model", or the multi-pillar form. */
function causeFor(d: DimensionDecomposition, count: number): string {
  if (d.contributions.length === 1) {
    const c = d.contributions[0]
    return `all ${count} mapped wholly to ${c.spineId} ${pillarName(c.spineId)}`
  }
  const parts = d.contributions
    .slice()
    .sort((a, b) => b.weight - a.weight || (a.spineId < b.spineId ? -1 : 1))
    .map((c) => `${c.spineId} ${pillarName(c.spineId)} ${Math.round(c.weight * 100)}%`)
  return `all ${count} mapped identically across ${parts.join(', ')}`
}

/**
 * Group scored leaves into findings. Unscored leaves are not findings and are
 * dropped here — `not-assessed` and `not-applicable` are reported elsewhere as
 * themselves and must never enter a ranking as a low score.
 */
export function collapseFindings(leaves: readonly DimensionDecomposition[]): Finding[] {
  const groups = new Map<string, DimensionDecomposition[]>()
  for (const d of leaves) {
    if (!d.isLeaf || d.state !== 'scored' || d.score === null) continue
    const k = signature(d)
    groups.set(k, [...(groups.get(k) ?? []), d])
  }
  return [...groups.values()]
    .map((g) => {
      const sorted = [...g].sort((a, b) => (a.dimensionId < b.dimensionId ? -1 : 1))
      return {
        leaves: sorted,
        score: sorted[0].score as number,
        codes: sorted.map((d) => d.code),
        cause: sorted.length > 1 ? causeFor(sorted[0], sorted.length) : null,
      }
    })
    .sort(
      (a, b) =>
        a.score - b.score || (a.leaves[0].dimensionId < b.leaves[0].dimensionId ? -1 : 1),
    )
}

/**
 * The n weakest DISTINCT findings — n findings, which may be more than n leaves.
 *
 * Callers must say how many leaves the result covers; `leafCount` is here so
 * neither surface counts it by hand.
 */
export function worstFindings(p: FrameworkProjection, n = 3): Finding[] {
  return collapseFindings(p.dimensions.filter((d) => d.isLeaf)).slice(0, n)
}

/** Total leaves represented by a set of findings. */
export const leafCount = (fs: readonly Finding[]): number =>
  fs.reduce((a, f) => a + f.leaves.length, 0)

/** Label for a finding's dimension column: "DGI04, DGI05" or just "DM11". */
export const findingCodes = (f: Finding): string => f.codes.join(', ')

/**
 * Dimension names for a finding. Kept separate from the codes so a table can put
 * them in different columns, as both surfaces do.
 */
export const findingNames = (f: Finding): string => f.leaves.map((d) => d.name).join(' · ')
