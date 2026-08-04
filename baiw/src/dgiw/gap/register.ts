/**
 * The gap register — the single source of every gap claim in DGIW.
 *
 * G3: `gapRegister()` is to gaps what `layerShows` is to layers and
 * `intakeIsActionable` is to modes — ONE function, imported everywhere,
 * never re-derived. Nothing downstream computes target - current itself:
 * the /gaps page, the gap-statement generator, the scorecard gap columns
 * and AR-54's maturity section all consume `GapEntry` rows built here.
 *
 * ─── A GAP REQUIRES TWO MEASUREMENTS ───────────────────────────────────────
 *
 * A pillar produces a GapEntry only when BOTH facts exist: a target the
 * consultant set (1..5, `dgiw.targets`) and a current score at the ACTIVE
 * tier and layer (`PillarState === 'scored'`). A pillar missing either is
 * absent from the register — never a zero, never a default target, never an
 * assumed current — and is reported by `gapExclusions()` with the reason,
 * because an exclusion a reader cannot see is indistinguishable from a check
 * that did not run. A met or exceeded target (gap <= 0) IS an entry: that is
 * a finding, not a non-event.
 *
 * ─── PRIORITY IS DERIVED, STATED, AND REPRODUCIBLE ─────────────────────────
 *
 *   score = gapSize * (1 + GAIN_DECISIVENESS * decisiveness
 *                        + GAIN_DRIVER       * driverAlignment)
 *
 *   gapSize          max(0, target - current). 0..4 on a 1..5 scale.
 *   decisiveness     share of the leaf framework dimensions visible under the
 *                    active layer that carry at least one crosswalk entry to
 *                    this pillar. 0..1, from crosswalk.json alone — how much
 *                    of the published-framework universe rests on this pillar.
 *                    No cross-framework average is computed; this is a count
 *                    of dimensions, not a blend of their scores.
 *   driverAlignment  share of the engagement's MAPPED drivers whose declared
 *                    `driverPillars` include this pillar. 0..1. The mapping is
 *                    filled by the consultant on /dg/design and validated
 *                    against pillars.json — never inferred by matching driver
 *                    names against pillar names. Unmapped drivers contribute
 *                    nothing.
 *
 * Band derivation (each band is reachable, and a selftest row proves it):
 * the multiplier ranges 1..3, so score ranges 0..12. `met` is gap <= 0 by
 * definition, before any arithmetic. CRITICAL_MIN = 3.0 needs a full-level
 * gap on a pillar that is both decisive and driver-aligned, a two-level gap
 * with either, or a three-level gap on its own. HIGH_MIN = 1.5 is a
 * one-and-a-half-level gap alone, or a one-level gap with meaningful
 * decisiveness or alignment. Everything else with a positive gap is
 * `moderate`. The PDF states this formula and every entry's inputs — no
 * unexplained ranks.
 *
 * Pure on purpose: no hooks, no storage reads — callers pass state in
 * (`useGapRegister` in state.ts wires the live stores), and the GAP-* gates
 * run this exact compiled module against fixtures on every build.
 */
import { applicableQuestions, scorePillars } from '../scoring'
import { mappingVisible } from '../projection'
import {
  answerEvidence,
  answerScores,
  normaliseAnswers,
  type StoredAnswerMap,
} from '../answerShape'
import { mappedDrivers, type ProgramIntake } from '../intake/types'
import type { TargetMap } from '../assessmentState'
import { TIER_META, type AssessmentTier } from '../tier'
import pillarsData from '../data/pillars.json'
import diagnosticData from '../data/diagnostic.json'
import crosswalkData from '../data/crosswalk.json'
import frameworksData from '../../frameworks/data/frameworks.json'
import type {
  CrosswalkData,
  DiagnosticData,
  FrameworksData,
  LayerFilter,
  Pillar,
} from '../types'

const PILLARS = pillarsData as Pillar[]
const DIAG = diagnosticData as DiagnosticData
const XW = crosswalkData as unknown as CrosswalkData
const FW = frameworksData as unknown as FrameworksData

/* ── the priority formula's named constants ────────────────────────────── */

/** Weight of structural decisiveness in the priority multiplier. */
export const GAIN_DECISIVENESS = 1
/** Weight of driver alignment in the priority multiplier. */
export const GAIN_DRIVER = 1
/** score >= this is 'critical'. See the band derivation in the header. */
export const CRITICAL_MIN = 3.0
/** score >= this (and < CRITICAL_MIN) is 'high'. */
export const HIGH_MIN = 1.5

