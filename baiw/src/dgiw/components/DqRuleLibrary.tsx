import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card, PageHeader, SectionTitle, Stat, ExportButton, SeverityPill } from './ui'
import { LayerBadge } from '../LayerContext'
import { useLayer } from '../layer'
import { downloadCSV } from '../../utils/export'
import dqRules from '../data/dqRules.json'
import cdeRegister from '../data/cdeRegister.json'
import type { DqRule, CriticalDataElement } from '../types'

const RULES = dqRules as DqRule[]
const CDES = cdeRegister as CriticalDataElement[]

const ALL = '__all__'

const DIMENSION_COLOURS: Record<string, string> = {
  Completeness: '#e11d48',
  Validity: '#f43f5e',
  Accuracy: '#fb7185',
  Consistency: '#f59e0b',
  Uniqueness: '#10b981',
  Timeliness: '#0ea5e9',
  Integrity: '#8b5cf6',
}

import { useDeliverable } from '../report/useDeliverable'

export default function DqRuleLibrary() {
  const { busy, message, metaFor, run } = useDeliverable()
  const { keep } = useLayer()
  const [family, setFamily] = useState(ALL)
  const [dimension, setDimension] = useState(ALL)
  const [severity, setSeverity] = useState(ALL)
  const [query, setQuery] = useState('')

  const inLayer = useMemo(() => keep(RULES), [keep])

  const families = useMemo(() => Array.from(new Set(inLayer.map((r) => r.family))).sort(), [inLayer])
  const dimensions = useMemo(() => Array.from(new Set(inLayer.map((r) => r.dimension))).sort(), [inLayer])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inLayer.filter((r) => {
      if (family !== ALL && r.family !== family) return false
      if (dimension !== ALL && r.dimension !== dimension) return false
      if (severity !== ALL && r.severity !== severity) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.expression.toLowerCase().includes(q) ||
        r.remediation.toLowerCase().includes(q)
      )
    })
  }, [inLayer, family, dimension, severity, query])

  const byDimension = useMemo(() => {
    const counts = new Map<string, number>()
    filtered.forEach((r) => counts.set(r.dimension, (counts.get(r.dimension) ?? 0) + 1))
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [filtered])

  const cdeName = (id: string) => CDES.find((c) => c.id === id)?.element ?? id

  const generateCsv = () =>
    run('csv', async () => {
      const [{ buildDqRuleSpecRows, DQ_RULE_SPEC_ARTEFACT_ID }, { downloadCsv }, { reportFilename }] =
        await Promise.all([
          import('../report/dqRuleSpec'),
          import('../../report/csv'),
          import('../../report/naming'),
        ])
      const meta = metaFor(DQ_RULE_SPEC_ARTEFACT_ID)
      const { rows, columns } = buildDqRuleSpecRows({ meta })
      const wrote = downloadCsv(rows, columns, reportFilename(meta, 'csv'), meta)
      return wrote ? null : 'No DQ rules are in scope under the current layer, so no file was written.'
    })

  const generatePdf = () =>
    run('pdf', async () => {
      const [{ buildDqRuleSpecPdf, DQ_RULE_SPEC_ARTEFACT_ID }, { saveReport }, { reportFilename }] =
        await Promise.all([
          import('../report/dqRuleSpec'),
          import('../../report/spine'),
          import('../../report/naming'),
        ])
      const meta = metaFor(DQ_RULE_SPEC_ARTEFACT_ID)
      saveReport(buildDqRuleSpecPdf({ meta }), reportFilename(meta, 'pdf'), meta)
      return null
    })

  const exportRules = () =>
    downloadCSV(
      filtered.map((r) => ({
        id: r.id,
        cde_ref: r.cdeRef,
        cde_element: cdeName(r.cdeRef),
        family: r.family,
        dimension: r.dimension,
        rule: r.name,
        expression: r.expression,
        severity: r.severity,
        threshold: r.threshold,
        remediation: r.remediation,
        layer: r.layer,
      })),
      'dg-dq-rule-library'
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Quality Rule Library"
        subtitle="Pre-written executable rules bound to critical data elements. This is the accelerator that lets a first scorecard be published in week eight rather than week sixteen — rule authoring becomes a tailoring exercise, not a blank page."
        actions={
          <>
            <button
              onClick={() => void generateCsv()}
              disabled={busy !== null}
              className="px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy === 'csv' ? 'Generating…' : 'DQ rule spec (CSV)'}
            </button>
            <button
              onClick={() => void generatePdf()}
              disabled={busy !== null}
              className="px-3 py-2 text-sm rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy === 'pdf' ? 'Generating…' : 'Rule set summary (PDF)'}
            </button>
            <ExportButton onClick={exportRules} label="Export view (CSV)" />
          </>
        }
      />


      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.tone === 'error'
              ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
              : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat value={filtered.length} label="Rules in view" tone="rose" />
        <Stat value={filtered.filter((r) => r.severity === 'BLOCKER').length} label="Blocker severity" />
        <Stat value={new Set(filtered.map((r) => r.cdeRef)).size} label="Elements covered" />
        <Stat value={families.length} label="Rule families" />
      </div>

      <Card className="p-5">
        <SectionTitle hint="Completeness and validity dominate any core banking rule set — most defects are missing or malformed values, not subtle arithmetic errors.">
          Coverage by quality dimension
        </SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={byDimension} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Rules" radius={[4, 4, 0, 0]}>
              {byDimension.map((d) => (
                <Cell key={d.name} fill={DIMENSION_COLOURS[d.name] ?? '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rule name, expression or remediation…"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          <select value={family} onChange={(e) => setFamily(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value={ALL}>All families</option>
            {families.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={dimension} onChange={(e) => setDimension(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value={ALL}>All dimensions</option>
            {dimensions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value={ALL}>All severities</option>
            <option value="BLOCKER">Blocker</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className={`p-4 ${r.severity === 'BLOCKER' ? 'border-l-4 border-l-rose-500' : ''}`}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-400">{r.id}</span>
              <h3 className="text-sm font-semibold text-slate-800">{r.name}</h3>
              <SeverityPill value={r.severity} />
              <LayerBadge layer={r.layer} />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 mb-3 overflow-x-auto">
              <code className="text-xs text-slate-700 font-mono whitespace-pre">{r.expression}</code>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Element</p>
                <p className="text-slate-700 mt-0.5 leading-snug">{cdeName(r.cdeRef)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Dimension</p>
                <p className="text-slate-700 mt-0.5">{r.dimension} · {r.family}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Threshold</p>
                <p className="text-slate-700 mt-0.5">{r.threshold}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">On failure</p>
                <p className="text-slate-600 mt-0.5 leading-snug">{r.remediation}</p>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-6 text-center text-sm text-slate-400">No rules match the current filters.</Card>
        )}
      </div>
    </div>
  )
}
