/**
 * Banking reference model mapping — CSV primary, PDF summary.
 *
 * Every governed element mapped to the reference-model entity it realises: 53
 * entities over 76 elements. This is the pack a Data Architect uses to argue that
 * the CDE register is anchored in an industry model rather than invented, which
 * is the accelerator `positioning.json` sells and the reason `fsdmEntity` is
 * authored on every element.
 *
 * ─── ONE DIRECTION ONLY, AND THE OTHER IS NOT AVAILABLE ────────────────────
 *
 * ELEMENT → ENTITY is authored and complete: every element names its entity.
 *
 * ENTITY → ELEMENT is a different claim and it is only half computable. This
 * document can say which entities the register reaches. It CANNOT say which
 * entities the register reaches NOTHING of, because the reference model's own
 * catalogue is not in this repo — only the 53 entity names our elements happen
 * to cite. "53 entities mapped" is a fact; "53 of N entities mapped" is not
 * available at any N, and a coverage percentage against an unknown denominator
 * is the shape this suite has been burned by before.
 *
 * So there is no coverage figure, no gap list and no percentage anywhere in this
 * document, and the CSV states the direction on every row. That is not caution
 * about a number being low; the number does not exist.
 *
 * ─── THE MULTI-SOURCED ENTITIES ARE THE INTERESTING PART ───────────────────
 *
 * Eleven of the 53 entities are realised by more than one source system —
 * Agreement Balance by four (loans, accounts, cards, the IFRS 9 engine),
 * Agreement Classification by four. That is a real property of a bank and it is
 * called out because it is the work list the mapping produces: an entity with
 * four sources is where a definition dispute and a reconciliation both live.
 *
 * It is NOT a system-of-record designation, and this document must never present
 * it as one. AR-14 was renamed to a designation GAP register for exactly this
 * reason — a designation field does not exist, and an entity with one source is
 * an absence of a second row rather than a decision anybody took.
 *
 * Determinism: no clock, no randomness. Rows sorted by entity then element id;
 * entities rendered in that same sorted order.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { byStringKey, type CsvColumn } from '../../report/csv'
import { cdesInScope, groupBy, ruleCountByCde, scopeLine, ALL_CDES } from './cdeJoins'

/**
 * implementationPlan.json → artefactRegister: "Banking reference model mapping",
 * rung 2, owned by the Data Architect, format "Mapping pack", banking layer.
 * Marked `derived` against `cdeRegister.json` — see ARTEFACT-EVIDENCE.
 */
export const REFERENCE_MODEL_ARTEFACT_ID = 'AR-20'

/** Stated on every row, because a mapping pack is read as bidirectional. */
export const MAPPING_DIRECTION = 'Element to entity only — reverse coverage not computable'

/** The boundary sentence, on the cover, in the summary and in the card blurb. */
export const REFERENCE_MODEL_BOUNDARY =
  'This maps elements onto reference-model entities. It does not measure coverage OF the ' +
  'reference model: the model’s own catalogue is not held here, only the entity names our ' +
  'elements cite, so which entities nothing maps cannot be computed and no percentage is ' +
  'given. Multiple source systems on one entity is a work list, never a system-of-record ' +
  'designation — no designation exists in any dataset.'

export interface ReferenceModelInput {
  meta: ReportMeta
}

export interface ReferenceModelRow {
  fsdmEntity: string
  cdeId: string
  element: string
  domain: string
  sourceSystem: string
  criticality: string
  dqRuleCount: number
  layer: string
  mappingDirection: string
}

const COLUMNS: CsvColumn<ReferenceModelRow>[] = [
  { key: 'fsdmEntity', header: 'Reference-model entity' },
  { key: 'cdeId', header: 'CDE ID' },
  { key: 'element', header: 'Element' },
  { key: 'domain', header: 'Domain' },
  { key: 'sourceSystem', header: 'Source system' },
  { key: 'criticality', header: 'Criticality' },
  { key: 'dqRuleCount', header: 'DQ rules in scope' },
  { key: 'layer', header: 'Layer' },
  { key: 'mappingDirection', header: 'Mapping direction' },
]

