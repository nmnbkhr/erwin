import { useMemo } from 'react'
import { Printer, ArrowRight } from 'lucide-react'
import { useLayer } from '../layer'
import positioning from '../data/positioning.json'
import ladder from '../data/ladder.json'
import pillars from '../data/pillars.json'
import cdeRegister from '../data/cdeRegister.json'
import dqRules from '../data/dqRules.json'
import diagnostic from '../data/diagnostic.json'
import type { PositioningData, LadderRung, Pillar, CriticalDataElement, DqRule, DiagnosticData } from '../types'

const POS = positioning as PositioningData
const LADDER = ladder as LadderRung[]
const PILLARS = pillars as Pillar[]
const CDES = cdeRegister as CriticalDataElement[]
const RULES = dqRules as DqRule[]
const DIAG = diagnostic as DiagnosticData

export default function OnePager() {
  const { filter, keep, shows } = useLayer()

  const wedges = keep(POS.wedges).slice(0, 4)
  const bankingLed = filter !== 'core'

  const stats = useMemo(
    () => [
      { value: PILLARS.length, label: 'Governance pillars' },
      { value: DIAG.questions.filter((q) => shows(q.layer)).length, label: 'Diagnostic questions' },
      { value: keep(CDES).length, label: 'Pre-mapped data elements' },
      { value: keep(RULES).length, label: 'Pre-written quality rules' },
    ],
    [keep, shows]
  )

  return (
    <div className="space-y-4">
      {/* Screen-only toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">
          Sales one-pager — rendered from the same data as the rest of the practice, so it cannot drift out of date.
          Currently showing the <span className="font-medium text-slate-700">{filter === 'all' ? 'combined' : filter}</span> layer.
        </p>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
        >
          <Printer size={15} /> Print / PDF
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl">
        {/* Hero */}
        <div className="relative bg-gray-950 px-8 py-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-rose-600/20 blur-[120px]" />
            <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-purple-600/10 blur-[120px]" />
          </div>
          <div className="relative">
            <span className="inline-block mb-4 px-3 py-1 rounded-full border border-gray-700 bg-gray-900/80 text-xs font-medium text-gray-300 tracking-wide">
              Data Governance Practice
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight max-w-3xl">
              {bankingLed
                ? 'Governance that banks fund — because it sits under the regulatory and AI work they already pay for'
                : 'Governance that gets funded — because it sits under work the business is already paying for'}
            </h1>
            <p className="text-base text-gray-400 leading-relaxed mt-4 max-w-3xl">{POS.thesis}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Wedges */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Where we come in</h2>
            <p className="text-sm text-slate-500 mb-4">
              We do not sell governance as governance. We attach it to a problem that already has a budget line.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wedges.map((w) => (
                <div key={w.id} className="border-l-2 border-rose-500 pl-4">
                  <h3 className="text-sm font-semibold text-slate-800">{w.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1">{w.pain}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Ladder */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-1">How the engagement runs</h2>
            <p className="text-sm text-slate-500 mb-4">
              Four rungs. Each is independently sellable, each ends in something you can show a board, and each
              qualifies you for the next. You are never committed further than the rung you have bought.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {LADDER.map((r, i) => (
                <div key={r.id} className="relative rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                      {r.rung}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800">{r.name}</h3>
                  </div>
                  <p className="text-xs text-rose-600 font-medium mb-2">{r.duration}</p>
                  <p className="text-sm text-slate-600 leading-snug">{r.scope[0]}</p>
                  {i < LADDER.length - 1 && (
                    <ArrowRight size={14} className="hidden md:block absolute -right-2.5 top-1/2 text-slate-300" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Differentiators */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-1">How we are different</h2>
            <p className="text-sm text-slate-500 mb-4">
              Most prospects have been through at least one governance programme that produced a policy binder and
              nothing measurable. These are the choices that make this one behave differently.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POS.differentiators.map((d) => (
                <div key={d.title} className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">{d.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1">{d.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Failure modes */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Why these programmes usually fail</h2>
            <p className="text-sm text-slate-500 mb-4">
              And what we do about each one. If you recognise two or more of these from a previous attempt, that is
              the conversation worth having.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">Failure mode</th>
                    <th className="py-2 pr-4 font-medium">What it looks like</th>
                    <th className="py-2 font-medium">What we do instead</th>
                  </tr>
                </thead>
                <tbody>
                  {POS.failureModes.map((f) => (
                    <tr key={f.failure} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="py-2.5 pr-4 text-slate-800 font-medium leading-snug">{f.failure}</td>
                      <td className="py-2.5 pr-4 text-slate-500 leading-snug">{f.symptom}</td>
                      <td className="py-2.5 text-slate-700 leading-snug">{f.counterMeasure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Start with the diagnostic</h2>
            <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
              Two to four weeks, fixed fee, priced to be approved without a board paper. You get a maturity heatmap
              across {PILLARS.length} pillars, a landscape map with the ownership gaps named, your top ten pains
              quantified in your own numbers, and a prioritised roadmap with an ROI hypothesis. If you proceed to
              the blueprint, the diagnostic fee is credited in full.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-950 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Delivered by</span>
            <img src="/godaitec-logo-white.png" alt="GODAITEC" className="h-7 w-auto" />
          </div>
          <span className="text-sm text-gray-500">Built for Pakistan · godai.tech</span>
        </div>
      </div>
    </div>
  )
}
