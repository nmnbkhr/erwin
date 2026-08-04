/**
 * Re-assessment delta report — PDF only. AR-58. G6.
 *
 * ═══ THE STOP CONDITION, ANSWERED BEFORE MINTING (AR-57's precedent) ═══════
 *
 * The register was read for an existing row matching a re-assessment/delta
 * deliverable before this id was created. Three candidates, none of them this
 * document, and each says so in its own note:
 *
 *   AR-40 "Monthly scorecard with trend and commentary" — observed. DQ RULE
 *         results over time, measured at the client; the note calls the trend
 *         "a second thing to invent". Not the diagnostic, not snapshots.
 *   AR-41 "Council pack, decisions log" — observed; the AR-57 boundary note
 *         already records why workbench documents do not restate it.
 *   AR-42 "Benefit realisation report" — observed. Client-measured metrics
 *         against the AR-03 pain baseline; its note names "gate G6 rejects a
 *         retro-fitted baseline" — BOTH ends live at the client.
 *
 * This document is none of those: it is the movement between two frozen
 * WORKBENCH captures of the diagnostic, so it takes a new id rather than
 * wearing an observed row's name — the AR-46/AR-47 lesson, applied before
 * building.
 *
 * ═══ WHAT IT CLAIMS ════════════════════════════════════════════════════════
 *
 * Exactly what trajectory/deltas.ts computes, and nothing of its own: pillar
 * deltas where both snapshots score the pillar, exclusions with reasons,
 * overall movement across the comparable set only, every claim citing both
 * snapshot digests. Movement is PAST FACT — the CP4 inspection greps the
 * rendered text for forward-looking vocabulary and expects zero.
 *
 * REFUSES (typed Refusal, D-020) without two comparable snapshots — there is
 * no reference mode for measurements (AR-55's argument): an illustrative
 * delta would be two fabricated numbers and a subtraction.
 *
 * ═══ THE CHART IS DRAWN UNDER NON-NEGOTIABLE 4, AND THE GATE CAN CHECK IT ══
 *
 * Straight segments between captured points only — jsPDF lines and rects,
 * NEVER circle/ellipse/roundedRect, which emit bezier curve operators into
 * the content stream. CHART-HONEST asserts both halves against the real
 * bytes: zero curve operators in the whole document, and every point marker
 * sitting at the exact y the compiled scoring engine puts its value, mapped
 * through the DELTA_CHART constants exported below (the gate applies the
 * linear 1..5 map itself, so a corrupted map here cannot vouch for itself).
 *
 * Determinism: no clock, no randomness; ASCII only in rendered strings
 * (D-019 — arrows are '->'). Tier+coverage+both digests in meta's digest.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, MARGIN, SLATE } from '../../report/spine'
import { Refusal } from './refusal'
import type { ReportMeta } from '../../report/types'
import {
  comparableSnapshotPairs,
  type AssessmentSnapshot,
} from '../trajectory/snapshots'
import {
  B_NO_FORECAST,
  B_SAME_TIER,
  B_SCORED_BOTH,
  snapshotDeltas,
  type ComparableDeltas,
} from '../trajectory/deltas'
import { TIER_META } from '../tier'

/**
 * implementationPlan.json → artefactRegister: "Re-assessment delta report",
 * rung 4, owned by the Engagement Lead. Marked `derived` — which is what
 * permits this generator to exist at all, asserted by ARTEFACT-EVIDENCE.
 */
export const DELTA_REPORT_ARTEFACT_ID = 'AR-58'

/* ── the refusal — ONE predicate, imported by the UI and enforced here ──── */

/**
 * Why this document cannot be generated, or null when it can. Two comparable
 * snapshots are the document's entire evidence base; without them there is
 * nothing true to print.
 */
export function deltaReportRefusal(snapshots: AssessmentSnapshot[]): string | null {
  if (snapshots.length < 2) {
    return (
      `Only ${snapshots.length} snapshot${snapshots.length === 1 ? ' has' : 's have'} been captured — ` +
      'a delta needs two frozen states. Capture snapshots on the Diagnostic results view; ' +
      'there is no reference mode for measurements.'
    )
  }
  if (comparableSnapshotPairs(snapshots).length === 0) {
    return (
      `${snapshots.length} snapshots exist but no two share a tier and layer, so no pair is ` +
      'comparable. Coverage differs across tiers by construction; re-assess at the tier of the ' +
      'snapshot you want to move against, then generate.'
    )
  }
  return null
}

export interface DeltaReportInput {
  meta: ReportMeta
  snapshots: AssessmentSnapshot[]
  /** Explicit pair by snapshot id; defaults to the most recent comparable pair. */
  aId?: string
  bId?: string
}

/* ── the chart's declared geometry — the gate recomputes from THESE ─────── */

