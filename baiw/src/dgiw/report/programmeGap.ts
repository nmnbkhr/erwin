/**
 * Programme gap report — PDF only. AR-54.
 *
 * ═══ THIS IS THE INVERSE OF A COVERAGE REPORT, AND THE DISTINCTION IS THE ═══
 * ═══ WHOLE REASON IT EXISTS ════════════════════════════════════════════════
 *
 * Read this before changing anything in this file.
 *
 * Three datasets hang off `pillarId` and none references another: the crosswalk
 * (91 entries, dimension → pillar), the checklist (52 items, item → pillar) and
 * the artefact register (53 entries, artefact → pillar). The join is clean —
 * every pillarId resolves in all three — and the obvious artefact to build on it
 * is a coverage statement: "DMBOK's DM03 is weak; here is what the programme
 * does about it."
 *
 * THAT ARTEFACT IS NOT BUILDABLE AND THIS ONE IS NOT IT. Measured: 44 leaf
 * dimensions produce 30 distinct answers, the median answer is a quarter of the
 * whole 52-item checklist, and CL-01 "Executive sponsor named" is the returned
 * remedy for seventeen dimensions across all four frameworks. Eight dimensions —
 * DMBOK Data Governance, DCAM Programme & Funding, DGI Data Stakeholders, COBIT
 * Stakeholder Engagement among them — map to [P01+P02] and return the BYTE-
 * IDENTICAL 22 items and 16 artefacts. A percentage over that join would survive
 * every class in check.mjs and would not survive a client asking which item
 * covers DM03.
 *
 * The inverse needs none of that relation. "This pillar has nothing a generator
 * can build, and here is the share of each framework's view that lands on it" is
 * a statement about ONE pillar at a time, composed of two facts that are each
 * true on their own: what the register catalogues for that pillar, and what the
 * projection engine induces onto it. Nothing is joined across the pillar.
 *
 * ─── WHY THERE IS NO SUMMED "INDUCED WEIGHT" COLUMN ────────────────────────
 *
 * The obvious column is Σ coverageWeight × dimension.weight per pillar — one
 * number, sortable. It is not comparable across frameworks and it was measured
 * to be misleading: leaf weights sum to 1.00 in DMBOK2, 1.00 in DCAM, 1.45 in
 * COBIT and 3.00 in DGI, because DGI's ten leaves sit under three groups. So the
 * raw sum silently weights DGI three times as heavily as DMBOK, and P09's 0.463
 * against P06's 0.158 is partly just "COBIT and DGI reach P09".
 *
 * What is printed instead is `inducedPillarWeights()` — the projection engine's
 * own structural vector, per framework, normalised so each framework's column
 * sums to 1.000. Four columns, never a fifth. That is the same argument AR-06
 * makes about its four pillar scores: no dataset defines a weighting ACROSS
 * frameworks, so combining them would put a number on a page that nobody chose.
 *
 * ─── THREE STATES PER PILLAR, AND NONE OF THEM IS ZERO ─────────────────────
 *
 * `has-generator`   at least one catalogued artefact a generator exists for
 * `none-built`      catalogued entries exist, not one may have a generator
 * `not-catalogued`  no register entry names this pillar at all
 *
 * The third does not occur with the current register — every pillar carries at
 * least one entry — and is computed and printed anyway, exactly as
 * `scoring.ts::not-applicable` is. A state that cannot occur today is not dead
 * code; it is the branch that stops the day it starts occurring from being
 * silent. An empty pillar must never render as a zero.
 *
 * ─── A WITHDRAWN OR BLOCKED ENTRY IS NOT A REMEDY ──────────────────────────
 *
 * P06 carries three catalogued artefacts and that number, alone, reads as
 * coverage. One is withdrawn, one is blocked on an artefact that does not exist,
 * and one is observed at the client. Not one is a document this workbench can
 * produce. A count that folds them in is the fabrication shape this repo has
 * shipped four times, so every artefact counted is printed with its disposition
 * and the built column counts `derived`-with-a-generator only.
 *
 * ─── NO WAVE COLUMN ────────────────────────────────────────────────────────
 *
 * Waves carry `pillarIds` and free-text `deliverables`; they carry no artefact
 * id. Of 35 wave deliverable strings, exactly ONE matches a register artefact
 * name. So artefact → wave is a string bridge, not a join, and composing
 * artefact → pillar → wave puts AR-09 — a rung-2 operating model — into W6 "Run,
 * Prove & Expand" because both name P01. The wave section here is the ONLY
 * direction that is a real key: wave.pillarIds → pillar, reported per wave, with
 * no artefact attached to any wave row.
 *
 * ─── NO CSV ────────────────────────────────────────────────────────────────
 *
 * Deliberately absent, not forgotten. AR-13 and AR-27 ship one because a data
 * office works 76 elements and 115 rules in Excel — sorts, filters, assigns.
 * This is eleven rows, already in the order the finding argues, and the finding
 * is the sentences beside them rather than the numbers. AR-06's argument
 * exactly: a spreadsheet emitted for symmetry would imply a working artefact and
 * would strip the disposition prose that stops "3 catalogued" reading as three
 * remedies.
 *
 * Determinism: no clock, no randomness. Pillars in a total order (built count,
 * then checklist count, then pillar id), frameworks in declared order, artefacts
 * in register order.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
import { layerShows } from '../layer'
import { inducedPillarWeights, mappingVisible } from '../projection'
import pillars from '../data/pillars.json'
import crosswalk from '../data/crosswalk.json'
import implementationPlan from '../data/implementationPlan.json'
import programSetup from '../data/programSetup.json'
import frameworks from '../../frameworks/data/frameworks.json'
import type {
  ArtefactRegisterEntry,
  CrosswalkData,
  FrameworksData,
  ImplementationPlanData,
  LayerFilter,
  Pillar,
  ProgramSetupData,
} from '../types'

const PILLARS = pillars as Pillar[]
const XW = crosswalk as unknown as CrosswalkData
const PLAN = implementationPlan as ImplementationPlanData
const PROG = programSetup as unknown as ProgramSetupData
const FW = frameworks as unknown as FrameworksData

/**
 * implementationPlan.json → artefactRegister: "Programme gap report", rung 1,
 * owned by the Engagement Lead, format "Report". Marked `derived` against the
 * five datasets this file imports — which is what permits this generator to
 * exist at all, and is asserted by ARTEFACT-EVIDENCE rather than assumed.
 */
