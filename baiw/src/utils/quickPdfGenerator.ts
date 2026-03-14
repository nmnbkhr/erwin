import jsPDF from 'jspdf'

interface RadarItem {
  category: string
  fullName: string
  current: number
}

const PURPLE = [124, 58, 237] as const   // #7c3aed
const TEAL = [13, 148, 136] as const     // #0d9488
const GREEN = [16, 185, 129] as const
const RED = [220, 38, 38] as const
const SLATE = [100, 116, 139] as const
const WHITE = [255, 255, 255] as const

type RGB = readonly [number, number, number]

function levelLabel(score: number): string {
  const labels: Record<number, string> = {
    1: 'Initial', 2: 'Developing', 3: 'Defined', 4: 'Managed', 5: 'Optimizing'
  }
  return labels[Math.round(score)] || 'Not Assessed'
}

function drawRadarChart(doc: jsPDF, data: RadarItem[], centerX: number, centerY: number, radius: number, color: RGB) {
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
    doc.text(data[i].fullName, x, y, { align: 'center' })
  }

  // Draw scores
  doc.setDrawColor(...color)
  doc.setLineWidth(1.5)
  const points: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep
    const r = (data[i].current / 5) * radius
    points.push([centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)])
  }
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    doc.line(points[i][0], points[i][1], points[next][0], points[next][1])
  }

  doc.setLineDashPattern([], 0)
}

