import { Link } from 'react-router-dom'
import {
  Layers, Activity, Droplets, Scale, Database, BarChart3,
  Landmark, TrendingUp, TrendingDown, ArrowRight, Gauge,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine, Legend,
} from 'recharts'
import useCases from '../data/useCases.json'
import balanceSheet from '../data/balanceSheet.json'
import repricingGap from '../data/repricingGap.json'
import niiEve from '../data/niiEve.json'
import liquidity from '../data/liquidityLadder.json'

const ASSET_PIE = ['#6366f1', '#4f46e5', '#818cf8', '#3b82f6', '#0ea5e9', '#06b6d4', '#8b5cf6']

function sum<T>(arr: T[], f: (t: T) => number) { return arr.reduce((a, t) => a + f(t), 0) }

export default function AlmDashboard() {
  const totalAssets = sum(balanceSheet.assets, a => a.amount)
  const deposits = sum(
    balanceSheet.liabilities.filter(l => /deposit|casa|savings/i.test(l.class)),
    l => l.amount,
  )

  // Rate-type mix: assets vs liabilities grouped by rate type
  const rateTypes = ['Fixed', 'Floating', 'Non-maturing', 'Non-sensitive']
  const rateMix = rateTypes.map(rt => ({
    rateType: rt,
    Assets: sum(balanceSheet.assets.filter(a => a.rateType === rt), a => a.amount),
    Liabilities: sum(balanceSheet.liabilities.filter(l => l.rateType === rt), l => l.amount),
  })).filter(r => r.Assets > 0 || r.Liabilities > 0)

  const assetPie = balanceSheet.assets.map(a => ({ name: a.class, value: a.amount }))

  const gapData = repricingGap.buckets.map(b => ({ bucket: b.bucket, gap: b.gap, cumulative: b.cumulativeGap }))

  const kpis = [
    { label: 'Total Assets', value: `PKR ${(totalAssets / 1000).toFixed(2)}T`, icon: Landmark },
    { label: 'Deposits', value: `PKR ${(deposits / 1000).toFixed(2)}T`, icon: Layers },
    { label: 'Net Repricing Gap', value: `PKR ${repricingGap.totals.netGap}bn`, icon: Activity },
    { label: '1Y Cumulative Gap', value: `PKR ${repricingGap.oneYearCumulativeGap}bn`, icon: repricingGap.oneYearCumulativeGap < 0 ? TrendingDown : TrendingUp },
    { label: 'LCR', value: `${liquidity.lcr.ratio}%`, icon: Droplets },
    { label: 'NSFR', value: `${liquidity.nsfr.ratio}%`, icon: Gauge },
  ]

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Asset-Liability Management &amp; FTP Engine</h1>
        <p className="text-indigo-100 text-lg mb-8">
          Position-level ALM, IRRBB, Funds Transfer Pricing &amp; liquidity — Sierra + Symbols/CBS mapped into the FIS ALM engine and Teradata FSDM.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-white/15 backdrop-blur rounded-xl p-4">
              <k.icon size={20} className="text-indigo-200 mb-2" />
              <div className="text-xl font-bold">{k.value}</div>
              <div className="text-indigo-200 text-xs">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Balance sheet rate-mix + instrument pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Balance Sheet by Rate Type</h2>
          <p className="text-sm text-slate-500 mb-4">Assets vs liabilities (PKR bn), the core ALM mismatch view</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rateMix} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="rateType" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number | undefined) => `PKR ${v ?? 0}bn`} />
              <Legend />
              <Bar dataKey="Assets" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Liabilities" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Asset Composition</h2>
          <p className="text-sm text-slate-500 mb-4">Banking-book asset mix by instrument class</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={assetPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {assetPie.map((_, i) => <Cell key={i} fill={ASSET_PIE[i % ASSET_PIE.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number | undefined) => `PKR ${v ?? 0}bn`} />
              <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Repricing gap preview + IRRBB summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-slate-800">Repricing Gap Ladder</h2>
            <Link to="/alm/irrbb" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              IRRBB detail <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-sm text-slate-500 mb-4">Period gap by bucket (PKR bn). {repricingGap.profile}</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={gapData} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number | undefined) => `PKR ${v ?? 0}bn`} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="gap" radius={[3, 3, 0, 0]} name="Period gap">
                {gapData.map((d, i) => <Cell key={i} fill={d.gap >= 0 ? '#6366f1' : '#f43f5e'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">IRRBB Snapshot</h2>
          <div className="space-y-3">
            {niiEve.keyMeasures.map(m => (
              <div key={m.measure} className="flex items-start justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="text-sm text-slate-600">{m.measure}</div>
                  <div className="text-xs text-slate-400">Worst: {m.worst}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-700">{m.base}</div>
                  <span className={`text-xs ${m.status.includes('Above') ? 'text-rose-600' : m.status.includes('Within') ? 'text-emerald-600' : 'text-amber-600'}`}>{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav + source systems */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Explore the Engine</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: 'ALCO Workbench', path: '/alm/workbench', icon: BarChart3, count: 'Business → Data → Tech blueprint' },
              { label: 'Use Case Explorer', path: '/alm/usecases', icon: Layers, count: `${useCases.length} ALM/FTP use cases` },
              { label: 'IRRBB & Repricing', path: '/alm/irrbb', icon: Activity, count: 'Gap ladder · EVE/NII' },
              { label: 'Liquidity (LCR/NSFR)', path: '/alm/liquidity', icon: Droplets, count: 'Maturity ladder · Basel ratios' },
              { label: 'FTP Engine', path: '/alm/ftp', icon: Scale, count: 'Curve · spread decomposition' },
              { label: 'Instrument Feed', path: '/alm/data-coverage', icon: Database, count: 'Source → PDM → FSDM' },
            ].map(item => (
              <Link key={item.path} to={item.path} className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <item.icon size={16} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.count}</div>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Source → Engine</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-slate-400 mb-1">Treasury front-office</div>
              <div className="font-medium text-slate-700">Sierra</div>
              <div className="text-xs text-slate-500">PIB · T-Bill · FX Forwards (SYTRANS, IXINST)</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Core banking</div>
              <div className="font-medium text-slate-700">Symbols / CBS</div>
              <div className="text-xs text-slate-500">CASA · TDA · Loans (RB_ACCT, tm_ft_cl_loanbook)</div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-400 mb-1">Target</div>
              <div className="font-medium text-indigo-700">FIS ALM PDM → FSDM</div>
              <div className="text-xs text-slate-500">{balanceSheet.note.split('.')[0]}.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