/**
 * Absolute page geometry for the delta chart, in mm. The chart page is laid
 * out from these constants alone (no cursor state), which is what lets
 * CHART-HONEST recompute every marker position from the compiled scoring
 * engine and these numbers, then demand the content stream agree.
 */
export const DELTA_CHART = {
  /** Side of the square point marker. Distinctive on purpose — the gate finds markers by it. */
  markerMm: 2.2,
  tileW: 58,
  tileH: 40,
  colGap: 3,
  rowGap: 14,
  cols: 3,
  /**
   * Top-left of the first tile, on the chart page. Below the page heading AND
   * the intro paragraph — measured against the rendered page, because the
   * first value (40) drew the tiles through the paragraph's own lines. Eleven
   * tiles (4 rows) still close at y=264, inside the footer reserve.
   */
  originX: MARGIN,
  originY: 62,
  /** Inside a tile: the plot area the 1..5 scale maps onto. */
  padTop: 3,
  padBottom: 9,
  padLeft: 10,
  padRight: 4,
  /** X of the two captures inside a tile's plot box, as fractions of its width. */
  xFrom: 0.22,
  xTo: 0.78,
} as const

/** Plot-box height of one tile. */
const plotH = DELTA_CHART.tileH - DELTA_CHART.padTop - DELTA_CHART.padBottom
const plotW = DELTA_CHART.tileW - DELTA_CHART.padLeft - DELTA_CHART.padRight

/** Tile origin for the i-th charted pillar. */
export function deltaChartTileOrigin(i: number): { x: number; y: number } {
  const row = Math.floor(i / DELTA_CHART.cols)
  const col = i % DELTA_CHART.cols
  return {
    x: DELTA_CHART.originX + col * (DELTA_CHART.tileW + DELTA_CHART.colGap),
    y: DELTA_CHART.originY + row * (DELTA_CHART.tileH + DELTA_CHART.rowGap),
  }
}

/**
 * The linear 1..5 -> y map inside tile i. THE contract of non-negotiable 4's
 * "axes labeled with real values": the gate applies this same arithmetic from
 * the exported constants, so a drawing that plots a value no snapshot
 * contains disagrees with the recomputation at the byte level.
 */
export function deltaChartPointY(tileIndex: number, value: number): number {
  const { y } = deltaChartTileOrigin(tileIndex)
  return y + DELTA_CHART.padTop + ((5 - value) / 4) * plotH
}

export function deltaChartPointX(tileIndex: number, which: 'from' | 'to'): number {
  const { x } = deltaChartTileOrigin(tileIndex)
  return x + DELTA_CHART.padLeft + (which === 'from' ? DELTA_CHART.xFrom : DELTA_CHART.xTo) * plotW
}

const show1 = (n: number): string => (Math.round(n * 10) / 10).toFixed(1)
const show2 = (n: number): string => (Math.round(n * 100) / 100).toFixed(2)
const signed1 = (n: number): string => `${n >= 0 ? '+' : ''}${show1(n)}`
const day = (iso: string): string => iso.slice(0, 10)

/* ── the builder ───────────────────────────────────────────────────────── */

export function buildDeltaReportPdf(input: DeltaReportInput): jsPDF {
  const { meta, snapshots } = input

  const refusal = deltaReportRefusal(snapshots)
  if (refusal) throw new Refusal(refusal)

  const byId = new Map(snapshots.map((s) => [s.id, s]))
  const defaultPair = comparableSnapshotPairs(snapshots)[0]
  const a = (input.aId && byId.get(input.aId)) || defaultPair[0]
  const b = (input.bId && byId.get(input.bId)) || defaultPair[1]

  const result = snapshotDeltas(a, b)
  if (!result.comparable) {
    // A generator refuses where the UI explains — the not-comparable surface
    // is /dg/trajectory; a PDF of "these cannot be compared" is not a
    // deliverable anyone was promised.
    throw new Refusal(result.rule)
  }
  const r = buildFrom(meta, a, b, result)
  return r
}

