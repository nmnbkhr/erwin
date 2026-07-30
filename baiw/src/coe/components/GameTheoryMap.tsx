import { useState, useRef, useEffect, useCallback } from 'react'
import { Users, ChevronDown, ChevronUp, Info } from 'lucide-react'
import useCases from '../../data/coe/useCases.json'
import gameTheoryMatrix from '../../data/coe/gameTheoryMatrix.json'

const colorMap: Record<string, string> = {
  emerald: '#10b981', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b',
  cyan: '#06b6d4', teal: '#14b8a6', rose: '#f43f5e', orange: '#f97316',
  pink: '#ec4899', indigo: '#6366f1',
}

const colorBgMap: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700', amber: 'bg-amber-50 text-amber-700',
  cyan: 'bg-cyan-50 text-cyan-700', teal: 'bg-teal-50 text-teal-700',
  rose: 'bg-rose-50 text-rose-700', orange: 'bg-orange-50 text-orange-700',
  pink: 'bg-pink-50 text-pink-700', indigo: 'bg-indigo-50 text-indigo-700',
}

function formatPKR(val: number) {
  if (val >= 1000) return `PKR ${(val / 1000).toFixed(1)}B`
  return `PKR ${val}M`
}

// Game type classifications
const gameTypeCategories = [
  {
    category: 'Strategic Games (2-Player)',
    ucs: ['UC-01', 'UC-02', 'UC-04', 'UC-05'],
    color: 'bg-amber-50 border-amber-200',
    desc: 'Two players with conflicting or aligned interests making strategic decisions',
  },
  {
    category: 'Auction / Market',
    ucs: ['UC-03'],
    color: 'bg-violet-50 border-violet-200',
    desc: 'Market-based allocation through truthful bidding mechanisms',
  },
  {
    category: 'Cooperative',
    ucs: ['UC-06', 'UC-08'],
    color: 'bg-teal-50 border-teal-200',
    desc: 'Players form coalitions for mutual benefit with fair surplus division',
  },
  {
    category: 'Against Nature',
    ucs: ['UC-07'],
    color: 'bg-rose-50 border-rose-200',
    desc: 'Decisions under uncertainty where the opponent is not strategic',
  },
  {
    category: 'Mechanism Design',
    ucs: ['UC-09'],
    color: 'bg-pink-50 border-pink-200',
    desc: 'Designing rules so rational agents voluntarily choose desired outcomes',
  },
  {
    category: 'Tournament',
    ucs: ['UC-10'],
    color: 'bg-indigo-50 border-indigo-200',
    desc: 'Competitive ranking to incentivize optimal effort from all participants',
  },
]

// Equilibrium glossary
const equilibriumConcepts = [
  { name: 'Nash Equilibrium', ucs: ['UC-01', 'UC-05'], desc: 'No player can improve their outcome by unilaterally changing strategy. Both parties are in a stable state where neither benefits from deviating.' },
  { name: 'Stackelberg Equilibrium', ucs: ['UC-02'], desc: 'The leader commits to a strategy first; the follower observes and optimizes their response. The leader gains a first-mover advantage.' },
  { name: 'Dominant Strategy (DSIC)', ucs: ['UC-03'], desc: 'Each player has a strategy that is optimal regardless of what others do. Truthful reporting is always the best choice.' },
  { name: 'Tit-for-Tat', ucs: ['UC-04'], desc: 'In a repeated game, cooperate first then mirror the opponent\'s last move. Promotes long-term cooperation through reciprocity.' },
  { name: 'Reciprocal Stability', ucs: ['UC-06'], desc: 'Cooperative equilibrium sustained through mutual benefit. Both parties maintain stable behavior because defection damages the relationship.' },
  { name: 'Minimax Regret', ucs: ['UC-07'], desc: 'Choose the strategy that minimizes the maximum possible regret across all scenarios. Robust against worst-case outcomes.' },
  { name: 'Core / Shapley Value', ucs: ['UC-08'], desc: 'Fair allocation of coalition surplus based on each member\'s marginal contribution. No subgroup can do better by leaving the coalition.' },
  { name: 'Subgame Perfect', ucs: ['UC-09'], desc: 'The strategy is optimal at every decision point, not just the start. Ensures credible commitments throughout the game tree.' },
  { name: 'Effort Equilibrium', ucs: ['UC-10'], desc: 'In a tournament, each participant exerts effort where marginal benefit of ranking improvement equals marginal cost of effort.' },
]

