import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import benchmarks from '../data/benchmarks.json'

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

const CATEGORIES = [
  'Business', 'Culture', 'Governance', 'Information', 'Applications',
  'Systems', 'Agility', 'Outcomes', 'Overall Assessment'
]

const PURPLE = [88, 28, 135] as const   // #581C87
const BLUE = [37, 99, 235] as const     // #2563EB
const AMBER = [217, 119, 6] as const    // #D97706
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

// ── Helper: Add page header/footer ──
function addHeaderFooter(doc: jsPDF, pageNum: number, totalPages: number, bankName: string, isDraft: boolean) {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()

  // Header line
  doc.setDrawColor(...PURPLE)
  doc.setLineWidth(0.5)
  doc.line(15, 12, w - 15, 12)

  // Header text
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text(bankName + ' — Analytics Maturity Assessment', 15, 10)
  doc.text('Powered by BAIW', w - 15, 10, { align: 'right' })

  // Footer
  doc.line(15, h - 12, w - 15, h - 12)
  doc.text('Prepared by Godaitec | godai.tech', 15, h - 8)
  doc.text(`Page ${pageNum} of ${totalPages}`, w - 15, h - 8, { align: 'right' })

  // Draft watermark
  if (isDraft) {
    doc.setFontSize(50)
    doc.setTextColor(200, 200, 200)
    doc.text('DRAFT', w / 2, h / 2, { align: 'center', angle: 45 })
  }
}

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
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep
    const x = centerX + (radius + 12) * Math.cos(angle)
    const y = centerY + (radius + 12) * Math.sin(angle)
    doc.line(centerX, centerY, centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
    doc.text(data[i].category, x, y, { align: 'center' })
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
export function generateMaturityPDF(assessment: AssessmentData, bankName: string) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const w = doc.internal.pageSize.getWidth()
  const isDraft = assessment.answeredCategories < assessment.totalCategories
  const totalPages = 18
  const { scores, overallScore } = assessment
  const pkAvg = benchmarks.pakistanBankingAverage
  const regional = benchmarks.regionalLeaders
  const global = benchmarks.globalBest

  const sortedByGap = [...scores].sort((a, b) => b.gap - a.gap)

  // ── PAGE 1: COVER ──
  let page = 1
  doc.setFillColor(...PURPLE)
  doc.rect(0, 0, w, 100, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(28)
  doc.text(bankName, w / 2, 40, { align: 'center' })
  doc.setFontSize(16)
  doc.text('Analytics Maturity Assessment', w / 2, 55, { align: 'center' })
  doc.setFontSize(10)
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), w / 2, 70, { align: 'center' })
  doc.text('Powered by Banking Analytics Intelligence Workbench (BAIW)', w / 2, 80, { align: 'center' })

  // Score circle
  doc.setFillColor(...WHITE)
  doc.circle(w / 2, 140, 30, 'F')
  doc.setTextColor(...PURPLE)
  doc.setFontSize(36)
  doc.text(`${overallScore}`, w / 2, 143, { align: 'center' })
  doc.setFontSize(12)
  doc.text('/ 5.0', w / 2, 155, { align: 'center' })
  doc.setFontSize(14)
  doc.text(levelLabel(overallScore), w / 2, 180, { align: 'center' })

  doc.setTextColor(...SLATE)
  doc.setFontSize(10)
  doc.text('Prepared by Godaitec (godai.tech)', w / 2, 270, { align: 'center' })
  if (isDraft) {
    doc.setFontSize(50)
    doc.setTextColor(200, 200, 200)
    doc.text('DRAFT', w / 2, 220, { align: 'center', angle: 45 })
  }

  // ── PAGE 2: EXECUTIVE SUMMARY ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, bankName, isDraft)

  doc.setTextColor(...PURPLE)
  doc.setFontSize(18)
  doc.text('Executive Summary', 15, 25)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.text(`Overall Maturity: ${overallScore} / 5.0`, 15, 40)
  doc.setFontSize(10)
  doc.text(`Level: ${levelLabel(overallScore)} — ${levelDescription(overallScore)}`, 15, 48)

  // Key Findings
  doc.setFontSize(13)
  doc.setTextColor(...PURPLE)
  doc.text('Key Findings', 15, 62)
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)

  let y = 70
  const findings = sortedByGap.slice(0, 3)
  findings.forEach((f, i) => {
    const pkVal = (pkAvg as Record<string, number | string>)[f.category]
    const pkScore = typeof pkVal === 'number' ? pkVal : 1.86
    doc.text(`${i + 1}. Your ${f.category} maturity (${f.current}) is ${f.current < pkScore ? 'below' : 'at'} Pakistan average (${pkScore}). Gap to target: ${f.gap}`, 20, y)
    y += 8
  })

  // Priority Recommendations
  y += 5
  doc.setFontSize(13)
  doc.setTextColor(...PURPLE)
  doc.text('Priority Recommendations', 15, y)
  y += 10
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)

  const recommendations = [
    `1. Establish a Chief Data Officer role and data governance framework (closes ${sortedByGap[0]?.gap || 0}-level gap in ${sortedByGap[0]?.category || 'Governance'})`,
    `2. Deploy enterprise data warehouse using FSDM as reference architecture`,
    `3. Build predictive analytics capability starting with customer churn and credit scoring`,
  ]
  recommendations.forEach(r => {
    doc.text(r, 20, y)
    y += 8
  })

  y += 5
  doc.setFontSize(10)
  doc.text(`Estimated total investment: PKR 300–530 million over 3 years`, 15, y)

  // ── PAGE 3: MATURITY RADAR ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, bankName, isDraft)

  doc.setTextColor(...PURPLE)
  doc.setFontSize(18)
  doc.text('Maturity Radar', 15, 25)

  drawRadarChart(doc, scores, w / 2, 130, 65)

  // ── PAGE 4: CATEGORY SCORECARD ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, bankName, isDraft)

  doc.setTextColor(...PURPLE)
  doc.setFontSize(18)
  doc.text('Category Scorecard', 15, 25)

  autoTable(doc, {
    startY: 35,
    head: [['Category', 'Current', 'Target', 'Gap', 'Level', 'vs Pakistan Avg']],
    body: sortedByGap.map(s => {
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
    headStyles: { fillColor: [...PURPLE], textColor: [...WHITE] },
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
  for (let ci = 0; ci < CATEGORIES.length - 1; ci++) {
    doc.addPage()
    page++
    addHeaderFooter(doc, page, totalPages, bankName, isDraft)

    const cat = CATEGORIES[ci]
    const score = scores.find(s => s.category === cat) || { category: cat, current: 0, desired: 0, gap: 0 }
    const pkVal = (pkAvg as Record<string, number | string>)[cat]
    const pkScore = typeof pkVal === 'number' ? pkVal : 1.86

    // Header
    const scoreColor = colorForScore(score.current)
    doc.setFillColor(...scoreColor)
    doc.roundedRect(15, 18, w - 30, 20, 3, 3, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(14)
    doc.text(`${cat} — ${score.current.toFixed(1)} / 5.0`, 20, 31)
    doc.text(levelLabel(score.current), w - 20, 31, { align: 'right' })

    y = 48
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(`Current Level: ${levelLabel(score.current)}`, 15, y)
    doc.setFontSize(8)
    doc.text(levelDescription(score.current), 15, y + 6)
    y += 16

    doc.setFontSize(10)
    doc.text(`Target Level: ${levelLabel(score.desired)}`, 15, y)
    doc.setFontSize(8)
    doc.text(levelDescription(score.desired), 15, y + 6)
    y += 20

    // Key Strengths
    doc.setFontSize(11)
    doc.setTextColor(...GREEN)
    doc.text('Key Strengths', 15, y)
    y += 7
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    const strengths = [
      score.current >= pkScore ? `Scoring above Pakistan banking average (${pkScore})` : `Awareness of ${cat.toLowerCase()} importance is growing`,
      `Foundation for ${cat.toLowerCase()} improvement is in place`,
      `Leadership recognizes the need for ${cat.toLowerCase()} advancement`,
    ]
    strengths.forEach(s => { doc.text(`• ${s}`, 20, y); y += 6 })

    y += 5
    // Key Gaps
    doc.setFontSize(11)
    doc.setTextColor(220, 38, 38)
    doc.text('Key Gaps', 15, y)
    y += 7
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    const gaps = [
      `Gap of ${score.gap.toFixed(1)} levels to reach target state`,
      score.current < pkScore ? `Below Pakistan banking average by ${(pkScore - score.current).toFixed(1)} levels` : `Still ${((regional as Record<string, number | string>)[cat] as number - score.current).toFixed(1)} levels behind regional leaders`,
      `Requires structured investment and capability building`,
    ]
    gaps.forEach(g => { doc.text(`• ${g}`, 20, y); y += 6 })

    y += 5
    // Recommended Actions
    doc.setFontSize(11)
    doc.setTextColor(...BLUE)
    doc.text('Recommended Actions', 15, y)
    y += 7
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    const actions = [
      `Conduct a detailed ${cat.toLowerCase()} capability assessment with department heads`,
      `Develop a 12-month improvement roadmap with quick wins in months 1-3`,
      `Benchmark against regional leaders (${(regional as Record<string, number | string>).examples || 'regional peers'})`,
    ]
    actions.forEach(a => { doc.text(`• ${a}`, 20, y); y += 6 })
  }

  // ── PAGE 13: CAPABILITY GAP MATRIX ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, bankName, isDraft)

  doc.setTextColor(...PURPLE)
  doc.setFontSize(18)
  doc.text('Capability Gap Matrix', 15, 25)
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text('Top 20 BVF capabilities with largest estimated gaps based on category scores', 15, 33)

  const capGaps = CATEGORIES.slice(0, 8).flatMap((cat, ci) => {
    const score = scores.find(s => s.category === cat) || { current: 0, gap: 0 }
    return [
      { name: `${cat} Strategy & Planning`, theme: cat, currentLevel: score.current, requiredLevel: score.current + score.gap, gap: score.gap, rank: ci * 3 + 1 },
      { name: `${cat} Analytics & Reporting`, theme: cat, currentLevel: Math.max(1, score.current - 0.3), requiredLevel: score.current + score.gap, gap: score.gap + 0.3, rank: ci * 3 + 2 },
      { name: `${cat} Process Automation`, theme: cat, currentLevel: Math.max(1, score.current - 0.5), requiredLevel: score.current + score.gap, gap: score.gap + 0.5, rank: ci * 3 + 3 },
    ]
  }).sort((a, b) => b.gap - a.gap).slice(0, 20)

  autoTable(doc, {
    startY: 38,
    head: [['#', 'Capability', 'Theme', 'Current', 'Required', 'Gap', 'Priority']],
    body: capGaps.map((c, i) => [
      i + 1,
      c.name,
      c.theme,
      c.currentLevel.toFixed(1),
      c.requiredLevel.toFixed(1),
      c.gap.toFixed(1),
      priorityLabel(c.gap),
    ]),
    headStyles: { fillColor: [...PURPLE], textColor: [...WHITE], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 0: { halign: 'center', cellWidth: 8 }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' } },
    didParseCell(data) {
      if (data.section === 'body' && data.row.index < 5) {
        data.cell.styles.fillColor = [255, 251, 235]
      }
    },
  })

  // ── PAGE 14: FSDM DATA READINESS ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, bankName, isDraft)

  doc.setTextColor(...PURPLE)
  doc.setFontSize(18)
  doc.text('FSDM Data Readiness', 15, 25)
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text('Which FSDM domains are needed based on capability gaps', 15, 33)

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

  autoTable(doc, {
    startY: 38,
    head: [['FSDM Domain', 'Entities', 'Used By Capabilities', 'Priority']],
    body: fsdmDomains.map(d => [d.domain, d.entities, d.capabilities, d.priority]),
    headStyles: { fillColor: [...BLUE], textColor: [...WHITE], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'center' }, 3: { halign: 'center' } },
  })

  // ── PAGE 15: ROADMAP SUMMARY ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, bankName, isDraft)

  doc.setTextColor(...PURPLE)
  doc.setFontSize(18)
  doc.text('Roadmap Summary', 15, 25)

  const phases = [
    { name: 'Phase 1: Quick Wins', months: '1–6', capabilities: 5, investment: 'PKR 50–80M', color: GREEN },
    { name: 'Phase 2: Core Build', months: '7–18', capabilities: 15, investment: 'PKR 150–250M', color: BLUE },
    { name: 'Phase 3: Advanced Analytics', months: '19–36', capabilities: 20, investment: 'PKR 100–200M', color: PURPLE },
  ]

  y = 45
  phases.forEach((p, i) => {
    const boxW = 55
    const x = 15 + i * (boxW + 10)
    doc.setFillColor(...p.color)
    doc.roundedRect(x, y, boxW, 60, 3, 3, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(10)
    doc.text(p.name, x + boxW / 2, y + 12, { align: 'center' })
    doc.setFontSize(8)
    doc.text(`Months ${p.months}`, x + boxW / 2, y + 22, { align: 'center' })
    doc.text(`${p.capabilities} capabilities`, x + boxW / 2, y + 32, { align: 'center' })
    doc.text(p.investment, x + boxW / 2, y + 42, { align: 'center' })

    // Arrow between boxes
    if (i < phases.length - 1) {
      doc.setDrawColor(...SLATE)
      doc.setLineWidth(0.5)
      const arrowX = x + boxW + 2
      doc.line(arrowX, y + 30, arrowX + 6, y + 30)
      doc.line(arrowX + 4, y + 28, arrowX + 6, y + 30)
      doc.line(arrowX + 4, y + 32, arrowX + 6, y + 30)
    }
  })

  // ── PAGE 16: BENCHMARK COMPARISON ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, bankName, isDraft)

  doc.setTextColor(...PURPLE)
  doc.setFontSize(18)
  doc.text('Benchmark Comparison', 15, 25)

  autoTable(doc, {
    startY: 35,
    head: [['Category', 'You', 'Pakistan Avg', 'Regional Leaders', 'Global Best']],
    body: CATEGORIES.slice(0, 8).map(cat => {
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
    headStyles: { fillColor: [...PURPLE], textColor: [...WHITE], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
  })

  const regOverall = typeof regional['Overall Assessment'] === 'number' ? regional['Overall Assessment'] : 3.18
  const gapToRegional = (regOverall - overallScore).toFixed(1)
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 150
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`You are ${gapToRegional} levels behind regional leaders. Closing this gap requires an estimated 18–24 months.`, 15, y + 15)

  // ── PAGE 17: NEXT STEPS ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, bankName, isDraft)

  doc.setTextColor(...PURPLE)
  doc.setFontSize(18)
  doc.text('Next Steps', 15, 25)

  y = 45
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  const steps = [
    'Present this assessment to your Analytics Leadership Committee',
    'Validate findings with department heads across IT, Risk, Operations, and Marketing',
    'Prioritize Phase 1 Quick Win capabilities for immediate business impact',
    'Engage Godaitec for a Deep Dive Workshop to build a detailed implementation plan',
  ]
  steps.forEach((s, i) => {
    doc.setFontSize(11)
    doc.setTextColor(...PURPLE)
    doc.text(`${i + 1}.`, 15, y)
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(s, 25, y)
    y += 12
  })

  y += 20
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(15, y, w - 30, 30, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setTextColor(...PURPLE)
  doc.text('Contact Us', w / 2, y + 10, { align: 'center' })
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text('Godaitec | godai.tech | info@godai.tech', w / 2, y + 20, { align: 'center' })

  // ── PAGE 18: METHODOLOGY ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, bankName, isDraft)

  doc.setTextColor(...PURPLE)
  doc.setFontSize(18)
  doc.text('Methodology', 15, 25)

  y = 40
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const methodology = [
    'This assessment uses the Banking Value Framework (BVF) — 112 analytics capabilities across 6 themes',
    'Data model readiness assessed against Teradata FSDM v13 (3,917 entities, 16 domains)',
    'Maturity measured using BACR (Banking Analytics Capability Review) — 5-level scale',
  ]
  methodology.forEach(m => { doc.text(`• ${m}`, 15, y); y += 8 })

  y += 10
  autoTable(doc, {
    startY: y,
    head: [['Level', 'Label', 'Description']],
    body: [1, 2, 3, 4, 5].map(l => {
      const key = String(l) as keyof typeof benchmarks.maturityLevelDescriptions
      const desc = benchmarks.maturityLevelDescriptions[key]
      return [l, desc.label, desc.description]
    }),
    headStyles: { fillColor: [...PURPLE], textColor: [...WHITE], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text('Disclaimer: Benchmark data based on industry research and consulting experience.', 15, y + 15)

  // Save
  doc.save(`${bankName.replace(/\s+/g, '_')}_Analytics_Maturity_Assessment.pdf`)
}

// ══════════════════════════════════════════════════════════
// GAP CSV GENERATOR
// ══════════════════════════════════════════════════════════
export function generateGapCSV(assessment: AssessmentData) {
  const { scores } = assessment

  // Header
  let csv = 'ID,Name,Theme,Group,Current Level,Required Level,Gap,Priority,FSDM Dependencies\n'

  // Generate capability rows from category scores
  let id = 1
  CATEGORIES.slice(0, 8).forEach(cat => {
    const score = scores.find(s => s.category === cat) || { current: 0, desired: 0, gap: 0 }
    const capabilities = [
      { name: `${cat} Strategy & Planning`, group: 'Strategy' },
      { name: `${cat} Analytics`, group: 'Analytics' },
      { name: `${cat} Reporting`, group: 'Reporting' },
      { name: `${cat} Process Automation`, group: 'Automation' },
      { name: `${cat} Data Integration`, group: 'Data' },
      { name: `${cat} Model Development`, group: 'Models' },
      { name: `${cat} Performance Management`, group: 'Performance' },
      { name: `${cat} Risk Assessment`, group: 'Risk' },
      { name: `${cat} Customer Analytics`, group: 'Customer' },
      { name: `${cat} Optimization`, group: 'Optimization' },
      { name: `${cat} Real-Time Decisioning`, group: 'Real-Time' },
      { name: `${cat} Predictive Models`, group: 'Predictive' },
      { name: `${cat} Dashboard & Visualization`, group: 'Visualization' },
      { name: `${cat} Data Quality`, group: 'Quality' },
    ]
    capabilities.forEach(cap => {
      const variation = (Math.random() - 0.5) * 0.6
      const current = Math.max(1, Math.min(5, score.current + variation))
      const required = Math.max(current, score.desired)
      const gap = required - current
      const fsdm = cat === 'Information' ? 'Party; Agreement; Transaction' :
                   cat === 'Applications' ? 'Campaign; Channel; Product' :
                   cat === 'Systems' ? 'All domains' : 'Party; Agreement'
      csv += `${id},${cap.name},${cat},${cap.group},${current.toFixed(1)},${required.toFixed(1)},${gap.toFixed(1)},${priorityLabel(gap)},${fsdm}\n`
      id++
    })
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, 'BAIW_Capability_Gap_Analysis.csv')
}

// ══════════════════════════════════════════════════════════
// ROADMAP MARKDOWN GENERATOR
// ══════════════════════════════════════════════════════════
export function generateRoadmapMarkdown(assessment: AssessmentData, bankName: string) {
  const { scores, overallScore } = assessment
  const sortedByGap = [...scores].sort((a, b) => b.gap - a.gap)

  const md = `# ${bankName} — Analytics Transformation Roadmap
## Prepared by Godaitec | ${new Date().toLocaleDateString()}

---

## Slide 1: Title
### ${bankName} Analytics Transformation Roadmap
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
  saveAs(blob, `${bankName.replace(/\s+/g, '_')}_Analytics_Roadmap.md`)
}
