import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, ArrowRight, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import catalog from '../data/instrumentCatalog.json'
import indexMeta from '../data/index.json'

const CAT_COLORS: Record<string, string> = {
  indigo: '#6366f1', blue: '#3b82f6', teal: '#14b8a6', violet: '#8b5cf6', amber: '#f59e0b',
}
const CAT_BG: Record<string, string> = {
  indigo: 'bg-indigo-50 border-indigo-200', blue: 'bg-blue-50 border-blue-200',
  teal: 'bg-teal-50 border-teal-200', violet: 'bg-violet-50 border-violet-200', amber: 'bg-amber-50 border-amber-200',
}

export default function DataCoverage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState<string | null>(catalog.categories[0].name)

  const totalEntities = catalog.categories.reduce((a, c) => a + c.entities.length, 0)
  const attrData = catalog.attributeGroups.map(g => ({ group: g.group, count: g.count }))
  const attrTotal = catalog.attributeGroups.reduce((a, g) => a + g.count, 0)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-700 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Database size={24} />
          <h1 className="text-2xl font-bold">Instrument Feed: Source → PDM → FSDM</h1>
        </div>
        <p className="text-slate-200">{indexMeta.sourceMapping} — {totalEntities} PDM entities and ~{attrTotal} standardized attributes mapped from {indexMeta.sourceSystems.join(' and ')} into the FIS ALM engine and Teradata FSDM.</p>
      </div>

      {/* Attribute groups */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Layers size={18} className="text-indigo-500" /> Standardized Attribute Groups
        </h2>
        <p className="text-sm text-slate-500 mb-4">The ~{attrTotal} instrument attributes populated per position, by functional group</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={attrData} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="group" tick={{ fontSize: 11 }} width={170} />
            <Tooltip formatter={(v: number | undefined) => `${v ?? 0} attributes`} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {attrData.map((_, i) => <Cell key={i} fill={Object.values(CAT_COLORS)[i % 5]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Instrument catalog accordion */}
      <div className="space-y-3">
        {catalog.categories.map(cat => {
          const isOpen = open === cat.name
          return (
            <div key={cat.name} className={`rounded-xl border ${CAT_BG[cat.color] || 'bg-slate-50 border-slate-200'}`}>
              <button onClick={() => setOpen(isOpen ? null : cat.name)} className="w-full flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CAT_COLORS[cat.color] }} />
                  <span className="font-semibold text-slate-800">{cat.name}</span>
                </div>
                <span className="text-xs bg-white/70 text-slate-600 px-2 py-1 rounded">{cat.entities.length} PDM entities</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-2">
                  {cat.entities.map(e => (
                    <div key={e.pdmEntity} className="bg-white rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 text-sm">
                        {/* Source */}
                        <div className="lg:w-56 shrink-0">
                          <div className="text-xs text-slate-400">Source</div>
                          <div className="font-medium text-slate-700">{e.sourceSystem}</div>
                          <div className="text-xs text-slate-500 font-mono">{e.sourceTable}</div>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 shrink-0 hidden lg:block" />
                        {/* PDM */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-400">FIS ALM PDM entity</div>
                          <div className="font-medium text-slate-800 font-mono text-xs">{e.pdmEntity}</div>
                          <div className="text-xs text-indigo-600">{e.instrument} · <span className="text-slate-500 font-mono">{e.filter}</span></div>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 shrink-0 hidden lg:block" />
                        {/* FSDM */}
                        <div className="lg:w-52 shrink-0">
                          <div className="text-xs text-slate-400">FSDM entity</div>
                          <button
                            onClick={() => navigate(`/model?search=${encodeURIComponent(e.fsdmEntity)}`)}
                            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-mono hover:bg-blue-200 transition-colors"
                          >{e.fsdmEntity}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
