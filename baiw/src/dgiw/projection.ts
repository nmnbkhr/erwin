/**
 * Framework projection — one evidence base, four scorecards.
 *
 * Every number here is derived from `scoring.ts`. There is no second scoring
 * path: a framework score is a weighted mean of pillar scores, and a pillar
 * score comes from exactly one place. The failure this avoids is the same one
 * `scoring.ts` was extracted to avoid, one level up — a DCAM scorecard that
 * disagrees with the diagnostic the client watched being filled in.
 *
 * TWO SHARES, AND THEY ANSWER DIFFERENT QUESTIONS
 *
 *   retainedShare — how much of the framework's OWN definition of this dimension
 *                   applies under the active layer. A DCAM component with a
 *                   banking-only mapping retains 0.75 in a core engagement:
 *                   a quarter of what DCAM means by it is out of scope.
 *   scoredShare   — how much of what applies was actually MEASURED. Driven by
 *                   which pillars have answers.
 *
 * Collapsing them into one "coverage" number hides whichever is worse. A
 * dimension can be fully retained and barely scored (the assessment is thin), or
 * barely retained and fully scored (the engagement's scope is thin). Those are
 * different conversations with the client and both are printed.
 *
 * THREE STATES, CARRIED UP FROM PILLARS
 *
 *   retainedShare = 0  -> not-applicable  (the framework defines nothing here
 *                                          that this layer puts in scope)
 *   scoredShare   = 0  -> not-assessed    (defined and in scope, nothing measured)
 *   otherwise          -> scored
 *
 * Neither null state may render as 0 or enter any mean, exactly as in
 * `scoring.ts`. A component reported as 0 when the truth is "we did not ask" is
 * a wrong number, not a missing one.
 *
 * ROLL-UP RUNS INSIDE THE FRAMEWORK ONLY
 *
 * leaf -> parent -> framework. Never across the pillar side. A parent's score is
 * the weight-normalised mean of its SCORED children; an unscored child leaves
 * both the numerator and the denominator, the same treatment `scoring.ts` gives
 * an unanswered question. Only leaves carry crosswalk entries, so a parent and
 * its children can never both count the same pillar.
 *
 * TWO INDUCED WEIGHT VECTORS, DELIBERATELY
 *
 * `inducedPillarWeights()` is STRUCTURAL — from the crosswalk alone, no answers.
 * It says what a framework would emphasise if everything were measured, and it
 * is what distinctness between frameworks is judged on.
 *
 * `FrameworkProjection.effectiveWeights` is REALISED — it depends on the answers,
 * because unscored pillars drop out and the remaining weights renormalise. It is
 * the vector for which `overall === Σ W_p · score(p)` actually holds.
 *
 * They coincide only when every mapped pillar is scored. Reporting the realised
 * vector as though it were structural would tell a client their framework
 * emphasises what they happened to answer.
 *
 * Determinism: no clock, no randomness, no reliance on object key order. Every
 * list is sorted by id in code-unit order before it is walked or returned.
 */
import { layerShows } from './layer'
import { applicableQuestions, scorePillars, type PillarOutcome } from './scoring'
import frameworksData from './data/frameworks.json'
import crosswalkData from './data/crosswalk.json'
import pillarsData from './data/pillars.json'
import diagnosticData from './data/diagnostic.json'
import type {
  CrosswalkData,
  CrosswalkEntry,
  DiagnosticData,
  Framework,
  FrameworkDimension,
  FrameworksData,
  Layer,
  LayerFilter,
  Pillar,
} from './types'

const FW = frameworksData as unknown as FrameworksData
const XW = crosswalkData as unknown as CrosswalkData
const PILLARS = pillarsData as Pillar[]
const DIAG = diagnosticData as DiagnosticData

/** Ascending by id, code-unit order. Never `localeCompare` — see report/csv.ts. */
const byId = <T extends { id: string }>(a: T, b: T): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

const FRAMEWORKS: Framework[] = [...FW.frameworks].sort(byId)
const DIMENSIONS: FrameworkDimension[] = [...FW.dimensions].sort(byId)
const ENTRIES: CrosswalkEntry[] = [...XW.entries].sort(byId)

