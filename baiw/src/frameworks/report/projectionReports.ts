/**
 * The two projection deliverables, once, for any module that has a crosswalk.
 *
 * ─── WHY SHARED AND NOT COPIED ─────────────────────────────────────────────
 *
 * `src/dgiw/report/frameworkAlignment.ts` and `multiFrameworkScorecard.ts` are the
 * originals. D5 stage E3 needs the same two documents for TAIW and HAIW, which by
 * this repo's dominant habit would have been four new files totalling roughly 1,150
 * lines differing by a noun. CLAUDE.md's standing instruction is the opposite: "do
 * not add a seventh copy", and the generalisation is that anything belonging to more
 * than one module goes in one place imported by all of them.
 *
 * So the documents live here and each module supplies a `ProjectionReportModule`. The
 * per-module files are thin: they build the descriptor, own the artefact id constant,
 * and export a function. What differs between TAIW and HAIW is genuinely only data —
 * which frameworks, which spine, which caveats.
 *
 * DGIW's two are NOT migrated onto this. Its crosswalk entries carry a `layer` and a
 * `pillarId` that neither other module has, its scale caveat names DGIW, and moving
 * it would put fourteen DGIW baseline diffs inside a TAIW/HAIW feature — a refactor
 * nobody asked for riding on a stage. The duplication is recorded in
 * `src/frameworks/notes.ts` rather than left to be discovered.
 *
 * ─── THE CONTENT DIGEST IS THE PART TO READ ────────────────────────────────
 *
 * `createReport`'s second argument seeds the trailer /ID, and ARTEFACT-IMPL rejects a
 * generator that omits it. But ARTEFACT-IMPL only verifies a digest is SUPPLIED, not
 * that it is DERIVED — `contentKey(['constant'])` passes and silently reintroduces the
 * bug. Both digests below are built from every figure the document renders under the
 * ACTIVE SCOPE: the alignment from each leaf's state and score to six decimal places,
 * the scorecard from every framework's overall plus its worst three. Two runs that
 * differ in one answer are two documents, and /ID is the field a DMS uses to tell
 * them apart.
 *
 * ─── NOTHING IS RECOMPUTED HERE ────────────────────────────────────────────
 *
 * Every figure comes from the module's projection engine, which reads
 * `src/scoring/maturity.ts`. A framework pack that disagreed with the assessment
 * screen it derives from would be worse than no pack — "a PDF that disagrees with the
 * screen is worse than no PDF" is the rule, and one engine per module is how it is
 * kept rather than by two careful copies.
 */
import type jsPDF from 'jspdf'
import { contentKey, createReport, SLATE } from '../../report/spine'
import type { ReportMeta } from '../../report/types'
// The projection types live in `projection.ts`, beside the engine that produces them;
// only the published-structure types (`Framework`, `SpineNode`) are in `types.ts`.
import type { Framework, SpineNode } from '../types'
import type { DimensionDecomposition, FrameworkProjection, ProjectionEngine } from '../projection'
import {
  RETAINED_IS_STRUCTURAL,
  SHARES_EXPLAINED,
  STRUCTURE_CAVEATS,
  THREE_STATES,
  WEIGHTS_ARE_OURS,
  confidenceLine,
  levelLabelFor,
  oneAssessment,
  scaleCaveat,
} from '../notes'

/** One crosswalk entry, in the shape both TAIW's and HAIW's files already use. */
export interface ProjectionCrosswalkEntry {
  id: string
  dimensionId: string
  spineId: string
  coverageWeight: number
  rationale: string
}

/**
 * Everything the two documents need that differs between modules.
 *
 * `answers` is generic across the two modules only in its key type, so it is passed
 * through as an opaque value the engine understands. The engine is the only thing that
 * reads it, which is the point.
 */