export function generateQuickPDF(radarData: RadarItem[], overallScore: number, orgName: string, variant: 'banking' | 'trade') {
  const doc = new jsPDF('p', 'mm', 'a4')
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  const isTrade = variant === 'trade'
  const color: RGB = isTrade ? [...TEAL] : [...PURPLE]
  const moduleName = isTrade ? 'TAIW' : 'BAIW'
  const subtitle = isTrade ? 'Trade Analytics Quick Maturity Scan' : 'Analytics Quick Maturity Scan'

  const sorted = [...radarData].filter(r => r.current > 0).sort((a, b) => b.current - a.current)
  const strengths = sorted.slice(0, 3)
  const gaps = [...sorted].reverse().slice(0, 3)
  const gapCount = sorted.filter(s => s.current < 3).length

  // ── PAGE 1: COVER + RADAR ──
  doc.setFillColor(...color)
  doc.rect(0, 0, w, 70, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(24)
  doc.text(orgName, w / 2, 25, { align: 'center' })
  doc.setFontSize(14)
  doc.text(subtitle, w / 2, 38, { align: 'center' })
  doc.setFontSize(9)
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), w / 2, 50, { align: 'center' })
  doc.text(`Powered by ${moduleName} | Prepared by Godaitec (godai.tech)`, w / 2, 60, { align: 'center' })

  // Score circle
  doc.setFillColor(...WHITE)
  doc.circle(w / 2, 95, 22, 'F')
  doc.setTextColor(...color)
  doc.setFontSize(30)
  doc.text(`${overallScore}`, w / 2, 98, { align: 'center' })
  doc.setFontSize(10)
  doc.text('/ 5.0', w / 2, 108, { align: 'center' })
  doc.setFontSize(12)
  doc.setTextColor(...SLATE)
  doc.text(levelLabel(overallScore), w / 2, 125, { align: 'center' })

  // Radar chart
  drawRadarChart(doc, radarData, w / 2, 195, 55, color)

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text('Page 1 of 3', w - 15, h - 8, { align: 'right' })
  doc.text('Prepared by Godaitec | godai.tech', 15, h - 8)

  // ── PAGE 2: STRENGTHS & GAPS ──
  doc.addPage()

  // Header
  doc.setDrawColor(...color)
  doc.setLineWidth(0.5)
  doc.line(15, 12, w - 15, 12)
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text(`${orgName} — Quick ${isTrade ? 'Trade ' : ''}Maturity Scan`, 15, 10)
  doc.text(`Powered by ${moduleName}`, w - 15, 10, { align: 'right' })

  doc.setTextColor(...color)
  doc.setFontSize(18)
  doc.text('Strengths & Gaps', 15, 30)

  // Top Strengths
  let y = 45
  doc.setFontSize(13)
  doc.setTextColor(...GREEN)
  doc.text('Your Top 3 Strengths', 15, y)
  y += 10
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  strengths.forEach((s, i) => {
    doc.setFillColor(240, 253, 244)
    doc.roundedRect(15, y - 4, w - 30, 14, 2, 2, 'F')
    doc.text(`${i + 1}. ${s.fullName}`, 20, y + 3)
    doc.setTextColor(...GREEN)
    doc.text(`${s.current} / 5.0 — ${levelLabel(s.current)}`, w - 20, y + 3, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    y += 18
  })

  // Top Gaps
  y += 8
  doc.setFontSize(13)
  doc.setTextColor(...RED)
  doc.text('Your Top 3 Gaps', 15, y)
  y += 10
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  gaps.forEach((g, i) => {
    doc.setFillColor(254, 242, 242)
    doc.roundedRect(15, y - 4, w - 30, 14, 2, 2, 'F')
    doc.text(`${i + 1}. ${g.fullName}`, 20, y + 3)
    doc.setTextColor(...RED)
    doc.text(`${g.current} / 5.0 — ${levelLabel(g.current)}`, w - 20, y + 3, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    y += 18
  })

  // Key Finding
  y += 10
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(15, y - 4, w - 30, 30, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setTextColor(...color)
  doc.text('Key Finding', 20, y + 4)
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const finding = overallScore < 2
    ? `${orgName} is at the ${levelLabel(overallScore)} stage with ${gapCount} categories needing immediate attention. Structured investment in analytics capabilities can drive significant improvement.`
    : overallScore < 3
    ? `${orgName} is progressing but ${gapCount} categories remain below the Defined level. Focusing on ${gaps[0]?.fullName || 'key gaps'} will yield the highest impact.`
    : `${orgName} has a solid foundation. Focus on advancing ${gaps[0]?.fullName || 'remaining gaps'} to reach regional leader benchmarks.`
  doc.text(doc.splitTextToSize(finding, w - 50), 20, y + 14)

  // Category scores table
  y += 40
  doc.setFontSize(13)
  doc.setTextColor(...color)
  doc.text('All Category Scores', 15, y)
  y += 8
  doc.setFontSize(8)
  sorted.forEach(s => {
    const barWidth = (s.current / 5) * 100
    doc.setTextColor(0, 0, 0)
    doc.text(s.fullName, 15, y + 3)
    doc.setFillColor(230, 230, 230)
    doc.roundedRect(75, y - 1, 100, 6, 1, 1, 'F')
    doc.setFillColor(...color)
    doc.roundedRect(75, y - 1, barWidth, 6, 1, 1, 'F')
    doc.text(`${s.current}`, 180, y + 3)
    y += 9
  })

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.line(15, h - 12, w - 15, h - 12)
  doc.text('Prepared by Godaitec | godai.tech', 15, h - 8)
  doc.text('Page 2 of 3', w - 15, h - 8, { align: 'right' })

  // ── PAGE 3: NEXT STEPS ──
  doc.addPage()

  // Header
  doc.setDrawColor(...color)
  doc.setLineWidth(0.5)
  doc.line(15, 12, w - 15, 12)
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text(`${orgName} — Quick ${isTrade ? 'Trade ' : ''}Maturity Scan`, 15, 10)
  doc.text(`Powered by ${moduleName}`, w - 15, 10, { align: 'right' })

  doc.setTextColor(...color)
  doc.setFontSize(18)
  doc.text('Next Steps', 15, 30)

  y = 48
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`This Quick Scan identified ${gapCount} area${gapCount !== 1 ? 's' : ''} for improvement.`, 15, y)

  y += 15
  doc.setFontSize(10)
  doc.text('For a detailed roadmap with specific capability recommendations and investment estimates:', 15, y)

  // Option 1
  y += 18
  doc.setFillColor(240, 249, 255)
  doc.roundedRect(15, y - 4, w - 30, 35, 3, 3, 'F')
  doc.setFontSize(12)
  doc.setTextColor(...color)
  doc.text('Option 1: Standard Assessment', 20, y + 6)
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const stdDesc = isTrade
    ? '640+ questions covering all 8 TACR categories. Generates an 18-page PDF report with WCO DM conformity assessment, TCF capability gaps, benchmarks, and 3-phase roadmap.'
    : '793 questions covering all 9 BACR categories. Generates an 18-page PDF report with BVF capability gaps, FSDM readiness, benchmarks, and 3-phase roadmap.'
  doc.text(doc.splitTextToSize(stdDesc, w - 50), 20, y + 16)

  // Option 2
  y += 45
  doc.setFillColor(245, 243, 255)
  doc.roundedRect(15, y - 4, w - 30, 35, 3, 3, 'F')
  doc.setFontSize(12)
  doc.setTextColor(...color)
  doc.text('Option 2: Deep Dive Workshop', 20, y + 6)
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text(doc.splitTextToSize('Half-day facilitated workshop with your leadership team. Produces a detailed implementation plan with PKR investment estimates, vendor recommendations, and quick-win identification.', w - 50), 20, y + 16)

  // Contact box
  y += 55
  doc.setFillColor(...color)
  doc.roundedRect(15, y - 4, w - 30, 40, 3, 3, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(14)
  doc.text('Ready to Go Deeper?', w / 2, y + 8, { align: 'center' })
  doc.setFontSize(10)
  doc.text('Contact Godaitec for your personalized analytics roadmap', w / 2, y + 18, { align: 'center' })
  doc.setFontSize(9)
  doc.text('godai.tech | info@godai.tech', w / 2, y + 28, { align: 'center' })

  // Disclaimer
  y += 50
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text('This Quick Scan provides a directional assessment. For detailed capability-level analysis, take the Standard Assessment.', 15, y)

  // Footer
  doc.line(15, h - 12, w - 15, h - 12)
  doc.text('Prepared by Godaitec | godai.tech', 15, h - 8)
  doc.text('Page 3 of 3', w - 15, h - 8, { align: 'right' })

  // Save
  const prefix = isTrade ? 'Trade_' : ''
  doc.save(`${orgName.replace(/\s+/g, '_')}_${prefix}Quick_Maturity_Scan.pdf`)
}
