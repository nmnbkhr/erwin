import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Star } from 'lucide-react'
import { loadCapabilities, loadDataRequirements, loadDependencies, loadReuseMatrix, loadEnrichment } from '../utils/dataLoader'
import type { Capability, DataRequirement, Dependency, ReusePair, EnrichmentData, EnrichmentEntry } from '../types'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON } from '../utils/export'

const THEME_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Marketing and Customer Experience': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  'Finance & Peformance Management': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Risk Management & Regulation': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
}

const DOMAIN_PILL_COLORS: Record<string, string> = {
  'Party Management': 'bg-blue-100 text-blue-700',
  'Agreement & Account': 'bg-indigo-100 text-indigo-700',
  'Campaign & Marketing': 'bg-teal-100 text-teal-700',
  'Product Management': 'bg-emerald-100 text-emerald-700',
  'Investment Management': 'bg-amber-100 text-amber-700',
  'Channel Management': 'bg-sky-100 text-sky-700',
  'Claims Management': 'bg-pink-100 text-pink-700',
  'Financial Transaction': 'bg-red-100 text-red-700',
  'Risk Management': 'bg-rose-100 text-rose-700',
  'Event Management': 'bg-lime-100 text-lime-700',
  'Web Analytics': 'bg-cyan-100 text-cyan-700',
  'Asset Management': 'bg-orange-100 text-orange-700',
  'Reference Data': 'bg-violet-100 text-violet-700',
  'Human Resources': 'bg-stone-100 text-stone-700',
  'Location & Geography': 'bg-teal-100 text-teal-700',
  'Other': 'bg-slate-100 text-slate-700',
}

const PHASE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Phase 1 (0-6 months)', color: 'bg-green-100 text-green-700' },
  2: { label: 'Phase 2 (6-18 months)', color: 'bg-blue-100 text-blue-700' },
  3: { label: 'Phase 3 (18-36 months)', color: 'bg-purple-100 text-purple-700' },
}

// C2: BACR category to theme mapping
const CATEGORY_THEME_MAP: Record<string, string[]> = {
  'Business': ['all'],
  'Culture': ['all'],
  'Governance': ['Finance & Peformance Management'],
  'Information': ['Marketing and Customer Experience'],
  'Applications': ['all'],
  'Systems': ['all'],
  'Agility': ['all'],
  'Outcomes': ['all'],
  'Overall Assessment': ['all'],
}

function getMaturityScore(themeName: string): { score: number; label: string } | null {
  try {
    const saved = localStorage.getItem('baiw-assessment')
    if (!saved) return null
    const parsed = JSON.parse(saved)
    if (!parsed || !parsed.answers || Object.keys(parsed.answers).length === 0) return null

    const allAnswers = Object.values(parsed.answers) as { currentState: number }[]
    if (allAnswers.length === 0) return null

    // Find relevant categories for this theme
    const relevantCategories: string[] = []
    Object.entries(CATEGORY_THEME_MAP).forEach(([cat, themes]) => {
      if (themes.includes('all') || themes.includes(themeName)) {
        relevantCategories.push(cat)
      }
    })

    // Average all answers as approximation
    const avg = allAnswers.reduce((s, a) => s + a.currentState, 0) / allAnswers.length
    const rounded = Math.round(avg * 10) / 10
    const labels = ['', 'Emerging', 'Developing', 'Practicing', 'Innovating', 'Leading']
    return { score: rounded, label: labels[Math.round(rounded)] || 'N/A' }
  } catch { return null }
}