export const PROGRAMME_GAP_ARTEFACT_ID = 'AR-54'

/**
 * The catalogued artefacts a generator exists for, and the one hard-typed list
 * in this file.
 *
 * NOTHING IN ANY DATASET RECORDS WHICH ARTEFACTS ARE BUILT. The gate knows,
 * because ARTEFACT-EVIDENCE scans `src/dgiw/report/` for `*_ARTEFACT_ID`
 * declarations; the browser cannot scan source. So this is a declaration, and a
 * declaration beside a computed truth is how `SuiteLanding.tsx`'s dataset counts
 * and this file's own "48 catalogued" drifted — a hand-typed count in prose
 * beside a computed one on stdout is the prose losing, every time.
 *
 * `GENERATOR-SET` in `scripts/check/modules/dgiw.mjs` asserts this array equals
 * the set the gate scans, in both directions, and FAILS THE BUILD at this line
 * when a generator is added or removed without editing it. That is the same
 * shape `HAIW-WEIGHT` and `HACR-INSTRUMENT` ship: a list that deliberately
 * breaks the day the thing it describes changes.
 *
 * AR-54 counts itself. It is a real generator against a real register entry, and
 * a report that excluded itself from its own built column would be understating
 * P01 by one on the only page anybody reads for that number.
 */
export const IMPLEMENTED_ARTEFACT_IDS = [
  'AR-01', 'AR-02', 'AR-04', 'AR-05', 'AR-06', 'AR-09', 'AR-13',
  'AR-17', 'AR-20', 'AR-23', 'AR-27', 'AR-47', 'AR-48', 'AR-54',
] as const

const BUILT = new Set<string>(IMPLEMENTED_ARTEFACT_IDS)

/* ── the five boundary statements ──────────────────────────────────────── */

export const B_FILING_NOT_EVIDENCE =
  'THE PILLAR IS A FILING, NOT EVIDENCE. A checklist item and a register artefact each carry a ' +
  'pillarId, and that field records which pillar OWNS the work — nothing more. It carries no ' +
  'weight and no rationale. The crosswalk entry carries both: a coverageWeight summing to 1.00 ' +
  'across each dimension and an authored sentence saying why the mapping holds. NO DATASET IN ' +
  'THIS WORKBENCH RELATES A CHECKLIST ITEM OR AN ARTEFACT TO A FRAMEWORK DIMENSION. Nothing below ' +
  'says that any item addresses any dimension, and reading it that way would compose the weaker ' +
  'edge with the stronger one and report the result as the stronger.'

