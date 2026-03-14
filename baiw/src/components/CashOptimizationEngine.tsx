import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Banknote, TrendingUp, Database, Layers, Calendar,
  ChevronDown, ChevronUp, Target, Users, Zap,
  ArrowRight, BarChart3, Shield, Cpu, Brain,
  Download, Upload, GitBranch
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts'
import coeData from '../data/coe.json'

const phaseColors: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  2: 'bg-blue-100 text-blue-700 border-blue-300',
  3: 'bg-purple-100 text-purple-700 border-purple-300',
  4: 'bg-amber-100 text-amber-700 border-amber-300',
}

const phaseBarColors: Record<number, string> = {
  1: '#10b981',
  2: '#3b82f6',
  3: '#8b5cf6',
  4: '#f59e0b',
}

const algorithmIcons: Record<string, typeof Brain> = {
  'ML': Brain,
  'RL': Cpu,
  'Mathematical Programming': Target,
  'Network Optimization': GitBranch,
  'Mechanism Design': Users,
  'Risk Modelling': Shield,
  'Multi-Objective Optimization': BarChart3,
  'Combinatorial Optimization': Zap,
  'Online Learning': TrendingUp,
  'Management Accounting': BarChart3,
}

function getAlgorithmBadges(type: string) {
  return type.split(' + ').map(t => t.trim())
}

function getAlgorithmIcon(type: string) {
  for (const key of Object.keys(algorithmIcons)) {
    if (type.toLowerCase().includes(key.toLowerCase())) {
      return algorithmIcons[key]
    }
  }
  return Cpu
}

// Game theory type colors
const gameTypeColors: Record<string, string> = {
  'Principal-Agent': 'text-rose-600',
  'Stackelberg Leader-Follower': 'text-blue-600',
  'Auction (VCG)': 'text-emerald-600',
  'Repeated Game': 'text-violet-600',
  'Nash Bargaining': 'text-amber-600',
  'Cooperative Iterated': 'text-teal-600',
  'Game Against Nature': 'text-slate-600',
  'Cooperative Coalition': 'text-cyan-600',
  'Mechanism Design': 'text-pink-600',
  'Tournament/Contest': 'text-orange-600',
}

