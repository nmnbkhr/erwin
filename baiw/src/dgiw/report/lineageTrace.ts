/**
 * Illustrative backward-lineage trace — CSV primary, PDF summary.
 *
 * ═══ THIS IS NOT LINEAGE. TWO AUTHORED HOPS. ═══════════════════════════════
 *
 * Read this before changing anything in this file.
 *
 * `cdeRegister.json` authors exactly two things about where an element sits:
 * one `sourceSystem`, and three to five `consumers`. Inverting `consumers` gives
 *
 *     consumption point → element → source system
 *
 * and that is the entire depth available. There is NO transformation logic, no
 * intermediate table, no staging layer, no column-level detail and no hop count
 * anywhere in this repo. What this document renders is the METHOD — how scope is
 * derived backwards from consumption, which is P02's principle and rung 1's whole
 * pitch — demonstrated on real elements. It is not a lineage graph and cannot be
 * refined into one by rendering it more carefully.
 *
 * ─── AR-25 IS THE SAME DATA WITH THIS SENTENCE REMOVED ─────────────────────
 *
 * "End-to-end lineage for governed CDEs" is catalogued as AR-25 and is BLOCKED,
 * on AR-22, because building it means inventing the hops between the two
 * endpoints this file renders. The register records that. The difference between
 * the artefact you are reading and the one that is blocked is one boundary
 * statement, and dropping it from a cover is precisely how AR-25 gets built on
 * momentum by someone who sees a working traversal and extends it.
 *
 * So the statement is on the COVER, in the summary, on every trace page and on
 * every CSV row. The word "Illustrative" is in the artefact's own catalogued name
 * and is on the cover as a subtitle rather than as small print.
 *
 * ─── HOW THE TWO OR THREE POINTS ARE SELECTED ──────────────────────────────
 *
 * Not arbitrary, and stated on the page. Consumption points are ranked by, in
 * order: how many in-scope elements feed them, then the in-scope DQ rule count
 * across those elements, then the point's name. All three keys are deterministic
 * and computed under the ACTIVE LAYER, so a core-only engagement legitimately
 * gets a different three. Ties break on the name, which is why the third key
 * exists — two points with equal feeders and equal rules would otherwise depend
 * on file order.
 *
 * The name is the tiebreaker and NOT a merge key. `consumers` is free text and
 * unnormalised: "eCIB" and "eCIB submission" are the same regulatory return
 * written two ways, and they rank as two points. Normalising them would be a
 * judgement about which strings mean the same thing that no dataset supports —
 * the same bridge AR-07 and AR-34 were blocked and withdrawn for. The document
 * says so instead of quietly merging.
 *
 * Determinism: no clock, no randomness. The rank is a total order on three keys
 * and every list is sorted before it is rendered.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { byStringKey, type CsvColumn } from '../../report/csv'
import { cdesInScope, ownerArchetype, ruleCountByCde, scopeLine } from './cdeJoins'
import type { CriticalDataElement } from '../types'

/**
 * implementationPlan.json → artefactRegister: "Illustrative backward-lineage
 * trace", rung 1, owned by the DG Office, format "Lineage exhibit". Marked
 * `derived` against `cdeRegister.json` — see ARTEFACT-EVIDENCE. AR-25, the
 * end-to-end lineage graph, is marked `blocked` in the same register.
 */
export const LINEAGE_TRACE_ARTEFACT_ID = 'AR-05'

/** How many consumption points the exhibit traces. The ladder says two to three. */
export const TRACE_COUNT = 3

/** Stated on every row. A CSV of a "lineage" artefact is read as lineage. */
export const TRACE_DEPTH = '2 authored hops — not lineage, no transformation logic'

