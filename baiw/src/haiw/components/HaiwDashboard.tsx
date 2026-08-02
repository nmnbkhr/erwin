import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Layers, Target, ClipboardList, Table, Puzzle } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { loadFhirResources, loadResourceCategories, loadCapabilities, loadHcdmSubjectAreas, loadPakistanContext, loadIndex } from '../data'
import type { HaiwResourceCategory, HaiwCapability, HaiwHcdmSubjectArea, HaiwPakistanContext, HaiwIndex } from '../types'
import { hacrRadarState } from '../hacr'
import { useEngagementOptional } from '../../engagement/context'
import { coverageStatement } from '../../scoring/maturity'

const heroStats = [
  { label: 'FHIR Resources', value: '157', icon: Database },
  { label: 'HCDM Subject Areas', value: '12', icon: Layers },
  { label: 'HCF Capabilities', value: '108', icon: Target },
  { label: 'HACR Questions', value: '720+', icon: ClipboardList },
  { label: 'Star Schema Tables', value: '24', icon: Table },
  { label: 'Gap Extension Tables', value: '25', icon: Puzzle },
]

const navPages = [
  { path: '/haiw/workbench', title: 'Health Workbench', desc: 'Business → Data → Technology blueprint for healthcare analytics across FHIR, HCDM and HCF.' },
  { path: '/haiw/model', title: 'FHIR Data Model', desc: 'Explore 157 HL7 FHIR R5 resources organized across 12 categories with full element definitions.' },
  { path: '/haiw/capabilities', title: 'Capability Framework', desc: 'Browse 108 healthcare analytics capabilities across 6 strategic themes.' },
  { path: '/haiw/graph', title: 'Dependency Graph', desc: 'Visualize cross-resource and cross-capability dependencies in an interactive network.' },
  { path: '/haiw/maturity', title: 'Maturity Assessment', desc: 'Run the 720-question HACR assessment to evaluate organizational healthcare analytics maturity.' },
  { path: '/haiw/analytics', title: 'Analytics Layer', desc: 'Explore star schema tables, views, and gap extension modules for Teradata HCDM.' },
  { path: '/haiw/roadmap', title: 'Implementation Roadmap', desc: 'Generate a prioritized, phased roadmap based on assessment results and gaps.' },
  { path: '/haiw/pakistan', title: 'Pakistan Health Context', desc: 'Pakistan-specific healthcare system data, facility hierarchy, and priority programs.' },
]

/*
 * ── D-013: THIS RADAR SHOWED FABRICATED SCORES OVER FABRICATED LABELS ───────
 *
 * It was `score: Math.floor(Math.random() * 2) + 2` over eight hand-typed names,
 * captioned "Sample HACR category scores (placeholder)". Two defects, and the
 * caption covers neither:
 *
 *   1. The scores were random. Fresh numbers on every module load, drawn with the
 *      same authority as the three charts beside it, which are real. "Variation
 *      is the tell" — spread with no source is a disguise, not data.
 *   2. NOT ONE OF THE EIGHT LABELS WAS AN HACR CATEGORY. The exact overlap with
 *      `hacrQuestions.json` was zero: it said "Data Governance", "Infrastructure",
 *      "Interoperability" where HACR has "Data Governance & Standards",
 *      "Infrastructure & Systems", "Integration & Interoperability", and four of
 *      the eight ("Clinical Analytics", "Population Health", "Financial
 *      Analytics", "Research & Innovation") correspond to nothing in the module
 *      at all. A reader comparing this card to the assessment screen would have
 *      found eight different axis names and no way to reconcile them.
 *
 * A subtitle does not fix either. The card is rendered at the same size, in the
 * same palette, with the same axis furniture as the measurements next to it, and
 * a radar polygon reads as a measurement whatever the small print says.
 *
 * HAIW is the module where the honest version is cheap, so it is wired rather
 * than removed:
 *
 *   ANSWERS ARE REACHABLE. `HealthMaturityAssessment.tsx` files them under
 *   `HACR_ANSWERS_KEY` through `usePersistedState`, which namespaces per active
 *   engagement; `EngagementProvider` wraps every route. This card reads the same
 *   key through the same `engagement/storage` primitive, so it cannot become D4's
 *   site 3 — a component reading a bare key nothing has written since namespacing.
 *
 *   THE 1.18 MB QUESTION BANK IS NOT NEEDED. Attribution comes from the answer's
 *   own id (`HACR-SL-001`), and `HACR-CATEGORY-MAP` asserts for all 720 that the
 *   id code and the `category` field select the same category. So this partition
 *   is the assessment screen's partition, and `hacrQuestions.json` stays out of
 *   the dashboard's chunks.
 *
 * Three states, as everywhere: an untouched category is NOT ASSESSED and plots no
 * vertex, never a zero on the innermost ring.
 *
 * The read-and-score itself is `hacr.ts::hacrRadarState`, not this file: a
 * component file is the one place a harness cannot reach it, and that is exactly
 * how this defect and D-012 stayed invisible. `npm run drive:dashboards` calls it.
 */

