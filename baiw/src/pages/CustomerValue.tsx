import { useMemo, useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  Gem, Landmark, Scale, Coins, ShieldAlert, Percent, TrendingUp, ArrowRight, User,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import consumers from '../data/consumers.json'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON, downloadPDF } from '../utils/export'
import CustomerStrategy from '../components/CustomerStrategy'

const CAT_COLOR: Record<string, string> = {
  Deposit: '#14b8a6',
  Lending: '#6366f1',
  'Trade Finance': '#f59e0b',
}

function fmt(v: number) { return `PKR ${Math.round(v).toLocaleString()}` }
function fmtC(v: number) {
  const a = Math.abs(v)
  if (a >= 1e6) return `PKR ${(v / 1e6).toFixed(2)}M`
  if (a >= 1e3) return `PKR ${(v / 1e3).toFixed(0)}k`
  return `PKR ${v}`
}
function kAxis(v: number) { return `${Math.round(v / 1000)}k` }

export default function CustomerValue() {
  const [sel, setSel] = useState(0)
  const data = consumers[sel] ?? consumers[0]
  const s = data.summary
  const a = data.assumptions
  const capFactor = (a.carPct / 100) * (a.coePct / 100) // RWA → capital charge

  // Per-product enrichment
  const products = useMemo(() => data.products.map(p => {
    const capCharge = p.rwa * capFactor
    const contribution = p.nii + p.fee - p.ecl - capCharge
    const spread = p.side === 'Liability' ? p.poolRate - p.customerRate : p.customerRate - p.poolRate
    return { ...p, capCharge, contribution, spread }
  }), [data, capFactor])

  const rateProducts = products.filter(p => p.side !== 'Off-B/S')
  const niiByProduct = products.filter(p => p.nii !== 0).map(p => ({ name: p.name, nii: p.nii, category: p.category }))
  const eclByProduct = products.filter(p => p.ecl > 0).map(p => ({ name: p.name, ecl: p.ecl }))
  const rwaComp = products.filter(p => p.rwa > 0).map(p => ({ name: p.name, value: p.rwa }))
  const costPie = data.costs.map(c => ({ name: c.activity, value: c.amount }))

  // Waterfall
  const waterfall = useMemo(() => {
    let running = 0
    return data.waterfall.map(l => {
      if (l.type === 'start' || l.type === 'subtotal' || l.type === 'final') {
        running = l.value
        return { ...l, base: 0, bar: Math.abs(l.value) }
      }
      const base = l.value >= 0 ? running : running + l.value
      running += l.value
      return { ...l, base, bar: Math.abs(l.value) }
    })
  }, [data])

  const wfColor = (l: { type: string; value: number }) =>
    l.type === 'final' ? '#4f46e5' : l.type === 'subtotal' ? '#64748b' : l.type === 'start' ? '#3b82f6' : l.value >= 0 ? '#10b981' : '#f43f5e'

  const kpis = [
    { label: 'Relationship Value', value: fmtC(s.footings), icon: Landmark, sub: `${data.products.length} products` },
    { label: 'FTP-Adjusted NII', value: fmtC(s.ftpAdjustedNII), icon: Scale, sub: 'matched-maturity' },
    { label: 'Total Revenue', value: fmtC(s.totalRevenue), icon: Coins, sub: 'NII + fees' },
    { label: 'Economic Profit (EVA)', value: fmtC(s.eva), icon: TrendingUp, sub: `${s.returnOnRevenuePct}% of revenue` },
    { label: 'RAROC', value: `${s.raroc}%`, icon: Percent, sub: `hurdle ${a.hurdleRaroc}%` },
    { label: 'Lifetime Value (CLV)', value: fmtC(s.clv), icon: Gem, sub: `${a.clvHorizonYears}-yr, disc ${a.clvDiscountPct}%` },
  ]

  const rarocPct = Math.min(100, (s.raroc / (a.hurdleRaroc * 3)) * 100)
  const hurdleMark = (a.hurdleRaroc / (a.hurdleRaroc * 3)) * 100

  return (
    <div className="space-y-6" id="page-customer-value">
      {/* Instance selector */}
      <div className="flex flex-wrap gap-2">
        {consumers.map((c, i) => {
          const active = i === sel
          return (
            <button
              key={c.customer.id}
              onClick={() => setSel(i)}
              className={`flex-1 min-w-[200px] text-left rounded-xl border p-3 transition-all ${active ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.archetype}</span>
                <span className={`text-xs font-bold ${c.summary.eva >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtC(c.summary.eva)}</span>
              </div>
              <div className="text-sm font-semibold text-slate-800 truncate">{c.customer.name.replace(' (illustrative)', '')}</div>
              <div className="text-xs text-slate-400">RAROC {c.summary.raroc}% · {c.strategy.stance}</div>
            </button>
          )
        })}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 rounded-2xl p-7 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center"><User size={22} /></div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">{data.customer.name}</h1>
              <p className="text-blue-100 text-sm">{data.customer.segment} · CIF {data.customer.id} · {data.customer.relationshipYears}-yr relationship · Risk {data.customer.riskRating}</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm mb-6 max-w-3xl">{data.customer.profile}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map(k => (
              <div key={k.label} className="bg-white/15 backdrop-blur rounded-xl p-3">
                <k.icon size={18} className="text-blue-200 mb-1.5" />
                <div className="text-lg font-bold leading-tight">{k.value}</div>
                <div className="text-blue-200 text-xs">{k.label}</div>
                <div className="text-blue-300/80 text-[10px]">{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
        <ExportMenu options={[
          { label: 'Export as JSON', onClick: () => downloadJSON(data, 'baiw-customer-value') },
          { label: 'Export as PDF', onClick: () => downloadPDF('page-customer-value', 'baiw-customer-value', `Customer Value — ${data.customer.name}`) },
        ]} />
      </div>

      {/* Methodology strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { step: '1', label: 'NII via pool rates', desc: 'Customer rate vs matched FTP curve' },
          { step: '2', label: 'Indirect revenue', desc: 'Fees, trade commission, FX' },
          { step: '3', label: 'ABC costing', desc: 'Activity-based cost to serve' },
          { step: '4', label: 'Risk adjustment', desc: 'IFRS 9 ECL by product' },
          { step: '5', label: 'Capital charge', desc: 'RWA × CoE → EVA & RAROC' },
        ].map(m => (
          <div key={m.step} className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mb-2">{m.step}</div>
            <div className="text-sm font-semibold text-slate-700 leading-tight">{m.label}</div>
            <div className="text-xs text-slate-400">{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Product build-up table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Product-Level Profitability Build-Up</h2>
        <p className="text-sm text-slate-500 mb-4">Every holding priced against its matched pool rate, with fees, ECL and capital charge → product contribution</p>
        <table className="w-full text-sm min-w-[920px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3 text-right">Balance</th>
              <th className="py-2 pr-3 text-right">Cust. Rate</th>
              <th className="py-2 pr-3 text-right">Pool Rate</th>
              <th className="py-2 pr-3 text-right">Spread</th>
              <th className="py-2 pr-3 text-right">NII</th>
              <th className="py-2 pr-3 text-right">Fees</th>
              <th className="py-2 pr-3 text-right">ECL</th>
              <th className="py-2 pr-3 text-right">Cap. Chg</th>
              <th className="py-2 text-right">Contribution</th>
            </tr>
          </thead>
          <tbody>
            {['Deposit', 'Lending', 'Trade Finance'].map(cat => (
              <Fragment key={cat}>
                <tr className="bg-slate-50">
                  <td colSpan={10} className="py-1.5 px-2 text-xs font-semibold uppercase tracking-wider" style={{ color: CAT_COLOR[cat] }}>{cat}</td>
                </tr>
                {products.filter(p => p.category === cat).map(p => (
                  <tr key={p.name} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-700">{p.name}<span className="ml-1 text-xs text-slate-400">{p.side}</span></td>
                    <td className="py-2 pr-3 text-right text-slate-600">{fmtC(p.balance)}</td>
                    <td className="py-2 pr-3 text-right text-slate-600">{p.side === 'Off-B/S' ? '—' : `${p.customerRate}%`}</td>
                    <td className="py-2 pr-3 text-right text-slate-600">{p.side === 'Off-B/S' ? '—' : `${p.poolRate}%`}</td>
                    <td className="py-2 pr-3 text-right text-slate-500">{p.side === 'Off-B/S' ? '—' : `${p.spread.toFixed(1)}%`}</td>
                    <td className="py-2 pr-3 text-right text-slate-600">{p.nii ? fmt(p.nii) : '—'}</td>
                    <td className="py-2 pr-3 text-right text-slate-600">{p.fee ? fmt(p.fee) : '—'}</td>
                    <td className="py-2 pr-3 text-right text-rose-600">{p.ecl ? fmt(p.ecl) : '—'}</td>
                    <td className="py-2 pr-3 text-right text-slate-500">{p.capCharge ? fmt(p.capCharge) : '—'}</td>
                    <td className={`py-2 text-right font-semibold ${p.contribution >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(p.contribution)}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-semibold text-slate-800">
              <td className="py-2 pr-3">Total (pre operating cost)</td>
              <td className="py-2 pr-3 text-right">{fmtC(s.footings)}</td>
              <td colSpan={2}></td>
              <td></td>
              <td className="py-2 pr-3 text-right">{fmt(s.ftpAdjustedNII)}</td>
              <td className="py-2 pr-3 text-right">{fmt(s.indirectRevenue)}</td>
              <td className="py-2 pr-3 text-right text-rose-600">{fmt(s.totalEcl)}</td>
              <td className="py-2 pr-3 text-right">{fmt(products.reduce((x, p) => x + p.capCharge, 0))}</td>
              <td className="py-2 text-right">{fmt(products.reduce((x, p) => x + p.contribution, 0))}</td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs text-slate-400 mt-2">Operating cost (ABC) PKR {data.summary.operatingCost.toLocaleString()} and operational-risk capital are charged at the customer level (below), giving EVA of {fmt(s.eva)}.</p>
      </div>

      {/* Rate vs pool + NII contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Customer Rate vs Pool (FTP) Rate</h2>
          <p className="text-sm text-slate-500 mb-4">The gap is the risk-neutral spread the relationship earns (%)</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rateProducts} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
              <Tooltip formatter={(v: number | undefined) => `${v ?? 0}%`} />
              <Legend />
              <Bar dataKey="customerRate" name="Customer rate" fill="#6366f1" radius={[0, 3, 3, 0]} />
              <Bar dataKey="poolRate" name="Pool / FTP rate" fill="#cbd5e1" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">NII Contribution by Product</h2>
          <p className="text-sm text-slate-500 mb-4">FTP-adjusted net interest income (PKR)</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={niiByProduct} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={kAxis} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
              <Tooltip formatter={(v: number | undefined) => fmt(v ?? 0)} />
              <Bar dataKey="nii" radius={[0, 3, 3, 0]}>
                {niiByProduct.map((d, i) => <Cell key={i} fill={CAT_COLOR[d.category]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs">
            {Object.entries(CAT_COLOR).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: v }} />{k}</span>
            ))}
          </div>
        </div>
      </div>

      {/* EVA waterfall + pool curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Customer EVA Waterfall</h2>
          <p className="text-sm text-slate-500 mb-4">From FTP-adjusted NII to economic profit (PKR)</p>
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={waterfall} margin={{ left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={kAxis} />
              <Tooltip formatter={(v: number | undefined, n: string | undefined) => n === 'bar' ? [fmt(v ?? 0), 'Amount'] : ['', '']} />
              <Bar dataKey="base" stackId="a" fill="transparent" />
              <Bar dataKey="bar" stackId="a" radius={[3, 3, 0, 0]}>
                {waterfall.map((d, i) => <Cell key={i} fill={wfColor(d)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Pool (FTP) Curve</h2>
          <p className="text-sm text-slate-500 mb-4">KIBOR/PKRV transfer rate by tenor (%)</p>
          <ResponsiveContainer width="100%" height={330}>
            <LineChart data={data.poolCurve} margin={{ left: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="tenor" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 0.3', 'dataMax + 0.3']} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: number | undefined) => `${v ?? 0}%`} />
              <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost + Risk + Capital */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2"><Coins size={18} className="text-slate-500" /> Cost to Serve (ABC)</h2>
          <p className="text-sm text-slate-500 mb-4">PKR {s.operatingCost.toLocaleString()} total</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={costPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {costPie.map((_, i) => <Cell key={i} fill={['#6366f1', '#818cf8', '#3b82f6', '#0ea5e9', '#06b6d4', '#a5b4fc'][i % 6]} />)}
              </Pie>
              <Tooltip formatter={(v: number | undefined) => fmt(v ?? 0)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {data.costs.map(c => (
              <div key={c.activity} className="flex justify-between text-xs">
                <span className="text-slate-500">{c.activity}</span>
                <span className="text-slate-700 font-medium">{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2"><ShieldAlert size={18} className="text-rose-500" /> Risk — IFRS 9 ECL</h2>
          <p className="text-sm text-slate-500 mb-4">Expected credit loss by exposure (PKR {s.totalEcl.toLocaleString()})</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={eclByProduct} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={kAxis} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120} />
              <Tooltip formatter={(v: number | undefined) => fmt(v ?? 0)} />
              <Bar dataKey="ecl" fill="#f43f5e" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2"><Scale size={18} className="text-indigo-500" /> Capital — RWA Mix</h2>
          <p className="text-sm text-slate-500 mb-4">Credit RWA PKR {(s.creditMarketRwa / 1e6).toFixed(1)}M · EC PKR {(s.economicCapital / 1e6).toFixed(2)}M</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={rwaComp} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {rwaComp.map((_, i) => <Cell key={i} fill={['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#3b82f6', '#60a5fa'][i % 7]} />)}
              </Pie>
              <Tooltip formatter={(v: number | undefined) => fmtC(v ?? 0)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Capital charge (EC × CoE {a.coePct}%)</span><span className="font-medium text-slate-700">{fmt(s.capitalCharge)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Op-risk RWA</span><span className="font-medium text-slate-700">{fmtC(s.opRiskRwa)}</span></div>
          </div>
        </div>
      </div>

      {/* Value verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <Gem size={22} className="mb-2 text-emerald-100" />
          <div className="text-sm text-emerald-100">Annual Economic Profit (EVA)</div>
          <div className="text-3xl font-bold">{fmtC(s.eva)}</div>
          <div className="text-sm text-emerald-100 mt-1">{s.returnOnRevenuePct}% of revenue · {fmtC(s.clv)} lifetime value</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-600">RAROC vs Hurdle</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{s.raroc >= a.hurdleRaroc ? 'Above hurdle' : 'Below hurdle'}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold text-indigo-600">{s.raroc}%</span>
            <span className="text-sm text-slate-400">hurdle {a.hurdleRaroc}%</span>
          </div>
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full" style={{ width: `${rarocPct}%` }} />
            <div className="absolute top-0 h-3 w-0.5 bg-slate-600" style={{ left: `${hurdleMark}%` }} title={`Hurdle ${a.hurdleRaroc}%`} />
          </div>
          <p className="text-xs text-slate-400 mt-2">Risk-adjusted profit {fmtC(s.riskAdjustedProfit)} / economic capital {fmtC(s.economicCapital)}. The free current account and full lending suite make this a top-tier relationship.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Drill into the engines</h3>
          <div className="space-y-2 flex-1">
            {[
              { label: 'ALM · FTP pool rates', path: '/alm/ftp' },
              { label: 'Portfolio profitability', path: '/customer-profitability' },
              { label: 'EVA / P&L framework', path: '/profitability' },
            ].map(l => (
              <Link key={l.path} to={l.path} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-indigo-50 transition-colors group text-sm text-slate-700">
                {l.label}
                <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bank strategy */}
      <CustomerStrategy strategy={data.strategy} accentFrom="from-emerald-600" accentTo="to-teal-700" />
    </div>
  )
}