export function buildReferenceModelRows(input: ReferenceModelInput): {
  rows: ReferenceModelRow[]
  columns: CsvColumn<ReferenceModelRow>[]
} {
  const { layer } = input.meta
  const counts = ruleCountByCde(layer)
  const rows = cdesInScope(layer).map((c) => ({
    fsdmEntity: c.fsdmEntity,
    cdeId: c.id,
    element: c.element,
    domain: c.domain,
    sourceSystem: c.sourceSystem,
    criticality: c.criticality,
    dqRuleCount: counts.get(c.id) ?? 0,
    layer: c.layer,
    mappingDirection: MAPPING_DIRECTION,
  }))
  // Entity first, element id second. Both keys are needed: entity ties for the
  // eleven multi-element entities, and the id breaks it deterministically.
  rows.sort(byStringKey((r) => `${r.fsdmEntity}${r.cdeId}`))
  return { rows, columns: COLUMNS }
}

export function buildReferenceModelPdf(input: ReferenceModelInput): jsPDF {
  const { meta } = input
  const { rows } = buildReferenceModelRows(input)
  const byEntity = groupBy(rows, (x) => x.fsdmEntity)

  // Entity AND element, because the document renders both. An element moving to
  // another entity changes this pack without changing the element set.
  const r = createReport(meta, contentKey(rows.map((x) => `${x.fsdmEntity}|${x.cdeId}`)))
  r.cover('Banking Reference Model Mapping', `${rows.length} elements across ${byEntity.size} entities`)

  const multi = [...byEntity.entries()].filter(([, v]) => new Set(v.map((x) => x.sourceSystem)).size > 1)

  r.page('Mapping summary')
  r.keyValueBlock([
    ['Elements mapped', `${rows.length} of ${ALL_CDES}`],
    ['Entities reached', `${byEntity.size}`],
    ['Entities with several sources', `${multi.length}`],
    ['Mapping direction', MAPPING_DIRECTION],
  ])
  r.paragraph(REFERENCE_MODEL_BOUNDARY, { color: SLATE, size: 8 })
  r.paragraph(scopeLine(meta.layer, rows.length), { color: SLATE, size: 8 })

  r.sectionHeading('Entities by element count')
  r.table({
    head: ['Entity', 'Elements', 'Domains', 'Systems', 'DQ rules'],
    rows: [...byEntity.entries()].map(([k, v]) => [
      k,
      v.length,
      new Set(v.map((x) => x.domain)).size,
      new Set(v.map((x) => x.sourceSystem)).size,
      v.reduce((s, x) => s + x.dqRuleCount, 0),
    ]),
    columnStyles: {
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
    },
    bodyFontSize: 7,
  })

  r.page('Entities realised by more than one system')
  if (multi.length === 0) {
    // Printed rather than omitted. Under a core-only engagement this is genuinely
    // empty, and a section that disappears when it finds nothing is
    // indistinguishable from one that was never run.
    r.paragraph(
      'No entity in this scope is realised by more than one source system. That is a property of ' +
        'the layer filter rather than of the register — the full register has eleven — and it is ' +
        'printed rather than omitted so an empty result is distinguishable from a section that ' +
        'did not run.',
    )
  } else {
    r.paragraph(
      `${multi.length} entit${multi.length === 1 ? 'y is' : 'ies are'} realised by more than one ` +
        'source system. Each is where a definition dispute and a reconciliation both live, and ' +
        'each is a candidate for a system-of-record designation that nobody has yet made. This ' +
        'is a work list. It is not a designation and must not be read as one — AR-14 is the gap ' +
        'register that tracks the decision.',
    )
    r.table({
      head: ['Entity', 'Systems', 'Elements'],
      rows: multi.map(([k, v]) => [k, [...new Set(v.map((x) => x.sourceSystem))].sort().join('; '), v.length]),
      columnStyles: { 2: { halign: 'center', cellWidth: 20 } },
      bodyFontSize: 7,
    })
  }

  r.page('Mapping detail', 'Every element in scope, by entity.')
  r.table({
    head: ['Entity', 'CDE', 'Element', 'Source system', 'Criticality'],
    rows: rows.map((x) => [x.fsdmEntity, x.cdeId, x.element, x.sourceSystem, x.criticality]),
    columnStyles: { 1: { cellWidth: 18 } },
    bodyFontSize: 6.5,
  })

  return r.build()
}
