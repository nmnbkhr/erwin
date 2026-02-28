import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, X, GitBranch } from 'lucide-react'
import {
  loadEntityIndex, loadDomains, loadDependencies, loadReuseScores,
  loadInheritanceTree, loadDomainEntities, loadDomainAttributes, loadDomainRelationships, prefetchDomain,
} from '../utils/dataLoader'
import type { Entity, EntityIndexEntry, Attribute, Relationship, Domain, Dependency, ReuseScore, InheritanceEntry } from '../types'
import { searchEntityIndex } from '../utils/search'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON, downloadCSV } from '../utils/export'

const DOMAIN_COLORS: Record<string, string> = {
  'Party Management': 'bg-blue-500',
  'Agreement & Account': 'bg-indigo-500',
  'Campaign & Marketing': 'bg-teal-500',
  'Product Management': 'bg-emerald-500',
  'Investment Management': 'bg-amber-500',
  'Channel Management': 'bg-sky-500',
  'Claims Management': 'bg-pink-500',
  'Financial Transaction': 'bg-red-500',
  'Risk Management': 'bg-rose-500',
  'Event Management': 'bg-lime-500',
  'Web Analytics': 'bg-cyan-500',
  'Asset Management': 'bg-orange-500',
  'Reference Data': 'bg-violet-500',
  'Human Resources': 'bg-stone-500',
  'Location & Geography': 'bg-teal-500',
  'Other': 'bg-slate-500',
}

const TIER_COLORS: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-yellow-100 text-yellow-700',
  P4: 'bg-slate-100 text-slate-600',
}

const TIER_OPTIONS = ['All', 'P1', 'P2', 'P3', 'P4']

