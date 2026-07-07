import {
  ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { GitCompareArrows, Shield, Rocket, Recycle, AlertTriangle } from 'lucide-react'
import consumers from '../data/consumers.json'
import corporates from '../data/corporates.json'
import ExportMenu from '../components/layout/ExportMenu'
import { downloadJSON, downloadPDF } from '../utils/export'

const HURDLE = 18

const ARCH_COLOR: Record<string, string> = {
  'Star': '#10b981',
  'High-Potential': '#3b82f6',
  'Value-Destroyer': '#f43f5e',
  'Anchor': '#6366f1',
  'Ancillary Champion': '#14b8a6',
  'Capital Guzzler': '#f59e0b',
}

// archetype → strategy quadrant
const ARCH_QUADRANT: Record<string, string> = {
  'Star': 'protect', 'Ancillary Champion': 'protect',
  'High-Potential': 'invest',
  'Anchor': 'optimize',
  'Value-Destroyer': 'restructure', 'Capital Guzzler': 'restructure',
}

const QUADRANTS = [
  { key: 'protect', title: 'Protect & Grow', when: 'High value + high RAROC', icon: Shield, color: 'emerald', desc: 'Defend primacy, deepen share, do not discount. Your best relationships.' },
  { key: 'invest', title: 'Invest & Grow', when: 'Small value now + high RAROC (rising)', icon: Rocket, color: 'blue', desc: 'Acquire wallet share early; trade near-term margin for lifetime value.' },
  { key: 'optimize', title: 'Optimize Capital', when: 'High value but capital-heavy (thin RAROC)', icon: Recycle, color: 'indigo', desc: 'Grow capital-light fee, recycle RWA, capture float — lift RAROC above hurdle.' },
  { key: 'restructure', title: 'Restructure or Exit', when: 'Negative EVA / below hurdle', icon: AlertTriangle, color: 'rose', desc: 'Reprice to the curve, win ancillary, restructure risk — or manage down.' },
]
const QUAD_BG: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-50', blue: 'border-blue-200 bg-blue-50',
  indigo: 'border-indigo-200 bg-indigo-50', rose: 'border-rose-200 bg-rose-50',
}
const QUAD_ICON: Record<string, string> = {
  emerald: 'bg-emerald-500', blue: 'bg-blue-500', indigo: 'bg-indigo-500', rose: 'bg-rose-500',
}

function shortName(n: string) { return n.replace(' (illustrative)', '') }
function fmtConsumer(v: number) {
  const a = Math.abs(v)
  if (a >= 1e6) return `PKR ${(v / 1e6).toFixed(2)}M`
  if (a >= 1e3) return `PKR ${(v / 1e3).toFixed(0)}k`
  return `PKR ${v}`
}
function fmtCorp(v: number) {
  const a = Math.abs(v)
  if (a >= 1000) return `PKR ${(v / 1000).toFixed(2)}B`
  return `PKR ${v.toFixed(1)}M`
}

interface Row { name: string; archetype: string; stance: string; cohort: 'Consumer' | 'Corporate'; eva: number; raroc: number; rarocPlot: number; footings: number; revenue: number; cost: number; ecl: number; ec: number; fmt: (v: number) => string }

function toRows(list: typeof consumers, cohort: 'Consumer' | 'Corporate', fmt: (v: number) => string): Row[] {
  return list.map(c => ({
    name: shortName(c.customer.name),
    archetype: c.archetype,
    stance: c.strategy.stance,
    cohort,
    eva: c.summary.eva,
    raroc: c.summary.raroc,
    rarocPlot: Math.max(-30, Math.min(c.summary.raroc, 90)),
    footings: c.summary.footings,
    revenue: c.summary.totalRevenue,
    cost: c.summary.operatingCost,
    ecl: c.summary.totalEcl,
    ec: c.summary.economicCapital,
    fmt,
  }))
}

