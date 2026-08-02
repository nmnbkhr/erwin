/**
 * Published framework structure — the suite's, not any one module's.
 *
 * `frameworks.json` lived under `src/dgiw/data/` because DGIW authored it and was
 * the only consumer. It carries no pillar references and never did: every
 * DGIW-specific fact is in `crosswalk.json`, which stays where it is. The seam was
 * already in the right place, so D5 stage B moved the file rather than splitting
 * it.
 *
 * These types are declared HERE and re-exported by `src/dgiw/types.ts`, so the
 * many `import type { Framework } from './types'` call sites keep working against
 * one declaration. Two structurally-identical copies would compile, and would be
 * the shape `CATEGORY-UNIVERSE` exists to reject one level up.
 */

/** A published framework: DMBOK2, DCAM, DGI, COBIT 2019. */
export interface Framework {
  id: string
  /** The framework's own short code — DMBOK2, DCAM, DGI, COBIT2019. */
  code: string
  name: string
  publisher: string
  versionLabel: string
  /**
   * The framework's own maturity scale, which is NOT DGIW's 1-5 in every case:
   * DCAM scores 1-6 and COBIT 2019 uses capability levels 0-5. Recorded so a
   * scorecard rescales explicitly rather than silently presenting a 1-5 score
   * under a 0-5 heading.
   */
  scaleMin: number
  scaleMax: number
  /**
   * How confident we are in the DIMENSION NAMES AND CODES, which are published
   * structure. The weights beside them are ours and carry no confidence mark
   * because they are not claims about the source.
   */
  structureConfidence: 'high' | 'medium-high' | 'medium' | 'low'
  structureNotes: string
}

export interface FrameworkDimension {
  id: string
  frameworkId: string
  /** null at level 1. Frameworks without hierarchy use null throughout. */
  parentId: string | null
  /** The framework's own code — DM01, DCAM5, APO14.02. */
  code: string
  name: string
  /**
   * Share of the parent (of the framework, at level 1). Editorial judgement —
   * none of these frameworks publishes dimension weights. Siblings sum to 1.0, so
   * effective leaf weights sum to 1.0 per framework.
   */
  weight: number
  level: number
}

export interface FrameworksData {
  frameworks: Framework[]
  dimensions: FrameworkDimension[]
}

/**
 * One node of a module's SPINE — the thing a framework dimension projects onto.
 *
 * DGIW's spine is its eleven pillars. TAIW's will be its 35 TACR sections and
 * HAIW's its 80 HACR subcategories. The engine does not care which, and must not:
 * a TACR section is not a pillar, and shared code that called it one would be the
 * rename-the-column-to-make-it-defensible shape CLAUDE.md rejects.
 */
export interface SpineNode {
  id: string
  name: string
}

export type SpineState = 'scored' | 'not-assessed' | 'not-applicable'

/**
 * One spine node's score, as the OWNING MODULE computed it.
 *
 * This is the injected boundary and it is the load-bearing part of the whole
 * design. The engine never computes a score; it is handed them. DGIW passes
 * `scorePillars`, TAIW and HAIW will pass `scoreCategories` over their finer
 * grouping. That is what keeps the D-003 single-scoring-path rule true BY
 * CONSTRUCTION rather than by discipline — if the engine derived scores itself,
 * a second scoring path would exist the moment a second module used it.
 */
export interface SpineOutcome {
  spineId: string
  state: SpineState
  /** null unless state is 'scored'. Never 0 standing in for unmeasured. */
  score: number | null
}

/**
 * One dimension → spine-node mapping.
 *
 * `layer` is optional and free-form: only the owning module knows what its layers
 * mean, so the engine takes a predicate rather than a vocabulary. DGIW passes
 * `core`/`banking`/`both`; TAIW and HAIW have no layer at all and pass neither.
 */
export interface SpineMapping {
  id: string
  dimensionId: string
  spineId: string
  /** In (0, 1]. Sums to 1.0 per leaf dimension over the full entry set. */
  coverageWeight: number
  layer?: string
}
