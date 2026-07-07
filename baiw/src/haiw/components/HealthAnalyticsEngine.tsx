import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Database, Table2, Layers, ChevronDown, ChevronRight,
  Flag, Columns3, Box, Link2, Download, Activity,
  Heart, Eye,
} from 'lucide-react'
import { loadStarSchema, loadGapExtensions } from '../data'
import type { HaiwStarSchema, HaiwStarSchemaColumn, HaiwGapExtensions } from '../types'

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

type TabId = 'erd' | 'dimensions' | 'gaps' | 'views'

const TABS: { id: TabId; label: string; icon: typeof Database }[] = [
  { id: 'erd', label: 'Star Schema ERD', icon: Database },
  { id: 'dimensions', label: 'Dimensions Explorer', icon: Table2 },
  { id: 'gaps', label: 'Gap Extensions', icon: Columns3 },
  { id: 'views', label: 'Views & Aggregates', icon: Layers },
]

/* ================================================================== */
/*  Helper Components                                                  */
/* ================================================================== */

function PakBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">
      <Flag size={10} /> PAK
    </span>
  )
}

function ColumnRow({ col }: { col: HaiwStarSchemaColumn }) {
  return (
    <tr className="border-t border-slate-50 text-xs">
      <td className="px-3 py-1.5 text-slate-700 font-mono text-xs">
        <span className="flex items-center gap-1.5">
          {col.name}
          {col.isPK && (
            <span className="px-1 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700 rounded">PK</span>
          )}
          {col.isFK && (
            <span className="px-1 py-0.5 text-[11px] font-medium bg-blue-100 text-blue-700 rounded">
              FK{col.fkTarget ? ` \u2192 ${col.fkTarget}` : ''}
            </span>
          )}
          {col.pakSpecific && <PakBadge />}
        </span>
      </td>
      <td className="px-3 py-1.5 text-slate-500 font-mono text-xs">{col.datatype}</td>
      <td className="px-3 py-1.5 text-slate-400">{col.description}</td>
    </tr>
  )
}

/* ================================================================== */
/*  Tab 1 — Star Schema ERD                                            */
/* ================================================================== */

/** Radial layout positions for dimension cards around the center fact */
function getRadialPosition(index: number, total: number, radius: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  }
}

