/**
 * Tooling recommendation and reference architecture — PDF only.
 *
 * ═══ POSITIONING.JSON IS A SALES DATASET. MOST OF IT MUST NOT BE HERE. ═════
 *
 * Read this before adding a field.
 *
 * This is the first generator in the suite to read `positioning.json`, and the
 * file had never been read by anything but a screen. It is not an analysis
 * dataset — it is the practice's own commercial positioning, and four of its six
 * top-level keys are written in the first person to be read by US, not by a
 * client. Measured, not assumed:
 *
 *   thesis                      "Governance does not sell as governance … same
 *                               work, materially higher close rate."
 *   wedges[].opener             sales scripts — "…that is the engagement."
 *   differentiators[].detail    first-person marketing — "We govern those."
 *   failureModes                internal qualification guidance
 *   accelerators[].effect       one of six reads "keeping the fixed-fee MARGIN
 *                               intact"
 *   toolingTiers[].posture      one of two reads "Pre-built deployment, best
 *                               MARGIN, no licence negotiation…"
 *
 * The last one matters most, because `posture` sits inside the very object this
 * document is built from. A generator that rendered a tier and its posture
 * verbatim would print our margin position on a page handed to the client whose
 * fee it describes.
 *
 * So the safe subset is taken ONCE, AT THE MODULE BOUNDARY, by projection —
 * `TIERS` below carries `tier` and `components` and cannot carry `posture`,
 * because the field is gone before any rendering code can reach it. That is
 * structural rather than a rule someone has to remember: widening it takes a
 * deliberate edit to the projection, not an absent-minded `t.posture` at a call
 * site four hundred lines away.
 *
 * `accelerators` is not read at all. It is a "what we bring" list whose value
 * statements are commercial, and nothing in a tooling recommendation needs it.
 * The eight component `note` strings ARE read: every one is technical selection
 * rationale ("Keeps lineage portable if the catalogue is later replaced"), which
 * is exactly what a Data Architect is owed.
 *
 * ─── WHAT THE DATA CANNOT DRAW ─────────────────────────────────────────────
 *
 * NO INTEGRATION EDGE EXISTS IN ANY DATASET IN THIS REPO. Not a connector
 * direction, not a protocol, not a batch window, not a dependency between two
 * products. P10's `bankingOverlay.artefacts` names "On-premise deployment
 * topology with network segregation" as an artefact and contains no topology —
 * the same self-referential gap AR-06 found in P11, where the overlay names a
 * per-use-case assessment and the use cases are absent.
 *
 * So the "diagram" the register asks for is CAPABILITY LAYERS: one labelled band
 * per capability, per tier, with NO arrows, because there are no edges to draw.
 * The absence of connectors on the page is the finding, not an omission from it.
 * Box geometry derives from `r.contentWidth` and box HEIGHT derives from the
 * wrapped line count, so nothing is cut and nothing overflows — D-006 was a
 * literal that happened to fit, and D-004 was a silent truncation.
 *
 * ─── THE TWO TIERS CANNOT BE COMPARED ROW FOR ROW ──────────────────────────
 *
 * Measured: the capability sets of the two tiers intersect in NOTHING. Tier one
 * is Catalogue/Data quality/Lineage interchange/Access/Scorecards; tier two is
 * Enterprise catalogue/Quality and MDM/Microsoft-aligned estate — and the third
 * of those is an estate posture rather than a capability at all. There is no
 * shared key, so a side-by-side matrix would need a mapping this file invented.
 *
 * That is why there is no comparison matrix and no scoring. Not taste: a matrix
 * would imply an evaluation that never happened, over a join that does not exist.
 *
 * Determinism: no clock, no randomness. Tiers and components in declared order,
 * systems sorted by name.
 */
import type jsPDF from 'jspdf'
import { MARGIN, SLATE, contentKey, createReport } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { byStringKey } from '../../report/csv'
import { cdesInScope, groupBy } from './cdeJoins'
import positioning from '../data/positioning.json'
import pillars from '../data/pillars.json'
import type { Pillar, PositioningData } from '../types'

const POS = positioning as PositioningData
const PILLARS = pillars as Pillar[]

/**
 * THE SAFE PROJECTION. `posture` is dropped here and cannot be reached
 * downstream — see the header. Do not widen this without reading what the field
 * contains.
 */
