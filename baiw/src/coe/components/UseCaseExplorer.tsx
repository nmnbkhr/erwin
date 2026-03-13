import { useState, useMemo } from 'react'
import {
  Search, Database, Zap, ArrowRight, Shield, Users, Brain,
  Target, Banknote, ChevronRight,
} from 'lucide-react'
import useCases from '../../data/coe/useCases.json'

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-400', badge: 'bg-emerald-500' },
  blue:    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-400', badge: 'bg-blue-500' },
  violet:  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-400', badge: 'bg-violet-500' },
  amber:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-400', badge: 'bg-amber-500' },
  cyan:    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-400', badge: 'bg-cyan-500' },
  teal:    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-400', badge: 'bg-teal-500' },
  rose:    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-400', badge: 'bg-rose-500' },
  orange:  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-400', badge: 'bg-orange-500' },
  pink:    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-400', badge: 'bg-pink-500' },
  indigo:  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-400', badge: 'bg-indigo-500' },
}

const algoTypeIcons: Record<string, typeof Brain> = {
  'ML': Brain,
  'RL': Zap,
  'Mathematical Programming': Target,
  'Mechanism Design': Users,
  'Multi-Objective': Shield,
}

const phaseLabels: Record<number, string> = {
  1: 'Phase 1: Foundation',
  2: 'Phase 2: Optimization',
  3: 'Phase 3: Scale & Refine',
  4: 'Phase 4: Attribution',
}

function formatPKR(val: number) {
  if (val >= 1000) return `PKR ${(val / 1000).toFixed(1)}B`
  return `PKR ${val}M`
}

export default function UseCaseExplorer() {
  const [selectedId, setSelectedId] = useState('UC-01')
  const [query, setQuery] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<number | null>(null)

  const filtered = useMemo(() => {
    return useCases.filter(uc => {
      const matchesQuery = !query ||
        uc.name.toLowerCase().includes(query.toLowerCase()) ||
        uc.id.toLowerCase().includes(query.toLowerCase()) ||
        uc.optimizationTechnique.name.toLowerCase().includes(query.toLowerCase())
      const matchesPhase = phaseFilter === null || uc.phase === phaseFilter
      return matchesQuery && matchesPhase
    })
  }, [query, phaseFilter])

  const selected = useCases.find(uc => uc.id === selectedId) || useCases[0]
  const colors = colorMap[selected.color] || colorMap.amber

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Left Panel — UC List */}
      <div className="w-80 shrink-0 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search use cases..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
          />
        </div>

        {/* Phase Filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setPhaseFilter(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              phaseFilter === null ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => setPhaseFilter(phaseFilter === p ? null : p)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                phaseFilter === p ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Phase {p}
            </button>
          ))}
        </div>

        {/* UC List */}
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {filtered.map(uc => {
            const ucColors = colorMap[uc.color] || colorMap.amber
            const isActive = uc.id === selectedId
            return (
              <button
                key={uc.id}
                onClick={() => setSelectedId(uc.id)}
                className={`w-full text-left p-3 rounded-lg border-l-4 transition-all ${
                  isActive
                    ? `${ucColors.bg} ${ucColors.border} shadow-sm`
                    : 'bg-white border-transparent hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${ucColors.badge}`}>
                    {uc.id}
                  </span>
                  <span className="text-xs text-slate-400">Phase {uc.phase}</span>
                </div>
                <div className="text-sm font-medium text-slate-700 mb-1 line-clamp-1">{uc.name}</div>
                <div className="text-xs text-slate-400">
                  {uc.revenueImpact.annualSavingMax > 0
                    ? `${formatPKR(uc.revenueImpact.annualSavingMin)}–${formatPKR(uc.revenueImpact.annualSavingMax)}`
                    : 'Measurement Layer'
                  }
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right Panel — Detail */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className={`${colors.bg} rounded-xl p-6 border-l-4 ${colors.border}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-sm font-bold px-2.5 py-1 rounded text-white ${colors.badge}`}>
              {selected.id}
            </span>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
              {phaseLabels[selected.phase]}
            </span>
          </div>
          <h1 className={`text-2xl font-bold ${colors.text}`}>{selected.name}</h1>
        </div>

        {/* Objective */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Objective</h3>
          <p className="text-slate-700 leading-relaxed">{selected.objective}</p>
        </div>

        {/* Problem Statement */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Problem Statement</h3>
          <p className="text-slate-700 leading-relaxed">{selected.problemStatement}</p>
        </div>

        {/* Optimization Technique */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Optimization Technique</h3>
          <div className="flex items-center gap-3 mb-3">
            {(() => {
              const Icon = algoTypeIcons[selected.optimizationTechnique.algorithmType] || Brain
              return (
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon size={20} className={colors.text} />
                </div>
              )
            })()}
            <div>
              <div className="font-semibold text-slate-800">{selected.optimizationTechnique.name}</div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                {selected.optimizationTechnique.algorithmType}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-3">{selected.optimizationTechnique.description}</p>
          <div className="flex flex-wrap gap-2">
            {selected.optimizationTechnique.keyModels.map(model => (
              <span key={model} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                {model}
              </span>
            ))}
          </div>
        </div>

        {/* Game Theory */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Users size={16} /> Game Theory Analysis
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Players</div>
                <div className="text-sm font-medium text-slate-700">{selected.gameTheory.players}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Game Type</div>
                <div className="text-sm font-medium text-slate-700">{selected.gameTheory.gameType}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Equilibrium</div>
                <div className="text-sm font-medium text-slate-700">{selected.gameTheory.equilibrium}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-400 mb-1">Mechanism</div>
                <div className="text-sm text-slate-600">{selected.gameTheory.mechanism}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Impact */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Revenue Impact</h3>
          {selected.revenueImpact.annualSavingMax > 0 ? (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-amber-600">
                  {formatPKR(selected.revenueImpact.annualSavingMin)}–{formatPKR(selected.revenueImpact.annualSavingMax)}
                </span>
                <span className="text-sm text-slate-400">annual savings</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                  style={{
                    width: `${Math.min(100, (selected.revenueImpact.annualSavingMax / 4300) * 100)}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-lg font-semibold text-indigo-600 mb-3">Measurement Layer — Ensures PKR 7.8–12.7B Target</div>
          )}
          <p className="text-sm text-slate-600 mb-2">{selected.revenueImpact.mechanism}</p>
          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
            {selected.revenueImpact.category}
          </span>
        </div>

        {/* Data I/O */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database size={14} /> Inputs
            </h3>
            <ul className="space-y-2">
              {selected.inputs.map(input => (
                <li key={input} className="flex items-start gap-2 text-sm text-slate-600">
                  <ChevronRight size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  {input}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowRight size={14} /> Outputs
            </h3>
            <ul className="space-y-2">
              {selected.outputs.map(output => (
                <li key={output} className="flex items-start gap-2 text-sm text-slate-600">
                  <Banknote size={14} className="text-green-400 mt-0.5 shrink-0" />
                  {output}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dependencies */}
        {selected.dependencies.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Dependencies</h3>
            <div className="flex flex-wrap gap-2">
              {selected.dependencies.map(depId => {
                const dep = useCases.find(u => u.id === depId)
                const depColors = dep ? colorMap[dep.color] || colorMap.amber : colorMap.amber
                return (
                  <button
                    key={depId}
                    onClick={() => setSelectedId(depId)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${depColors.bg} hover:opacity-80 transition-opacity`}
                  >
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${depColors.badge}`}>
                      {depId}
                    </span>
                    <span className={`text-sm ${depColors.text}`}>{dep?.name || depId}</span>
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