export interface ProjectionReportModule<Answers> {
  /** 'TAIW' / 'HAIW' — appears in the scale caveat and nowhere decorative. */
  moduleLabel: string
  /** What the module's spine node IS: 'TACR section', 'HACR subcategory'. */
  spineLabel: string
  spineLabelPlural: string
  engine: ProjectionEngine<Answers>
  frameworks: readonly Framework[]
  entries: readonly ProjectionCrosswalkEntry[]
  spine: readonly SpineNode[]
  /**
   * Module-specific caveats, rendered in full beside the figures they qualify.
   *
   * TAIW's carry the absent DGI and DM07; HAIW's carries the HACR-INSTRUMENT
   * disclosure. Passed rather than derived because they are editorial statements about
   * a dataset, and the module that owns the dataset owns the sentence.
   */
  moduleCaveats: readonly string[]
  /**
   * Rendered under the scorecard title in the same weight as the coverage denominator,
   * when present. HAIW's instrument disclosure is the case this exists for: 100% reach
   * on four frameworks is the most impressive number either deliverable carries and the
   * one most needing the qualification.
   */
  headlineDisclosure?: string
  /**
   * WHY the spine nodes no framework maps are a finding rather than a gap.
   *
   * The LIST is computed from the engine, never written here — a hand-authored list is a
   * second copy of something the crosswalk already determines, and it goes stale the
   * first time an entry is added. This is the sentence that says what the computed list
   * MEANS, which is the part no dataset holds: TACR's are a customs administration's own
   * concerns, HACR's are health service delivery.
   */
  unmappedNote?: string
}

/**
 * Spine nodes that NO framework's induced weight reaches.
 *
 * Structural — `inducedSpineWeights` takes no answers, so this is a fact about the
 * crosswalk and does not move when someone answers a question. Computed rather than
 * declared: `spineCoverage` in the rule files reports the same set on every build, and
 * two lists of the same thing drift.
 */
export function unmappedSpineNodes<Answers>(mod: ProjectionReportModule<Answers>): SpineNode[] {
  const reached = new Set<string>()
  for (const f of mod.frameworks)
    for (const [id, w] of Object.entries(mod.engine.inducedSpineWeights(f.id))) if (w > 0) reached.add(id)
  return mod.spine.filter((n) => !reached.has(n.id))
}

const pct = (x: number): string => `${Math.round(x * 100)}%`
const show1 = (n: number | null): string => (n === null ? '—' : (Math.round(n * 10) / 10).toFixed(1))

/**
 * Never a bare number for an unmeasured dimension, and never a 0.
 *
 * The three states are distinct facts and the two unmeasured ones must not collapse
 * into each other or into a digit. This is `scoreLabel`'s rule at the dimension level.
 */
function stateLabel(d: { state: string; score: number | null }): string {
  if (d.state === 'not-applicable') return 'NOT APPLICABLE'
  if (d.state === 'not-assessed') return 'NOT ASSESSED'
  return show1(d.score)
}

const overallLabel = (p: FrameworkProjection): string =>
  p.state === 'scored' ? `${show1(p.overall)} / 5.0` : p.state.toUpperCase().replace('-', ' ')

const byId = <T extends { dimensionId: string }>(entries: readonly T[]): Map<string, T[]> => {
  const m = new Map<string, T[]>()
  for (const e of [...entries].sort((a, b) => ((a as unknown as { id: string }).id < (b as unknown as { id: string }).id ? -1 : 1)))
    m.set(e.dimensionId, [...(m.get(e.dimensionId) ?? []), e])
  return m
}

const EPS = 1e-9

/**
 * The caveats, minus whatever is already rendered as the headline.
 *
 * HAIW's instrument disclosure is BOTH: it is the sentence that has to sit under the
 * scorecard title in body weight, and it is the first thing in the module's caveat list
 * because a reader of the alignment pack — which has no headline slot — must still get
 * it. Rendering both on one page printed the same 90 words twice, which reads as a
 * layout bug and trains a reader to skip the block.
 *
 * Deduplicated by identity rather than by text: they are the same exported constant, so
 * reference equality is the honest test and a near-copy is meant to print twice.
 */
const caveatsBesides = <Answers>(mod: ProjectionReportModule<Answers>, headline?: string): string[] =>
  mod.moduleCaveats.filter((c) => c !== headline)

// ══════════════════════════════════════════════════════════
// FRAMEWORK ALIGNMENT — one framework, dimension by dimension
// ══════════════════════════════════════════════════════════
export interface FrameworkAlignmentInput<Answers> {
  meta: ReportMeta
  answers: Answers
  frameworkId: string
}

/**
 * "How this assessment satisfies <framework>" — the regulator- and audit-facing one.
 *
 * Dimension by dimension it states what the framework asks for, which spine nodes
 * answer it, what those scored, and the AUTHORED RATIONALE for every mapping. An
 * examiner's first question about a crosswalk is "who decided that, and why", and this
 * document answers it in the row rather than in a covering note.
 */
