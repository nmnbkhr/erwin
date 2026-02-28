import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadCapabilities, loadDependencies, loadEnrichment } from '../utils/dataLoader'
import type { Capability, Dependency, EnrichmentData } from '../types'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'
import { useRoadmapState } from '../hooks/useRoadmapState'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON, downloadPDF } from '../utils/export'

const TEMPLATES: Record<string, { label: string; description: string; capNames: string[] }> = {
  quickWins: {
    label: 'Quick Wins',
    description: '6 foundation capabilities achievable in Phase 1',
    capNames: ['Customer Profitability Analysis', 'Reconciliation Automation', 'Close Process Management', 'Regulatory Reporting', 'KPI Factory', 'Liquidity Risk Analytics'],
  },
  profitability: {
    label: 'Profitability Engine',
    description: '8 capabilities for comprehensive profitability analytics',
    capNames: ['Customer Profitability Analysis', 'Activity-Based Costing', 'RAROC Analytics', 'Funds Transfer Pricing', 'Revenue Analytics', 'Loan Pricing Analytics', 'Performance Dashboard', 'Budget vs Actual Analysis'],
  },
  regulatory: {
    label: 'Regulatory Compliance',
    description: '6 capabilities for regulatory and compliance',
    capNames: ['Regulatory Reporting', 'External Financial Reporting', 'Exception Reporting', 'AML Analytics', 'KYC Analytics', 'Basel III Reporting'],
  },
  digital: {
    label: 'Digital Transformation',
    description: '7 capabilities for digital channel analytics',
    capNames: ['Omni-Channel Analytics', 'Digital Onboarding Analytics', 'Card Spend Stimulation', 'Mobile Banking Analytics', 'Campaign Management', 'Next Best Action', 'A/B Testing Framework'],
  },
  full: {
    label: 'Full BVF',
    description: 'All 112 capabilities across all themes',
    capNames: [],
  },
}

const PHASE_COLORS = [
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', header: 'bg-green-100' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', header: 'bg-blue-100' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', header: 'bg-purple-100' },
]

