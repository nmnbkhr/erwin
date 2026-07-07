import { useState, useMemo } from 'react'
import { SlidersHorizontal, RotateCcw, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import {
  ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import consumers from '../data/consumers.json'
import corporates from '../data/corporates.json'
import { computeScenario, classifyStance, NEUTRAL, type Sliders } from '../utils/profitability'

const ARCH_COLOR: Record<string, string> = {
  'Star': '#10b981', 'High-Potential': '#3b82f6', 'Value-Destroyer': '#f43f5e',
  'Anchor': '#6366f1', 'Ancillary Champion': '#14b8a6', 'Capital Guzzler': '#f59e0b',
}
const HURDLE = 18
const STANCE_COLOR: Record<string, string> = {
  protect: 'bg-emerald-100 text-emerald-700', invest: 'bg-blue-100 text-blue-700',
  optimize: 'bg-indigo-100 text-indigo-700', reprice: 'bg-amber-100 text-amber-700', restructure: 'bg-rose-100 text-rose-700',
}

type Entry = (typeof consumers)[number] & { cohort: 'Consumer' | 'Corporate' }
const ALL: Entry[] = [
  ...consumers.map(c => ({ ...c, cohort: 'Consumer' as const })),
  ...corporates.map(c => ({ ...c, cohort: 'Corporate' as const })),
]

function fmtConsumer(v: number) {
  const a = Math.abs(v)
  if (a >= 1e6) return `PKR ${(v / 1e6).toFixed(2)}M`
  if (a >= 1e3) return `PKR ${(v / 1e3).toFixed(0)}k`
  return `PKR ${Math.round(v)}`
}
function fmtCorp(v: number) {
  const a = Math.abs(v)
  if (a >= 1000) return `PKR ${(v / 1000).toFixed(2)}B`
  return `PKR ${v.toFixed(1)}M`
}
const clampR = (r: number) => Math.max(-30, Math.min(r, 95))

const SLIDER_DEFS: { key: keyof Sliders; label: string; min: number; max: number; step: number; pct?: boolean; pp?: boolean }[] = [
  { key: 'lendingBal', label: 'Lending / asset balances', min: 0.5, max: 2, step: 0.05, pct: true },
  { key: 'depositBal', label: 'Deposit balances', min: 0.5, max: 2, step: 0.05, pct: true },
  { key: 'lendingSpread', label: 'Lending spread shift', min: -3, max: 3, step: 0.1, pp: true },
  { key: 'depositRate', label: 'Deposit rate shift', min: -3, max: 3, step: 0.1, pp: true },
  { key: 'fee', label: 'Fee / ancillary income', min: 0.5, max: 2, step: 0.05, pct: true },
  { key: 'cost', label: 'Cost to serve (ABC)', min: 0.5, max: 2, step: 0.05, pct: true },
  { key: 'ecl', label: 'Risk / ECL', min: 0.3, max: 2.5, step: 0.05, pct: true },
]

export default function WhatIfLab() {
  const [selId, setSelId] = useState(ALL[0].customer.id)
  const [sliders, setSliders] = useState<Sliders>({ ...NEUTRAL })

  const inst = ALL.find(c => c.customer.id === selId) ?? ALL[0]
  const cohort = inst.cohort
  const fmt = cohort === 'Consumer' ? fmtConsumer : fmtCorp
  const valueThreshold = cohort === 'Consumer' ? 500000 : 150

  const base = useMemo(() => computeScenario(inst.products, inst.assumptions, inst.costs, NEUTRAL), [inst])
  const live = useMemo(() => computeScenario(inst.products, inst.assumptions, inst.costs, sliders), [inst, sliders])

  const baseStance = classifyStance(base.summary.eva, base.summary.raroc, HURDLE, valueThreshold)
  const liveStance = classifyStance(live.summary.eva, live.summary.raroc, HURDLE, valueThreshold)
  const moved = liveStance.key !== baseStance.key

  // cohort peers for the scatter (static, from stored summaries)
  const cohortList = cohort === 'Consumer' ? consumers : corporates
  const peers = cohortList.filter(c => c.customer.id !== inst.customer.id).map(c => ({
    name: c.customer.name.replace(' (illustrative)', ''), archetype: c.archetype,
    rarocPlot: clampR(c.summary.raroc), eva: c.summary.eva, footings: c.summary.footings,
  }))
  const basePt = [{ name: `${inst.customer.name.replace(' (illustrative)', '')} (base)`, rarocPlot: clampR(base.summary.raroc), eva: base.summary.eva, footings: base.summary.footings }]
  const livePt = [{ name: `${inst.customer.name.replace(' (illustrative)', '')} (live)`, archetype: inst.archetype, rarocPlot: clampR(live.summary.raroc), eva: live.summary.eva, footings: live.summary.footings }]

  // live waterfall
  const wf = useMemo(() => {
    const s = live.summary
    const rows = [
      { label: 'FTP-Adj NII', value: s.ftpAdjustedNII, type: 'start' },
      { label: '+ Fees', value: s.indirectRevenue, type: 'add' },
      { label: '= Revenue', value: s.totalRevenue, type: 'subtotal' },
      { label: '− Op Cost', value: -s.operatingCost, type: 'subtract' },
      { label: '= Op Profit', value: s.operatingProfit, type: 'subtotal' },
      { label: '− ECL', value: -s.totalEcl, type: 'subtract' },
      { label: '= Risk-Adj', value: s.riskAdjustedProfit, type: 'subtotal' },
      { label: '− Capital', value: -s.capitalCharge, type: 'subtract' },
      { label: '= EVA', value: s.eva, type: 'final' },
    ]
    let run = 0
    return rows.map(l => {
      if (l.type === 'start' || l.type === 'subtotal' || l.type === 'final') { run = l.value; return { ...l, base: 0, bar: Math.abs(l.value) } }
      const b = l.value >= 0 ? run : run + l.value; run += l.value; return { ...l, base: b, bar: Math.abs(l.value) }
    })
  }, [live])
  const wfColor = (l: { type: string; value: number }) => l.type === 'final' ? '#4f46e5' : l.type === 'subtotal' ? '#64748b' : l.type === 'start' ? '#3b82f6' : l.value >= 0 ? '#10b981' : '#f43f5e'

  const dEva = live.summary.eva - base.summary.eva
  const dRaroc = live.summary.raroc - base.summary.raroc
  const isDirty = JSON.stringify(sliders) !== JSON.stringify(NEUTRAL)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <SlidersHorizontal size={22} />
          <h1 className="text-2xl font-bold">What-If Lab</h1>
        </div>
        <p className="text-blue-100 text-sm">Adjust the drivers and watch EVA, RAROC and the customer's position on the strategy matrix recompute live — the same math as the reconciled models.</p>
      </div>

      {/* Customer selector */}
      <div className="flex flex-wrap gap-2">
        {ALL.map(c => {
          const active = c.customer.id === selId
          return (
            <button key={c.customer.id} onClick={() => { setSelId(c.customer.id); setSliders({ ...NEUTRAL }) }}
              className={`text-left rounded-xl border px-3 py-2 transition-all ${active ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ARCH_COLOR[c.archetype] }} />
                <span className="text-sm font-medium text-slate-700">{c.customer.name.replace(' (illustrative)', '')}</span>
              </div>
              <div className="text-xs text-slate-400">{c.cohort} · {c.archetype}</div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Drivers</h2>
            <button onClick={() => setSliders({ ...NEUTRAL })} disabled={!isDirty}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${isDirty ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'text-slate-300'}`}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
          <div className="space-y-4">
            {SLIDER_DEFS.map(def => {
              const val = sliders[def.key]
              const display = def.pp ? `${val > 0 ? '+' : ''}${val.toFixed(1)} pp` : `${Math.round(val * 100)}%`
              return (
                <div key={def.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{def.label}</span>
                    <span className={`font-medium ${(def.pp ? val !== 0 : val !== 1) ? 'text-indigo-600' : 'text-slate-400'}`}>{display}</span>
                  </div>
                  <input type="range" min={def.min} max={def.max} step={def.step} value={val}
                    onChange={e => setSliders(s => ({ ...s, [def.key]: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Live KPIs + matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-400 mb-1">Economic Profit (EVA)</div>
              <div className={`text-xl font-bold ${live.summary.eva >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(live.summary.eva)}</div>
              <div className={`text-xs flex items-center gap-1 ${dEva >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {dEva >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{dEva >= 0 ? '+' : ''}{fmt(dEva)} vs base
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-400 mb-1">RAROC</div>
              <div className={`text-xl font-bold ${live.summary.raroc >= HURDLE ? 'text-emerald-600' : 'text-rose-600'}`}>{live.summary.raroc}%</div>
              <div className={`text-xs ${dRaroc >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{dRaroc >= 0 ? '+' : ''}{dRaroc.toFixed(1)} pp · hurdle {HURDLE}%</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-400 mb-1">Total Revenue</div>
              <div className="text-xl font-bold text-slate-800">{fmt(live.summary.totalRevenue)}</div>
              <div className="text-xs text-slate-400">RoR {live.summary.returnOnRevenuePct}%</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-400 mb-1">Strategy</div>
              <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STANCE_COLOR[liveStance.key]}`}>{liveStance.label}</div>
              {moved && <div className="text-xs text-amber-600 mt-1">moved from {baseStance.label}</div>}
            </div>
          </div>

          {/* Matrix with movement */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Position on the Strategy Matrix ({cohort})</h2>
            <p className="text-sm text-slate-500 mb-3">
              Hollow = base, solid = live. Base RAROC {base.summary.raroc}% / EVA {fmt(base.summary.eva)} → live {live.summary.raroc}% / {fmt(live.summary.eva)}.
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="rarocPlot" name="RAROC" unit="%" tick={{ fontSize: 12 }} domain={['dataMin - 8', 'dataMax + 8']} />
                <YAxis type="number" dataKey="eva" name="EVA" tick={{ fontSize: 12 }} />
                <ZAxis type="number" dataKey="footings" range={[120, 500]} />
                <ReferenceLine x={HURDLE} stroke="#6366f1" strokeDasharray="4" label={{ value: 'hurdle', position: 'top', fontSize: 10, fill: '#6366f1' }} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number | undefined, n: string | undefined) => n === 'EVA' ? fmt(v ?? 0) : `${v ?? 0}%`} />
                <Scatter data={peers} fill="#cbd5e1">{peers.map((p, i) => <Cell key={i} fill={ARCH_COLOR[p.archetype]} fillOpacity={0.35} />)}</Scatter>
                <Scatter data={basePt} fill="none" stroke={ARCH_COLOR[inst.archetype]} strokeWidth={2} shape="circle" />
                <Scatter data={livePt} fill={ARCH_COLOR[inst.archetype]} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Live waterfall */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Live EVA Waterfall</h2>
            <p className="text-sm text-slate-500 mb-3">{cohort === 'Consumer' ? 'PKR' : 'PKR M'}</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={wf} margin={{ left: 6, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => cohort === 'Consumer' ? `${Math.round(v / 1000)}k` : `${v}`} />
                <Tooltip formatter={(v: number | undefined, n: string | undefined) => n === 'bar' ? [fmt(v ?? 0), 'Amount'] : ['', '']} />
                <Bar dataKey="base" stackId="a" fill="transparent" />
                <Bar dataKey="bar" stackId="a" radius={[3, 3, 0, 0]}>
                  {wf.map((d, i) => <Cell key={i} fill={wfColor(d)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>Try:</span>
              <ArrowRight size={12} />
              <span>drop deposit rate on the rate-shopper, or grow fee &amp; cut RWA on the capital guzzler, to lift it above the hurdle.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
