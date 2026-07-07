import { Target, Sparkles, ShieldAlert, TrendingUp } from 'lucide-react'

export interface Strategy {
  quadrant: string
  stance: string
  shareOfWalletPct: number
  targetShareOfWalletPct: number
  headline: string
  plays: { lever: string; action: string; impact: string }[]
  nextBestProducts: string[]
  risks: string[]
}

export default function CustomerStrategy({ strategy, accentFrom = 'from-slate-700', accentTo = 'to-indigo-700' }: {
  strategy: Strategy
  accentFrom?: string
  accentTo?: string
}) {
  const s = strategy
  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className={`bg-gradient-to-r ${accentFrom} ${accentTo} rounded-2xl p-6 text-white`}>
        <div className="flex items-center gap-2 mb-2">
          <Target size={20} />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Bank Strategy</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{s.stance}</h2>
            <p className="text-white/80 text-sm mt-0.5">{s.quadrant}</p>
            <p className="text-white/90 text-sm mt-3 max-w-3xl">{s.headline}</p>
          </div>
          {/* Share of wallet */}
          <div className="lg:w-64 shrink-0">
            <div className="flex justify-between text-xs text-white/80 mb-1">
              <span>Share of wallet</span>
              <span>{s.shareOfWalletPct}% → {s.targetShareOfWalletPct}%</span>
            </div>
            <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/90 rounded-full" style={{ width: `${s.shareOfWalletPct}%` }} />
              <div className="absolute top-0 h-3 w-0.5 bg-amber-300" style={{ left: `${s.targetShareOfWalletPct}%` }} title={`Target ${s.targetShareOfWalletPct}%`} />
            </div>
            <div className="text-[11px] text-white/70 mt-1">Amber marker = target</div>
          </div>
        </div>
      </div>

      {/* Plays */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={14} /> Strategic Plays
        </h3>
        <div className="space-y-2">
          {s.plays.map((p, i) => (
            <div key={p.lever} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="md:w-48 shrink-0 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-sm font-semibold text-slate-700">{p.lever}</span>
              </div>
              <div className="flex-1 text-sm text-slate-600">{p.action}</div>
              <div className="md:w-56 shrink-0 text-xs font-medium text-emerald-700 md:text-right">{p.impact}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Next-best products + risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-500" /> Next-Best Products
          </h3>
          <div className="flex flex-wrap gap-2">
            {s.nextBestProducts.map(n => (
              <span key={n} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">{n}</span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldAlert size={14} className="text-rose-500" /> Watch-list &amp; Risks
          </h3>
          <ul className="space-y-1.5">
            {s.risks.map(r => (
              <li key={r} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />{r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
