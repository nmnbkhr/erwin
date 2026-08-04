/**
 * Target operating model — archetypes, decision rights, flows, checklist.
 *
 * WHERE THE RACI ACTUALLY COMES FROM
 *
 * There are two different accountability structures in this dataset and they are
 * not the same object. Merging them would produce a confident-looking matrix that
 * is not in the data:
 *
 *   1. `operatingModel.raci` — a declared 15-activity × 5-role matrix. This is
 *      the RACI a client signs. Its cells are free text ("A/R", "C (arbitrates
 *      disputes)"), so the codes are parsed out before they are counted.
 *
 *   2. `operatingModel.roleRegistry` — 32 job titles mapped to the ten
 *      archetypes. This is not a RACI. It is what makes one derivable: every
 *      step, checklist item and artefact names a single free-text owner, and the
 *      registry is what turns "Head of Retail Operations" into "Data Owner".
 *
 * So the report renders the declared matrix as the RACI, and uses the registry to
 * derive per-record accountability alongside it. Both are checked for the same
 * defect — an activity or a record with no accountable party, or with more than
 * one — and both counts are printed even when they are zero. Two accountable
 * parties is the same as none, and a matrix that quietly shows two A's in a row
 * is worse than one that admits the row is unresolved.
 *
 * The registry-derived side is expected to report zero defects, and that is not
 * the check being pointless: check-dgiw.mjs enforces OWNER-UNRESOLVED and
 * OWNER-COMPOUND on exactly these fields, so a non-zero count here means the gate
 * has been bypassed or the dataset was edited without running it.
 *
 * WHAT THE DATASET DOES NOT JOIN
 *
 * The 52 checklist items carry `phase` and `pillarId` — there is no foreign key
 * to a flow or a step. The seven phase names resemble the seven flow names but do
 * not equal them ("Standards & Policy" against "Standards, Policy & Enforcement
 * Design"), so any mapping between them would be a guess this file invented and
 * a later reader would mistake for data. The checklist is therefore grouped by
 * its declared `phase`, the flows and steps are their own section, and the report
 * says on the page that the two are not joined.
 *
 * SCOPE
 *
 * Roles carry a layer, so `layerShows` answers directly. Flows do not — only
 * their steps do — so a flow is in scope when at least one of its steps is, and a
 * flow with no in-scope step is printed as out of scope rather than dropped.
 * Principles, the council and the RACI matrix carry no layer at all and are
 * unconditional; that is stated rather than left to be inferred from their always
 * being present.
 *
 * Determinism: no clock, no randomness. Roles by id ordinal, flows and steps in
 * declared order, checklist phases in order of first appearance.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { byNumber, idOrdinal } from '../../report/order'
import { layerShows } from '../layer'
import { archetypeOf } from '../roles'
import { intakeIsActionable, type ProgramIntake } from '../intake/types'
import operatingModel from '../data/operatingModel.json'
import programSetup from '../data/programSetup.json'
import implementationPlan from '../data/implementationPlan.json'
import type {
  ChecklistItem,
  ImplementationPlanData,
  Layer,
  OperatingModelData,
  OperatingRole,
  ProgramSetupData,
  ProgramStep,
  RaciRow,
} from '../types'

const OM = operatingModel as OperatingModelData
const PROG = programSetup as ProgramSetupData
const PLAN = implementationPlan as ImplementationPlanData

/**
 * implementationPlan.json → artefactRegister: "Target operating model", rung 2,
 * owned by the Engagement Lead, format "Document + RACI". An exact catalogue
 * match — and the format string is the reason the RACI belongs in this document
 * rather than in a separate one.
 */
export const OPERATING_MODEL_ARTEFACT_ID = 'AR-09'

export interface OperatingModelInput {
  meta: ReportMeta
  /**
   * G1: the engagement intake. When present AND actionable
   * (`intakeIsActionable` — the imported predicate, never re-derived), the
   * council page and the RACI page additionally render the engagement's own
   * parameters, and the document is `mode: 'engagement'`. When absent or not
   * actionable, output is the pre-G1 reference document plus an ILLUSTRATIVE
   * watermark on every page and `mode: 'reference'` — the reference council
   * and RACI are the methodology's TARGET model, and presenting them
   * un-watermarked as a client's own decisions is the D-001 shape.
   */
  intake?: ProgramIntake
}

