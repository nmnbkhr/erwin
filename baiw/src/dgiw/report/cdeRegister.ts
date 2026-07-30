/**
 * CDE register — CSV primary, PDF summary.
 *
 * The CSV is the deliverable. A bank's data office works this register in Excel:
 * they sort it, filter it, assign it and argue about it in review. The PDF is the
 * page that goes in the pack so a reader who is not going to open a spreadsheet
 * can still see the shape of it.
 *
 * Owner strings are free text in the dataset ("Head of Retail Operations"), and
 * roles.ts maps them to the ten governance archetypes. BOTH are emitted: the raw
 * string because that is what the bank wrote and will recognise, the archetype
 * because that is what the RACI is answered in. Where resolution fails the
 * archetype column reads UNRESOLVED — never blank, because a blank cell in a
 * spreadsheet reads as "no owner" when the truth is "owner not in the registry".
 */
import type jsPDF from 'jspdf'
import { createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { byStringKey, type CsvColumn } from '../../report/csv'
import { layerShows } from '../layer'
import { archetypeOf } from '../roles'
import cdeRegister from '../data/cdeRegister.json'
import dqRules from '../data/dqRules.json'
import type { CriticalDataElement, DqRule } from '../types'

const CDES = cdeRegister as CriticalDataElement[]
const RULES = dqRules as DqRule[]

/**
 * implementationPlan.json → artefactRegister: "Critical Data Element register",
 * rung 2, owned by the DG Office. An exact catalogue match, not an approximation.
 */
export const CDE_REGISTER_ARTEFACT_ID = 'AR-13'

/** Emitted instead of a blank when a free-text owner is not in the role registry. */
export const UNRESOLVED_OWNER = 'UNRESOLVED'

export interface CdeRegisterInput {
  meta: ReportMeta
}

/** One flattened register line. Arrays are joined; nothing is left as an object. */
export interface CdeRow {
  id: string
  element: string
  domain: string
  criticality: string
  layer: string
  ownerRaw: string
  ownerArchetype: string
  support: string
  dqDimensions: string
  dqRuleCount: number
  sourceSystem: string
  fsdmEntity: string
  consumers: string
  definition: string
}

const COLUMNS: CsvColumn<CdeRow>[] = [
  { key: 'id', header: 'CDE ID' },
  { key: 'element', header: 'Element' },
  { key: 'domain', header: 'Domain' },
  { key: 'criticality', header: 'Criticality' },
  { key: 'layer', header: 'Layer' },
  { key: 'ownerRaw', header: 'Owner (as stated)' },
  { key: 'ownerArchetype', header: 'Owner archetype (resolved)' },
  { key: 'support', header: 'Support roles' },
  { key: 'dqDimensions', header: 'DQ dimensions' },
  { key: 'dqRuleCount', header: 'DQ rules in scope' },
  { key: 'sourceSystem', header: 'Source system' },
  { key: 'fsdmEntity', header: 'FSDM entity' },
  { key: 'consumers', header: 'Consumers' },
  { key: 'definition', header: 'Definition' },
]

/**
 * Rows for the current layer, sorted by CDE id.
 *
 * The sort is declared here rather than inherited from cdeRegister.json: the
 * file happens to be in id order today, so this changes nothing, and that is the
 * point — the register's order is now a property of this function instead of an
 * accident of the dataset that a future edit can silently reverse. See
 * `byStringKey` for why it is not `localeCompare`.
 *
 * Ids are unique (check-dgiw.mjs, UNIQUE), so the comparator never ties and the
 * stability of Array#sort is not being relied on.
 *
 * `dqRuleCount` counts rules that are themselves in scope under this layer — a
 * core-only engagement should not be told a CDE carries fifteen rules when
 * twelve of them are banking rules it will never run.
 */
export function buildCdeRegisterRows(input: CdeRegisterInput): {
  rows: CdeRow[]
  columns: CsvColumn<CdeRow>[]
} {
  const { layer } = input.meta
  const rulesInScope = RULES.filter((r) => layerShows(layer, r.layer))
  const ruleCountByCde = new Map<string, number>()
  for (const r of rulesInScope) ruleCountByCde.set(r.cdeRef, (ruleCountByCde.get(r.cdeRef) ?? 0) + 1)

  const rows = CDES.filter((c) => layerShows(layer, c.layer)).map((c) => {
    const archetype = archetypeOf(c.ownerRole)
    return {
      id: c.id,
      element: c.element,
      domain: c.domain,
      criticality: c.criticality,
      layer: c.layer,
      ownerRaw: c.ownerRole,
      ownerArchetype: archetype || UNRESOLVED_OWNER,
      // Optional in the dataset. Accountability stays singular; contribution does not.
      support: (c.support ?? []).join('; '),
      dqDimensions: c.dqDimensions.join('; '),
      dqRuleCount: ruleCountByCde.get(c.id) ?? 0,
      sourceSystem: c.sourceSystem,
      fsdmEntity: c.fsdmEntity,
      consumers: c.consumers.join('; '),
      definition: c.definition,
    }
  })
  rows.sort(byStringKey((r) => r.id))
  return { rows, columns: COLUMNS }
}

/** Deterministic tally: first-seen order over an already-ordered row set. */
function tally(rows: CdeRow[], pick: (r: CdeRow) => string[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const r of rows) for (const k of pick(r)) counts.set(k, (counts.get(k) ?? 0) + 1)
  return [...counts.entries()]
}

export function buildCdeRegisterPdf(input: CdeRegisterInput): jsPDF {
  const { meta } = input
  const { rows } = buildCdeRegisterRows(input)
  const unresolved = rows.filter((r) => r.ownerArchetype === UNRESOLVED_OWNER)

  const r = createReport(meta)
  r.cover('Critical Data Element Register', `${rows.length} governed elements in scope`)

  r.page('Register summary')
  r.keyValueBlock([
    ['Elements in scope', `${rows.length} of ${CDES.length}`],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
    ['Owners resolved', `${rows.length - unresolved.length} of ${rows.length}`],
    ['DQ rules attached', `${rows.reduce((s, x) => s + x.dqRuleCount, 0)}`],
  ])
  r.paragraph(
    `This page summarises the register. The register itself is the CSV of the same name — ` +
      `that is the working artefact, and it carries every column including definitions, ` +
      `source systems and consumers.`,
    { color: SLATE, size: 8 },
  )

  r.sectionHeading('By criticality')
  r.table({
    head: ['Criticality', 'Elements', 'Share'],
    rows: tally(rows, (x) => [x.criticality]).map(([k, n]) => [
      k, n, rows.length ? `${Math.round((n / rows.length) * 100)}%` : '0%',
    ]),
    columnStyles: { 1: { halign: 'center', cellWidth: 24 }, 2: { halign: 'center', cellWidth: 20 } },
  })

  r.sectionHeading('By resolved owner archetype')
  r.table({
    head: ['Archetype', 'Elements'],
    rows: tally(rows, (x) => [x.ownerArchetype]).map(([k, n]) => [k, n]),
    columnStyles: { 1: { halign: 'center', cellWidth: 24 } },
  })

  r.sectionHeading('By DQ dimension')
  r.paragraph(
    'An element usually carries several dimensions, so these counts sum to more than the register size.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Dimension', 'Elements'],
    rows: tally(rows, (x) => x.dqDimensions.split('; ').filter(Boolean)).map(([k, n]) => [k, n]),
    columnStyles: { 1: { halign: 'center', cellWidth: 24 } },
  })

  r.page('Owner resolution')
  if (unresolved.length === 0) {
    r.paragraph(
      `Every owner string in scope resolves to a governance archetype through the role ` +
        `registry. Nothing is marked ${UNRESOLVED_OWNER}.`,
    )
  } else {
    r.paragraph(
      `${unresolved.length} element${unresolved.length === 1 ? '' : 's'} name an owner that is ` +
        `not in the role registry. The raw string is preserved in the register and the archetype ` +
        `column reads ${UNRESOLVED_OWNER}. Each one is either a role that needs adding to the ` +
        `operating model or a title that needs correcting at source — it is not a blank.`,
    )
    r.table({
      head: ['CDE ID', 'Element', 'Owner (as stated)'],
      rows: unresolved.map((x) => [x.id, x.element, x.ownerRaw]),
      columnStyles: { 0: { cellWidth: 22 } },
      bodyFontSize: 7,
    })
  }

  return r.build()
}
