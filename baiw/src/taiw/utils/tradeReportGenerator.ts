// jsPDF stays as a TYPE, for drawRadarChart's `doc` parameter — the chart is
// drawn through the spine's escape hatch. `jspdf-autotable` is gone entirely:
// all six tables now go through ReportDoc.table(), which is where the
// `lastAutoTable.finalY` cast and the 15mm margin live.
import type jsPDF from 'jspdf'
import { saveAs } from 'file-saver'
import benchmarks from '../../data/taiw/benchmarks.json'
import capabilities from '../../data/taiw/capabilities.json'
import dataRequirements from '../../data/taiw/dataRequirements.json'

import { createReport, contentKey, saveReport, MARGIN, FOOTER_RESERVE } from '../../report/spine'
import { formatCoverDate, reportFilename } from '../../report/naming'
import { downloadCsv, byStringKey, type CsvColumn } from '../../report/csv'
import type { ReportMeta } from '../../report/types'

/*
 * Artefact ids for the two deliverables on the spine.
 *
 * `MR-`, not `AR-`: declared in MODULE_ARTEFACT_IDS in scripts/check-dgiw.mjs,
 * not in DGIW's implementationPlan.json artefactRegister, because TAIW has no
 * artefact register to be a catalogue entry of. They drive the filename and the
 * trailer /ID seed and are deliberately NOT printed on the cover —
 * `useReportMeta` sets `coverTag: ''` for exactly that reason.
 *
 * `MR-TAIW-REGISTER` was `MR-TAIW-GAP` until D-001 was resolved by REMOVAL. The
 * document is a capability register — the 100 real TCF capabilities and their
 * authored attributes — and it no longer reports a gap, because TAIW has no
 * per-capability gap to report. See the note on `TcfCapability` below.
 */
export const TRADE_MATURITY_ARTEFACT_ID = 'MR-TAIW-MATURITY'
export const TRADE_ROADMAP_ARTEFACT_ID = 'MR-TAIW-ROADMAP'
export const TRADE_REGISTER_ARTEFACT_ID = 'MR-TAIW-REGISTER'

// ── Types ──
interface CategoryScore {
  category: string
  current: number
  desired: number
  gap: number
}

interface AssessmentData {
  scores: CategoryScore[]
  overallScore: number
  answeredCategories: number
  totalCategories: number
}

/*
 * ── TCF capabilities — structure, deliberately NOT scored ──────────────────
 *
 * D-001, resolved by removal, exactly as in BAIW. TACR's eight categories are a
 * generic maturity dimension; TCF's 100 capabilities are WCO-DM-specific customs
 * functions. ORTHOGONAL AXES, no join in any dataset, therefore no honest
 * per-capability score — and no column heading that makes one true.
 *
 * What was here invented one: 96 rows named `${cat} Strategy & Planning` and
 * friends, matching no row in capabilities.json, scored from a TACR category
 * plus `(Math.random() - 0.5) * 0.6`, with the theme column taken from a
 * hand-written `tcfThemes` array indexed by category position — a mapping
 * nothing in the data supports.
 *
 * TCF's own `priority` field IS authored per capability and is real. It is not a
 * maturity score and must not be read as one: it is the framework's editorial
 * view of which capabilities matter, fixed in the dataset and identical for
 * every client. It is reported as such.
 *
 * The path to a real per-capability score is authoring `capabilityLinks` on
 * TACR's 640 questions. Not scheduled. See docs/known-defects.md D-001.
 */
type TcfCapability = (typeof capabilities)[number]

/** Exported so the report card counts from the data. See BAIW's equivalent. */
export const TRADE_CAPABILITY_COUNT = capabilities.length

/**
 * capability id → the WCO Data Model domains it depends on.
 *
 * `dataRequirements.json` records the relation the other way round, one row per
 * requirement carrying the capabilities that use it, so it is inverted once here.
 *
 * Coverage is 95 of 100 and the five without a requirement get an EMPTY cell,
 * not an assumed domain.
 *
 * It was 91 until D-007. Four ids in dataRequirements.json matched no capability
 * and this inversion dropped them silently — the short forms dropped the `&`
 * (`sanctions_embargo_screening`) where the TCF slug rule expands it to `_and_`,
 * which is how capabilities.json spells all 100. Corrected in the annotating
 * file, since the derivation and four other files agree with the long form.
 * A dangling id costs a real capability its whole cell here, and nothing warns.
 */
const wcoDomainsByCapability = ((): Map<string, string[]> => {
  const m = new Map<string, Set<string>>()
  for (const req of dataRequirements) {
    for (const capId of req.capabilities ?? []) {
      if (!m.has(capId)) m.set(capId, new Set())
      m.get(capId)!.add(req.wcoDomain)
    }
  }
  return new Map([...m].map(([id, set]) => [id, [...set].sort()]))
})()

const wcoDomainsFor = (cap: TcfCapability): string[] => wcoDomainsByCapability.get(cap.id) ?? []

/**
 * Priority classes in severity order, with anything unrecognised appended.
 *
 * Derived from the dataset rather than hardcoded to the three that happen to be
 * present today (CRITICAL 16, HIGH 65, MEDIUM 19, LOW 0): a fourth class added
 * to the JSON would otherwise vanish from the page with no error.
 */
const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const prioritiesPresent = (caps: readonly TcfCapability[]): string[] => {
  const present = [...new Set(caps.map(c => c.priority))]
  const known = PRIORITY_ORDER.filter(p => present.includes(p))
  return [...known, ...present.filter(p => !PRIORITY_ORDER.includes(p)).sort()]
}

/** One row of the page-13 coverage table: a TCF group. */
interface GroupCoverage {
  group: string
  theme: string
  count: number
  byPriority: Record<string, number>
  /** Capabilities in this group with at least one WCO DM domain recorded. */
  wcoLinked: number
}

