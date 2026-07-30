import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import { loadCapabilities, loadDependencies, loadDomains, loadReuseScores } from '../utils/dataLoader'
import type { Capability, Dependency, Domain, ReuseScore } from '../types'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON } from '../utils/export'

interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: 'capability' | 'domain'
  group: string
  connectionCount: number
  color: string
  radius: number
  isP1?: boolean
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  value: number
}

const THEME_COLORS: Record<string, string> = {
  'Marketing and Customer Experience': '#3B82F6',
  'Finance & Peformance Management': '#F59E0B',
  'Risk Management & Regulation': '#EF4444',
}

const DOMAIN_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#84CC16',
  '#F97316', '#A855F7', '#E11D48', '#64748B',
  '#059669', '#0891B2', '#D946EF', '#78716C',
]

interface SankeyNode {
  id: string
  name: string
  type: 'theme' | 'group' | 'domain'
  color: string
  x: number
  y: number
  height: number
}

export default function DependencyGraph() {
  const svgRef = useRef<SVGSVGElement>(null)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [viewMode, setViewMode] = useState<'force' | 'sankey'>('force')
  const [themeFilters, setThemeFilters] = useState<Set<string>>(
    new Set(['Marketing and Customer Experience', 'Finance & Peformance Management', 'Risk Management & Regulation'])
  )
  const [highlightP1, setHighlightP1] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const [graphData, setGraphData] = useState<{
    capabilities: Capability[]
    dependencies: Dependency[]
    domains: Domain[]
    reuseScores: ReuseScore[]
  } | null>(null)

  const p1EntityIds = useMemo(() => {
    if (!graphData) return new Set<string>()
    return new Set(graphData.reuseScores.filter((r) => r.tier === 'P1').map((r) => r.entityId))
  }, [graphData])

  const p1Count = p1EntityIds.size

  const buildForceGraph = useCallback(
    (capabilities: Capability[], dependencies: Dependency[], domains: Domain[]) => {
      if (!svgRef.current) return

      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const width = svgRef.current.clientWidth
      const height = svgRef.current.clientHeight

      const groupDomainCounts: Record<string, Record<string, number>> = {}
      const groupNames: Record<string, string> = {}
      const groupThemes: Record<string, string> = {}
      const groupP1Counts: Record<string, number> = {}

      capabilities.forEach((c) => {
        groupNames[c.groupId] = c.groupName
        groupThemes[c.groupId] = c.themeName
      })

      dependencies.forEach((d) => {
        const cap = capabilities.find((c) => c.id === d.capabilityId)
        if (!cap) return
        if (!themeFilters.has(cap.themeName)) return
        if (!groupDomainCounts[cap.groupId]) groupDomainCounts[cap.groupId] = {}
        groupDomainCounts[cap.groupId][d.domain] = (groupDomainCounts[cap.groupId][d.domain] || 0) + 1
        if (p1EntityIds.has(d.entityId)) {
          groupP1Counts[cap.groupId] = (groupP1Counts[cap.groupId] || 0) + 1
        }
      })

      const nodes: GraphNode[] = []
      const domainColorMap: Record<string, string> = {}
      domains.forEach((d, i) => { domainColorMap[d.name] = DOMAIN_COLORS[i % DOMAIN_COLORS.length] })

      const domainP1Counts: Record<string, number> = {}
      if (graphData) {
        graphData.reuseScores.filter((r) => r.tier === 'P1').forEach((r) => {
          domainP1Counts[r.domain] = (domainP1Counts[r.domain] || 0) + 1
        })
      }

      Object.keys(groupDomainCounts).forEach((groupId) => {
        const totalConns = Object.values(groupDomainCounts[groupId]).reduce((a, b) => a + b, 0)
        nodes.push({
          id: `group-${groupId}`,
          name: groupNames[groupId],
          type: 'capability',
          group: groupThemes[groupId],
          connectionCount: totalConns,
          color: THEME_COLORS[groupThemes[groupId]] || '#64748B',
          radius: 24,
          isP1: (groupP1Counts[groupId] || 0) > 0,
        })
      })

      const connectedDomains = new Set<string>()
      Object.values(groupDomainCounts).forEach((domCounts) => {
        Object.keys(domCounts).forEach((d) => connectedDomains.add(d))
      })

      domains.forEach((d) => {
        if (!connectedDomains.has(d.name)) return
        const totalConns = Object.values(groupDomainCounts).reduce((sum, gc) => sum + (gc[d.name] || 0), 0)
        nodes.push({
          id: `domain-${d.id}`,
          name: d.name,
          type: 'domain',
          group: 'domain',
          connectionCount: totalConns,
          color: domainColorMap[d.name] || '#64748B',
          radius: 18,
          isP1: (domainP1Counts[d.name] || 0) > 0,
        })
      })

      const links: GraphLink[] = []
      Object.entries(groupDomainCounts).forEach(([groupId, domCounts]) => {
        Object.entries(domCounts).forEach(([domName, count]) => {
          const domNode = nodes.find((n) => n.name === domName && n.type === 'domain')
          if (domNode) {
            links.push({ source: `group-${groupId}`, target: domNode.id, value: count })
          }
        })
      })

      const simulation = d3
        .forceSimulation(nodes)
        .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.radius + 5))

      const g = svg.append('g')
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
      svg.call(zoom)

      const maxValue = d3.max(links, (d) => d.value) || 1
      g.selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#CBD5E1')
        .attr('stroke-width', (d) => Math.max(1, (d.value / maxValue) * 5))
        .attr('stroke-opacity', 0.6)

      const node = g
        .selectAll<SVGCircleElement, GraphNode>('circle')
        .data(nodes)
        .join('circle')
        .attr('r', (d) => highlightP1 && d.isP1 ? d.radius * 1.4 : d.radius)
        .attr('fill', (d) => d.color)
        .attr('stroke', (d) => highlightP1 && d.isP1 ? '#EF4444' : '#fff')
        .attr('stroke-width', (d) => highlightP1 && d.isP1 ? 3 : 2)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          const connectedLinks = links.filter(
            (l) => (l.source as GraphNode).id === d.id || (l.target as GraphNode).id === d.id
          )
          const top3 = connectedLinks
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
            .map((l) => {
              const other = (l.source as GraphNode).id === d.id ? (l.target as GraphNode) : (l.source as GraphNode)
              return `  ${other.name} (${l.value})`
            }).join('\n')
          setTooltip({
            x: event.pageX, y: event.pageY,
            text: `${d.name}\n${d.type === 'capability' ? 'Capability Group' : 'Domain'}\nConnections: ${d.connectionCount}${top3 ? '\nTop:\n' + top3 : ''}`,
          })
        })
        .on('mouseout', () => setTooltip(null))
        .on('click', (_, d) => {
          if (d.type === 'domain') navigate(`/model?domain=${encodeURIComponent(d.name)}`)
          else navigate(`/capabilities?theme=${encodeURIComponent(d.group)}`)
        })

      const drag = d3.drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      node.call(drag)

      const labels = g
        .selectAll<SVGTextElement, GraphNode>('text')
        .data(nodes)
        .join('text')
        .text((d) => d.name.length > 20 ? d.name.slice(0, 18) + '...' : d.name)
        .attr('font-size', 10)
        .attr('fill', '#334155')
        .attr('text-anchor', 'middle')
        .attr('dy', (d) => d.radius + 14)
        .attr('opacity', showLabels ? 1 : 0)

      simulation.on('tick', () => {
        g.selectAll('line')
          .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)
        node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!)
        labels.attr('x', (d) => d.x!).attr('y', (d) => d.y!)
      })

      return () => simulation.stop()
    },
    [themeFilters, showLabels, highlightP1, navigate, p1EntityIds, graphData]
  )

  // G1: Sankey data
  const sankeyData = useMemo(() => {
    if (!graphData) return null
    const { capabilities, dependencies, domains } = graphData
    const nodes: SankeyNode[] = []
    const links: { source: string; target: string; value: number; color: string }[] = []

    const groupDomainFlows: Record<string, Record<string, number>> = {}
    const groupThemeMap: Record<string, string> = {}
    capabilities.forEach((c) => { groupThemeMap[c.groupName] = c.themeName })

    dependencies.forEach((d) => {
      const cap = capabilities.find((c) => c.id === d.capabilityId)
      if (!cap || !themeFilters.has(cap.themeName)) return
      if (!groupDomainFlows[cap.groupName]) groupDomainFlows[cap.groupName] = {}
      groupDomainFlows[cap.groupName][d.domain] = (groupDomainFlows[cap.groupName][d.domain] || 0) + 1
    })

    const themeGroupFlows: Record<string, Record<string, number>> = {}
    Object.entries(groupDomainFlows).forEach(([grp, domFlows]) => {
      const theme = groupThemeMap[grp]
      if (!themeGroupFlows[theme]) themeGroupFlows[theme] = {}
      themeGroupFlows[theme][grp] = Object.values(domFlows).reduce((a, b) => a + b, 0)
    })

    const themes = Object.keys(themeGroupFlows)
    const activeGroups = Object.keys(groupDomainFlows)
    const connectedDomains = new Set<string>()
    Object.values(groupDomainFlows).forEach((dfs) => Object.keys(dfs).forEach((d) => connectedDomains.add(d)))
    const domArr = domains.filter((d) => connectedDomains.has(d.name))

    const svgH = 600
    const colW = 200
    const themeTotal = Object.values(themeGroupFlows).reduce((s, g) => s + Object.values(g).reduce((a, b) => a + b, 0), 0)

    let ty = 30
    themes.forEach((t) => {
      const val = Object.values(themeGroupFlows[t]).reduce((a, b) => a + b, 0)
      const h = Math.max(30, (val / Math.max(themeTotal, 1)) * (svgH - 60))
      nodes.push({ id: `t-${t}`, name: t.split('&')[0].trim(), type: 'theme', color: THEME_COLORS[t] || '#64748B', x: 20, y: ty, height: h })
      ty += h + 10
    })

    let gy = 25
    const groupTotal = activeGroups.reduce((s, g) => s + Object.values(groupDomainFlows[g]).reduce((a, b) => a + b, 0), 0)
    activeGroups.forEach((g) => {
      const val = Object.values(groupDomainFlows[g]).reduce((a, b) => a + b, 0)
      const h = Math.max(16, (val / Math.max(groupTotal, 1)) * (svgH - 60))
      nodes.push({ id: `g-${g}`, name: g.length > 18 ? g.slice(0, 16) + '..' : g, type: 'group', color: THEME_COLORS[groupThemeMap[g]] || '#64748B', x: 20 + colW, y: gy, height: h })
      gy += h + 4
    })

    let dy = 25
    const domTotal = domArr.reduce((s, d) => s + Object.values(groupDomainFlows).reduce((ss, gf) => ss + (gf[d.name] || 0), 0), 0)
    domArr.forEach((d, i) => {
      const val = Object.values(groupDomainFlows).reduce((s, gf) => s + (gf[d.name] || 0), 0)
      const h = Math.max(16, (val / Math.max(domTotal, 1)) * (svgH - 60))
      nodes.push({ id: `d-${d.name}`, name: d.name.length > 18 ? d.name.slice(0, 16) + '..' : d.name, type: 'domain', color: DOMAIN_COLORS[i % DOMAIN_COLORS.length], x: 20 + colW * 2, y: dy, height: h })
      dy += h + 4
    })

    Object.entries(themeGroupFlows).forEach(([theme, grps]) => {
      Object.entries(grps).forEach(([grp, val]) => {
        links.push({ source: `t-${theme}`, target: `g-${grp}`, value: val, color: THEME_COLORS[theme] || '#64748B' })
      })
    })
    Object.entries(groupDomainFlows).forEach(([grp, doms]) => {
      Object.entries(doms).forEach(([dom, val]) => {
        links.push({ source: `g-${grp}`, target: `d-${dom}`, value: val, color: THEME_COLORS[groupThemeMap[grp]] || '#64748B' })
      })
    })

    return { nodes, links, width: colW * 3 + 60, height: svgH }
  }, [graphData, themeFilters])

  useEffect(() => {
    Promise.all([loadCapabilities(), loadDependencies(), loadDomains(), loadReuseScores()]).then(
      ([caps, deps, doms, rs]) => {
        setGraphData({ capabilities: caps, dependencies: deps, domains: doms, reuseScores: rs })
        setLoading(false)
      }
    )
  }, [])

  useEffect(() => {
    if (viewMode === 'force' && graphData) {
      buildForceGraph(graphData.capabilities, graphData.dependencies, graphData.domains)
    }
  }, [viewMode, graphData, buildForceGraph])

  const toggleTheme = (theme: string) => {
    setThemeFilters((prev) => { const next = new Set(prev); if (next.has(theme)) next.delete(theme); else next.add(theme); return next })
  }

  if (loading) return <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-120px)] animate-pulse" />

  return (
    <div className="relative">
      {/* Every page needs exactly one h1 for the document outline: screen readers
          navigate by heading and these pages had none. Visually hidden because the
          page title is already communicated by the sidebar and header chrome. */}
      <h1 className="sr-only">Dependency Graph</h1>
      <div className="absolute top-4 right-4 z-10">
        <ExportMenu options={[
          { label: 'Export Graph JSON', onClick: () => downloadJSON({ themes: [...themeFilters], showLabels, highlightP1, viewMode }, 'baiw-dependency-graph') },
        ]} />
      </div>
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-4 z-10 space-y-3 w-60">
        <h3 className="text-sm font-semibold text-slate-700">Controls</h3>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('force')} className={`flex-1 px-2 py-1.5 text-xs rounded ${viewMode === 'force' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Force Graph</button>
          <button onClick={() => setViewMode('sankey')} className={`flex-1 px-2 py-1.5 text-xs rounded ${viewMode === 'sankey' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Sankey Flow</button>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium">Filter by Theme:</p>
          {Object.entries(THEME_COLORS).map(([theme, color]) => (
            <label key={theme} className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={themeFilters.has(theme)} onChange={() => toggleTheme(theme)} className="rounded" />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="truncate">{theme}</span>
            </label>
          ))}
        </div>
        {viewMode === 'force' && (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="rounded" />
            Show Labels
          </label>
        )}
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={highlightP1} onChange={(e) => setHighlightP1(e.target.checked)} className="rounded" />
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Highlight P1 ({p1Count})
        </label>
        <div className="flex gap-2 pt-2">
          <div className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-3 rounded-full bg-blue-500" /> Capability</div>
          <div className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-3 rounded-full bg-indigo-500" /> Domain</div>
        </div>
      </div>

      {tooltip && (
        <div className="fixed bg-slate-800 text-white text-xs px-3 py-2 rounded shadow-lg z-50 pointer-events-none whitespace-pre-line" style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}>
          {tooltip.text}
        </div>
      )}

      {viewMode === 'force' ? (
        <svg ref={svgRef} className="w-full bg-white rounded-lg shadow-sm" style={{ height: 'calc(100vh - 120px)' }} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-auto" style={{ height: 'calc(100vh - 120px)' }}>
          {sankeyData && (
            <svg viewBox={`0 0 ${sankeyData.width} ${sankeyData.height}`} className="w-full min-w-[700px]" style={{ height: sankeyData.height }}>
              <text x={60} y={18} fontSize={12} fontWeight="bold" fill="#475569">BVF Themes</text>
              <text x={260} y={18} fontSize={12} fontWeight="bold" fill="#475569">Capability Groups</text>
              <text x={460} y={18} fontSize={12} fontWeight="bold" fill="#475569">FSDM Domains</text>
              {sankeyData.links.map((link, i) => {
                const sn = sankeyData.nodes.find((n) => n.id === link.source)
                const tn = sankeyData.nodes.find((n) => n.id === link.target)
                if (!sn || !tn) return null
                const sx = sn.x + 130, sy = sn.y + sn.height / 2
                const tx = tn.x, ty = tn.y + tn.height / 2
                const mx = (sx + tx) / 2
                const thick = Math.max(1, Math.min(link.value / 5, 12))
                return <path key={i} d={`M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`} fill="none" stroke={highlightP1 ? '#EF4444' : link.color} strokeWidth={thick} strokeOpacity={highlightP1 ? 0.5 : 0.25} />
              })}
              {sankeyData.nodes.map((n) => (
                <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => {
                  if (n.type === 'domain') {
                    const full = graphData?.domains.find((d) => n.id === `d-${d.name}`)?.name
                    if (full) navigate(`/model?domain=${encodeURIComponent(full)}`)
                  } else if (n.type === 'theme') {
                    const full = Object.keys(THEME_COLORS).find((t) => n.id === `t-${t}`)
                    if (full) navigate(`/capabilities?theme=${encodeURIComponent(full)}`)
                  }
                }}>
                  <rect x={n.x} y={n.y} width={130} height={n.height} rx={4} fill={n.color} fillOpacity={0.15} stroke={n.color} strokeWidth={1.5} />
                  <text x={n.x + 6} y={n.y + n.height / 2 + 4} fontSize={n.height < 20 ? 8 : 10} fill="#334155">{n.name}</text>
                </g>
              ))}
            </svg>
          )}
        </div>
      )}
    </div>
  )
}
