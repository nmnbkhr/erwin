import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'

import type { HaiwCapability, HaiwAssessmentAnswer } from '../types'

// ── Types ──
interface CategoryScore {
  category: string
  current: number
  desired: number
  gap: number
}

interface HealthBenchmarks {
  pakistanAverage: Record<string, number>
  regionalLeaders: Record<string, number>
  whoTargets: Record<string, number>
}

const HACR_CATEGORIES = [
  'Strategy & Leadership',
  'Workforce & Skills',
  'Data Governance',
  'Infrastructure',
  'Analytics',
  'Integration',
  'Patient Engagement',
  'Outcomes',
]

const EMERALD = [16, 185, 129] as const    // #10B981
const TEAL = [20, 184, 166] as const       // #14B8A6
const BLUE = [37, 99, 235] as const        // #2563EB
const AMBER = [217, 119, 6] as const       // #D97706
const RED = [220, 38, 38] as const         // #DC2626
const SLATE = [100, 116, 139] as const     // #64748B
const WHITE = [255, 255, 255] as const
const DARK = [15, 23, 42] as const         // #0F172A

type RGB = readonly [number, number, number]

// ── Default benchmarks (used when none provided) ──
const DEFAULT_BENCHMARKS: HealthBenchmarks = {
  pakistanAverage: {
    'Strategy & Leadership': 1.6,
    'Workforce & Skills': 1.4,
    'Data Governance': 1.3,
    'Infrastructure': 1.7,
    'Analytics': 1.2,
    'Integration': 1.5,
    'Patient Engagement': 1.8,
    'Outcomes': 1.3,
  },
  regionalLeaders: {
    'Strategy & Leadership': 3.4,
    'Workforce & Skills': 3.1,
    'Data Governance': 3.0,
    'Infrastructure': 3.5,
    'Analytics': 2.9,
    'Integration': 3.2,
    'Patient Engagement': 3.3,
    'Outcomes': 3.0,
  },
  whoTargets: {
    'Strategy & Leadership': 4.0,
    'Workforce & Skills': 4.0,
    'Data Governance': 4.5,
    'Infrastructure': 4.0,
    'Analytics': 4.0,
    'Integration': 4.5,
    'Patient Engagement': 4.5,
    'Outcomes': 4.5,
  },
}

// ── FHIR readiness mapping ──
const FHIR_READINESS = [
  { category: 'Patient Identity', resources: 'Patient, Person, RelatedPerson', gap: 'High', priority: 'Critical' },
  { category: 'Clinical Data', resources: 'Condition, Observation, DiagnosticReport', gap: 'Critical', priority: 'Critical' },
  { category: 'Medication', resources: 'MedicationRequest, MedicationDispense, Immunization', gap: 'High', priority: 'Critical' },
  { category: 'Care Delivery', resources: 'Encounter, EpisodeOfCare, CarePlan', gap: 'High', priority: 'High' },
  { category: 'Scheduling', resources: 'Appointment, Schedule, Slot', gap: 'Medium', priority: 'High' },
  { category: 'Practitioner', resources: 'Practitioner, PractitionerRole, Organization', gap: 'Medium', priority: 'High' },
  { category: 'Financial', resources: 'Claim, Coverage, ExplanationOfBenefit', gap: 'High', priority: 'High' },
  { category: 'Public Health', resources: 'MeasureReport, Bundle, Questionnaire', gap: 'Critical', priority: 'Critical' },
  { category: 'Diagnostics', resources: 'Specimen, ImagingStudy, ServiceRequest', gap: 'High', priority: 'Medium' },
  { category: 'Terminology', resources: 'CodeSystem, ValueSet, ConceptMap', gap: 'Medium', priority: 'Medium' },
]

function colorForScore(score: number): RGB {
  if (score < 2) return RED
  if (score < 3) return AMBER
  return EMERALD
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
    1: 'Ad-Hoc',
    2: 'Developing',
    3: 'Defined',
    4: 'Managed',
    5: 'Optimizing',
  }
  return labels[level] || 'Not Assessed'
}

function levelDescription(level: number): string {
  const descriptions: Record<number, string> = {
    1: 'No formal processes; healthcare analytics are reactive and fragmented across departments.',
    2: 'Basic reporting exists; some awareness of data-driven healthcare but inconsistent practices.',
    3: 'Standardized processes and governance; healthcare analytics capabilities are documented and repeatable.',
    4: 'Advanced analytics integrated into clinical and operational workflows; measurable outcomes tracked.',
    5: 'Continuous optimization with AI/ML; predictive and prescriptive analytics drive all healthcare decisions.',
  }
  return descriptions[Math.round(level)] || ''
}

