import { useState } from 'react'
import { Card, PageHeader, SectionTitle, Tabs, ExportButton, TableWrap } from './ui'
import { LayerBadge } from '../LayerContext'
import { useLayer } from '../layer'
import { downloadCSV } from '../../utils/export'
import ladder from '../data/ladder.json'
import positioning from '../data/positioning.json'
import type { LadderRung, PositioningData } from '../types'

const LADDER = ladder as LadderRung[]
const POS = positioning as PositioningData

function Bullets({ items, dot = 'bg-slate-400' }: { items: string[]; dot?: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-600 leading-relaxed">
          <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${dot}`} />
          {i}
        </li>
      ))}
    </ul>
  )
}

export default function ServiceLadder() {
  const { keep } = useLayer()
  const [activeId, setActiveId] = useState(LADDER[0].id)
  const rung = LADDER.find((r) => r.id === activeId)!
  const deliverables = keep(rung.deliverables)

  const exportDeliverables = () => {
    downloadCSV(
      LADDER.flatMap((r) =>
        keep(r.deliverables).map((d) => ({
          rung: r.rung,
          rung_name: r.name,
          duration: r.duration,
          pricing_model: r.pricingModel,
          deliverable: d.name,
          format: d.format,
          layer: d.layer,
        }))
      ),
      'dg-service-offering-deliverables'
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Offering"
        subtitle="The formal offering document. Four rungs, each independently sellable, each qualifying the client for the next. Scope, activities, deliverables, exit criteria, commercial model and known risks per rung."
        actions={<ExportButton onClick={exportDeliverables} label="Export deliverables (CSV)" />}
      />

      <Tabs
        tabs={LADDER.map((r) => ({ id: r.id, label: `${r.rung}. ${r.name}` }))}
        active={activeId}
        onChange={setActiveId}
      />

      {/* Rung header */}
      <Card className="p-5 border-l-4 border-l-rose-500">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 text-sm font-bold flex items-center justify-center">
            {rung.rung}
          </span>
          <h2 className="text-xl font-bold text-slate-900">{rung.name}</h2>
          <span className="text-sm text-slate-500">{rung.duration}</span>
          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{rung.pricingModel}</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">{rung.purpose}</p>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Buyer signal</p>
          <p className="text-sm text-amber-900 leading-relaxed">{rung.buyerSignal}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionTitle>Scope</SectionTitle>
          <Bullets items={rung.scope} />
        </Card>
        <Card className="p-5">
          <SectionTitle>Activities</SectionTitle>
          <Bullets items={rung.activities} />
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle hint={`${deliverables.length} of ${rung.deliverables.length} deliverables shown under the current layer filter.`}>
          Deliverables
        </SectionTitle>
        <TableWrap>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">Deliverable</th>
                <th className="py-2 pr-4 font-medium">Format</th>
                <th className="py-2 font-medium">Layer</th>
              </tr>
            </thead>
            <tbody>
              {deliverables.map((d) => (
                <tr key={d.name} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-4 text-slate-700 leading-snug">{d.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{d.format}</td>
                  <td className="py-2.5"><LayerBadge layer={d.layer} /></td>
                </tr>
              ))}
              {deliverables.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-sm text-slate-400">No deliverables in the selected layer.</td></tr>
              )}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionTitle hint="The rung is not complete until every one of these is true.">Exit criteria</SectionTitle>
          <Bullets items={rung.exitCriteria} dot="bg-emerald-500" />
          <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">
            <span className="font-medium text-slate-700">Qualifies for:</span> {rung.qualifiesFor}
          </p>
        </Card>
        <Card className="p-5">
          <SectionTitle>Commercial model</SectionTitle>
          <Bullets items={rung.commercialNotes} dot="bg-rose-400" />
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Known risks</p>
            <Bullets items={rung.risks} dot="bg-amber-500" />
          </div>
        </Card>
      </div>

      {/* Tooling tiers */}
      <div>
        <SectionTitle hint="Standardised so delivery is repeatable. The open-source stack is the default; commercial is offered where a vendor logo or an existing licence makes it the easier sell.">
          Tooling tiers
        </SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {POS.toolingTiers.map((tier) => (
            <Card key={tier.tier} className="p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{tier.tier}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{tier.posture}</p>
              <div className="space-y-3">
                {tier.components.map((c) => (
                  <div key={c.capability} className="border-l-2 border-slate-200 pl-3">
                    <p className="text-sm font-medium text-slate-700">{c.capability}</p>
                    <p className="text-sm text-rose-600">{c.product}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.note}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
