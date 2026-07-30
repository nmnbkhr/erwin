import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadCapabilities, loadEnrichment, loadReuseScores,
} from '../data'
import type {
  TaiwCapability, TaiwEnrichment, TaiwEnrichmentEntry, TaiwReuseScore,
} from '../types'
import {
  ChevronDown, ChevronRight, Check, Search, Download, FileText,
  Zap, ShieldCheck, Ship, Layers, RotateCcw, Monitor, Cpu,
  Users, Clock, DollarSign, Database, SlidersHorizontal, GraduationCap,
} from 'lucide-react'

/* ---------- Constants ---------- */

const STORAGE_KEY = 'taiw_roadmap'

const PHASE_META: Record<number, {
  label: string; range: string; headerBg: string; headerText: string
  laneBg: string; border: string; badgeText: string
}> = {
  1: { label: 'Foundation', range: '0-12 months', headerBg: 'bg-teal-600', headerText: 'text-white', laneBg: 'bg-teal-50', border: 'border-teal-200', badgeText: 'text-teal-700' },
  2: { label: 'Integration', range: '12-24 months', headerBg: 'bg-cyan-600', headerText: 'text-white', laneBg: 'bg-cyan-50', border: 'border-cyan-200', badgeText: 'text-cyan-700' },
  3: { label: 'Intelligence', range: '24-36 months', headerBg: 'bg-teal-400', headerText: 'text-white', laneBg: 'bg-teal-50/60', border: 'border-teal-200', badgeText: 'text-teal-600' },
}

const TIER_COLORS: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-yellow-100 text-yellow-700',
  P4: 'bg-slate-100 text-slate-600',
}

const PRIORITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-slate-100 text-slate-500',
}

/* ---------- Helpers ---------- */

