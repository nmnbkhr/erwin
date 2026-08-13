import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronDown, ChevronUp, Database, ExternalLink, Search, Target } from 'lucide-react'
import { Card, PageHeader, Stat } from './ui'
import { INDUSTRY_DOMAIN_DEFINITIONS, INDUSTRY_USE_CASES, industryDomain } from '../../industry/registry'
import { canonicalSelection } from '../../industry/selection'
import { useUseCaseSelection } from '../../industry/selectionState'
import { useEngagement } from '../../engagement/context'
import type { IndustryDomain, IndustrySector } from '../../industry/types'

type SectorFilter = IndustrySector | 'all'
type DomainFilter = IndustryDomain | 'all'

const SECTOR_OPTIONS: { id: SectorFilter; label: string }[] = [
  { id: 'all', label: 'All sectors' },
  { id: 'banking', label: 'Banking' },
  { id: 'trade', label: 'Trade' },
  { id: 'health', label: 'Healthcare' },
]

const sectorStyle: Record<IndustrySector, string> = {
  banking: 'bg-purple-50 text-purple-700 ring-purple-200',
  trade: 'bg-teal-50 text-teal-700 ring-teal-200',
  health: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const definitionSignals = (u: (typeof INDUSTRY_USE_CASES)[number]) => [
  { label: 'Owner', present: Boolean(u.owner) },
  { label: 'Capabilities', present: u.capabilityLabels.length > 0 },
  { label: 'Model/data refs', present: u.modelRefs.length > 0 },
  { label: 'KPI', present: u.kpis.length > 0 },
]

export default function UseCasePortfolio() {
  const [sector, setSector] = useState<SectorFilter>('all')
  const [domain, setDomain] = useState<DomainFilter>('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedOnly, setSelectedOnly] = useState(false)
  const [selected, setSelected] = useUseCaseSelection()
  const { active } = useEngagement()
  const selectedIds = useMemo(() => new Set(selected), [selected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return INDUSTRY_USE_CASES.filter((u) => {
      if (sector !== 'all' && u.sector !== sector) return false
      if (domain !== 'all' && u.domain !== domain) return false
      if (selectedOnly && !selectedIds.has(u.id)) return false
      if (!q) return true
      return [u.id, u.sourceId, u.title, u.objective, u.owner ?? '', ...u.capabilityLabels, ...u.modelRefs.map((r) => r.reference)]
        .some((v) => v.toLowerCase().includes(q))
    })
  }, [sector, domain, query, selectedOnly, selectedIds])

  const counts = useMemo(() => ({
    banking: INDUSTRY_USE_CASES.filter((u) => u.sector === 'banking').length,
    trade: INDUSTRY_USE_CASES.filter((u) => u.sector === 'trade').length,
    health: INDUSTRY_USE_CASES.filter((u) => u.sector === 'health').length,
  }), [])

  const chooseSector = (value: SectorFilter) => {
    setSector(value)
    if (domain !== 'all') {
      const selectedDomain = INDUSTRY_DOMAIN_DEFINITIONS.find((d) => d.id === domain)
      if (value !== 'all' && selectedDomain?.sector !== value) setDomain('all')
    }
  }

  const availableDomains = INDUSTRY_DOMAIN_DEFINITIONS.filter((d) => sector === 'all' || d.sector === sector)

  const toggle = (id: string) => {
    if (!active) return
    setSelected((current) => canonicalSelection(
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    ))
  }

  const selectVisible = () => {
    if (!active) return
    setSelected((current) => canonicalSelection([...current, ...filtered.map((u) => u.id)]))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Industry Use-Case Portfolio"
        subtitle="One factual registry across the suite. BAIW, COE and ALM are three banking domains; TAIW is trade; HAIW is healthcare. This foundation view shows what each source actually declares and makes missing governance mappings visible rather than estimating readiness."
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat value={INDUSTRY_USE_CASES.length} label="Registered use cases" tone="rose" />
        <Stat value={counts.banking} label="Banking — BAIW, COE and ALM" />
        <Stat value={counts.trade} label="Trade — TAIW" />
        <Stat value={counts.health} label="Healthcare — HAIW" />
        <Stat value={INDUSTRY_DOMAIN_DEFINITIONS.length} label="Industry domains" />
      </div>

      <Card className={`p-4 border-l-4 ${active ? 'border-l-rose-500' : 'border-l-slate-300'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">
              {active ? `${selected.length} use case${selected.length === 1 ? '' : 's'} in ${active.orgName || 'this engagement'}'s scope` : 'Choose an engagement to define its use-case scope'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Selection is engagement-specific and does not imply governance readiness or alter the source workbench.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!active || filtered.length === 0}
              onClick={selectVisible}
              className="px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Select visible
            </button>
            <button
              disabled={!active || selected.length === 0}
              onClick={() => setSelected([])}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear scope
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-amber-400">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Reference inventory, not a readiness score</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              CDE, DQ-rule and policy links are not authored yet, so every case correctly reports governance mapping pending.
              HAIW also has a separate eight-case specialist explorer outside its common workbench dataset; it is intentionally
              not merged here until an authored reconciliation decides whether those cases extend or overlap this catalogue.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
          <div className="flex flex-wrap gap-2">
            {SECTOR_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => chooseSector(option.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  sector === option.id
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as DomainFilter)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="all">All domains</option>
            {availableDomains.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>

          <label className="relative xl:ml-auto min-w-0 xl:w-80">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search use cases, owners or data..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400"
            />
          </label>
        </div>
        <label className="inline-flex items-center gap-2 mt-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={selectedOnly}
            onChange={(e) => setSelectedOnly(e.target.checked)}
            className="accent-rose-600"
          />
          Show selected only ({selected.length})
        </label>
        <p className="text-xs text-slate-400 mt-3">Showing {filtered.length} of {INDUSTRY_USE_CASES.length} registered use cases.</p>
      </Card>

      <div className="space-y-3">
        {filtered.map((u) => {
          const open = expanded === u.id
          const d = industryDomain(u.domain)
          const signals = definitionSignals(u)
          const isSelected = selectedIds.has(u.id)
          const governanceLinks = u.governance.cdeRefs.length + u.governance.dqRuleRefs.length + u.governance.policyRefs.length
          return (
            <Card key={u.id} className={`overflow-hidden ${isSelected ? 'ring-1 ring-rose-300' : ''}`}>
              <div className="flex items-stretch">
                <button
                  onClick={() => setExpanded(open ? null : u.id)}
                  className="flex-1 min-w-0 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs text-slate-400">{u.id}</span>
                      <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ring-1 ${sectorStyle[u.sector]}`}>
                        {u.sector}
                      </span>
                      <span className="text-xs text-slate-500">{d.label}</span>
                    </div>
                    <h2 className="text-sm font-semibold text-slate-800">{u.title}</h2>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{u.objective}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {signals.map((s) => (
                      <span key={s.label} className={`text-[11px] px-2 py-1 rounded-full ${s.present ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {s.label} {s.present ? 'declared' : 'missing'}
                      </span>
                    ))}
                    <span className={`text-[11px] px-2 py-1 rounded-full ${governanceLinks ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {governanceLinks ? `${governanceLinks} governance links` : 'Governance mapping pending'}
                    </span>
                    {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </div>
                </button>
                <div className="flex items-center px-4 border-l border-slate-100 bg-white">
                  <button
                    disabled={!active}
                    onClick={() => toggle(u.id)}
                    aria-pressed={isSelected}
                    title={active ? (isSelected ? 'Remove from engagement scope' : 'Add to engagement scope') : 'Choose an engagement first'}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected ? 'bg-rose-600 text-white hover:bg-rose-700' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>

              {open && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/60 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">Accountability</p>
                      <p className="text-sm text-slate-700">{u.owner ?? 'Not declared by the source use case'}</p>
                      <p className="text-xs text-slate-400 mt-1">Phase {u.phase ?? 'not declared'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">Capabilities</p>
                      <p className="text-sm text-slate-700">{u.capabilityLabels.length ? u.capabilityLabels.join(' · ') : 'No capability relationship declared'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">KPI</p>
                      <p className="text-sm text-slate-700">{u.kpis.length ? u.kpis.join(' · ') : 'No KPI declared by the source use case'}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2">
                        <Database size={14} /> Model and data references
                      </p>
                      {u.modelRefs.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {u.modelRefs.map((r) => (
                            <span key={`${r.vocabulary}:${r.reference}`} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
                              {r.vocabulary} · {r.reference}
                            </span>
                          ))}
                        </div>
                      ) : <p className="text-sm text-slate-500">No model relationship declared. The source does declare {u.inputs.length} inputs and {u.outputs.length} outputs.</p>}
                    </div>

                    <div className="bg-white border border-amber-200 rounded-lg p-3">
                      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide font-semibold text-amber-700 mb-2">
                        <Target size={14} /> Governance obligations
                      </p>
                      <p className="text-sm text-slate-600">
                        {u.governance.cdeRefs.length} CDEs · {u.governance.dqRuleRefs.length} DQ rules · {u.governance.policyRefs.length} policies
                      </p>
                      <p className="text-xs text-amber-700 mt-1">Pending authored mapping. No readiness decision is made from missing relationships.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-slate-400">Source: {u.sourceDataset} · source id {u.sourceId}</p>
                    <Link to={u.sourceRoute} className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700">
                      Open source workbench <ExternalLink size={15} />
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400">No use cases match the selected filters.</Card>
        )}
      </div>
    </div>
  )
}