/** The boundary sentence, on the cover, on every page and in the card blurb. */
export const LINEAGE_BOUNDARY =
  'THIS IS NOT LINEAGE. Two authored hops — consumption point to element to source system — and ' +
  'nothing between them. No transformation logic, no intermediate table, no column-level detail ' +
  'and no hop count exists in any dataset here. This exhibit demonstrates the derivation METHOD ' +
  'on real elements; it is not a lineage graph and must not be presented as one. End-to-end ' +
  'lineage is catalogued separately as AR-25 and is blocked until lineage is harvested.'

/** Why two spellings of one return rank as two points. */
export const UNNORMALISED_NOTE =
  'Consumption points are free text and unnormalised — "eCIB" and "eCIB submission" are one ' +
  'regulatory return written two ways and rank separately. Merging them would be a judgement ' +
  'about which strings mean the same thing that no dataset supports.'

export interface LineageTraceInput {
  meta: ReportMeta
}

export interface TraceRow {
  consumptionPoint: string
  rank: number
  cdeId: string
  element: string
  domain: string
  criticality: string
  sourceSystem: string
  fsdmEntity: string
  dqRuleCount: number
  ownerArchetype: string
  layer: string
  traceDepth: string
}

const COLUMNS: CsvColumn<TraceRow>[] = [
  { key: 'consumptionPoint', header: 'Consumption point' },
  { key: 'rank', header: 'Rank' },
  { key: 'cdeId', header: 'CDE ID' },
  { key: 'element', header: 'Element' },
  { key: 'domain', header: 'Domain' },
  { key: 'criticality', header: 'Criticality' },
  { key: 'sourceSystem', header: 'Source system' },
  { key: 'fsdmEntity', header: 'Reference-model entity' },
  { key: 'dqRuleCount', header: 'DQ rules in scope' },
  { key: 'ownerArchetype', header: 'Owner archetype (resolved)' },
  { key: 'layer', header: 'Layer' },
  { key: 'traceDepth', header: 'Trace depth' },
]

export interface SelectedPoint {
  point: string
  feeders: CriticalDataElement[]
  rules: number
  critical: number
}

/**
 * The ranked consumption points, most-evidenced first.
 *
 * Returns the whole ranking rather than the top N so the document can print how
 * far down it cut and what it left — a selection that shows only its winners
 * cannot be checked by a reader.
 */
export function rankConsumptionPoints(meta: ReportMeta): SelectedPoint[] {
  const cdes = cdesInScope(meta.layer)
  const counts = ruleCountByCde(meta.layer)
  const byPoint = new Map<string, CriticalDataElement[]>()
  for (const c of cdes) for (const p of c.consumers) byPoint.set(p, [...(byPoint.get(p) ?? []), c])

  const ranked = [...byPoint.entries()].map(([point, feeders]) => ({
    point,
    feeders: [...feeders].sort(byStringKey((c) => c.id)),
    rules: feeders.reduce((s, c) => s + (counts.get(c.id) ?? 0), 0),
    critical: feeders.filter((c) => c.criticality === 'CRITICAL').length,
  }))
  // Three keys, total order, no file-order dependency. See the header comment.
  ranked.sort((a, b) => b.feeders.length - a.feeders.length || b.rules - a.rules || (a.point < b.point ? -1 : a.point > b.point ? 1 : 0))
  return ranked
}

export function buildLineageTraceRows(input: LineageTraceInput): {
  rows: TraceRow[]
  columns: CsvColumn<TraceRow>[]
} {
  const { layer } = input.meta
  const counts = ruleCountByCde(layer)
  const selected = rankConsumptionPoints(input.meta).slice(0, TRACE_COUNT)
  const rows = selected.flatMap((s, i) =>
    s.feeders.map((c) => ({
      consumptionPoint: s.point,
      rank: i + 1,
      cdeId: c.id,
      element: c.element,
      domain: c.domain,
      criticality: c.criticality,
      sourceSystem: c.sourceSystem,
      fsdmEntity: c.fsdmEntity,
      dqRuleCount: counts.get(c.id) ?? 0,
      ownerArchetype: ownerArchetype(c),
      layer: c.layer,
      traceDepth: TRACE_DEPTH,
    })),
  )
  // Rank first so the CSV reads in the same order as the exhibit, id second so
  // rows within one trace are stable.
  rows.sort(byStringKey((r) => `${r.rank}${r.cdeId}`))
  return { rows, columns: COLUMNS }
}

