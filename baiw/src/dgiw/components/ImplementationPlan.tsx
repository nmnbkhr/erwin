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
// G4: the engagement view renders plan slices — the same composition the
// pillar-plan PDF and the Diagnostic roadmap consume, wired once in plan/state.
import { usePlanSlices } from '../plan/state'
import { B_STRUCTURE_OVER_PRIORITY, B_THIN_IS_INFORMATION } from '../plan/slices'
import { intakeIsActionable } from '../intake/types'
import { TIER_META } from '../tier'

const PLAN = implementationPlan as ImplementationPlanData
const PILLARS = pillars as Pillar[]
const LADDER = ladder as LadderRung[]

type Tab = 'engagement' | 'first90' | 'waves' | 'artefacts'

const BAND_STYLE: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-amber-100 text-amber-700',
  moderate: 'bg-yellow-50 text-yellow-700',
  met: 'bg-emerald-100 text-emerald-700',
}

const show1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

export default function ImplementationPlan() {
  const { keep } = useLayer()
  const { slices, exclusions, tier, intake } = usePlanSlices()
  // The engagement view exists when the intake is actionable AND something is
  // measured — the same two facts AR-55's refusal predicate rests on.
  const engagementActive = intakeIsActionable(intake) && slices.length + exclusions.length > 0
  const [tab, setTab] = useState<Tab>(engagementActive ? 'engagement' : 'first90')
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

      {/* G4: which of the two views this page is showing, stated before the
          content — ProgramDesign's banner discipline. */}
      <Card className={`p-4 border ${engagementActive ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'}`}>
        <p className={`text-sm ${engagementActive ? 'text-emerald-800' : 'text-slate-600'}`}>
          {engagementActive
            ? `Engagement plan available: ${slices.length} pillar slice${slices.length === 1 ? '' : 's'} from the gap register at the ${TIER_META[tier].label} tier` +
              `${exclusions.length ? `, ${exclusions.length} measured pillar${exclusions.length === 1 ? '' : 's'} outside the intake scope (listed)` : ''}. ` +
              'The reference wave plan stays available on the other tabs.'
            : 'Reference plan only. The engagement view appears when the Program Design intake is actionable and at least one pillar carries both measurements (a score at the active tier and a target).'}
        </p>
      </Card>

      <Tabs
        tabs={[
          ...(engagementActive ? [{ id: 'engagement' as Tab, label: 'Engagement plan' }] : []),
          { id: 'first90' as Tab, label: 'First 90 days' },
          { id: 'waves' as Tab, label: 'Delivery waves' },
          { id: 'artefacts' as Tab, label: 'Artefact register' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'engagement' && engagementActive && (
        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle hint="Assumptions that apply to every slice below. Week windows are the reference plan's own; nothing here is a calendar commitment, a staffing estimate or a cost.">
              Assumptions
            </SectionTitle>
            <ul className="space-y-1.5">
              {(slices[0]?.assumptions ?? []).map((a) => (
                <li key={a} className="flex gap-2 text-sm text-slate-600 leading-snug">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />{a}
                </li>
              ))}
            </ul>
          </Card>

          {slices.map((s) => (
            <Card key={s.pillarId} className="p-5 border-l-4 border-l-rose-500">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-slate-900">{s.pillarId} · {s.pillarName}</h2>
                <span className={`px-2 py-0.5 text-xs rounded ${BAND_STYLE[s.entry.priority.band]}`}>{s.entry.priority.band}</span>
                {s.thin && (
                  <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600" title={B_THIN_IS_INFORMATION}>
                    thin slice
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Current {show1(s.entry.current)} → target {s.entry.target} (gap {show1(s.entry.gap)}) at the{' '}
                {TIER_META[s.entry.tier].label} tier, {s.entry.coverage.answered} / {s.entry.coverage.applicable} answered.
              </p>

              {/* sequence strip */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="text-xs text-slate-400 mr-1">Sequence:</span>
                {s.sequence.length === 0 && <span className="text-xs text-slate-400">no wave lists this pillar</span>}
                {s.sequence.map((id, i) => (
                  <span key={id} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-slate-300 text-xs">→</span>}
                    <span className="px-2 py-0.5 text-xs rounded bg-slate-900 text-white">{id}</span>
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Catalogued deliverables ({s.deliverables.length})
                  </p>
                  <ul className="space-y-1.5">
                    {s.deliverables.map((d) => (
                      <li key={d.artefactId} className="text-sm text-slate-600 leading-snug">
                        <span className="font-mono text-xs text-slate-400 mr-1.5">{d.artefactId}</span>
                        {d.artefact}
                        <span className="text-xs text-slate-400"> — rung {d.rung}, {d.builtFrom.evidence}
                          {d.waveId ? `, named by ${d.waveId}` : ''}</span>
                      </li>
                    ))}
                    {s.deliverables.length === 0 && (
                      <li className="text-sm text-slate-400">
                        The register catalogues nothing for this pillar under the current layer — that is the finding, not a blank.
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Waves listing this pillar
                  </p>
                  <ul className="space-y-1.5">
                    {s.waves.map((w) => (
                      <li key={w.waveId} className="text-sm text-slate-600 leading-snug">
                        <span className="px-1.5 py-0.5 text-xs rounded bg-rose-50 text-rose-700 mr-1.5">{w.waveId}</span>
                        {w.name} <span className="text-xs text-slate-400">({w.weeks})</span>
                        {w.heldBy.length > 0 && (
                          <span className="text-xs text-amber-700" title={B_STRUCTURE_OVER_PRIORITY}>
                            {' '}— held by {w.heldBy.join(', ')}
                          </span>
                        )}
                      </li>
                    ))}
                    {s.waves.length === 0 && (
                      <li className="text-sm text-slate-400">No wave lists this pillar.</li>
                    )}
                  </ul>
                </div>
              </div>
            </Card>
          ))}

          <Card className="p-5">
            <SectionTitle hint="Measured pillars that got no slice, with the reason — exclusion is visible, never silent. Pillars missing a measurement entirely are on the Gap Register page.">
              Excluded from the engagement plan
            </SectionTitle>
            {exclusions.length === 0 ? (
              <p className="text-sm text-slate-500">
                Every measured pillar is in the engagement scope. This list is empty because nothing
                was excluded, not because the check was skipped.
              </p>
            ) : (
              <ul className="space-y-2">
                {exclusions.map((x) => (
                  <li key={x.pillarId} className="text-sm text-slate-600">
                    <span className="font-medium">{x.pillarId}</span> · {x.pillarName}
                    <span className="text-slate-400"> — {x.reasons.join('; ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

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