export type ScopeState = 'in-scope' | 'out-of-scope'

/** The five RACI columns, in the order the matrix declares them. */
const RACI_COLUMNS: { key: keyof Omit<RaciRow, 'activity'>; label: string }[] = [
  { key: 'dataOwner', label: 'Data Owner' },
  { key: 'dataSteward', label: 'Data Steward' },
  { key: 'dataCustodian', label: 'Data Custodian' },
  { key: 'dgCouncil', label: 'DG Council' },
  { key: 'dgOffice', label: 'DG Office' },
]

/**
 * The RACI letters in a cell, with the explanatory prose removed.
 *
 * Cells are free text: "A", "A/R", "C (arbitrates disputes)", "R (facilitates
 * derivation)". Testing `value.includes('A')` would read "C (arbitrates
 * disputes)" as accountable — the word "arbitrates" contains an A — and would
 * report a defect that is not there. The parenthetical is stripped first for
 * exactly that reason.
 */
export function raciCodes(value: string): string[] {
  return value
    .replace(/\([^)]*\)/g, '')
    .split('/')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
}

export interface RaciDefect {
  activity: string
  accountable: string[]
  problem: string
}

/** Activities whose accountability is missing or shared. Order follows the matrix. */
export function raciDefects(): RaciDefect[] {
  const out: RaciDefect[] = []
  for (const row of OM.raci) {
    const accountable = RACI_COLUMNS.filter((c) => raciCodes(row[c.key]).includes('A')).map((c) => c.label)
    if (accountable.length === 1) continue
    out.push({
      activity: row.activity,
      accountable,
      problem:
        accountable.length === 0
          ? 'No role is accountable — the activity has an R but nobody who answers for the outcome'
          : `${accountable.length} roles are accountable — shared accountability is unaccountability`,
    })
  }
  return out
}

export interface AccountabilityDefect {
  where: string
  owner: string
  problem: string
}

/** The shape the three owned collections have in common. */
type OwnedRecord = { owner: string; layer: Layer }

/**
 * Mirrors check-dgiw.mjs's OWNER-COMPOUND test. Kept in step with it on purpose:
 * if the two ever disagree, the report is the one a client is holding.
 */
const COMPOUND_OWNER = / with | and |,|\//

/**
 * Per-record accountability derived through the role registry, for records in
 * scope under the current layer.
 */
export function accountabilityDefects(input: OperatingModelInput): AccountabilityDefect[] {
  const { layer } = input.meta
  const out: AccountabilityDefect[] = []
  const records: [string, OwnedRecord][] = [
    ...PROG.flows.flatMap((f) => f.steps.map((s): [string, OwnedRecord] => [`step ${s.id}`, s])),
    ...PROG.checklist.map((c): [string, OwnedRecord] => [`checklist ${c.id}`, c]),
    ...PLAN.artefactRegister.map((a): [string, OwnedRecord] => [`artefact ${a.id}`, a]),
  ]
  for (const [where, rec] of records) {
    if (!layerShows(layer, rec.layer)) continue
    // A registered compound string is not a defect — the registry is what decides
    // whether "Data Owner / Data Steward" is one recognised party or two people
    // nobody can hold to account. So there is one test, not two: does it resolve?
    // The message distinguishes the two ways it can fail.
    if (archetypeOf(rec.owner)) continue
    out.push({
      where,
      owner: rec.owner,
      problem: COMPOUND_OWNER.test(rec.owner)
        ? 'Names more than one party and is not in the registry — no single accountable archetype'
        : 'Does not resolve to an archetype — no accountable party in governance terms',
    })
  }
  return out
}

export interface RoleScope {
  role: OperatingRole
  state: ScopeState
  reason: string
}

export function buildRoleScopes(input: OperatingModelInput): RoleScope[] {
  const { layer } = input.meta
  return [...OM.roles]
    .sort(byNumber((r) => idOrdinal(r.id)))
    .map((role) => {
      const shown = layerShows(layer, role.layer)
      return {
        role,
        state: shown ? ('in-scope' as const) : ('out-of-scope' as const),
        reason: shown
          ? 'In scope'
          : `Out of scope — ${role.layer} archetype, current scope is ${layer === 'all' ? 'core + banking' : layer}`,
      }
    })
}

export interface FlowScope {
  id: string
  name: string
  objective: string
  gateIds: string[]
  /** Steps in the current layer, in declared order. */
  steps: ProgramStep[]
  totalSteps: number
  state: ScopeState
  reason: string
}

