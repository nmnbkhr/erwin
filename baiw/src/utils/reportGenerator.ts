// jsPDF stays as a TYPE, for drawRadarChart's `doc` parameter — the chart is
// drawn through the spine's escape hatch. `jspdf-autotable` is gone entirely:
// all six tables now go through ReportDoc.table(), which is where the
// `lastAutoTable.finalY` cast and the 15mm margin live.
import type jsPDF from 'jspdf'
import { saveAs } from 'file-saver'
import benchmarks from '../data/benchmarks.json'
import capabilities from '../data/capabilities.json'
import dataRequirements from '../data/dataRequirements.json'

import { createReport, contentKey, saveReport, MARGIN, FOOTER_RESERVE } from '../report/spine'
import { formatCoverDate, reportFilename } from '../report/naming'
import { downloadCsv, type CsvColumn } from '../report/csv'
import { byNumber } from '../report/order'
import type { ReportMeta } from '../report/types'

/*
 * Artefact ids for the two deliverables on the spine.
 *
 * `MR-`, not `AR-`: declared in MODULE_ARTEFACT_IDS in scripts/check-dgiw.mjs,
 * not in DGIW's implementationPlan.json artefactRegister, because BAIW has no
 * artefact register to be a catalogue entry of. They drive the filename and the
 * trailer /ID seed and are deliberately NOT printed on the cover —
 * `useReportMeta` sets `coverTag: ''` for exactly that reason.
 *
 * `MR-BAIW-REGISTER` was `MR-BAIW-GAP` until D-001 was resolved by REMOVAL. The
 * document is a capability register — the 112 real BVF capabilities and their
 * authored attributes — and it no longer reports a gap, because BAIW has no
 * per-capability gap to report. Renaming the id rather than leaving a filename
 * that says GAP over content that is not one. HAIW keeps `MR-HAIW-GAP`: since
 * D-003 its gap column is computed from real `capabilityLinks`, so there the
 * name is accurate. The asymmetry is the point.
 */
export const MATURITY_ARTEFACT_ID = 'MR-BAIW-MATURITY'
export const ROADMAP_ARTEFACT_ID = 'MR-BAIW-ROADMAP'
export const REGISTER_ARTEFACT_ID = 'MR-BAIW-REGISTER'

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
 * ── BVF capabilities — structure, deliberately NOT scored ──────────────────
 *
 * D-001, resolved by removal. BACR's eight categories are a generic maturity
 * dimension; BVF's 112 capabilities are FSDM-specific banking functions. They
 * are ORTHOGONAL AXES — a capability's `themeName` is not a narrower version of
 * a BACR category, and no join between them exists in any dataset. There is
 * therefore no honest per-capability score to compute, and no column heading
 * makes one true.
 *
 * What was here before invented one: 112 rows whose names were string-built at
 * export time (`${cat} Strategy & Planning`), matching no row in
 * capabilities.json, carrying a category score jittered by `Math.random` and a
 * Priority label thresholding that jitter — so the class flipped in 46 of 112
 * rows between two exports of one unchanged assessment.
 *
 * Everything below reads authored attributes only. Category maturity is
 * reported on the radar, the scorecard and the deep dives, and is not restated
 * against a capability anywhere.
 *
 * The path to a real per-capability score is authoring `capabilityLinks` on
 * BACR's 804 questions, which is what HAIW has and what makes its gap column
 * legitimate. Not scheduled. See docs/known-defects.md D-001.
 */
type BvfCapability = (typeof capabilities)[number]

/**
 * Exported so the report card states a count derived from the data.
 *
 * CLAUDE.md, "Marketing copy drifts from the datasets": `SuiteLanding.tsx`
 * hardcodes four dataset counts and all four are now wrong. Nothing checks them.
 * Deriving is one import and cannot rot.
 */
export const CAPABILITY_COUNT = capabilities.length

/**
 * capability id → the FSDM subject areas it actually depends on.
 *
 * Built from `dataRequirements.json`, which is the only place the relation is
 * recorded. Module-level and derived once: the inputs are static imports, so
 * this is a pure function of the bundle and cannot vary between two exports.
 *
 * COVERAGE IS PARTIAL AND THAT IS REPORTED, NOT HIDDEN: 142 requirement rows
 * name only 15 of the 112 capabilities, so 97 capabilities have no FSDM subject
 * area and their cell is EMPTY. Empty is the truth. The previous code filled
 * this column by switching on the BACR category name — four hardcoded strings
 * standing in for a relation nobody had authored.
 */
