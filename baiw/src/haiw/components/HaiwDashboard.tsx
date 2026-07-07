import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Layers, Target, ClipboardList, Table, Puzzle } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { loadFhirResources, loadResourceCategories, loadCapabilities, loadHcdmSubjectAreas, loadPakistanContext, loadIndex } from '../data'
import type { HaiwFhirResource, HaiwResourceCategory, HaiwCapability, HaiwHcdmSubjectArea, HaiwPakistanContext, HaiwIndex } from '../types'

const heroStats = [
  { label: 'FHIR Resources', value: '157', icon: Database },
  { label: 'HCDM Subject Areas', value: '12', icon: Layers },
  { label: 'HCF Capabilities', value: '108', icon: Target },
  { label: 'HACR Questions', value: '720+', icon: ClipboardList },
  { label: 'Star Schema Tables', value: '24', icon: Table },
  { label: 'Gap Extension Tables', value: '25', icon: Puzzle },
]

const navPages = [
  { path: '/haiw/model', title: 'FHIR Data Model', desc: 'Explore 157 HL7 FHIR R5 resources organized across 12 categories with full element definitions.' },
  { path: '/haiw/capabilities', title: 'Capability Framework', desc: 'Browse 108 healthcare analytics capabilities across 6 strategic themes.' },
  { path: '/haiw/graph', title: 'Dependency Graph', desc: 'Visualize cross-resource and cross-capability dependencies in an interactive network.' },
  { path: '/haiw/maturity', title: 'Maturity Assessment', desc: 'Run the 720-question HACR assessment to evaluate organizational healthcare analytics maturity.' },
  { path: '/haiw/analytics', title: 'Analytics Layer', desc: 'Explore star schema tables, views, and gap extension modules for Teradata HCDM.' },
  { path: '/haiw/roadmap', title: 'Implementation Roadmap', desc: 'Generate a prioritized, phased roadmap based on assessment results and gaps.' },
  { path: '/haiw/pakistan', title: 'Pakistan Health Context', desc: 'Pakistan-specific healthcare system data, facility hierarchy, and priority programs.' },
]

const radarLabels = [
  'Data Governance',
  'Clinical Analytics',
  'Population Health',
  'Financial Analytics',
  'Operational Analytics',
  'Research & Innovation',
  'Infrastructure',
  'Interoperability',
]

const radarData = radarLabels.map(label => ({
  category: label,
  score: Math.floor(Math.random() * 2) + 2,
  fullMark: 5,
}))

