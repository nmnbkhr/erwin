import { useState, useMemo } from 'react'
import { Card, PageHeader, SectionTitle, Stat, Tabs, ExportButton, TableWrap, Owner } from './ui'
import { archetypeOf } from '../roles'
import { LayerBadge } from '../LayerContext'
import { useLayer } from '../layer'
import { downloadCSV } from '../../utils/export'
import implementationPlan from '../data/implementationPlan.json'
import pillars from '../data/pillars.json'
import ladder from '../data/ladder.json'
import type { ImplementationPlanData, Pillar, LadderRung } from '../types'

const PLAN = implementationPlan as ImplementationPlanData
const PILLARS = pillars as Pillar[]
const LADDER = ladder as LadderRung[]

type Tab = 'first90' | 'waves' | 'artefacts'

export default function ImplementationPlan() {
  const { keep } = useLayer()
  const [tab, setTab] = useState<Tab>('first90')
  const [rungFilter, setRungFilter] = useState<number | 'all'>('all')

  const waves = useMemo(() => keep(PLAN.waves), [keep])
  const artefacts = useMemo(() => {
    const inLayer = keep(PLAN.artefactRegister)
    return rungFilter === 'all' ? inLayer : inLayer.filter((a) => a.rung === rungFilter)
  }, [keep, rungFilter])

  const pillarName = (id: string) => PILLARS.find((p) => p.id === id)?.short ?? id
  const rungName = (n: number) => LADDER.find((r) => r.rung === n)?.name ?? `Rung ${n}`

  const exportWaves = () =>
    downloadCSV(
      waves.map((w) => ({
        wave: w.wave,
        name: w.name,
        weeks: w.weeks,
        theme: w.theme,
        pillars: w.pillarIds.map(pillarName).join('; '),
        objectives: w.objectives.join('; '),
        deliverables: w.deliverables.join('; '),
        kpis: w.kpis.join('; '),
        depends_on_waves: w.dependsOn.join('; '),
        external_dependencies: w.externalDependencies.join('; '),
        exit_criteria: w.exitCriteria,
        layer: w.layer,
      })),
      'dg-implementation-waves'
    )

  const exportArtefacts = () =>
    downloadCSV(
      artefacts.map((a) => ({
        id: a.id,
        artefact: a.artefact,
        rung: a.rung,
        rung_name: rungName(a.rung),
        pillar: pillarName(a.pillarId),
        owner: a.owner,
        owner_archetype: archetypeOf(a.owner),
        format: a.format,
        layer: a.layer,
      })),
      'dg-artefact-register'
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Implementation Plan"
        subtitle="The first 90 days at a client, the wave structure that follows, and the full artefact register mapped to pillars and rungs. Waves overlap deliberately — each ends in something demonstrable rather than waiting on a big-bang completion."
        actions={
          tab === 'waves' ? <ExportButton onClick={exportWaves} label="Export waves (CSV)" />
            : tab === 'artefacts' ? <ExportButton onClick={exportArtefacts} label="Export artefacts (CSV)" />
              : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat value={PLAN.first90Days.length} label="90-day stages" />
        <Stat value={waves.length} label="Delivery waves in view" tone="rose" />
        <Stat value={artefacts.length} label="Artefacts in view" />
        <Stat value={waves.reduce((s, w) => s + w.deliverables.length, 0)} label="Wave deliverables" />
      </div>

      <Tabs
        tabs={[
          { id: 'first90' as Tab, label: 'First 90 days' },
          { id: 'waves' as Tab, label: 'Delivery waves' },
          { id: 'artefacts' as Tab, label: 'Artefact register' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'first90' && (
        <div className="space-y-4">
          {PLAN.first90Days.map((row, i) => (
            <Card key={row.weeks} className="p-5">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="md:w-48 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">Weeks {row.weeks}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-snug mt-2">{row.focus}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Activities</p>
                  <ul className="space-y-1.5">
                    {row.activities.map((a) => (
                      <li key={a} className="flex gap-2 text-sm text-slate-600 leading-snug">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />{a}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-emerald-50 -mx-1 px-3 py-2 rounded-md">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Exit artefact</p>
                    <p className="text-sm text-emerald-900 leading-relaxed mt-0.5">{row.exitArtefact}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'waves' && (
        <div className="space-y-4">
          {waves.map((w) => (
            <Card key={w.id} className="p-5 border-l-4 border-l-rose-500">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                  {w.wave}
                </span>
                <h2 className="text-base font-bold text-slate-900">{w.name}</h2>
                <span className="text-sm text-slate-500">{w.weeks}</span>
                <LayerBadge layer={w.layer} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{w.theme}</p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Objectives</p>
                  <ul className="space-y-1.5">
                    {w.objectives.map((o) => (
                      <li key={o} className="flex gap-2 text-sm text-slate-600 leading-snug">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />{o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deliverables</p>
                  <ul className="space-y-1.5">
                    {w.deliverables.map((d) => (
                      <li key={d} className="flex gap-2 text-sm text-slate-600 leading-snug">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />{d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">KPIs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {w.kpis.map((k) => (
                        <span key={k} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{k}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Pillars</p>
                    <div className="flex flex-wrap gap-1.5">
                      {w.pillarIds.map((p) => (
                        <span key={p} className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700">{pillarName(p)}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Depends on</p>
                    {w.dependsOn.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {w.dependsOn.map((d) => {
                          // Resolved against the whole plan, not the filtered view: in
                          // banking-only mode a banking wave still depends on core waves
                          // that aren't rendered, and hiding the label would misstate it.
                          const dep = PLAN.waves.find((x) => x.id === d)
                          return (
                            <span key={d} className="text-xs px-2 py-1 rounded bg-slate-900 text-white" title={dep?.name}>
                              {d}{dep ? ` ${dep.name}` : ''}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No preceding wave — this is the entry point.</p>
                    )}
                  </div>
                  {w.externalDependencies.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        External preconditions
                      </p>
                      <p className="text-sm text-slate-600 leading-snug">{w.externalDependencies.join(' · ')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Exit criteria: </span>{w.exitCriteria}
                </p>
              </div>
            </Card>
          ))}
          {waves.length === 0 && <Card className="p-6 text-center text-sm text-slate-400">No waves in the selected layer.</Card>}
        </div>
      )}

      {tab === 'artefacts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRungFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${rungFilter === 'all' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              All rungs
            </button>
            {LADDER.map((r) => (
              <button
                key={r.id}
                onClick={() => setRungFilter(r.rung)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${rungFilter === r.rung ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {r.rung}. {r.name}
              </button>
            ))}
          </div>

          <Card className="p-5">
            <SectionTitle hint="Every artefact the practice produces, mapped to the pillar it serves and the rung that pays for it.">
              Artefact register
            </SectionTitle>
            <TableWrap>
              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Artefact</th>
                    <th className="py-2 pr-4 font-medium">Rung</th>
                    <th className="py-2 pr-4 font-medium">Pillar</th>
                    <th className="py-2 pr-4 font-medium">Owner</th>
                    <th className="py-2 pr-4 font-medium">Format</th>
                    <th className="py-2 font-medium">Layer</th>
                  </tr>
                </thead>
                <tbody>
                  {artefacts.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 pr-4 text-xs font-mono text-slate-400">{a.id}</td>
                      <td className="py-2.5 pr-4 text-slate-700 leading-snug">{a.artefact}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{a.rung}. {rungName(a.rung)}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{pillarName(a.pillarId)}</td>
                      <td className="py-2.5 pr-4"><Owner name={a.owner} support={a.support} /></td>
                      <td className="py-2.5 pr-4 text-slate-500">{a.format}</td>
                      <td className="py-2.5"><LayerBadge layer={a.layer} /></td>
                    </tr>
                  ))}
                  {artefacts.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-sm text-slate-400">No artefacts match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </div>
      )}
    </div>
  )
}
