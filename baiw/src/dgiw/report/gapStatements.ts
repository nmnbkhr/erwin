/**
 * Maturity gap register with per-pillar gap statements — PDF only. AR-55.
 *
 * ═══ EVERY GAP CLAIM COMES FROM gapRegister(), AND THIS FILE ADDS NONE ═════
 *
 * G3's rule, stated once in gap/register.ts and held here: this generator
 * computes NO gap, NO priority and NO exclusion of its own. It calls the same
 * `gapRegister`/`gapExclusions` the /gaps page renders, over the same state,
 * so the document and the screen cannot disagree.
 *
 * ─── THERE IS NO REFERENCE MODE FOR MEASUREMENTS ───────────────────────────
 *
 * The charter falls back to watermarked ILLUSTRATIVE content because a
 * charter TEMPLATE is a real thing a consultant shows. A gap register has no
 * such fallback: every row is two measurements of THIS engagement, and an
 * illustrative measurement is a fabrication with a caption — the D-013
 * lesson. So with no actionable intake, or an empty register, this generator
 * REFUSES — `gapStatementsRefusal` is the single predicate, the UI shows its
 * message, and `buildGapStatementsPdf` throws it rather than emitting an
 * empty or watermarked document. The GAP-REFUSAL gate calls this exact
 * compiled module and expects the throw.
 *
 * ─── PRIORITY IS PRINTED WITH ITS FORMULA AND ITS INPUTS ───────────────────
 *
 * Every statement carries the register's stated formula with the entry's own
 * inputs substituted — no unexplained ranks. Framework references are the
 * existing crosswalk projection under its share-of-dimension semantics; no
 * framework gap score is invented, and where most of a dimension's weight
 * rests on OTHER pillars the statement says so (the AR-06 dependency
 * framing), because closing this pillar's gap moves that dimension only by
 * the printed share.
 *
 * Determinism: no clock, no randomness. Entries in register order (priority
 * score, then pillar id), evidence in question-id order. ASCII only in every
 * rendered string — D-019.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import { Refusal } from './refusal'
import type { ReportMeta } from '../../report/types'
import {
  CRITICAL_MIN,
  GAIN_DECISIVENESS,
  GAIN_DRIVER,
  HIGH_MIN,
  gapExclusions,
  gapRegister,
  type GapEntry,
} from '../gap/register'
import { answerEvidence, normaliseAnswers, type StoredAnswerMap } from '../answerShape'
import type { TargetMap } from '../assessmentState'
import { TIER_META, type AssessmentTier } from '../tier'
import { intakeIsActionable, mappedDrivers, type ProgramIntake } from '../intake/types'
import { applicableQuestions } from '../scoring'
import { mappingVisible } from '../projection'
import diagnosticData from '../data/diagnostic.json'
import crosswalkData from '../data/crosswalk.json'
import frameworksData from '../../frameworks/data/frameworks.json'
import type { CrosswalkData, DiagnosticData, FrameworksData } from '../types'

const DIAG = diagnosticData as DiagnosticData
const XW = crosswalkData as unknown as CrosswalkData
const FW = frameworksData as unknown as FrameworksData

/**
 * implementationPlan.json → artefactRegister: "Maturity gap register with
 * per-pillar gap statements", rung 1, owned by the Engagement Lead, format
 * "Report + CSV" (the CSV is the /gaps page export, same artefact id — the
 * AR-13 shape). Marked `derived` — which is what permits this generator to
 * exist at all, asserted by ARTEFACT-EVIDENCE rather than assumed.
 */
export const GAP_STATEMENTS_ARTEFACT_ID = 'AR-55'

/* ── the boundary statements ───────────────────────────────────────────── */

export const B_TWO_MEASUREMENTS =
  'A GAP REQUIRES TWO MEASUREMENTS. Every statement below rests on a current score at the stated ' +
  'tier AND a target the consultant set. A pillar missing either is EXCLUDED and listed with the ' +
  'reason — never scored as zero, never given a default target, never assumed. A met or exceeded ' +
  'target is a statement too: "no action needed here" is a finding, not a blank.'

