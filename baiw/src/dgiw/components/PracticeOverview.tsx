import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, PageHeader, SectionTitle, Stat } from './ui'
import { useLayer } from '../layer'
import pillars from '../data/pillars.json'
import ladder from '../data/ladder.json'
import positioning from '../data/positioning.json'
import cdeRegister from '../data/cdeRegister.json'
import dqRules from '../data/dqRules.json'
import diagnostic from '../data/diagnostic.json'
import type { Pillar, LadderRung, PositioningData, CriticalDataElement, DqRule, DiagnosticData } from '../types'

const PILLARS = pillars as Pillar[]
const LADDER = ladder as LadderRung[]
const POS = positioning as PositioningData
const CDES = cdeRegister as CriticalDataElement[]
const RULES = dqRules as DqRule[]
const DIAG = diagnostic as DiagnosticData

export default function PracticeOverview() {
  const { filter, keep, shows } = useLayer()
  const [expanded, setExpanded] = useState<string | null>(null)

  const wedges = keep(POS.wedges)
  const accelerators = keep(POS.accelerators)

  const counts = useMemo(() => {
    const questions = DIAG.questions.filter((q) => shows(q.layer))
    return {
      questions: questions.length,
      cdes: keep(CDES).length,
      rules: keep(RULES).length,
    }
  }, [keep, shows])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Governance Practice"
        subtitle="A four-rung service ladder — diagnostic, blueprint, implementation, managed — built on eleven governance pillars. Everything here exists in two layers: a sector-neutral core chassis, and a banking overlay that carries the reference-model, regulatory and core-banking specifics. Use the Layer switch in the sidebar to see either, or both."
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat value={PILLARS.length} label="Governance pillars" />
        <Stat value={counts.questions} label={`Diagnostic questions (${filter === 'all' ? 'both layers' : filter})`} tone="rose" />
        <Stat value={counts.cdes} label="Pre-mapped critical data elements" />
        <Stat value={counts.rules} label="Pre-written DQ rules" />
        <Stat value={LADDER.length} label="Independently sellable rungs" />
      </div>

      {/* Positioning thesis */}
      <Card className="p-5 border-l-4 border-l-rose-500">
        <p className="text-sm text-slate-700 leading-relaxed">{POS.thesis}</p>
      </Card>

      {/* Pain-led wedges */}
      <div>
        <SectionTitle hint="Lead with the pain the client is already funding. Governance is delivered underneath it.">
          Entry wedges
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wedges.map((w) => (
            <Card key={w.id} className="p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-slate-800">{w.name}</h3>
                <span className={`shrink-0 text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 ${w.layer === 'banking' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                  {w.layer}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{w.pain}</p>
              <p className="text-xs text-slate-500 mb-1"><span className="font-medium text-slate-600">Trigger:</span> {w.trigger}</p>
              <p className="text-xs text-slate-500 italic mt-auto pt-2 border-t border-slate-100">&ldquo;{w.opener}&rdquo;</p>
            </Card>
          ))}
          {wedges.length === 0 && (
            <p className="text-sm text-slate-400">No wedges in the selected layer.</p>
          )}
        </div>
      </div>

      {/* Ladder at a glance */}
      <div>
        <SectionTitle hint="Each rung is independently sellable and qualifies the client for the next.">
          The service ladder
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {LADDER.map((r) => (
            <Card key={r.id} className="p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                  {r.rung}
                </span>
                <h3 className="text-sm font-semibold text-slate-800">{r.name}</h3>
              </div>
              <p className="text-xs text-slate-500 mb-2">{r.duration} · {r.pricingModel}</p>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{r.purpose}</p>
              <p className="text-xs text-slate-500 mt-auto">
                {keep(r.deliverables).length} deliverables in view
              </p>
            </Card>
          ))}
        </div>
        <Link to="/dg/ladder" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-rose-600 hover:text-rose-700">
          Full service offering <ArrowRight size={16} />
        </Link>
      </div>

      {/* Pillars */}
      <div>
        <SectionTitle hint="The eleven pillars that structure the diagnostic, the artefact set and the implementation waves.">
          Governance pillars
        </SectionTitle>
        <div className="space-y-2">
          {PILLARS.map((p) => {
            const isOpen = expanded === p.id
            return (
              <Card key={p.id} className="overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-mono text-slate-400 mt-0.5 shrink-0">{p.id}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800">{p.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{p.description}</p>
                  </div>
                  {isOpen ? <ChevronUp size={18} className="text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown size={18} className="text-slate-400 shrink-0 mt-0.5" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Buyer pain</p>
                      <p className="text-sm text-amber-900 leading-relaxed">{p.buyerPain}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {shows('core') && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Core artefacts</p>
                          <ul className="space-y-1.5">
                            {p.coreArtefacts.map((a) => (
                              <li key={a} className="flex gap-2 text-sm text-slate-600 leading-snug">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {shows('core') && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Deliverables — what &ldquo;done&rdquo; means</p>
                          <ul className="space-y-1.5">
                            {p.deliverables.map((d) => (
                              <li key={d} className="flex gap-2 text-sm text-slate-600 leading-snug">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {shows('banking') && (
                      <div className="bg-rose-50 border border-rose-200 rounded-md p-3">
                        <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide mb-1.5">Banking overlay</p>
                        <p className="text-sm text-rose-900 leading-relaxed mb-3">{p.bankingOverlay.focus}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-medium text-rose-700 mb-1.5">Overlay artefacts</p>
                            <ul className="space-y-1">
                              {p.bankingOverlay.artefacts.map((a) => (
                                <li key={a} className="flex gap-2 text-sm text-rose-900/80 leading-snug">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-rose-700 mb-1.5">Funding drivers</p>
                            <ul className="space-y-1">
                              {p.bankingOverlay.drivers.map((d) => (
                                <li key={d} className="flex gap-2 text-sm text-rose-900/80 leading-snug">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Accelerators */}
      <div>
        <SectionTitle hint="Productised IP is what makes a two-week diagnostic possible where a generalist needs six.">
          Accelerator IP
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accelerators.map((a) => (
            <Card key={a.name} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-slate-800">{a.name}</h3>
                <span className={`shrink-0 text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 ${a.layer === 'banking' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                  {a.layer}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">{a.what}</p>
              <p className="text-sm text-emerald-700 leading-relaxed">{a.effect}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