// ── Compute category scores from answers ──
function computeCategoryScores(answers: HaiwAssessmentAnswer[]): CategoryScore[] {
  const catMap = new Map<string, { currents: number[]; desireds: number[] }>()
  HACR_CATEGORIES.forEach(cat => catMap.set(cat, { currents: [], desireds: [] }))

  answers.forEach(a => {
    // questionId format: "HACR-XX-YY" — extract category from first segment
    const parts = a.questionId.split('-')
    const catIdx = parseInt(parts[1], 10) - 1
    const cat = HACR_CATEGORIES[catIdx]
    if (cat && catMap.has(cat)) {
      catMap.get(cat)!.currents.push(a.currentState)
      catMap.get(cat)!.desireds.push(a.desiredState)
    }
  })

  return HACR_CATEGORIES.map(cat => {
    const data = catMap.get(cat)!
    const current = data.currents.length > 0
      ? parseFloat((data.currents.reduce((a, b) => a + b, 0) / data.currents.length).toFixed(1))
      : 0
    const desired = data.desireds.length > 0
      ? parseFloat((data.desireds.reduce((a, b) => a + b, 0) / data.desireds.length).toFixed(1))
      : 0
    return { category: cat, current, desired, gap: parseFloat((desired - current).toFixed(1)) }
  })
}

