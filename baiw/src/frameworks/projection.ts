/**
 * Framework projection — one evidence base, N scorecards, any module's spine.
 *
 * This is `src/dgiw/projection.ts` with three things lifted out into arguments and
 * NOTHING else changed. D5 stage B is a relocation and a parameterisation; every
 * DGIW artefact must come out byte-identical, and that is the pass condition
 * rather than a hoped-for side effect.
 *
 * ─── WHAT WAS HARDCODED, AND WHY EACH BECAME A PARAMETER ───────────────────
 *
 *   PILLARS          -> `spine: SpineNode[]`. DGIW's eleven pillars, TAIW's 35
 *                       TACR sections, HAIW's 80 HACR subcategories.
 *   scorePillars()   -> `outcomes(answers, layer)`. THE LOAD-BEARING ONE, below.
 *   LayerFilter      -> `layer` is opaque and optional. Only the owning module
 *                       knows what its layers mean; TACR and HACR have none.
 *
 * THE INJECTED OUTCOMES FUNCTION IS WHY THIS FILE IS SAFE TO SHARE. The engine
 * never computes a score. It is handed one per spine node and combines them. If
 * it derived them itself there would be a second scoring path the moment a second
 * module used it, which is precisely the defect `src/scoring/maturity.ts` and
 * `src/dgiw/scoring.ts` were extracted to end. D-003, one level up: the rule holds
 * by construction rather than by discipline.
 *
 * ─── EVERYTHING BELOW THIS LINE IS UNCHANGED IN SUBSTANCE ──────────────────
 *
 * TWO SHARES, AND THEY ANSWER DIFFERENT QUESTIONS
 *
 *   retainedShare — how much of the framework's OWN definition of this dimension
 *                   applies under the active layer. A DCAM component with a
 *                   banking-only mapping retains 0.75 in a core engagement:
 *                   a quarter of what DCAM means by it is out of scope.
 *   scoredShare   — how much of what applies was actually MEASURED. Driven by
 *                   which spine nodes have answers.
 *
 * Collapsing them into one "coverage" number hides whichever is worse. A
 * dimension can be fully retained and barely scored (the assessment is thin), or
 * barely retained and fully scored (the engagement's scope is thin). Those are
 * different conversations with the client and both are printed.
 *
 * THREE STATES, CARRIED UP FROM THE SPINE
 *
 *   retainedShare = 0  -> not-applicable  (the framework defines nothing here
 *                                          that this layer puts in scope)
 *   scoredShare   = 0  -> not-assessed    (defined and in scope, nothing measured)
 *   otherwise          -> scored
 *
 * Neither null state may render as 0 or enter any mean. A component reported as 0
 * when the truth is "we did not ask" is a wrong number, not a missing one.
 *
 * ROLL-UP RUNS INSIDE THE FRAMEWORK ONLY
 *
 * leaf -> parent -> framework. Never across the spine side. A parent's score is
 * the weight-normalised mean of its SCORED children; an unscored child leaves
 * both the numerator and the denominator. Only leaves carry mappings, so a parent
 * and its children can never both count the same spine node.
 *
 * TWO INDUCED WEIGHT VECTORS, DELIBERATELY
 *
 * `inducedSpineWeights()` is STRUCTURAL — from the mappings alone, no answers.
 * It says what a framework would emphasise if everything were measured, and it
 * is what distinctness between frameworks is judged on.
 *
 * `FrameworkProjection.effectiveWeights` is REALISED — it depends on the answers,
 * because unscored nodes drop out and the remaining weights renormalise. It is
 * the vector for which `overall === Σ W_s · score(s)` actually holds.
 *
 * They coincide only when every mapped node is scored. Reporting the realised
 * vector as though it were structural would tell a client their framework
 * emphasises what they happened to answer.
 *
 * Determinism: no clock, no randomness, no reliance on object key order. Every
 * list is sorted by id in code-unit order before it is walked or returned.
 */
import type {
  Framework,
  FrameworkDimension,
  SpineMapping,
  SpineNode,
  SpineOutcome,
} from './types'

export type ProjectionState = 'scored' | 'not-assessed' | 'not-applicable'

/** One spine node's share of one dimension's score. These sum to the dimension score. */
export interface SpineContribution {
  spineId: string
  spineScore: number
  /** w'(d,s) — renormalised over SCORED nodes, so these sum to 1. */
  weight: number
  /** weight × spineScore. */
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
  /** Empty for parents — only leaves touch the spine. Sorted by spineId. */
  contributions: SpineContribution[]
}

