import { useState } from 'react'
import { AlertTriangle, Lock, Unlock } from 'lucide-react'
import { Card, PageHeader, SectionTitle, Tabs, ExportButton, TableWrap } from './ui'
import { LayerBadge } from '../LayerContext'
import { useLayer } from '../layer'
import { downloadCSV } from '../../utils/export'
import operatingModel from '../data/operatingModel.json'
import type { OperatingModelData } from '../types'

const OM = operatingModel as OperatingModelData

type Tab = 'principles' | 'roles' | 'raci' | 'council' | 'gates'

const TABS: { id: Tab; label: string }[] = [
  { id: 'principles', label: 'Principles' },
  { id: 'roles', label: 'Roles' },
  { id: 'raci', label: 'RACI' },
  { id: 'council', label: 'Council' },
  { id: 'gates', label: 'Gates' },
]

const RACI_STYLE = (v: string) => {
  if (v.startsWith('A/R')) return 'bg-rose-100 text-rose-800'
  if (v.startsWith('A')) return 'bg-rose-50 text-rose-700'
  if (v.startsWith('R')) return 'bg-sky-50 text-sky-700'
  if (v.startsWith('C')) return 'bg-amber-50 text-amber-700'
  return 'bg-slate-50 text-slate-500'
}

export default function OperatingModel() {
  const { keep } = useLayer()
  const [tab, setTab] = useState<Tab>('principles')
  const roles = keep(OM.roles)

  const exportRaci = () =>
    downloadCSV(
      OM.raci.map((r) => ({
        activity: r.activity,
        data_owner: r.dataOwner,
        data_steward: r.dataSteward,
        data_custodian: r.dataCustodian,
        dg_council: r.dgCouncil,
        dg_office: r.dgOffice,
      })),
      'dg-raci-matrix'
    )

  const exportRoles = () =>
    downloadCSV(
      roles.map((r) => ({
        role: r.role,
        sits_in: r.sitsIn,
        time_allocation: r.timeAllocation,
        layer: r.layer,
        accountable_for: r.accountableFor.join('; '),
        failure_mode: r.failureMode,
      })),
      'dg-operating-model-roles'
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Target Operating Model"
        subtitle="Who decides what, who does the work, and what blocks the programme from proceeding. Accountability sits with the business; technology is custodian. The failure point is almost always steward time allocation — so it is a contractual gate, not an aspiration."
        actions={
          tab === 'raci' ? <ExportButton onClick={exportRaci} label="Export RACI (CSV)" />
            : tab === 'roles' ? <ExportButton onClick={exportRoles} label="Export roles (CSV)" />
              : undefined
        }
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'principles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {OM.principles.map((p, i) => (
            <Card key={p.title} className="p-5">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{p.title}</h3>
                  <p className="text-sm text-slate-700 leading-relaxed mt-1.5">{p.statement}</p>
                  <p className="text-sm text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-100">
                    <span className="font-medium text-slate-600">Why: </span>{p.rationale}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-4">
          {roles.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-800">{r.role}</h3>
                <LayerBadge layer={r.layer} />
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">{r.sitsIn}</span>
              </div>
              <p className="text-xs text-rose-600 font-medium mb-3">Time: {r.timeAllocation}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Accountable for</p>
                  <ul className="space-y-1.5">
                    {r.accountableFor.map((a) => (
                      <li key={a} className="flex gap-2 text-sm text-slate-600 leading-snug">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={13} className="text-amber-700" />
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">How this role fails</p>
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed">{r.failureMode}</p>
                </div>
              </div>
            </Card>
          ))}
          {roles.length === 0 && <p className="text-sm text-slate-400">No roles in the selected layer.</p>}
        </div>
      )}

      {tab === 'raci' && (
        <Card className="p-5">
          <SectionTitle hint="A = accountable (one per activity), R = responsible, C = consulted, I = informed.">
            Decision and delivery RACI
          </SectionTitle>
          <TableWrap>
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Activity</th>
                  <th className="py-2 px-2 font-medium">Data Owner</th>
                  <th className="py-2 px-2 font-medium">Steward</th>
                  <th className="py-2 px-2 font-medium">Custodian</th>
                  <th className="py-2 px-2 font-medium">Council</th>
                  <th className="py-2 px-2 font-medium">DG Office</th>
                </tr>
              </thead>
              <tbody>
                {OM.raci.map((row) => (
                  <tr key={row.activity} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4 text-slate-700 leading-snug">{row.activity}</td>
                    {[row.dataOwner, row.dataSteward, row.dataCustodian, row.dgCouncil, row.dgOffice].map((v, i) => (
                      <td key={i} className="py-2.5 px-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${RACI_STYLE(v)}`}>{v}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      {tab === 'council' && (
        <div className="space-y-6">
          <Card className="p-5 border-l-4 border-l-rose-500">
            <SectionTitle>Charter purpose</SectionTitle>
            <p className="text-sm text-slate-700 leading-relaxed">{OM.council.charterPurpose}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div><p className="text-xs text-slate-500 uppercase tracking-wide">Chair</p><p className="text-sm text-slate-700 mt-1">{OM.council.chair}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wide">Cadence</p><p className="text-sm text-slate-700 mt-1">{OM.council.cadence}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wide">Quorum</p><p className="text-sm text-slate-700 mt-1">{OM.council.quorum}</p></div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <SectionTitle>Membership</SectionTitle>
              <ul className="space-y-1.5">
                {OM.council.members.map((m) => (
                  <li key={m} className="flex gap-2 text-sm text-slate-600 leading-snug">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />{m}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <SectionTitle hint="Without these, the council is a status meeting rather than a decision forum.">
                Decision rights
              </SectionTitle>
              <ul className="space-y-1.5">
                {OM.council.decisionRights.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-slate-600 leading-snug">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 shrink-0" />{d}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-5">
            <SectionTitle>Escalation path</SectionTitle>
            <ol className="space-y-2">
              {OM.council.escalationPath.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}

      {tab === 'gates' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
            Blocking gates stop the programme until they pass. This is the mechanism that prevents the two most
            common failure modes — starting implementation without allocated stewards, and buying a tool before
            decision rights exist.
          </p>
          {OM.gates.map((g) => (
            <Card key={g.id} className={`p-4 ${g.blocking ? 'border-l-4 border-l-rose-500' : ''}`}>
              <div className="flex items-start gap-3">
                {g.blocking
                  ? <Lock size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  : <Unlock size={16} className="text-slate-400 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{g.id}</span>
                    <h3 className="text-sm font-semibold text-slate-800">{g.name}</h3>
                    <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 ${g.blocking ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
                      {g.blocking ? 'Blocking' : 'Advisory'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1.5">{g.test}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
