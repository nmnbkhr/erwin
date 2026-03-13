import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Database, Table2, Layers, ChevronDown, ChevronRight,
  Flag, Columns3, Box, Link2, TrendingUp, Download,
} from 'lucide-react'
import { downloadJSON } from '../utils/export'
import { loadStarSchema, loadGapExtensions, loadCapabilities } from '../data'
import type {
  TaiwStarSchema, TaiwStarSchemaColumn,
  TaiwGapExtensions, TaiwCapability,
} from '../types'

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

type TabId = 'erd' | 'waterfall' | 'dimensions' | 'gaps' | 'views'

const TABS: { id: TabId; label: string; icon: typeof Database }[] = [
  { id: 'erd', label: 'Star Schema ERD', icon: Database },
  { id: 'waterfall', label: 'Revenue Waterfall', icon: TrendingUp },
  { id: 'dimensions', label: 'Dimensions Explorer', icon: Table2 },
  { id: 'gaps', label: 'Gap Extensions', icon: Columns3 },
  { id: 'views', label: 'Analytical Views', icon: Layers },
]

/* Revenue waterfall static data */
const WATERFALL_DATA = [
  { name: 'CIF Value', value: 1000, base: 0, fill: '#0D9488', type: 'positive' },
  { name: 'Customs Duty (20%)', value: 200, base: 1000, fill: '#14B8A6', type: 'positive' },
  { name: 'Regulatory Duty', value: 85, base: 1200, fill: '#2DD4BF', type: 'positive' },
  { name: 'ACD (7%)', value: 70, base: 1285, fill: '#5EEAD4', type: 'positive' },
  { name: 'Sales Tax (18%)', value: 180, base: 1355, fill: '#06B6D4', type: 'positive' },
  { name: 'WHT (5.5%)', value: 55, base: 1535, fill: '#22D3EE', type: 'positive' },
  { name: 'FED (varies)', value: 40, base: 1590, fill: '#67E8F9', type: 'positive' },
  { name: 'SRO Savings', value: -120, base: 1630, fill: '#F87171', type: 'negative' },
  { name: 'FTA Preference', value: -65, base: 1510, fill: '#FB923C', type: 'negative' },
  { name: 'Total Revenue', value: 1445, base: 0, fill: '#0F766E', type: 'total' },
]

/* ================================================================== */
/*  Helper Components                                                  */
/* ================================================================== */

function PakBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-teal-100 text-teal-700 rounded">
      <Flag size={10} /> PAK
    </span>
  )
}

function ColumnRow({ col }: { col: TaiwStarSchemaColumn }) {
  return (
    <tr className="border-t border-slate-50 text-xs">
      <td className="px-3 py-1.5 text-slate-700 font-mono text-[11px]">
        <span className="flex items-center gap-1.5">
          {col.name}
          {col.isPK && (
            <span className="px-1 py-0.5 text-[9px] font-medium bg-amber-100 text-amber-700 rounded">PK</span>
          )}
          {col.isFK && (
            <span className="px-1 py-0.5 text-[9px] font-medium bg-blue-100 text-blue-700 rounded">
              FK{col.fkTarget ? ` → ${col.fkTarget}` : ''}
            </span>
          )}
          {col.pakSpecific && <PakBadge />}
        </span>
      </td>
      <td className="px-3 py-1.5 text-slate-500 font-mono text-[11px]">{col.datatype}</td>
      <td className="px-3 py-1.5 text-slate-400">{col.description}</td>
    </tr>
  )
}

/* ================================================================== */
/*  Tab 1 — Star Schema ERD                                            */
/* ================================================================== */

