/**
 * DQ rule specification — CSV primary, PDF summary.
 *
 * Same shape as the CDE register: the CSV is what a data engineer works from
 * when implementing the rules, the PDF is the page that goes in the pack.
 *
 * The one thing this generator refuses to do quietly is drop a rule. A rule whose
 * CDE is not present under the current layer is a dataset inconsistency — either
 * the rule is tagged to the wrong layer or the element is. Silently filtering it
 * out would leave a bank implementing a rule set with a hole in it and no way to
 * know. It stays in the register, flagged, and it is counted on the summary page.
 */
import type jsPDF from 'jspdf'
import { createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { byStringKey, type CsvColumn } from '../../report/csv'
import { layerShows } from '../layer'
import cdeRegister from '../data/cdeRegister.json'
import dqRules from '../data/dqRules.json'
import type { CriticalDataElement, DqRule } from '../types'

const CDES = cdeRegister as CriticalDataElement[]
const RULES = dqRules as DqRule[]

/**
 * implementationPlan.json → artefactRegister: "Deployed DQ rule set", rung 3,
 * owned by the Data Steward. AR-28 ("Published DQ scorecard") is the dashboard
 * that reports on these rules, not the specification of them.
 */
export const DQ_RULE_SPEC_ARTEFACT_ID = 'AR-27'

/** Marks a rule whose CDE is out of scope under the current layer. */
export const CDE_OUT_OF_SCOPE = 'CDE NOT IN SCOPE FOR THIS LAYER'
/** Marks a rule whose CDE does not exist in the register at all. */
export const CDE_MISSING = 'CDE NOT FOUND IN REGISTER'

export interface DqRuleSpecInput {
  meta: ReportMeta
}

export interface DqRuleRow {
  id: string
  name: string
  family: string
  dimension: string
  severity: string
  layer: string
  threshold: string
  expression: string
  remediation: string
  cdeId: string
  cdeName: string
  cdeCriticality: string
  cdeStatus: string
}

const COLUMNS: CsvColumn<DqRuleRow>[] = [
  { key: 'id', header: 'Rule ID' },
  { key: 'name', header: 'Rule' },
  { key: 'family', header: 'Family' },
  { key: 'dimension', header: 'DQ dimension' },
  { key: 'severity', header: 'Severity' },
  { key: 'layer', header: 'Layer' },
  { key: 'threshold', header: 'Threshold' },
  { key: 'expression', header: 'Expression' },
  { key: 'remediation', header: 'Remediation' },
  { key: 'cdeId', header: 'CDE ID' },
  { key: 'cdeName', header: 'CDE' },
  { key: 'cdeCriticality', header: 'CDE criticality' },
  { key: 'cdeStatus', header: 'CDE status' },
]

/** True when this row's CDE could not be resolved in the current scope. */
export function isCdeUnresolved(row: DqRuleRow): boolean {
  return row.cdeStatus !== 'in scope'
}

/**
 * Rows for the current layer, sorted by rule id — the same declared-order rule
 * the CDE register follows, and for the same reason: dqRules.json is in id order
 * today, so this changes no bytes, and it stops a future dataset edit from
 * reordering a delivered specification for no stated reason.
 */
export function buildDqRuleSpecRows(input: DqRuleSpecInput): {
  rows: DqRuleRow[]
  columns: CsvColumn<DqRuleRow>[]
} {
  const { layer } = input.meta
  const byId = new Map(CDES.map((c) => [c.id, c]))
  const inScope = new Set(CDES.filter((c) => layerShows(layer, c.layer)).map((c) => c.id))

  const rows = RULES.filter((r) => layerShows(layer, r.layer)).map((r) => {
    const cde = byId.get(r.cdeRef)
    const status = !cde ? CDE_MISSING : inScope.has(cde.id) ? 'in scope' : CDE_OUT_OF_SCOPE
    return {
      id: r.id,
      name: r.name,
      family: r.family,
      dimension: r.dimension,
      severity: r.severity,
      layer: r.layer,
      threshold: r.threshold,
      expression: r.expression,
      remediation: r.remediation,
      cdeId: r.cdeRef,
      // The CDE's own fields are still reported when it is out of scope — the
      // reader needs to see what the rule points at in order to fix the tagging.
      cdeName: cde?.element ?? '',
      cdeCriticality: cde?.criticality ?? '',
      cdeStatus: status,
    }
  })
  rows.sort(byStringKey((r) => r.id))
  return { rows, columns: COLUMNS }
}

/** Deterministic tally: first-seen order over an already-ordered row set. */
function tally(rows: DqRuleRow[], pick: (r: DqRuleRow) => string): [string, number][] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const k = pick(r) || '(none)'
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
}

export function buildDqRuleSpecPdf(input: DqRuleSpecInput): jsPDF {
  const { meta } = input
  const { rows } = buildDqRuleSpecRows(input)
  const broken = rows.filter(isCdeUnresolved)

  const r = createReport(meta)
  r.cover('Data Quality Rule Specification', `${rows.length} rules in scope`)

  r.page('Rule set summary')
  r.keyValueBlock([
    ['Rules in scope', `${rows.length} of ${RULES.length}`],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
    ['Distinct CDEs covered', `${new Set(rows.map((x) => x.cdeId)).size}`],
    ['Rules with an unresolved CDE', `${broken.length}`],
  ])
  r.paragraph(
    'This page summarises the rule set. The specification itself is the CSV of the same name, ' +
      'which carries the expression, threshold and remediation for every rule.',
    { color: SLATE, size: 8 },
  )

  r.sectionHeading('By severity')
  r.table({
    head: ['Severity', 'Rules', 'Share'],
    rows: tally(rows, (x) => x.severity).map(([k, n]) => [
      k, n, rows.length ? `${Math.round((n / rows.length) * 100)}%` : '0%',
    ]),
    columnStyles: { 1: { halign: 'center', cellWidth: 24 }, 2: { halign: 'center', cellWidth: 20 } },
  })

  r.sectionHeading('By DQ dimension')
  r.table({
    head: ['Dimension', 'Rules'],
    rows: tally(rows, (x) => x.dimension).map(([k, n]) => [k, n]),
    columnStyles: { 1: { halign: 'center', cellWidth: 24 } },
  })

  r.sectionHeading('By criticality of the element the rule protects')
  r.table({
    head: ['CDE criticality', 'Rules'],
    rows: tally(rows, (x) => x.cdeCriticality).map(([k, n]) => [k, n]),
    columnStyles: { 1: { halign: 'center', cellWidth: 24 } },
  })

  r.page('Rules with an unresolved element')
  if (broken.length === 0) {
    r.paragraph(
      'Every rule in scope points at an element that is also in scope under this layer. ' +
        'No layer-tagging inconsistency was found.',
    )
  } else {
    r.paragraph(
      `${broken.length} rule${broken.length === 1 ? '' : 's'} point at an element that is not ` +
        `available under this layer. These are NOT dropped from the specification — a rule set ` +
        `delivered with a silent hole in it is worse than one that names its own gaps. Each row ` +
        `is either a rule tagged to the wrong layer or an element that should be in scope.`,
    )
    r.table({
      head: ['Rule ID', 'Rule', 'Severity', 'CDE ID', 'Status'],
      rows: broken.map((x) => [x.id, x.name, x.severity, x.cdeId, x.cdeStatus]),
      columnStyles: { 0: { cellWidth: 20 }, 3: { cellWidth: 20 } },
      bodyFontSize: 7,
    })
  }

  return r.build()
}