const dimById = new Map(DIMENSIONS.map((d) => [d.id, d]))
const parentIds = new Set(DIMENSIONS.map((d) => d.parentId).filter((p): p is string => p !== null))
const isLeaf = (d: FrameworkDimension): boolean => !parentIds.has(d.id)

const entriesByDim = new Map<string, CrosswalkEntry[]>()
for (const e of ENTRIES) entriesByDim.set(e.dimensionId, [...(entriesByDim.get(e.dimensionId) ?? []), e])

const childrenOf = new Map<string, FrameworkDimension[]>()
for (const d of DIMENSIONS)
  if (d.parentId) childrenOf.set(d.parentId, [...(childrenOf.get(d.parentId) ?? []), d])

const topLevelOf = new Map<string, FrameworkDimension[]>()
for (const d of DIMENSIONS)
  if (d.parentId === null) topLevelOf.set(d.frameworkId, [...(topLevelOf.get(d.frameworkId) ?? []), d])

export type ProjectionState = 'scored' | 'not-assessed' | 'not-applicable'

/** One pillar's share of one dimension's score. These sum to the dimension score. */
export interface PillarContribution {
  pillarId: string
  pillarScore: number
  /** w'(d,p) — renormalised over SCORED pillars, so these sum to 1. */
  weight: number
  /** weight × pillarScore. */
  contribution: number
}

export interface DimensionDecomposition {
  dimensionId: string
  frameworkId: string
  code: string
  name: string
  level: number
  isLeaf: boolean
  state: ProjectionState
  /** null unless state is 'scored'. Never 0 as a stand-in for unmeasured. */
  score: number | null
  /** Share of the dimension's own definition in scope under this layer, 0..1. */
  retainedShare: number
  /** Share of the dimension actually measured, 0..1. Never exceeds retainedShare. */
  scoredShare: number
  /** Empty for parents — only leaves touch pillars. Sorted by pillarId. */
  contributions: PillarContribution[]
}

export interface FrameworkProjection {
  frameworkId: string
  code: string
  name: string
  layer: LayerFilter
  state: ProjectionState
  overall: number | null
  retainedShare: number
  scoredShare: number
  /** Every dimension, leaves and parents, sorted by id. Nothing is dropped. */
  dimensions: DimensionDecomposition[]
  /**
   * REALISED induced pillar weights: `overall === Σ_p effectiveWeights[p] ·
   * score(p)` and the values sum to 1 when the framework is scored. Answers-
   * dependent — see the header note on the two vectors.
   */
  effectiveWeights: Record<string, number>
  /** The framework's own scale, which is not DGIW's 1-5 for DCAM or COBIT. */
  scaleMin: number
  scaleMax: number
}

/**
 * An entry tagged 'both' is visible under every filter; anything else defers to
 * `layerShows`. Composed rather than reimplemented — `layerShows` stays the one
 * scope predicate, and this adds only the third tag the crosswalk introduced.
 */
function entryShows(filter: LayerFilter, entryLayer: Layer | 'both'): boolean {
  return entryLayer === 'both' || layerShows(filter, entryLayer)
}

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0)

/** Pillar outcomes for these answers under this layer. The single source. */
export function pillarOutcomesFor(answers: Record<string, number>, layer: LayerFilter): PillarOutcome[] {
  return scorePillars(PILLARS, applicableQuestions(DIAG.questions, layer), answers)
}

/** Weight of a dimension within its framework, ignoring scoring. */
function structuralWeight(dim: FrameworkDimension): number {
  let w = 1
  let cur: FrameworkDimension | undefined = dim
  // Depth is 2 today; the guard stops a malformed parent cycle from hanging the
  // page rather than trusting check-dgiw to have caught it.
  for (let guard = 0; cur && guard < 8; guard++) {
    w *= cur.weight
    cur = cur.parentId ? dimById.get(cur.parentId) : undefined
  }
  return w
}