function StarSchemaERD({
  schema,
  highlightTable,
  onHighlightClear,
}: {
  schema: HaiwStarSchema
  highlightTable?: string | null
  onHighlightClear?: () => void
}) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  useEffect(() => {
    if (highlightTable) {
      setSelectedTable(highlightTable)
      onHighlightClear?.()
    }
  }, [highlightTable, onHighlightClear])

  const { fact, dimensions, aggregates } = useMemo(() => {
    const fact = schema.tables.find((t) => t.type === 'fact') ?? null
    const dimensions = schema.tables.filter((t) => t.type === 'dimension')
    const aggregates = schema.tables.filter((t) => t.type === 'aggregate')
    return { fact, dimensions, aggregates }
  }, [schema])

  const selectedTableData = useMemo(() => {
    if (!selectedTable) return null
    return schema.tables.find((t) => t.name === selectedTable) ?? null
  }, [schema, selectedTable])

  const factFKs = useMemo(() => {
    if (!fact) return []
    return fact.columns.filter((c) => c.isFK)
  }, [fact])

  /* Use radial layout only on large screens, otherwise fall back to grid */
  const useRadial = dimensions.length <= 14

  /* SVG dimensions for radial layout */
  const svgSize = 800
  const center = svgSize / 2
  const radius = 320
  const factBoxW = 200
  const factBoxH = 80
  const dimBoxW = 130
  const dimBoxH = 52

  return (
    <div className="space-y-6">
      {/* ERD Visual Layout */}
      <div className="relative bg-white rounded-lg border border-slate-200 p-4 overflow-hidden">
        <p className="text-xs text-slate-400 mb-4 text-center">
          Click any table to view column details below
        </p>

        {useRadial ? (
          /* ---- Radial SVG layout ---- */
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="w-full max-w-4xl mx-auto"
              style={{ minWidth: 500, maxHeight: 680 }}
            >
              {/* Connector lines from center to each dimension */}
              {dimensions.map((dim, i) => {
                const pos = getRadialPosition(i, dimensions.length, radius)
                return (
                  <line
                    key={`line-${dim.name}`}
                    x1={center}
                    y1={center}
                    x2={center + pos.x}
                    y2={center + pos.y}
                    stroke="#A7F3D0"
                    strokeWidth={1.5}
                    strokeDasharray={selectedTable === dim.name ? 'none' : '4 3'}
                  />
                )
              })}

              {/* Center fact table */}
              {fact && (
                <g
                  onClick={() => setSelectedTable(selectedTable === fact.name ? null : fact.name)}
                  className="cursor-pointer"
                >
                  <rect
                    x={center - factBoxW / 2}
                    y={center - factBoxH / 2}
                    width={factBoxW}
                    height={factBoxH}
                    rx={12}
                    fill={selectedTable === fact.name ? '#D1FAE5' : '#ECFDF5'}
                    stroke={selectedTable === fact.name ? '#10B981' : '#6EE7B7'}
                    strokeWidth={2}
                  />
                  <text
                    x={center}
                    y={center - 12}
                    textAnchor="middle"
                    className="text-xs font-semibold uppercase tracking-wide"
                    fill="#047857"
                  >
                    Fact Table
                  </text>
                  <text
                    x={center}
                    y={center + 6}
                    textAnchor="middle"
                    className="text-xs font-bold"
                    fill="#064E3B"
                  >
                    {fact.name.length > 28 ? fact.name.slice(0, 26) + '...' : fact.name}
                  </text>
                  <text
                    x={center}
                    y={center + 22}
                    textAnchor="middle"
                    className="text-xs"
                    fill="#059669"
                  >
                    {fact.columns.length} columns
                  </text>
                </g>
              )}

              {/* Dimension cards around the perimeter */}
              {dimensions.map((dim, i) => {
                const pos = getRadialPosition(i, dimensions.length, radius)
                const cx = center + pos.x
                const cy = center + pos.y
                const isSelected = selectedTable === dim.name
                const pk = dim.columns.find((c) => c.isPK)

                return (
                  <g
                    key={dim.name}
                    onClick={() => setSelectedTable(isSelected ? null : dim.name)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={cx - dimBoxW / 2}
                      y={cy - dimBoxH / 2}
                      width={dimBoxW}
                      height={dimBoxH}
                      rx={8}
                      fill={isSelected ? '#D1FAE5' : '#FFFFFF'}
                      stroke={isSelected ? '#10B981' : '#E2E8F0'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <text
                      x={cx}
                      y={cy - 8}
                      textAnchor="middle"
                      className="text-[11px] font-medium"
                      fill="#334155"
                    >
                      {dim.name.length > 20 ? dim.name.slice(0, 18) + '...' : dim.name}
                    </text>
                    <text
                      x={cx}
                      y={cy + 6}
                      textAnchor="middle"
                      className="text-[11px]"
                      fill="#94A3B8"
                    >
                      {dim.columns.length} cols
                      {pk ? ` | PK: ${pk.name.length > 10 ? pk.name.slice(0, 8) + '..' : pk.name}` : ''}
                    </text>
                    <text
                      x={cx}
                      y={cy + 18}
                      textAnchor="middle"
                      className="text-[11px]"
                      fill="#6EE7B7"
                    >
                      {dim.columns.some((c) => c.pakSpecific) ? 'PAK' : ''}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        ) : (
          /* ---- Fallback grid layout ---- */
          <>
            {fact && (
              <div className="flex flex-col items-center mb-8">
                <button
                  onClick={() => setSelectedTable(selectedTable === fact.name ? null : fact.name)}
                  className={`relative z-10 w-72 rounded-xl border-2 p-5 text-center transition-all ${
                    selectedTable === fact.name
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                      : 'border-emerald-300 bg-emerald-50/60 hover:shadow-md hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Box size={18} className="text-emerald-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Fact Table</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-800">{fact.name}</p>
                  <p className="text-xs text-emerald-600 mt-1">{fact.columns.length} columns</p>
                  <p className="text-xs text-emerald-500 mt-2 leading-relaxed line-clamp-2">{fact.description}</p>
                </button>
              </div>
            )}
            <div className="flex justify-center mb-4"><div className="w-px h-8 bg-emerald-300" /></div>
            <div className="flex justify-center mb-4"><div className="w-3/4 h-px bg-emerald-200" /></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {dimensions.map((dim) => {
                const pk = dim.columns.find((c) => c.isPK)
                const fkLink = factFKs.find((fk) => fk.fkTarget && fk.fkTarget.split('.')[0] === dim.name)
                const isSelected = selectedTable === dim.name
                return (
                  <div key={dim.name} className="flex flex-col items-center">
                    <div className="w-px h-4 bg-emerald-200" />
                    <button
                      onClick={() => setSelectedTable(isSelected ? null : dim.name)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Table2 size={14} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate">{dim.name}</span>
                      </div>
                      <p className="text-xs text-slate-400">{dim.columns.length} columns</p>
                      {pk && <p className="text-xs text-amber-600 mt-1 font-mono truncate">PK: {pk.name}</p>}
                      {fkLink && <p className="text-xs text-blue-500 mt-0.5 truncate">via {fkLink.name}</p>}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Aggregate tables summary inline */}
        {aggregates.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Aggregate Tables ({aggregates.length})</p>
            <div className="flex flex-wrap gap-2">
              {aggregates.map((a) => (
                <button
                  key={a.name}
                  onClick={() => setSelectedTable(selectedTable === a.name ? null : a.name)}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                    selectedTable === a.name
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                  title={a.description}
                >
                  <Activity size={10} /> {a.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Views summary inline */}
        {schema.views.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Views ({schema.views.length})</p>
            <div className="flex flex-wrap gap-2">
              {schema.views.map((v) => (
                <span
                  key={v.name}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded border border-slate-100"
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
        <div className="bg-white rounded-lg border border-emerald-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {selectedTableData.type === 'fact' ? (
                <Box size={16} className="text-emerald-600" />
              ) : selectedTableData.type === 'aggregate' ? (
                <Activity size={16} className="text-emerald-500" />
              ) : (
                <Table2 size={16} className="text-slate-500" />
              )}
              <h4 className="text-sm font-semibold text-slate-700">{selectedTableData.name}</h4>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded uppercase ${
                  selectedTableData.type === 'fact'
                    ? 'bg-emerald-200 text-emerald-800'
                    : selectedTableData.type === 'aggregate'
                    ? 'bg-green-100 text-green-700'
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
                  <th className="text-left px-3 py-1.5 text-xs font-medium text-slate-500">Column</th>
                  <th className="text-left px-3 py-1.5 text-xs font-medium text-slate-500">Type</th>
                  <th className="text-left px-3 py-1.5 text-xs font-medium text-slate-500">Description</th>
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
/*  Tab 2 — Dimensions Explorer                                        */
/* ================================================================== */

function DimensionsExplorer({ schema }: { schema: HaiwStarSchema }) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null)

  const dims = useMemo(
    () => schema.tables.filter((t) => t.type === 'dimension'),
    [schema],
  )

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        {dims.length} dimension tables powering the healthcare analytics star schema.
        Click a card to explore its columns.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {dims.map((dim) => {
          const isOpen = expandedDim === dim.name
          const pakCols = dim.columns.filter((c) => c.pakSpecific)
          const keyAttrs = dim.columns.slice(0, 5)

          return (
            <div
              key={dim.name}
              className={`rounded-lg border transition-colors ${
                isOpen ? 'border-emerald-300 col-span-full' : 'border-slate-200'
              } bg-white`}
            >
              <button
                onClick={() => setExpandedDim(isOpen ? null : dim.name)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Table2 size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{dim.name}</p>
                  <p className="text-xs text-slate-400">
                    {dim.columns.length} columns
                    {pakCols.length > 0 && (
                      <span className="text-emerald-500 ml-2">
                        <Flag size={10} className="inline -mt-px mr-0.5" />
                        {pakCols.length} PAK-specific
                      </span>
                    )}
                  </p>
                  {/* Key attributes preview when collapsed */}
                  {!isOpen && keyAttrs.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {keyAttrs.map((col) => (
                        <span
                          key={col.name}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-slate-50 text-slate-500 rounded border border-slate-100"
                        >
                          {col.isPK && <span className="text-amber-500 font-bold mr-0.5">PK</span>}
                          {col.isFK && <span className="text-blue-500 font-bold mr-0.5">FK</span>}
                          {col.name}
                        </span>
                      ))}
                      {dim.columns.length > 5 && (
                        <span className="text-[11px] text-slate-400 px-1 py-0.5">
                          +{dim.columns.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 hidden md:block max-w-[200px] truncate">
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
                  {pakCols.length > 0 && (
                    <div className="mb-3 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                      <p className="text-xs font-medium text-emerald-700 mb-1">Pakistan-Specific Columns</p>
                      <div className="flex flex-wrap gap-1">
                        {pakCols.map((c) => (
                          <span key={c.name} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-white text-emerald-700 rounded border border-emerald-200 font-mono">
                            <Flag size={8} /> {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto rounded border border-slate-100">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-slate-500">Column</th>
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-slate-500">Data Type</th>
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-slate-500">Description</th>
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
/*  Tab 3 — Gap Extensions                                             */
/* ================================================================== */

function GapExtensionsTab({
  data,
  navigate,
  onSchemaTableClick,
}: {
  data: HaiwGapExtensions
  navigate: (path: string) => void
  onSchemaTableClick?: (tableName: string) => void
}) {
  const [openModule, setOpenModule] = useState<string | null>(null)
  const [openTable, setOpenTable] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 mb-2">
        {data.modules.length} gap extension modules identified for Pakistan healthcare analytics.
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
              <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <Columns3 size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{mod.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mod.id} &middot; {mod.tableCount} tables
                </p>
              </div>
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
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
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      Connects to Star Schema
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.connectsToStarSchema.map((tbl) => (
                        <button
                          key={tbl}
                          onClick={() => onSchemaTableClick?.(tbl)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-slate-50 text-slate-600 rounded border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
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
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      Required Capabilities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.requiredCapabilities.map((cap) => (
                        <button
                          key={cap}
                          onClick={() => navigate(`/haiw/capabilities?cap=${encodeURIComponent(cap)}`)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          {cap}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tables within module */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                          tblOpen ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'
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
                              <span className="text-emerald-500 ml-1">({pakCols.length} PAK)</span>
                            )}
                          </span>
                        </button>

                        {tblOpen && (
                          <div className="px-3 pb-3">
                            <p className="text-xs text-slate-500 mb-2">{tbl.description}</p>
                            <div className="overflow-x-auto rounded border border-slate-100">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="text-left px-2 py-1 text-xs font-medium text-slate-500">Column</th>
                                    <th className="text-left px-2 py-1 text-xs font-medium text-slate-500">Type</th>
                                    <th className="text-left px-2 py-1 text-xs font-medium text-slate-500">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tbl.columns.map((col) => (
                                    <tr key={col.name} className="border-t border-slate-50 text-xs">
                                      <td className="px-2 py-1 text-slate-700 font-mono text-xs">
                                        <span className="flex items-center gap-1">
                                          {col.name}
                                          {col.pakSpecific && <PakBadge />}
                                        </span>
                                      </td>
                                      <td className="px-2 py-1 text-slate-500 font-mono text-xs">
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
/*  Tab 4 — Views & Aggregates                                         */
/* ================================================================== */

/** Static use-case descriptions for healthcare analytical views */
const VIEW_USE_CASES: Record<string, string> = {
  VW_PATIENT: 'Comprehensive patient-centric view combining demographics, encounters, and clinical history for longitudinal analysis.',
  VW_CLINICAL: 'Aggregate clinical outcomes, diagnoses, and procedures for quality measurement and clinical decision support.',
  VW_FACILITY: 'Facility-level performance metrics including utilization, capacity, and resource allocation tracking.',
  VW_POPULATION: 'Population health analytics including disease prevalence, risk stratification, and community health indicators.',
  VW_PROVIDER: 'Provider performance and workload analysis covering patient volumes, outcomes, and referral patterns.',
  VW_PHARMACY: 'Medication dispensing, formulary compliance, and pharmaceutical supply chain analytics.',
}

function getViewUseCase(viewName: string): string {
  for (const [prefix, desc] of Object.entries(VIEW_USE_CASES)) {
    if (viewName.toUpperCase().startsWith(prefix)) return desc
  }
  return 'Provides analytical perspective for healthcare intelligence and clinical decision support.'
}

function ViewsAndAggregates({ schema }: { schema: HaiwStarSchema }) {
  const views = schema.views
  const aggregates = useMemo(
    () => schema.tables.filter((t) => t.type === 'aggregate'),
    [schema],
  )
  const [expandedAgg, setExpandedAgg] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Analytical Views */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Eye size={18} className="text-emerald-600" />
          <h3 className="text-base font-semibold text-slate-700">Analytical Views</h3>
          <span className="text-xs text-slate-400">({views.length})</span>
        </div>

        {views.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <Layers size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No analytical views defined in the star schema.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {views.map((view) => (
              <div key={view.name} className="bg-white rounded-lg border border-slate-200 p-5 hover:border-emerald-200 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-700 font-mono">{view.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{view.description}</p>
                  </div>
                </div>

                {/* Use case */}
                <div className="mb-3 bg-slate-50 rounded-md px-3 py-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Use Case</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{getViewUseCase(view.name)}</p>
                </div>

                {/* Source tables */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Source Tables</p>
                  <div className="flex flex-wrap gap-1.5">
                    {view.sourceTables.map((tbl) => (
                      <span
                        key={tbl}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-emerald-50 text-emerald-700 rounded border border-emerald-200"
                      >
                        <Database size={10} /> {tbl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aggregate Tables */}
      {aggregates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-green-600" />
            <h3 className="text-base font-semibold text-slate-700">Aggregate Tables</h3>
            <span className="text-xs text-slate-400">({aggregates.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {aggregates.map((agg) => {
              const isOpen = expandedAgg === agg.name
              return (
                <div
                  key={agg.name}
                  className={`rounded-lg border transition-colors bg-white ${
                    isOpen ? 'border-green-300 col-span-full' : 'border-slate-200 hover:border-green-200'
                  }`}
                >
                  <button
                    onClick={() => setExpandedAgg(isOpen ? null : agg.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <Activity size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate font-mono">{agg.name}</p>
                      <p className="text-xs text-slate-400">
                        {agg.columns.length} columns
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 hidden md:block max-w-[180px] truncate">
                      {agg.description}
                    </p>
                    {isOpen ? (
                      <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 my-3 leading-relaxed">{agg.description}</p>
                      <div className="overflow-x-auto rounded border border-slate-100">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left px-3 py-1.5 text-xs font-medium text-slate-500">Column</th>
                              <th className="text-left px-3 py-1.5 text-xs font-medium text-slate-500">Data Type</th>
                              <th className="text-left px-3 py-1.5 text-xs font-medium text-slate-500">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {agg.columns.map((col) => (
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
      )}
    </div>
  )
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function HealthAnalyticsEngine() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('erd')
  const [schema, setSchema] = useState<HaiwStarSchema | null>(null)
  const [gaps, setGaps] = useState<HaiwGapExtensions | null>(null)
  const [loading, setLoading] = useState(true)
  const [erdHighlight, setErdHighlight] = useState<string | null>(null)

  const handleSchemaTableClick = (tableName: string) => {
    setErdHighlight(tableName)
    setActiveTab('erd')
  }

  useEffect(() => {
    Promise.all([loadStarSchema(), loadGapExtensions()])
      .then(([s, g]) => {
        setSchema(s)
        setGaps(g)
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
  const factTables = schema?.tables.filter((t) => t.type === 'fact').length ?? 0
  const dimTables = schema?.tables.filter((t) => t.type === 'dimension').length ?? 0
  const aggTables = schema?.tables.filter((t) => t.type === 'aggregate').length ?? 0
  const viewCount = schema?.views.length ?? 0
  const columnCount = schema?.tables.reduce((sum, t) => sum + t.columns.length, 0) ?? 0
  const gapModuleCount = gaps?.modules.length ?? 0
  const extTableCount = gaps?.modules.reduce((sum, m) => sum + m.tableCount, 0) ?? 0

  const statItems = [
    { label: 'Fact', value: factTables, icon: Box },
    { label: 'Dimensions', value: dimTables, icon: Table2 },
    { label: 'Aggregates', value: aggTables, icon: Activity },
    { label: 'Views', value: viewCount, icon: Layers },
    { label: 'Columns', value: columnCount, icon: Database },
    { label: 'Gap Modules', value: gapModuleCount, icon: Columns3 },
    { label: 'Extension Tables', value: extTableCount, icon: Heart },
  ]

  const downloadData = () => {
    const blob = new Blob([JSON.stringify({
      schema,
      gaps,
      stats: { factTables, dimTables, aggTables, viewCount, columnCount, gapModuleCount, extTableCount },
    }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `haiw-analytics-schema-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <Activity size={22} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Health Analytics Engine</h2>
          <p className="text-xs text-slate-400">Star schema, dimensions, gap extensions, and analytical views</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-lg shadow-sm px-5 py-3 flex items-center gap-1 text-sm text-slate-600 flex-wrap">
        {statItems.map((s, i) => (
          <span key={s.label} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-300 mx-1.5">|</span>}
            <s.icon size={12} className="text-emerald-500" />
            <span className="font-bold text-emerald-700">{s.value}</span>
            <span className="text-slate-500">{s.label}</span>
          </span>
        ))}
        <div className="flex-1" />
        <button
          onClick={downloadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-white border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition"
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
                  ? 'bg-emerald-600 text-white shadow-sm'
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
        {activeTab === 'dimensions' && schema && <DimensionsExplorer schema={schema} />}
        {activeTab === 'gaps' && gaps && (
          <GapExtensionsTab data={gaps} navigate={navigate} onSchemaTableClick={handleSchemaTableClick} />
        )}
        {activeTab === 'views' && schema && <ViewsAndAggregates schema={schema} />}
      </div>
    </div>
  )
}
