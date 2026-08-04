/**
 * Engagement steering pack — PDF only. AR-57.
 *
 * ═══ THE PERIOD'S RECORD, NOT THE COUNCIL'S MINUTES ════════════════════════
 *
 * NOT AR-41. The register's council pack (decisions log, action tracker) is
 * council runtime with no capture surface in this workbench, and it stays
 * `observed` — wiring this generator to that id would be the AR-46 shape,
 * matching the wording and nothing else. This document is composed ONLY from
 * what the engagement has actually recorded here:
 *
 *   - the maturity line: tier + coverage, from the same stores every other
 *     score-carrying artefact reads
 *   - the top-band gap entries, from gapRegister() — the single gap function
 *   - the append-only status log: per-state counts over the WHOLE register
 *     (denominator stated) and the period's transitions verbatim,
 *     regressions and notes included
 *   - the period's captured KPI entries — value, source, date, exactly as a
 *     person typed them. NOTHING IS COMPUTED: a KPI with no capture in the
 *     period prints "no measurement recorded", never a placeholder, never a
 *     derived stand-in
 *   - the plan slices' thin and held-by notes
 *
 * ─── ONE PERIOD MAKES NO CLAIM ABOUT DIRECTION ─────────────────────────────
 *
 * The pack claims its reporting period and nothing outside it: entries are
 * filtered by the consultant's own period boundaries, which are printed so a
 * reader can check the filter. No delta, no comparison to a prior period, no
 * judgement of progress appears anywhere — a single period cannot ground
 * one, and period-over-period movement is G6's to build. The CP4 inspection
 * greps the rendered text for judgement vocabulary and expects zero.
 *
 * ─── REFUSAL ───────────────────────────────────────────────────────────────
 *
 * Engagement-mode only, on AR-55's pattern, thrown as `Refusal` (D-020):
 * without an actionable intake there is no engagement to report on, and with
 * nothing measured AND nothing tracked the pack would be a cover page over
 * empty tables. Either half alone is reportable — a tracked-but-unmeasured
 * engagement gets its status story with the maturity section stating what is
 * missing, and vice versa.
 *
 * Determinism: no clock, no randomness — the period and every timestamp
 * arrive as recorded state. ASCII only in rendered strings (D-019).
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import { Refusal } from './refusal'
import type { ReportMeta } from '../../report/types'
import { gapRegister, type GapEntry } from '../gap/register'
import { gapStatementsRefusal } from './gapStatements'
import { planSlices } from '../plan/slices'
import {
  STATUS_STATES,
  capturesInPeriod,
  currentState,
  stateCounts,
  transitionsInPeriod,
  type KpiLog,
  type ReportingPeriod,
  type StatusLog,
} from '../tracking/log'
import { normaliseAnswers, type StoredAnswerMap } from '../answerShape'
import type { TargetMap } from '../assessmentState'
import { TIER_META, type AssessmentTier } from '../tier'
import { intakeIsActionable, type ProgramIntake } from '../intake/types'
import { applicableQuestions } from '../scoring'
import { layerShows } from '../layer'
import diagnosticData from '../data/diagnostic.json'
import implementationPlan from '../data/implementationPlan.json'
import type { DiagnosticData, ImplementationPlanData } from '../types'

const DIAG = diagnosticData as DiagnosticData
const PLAN = implementationPlan as ImplementationPlanData

/**
 * implementationPlan.json → artefactRegister: "Engagement steering pack (per
 * reporting period)", rung 4, owned by the Engagement Lead. Marked `derived`
 * — which is what permits this generator to exist at all, asserted by
 * ARTEFACT-EVIDENCE. AR-41 stays observed; its note carries the boundary.
 */
export const COUNCIL_PACK_ARTEFACT_ID = 'AR-57'

/**
 * Why this pack cannot be generated, or null. The intake condition is the
 * SHARED predicate's own text (gapStatementsRefusal returns it whenever the
 * intake is not actionable, regardless of entries — one text, never a copy);
 * the second condition is this artefact's alone.
 */