const TIERS: { tier: string; components: { capability: string; product: string; note: string }[] }[] =
  POS.toolingTiers.map((t) => ({ tier: t.tier, components: t.components }))

/**
 * implementationPlan.json → artefactRegister: "Tooling recommendation and
 * reference architecture", rung 2, owned by the Data Architect, format
 * "Document + diagram". Marked `derived` against positioning.json, pillars.json
 * and cdeRegister.json — asserted by ARTEFACT-EVIDENCE, not assumed.
 */
export const TOOLING_ARTEFACT_ID = 'AR-17'

/** The pillar whose constraints this document is written against. */
export const PLATFORM_PILLAR = 'P10'

/* ── the boundary statements ───────────────────────────────────────────── */

export const B_CAPABILITY_LAYERS =
  'A REFERENCE ARCHITECTURE HERE IS CAPABILITY LAYERS, NOT A WIRED TOPOLOGY. The bands overleaf ' +
  'are what each tier must provide, in the order a deployment stands them up. They are not ' +
  'connected because no integration edge exists in any dataset in this workbench — no connector ' +
  'direction, no protocol, no batch window, no dependency between two products.'

export const B_NO_TOPOLOGY =
  'NO DEPLOYMENT TOPOLOGY HAS BEEN DESIGNED. P10’s banking overlay names "On-premise deployment ' +
  'topology with network segregation" as an artefact and does not contain one, so this document ' +
  'cannot render it and does not imply it. A topology is a design activity against a real estate; ' +
  'nothing here substitutes for it, and the absence of arrows on the layer page is the statement, ' +
  'not an omission from it.'

export const B_GOVERNED_SCOPE =
  'THE CONNECTOR SCOPE IS WHAT THIS ENGAGEMENT GOVERNS, NOT THE BANK’S ESTATE. These are the ' +
  'systems the critical data elements in scope are sourced from. A bank runs far more systems ' +
  'than this, and reading the count below as an estate inventory would understate it by an unknown ' +
  'and unknowable margin — this workbench holds no estate inventory to compare it against.'

export const B_NOT_AN_EVALUATION =
  'THE PRODUCT NAMES ARE A RECOMMENDATION, NOT AN EVALUATION. No product was scored, trialled or ' +
  'benchmarked, and no comparison matrix is given — the two tiers share NO capability in common, ' +
  'so a row-for-row comparison would need a mapping between them that no dataset provides. Each ' +
  'entry carries the authored selection rationale and nothing more.'

export interface ToolingInput {
  meta: ReportMeta
}

