import { useMemo } from 'react'
import { Layers, Users, TrendingUp, Percent, Scale, PieChart as PieIcon } from 'lucide-react'
import {
  ComposedChart, Bar, Line, BarChart, PieChart, Pie, ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts'
import consumers from '../data/consumers.json'
import corporates from '../data/corporates.json'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON, downloadPDF } from '../utils/export'

const HURDLE = 18
const ARCH_COLOR: Record<string, string> = {
  'Star': '#10b981', 'High-Potential': '#3b82f6', 'Value-Destroyer': '#f43f5e',
  'Anchor': '#6366f1', 'Ancillary Champion': '#14b8a6', 'Capital Guzzler': '#f59e0b',
}
// Illustrative representative segment populations (each instance = an archetype of a segment)
const POP: Record<string, number> = {
  'Star': 60000, 'High-Potential': 220000, 'Value-Destroyer': 35000,
  'Anchor': 140, 'Ancillary Champion': 260, 'Capital Guzzler': 85,
}

function fmtB(v: number) {
  const a = Math.abs(v)
  if (a >= 1e9) return `PKR ${(v / 1e9).toFixed(2)}B`
  if (a >= 1e6) return `PKR ${(v / 1e6).toFixed(1)}M`
  return `PKR ${Math.round(v).toLocaleString()}`
}