export const B_NO_COVERAGE =
  'NO COVERAGE FIGURE APPEARS ANYWHERE IN THIS DOCUMENT. Not a percentage, not a fraction, not a ' +
  'ratio of dimensions addressed. The pillar hop reaches too much and too indiscriminately to ' +
  'support one: eight leaf dimensions across all four frameworks reach exactly the same items and ' +
  'the same artefacts, so an answer that looks specific to a dimension is not. This report says ' +
  'only where the programme has NOTHING, which is a statement about a single pillar and needs no ' +
  'join to be true.'

export const B_THREE_STATES =
  'THREE STATES PER PILLAR, AND NONE OF THEM IS ZERO. HAS A GENERATOR means at least one ' +
  'catalogued artefact this workbench can produce. NONE BUILT means entries are catalogued and ' +
  'not one may have a generator written for it. NOT CATALOGUED means the register names this ' +
  'pillar nowhere at all. An unscheduled pillar and a pillar scheduled at zero are different ' +
  'findings; nothing here lets them print the same, and no pillar is omitted from the table for ' +
  'having nothing.'

export const B_DISPOSITION =
  'A WITHDRAWN OR BLOCKED ENTRY IS NOT A REMEDY. Every artefact counted below is printed with its ' +
  'register disposition. `derived` is the only one a generator may legally be written for; ' +
  '`authored` is library content nobody has written, `observed` is measured at the client, ' +
  '`blocked` waits on another catalogued artefact, and `withdrawn` was retired with its reason ' +
  'kept. A pillar showing three catalogued artefacts may have none that this workbench can ' +
  'produce, and P06 is exactly that.'

export const B_NO_WAVE_ROW =
  'NO ARTEFACT IS ATTACHED TO A WAVE. The waves carry pillar ids and free-text deliverables and ' +
  'no artefact id: of 35 deliverable strings, one matches a register artefact name. Composing ' +
  'artefact → pillar → wave would place AR-09, a rung-2 operating model, in W6 "Run, Prove & ' +
  'Expand" because both name P01. The wave section reports only wave → pillar, which is a real ' +
  'key, and names no artefact on any wave row.'

/** The frameworks' induced shares are per framework and are never summed. */
export const B_NOT_SUMMED =
  'THE FOUR FRAMEWORK COLUMNS ARE NOT ADDED TOGETHER. Each is that framework\'s own structural ' +
  'emphasis — the share of its view that lands on this pillar if everything were measured — and ' +
  'each column sums to 1.000 down the page. Adding across a row would weight DGI three times as ' +
  'heavily as DMBOK2, because DGI\'s ten leaf dimensions sit under three groups and its raw ' +
  'weights total 3.00 against DMBOK2\'s 1.00. No dataset defines a weighting across frameworks, ' +
  'so no combined figure is computed.'

/* ── the shape ─────────────────────────────────────────────────────────── */

export type PillarProgrammeState = 'has-generator' | 'none-built' | 'not-catalogued'

export const STATE_LABEL: Record<PillarProgrammeState, string> = {
  'has-generator': 'HAS A GENERATOR',
  'none-built': 'NONE BUILT',
  'not-catalogued': 'NOT CATALOGUED',
}

export interface PillarGapRow {
  pillar: Pillar
  state: PillarProgrammeState
  /** Crosswalk entries visible under the active layer. */
  entries: number
  checklistItems: number
  catalogued: ArtefactRegisterEntry[]
  built: ArtefactRegisterEntry[]
  /** Leaf dimensions whose ONLY mapped pillar is this one. */
  soleMapped: string[]
  waveIds: string[]
}

/**
 * The per-pillar measurement, under one layer. Exported so a screen can render
 * the same rows the PDF does — a page that disagrees with the document is the
 * failure `scoring.ts` exists to prevent, one artefact over.
 */
