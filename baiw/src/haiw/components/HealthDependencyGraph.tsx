import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  GitBranch, Grid3x3, Workflow, Filter, X, ChevronDown,
  Layers, Target, Link2, BarChart3, Info,
} from 'lucide-react'
import { loadCapabilities, loadFhirResources, loadDependencies, loadResourceCategories } from '../data'
import type { HaiwCapability, HaiwFhirResource, HaiwDependencyEntry, HaiwResourceCategory } from '../types'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ViewMode = 'matrix' | 'chord'
type Strength = 'critical' | 'important' | 'optional'

interface CellDetail {
  capabilityId: string
  capabilityName: string
  categoryId: number
  categoryName: string
  resources: { id: string; name: string; strength: string }[]
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STRENGTH_COLORS: Record<string, string> = {
  critical: 'bg-emerald-600 text-white',
  important: 'bg-emerald-400 text-white',
  optional: 'bg-emerald-200 text-emerald-800',
}

const STRENGTH_BORDER: Record<string, string> = {
  critical: 'border-emerald-600',
  important: 'border-emerald-400',
  optional: 'border-emerald-200',
}

const THEME_COLORS: Record<number, string> = {
  1: '#059669', // emerald-600
  2: '#10b981', // emerald-500
  3: '#34d399', // emerald-400
  4: '#6ee7b7', // emerald-300
  5: '#a7f3d0', // emerald-200
  6: '#d1fae5', // emerald-100
}

const CATEGORY_COLORS = [
  '#065f46', '#047857', '#059669', '#10b981',
  '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5',
  '#ecfdf5', '#064e3b', '#0d9488', '#14b8a6',
]

function intensityClass(count: number, max: number): string {
  if (count === 0) return 'bg-slate-50'
  const ratio = count / Math.max(max, 1)
  if (ratio > 0.75) return 'bg-emerald-600 text-white'
  if (ratio > 0.5) return 'bg-emerald-500 text-white'
  if (ratio > 0.25) return 'bg-emerald-300 text-emerald-900'
  return 'bg-emerald-100 text-emerald-800'
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HealthDependencyGraph() {
  /* ---------- state ---------- */
  const [capabilities, setCapabilities] = useState<HaiwCapability[]>([])
  const [resources, setResources] = useState<HaiwFhirResource[]>([])
  const [dependencies, setDependencies] = useState<Record<string, HaiwDependencyEntry>>({})
  const [categories, setCategories] = useState<HaiwResourceCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [viewMode, setViewMode] = useState<ViewMode>('matrix')
  const [selectedCell, setSelectedCell] = useState<CellDetail | null>(null)
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [filterTheme, setFilterTheme] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStrength, setFilterStrength] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  /* ---------- load data ---------- */
  useEffect(() => {
    Promise.all([
      loadCapabilities(),
      loadFhirResources(),
      loadDependencies(),
      loadResourceCategories(),
    ]).then(([caps, res, deps, cats]) => {
      setCapabilities(caps)
      setResources(res)
      setDependencies(deps)
      setCategories(cats)
      setLoading(false)
    })
  }, [])

  /* ---------- derived ---------- */
  const themes = useMemo(() => {
    const map = new Map<string, { id: number; name: string; color: string }>()
    capabilities.forEach(c => {
      if (!map.has(c.theme)) map.set(c.theme, { id: c.themeId, name: c.theme, color: c.themeColor })
    })
    return Array.from(map.values()).sort((a, b) => a.id - b.id)
  }, [capabilities])

  const resourceByName = useMemo(() => {
    const m = new Map<string, HaiwFhirResource>()
    resources.forEach(r => m.set(r.name, r))
    return m
  }, [resources])

  const filteredCapabilities = useMemo(() => {
    let caps = capabilities
    if (filterTheme !== 'all') caps = caps.filter(c => c.theme === filterTheme)
    if (filterStrength !== 'all') {
      caps = caps.filter(c => {
        const dep = dependencies[c.id]
        if (!dep) return false
        return dep.dependencies.some(d => d.strength === filterStrength)
      })
    }
    return caps
  }, [capabilities, filterTheme, filterStrength, dependencies])

  const filteredCategories = useMemo(() => {
    if (filterCategory === 'all') return categories
    return categories.filter(c => c.name === filterCategory)
  }, [categories, filterCategory])

  /* Build matrix data: capability × category → resources */
  const matrixData = useMemo(() => {
    const data = new Map<string, Map<number, { id: string; name: string; strength: string }[]>>()
    let maxCount = 0

    filteredCapabilities.forEach(cap => {
      const dep = dependencies[cap.id]
      if (!dep) return
      const row = new Map<number, { id: string; name: string; strength: string }[]>()
      dep.dependencies.forEach(d => {
        if (filterStrength !== 'all' && d.strength !== filterStrength) return
        const res = resourceByName.get(d.resourceName)
        if (!res) return
        if (filterCategory !== 'all' && res.category !== filterCategory) return
        const catId = res.categoryId
        if (!row.has(catId)) row.set(catId, [])
        row.get(catId)!.push({ id: d.resourceId, name: d.resourceName, strength: d.strength })
      })
      row.forEach(v => { if (v.length > maxCount) maxCount = v.length })
      data.set(cap.id, row)
    })

    return { data, maxCount }
  }, [filteredCapabilities, dependencies, resourceByName, filterCategory, filterStrength])

  /* Stats */
  const stats = useMemo(() => {
    const totalDeps = Object.values(dependencies).reduce((s, d) => s + d.dependencies.length, 0)
    const capCount = capabilities.length
    return {
      capabilities: capCount,
      resources: resources.length,
      dependencies: totalDeps,
      avgDeps: capCount > 0 ? (totalDeps / capCount).toFixed(1) : '0',
    }
  }, [capabilities, resources, dependencies])

  /* Chord data: theme → category connections */
  const chordData = useMemo(() => {
    const links: { themeId: number; theme: string; catId: number; category: string; count: number; strength: string }[] = []
    const linkMap = new Map<string, { themeId: number; theme: string; catId: number; category: string; count: number; strengths: Set<string> }>()

    filteredCapabilities.forEach(cap => {
      const dep = dependencies[cap.id]
      if (!dep) return
      dep.dependencies.forEach(d => {
        if (filterStrength !== 'all' && d.strength !== filterStrength) return
        const res = resourceByName.get(d.resourceName)
        if (!res) return
        if (filterCategory !== 'all' && res.category !== filterCategory) return
        const key = `${cap.themeId}-${res.categoryId}`
        if (!linkMap.has(key)) {
          linkMap.set(key, { themeId: cap.themeId, theme: cap.theme, catId: res.categoryId, category: res.category, count: 0, strengths: new Set() })
        }
        const entry = linkMap.get(key)!
        entry.count++
        entry.strengths.add(d.strength)
      })
    })

    linkMap.forEach(v => {
      const dominantStrength = v.strengths.has('critical') ? 'critical' : v.strengths.has('important') ? 'important' : 'optional'
      links.push({ themeId: v.themeId, theme: v.theme, catId: v.catId, category: v.category, count: v.count, strength: dominantStrength })
    })

    return links.sort((a, b) => b.count - a.count)
  }, [filteredCapabilities, dependencies, resourceByName, filterCategory, filterStrength])

  /* Highlight helpers */
  const highlightedCategories = useMemo(() => {
    if (!selectedCapability) return new Set<number>()
    const dep = dependencies[selectedCapability]
    if (!dep) return new Set<number>()
    const catIds = new Set<number>()
    dep.dependencies.forEach(d => {
      const res = resourceByName.get(d.resourceName)
      if (res) catIds.add(res.categoryId)
    })
    return catIds
  }, [selectedCapability, dependencies, resourceByName])

  const highlightedCapabilities = useMemo(() => {
    if (selectedCategory === null) return new Set<string>()
    const capIds = new Set<string>()
    Object.entries(dependencies).forEach(([capId, dep]) => {
      dep.dependencies.forEach(d => {
        const res = resourceByName.get(d.resourceName)
        if (res && res.categoryId === selectedCategory) capIds.add(capId)
      })
    })
    return capIds
  }, [selectedCategory, dependencies, resourceByName])

  const handleCapabilityClick = useCallback((capId: string) => {
    setSelectedCategory(null)
    setSelectedCapability(prev => prev === capId ? null : capId)
  }, [])

  const handleCategoryClick = useCallback((catId: number) => {
    setSelectedCapability(null)
    setSelectedCategory(prev => prev === catId ? null : catId)
  }, [])

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading dependency graph...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <GitBranch className="text-emerald-600" size={24} />
            </div>
            Dependency Graph
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Relationships between HCF capabilities and FHIR resources
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'matrix'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Grid3x3 size={16} />
            Matrix View
          </button>
          <button
            onClick={() => setViewMode('chord')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'chord'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Workflow size={16} />
            Flow View
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Capabilities', value: stats.capabilities, icon: Target, color: 'emerald' },
          { label: 'FHIR Resources', value: stats.resources, icon: Layers, color: 'emerald' },
          { label: 'Dependencies', value: stats.dependencies, icon: Link2, color: 'emerald' },
          { label: 'Avg per Capability', value: stats.avgDeps, icon: BarChart3, color: 'emerald' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <s.icon size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors rounded-xl"
        >
          <span className="flex items-center gap-2">
            <Filter size={16} className="text-emerald-600" />
            Filters
            {(filterTheme !== 'all' || filterCategory !== 'all' || filterStrength !== 'all') && (
              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">Active</span>
            )}
          </span>
          <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="px-5 pb-4 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            {/* Theme filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">HCF Theme</label>
              <select
                value={filterTheme}
                onChange={e => setFilterTheme(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Themes</option>
                {themes.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">FHIR Category</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Strength filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dependency Strength</label>
              <select
                value={filterStrength}
                onChange={e => setFilterStrength(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Strengths</option>
                <option value="critical">Critical</option>
                <option value="important">Important</option>
                <option value="optional">Optional</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {(selectedCapability || selectedCategory !== null) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          <Info size={14} />
          <span>
            {selectedCapability
              ? `Highlighting FHIR categories used by: ${capabilities.find(c => c.id === selectedCapability)?.name ?? selectedCapability}`
              : `Highlighting capabilities using: ${categories.find(c => c.id === selectedCategory)?.name ?? 'Unknown'}`}
          </span>
          <button
            onClick={() => { setSelectedCapability(null); setSelectedCategory(null) }}
            className="ml-auto p-1 hover:bg-emerald-100 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main visualization */}
      {viewMode === 'matrix' ? (
        <MatrixView
          capabilities={filteredCapabilities}
          categories={filteredCategories}
          matrixData={matrixData}
          selectedCapability={selectedCapability}
          selectedCategory={selectedCategory}
          highlightedCategories={highlightedCategories}
          highlightedCapabilities={highlightedCapabilities}
          onCapabilityClick={handleCapabilityClick}
          onCategoryClick={handleCategoryClick}
          onCellClick={setSelectedCell}
        />
      ) : (
        <ChordView
          themes={themes}
          categories={filteredCategories}
          chordData={chordData}
          selectedCapability={selectedCapability}
          selectedCategory={selectedCategory}
        />
      )}

      {/* Cell detail modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedCell(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Dependency Detail</h3>
              <button onClick={() => setSelectedCell(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Capability</p>
                <p className="text-sm font-medium text-slate-800">{selectedCell.capabilityName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Category</p>
                <p className="text-sm font-medium text-slate-800">{selectedCell.categoryName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Resources ({selectedCell.resources.length})
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedCell.resources.map(r => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border ${STRENGTH_BORDER[r.strength] ?? 'border-slate-200'}`}
                    >
                      <span className="text-sm text-slate-700">{r.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STRENGTH_COLORS[r.strength] ?? 'bg-slate-100 text-slate-600'}`}>
                        {r.strength}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium">Intensity:</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-emerald-100" />
              <span className="text-xs text-slate-500">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-emerald-300" />
              <span className="text-xs text-slate-500">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-emerald-500" />
              <span className="text-xs text-slate-500">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded bg-emerald-600" />
              <span className="text-xs text-slate-500">Very High</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium">Strength:</span>
            {(['critical', 'important', 'optional'] as const).map(s => (
              <div key={s} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded-full ${s === 'critical' ? 'bg-emerald-600' : s === 'important' ? 'bg-emerald-400' : 'bg-emerald-200'}`} />
                <span className="text-xs text-slate-500 capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Matrix View                                                        */
/* ================================================================== */

function MatrixView({
  capabilities, categories, matrixData, selectedCapability, selectedCategory,
  highlightedCategories, highlightedCapabilities, onCapabilityClick, onCategoryClick, onCellClick,
}: {
  capabilities: HaiwCapability[]
  categories: HaiwResourceCategory[]
  matrixData: { data: Map<string, Map<number, { id: string; name: string; strength: string }[]>>; maxCount: number }
  selectedCapability: string | null
  selectedCategory: number | null
  highlightedCategories: Set<number>
  highlightedCapabilities: Set<string>
  onCapabilityClick: (id: string) => void
  onCategoryClick: (id: number) => void
  onCellClick: (detail: CellDetail) => void
}) {
  if (capabilities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
        No capabilities match the current filters.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 min-w-[220px]">
                Capability
              </th>
              {categories.map(cat => (
                <th
                  key={cat.id}
                  onClick={() => onCategoryClick(cat.id)}
                  className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider border-b border-slate-200 min-w-[90px] cursor-pointer transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-100 text-emerald-800'
                      : highlightedCategories.has(cat.id)
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-50 text-slate-500 hover:bg-emerald-50'
                  }`}
                  title={cat.description}
                >
                  <div className="truncate max-w-[80px] mx-auto">{cat.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capabilities.map((cap, i) => {
              const row = matrixData.data.get(cap.id)
              const isSelected = selectedCapability === cap.id
              const isHighlighted = highlightedCapabilities.has(cap.id)

              return (
                <tr
                  key={cap.id}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-emerald-50'
                      : isHighlighted
                        ? 'bg-emerald-50/50'
                        : i % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/30'
                  }`}
                >
                  <td
                    onClick={() => onCapabilityClick(cap.id)}
                    className={`sticky left-0 z-10 px-4 py-2.5 border-r border-slate-200 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-100 font-semibold text-emerald-800' : isHighlighted ? 'bg-emerald-50 text-emerald-700' : 'bg-white hover:bg-emerald-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cap.themeColor || THEME_COLORS[cap.themeId] || '#059669' }}
                      />
                      <span className="truncate text-xs">{cap.name}</span>
                    </div>
                  </td>
                  {categories.map(cat => {
                    const cellResources = row?.get(cat.id) ?? []
                    const count = cellResources.length
                    return (
                      <td
                        key={cat.id}
                        onClick={() => {
                          if (count > 0) {
                            onCellClick({
                              capabilityId: cap.id,
                              capabilityName: cap.name,
                              categoryId: cat.id,
                              categoryName: cat.name,
                              resources: cellResources,
                            })
                          }
                        }}
                        className={`px-1 py-1 text-center border-slate-100 border transition-colors ${
                          count > 0 ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:ring-inset' : ''
                        } ${intensityClass(count, matrixData.maxCount)}`}
                        title={count > 0 ? `${cap.name} → ${cat.name}: ${count} resource(s)` : ''}
                      >
                        {count > 0 && <span className="text-xs font-medium">{count}</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Chord / Flow View                                                  */
/* ================================================================== */

function ChordView({
  themes, categories, chordData, selectedCapability, selectedCategory,
}: {
  themes: { id: number; name: string; color: string }[]
  categories: HaiwResourceCategory[]
  chordData: { themeId: number; theme: string; catId: number; category: string; count: number; strength: string }[]
  selectedCapability: string | null
  selectedCategory: number | null
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  const leftItems = themes
  const rightItems = categories

  const svgWidth = 900
  const svgHeight = Math.max(leftItems.length, rightItems.length) * 60 + 80
  const leftX = 180
  const rightX = svgWidth - 180
  const barHeight = 36
  const barGap = 12

  const leftStartY = 40
  const rightStartY = 40

  const maxCount = Math.max(...chordData.map(d => d.count), 1)

  /* Compute totals for bar widths */
  const themeTotals = new Map<number, number>()
  const catTotals = new Map<number, number>()
  chordData.forEach(d => {
    themeTotals.set(d.themeId, (themeTotals.get(d.themeId) ?? 0) + d.count)
    catTotals.set(d.catId, (catTotals.get(d.catId) ?? 0) + d.count)
  })
  const maxThemeTotal = Math.max(...Array.from(themeTotals.values()), 1)
  const maxCatTotal = Math.max(...Array.from(catTotals.values()), 1)

  if (chordData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
        No dependency connections match the current filters.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
      <div className="flex items-center gap-4 mb-4 px-2">
        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">HCF Themes</span>
        <div className="flex-1 border-t border-dashed border-emerald-200" />
        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">FHIR Categories</span>
      </div>

      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto"
      >
        {/* Connection lines */}
        {chordData.map((d, i) => {
          const leftIdx = leftItems.findIndex(t => t.id === d.themeId)
          const rightIdx = rightItems.findIndex(c => c.id === d.catId)
          if (leftIdx < 0 || rightIdx < 0) return null

          const y1 = leftStartY + leftIdx * (barHeight + barGap) + barHeight / 2
          const y2 = rightStartY + rightIdx * (barHeight + barGap) + barHeight / 2
          const strokeWidth = Math.max(1.5, (d.count / maxCount) * 10)
          const opacity = d.strength === 'critical' ? 0.5 : d.strength === 'important' ? 0.35 : 0.2

          const cx1 = leftX + 80
          const cx2 = rightX - 80

          return (
            <path
              key={`link-${i}`}
              d={`M ${leftX + 10} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${rightX - 10} ${y2}`}
              fill="none"
              stroke="#059669"
              strokeWidth={strokeWidth}
              opacity={opacity}
              className="transition-opacity hover:opacity-80"
            >
              <title>{`${d.theme} → ${d.category}: ${d.count} dependencies (${d.strength})`}</title>
            </path>
          )
        })}

        {/* Left bars (Themes) */}
        {leftItems.map((theme, i) => {
          const y = leftStartY + i * (barHeight + barGap)
          const total = themeTotals.get(theme.id) ?? 0
          const barW = Math.max(20, (total / maxThemeTotal) * 140)

          return (
            <g key={`theme-${theme.id}`}>
              <rect
                x={leftX - barW}
                y={y}
                width={barW + 10}
                height={barHeight}
                rx={6}
                fill={theme.color || THEME_COLORS[theme.id] || '#059669'}
                opacity={0.85}
                className="transition-opacity hover:opacity-100 cursor-pointer"
              />
              <text
                x={leftX - barW + 8}
                y={y + barHeight / 2}
                dy="0.35em"
                className="text-xs font-medium fill-white pointer-events-none"
                style={{ fontSize: '11px' }}
              >
                {theme.name.length > 22 ? theme.name.slice(0, 20) + '...' : theme.name}
              </text>
              <text
                x={leftX + 16}
                y={y + barHeight / 2}
                dy="0.35em"
                className="fill-slate-400"
                style={{ fontSize: '10px' }}
              >
                {total}
              </text>
            </g>
          )
        })}

        {/* Right bars (Categories) */}
        {rightItems.map((cat, i) => {
          const y = rightStartY + i * (barHeight + barGap)
          const total = catTotals.get(cat.id) ?? 0
          const barW = Math.max(20, (total / maxCatTotal) * 140)
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]

          return (
            <g key={`cat-${cat.id}`}>
              <rect
                x={rightX - 10}
                y={y}
                width={barW + 10}
                height={barHeight}
                rx={6}
                fill={cat.color || color}
                opacity={0.85}
                className="transition-opacity hover:opacity-100 cursor-pointer"
              />
              <text
                x={rightX}
                y={y + barHeight / 2}
                dy="0.35em"
                className="text-xs font-medium fill-white pointer-events-none"
                style={{ fontSize: '11px' }}
              >
                {cat.name.length > 22 ? cat.name.slice(0, 20) + '...' : cat.name}
              </text>
              <text
                x={rightX - 22}
                y={y + barHeight / 2}
                dy="0.35em"
                textAnchor="end"
                className="fill-slate-400"
                style={{ fontSize: '10px' }}
              >
                {total}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