const fsdmByCapability = ((): Map<number, string[]> => {
  const m = new Map<number, Set<string>>()
  for (const req of dataRequirements) {
    if (!m.has(req.capabilityId)) m.set(req.capabilityId, new Set())
    m.get(req.capabilityId)!.add(req.fsdmSubjectArea)
  }
  // Sorted so the cell text is stable regardless of row order in the dataset.
  return new Map([...m].map(([id, set]) => [id, [...set].sort()]))
})()

const fsdmFor = (cap: BvfCapability): string[] => fsdmByCapability.get(cap.id) ?? []

/** One row of the page-13 coverage table: a BVF group, with its phase spread. */
interface GroupCoverage {
  group: string
  theme: string
  count: number
  /** Index 0 unused; phases are 1-based in the dataset. */
  byPhase: number[]
  /** Capabilities in this group with at least one FSDM subject area. */
  fsdmLinked: number
}

/**
 * Group-level coverage of the BVF framework, in dataset order.
 *
 * Group rather than theme because there are only three themes — a three-row
 * page is not worth printing — and rather than capability because 112 rows is a
 * register, which is what the CSV is for.
 *
 * Order is the order groups first appear in `capabilities.json`, which keeps
 * each theme's groups contiguous. Not sorted alphabetically: that would
 * interleave the three themes and destroy the only structure the page has.
 */
function groupCoverage(caps: readonly BvfCapability[]): GroupCoverage[] {
  const rows = new Map<string, GroupCoverage>()
  for (const cap of caps) {
    let row = rows.get(cap.groupName)
    if (!row) {
      row = { group: cap.groupName, theme: cap.themeName, count: 0, byPhase: [], fsdmLinked: 0 }
      rows.set(cap.groupName, row)
    }
    row.count++
    row.byPhase[cap.phase] = (row.byPhase[cap.phase] ?? 0) + 1
    if (fsdmFor(cap).length > 0) row.fsdmLinked++
  }
  return [...rows.values()]
}

/** Every phase present in the dataset, ascending — not a hardcoded 1..4. */
const phasesPresent = (caps: readonly BvfCapability[]): number[] =>
  [...new Set(caps.map(c => c.phase))].sort((a, b) => a - b)

const CATEGORIES = [
  'Business', 'Culture', 'Governance', 'Information', 'Applications',
  'Systems', 'Agility', 'Outcomes', 'Overall Assessment'
]

