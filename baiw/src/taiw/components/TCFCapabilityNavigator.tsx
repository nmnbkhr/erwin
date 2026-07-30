import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ChevronDown, ChevronRight, Search, Filter,
  Layers, Target, AlertTriangle, Clock, DollarSign, Star, Download,
} from 'lucide-react'
import { downloadJSON, downloadCSV } from '../utils/export'
import { loadCapabilities, loadEnrichment, loadDependencies } from '../data'
import type { TaiwCapability, TaiwEnrichment, TaiwDependency } from '../types'

/* ── Theme color mapping ────────────────────────────────────────────── */
const THEME_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  red:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500'     },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500'  },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500'  },
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: 'bg-red-100',    text: 'text-red-700'    },
  HIGH:     { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  MEDIUM:   { bg: 'bg-sky-100',    text: 'text-sky-700'    },
}

const PHASE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Phase 1 (0-6 mo)',   color: 'bg-green-100 text-green-700'  },
  2: { label: 'Phase 2 (6-18 mo)',  color: 'bg-blue-100 text-blue-700'   },
  3: { label: 'Phase 3 (18-36 mo)', color: 'bg-purple-100 text-purple-700' },
}

const DEFAULT_STYLE = THEME_STYLES.blue

/* ── Component ──────────────────────────────────────────────────────── */
export default function TCFCapabilityNavigator() {
  const [searchParams] = useSearchParams()

  /* data state */
  const [capabilities, setCapabilities] = useState<TaiwCapability[]>([])
  const [enrichment, setEnrichment] = useState<TaiwEnrichment | null>(null)
  const [dependencies, setDependencies] = useState<Record<string, TaiwDependency>>({})
  const [loading, setLoading] = useState(true)

  /* ui state */
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [themeFilter, setThemeFilter] = useState<string | null>(null)
  const [criticalOnly, setCriticalOnly] = useState(false)

  /* ── TC2: TACR Maturity data from localStorage ──────────────── */
  const maturityScores = useMemo(() => {
    try {
      const raw = localStorage.getItem('taiw_maturity')
      if (!raw) return null
      const parsed: Record<string, { currentState: number; desiredState: number }> = JSON.parse(raw)
      // Group questions by category prefix and compute averages
      const categoryAverages: Record<string, number> = {}
      const categorySums: Record<string, { sum: number; count: number }> = {}
      Object.entries(parsed).forEach(([qId, answer]) => {
        // Question IDs are like "cat-sec-N" — extract category prefix (first segment)
        const parts = qId.split('-')
        const catPrefix = parts[0] || qId
        if (!categorySums[catPrefix]) categorySums[catPrefix] = { sum: 0, count: 0 }
        categorySums[catPrefix].sum += answer.currentState
        categorySums[catPrefix].count++
      })
      Object.entries(categorySums).forEach(([cat, { sum, count }]) => {
        categoryAverages[cat] = count > 0 ? sum / count : 0
      })
      return categoryAverages
    } catch {
      return null
    }
  }, [])

  /* TC2: Map capability theme keywords → TACR category names → category prefix */
  const getMaturityForTheme = (themeName: string): number | null => {
    if (!maturityScores) return null
    const lower = themeName.toLowerCase()
    // Map theme keywords to TACR category prefixes
    // Category prefixes derived from TACR category names:
    // "Outcomes & Impact" → outcomes, "Analytics & Technology" → analytics,
    // "Processes & Automation" → processes, "Infrastructure" → infrastructure,
    // "Data Governance" → data, "Strategy & Vision" → strategy
    let targetPrefix: string | null = null
    if (lower.includes('revenue') || lower.includes('outcome')) targetPrefix = 'outcomes'
    else if (lower.includes('risk') || lower.includes('analytics') || lower.includes('compliance')) targetPrefix = 'analytics'
    else if (lower.includes('facilitat') || lower.includes('process')) targetPrefix = 'processes'
    else if (lower.includes('digital') || lower.includes('technol') || lower.includes('infrastructure')) targetPrefix = 'infrastructure'
    else if (lower.includes('data') || lower.includes('governance')) targetPrefix = 'data'
    else if (lower.includes('intelligen') || lower.includes('strateg') || lower.includes('policy')) targetPrefix = 'strategy'

    if (!targetPrefix) return null
    // Try exact match first, then partial match on keys
    if (maturityScores[targetPrefix] !== undefined) return maturityScores[targetPrefix]
    const matchKey = Object.keys(maturityScores).find(k => k.toLowerCase().startsWith(targetPrefix!))
    return matchKey ? maturityScores[matchKey] : null
  }

  const maturityBadgeColor = (score: number): string => {
    if (score >= 5) return 'bg-teal-100 text-teal-700 border-teal-300'
    if (score >= 4) return 'bg-green-100 text-green-700 border-green-300'
    if (score >= 3) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    return 'bg-red-100 text-red-700 border-red-300' // 1-2
  }

  /* ── load data ───────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([loadCapabilities(), loadEnrichment(), loadDependencies()])
      .then(([caps, enr, deps]) => {
        setCapabilities(caps)
        setEnrichment(enr)
        setDependencies(deps)
        setLoading(false)

        // handle URL params
        const paramTheme = searchParams.get('theme')
        const paramCap = searchParams.get('cap')
        if (paramCap) {
          const found = caps.find(c => c.id === paramCap)
          if (found) {
            setSelectedId(found.id)
            setExpandedThemes(new Set([found.theme]))
            setExpandedGroups(new Set([`${found.theme}::${found.group}`]))
          }
        } else if (paramTheme) {
          setExpandedThemes(new Set([paramTheme]))
        }
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── derived data ────────────────────────────────────────────── */
  const selectedCap = useMemo(
    () => capabilities.find(c => c.id === selectedId) ?? null,
    [capabilities, selectedId],
  )

  const selectedEnrichment = useMemo(() => {
    if (!selectedCap || !enrichment) return null
    return enrichment.capabilities[selectedCap.id] ?? null
  }, [selectedCap, enrichment])

  const selectedDeps = useMemo(() => {
    if (!selectedCap) return null
    return dependencies[selectedCap.id] ?? null
  }, [selectedCap, dependencies])

  /* Build hierarchy: theme -> group -> caps */
  const hierarchy = useMemo(() => {
    const lowerQ = searchQuery.toLowerCase()
    const filtered = capabilities.filter(c => {
      if (criticalOnly && c.priority !== 'CRITICAL') return false
      if (themeFilter && c.themeColor !== themeFilter) return false
      if (lowerQ) {
        return (
          c.sub.toLowerCase().includes(lowerQ) ||
          c.group.toLowerCase().includes(lowerQ) ||
          c.theme.toLowerCase().includes(lowerQ) ||
          c.id.toLowerCase().includes(lowerQ)
        )
      }
      return true
    })

    const themes: Record<string, { color: string; groups: Record<string, TaiwCapability[]> }> = {}
    filtered.forEach(c => {
      if (!themes[c.theme]) themes[c.theme] = { color: c.themeColor, groups: {} }
      if (!themes[c.theme].groups[c.group]) themes[c.theme].groups[c.group] = []
      themes[c.theme].groups[c.group].push(c)
    })
    return themes
  }, [capabilities, searchQuery, themeFilter, criticalOnly])

  /* Auto-expand when searching */
  useEffect(() => {
    if (searchQuery) {
      setExpandedThemes(new Set(Object.keys(hierarchy)))
      const allGroups = new Set<string>()
      Object.entries(hierarchy).forEach(([theme, { groups }]) => {
        Object.keys(groups).forEach(g => allGroups.add(`${theme}::${g}`))
      })
      setExpandedGroups(allGroups)
    }
  }, [searchQuery, hierarchy])

  /* Related capabilities: other caps sharing 3+ elements via dependencies */
  const relatedCaps = useMemo(() => {
    if (!selectedCap || !dependencies[selectedCap.id]) return []
    const myElements = new Set(dependencies[selectedCap.id].elements)
    if (myElements.size === 0) return []

    const scored: { cap: TaiwCapability; shared: number }[] = []
    capabilities.forEach(c => {
      if (c.id === selectedCap.id) return
      const dep = dependencies[c.id]
      if (!dep) return
      const shared = dep.elements.filter(e => myElements.has(e)).length
      if (shared >= 3) scored.push({ cap: c, shared })
    })
    return scored.sort((a, b) => b.shared - a.shared).slice(0, 8)
  }, [selectedCap, dependencies, capabilities])

  /* unique theme colors for filter */
  const themeColors = useMemo(() => {
    const seen = new Map<string, string>()
    capabilities.forEach(c => {
      if (!seen.has(c.themeColor)) seen.set(c.themeColor, c.theme)
    })
    return Array.from(seen.entries()) // [color, themeName]
  }, [capabilities])

  /* ── helpers ─────────────────────────────────────────────────── */
  const toggleTheme = (theme: string) => {
    setExpandedThemes(prev => {
      const next = new Set(prev)
      if (next.has(theme)) next.delete(theme); else next.add(theme)
      return next
    })
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  /* ── loading skeleton ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex gap-4 h-[calc(100vh-120px)]">
        <div className="w-[320px] bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="flex-1 bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="w-[260px] bg-white rounded-lg shadow-sm animate-pulse" />
      </div>
    )
  }

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Every page needs exactly one h1 for the document outline: screen readers
          navigate by heading and these pages had none. Visually hidden because the
          page title is already communicated by the sidebar and header chrome. */}
      <h1 className="sr-only">TCF Capability Navigator</h1>

      {/* ─── LEFT: TCF Hierarchy Tree ─────────────────────────── */}
      <div className="w-[320px] bg-white rounded-lg shadow-sm overflow-y-auto shrink-0 flex flex-col">
        {/* Search + Filter header */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers size={14} className="text-teal-500" />
              TCF Capability Hierarchy
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => downloadJSON(capabilities, `taiw-capabilities-${new Date().toISOString().slice(0, 10)}.json`)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors text-slate-500"
                title="Export JSON"
              >
                <Download size={10} /> JSON
              </button>
              <button
                onClick={() => downloadCSV(capabilities.map(c => ({
                  id: c.id, sub: c.sub, group: c.group, theme: c.theme,
                  priority: c.priority, dataReqCount: c.dataReqCount,
                })), `taiw-capabilities-${new Date().toISOString().slice(0, 10)}.csv`)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors text-slate-500"
                title="Export CSV"
              >
                <Download size={10} /> CSV
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search capabilities..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200"
            />
          </div>
          {/* Theme color filter chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <Filter size={12} className="text-slate-400" />
            <button
              onClick={() => setThemeFilter(null)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                !themeFilter
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {themeColors.map(([color, themeName]) => {
              const style = THEME_STYLES[color] || DEFAULT_STYLE
              return (
                <button
                  key={color}
                  onClick={() => setThemeFilter(themeFilter === color ? null : color)}
                  title={themeName}
                  className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 transition-colors ${
                    themeFilter === color
                      ? `${style.bg} ${style.text} ring-1 ring-current`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  {color}
                </button>
              )
            })}
          </div>
          {/* TC1: Critical Only toggle */}
          <button
            onClick={() => setCriticalOnly(v => !v)}
            className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border transition ${
              criticalOnly
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Star size={12} className={criticalOnly ? 'text-amber-400 fill-amber-400' : 'text-slate-400'} />
            Show Critical Only
          </button>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {Object.keys(hierarchy).length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-8">No capabilities match your search.</p>
          )}
          {Object.entries(hierarchy).map(([themeName, { color, groups }]) => {
            const ts = THEME_STYLES[color] || DEFAULT_STYLE
            const isOpen = expandedThemes.has(themeName)
            const capCount = Object.values(groups).reduce((s, arr) => s + arr.length, 0)
            return (
              <div key={themeName} className="mb-2">
                <button
                  onClick={() => toggleTheme(themeName)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded ${ts.bg} ${ts.text}`}
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className={`w-2 h-2 rounded-full ${ts.dot}`} />
                  <span className="truncate flex-1 text-left">{themeName}</span>
                  <span className="text-xs opacity-60">{capCount}</span>
                </button>

                {isOpen && Object.entries(groups).map(([groupName, caps]) => {
                  const gKey = `${themeName}::${groupName}`
                  const isGroupOpen = expandedGroups.has(gKey)
                  return (
                    <div key={groupName} className="ml-4 mt-1">
                      <button
                        onClick={() => toggleGroup(gKey)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded"
                      >
                        {isGroupOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span className="truncate flex-1 text-left">{groupName}</span>
                        <span className="text-slate-400 text-xs">{caps.length}</span>
                      </button>
                      {isGroupOpen && (
                        <div className="ml-4 border-l border-slate-100 pl-2">
                          {caps.map(cap => {
                            const ps = PRIORITY_STYLES[cap.priority]
                            const dep = dependencies[cap.id]
                            const elCount = dep?.elementCount ?? 0
                            const matScore = getMaturityForTheme(cap.theme)
                            return (
                              <button
                                key={cap.id}
                                onClick={() => setSelectedId(cap.id)}
                                className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-1 ${
                                  selectedId === cap.id
                                    ? 'bg-teal-50 text-teal-700 font-medium'
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {/* TC1: Gold star for CRITICAL */}
                                {cap.priority === 'CRITICAL' && (
                                  <Star size={11} className="shrink-0 text-amber-400 fill-amber-400" />
                                )}
                                <span className="truncate flex-1">{cap.sub}</span>
                                {/* TC3: WCO Element Count badge */}
                                {elCount > 0 && (
                                  <span className="shrink-0 px-1 py-0 text-[11px] font-semibold rounded bg-teal-100 text-teal-700 tabular-nums" title={`${elCount} WCO DM elements`}>
                                    {elCount}
                                  </span>
                                )}
                                {/* TC2: Maturity badge */}
                                {matScore !== null && (
                                  <span className={`shrink-0 px-1 py-0 text-[11px] font-semibold rounded border ${maturityBadgeColor(matScore)}`} title={`TACR Maturity: ${matScore.toFixed(1)}`}>
                                    {matScore.toFixed(1)}
                                  </span>
                                )}
                                {ps && (
                                  <span className={`shrink-0 px-1.5 py-0.5 text-xs rounded ${ps.bg} ${ps.text}`}>
                                    {cap.priority === 'CRITICAL' ? 'C' : cap.priority === 'HIGH' ? 'H' : 'M'}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── CENTER: Capability Detail ────────────────────────── */}
      <div className="flex-1 bg-white rounded-lg shadow-sm overflow-y-auto">
        {selectedCap ? (
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
              <span>{selectedCap.theme}</span>
              <span>/</span>
              <span>{selectedCap.group}</span>
              <span>/</span>
              <span className="text-slate-700 font-medium">{selectedCap.sub}</span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-slate-800 mb-3">{selectedCap.sub}</h2>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mb-6">
              {/* Theme */}
              {(() => {
                const ts = THEME_STYLES[selectedCap.themeColor] || DEFAULT_STYLE
                return (
                  <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${ts.bg} ${ts.text}`}>
                    <span className={`w-2 h-2 rounded-full ${ts.dot}`} />
                    {selectedCap.theme}
                  </span>
                )
              })()}
              {/* Priority */}
              {(() => {
                const ps = PRIORITY_STYLES[selectedCap.priority]
                if (!ps) return null
                return (
                  <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${ps.bg} ${ps.text}`}>
                    {selectedCap.priority === 'CRITICAL' && <Star size={12} className="text-amber-400 fill-amber-400" />}
                    {selectedCap.priority === 'CRITICAL' && <AlertTriangle size={12} />}
                    {selectedCap.priority}
                  </span>
                )
              })()}
              {/* Phase from enrichment */}
              {selectedEnrichment && PHASE_LABELS[selectedEnrichment.implementationPhase] && (
                <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${PHASE_LABELS[selectedEnrichment.implementationPhase].color}`}>
                  <Clock size={12} />
                  {PHASE_LABELS[selectedEnrichment.implementationPhase].label}
                </span>
              )}
              {/* Investment range */}
              {selectedEnrichment && (
                <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                  <DollarSign size={12} />
                  {selectedEnrichment.investmentRange}
                </span>
              )}
              {/* TC2: TACR Maturity badge in detail panel */}
              {(() => {
                const ms = getMaturityForTheme(selectedCap.theme)
                if (ms === null) return null
                return (
                  <span className={`px-2 py-1 text-xs rounded border flex items-center gap-1 ${maturityBadgeColor(ms)}`}>
                    TACR {ms.toFixed(1)}
                  </span>
                )
              })()}
            </div>

            {/* ── Pakistan Context ──────────────────────────────── */}
            {selectedEnrichment && (
              <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                <h3 className="text-sm font-semibold text-teal-800 mb-3 flex items-center gap-1.5">
                  <Target size={14} />
                  Pakistan Trade Context
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Objectives */}
                  <div>
                    <p className="font-medium text-teal-700 mb-1">Pakistan Objectives</p>
                    <ul className="space-y-1">
                      {selectedEnrichment.pakistanObjectives.map((obj, i) => (
                        <li key={i} className="text-teal-600 text-xs flex gap-1">
                          <span className="shrink-0">-</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Expected Outcomes */}
                  <div>
                    <p className="font-medium text-teal-700 mb-1">Expected Outcomes</p>
                    <ul className="space-y-1">
                      {selectedEnrichment.expectedOutcomes.map((eo, i) => (
                        <li key={i} className="text-teal-600 text-xs flex gap-1">
                          <span className="shrink-0">-</span>
                          <span>{eo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Key Challenges */}
                  <div className="md:col-span-2">
                    <p className="font-medium text-teal-700 mb-1">Key Challenges</p>
                    <ul className="space-y-1">
                      {selectedEnrichment.keyChallenges.map((ch, i) => (
                        <li key={i} className="text-teal-600 text-xs flex gap-1">
                          <span className="shrink-0">-</span>
                          <span>{ch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ── Data Requirements / Elements ─────────────────── */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Data Elements ({selectedDeps?.elementCount ?? 0})
              </h3>
              {selectedDeps && selectedDeps.elements.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedDeps.elements.map(el => (
                    <span
                      key={el}
                      className="px-2 py-1 text-xs rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono cursor-default"
                    >
                      {el}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No specific data elements mapped</p>
              )}
            </div>

            {/* Domains */}
            {selectedDeps && selectedDeps.domains.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  WCO Domains ({selectedDeps.domainCount})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDeps.domains.map(d => (
                    <span
                      key={d}
                      className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Data Requirements list */}
            {selectedDeps && selectedDeps.dataRequirements.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Data Requirements ({selectedDeps.dataRequirements.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {selectedDeps.dataRequirements.map(dr => (
                    <div key={dr} className="text-xs text-slate-600 py-1 px-2 bg-slate-50 rounded">
                      {dr}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Implementation summary */}
            {selectedEnrichment && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Implementation Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Phase</p>
                    <p className="font-medium text-slate-700">{selectedEnrichment.implementationPhase}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Est. Investment</p>
                    <p className="font-medium text-slate-700">{selectedEnrichment.investmentRange}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Priority</p>
                    <p className="font-medium text-slate-700">{selectedEnrichment.priority}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Target size={32} className="text-teal-300" />
            <p className="text-sm">Select a capability to view details</p>
            <p className="text-xs">Browse the TCF hierarchy on the left</p>
          </div>
        )}
      </div>

      {/* ─── RIGHT: Related Capabilities ──────────────────────── */}
      <div className="w-[260px] bg-white rounded-lg shadow-sm overflow-y-auto shrink-0 flex flex-col">
        <div className="p-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Related Capabilities</h3>
          <p className="text-xs text-slate-400 mt-0.5">Sharing 3+ data elements</p>
        </div>
        {selectedCap && relatedCaps.length > 0 ? (
          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
            {relatedCaps.map((r, i) => {
              const ts = THEME_STYLES[r.cap.themeColor] || DEFAULT_STYLE
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedId(r.cap.id)
                    setExpandedThemes(prev => new Set([...prev, r.cap.theme]))
                    setExpandedGroups(prev => new Set([...prev, `${r.cap.theme}::${r.cap.group}`]))
                  }}
                  className="w-full text-left p-2 bg-slate-50 rounded hover:bg-teal-50 transition-colors"
                >
                  <p className="text-xs font-medium text-slate-700 truncate">{r.cap.sub}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${ts.dot}`} />
                    <span className="text-xs text-slate-400 truncate">{r.cap.group}</span>
                    <span className="ml-auto text-xs text-teal-600 font-medium shrink-0">
                      {r.shared} shared
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-3 text-xs text-slate-400 flex-1 flex items-start justify-center pt-8">
            {selectedCap ? 'No capabilities share 3+ elements' : 'Select a capability first'}
          </div>
        )}
      </div>
    </div>
  )
}
