import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Gem, Building2, PieChart,
  GitCompareArrows, SlidersHorizontal, Layers, ArrowRight, TrendingUp, Scale,
  Waypoints, Database, Cpu, Landmark, Check, Presentation,
} from 'lucide-react'
import consumers from '../data/consumers.json'
import corporates from '../data/corporates.json'
import ftp from '../alm/data/ftpDecomposition.json'

/* ───────────────────────── helpers ───────────────────────── */

const ahmed = consumers[0]
const sana = consumers[2]
const zenith = corporates.find((c) => c.archetype === 'Capital Guzzler')!

const fmtPk = (n: number) => {
  const a = Math.abs(n)
  const s = n < 0 ? '−' : ''
  if (a >= 1e6) return `${s}PKR ${(a / 1e6).toFixed(2)}M`
  if (a >= 1e3) return `${s}PKR ${(a / 1e3).toFixed(0)}k`
  return `${s}PKR ${a.toFixed(0)}`
}

/* small presentational atoms */
function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-800 text-slate-300 ring-slate-700',
    blue: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
    sky: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
      {children}
    </span>
  )
}

function SlideShell({
  kicker, title, subtitle, children,
}: { kicker: string; title: ReactNode; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col px-8 py-6 md:px-14 md:py-10">
      <div className="mb-5 shrink-0">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">{kicker}</div>
        <h2 className="mt-2 text-2xl font-bold text-white md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-4xl text-sm text-slate-400 md:text-base">{subtitle}</p>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

function Kpi({ label, value, sub, tone = 'blue' }: { label: string; value: string; sub?: string; tone?: string }) {
  const ring: Record<string, string> = {
    blue: 'ring-blue-500/30', emerald: 'ring-emerald-500/30', rose: 'ring-rose-500/30',
    amber: 'ring-amber-500/30', indigo: 'ring-indigo-500/30',
  }
  const val: Record<string, string> = {
    blue: 'text-blue-300', emerald: 'text-emerald-300', rose: 'text-rose-300',
    amber: 'text-amber-300', indigo: 'text-indigo-300',
  }
  return (
    <div className={`rounded-xl bg-slate-800/60 p-4 ring-1 ${ring[tone]}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${val[tone]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

/* ───────────────────────── slides ───────────────────────── */

const MODULES = [
  { icon: PieChart, name: 'Customer Profitability', color: 'text-blue-300', biz: 'Where does book profit actually come from?', out: 'Segment & Pareto view of EVA across the customer base' },
  { icon: Gem, name: 'Consumer 360° Value', color: 'text-emerald-300', biz: 'What is one retail relationship worth?', out: 'Full NII→EVA bridge for a household holding every product' },
  { icon: Building2, name: 'Corporate 360° Value', color: 'text-indigo-300', biz: 'What is a corporate group worth across all accounts?', out: 'Master + sub-accounts, WC/OD, trade, treasury & FX' },
  { icon: GitCompareArrows, name: 'Strategy Matrix', color: 'text-amber-300', biz: 'Who do we protect, grow, fix or exit?', out: '2×2 RAROC × EVA quadrants across all relationships' },
  { icon: SlidersHorizontal, name: 'What-If Lab', color: 'text-sky-300', biz: 'What happens if we reprice or grow this customer?', out: 'Live drivers → recompute EVA/RAROC, watch them move' },
  { icon: Layers, name: 'Portfolio Roll-Up', color: 'text-rose-300', biz: 'What is the whole book worth, and how concentrated?', out: 'Blend every archetype into one book EVA + concentration' },
]

const STACK = [
  { icon: Landmark, layer: 'Board question', tone: 'emerald', ex: '“Is this relationship creating or destroying shareholder value?”' },
  { icon: TrendingUp, layer: 'KPI layer', tone: 'blue', ex: 'EVA · RAROC · RoRWA · CLV · Share of Wallet' },
  { icon: Scale, layer: 'Economic engine', tone: 'indigo', ex: 'FTP margin · ABC cost · IFRS-9 ECL · Economic Capital charge' },
  { icon: Database, layer: 'Data model (FSDM)', tone: 'amber', ex: 'Arrangement · Balance · Rate · Party · Collateral · Event' },
  { icon: Cpu, layer: 'Source systems', tone: 'slate', ex: 'Core banking · Cards · Trade · Treasury · GL · Risk engine' },
]

/* FTP component build-up (from ftpDecomposition.json waterfall) */
const ftpSteps = ftp.waterfall.steps
const custRate = ftpSteps[ftpSteps.length - 1].value
const buildSteps = ftpSteps.slice(0, -1) // exclude the "Customer Rate" total
const ownerTone: Record<string, string> = { Treasury: 'bg-sky-500', Business: 'bg-indigo-500', Customer: 'bg-emerald-500' }
const ownerText: Record<string, string> = { Treasury: 'text-sky-300', Business: 'text-indigo-300' }

/* KPI glossary */
const KPIS = [
  { k: 'FTP-NII', tone: 'blue', def: 'Net interest income after every balance is charged/credited at the matched-maturity transfer rate.', f: 'Asset: bal×(cust−FTP)  ·  Liab: bal×(FTP−cust)', so: 'Strips out rate risk — pure customer margin, Treasury owns the curve.' },
  { k: 'ECL', tone: 'amber', def: 'IFRS-9 expected credit loss — the forward provision the relationship must carry.', f: 'EAD × PD × LGD  (EAD = bal × CCF)', so: 'Turns “interest earned” into “interest kept after risk”.' },
  { k: 'RWA', tone: 'indigo', def: 'Risk-weighted assets — the Basel denominator for regulatory capital.', f: 'bal × CCF × risk-weight  (+ op-risk RWA)', so: 'Two customers, same balance, very different capital appetite.' },
  { k: 'Economic Capital', tone: 'indigo', def: 'Capital the customer must hold against unexpected loss.', f: 'Total RWA × CAR (12.5%)', so: 'The scarce resource every relationship competes for.' },
  { k: 'EVA', tone: 'emerald', def: 'Economic Value Added — profit after the cost of the capital consumed.', f: 'Risk-adj. profit − (Econ. Capital × CoE 18%)', so: 'The single number: value created above the hurdle, in rupees.' },
  { k: 'RAROC', tone: 'blue', def: 'Risk-adjusted return on capital — the efficiency ratio.', f: 'Risk-adjusted profit ÷ Economic Capital', so: 'Compare a PKR 8k deposit vs a PKR 12M mortgage on one axis.' },
  { k: 'CLV', tone: 'emerald', def: 'Customer lifetime value — EVA projected & discounted over the relationship horizon.', f: 'EVA × annuity(growth, discount, years)', so: 'Justifies investing in a thin-but-rising relationship today.' },
  { k: 'Share of Wallet', tone: 'sky', def: 'Fraction of the customer’s total banking need held with us.', f: 'our balances ÷ estimated total need', so: 'The growth lever behind every “Invest & Grow” play.' },
]

/* KPI-by-dashboard coverage matrix */
const DASH = ['Cust. Profit', 'Consumer 360°', 'Corporate 360°', 'Strategy Matrix', 'What-If Lab', 'Portfolio']
const MATRIX: { kpi: string; cells: boolean[] }[] = [
  { kpi: 'FTP-NII',          cells: [true, true, true, false, true, true] },
  { kpi: 'Fee / indirect',   cells: [true, true, true, false, true, true] },
  { kpi: 'ECL',              cells: [true, true, true, false, true, true] },
  { kpi: 'RWA',              cells: [true, true, true, false, true, true] },
  { kpi: 'Econ. Capital',    cells: [true, true, true, true, true, true] },
  { kpi: 'EVA',              cells: [true, true, true, true, true, true] },
  { kpi: 'RAROC',            cells: [true, true, true, true, true, true] },
  { kpi: 'CLV',              cells: [false, true, true, false, false, false] },
  { kpi: 'Share of Wallet',  cells: [false, true, true, true, true, false] },
  { kpi: 'Concentration',    cells: [true, false, false, false, false, true] },
]

/* Quadrant plot points (RAROC x, EVA size) */
const QUAD = [
  { n: 'Ahmed (Star)', raroc: 64.6, eva: 'PKR 1.05M', q: 'Protect & Grow', tone: 'emerald' },
  { n: 'Bilal (High-Potential)', raroc: 75.5, eva: 'PKR 152k', q: 'Invest & Grow', tone: 'blue' },
  { n: 'Sana (Value-Destroyer)', raroc: -214.6, eva: '−PKR 131k', q: 'Reprice or Release', tone: 'rose' },
  { n: 'Indus (Ancillary Champ)', raroc: 54.6, eva: 'PKR 305M', q: 'Protect & Grow', tone: 'emerald' },
  { n: 'Crescent (Anchor)', raroc: 25.1, eva: 'PKR 173M', q: 'Optimize Capital', tone: 'amber' },
  { n: 'Zenith (Capital Guzzler)', raroc: 9.8, eva: '−PKR 91M', q: 'Restructure', tone: 'rose' },
]

function Bridge({ rows, unit }: { rows: { label: string; value: number; type: string }[]; unit: (n: number) => string }) {
  const vals = rows.map((r) => Math.abs(r.value))
  const max = Math.max(...vals, 1)
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const w = (Math.abs(r.value) / max) * 100
        const isTotal = r.type === 'start' || r.type === 'subtotal' || r.type === 'final'
        const neg = r.value < 0
        const bar = r.type === 'final' ? 'bg-emerald-500' : isTotal ? 'bg-slate-500' : neg ? 'bg-rose-500/80' : 'bg-blue-500/80'
        return (
          <div key={r.label} className="flex items-center gap-3">
            <div className={`w-56 shrink-0 text-right text-xs ${isTotal ? 'font-bold text-slate-200' : 'text-slate-400'}`}>{r.label}</div>
            <div className="h-5 flex-1 rounded bg-slate-800/50">
              <div className={`h-5 rounded ${bar}`} style={{ width: `${w}%` }} />
            </div>
            <div className={`w-28 shrink-0 text-xs tabular-nums ${r.type === 'final' ? 'font-bold text-emerald-300' : neg ? 'text-rose-300' : 'text-slate-300'}`}>
              {unit(r.value)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* build the slide list */
function useSlides(): { title: string; el: ReactNode }[] {
  return [
    /* 1 — cover */
    {
      title: 'Cover',
      el: (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <Pill tone="blue"><Presentation size={13} /> BAIW · Customer Value Suite</Pill>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
            From <span className="text-sky-400">FTP</span> to the <span className="text-emerald-400">Boardroom</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-400 md:text-lg">
            Six connected dashboards that turn one balance sheet into one number a banker can act on —
            <span className="text-slate-200"> the economic value of every customer.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {MODULES.map((m) => (
              <Pill key={m.name} tone="slate"><m.icon size={13} className={m.color} /> {m.name}</Pill>
            ))}
          </div>
          <div className="mt-10 text-xs text-slate-600">
            Illustrative Pakistan banking data · figures anonymized · built by Godaitec (godai.tech)
          </div>
        </div>
      ),
    },
    /* 2 — problem */
    {
      title: 'The problem',
      el: (
        <SlideShell
          kicker="Why this exists"
          title={<>Accounting profit lies about who is <span className="text-rose-400">worth it</span></>}
          subtitle="A branch P&L flatters the wrong customers. Three things it never sees:"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: 'It ignores funding', d: 'A 0% current account looks “free”. On the FTP curve it earns a 12.6% credit — often the most valuable line in the relationship.', tone: 'blue' },
              { t: 'It ignores risk', d: 'Two loans at 24% are not equal. One is Stage-1 prime, one is Stage-3 delinquent bleeding provisions. ECL separates them.', tone: 'amber' },
              { t: 'It ignores capital', d: 'A high-margin loan can still destroy value if its RWA soaks up capital the bank could deploy better. Capital isn’t free.', tone: 'rose' },
            ].map((c) => (
              <div key={c.t} className="rounded-xl bg-slate-800/60 p-5 ring-1 ring-slate-700">
                <div className="text-lg font-bold text-white">{c.t}</div>
                <p className="mt-2 text-sm text-slate-400">{c.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="text-sm text-emerald-200">
              <span className="font-bold">The fix:</span> price funds correctly (FTP), charge for risk (ECL) and capital (EVA),
              and the same customer base re-sorts into <span className="font-semibold">protect · grow · fix · exit.</span>
            </div>
          </div>
        </SlideShell>
      ),
    },
    /* 3 — the package / value chain */
    {
      title: 'The package',
      el: (
        <SlideShell
          kicker="One use-case package"
          title="Six dashboards, one economic spine"
          subtitle="Each answers a different stakeholder question — but all run the same FTP → risk → capital → EVA engine."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {MODULES.map((m, i) => (
              <div key={m.name} className="flex items-start gap-4 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
                  <m.icon size={20} className={m.color} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">0{i + 1}</span>
                    <span className="font-bold text-white">{m.name}</span>
                  </div>
                  <div className="mt-0.5 text-xs italic text-slate-400">“{m.biz}”</div>
                  <div className="mt-1 text-xs text-slate-300">{m.out}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            Zoom out <ArrowRight size={14} className="text-slate-600" /> Customer <ArrowRight size={14} className="text-slate-600" /> Segment <ArrowRight size={14} className="text-slate-600" /> Book · Zoom in to a single driver in the What-If Lab
          </div>
        </SlideShell>
      ),
    },
    /* 4 — business to tech stack */
    {
      title: 'Business → Tech',
      el: (
        <SlideShell
          kicker="From business to tech"
          title="One question, resolved down five layers"
          subtitle="The deck a CFO reads at the top is the same model an engineer wires at the bottom."
        >
          <div className="space-y-2">
            {STACK.map((s, i) => (
              <div key={s.layer} className="flex items-center gap-4">
                <div className="w-6 text-right text-xs font-bold text-slate-600">{i + 1}</div>
                <div className={`flex flex-1 items-center gap-4 rounded-xl p-4 ring-1 ${
                  s.tone === 'emerald' ? 'bg-emerald-500/10 ring-emerald-500/30' :
                  s.tone === 'blue' ? 'bg-blue-500/10 ring-blue-500/30' :
                  s.tone === 'indigo' ? 'bg-indigo-500/10 ring-indigo-500/30' :
                  s.tone === 'amber' ? 'bg-amber-500/10 ring-amber-500/30' :
                  'bg-slate-800/60 ring-slate-700'}`}
                  style={{ marginLeft: `${i * 2.2}rem` }}>
                  <s.icon size={20} className={
                    s.tone === 'emerald' ? 'text-emerald-300' : s.tone === 'blue' ? 'text-blue-300' :
                    s.tone === 'indigo' ? 'text-indigo-300' : s.tone === 'amber' ? 'text-amber-300' : 'text-slate-400'} />
                  <div>
                    <div className="text-sm font-bold text-white">{s.layer}</div>
                    <div className="text-xs text-slate-400">{s.ex}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-xs text-slate-500">
            Business value flows <span className="text-emerald-300">down</span> into requirements · data flows <span className="text-blue-300">up</span> into the KPI
          </div>
        </SlideShell>
      ),
    },
    /* 5 — the economic spine formula */
    {
      title: 'Economic spine',
      el: (
        <SlideShell
          kicker="The one calculation"
          title="Every dashboard is this bridge, at a different zoom"
          subtitle={<>Worked live for <span className="text-emerald-300">Ahmed Raza — the “Star” consumer</span> holding every product.</>}
        >
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Bridge rows={ahmed.waterfall} unit={fmtPk} />
            </div>
            <div className="space-y-3 lg:col-span-2">
              <Kpi label="FTP-adjusted NII" value={fmtPk(ahmed.summary.ftpAdjustedNII)} sub="funds priced at the curve" tone="blue" />
              <Kpi label="Economic Value Added" value={fmtPk(ahmed.summary.eva)} sub="value above the cost of capital" tone="emerald" />
              <Kpi label="RAROC" value={`${ahmed.summary.raroc}%`} sub={`vs 18% hurdle → ${(ahmed.summary.raroc / 18).toFixed(1)}× the bar`} tone="blue" />
            </div>
          </div>
          <div className="mt-5 rounded-lg bg-slate-800/60 p-3 text-center text-xs text-slate-300 ring-1 ring-slate-700">
            <span className="font-mono text-slate-200">EVA = [ FTP-NII + Fees − ECL − OpCost ] − (Economic Capital × Cost of Equity)</span>
            <span className="text-slate-500"> · </span>
            <span className="font-mono text-slate-200">RAROC = Risk-adjusted profit ÷ Economic Capital</span>
          </div>
        </SlideShell>
      ),
    },
    /* 6 — how dynamic FTP works (concept) */
    {
      title: 'Dynamic FTP — concept',
      el: (
        <SlideShell
          kicker="Linking ALM · FTP"
          title="How dynamic FTP works"
          subtitle="Every rupee is bought from — or sold to — Treasury at a matched-maturity transfer rate. The desk that takes the risk keeps the reward."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-sky-500/10 p-5 ring-1 ring-sky-500/30">
              <Pill tone="sky"><Waypoints size={13} /> Treasury owns the curve</Pill>
              <p className="mt-3 text-sm text-slate-300">
                A single internal price of money, derived from <span className="font-semibold text-sky-300">KIBOR / PKRV</span> at every tenor.
                Assets <span className="font-semibold">pay</span> it; liabilities <span className="font-semibold">earn</span> it.
              </p>
            </div>
            <div className="rounded-xl bg-indigo-500/10 p-5 ring-1 ring-indigo-500/30">
              <Pill tone="indigo"><Gem size={13} /> Business owns the margin</Pill>
              <p className="mt-3 text-sm text-slate-300">
                What’s left after the transfer rate is <span className="font-semibold text-indigo-300">pure customer margin</span> —
                free of any interest-rate-risk noise the business can’t control.
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-5 ring-1 ring-emerald-500/30">
              <Pill tone="emerald"><Scale size={13} /> Rate risk is centralised</Pill>
              <p className="mt-3 text-sm text-slate-300">
                All repricing/tenor mismatch pools in the <span className="font-semibold text-emerald-300">ALM book (IRRBB)</span>,
                hedged once — not scattered across thousands of accounts.
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Why “dynamic”, not a fixed pool rate</div>
            <div className="mt-2 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              <div>• The curve <span className="text-sky-300">refreshes with the market</span> (KIBOR/PKRV) — not an annual pool average.</div>
              <div>• <span className="text-emerald-300">Behavioral maturities</span>: sticky CASA is priced long, hot money short.</div>
              <div>• Each tranche keeps the rate <span className="text-amber-300">at origination</span> for its life (matched-maturity).</div>
              <div>• Add-ons (liquidity, optionality) flex with <span className="text-rose-300">LCR/NSFR</span> conditions.</div>
            </div>
          </div>
        </SlideShell>
      ),
    },
    /* 7 — the curve + component build up */
    {
      title: 'Dynamic FTP — the build-up',
      el: (
        <SlideShell
          kicker="How dynamic FTP is computed — 1 of 2"
          title="The transfer rate is built in layers"
          subtitle={<>Worked for a <span className="text-white">{ftp.waterfall.product}</span>. Blue = Treasury owns it · violet = the business owns it.</>}
        >
          <div className="grid gap-6 lg:grid-cols-5">
            {/* the curve */}
            <div className="lg:col-span-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">FTP curve (from KIBOR {ftp.kibor6m}% · policy {ftp.policyRate}%)</div>
              <div className="mt-3 space-y-1.5">
                {ftp.curve.map((c) => {
                  const lo = 11.5, hi = 14.2
                  const w = ((c.rate - lo) / (hi - lo)) * 100
                  return (
                    <div key={c.tenor} className="flex items-center gap-2">
                      <div className="w-10 text-right text-xs text-slate-400">{c.tenor}</div>
                      <div className="h-4 flex-1 rounded bg-slate-800">
                        <div className="h-4 rounded bg-gradient-to-r from-sky-600 to-sky-400" style={{ width: `${w}%` }} />
                      </div>
                      <div className="w-12 text-xs tabular-nums text-sky-300">{c.rate}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* build-up stacked bar */}
            <div className="lg:col-span-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Rate build-up → customer rate {custRate}%</div>
              <div className="mt-3 flex h-9 w-full overflow-hidden rounded-lg ring-1 ring-slate-700">
                {buildSteps.map((s) => (
                  <div key={s.label} className={`${ownerTone[s.owner]} flex items-center justify-center`} style={{ width: `${(s.value / custRate) * 100}%` }} title={`${s.label}: ${s.value}%`}>
                    {s.value >= 1.2 && <span className="px-1 text-[10px] font-bold text-white">{s.value}%</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5">
                {buildSteps.map((s) => (
                  <div key={s.label} className="flex items-center justify-between rounded-md bg-slate-800/50 px-3 py-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-2.5 w-2.5 rounded-full ${ownerTone[s.owner]}`} />
                      <span className="text-slate-300">{s.label}</span>
                      <span className={`text-[10px] ${ownerText[s.owner] ?? 'text-slate-500'}`}>({s.owner})</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-slate-200">+{s.value}%</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-md bg-emerald-500/15 px-3 py-1.5 ring-1 ring-emerald-500/30">
                  <span className="text-xs font-bold text-emerald-200">= Customer rate</span>
                  <span className="text-xs font-bold tabular-nums text-emerald-200">{custRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </SlideShell>
      ),
    },
    /* 8 — computed: margin per product */
    {
      title: 'Dynamic FTP — the margin',
      el: (
        <SlideShell
          kicker="How dynamic FTP is computed — 2 of 2"
          title="Margin = customer rate vs the matched FTP rate"
          subtitle="Assets are charged for funds; liabilities are credited. The CASA line is the surprise winner; above-curve hot money is the loser."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3">Product</th>
                  <th className="px-3">Side</th>
                  <th className="px-3 text-right">Customer rate</th>
                  <th className="px-3 text-right">FTP rate</th>
                  <th className="px-3 text-right">Net margin</th>
                  <th className="px-3">Signal</th>
                </tr>
              </thead>
              <tbody>
                {ftp.products.map((p) => {
                  const good = p.netMargin >= 1
                  const bad = p.netMargin < 0
                  return (
                    <tr key={p.product} className="border-b border-slate-800/60">
                      <td className="py-2 pr-3 text-slate-200">{p.product}</td>
                      <td className="px-3">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.side === 'Asset' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-sky-500/20 text-sky-300'}`}>{p.side}</span>
                      </td>
                      <td className="px-3 text-right tabular-nums text-slate-300">{p.customerRate.toFixed(1)}%</td>
                      <td className="px-3 text-right tabular-nums text-slate-400">{p.ftpRate.toFixed(1)}%</td>
                      <td className={`px-3 text-right font-bold tabular-nums ${bad ? 'text-rose-300' : good ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {p.netMargin > 0 ? '+' : ''}{p.netMargin.toFixed(1)}%
                      </td>
                      <td className="px-3 text-xs text-slate-500">
                        {p.product.includes('Current') ? 'Free funding earns the curve' :
                          bad ? 'Priced above own funding cost' :
                          good ? 'Healthy spread' : 'Thin / commodity'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-200 ring-1 ring-emerald-500/30">
              <span className="font-bold">Current account @ 0%</span> vs 12.6% curve → <span className="font-bold">+12.6% credit</span>. The “free” balance is the most valuable line in the book.
            </div>
            <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-200 ring-1 ring-rose-500/30">
              <span className="font-bold">Promo term deposit @ 14.5%</span> vs 13.1% curve → <span className="font-bold">−1.4%</span>. Paying above your own funding cost destroys value at any volume.
            </div>
          </div>
        </SlideShell>
      ),
    },
    /* 9 — ALM ↔ customer value linkage */
    {
      title: 'ALM ↔ Value',
      el: (
        <SlideShell
          kicker="Linking ALM · FTP"
          title="The curve and the customer feed each other"
          subtitle="FTP is the handshake between the ALM module and the customer-value suite — a two-way contract."
        >
          <div className="grid items-stretch gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-sky-500/10 p-5 ring-1 ring-sky-500/30">
              <div className="flex items-center gap-2 text-sky-300"><Scale size={18} /><span className="font-bold">ALM / Treasury → gives</span></div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• The <span className="font-semibold text-sky-300">FTP curve</span> at every tenor (KIBOR/PKRV)</li>
                <li>• <span className="font-semibold text-sky-300">Liquidity & optionality</span> add-ons from LCR/NSFR</li>
                <li>• The <span className="font-semibold text-sky-300">behavioral tenor</span> for non-maturity deposits</li>
                <li>• Centralised <span className="font-semibold text-sky-300">IRRBB</span> (EVE / ΔNII) hedging</li>
              </ul>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-5 ring-1 ring-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-300"><Gem size={18} /><span className="font-bold">Customer value → returns</span></div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Observed <span className="font-semibold text-emerald-300">deposit stickiness</span> → refines behavioral assumptions</li>
                <li>• <span className="font-semibold text-emerald-300">Prepayment / draw</span> behavior → curve & liquidity calibration</li>
                <li>• <span className="font-semibold text-emerald-300">Repricing signals</span> → which balances to defend or release</li>
                <li>• Product mix → <span className="font-semibold text-emerald-300">NSFR-friendly</span> funding strategy</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3 rounded-xl bg-slate-800/60 p-4 text-sm text-slate-300 ring-1 ring-slate-700">
            <Pill tone="sky">ALM module</Pill>
            <ArrowRight size={16} className="text-slate-500" />
            <span className="font-mono text-xs text-slate-200">FTP rate</span>
            <ArrowRight size={16} className="text-slate-500" />
            <Pill tone="emerald">Customer EVA</Pill>
            <ArrowRight size={16} className="text-slate-500" />
            <span className="font-mono text-xs text-slate-200">behavior</span>
            <ArrowRight size={16} className="text-slate-500" />
            <Pill tone="sky">ALM assumptions</Pill>
          </div>
        </SlideShell>
      ),
    },
    /* 10 — KPI glossary */
    {
      title: 'KPI glossary',
      el: (
        <SlideShell
          kicker="KPIs as use cases"
          title="The eight numbers every dashboard speaks"
          subtitle="Each is a decision, not just a metric — definition · formula · why a banker cares."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {KPIS.map((k) => (
              <div key={k.k} className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-slate-700">
                <div className="flex items-center justify-between">
                  <Pill tone={k.tone}>{k.k}</Pill>
                  <span className="font-mono text-[10px] text-slate-500">{k.f}</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">{k.def}</p>
                <p className="mt-1 text-xs italic text-slate-500">→ {k.so}</p>
              </div>
            ))}
          </div>
        </SlideShell>
      ),
    },
    /* 11 — KPI x dashboard matrix */
    {
      title: 'KPI coverage',
      el: (
        <SlideShell
          kicker="KPIs as use cases"
          title="Which dashboard surfaces which KPI"
          subtitle="The same engine, exposed at the zoom each stakeholder needs. Every customer view carries RAROC · RWA · EVA."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3">KPI</th>
                  {DASH.map((d) => (
                    <th key={d} className="px-2 text-center font-semibold text-slate-400">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((row) => (
                  <tr key={row.kpi} className="border-t border-slate-800/60">
                    <td className="py-2 pr-3 font-semibold text-slate-200">{row.kpi}</td>
                    {row.cells.map((on, i) => (
                      <td key={i} className="px-2 text-center">
                        {on
                          ? <Check size={16} className="mx-auto text-emerald-400" />
                          : <span className="text-slate-700">·</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            EVA and RAROC appear on <span className="text-emerald-300 font-semibold">all six</span> — they are the common language.
            CLV and Share-of-Wallet live on the deep-dive 360° views; concentration on the book-level views.
          </div>
        </SlideShell>
      ),
    },
    /* 12 — strategy quadrants */
    {
      title: 'Strategy Matrix',
      el: (
        <SlideShell
          kicker="Turning KPIs into action"
          title="The verdict: protect · grow · fix · exit"
          subtitle="Plot RAROC against EVA and every relationship lands in a play. Same six customers, run through the same engine."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {QUAD.map((c) => (
              <div key={c.n} className={`flex items-center justify-between rounded-xl p-4 ring-1 ${
                c.tone === 'emerald' ? 'bg-emerald-500/10 ring-emerald-500/30' :
                c.tone === 'blue' ? 'bg-blue-500/10 ring-blue-500/30' :
                c.tone === 'amber' ? 'bg-amber-500/10 ring-amber-500/30' :
                'bg-rose-500/10 ring-rose-500/30'}`}>
                <div>
                  <div className="font-bold text-white">{c.n}</div>
                  <div className={`mt-0.5 text-xs font-semibold ${
                    c.tone === 'emerald' ? 'text-emerald-300' : c.tone === 'blue' ? 'text-blue-300' :
                    c.tone === 'amber' ? 'text-amber-300' : 'text-rose-300'}`}>{c.q}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{c.eva}</div>
                  <div className="text-xs text-slate-400">RAROC {c.raroc}%</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-xs text-slate-500">
            18% hurdle is the waterline · above it and EVA-positive → grow · below it or EVA-negative → reprice, restructure or release
          </div>
        </SlideShell>
      ),
    },
    /* 13 — worked contrast */
    {
      title: 'Same engine, opposite verdicts',
      el: (
        <SlideShell
          kicker="Proof"
          title="One model, three very different customers"
          subtitle="Nothing is hand-graded — the verdict falls straight out of FTP, ECL and capital."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { c: ahmed, tone: 'emerald', tag: 'Star' },
              { c: zenith, tone: 'rose', tag: 'Capital Guzzler', corp: true },
              { c: sana, tone: 'rose', tag: 'Value-Destroyer' },
            ].map(({ c, tone, tag, corp }) => (
              <div key={c.customer.name} className={`rounded-xl bg-slate-800/60 p-5 ring-1 ${tone === 'emerald' ? 'ring-emerald-500/40' : 'ring-rose-500/40'}`}>
                <Pill tone={tone}>{tag}</Pill>
                <div className="mt-3 font-bold text-white">{c.customer.name.replace(' (illustrative)', '')}</div>
                <div className="text-xs text-slate-500">{c.customer.segment}</div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">EVA</span>
                    <span className={`font-bold ${c.summary.eva < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {corp ? `PKR ${c.summary.eva}M` : fmtPk(c.summary.eva)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">RAROC</span>
                    <span className={`font-bold ${c.summary.raroc < 18 ? 'text-rose-300' : 'text-emerald-300'}`}>{c.summary.raroc}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Revenue</span>
                    <span className="text-slate-200">{corp ? `PKR ${c.summary.totalRevenue}M` : fmtPk(c.summary.totalRevenue)}</span></div>
                </div>
                <p className="mt-4 text-xs italic text-slate-400">{c.strategy.stance}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-xs text-slate-500">
            The Star clears the hurdle 3.6× · the Guzzler earns 9.8% on capital it can’t justify · the rate-shopper is negative before a single cost.
          </div>
        </SlideShell>
      ),
    },
    /* 14 — portfolio roll-up */
    {
      title: 'Portfolio Roll-Up',
      el: (
        <SlideShell
          kicker="Zoom all the way out"
          title="Blend the archetypes into one book"
          subtitle="Weight each of the six by an illustrative population and the whole balance sheet resolves to a handful of numbers."
        >
          <div className="grid gap-3 md:grid-cols-4">
            <Kpi label="Customers" value="315,485" tone="blue" />
            <Kpi label="Book EVA" value="PKR 187.9B" sub="value created above hurdle" tone="emerald" />
            <Kpi label="Blended RAROC" value="40.2%" sub="vs 18% hurdle" tone="blue" />
            <Kpi label="Economic Capital" value="PKR 847B" tone="indigo" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-amber-500/10 p-5 ring-1 ring-amber-500/30">
              <div className="text-sm font-bold text-amber-200">Concentration is the story</div>
              <p className="mt-2 text-sm text-slate-300">
                The top two segments — <span className="font-semibold text-amber-300">Ancillary Champion (40%)</span> and
                <span className="font-semibold text-amber-300"> Star (32%)</span> — create <span className="font-bold">72%</span> of all value.
              </p>
            </div>
            <div className="rounded-xl bg-rose-500/10 p-5 ring-1 ring-rose-500/30">
              <div className="text-sm font-bold text-rose-200">And where it leaks</div>
              <p className="mt-2 text-sm text-slate-300">
                Value-destroyers erase <span className="font-bold text-rose-300">PKR 12.3B</span>. Retail vs corporate value is near-balanced
                (<span className="text-slate-200">PKR 96.6B vs 103.6B</span>) — mass retail matters as much as a few big names.
              </p>
            </div>
          </div>
        </SlideShell>
      ),
    },
    /* 15 — tech / close */
    {
      title: 'Under the hood',
      el: (
        <SlideShell
          kicker="Business ↔ Tech, closed"
          title="One engine, verified two ways"
          subtitle="The number on the CFO’s slide and the number in the browser come from the same maths."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-800/60 p-5 ring-1 ring-slate-700">
              <Database size={20} className="text-amber-300" />
              <div className="mt-2 font-bold text-white">Grounded in FSDM</div>
              <p className="mt-1 text-xs text-slate-400">Every input maps to a Financial Services Data Model entity — arrangement, balance, rate, party, collateral, event — with 34 explicit mappings.</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-5 ring-1 ring-slate-700">
              <Cpu size={20} className="text-blue-300" />
              <div className="mt-2 font-bold text-white">Parity-tested engine</div>
              <p className="mt-1 text-xs text-slate-400">A Python generator and the in-app TypeScript calculator (<span className="font-mono">profitability.ts</span>) reproduce all six EVAs exactly — the What-If Lab can’t drift from the model.</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-5 ring-1 ring-slate-700">
              <Scale size={20} className="text-indigo-300" />
              <div className="mt-2 font-bold text-white">ALM-linked FTP</div>
              <p className="mt-1 text-xs text-slate-400">The curve, liquidity add-ons and behavioral tenors come from the ALM module — one source of truth for the price of money.</p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 p-6 text-center">
            <div className="text-lg font-bold text-white">From a KIBOR tick to a boardroom verdict — one connected model.</div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              <Pill tone="sky">FTP curve</Pill><ArrowRight size={14} className="text-slate-600" />
              <Pill tone="blue">Customer margin</Pill><ArrowRight size={14} className="text-slate-600" />
              <Pill tone="amber">Risk & capital</Pill><ArrowRight size={14} className="text-slate-600" />
              <Pill tone="emerald">EVA / RAROC</Pill><ArrowRight size={14} className="text-slate-600" />
              <Pill tone="indigo">Strategy & book</Pill>
            </div>
            <div className="mt-4 text-xs text-slate-500">BAIW Customer Value Suite · illustrative data · built by Godaitec (godai.tech)</div>
          </div>
        </SlideShell>
      ),
    },
  ]
}

/* ───────────────────────── shell ───────────────────────── */

export default function UseCaseDeck() {
  const slides = useSlides()
  const [i, setI] = useState(0)
  const [fs, setFs] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const go = (n: number) => setI((p) => Math.min(slides.length - 1, Math.max(0, p + n)))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1) }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1) }
      else if (e.key === 'Home') setI(0)
      else if (e.key === 'End') setI(slides.length - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else ref.current?.requestFullscreen?.()
  }

  return (
    <div
      ref={ref}
      className={`relative flex flex-col overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-slate-800 ${
        fs ? 'h-screen rounded-none' : 'h-[calc(100vh-7rem)] min-h-[560px]'
      }`}
    >
      {/* ambient */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Presentation size={16} className="text-blue-400" /> Customer Value Suite — Use-Case Deck
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-slate-500">{String(i + 1).padStart(2, '0')} / {slides.length}</span>
          <button onClick={toggleFs} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" title="Fullscreen (present)">
            {fs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* slide */}
      <div className="relative z-10 min-h-0 flex-1">
        {slides[i].el}
      </div>

      {/* controls */}
      <div className="relative z-10 flex items-center justify-between border-t border-slate-800 px-6 py-3">
        <button
          onClick={() => go(-1)} disabled={i === 0}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((s, n) => (
            <button
              key={s.title} onClick={() => setI(n)} title={s.title}
              className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-blue-400' : 'w-2 bg-slate-700 hover:bg-slate-600'}`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)} disabled={i === slides.length - 1}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-30"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
