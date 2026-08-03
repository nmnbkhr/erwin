/**
 * Business glossary — CSV primary, PDF summary.
 *
 * The 76 governed elements as business TERMS: what each one means, who owns it,
 * which domain it belongs to and which system it is anchored in. A steward works
 * this in Excel while resolving a contested definition; the PDF is the page that
 * goes in the pack.
 *
 * ─── THIS IS A DIFFERENT CUT OF AR-13's ROWS, NOT NEW EVIDENCE ─────────────
 *
 * Every row here is an element that is also in the CDE register. The two
 * documents differ in what they are FOR — AR-13 is the governance view
 * (criticality, rule coverage, consumption) and this is the business-term view
 * (meaning, owner, anchor) — and a reader who has both must not count 76
 * elements twice and report 152. The cover and the register summary both say so,
 * because a glossary and a register arriving in the same pack look like two
 * bodies of evidence and are one.
 *
 * ─── WHAT A GLOSSARY HAS THAT THIS DOES NOT ────────────────────────────────
 *
 * A populated glossary in a catalogue carries synonyms, an approval state, the
 * history of a contested definition, and a binding to the physical columns that
 * realise the term. NONE of the four exists in any dataset in this repo:
 *
 *   synonyms          not authored
 *   approval status   there is no approval workflow to have a state in
 *   contested history  the council arbitrates definitions (decisionRights) and
 *                     no record of an arbitration exists
 *   physical binding  AR-24, and it is BLOCKED — the apparent path is regexing
 *                     column identifiers out of DQ rule expressions, which names
 *                     several columns per element and one binding per guess
 *
 * So every row carries an `Approval status` column reading UNAPPROVED with its
 * reason, on the `UNRESOLVED_OWNER` precedent: an absent column reads as "these
 * definitions are agreed", which is a claim about the bank's governance that
 * nobody made. It is stated per row rather than once at the top because a
 * spreadsheet gets sorted, filtered and forwarded, and a header note does not
 * survive any of that.
 *
 * Determinism: no clock, no randomness. Rows sorted by term id, domains in
 * first-appearance order over that already-sorted set.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { byStringKey, type CsvColumn } from '../../report/csv'
import { cdesInScope, groupBy, ownerArchetype, scopeLine, tally, ALL_CDES } from './cdeJoins'

/**
 * implementationPlan.json → artefactRegister: "Populated business glossary",
 * rung 3, owned by the Data Steward, format "Glossary". Marked `derived` in the
 * register against `cdeRegister.json`, which is what permits this generator to
 * exist at all — see ARTEFACT-EVIDENCE.
 */
export const BUSINESS_GLOSSARY_ARTEFACT_ID = 'AR-23'

/** Stated on every row. The absence of an approval state is not an approval. */
export const APPROVAL_STATUS = 'UNAPPROVED — no approval workflow in source'

/** The boundary sentence, on the cover, in the summary and in the card blurb. */
export const GLOSSARY_BOUNDARY =
  'Unapproved. No synonyms, no approval status, no contested-term history and no binding to ' +
  'physical columns exist in any dataset — this is the authored definition of each governed ' +
  'element and nothing more. The same 76 elements appear in the CDE register (AR-13); this is a ' +
  'second view of them, not a second body of evidence.'

export interface BusinessGlossaryInput {
  meta: ReportMeta
}

export interface GlossaryRow {
  termId: string
  term: string
  definition: string
  domain: string
  ownerRaw: string
  ownerArchetype: string
  sourceSystem: string
  fsdmEntity: string
  layer: string
  approvalStatus: string
}

const COLUMNS: CsvColumn<GlossaryRow>[] = [
  { key: 'termId', header: 'Term ID' },
  { key: 'term', header: 'Term' },
  { key: 'definition', header: 'Definition' },
  { key: 'domain', header: 'Domain' },
  { key: 'ownerRaw', header: 'Owner (as stated)' },
  { key: 'ownerArchetype', header: 'Owner archetype (resolved)' },
  { key: 'sourceSystem', header: 'Anchored in' },
  { key: 'fsdmEntity', header: 'Reference-model entity' },
  { key: 'layer', header: 'Layer' },
  { key: 'approvalStatus', header: 'Approval status' },
]