/**
 * Group-level coverage of the TCF framework, in dataset order.
 *
 * Group rather than theme (six is a thin page) and rather than capability (100
 * rows is a register, which is what the CSV is for). Dataset order keeps each
 * theme's groups contiguous; alphabetical would interleave the six themes.
 */
function groupCoverage(caps: readonly TcfCapability[]): GroupCoverage[] {
  const rows = new Map<string, GroupCoverage>()
  for (const cap of caps) {
    let row = rows.get(cap.group)
    if (!row) {
      row = { group: cap.group, theme: cap.theme, count: 0, byPriority: {}, wcoLinked: 0 }
      rows.set(cap.group, row)
    }
    row.count++
    row.byPriority[cap.priority] = (row.byPriority[cap.priority] ?? 0) + 1
    if (wcoDomainsFor(cap).length > 0) row.wcoLinked++
  }
  return [...rows.values()]
}

const CATEGORIES = [
  'Strategy & Vision', 'Organization & Skills', 'Data Governance',
  'Information & Integration', 'Analytics & Technology', 'Infrastructure',
  'Processes & Automation', 'Outcomes & Impact', 'Overall Assessment'
]

const TEAL = [13, 148, 136] as const     // #0d9488
const CYAN = [6, 182, 212] as const      // #06b6d4
const GREEN = [16, 185, 129] as const    // #10B981
const SLATE = [100, 116, 139] as const   // #64748B
const WHITE = [255, 255, 255] as const

type RGB = readonly [number, number, number]

function colorForScore(score: number): RGB {
  if (score < 2) return [220, 38, 38]     // red
  if (score < 3) return [245, 158, 11]    // amber
  return [16, 185, 129]                    // green
}

function priorityLabel(gap: number): string {
  if (gap > 2) return 'Critical'
  if (gap > 1.5) return 'High'
  if (gap > 1) return 'Medium'
  return 'Low'
}

function levelLabel(score: number): string {
  const level = Math.round(score)
  const labels: Record<number, string> = {
    1: 'Initial', 2: 'Developing', 3: 'Defined', 4: 'Managed', 5: 'Optimizing'
  }
  return labels[level] || 'Not Assessed'
}

function levelDescription(level: number): string {
  const key = String(Math.round(level)) as keyof typeof benchmarks.maturityLevelDescriptions
  return benchmarks.maturityLevelDescriptions[key]?.description || ''
}

/*
 * `addHeaderFooter` used to live here: header rule, header text, footer rule,
 * footer text and watermark, called by hand on all seventeen content pages with
 * a hardcoded `totalPages = 18`. All of it is now `spine.ts` — `page()` paints
 * the chrome and `build()` stamps the footers last, over the REAL page count.
 */

// ── Draw radar chart using jsPDF canvas ──
function drawRadarChart(doc: jsPDF, data: CategoryScore[], centerX: number, centerY: number, radius: number) {
  const n = data.length
  const angleStep = (2 * Math.PI) / n

  // Draw grid
  for (let level = 1; level <= 5; level++) {
    const r = (level / 5) * radius
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    for (let i = 0; i < n; i++) {
      const a1 = -Math.PI / 2 + i * angleStep
      const a2 = -Math.PI / 2 + ((i + 1) % n) * angleStep
      doc.line(
        centerX + r * Math.cos(a1), centerY + r * Math.sin(a1),
        centerX + r * Math.cos(a2), centerY + r * Math.sin(a2)
      )
    }
  }

  // Draw axes and labels
  //
  // Same wrap-to-available-half treatment HAIW's radar got: a label centred at x
  // has only `min(x - MARGIN, pageWidth - MARGIN - x)` on its narrow side, so the
  // usable width is twice that half, not the page. Applied here prophylactically
  // — measured against the golden baseline, TAIW's nine labels were ALL already
  // inside the 15mm margin (page 3 right edge 552.76pt, zero runs past), because
  // nine axes at 40° put the horizontal ones closer in than HAIW's eight at 45°
  // and TAIW's category names are shorter. Unwrapped is still unwrapped: the
  // labels come from CATEGORIES, and a longer one added later would run off the
  // sheet exactly as HAIW's two did.
  const pageWidth = doc.internal.pageSize.getWidth()
  const labelLine = 3.5 // mm, the 7pt leading the rest of this chart reads at
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep
    const x = centerX + (radius + 12) * Math.cos(angle)
    const y = centerY + (radius + 12) * Math.sin(angle)
    doc.line(centerX, centerY, centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
    const half = Math.max(1, Math.min(x - MARGIN, pageWidth - MARGIN - x))
    const lines = doc.splitTextToSize(data[i].category, 2 * half) as string[]
    // Centred on the anchor rather than hung below it, so a label that folds
    // stays where the unwrapped one sat instead of drifting toward the chart.
    const top = y - ((lines.length - 1) * labelLine) / 2
    lines.forEach((line, li) => doc.text(line, x, top + li * labelLine, { align: 'center' }))
  }

  // Draw current scores (solid teal)
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(1.5)
  const currentPoints: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep
    const r = (data[i].current / 5) * radius
    currentPoints.push([centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)])
  }
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    doc.line(currentPoints[i][0], currentPoints[i][1], currentPoints[next][0], currentPoints[next][1])
  }

  // Draw desired scores (dashed cyan)
  doc.setDrawColor(...CYAN)
  doc.setLineWidth(1)
  const desiredPoints: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep
    const r = (data[i].desired / 5) * radius
    desiredPoints.push([centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)])
  }
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    doc.setLineDashPattern([3, 2], 0)
    doc.line(desiredPoints[i][0], desiredPoints[i][1], desiredPoints[next][0], desiredPoints[next][1])
  }

  // Draw Pakistan customs average (dotted gray)
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.8)
  const pkAvg = benchmarks.pakistanCustomsAverage
  for (let i = 0; i < n; i++) {
    const cat = data[i].category as keyof typeof pkAvg
    const val = (typeof pkAvg[cat] === 'number' ? pkAvg[cat] : 1.56) as number
    const angle = -Math.PI / 2 + i * angleStep
    const r = (val / 5) * radius
    const nextI = (i + 1) % n
    const nextCat = data[nextI].category as keyof typeof pkAvg
    const nextVal = (typeof pkAvg[nextCat] === 'number' ? pkAvg[nextCat] : 1.56) as number
    const nextAngle = -Math.PI / 2 + nextI * angleStep
    const nextR = (nextVal / 5) * radius
    doc.setLineDashPattern([1, 2], 0)
    doc.line(
      centerX + r * Math.cos(angle), centerY + r * Math.sin(angle),
      centerX + nextR * Math.cos(nextAngle), centerY + nextR * Math.sin(nextAngle)
    )
  }

  doc.setLineDashPattern([], 0) // Reset

  // Legend
  const ly = centerY + radius + 25
  doc.setFontSize(7)

  doc.setDrawColor(...TEAL)
  doc.setLineWidth(1.5)
  doc.line(centerX - 55, ly, centerX - 45, ly)
  doc.setTextColor(...TEAL)
  doc.text('Current', centerX - 43, ly + 1)

  doc.setDrawColor(...CYAN)
  doc.setLineDashPattern([3, 2], 0)
  doc.line(centerX - 10, ly, centerX, ly)
  doc.setLineDashPattern([], 0)
  doc.setTextColor(...CYAN)
  doc.text('Target', centerX + 2, ly + 1)

  doc.setDrawColor(180, 180, 180)
  doc.setLineDashPattern([1, 2], 0)
  doc.line(centerX + 25, ly, centerX + 35, ly)
  doc.setLineDashPattern([], 0)
  doc.setTextColor(...SLATE)
  doc.text('Pakistan Avg', centerX + 37, ly + 1)
}

