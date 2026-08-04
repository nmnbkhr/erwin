/**
 * The pack view: every artefact DGIW can currently generate, in one place.
 *
 * TWO DIFFERENT FACTS ABOUT "LAYER", AND THEY ARE NOT THE SAME
 *
 * Each artefact in the register carries its own `layer` tag, and every
 * implemented artefact is tagged `core` — they are part of the sector-neutral
 * chassis. Applying `layerShows` to that tag would mark them all unavailable the
 * moment a consultant switches to the banking overlay, which is nonsense: the CDE
 * register under the banking layer is 52 elements and generates perfectly well.
 *
 * So the card shows both, separately labelled:
 *
 *   - "Catalogued as" — the artefact's own layer tag, a fact about the method.
 *   - "In scope now"  — how many records the generator would actually put in the
 *                       document under the current filter, counted from the same
 *                       predicate the generator uses.
 *
 * Availability is the second one. An artefact with zero in-scope content is
 * rendered as unavailable with its button disabled, because a button that
 * produces an empty document is worse than one that explains itself.
 *
 * The counts are derived from the datasets, never typed in — SuiteLanding.tsx is
 * the standing example in this repo of hardcoded dataset counts drifting away
 * from the data they describe.
 *
 * IT DRIFTED HERE TOO, WHICH IS THE POINT. The header comment above and the
 * coverage card below both said "five" while SPECS held seven, and the card said
 * "46 artefacts across the five rungs" against a register of 48 across four. Two
 * generators had landed since; nobody reads a prose sentence for arithmetic. Both
 * counts are now computed from the same arrays the page renders, and the paragraph
 * is phrased so there is no number left in it to go stale.
 *
 * The scoreboard denominator is DERIVED, not catalogued. Three register entries
 * are `withdrawn` — shapes the datasets cannot support, kept with their reason
 * rather than deleted — and eighteen more are authored/observed/blocked content
 * nobody has written. "7 of 48" would read as 15% of a plan; the honest fraction
 * is against the entries a generator may legally be written for, which is what
 * `builtFrom.evidence === 'derived'` marks and ARTEFACT-EVIDENCE enforces.
 */
import { useMemo } from 'react'
import { FileSpreadsheet, FileText, Package } from 'lucide-react'
import { Card, PageHeader, SectionTitle, Stat } from './ui'
import { useLayer, layerShows } from '../layer'
import { useDeliverable } from '../report/useDeliverable'
import { answerEvidence, answerScores, useDiagnosticAnswers } from '../answers'
import { useAssessmentTier, useDiagnosticTargets } from '../assessmentState'
import { applicableQuestions } from '../scoring'
import { useProgramIntake } from '../intake/state'
import { PILLAR_IDS, intakeIsActionable, validScopeIds } from '../intake/types'
// G3: the single gap function — pure, no jsPDF, safe to import statically.
import { gapRegister } from '../gap/register'
import implementationPlan from '../data/implementationPlan.json'
import operatingModel from '../data/operatingModel.json'
import cdeRegister from '../data/cdeRegister.json'
import dqRules from '../data/dqRules.json'
import diagnostic from '../data/diagnostic.json'
import frameworks from '../../frameworks/data/frameworks.json'
import type {
  CriticalDataElement,
  DiagnosticData,
  DqRule,
  FrameworksData,
  ImplementationPlanData,
  LayerFilter,
  OperatingModelData,
} from '../types'

const PLAN = implementationPlan as ImplementationPlanData
const OM = operatingModel as OperatingModelData
const CDES = cdeRegister as CriticalDataElement[]
const RULES = dqRules as DqRule[]
const DIAG = diagnostic as DiagnosticData
const FW = frameworks as unknown as FrameworksData

const ARTEFACTS = new Map(PLAN.artefactRegister.map((a) => [a.id, a]))

/** Every count on this page, computed once from the register itself. */
const CATALOGUE = {
  total: PLAN.artefactRegister.length,
  rungs: new Set(PLAN.artefactRegister.map((a) => a.rung)).size,
  derived: PLAN.artefactRegister.filter((a) => a.builtFrom.evidence === 'derived').length,
  withdrawn: PLAN.artefactRegister.filter((a) => a.builtFrom.evidence === 'withdrawn').length,
  blocked: PLAN.artefactRegister.filter((a) => a.builtFrom.evidence === 'blocked').length,
}

