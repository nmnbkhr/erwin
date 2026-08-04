/**
 * Per-pillar plan slices — the ONE composition from the gap register to plans.
 *
 * G4: `planSlices()` turns GapEntry rows into per-pillar implementation
 * slices: the pillar's catalogued deliverables, the waves that list it, and a
 * dependency-honouring sequence. Consumed by the pillar-plan generator, the
 * ImplementationPlan page's engagement view, AR-04's gap-driven section and
 * the Diagnostic's roadmap — the master roadmap is a composition of slices,
 * never a hand-authored parallel claim.
 *
 * ─── EVERY GAP FACT IS PASS-THROUGH ────────────────────────────────────────
 *
 * The GapEntry rides on the slice BY REFERENCE. Nothing here recomputes a
 * gap, a band or a priority — gapRegister() is the single source of every gap
 * claim (G3), and the SLICE-SOURCE gate mutates an entry post-hoc to prove
 * the slice reflects the mutation rather than a private copy.
 *
 * ─── WHAT A DELIVERABLE'S WAVE PLACEMENT IS, AND IS NOT ────────────────────
 *
 * AR-54's B_NO_WAVE_ROW is load-bearing here: NO dataset attaches an artefact
 * to a wave, and composing artefact -> pillar -> wave is the forbidden bridge
 * (it puts AR-09 in W6 because both name P01). The ONLY artefact-to-wave
 * relation that exists at all is exact name identity between a register row's
 * `artefact` and a wave's free-text deliverable string — measured at 1 of 35
 * when AR-54 was built. So `waveId` here is that exact-match key and nothing
 * looser: almost every deliverable carries `waveId: null`, and that is the
 * honest state of the data, listed rather than dropped. The wave view of a
 * slice comes from the REAL key instead: wave.pillarIds -> pillar
 * (`why: 'pillar-listed'`).
 *
 * ─── SEQUENCE: STRUCTURE BEATS PRIORITY ────────────────────────────────────
 *
 * The sequence is a topological order over `dependsOn`, tie-broken by the
 * declared wave ordinal. Priority never reorders across a dependency edge: a
 * critical-band gap whose waves sit late stays late, and the slice SAYS what
 * holds it (`heldBy` — the transitive dependsOn closure) rather than jumping
 * the queue. On a dependency cycle (WAVE-CYCLE guards the dataset, but this
 * function must stay total) the remaining waves fall back to ordinal order.
 *
 * ─── LAYER: THE BANKING OVERLAY IS ADDITIVE ────────────────────────────────
 *
 * A banking engagement runs the core waves AND the banking ones — the
 * Diagnostic's derivedRoadmap learned this the hard way (its `shows()` filter
 * hid every core wave in banking-only mode). That additive rule lives HERE
 * now, once: a wave is visible when it is core or when `layerShows` admits
 * its layer; register rows filter through plain `layerShows` as everywhere.
 *
 * Pure on purpose: no hooks, no storage reads, no clock — callers pass state
 * in (`plan/state.ts` wires the live stores once), and the SLICE-* gates run
 * this exact compiled module on every build.
 */
import { layerShows } from '../layer'
import type { GapEntry } from '../gap/register'
import { intakeIsActionable, validScopeIds, type ProgramIntake } from '../intake/types'
import type {
  ArtefactRegisterEntry,
  ImplementationPlanData,
  LayerFilter,
  PlanWave,
} from '../types'

/* ── the invariant statements, exported so gates and PDFs share one text ── */

export const B_NO_EFFORT =
  'NO INVENTED EFFORT. Nothing in this plan carries person-days, FTEs, costs or calendar dates — ' +
  'no dataset holds them and no formula here fabricates them. The only durations shown are the ' +
  'reference wave plan\'s own week windows, verbatim. Mapping windows to a calendar and staffing ' +
  'them are engagement decisions, not made here.'

export const B_STRUCTURE_OVER_PRIORITY =
  'STRUCTURE BEATS PRIORITY. Sequencing respects the wave plan\'s declared dependencies ' +
  'absolutely; priority reorders nothing across a dependency edge. A critical gap whose waves ' +
  'sit behind unmet predecessors stays where the structure puts it, and the plan states what ' +
  'holds it rather than letting urgency rewrite the dependency graph.'

