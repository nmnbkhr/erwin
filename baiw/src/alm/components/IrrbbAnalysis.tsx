import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart, Cell,
} from 'recharts'
import { Activity, TrendingDown, AlertTriangle } from 'lucide-react'
import repricingGap from '../data/repricingGap.json'
import niiEve from '../data/niiEve.json'

export default function IrrbbAnalysis() {
  const ladder = repricingGap.buckets.map(b => ({
    bucket: b.bucket,
    RSA: b.rsa,
    RSL: -b.rsl,
    Cumulative: b.cumulativeGap,
  }))

  const nii = niiEve.scenarios.map(s => ({
    shock: `${s.shockBps > 0 ? '+' : ''}${s.shockBps}`,
    deltaNII: s.deltaNII,
    deltaEVE: s.deltaEVE,
    evePct: s.evePctTier1,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={24} />
          <h1 className="text-2xl font-bold">Interest Rate Risk in the Banking Book</h1>
        </div>
        <p className="text-indigo-100">Repricing gap ladder and EVE / NII sensitivity under SBP &amp; Basel rate shocks. {repricingGap.profile}</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Rate-Sensitive Assets', value: `PKR ${repricingGap.totals.rsa}bn` },
          { label: 'Rate-Sensitive Liabilities', value: `PKR ${repricingGap.totals.rsl}bn` },
          { label: 'Net Gap', value: `PKR ${repricingGap.totals.netGap}bn` },
          { label: '1Y Cumulative Gap', value: `PKR ${repricingGap.oneYearCumulativeGap}bn` },
        ].map(t => (
          <div key={t.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-400 mb-1">{t.label}</div>
            <div className="text-xl font-bold text-slate-800">{t.value}</div>
          </div>
        ))}
      </div>

      {/* Repricing ladder */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Repricing Gap Ladder</h2>
        <p className="text-sm text-slate-500 mb-4">Rate-sensitive assets (up) vs liabilities (down) with cumulative gap line — PKR bn</p>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={ladder} margin={{ left: 10 }} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number | undefined, n: string | undefined) => [`PKR ${Math.abs(v ?? 0)}bn`, n]} />
            <Legend />
            <ReferenceLine y={0} stroke="#64748b" />
            <Bar dataKey="RSA" stackId="a" fill="#6366f1" radius={[3, 3, 0, 0]} />
            <Bar dataKey="RSL" stackId="a" fill="#f59e0b" radius={[0, 0, 3, 3]} />
            <Line type="monotone" dataKey="Cumulative" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* NII + EVE sensitivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <TrendingDown size={18} className="text-rose-500" /> 12-Month NII Sensitivity
          </h2>
          <p className="text-sm text-slate-500 mb-4">Earnings-at-risk by parallel shock (PKR bn)</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={nii} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="shock" tick={{ fontSize: 12 }} unit="bps" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number | undefined) => `PKR ${v ?? 0}bn`} />
              <ReferenceLine y={0} stroke="#64748b" />
              <Bar dataKey="deltaNII" name="ΔNII" radius={[3, 3, 0, 0]}>
                {nii.map((d, i) => <Cell key={i} fill={d.deltaNII >= 0 ? '#10b981' : '#f43f5e'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> ΔEVE Sensitivity
          </h2>
          <p className="text-sm text-slate-500 mb-4">Economic value of equity change (PKR bn); limit ±{niiEve.eveLimitPctTier1}% of Tier 1</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={nii} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="shock" tick={{ fontSize: 12 }} unit="bps" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number | undefined, n: string | undefined) => n === 'deltaEVE' ? `PKR ${v ?? 0}bn` : `${v ?? 0}%`} />
              <ReferenceLine y={0} stroke="#64748b" />
              <Bar dataKey="deltaEVE" name="ΔEVE" radius={[3, 3, 0, 0]}>
                {nii.map((d, i) => <Cell key={i} fill={Math.abs(d.evePct) > niiEve.eveLimitPctTier1 ? '#dc2626' : d.deltaEVE >= 0 ? '#10b981' : '#fb923c'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sensitivity table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Rate-Shock Scenario Table</h2>
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-4">Shock</th>
              <th className="py-2 pr-4">ΔNII (12M)</th>
              <th className="py-2 pr-4">ΔEVE</th>
              <th className="py-2 pr-4">EVE % Tier 1</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {niiEve.scenarios.map(s => {
              const breach = Math.abs(s.evePctTier1) > niiEve.eveLimitPctTier1
              return (
                <tr key={s.shockBps} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-700">{s.shockBps > 0 ? '+' : ''}{s.shockBps} bps</td>
                  <td className={`py-2 pr-4 ${s.deltaNII < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>PKR {s.deltaNII}bn</td>
                  <td className={`py-2 pr-4 ${s.deltaEVE < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>PKR {s.deltaEVE}bn</td>
                  <td className="py-2 pr-4 text-slate-600">{s.evePctTier1}%</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${breach ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {breach ? 'Limit breach' : 'Within limit'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
