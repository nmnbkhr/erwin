// jsPDF stays as a TYPE, for drawRadarChart's `doc` parameter — the chart is
// drawn through the spine's escape hatch. `jspdf-autotable` is gone entirely:
// all five tables now go through ReportDoc.table(), which is where the
// `lastAutoTable.finalY` cast and the 15mm margin live.
import type jsPDF from 'jspdf'
import { saveAs } from 'file-saver'

import { createReport, contentKey, saveReport, MARGIN, FOOTER_RESERVE } from '../../report/spine'
import { formatCoverDate, reportFilename } from '../../report/naming'
import { downloadCsv, byStringKey, type CsvColumn } from '../../report/csv'
import type { ReportMeta } from '../../report/types'
import {
  aggregate, scoreCategories, overallCurrent, coverageStatement, scoreLabel,
  type Applicable, type Aggregate, type CategoryOutcome,
} from '../../scoring/maturity'
import type { HaiwCapability, HaiwAssessmentAnswer, HacrQuestion } from '../types'

/*
 * Artefact ids for all three deliverables.
 *
 * `MR-`, not `AR-`: these are declared in MODULE_ARTEFACT_IDS in
 * scripts/check-dgiw.mjs, not in DGIW's implementationPlan.json artefactRegister,
 * because HAIW has no artefact register to be a catalogue entry of. They drive the
 * filename and the trailer /ID seed and are deliberately NOT printed on the cover
 * — `useReportMeta` sets `coverTag: ''` for exactly that reason.
 *
 * `MR-HAIW-GAP` keeps `-GAP` where BAIW's and TAIW's became `-REGISTER`. That
 * asymmetry is load-bearing, not an oversight: since D-003 this file's gap column
 * is computed from real `capabilityLinks` on all 720 HACR questions, so the word
 * is TRUE here and false there. It records which module has the relation
 * authored. Do not "fix" it. See CLAUDE.md, "A capability score needs a link, not
 * a heading".
 */
export const HEALTH_MATURITY_ARTEFACT_ID = 'MR-HAIW-MATURITY'
export const HEALTH_ROADMAP_ARTEFACT_ID = 'MR-HAIW-ROADMAP'
export const HEALTH_GAP_ARTEFACT_ID = 'MR-HAIW-GAP'

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
  'Data Governance & Standards',
  'Infrastructure & Systems',
  'Analytics & Intelligence',
  'Integration & Interoperability',
  'Patient & Community Engagement',
  'Outcomes & Impact',
]

// Question ids look like "HACR-SL-001" — the middle code selects the category.
const CODE_TO_CATEGORY: Record<string, string> = {
  SL: 'Strategy & Leadership',
  WS: 'Workforce & Skills',
  DG: 'Data Governance & Standards',
  IS: 'Infrastructure & Systems',
  AI: 'Analytics & Intelligence',
  II: 'Integration & Interoperability',
  PC: 'Patient & Community Engagement',
  OI: 'Outcomes & Impact',
}

/*
 * `THEME_TO_CATEGORY` used to live here: a six-entry bridge from HCF theme to
 * HACR category, so a capability could borrow its category's score.
 *
 * It is gone because capability scores are now computed from the questions that
 * actually assess each capability — see `scoreCapabilities` below. The bridge was
 * only ever a stand-in, and a poor one: its six themes collapsed onto five
 * distinct categories, so 108 capabilities could carry at most five distinct
 * gaps, and three HACR categories (Strategy & Leadership, Workforce & Skills,
 * Integration & Interoperability) were the target of no theme at all and could
 * therefore never influence a capability number however the client answered them.
 */

/**
 * The question fields the scoring reads, and only those.
 *
 * `Pick` rather than a hand-written interface so a rename in types.ts breaks this
 * file rather than silently producing `undefined` weights. Narrow rather than the
 * whole `HacrQuestion` because the caller passes 720 of them and the generator
 * has no business seeing `levelDescriptions` — and because the golden fixture then
 * freezes 45 kB of exactly what is read instead of 1.1 MB of mostly prose.
 */
export type HacrQuestionLink = Pick<HacrQuestion, 'id' | 'weight' | 'capabilityLinks'>

const EMERALD = [16, 185, 129] as const    // #10B981
const TEAL = [20, 184, 166] as const       // #14B8A6
const BLUE = [37, 99, 235] as const        // #2563EB
const AMBER = [217, 119, 6] as const       // #D97706
const RED = [220, 38, 38] as const         // #DC2626
const SLATE = [100, 116, 139] as const     // #64748B
const WHITE = [255, 255, 255] as const

type RGB = readonly [number, number, number]