function decomposeLeaf(
  dim: FrameworkDimension,
  outcomeById: Map<string, PillarOutcome>,
  layer: LayerFilter,
): DimensionDecomposition {
  const visible = (entriesByDim.get(dim.id) ?? []).filter(
    (e) => entryShows(layer, e.layer) && outcomeById.has(e.pillarId),
  )
  const retainedShare = sum(visible.map((e) => e.coverageWeight))
  const scoredEntries = visible.filter((e) => outcomeById.get(e.pillarId)?.state === 'scored')
  const scoredShare = sum(scoredEntries.map((e) => e.coverageWeight))

  const base = {
    dimensionId: dim.id,
    frameworkId: dim.frameworkId,
    code: dim.code,
    name: dim.name,
    level: dim.level,
    isLeaf: true,
    retainedShare,
    scoredShare,
  }

  if (retainedShare === 0)
    return { ...base, state: 'not-applicable' as const, score: null, contributions: [] }
  if (scoredShare === 0)
    return { ...base, state: 'not-assessed' as const, score: null, contributions: [] }

  const contributions: PillarContribution[] = scoredEntries
    .map((e) => {
      const pillarScore = outcomeById.get(e.pillarId)?.score as number
      const weight = e.coverageWeight / scoredShare
      return { pillarId: e.pillarId, pillarScore, weight, contribution: weight * pillarScore }
    })
    .sort((a, b) => (a.pillarId < b.pillarId ? -1 : a.pillarId > b.pillarId ? 1 : 0))

  return {
    ...base,
    state: 'scored' as const,
    score: sum(contributions.map((c) => c.contribution)),
    contributions,
  }
}

/**
 * Weight-normalised mean over SCORED children, with the two shares carried up as
 * weighted means over ALL children.
 *
 * The shares use every child, not just the scored ones: "how much of this
 * component was measured" has to count the parts that were not.
 */
function rollUp(
  children: { weight: number; part: DimensionDecomposition }[],
): { state: ProjectionState; score: number | null; retainedShare: number; scoredShare: number } {
  const weightTotal = sum(children.map((c) => c.weight))
  const retainedShare = weightTotal ? sum(children.map((c) => c.weight * c.part.retainedShare)) / weightTotal : 0
  const scoredShare = weightTotal ? sum(children.map((c) => c.weight * c.part.scoredShare)) / weightTotal : 0

  const scored = children.filter((c) => c.part.state === 'scored')
  const scoredWeight = sum(scored.map((c) => c.weight))
  if (children.every((c) => c.part.state === 'not-applicable'))
    return { state: 'not-applicable', score: null, retainedShare, scoredShare }
  if (scoredWeight === 0) return { state: 'not-assessed', score: null, retainedShare, scoredShare }
  return {
    state: 'scored',
    score: sum(scored.map((c) => c.weight * (c.part.score as number))) / scoredWeight,
    retainedShare,
    scoredShare,
  }
}

/**
 * Every dimension of a framework, leaves and parents, sorted by id.
 *
 * A first-class export, not a debug aid: it is the surface the invariants are
 * asserted against and the surface C3 renders. A scorecard that cannot show why
 * a component scored 2.4 is a number without an argument.
 */
export function decompose(
  frameworkId: string,
  answers: Record<string, number>,
  layer: LayerFilter,
): DimensionDecomposition[] {
  const outcomeById = new Map(pillarOutcomesFor(answers, layer).map((o) => [o.pillarId, o]))
  const dims = DIMENSIONS.filter((d) => d.frameworkId === frameworkId)
  const out = new Map<string, DimensionDecomposition>()

  for (const d of dims) if (isLeaf(d)) out.set(d.id, decomposeLeaf(d, outcomeById, layer))

  // Parents after leaves. Deepest first, so a level-2 parent would already hold
  // its children's results before a level-1 parent reads it.
  const parents = dims.filter((d) => !isLeaf(d)).sort((a, b) => b.level - a.level || (a.id < b.id ? -1 : 1))
  for (const p of parents) {
    const kids = (childrenOf.get(p.id) ?? [])
      .map((c) => ({ weight: c.weight, part: out.get(c.id) }))
      .filter((c): c is { weight: number; part: DimensionDecomposition } => c.part !== undefined)
    const rolled = rollUp(kids)
    out.set(p.id, {
      dimensionId: p.id,
      frameworkId: p.frameworkId,
      code: p.code,
      name: p.name,
      level: p.level,
      isLeaf: false,
      contributions: [],
      ...rolled,
    })
  }

  return [...out.values()].sort((a, b) => (a.dimensionId < b.dimensionId ? -1 : 1))
}

