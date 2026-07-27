import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TraceabilityRow } from '../../utils/architectureScoring'
import { Search, Database, ArrowRight } from 'lucide-react'

interface Props {
  rows: TraceabilityRow[]
}

export default function TraceabilityMatrix({ rows }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [themeFilter, setThemeFilter] = useState('All')

  const themes = useMemo(() => Array.from(new Set(rows.map((r) => r.themeName))), [rows])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return rows.filter((r) => {
      if (themeFilter !== 'All' && r.themeName !== themeFilter) return false
      if (!q) return true
      return (
        r.capabilityName.toLowerCase().includes(q) ||
        r.reqDescription.toLowerCase().includes(q) ||
        r.fsdmSubjectArea.toLowerCase().includes(q) ||
        r.entityNames.some((e) => e.toLowerCase().includes(q)) ||
        r.domainNames.some((d) => d.toLowerCase().includes(q))
      )
    })
  }, [rows, query, themeFilter])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search capability, requirement, entity, domain..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md"
          />
        </div>
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-md px-2 py-1.5"
        >
          <option value="All">All Themes</option>
          {themes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="text-xs text-slate-500">
          {filtered.length} rows
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0">
              <tr>
                <th className="px-3 py-2 font-medium">Theme</th>
                <th className="px-3 py-2 font-medium">Capability</th>
                <th className="px-3 py-2 font-medium">Data Requirement</th>
                <th className="px-3 py-2 font-medium">FSDM Subject Area</th>
                <th className="px-3 py-2 font-medium">Entities</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Phase</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, 200).map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">{r.themeName}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{r.capabilityName}</td>
                  <td className="px-3 py-2 text-slate-600 max-w-xs truncate" title={r.reqDescription}>{r.reqDescription}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      <Database size={10} />
                      {r.fsdmSubjectArea}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {r.entityNames.slice(0, 4).map((e) => (
                        <span key={e} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 truncate max-w-[120px]">
                          {e}
                        </span>
                      ))}
                      {r.entityNames.length > 4 && (
                        <span className="text-[10px] text-slate-500 px-1">+{r.entityNames.length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                      r.derivedPriority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      r.derivedPriority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      r.derivedPriority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {r.derivedPriority}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{r.implementationPhase}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => navigate(`/model?search=${encodeURIComponent(r.capabilityName)}`)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Explore in Model Explorer"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 200 && (
          <div className="px-3 py-2 text-xs text-slate-500 border-t border-slate-100">
            Showing first 200 of {filtered.length} rows. Refine filters to narrow results.
          </div>
        )}
      </div>
    </div>
  )
}
