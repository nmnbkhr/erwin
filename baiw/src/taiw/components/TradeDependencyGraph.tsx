import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid3x3, Table2, Info, X, Maximize2, AlertTriangle,
  ArrowUpDown, ChevronDown, Filter, Download,
} from 'lucide-react'
import { downloadJSON } from '../utils/export'
import {
  loadCapabilities, loadMappings, loadDomains, loadDependencies,
} from '../data'
import type {
  TaiwCapability, TaiwMapping, TaiwDomain, TaiwDependency,
} from '../types'

/* ── Types ──────────────────────────────────────────────────────────── */
interface CellDetail {
  theme: string
  domain: string
  count: number
  capabilities: { id: string; sub: string; elements: string[] }[]
}

type ViewMode = 'heatmap' | 'table'
type SortKey = 'sub' | 'theme' | 'elementCount' | 'domainCount' | 'priority'
type SortDir = 'asc' | 'desc'

/* ── Theme dot color map (Tailwind classes) ─────────────────────────── */
const THEME_DOT: Record<string, string> = {
  amber:   'bg-amber-500',
  red:     'bg-red-500',
  blue:    'bg-blue-500',
  violet:  'bg-violet-500',
  emerald: 'bg-emerald-500',
  indigo:  'bg-indigo-500',
}

/* ── Priority badge styles ──────────────────────────────────────────── */
const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH:     'bg-amber-100 text-amber-700 border-amber-200',
  MEDIUM:   'bg-teal-100 text-teal-700 border-teal-200',
  LOW:      'bg-slate-100 text-slate-600 border-slate-200',
}

const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3,
}

