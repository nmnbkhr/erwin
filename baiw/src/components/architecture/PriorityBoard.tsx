import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CapabilityCoverage } from '../../utils/architectureScoring'
import { ArrowUpRight, Target, Calendar, AlertCircle } from 'lucide-react'

interface Props {
  coverageData: CapabilityCoverage[]
}

const PHASE_COLORS = {
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-purple-100 text-purple-700',
}

export default function PriorityBoard({ coverageData }: Props) {
  const navigate = useNavigate()
  const [minPriority, setMinPriority] = useState<'All' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('All')

  const ranked = useMemo(() => {
    let list = [...coverageData]
    if (minPriority !== 'All') {
      const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      const minRank = order[minPriority] || 0
      list = list.filter((c) => (order[c.derivedPriority] || 0) >= minRank)
    }
    return list.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 50)
  }, [coverageData, minPriority])

  const stats = useMemo(() => {
    const critical = coverageData.filter((c) => c.derivedPriority === 'CRITICAL').length
    const high = coverageData.filter((c) => c.derivedPriority === 'HIGH').length
    const avgGap = coverageData.length > 0
      ? Math.round(coverageData.reduce((s, c) => s + c.maturityGap, 0) / coverageData.length * 100) / 100
      : 0
    return { critical, high, avgGap }
  }, [coverageData])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500" />
          <div>
            <div className="text-xs text-slate-500">Critical Capabilities</div>
            <div className="text-xl font-bold text-slate-800">{stats.critical}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
          <Target size={20} className="text-orange-500" />
          <div>
            <div className="text-xs text-slate-500">High Priority</div>
            <div className="text-xl font-bold text-slate-800">{stats.high}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
          <Calendar size={20} className="text-blue-500" />
          <div>
            <div className="text-xs text-slate-500">Avg Maturity Gap</div>
            <div className="text-xl font-bold text-slate-800">{stats.avgGap.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
        <span className="text-sm text-slate-600">Minimum priority:</span>
        <select
          value={minPriority}
          onChange={(e) => setMinPriority(e.target.value as typeof minPriority)}
          className="text-sm border border-slate-300 rounded-md px-2 py-1"
        >
          <option value="All">All</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High+</option>
          <option value="MEDIUM">Medium+</option>
        </select>
        <span className="ml-auto text-xs text-slate-500">
          Top {ranked.length} ranked by maturity gap × priority × coverage penalty
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Rank</th>
              <th className="px-3 py-2 font-medium">Capability</th>
              <th className="px-3 py-2 font-medium">Theme</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Coverage</th>
              <th className="px-3 py-2 font-medium">Gap</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium">Phase</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranked.map((c, i) => (
              <tr key={c.capability.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500">#{i + 1}</td>
                <td className="px-3 py-2 font-medium text-slate-800">{c.capability.name}</td>
                <td className="px-3 py-2 text-xs text-slate-600">{c.capability.themeName}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                    c.derivedPriority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    c.derivedPriority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    c.derivedPriority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {c.derivedPriority}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.coverageScore >= 70 ? 'bg-emerald-500' : c.coverageScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${c.coverageScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600">{c.coverageScore}%</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">{c.maturityGap.toFixed(2)}</td>
                <td className="px-3 py-2 font-semibold text-slate-800">{c.priorityScore.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PHASE_COLORS[c.implementationPhase as keyof typeof PHASE_COLORS] || 'bg-slate-100 text-slate-600'}`}>
                    Phase {c.implementationPhase}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => navigate(`/capabilities?cap=${encodeURIComponent(String(c.capability.id))}`)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Open in Capability Navigator"
                  >
                    <ArrowUpRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