export function buildFlowScopes(input: OperatingModelInput): FlowScope[] {
  const { layer } = input.meta
  return PROG.flows.map((f) => {
    const steps = f.steps.filter((s) => layerShows(layer, s.layer))
    return {
      id: f.id,
      name: f.name,
      objective: f.objective,
      gateIds: f.gateIds,
      steps,
      totalSteps: f.steps.length,
      state: steps.length > 0 ? ('in-scope' as const) : ('out-of-scope' as const),
      reason:
        steps.length > 0
          ? 'In scope'
          : `Out of scope — all ${f.steps.length} steps are in the other layer`,
    }
  })
}

/** Checklist phases in order of first appearance, which is the declared order. */
export function buildChecklistPhases(input: OperatingModelInput): { phase: string; items: ChecklistItem[] }[] {
  const { layer } = input.meta
  const order: string[] = []
  const byPhase = new Map<string, ChecklistItem[]>()
  for (const item of PROG.checklist) {
    if (!byPhase.has(item.phase)) {
      order.push(item.phase)
      byPhase.set(item.phase, [])
    }
    if (layerShows(layer, item.layer)) byPhase.get(item.phase)!.push(item)
  }
  return order.map((phase) => ({ phase, items: byPhase.get(phase) ?? [] }))
}

/** Intake RACI rows worth printing: a named activity with at least one assignment. */
function printableIntakeRaci(intake: ProgramIntake) {
  return intake.raci.filter(
    (r) => r.activity.trim().length > 0 && [r.R, r.A, r.C, r.I].some((c) => c.trim().length > 0),
  )
}

