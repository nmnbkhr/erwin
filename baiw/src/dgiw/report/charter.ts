/**
 * Data Governance charter (AR-08) — generated from the engagement intake.
 *
 * ─── WHY THIS GENERATOR MAY EXIST AT ALL ───────────────────────────────────
 *
 * Wave B re-dispositioned AR-08 from derived to authored: a charter is a
 * TEMPLATE filled per engagement, and what makes a charter a charter — the
 * organisation's own mandate, its drivers, a scope statement with explicit
 * exclusions, its sponsorship — was absent from every dataset. Its note ended
 * "Author the template, then a generator can fill it." G1 is that fill: the
 * ProgramIntake (src/dgiw/intake/, namespaced per engagement) now supplies
 * exactly the per-engagement content Wave B said was missing, and the register
 * entry moves back to derived in the same commit as this file — the
 * ARTEFACT-EVIDENCE discipline.
 *
 * ─── THE TWO MODES, AND THE LINE BETWEEN THEM ──────────────────────────────
 *
 * `intakeIsActionable` — imported from intake/types, never re-derived; the
 * INTAKE-MODE gate asserts both — is the only switch:
 *
 *  - ENGAGEMENT: every client-specific string on every page traces to an
 *    intake field. A section whose intake fields are empty is OMITTED, never
 *    filled with a placeholder — "TBD" under a client's name is the D-001
 *    shape in miniature.
 *  - REFERENCE: no actionable intake exists, so the TEMPLATE is rendered —
 *    what each section will contain once the intake is filled, plus what
 *    pillars.json's P01 catalogues for a charter — under an ILLUSTRATIVE
 *    watermark on every page and provenance `mode: 'reference'`. The
 *    template outline is authored library content; nothing in it names an
 *    organisation, a date, a budget or a count.
 *
 * What this generator deliberately does NOT do: re-render AR-09's content.
 * The council terms of reference, the role archetypes and the declared RACI
 * matrix stay in the operating model — Wave B's warning was that a charter
 * generator would otherwise assemble AR-09's content under a cover saying
 * Charter (the AR-46 shape). The governance section here renders the INTAKE's
 * sponsorship fields and nothing from operatingModel.json.
 *
 * Sections a charter needs that the intake does not yet capture — term,
 * amendment procedure, review cycle — are named on the page as authored-per-
 * engagement slots in BOTH modes, because omitting them silently would imply
 * the document is complete when it is not.
 *
 * Determinism: no clock, no randomness. Intake rows render in stored order;
 * scope pillars in pillars.json order.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import pillars from '../data/pillars.json'
import {
  PILLAR_IDS,
  PILLAR_NAMES,
  emptyIntake,
  intakeIsActionable,
  namedDrivers,
  primaryDriverText,
  validScopeIds,
  type ProgramIntake,
} from '../intake/types'

/**
 * implementationPlan.json → artefactRegister: "Data Governance charter",
 * rung 2, owned by the Executive Sponsor, format "Document". Re-dispositioned
 * derived (from authored) in the same commit as this generator — see the
 * register entry's note for the full argument.
 */
export const CHARTER_ARTEFACT_ID = 'AR-08'

export interface CharterInput {
  meta: ReportMeta
  /** Absent (or not actionable) → ILLUSTRATIVE reference template. */
  intake?: ProgramIntake
}

/** A RACI row worth printing: a named activity with at least one assignment. */
function printableRaci(intake: ProgramIntake) {
  return intake.raci.filter(
    (r) =>
      r.activity.trim().length > 0 &&
      [r.R, r.A, r.C, r.I].some((cell) => cell.trim().length > 0),
  )
}

/**
 * The template outline, rendered in reference mode and used as the section
 * plan in both. Authored library content: it describes what fills each
 * section, and names no organisation, date, budget or count.
 */
const TEMPLATE_SECTIONS: readonly { heading: string; fills: string }[] = [
  { heading: 'Mandate', fills: 'The organisation, its sector, and the primary driver the programme answers — from the intake’s organisation and drivers sections.' },
  { heading: 'Drivers', fills: 'The regulatory and strategic drivers, as the engagement names them — from the intake’s driver lists.' },
  { heading: 'Scope and explicit exclusions', fills: 'Which of the eleven pillars are in scope, and — explicitly — which are not. Exclusions are stated, never implied by absence.' },
  { heading: 'Sponsorship and governance', fills: 'The executive sponsor and council chair role titles, the council cadence and the escalation path — from the intake’s sponsorship section. The full council terms of reference remain the operating model’s (AR-09).' },
  { heading: 'Decision rights and accountability', fills: 'The engagement’s own RACI rows — activities with at least one assignment. Rows never filled in are never printed.' },
  { heading: 'Approval', fills: 'The sponsor’s role title with signature and date slots. Slots stay blank until signed on paper — this workbench never fabricates a signature or a date.' },
]

