/**
 * Data landscape map — CSV primary, PDF summary.
 *
 * The first of these four pivots whose row is NOT an element. The grain is the
 * SOURCE SYSTEM: 32 of them, each with the elements it holds, their criticality,
 * the domains they belong to, the reference-model entities they realise and the
 * consumption points they ultimately feed.
 *
 * ─── THE ADJACENCY IS ONE HOP EACH, AND THE WORD "MAP" IS DOING WORK ───────
 *
 * A data landscape map is usually read as a topology: systems with arrows
 * between them, interfaces, directions, batch windows. NONE of that is in any
 * dataset here. There is no system-to-system relation of any kind — no
 * interface, no feed, no dependency, no direction.
 *
 * What IS authored is a per-element star: the element names one source system
 * and three to five consumption points. So the adjacency this document renders is
 *
 *     system → domain → consumption point
 *
 * one hop each, joined THROUGH the element and never system to system. Two
 * systems appearing against one consumption point means both feed it; it does
 * NOT mean one feeds the other, and inferring an arrow between them is the
 * fabrication this file exists not to commit. It is stated on the cover, in the
 * summary, on the adjacency page and on every CSV row.
 *
 * ─── THE OWNERSHIP SECTION IS EMPTY AND PRINTS ITS ZERO ────────────────────
 *
 * Rung 1's scope names "ownership gaps" as part of this artefact. There are
 * none: 76 of 76 owner strings resolve through `roleRegistry`, measured, and the
 * gate asserts it (OWNER-UNRESOLVED). The section is rendered anyway with the
 * zero and the reason.
 *
 * A section that vanishes when it finds nothing is indistinguishable from a
 * section that was never run, which is the VACUOUS rule one level up and the
 * same argument `notes.ts::RETAINED_IS_STRUCTURAL` makes for rendering the empty
 * "only partly in scope" table. An engagement lead who sees no ownership section
 * concludes the analysis was not done; one who sees "0 of 76 unresolved"
 * concludes the register is owned.
 *
 * Determinism: no clock, no randomness. Systems sorted by name, and every
 * derived list inside a row is sorted before it is joined.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { byStringKey, type CsvColumn } from '../../report/csv'
import { cdesInScope, groupBy, ownerArchetype, scopeLine, UNRESOLVED_OWNER, ALL_CDES } from './cdeJoins'

/**
 * implementationPlan.json → artefactRegister: "Data landscape map", rung 1,
 * owned by the Data Architect, format "Diagram + register". Marked `derived`
 * against `cdeRegister.json` — see ARTEFACT-EVIDENCE. The register half is this
 * document; the diagram half is the adjacency grid, which is what the data
 * supports and is labelled as such.
 */
export const DATA_LANDSCAPE_ARTEFACT_ID = 'AR-02'

/** Stated on every row, because "map" is read as a topology. */
export const ADJACENCY_BASIS =
  'System to domain to consumption, one hop each — no system-to-system flow in source'

/** The boundary sentence, on the cover, in the summary and in the card blurb. */
export const LANDSCAPE_BOUNDARY =
  'There is no system-to-system relation in any dataset — no interface, feed, dependency or ' +
  'direction. Every adjacency here is joined THROUGH an element: system to domain, and system to ' +
  'consumption point, one hop each. Two systems against one consumption point means both feed ' +
  'it, never that one feeds the other. This is an inventory with an adjacency grid; it is not a ' +
  'topology and no arrow between two systems can be drawn from it.'

export interface DataLandscapeInput {
  meta: ReportMeta
}

export interface LandscapeRow {
  sourceSystem: string
  elements: number
  critical: number
  high: number
  domains: string
  fsdmEntities: number
  consumptionPoints: number
  ownerArchetypes: string
  layers: string
  adjacencyBasis: string
}

const COLUMNS: CsvColumn<LandscapeRow>[] = [
  { key: 'sourceSystem', header: 'Source system' },
  { key: 'elements', header: 'Elements' },
  { key: 'critical', header: 'Critical' },
  { key: 'high', header: 'High' },
  { key: 'domains', header: 'Domains' },
  { key: 'fsdmEntities', header: 'Reference-model entities' },
  { key: 'consumptionPoints', header: 'Consumption points fed' },
  { key: 'ownerArchetypes', header: 'Owner archetypes' },
  { key: 'layers', header: 'Layers' },
  { key: 'adjacencyBasis', header: 'Adjacency basis' },
]

export function buildDataLandscapeRows(input: DataLandscapeInput): {
  rows: LandscapeRow[]
  columns: CsvColumn<LandscapeRow>[]
} {
  const cdes = cdesInScope(input.meta.layer)
  const rows = [...groupBy(cdes, (c) => c.sourceSystem).entries()].map(([system, items]) => ({
    sourceSystem: system,
    elements: items.length,
    critical: items.filter((c) => c.criticality === 'CRITICAL').length,
    high: items.filter((c) => c.criticality === 'HIGH').length,
    domains: [...new Set(items.map((c) => c.domain))].sort().join('; '),
    fsdmEntities: new Set(items.map((c) => c.fsdmEntity)).size,
    consumptionPoints: new Set(items.flatMap((c) => c.consumers)).size,
    ownerArchetypes: [...new Set(items.map((c) => ownerArchetype(c)))].sort().join('; '),
    layers: [...new Set(items.map((c) => c.layer))].sort().join('; '),
    adjacencyBasis: ADJACENCY_BASIS,
  }))
  rows.sort(byStringKey((x) => x.sourceSystem))
  return { rows, columns: COLUMNS }
}

