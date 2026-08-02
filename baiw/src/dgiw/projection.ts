/**
 * DGIW's binding to the shared projection engine.
 *
 * The engine moved to `src/frameworks/projection.ts` in D5 stage B so TAIW and
 * HAIW can use it. This file is what is left: the three things the engine no
 * longer knows, supplied once.
 *
 *   SPINE      DGIW's eleven pillars. `pillars.json`, unchanged.
 *   OUTCOMES   `scorePillars` over the layer-applicable diagnostic questions.
 *   LAYER      `core` / `banking` / `all`, with `layerShows` as the predicate.
 *
 * THE OUTCOMES FUNCTION IS THE POINT OF THE WHOLE ARRANGEMENT. The engine is
 * handed pillar scores; it never derives one. `scoring.ts` stays the single source
 * of every DGIW figure exactly as before, and when TAIW passes `scoreCategories`
 * over its 35 TACR sections, `maturity.ts` stays the single source of every TAIW
 * figure — by construction, not by anyone remembering. That is D-003's rule
 * expressed as a function signature.
 *
 * WHY `pillarId` BECAME `spineId`. The engine cannot call a TACR section a pillar.
 * DGIW's `crosswalk.json` still says `pillarId` and is unchanged — the adaptation
 * happens once, here, where the two vocabularies meet. Downstream DGIW code reads
 * `spineId` off engine results and `pillarId` off raw crosswalk entries, and both
 * are correct: one is the engine's word, one is the file's.
 *
 * BYTE-IDENTICAL IS THE PASS CONDITION. Stage B is a relocation and a
 * parameterisation with no content change, and all fourteen DGIW golden artefacts
 * must reproduce exactly. That is what the D5 stage-0a coverage was for.
 */
import { layerShows } from './layer'
import { applicableQuestions, scorePillars, type PillarOutcome } from './scoring'
import { createProjectionEngine } from '../frameworks/projection'
import frameworksData from '../frameworks/data/frameworks.json'
import crosswalkData from './data/crosswalk.json'
import pillarsData from './data/pillars.json'
import type { SpineMapping, SpineOutcome } from '../frameworks/types'
import type { CrosswalkData, DiagnosticData, FrameworksData, Layer, LayerFilter, Pillar } from './types'
import diagnosticData from './data/diagnostic.json'

const FW = frameworksData as unknown as FrameworksData
const XW = crosswalkData as unknown as CrosswalkData
const PILLARS = pillarsData as Pillar[]
const DIAG = diagnosticData as DiagnosticData

/**
 * `pillarId` -> `spineId`, once, at construction.
 *
 * The file keeps its own word. Renaming 91 entries would be a content diff riding
 * on a relocation, and the golden record could not then tell the two apart.
 */
const MAPPINGS: SpineMapping[] = XW.entries.map((e) => ({
  id: e.id,
  dimensionId: e.dimensionId,
  spineId: e.pillarId,
  coverageWeight: e.coverageWeight,
  layer: e.layer,
}))

/**
 * An entry tagged 'both' is visible under every filter; anything else defers to
 * `layerShows`. Composed rather than reimplemented — `layerShows` stays the one
 * scope predicate, and this adds only the third tag the crosswalk introduced.
 */
const mappingVisible = (filter: LayerFilter | null, mappingLayer: string | undefined): boolean =>
  mappingLayer === 'both' || filter === null || layerShows(filter, mappingLayer as Layer)

/** Pillar outcomes for these answers under this layer. The single source. */
export function pillarOutcomesFor(answers: Record<string, number>, layer: LayerFilter): PillarOutcome[] {
  return scorePillars(PILLARS, applicableQuestions(DIAG.questions, layer), answers)
}

const engine = createProjectionEngine<Record<string, number>, LayerFilter>({
  frameworks: FW.frameworks,
  dimensions: FW.dimensions,
  mappings: MAPPINGS,
  spine: PILLARS.map((p) => ({ id: p.id, name: p.name })),
  // `PillarOutcome` already carries `pillarId`/`state`/`score`; the rename is the
  // only adaptation, and `score` keeps its null-when-unmeasured contract.
  outcomes: (answers, layer): SpineOutcome[] =>
    pillarOutcomesFor(answers, layer ?? 'all').map((o) => ({
      spineId: o.pillarId,
      state: o.state,
      score: o.score,
    })),
  mappingVisible,
})

export type {
  DimensionDecomposition,
  FrameworkProjection,
  ProjectionState,
  SpineContribution,
} from '../frameworks/projection'

export const decompose = (frameworkId: string, answers: Record<string, number>, layer: LayerFilter) =>
  engine.decompose(frameworkId, answers, layer)

/**
 * Kept under DGIW's own name because eleven pillars are what it induces weights
 * over, and because `multiFrameworkScorecard.ts` prints the vector under a
 * "Pillar" heading. The engine's word is `inducedSpineWeights`.
 */
export const inducedPillarWeights = (frameworkId: string, layer: LayerFilter): Record<string, number> =>
  engine.inducedSpineWeights(frameworkId, layer)

export const projectFramework = (frameworkId: string, answers: Record<string, number>, layer: LayerFilter) =>
  engine.projectFramework(frameworkId, answers, layer)

export const projectAll = (answers: Record<string, number>, layer: LayerFilter) =>
  engine.projectAll(answers, layer)

/** Framework ids in declared order, for callers that do not want the whole record. */
export const frameworkIds = (): string[] => engine.frameworkIds()