export function buildToolingRecommendationPdf(input: ToolingInput): jsPDF {
  const { meta } = input
  const pillar = PILLARS.find((p) => p.id === PLATFORM_PILLAR)
  const cdes = cdesInScope(meta.layer)
  const systems = [...groupBy(cdes, (c) => c.sourceSystem).entries()]
    .map(([name, items]) => ({
      name,
      elements: items.length,
      critical: items.filter((c) => c.criticality === 'CRITICAL').length,
      domains: new Set(items.map((c) => c.domain)).size,
    }))
    .sort(byStringKey((s) => s.name))

  // Products AND the connector scope: changing either makes this a different
  // recommendation, and the /ID has to say so.
  const r = createReport(
    meta,
    contentKey([
      ...TIERS.flatMap((t) => t.components.map((c) => `${t.tier}|${c.capability}|${c.product}`)),
      ...systems.map((s) => `sys:${s.name}`),
    ]),
  )

  r.cover(
    'Tooling Recommendation and Reference Architecture',
    'Capability layers, not a wired topology',
  )

  r.page('What this recommends, and what it does not')
  r.paragraph(B_CAPABILITY_LAYERS)
  r.paragraph(B_NO_TOPOLOGY)
  r.paragraph(B_GOVERNED_SCOPE)
  r.paragraph(B_NOT_AN_EVALUATION)
  r.paragraph(
    'A note on sourcing: the tier and component wording below is taken from the practice’s own ' +
      'tooling record. That record also carries commercial positioning written for internal use — ' +
      'delivery posture, margin and pricing language — and none of it is reproduced here. This ' +
      'document renders the capability, the product and the technical selection rationale, which ' +
      'is what a Data Architect is owed and the whole of what is client-facing.',
    { color: SLATE, size: 8 },
  )

  /* ---- the recommendation ---- */
  for (const t of TIERS) {
    r.page(t.tier, `${t.components.length} components · recommendation, not an evaluation`)
    r.table({
      head: ['Capability', 'Product', 'Selection rationale'],
      rows: t.components.map((c) => [c.capability, c.product, c.note]),
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 46 } },
      bodyFontSize: 7,
    })
  }

  /* ---- the diagram: layers, no edges ---- */
  r.page('Capability layers', 'One band per capability. No arrows, because no edge exists in the data.')
  r.paragraph(B_CAPABILITY_LAYERS, { color: SLATE, size: 8 })
  for (const t of TIERS) {
    r.sectionHeading(t.tier)
    drawLayerBands(r, t.components)
  }
  r.paragraph(B_NO_TOPOLOGY, { color: SLATE, size: 8 })

  /* ---- connector scope ---- */
  r.page('Connector scope', `${systems.length} source systems the elements in scope are sourced from.`)
  r.paragraph(B_GOVERNED_SCOPE)
  r.keyValueBlock([
    ['Source systems', `${systems.length}`],
    ['Elements in scope', `${cdes.length}`],
    ['Layer scope', meta.layer === 'all' ? 'Core chassis + banking overlay' : `${meta.layer} layer only`],
    ['System-level detail', 'AR-02, the data landscape map — its CSV carries the working table'],
  ])
  r.table({
    head: ['Source system', 'Elements', 'Critical', 'Domains'],
    rows: systems.map((s) => [s.name, s.elements, s.critical, s.domains]),
    columnStyles: {
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 22 },
    },
    bodyFontSize: 7,
  })

  /* ---- the constraints this recommendation is written against ---- */
  r.page('Platform constraints', pillar?.description)
  r.sectionHeading('Core artefacts')
  r.bullets(pillar?.coreArtefacts ?? [])
  r.sectionHeading('Deliverables')
  r.bullets(pillar?.deliverables ?? [])
  if (pillar?.bankingOverlay) {
    r.sectionHeading('Banking overlay')
    r.paragraph(pillar.bankingOverlay.focus, { size: 8 })
    r.bullets(pillar.bankingOverlay.artefacts ?? [])
    // Beside the list, because the second entry of it is the topology this
    // document cannot draw. Stated at the point a reader would infer otherwise.
    r.paragraph(B_NO_TOPOLOGY, { color: SLATE, size: 8 })
    r.sectionHeading('Drivers')
    r.bullets(pillar.bankingOverlay.drivers ?? [], { size: 8 })
  }

  return r.build()
}

/**
 * One filled band per capability, stacked, with no connectors.
 *
 * GEOMETRY IS DERIVED IN BOTH DIRECTIONS. Width is `r.contentWidth` — D-006 was
 * three boxes laid out to a literal 200mm against a 195mm column, and the fix
 * in all three modules was to derive from the content width. Height derives from
 * the WRAPPED LINE COUNT at that width, so the box grows to fit its label rather
 * than the label being cut to fit the box; taking `splitTextToSize(...)[0]` would
 * be D-004's silent truncation with extra steps.
 *
 * Uses the `doc` escape hatch, so it owns its own overflow and calls `moveTo`
 * afterwards — the contract every hand-placed shape in this suite keeps.
 */
function drawLayerBands(
  r: ReturnType<typeof createReport>,
  components: { capability: string; product: string }[],
): void {
  const { doc } = r
  const width = r.contentWidth
  const padX = 3
  const size = 8
  const lh = size * 0.42
  const gap = 2

  for (const c of components) {
    doc.setFontSize(size)
    const label = `${c.capability} — ${c.product}`
    const lines = doc.splitTextToSize(label, width - padX * 2) as string[]
    const height = lines.length * lh + 5
    r.pageBreakIfNeeded(height + gap)
    const top = r.cursorY
    doc.setFillColor(241, 245, 249)
    doc.setDrawColor(...SLATE)
    doc.setLineWidth(0.2)
    doc.rect(MARGIN, top, width, height, 'FD')
    doc.setFontSize(size)
    doc.setTextColor(15, 23, 42)
    lines.forEach((line, i) => doc.text(line, MARGIN + padX, top + 4 + i * lh))
    r.moveTo(top + height + gap)
  }
  r.moveTo(r.cursorY + 3)
}
