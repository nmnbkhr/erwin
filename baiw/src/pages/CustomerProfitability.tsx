import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, TrendingUp, Percent, Wallet, Scale, Banknote, DollarSign,
  ArrowUpRight, ArrowDownRight, ArrowRight,
} from 'lucide-react'
import {
  BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Legend,
} from 'recharts'
import data from '../data/customerProfitability.json'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON, downloadPDF } from '../utils/export'

const SOURCE_META: Record<string, { color: string; label: string }> = {
  BAIW: { color: '#3b82f6', label: 'BAIW' },
  ALM: { color: '#6366f1', label: 'ALM · FTP' },
  COE: { color: '#f59e0b', label: 'COE · Cash' },
}

const DRIVER_ICON: Record<string, typeof Scale> = { alm: Scale, coe: Banknote, profitability: DollarSign }
const DRIVER_ACCENT: Record<string, string> = {
  alm: 'border-indigo-200 bg-indigo-50',
  coe: 'border-amber-200 bg-amber-50',
  profitability: 'border-blue-200 bg-blue-50',
}
const DRIVER_ICON_BG: Record<string, string> = {
  alm: 'bg-indigo-600', coe: 'bg-amber-500', profitability: 'bg-blue-600',
}

function fmtPKRbn(v: number) { return `PKR ${v}bn` }

function barColor(line: { type: string; source: string; value: number }) {
  if (line.type === 'subtotal') return '#64748b'
  if (line.type === 'final') return '#4f46e5'
  if (line.type === 'start') return '#3b82f6'
  if (line.source === 'ALM') return '#6366f1'
  if (line.source === 'COE') return '#f59e0b'
  return line.value >= 0 ? '#10b981' : '#f43f5e'
}

