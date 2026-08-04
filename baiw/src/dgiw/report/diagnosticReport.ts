/**
 * DGIW diagnostic report — the flagship deliverable.
 *
 * Builds and returns a jsPDF. It saves nothing: the caller decides whether the
 * document becomes a download or an assertion. That is what makes "the CSV has
 * 24 rows under layer=core" checkable instead of something you squint at in a
 * downloaded file.
 *
 * Every figure comes from ../scoring.ts, which Diagnostic.tsx also calls. There
 * is no second implementation of the weighted mean here, because the failure mode
 * being avoided is a PDF that quietly disagrees with the screen the client just
 * watched over your shoulder.
 *
 * Determinism: no clock, no randomness, no Set/Map iteration over unordered
 * input. Pillars are walked in dataset order, questions in dataset order, and the
 * date comes from meta.generatedAt. Two builds from the same answers under the
 * same layer are byte-identical, including the PDF's CreationDate.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import {
  LEVEL_LABEL,
  RANK_MIN_CONFIDENCE,
  applicableQuestions,
  overallScore,
  rankPillars,
  scoreLabel,
  scorePillars,
  stateCounts,
  stateReason,
  type PillarOutcome,
} from '../scoring'
import { DEFAULT_TIER, TIER_META, type AssessmentTier } from '../tier'
import diagnostic from '../data/diagnostic.json'
import pillars from '../data/pillars.json'
import type { DiagnosticData, Pillar } from '../types'

const DIAG = diagnostic as DiagnosticData
const PILLARS = pillars as Pillar[]

/**
 * Catalogue id from implementationPlan.json → artefactRegister: "Maturity heatmap
 * and radar", rung 1, pillar P01. Carried on the cover and in the filename so a
 * client can trace a file back to the artefact register that promised it.
 */
export const DIAGNOSTIC_ARTEFACT_ID = 'AR-01'

export interface DiagnosticReportInput {
  meta: ReportMeta
  /** questionId → 1..5. Exactly what the Diagnostic page holds in state. */
  answers: Record<string, number>
  /**
   * G2: the tier this assessment was measured at. Filters the question set
   * through the same `applicableQuestions` the screen uses, so an answer
   * outside the tier is never counted and a quick answer never vanishes.
   * Defaults to deep — the identity — so every pre-G2 caller keeps meaning
   * "the whole assessment".
   */
  tier?: AssessmentTier
  /** questionId → evidence note. Only non-empty notes; the appendix renders these. */
  evidence?: Record<string, string>
  /** pillarId → target maturity 1..5. The current-vs-target table renders these. */
  targets?: Record<string, number>
}

/** One decimal, or the state word. Never a bare 0 for an unmeasured pillar. */
const show1 = (n: number | null) => (n === null ? '—' : (Math.round(n * 10) / 10).toFixed(1))

/** Distance from a pillar's score to Optimising. Only meaningful when scored. */
function gapTo5(p: PillarOutcome): number | null {
  return p.state === 'scored' ? 5 - (p.score as number) : null
}

/**
 * Prioritisation signal: the gap, multiplied by how much decision weight the
 * pillar carries. A 2.0 gap in a pillar built from decisive questions is a bigger
 * exposure than the same gap in a pillar of contextual ones, and ordering by raw
 * gap alone hides that.
 */
function weightedShortfall(p: PillarOutcome): number | null {
  const gap = gapTo5(p)
  return gap === null ? null : gap * p.weightTotal
}