function ScatterPanel({ rows, title, unit }: { rows: Row[]; title: string; unit: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">{title}</h2>
      <p className="text-sm text-slate-500 mb-4">RAROC vs EVA ({unit}); bubble = footings. Hurdle {HURDLE}%, break-even EVA = 0.</p>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" dataKey="rarocPlot" name="RAROC" unit="%" tick={{ fontSize: 12 }} domain={['dataMin - 8', 'dataMax + 8']} />
          <YAxis type="number" dataKey="eva" name="EVA" tick={{ fontSize: 12 }} />
          <ZAxis type="number" dataKey="footings" range={[120, 600]} />
          <ReferenceLine x={HURDLE} stroke="#6366f1" strokeDasharray="4" label={{ value: 'hurdle', position: 'top', fontSize: 10, fill: '#6366f1' }} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null
            const d = payload[0].payload as Row
            return (
              <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
                <div className="font-semibold text-slate-800">{d.name}</div>
                <div className="text-slate-500">{d.archetype}</div>
                <div className="mt-1">EVA <span className="font-medium">{d.fmt(d.eva)}</span></div>
                <div>RAROC <span className="font-medium">{d.raroc}%</span></div>
                <div className="text-indigo-600 mt-1">{d.stance}</div>
              </div>
            )
          }} />
          <Scatter data={rows}>
            {rows.map((r, i) => <Cell key={i} fill={ARCH_COLOR[r.archetype]} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2">
        {rows.map(r => (
          <span key={r.name} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ARCH_COLOR[r.archetype] }} />
            {r.name} <span className="text-slate-400">({r.raroc}%)</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CustomerComparison() {
  const consumerRows = toRows(consumers, 'Consumer', fmtConsumer)
  const corporateRows = toRows(corporates, 'Corporate', fmtCorp)
  const allRows = [...consumerRows, ...corporateRows]
  const rarocBar = allRows.map(r => ({ name: r.name, raroc: r.raroc, over: r.raroc >= HURDLE }))

  return (
    <div className="space-y-6" id="page-customer-comparison">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-800 rounded-2xl p-7 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center"><GitCompareArrows size={22} /></div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">Customer Strategy Matrix</h1>
              <p className="text-blue-100 text-sm">How profitability drives strategy — {consumerRows.length} consumers &amp; {corporateRows.length} corporates compared</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm mt-3 max-w-3xl">Two numbers decide the play: <span className="font-semibold text-white">EVA</span> (how much value) and <span className="font-semibold text-white">RAROC</span> (how efficiently it uses capital). Where a customer sits determines whether the bank grows, invests, optimizes capital, or restructures.</p>
        </div>
        <ExportMenu options={[
          { label: 'Export as JSON', onClick: () => downloadJSON({ consumers, corporates }, 'baiw-customer-comparison') },
          { label: 'Export as PDF', onClick: () => downloadPDF('page-customer-comparison', 'baiw-customer-comparison', 'Customer Strategy Matrix') },
        ]} />
      </div>

      {/* 2x2 strategy matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map(q => {
          const members = allRows.filter(r => ARCH_QUADRANT[r.archetype] === q.key)
          const Icon = q.icon
          return (
            <div key={q.key} className={`rounded-xl border p-5 ${QUAD_BG[q.color]}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${QUAD_ICON[q.color]}`}><Icon size={18} className="text-white" /></div>
                <div>
                  <div className="text-base font-bold text-slate-800">{q.title}</div>
                  <div className="text-xs text-slate-500">{q.when}</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">{q.desc}</p>
              <div className="space-y-1.5">
                {members.map(m => (
                  <div key={m.name} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ARCH_COLOR[m.archetype] }} />
                      <span className="text-sm font-medium text-slate-700">{m.name}</span>
                      <span className="text-xs text-slate-400">{m.cohort}</span>
                    </div>
                    <div className="text-xs text-slate-500">{m.fmt(m.eva)} · {m.raroc}%</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* RAROC vs hurdle (comparable across all) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">RAROC vs Hurdle — All Customers</h2>
        <p className="text-sm text-slate-500 mb-4">RAROC is unit-free and directly comparable. Bars below the {HURDLE}% line destroy economic value.</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rarocBar} margin={{ left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} unit="%" domain={[-30, 90]} />
            <Tooltip formatter={(v: number | undefined) => `${v ?? 0}%`} />
            <ReferenceLine y={HURDLE} stroke="#6366f1" strokeDasharray="4" label={{ value: `hurdle ${HURDLE}%`, position: 'right', fontSize: 10, fill: '#6366f1' }} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="raroc" radius={[3, 3, 0, 0]}>
              {rarocBar.map((d, i) => <Cell key={i} fill={d.over ? '#10b981' : '#f43f5e'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scatter panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScatterPanel rows={consumerRows} title="Consumer Cohort" unit="PKR" />
        <ScatterPanel rows={corporateRows} title="Corporate Cohort" unit="PKR M" />
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Profitability Comparison</h2>
        <p className="text-sm text-slate-500 mb-4">Consumer figures in PKR; corporate figures in PKR millions</p>
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">Cohort</th>
              <th className="py-2 pr-3">Archetype</th>
              <th className="py-2 pr-3 text-right">Revenue</th>
              <th className="py-2 pr-3 text-right">ECL</th>
              <th className="py-2 pr-3 text-right">Econ. Cap.</th>
              <th className="py-2 pr-3 text-right">EVA</th>
              <th className="py-2 pr-3 text-right">RAROC</th>
              <th className="py-2">Strategy</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map(r => (
              <tr key={`${r.cohort}-${r.name}`} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium text-slate-700">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ARCH_COLOR[r.archetype] }} />{r.name}
                  </span>
                </td>
                <td className="py-2 pr-3 text-slate-500">{r.cohort}</td>
                <td className="py-2 pr-3 text-slate-600">{r.archetype}</td>
                <td className="py-2 pr-3 text-right text-slate-600">{r.fmt(r.revenue)}</td>
                <td className="py-2 pr-3 text-right text-rose-600">{r.fmt(r.ecl)}</td>
                <td className="py-2 pr-3 text-right text-slate-600">{r.fmt(r.ec)}</td>
                <td className={`py-2 pr-3 text-right font-semibold ${r.eva >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{r.fmt(r.eva)}</td>
                <td className={`py-2 pr-3 text-right font-semibold ${r.raroc >= HURDLE ? 'text-emerald-600' : 'text-rose-600'}`}>{r.raroc}%</td>
                <td className="py-2 text-slate-700">{r.stance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Playbook */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">How Strategy Follows Profitability</h2>
        <p className="text-sm text-slate-500 mb-4">The same profitability engine drives every decision — the customer's position sets the play</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUADRANTS.map(q => {
            const Icon = q.icon
            return (
              <div key={q.key} className="rounded-lg border border-slate-200 p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${QUAD_ICON[q.color]}`}><Icon size={16} className="text-white" /></div>
                <div className="text-sm font-bold text-slate-800">{q.title}</div>
                <div className="text-xs text-slate-400 mb-2">{q.when}</div>
                <p className="text-xs text-slate-600">{q.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