export default function CashOptimizationEngine() {
  const [expandedUC, setExpandedUC] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('uc')
  const [sortAsc, setSortAsc] = useState(true)
  const navigate = useNavigate()

  const { meta, useCases, revenueLevers, gameTheoryMatrix, implementationPhases } = coeData

  // Compute stats
  const totalBVF = useMemo(() => {
    const ids = new Set<number>()
    useCases.forEach(uc => uc.bvfCapabilities.forEach(c => ids.add(c.id)))
    return ids.size
  }, [useCases])

  const totalFSDM = useMemo(() => {
    const names = new Set<string>()
    useCases.forEach(uc => uc.fsdmEntities.forEach(e => names.add(e.entity)))
    return names.size
  }, [useCases])

  // Revenue waterfall data
  const waterfallData = revenueLevers.map(l => ({
    name: l.lever,
    min: l.min,
    max: l.max,
    range: l.max - l.min,
    mechanism: l.mechanism,
  }))

  // Sort game theory matrix
  const sortedMatrix = useMemo(() => {
    const sorted = [...gameTheoryMatrix]
    sorted.sort((a, b) => {
      const aVal = a[sortColumn as keyof typeof a] || ''
      const bVal = b[sortColumn as keyof typeof b] || ''
      return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })
    return sorted
  }, [gameTheoryMatrix, sortColumn, sortAsc])

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortAsc(!sortAsc)
    } else {
      setSortColumn(col)
      setSortAsc(true)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Section A: Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Banknote size={32} />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">BVF Use Case Study</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Cash Optimization Engine</h1>
          <p className="text-amber-100 max-w-3xl text-lg">
            How {totalBVF}+ BVF capabilities and {totalFSDM}+ FSDM entities power PKR {meta.totalImpact.min / 1000}–{meta.totalImpact.max / 1000}B in annual value for a UBL-scale bank
          </p>
          <p className="text-amber-200 text-sm mt-1">{meta.referenceCase}</p>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
            {[
              { label: 'Use Cases', value: '10' },
              { label: 'BVF Capabilities', value: `${totalBVF}+` },
              { label: 'FSDM Entities', value: `${totalFSDM}+` },
              { label: 'Annual Impact', value: `PKR ${meta.totalImpact.min / 1000}–${meta.totalImpact.max / 1000}B` },
              { label: 'Roadmap', value: '4-Phase / 24 Mo' },
            ].map((s) => (
              <div key={s.label} className="bg-white/15 backdrop-blur rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-amber-100">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section B: Use Case Cards Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Use Cases</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {useCases.map((uc) => (
            <div key={uc.id}>
              <button
                onClick={() => setExpandedUC(expandedUC === uc.id ? null : uc.id)}
                className={`w-full text-left bg-white rounded-xl border-2 p-5 transition-all hover:shadow-lg cursor-pointer ${
                  expandedUC === uc.id ? 'border-amber-400 shadow-lg' : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded">{uc.id}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded border ${phaseColors[uc.phase]}`}>
                        Phase {uc.phase}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-base mb-1">{uc.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{uc.objective}</p>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {getAlgorithmBadges(uc.optimizationTechnique.algorithmType).map(badge => {
                        const Icon = getAlgorithmIcon(badge)
                        return (
                          <span key={badge} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                            <Icon size={12} />
                            {badge}
                          </span>
                        )
                      })}
                    </div>

                    <p className={`text-xs italic mt-2 ${gameTypeColors[uc.gameTheory.gameType] || 'text-slate-500'}`}>
                      {uc.gameTheory.gameType}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold text-emerald-600">
                        {uc.impact.min > 0 ? `PKR ${uc.impact.min}–${uc.impact.max} M/yr` : 'Measurement Layer'}
                      </span>
                      <span className="text-xs text-slate-400">
                        BVF: {uc.bvfCapabilities.length} capabilities | FSDM: {uc.fsdmEntities.length} entities
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-slate-400">
                    {expandedUC === uc.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </button>

              {/* Section C: Use Case Detail Panel */}
              {expandedUC === uc.id && (
                <div className="bg-white border-2 border-amber-400 border-t-0 rounded-b-xl p-6 -mt-1 shadow-lg">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* LEFT COLUMN (60%) */}
                    <div className="lg:col-span-3 space-y-5">
                      {/* Problem Statement */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Problem Statement</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {uc.problemStatement.split(/(PKR\s[\d,.–]+\s?\w*)/g).map((part, i) =>
                            /PKR/.test(part) ? (
                              <span key={i} className="font-bold text-amber-600">{part}</span>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </p>
                      </div>

                      {/* Optimization Technique */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Cpu size={16} className="text-purple-600" />
                          <h4 className="text-sm font-semibold text-slate-700">Optimization Technique</h4>
                        </div>
                        <p className="text-sm font-medium text-purple-700 mb-1">{uc.optimizationTechnique.name}</p>
                        <p className="text-sm text-slate-600">{uc.optimizationTechnique.description}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {uc.optimizationTechnique.keyModels.map(m => (
                            <span key={m} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{m}</span>
                          ))}
                        </div>
                      </div>

                      {/* Game Theory */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={16} className="text-rose-600" />
                          <h4 className="text-sm font-semibold text-slate-700">Game Theory</h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
                          <span className="font-medium">{uc.gameTheory.players}</span>
                          <ArrowRight size={14} className="text-slate-400" />
                          <span className={`font-medium ${gameTypeColors[uc.gameTheory.gameType] || ''}`}>{uc.gameTheory.gameType}</span>
                          <ArrowRight size={14} className="text-slate-400" />
                          <span className="font-medium text-emerald-600">{uc.gameTheory.equilibrium}</span>
                          <ArrowRight size={14} className="text-slate-400" />
                          <span className="font-medium">{uc.gameTheory.mechanism}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 italic">{uc.gameTheory.explanation}</p>
                      </div>

                      {/* Revenue Impact Bar */}
                      {uc.impact.min > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Revenue Impact</h4>
                          <div className="bg-slate-100 rounded-full h-6 relative overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full absolute left-0 transition-all duration-500"
                              style={{ width: `${Math.min((uc.impact.max / 4300) * 100, 100)}%` }}
                            />
                            <div className="absolute inset-0 flex items-center px-3">
                              <span className="text-xs font-bold text-white drop-shadow">
                                PKR {uc.impact.min}–{uc.impact.max} M/yr
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{uc.impact.mechanism}</p>
                        </div>
                      )}

                      <div className="text-sm text-slate-600">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${phaseColors[uc.phase]}`}>
                          <Calendar size={14} />
                          Phase {uc.phase} (Months {uc.phaseMonths})
                        </span>
                      </div>
                    </div>

                    {/* RIGHT COLUMN (40%) */}
                    <div className="lg:col-span-2 space-y-5">
                      {/* BVF Capabilities */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Layers size={14} className="text-purple-600" />
                          BVF Capabilities Required
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {uc.bvfCapabilities.map(cap => (
                            <button
                              key={cap.id}
                              onClick={() => navigate('/capabilities')}
                              className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer border border-purple-200"
                            >
                              <span className="font-bold">#{cap.id}</span>
                              <span>{cap.name}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Click to view in BVF Capabilities</p>
                      </div>

                      {/* FSDM Entities */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Database size={14} className="text-blue-600" />
                          FSDM Entities Required
                        </h4>
                        <div className="space-y-2">
                          {uc.fsdmEntities.map(ent => (
                            <button
                              key={ent.entity}
                              onClick={() => navigate('/model')}
                              className="w-full text-left bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{ent.entity}</span>
                                <span className="text-blue-400">({ent.domain})</span>
                              </div>
                              <p className="text-blue-500 mt-0.5">{ent.usage}</p>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Click to view in Model Explorer</p>
                      </div>

                      {/* Data Inputs */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Download size={14} className="text-slate-500" />
                          Data Inputs
                        </h4>
                        <ul className="space-y-1">
                          {uc.inputs.map(inp => (
                            <li key={inp} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              {inp}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Outputs */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Upload size={14} className="text-slate-500" />
                          Outputs
                        </h4>
                        <ul className="space-y-1">
                          {uc.outputs.map(out => (
                            <li key={out} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              {out}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section D: Revenue Waterfall */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Revenue Impact Waterfall</h2>
        <p className="text-sm text-slate-500 mb-4">
          6 revenue levers contributing to PKR {meta.totalImpact.min / 1000}–{meta.totalImpact.max / 1000}B total annual impact
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={waterfallData} layout="vertical" margin={{ left: 160, right: 30, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => `${v}M`} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [`PKR ${value}M`, name === 'min' ? 'Minimum' : 'Range']}
              labelFormatter={(label) => String(label)}
            />
            <Legend />
            <Bar dataKey="min" stackId="a" fill="#10b981" name="Minimum" radius={[0, 0, 0, 0]} />
            <Bar dataKey="range" stackId="a" fill="#86efac" name="Upside" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section E: Game Theory Strategy Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Game Theory Strategy Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                {[
                  { key: 'uc', label: 'UC' },
                  { key: 'players', label: 'Players' },
                  { key: 'gameType', label: 'Game Type' },
                  { key: 'equilibrium', label: 'Equilibrium' },
                  { key: 'mechanism', label: 'Mechanism' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left py-3 px-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortColumn === col.key && (
                        <span className="text-amber-500">{sortAsc ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedMatrix.map((row, i) => (
                <tr key={row.uc} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="py-2.5 px-3 font-bold text-amber-600">{row.uc}</td>
                  <td className="py-2.5 px-3 text-slate-600">{row.players}</td>
                  <td className={`py-2.5 px-3 font-medium ${gameTypeColors[row.gameType] || 'text-slate-600'}`}>
                    {row.gameType}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{row.equilibrium}</td>
                  <td className="py-2.5 px-3 text-slate-500">{row.mechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section F: Implementation Roadmap */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Implementation Roadmap (24 Months)</h2>

        {/* Timeline */}
        <div className="relative">
          {/* Month markers */}
          <div className="flex items-center mb-2">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[10px] text-slate-400">{i + 1}</span>
              </div>
            ))}
          </div>

          {/* Phase bars */}
          <div className="space-y-3">
            {implementationPhases.map((phase) => {
              const monthParts = phase.months.replace('–', '-').split('-')
              const startMonth = parseInt(monthParts[0])
              const endMonth = parseInt(monthParts[1])
              const leftPct = ((startMonth - 1) / 24) * 100
              const widthPct = ((endMonth - startMonth + 1) / 24) * 100

              return (
                <div key={phase.phase} className="relative h-16">
                  <div
                    className="absolute top-0 h-full rounded-lg flex items-center px-4 transition-all"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: phaseBarColors[phase.phase],
                      opacity: 0.9,
                    }}
                  >
                    <div className="text-white min-w-0">
                      <div className="text-sm font-bold">Phase {phase.phase}: {phase.name}</div>
                      <div className="text-xs opacity-80 truncate">
                        {phase.useCases.join(', ')} — Months {phase.months}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* UC dots */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {useCases.map(uc => (
                <span
                  key={uc.id}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
                  style={{
                    borderColor: phaseBarColors[uc.phase],
                    color: phaseBarColors[uc.phase],
                    backgroundColor: `${phaseBarColors[uc.phase]}15`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: phaseBarColors[uc.phase] }} />
                  {uc.id}: {uc.name.split(' ').slice(0, 3).join(' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Phase descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {implementationPhases.map(phase => (
              <div
                key={phase.phase}
                className="rounded-lg p-3 border"
                style={{
                  borderColor: phaseBarColors[phase.phase],
                  backgroundColor: `${phaseBarColors[phase.phase]}08`,
                }}
              >
                <div className="text-xs font-bold" style={{ color: phaseBarColors[phase.phase] }}>
                  Phase {phase.phase}: {phase.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">{phase.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