/**
 * STRUCTURAL induced pillar weights — from the crosswalk alone, no answers.
 *
 * `W_p = Σ_d (effectiveDimensionWeight(d) × w'(d,p))` with w' renormalised over
 * the layer-visible entries, and dimension weights renormalised over the leaves
 * that retain anything. Sums to 1 whenever the framework has any in-scope
 * mapping. Under layer 'all' every entry is visible, so this reduces to the
 * plain product of declared weights.
 */
export function inducedPillarWeights(frameworkId: string, layer: LayerFilter): Record<string, number> {
  const leaves = DIMENSIONS.filter((d) => d.frameworkId === frameworkId && isLeaf(d))
  const rows = leaves
    .map((d) => {
      const visible = (entriesByDim.get(d.id) ?? []).filter((e) => entryShows(layer, e.layer))
      return { weight: structuralWeight(d), retained: sum(visible.map((e) => e.coverageWeight)), visible }
    })
    .filter((r) => r.retained > 0)

  const weightTotal = sum(rows.map((r) => r.weight))
  const out: Record<string, number> = {}
  for (const p of [...PILLARS].sort(byId)) out[p.id] = 0
  if (weightTotal === 0) return out

  for (const r of rows)
    for (const e of r.visible)
      if (out[e.pillarId] !== undefined)
        out[e.pillarId] += (r.weight / weightTotal) * (e.coverageWeight / r.retained)
  return out
}

/**
 * REALISED induced weights, and the coefficient each scored leaf contributes to
 * the framework overall.
 *
 * Walks the same normalisation the roll-up uses, so `overall === Σ W_p ·
 * score(p)` is an identity rather than a coincidence. Computing it any other way
 * would make the reconciliation invariant test two implementations of the same
 * idea instead of testing the engine.
 */
function realisedWeights(
  frameworkId: string,
  parts: Map<string, DimensionDecomposition>,
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const p of [...PILLARS].sort(byId)) out[p.id] = 0

  const walk = (siblings: FrameworkDimension[], share: number): void => {
    const scored = siblings.filter((d) => parts.get(d.id)?.state === 'scored')
    const total = sum(scored.map((d) => d.weight))
    if (total === 0) return
    for (const d of scored) {
      const alpha = share * (d.weight / total)
      if (isLeaf(d)) {
        for (const c of parts.get(d.id)?.contributions ?? [])
          if (out[c.pillarId] !== undefined) out[c.pillarId] += alpha * c.weight
      } else {
        walk((childrenOf.get(d.id) ?? []).slice().sort(byId), alpha)
      }
    }
  }
  walk((topLevelOf.get(frameworkId) ?? []).slice().sort(byId), 1)
  return out
}

export function projectFramework(
  frameworkId: string,
  answers: Record<string, number>,
  layer: LayerFilter,
): FrameworkProjection {
  const framework = FRAMEWORKS.find((f) => f.id === frameworkId)
  if (!framework) throw new Error(`No framework ${frameworkId} in frameworks.json`)

  const dimensions = decompose(frameworkId, answers, layer)
  const parts = new Map(dimensions.map((d) => [d.dimensionId, d]))
  const tops = (topLevelOf.get(frameworkId) ?? [])
    .slice()
    .sort(byId)
    .map((d) => ({ weight: d.weight, part: parts.get(d.id) }))
    .filter((c): c is { weight: number; part: DimensionDecomposition } => c.part !== undefined)
  const rolled = rollUp(tops)

  return {
    frameworkId,
    code: framework.code,
    name: framework.name,
    layer,
    state: rolled.state,
    overall: rolled.score,
    retainedShare: rolled.retainedShare,
    scoredShare: rolled.scoredShare,
    dimensions,
    effectiveWeights: realisedWeights(frameworkId, parts),
    scaleMin: framework.scaleMin,
    scaleMax: framework.scaleMax,
  }
}

/** Every framework, in id order. Nothing is dropped, including unscored ones. */
export function projectAll(answers: Record<string, number>, layer: LayerFilter): FrameworkProjection[] {
  return FRAMEWORKS.map((f) => projectFramework(f.id, answers, layer))
}

/** Framework ids in declared order, for callers that do not want the whole record. */
export function frameworkIds(): string[] {
  return FRAMEWORKS.map((f) => f.id)
}