export default function PortfolioRollup() {
  const rows = useMemo(() => {
    const all = [
      ...consumers.map(c => ({ c, cohort: 'Retail' as const, unit: 1 })),
      ...corporates.map(c => ({ c, cohort: 'Corporate' as const, unit: 1e6 })),
    ]
    return all.map(({ c, cohort, unit }) => {
      const pop = POP[c.archetype] ?? 1
      const evaBook = c.summary.eva * unit * pop
      const rapBook = c.summary.riskAdjustedProfit * unit * pop
      const ecBook = c.summary.economicCapital * unit * pop
      const revBook = c.summary.totalRevenue * unit * pop
      return {
        name: c.customer.name.replace(' (illustrative)', ''),
        archetype: c.archetype, cohort, pop,
        evaPer: c.summary.eva * unit, raroc: c.summary.raroc,
        evaBook, rapBook, ecBook, revBook,
      }
    })
  }, [])

  const book = useMemo(() => {
    const eva = rows.reduce((a, r) => a + r.evaBook, 0)
    const rap = rows.reduce((a, r) => a + r.rapBook, 0)
    const ec = rows.reduce((a, r) => a + r.ecBook, 0)
    const rev = rows.reduce((a, r) => a + r.revBook, 0)
    const cust = rows.reduce((a, r) => a + r.pop, 0)
    const creating = rows.filter(r => r.evaBook > 0).reduce((a, r) => a + r.pop, 0)
    return { eva, rap, ec, rev, cust, raroc: ec > 0 ? rap / ec * 100 : 0, creatingPct: creating / cust * 100 }
  }, [rows])

  const sorted = [...rows].sort((a, b) => b.evaBook - a.evaBook)
  const grossPos = rows.filter(r => r.evaBook > 0).reduce((a, r) => a + r.evaBook, 0)
  let cum = 0
  const pareto = sorted.map(r => {
    if (r.evaBook > 0) cum += r.evaBook
    return { name: r.name, evaB: r.evaBook / 1e9, cumPct: Math.round(cum / grossPos * 100), archetype: r.archetype }
  })

  const cohortSplit = ['Retail', 'Corporate'].map(co => ({
    name: co, value: rows.filter(r => r.cohort === co).reduce((a, r) => a + Math.max(r.evaBook, 0), 0) / 1e9,
  }))
  const scatter = rows.map(r => ({ name: r.name, archetype: r.archetype, raroc: Math.max(-30, Math.min(r.raroc, 95)), evaB: r.evaBook / 1e9, pop: r.pop }))
  const topShare = grossPos > 0 ? Math.round(sorted.filter(r => r.evaBook > 0)[0].evaBook / grossPos * 100) : 0

  const kpis = [
    { label: 'Customers (book)', value: book.cust.toLocaleString(), icon: Users },
    { label: 'Book EVA', value: fmtB(book.eva), icon: TrendingUp },
    { label: 'Blended RAROC', value: `${book.raroc.toFixed(1)}%`, icon: Percent },
    { label: 'Book Revenue', value: fmtB(book.rev), icon: Layers },
    { label: 'Economic Capital', value: fmtB(book.ec), icon: Scale },
    { label: 'Value-Creating', value: `${book.creatingPct.toFixed(0)}%`, icon: PieIcon },
  ]

  return (
    <div className="space-y-6" id="page-portfolio-rollup">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 bg-gradient-to-r from-slate-800 via-indigo-700 to-blue-700 rounded-2xl p-7 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center"><Layers size={22} /></div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">Portfolio Roll-Up</h1>
              <p className="text-blue-100 text-sm">The 6 archetypes blended into one book, weighted by representative segment sizes</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
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
          { label: 'Export as JSON', onClick: () => downloadJSON({ book, rows }, 'baiw-portfolio-rollup') },
          { label: 'Export as PDF', onClick: () => downloadPDF('page-portfolio-rollup', 'baiw-portfolio-rollup', 'Portfolio Roll-Up') },
        ]} />
      </div>

      {/* Concentration Pareto + cohort split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">EVA Contribution &amp; Concentration</h2>
          <p className="text-sm text-slate-500 mb-4">Book EVA by segment (bars, PKR B) with cumulative share of value created (line). Top segment = {topShare}% of value created.</p>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={pareto} margin={{ left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis yAxisId="l" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}B`} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v: number | undefined, n: string | undefined) => n === 'cumPct' ? `${v ?? 0}%` : `PKR ${(v ?? 0).toFixed(2)}B`} />
              <ReferenceLine yAxisId="l" y={0} stroke="#94a3b8" />
              <Bar yAxisId="l" dataKey="evaB" name="Book EVA" radius={[3, 3, 0, 0]}>
                {pareto.map((d, i) => <Cell key={i} fill={d.evaB >= 0 ? ARCH_COLOR[d.archetype] : '#f43f5e'} />)}
              </Bar>
              <Line yAxisId="r" type="monotone" dataKey="cumPct" name="cumPct" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Retail vs Corporate</h2>
          <p className="text-sm text-slate-500 mb-4">Share of value created (PKR B)</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={cohortSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                <Cell fill="#6366f1" /><Cell fill="#14b8a6" />
              </Pie>
              <Tooltip formatter={(v: number | undefined) => `PKR ${(v ?? 0).toFixed(2)}B`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Book on the matrix + table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Where the Book's Value Sits</h2>
          <p className="text-sm text-slate-500 mb-4">RAROC vs book-EVA contribution; bubble = customer count</p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey="raroc" name="RAROC" unit="%" tick={{ fontSize: 12 }} domain={['dataMin - 8', 'dataMax + 8']} />
              <YAxis type="number" dataKey="evaB" name="Book EVA" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}B`} />
              <ZAxis type="number" dataKey="pop" range={[100, 700]} />
              <ReferenceLine x={HURDLE} stroke="#6366f1" strokeDasharray="4" label={{ value: 'hurdle', position: 'top', fontSize: 10, fill: '#6366f1' }} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number | undefined, n: string | undefined) => n === 'Book EVA' ? `PKR ${(v ?? 0).toFixed(2)}B` : `${v ?? 0}%`} />
              <Scatter data={scatter}>{scatter.map((r, i) => <Cell key={i} fill={ARCH_COLOR[r.archetype]} />)}</Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Segment Contribution</h2>
          <table className="w-full text-sm min-w-[440px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Segment</th>
                <th className="py-2 pr-3 text-right">Customers</th>
                <th className="py-2 pr-3 text-right">EVA / cust.</th>
                <th className="py-2 pr-3 text-right">Book EVA</th>
                <th className="py-2 text-right">RAROC</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.name} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-700">
                    <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ARCH_COLOR[r.archetype] }} />{r.archetype}</span>
                  </td>
                  <td className="py-2 pr-3 text-right text-slate-600">{r.pop.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right text-slate-600">{fmtB(r.evaPer)}</td>
                  <td className={`py-2 pr-3 text-right font-semibold ${r.evaBook >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtB(r.evaBook)}</td>
                  <td className={`py-2 text-right ${r.raroc >= HURDLE ? 'text-emerald-600' : 'text-rose-600'}`}>{r.raroc}%</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 font-semibold text-slate-800">
                <td className="py-2 pr-3">Book</td>
                <td className="py-2 pr-3 text-right">{book.cust.toLocaleString()}</td>
                <td></td>
                <td className="py-2 pr-3 text-right">{fmtB(book.eva)}</td>
                <td className="py-2 text-right">{book.raroc.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-400 mt-3">Populations are illustrative segment sizes (Star ×{POP['Star'].toLocaleString()}, Anchor ×{POP['Anchor']}, etc.) so the archetypes blend into a realistic book.</p>
        </div>
      </div>
    </div>
  )
}