export default function CustomerProfitability() {
  const navigate = useNavigate()
  const t = data.totals

  // Build EVA waterfall (floating bars)
  const waterfall = useMemo(() => {
    let running = 0
    return data.plWaterfall.map(l => {
      if (l.type === 'subtotal' || l.type === 'final' || l.type === 'start') {
        running = l.value
        return { ...l, base: 0, bar: Math.abs(l.value) }
      }
      const base = l.value >= 0 ? running : running + l.value
      const bar = Math.abs(l.value)
      running += l.value
      return { ...l, base, bar }
    })
  }, [])

  // Pareto marginal contribution
  const pareto = useMemo(() => data.concentration.map((c, i) => ({
    pctCustomers: `${c.pctCustomers}%`,
    marginal: i === 0 ? c.cumProfitPct : c.cumProfitPct - data.concentration[i - 1].cumProfitPct,
    cumProfitPct: c.cumProfitPct,
  })), [])

  const kpis = [
    { label: 'Customers', value: `${(t.customers / 1e6).toFixed(2)}M`, icon: Users },
    { label: 'Economic Profit (EVA)', value: fmtPKRbn(t.evaPKRbn), icon: TrendingUp },
    { label: 'Average RAROC', value: `${t.avgRaroc}%`, icon: Percent },
    { label: 'FTP-Adjusted NIM', value: `${t.ftpAdjustedNimPct}%`, icon: Scale },
    { label: 'Profitable Customers', value: `${t.profitableCustomerPct}%`, icon: Wallet },
    { label: 'Cost-to-Income', value: `${t.costToIncomePct}%`, icon: DollarSign },
  ]

  return (
    <div className="space-y-6" id="page-customer-profitability">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-7 text-white flex-1">
          <h1 className="text-2xl font-bold mb-1">Customer Profitability Dashboard</h1>
          <p className="text-blue-100 text-sm mb-6 max-w-3xl">
            End-to-end economic profit at customer, segment and product grain — integrating FTP-adjusted NII from <span className="font-semibold text-white">ALM</span>, float recovery from <span className="font-semibold text-white">COE</span>, and the EVA framework from the <span className="font-semibold text-white">Profitability Engine</span>.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map(k => (
              <div key={k.label} className="bg-white/15 backdrop-blur rounded-xl p-3">
                <k.icon size={18} className="text-blue-200 mb-1.5" />
                <div className="text-lg font-bold leading-tight">{k.value}</div>
                <div className="text-blue-200 text-xs">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
        <ExportMenu options={[
          { label: 'Export as JSON', onClick: () => downloadJSON(data, 'baiw-customer-profitability') },
          { label: 'Export as PDF', onClick: () => downloadPDF('page-customer-profitability', 'baiw-customer-profitability', 'Customer Profitability Dashboard') },
        ]} />
      </div>

      {/* Integrated value drivers — ALM + COE + Profitability */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Integrated Value Drivers — one customer P&amp;L, three engines</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {data.drivers.map(d => {
            const Icon = DRIVER_ICON[d.key] || DollarSign
            return (
              <button
                key={d.key}
                onClick={() => navigate(d.path)}
                className={`text-left rounded-xl border p-5 transition-all hover:shadow-md group ${DRIVER_ACCENT[d.key]}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${DRIVER_ICON_BG[d.key]}`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{d.module}</div>
                    <div className="text-xs text-slate-500">{d.contribution}</div>
                  </div>
                  <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{d.description}</p>
                <div className="grid grid-cols-3 gap-2">
                  {d.metrics.map(m => (
                    <div key={m.label} className="bg-white/70 rounded-lg px-2 py-1.5">
                      <div className="text-xs font-bold text-slate-800 leading-tight">{m.value}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">{m.label}</div>
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* EVA Waterfall */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-slate-800">Economic Profit Bridge (EVA Waterfall)</h2>
          <div className="flex gap-3">
            {Object.values(SOURCE_META).map(s => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />{s.label}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">Gross interest income → EVA (PKR bn). FTP adjustment &amp; ECL from ALM, float recovery from COE.</p>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={waterfall} margin={{ left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={90} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number | undefined, n: string | undefined) => n === 'bar' ? [fmtPKRbn(v ?? 0), 'Amount'] : ['', '']} />
            <Bar dataKey="base" stackId="a" fill="transparent" />
            <Bar dataKey="bar" stackId="a" radius={[3, 3, 0, 0]}>
              {waterfall.map((d, i) => <Cell key={i} fill={barColor(d)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Concentration Pareto + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Customer Concentration (Pareto)</h2>
          <p className="text-sm text-slate-500 mb-4">Cumulative economic profit by customer decile. Top 20% generate 82% of EVA; the least-profitable third erodes it.</p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={pareto} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="pctCustomers" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: number | undefined) => `${v ?? 0}%`} />
              <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4" label={{ value: '100% of EVA', position: 'insideTopRight', fontSize: 10, fill: '#64748b' }} />
              <Bar dataKey="marginal" name="Marginal contribution" radius={[3, 3, 0, 0]}>
                {pareto.map((d, i) => <Cell key={i} fill={d.marginal >= 0 ? '#93c5fd' : '#fca5a5'} />)}
              </Bar>
              <Line type="monotone" dataKey="cumProfitPct" name="Cumulative EVA" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Profitability Distribution</h2>
          <p className="text-sm text-slate-500 mb-4">Share of customers vs share of EVA by profitability tier (%)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.distribution} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="band" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: number | undefined) => `${v ?? 0}%`} />
              <ReferenceLine y={0} stroke="#64748b" />
              <Legend />
              <Bar dataKey="customers" name="% of customers" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="evaShare" name="% of EVA" radius={[3, 3, 0, 0]}>
                {data.distribution.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segment profitability */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Segment Profitability</h2>
        <p className="text-sm text-slate-500 mb-4">Economic profit (bars, PKR bn) vs RAROC (line, %) by customer segment</p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data.segments} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="segment" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="l" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12 }} unit="%" />
            <Tooltip formatter={(v: number | undefined, n: string | undefined) => n === 'raroc' ? `${v ?? 0}%` : fmtPKRbn(v ?? 0)} />
            <ReferenceLine yAxisId="l" y={0} stroke="#64748b" />
            <Bar yAxisId="l" dataKey="eva" name="EVA" radius={[3, 3, 0, 0]}>
              {data.segments.map((s, i) => <Cell key={i} fill={s.eva >= 0 ? '#4f46e5' : '#f43f5e'} />)}
            </Bar>
            <Line yAxisId="r" type="monotone" dataKey="raroc" name="raroc" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Segment</th>
                <th className="py-2 pr-4">Customers</th>
                <th className="py-2 pr-4">Revenue</th>
                <th className="py-2 pr-4">ECL</th>
                <th className="py-2 pr-4">Capital</th>
                <th className="py-2 pr-4">EVA</th>
                <th className="py-2 pr-4">RAROC</th>
                <th className="py-2">Profitable %</th>
              </tr>
            </thead>
            <tbody>
              {data.segments.map(s => (
                <tr key={s.segment} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-700">{s.segment}</td>
                  <td className="py-2 pr-4 text-slate-600">{s.customers.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-slate-600">PKR {s.revenue}bn</td>
                  <td className="py-2 pr-4 text-rose-600">PKR {s.ecl}bn</td>
                  <td className="py-2 pr-4 text-slate-600">PKR {s.capitalCharge}bn</td>
                  <td className={`py-2 pr-4 font-semibold ${s.eva >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>PKR {s.eva}bn</td>
                  <td className="py-2 pr-4 text-slate-600">{s.raroc}%</td>
                  <td className="py-2 text-slate-600">{s.profitablePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product profitability */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Product Profitability &amp; FTP Margin</h2>
        <p className="text-sm text-slate-500 mb-4">Economic profit by product (PKR bn); label shows FTP-adjusted margin from the ALM engine</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.products} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="product" tick={{ fontSize: 11 }} width={160} />
            <Tooltip formatter={(v: number | undefined, n: string | undefined) => n === 'eva' ? fmtPKRbn(v ?? 0) : `${v ?? 0}%`} />
            <ReferenceLine x={0} stroke="#64748b" />
            <Bar dataKey="eva" name="eva" radius={[0, 3, 3, 0]}>
              {data.products.map((p, i) => <Cell key={i} fill={p.eva >= 0 ? '#3b82f6' : '#f43f5e'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top / Bottom customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <ArrowUpRight size={18} className="text-emerald-500" /> Top Value Creators
          </h2>
          <p className="text-xs text-slate-400 mb-4">Anonymized sector pseudonyms — illustrative</p>
          <table className="w-full text-sm min-w-[380px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Customer</th><th className="py-2 pr-3">Segment</th><th className="py-2 pr-3">EVA</th><th className="py-2">RAROC</th>
              </tr>
            </thead>
            <tbody>
              {data.topCustomers.map(c => (
                <tr key={c.name} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-700">{c.name}</td>
                  <td className="py-2 pr-3 text-slate-500">{c.segment}</td>
                  <td className="py-2 pr-3 text-emerald-600 font-semibold">PKR {c.eva}M</td>
                  <td className="py-2 text-slate-600">{c.raroc}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <ArrowDownRight size={18} className="text-rose-500" /> Value Destroyers
          </h2>
          <p className="text-xs text-slate-400 mb-4">Candidates for repricing, restructuring or exit</p>
          <table className="w-full text-sm min-w-[380px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Customer</th><th className="py-2 pr-3">Segment</th><th className="py-2 pr-3">EVA</th><th className="py-2">RAROC</th>
              </tr>
            </thead>
            <tbody>
              {data.bottomCustomers.map(c => (
                <tr key={c.name} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-700">{c.name}</td>
                  <td className="py-2 pr-3 text-slate-500">{c.segment}</td>
                  <td className="py-2 pr-3 text-rose-600 font-semibold">PKR {c.eva}M</td>
                  <td className="py-2 text-slate-600">{c.raroc}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
