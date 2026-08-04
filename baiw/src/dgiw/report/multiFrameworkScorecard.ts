/**
 * Multi-framework scorecard — all four side by side.
 *
 * The capability a generic maturity model cannot match: one evidence base read
 * four ways, with the coverage gaps stated rather than hidden. A bank whose
 * regulator speaks COBIT and whose data office speaks DMBOK gets both from one
 * assessment, reconciled, and can see where the two frameworks disagree about
 * what matters.
 *
 * THE FOUR OVERALLS LANDING CLOSE TOGETHER IS THE CORRECT RESULT
 *
 * Every framework score is a convex combination of the same eleven pillar
 * scores, so the overalls are bounded by how much the frameworks' emphases
 * differ. This document is built to be read that way — the overalls are shown
 * together with their spread, and the per-framework worst-three lists are given
 * more room than the headline numbers, because that is where the four views
 * actually diverge and it is what a consultant presents.
 *
 * ARTEFACT ID — NOW AN EXACT MATCH, PREVIOUSLY A STRETCH
 *
 * This shipped against AR-40 "Monthly scorecard with trend and commentary",
 * which matched the SHAPE and nothing else: AR-40 is the rung-4 operational
 * scorecard tracking a live programme, owned by the DG Office, and it carries a
 * trend line that a single point-in-time assessment cannot have. A consultant
 * reading /dg/deliverables was being told this was rung 4 and someone else's to
 * produce, both wrong.
 *
 * AR-48 was added for it — rung 1, Engagement Lead, core. Pillar P01, matching
 * AR-01, for the same reason given in frameworkAlignment.ts: this is the
 * maturity assessment in four vocabularies, not a new measurement.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import { applicableQuestions } from '../scoring'
import { DEFAULT_TIER, TIER_META, type AssessmentTier } from '../tier'
import diagnostic from '../data/diagnostic.json'
import type { ReportMeta } from '../../report/types'
import { inducedPillarWeights, projectAll, type FrameworkProjection } from '../projection'
import { findingCodes, findingNames, leafCount, worstFindings, type Finding } from './findings'
import { LEVEL_LABEL } from '../scoring'
import {
  ONE_ASSESSMENT,
  SCALE_CAVEAT,
  SHARES_EXPLAINED,
  STRUCTURE_CAVEATS,
  WEIGHTS_ARE_OURS,
  confidenceLine,
  FRAMEWORKS,
} from './frameworkNotes'
import pillarsData from '../data/pillars.json'
import type { DiagnosticData, Pillar } from '../types'

const PILLARS = [...(pillarsData as Pillar[])].sort((a, b) => (a.id < b.id ? -1 : 1))
const DIAG = diagnostic as DiagnosticData

/**
 * artefactRegister: "Multi-framework maturity scorecard", rung 1, owned by the
 * Engagement Lead, core. An exact catalogue match.
 */
export const MULTI_FRAMEWORK_ARTEFACT_ID = 'AR-48'

export interface MultiFrameworkInput {
  meta: ReportMeta
  answers: Record<string, number>
  /**
   * G2: the assessment tier. The answer map is restricted to the tier's
   * question set BEFORE projection — the projection math is deliberately
   * untouched; it simply receives fewer answers, exactly as if the out-of-tier
   * questions had never been asked. Defaults to deep, the identity.
   */
  tier?: AssessmentTier
}

const pct = (x: number): string => `${Math.round(x * 100)}%`
const show1 = (n: number | null): string => (n === null ? '—' : (Math.round(n * 10) / 10).toFixed(1))
const show2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2)

/**
 * One percentage, or a range when a collapsed finding's leaves differ.
 *
 * Identical decomposition does not imply identical scope: a dimension whose
 * banking-only entry drops out under a core engagement can renormalise onto the
 * same pillars as one that never had it, scoring the same way from less of the
 * framework's definition. Printing the first leaf's figure would silently
 * attribute one leaf's scope to the other.
 */
function shareRange(f: Finding, pick: (d: Finding['leaves'][number]) => number): string {
  const vs = f.leaves.map(pick)
  const lo = Math.min(...vs)
  const hi = Math.max(...vs)
  return Math.round(lo * 100) === Math.round(hi * 100) ? pct(lo) : `${pct(lo)}–${pct(hi)}`
}

function overallLabel(p: FrameworkProjection): string {
  if (p.state === 'not-applicable') return 'NOT APPLICABLE'
  if (p.state === 'not-assessed') return 'NOT ASSESSED'
  return show1(p.overall)
}

/**
 * Weakest three FINDINGS, not rows — see `findings.ts`.
 *
 * This used to slice the three lowest-scoring leaves, which meant DGI's list was
 * DGI04, DGI05 and DGI08 all at one number, because each mapped wholly to P01.
 * Three rows, one finding, and a real third priority pushed off the page.
 */
