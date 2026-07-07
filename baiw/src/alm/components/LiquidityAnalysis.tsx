import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart,
} from 'recharts'
import { Droplets, Gauge } from 'lucide-react'
import liquidity from '../data/liquidityLadder.json'

function RatioGauge({ title, ratio, min, subtitle }: { title: string; ratio: number; min: number; subtitle: string }) {
  const pct = Math.min(100, (ratio / (min * 2)) * 100)
  const healthy = ratio >= min
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${healthy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {healthy ? 'Compliant' : 'Below min'}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-4xl font-bold ${healthy ? 'text-indigo-600' : 'text-rose-600'}`}>{ratio}%</span>
        <span className="text-sm text-slate-400">min {min}%</span>
      </div>
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
        <div className="absolute top-0 h-3 w-0.5 bg-slate-500" style={{ left: '50%' }} title={`Minimum ${min}%`} />
      </div>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  )
}

export default function LiquidityAnalysis() {
  const ladder = liquidity.buckets.map(b => ({
    bucket: b.bucket,
    Inflows: b.inflows,
    Outflows: -b.outflows,
    Cumulative: b.cumulativeGap,
  }))
  const stability = liquidity.depositStability.map(d => ({ type: d.type, Core: d.core, Volatile: d.volatile }))

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Droplets size={24} />
          <h1 className="text-2xl font-bold">Structural Liquidity, LCR &amp; NSFR</h1>
        </div>
        <p className="text-cyan-100">Cashflow maturity ladder with behavioral overlays, and Basel III liquidity ratios from the same position feed.</p>
      </div>

      {/* Ratio gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RatioGauge title="Liquidity Coverage Ratio (LCR)" ratio={liquidity.lcr.ratio} min={liquidity.lcr.regulatoryMinimum} subtitle={`HQLA PKR ${liquidity.lcr.hqla}bn / net 30d outflows PKR ${liquidity.lcr.netOutflows30d}bn`} />
        <RatioGauge title="Net Stable Funding Ratio (NSFR)" ratio={liquidity.nsfr.ratio} min={liquidity.nsfr.regulatoryMinimum} subtitle={`ASF PKR ${liquidity.nsfr.availableStableFunding}bn / RSF PKR ${liquidity.nsfr.requiredStableFunding}bn`} />
      </div>

      {/* Maturity ladder */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Cashflow Maturity Ladder</h2>
        <p className="text-sm text-slate-500 mb-4">Inflows (up) vs outflows (down) with cumulative funding gap — PKR bn</p>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={ladder} margin={{ left: 10 }} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number | undefined, n: string | undefined) => [`PKR ${Math.abs(v ?? 0)}bn`, n]} />
            <Legend />
            <ReferenceLine y={0} stroke="#64748b" />
            <Bar dataKey="Inflows" stackId="a" fill="#06b6d4" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Outflows" stackId="a" fill="#f59e0b" radius={[0, 0, 3, 3]} />
            <Line type="monotone" dataKey="Cumulative" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* LCR/NSFR components + deposit stability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Gauge size={18} className="text-cyan-500" /> LCR Components
          </h2>
          <div className="space-y-3">
            {liquidity.lcr.components.map(c => {
              const max = Math.max(...liquidity.lcr.components.map(x => x.value))
              return (
                <div key={c.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{c.label}</span>
                    <span className="font-medium text-slate-700">PKR {c.value}bn</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style={{ width: `${(c.value / max) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Deposit Stability (Behavioral)</h2>
          <p className="text-sm text-slate-500 mb-4">Core vs volatile split from NMD behavioral model (%)</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={stability} layout="vertical" margin={{ left: 20 }} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(v: number | undefined) => `${v ?? 0}%`} />
              <Legend />
              <Bar dataKey="Core" stackId="a" fill="#14b8a6" radius={[4, 0, 0, 4]} />
              <Bar dataKey="Volatile" stackId="a" fill="#fca5a5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
