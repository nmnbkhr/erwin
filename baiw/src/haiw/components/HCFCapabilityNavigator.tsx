import { useState, useEffect, useMemo } from 'react'
import {
  ChevronDown, ChevronRight, Search, X, Filter,
  Target, BookOpen, Layers, Building2, Lightbulb,
  AlertTriangle, Link2, Gauge,
} from 'lucide-react'
import { loadCapabilities, loadFhirResources } from '../data'
import type { HaiwCapability, HaiwFhirResource } from '../types'

/* ------------------------------------------------------------------ */
/*  Theme color map                                                    */
/* ------------------------------------------------------------------ */
const themeColorMap: Record<number, string> = {
  1: 'emerald',
  2: 'red',
  3: 'blue',
  4: 'violet',
  5: 'teal',
  6: 'indigo',
}

const themeColorClasses: Record<string, { border: string; bg: string; bgLight: string; text: string; badge: string; stripe: string }> = {
  emerald: { border: 'border-emerald-500', bg: 'bg-emerald-600', bgLight: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', stripe: 'bg-emerald-500' },
  red:     { border: 'border-red-500',     bg: 'bg-red-600',     bgLight: 'bg-red-50',     text: 'text-red-700',     badge: 'bg-red-100 text-red-800',     stripe: 'bg-red-500' },
  blue:    { border: 'border-blue-500',    bg: 'bg-blue-600',    bgLight: 'bg-blue-50',    text: 'text-blue-700',    badge: 'bg-blue-100 text-blue-800',    stripe: 'bg-blue-500' },
  violet:  { border: 'border-violet-500',  bg: 'bg-violet-600',  bgLight: 'bg-violet-50',  text: 'text-violet-700',  badge: 'bg-violet-100 text-violet-800',  stripe: 'bg-violet-500' },
  teal:    { border: 'border-teal-500',    bg: 'bg-teal-600',    bgLight: 'bg-teal-50',    text: 'text-teal-700',    badge: 'bg-teal-100 text-teal-800',    stripe: 'bg-teal-500' },
  indigo:  { border: 'border-indigo-500',  bg: 'bg-indigo-600',  bgLight: 'bg-indigo-50',  text: 'text-indigo-700',  badge: 'bg-indigo-100 text-indigo-800',  stripe: 'bg-indigo-500' },
}

/* subject-area chip colors — cycle through a palette */
const subjectAreaColors = [
  'bg-amber-100 text-amber-800',
  'bg-cyan-100 text-cyan-800',
  'bg-pink-100 text-pink-800',
  'bg-lime-100 text-lime-800',
  'bg-fuchsia-100 text-fuchsia-800',
  'bg-orange-100 text-orange-800',
  'bg-sky-100 text-sky-800',
  'bg-rose-100 text-rose-800',
]

const maturityColors: Record<number, string> = {
  1: 'bg-slate-200 text-slate-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-emerald-100 text-emerald-700',
  4: 'bg-violet-100 text-violet-700',
  5: 'bg-amber-100 text-amber-800',
}

/* ------------------------------------------------------------------ */
/*  Hierarchy types                                                    */
/* ------------------------------------------------------------------ */
interface GroupNode {
  groupId: string
  group: string
  capabilities: HaiwCapability[]
}

interface ThemeNode {
  themeId: number
  theme: string
  color: string
  groups: GroupNode[]
  capabilityCount: number
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function HCFCapabilityNavigator() {
  const [capabilities, setCapabilities] = useState<HaiwCapability[]>([])
  const [fhirResources, setFhirResources] = useState<HaiwFhirResource[]>([])
  const [loading, setLoading] = useState(true)

  /* UI state */
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedThemes, setExpandedThemes] = useState<Set<number>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  /* Search & filters */
  const [search, setSearch] = useState('')
  const [filterTheme, setFilterTheme] = useState<number | null>(null)
  const [filterMaturity, setFilterMaturity] = useState<number | null>(null)
  const [filterSubjectArea, setFilterSubjectArea] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  /* ---- load data ------------------------------------------------- */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [caps, res] = await Promise.all([loadCapabilities(), loadFhirResources()])
      if (!cancelled) {
        setCapabilities(caps)
        setFhirResources(res)
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  /* ---- FHIR resource lookup map ---------------------------------- */
  const fhirMap = useMemo(() => {
    const m = new Map<string, HaiwFhirResource>()
    fhirResources.forEach(r => m.set(r.id, r))
    return m
  }, [fhirResources])

  /* ---- unique subject areas -------------------------------------- */
  const allSubjectAreas = useMemo(() => {
    const s = new Set<string>()
    capabilities.forEach(c => c.hcdmSubjectAreas.forEach(sa => s.add(sa)))
    return Array.from(s).sort()
  }, [capabilities])

  /* ---- filtered capabilities ------------------------------------- */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return capabilities.filter(c => {
      if (filterTheme !== null && c.themeId !== filterTheme) return false
      if (filterMaturity !== null && c.maturityLevelRequired !== filterMaturity) return false
      if (filterSubjectArea !== null && !c.hcdmSubjectAreas.includes(filterSubjectArea)) return false
      if (q) {
        const haystack = `${c.name} ${c.description} ${c.fhirResources.join(' ')}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [capabilities, search, filterTheme, filterMaturity, filterSubjectArea])

  /* ---- build tree ------------------------------------------------ */
  const tree: ThemeNode[] = useMemo(() => {
    const themeMap = new Map<number, ThemeNode>()
    filtered.forEach(c => {
      if (!themeMap.has(c.themeId)) {
        themeMap.set(c.themeId, {
          themeId: c.themeId,
          theme: c.theme,
          color: themeColorMap[c.themeId] ?? 'emerald',
          groups: [],
          capabilityCount: 0,
        })
      }
      const node = themeMap.get(c.themeId)!
      node.capabilityCount++
      let grp = node.groups.find(g => g.groupId === c.groupId)
      if (!grp) {
        grp = { groupId: c.groupId, group: c.group, capabilities: [] }
        node.groups.push(grp)
      }
      grp.capabilities.push(c)
    })
    return Array.from(themeMap.values()).sort((a, b) => a.themeId - b.themeId)
  }, [filtered])

  /* ---- auto-expand when search/filter active --------------------- */
  useEffect(() => {
    if (search || filterTheme !== null || filterMaturity !== null || filterSubjectArea !== null) {
      setExpandedThemes(new Set(tree.map(t => t.themeId)))
      setExpandedGroups(new Set(tree.flatMap(t => t.groups.map(g => g.groupId))))
    }
  }, [tree, search, filterTheme, filterMaturity, filterSubjectArea])

  /* ---- selected capability --------------------------------------- */
  const selected = useMemo(
    () => capabilities.find(c => c.id === selectedId) ?? null,
    [capabilities, selectedId],
  )

  /* ---- toggle helpers -------------------------------------------- */
  const toggleTheme = (id: number) => {
    setExpandedThemes(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const clearFilters = () => {
    setFilterTheme(null)
    setFilterMaturity(null)
    setFilterSubjectArea(null)
    setSearch('')
  }

  const hasActiveFilters = filterTheme !== null || filterMaturity !== null || filterSubjectArea !== null || search !== ''

  /* ---- truncate helper ------------------------------------------- */
  const truncate = (s: string, len = 100) => (s.length > len ? s.slice(0, len) + '...' : s)

  /* ---- color helper for capability -------------------------------- */
  const colorOf = (c: HaiwCapability) => themeColorClasses[themeColorMap[c.themeId] ?? 'emerald'] ?? themeColorClasses.emerald

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading HCF Capabilities...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ---------- Header ----------------------------------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-emerald-600" size={26} />
            HCF Capability Navigator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {capabilities.length} capabilities across {tree.length} themes
            {hasActiveFilters && <span className="ml-2 text-emerald-600 font-medium">({filtered.length} shown)</span>}
          </p>
        </div>
      </div>

      {/* ---------- Search & Filter Bar ----------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search capabilities, FHIR resources..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 flex items-center justify-center text-xs bg-emerald-600 text-white rounded-full">
                {[filterTheme, filterMaturity, filterSubjectArea].filter(v => v !== null).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-emerald-600 transition">
              Clear all
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
            {/* Theme filter */}
            <select
              value={filterTheme ?? ''}
              onChange={e => setFilterTheme(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-400 bg-white"
            >
              <option value="">All Themes</option>
              {Array.from(new Map(capabilities.map(c => [c.themeId, c.theme]))).sort((a, b) => a[0] - b[0]).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            {/* Maturity filter */}
            <select
              value={filterMaturity ?? ''}
              onChange={e => setFilterMaturity(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-400 bg-white"
            >
              <option value="">All Maturity Levels</option>
              {[1, 2, 3, 4, 5].map(l => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>

            {/* Subject area filter */}
            <select
              value={filterSubjectArea ?? ''}
              onChange={e => setFilterSubjectArea(e.target.value || null)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-400 bg-white"
            >
              <option value="">All Subject Areas</option>
              {allSubjectAreas.map(sa => (
                <option key={sa} value={sa}>{sa}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ---------- Main two-panel layout --------------------------- */}
      <div className="flex gap-4 items-start">
        {/* ====== Left panel — Collapsible tree ===================== */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all ${selected ? 'w-[45%] min-w-[340px]' : 'w-full'}`}>
          {tree.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Target size={40} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No capabilities match your search / filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[calc(100vh-260px)] overflow-y-auto">
              {tree.map(theme => {
                const tc = themeColorClasses[theme.color] ?? themeColorClasses.emerald
                const isThemeOpen = expandedThemes.has(theme.themeId)
                return (
                  <div key={theme.themeId}>
                    {/* Theme header */}
                    <button
                      onClick={() => toggleTheme(theme.themeId)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
                    >
                      <div className={`w-1 self-stretch rounded-full ${tc.stripe}`} />
                      {isThemeOpen ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-semibold ${tc.text}`}>{theme.theme}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.badge}`}>
                        {theme.capabilityCount}
                      </span>
                    </button>

                    {/* Groups */}
                    {isThemeOpen && (
                      <div className="pl-6">
                        {theme.groups.map(group => {
                          const isGroupOpen = expandedGroups.has(group.groupId)
                          return (
                            <div key={group.groupId}>
                              {/* Group header */}
                              <button
                                onClick={() => toggleGroup(group.groupId)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition text-left"
                              >
                                {isGroupOpen ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                                <span className="text-xs font-mono text-slate-400">{group.groupId}</span>
                                <span className="text-sm text-slate-700 font-medium truncate">{group.group}</span>
                                <span className="text-xs text-slate-400 ml-auto shrink-0">{group.capabilities.length}</span>
                              </button>

                              {/* Capability cards */}
                              {isGroupOpen && (
                                <div className="pl-6 pr-3 pb-2 space-y-1.5">
                                  {group.capabilities.map(cap => {
                                    const cc = colorOf(cap)
                                    const isSelected = selectedId === cap.id
                                    return (
                                      <button
                                        key={cap.id}
                                        onClick={() => setSelectedId(isSelected ? null : cap.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition ${
                                          isSelected
                                            ? `${cc.bgLight} ${cc.border} shadow-sm`
                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2">
                                          <span className="text-sm font-medium text-slate-800 flex-1">{cap.name}</span>
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${maturityColors[cap.maturityLevelRequired] ?? maturityColors[1]}`}>
                                            L{cap.maturityLevelRequired}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{truncate(cap.description)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                                            <Layers size={10} /> {cap.fhirResources.length} FHIR
                                          </span>
                                          {cap.businessQuestions.length > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">
                                              <BookOpen size={10} /> {cap.businessQuestions.length} Qs
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ====== Right panel — Capability detail =================== */}
        {selected && (
          <div className="w-[55%] min-w-[380px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-h-[calc(100vh-260px)] overflow-y-auto">
            {(() => {
              const c = selected
              const cc = colorOf(c)
              return (
                <div>
                  {/* Detail header */}
                  <div className={`${cc.bgLight} border-b ${cc.border} px-6 py-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-xs font-medium ${cc.text} mb-1`}>{c.theme} &rsaquo; {c.group}</p>
                        <h2 className="text-lg font-bold text-slate-800">{c.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{c.id}</p>
                      </div>
                      <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-white/60 text-slate-400 hover:text-slate-600 transition">
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Full description */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wide">Description</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{c.description}</p>
                    </div>

                    {/* Maturity Level Required */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wide flex items-center gap-1.5">
                        <Gauge size={12} /> Maturity Level Required
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${maturityColors[c.maturityLevelRequired] ?? maturityColors[1]}`}>
                        Level {c.maturityLevelRequired}
                      </span>
                    </div>

                    {/* FHIR Resources Required */}
                    {c.fhirResources.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wide flex items-center gap-1.5">
                          <Layers size={12} /> FHIR Resources Required
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {c.fhirResources.map(rId => {
                            const res = fhirMap.get(rId)
                            return (
                              <span
                                key={rId}
                                title={res?.description}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-default hover:bg-blue-200 transition"
                              >
                                {res?.name ?? rId}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* HCDM Subject Areas */}
                    {c.hcdmSubjectAreas.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wide flex items-center gap-1.5">
                          <Layers size={12} /> HCDM Subject Areas
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {c.hcdmSubjectAreas.map((sa, i) => (
                            <button
                              key={sa}
                              onClick={() => { setFilterSubjectArea(sa); setShowFilters(true) }}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition ${subjectAreaColors[i % subjectAreaColors.length]}`}
                            >
                              {sa}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pakistan Enrichment */}
                    {c.pakistanEnrichment && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wide flex items-center gap-1.5">
                          <Building2 size={12} /> Pakistan Enrichment
                        </h3>
                        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-3">
                          {[
                            { label: 'Institution', value: c.pakistanEnrichment.institution, icon: Building2 },
                            { label: 'System', value: c.pakistanEnrichment.system, icon: Layers },
                            { label: 'Challenge', value: c.pakistanEnrichment.challenge, icon: AlertTriangle },
                            { label: 'Opportunity', value: c.pakistanEnrichment.opportunity, icon: Lightbulb },
                          ].map(item => (
                            <div key={item.label} className="flex gap-3">
                              <div className="shrink-0 mt-0.5">
                                <item.icon size={14} className="text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                                <p className="text-sm text-slate-700">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Business Questions */}
                    {c.businessQuestions.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wide flex items-center gap-1.5">
                          <BookOpen size={12} /> Business Questions
                        </h3>
                        <ol className="space-y-2">
                          {c.businessQuestions.map((q, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{q}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Related Capabilities */}
                    {c.relatedCapabilities.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wide flex items-center gap-1.5">
                          <Link2 size={12} /> Related Capabilities
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {c.relatedCapabilities.map(relId => {
                            const rel = capabilities.find(rc => rc.id === relId)
                            return (
                              <button
                                key={relId}
                                onClick={() => {
                                  setSelectedId(relId)
                                  if (rel) {
                                    setExpandedThemes(prev => new Set(prev).add(rel.themeId))
                                    setExpandedGroups(prev => new Set(prev).add(rel.groupId))
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer transition"
                              >
                                <Link2 size={10} />
                                {rel?.name ?? relId}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