export function buildProjectionAlignmentPdf<Answers>(
  mod: ProjectionReportModule<Answers>,
  input: FrameworkAlignmentInput<Answers>,
): jsPDF {
  const { meta, answers, frameworkId } = input
  const framework = mod.frameworks.find((f) => f.id === frameworkId)
  if (!framework) throw new Error(`No framework ${frameworkId} in this module's crosswalk`)

  const proj = mod.engine.projectFramework(frameworkId, answers)
  const dims = mod.engine.decompose(frameworkId, answers)
  const leaves = dims.filter((d) => d.isLeaf)
  const partial = leaves.filter((d) => d.state === 'scored' && d.retainedShare < 1 - EPS)
  const notApplicable = leaves.filter((d) => d.state === 'not-applicable')
  const notAssessed = leaves.filter((d) => d.state === 'not-assessed')
  const entriesByDim = byId(mod.entries)
  const spineName = (id: string): string => mod.spine.find((n) => n.id === id)?.name ?? id

  const r = createReport(
    meta,
    /*
     * The framework, and every leaf with the score it is claiming to six decimals.
     * A re-run after one more question is answered is a different document and the
     * /ID says so. Not `show1` — a digest built from the rounded display value would
     * collide across answer sets that print the same.
     */
    contentKey([
      `framework:${framework.code}`,
      ...leaves.map((d) => `dim:${d.dimensionId}=${d.state}:${d.score === null ? 'null' : d.score.toFixed(6)}`),
      ...leaves.map((d) => `share:${d.dimensionId}=${d.retainedShare.toFixed(6)}/${d.scoredShare.toFixed(6)}`),
    ]),
  )

  r.cover(`Framework Alignment — ${framework.code}`, `How this assessment satisfies ${framework.name}`)

  r.page('Alignment summary')
  r.keyValueBlock([
    ['Framework', `${framework.name} (${framework.versionLabel})`],
    ['Publisher', framework.publisher],
    ['Overall', overallLabel(proj)],
    ['Maturity level', proj.state === 'scored' ? levelLabelFor(proj.overall) : '—'],
    ['Dimensions assessed', `${leaves.length - notApplicable.length - notAssessed.length} of ${leaves.length} leaf dimensions`],
    ['Retained share', pct(proj.retainedShare)],
    ['Scored share', pct(proj.scoredShare)],
    ['Structure confidence', framework.structureConfidence],
  ])
  r.paragraph(oneAssessment(mod.frameworks.length, mod.spine.length, mod.spineLabelPlural), { color: SLATE, size: 8 })
  r.paragraph(SHARES_EXPLAINED, { color: SLATE, size: 8 })
  r.paragraph(RETAINED_IS_STRUCTURAL, { color: SLATE, size: 8 })
  r.paragraph(THREE_STATES, { color: SLATE, size: 8 })
  r.paragraph(scaleCaveat(mod.moduleLabel), { color: SLATE, size: 8 })

  // Before any table a reader might quote. A reader who reaches the numbers first has
  // already formed a view of what they are.
  r.sectionHeading('What is published and what is ours')
  r.paragraph(WEIGHTS_ARE_OURS)
  r.paragraph(confidenceLine(framework), { size: 8 })
  if (framework.structureConfidence !== 'high') {
    r.text('Recorded qualification for this framework:', { size: 8, color: SLATE, gapAfter: 1 })
    r.text(framework.structureNotes, { size: 8, indent: 4, gapAfter: 4 })
  }
  if (mod.moduleCaveats.length > 0) {
    r.sectionHeading(`What ${mod.moduleLabel}'s assessment can and cannot evidence`)
    r.bullets([...mod.moduleCaveats], { size: 8 })
  }

  r.page('Dimension by dimension')
  r.paragraph(
    'Retained and scored share are SEPARATE columns on purpose. Retained is how much of the ' +
      'framework’s own definition this assessment covers; scored is how much of that was measured. ' +
      'Combining them would hide whichever is worse.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Code', 'Dimension', 'Score', 'Level', 'Retained', 'Scored', mod.spineLabelPlural],
    rows: leaves.map((d) => [
      d.code,
      d.name,
      stateLabel(d),
      d.state === 'scored' ? levelLabelFor(d.score) : '—',
      pct(d.retainedShare),
      pct(d.scoredShare),
      d.contributions.length ? d.contributions.map((c) => c.spineId).join(', ') : '—',
    ]),
    columnStyles: {
      0: { cellWidth: 20 },
      2: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
    },
    bodyFontSize: 7,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2 && typeof data.cell.raw === 'string' && data.cell.raw.startsWith('NOT'))
        data.cell.styles.textColor = [180, 83, 9]
    },
  })

  /*
   * ALWAYS RENDERED, INCLUDING WHEN EMPTY — and the empty case is the usual one here.
   *
   * On a layerless module a leaf retains 1.0 or 0.0 and nothing between (see
   * RETAINED_IS_STRUCTURAL), so this table is normally empty. Omitting it silently
   * would let a reader conclude the check was not performed; the framework-level
   * retained share above is where the partial reading actually shows up, and this says
   * so rather than leaving a blank.
   */
  r.sectionHeading('Dimensions only partly in scope')
  if (partial.length === 0) {
    r.paragraph(
      `None. Every leaf dimension of ${framework.code} is either mapped in full or mapped by ` +
        `nothing — there is no scope filter on this assessment that could retain part of one. ` +
        `${framework.code}'s own retained share of ${pct(proj.retainedShare)} above is the weighted ` +
        `mean over its ${leaves.length} leaves, and it falls below 100% exactly when one of them is ` +
        `unreachable, which is listed under "Not applicable" below.`,
    )
  } else {
    r.paragraph(
      `${partial.length} dimension${partial.length === 1 ? '' : 's'} ${partial.length === 1 ? 'is' : 'are'} ` +
        `scored from less than the framework’s full definition. The score is a fair reading of what ` +
        `is in scope; it is NOT a claim about the part that is not.`,
    )
    r.table({
      head: ['Code', 'Dimension', 'Retained', 'Scored', `What is unmeasured`],
      rows: partial.map((d) => {
        const all = entriesByDim.get(d.dimensionId) ?? []
        const shown = new Set(d.contributions.map((c) => c.spineId))
        const missing = all.filter((e) => !shown.has(e.spineId))
        return [
          d.code,
          d.name,
          pct(d.retainedShare),
          pct(d.scoredShare),
          missing.length
            ? missing.map((e) => `${spineName(e.spineId)} (${pct(e.coverageWeight)})`).join('; ')
            : 'Retained in full; the shortfall is unanswered questions rather than scope',
        ]
      }),
      columnStyles: { 0: { cellWidth: 20 }, 2: { cellWidth: 18, halign: 'center' }, 3: { cellWidth: 16, halign: 'center' } },
      bodyFontSize: 7,
    })
  }

  r.page('Mapping rationale', `Why each dimension maps to the ${mod.spineLabelPlural} it does`)
  r.paragraph(
    'Every row below was authored deliberately. A mapping a consultant cannot defend in a room is ' +
      'not a mapping, and this section is the room.',
    { color: SLATE, size: 8 },
  )
  for (const d of leaves) {
    const entries = entriesByDim.get(d.dimensionId) ?? []
    if (entries.length === 0) continue
    r.pageBreakIfNeeded(30)
    r.sectionHeading(`${d.code} · ${d.name}`)
    r.keyValueBlock(
      [
        ['Assessed', stateLabel(d)],
        ['Retained / scored', `${pct(d.retainedShare)} / ${pct(d.scoredShare)}`],
      ],
      { labelWidth: 38, size: 8 },
    )
    r.table({
      head: ['Entry', mod.spineLabel, 'Share', 'Rationale'],
      rows: entries.map((e) => [e.id, spineName(e.spineId), pct(e.coverageWeight), e.rationale]),
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 42 }, 2: { cellWidth: 14, halign: 'center' } },
      bodyFontSize: 6.5,
      gapAfter: 6,
    })
  }

  r.page('What this assessment does not cover')
  if (notApplicable.length === 0 && notAssessed.length === 0) {
    r.paragraph(
      `Every leaf dimension of ${framework.code} is in scope and measured. Nothing in the framework ` +
        `is unaddressed. Read that against the instrument qualification above rather than as depth.`,
    )
  } else {
    if (notApplicable.length > 0) {
      r.sectionHeading('Not applicable')
      r.paragraph(
        `These dimensions are mapped by nothing: this assessment asks no question that could ` +
          `evidence them. They are not failures and they are NOT scored as zero — the framework ` +
          `defines something the assessment does not reach.`,
      )
      r.bullets(notApplicable.map((d) => `${d.code} — ${d.name}`), { size: 8 })
    }
    if (notAssessed.length > 0) {
      r.sectionHeading('In scope but not measured')
      r.paragraph(
        `These dimensions map to ${mod.spineLabelPlural} but no question behind them has been ` +
          `answered. This is a gap in the EVIDENCE, not a finding about the organisation.`,
      )
      r.bullets(notAssessed.map((d) => `${d.code} — ${d.name}`), { size: 8 })
    }
  }
  /*
   * THE DIVERGENCE THAT ACTUALLY OCCURS ON THESE MODULES.
   *
   * Retained is 1 or 0 per leaf; SCORED is the share that moves. A dimension mapped onto
   * three spine nodes of which one is unanswered reads 100% retained and 67% scored, and
   * its score is a fair reading of two thirds of what the framework means by it. That is
   * the sentence a reader needs and the reason the two columns are never merged.
   */
  const partlyScored = leaves.filter((d) => d.state === 'scored' && d.scoredShare < d.retainedShare - EPS)
  r.sectionHeading('Dimensions scored from part of their evidence')
  if (partlyScored.length === 0) {
    r.paragraph(
      'None. Every dimension that is scored at all is scored from every ' +
        `${mod.spineLabel} mapped to it.`,
    )
  } else {
    r.paragraph(
      `${partlyScored.length} of ${leaves.length} leaf dimensions are scored from less than the ` +
        `evidence mapped to them. Retained is still 100% — the shortfall is UNANSWERED QUESTIONS, ` +
        `not scope. Each score below is a fair reading of the fraction shown.`,
    )
    r.table({
      head: ['Code', 'Dimension', 'Score', 'Retained', 'Scored', `Unanswered ${mod.spineLabelPlural}`],
      rows: partlyScored.map((d) => {
        const all = entriesByDim.get(d.dimensionId) ?? []
        const shown = new Set(d.contributions.map((c) => c.spineId))
        const missing = all.filter((e) => !shown.has(e.spineId))
        return [
          d.code,
          d.name,
          show1(d.score),
          pct(d.retainedShare),
          pct(d.scoredShare),
          missing.map((e) => `${spineName(e.spineId)} (${pct(e.coverageWeight)})`).join('; ') || '—',
        ]
      }),
      columnStyles: {
        0: { cellWidth: 20 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 16, halign: 'center' },
      },
      bodyFontSize: 7,
    })
  }

  unmappedSection(r, mod)

  r.sectionHeading('Structural qualifications')
  r.bullets(STRUCTURE_CAVEATS, { size: 8 })

  return r.build()
}

