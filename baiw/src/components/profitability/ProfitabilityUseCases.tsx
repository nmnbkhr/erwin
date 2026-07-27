import { useState, useMemo } from 'react'
import { Target, Search, ChevronDown, ChevronUp, Database, BarChart3, Users, Shield, Layers } from 'lucide-react'
import type { WorkbenchData } from '../../utils/profitabilityWorkbench'

interface Props {
  data: WorkbenchData['useCases']
}

const USE_CASE_ICONS: Record<string, typeof Target> = {
  'UC-P01': Users,
  'UC-P02': BarChart3,
  'UC-P03': Layers,
  'UC-P04': Users,
  'UC-P05': Shield,
  'UC-P06': Target,
  'UC-P07': Users,
  'UC-P08': Shield,
}

export default function ProfitabilityUseCases({ data }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<'All' | '1' | '2' | '3'>('All')

  const filtered = useMemo(() => {
    return data.filter((uc) => {
      if (phaseFilter !== 'All' && uc.phase !== Number(phaseFilter)) return false
      const q = query.toLowerCase()
      if (!q) return true
      return (
        uc.title.toLowerCase().includes(q) ||
        uc.objective.toLowerCase().includes(q) ||
        uc.owner.toLowerCase().includes(q) ||
        uc.capabilities.some((c) => c.toLowerCase().includes(q))
      )
    })
  }, [data, query, phaseFilter])

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
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search use cases..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md"
          />
        </div>
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value as typeof phaseFilter)}
          className="text-sm border border-slate-300 rounded-md px-2 py-1.5"
        >
          <option value="All">All Phases</option>
          <option value="1">Phase 1</option>
          <option value="2">Phase 2</option>
          <option value="3">Phase 3</option>
        </select>
        <div className="text-sm text-slate-500">
          {filtered.length} use cases
        </div>
      </div>

      {/* Use Case Cards */}
      <div className="space-y-3">
        {filtered.map((uc) => {
          const Icon = USE_CASE_ICONS[uc.id] || Target
          const isExpanded = expanded.has(uc.id)
          return (
            <div key={uc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggle(uc.id)}
                className="w-full flex items-start justify-between p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">{uc.id}</span>
                      <span className="text-sm font-semibold text-slate-800">{uc.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl">{uc.objective}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Phase {uc.phase}</span>
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-1">Business Value</div>
                      <p className="text-xs text-slate-600">{uc.businessValue}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-1">Owner</div>
                      <p className="text-xs text-slate-600">{uc.owner}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-1">Required Capabilities</div>
                      <div className="flex flex-wrap gap-1">
                        {uc.capabilities.map((c) => (
                          <span key={c} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-1">KPI Target</div>
                      <p className="text-xs text-slate-600">{uc.kpiTarget}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Database size={12} /> Data Entities
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {uc.dataEntities.map((e) => (
                          <span key={e} className="text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded border border-violet-100 font-mono">{e}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <BarChart3 size={12} /> Key Measures
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {uc.measures.map((m) => (
                          <span key={m} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 font-mono">{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
