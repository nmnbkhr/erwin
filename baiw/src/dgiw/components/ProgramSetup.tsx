import { useState, useMemo } from 'react'
import { CheckCircle2, Circle, Lock, Unlock, Flag } from 'lucide-react'
import { Card, PageHeader, SectionTitle, Stat, Tabs, ExportButton, TableWrap, Owner } from './ui'
import { archetypeOf } from '../roles'
import { LayerBadge } from '../LayerContext'
import { useLayer } from '../layer'
import { downloadCSV } from '../../utils/export'
import programSetup from '../data/programSetup.json'
import pillars from '../data/pillars.json'
import operatingModel from '../data/operatingModel.json'
import type { ProgramSetupData, Pillar, OperatingModelData } from '../types'

const PROGRAM = programSetup as ProgramSetupData
const PILLARS = pillars as Pillar[]
const OM = operatingModel as OperatingModelData

/** Gate names are rendered from the register, never restated in the flow record —
 *  the prose copy had already drifted out of step with the gates it named. */
const gateById = (id: string) => OM.gates.find((g) => g.id === id)

type Tab = 'flows' | 'checklist'

const PHASE_ORDER = [
  'Mobilisation',
  'Accountability',
  'Scope Derivation',
  'Standards & Policy',
  'Platform',
  'Quality',
  'Run & Expand',
]