// ── Default benchmarks (used when none provided) ──
const DEFAULT_BENCHMARKS: HealthBenchmarks = {
  pakistanAverage: {
    'Strategy & Leadership': 1.6,
    'Workforce & Skills': 1.4,
    'Data Governance & Standards': 1.3,
    'Infrastructure & Systems': 1.7,
    'Analytics & Intelligence': 1.2,
    'Integration & Interoperability': 1.5,
    'Patient & Community Engagement': 1.8,
    'Outcomes & Impact': 1.3,
  },
  regionalLeaders: {
    'Strategy & Leadership': 3.4,
    'Workforce & Skills': 3.1,
    'Data Governance & Standards': 3.0,
    'Infrastructure & Systems': 3.5,
    'Analytics & Intelligence': 2.9,
    'Integration & Interoperability': 3.2,
    'Patient & Community Engagement': 3.3,
    'Outcomes & Impact': 3.0,
  },
  whoTargets: {
    'Strategy & Leadership': 4.0,
    'Workforce & Skills': 4.0,
    'Data Governance & Standards': 4.5,
    'Infrastructure & Systems': 4.0,
    'Analytics & Intelligence': 4.0,
    'Integration & Interoperability': 4.5,
    'Patient & Community Engagement': 4.5,
    'Outcomes & Impact': 4.5,
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

// ── The one scoring primitive ─────────────────────────────────────────────

/**
 * The suite's three states, and the weighted aggregate behind them, now live in
 * `src/scoring/maturity.ts` — one implementation for TAIW and HAIW rather than
 * four. `round1` went with `aggregate()`, which was its only caller.
 *
 * `ScoreState` is re-exported because it was already part of this module's public
 * surface. See that file's header for what the four implementations were, and for
 * the 1.5 versus 3.0 they printed for the same client on the same day.
 */
export type { ScoreState } from '../../scoring/maturity'

// ── Compute category scores from answers ──
/**
 * EQUAL WEIGHTS HERE, WEIGHTED FOR CAPABILITIES, AND THAT IS A DELIBERATE SPLIT.
 *
 * This function has always taken a plain arithmetic mean, and so does the on-screen
 * scorecard in `HealthMaturityAssessment.tsx` — which now calls this same code
 * rather than its own copy of it. Switching to weighted moves the fixture's every
 * category from desired 4.3 to 4.4 and every gap from 1.3 to 1.4, which would
 * change the cover score, the radar, the scorecard, all eight deep dives, the
 * benchmark page and the markdown. Making the whole module weighted is a content
 * decision for its own change, with its own walk.
 *
 * So it stays a mean, and it says so by passing `weight: 1` through the same
 * `aggregate()` the capability scoring uses. One primitive, one place, the
 * weighting choice visible as an argument instead of as two code paths that could
 * drift.
 *
 * THE QUESTION UNIVERSE IS THE INPUT, NOT THE ANSWER SET. This used to bucket
 * `answers`, so a category nobody had answered produced an EMPTY entry list and
 * `aggregate()` called it `not-applicable` — "this category does not exist under
 * this scope" — when the truth was `not-assessed`, "nobody has answered it yet".
 * Those are the two states CLAUDE.md says must never collapse into each other,
 * collapsed inside the function written to keep them apart. Bucketing the
 * questions and attaching answers to them distinguishes the two, and makes
 * `not-applicable` mean what it means everywhere else in the suite: HACR declares
 * no question carrying that category's code at all.
 */
function computeCategoryOutcomes(
  answers: HaiwAssessmentAnswer[],
  questions: readonly HacrQuestionLink[],
): CategoryOutcome[] {
  const answerById = new Map(answers.map(a => [a.questionId, a]))
  const byCategory = new Map<string, Applicable[]>()
  HACR_CATEGORIES.forEach(cat => byCategory.set(cat, []))

  questions.forEach(q => {
    // questionId format: "HACR-SL-001" — the letter code selects the category.
    // HACR-CATEGORY-MAP asserts this agrees with the question's own `category`
    // field for all 720, which is what makes this partition and the assessment
    // screen's produce the same buckets.
    const cat = CODE_TO_CATEGORY[q.id.split('-')[1]]
    if (cat && byCategory.has(cat)) byCategory.get(cat)!.push({ weight: 1, answer: answerById.get(q.id) })
  })

  return scoreCategories(HACR_CATEGORIES.map(cat => ({ name: cat, entries: byCategory.get(cat)! })))
}

/**
 * The flat `{ current, desired, gap }` rows the radar, the scorecard and the deep
 * dives draw. Confined to the drawing code: an unscored category reaches this as
 * 0, which is the zero-as-unknown CLAUDE.md warns about, and every caller that
 * needs to tell 0 from unmeasured reads `CategoryOutcome.agg.state` instead. The
 * coverage statement printed alongside them is what makes the difference legible
 * on the page.
 */
function flatten(outcomes: readonly CategoryOutcome[]): CategoryScore[] {
  return outcomes.map(o => ({
    category: o.name,
    current: o.agg.current ?? 0,
    desired: o.agg.desired ?? 0,
    gap: o.agg.gap ?? 0,
  }))
}

/*
 * `addHeaderFooter` used to live here: a per-page header rule, header text,
 * footer rule, footer text and watermark, called by hand on all seventeen content
 * pages with a hardcoded `totalPages = 18`. All of it is now `spine.ts` —
 * `page()` paints the chrome and `build()` stamps the footers last, over the REAL
 * page count, so an autoTable overflow page can no longer be footed "Page 19 of
 * 18" or left bare.
 */

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
  //
  // The labels used to be one unwrapped `doc.text(..., { align: 'center' })` per
  // axis, and the two horizontal ones — "Data Governance & Standards" at 0° and
  // "Patient & Community Engagement" at 180° — ran 16.17 pt past the 15 mm
  // margin. Same class of defect as D-002 in docs/known-defects.md, just on paper
  // rather than off it.
  //
  // Wrapping to the content width would not fix it: a label centred at x has only
  // `min(x - MARGIN, pageWidth - MARGIN - x)` on its NARROW side before it hits a
  // margin, so the usable width is twice that half, not the page. The six labels
  // with room to spare are unaffected; the two at the horizontal extremes fold.
  const pageWidth = doc.internal.pageSize.getWidth()
  const labelLine = 3.5 // mm, the 7pt leading the rest of this chart reads at
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep
    const x = centerX + (radius + 14) * Math.cos(angle)
    const y = centerY + (radius + 14) * Math.sin(angle)
    doc.line(centerX, centerY, centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
    const half = Math.max(1, Math.min(x - MARGIN, pageWidth - MARGIN - x))
    const lines = doc.splitTextToSize(data[i].category, 2 * half) as string[]
    // Centred on the anchor rather than hung below it, so a label that folds
    // stays where the unwrapped one sat instead of drifting toward the chart.
    const top = y - ((lines.length - 1) * labelLine) / 2
    lines.forEach((line, li) => doc.text(line, x, top + li * labelLine, { align: 'center' }))
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

/** How many rows page 13 shows. */
const TOP_CAPABILITY_GAPS = 20

/** What page 13 and the CSV need to name a capability. */
interface CapabilityIdentity {
  id: string
  name: string
  theme: string
  group: string
  fhirResources: string[]
}

/**
 * One capability, scored from the questions that assess it.
 *
 * An intersection with `Aggregate` rather than a flattened copy, so `current` and
 * `gap` stay unreachable until `state === 'scored'` has been checked. A flattened
 * `current: number | null` would compile the same and narrow nowhere.
 */
type CapabilityScore = CapabilityIdentity & Aggregate

/** One row of the page-13 matrix. Only scored capabilities reach it. */
interface CapabilityGap {
  id: string
  name: string
  theme: string
  current: number
  required: number
  gap: number
}

/** Page 13's rows plus the census its caption has to print. */
interface CapabilityGapReport {
  rows: CapabilityGap[]
  scored: number
  notAssessed: number
  notApplicable: number
  total: number
  /**
   * False when `capabilities.json` never arrived — a load failure, not an empty
   * assessment. The two produce the same zero rows and mean opposite things, so
   * the caption has to tell them apart. See D-008.
   */
  datasetAvailable: boolean
}

/**
 * Score every capability from the HACR questions that link to it.
 *
 * THE ONE PER-CAPABILITY SCORING PATH. Page 13 and the gap CSV both consume this,
 * so the PDF cannot disagree with the spreadsheet a client opens beside it — they
 * did disagree before, in different ways and for different reasons.
 *
 * D-003, and why the first fix for it was not enough:
 *
 *  - Originally `scores.find(s => s.category === cap.theme)` matched a HACR
 *    category against an HCF theme. Disjoint vocabularies, so it never matched,
 *    every capability took the `{ current: 0, gap: 0 }` fallback, and page 13
 *    printed twenty rows at 1.0 / 1.0 / gap 0.0 / Low under the heading "largest
 *    estimated gaps" — whatever the client had answered.
 *  - Bridging theme to category through a lookup made the number move with the
 *    assessment, and was still a category number wearing a capability's name: at
 *    most five distinct gaps across 108 capabilities, and three of the eight HACR
 *    categories structurally unable to affect the page.
 *
 * Neither was necessary. The link exists in the dataset: every one of the 720
 * HACR questions carries `capabilityLinks`, all 108 capabilities are linked, and
 * each has six or seven questions assessing it. The score below is the
 * weight-weighted mean of the ANSWERED ones — the honest number, not a proxy for
 * it. There is no authoring gap to work around, which is what separates HAIW from
 * BAIW and TAIW: no such link exists there, so D-001 was closed for those two by
 * REMOVING the per-capability columns rather than deriving them. Same defect
 * class, opposite remedies, and the data decided which — see CLAUDE.md, "A
 * capability score needs a link, not a heading".
 */
function scoreCapabilities(
  capabilities: HaiwCapability[],
  questions: readonly HacrQuestionLink[],
  answers: HaiwAssessmentAnswer[],
): CapabilityScore[] {
  const answerById = new Map(answers.map(a => [a.questionId, a]))
  const applicable = new Map<string, Applicable[]>()
  for (const cap of capabilities) applicable.set(cap.id, [])
  for (const q of questions) {
    for (const capId of q.capabilityLinks) {
      // A link to an id outside the capability set is dropped rather than
      // inventing a row for it: the dataset is the authority on what exists.
      applicable.get(capId)?.push({ weight: q.weight, answer: answerById.get(q.id) })
    }
  }
  return capabilities.map(cap => ({
    id: cap.id, name: cap.name, theme: cap.theme, group: cap.group,
    fhirResources: cap.fhirResources,
    ...aggregate(applicable.get(cap.id)!),
  }))
}

/**
 * The widest capability gaps, with the census page 13's caption must state.
 *
 * Hoisted out of the page-13 block because `createReport`'s content digest needs
 * it before the first page is drawn — the /ID has to cover what the document
 * renders, and which capabilities made the cut is part of that.
 *
 * NOT-ASSESSED AND NOT-APPLICABLE CAPABILITIES ARE EXCLUDED FROM THE RANKING, not
 * ranked at the bottom. A capability nobody has answered has no gap; giving it
 * 0.0 and letting it sort is exactly how D-003 looked from the outside, and it
 * would put "we have no idea about this" at the polite end of a page headed
 * "largest gaps". They are counted and printed in the caption instead.
 *
 * The tiebreak is declared rather than incidental. Real gaps cluster — eleven
 * distinct values across 108 capabilities on the golden fixture — so a sort on
 * gap alone would leave the twentieth row to `Array.prototype.sort`'s stability
 * over dataset order. Ascending id after descending gap makes the list a function
 * of the answers and nothing else, which the byte-reproducibility of this report
 * depends on.
 */
function buildCapabilityGaps(
  capabilities: HaiwCapability[],
  questions: readonly HacrQuestionLink[],
  answers: HaiwAssessmentAnswer[],
): CapabilityGapReport {
  /*
   * D-008: NO CAPABILITY DATASET MEANS NO ROWS. It does not mean invent some.
   *
   * This used to synthesise 24 rows — three per HACR category, named
   * `${cat} Strategy` / `Analytics` / `Automation`, carrying the category score
   * offset by 0, -0.3 and -0.5 — and then report them as
   * `scored: 24, notAssessed: 0, notApplicable: 0`. Two lies in one branch: rows
   * that are not capabilities, and a census claiming every one of them was
   * measured.
   *
   * It ran only when `loadCapabilities()` rejected, which nothing does today, so
   * it was dead code that fabricated. That is the worst combination available:
   * never exercised, never reviewed, and reached exactly when a client's data is
   * missing — the moment they are least able to tell.
   *
   * The empty report below is the honest answer, and `datasetAvailable` carries
   * WHY it is empty so the caption does not blame the assessment for a fetch.
   */
  if (capabilities.length === 0) {
    return { rows: [], scored: 0, notAssessed: 0, notApplicable: 0, total: 0, datasetAvailable: false }
  }

  const scored = scoreCapabilities(capabilities, questions, answers)
  const rows = scored
    .flatMap(c => (c.state === 'scored'
      ? [{ id: c.id, name: c.name, theme: c.theme, current: c.current, required: c.desired, gap: c.gap }]
      : []))
    .sort((a, b) => b.gap - a.gap || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return {
    rows: rows.slice(0, TOP_CAPABILITY_GAPS),
    scored: scored.filter(c => c.state === 'scored').length,
    notAssessed: scored.filter(c => c.state === 'not-assessed').length,
    notApplicable: scored.filter(c => c.state === 'not-applicable').length,
    total: capabilities.length,
    datasetAvailable: true,
  }
}

// ══════════════════════════════════════════════════════════
// MAIN PDF GENERATOR
// ══════════════════════════════════════════════════════════
/**
 * The eighteen-page maturity assessment, on src/report/spine.ts.
 *
 * The trailing `orgName: string` is now `meta: ReportMeta` — same arity, same
 * position. Not an addition alongside it: the client's name would then have had
 * two sources, which is the defect the engagement work exists to remove.
 *
 * Everything the spine does here the old code did by hand and slightly wrong: a
 * hardcoded `totalPages = 18` in every footer, per-page header chrome pasted
 * seventeen times, `new Date().toLocaleDateString()` on the cover (neither
 * machine- nor timezone-stable), and no wrapping on hand-placed text. What is
 * still drawn through the `doc` escape hatch is the per-module material the spine
 * deliberately has no opinion about — the score disc, the radar, the deep-dive
 * header bars and the phase boxes. Each of those owns its overflow and calls
 * `moveTo()` to hand the cursor back.
 */
export function generateHealthMaturityPDF(
  answers: HaiwAssessmentAnswer[],
  capabilities: HaiwCapability[],
  /*
   * The HACR question bank, for `capabilityLinks` and `weight`.
   *
   * Passed rather than imported. `hacrQuestions.json` is 1.18 MB and the app
   * already loads it lazily in `HealthMaturityAssessment`, which is the component
   * that renders the export button — a static import here would pull it into the
   * report chunk a second time for data the caller is already holding. Narrowed
   * to `HacrQuestionLink` so the contract is the three fields actually read.
   *
   * An empty array is legal and degrades honestly: every capability then has no
   * applicable questions, comes back `not-applicable`, and page 13 says so
   * instead of inventing scores.
   */
  questions: readonly HacrQuestionLink[],
  benchmarks: Partial<HealthBenchmarks> | undefined,
  meta: ReportMeta,
) {
  const bm: HealthBenchmarks = {
    pakistanAverage: { ...DEFAULT_BENCHMARKS.pakistanAverage, ...benchmarks?.pakistanAverage },
    regionalLeaders: { ...DEFAULT_BENCHMARKS.regionalLeaders, ...benchmarks?.regionalLeaders },
    whoTargets: { ...DEFAULT_BENCHMARKS.whoTargets, ...benchmarks?.whoTargets },
  }

  const outcomes = computeCategoryOutcomes(answers, questions)
  const scores = flatten(outcomes)
  /*
   * ÷ SCORED, not ÷ 8.
   *
   * This divided by `scores.length` — every HACR category, including the ones
   * nobody had answered, each contributing a 0. Four of eight categories answered
   * at 3.0 printed **1.5** on the cover while the assessment screen, which
   * divided by the scored count, printed **3.0** for the same client on the same
   * day. Neither fixture could see it: both answer every question, and at 8-of-8
   * the two rules coincide.
   *
   * `null` when nothing is scored, and the caller decides what to print. The old
   * expression returned 0, which reads as "assessed, and terrible".
   */
  const overall = overallCurrent(outcomes)
  const overallScore = overall ?? 0
  /*
   * The denominator, printed. A cover score of 3.0 from four of eight categories
   * is not the same claim as 3.0 from eight, and the number alone cannot tell
   * them apart — fixing the arithmetic without printing the coverage would leave
   * a reader unable to distinguish a complete assessment from a half-finished
   * one. DGIW prints its scored count for exactly this reason.
   */
  const coverage = coverageStatement(outcomes)
  const answeredCategories = outcomes.filter(o => o.agg.state === 'scored').length
  const totalCategories = HACR_CATEGORIES.length

  const sortedByGap = [...scores].sort((a, b) => b.gap - a.gap)
  // No `scores` argument since D-008: the only thing that read the category
  // scores here was the synthesis, and it is gone. Capability scoring goes
  // through capabilityLinks or it does not happen.
  const capGaps = buildCapabilityGaps(capabilities, questions, answers)

  /*
   * Draft state stays derived HERE rather than being taken from meta.
   *
   * It is a fact about the answers — how many HACR categories carry any response
   * — and the page that renders the export buttons counts categories a different
   * way (`categoryProgress.filter(c => c.touched)`, over the dataset's category
   * list rather than HACR_CATEGORIES). Moving the derivation to the call site
   * would have been a behaviour change smuggled into a migration whose entire
   * value is that nothing else moved. A caller that sets isDraft still wins.
   */
  const reportMeta: ReportMeta = {
    ...meta,
    isDraft: meta.isDraft || answeredCategories < totalCategories,
  }

  const r = createReport(
    reportMeta,
    contentKey([
      ...answers.map(a => `ans:${a.questionId}=${a.currentState}/${a.desiredState}`),
      // The ranked ids AND their numbers. Ids alone were enough while every row
      // printed 1.0/1.0/0.0; now that the figures move with the answers, two
      // reports could select the same twenty capabilities and score them
      // differently, and /ID is the field a DMS uses to tell them apart.
      ...capGaps.rows.map(c => `cap:${c.id}=${c.current}/${c.required}`),
      `capcensus:${capGaps.scored}/${capGaps.notAssessed}/${capGaps.notApplicable}/${capGaps.total}`,
    ]),
  )
  const { doc } = r
  const w = r.pageWidth

  // ── PAGE 1: COVER ──
  r.cover('Healthcare Analytics Maturity Assessment', 'HACR — Healthcare Analytics Capability Review')

  // Score disc. Per-module, so it goes through the escape hatch; the spine's
  // cover leaves the cursor below the banner and this reclaims it afterwards.
  doc.setFillColor(...WHITE)
  doc.circle(w / 2, 140, 30, 'F')
  doc.setTextColor(...EMERALD)
  doc.setFontSize(36)
  doc.text(`${overallScore}`, w / 2, 143, { align: 'center' })
  doc.setFontSize(12)
  doc.text('/ 5.0', w / 2, 155, { align: 'center' })
  doc.setFontSize(14)
  doc.text(levelLabel(overallScore), w / 2, 180, { align: 'center' })
  r.moveTo(190)

  // ── PAGE 2: EXECUTIVE SUMMARY ──
  r.page('Executive Summary')
  r.text(`Overall HACR Score: ${overallScore} / 5.0`, { size: 12, gapAfter: 4 })
  r.text(`Level: ${levelLabel(overallScore)} — ${levelDescription(overallScore)}`, { size: 10, gapAfter: 4 })
  // The denominator behind the number above. See `coverage` at the top of this
  // function for why it is on the page rather than only in the arithmetic.
  r.text(coverage, { size: 9, gapAfter: 8 })

  r.sectionHeading('Key Findings')
  // Numbered rather than bulleted, exactly as before — `bullets()` would have
  // rendered "• 1. …".
  sortedByGap.slice(0, 3).forEach((f, i) => {
    const pkScore = bm.pakistanAverage[f.category] ?? 1.5
    r.text(
      `${i + 1}. ${f.category} maturity (${f.current}) is ${f.current < pkScore ? 'below' : 'at/above'} Pakistan average (${pkScore}). Gap to target: ${f.gap}`,
      { size: 9, indent: 5, gapAfter: 4 },
    )
  })

  r.spacer(4)
  r.sectionHeading('Priority Recommendations')
  const recommendations = [
    `1. Establish a Chief Health Informatics Officer and data governance framework (closes ${sortedByGap[0]?.gap || 0}-level gap in ${sortedByGap[0]?.category || 'Data Governance'})`,
    `2. Deploy FHIR-compliant health information exchange using HCDM as reference architecture`,
    `3. Build predictive analytics capability starting with disease surveillance and patient outcomes`,
  ]
  for (const rec of recommendations) r.text(rec, { size: 9, indent: 5, gapAfter: 4 })

  r.spacer(4)
  r.text('Estimated total investment: PKR 200–450 million over 3 years', { size: 10 })

  // ── PAGE 3: MATURITY RADAR ──
  r.page('Maturity Radar — HACR Categories')
  {
    // The radar bypasses the cursor, so it sizes itself against the real content
    // box: the spine's own footer band rather than a 20 repeated in three
    // generators, and the cursor rather than a hardcoded centre of 135.
    const top = r.cursorY
    const floor = r.pageHeight - FOOTER_RESERVE
    const radius = 65
    const labelRing = 14   // how far the axis labels sit outside the rings
    const legendDrop = 25  // drawRadarChart puts its legend at centerY + radius + 25
    const centerY = Math.min(top + labelRing + radius, floor - legendDrop - radius)
    drawRadarChart(doc, scores, w / 2, centerY, radius, bm.pakistanAverage)
    r.moveTo(centerY + radius + legendDrop + 6)
  }

  // ── PAGE 4: CATEGORY SCORECARD ──
  r.page('Category Scorecard')
  r.table({
    head: ['Category', 'Current', 'Target', 'Gap', 'Level', 'vs Pakistan Avg'],
    rows: sortedByGap.map(s => {
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
    'Data Governance & Standards': [
      'Establish patient data governance committee with HIPAA/local compliance focus',
      'Implement master patient index (MPI) across all facilities',
      'Define data quality metrics for clinical, financial, and operational data',
    ],
    'Infrastructure & Systems': [
      'Deploy FHIR-compliant health information exchange infrastructure',
      'Migrate to cloud-based health data platform with disaster recovery',
      'Implement secure API gateway for interoperability with DHIS2 and other systems',
    ],
    'Analytics & Intelligence': [
      'Build disease surveillance dashboards using real-time clinical data',
      'Develop predictive models for patient readmission and length of stay',
      'Implement population health analytics for community health assessment',
    ],
    'Integration & Interoperability': [
      'Connect EHR/EMR systems with lab, pharmacy, and radiology using HL7/FHIR',
      'Integrate with national DHIS2 and immunization registries',
      'Establish data exchange with insurance/payer systems for claims analytics',
    ],
    'Patient & Community Engagement': [
      'Deploy patient portal with access to personal health records',
      'Implement automated appointment reminders and follow-up systems',
      'Build patient satisfaction analytics from feedback and outcome data',
    ],
    'Outcomes & Impact': [
      'Define and track clinical outcome measures aligned with WHO indicators',
      'Implement quality improvement dashboards for key performance indicators',
      'Build cost-effectiveness analytics for treatment protocols and pathways',
    ],
  }

  for (const cat of HACR_CATEGORIES) {
    r.page()

    const score = scores.find(s => s.category === cat) || { category: cat, current: 0, desired: 0, gap: 0 }
    const pkScore = bm.pakistanAverage[cat] ?? 1.5
    const regScore = bm.regionalLeaders[cat] ?? 3.0

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

    r.text('Key Strengths', { size: 11, color: EMERALD, gapAfter: 3 })
    r.bullets([
      score.current >= pkScore
        ? `Scoring above Pakistan healthcare average (${pkScore})`
        : `Awareness of ${cat.toLowerCase()} importance is growing`,
      `Foundation for ${cat.toLowerCase()} improvement is in place`,
      `Leadership recognizes the need for ${cat.toLowerCase()} advancement`,
    ], { size: 8, gapAfter: 5 })

    r.text('Key Gaps', { size: 11, color: RED, gapAfter: 3 })
    r.bullets([
      `Gap of ${score.gap.toFixed(1)} levels to reach target state`,
      score.current < pkScore
        ? `Below Pakistan healthcare average by ${(pkScore - score.current).toFixed(1)} levels`
        : `Still ${(regScore - score.current).toFixed(1)} levels behind regional leaders`,
      'Requires structured investment and capability building',
    ], { size: 8, gapAfter: 5 })

    r.text('Recommended Actions', { size: 11, color: BLUE, gapAfter: 3 })
    r.bullets(categoryRecommendations[cat] || [
      `Conduct a detailed ${cat.toLowerCase()} capability assessment`,
      `Develop a 12-month improvement roadmap with quick wins`,
      `Benchmark against regional leaders and WHO targets`,
    ], { size: 8 })
  }

  // ── PAGE 13: CAPABILITY GAP MATRIX ──
  /*
   * The caption states the METHOD and the DENOMINATOR, as the DGIW diagnostic
   * does. It used to say "based on category scores", which was true of the
   * arithmetic and useless to a reader: it did not say which questions produced a
   * capability's number, and it did not say how many capabilities were measurable
   * at all. A reader who cannot see the denominator cannot tell twenty rows out of
   * 108 scored from twenty out of 20.
   *
   * Not-assessed and not-applicable are printed even at zero — the same reason
   * DGIW prints "Not applicable 0" rather than omitting the line. Zero is a
   * measurement; a missing line is an unanswered question.
   */
  /*
   * Three outcomes, and they are different facts (D-008):
   *   dataset missing   — we could not look. Says so, and blames nothing else.
   *   dataset, no rows  — we looked; nothing has been answered yet.
   *   rows              — the ranking.
   * The first two both produce zero rows. Collapsing them would tell a client
   * their assessment is empty when the truth is that a file failed to load.
   */
  const capCaption = !capGaps.datasetAvailable
    ? `The HCF capability dataset could not be loaded, so no capability could be scored ` +
      `for this report. This page is empty for that reason and for no other — it is not a ` +
      `finding about the assessment. Category maturity elsewhere in this report is unaffected.`
    : `Weight-weighted mean of the answered HACR questions linked to each capability. ` +
      `Scored ${capGaps.scored} of ${capGaps.total} capabilities · not assessed ${capGaps.notAssessed} · ` +
      `not applicable ${capGaps.notApplicable}. ` +
      // "Showing the top 0" is technically true and reads like a bug. An empty
      // ranking is the correct output for an unanswered assessment and should say
      // why, not leave a reader counting rows that are not there.
      (capGaps.rows.length > 0
        ? `Showing the top ${capGaps.rows.length} by gap, ties broken by capability id.`
        : `No capability has an answered question yet, so there is nothing to rank.`)
  r.page('Capability Gap Matrix', capCaption)
  // A header row over nothing reads as a rendering fault. The caption above has
  // already said which of the two empty cases this is.
  if (capGaps.rows.length > 0) {
    r.table({
      head: ['#', 'Capability', 'Theme', 'Current', 'Required', 'Gap', 'Priority'],
      rows: capGaps.rows.map((c, i) => [
        i + 1,
        c.name,
        c.theme,
        c.current.toFixed(1),
        c.required.toFixed(1),
        c.gap.toFixed(1),
        priorityLabel(c.gap),
      ]),
      headFontSize: 7,
      bodyFontSize: 7,
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
  }

  // ── PAGE 14: FHIR READINESS ASSESSMENT ──
  r.page('FHIR Readiness Assessment', 'FHIR R4 resource categories needed based on capability gaps')
  r.table({
    head: ['FHIR Category', 'Resources Needed', 'Gap', 'Priority'],
    rows: FHIR_READINESS.map(d => [d.category, d.resources, d.gap, d.priority]),
    // The head fill was BLUE here and EMERALD on every other table. The spine
    // paints table heads in meta.accent, once, so this page now matches the
    // other four — one accent per document is the point of having one.
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
  r.page('Roadmap Summary')
  {
    const phases = [
      { name: 'Phase 1: Quick Wins', months: '1–6', capabilities: 8, investment: 'PKR 40–70M', color: EMERALD },
      { name: 'Phase 2: Core Build', months: '7–18', capabilities: 18, investment: 'PKR 100–200M', color: BLUE },
      { name: 'Phase 3: Advanced', months: '19–36', capabilities: 25, investment: 'PKR 60–180M', color: TEAL },
    ]
    const boxTop = r.cursorY + 6
    const boxGap = 10
    /*
     * D-006, fixed — the third instance of the same copy-pasted grid. See the
     * longer note in src/utils/reportGenerator.ts.
     *
     * `boxW = 55` with two 10mm gaps spans 15..200mm against a content column
     * that ends at 195mm, so the third box was 5mm (14.17pt) over before a glyph
     * was drawn. HAIW's phase titles are short, so — as in TAIW — no glyph ever
     * overflowed and every text-based check called this page clean. It was found
     * by scripts/golden/geometry.mjs, which measures drawn PATHS rather than
     * glyph runs, and it is the reason that script exists.
     *
     * Derived rather than restated as 53.33 so the grid stays correct if a fourth
     * phase, a different gap or a wider sheet ever arrives; `phases.length`
     * rather than 3 for the same reason.
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
      // rather than wrapping — see D-004. Phase names are short and fixed, so
      // this is deliberately unwrapped rather than silently truncatable.
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

  r.keyValueBlock([
    ['Phase 1:', 'Master Patient Index, basic clinical reporting, DHIS2 integration, data governance setup'],
    ['Phase 2:', 'FHIR-based HIE, disease surveillance, clinical decision support, population health dashboards'],
    ['Phase 3:', 'AI/ML models, predictive analytics, real-time monitoring, UHC coverage analytics'],
  ], { size: 9, labelWidth: 25, gapAfter: 6 })

  // ── PAGE 16: BENCHMARK COMPARISON ──
  r.page('Benchmark Comparison')
  r.table({
    head: ['Category', 'Your Org', 'Pakistan Avg', 'Regional Leaders', 'WHO Targets'],
    rows: HACR_CATEGORIES.map(cat => {
      const score = scores.find(s => s.category === cat) || { current: 0 }
      return [
        cat,
        score.current.toFixed(1),
        (bm.pakistanAverage[cat] ?? 1.5).toFixed(1),
        (bm.regionalLeaders[cat] ?? 3.0).toFixed(1),
        (bm.whoTargets[cat] ?? 4.0).toFixed(1),
      ]
    }),
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    gapAfter: 15,
  })

  const regAvg = Object.values(bm.regionalLeaders).reduce((a, b) => a + b, 0) / Object.values(bm.regionalLeaders).length
  const gapToRegional = (regAvg - overallScore).toFixed(1)
  r.text(
    `Your organization is ${gapToRegional} levels behind regional healthcare leaders. Closing this gap requires an estimated 24–36 months.`,
    { size: 10 },
  )

  // ── PAGE 17: NEXT STEPS + UHC ALIGNMENT ──
  r.page('Next Steps')
  r.spacer(6)
  const steps = [
    'Present this assessment to your Health Informatics Leadership Committee',
    'Validate findings with clinical, IT, and administrative department heads',
    'Prioritize Phase 1 Quick Win capabilities for immediate impact on patient outcomes',
    'Engage Godaitec for a Deep Dive Workshop to build a detailed implementation plan',
  ]
  r.keyValueBlock(steps.map((s, i) => [`${i + 1}.`, s] as [string, string]), {
    size: 10,
    labelWidth: 10,
    gapAfter: 8,
  })

  r.spacer(6)
  r.text('Universal Health Coverage (UHC) Alignment', { size: 14, color: EMERALD, gapAfter: 6 })
  r.bullets([
    'SDG 3.8 — Achieve universal health coverage, including financial risk protection',
    'WHO Digital Health Strategy — Align with global standards for health data exchange',
    'Pakistan UHC Benefit Package — Ensure analytics support essential health services monitoring',
    'Sehat Sahulat Programme — Integrate analytics for social health protection coverage tracking',
  ], { size: 9, gapAfter: 8 })

  {
    const boxTop = r.cursorY
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(MARGIN, boxTop, w - 2 * MARGIN, 30, 3, 3, 'F')
    doc.setFontSize(11)
    doc.setTextColor(...EMERALD)
    doc.text('Contact Us', w / 2, boxTop + 10, { align: 'center' })
    doc.setFontSize(9)
    doc.setTextColor(...SLATE)
    doc.text('Godaitec | godai.tech | info@godai.tech', w / 2, boxTop + 20, { align: 'center' })
    r.moveTo(boxTop + 30 + 6)
  }

  // ── PAGE 18: METHODOLOGY ──
  r.page('Methodology')
  r.bullets([
    'This assessment uses the Healthcare Capability Framework (HCF) — 108 analytics capabilities across 8 themes',
    'Data model readiness assessed against FHIR R4 resources mapped to HCDM (Healthcare Data Model)',
    'Maturity measured using HACR (Healthcare Analytics Capability Review) — 5-level scale',
    'Benchmarks include Pakistan healthcare averages, regional leaders, and WHO target levels',
  ], { size: 9, gapAfter: 8 })

  r.table({
    head: ['Level', 'Label', 'Description'],
    rows: [1, 2, 3, 4, 5].map(l => [l, levelLabel(l), levelDescription(l)]),
    columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
    gapAfter: 12,
  })

  r.text('Frameworks Used:', { size: 9, color: EMERALD, gapAfter: 4 })
  r.bullets([
    'HCF — Healthcare Capability Framework (108 capabilities across 8 themes)',
    'HACR — Healthcare Analytics Capability Review (5-level maturity assessment)',
    'FHIR — Fast Healthcare Interoperability Resources R4 (HL7 standard)',
    'HCDM — Healthcare Data Model (reference data architecture for healthcare analytics)',
  ], { size: 8, gapAfter: 6 })

  {
    const boxTop = r.cursorY
    doc.setFillColor(236, 253, 245) // emerald-50
    doc.roundedRect(MARGIN, boxTop, w - 2 * MARGIN, 25, 3, 3, 'F')
    doc.setFontSize(10)
    doc.setTextColor(...EMERALD)
    doc.text('Ready to transform your healthcare analytics?', w / 2, boxTop + 9, { align: 'center' })
    doc.setFontSize(9)
    doc.setTextColor(...SLATE)
    doc.text('Contact Godaitec for a Deep Dive Workshop — godai.tech', w / 2, boxTop + 17, { align: 'center' })
    r.moveTo(boxTop + 25 + 8)
  }

  r.text('Disclaimer: Benchmark data based on healthcare industry research and consulting experience.', {
    size: 7,
    color: SLATE,
  })

  saveReport(r.build(), reportFilename(reportMeta, 'pdf'))
}

// ══════════════════════════════════════════════════════════
// GAP CSV — MR-HAIW-GAP
// ══════════════════════════════════════════════════════════
/*
 * One row per HCF capability, from the SAME `scoreCapabilities` page 13 uses.
 *
 * What this used to be, recorded because it is the second half of D-003: the
 * bridge (`THEME_TO_CATEGORY`) plus a `charCodeAt` jitter,
 * `(cap.id.charCodeAt(len - 1) % 10 - 5) * 0.08`. Deterministic — this file is the
 * golden harness's reproducibility control and stays so — but the jitter was
 * decoration on a category number, spreading 108 rows around five values so they
 * would not look copied. The PDF used the same bridge with a different jitter
 * constant (0.1 against 0.08), so the spreadsheet and page 13 printed different
 * numbers for the same capability on the same day.
 *
 * Both are gone. One scoring path, so the two agree by construction.
 *
 * An unscored capability writes EMPTY numeric cells and its state in Priority,
 * rather than 0.0 / Low. An empty cell is the CSV convention for "no value" and
 * survives a spreadsheet import as blank; a zero would be averaged. The header is
 * unchanged — Priority is already a text column and carries the state without a
 * schema change for consumers.
 *
 * ── ON THE SPINE as of 2026-08-01, the LAST hand-rolled CSV in the suite ──
 *
 * Escaping is delegated to `downloadCSV` via `src/report/csv.ts`, which quotes
 * every field and doubles embedded quotes. The hand-rolled version quoted four of
 * its nine columns by hand and left `ID` and the three scores bare — safe only
 * because nothing in those cells can contain a comma today.
 *
 * Three things change in the bytes and NOTHING changes in the content: a UTF-8
 * BOM, CRLF line endings, and every field quoted. Those are the defaults
 * `downloadCsv` applies to every deliverable CSV in this repo, because these
 * files reach a client and get opened in Excel on Windows first.
 *
 * The filename moves from a fixed `HAIW_Capability_Gap_Analysis.csv` to
 * `reportFilename(meta, 'csv')`, so it now carries the engagement, the layer and
 * the date like the other eight module deliverables.
 */
/**
 * One row of the gap register, in either path below.
 *
 * The numeric cells are STRINGS, not numbers: an unscored capability writes an
 * empty cell, and `number | ''` would let a `0` through the same slot. Formatting
 * happens where the state is known, so `toFixed(1)` cannot be reached for a
 * capability that has no score. See CLAUDE.md, "HAIW scoring".
 */
interface GapRow {
  ordinal: number
  name: string
  theme: string
  group: string
  current: string
  desired: string
  gap: string
  /** `priorityLabel(gap)` when scored; otherwise the state, spelled out. */
  priority: string
  fhir: string
}

/*
 * The nine columns, in order, unchanged from the hand-rolled version.
 *
 * `ID` is the ORDINAL, not `cap.id` — it was `i + 1` before this migration and
 * still is. Adding an `HCF-nnn` column would be a schema change for consumers,
 * which a plumbing migration is not allowed to be.
 */
const GAP_COLUMNS: CsvColumn<GapRow>[] = [
  { key: 'ordinal', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'theme', header: 'Theme' },
  { key: 'group', header: 'Group' },
  { key: 'current', header: 'Current Score' },
  { key: 'desired', header: 'Target Score' },
  { key: 'gap', header: 'Gap' },
  { key: 'priority', header: 'Priority' },
  { key: 'fhir', header: 'FHIR Resources' },
]

function buildGapRows(
  answers: HaiwAssessmentAnswer[],
  capabilities: HaiwCapability[],
  questions: readonly HacrQuestionLink[],
): GapRow[] {
  /*
   * D-008: NO CAPABILITY DATASET MEANS NO ROWS.
   *
   * This used to synthesise 108 rows named `${cat} — ${group}` from fourteen
   * hardcoded group names, each carrying a category score offset by
   * `(ci % 5 - 2) * 0.15`, with a per-category FHIR resource list picked from a
   * hardcoded map. None of it was a capability. The variation existed to stop one
   * number reading as one number.
   *
   * `downloadCsv` returns false on an empty set and writes no file, so the caller
   * can tell the user the truth instead of handing them a spreadsheet. A client
   * receiving 108 plausible rows because a fetch failed is the worst outcome this
   * codebase can produce: it is indistinguishable from real output.
   */
  if (capabilities.length === 0) return []

  /*
   * Row order is DECLARED, per src/report/csv.ts: "the alternative is the order
   * the JSON file happens to be in, which nobody declared and a dataset edit can
   * change without touching a line of code".
   *
   * `byStringKey` is right for `HCF-001`-style zero-padded ids, and this sort is
   * a no-op today — capabilities.json is already in id order, verified — so
   * declaring it moves no row and changes no ordinal. That is the point: the
   * order stops being an accident without the file changing.
   */
  const ordered = [...capabilities].sort(byStringKey(c => c.id))
  return scoreCapabilities(ordered, questions, answers).map((cap, i) => ({
    ordinal: i + 1,
    name: cap.name,
    theme: cap.theme,
    group: cap.group,
    ...(cap.state === 'scored'
      ? {
          current: cap.current.toFixed(1),
          desired: cap.desired.toFixed(1),
          gap: cap.gap.toFixed(1),
          priority: priorityLabel(cap.gap),
        }
      : {
          // Empty numeric cells, state in Priority. An empty cell imports as
          // blank; a 0.0 would be averaged into a number nobody measured.
          current: '',
          desired: '',
          gap: '',
          priority: cap.state === 'not-assessed' ? 'Not Assessed' : 'Not Applicable',
        }),
    fhir: cap.fhirResources.join('; '),
  }))
}

/**
 * @returns false when no file was written, which happens only when the capability
 * dataset is unavailable. The caller MUST surface that — a button that silently
 * does nothing reads as a broken download, and the user's next move is to try
 * again rather than to report the real fault.
 */

export function generateHealthGapCSV(
  answers: HaiwAssessmentAnswer[],
  capabilities: HaiwCapability[],
  questions: readonly HacrQuestionLink[],
  meta: ReportMeta,
): boolean {
  return downloadCsv(buildGapRows(answers, capabilities, questions), GAP_COLUMNS, reportFilename(meta, 'csv'))
}

// ══════════════════════════════════════════════════════════
// ROADMAP MARKDOWN GENERATOR
// ══════════════════════════════════════════════════════════
/**
 * The twelve-slide roadmap, on the spine's CONVENTIONS rather than its builder —
 * there is no markdown analogue of ReportDoc and src/report/ is not the place to
 * invent one for a single caller.
 *
 * What that means concretely: the org name and the date come from `meta`, the
 * date is `formatCoverDate()` (UTC parts, machine-stable) instead of
 * `toLocaleDateString()` (neither), and the filename is `reportFilename()`. The
 * old bare `toLocaleDateString()` rendered `7/31/2026` on an en-US machine and
 * `31.7.2026` on a German one, for the same assessment.
 *
 * `capabilities` is unused and was unused before. Kept for arity: the three
 * export buttons call their generators through one handler.
 *
 * `questions` IS read, and was added when category scoring moved onto the
 * question universe. Deriving the categories from the answers alone cannot tell
 * "no question carries this category's code" from "nobody answered it", which is
 * the state collapse `computeCategoryOutcomes` exists to avoid. Same
 * `HacrQuestionLink` projection the other two take, for the same reason: an
 * honest contract about what is read, and no second copy of a 1.18 MB dataset in
 * the report chunk.
 */
export function generateHealthRoadmapMarkdown(
  answers: HaiwAssessmentAnswer[],
  capabilities: HaiwCapability[],
  questions: readonly HacrQuestionLink[],
  meta: ReportMeta,
) {
  const outcomes = computeCategoryOutcomes(answers, questions)
  const scores = flatten(outcomes)
  // ÷ scored, as the PDF. See the note there.
  const overallScore = overallCurrent(outcomes) ?? 0
  const coverage = coverageStatement(outcomes)
  const sortedByGap = [...scores].sort((a, b) => b.gap - a.gap)

  const md = `# ${meta.orgName} — Healthcare Analytics Transformation Roadmap
## Prepared by Godaitec | ${formatCoverDate(meta.generatedAt)}

---

## Slide 1: Title
### ${meta.orgName} Healthcare Analytics Transformation Roadmap
**Current HACR Maturity: ${overallScore} / 5.0 (${levelLabel(overallScore)})**
Prepared by Godaitec (godai.tech)

---

## Slide 2: Current State
### Where We Are Today
${outcomes.map(o => o.agg.state === 'scored'
  ? `- **${o.name}**: ${o.agg.current.toFixed(1)} / 5.0 (${levelLabel(o.agg.current)})`
  : `- **${o.name}**: ${scoreLabel(o.agg)}`).join('\n')}

**Overall HACR Score: ${overallScore} / 5.0**
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
  saveAs(blob, reportFilename(meta, 'md'))
}
