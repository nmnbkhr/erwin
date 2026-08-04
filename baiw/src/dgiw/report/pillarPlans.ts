/**
 * Per-pillar implementation plan — PDF only. AR-56.
 *
 * ═══ EVERY LINE IS STRUCTURAL, AND THE PLAN SAYS SO ════════════════════════
 *
 * One section per plan slice, and a slice is `planSlices()` over the gap
 * register — this file composes and renders; it derives NOTHING. No gap, no
 * band, no priority is recomputed here (SLICE-SOURCE holds that), no
 * initiative is invented beyond the register rows and the waves' own text,
 * and no effort figure exists anywhere: no person-days, no FTEs, no costs,
 * no dates. The only durations are the reference waves' week windows,
 * verbatim, under the shared assumptions block — printed ONCE per document,
 * and the PLAN-EFFORT gate reads the real output to hold both promises.
 *
 * ─── NO REFERENCE MODE ─────────────────────────────────────────────────────
 *
 * A plan derived from measurements has no illustrative fallback — AR-55's
 * argument, inherited with its predicate: `pillarPlansRefusal` COMPOSES
 * `gapStatementsRefusal` (one refusal for measurement-derived artefacts,
 * never two texts drifting apart) and adds the one condition this artefact
 * alone has — every measured pillar sitting outside the intake scope, which
 * would make a plan of zero slices.
 *
 * Determinism: no clock, no randomness. Slices arrive in register priority
 * order and are rendered in it; ASCII only in rendered strings (D-019 — the
 * sequence separator is '->').
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { gapRegister } from '../gap/register'
import { gapStatementsRefusal } from './gapStatements'
import {
  B_NO_EFFORT,
  B_STRUCTURE_OVER_PRIORITY,
  B_THIN_IS_INFORMATION,
  PLAN_ASSUMPTIONS,
  planSlices,
  sliceExclusions,
  type PillarPlanSlice,
} from '../plan/slices'
import type { StoredAnswerMap } from '../answerShape'
import type { TargetMap } from '../assessmentState'
import { TIER_META, type AssessmentTier } from '../tier'
import type { ProgramIntake } from '../intake/types'
import implementationPlan from '../data/implementationPlan.json'
import type { ImplementationPlanData } from '../types'

const PLAN = implementationPlan as ImplementationPlanData

/**
 * implementationPlan.json → artefactRegister: "Per-pillar implementation
 * plan", rung 1, owned by the Engagement Lead, format "Report". Marked
 * `derived` — which is what permits this generator to exist at all, asserted
 * by ARTEFACT-EVIDENCE rather than assumed.
 */
export const PILLAR_PLANS_ARTEFACT_ID = 'AR-56'

/**
 * Why this document cannot be generated, or null. One predicate: the shared
 * measurement refusal, plus the zero-slice condition only this artefact has.
 */
export function pillarPlansRefusal(
  intake: ProgramIntake | null,
  entries: ReturnType<typeof gapRegister>,
  slices: PillarPlanSlice[],
): string | null {
  const shared = gapStatementsRefusal(intake, entries)
  if (shared) return shared
  if (slices.length === 0) {
    return (
      'Every measured pillar is outside the engagement\'s pillar scope — a plan of zero slices ' +
      'would document nothing. Widen the scope on Program Design, or measure an in-scope pillar.'
    )
  }
  return null
}

export interface PillarPlansInput {
  meta: ReportMeta
  answers: StoredAnswerMap
  targets: TargetMap
  tier: AssessmentTier
  intake: ProgramIntake | null
}

const show1 = (n: number): string => (Math.round(n * 10) / 10).toFixed(1)

