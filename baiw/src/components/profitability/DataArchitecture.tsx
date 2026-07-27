import { useState } from 'react'
import { Database, Table2, GitBranch, Layers, Search } from 'lucide-react'
import type { WorkbenchData } from '../../utils/profitabilityWorkbench'

interface Props {
  data: WorkbenchData['dataArchitecture']
}

type FactTable = { type: 'Fact'; name: string; grain: string; measures: number }
type DimensionTable = { type: 'Dimension'; name: string; purpose: string; keyColumns: string[] }
type AggregateTable = { type: 'Aggregate'; name: string; grain: string; measures: number }
type SchemaTableItem = FactTable | DimensionTable | AggregateTable

function isDimension(t: SchemaTableItem): t is DimensionTable {
  return t.type === 'Dimension'
}

function isFactOrAggregate(t: SchemaTableItem): t is FactTable | AggregateTable {
  return t.type === 'Fact' || t.type === 'Aggregate'
}

export default function DataArchitecture({ data }: Props) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const allTables: SchemaTableItem[] = [
    ...data.starSchema.facts.map((t) => ({ ...t, type: 'Fact' as const })),
    ...data.starSchema.dimensions.map((t) => ({ ...t, type: 'Dimension' as const })),
    ...data.starSchema.aggregates.map((t) => ({ ...t, type: 'Aggregate' as const })),
  ]

  const filteredTables = allTables.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    (isDimension(t) && t.purpose.toLowerCase().includes(query.toLowerCase())) ||
    (isFactOrAggregate(t) && t.grain.toLowerCase().includes(query.toLowerCase()))
  )

  const selected = allTables.find((t) => t.name === selectedTable)

  return (
    <div className="space-y-6">
      {/* Star Schema Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Database size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">Star Schema Overview</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">{data.starSchema.summary}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-800">{data.starSchema.facts.length}</div>
            <div className="text-xs text-slate-500">Fact Tables</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-800">{data.starSchema.dimensions.length}</div>
            <div className="text-xs text-slate-500">Dimensions</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-800">{data.starSchema.aggregates.length}</div>
            <div className="text-xs text-slate-500">Aggregates</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-800">
              {data.starSchema.facts[0]?.measures || 0}
            </div>
            <div className="text-xs text-slate-500">Fact Measures</div>
          </div>
        </div>
      </div>

      {/* Table Explorer */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Table2 size={20} className="text-indigo-600" />
            Table Explorer
          </h2>
          <div className="relative w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tables..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredTables.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedTable === t.name ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{t.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    t.type === 'Fact' ? 'bg-emerald-100 text-emerald-700' :
                    t.type === 'Aggregate' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{t.type}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{isDimension(t) ? t.purpose : t.grain}</div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-4">
            {selected ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-slate-800">{selected.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    selected.type === 'Fact' ? 'bg-emerald-100 text-emerald-700' :
                    selected.type === 'Aggregate' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{selected.type}</span>
                </div>
                {isFactOrAggregate(selected) && <p className="text-xs text-slate-600 mb-1"><span className="font-medium">Grain:</span> {selected.grain}</p>}
                {isDimension(selected) && <p className="text-xs text-slate-600 mb-1"><span className="font-medium">Purpose:</span> {selected.purpose}</p>}
                {isFactOrAggregate(selected) && <p className="text-xs text-slate-600 mb-3"><span className="font-medium">Measures:</span> {selected.measures}</p>}
                {isDimension(selected) && (
                  <div className="flex flex-wrap gap-1">
                    {selected.keyColumns.map((col: string) => (
                      <span key={col} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">{col}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Select a table to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lineage */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <GitBranch size={20} className="text-violet-600" />
          Column-Level Data Lineage
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Target Column</th>
                <th className="px-3 py-2 font-medium">Business Measure</th>
                <th className="px-3 py-2 font-medium">Transformation</th>
                <th className="px-3 py-2 font-medium">Source FSDM Entities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.lineage.map((l) => (
                <tr key={l.targetColumn} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs text-slate-800">{l.targetColumn}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{l.businessMeasure}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 max-w-md truncate" title={l.transformation}>{l.transformation}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {l.sourceEntities.map((e) => (
                        <span key={e} className="text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded border border-violet-100">{e}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gap Extensions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Layers size={20} className="text-rose-600" />
          Gap Extensions for Profitability
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.gapExtensions.map((gap) => (
            <div key={gap.module} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="font-medium text-sm text-slate-800 mb-1">{gap.module}</div>
              <p className="text-xs text-slate-600 mb-3">{gap.purpose}</p>
              <div className="flex flex-wrap gap-1">
                {gap.tables.map((t) => (
                  <span key={t} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