export function buildBusinessGlossaryRows(input: BusinessGlossaryInput): {
  rows: GlossaryRow[]
  columns: CsvColumn<GlossaryRow>[]
} {
  const rows = cdesInScope(input.meta.layer).map((c) => ({
    termId: c.id,
    term: c.element,
    definition: c.definition,
    domain: c.domain,
    ownerRaw: c.ownerRole,
    ownerArchetype: ownerArchetype(c),
    sourceSystem: c.sourceSystem,
    fsdmEntity: c.fsdmEntity,
    layer: c.layer,
    approvalStatus: APPROVAL_STATUS,
  }))
  rows.sort(byStringKey((r) => r.termId))
  return { rows, columns: COLUMNS }
}

export function buildBusinessGlossaryPdf(input: BusinessGlossaryInput): jsPDF {
  const { meta } = input
  const { rows } = buildBusinessGlossaryRows(input)

  // The terms this glossary defines. Adding, removing or re-scoping one makes it
  // a different document and the /ID has to say so.
  const r = createReport(meta, contentKey(rows.map((x) => x.termId)))
  r.cover('Business Glossary', `${rows.length} governed terms — unapproved`)

  r.page('Glossary summary')
  r.keyValueBlock([
    ['Terms in scope', `${rows.length} of ${ALL_CDES}`],
    ['Domains', `${groupBy(rows, (x) => x.domain).size}`],
    ['Approval status', 'None. There is no approval workflow for these definitions.'],
    ['Relation to AR-13', 'Same elements, business-term view. Not additional evidence.'],
  ])
  r.paragraph(GLOSSARY_BOUNDARY, { color: SLATE, size: 8 })
  r.paragraph(scopeLine(meta.layer, rows.length), { color: SLATE, size: 8 })

  r.sectionHeading('Terms by domain')
  r.table({
    head: ['Domain', 'Terms'],
    rows: [...groupBy(rows, (x) => x.domain).entries()].map(([k, v]) => [k, v.length]),
    columnStyles: { 1: { halign: 'center', cellWidth: 24 } },
  })

  // COMPUTED, never typed in. Under a core-only engagement this is 24 elements
  // rather than 76 and the concentration is a different number; a sentence with
  // the full-register figure hardcoded would be wrong on two of the three layers.
  const archetypes = tally(rows, (x) => [x.ownerArchetype])
  const dominant = archetypes.reduce((a, b) => (b[1] > a[1] ? b : a), ['—', 0] as [string, number])

  r.sectionHeading('Ownership')
  r.paragraph(
    `${dominant[1]} of the ${rows.length} terms in scope resolve to one archetype, ${dominant[0]}. ` +
      'That is the operating model working rather than a defect: a governed element is owned by a ' +
      'business department head by definition, and P01 states that accountability sits with the ' +
      'business and never with technology. It is printed so the concentration is a stated fact ' +
      'rather than something a reader has to notice.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Owner archetype', 'Terms'],
    rows: archetypes.map(([k, n]) => [k, n]),
    columnStyles: { 1: { halign: 'center', cellWidth: 24 } },
  })

  // The index comes before the definitions. A glossary whose only route to a term
  // is reading every domain page in order is a document you cannot look anything
  // up in, which is the one thing a glossary is for.
  r.page('Term index', 'Every term in scope, alphabetical by id. Definitions follow, by domain.')
  r.table({
    head: ['Term ID', 'Term', 'Domain', 'Owner archetype', 'Status'],
    rows: rows.map((x) => [x.termId, x.term, x.domain, x.ownerArchetype, 'Unapproved']),
    columnStyles: { 0: { cellWidth: 18 }, 4: { halign: 'center', cellWidth: 22 } },
    bodyFontSize: 6.5,
  })

  // A page per domain. The definitions are the deliverable, so they are rendered
  // in full rather than truncated into a table cell.
  for (const [domain, items] of groupBy(rows, (x) => x.domain)) {
    r.page(domain, `${items.length} term${items.length === 1 ? '' : 's'} · definitions as authored`)
    for (const t of items) {
      r.sectionHeading(`${t.termId} · ${t.term}`)
      r.paragraph(t.definition, { size: 8 })
      r.keyValueBlock(
        [
          ['Owner', `${t.ownerRaw} (${t.ownerArchetype})`],
          ['Anchored in', `${t.sourceSystem} · ${t.fsdmEntity}`],
          ['Status', APPROVAL_STATUS],
        ],
        { size: 8, labelWidth: 32 },
      )
    }
  }

  return r.build()
}