export const B_FORMULA_STATED =
  'NO UNEXPLAINED RANKS. Priority is gapSize x (1 + decisiveness + driverAlignment), computed ' +
  'from each entry\'s own printed inputs: the positive part of the gap; the share of visible ' +
  'framework leaf dimensions that rest on the pillar; and the share of the engagement\'s mapped ' +
  'drivers naming it. Driver mapping is DECLARED on the Program Design intake, never inferred ' +
  'from a driver\'s wording. Bands: critical at 3.0 or more, high at 1.5, met when the gap is ' +
  'zero or negative, moderate otherwise.'

export const B_PROJECTION_NOT_CLAIMS =
  'FRAMEWORK REFERENCES ARE PROJECTIONS, NOT NEW CLAIMS. Each reference is one leaf dimension of ' +
  'one published framework mapped onto the pillar, with the share of THAT DIMENSION the pillar ' +
  'accounts for — the crosswalk\'s documented semantics. No framework gap score is computed: a ' +
  '"DMBOK gap" would be a number built from a join this workbench does not carry.'

export const B_NO_REFERENCE_MODE =
  'THIS DOCUMENT HAS NO REFERENCE MODE. A charter template is a real thing to show a client; an ' +
  'illustrative measurement is not — it is a fabricated number under a caption. With no ' +
  'actionable intake or nothing measured, generation refuses rather than watermarking.'

/* ── the refusal — ONE predicate, imported by the UI and enforced here ──── */

/**
 * Why this document cannot be generated, or null when it can. The single
 * refusal predicate: the page shows the message; the builder throws it.
 */
export function gapStatementsRefusal(
  intake: ProgramIntake | null,
  entries: GapEntry[],
): string | null {
  if (!intake || !intakeIsActionable(intake)) {
    return (
      'The gap register is engagement-mode only: complete the Program Design intake ' +
      '(organisation, at least one driver, at least one in-scope pillar) first. There is no ' +
      'reference mode for measurements.'
    )
  }
  if (entries.length === 0) {
    return (
      'No pillar has both measurements at the active tier — score pillars on the Diagnostic ' +
      'Instrument and set targets on its results view. An empty gap register would document ' +
      'nothing.'
    )
  }
  return null
}

export interface GapStatementsInput {
  meta: ReportMeta
  answers: StoredAnswerMap
  targets: TargetMap
  tier: AssessmentTier
  intake: ProgramIntake | null
}

const show1 = (n: number): string => (Math.round(n * 10) / 10).toFixed(1)
const show2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2)
const pct = (x: number): string => `${Math.round(x * 100)}%`