export function buildLineageTracePdf(input: LineageTraceInput): jsPDF {
  const { meta } = input
  const ranked = rankConsumptionPoints(meta)
  const selected = ranked.slice(0, TRACE_COUNT)
  const cdes = cdesInScope(meta.layer)
  // Hoisted: building this per row would rebuild the whole rule index 76 times.
  const counts = ruleCountByCde(meta.layer)

  // Point AND element, because the exhibit renders both and a change to either
  // is a different document.
  const r = createReport(
    meta,
    contentKey(selected.flatMap((s) => s.feeders.map((c) => `${s.point}|${c.id}`))),
  )
  r.cover(
    'Illustrative Backward-Lineage Trace',
    `${selected.length} consumption points · two authored hops · NOT LINEAGE`,
  )

  r.page('What this exhibit is, and is not')
  r.paragraph(LINEAGE_BOUNDARY)
  r.sectionHeading('The two hops')
  r.bullets([
    'Hop one — consumption point to element. Authored: every element names the three to five consumption points that make it critical, which is what "derive scope backwards from consumption" means in practice.',
    'Hop two — element to source system. Authored: every element names the one system it is sourced from.',
    'Between them: nothing. No transformation, no staging table, no column, no ordering. That is the honest depth of this dataset and no rendering choice changes it.',
  ])
  r.paragraph(scopeLine(meta.layer, cdes.length), { color: SLATE, size: 8 })

  r.page('How these points were selected')
  r.paragraph(
    `${ranked.length} consumption points are reachable in this scope. The ${selected.length} traced ` +
      'here are the top of a ranking, not a choice: points are ordered by how many in-scope ' +
      'elements feed them, then by the in-scope DQ rule count across those elements, then by name. ' +
      'All three keys are deterministic and all three are computed under the active layer, so a ' +
      'core-only engagement legitimately traces a different set.',
  )
  r.paragraph(UNNORMALISED_NOTE, { color: SLATE, size: 8 })
  r.sectionHeading(`The ranking — top ${Math.min(8, ranked.length)} of ${ranked.length}`)
  r.table({
    head: ['#', 'Consumption point', 'Elements', 'DQ rules', 'Critical', 'Traced'],
    rows: ranked.slice(0, 8).map((s, i) => [
      i + 1,
      s.point,
      s.feeders.length,
      s.rules,
      s.critical,
      i < TRACE_COUNT ? 'yes' : '',
    ]),
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 18 },
    },
    bodyFontSize: 7,
  })

  for (const [i, s] of selected.entries()) {
    r.page(`Trace ${i + 1} · ${s.point}`, `${s.feeders.length} elements · two authored hops · not lineage`)
    r.paragraph(
      `Reading backwards from ${s.point}: these are the governed elements that feed it, and the ` +
        'systems those elements are sourced from. What happens between the system and the ' +
        'consumption point is not recorded anywhere in this register.',
      { size: 8 },
    )
    r.table({
      head: ['CDE', 'Element', 'Source system', 'Entity', 'Criticality', 'Rules'],
      rows: s.feeders.map((c) => [
        c.id,
        c.element,
        c.sourceSystem,
        c.fsdmEntity,
        c.criticality,
        counts.get(c.id) ?? 0,
      ]),
      columnStyles: { 0: { cellWidth: 18 }, 5: { halign: 'center', cellWidth: 16 } },
      bodyFontSize: 6.5,
    })
    r.sectionHeading('Systems reached')
    r.paragraph([...new Set(s.feeders.map((c) => c.sourceSystem))].sort().join(' · '), { size: 8, color: SLATE })
    r.paragraph(TRACE_DEPTH, { size: 7, color: SLATE })
  }

  return r.build()
}
