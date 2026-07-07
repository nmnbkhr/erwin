import { useState, useMemo } from 'react'
import {
  Search, Database, ArrowRight, ChevronRight, ShieldCheck, Cpu, Layers,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useCases from '../data/useCases.json'

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-400', badge: 'bg-indigo-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-400', badge: 'bg-blue-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-400', badge: 'bg-violet-500' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-400', badge: 'bg-cyan-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-400', badge: 'bg-teal-500' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-400', badge: 'bg-sky-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-400', badge: 'bg-amber-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-400', badge: 'bg-rose-500' },
}

const phaseLabels: Record<number, string> = {
  1: 'Phase 1: Foundation',
  2: 'Phase 2: Analytics',
  3: 'Phase 3: Advanced',
}

export default function UseCaseExplorer() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState('ALM-01')
  const [query, setQuery] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<number | null>(null)

  const filtered = useMemo(() => useCases.filter(uc => {
    const matchesQuery = !query ||
      uc.name.toLowerCase().includes(query.toLowerCase()) ||
      uc.id.toLowerCase().includes(query.toLowerCase()) ||
      uc.optimizationTechnique.name.toLowerCase().includes(query.toLowerCase())
    const matchesPhase = phaseFilter === null || uc.phase === phaseFilter
    return matchesQuery && matchesPhase
  }), [query, phaseFilter])

  const selected = useCases.find(uc => uc.id === selectedId) || useCases[0]
  const colors = colorMap[selected.color] || colorMap.indigo

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Left list */}
      <div className="w-80 shrink-0 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search ALM use cases..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setPhaseFilter(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${phaseFilter === null ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >All</button>
          {[1, 2, 3].map(p => (
            <button
              key={p}
              onClick={() => setPhaseFilter(phaseFilter === p ? null : p)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${phaseFilter === p ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >Phase {p}</button>
          ))}
        </div>

        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {filtered.map(uc => {
            const c = colorMap[uc.color] || colorMap.indigo
            const isActive = uc.id === selectedId
            return (
              <button
                key={uc.id}
                onClick={() => setSelectedId(uc.id)}
                className={`w-full text-left p-3 rounded-lg border-l-4 transition-all ${isActive ? `${c.bg} ${c.border} shadow-sm` : 'bg-white border-transparent hover:bg-slate-50 border border-slate-200'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${c.badge}`}>{uc.id}</span>
                  <span className="text-xs text-slate-400">Phase {uc.phase}</span>
                </div>
                <div className="text-sm font-medium text-slate-700 line-clamp-1">{uc.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{uc.optimizationTechnique.algorithmType}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right detail */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className={`${colors.bg} rounded-xl p-6 border-l-4 ${colors.border}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-sm font-bold px-2.5 py-1 rounded text-white ${colors.badge}`}>{selected.id}</span>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{phaseLabels[selected.phase]}</span>
          </div>
          <h1 className={`text-2xl font-bold ${colors.text}`}>{selected.name}</h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Objective</h3>
          <p className="text-slate-700 leading-relaxed">{selected.objective}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Problem Statement</h3>
          <p className="text-slate-700 leading-relaxed">{selected.problemStatement}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Method</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
              <Cpu size={20} className={colors.text} />
            </div>
            <div>
              <div className="font-semibold text-slate-800">{selected.optimizationTechnique.name}</div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{selected.optimizationTechnique.algorithmType}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-3">{selected.optimizationTechnique.description}</p>
          <div className="flex flex-wrap gap-2">
            {selected.optimizationTechnique.keyModels.map(m => (
              <span key={m} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{m}</span>
            ))}
          </div>
        </div>

        {/* Regulatory basis banner */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} /> Regulatory Basis
            </h3>
          </div>
          <div className="p-5 text-sm text-slate-700">{selected.regulatoryBasis}</div>
        </div>

        {/* Inputs / Outputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database size={14} /> Inputs (source)
            </h3>
            <ul className="space-y-2">
              {selected.inputs.map(i => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <ChevronRight size={14} className="text-indigo-400 mt-0.5 shrink-0" />{i}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowRight size={14} /> Outputs
            </h3>
            <ul className="space-y-2">
              {selected.outputs.map(o => (
                <li key={o} className="flex items-start gap-2 text-sm text-slate-600">
                  <ChevronRight size={14} className="text-emerald-400 mt-0.5 shrink-0" />{o}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FSDM entities */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers size={14} /> FSDM Entities
          </h3>
          <div className="flex flex-wrap gap-2">
            {selected.fsdmEntities.map(e => (
              <button
                key={e}
                onClick={() => navigate(`/model?search=${encodeURIComponent(e)}`)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-mono hover:bg-blue-200 transition-colors"
              >{e}</button>
            ))}
          </div>
        </div>

        {/* Dependencies */}
        {selected.dependencies.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Depends On</h3>
            <div className="flex flex-wrap gap-2">
              {selected.dependencies.map(depId => {
                const dep = useCases.find(u => u.id === depId)
                const dc = dep ? colorMap[dep.color] || colorMap.indigo : colorMap.indigo
                return (
                  <button
                    key={depId}
                    onClick={() => setSelectedId(depId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${dc.bg} hover:opacity-80 transition-opacity`}
                  >
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${dc.badge}`}>{depId}</span>
                    <span className={`text-sm ${dc.text}`}>{dep?.name || depId}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