export interface FrameworkProjection {
  frameworkId: string
  code: string
  name: string
  /** Whatever the owning module passed. `null` for a module without layers. */
  layer: string | null
  state: ProjectionState
  overall: number | null
  retainedShare: number
  scoredShare: number
  /** Every dimension, leaves and parents, sorted by id. Nothing is dropped. */
  dimensions: DimensionDecomposition[]
  /**
   * REALISED induced spine weights: `overall === Σ_s effectiveWeights[s] ·
   * score(s)` and the values sum to 1 when the framework is scored. Answers-
   * dependent — see the header note on the two vectors.
   */
  effectiveWeights: Record<string, number>
  /** The framework's own scale, which is not 1-5 for DCAM or COBIT. */
  scaleMin: number
  scaleMax: number
}

export interface ProjectionEngineConfig<Answers, Layer extends string = string> {
  frameworks: readonly Framework[]
  dimensions: readonly FrameworkDimension[]
  mappings: readonly SpineMapping[]
  spine: readonly SpineNode[]
  /**
   * The owning module's scoring, injected. See the header: this is the boundary
   * that keeps one scoring path per module.
   */
  outcomes: (answers: Answers, layer: Layer | null) => readonly SpineOutcome[]
  /**
   * Whether a mapping is visible under a layer. Omit for a module with no layer
   * concept, which makes every mapping always visible — TACR and HACR carry no
   * layer field at all, confirmed against both datasets in the D5 design report.
   */
  mappingVisible?: (layer: Layer | null, mappingLayer: string | undefined) => boolean
}

export interface ProjectionEngine<Answers, Layer extends string = string> {
  decompose: (frameworkId: string, answers: Answers, layer?: Layer | null) => DimensionDecomposition[]
  inducedSpineWeights: (frameworkId: string, layer?: Layer | null) => Record<string, number>
  projectFramework: (frameworkId: string, answers: Answers, layer?: Layer | null) => FrameworkProjection
  projectAll: (answers: Answers, layer?: Layer | null) => FrameworkProjection[]
  frameworkIds: () => string[]
  spineOutcomesFor: (answers: Answers, layer?: Layer | null) => readonly SpineOutcome[]
}

/** Ascending by id, code-unit order. Never `localeCompare` — see report/csv.ts. */
const byId = <T extends { id: string }>(a: T, b: T): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0)

