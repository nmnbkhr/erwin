import { useState, useEffect, useMemo, useCallback } from 'react'
import { loadCapabilities, loadFhirResources } from '../data'
import type { HaiwCapability, HaiwFhirResource } from '../types'
import { usePersistedState } from '../../engagement/usePersistedState'

/** Base key only — the value is filed under the active engagement. */
const STORAGE_KEY = 'haiw_roadmap_selections'

// ---------- Template Definitions ----------

interface Template {
  label: string
  description: string
  filter: (cap: HaiwCapability) => boolean
}

const TEMPLATES: Template[] = [
  {
    label: 'Quick Wins',
    description: 'Capabilities requiring maturity level 1–2',
    filter: (c) => c.maturityLevelRequired <= 2,
  },
  {
    label: 'Patient Safety First',
    description: 'Theme 1 Group 1.3 + Theme 2 Group 2.2',
    filter: (c) => c.groupId === '1.3' || c.groupId === '2.2',
  },
  {
    label: 'Revenue Cycle',
    description: 'All capabilities in Theme 3',
    filter: (c) => c.themeId === 3,
  },
  {
    label: 'Population Health',
    description: 'All capabilities in Theme 5',
    filter: (c) => c.themeId === 5,
  },
  {
    label: 'UHC Readiness',
    description: 'Cross-theme essentials for Universal Health Coverage',
    filter: (c) =>
      (c.themeId === 1 && c.maturityLevelRequired <= 3) ||
      (c.themeId === 2 && c.maturityLevelRequired <= 2) ||
      (c.themeId === 4 && c.maturityLevelRequired <= 3) ||
      (c.themeId === 5) ||
      (c.themeId === 6 && c.maturityLevelRequired <= 2),
  },
  {
    label: 'Full HCF',
    description: 'All 108 capabilities',
    filter: () => true,
  },
]

// ---------- Phase definitions ----------

interface Phase {
  label: string
  range: string
  months: [number, number]
  levels: number[]
  color: string
  bg: string
  border: string
}