export default function ModelExplorer() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [entityIndex, setEntityIndex] = useState<EntityIndexEntry[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [reuseScores, setReuseScores] = useState<ReuseScore[]>([])
  const [inheritanceTree, setInheritanceTree] = useState<InheritanceEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Domain-loaded data (lazy per domain)
  const [domainEntities, setDomainEntities] = useState<Record<string, Entity[]>>({})
  const [domainAttributes, setDomainAttributes] = useState<Record<string, Attribute[]>>({})
  const [domainRelationships, setDomainRelationships] = useState<Record<string, Relationship[]>>({})
  const [loadingDomain, setLoadingDomain] = useState<string | null>(null)

  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [domainFilter, setDomainFilter] = useState(searchParams.get('domain') || '')
  const [domainLimits, setDomainLimits] = useState<Record<string, number>>({})
  const [tierFilter, setTierFilter] = useState('All')
  const [breadcrumbs, setBreadcrumbs] = useState<Entity[]>([])
  // M4: Entity Comparison
  const [compareMode, setCompareMode] = useState(false)
  const [compareEntities, setCompareEntities] = useState<Entity[]>([])

  useEffect(() => {
    Promise.all([
      loadEntityIndex(), loadDomains(), loadDependencies(), loadReuseScores(), loadInheritanceTree(),
    ]).then(([ei, d, dep, rs, it]) => {
      setEntityIndex(ei)
      setDomains(d)
      setDependencies(dep)
      setReuseScores(rs)
      setInheritanceTree(it)
      setLoading(false)
      const df = searchParams.get('domain')
      if (df) setExpandedDomains(new Set([df]))
    })
  }, [])

  // Load domain data when entity selected or domain expanded
  const ensureDomainLoaded = useCallback(async (domainName: string) => {
    if (domainEntities[domainName]) return domainEntities[domainName]
    setLoadingDomain(domainName)
    const [ents, attrs, rels] = await Promise.all([
      loadDomainEntities(domainName),
      loadDomainAttributes(domainName),
      loadDomainRelationships(domainName),
    ])
    setDomainEntities((prev) => ({ ...prev, [domainName]: ents }))
    setDomainAttributes((prev) => ({ ...prev, [domainName]: attrs }))
    setDomainRelationships((prev) => ({ ...prev, [domainName]: rels }))
    setLoadingDomain(null)
    // Prefetch adjacent domains
    const domainNames = domains.map((d) => d.name)
    const idx = domainNames.indexOf(domainName)
    if (idx > 0) prefetchDomain(domainNames[idx - 1])
    if (idx < domainNames.length - 1) prefetchDomain(domainNames[idx + 1])
    return ents
  }, [domainEntities, domains])

  // M2: P-Tier filtering
  const reuseMap = useMemo(() => {
    const map: Record<string, ReuseScore> = {}
    reuseScores.forEach((r) => { map[r.entityId] = r })
    return map
  }, [reuseScores])

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 }
    reuseScores.forEach((r) => { if (counts[r.tier] !== undefined) counts[r.tier]++ })
    return counts
  }, [reuseScores])

  const filteredIndex = useMemo(() => {
    let result = entityIndex
    if (domainFilter) result = result.filter((e) => e.domain === domainFilter)
    if (searchQuery) result = searchEntityIndex(result, searchQuery)
    if (tierFilter !== 'All') {
      const tierIds = new Set(reuseScores.filter((r) => r.tier === tierFilter).map((r) => r.entityId))
      result = result.filter((e) => tierIds.has(e.id))
    }
    return result
  }, [entityIndex, domainFilter, searchQuery, tierFilter, reuseScores])

  const indexByDomain = useMemo(() => {
    const map: Record<string, EntityIndexEntry[]> = {}
    filteredIndex.forEach((e) => {
      if (!map[e.domain]) map[e.domain] = []
      map[e.domain].push(e)
    })
    return map
  }, [filteredIndex])

  // Detail data for selected entity
  const entityAttrs = useMemo(() => {
    if (!selectedEntity) return []
    const attrs = domainAttributes[selectedEntity.domain]
    return attrs ? attrs.filter((a) => a.entityId === selectedEntity.id) : []
  }, [selectedEntity, domainAttributes])

  const entityRels = useMemo(() => {
    if (!selectedEntity) return { parents: [] as Relationship[], children: [] as Relationship[] }
    const rels = domainRelationships[selectedEntity.domain]
    if (!rels) return { parents: [] as Relationship[], children: [] as Relationship[] }
    return {
      parents: rels.filter((r) => r.childId === selectedEntity.id),
      children: rels.filter((r) => r.parentId === selectedEntity.id),
    }
  }, [selectedEntity, domainRelationships])

  const entityDeps = useMemo(() => {
    if (!selectedEntity) return []
    return dependencies.filter((d) => d.entityId === selectedEntity.id)
  }, [selectedEntity, dependencies])

  const entityReuse = useMemo(() => {
    if (!selectedEntity) return null
    return reuseScores.find((r) => r.entityId === selectedEntity.id) || null
  }, [selectedEntity, reuseScores])

  // M1: Inheritance chain
  const inheritanceChain = useMemo(() => {
    if (!selectedEntity) return []
    const chain: { id: number | string; name: string; depth: number }[] = []
    const findAncestors = (entityName: string, visited = new Set<string>()): string[] => {
      if (visited.has(entityName)) return []
      visited.add(entityName)
      const parent = inheritanceTree.find((e) => e.childName === entityName)
      if (!parent) return [entityName]
      return [...findAncestors(parent.parentName, visited), entityName]
    }
    const directChildren = inheritanceTree
      .filter((e) => e.parentName === selectedEntity.name)
      .map((e) => e.childName)

    const ancestors = findAncestors(selectedEntity.name)
    ancestors.forEach((name, i) => {
      chain.push({ id: name, name, depth: i })
    })
    directChildren.forEach((name) => {
      chain.push({ id: name, name, depth: ancestors.length })
    })
    return chain.length > 1 ? chain : []
  }, [selectedEntity, inheritanceTree])

  const selectEntity = useCallback(async (entry: EntityIndexEntry) => {
    const ents = await ensureDomainLoaded(entry.domain)
    const full = ents.find((e) => e.id === entry.id)
    if (full) {
      setBreadcrumbs((prev) => {
        if (selectedEntity && prev[prev.length - 1]?.id !== selectedEntity.id) {
          return [...prev, selectedEntity]
        }
        return prev
      })
      setSelectedEntity(full)
    }
  }, [ensureDomainLoaded, selectedEntity])

  const navigateToEntity = useCallback(async (entityName: string) => {
    const entry = entityIndex.find((e) => e.name === entityName)
    if (!entry) return
    const ents = await ensureDomainLoaded(entry.domain)
    const full = ents.find((e) => e.id === entry.id)
    if (full) {
      setBreadcrumbs((prev) => {
        if (selectedEntity && prev[prev.length - 1]?.id !== selectedEntity.id) {
          return [...prev, selectedEntity]
        }
        return prev
      })
      setSelectedEntity(full)
    }
  }, [entityIndex, ensureDomainLoaded, selectedEntity])

  const goBack = useCallback(() => {
    if (breadcrumbs.length > 0) {
      const prev = breadcrumbs[breadcrumbs.length - 1]
      setBreadcrumbs((b) => b.slice(0, -1))
      setSelectedEntity(prev)
    }
  }, [breadcrumbs])

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else {
        next.add(domain)
        ensureDomainLoaded(domain)
      }
      return next
    })
  }

  // M4: comparison data
  const compareData = useMemo(() => {
    if (compareEntities.length !== 2) return null
    return compareEntities.map((e) => ({
      entity: e,
      attrs: (domainAttributes[e.domain] || []).filter((a) => a.entityId === e.id),
      reuse: reuseScores.find((r) => r.entityId === e.id),
      deps: dependencies.filter((d) => d.entityId === e.id),
      rels: {
        parents: (domainRelationships[e.domain] || []).filter((r) => r.childId === e.id),
        children: (domainRelationships[e.domain] || []).filter((r) => r.parentId === e.id),
      },
    }))
  }, [compareEntities, domainAttributes, domainRelationships, reuseScores, dependencies])

  if (loading) {
    return (
      <div className="flex gap-4 h-[calc(100vh-120px)]">
        <div className="w-[280px] bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="flex-1 bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="w-[260px] bg-white rounded-lg shadow-sm animate-pulse" />
      </div>
    )
  }

  // M4: Comparison View
  if (compareMode && compareData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Entity Comparison</h2>
          <button
            onClick={() => { setCompareMode(false); setCompareEntities([]) }}
            className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
          >
            Exit Comparison
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {compareData.map((c) => (
            <div key={c.entity.id} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 font-mono mb-1">{c.entity.name}</h3>
              <span className={`inline-block px-2 py-0.5 text-xs text-white rounded ${DOMAIN_COLORS[c.entity.domain] || 'bg-slate-400'}`}>
                {c.entity.domain}
              </span>
              {c.reuse && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded ${TIER_COLORS[c.reuse.tier]}`}>
                  {c.reuse.tier} — Reuse: {c.reuse.reuseCount}
                </span>
              )}
              <p className="text-sm text-slate-600 mt-2">{c.entity.description}</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">Attributes:</span>
                  <span className="font-medium text-slate-700">{c.attrs.length}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">Capabilities using it:</span>
                  <span className="font-medium text-slate-700">{c.deps.length}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">Parent relationships:</span>
                  <span className="font-medium text-slate-700">{c.rels.parents.length}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">Child relationships:</span>
                  <span className="font-medium text-slate-700">{c.rels.children.length}</span>
                </div>
                {c.deps.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Top capabilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {c.deps.slice(0, 8).map((d, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">{d.capabilityName}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entities..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {domainFilter && (
          <button onClick={() => setDomainFilter('')} className="text-sm text-blue-600 hover:text-blue-800">
            Clear domain filter
          </button>
        )}
        {/* M4: Compare toggle */}
        <button
          onClick={() => {
            if (compareMode) { setCompareMode(false); setCompareEntities([]) }
            else setCompareMode(true)
          }}
          className={`px-3 py-1.5 text-xs rounded ${compareMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
        >
          {compareMode ? `Compare (${compareEntities.length}/2)` : 'Compare'}
        </button>
        {selectedEntity && (
          <ExportMenu options={[
            { label: 'Export Entity JSON', onClick: () => downloadJSON({ entity: selectedEntity, attributes: entityAttrs, relationships: entityRels, dependencies: entityDeps, reuse: entityReuse }, `baiw-entity-${selectedEntity.name}`) },
            { label: 'Export Attributes CSV', onClick: () => downloadCSV(entityAttrs.map(a => ({ Name: a.name, Type: a.dataType, Nullable: a.nullable ? 'Yes' : 'No' })), `baiw-attributes-${selectedEntity.name}`) },
          ]} />
        )}
      </div>

      <div className="flex gap-4 h-[calc(100vh-180px)]">
        {/* Left: Domain Tree */}
        <div className="w-[280px] bg-white rounded-lg shadow-sm overflow-y-auto shrink-0">
          <div className="p-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Domains</h3>
            {/* M2: P-Tier Filter */}
            <div className="flex flex-wrap gap-1">
              {TIER_OPTIONS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2 py-0.5 text-xs rounded ${
                    tierFilter === tier
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tier}{tier !== 'All' && `: ${tierCounts[tier] || 0}`}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2">
            {domains.map((domain) => {
              const domainItems = indexByDomain[domain.name] || []
              const isExpanded = expandedDomains.has(domain.name)
              const limit = domainLimits[domain.name] || 50
              if (domainItems.length === 0 && tierFilter !== 'All') return null
              return (
                <div key={domain.id} className="mb-1">
                  <button
                    onClick={() => toggleDomain(domain.name)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 rounded"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${DOMAIN_COLORS[domain.name] || 'bg-slate-400'}`} />
                    <span className="flex-1 truncate text-slate-700">{domain.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {domainItems.length}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="ml-5 border-l border-slate-100 pl-2">
                      {loadingDomain === domain.name && (
                        <div className="px-2 py-3 text-xs text-slate-400 animate-pulse">Loading entities...</div>
                      )}
                      {domainItems.slice(0, limit).map((entry) => (
                        <button
                          key={entry.id}
                          onClick={async () => {
                            if (compareMode) {
                              const ents = await ensureDomainLoaded(entry.domain)
                              const full = ents.find((e) => e.id === entry.id)
                              if (!full) return
                              setCompareEntities((prev) => {
                                if (prev.find((e) => e.id === full.id)) return prev.filter((e) => e.id !== full.id)
                                if (prev.length >= 2) return [prev[1], full]
                                return [...prev, full]
                              })
                            } else {
                              selectEntity(entry)
                              setBreadcrumbs([])
                            }
                          }}
                          className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-blue-50 truncate flex items-center gap-1 ${
                            selectedEntity?.id === entry.id ? 'bg-blue-50 text-blue-700 font-medium'
                            : compareEntities.find((e) => e.id === entry.id) ? 'bg-amber-50 text-amber-700 font-medium'
                            : 'text-slate-600'
                          }`}
                        >
                          <span className="truncate">{entry.name}</span>
                          {reuseMap[entry.id] && (
                            <span className={`ml-auto shrink-0 px-1 text-xs rounded ${TIER_COLORS[reuseMap[entry.id].tier]} text-xs`}>
                              {reuseMap[entry.id].tier}
                            </span>
                          )}
                        </button>
                      ))}
                      {domainItems.length > limit && (
                        <button
                          onClick={() => setDomainLimits((prev) => ({ ...prev, [domain.name]: limit + 50 }))}
                          className="w-full text-left px-2 py-1.5 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Load more ({domainItems.length - limit} remaining)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Center: Entity Detail */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-y-auto">
          {selectedEntity ? (
            <div className="p-6">
              {/* M3: Breadcrumb trail */}
              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-1 mb-3 text-xs text-slate-400">
                  <button onClick={goBack} className="p-1 hover:text-slate-600">
                    <ChevronLeft size={14} />
                  </button>
                  {breadcrumbs.map((bc, i) => (
                    <span key={bc.id} className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedEntity(bc)
                          setBreadcrumbs((prev) => prev.slice(0, i))
                        }}
                        className="hover:text-blue-600"
                      >
                        {bc.name}
                      </button>
                      <span>/</span>
                    </span>
                  ))}
                  <span className="text-slate-700 font-medium">{selectedEntity.name}</span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 font-mono">{selectedEntity.name}</h2>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs text-white rounded ${DOMAIN_COLORS[selectedEntity.domain] || 'bg-slate-400'}`}>
                    {selectedEntity.domain}
                  </span>
                </div>
                {entityReuse && (
                  <span className={`px-2 py-1 text-xs font-medium rounded ${TIER_COLORS[entityReuse.tier]}`}>
                    {entityReuse.tier} — Reuse: {entityReuse.reuseCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-6">{selectedEntity.description}</p>

              {/* M1: Inheritance Chain */}
              {inheritanceChain.length > 0 && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch size={14} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Inheritance Chain</h3>
                  </div>
                  <div className="space-y-0">
                    {inheritanceChain.map((node) => (
                      <div key={node.id} className="flex items-center" style={{ paddingLeft: `${node.depth * 20}px` }}>
                        {node.depth > 0 && (
                          <span className="text-slate-300 mr-1">└─</span>
                        )}
                        <button
                          onClick={() => navigateToEntity(node.name)}
                          className={`text-xs py-0.5 px-2 rounded ${
                            node.name === selectedEntity.name
                              ? 'bg-blue-100 text-blue-700 font-bold'
                              : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {node.name}
                          {node.name === selectedEntity.name && <span className="ml-1 text-blue-400">← you are here</span>}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Attributes ({entityAttrs.length})
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Name</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Type</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Nullable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entityAttrs.slice(0, 50).map((attr, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-mono text-xs text-slate-700">{attr.name}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{attr.dataType}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{attr.nullable ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* M3: Clickable Relationships */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Relationships</h3>
                {entityRels.parents.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-2">Parents:</p>
                    <div className="flex flex-wrap gap-2">
                      {entityRels.parents.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => navigateToEntity(r.parentName)}
                          className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-full hover:bg-blue-100 hover:text-blue-700 font-mono"
                        >
                          {r.parentName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {entityRels.children.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Children:</p>
                    <div className="flex flex-wrap gap-2">
                      {entityRels.children.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => navigateToEntity(r.childName)}
                          className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-full hover:bg-blue-100 hover:text-blue-700 font-mono"
                        >
                          {r.childName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>{compareMode ? 'Select 2 entities from the tree to compare' : 'Select an entity to view details'}</p>
            </div>
          )}
        </div>

        {/* Right: Used By Capabilities */}
        <div className="w-[260px] bg-white rounded-lg shadow-sm overflow-y-auto shrink-0">
          <div className="p-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Used By Capabilities</h3>
          </div>
          {selectedEntity && entityDeps.length > 0 ? (
            <div className="p-3 space-y-2">
              {entityDeps.slice(0, 20).map((dep, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/capabilities?cap=${encodeURIComponent(dep.capabilityId)}`)}
                  className="w-full text-left p-2 text-xs bg-slate-50 rounded hover:bg-blue-50 hover:text-blue-700"
                >
                  {dep.capabilityName}
                </button>
              ))}
              {entityDeps.length > 20 && (
                <p className="text-xs text-slate-400 px-2">+{entityDeps.length - 20} more</p>
              )}
            </div>
          ) : (
            <div className="p-3 text-xs text-slate-400">
              {selectedEntity ? 'No capability dependencies found' : 'Select an entity to view dependencies'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