/**
 * The computed unmapped set, with the module's sentence explaining what it means.
 *
 * Shared by both documents so the two cannot disagree about which nodes are unreached —
 * they are one call to the same engine, not two lists.
 */
function unmappedSection<Answers>(
  r: { sectionHeading: (s: string) => void; paragraph: (s: string, o?: object) => void; bullets: (xs: string[], o?: object) => void },
  mod: ProjectionReportModule<Answers>,
): void {
  const unmapped = unmappedSpineNodes(mod)
  r.sectionHeading(`${mod.spineLabelPlural} no framework maps`)
  if (unmapped.length === 0) {
    r.paragraph(
      `None — every one of the ${mod.spine.length} ${mod.spineLabelPlural} is reached by at least ` +
        `one framework, so nothing measured by this assessment counts toward no scorecard.`,
    )
    return
  }
  r.paragraph(
    `${unmapped.length} of ${mod.spine.length} ${mod.spineLabelPlural} are reached by none of the ` +
      `${mod.frameworks.length} frameworks. They are still SCORED on the assessment and they still ` +
      `appear in ${mod.moduleLabel}'s own maturity report — they simply contribute to no framework ` +
      `scorecard, because no published data-management framework defines them.`,
  )
  if (mod.unmappedNote) r.paragraph(mod.unmappedNote, { size: 8 })
  r.bullets(
    unmapped.map((n) => n.name),
    { size: 8 },
  )
}