const PHASES: Phase[] = [
  { label: 'Phase 1: Foundation', range: 'Months 1–8', months: [1, 8], levels: [1, 2], color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  { label: 'Phase 2: Integration', range: 'Months 9–16', months: [9, 16], levels: [3], color: 'text-emerald-600', bg: 'bg-teal-50', border: 'border-teal-300' },
  { label: 'Phase 3: Intelligence', range: 'Months 17–24', months: [17, 24], levels: [4, 5], color: 'text-teal-700', bg: 'bg-cyan-50', border: 'border-cyan-300' },
]

// ---------- Helpers ----------

function formatPKR(value: number): string {
  if (value >= 1_000_000_000) return `PKR ${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `PKR ${(value / 1_000_000).toFixed(0)}M`
  return `PKR ${value.toLocaleString()}`
}

// ---------- Component ----------

export default function HealthRoadmapBuilder() {
  const [loading, setLoading] = useState(true)
  const [capabilities, setCapabilities] = useState<HaiwCapability[]>([])
  const [fhirResources, setFhirResources] = useState<HaiwFhirResource[]>([])
  // Persisted as a plain id array (a Set does not survive JSON) but exposed as a
  // Set, so every call site below is unchanged.
  const [savedIds, setSavedIds] = usePersistedState<string[]>(STORAGE_KEY, [], Array.isArray)
  const selectedIds = useMemo(() => new Set(savedIds), [savedIds])
  const setSelectedIds = useCallback(
    (next: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      setSavedIds((prev) => [...(typeof next === 'function' ? next(new Set(prev)) : next)])
    },
    [setSavedIds],
  )

  // Investment calculator state
  const [teamSize, setTeamSize] = useState(15)
  const [infraBudget, setInfraBudget] = useState(100_000_000)
  const [timeline, setTimeline] = useState(24)

  // Accordion: which themes are expanded
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set())

  // Selections load and persist through usePersistedState, per engagement

  // Load data
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const [caps, res] = await Promise.all([loadCapabilities(), loadFhirResources()])
        if (cancelled) return
        setCapabilities(caps)
        setFhirResources(res)
      } catch (err) {
        console.error('HealthRoadmapBuilder: failed to load data', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  // Capabilities grouped by theme
  const themeGroups = useMemo(() => {
    const map = new Map<string, { themeId: number; themeColor: string; caps: HaiwCapability[] }>()
    for (const cap of capabilities) {
      if (!map.has(cap.theme)) {
        map.set(cap.theme, { themeId: cap.themeId, themeColor: cap.themeColor, caps: [] })
      }
      map.get(cap.theme)!.caps.push(cap)
    }
    return [...map.entries()].sort((a, b) => a[1].themeId - b[1].themeId)
  }, [capabilities])

  // Selected capabilities
  const selectedCaps = useMemo(
    () => capabilities.filter((c) => selectedIds.has(c.id)),
    [capabilities, selectedIds],
  )

  // Shared FHIR resources (used by 2+ selected capabilities)
  const sharedResources = useMemo(() => {
    const resourceUsage = new Map<string, Set<string>>()
    for (const cap of selectedCaps) {
      for (const resName of cap.fhirResources) {
        if (!resourceUsage.has(resName)) resourceUsage.set(resName, new Set())
        resourceUsage.get(resName)!.add(cap.id)
      }
    }
    const shared: { name: string; category: string; usedBy: number; capabilities: string[] }[] = []
    for (const [resName, capIds] of resourceUsage) {
      if (capIds.size >= 2) {
        const fhir = fhirResources.find((r) => r.name === resName)
        shared.push({
          name: resName,
          category: fhir?.category ?? 'Unknown',
          usedBy: capIds.size,
          capabilities: [...capIds].map((id) => capabilities.find((c) => c.id === id)?.name ?? id),
        })
      }
    }
    return shared.sort((a, b) => b.usedBy - a.usedBy)
  }, [selectedCaps, fhirResources, capabilities])

  // Investment calculations
  const investment = useMemo(() => {
    const avgSalary = 2_400_000 // PKR per person per year
    const peopleCost = teamSize * avgSalary * (timeline / 12)
    const total = peopleCost + infraBudget
    const capCount = selectedCaps.length || 1
    const costPerCap = total / capCount
    const roiMultiplier = selectedCaps.length <= 10 ? 2 : selectedCaps.length <= 30 ? 3 : selectedCaps.length <= 60 ? 4 : 5
    return {
      total,
      costPerCap,
      roiMultiplier,
      people: total * 0.60,
      technology: total * 0.25,
      training: total * 0.10,
      contingency: total * 0.05,
    }
  }, [teamSize, infraBudget, timeline, selectedCaps.length])

  // Gantt data
  const ganttPhases = useMemo(() => {
    return PHASES.map((phase) => ({
      ...phase,
      caps: selectedCaps.filter((c) => phase.levels.includes(c.maturityLevelRequired)),
    }))
  }, [selectedCaps])

  // Toggle helpers
  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [setSelectedIds])

  const selectAllInTheme = useCallback((caps: HaiwCapability[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      caps.forEach((c) => next.add(c.id))
      return next
    })
  }, [setSelectedIds])

  const clearAllInTheme = useCallback((caps: HaiwCapability[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      caps.forEach((c) => next.delete(c.id))
      return next
    })
  }, [setSelectedIds])

  const applyTemplate = useCallback(
    (template: Template) => {
      const ids = capabilities.filter(template.filter).map((c) => c.id)
      setSelectedIds(new Set(ids))
    },
    [capabilities, setSelectedIds],
  )

  const toggleTheme = useCallback((theme: string) => {
    setExpandedThemes((prev) => {
      const next = new Set(prev)
      if (next.has(theme)) next.delete(theme)
      else next.add(theme)
      return next
    })
  }, [])

  // Export
  const exportRoadmap = useCallback(() => {
    const blob = {
      exportedAt: new Date().toISOString(),
      selectedCapabilities: selectedCaps.map((c) => ({
        id: c.id,
        name: c.name,
        theme: c.theme,
        themeId: c.themeId,
        group: c.group,
        groupId: c.groupId,
        maturityLevelRequired: c.maturityLevelRequired,
        fhirResources: c.fhirResources,
        phase: c.maturityLevelRequired <= 2 ? 1 : c.maturityLevelRequired === 3 ? 2 : 3,
      })),
      phases: ganttPhases.map((p) => ({
        label: p.label,
        range: p.range,
        capabilityCount: p.caps.length,
      })),
      investment: {
        teamSize,
        infraBudgetPKR: infraBudget,
        timelineMonths: timeline,
        totalInvestmentPKR: investment.total,
        costPerCapabilityPKR: investment.costPerCap,
        expectedROI: `${investment.roiMultiplier}x`,
        breakdown: {
          peoplePKR: investment.people,
          technologyPKR: investment.technology,
          trainingPKR: investment.training,
          contingencyPKR: investment.contingency,
        },
      },
      sharedFhirResources: sharedResources,
    }
    const json = JSON.stringify(blob, null, 2)
    const file = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = `haiw-roadmap-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [selectedCaps, ganttPhases, teamSize, infraBudget, timeline, investment, sharedResources])

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-emerald-700 font-medium">Loading capabilities &amp; resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Health Roadmap Builder</h1>
        <p className="text-emerald-100 text-lg">
          Select capabilities, visualize phased implementation, and estimate investment for your healthcare analytics journey.
        </p>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">{selectedIds.size} / {capabilities.length} selected</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{ganttPhases[0].caps.length} Phase 1</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{ganttPhases[1].caps.length} Phase 2</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{ganttPhases[2].caps.length} Phase 3</span>
          <button
            onClick={exportRoadmap}
            disabled={selectedIds.size === 0}
            className="ml-auto bg-white text-emerald-700 font-semibold px-5 py-2 rounded-lg hover:bg-emerald-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export Roadmap
          </button>
        </div>
      </div>

      {/* Templates */}
      <section>
        <h2 className="text-xl font-bold text-emerald-800 mb-3">Quick-Select Templates</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => applyTemplate(t)}
              className="border-2 border-emerald-200 rounded-xl p-3 text-left hover:border-emerald-500 hover:bg-emerald-50 transition group"
            >
              <span className="font-semibold text-emerald-700 group-hover:text-emerald-900 text-sm block">{t.label}</span>
              <span className="text-xs text-gray-500 mt-1 block leading-snug">{t.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Capability Picker */}
      <section>
        <h2 className="text-xl font-bold text-emerald-800 mb-3">Capability Picker</h2>
        <div className="space-y-2">
          {themeGroups.map(([theme, { caps }]) => {
            const isExpanded = expandedThemes.has(theme)
            const selectedInTheme = caps.filter((c) => selectedIds.has(c.id)).length
            return (
              <div key={theme} className="border border-emerald-200 rounded-xl overflow-hidden">
                {/* Theme header */}
                <button
                  onClick={() => toggleTheme(theme)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-emerald-50 hover:bg-emerald-100 transition"
                >
                  <span className="font-semibold text-emerald-800">{theme}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {selectedInTheme}/{caps.length} selected
                    </span>
                    <svg
                      className={`w-5 h-5 text-emerald-600 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4">
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => selectAllInTheme(caps)}
                        className="text-xs font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg hover:bg-emerald-200 transition"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => clearAllInTheme(caps)}
                        className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {caps.map((cap) => (
                        <label
                          key={cap.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                            selectedIds.has(cap.id)
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(cap.id)}
                            onChange={() => toggle(cap.id)}
                            className="mt-0.5 accent-emerald-600 w-4 h-4 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-800 block truncate">{cap.name}</span>
                            <span className="text-xs text-gray-500">
                              {cap.groupId} &middot; Maturity {cap.maturityLevelRequired}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 3-Phase Gantt */}
      {selectedIds.size > 0 && (
        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-3">3-Phase Implementation Gantt</h2>
          <div className="relative border border-emerald-200 rounded-2xl overflow-hidden">
            {/* Timeline header */}
            <div className="flex bg-emerald-50 border-b border-emerald-200">
              {PHASES.map((phase) => (
                <div key={phase.label} className="flex-1 text-center py-2 border-r last:border-r-0 border-emerald-200">
                  <span className={`font-semibold text-sm ${phase.color}`}>{phase.label}</span>
                  <span className="block text-xs text-gray-500">{phase.range}</span>
                </div>
              ))}
            </div>

            {/* Month markers */}
            <div className="flex border-b border-emerald-100">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-xs text-gray-400 py-1 border-r border-emerald-50 last:border-r-0"
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Phase lanes */}
            <div className="flex min-h-[200px]">
              {ganttPhases.map((phase) => (
                <div
                  key={phase.label}
                  className={`flex-1 p-3 border-r last:border-r-0 border-emerald-100 ${phase.bg}`}
                >
                  {phase.caps.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center mt-8">No capabilities in this phase</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {phase.caps.map((cap) => (
                        <div
                          key={cap.id}
                          className={`text-xs px-2 py-1 rounded-md font-medium truncate max-w-[180px] border ${phase.border} ${phase.bg} ${phase.color}`}
                          title={`${cap.name} (Maturity ${cap.maturityLevelRequired})`}
                        >
                          {cap.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PKR Investment Calculator */}
      <section>
        <h2 className="text-xl font-bold text-emerald-800 mb-3">PKR Investment Calculator</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sliders */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Team Size</span>
                <span className="font-bold text-emerald-700">{teamSize} people</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={1}
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>5</span><span>50</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Infrastructure Budget</span>
                <span className="font-bold text-emerald-700">{formatPKR(infraBudget)}</span>
              </div>
              <input
                type="range"
                min={10_000_000}
                max={500_000_000}
                step={10_000_000}
                value={infraBudget}
                onChange={(e) => setInfraBudget(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>PKR 10M</span><span>PKR 500M</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Timeline</span>
                <span className="font-bold text-emerald-700">{timeline} months</span>
              </div>
              <input
                type="range"
                min={12}
                max={36}
                step={1}
                value={timeline}
                onChange={(e) => setTimeline(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>12 mo</span><span>36 mo</span>
              </div>
            </div>
          </div>

          {/* Calculated outputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Total Investment</p>
                <p className="text-xl font-bold text-emerald-800 mt-1">{formatPKR(investment.total)}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Cost / Capability</p>
                <p className="text-xl font-bold text-emerald-800 mt-1">{formatPKR(Math.round(investment.costPerCap))}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center col-span-2">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Expected ROI</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{investment.roiMultiplier}x</p>
                <p className="text-xs text-gray-500 mt-1">Based on {selectedCaps.length} selected capabilities</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-white border border-emerald-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-emerald-800 mb-3">Cost Breakdown</p>
              {[
                { label: 'People (60%)', value: investment.people, pct: 60, color: 'bg-emerald-500' },
                { label: 'Technology (25%)', value: investment.technology, pct: 25, color: 'bg-teal-500' },
                { label: 'Training (10%)', value: investment.training, pct: 10, color: 'bg-cyan-500' },
                { label: 'Contingency (5%)', value: investment.contingency, pct: 5, color: 'bg-emerald-300' },
              ].map((item) => (
                <div key={item.label} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-gray-800">{formatPKR(Math.round(item.value))}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Shared Data Foundation */}
      {selectedIds.size > 0 && sharedResources.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-emerald-800 mb-3">Shared Data Foundation</h2>
          <p className="text-sm text-gray-500 mb-3">
            FHIR resources used by 2 or more selected capabilities — shared investments that multiply value.
          </p>
          <div className="overflow-x-auto border border-emerald-200 rounded-2xl">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-emerald-50 text-emerald-800">
                  <th className="text-left px-4 py-3 font-semibold">Resource Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-center px-4 py-3 font-semibold">Used By</th>
                  <th className="text-left px-4 py-3 font-semibold">Capabilities</th>
                </tr>
              </thead>
              <tbody>
                {sharedResources.map((res, i) => (
                  <tr key={res.name} className={i % 2 === 0 ? 'bg-white' : 'bg-emerald-50/40'}>
                    <td className="px-4 py-2 font-medium text-emerald-700">{res.name}</td>
                    <td className="px-4 py-2 text-gray-600">{res.category}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {res.usedBy}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 text-xs leading-relaxed">
                      {res.capabilities.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Empty state */}
      {selectedIds.size === 0 && (
        <div className="text-center py-16 bg-emerald-50 rounded-2xl border border-emerald-200">
          <svg className="w-16 h-16 mx-auto text-emerald-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-emerald-700">No capabilities selected</h3>
          <p className="text-sm text-gray-500 mt-1">Choose a template above or expand themes to pick individual capabilities.</p>
        </div>
      )}
    </div>
  )
}