export default function ProgramSetup() {
  const { keep } = useLayer()
  const [tab, setTab] = useState<Tab>('flows')
  const [openFlow, setOpenFlow] = useState<string>(PROGRAM.flows[0].id)
  const [ticked, setTicked] = useState<Record<string, boolean>>({})

  const checklist = useMemo(() => keep(PROGRAM.checklist), [keep])
  const blocking = checklist.filter((c) => c.blocking)
  const blockingDone = blocking.filter((c) => ticked[c.id]).length
  const doneCount = checklist.filter((c) => ticked[c.id]).length

  const flow = PROGRAM.flows.find((f) => f.id === openFlow)!
  const flowSteps = keep(flow.steps)
  const flowDays = flowSteps.reduce((s, x) => s + x.durationDays, 0)

  const pillarName = (id: string) => PILLARS.find((p) => p.id === id)?.short ?? id

  const exportChecklist = () =>
    downloadCSV(
      checklist.map((c) => ({
        id: c.id,
        phase: c.phase,
        item: c.item,
        artefact: c.artefact,
        owner: c.owner,
        owner_archetype: archetypeOf(c.owner),
        blocking: c.blocking ? 'BLOCKING' : 'advisory',
        pillar: pillarName(c.pillarId),
        layer: c.layer,
        complete: ticked[c.id] ? 'YES' : 'NO',
      })),
      'dg-program-setup-checklist'
    )

  const exportFlows = () =>
    downloadCSV(
      PROGRAM.flows.flatMap((f) =>
        keep(f.steps).map((s) => ({
          flow: f.name,
          gates: f.gateIds.map((g) => `${g} ${gateById(g)?.name ?? '(unregistered)'}`).join('; '),
          stream: s.stream,
          step: s.step,
          owner: s.owner,
          owner_archetype: archetypeOf(s.owner),
          support: (s.support ?? []).join('; '),
          inputs: s.inputs.join('; '),
          outputs: s.outputs.join('; '),
          duration_days: s.durationDays,
          layer: s.layer,
        }))
      ),
      'dg-program-setup-flows'
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Setup"
        subtitle="Seven setup flows in dependency order, and the mandatory checklist that gates each phase. Blocking items stop the programme until they pass — this is what prevents the two most common failure modes: starting implementation without allocated stewards, and buying a tool before decision rights exist."
        actions={
          tab === 'flows'
            ? <ExportButton onClick={exportFlows} label="Export flows (CSV)" />
            : <ExportButton onClick={exportChecklist} label="Export checklist (CSV)" />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat value={PROGRAM.flows.length} label="Setup flows" />
        <Stat value={checklist.length} label="Checklist items in view" />
        <Stat value={blocking.length} label="Blocking items" tone="rose" />
        <Stat value={`${doneCount}/${checklist.length}`} label="Marked complete" tone="green" />
      </div>

      <Tabs
        tabs={[{ id: 'flows' as Tab, label: 'Setup flows' }, { id: 'checklist' as Tab, label: 'Required checklist' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'flows' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {PROGRAM.flows.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setOpenFlow(f.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  openFlow === f.id
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${openFlow === f.id ? 'bg-rose-500' : 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}
                </span>
                {f.name}
              </button>
            ))}
          </div>

          <Card className="p-5 border-l-4 border-l-rose-500">
            <h2 className="text-lg font-bold text-slate-900">{flow.name}</h2>
            <p className="text-sm text-slate-700 leading-relaxed mt-2">{flow.objective}</p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-1.5">
                <Flag size={14} className="text-rose-600 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700">
                    {flow.gateIds.length === 1 ? 'Gate' : 'Gates'}
                  </span>
                  <ul className="mt-1 space-y-1">
                    {flow.gateIds.map((id) => {
                      const g = gateById(id)
                      return (
                        <li key={id} className="text-sm text-slate-600 leading-snug">
                          <span className="font-mono text-xs text-slate-400 mr-1.5">{id}</span>
                          {g?.name ?? 'Unregistered gate'}
                          {g?.blocking && (
                            <span className="ml-1.5 text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 bg-rose-50 text-rose-700 ring-rose-200">
                              Blocking
                            </span>
                          )}
                          {g && <span className="block text-xs text-slate-500 mt-0.5">{g.test}</span>}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3">{flowSteps.length} steps · approximately {flowDays} working days</p>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle hint="Durations are indicative elapsed working days for a single domain, assuming named participants are available.">
              Steps
            </SectionTitle>
            <div className="space-y-3">
              {flowSteps.map((s, i) => (
                <div key={s.id} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {i < flowSteps.length - 1 && <span className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="flex-1 pb-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">{s.step}</h3>
                      <LayerBadge layer={s.layer} />
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{s.stream}</span>
                      <span className="text-xs text-slate-400">{s.durationDays}d</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Owner: <Owner name={s.owner} support={s.support} /></p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Inputs</p>
                        <p className="text-sm text-slate-600 leading-snug mt-0.5">{s.inputs.join(' · ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Outputs / artefacts</p>
                        <p className="text-sm text-slate-700 leading-snug mt-0.5">{s.outputs.join(' · ')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {flowSteps.length === 0 && <p className="text-sm text-slate-400">No steps in the selected layer.</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'checklist' && (
        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 shrink-0">
                Blocking items cleared: <span className="font-semibold text-rose-600">{blockingDone}/{blocking.length}</span>
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${blocking.length ? (blockingDone / blocking.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 shrink-0">Tracking is local to this session</span>
            </div>
          </Card>

          {PHASE_ORDER.map((phase) => {
            const items = checklist.filter((c) => c.phase === phase)
            if (items.length === 0) return null
            const phaseDone = items.filter((c) => ticked[c.id]).length
            return (
              <Card key={phase} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-slate-800">{phase}</h2>
                  <span className="text-sm text-slate-500">{phaseDone}/{items.length} complete</span>
                </div>
                <TableWrap>
                  <table className="w-full text-sm min-w-[860px]">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-3 font-medium w-8"></th>
                        <th className="py-2 pr-4 font-medium">Item</th>
                        <th className="py-2 pr-4 font-medium">Artefact produced</th>
                        <th className="py-2 pr-4 font-medium">Owner</th>
                        <th className="py-2 pr-4 font-medium">Pillar</th>
                        <th className="py-2 font-medium">Gate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((c) => {
                        const done = !!ticked[c.id]
                        return (
                          <tr key={c.id} className="border-b border-slate-100 last:border-0 align-top">
                            <td className="py-2.5 pr-3">
                              <button
                                onClick={() => setTicked((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                                aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                                className="text-slate-300 hover:text-emerald-500 transition-colors"
                              >
                                {done
                                  ? <CheckCircle2 size={18} className="text-emerald-500" />
                                  : <Circle size={18} />}
                              </button>
                            </td>
                            <td className={`py-2.5 pr-4 leading-snug ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {c.item}
                              <span className="ml-1.5 inline-block align-middle"><LayerBadge layer={c.layer} /></span>
                            </td>
                            <td className="py-2.5 pr-4 text-slate-500 leading-snug">{c.artefact}</td>
                            <td className="py-2.5 pr-4"><Owner name={c.owner} support={c.support} /></td>
                            <td className="py-2.5 pr-4 text-slate-500">{pillarName(c.pillarId)}</td>
                            <td className="py-2.5">
                              {c.blocking
                                ? <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 bg-rose-50 text-rose-700 ring-rose-200"><Lock size={10} /> Blocking</span>
                                : <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 bg-slate-100 text-slate-500 ring-slate-200"><Unlock size={10} /> Advisory</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </TableWrap>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