function StarSchemaERD({
  schema,
  highlightTable,
  onHighlightClear,
}: {
  schema: TaiwStarSchema
  highlightTable?: string | null
  onHighlightClear?: () => void
}) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  // Auto-select table when navigated from Gap Extensions
  useEffect(() => {
    if (highlightTable) {
      setSelectedTable(highlightTable)
      onHighlightClear?.()
    }
  }, [highlightTable, onHighlightClear])

  const { fact, dimensions } = useMemo(() => {
    const fact = schema.tables.find((t) => t.type === 'fact') ?? null
    const dimensions = schema.tables.filter((t) => t.type === 'dimension')
    return { fact, dimensions }
  }, [schema])

  const selectedTableData = useMemo(() => {
    if (!selectedTable) return null
    return schema.tables.find((t) => t.name === selectedTable) ?? null
  }, [schema, selectedTable])

  const factFKs = useMemo(() => {
    if (!fact) return []
    return fact.columns.filter((c) => c.isFK)
  }, [fact])

  return (
    <div className="space-y-6">
      {/* ERD Visual Layout */}
      <div className="relative bg-white rounded-lg border border-slate-200 p-8 overflow-hidden">
        <p className="text-xs text-slate-400 mb-6 text-center">
          Click any table to view column details below
        </p>

        {/* Center fact table */}
        {fact && (
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={() => setSelectedTable(selectedTable === fact.name ? null : fact.name)}
              className={`relative z-10 w-72 rounded-xl border-2 p-5 text-center transition-all ${
                selectedTable === fact.name
                  ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-100'
                  : 'border-teal-300 bg-teal-50/60 hover:shadow-md hover:border-teal-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Box size={18} className="text-teal-600" />
                <span className="text-xs font-semibold uppercase tracking-wide text-teal-600">Fact Table</span>
              </div>
              <p className="text-sm font-bold text-teal-800">{fact.name}</p>
              <p className="text-xs text-teal-600 mt-1">{fact.columns.length} columns</p>
              <p className="text-[11px] text-teal-500 mt-2 leading-relaxed line-clamp-2">{fact.description}</p>
            </button>
          </div>
        )}

        {/* Connector lines (CSS borders) from fact to dimension area */}
        <div className="flex justify-center mb-4">
          <div className="w-px h-8 bg-teal-300" />
        </div>
        <div className="flex justify-center mb-4">
          <div className="w-3/4 h-px bg-teal-200" />
        </div>

        {/* Dimension table cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {dimensions.map((dim) => {
            const pk = dim.columns.find((c) => c.isPK)
            const fkLink = factFKs.find(
              (fk) => fk.fkTarget && fk.fkTarget.split('.')[0] === dim.name,
            )
            const isSelected = selectedTable === dim.name

            return (
              <div key={dim.name} className="flex flex-col items-center">
                {/* Vertical connector from horizontal line to card */}
                <div className="w-px h-4 bg-teal-200" />
                <button
                  onClick={() => setSelectedTable(isSelected ? null : dim.name)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-teal-400 bg-teal-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Table2 size={14} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-700 truncate">{dim.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{dim.columns.length} columns</p>
                  {pk && (
                    <p className="text-[10px] text-amber-600 mt-1 font-mono truncate">
                      PK: {pk.name}
                    </p>
                  )}
                  {fkLink && (
                    <p className="text-[10px] text-blue-500 mt-0.5 truncate">
                      via {fkLink.name}
                    </p>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Views summary */}
        {schema.views.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Views ({schema.views.length})</p>
            <div className="flex flex-wrap gap-2">
              {schema.views.map((v) => (
                <span
                  key={v.name}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-slate-50 text-slate-600 rounded border border-slate-100"
                  title={v.description}
                >
                  <Layers size={10} /> {v.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel for selected table */}
      {selectedTableData && (
        <div className="bg-white rounded-lg border border-teal-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {selectedTableData.type === 'fact' ? (
                <Box size={16} className="text-teal-600" />
              ) : (
                <Table2 size={16} className="text-slate-500" />
              )}
              <h4 className="text-sm font-semibold text-slate-700">{selectedTableData.name}</h4>
              <span
                className={`px-2 py-0.5 text-[10px] font-medium rounded uppercase ${
                  selectedTableData.type === 'fact'
                    ? 'bg-teal-200 text-teal-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {selectedTableData.type}
              </span>
            </div>
            <button
              onClick={() => setSelectedTable(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">{selectedTableData.description}</p>
          <div className="overflow-x-auto rounded border border-slate-100">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-1.5 text-[10px] font-medium text-slate-500">Column</th>
                  <th className="text-left px-3 py-1.5 text-[10px] font-medium text-slate-500">Type</th>
                  <th className="text-left px-3 py-1.5 text-[10px] font-medium text-slate-500">Description</th>
                </tr>
              </thead>
              <tbody>
                {selectedTableData.columns.map((col) => (
                  <ColumnRow key={col.name} col={col} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Tab 2 — Revenue Waterfall                                          */
/* ================================================================== */

function RevenueWaterfall() {
  const chartData = WATERFALL_DATA.map((item) => ({
    name: item.name,
    base: item.type === 'total' ? 0 : item.type === 'negative' ? item.base + item.value : item.base,
    value: item.type === 'negative' ? Math.abs(item.value) : item.value,
    fill: item.fill,
    rawValue: item.value,
    type: item.type,
  }))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-700">
              Pakistan Customs Revenue Waterfall
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Revenue buildup from CIF Value through duties, taxes, and concession offsets
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#64748B' }}
              angle={-35}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              formatter={((value: number, name: string, props: { payload: { rawValue: number; type: string } }) => {
                const raw = props.payload.rawValue
                const prefix = raw < 0 ? '-' : '+'
                return [`${prefix}$${Math.abs(raw)}`, props.payload.type === 'total' ? 'Total' : 'Amount']
              }) as never}
              labelStyle={{ fontWeight: 600, color: '#334155' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
            />
            {/* Invisible base bar */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" />
            {/* Visible portion */}
            <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-teal-700 mb-2">Duty Components</h4>
          <div className="space-y-1.5">
            {WATERFALL_DATA.filter((d) => d.type === 'positive' && d.name !== 'CIF Value').map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: d.fill }} />
                <span className="text-xs text-slate-600">{d.name}</span>
                <span className="text-xs text-slate-400 ml-auto">${d.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-red-600 mb-2">Concession Branches</h4>
          <div className="space-y-1.5">
            {WATERFALL_DATA.filter((d) => d.type === 'negative').map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: d.fill }} />
                <span className="text-xs text-slate-600">{d.name}</span>
                <span className="text-xs text-red-500 ml-auto">-${Math.abs(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Net Effective Rate</h4>
          <p className="text-3xl font-bold text-teal-700">44.5%</p>
          <p className="text-xs text-slate-400 mt-1">
            Effective duty+tax rate on CIF Value after concessions
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Gross Rate</span>
              <span className="font-medium">63.0%</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Concession Offset</span>
              <span className="font-medium text-red-500">-18.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Tab 3 — Dimensions Explorer                                        */
/* ================================================================== */

/* Pakistan-specific sample values per dimension column */
const PAK_SAMPLE_VALUES: Record<string, string[]> = {
  port_code: ['PKKHI (Karachi Port)', 'PKPQS (Port Qasim)', 'PKGWD (Gwadar)'],
  port_name: ['Karachi Port', 'Port Qasim', 'Gwadar Port'],
  port_id: ['Karachi Port', 'Port Qasim', 'Gwadar Port'],
  customs_station: ['Collectorate Appraisement East', 'MCC Port Qasim', 'MCC Gwadar'],
  customs_station_code: ['APRE', 'PQSM', 'GWDR'],
  hs_code: ['0901.11 (Coffee)', '6204.62 (Garments)', '5209.42 (Denim)'],
  pct_code: ['8703.2323', '6109.1010', '3004.9099'],
  tariff_code: ['PCT Chapter 87', 'PCT Chapter 61', 'PCT Chapter 30'],
  sro_number: ['SRO 655(I)/2006', 'SRO 567(I)/2023', 'SRO 1035(I)/2017'],
  fta_code: ['CPFTA-II', 'PSFTA', 'SAFTA', 'ECOTA'],
  agreement_code: ['CPFTA-II', 'PSFTA', 'SAFTA'],
  trader_ntn: ['1234567-8', '9876543-2', '5551234-0'],
  ntn: ['1234567-8', '9876543-2'],
  currency_code: ['PKR', 'USD', 'CNY', 'EUR'],
  gd_type: ['Import GD', 'Export GD', 'Transit GD'],
  regime_code: ['IM4', 'EX1', 'IM7 (Temporary Admission)'],
  duty_type: ['Customs Duty', 'Regulatory Duty', 'Additional Customs Duty'],
  tax_type: ['Sales Tax', 'WHT', 'Federal Excise Duty'],
  weboc_module: ['WeBOC Import', 'WeBOC Export', 'WeBOC Transit'],
}

function DimensionsExplorer({ schema }: { schema: TaiwStarSchema }) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null)

  const dims = useMemo(
    () => schema.tables.filter((t) => t.type === 'dimension'),
    [schema],
  )

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        {dims.length} dimension tables powering the trade analytics star schema.
        Click a card to explore its columns.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {dims.map((dim) => {
          const isOpen = expandedDim === dim.name
          const pakCols = dim.columns.filter((c) => c.pakSpecific)
          // Gather sample values for PAK-specific columns
          const pakSamples: { colName: string; samples: string[] }[] = pakCols
            .map((c) => {
              const key = c.name.toLowerCase()
              const samples = PAK_SAMPLE_VALUES[key]
              return samples ? { colName: c.name, samples } : null
            })
            .filter((x): x is { colName: string; samples: string[] } => x !== null)
            .slice(0, 3)
          return (
            <div
              key={dim.name}
              className={`rounded-lg border transition-colors ${
                isOpen ? 'border-teal-300 col-span-full' : 'border-slate-200'
              } bg-white`}
            >
              <button
                onClick={() => setExpandedDim(isOpen ? null : dim.name)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <Table2 size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{dim.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {dim.columns.length} columns
                    {pakCols.length > 0 && (
                      <span className="text-teal-500 ml-2">
                        <Flag size={10} className="inline -mt-px mr-0.5" />
                        {pakCols.length} PAK-specific
                      </span>
                    )}
                  </p>
                  {/* Inline Pakistan sample values */}
                  {!isOpen && pakSamples.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {pakSamples.map((ps) =>
                        ps.samples.slice(0, 2).map((val) => (
                          <span
                            key={`${ps.colName}-${val}`}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] bg-teal-50 text-teal-600 rounded border border-teal-100"
                          >
                            {val}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block max-w-[200px] truncate">
                  {dim.description}
                </p>
                {isOpen ? (
                  <ChevronDown size={16} className="text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 my-3 leading-relaxed">{dim.description}</p>
                  <div className="overflow-x-auto rounded border border-slate-100">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-3 py-1.5 text-[10px] font-medium text-slate-500">Column</th>
                          <th className="text-left px-3 py-1.5 text-[10px] font-medium text-slate-500">Data Type</th>
                          <th className="text-left px-3 py-1.5 text-[10px] font-medium text-slate-500">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dim.columns.map((col) => (
                          <ColumnRow key={col.name} col={col} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Tab 4 — Gap Extensions                                             */
/* ================================================================== */

function GapExtensionsTab({
  data,
  navigate,
  onSchemaTableClick,
}: {
  data: TaiwGapExtensions
  navigate: (path: string) => void
  onSchemaTableClick?: (tableName: string) => void
}) {
  const [openModule, setOpenModule] = useState<string | null>(null)
  const [openTable, setOpenTable] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 mb-2">
        {data.modules.length} gap extension modules identified for Pakistan trade analytics.
      </p>
      {data.modules.map((mod) => {
        const isOpen = openModule === mod.id
        return (
          <div key={mod.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            {/* Accordion header */}
            <button
              onClick={() => {
                setOpenModule(isOpen ? null : mod.id)
                setOpenTable(null)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                <Columns3 size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{mod.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {mod.tableCount} tables
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-teal-50 text-teal-700 rounded border border-teal-200">
                {mod.connectsToStarSchema.length} connects
              </span>
              {isOpen ? (
                <ChevronDown size={16} className="text-slate-400 shrink-0" />
              ) : (
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              )}
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="border-t border-slate-100 px-4 py-3 space-y-4">
                {/* Connects to star schema links */}
                {mod.connectsToStarSchema.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      Connects to Star Schema
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.connectsToStarSchema.map((tbl) => (
                        <button
                          key={tbl}
                          onClick={() => onSchemaTableClick?.(tbl)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-slate-50 text-slate-600 rounded border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-colors cursor-pointer"
                          title={`View ${tbl} in Star Schema ERD`}
                        >
                          <Link2 size={10} /> {tbl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required capabilities as clickable pills */}
                {mod.requiredCapabilities.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      Required Capabilities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.requiredCapabilities.map((cap) => (
                        <button
                          key={cap}
                          onClick={() => navigate(`/taiw/capabilities?cap=${encodeURIComponent(cap)}`)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                        >
                          {cap}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tables within module */}
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Tables ({mod.tables.length})
                  </p>
                  {mod.tables.map((tbl) => {
                    const tblKey = `${mod.id}-${tbl.name}`
                    const tblOpen = openTable === tblKey
                    const pakCols = tbl.columns.filter((c) => c.pakSpecific)
                    return (
                      <div
                        key={tbl.name}
                        className={`rounded border ${
                          tblOpen ? 'border-teal-200 bg-teal-50/30' : 'border-slate-100'
                        }`}
                      >
                        <button
                          onClick={() => setOpenTable(tblOpen ? null : tblKey)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs"
                        >
                          {tblOpen ? (
                            <ChevronDown size={14} className="text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-400 shrink-0" />
                          )}
                          <span className="font-mono font-medium text-slate-600">{tbl.name}</span>
                          <span className="text-slate-400 ml-1">
                            {tbl.columns.length} cols
                            {pakCols.length > 0 && (
                              <span className="text-teal-500 ml-1">({pakCols.length} PAK)</span>
                            )}
                          </span>
                        </button>

                        {tblOpen && (
                          <div className="px-3 pb-3">
                            <p className="text-[11px] text-slate-500 mb-2">{tbl.description}</p>
                            <div className="overflow-x-auto rounded border border-slate-100">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="text-left px-2 py-1 text-[10px] font-medium text-slate-500">Column</th>
                                    <th className="text-left px-2 py-1 text-[10px] font-medium text-slate-500">Type</th>
                                    <th className="text-left px-2 py-1 text-[10px] font-medium text-slate-500">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tbl.columns.map((col) => (
                                    <tr key={col.name} className="border-t border-slate-50 text-xs">
                                      <td className="px-2 py-1 text-slate-700 font-mono text-[11px]">
                                        <span className="flex items-center gap-1">
                                          {col.name}
                                          {col.pakSpecific && <PakBadge />}
                                        </span>
                                      </td>
                                      <td className="px-2 py-1 text-slate-500 font-mono text-[11px]">
                                        {col.datatype}
                                      </td>
                                      <td className="px-2 py-1 text-slate-400">{col.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/*  Tab 5 — Analytical View Definitions                                */
/* ================================================================== */

/* Static use-case descriptions keyed by view name prefix */
const VIEW_USE_CASES: Record<string, string> = {
  VW_REVENUE: 'Aggregate customs revenue across duty types, concessions, and time periods for fiscal planning and compliance monitoring.',
  VW_TRADE: 'Analyze trade flows by commodity, partner country, and port to identify trends, imbalances, and growth opportunities.',
  VW_COMPLIANCE: 'Track compliance rates, risk scores, and audit outcomes to prioritize enforcement and reduce revenue leakage.',
  VW_CONCESSION: 'Monitor SRO and FTA concession utilization, savings impact, and eligibility patterns across traders and commodities.',
  VW_TRADER: 'Profile trader behavior, transaction volumes, risk history, and compliance track records for risk-based facilitation.',
  VW_PORT: 'Compare port throughput, clearance times, and capacity utilization across Karachi Port, Port Qasim, and Gwadar.',
}

function getViewUseCase(viewName: string): string {
  for (const [prefix, desc] of Object.entries(VIEW_USE_CASES)) {
    if (viewName.toUpperCase().startsWith(prefix)) return desc
  }
  return 'Provides analytical perspective for trade intelligence and decision support.'
}

function ViewDefinitions({ schema }: { schema: TaiwStarSchema }) {
  const views = schema.views

  if (views.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <Layers size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">No analytical views defined in the star schema.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        {views.length} analytical views providing pre-built perspectives on the trade data warehouse.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {views.map((view) => (
          <div key={view.name} className="bg-white rounded-lg border border-slate-200 p-5 hover:border-teal-200 transition-colors">
            {/* View header */}
            <div className="flex items-start gap-3 mb-3">
              <span className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                <Layers size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-700 font-mono">{view.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{view.description}</p>
              </div>
            </div>

            {/* Use case */}
            <div className="mb-3 bg-slate-50 rounded-md px-3 py-2">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Use Case</p>
              <p className="text-xs text-slate-600 leading-relaxed">{getViewUseCase(view.name)}</p>
            </div>

            {/* Source tables */}
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Source Tables</p>
              <div className="flex flex-wrap gap-1.5">
                {view.sourceTables.map((tbl) => (
                  <span
                    key={tbl}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-teal-50 text-teal-700 rounded border border-teal-200"
                  >
                    <Database size={10} /> {tbl}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function TradeAnalyticsEngine() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('erd')
  const [schema, setSchema] = useState<TaiwStarSchema | null>(null)
  const [gaps, setGaps] = useState<TaiwGapExtensions | null>(null)
  const [capabilities, setCapabilities] = useState<TaiwCapability[]>([])
  const [loading, setLoading] = useState(true)
  const [erdHighlight, setErdHighlight] = useState<string | null>(null)

  const handleSchemaTableClick = (tableName: string) => {
    setErdHighlight(tableName)
    setActiveTab('erd')
  }

  useEffect(() => {
    Promise.all([loadStarSchema(), loadGapExtensions(), loadCapabilities()])
      .then(([s, g, c]) => {
        setSchema(s)
        setGaps(g)
        setCapabilities(c)
        setLoading(false)
      })
  }, [])

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 h-16 animate-pulse" />
          ))}
        </div>
        <div className="h-[500px] bg-white rounded-lg shadow-sm animate-pulse" />
      </div>
    )
  }

  /* ---- Derived stats ---- */
  const tableCount = schema?.tables.length ?? 0
  const viewCount = schema?.views.length ?? 0
  const columnCount = schema?.tables.reduce((sum, t) => sum + t.columns.length, 0) ?? 0
  const gapModuleCount = gaps?.modules.length ?? 0
  const extTableCount = gaps?.modules.reduce((sum, m) => sum + m.tableCount, 0) ?? 0

  const statItems = [
    { label: 'Tables', value: tableCount },
    { label: 'Views', value: viewCount },
    { label: 'Columns', value: columnCount },
    { label: 'Gap Modules', value: gapModuleCount },
    { label: 'Extension Tables', value: extTableCount },
  ]

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="bg-white rounded-lg shadow-sm px-5 py-3 flex items-center gap-1 text-sm text-slate-600 flex-wrap">
        {statItems.map((s, i) => (
          <span key={s.label} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-300 mx-1.5">|</span>}
            <span className="font-bold text-teal-700">{s.value}</span>
            <span className="text-slate-500">{s.label}</span>
          </span>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => downloadJSON({
            schema,
            gaps,
            stats: { tableCount, viewCount, columnCount, gapModuleCount, extTableCount },
          }, `taiw-analytics-schema-${new Date().toISOString().slice(0, 10)}.json`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-white border-slate-200 text-slate-500 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition"
        >
          <Download size={12} />
          Export JSON
        </button>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-lg shadow-sm px-2 py-1 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'erd' && schema && (
          <StarSchemaERD schema={schema} highlightTable={erdHighlight} onHighlightClear={() => setErdHighlight(null)} />
        )}
        {activeTab === 'waterfall' && <RevenueWaterfall />}
        {activeTab === 'dimensions' && schema && <DimensionsExplorer schema={schema} />}
        {activeTab === 'gaps' && gaps && (
          <GapExtensionsTab data={gaps} navigate={navigate} onSchemaTableClick={handleSchemaTableClick} />
        )}
        {activeTab === 'views' && schema && <ViewDefinitions schema={schema} />}
      </div>
    </div>
  )
}
