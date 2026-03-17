import { useState, useEffect, useMemo } from 'react'
import { loadFhirResources, loadResourceCategories, loadCapabilities } from '../data'
import type { HaiwFhirResource, HaiwResourceCategory, HaiwCapability } from '../types'
import {
  Search, ChevronDown, ChevronRight, X, Database,
  Layers, ArrowRight, ArrowLeft, Shield, Info,
} from 'lucide-react'

/* ── Maturity level colors ── */
const maturityColors: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-gray-100',    text: 'text-gray-600',    label: 'Draft' },
  2: { bg: 'bg-yellow-100',  text: 'text-yellow-700',  label: 'Trial Use' },
  3: { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Standard' },
  4: { bg: 'bg-green-100',   text: 'text-green-700',   label: 'Normative' },
  5: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Mature' },
}

/* ── Pakistan relevance badge colors ── */
const relevanceColors: Record<string, string> = {
  high:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-slate-100 text-slate-500 border-slate-200',
}

/* ── Filter state ── */
interface ActiveFilters {
  categories: number[]
  hcdmSubjectAreas: string[]
  maturityLevels: number[]
  pakistanRelevance: string[]
}

const emptyFilters: ActiveFilters = {
  categories: [],
  hcdmSubjectAreas: [],
  maturityLevels: [],
  pakistanRelevance: [],
}

