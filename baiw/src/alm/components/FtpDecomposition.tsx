import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Legend,
} from 'recharts'
import { Scale, TrendingUp } from 'lucide-react'
import ftp from '../data/ftpDecomposition.json'

const OWNER_COLORS: Record<string, string> = {
  Treasury: '#6366f1',
  Business: '#10b981',
  Customer: '#334155',
}

export default function FtpDecomposition() {
  // Build waterfall (spacer + visible bar)
  let running = 0
  const waterfall = ftp.waterfall.steps.map(s => {
    if (s.type === 'total') {
      return { label: s.label, spacer: 0, bar: s.value, value: s.value, owner: s.owner }
    }
    const row = { label: s.label, spacer: running, bar: s.value, value: s.value, owner: s.owner }
    running += s.value
    return row
  })

  const assets = ftp.products.filter(p => p.side === 'Asset')
  const liabilities = ftp.products.filter(p => p.side === 'Liability')
  const marginData = ftp.products.map(p => ({ product: p.product, netMargin: p.netMargin, side: p.side }))

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Scale size={24} />
          <h1 className="text-2xl font-bold">Funds Transfer Pricing Engine</h1>
        </div>
        <p className="text-violet-100">Matched-maturity FTP off the KIBOR/PKRV curve. Policy rate {ftp.policyRate}% · 6M KIBOR {ftp.kibor6m}%. Margin splits into Treasury (rate/funding) vs Business (credit) ownership.</p>
      </div>

      {/* Curve + Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">FTP Transfer Curve</h2>
          <p className="text-sm text-slate-500 mb-4">KIBOR/PKRV-derived transfer rate by tenor (%)</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ftp.curve} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="tenor" tick={{ fontSize: 12 }} />
              <YAxis domain={['dataMin - 0.3', 'dataMax + 0.3']} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: number | undefined) => `${v ?? 0}%`} />
              <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Rate Decomposition Waterfall</h2>
          <p className="text-sm text-slate-500 mb-4">{ftp.waterfall.product} — how the customer rate is built (%)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterfall} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: number | undefined, n: string | undefined) => n === 'bar' ? `${v ?? 0}%` : ''} />
              <Bar dataKey="spacer" stackId="a" fill="transparent" />
              <Bar dataKey="bar" stackId="a" radius={[3, 3, 0, 0]}>
                {waterfall.map((d, i) => <Cell key={i} fill={OWNER_COLORS[d.owner] || '#94a3b8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs">
            {Object.entries(OWNER_COLORS).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: v }} />{k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Net margin by product */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-500" /> FTP-Adjusted Net Margin by Product
        </h2>
        <p className="text-sm text-slate-500 mb-4">Customer rate vs matched FTP rate (percentage points)</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={marginData} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
            <YAxis type="category" dataKey="product" tick={{ fontSize: 11 }} width={150} />
            <Tooltip formatter={(v: number | undefined) => `${v ?? 0}%`} />
            <ReferenceLine x={0} stroke="#64748b" />
            <Bar dataKey="netMargin" name="Net margin" radius={[0, 3, 3, 0]}>
              {marginData.map((d, i) => <Cell key={i} fill={d.side === 'Asset' ? '#6366f1' : '#f59e0b'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded-sm bg-indigo-500" />Assets (charged FTP)</span>
          <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded-sm bg-amber-500" />Liabilities (credited FTP)</span>
        </div>
      </div>

      {/* Product table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[{ title: 'Assets', rows: assets, accent: 'text-indigo-600' }, { title: 'Liabilities', rows: liabilities, accent: 'text-amber-600' }].map(group => (
          <div key={group.title} className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
            <h2 className={`text-lg font-semibold mb-4 ${group.accent}`}>{group.title}</h2>
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Tenor</th>
                  <th className="py-2 pr-3">Cust.</th>
                  <th className="py-2 pr-3">FTP</th>
                  <th className="py-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map(p => (
                  <tr key={p.product} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-700">{p.product}</td>
                    <td className="py-2 pr-3 text-slate-500">{p.tenor}</td>
                    <td className="py-2 pr-3 text-slate-600">{p.customerRate}%</td>
                    <td className="py-2 pr-3 text-slate-600">{p.ftpRate}%</td>
                    <td className={`py-2 font-semibold ${p.netMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{p.netMargin > 0 ? '+' : ''}{p.netMargin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