export function councilPackRefusal(
  intake: ProgramIntake | null,
  entries: GapEntry[],
  statusLog: StatusLog,
  kpiLog: KpiLog,
): string | null {
  if (!intake || !intakeIsActionable(intake)) return gapStatementsRefusal(intake, entries)
  const transitions = Object.values(statusLog).reduce((s, t) => s + t.length, 0)
  if (entries.length === 0 && transitions === 0 && kpiLog.length === 0) {
    return (
      'Nothing is measured and nothing is tracked: no pillar carries both measurements, no ' +
      'status transition is logged, no KPI is captured. A steering pack over an empty record ' +
      'would be a cover page over empty tables — record something first.'
    )
  }
  return null
}

export interface CouncilPackInput {
  meta: ReportMeta
  answers: StoredAnswerMap
  targets: TargetMap
  tier: AssessmentTier
  intake: ProgramIntake | null
  statusLog: StatusLog
  kpiLog: KpiLog
  period: ReportingPeriod
}

const show1 = (n: number): string => (Math.round(n * 10) / 10).toFixed(1)

const periodLabel = (p: ReportingPeriod): string => (p.label.trim() ? p.label.trim() : 'Unlabelled period')
const periodBounds = (p: ReportingPeriod): string =>
  `${p.from || 'open start'} to ${p.to || 'open end'}`