export function measureProgrammeGap(layer: LayerFilter): PillarGapRow[] {
  const entries = (XW.entries ?? []).filter((e) => mappingVisible(layer, e.layer))
  const checklist = (PROG.checklist ?? []).filter((c) => layerShows(layer, c.layer))
  const register = (PLAN.artefactRegister ?? []).filter((a) => layerShows(layer, a.layer))
  const dims = FW.dimensions ?? []
  const leafIds = new Set(
    dims.filter((d) => !dims.some((c) => c.parentId === d.id)).map((d) => d.id),
  )

  const rows = PILLARS.map((pillar): PillarGapRow => {
    const catalogued = register.filter((a) => a.pillarId === pillar.id)
    const built = catalogued.filter((a) => BUILT.has(a.id))
    return {
      pillar,
      // Order matters: "catalogued but none built" is only reachable once we
      // know something IS catalogued, which is what keeps `not-catalogued` from
      // collapsing into it. The two states that must never collapse.
      state: built.length > 0 ? 'has-generator' : catalogued.length > 0 ? 'none-built' : 'not-catalogued',
      entries: entries.filter((e) => e.pillarId === pillar.id).length,
      checklistItems: checklist.filter((c) => c.pillarId === pillar.id).length,
      catalogued,
      built,
      soleMapped: dims
        .filter((d) => leafIds.has(d.id))
        .filter((d) => {
          const mapped = [...new Set(entries.filter((e) => e.dimensionId === d.id).map((e) => e.pillarId))]
          return mapped.length === 1 && mapped[0] === pillar.id
        })
        .map((d) => d.code),
      waveIds: (PLAN.waves ?? []).filter((w) => (w.pillarIds ?? []).includes(pillar.id)).map((w) => w.id),
    }
  })

  // Thinnest first, and TOTAL: built, then checklist, then pillar id. Without the
  // id tiebreak two pillars with the same two counts would order by whatever
  // pillars.json happens to hold, and the document would not be byte-stable
  // against a dataset reordering that changed nothing.
  return rows.sort(
    (a, b) =>
      a.built.length - b.built.length ||
      a.checklistItems - b.checklistItems ||
      (a.pillar.id < b.pillar.id ? -1 : a.pillar.id > b.pillar.id ? 1 : 0),
  )
}