export const B_THIN_IS_INFORMATION =
  'A THIN SLICE IS INFORMATION, NOT A GAP TO PAD. A pillar whose register carries one or two ' +
  'catalogued deliverables gets a one- or two-line plan, flagged as thin. Padding it with ' +
  'generated prose about what a client "should" do would be content nobody authored — the ' +
  'register and the waves say what they say, and this plan says no more.'

/**
 * The standard assumptions block — ONE text, shared by the generator (printed
 * once per document) and the PLAN-EFFORT gate (which requires it beside any
 * week window). ASCII only (D-019).
 */
export const PLAN_ASSUMPTIONS: readonly string[] = [
  'Week windows are the reference wave plan\'s, verbatim. They are relative sequence windows, not calendar commitments.',
  'Mapping windows to calendar dates, staffing levels and cost are engagement decisions taken with the sponsor; none is derived or implied here.',
  'Wave dependencies are the reference plan\'s declared structure; an engagement may re-scope a wave, and this plan does not anticipate that.',
]

/* ── shapes ────────────────────────────────────────────────────────────── */

export interface SliceDeliverable {
  artefactId: string
  artefact: string
  rung: number
  format: string
  owner: string
  /** The register's own disposition — a blocked row is not a remedy (AR-54). */
  builtFrom: ArtefactRegisterEntry['builtFrom']
  /**
   * Exact-name-identity wave placement, or null. See the header: 1 of 35 wave
   * deliverable strings matches a register artefact name; null is the norm.
   */
  waveId: string | null
}

export interface SliceWave {
  waveId: string
  name: string
  /** The wave's own week window, verbatim — never restated or converted. */
  weeks: string
  /** The real key that put this wave on the slice. */
  why: 'pillar-listed'
  /** Transitive dependsOn closure, ordinal order — what must run first. */
  heldBy: string[]
}

export interface PillarPlanSlice {
  pillarId: string
  pillarName: string
  /** The GapEntry, BY REFERENCE — never copied field-by-field (SLICE-SOURCE). */
  entry: GapEntry
  deliverables: SliceDeliverable[]
  waves: SliceWave[]
  /** Slice waves in dependency-honouring order (topological, ordinal ties). */
  sequence: string[]
  /** Two or fewer deliverables. Information, not a gap to pad. */
  thin: boolean
  /** The shared assumptions block, on every slice so no consumer forgets it. */
  assumptions: readonly string[]
}

/** Why an entry-bearing pillar has NO slice. Listed, never silent. */
export interface SliceExclusion {
  pillarId: string
  pillarName: string
  reasons: string[]
}

export const THIN_DELIVERABLE_MAX = 2

/* ── internals ─────────────────────────────────────────────────────────── */

/**
 * Topological order over dependsOn for ALL waves, ties and cycle remainders
 * broken by the declared wave ordinal. Total by construction.
 */
export function waveSequence(waves: PlanWave[]): string[] {
  const byOrdinal = [...waves].sort((a, b) => a.wave - b.wave || (a.id < b.id ? -1 : 1))
  const ids = new Set(byOrdinal.map((w) => w.id))
  const placed = new Set<string>()
  const out: string[] = []
  let remaining = byOrdinal
  while (remaining.length > 0) {
    const ready = remaining.filter((w) =>
      (w.dependsOn ?? []).every((d) => !ids.has(d) || placed.has(d)),
    )
    // A cycle leaves nothing ready; take the lowest ordinal so the function
    // stays total. WAVE-CYCLE fails the build on the dataset; this branch
    // exists so a slice never crashes on data the gate is about to reject.
    const batch = ready.length > 0 ? ready : [remaining[0]]
    for (const w of batch) {
      out.push(w.id)
      placed.add(w.id)
    }
    remaining = remaining.filter((w) => !placed.has(w.id))
  }
  return out
}

/** Transitive dependsOn closure of one wave, ordinal order. */
const heldByChain = (wave: PlanWave, byId: Map<string, PlanWave>): string[] => {
  const seen = new Set<string>()
  const visit = (id: string) => {
    for (const dep of byId.get(id)?.dependsOn ?? []) {
      if (seen.has(dep)) continue
      seen.add(dep)
      visit(dep)
    }
  }
  visit(wave.id)
  return [...seen].sort((a, b) => (byId.get(a)?.wave ?? 0) - (byId.get(b)?.wave ?? 0) || (a < b ? -1 : 1))
}

/** The additive wave-visibility rule — see the header. */
const waveVisible = (layer: LayerFilter, wave: PlanWave): boolean =>
  wave.layer === 'core' || layerShows(layer, wave.layer)

