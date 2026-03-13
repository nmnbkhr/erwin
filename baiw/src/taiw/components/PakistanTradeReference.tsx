import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Building2, BarChart3, Receipt, Handshake, Train,
  Anchor, FileText, AlertTriangle, ExternalLink,
  ChevronDown, ChevronRight, MapPin, Download,
} from 'lucide-react'
import { downloadJSON } from '../utils/export'
import { loadPakistanContext } from '../data'
import type { TaiwPakistanContext } from '../types'

/* ---------- Tab definitions ---------- */
type TabId =
  | 'institutions'
  | 'tradeStats'
  | 'dutyStructure'
  | 'tradeAgreements'
  | 'cpec'
  | 'ports'
  | 'gdTypes'
  | 'challenges'

const tabs: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: 'institutions', label: 'Institutional Framework', icon: Building2 },
  { id: 'tradeStats', label: 'Trade Statistics FY2024-25', icon: BarChart3 },
  { id: 'dutyStructure', label: 'Customs Duty Structure', icon: Receipt },
  { id: 'tradeAgreements', label: 'Trade Agreements', icon: Handshake },
  { id: 'cpec', label: 'CPEC Context', icon: Train },
  { id: 'ports', label: 'Ports & Borders', icon: Anchor },
  { id: 'gdTypes', label: 'WeBOC GD Types', icon: FileText },
  { id: 'challenges', label: 'Key Challenges', icon: AlertTriangle },
]