/** Which output a consultant actually hands over. */
type Primary = 'csv' | 'pdf'

interface Spec {
  artefactId: string
  /** What the workbench calls it, where that reads better than the register's wording. */
  title: string
  blurb: string
  primary: Primary
  /** Records the generator would emit under the given filter. */
  count: (filter: LayerFilter) => number
  countLabel: string
  /** Where the same buttons live inside the workbench. */
  shortcut: string
  /**
   * The boundary statement, rendered in amber rather than folded into `blurb`.
   *
   * Wave A's four artefacts each carry one, and each is the same sentence that
   * appears on the document's cover and in every row of its CSV. Three surfaces,
   * one string, because a caveat that lives only on the PDF is absent from the
   * spreadsheet a client actually works in, and one that lives only in prose on
   * this card is absent from both.
   *
   * Optional: the seven older artefacts predate it. That is the honest state
   * rather than seven caveats invented in a hurry to fill a required field — the
   * durable record is `builtFrom.note` in the register, which ARTEFACT-EVIDENCE
   * requires of all 48.
   */
  caveat?: string
}

const SPECS: Spec[] = [
  {
    artefactId: 'AR-01',
    title: 'Maturity Diagnostic',
    blurb:
      'Weighted maturity by pillar, the gap to target, and the pillars ranked by weighted shortfall. ' +
      'Pillars with nothing answered are reported as not assessed — never as zero.',
    primary: 'pdf',
    count: (f) => applicableQuestions(DIAG.questions, f).length,
    countLabel: 'diagnostic questions',
    shortcut: '/dg/diagnostic',
  },
  {
    artefactId: 'AR-13',
    title: 'Critical Data Element Register',
    blurb:
      'The working register: every element with its owner, resolved archetype, DQ dimensions, source ' +
      'system, consumers and definition.',
    primary: 'csv',
    count: (f) => CDES.filter((c) => layerShows(f, c.layer)).length,
    countLabel: 'elements',
    shortcut: '/dg/cde',
  },
  {
    artefactId: 'AR-27',
    title: 'DQ Rule Specification',
    blurb:
      'Every rule with its expression, threshold, severity and remediation, joined to the element it ' +
      'protects. Rules whose element is out of scope are flagged, never dropped.',
    primary: 'csv',
    count: (f) => RULES.filter((r) => layerShows(f, r.layer)).length,
    countLabel: 'rules',
    shortcut: '/dg/rules',
  },
  {
    artefactId: 'AR-04',
    title: 'Implementation Roadmap',
    blurb:
      'The seven waves with their dependencies, and the eleven gates mapped to the flows that run ' +
      'them. Waves and gates outside the current layer are named as out of scope, not omitted.',
    primary: 'pdf',
    count: (f) => PLAN.waves.filter((w) => layerShows(f, w.layer)).length,
    countLabel: 'waves',
    shortcut: '',
  },
  /*
   * ── G1: the charter, generated from the Program Design intake ──────────
   *
   * The one card whose count is NOT a function of the layer filter: charter
   * scope comes from the intake, which is engagement state a module-level
   * const cannot read. The component overrides the count below — actionable
   * intake: pillars in scope; otherwise the full pillar universe the template
   * renders. `count` here is the reference-mode value.
   */
  {
    artefactId: 'AR-08',
    title: 'Data Governance Charter',
    blurb:
      'The engagement charter from the Program Design intake: mandate, drivers, scope with ' +
      'explicit exclusions, sponsorship, and the engagement RACI. Every client-specific string ' +
      'traces to an intake field; sections with no intake content are omitted, never padded.',
    caveat:
      'INTAKE-DRIVEN. Without an actionable intake — organisation name, at least one driver, at ' +
      'least one pillar in scope — the output is the reference TEMPLATE, watermarked ILLUSTRATIVE ' +
      'on every page and flagged mode: reference in the provenance log. It is not a client ' +
      'deliverable in that state. Term, amendment procedure and review cycle are authored with ' +
      'the sponsor, not generated.',
    primary: 'pdf',
    count: () => PILLAR_IDS.length,
    countLabel: 'pillars in charter scope',
    shortcut: '/dg/design',
  },
  {
    artefactId: 'AR-09',
    title: 'Target Operating Model',
    blurb:
      'Role archetypes, the RACI with its integrity check, accountability resolved through the role ' +
      'registry, the delivery flows and the mobilisation checklist.',
    primary: 'pdf',
    count: (f) => OM.roles.filter((r) => layerShows(f, r.layer)).length,
    countLabel: 'role archetypes',
    shortcut: '/dg/operating-model',
  },
  {
    artefactId: 'AR-48',
    title: 'Multi-Framework Scorecard',
    blurb:
      'All four published frameworks side by side from one assessment, with each framework’s ' +
      'weakest three dimensions and the coverage gaps — including which capabilities a framework ' +
      'maps nothing to at all.',
    primary: 'pdf',
    count: () => FW.frameworks.length,
    countLabel: 'frameworks',
    shortcut: '/dg/frameworks',
  },
  {
    artefactId: 'AR-47',
    title: 'Framework Alignment Pack',
    blurb:
      'The audit-facing document: dimension by dimension, how this programme satisfies one ' +
      'framework, carrying the authored rationale for every mapping. Generated per framework from ' +
      'the crosswalk page.',
    primary: 'pdf',
    // From here the pack is generated for DMBOK2, the one framework at high
    // structure confidence. The other three are generated from the crosswalk
    // page, where the reader can see the confidence qualification first.
    count: () => FW.dimensions.filter((d) => d.frameworkId === 'FW-01').length,
    countLabel: 'DMBOK2 dimensions — other frameworks from the crosswalk page',
    shortcut: '/dg/frameworks',
  },

  /*
   * ── WAVE A: four register pivots over the CDE spine ────────────────────
   *
   * One dataset, four grains — element, reference-model entity, source system,
   * consumption point. They share `report/cdeJoins.ts`, which is the point:
   * three relations verified once against the counter hypothesis buy all four,
   * where HCF-LINK verified 720/720 completeness and never verified the relation.
   *
   * Every one carries a `caveat`. Each is the sentence on its own cover and in
   * every row of its CSV, and for AR-05 it is the entire difference between the
   * artefact and AR-25, which the register marks blocked.
   *
   * No shortcut on any of the four: their content lives on /dg/cde, but no
   * buttons have been added there, and claiming a shortcut that does not exist
   * would make the count below false.
   */
  {
    artefactId: 'AR-23',
    title: 'Business Glossary',
    blurb:
      'Every governed element as a business term: the authored definition, the owning role and its ' +
      'resolved archetype, the domain and the system it is anchored in. Grouped by domain.',
    caveat:
      'Unapproved. No synonyms, no approval status, no contested-term history, no physical ' +
      'binding — none of the four exists in any dataset. Same 76 elements as the CDE register: a ' +
      'second view, not a second body of evidence.',
    primary: 'csv',
    count: (f) => CDES.filter((c) => layerShows(f, c.layer)).length,
    countLabel: 'terms',
    shortcut: '',
  },
  {
    artefactId: 'AR-20',
    title: 'Banking Reference Model Mapping',
    blurb:
      'Elements grouped by the reference-model entity they realise, with domain, source system, ' +
      'criticality and in-scope rule count per entity. Entities realised by several systems are ' +
      'called out as the work list they are.',
    caveat:
      'Element-to-entity only. The reference model’s own catalogue is not held here, so which of ' +
      'its entities we map nothing to is not computable and no coverage percentage is given. ' +
      'Several systems on one entity is not a system-of-record designation — none exists.',
    primary: 'csv',
    count: (f) => new Set(CDES.filter((c) => layerShows(f, c.layer)).map((c) => c.fsdmEntity)).size,
    countLabel: 'reference-model entities',
    shortcut: '',
  },
  {
    artefactId: 'AR-02',
    title: 'Data Landscape Map',
    blurb:
      'The estate by source system: elements and criticality per system, a system × domain ' +
      'adjacency grid, the consumption points each system feeds, and the ownership section.',
    caveat:
      'No system-to-system relation exists in any dataset. Every adjacency is joined through an ' +
      'element — system to domain, system to consumption point, one hop each. This is an ' +
      'inventory with a grid, not a topology; no arrow between two systems follows from it.',
    primary: 'csv',
    count: (f) => new Set(CDES.filter((c) => layerShows(f, c.layer)).map((c) => c.sourceSystem)).size,
    countLabel: 'source systems',
    shortcut: '',
  },
  {
    artefactId: 'AR-05',
    title: 'Illustrative Backward-Lineage Trace',
    blurb:
      'The derivation method on real elements: for the three most-evidenced consumption points, ' +
      'the elements that feed them and the systems those come from. Points are ranked by feeder ' +
      'count, then in-scope rule count, then name — and the whole ranking is printed, not just ' +
      'the three traced.',
    caveat:
      'THIS IS NOT LINEAGE. Two authored hops — consumption point to element to source system — ' +
      'and nothing between them. No transformation logic, no column-level detail. End-to-end ' +
      'lineage is AR-25 and the register marks it blocked.',
    primary: 'csv',
    count: (f) =>
      new Set(CDES.filter((c) => layerShows(f, c.layer)).flatMap((c) => c.consumers)).size,
    countLabel: 'consumption points reachable',
    shortcut: '',
  },

  /*
   * ── WAVE C: one assessment note ────────────────────────────────────────
   *
   * The AR-01/AR-48 shape narrowed to a single pillar. PDF only, and the absence
   * of a CSV is a decision rather than an omission — see the generator's header:
   * five questions and four scores have nothing to sort and nothing to assign,
   * and a five-row spreadsheet emitted for symmetry would imply a working
   * artefact that it is not.
   */
  {
    artefactId: 'AR-06',
    title: 'AI Readiness Gap Statement',
    blurb:
      'P11 scored through the same function the diagnostic screen calls, its five questions with ' +
      'the answer given and the level description at that answer, the three pillars P11’s own ' +
      'focus text names as dependencies printed beside it, and how the four published frameworks ' +
      'reach this pillar.',
    caveat:
      'Pillar level only — one pillar’s score and its five questions. NO USE CASES EXIST IN ANY ' +
      'DATASET, though the ladder and P11’s banking overlay both say "per candidate use case". ' +
      'P08, P07 and P05 print separately and are never combined into a readiness index no dataset ' +
      'defines. NOT ASSESSED is not zero, and the denominator prints.',
    primary: 'pdf',
    count: (f) => applicableQuestions(DIAG.questions, f).filter((q) => q.pillarId === 'P11').length,
    countLabel: 'P11 questions in scope',
    shortcut: '/dg/diagnostic',
  },

  /*
   * ── WAVE D: the tooling recommendation ─────────────────────────────────
   *
   * The last derived-and-unbuilt entry, and the only generator that reads
   * positioning.json — a dataset no report had ever touched. Its header records
   * what that file turned out to hold and which fields are deliberately not
   * reproduced; the short version is on the card below.
   */
  {
    artefactId: 'AR-17',
    title: 'Tooling Recommendation',
    blurb:
      'Two tiers and their eight components with the authored selection rationale for each, the ' +
      'capability layers rendered as bands, the source systems the governed elements are sourced ' +
      'from as the connector scope, and P10’s platform constraints.',
    caveat:
      'Capability layers, NOT a wired topology — no integration edge exists in any dataset, and ' +
      'P10’s overlay names an on-premise topology it does not contain. The system count is what ' +
      'this engagement governs, not the bank’s estate. Products are a recommendation, not an ' +
      'evaluation: the two tiers share no capability, so no comparison matrix is possible.',
    primary: 'pdf',
    count: (f) => new Set(CDES.filter((c) => layerShows(f, c.layer)).map((c) => c.sourceSystem)).size,
    countLabel: 'source systems in connector scope',
    shortcut: '',
  },
  /*
   * ── WAVE E: the programme gap report ───────────────────────────────────
   *
   * The INVERSE of the coverage artefact this join invites and cannot support.
   * The generator's header carries the measurement that killed the coverage
   * shape — 44 leaf dimensions producing 30 distinct answers, CL-01 returned as
   * the remedy for seventeen of them — and the reason no percentage appears on
   * any surface of this one. PDF only, on AR-06's argument: eleven rows whose
   * finding is the prose beside them, not a column to sort.
   */
  {
    artefactId: 'AR-54',
    title: 'Programme Gap Report',
    blurb:
      'Every pillar thinnest-first with its three-state verdict, each framework\u2019s induced share ' +
      'from the projection engine in its own column, every catalogued artefact printed with its ' +
      'register disposition, the leaf dimensions whose pillars carry nothing this workbench can ' +
      'produce, and the waves that name an unscheduled pillar.',
    caveat:
      'NO COVERAGE FIGURE ANYWHERE. The pillarId on a checklist item or an artefact is a FILING \u2014 ' +
      'no weight, no rationale \u2014 and no dataset relates either to a framework dimension. A ' +
      'withdrawn or blocked entry is not a remedy and is never counted as one. The four framework ' +
      'columns are never summed. No artefact is attached to any wave.',
    primary: 'pdf',
    count: (f) =>
      PLAN.artefactRegister.filter((a) => layerShows(f, a.layer) && a.builtFrom.evidence !== 'withdrawn').length,
    countLabel: 'live catalogued artefacts in scope',
    shortcut: '/dg/frameworks',
  },
  {
    artefactId: 'AR-55',
    title: 'Maturity Gap Register',
    blurb:
      'Every pillar with both measurements — a current score at the active tier and a ' +
      'consultant-set target — as one statement each: the gap, the priority with its formula and ' +
      'inputs stated, the framework dimensions resting on the pillar, and the recorded evidence. ' +
      'Excluded pillars are listed with the reason.',
    caveat:
      'ENGAGEMENT MODE ONLY. A gap is two measurements of THIS engagement, so there is no ' +
      'reference mode and no ILLUSTRATIVE fallback: without an actionable intake, or with no ' +
      'pillar carrying both measurements at the active tier, generation REFUSES with the reason ' +
      'rather than producing an empty or watermarked document.',
    primary: 'pdf',
    // Overridden in the cards memo below — the count is the live register's
    // entry count, which needs engagement state a module constant cannot read.
    count: () => 0,
    countLabel: 'pillars with both measurements',
    shortcut: '/dg/gaps',
  },
]