export function buildDataLandscapePdf(input: DataLandscapeInput): jsPDF {
  const { meta } = input
  const { rows } = buildDataLandscapeRows(input)
  const cdes = cdesInScope(meta.layer)
  const unresolved = cdes.filter((c) => ownerArchetype(c) === UNRESOLVED_OWNER)
  const domains = [...new Set(cdes.map((c) => c.domain))].sort()

  // The system→element assignment, not just the system names. Moving one element
  // to another system changes every count on the page while the system set is
  // unchanged, and the /ID has to move with it.
  const r = createReport(meta, contentKey(cdes.map((c) => `${c.sourceSystem}|${c.id}`)))
  r.cover('Data Landscape Map', `${rows.length} source systems · ${cdes.length} governed elements`)

  r.page('Landscape summary')
  r.keyValueBlock([
    ['Source systems', `${rows.length}`],
    ['Elements', `${cdes.length} of ${ALL_CDES}`],
    ['Domains', `${domains.length}`],
    ['Consumption points', `${new Set(cdes.flatMap((c) => c.consumers)).size}`],
    ['Adjacency basis', ADJACENCY_BASIS],
  ])
  r.paragraph(LANDSCAPE_BOUNDARY, { color: SLATE, size: 8 })
  r.paragraph(scopeLine(meta.layer, cdes.length), { color: SLATE, size: 8 })

  r.page('System inventory')
  r.table({
    head: ['Source system', 'Elements', 'Critical', 'Entities', 'Consumption points'],
    rows: rows.map((x) => [x.sourceSystem, x.elements, x.critical, x.fsdmEntities, x.consumptionPoints]),
    columnStyles: {
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 28 },
    },
    bodyFontSize: 7,
  })

  r.page('System × domain adjacency', 'Joined through the element. A mark means this system holds at least one element in this domain.')
  r.paragraph(LANDSCAPE_BOUNDARY, { color: SLATE, size: 8 })
  // The grid is derived from the domain list, never from a literal column count —
  // hand-placed geometry from a literal that happens to fit today is D-006.
  r.table({
    head: ['Source system', ...domains.map((d) => d.replace(/ & /g, ' &\n'))],
    rows: rows.map((x) => [
      x.sourceSystem,
      ...domains.map((d) => (x.domains.split('; ').includes(d) ? '•' : '')),
    ]),
    columnStyles: Object.fromEntries(
      domains.map((_, i) => [i + 1, { halign: 'center' as const, cellWidth: 'auto' as const }]),
    ),
    headFontSize: 5.5,
    bodyFontSize: 6.5,
  })

  r.page('Consumption points by system', 'What each system ultimately feeds, one hop through the element.')
  for (const [system, items] of groupBy(cdes, (c) => c.sourceSystem)) {
    const points = [...new Set(items.flatMap((c) => c.consumers))].sort()
    r.sectionHeading(`${system} — ${points.length} consumption point${points.length === 1 ? '' : 's'}`)
    r.paragraph(points.join(' · '), { size: 7, color: SLATE })
  }

  r.page('Ownership')
  // Rendered whether or not it finds anything. See the header comment: a section
  // that vanishes on an empty result reads as a section that was never run.
  r.keyValueBlock([
    ['Elements in scope', `${cdes.length}`],
    ['Owners resolved', `${cdes.length - unresolved.length} of ${cdes.length}`],
    ['Ownership gaps', `${unresolved.length}`],
  ])
  if (unresolved.length === 0) {
    r.paragraph(
      `There are no ownership gaps. All ${cdes.length} elements in scope name an owner that ` +
        'resolves to a governance archetype through the role registry — zero unresolved, and the ' +
        'suite gate asserts it on every build (OWNER-UNRESOLVED). This section is printed with its ' +
        'zero rather than omitted: a missing ownership section reads as an analysis that was not ' +
        'done, and "no gaps found" and "not looked for" are opposite findings that must not ' +
        'produce the same page.',
    )
  } else {
    r.paragraph(
      `${unresolved.length} element${unresolved.length === 1 ? '' : 's'} name an owner that is not ` +
        'in the role registry. Each is either a role that needs adding to the operating model or a ' +
        'title that needs correcting at source. It is not a blank.',
    )
    r.table({
      head: ['CDE ID', 'Element', 'Owner (as stated)'],
      rows: unresolved.map((c) => [c.id, c.element, c.ownerRole]),
      columnStyles: { 0: { cellWidth: 22 } },
      bodyFontSize: 7,
    })
  }

  return r.build()
}