export interface ProgrammeGapInput {
  meta: ReportMeta
}

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`

export function buildProgrammeGapPdf(input: ProgrammeGapInput): jsPDF {
  const { meta } = input
  const rows = measureProgrammeGap(meta.layer)
  const frameworkList = FW.frameworks ?? []
  const dims = FW.dimensions ?? []
  const induced = frameworkList.map((f) => ({ f, w: inducedPillarWeights(f.id, meta.layer) }))
  const gaps = rows.filter((r) => r.state !== 'has-generator')

  const layerLine =
    meta.layer === 'all'
      ? 'Core chassis + banking overlay — every record in all five datasets is in scope.'
      : `${meta.layer} layer only — records tagged for the other layer are out of scope and are not counted.`

  // What this report renders: each pillar's state and the three counts behind
  // it. Two reports for one engagement on one day over a moved register are
  // different documents and the /ID has to say so. The state string is included
  // rather than only the counts, because the state is the finding.
  const r = createReport(
    meta,
    contentKey(rows.map((x) => `${x.pillar.id}:${x.state}:${x.built.length}/${x.catalogued.length}:${x.checklistItems}:${x.entries}`)),
  )

  r.cover(
    'Programme Gap Report',
    'Where the programme has nothing scheduled for a pillar the frameworks will score',
  )

  /* ---- the boundaries, in full, before any number ---- */
  r.page('What this report states, and what it does not')
  r.paragraph(B_NO_COVERAGE)
  r.paragraph(B_FILING_NOT_EVIDENCE)
  r.paragraph(B_THREE_STATES)
  r.paragraph(B_DISPOSITION)
  r.paragraph(B_NO_WAVE_ROW)
  r.sectionHeading('Layer scope of every figure in this document')
  r.paragraph(layerLine)

  /* ---- the programme side ---- */
  r.page('Every pillar, thinnest first', 'What the programme schedules against each pillar.')
  r.paragraph(B_THREE_STATES, { color: SLATE, size: 8 })
  r.table({
    head: ['Pillar', 'Name', 'State', 'Checklist items', 'Catalogued', 'With a generator'],
    rows: rows.map((x) => [
      x.pillar.id,
      x.pillar.short ?? x.pillar.name,
      STATE_LABEL[x.state],
      String(x.checklistItems),
      String(x.catalogued.length),
      String(x.built.length),
    ]),
    columnStyles: {
      0: { cellWidth: 16 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 28 },
    },
    bodyFontSize: 7,
  })
  r.paragraph(
    'Checklist items and catalogued artefacts are counts of records that name this pillar. They ' +
      'are not a measure of how much of the pillar is addressed, and no such measure is computed ' +
      'anywhere in this document.',
    { color: SLATE, size: 8 },
  )

  /* ---- the framework side, never summed ---- */
  r.page(
    'What each framework puts on each pillar',
    'Structural emphasis from the crosswalk alone, before any answer is given.',
  )
  r.paragraph(B_NOT_SUMMED)
  r.table({
    head: ['Pillar', 'Name', ...frameworkList.map((f) => f.code), 'Crosswalk entries'],
    rows: rows.map((x) => [
      x.pillar.id,
      x.pillar.short ?? x.pillar.name,
      ...induced.map((i) => pct(i.w[x.pillar.id] ?? 0)),
      String(x.entries),
    ]),
    columnStyles: {
      0: { cellWidth: 14 },
      ...Object.fromEntries(
        frameworkList.map((_, i) => [i + 2, { halign: 'center' as const, cellWidth: 20 }]),
      ),
      [frameworkList.length + 2]: { halign: 'center' as const, cellWidth: 24 },
    },
    bodyFontSize: 7,
  })
  r.paragraph(
    'A 0.0% column entry means that framework maps nothing to that pillar under this layer. That ' +
      'is a fact about the crosswalk, not a score, and it is not a gap in the programme.',
    { color: SLATE, size: 8 },
  )

  /* ---- the finding ---- */
  r.page(
    'Pillars with nothing this workbench can produce',
    `${gaps.length} of ${rows.length} pillars.`,
  )
  r.paragraph(B_DISPOSITION)
  if (gaps.length === 0) {
    // An empty finding is a legitimate output and says WHY it is empty, rather
    // than rendering as an absent section a reader would read as a check that
    // did not run.
    r.paragraph(
      'Every pillar carries at least one catalogued artefact with a generator under this layer. ' +
        'This section is empty because the measurement found nothing, not because it was skipped.',
    )
  }
  for (const g of gaps) {
    r.sectionHeading(`${g.pillar.id} · ${g.pillar.name} — ${STATE_LABEL[g.state]}`)
    r.paragraph(g.pillar.description, { size: 8 })
    r.keyValueBlock(
      [
        ['Checklist items', `${g.checklistItems} of ${(PROG.checklist ?? []).filter((c) => layerShows(meta.layer, c.layer)).length} in scope`],
        ['Catalogued artefacts', `${g.catalogued.length}, of which ${g.built.length} have a generator`],
        ['Crosswalk entries', `${g.entries}`],
        [
          'Framework emphasis',
          induced.map((i) => `${i.f.code} ${pct(i.w[g.pillar.id] ?? 0)}`).join(' · '),
        ],
        [
          'Sole mapped dimension for',
          g.soleMapped.length
            ? `${g.soleMapped.join(', ')} — these reach this pillar and no other, so nothing else in the programme stands behind them`
            : 'none — every dimension mapping here also maps elsewhere',
        ],
        ['Named by waves', g.waveIds.length ? g.waveIds.join(', ') : 'none'],
      ],
      { size: 8, labelWidth: 44 },
    )
    if (g.catalogued.length) {
      r.table({
        head: ['Artefact', 'Name', 'Disposition', 'Generator'],
        rows: g.catalogued.map((a) => [
          a.id,
          a.artefact,
          a.builtFrom.evidence,
          BUILT.has(a.id) ? 'yes' : 'no',
        ]),
        columnStyles: {
          0: { cellWidth: 20 },
          2: { cellWidth: 26 },
          3: { halign: 'center', cellWidth: 22 },
        },
        bodyFontSize: 7,
      })
      for (const a of g.catalogued) {
        r.paragraph(`${a.id} (${a.builtFrom.evidence}) — ${a.builtFrom.note}`, { size: 7, color: SLATE })
      }
    } else {
      r.paragraph(
        'The register names no artefact against this pillar at all. That is NOT COUNTED AS ZERO ' +
          'artefacts delivered: it is an absence of catalogue, which is a different finding from a ' +
          'catalogue whose entries cannot be built.',
        { size: 8 },
      )
    }
  }

  /* ---- read from the framework side ---- */
  const gapPillars = new Set(gaps.map((g) => g.pillar.id))
  const visibleEntries = (XW.entries ?? []).filter((e) => mappingVisible(meta.layer, e.layer))
  const leafIds = new Set(dims.filter((d) => !dims.some((c) => c.parentId === d.id)).map((d) => d.id))
  r.page(
    'The same finding read from each framework',
    'Leaf dimensions every one of whose pillars has nothing this workbench can produce.',
  )
  r.paragraph(B_FILING_NOT_EVIDENCE)
  for (const f of frameworkList) {
    const leaves = dims.filter((d) => leafIds.has(d.id) && d.frameworkId === f.id)
    const stranded = leaves.filter((d) => {
      const mapped = [...new Set(visibleEntries.filter((e) => e.dimensionId === d.id).map((e) => e.pillarId))]
      return mapped.length > 0 && mapped.every((p) => gapPillars.has(p))
    })
    r.sectionHeading(`${f.code} — ${stranded.length} of ${leaves.length} leaf dimensions`)
    if (!stranded.length) {
      r.paragraph(
        'Every leaf dimension of this framework maps to at least one pillar carrying an artefact ' +
          'this workbench can produce. That says nothing about whether that artefact addresses the ' +
          'dimension — see the statement above.',
        { size: 8 },
      )
      continue
    }
    r.table({
      head: ['Dimension', 'Name', 'Pillars', 'Weight'],
      rows: stranded.map((d) => [
        d.code,
        d.name,
        [...new Set(visibleEntries.filter((e) => e.dimensionId === d.id).map((e) => e.pillarId))].sort().join(', '),
        d.weight.toFixed(2),
      ]),
      columnStyles: { 0: { cellWidth: 24 }, 2: { cellWidth: 26 }, 3: { halign: 'center', cellWidth: 20 } },
      bodyFontSize: 7,
    })
  }

  /* ---- waves, pillar side only ---- */
  r.page('Waves naming a pillar with nothing scheduled', 'Wave to pillar only. No artefact is named on any row.')
  r.paragraph(B_NO_WAVE_ROW)
  const waveRows = (PLAN.waves ?? [])
    .map((w) => ({
      w,
      noBuilt: (w.pillarIds ?? []).filter((p) => gapPillars.has(p)),
      noItems: (w.pillarIds ?? []).filter((p) => rows.find((x) => x.pillar.id === p)?.checklistItems === 0),
    }))
    .filter((x) => x.noBuilt.length || x.noItems.length)
  if (!waveRows.length) {
    r.paragraph(
      'No wave names a pillar that has nothing scheduled. This section is empty because the ' +
        'measurement found nothing, not because it was skipped.',
    )
  } else {
    r.table({
      head: ['Wave', 'Name', 'Weeks', 'Pillars named', 'Nothing built', 'No checklist item'],
      rows: waveRows.map((x) => [
        x.w.id,
        x.w.name,
        x.w.weeks,
        (x.w.pillarIds ?? []).join(', '),
        x.noBuilt.join(', ') || '—',
        x.noItems.join(', ') || '—',
      ]),
      columnStyles: { 0: { cellWidth: 14 }, 4: { cellWidth: 24 }, 5: { cellWidth: 28 } },
      bodyFontSize: 7,
    })
    r.paragraph(
      'A wave naming a pillar with nothing built is not necessarily a defect in the plan: the wave ' +
        'may be delivered by hand, and the register catalogues what a consultant produces rather ' +
        'than only what this workbench generates. It is a place where the plan and the generated ' +
        'pack do not meet, and where a client asking "what will you hand me for this?" has no ' +
        'answer from this tool.',
      { color: SLATE, size: 8 },
    )
  }

  /* ---- the full ledger ---- */
  r.page('Every catalogued artefact counted', `${(PLAN.artefactRegister ?? []).filter((a) => layerShows(meta.layer, a.layer)).length} entries in scope under this layer.`)
  r.paragraph(B_DISPOSITION)
  r.table({
    head: ['Artefact', 'Pillar', 'Name', 'Disposition', 'Generator'],
    rows: (PLAN.artefactRegister ?? [])
      .filter((a) => layerShows(meta.layer, a.layer))
      .map((a) => [a.id, a.pillarId, a.artefact, a.builtFrom.evidence, BUILT.has(a.id) ? 'yes' : 'no']),
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 16 },
      3: { cellWidth: 24 },
      4: { halign: 'center', cellWidth: 22 },
    },
    bodyFontSize: 7,
  })

  return r.build()
}