const worstThree = (p: FrameworkProjection): Finding[] => worstFindings(p, 3)

export function buildMultiFrameworkScorecardPdf(input: MultiFrameworkInput): jsPDF {
  const { meta } = input
  const tier = input.tier ?? DEFAULT_TIER
  const tierQuestions = applicableQuestions(DIAG.questions, meta.layer, tier)
  const answers: Record<string, number> = {}
  for (const q of tierQuestions) if (input.answers[q.id] !== undefined) answers[q.id] = input.answers[q.id]
  const answeredCount = Object.keys(answers).length
  const projections = projectAll(answers, meta.layer)
  const scored = projections.filter((p) => p.state === 'scored')
  const overalls = scored.map((p) => p.overall as number)
  const spread = overalls.length ? Math.max(...overalls) - Math.min(...overalls) : 0

  const r = createReport(
    meta,
    contentKey([
      // G2: a Quick-tier scorecard and a Deep-tier scorecard must never share
      // a fingerprint, even when their projections happen to coincide.
      `tier:${tier}`,
      `coverage:${answeredCount}/${tierQuestions.length}`,
      ...projections.flatMap((p) => [
        `fw:${p.code}=${p.state}:${p.overall === null ? 'null' : p.overall.toFixed(6)}`,
        ...p.dimensions
          .filter((d) => d.isLeaf)
          .map((d) => `dim:${d.dimensionId}=${d.state}:${d.score === null ? 'null' : d.score.toFixed(6)}`),
      ]),
    ]),
  )

  r.cover('Multi-Framework Scorecard', `${projections.length} published frameworks, one assessment`)

  /* ---- the headline, framed correctly ---- */
  r.page('One assessment, four vocabularies')
  r.paragraph(ONE_ASSESSMENT)
  r.table({
    head: ['Framework', 'Version', 'Overall', 'Level', 'Retained', 'Scored', 'Confidence'],
    rows: projections.map((p) => {
      const f = FRAMEWORKS.find((x) => x.id === p.frameworkId)
      return [
        p.code,
        f?.versionLabel ?? '—',
        overallLabel(p),
        p.state === 'scored' ? LEVEL_LABEL[Math.round(p.overall as number)] : '—',
        pct(p.retainedShare),
        pct(p.scoredShare),
        f?.structureConfidence ?? '—',
      ]
    }),
    columnStyles: {
      2: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
    },
    bodyFontSize: 7,
  })
  r.keyValueBlock([
    ['Spread across frameworks', scored.length ? show2(spread) : 'not comparable — fewer than two frameworks scored'],
    // G2: the tier line sits beside the scores it qualifies, not in a footnote.
    ['Assessment tier', TIER_META[tier].label],
    ['Coverage at this tier', `${answeredCount} of ${tierQuestions.length} applicable questions answered`],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
  ])
  r.paragraph(
    scored.length < 2
      ? 'Fewer than two frameworks are scored, so no comparison is available.'
      : spread < 0.2
        ? `A spread of ${show2(spread)} means the four frameworks agree closely about overall maturity, which is ` +
          `what one evidence base should produce. Read the per-framework findings below rather than the ` +
          `headline figures — that is where the four views differ.`
        : `A spread of ${show2(spread)} reflects genuinely different emphases: the frameworks weight the same ` +
          `eleven capabilities differently, so the same evidence reads better under one and worse under ` +
          `another. The framework a bank is held to therefore matters.`,
    { size: 8 },
  )
  r.paragraph(SCALE_CAVEAT, { color: SLATE, size: 8 })

  /* ---- where they actually differ ---- */
  r.page('Priorities by framework', 'The weakest three findings each framework identifies')
  r.paragraph(
    'This is the part that differs. Two frameworks can agree on an overall figure and still ' +
      'disagree about what to fix first, because they group and weight the same capabilities ' +
      'differently. A consultant presents this table, not the overall.',
    { color: SLATE, size: 8 },
  )
  r.paragraph(
    'Three FINDINGS, which is not always three dimensions. Where two dimensions score identically ' +
      'through an identical set of pillars, they are one finding and are shown on one row with the ' +
      'reason stated — they cannot diverge, so presenting them separately would overstate how much ' +
      'there is to do. Dimensions that merely happen to share a number are kept apart.',
    { color: SLATE, size: 8 },
  )
  for (const p of projections) {
    const three = worstThree(p)
    r.pageBreakIfNeeded(28)
    const covered = leafCount(three)
    r.sectionHeading(
      `${p.code} — ${overallLabel(p)}` +
        (covered === three.length
          ? ''
          : `  ·  ${three.length} findings across ${covered} dimensions`),
    )
    if (three.length === 0) {
      r.paragraph('No dimension of this framework is scored, so no priorities can be drawn.', { size: 8 })
      continue
    }
    r.table({
      head: ['Code', 'Dimension', 'Score', 'Retained', 'Scored', 'Driven by'],
      rows: three.map((f) => {
        const d = f.leaves[0]
        return [
          findingCodes(f),
          f.cause === null ? d.name : `${findingNames(f)} — ${f.cause}`,
          // Two decimals in this table only — see the matching note on the page.
          // At one decimal, 2.50 and 2.55 both read 2.5 and two distinct findings
          // look like a failed collapse.
          show2(f.score),
          // A collapsed finding's leaves share a decomposition, not necessarily a
          // scope. Ranges are printed rather than one leaf's figure standing in.
          shareRange(f, (x) => x.retainedShare),
          shareRange(f, (x) => x.scoredShare),
          d.contributions
            .slice()
            .sort((a, b) => b.weight - a.weight || (a.spineId < b.spineId ? -1 : 1))
            .map((c) => `${c.spineId} ${pct(c.weight)}`)
            .join(', '),
        ]
      }),
      columnStyles: {
        0: { cellWidth: 26 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 16, halign: 'center' },
      },
      bodyFontSize: 7,
      gapAfter: 5,
    })
  }
  // Compared on the dimensions nominated, not on the finding grouping — two
  // frameworks that name the same dimensions have the same priorities whether or
  // not one of them happened to tie.
  const signatures = new Set(
    projections.map((p) => worstThree(p).flatMap((f) => f.codes).join('|')),
  )
  r.paragraph(
    signatures.size === 1
      ? 'All four frameworks nominate the same dimensions. On this evidence the four ' +
        'scorecards differ only in arithmetic, not in what would be presented.'
      : `The four frameworks nominate ${signatures.size} distinct sets of priorities. The scorecards ` +
        `differ in substance, not only in vocabulary.`,
    { size: 8 },
  )

  /* ---- coverage gaps ---- */
  r.page('Coverage', 'What each framework reaches, and what it does not')
  r.paragraph(
    'A framework that maps no capability to a pillar is not incomplete — it is a statement about ' +
      'that framework’s scope. DGI, for instance, is governance apparatus and says nothing about ' +
      'platform or analytics. Knowing which framework is silent about a capability is itself a ' +
      'finding when choosing which one to be held to.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Framework', 'Leaf dims', 'Not applicable', 'Not assessed', 'Partly in scope', 'Pillars unmapped'],
    rows: projections.map((p) => {
      const leaves = p.dimensions.filter((d) => d.isLeaf)
      const w = inducedPillarWeights(p.frameworkId, meta.layer)
      const unmapped = PILLARS.filter((pl) => (w[pl.id] ?? 0) === 0)
      return [
        p.code,
        leaves.length,
        leaves.filter((d) => d.state === 'not-applicable').length,
        leaves.filter((d) => d.state === 'not-assessed').length,
        leaves.filter((d) => d.state === 'scored' && d.retainedShare < 1 - 1e-9).length,
        unmapped.length ? unmapped.map((pl) => pl.id).join(', ') : 'none',
      ]
    }),
    columnStyles: {
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 24, halign: 'center' },
    },
    bodyFontSize: 7,
  })
  r.paragraph(SHARES_EXPLAINED, { color: SLATE, size: 8 })

  for (const p of projections) {
    const w = inducedPillarWeights(p.frameworkId, meta.layer)
    const unmapped = PILLARS.filter((pl) => (w[pl.id] ?? 0) === 0)
    if (unmapped.length === 0) continue
    r.pageBreakIfNeeded(20)
    r.text(`${p.code} maps nothing to:`, { size: 8, color: SLATE, gapAfter: 1 })
    r.bullets(unmapped.map((pl) => `${pl.id} ${pl.name}`), { size: 8 })
  }

  /* ---- pillar emphasis ---- */
  r.page('Where each framework puts its weight')
  r.paragraph(
    'The share of each framework’s total attention that falls on each capability pillar, derived ' +
      'from the crosswalk alone and independent of any answers. This is why the same evidence ' +
      'reads differently under different frameworks.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Pillar', 'Capability', ...projections.map((p) => p.code)],
    rows: PILLARS.map((pl) => [
      pl.id,
      pl.short,
      ...projections.map((p) => pct(inducedPillarWeights(p.frameworkId, meta.layer)[pl.id] ?? 0)),
    ]),
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 40 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
    },
    bodyFontSize: 7,
  })

  /* ---- caveats ---- */
  r.page('What is published and what is ours')
  r.paragraph(WEIGHTS_ARE_OURS)
  r.sectionHeading('Structure confidence by framework')
  r.bullets(FRAMEWORKS.map(confidenceLine), { size: 8 })
  r.sectionHeading('Structural qualifications')
  r.bullets(STRUCTURE_CAVEATS, { size: 8 })

  return r.build()
}
