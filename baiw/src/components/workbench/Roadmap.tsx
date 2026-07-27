import { useState } from 'react'
import { Map, Clock, CheckCircle2, AlertTriangle, Target, ChevronDown, ChevronUp, Database, Rocket } from 'lucide-react'
import type { RoadmapPhase } from './types'

interface Props {
  data: { phases: RoadmapPhase[] }
}

const PHASE_COLORS = [
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-600' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-600' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: 'bg-violet-600' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-600' },
]

export default function Roadmap({ data }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set(data.phases.map((p) => p.phase)))

  const toggle = (phase: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(phase)) next.delete(phase)
      else next.add(phase)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Map size={20} className="text-blue-600" />
          Implementation Roadmap
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Phased rollout from foundation to enterprise scale.
        </p>

        <div className="space-y-4">
          {data.phases.map((phase) => {
            const colors = PHASE_COLORS[(phase.phase - 1) % PHASE_COLORS.length]
            const isExpanded = expanded.has(phase.phase)

            return (
              <div key={phase.phase} className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}>
                <button
                  onClick={() => toggle(phase.phase)}
                  className="w-full p-4 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colors.icon} text-white flex items-center justify-center font-bold`}>
                      {phase.phase}
                    </div>
                    <div>
                      <div className={`font-semibold ${colors.text}`}>{phase.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock size={12} /> {phase.timeline} · {phase.theme}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100/50 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <Rocket size={12} /> Deliverables
                        </div>
                        <ul className="space-y-1">
                          {phase.deliverables.map((d) => (
                            <li key={d} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <Target size={12} /> Quick Wins
                        </div>
                        <ul className="space-y-1">
                          {phase.quickWins.map((w) => (
                            <li key={w} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <CheckCircle2 size={12} className="text-blue-500 mt-0.5 shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <Database size={12} /> Data Dependencies
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {phase.dataDependencies.map((d) => (
                            <span key={d} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">{d}</span>
                          ))}
                        </div>
                        <div className="text-xs font-semibold text-slate-700 mt-3 mb-1">Capabilities</div>
                        <div className="flex flex-wrap gap-1">
                          {phase.capabilities.map((c) => (
                            <span key={c} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <AlertTriangle size={12} /> Risks
                        </div>
                        <ul className="space-y-1">
                          {phase.risks.map((r) => (
                            <li key={r} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3 bg-white/70 rounded-lg p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                        <Target size={12} /> KPIs
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {phase.kpis.map((kpi) => (
                          <span key={kpi} className="text-xs bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded">{kpi}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