const PURPLE = [88, 28, 135] as const   // #581C87
const BLUE = [37, 99, 235] as const     // #2563EB
const GREEN = [16, 185, 129] as const   // #10B981
const SLATE = [100, 116, 139] as const  // #64748B
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
    1: 'Ad-Hoc', 2: 'Developing', 3: 'Defined', 4: 'Managed', 5: 'Optimizing'
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
 *
 * This was the original of the three. TAIW's and HAIW's were copies of it, down
 * to the variable names, which is why all three carried the same hardcoded 18.
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
  // Same wrap-to-available-half treatment HAIW's and TAIW's radars got: a label
  // centred at x has only `min(x - MARGIN, pageWidth - MARGIN - x)` on its narrow
  // side, so the usable width is twice that half, not the page. Applied here
  // prophylactically — measured against the golden baseline, BAIW's nine labels
  // were ALL already inside the 15mm margin (page 3 right edge 552.76pt, zero
  // runs past), because nine axes at 40° put the horizontal ones closer in than
  // HAIW's eight at 45° and BAIW's category names are single words. Unwrapped is
  // still unwrapped: the labels come from CATEGORIES, and a longer one added
  // later would run off the sheet exactly as HAIW's two did.
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

  // Draw current scores (solid blue)
  doc.setDrawColor(...BLUE)
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

  // Draw desired scores (dashed green)
  doc.setDrawColor(...GREEN)
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

  // Draw Pakistan average (dotted gray)
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.8)
  const pkAvg = benchmarks.pakistanBankingAverage
  for (let i = 0; i < n; i++) {
    const cat = data[i].category as keyof typeof pkAvg
    const val = (typeof pkAvg[cat] === 'number' ? pkAvg[cat] : 1.86) as number
    const angle = -Math.PI / 2 + i * angleStep
    const r = (val / 5) * radius
    const nextI = (i + 1) % n
    const nextCat = data[nextI].category as keyof typeof pkAvg
    const nextVal = (typeof pkAvg[nextCat] === 'number' ? pkAvg[nextCat] : 1.86) as number
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

  doc.setDrawColor(...BLUE)
  doc.setLineWidth(1.5)
  doc.line(centerX - 50, ly, centerX - 40, ly)
  doc.setTextColor(...BLUE)
  doc.text('Current', centerX - 38, ly + 1)

  doc.setDrawColor(...GREEN)
  doc.setLineDashPattern([3, 2], 0)
  doc.line(centerX - 10, ly, centerX, ly)
  doc.setLineDashPattern([], 0)
  doc.setTextColor(...GREEN)
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
 * The eighteen-page banking maturity assessment, on src/report/spine.ts.
 *
 * The trailing `bankName: string` is now `meta: ReportMeta` — same arity, same
 * position. Not an addition alongside it: the client's name would then have had
 * two sources, which is the defect the engagement work exists to remove. The
 * parameter was `bankName` rather than `orgName` here; `meta.orgName` is the one
 * name now, and the component's `bankName.trim() || 'Your Bank'` moved into
 * REPORT_PROFILES.baiw.orgFallback unchanged.
 *
 * What the spine replaces: a hardcoded `totalPages = 18` in every footer,
 * per-page chrome pasted seventeen times, `new Date().toLocaleDateString()` on
 * the cover, and hand-placed text with no width at all. This generator is where
 * the other two were copied from, so it is the origin of all three defects.
 *
 * Still drawn through the `doc` escape hatch: the score disc, the radar and the
 * deep-dive header bars and phase boxes. Each owns its overflow and hands the
 * cursor back with `moveTo()`.
 */
export function generateMaturityPDF(assessment: AssessmentData, meta: ReportMeta) {
  const { scores, overallScore } = assessment
  const pkAvg = benchmarks.pakistanBankingAverage
  const regional = benchmarks.regionalLeaders
  const global = benchmarks.globalBest

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
   * `overallScore` is caller-computed and rendered on the cover, and it is NOT
   * derivable from `scores` — the component averages only the answered
   * categories. Two assessments with the same per-category scores and a
   * different overall are different documents, so it is its own key part rather
   * than something the reader is expected to recompute.
   */
  const r = createReport(
    reportMeta,
    contentKey([
      ...scores.map(s => `cat:${s.category}=${s.current}/${s.desired}`),
      `overall:${overallScore}`,
    ]),
  )
  const { doc } = r
  const w = r.pageWidth

  // ── PAGE 1: COVER ──
  r.cover('Analytics Maturity Assessment', 'BACR — Banking Analytics Capability Review')

  // Score disc. Per-module, so it goes through the escape hatch; the spine's
  // cover leaves the cursor below the banner and this reclaims it afterwards.
  doc.setFillColor(...WHITE)
  doc.circle(w / 2, 140, 30, 'F')
  doc.setTextColor(...PURPLE)
  doc.setFontSize(36)
  doc.text(`${overallScore}`, w / 2, 143, { align: 'center' })
  doc.setFontSize(12)
  doc.text('/ 5.0', w / 2, 155, { align: 'center' })
  doc.setFontSize(14)
  doc.text(levelLabel(overallScore), w / 2, 180, { align: 'center' })
  r.moveTo(190)

  // ── PAGE 2: EXECUTIVE SUMMARY ──
  r.page('Executive Summary')
  r.text(`Overall Maturity: ${overallScore} / 5.0`, { size: 12, gapAfter: 4 })
  r.text(`Level: ${levelLabel(overallScore)} — ${levelDescription(overallScore)}`, { size: 10, gapAfter: 8 })

  r.sectionHeading('Key Findings')
  // Numbered rather than bulleted, exactly as before — `bullets()` would have
  // rendered "• 1. …".
  sortedByGap.slice(0, 3).forEach((f, i) => {
    const pkVal = (pkAvg as Record<string, number | string>)[f.category]
    const pkScore = typeof pkVal === 'number' ? pkVal : 1.86
    r.text(
      `${i + 1}. Your ${f.category} maturity (${f.current}) is ${f.current < pkScore ? 'below' : 'at'} Pakistan average (${pkScore}). Gap to target: ${f.gap}`,
      { size: 9, indent: 5, gapAfter: 4 },
    )
  })

  r.spacer(4)
  r.sectionHeading('Priority Recommendations')
  const recommendations = [
    `1. Establish a Chief Data Officer role and data governance framework (closes ${sortedByGap[0]?.gap || 0}-level gap in ${sortedByGap[0]?.category || 'Governance'})`,
    `2. Deploy enterprise data warehouse using FSDM as reference architecture`,
    `3. Build predictive analytics capability starting with customer churn and credit scoring`,
  ]
  for (const rec of recommendations) r.text(rec, { size: 9, indent: 5, gapAfter: 4 })

  r.spacer(4)
  r.text('Estimated total investment: PKR 300–530 million over 3 years', { size: 10 })

  // ── PAGE 3: MATURITY RADAR ──
  r.page('Maturity Radar')
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
      const pkScore = typeof pkVal === 'number' ? pkVal : 1.86
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
    // No head/body font size was given here, so autoTable's own default of 10pt
    // applied — the only table in the document that did not say 8, and only
    // because this call was written before the other five. The spine's default
    // is SIZE.small, so this page now reads at the same size as the rest.
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
    const score = scores.find(s => s.category === cat) || { category: cat, current: 0, desired: 0, gap: 0 }
    const pkVal = (pkAvg as Record<string, number | string>)[cat]
    const pkScore = typeof pkVal === 'number' ? pkVal : 1.86

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
      score.current >= pkScore ? `Scoring above Pakistan banking average (${pkScore})` : `Awareness of ${cat.toLowerCase()} importance is growing`,
      `Foundation for ${cat.toLowerCase()} improvement is in place`,
      `Leadership recognizes the need for ${cat.toLowerCase()} advancement`,
    ], { size: 8, gapAfter: 5 })

    r.text('Key Gaps', { size: 11, color: [220, 38, 38], gapAfter: 3 })
    r.bullets([
      `Gap of ${score.gap.toFixed(1)} levels to reach target state`,
      score.current < pkScore ? `Below Pakistan banking average by ${(pkScore - score.current).toFixed(1)} levels` : `Still ${((regional as Record<string, number | string>)[cat] as number - score.current).toFixed(1)} levels behind regional leaders`,
      `Requires structured investment and capability building`,
    ], { size: 8, gapAfter: 5 })

    r.text('Recommended Actions', { size: 11, color: BLUE, gapAfter: 3 })
    r.bullets([
      `Conduct a detailed ${cat.toLowerCase()} capability assessment with department heads`,
      `Develop a 12-month improvement roadmap with quick wins in months 1-3`,
      `Benchmark against regional leaders (${(regional as Record<string, number | string>).examples || 'regional peers'})`,
    ], { size: 8 })
  }

  // ── PAGE 13: BVF CAPABILITY COVERAGE ──
  /*
   * WAS "Capability Gap Matrix — Top 20 BVF capabilities with largest estimated
   * gaps". D-001, resolved by removal: those twenty rows were not BVF
   * capabilities and the three scores on each were a BACR category score offset
   * by 0, -0.3 and -0.5. See the note on `BvfCapability` above for why no honest
   * per-capability score exists.
   *
   * What replaces it reports the FRAMEWORK, which is real: how the 112
   * capabilities distribute across groups, when each group is scheduled, and how
   * many capabilities have an FSDM dependency recorded. A reader can act on the
   * phase spread — it is the delivery sequence — and the FSDM column is the
   * honest coverage number rather than four hardcoded strings.
   *
   * Category maturity is NOT restated here. It is on the radar (page 3), the
   * scorecard (page 4) and the eight deep dives, correctly, against categories.
   */
  const coverage = groupCoverage(capabilities)
  const phases = phasesPresent(capabilities)
  const fsdmLinkedTotal = capabilities.filter(c => fsdmFor(c).length > 0).length
  const themeCount = new Set(capabilities.map(c => c.themeName)).size

  r.page(
    'BVF Capability Coverage',
    `Structure of the Banking Value Framework as authored: ${capabilities.length} capabilities ` +
    `in ${coverage.length} groups across ${themeCount} themes. Framework scope and delivery ` +
    `sequence, not assessment results — maturity is scored against BACR categories, which are a ` +
    `separate axis, and is reported on the radar and scorecard.`,
  )

  r.table({
    head: ['Group', 'Theme', 'Caps', ...phases.map(p => `P${p}`), 'FSDM'],
    rows: [
      ...coverage.map(g => [
        g.group,
        g.theme,
        g.count,
        ...phases.map(p => g.byPhase[p] ?? 0),
        g.fsdmLinked,
      ]),
      [
        'All groups',
        `${themeCount} themes`,
        capabilities.length,
        ...phases.map(p => capabilities.filter(c => c.phase === p).length),
        fsdmLinkedTotal,
      ],
    ],
    headFontSize: 7,
    bodyFontSize: 7,
    columnStyles: {
      2: { halign: 'center', cellWidth: 12 },
      ...Object.fromEntries(phases.map((_, i) => [3 + i, { halign: 'center', cellWidth: 10 }])),
      [3 + phases.length]: { halign: 'center', cellWidth: 14 },
    },
    didParseCell(data) {
      // The totals row is the last body row, identified by index rather than by
      // matching its text — a group could legitimately be named "All groups".
      if (data.section === 'body' && data.row.index === coverage.length) {
        data.cell.styles.fillColor = [241, 245, 249]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  r.text(
    `FSDM counts capabilities with at least one entry in dataRequirements.json. ` +
    `${fsdmLinkedTotal} of ${capabilities.length} have one; the remaining ` +
    `${capabilities.length - fsdmLinkedTotal} have no FSDM subject area recorded, and are ` +
    `blank in the capability register rather than filled with an assumed value.`,
    { size: 7, color: SLATE, gapAfter: 3 },
  )

  // ── PAGE 14: FSDM DATA READINESS ──
  r.page('FSDM Data Readiness', 'Which FSDM domains are needed based on capability gaps')

  const fsdmDomains = [
    { domain: 'Party Management', entities: 622, capabilities: 'Customer analytics, segmentation, CRM', priority: 'Critical' },
    { domain: 'Agreement & Account', entities: 506, capabilities: 'Product analytics, profitability, pricing', priority: 'Critical' },
    { domain: 'Financial Transaction', entities: 141, capabilities: 'Transaction analytics, fraud detection, AML', priority: 'Critical' },
    { domain: 'Campaign & Marketing', entities: 230, capabilities: 'Campaign management, next-best-action', priority: 'High' },
    { domain: 'Product Management', entities: 209, capabilities: 'Product performance, cross-sell', priority: 'High' },
    { domain: 'Risk Management', entities: 133, capabilities: 'Credit scoring, portfolio risk', priority: 'High' },
    { domain: 'Channel Management', entities: 165, capabilities: 'Omnichannel analytics, digital adoption', priority: 'Medium' },
    { domain: 'Investment Management', entities: 191, capabilities: 'ALM, treasury, FX management', priority: 'Medium' },
    { domain: 'Claims Management', entities: 156, capabilities: 'Insurance analytics, claims processing', priority: 'Low' },
    { domain: 'Event Management', entities: 109, capabilities: 'Event-driven analytics, alerts', priority: 'Medium' },
  ]

  r.table({
    head: ['FSDM Domain', 'Entities', 'Used By Capabilities', 'Priority'],
    rows: fsdmDomains.map(d => [d.domain, d.entities, d.capabilities, d.priority]),
    // The head fill was BLUE here and PURPLE on every other table. The spine
    // paints table heads in meta.accent, once, so this page now matches the
    // other five.
    headFontSize: 8,
    bodyFontSize: 8,
    columnStyles: { 1: { halign: 'center' }, 3: { halign: 'center' } },
  })

  // ── PAGE 15: ROADMAP SUMMARY ──
  r.page('Roadmap Summary')
  {
    const phases = [
      { name: 'Phase 1: Quick Wins', months: '1–6', capabilities: 5, investment: 'PKR 50–80M', color: GREEN },
      { name: 'Phase 2: Core Build', months: '7–18', capabilities: 15, investment: 'PKR 150–250M', color: BLUE },
      { name: 'Phase 3: Advanced Analytics', months: '19–36', capabilities: 20, investment: 'PKR 100–200M', color: PURPLE },
    ]
    const boxTop = r.cursorY + 6
    const boxGap = 10
    /*
     * D-006, fixed: the grid is DERIVED from the content column, not guessed.
     *
     * This was `boxW = 55`, which with two 10mm gaps spans 15..200mm against a
     * content column that ends at 195mm — the third box broke the margin by 5mm
     * (14.17pt) before a single glyph was drawn, and its centred title leaked
     * 0.57pt past with it. No spine primitive could reach that: `r.text()` wraps
     * text, and the BOX was what overflowed. Wrapping the title to the box width
     * would still have permitted 200mm.
     *
     * Derived rather than restated as 53.33 so the grid stays correct if a
     * fourth phase, a different gap or a wider sheet ever arrives — a hardcoded
     * 53.33 is the same defect with a better number. `phases.length` rather than
     * 3 for the same reason.
     *
     * Verified by scripts/golden/geometry.mjs, which measures drawn PATHS rather
     * than glyphs; the text harness could not see this box, and in TAIW and HAIW
     * — same grid, shorter titles — no glyph overflowed at all.
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
      // rather than wrapping — see D-004. The titles are short and fixed, and
      // the golden walk confirms they still fit on one line at the narrower box.
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
    head: ['Category', 'You', 'Pakistan Avg', 'Regional Leaders', 'Global Best'],
    rows: CATEGORIES.slice(0, 8).map(cat => {
      const score = scores.find(s => s.category === cat) || { current: 0 }
      const pk = (pkAvg as Record<string, number | string>)[cat]
      const reg = (regional as Record<string, number | string>)[cat]
      const gl = (global as Record<string, number | string>)[cat]
      return [
        cat,
        score.current.toFixed(1),
        typeof pk === 'number' ? pk.toFixed(1) : '1.9',
        typeof reg === 'number' ? reg.toFixed(1) : '3.2',
        typeof gl === 'number' ? gl.toFixed(1) : '4.1',
      ]
    }),
    headFontSize: 8,
    bodyFontSize: 8,
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    gapAfter: 15,
  })

  const regOverall = typeof regional['Overall Assessment'] === 'number' ? regional['Overall Assessment'] : 3.18
  const gapToRegional = (regOverall - overallScore).toFixed(1)
  /*
   * TAIW's copy of this line is D-002 — the worst geometry defect in the suite,
   * 166.64 pt off a 595.28 pt sheet. This original is not, and the difference is
   * one interpolation: TAIW's copy appends `regional.examples`, 69 characters of
   * customs authority names, where this one stops at "regional leaders". The
   * sentence is 96 characters and fits inside the margin unwrapped. It goes
   * through `r.text()` regardless — the width it happens to have today is a
   * property of the benchmark dataset, not of the code.
   */
  r.text(
    `You are ${gapToRegional} levels behind regional leaders. Closing this gap requires an estimated 18–24 months.`,
    { size: 10 },
  )

  // ── PAGE 17: NEXT STEPS ──
  r.page('Next Steps')
  r.spacer(6)
  const steps = [
    'Present this assessment to your Analytics Leadership Committee',
    'Validate findings with department heads across IT, Risk, Operations, and Marketing',
    'Prioritize Phase 1 Quick Win capabilities for immediate business impact',
    'Engage Godaitec for a Deep Dive Workshop to build a detailed implementation plan',
  ]
  // The numbers used to be drawn 11pt PURPLE and the steps 10pt black; the
  // spine's label column is one size and SLATE. Same two columns at the same two
  // x positions (15 and 25), and the values now wrap inside their column instead
  // of running at the page edge.
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
    doc.setTextColor(...PURPLE)
    doc.text('Contact Us', w / 2, boxTop + 10, { align: 'center' })
    doc.setFontSize(9)
    doc.setTextColor(...SLATE)
    doc.text('Godaitec | godai.tech | info@godai.tech', w / 2, boxTop + 20, { align: 'center' })
    r.moveTo(boxTop + 30 + 6)
  }

  // ── PAGE 18: METHODOLOGY ──
  r.page('Methodology')
  r.bullets([
    'This assessment uses the Banking Value Framework (BVF) — 112 analytics capabilities across 6 themes',
    'Data model readiness assessed against Teradata FSDM v13 (3,917 entities, 16 domains)',
    'Maturity measured using BACR (Banking Analytics Capability Review) — 5-level scale',
  ], { size: 9, gapAfter: 8 })

  r.table({
    head: ['Level', 'Label', 'Description'],
    rows: [1, 2, 3, 4, 5].map(l => {
      const key = String(l) as keyof typeof benchmarks.maturityLevelDescriptions
      const desc = benchmarks.maturityLevelDescriptions[key]
      return [l, desc.label, desc.description]
    }),
    headFontSize: 8,
    bodyFontSize: 8,
    columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
    gapAfter: 15,
  })

  r.text('Disclaimer: Benchmark data based on industry research and consulting experience.', {
    size: 7,
    color: SLATE,
  })

  saveReport(r.build(), reportFilename(reportMeta, 'pdf'))
}

// ══════════════════════════════════════════════════════════
// CAPABILITY REGISTER CSV
// ══════════════════════════════════════════════════════════
/*
 * D-001 CLOSED BY REMOVAL. This was `generateGapCSV`, and it emitted 112 rows of
 * `Current Level`, `Required Level`, `Gap` and `Priority` that no dataset
 * supports:
 *
 *   - the names were built at export time — `${cat} Strategy & Planning` —
 *     and matched no row in capabilities.json;
 *   - `Current Level` was a BACR category score plus
 *     `(Math.random() - 0.5) * 0.6`;
 *   - `Priority` thresholded that jitter, so the class flipped in 46 of 112 rows
 *     between two exports of one unchanged assessment;
 *   - `FSDM Dependencies` was one of four strings chosen by category name.
 *
 * The columns are GONE rather than renamed. BACR categories and BVF capabilities
 * are orthogonal axes with no join in any dataset, so there is nothing to
 * compute and no heading that would make the number true. What ships is the
 * register: the 112 real capabilities and the attributes actually authored
 * against them.
 *
 * Now on src/report/csv.ts, which quotes every field — the old code interpolated
 * unquoted, so a capability name containing a comma corrupted the row, and four
 * of the real names contain one. BOM + CRLF, as every deliverable CSV here.
 *
 * Removing Math.random makes this file byte-identical across exports for the
 * first time; the golden baseline asserts its raw bytes rather than skipping
 * three columns.
 */
const REGISTER_COLUMNS: CsvColumn<BvfCapability>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'themeName', header: 'Theme' },
  { key: 'groupName', header: 'Group' },
  { key: 'phase', header: 'Phase' },
  // NOT the number of rows in dataRequirements.json, despite the field name.
  // `sum(dataReqCount)` over the 112 capabilities is 5218, which is exactly the
  // row count of `capability_fsdm_dependencies.csv` in the design record — a
  // different source file from the one that produced dataRequirements.json. It
  // counts FSDM entity dependencies, and the header now says so.
  //
  // D-007 opened as "declared 52, actual 22, disagreeing in 111 of 112". That
  // was the wrong comparison: the header read "Data Requirements (declared)"
  // and invited it. Do NOT recompute this field from dataRequirements.json —
  // it would fall 5218 → 142, put 97 capabilities at zero, and RoadmapBuilder
  // sums it for display.
  { key: 'dataReqCount', header: 'FSDM Entity Dependencies' },
  // Semicolon-joined, matching the register convention in DGIW's CDE export.
  // Empty for the 97 capabilities with no recorded FSDM dependency — see
  // `fsdmByCapability`. This is the subject-area *name* list derived from
  // dataRequirements.json; the count beside it is the capability's own authored
  // entity-dependency total. Different grain, different source — the two do NOT
  // reconcile and must not look like they do.
  { key: 'id', header: 'FSDM Subject Areas (linked)', format: cap => fsdmFor(cap).join('; ') },
  { key: 'description', header: 'Description' },
]

export function generateCapabilityRegisterCSV(meta: ReportMeta) {
  // byNumber, not byStringKey: BVF ids are unpadded integers 1..112, so code-unit
  // order would put 10 before 2. src/report/csv.ts documents exactly this trap.
  const rows = [...capabilities].sort(byNumber(c => c.id))
  downloadCsv(rows, REGISTER_COLUMNS, reportFilename(meta, 'csv'))
}

// ══════════════════════════════════════════════════════════
// ROADMAP MARKDOWN GENERATOR
// ══════════════════════════════════════════════════════════
/**
 * The twelve-slide roadmap, on the spine's CONVENTIONS rather than its builder —
 * there is no markdown analogue of ReportDoc and src/report/ is not the place to
 * invent one for three callers.
 *
 * The org name and the date come from `meta`, the date is `formatCoverDate()`
 * (UTC parts, machine-stable) instead of `toLocaleDateString()` (neither), and
 * the filename is `reportFilename()`. The old bare `toLocaleDateString()`
 * rendered `7/31/2026` on an en-US machine and `31.7.2026` on a German one, for
 * the same assessment.
 */
export function generateRoadmapMarkdown(assessment: AssessmentData, meta: ReportMeta) {
  const { scores, overallScore } = assessment
  const sortedByGap = [...scores].sort((a, b) => b.gap - a.gap)

  const md = `# ${meta.orgName} — Analytics Transformation Roadmap
## Prepared by Godaitec | ${formatCoverDate(meta.generatedAt)}

---

## Slide 1: Title
### ${meta.orgName} Analytics Transformation Roadmap
**Current Maturity: ${overallScore} / 5.0 (${levelLabel(overallScore)})**
Prepared by Godaitec (godai.tech)

---

## Slide 2: Current State
### Where We Are Today
${scores.map(s => `- **${s.category}**: ${s.current.toFixed(1)} / 5.0 (${levelLabel(s.current)})`).join('\n')}

**Overall Score: ${overallScore} / 5.0**

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
### Investment: PKR 50–80 Million
- Establish analytics governance committee
- Deploy basic BI/reporting platform
- Implement customer 360 view (Party Management domain)
- Quick win: Transaction classification for revenue insights
- 5 BVF capabilities activated

---

## Slide 6: Phase 2 — Core Build (Months 7–18)
### Investment: PKR 150–250 Million
- Enterprise data warehouse on FSDM reference architecture
- Credit risk scoring models in production
- Campaign analytics and next-best-action engine
- Operational dashboards for branch and ATM performance
- 15 BVF capabilities activated

---

## Slide 7: Phase 3 — Advanced Analytics (Months 19–36)
### Investment: PKR 100–200 Million
- ML models embedded in operational processes
- Real-time fraud detection and AML
- Predictive customer churn and lifetime value
- AI-driven pricing optimization
- 20+ BVF capabilities activated

---

## Slide 8: Data Foundation
### FSDM Reference Architecture
- **3,917 entities** across 16 domains
- Priority domains: Party Management (622 entities), Agreement & Account (506), Financial Transaction (141)
- Data integration from core banking, CRM, channels, and external sources

---

## Slide 9: Investment Summary
### Total: PKR 300–530 Million over 3 Years
| Phase | Duration | Investment | Capabilities |
|-------|----------|------------|-------------|
| Phase 1 | Months 1–6 | PKR 50–80M | 5 |
| Phase 2 | Months 7–18 | PKR 150–250M | 15 |
| Phase 3 | Months 19–36 | PKR 100–200M | 20+ |

---

## Slide 10: ROI Projection
### Expected Returns
- **Year 1**: PKR 100–200M (quick wins, cost reduction)
- **Year 2**: PKR 300–500M (revenue uplift, risk reduction)
- **Year 3**: PKR 500–800M (embedded analytics, optimization)
- **3-Year ROI**: 200–300%

---

## Slide 11: Why Godaitec
### Our Expertise
- Banking analytics specialists with Pakistan market expertise
- FSDM and BVF framework implementers
- Proven track record in analytics transformation
- End-to-end: strategy → architecture → implementation → training

---

## Slide 12: Contact
### Let's Build Your Analytics Future

**Godaitec**
Website: godai.tech
Email: info@godai.tech

*This roadmap was generated using BAIW — Banking Analytics Intelligence Workbench*
`

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, reportFilename(meta, 'md'))
}