export default function RoadmapBuilder() {
  const navigate = useNavigate()
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const { selectedCaps, setSelectedCaps, resetRoadmap, lastUpdated } = useRoadmapState()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // R1: Investment Calculator sliders
  const [teamSize, setTeamSize] = useState(5)
  const [duration, setDuration] = useState(18)
  const [techCost, setTechCost] = useState(50)

  useEffect(() => {
    Promise.all([loadCapabilities(), loadDependencies(), loadEnrichment()]).then(([c, d, e]) => {
      setCapabilities(c)
      setDependencies(d)
      setEnrichment(e)
      setLoading(false)
    })
  }, [])

  const groupedCaps = useMemo(() => {
    const groups: Record<string, Capability[]> = {}
    capabilities.forEach((c) => {
      if (!groups[c.groupName]) groups[c.groupName] = []
      groups[c.groupName].push(c)
    })
    return groups
  }, [capabilities])

  const toggleCap = (id: string) => {
    setSelectedCaps((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyTemplate = (templateKey: string) => {
    const template = TEMPLATES[templateKey]
    if (templateKey === 'full') {
      setSelectedCaps(new Set(capabilities.map((c) => c.id)))
    } else {
      const ids = capabilities
        .filter((c) => template.capNames.some((n) => c.name.includes(n) || n.includes(c.name)))
        .map((c) => c.id)
      setSelectedCaps(new Set(ids))
    }
  }

  const selectedCapsList = useMemo(() => {
    return capabilities.filter((c) => selectedCaps.has(c.id))
  }, [capabilities, selectedCaps])

  // R3: Phase suggestions from enrichment
  const phaseSuggestions = useMemo(() => {
    if (!enrichment) return null
    const suggestions: Record<number, string[]> = { 1: [], 2: [], 3: [] }
    selectedCapsList.forEach((cap) => {
      const enr = enrichment.capabilities[cap.name]
      if (enr) {
        const phase = enr.implementationPhase
        if (suggestions[phase]) suggestions[phase].push(cap.name)
      }
    })
    const hasAny = Object.values(suggestions).some((arr) => arr.length > 0)
    return hasAny ? suggestions : null
  }, [selectedCapsList, enrichment])

  const phases = useMemo(() => {
    return [1, 2, 3].map((phase) => {
      const phaseCaps = selectedCapsList.filter((c) => c.phase === phase)
      const capIds = new Set(phaseCaps.map((c) => c.id))
      const entityDeps = dependencies.filter((d) => capIds.has(d.capabilityId))
      const uniqueEntities = new Set(entityDeps.map((d) => d.entityId))
      const dataReqs = phaseCaps.reduce((sum, c) => sum + c.dataReqCount, 0)
      return {
        phase,
        capabilities: phaseCaps,
        entityCount: uniqueEntities.size,
        dataReqCount: dataReqs,
        investment: phase === 1 ? '50-200M' : phase === 2 ? '200-500M' : '500M-1.5B',
        timeline: phase === 1 ? '0-6 months' : phase === 2 ? '6-18 months' : '18-36 months',
      }
    })
  }, [selectedCapsList, dependencies])

  // R2: Shared Data Requirements
  const sharedEntities = useMemo(() => {
    if (selectedCaps.size < 2) return []
    const entityCapMap: Record<string, { entityName: string; domain: string; caps: Set<string> }> = {}
    dependencies.forEach((d) => {
      if (!selectedCaps.has(d.capabilityId)) return
      if (!entityCapMap[d.entityId]) {
        entityCapMap[d.entityId] = { entityName: d.entityName, domain: d.domain, caps: new Set() }
      }
      entityCapMap[d.entityId].caps.add(d.capabilityName)
    })
    return Object.entries(entityCapMap)
      .filter(([, v]) => v.caps.size >= 2)
      .map(([id, v]) => ({ entityId: id, ...v, usedBy: v.caps.size, capNames: [...v.caps] }))
      .sort((a, b) => b.usedBy - a.usedBy)
      .slice(0, 15)
  }, [dependencies, selectedCaps])

  // R1: Investment calculations
  const investmentCalc = useMemo(() => {
    const personnel = teamSize * 150 * duration // PKR thousands (150K/mo)
    const consulting = Math.round(personnel * 0.18)
    const subtotal = personnel + techCost * 1000 + consulting
    const contingency = Math.round(subtotal * 0.10)
    const total = subtotal + contingency
    const avgEntities = selectedCaps.size > 0
      ? new Set(dependencies.filter((d) => selectedCaps.has(d.capabilityId)).map((d) => d.entityId)).size / selectedCaps.size
      : 0
    const complexity = Math.round((selectedCaps.size * avgEntities / 100) * 10) / 10

    return {
      personnel: Math.round(personnel / 1000), // in millions
      techCost,
      consulting: Math.round(consulting / 1000),
      contingency: Math.round(contingency / 1000),
      total: Math.round(total / 1000),
      complexity: Math.min(10, complexity),
    }
  }, [teamSize, duration, techCost, selectedCaps, dependencies])

  const totalInvestment = useMemo(() => {
    const total = selectedCapsList.length
    if (total === 0) return 'PKR 0'
    if (total <= 10) return 'PKR 200-500M'
    if (total <= 30) return 'PKR 500M-1.5B'
    if (total <= 60) return 'PKR 1.5-3B'
    return 'PKR 3-5B'
  }, [selectedCapsList])

  if (loading) {
    return <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-120px)] animate-pulse" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">Last saved: {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedCaps.size > 0 && (
            <button
              onClick={() => { if (confirm('Reset all roadmap selections?')) resetRoadmap() }}
              className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
            >
              Reset Roadmap
            </button>
          )}
          <ExportMenu options={[
            { label: 'Export as JSON', onClick: () => downloadJSON({ selectedCapabilities: selectedCapsList, phases, totalInvestment, investmentCalc, sharedEntities }, 'baiw-roadmap') },
            { label: 'Export as PDF', onClick: () => downloadPDF('page-roadmap', 'baiw-roadmap', 'BAIW Implementation Roadmap') },
          ]} />
        </div>
      </div>

      <div id="page-roadmap" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Capability Picker */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Templates</h3>
            <div className="space-y-2">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key)}
                  className="w-full text-left p-2 text-sm bg-slate-50 rounded hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="font-medium">{template.label}</span>
                  <span className="text-xs text-slate-400 block">{template.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-y-auto max-h-[calc(100vh-360px)]">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Select Capabilities ({selectedCaps.size}/{capabilities.length})
              </h3>
              <button onClick={() => setSelectedCaps(new Set())} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
            </div>
            <div className="p-2">
              {Object.entries(groupedCaps).map(([groupName, caps]) => {
                const isOpen = expandedGroups.has(groupName)
                const selectedInGroup = caps.filter((c) => selectedCaps.has(c.id)).length
                return (
                  <div key={groupName} className="mb-1">
                    <button
                      onClick={() => setExpandedGroups((prev) => {
                        const next = new Set(prev)
                        if (next.has(groupName)) next.delete(groupName)
                        else next.add(groupName)
                        return next
                      })}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded"
                    >
                      {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <span className="flex-1 text-left truncate font-medium">{groupName}</span>
                      {selectedInGroup > 0 && <span className="text-blue-600 text-xs">{selectedInGroup}/{caps.length}</span>}
                    </button>
                    {isOpen && (
                      <div className="ml-4 space-y-0.5">
                        {caps.map((cap) => (
                          <label key={cap.id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded cursor-pointer">
                            <input type="checkbox" checked={selectedCaps.has(cap.id)} onChange={() => toggleCap(cap.id)} className="rounded text-blue-600" />
                            <span className="truncate">{cap.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Generated Roadmap */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCaps.size === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 flex items-center justify-center text-slate-400">
              <p>Select capabilities or use a template to generate a roadmap</p>
            </div>
          ) : (
            <>
              {/* R3: Phase Suggestions */}
              {phaseSuggestions && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-xs text-slate-500 mb-2">Phases auto-suggested based on complexity and dependencies (from enrichment data)</p>
                  <div className="flex gap-4">
                    {[1, 2, 3].map((p) => (
                      phaseSuggestions[p]?.length > 0 && (
                        <div key={p} className="flex-1">
                          <p className="text-xs font-medium text-slate-700 mb-1">Phase {p}:</p>
                          <div className="flex flex-wrap gap-1">
                            {phaseSuggestions[p].map((name) => (
                              <span key={name} className="text-xs bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[140px]">{name}</span>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Gantt-style Timeline */}
              <div className="space-y-4">
                {phases.filter((p) => p.capabilities.length > 0).map((phase) => {
                  const colors = PHASE_COLORS[phase.phase - 1]
                  return (
                    <div key={phase.phase} className={`rounded-lg border ${colors.border} overflow-hidden`}>
                      <div className={`px-4 py-3 ${colors.header} flex items-center justify-between`}>
                        <div>
                          <h4 className={`text-sm font-semibold ${colors.text}`}>
                            Phase {phase.phase}: {phase.timeline}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {phase.phase === 1 ? 'Foundation' : phase.phase === 2 ? 'Optimization' : 'Advanced Analytics'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{phase.capabilities.length} capabilities</p>
                          <p className="text-xs text-slate-500">PKR {phase.investment}</p>
                        </div>
                      </div>
                      <div className={`p-4 ${colors.bg}`}>
                        <div className="grid grid-cols-2 gap-4 mb-3 text-xs text-slate-600">
                          <div>FSDM Entities: <span className="font-medium">{phase.entityCount}</span></div>
                          <div>Data Requirements: <span className="font-medium">{phase.dataReqCount}</span></div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.capabilities.map((cap) => (
                            <span key={cap.id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white rounded border border-slate-200">
                              <Check size={10} className={colors.text} />
                              {cap.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* R2: Shared Data Foundation */}
              {sharedEntities.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-base font-semibold text-slate-700 mb-2">Shared Data Foundation</h3>
                  <p className="text-xs text-slate-500 mb-4">These FSDM entities are needed by multiple selected capabilities — build them first to unlock multiple use cases.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Entity</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Domain</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-slate-500">Used By</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Capabilities</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sharedEntities.map((se) => (
                          <tr key={se.entityId} className="border-t border-slate-100">
                            <td className="px-4 py-2">
                              <button
                                onClick={() => navigate(`/model?search=${encodeURIComponent(se.entityName)}`)}
                                className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                              >
                                {se.entityName}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-500">{se.domain}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">{se.usedBy} caps</span>
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-500">
                              {se.capNames.slice(0, 3).join(', ')}
                              {se.capNames.length > 3 && ` +${se.capNames.length - 3}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* R1: Investment Calculator */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-700 mb-4">Investment Calculator</h3>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Team Size: {teamSize} FTEs</label>
                    <input type="range" min={2} max={15} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="w-full accent-blue-600" />
                    <div className="flex justify-between text-xs text-slate-400"><span>2</span><span>15</span></div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Duration: {duration} months</label>
                    <input type="range" min={6} max={36} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-blue-600" />
                    <div className="flex justify-between text-xs text-slate-400"><span>6</span><span>36</span></div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Technology: PKR {techCost}M</label>
                    <input type="range" min={20} max={200} step={10} value={techCost} onChange={(e) => setTechCost(Number(e.target.value))} className="w-full accent-blue-600" />
                    <div className="flex justify-between text-xs text-slate-400"><span>20M</span><span>200M</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Personnel:</span><span className="font-medium">PKR {investmentCalc.personnel}M</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Technology:</span><span className="font-medium">PKR {investmentCalc.techCost}M</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Consulting (18%):</span><span className="font-medium">PKR {investmentCalc.consulting}M</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Contingency (10%):</span><span className="font-medium">PKR {investmentCalc.contingency}M</span></div>
                    <div className="flex justify-between border-t pt-2 font-bold text-slate-800">
                      <span>TOTAL:</span><span>PKR {investmentCalc.total}M</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-4">
                    <p className="text-3xl font-bold text-slate-800">{investmentCalc.complexity}/10</p>
                    <p className="text-xs text-slate-500 mt-1">Complexity Score</p>
                    <p className="text-xs text-slate-400">({selectedCaps.size} capabilities selected)</p>
                  </div>
                </div>
              </div>

              {/* Investment Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-700 mb-4">Investment Summary</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-800">{totalInvestment}</p>
                    <p className="text-xs text-slate-500 mt-1">Total Estimated Investment</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-800">{selectedCaps.size}</p>
                    <p className="text-xs text-slate-500 mt-1">Capabilities Selected</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-800">
                      {new Set(dependencies.filter((d) => selectedCaps.has(d.capabilityId)).map((d) => d.entityId)).size}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">FSDM Entities Required</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-700">
                    Expected ROI: 15-25% improvement in operational efficiency, 30-40% reduction in regulatory reporting time,
                    enhanced customer analytics driving 10-15% revenue uplift through cross-sell/upsell optimization.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