export default function CapabilityNavigator() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [requirements, setRequirements] = useState<DataRequirement[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [reuseMatrix, setReuseMatrix] = useState<ReusePair[]>([])
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCap, setSelectedCap] = useState<Capability | null>(null)
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)

  useEffect(() => {
    Promise.all([
      loadCapabilities(), loadDataRequirements(), loadDependencies(), loadReuseMatrix(), loadEnrichment(),
    ]).then(([c, r, d, rm, enr]) => {
      setCapabilities(c)
      setRequirements(r)
      setDependencies(d)
      setReuseMatrix(rm)
      setEnrichment(enr)
      setLoading(false)

      const themeFilter = searchParams.get('theme')
      const capFilter = searchParams.get('cap')
      if (themeFilter) {
        setExpandedThemes(new Set([themeFilter]))
      }
      if (capFilter) {
        const cap = c.find((cap) => cap.id === capFilter)
        if (cap) {
          setSelectedCap(cap)
          setExpandedThemes(new Set([cap.themeName]))
          setExpandedGroups(new Set([cap.groupId]))
        }
      }
    })
  }, [])

  // C1: Critical capabilities from enrichment
  const criticalCapNames = useMemo(() => {
    if (!enrichment) return new Set<string>()
    const names = new Set<string>()
    Object.entries(enrichment.capabilities).forEach(([name, entry]) => {
      if (entry.priority === 'CRITICAL') names.add(name)
    })
    return names
  }, [enrichment])

  // C3: Dependency count per capability
  const depCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    dependencies.forEach((d) => {
      if (!map[d.capabilityId]) map[d.capabilityId] = 0
      map[d.capabilityId]++
    })
    // Deduplicate: count unique entities
    const uniqueMap: Record<string, Set<string>> = {}
    dependencies.forEach((d) => {
      if (!uniqueMap[d.capabilityId]) uniqueMap[d.capabilityId] = new Set()
      uniqueMap[d.capabilityId].add(d.entityId)
    })
    const result: Record<string, number> = {}
    Object.entries(uniqueMap).forEach(([capId, entitySet]) => {
      result[capId] = entitySet.size
    })
    return result
  }, [dependencies])

  // C3: Domain count per capability
  const domainCountMap = useMemo(() => {
    const uniqueMap: Record<string, Set<string>> = {}
    dependencies.forEach((d) => {
      if (!uniqueMap[d.capabilityId]) uniqueMap[d.capabilityId] = new Set()
      uniqueMap[d.capabilityId].add(d.domain)
    })
    const result: Record<string, number> = {}
    Object.entries(uniqueMap).forEach(([capId, domSet]) => {
      result[capId] = domSet.size
    })
    return result
  }, [dependencies])

  const hierarchy = useMemo(() => {
    const themes: Record<string, Record<string, Capability[]>> = {}
    capabilities.forEach((c) => {
      // C1: Filter if showing critical only
      if (showCriticalOnly && !criticalCapNames.has(c.name)) return
      if (!themes[c.themeName]) themes[c.themeName] = {}
      if (!themes[c.themeName][c.groupName]) themes[c.themeName][c.groupName] = []
      themes[c.themeName][c.groupName].push(c)
    })
    return themes
  }, [capabilities, showCriticalOnly, criticalCapNames])

  const capReqs = useMemo(() => {
    if (!selectedCap) return []
    return requirements.filter((r) => r.capabilityId === selectedCap.id)
  }, [selectedCap, requirements])

  const capDeps = useMemo(() => {
    if (!selectedCap) return []
    return dependencies.filter((d) => d.capabilityId === selectedCap.id)
  }, [selectedCap, dependencies])

  const relatedCaps = useMemo(() => {
    if (!selectedCap) return []
    const pairs = reuseMatrix
      .filter((p) => p.cap1Id === selectedCap.id || p.cap2Id === selectedCap.id)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
    return pairs.map((p) => {
      const otherId = p.cap1Id === selectedCap.id ? p.cap2Id : p.cap1Id
      const cap = capabilities.find((c) => c.id === otherId)
      return { cap, similarity: p.similarity }
    }).filter((r) => r.cap)
  }, [selectedCap, reuseMatrix, capabilities])

  const uniqueDeps = useMemo(() => {
    const seen = new Set<string>()
    return capDeps.filter((d) => {
      if (seen.has(d.entityId)) return false
      seen.add(d.entityId)
      return true
    })
  }, [capDeps])

  const capEnrichment: EnrichmentEntry | null = useMemo(() => {
    if (!selectedCap || !enrichment) return null
    return enrichment.capabilities[selectedCap.name] || null
  }, [selectedCap, enrichment])

  // C2: Maturity score
  const maturityScore = useMemo(() => {
    if (!selectedCap) return null
    return getMaturityScore(selectedCap.themeName)
  }, [selectedCap])

  if (loading) {
    return (
      <div className="flex gap-4 h-[calc(100vh-120px)]">
        <div className="w-[300px] bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="flex-1 bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="w-[250px] bg-white rounded-lg shadow-sm animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Every page needs exactly one h1 for the document outline: screen readers
          navigate by heading and these pages had none. Visually hidden because the
          page title is already communicated by the sidebar and header chrome. */}
      <h1 className="sr-only">Capability Navigator</h1>
      {/* Left: BVF Hierarchy Tree */}
      <div className="w-[300px] bg-white rounded-lg shadow-sm overflow-y-auto shrink-0">
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">BVF Capability Hierarchy</h3>
          </div>
          {/* C1: Show critical only toggle */}
          <label className="flex items-center gap-2 mt-2 text-xs text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showCriticalOnly}
              onChange={(e) => setShowCriticalOnly(e.target.checked)}
              className="rounded text-amber-500"
            />
            <Star size={12} className="text-amber-500 fill-amber-500" />
            Show critical only
          </label>
        </div>
        <div className="p-2">
          {Object.entries(hierarchy).map(([themeName, groups]) => {
            const themeStyle = THEME_COLORS[themeName] || THEME_COLORS['Risk Management & Regulation']
            const isThemeOpen = expandedThemes.has(themeName)
            return (
              <div key={themeName} className="mb-2">
                <button
                  onClick={() => setExpandedThemes((prev) => {
                    const next = new Set(prev)
                    if (next.has(themeName)) next.delete(themeName)
                    else next.add(themeName)
                    return next
                  })}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded ${themeStyle.bg} ${themeStyle.text}`}
                >
                  {isThemeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className={`w-2 h-2 rounded-full ${themeStyle.dot}`} />
                  <span className="truncate">{themeName}</span>
                </button>
                {isThemeOpen && Object.entries(groups).map(([groupName, caps]) => {
                  const groupId = caps[0]?.groupId || groupName
                  const isGroupOpen = expandedGroups.has(groupId)
                  return (
                    <div key={groupName} className="ml-4 mt-1">
                      <button
                        onClick={() => setExpandedGroups((prev) => {
                          const next = new Set(prev)
                          if (next.has(groupId)) next.delete(groupId)
                          else next.add(groupId)
                          return next
                        })}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded"
                      >
                        {isGroupOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span className="truncate">{groupName}</span>
                        <span className="ml-auto text-slate-400 text-xs">{caps.length}</span>
                      </button>
                      {isGroupOpen && (
                        <div className="ml-4 border-l border-slate-100 pl-2">
                          {caps.map((cap) => {
                            const isCritical = criticalCapNames.has(cap.name)
                            const depCount = depCountMap[cap.id] || 0
                            return (
                              <button
                                key={cap.id}
                                onClick={() => setSelectedCap(cap)}
                                className={`w-full text-left px-2 py-1.5 text-xs rounded truncate flex items-center gap-1 ${
                                  selectedCap?.id === cap.id
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {/* C1: Star for critical */}
                                {isCritical && <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />}
                                <span className="truncate">{cap.name}</span>
                                {/* C3: Dependency count badge */}
                                {depCount > 0 && (
                                  <span
                                    className={`ml-auto shrink-0 px-1 text-xs rounded ${
                                      depCount >= 20 ? 'bg-slate-600 text-white' :
                                      depCount >= 10 ? 'bg-slate-400 text-white' :
                                      'bg-slate-200 text-slate-600'
                                    }`}
                                    title={`Requires ${depCount} FSDM entities across ${domainCountMap[cap.id] || 0} domains`}
                                  >
                                    {depCount}
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

      {/* Center: Capability Detail */}
      <div className="flex-1 bg-white rounded-lg shadow-sm overflow-y-auto">
        {selectedCap ? (
          <div className="p-6">
            {/* Breadcrumb + Export */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span>{selectedCap.themeName}</span>
                <span>/</span>
                <span>{selectedCap.groupName}</span>
                <span>/</span>
                <span className="text-slate-700 font-medium">{selectedCap.name}</span>
              </div>
              <ExportMenu options={[
                { label: 'Export as JSON', onClick: () => downloadJSON({ capability: selectedCap, requirements: capReqs, dependencies: uniqueDeps, enrichment: capEnrichment }, `baiw-capability-${selectedCap.name}`) },
              ]} />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedCap.name}</h2>
            <p className="text-sm text-slate-600 mb-4">{selectedCap.description}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {PHASE_LABELS[selectedCap.phase] && (
                <span className={`px-2 py-1 text-xs rounded ${PHASE_LABELS[selectedCap.phase].color}`}>
                  {PHASE_LABELS[selectedCap.phase].label}
                </span>
              )}
              {/* C1: Critical badge */}
              {criticalCapNames.has(selectedCap.name) && (
                <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 flex items-center gap-1">
                  <Star size={10} className="fill-amber-500 text-amber-500" /> Critical for Pakistan
                </span>
              )}
              {/* C2: Maturity badge */}
              {maturityScore ? (
                <span className={`px-2 py-1 text-xs rounded ${
                  maturityScore.score >= 4 ? 'bg-green-100 text-green-700' :
                  maturityScore.score >= 2.5 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Maturity: {maturityScore.score}/5 ({maturityScore.label})
                </span>
              ) : (
                <button
                  onClick={() => navigate('/maturity')}
                  className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  Maturity: Not assessed →
                </button>
              )}
            </div>

            {/* Data Requirements */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Data Requirements ({capReqs.length})</h3>
              {capReqs.length > 0 ? (
                <ol className="space-y-2 list-decimal list-inside">
                  {capReqs.map((req) => (
                    <li key={req.id} className="text-sm text-slate-600">
                      <span>{req.description}</span>
                      <span className="ml-2 text-xs text-slate-400">({req.fsdmSubjectArea})</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-400">No specific data requirements listed</p>
              )}
            </div>

            {/* Required FSDM Entities */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Required FSDM Entities ({uniqueDeps.length})</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueDeps.slice(0, 30).map((dep) => (
                  <button
                    key={dep.entityId}
                    onClick={() => navigate(`/model?search=${encodeURIComponent(dep.entityName)}`)}
                    className={`px-2 py-1 text-xs rounded-full font-mono ${DOMAIN_PILL_COLORS[dep.domain] || 'bg-slate-100 text-slate-600'}`}
                  >
                    {dep.entityName}
                  </button>
                ))}
                {uniqueDeps.length > 30 && (
                  <span className="px-2 py-1 text-xs text-slate-400">+{uniqueDeps.length - 30} more</span>
                )}
              </div>
            </div>

            {/* Pakistan Banking Context */}
            {capEnrichment ? (
              <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-emerald-800">Pakistan Banking Context</h3>
                  <span className={`px-2 py-0.5 text-xs rounded font-medium ${capEnrichment.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {capEnrichment.priority} | {capEnrichment.investmentRange}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-emerald-700 mb-1">Objectives</p>
                    <ul className="space-y-1">
                      {capEnrichment.pakistanObjectives.map((obj, i) => (
                        <li key={i} className="text-emerald-600 text-xs flex gap-1">
                          <span className="shrink-0">-</span> {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700 mb-1">Data Sources</p>
                    <ul className="space-y-1">
                      {capEnrichment.pakistanDataSources.map((ds, i) => (
                        <li key={i} className="text-emerald-600 text-xs flex gap-1">
                          <span className="shrink-0">-</span> {ds}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700 mb-1">Expected Outcomes</p>
                    <ul className="space-y-1">
                      {capEnrichment.expectedOutcomes.map((eo, i) => (
                        <li key={i} className="text-emerald-600 text-xs flex gap-1">
                          <span className="shrink-0">-</span> {eo}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700 mb-1">Key Challenges</p>
                    <ul className="space-y-1">
                      {capEnrichment.keyChallenges.map((ch, i) => (
                        <li key={i} className="text-emerald-600 text-xs flex gap-1">
                          <span className="shrink-0">-</span> {ch}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {capEnrichment.fsdmEntities.map((e) => (
                    <button
                      key={e}
                      onClick={() => navigate(`/model?search=${encodeURIComponent(e)}`)}
                      className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded font-mono hover:bg-emerald-200"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 mb-2">Pakistan Banking Context</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-400 mb-1">Objectives</p>
                    <p className="text-slate-400 text-xs">Support SBP regulatory compliance and Islamic banking integration for {selectedCap.name.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-400 mb-1">Data Sources</p>
                    <p className="text-slate-400 text-xs">FSDM warehouse data</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-400 mb-1">Expected Outcomes</p>
                    <p className="text-slate-400 text-xs">Improved analytics capability</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-400 mb-1">Key Challenges</p>
                    <p className="text-slate-400 text-xs">Data integration across core systems, analytics talent scarcity</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 italic">Detailed Pakistan context available in BVF prompt files.</p>
              </div>
            )}

            {/* Implementation */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Implementation</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Phase</p>
                  <p className="font-medium text-slate-700">{selectedCap.phase}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Est. Investment</p>
                  <p className="font-medium text-slate-700">
                    PKR {selectedCap.phase === 1 ? '50-150M' : selectedCap.phase === 2 ? '100-300M' : '200-500M'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Quick Wins</p>
                  <p className="font-medium text-slate-700">{selectedCap.phase === 1 ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Select a capability to view details</p>
          </div>
        )}
      </div>

      {/* Right: Related Capabilities */}
      <div className="w-[250px] bg-white rounded-lg shadow-sm overflow-y-auto shrink-0">
        <div className="p-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Related Capabilities</h3>
        </div>
        {selectedCap && relatedCaps.length > 0 ? (
          <div className="p-3 space-y-2">
            {relatedCaps.map((r, i) => (
              <button
                key={i}
                onClick={() => r.cap && setSelectedCap(r.cap)}
                className="w-full text-left p-2 bg-slate-50 rounded hover:bg-blue-50"
              >
                <p className="text-xs font-medium text-slate-700 truncate">{r.cap?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Similarity: {(r.similarity * 100).toFixed(0)}%
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 text-xs text-slate-400">
            {selectedCap ? 'No related capabilities found' : 'Select a capability'}
          </div>
        )}
      </div>
    </div>
  )
}