export type PriorityBand = 'critical' | 'high' | 'moderate' | 'met'

export interface GapPriorityInputs {
  /** max(0, target - current) — the positive part of the gap. */
  gapSize: number
  /** Share of visible leaf dimensions with an entry to this pillar. 0..1. */
  decisiveness: number
  /** Share of mapped drivers naming this pillar. 0..1. */
  driverAlignment: number
  /** Keys ('regulatory:0' …) of the mapped drivers naming this pillar. */
  driverIds: string[]
}

export interface GapPriority {
  score: number
  band: PriorityBand
  inputs: GapPriorityInputs
}

export interface FrameworkRef {
  frameworkId: string
  dimensionId: string
  /** Share of THIS DIMENSION the pillar accounts for — crosswalk semantics. */
  coverageWeight: number
}

export interface GapEntry {
  pillarId: string
  pillarName: string
  pillarShort: string
  /** Unrounded weighted mean from scorePillars. Rounding is display-only. */
  current: number
  target: number
  /** target - current. May be <= 0 — a met target is reported, not filtered. */
  gap: number
  tier: AssessmentTier
  /** Answered / applicable questions for THIS pillar at the active tier+layer. */
  coverage: { answered: number; applicable: number }
  priority: GapPriority
  /** Leaf dimensions mapping to this pillar, via the existing engine's data. */
  frameworkRefs: FrameworkRef[]
  /** True when any answered question in this pillar carries an evidence note. */
  evidencePresent: boolean
}

/** Why a pillar is NOT in the register. Listed, never silent. */
export interface GapExclusion {
  pillarId: string
  pillarName: string
  reasons: string[]
}

/** Priority band from a signed gap and the computed score. */
export function priorityBand(gap: number, score: number): PriorityBand {
  if (gap <= 0) return 'met'
  if (score >= CRITICAL_MIN) return 'critical'
  if (score >= HIGH_MIN) return 'high'
  return 'moderate'
}

/* ── internals ─────────────────────────────────────────────────────────── */

const leafDimensionIds = (): Set<string> => {
  const dims = FW.dimensions ?? []
  return new Set(dims.filter((d) => !dims.some((c) => c.parentId === d.id)).map((d) => d.id))
}

interface Assessed {
  entries: GapEntry[]
  exclusions: GapExclusion[]
}

const assess = (
  answers: StoredAnswerMap,
  targets: TargetMap,
  tier: AssessmentTier,
  layer: LayerFilter,
  intake: ProgramIntake | null,
): Assessed => {
  // Both live storage shapes are accepted, through the same lossless lift the
  // answers hook applies — a caller holding a legacy numeric map (the golden
  // fixture is one) gets identical results to one holding the rich shape.
  const rich = normaliseAnswers(answers)
  const questions = applicableQuestions(DIAG.questions, layer, tier)
  const outcomes = scorePillars(PILLARS, questions, answerScores(rich))
  const evidence = answerEvidence(rich)

  const dimById = new Map((FW.dimensions ?? []).map((d) => [d.id, d]))
  const leaves = leafDimensionIds()
  const visible = (XW.entries ?? []).filter(
    (e) => leaves.has(e.dimensionId) && mappingVisible(layer, e.layer),
  )
  const visibleLeafCount = new Set(visible.map((e) => e.dimensionId)).size

  const drivers = intake ? mappedDrivers(intake) : []

  const entries: GapEntry[] = []
  const exclusions: GapExclusion[] = []

  for (const o of outcomes) {
    const target = targets[o.pillarId]
    const reasons: string[] = []
    if (o.state === 'not-applicable') {
      reasons.push(`no applicable questions under the ${layer === 'all' ? 'combined' : layer} layer`)
    } else if (o.state === 'not-assessed') {
      reasons.push(
        `not assessed at the ${TIER_META[tier].label} tier — ${o.total} applicable question${o.total === 1 ? '' : 's'}, none answered`,
      )
    }
    if (target === undefined) reasons.push('no target set')
    if (reasons.length > 0) {
      exclusions.push({ pillarId: o.pillarId, pillarName: o.name, reasons })
      continue
    }

    const current = o.score as number
    const gap = (target as number) - current
    const gapSize = Math.max(0, gap)

    const refs: FrameworkRef[] = visible
      .filter((e) => e.pillarId === o.pillarId)
      .map((e) => ({
        frameworkId: dimById.get(e.dimensionId)?.frameworkId ?? '',
        dimensionId: e.dimensionId,
        coverageWeight: e.coverageWeight,
      }))
    const reachedLeafCount = new Set(refs.map((r) => r.dimensionId)).size
    const decisiveness = visibleLeafCount ? reachedLeafCount / visibleLeafCount : 0

    const naming = drivers.filter((d) => d.pillarIds.includes(o.pillarId))
    const driverAlignment = drivers.length ? naming.length / drivers.length : 0

    const score = gapSize * (1 + GAIN_DECISIVENESS * decisiveness + GAIN_DRIVER * driverAlignment)

    const pillarQuestions = questions.filter((q) => q.pillarId === o.pillarId)
    const evidencePresent = pillarQuestions.some((q) => evidence[q.id] !== undefined)

    entries.push({
      pillarId: o.pillarId,
      pillarName: o.name,
      pillarShort: o.short,
      current,
      target: target as number,
      gap,
      tier,
      coverage: { answered: o.answered, applicable: o.total },
      priority: {
        score,
        band: priorityBand(gap, score),
        inputs: {
          gapSize,
          decisiveness,
          driverAlignment,
          driverIds: naming.map((d) => d.key),
        },
      },
      frameworkRefs: refs,
      evidencePresent,
    })
  }

  // Highest priority first; pillar id as the total-order tiebreak so the
  // register is byte-stable against dataset reordering (AR-54's sort rule).
  entries.sort(
    (a, b) =>
      b.priority.score - a.priority.score ||
      (a.pillarId < b.pillarId ? -1 : a.pillarId > b.pillarId ? 1 : 0),
  )
  return { entries, exclusions }
}

