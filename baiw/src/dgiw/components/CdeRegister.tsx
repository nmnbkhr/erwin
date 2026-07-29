import { useState, useMemo } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import { Card, PageHeader, SectionTitle, Stat, ExportButton, TableWrap, SeverityPill, Owner } from './ui'
import { archetypeOf } from '../roles'
import { LayerBadge } from '../LayerContext'
import { useLayer } from '../layer'
import { downloadCSV } from '../../utils/export'
import cdeRegister from '../data/cdeRegister.json'
import dqRules from '../data/dqRules.json'
import type { CriticalDataElement, DqRule } from '../types'

const CDES = cdeRegister as CriticalDataElement[]
const RULES = dqRules as DqRule[]

const ALL = '__all__'

export default function CdeRegister() {
  const { keep } = useLayer()
  const [domain, setDomain] = useState<string>(ALL)
  const [criticality, setCriticality] = useState<string>(ALL)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const inLayer = useMemo(() => keep(CDES), [keep])

  const domains = useMemo(
    () => Array.from(new Set(inLayer.map((c) => c.domain))).sort(),
    [inLayer]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inLayer.filter((c) => {
      if (domain !== ALL && c.domain !== domain) return false
      if (criticality !== ALL && c.criticality !== criticality) return false
      if (!q) return true
      return (
        c.element.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        c.sourceSystem.toLowerCase().includes(q) ||
        c.consumers.some((x) => x.toLowerCase().includes(q))
      )
    })
  }, [inLayer, domain, criticality, query])

  const selectedCde = selected ? CDES.find((c) => c.id === selected) : null
  const selectedRules = selectedCde ? RULES.filter((r) => r.cdeRef === selectedCde.id) : []

  const exportCdes = () =>
    downloadCSV(
      filtered.map((c) => ({
        id: c.id,
        element: c.element,
        domain: c.domain,
        criticality: c.criticality,
        definition: c.definition,
        source_system: c.sourceSystem,
        reference_model_entity: c.fsdmEntity,
        consumers: c.consumers.join('; '),
        owner_role: c.ownerRole,
        owner_archetype: archetypeOf(c.ownerRole),
        dq_dimensions: c.dqDimensions.join('; '),
        layer: c.layer,
      })),
      'dg-cde-register'
    )

  // ── Detail view ──
  if (selectedCde) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to register
        </button>

        <Card className="p-5 border-l-4 border-l-rose-500">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-mono text-slate-400">{selectedCde.id}</span>
            <h1 className="text-xl font-bold text-slate-900">{selectedCde.element}</h1>
            <SeverityPill value={selectedCde.criticality} />
            <LayerBadge layer={selectedCde.layer} />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{selectedCde.definition}</p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Domain</p>
            <p className="text-sm text-slate-700 mt-1">{selectedCde.domain}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Source system</p>
            <p className="text-sm text-slate-700 mt-1">{selectedCde.sourceSystem}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Reference model entity</p>
            <p className="text-sm text-slate-700 mt-1">{selectedCde.fsdmEntity}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Owner role</p>
            <p className="text-sm text-slate-700 mt-1"><Owner name={selectedCde.ownerRole} support={selectedCde.support} /></p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <SectionTitle hint="These consumption points are what made the element critical — the derivation runs backwards from here.">
              Consumers
            </SectionTitle>
            <ul className="space-y-1.5">
              {selectedCde.consumers.map((c) => (
                <li key={c} className="flex gap-2 text-sm text-slate-600 leading-snug">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 shrink-0" />{c}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <SectionTitle>Quality dimensions in scope</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {selectedCde.dqDimensions.map((d) => (
                <span key={d} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{d}</span>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <SectionTitle hint={`${selectedRules.length} pre-written rules bound to this element.`}>
            Bound quality rules
          </SectionTitle>
          <TableWrap>
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Rule</th>
                  <th className="py-2 pr-4 font-medium">Dimension</th>
                  <th className="py-2 pr-4 font-medium">Severity</th>
                  <th className="py-2 font-medium">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {selectedRules.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 align-top">
                    <td className="py-2.5 pr-4">
                      <p className="text-slate-700 leading-snug">{r.name}</p>
                      <code className="text-xs text-slate-500 font-mono">{r.expression}</code>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">{r.dimension}</td>
                    <td className="py-2.5 pr-4"><SeverityPill value={r.severity} /></td>
                    <td className="py-2.5 text-slate-600">{r.threshold}</td>
                  </tr>
                ))}
                {selectedRules.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-sm text-slate-400">No rules bound yet.</td></tr>
                )}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      </div>
    )
  }

  // ── Register view ──
  return (
    <div className="space-y-6">
      <PageHeader
        title="Critical Data Element Register"
        subtitle="Derived backwards from consumption: start at the regulatory return line or board KPI, trace lineage to source, and every element on that path is critical. This produces a finite, defensible list — the opposite of an open-ended nomination exercise. Everything outside it is catalogued but not stewarded."
        actions={<ExportButton onClick={exportCdes} label="Export register (CSV)" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat value={filtered.length} label="Elements in view" tone="rose" />
        <Stat value={filtered.filter((c) => c.criticality === 'CRITICAL').length} label="Rated critical" />
        <Stat value={domains.length} label="Domains covered" />
        <Stat value={RULES.filter((r) => filtered.some((c) => c.id === r.cdeRef)).length} label="Rules bound to these elements" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search element, definition, source system or consumer…"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value={ALL}>All domains</option>
            {domains.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={criticality}
            onChange={(e) => setCriticality(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value={ALL}>All criticalities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
        </div>
      </Card>

      <Card className="p-5">
        <TableWrap>
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">ID</th>
                <th className="py-2 pr-4 font-medium">Element</th>
                <th className="py-2 pr-4 font-medium">Domain</th>
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 pr-4 font-medium">Consumers</th>
                <th className="py-2 pr-4 font-medium">Owner</th>
                <th className="py-2 font-medium">Criticality</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className="border-b border-slate-100 last:border-0 align-top cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5 pr-4 text-xs font-mono text-slate-400">{c.id}</td>
                  <td className="py-2.5 pr-4">
                    <span className="text-slate-700 font-medium leading-snug">{c.element}</span>
                    <span className="ml-1.5 inline-block align-middle"><LayerBadge layer={c.layer} /></span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500">{c.domain}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{c.sourceSystem}</td>
                  <td className="py-2.5 pr-4 text-slate-500 leading-snug">{c.consumers.slice(0, 2).join(', ')}{c.consumers.length > 2 && ` +${c.consumers.length - 2}`}</td>
                  <td className="py-2.5 pr-4"><Owner name={c.ownerRole} support={c.support} /></td>
                  <td className="py-2.5"><SeverityPill value={c.criticality} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-sm text-slate-400">No elements match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </div>
  )
}