export function buildOperatingModelPdf(input: OperatingModelInput): jsPDF {
  /*
   * G1 mode split. Engagement mode adds intake-driven blocks below; reference
   * mode is the pre-G1 document under an ILLUSTRATIVE watermark. The digest
   * gains the mode and, in engagement mode, every intake string this document
   * renders — a revised intake is a different document and /ID must say so.
   */
  const intake = input.intake
  const mode: NonNullable<ReportMeta['mode']> =
    intake && intakeIsActionable(intake) ? 'engagement' : 'reference'
  const intakeRaci = mode === 'engagement' && intake ? printableIntakeRaci(intake) : []
  const councilParams: [string, string][] =
    mode === 'engagement' && intake
      ? (
          [
            ['Executive sponsor', intake.sponsorship.sponsorTitle],
            ['Council chair', intake.sponsorship.chairTitle],
            ['Council cadence', intake.sponsorship.cadence ?? ''],
            ['Escalation path', intake.sponsorship.escalationPath],
          ] as [string, string][]
        ).filter(([, v]) => v.trim().length > 0)
      : []

  const meta: ReportMeta =
    mode === 'reference'
      ? { ...input.meta, mode, watermark: 'ILLUSTRATIVE' }
      : { ...input.meta, mode }
  input = { ...input, meta }

  const roles = buildRoleScopes(input)
  const flows = buildFlowScopes(input)
  const phases = buildChecklistPhases(input)
  const raciFaults = raciDefects()
  const ownerFaults = accountabilityDefects(input)

  const inScopeRoles = roles.filter((r) => r.state === 'in-scope')
  const outRoles = roles.filter((r) => r.state === 'out-of-scope')
  const inScopeFlows = flows.filter((f) => f.state === 'in-scope')
  const outFlows = flows.filter((f) => f.state === 'out-of-scope')
  const stepsInScope = flows.reduce((n, f) => n + f.steps.length, 0)
  const totalSteps = flows.reduce((n, f) => n + f.totalSteps, 0)
  const checklistInScope = phases.reduce((n, p) => n + p.items.length, 0)
  const registryInScope = OM.roleRegistry.filter((e) => layerShows(meta.layer, e.layer)).length

  // The RACI activities and the role archetypes in scope. Activities have no id
  // in the dataset, so the activity text is the identifier — which is correct
  // here anyway: rewording an activity changes what the matrix says.
  // G1: the mode and every rendered intake string join the digest — a revised
  // intake, or the same engagement flipping between reference and engagement
  // mode, is a different document.
  const r = createReport(
    meta,
    contentKey([
      `mode:${mode}`,
      ...OM.raci.map((x) => `activity:${x.activity}`),
      ...inScopeRoles.map((x) => `role:${x.role.id}`),
      ...councilParams.map(([k, v]) => `intake:${k}:${v}`),
      ...intakeRaci.map((x) => `intakeRaci:${x.activity}|${x.R}|${x.A}|${x.C}|${x.I}`),
    ]),
  )
  r.cover('Target Operating Model', `${inScopeRoles.length} of ${OM.roles.length} role archetypes in scope`)

  /* ---- summary ---- */
  r.page('Operating model summary')
  r.keyValueBlock([
    ['Role archetypes in scope', `${inScopeRoles.length} of ${OM.roles.length}`],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
    ['Registry entries in scope', `${registryInScope} of ${OM.roleRegistry.length}`],
    ['Delivery flows in scope', `${inScopeFlows.length} of ${flows.length}`],
    ['Steps in scope', `${stepsInScope} of ${totalSteps}`],
    ['Checklist items in scope', `${checklistInScope} of ${PROG.checklist.length}`],
    ['RACI activities', `${OM.raci.length}`],
    ['RACI accountability defects', `${raciFaults.length}`],
    ['Registry-derived accountability defects', `${ownerFaults.length}`],
  ])
  r.paragraph(
    'The two defect counts are different measurements. The first is of the declared RACI matrix — ' +
      'activities with no accountable role, or with more than one. The second is of every step, ' +
      'checklist item and artefact in scope, whose free-text owner is resolved through the role ' +
      'registry. Both are reported even at zero, because "no defects found" and "not checked" are ' +
      'not the same statement.',
    { color: SLATE, size: 8 },
  )

  /* ---- principles ---- */
  r.sectionHeading('Governance principles')
  r.paragraph(
    'Principles, the council charter and the RACI matrix carry no layer tag: they apply to every ' +
      'engagement regardless of the current scope.',
    { color: SLATE, size: 8 },
  )
  for (const p of OM.principles) {
    r.pageBreakIfNeeded(24)
    r.keyValueBlock([[p.title, p.statement]], { labelWidth: 46 })
    r.text(p.rationale, { size: 8, indent: 4, color: SLATE, gapAfter: 4 })
  }

  /* ---- roles ---- */
  r.page('Role archetypes')
  r.table({
    head: ['Id', 'Archetype', 'Sits in', 'Time allocation', 'Layer', 'Status'],
    rows: roles.map((x) => [
      x.role.id,
      x.role.role,
      x.role.sitsIn,
      x.role.timeAllocation,
      x.role.layer,
      x.state === 'in-scope' ? 'In scope' : 'OUT OF SCOPE',
    ]),
    columnStyles: { 0: { cellWidth: 12 }, 4: { cellWidth: 16 }, 5: { cellWidth: 22 } },
    bodyFontSize: 7,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5 && data.cell.raw !== 'In scope')
        data.cell.styles.textColor = [180, 83, 9]
    },
  })
  if (outRoles.length > 0)
    r.paragraph(
      `${outRoles.length} archetype${outRoles.length === 1 ? '' : 's'} ` +
        `(${outRoles.map((x) => x.role.id).join(', ')}) ${outRoles.length === 1 ? 'is' : 'are'} ` +
        `outside the current layer. ${outRoles.length === 1 ? 'It is' : 'They are'} listed so the ` +
        `numbering is complete, and no accountability below is assigned to ` +
        `${outRoles.length === 1 ? 'it' : 'them'}.`,
      { size: 8 },
    )
  else r.paragraph('Every archetype in the operating model is in scope under the current layer.', { size: 8 })

  for (const x of inScopeRoles) {
    r.pageBreakIfNeeded(50)
    r.sectionHeading(`${x.role.id} · ${x.role.role}`)
    r.keyValueBlock([
      ['Sits in', x.role.sitsIn],
      ['Time allocation', x.role.timeAllocation],
    ])
    r.text('Accountable for', { size: 8, color: SLATE, gapAfter: 1 })
    r.bullets(x.role.accountableFor)
    r.text(`Failure mode — ${x.role.failureMode}`, { size: 8, color: SLATE, gapAfter: 5 })
  }

  /* ---- RACI ---- */
  r.page('Decision rights (RACI)')
  r.paragraph(
    'R responsible · A accountable · C consulted · I informed. Exactly one role may be accountable ' +
      'for an activity. Where a cell carries a qualifier in brackets, that qualifier is the scope of ' +
      'the role’s involvement, not a second code.',
    { color: SLATE, size: 8 },
  )
  const defectActivities = new Set(raciFaults.map((d) => d.activity))
  r.table({
    head: ['Activity', ...RACI_COLUMNS.map((c) => c.label)],
    rows: OM.raci.map((row) => [row.activity, ...RACI_COLUMNS.map((c) => row[c.key])]),
    columnStyles: { 0: { cellWidth: 48 } },
    bodyFontSize: 7,
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 0) return
      if (defectActivities.has(String(data.cell.raw))) data.cell.styles.textColor = [180, 83, 9]
    },
  })

  r.sectionHeading('RACI integrity')
  if (raciFaults.length === 0) {
    r.paragraph(
      `All ${OM.raci.length} activities name exactly one accountable role. The matrix is internally consistent.`,
    )
  } else {
    r.paragraph(
      `${raciFaults.length} of ${OM.raci.length} activities do not name exactly one accountable role. ` +
        `These are governance defects in the model itself, not rendering artefacts, and they are ` +
        `printed here rather than smoothed over — an activity with two A's produces a dispute that ` +
        `the matrix cannot settle, which is the situation the matrix exists to prevent.`,
    )
    r.table({
      head: ['Activity', 'Accountable roles', 'Defect'],
      rows: raciFaults.map((d) => [
        d.activity,
        d.accountable.length ? d.accountable.join(' + ') : 'None',
        d.problem,
      ]),
      columnStyles: { 0: { cellWidth: 46 }, 1: { cellWidth: 40 } },
      bodyFontSize: 7,
    })
  }

  /* ---- engagement RACI (G1) — only in engagement mode, only filled rows ---- */
  if (intakeRaci.length > 0) {
    r.sectionHeading('Engagement RACI — from the intake')
    r.paragraph(
      'The engagement’s own decision-rights rows, entered in Program Design. These are the ' +
        'engagement’s decisions, distinct from the declared matrix above, which is the ' +
        'methodology’s target model. Rows with no assignment are not printed.',
      { color: SLATE, size: 8 },
    )
    r.table({
      head: ['Activity', 'R', 'A', 'C', 'I'],
      rows: intakeRaci.map((row) => [row.activity, row.R, row.A, row.C, row.I]),
      columnStyles: { 0: { cellWidth: 60 } },
      bodyFontSize: 7,
    })
  }

  /* ---- registry-derived accountability ---- */
  r.page('Accountability resolution')
  r.paragraph(
    'Every step, checklist item and artefact names one owner as free text. The role registry ' +
      `resolves those strings to archetypes — ${registryInScope} of ${OM.roleRegistry.length} registry ` +
      'entries are in scope under the current layer. Without that mapping the RACI is prose: ' +
      '"Head of Credit Risk" and "Data Owner" are unrelated strings until something joins them.',
    { color: SLATE, size: 8 },
  )
  if (ownerFaults.length === 0) {
    r.paragraph(
      `All ${stepsInScope + checklistInScope + PLAN.artefactRegister.filter((a) => layerShows(meta.layer, a.layer)).length} ` +
        `owned records in scope resolve to exactly one archetype. No record is unowned and none names ` +
        `two accountable parties.`,
    )
  } else {
    r.paragraph(
      `${ownerFaults.length} record(s) in scope cannot be resolved to a single accountable archetype.`,
    )
    r.table({
      head: ['Record', 'Owner as stated', 'Defect'],
      rows: ownerFaults.map((d) => [d.where, d.owner, d.problem]),
      bodyFontSize: 7,
    })
  }

  r.sectionHeading('Accountability load by archetype')
  const load = new Map<string, number>()
  for (const f of flows)
    for (const s of f.steps) {
      const archetype = archetypeOf(s.owner) || 'UNRESOLVED'
      load.set(archetype, (load.get(archetype) ?? 0) + 1)
    }
  r.paragraph(
    'Steps in scope for which each in-scope archetype is the accountable owner. A zero is a real ' +
      'reading, not a gap: that archetype owns no step under this layer.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Archetype', 'Steps owned'],
    rows: inScopeRoles.map((x) => [x.role.role, load.get(x.role.role) ?? 0]),
    columnStyles: { 1: { halign: 'center', cellWidth: 26 } },
  })

  /* ---- flows and steps ---- */
  r.page('Delivery flows and steps')
  r.table({
    head: ['Flow', 'Name', 'Gates', 'Steps in scope', 'Status'],
    rows: flows.map((f) => [
      f.id,
      f.name,
      f.gateIds.length ? f.gateIds.join(', ') : 'No gate',
      `${f.steps.length} of ${f.totalSteps}`,
      f.state === 'in-scope' ? 'In scope' : 'OUT OF SCOPE',
    ]),
    columnStyles: { 0: { cellWidth: 14 }, 2: { cellWidth: 26 }, 3: { cellWidth: 26 }, 4: { cellWidth: 22 } },
    bodyFontSize: 7,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4 && data.cell.raw !== 'In scope')
        data.cell.styles.textColor = [180, 83, 9]
    },
  })
  if (outFlows.length > 0)
    r.paragraph(
      `${outFlows.map((f) => f.id).join(', ')} ${outFlows.length === 1 ? 'has' : 'have'} no step in the ` +
        `current layer. The flow and its gates remain in the model; nothing in it is executed under ` +
        `this scope.`,
      { size: 8 },
    )

  for (const f of inScopeFlows) {
    r.page(`${f.id} · ${f.name}`, f.objective)
    r.keyValueBlock([
      ['Gates', f.gateIds.length ? f.gateIds.join(', ') : 'No gate declared on this flow'],
      ['Steps in scope', `${f.steps.length} of ${f.totalSteps}`],
    ])
    r.table({
      head: ['Step', 'Stream', 'Activity', 'Owner', 'As archetype', 'Days'],
      rows: f.steps.map((s) => [
        s.id,
        s.stream,
        s.step,
        s.owner,
        archetypeOf(s.owner) || 'UNRESOLVED',
        s.durationDays,
      ]),
      columnStyles: { 0: { cellWidth: 16 }, 5: { halign: 'center', cellWidth: 14 } },
      bodyFontSize: 7,
    })
  }

  /* ---- checklist ---- */
  r.page('Mobilisation checklist')
  r.paragraph(
    `${checklistInScope} of ${PROG.checklist.length} items are in scope, grouped by the phase each ` +
      'item declares. The dataset carries no link from a checklist item to a flow or a step — the ' +
      'phase names resemble the flow names but are not the same values, so no join between them is ' +
      'asserted here. Grouping by phase is what the data supports.',
    { color: SLATE, size: 8 },
  )
  for (const p of phases) {
    r.pageBreakIfNeeded(30)
    r.sectionHeading(`${p.phase} — ${p.items.length} item${p.items.length === 1 ? '' : 's'} in scope`)
    if (p.items.length === 0) {
      r.paragraph(
        'No item in this phase is in scope under the current layer. The phase is listed so the ' +
          'sequence is complete.',
        { size: 8, color: SLATE },
      )
      continue
    }
    r.table({
      head: ['Id', 'Item', 'Artefact', 'Owner', 'As archetype', 'Blocking'],
      rows: p.items.map((c) => [
        c.id,
        c.item,
        c.artefact,
        c.owner,
        archetypeOf(c.owner) || 'UNRESOLVED',
        c.blocking ? 'BLOCKING' : 'No',
      ]),
      columnStyles: { 0: { cellWidth: 14 }, 5: { cellWidth: 20 } },
      bodyFontSize: 7,
    })
  }

  /* ---- council ---- */
  r.page('Data Governance Council')
  r.paragraph(OM.council.charterPurpose)
  r.keyValueBlock([
    ['Chair', OM.council.chair],
    ['Cadence', OM.council.cadence],
    ['Quorum', OM.council.quorum],
  ])
  r.sectionHeading('Members')
  r.bullets(OM.council.members)
  r.sectionHeading('Decision rights')
  r.bullets(OM.council.decisionRights)
  r.sectionHeading('Escalation path')
  r.bullets(OM.council.escalationPath)

  /* ---- engagement council parameters (G1) — only non-empty intake fields ---- */
  if (councilParams.length > 0) {
    r.sectionHeading('Engagement council parameters — from the intake')
    r.paragraph(
      'The engagement’s own decisions for this council, entered in Program Design. Fields left ' +
        'empty in the intake are omitted here, never defaulted from the reference model above.',
      { color: SLATE, size: 8 },
    )
    r.keyValueBlock(councilParams)
  }

  return r.build()
}
