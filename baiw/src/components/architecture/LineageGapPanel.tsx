import { useState, useMemo } from 'react'
import type { LineageEntry, GapModule, StarSchema } from '../../types'
import { GitBranch, Layers, Table2, ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  lineage: LineageEntry[]
  gapModules: GapModule[]
  starSchema: StarSchema | null
}

export default function LineageGapPanel({ lineage, gapModules, starSchema }: Props) {
  const [activeTab, setActiveTab] = useState<'lineage' | 'gaps' | 'star'>('lineage')
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set())

  const lineageTargets = useMemo(() => {
    const grouped: Record<string, LineageEntry[]> = {}
    lineage.forEach((l) => {
      if (!grouped[l.targetEntity]) grouped[l.targetEntity] = []
      grouped[l.targetEntity].push(l)
    })
    return grouped
  }, [lineage])

  const toggleGap = (id: string) => {
    setExpandedGaps((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        {[
          { key: 'lineage', label: 'Data Lineage', icon: GitBranch },
          { key: 'gaps', label: 'Gap Extensions', icon: Layers },
          { key: 'star', label: 'Star Schema', icon: Table2 },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === t.key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'lineage' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium">Target Entity</th>
                  <th className="px-3 py-2 font-medium">Target Column</th>
                  <th className="px-3 py-2 font-medium">Transformation</th>
                  <th className="px-3 py-2 font-medium">Source Entity</th>
                  <th className="px-3 py-2 font-medium">Source Column</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(lineageTargets).flatMap(([target, entries]) =>
                  entries.map((l, idx) => (
                    <tr key={`${target}-${idx}`} className="hover:bg-slate-50">
                      {idx === 0 && (
                        <td rowSpan={entries.length} className="px-3 py-2 font-medium text-slate-800 align-top bg-slate-50/50">
                          {target}
                        </td>
                      )}
                      <td className="px-3 py-2 text-slate-700">{l.targetColumn || '—'}</td>
                      <td className="px-3 py-2 text-xs text-slate-600 max-w-md truncate" title={l.transformation}>{l.transformation}</td>
                      <td className="px-3 py-2 text-slate-700">{l.sourceEntity || '—'}</td>
                      <td className="px-3 py-2 text-slate-700">{l.sourceColumn || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'gaps' && (
        <div className="space-y-3">
          {gapModules.map((gap) => {
            const expanded = expandedGaps.has(gap.id)
            return (
              <div key={gap.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGap(gap.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Layers size={18} className="text-purple-600" />
                    <div className="text-left">
                      <div className="font-semibold text-sm text-slate-800">{gap.name}</div>
                      <div className="text-xs text-slate-500">{gap.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{gap.tables.length} tables</span>
                    {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                  </div>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {gap.tables.map((t) => (
                        <div key={t.name} className="bg-slate-50 border border-slate-200 rounded-md p-3">
                          <div className="font-medium text-xs text-slate-800 mb-2">{t.name}</div>
                          <div className="space-y-1">
                            {t.columns.slice(0, 6).map((col) => (
                              <div key={col.name} className="flex justify-between text-[11px] text-slate-600">
                                <span className="font-mono">{col.name}</span>
                                <span className="text-slate-400">{col.dataType}</span>
                              </div>
                            ))}
                            {t.columns.length > 6 && (
                              <div className="text-[11px] text-slate-400">+{t.columns.length - 6} more columns</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'star' && starSchema && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Table2 size={16} className="text-emerald-600" />
              <h4 className="font-semibold text-sm text-slate-800">Fact Table</h4>
            </div>
            <div className="text-xs font-mono bg-slate-50 border border-slate-200 rounded p-2 mb-2">{starSchema.factTable.name}</div>
            <div className="text-xs text-slate-500">{starSchema.factTable.columns.length} measures / keys</div>
          </div>
          {starSchema.dimensions.map((dim) => (
            <div key={dim.name} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Table2 size={16} className="text-blue-600" />
                <h4 className="font-semibold text-sm text-slate-800">{dim.name}</h4>
                <span className="text-[10px] uppercase text-slate-400">{dim.type}</span>
              </div>
              <div className="text-xs text-slate-500">{dim.columns.length} columns</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {dim.columns.slice(0, 8).map((c) => (
                  <span key={c.name} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{c.name}</span>
                ))}
                {dim.columns.length > 8 && <span className="text-[10px] text-slate-400">+{dim.columns.length - 8}</span>}
              </div>
            </div>
          ))}
          {starSchema.aggregates.map((agg) => (
            <div key={agg.name} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Table2 size={16} className="text-amber-600" />
                <h4 className="font-semibold text-sm text-slate-800">{agg.name}</h4>
                <span className="text-[10px] uppercase text-slate-400">{agg.type}</span>
              </div>
              <div className="text-xs text-slate-500">{agg.columns.length} columns</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