export default function HaiwDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<HaiwResourceCategory[]>([])
  const [capabilities, setCapabilities] = useState<HaiwCapability[]>([])
  const [subjectAreas, setSubjectAreas] = useState<HaiwHcdmSubjectArea[]>([])
  const [pakistanCtx, setPakistanCtx] = useState<HaiwPakistanContext | null>(null)
  const [index, setIndex] = useState<HaiwIndex | null>(null)

  // Re-read when the active engagement changes: this card must never show one
  // client's answers under another's name.
  const activeId = useEngagementOptional()?.activeId ?? null
  const { answered, outcomes } = useMemo(() => hacrRadarState(activeId), [activeId])
  const coverage = useMemo(() => coverageStatement(outcomes), [outcomes])
  const radarData = useMemo(
    () =>
      outcomes.map(o => ({
        category: o.name,
        // `null`, not 0. Recharts leaves an unmeasured axis without a vertex; a 0
        // would draw one on the innermost ring and read as "this is weak" where
        // the truth is "nobody has told us about this yet".
        score: o.agg.state === 'scored' ? o.agg.current : null,
        fullMark: 5,
      })),
    [outcomes],
  )

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const [, cats, caps, areas, pak, idx] = await Promise.all([
          loadFhirResources(),
          loadResourceCategories(),
          loadCapabilities(),
          loadHcdmSubjectAreas(),
          loadPakistanContext(),
          loadIndex(),
        ])
        if (cancelled) return
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

        {/* 5 — HACR Maturity Radar. Real answers or nothing — see D-013 above. */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white font-semibold text-lg">HACR Maturity</h2>
            {answered > 0 && (
              <button
                onClick={() => navigate('/haiw/maturity')}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                View Full Results →
              </button>
            )}
          </div>
          {answered === 0 ? (
            /*
             * No answers is a legitimate state with its own message, not a chart
             * of zeros and not a chart of invented numbers. It also distinguishes
             * the two ways of having none — no engagement selected versus an
             * engagement that has not been assessed — because they mean opposite
             * things and produce the same empty radar.
             */
            <div className="h-[280px] flex flex-col items-center justify-center text-center gap-3">
              <p className="text-slate-400 text-sm">
                {activeId === null
                  ? 'Select an engagement to see its HACR maturity radar here.'
                  : 'No HACR answers recorded for this engagement yet.'}
              </p>
              <button
                onClick={() => navigate('/haiw/maturity')}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Start the HACR assessment →
              </button>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-xs mb-4">Current maturity by HACR category</p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 5]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Current"
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
              {/* The denominator, on the card. A polygon drawn from three of eight
                  categories is not the same claim as one drawn from eight, and the
                  shape alone cannot tell them apart — the D-003 lesson, on a
                  dashboard tile. */}
              <p className="text-slate-400 text-xs text-center">{coverage}</p>
            </>
          )}
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
