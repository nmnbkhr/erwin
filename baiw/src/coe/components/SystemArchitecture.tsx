import { useState } from 'react'
import {
  Database, Cpu, Monitor, Shield, ChevronDown, ChevronUp,
  Radio, Server, Brain, BarChart3, Workflow, Layers,
} from 'lucide-react'
import useCases from '../../data/coe/useCases.json'
import architecture from '../../data/coe/systemArchitecture.json'

const layerConfig = [
  { color: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50 border-amber-200', icon: Shield, textColor: 'text-amber-700' },
  { color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Monitor, textColor: 'text-blue-700' },
  { color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 border-violet-200', icon: Brain, textColor: 'text-violet-700' },
  { color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50 border-slate-200', icon: Database, textColor: 'text-slate-700' },
]

const techIcons: Record<string, typeof Database> = {
  'Data Warehouse': Database,
  'Streaming/CDC': Radio,
  'ML Framework': Brain,
  'Optimization Solver': Cpu,
  'Dashboards': Monitor,
  'API Layer': Server,
  'Orchestration': Workflow,
}

const flowSteps = [
  { label: 'Source Systems', desc: '8 data sources', icon: Database },
  { label: 'Kafka / CDC', desc: 'Real-time streaming', icon: Radio },
  { label: 'Data Warehouse', desc: 'Teradata / Snowflake', icon: Server },
  { label: 'Analytics Engine', desc: '10 optimization models', icon: Brain },
  { label: 'Operations', desc: 'Dashboards & consoles', icon: Monitor },
  { label: 'Governance', desc: 'Monitoring & reports', icon: Shield },
]

// UC to component mapping
const ucComponentMap: Record<string, string[]> = {
  'UC-01': ['LSTM Forecasters', 'Stochastic Programming', 'Branch Cash Dashboard', 'Cash Efficiency Scores', 'Core Banking (T24/Flexcube)', 'Branch Vault System'],
  'UC-02': ['RL Agents (DQN)', 'ATM Management Console', 'Cash Efficiency Scores', 'ATM Switch (Euronet/TPS)'],
  'UC-03': ['Network Flow Solver', 'VCG Auction Engine', 'Branch Cash Dashboard', 'CIT Management System'],
  'UC-04': ['Chance-Constrained Programming', 'Treasury Cockpit', 'CRR Compliance Monitor', 'SBP Regulatory Feeds', 'Treasury/Dealing System'],
  'UC-05': ['Stochastic Programming', 'Treasury Cockpit', 'SWIFT/Correspondent Banking'],
  'UC-06': ['Stochastic Programming', 'Treasury Cockpit', 'SWIFT/Correspondent Banking'],
  'UC-07': ['NSGA-II Optimizer', 'Branch Cash Dashboard', 'Cash Efficiency Scores', 'Branch Vault System', 'SBP Regulatory Feeds'],
  'UC-08': ['VRPTW (ALNS)', 'CIT Dispatch System', 'CIT Management System'],
  'UC-09': ['Multi-Armed Bandit', 'ATM Management Console', 'External: Weather/Events'],
  'UC-10': ['ABC Costing Engine', 'Cash P&L Attribution', 'Forecast Accuracy Tracker'],
}

const colorMap: Record<string, string> = {
  emerald: '#10b981', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b',
  cyan: '#06b6d4', teal: '#14b8a6', rose: '#f43f5e', orange: '#f97316',
  pink: '#ec4899', indigo: '#6366f1',
}

export default function SystemArchitecture() {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null)

  // Gather all components across layers
  const allComponents: string[] = []
  architecture.layers.forEach(layer => {
    if ('sources' in layer) {
      (layer.sources as { name: string }[]).forEach(s => allComponents.push(s.name))
    }
    if ('components' in layer) {
      (layer.components as string[]).forEach(c => allComponents.push(c))
    }
  })

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">System Architecture</h1>
        <p className="text-amber-100 text-lg">4-layer architecture powering 10 optimization use cases across Pakistan commercial banking</p>
      </div>

      {/* 4-Layer Architecture */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Architecture Layers</h2>
        <p className="text-sm text-slate-500 mb-6">Click each layer to expand details</p>

        <div className="space-y-3">
          {architecture.layers.slice().reverse().map((layer, revIdx) => {
            const idx = architecture.layers.length - 1 - revIdx
            const config = layerConfig[idx]
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
                        <div className="text-xs text-slate-500">
                          {'sources' in layer
                            ? `${(layer.sources as unknown[]).length} data sources`
                            : `${(layer.components as string[]).length} components`
                          }
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-2 ml-6 mr-2">
                    {'sources' in layer ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(layer.sources as { name: string; feeds: string; frequency: string }[]).map(src => (
                          <div key={src.name} className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="font-medium text-sm text-slate-700 mb-1">{src.name}</div>
                            <div className="text-xs text-slate-500 mb-2">{src.feeds}</div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              src.frequency.includes('Real-time') ? 'bg-green-100 text-green-700' :
                              src.frequency.includes('EOD') ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {src.frequency}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(layer.components as string[]).map(comp => (
                          <span key={comp} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${config.bg}`}>
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Data Flow Diagram */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Data Flow</h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center min-w-[120px] hover:border-amber-300 hover:bg-amber-50 transition-colors">
                <step.icon size={24} className="mx-auto text-amber-600 mb-2" />
                <div className="text-sm font-medium text-slate-700">{step.label}</div>
                <div className="text-xs text-slate-400">{step.desc}</div>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="text-amber-400 text-xl font-bold shrink-0">&rarr;</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Technology Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {architecture.techStack.map(tech => {
            const Icon = techIcons[tech.component] || Cpu
            return (
              <div key={tech.component} className="bg-white rounded-xl border border-amber-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Icon size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{tech.component}</div>
                    <div className="text-xs text-amber-600 font-medium">{tech.tech}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">{tech.rationale}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* UC to Layer Mapping */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Use Case to Component Mapping</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-2 font-medium text-slate-500 sticky left-0 bg-white">UC</th>
              {allComponents.map(c => (
                <th key={c} className="py-2 px-1 font-medium text-slate-400 text-center" style={{ writingMode: 'vertical-lr', maxWidth: 30 }}>
                  <span className="inline-block transform rotate-180">{c.length > 18 ? c.slice(0, 16) + '..' : c}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {useCases.map(uc => (
              <tr key={uc.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-1.5 px-2 font-medium sticky left-0 bg-white">
                  <span className="px-1.5 py-0.5 rounded text-white text-xs font-bold" style={{ backgroundColor: colorMap[uc.color] }}>
                    {uc.id}
                  </span>
                </td>
                {allComponents.map(c => {
                  const mapped = ucComponentMap[uc.id]?.includes(c)
                  return (
                    <td key={c} className="py-1.5 px-1 text-center">
                      {mapped && (
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: colorMap[uc.color] }} />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