function buildFrom(
  meta: ReportMeta,
  a: AssessmentSnapshot,
  b: AssessmentSnapshot,
  result: ComparableDeltas,
): jsPDF {
  const { deltas, exclusions, overall, citations, tier } = result
  const aAnswered = Object.keys(a.answers).length
  const bAnswered = Object.keys(b.answers).length

  // What this document renders: both frozen states (by digest), every delta
  // with its two inputs, every exclusion with its reasons, the overall over
  // the comparable set. A third snapshot entering the cited pair, one answer
  // moved in either state, or a different tier is a different document.
  const doc = createReport(
    meta,
    contentKey([
      `mode:${meta.mode ?? 'engagement'}`,
      `tier:${tier}`,
      `coverage:${aAnswered}->${bAnswered}`,
      `cite:a:${citations.aDigest}:${citations.aLabel}:${citations.aAt}`,
      `cite:b:${citations.bDigest}:${citations.bLabel}:${citations.bAt}`,
      ...deltas.map(
        (d) => `delta:${d.pillarId}=${d.from.toFixed(6)}->${d.to.toFixed(6)}:` +
          `${d.fromCoverage.answered}/${d.fromCoverage.applicable}->${d.toCoverage.answered}/${d.toCoverage.applicable}`,
      ),
      ...exclusions.map((x) => `excl:${x.pillarId}=${x.reasons.join('|')}`),
      ...(overall ? [`overall:${overall.from.toFixed(6)}->${overall.to.toFixed(6)}:${overall.pillarCount}`] : []),
    ]),
  )

  doc.cover(
    'Re-assessment Delta Report',
    `"${citations.aLabel}" (${day(citations.aAt)}) -> "${citations.bLabel}" (${day(citations.bAt)}) at the ${TIER_META[tier].label} tier`,
  )

  /* ---- the boundaries, in full, before any number ---- */
  doc.page('What this report states, and what it does not')
  doc.paragraph(B_SAME_TIER)
  doc.paragraph(B_SCORED_BOTH)
  doc.paragraph(B_NO_FORECAST)
  doc.paragraph(
    'EVERY CLAIM CITES ITS TWO DIGESTS. Both snapshots are frozen records with content digests ' +
      'computed the way every report\'s /ID is; the pair cited below is the exact evidence for ' +
      'every number in this document, and a reader holding the workbench can verify both.',
    { color: SLATE, size: 8 },
  )
  doc.keyValueBlock([
    ['From snapshot', `"${citations.aLabel}" — captured ${day(citations.aAt)}`],
    ['From digest', citations.aDigest],
    ['To snapshot', `"${citations.bLabel}" — captured ${day(citations.bAt)}`],
    ['To digest', citations.bDigest],
    ['Assessment tier (both)', TIER_META[tier].label],
    ['Layer scope (both)', result.layer === 'all' ? 'Core chassis + banking overlay' : `${result.layer} layer only`],
    ['Answers captured', `${aAnswered} -> ${bAnswered}`],
    ['Pillars comparable in both', String(deltas.length)],
    ['Pillars excluded', String(exclusions.length)],
  ])

  /* ---- the deltas ---- */
  doc.page('Pillar movement', 'Both measurements per row; the citation is the pair on the previous page.')
  if (overall) {
    doc.paragraph(
      `Across the ${overall.pillarCount} pillar${overall.pillarCount === 1 ? '' : 's'} scored in both snapshots, ` +
        `the weighted overall moved ${show1(overall.from)} -> ${show1(overall.to)} (${signed1(overall.delta)}). ` +
        'Pillars outside that set contribute nothing to this figure.',
    )
  }
  if (deltas.length === 0) {
    doc.paragraph(
      'No pillar is scored in both snapshots, so no delta exists. The exclusions below say why, ' +
        'pillar by pillar — that absence is the finding, not a zero.',
    )
  } else {
    doc.table({
      head: ['Pillar', 'Name', 'From', 'To', 'Delta', 'Coverage from', 'Coverage to'],
      rows: deltas.map((d) => [
        d.pillarId,
        d.pillarShort,
        show1(d.from),
        show1(d.to),
        signed1(d.delta),
        `${d.fromCoverage.answered}/${d.fromCoverage.applicable}`,
        `${d.toCoverage.answered}/${d.toCoverage.applicable}`,
      ]),
      columnStyles: {
        0: { cellWidth: 16 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 24 },
        6: { halign: 'center', cellWidth: 24 },
      },
      bodyFontSize: 7,
    })
    // Past-fact sentences, one per moved pillar — the shape non-negotiable 5
    // requires of the council pack, kept identical here so the two documents
    // describe one movement in one voice.
    for (const d of deltas.filter((x) => x.delta !== 0)) {
      doc.paragraph(
        `${d.pillarId} moved ${show2(d.from)} -> ${show2(d.to)} (${signed1(d.delta)}) between ` +
          `"${citations.aLabel}" and "${citations.bLabel}".`,
        { size: 8 },
      )
    }
  }
  doc.sectionHeading('Excluded from the comparison')
  if (exclusions.length === 0) {
    doc.paragraph(
      'Every pillar is scored in both snapshots. This list is empty because the engine excluded ' +
        'nothing, not because the check was skipped.',
      { size: 8 },
    )
  } else {
    doc.paragraph(B_SCORED_BOTH, { color: SLATE, size: 8 })
    doc.table({
      head: ['Pillar', 'Name', 'Why excluded'],
      rows: exclusions.map((x) => [x.pillarId, x.pillarName, x.reasons.join('; ')]),
      columnStyles: { 0: { cellWidth: 16 } },
      bodyFontSize: 7,
    })
  }

  /* ---- the chart ---- */
  doc.page('Movement, drawn', 'Two captured points per comparable pillar, joined by one straight segment.')
  doc.paragraph(
    'Drawn under the same rules as the numbers: captured points only, straight segments only, ' +
      'no smoothing and nothing extended beyond the captures. The y axis is the real 1..5 ' +
      'maturity scale; the two x positions are the two captures. Pillars without two scores are ' +
      'not drawn — they are in the exclusions table, not the picture.',
    { size: 8 },
  )
  if (deltas.length === 0) {
    doc.paragraph('Nothing can be drawn: no pillar is scored in both snapshots.', { color: SLATE, size: 8 })
  } else {
    drawDeltaChart(doc.doc, result)
    const rows = Math.ceil(deltas.length / DELTA_CHART.cols)
    doc.moveTo(DELTA_CHART.originY + rows * (DELTA_CHART.tileH + DELTA_CHART.rowGap) + 4)
    doc.paragraph(
      `From "${citations.aLabel}" (${day(citations.aAt)}, digest ${citations.aDigest}) to ` +
        `"${citations.bLabel}" (${day(citations.bAt)}, digest ${citations.bDigest}).`,
      { color: SLATE, size: 7 },
    )
  }

  return doc.build()
}