/* ── Heatmap color scale ────────────────────────────────────────────── */
function heatColor(value: number, max: number): string {
  if (value === 0) return 'bg-slate-50'
  const ratio = value / Math.max(max, 1)
  if (ratio > 0.7) return 'bg-teal-600 text-white'
  if (ratio > 0.45) return 'bg-teal-400 text-white'
  if (ratio > 0.25) return 'bg-teal-300 text-teal-900'
  if (ratio > 0.1) return 'bg-teal-200 text-teal-800'
  return 'bg-teal-100 text-teal-700'
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function TradeDependencyGraph() {
  const navigate = useNavigate()

  /* state */
  const [capabilities, setCapabilities] = useState<TaiwCapability[]>([])
  const [mappings, setMappings] = useState<TaiwMapping[]>([])
  const [domains, setDomains] = useState<TaiwDomain[]>([])
  const [dependencies, setDependencies] = useState<Record<string, TaiwDependency>>({})
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<ViewMode>('heatmap')
  const [cellDetail, setCellDetail] = useState<CellDetail | null>(null)
  const [p1Highlight, setP1Highlight] = useState(false)

  /* table state */
  const [sortKey, setSortKey] = useState<SortKey>('sub')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [themeFilter, setThemeFilter] = useState<string>('all')

  /* ── Load data ─────────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      loadCapabilities(),
      loadMappings(),
      loadDomains(),
      loadDependencies(),
    ]).then(([caps, maps, doms, deps]) => {
      setCapabilities(caps)
      setMappings(maps)
      setDomains(doms)
      setDependencies(deps)
      setLoading(false)
    })
  }, [])

  /* ── Derived: theme list ───────────────────────────────────────── */
  const themes = useMemo(() => {
    const seen = new Map<string, string>()
    capabilities.forEach(c => {
      if (!seen.has(c.theme)) seen.set(c.theme, c.themeColor)
    })
    return Array.from(seen.entries()).map(([name, color]) => ({ name, color }))
  }, [capabilities])

  /* ── Derived: capability id→theme lookup ───────────────────────── */
  const capIdToTheme = useMemo(() => {
    const map = new Map<string, string>()
    capabilities.forEach(c => map.set(c.id, c.theme))
    return map
  }, [capabilities])

  /* ── Derived: capability id→cap lookup ─────────────────────────── */
  const capById = useMemo(() => {
    const map = new Map<string, TaiwCapability>()
    capabilities.forEach(c => map.set(c.id, c))
    return map
  }, [capabilities])

  /* ── Derived: critical capability ids ──────────────────────────── */
  const criticalIds = useMemo(
    () => new Set(capabilities.filter(c => c.priority === 'CRITICAL').map(c => c.id)),
    [capabilities],
  )

  /* ── Heatmap matrix from mappings ──────────────────────────────── */
  const { matrix, maxVal, capsByThemeDomain } = useMemo(() => {
    const mat: Record<string, Record<string, number>> = {}
    const detail: Record<string, Record<string, Map<string, string[]>>> = {}

    // Initialize
    themes.forEach(t => {
      mat[t.name] = {}
      detail[t.name] = {}
      domains.forEach(d => {
        mat[t.name][d.name] = 0
        detail[t.name][d.name] = new Map()
      })
    })

    // Count mappings per theme-domain pair
    mappings.forEach(m => {
      const theme = capIdToTheme.get(m.capability)
      if (!theme || !mat[theme] || mat[theme][m.domain] === undefined) return
      mat[theme][m.domain]++
      // Track which capabilities and elements are in each cell
      const cellMap = detail[theme]?.[m.domain]
      if (cellMap) {
        const existing = cellMap.get(m.capability)
        if (existing) {
          existing.push(m.element)
        } else {
          cellMap.set(m.capability, [m.element])
        }
      }
    })

    // Convert detail maps to arrays
    const detailArrays: Record<string, Record<string, { id: string; sub: string; elements: string[] }[]>> = {}
    themes.forEach(t => {
      detailArrays[t.name] = {}
      domains.forEach(d => {
        const cellMap = detail[t.name]?.[d.name]
        if (cellMap) {
          detailArrays[t.name][d.name] = Array.from(cellMap.entries()).map(([capId, elems]) => ({
            id: capId,
            sub: capById.get(capId)?.sub ?? capId,
            elements: elems,
          }))
        } else {
          detailArrays[t.name][d.name] = []
        }
      })
    })

    let max = 0
    Object.values(mat).forEach(row => {
      Object.values(row).forEach(v => { if (v > max) max = v })
    })

    return { matrix: mat, maxVal: max, capsByThemeDomain: detailArrays }
  }, [mappings, themes, domains, capIdToTheme, capById])

  /* ── Summary stats ─────────────────────────────────────────────── */
  const totalElementDeps = useMemo(() => {
    let sum = 0
    Object.values(dependencies).forEach(d => { sum += d.elementCount })
    return sum
  }, [dependencies])

  /* ── Heatmap: which themes touch CRITICAL caps ─────────────────── */
  const criticalThemeDomains = useMemo(() => {
    const set = new Set<string>()
    mappings.forEach(m => {
      if (criticalIds.has(m.capability)) {
        const theme = capIdToTheme.get(m.capability)
        if (theme) set.add(`${theme}||${m.domain}`)
      }
    })
    return set
  }, [mappings, criticalIds, capIdToTheme])

  /* ── Table data ────────────────────────────────────────────────── */
  const tableRows = useMemo(() => {
    let rows = capabilities.map(cap => {
      const dep = dependencies[cap.id]
      return {
        ...cap,
        elementCount: dep?.elementCount ?? 0,
        domainCount: dep?.domainCount ?? 0,
      }
    })

    // Filter
    if (themeFilter !== 'all') {
      rows = rows.filter(r => r.theme === themeFilter)
    }

    // Sort
    rows.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'sub':
          cmp = a.sub.localeCompare(b.sub); break
        case 'theme':
          cmp = a.theme.localeCompare(b.theme); break
        case 'elementCount':
          cmp = a.elementCount - b.elementCount; break
        case 'domainCount':
          cmp = a.domainCount - b.domainCount; break
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return rows
  }, [capabilities, dependencies, themeFilter, sortKey, sortDir])

  /* ── Sort handler ──────────────────────────────────────────────── */
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  /* ── Cell click ────────────────────────────────────────────────── */
  const handleCellClick = (theme: string, domain: string) => {
    const count = matrix[theme]?.[domain] ?? 0
    if (count === 0) return
    const caps = capsByThemeDomain[theme]?.[domain] ?? []
    setCellDetail({ theme, domain, count, capabilities: caps })
  }

  /* ── Loading skeleton ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 h-20 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm h-96 animate-pulse" />
      </div>
    )
  }

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* ─── Stats Summary ─────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-center gap-6 text-sm">
        <span className="font-semibold text-slate-700">
          {mappings.length.toLocaleString()} <span className="font-normal text-slate-500">Mappings</span>
        </span>
        <span className="text-slate-300">|</span>
        <span className="font-semibold text-slate-700">
          {capabilities.length.toLocaleString()} <span className="font-normal text-slate-500">Capabilities</span>
        </span>
        <span className="text-slate-300">|</span>
        <span className="font-semibold text-slate-700">
          {domains.length.toLocaleString()} <span className="font-normal text-slate-500">Domains</span>
        </span>
        <span className="text-slate-300">|</span>
        <span className="font-semibold text-slate-700">
          {totalElementDeps.toLocaleString()} <span className="font-normal text-slate-500">Element Dependencies</span>
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export JSON */}
        <button
          onClick={() => downloadJSON({
            matrix,
            themes: themes.map(t => t.name),
            domains: domains.map(d => d.name),
            dependencies,
            mappingCount: mappings.length,
          }, `taiw-dependency-matrix-${new Date().toISOString().slice(0, 10)}.json`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-white border-slate-200 text-slate-500 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition"
        >
          <Download size={13} />
          Export JSON
        </button>

        {/* P1 Highlight toggle */}
        <button
          onClick={() => setP1Highlight(h => !h)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
            p1Highlight
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle size={13} />
          P1 Highlight
        </button>

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setView('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              view === 'heatmap' ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Grid3x3 size={13} /> Heatmap
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              view === 'table' ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Table2 size={13} /> Table
          </button>
        </div>
      </div>

      {/* ─── Heatmap View ──────────────────────────────────────── */}
      {view === 'heatmap' && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3x3 size={16} className="text-teal-500" />
              <h2 className="text-sm font-semibold text-slate-700">
                TCF Themes vs WCO Domains Heatmap
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <Info size={14} />
              <span>Click a cell to view capabilities and elements</span>
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 text-slate-600 font-semibold w-[200px] min-w-[200px] sticky left-0 bg-white z-10">
                    Theme / Domain
                  </th>
                  {domains.map(d => (
                    <th
                      key={d.slug}
                      className="p-1 text-center font-medium text-slate-600 min-w-[70px] cursor-pointer hover:bg-teal-50 transition-colors"
                      onClick={() => navigate(`/taiw/model?domain=${encodeURIComponent(d.name)}`)}
                      title={`View ${d.name} domain model`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="block whitespace-nowrap origin-bottom-left text-xs"
                          style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }}
                        >
                          {d.name}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="p-2 text-center font-semibold text-slate-700 min-w-[50px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {themes.map(theme => {
                  const row = matrix[theme.name] || {}
                  const rowTotal = Object.values(row).reduce((s, v) => s + v, 0)
                  return (
                    <tr key={theme.name} className="border-t border-slate-100">
                      <td
                        className="p-2 font-medium text-slate-700 sticky left-0 bg-white z-10 cursor-pointer hover:bg-teal-50 transition-colors"
                        onClick={() => navigate(`/taiw/capabilities?theme=${encodeURIComponent(theme.name)}`)}
                        title={`View ${theme.name} capabilities`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${THEME_DOT[theme.color] || 'bg-slate-400'}`} />
                          <span className="truncate">{theme.name}</span>
                        </div>
                      </td>
                      {domains.map(d => {
                        const val = row[d.name] || 0
                        const isCriticalCell = p1Highlight && criticalThemeDomains.has(`${theme.name}||${d.name}`)
                        return (
                          <td
                            key={d.slug}
                            onClick={() => handleCellClick(theme.name, d.name)}
                            title={val > 0 ? `${theme.name} x ${d.name}: ${val} mapping${val > 1 ? 's' : ''} — click for details` : `${theme.name} x ${d.name}: no mappings`}
                            className={`p-2 text-center cursor-pointer transition-all hover:ring-2 hover:ring-teal-400 hover:ring-inset rounded ${heatColor(val, maxVal)} ${
                              isCriticalCell ? 'ring-2 ring-red-500 ring-inset' : ''
                            }`}
                          >
                            {val > 0 ? val : ''}
                          </td>
                        )
                      })}
                      <td className="p-2 text-center font-semibold text-slate-700 bg-slate-50">
                        {rowTotal}
                      </td>
                    </tr>
                  )
                })}
                {/* Column totals */}
                <tr className="border-t-2 border-slate-200">
                  <td className="p-2 font-semibold text-slate-700 sticky left-0 bg-white z-10">Total</td>
                  {domains.map(d => {
                    const colTotal = themes.reduce((s, t) => s + (matrix[t.name]?.[d.name] || 0), 0)
                    return (
                      <td key={d.slug} className="p-2 text-center font-semibold text-slate-700 bg-slate-50">
                        {colTotal > 0 ? colTotal : ''}
                      </td>
                    )
                  })}
                  <td className="p-2 text-center font-bold text-teal-700 bg-teal-50">
                    {mappings.length}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-4 pb-4 flex items-center gap-4 text-xs text-slate-500">
            <span>Intensity:</span>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-slate-50 border border-slate-200" /> 0
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-teal-100" /> Low
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-teal-300" /> Mid
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-teal-600" /> High
            </div>
            {p1Highlight && (
              <>
                <span className="ml-2 text-slate-300">|</span>
                <div className="flex items-center gap-1">
                  <span className="w-5 h-4 rounded border-2 border-red-500 bg-white" /> CRITICAL
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Table View ────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="bg-white rounded-lg shadow-sm">
          {/* Table toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Table2 size={16} className="text-teal-500" />
              <h2 className="text-sm font-semibold text-slate-700">Capability Dependencies</h2>
              <span className="text-xs text-slate-400 ml-2">
                {tableRows.length} of {capabilities.length} capabilities
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-slate-400" />
              <div className="relative">
                <select
                  value={themeFilter}
                  onChange={e => setThemeFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 pr-7 bg-white text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="all">All Themes</option>
                  {themes.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {([
                    ['sub', 'Capability'],
                    ['theme', 'Theme'],
                    ['elementCount', 'Elements'],
                    ['domainCount', 'Domains'],
                    ['priority', 'Priority'],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="p-3 text-left font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        {label}
                        <ArrowUpDown size={11} className={`${sortKey === key ? 'text-teal-600' : 'text-slate-300'}`} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map(row => {
                  const isCritical = row.priority === 'CRITICAL'
                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/taiw/capabilities?cap=${encodeURIComponent(row.id)}`)}
                      className={`border-b border-slate-100 cursor-pointer transition hover:bg-slate-50 ${
                        p1Highlight && isCritical ? 'bg-red-50/50' : ''
                      }`}
                      title={`View ${row.sub} capability details`}
                    >
                      <td className="p-3 font-medium text-slate-700 max-w-[280px] truncate">
                        {row.sub}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${THEME_DOT[row.themeColor] || 'bg-slate-400'}`} />
                          <span className="text-slate-600 truncate max-w-[180px]">{row.theme}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium tabular-nums">{row.elementCount}</td>
                      <td className="p-3 text-slate-600 font-medium tabular-nums">{row.domainCount}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${PRIORITY_STYLE[row.priority] || PRIORITY_STYLE.LOW}`}>
                          {row.priority}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Cell Detail Modal ─────────────────────────────────── */}
      {cellDetail && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setCellDetail(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Maximize2 size={14} className="text-teal-500" />
                  {cellDetail.theme}
                  <span className="text-slate-400 font-normal">x</span>
                  {cellDetail.domain}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {cellDetail.count} mappings | {cellDetail.capabilities.length} capabilities
                </p>
              </div>
              <button
                onClick={() => setCellDetail(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cellDetail.capabilities.map(cap => {
                const capData = capById.get(cap.id)
                return (
                  <div key={cap.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-slate-700">{cap.sub}</p>
                      {capData && (
                        <span className={`px-1.5 py-0.5 text-[11px] font-semibold rounded border ${PRIORITY_STYLE[capData.priority] || PRIORITY_STYLE.LOW}`}>
                          {capData.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cap.elements.map((el, idx) => (
                        <span
                          key={`${el}-${idx}`}
                          className="px-2 py-0.5 text-xs rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono"
                        >
                          {el}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
              {cellDetail.capabilities.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  No detailed capability data available for this cell.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
