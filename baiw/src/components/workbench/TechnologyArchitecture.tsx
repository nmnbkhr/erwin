import { useState } from 'react'
import { Database, Radio, Server, Brain, Monitor, Shield, ChevronDown, ChevronUp, Cpu, Code, LayoutDashboard, Workflow, GitBranch, type LucideIcon } from 'lucide-react'
import type { TechLayer, TechStackItem, DataFlowStep } from './types'

interface Props {
  data: {
    layers: TechLayer[]
    techStack: TechStackItem[]
    dataFlow?: DataFlowStep[]
  }
}

const LAYER_CONFIG = [
  { color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50 border-slate-200', icon: Database, textColor: 'text-slate-700' },
  { color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Radio, textColor: 'text-blue-700' },
  { color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 border-violet-200', icon: Brain, textColor: 'text-violet-700' },
  { color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: Monitor, textColor: 'text-emerald-700' },
]

const TECH_ICONS: Record<string, LucideIcon> = {
  'Enterprise Data Warehouse': Database,
  'Data Integration': GitBranch,
  'Analytics Engine': Brain,
  'Optimization Solver': Cpu,
  'ML Platform': Brain,
  'Visualization': LayoutDashboard,
  'API Layer': Server,
  'Governance': Shield,
}

const FLOW_ICONS = [Database, Radio, Server, Brain, Monitor, Shield]

const DEFAULT_FLOW: DataFlowStep[] = [
  { label: 'Source Systems', desc: 'Operational feeds' },
  { label: 'CDC / Streaming', desc: 'Real-time ingestion' },
  { label: 'Data Lake', desc: 'Curated landing zone' },
  { label: 'EDW / Star Schema', desc: 'Canonical model' },
  { label: 'Analytics Engine', desc: 'Models & calculations' },
  { label: 'Consumption', desc: 'Dashboards & APIs' },
]

export default function TechnologyArchitecture({ data }: Props) {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null)

  const flow = data.dataFlow && data.dataFlow.length > 0 ? data.dataFlow : DEFAULT_FLOW

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">System Architecture Layers</h2>
        <div className="space-y-3">
          {data.layers.slice().reverse().map((layer, revIdx) => {
            const idx = data.layers.length - 1 - revIdx
            const config = LAYER_CONFIG[idx % LAYER_CONFIG.length]
            const isExpanded = expandedLayer === idx
            const Icon = config.icon

            return (
              <div key={layer.name}>
                <button
                  onClick={() => setExpandedLayer(isExpanded ? null : idx)}
                  className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-md ${config.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                        <Icon size={20} className="text-white" />
                      </div>
                      <div>
                        <div className={`font-semibold ${config.textColor}`}>{layer.name}</div>
                        <div className="text-xs text-slate-500">{layer.components.length} components</div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-2 ml-6 mr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {layer.components.map((comp, i) => {
                        const CompIcon = comp.frequency ? Radio : comp.owner ? Server : comp.purpose ? Brain : Code
                        return (
                          <div key={i} className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <CompIcon size={14} className="text-slate-400" />
                              <span className="font-medium text-sm text-slate-700">{comp.name}</span>
                            </div>
                            {comp.feeds && <div className="text-xs text-slate-500 mb-1">{comp.feeds}</div>}
                            {comp.frequency && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{comp.frequency}</span>}
                            {comp.owner && <div className="text-[10px] text-slate-400 mt-1">Owner: {comp.owner}</div>}
                            {comp.purpose && <div className="text-xs text-slate-500">{comp.purpose}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Workflow size={20} className="text-blue-600" />
          End-to-End Data Flow
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {flow.map((step, i) => {
            const Icon = FLOW_ICONS[i] || Database
            return (
              <div key={step.label} className="flex items-center gap-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center min-w-[120px] hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <Icon size={24} className="mx-auto text-blue-600 mb-2" />
                  <div className="text-sm font-medium text-slate-700">{step.label}</div>
                  <div className="text-xs text-slate-400">{step.desc}</div>
                </div>
                {i < flow.length - 1 && <div className="text-blue-400 text-xl font-bold shrink-0">&rarr;</div>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Technology Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.techStack.map((tech) => {
            const Icon = TECH_ICONS[tech.component] || Cpu
            return (
              <div key={tech.component} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{tech.component}</div>
                    <div className="text-xs text-blue-600 font-medium">{tech.tech}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">{tech.rationale}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