/** Charter content the intake does not yet capture — stated, not padded over. */
const AUTHORED_PER_ENGAGEMENT: readonly string[] = [
  'Term of the charter and its review cycle',
  'Amendment procedure',
  'Budgetary authority and funding commitments',
]

export function buildCharterPdf(input: CharterInput): jsPDF {
  const intake = input.intake ?? emptyIntake()
  const mode: NonNullable<ReportMeta['mode']> = intakeIsActionable(intake) ? 'engagement' : 'reference'

  const scopeIds = validScopeIds(intake)
  const excludedIds = PILLAR_IDS.filter((id) => !scopeIds.includes(id))
  const drivers = namedDrivers(intake)
  const primary = primaryDriverText(intake)
  const s = intake.sponsorship
  const sponsorship: [string, string][] = (
    [
      ['Executive sponsor', s.sponsorTitle],
      ['Council chair', s.chairTitle],
      ['Council cadence', s.cadence ?? ''],
      ['Escalation path', s.escalationPath],
    ] as [string, string][]
  ).filter(([, v]) => v.trim().length > 0)
  const raci = printableRaci(intake)

  /*
   * The digest covers what THIS document renders under THIS mode — an intake
   * edit that changes any printed string changes the /ID. Reference mode keys
   * on the template outline, which is what that document is.
   */
  const digest =
    mode === 'engagement'
      ? contentKey([
          'mode:engagement',
          `org:${intake.org.name.trim()}`,
          ...(intake.org.sector ? [`sector:${intake.org.sector}`] : []),
          ...(intake.org.sizeBand ? [`size:${intake.org.sizeBand}`] : []),
          ...drivers.regulatory.map((d) => `driver:reg:${d}`),
          ...drivers.strategic.map((d) => `driver:str:${d}`),
          ...(primary ? [`primary:${primary}`] : []),
          ...scopeIds.map((id) => `scope:${id}`),
          ...sponsorship.map(([k, v]) => `sponsor:${k}:${v}`),
          ...raci.map((r) => `raci:${r.activity}|${r.R}|${r.A}|${r.C}|${r.I}`),
        ])
      : contentKey([
          'mode:reference',
          ...TEMPLATE_SECTIONS.map((t) => `template:${t.heading}`),
          ...PILLAR_IDS.map((id) => `pillar:${id}`),
        ])

  const meta: ReportMeta =
    mode === 'reference'
      ? { ...input.meta, mode, watermark: 'ILLUSTRATIVE' }
      : { ...input.meta, mode }

  const r = createReport(meta, digest)

  if (mode === 'reference') {
    r.cover('Data Governance Charter — Template', 'Illustrative reference template — no engagement intake')

    r.page('What this document is')
    r.paragraph(
      'This is the charter TEMPLATE, rendered because the active engagement has no actionable ' +
        'intake. Every page carries the ILLUSTRATIVE watermark and the provenance log records ' +
        'mode: reference. Nothing in it is client-specific, and nothing in it should be presented ' +
        'as such. Fill the Program Design intake — organisation name, at least one driver, at ' +
        'least one pillar in scope — and regenerate to produce the engagement version.',
    )
    r.sectionHeading('What each section will contain')
    for (const t of TEMPLATE_SECTIONS) {
      r.keyValueBlock([[t.heading, t.fills]], { labelWidth: 58, size: 8 })
    }
    r.sectionHeading('Authored per engagement, outside the intake')
    r.paragraph(
      'A signed charter also carries the following. No intake field captures them yet, so they are ' +
        'named here rather than silently omitted or padded with placeholders:',
      { color: SLATE, size: 8 },
    )
    r.bullets([...AUTHORED_PER_ENGAGEMENT])

    r.page('The pillar model the scope section draws on')
    r.paragraph(
      'The scope section selects from the eleven pillars of the practice’s capability model. ' +
        'Listed here as reference so a reader of the template can see the universe an engagement ' +
        'chooses from.',
      { color: SLATE, size: 8 },
    )
    r.table({
      head: ['Id', 'Pillar', 'Focus'],
      rows: pillars.map((p) => [p.id, p.name, p.short]),
      columnStyles: { 0: { cellWidth: 16 }, 2: { cellWidth: 40 } },
    })
    return r.build()
  }

  /* ---- engagement mode: every client-specific string is an intake field ---- */
  r.cover('Data Governance Charter', `${scopeIds.length} of ${PILLAR_IDS.length} pillars in scope`)

  r.page('Mandate')
  const orgFacts: [string, string][] = [
    ['Organisation', intake.org.name.trim()],
    ...(intake.org.sector ? ([['Sector', intake.org.sector]] as [string, string][]) : []),
    ...(intake.org.sizeBand ? ([['Size band', intake.org.sizeBand]] as [string, string][]) : []),
    ...(primary ? ([['Primary driver', primary]] as [string, string][]) : []),
  ]
  r.keyValueBlock(orgFacts)
  r.paragraph(
    'This charter establishes the data governance programme for the organisation named above. ' +
      'Its content is generated from the engagement intake: every organisation-specific statement ' +
      'in it was entered by the engagement, and sections with no intake content are omitted ' +
      'rather than filled with placeholders.',
    { color: SLATE, size: 8 },
  )

  if (drivers.regulatory.length > 0 || drivers.strategic.length > 0) {
    r.sectionHeading('Drivers')
    if (drivers.regulatory.length > 0) {
      r.text('Regulatory', { size: 8, color: SLATE, gapAfter: 1 })
      r.bullets(drivers.regulatory)
    }
    if (drivers.strategic.length > 0) {
      r.text('Strategic', { size: 8, color: SLATE, gapAfter: 1 })
      r.bullets(drivers.strategic)
    }
  }

  r.page('Scope')
  r.paragraph(
    `${scopeIds.length} of the ${PILLAR_IDS.length} pillars of the capability model are in scope ` +
      'for this engagement. Exclusions are stated explicitly below — a pillar absent from a scope ' +
      'list reads as an oversight; a pillar named as excluded reads as a decision.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Id', 'Pillar', 'Status'],
    rows: [
      ...scopeIds.map((id) => [id, PILLAR_NAMES.get(id) ?? '', 'In scope']),
      ...excludedIds.map((id) => [id, PILLAR_NAMES.get(id) ?? '', 'EXCLUDED']),
    ],
    columnStyles: { 0: { cellWidth: 16 }, 2: { cellWidth: 26 } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2 && data.cell.raw === 'EXCLUDED')
        data.cell.styles.textColor = [180, 83, 9]
    },
  })
  if (excludedIds.length === 0)
    r.paragraph('No exclusions — every pillar of the capability model is in scope.', { size: 8 })

  if (sponsorship.length > 0) {
    r.sectionHeading('Sponsorship and governance')
    r.keyValueBlock(sponsorship)
    r.paragraph(
      'The council’s full terms of reference — membership, quorum, decision rights — are the ' +
        'operating model’s (AR-09), not restated here.',
      { color: SLATE, size: 8 },
    )
  }

  if (raci.length > 0) {
    r.sectionHeading('Decision rights and accountability')
    r.paragraph(
      'The engagement’s own RACI, from the intake. Rows with no assignment are not printed.',
      { color: SLATE, size: 8 },
    )
    r.table({
      head: ['Activity', 'R', 'A', 'C', 'I'],
      rows: raci.map((row) => [row.activity, row.R, row.A, row.C, row.I]),
      columnStyles: { 0: { cellWidth: 60 } },
      bodyFontSize: 7,
    })
  }

  r.sectionHeading('Authored per engagement, outside the intake')
  r.paragraph(
    'A signed charter also carries the following. No intake field captures them yet; they are to ' +
      'be authored with the sponsor rather than generated:',
    { color: SLATE, size: 8 },
  )
  r.bullets([...AUTHORED_PER_ENGAGEMENT])

  if (s.sponsorTitle.trim().length > 0) {
    r.sectionHeading('Approval')
    r.text(`Executive sponsor: ${s.sponsorTitle.trim()}`, { size: 9, gapAfter: 6 })
    r.text('Signature: _____________________________', { size: 9, gapAfter: 6 })
    r.text('Date: _____________________________', { size: 9 })
  }

  return r.build()
}