// ── Helper: Add page header/footer ──
function addHeaderFooter(doc: jsPDF, pageNum: number, totalPages: number, orgName: string, isDraft: boolean) {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()

  // Header line
  doc.setDrawColor(...EMERALD)
  doc.setLineWidth(0.5)
  doc.line(15, 12, w - 15, 12)

  // Header text
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text(orgName + ' — Healthcare Analytics Maturity Assessment', 15, 10)
  doc.text('Powered by HAIW', w - 15, 10, { align: 'right' })

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

// ── Draw radar chart ──
function drawRadarChart(
  doc: jsPDF,
  data: CategoryScore[],
  centerX: number,
  centerY: number,
  radius: number,
  pkAvg: Record<string, number>,
) {
  const n = data.length
  const angleStep = (2 * Math.PI) / n

  // Draw grid rings
  for (let level = 1; level <= 5; level++) {
    const r = (level / 5) * radius
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    for (let i = 0; i < n; i++) {
      const a1 = -Math.PI / 2 + i * angleStep
      const a2 = -Math.PI / 2 + ((i + 1) % n) * angleStep
      doc.line(
        centerX + r * Math.cos(a1), centerY + r * Math.sin(a1),
        centerX + r * Math.cos(a2), centerY + r * Math.sin(a2),
      )
    }
  }

  // Draw axes and labels
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep
    const x = centerX + (radius + 14) * Math.cos(angle)
    const y = centerY + (radius + 14) * Math.sin(angle)
    doc.line(centerX, centerY, centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
    doc.text(data[i].category, x, y, { align: 'center' })
  }

  // Draw current scores (solid emerald)
  doc.setDrawColor(...EMERALD)
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

  // Draw desired scores (dashed blue)
  doc.setDrawColor(...BLUE)
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
  for (let i = 0; i < n; i++) {
    const val = pkAvg[data[i].category] ?? 1.5
    const angle = -Math.PI / 2 + i * angleStep
    const r = (val / 5) * radius
    const nextI = (i + 1) % n
    const nextVal = pkAvg[data[nextI].category] ?? 1.5
    const nextAngle = -Math.PI / 2 + nextI * angleStep
    const nextR = (nextVal / 5) * radius
    doc.setLineDashPattern([1, 2], 0)
    doc.line(
      centerX + r * Math.cos(angle), centerY + r * Math.sin(angle),
      centerX + nextR * Math.cos(nextAngle), centerY + nextR * Math.sin(nextAngle),
    )
  }

  doc.setLineDashPattern([], 0) // Reset

  // Legend
  const ly = centerY + radius + 25
  doc.setFontSize(7)

  doc.setDrawColor(...EMERALD)
  doc.setLineWidth(1.5)
  doc.line(centerX - 50, ly, centerX - 40, ly)
  doc.setTextColor(...EMERALD)
  doc.text('Current', centerX - 38, ly + 1)

  doc.setDrawColor(...BLUE)
  doc.setLineDashPattern([3, 2], 0)
  doc.line(centerX - 10, ly, centerX, ly)
  doc.setLineDashPattern([], 0)
  doc.setTextColor(...BLUE)
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
export function generateHealthMaturityPDF(
  answers: HaiwAssessmentAnswer[],
  capabilities: HaiwCapability[],
  benchmarks?: Partial<HealthBenchmarks>,
) {
  const bm: HealthBenchmarks = {
    pakistanAverage: { ...DEFAULT_BENCHMARKS.pakistanAverage, ...benchmarks?.pakistanAverage },
    regionalLeaders: { ...DEFAULT_BENCHMARKS.regionalLeaders, ...benchmarks?.regionalLeaders },
    whoTargets: { ...DEFAULT_BENCHMARKS.whoTargets, ...benchmarks?.whoTargets },
  }

  const scores = computeCategoryScores(answers)
  const overallScore = parseFloat(
    (scores.reduce((sum, s) => sum + s.current, 0) / scores.length).toFixed(1),
  )
  const answeredCategories = scores.filter(s => s.current > 0).length
  const totalCategories = HACR_CATEGORIES.length
  const isDraft = answeredCategories < totalCategories

  const sortedByGap = [...scores].sort((a, b) => b.gap - a.gap)

  const orgName = 'Organization' // derived from context; placeholder
  const doc = new jsPDF('p', 'mm', 'a4')
  const w = doc.internal.pageSize.getWidth()
  const totalPages = 18
  let page = 1

  // ── PAGE 1: COVER ──
  // Emerald gradient header
  doc.setFillColor(6, 95, 70)   // dark emerald
  doc.rect(0, 0, w, 50, 'F')
  doc.setFillColor(...EMERALD)
  doc.rect(0, 50, w, 50, 'F')

  doc.setTextColor(...WHITE)
  doc.setFontSize(28)
  doc.text(orgName, w / 2, 35, { align: 'center' })
  doc.setFontSize(16)
  doc.text('Healthcare Analytics Maturity Assessment', w / 2, 55, { align: 'center' })
  doc.setFontSize(10)
  doc.text(
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    w / 2, 70,
    { align: 'center' },
  )
  doc.text('Powered by Healthcare Analytics Intelligence Workbench (HAIW)', w / 2, 80, { align: 'center' })

  // Score circle
  doc.setFillColor(...WHITE)
  doc.circle(w / 2, 140, 30, 'F')
  doc.setTextColor(...EMERALD)
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
  addHeaderFooter(doc, page, totalPages, orgName, isDraft)

  doc.setTextColor(...EMERALD)
  doc.setFontSize(18)
  doc.text('Executive Summary', 15, 25)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.text(`Overall HACR Score: ${overallScore} / 5.0`, 15, 40)
  doc.setFontSize(10)
  doc.text(`Level: ${levelLabel(overallScore)} — ${levelDescription(overallScore)}`, 15, 48, { maxWidth: w - 30 })

  // Key Findings
  doc.setFontSize(13)
  doc.setTextColor(...EMERALD)
  doc.text('Key Findings', 15, 66)
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)

  let y = 74
  const findings = sortedByGap.slice(0, 3)
  findings.forEach((f, i) => {
    const pkScore = bm.pakistanAverage[f.category] ?? 1.5
    doc.text(
      `${i + 1}. ${f.category} maturity (${f.current}) is ${f.current < pkScore ? 'below' : 'at/above'} Pakistan average (${pkScore}). Gap to target: ${f.gap}`,
      20, y, { maxWidth: w - 40 },
    )
    y += 10
  })

  // Priority Recommendations
  y += 5
  doc.setFontSize(13)
  doc.setTextColor(...EMERALD)
  doc.text('Priority Recommendations', 15, y)
  y += 10
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)

  const recommendations = [
    `1. Establish a Chief Health Informatics Officer and data governance framework (closes ${sortedByGap[0]?.gap || 0}-level gap in ${sortedByGap[0]?.category || 'Data Governance'})`,
    `2. Deploy FHIR-compliant health information exchange using HCDM as reference architecture`,
    `3. Build predictive analytics capability starting with disease surveillance and patient outcomes`,
  ]
  recommendations.forEach(r => {
    doc.text(r, 20, y, { maxWidth: w - 40 })
    y += 10
  })

  y += 5
  doc.setFontSize(10)
  doc.text('Estimated total investment: PKR 200–450 million over 3 years', 15, y)

  // ── PAGE 3: MATURITY RADAR ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, orgName, isDraft)

  doc.setTextColor(...EMERALD)
  doc.setFontSize(18)
  doc.text('Maturity Radar — HACR Categories', 15, 25)

  drawRadarChart(doc, scores, w / 2, 135, 65, bm.pakistanAverage)

  // ── PAGE 4: CATEGORY SCORECARD ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, orgName, isDraft)

  doc.setTextColor(...EMERALD)
  doc.setFontSize(18)
  doc.text('Category Scorecard', 15, 25)

  autoTable(doc, {
    startY: 35,
    head: [['Category', 'Current', 'Target', 'Gap', 'Level', 'vs Pakistan Avg']],
    body: sortedByGap.map(s => {
      const pkScore = bm.pakistanAverage[s.category] ?? 1.5
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
    headStyles: { fillColor: [...EMERALD], textColor: [...WHITE] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      5: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const gap = parseFloat(String(data.cell.raw))
        if (gap >= 2) data.cell.styles.textColor = [...RED]
        else if (gap >= 1) data.cell.styles.textColor = [...AMBER]
        else data.cell.styles.textColor = [...EMERALD]
      }
    },
  })

  // ── PAGES 5-12: CATEGORY DEEP DIVES ──
  const categoryRecommendations: Record<string, string[]> = {
    'Strategy & Leadership': [
      'Appoint a Chief Health Informatics Officer with cross-departmental authority',
      'Develop a 3-year health analytics strategy aligned with national eHealth vision',
      'Create analytics steering committee with clinical and administrative representation',
    ],
    'Workforce & Skills': [
      'Launch health informatics training program for clinical and IT staff',
      'Recruit data scientists with healthcare domain expertise',
      'Partner with medical universities for health analytics capacity building',
    ],
    'Data Governance': [
      'Establish patient data governance committee with HIPAA/local compliance focus',
      'Implement master patient index (MPI) across all facilities',
      'Define data quality metrics for clinical, financial, and operational data',
    ],
    'Infrastructure': [
      'Deploy FHIR-compliant health information exchange infrastructure',
      'Migrate to cloud-based health data platform with disaster recovery',
      'Implement secure API gateway for interoperability with DHIS2 and other systems',
    ],
    'Analytics': [
      'Build disease surveillance dashboards using real-time clinical data',
      'Develop predictive models for patient readmission and length of stay',
      'Implement population health analytics for community health assessment',
    ],
    'Integration': [
      'Connect EHR/EMR systems with lab, pharmacy, and radiology using HL7/FHIR',
      'Integrate with national DHIS2 and immunization registries',
      'Establish data exchange with insurance/payer systems for claims analytics',
    ],
    'Patient Engagement': [
      'Deploy patient portal with access to personal health records',
      'Implement automated appointment reminders and follow-up systems',
      'Build patient satisfaction analytics from feedback and outcome data',
    ],
    'Outcomes': [
      'Define and track clinical outcome measures aligned with WHO indicators',
      'Implement quality improvement dashboards for key performance indicators',
      'Build cost-effectiveness analytics for treatment protocols and pathways',
    ],
  }

  for (let ci = 0; ci < HACR_CATEGORIES.length; ci++) {
    doc.addPage()
    page++
    addHeaderFooter(doc, page, totalPages, orgName, isDraft)

    const cat = HACR_CATEGORIES[ci]
    const score = scores.find(s => s.category === cat) || { category: cat, current: 0, desired: 0, gap: 0 }
    const pkScore = bm.pakistanAverage[cat] ?? 1.5
    const regScore = bm.regionalLeaders[cat] ?? 3.0

    // Header bar
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
    doc.text(levelDescription(score.current), 15, y + 6, { maxWidth: w - 30 })
    y += 18

    doc.setFontSize(10)
    doc.text(`Target Level: ${levelLabel(score.desired)}`, 15, y)
    doc.setFontSize(8)
    doc.text(levelDescription(score.desired), 15, y + 6, { maxWidth: w - 30 })
    y += 22

    // Key Strengths
    doc.setFontSize(11)
    doc.setTextColor(...EMERALD)
    doc.text('Key Strengths', 15, y)
    y += 7
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    const strengths = [
      score.current >= pkScore
        ? `Scoring above Pakistan healthcare average (${pkScore})`
        : `Awareness of ${cat.toLowerCase()} importance is growing`,
      `Foundation for ${cat.toLowerCase()} improvement is in place`,
      `Leadership recognizes the need for ${cat.toLowerCase()} advancement`,
    ]
    strengths.forEach(s => { doc.text(`• ${s}`, 20, y); y += 6 })

    y += 5
    // Key Gaps
    doc.setFontSize(11)
    doc.setTextColor(...RED)
    doc.text('Key Gaps', 15, y)
    y += 7
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    const gaps = [
      `Gap of ${score.gap.toFixed(1)} levels to reach target state`,
      score.current < pkScore
        ? `Below Pakistan healthcare average by ${(pkScore - score.current).toFixed(1)} levels`
        : `Still ${(regScore - score.current).toFixed(1)} levels behind regional leaders`,
      'Requires structured investment and capability building',
    ]
    gaps.forEach(g => { doc.text(`• ${g}`, 20, y); y += 6 })

    y += 5
    // Recommended Actions (healthcare-specific)
    doc.setFontSize(11)
    doc.setTextColor(...BLUE)
    doc.text('Recommended Actions', 15, y)
    y += 7
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    const actions = categoryRecommendations[cat] || [
      `Conduct a detailed ${cat.toLowerCase()} capability assessment`,
      `Develop a 12-month improvement roadmap with quick wins`,
      `Benchmark against regional leaders and WHO targets`,
    ]
    actions.forEach(a => { doc.text(`• ${a}`, 20, y, { maxWidth: w - 40 }); y += 8 })
  }

  // ── PAGE 13: CAPABILITY GAP MATRIX ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, orgName, isDraft)

  doc.setTextColor(...EMERALD)
  doc.setFontSize(18)
  doc.text('Capability Gap Matrix', 15, 25)
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text('Top 20 HCF capabilities with largest estimated gaps based on category scores', 15, 33)

  // Build capability gaps from capabilities data or synthesize from scores
  const capGaps = capabilities.length > 0
    ? capabilities.map(cap => {
        const catScore = scores.find(s => s.category === cap.theme) || { current: 0, gap: 0 }
        const variation = (cap.id.charCodeAt(cap.id.length - 1) % 10 - 5) * 0.1
        const current = Math.max(1, Math.min(5, catScore.current + variation))
        const required = Math.max(current, current + catScore.gap)
        return {
          name: cap.name,
          theme: cap.theme,
          current,
          required,
          gap: required - current,
        }
      }).sort((a, b) => b.gap - a.gap).slice(0, 20)
    : HACR_CATEGORIES.flatMap(cat => {
        const score = scores.find(s => s.category === cat) || { current: 0, gap: 0 }
        return [
          { name: `${cat} Strategy`, theme: cat, current: score.current, required: score.current + score.gap, gap: score.gap },
          { name: `${cat} Analytics`, theme: cat, current: Math.max(1, score.current - 0.3), required: score.current + score.gap, gap: score.gap + 0.3 },
          { name: `${cat} Automation`, theme: cat, current: Math.max(1, score.current - 0.5), required: score.current + score.gap, gap: score.gap + 0.5 },
        ]
      }).sort((a, b) => b.gap - a.gap).slice(0, 20)

  autoTable(doc, {
    startY: 38,
    head: [['#', 'Capability', 'Theme', 'Current', 'Required', 'Gap', 'Priority']],
    body: capGaps.map((c, i) => [
      i + 1,
      c.name,
      c.theme,
      c.current.toFixed(1),
      c.required.toFixed(1),
      c.gap.toFixed(1),
      priorityLabel(c.gap),
    ]),
    headStyles: { fillColor: [...EMERALD], textColor: [...WHITE], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.row.index < 5) {
        data.cell.styles.fillColor = [236, 253, 245] // emerald-50
      }
    },
  })

  // ── PAGE 14: FHIR READINESS ASSESSMENT ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, orgName, isDraft)

  doc.setTextColor(...EMERALD)
  doc.setFontSize(18)
  doc.text('FHIR Readiness Assessment', 15, 25)
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text('FHIR R4 resource categories needed based on capability gaps', 15, 33)

  autoTable(doc, {
    startY: 38,
    head: [['FHIR Category', 'Resources Needed', 'Gap', 'Priority']],
    body: FHIR_READINESS.map(d => [d.category, d.resources, d.gap, d.priority]),
    headStyles: { fillColor: [...BLUE], textColor: [...WHITE], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' } },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const val = String(data.cell.raw)
        if (val === 'Critical') data.cell.styles.textColor = [...RED]
        else if (val === 'High') data.cell.styles.textColor = [...AMBER]
        else data.cell.styles.textColor = [...EMERALD]
      }
    },
  })

  // ── PAGE 15: ROADMAP SUMMARY ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, orgName, isDraft)

  doc.setTextColor(...EMERALD)
  doc.setFontSize(18)
  doc.text('Roadmap Summary', 15, 25)

  const phases = [
    { name: 'Phase 1: Quick Wins', months: '1–6', capabilities: 8, investment: 'PKR 40–70M', color: EMERALD },
    { name: 'Phase 2: Core Build', months: '7–18', capabilities: 18, investment: 'PKR 100–200M', color: BLUE },
    { name: 'Phase 3: Advanced', months: '19–36', capabilities: 25, investment: 'PKR 60–180M', color: TEAL },
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

  // Phase details below boxes
  y = 120
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const phaseDetails = [
    ['Phase 1:', 'Master Patient Index, basic clinical reporting, DHIS2 integration, data governance setup'],
    ['Phase 2:', 'FHIR-based HIE, disease surveillance, clinical decision support, population health dashboards'],
    ['Phase 3:', 'AI/ML models, predictive analytics, real-time monitoring, UHC coverage analytics'],
  ]
  phaseDetails.forEach(([label, detail]) => {
    doc.setFontSize(9)
    doc.setTextColor(...EMERALD)
    doc.text(label!, 15, y)
    doc.setTextColor(0, 0, 0)
    doc.text(detail!, 40, y, { maxWidth: w - 55 })
    y += 12
  })

  // ── PAGE 16: BENCHMARK COMPARISON ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, orgName, isDraft)

  doc.setTextColor(...EMERALD)
  doc.setFontSize(18)
  doc.text('Benchmark Comparison', 15, 25)

  autoTable(doc, {
    startY: 35,
    head: [['Category', 'Your Org', 'Pakistan Avg', 'Regional Leaders', 'WHO Targets']],
    body: HACR_CATEGORIES.map(cat => {
      const score = scores.find(s => s.category === cat) || { current: 0 }
      return [
        cat,
        score.current.toFixed(1),
        (bm.pakistanAverage[cat] ?? 1.5).toFixed(1),
        (bm.regionalLeaders[cat] ?? 3.0).toFixed(1),
        (bm.whoTargets[cat] ?? 4.0).toFixed(1),
      ]
    }),
    headStyles: { fillColor: [...EMERALD], textColor: [...WHITE], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
  })

  const regAvg = Object.values(bm.regionalLeaders).reduce((a, b) => a + b, 0) / Object.values(bm.regionalLeaders).length
  const gapToRegional = (regAvg - overallScore).toFixed(1)
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 150
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(
    `Your organization is ${gapToRegional} levels behind regional healthcare leaders. Closing this gap requires an estimated 24–36 months.`,
    15, y + 15, { maxWidth: w - 30 },
  )

  // ── PAGE 17: NEXT STEPS + UHC ALIGNMENT ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, orgName, isDraft)

  doc.setTextColor(...EMERALD)
  doc.setFontSize(18)
  doc.text('Next Steps', 15, 25)

  y = 45
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  const steps = [
    'Present this assessment to your Health Informatics Leadership Committee',
    'Validate findings with clinical, IT, and administrative department heads',
    'Prioritize Phase 1 Quick Win capabilities for immediate impact on patient outcomes',
    'Engage Godaitec for a Deep Dive Workshop to build a detailed implementation plan',
  ]
  steps.forEach((s, i) => {
    doc.setFontSize(11)
    doc.setTextColor(...EMERALD)
    doc.text(`${i + 1}.`, 15, y)
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(s, 25, y, { maxWidth: w - 40 })
    y += 12
  })

  // UHC Alignment section
  y += 10
  doc.setFontSize(14)
  doc.setTextColor(...EMERALD)
  doc.text('Universal Health Coverage (UHC) Alignment', 15, y)
  y += 12
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const uhcItems = [
    'SDG 3.8 — Achieve universal health coverage, including financial risk protection',
    'WHO Digital Health Strategy — Align with global standards for health data exchange',
    'Pakistan UHC Benefit Package — Ensure analytics support essential health services monitoring',
    'Sehat Sahulat Programme — Integrate analytics for social health protection coverage tracking',
  ]
  uhcItems.forEach(item => {
    doc.text(`• ${item}`, 20, y, { maxWidth: w - 40 })
    y += 8
  })

  y += 10
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(15, y, w - 30, 30, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setTextColor(...EMERALD)
  doc.text('Contact Us', w / 2, y + 10, { align: 'center' })
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text('Godaitec | godai.tech | info@godai.tech', w / 2, y + 20, { align: 'center' })

  // ── PAGE 18: METHODOLOGY ──
  doc.addPage()
  page++
  addHeaderFooter(doc, page, totalPages, orgName, isDraft)

  doc.setTextColor(...EMERALD)
  doc.setFontSize(18)
  doc.text('Methodology', 15, 25)

  y = 40
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const methodology = [
    'This assessment uses the Healthcare Capability Framework (HCF) — 108 analytics capabilities across 8 themes',
    'Data model readiness assessed against FHIR R4 resources mapped to HCDM (Healthcare Data Model)',
    'Maturity measured using HACR (Healthcare Analytics Capability Review) — 5-level scale',
    'Benchmarks include Pakistan healthcare averages, regional leaders, and WHO target levels',
  ]
  methodology.forEach(m => { doc.text(`• ${m}`, 15, y, { maxWidth: w - 30 }); y += 8 })

  y += 10
  autoTable(doc, {
    startY: y,
    head: [['Level', 'Label', 'Description']],
    body: [1, 2, 3, 4, 5].map(l => [l, levelLabel(l), levelDescription(l)]),
    headStyles: { fillColor: [...EMERALD], textColor: [...WHITE], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200
  y += 15
  doc.setFontSize(9)
  doc.setTextColor(...EMERALD)
  doc.text('Frameworks Used:', 15, y)
  y += 8
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(8)
  const frameworks = [
    'HCF — Healthcare Capability Framework (108 capabilities across 8 themes)',
    'HACR — Healthcare Analytics Capability Review (5-level maturity assessment)',
    'FHIR — Fast Healthcare Interoperability Resources R4 (HL7 standard)',
    'HCDM — Healthcare Data Model (reference data architecture for healthcare analytics)',
  ]
  frameworks.forEach(f => { doc.text(`• ${f}`, 20, y, { maxWidth: w - 40 }); y += 7 })

  y += 8
  doc.setFillColor(236, 253, 245) // emerald-50
  doc.roundedRect(15, y, w - 30, 25, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setTextColor(...EMERALD)
  doc.text('Ready to transform your healthcare analytics?', w / 2, y + 9, { align: 'center' })
  doc.setFontSize(9)
  doc.setTextColor(...SLATE)
  doc.text('Contact Godaitec for a Deep Dive Workshop — godai.tech', w / 2, y + 17, { align: 'center' })

  y += 30
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text('Disclaimer: Benchmark data based on healthcare industry research and consulting experience.', 15, y)

  // Save
  doc.save(`${orgName.replace(/\s+/g, '_')}_Healthcare_Maturity_Assessment.pdf`)
}

// ══════════════════════════════════════════════════════════
// GAP CSV GENERATOR
// ══════════════════════════════════════════════════════════
export function generateHealthGapCSV(
  answers: HaiwAssessmentAnswer[],
  capabilities: HaiwCapability[],
) {
  const scores = computeCategoryScores(answers)

  // Header
  let csv = 'ID,Name,Theme,Group,Current Score,Target Score,Gap,Priority,FHIR Resources\n'

  if (capabilities.length > 0) {
    // Use real capabilities data — one row per HCF capability
    capabilities.forEach((cap, i) => {
      const catScore = scores.find(s => s.category === cap.theme) || { current: 0, desired: 0, gap: 0 }
      const variation = (cap.id.charCodeAt(cap.id.length - 1) % 10 - 5) * 0.08
      const current = Math.max(1, Math.min(5, catScore.current + variation))
      const target = Math.max(current, catScore.desired)
      const gap = target - current
      const fhirList = cap.fhirResources.join('; ')
      csv += `${i + 1},"${cap.name}","${cap.theme}","${cap.group}",${current.toFixed(1)},${target.toFixed(1)},${gap.toFixed(1)},${priorityLabel(gap)},"${fhirList}"\n`
    })
  } else {
    // Synthesize 108 rows (approximately 13–14 per category) from category scores
    let id = 1
    const capGroups = [
      'Strategy', 'Analytics', 'Reporting', 'Automation', 'Data Integration',
      'Model Development', 'Performance Mgmt', 'Clinical Decision Support',
      'Population Health', 'Surveillance', 'Quality Improvement',
      'Patient Experience', 'Resource Optimization', 'Compliance',
    ]
    HACR_CATEGORIES.forEach(cat => {
      const score = scores.find(s => s.category === cat) || { current: 0, desired: 0, gap: 0 }
      const fhirMap: Record<string, string> = {
        'Strategy & Leadership': 'Organization; HealthcareService',
        'Workforce & Skills': 'Practitioner; PractitionerRole',
        'Data Governance': 'AuditEvent; Provenance; Consent',
        'Infrastructure': 'Endpoint; CapabilityStatement; Bundle',
        'Analytics': 'MeasureReport; Observation; DiagnosticReport',
        'Integration': 'Bundle; MessageHeader; OperationOutcome',
        'Patient Engagement': 'Patient; RelatedPerson; Communication',
        'Outcomes': 'Condition; Procedure; ClinicalImpression',
      }
      // ~13-14 capabilities per category to reach ~108 total
      const count = cat === 'Outcomes' ? 10 : 14
      for (let ci = 0; ci < count && id <= 108; ci++) {
        const group = capGroups[ci % capGroups.length]
        const variation = (ci % 5 - 2) * 0.15
        const current = Math.max(1, Math.min(5, score.current + variation))
        const target = Math.max(current, score.desired)
        const gap = target - current
        const fhir = fhirMap[cat] || 'Patient; Encounter'
        csv += `${id},"${cat} — ${group}","${cat}","${group}",${current.toFixed(1)},${target.toFixed(1)},${gap.toFixed(1)},${priorityLabel(gap)},"${fhir}"\n`
        id++
      }
    })
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, 'HAIW_Capability_Gap_Analysis.csv')
}

// ══════════════════════════════════════════════════════════
// ROADMAP MARKDOWN GENERATOR
// ══════════════════════════════════════════════════════════
export function generateHealthRoadmapMarkdown(
  answers: HaiwAssessmentAnswer[],
  capabilities: HaiwCapability[],
) {
  const scores = computeCategoryScores(answers)
  const overallScore = parseFloat(
    (scores.reduce((sum, s) => sum + s.current, 0) / scores.length).toFixed(1),
  )
  const sortedByGap = [...scores].sort((a, b) => b.gap - a.gap)
  const orgName = 'Organization'

  const md = `# ${orgName} — Healthcare Analytics Transformation Roadmap
## Prepared by Godaitec | ${new Date().toLocaleDateString()}

---

## Slide 1: Title
### ${orgName} Healthcare Analytics Transformation Roadmap
**Current HACR Maturity: ${overallScore} / 5.0 (${levelLabel(overallScore)})**
Prepared by Godaitec (godai.tech)

---

## Slide 2: Current State
### Where We Are Today
${scores.map(s => `- **${s.category}**: ${s.current.toFixed(1)} / 5.0 (${levelLabel(s.current)})`).join('\n')}

**Overall HACR Score: ${overallScore} / 5.0**

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
- Establish health data governance committee
- Deploy Master Patient Index (MPI) across facilities
- Implement basic clinical reporting dashboards
- Integrate with DHIS2 for disease surveillance
- 8 HCF capabilities activated

---

## Slide 6: Phase 2 — Core Build (Months 7–18)
### Investment: PKR 100–200 Million
- FHIR-compliant Health Information Exchange (HIE)
- Clinical decision support systems in production
- Population health analytics platform
- Lab and pharmacy system integration (HL7/FHIR)
- 18 HCF capabilities activated

---

## Slide 7: Phase 3 — Advanced Analytics (Months 19–36)
### Investment: PKR 60–180 Million
- ML models for disease prediction and readmission risk
- Real-time patient monitoring and alerting
- AI-driven treatment pathway optimization
- UHC coverage analytics and outcome tracking
- 25+ HCF capabilities activated

---

## Slide 8: Data Foundation
### FHIR + HCDM Reference Architecture
- **FHIR R4** resources mapped across 10 categories
- Priority resources: Patient, Encounter, Observation, Condition, MedicationRequest
- HCDM subject areas: Clinical, Financial, Operational, Population Health
- Integration: DHIS2, OpenMRS, immunization registries, insurance/payer systems

---

## Slide 9: Investment Summary
### Total: PKR 200–450 Million over 3 Years
| Phase | Duration | Investment | Capabilities |
|-------|----------|------------|-------------|
| Phase 1 | Months 1–6 | PKR 40–70M | 8 |
| Phase 2 | Months 7–18 | PKR 100–200M | 18 |
| Phase 3 | Months 19–36 | PKR 60–180M | 25+ |

---

## Slide 10: ROI & Impact Projection
### Expected Returns
- **Year 1**: Reduced data duplication, improved reporting efficiency (PKR 50–100M savings)
- **Year 2**: Better clinical outcomes, reduced readmissions (PKR 150–300M impact)
- **Year 3**: Predictive capabilities, optimized resource allocation (PKR 300–500M impact)
- **3-Year ROI**: 200–350%
- **Patient Impact**: Improved care quality, reduced wait times, better health outcomes

---

## Slide 11: UHC Alignment & WHO Indicators
### Contributing to Universal Health Coverage
- SDG 3.8 — Universal health coverage monitoring through analytics
- WHO SCORE assessment — Strengthening country health information systems
- Sehat Sahulat Programme — Claims analytics and coverage tracking
- National Health Vision 2025 — Evidence-based policy and planning

---

## Slide 12: Contact
### Let's Build Your Healthcare Analytics Future

**Godaitec**
Website: godai.tech
Email: info@godai.tech

*This roadmap was generated using HAIW — Healthcare Analytics Intelligence Workbench*
`

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, `${orgName.replace(/\s+/g, '_')}_Healthcare_Analytics_Roadmap.md`)
}
