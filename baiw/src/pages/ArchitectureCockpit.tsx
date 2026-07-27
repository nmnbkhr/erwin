import { useState, useEffect } from 'react'
import {
  loadCapabilities,
  loadDataRequirements,
  loadDependencies,
  loadLineage,
  loadStarSchema,
  loadGapExtensions,
  loadEnrichment,
  loadBacrQuestions,
} from '../utils/dataLoader'
import {
  buildCoverageData,
  buildTraceabilityRows,
  summarizeCoverage,
  type CapabilityCoverage,
  type TraceabilityRow,
} from '../utils/architectureScoring'
import ExportMenu from '../components/layout/ExportMenu'
import CoverageScorecard from '../components/architecture/CoverageScorecard'
import TraceabilityMatrix from '../components/architecture/TraceabilityMatrix'
import PriorityBoard from '../components/architecture/PriorityBoard'
import LineageGapPanel from '../components/architecture/LineageGapPanel'
import PageSkeleton from '../components/layout/PageSkeleton'
import { downloadCSV, downloadJSON } from '../utils/export'
import type { Capability, DataRequirement, Dependency, LineageEntry, GapModule, StarSchema, EnrichmentData, BacrQuestion } from '../types'

const TABS = [
  { id: 'coverage', label: 'Coverage Scorecard' },
  { id: 'traceability', label: 'Traceability Matrix' },
  { id: 'priority', label: 'Priority Board' },
  { id: 'lineage', label: 'Lineage & Gaps' },
]

export default function ArchitectureCockpit() {
  const [activeTab, setActiveTab] = useState<'coverage' | 'traceability' | 'priority' | 'lineage'>('coverage')
  const [loading, setLoading] = useState(true)
  const [requirements, setRequirements] = useState<DataRequirement[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [lineage, setLineage] = useState<LineageEntry[]>([])
  const [gapModules, setGapModules] = useState<GapModule[]>([])
  const [starSchema, setStarSchema] = useState<StarSchema | null>(null)
  const [questions, setQuestions] = useState<BacrQuestion[]>([])
  const [coverageData, setCoverageData] = useState<CapabilityCoverage[]>([])
  const [traceRows, setTraceRows] = useState<TraceabilityRow[]>([])
  const [summary, setSummary] = useState({ total: 0, strong: 0, partial: 0, weak: 0, critical: 0, avgScore: 0, avgPriority: 0, coveragePct: 0 })

  useEffect(() => {
    Promise.all([
      loadCapabilities(),
      loadDataRequirements(),
      loadDependencies(),
      loadLineage(),
      loadStarSchema(),
      loadGapExtensions(),
      loadEnrichment(),
      loadBacrQuestions(),
    ]).then(([c, r, d, l, s, g, e, q]) => {
      setRequirements(r)
      setDependencies(d)
      setLineage(l)
      setStarSchema(s)
      setGapModules(g)
      setQuestions(q)

      const cov = buildCoverageData(c as Capability[], r, d, e as EnrichmentData)
      setCoverageData(cov)
      setTraceRows(buildTraceabilityRows(c as Capability[], r, d, e as EnrichmentData))
      setSummary(summarizeCoverage(cov))
      setLoading(false)
    })
  }, [])

  const handleExportCSV = () => {
    if (activeTab === 'traceability') {
      downloadCSV(
        traceRows.map((r) => ({
          Theme: r.themeName,
          Group: r.groupName,
          Capability: r.capabilityName,
          DataRequirement: r.reqDescription,
          FSDMSubjectArea: r.fsdmSubjectArea,
          ReqPriority: r.reqPriority,
          Entities: r.entityNames.join('; '),
          Domains: r.domainNames.join('; '),
          DerivedPriority: r.derivedPriority,
          ImplementationPhase: r.implementationPhase,
        })),
        'baiw-architecture-traceability'
      )
    } else if (activeTab === 'priority') {
      downloadCSV(
        coverageData
          .sort((a, b) => b.priorityScore - a.priorityScore)
          .map((c) => ({
            Rank: '',
            Capability: c.capability.name,
            Theme: c.capability.themeName,
            Priority: c.derivedPriority,
            CoverageScore: c.coverageScore,
            MaturityGap: c.maturityGap,
            PriorityScore: c.priorityScore,
            Phase: c.implementationPhase,
            DataReqs: c.reqCount,
            Entities: c.uniqueEntityCount,
            Domains: c.uniqueDomainCount,
          })),
        'baiw-architecture-priority-board'
      )
    } else if (activeTab === 'coverage') {
      downloadCSV(
        coverageData.map((c) => ({
          Capability: c.capability.name,
          Theme: c.capability.themeName,
          Group: c.capability.groupName,
          CoverageScore: c.coverageScore,
          CoverageBand: c.coverageBand,
          DerivedPriority: c.derivedPriority,
          ImplementationPhase: c.implementationPhase,
          DataReqs: c.reqCount,
          Entities: c.uniqueEntityCount,
          Domains: c.uniqueDomainCount,
          MaturityGap: c.maturityGap,
          PriorityScore: c.priorityScore,
        })),
        'baiw-architecture-coverage'
      )
    } else {
      downloadJSON({ summary, coverageData, traceRows, questionsCount: questions.length }, 'baiw-architecture-export')
    }
  }

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Architecture Cockpit</h1>
          <p className="text-sm text-slate-500 mt-1">
            Unified view of BVF capabilities, FSDM entities, BACR maturity, and implementation priorities.
          </p>
        </div>
        <ExportMenu options={[
          { label: `Export ${activeTab} as CSV`, onClick: handleExportCSV },
          { label: 'Export all as JSON', onClick: () => downloadJSON({ summary, coverageData, traceRows, questionsCount: questions.length }, 'baiw-architecture-export') },
        ]} />
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500">Capabilities</div>
          <div className="text-xl font-bold text-slate-800">{summary.total}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500">Data Requirements</div>
          <div className="text-xl font-bold text-slate-800">{requirements.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500">FSDM Mappings</div>
          <div className="text-xl font-bold text-slate-800">{dependencies.length.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500">BACR Questions</div>
          <div className="text-xl font-bold text-slate-800">{questions.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500">Strong Coverage</div>
          <div className="text-xl font-bold text-emerald-600">{summary.strong}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500">High / Critical Priority</div>
          <div className="text-xl font-bold text-red-600">{summary.critical}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500">Avg Coverage</div>
          <div className="text-xl font-bold text-slate-800">{summary.avgScore}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'coverage' && <CoverageScorecard coverageData={coverageData} />}
      {activeTab === 'traceability' && <TraceabilityMatrix rows={traceRows} />}
      {activeTab === 'priority' && <PriorityBoard coverageData={coverageData} />}
      {activeTab === 'lineage' && <LineageGapPanel lineage={lineage} gapModules={gapModules} starSchema={starSchema} />}
    </div>
  )
}