interface Sliced {
  slices: PillarPlanSlice[]
  exclusions: SliceExclusion[]
}

const compose = (
  entries: GapEntry[],
  intake: ProgramIntake | null,
  plan: ImplementationPlanData,
  layer: LayerFilter,
): Sliced => {
  const slices: PillarPlanSlice[] = []
  const exclusions: SliceExclusion[] = []

  const actionable = intake !== null && intakeIsActionable(intake)
  const scope = actionable ? new Set(validScopeIds(intake as ProgramIntake)) : new Set<string>()

  const visibleWaves = (plan.waves ?? []).filter((w) => waveVisible(layer, w))
  const waveById = new Map(visibleWaves.map((w) => [w.id, w]))
  const fullSequence = waveSequence(visibleWaves)
  // The one artefact->wave key that exists: exact name identity with a wave
  // deliverable string. Built over VISIBLE waves so placement respects scope.
  const waveByDeliverableName = new Map<string, string>()
  for (const w of visibleWaves)
    for (const d of w.deliverables ?? [])
      if (!waveByDeliverableName.has(d)) waveByDeliverableName.set(d, w.id)

  for (const entry of entries) {
    if (!actionable) {
      exclusions.push({
        pillarId: entry.pillarId,
        pillarName: entry.pillarName,
        reasons: ['no actionable intake — the engagement scope is undefined, so no pillar is in scope for planning'],
      })
      continue
    }
    if (!scope.has(entry.pillarId)) {
      exclusions.push({
        pillarId: entry.pillarId,
        pillarName: entry.pillarName,
        reasons: ["not in the engagement's pillar scope (Program Design intake) — measured, but not being planned"],
      })
      continue
    }

    // (a) the pillar's catalogued register rows, disposition kept. Withdrawn
    // rows are retired shapes, not deliverables; everything else is listed
    // WITH its disposition so a blocked row cannot read as a remedy.
    const deliverables: SliceDeliverable[] = (plan.artefactRegister ?? [])
      .filter((a) => a.pillarId === entry.pillarId && layerShows(layer, a.layer))
      .filter((a) => a.builtFrom.evidence !== 'withdrawn')
      .map((a) => ({
        artefactId: a.id,
        artefact: a.artefact,
        rung: a.rung,
        format: a.format,
        owner: a.owner,
        builtFrom: a.builtFrom,
        waveId: waveByDeliverableName.get(a.artefact) ?? null,
      }))

    // (b) the waves that LIST the pillar — the real key.
    const waves: SliceWave[] = visibleWaves
      .filter((w) => (w.pillarIds ?? []).includes(entry.pillarId))
      .sort((a, b) => a.wave - b.wave || (a.id < b.id ? -1 : 1))
      .map((w) => ({
        waveId: w.id,
        name: w.name,
        weeks: w.weeks,
        why: 'pillar-listed' as const,
        heldBy: heldByChain(w, waveById),
      }))

    const sliceWaveIds = new Set(waves.map((w) => w.waveId))
    slices.push({
      pillarId: entry.pillarId,
      pillarName: entry.pillarName,
      entry,
      deliverables,
      waves,
      sequence: fullSequence.filter((id) => sliceWaveIds.has(id)),
      thin: deliverables.length <= THIN_DELIVERABLE_MAX,
      assumptions: PLAN_ASSUMPTIONS,
    })
  }

  return { slices, exclusions }
}

/* ── the two exports every consumer reads ──────────────────────────────── */

/**
 * One slice per in-scope pillar with a GapEntry, in the entries' own order —
 * gapRegister already ranks by priority, and this function never re-ranks.
 */
export function planSlices(
  entries: GapEntry[],
  intake: ProgramIntake | null,
  plan: ImplementationPlanData,
  layer: LayerFilter,
): PillarPlanSlice[] {
  return compose(entries, intake, plan, layer).slices
}

/**
 * Every entry-bearing pillar that got NO slice, with the reason. Computed by
 * the same pass as `planSlices` so the scope rule cannot fork. (Pillars with
 * no GapEntry at all are `gapExclusions`' territory — the register already
 * lists them with the missing measurement.)
 */
export function sliceExclusions(
  entries: GapEntry[],
  intake: ProgramIntake | null,
  plan: ImplementationPlanData,
  layer: LayerFilter,
): SliceExclusion[] {
  return compose(entries, intake, plan, layer).exclusions
}