export function createProjectionEngine<Answers, Layer extends string = string>(
  config: ProjectionEngineConfig<Answers, Layer>,
): ProjectionEngine<Answers, Layer> {
  const FRAMEWORKS: Framework[] = [...config.frameworks].sort(byId)
  const DIMENSIONS: FrameworkDimension[] = [...config.dimensions].sort(byId)
  const MAPPINGS: SpineMapping[] = [...config.mappings].sort(byId)
  const SPINE: SpineNode[] = [...config.spine].sort(byId)
  // Default: no layer concept, so every mapping is always visible.
  const visible = config.mappingVisible ?? (() => true)

  const dimById = new Map(DIMENSIONS.map((d) => [d.id, d]))
  const parentIds = new Set(DIMENSIONS.map((d) => d.parentId).filter((p): p is string => p !== null))
  const isLeaf = (d: FrameworkDimension): boolean => !parentIds.has(d.id)

  const mappingsByDim = new Map<string, SpineMapping[]>()
  for (const e of MAPPINGS) mappingsByDim.set(e.dimensionId, [...(mappingsByDim.get(e.dimensionId) ?? []), e])

  const childrenOf = new Map<string, FrameworkDimension[]>()
  for (const d of DIMENSIONS)
    if (d.parentId) childrenOf.set(d.parentId, [...(childrenOf.get(d.parentId) ?? []), d])

  const topLevelOf = new Map<string, FrameworkDimension[]>()
  for (const d of DIMENSIONS)
    if (d.parentId === null) topLevelOf.set(d.frameworkId, [...(topLevelOf.get(d.frameworkId) ?? []), d])

  const spineOutcomesFor = (answers: Answers, layer: Layer | null = null): readonly SpineOutcome[] =>
    config.outcomes(answers, layer)

  /** Weight of a dimension within its framework, ignoring scoring. */
  function structuralWeight(dim: FrameworkDimension): number {
    let w = 1
    let cur: FrameworkDimension | undefined = dim
    // Depth is 2 today; the guard stops a malformed parent cycle from hanging the
    // page rather than trusting the gate to have caught it.
    for (let guard = 0; cur && guard < 8; guard++) {
      w *= cur.weight
      cur = cur.parentId ? dimById.get(cur.parentId) : undefined
    }
    return w
  }

  function decomposeLeaf(
    dim: FrameworkDimension,
    outcomeById: Map<string, SpineOutcome>,
    layer: Layer | null,
  ): DimensionDecomposition {
    const shown = (mappingsByDim.get(dim.id) ?? []).filter(
      (e) => visible(layer, e.layer) && outcomeById.has(e.spineId),
    )
    const retainedShare = sum(shown.map((e) => e.coverageWeight))
    const scoredEntries = shown.filter((e) => outcomeById.get(e.spineId)?.state === 'scored')
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

    const contributions: SpineContribution[] = scoredEntries
      .map((e) => {
        const spineScore = outcomeById.get(e.spineId)?.score as number
        const weight = e.coverageWeight / scoredShare
        return { spineId: e.spineId, spineScore, weight, contribution: weight * spineScore }
      })
      .sort((a, b) => (a.spineId < b.spineId ? -1 : a.spineId > b.spineId ? 1 : 0))

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
   * asserted against and the surface a scorecard renders. A scorecard that cannot
   * show why a component scored 2.4 is a number without an argument.
   */
  function decompose(frameworkId: string, answers: Answers, layer: Layer | null = null): DimensionDecomposition[] {
    const outcomeById = new Map(spineOutcomesFor(answers, layer).map((o) => [o.spineId, o]))
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
   * STRUCTURAL induced spine weights — from the mappings alone, no answers.
   *
   * `W_s = Σ_d (effectiveDimensionWeight(d) × w'(d,s))` with w' renormalised over
   * the layer-visible mappings, and dimension weights renormalised over the leaves
   * that retain anything. Sums to 1 whenever the framework has any in-scope
   * mapping. With no layer filter every mapping is visible, so this reduces to the
   * plain product of declared weights.
   */
  function inducedSpineWeights(frameworkId: string, layer: Layer | null = null): Record<string, number> {
    const leaves = DIMENSIONS.filter((d) => d.frameworkId === frameworkId && isLeaf(d))
    const rows = leaves
      .map((d) => {
        const shown = (mappingsByDim.get(d.id) ?? []).filter((e) => visible(layer, e.layer))
        return { weight: structuralWeight(d), retained: sum(shown.map((e) => e.coverageWeight)), shown }
      })
      .filter((r) => r.retained > 0)

    const weightTotal = sum(rows.map((r) => r.weight))
    const out: Record<string, number> = {}
    for (const s of SPINE) out[s.id] = 0
    if (weightTotal === 0) return out

    for (const r of rows)
      for (const e of r.shown)
        if (out[e.spineId] !== undefined)
          out[e.spineId] += (r.weight / weightTotal) * (e.coverageWeight / r.retained)
    return out
  }

  /**
   * REALISED induced weights, and the coefficient each scored leaf contributes to
   * the framework overall.
   *
   * Walks the same normalisation the roll-up uses, so `overall === Σ W_s ·
   * score(s)` is an identity rather than a coincidence. Computing it any other way
   * would make the reconciliation invariant test two implementations of the same
   * idea instead of testing the engine.
   */
  function realisedWeights(
    frameworkId: string,
    parts: Map<string, DimensionDecomposition>,
  ): Record<string, number> {
    const out: Record<string, number> = {}
    for (const s of SPINE) out[s.id] = 0

    const walk = (siblings: FrameworkDimension[], share: number): void => {
      const scored = siblings.filter((d) => parts.get(d.id)?.state === 'scored')
      const total = sum(scored.map((d) => d.weight))
      if (total === 0) return
      for (const d of scored) {
        const alpha = share * (d.weight / total)
        if (isLeaf(d)) {
          for (const c of parts.get(d.id)?.contributions ?? [])
            if (out[c.spineId] !== undefined) out[c.spineId] += alpha * c.weight
        } else {
          walk((childrenOf.get(d.id) ?? []).slice().sort(byId), alpha)
        }
      }
    }
    walk((topLevelOf.get(frameworkId) ?? []).slice().sort(byId), 1)
    return out
  }

  function projectFramework(frameworkId: string, answers: Answers, layer: Layer | null = null): FrameworkProjection {
    const framework = FRAMEWORKS.find((f) => f.id === frameworkId)
    if (!framework) throw new Error(`No framework ${frameworkId} in the declared framework set`)

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
  function projectAll(answers: Answers, layer: Layer | null = null): FrameworkProjection[] {
    return FRAMEWORKS.map((f) => projectFramework(f.id, answers, layer))
  }

  return {
    decompose,
    inducedSpineWeights,
    projectFramework,
    projectAll,
    frameworkIds: () => FRAMEWORKS.map((f) => f.id),
    spineOutcomesFor,
  }
}