export function buildDiagnosticReport(input: DiagnosticReportInput): jsPDF {
  const { meta, answers } = input
  const tier = input.tier ?? DEFAULT_TIER
  const questions = applicableQuestions(DIAG.questions, meta.layer, tier)
  // Only evidence and targets the document actually renders: notes on
  // questions inside the tier+layer set, targets on real pillars. A dangling
  // key must neither render nor move the /ID.
  const evidence = Object.entries(input.evidence ?? {})
    .filter(([id, note]) => questions.some((q) => q.id === id) && note.trim().length > 0)
    .map(([id, note]) => ({ q: questions.find((x) => x.id === id)!, note }))
  const targets = Object.entries(input.targets ?? {})
    .filter(([pid, v]) => PILLARS.some((p) => p.id === pid) && Number.isInteger(v) && v >= 1 && v <= 5)
  const targetOf = new Map(targets)
  const outcomes = scorePillars(PILLARS, questions, answers)
  const counts = stateCounts(outcomes)
  const overall = overallScore(questions, answers)
  const { underCovered, gaps, strengths } = rankPillars(outcomes)

  const answeredCount = questions.filter((q) => answers[q.id]).length
  const scored = outcomes.filter((p) => p.state === 'scored')
  const notAssessed = outcomes.filter((p) => p.state === 'not-assessed')
  const notApplicable = outcomes.filter((p) => p.state === 'not-applicable')

  /*
   * The answers, restricted to the questions this layer actually renders.
   *
   * Restricted rather than the whole answer map: an answer to a banking question
   * changes nothing in a core-only report, and giving that report a new /ID would
   * claim a revision that a reader cannot see. The converse is the one that
   * matters — changing an answer that IS rendered must change the id.
   */
  // G2: the tier and its coverage join the digest, with the rendered evidence
  // and targets — a Quick-tier PDF and a Deep-tier PDF of the same answers are
  // different documents and must never share an /ID.
  const r = createReport(
    meta,
    contentKey([
      `tier:${tier}`,
      `coverage:${answeredCount}/${questions.length}`,
      ...questions.filter((q) => answers[q.id] !== undefined).map((q) => `${q.id}=${answers[q.id]}`),
      ...evidence.map((e) => `evidence:${e.q.id}:${e.note}`),
      ...targets.map(([pid, v]) => `target:${pid}=${v}`),
    ]),
  )

  /* ── Cover ─────────────────────────────────────────────────────────
     orgName, date, artefact id and layer are painted by the spine from
     meta — passing orgName again as the subtitle would print the client's
     name twice on one page. The subtitle carries the scope instead. */
  r.cover(
    'Data Governance Diagnostic',
    `Weighted maturity across ${PILLARS.length} governance pillars`,
  )

  /* ── Executive summary ─────────────────────────────────────────── */
  r.page('Executive summary')

  r.keyValueBlock([
    ['Overall maturity', overall === null ? 'Not assessed' : `${show1(overall)} / 5.0`],
    ['Maturity level', overall === null ? '—' : LEVEL_LABEL[Math.round(overall)]],
    // G2: the tier and its coverage sit HERE, beside the score they qualify —
    // a visible line, not a footnote. A Quick figure is directional and the
    // document says so before the reader can quote it as a full assessment.
    ['Assessment tier', `${TIER_META[tier].label} — ${TIER_META[tier].hint}`],
    ['Coverage at this tier', `${answeredCount} of ${questions.length} applicable questions answered`],
    ['Scored pillars', `${counts.scored} of ${PILLARS.length}`],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
  ])
  if (tier !== 'deep')
    r.paragraph(
      `This assessment was measured at the ${TIER_META[tier].label} tier — a deliberate subset of ` +
        `the instrument. Scores are directional at this depth; a defended maturity claim needs the ` +
        `Deep Dive tier's full question set.`,
      { color: SLATE, size: 8 },
    )

  r.sectionHeading('What the overall score is, and is not')
  r.paragraph(
    overall === null
      ? `No questions have been answered under this layer, so no maturity score exists. Every pillar below is reported as unmeasured rather than as zero.`
      : `The overall figure of ${show1(overall)} is the weight-adjusted mean of the ` +
        `${answeredCount} answered question${answeredCount === 1 ? '' : 's'}, drawn from ` +
        `${counts.scored} scored pillar${counts.scored === 1 ? '' : 's'}. That denominator — ` +
        `${counts.scored}, not ${PILLARS.length} — is the number of pillars with at least one ` +
        `answer under this layer. Pillars carrying no answer contribute nothing to the ` +
        `numerator and nothing to the denominator; they are not counted as zero.`,
  )
  r.paragraph(
    `Questions carry a weight of 1 (contextual), 2 (important) or 3 (decisive). A decisive ` +
      `question moves a pillar's score three times as far as a contextual one, so a pillar's ` +
      `coverage is reported as answered-of-applicable rather than as a simple percentage.`,
  )

  r.sectionHeading('Pillar coverage')
  r.table({
    head: ['State', 'Pillars', 'Meaning'],
    rows: [
      ['Scored', counts.scored, 'Has applicable questions under this layer; at least one answered'],
      ['Not assessed', counts['not-assessed'], 'Has applicable questions under this layer; none answered'],
      ['Not applicable', counts['not-applicable'], 'Has no questions under this layer at all'],
    ],
    columnStyles: { 1: { halign: 'center', cellWidth: 20 } },
  })
  r.paragraph(
    `"Not assessed" and "not applicable" are different findings. The first is a gap in the ` +
      `evidence — someone still has to answer those questions. The second is a statement of ` +
      `scope: the pillar has no questions in this layer, so nothing about it was asked. ` +
      `Neither is a score of zero, and neither is included in any average on this page.`,
    { color: SLATE, size: 8 },
  )

  /* ── Pillar table ──────────────────────────────────────────────── */
  r.page('Pillar scores', 'All eleven pillars, in register order. Gap is the distance to Optimising (5.0).')
  r.table({
    head: ['ID', 'Pillar', 'Score / state', 'Level', 'Coverage', 'Gap', 'Weighted shortfall'],
    rows: outcomes.map((p) => [
      p.pillarId,
      p.name,
      scoreLabel(p),
      p.state === 'scored' ? LEVEL_LABEL[Math.round(p.score as number)] : '—',
      p.state === 'not-applicable' ? 'n/a' : `${p.answered} / ${p.total}`,
      p.state === 'scored' ? show1(gapTo5(p)) : '—',
      p.state === 'scored' ? show1(weightedShortfall(p)) : '—',
    ]),
    columnStyles: {
      0: { cellWidth: 12 },
      2: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
    bodyFontSize: 7,
    headFontSize: 7,
  })
  r.paragraph(
    `Weighted shortfall = gap x the pillar's total question weight. It ranks exposure rather ` +
      `than distance: a two-level gap in a pillar built from decisive questions is a larger ` +
      `problem than the same gap in a pillar of contextual ones.`,
    { color: SLATE, size: 8 },
  )

  /* ── Gap list ──────────────────────────────────────────────────── */
  r.page('Priority gaps', `Scored pillars only, widest gap first. ${counts.scored} of ${PILLARS.length} pillars qualify.`)
  if (scored.length === 0) {
    r.paragraph('No pillar has been scored under this layer, so no gap can be ranked.')
  } else {
    const byGap = [...scored].sort((a, b) => (gapTo5(b) as number) - (gapTo5(a) as number))
    r.table({
      head: ['#', 'Pillar', 'Score', 'Gap', 'Coverage', 'Rankable'],
      rows: byGap.map((p, i) => [
        i + 1,
        p.name,
        show1(p.score),
        show1(gapTo5(p)),
        `${Math.round(p.confidence * 100)}%`,
        p.confidence >= RANK_MIN_CONFIDENCE ? 'yes' : 'below coverage floor',
      ]),
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
      },
    })
    r.paragraph(
      `A pillar is only ranked as a headline strength or gap once at least ` +
        `${Math.round(RANK_MIN_CONFIDENCE * 100)}% of its question weight has been answered. ` +
        `${underCovered.length} scored pillar${underCovered.length === 1 ? ' sits' : 's sit'} ` +
        `below that floor and ${underCovered.length === 1 ? 'is' : 'are'} listed above but not ranked.`,
      { color: SLATE, size: 8 },
    )
  }

  /* ── What was not measured ─────────────────────────────────────── */
  r.page('What was not measured', 'Reported explicitly so the reader can see the shape of the evidence.')

  r.sectionHeading(`Not assessed (${notAssessed.length})`)
  if (notAssessed.length === 0) {
    r.paragraph('Every pillar with applicable questions under this layer has at least one answer.')
  } else {
    r.table({
      head: ['ID', 'Pillar', 'Applicable questions', 'Reason'],
      rows: notAssessed.map((p) => [p.pillarId, p.name, p.total, stateReason(p, meta.layer)]),
      columnStyles: { 0: { cellWidth: 12 }, 2: { halign: 'center', cellWidth: 24 } },
      bodyFontSize: 7,
    })
  }

  r.sectionHeading(`Not applicable (${notApplicable.length})`)
  if (notApplicable.length === 0) {
    r.paragraph('Every pillar has at least one question under this layer.')
  } else {
    r.table({
      head: ['ID', 'Pillar', 'Reason'],
      rows: notApplicable.map((p) => [p.pillarId, p.name, stateReason(p, meta.layer)]),
      columnStyles: { 0: { cellWidth: 12 } },
      bodyFontSize: 7,
    })
  }

  /* ── Observations ──────────────────────────────────────────────── */
  r.page('Prioritised observations', 'Derived from the widest gaps that clear the coverage floor.')
  if (gaps.length === 0) {
    r.paragraph(
      `No pillar clears the ${Math.round(RANK_MIN_CONFIDENCE * 100)}% coverage floor, so no ` +
        `observation is offered. Answering more of the diagnostic is the next step, not ` +
        `acting on a finding this thin.`,
    )
  } else {
    gaps.forEach((p, i) => {
      const pillar = PILLARS.find((x) => x.id === p.pillarId)
      r.sectionHeading(`${i + 1}. ${p.name} — ${show1(p.score)} / 5.0 (${LEVEL_LABEL[Math.round(p.score as number)]})`)
      if (pillar?.buyerPain) r.paragraph(pillar.buyerPain)
      r.bullets(
        [
          `Coverage: ${p.answered} of ${p.total} applicable questions answered ` +
            `(${Math.round(p.confidence * 100)}% of question weight).`,
          `Gap to Optimising: ${show1(gapTo5(p))} levels; weighted shortfall ${show1(weightedShortfall(p))}.`,
          pillar?.deliverables[0]
            ? `First deliverable: ${pillar.deliverables[0]}.`
            : 'No deliverable is registered against this pillar.',
        ].filter(Boolean),
      )
    })

    if (strengths.length > 0) {
      r.sectionHeading('Relative strengths')
      r.bullets(
        strengths.map(
          (p) =>
            `${p.name} — ${show1(p.score)} / 5.0 (${LEVEL_LABEL[Math.round(p.score as number)]}), ` +
            `${Math.round(p.confidence * 100)}% coverage.`,
        ),
      )
      r.paragraph(
        `Strengths and gaps are a partition: with few pillars ranked, a pillar is reported as a ` +
          `gap rather than a strength, because calling a thinly-evidenced pillar a strength ` +
          `overstates what was measured.`,
        { color: SLATE, size: 8 },
      )
    }
  }

  /* ── Current vs target (G2) — only when targets exist, never a stub ──
     Captured and displayed as-is; the interpreting gap register is G3's. */
  if (targets.length > 0) {
    // ASCII '-' in "target - current" on purpose — U+2212 is not WinAnsi and
    // ships as mojibake (D-019; the capture guard caught this exact line).
    r.page('Current vs target', 'Target maturity per pillar as set on the diagnostic. Delta is target - current, unjudged.')
    r.table({
      head: ['ID', 'Pillar', 'Current', 'Target', 'Delta'],
      rows: outcomes
        .filter((p) => targetOf.has(p.pillarId))
        .map((p) => {
          const t = targetOf.get(p.pillarId) as number
          const delta = p.state === 'scored' ? t - (p.score as number) : null
          return [
            p.pillarId,
            p.name,
            scoreLabel(p),
            `${t} — ${LEVEL_LABEL[t]}`,
            delta === null ? '—' : `${delta >= 0 ? '+' : ''}${show1(delta)}`,
          ]
        }),
      columnStyles: { 0: { cellWidth: 12 }, 2: { halign: 'center' }, 4: { halign: 'center', cellWidth: 18 } },
    })
    r.paragraph(
      `A target on an unassessed pillar is listed with no delta — the ambition is recorded, the ` +
        `distance to it is not yet measured. Nothing here ranks or colour-codes the deltas; that ` +
        `interpretation is the gap register's, which this document deliberately precedes.`,
      { color: SLATE, size: 8 },
    )
  }

  /* ── Evidence appendix (G2) — only questions that HAVE evidence ──
     Omitted entirely when none: an empty appendix page would be a placeholder,
     and a placeholder under a client's name is the D-001 shape. */
  if (evidence.length > 0) {
    r.page(
      'Evidence appendix',
      `${evidence.length} of ${answeredCount} answered questions carry an evidence note. The rest are scored assertions awaiting evidence.`,
    )
    for (const { q, note } of evidence) {
      r.pageBreakIfNeeded(26)
      r.sectionHeading(`${q.id} · ${q.pillarId}`)
      r.text(q.text, { size: 8, color: SLATE, gapAfter: 1 })
      r.keyValueBlock([
        ['Answer', answers[q.id] !== undefined ? `${answers[q.id]} — ${LEVEL_LABEL[answers[q.id]]}` : 'Not answered'],
        ['Evidence', note],
      ])
    }
  }

  return r.build()
}
