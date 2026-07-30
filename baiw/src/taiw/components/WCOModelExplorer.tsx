import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, ChevronRight, ChevronDown, X, FileText, Tag, Package, Link2,
  Filter, Flame, GitBranch, List, Download, Globe,
} from 'lucide-react'
import { downloadJSON, downloadCSV } from '../utils/export'
import {
  loadDomains, loadClasses, loadElements, loadMappings,
  loadIPs, loadReuseScores, loadCodeLists,
} from '../data'
import type {
  TaiwDomain, TaiwClass, TaiwElement, TaiwMapping,
  TaiwIP, TaiwReuseScore, TaiwCodeList,
} from '../types'

/* ---------- TM2: Tier color helpers ---------- */
const TIER_STYLES: Record<string, { bg: string; label: string }> = {
  P1: { bg: 'bg-red-500', label: 'Critical' },
  P2: { bg: 'bg-orange-400', label: 'High' },
  P3: { bg: 'bg-yellow-400', label: 'Medium' },
  P4: { bg: 'bg-blue-300', label: 'Low' },
}

/* ---------- TM3: Class Diagram Mini View component ---------- */
function ClassDiagramMini({
  className: selectedClassName,
  domain,
  allClasses,
}: {
  className: string
  domain: string
  allClasses: TaiwClass[]
}) {
  const currentClass = allClasses.find((c) => c.name === selectedClassName && c.domain === domain)
  if (!currentClass) return null

  const parentClass = currentClass.parentClass
    ? allClasses.find((c) => c.name === currentClass.parentClass)
    : null

  const childClasses = allClasses.filter(
    (c) => c.parentClass === selectedClassName && c.domain === domain
  )

  return (
    <div className="mt-2 mb-1 px-2">
      <div className="border border-teal-200 rounded-lg bg-teal-50/30 p-2 space-y-1">
        <div className="flex items-center gap-1 mb-1.5">
          <GitBranch size={10} className="text-teal-500" />
          <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wide">Class Hierarchy</span>
        </div>

        {/* Parent class */}
        {parentClass && (
          <>
            <div className="border border-slate-200 rounded bg-white px-2 py-1">
              <p className="text-xs font-medium text-slate-500">{parentClass.name}</p>
              <p className="text-[11px] text-slate-400">{parentClass.elementCount} elements</p>
            </div>
            <div className="flex justify-center">
              <div className="w-px h-2 bg-slate-300" />
            </div>
            <div className="flex justify-center">
              <ChevronDown size={10} className="text-slate-400 -mt-1" />
            </div>
          </>
        )}

        {/* Current class */}
        <div className="border-2 border-teal-400 rounded bg-teal-50 px-2 py-1.5">
          <p className="text-xs font-bold text-teal-700">{currentClass.name}</p>
          <p className="text-[11px] text-teal-500">
            {currentClass.elementCount} elements
            {currentClass.stereotype && ` | ${currentClass.stereotype}`}
          </p>
        </div>

        {/* Child classes */}
        {childClasses.length > 0 && (
          <>
            <div className="flex justify-center">
              <div className="w-px h-2 bg-slate-300" />
            </div>
            <div className="flex justify-center">
              <ChevronDown size={10} className="text-slate-400 -mt-1" />
            </div>
            <div className="space-y-0.5">
              {childClasses.map((child) => (
                <div key={child.id} className="border border-slate-200 rounded bg-white px-2 py-1">
                  <p className="text-xs font-medium text-slate-500">{child.name}</p>
                  <p className="text-[11px] text-slate-400">{child.elementCount} elements</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- TM4: Code List Expansion component ---------- */
function CodeListExpansion({
  codeListName,
  codeLists,
}: {
  codeListName: string
  codeLists: TaiwCodeList[]
}) {
  const [expanded, setExpanded] = useState(false)

  const matchingCodeList = useMemo(() => {
    return codeLists.find(
      (cl) => cl.name === codeListName || cl.name.toLowerCase() === codeListName.toLowerCase()
    )
  }, [codeListName, codeLists])

  if (!matchingCodeList || matchingCodeList.values.length === 0) return null

  const displayValues = expanded
    ? matchingCodeList.values
    : matchingCodeList.values.slice(0, 12)

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
        <List size={14} className="text-slate-400" />
        Code List Values ({matchingCodeList.values.length})
      </h3>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-slate-100">
          {displayValues.map((v, i) => (
            <div key={i} className="flex items-start px-3 py-1.5 text-xs">
              <span className="font-mono font-medium text-teal-700 w-16 shrink-0">{v.code}</span>
              <span className="text-slate-600">{v.description}</span>
            </div>
          ))}
        </div>
        {matchingCodeList.values.length > 12 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-3 py-1.5 text-xs text-teal-600 hover:text-teal-800 bg-slate-50 border-t border-slate-100"
          >
            {expanded ? 'Show less' : `Show all ${matchingCodeList.values.length} values`}
          </button>
        )}
      </div>
      {matchingCodeList.pakMapping && (
        <p className="text-xs text-slate-400 mt-1 italic">
          Pakistan: {matchingCodeList.pakMapping}
        </p>
      )}
    </div>
  )
}

export default function WCOModelExplorer() {
  const [searchParams] = useSearchParams()

  /* ---- Data state ---- */
  const [domains, setDomains] = useState<TaiwDomain[]>([])
  const [classes, setClasses] = useState<TaiwClass[]>([])
  const [elements, setElements] = useState<TaiwElement[]>([])
  const [mappings, setMappings] = useState<TaiwMapping[]>([])
  const [ips, setIPs] = useState<TaiwIP[]>([])
  const [reuseScores, setReuseScores] = useState<TaiwReuseScore[]>([])
  const [codeLists, setCodeLists] = useState<TaiwCodeList[]>([])
  const [loading, setLoading] = useState(true)

  /* ---- UI state ---- */
  const [selectedElement, setSelectedElement] = useState<TaiwElement | null>(null)
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [domainFilter, setDomainFilter] = useState(searchParams.get('domain') || '')
  const [ipFilter, setIPFilter] = useState('')  // TM1: IP filter state

  /* ---- Load all data on mount ---- */
  useEffect(() => {
    Promise.all([
      loadDomains(),
      loadClasses(),
      loadElements(),
      loadMappings(),
      loadIPs(),
      loadReuseScores(),
      loadCodeLists(),
    ]).then(([doms, cls, els, maps, ipData, reuse, clData]) => {
      setDomains(doms)
      setClasses(cls)
      setElements(els)
      setMappings(maps)
      setIPs(ipData)
      setReuseScores(reuse)
      setCodeLists(clData)
      setLoading(false)

      // Auto-expand domain from query param
      const df = searchParams.get('domain')
      if (df) setExpandedDomains(new Set([df]))
    })
  }, [])

  /* ---- TM1: Compute classes belonging to selected IP ---- */
  const ipClassSet = useMemo(() => {
    if (!ipFilter) return null
    const ip = ips.find((p) => p.id === ipFilter)
    if (!ip) return null
    return new Set(ip.classes)
  }, [ipFilter, ips])

  /* ---- TM2: Build reuse score lookup by element name ---- */
  const reuseMap = useMemo(() => {
    const map = new Map<string, TaiwReuseScore>()
    reuseScores.forEach((rs) => map.set(rs.element, rs))
    return map
  }, [reuseScores])

  /* ---- Filtering logic ---- */
  const filteredElements = useMemo(() => {
    let result = elements
    if (domainFilter) {
      result = result.filter((e) => e.domain === domainFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.domain.toLowerCase().includes(q) ||
          e.class.toLowerCase().includes(q) ||
          e.definition.toLowerCase().includes(q)
      )
    }
    // TM1: Filter by IP -- keep only elements whose class is in the IP's class set
    if (ipClassSet) {
      result = result.filter((e) => ipClassSet.has(e.class))
    }
    return result
  }, [elements, domainFilter, searchQuery, ipClassSet])

  /* ---- Build tree structure: domain -> classes -> elements ---- */
  const treeData = useMemo(() => {
    const domainNames = domainFilter
      ? domains.filter((d) => d.name === domainFilter)
      : domains

    // Index elements by class
    const elsByClass: Record<string, TaiwElement[]> = {}
    filteredElements.forEach((el) => {
      const key = `${el.domain}::${el.class}`
      if (!elsByClass[key]) elsByClass[key] = []
      elsByClass[key].push(el)
    })

    // Index classes by domain
    const classesByDomain: Record<string, TaiwClass[]> = {}
    classes.forEach((cls) => {
      if (!classesByDomain[cls.domain]) classesByDomain[cls.domain] = []
      classesByDomain[cls.domain].push(cls)
    })

    return domainNames.map((domain) => {
      const domClasses = (classesByDomain[domain.name] || [])
        .map((cls) => ({
          ...cls,
          elements: elsByClass[`${domain.name}::${cls.name}`] || [],
        }))
        .filter((cls) => cls.elements.length > 0)

      return {
        domain,
        classes: domClasses,
        totalElements: domClasses.reduce((sum, c) => sum + c.elements.length, 0),
      }
    }).filter((d) => d.totalElements > 0 || !searchQuery)
  }, [domains, classes, filteredElements, domainFilter, searchQuery])

  /* ---- Mappings for selected element ---- */
  const elementMappings = useMemo(() => {
    if (!selectedElement) return []
    return mappings.filter(
      (m) => m.element === selectedElement.name || m.element === selectedElement.id
    )
  }, [selectedElement, mappings])

  /* ---- Toggle helpers ---- */
  const toggleDomain = useCallback((name: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const toggleClass = useCallback((key: string) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="flex gap-4 h-[calc(100vh-120px)]">
        <div className="w-[300px] bg-white rounded-lg shadow-sm animate-pulse" />
        <div className="flex-1 bg-white rounded-lg shadow-sm animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Every page needs exactly one h1 for the document outline: screen readers
          navigate by heading and these pages had none. Visually hidden because the
          page title is already communicated by the sidebar and header chrome. */}
      <h1 className="sr-only">WCO Data Model Explorer</h1>
      {/* ===== Search & Filter Bar ===== */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elements by name, domain, class..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Domain filter dropdown */}
        <select
          value={domainFilter}
          onChange={(e) => {
            setDomainFilter(e.target.value)
            if (e.target.value) setExpandedDomains(new Set([e.target.value]))
          }}
          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Domains ({domains.length})</option>
          {domains.map((d) => (
            <option key={d.slug} value={d.name}>
              {d.name} ({d.count})
            </option>
          ))}
        </select>

        {/* TM1: Information Package filter dropdown */}
        <select
          value={ipFilter}
          onChange={(e) => setIPFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">All IPs ({ips.length})</option>
          {ips.map((ip) => (
            <option key={ip.id} value={ip.id}>
              {ip.name} ({ip.elementCount})
            </option>
          ))}
        </select>

        {(domainFilter || ipFilter) && (
          <button
            onClick={() => { setDomainFilter(''); setIPFilter(''); setExpandedDomains(new Set()) }}
            className="text-sm text-teal-600 hover:text-teal-800"
          >
            Clear filters
          </button>
        )}

        <span className="text-xs text-slate-400">
          {filteredElements.length} of {elements.length} elements
        </span>

        {/* Export buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => downloadJSON(filteredElements, `taiw-wco-elements-${new Date().toISOString().slice(0, 10)}.json`)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors shadow-sm text-slate-600"
          >
            <Download size={11} /> JSON
          </button>
          <button
            onClick={() => downloadCSV(filteredElements.map(e => ({
              id: e.id, name: e.name, domain: e.domain, class: e.class,
              dataType: e.dataType, format: e.format || '',
              definition: e.definition,
            })), `taiw-wco-elements-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors shadow-sm text-slate-600"
          >
            <Download size={11} /> CSV
          </button>
        </div>
      </div>

      {/* TM1: Active IP filter indicator */}
      {ipFilter && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 rounded-lg border border-cyan-200">
          <Filter size={12} className="text-cyan-600" />
          <span className="text-xs text-cyan-700">
            Filtered by IP: <strong>{ips.find((ip) => ip.id === ipFilter)?.name}</strong>
            {' '}({ipClassSet ? ipClassSet.size : 0} classes)
          </span>
          <button
            onClick={() => setIPFilter('')}
            className="ml-auto text-cyan-500 hover:text-cyan-700"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ===== Main Panels ===== */}
      <div className="flex gap-4 h-[calc(100vh-180px)]">

        {/* LEFT: Domain / Class / Element Tree */}
        <div className="w-[300px] bg-white rounded-lg shadow-sm overflow-y-auto shrink-0">
          <div className="p-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Data Model Tree</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {domains.length} domains, {classes.length} classes, {elements.length} elements
            </p>
          </div>
          <div className="p-2">
            {treeData.map(({ domain, classes: domClasses, totalElements }) => {
              const isDomainExpanded = expandedDomains.has(domain.name)
              return (
                <div key={domain.slug} className="mb-0.5">
                  {/* Domain row */}
                  <button
                    onClick={() => toggleDomain(domain.name)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 rounded"
                  >
                    {isDomainExpanded
                      ? <ChevronDown size={14} className="text-slate-400 shrink-0" />
                      : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: domain.color }}
                    />
                    <span className="flex-1 truncate text-slate-700 font-medium">{domain.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {totalElements}
                    </span>
                  </button>

                  {/* Classes within domain */}
                  {isDomainExpanded && (
                    <div className="ml-5 border-l border-slate-100 pl-1">
                      {domClasses.map((cls) => {
                        const classKey = `${domain.name}::${cls.name}`
                        const isClassExpanded = expandedClasses.has(classKey)
                        return (
                          <div key={cls.id}>
                            {/* Class row */}
                            <button
                              onClick={() => toggleClass(classKey)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-slate-50 rounded"
                            >
                              {isClassExpanded
                                ? <ChevronDown size={12} className="text-slate-400 shrink-0" />
                                : <ChevronRight size={12} className="text-slate-400 shrink-0" />}
                              <span className="flex-1 truncate text-slate-600 font-medium">{cls.name}</span>
                              <span className="text-xs text-slate-400">{cls.elements.length}</span>
                            </button>

                            {/* TM3: Class Diagram Mini View -- shown when class is expanded */}
                            {isClassExpanded && (
                              <ClassDiagramMini
                                className={cls.name}
                                domain={domain.name}
                                allClasses={classes}
                              />
                            )}

                            {/* Elements within class */}
                            {isClassExpanded && (
                              <div className="ml-5 border-l border-slate-100 pl-1">
                                {cls.elements.map((el) => {
                                  // TM2: Get reuse score for this element
                                  const reuse = reuseMap.get(el.name)
                                  const tierStyle = reuse ? TIER_STYLES[reuse.tier] : null

                                  return (
                                    <button
                                      key={el.id}
                                      onClick={() => setSelectedElement(el)}
                                      className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-1.5 hover:bg-teal-50 ${
                                        selectedElement?.id === el.id
                                          ? 'bg-teal-50 text-teal-700 font-medium'
                                          : 'text-slate-600'
                                      }`}
                                      title={
                                        reuse
                                          ? `Used by ${reuse.capabilitiesSupported} capabilities, Tier ${reuse.tier}`
                                          : undefined
                                      }
                                    >
                                      {/* TM2: Usage heatmap dot */}
                                      {tierStyle && (
                                        <span
                                          className={`w-2 h-2 rounded-full shrink-0 ${tierStyle.bg}`}
                                          title={`Tier ${reuse!.tier}: ${reuse!.capabilitiesSupported} capabilities`}
                                        />
                                      )}
                                      <span className="truncate flex-1">{el.name}</span>
                                      {reuse && (
                                        <span className="text-[11px] text-slate-400 shrink-0">
                                          {reuse.capabilitiesSupported}
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
                  )}
                </div>
              )
            })}
            {treeData.length === 0 && (
              <p className="px-3 py-6 text-xs text-slate-400 text-center">No elements match your search.</p>
            )}
          </div>
        </div>

        {/* CENTER: Element Detail */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-y-auto">
          {selectedElement ? (
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 font-mono">{selectedElement.name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className="inline-block px-2 py-0.5 text-xs text-white rounded"
                    style={{ backgroundColor: domains.find((d) => d.name === selectedElement.domain)?.color || '#64748B' }}
                  >
                    {selectedElement.domain}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                    {selectedElement.class}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-teal-50 text-teal-700 rounded font-mono">
                    {selectedElement.id}
                  </span>
                  {/* TM2: Reuse score badge in header */}
                  {(() => {
                    const reuse = reuseMap.get(selectedElement.name)
                    if (!reuse) return null
                    const tierStyle = TIER_STYLES[reuse.tier]
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded text-white ${tierStyle?.bg || 'bg-slate-400'}`}>
                        <Flame size={10} />
                        {reuse.tier} -- {reuse.capabilitiesSupported} capabilities
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Definition */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  Definition
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg">
                  {selectedElement.definition || 'No definition available.'}
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Data Type</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">{selectedElement.dataType}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Format</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">{selectedElement.format || '--'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">UN/EDIFACT Tag</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">{selectedElement.unEdifactTag || '--'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Code List</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">{selectedElement.codeList || 'None'}</p>
                </div>
              </div>

              {/* TM4: Code List Expansion -- show when element has a codeList */}
              {selectedElement.codeList && (
                <CodeListExpansion
                  codeListName={selectedElement.codeList}
                  codeLists={codeLists}
                />
              )}

              {/* Information Packages */}
              {selectedElement.informationPackages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Package size={14} className="text-slate-400" />
                    Information Packages ({selectedElement.informationPackages.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedElement.informationPackages.map((ip) => (
                      <span key={ip} className="px-2.5 py-1 text-xs bg-cyan-50 text-cyan-700 rounded-full border border-cyan-200">
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Capabilities Using This Element */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Link2 size={14} className="text-slate-400" />
                  Capabilities Using This Element ({elementMappings.length})
                </h3>
                {elementMappings.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Capability</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Domain</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {elementMappings.map((m, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-4 py-2 text-xs text-slate-700">{m.capability}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{m.domain}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                m.confidence === 'High' ? 'bg-emerald-50 text-emerald-700'
                                : m.confidence === 'Medium' ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                              }`}>
                                {m.confidence}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                    No capability mappings found for this element.
                  </p>
                )}
              </div>

              {/* Notes from mappings */}
              {elementMappings.some((m) => m.notes) && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Tag size={14} className="text-slate-400" />
                    Mapping Notes
                  </h3>
                  <div className="space-y-2">
                    {elementMappings.filter((m) => m.notes).map((m, i) => (
                      <div key={i} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                        <span className="font-medium text-slate-700">{m.capability}:</span> {m.notes}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Globe size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Select an element from the tree to view details</p>
                <p className="text-xs text-slate-300 mt-1">
                  {elements.length} elements across {domains.length} domains
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
