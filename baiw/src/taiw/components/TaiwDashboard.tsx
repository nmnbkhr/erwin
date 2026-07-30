import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis,
  AreaChart, Area, Line, CartesianGrid,
} from 'recharts'
import {
  Database, Layers, HelpCircle, Globe, Target, Share2,
  BarChart3, TrendingUp, Map, Flag, Ship, ArrowDownRight,
  CheckCircle2, Download, Briefcase,
} from 'lucide-react'
import { downloadJSON } from '../utils/export'
import {
  loadIndex, loadDomains, loadCapabilities, loadPakistanContext,
} from '../data'
import type {
  TaiwIndex, TaiwDomain, TaiwCapability, TaiwPakistanContext,
} from '../types'

/* ---------- Theme color map for TCF themes ---------- */
const THEME_COLORS: Record<string, string> = {
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
  violet: '#8B5CF6',
  emerald: '#10B981',
  indigo: '#6366F1',
}

/* ---------- TD1: Static monthly trade data for sparkline ---------- */
const MONTHLY_TRADE = [
  { month: 'Jul', exports: 2.6, imports: 4.8 },
  { month: 'Aug', exports: 2.7, imports: 4.9 },
  { month: 'Sep', exports: 2.8, imports: 5.0 },
  { month: 'Oct', exports: 2.6, imports: 4.7 },
  { month: 'Nov', exports: 2.7, imports: 5.1 },
  { month: 'Dec', exports: 2.9, imports: 5.2 },
  { month: 'Jan', exports: 2.5, imports: 4.6 },
  { month: 'Feb', exports: 2.7, imports: 4.8 },
  { month: 'Mar', exports: 2.8, imports: 5.0 },
  { month: 'Apr', exports: 2.6, imports: 4.9 },
  { month: 'May', exports: 2.7, imports: 4.7 },
  { month: 'Jun', exports: 2.5, imports: 4.5 },
]

/* ---------- Quick-nav definitions ---------- */
const navModules = [
  { path: '/taiw', label: 'Dashboard', desc: 'Overview stats & charts', icon: BarChart3, color: 'text-teal-600' },
  { path: '/taiw/workbench', label: 'Trade Workbench', desc: 'Business → Data → Tech blueprint', icon: Briefcase, color: 'text-indigo-600' },
  { path: '/taiw/model', label: 'WCO Model', desc: 'Browse WCO data elements', icon: Globe, color: 'text-cyan-600' },
  { path: '/taiw/capabilities', label: 'Capabilities', desc: 'Trade Capability Framework', icon: Target, color: 'text-amber-600' },
  { path: '/taiw/graph', label: 'Dependencies', desc: 'Element-capability graph', icon: Share2, color: 'text-indigo-600' },
  { path: '/taiw/maturity', label: 'Maturity', desc: 'TACR assessment tool', icon: BarChart3, color: 'text-violet-600' },
  { path: '/taiw/analytics', label: 'Analytics', desc: 'Trade analytics engine', icon: TrendingUp, color: 'text-emerald-600' },
  { path: '/taiw/roadmap', label: 'Roadmap', desc: 'Implementation roadmap', icon: Map, color: 'text-rose-600' },
  { path: '/taiw/pakistan', label: 'Pakistan Trade', desc: 'Pakistan customs context', icon: Flag, color: 'text-sky-600' },
]

/* ---------- TD3: CSS Gauge Ring component ---------- */
function ConformityGauge({ level, maxLevel }: { level: number; maxLevel: number }) {
  const pct = (level / maxLevel) * 100
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (pct / 100) * circumference
  const levelColors = ['#EF4444', '#F59E0B', '#14B8A6', '#059669']
  const color = levelColors[Math.min(level - 1, 3)] || '#94A3B8'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle
          cx="55" cy="55" r="45"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="8"
        />
        <circle
          cx="55" cy="55" r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>L{level}</span>
        <span className="text-xs text-slate-400">of {maxLevel}</span>
      </div>
    </div>
  )
}

/* ---------- TD2: Compute live data counts for nav cards ---------- */
function getNavDetail(
  label: string,
  index: TaiwIndex | null,
): string {
  const stats = index?.stats ?? {}
  switch (label) {
    case 'Dashboard':
      return 'Overview & analytics'
    case 'WCO Model':
      return `${stats.dataElements ?? 727} elements across ${stats.domains ?? 14} domains`
    case 'Capabilities':
      return `${stats.capabilities ?? 100} across 6 themes`
    case 'Dependencies':
      return `${stats.mappings ?? '430'}+ mappings`
    case 'Maturity': {
      try {
        const raw = localStorage.getItem('taiw_maturity')
        if (raw) {
          const parsed = JSON.parse(raw)
          const done = Object.keys(parsed).length
          return `${done}/8 categories assessed`
        }
      } catch { /* ignore */ }
      return 'Not started'
    }
    case 'Analytics':
      return `${stats.starTables ?? 21} tables + ${stats.starViews ?? 6} views`
    case 'Roadmap': {
      try {
        const raw = localStorage.getItem('taiw_roadmap')
        if (raw) {
          const parsed = JSON.parse(raw)
          const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length
          return `${count} capabilities selected`
        }
      } catch { /* ignore */ }
      return 'Build your plan'
    }
    case 'Pakistan Trade':
      return '8 reference sections'
    default:
      return ''
  }
}