export default function HaiwDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<HaiwResourceCategory[]>([])
  const [capabilities, setCapabilities] = useState<HaiwCapability[]>([])
  const [subjectAreas, setSubjectAreas] = useState<HaiwHcdmSubjectArea[]>([])
  const [pakistanCtx, setPakistanCtx] = useState<HaiwPakistanContext | null>(null)
  const [index, setIndex] = useState<HaiwIndex | null>(null)
  const [_resources, setResources] = useState<HaiwFhirResource[]>([])

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const [res, cats, caps, areas, pak, idx] = await Promise.all([
          loadFhirResources(),
          loadResourceCategories(),
          loadCapabilities(),
          loadHcdmSubjectAreas(),
          loadPakistanContext(),
          loadIndex(),
        ])
        if (cancelled) return
        setResources(res)
        setCategories(cats)
        setCapabilities(caps)
        setSubjectAreas(areas)
        setPakistanCtx(pak)
        setIndex(idx)
      } catch (err) {
        console.error('HAIW Dashboard: failed to load data', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  // ---------- derived chart data ----------
  const donutData = categories.map(c => ({
    name: c.name,
    value: c.resourceCount,
    color: c.color,
  }))

  const themeMap = new Map<string, { theme: string; count: number; color: string }>()
  for (const cap of capabilities) {
    const existing = themeMap.get(cap.theme)
    if (existing) {
      existing.count++
    } else {
      themeMap.set(cap.theme, { theme: cap.theme, count: 1, color: cap.themeColor })
    }
  }
  const barData = Array.from(themeMap.values())

  const pakistanMetrics = pakistanCtx
    ? [
        { label: 'Life Expectancy', value: pakistanCtx.statistics['lifeExpectancy'] ?? '67.7 years' },
        { label: 'Infant Mortality Rate', value: pakistanCtx.statistics['infantMortalityRate'] ?? '54/1000' },
        { label: 'Hospital Beds', value: pakistanCtx.statistics['hospitalBeds'] ?? '0.6/1000' },
        { label: 'Doctor Ratio', value: pakistanCtx.statistics['doctorRatio'] ?? '1:1300' },
        { label: 'UHC Service Index', value: pakistanCtx.statistics['uhcServiceIndex'] ?? '45' },
      ]
    : []

  // ---------- loading skeleton ----------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm">Loading Healthcare Analytics data...</p>
        <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-2xl">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-8 text-white shadow-lg">
        {/* decorative blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Healthcare Analytics Intelligence Workbench
          </h1>
          <p className="mt-2 text-emerald-100 text-lg">
            HL7 FHIR R5 &times; Teradata HCDM &times; Pakistan Healthcare Context
          </p>

          {index && (
            <p className="mt-1 text-emerald-200/80 text-xs">
              v{index.version} &middot; Generated {new Date(index.generatedAt).toLocaleDateString()}
            </p>
          )}

          {/* Hero stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            {heroStats.map(s => (
              <div
                key={s.label}
                className="bg-white/15 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center text-center border border-white/20 hover:bg-white/25 transition-colors"
              >
                <s.icon size={22} className="text-white/90 mb-2" />
                <span className="text-2xl font-bold leading-none">{s.value}</span>
                <span className="text-xs text-emerald-100 mt-1 leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1 — FHIR Category Donut */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-white font-semibold text-lg mb-4">FHIR Resource Categories</h2>
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                >
                  {donutData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">No category data</div>
          )}
        </div>

        {/* 2 — HCF Capability Bar Chart */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-white font-semibold text-lg mb-4">HCF Capability Themes</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 13 }} />
                <YAxis
                  type="category"
                  dataKey="theme"
                  width={130}
                  tick={{ fill: '#cbd5e1', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {barData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">No capability data</div>
          )}
        </div>

        {/* 3 — Pakistan Health Metrics */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-white font-semibold text-lg mb-4">Pakistan Health Metrics</h2>
          <div className="space-y-3">
            {pakistanMetrics.length > 0 ? (
              pakistanMetrics.map(m => (
                <div
                  key={m.label}
                  className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-3 border border-slate-600/30"
                >
                  <span className="text-slate-300 text-sm">{m.label}</span>
                  <span className="text-white font-semibold text-sm">{String(m.value)}</span>
                </div>
              ))
            ) : (
              <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">No Pakistan context data</div>
            )}
            {pakistanCtx && pakistanCtx.facilityHierarchy && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-emerald-400 text-xs font-medium mb-2">Facility Hierarchy</p>
                <div className="grid grid-cols-2 gap-2">
                  {pakistanCtx.facilityHierarchy.slice(0, 4).map(f => (
                    <div key={f.level} className="text-center bg-slate-700/30 rounded-lg px-2 py-2">
                      <span className="block text-white text-sm font-semibold">{String(f.count)}</span>
                      <span className="block text-slate-400 text-xs leading-tight">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 — Quick Nav Grid */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 lg:col-span-2 xl:col-span-2">
          <h2 className="text-white font-semibold text-lg mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {navPages.map(page => (
              <button
                key={page.path}
                onClick={() => navigate(page.path)}
                className="text-left bg-slate-700/40 hover:bg-emerald-600/20 border border-slate-600/30 hover:border-emerald-500/40 rounded-lg p-4 transition-all group"
              >
                <h3 className="text-white font-medium text-sm group-hover:text-emerald-400 transition-colors">
                  {page.title}
                </h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
                  {page.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 5 — Maturity Preview Radar */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-white font-semibold text-lg mb-1">Maturity Preview</h2>
          <p className="text-slate-400 text-xs mb-4">Sample HACR category scores (placeholder)</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
              />
              <Radar
                name="Maturity"
                dataKey="score"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── HCDM Subject Areas Strip ─── */}
      {subjectAreas.length > 0 && (
        <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-white font-semibold text-lg mb-4">HCDM Subject Areas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {subjectAreas.map(area => (
              <div
                key={area.id}
                className="rounded-lg p-3 border text-center"
                style={{ borderColor: area.color + '60', backgroundColor: area.color + '15' }}
              >
                <span className="block text-white text-sm font-medium leading-tight">{area.name}</span>
                <span className="block text-xs mt-1" style={{ color: area.color }}>
                  {area.estimatedEntities} entities &middot; {area.fhirResources.length} FHIR
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