// ══════════════════════════════════════════════════════════
// MAIN PDF GENERATOR
// ══════════════════════════════════════════════════════════
/**
 * The eighteen-page trade maturity assessment, on src/report/spine.ts.
 *
 * The trailing `orgName: string` is now `meta: ReportMeta` — same arity, same
 * position. Not an addition alongside it: the client's name would then have had
 * two sources, which is the defect the engagement work exists to remove.
 *
 * What the spine replaces: a hardcoded `totalPages = 18` in every footer,
 * per-page chrome pasted seventeen times, `new Date().toLocaleDateString()` on
 * the cover, and — the one that shipped visibly broken — hand-placed text with
 * no width at all. TAIW passes `maxWidth` nowhere, so nothing wrapped; page 16's
 * benchmark sentence ran 166.64 pt off a 595.28 pt sheet. That is D-002.
 *
 * Still drawn through the `doc` escape hatch: the score disc, the radar and the
 * deep-dive header bars and phase boxes. Each owns its overflow and hands the
 * cursor back with `moveTo()`.
 */
export function generateTradeMaturityPDF(assessment: AssessmentData, meta: ReportMeta) {
  const { scores, overallScore } = assessment
  const pkAvg = benchmarks.pakistanCustomsAverage
  const regional = benchmarks.regionalLeaders
  const wcoTargets = benchmarks.wcoTargets

  const sortedByGap = [...scores].sort((a, b) => b.gap - a.gap)

  /*
   * Draft state stays derived here, as it was. It is a property of the
   * assessment the caller passed — how many categories were answered — not of
   * the engagement, and the component builds both from the same props. Moving it
   * to the call site would be a behaviour change smuggled into a migration whose
   * value is that nothing else moved. A caller that sets isDraft still wins.
   */
  const reportMeta: ReportMeta = {
    ...meta,
    isDraft: meta.isDraft || assessment.answeredCategories < assessment.totalCategories,
  }

  /*
   * `overallScore` is caller-computed and rendered on the cover.
   *
   * THE COMMENT THAT USED TO BE HERE WAS FALSE, and it is worth recording rather
   * than quietly replacing. It said the component "averages only the answered
   * categories". It did not: `TradeMaturityAssessment.tsx` divided by
   * `radarData.length`, every category, so an unanswered one entered the headline
   * as a 0. Four of eight answered at 3.0 put **1.5** on this cover while TAIW's
   * own quick-scan screen printed 3.0 for the same client. The component now does
   * what the comment claimed, through `src/scoring/maturity.ts`.
   *
   * Still passed rather than derived: `scores` carries only the SCORED categories,
   * so the overall genuinely is not recoverable from it — the denominator is
   * `totalCategories`, not `scores.length`. Two assessments with the same
   * per-category scores and a different overall are different documents, so it
   * stays its own key part.
   *
   * The digest covers the coverage line too. A report of four scored categories
   * and one of eight are different documents even when every shared row matches,
   * and /ID is the field a viewer uses to decide that.
   */
  const coverageLine = `Scored ${assessment.answeredCategories} of ${assessment.totalCategories} categories.`
  const r = createReport(
    reportMeta,
    contentKey([
      ...scores.map(s => `cat:${s.category}=${s.current}/${s.desired}`),
      `overall:${overallScore}`,
      `coverage:${assessment.answeredCategories}/${assessment.totalCategories}`,
    ]),
  )
  const { doc } = r
  const w = r.pageWidth

  // ── PAGE 1: COVER ──
  r.cover('Trade Analytics Maturity Assessment', 'TACR — Trade Analytics Capability Review')

  // Score disc. Per-module, so it goes through the escape hatch; the spine's
  // cover leaves the cursor below the banner and this reclaims it afterwards.
  doc.setFillColor(...WHITE)
  doc.circle(w / 2, 140, 30, 'F')
  doc.setTextColor(...TEAL)
  doc.setFontSize(36)
  doc.text(`${overallScore}`, w / 2, 143, { align: 'center' })
  doc.setFontSize(12)
  doc.text('/ 5.0', w / 2, 155, { align: 'center' })
  doc.setFontSize(14)
  doc.text(levelLabel(overallScore), w / 2, 180, { align: 'center' })
  r.moveTo(190)

  // ── PAGE 2: EXECUTIVE SUMMARY ──
  r.page('Executive Summary')
  r.text(`Overall Trade Analytics Maturity: ${overallScore} / 5.0`, { size: 12, gapAfter: 4 })
  r.text(`Level: ${levelLabel(overallScore)} — ${levelDescription(overallScore)}`, { size: 10, gapAfter: 4 })
  // The denominator behind the number above. A cover score of 3.0 from four of
  // eight categories is not the same claim as 3.0 from eight, and the number
  // alone cannot tell them apart.
  r.text(coverageLine, { size: 9, gapAfter: 8 })

  r.sectionHeading('Key Findings')
  // Numbered rather than bulleted, exactly as before — `bullets()` would have
  // rendered "• 1. …".
  sortedByGap.slice(0, 3).forEach((f, i) => {
    const pkVal = (pkAvg as Record<string, number | string>)[f.category]
    const pkScore = typeof pkVal === 'number' ? pkVal : 1.56
    r.text(
      `${i + 1}. ${f.category} maturity (${f.current}) is ${f.current < pkScore ? 'below' : 'at'} Pakistan customs average (${pkScore}). Gap to target: ${f.gap}`,
      { size: 9, indent: 5, gapAfter: 4 },
    )
  })

  r.spacer(4)
  r.sectionHeading('Priority Recommendations')
  const recommendations = [
    `1. Adopt WCO Data Model v4.2 as the canonical data standard (closes ${sortedByGap[0]?.gap || 0}-level gap in ${sortedByGap[0]?.category || 'Data Governance'})`,
    `2. Implement risk-based customs profiling using WCO DM elements for selectivity`,
    `3. Deploy Pakistan Single Window (PSW) integration with full WCO DM conformity`,
  ]
  for (const rec of recommendations) r.text(rec, { size: 9, indent: 5, gapAfter: 4 })

  r.spacer(4)
  r.text('Estimated total investment: PKR 200–400 million over 3 years', { size: 10 })

  // ── PAGE 3: MATURITY RADAR ──
  r.page('Trade Analytics Maturity Radar')
  {
    // The radar bypasses the cursor, so it sizes itself against the real content
    // box: the spine's own footer band rather than a 20 repeated in three
    // generators, and the cursor rather than a hardcoded centre of 130.
    const top = r.cursorY
    const floor = r.pageHeight - FOOTER_RESERVE
    const radius = 65
    const labelRing = 12   // how far the axis labels sit outside the rings
    const legendDrop = 25  // drawRadarChart puts its legend at centerY + radius + 25
    const centerY = Math.min(top + labelRing + radius, floor - legendDrop - radius)
    drawRadarChart(doc, scores, w / 2, centerY, radius)
    r.moveTo(centerY + radius + legendDrop + 6)
  }

  // ── PAGE 4: CATEGORY SCORECARD ──
  r.page('Category Scorecard')
  r.table({
    head: ['Category', 'Current', 'Target', 'Gap', 'Level', 'vs Pakistan Avg'],
    rows: sortedByGap.map(s => {
      const pkVal = (pkAvg as Record<string, number | string>)[s.category]
      const pkScore = typeof pkVal === 'number' ? pkVal : 1.56
      const diff = s.current - pkScore
      return [
        s.category,
        s.current.toFixed(1),
        s.desired.toFixed(1),
        s.gap.toFixed(1),
        levelLabel(s.current),
        `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`,
      ]
    }),
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      5: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const gap = parseFloat(String(data.cell.raw))
        if (gap >= 2) data.cell.styles.textColor = [220, 38, 38]
        else if (gap >= 1) data.cell.styles.textColor = [245, 158, 11]
        else data.cell.styles.textColor = [16, 185, 129]
      }
    },
  })

  // ── PAGES 5-12: CATEGORY DEEP DIVES ──
  // CATEGORIES.length - 1: the ninth entry is 'Overall Assessment', a rollup with
  // no deep dive of its own. It still appears on the radar and the scorecard.
  for (let ci = 0; ci < CATEGORIES.length - 1; ci++) {
    r.page()

    const cat = CATEGORIES[ci]
    /*
     * NO 0-SCORED FALLBACK. This was
     *   `scores.find(...) || { category: cat, current: 0, desired: 0, gap: 0 }`
     * — a category the caller did not supply got a full deep-dive page reading
     * "0.0 / 5.0", "Initial", "Gap of 0.0 levels to reach target state" and three
     * invented strengths. That is D-008's shape exactly: a plausible number
     * substituted where a real one was missing, on a page a client reads as a
     * measurement. The caller now passes only scored categories, so an absent one
     * says why it is absent and stops.
     */
    const score = scores.find(s => s.category === cat)
    if (!score) {
      r.text(cat, { size: 14, gapAfter: 4 })
      r.text('NOT ASSESSED', { size: 11, color: SLATE, gapAfter: 4 })
      r.text(
        `No question in this category has been answered, so there is no maturity level to report. ` +
        `This page is intentionally empty rather than showing 0.0, which would read as a measurement.`,
        { size: 9 },
      )
      continue
    }
    const pkVal = (pkAvg as Record<string, number | string>)[cat]
    const pkScore = typeof pkVal === 'number' ? pkVal : 1.56

    // Score-coloured header bar. Per-module, so it is hand-drawn between the
    // spine's header rule (y=12) and the first content baseline.
    doc.setFillColor(...colorForScore(score.current))
    doc.roundedRect(MARGIN, 18, w - 2 * MARGIN, 20, 3, 3, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(14)
    doc.text(`${cat} — ${score.current.toFixed(1)} / 5.0`, MARGIN + 5, 31)
    doc.text(levelLabel(score.current), w - MARGIN - 5, 31, { align: 'right' })
    r.moveTo(48)

    r.text(`Current Level: ${levelLabel(score.current)}`, { size: 10, gapAfter: 1 })
    r.text(levelDescription(score.current), { size: 8, gapAfter: 6 })
    r.text(`Target Level: ${levelLabel(score.desired)}`, { size: 10, gapAfter: 1 })
    r.text(levelDescription(score.desired), { size: 8, gapAfter: 8 })

    r.text('Key Strengths', { size: 11, color: GREEN, gapAfter: 3 })
    r.bullets([
      score.current >= pkScore ? `Scoring above Pakistan customs average (${pkScore})` : `Awareness of ${cat.toLowerCase()} importance is growing`,
      `Foundation for ${cat.toLowerCase()} improvement is in place`,
      `Leadership recognizes the need for ${cat.toLowerCase()} advancement`,
    ], { size: 8, gapAfter: 5 })

    r.text('Key Gaps', { size: 11, color: [220, 38, 38], gapAfter: 3 })
    r.bullets([
      `Gap of ${score.gap.toFixed(1)} levels to reach target state`,
      score.current < pkScore ? `Below Pakistan customs average by ${(pkScore - score.current).toFixed(1)} levels` : `Still ${((regional as Record<string, number | string>)[cat] as number - score.current).toFixed(1)} levels behind regional leaders`,
      `Requires structured investment and capability building`,
    ], { size: 8, gapAfter: 5 })

    r.text('Recommended Actions', { size: 11, color: CYAN, gapAfter: 3 })
    r.bullets([
      `Conduct a detailed ${cat.toLowerCase()} capability assessment with trade stakeholders`,
      `Develop a 12-month improvement roadmap with quick wins in months 1-3`,
      `Benchmark against regional leaders (${(regional as Record<string, number | string>).examples || 'regional peers'})`,
    ], { size: 8 })
  }

  // ── PAGE 13: TCF CAPABILITY COVERAGE ──
  /*
   * WAS "TCF Capability Gap Matrix — Top 20 ... with largest estimated gaps".
   * D-001, resolved by removal: those twenty rows were not TCF capabilities, and
   * their theme column came from a hand-written array indexed by TACR category
   * position. See the note on `TcfCapability` above.
   *
   * The replacement reports the framework, which is real: how the 100
   * capabilities distribute across groups, the authored priority mix, and how
   * many have a WCO Data Model dependency recorded. No assessment score appears
   * on this page — TACR maturity is on the radar, the scorecard and the deep
   * dives, against categories, where it belongs.
   */
  const coverage = groupCoverage(capabilities)
  const priorities = prioritiesPresent(capabilities)
  const wcoLinkedTotal = capabilities.filter(c => wcoDomainsFor(c).length > 0).length
  const themeCount = new Set(capabilities.map(c => c.theme)).size
  const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

  r.page(
    'TCF Capability Coverage',
    `Structure of the Trade Capability Framework as authored: ${capabilities.length} capabilities ` +
    `in ${coverage.length} groups across ${themeCount} themes. Framework scope and its authored ` +
    `priority mix, not assessment results — priority is fixed in the dataset and identical for ` +
    `every client; maturity is scored against TACR categories, a separate axis, on the radar and ` +
    `scorecard.`,
  )

  r.table({
    head: ['Group', 'Theme', 'Caps', ...priorities.map(titleCase), 'WCO'],
    rows: [
      ...coverage.map(g => [
        g.group,
        g.theme,
        g.count,
        ...priorities.map(p => g.byPriority[p] ?? 0),
        g.wcoLinked,
      ]),
      [
        'All groups',
        `${themeCount} themes`,
        capabilities.length,
        ...priorities.map(p => capabilities.filter(c => c.priority === p).length),
        wcoLinkedTotal,
      ],
    ],
    headFontSize: 7,
    bodyFontSize: 7,
    columnStyles: {
      2: { halign: 'center', cellWidth: 12 },
      ...Object.fromEntries(priorities.map((_, i) => [3 + i, { halign: 'center', cellWidth: 14 }])),
      [3 + priorities.length]: { halign: 'center', cellWidth: 12 },
    },
    didParseCell(data) {
      // Totals row identified by index, not by matching its text.
      if (data.section === 'body' && data.row.index === coverage.length) {
        data.cell.styles.fillColor = [241, 245, 249]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  r.text(
    `WCO counts capabilities with at least one entry in dataRequirements.json. ` +
    `${wcoLinkedTotal} of ${capabilities.length} have one; the remaining ` +
    `${capabilities.length - wcoLinkedTotal} have no WCO DM domain recorded, and are blank in the ` +
    `capability register rather than filled with an assumed value.`,
    { size: 7, color: SLATE, gapAfter: 3 },
  )

  // ── PAGE 14: WCO DM CONFORMITY ASSESSMENT ──
  r.page('WCO Data Model Conformity', 'Assessment of WCO DM v4.2 domain coverage and readiness for trade analytics')

  const wcoDomains = [
    { domain: 'Goods', elements: 234, classes: 6, capabilities: 'HS classification, valuation, dangerous goods', priority: 'Critical' },
    { domain: 'Transport', elements: 217, classes: 10, capabilities: 'Vessel tracking, container management, transit', priority: 'Critical' },
    { domain: 'Document', elements: 107, classes: 10, capabilities: 'Certificate verification, license management', priority: 'Critical' },
    { domain: 'Declaration', elements: 104, classes: 2, capabilities: 'Core customs processing, amendments', priority: 'Critical' },
    { domain: 'Consignment', elements: 88, classes: 3, capabilities: 'Shipment analytics, consolidation tracking', priority: 'High' },
    { domain: 'Financial', elements: 79, classes: 7, capabilities: 'Duty calculation, payment tracking, bonds', priority: 'High' },
    { domain: 'Party', elements: 75, classes: 19, capabilities: 'Trader profiling, AEO management', priority: 'High' },
    { domain: 'Location', elements: 71, classes: 11, capabilities: 'Port analytics, warehouse tracking, routing', priority: 'Medium' },
    { domain: 'Risk & Control', elements: 25, classes: 2, capabilities: 'Risk profiling, selectivity, inspection', priority: 'Critical' },
    { domain: 'Origin', elements: 10, classes: 2, capabilities: 'Rules of origin, FTA utilization', priority: 'High' },
    { domain: 'Classification', elements: 8, classes: 2, capabilities: 'HS code validation, tariff analytics', priority: 'High' },
    { domain: 'Response', elements: 9, classes: 2, capabilities: 'Decision outcomes, notifications', priority: 'Medium' },
    { domain: 'Warehouse', elements: 7, classes: 1, capabilities: 'Bonded warehouse monitoring', priority: 'Medium' },
  ]

  r.table({
    head: ['WCO DM Domain', 'Elements', 'Classes', 'Used By Capabilities', 'Priority'],
    rows: wcoDomains.map(d => [d.domain, d.elements, d.classes, d.capabilities, d.priority]),
    // The head fill was CYAN here and TEAL on every other table. The spine paints
    // table heads in meta.accent, once, so this page now matches the other five.
    headFontSize: 7,
    bodyFontSize: 7,
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 4: { halign: 'center' } },
    gapAfter: 8,
  })
  r.text('Total: 1,107 data elements across 271 classes in 14 domains (WCO DM v4.2.0)', { size: 9, gapAfter: 1 })
  r.text('135 code lists for standardized data exchange (UNTDID, ISO, WCO-maintained)', { size: 9 })

  // ── PAGE 15: ROADMAP SUMMARY ──
  r.page('Roadmap Summary')
  {
    const phases = [
      { name: 'Phase 1: Quick Wins', months: '1–6', capabilities: 8, investment: 'PKR 40–70M', color: GREEN },
      { name: 'Phase 2: Core Build', months: '7–18', capabilities: 20, investment: 'PKR 100–200M', color: CYAN },
      { name: 'Phase 3: Advanced', months: '19–36', capabilities: 25, investment: 'PKR 60–130M', color: TEAL },
    ]
    const boxTop = r.cursorY + 6
    const boxGap = 10
    /*
     * D-006, fixed — the same grid BAIW carried, copy-pasted. See the longer
     * note in src/utils/reportGenerator.ts.
     *
     * TAIW is the instructive half of the pair: `boxW = 55` put this box 5mm
     * (14.17pt) past the content column here too, but the titles are short
     * enough that NO GLYPH overflowed, so the text harness reported this page
     * clean for the whole of D2. The box was always wrong; only BAIW's longer
     * "Phase 3: Advanced Analytics" made it visible. Measured by
     * scripts/golden/geometry.mjs, which reads drawn paths rather than glyphs.
     */
    const boxW = (r.contentWidth - (phases.length - 1) * boxGap) / phases.length
    const boxH = 60
    phases.forEach((p, i) => {
      const x = MARGIN + i * (boxW + boxGap)
      doc.setFillColor(p.color[0], p.color[1], p.color[2])
      doc.roundedRect(x, boxTop, boxW, boxH, 3, 3, 'F')
      doc.setTextColor(...WHITE)
      doc.setFontSize(10)
      // No `maxWidth`: jsPDF's text option DROPS every line after the first
      // rather than wrapping — see D-004. Phase names are short and fixed.
      doc.text(p.name, x + boxW / 2, boxTop + 12, { align: 'center' })
      doc.setFontSize(8)
      doc.text(`Months ${p.months}`, x + boxW / 2, boxTop + 22, { align: 'center' })
      doc.text(`${p.capabilities} capabilities`, x + boxW / 2, boxTop + 32, { align: 'center' })
      doc.text(p.investment, x + boxW / 2, boxTop + 42, { align: 'center' })

      // Arrow between boxes
      if (i < phases.length - 1) {
        doc.setDrawColor(...SLATE)
        doc.setLineWidth(0.5)
        const arrowX = x + boxW + 2
        doc.line(arrowX, boxTop + 30, arrowX + 6, boxTop + 30)
        doc.line(arrowX + 4, boxTop + 28, arrowX + 6, boxTop + 30)
        doc.line(arrowX + 4, boxTop + 32, arrowX + 6, boxTop + 30)
      }
    })
    r.moveTo(boxTop + boxH + 15)
  }

  // ── PAGE 16: BENCHMARK COMPARISON ──
  r.page('Benchmark Comparison')
  r.table({
    head: ['Category', 'You', 'Pakistan Avg', 'Regional Leaders', 'WCO Targets'],
    rows: CATEGORIES.slice(0, 8).map(cat => {
      // `|| { current: 0 }` here too, and the same defect: a category with no
      // answers appeared in the "You" column as 0.0, ranked against the Pakistan
      // average and the WCO target as though it had been measured. The three
      // benchmark columns are authored constants and still print; only the
      // client's own column can be unmeasured, and it says so.
      const score = scores.find(s => s.category === cat)
      const pk = (pkAvg as Record<string, number | string>)[cat]
      const reg = (regional as Record<string, number | string>)[cat]
      const wco = (wcoTargets as Record<string, number | string>)[cat]
      return [
        cat,
        score ? score.current.toFixed(1) : '—',
        typeof pk === 'number' ? pk.toFixed(1) : '1.6',
        typeof reg === 'number' ? reg.toFixed(1) : '3.4',
        typeof wco === 'number' ? wco.toFixed(1) : '4.3',
      ]
    }),
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    gapAfter: 15,
  })

  const regOverall = typeof regional['Overall Assessment'] === 'number' ? regional['Overall Assessment'] : 3.43
  const gapToRegional = (regOverall - overallScore).toFixed(1)
  /*
   * D-002. This one line was the worst geometry defect in the suite: no width of
   * any kind, `regional.examples` is 69 characters of customs authority names,
   * and the sentence was drawn to 761.92 pt on a 595.28 pt sheet — 166.64 pt of
   * it past the paper edge, ending mid-word on "Malaysia Royal Cus". It is in
   * every trade assessment ever exported. `r.text()` splits unconditionally, so
   * the whole sentence is now on the page.
   */
  r.text(
    `You are ${gapToRegional} levels behind regional leaders (${regional.examples}). Closing this gap requires 18–24 months.`,
    { size: 10 },
  )

  // ── PAGE 17: NEXT STEPS ──
  r.page('Next Steps')
  r.spacer(6)
  const steps = [
    'Present this assessment to Customs leadership and trade facilitation committee',
    'Validate findings with IT, risk management, and trade operations divisions',
    'Prioritize Phase 1 Quick Win capabilities: WCO DM adoption, basic risk profiling',
    'Engage Godaitec for a Deep Dive Workshop to build WCO DM conformity roadmap',
  ]
  r.keyValueBlock(steps.map((s, i) => [`${i + 1}.`, s] as [string, string]), {
    size: 10,
    labelWidth: 10,
    gapAfter: 8,
  })

  r.spacer(14)
  {
    const boxTop = r.cursorY
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(MARGIN, boxTop, w - 2 * MARGIN, 30, 3, 3, 'F')
    doc.setFontSize(11)
    doc.setTextColor(...TEAL)
    doc.text('Contact Us', w / 2, boxTop + 10, { align: 'center' })
    doc.setFontSize(9)
    doc.setTextColor(...SLATE)
    doc.text('Godaitec | godai.tech | info@godai.tech', w / 2, boxTop + 20, { align: 'center' })
    r.moveTo(boxTop + 30 + 6)
  }

  // ── PAGE 18: METHODOLOGY ──
  r.page('Methodology')
  r.bullets([
    'This assessment uses the Trade Capability Framework (TCF) — 100 trade analytics capabilities across 6 themes',
    'Data model conformity assessed against WCO Data Model v4.2 (1,107 elements, 271 classes, 14 domains)',
    'Maturity measured using TACR (Trade Analytics Capability Review) — 5-level scale',
    'Benchmarks: Pakistan Customs avg, regional leaders (SG, KR, MY), WCO DM conformity targets',
  ], { size: 9, gapAfter: 8 })

  r.table({
    head: ['Level', 'Label', 'Description'],
    rows: [1, 2, 3, 4, 5].map(l => {
      const key = String(l) as keyof typeof benchmarks.maturityLevelDescriptions
      const desc = benchmarks.maturityLevelDescriptions[key]
      return [l, desc.label, desc.description]
    }),
    columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
    gapAfter: 15,
  })

  r.text('Disclaimer: Benchmark data based on WCO guidance, industry research, and consulting experience.', {
    size: 7,
    color: SLATE,
  })

  saveReport(r.build(), reportFilename(reportMeta, 'pdf'))
}

// ══════════════════════════════════════════════════════════
// TCF CAPABILITY REGISTER CSV
// ══════════════════════════════════════════════════════════
/*
 * D-001 CLOSED BY REMOVAL, the same way as BAIW's. This was
 * `generateTradeGapCSV` and it emitted 96 rows — against 100 real capabilities —
 * of `Current Level`, `Required Level`, `Gap` and `Priority` that no dataset
 * supports:
 *
 *   - names built at export time from TACR category names, matching no row in
 *     capabilities.json;
 *   - `Current Level` a category score plus `(Math.random() - 0.5) * 0.6`;
 *   - `Priority` thresholding that jitter, so the class was unstable between two
 *     exports of one unchanged assessment;
 *   - `TCF Theme` from `tcfThemes[ci]`, a hand-written array indexed by category
 *     position, with two themes repeated to reach eight entries;
 *   - `WCO DM Dependencies` one of five strings chosen by category name.
 *
 * The columns are GONE rather than renamed. What ships is the register: the 100
 * real capabilities and the attributes actually authored against them.
 *
 * `Priority` in the new file is the DATASET's own per-capability field, not a
 * derived one. It is framework editorial judgement, fixed for every client, and
 * the header says so.
 *
 * Now on src/report/csv.ts — BOM, CRLF, every field quoted.
 */
const TRADE_REGISTER_COLUMNS: CsvColumn<TcfCapability>[] = [
  { key: 'id', header: 'ID' },
  // `sub` is the capability's own name in this dataset; `theme` and `group` are
  // its parents. TCF has no `name`/`description` field — unlike BVF — so the
  // register carries what TCF actually authored rather than inventing the rest.
  { key: 'sub', header: 'Name' },
  { key: 'theme', header: 'TCF Theme' },
  { key: 'group', header: 'Group' },
  { key: 'priority', header: 'Framework Priority (authored)' },
  // NOT the number of rows in dataRequirements.json. It tracks `elements.length`
  // in dependencies.json — exactly for 71 of 100 capabilities, summing 700
  // against 689 — so it counts WCO data elements, and the header now says so.
  // Same misnomer as BAIW's field of the same name; see the note there and
  // D-007. Do not recompute it from dataRequirements.json.
  { key: 'dataReqCount', header: 'WCO Data Elements' },
  {
    key: 'id',
    header: 'WCO DM Domains (linked)',
    format: cap => wcoDomainsFor(cap).join('; '),
  },
]

export function generateTradeCapabilityRegisterCSV(meta: ReportMeta) {
  // byStringKey is correct here: TCF ids are slugs, not numbers.
  const rows = [...capabilities].sort(byStringKey(c => c.id))
  downloadCsv(rows, TRADE_REGISTER_COLUMNS, reportFilename(meta, 'csv'))
}

// ══════════════════════════════════════════════════════════
// TRADE ROADMAP MARKDOWN GENERATOR
// ══════════════════════════════════════════════════════════
/**
 * The twelve-slide roadmap, on the spine's CONVENTIONS rather than its builder —
 * there is no markdown analogue of ReportDoc and src/report/ is not the place to
 * invent one for two callers.
 *
 * The org name and the date come from `meta`, the date is `formatCoverDate()`
 * (UTC parts, machine-stable) instead of `toLocaleDateString()` (neither), and
 * the filename is `reportFilename()`. The old bare `toLocaleDateString()`
 * rendered `7/31/2026` on an en-US machine and `31.7.2026` on a German one, for
 * the same assessment.
 */
export function generateTradeRoadmapMarkdown(assessment: AssessmentData, meta: ReportMeta) {
  const { scores, overallScore } = assessment
  const sortedByGap = [...scores].sort((a, b) => b.gap - a.gap)
  // As the PDF: `scores` carries only the scored categories, so the deck states
  // how many of the total it rests on rather than leaving a reader to assume all.
  const coverage = `Scored ${assessment.answeredCategories} of ${assessment.totalCategories} categories.`

  const md = `# ${meta.orgName} — Trade Analytics Transformation Roadmap
## Prepared by Godaitec | ${formatCoverDate(meta.generatedAt)}

---

## Slide 1: Title
### ${meta.orgName} Trade Analytics Transformation Roadmap
**Current Maturity: ${overallScore} / 5.0 (${levelLabel(overallScore)})**
Prepared by Godaitec (godai.tech)

---

## Slide 2: Current State
### Where We Are Today
${scores.map(s => `- **${s.category}**: ${s.current.toFixed(1)} / 5.0 (${levelLabel(s.current)})`).join('\n')}

**Overall Score: ${overallScore} / 5.0**
${coverage}

---

## Slide 3: Target State
### Where We Need To Be
${scores.map(s => `- **${s.category}**: ${s.desired.toFixed(1)} / 5.0 (${levelLabel(s.desired)})`).join('\n')}

---

## Slide 4: The Gap
### What Needs To Change
${sortedByGap.map(s => `- **${s.category}**: Gap of ${s.gap.toFixed(1)} levels (${priorityLabel(s.gap)} priority)`).join('\n')}

**Largest gaps**: ${sortedByGap.slice(0, 3).map(s => s.category).join(', ')}

---

## Slide 5: Phase 1 — Quick Wins (Months 1–6)
### Investment: PKR 40–70 Million
- Adopt WCO Data Model v4.2 as canonical data standard
- Deploy basic trade intelligence dashboards
- Implement automated HS classification validation
- Quick win: Risk profiling using historical declaration data
- 8 TCF capabilities activated

---

## Slide 6: Phase 2 — Core Build (Months 7–18)
### Investment: PKR 100–200 Million
- Full WCO DM conformity across all 14 domains
- Predictive risk scoring models in production
- Pakistan Single Window (PSW) deep integration
- Trader profiling and AEO analytics engine
- 20 TCF capabilities activated

---

## Slide 7: Phase 3 — Advanced Analytics (Months 19–36)
### Investment: PKR 60–130 Million
- ML models embedded in customs operations
- Real-time trade fraud detection and revenue leakage prevention
- AI-driven selectivity and inspection optimization
- Cross-border data exchange with WCO member states
- 25+ TCF capabilities activated

---

## Slide 8: Data Foundation
### WCO Data Model v4.2 Reference Architecture
- **1,107 data elements** across 14 domains
- **271 classes** with full superclass hierarchy
- **135 code lists** (UNTDID, ISO, WCO-maintained)
- Priority domains: Goods (234 elements), Transport (217), Declaration (104)
- Data integration from customs systems, PSW, border agencies, and trade partners

---

## Slide 9: Investment Summary
### Total: PKR 200–400 Million over 3 Years
| Phase | Duration | Investment | Capabilities |
|-------|----------|------------|-------------|
| Phase 1 | Months 1–6 | PKR 40–70M | 8 |
| Phase 2 | Months 7–18 | PKR 100–200M | 20 |
| Phase 3 | Months 19–36 | PKR 60–130M | 25+ |

---

## Slide 10: ROI Projection
### Expected Returns
- **Year 1**: PKR 80–150M (revenue leakage reduction, faster clearance)
- **Year 2**: PKR 200–350M (risk-based selectivity, compliance improvement)
- **Year 3**: PKR 350–600M (trade facilitation, cross-border intelligence)
- **3-Year ROI**: 200–300%

---

## Slide 11: Why Godaitec
### Our Expertise
- Trade analytics specialists with WCO DM implementation experience
- TCF and TACR framework developers
- Pakistan customs modernization domain expertise
- End-to-end: strategy → WCO DM adoption → analytics → training

---

## Slide 12: Contact
### Let's Build Your Trade Analytics Future

**Godaitec**
Website: godai.tech
Email: info@godai.tech

*This roadmap was generated using TAIW — Trade Analytics Intelligence Workbench*
`

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, reportFilename(meta, 'md'))
}