/* ---------- TD3: Derive conformity level from maturity assessment ---------- */
function getConformityLevel(): number {
  try {
    const raw = localStorage.getItem('taiw_maturity')
    if (raw) {
      const parsed = JSON.parse(raw)
      // Look for Data Governance category score
      if (parsed['Data Governance']) {
        const dgAnswers = parsed['Data Governance']
        if (Array.isArray(dgAnswers) && dgAnswers.length > 0) {
          const avg = dgAnswers.reduce((sum: number, a: { currentState?: number }) => sum + (a.currentState ?? 1), 0) / dgAnswers.length
          return Math.max(1, Math.min(4, Math.round(avg)))
        }
      }
      // Fallback: average across all categories
      const allAnswers = Object.values(parsed).flat() as { currentState?: number }[]
      if (allAnswers.length > 0) {
        const avg = allAnswers.reduce((sum, a) => sum + (a.currentState ?? 1), 0) / allAnswers.length
        return Math.max(1, Math.min(4, Math.round(avg)))
      }
    }
  } catch { /* ignore */ }
  return 1 // Default: Level 1
}

export default function TaiwDashboard() {
  const navigate = useNavigate()
  const [index, setIndex] = useState<TaiwIndex | null>(null)
  const [domains, setDomains] = useState<TaiwDomain[]>([])
  const [capabilities, setCapabilities] = useState<TaiwCapability[]>([])
  const [pakContext, setPakContext] = useState<TaiwPakistanContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      loadIndex(),
      loadDomains(),
      loadCapabilities(),
      loadPakistanContext(),
    ]).then(([idx, doms, caps, pak]) => {
      setIndex(idx)
      setDomains(doms)
      setCapabilities(caps)
      setPakContext(pak)
      setLoading(false)
    })
  }, [])

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 h-80 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  /* ---- Derived data ---- */
  const stats = index?.stats ?? {}
  const heroCards: { label: string; value: number; icon: typeof Database; color: string }[] = [
    { label: 'Data Elements', value: stats.dataElements ?? 727, icon: Database, color: 'bg-teal-600' },
    { label: 'Capabilities', value: stats.capabilities ?? 100, icon: Layers, color: 'bg-cyan-600' },
    { label: 'TACR Questions', value: stats.tacrQuestions ?? 640, icon: HelpCircle, color: 'bg-teal-500' },
    { label: 'WCO Domains', value: stats.domains ?? 14, icon: Globe, color: 'bg-cyan-500' },
  ]

  // Domain donut data -- use each domain's own color
  const domainChartData = [...domains]
    .sort((a, b) => b.count - a.count)
    .map((d) => ({ name: d.name, value: d.count, fill: d.color }))

  // TCF theme bar data -- group capabilities by theme
  const themeMap: Record<string, { count: number; color: string }> = {}
  capabilities.forEach((cap) => {
    if (!themeMap[cap.theme]) {
      themeMap[cap.theme] = { count: 0, color: cap.themeColor || '#64748B' }
    }
    themeMap[cap.theme].count++
  })
  const themeBarData = Object.entries(themeMap).map(([name, { count, color }]) => ({
    name,
    count,
    fill: THEME_COLORS[color] || color,
  }))

  // Pakistan trade stats (from context or fallback)
  const tradeStats = pakContext?.tradeStats
  const pakMetrics = [
    { label: 'Total Exports', value: tradeStats?.totalExports ?? '$32.11B' },
    { label: 'Total Imports', value: tradeStats?.totalImports ?? '$58.38B' },
    { label: 'Trade Deficit', value: tradeStats?.tradeDeficit ?? '$26.27B' },
    { label: 'Customs Revenue', value: tradeStats?.customsRevenue ?? 'PKR ~1,100B' },
    { label: 'GDs Processed', value: tradeStats?.gdsProcessed ?? '4M+' },
    { label: 'Active Traders', value: tradeStats?.activeTraders ?? '50,000+' },
  ]

  // TD3: Conformity level
  const conformityLevel = getConformityLevel()

  return (
    <div className="space-y-6">
      {/* Every page needs exactly one h1 for the document outline: screen readers
          navigate by heading and these pages had none. Visually hidden because the
          page title is already communicated by the sidebar and header chrome. */}
      <h1 className="sr-only">Trade Analytics Dashboard</h1>
      {/* ===== Export Button ===== */}
      <div className="flex justify-end">
        <button
          onClick={() => downloadJSON({
            stats,
            domains: domainChartData,
            themes: themeBarData,
            tradeStats: pakMetrics,
            conformityLevel,
          }, `taiw-dashboard-${new Date().toISOString().slice(0, 10)}.json`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors shadow-sm text-slate-600"
        >
          <Download size={12} />
          Export JSON
        </button>
      </div>

      {/* ===== 1. Hero Stats Row ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {heroCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{card.value.toLocaleString()}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Charts & Cards Row ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 2. WCO Domain Distribution (Donut) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">WCO Domain Distribution</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={domainChartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                onClick={(entry) => navigate(`/taiw/model?domain=${encodeURIComponent(entry.name)}`)}
                className="cursor-pointer"
              >
                {domainChartData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip formatter={((value: number) => value.toLocaleString()) as never} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 3. TCF Theme Distribution (Horizontal Bar) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">TCF Capabilities by Theme</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={themeBarData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                onClick={(entry) => navigate(`/taiw/capabilities?theme=${encodeURIComponent(String(entry.name))}`)}
                className="cursor-pointer"
              >
                {themeBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Pakistan Trade Snapshot */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Ship size={20} className="text-teal-700" />
            <h3 className="text-base font-semibold text-slate-700">Pakistan Trade Snapshot</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {pakMetrics.map((m) => (
              <div key={m.label} className="p-3 bg-teal-50 rounded-lg">
                <p className="text-lg font-bold text-teal-800">{m.value}</p>
                <p className="text-xs text-teal-600">{m.label}</p>
              </div>
            ))}
          </div>
          {tradeStats && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <ArrowDownRight size={14} className="text-red-400" />
              <span>Ports: {tradeStats.ports}</span>
            </div>
          )}
        </div>

        {/* ===== TD1: Trade Balance Sparkline Card ===== */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-teal-700" />
              <h3 className="text-base font-semibold text-slate-700">Trade Balance Trend</h3>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-600">$26.27B</p>
              <p className="text-xs text-slate-400">Current Deficit</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_TRADE} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="deficitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" domain={[0, 6]} tickFormatter={(v) => `$${v}B`} />
              <Tooltip
                formatter={((value: number, name: string) => [`$${value}B`, name === 'imports' ? 'Imports' : 'Exports']) as never}
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
              />
              <Area
                type="monotone"
                dataKey="imports"
                stroke="#EF4444"
                strokeWidth={2}
                fill="deficitGrad"
                fillOpacity={1}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="exports"
                stroke="#14B8A6"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-500 rounded" />
              <span className="text-xs text-slate-500">Imports</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-teal-500 rounded" />
              <span className="text-xs text-slate-500">Exports</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-red-100 rounded" />
              <span className="text-xs text-slate-500">Deficit</span>
            </div>
          </div>
        </div>

        {/* ===== TD3: WCO DM Conformity Score ===== */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={20} className="text-teal-700" />
            <h3 className="text-base font-semibold text-slate-700">WCO DM Conformity</h3>
          </div>
          <div className="flex items-center gap-6">
            <ConformityGauge level={conformityLevel} maxLevel={4} />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Pakistan WCO DM Conformity
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Level {conformityLevel} of 4
                </p>
              </div>
              <div className="space-y-1.5">
                {['L1: Basic Mapping', 'L2: Partial Alignment', 'L3: Full Alignment', 'L4: Advanced Integration'].map((lbl, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        i + 1 <= conformityLevel
                          ? 'border-teal-500 bg-teal-500'
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                    <span className={`text-xs ${i + 1 <= conformityLevel ? 'text-teal-700 font-medium' : 'text-slate-400'}`}>
                      {lbl}
                    </span>
                  </div>
                ))}
              </div>
              {conformityLevel === 1 && (
                <button
                  onClick={() => navigate('/taiw/maturity')}
                  className="text-xs text-teal-600 hover:text-teal-800 underline mt-1"
                >
                  Take TACR Assessment to update
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== TD2: Quick Navigation Grid with Data Counts ===== */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 gap-3">
            {navModules.map((m) => (
              <button
                key={m.path}
                onClick={() => navigate(m.path)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition text-left"
              >
                <m.icon size={18} className={`${m.color} mt-0.5 shrink-0`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">{m.label}</p>
                  <p className="text-xs text-slate-400 leading-tight">{getNavDetail(m.label, index)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