/**
 * The chart itself, through the raw doc escape hatch (absolute geometry, so
 * the caller moveTo()s afterwards — the spine's documented contract). Lines
 * and rects ONLY: jsPDF's circle/ellipse/roundedRect emit bezier operators,
 * and CHART-HONEST fails the build on any curve operator in this document.
 */
function drawDeltaChart(pdf: jsPDF, result: ComparableDeltas): void {
  const { deltas } = result
  const C = DELTA_CHART
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.2)

  deltas.forEach((d, i) => {
    const o = deltaChartTileOrigin(i)

    // Tile title: pillar id + short name, in ink — identity is never color-alone.
    pdf.setFontSize(7)
    pdf.setTextColor(51, 65, 85)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${d.pillarId} ${d.pillarShort}`, o.x, o.y)
    pdf.setFont('helvetica', 'normal')

    // The real 1..5 scale: a labelled gridline per level.
    pdf.setDrawColor(226, 232, 240)
    pdf.setTextColor(148, 163, 184)
    pdf.setFontSize(5.5)
    for (let v = 1; v <= 5; v++) {
      const y = deltaChartPointY(i, v)
      pdf.line(o.x + C.padLeft, y, o.x + C.tileW - C.padRight, y)
      pdf.text(String(v), o.x + C.padLeft - 2, y + 0.8, { align: 'right' })
    }

    const xF = deltaChartPointX(i, 'from')
    const xT = deltaChartPointX(i, 'to')
    const yF = deltaChartPointY(i, d.from)
    const yT = deltaChartPointY(i, d.to)

    // ONE straight segment between the two captured points.
    pdf.setDrawColor(225, 29, 72)
    pdf.setLineWidth(0.5)
    pdf.line(xF, yF, xT, yT)
    pdf.setLineWidth(0.2)

    // Square markers — rects, never circles (beziers). Centered on the value.
    pdf.setFillColor(225, 29, 72)
    pdf.rect(xF - C.markerMm / 2, yF - C.markerMm / 2, C.markerMm, C.markerMm, 'F')
    pdf.rect(xT - C.markerMm / 2, yT - C.markerMm / 2, C.markerMm, C.markerMm, 'F')

    // The values, in ink beside their points; the captures label the x axis.
    pdf.setTextColor(71, 85, 105)
    pdf.setFontSize(6)
    // Above the point — except near the top of the scale, where "above" is
    // the tile title's line; there the label sits below its marker instead.
    const labelFor = (value: number, y: number) => (value > 4.5 ? y + 3.4 : y - 1.6)
    pdf.text(show1(d.from), xF, labelFor(d.from, yF), { align: 'center' })
    pdf.text(show1(d.to), xT, labelFor(d.to, yT), { align: 'center' })
    pdf.setFontSize(5.5)
    pdf.setTextColor(100, 116, 139)
    const labelY = o.y + C.tileH - 4
    pdf.text(fitLabel(result.citations.aLabel), xF, labelY, { align: 'center' })
    pdf.text(fitLabel(result.citations.bLabel), xT, labelY, { align: 'center' })
  })
}

/** Keep an x-axis label inside its half-tile — an ellipsis, never an overlap. */
const fitLabel = (label: string): string => (label.length > 14 ? `${label.slice(0, 13)}...` : label)