export default function Deliverables() {
  const { filter } = useLayer()
  const [answersRich] = useDiagnosticAnswers()
  // The numeric view the generators take — their math is untouched by G2.
  const answers = useMemo(() => answerScores(answersRich), [answersRich])
  // G2: the assessment tier and targets the score-carrying artefacts state.
  // Same stores the Diagnostic page writes — the pack view must produce the
  // assessment the consultant was just looking at.
  const [tier] = useAssessmentTier()
  const [targets] = useDiagnosticTargets()
  const [intake] = useProgramIntake()
  const { busy, message, metaFor, run } = useDeliverable()

  // G1: one predicate decides both documents' mode — imported, never re-derived.
  const actionable = intakeIsActionable(intake)
  const intakeMode = actionable ? ('engagement' as const) : ('reference' as const)
  const scopeCount = validScopeIds(intake).length

  // G3: the live register, for AR-55's card count and its generator input.
  const gapEntries = useMemo(
    () => gapRegister(answersRich, targets, tier, filter, intake),
    [answersRich, targets, tier, filter, intake],
  )

  const cards = useMemo(
    () =>
      SPECS.map((spec) => {
        const artefact = ARTEFACTS.get(spec.artefactId)
        // AR-08's count comes from the intake, not the layer filter — see the
        // spec's own comment. AR-55's comes from the live gap register, which
        // is engagement state no module-level count() can read.
        const count =
          spec.artefactId === 'AR-08' && actionable
            ? scopeCount
            : spec.artefactId === 'AR-55'
              ? gapEntries.length
              : spec.count(filter)
        return { spec, artefact, count }
      }),
    [filter, actionable, scopeCount, gapEntries],
  )

  const available = cards.filter((c) => c.count > 0).length

  /* ---- generation ---- */

  const csvFor = (artefactId: string) =>
    run(`${artefactId}:csv`, async () => {
      const [{ downloadCsv }, { reportFilename }] = await Promise.all([
        import('../../report/csv'),
        import('../../report/naming'),
      ])
      const meta = metaFor(artefactId)
      // One shape per artefact: build rows, hand them to downloadCsv, and let
      // its `false` become a sentence. An empty result is a legitimate output
      // and a silent no-op reads as a broken button.
      switch (artefactId) {
        case 'AR-13': {
          const { buildCdeRegisterRows } = await import('../report/cdeRegister')
          const { rows, columns } = buildCdeRegisterRows({ meta })
          return downloadCsv(rows, columns, reportFilename(meta, 'csv'), meta)
            ? null
            : 'No critical data elements are in scope under the current layer, so no file was written.'
        }
        case 'AR-23': {
          const { buildBusinessGlossaryRows } = await import('../report/businessGlossary')
          const { rows, columns } = buildBusinessGlossaryRows({ meta })
          return downloadCsv(rows, columns, reportFilename(meta, 'csv'), meta)
            ? null
            : 'No governed terms are in scope under the current layer, so no file was written.'
        }
        case 'AR-20': {
          const { buildReferenceModelRows } = await import('../report/referenceModelMapping')
          const { rows, columns } = buildReferenceModelRows({ meta })
          return downloadCsv(rows, columns, reportFilename(meta, 'csv'), meta)
            ? null
            : 'No elements are in scope under the current layer, so nothing maps to the reference model and no file was written.'
        }
        case 'AR-02': {
          const { buildDataLandscapeRows } = await import('../report/dataLandscape')
          const { rows, columns } = buildDataLandscapeRows({ meta })
          return downloadCsv(rows, columns, reportFilename(meta, 'csv'), meta)
            ? null
            : 'No source systems are in scope under the current layer, so no file was written.'
        }
        case 'AR-05': {
          const { buildLineageTraceRows } = await import('../report/lineageTrace')
          const { rows, columns } = buildLineageTraceRows({ meta })
          return downloadCsv(rows, columns, reportFilename(meta, 'csv'), meta)
            ? null
            : 'No consumption points are reachable under the current layer, so there is nothing to trace back from and no file was written.'
        }
        default: {
          const { buildDqRuleSpecRows } = await import('../report/dqRuleSpec')
          const { rows, columns } = buildDqRuleSpecRows({ meta })
          return downloadCsv(rows, columns, reportFilename(meta, 'csv'), meta)
            ? null
            : 'No DQ rules are in scope under the current layer, so no file was written.'
        }
      }
    })

  const pdfFor = (artefactId: string) =>
    run(`${artefactId}:pdf`, async () => {
      const [{ saveReport }, { reportFilename }] = await Promise.all([
        import('../../report/spine'),
        import('../../report/naming'),
      ])
      // G1: the intake-driven artefacts carry a mode; every other meta is
      // built exactly as before and its provenance records stay null. AR-55
      // is always 'engagement' — it has no reference mode; the generator
      // refuses instead, and the refusal surfaces as this page's message.
      const baseMeta = metaFor(
        artefactId,
        false,
        artefactId === 'AR-08' || artefactId === 'AR-09'
          ? intakeMode
          : artefactId === 'AR-55'
            ? 'engagement'
            : undefined,
      )
      // G2: only the artefacts whose GENERATOR applies the tier carry it in
      // meta — claiming a tier the document did not apply would be a lying
      // record. G3 closed the AR-06 flag (its generator now takes the tier)
      // and added AR-54's maturity section and AR-55, so all three join.
      const SCORE_CARRIERS = ['AR-01', 'AR-48', 'AR-47', 'AR-06', 'AR-54', 'AR-55']
      const tierQuestions = applicableQuestions(DIAG.questions, filter, tier)
      const meta = SCORE_CARRIERS.includes(artefactId)
        ? {
            ...baseMeta,
            assessmentTier: tier,
            assessmentCoverage: {
              answered: tierQuestions.filter((q) => answers[q.id] !== undefined).length,
              applicable: tierQuestions.length,
            },
          }
        : baseMeta
      switch (artefactId) {
        case 'AR-08': {
          const { buildCharterPdf } = await import('../report/charter')
          saveReport(buildCharterPdf({ meta, intake }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-01': {
          const { buildDiagnosticReport } = await import('../report/diagnosticReport')
          saveReport(
            buildDiagnosticReport({ meta, answers, tier, evidence: answerEvidence(answersRich), targets }),
            reportFilename(meta, 'pdf'),
            meta,
          )
          return null
        }
        case 'AR-13': {
          const { buildCdeRegisterPdf } = await import('../report/cdeRegister')
          saveReport(buildCdeRegisterPdf({ meta }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-27': {
          const { buildDqRuleSpecPdf } = await import('../report/dqRuleSpec')
          saveReport(buildDqRuleSpecPdf({ meta }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-04': {
          const { buildRoadmapPdf } = await import('../report/roadmap')
          saveReport(buildRoadmapPdf({ meta }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-09': {
          const { buildOperatingModelPdf } = await import('../report/operatingModel')
          saveReport(buildOperatingModelPdf({ meta, intake }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-48': {
          const { buildMultiFrameworkScorecardPdf } = await import('../report/multiFrameworkScorecard')
          saveReport(buildMultiFrameworkScorecardPdf({ meta, answers, tier }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-47': {
          const { buildFrameworkAlignmentPdf } = await import('../report/frameworkAlignment')
          const name = reportFilename(meta, 'pdf').replace(/\.pdf$/, '_dmbok2.pdf')
          saveReport(buildFrameworkAlignmentPdf({ meta, answers, frameworkId: 'FW-01', tier }), name, meta)
          return null
        }
        case 'AR-23': {
          const { buildBusinessGlossaryPdf } = await import('../report/businessGlossary')
          saveReport(buildBusinessGlossaryPdf({ meta }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-20': {
          const { buildReferenceModelPdf } = await import('../report/referenceModelMapping')
          saveReport(buildReferenceModelPdf({ meta }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-02': {
          const { buildDataLandscapePdf } = await import('../report/dataLandscape')
          saveReport(buildDataLandscapePdf({ meta }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-05': {
          const { buildLineageTracePdf } = await import('../report/lineageTrace')
          saveReport(buildLineageTracePdf({ meta }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-06': {
          const { buildAiReadinessPdf } = await import('../report/aiReadiness')
          saveReport(buildAiReadinessPdf({ meta, answers, tier }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        case 'AR-54': {
          const { buildProgrammeGapPdf } = await import('../report/programmeGap')
          saveReport(
            buildProgrammeGapPdf({ meta, maturity: { answers: answersRich, targets, tier, intake } }),
            reportFilename(meta, 'pdf'),
            meta,
          )
          return null
        }
        case 'AR-55': {
          const { buildGapStatementsPdf } = await import('../report/gapStatements')
          // The generator refuses (throws) without an actionable intake or an
          // empty register; run() surfaces the reason as this page's message.
          saveReport(
            buildGapStatementsPdf({ meta, answers: answersRich, targets, tier, intake }),
            reportFilename(meta, 'pdf'),
            meta,
          )
          return null
        }
        case 'AR-17': {
          const { buildToolingRecommendationPdf } = await import('../report/toolingRecommendation')
          saveReport(buildToolingRecommendationPdf({ meta }), reportFilename(meta, 'pdf'), meta)
          return null
        }
        default:
          // Unreachable through the UI: every card's id is one of the five above.
          // Surfaced rather than silently doing nothing if a sixth is ever added.
          throw new Error(`No generator is wired for artefact ${artefactId}.`)
      }
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliverables"
        subtitle="Every artefact this workbench can generate for the active engagement, in the format a client receives it. Each one is stamped with the engagement name, the layer scope and the date on its cover, and regenerating it produces the same bytes."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat value={SPECS.length} label="Artefacts implemented" tone="rose" />
        <Stat value={available} label="Available under the current layer" />
        <Stat value={CATALOGUE.total} label="Artefacts in the register" />
        <Stat
          value={`${SPECS.length}/${CATALOGUE.derived}`}
          label="Of the artefacts a generator can be written for"
        />
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <SectionTitle hint="The primary format is the deliverable. Where a CSV is primary, the PDF is a summary for the pack — it is not the register and should not be handed over as one.">
          Artefacts
        </SectionTitle>

        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map(({ spec, artefact, count }) => {
            const unavailable = count === 0
            const csvBusy = busy === `${spec.artefactId}:csv`
            const pdfBusy = busy === `${spec.artefactId}:pdf`
            const anyBusy = busy !== null

            return (
              <Card key={spec.artefactId} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{spec.artefactId}</span>
                      <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 bg-slate-100 text-slate-600 ring-slate-200">
                        Rung {artefact?.rung ?? '—'}
                      </span>
                      {spec.primary === 'csv' ? (
                        <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 bg-rose-50 text-rose-700 ring-rose-200">
                          CSV is the deliverable
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 bg-slate-100 text-slate-600 ring-slate-200">
                          PDF report
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mt-1">{spec.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {artefact?.artefact ?? 'Not in the artefact register'}
                    </p>
                  </div>
                  <Package size={18} className="text-slate-300 shrink-0" />
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{spec.blurb}</p>

                {spec.caveat && (
                  <p className="text-xs text-amber-800 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                    {spec.caveat}
                  </p>
                )}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-slate-100 pt-3">
                  <div>
                    <dt className="text-slate-400">Owning role</dt>
                    <dd className="text-slate-700">{artefact?.owner ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Register format</dt>
                    <dd className="text-slate-700">{artefact?.format ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Catalogued as</dt>
                    <dd className="text-slate-700">
                      {artefact ? (artefact.layer === 'core' ? 'Core chassis' : 'Banking overlay') : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">In scope now</dt>
                    <dd className={unavailable ? 'text-amber-700 font-medium' : 'text-slate-700'}>
                      {unavailable
                        ? `No ${spec.countLabel} under this layer`
                        : `${count} ${spec.countLabel}`}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {spec.primary === 'csv' && (
                    <button
                      onClick={() => csvFor(spec.artefactId)}
                      disabled={unavailable || anyBusy}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FileSpreadsheet size={15} />
                      {csvBusy ? 'Generating…' : 'Download CSV'}
                    </button>
                  )}
                  <button
                    onClick={() => pdfFor(spec.artefactId)}
                    disabled={unavailable || anyBusy}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      spec.primary === 'pdf'
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText size={15} />
                    {pdfBusy ? 'Generating…' : spec.primary === 'pdf' ? 'Download PDF' : 'PDF summary'}
                  </button>
                  {unavailable && (
                    <span className="text-xs text-amber-700">
                      Nothing in scope to put in this document.
                    </span>
                  )}
                </div>

                {spec.primary === 'csv' && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The CSV is the artefact — it carries every column. The PDF summarises it for the
                    pack and is not a substitute for the register.
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      <Card className="p-5">
        <SectionTitle
          hint={`The register catalogues ${CATALOGUE.total} artefacts across ${CATALOGUE.rungs} rungs. The ones above are what the workbench generates today; the rest are produced by hand during delivery.`}
        >
          Coverage
        </SectionTitle>
        <p className="text-sm text-slate-600 leading-relaxed">
          The same generators are reachable from the pages where the content lives —{' '}
          {SPECS.filter((s) => s.shortcut).length} of the {SPECS.length} have a shortcut on their own
          page. This page is the pack view: it exists so a consultant assembling a handover does not
          have to remember which screen produces which artefact.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed mt-3">
          The fraction above is against {CATALOGUE.derived}, not {CATALOGUE.total}. Every register
          entry records what it would be <em>built from</em>, and only a{' '}
          <span className="font-mono text-xs">derived</span> one names datasets a generator can read.
          Of the rest, {CATALOGUE.blocked} are blocked on another artefact landing first and{' '}
          {CATALOGUE.withdrawn} are withdrawn — shapes the datasets cannot support, kept in the
          register with the reason rather than deleted, so nobody re-catalogues them. An id here is
          otherwise a standing invitation to build against it.
        </p>
      </Card>
    </div>
  )
}