export function buildGapStatementsPdf(input: GapStatementsInput): jsPDF {
  const { meta, answers, targets, tier, intake } = input
  const entries = gapRegister(answers, targets, tier, meta.layer, intake)
  const exclusions = gapExclusions(answers, targets, tier, meta.layer)

  // G5: a typed Refusal, not a bare Error — D-020. The message is still the
  // predicate's own; what changed is the CHANNEL, so useDeliverable can tell
  // a designed refusal from a real failure without reading the text.
  const refusal = gapStatementsRefusal(intake, entries)
  if (refusal) throw new Refusal(refusal)

  const questions = applicableQuestions(DIAG.questions, meta.layer, tier)
  const evidence = answerEvidence(normaliseAnswers(answers))
  const drivers = mappedDrivers(intake as ProgramIntake)
  const driverText = new Map(drivers.map((d) => [d.key, d.text]))
  const dimById = new Map((FW.dimensions ?? []).map((d) => [d.id, d]))
  const fwById = new Map((FW.frameworks ?? []).map((f) => [f.id, f]))
  const answeredTotal = entries.reduce((s, e) => s + e.coverage.answered, 0)
  const applicableTotal = entries.reduce((s, e) => s + e.coverage.applicable, 0)

  // What this document renders: every entry with both measurements and every
  // input its priority was computed from, every exclusion with its reason,
  // and every evidence line. Two registers for one engagement on one day with
  // one more target set are different documents, and the /ID has to say so.
  const r = createReport(
    meta,
    contentKey([
      `mode:${meta.mode ?? 'engagement'}`,
      `tier:${tier}`,
      `coverage:${answeredTotal}/${applicableTotal}`,
      ...entries.map(
        (e) =>
          `gap:${e.pillarId}=${e.current.toFixed(6)}->${e.target}:${e.priority.band}:${e.priority.score.toFixed(6)}:` +
          `${e.priority.inputs.decisiveness.toFixed(6)}:${e.priority.inputs.driverAlignment.toFixed(6)}:` +
          `${e.priority.inputs.driverIds.join(',')}:${e.evidencePresent ? 'ev' : 'noev'}`,
      ),
      ...exclusions.map((x) => `excl:${x.pillarId}=${x.reasons.join('|')}`),
      ...Object.entries(evidence)
        .filter(([qid]) => questions.some((q) => q.id === qid))
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([qid, note]) => `evidence:${qid}=${note}`),
      ...drivers.map((d) => `driver:${d.key}=${d.text}:${d.pillarIds.join(',')}`),
    ]),
  )

  r.cover(
    'Maturity Gap Register',
    `${entries.length} pillar${entries.length === 1 ? '' : 's'} with both measurements at the ${TIER_META[tier].label} tier`,
  )

  /* ---- the boundaries, in full, before any number ---- */
  r.page('What this register states, and what it does not')
  r.paragraph(B_TWO_MEASUREMENTS)
  r.paragraph(B_FORMULA_STATED)
  r.paragraph(B_PROJECTION_NOT_CLAIMS)
  r.paragraph(B_NO_REFERENCE_MODE)
  r.keyValueBlock([
    ['Assessment tier', TIER_META[tier].label],
    ['Coverage at this tier', `${answeredTotal} of ${applicableTotal} applicable questions across the ${entries.length} registered pillar${entries.length === 1 ? '' : 's'}`],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
    ['Registered pillars', String(entries.length)],
    ['Excluded pillars', String(exclusions.length)],
    ['Mapped drivers', drivers.length ? drivers.map((d) => `"${d.text}"`).join(' · ') : 'none — driver alignment contributes nothing to any priority'],
  ])

  /* ---- the register ---- */
  r.page('The register', 'Highest priority first. Priority ties break on pillar id.')
  r.table({
    head: ['Pillar', 'Name', 'Current', 'Target', 'Gap', 'Band', 'Score', 'Evidence'],
    rows: entries.map((e) => [
      e.pillarId,
      e.pillarShort,
      show1(e.current),
      String(e.target),
      show1(e.gap),
      e.priority.band,
      show2(e.priority.score),
      e.evidencePresent ? 'yes' : 'none',
    ]),
    columnStyles: {
      0: { cellWidth: 16 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'center', cellWidth: 20 },
    },
    bodyFontSize: 7,
  })
  r.sectionHeading('Excluded from the register')
  if (exclusions.length === 0) {
    r.paragraph(
      'Every pillar has both measurements at this tier. This list is empty because the register ' +
        'excluded nothing, not because the check was skipped.',
      { size: 8 },
    )
  } else {
    r.paragraph(B_TWO_MEASUREMENTS, { color: SLATE, size: 8 })
    r.table({
      head: ['Pillar', 'Name', 'Why excluded'],
      rows: exclusions.map((x) => [x.pillarId, x.pillarName, x.reasons.join('; ')]),
      columnStyles: { 0: { cellWidth: 16 } },
      bodyFontSize: 7,
    })
  }

  /* ---- one statement per registered pillar ---- */
  for (const e of entries) {
    r.page(
      `${e.pillarId} · ${e.pillarName}`,
      `${e.priority.band.toUpperCase()} — gap ${show1(e.gap)} at the ${TIER_META[tier].label} tier`,
    )
    r.keyValueBlock([
      ['Current', `${show1(e.current)} / 5.0`],
      ['Target', `${e.target} / 5`],
      ['Gap', show1(e.gap)],
      ['Coverage at this tier', `${e.coverage.answered} of ${e.coverage.applicable} applicable questions answered`],
      ['Priority band', e.priority.band],
      ['Priority score', show2(e.priority.score)],
    ])
    r.sectionHeading('Why this priority')
    r.paragraph(
      `Priority = gapSize x (1 + ${GAIN_DECISIVENESS} x decisiveness + ${GAIN_DRIVER} x driverAlignment) = ` +
        `${show2(e.priority.inputs.gapSize)} x (1 + ${show2(e.priority.inputs.decisiveness)} + ` +
        `${show2(e.priority.inputs.driverAlignment)}) = ${show2(e.priority.score)}. ` +
        `Bands: critical >= ${CRITICAL_MIN}, high >= ${HIGH_MIN}, met when the gap is zero or negative.`,
      { size: 8 },
    )
    r.paragraph(
      `Decisiveness ${show2(e.priority.inputs.decisiveness)}: ${e.frameworkRefs.length} of the framework leaf ` +
        `dimensions visible under this layer rest on this pillar. Driver alignment ` +
        `${show2(e.priority.inputs.driverAlignment)}: ` +
        (e.priority.inputs.driverIds.length === 0
          ? 'no mapped driver names this pillar; unmapped drivers contribute nothing.'
          : `named by ${e.priority.inputs.driverIds.map((k) => `"${driverText.get(k) ?? k}"`).join(', ')}.`),
      { size: 8 },
    )
    if (e.gap <= 0) {
      r.paragraph(
        'The target is met or exceeded at this tier. That is the statement: no action is derived ' +
          'from this pillar, and it is reported rather than dropped so the register stays a ' +
          'complete account of every pillar with both measurements.',
        { size: 8 },
      )
    }

    r.sectionHeading('Framework dimensions resting on this pillar')
    r.paragraph(B_PROJECTION_NOT_CLAIMS, { color: SLATE, size: 8 })
    r.table({
      head: ['Framework', 'Dimension', 'Share of dimension'],
      rows: e.frameworkRefs.map((ref) => {
        const dim = dimById.get(ref.dimensionId)
        return [
          fwById.get(ref.frameworkId)?.code ?? ref.frameworkId,
          `${dim?.code ?? ref.dimensionId} ${dim?.name ?? ''}`,
          pct(ref.coverageWeight),
        ]
      }),
      columnStyles: { 0: { cellWidth: 24 }, 2: { halign: 'center', cellWidth: 32 } },
      bodyFontSize: 7,
    })
    // The AR-06 dependency framing, generalised: where most of a dimension's
    // weight rests elsewhere, closing THIS pillar's gap moves it only by the
    // printed share — say so beside the reference rather than letting the row
    // read as "fixing P0x fixes DM0y".
    const concentrated = e.frameworkRefs.filter((ref) => ref.coverageWeight < 0.5)
    if (concentrated.length > 0) {
      r.sectionHeading('Where these dimensions mostly rest elsewhere')
      r.paragraph(
        'For the dimensions below, more of the definition sits on other pillars than on this one. ' +
          'Closing this pillar\'s gap moves each by only the share shown; the remainder rests on ' +
          'the pillars listed, and a plan that treats this pillar as the whole answer to the ' +
          'dimension overstates what it buys.',
        { size: 8 },
      )
      r.table({
        head: ['Dimension', 'This pillar', 'Where the rest sits'],
        rows: concentrated.map((ref) => {
          const dim = dimById.get(ref.dimensionId)
          const others = (XW.entries ?? [])
            .filter(
              (x) =>
                x.dimensionId === ref.dimensionId &&
                x.pillarId !== e.pillarId &&
                mappingVisible(meta.layer, x.layer),
            )
            .map((x) => `${x.pillarId} (${pct(x.coverageWeight)})`)
          return [dim?.code ?? ref.dimensionId, pct(ref.coverageWeight), others.join(', ') || '-']
        }),
        columnStyles: { 0: { cellWidth: 24 }, 1: { halign: 'center', cellWidth: 22 } },
        bodyFontSize: 7,
      })
    }

    const pillarEvidence = questions
      .filter((q) => q.pillarId === e.pillarId && evidence[q.id] !== undefined)
      .sort((a, b) => (a.id < b.id ? -1 : 1))
    if (pillarEvidence.length > 0) {
      r.sectionHeading('Evidence recorded against this pillar')
      for (const q of pillarEvidence) {
        r.paragraph(`${q.id} - ${evidence[q.id]}`, { size: 8 })
      }
    }
  }

  return r.build()
}
