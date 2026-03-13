import { useState, useMemo } from 'react'
import { Calendar, Target, ArrowRight, ChevronRight, Calculator } from 'lucide-react'
import useCases from '../../data/coe/useCases.json'
import roadmap from '../../data/coe/implementationRoadmap.json'

const colorMap: Record<string, string> = {
  emerald: '#10b981', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b',
  cyan: '#06b6d4', teal: '#14b8a6', rose: '#f43f5e', orange: '#f97316',
  pink: '#ec4899', indigo: '#6366f1',
}

const phaseColors = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b']
const phaseBg = ['bg-green-50 border-green-200', 'bg-blue-50 border-blue-200', 'bg-violet-50 border-violet-200', 'bg-amber-50 border-amber-200']
const phaseText = ['text-green-700', 'text-blue-700', 'text-violet-700', 'text-amber-700']

function formatPKR(val: number) {
  if (val >= 1000) return `PKR ${(val / 1000).toFixed(1)}B`
  return `PKR ${val}M`
}

// UC dependency edges
const depEdges = useCases.flatMap(uc =>
  uc.dependencies.map(dep => ({ from: dep, to: uc.id }))
)

export default function ImplementationRoadmap() {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null)

  // Investment calculator state
  const [teamSize, setTeamSize] = useState(15)
  const [infraCost, setInfraCost] = useState(150)
  const [phases, setPhases] = useState([true, true, true, true])

  const investResult = useMemo(() => {
    const avgSalary = 4 // PKR M per person per year
    const teamCost = teamSize * avgSalary * 2 // 2 years
    const totalInvest = teamCost + infraCost
    const selectedPhaseNums = phases.map((p, i) => p ? i : -1).filter(i => i >= 0)
    const annualSavings = useCases
      .filter(uc => selectedPhaseNums.includes(uc.phase - 1))
      .reduce((s, uc) => s + (uc.revenueImpact.annualSavingMin + uc.revenueImpact.annualSavingMax) / 2, 0)
    const roi = annualSavings > 0 ? ((annualSavings - totalInvest) / totalInvest * 100) : 0
    const payback = annualSavings > 0 ? (totalInvest / annualSavings * 12) : 0
    return { teamCost, totalInvest, annualSavings, roi, payback }
  }, [teamSize, infraCost, phases])

  // Gantt data
  const months = Array.from({ length: 24 }, (_, i) => i + 1)
  const ucPhaseMap: Record<string, { start: number; end: number }> = {}
  roadmap.forEach(phase => {
    const [s, e] = phase.months.split('-').map(Number)
    phase.useCases.forEach(ucId => {
      ucPhaseMap[ucId] = { start: s, end: e }
    })
  })

  // DAG layout: position UCs left-to-right by phase
  const dagUCs = useCases.map(uc => ({
    ...uc,
    x: (uc.phase - 1) * 200 + 60,
    y: 0, // will compute below
  }))
  // Stack UCs within each phase
  const phaseGroups: Record<number, typeof dagUCs> = {}
  dagUCs.forEach(uc => {
    if (!phaseGroups[uc.phase]) phaseGroups[uc.phase] = []
    phaseGroups[uc.phase].push(uc)
  })
  Object.values(phaseGroups).forEach(group => {
    group.forEach((uc, i) => {
      uc.y = 40 + i * 55
    })
  })
  const dagHeight = Math.max(...dagUCs.map(u => u.y)) + 60

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Implementation Roadmap</h1>
        <p className="text-amber-100 text-lg">24-month, 4-phase journey from foundation to full optimization</p>
      </div>

      {/* Phase Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roadmap.map((phase, i) => {
          const phaseUCs = useCases.filter(uc => phase.useCases.includes(uc.id))
          const totalMin = phaseUCs.reduce((s, uc) => s + uc.revenueImpact.annualSavingMin, 0)
          const totalMax = phaseUCs.reduce((s, uc) => s + uc.revenueImpact.annualSavingMax, 0)
          return (
            <button
              key={phase.phaseNumber}
              onClick={() => setSelectedPhase(selectedPhase === i ? null : i)}
              className={`rounded-xl border p-5 text-left transition-all hover:shadow-md ${phaseBg[i]} ${selectedPhase === i ? 'ring-2 ring-offset-1' : ''}`}
              style={selectedPhase === i ? { ringColor: phaseColors[i] } : {}}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: phaseColors[i] }}
                >
                  {phase.phaseNumber}
                </div>
                <div>
                  <div className={`font-semibold text-sm ${phaseText[i]}`}>{phase.name}</div>
                  <div className="text-xs text-slate-500">Months {phase.months}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {phase.useCases.map(ucId => {
                  const uc = useCases.find(u => u.id === ucId)
                  return (
                    <span key={ucId} className="text-xs px-1.5 py-0.5 rounded text-white font-bold" style={{ backgroundColor: uc ? colorMap[uc.color] : '#94a3b8' }}>
                      {ucId}
                    </span>
                  )
                })}
              </div>
              <div className="text-xs text-slate-500 mb-2">{phase.milestones.length} milestones</div>
              {totalMax > 0 && (
                <div className="text-xs font-semibold text-amber-600">
                  Impact: {formatPKR(totalMin)}–{formatPKR(totalMax)}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Expanded Phase Detail */}
      {selectedPhase !== null && (
        <div className={`rounded-xl border p-6 ${phaseBg[selectedPhase]}`}>
          <h3 className={`font-semibold mb-3 ${phaseText[selectedPhase]}`}>
            Phase {roadmap[selectedPhase].phaseNumber}: {roadmap[selectedPhase].name} — Milestones
          </h3>
          <ul className="space-y-2 mb-4">
            {roadmap[selectedPhase].milestones.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <ChevronRight size={14} className="text-amber-500 mt-0.5 shrink-0" />
                {m}
              </li>
            ))}
          </ul>
          <div className="text-sm text-slate-600">
            <span className="font-medium">Key Deliverables: </span>
            {roadmap[selectedPhase].keyDeliverables}
          </div>
        </div>
      )}

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Implementation Timeline</h2>
        <div className="min-w-[800px]">
          {/* Month headers */}
          <div className="flex items-center mb-2">
            <div className="w-36 shrink-0" />
            <div className="flex-1 flex">
              {months.map(m => (
                <div key={m} className="flex-1 text-center text-xs text-slate-400">{m}</div>
              ))}
            </div>
          </div>

          {/* Phase separators */}
          <div className="flex items-center mb-1">
            <div className="w-36 shrink-0" />
            <div className="flex-1 relative h-4">
              {roadmap.map((phase, i) => {
                const [s, e] = phase.months.split('-').map(Number)
                const left = ((s - 1) / 24) * 100
                const width = ((e - s + 1) / 24) * 100
                return (
                  <div
                    key={i}
                    className="absolute top-0 h-full rounded text-xs font-medium text-white flex items-center justify-center"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundColor: phaseColors[i] }}
                  >
                    P{phase.phaseNumber}
                  </div>
                )
              })}
            </div>
          </div>

          {/* UC bars */}
          {useCases.map(uc => {
            const range = ucPhaseMap[uc.id]
            if (!range) return null
            const left = ((range.start - 1) / 24) * 100
            const width = ((range.end - range.start + 1) / 24) * 100
            return (
              <div key={uc.id} className="flex items-center mb-1.5 group">
                <div className="w-36 shrink-0 flex items-center gap-2 pr-2">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: colorMap[uc.color] }}>
                    {uc.id}
                  </span>
                  <span className="text-xs text-slate-500 truncate">{uc.name.split(' ').slice(0, 3).join(' ')}</span>
                </div>
                <div className="flex-1 relative h-6">
                  <div className="absolute inset-0 bg-slate-50 rounded" />
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-md flex items-center px-2 text-xs text-white font-medium transition-all group-hover:opacity-90"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundColor: colorMap[uc.color] }}
                    title={`${uc.name} — Mo ${range.start}-${range.end}`}
                  >
                    {width > 15 && (
                      <span className="truncate">
                        {uc.revenueImpact.annualSavingMax > 0
                          ? `${formatPKR(uc.revenueImpact.annualSavingMin)}–${formatPKR(uc.revenueImpact.annualSavingMax)}`
                          : 'Measurement'
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* UC Dependency DAG */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Use Case Dependency Flow</h2>
        <p className="text-sm text-slate-500 mb-4">Left-to-right by implementation phase. Arrows show dependencies.</p>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 860 ${dagHeight}`} className="w-full h-auto min-w-[700px]">
            {/* Phase labels */}
            {[1, 2, 3, 4].map(p => (
              <text key={p} x={(p - 1) * 200 + 60} y={20} textAnchor="middle" fontSize={12} fontWeight={600} fill={phaseColors[p - 1]}>
                Phase {p}
              </text>
            ))}

            {/* Dependency arrows */}
            {depEdges.map(({ from, to }) => {
              const fromUC = dagUCs.find(u => u.id === from)
              const toUC = dagUCs.find(u => u.id === to)
              if (!fromUC || !toUC) return null
              return (
                <g key={`${from}-${to}`}>
                  <defs>
                    <marker id={`arrow-${from}-${to}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                    </marker>
                  </defs>
                  <line
                    x1={fromUC.x + 35} y1={fromUC.y}
                    x2={toUC.x - 35} y2={toUC.y}
                    stroke="#cbd5e1" strokeWidth={1.5}
                    markerEnd={`url(#arrow-${from}-${to})`}
                  />
                </g>
              )
            })}

            {/* UC nodes */}
            {dagUCs.map(uc => (
              <g key={uc.id}>
                <rect
                  x={uc.x - 32} y={uc.y - 16} width={64} height={32} rx={8}
                  fill={colorMap[uc.color]}
                />
                <text x={uc.x} y={uc.y - 2} textAnchor="middle" fill="white" fontSize={10} fontWeight={700}>
                  {uc.id}
                </text>
                <text x={uc.x} y={uc.y + 10} textAnchor="middle" fill="white" fontSize={7} opacity={0.85}>
                  {uc.name.split(' ')[0]}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Investment Calculator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Investment Calculator</h2>
        <p className="text-sm text-slate-500 mb-6">Estimate implementation cost vs. projected savings</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                <span>Team Size (engineers + domain experts)</span>
                <span className="text-amber-600 font-bold">{teamSize} people</span>
              </label>
              <input type="range" min={5} max={50} value={teamSize} onChange={e => setTeamSize(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                <span>Infrastructure (compute, licenses)</span>
                <span className="text-amber-600 font-bold">PKR {infraCost}M</span>
              </label>
              <input type="range" min={50} max={500} step={10} value={infraCost} onChange={e => setInfraCost(Number(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Phases to Implement</div>
              <div className="flex flex-wrap gap-2">
                {roadmap.map((phase, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const next = [...phases]
                      next[i] = !next[i]
                      setPhases(next)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      phases[i]
                        ? 'text-white border-transparent'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                    style={phases[i] ? { backgroundColor: phaseColors[i] } : {}}
                  >
                    P{phase.phaseNumber}: {phase.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="text-xs text-red-600 mb-1">Total Investment (2yr)</div>
                <div className="text-xl font-bold text-red-700">{formatPKR(investResult.totalInvest)}</div>
                <div className="text-xs text-red-500 mt-1">Team: {formatPKR(investResult.teamCost)} + Infra: PKR {infraCost}M</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="text-xs text-green-600 mb-1">Annual Savings</div>
                <div className="text-xl font-bold text-green-700">{formatPKR(investResult.annualSavings)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="text-xs text-amber-600 mb-1">ROI (Year 1)</div>
                <div className="text-xl font-bold text-amber-700">{investResult.roi.toFixed(0)}%</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="text-xs text-blue-600 mb-1">Payback Period</div>
                <div className="text-xl font-bold text-blue-700">{investResult.payback.toFixed(1)} months</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