/* ── the two exports every consumer reads ──────────────────────────────── */

/**
 * Every pillar with BOTH measurements at the active tier and layer, highest
 * priority first. The single source of every gap claim.
 */
export function gapRegister(
  answers: StoredAnswerMap,
  targets: TargetMap,
  tier: AssessmentTier,
  layer: LayerFilter,
  intake: ProgramIntake | null,
): GapEntry[] {
  return assess(answers, targets, tier, layer, intake).entries
}

/**
 * Every pillar the register EXCLUDES, with the missing measurement(s) named.
 * Computed by the same pass as `gapRegister` so the pairing rule cannot fork.
 */
export function gapExclusions(
  answers: StoredAnswerMap,
  targets: TargetMap,
  tier: AssessmentTier,
  layer: LayerFilter,
): GapExclusion[] {
  return assess(answers, targets, tier, layer, null).exclusions
}

/**
 * Projected target per leaf framework dimension — the ONE implementation the
 * alignment pack's gap column and the Frameworks screen both read.
 *
 * A dimension gets a projected target ONLY when EVERY pillar its visible
 * crosswalk mapping reaches carries a target; the weights are the mapping's
 * own coverageWeights renormalised over the visible entries, the same convex
 * combination the projection engine applies to scores. Any pillar without a
 * target makes the whole cell null — partial-target arithmetic would be a
 * number built from measurements that do not exist (non-negotiable 1, read at
 * the dimension level). A dimension with no visible mapping is null too.
 */
export function projectedDimensionTargets(
  targets: TargetMap,
  layer: LayerFilter,
): Record<string, number | null> {
  const leaves = leafDimensionIds()
  const byDim = new Map<string, { pillarId: string; coverageWeight: number }[]>()
  for (const e of XW.entries ?? []) {
    if (!leaves.has(e.dimensionId) || !mappingVisible(layer, e.layer)) continue
    byDim.set(e.dimensionId, [
      ...(byDim.get(e.dimensionId) ?? []),
      { pillarId: e.pillarId, coverageWeight: e.coverageWeight },
    ])
  }
  const out: Record<string, number | null> = {}
  for (const id of leaves) {
    const entries = byDim.get(id) ?? []
    const complete = entries.length > 0 && entries.every((e) => targets[e.pillarId] !== undefined)
    if (!complete) {
      out[id] = null
      continue
    }
    const w = entries.reduce((s, e) => s + e.coverageWeight, 0)
    out[id] = entries.reduce((s, e) => s + e.coverageWeight * (targets[e.pillarId] as number), 0) / w
  }
  return out
}