export function buildPillarPlansPdf(input: PillarPlansInput): jsPDF {
  const { meta, answers, targets, tier, intake } = input
  const entries = gapRegister(answers, targets, tier, meta.layer, intake)
  const slices = planSlices(entries, intake, PLAN, meta.layer)
  const exclusions = sliceExclusions(entries, intake, PLAN, meta.layer)

  const refusal = pillarPlansRefusal(intake, entries, slices)
  if (refusal) throw new Error(refusal)

  const answeredTotal = slices.reduce((s, x) => s + x.entry.coverage.answered, 0)
  const applicableTotal = slices.reduce((s, x) => s + x.entry.coverage.applicable, 0)

  // What this document renders: every slice's gap facts, deliverable ids,
  // sequence and thinness, and every exclusion. One more target, one register
  // row, or one wave edit is a different document, and the /ID has to say so.
  const r = createReport(
    meta,
    contentKey([
      `mode:${meta.mode ?? 'engagement'}`,
      `tier:${tier}`,
      `coverage:${answeredTotal}/${applicableTotal}`,
      ...slices.map(
        (s) =>
          `slice:${s.pillarId}=${s.entry.current.toFixed(6)}->${s.entry.target}:${s.entry.priority.band}:` +
          `${s.deliverables.map((d) => `${d.artefactId}@${d.waveId ?? 'unplaced'}`).join(',')}:` +
          `${s.sequence.join('>')}:${s.thin ? 'thin' : 'full'}`,
      ),
      ...exclusions.map((x) => `excl:${x.pillarId}=${x.reasons.join('|')}`),
    ]),
  )

  r.cover(
    'Per-Pillar Implementation Plan',
    `${slices.length} pillar slice${slices.length === 1 ? '' : 's'} from the gap register at the ${TIER_META[tier].label} tier`,
  )

  /* ---- the boundaries, in full, before any content ---- */
  r.page('What this plan is built from, and what it is not')
  r.paragraph(B_NO_EFFORT)
  r.paragraph(B_STRUCTURE_OVER_PRIORITY)
  r.paragraph(B_THIN_IS_INFORMATION)
  r.keyValueBlock([
    ['Assessment tier', TIER_META[tier].label],
    ['Coverage at this tier', `${answeredTotal} of ${applicableTotal} applicable questions across the ${slices.length} planned pillar${slices.length === 1 ? '' : 's'}`],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
    ['Planned pillars', String(slices.length)],
    ['Measured but excluded', String(exclusions.length)],
  ])
  // The shared assumptions block — ONCE per document, beside the boundaries,
  // never repeated per section. PLAN-EFFORT requires it wherever a week
  // window is printed, and every week window below is covered by this one.
  r.sectionHeading('Assumptions')
  r.bullets([...PLAN_ASSUMPTIONS])

  r.sectionHeading('Measured pillars excluded from this plan')
  if (exclusions.length === 0) {
    r.paragraph(
      'Every pillar with both measurements is in the engagement scope. This list is empty ' +
        'because nothing was excluded, not because the check was skipped. Pillars missing a ' +
        'measurement entirely are the gap register\'s exclusion list (AR-55), not this one.',
      { size: 8 },
    )
  } else {
    r.table({
      head: ['Pillar', 'Name', 'Why excluded'],
      rows: exclusions.map((x) => [x.pillarId, x.pillarName, x.reasons.join('; ')]),
      columnStyles: { 0: { cellWidth: 16 } },
      bodyFontSize: 7,
    })
  }

  /* ---- one section per slice, in register priority order ---- */
  for (const s of slices) {
    r.page(
      `${s.pillarId} · ${s.pillarName}`,
      `${s.entry.priority.band.toUpperCase()} — gap ${show1(s.entry.gap)} at the ${TIER_META[tier].label} tier`,
    )
    r.keyValueBlock([
      ['Current', `${show1(s.entry.current)} / 5.0`],
      ['Target', `${s.entry.target} / 5`],
      ['Gap', show1(s.entry.gap)],
      ['Priority band', s.entry.priority.band],
      ['Coverage at this tier', `${s.entry.coverage.answered} of ${s.entry.coverage.applicable} applicable questions answered`],
      ['Wave sequence', s.sequence.length ? s.sequence.join(' -> ') : 'no wave lists this pillar'],
    ])
    if (s.thin) {
      r.paragraph(
        `THIN SLICE: the register catalogues ${s.deliverables.length === 0 ? 'nothing' : `${s.deliverables.length} deliverable${s.deliverables.length === 1 ? '' : 's'}`} ` +
          'for this pillar under this layer. ' + B_THIN_IS_INFORMATION,
        { size: 8 },
      )
    }

    r.sectionHeading('Catalogued deliverables')
    if (s.deliverables.length === 0) {
      r.paragraph(
        'The register catalogues nothing for this pillar under the current layer. That is the ' +
          'finding — AR-54 reads the same absence from the programme side — and no line is ' +
          'generated to fill the space.',
        { size: 8 },
      )
    } else {
      r.paragraph(
        'Disposition per row, because a blocked or observed entry is not a document this ' +
          'workbench can produce. Wave placement is exact name identity with a wave deliverable ' +
          'string — the only artefact-to-wave key that exists — and blank means no wave names ' +
          'this artefact, which is the normal state of the data.',
        { color: SLATE, size: 8 },
      )
      r.table({
        head: ['Artefact', 'Name', 'Rung', 'Owner', 'Disposition', 'Wave'],
        rows: s.deliverables.map((d) => [
          d.artefactId,
          d.artefact,
          String(d.rung),
          d.owner,
          d.builtFrom.evidence,
          d.waveId ?? '-',
        ]),
        columnStyles: {
          0: { cellWidth: 18 },
          2: { halign: 'center', cellWidth: 14 },
          4: { cellWidth: 22 },
          5: { halign: 'center', cellWidth: 16 },
        },
        bodyFontSize: 7,
      })
    }

    r.sectionHeading('Waves listing this pillar')
    if (s.waves.length === 0) {
      r.paragraph(
        'No wave in the reference plan lists this pillar. Its deliverables above stand without a ' +
          'wave window, and scheduling them is an engagement decision this plan does not make.',
        { size: 8 },
      )
    } else {
      r.paragraph(B_STRUCTURE_OVER_PRIORITY, { color: SLATE, size: 8 })
      r.table({
        head: ['Wave', 'Name', 'Weeks', 'Held by'],
        rows: s.waves.map((w) => [
          w.waveId,
          w.name,
          w.weeks,
          w.heldBy.length ? w.heldBy.join(', ') : 'nothing - can start immediately',
        ]),
        columnStyles: { 0: { cellWidth: 14 }, 2: { cellWidth: 24 } },
        bodyFontSize: 7,
      })
    }
  }

  return r.build()
}