// Extract unique players from use cases
const playerNodes = [
  'Branch Manager', 'Treasury', 'CIT Provider', 'SBP',
  'Correspondent Bank', 'Foreign Banks', 'Nature/Demand',
  'Customers', 'CIT Fleet', 'Branches',
]

const ucPlayerMap: Record<string, [string, string]> = {
  'UC-01': ['Branch Manager', 'Treasury'],
  'UC-02': ['CIT Provider', 'Treasury'],
  'UC-03': ['Branches', 'Branches'],
  'UC-04': ['Treasury', 'SBP'],
  'UC-05': ['Treasury', 'Correspondent Bank'],
  'UC-06': ['Treasury', 'Foreign Banks'],
  'UC-07': ['Treasury', 'Nature/Demand'],
  'UC-08': ['CIT Fleet', 'CIT Fleet'],
  'UC-09': ['Treasury', 'Customers'],
  'UC-10': ['Branches', 'Branch Manager'],
}

interface NodePos {
  x: number
  y: number
  vx: number
  vy: number
}

function StrategyNetwork() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredUC, setHoveredUC] = useState<string | null>(null)
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const [positions, setPositions] = useState<Record<string, NodePos>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const animRef = useRef<number>(0)

  // Initialize positions
  useEffect(() => {
    const init: Record<string, NodePos> = {}
    const w = 700, h = 420
    // Players in an outer circle
    playerNodes.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / playerNodes.length - Math.PI / 2
      init[`p_${p}`] = { x: w / 2 + 240 * Math.cos(angle), y: h / 2 + 170 * Math.sin(angle), vx: 0, vy: 0 }
    })
    // UCs in an inner circle
    useCases.forEach((uc, i) => {
      const angle = (2 * Math.PI * i) / useCases.length - Math.PI / 2
      init[`uc_${uc.id}`] = { x: w / 2 + 110 * Math.cos(angle), y: h / 2 + 80 * Math.sin(angle), vx: 0, vy: 0 }
    })
    setPositions(init)
  }, [])

  // Simple force simulation
  useEffect(() => {
    if (Object.keys(positions).length === 0) return
    let running = true
    const w = 700, h = 420

    function tick() {
      if (!running) return
      setPositions(prev => {
        const next = { ...prev }
        const keys = Object.keys(next)
        // Repulsion between all nodes
        for (let i = 0; i < keys.length; i++) {
          for (let j = i + 1; j < keys.length; j++) {
            const a = next[keys[i]], b = next[keys[j]]
            const dx = b.x - a.x, dy = b.y - a.y
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
            const force = 300 / (dist * dist)
            const fx = (dx / dist) * force, fy = (dy / dist) * force
            a.vx -= fx; a.vy -= fy
            b.vx += fx; b.vy += fy
          }
        }
        // Attraction along edges
        useCases.forEach(uc => {
          const ucKey = `uc_${uc.id}`
          const [p1, p2] = ucPlayerMap[uc.id] || ['Treasury', 'Treasury']
          for (const p of [p1, p2]) {
            const pKey = `p_${p}`
            if (!next[ucKey] || !next[pKey]) continue
            const dx = next[pKey].x - next[ucKey].x
            const dy = next[pKey].y - next[ucKey].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const force = (dist - 150) * 0.003
            next[ucKey].vx += (dx / dist) * force
            next[ucKey].vy += (dy / dist) * force
            next[pKey].vx -= (dx / dist) * force
            next[pKey].vy -= (dy / dist) * force
          }
        })
        // Center gravity
        for (const k of keys) {
          const n = next[k]
          n.vx += (w / 2 - n.x) * 0.001
          n.vy += (h / 2 - n.y) * 0.001
          n.vx *= 0.85; n.vy *= 0.85
          if (k !== (dragging ? dragging : '')) {
            n.x += n.vx; n.y += n.vy
          }
          n.x = Math.max(30, Math.min(w - 30, n.x))
          n.y = Math.max(30, Math.min(h - 30, n.y))
        }
        return { ...next }
      })
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    // Stop after 3 seconds
    const timer = setTimeout(() => { running = false; cancelAnimationFrame(animRef.current) }, 3000)
    return () => { running = false; cancelAnimationFrame(animRef.current); clearTimeout(timer) }
  }, [Object.keys(positions).length > 0, dragging])

  const handleMouseDown = useCallback((key: string) => {
    setDragging(key)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPositions(prev => ({
      ...prev,
      [dragging]: { ...prev[dragging], x, y, vx: 0, vy: 0 },
    }))
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const isHighlighted = (ucId: string, player: string) => {
    if (hoveredUC) {
      const [p1, p2] = ucPlayerMap[hoveredUC] || []
      return ucId === hoveredUC || player === p1 || player === p2
    }
    if (hoveredPlayer) {
      const relatedUCs = Object.entries(ucPlayerMap)
        .filter(([, [p1, p2]]) => p1 === hoveredPlayer || p2 === hoveredPlayer)
        .map(([id]) => id)
      return relatedUCs.includes(ucId) || player === hoveredPlayer
    }
    return true
  }

  if (Object.keys(positions).length === 0) return null

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 700 420"
      className="w-full h-auto bg-slate-50 rounded-lg border border-slate-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Edges */}
      {useCases.map(uc => {
        const ucPos = positions[`uc_${uc.id}`]
        const [p1, p2] = ucPlayerMap[uc.id] || ['Treasury', 'Treasury']
        if (!ucPos) return null
        const highlighted = isHighlighted(uc.id, '')
        return [p1, p2].filter((v, i, a) => a.indexOf(v) === i).map(p => {
          const pPos = positions[`p_${p}`]
          if (!pPos) return null
          return (
            <line
              key={`${uc.id}-${p}`}
              x1={ucPos.x} y1={ucPos.y}
              x2={pPos.x} y2={pPos.y}
              stroke={colorMap[uc.color] || '#94a3b8'}
              strokeWidth={highlighted ? 2 : 0.5}
              strokeOpacity={highlighted ? 0.6 : 0.15}
            />
          )
        })
      })}
      {/* Player nodes */}
      {playerNodes.map(p => {
        const pos = positions[`p_${p}`]
        if (!pos) return null
        const highlighted = isHighlighted('', p)
        return (
          <g
            key={p}
            onMouseEnter={() => { setHoveredPlayer(p); setHoveredUC(null) }}
            onMouseLeave={() => setHoveredPlayer(null)}
            onMouseDown={() => handleMouseDown(`p_${p}`)}
            style={{ cursor: 'grab' }}
          >
            <circle cx={pos.x} cy={pos.y} r={22} fill={highlighted ? '#1e293b' : '#94a3b8'} opacity={highlighted ? 1 : 0.3} />
            <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={10} fontWeight={600}>
              {p.length > 12 ? p.slice(0, 10) + '..' : p}
            </text>
          </g>
        )
      })}
      {/* UC nodes */}
      {useCases.map(uc => {
        const pos = positions[`uc_${uc.id}`]
        if (!pos) return null
        const highlighted = isHighlighted(uc.id, '')
        const impact = uc.revenueImpact.annualSavingMax
        const r = Math.max(12, Math.min(20, 8 + impact / 300))
        return (
          <g
            key={uc.id}
            onMouseEnter={() => {
              setHoveredUC(uc.id); setHoveredPlayer(null)
              setTooltip({ x: pos.x, y: pos.y - r - 8, text: `${uc.id}: ${uc.gameTheory.equilibrium}` })
            }}
            onMouseLeave={() => { setHoveredUC(null); setTooltip(null) }}
            onMouseDown={() => handleMouseDown(`uc_${uc.id}`)}
            style={{ cursor: 'grab' }}
          >
            <circle cx={pos.x} cy={pos.y} r={r} fill={colorMap[uc.color]} opacity={highlighted ? 1 : 0.2} />
            <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={10} fontWeight={700}>
              {uc.id.replace('UC-', '')}
            </text>
          </g>
        )
      })}
      {/* Tooltip */}
      {tooltip && (
        <g>
          <rect x={tooltip.x - 80} y={tooltip.y - 12} width={160} height={22} rx={4} fill="#1e293b" opacity={0.9} />
          <text x={tooltip.x} y={tooltip.y + 2} textAnchor="middle" fill="white" fontSize={10}>{tooltip.text}</text>
        </g>
      )}
    </svg>
  )
}

export default function GameTheoryMap() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Game Theory Strategy Map</h1>
        <p className="text-amber-100 text-lg">
          10 use cases analyzed through game-theoretic lenses — players, equilibria, and incentive mechanisms
        </p>
      </div>

      {/* Section 1: Strategy Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Strategy Matrix</h2>
          <p className="text-sm text-slate-500">Click a row to see detailed explanation</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-500 w-20">UC</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Players</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Game Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Equilibrium</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Mechanism</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 w-28">Impact</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            {/* No wrapping <tbody> here: each row renders its own <tbody> so the
                summary row and its expanded detail row stay grouped. Nesting one
                inside another is invalid HTML and React reports a hydration error. */}
            {gameTheoryMatrix.map(row => {
                const uc = useCases.find(u => u.id === row.ucId)
                const isExpanded = expandedRow === row.ucId
                return (
                  <tbody key={row.ucId}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : row.ucId)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      style={{ borderLeftWidth: 4, borderLeftColor: uc ? colorMap[uc.color] : '#94a3b8' }}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: uc ? colorMap[uc.color] : '#94a3b8' }}
                        >
                          {row.ucId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.players}</td>
                      <td className="px-4 py-3 text-slate-700">{row.gameType}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{row.equilibrium}</td>
                      <td className="px-4 py-3 text-slate-500">{row.mechanism}</td>
                      <td className="px-4 py-3 text-amber-600 font-semibold text-xs">
                        {uc && uc.revenueImpact.annualSavingMax > 0
                          ? `${formatPKR(uc.revenueImpact.annualSavingMin)}–${formatPKR(uc.revenueImpact.annualSavingMax)}`
                          : 'Measurement'
                        }
                      </td>
                      <td className="px-4 py-3">
                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </td>
                    </tr>
                    {isExpanded && uc && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50 px-8 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Use Case</div>
                              <div className="text-sm text-slate-700 font-medium mb-2">{uc.name}</div>
                              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Mechanism Detail</div>
                              <div className="text-sm text-slate-600">{uc.gameTheory.mechanism}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Optimization Technique</div>
                              <div className="text-sm text-slate-700 mb-2">{uc.optimizationTechnique.name}</div>
                              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Revenue Impact</div>
                              <div className="text-sm text-slate-600">{uc.revenueImpact.mechanism}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
              )
            })}
          </table>
        </div>
      </div>

      {/* Section 2: Interactive Strategy Network */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Interactive Strategy Network</h2>
        <p className="text-sm text-slate-500 mb-4">
          Hover over UC nodes (numbered) to see connected players. Hover over player nodes (dark) to highlight related use cases. Drag nodes to rearrange.
        </p>
        <StrategyNetwork />
      </div>

      {/* Section 3 + 4: Game Type Classification + Equilibrium Glossary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Type Classification */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Game Type Classification</h2>
          {gameTypeCategories.map(cat => {
            const totalMin = cat.ucs.reduce((sum, id) => {
              const uc = useCases.find(u => u.id === id)
              return sum + (uc?.revenueImpact.annualSavingMin || 0)
            }, 0)
            const totalMax = cat.ucs.reduce((sum, id) => {
              const uc = useCases.find(u => u.id === id)
              return sum + (uc?.revenueImpact.annualSavingMax || 0)
            }, 0)
            return (
              <div key={cat.category} className={`rounded-xl border p-4 ${cat.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm">{cat.category}</h3>
                  {totalMax > 0 && (
                    <span className="text-xs font-semibold text-amber-600">
                      {formatPKR(totalMin)}–{formatPKR(totalMax)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-2">{cat.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.ucs.map(id => {
                    const uc = useCases.find(u => u.id === id)
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: uc ? colorMap[uc.color] : '#94a3b8' }}
                      >
                        {id}
                        <span className="opacity-75">
                          {uc ? uc.name.split(' ').slice(0, 2).join(' ') : ''}
                        </span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Equilibrium Concepts Glossary */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Equilibrium Concepts Glossary</h2>
          {equilibriumConcepts.map(eq => (
            <div key={eq.name} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Info size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-sm">{eq.name}</h3>
                    {eq.ucs.map(id => {
                      const uc = useCases.find(u => u.id === id)
                      return (
                        <span
                          key={id}
                          className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: uc ? colorMap[uc.color] : '#94a3b8' }}
                        >
                          {id}
                        </span>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{eq.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
