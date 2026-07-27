import { useState } from 'react'
import { Target, CheckCircle2, Layers, Database, BarChart3 } from 'lucide-react'
import type { UseCase } from './types'

interface Props {
  data: UseCase[]
}

const PHASE_COLORS = [
  'bg-emerald-50 border-emerald-200 text-emerald-700',
  'bg-blue-50 border-blue-200 text-blue-700',
  'bg-violet-50 border-violet-200 text-violet-700',
  'bg-amber-50 border-amber-200 text-amber-700',
]

export default function UseCaseExplorer({ data }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">Use-Case Explorer</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.map((uc) => {
            const isExpanded = expanded.has(uc.id)
            const phaseColor = PHASE_COLORS[(uc.phase - 1) % PHASE_COLORS.length]
            return (
              <div key={uc.id} className={`rounded-xl border p-4 ${phaseColor} transition hover:shadow-sm`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-white/80 text-slate-700 px-2 py-0.5 rounded">{uc.id}</span>
                    <span className="font-semibold text-sm text-slate-800">{uc.title}</span>
                  </div>
                  <button
                    onClick={() => toggle(uc.id)}
                    className="text-xs bg-white/70 hover:bg-white text-slate-600 px-2 py-1 rounded transition-colors"
                  >
                    {isExpanded ? 'Less' : 'More'}
                  </button>
                </div>

                <p className="text-xs text-slate-600 mb-3">{uc.objective}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {uc.capabilities.map((c) => (
                    <span key={c} className="text-[10px] bg-white/70 text-slate-600 px-1.5 py-0.5 rounded">{c}</span>
                  ))}
                </div>

                {isExpanded && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-slate-200/50">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Business Value
                      </div>
                      <p className="text-xs text-slate-700">{uc.businessValue}</p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <Database size={10} /> Data Entities
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {uc.dataEntities.map((e) => (
                          <span key={e} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">{e}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <BarChart3 size={10} /> Measures
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {uc.measures.map((m) => (
                          <span key={m} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{m}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1"><Layers size={12} /> Phase {uc.phase}</span>
                      <span className="font-medium">Owner: {uc.owner}</span>
                    </div>
                    <div className="text-xs text-slate-700 bg-white/50 rounded p-2">
                      <span className="font-semibold">KPI Target:</span> {uc.kpiTarget}
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
