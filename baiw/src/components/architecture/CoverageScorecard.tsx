import { useMemo, useState } from 'react'
import type { CapabilityCoverage } from '../../utils/architectureScoring'
import { Layers, AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react'

interface Props {
  coverageData: CapabilityCoverage[]
}

const BAND_STYLES = {
  strong: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  partial: 'bg-amber-50 border-amber-200 text-amber-800',
  weak: 'bg-rose-50 border-rose-200 text-rose-800',
  gap: 'bg-slate-50 border-slate-200 text-slate-600',
}

const PRIORITY_BADGE = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  LOW: 'bg-slate-100 text-slate-600',
}

export default function CoverageScorecard({ coverageData }: Props) {
  const [themeFilter, setThemeFilter] = useState('All')
  const [bandFilter, setBandFilter] = useState<'All' | 'strong' | 'partial' | 'weak' | 'gap'>('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const summary = useMemo(() => {
    const total = coverageData.length
    const strong = coverageData.filter((c) => c.coverageBand === 'strong').length
    const partial = coverageData.filter((c) => c.coverageBand === 'partial').length
    const weak = coverageData.filter((c) => c.coverageBand === 'weak' || c.coverageBand === 'gap').length
    const critical = coverageData.filter((c) => c.derivedPriority === 'CRITICAL' || c.derivedPriority === 'HIGH').length
    const avgScore = total > 0 ? Math.round(coverageData.reduce((s, c) => s + c.coverageScore, 0) / total) : 0
    return { total, strong, partial, weak, critical, avgScore }
  }, [coverageData])

  const themes = useMemo(() => Array.from(new Set(coverageData.map((c) => c.capability.themeName))), [coverageData])

  const filtered = useMemo(() => {
    return coverageData.filter((c) => {
      if (themeFilter !== 'All' && c.capability.themeName !== themeFilter) return false
      if (bandFilter !== 'All' && c.coverageBand !== bandFilter) return false
      if (priorityFilter !== 'All' && c.derivedPriority !== priorityFilter) return false
      return true
    })
  }, [coverageData, themeFilter, bandFilter, priorityFilter])

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Capabilities</div>
          <div className="text-2xl font-bold text-slate-800">{summary.total}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Strong Coverage</div>
          <div className="text-2xl font-bold text-emerald-600">{summary.strong}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Partial Coverage</div>
          <div className="text-2xl font-bold text-amber-600">{summary.partial}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Weak / Gap</div>
          <div className="text-2xl font-bold text-rose-600">{summary.weak}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-1">Avg Coverage Score</div>
          <div className="text-2xl font-bold text-slate-800">{summary.avgScore}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-lg p-3">
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-md px-2 py-1"
        >
          <option value="All">All Themes</option>
          {themes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={bandFilter}
          onChange={(e) => setBandFilter(e.target.value as typeof bandFilter)}
          className="text-sm border border-slate-300 rounded-md px-2 py-1"
        >
          <option value="All">All Coverage Bands</option>
          <option value="strong">Strong</option>
          <option value="partial">Partial</option>
          <option value="weak">Weak</option>
          <option value="gap">Gap</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-md px-2 py-1"
        >
          <option value="All">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <div className="ml-auto text-sm text-slate-500 self-center">
          Showing {filtered.length} of {coverageData.length}
        </div>
      </div>

      {/* Capability grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((c) => (
          <div
            key={c.capability.id}
            className={`rounded-lg border p-3 ${BAND_STYLES[c.coverageBand]} transition hover:shadow-sm`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500">{c.capability.groupName}</span>
              <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${PRIORITY_BADGE[c.derivedPriority]}`}>
                {c.derivedPriority}
              </span>
            </div>
            <div className="font-semibold text-sm mb-2 leading-tight">{c.capability.name}</div>
            <div className="space-y-1 text-xs opacity-90">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                <span>{c.reqCount} data reqs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers size={12} />
                <span>{c.uniqueEntityCount} entities / {c.uniqueDomainCount} domains</span>
              </div>
              <div className="flex items-center gap-1.5">
                {c.coverageScore >= 70 ? <CheckCircle2 size={12} /> : c.coverageScore >= 40 ? <MinusCircle size={12} /> : <AlertTriangle size={12} />}
                <span>Coverage: {c.coverageScore}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
