/**
 * The pack view: every artefact DGIW can currently generate, in one place.
 *
 * TWO DIFFERENT FACTS ABOUT "LAYER", AND THEY ARE NOT THE SAME
 *
 * Each artefact in the register carries its own `layer` tag, and all five
 * implemented artefacts are tagged `core` — they are part of the sector-neutral
 * chassis. Applying `layerShows` to that tag would mark all five unavailable the
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
 */
import { useMemo } from 'react'
import { FileSpreadsheet, FileText, Package } from 'lucide-react'
import { Card, PageHeader, SectionTitle, Stat } from './ui'
import { useLayer, layerShows } from '../layer'
import { useDeliverable } from '../report/useDeliverable'
import { useDiagnosticAnswers } from '../answers'
import { applicableQuestions } from '../scoring'
import implementationPlan from '../data/implementationPlan.json'
import operatingModel from '../data/operatingModel.json'
import cdeRegister from '../data/cdeRegister.json'
import dqRules from '../data/dqRules.json'
import diagnostic from '../data/diagnostic.json'
import frameworks from '../data/frameworks.json'
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
]

export default function Deliverables() {
  const { filter } = useLayer()
  const [answers] = useDiagnosticAnswers()
  const { busy, message, metaFor, run } = useDeliverable()

  const cards = useMemo(
    () =>
      SPECS.map((spec) => {
        const artefact = ARTEFACTS.get(spec.artefactId)
        return { spec, artefact, count: spec.count(filter) }
      }),
    [filter],
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
      if (artefactId === 'AR-13') {
        const { buildCdeRegisterRows } = await import('../report/cdeRegister')
        const { rows, columns } = buildCdeRegisterRows({ meta })
        return downloadCsv(rows, columns, reportFilename(meta, 'csv'))
          ? null
          : 'No critical data elements are in scope under the current layer, so no file was written.'
      }
      const { buildDqRuleSpecRows } = await import('../report/dqRuleSpec')
      const { rows, columns } = buildDqRuleSpecRows({ meta })
      return downloadCsv(rows, columns, reportFilename(meta, 'csv'))
        ? null
        : 'No DQ rules are in scope under the current layer, so no file was written.'
    })

  const pdfFor = (artefactId: string) =>
    run(`${artefactId}:pdf`, async () => {
      const [{ saveReport }, { reportFilename }] = await Promise.all([
        import('../../report/spine'),
        import('../../report/naming'),
      ])
      const meta = metaFor(artefactId)
      switch (artefactId) {
        case 'AR-01': {
          const { buildDiagnosticReport } = await import('../report/diagnosticReport')
          saveReport(buildDiagnosticReport({ meta, answers }), reportFilename(meta, 'pdf'))
          return null
        }
        case 'AR-13': {
          const { buildCdeRegisterPdf } = await import('../report/cdeRegister')
          saveReport(buildCdeRegisterPdf({ meta }), reportFilename(meta, 'pdf'))
          return null
        }
        case 'AR-27': {
          const { buildDqRuleSpecPdf } = await import('../report/dqRuleSpec')
          saveReport(buildDqRuleSpecPdf({ meta }), reportFilename(meta, 'pdf'))
          return null
        }
        case 'AR-04': {
          const { buildRoadmapPdf } = await import('../report/roadmap')
          saveReport(buildRoadmapPdf({ meta }), reportFilename(meta, 'pdf'))
          return null
        }
        case 'AR-09': {
          const { buildOperatingModelPdf } = await import('../report/operatingModel')
          saveReport(buildOperatingModelPdf({ meta }), reportFilename(meta, 'pdf'))
          return null
        }
        case 'AR-48': {
          const { buildMultiFrameworkScorecardPdf } = await import('../report/multiFrameworkScorecard')
          saveReport(buildMultiFrameworkScorecardPdf({ meta, answers }), reportFilename(meta, 'pdf'))
          return null
        }
        case 'AR-47': {
          const { buildFrameworkAlignmentPdf } = await import('../report/frameworkAlignment')
          const name = reportFilename(meta, 'pdf').replace(/\.pdf$/, '_dmbok2.pdf')
          saveReport(buildFrameworkAlignmentPdf({ meta, answers, frameworkId: 'FW-01' }), name)
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
        <Stat value={PLAN.artefactRegister.length} label="Artefacts in the register" />
        <Stat
          value={`${Math.round((SPECS.length / PLAN.artefactRegister.length) * 100)}%`}
          label="Register coverage"
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
        <SectionTitle hint="The register catalogues 46 artefacts across the five rungs. These five are the ones the workbench generates today; the rest are produced by hand during delivery.">
          Coverage
        </SectionTitle>
        <p className="text-sm text-slate-600 leading-relaxed">
          The same generators are reachable from the pages where the content lives —{' '}
          {SPECS.filter((s) => s.shortcut).length} of the five have a shortcut on their own page. This
          page is the pack view: it exists so a consultant assembling a handover does not have to
          remember which screen produces which artefact.
        </p>
      </Card>
    </div>
  )
}