// ══════════════════════════════════════════════════════════
// MULTI-FRAMEWORK SCORECARD — all frameworks, side by side
// ══════════════════════════════════════════════════════════
export interface ScorecardInput<Answers> {
  meta: ReportMeta
  answers: Answers
}

const worstThree = (p: FrameworkProjection): DimensionDecomposition[] =>
  p.dimensions
    .filter((d) => d.isLeaf && d.state === 'scored')
    .sort((a, b) => (a.score as number) - (b.score as number) || (a.code < b.code ? -1 : 1))
    .slice(0, 3)

/**
 * Every framework beside every other, which is the document that makes the method
 * legible — and the one most able to mislead.
 *
 * The overalls land close together BY CONSTRUCTION: they are one evidence base seen
 * four ways. `oneAssessment` is therefore rendered before the comparison table rather
 * than after it, and the coverage-gap table beside it is what stops "all four agree"
 * reading as corroboration.
 */
export function buildProjectionScorecardPdf<Answers>(
  mod: ProjectionReportModule<Answers>,
  input: ScorecardInput<Answers>,
): jsPDF {
  const { meta, answers } = input
  const projections = mod.frameworks.map((f) => mod.engine.projectFramework(f.id, answers))
  const scored = projections.filter((p) => p.state === 'scored')
  const spread =
    scored.length > 1
      ? Math.max(...scored.map((p) => p.overall as number)) - Math.min(...scored.map((p) => p.overall as number))
      : 0

  const r = createReport(
    meta,
    /*
     * Every framework's overall AND its worst three, to six decimals. Two assessments
     * can produce the same four overalls and rank different dimensions worst, and the
     * worst-three table is the part a reader acts on — so the /ID has to cover it.
     */
    contentKey([
      ...projections.map((p) => `fw:${p.code}=${p.state}:${p.overall === null ? 'null' : p.overall.toFixed(6)}`),
      ...projections.flatMap((p) => worstThree(p).map((d) => `worst:${p.code}:${d.code}=${(d.score as number).toFixed(6)}`)),
      ...projections.map((p) => `share:${p.code}=${p.retainedShare.toFixed(6)}/${p.scoredShare.toFixed(6)}`),
    ]),
  )

  r.cover(
    'Multi-Framework Scorecard',
    `${mod.frameworks.length} published frameworks, one assessment`,
  )

  r.page('One assessment, several vocabularies')
  // The disclosure goes HERE, under the title, in the same weight as the coverage
  // denominator — not in a footnote. HAIW's is the case that decided it: 100% reach on
  // four frameworks is the most impressive number this document carries.
  if (mod.headlineDisclosure) r.paragraph(mod.headlineDisclosure)
  r.paragraph(oneAssessment(mod.frameworks.length, mod.spine.length, mod.spineLabelPlural))
  r.paragraph(
    scored.length > 1
      ? `The ${scored.length} scored overalls span ${spread.toFixed(2)} of a level. A narrow spread is ` +
          `the expected outcome and is not evidence that the frameworks corroborate one another — ` +
          `they cannot, because they are reading the same answers.`
      : `Fewer than two frameworks are scored, so no spread can be reported.`,
    { color: SLATE, size: 8 },
  )
  r.paragraph(WEIGHTS_ARE_OURS, { size: 8 })
  r.paragraph(scaleCaveat(mod.moduleLabel), { color: SLATE, size: 8 })
  r.paragraph(SHARES_EXPLAINED, { color: SLATE, size: 8 })
  r.paragraph(RETAINED_IS_STRUCTURAL, { color: SLATE, size: 8 })
  r.paragraph(THREE_STATES, { color: SLATE, size: 8 })
  const scorecardCaveats = caveatsBesides(mod, mod.headlineDisclosure)
  if (scorecardCaveats.length > 0) {
    r.sectionHeading(`What ${mod.moduleLabel}'s assessment can and cannot evidence`)
    r.bullets(scorecardCaveats, { size: 8 })
  }

  r.page('Frameworks side by side')
  r.table({
    head: ['Framework', 'Overall', 'Level', 'Leaves', 'Scored', 'Retained', 'Scored share'],
    rows: projections.map((p) => {
      const leaves = p.dimensions.filter((d) => d.isLeaf)
      // `versionLabel` is published structure and lives on the Framework, not on the
      // projection — the projection carries what was computed, not what was authored.
      const version = mod.frameworks.find((f) => f.id === p.frameworkId)?.versionLabel ?? ''
      return [
        version ? `${p.code} (${version})` : p.code,
        overallLabel(p),
        p.state === 'scored' ? levelLabelFor(p.overall) : '—',
        leaves.length,
        leaves.filter((d) => d.state === 'scored').length,
        pct(p.retainedShare),
        pct(p.scoredShare),
      ]
    }),
    columnStyles: {
      1: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
    },
    bodyFontSize: 7,
  })
  for (const f of mod.frameworks) r.text(confidenceLine(f), { size: 7, color: SLATE, gapAfter: 1 })

  r.page('Worst three per framework', 'Where each vocabulary says the weakness is')
  // Counted from the descriptor, never typed. This read "four different structures ...
  // not four findings" on TAIW, which offers three — the shape of every hardcoded count
  // in this repo, and the reason SuiteLanding.tsx's card numbers are wrong today.
  const n = mod.frameworks.length
  r.paragraph(
    `The same evidence, ranked by ${n} different structures. Where the frameworks agree on a ` +
      `weakness that is one finding seen repeatedly, not ${n} findings. Only SCORED dimensions are ` +
      `ranked — an unmeasured one is excluded rather than sorted to the polite end.`,
    { color: SLATE, size: 8 },
  )
  for (const p of projections) {
    const worst = worstThree(p)
    r.pageBreakIfNeeded(26)
    r.sectionHeading(`${p.code} — ${overallLabel(p)}`)
    if (worst.length === 0) {
      r.paragraph('No leaf dimension of this framework is scored, so there is nothing to rank.', { size: 8 })
      continue
    }
    r.table({
      head: ['Code', 'Dimension', 'Score', 'Level', 'Retained', 'Scored'],
      rows: worst.map((d) => [d.code, d.name, show1(d.score), levelLabelFor(d.score), pct(d.retainedShare), pct(d.scoredShare)]),
      columnStyles: {
        0: { cellWidth: 20 },
        2: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 16, halign: 'center' },
      },
      bodyFontSize: 7,
      gapAfter: 5,
    })
  }

  r.page('Coverage gaps', 'What each framework cannot see through this assessment')
  r.paragraph(
    'A framework reaching a high share of itself is a statement about the CROSSWALK, not about the ' +
      'organisation. This table is what stops the page above reading as corroboration.',
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Framework', 'Leaves', 'Not applicable', 'Not assessed', 'Partly retained'],
    rows: projections.map((p) => {
      const leaves = p.dimensions.filter((d) => d.isLeaf)
      return [
        p.code,
        leaves.length,
        leaves.filter((d) => d.state === 'not-applicable').length,
        leaves.filter((d) => d.state === 'not-assessed').length,
        leaves.filter((d) => d.state === 'scored' && d.retainedShare < 1 - EPS).length,
      ]
    }),
    columnStyles: {
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
    },
    bodyFontSize: 7,
  })

  /*
   * CONCENTRATION IS A PROPERTY OF THE PAIR, NOT OF THE FRAMEWORK.
   *
   * The same ten DGI leaves put 54.1% of their induced weight on one DGIW pillar and
   * 18.7% on HACR's eighty subcategories. Same framework, same weights, same authoring
   * standard — so a concentration figure is only meaningful beside the spine it was
   * measured against, and this table names both.
   */
  r.sectionHeading('Where each framework concentrates')
  r.paragraph(
    `The largest share of any one framework's induced weight falling on a single ` +
      `${mod.spineLabel}. Above roughly a third, a reader cannot tell the framework's view from that ` +
      `one node's score. Concentration is a property of the FRAMEWORK AND THE SPINE TOGETHER, not ` +
      `of the framework alone.`,
    { color: SLATE, size: 8 },
  )
  r.table({
    head: ['Framework', `Peak ${mod.spineLabel}`, 'Share of induced weight'],
    rows: projections.map((p) => {
      const w = mod.engine.inducedSpineWeights(p.frameworkId)
      const top = Object.entries(w).sort((a, b) => b[1] - a[1])[0]
      return top ? [p.code, mod.spine.find((n) => n.id === top[0])?.name ?? top[0], pct(top[1])] : [p.code, '—', '—']
    }),
    columnStyles: { 2: { cellWidth: 40, halign: 'center' } },
    bodyFontSize: 7,
  })

  r.page(`What ${mod.moduleLabel}'s assessment can and cannot evidence`)
  if (scorecardCaveats.length > 0) r.bullets(scorecardCaveats)
  unmappedSection(r, mod)
  r.sectionHeading('Structural qualifications')
  r.bullets(STRUCTURE_CAVEATS, { size: 8 })

  return r.build()
}