function loadSavedSelection(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveSelection(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

function getPhaseForCap(
  cap: TaiwCapability,
  enrichment: TaiwEnrichment | null,
): number {
  const enr = enrichment?.capabilities[cap.id]
  if (enr) return enr.implementationPhase
  // Default based on priority when no enrichment entry
  if (cap.priority === 'CRITICAL' || cap.priority === 'HIGH') return 1
  if (cap.priority === 'MEDIUM') return 2
  return 3
}

function formatPKR(amount: number): string {
  if (amount >= 1_000) return `PKR ${(amount / 1_000).toFixed(1)}B`
  return `PKR ${amount.toLocaleString()}M`
}

/* ---------- Template definitions ---------- */

interface TemplateConfig {
  label: string
  icon: typeof Zap
  color: string
  filter: (cap: TaiwCapability, enrichment: TaiwEnrichment) => boolean
  limit?: number
}

const TEMPLATES: TemplateConfig[] = [
  {
    label: 'Quick Wins',
    icon: Zap,
    color: 'text-amber-600',
    filter: (cap, enrichment) => {
      const enr = enrichment.capabilities[cap.id]
      return cap.priority === 'CRITICAL' && (enr ? enr.implementationPhase === 1 : true)
    },
    limit: 8,
  },
  {
    label: 'Revenue Protection',
    icon: ShieldCheck,
    color: 'text-red-600',
    filter: (cap) => /revenue|risk/i.test(cap.theme),
  },
  {
    label: 'Trade Facilitation',
    icon: Ship,
    color: 'text-cyan-600',
    filter: (cap) => /facilitation|operations/i.test(cap.theme),
  },
  {
    label: 'Digital Transformation',
    icon: Monitor,
    color: 'text-violet-600',
    filter: (cap) => /technology|data|digital|intelligence/i.test(cap.theme),
  },
  {
    label: 'Full TCF',
    icon: Layers,
    color: 'text-teal-600',
    filter: () => true,
  },
]

/* =================================================================== */
/*  Component                                                           */
/* =================================================================== */

export default function TradeRoadmapBuilder() {
  const navigate = useNavigate()

  /* ---- Data state ---- */
  const [capabilities, setCapabilities] = useState<TaiwCapability[]>([])
  const [enrichment, setEnrichment] = useState<TaiwEnrichment | null>(null)
  const [reuseScores, setReuseScores] = useState<TaiwReuseScore[]>([])
  const [loading, setLoading] = useState(true)

  /* ---- UI state ---- */
  const [selectedCaps, setSelectedCaps] = useState<Set<string>>(loadSavedSelection)
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState('')

  /* ---- Investment Calculator state ---- */
  const [teamSize, setTeamSize] = useState(30)
  const [duration, setDuration] = useState(24)
  const [techCost, setTechCost] = useState(500)
  const [trainingBudget, setTrainingBudget] = useState(50)

  /* ---- Load data ---- */
  useEffect(() => {
    Promise.all([
      loadCapabilities(),
      loadEnrichment(),
      loadReuseScores(),
    ]).then(([caps, enr, reuse]) => {
      setCapabilities(caps)
      setEnrichment(enr)
      setReuseScores(reuse)
      setLoading(false)
    })
  }, [])

  /* ---- Persist selection ---- */
  useEffect(() => { saveSelection(selectedCaps) }, [selectedCaps])

  /* ---- Callbacks ---- */
  const toggleCap = useCallback((id: string) => {
    setSelectedCaps(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const applyTemplate = useCallback((tpl: TemplateConfig) => {
    if (!enrichment) return
    let matched = capabilities.filter(c => tpl.filter(c, enrichment))
    if (tpl.limit) matched = matched.slice(0, tpl.limit)
    setSelectedCaps(new Set(matched.map(c => c.id)))
  }, [capabilities, enrichment])

  const clearAll = useCallback(() => setSelectedCaps(new Set()), [])

  const toggleThemeAll = useCallback((themeCaps: TaiwCapability[]) => {
    setSelectedCaps(prev => {
      const next = new Set(prev)
      const allSelected = themeCaps.every(c => next.has(c.id))
      themeCaps.forEach(c => allSelected ? next.delete(c.id) : next.add(c.id))
      return next
    })
  }, [])

  /* ---- Derived: group by theme ---- */
  const groupedByTheme = useMemo(() => {
    const themes: Record<string, { themeIndex: number; themeColor: string; capabilities: TaiwCapability[] }> = {}
    capabilities.forEach(cap => {
      if (!themes[cap.theme]) themes[cap.theme] = { themeIndex: cap.themeIndex, themeColor: cap.themeColor, capabilities: [] }
      themes[cap.theme].capabilities.push(cap)
    })
    return Object.entries(themes).sort((a, b) => a[1].themeIndex - b[1].themeIndex)
  }, [capabilities])

  /* ---- Derived: filtered themes for picker ---- */
  const filteredThemes = useMemo(() => {
    if (!searchFilter.trim()) return groupedByTheme
    const q = searchFilter.toLowerCase()
    return groupedByTheme
      .map(([theme, data]) => {
        const filtered = data.capabilities.filter(c =>
          c.sub.toLowerCase().includes(q) || c.group.toLowerCase().includes(q) ||
          c.theme.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
        return [theme, { ...data, capabilities: filtered }] as [string, typeof data]
      })
      .filter(([, data]) => data.capabilities.length > 0)
  }, [groupedByTheme, searchFilter])

  /* ---- Derived: selected caps list ---- */
  const selectedCapsList = useMemo(
    () => capabilities.filter(c => selectedCaps.has(c.id)),
    [capabilities, selectedCaps],
  )

  /* ---- Derived: 3-phase timeline ---- */
  const phases = useMemo(() => {
    return [1, 2, 3].map(phase => ({
      phase,
      capabilities: selectedCapsList.filter(c => getPhaseForCap(c, enrichment) === phase),
    }))
  }, [selectedCapsList, enrichment])

  /* ---- Derived: Investment Calculator ---- */
  const personnelCost = teamSize * duration * 0.25 // PKR 250K/month = 0.25M
  const totalCost = personnelCost + techCost + trainingBudget
  const complexityScore = useMemo(
    () => selectedCapsList.reduce((sum, c) => sum + c.dataReqCount, 0),
    [selectedCapsList],
  )

  /* ---- Derived: Shared Data Foundation ---- */
  const sharedElements = useMemo(() => {
    return reuseScores
      .filter(r => r.capabilitiesSupported >= 3)
      .sort((a, b) => b.score - a.score)
  }, [reuseScores])

  /* ---- Export stubs ---- */
  const handleExportJSON = useCallback(() => {
    if (!enrichment) return
    const payload = selectedCapsList.map(cap => ({
      ...cap,
      enrichment: enrichment.capabilities[cap.id] ?? null,
      phase: getPhaseForCap(cap, enrichment),
    }))
    const blob = new Blob([JSON.stringify({ capabilities: payload, investment: { teamSize, duration, techCost, trainingBudget, personnelCost, totalCost, complexityScore } }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taiw-roadmap-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [selectedCapsList, enrichment, teamSize, duration, techCost, trainingBudget, personnelCost, totalCost, complexityScore])

  const handleExportPDF = useCallback(() => {
    console.log('Export PDF — stub. Selected capabilities:', selectedCapsList.length)
  }, [selectedCapsList])

  /* ================================================================= */
  /*  Loading skeleton                                                  */
  /* ================================================================= */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm h-16 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-200px)] animate-pulse" />
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ================================================================= */
  /*  Render                                                            */
  /* ================================================================= */
  return (
    <div className="space-y-6">
      {/* Every page needs exactly one h1 for the document outline: screen readers
          navigate by heading and these pages had none. Visually hidden because the
          page title is already communicated by the sidebar and header chrome. */}
      <h1 className="sr-only">Trade Roadmap Builder</h1>

      {/* ===== Header: Templates + Export Buttons ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.label}
              onClick={() => applyTemplate(tpl)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors shadow-sm"
            >
              <tpl.icon size={14} className={tpl.color} />
              <span className="font-medium">{tpl.label}</span>
            </button>
          ))}
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm text-red-500"
          >
            <RotateCcw size={14} />
            <span className="font-medium">Clear All</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-slate-600"
          >
            <FileText size={12} />
            Export PDF
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Download size={12} />
            Export JSON
          </button>
        </div>
      </div>

      {/* ===== Main Grid: Picker | Roadmap ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ---- Section 1: Capability Picker (left column) ---- */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter capabilities..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Grouped capability checkboxes */}
          <div className="bg-white rounded-lg shadow-sm overflow-y-auto max-h-[calc(100vh-320px)]">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-semibold text-slate-700">
                Capabilities ({selectedCaps.size}/{capabilities.length})
              </h3>
              <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600">
                Clear All
              </button>
            </div>
            <div className="p-2">
              {filteredThemes.map(([theme, data]) => {
                const isOpen = expandedThemes.has(theme)
                const selectedInTheme = data.capabilities.filter(c => selectedCaps.has(c.id)).length
                const allSelected = data.capabilities.length > 0 && data.capabilities.every(c => selectedCaps.has(c.id))
                return (
                  <div key={theme} className="mb-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedThemes(prev => {
                          const next = new Set(prev)
                          if (next.has(theme)) next.delete(theme); else next.add(theme)
                          return next
                        })}
                        className="flex-1 flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded"
                      >
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span className="flex-1 text-left truncate font-medium">{theme}</span>
                        {selectedInTheme > 0 && (
                          <span className="text-teal-600 text-xs font-medium">{selectedInTheme}/{data.capabilities.length}</span>
                        )}
                      </button>
                      <button
                        onClick={() => toggleThemeAll(data.capabilities)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          allSelected
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-600'
                        }`}
                        title={allSelected ? 'Deselect All' : 'Select All'}
                      >
                        {allSelected ? 'All' : 'All'}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="ml-4 space-y-0.5">
                        {data.capabilities.map(cap => {
                          const enr = enrichment?.capabilities[cap.id]
                          const phase = getPhaseForCap(cap, enrichment)
                          return (
                            <label
                              key={cap.id}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCaps.has(cap.id)}
                                onChange={() => toggleCap(cap.id)}
                                className="rounded text-teal-600 focus:ring-teal-500"
                              />
                              <span className="flex-1 truncate">{cap.sub}</span>
                              <span className={`px-1.5 py-0.5 text-xs rounded ${PRIORITY_BADGE[cap.priority] ?? 'bg-slate-100 text-slate-500'}`}>
                                {cap.priority}
                              </span>
                              <span className="text-xs text-slate-400">P{enr ? enr.implementationPhase : phase}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ---- Right column: Roadmap output ---- */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCaps.size === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Layers size={48} className="text-slate-300" />
              <p className="text-sm">Select capabilities or use a template to build your modernization roadmap</p>
            </div>
          ) : (
            <>
              {/* ===== Section 2: 3-Phase Timeline ===== */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-slate-700">3-Phase Implementation Timeline</h3>

                {/* Phase summary bar */}
                <div className="grid grid-cols-3 gap-3">
                  {phases.map(({ phase, capabilities: phaseCaps }) => {
                    const meta = PHASE_META[phase]
                    const phaseShare = selectedCapsList.length > 0
                      ? phaseCaps.length / selectedCapsList.length : 0
                    const phaseInvestment = totalCost * phaseShare
                    return (
                      <div key={`summary-${phase}`} className={`rounded-lg border ${meta.border} p-3 ${meta.laneBg}`}>
                        <p className={`text-xs font-semibold ${meta.badgeText}`}>Phase {phase}: {meta.label}</p>
                        <p className="text-lg font-bold text-slate-800 mt-1">{phaseCaps.length} <span className="text-xs font-normal text-slate-500">capabilities</span></p>
                        <p className="text-sm font-semibold text-slate-700">{formatPKR(phaseInvestment)}</p>
                        <p className="text-xs text-slate-400">{(phaseShare * 100).toFixed(0)}% of total investment</p>
                      </div>
                    )
                  })}
                </div>

                {phases.map(({ phase, capabilities: phaseCaps }) => {
                  const meta = PHASE_META[phase]
                  const phaseShare = selectedCapsList.length > 0
                    ? phaseCaps.length / selectedCapsList.length : 0
                  const phaseInvestment = totalCost * phaseShare
                  return (
                    <div key={phase} className={`rounded-lg border ${meta.border} overflow-hidden`}>
                      {/* Phase header */}
                      <div className={`px-4 py-3 ${meta.headerBg} flex items-center justify-between`}>
                        <div>
                          <h4 className={`text-sm font-semibold ${meta.headerText}`}>
                            Phase {phase}: {meta.label}
                          </h4>
                          <p className={`text-xs ${meta.headerText} opacity-80`}>{meta.range}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-xs rounded bg-white/20 ${meta.headerText}`}>
                            {formatPKR(phaseInvestment)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded bg-white/20 ${meta.headerText}`}>
                            {phaseCaps.length} capabilities
                          </span>
                        </div>
                      </div>
                      {/* Phase lane */}
                      <div className={`p-4 ${meta.laneBg}`}>
                        {phaseCaps.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No capabilities assigned to this phase</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {phaseCaps.map(cap => (
                              <span
                                key={cap.id}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white rounded border border-slate-200 shadow-sm"
                                title={`${cap.theme} > ${cap.group}`}
                              >
                                <Check size={10} className={meta.badgeText} />
                                <span className="truncate max-w-[200px]">{cap.sub}</span>
                                <span className={`ml-1 px-1 py-0 text-xs rounded ${PRIORITY_BADGE[cap.priority] ?? 'bg-slate-100 text-slate-500'}`}>
                                  {cap.priority}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ===== Section 3: Investment Calculator ===== */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <SlidersHorizontal size={18} className="text-teal-600" />
                  <h3 className="text-base font-semibold text-slate-700">Investment Calculator</h3>
                  <span className="ml-auto px-2 py-0.5 text-xs rounded bg-teal-100 text-teal-700 font-medium">
                    Complexity: {complexityScore}
                  </span>
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Team size */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Users size={12} /> Team Size
                      </label>
                      <span className="text-sm font-bold text-teal-700">{teamSize}</span>
                    </div>
                    <input
                      type="range" min={10} max={100} step={5} value={teamSize}
                      onChange={e => setTeamSize(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>10</span><span>100</span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Clock size={12} /> Duration (months)
                      </label>
                      <span className="text-sm font-bold text-teal-700">{duration}</span>
                    </div>
                    <input
                      type="range" min={12} max={36} step={6} value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>12</span><span>36</span>
                    </div>
                  </div>

                  {/* Technology cost */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <Cpu size={12} /> Technology Cost (PKR M)
                      </label>
                      <span className="text-sm font-bold text-teal-700">{techCost}M</span>
                    </div>
                    <input
                      type="range" min={100} max={2000} step={100} value={techCost}
                      onChange={e => setTechCost(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>100M</span><span>2,000M</span>
                    </div>
                  </div>

                  {/* Training budget */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                        <GraduationCap size={12} /> Training Budget (PKR M)
                      </label>
                      <span className="text-sm font-bold text-teal-700">{trainingBudget}M</span>
                    </div>
                    <input
                      type="range" min={10} max={200} step={10} value={trainingBudget}
                      onChange={e => setTrainingBudget(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>10M</span><span>200M</span>
                    </div>
                  </div>
                </div>

                {/* Calculated totals — summary card */}
                <div className="rounded-lg border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-5">
                  <h4 className="text-sm font-semibold text-teal-800 mb-4">Investment Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/80 rounded-lg border border-teal-100">
                      <Users size={16} className="mx-auto text-teal-600 mb-1" />
                      <p className="text-lg font-bold text-teal-800">{formatPKR(personnelCost)}</p>
                      <p className="text-xs text-teal-600 mt-1">Personnel Cost</p>
                      <p className="text-xs text-slate-400">{teamSize} x {duration}mo x PKR 250K</p>
                    </div>
                    <div className="text-center p-4 bg-white/80 rounded-lg border border-cyan-100">
                      <Cpu size={16} className="mx-auto text-cyan-600 mb-1" />
                      <p className="text-lg font-bold text-cyan-800">{formatPKR(techCost)}</p>
                      <p className="text-xs text-cyan-600 mt-1">Technology Cost</p>
                      <p className="text-xs text-slate-400">Infrastructure & licenses</p>
                    </div>
                    <div className="text-center p-4 bg-white/80 rounded-lg border border-teal-100">
                      <GraduationCap size={16} className="mx-auto text-teal-600 mb-1" />
                      <p className="text-lg font-bold text-teal-800">{formatPKR(trainingBudget)}</p>
                      <p className="text-xs text-teal-600 mt-1">Training Budget</p>
                      <p className="text-xs text-slate-400">Capacity building</p>
                    </div>
                    <div className="text-center p-4 bg-teal-600 rounded-lg">
                      <DollarSign size={16} className="mx-auto text-white mb-1" />
                      <p className="text-lg font-bold text-white">{formatPKR(totalCost)}</p>
                      <p className="text-xs text-teal-100 mt-1">Total Investment</p>
                      <p className="text-xs text-teal-200">{selectedCapsList.length} capabilities</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== Section 4: Shared Data Foundation ===== */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database size={18} className="text-cyan-600" />
                  <h3 className="text-base font-semibold text-slate-700">Shared Data Foundation</h3>
                  <span className="ml-auto text-xs text-slate-400">
                    WCO elements used by 3+ selected capabilities
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Element</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">WCO Domain</th>
                        <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">P-Tier</th>
                        <th className="text-center px-4 py-2 text-xs font-medium text-slate-500"># Capabilities</th>
                        <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">Reuse Score</th>
                        <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">WeBOC Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharedElements.slice(0, 30).map((el, idx) => {
                        const webocAvail = el.tier === 'P1' || el.tier === 'P2'
                          ? 'Y' : el.tier === 'P3' ? 'Maybe' : 'N'
                        const webocColor = webocAvail === 'Y'
                          ? 'bg-green-100 text-green-700'
                          : webocAvail === 'Maybe'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-600'
                        return (
                        <tr key={el.element} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-4 py-2 text-xs text-slate-700 font-medium">{el.element}</td>
                          <td className="px-4 py-2 text-xs text-slate-600">{el.domain}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-0.5 text-xs rounded font-medium ${TIER_COLORS[el.tier] ?? 'bg-slate-100 text-slate-500'}`}>
                              {el.tier}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center text-xs text-slate-600">{el.capabilitiesSupported}</td>
                          <td className="px-4 py-2 text-center">
                            <span className="text-xs font-mono text-slate-700">{el.score}</span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-0.5 text-xs rounded font-medium ${webocColor}`}>
                              {webocAvail}
                            </span>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {sharedElements.length > 30 && (
                    <p className="text-xs text-slate-400 mt-2 text-center">
                      Showing 30 of {sharedElements.length} shared elements
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