/* ---------- Severity badge ---------- */
function SeverityBadge({ severity }: { severity: string }) {
  const colors =
    severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200' :
    severity === 'HIGH'     ? 'bg-amber-100 text-amber-700 border-amber-200' :
    severity === 'MEDIUM'   ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                              'bg-green-100 text-green-700 border-green-200'
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded border ${colors}`}>
      {severity}
    </span>
  )
}

/* ---------- Bar chart colors ---------- */
const EXPORT_COLOR = '#0D9488'   // teal-600
const IMPORT_COLOR  = '#E11D48'  // rose-600

/* ====================================================================== */
export default function PakistanTradeReference() {
  const [context, setContext] = useState<TaiwPakistanContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('institutions')

  useEffect(() => {
    loadPakistanContext().then((data) => {
      setContext(data)
      setLoading(false)
    })
  }, [])

  /* ---- Loading skeleton ---- */
  if (loading || !context) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm h-10 animate-pulse" />
        <div className="bg-white rounded-lg shadow-sm h-12 animate-pulse" />
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-260px)] animate-pulse" />
      </div>
    )
  }

  /* ---- Derived counts ---- */
  const institutionEntries = Object.entries(context.institutions)
  const institutionCount = institutionEntries.length
  const gdTypeCount = context.gdTypes.length
  const agreementCount = context.tradeAgreements.length
  const portCount = context.ports.length

  return (
    <div className="space-y-4">
      {/* ===== Stats bar ===== */}
      <div className="bg-white rounded-lg shadow-sm px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="text-teal-700 font-semibold">{institutionCount} Institutions</span>
        <span className="text-slate-300">|</span>
        <span className="text-teal-700 font-semibold">{gdTypeCount} GD Types</span>
        <span className="text-slate-300">|</span>
        <span className="text-teal-700 font-semibold">{agreementCount} Trade Agreements</span>
        <span className="text-slate-300">|</span>
        <span className="text-teal-700 font-semibold">{portCount}+ Ports &amp; Borders</span>
        <div className="flex-1" />
        <button
          onClick={() => downloadJSON(context, `taiw-pakistan-reference-${new Date().toISOString().slice(0, 10)}.json`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-white border-slate-200 text-slate-500 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition"
        >
          <Download size={12} />
          Export JSON
        </button>
      </div>

      {/* ===== Tab navigation ===== */}
      <div className="bg-white rounded-lg shadow-sm px-2 py-1.5 flex gap-1 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors font-medium ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* Tab 1 — Institutional Framework                                  */}
      {/* ================================================================ */}
      {activeTab === 'institutions' && (
        <InstitutionsTab entries={institutionEntries} />
      )}

      {/* ================================================================ */}
      {/* Tab 2 — Trade Statistics FY2024-25                               */}
      {/* ================================================================ */}
      {activeTab === 'tradeStats' && (
        <TradeStatsTab stats={context.tradeStats} />
      )}

      {/* ================================================================ */}
      {/* Tab 3 — Customs Duty Structure                                   */}
      {/* ================================================================ */}
      {activeTab === 'dutyStructure' && (
        <DutyStructureTab duties={context.dutyStructure} />
      )}

      {/* ================================================================ */}
      {/* Tab 4 — Trade Agreements                                         */}
      {/* ================================================================ */}
      {activeTab === 'tradeAgreements' && (
        <TradeAgreementsTab agreements={context.tradeAgreements} />
      )}

      {/* ================================================================ */}
      {/* Tab 5 — CPEC Context                                             */}
      {/* ================================================================ */}
      {activeTab === 'cpec' && (
        <CpecTab cpec={context.cpec} />
      )}

      {/* ================================================================ */}
      {/* Tab 6 — Ports & Borders                                          */}
      {/* ================================================================ */}
      {activeTab === 'ports' && (
        <PortsTab ports={context.ports} />
      )}

      {/* ================================================================ */}
      {/* Tab 7 — WeBOC GD Types                                           */}
      {/* ================================================================ */}
      {activeTab === 'gdTypes' && (
        <GdTypesTab gdTypes={context.gdTypes} />
      )}

      {/* ================================================================ */}
      {/* Tab 8 — Key Challenges                                           */}
      {/* ================================================================ */}
      {activeTab === 'challenges' && (
        <ChallengesTab challenges={context.keyChallenges} />
      )}
    </div>
  )
}

/* ====================================================================== */
/* Tab 1 — Institutional Framework                                        */
/* ====================================================================== */
function InstitutionsTab({
  entries,
}: {
  entries: [string, { name: string; role: string; system?: string; url?: string }][]
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-4">
        Institutional Framework ({entries.length} institutions)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-600 text-white">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Abbreviation</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Full Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">System</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">URL</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([code, inst], idx) => (
              <tr
                key={code}
                className={`border-t border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-teal-50 transition-colors`}
              >
                <td className="px-4 py-3 font-mono font-bold text-teal-700 uppercase">{code}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{inst.name}</td>
                <td className="px-4 py-3 text-slate-600 text-xs leading-relaxed">{inst.role}</td>
                <td className="px-4 py-3">
                  {inst.system ? (
                    <span className="inline-flex px-2 py-0.5 text-xs bg-teal-100 text-teal-700 rounded font-medium">
                      {inst.system}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">--</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {inst.url ? (
                    <a
                      href={inst.url.startsWith('http') ? inst.url : `https://${inst.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 hover:underline"
                    >
                      {inst.url}
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ====================================================================== */
/* Tab 2 — Trade Statistics FY2024-25                                     */
/* ====================================================================== */
function TradeStatsTab({
  stats,
}: {
  stats: TaiwPakistanContext['tradeStats']
}) {
  /* Build combined bar chart data for exports vs imports sectors */
  const chartData = useMemo(() => {
    const sectorMap = new Map<string, { sector: string; exports: number; imports: number }>()
    stats.topExportSectors.forEach((s) => {
      const num = parseFloat(s.value.replace(/[^0-9.]/g, '')) || 0
      sectorMap.set(s.sector, { sector: s.sector, exports: num, imports: 0 })
    })
    stats.topImportSectors.forEach((s) => {
      const num = parseFloat(s.value.replace(/[^0-9.]/g, '')) || 0
      const existing = sectorMap.get(s.sector)
      if (existing) {
        existing.imports = num
      } else {
        sectorMap.set(s.sector, { sector: s.sector, exports: 0, imports: num })
      }
    })
    return Array.from(sectorMap.values())
  }, [stats])

  const keyMetrics = [
    { label: 'Total Exports', value: stats.totalExports, color: 'text-teal-800', bg: 'bg-teal-50' },
    { label: 'Total Imports', value: stats.totalImports, color: 'text-red-700', bg: 'bg-red-50' },
    { label: 'Trade Deficit', value: stats.tradeDeficit, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Customs Revenue', value: stats.customsRevenue, color: 'text-slate-800', bg: 'bg-slate-50' },
    { label: 'GDs Processed', value: stats.gdsProcessed, color: 'text-teal-800', bg: 'bg-teal-50' },
    { label: 'Active Traders', value: stats.activeTraders, color: 'text-teal-800', bg: 'bg-teal-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {keyMetrics.map((m) => (
          <div key={m.label} className={`${m.bg} rounded-lg p-4 text-center`}>
            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Side-by-side sector tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Export Sectors */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">Top Export Sectors</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-teal-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-teal-700">Sector</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-teal-700">Value</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-teal-700">Share</th>
                </tr>
              </thead>
              <tbody>
                {stats.topExportSectors.map((s) => (
                  <tr key={s.sector} className="border-t border-slate-100 hover:bg-teal-50/50">
                    <td className="px-4 py-2 font-medium text-slate-700">{s.sector}</td>
                    <td className="px-4 py-2 text-right text-teal-700 font-medium">{s.value}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="px-2 py-0.5 text-xs bg-teal-100 text-teal-700 rounded">{s.share}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Import Sectors */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">Top Import Sectors</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-red-700">Sector</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-red-700">Value</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-red-700">Share</th>
                </tr>
              </thead>
              <tbody>
                {stats.topImportSectors.map((s) => (
                  <tr key={s.sector} className="border-t border-slate-100 hover:bg-red-50/50">
                    <td className="px-4 py-2 font-medium text-slate-700">{s.sector}</td>
                    <td className="px-4 py-2 text-right text-red-700 font-medium">{s.value}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">{s.share}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Trading Partners as badge lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-teal-700 mb-3">Top Export Partners</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topPartners.exports.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-sm font-medium text-teal-800"
              >
                <span className="w-5 h-5 rounded-full bg-teal-200 text-teal-700 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-rose-700 mb-3">Top Import Partners</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topPartners.imports.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-sm font-medium text-rose-800"
              >
                <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts BarChart: Exports vs Imports by sector */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">
          Export vs Import Sectors (USD Billion)
        </h3>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} margin={{ left: 10, right: 10, bottom: 40 }}>
            <XAxis
              dataKey="sector"
              tick={{ fontSize: 10 }}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={((value: number, name: string) => [
                `$${value.toFixed(2)}B`,
                name === 'exports' ? 'Exports' : 'Imports',
              ]) as never}
            />
            <Legend />
            <Bar dataKey="exports" name="Exports" fill={EXPORT_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="imports" name="Imports" fill={IMPORT_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ====================================================================== */
/* Tab 3 — Customs Duty Structure                                         */
/* ====================================================================== */
function DutyStructureTab({
  duties,
}: {
  duties: TaiwPakistanContext['dutyStructure']
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-2">
        Customs Duty Structure ({duties.length} duty/tax types)
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Total effective duty rate is the cumulative application of all applicable duties and taxes on a single consignment.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-600 text-white">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Duty / Tax Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Rates</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Authority</th>
            </tr>
          </thead>
          <tbody>
            {duties.map((d, idx) => (
              <tr
                key={d.name}
                className={`border-t border-slate-100 ${idx % 2 === 0 ? 'bg-teal-50/40' : 'bg-teal-50/20'} hover:bg-teal-100/50 transition-colors`}
              >
                <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded font-medium">
                    {d.rates}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{d.authority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ====================================================================== */
/* Tab 4 — Trade Agreements                                               */
/* ====================================================================== */
/* Deep-dive static data for trade agreements */
const AGREEMENT_DEEP_DIVE: Record<string, {
  utilizationRate: string
  rulesOfOrigin: string
}> = {
  'CPFTA-II':  { utilizationRate: '~75%', rulesOfOrigin: 'CTC + RVC 40%' },
  'SAFTA':     { utilizationRate: '~30%', rulesOfOrigin: 'CTC' },
  'GSP+':      { utilizationRate: '~85%', rulesOfOrigin: 'Bilateral Cumulation' },
  'D-8 PTA':   { utilizationRate: '~5%',  rulesOfOrigin: 'CTC' },
  'ECO TPA':   { utilizationRate: '~3%',  rulesOfOrigin: 'RVC 40%' },
  'APTA':      { utilizationRate: '~15%', rulesOfOrigin: 'CTC + RVC' },
}

function getDeepDive(code: string) {
  if (AGREEMENT_DEEP_DIVE[code]) return AGREEMENT_DEEP_DIVE[code]
  // Fallback: partial match on code prefix
  const match = Object.keys(AGREEMENT_DEEP_DIVE).find(k =>
    code.startsWith(k) || k.startsWith(code)
  )
  return match ? AGREEMENT_DEEP_DIVE[match] : null
}

function TradeAgreementsTab({
  agreements,
}: {
  agreements: TaiwPakistanContext['tradeAgreements']
}) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (code: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code); else next.add(code)
      return next
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-4">
        Free Trade &amp; Preferential Agreements ({agreements.length})
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Click any row to expand and view detailed agreement information including utilization rates and rules of origin.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-600 text-white">
              <th className="w-8 px-2 py-2.5"></th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Code</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Agreement Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Since</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Coverage</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Partner</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Conditions</th>
            </tr>
          </thead>
          <tbody>
            {agreements.map((a, idx) => {
              const isActive = !a.since.toLowerCase().includes('negotiation')
              const isExpanded = expandedRows.has(a.code)
              const deepDive = getDeepDive(a.code)
              return (
                <>
                  <tr
                    key={a.code}
                    onClick={() => toggleRow(a.code)}
                    className={`border-t border-slate-100 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-teal-50 transition-colors`}
                  >
                    <td className="px-2 py-3 text-slate-400">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-teal-700">{a.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs rounded font-medium ${
                          isActive
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {a.since}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px]">{a.coverage}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-medium">{a.partner}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {a.conditions ?? <span className="text-slate-400">--</span>}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${a.code}-detail`} className="border-t border-teal-100">
                      <td colSpan={7} className="px-6 py-4 bg-teal-50/60">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          {/* Partner Countries Detail */}
                          <div className="p-3 bg-white rounded-lg border border-teal-100">
                            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Partner Countries</p>
                            <p className="text-sm text-slate-700">{a.partner}</p>
                          </div>
                          {/* Coverage Detail */}
                          <div className="p-3 bg-white rounded-lg border border-teal-100">
                            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Coverage Detail</p>
                            <p className="text-sm text-slate-700">{a.coverage}</p>
                          </div>
                          {/* Utilization Rate */}
                          <div className="p-3 bg-white rounded-lg border border-teal-100">
                            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Est. Utilization Rate</p>
                            <p className="text-lg font-bold text-teal-800">
                              {deepDive?.utilizationRate ?? 'N/A'}
                            </p>
                          </div>
                          {/* Rules of Origin */}
                          <div className="p-3 bg-white rounded-lg border border-teal-100">
                            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Rules of Origin</p>
                            <p className="text-sm font-medium text-slate-700">
                              {deepDive?.rulesOfOrigin ?? 'N/A'}
                            </p>
                          </div>
                          {/* WCO DM Relevance */}
                          <div className="p-3 bg-white rounded-lg border border-cyan-100">
                            <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide mb-1">WCO DM Relevance</p>
                            <span className="inline-flex px-2 py-1 text-xs bg-cyan-100 text-cyan-800 rounded font-mono font-medium">
                              Certificate of Origin IP (DIP_CO)
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ====================================================================== */
/* Tab 5 — CPEC Context                                                   */
/* ====================================================================== */
function CpecTab({ cpec }: { cpec: TaiwPakistanContext['cpec'] }) {
  return (
    <div className="space-y-6">
      {/* Gwadar Port Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Gwadar Port</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-1">Status</p>
            <p className="text-sm font-semibold text-teal-800">{cpec.gwadar.status}</p>
          </div>
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-1">Features</p>
            <p className="text-sm text-teal-800 leading-relaxed">{cpec.gwadar.features}</p>
          </div>
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-1">Capacity Target</p>
            <p className="text-sm font-semibold text-teal-800">{cpec.gwadar.capacity}</p>
          </div>
        </div>
      </div>

      {/* Special Economic Zones */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">
          Special Economic Zones ({cpec.sezs.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {cpec.sezs.map((sez, i) => (
            <span
              key={i}
              className="inline-flex px-3 py-1.5 text-sm font-medium bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-full"
            >
              {sez}
            </span>
          ))}
        </div>
      </div>

      {/* ML-1 Railway */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-3">ML-1 Railway</h3>
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg">
          <p className="text-sm text-sky-800 leading-relaxed">{cpec.ml1Railway}</p>
        </div>
      </div>

      {/* Digital Connectivity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-3">Digital Connectivity</h3>
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-800 leading-relaxed">{cpec.digitalConnectivity}</p>
        </div>
      </div>
    </div>
  )
}

/* ====================================================================== */
/* Tab 6 — Ports & Borders (grouped by type)                              */
/* ====================================================================== */
/* Port Infrastructure: region classification */
interface RegionGroup {
  label: string
  color: string
  dotColor: string
  bgColor: string
  borderColor: string
}

const PORT_REGIONS: Record<string, RegionGroup> = {
  'South Coast': { label: 'South Coast (Seaports)', color: 'text-blue-800', dotColor: 'bg-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'Sindh':       { label: 'Sindh (Airports)', color: 'text-violet-800', dotColor: 'bg-violet-500', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  'Punjab':      { label: 'Punjab (Dry Ports & Airports)', color: 'text-emerald-800', dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'KPK':         { label: 'KPK (Borders & Dry Ports)', color: 'text-amber-800', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  'Balochistan':  { label: 'Balochistan (Borders & CPEC)', color: 'text-rose-800', dotColor: 'bg-rose-500', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  'North':       { label: 'Northern Areas (Borders)', color: 'text-sky-800', dotColor: 'bg-sky-500', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
}

function classifyPortRegion(port: TaiwPakistanContext['ports'][number]): string {
  const n = port.name.toLowerCase()
  const t = port.type.toLowerCase()
  // Seaports
  if (t.includes('seaport') && (n.includes('karachi') || n.includes('qasim'))) return 'South Coast'
  if (t.includes('seaport') && n.includes('gwadar')) return 'Balochistan'
  // Airports
  if (t.includes('airport') && n.includes('khi')) return 'Sindh'
  if (t.includes('airport') && (n.includes('lhe') || n.includes('iqbal'))) return 'Punjab'
  if (t.includes('airport') && (n.includes('isb') || n.includes('islamabad'))) return 'Punjab'
  // Land borders
  if (n.includes('wagah')) return 'Punjab'
  if (n.includes('torkham')) return 'KPK'
  if (n.includes('chaman')) return 'Balochistan'
  if (n.includes('sost')) return 'North'
  // Dry ports
  if (n.includes('lahore') || n.includes('faisalabad')) return 'Punjab'
  if (n.includes('peshawar')) return 'KPK'
  // Fallback
  if (t.includes('seaport')) return 'South Coast'
  if (t.includes('land')) return 'Balochistan'
  if (t.includes('dry')) return 'Punjab'
  return 'South Coast'
}

function PortsTab({ ports }: { ports: TaiwPakistanContext['ports'] }) {
  /* Group ports by type */
  const grouped = useMemo(() => {
    const map = new Map<string, typeof ports>()
    ports.forEach((p) => {
      const key = p.type
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    })
    return Array.from(map.entries())
  }, [ports])

  /* Group ports by region for visual */
  const regionGrouped = useMemo(() => {
    const map = new Map<string, typeof ports>()
    ports.forEach((p) => {
      const region = classifyPortRegion(p)
      if (!map.has(region)) map.set(region, [])
      map.get(region)!.push(p)
    })
    // Sort by the predefined order
    const regionOrder = ['South Coast', 'Sindh', 'Punjab', 'KPK', 'Balochistan', 'North']
    return regionOrder
      .filter(r => map.has(r))
      .map(r => [r, map.get(r)!] as [string, typeof ports])
  }, [ports])

  const typeBadgeColor = (type: string) => {
    if (type.toLowerCase().includes('seaport')) return 'bg-blue-100 text-blue-700'
    if (type.toLowerCase().includes('airport')) return 'bg-violet-100 text-violet-700'
    if (type.toLowerCase().includes('land')) return 'bg-amber-100 text-amber-700'
    if (type.toLowerCase().includes('dry')) return 'bg-emerald-100 text-emerald-700'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-6">
      {/* ===== Port Infrastructure Visual ===== */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-teal-600" />
          <h3 className="text-base font-semibold text-slate-700">
            Pakistan Port Infrastructure Overview
          </h3>
          <span className="ml-auto text-xs text-slate-400">{ports.length} locations across {regionGrouped.length} regions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionGrouped.map(([region, regionPorts]) => {
            const meta = PORT_REGIONS[region]
            if (!meta) return null
            return (
              <div key={region} className={`rounded-lg border ${meta.borderColor} ${meta.bgColor} p-4`}>
                <h4 className={`text-sm font-semibold ${meta.color} mb-3`}>{meta.label}</h4>
                <div className="space-y-2">
                  {regionPorts.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${meta.dotColor} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{p.name}</p>
                      </div>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 text-xs rounded font-medium ${typeBadgeColor(p.type)}`}>
                        {p.type}
                      </span>
                      {p.share && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-xs rounded bg-slate-200 text-slate-700 font-medium">
                          {p.share}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-4">
          {[
            { label: 'Seaport', color: 'bg-blue-500' },
            { label: 'Airport', color: 'bg-violet-500' },
            { label: 'Land Border', color: 'bg-amber-500' },
            { label: 'Dry Port', color: 'bg-emerald-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Existing Port Table ===== */}
      <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-4">
        Ports, Airports &amp; Border Crossings ({ports.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-600 text-white">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Terminals</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Share</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Operator</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Partner</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([type, items]) => (
              <>
                {/* Section header row */}
                <tr key={`header-${type}`} className="bg-slate-100">
                  <td colSpan={6} className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {type} ({items.length})
                  </td>
                </tr>
                {items.map((p, idx) => (
                  <tr
                    key={p.name}
                    className={`border-t border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-teal-50 transition-colors`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded font-medium ${typeBadgeColor(p.type)}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.terminals ? p.terminals.join(', ') : <span className="text-slate-400">--</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.share ?? <span className="text-slate-400">--</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.operator ?? <span className="text-slate-400">--</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.partner ?? <span className="text-slate-400">--</span>}
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}

/* ====================================================================== */
/* Tab 7 — WeBOC GD Types                                                 */
/* ====================================================================== */
function GdTypesTab({
  gdTypes,
}: {
  gdTypes: TaiwPakistanContext['gdTypes']
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-4">
        WeBOC Goods Declaration Types ({gdTypes.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-600 text-white">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide w-24">Code</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Description</th>
            </tr>
          </thead>
          <tbody>
            {gdTypes.map((gd, idx) => (
              <tr
                key={gd.code}
                className={`border-t border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-teal-50 transition-colors`}
              >
                <td className="px-4 py-3">
                  <code className="px-2 py-0.5 text-xs bg-teal-100 text-teal-800 rounded font-mono font-bold">
                    {gd.code}
                  </code>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{gd.name}</td>
                <td className="px-4 py-3 text-xs text-slate-600 leading-relaxed">{gd.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ====================================================================== */
/* Tab 8 — Key Challenges                                                 */
/* ====================================================================== */
function ChallengesTab({
  challenges,
}: {
  challenges: TaiwPakistanContext['keyChallenges']
}) {
  const borderColor = (impact: string) =>
    impact === 'CRITICAL' ? 'border-l-red-500' :
    impact === 'HIGH'     ? 'border-l-amber-500' :
    impact === 'MEDIUM'   ? 'border-l-yellow-400' :
                            'border-l-green-400'

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-700">
        Key Challenges ({challenges.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((ch, i) => (
          <div
            key={i}
            className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${borderColor(ch.impact)}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="text-sm font-semibold text-slate-800">{ch.challenge}</h4>
              <SeverityBadge severity={ch.impact} />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{ch.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