export default function FHIRResourceExplorer() {
  /* ── Data state ── */
  const [resources, setResources] = useState<HaiwFhirResource[]>([])
  const [categories, setCategories] = useState<HaiwResourceCategory[]>([])
  const [capabilities, setCapabilities] = useState<HaiwCapability[]>([])
  const [loading, setLoading] = useState(true)

  /* ── UI state ── */
  const [selectedResource, setSelectedResource] = useState<HaiwFhirResource | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(emptyFilters)
  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  /* ── Load data on mount ── */
  useEffect(() => {
    Promise.all([loadFhirResources(), loadResourceCategories(), loadCapabilities()])
      .then(([res, cats, caps]) => {
        setResources(res)
        setCategories(cats)
        setCapabilities(caps)
        // Open the first category by default
        if (cats.length > 0) setOpenCategories(new Set([cats[0].id]))
      })
      .finally(() => setLoading(false))
  }, [])

  /* ── Derived: unique filter options ── */
  const filterOptions = useMemo(() => {
    const hcdmAreas = [...new Set(resources.map(r => r.hcdmSubjectArea).filter(Boolean))].sort()
    const maturityLevels = [...new Set(resources.map(r => r.maturityLevel))].sort()
    const relevanceLevels = [...new Set(resources.map(r => r.pakistanRelevance?.toLowerCase()).filter(Boolean))].sort()
    return { hcdmAreas, maturityLevels, relevanceLevels }
  }, [resources])

  /* ── Filtered resources ── */
  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return resources.filter(r => {
      // Search filter
      if (q) {
        const matchesName = r.name.toLowerCase().includes(q)
        const matchesDesc = r.description?.toLowerCase().includes(q)
        const matchesElement = r.elements?.some(e => e.name.toLowerCase().includes(q))
        if (!matchesName && !matchesDesc && !matchesElement) return false
      }
      // Category filter
      if (activeFilters.categories.length > 0 && !activeFilters.categories.includes(r.categoryId)) return false
      // HCDM filter
      if (activeFilters.hcdmSubjectAreas.length > 0 && !activeFilters.hcdmSubjectAreas.includes(r.hcdmSubjectArea)) return false
      // Maturity filter
      if (activeFilters.maturityLevels.length > 0 && !activeFilters.maturityLevels.includes(r.maturityLevel)) return false
      // Pakistan relevance filter
      if (activeFilters.pakistanRelevance.length > 0 && !activeFilters.pakistanRelevance.includes(r.pakistanRelevance?.toLowerCase())) return false
      return true
    })
  }, [resources, searchQuery, activeFilters])

  /* ── Resources grouped by category ── */
  const resourcesByCategory = useMemo(() => {
    const map = new Map<number, HaiwFhirResource[]>()
    for (const r of filteredResources) {
      const list = map.get(r.categoryId) || []
      list.push(r)
      map.set(r.categoryId, list)
    }
    return map
  }, [filteredResources])

  /* ── Capabilities that use the selected resource ── */
  const usedByCapabilities = useMemo(() => {
    if (!selectedResource) return []
    return capabilities.filter(c =>
      c.fhirResources?.some(fr => fr.toLowerCase() === selectedResource.name.toLowerCase())
    )
  }, [selectedResource, capabilities])

  /* ── Helpers ── */
  function toggleCategory(id: number) {
    setOpenCategories(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleFilter<K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K][number]) {
    setActiveFilters(prev => {
      const arr = prev[key] as unknown[]
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      return { ...prev, [key]: next }
    })
  }

  function clearFilters() {
    setActiveFilters(emptyFilters)
    setSearchQuery('')
  }

  function navigateToResource(name: string) {
    const r = resources.find(res => res.name.toLowerCase() === name.toLowerCase())
    if (r) {
      setSelectedResource(r)
      setOpenCategories(prev => new Set(prev).add(r.categoryId))
    }
  }

  const hasActiveFilters = activeFilters.categories.length > 0 ||
    activeFilters.hcdmSubjectAreas.length > 0 ||
    activeFilters.maturityLevels.length > 0 ||
    activeFilters.pakistanRelevance.length > 0

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading 157 FHIR R5 resources...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="text-emerald-600" size={26} />
            FHIR Resource Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse {resources.length} FHIR R5 resources across {categories.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-medium">
            {filteredResources.length} resources
          </span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by resource name, description, or element name..."
          className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Filter toggle & chips ── */}
      <div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-emerald-600 transition-colors mb-2"
        >
          <Layers size={14} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">
              {activeFilters.categories.length + activeFilters.hcdmSubjectAreas.length + activeFilters.maturityLevels.length + activeFilters.pakistanRelevance.length}
            </span>
          )}
          {showFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            {/* Category chips */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleFilter('categories', cat.id)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      activeFilters.categories.includes(cat.id)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* HCDM Subject Area chips */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">HCDM Subject Area</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {filterOptions.hcdmAreas.map(area => (
                  <button
                    key={area}
                    onClick={() => toggleFilter('hcdmSubjectAreas', area)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      activeFilters.hcdmSubjectAreas.includes(area)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Maturity level chips */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maturity Level</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {filterOptions.maturityLevels.map(level => {
                  const m = maturityColors[level] || maturityColors[1]
                  return (
                    <button
                      key={level}
                      onClick={() => toggleFilter('maturityLevels', level)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        activeFilters.maturityLevels.includes(level)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : `${m.bg} ${m.text} border-transparent`
                      }`}
                    >
                      {level} - {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pakistan relevance chips */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pakistan Relevance</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {filterOptions.relevanceLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => toggleFilter('pakistanRelevance', level)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors capitalize ${
                      activeFilters.pakistanRelevance.includes(level)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main layout: sidebar + detail ── */}
      <div className="flex gap-4 min-h-[600px]">
        {/* ── Left sidebar: category/resource list ── */}
        <div className="w-[40%] shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {categories.map(cat => {
              const catResources = resourcesByCategory.get(cat.id) || []
              if (catResources.length === 0 && hasActiveFilters) return null
              const isOpen = openCategories.has(cat.id)
              return (
                <div key={cat.id} className="border-b border-slate-100 last:border-b-0">
                  {/* Level 1: Category header */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: cat.color }} />
                    {isOpen ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                    <span className="text-sm font-medium text-slate-700 flex-1">{cat.name}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500 font-medium">
                      {catResources.length}
                    </span>
                  </button>

                  {/* Level 2: Resource list */}
                  {isOpen && (
                    <div className="bg-slate-50/50">
                      {catResources.length === 0 ? (
                        <p className="px-10 py-3 text-xs text-slate-400 italic">No matching resources</p>
                      ) : (
                        catResources.map(r => (
                          <button
                            key={r.id}
                            onClick={() => setSelectedResource(r)}
                            className={`w-full flex items-center gap-2 px-6 py-2.5 text-left transition-colors ${
                              selectedResource?.id === r.id
                                ? 'bg-emerald-50 border-l-3 border-emerald-500'
                                : 'hover:bg-slate-100 border-l-3 border-transparent'
                            }`}
                          >
                            <span className={`text-sm flex-1 ${selectedResource?.id === r.id ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
                              {r.name}
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-200/70 text-slate-500">
                              {r.elementCount} el
                            </span>
                            {r.maturityLevel >= 4 && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Normative/Mature" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right panel: resource detail ── */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
          {!selectedResource ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-20">
              <Database size={48} className="text-slate-300" />
              <p className="text-sm">Select a resource to view details</p>
              <p className="text-xs text-slate-300">Browse categories on the left or use the search bar</p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {/* Detail header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedResource.name}</h2>
                    <p className="text-sm text-slate-500 mt-1">{selectedResource.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Maturity badge */}
                    {(() => {
                      const m = maturityColors[selectedResource.maturityLevel] || maturityColors[1]
                      return (
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${m.bg} ${m.text}`}>
                          Level {selectedResource.maturityLevel} - {m.label}
                        </span>
                      )
                    })()}
                    {/* Pakistan relevance badge */}
                    {selectedResource.pakistanRelevance && (
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium border capitalize ${relevanceColors[selectedResource.pakistanRelevance.toLowerCase()] || relevanceColors.low}`}>
                        {selectedResource.pakistanRelevance} PK
                      </span>
                    )}
                  </div>
                </div>

                {/* Description & Purpose */}
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{selectedResource.description}</p>
                {selectedResource.purpose && (
                  <div className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
                    <Info size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    <span>{selectedResource.purpose}</span>
                  </div>
                )}

                {/* HCDM Subject Area badge */}
                {selectedResource.hcdmSubjectArea && (
                  <div className="mt-3">
                    <span className="px-3 py-1 text-xs rounded-full bg-emerald-600 text-white font-medium">
                      HCDM: {selectedResource.hcdmSubjectArea}
                    </span>
                  </div>
                )}
              </div>

              {/* Elements table */}
              {selectedResource.elements && selectedResource.elements.length > 0 && (
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Layers size={14} className="text-emerald-600" />
                    Elements
                    <span className="text-xs text-slate-400 font-normal">({selectedResource.elements.length})</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Name</th>
                          <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Type</th>
                          <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Card.</th>
                          <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">MS</th>
                          <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResource.elements.map((el, i) => (
                          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-mono text-xs text-emerald-700">{el.name}</td>
                            <td className="px-3 py-2 text-xs text-slate-500">{el.type}</td>
                            <td className="px-3 py-2 text-xs text-slate-500 font-mono">{el.cardinality}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-block w-2.5 h-2.5 rounded-full ${el.mustSupport ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                    title={el.mustSupport ? 'Must Support' : 'Optional'} />
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-500 max-w-xs truncate">{el.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* References: Points to */}
              {selectedResource.references && selectedResource.references.length > 0 && (
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <ArrowRight size={14} className="text-emerald-600" />
                    Points to
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResource.references.map(ref => (
                      <button
                        key={ref}
                        onClick={() => navigateToResource(ref)}
                        className="px-2.5 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        {ref}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* References: Referenced by */}
              {selectedResource.referencedBy && selectedResource.referencedBy.length > 0 && (
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <ArrowLeft size={14} className="text-emerald-600" />
                    Referenced by
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResource.referencedBy.map(ref => (
                      <button
                        key={ref}
                        onClick={() => navigateToResource(ref)}
                        className="px-2.5 py-1 text-xs rounded-full bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {ref}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pakistan Relevance Notes */}
              {selectedResource.pakistanNotes && (
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Shield size={14} className="text-emerald-600" />
                    Pakistan Relevance Notes
                  </h3>
                  <p className="text-sm text-slate-600 bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                    {selectedResource.pakistanNotes}
                  </p>
                </div>
              )}

              {/* Used by Capabilities */}
              {usedByCapabilities.length > 0 && (
                <div className="px-6 py-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Layers size={14} className="text-emerald-600" />
                    Used by Capabilities
                    <span className="text-xs text-slate-400 font-normal">({usedByCapabilities.length})</span>
                  </h3>
                  <div className="space-y-1.5">
                    {usedByCapabilities.map(cap => (
                      <div key={cap.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cap.themeColor || '#10b981' }} />
                        <span className="text-sm text-slate-700 flex-1">{cap.name}</span>
                        <span className="text-[10px] text-slate-400 px-2 py-0.5 bg-white rounded border border-slate-200">
                          {cap.theme}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty capabilities message */}
              {usedByCapabilities.length === 0 && selectedResource && (
                <div className="px-6 py-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Layers size={14} className="text-slate-400" />
                    Used by Capabilities
                  </h3>
                  <p className="text-xs text-slate-400 italic">No capabilities reference this resource directly.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