export function buildCouncilPackPdf(input: CouncilPackInput): jsPDF {
  const { meta, answers, targets, tier, intake, statusLog, kpiLog, period } = input
  const entries = gapRegister(answers, targets, tier, meta.layer, intake)

  const refusal = councilPackRefusal(intake, entries, statusLog, kpiLog)
  if (refusal) throw new Refusal(refusal)

  const slices = planSlices(entries, intake, PLAN, meta.layer)
  const registerIds = PLAN.artefactRegister.map((a) => a.id)
  const counts = stateCounts(statusLog, registerIds)
  const periodTransitions = transitionsInPeriod(statusLog, period)
  const periodCaptures = capturesInPeriod(kpiLog, period)
  const totalTransitions = Object.values(statusLog).reduce((s, t) => s + t.length, 0)

  const questions = applicableQuestions(DIAG.questions, meta.layer, tier)
  const scores = normaliseAnswers(answers)
  const answered = questions.filter((q) => scores[q.id] !== undefined).length
  const topBand = entries.filter((e) => e.priority.band === 'critical' || e.priority.band === 'high')

  const visibleKpis = PLAN.waves
    .filter((w) => w.layer === 'core' || layerShows(meta.layer, w.layer))
    .flatMap((w) => w.kpis.map((k) => ({ ...k, waveId: w.id })))
  const kpiTextById = new Map(visibleKpis.map((k) => [k.id, k.text]))

  // What this pack renders: the period identity, every in-period transition
  // and capture verbatim, every current state, the top-band gaps and the
  // slice notes. One more transition, one more capture, a moved boundary or
  // a renamed period is a different document, and the /ID has to say so —
  // the digest carries the log COUNT as well, so two packs over different
  // depths of history cannot collide even when the period slice reads alike.
  const r = createReport(
    meta,
    contentKey([
      `mode:${meta.mode ?? 'engagement'}`,
      `tier:${tier}`,
      `coverage:${answered}/${questions.length}`,
      `period:${periodLabel(period)}:${period.from || 'open'}:${period.to || 'open'}`,
      `log:${totalTransitions}transitions:${kpiLog.length}captures`,
      ...registerIds
        .map((id) => ({ id, state: currentState(statusLog, id) }))
        .filter((x) => x.state !== null)
        .map((x) => `cur:${x.id}=${x.state}`),
      ...periodTransitions.map(
        (x) => `st:${x.artefactId}=${x.transition.to}@${x.transition.at}:${x.transition.note ?? 'nonote'}`,
      ),
      ...periodCaptures.map((c) => `kpi:${c.kpiId}=${c.value}@${c.capturedAt}:${c.source}`),
      ...entries.map((e) => `gap:${e.pillarId}=${e.current.toFixed(6)}->${e.target}:${e.priority.band}`),
      ...slices.map((s) => `slice:${s.pillarId}:${s.thin ? 'thin' : 'full'}:${s.waves.map((w) => `${w.waveId}<${w.heldBy.join('+')}`).join(',')}`),
    ]),
  )

  r.cover('Engagement Steering Pack', `${periodLabel(period)} — ${periodBounds(period)}`)

  /* ---- the boundaries, before any number ---- */
  r.page('What this pack claims, and what it does not')
  r.paragraph(
    'EVERYTHING HERE WAS RECORDED, NOTHING WAS COMPUTED. Statuses are the engagement\'s own ' +
      'append-only transition log; KPI values are entries a person captured with a source and a ' +
      'date, printed verbatim; gaps come from the same register the /gaps page renders. Where no ' +
      'measurement was recorded the pack says so — it never substitutes a derived or ' +
      'illustrative figure.',
  )
  r.paragraph(
    'THIS PACK CLAIMS ITS PERIOD AND NOTHING OUTSIDE IT. Transitions and captures are filtered ' +
      'to the reporting period printed below, inclusive of both boundary dates. No comparison ' +
      'to any earlier period appears, and no judgement of progress is made in either ' +
      'direction — a single period cannot ground one. Reading movement across periods is a ' +
      'separate instrument, deliberately not this one.',
  )
  r.paragraph(
    'STATUS AND DISPOSITION ARE DIFFERENT FACTS. A register entry\'s builtFrom disposition says ' +
      'how an artefact is built; the status log says where it stands in THIS engagement. The ' +
      'pack prints the second and never restates the first as delivery progress.',
    { color: SLATE, size: 8 },
  )
  r.keyValueBlock([
    ['Reporting period', `${periodLabel(period)} (${periodBounds(period)})`],
    ['Assessment tier', TIER_META[tier].label],
    ['Coverage at this tier', `${answered} of ${questions.length} applicable questions answered`],
    ['Pillars with both measurements', String(entries.length)],
    ['Status transitions in period', String(periodTransitions.length)],
    ['KPI captures in period', String(periodCaptures.length)],
  ])

  /* ---- maturity line + top-band gaps ---- */
  r.page('Maturity and the top-band gaps')
  if (entries.length === 0) {
    r.paragraph(
      'No pillar carries both measurements at this tier, so no gap can be stated — that is the ' +
        'maturity line for this period: coverage above, gaps absent, and the absence is the ' +
        'finding rather than a zero.',
    )
  } else {
    r.paragraph(
      `${entries.length} pillar${entries.length === 1 ? 's carry' : 's carry'} both measurements at the ` +
        `${TIER_META[tier].label} tier. The table lists the pillars in the critical and high bands; the full ` +
        'register with every formula input is AR-55.',
      { size: 8 },
    )
    if (topBand.length === 0) {
      r.paragraph(
        'No measured pillar sits in the critical or high band. This section is empty because the ' +
          'register puts nothing there, not because the check was skipped.',
        { size: 8 },
      )
    } else {
      r.table({
        head: ['Pillar', 'Name', 'Current', 'Target', 'Gap', 'Band'],
        rows: topBand.map((e) => [
          e.pillarId,
          e.pillarShort,
          show1(e.current),
          String(e.target),
          show1(e.gap),
          e.priority.band,
        ]),
        columnStyles: {
          0: { cellWidth: 16 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'center', cellWidth: 16 },
          4: { halign: 'center', cellWidth: 14 },
        },
        bodyFontSize: 7,
      })
    }
  }

  /* ---- status summary ---- */
  r.page('Delivery status', 'Append-only log; the current state is the last entry.')
  r.keyValueBlock([
    ...STATUS_STATES.map((s): [string, string] => [s, String(counts.counts[s])]),
    ['not tracked', `${counts.untracked} of the ${registerIds.length} catalogued artefacts`],
  ])
  r.sectionHeading('Transitions in this period')
  if (periodTransitions.length === 0) {
    r.paragraph(
      'No status transition was recorded in this period. The counts above are the standing ' +
        'position from earlier entries.',
      { size: 8 },
    )
  } else {
    r.paragraph(
      'Verbatim from the log, regressions included — a state moving backwards is a recorded ' +
        'fact of the engagement, not an error to hide.',
      { color: SLATE, size: 8 },
    )
    r.table({
      head: ['Artefact', 'To', 'On', 'Note'],
      rows: periodTransitions.map((x) => [
        x.artefactId,
        x.transition.to,
        x.transition.at.slice(0, 10),
        x.transition.note ?? '-',
      ]),
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 } },
      bodyFontSize: 7,
    })
  }

  /* ---- KPI entries ---- */
  r.page('KPI measurements', 'Captured entries only — the tool computes no KPI value.')
  r.paragraph(
    'Every wave KPI in scope is listed. A value appears only where a person recorded one inside ' +
      'the period, with its source and date; "no measurement recorded" is the honest state of ' +
      'the rest, never a blank to be filled by inference.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['KPI', 'Wave', 'Coverage phrase', 'Recorded in period'],
    rows: visibleKpis.map((k) => {
      const caps = periodCaptures.filter((c) => c.kpiId === k.id)
      return [
        k.id,
        k.waveId,
        k.text,
        caps.length
          ? caps.map((c) => `${c.value} (${c.source}, ${c.capturedAt.slice(0, 10)})`).join('; ')
          : 'no measurement recorded',
      ]
    }),
    columnStyles: { 0: { cellWidth: 20 }, 1: { halign: 'center', cellWidth: 14 } },
    bodyFontSize: 7,
  })
  const orphanCaptures = periodCaptures.filter((c) => !kpiTextById.has(c.kpiId))
  if (orphanCaptures.length > 0) {
    r.sectionHeading('Captures outside the visible KPI set')
    r.paragraph(
      'Recorded against KPIs outside the current layer scope — listed rather than dropped, ' +
        'because a record does not disappear when a filter changes.',
      { size: 8 },
    )
    r.table({
      head: ['KPI', 'Recorded'],
      rows: orphanCaptures.map((c) => [c.kpiId, `${c.value} (${c.source}, ${c.capturedAt.slice(0, 10)})`]),
      columnStyles: { 0: { cellWidth: 20 } },
      bodyFontSize: 7,
    })
  }

  /* ---- slice notes ---- */
  r.page('Plan notes from the slices', 'Thin and held-by facts, from the same composition AR-56 renders.')
  if (slices.length === 0) {
    r.paragraph(
      'No in-scope pillar carries both measurements, so there are no plan slices this period — ' +
        'the plan section is absent because its input is, not because it was skipped.',
    )
  } else {
    for (const s of slices) {
      const held = s.waves.filter((w) => w.heldBy.length > 0)
      r.paragraph(
        `${s.pillarId} ${s.pillarName}: ${s.thin ? `THIN SLICE - ${s.deliverables.length === 0 ? 'nothing catalogued' : `${s.deliverables.length} catalogued deliverable${s.deliverables.length === 1 ? '' : 's'}`} under this layer, a fact rather than a gap to pad.` : `${s.deliverables.length} catalogued deliverables.`} ` +
          (held.length
            ? `Held: ${held.map((w) => `${w.waveId} waits on ${w.heldBy.join(', ')}`).join('; ')} — structure beats priority.`
            : 'No wave on this slice waits on a predecessor.'),
        { size: 8 },
      )
    }
  }

  return r.build()
}
